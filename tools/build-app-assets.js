// SITE SAATHI - App Inventor UI assets
// Writes design/app-assets/*.svg; tools/export-media.sh turns them into transparent PNGs in media/.
// Run: node tools/build-app-assets.js && bash tools/export-media.sh
//
// UI v3 "Hi-Vis Soft" (26 Nov 2026): same Hi-Vis colours (PRD 14.1), modern shapes:
//   pill buttons with a soft shadow (no hard lip) · white rounded cards on a warm page · icons in soft squares
//   · light title bar with a round back button · gauge / ring pictures for progress and quiz score.
// Every picture is drawn at its real size (3 px = 1 dp) so round corners do not stretch.
// Shadows are drawn INSIDE the picture (a few dp of transparent margin), App Inventor cannot draw shadows itself.
//
//  ic_<name>_k/_w.png     48 dp icons (charcoal / white)            icon_mod_<code>.png  48 dp module icons
//  bg_btn_<style>[_h|_t]  pill buttons full 330x56 / half 160x56 / third 100x52 dp (+ _p pressed)
//  tile_home_* tile_mod_* 160 x 160 dp tiles (+ _soon, + _p)       bg_btn_back[_ai]     48 dp round back button
//  cap_<tone>_t / _b      top / bottom of a rounded card whose middle is a plain coloured arrangement
//  bg_card_continue, bg_row, bg_audio, bg_field                    fixed-size card backgrounds (+ _p)
//  bg_opt[_right|_wrong], bg_choice[_on]                           quiz answers, language choice (+ _p)
//  gauge_0..12, ring_0..5, mask_pic, st_*, ic_fb_*, badge_*        progress, score, picture corners, status
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'design', 'app-assets');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// ---------- colours (PRD 14.1 + soft tints) ----------
const T = {
  page: '#F6F3EE', ink: '#1B1F24', mut: '#6B7078', line: '#E6E0D6', soft: '#F1EEE8', card: '#FFFFFF', cardP: '#F3F0EA',
  yel: '#FFC21A', yelP: '#F0B000', yelS: '#FFF4D1', yelInk: '#8A6400',
  grn: '#15A34A', grnS: '#E3F4E8', red: '#DC2626', redS: '#FDECEC', blue: '#2563EB', blueP: '#1D4ED8', blueS: '#EAF0FE',
};
const D = 3;                                   // px per dp
const p = (dp) => +(dp * D).toFixed(2);
let n = 0;
// w, h in dp. inner uses px. data-size tells export-media.sh the PNG size.
const write = (name, wdp, hdp, inner, defs = '') => {
  const W = p(wdp), H = p(hdp);
  fs.writeFileSync(path.join(OUT, name + '.svg'),
    `<svg xmlns="http://www.w3.org/2000/svg" data-size="${W},${H}" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs ? `<defs>${defs}</defs>` : ''}${inner}</svg>`);
  n++;
};
// soft drop shadow, filter covers the whole picture
let fid = 0;
const shadow = (wdp, hdp, dy, std, a) => {
  const id = 'sh' + (++fid);
  return { id, def: `<filter id="${id}" filterUnits="userSpaceOnUse" x="0" y="0" width="${p(wdp)}" height="${p(hdp)}" color-interpolation-filters="sRGB"><feDropShadow dx="0" dy="${p(dy)}" stdDeviation="${p(std)}" flood-color="#1B1F24" flood-opacity="${a}"/></filter>` };
};
const rrect = (x, y, w, h, r, attrs) => `<rect x="${p(x)}" y="${p(y)}" width="${p(w)}" height="${p(h)}" rx="${p(r)}" ${attrs}/>`;

