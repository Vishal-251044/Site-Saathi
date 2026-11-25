// SITE SAATHI - Day 13 testing documents
//  testing/Test_Kit.html        printable sheets for phone tests and 3-5 testers (functional, offline, usability, words)
//  testing/Testing_Report.html  report: laptop-simulation results filled automatically; phone + user sections left for REAL observations
// Run after: node tools/sim-aia.js --report && node tools/prerelease-check.js
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'testing');
fs.mkdirSync(OUT, { recursive: true });
const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const read = (f) => (fs.existsSync(path.join(OUT, f)) ? JSON.parse(fs.readFileSync(path.join(OUT, f), 'utf8')) : null);
const sim = read('automated_results.json'), pre = read('prerelease.json');

// Functional (8) and offline (7) lists. Derived from PRD 06 success metrics and 11.6 demo flow, because the
// original BRD wording is not in Doc/. Replace with the BRD wording if it differs.
const FUNCTIONAL = [
  'App opens: splash, then Language (first time) or Home',
  'Chosen language is saved and used on every screen',
  'Start learning → module → lesson opens with pictures and steps',
  'Audio plays for the lesson in the chosen language',
  'Each printed QR opens the right lesson; SS-TEST-99 shows the clear message',
  'Quiz: 5 questions, right / wrong shown, score = manual count',
  'My Skills shows completed lessons and best scores',
  'Settings: language and text size change; reset asks first',
];
const OFFLINE = ['Turn on airplane mode', 'Open the app (from closed)', 'Open each of the 3 lessons and go through every step', 'Play the audio of a lesson', 'Do a full quiz and see the result', 'Scan each QR poster and type one code', 'Close and reopen the app: My Skills still shows the score'];
const USABILITY = ['Choose your language', 'Find the brick masonry lesson', 'What does this picture show? (3 pictures)', 'Finish a quiz and tell me your score'];
const PICTURES = [['SS-MAS-01_s5.jpg', 'joints staggered, frog up; joints in one line crack'], ['SS-CON-01_s6.jpg', 'vibrate until air bubbles stop'], ['SS-SAF-01_s3.jpg', 'harness tied to a strong point on scaffolding']];

const CSS = `:root{--y:#FFC21A;--k:#1B1F24;--r:#DC2626;--g:#15A34A;--line:#d6d2ca}*{box-sizing:border-box}
body{margin:0;background:#F3F1EC;color:var(--k);font:14px/1.5 system-ui,"Segoe UI","Nirmala UI",sans-serif}
.page{max-width:880px;margin:16px auto;background:#fff;padding:26px 30px;border:1px solid #e3dfd7}
.bar{height:10px;margin:-26px -30px 18px;background:repeating-linear-gradient(-45deg,var(--y) 0 14px,var(--k) 14px 28px)}
h1{font-size:21px;margin:0}h2{font-size:16px;margin:22px 0 8px;border-bottom:3px solid var(--y);padding-bottom:3px}h3{font-size:14px;margin:14px 0 6px}
.meta{color:#555;margin:4px 0 0}.note{background:#FFF4D1;border-left:5px solid var(--y);padding:8px 12px;margin:10px 0}.warn{background:#FDECEC;border-left:5px solid var(--r);padding:8px 12px;margin:10px 0}
table{width:100%;border-collapse:collapse;margin:6px 0}td,th{border:1px solid var(--line);padding:6px 8px;vertical-align:top;text-align:left}
th{background:var(--k);color:#fff;font-size:12.5px}.c{text-align:center;width:60px}.pass{color:var(--g);font-weight:700}.fail{color:var(--r);font-weight:700}
.box{display:inline-block;width:12px;height:12px;border:1.5px solid var(--k);vertical-align:-2px}.h{height:30px}.pb{break-before:page}
img.p{width:220px;border:1px solid var(--line);border-radius:6px}
@media print{body{background:#fff}.page{margin:0;border:0;max-width:none}tr{break-inside:avoid}}
@media(max-width:620px){.page{padding:18px 14px;margin:0}.bar{margin:-18px -14px 14px}}`;
const doc = (title, body) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><style>${CSS}</style></head><body><div class="page"><div class="bar"></div>${body}</div></body></html>`;
const blankRows = (n, cols) => Array.from({ length: n }, () => `<tr>${'<td class="h"></td>'.repeat(cols)}</tr>`).join('');
const tick = '<span class="box"></span>';

// ---------------- Test kit ----------------
const kit = doc('Test Kit', `
<h1>SITE SAATHI · Day 13 test kit</h1>
<p class="meta">Mon 30 Nov 2026 · app version ${esc((sim && sim.app_version) || '?')} · print: page 1 ×1, phone pages ×2 (one per phone), tester pages ×5</p>
<div class="note"><b>Rules:</b> testers are workers or classmates who agree. Write them as <b>T1–T5</b>, no names or phone numbers. Do not help unless they are stuck for more than 1 minute; if you help, mark "help". Write what they <b>say and do</b>, not what you think. If a task was not done, write "not tested".</div>
<p><b>Consent script (read aloud):</b> "This is a free learning app I am building for construction workers. I want to see if it is easy to use. I am testing the app, not you. I will not write your name. You can stop any time. Is that OK?"</p>
<table><tr><th>Tester</th><th>Worker / classmate</th><th>Trade</th><th>Language used</th><th>Own smartphone?</th><th>Agreed ${tick}</th></tr>
${['T1', 'T2', 'T3', 'T4', 'T5'].map((t) => `<tr><td>${t}</td><td></td><td></td><td></td><td></td><td></td></tr>`).join('')}</table>

