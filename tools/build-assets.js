// SITE SAATHI - asset builder (Day 1)
// Makes the logo PNGs and the starter App Inventor project (SITE_SAATHI.aia)
// using only Node's built-in modules (no installs, Rs 0).
// Run from the project folder:   node tools/build-assets.js
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..');
const BRAND = path.join(ROOT, 'brand');
const AI_DIR = path.join(ROOT, 'app-inventor');

// Hi-Vis colours (CLAUDE.md section 6)
const YELLOW = [0xff, 0xc2, 0x1a];
const CHARCOAL = [0x1b, 0x1f, 0x24];

// ---------- simple shape tests in the logo's 64x64 grid (same as site-saathi-logo.svg) ----------
function inRoundRect(x, y, x0, y0, w, h, r) {
  if (x < x0 || x > x0 + w || y < y0 || y > y0 + h) return false;
  const cx = Math.min(Math.max(x, x0 + r), x0 + w - r);
  const cy = Math.min(Math.max(y, y0 + r), y0 + h - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}
function inTriangle(px, py, a, b, c) {
  const s = (p, q, r) => (p[0] - r[0]) * (q[1] - r[1]) - (q[0] - r[0]) * (p[1] - r[1]);
  const P = [px, py];
  const d1 = s(P, a, b), d2 = s(P, b, c), d3 = s(P, c, a);
  const neg = d1 < 0 || d2 < 0 || d3 < 0, pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos);
}
// Returns the colour of the logo at (x, y) in 64-grid units, or null if transparent.
function logoColour(x, y, bubble, hat) {
  let c = null;
  if (inRoundRect(x, y, 4, 4, 56, 48, 10) || inTriangle(x, y, [26, 51.9], [16, 61], [16, 51.9])) c = bubble;
  if (c) {
    if (y <= 36 && (x - 32) ** 2 + (y - 36) ** 2 <= 225) c = hat;          // helmet dome
    if (inRoundRect(x, y, 30, 18.5, 4, 13, 2)) c = bubble;                   // helmet ridge
    if (inRoundRect(x, y, 13, 36, 38, 5, 2.5)) c = hat;                       // helmet brim
  }
  return c;
}

// ---------- PNG writer ----------
function crcChunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(td) >>> 0);
  return Buffer.concat([len, td, crc]);
}
function encodePNG(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    crcChunk('IHDR', ihdr),
    crcChunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    crcChunk('IEND', Buffer.alloc(0)),
  ]);
}

// Render with 4x4 supersampling for smooth edges.
// sampler(u, v) gets coordinates in a 0..64 grid and returns [r,g,b] or null.
function render(size, sampler) {
  const out = Buffer.alloc(size * size * 4);
  const SS = 4;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
        const u = ((px + (sx + 0.5) / SS) / size) * 64;
        const v = ((py + (sy + 0.5) / SS) / size) * 64;
        const c = sampler(u, v);
        if (c) { r += c[0]; g += c[1]; b += c[2]; a++; }
      }
      const i = (py * size + px) * 4;
      if (a) { out[i] = r / a; out[i + 1] = g / a; out[i + 2] = b / a; out[i + 3] = (255 * a) / (SS * SS); }
    }
  }
  return encodePNG(size, size, out);
}

// Variants (PRD 14.1 logo panel)
const plainLogo = (bubble, hat) => (u, v) => logoColour(u, v, bubble, hat);
// App icon: charcoal rounded square with the yellow bubble at ~72% size
const appIcon = (u, v) => {
  if (!inRoundRect(u, v, 0, 0, 64, 64, 14)) return null;
  const s = 0.72, off = (64 - 64 * s) / 2;
  return logoColour((u - off) / s, (v - off) / s + 1.5, YELLOW, CHARCOAL) || CHARCOAL;
};

fs.mkdirSync(BRAND, { recursive: true });
const pngs = {
  'logo_yellow_512.png': render(512, plainLogo(YELLOW, CHARCOAL)),   // on dark / light backgrounds
  'logo_charcoal_512.png': render(512, plainLogo(CHARCOAL, YELLOW)), // on yellow backgrounds
  'app_icon_512.png': render(512, appIcon),
  'app_icon_192.png': render(192, appIcon),
};
for (const [name, buf] of Object.entries(pngs)) fs.writeFileSync(path.join(BRAND, name), buf);
console.log('Brand PNGs written to brand/');

