// SITE SAATHI - step illustrations for SS-MAS-01 (Day 6)
// Writes design/illustrations/SS-MAS-01_s1..s7.svg (1080 x 720, no words, language-neutral).
// Then run tools/export-media.sh (Chrome headless) to make media/SS-MAS-01_sN.jpg.
// DRAFT drawings: replace with real site photos (taken with permission) when available.
'use strict';
const fs = require('fs');
const path = require('path');
const OUT = path.resolve(__dirname, '..', 'design', 'illustrations');
fs.mkdirSync(OUT, { recursive: true });

const K = '#1B1F24', Y = '#FFC21A', G = '#15A34A', R = '#DC2626', BG = '#FBFAF7';
const BRICK = '#C0583A', MORTAR = '#B9B2A6', GROUND = '#D9D3C7', WATER = '#8EC5E0', SAND = '#E2C58C', CEMENT = '#9A9A98';

const svg = (n, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 720" width="1080" height="720">
<rect width="1080" height="720" fill="${BG}"/>
${body}
<circle cx="80" cy="80" r="46" fill="${Y}" stroke="${K}" stroke-width="5"/>
<text x="80" y="98" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="52" fill="${K}">${n}</text>
</svg>`;
const ground = (y = 590) => `<rect x="0" y="${y}" width="1080" height="${720 - y}" fill="${GROUND}"/><line x1="0" y1="${y}" x2="1080" y2="${y}" stroke="${K}" stroke-width="4"/>`;
const brick = (x, y, w = 110, h = 46, rot = 0, op = 1) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${BRICK}" stroke="${K}" stroke-width="4" opacity="${op}"${rot ? ` transform="rotate(${rot} ${x + w / 2} ${y + h / 2})"` : ''}/>`;
const tick = (cx, cy, r = 40) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${G}"/><path d="M${cx - r * 0.45} ${cy + 2} l${r * 0.3} ${r * 0.3} l${r * 0.6} -${r * 0.6}" fill="none" stroke="#fff" stroke-width="${r * 0.2}" stroke-linecap="round" stroke-linejoin="round"/>`;
const cross = (cx, cy, r = 40) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${R}"/><path d="M${cx - r * 0.38} ${cy - r * 0.38} L${cx + r * 0.38} ${cy + r * 0.38} M${cx + r * 0.38} ${cy - r * 0.38} L${cx - r * 0.38} ${cy + r * 0.38}" stroke="#fff" stroke-width="${r * 0.2}" stroke-linecap="round"/>`;
const arrow = (x1, y1, x2, y2, c = K) => {
  const a = Math.atan2(y2 - y1, x2 - x1), h = 26;
  const p1 = [x2 - h * Math.cos(a - 0.5), y2 - h * Math.sin(a - 0.5)], p2 = [x2 - h * Math.cos(a + 0.5), y2 - h * Math.sin(a + 0.5)];
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="10" stroke-linecap="round"/><path d="M${x2} ${y2} L${p1} L${p2} Z" fill="${c}" stroke="${c}" stroke-width="6" stroke-linejoin="round"/>`;
};
// Wall in stretcher bond: courses from bottom (yBase) upward
function wall(x0, yBase, courses, perCourse, bw = 104, bh = 42, gap = 10, aligned = false) {
  let s = `<rect x="${x0 - gap / 2}" y="${yBase - courses * (bh + gap)}" width="${perCourse * (bw + gap)}" height="${courses * (bh + gap)}" fill="${MORTAR}" stroke="${K}" stroke-width="4"/>`;
  for (let c = 0; c < courses; c++) {
    const y = yBase - (c + 1) * (bh + gap) + gap / 2;
    const off = !aligned && c % 2 ? -(bw + gap) / 2 : 0;
    for (let i = -1; i <= perCourse; i++) {
      let x = x0 + off + i * (bw + gap), w = bw;
      const L = x0, Rr = x0 + perCourse * (bw + gap) - gap;
      if (x + w <= L || x >= Rr) continue;
      if (x < L) { w -= L - x; x = L; }
      if (x + w > Rr) w = Rr - x;
      s += `<rect x="${x}" y="${y}" width="${w}" height="${bh}" fill="${BRICK}" stroke="${K}" stroke-width="3"/>`;
    }
  }
  return s;
}

const scenes = {
  // 1 · Soak bricks until bubbles stop
  1: () => {
    let s = ground(620);
    s += `<path d="M300 300 H880 L840 620 H340 Z" fill="#7C828C" stroke="${K}" stroke-width="6" stroke-linejoin="round"/>`;
    s += `<path d="M318 350 H862 L830 600 H350 Z" fill="${WATER}"/>`;
    s += brick(380, 520, 120, 50, -8) + brick(520, 530, 120, 50, 6) + brick(660, 515, 120, 50, -4) + brick(450, 450, 120, 50, 10, 0.95) + brick(610, 455, 120, 50, -12, 0.95);
    for (const [x, y, r] of [[470, 420, 10], [500, 385, 7], [640, 410, 12], [690, 372, 8], [560, 395, 6], [740, 420, 9]])
      s += `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="${K}" stroke-width="3"/>`;
    s += `<path d="M318 350 H862" stroke="${K}" stroke-width="4"/>`;
    s += brick(60, 560, 110, 44) + brick(60, 512, 110, 44) + brick(170, 560, 110, 44);
    s += arrow(180, 470, 330, 380);
    return s;
  },
  // 2 · Measure 1 : 6 with a box, mix, use within 30 min
  2: () => {
    let s = ground(620);
    const box = (x, y, fill) => `<path d="M${x} ${y} h90 l-10 80 h-70 z" fill="${fill}" stroke="${K}" stroke-width="5" stroke-linejoin="round"/>`;
    s += box(90, 300, CEMENT);
    s += `<text x="135" y="460" text-anchor="middle" font-family="Arial" font-weight="700" font-size="64" fill="${K}">1</text>`;
    s += `<text x="230" y="370" text-anchor="middle" font-family="Arial" font-weight="700" font-size="80" fill="${K}">+</text>`;
    for (let i = 0; i < 6; i++) s += box(290 + (i % 3) * 110, 230 + Math.floor(i / 3) * 110, SAND);
    s += `<text x="445" y="490" text-anchor="middle" font-family="Arial" font-weight="700" font-size="64" fill="${K}">6</text>`;
    s += arrow(640, 380, 730, 380);
    s += `<path d="M740 620 Q860 380 990 620 Z" fill="#A99E88" stroke="${K}" stroke-width="5"/>`;
    s += `<path d="M870 470 L925 380" stroke="${K}" stroke-width="10" stroke-linecap="round"/><path d="M905 330 L960 345 L935 405 L895 395 Z" fill="#C9CDD3" stroke="${K}" stroke-width="5" stroke-linejoin="round"/>`;
    s += `<circle cx="930" cy="150" r="80" fill="#fff" stroke="${K}" stroke-width="6"/><path d="M930 150 L930 75 A75 75 0 0 1 930 225 Z" fill="${Y}"/><circle cx="930" cy="150" r="80" fill="none" stroke="${K}" stroke-width="6"/><line x1="930" y1="150" x2="930" y2="88" stroke="${K}" stroke-width="7" stroke-linecap="round"/><line x1="930" y1="150" x2="930" y2="210" stroke="${K}" stroke-width="5" stroke-linecap="round"/>`;
    s += `<text x="930" y="275" text-anchor="middle" font-family="Arial" font-weight="700" font-size="40" fill="${K}">30</text>`;
    return s;
  },
  // 3 · Pegs + tight string line at first-brick height
  3: () => {
    let s = ground(560);
    s += `<path d="M150 470 h30 v120 l-15 30 l-15 -30 z" fill="#8B5E34" stroke="${K}" stroke-width="5" stroke-linejoin="round"/>`;
    s += `<path d="M900 470 h30 v120 l-15 30 l-15 -30 z" fill="#8B5E34" stroke="${K}" stroke-width="5" stroke-linejoin="round"/>`;
    s += `<line x1="180" y1="500" x2="900" y2="500" stroke="${Y}" stroke-width="6"/><line x1="180" y1="500" x2="900" y2="500" stroke="${K}" stroke-width="2" stroke-dasharray="2 0"/>`;
    s += `<line x1="200" y1="585" x2="880" y2="585" stroke="#fff" stroke-width="8" stroke-dasharray="30 18"/>`;
    s += `<rect x="215" y="548" width="660" height="12" fill="${MORTAR}" stroke="${K}" stroke-width="3"/>`;
    s += brick(220, 502, 110, 46);
    s += `<path d="M360 502 v46 M350 502 h20 M350 548 h20" stroke="${G}" stroke-width="5"/>`;
    s += tick(540, 300, 48);
    s += brick(940, 250, 100, 40) + brick(940, 206, 100, 40);
    return s;
  },
  // 4 · Full mortar bed, first row, spirit level
  4: () => {
    let s = ground(600);
    s += `<rect x="130" y="574" width="820" height="26" fill="${MORTAR}" stroke="${K}" stroke-width="4"/>`;
    s += `<rect x="140" y="524" width="808" height="50" fill="${MORTAR}" stroke="${K}" stroke-width="3"/>`;
    for (let i = 0; i < 7; i++) s += brick(140 + i * 116, 524, 106, 50);
    s += `<rect x="180" y="490" width="720" height="34" rx="6" fill="${Y}" stroke="${K}" stroke-width="5"/>`;
    s += `<rect x="490" y="496" width="100" height="22" rx="11" fill="#CDEFD6" stroke="${K}" stroke-width="3"/><circle cx="540" cy="507" r="8" fill="#fff" stroke="${K}" stroke-width="3"/><line x1="520" y1="496" x2="520" y2="518" stroke="${K}" stroke-width="2"/><line x1="560" y1="496" x2="560" y2="518" stroke="${K}" stroke-width="2"/>`;
    s += tick(540, 380, 56);
    return s;
  },
  // 5 · Staggered joints (right), frog up, joints ~10 mm; aligned joints (wrong)
  5: () => {
    let s = ground(620);
    s += wall(110, 620, 7, 5, 100, 42, 12);
    s += tick(400, 140, 46);
    s += `<rect x="700" y="170" width="320" height="200" rx="18" fill="#fff" stroke="${K}" stroke-width="4"/>`;
    s += `<path d="M770 250 h180 v80 h-180 z" fill="${BRICK}" stroke="${K}" stroke-width="4"/><path d="M810 250 l20 26 h60 l20 -26" fill="#8E3C25" stroke="${K}" stroke-width="4" stroke-linejoin="round"/>`;
    s += arrow(860, 225, 860, 190, G) + tick(985, 210, 26);
    s += `<rect x="700" y="400" width="320" height="220" rx="18" fill="#fff" stroke="${K}" stroke-width="4"/>`;
    s += wall(740, 600, 4, 2, 110, 36, 10, true);
    s += `<path d="M851 440 l-12 25 l14 22 l-12 25 l14 22 l-12 25 l12 25" fill="none" stroke="${R}" stroke-width="6" stroke-linejoin="round"/>`;
    s += cross(985, 430, 26);
    return s;
  },
  // 6 · Plumb bob: same gap at top and bottom
  6: () => {
    let s = ground(620);
    s += wall(300, 620, 9, 4, 96, 42, 12);
    s += `<line x1="800" y1="110" x2="690" y2="110" stroke="#8B5E34" stroke-width="14" stroke-linecap="round"/>`;
    s += `<line x1="800" y1="110" x2="800" y2="530" stroke="${K}" stroke-width="4"/>`;
    s += `<path d="M778 530 h44 l-22 54 z" fill="${Y}" stroke="${K}" stroke-width="5" stroke-linejoin="round"/>`;
    s += `<path d="M736 175 h60 M736 162 v26 M796 162 v26" stroke="${G}" stroke-width="6"/>`;
    s += `<path d="M736 470 h60 M736 457 v26 M796 457 v26" stroke="${G}" stroke-width="6"/>`;
    s += tick(930, 330, 50);
    return s;
  },
  // 7 · Clean joints, keep wet for 7 days
  7: () => {
    let s = ground(620);
    s += wall(150, 620, 8, 4, 100, 42, 12);
    for (const [x, y] of [[640, 220], [610, 280], [660, 330], [600, 380], [650, 430], [590, 200], [620, 470]])
      s += `<path d="M${x} ${y} q-12 18 0 26 q12 -8 0 -26 z" fill="${WATER}" stroke="${K}" stroke-width="3"/>`;
    s += `<path d="M700 300 h60 l40 -40 h50 v90 h-50 l-40 -40 h-60 z" fill="#2F855A" stroke="${K}" stroke-width="5" stroke-linejoin="round" transform="rotate(10 760 300)"/>`;
    s += `<path d="M850 290 Q960 300 1000 420" fill="none" stroke="#2F855A" stroke-width="16" stroke-linecap="round"/>`;
    s += `<rect x="830" y="70" width="210" height="190" rx="14" fill="#fff" stroke="${K}" stroke-width="5"/><rect x="830" y="70" width="210" height="44" rx="14" fill="${Y}" stroke="${K}" stroke-width="5"/>`;
    for (let i = 0; i < 7; i++) {
      const cx = 862 + (i % 4) * 48, cy = 148 + Math.floor(i / 4) * 56;
      s += `<path d="M${cx} ${cy - 16} q-14 20 0 30 q14 -10 0 -30 z" fill="${WATER}" stroke="${K}" stroke-width="3"/>`;
    }
    s += `<text x="1006" y="250" text-anchor="middle" font-family="Arial" font-weight="700" font-size="44" fill="${K}">7</text>`;
    return s;
  },
};

// ---------- shared helpers for Day 7 lessons ----------
const CONC = '#9EA3A8', WOOD = '#A8743F', STEEL = '#5B6068', SKIN = '#C9A27E', ORANGE = '#E86A1A';
const clipboard = (x, y) => `<rect x="${x}" y="${y}" width="150" height="190" rx="12" fill="#fff" stroke="${K}" stroke-width="5"/><rect x="${x + 45}" y="${y - 14}" width="60" height="28" rx="8" fill="${STEEL}" stroke="${K}" stroke-width="4"/>` +
  [0, 1, 2].map((i) => `<path d="M${x + 22} ${y + 50 + i * 45} l12 12 l22 -24" fill="none" stroke="${G}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><line x1="${x + 70}" y1="${y + 56 + i * 45}" x2="${x + 128}" y2="${y + 56 + i * 45}" stroke="${K}" stroke-width="5" stroke-linecap="round"/>`).join('');
const clock = (cx, cy, label, frac = 0.5) => {
  const a = frac * 2 * Math.PI, ex = cx + 70 * Math.sin(a), ey = cy - 70 * Math.cos(a);
  return `<circle cx="${cx}" cy="${cy}" r="76" fill="#fff" stroke="${K}" stroke-width="6"/><path d="M${cx} ${cy} L${cx} ${cy - 70} A70 70 0 ${frac > 0.5 ? 1 : 0} 1 ${ex} ${ey} Z" fill="${Y}"/><circle cx="${cx}" cy="${cy}" r="76" fill="none" stroke="${K}" stroke-width="6"/><line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - 58}" stroke="${K}" stroke-width="7" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="7" fill="${K}"/>` +
    (label ? `<text x="${cx}" y="${cy + 120}" text-anchor="middle" font-family="Arial" font-weight="700" font-size="40" fill="${K}">${label}</text>` : '');
};
const calendar7 = (x, y) => {
  let s = `<rect x="${x}" y="${y}" width="210" height="190" rx="14" fill="#fff" stroke="${K}" stroke-width="5"/><rect x="${x}" y="${y}" width="210" height="44" rx="14" fill="${Y}" stroke="${K}" stroke-width="5"/>`;
  for (let i = 0; i < 7; i++) { const cx = x + 32 + (i % 4) * 48, cy = y + 78 + Math.floor(i / 4) * 56; s += `<path d="M${cx} ${cy - 16} q-14 20 0 30 q14 -10 0 -30 z" fill="${WATER}" stroke="${K}" stroke-width="3"/>`; }
  return s + `<text x="${x + 176}" y="${y + 180}" text-anchor="middle" font-family="Arial" font-weight="700" font-size="44" fill="${K}">7</text>`;
};
const mixer = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
  <path d="M-40 60 L-80 200 M60 50 L110 200 M-110 200 H140" stroke="${K}" stroke-width="12" stroke-linecap="round"/>
  <circle cx="-80" cy="214" r="18" fill="${STEEL}" stroke="${K}" stroke-width="5"/><circle cx="110" cy="214" r="18" fill="${STEEL}" stroke="${K}" stroke-width="5"/>
  <g transform="rotate(-25)"><rect x="-110" y="-70" width="220" height="140" rx="70" fill="${ORANGE}" stroke="${K}" stroke-width="7"/><path d="M110 -40 v80" stroke="${K}" stroke-width="10"/><path d="M-40 -66 v132 M20 -68 v136" stroke="#b9530f" stroke-width="8"/></g></g>`;
// Pictogram worker (safety-sign style). ppe: helmet, jacket, gloves.
function worker(x, y, o = {}) {
  const { helmet = true, jacket = true, hc = Y, s = 1 } = o;
  const st = `stroke="${K}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
  let g = `<g transform="translate(${x} ${y}) scale(${s})">`;
  g += `<path d="M0 -95 L-28 0 M0 -95 L28 0" ${st}/>`;                         // legs
  g += `<path d="M-30 0 h-18 M30 0 h18" stroke="${K}" stroke-width="20" stroke-linecap="round"/>`; // boots
  g += jacket ? `<rect x="-30" y="-185" width="60" height="96" rx="18" fill="${ORANGE}" stroke="${K}" stroke-width="6"/><path d="M-30 -150 h60 M-30 -125 h60" stroke="#E8E8E8" stroke-width="8"/>`
    : `<path d="M0 -180 V-95" ${st}/>`;
  g += `<path d="M-26 -170 L-58 -118 M26 -170 L58 -118" ${st}/>`;                 // arms
  g += `<circle cx="-60" cy="-114" r="11" fill="${Y}" stroke="${K}" stroke-width="4"/><circle cx="60" cy="-114" r="11" fill="${Y}" stroke="${K}" stroke-width="4"/>`;
  g += `<circle cx="0" cy="-218" r="26" fill="${SKIN}" stroke="${K}" stroke-width="5"/>`;
  if (helmet) g += `<path d="M-30 -222 a30 30 0 0 1 60 0 z" fill="${hc}" stroke="${K}" stroke-width="5"/><rect x="-38" y="-226" width="76" height="10" rx="5" fill="${hc}" stroke="${K}" stroke-width="4"/>`;
  return g + '</g>';
}

const conScenes = {
  // 1 · Supervisor checks formwork and steel before concreting
  1: () => {
    let s = ground(640);
    for (const x of [190, 450, 710]) s += `<rect x="${x}" y="500" width="22" height="140" fill="${WOOD}" stroke="${K}" stroke-width="4"/>`;
    s += `<rect x="120" y="470" width="700" height="32" fill="${WOOD}" stroke="${K}" stroke-width="5"/>`;
    s += `<rect x="120" y="400" width="20" height="72" fill="${WOOD}" stroke="${K}" stroke-width="4"/><rect x="800" y="400" width="20" height="72" fill="${WOOD}" stroke="${K}" stroke-width="4"/>`;
    s += `<line x1="150" y1="440" x2="790" y2="440" stroke="${STEEL}" stroke-width="10" stroke-linecap="round"/><line x1="150" y1="410" x2="790" y2="410" stroke="${STEEL}" stroke-width="10" stroke-linecap="round"/>`;
    for (let x = 170; x <= 780; x += 55) s += `<circle cx="${x}" cy="425" r="8" fill="${STEEL}" stroke="${K}" stroke-width="3"/>`;
    for (const x of [230, 470, 710]) s += `<rect x="${x}" y="448" width="22" height="22" fill="${CONC}" stroke="${K}" stroke-width="3"/>`;
    s += clipboard(860, 110) + worker(950, 636, { hc: '#FFFFFF', s: 0.95 });
    return s;
  },
  // 2 · Measure every material with boxes, as the engineer says
  2: () => {
    let s = ground(620);
    const box = (x, fill, dots) => `<path d="M${x} 380 h120 l-12 100 h-96 z" fill="${fill}" stroke="${K}" stroke-width="6" stroke-linejoin="round"/>` +
      (dots ? [0, 1, 2, 3, 4].map((i) => `<circle cx="${x + 28 + (i % 3) * 30}" cy="${405 + Math.floor(i / 3) * 34}" r="9" fill="#6f747a" stroke="${K}" stroke-width="2"/>`).join('') : '');
    s += box(90, CEMENT) + box(260, SAND) + box(430, CONC, true);
    s += `<path d="M620 360 h90 v150 h-90 z" fill="#E4F2FA" stroke="${K}" stroke-width="6"/><path d="M620 420 h90 v90 h-90 z" fill="${WATER}"/><path d="M620 360 h90 v150 h-90 z" fill="none" stroke="${K}" stroke-width="6"/>`;
    for (let i = 0; i < 4; i++) s += `<line x1="690" y1="${385 + i * 30}" x2="708" y2="${385 + i * 30}" stroke="${K}" stroke-width="4"/>`;
    s += clipboard(820, 140) + tick(895, 470, 52);
    return s;
  },
  // 3 · Mix in the mixer about 2 minutes until the colour is even
  3: () => {
    let s = ground(640) + mixer(430, 410, 1.15);
    s += `<path d="M250 230 a190 190 0 0 1 300 -40" fill="none" stroke="${K}" stroke-width="8" stroke-dasharray="20 14"/><path d="M548 168 l18 34 l-38 4 z" fill="${K}"/>`;
    s += clock(860, 230, '2', 2 / 60 * 10);
    return s;
  },
  // 4 · Never add extra water
  4: () => {
    let s = ground(640) + mixer(360, 410, 1.0);
    s += `<g transform="rotate(35 700 260)"><path d="M640 200 h130 l-15 130 h-100 z" fill="#C9CDD3" stroke="${K}" stroke-width="6" stroke-linejoin="round"/><path d="M650 215 h110" stroke="${WATER}" stroke-width="16"/></g>`;
    for (const [x, y] of [[560, 300], [530, 340], [560, 380], [520, 400]]) s += `<path d="M${x} ${y} q-12 18 0 26 q12 -8 0 -26 z" fill="${WATER}" stroke="${K}" stroke-width="3"/>`;
    s += cross(860, 170, 62);
    return s;
  },
  // 5 · Place quickly (within ~30 min), from a low height
  5: () => {
    let s = ground(640);
    s += `<path d="M80 520 v100 h420 v-100" fill="none" stroke="${WOOD}" stroke-width="16"/><rect x="96" y="560" width="388" height="60" fill="${CONC}"/>`;
    s += `<g transform="rotate(30 330 470)"><path d="M250 450 h160 a80 40 0 0 1 -160 0 z" fill="${STEEL}" stroke="${K}" stroke-width="6"/></g>`;
    s += `<path d="M300 520 q10 20 0 40" stroke="${CONC}" stroke-width="22" stroke-linecap="round" fill="none"/>`;
    s += tick(300, 300, 50);
    s += `<rect x="690" y="150" width="340" height="470" rx="18" fill="#fff" stroke="${K}" stroke-width="4"/>`;
    s += `<path d="M740 560 v40 h240 v-40" fill="none" stroke="${WOOD}" stroke-width="12"/>`;
    s += `<g transform="rotate(30 860 220)"><path d="M800 210 h120 a60 30 0 0 1 -120 0 z" fill="${STEEL}" stroke="${K}" stroke-width="5"/></g>`;
    s += `<line x1="850" y1="270" x2="850" y2="540" stroke="${CONC}" stroke-width="18" stroke-dasharray="10 22" stroke-linecap="round"/>` + cross(985, 200, 30);
    s += clock(590, 150, '30', 0.5).replace(/r="76"/g, 'r="56"').replace(/r="70"/, 'r="50"');
    return s;
  },
  // 6 · Vibrate until air bubbles stop
  6: () => {
    let s = ground(640);
    s += `<path d="M120 360 v280 h640 v-280" fill="none" stroke="${WOOD}" stroke-width="16"/><rect x="136" y="380" width="608" height="252" fill="${CONC}"/>`;
    for (let i = 0; i < 40; i++) s += `<circle cx="${160 + (i * 97) % 570}" cy="${400 + (i * 53) % 220}" r="${6 + (i % 3) * 3}" fill="#7D8389"/>`;
    s += `<rect x="420" y="240" width="22" height="330" rx="10" fill="${STEEL}" stroke="${K}" stroke-width="5"/><path d="M431 240 C 431 160, 620 160, 760 200" fill="none" stroke="${K}" stroke-width="12"/>`;
    s += `<rect x="760" y="160" width="150" height="100" rx="14" fill="${Y}" stroke="${K}" stroke-width="6"/><circle cx="835" cy="210" r="22" fill="${K}"/>`;
    for (const [x, y, r] of [[380, 360, 10], [480, 345, 12], [400, 330, 7], [470, 315, 8], [360, 300, 6]]) s += `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="${K}" stroke-width="3"/>`;
    s += tick(930, 420, 52);
    return s;
  },
  // 7 · Level, then keep wet at least 7 days
  7: () => {
    let s = ground(640);
    s += `<rect x="80" y="470" width="700" height="170" fill="${CONC}" stroke="${K}" stroke-width="5"/>`;
    for (let i = 0; i < 4; i++) s += `<rect x="${100 + i * 170}" y="440" width="150" height="34" rx="6" fill="#B08A5A" stroke="${K}" stroke-width="4"/>`;
    for (const [x, y] of [[180, 360], [320, 330], [470, 370], [610, 340], [260, 400], [540, 410]]) s += `<path d="M${x} ${y} q-14 20 0 30 q14 -10 0 -30 z" fill="${WATER}" stroke="${K}" stroke-width="3"/>`;
    s += calendar7(830, 120);
    return s;
  },
};

const safScenes = {
  // 1 · Wear helmet, shoes, gloves, jacket before entering
  1: () => ground(640) + worker(540, 630, { s: 1.6 }) + tick(820, 220, 56),
  // 2 · Look first: open edges, holes, loose material, wet floor
  2: () => {
    let s = ground(600);
    s += `<ellipse cx="560" cy="620" rx="190" ry="40" fill="${K}"/>`;
    for (const x of [350, 560, 770]) s += `<rect x="${x - 8}" y="470" width="16" height="140" fill="${R}" stroke="${K}" stroke-width="3"/>`;
    s += `<rect x="342" y="480" width="436" height="22" fill="${Y}" stroke="${K}" stroke-width="3"/><path d="M360 480 l22 22 M420 480 l22 22 M480 480 l22 22 M540 480 l22 22 M600 480 l22 22 M660 480 l22 22 M720 480 l22 22" stroke="${K}" stroke-width="8"/>`;
    s += `<path d="M560 160 L640 300 H480 Z" fill="${Y}" stroke="${K}" stroke-width="7" stroke-linejoin="round"/><path d="M560 210 v45 M560 278 v3" stroke="${K}" stroke-width="10" stroke-linecap="round"/>`;
    s += `<path d="M150 300 q60 -50 120 0 q-60 50 -120 0 z" fill="#fff" stroke="${K}" stroke-width="6"/><circle cx="210" cy="300" r="18" fill="${K}"/>`;
    s += tick(900, 300, 52);
    return s;
  },
  // 3 · At height: strong scaffolding, harness tied to a strong point
  3: () => {
    let s = ground(660);
    for (const x of [300, 760]) s += `<rect x="${x - 8}" y="120" width="16" height="540" fill="${STEEL}" stroke="${K}" stroke-width="3"/>`;
    for (const y of [180, 400, 640]) s += `<rect x="292" y="${y - 8}" width="484" height="16" fill="${STEEL}" stroke="${K}" stroke-width="3"/>`;
    s += `<path d="M300 400 L760 640 M760 400 L300 640" stroke="${STEEL}" stroke-width="8"/>`;
    s += `<rect x="292" y="392" width="484" height="26" fill="${WOOD}" stroke="${K}" stroke-width="4"/>`;
    s += worker(520, 392, { s: 0.95 });
    s += `<path d="M520 250 C 560 200, 620 190, 660 180" fill="none" stroke="${Y}" stroke-width="9"/><path d="M520 250 C 560 200, 620 190, 660 180" fill="none" stroke="${K}" stroke-width="2"/><circle cx="660" cy="180" r="12" fill="none" stroke="${K}" stroke-width="6"/>`;
    s += tick(900, 300, 52);
    return s;
  },
  // 4 · Never touch loose wires or electric boards
  4: () => {
    let s = ground(640);
    s += `<rect x="150" y="140" width="260" height="320" rx="14" fill="#C9CDD3" stroke="${K}" stroke-width="7"/><path d="M280 200 l-40 70 h50 l-40 70" fill="none" stroke="${Y}" stroke-width="16" stroke-linejoin="round"/><path d="M280 200 l-40 70 h50 l-40 70" fill="none" stroke="${K}" stroke-width="4" stroke-linejoin="round"/>`;
    s += `<path d="M410 380 C 500 380, 520 470, 560 520" fill="none" stroke="${K}" stroke-width="10"/><path d="M560 520 l20 -30 l10 34 l26 -16 l-6 34" fill="none" stroke="${Y}" stroke-width="8" stroke-linejoin="round"/>`;
    // open hand reaching toward the wire
    s += `<g transform="translate(700 470) rotate(-80)"><rect x="-40" y="0" width="80" height="80" rx="26" fill="${SKIN}" stroke="${K}" stroke-width="5"/>` +
      [-30, -10, 10, 30].map((fx, i) => `<rect x="${fx - 9}" y="${-62 + Math.abs(i - 1.5) * 10}" width="18" height="${74 - Math.abs(i - 1.5) * 10}" rx="9" fill="${SKIN}" stroke="${K}" stroke-width="5"/>`).join('') +
      `<rect x="34" y="20" width="44" height="18" rx="9" fill="${SKIN}" stroke="${K}" stroke-width="5" transform="rotate(-30 34 29)"/><rect x="-30" y="76" width="60" height="120" fill="${SKIN}" stroke="${K}" stroke-width="5"/></g>`;
    s += cross(780, 300, 64);
    return s;
  },
  // 5 · Lift with bent knees and a straight back
  5: () => {
    let s = ground(620);
    const st = `stroke="${K}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
    // good: squat, straight back
    s += `<g transform="translate(280 0)"><path d="M-10 470 L40 540 L0 620 M-10 470 L-40 540 L-60 620" ${st}/><path d="M-10 470 L-6 360" stroke="${ORANGE}" stroke-width="44" stroke-linecap="round"/><path d="M-6 380 L50 470" ${st}/>
      <circle cx="-4" cy="320" r="26" fill="${SKIN}" stroke="${K}" stroke-width="5"/><path d="M-34 316 a30 30 0 0 1 60 0 z" fill="${Y}" stroke="${K}" stroke-width="5"/>
      <rect x="30" y="460" width="110" height="90" rx="6" fill="#B08A5A" stroke="${K}" stroke-width="6"/></g>` + tick(300, 160, 50);
    // bad: bent back, straight legs
    s += `<g transform="translate(760 0)"><path d="M-20 470 L-20 620 M-20 470 L10 620" ${st}/><path d="M-20 470 Q 30 400 90 420" stroke="${ORANGE}" stroke-width="44" stroke-linecap="round" fill="none"/><path d="M80 430 L100 520" ${st}/>
      <circle cx="122" cy="420" r="26" fill="${SKIN}" stroke="${K}" stroke-width="5"/><rect x="60" y="520" width="110" height="90" rx="6" fill="#B08A5A" stroke="${K}" stroke-width="6"/></g>` + cross(820, 160, 50);
    s += `<line x1="540" y1="120" x2="540" y2="600" stroke="${GROUND}" stroke-width="6" stroke-dasharray="16 14"/>`;
    return s;
  },
  // 6 · Keep walkways clear: remove nails, steel pieces and waste
  6: () => {
    let s = ground(560);
    s += `<path d="M60 720 L220 560 H480 L420 720 Z" fill="#EDE8DE" stroke="${K}" stroke-width="4"/>`;
    s += `<path d="M220 650 l40 -20 M300 690 l60 -10 M240 600 l30 20" stroke="${STEEL}" stroke-width="10" stroke-linecap="round"/><rect x="330" y="600" width="40" height="22" fill="${BRICK}" stroke="${K}" stroke-width="3" transform="rotate(20 350 611)"/>`;
    s += `<path d="M180 690 l8 -24 l8 24" fill="none" stroke="${K}" stroke-width="5"/>` + cross(280, 300, 56);
    s += `<path d="M600 720 L760 560 H1020 L960 720 Z" fill="#EDE8DE" stroke="${K}" stroke-width="4"/>`;
    s += `<path d="M900 330 L860 520" stroke="${WOOD}" stroke-width="12" stroke-linecap="round"/><path d="M820 520 h80 l20 50 h-120 z" fill="${Y}" stroke="${K}" stroke-width="5"/>` + tick(800, 300, 56);
    s += `<line x1="540" y1="140" x2="540" y2="700" stroke="${GROUND}" stroke-width="6" stroke-dasharray="16 14"/>`;
    return s;
  },
  // 7 · Tell the supervisor at once; know where the first-aid box is
  7: () => {
    let s = ground(640) + worker(300, 630, { s: 1.1 }) + worker(620, 630, { s: 1.1, hc: '#FFFFFF' });
    s += `<path d="M330 250 h170 a20 20 0 0 1 20 20 v70 a20 20 0 0 1 -20 20 h-120 l-30 30 v-30 h-20 a20 20 0 0 1 -20 -20 v-70 a20 20 0 0 1 20 -20 z" fill="#fff" stroke="${K}" stroke-width="5"/><path d="M415 275 v45 M415 340 v3" stroke="${R}" stroke-width="14" stroke-linecap="round"/>`;
    s += `<rect x="790" y="330" width="210" height="160" rx="16" fill="${G}" stroke="${K}" stroke-width="6"/><rect x="865" y="300" width="60" height="34" rx="8" fill="none" stroke="${K}" stroke-width="6"/><path d="M895 360 v100 M845 410 h100" stroke="#fff" stroke-width="28"/>`;
    return s;
  },
};

const LESSONS = { 'SS-MAS-01': scenes, 'SS-CON-01': conScenes, 'SS-SAF-01': safScenes };
let count = 0;
for (const [id, set] of Object.entries(LESSONS)) for (const [n, fn] of Object.entries(set)) { fs.writeFileSync(path.join(OUT, `${id}_s${n}.svg`), svg(n, fn())); count++; }
console.log('Wrote', count, 'SVGs to design/illustrations/');
