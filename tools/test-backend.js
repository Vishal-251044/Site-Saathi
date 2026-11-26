// SITE SAATHI - runs the real Apps Script backend (backend/apps-script/*.gs) in Node with stand-ins for
// SpreadsheetApp, PropertiesService, CacheService, LockService, Utilities, UrlFetchApp (Cloudinary), DriveApp, ContentService.
// The sheet starts from the real seed (tools/build-admin-sheet.js). Usage: node tools/test-backend.js
// Also exported: makeBackend() -> { post(params), get(params), clock } for the app simulator (Admin Mode).
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const { buildSeed } = require('./build-admin-sheet.js');

function makeBackend(opts = {}) {
  const seed = buildSeed();
  const clock = { t: Date.parse('2026-12-02T09:00:00+05:30') };
  // ---- Spreadsheet stand-in: each tab is a 2-D array ----
  const tabs = {};
  for (const [name, cols] of Object.entries(seed.schema)) tabs[name] = [cols.slice(), ...seed.tables[name].map((r) => cols.map((c) => r[c] ?? ''))];
  const sheetObj = (name) => ({
    getDataRange: () => ({ getValues: () => tabs[name].map((r) => r.slice()) }),
    clearContents: () => { tabs[name] = []; },
    getRange: (r, c, nr, nc) => ({ setValues: (data) => { for (let i = 0; i < nr; i++) { tabs[name][r - 1 + i] = tabs[name][r - 1 + i] || []; for (let j = 0; j < nc; j++) { let v = data[i][j]; if (typeof v === 'string' && v.startsWith("'=")) v = v.slice(1); tabs[name][r - 1 + i][c - 1 + j] = v; } } } }),
    appendRow: (row) => { tabs[name].push(row.slice()); },
    getLastRow: () => tabs[name].length,
    setFrozenRows: () => {},
  });
  const ss = { getSheetByName: (n) => (tabs[n] ? sheetObj(n) : null), insertSheet: (n) => { tabs[n] = []; return sheetObj(n); } };
  const props = Object.assign({ PEPPER: 'test-pepper', TOKEN_SECRET: 'test-secret', CLOUDINARY_CLOUD_NAME: 'demo', CLOUDINARY_API_KEY: 'k123', CLOUDINARY_API_SECRET: 's456', GEMINI_API_KEY: 'g789' }, opts.props || {});
  const cache = {};
  const fetches = [];
  const bytes = (buf) => [...buf].map((b) => (b > 127 ? b - 256 : b));
  const unbytes = (x) => (typeof x === 'string' ? Buffer.from(x, 'utf8') : Buffer.from(x.map((b) => b & 0xff)));
  const ctx = {
    console,
    SpreadsheetApp: { getActiveSpreadsheet: () => ss, openById: () => ss },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => props[k] ?? null, setProperty: (k, v) => { props[k] = v; }, deleteProperty: (k) => { delete props[k]; } }) },
    CacheService: { getScriptCache: () => ({ get: (k) => (cache[k] && cache[k].exp > clock.t ? cache[k].v : null), put: (k, v, s) => { cache[k] = { v: String(v), exp: clock.t + s * 1000 }; }, remove: (k) => { delete cache[k]; } }) },
    LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) },
    Utilities: {
      DigestAlgorithm: { SHA_256: 'sha256', SHA_1: 'sha1' }, Charset: { UTF_8: 'utf8' },
      computeDigest: (alg, s) => bytes(crypto.createHash(alg).update(s, 'utf8').digest()),
      computeHmacSha256Signature: (v, k) => bytes(crypto.createHmac('sha256', k).update(v, 'utf8').digest()),
      base64EncodeWebSafe: (x) => unbytes(x).toString('base64').replace(/\+/g, '-').replace(/\//g, '_'),
      base64DecodeWebSafe: (s) => bytes(Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64')),
      base64Decode: (s) => bytes(Buffer.from(s, 'base64')),
      newBlob: (data, mime, name) => ({ getDataAsString: () => unbytes(data).toString('utf8'), getBytes: () => data, mime, name }),
      getUuid: () => crypto.randomUUID(),
      base64Encode: (s) => Buffer.from(String(s), 'utf8').toString('base64'),
      formatDate: (d) => new Date(d.getTime() + 5.5 * 3600e3).toISOString().slice(0, 16).replace('T', ' '),
    },
    UrlFetchApp: { fetch: (url, o) => {
      fetches.push({ url, payload: o.payload, headers: o.headers });
      // key checks from Admin Mode -> Server keys (Keys.gs). Accepted: the current keys, or test keys starting "good-"
      if (url.includes('api.cloudinary.com') && url.endsWith('/usage')) {
        const [k, s] = Buffer.from(String((o.headers || {}).Authorization || '').replace('Basic ', ''), 'base64').toString('utf8').split(':');
        const cloud = decodeURIComponent(url.split('/v1_1/')[1].split('/')[0]);
        const code = cloud === 'nocloud' ? 404 : (String(s).startsWith('good-') || (k === props.CLOUDINARY_API_KEY && s === props.CLOUDINARY_API_SECRET)) ? 200 : 401;
        return { getResponseCode: () => code, getContentText: () => '{}' };
      }
      if (url.endsWith('/v1beta/models')) {
        const key = String((o.headers || {})['x-goog-api-key'] || '');
        return { getResponseCode: () => (key.startsWith('good-') || key === props.GEMINI_API_KEY ? 200 : 400), getContentText: () => '{}' };
      }
      if (url.includes('generativelanguage.googleapis.com')) {   // Gemini free-tier stand-in
        const body = JSON.parse(o.payload);
        const good = o.headers && o.headers['x-goog-api-key'] === props.GEMINI_API_KEY && !url.includes('key=');
        const sys = body.system_instruction.parts[0].text, q = body.contents[0].parts[0].text;
        const answer = (opts.gemini || ((s, qq) => `Keep it wet for 7 days. Ask your supervisor. [${/Reply only in (\w+)/.exec(s)[1]}] ${qq.length}`))(sys, q);
        return { getResponseCode: () => (good ? (answer === 429 ? 429 : 200) : 403), getContentText: () => JSON.stringify(good && answer !== 429 ? { candidates: [{ content: { parts: [{ text: answer }] } }] } : { error: { message: 'denied' } }) };
      }
      const p = o.payload; const signed = Object.keys(p).filter((k) => !['file', 'api_key', 'signature'].includes(k)).sort().map((k) => `${k}=${p[k]}`).join('&');
      const good = crypto.createHash('sha1').update(signed + props.CLOUDINARY_API_SECRET).digest('hex') === p.signature;
      const type = url.includes('/video/') ? 'video' : 'image', fmt = p.format || (p.file.includes('image/png') ? 'png' : 'jpg');
      const body = good ? { secure_url: `https://res.cloudinary.com/${props.CLOUDINARY_CLOUD_NAME}/${type}/upload/v1/${p.folder}/${p.public_id}.${fmt}` } : { error: { message: 'Invalid Signature' } };
      return { getResponseCode: () => (good ? 200 : 401), getContentText: () => JSON.stringify(body) };
    } },
    DriveApp: (() => { const files = []; const folder = (n) => ({ getFoldersByName: () => ({ hasNext: () => false }), createFolder: (m) => folder(m), getFilesByName: () => ({ hasNext: () => false }),
      createFile: (blob) => { const id = 'drv' + files.length; files.push(blob); return { getId: () => id, setSharing: () => {} }; } });
    return { getFolderById: () => folder('root'), Access: { ANYONE_WITH_LINK: 1 }, Permission: { VIEW: 1 } }; })(),
    ContentService: { createTextOutput: (s) => ({ setMimeType() { return this; }, getContent: () => s }), MimeType: { JSON: 'json' } },
    Logger: { log: () => {} },
  };
  vm.createContext(ctx);
  const dir = path.join(ROOT, 'backend', 'apps-script');
  const code = fs.readdirSync(dir).filter((f) => f.endsWith('.gs')).sort().map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
  vm.runInContext(code + '\n;this.__api = { doPost, doGet, setupSheets, setupFirstAdmin, readTable_ };\nnow_ = function () { return __clock.t; };', Object.assign(ctx, { __clock: clock }));
  const api = ctx.__api;
  const post = (p) => JSON.parse(api.doPost({ parameter: Object.fromEntries(Object.entries(p).map(([k, v]) => [k, String(v)])) }).getContent());
  const get = (p) => JSON.parse(api.doGet({ parameter: p }).getContent());
  return { post, get, clock, api, props, fetches, tabs };
}
module.exports = { makeBackend };

