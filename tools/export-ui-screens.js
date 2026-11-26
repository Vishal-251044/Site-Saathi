// export-ui-screens.js — phone-size screenshots of the REAL app screens into Doc/, so the UI can be checked
// without building an APK. Uses tools/preview-aia.js (runs the blocks, draws the screens with headless Chrome).
//
//   node tools/export-ui-screens.js
//
// Output (Doc/UI_v3_Screens/ is replaced each run):
//   Doc/UI_v3_Screens/en|mr|hi/<nn>_<screen>.png      every worker screen, 720 x 1520 (one phone screen)
//                                   ..._full.png       long screens, whole page (as if scrolled)
//   Doc/UI_v3_Screens/v1.1_admin_build/*.png          extra v1.1 screens (Ask Saathi, Helmet Check, Supervisor, Admin)
//   Doc/UI_v3_Screens/before_after/*.png              rc5 phone screenshot next to the new screen
//   Doc/UI_v3_Screens/Overview_en|mr|hi.png           all screens of one language in one picture (easy to share)
//   Doc/UI_v3_Screens/index.html                      gallery (open in Chrome)
//   Doc/SITE_SAATHI_UI_v3_Screens.pdf                 the same gallery as a PDF (A4 landscape)
// The pictures are a laptop drawing of the real blocks and layout; the phone is still the final check.
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'Doc', 'UI_v3_Screens');
const PDF = path.join(ROOT, 'Doc', 'SITE_SAATHI_UI_v3_Screens.pdf');
const PDF_ADMIN = path.join(ROOT, 'Doc', 'SITE_SAATHI_Admin_Mode_UI.pdf');   // Admin Mode only (content team)
const PREV = path.join(ROOT, 'design', 'app-preview');
const BEFORE = path.join(ROOT, 'design', 'ui-before');   // rc5 screenshots from the phone (20 Nov build)
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
if (!CHROME) { console.error('Chrome or Edge not found - install Google Chrome (free)'); process.exit(1); }
const LANGS = { en: 'English', mr: 'मराठी (Marathi)', hi: 'हिंदी (Hindi)' };
const TITLES = {
  '01_splash': 'Splash', '02_language': 'Choose language (first launch)', '03_home': 'Home', '04_modules': 'Learning modules',
  '05_lessons': 'Lesson list', '06_lesson_intro': 'Lesson: intro', '07_lesson_step': 'Lesson: step', '08_lesson_safety': 'Lesson: safety + mistakes',
  '09_quiz': 'Quiz: question', '10_quiz_answered': 'Quiz: answered', '11_quiz_result': 'Quiz: result', '12_scan': 'Scan task QR',
  '12b_scan_unknown': 'Scan: code not in the app', '13_skills': 'My skills', '14_settings': 'Settings', '14b_about': 'About',
  '15_ask': 'Ask Saathi (AI)', '15b_ask_answer': 'Ask Saathi: answer', '16_safety_ok': 'Helmet Check: helmet on', '16b_safety_no': 'Helmet Check: no helmet',
  '17_sup_pin': 'Supervisor mode: PIN', '17b_sup_table': 'Supervisor mode: workers', '20_adm_login': 'Admin: login', '20b_adm_login_wrong': 'Admin: wrong password','21_adm_dashboard': 'Admin: dashboard',
  '22_adm_new': 'Admin: new lesson', '23_adm_editor': 'Admin: edit lesson', '24_adm_steps': 'Admin: steps + pictures', '25_adm_quiz': 'Admin: quiz',
  '26_adm_qr': 'Admin: QR codes', '27_adm_texts': 'Admin: app texts', '28_adm_review': 'Admin: review', '29_adm_setup': 'Admin: first setup', '30_adm_keys': 'Admin: server keys',
};
const title = (id) => (TITLES[id.replace(/_full$/, '')] || id) + (id.endsWith('_full') ? ' (whole page)' : '');
const run = (args) => execFileSync(process.execPath, args, { cwd: ROOT, stdio: ['ignore', 'pipe', 'inherit'] }).toString().trim().split('\n').pop();
const fileUrl = (p) => 'file:///' + p.replace(/\\/g, '/').replace(/ /g, '%20');
const chrome = (args, n) => {
  try {
    execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files',
      `--user-data-dir=${path.join(require('os').tmpdir(), 'ss_ui_' + process.pid + '_' + n)}`, ...args], { stdio: 'ignore' });
  } catch (e) { /* Chrome can return non-zero even when the file is written */ }
};