// ---------- Starter App Inventor project: "Hello SITE SAATHI" (Day 1 Companion test) ----------
const PKG = 'appinventor.ai_sitesaathi.SITE_SAATHI';
const SRC = 'src/appinventor/ai_sitesaathi/SITE_SAATHI/';
// Escape non-ASCII so the .scm JSON stays pure ASCII.
const asciiJSON = (o) => JSON.stringify(o).replace(/[\u007f-￿]/g, (ch) => '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0'));

// Hard Devanagari joins (conjuncts, reph, nukta, chandra) to spot broken letters on the phone
const DEVA_SAMPLE = 'मराठी: क्षमता, ज्ञान, श्रमिक, सळई, ओळंबा, ॲप, आत्मविश्वासाने, र्‍हास · हिंदी: सुरक्षा, क्योरिंग, प्रशिक्षण, गिट्टी, ज़्यादा, ड्रॉइंग';
const C = { y: '&HFFFFC21A', k: '&HFF1B1F24', g: '&HFF15A34A', bg: '&HFFFBFAF7' };
let uuid = 1000;
const comp = (type, name, version, props) => ({ $Name: name, $Type: type, $Version: version, Uuid: String(uuid++), ...props });

const screen = {
  authURL: ['ai2.appinventor.mit.edu'],
  YaVersion: '208',
  Source: 'Form',
  Properties: {
    $Name: 'Screen1', $Type: 'Form', $Version: '27', Uuid: '0',
    AppName: 'SITE_SAATHI', Title: 'SITE SAATHI', TitleVisible: 'False',
    Icon: 'app_icon_512.png', Sizing: 'Responsive', Scrollable: 'True',
    AlignHorizontal: '3', AlignVertical: '2', BackgroundColor: C.bg,
    PrimaryColor: C.k, PrimaryColorDark: '&HFF000000', AccentColor: C.y,
    VersionCode: '1', VersionName: '0.1',
    $Components: [
      comp('VerticalArrangement', 'ArrMain', '3', {
        AlignHorizontal: '3', Width: '-2',
        $Components: [
          comp('Image', 'ImgLogo', '3', { Picture: 'logo_yellow_512.png', Width: '140', Height: '140', ScalePictureToFit: 'True' }),
          comp('Label', 'LblAppName', '4', { Text: 'SITE SAATHI', FontSize: '30', FontBold: 'True', TextAlignment: '1', TextColor: C.k }),
          comp('Label', 'LblTagEn', '4', { Text: 'Learn at the Site. Build with Confidence.', FontSize: '16', TextAlignment: '1', TextColor: C.k, Width: '-1090' }),
          comp('Label', 'LblTagMr', '4', { Text: 'साइटवर शिका. आत्मविश्वासाने बांधा.', FontSize: '16', TextAlignment: '1', TextColor: C.k, Width: '-1090' }),
          comp('Label', 'LblHello', '4', { Text: 'Hello SITE SAATHI', FontSize: '22', FontBold: 'True', TextAlignment: '1', TextColor: C.g }),
          comp('Button', 'BtnTest', '6', { Text: 'Test connection', FontSize: '20', FontBold: 'True', BackgroundColor: C.y, TextColor: C.k, Shape: '1', Width: '-1090', Height: '56' }),
          // Day 3 early risk check: built-in QR scanner (QR-1)
          comp('Label', 'LblQrHead', '4', { Text: 'Day 3 · QR scanner check', FontSize: '18', FontBold: 'True', TextColor: C.k, Width: '-1090' }),
          comp('Button', 'BtnScanTest', '6', { Text: 'Test QR scanner', FontSize: '20', FontBold: 'True', BackgroundColor: C.k, TextColor: '&HFFFFFFFF', Shape: '1', Width: '-1090', Height: '56' }),
          comp('Label', 'LblScanResult', '4', { Text: 'Scan any QR code. The text it reads appears here.', FontSize: '16', TextColor: C.k, Width: '-1090' }),
          // Day 4 Devanagari font check: bundled Noto Sans Devanagari vs phone default
          comp('Label', 'LblFontHead', '4', { Text: 'Day 4 · Devanagari font check', FontSize: '18', FontBold: 'True', TextColor: C.k, Width: '-1090' }),
          comp('Label', 'LblFontDefault', '4', { Text: 'Phone font: ' + DEVA_SAMPLE, FontSize: '18', TextColor: C.k, Width: '-1090' }),
          comp('Label', 'LblFontNoto', '4', { Text: 'Noto: ' + DEVA_SAMPLE, FontSize: '18', FontTypeface: 'font_deva.ttf', TextColor: C.k, Width: '-1090' }),
          comp('Label', 'LblFontNotoBold', '4', { Text: 'Noto bold: शिकणे सुरू करा · QR स्कॅन करा · माझी कौशल्ये', FontSize: '20', FontTypeface: 'font_deva_bold.ttf', TextColor: C.k, Width: '-1090' }),
          // Day 8: read strings.csv from the app's assets and show it (Marathi/Hindi from CSV, LNG-3)
          comp('Label', 'LblCsvHead', '4', { Text: 'Day 8 · CSV text check', FontSize: '18', FontBold: 'True', TextColor: C.k, Width: '-1090' }),
          comp('Button', 'BtnCsvTest', '6', { Text: 'Read strings.csv', FontSize: '20', FontBold: 'True', BackgroundColor: C.y, TextColor: C.k, Shape: '1', Width: '-1090', Height: '56' }),
          comp('Label', 'LblCsv', '4', { Text: 'The first rows of strings.csv appear here.', FontSize: '15', FontTypeface: 'font_deva.ttf', TextColor: C.k, Width: '-1090' }),
        ],
      }),
      comp('Notifier', 'Notifier1', '5', {}),
      comp('File', 'File1', '2', {}),
      comp('BarcodeScanner', 'BarcodeScanner1', '2', { UseExternalScanner: 'False' }),
    ],
  },
};
const scm = '#|\n$JSON\n' + asciiJSON(screen) + '\n|#';

