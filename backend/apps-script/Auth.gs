/**
 * SITE SAATHI API · Auth.gs
 * Login with hashed passwords, 12-hour signed session tokens, 5-try lockout (ADM-1, ADM-2), team members.
 * Passwords are stored only as "salt$sha256(PEPPER:salt:password)". Tokens are signed with TOKEN_SECRET.
 */

function hex_(bytes) { return bytes.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join(''); }

function hashPassword_(password, salt) {
  const pepper = getProp_('PEPPER', true);
  return hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, pepper + ':' + salt + ':' + password, Utilities.Charset.UTF_8));
}
function makeHash_(password) { const salt = Utilities.getUuid(); return salt + '$' + hashPassword_(password, salt); }
function checkHash_(password, stored) {
  const parts = String(stored || '').split('$');
  return parts.length === 2 && hashPassword_(password, parts[0]) === parts[1];
}

function sign_(payload) {
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(payload, getProp_('TOKEN_SECRET', true)));
}
function makeToken_(email, role) {
  const payload = JSON.stringify({ e: email, r: role, x: now_() + SESSION_HOURS * 3600 * 1000 });
  return Utilities.base64EncodeWebSafe(payload) + '.' + sign_(payload);
}

/** Checks the token and that the member is still active with the same role. Returns {email, name, role, qualification}. */
function verifyToken_(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 2) throw new Error('Please log in.');
  const payload = Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString();
  if (sign_(payload) !== parts[1]) throw new Error('Please log in again.');
  const t = JSON.parse(payload);
  if (now_() > t.x) throw new Error('Session ended after 12 hours. Please log in again.');
  const m = findRow_('team', function (r) { return same_(r.email, t.e); });
  if (!m || String(m.active).toUpperCase() !== 'TRUE') throw new Error('This account is not active.');
  if (m.role !== t.r) throw new Error('Your role changed. Please log in again.');
  return { email: m.email, name: m.name, role: m.role, qualification: m.qualification };
}

/** Router helper: valid token + one of the allowed roles (null = any role). */
function requireUser_(p, roles) {
  const u = verifyToken_(p.token);
  if (roles && roles.indexOf(u.role) < 0) throw new Error('Your role (' + u.role + ') cannot do this.');
  return u;
}

/** action=login (email, password) -> token, role, name. Five wrong tries lock that email for 10 minutes. */
function login_(p) {
  const email = String(p.email || '').trim().toLowerCase();
  const cache = CacheService.getScriptCache();
  if (!email || !p.password) throw new Error('Enter email and password.');
  if (cache.get('lock_' + email)) throw new Error('Too many wrong tries. Wait ' + LOCK_MINUTES + ' minutes.');
  const m = findRow_('team', function (r) { return same_(String(r.email).toLowerCase(), email); });
  const ok = m && String(m.active).toUpperCase() === 'TRUE' && checkHash_(String(p.password), m.password_hash);
  if (!ok) {
    const n = Number(cache.get('fail_' + email) || 0) + 1;
    if (n >= MAX_TRIES) { cache.put('lock_' + email, '1', LOCK_MINUTES * 60); cache.remove('fail_' + email); throw new Error('Too many wrong tries. Wait ' + LOCK_MINUTES + ' minutes.'); }
    cache.put('fail_' + email, String(n), LOCK_MINUTES * 60);
    throw new Error('Wrong email or password. ' + (MAX_TRIES - n) + ' tries left.');
  }
  cache.remove('fail_' + email);
  return { token: makeToken_(m.email, m.role), role: m.role, name: m.name, hours: SESSION_HOURS };
}

/** action=addMember (Admin): email, name, role, qualification, password (first password, min 8). */
function addMember_(p) {
  const email = String(p.email || '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('Enter a valid email.');
  if (ROLES.indexOf(p.role) < 0) throw new Error('Role must be Admin, Reviewer or Writer.');
  if (String(p.password || '').length < 8) throw new Error('First password must have at least 8 characters.');
  upsert_('team', ['email'], { email: email, name: String(p.name || '').trim(), role: p.role, qualification: String(p.qualification || '').trim(), password_hash: makeHash_(String(p.password)), active: 'TRUE' });
  return { email: email };
}

/** action=setActive (Admin): email, active ("TRUE"/"FALSE"). */
function setActive_(p, u) {
  const m = findRow_('team', function (r) { return same_(r.email, p.email); });
  if (!m) throw new Error('No member with that email.');
  if (same_(m.email, u.email)) throw new Error('You cannot deactivate yourself.');
  upsert_('team', ['email'], { email: m.email, active: String(p.active).toUpperCase() === 'TRUE' ? 'TRUE' : 'FALSE' });
  return {};
}

/** action=changePassword (any member): old, new (min 8). */
function changePassword_(p, u) {
  const m = findRow_('team', function (r) { return same_(r.email, u.email); });
  if (!checkHash_(String(p.old || ''), m.password_hash)) throw new Error('Old password is wrong.');
  if (String(p.new || '').length < 8) throw new Error('New password must have at least 8 characters.');
  upsert_('team', ['email'], { email: m.email, password_hash: makeHash_(String(p.new)) });
  return {};
}

/** Run ONCE from the editor after setting Script Property ADMIN_SETUP = "email|name|password". */
function setupFirstAdmin() {
  const v = getProp_('ADMIN_SETUP', true).split('|');
  if (v.length !== 3) throw new Error('ADMIN_SETUP must be "email|name|password".');
  if (readTable_('team').length) throw new Error('Team already has members; use addMember from Admin Mode.');
  addMember_({ email: v[0], name: v[1], role: 'Admin', qualification: '', password: v[2] });
  PropertiesService.getScriptProperties().deleteProperty('ADMIN_SETUP');
  Logger.log('Admin created: ' + v[0] + '. ADMIN_SETUP deleted.');
}
