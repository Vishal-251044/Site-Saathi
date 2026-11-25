// preview-aia.js — draw the REAL app screens on the laptop, as App Inventor lays them out on a phone.
// It runs the blocks with the simulator (sim-aia.js), then turns the live component tree into HTML
// (360 dp wide phone) and takes PNG screenshots with headless Chrome.
//
//   node tools/preview-aia.js                                  -> worker build, all states, en + mr
//   node tools/preview-aia.js app-inventor/SITE_SAATHI_admin.aia --lang=en
// Output: design/app-preview/<worker|admin>/<state>_<lang>.png  +  index.html (contact sheet)
//
// This is an approximation of Android rendering (fill-parent, %, automatic sizes, image buttons stretched,
// HasMargins, Visible). It is good for spotting layout problems; the phone is still the final judge.
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execFileSync } = require('child_process');

const AIA = process.argv.slice(2).find((a) => !a.startsWith('--')) || 'app-inventor/SITE_SAATHI.aia';
const LANGS = ((process.argv.find((a) => a.startsWith('--lang=')) || '--lang=en,mr').slice(7)).split(',');
const ONLY = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7);
const { App } = require('./sim-aia.js');   // sim reads the same AIA path from argv
const ROOT = path.join(__dirname, '..');
const ADMIN = /admin/i.test(AIA);
const OUT = path.join(ROOT, 'design', 'app-preview', ADMIN ? 'admin' : 'worker');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const W = 360, H = 760;   // dp; screenshots are 2x

// ---------- assets (fonts + images) from the .aia ----------
const zb = fs.readFileSync(AIA); const ASSETS = path.join(OUT, 'assets'); fs.mkdirSync(ASSETS, { recursive: true });
for (let o = 0; zb.readUInt32LE(o) === 0x04034b50;) {
  const m = zb.readUInt16LE(o + 8), cs = zb.readUInt32LE(o + 18), nl = zb.readUInt16LE(o + 26), xl = zb.readUInt16LE(o + 28);
  const name = zb.slice(o + 30, o + 30 + nl).toString(); const d = zb.slice(o + 30 + nl + xl, o + 30 + nl + xl + cs);
  if (name.startsWith('assets/')) fs.writeFileSync(path.join(ASSETS, name.slice(7)), m ? zlib.inflateRawSync(d) : d);
  o += 30 + nl + xl + cs;
}

// ---------- App Inventor props -> CSS ----------
const col = (v, dflt) => { if (v === undefined || v === '' ) return dflt; const h = String(v).replace('&H', ''); if (h.length !== 8) return dflt; const a = parseInt(h.slice(0, 2), 16) / 255; if (a === 0) return 'transparent'; return `rgba(${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${parseInt(h.slice(6, 8), 16)},${a.toFixed(2)})`; };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function size(v, axis, parentDir) {
  const n = parseInt(v === undefined ? '-1' : v, 10);
  if (n <= -1000) return axis === 'w' ? `width:${(-n - 1000) * W / 100}px;flex:none;` : `height:${(-n - 1000) * H / 100}px;flex:none;`;
  if (n === -2) return axis === 'w' ? (parentDir === 'row' ? 'flex:1 1 0;min-width:0;' : 'align-self:stretch;') : (parentDir === 'col' ? 'flex:1 1 0;' : 'align-self:stretch;');
  if (n >= 0) return axis === 'w' ? `width:${n}px;flex:none;` : `height:${n}px;flex:none;`;
  return '';   // automatic
}
const fontOf = (f) => (f && /\.ttf$/i.test(f) ? `font-family:'${f.replace(/\W/g, '_')}',Roboto,Arial,sans-serif;` : '');