// ---------- icons (24 grid, same as design/Prototype.html) ----------
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
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>', arrowUp: '<path d="M7 17L17 7M9 7h8v8"/>',
  // Admin Mode (UI v3)
  pencil: '<path d="M4.5 19.5l1-4.5L16 4.5l3.5 3.5L9 18.5z"/><path d="M13.5 7l3.5 3.5"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  live: '<circle cx="12" cy="12" r="2"/><path d="M8.2 8.2a5.4 5.4 0 0 0 0 7.6M15.8 8.2a5.4 5.4 0 0 1 0 7.6M5.3 5.3a9.5 9.5 0 0 0 0 13.4M18.7 5.3a9.5 9.5 0 0 1 0 13.4"/>',
  texts: '<path d="M3.5 6h9M8 4v2M5.5 6c0 4 3 7 6.5 8M10.5 6c-1 4-3.6 7-7 8"/><path d="M13 20l4-9 4 9M14.4 17h5.2"/>',
  key: '<circle cx="8" cy="15.5" r="4"/><path d="M11 12.5L19.5 4M16.5 7l2.5 2.5M14 9.5l2 2"/>',
};
// icon at (x, y) dp, size dp, colour, stroke width in grid units
const icon = (name, x, y, size, col, sw = 2.4, op = 1) =>
  `<g opacity="${op}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" transform="translate(${p(x)} ${p(y)}) scale(${p(size) / 24})">${ICONS[name].replace('COLOR', col)}</g>`;
const MODS = {};
for (const f of fs.readdirSync(path.join(ROOT, 'design', 'icons')).filter((x) => x.startsWith('icon_mod_') && x.endsWith('.svg'))) {
  MODS[f.slice(9, 12)] = fs.readFileSync(path.join(ROOT, 'design', 'icons', f), 'utf8').replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
}
const modIcon = (code, x, y, size, col, op = 1) =>
  `<g opacity="${op}" fill="none" stroke="${col}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" transform="translate(${p(x)} ${p(y)}) scale(${p(size) / 48})">${MODS[code]}</g>`;

// 1) plain icons, as before (Admin screens, speakers, lock, etc.)
for (const name of Object.keys(ICONS)) for (const [suf, col] of [['k', T.ink], ['w', '#FFFFFF']]) write(`ic_${name}_${suf}`, 48, 48, icon(name, 4, 4, 40, col));
for (const code of Object.keys(MODS)) write(`icon_mod_${code}`, 48, 48, modIcon(code, 0, 0, 48, T.ink));

// 2) pill buttons. Visible pill: 2 dp in from the sides, 1 dp from the top, 4 dp from the bottom (room for the shadow).
const PILL = {   // fill, pressed fill, stroke, shadow alpha
  yellow: [T.yel, T.yelP, null, 0.18], charcoal: [T.ink, '#000000', null, 0.24], ai: [T.blue, T.blueP, null, 0.22],
  outline: [T.card, T.cardP, T.line, 0.08], danger: [T.card, '#FDF2F2', '#F1B5B5', 0.06],
  green: [T.grn, '#128A3E', null, 0.2],   // Admin Mode: Approve
};
const pill = (name, w, h, style, pressed) => {
  const [fill, fillP, stroke, a] = PILL[style];
  const sh = pressed ? shadow(w, h, 0.5, 1, a * 0.7) : shadow(w, h, 1.5, 2, a);
  const y = pressed ? 2 : 1, ph = h - 5, sw = 1.2;
  const r = stroke ? rrect(2 + sw / 2, y + sw / 2, w - 4 - sw, ph - sw, (ph - sw) / 2, `fill="${pressed ? fillP : fill}" stroke="${stroke}" stroke-width="${p(sw)}" filter="url(#${sh.id})"`)
    : rrect(2, y, w - 4, ph, ph / 2, `fill="${pressed ? fillP : fill}" filter="url(#${sh.id})"`);
  write(name + (pressed ? '_p' : ''), w, h, r, sh.def);
};
for (const style of Object.keys(PILL)) for (const pr of [false, true]) {
  pill(`bg_btn_${style}`, 330, 56, style, pr); pill(`bg_btn_${style}_h`, 160, 56, style, pr); pill(`bg_btn_${style}_t`, 100, 52, style, pr);
}

