/**
 * SITE SAATHI API · Keys.gs
 * Set up the server from the app, so nobody has to type in Script Properties:
 *   1. PEPPER and TOKEN_SECRET are made automatically (long random text) the first time they are needed.
 *   2. First Admin: while the team is empty, the app shows "First setup". The server writes a 6-digit code into
 *      the sheet tab "setup" — only people with access to the Google Sheet can read it. firstSetup checks the code.
 *   3. Server keys (Admin only): Cloudinary and Gemini keys are tested with Cloudinary / Google, then saved in
 *      Script Properties. They are NEVER sent back to the phone: the app only sees "set" / "not set".
 * Secrets stay in Script Properties only (CLAUDE.md §4). Free services only, billing never enabled.
 */

/** A required secret: read it, or make a long random one the first time (PEPPER, TOKEN_SECRET). */
function secret_(name) {
  const v = getProp_(name, false);
  if (v) return v;
  const made = Utilities.getUuid() + '-' + Utilities.getUuid();   // 73 random characters
  PropertiesService.getScriptProperties().setProperty(name, made);
  return made;
}

// ---------------- first Admin ----------------

/** The one-time setup code: made once, shown in the sheet tab "setup". */
function setupCode_() {
  let code = getProp_('SETUP_CODE', false);
  if (!code) {
    code = String(100000 + parseInt(Utilities.getUuid().replace(/-/g, '').slice(0, 10), 16) % 900000);
    PropertiesService.getScriptProperties().setProperty('SETUP_CODE', code);
    writeSetupTab_(code, 'Type this code in the app: Admin Mode → First setup');
  }
  return code;
}

function writeSetupTab_(value, item) {
  const ss = spreadsheet_();
  if (!ss.getSheetByName('setup')) ss.insertSheet('setup');   // made on demand (older sheets do not have this tab)
  writeTable_('setup', [{ item: item, value: value, made_on: today_() }]);
}

/** action=setupStatus (no login): does the server still need its first Admin? Makes sure the code is in the sheet. */
function setupStatus_() {
  const needs = readTable_('team').length === 0;
  if (needs) { secret_('PEPPER'); secret_('TOKEN_SECRET'); setupCode_(); }
  return { needsSetup: needs };
}

/** action=firstSetup (no login): code, name, email, password -> first Admin + logged in. Only while the team is empty. */
function firstSetup_(p) {
  if (readTable_('team').length) throw new Error('Setup is already done. Please log in.');
  secret_('PEPPER'); secret_('TOKEN_SECRET');
  const props = PropertiesService.getScriptProperties();
  const code = setupCode_();
  if (String(p.code || '').trim() !== code) {
    const n = Number(getProp_('SETUP_TRIES', false) || 0) + 1;
    if (n >= MAX_TRIES) {   // 5 wrong codes -> a new code in the sheet (guessing is useless)
      props.deleteProperty('SETUP_CODE'); props.deleteProperty('SETUP_TRIES'); setupCode_();
      throw new Error('Wrong setup code 5 times. A NEW code is now in the Google Sheet, tab "setup".');
    }
    props.setProperty('SETUP_TRIES', String(n));
    throw new Error('Wrong setup code. Open the Google Sheet, tab "setup". ' + (MAX_TRIES - n) + ' tries left.');
  }
  const name = String(p.name || '').trim();
  if (!name) throw new Error('Enter your name.');
  const made = addMember_({ email: p.email, name: name, role: 'Admin', qualification: '', password: p.password });   // checks email + 8 characters
  props.deleteProperty('SETUP_CODE'); props.deleteProperty('SETUP_TRIES');
  writeSetupTab_('done', 'First setup finished. The code is deleted. Add team members from Admin Mode.');
  return { token: makeToken_(made.email, 'Admin'), role: 'Admin', name: name, hours: SESSION_HOURS };
}

// ---------------- server keys (Admin only) ----------------

const CLOUD_KEYS_ = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];

/** Which keys are set. Never returns a key itself. */
function keyStatus_() {
  const has = function (k) { return !!getProp_(k, false); };
  return {
    cloudinary: CLOUD_KEYS_.every(has) ? 'set' : 'not set',
    gemini: has('GEMINI_API_KEY') ? 'set' : 'not set',
    keys_updated: getProp_('KEYS_UPDATED', false) || '—',
  };
}

/** action=getKeys (Admin): status only. */
function getKeys_() { return keyStatus_(); }

/** action=saveKeys (Admin): cloud_name, cloud_key, cloud_secret and/or gemini_key. Each group is tested before saving. */
function saveKeys_(p, u) {
  const tr = function (k) { return String(p[k] || '').trim(); };
  const cn = tr('cloud_name'), ck = tr('cloud_key'), cs = tr('cloud_secret'), gk = tr('gemini_key');
  const props = PropertiesService.getScriptProperties();
  const saved = [];
  if (cn || ck || cs) {
    if (!(cn && ck && cs)) throw new Error('Cloudinary needs all 3: cloud name, API key and API secret.');
    if (!/^[A-Za-z0-9_-]+$/.test(cn)) throw new Error('Cloudinary cloud name: only letters, numbers, - and _.');
    testCloudinary_(cn, ck, cs);
    props.setProperty('CLOUDINARY_CLOUD_NAME', cn); props.setProperty('CLOUDINARY_API_KEY', ck); props.setProperty('CLOUDINARY_API_SECRET', cs);
    saved.push('Cloudinary');
  }
  if (gk) { testGemini_(gk); props.setProperty('GEMINI_API_KEY', gk); saved.push('Gemini'); }
  if (!saved.length) throw new Error('Type the keys you want to save.');
  props.setProperty('KEYS_UPDATED', u.name + ' · ' + today_());
  const out = keyStatus_();
  out.saved = saved.join(' + ');
  return out;
}

/** Asks Cloudinary if the keys are right (free Admin API "usage"). Throws a clear message if not. */
function testCloudinary_(cloud, key, secret) {
  let code;
  try {
    code = UrlFetchApp.fetch('https://api.cloudinary.com/v1_1/' + encodeURIComponent(cloud) + '/usage',
      { method: 'get', headers: { Authorization: 'Basic ' + Utilities.base64Encode(key + ':' + secret) }, muteHttpExceptions: true }).getResponseCode();
  } catch (err) { throw new Error('Could not reach Cloudinary. Check the internet and try again.'); }
  if (code === 200) return;
  if (code === 401 || code === 403) throw new Error('Cloudinary did not accept these keys. Copy them again from the Cloudinary Dashboard.');
  if (code === 404) throw new Error('Cloudinary cloud name not found. Check the cloud name.');
  throw new Error('Could not check Cloudinary right now (code ' + code + '). Try again later.');
}

/** Asks Google if the Gemini key works (lists models; free, no billing). Throws a clear message if not. */
function testGemini_(key) {
  let code;
  try {
    code = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models',
      { method: 'get', headers: { 'x-goog-api-key': key }, muteHttpExceptions: true }).getResponseCode();
  } catch (err) { throw new Error('Could not reach Google. Check the internet and try again.'); }
  if (code === 200) return;
  if (code === 400 || code === 401 || code === 403) throw new Error('Google did not accept this Gemini key. Make a new free key in Google AI Studio.');
  throw new Error('Could not check the Gemini key right now (code ' + code + '). Try again later.');
}