function render(s, c, parentDir) {
  const p = s.comps[c.$Name] || c; const t = p.$Type;
  if (p.Visible === 'False' || p.Visible === false) return '';
  const kids = (c.$Components || []);
  const base = size(p.Width, 'w', parentDir) + size(p.Height, 'h', parentDir) + (p.BackgroundColor ? `background:${col(p.BackgroundColor, 'transparent')};` : '');
  if (t === 'VerticalArrangement' || t === 'HorizontalArrangement' || t === 'VerticalScrollArrangement' || t === 'HorizontalScrollArrangement') {
    const row = t.startsWith('Horizontal'); const ah = p.AlignHorizontal || '1', av = p.AlignVertical || '1';
    const mapH = { 1: 'flex-start', 2: 'flex-end', 3: 'center' }, mapV = { 1: 'flex-start', 2: 'center', 3: 'flex-end' };
    const css = `display:flex;flex-direction:${row ? 'row' : 'column'};${row ? `justify-content:${mapH[ah]};align-items:${mapV[av]};` : `align-items:${mapH[ah]};justify-content:${mapV[av]};`}`
      + (p.Image ? `background-image:url(assets/${p.Image});background-size:100% 100%;` : '') + (t.includes('Scroll') ? 'overflow:auto;' : '');
    return `<div class="arr" title="${p.$Name}" style="${css}${base}">${kids.map((k) => render(s, k, row ? 'row' : 'col')).join('')}</div>`;
  }
  const txt = esc(p.Text === undefined ? '' : p.Text).replace(/\n/g, '<br>');
  const fs_ = `font-size:${parseFloat(p.FontSize || 14)}px;` + fontOf(p.FontTypeface) + (p.FontBold === 'True' ? 'font-weight:700;' : '');
  const ta = { 0: 'left', 1: 'center', 2: 'right' };
  if (t === 'Label') {
    const html = p.HTMLFormat === 'True' ? String(p.Text || '').replace(/\n/g, '<br>') : txt;
    return `<div class="lbl" title="${p.$Name}" style="${base}${fs_}color:${col(p.TextColor, '#000')};text-align:${ta[p.TextAlignment || '0']};${p.HasMargins === 'False' ? '' : 'padding:2px 4px;'}">${html}</div>`;
  }
  if (t === 'Button' || t === 'ListPicker' || t === 'DatePicker' || t === 'ImagePicker') {
    const img = p.Image ? `background:url(assets/${p.Image}) 0 0/100% 100% no-repeat;border:none;box-shadow:none;` : `background:${col(p.BackgroundColor, '#d6d7d7')};${p.Shape === '1' ? 'border-radius:10px;' : p.Shape === '3' ? 'border-radius:999px;' : 'border-radius:3px;'}box-shadow:0 1px 2px rgba(0,0,0,.25);`;
    const al = { 0: 'flex-start', 1: 'center', 2: 'flex-end' }[p.TextAlignment || '1'];
    const op = p.Enabled === 'False' ? 'opacity:.55;' : '';
    return `<div class="btn" title="${p.$Name}" style="${base}${img}${fs_}${op}color:${col(p.TextColor, '#000')};justify-content:${al};text-align:${ta[p.TextAlignment || '1']};${p.Image ? '' : 'min-height:40px;padding:0 14px;'}">${txt}</div>`;
  }
  if (t === 'Image') {
    const w = parseInt(p.Width || '-1', 10), h = parseInt(p.Height || '-1', 10);
    const fit = p.ScalePictureToFit === 'True' ? 'object-fit:fill;' : 'object-fit:contain;';
    const src = p.Picture ? (String(p.Picture).includes('/') ? '' : `assets/${p.Picture}`) : '';
    const sz = (w === -1 && h === -1) ? 'max-width:100%;' : '';
    return src ? `<img title="${p.$Name}" src="${src}" style="${base}${fit}${sz}display:block;">` : `<div title="${p.$Name}" style="${base}background:#ddd;min-height:60px;"></div>`;
  }
  if (t === 'TextBox' || t === 'PasswordTextBox') {
    const v = p.Text ? esc(p.Text) : `<span style="color:#9aa">${esc(p.Hint || '')}</span>`;
    return `<div class="tb" title="${p.$Name}" style="${base}${fs_}overflow:hidden;${p.MultiLine === 'True' ? 'min-height:72px;' : ''}">${t === 'PasswordTextBox' && p.Text ? '•'.repeat(String(p.Text).length) : v}</div>`;
  }
  if (t === 'ListView') {
    const els = Array.isArray(p.Elements) ? p.Elements : String(p.ElementsFromString || '').split(',').filter(Boolean);
    return `<div title="${p.$Name}" style="${base}overflow:hidden;background:${col(p.BackgroundColor, '#000')};">${els.map((e) => `<div style="padding:12px 10px;border-bottom:1px solid rgba(128,128,128,.3);font-size:${p.TextSize || p.FontSize || 22}px;color:${col(p.TextColor, '#fff')};">${esc(Array.isArray(e) ? e[0] : e)}</div>`).join('')}</div>`;
  }
  if (t === 'CheckBox' || t === 'Switch') return `<div title="${p.$Name}" style="${base}${fs_}padding:8px 4px;">☐ ${txt}</div>`;
  if (t === 'Slider') return `<div title="${p.$Name}" style="${base}height:24px;display:flex;align-items:center;"><div style="height:3px;background:#888;flex:1"></div></div>`;
  if (t === 'Spinner') return `<div title="${p.$Name}" style="${base}padding:10px 4px;border-bottom:1px solid #999;">${esc(p.Selection || '')} ▾</div>`;
  if (t === 'WebViewer' || t === 'Canvas') return `<div title="${p.$Name}" style="${base}background:#eee;min-height:20px;"></div>`;
  return '';   // non-visible components
}