// 3) tiles 160 x 160 dp: card, icon in a soft square (top left), arrow in a circle (bottom right). Text: left, middle.
const tile = (name, o, pressed) => {
  const W = 160, H = 160, y = pressed ? 2 : 1;
  const sh = o.flat ? null : (pressed ? shadow(W, H, 0.5, 1.2, o.a * 0.7) : shadow(W, H, 2, 3, o.a));
  const fill = pressed ? o.fillP : o.fill;
  let s = rrect(2, y, W - 4, H - 5, 22, `fill="${fill}"${o.stroke ? ` stroke="${o.stroke}" stroke-width="${p(1)}"` : ''}${sh ? ` filter="url(#${sh.id})"` : ''}`);
  s += rrect(14, y + 13, 44, 44, 14, `fill="${o.sq}"`) + o.ico(y);
  s += `<circle cx="${p(W - 2 - 14 - 15)}" cy="${p(y + H - 5 - 14 - 15)}" r="${p(15)}" fill="${o.dot}"/>` + o.arrow(W - 2 - 14 - 30 + 7, y + H - 5 - 14 - 30 + 7);
  write(name + (pressed ? '_p' : ''), W, H, s, sh ? sh.def : '');
};
const arrowIn = (col) => (x, y) => icon('arrowUp', x, y, 16, col, 2.6);
const homeTiles = {
  start: { fill: T.yel, fillP: T.yelP, a: 0.18, sq: 'rgba(255,255,255,0.55)', ico: (y) => icon('book', 24, y + 23, 24, T.ink), dot: T.ink, arrow: arrowIn('#FFFFFF') },
  scan: { fill: T.ink, fillP: '#000000', a: 0.24, sq: 'rgba(255,255,255,0.10)', ico: (y) => icon('qr', 24, y + 23, 24, T.yel), dot: T.yel, arrow: arrowIn(T.ink) },
  skills: { fill: T.card, fillP: T.cardP, a: 0.09, sq: T.grnS, ico: (y) => icon('star', 24, y + 23, 24, T.grn), dot: T.soft, arrow: arrowIn(T.ink) },
  settings: { fill: T.card, fillP: T.cardP, a: 0.09, sq: T.soft, ico: (y) => icon('gear', 24, y + 23, 24, T.ink), dot: T.soft, arrow: arrowIn(T.ink) },
};
for (const [k, o] of Object.entries(homeTiles)) for (const pr of [false, true]) tile(`tile_home_${k}`, o, pr);
for (const code of Object.keys(MODS)) for (const pr of [false, true]) {
  tile(`tile_mod_${code}`, { fill: T.card, fillP: T.cardP, a: 0.09, sq: T.yelS, ico: (y) => modIcon(code, 21, y + 20, 30, T.ink), dot: T.soft, arrow: arrowIn(T.ink) }, pr);
  tile(`tile_mod_${code}_soon`, { flat: true, fill: '#EEEAE3', fillP: '#E7E2DA', sq: '#E3DED5', ico: (y) => modIcon(code, 21, y + 20, 30, T.ink, 0.35), dot: '#E3DED5', arrow: (x, y) => icon('clock', x, y, 16, T.mut, 2.4) }, pr);
}

// 4) round back button for the light title bar (48 dp), and the blue one for AI screens
for (const pr of [false, true]) {
  const sh = pr ? shadow(48, 48, 0.5, 1, 0.08) : shadow(48, 48, 1.5, 2, 0.12);
  write('bg_btn_back' + (pr ? '_p' : ''), 48, 48, `<circle cx="${p(24)}" cy="${p(pr ? 24 : 23)}" r="${p(19)}" fill="${pr ? T.cardP : T.card}" filter="url(#${sh.id})"/>` + icon('back', 14, (pr ? 24 : 23) - 10, 20, T.ink, 2.6), sh.def);
  write('bg_btn_back_ai' + (pr ? '_p' : ''), 48, 48, `<circle cx="${p(24)}" cy="${p(24)}" r="${p(19)}" fill="rgba(255,255,255,${pr ? 0.28 : 0.18})"/>` + icon('back', 14, 14, 20, '#FFFFFF', 2.6));
}

