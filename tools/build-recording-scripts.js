// SITE SAATHI - audio recording scripts (Day 8): one script per lesson per language, from the sheet CSVs.
// Output: content/audio/Recording_Scripts.html (print it; the reader reads it slowly in a quiet room, AUD-3)
// Run: node tools/build-design-data.js && node tools/build-recording-scripts.js
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
global.window = {}; require(path.join(ROOT, 'design', 'data.js'));
const D = window.SS_DATA;
const OUT = path.join(ROOT, 'content', 'audio');
fs.mkdirSync(OUT, { recursive: true });
const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const STEP = { mr: 'पायरी', hi: 'चरण', en: 'Step' };
const LANG = { mr: 'मराठी', hi: 'हिंदी', en: 'English' };
const WPM = 95;   // slow, clear reading speed (words per minute) used for the estimate

const list = [];
let body = '';
for (const id of [...new Set(D.lessons.map((r) => r.id))]) for (const lang of ['mr', 'hi', 'en']) {
  const L = D.lessons.find((r) => r.id === id && r.lang === lang); if (!L) continue;
  const S = (k) => D.strings[k][lang];
  const parts = [L.title + '.', L.objective,
    ...L.steps.map((s, i) => `${STEP[lang]} ${i + 1}. ${s}`),
    S('lbl_safety') + '. ' + L.safety.join(' '),
    S('lbl_mistakes') + ': ' + L.mistakes.join(', ') + '.'];
  const words = parts.join(' ').split(/\s+/).length, min = words / WPM;
  const ok = min >= 1 && min <= 3;
  list.push({ file: L.audio, words, min: min.toFixed(1), ok });
  body += `<section><h2>${esc(L.audio)} <small>${LANG[lang]} · ${id} · ~${min.toFixed(1)} min (${words} words)${ok ? '' : ' · <b style="color:#DC2626">outside 1–3 min</b>'}</small></h2>
    <ol class="read" lang="${lang}">${parts.map((p, i) => `<li${i === 1 ? ' class="gap"' : ''}>${esc(p)}</li>`).join('')}</ol>
    <p class="tick">Recorded <span class="box"></span> &nbsp; Listened back, clear <span class="box"></span> &nbsp; Reader (first name): __________ &nbsp; Take no.: ____</p></section>`;
}
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Audio Recording Scripts</title>
<style>body{margin:0;background:#F3F1EC;color:#1B1F24;font:15px/1.6 system-ui,"Segoe UI","Nirmala UI",sans-serif}
.page{max-width:820px;margin:16px auto;background:#fff;padding:26px 30px;border:1px solid #e3dfd7}
h1{font-size:21px;margin:0}h2{font-size:17px;margin:0 0 6px}h2 small{font-weight:400;color:#5B6068;font-size:13px;display:block}
section{border-top:4px solid #FFC21A;padding-top:12px;margin-top:22px;break-before:page}
.read{font-size:19px;line-height:1.7;padding-left:26px}.read li{margin:6px 0}.gap{margin-bottom:14px!important}
.box{display:inline-block;width:13px;height:13px;border:1.5px solid #1B1F24;vertical-align:-2px}.tick{font-size:13px;color:#5B6068}
table{border-collapse:collapse;width:100%}td,th{border:1px solid #d6d2ca;padding:5px 8px;text-align:left}th{background:#1B1F24;color:#fff}
.tips{background:#FFF4D1;border-left:5px solid #FFC21A;padding:8px 14px}
@media print{body{background:#fff}.page{margin:0;border:0}} @media(max-width:600px){.page{padding:18px 16px;margin:0}}</style></head>
<body><div class="page"><h1>Audio recording scripts · 3 lessons × 3 languages</h1>
<p style="color:#5B6068">SITE SAATHI · built ${D.built} from the sheet. <b>Record only after the expert review and native-speaker check</b>, so the audio matches the final text.</p>
<div class="tips"><b>How to record (AUD-2, AUD-3):</b> native speaker · quiet closed room, fan off · phone 20 cm from mouth · slow, clear voice · 1 second pause between lines · say each step number · one file per lesson per language, 1–3 minutes · re-record any unclear take.</div>
<h2 style="margin-top:18px">Files to record</h2>
<table><tr><th>File name</th><th>Words</th><th>Estimated length</th></tr>${list.map((x) => `<tr><td>${x.file}</td><td>${x.words}</td><td>~${x.min} min${x.ok ? '' : ' (check)'}</td></tr>`).join('')}</table>
${body}</div></body></html>`;
fs.writeFileSync(path.join(OUT, 'Recording_Scripts.html'), html);
console.table(list);