function page(s, lang, label, tall) {
  const HH = tall ? 1560 : H;   // tall = the whole scrolled page
  const f = s.comps[s.name];
  const fonts = fs.readdirSync(ASSETS).filter((x) => /\.ttf$/i.test(x)).map((x) => `@font-face{font-family:'${x.replace(/\W/g, '_')}';src:url(assets/${x});}`).join('');
  const ah = { 1: 'flex-start', 2: 'flex-end', 3: 'center' }[f.AlignHorizontal || '1'];
  const body = (s.comps[s.name].$Components || []).map((k) => render(s, k, 'col')).join('');
  return `<!doctype html><meta charset="utf-8"><style>${fonts}
*{box-sizing:border-box;margin:0}html,body{width:${W}px;height:${HH}px;overflow:hidden;font-family:'font_deva_ttf',sans-serif}
.status{height:24px;background:${col(f.PrimaryColorDark, '#000') === 'rgba(0,0,0,1.00)' ? '#000' : col(f.PrimaryColorDark, '#000')};color:#fff;font:12px sans-serif;display:flex;align-items:center;padding:0 10px}
.form{height:${HH - 24}px;overflow:hidden;display:flex;flex-direction:column;align-items:${ah};background:${col(f.BackgroundColor, '#fff')}}
.form>*{flex-shrink:0}.arr{flex-shrink:0}.lbl{line-height:1.25;word-wrap:break-word}
.btn{display:flex;align-items:center;line-height:1.2;flex-shrink:0;white-space:normal}
.tb{border-bottom:1.5px solid #ffc21a;padding:8px 4px;background:transparent}
</style><div class="status">9:41 &nbsp; ${esc(label)}</div><div class="form">${body}</div>`;
}

