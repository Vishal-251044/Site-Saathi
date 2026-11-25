// SITE SAATHI - static checks on an App Inventor project (.aia) before importing it.
// Checks per screen: blocks refer to existing components of the right type, procedures exist with the right
// number of arguments, globals are declared, asset names used in designer/blocks are in the project.
// Usage: node tools/check-aia.js app-inventor/SITE_SAATHI.aia
'use strict';
const fs = require('fs');
const zlib = require('zlib');
const file = process.argv[2] || 'app-inventor/SITE_SAATHI.aia';
const b = fs.readFileSync(file);
const files = {}; let o = 0;
while (b.readUInt32LE(o) === 0x04034b50) {
  const cs = b.readUInt32LE(o + 18), nl = b.readUInt16LE(o + 26), name = b.slice(o + 30, o + 30 + nl).toString();
  files[name] = zlib.inflateRawSync(b.slice(o + 30 + nl, o + 30 + nl + cs)); o += 30 + nl + cs;
}
const assets = new Set(Object.keys(files).filter((n) => n.startsWith('assets/')).map((n) => n.slice(7)));
const problems = [];
const screens = Object.keys(files).filter((n) => n.endsWith('.scm'));
for (const scmName of screens) {
  const scr = scmName.split('/').pop().replace('.scm', '');
  const json = JSON.parse(files[scmName].toString().split('\n')[2]);
  const comps = {};
  (function walk(c) { comps[c.$Name] = c.$Type; for (const [k, v] of Object.entries(c)) if (typeof v === 'string' && /\.(png|jpg|ttf)$/.test(v) && !assets.has(v)) problems.push(`${scr}: designer ${c.$Name}.${k} uses missing asset ${v}`); (c.$Components || []).forEach(walk); })(json.Properties);
  // layout: a row of percent-wide children must fit inside its parent (App Inventor % = % of the SCREEN width)
  (function lay(c, avail) {
    const own = parseInt(c.Width || '-1', 10); const mine = own <= -1000 ? -own - 1000 : avail;
    const kids = c.$Components || [];
    if (/HorizontalArrangement/.test(c.$Type || '')) {
      const sum = kids.reduce((t, k) => { const w = parseInt(k.Width || '-1', 10); return t + (w <= -1000 ? -w - 1000 : 0); }, 0);
      if (sum > mine) problems.push(`${scr}: row ${c.$Name} needs ${sum}% of the screen but its parent has ${mine}% -> it overflows (no side margin)`);
    }
    kids.forEach((k) => lay(k, mine));
  })(json.Properties, 100);
  const xml = files[scmName.replace('.scm', '.bky')].toString();
  // components
  for (const m of xml.matchAll(/component_type="(\w+)"[^>]*instance_name="(\w+)"/g)) {
    const [, type, inst] = m;
    if (!(inst in comps)) problems.push(`${scr}: blocks use missing component ${inst}`);
    else if (comps[inst] !== type) problems.push(`${scr}: ${inst} is ${comps[inst]} but blocks say ${type}`);
  }
  // procedures
  const defs = {};
  for (const m of xml.matchAll(/<block [^>]*type="procedures_def(?:no)?return"[^>]*><mutation>(.*?)<\/mutation><field name="NAME">(\w+)<\/field>/g)) {
    if (defs[m[2]] !== undefined) problems.push(`${scr}: procedure ${m[2]} defined twice`);
    defs[m[2]] = (m[1].match(/<arg /g) || []).length;
  }
  for (const m of xml.matchAll(/<block type="procedures_call(?:no)?return"[^>]*><mutation name="(\w+)">(.*?)<\/mutation>/g)) {
    if (defs[m[1]] === undefined) problems.push(`${scr}: call to undefined procedure ${m[1]}`);
    else if (defs[m[1]] !== (m[2].match(/<arg /g) || []).length) problems.push(`${scr}: ${m[1]} called with wrong number of args`);
  }
  // globals
  const globals = new Set([...xml.matchAll(/<block [^>]*type="global_declaration"[^>]*><field name="NAME">(\w+)<\/field>/g)].map((m) => m[1]));
  for (const m of xml.matchAll(/<field name="VAR">global (\w+)<\/field>/g)) if (!globals.has(m[1])) problems.push(`${scr}: global ${m[1]} not declared`);
  // a block may have only one <next> child (a broken chain silently skips blocks)
  { const re = /<(\/?)(block|next)\b[^>]*>/g; let mm; const st = []; while ((mm = re.exec(xml))) { if (!mm[1]) { if (mm[2] === 'next' && st.length && st[st.length - 1].nexts++) problems.push(`${scr}: a block has two next connections (near ${mm.index})`); st.push({ nexts: 0 }); } else st.pop(); } }
  // events defined twice
  const evs = [...xml.matchAll(/instance_name="(\w+)" event_name="(\w+)"/g)].map((m) => m[1] + '.' + m[2]);
  evs.filter((e, i) => evs.indexOf(e) !== i).forEach((e) => problems.push(`${scr}: event ${e} defined twice`));
  // assets named in text blocks
  for (const m of xml.matchAll(/<field name="TEXT">([\w.-]+\.(?:png|jpg|ttf|csv))<\/field>/g)) {
    if (m[1].startsWith('_') || m[1].startsWith('.')) continue;   // a piece of a name used in text replace (press animation), not a file
    if (!assets.has(m[1]) && !assets.has(m[1].replace(/^\/\//, ''))) problems.push(`${scr}: blocks use missing asset ${m[1]}`);
  }
  // press animation: every pressable picture (designer or set by blocks) needs its "_p" pressed version
  const PRESS = /^(bg_btn_|tile_|bg_opt|bg_scan_big|bg_card_continue)[\w-]*\.png$/;
  const pics = new Set([...xml.matchAll(/<field name="TEXT">([\w.-]+\.png)<\/field>/g)].map((m) => m[1]));
  (function walkP(c) { if (typeof c.Image === 'string') pics.add(c.Image); (c.$Components || []).forEach(walkP); })(json.Properties);
  for (const p of pics) if (PRESS.test(p) && !p.endsWith('_p.png') && !assets.has(p.replace('.png', '_p.png'))) problems.push(`${scr}: ${p} has no pressed picture ${p.replace('.png', '_p.png')}`);
  for (const m of xml.matchAll(/<field name="TEXT">\/\/([\w.-]+)<\/field>/g)) if (!assets.has(m[1])) problems.push(`${scr}: ReadFrom missing asset ${m[1]}`);
  console.log(`${scr.padEnd(9)} components ${String(Object.keys(comps).length).padStart(3)} · procedures ${String(Object.keys(defs).length).padStart(2)} · globals ${String(globals.size).padStart(2)} · events ${evs.length}`);
}
console.log(problems.length ? `\n${problems.length} PROBLEM(S):\n` + problems.join('\n') : `\nOK: ${screens.length} screens, ${assets.size} assets, no reference problems.`);
process.exit(problems.length ? 1 : 0);
