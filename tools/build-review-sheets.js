// SITE SAATHI - printable review packets, built from the sheet CSVs (via design/data.js)
//  content/review/<ID>_Review_Sheet.html  -> expert (civil engineer): English text, pictures, quiz, values to confirm, sign-off
//  content/review/Translation_Check.html  -> native speakers: en | mr | hi side by side, with OK boxes
// Run: node tools/build-design-data.js && node tools/build-review-sheets.js
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
global.window = {}; require(path.join(ROOT, 'design', 'data.js'));
const D = window.SS_DATA;
const OUT = path.join(ROOT, 'content', 'review');
fs.mkdirSync(OUT, { recursive: true });
const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const row = (id, lang) => D.lessons.find((r) => r.id === id && r.lang === lang);
const quiz = (id, lang) => D.quiz.filter((q) => q.lesson_id === id && q.lang === lang).sort((a, b) => a.q_no - b.q_no);

// Values the expert must confirm (numbers and rules that differ between sites)
const VALUES = {
  'SS-MAS-01': ['Soak until no more air bubbles come out', 'Example mortar ratio 1 : 6 (cement : sand)', 'Use mortar within 30 minutes of mixing', 'Joint thickness about 10 mm', 'Frog facing up', 'Curing 7 days', 'Maximum height of brickwork in one day (for "Building too high in one day")'],
  'SS-CON-01': ['Mix in the mixer for about 2 minutes', 'Place within about 30 minutes of mixing', 'Maximum free-fall height when placing (for "Do not drop it from a big height")', 'Vibrate until air bubbles stop; do not over-vibrate', 'Curing at least 7 days (does it change for the cement used on site?)', 'Formwork and steel checked by supervisor/engineer before pouring'],
  'SS-SAF-01': ['PPE list: helmet, safety shoes, gloves, reflective jacket, harness at height', 'Harness tied to a strong point (anchor rule on this site)', 'Lifting: bent knees, straight back, ask for help', 'Only the electrician touches boards and wires', 'First-aid: tell supervisor at once; first-aid box location known', 'Any site rule missing (e.g. permit to work, barricading)?'],
};
const CSS = `:root{--y:#FFC21A;--k:#1B1F24;--r:#DC2626;--g:#15A34A;--line:#d6d2ca}*{box-sizing:border-box}
body{margin:0;background:#F3F1EC;color:var(--k);font:14px/1.5 system-ui,"Segoe UI","Nirmala UI",sans-serif}
.page{max-width:860px;margin:16px auto;background:#fff;padding:28px 32px;border:1px solid #e3dfd7}
.bar{height:10px;margin:-28px -32px 20px;background:repeating-linear-gradient(-45deg,var(--y) 0 14px,var(--k) 14px 28px)}
h1{font-size:21px;margin:0}h2{font-size:16px;margin:22px 0 8px;border-bottom:3px solid var(--y);padding-bottom:3px}
.meta{color:#555;margin:4px 0 0}.draft{background:#FFF4D1;border-left:5px solid var(--y);padding:8px 12px;margin:12px 0}
table{width:100%;border-collapse:collapse}td,th{border:1px solid var(--line);padding:6px 8px;vertical-align:top;text-align:left}
th{background:var(--k);color:#fff;font-size:13px}.step{display:grid;grid-template-columns:200px 1fr 90px;gap:12px;border-bottom:1px solid var(--line);padding:10px 0;break-inside:avoid}
.step img{width:200px;border:1px solid var(--line);border-radius:6px}.ok{font-size:12px;color:#555}.box{display:inline-block;width:12px;height:12px;border:1.5px solid var(--k);margin-right:4px;vertical-align:-2px}
.safety{border:2px solid var(--r);background:#FDECEC;border-radius:8px;padding:8px 14px}.mistake{border:2px solid var(--y);background:#FFF8E1;border-radius:8px;padding:8px 14px;margin-top:8px}
.right{color:var(--g);font-weight:700}.lines{border-bottom:1px solid var(--line);height:26px}.pb{break-before:page}
@media print{body{background:#fff}.page{margin:0;border:0;max-width:none}tr{break-inside:avoid}}
@media (max-width:600px){.page{padding:20px 16px;margin:0}.bar{margin:-20px -16px 16px}.step{grid-template-columns:1fr}.step img{width:100%}}`;
const doc = (title, body) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><style>${CSS}</style></head><body>${body}</body></html>`;

const ids = [...new Set(D.lessons.map((r) => r.id))];
for (const id of ids) {
  const L = row(id, 'en'); if (!L) continue;
  const body = `<div class="page"><div class="bar"></div>
  <h1>Content review · ${id} · ${esc(L.title)}</h1>
  <p class="meta">SITE SAATHI (Civilathon · RIT Sangli) · English draft · built ${D.built} · please return by <b>Wed 25 Nov 2026</b></p>
  <div class="draft"><b>Draft for expert review.</b> Text was drafted with an AI assistant and edited by the developer. Pictures are simple drawings without words (real site photos may replace them). Please mark anything unsafe, wrong or different from local practice. Workers will read this in Marathi, Hindi or English, with audio. Any change you make will be applied to all three languages.</div>
  <table><tr><th style="width:25%">Field</th><th>Text</th></tr>
  <tr><td>Description</td><td>${esc(L.desc)}</td></tr><tr><td>Objective</td><td>${esc(L.objective)}</td></tr>
  <tr><td>Materials and tools</td><td>${L.materials.map(esc).join(' · ')}</td></tr><tr><td>Duration</td><td>${L.duration_min} min</td></tr></table>
  <h2>Steps (one per screen)</h2>
  ${L.steps.map((s, i) => `<div class="step"><img src="../../media/${L.img[i]}" alt="Step ${i + 1}"><div><b>${i + 1}.</b> ${esc(s)}</div><div class="ok"><span class="box"></span>OK<br><span class="box"></span>Change</div></div>`).join('')}
  <h2>Safety and common mistakes</h2>
  <div class="safety"><b>Safety precautions</b><ul style="margin:4px 0">${L.safety.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
  <div class="mistake"><b>Common mistakes</b><ul style="margin:4px 0">${L.mistakes.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
  <h2>Quiz (correct answer in green)</h2>
  <table><tr><th>#</th><th>Question and options</th><th>Explanation shown to worker</th><th style="width:60px">OK?</th></tr>
  ${quiz(id, 'en').map((q) => `<tr><td>${q.q_no}</td><td>${esc(q.question)}<br>${['A', 'B', 'C', 'D'].map((k) => k === q.correct ? `<span class="right">${k} ${esc(q[k.toLowerCase()])}</span>` : `${k} ${esc(q[k.toLowerCase()])}`).join(' · ')}</td><td>${esc(q.explanation)}</td><td></td></tr>`).join('')}</table>
  <h2>Values to confirm</h2>
  <table><tr><th>Value or rule</th><th style="width:45%">OK / change to</th></tr>${(VALUES[id] || []).map((v) => `<tr><td>${esc(v)}</td><td></td></tr>`).join('')}</table>
  <h2>Other comments</h2><div class="lines"></div><div class="lines"></div><div class="lines"></div>
  <h2>Sign-off</h2>
  <table><tr><td style="width:35%">Decision</td><td><span class="box"></span>Approved &nbsp; <span class="box"></span>Approved with the changes above &nbsp; <span class="box"></span>Not approved</td></tr>
  <tr><td>Reviewer name</td><td></td></tr><tr><td>Qualification / role</td><td></td></tr><tr><td>Date and signature</td><td></td></tr>
  <tr><td>May we show "Reviewed by: name, qualification" in the app?</td><td><span class="box"></span>Yes &nbsp; <span class="box"></span>No</td></tr></table></div>`;
  fs.writeFileSync(path.join(OUT, `${id}_Review_Sheet.html`), doc(`${id} Review Sheet`, body));
}

// ---------- translation check (native speakers) ----------
const tri = (label, en, mr, hi) => `<tr><td><b>${label}</b><br>${esc(en)}</td><td lang="mr">${esc(mr)}</td><td class="c"><span class="box"></span></td><td lang="hi">${esc(hi)}</td><td class="c"><span class="box"></span></td></tr>`;
const head = `<tr><th style="width:28%">English (source)</th><th>मराठी</th><th style="width:44px">mr OK</th><th>हिंदी</th><th style="width:44px">hi OK</th></tr>`;
let tbody = '';
for (const id of ids) {
  const [e, m, h] = ['en', 'mr', 'hi'].map((l) => row(id, l));
  if (!e || !m || !h) continue;
  tbody += `<h2 class="pb">${id} · ${esc(e.title)}</h2><table>${head}
    ${tri('Title', e.title, m.title, h.title)}${tri('Description', e.desc, m.desc, h.desc)}${tri('Objective', e.objective, m.objective, h.objective)}
    ${e.materials.map((x, i) => tri(`Material ${i + 1}`, x, m.materials[i], h.materials[i])).join('')}
    ${e.steps.map((x, i) => tri(`Step ${i + 1}`, x, m.steps[i], h.steps[i])).join('')}
    ${e.safety.map((x, i) => tri(`Safety ${i + 1}`, x, m.safety[i], h.safety[i])).join('')}
    ${e.mistakes.map((x, i) => tri(`Mistake ${i + 1}`, x, m.mistakes[i], h.mistakes[i])).join('')}
    ${quiz(id, 'en').map((q, i) => { const qm = quiz(id, 'mr')[i], qh = quiz(id, 'hi')[i]; const all = (x) => `${x.question} — A ${x.a} · B ${x.b} · C ${x.c} · D ${x.d} (correct ${x.correct}) — ${x.explanation}`; return tri(`Quiz ${q.q_no}`, all(q), all(qm), all(qh)); }).join('')}</table>`;
}
tbody += `<h2 class="pb">App labels (strings.csv)</h2><table>${head}${Object.entries(D.strings).map(([k, v]) => tri(k, v.en, v.mr, v.hi)).join('')}</table>`;
fs.writeFileSync(path.join(OUT, 'Translation_Check.html'), doc('Translation Check', `<div class="page"><div class="bar"></div>
  <h1>Translation check · Marathi and Hindi</h1>
  <p class="meta">SITE SAATHI · built ${D.built} · AI-drafted translations · for one native Marathi speaker and one native Hindi speaker</p>
  <div class="draft"><b>Please check:</b> simple words a site worker uses (मसाला, ओळंबा, थापी, सळई / करनी, साहुल, सरिया, गिट्टी), short sentences, correct meaning, no wrong numbers. Write the better word next to the text and tick OK when a row is fine. Do not change numbers (mm, minutes, days) — those are checked by the engineer.</div>
  <table><tr><td style="width:35%">Marathi checker (first name)</td><td></td></tr><tr><td>Hindi checker (first name)</td><td></td></tr><tr><td>Date</td><td></td></tr></table>
  <style>.c{text-align:center}</style>${tbody}</div>`));
console.log(`Wrote ${ids.length} review sheets + Translation_Check.html to content/review/`);