// ---------- states: real scenarios through the simulator ----------
function states(lang) {
  const L = [];
  const shot = (id, s, tall) => L.push({ id, s, tall, html: page(s, lang, id, tall) });
  const a = new App({});
  const s1 = a.open('Screen1'); shot('01_splash', s1);
  s1.fire('Clock1.Timer'); shot('02_language', s1);
  const app = () => new App({ lang, 'score_SS-MAS-01': 4, last_lesson: 'SS-CON-01', last_step: 3, 'score_SS-CON-01': 2 });
  const b = app();
  { const h = b.open('Home'); for (let i = 0; i < 16; i++) h.fire('ClockIntro.Timer'); shot('03_home', h); }   // after the pop-in
  const le = b.open('Learn'); shot('04_modules', le);
  le.fire('BtnModMAS.Click'); shot('05_lessons', le);
  const c = app(); const ls = c.open('Learn', 'SS-MAS-01'); shot('06_lesson_intro', ls);
  ls.fire('BtnNext.Click'); shot('07_lesson_step', ls);
  for (let i = 0; i < 7; i++) ls.fire('BtnNext.Click'); shot('08_lesson_safety', ls);
  ls.fire('BtnStartQuiz.Click'); const q = c.top; shot('09_quiz', q);
  q.fire('BtnA.Click'); shot('10_quiz_answered', q);
  ['A', 'A', 'D', 'C', 'A'].forEach((x, i) => { if (i) q.fire(`Btn${x}.Click`); q.fire('BtnQNext.Click'); }); shot('11_quiz_result', q);
  const d = app();
  if (!ADMIN) shot('12_scan', d.open('Scan'));
  shot('13_skills', d.open('Skills'));
  shot('14_settings', d.open('Settings'));
  const st2 = d.open('Settings'); st2.fire('BtnAbout.Click'); shot('14b_about', st2, true);
  if (!ADMIN) { const sc = app().open('Scan'); sc.fire('BarcodeScanner1.AfterScan', { result: 'SS-TEST-99' }); shot('12b_scan_unknown', sc); }
  if (ADMIN) {
    const ak = d.open('Ask'); shot('15_ask', ak);
    try { ak.set('TxtAsk', 'Text', 'How many days of curing?'); ak.fire('BtnSend.Click'); ak.fire('ChatBot1.GotResponse', { responseText: 'Keep the wall wet for at least 7 days. Ask your supervisor if unsure.' }); shot('15b_ask_answer', ak); } catch (e) { /* state not reachable */ }
    const sf = d.open('Safety'); sf.fire('BtnTakePhoto.Click'); sf.callProc('showHelmet', [['helmet', 0.92], ['no_helmet', 0.08]]); shot('16_safety_ok', sf);
    sf.callProc('showHelmet', [['helmet', 0.2], ['no_helmet', 0.8]]); shot('16b_safety_no', sf);
    // Supervisor mode
    const sv = app(); sv.now = Date.parse('2026-12-06T10:00:00+05:30');
    const SE = sv.open('Settings'); SE.fire('BtnSupervisor.Click'); const K = sv.top; shot('17_sup_pin', K);
    K.set('PwdPin', 'Text', '4826'); K.fire('BtnPinOk.Click');
    for (const [nm, ix] of [['Ramesh', 1], ['Sunita', 2]]) { K.set('TxtWName', 'Text', nm); K.fire('LpTrade.BeforePicking'); K.set('LpTrade', 'SelectionIndex', ix); K.fire('LpTrade.AfterPicking'); K.fire('BtnAddW.Click'); }
    shot('17b_sup_table', K, true);
    // Admin panel, with the same backend harness the tests use
    const { makeBackend } = require('./test-backend.js');
    const BK = makeBackend({ props: { ADMIN_SETUP: 'admin@example.com|Admin|admin-pass-123' } });
    BK.api.setupFirstAdmin();
    const T0 = BK.post({ action: 'login', email: 'admin@example.com', password: 'admin-pass-123' }).token;
    BK.post({ action: 'addMember', token: T0, email: 'rev@example.com', name: 'Reviewer', role: 'Reviewer', qualification: 'M.E.', password: 'review-pass-1' });
    const ad = new App({ lang }, BK); const S = ad.open('Settings'); S.fire('BtnAbout.Click');
    for (let i = 0; i < 5; i++) S.fire('BtnVersion.Click');
    const AD = ad.top;
    const loginAs = (e, p) => { AD.set('TxtUrl', 'Text', 'https://script.google.com/macros/s/TEST/exec').set('TxtEmail', 'Text', e).set('PwdPass', 'Text', p); AD.fire('BtnLogin.Click'); };
    shot('20_adm_login', AD);
    loginAs('admin@example.com', 'nope'); shot('20b_adm_login_wrong', AD);
    loginAs('admin@example.com', 'admin-pass-123'); shot('21_adm_dashboard', AD, true);
    AD.fire('BtnNew.Click'); shot('22_adm_new', AD, true);
    AD.fire('LpModule.BeforePicking'); AD.set('LpModule', 'Selection', AD.get('LpModule', 'Elements')[3]); AD.fire('LpModule.AfterPicking');
    for (const [k, v] of Object.entries({ TxtDur: '6', TxtTitle: 'Reinforcement – Basic', TxtDesc: 'How to cut, bend and tie bars.', TxtObj: 'Fix bars with the right cover.', TxtMat: 'Steel bars\nBinding wire', TxtSafe: 'Wear gloves.', TxtMist: 'No cover blocks' })) AD.set(k, 'Text', v);
    AD.fire('BtnSaveText.Click'); shot('23_adm_editor', AD, true);
    AD.fire('BtnSteps.Click'); AD.fire('BtnCam.Click'); shot('24_adm_steps', AD, true); AD.fire('Admin.BackPressed');
    AD.fire('BtnQuiz.Click'); shot('25_adm_quiz', AD, true); AD.fire('Admin.BackPressed');
    AD.fire('BtnBack.Click');
    AD.fire('BtnQrOpen.Click'); AD.set('LvQr', 'SelectionIndex', 1); try { AD.fire('LvQr.AfterPicking'); } catch (e) { /* ok */ } shot('26_adm_qr', AD, true); AD.fire('Admin.BackPressed');
    AD.fire('BtnTextsOpen.Click'); AD.set('LvTexts', 'SelectionIndex', 1); try { AD.fire('LvTexts.AfterPicking'); } catch (e) { /* ok */ } shot('27_adm_texts', AD, true); AD.fire('Admin.BackPressed');
    AD.fire('BtnLogout.Click'); loginAs('rev@example.com', 'review-pass-1');
    AD.set('LvAdmLessons', 'SelectionIndex', 1); AD.fire('LvAdmLessons.AfterPicking'); shot('28_adm_review', AD, true);
  }
  return L;
}

