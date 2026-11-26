// SITE SAATHI - "SITE SAATHI Content" Google Sheet seed (Day 15: "move the 3 MVP lessons into the sheet").
// Builds every Admin Mode tab (PRD 13.3, columns from backend/apps-script/Config.gs) from the MVP CSVs and writes
//   content/admin-sheet/SITE_SAATHI_Content.xlsx  -> upload to Drive, "Open with Google Sheets": all tabs at once.
// MVP lessons are imported as "In review" (they still need the expert sign-off); their pictures are bundled file names.
// Usage: node tools/build-admin-sheet.js         (also used by tools/test-backend.js via require)
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');

function schema() {
  const ctx = {}; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'backend', 'apps-script', 'Config.gs'), 'utf8') + '\nthis.SCHEMA = SCHEMA;', ctx);
  return ctx.SCHEMA;
}
function csv(file) {
  const t = fs.readFileSync(path.join(ROOT, 'content', 'sheet', file), 'utf8'); const rows = []; let r = [], f = '', q = false;
  for (let i = 0; i < t.length; i++) { const c = t[i]; if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; } else if (c === '"') q = true; else if (c === ',') { r.push(f); f = ''; } else if (c === '\n') { r.push(f); rows.push(r); r = []; f = ''; } else if (c !== '\r') f += c; }
  if (f || r.length) { r.push(f); rows.push(r); }
  const [h, ...b] = rows; return b.filter((x) => x.some(Boolean)).map((x) => Object.fromEntries(h.map((k, i) => [k, x[i] ?? ''])));
}

function buildSeed() {
  const S = schema();
  const les = csv('lessons.csv'), quiz = csv('quiz.csv'), strings = csv('strings.csv');
  const str = Object.fromEntries(strings.map((s) => [s.key, s]));
  const icons = { MAS: 'brick', CON: 'mixer', SAF: 'helmet', REI: 'rebar', CUR: 'water drop', QUA: 'check' };
  const T = {};
  T.modules = ['MAS', 'CON', 'SAF', 'REI', 'CUR', 'QUA'].map((c, i) => ({ code: c, name_mr: str['mod_' + c.toLowerCase()].mr, name_hi: str['mod_' + c.toLowerCase()].hi, name_en: str['mod_' + c.toLowerCase()].en, icon: icons[c], order: i + 1, active: ['MAS', 'CON', 'SAF'].includes(c) ? 'TRUE' : 'FALSE' }));
  const ids = [...new Set(les.map((r) => r.id))];
  T.lessons = ids.map((id) => { const r = les.find((x) => x.id === id); return { lesson_id: id, module_code: r.module, lesson_no: Number(id.slice(-2)), duration_min: r.duration_min, status: 'In review', reviewer: '', reviewed_on: '', created_by: 'mvp-import', updated_by: 'mvp-import', updated_at: '2026-11-25' }; });
  T.lesson_text = les.map((r) => ({ lesson_id: r.id, lang: r.lang, title: r.title, description: r.desc, objective: r.objective, materials: r.materials, safety: r.safety, mistakes: r.mistakes, audio_url: r.audio }));
  T.steps = ids.flatMap((id) => {
    const by = Object.fromEntries(['mr', 'hi', 'en'].map((l) => [l, les.find((x) => x.id === id && x.lang === l)]));
    const st = by.en.steps.split('|'), img = by.en.img.split('|');
    return st.map((_, i) => ({ lesson_id: id, step_no: i + 1, image_url: img[i] || '', text_mr: by.mr.steps.split('|')[i], text_hi: by.hi.steps.split('|')[i], text_en: by.en.steps.split('|')[i] }));
  });
  T.quiz = quiz.map((q) => ({ ...q, q_no: Number(q.q_no) }));
  T.reviews = [];
  T.qr = ids.map((id) => ({ lesson_id: id, poster_location: { 'SS-MAS-01': 'Brick masonry work area', 'SS-CON-01': 'Mixer / concreting area', 'SS-SAF-01': 'Site entrance, notice board' }[id] || '', printed: 'no', printed_on: '' }));
  T.strings = strings;
  T.team = []; T.publish_log = []; T.pub_lessons = []; T.pub_quiz = []; T.pub_strings = []; T.pub_files = [];
  T.manifest = [{ content_version: 0, published_on: '', lessons_count: 0 }];
  T.setup = [];   // first-setup code is written here by the server (Keys.gs)
  return { schema: S, tables: T };
}

// ---------- minimal .xlsx writer (inline strings; Google Sheets opens it with all tabs) ----------
function xlsx(seed) {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  const col = (i) => { let s = ''; i++; while (i) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
  const names = Object.keys(seed.schema);
  const files = [];
  names.forEach((name, si) => {
    const cols = seed.schema[name]; const rows = [cols, ...seed.tables[name].map((r) => cols.map((c) => r[c] ?? ''))];
    const x = rows.map((r, ri) => `<row r="${ri + 1}">${r.map((v, ci) => (typeof v === 'number' ? `<c r="${col(ci)}${ri + 1}"><v>${v}</v></c>` : `<c r="${col(ci)}${ri + 1}" t="inlineStr"><is><t xml:space="preserve">${esc(v)}</t></is></c>`)).join('')}</row>`).join('');
    files.push([`xl/worksheets/sheet${si + 1}.xml`, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${x}</sheetData></worksheet>`]);
  });
  files.push(['[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${names.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`]);
  files.push(['_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`]);
  files.push(['xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${names.map((n, i) => `<sheet name="${n}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>`]);
  files.push(['xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${names.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}</Relationships>`]);
  // zip
  const locals = [], centrals = []; let off = 0;
  for (const [n, s] of files) {
    const d = Buffer.from(s, 'utf8'), nb = Buffer.from(n), cd = zlib.deflateRawSync(d), crc = zlib.crc32(d) >>> 0;
    const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x0800, 6); lh.writeUInt16LE(8, 8); lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(cd.length, 18); lh.writeUInt32LE(d.length, 22); lh.writeUInt16LE(nb.length, 26);
    const ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0x0800, 8); ch.writeUInt16LE(8, 10); ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(cd.length, 20); ch.writeUInt32LE(d.length, 24); ch.writeUInt16LE(nb.length, 28); ch.writeUInt32LE(off, 42);
    locals.push(lh, nb, cd); centrals.push(ch, nb); off += 30 + nb.length + cd.length;
  }
  const c = Buffer.concat(centrals), e = Buffer.alloc(22); e.writeUInt32LE(0x06054b50, 0); e.writeUInt16LE(files.length, 8); e.writeUInt16LE(files.length, 10); e.writeUInt32LE(c.length, 12); e.writeUInt32LE(off, 16);
  return Buffer.concat([...locals, c, e]);
}

module.exports = { buildSeed };
if (require.main === module) {
  const seed = buildSeed();
  const out = path.join(ROOT, 'content', 'admin-sheet', 'SITE_SAATHI_Content.xlsx');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, xlsx(seed));
  console.log('Wrote ' + path.relative(ROOT, out) + ': ' + Object.keys(seed.schema).map((k) => `${k} ${seed.tables[k].length}`).join(' · '));
}
