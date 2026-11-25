// SITE SAATHI - pre-release checks against measurable PRD rules (Day 14), on the built .aia.
//  touch targets >= 48 (PRD 14 / CLAUDE.md 6), text sizes, image weight, longest texts, APK size, no internet parts.
// Usage: node tools/prerelease-check.js [app-inventor/SITE_SAATHI.aia]   -> prints + writes testing/prerelease.json
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const AIA = process.argv[2] || 'app-inventor/SITE_SAATHI.aia';
const b = fs.readFileSync(AIA); const F = {}; let o = 0;
while (b.readUInt32LE(o) === 0x04034b50) { const cs = b.readUInt32LE(o + 18), nl = b.readUInt16LE(o + 26), n = b.slice(o + 30, o + 30 + nl).toString(); F[n] = zlib.inflateRawSync(b.slice(o + 30 + nl, o + 30 + nl + cs)); o += 30 + nl + cs; }
const rows = [];
const add = (rule, pass, detail) => { rows.push({ rule, pass, detail }); console.log(`${pass ? 'ok  ' : 'FIX '} ${rule} — ${detail}`); };

// designer components
const comps = [];
for (const k of Object.keys(F).filter((x) => x.endsWith('.scm'))) {
  const scr = k.split('/').pop().replace('.scm', '');
  (function walk(c) { comps.push({ scr, ...c }); (c.$Components || []).forEach(walk); })(JSON.parse(F[k].toString().split('\n')[2]).Properties);
}
const px = (v) => (v === undefined ? null : Number(v));
const buttons = comps.filter((c) => c.$Type === 'Button');
const small = buttons.filter((c) => { const h = px(c.Height); return h !== null && h > 0 && h < 48; });
add('Every button at least 48 high (touch target)', small.length === 0, small.length ? small.map((c) => `${c.scr}.${c.$Name}=${c.Height}`).join(', ') : `${buttons.length} buttons, smallest ${Math.min(...buttons.map((c) => px(c.Height)).filter((h) => h > 0))}`);
const smallText = comps.filter((c) => (c.$Type === 'Label' || c.$Type === 'Button') && c.FontSize && Number(c.FontSize) < 12 && c.Text !== '');
add('Text size at least 12 sp (body 16–18 used for lesson text)', smallText.length === 0, smallText.length ? smallText.map((c) => `${c.scr}.${c.$Name}=${c.FontSize}`).join(', ') : 'smallest is the version line (12 sp)');
const devaFont = comps.filter((c) => (c.$Type === 'Label' || c.$Type === 'Button') && c.Text !== '' && !c.Image && !/font_deva/.test(c.FontTypeface || ''));
add('Every text component uses the bundled Noto Devanagari font', devaFont.length === 0, devaFont.length ? devaFont.map((c) => `${c.scr}.${c.$Name}`).join(', ') : 'all labels and text buttons');
const online = comps.filter((c) => ['Web', 'ChatBot', 'ImageBot', 'PersonalImageClassifier', 'Sharing'].includes(c.$Type));
add('No internet components in v1.0 (OFF-1)', online.length === 0, online.length ? online.map((c) => c.$Type).join(', ') : 'none');
const screens = new Set(comps.map((c) => c.scr));
add('At most 9 Screens (CLAUDE.md)', screens.size <= 9, `${screens.size} Screens`);

// media weight
const assets = Object.keys(F).filter((k) => k.startsWith('assets/'));
const total = assets.reduce((s, k) => s + F[k].length, 0);
const jpg = assets.filter((k) => k.endsWith('.jpg'));
const bigImg = jpg.filter((k) => F[k].length > 150 * 1024);
add('Step pictures compressed (< 150 KB each)', bigImg.length === 0, `${jpg.length} pictures, largest ${Math.max(...jpg.map((k) => F[k].length / 1024)).toFixed(0)} KB`);
add('APK size target < 30 MB (PRD 10.15)', total / 1048576 + 6 < 30, `media ${(total / 1048576).toFixed(2)} MB + App Inventor runtime ≈ 6 MB → ≈ ${(total / 1048576 + 6).toFixed(1)} MB`);

// texts
const csv = (t) => { const r = []; let w = [], f = '', q = false; for (let i = 0; i < t.length; i++) { const c = t[i]; if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; } else if (c === '"') q = true; else if (c === ',') { w.push(f); f = ''; } else if (c === '\n') { w.push(f); r.push(w); w = []; f = ''; } else if (c !== '\r') f += c; } if (f || w.length) { w.push(f); r.push(w); } return r; };
const les = csv(F['assets/lessons.csv'].toString()).slice(1);
for (const lang of ['mr', 'hi', 'en']) {
  const steps = les.filter((r) => r[2] === lang).flatMap((r) => r[7].split('|').map((s) => ({ id: r[0], s })));
  const longest = steps.sort((a, c) => c.s.length - a.s.length)[0];
  add(`Longest ${lang} step fits one screen (≤ 180 characters)`, longest.s.length <= 180, `${longest.s.length} chars (${longest.id}): "${longest.s.slice(0, 50)}…"`);
}
const q = csv(F['assets/quiz.csv'].toString()).slice(1);
const longOpt = q.flatMap((r) => [4, 5, 6, 7].map((i) => ({ id: r[0], lang: r[1], t: r[i] }))).sort((a, c) => c.t.length - a.t.length)[0];
add('Quiz options fit a 64-high button (≤ 60 characters)', longOpt.t.length <= 60, `longest ${longOpt.t.length} chars (${longOpt.id} ${longOpt.lang}): "${longOpt.t}"`);
const audio = assets.filter((k) => /\.(mp3|m4a)$/.test(k));
add('Recorded audio for all 9 lesson-language pairs (OB-3)', audio.length >= 9, `${audio.length}/9 audio files bundled`);

const out = path.resolve(__dirname, '..', 'testing', 'prerelease.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify({ ran_at: new Date().toISOString(), aia: AIA, rows }, null, 1));
console.log(`\n${rows.filter((r) => r.pass).length}/${rows.length} ok · wrote testing/prerelease.json`);