// 1) draw the screens
console.log('Drawing worker screens (en, mr, hi) ...', run(['tools/preview-aia.js', '--lang=en,mr,hi', '--clean']));
console.log('Drawing v1.1 admin-build screens (en) ...', run(['tools/preview-aia.js', 'app-inventor/SITE_SAATHI_admin.aia', '--lang=en', '--clean']));

// 2) copy into Doc/UI_v3_Screens
fs.rmSync(OUT, { recursive: true, force: true });
const groups = {};   // folder -> [ids]
const put = (folder, src, id) => { fs.mkdirSync(path.join(OUT, folder), { recursive: true }); fs.copyFileSync(src, path.join(OUT, folder, id + '.png')); (groups[folder] = groups[folder] || []).push(id); };
for (const f of fs.readdirSync(path.join(PREV, 'worker')).sort()) {
  const m = /^(\d+b?_[a-z_]+?)_(en|mr|hi)\.png$/.exec(f); if (m) put(m[2], path.join(PREV, 'worker', f), m[1]);
}
for (const f of fs.readdirSync(path.join(PREV, 'admin')).sort()) {   // admin build: Admin Mode pages (20-28) and the other v1.1 screens
  const m = /^(\d+b?_[a-z_]+?)_en\.png$/.exec(f); if (!m) continue;
  const nr = +m[1].slice(0, 2);
  if (nr >= 20) put('admin_mode', path.join(PREV, 'admin', f), m[1]);
  else if (nr >= 15 || m[1] === '03_home') put('v1.1_ai_supervisor', path.join(PREV, 'admin', f), m[1]);
}
// status icons for the Admin Mode colour legend
const ST_LEGEND = [['st_draft', 'Draft', 'grey'], ['st_review', 'In review', 'amber'], ['st_changes', 'Changes needed', 'red'], ['st_approved', 'Approved', 'green'], ['st_live', 'Published (live on phones)', 'solid green'], ['st_hidden', 'Hidden', 'grey']];
fs.mkdirSync(path.join(OUT, 'admin_mode', 'status_icons'), { recursive: true });
for (const [ic] of ST_LEGEND) if (fs.existsSync(path.join(ROOT, 'media', ic + '.png'))) fs.copyFileSync(path.join(ROOT, 'media', ic + '.png'), path.join(OUT, 'admin_mode', 'status_icons', ic + '.png'));
const pairs = fs.existsSync(BEFORE) ? fs.readdirSync(BEFORE).filter((f) => /\.(jpg|png)$/.test(f)).sort().map((f) => f.replace(/\.(jpg|png)$/, '')) : [];
if (pairs.length) fs.mkdirSync(path.join(OUT, 'before_after'), { recursive: true });
for (const id of pairs) {
  const ext = fs.existsSync(path.join(BEFORE, id + '.jpg')) ? '.jpg' : '.png';
  fs.copyFileSync(path.join(BEFORE, id + ext), path.join(OUT, 'before_after', id + '_before_rc5' + ext));
  fs.copyFileSync(path.join(PREV, 'worker', id + '_en.png'), path.join(OUT, 'before_after', id + '_after_rc6.png'));
}