<h2 class="pb">A · Functional test (one sheet per phone)</h2>
<table><tr><td style="width:30%">Phone (brand / model)</td><td></td></tr><tr><td>Android version · free storage</td><td></td></tr><tr><td>APK installed from (Drive / USB) · OK?</td><td></td></tr></table>
<table><tr><th>#</th><th>Check</th><th class="c">Pass</th><th class="c">Fail</th><th>What happened (if fail)</th></tr>
${FUNCTIONAL.map((f, i) => `<tr><td>F${i + 1}</td><td>${f}</td><td class="c">${tick}</td><td class="c">${tick}</td><td></td></tr>`).join('')}</table>
<h3>B · Offline test (airplane mode)</h3>
<table><tr><th>#</th><th>Step</th><th class="c">OK</th><th class="c">Problem</th><th>Note</th></tr>
${OFFLINE.map((f, i) => `<tr><td>O${i + 1}</td><td>${f}</td><td class="c">${tick}</td><td class="c">${tick}</td><td></td></tr>`).join('')}</table>
<p style="font-size:12px;color:#555">F1–F8 and O1–O7 are derived from PRD §06 and §11.6 because the original BRD lists are not in Doc/. Use the BRD wording if it is different.</p>

<h2 class="pb">C · Usability (one sheet per tester) · Tester T__</h2>
<p>Give the phone on the Home screen (or first open). Say only the task.</p>
<table><tr><th>#</th><th>Task</th><th class="c">No help</th><th class="c">Hesitated</th><th class="c">Needed help</th><th>Time (s)</th><th>What they said / did</th></tr>
${USABILITY.map((u, i) => `<tr><td>U${i + 1}</td><td>${u}</td><td class="c">${tick}</td><td class="c">${tick}</td><td class="c">${tick}</td><td></td><td></td></tr>`).join('')}</table>
<h3>U3 · Show these 3 pictures in the app (or printed) and ask "What does this show?"</h3>
<table><tr><th>Picture</th><th>Meant to show</th><th>What the tester said</th><th class="c">Understood</th></tr>
${PICTURES.map(([f, m]) => `<tr><td><img class="p" src="../media/${f}" alt="${f}"><br>${f}</td><td>${m}</td><td></td><td class="c">${tick}</td></tr>`).join('')}</table>
<h3>Words the tester did not understand</h3>
<table><tr><th>Word / sentence</th><th>Screen / lesson</th><th>Language</th><th>Word they would use</th></tr>${blankRows(4, 4)}</table>
<h3>Anything else they said</h3><table>${blankRows(3, 1)}</table>