// 5) rounded cards with any height: top cap + plain coloured middle (an arrangement) + bottom cap.
//    330 dp wide, radius 16 dp. Bordered tones (safety red, mistakes yellow) get 2 dp side strips in the middle.
const CAP = {   // fill, border
  w: [T.card, null], wp: [T.cardP, null], r: [T.redS, T.red], y: [T.yelS, T.yel], g: [T.grnS, null], k: [T.ink, null], b: [T.blueS, null],
};
const R = 16, CW = 330;
for (const [tone, [fill, border]] of Object.entries(CAP)) {
  // top: round top corners, flat bottom edge that meets the middle part
  const topFill = `M0 ${p(R)} A${p(R)} ${p(R)} 0 0 1 ${p(R)} 0 H${p(CW - R)} A${p(R)} ${p(R)} 0 0 1 ${p(CW)} ${p(R)} Z`;
  const topLine = `M${p(1)} ${p(R)} A${p(R - 1)} ${p(R - 1)} 0 0 1 ${p(R)} ${p(1)} H${p(CW - R)} A${p(R - 1)} ${p(R - 1)} 0 0 1 ${p(CW - 1)} ${p(R)}`;   // 2 dp line on 0..2 dp
  write(`cap_${tone}_t`, CW, R, `<path d="${topFill}" fill="${fill}"/>` + (border ? `<path d="${topLine}" fill="none" stroke="${border}" stroke-width="${p(2)}"/>` : ''));
  // bottom: round bottom corners + a soft shadow below (4 dp)
  const sh = shadow(CW, R + 4, 1.5, 1.5, border ? 0.05 : 0.08);
  const botFill = `M0 0 H${p(CW)} A${p(R)} ${p(R)} 0 0 1 ${p(CW - R)} ${p(R)} H${p(R)} A${p(R)} ${p(R)} 0 0 1 0 0 Z`;
  const botLine = `M${p(1)} 0 A${p(R - 1)} ${p(R - 1)} 0 0 0 ${p(R)} ${p(R - 1)} H${p(CW - R)} A${p(R - 1)} ${p(R - 1)} 0 0 0 ${p(CW - 1)} 0`;
  write(`cap_${tone}_b`, CW, R + 4, `<path d="${botFill}" fill="${fill}" filter="url(#${sh.id})"/>` + (border ? `<path d="${botLine}" fill="none" stroke="${border}" stroke-width="${p(2)}"/>` : ''), sh.def);
}

// 6) fixed-size cards (the arrangement's background picture; children sit on top)
const card = (name, w, h, r, fill, a, extra = '') => {
  for (const pr of [false, true]) {
    const sh = pr ? shadow(w, h, 0.5, 1, a * 0.7) : shadow(w, h, 1.5, 2.5, a);
    write(name + (pr ? '_p' : ''), w, h, rrect(2, pr ? 2 : 1, w - 4, h - 6, r, `fill="${pr ? T.cardP : fill}" filter="url(#${sh.id})"`) + extra, sh.def);
  }
};
card('bg_card_continue', 330, 96, 20, T.card, 0.09);                    // Home: Continue
card('bg_row', 330, 64, 18, T.card, 0.08);                              // Settings rows (voice help, About)
for (const pr of [false, true]) {                                         // Admin Mode list rows 330 x 90 dp (card 80 dp + 9 dp gap below)
  const sh = pr ? shadow(330, 90, 0.5, 1, 0.06) : shadow(330, 90, 1.5, 2.5, 0.08);
  write('bg_row_t' + (pr ? '_p' : ''), 330, 90, rrect(2, pr ? 2 : 1, 326, 80, 18, `fill="${pr ? T.cardP : T.card}" filter="url(#${sh.id})"`), sh.def);
}
card('bg_audio', 330, 64, 29, T.card, 0.09);                            // lesson audio bar (pill)
card('bg_field', 330, 60, 27, T.card, 0.08, rrect(2.5, 1.5, 325, 53, 26.5, `fill="none" stroke="${T.line}" stroke-width="${p(1)}"`));   // type-a-code field