// 3) gallery page (also the PDF source): A4 landscape, 4 phones per page
const SRC = fs.readFileSync(path.join(ROOT, 'tools', 'build-app.js'), 'utf8');
const VER = (/MVP_VERSION = \['([^']+)'/.exec(SRC) || [])[1], AVER = (/ADMIN_VERSION = \['([^']+)'/.exec(SRC) || [])[1];
const today = new Date().toISOString().slice(0, 10);
const phone = (src, cap, full) => `<figure class="${full ? 'full' : ''}"><img src="${src}"><figcaption>${cap}</figcaption></figure>`;
let pages = [];
const section = (h, sub, figs, perPage = 4) => { for (let i = 0; i < figs.length; i += perPage) pages.push(`<section><h2>${h}${i ? ' (continued)' : ''}</h2>${i ? '' : `<p>${sub}</p>`}<div class="row">${figs.slice(i, i + perPage).join('')}</div></section>`); };
const ADMIN_TXT = 'Admin Mode is for the content team (hidden: Settings → About → tap the version 5 times). It has its own look so the team always knows where they are: ' +
  'charcoal title bar with a yellow-black hazard stripe, name · role in yellow, stat tiles, filled form fields, and one colour per lesson status. ' +
  'Approve is green, Send back red, Publish to all phones charcoal, main actions yellow.';
const legend = () => `<table class="legend">${ST_LEGEND.map(([ic, name, col]) => `<tr><td><img src="admin_mode/status_icons/${ic}.png"></td><td><b>${name}</b></td><td>${col}</td></tr>`).join('')}</table>`;
const adminSections = () => {
  const ids = groups.admin_mode || [];
  section('Admin Mode · every page (one phone screen)', ADMIN_TXT, ids.filter((id) => !id.endsWith('_full')).map((id) => phone(`admin_mode/${id}.png`, title(id))));
  section('Admin Mode · whole pages', 'The same pages scrolled to the end: forms, checklist card (yellow = something missing, green = complete) and buttons.', ids.filter((id) => id.endsWith('_full')).map((id) => phone(`admin_mode/${id}.png`, title(id), true)), 5);
};
pages.push(`<section class="cover"><h1>SITE SAATHI · UI v3 "Hi-Vis Soft"</h1><p class="big">Worker app ${VER} · admin build ${AVER} · ${today}</p>
  <p>These are the real app screens, drawn on the laptop from the same blocks and layout that App Inventor builds (tools/preview-aia.js), at phone size (360 × 760 dp).
  Sample progress is used (Brick Masonry 4/5, Concrete Work 2/5, last lesson Concrete Work step 3).</p>
  <p>What changed from rc5: English text now uses the app's own font (before, the phone's handwriting-style font was used), rounded white cards with soft shadows,
  pill buttons, a light title bar, a progress gauge on Home, lesson cards with pictures and a green tick when completed, a rounded lesson picture,
  safety and mistakes boxes with borders and icons, quiz answer cards and a score ring. Colours are unchanged (Hi-Vis, PRD 14.1).</p>
  <p class="note">The phone is still the final check: button text padding and exact font sizes can differ by a few dp.</p></section>`);
if (pairs.length) section('Before (rc5 on the phone) → After (rc6)', 'Left: screenshot from the phone, rc5. Right: the same screen in rc6.',
  pairs.flatMap((id) => [phone(`before_after/${id}_before_rc5${fs.existsSync(path.join(BEFORE, id + '.jpg')) ? '.jpg' : '.png'}`, `Before · ${title(id)}`), phone(`before_after/${id}_after_rc6.png`, `<b>After</b> · ${title(id)}`)]));
for (const [lang, name] of Object.entries(LANGS)) {
  const ids = groups[lang] || [];
  section(`Worker app · ${name}`, 'Every screen of the worker app (v1.0), one phone screen each.', ids.filter((id) => !id.endsWith('_full')).map((id) => phone(`${lang}/${id}.png`, title(id))));
  section(`Worker app · ${name} · long screens`, 'Whole page, as if scrolled down.', ids.filter((id) => id.endsWith('_full')).map((id) => phone(`${lang}/${id}.png`, title(id), true)), 5);
}
if (groups['v1.1_ai_supervisor']) section('v1.1 admin build · Ask Saathi, Helmet Check, Supervisor mode (English)', 'Ask Saathi and Helmet Check use the blue AI bar; Supervisor mode uses the worker cards.',
  groups['v1.1_ai_supervisor'].map((id) => phone(`v1.1_ai_supervisor/${id}.png`, title(id))));
adminSections();
const STYLE = `<style>
@page{size:A4 landscape;margin:8mm}
*{box-sizing:border-box}body{margin:0;background:#E9E5DE;color:#1B1F24;font-family:'Segoe UI',Arial,sans-serif}
section{background:#F6F3EE;margin:12px auto;padding:10px 14px;max-width:1200px;break-after:page;page-break-after:always}
h1{margin:30px 0 6px;font-size:30px}h2{margin:2px 0 4px;font-size:18px}p{margin:4px 0 10px;font-size:13px;max-width:1000px;color:#3a3f46}
.cover{padding:30px 40px}.big{font-size:18px;color:#8A6400;font-weight:700}.note{color:#DC2626}
.row{display:flex;gap:14px;align-items:flex-start;justify-content:center}
figure{margin:0;text-align:center}figure img{height:150mm;max-height:640px;border-radius:14px;box-shadow:0 2px 8px rgba(0,0,0,.18);background:#fff}
figure.full img{height:170mm;max-height:760px}
figcaption{font-size:12px;margin-top:6px}
.legend{border-collapse:collapse;margin:8px 0 14px}.legend td{padding:3px 12px 3px 0;font-size:14px}.legend img{width:40px;height:40px;display:block}
.stripe{height:10px;background:repeating-linear-gradient(-45deg,#FFC21A 0 10px,#1B1F24 10px 20px);border-radius:3px;margin:6px 0 14px;max-width:600px}
@media screen{section{border-radius:10px}}
</style>`;
// 3b) Admin Mode on its own (separate page + PDF)
const mainPages = pages; pages = [];
pages.push(`<section class="cover"><h1>SITE SAATHI · Admin Mode</h1><div class="stripe"></div><p class="big">Admin build ${AVER} · ${today}</p><p>${ADMIN_TXT}</p>
  <h2>Lesson status colours</h2>${legend()}
  <p>Example data: the 3 MVP lessons are "In review"; a new lesson SS-REI-01 is being written (Draft); the reviewer view shows a lesson whose checklist is complete.
  Drawn on the laptop from the real blocks (tools/preview-aia.js); the phone is the final check.</p></section>`);
adminSections();
fs.writeFileSync(path.join(OUT, 'admin_mode.html'), `<!doctype html><html><head><meta charset="utf-8"><title>SITE SAATHI Admin Mode screens</title>${STYLE}</head><body>${pages.join('\n')}</body></html>`);
pages = mainPages;
fs.writeFileSync(path.join(OUT, 'index.html'), `<!doctype html><html><head><meta charset="utf-8"><title>SITE SAATHI UI v3 screens</title><style>
@page{size:A4 landscape;margin:8mm}
*{box-sizing:border-box}body{margin:0;background:#E9E5DE;color:#1B1F24;font-family:'Segoe UI',Arial,sans-serif}
section{background:#F6F3EE;margin:12px auto;padding:10px 14px;max-width:1200px;break-after:page;page-break-after:always}
h1{margin:30px 0 6px;font-size:30px}h2{margin:2px 0 4px;font-size:18px}p{margin:4px 0 10px;font-size:13px;max-width:1000px;color:#3a3f46}
.cover{padding:30px 40px}.big{font-size:18px;color:#8A6400;font-weight:700}.note{color:#DC2626}
.row{display:flex;gap:14px;align-items:flex-start;justify-content:center}
figure{margin:0;text-align:center}figure img{height:150mm;max-height:640px;border-radius:14px;box-shadow:0 2px 8px rgba(0,0,0,.18);background:#fff}
figure.full img{height:170mm;max-height:760px}
figcaption{font-size:12px;margin-top:6px}
@media screen{section{border-radius:10px}}
</style></head><body>${pages.join('\n')}</body></html>`);

// 4) one overview picture per language (16 screens, 8 x 2) and one for the admin-build screens
for (const lang of [...Object.keys(LANGS), 'admin_mode', 'v1.1_ai_supervisor']) {
  const ids = (groups[lang] || []).filter((id) => !id.endsWith('_full'));
  const html = path.join(OUT, `_overview_${lang}.html`);
  const outName = { admin_mode: 'Overview_Admin_Mode.png', 'v1.1_ai_supervisor': 'Overview_AI_and_Supervisor.png' }[lang] || `Overview_${lang}.png`;
  const cols = lang === 'admin_mode' ? 5 : 8;
  fs.writeFileSync(html, `<!doctype html><meta charset="utf-8"><body style="margin:0;padding:16px;background:#E9E5DE;font:13px 'Segoe UI',Arial;display:grid;grid-template-columns:repeat(${cols},180px);gap:14px">` +
    ids.map((id) => `<div style="text-align:center"><img src="${lang}/${id}.png" style="width:180px;height:380px;object-fit:cover;object-position:top;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,.2)"><div>${title(id)}</div></div>`).join(''));   // tall pages: first screen only
  chrome([`--window-size=${16 * 2 + cols * 180 + (cols - 1) * 14},${16 * 2 + Math.ceil(ids.length / cols) * (380 + 40)}`, `--screenshot=${path.join(OUT, outName)}`, '--virtual-time-budget=3000', fileUrl(html)], 'ov' + lang);
  fs.unlinkSync(html);
}

// 5) PDF
chrome(['--no-pdf-header-footer', '--print-to-pdf-no-header', `--print-to-pdf=${PDF}`, '--virtual-time-budget=8000', fileUrl(path.join(OUT, 'index.html'))], 'pdf');
chrome(['--no-pdf-header-footer', '--print-to-pdf-no-header', `--print-to-pdf=${PDF_ADMIN}`, '--virtual-time-budget=6000', fileUrl(path.join(OUT, 'admin_mode.html'))], 'pdfa');
const count = Object.values(groups).reduce((t, g) => t + g.length, 0) + pairs.length * 2;
const mb = (p) => (fs.existsSync(p) ? `${path.relative(ROOT, p)} (${(fs.statSync(p).size / 1048576).toFixed(1)} MB)` : `${path.basename(p)} NOT written`);
console.log(`${count} screenshots -> ${path.relative(ROOT, OUT)}  ·  ${mb(PDF)}  ·  ${mb(PDF_ADMIN)}`);
