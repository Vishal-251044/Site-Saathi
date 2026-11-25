// SITE SAATHI - App Inventor UI assets (Day 5)
// Writes design/app-assets/*.svg; tools/export-media.sh turns them into transparent PNGs in media/.
//  ic_<name>_k.png / _w.png  : 144 x 144 px (48 dp at 3x), charcoal / white
//  icon_mod_<code>.png       : 144 x 144 px module icons
//  bg_btn_*.png (+ _h, _t)   : full / half / third width buttons (see UI v2 below)
//  bg_tile_*.png             : 480 x 384 px  (Home tile 160 x 128 dp, radius 16 dp)
// Run: node tools/build-app-assets.js && bash tools/export-media.sh
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'design', 'app-assets');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// Same 24-grid icons as design/Prototype.html
const ICONS = {
  book: '<path d="M4 6c3-1.5 6-1.5 8 0v13c-2-1.5-5-1.5-8 0zM20 6c-3-1.5-6-1.5-8 0v13c2-1.5 5-1.5 8 0z"/>',
  qr: '<rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1"/><rect x="14" y="3.5" width="6.5" height="6.5" rx="1"/><rect x="3.5" y="14" width="6.5" height="6.5" rx="1"/><path d="M14 14h2.5v2.5H14zM18 18h2.5v2.5H18zM14 18.5v2M18.5 14h2"/>',
  star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
  back: '<path d="M15 5l-7 7 7 7"/>', chev: '<path d="M9 5l7 7-7 7"/>',
  speaker: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', tick: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  cross: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>', warn: '<path d="M12 3.5L21.5 20h-19z"/><path d="M12 10v4.5M12 17.2v.3"/>',
  mistake: '<circle cx="12" cy="12" r="8.5"/><path d="M9 9l6 6M15 9l-6 6"/>',
  play: '<path d="M8 5.5v13l11-6.5z" fill="COLOR"/>', pause: '<path d="M8.5 5.5v13M15.5 5.5v13" stroke-width="3.4"/>',
  restart: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 4.5v4h4"/>',
  mic: '<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3"/>',
  camera: '<path d="M4 8h3l2-2.5h6L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  share: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.3 10.8l7.4-3.6M8.3 13.2l7.4 3.6"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8v.3"/>',
  wifioff: '<path d="M3 3l18 18M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5-2.7M14 10.3A10 10 0 0 1 19 13M12 20v.3"/>',
  helmet: '<path d="M4 16a8 8 0 0 1 16 0"/><path d="M10.5 8.5V16M13.5 8.5V16"/><path d="M2.5 17h19"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M3 20a6 6 0 0 1 12 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3 6"/>',
};
const COLORS = { k: '#1B1F24', w: '#FFFFFF' };
const write = (name, w, h, inner, viewBox) => fs.writeFileSync(path.join(OUT, name + '.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" data-size="${w},${h}" width="${w}" height="${h}" viewBox="${viewBox || `0 0 ${w} ${h}`}">${inner}</svg>`);

let n = 0;
for (const [name, body] of Object.entries(ICONS)) for (const [suf, col] of Object.entries(COLORS)) {
  write(`ic_${name}_${suf}`, 144, 144, `<g fill="none" stroke="${col}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" transform="translate(12 12) scale(5)">${body.replace('COLOR', col)}</g>`);
  n++;
}
// Module icons (from design/icons, 48-grid)
for (const f of fs.readdirSync(path.join(ROOT, 'design', 'icons')).filter((x) => x.endsWith('.svg'))) {
  const inner = fs.readFileSync(path.join(ROOT, 'design', 'icons', f), 'utf8').replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  write(f.replace('.svg', ''), 144, 144, `<g fill="none" stroke="#1B1F24" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" transform="scale(3)">${inner}</g>`);
  n++;
}
// ---------------------------------------------------------------------------------------------
// UI v2 (19 Nov 2026): "tactile Hi-Vis" — 16 dp radius, a darker bottom lip so buttons look pressable,
// soft borders instead of hard black outlines, and one PNG per button WIDTH so corners never stretch:
//   full  bg_btn_<c>.png    990 x 168  (330 x 56 dp)      half  bg_btn_<c>_h.png  480 x 168 (160 x 56 dp)
//   third bg_btn_<c>_t.png  300 x 156  (100 x 52 dp)
// tools/build-app.js picks the variant from each button's Width automatically (variantImg).
// ---------------------------------------------------------------------------------------------
const LIP = 9;   // px at 3x = 3 dp
const btn = (name, w, h, r, fill, lip, stroke) => {
  write(name, w, h,
    `<rect x="0" y="${LIP}" width="${w}" height="${h - LIP}" rx="${r}" fill="${lip}"/>` +
    `<rect x="${stroke ? 2.5 : 0}" y="${stroke ? 2.5 : 0}" width="${w - (stroke ? 5 : 0)}" height="${h - LIP - (stroke ? 2.5 : 0)}" rx="${r}" fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="5"` : ''}/>`);
  n++;
};
const STYLES = {
  yellow: ['#FFC21A', '#D99E00'],
  charcoal: ['#1B1F24', '#000000'],
  outline: ['#FFFFFF', '#DCD6CA', '#D6D0C4'],
  danger: ['#FFFFFF', '#F2C4C4', '#EBA3A3'],
  ai: ['#2563EB', '#1A47B8'],
};
for (const [c, [fill, lip, stroke]] of Object.entries(STYLES)) {
  btn(`bg_btn_${c}`, 990, 168, 48, fill, lip, stroke);
  btn(`bg_btn_${c}_h`, 480, 168, 48, fill, lip, stroke);
  btn(`bg_btn_${c}_t`, 300, 156, 45, fill, lip, stroke);
}
// Old flat tiles (kept for the prototype)
const rr = (name, w, h, r, fill) => { write(name, w, h, `<rect width="${w}" height="${h}" rx="${r}" fill="${fill}"/>`); n++; };
rr('bg_tile_yellow', 480, 384, 48, '#FFC21A');
rr('bg_tile_charcoal', 480, 384, 48, '#1B1F24');
rr('bg_tile_green', 480, 384, 48, '#E7F5EC');
rr('bg_tile_grey', 480, 384, 48, '#EFEDE8');
// Tiles: Home and module tiles 160 x 160 dp (480 x 480 px). A Button centres its text, so the icon sits
// in a soft circle in the top third and the label lands in the lower middle.
const iconAt = (body, col, x, y, size) => `<g fill="none" stroke="${col}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" transform="translate(${x} ${y}) scale(${size / 24})">${body.replace('COLOR', col)}</g>`;
const tile = (name, fill, lip, circle, iconSvg, stroke) => {
  write(name, 480, 480,
    `<rect x="0" y="${LIP}" width="480" height="${480 - LIP}" rx="54" fill="${lip}"/>` +
    `<rect x="${stroke ? 2.5 : 0}" y="${stroke ? 2.5 : 0}" width="${480 - (stroke ? 5 : 0)}" height="${480 - LIP - (stroke ? 2.5 : 0)}" rx="54" fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="5"` : ''}/>` +
    `<circle cx="240" cy="96" r="63" fill="${circle}"/>${iconSvg}`);
  n++;
};
const homeTile = (name, fill, lip, circle, icon, col, stroke) => tile(`tile_home_${name}`, fill, lip, circle, iconAt(ICONS[icon], col, 204, 60, 72), stroke);
homeTile('start', '#FFC21A', '#D99E00', 'rgba(255,255,255,0.45)', 'book', '#1B1F24');
homeTile('scan', '#1B1F24', '#000000', 'rgba(255,255,255,0.12)', 'qr', '#FFC21A');
homeTile('skills', '#FFFFFF', '#DCD6CA', '#E7F5EC', 'star', '#15A34A', '#E4DFD5');
homeTile('settings', '#FFFFFF', '#DCD6CA', '#EFEDE8', 'gear', '#1B1F24', '#E4DFD5');
for (const f of fs.readdirSync(path.join(ROOT, 'design', 'icons')).filter((x) => x.startsWith('icon_mod_'))) {
  const code = f.slice(9, 12);
  const inner = fs.readFileSync(path.join(ROOT, 'design', 'icons', f), 'utf8').replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const icon = (op) => `<g opacity="${op}" fill="none" stroke="#1B1F24" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" transform="translate(204 60) scale(1.5)">${inner}</g>`;
  tile(`tile_mod_${code}`, '#FFFFFF', '#DCD6CA', '#FFF1C7', icon(1), '#E4DFD5');
  tile(`tile_mod_${code}_soon`, '#F1EFEA', '#E2DED5', '#E6E3DC', icon(0.35));
}
// Audio buttons (48 dp at 3x)
write('btn_play', 144, 144, `<circle cx="72" cy="72" r="70" fill="#FFC21A"/>${iconAt(ICONS.play, '#1B1F24', 38, 36, 72)}`); n++;
write('btn_pause', 144, 144, `<circle cx="72" cy="72" r="70" fill="#FFC21A"/>${iconAt(ICONS.pause, '#1B1F24', 36, 36, 72)}`); n++;
// Quiz options 330 x 64 dp (990 x 192 px)
btn('bg_opt', 990, 192, 45, '#FFFFFF', '#DCD6CA', '#D6D0C4');
btn('bg_opt_right', 990, 192, 45, '#E7F5EC', '#15A34A', '#15A34A');
btn('bg_opt_wrong', 990, 192, 45, '#FDECEC', '#DC2626', '#DC2626');
// Big scan button 330 x 120 dp: QR icon in a yellow circle at the top
write('bg_scan_big', 990, 360, `<rect x="0" y="${LIP}" width="990" height="${360 - LIP}" rx="54" fill="#000000"/><rect width="990" height="${360 - LIP}" rx="54" fill="#1B1F24"/>` +
  `<circle cx="495" cy="105" r="72" fill="#FFC21A"/>${iconAt(ICONS.qr, '#1B1F24', 447, 57, 96)}`); n++;
// Continue card 330 x 72 dp: white, yellow accent bar on the left, book icon left, chevron right
write('bg_card_continue', 990, 216, `<rect x="0" y="${LIP}" width="990" height="${216 - LIP}" rx="45" fill="#DCD6CA"/><rect x="2.5" y="2.5" width="985" height="${216 - LIP - 2.5}" rx="45" fill="#FFFFFF" stroke="#E4DFD5" stroke-width="5"/>` +
  `<rect x="2.5" y="2.5" width="30" height="${216 - LIP - 2.5}" rx="15" fill="#FFC21A"/>${iconAt(ICONS.chev, '#1B1F24', 900, 69, 60)}`); n++;   // centred text: no icon on the left
// _p pressed variants: the face moves down onto its lip and gets a little darker (TouchDown in the app)
for (const file of fs.readdirSync(OUT).filter((x) => /^(bg_btn_|tile_|bg_opt|bg_scan_big|bg_card_continue)/.test(x) && !/_p\.svg$/.test(x))) {
  const svg = fs.readFileSync(path.join(OUT, file), 'utf8');
  const open = svg.match(/^<svg[^>]*>/)[0];
  const inner = svg.slice(open.length).replace(/<\/svg>\s*$/, '');
  fs.writeFileSync(path.join(OUT, file.replace('.svg', '_p.svg')), `${open}<g transform="translate(0 ${LIP})" style="filter:brightness(0.9)">${inner}</g></svg>`);
  n++;
}
console.log(`Wrote ${n} SVGs to design/app-assets/`);