// Blocks: when BtnTest.Click -> Notifier1.ShowAlert("AI2 Companion connected ...")
const bky = `<xml xmlns="http://www.w3.org/1999/xhtml">
  <block type="component_event" id="ss_evt_1" x="20" y="20">
    <mutation component_type="Button" is_generic="false" instance_name="BtnTest" event_name="Click"></mutation>
    <field name="COMPONENT_SELECTOR">BtnTest</field>
    <statement name="DO">
      <block type="component_method" id="ss_m_1">
        <mutation component_type="Notifier" method_name="ShowAlert" is_generic="false" instance_name="Notifier1"></mutation>
        <field name="COMPONENT_SELECTOR">Notifier1</field>
        <value name="ARG0">
          <block type="text" id="ss_t_1"><field name="TEXT">AI2 Companion connected. Day 1 test passed.</field></block>
        </value>
      </block>
    </statement>
  </block>
  <block type="component_event" id="ss_evt_2" x="20" y="160">
    <mutation component_type="Button" is_generic="false" instance_name="BtnScanTest" event_name="Click"></mutation>
    <field name="COMPONENT_SELECTOR">BtnScanTest</field>
    <statement name="DO">
      <block type="component_method" id="ss_m_2">
        <mutation component_type="BarcodeScanner" method_name="DoScan" is_generic="false" instance_name="BarcodeScanner1"></mutation>
        <field name="COMPONENT_SELECTOR">BarcodeScanner1</field>
      </block>
    </statement>
  </block>
  <block type="component_event" id="ss_evt_3" x="20" y="260">
    <mutation component_type="BarcodeScanner" is_generic="false" instance_name="BarcodeScanner1" event_name="AfterScan"></mutation>
    <field name="COMPONENT_SELECTOR">BarcodeScanner1</field>
    <statement name="DO">
      <block type="component_set_get" id="ss_s_1">
        <mutation component_type="Label" set_or_get="set" property_name="Text" is_generic="false" instance_name="LblScanResult"></mutation>
        <field name="COMPONENT_SELECTOR">LblScanResult</field>
        <field name="PROP">Text</field>
        <value name="VALUE">
          <block type="text_join" id="ss_j_1">
            <mutation items="2"></mutation>
            <value name="ADD0"><block type="text" id="ss_t_2"><field name="TEXT">Read: </field></block></value>
            <value name="ADD1">
              <block type="text_changeCase" id="ss_c_1">
                <field name="OP">UPCASE</field>
                <value name="TEXT">
                  <block type="text_trim" id="ss_tr_1">
                    <value name="TEXT">
                      <block type="lexical_variable_get" id="ss_v_1">
                        <mutation><eventparam name="result"></eventparam></mutation>
                        <field name="VAR">result</field>
                      </block>
                    </value>
                  </block>
                </value>
              </block>
            </value>
          </block>
        </value>
      </block>
    </statement>
  </block>
  <block type="component_event" id="ss_evt_4" x="20" y="520">
    <mutation component_type="Button" is_generic="false" instance_name="BtnCsvTest" event_name="Click"></mutation>
    <field name="COMPONENT_SELECTOR">BtnCsvTest</field>
    <statement name="DO">
      <block type="component_method" id="ss_m_4">
        <mutation component_type="File" method_name="ReadFrom" is_generic="false" instance_name="File1"></mutation>
        <field name="COMPONENT_SELECTOR">File1</field>
        <value name="ARG0"><block type="text" id="ss_t_4"><field name="TEXT">//strings.csv</field></block></value>
      </block>
    </statement>
  </block>
  <block type="component_event" id="ss_evt_5" x="20" y="640">
    <mutation component_type="File" is_generic="false" instance_name="File1" event_name="GotText"></mutation>
    <field name="COMPONENT_SELECTOR">File1</field>
    <statement name="DO">
      <block type="component_set_get" id="ss_s_5">
        <mutation component_type="Label" set_or_get="set" property_name="Text" is_generic="false" instance_name="LblCsv"></mutation>
        <field name="COMPONENT_SELECTOR">LblCsv</field>
        <field name="PROP">Text</field>
        <value name="VALUE">
          <block type="lexical_variable_get" id="ss_v_5">
            <mutation><eventparam name="text"></eventparam></mutation>
            <field name="VAR">text</field>
          </block>
        </value>
      </block>
    </statement>
  </block>
  <yacodeblocks ya-version="208" language-version="33"></yacodeblocks>
</xml>`;