// 7) quiz answers 330 x 64 dp: white card; right = green, wrong = red, with a coloured bar on the left
const opt = (name, fill, border, bar) => {
  for (const pr of [false, true]) {
    const y = pr ? 2 : 1, sh = pr ? shadow(330, 64, 0.5, 1, 0.06) : shadow(330, 64, 1.2, 1.8, 0.07), id = 'cl' + (++fid);
    write(name + (pr ? '_p' : ''), 330, 64,
      `<clipPath id="${id}">${rrect(2, y, 326, 59, 16, '')}</clipPath>` +
      rrect(2, y, 326, 59, 16, `fill="${pr && !bar ? T.cardP : fill}" filter="url(#${sh.id})"`) +
      (bar ? `<rect x="${p(2)}" y="${p(y)}" width="${p(6)}" height="${p(59)}" fill="${bar}" clip-path="url(#${id})"/>` : '') +
      rrect(2 + (border ? 1 : 0.5), y + (border ? 1 : 0.5), 326 - (border ? 2 : 1), 59 - (border ? 2 : 1), 15.5, `fill="none" stroke="${border || T.line}" stroke-width="${p(border ? 2 : 1)}"`), sh.def);
  }
};
opt('bg_opt', T.card, null, null);
opt('bg_opt_right', T.grnS, T.grn, T.grn);
opt('bg_opt_wrong', T.redS, T.red, T.red);
// language choice 330 x 76 dp (first launch): radio on the right; chosen = yellow tint + yellow check
for (const on of [false, true]) for (const pr of [false, true]) {
  const y = pr ? 2 : 1, sh = pr ? shadow(330, 76, 0.5, 1, 0.06) : shadow(330, 76, 1.5, 2.2, 0.08);
  const cy = y + 35.5;
  write(`bg_choice${on ? '_on' : ''}${pr ? '_p' : ''}`, 330, 76,
    rrect(2, y, 326, 71, 20, `fill="${on ? T.yelS : pr ? T.cardP : T.card}" filter="url(#${sh.id})"`) +
    rrect(on ? 3 : 2.5, (on ? 1 : 0.5) + y, on ? 324 : 325, on ? 69 : 70, 19.5, `fill="none" stroke="${on ? T.yel : T.line}" stroke-width="${p(on ? 2 : 1)}"`) +
    (on ? `<circle cx="${p(300)}" cy="${p(cy)}" r="${p(12)}" fill="${T.yel}"/>` + icon('tick', 292, cy - 8, 16, T.ink, 3)
      : `<circle cx="${p(300)}" cy="${p(cy)}" r="${p(11)}" fill="none" stroke="#CFC8BC" stroke-width="${p(2)}"/>`), sh.def);
}

