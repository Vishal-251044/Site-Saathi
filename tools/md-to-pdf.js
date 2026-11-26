// md-to-pdf.js — turn a simple Markdown document into a printable A4 PDF with the app's font
// (Noto Sans Devanagari + Figtree, so Marathi / Hindi / English all render correctly). Free: uses headless Chrome.
//
//   node tools/md-to-pdf.js Doc/SITE_SAATHI_Roles_and_Process_mr_en.md      -> same name .pdf next to it
//
// Supports what the project's docs use: # / ## / ### headings, paragraphs, **bold**, *italic*, `code`,
// numbered and bullet lists (with indented continuation lines), > quotes, tables, --- lines,
// "- [ ] text" tick boxes, ``` code blocks, and screenshot rows: one line of ![caption](path.png) images
// (path relative to the .md file, or to the project folder).
//   --out <file.pdf>  write the PDF somewhere else   ·   --keep  keep the HTML
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const src = process.argv[2];
if (!src || !fs.existsSync(src)) { console.error('Usage: node tools/md-to-pdf.js <file.md>'); process.exit(1); }
const oi = process.argv.indexOf('--out');
const out = oi > 0 ? process.argv[oi + 1] : src.replace(/\.md$/i, '.pdf');
const fileUrl = (p) => 'file:///' + p.replace(/\\/g, '/').split('/').map((x, k) => (k === 0 ? x : encodeURIComponent(x))).join('/');
const imgPath = (p) => [path.resolve(path.dirname(src), p), path.resolve(ROOT, p)].find((x) => fs.existsSync(x));
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
if (!CHROME) { console.error('Chrome or Edge not found - install Google Chrome (free)'); process.exit(1); }

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/\*([^*]+)\*/g, '<i>$1</i>');
const lines = fs.readFileSync(src, 'utf8').replace(/\r\n/g, '\n').split('\n');
const html = [];
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  if (!l.trim()) continue;
  let m;
  if (l.startsWith('```')) {   // code block
    const c = []; i++; while (i < lines.length && !lines[i].startsWith('```')) c.push(esc(lines[i++]));
    html.push(`<pre>${c.join('\n')}</pre>`); continue;
  }
  if (l.startsWith('![')) {   // a row of screenshots
    const figs = [...l.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)].map((x) => {
      const p = imgPath(x[2]); if (!p) { console.error('Image not found: ' + x[2]); process.exit(1); }
      return `<figure><img src="${fileUrl(p)}"><figcaption>${inline(x[1])}</figcaption></figure>`;
    });
    html.push(`<div class="shots">${figs.join('')}</div>`); continue;
  }
  if ((m = /^(#{1,3}) (.*)$/.exec(l))) { html.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`); continue; }
  if (/^---+$/.test(l.trim())) { html.push('<hr>'); continue; }
  if (l.startsWith('|')) {   // table: header row, separator row, body rows
    const rows = []; while (i < lines.length && lines[i].startsWith('|')) rows.push(lines[i++]); i--;
    const cells = (r) => r.trim().replace(/^\||\|$/g, '').split('|').map((c) => inline(c.trim()));
    html.push(`<table><tr>${cells(rows[0]).map((c) => `<th>${c}</th>`).join('')}</tr>${rows.slice(2).map((r) => `<tr>${cells(r).map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</table>`);
    continue;
  }
  if (l.startsWith('>')) { const q = []; while (i < lines.length && lines[i].startsWith('>')) q.push(inline(lines[i++].replace(/^>\s?/, ''))); i--; html.push(`<blockquote>${q.join('<br>')}</blockquote>`); continue; }
  if ((m = /^(\d+)\. |^- /.exec(l))) {   // list; lines indented by spaces continue the item
    const ordered = /^\d/.test(l); const items = [];
    while (i < lines.length && (/^(\d+\. |- )/.test(lines[i]) || (/^\s{2,}\S/.test(lines[i]) && items.length))) {
      if (/^\s{2,}\S/.test(lines[i])) items[items.length - 1] += '<br>' + inline(lines[i].trim().replace(/^- /, '• '));
      else items.push(inline(lines[i].replace(/^(\d+\. |- )/, '')));
      i++;
    }
    i--; html.push(`<${ordered ? `ol start="${m[1]}"` : 'ul'}>${items.map((x) => (x.startsWith('[ ] ') ? `<li class="todo">${x.slice(4)}</li>` : `<li>${x}</li>`)).join('')}</${ordered ? 'ol' : 'ul'}>`); continue;
  }
  const p = [l]; while (i + 1 < lines.length && lines[i + 1].trim() && !/^(#|\||>|---|\d+\. |- |```|!\[)/.test(lines[i + 1])) p.push(lines[++i]);
  html.push(`<p>${p.map(inline).join('<br>')}</p>`);
}
const font = (f) => 'file:///' + path.join(ROOT, 'brand', 'fonts', f).replace(/\\/g, '/').replace(/ /g, '%20');
const page = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(path.basename(src, '.md'))}</title><style>
@font-face{font-family:SS;src:url('${font('font_ss.ttf')}')}@font-face{font-family:SS;font-weight:700;src:url('${font('font_ss_bold.ttf')}')}
@page{size:A4;margin:14mm 13mm}
body{font-family:SS,'Nirmala UI',sans-serif;color:#1B1F24;font-size:11.5pt;line-height:1.45;margin:0}
h1{font-size:21pt;margin:0 0 4pt;padding-bottom:6pt;border-bottom:6px solid transparent;border-image:repeating-linear-gradient(-45deg,#FFC21A 0 8px,#1B1F24 8px 16px) 6}
h2{font-size:14pt;margin:14pt 0 6pt;padding:4pt 8pt;background:#1B1F24;color:#fff;border-left:6px solid #FFC21A;border-radius:4px;break-after:avoid}
h3{font-size:12pt;margin:10pt 0 4pt}
p{margin:4pt 0 6pt}i{color:#5B6068}hr{border:0;margin:6pt 0}
table{border-collapse:collapse;width:100%;margin:4pt 0 8pt;font-size:10.5pt;break-inside:auto}tr{break-inside:avoid}
th{background:#FFF4D1;text-align:left;border:1px solid #E4DFD5;padding:4pt 6pt}td{border:1px solid #E4DFD5;padding:4pt 6pt;vertical-align:top}
ol,ul{margin:4pt 0 8pt 16pt;padding:0}li{margin:0 0 5pt}
li.todo{list-style:none;position:relative}li.todo::before{content:'';position:absolute;left:-16pt;top:2.5pt;width:9pt;height:9pt;border:1.6px solid #1B1F24;border-radius:2px;background:#fff}
pre{font-family:Consolas,monospace;font-size:9pt;background:#1B1F24;color:#F5F1E8;padding:7pt 9pt;border-radius:6px;white-space:pre-wrap;margin:4pt 0 8pt;break-inside:avoid}
.shots{display:flex;gap:12pt;justify-content:center;margin:6pt 0 10pt;break-inside:avoid}
figure{margin:0;text-align:center}figure img{height:82mm;border:1px solid #D9D4CA;border-radius:8px}
figcaption{font-size:9.5pt;color:#5B6068;margin-top:2pt}
blockquote{margin:6pt 0;padding:6pt 10pt;background:#E3F4E8;border-left:5px solid #15A34A;border-radius:4px}
code{font-family:Consolas,monospace;font-size:9.5pt;background:#F1EEE8;padding:0 3px;border-radius:3px}
</style></head><body>${html.join('\n')}</body></html>`;
const tmp = path.join(os.tmpdir(), 'ss_md_' + process.pid + '.html');
fs.writeFileSync(tmp, page);
try {
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--allow-file-access-from-files', `--user-data-dir=${path.join(os.tmpdir(), 'ss_md_ud_' + process.pid)}`,
    '--no-pdf-header-footer', '--print-to-pdf-no-header', `--print-to-pdf=${path.resolve(out)}`, '--virtual-time-budget=5000', 'file:///' + tmp.replace(/\\/g, '/')], { stdio: 'ignore' });
} catch (e) { /* Chrome can return non-zero even when the PDF is written */ }
if (process.argv.includes('--keep')) console.log('HTML kept: ' + tmp); else fs.unlinkSync(tmp);
console.log(fs.existsSync(out) ? `${out} (${(fs.statSync(out).size / 1024).toFixed(0)} KB)` : 'PDF NOT written');