fs.mkdirSync(OUT, { recursive: true });
const made = [];
for (const lang of LANGS) {
  for (const st of states(lang)) {
    if (ONLY && !st.id.includes(ONLY)) continue;
    const f = path.join(OUT, `${st.id}_${lang}.html`); fs.writeFileSync(f, st.html);
    const png = f.replace(/\.html$/, '.png');
    try {
      execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--user-data-dir=${path.join(require('os').tmpdir(), 'ss_prev_' + process.pid + '_' + made.length)}`,
        '--force-device-scale-factor=2', '--virtual-time-budget=2000', `--window-size=${W},${st.tall ? 1560 : H}`, `--screenshot=${png}`, 'file:///' + f.replace(/\\/g, '/')], { stdio: 'ignore' });
    } catch (e) { /* chrome returns non-zero sometimes even when the PNG is written */ }
    made.push(path.basename(png));
  }
}
fs.writeFileSync(path.join(OUT, 'index.html'), `<!doctype html><meta charset="utf-8"><title>App preview</title><body style="background:#333;font:13px sans-serif;color:#eee;display:flex;flex-wrap:wrap;gap:14px;padding:14px">` +
  made.map((m) => `<figure style="margin:0"><img src="${m}" width="270"><figcaption>${m}</figcaption></figure>`).join(''));
console.log(`${made.length} screens -> ${path.relative(ROOT, OUT)}`);