// 8) progress gauge for Home and My Skills: white card 330 x 168 dp, half circle of 12 rounded segments (yellow = done)
const GAUGE_N = 12;
for (let k = 0; k <= GAUGE_N; k++) {
  const sh = shadow(330, 168, 1.5, 2.5, 0.09), cx = 165, cy = 134, r = 94, thick = 13;
  let segs = '';
  for (let i = 0; i < GAUGE_N; i++) {
    const a0 = Math.PI + (i + 0.5) * Math.PI / GAUGE_N, half = (Math.PI / GAUGE_N) * 0.12;
    const pt = (a) => `${p(cx + r * Math.cos(a))} ${p(cy + r * Math.sin(a))}`;
    segs += `<path d="M${pt(a0 - half)} A${p(r)} ${p(r)} 0 0 1 ${pt(a0 + half)}" fill="none" stroke="${i < k ? T.yel : '#EEEAE3'}" stroke-width="${p(thick)}" stroke-linecap="round"/>`;
  }
  write(`gauge_${k}`, 330, 168, rrect(2, 1, 326, 162, 24, `fill="${T.card}" filter="url(#${sh.id})"`) + segs, sh.def);
}
// quiz score ring 168 x 168 dp: 5 segments (green = right answers)
for (let k = 0; k <= 5; k++) {
  const cx = 84, cy = 84, r = 70, thick = 14; let segs = '';
  for (let i = 0; i < 5; i++) {
    const a0 = -Math.PI / 2 + (i + 0.5) * 2 * Math.PI / 5, half = (Math.PI / 5) * 0.72;
    const pt = (a) => `${p(cx + r * Math.cos(a))} ${p(cy + r * Math.sin(a))}`;
    segs += `<path d="M${pt(a0 - half)} A${p(r)} ${p(r)} 0 0 1 ${pt(a0 + half)}" fill="none" stroke="${i < k ? T.grn : '#E6E1D8'}" stroke-width="${p(thick)}" stroke-linecap="round"/>`;
  }
  write(`ring_${k}`, 168, 168, `<circle cx="${p(cx)}" cy="${p(cy)}" r="${p(56)}" fill="${T.card}"/>` + segs);
}

// 9) picture corners: page-coloured corners over the lesson picture (the picture is the arrangement background)
{
  const W = 330, H = 220, r = 20;
  write('mask_pic', W, H, `<path fill-rule="evenodd" fill="${T.page}" d="M0 0H${p(W)}V${p(H)}H0Z M${p(r)} 0H${p(W - r)}A${p(r)} ${p(r)} 0 0 1 ${p(W)} ${p(r)}V${p(H - r)}A${p(r)} ${p(r)} 0 0 1 ${p(W - r)} ${p(H)}H${p(r)}A${p(r)} ${p(r)} 0 0 1 0 ${p(H - r)}V${p(r)}A${p(r)} ${p(r)} 0 0 1 ${p(r)} 0Z"/>`);
}

