/**
 * SITE SAATHI API · Router.gs
 * One web address for the app (ADM-10: deploy as web app, execute as owner, access "Anyone").
 *   POST form fields: action=..., token=... (+ fields)   -> JSON {ok:true, ...} or {ok:false, error:"..."}
 *   GET  ?action=getPublished                              -> published content for phones (no login)
 * Every change checks the token and the role first (ADM-2). Writes hold a script lock.
 */

const ACTIONS = {
  login:          { fn: login_,          auth: false, write: false },
  ask:            { fn: ask_,            auth: false, write: false },   // Ask Saathi backup (ASK-7); rate-limited
  listLessons:    { fn: listLessons_,    roles: null },
  getLesson:      { fn: getLesson_,      roles: null },
  saveLesson:     { fn: saveLesson_,     roles: ['Writer', 'Admin'], write: true },
  saveStep:       { fn: saveStep_,       roles: ['Writer', 'Admin'], write: true },
  saveQuiz:       { fn: saveQuiz_,       roles: ['Writer', 'Admin'], write: true },
  uploadMedia:    { fn: uploadMedia_,    roles: ['Writer', 'Admin'], write: true },
  submit:         { fn: submit_,         roles: ['Writer', 'Admin'], write: true },
  review:         { fn: review_,         roles: ['Reviewer', 'Admin'], write: true },
  hideLesson:     { fn: hideLesson_,     roles: ['Admin'], write: true },
  publish:        { fn: publish_,        roles: ['Admin'], write: true },
  listStrings:    { fn: listStrings_,    roles: null },
  saveString:     { fn: saveString_,     roles: ['Admin'], write: true },
  listQr:         { fn: listQr_,         roles: null },
  saveQr:         { fn: saveQr_,         roles: ['Admin', 'Writer'], write: true },
  addMember:      { fn: addMember_,      roles: ['Admin'], write: true },
  setActive:      { fn: setActive_,      roles: ['Admin'], write: true },
  changePassword: { fn: changePassword_, roles: null, write: true },
};

function doPost(e) { return json_(handle_((e && e.parameter) || {})); }

function doGet(e) {
  const p = (e && e.parameter) || {};
  if ((p.action || 'getPublished') !== 'getPublished') return json_({ ok: false, error: 'Use POST for ' + p.action + '.' });
  try { const out = getPublished_(); out.ok = true; return json_(out); } catch (err) { return json_({ ok: false, error: String((err && err.message) || err) }); }
}

/** Runs one action and always returns {ok, ...}; never throws to the phone. */
function handle_(p) {
  const a = ACTIONS[p.action];
  if (!a) return { ok: false, error: 'Unknown action "' + p.action + '".' };
  const lock = a.write ? LockService.getScriptLock() : null;
  try {
    if (lock) lock.waitLock(20000);
    let user = null;
    if (a.auth !== false) {
      try { user = requireUser_(p, a.roles); } catch (err) {
        const msg = String((err && err.message) || err);
        return { ok: false, error: msg, relogin: !/cannot do this/.test(msg) };   // app goes back to the login page
      }
    }
    const out = a.fn(p, user) || {};
    out.ok = true;
    return out;
  } catch (err) {
    return { ok: false, error: String((err && err.message) || err) };
  } finally {
    if (lock) lock.releaseLock();
  }
}

function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