// =====================================================================================
if (require.main === module) {
  let pass = 0, fail = 0;
  const ok = (c, m, d = '') => { if (c) { pass++; console.log('  ok  ' + m); } else { fail++; console.log('  FAIL ' + m + (d ? '  -> ' + d : '')); } };
  const step = (t) => console.log('\n' + t);
  const B = makeBackend({ props: { ADMIN_SETUP: 'vaibhav@example.com|Vaibhav|admin-pass-123' } });
  const { post, get, clock, api } = B;

  step('Setup');
  ok(api.setupSheets().length === 0, 'setupSheets on the seeded sheet: all 16 tabs exist, nothing changed');
  api.setupFirstAdmin();
  ok(api.readTable_('team').length === 1 && !B.props.ADMIN_SETUP, 'first Admin created; ADMIN_SETUP deleted');
  const team = api.readTable_('team')[0];
  ok(/^[0-9a-f-]{36}\$[0-9a-f]{64}$/.test(team.password_hash) && !team.password_hash.includes('admin-pass'), 'password stored only as salt$sha256 hash');

  step('Day 15 · login, lockout, roles');
  let r = post({ action: 'login', email: 'Vaibhav@Example.com ', password: 'wrong' });
  ok(!r.ok && r.error === 'Wrong email or password. 4 tries left.', 'wrong password -> clear message, tries left', r.error);
  for (let i = 0; i < 3; i++) post({ action: 'login', email: 'vaibhav@example.com', password: 'wrong' });
  r = post({ action: 'login', email: 'vaibhav@example.com', password: 'wrong' });
  ok(!r.ok && /Wait 10 minutes/.test(r.error), '5th wrong try locks login (ADM-1)', r.error);
  r = post({ action: 'login', email: 'vaibhav@example.com', password: 'admin-pass-123' });
  ok(!r.ok && /Wait 10 minutes/.test(r.error), 'even the right password is refused while locked');
  clock.t += 10 * 60e3 + 1000;
  const admin = post({ action: 'login', email: 'vaibhav@example.com', password: 'admin-pass-123' });
  ok(admin.ok && admin.role === 'Admin' && admin.token.split('.').length === 2, 'after 10 minutes: login OK, role Admin, signed token');
  const A = admin.token;
  ok(post({ action: 'addMember', token: A, email: 'writer@example.com', name: 'Sneha', role: 'Writer', password: 'writer-pass-1' }).ok, 'Admin adds a Writer');
  ok(post({ action: 'addMember', token: A, email: 'guide@example.com', name: 'Prof. Patil', role: 'Reviewer', qualification: 'M.E. Structures', password: 'review-pass-1' }).ok, 'Admin adds the Reviewer (faculty guide)');
  ok(!post({ action: 'addMember', token: A, email: 'x@example.com', name: 'X', role: 'Boss', password: '12345678' }).ok, 'unknown role refused');
  const W = post({ action: 'login', email: 'writer@example.com', password: 'writer-pass-1' }).token;
  const R = post({ action: 'login', email: 'guide@example.com', password: 'review-pass-1' }).token;
  ok(!post({ action: 'addMember', token: W, email: 'y@example.com', name: 'Y', role: 'Admin', password: '12345678' }).ok, 'Writer cannot add members');
  ok(!post({ action: 'listLessons' }).ok && post({ action: 'listLessons' }).error === 'Please log in.', 'no token -> "Please log in."');
  const fake = A.split('.')[0] + '.AAAA';
  ok(post({ action: 'listLessons', token: fake }).error === 'Please log in again.', 'changed token refused (signature)');

  step('Day 15 · dashboard + lesson list (3 MVP lessons moved into the sheet)');
  r = post({ action: 'listLessons', token: W });
  ok(r.ok && r.lessons.length === 3 && r.lessons.every((l) => l.status === 'In review' && l.missing === 0), 'SS-CON-01, SS-MAS-01, SS-SAF-01 present, In review, complete', JSON.stringify(r.lessons.map((l) => [l.id, l.status, l.missing])));
  ok(r.counts.review === 3 && r.counts.version === 0 && r.modules.length === 6, 'counts: 3 to review, content version 0, 6 modules');
  r = post({ action: 'getLesson', token: W, id: 'SS-MAS-01' });
  ok(r.ok && r.steps.length === 7 && r.texts.mr.materials.split('\n').length === 9 && r.quiz.length === 15, 'getLesson: 7 steps, materials one per line, 15 quiz rows');

  step('Day 15 · create SS-REI-01 with text in 3 languages');
  r = post({ action: 'saveLesson', token: R, module: 'REI' });
  ok(!r.ok && /Reviewer/.test(r.error), 'Reviewer cannot create lessons', r.error);
  r = post({ action: 'saveLesson', token: W, module: 'rei', duration_min: 6 });
  ok(r.ok && r.id === 'SS-REI-01', 'new lesson in Reinforcement gets ID SS-REI-01 automatically (ADM-3)', r.id);
  const ID = r.id;
  const TXT = {
    en: ['Reinforcement – Basic', 'How to cut, bend and tie steel bars as per the drawing.', 'Fix bars at the right place with the right cover.', 'Steel bars\nBinding wire\nCover blocks', 'Wear gloves.\nKeep bar ends covered.', 'Wrong lap length\nNo cover blocks'],
    mr: ['सळई काम – मूलभूत', 'ड्रॉइंगप्रमाणे सळई कापणे, वाकवणे आणि बांधणे.', 'योग्य कव्हरसह सळई योग्य जागी बसवणे.', 'सळई\nबांधणी तार\nकव्हर ब्लॉक', 'हातमोजे घाला.\nसळईची टोके झाका.', 'चुकीची लॅप लांबी\nकव्हर ब्लॉक नाहीत'],
    hi: ['सरिया का काम – बुनियादी', 'ड्रॉइंग के अनुसार सरिया काटना, मोड़ना और बाँधना।', 'सही कवर के साथ सरिया सही जगह लगाना।', 'सरिया\nबाँधने का तार\nकवर ब्लॉक', 'दस्ताने पहनें।\nसरिया के सिरे ढकें।', 'गलत लैप लंबाई\nकवर ब्लॉक नहीं'],
  };
  for (const l of ['mr', 'hi', 'en']) { const [title, description, objective, materials, safety, mistakes] = TXT[l]; r = post({ action: 'saveLesson', token: W, id: ID, lang: l, title, description, objective, materials, safety, mistakes }); }
  ok(r.ok, 'text saved in mr, hi, en');
  const lt = api.readTable_('lesson_text').filter((t) => t.lesson_id === ID);
  ok(lt.length === 3 && lt.find((t) => t.lang === 'en').materials === 'Steel bars|Binding wire|Cover blocks', 'stored in the sheet with | lists like the app CSV');
  ok(r.missing.some((m) => /step/.test(m)) && r.missing.some((m) => /quiz/.test(m)) && r.missing.some((m) => /audio/.test(m)), 'still missing: steps, audio, quiz (ADM-6)');

  step('Session expiry and deactivation');
  clock.t += 12 * 3600e3 + 1000;
  ok(post({ action: 'listLessons', token: W }).error === 'Session ended after 12 hours. Please log in again.', 'token ends after 12 hours');
  const W2 = post({ action: 'login', email: 'writer@example.com', password: 'writer-pass-1' }).token;
  const A2 = post({ action: 'login', email: 'vaibhav@example.com', password: 'admin-pass-123' }).token;
  const R2 = post({ action: 'login', email: 'guide@example.com', password: 'review-pass-1' }).token;

  step('Day 16 · steps with pictures, audio, quiz (Cloudinary signed upload)');
  const tiny = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4]).toString('base64');
  for (let n = 1; n <= 5; n++) {
    post({ action: 'saveStep', token: W2, id: ID, step_no: n, text_mr: `पायरी ${n}`, text_hi: `चरण ${n}`, text_en: `Step ${n} text` });
    r = post({ action: 'uploadMedia', token: W2, id: ID, kind: 'image', step_no: n, ext: 'jpg', data: tiny });
  }
  ok(r.ok && r.provider === 'cloudinary' && r.url === 'https://res.cloudinary.com/demo/image/upload/v1/site-saathi/SS-REI-01/SS-REI-01_s5.jpg', 'picture -> Cloudinary folder site-saathi/SS-REI-01/, name SS-REI-01_s5', r.url || r.error);
  const f = B.fetches[B.fetches.length - 1];
  ok(f.payload.api_key === 'k123' && !JSON.stringify(f.payload).includes('s456'), 'API secret never sent, only the signature');
  r = post({ action: 'uploadMedia', token: W2, id: ID, kind: 'image', step_no: 1, ext: 'exe', data: tiny });
  ok(!r.ok && /not allowed/.test(r.error), 'wrong file type refused');
  r = post({ action: 'uploadMedia', token: W2, id: ID, kind: 'audio', lang: 'mr', ext: '3gp', data: tiny });
  ok(r.ok && r.url.endsWith('/video/upload/v1/site-saathi/SS-REI-01/SS-REI-01_mr.mp3'), 'recorded audio (3gp) -> Cloudinary converts to MP3', r.url || r.error);
  post({ action: 'uploadMedia', token: W2, id: ID, kind: 'audio', lang: 'hi', ext: 'm4a', data: tiny });
  post({ action: 'saveLesson', token: W2, id: ID, lang: 'en', readAloudOnly: 'true' });
  const Q = (l, n) => ({ action: 'saveQuiz', token: W2, id: ID, lang: l, q_no: n, question: `${l} question ${n}?`, a: 'a', b: 'b', c: 'c', d: 'd', correct: 'ABCDA'[n - 1], explanation: 'because' });
  ok(!post({ ...Q('en', 1), correct: 'E' }).ok, 'quiz: correct answer must be A–D');
  for (const l of ['mr', 'hi', 'en']) for (let n = 1; n <= 4; n++) post(Q(l, n));
  r = post({ action: 'submit', token: W2, id: ID });
  ok(!r.ok && /mr quiz: 4 of 5 questions/.test(r.error), 'submit refused while incomplete, with the reason', r.error);
  for (const l of ['mr', 'hi', 'en']) r = post(Q(l, 5));
  ok(r.ok && r.missing.length === 0, 'lesson complete: 3 languages, 5 pictured steps, audio or read-aloud, 5 × 3 quiz');
  ok(post({ action: 'submit', token: W2, id: ID }).status === 'In review', 'Writer submits -> In review');
  ok(/waiting for review/.test(post({ action: 'saveStep', token: W2, id: ID, step_no: 1, text_en: 'x' }).error), 'Writer cannot edit while In review');

  step('Day 16 · review and publish (roles)');
  ok(/cannot do this|Reviewers comment/.test(post({ action: 'saveQuiz', ...Q('en', 1), token: R2 }).error), 'Reviewer cannot edit');
  ok(/cannot do this/.test(post({ action: 'publish', token: W2 }).error), 'Writer cannot publish');
  ok(/Write what to change/.test(post({ action: 'review', token: R2, id: ID, decision: 'sendback' }).error), 'send back needs a comment');
  r = post({ action: 'review', token: R2, id: ID, decision: 'sendback', comment: 'Step 3: say "ask the engineer for lap length".' });
  ok(r.status === 'Changes needed', 'Reviewer sends back with comment');
  ok(post({ action: 'saveStep', token: W2, id: ID, step_no: 3, text_en: 'Ask the engineer for the lap length.' }).ok && post({ action: 'submit', token: W2, id: ID }).ok, 'Writer fixes and submits again');
  r = post({ action: 'review', token: R2, id: ID, decision: 'approve', comment: 'OK' });
  ok(r.status === 'Approved' && api.readTable_('lessons').find((l) => l.lesson_id === ID).reviewer === 'Prof. Patil, M.E. Structures', 'approved; reviewer name + qualification saved (LES-5)');
  r = post({ action: 'publish', token: A2, note: 'Reinforcement lesson' });
  ok(r.ok && r.version === 1 && r.published.join() === ID && r.files === 7, 'Admin publishes: content version 0 -> 1, 5 pictures + 2 audio files', JSON.stringify(r));
  ok(api.readTable_('lessons').find((l) => l.lesson_id === ID).status === 'Published' && api.readTable_('publish_log').length === 1, 'status Published; publish log row written');
  ok(/Nothing approved/.test(post({ action: 'publish', token: A2 }).error), 'publishing again with nothing approved is refused');

  step('getPublished (phones, Day 17)');
  r = get({ action: 'getPublished' });
  const head = r.lessons_csv.split('\n')[0];
  ok(r.ok && r.content_version === 1 && head === fs.readFileSync(path.join(ROOT, 'content', 'sheet', 'lessons.csv'), 'utf8').split(/\r?\n/)[0], 'lessons_csv has exactly the app lessons.csv header');
  const rows = r.lessons_csv.trim().split('\n');
  ok(rows.length === 4 && rows[1].startsWith('SS-REI-01,REI,mr,') && rows[1].includes('SS-REI-01_s1.jpg|SS-REI-01_s2.jpg') && rows[1].includes('SS-REI-01_mr.mp3'), '3 rows (mr, hi, en) with file names, not links', rows[1].slice(0, 120));
  ok(rows[3].split(',').slice(-2)[0] === '', 'en marked read-aloud only -> empty audio column');
  ok(r.quiz_csv.trim().split('\n').length === 16 && r.strings_csv.includes('btn_start') && r.files.length === 7 && r.files.every((x) => /^https:/.test(x.url)), 'quiz 15 rows, strings, 7 download links');

  step('Editing a published lesson keeps the old copy live until re-approved');
  ok(post({ action: 'saveStep', token: W2, id: ID, step_no: 2, text_en: 'Changed step 2' }).ok && api.readTable_('lessons').find((l) => l.lesson_id === ID).status === 'Draft', 'edit -> back to Draft (needs review)');
  post({ action: 'submit', token: W2, id: 'SS-MAS-01' });
  post({ action: 'review', token: R2, id: 'SS-MAS-01', decision: 'approve' });
  r = post({ action: 'publish', token: A2 });
  const pub = get({}).lessons_csv;
  ok(r.version === 2 && pub.includes('SS-MAS-01,MAS,mr') && pub.includes('Step 2 text') && !pub.includes('Changed step 2'), 'v2: SS-MAS-01 added; SS-REI-01 still the reviewed version');
  ok(pub.includes('SS-MAS-01_s1.jpg|SS-MAS-01_s2.jpg') && get({}).files.length === 7, 'MVP lesson uses bundled pictures (no new downloads)');
  ok(post({ action: 'hideLesson', token: A2, id: ID }).ok && post({ action: 'publish', token: A2, force: 'true' }).ok && !get({}).lessons_csv.includes('SS-REI-01'), 'hidden lesson removed at the next publish (UPD-7)');

  step('App texts and QR codes');
  ok(!post({ action: 'saveString', token: W2, key: 'btn_start', mr: 'a', hi: 'b', en: 'c' }).ok, 'Writer cannot edit app texts');
  ok(post({ action: 'saveString', token: A2, key: 'btn_start', mr: 'शिका', hi: 'सीखें', en: 'Learn' }).ok && api.readTable_('strings').find((s) => s.key === 'btn_start').en === 'Learn', 'Admin edits a label in 3 languages');
  ok(!post({ action: 'saveString', token: A2, key: 'btn_start', mr: 'x', hi: '', en: 'y' }).ok, 'all 3 languages required (LNG-3)');
  r = post({ action: 'listQr', token: W2 });
  ok(r.ok && r.qr.length === 3 && r.qr[0].qr_url.endsWith('data=SS-CON-01'), 'QR list: only the lesson ID inside each code (QR-2); hidden lesson not listed');
  ok(post({ action: 'saveQr', token: W2, id: 'SS-MAS-01', poster_location: 'Block B wall', printed: 'yes' }).ok, 'poster place and printed saved');

  step('Safety: formula text, deactivation');
  post({ action: 'saveLesson', token: W2, module: 'CUR' });
  ok(post({ action: 'saveLesson', token: W2, id: 'SS-CUR-01', lang: 'en', title: '=HYPERLINK("x")' }).ok && api.readTable_('lesson_text').find((t) => t.lesson_id === 'SS-CUR-01').title === '=HYPERLINK("x")', 'text starting with = is stored as text, not a formula');
  ok(post({ action: 'setActive', token: A2, email: 'writer@example.com', active: 'FALSE' }).ok && post({ action: 'listLessons', token: W2 }).error === 'This account is not active.', 'deactivated member is logged out at once');
  ok(post({ action: 'unknown', token: A2 }).error === 'Unknown action "unknown".', 'unknown action -> clear error');

  step('Day 18 · ask (Gemini free-tier backup for Ask Saathi)');
  r = post({ action: 'ask', q: 'Curing kiti divas?', lang: 'mr' });
  ok(r.ok && r.provider === 'gemini' && /\[Marathi\]/.test(r.answer), 'no login needed; persona asks for Marathi', JSON.stringify(r));
  const g = B.fetches.filter((x) => x.url.includes('generativelanguage')).pop();
  const sys = JSON.parse(g.payload).system_instruction.parts[0].text;
  ok(!g.url.includes('g789') && g.headers['x-goog-api-key'] === 'g789', 'API key only in a request header (never in the URL or the app)');
  ok(/stop and ask your supervisor or engineer/.test(sys) && /LESSON: <id>/.test(sys) && sys.includes('SS-MAS-01 '), 'persona from the strings tab: safety rule (AIR-4) + published lesson list', sys.slice(0, 80));
  ok(JSON.parse(g.payload).contents[0].parts[0].text === 'Curing kiti divas?', 'only the question text is sent (AIR-3)');
  ok(/too long/.test(post({ action: 'ask', q: 'x'.repeat(301), lang: 'en' }).error), 'questions over 300 characters refused');
  for (let i = 0; i < 12; i++) r = post({ action: 'ask', q: 'q' + i, lang: 'en' });
  ok(!r.ok && /Try again in a minute/.test(r.error), 'rate limit protects the free quota (10 per minute)', r.error);
  clock.t += 61e3;
  ok(post({ action: 'ask', q: 'again', lang: 'hi' }).ok, 'next minute works again');
  const B2 = makeBackend({ gemini: () => 429 });
  ok(/free limit reached/.test(B2.post({ action: 'ask', q: 'x', lang: 'en' }).error), 'Gemini quota used up -> clear message (app shows the offline text)');
  const B3 = makeBackend({ props: { GEMINI_API_KEY: '' } });
  ok(B3.post({ action: 'ask', q: 'x', lang: 'en' }).error === 'AI backup is not set up.', 'no key set -> clear message');

  step('rc8 · set up from the app: automatic secrets, first Admin with the sheet code, server keys');
  {
    const N = makeBackend({ props: { PEPPER: null, TOKEN_SECRET: null, CLOUDINARY_CLOUD_NAME: null, CLOUDINARY_API_KEY: null, CLOUDINARY_API_SECRET: null, GEMINI_API_KEY: null } });
    let x = N.post({ action: 'login', email: 'a@b.co', password: 'whatever1' });
    ok(!x.ok && x.needsSetup === true, 'brand-new server: login answers "needsSetup" (app opens First setup)', JSON.stringify(x));
    x = N.post({ action: 'setupStatus' });
    const code = (N.api.readTable_('setup')[0] || {}).value;
    ok(x.ok && x.needsSetup && /^\d{6}$/.test(String(code)) && N.props.SETUP_CODE === String(code), 'setupStatus: 6-digit code written to the sheet tab "setup"', String(code));
    ok(N.props.PEPPER && N.props.PEPPER.length > 60 && N.props.TOKEN_SECRET && N.props.PEPPER !== N.props.TOKEN_SECRET, 'PEPPER and TOKEN_SECRET made automatically (long, different)');
    x = N.post({ action: 'firstSetup', code: '000000', name: 'Vaibhav', email: 'v@example.com', password: 'admin-pass-1' });
    ok(!x.ok && /Wrong setup code.*4 tries left/.test(x.error) && N.api.readTable_('team').length === 0, 'wrong code -> refused, tries left', x.error);
    for (let i = 0; i < 3; i++) N.post({ action: 'firstSetup', code: '000000', name: 'X', email: 'x@example.com', password: 'x-pass-1234' });
    x = N.post({ action: 'firstSetup', code: '000000', name: 'X', email: 'x@example.com', password: 'x-pass-1234' });
    const code2 = String((N.api.readTable_('setup')[0] || {}).value);
    ok(!x.ok && /NEW code/.test(x.error) && code2 !== String(code) && /^\d{6}$/.test(code2), '5 wrong codes -> a new code in the sheet (guessing is useless)', x.error);
    ok(/8 characters/.test(N.post({ action: 'firstSetup', code: code2, name: 'Vaibhav', email: 'v@example.com', password: 'short' }).error), 'password under 8 characters refused');
    x = N.post({ action: 'firstSetup', code: code2, name: 'Vaibhav', email: 'V@Example.com', password: 'admin-pass-1' });
    ok(x.ok && x.role === 'Admin' && x.token && N.api.readTable_('team')[0].role === 'Admin' && !N.props.SETUP_CODE && N.api.readTable_('setup')[0].value === 'done', 'right code -> first Admin + logged in; code deleted from server and sheet');
    ok(/already done/.test(N.post({ action: 'firstSetup', code: code2, name: 'Y', email: 'y@example.com', password: 'y-pass-1234' }).error) && N.post({ action: 'setupStatus' }).needsSetup === false, 'a second first-setup is refused');
    const AT = x.token;
    ok(N.post({ action: 'login', email: 'v@example.com', password: 'admin-pass-1' }).ok, 'normal login works with the automatic secrets');
    x = N.post({ action: 'getKeys', token: AT });
    ok(x.ok && x.cloudinary === 'not set' && x.gemini === 'not set', 'getKeys: status only (not set yet)');
    ok(/all 3/.test(N.post({ action: 'saveKeys', token: AT, cloud_name: 'demo', cloud_key: '123' }).error), 'Cloudinary needs all 3 values');
    ok(/did not accept/.test(N.post({ action: 'saveKeys', token: AT, cloud_name: 'demo', cloud_key: '123', cloud_secret: 'bad' }).error) && !N.props.CLOUDINARY_API_SECRET, 'wrong Cloudinary keys -> tested, refused, not saved');
    ok(/cloud name not found/.test(N.post({ action: 'saveKeys', token: AT, cloud_name: 'nocloud', cloud_key: '123', cloud_secret: 'good-s' }).error), 'unknown cloud name -> clear message');
    ok(/did not accept this Gemini key/.test(N.post({ action: 'saveKeys', token: AT, gemini_key: 'nope' }).error) && !N.props.GEMINI_API_KEY, 'wrong Gemini key -> refused, not saved');
    x = N.post({ action: 'saveKeys', token: AT, cloud_name: 'demo', cloud_key: '123', cloud_secret: 'good-secret', gemini_key: 'good-gem' });
    const leak = JSON.stringify(x);
    ok(x.ok && x.saved === 'Cloudinary + Gemini' && x.cloudinary === 'set' && x.gemini === 'set' && N.props.CLOUDINARY_API_SECRET === 'good-secret' && N.props.GEMINI_API_KEY === 'good-gem', 'right keys -> tested, saved in Script Properties', leak);
    ok(!leak.includes('good-secret') && !leak.includes('good-gem') && !JSON.stringify(N.post({ action: 'getKeys', token: AT })).includes('good-'), 'keys are never sent back to the phone');
    ok(/^Vaibhav · /.test(N.props.KEYS_UPDATED), 'who saved the keys, and when, is kept');
    N.post({ action: 'addMember', token: AT, email: 'w@example.com', name: 'W', role: 'Writer', password: 'writer-pass-1' });
    const WT = N.post({ action: 'login', email: 'w@example.com', password: 'writer-pass-1' }).token;
    ok(/cannot do this/.test(N.post({ action: 'saveKeys', token: WT, gemini_key: 'good-x' }).error) && /cannot do this/.test(N.post({ action: 'getKeys', token: WT }).error), 'Writer cannot see or change keys (Admin only)');
    const up = N.post({ action: 'uploadMedia', token: AT, id: 'SS-MAS-01', kind: 'image', ext: 'jpg', step_no: 1, data: 'aGVsbG8=' });
    ok(up.ok && /res\.cloudinary\.com\/demo\//.test(JSON.stringify(up)), 'upload uses the keys saved from the app', JSON.stringify(up).slice(0, 120));
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}