// 10) small round status pictures 48 dp and feedback icons
const dot = (name, fill, ic, col, sw = 2.8, r = 17) => write(name, 48, 48, `<circle cx="${p(24)}" cy="${p(24)}" r="${p(r)}" fill="${fill}"/>` + icon(ic, 14, 14, 20, col, sw));
dot('st_go', T.soft, 'chev', T.ink);              // lesson card: open
dot('st_done', T.grn, 'tick', '#FFFFFF', 3);       // lesson card: completed (MOD-2 tick)
dot('st_go_y', T.yel, 'arrow', T.ink);             // Continue card
dot('st_scan', T.soft, 'qr', T.ink, 2.2);          // spare
dot('ic_fb_ok', T.grn, 'tick', '#FFFFFF', 3, 16);  // quiz: right
dot('ic_fb_no', T.red, 'cross', '#FFFFFF', 3, 16); // quiz: wrong
// icons in a soft square for Settings rows (48 dp)
const sq = (name, bg, ic, col) => write(name, 48, 48, rrect(6, 6, 36, 36, 11, `fill="${bg}"`) + icon(ic, 13, 13, 22, col, 2.4));
sq('ic_row_speaker', T.yelS, 'speaker', T.ink);
sq('ic_row_info', T.soft, 'info', T.ink);
sq('ic_row_lessons', T.grnS, 'book', T.grn);
sq('ic_row_sup', T.soft, 'users', T.ink);
// lesson page boxes (LES-3 "with icons"): red warning for safety, yellow cross for common mistakes (48 dp, shown at 32)
dot('ic_box_warn', T.red, 'warn', '#FFFFFF', 2.4, 20);
dot('ic_box_mistake', T.yel, 'cross', T.ink, 3, 20);
// module icon in a soft yellow square (48 dp): My Skills rows and lesson cards
for (const code of Object.keys(MODS)) write(`ic_sq_${code}`, 48, 48, rrect(4, 4, 40, 40, 12, `fill="${T.yelS}"`) + modIcon(code, 10, 10, 28, T.ink));
// badges for My Skills (56 dp): module icon in a yellow circle with a ring
for (const code of Object.keys(MODS)) write(`badge_${code}`, 56, 56, `<circle cx="${p(28)}" cy="${p(28)}" r="${p(26)}" fill="${T.yelS}" stroke="${T.yel}" stroke-width="${p(2.5)}"/>` + modIcon(code, 14, 14, 28, T.ink));
// audio buttons (48 dp): yellow play / pause, restart in a soft circle
write('btn_play', 48, 48, `<circle cx="${p(24)}" cy="${p(24)}" r="${p(22)}" fill="${T.yel}"/>` + icon('play', 13.5, 12, 24, T.ink));
write('btn_pause', 48, 48, `<circle cx="${p(24)}" cy="${p(24)}" r="${p(22)}" fill="${T.yel}"/>` + icon('pause', 12, 12, 24, T.ink));
write('btn_restart', 48, 48, `<circle cx="${p(24)}" cy="${p(24)}" r="${p(18)}" fill="${T.soft}"/>` + icon('restart', 14, 14, 20, T.ink, 2.6));
// big scan button 330 x 200 dp: charcoal card, yellow viewfinder corners around a QR icon (label set by the app)
for (const pr of [false, true]) {
  const y = pr ? 2 : 1, sh = pr ? shadow(330, 200, 0.5, 1, 0.16) : shadow(330, 200, 2, 3, 0.24);
  const bx = 165 - 46, by = y + 18, bs = 92, L = 22;
  const corners = [[bx, by, 1, 1], [bx + bs, by, -1, 1], [bx, by + bs, 1, -1], [bx + bs, by + bs, -1, -1]]
    .map(([x, yy, dx, dy]) => `<path d="M${p(x)} ${p(yy + dy * L)} V${p(yy + dy * 6)} Q${p(x)} ${p(yy)} ${p(x + dx * 6)} ${p(yy)} H${p(x + dx * L)}" fill="none" stroke="${T.yel}" stroke-width="${p(4)}" stroke-linecap="round"/>`).join('');
  write('bg_scan_big' + (pr ? '_p' : ''), 330, 200, rrect(2, y, 326, 195, 24, `fill="${pr ? '#000000' : T.ink}" filter="url(#${sh.id})"`) + corners + icon('qr', 165 - 24, by + 22, 48, '#FFFFFF', 2), sh.def);
}
// ---------- Admin Mode (UI v3): status colours, stat tiles, dark hero with hazard stripes, tool tiles ----------
// lesson status icons (48 dp): Draft grey · In review amber · Changes needed red · Approved green · Published (live) solid green · Hidden grey
sq('st_draft', '#EEEAE3', 'pencil', T.mut);
sq('st_review', T.yelS, 'eye', T.yelInk);
sq('st_changes', T.redS, 'warn', T.red);
sq('st_approved', T.grnS, 'tick', T.grn);
write('st_live', 48, 48, rrect(6, 6, 36, 36, 11, `fill="${T.grn}"`) + icon('live', 13, 13, 22, '#FFFFFF', 2.2));
sq('st_hidden', T.soft, 'lock', T.mut);
sq('ic_sq_qr', T.soft, 'qr', T.ink);
sq('ic_row_key', T.yelS, 'key', T.ink);   // First setup / Server keys
// stat tile 100 x 92 dp (dashboard: Live / To review / Version)
{ const sh = shadow(100, 92, 1.5, 2.2, 0.09); write('bg_stat', 100, 92, rrect(2, 1, 96, 86, 18, `fill="${T.card}" filter="url(#${sh.id})"`), sh.def); }
// hazard stripes: section header line under the Admin Mode title bar (PRD 14.1: stripes only for section headers and safety)
const stripes = (x, y, w, h, step) => { let s = ''; for (let k = -h; k < w + h; k += step * 2) s += `<path d="M${p(x + k)} ${p(y + h)} L${p(x + k + h)} ${p(y)} H${p(x + k + h + step)} L${p(x + k + step)} ${p(y + h)} Z" fill="${T.ink}"/>`; return s; };
write('stripe', 330, 6, `<rect width="${p(330)}" height="${p(6)}" fill="${T.yel}"/>` + stripes(0, 0, 330, 6, 6));
// login hero 330 x 176 dp: charcoal card, hazard band at the bottom (logo and title are put on top by the app)
{
  const sh = shadow(330, 176, 2, 3, 0.22), id = 'clh';
  write('bg_hero_admin', 330, 176, `<clipPath id="${id}">${rrect(2, 1, 326, 170, 24, '')}</clipPath>` +
    rrect(2, 1, 326, 170, 24, `fill="${T.ink}" filter="url(#${sh.id})"`) +
    `<g clip-path="url(#${id})"><rect x="0" y="${p(157)}" width="${p(330)}" height="${p(14)}" fill="${T.yel}"/>${stripes(0, 157, 330, 14, 10)}</g>`, sh.def);
}
// tool tiles 160 x 104 dp: icon top left, arrow bottom right; label set by the app (second line)
const toolTile = (name, ic) => {
  for (const pr of [false, true]) {
    const W = 160, H = 104, y = pr ? 2 : 1, sh = pr ? shadow(W, H, 0.5, 1.2, 0.06) : shadow(W, H, 2, 3, 0.09);
    write(name + (pr ? '_p' : ''), W, H, rrect(2, y, W - 4, H - 5, 20, `fill="${pr ? T.cardP : T.card}" filter="url(#${sh.id})"`) +
      rrect(12, y + 11, 36, 36, 11, `fill="${T.soft}"`) + icon(ic, 19, y + 18, 22, T.ink, 2.3) +
      `<circle cx="${p(W - 2 - 12 - 13)}" cy="${p(y + H - 5 - 12 - 13)}" r="${p(13)}" fill="${T.soft}"/>` + icon('arrowUp', W - 2 - 12 - 26 + 6, y + H - 5 - 12 - 26 + 6, 14, T.ink, 2.6), sh.def);
  }
};
toolTile('tile_tool_qr', 'qr');
toolTile('tile_tool_texts', 'texts');
// photo placeholder 330 x 200 dp (steps editor before a picture is chosen)
write('ph_photo', 330, 200, rrect(1, 1, 328, 198, 18, `fill="${T.page}" stroke="#D6CFC2" stroke-width="${p(1.5)}" stroke-dasharray="${p(6)} ${p(5)}"`) +
  `<circle cx="${p(165)}" cy="${p(100)}" r="${p(30)}" fill="${T.soft}"/>` + icon('camera', 165 - 16, 100 - 16, 32, T.mut, 2));
// transparent picture: buttons that should look like plain text on a card
write('bg_clear', 8, 8, '');
// old flat tiles (kept for the prototype only)
for (const [k, c] of Object.entries({ yellow: T.yel, charcoal: T.ink, green: '#E7F5EC', grey: '#EFEDE8' })) write(`bg_tile_${k}`, 160, 128, rrect(0, 0, 160, 128, 16, `fill="${c}"`));
console.log(`Wrote ${n} SVGs to design/app-assets/`);
