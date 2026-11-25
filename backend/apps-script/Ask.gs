/**
 * SITE SAATHI API · Ask.gs
 * action=ask (no login; workers have no accounts) - ASK-7 free backup when MIT's free ChatBot limit is used up.
 *   q (question, max 300 characters), lang (mr / hi / en), kind (ask | why)
 * Calls the Gemini API FREE TIER with a key kept only in Script Properties (GEMINI_API_KEY; billing never enabled).
 * Optional GEMINI_MODEL (default below). The persona text comes from the strings tab (ai_persona), so the
 * content team can improve it without a new APK. Only the question text is sent: no names, numbers or photos (AIR-3).
 * Rate limits protect the free quota: AI_PER_MINUTE (default 10) and AI_PER_DAY (default 300) for the whole app.
 */

const GEMINI_DEFAULT_MODEL = 'gemini-2.0-flash';   // change with Script Property GEMINI_MODEL if Google renames free models

function ask_(p) {
  const key = getProp_('GEMINI_API_KEY', false);
  if (!key) throw new Error('AI backup is not set up.');
  const q = String(p.q || '').trim();
  const lang = LANGS.indexOf(p.lang) >= 0 ? p.lang : 'en';
  if (!q) throw new Error('Empty question.');
  const max = p.kind === 'why' ? 700 : 300;   // "Why?" sends the quiz question + both answers (EXP-1)
  if (q.length > max) throw new Error('Question too long (max ' + max + ' characters).');
  rateLimit_();
  const strings = readTable_('strings');
  const s = function (k) { const r = strings.filter(function (x) { return x.key === k; })[0]; return r ? String(r[lang] || r.en || '') : ''; };
  const langName = s('ai_lang_name') || 'English';
  const lessons = readTable_('pub_lessons').filter(function (r) { return r.lang === 'en'; }).map(function (r) { return r.id + ' ' + r.title; }).join('; ');
  const persona = s('ai_persona').replace('{lang}', langName).replace('{lessons}', lessons || 'none');
  const body = {
    system_instruction: { parts: [{ text: persona }] },
    contents: [{ role: 'user', parts: [{ text: q }] }],
    generationConfig: { maxOutputTokens: 300, temperature: 0.3 },   // short answers keep the free limit (ASK-8)
  };
  const model = getProp_('GEMINI_MODEL', false) || GEMINI_DEFAULT_MODEL;
  const resp = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent', {
    method: 'post', contentType: 'application/json', headers: { 'x-goog-api-key': key }, payload: JSON.stringify(body), muteHttpExceptions: true,
  });
  let out;
  try { out = JSON.parse(resp.getContentText()); } catch (e) { throw new Error('AI did not answer. Try later.'); }
  if (resp.getResponseCode() === 429) throw new Error('AI free limit reached. Try later.');
  if (resp.getResponseCode() !== 200) throw new Error('AI error ' + resp.getResponseCode() + '.');
  const parts = (((out.candidates || [])[0] || {}).content || {}).parts || [];
  const answer = parts.map(function (x) { return x.text || ''; }).join('').trim();
  if (!answer) throw new Error('AI gave no answer. Try again.');
  return { answer: answer, provider: 'gemini' };
}

/** Whole-app limits so one phone (or someone else) cannot use up the free quota. */
function rateLimit_() {
  const cache = CacheService.getScriptCache();
  const perMin = Number(getProp_('AI_PER_MINUTE', false) || 10), perDay = Number(getProp_('AI_PER_DAY', false) || 300);
  const minuteKey = 'ai_m_' + Math.floor(now_() / 60000), dayKey = 'ai_d_' + Utilities.formatDate(new Date(now_()), 'Asia/Kolkata', 'yyyy-MM-dd');
  const m = Number(cache.get(minuteKey) || 0), d = Number(cache.get(dayKey) || 0);
  if (m >= perMin) throw new Error('Many questions right now. Try again in a minute.');
  if (d >= perDay) throw new Error('AI daily free limit reached. Try tomorrow.');
  cache.put(minuteKey, String(m + 1), 120);
  cache.put(dayKey, String(d + 1), 21600);
}