const props = [
  '#',
  `main=${PKG}.Screen1`,
  'name=SITE_SAATHI',
  'assets=../assets',
  'source=../src',
  'build=../build',
  'versioncode=1',
  'versionname=0.1',
  'useslocation=False',
  'aname=SITE_SAATHI',
  'sizing=Responsive',
  'theme=AppTheme.Light.DarkActionBar',
  'color.primary=&HFF1B1F24',
  'color.primary.dark=&HFF000000',
  'color.accent=&HFFFFC21A',
  '',
].join('\n');

// ---------- minimal ZIP writer (forward slashes, deflate) ----------
function zip(entries) {
  const locals = [], centrals = [];
  let offset = 0;
  for (const [name, data] of entries) {
    const nameBuf = Buffer.from(name, 'utf8');
    const comp = zlib.deflateRawSync(data);
    const crc = zlib.crc32(data) >>> 0;
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x0800, 6);
    lh.writeUInt16LE(8, 8); lh.writeUInt16LE(0, 10); lh.writeUInt16LE(0x21, 12);
    lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(comp.length, 18); lh.writeUInt32LE(data.length, 22);
    lh.writeUInt16LE(nameBuf.length, 26); lh.writeUInt16LE(0, 28);
    locals.push(lh, nameBuf, comp);
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0x0800, 8);
    ch.writeUInt16LE(8, 10); ch.writeUInt16LE(0, 12); ch.writeUInt16LE(0x21, 14);
    ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(comp.length, 20); ch.writeUInt32LE(data.length, 24);
    ch.writeUInt16LE(nameBuf.length, 28); ch.writeUInt32LE(offset, 42);
    centrals.push(ch, nameBuf);
    offset += 30 + nameBuf.length + comp.length;
  }
  const cd = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, end]);
}

fs.mkdirSync(AI_DIR, { recursive: true });
const aia = zip([
  ['youngandroidproject/project.properties', Buffer.from(props, 'utf8')],
  [SRC + 'Screen1.scm', Buffer.from(scm, 'utf8')],
  [SRC + 'Screen1.bky', Buffer.from(bky, 'utf8')],
  ['assets/logo_yellow_512.png', pngs['logo_yellow_512.png']],
  ['assets/app_icon_512.png', pngs['app_icon_512.png']],
  // Noto Sans Devanagari (SIL OFL 1.1) — downloaded into brand/fonts on Day 4
  ...['font_deva.ttf', 'font_deva_bold.ttf']
    .filter((f) => fs.existsSync(path.join(BRAND, 'fonts', f)))
    .map((f) => ['assets/' + f, fs.readFileSync(path.join(BRAND, 'fonts', f))]),
  // Day 8 CSV display test: the real strings table, UTF-8 without BOM
  ...(fs.existsSync(path.join(ROOT, 'content', 'sheet', 'strings.csv'))
    ? [['assets/strings.csv', fs.readFileSync(path.join(ROOT, 'content', 'sheet', 'strings.csv'))]] : []),
]);
fs.writeFileSync(path.join(AI_DIR, 'SITE_SAATHI_tests.aia'), aia);
console.log('Test project written to app-inventor/SITE_SAATHI_tests.aia (' + aia.length + ' bytes)');
