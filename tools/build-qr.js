// SITE SAATHI - QR codes + A5 posters (Day 7 + Day 8)
// 1. Makes content/qr/<ID>.png (plain-text QR = lesson ID only, QR-2) with error correction Q (dusty, laminated posters)
// 2. Decodes every PNG back with jsQR to prove it scans to the exact ID
// 3. Writes design/QR_Posters.html (A5, one poster per lesson, names in mr/hi/en from lessons.csv) for print / PDF
// Run: node tools/build-qr.js     (then tools/export-posters.sh for the PDF)
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const ROOT = path.resolve(__dirname, '..');
const qrcode = require('./vendor/qrcode-generator-1.4.4.js');   // MIT, Kazuhiko Arase
const jsQR = require('./vendor/jsQR-1.4.0.js');                  // Apache-2.0, cozmo
const OUT = path.join(ROOT, 'content', 'qr');
fs.mkdirSync(OUT, { recursive: true });

const CODES = ['SS-MAS-01', 'SS-CON-01', 'SS-SAF-01', 'SS-TEST-99'];   // PRD 13.4 + test code

function png(w, h, rgba) {
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(zlib.crc32(td) >>> 0); return Buffer.concat([l, td, c]); };
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  const hd = Buffer.alloc(13); hd.writeUInt32BE(w, 0); hd.writeUInt32BE(h, 4); hd[8] = 8; hd[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', hd), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const report = [];
const svgs = {};
for (const code of CODES) {
  const qr = qrcode(0, 'Q'); qr.addData(code, 'Byte'); qr.make();
  const n = qr.getModuleCount(), quiet = 4, px = 20, size = (n + quiet * 2) * px;
  const rgba = Buffer.alloc(size * size * 4, 255);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c))
    for (let y = 0; y < px; y++) for (let x = 0; x < px; x++) {
      const i = (((r + quiet) * px + y) * size + (c + quiet) * px + x) * 4;
      rgba[i] = 0x1B; rgba[i + 1] = 0x1F; rgba[i + 2] = 0x24;
    }
  fs.writeFileSync(path.join(OUT, `${code}.png`), png(size, size, rgba));
  const svg = qr.createSvgTag({ cellSize: 10, margin: 40, scalable: true }).replace(/fill="black"/g, 'fill="#1B1F24"');
  fs.writeFileSync(path.join(OUT, `${code}.svg`), svg);
  svgs[code] = svg;
  const read = jsQR(new Uint8ClampedArray(rgba), size, size);
  report.push({ code, version: (n - 17) / 4, modules: n, png_px: size, decoded: read && read.data, ok: !!read && read.data === code });
}
console.table(report);
if (report.some((r) => !r.ok)) { console.error('QR CHECK FAILED'); process.exit(1); }

// ---------- posters ----------
global.window = {}; require(path.join(ROOT, 'design', 'data.js'));
const D = window.SS_DATA;
const title = (id, lang) => (D.lessons.find((r) => r.id === id && r.lang === lang) || {}).title;
const S = (k, l) => D.strings[k][l];
const place = { 'SS-MAS-01': 'Brick masonry work area', 'SS-CON-01': 'Mixer / concreting area', 'SS-SAF-01': 'Site entrance, notice board', 'SS-TEST-99': 'TEST ONLY — do not put on site' };
const posters = CODES.map((code) => {
  const test = code === 'SS-TEST-99';
  const mod = code.slice(3, 6).toLowerCase();
  const names = test ? ['परीक्षण कोड', 'परीक्षण कोड', 'Test code – not a lesson'] : ['mr', 'hi', 'en'].map((l) => title(code, l));
  return `<section class="poster${test ? ' test' : ''}">
  <div class="stripe"></div>
  <header><img src="../brand/logo_yellow_512.png" alt=""><div class="wm">SITE <span>SAATHI</span></div>${test ? '' : `<img class="mod" src="icons/icon_mod_${mod}.svg" alt="">`}</header>
  <div class="qr">${svgs[code]}</div>
  <div class="code">${code}</div>
  <div class="names"><div class="mr">${names[0]}</div><div class="hi">${names[1]}</div><div class="en">${names[2]}</div></div>
  <div class="how"><svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M10.5 18.5h3"/><rect x="9" y="6.5" width="6" height="6" rx="1"/></svg>
    <div>${S('btn_scan', 'mr')} · ${S('btn_scan', 'hi')} · ${S('btn_scan', 'en')}</div></div>
  <footer>${test ? 'Prints the "not in the app yet" message (QR-3). For testing only.' : `Place: ${place[code]} · works offline`}</footer>
  <div class="stripe"></div>
</section>`;
}).join('\n');

const html = `<!doctype html>
<html lang="mr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>QR Posters A5</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@800&family=Noto+Sans:wght@600;700&display=swap">
<style>
@font-face { font-family:"Deva"; src:url("../brand/fonts/font_deva_bold.ttf"); font-weight:700; }
@page { size:A5 portrait; margin:0; }
* { box-sizing:border-box; }
body { margin:0; background:#ECEAE4; font-family:"Noto Sans","Deva",sans-serif; color:#1B1F24; }
.poster { width:148mm; height:210mm; margin:10mm auto; background:#fff; display:flex; flex-direction:column; align-items:center; overflow:hidden; page-break-after:always; break-after:page; }
.stripe { width:100%; height:9mm; flex:none; background:repeating-linear-gradient(-45deg,#FFC21A 0 7mm,#1B1F24 7mm 14mm); }
header { width:100%; display:flex; align-items:center; gap:4mm; padding:5mm 10mm 0; }
header img { width:16mm; height:16mm; } header .mod { margin-left:auto; width:15mm; height:15mm; background:#FFF4D1; border-radius:3mm; padding:1.5mm; }
.wm { font:800 13mm/1 "Barlow Condensed",sans-serif; } .wm span { color:#C2410C; }
.qr { width:98mm; height:98mm; margin-top:4mm; border:1.2mm solid #1B1F24; border-radius:4mm; }
.qr svg { width:100%; height:100%; display:block; }
.code { margin-top:3mm; font:800 13mm/1 "Barlow Condensed",sans-serif; letter-spacing:.5mm; background:#FFC21A; padding:1.5mm 5mm; border-radius:2mm; }
.names { text-align:center; margin-top:3mm; line-height:1.3; } .names .mr, .names .hi { font:700 6.4mm "Deva",sans-serif; } .names .en { font:700 5.2mm "Noto Sans",sans-serif; }
.how { display:flex; align-items:center; gap:3mm; margin-top:auto; font:700 4.2mm "Noto Sans","Deva",sans-serif; padding:0 8mm; }
footer { font:600 3.2mm "Noto Sans",sans-serif; color:#5B6068; margin:2mm 0 3mm; }
.test .code { background:#FDECEC; border:0.8mm solid #DC2626; }
@media print { body { background:#fff; } .poster { margin:0; } }
@media screen and (max-width:600px) { .poster { transform-origin:top left; } }
</style></head>
<body>
${posters}
</body></html>`;
fs.writeFileSync(path.join(ROOT, 'design', 'QR_Posters.html'), html);
console.log('Wrote content/qr/*.png|svg and design/QR_Posters.html');