<h2 class="pb">D · Issue log (all phones and testers)</h2>
<table><tr><th>#</th><th>What went wrong</th><th>Screen</th><th>Seen by (phone / tester)</th><th>How often</th><th>Severity H / M / L</th></tr>${blankRows(10, 6)}</table>
<p style="font-size:12px;color:#555">High = blocks the core journey (open → language → lesson → quiz) or is unsafe/wrong content. Medium = confusing, needs help. Low = looks / wording.</p>`);
fs.writeFileSync(path.join(OUT, 'Test_Kit.html'), kit);

// ---------------- Testing report ----------------
const bySection = {};
if (sim) for (const r of sim.results) (bySection[r.section] = bySection[r.section] || []).push(r);
const simTable = sim ? Object.entries(bySection).map(([s, rs]) => `<tr><td>${esc(s)}</td><td class="c">${rs.filter((r) => r.pass).length}/${rs.length}</td><td>${rs.filter((r) => !r.pass).map((r) => `<span class="fail">FAIL</span> ${esc(r.check)} ${esc(r.detail)}`).join('<br>') || '<span class="pass">all passed</span>'}</td></tr>`).join('') : '<tr><td colspan="3">Run node tools/sim-aia.js --report</td></tr>';
const preTable = pre ? pre.rows.map((r) => `<tr><td>${esc(r.rule)}</td><td class="c ${r.pass ? 'pass' : 'fail'}">${r.pass ? 'OK' : 'FIX'}</td><td>${esc(r.detail)}</td></tr>`).join('') : '<tr><td colspan="3">Run node tools/prerelease-check.js</td></tr>';
const report = doc('Testing Report', `
<h1>SITE SAATHI · Testing report (v1.0 MVP)</h1>
<p class="meta">Prepared by Vaibhav C. Jadhav · RIT Sangli · Civilathon · app version ${esc((sim && sim.app_version) || '?')}</p>
<div class="warn"><b>Honesty rule:</b> sections 3–6 contain only what was actually observed on real phones and with real testers. Leave a row empty or write "not tested" rather than guess. Section 1–2 are automatic laptop checks, not user testing.</div>

<h2>1 · Automatic laptop simulation of the app's own blocks</h2>
<p>${sim ? `Ran ${esc(sim.ran_at.slice(0, 16).replace('T', ' '))} on <code>${esc(sim.aia)}</code>: <b>${sim.passed} passed, ${sim.failed} failed</b>.` : ''} The simulator (<code>tools/sim-aia.js</code>) runs the real App Inventor blocks with the real CSV files. It checks logic and content (labels, navigation, scores, QR codes), but <b>not</b> layout, fonts, the camera or the real phone. Phone tests below are still required.</p>
<table><tr><th>Area</th><th class="c">Passed</th><th>Failures</th></tr>${simTable}</table>
<p style="font-size:12.5px">Quiz scoring was compared with a manual count for all 9 lesson-language pairs × 5 answer patterns.</p>

<h2>2 · Pre-release rule checks</h2>
<table><tr><th>Rule</th><th class="c">Result</th><th>Detail</th></tr>${preTable}</table>

<h2>3 · Phones tested</h2>
<table><tr><th>Phone</th><th>Android</th><th>Free storage</th><th>Install OK</th><th>Functional F1–F8 passed</th><th>Offline O1–O7 passed</th></tr>${blankRows(2, 6)}</table>

<h2>4 · Testers and usability</h2>
<p>Target (PRD §06): at least 4 of 5 testers choose a language, find a lesson and finish a quiz without help.</p>
<table><tr><th>Task</th><th>T1</th><th>T2</th><th>T3</th><th>T4</th><th>T5</th><th>Without help</th></tr>
${USABILITY.map((u) => `<tr><td>${u}</td><td></td><td></td><td></td><td></td><td></td><td>/5</td></tr>`).join('')}</table>
<h3>Pictures understood</h3><table><tr><th>Picture</th><th>Understood by</th><th>Comments</th></tr>${PICTURES.map(([f]) => `<tr><td>${f}</td><td>/5</td><td></td></tr>`).join('')}</table>
<h3>Words not understood</h3><table><tr><th>Word</th><th>Language</th><th>By how many</th><th>Replace with</th></tr>${blankRows(3, 4)}</table>

<h2>5 · Actual observations</h2><table><tr><th>Observation (what happened, who, where)</th></tr>${blankRows(6, 1)}</table>

<h2>6 · Ranked fix list (for Day 14)</h2>
<table><tr><th>Rank</th><th>Problem</th><th>Severity</th><th>Fix</th><th>Fixed in version</th><th>Re-tested</th></tr>${blankRows(6, 6)}</table>

<h2>7 · Screenshots</h2><p>Real phone screenshots (power + volume-down): splash, language, Home, module grid, lesson step, safety page, quiz answered, result, scan not-found, My Skills, Settings, About. Save to Drive <code>Builds/screenshots_v1.0/</code>.</p>

<h2>8 · Known limitations at this version</h2>
<ul><li>${pre && pre.rows.some((r) => /audio/i.test(r.rule) && !r.pass) ? 'Lesson audio not yet recorded: play shows "audio not recorded yet".' : 'Audio bundled.'}</li>
<li>Lesson content and translations are drafts until the expert review and native-speaker check are signed (CLAUDE.md content-safety rule).</li>
<li>Home tiles show one text size only (no small English subtitle) — App Inventor Button limit.</li></ul>`);
fs.writeFileSync(path.join(OUT, 'Testing_Report.html'), report);
console.log('Wrote testing/Test_Kit.html and testing/Testing_Report.html');
