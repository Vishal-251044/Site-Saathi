// SITE SAATHI - builds the real App Inventor project app-inventor/SITE_SAATHI.aia (Days 9-10)
//  9 Screens (PRD 12): Screen1 (splash + language), Home, Learn, Quiz, Scan, Skills, Ask, Safety, Settings.
//  Day 9 : Screen1, Home, Settings working; all labels from strings.csv (LNG-3); TinyDB lang / text_size.
//  Day 10: Learn = module grid -> lesson list -> lesson (intro, steps, safety + mistakes), openLesson(id),
//          last lesson + step saved for the Continue card. Quiz, Scan, Skills: placeholders (Days 11-12);
//          Ask, Safety: placeholders for v1.1 (not linked from Home).
// Run: node tools/build-app.js      Re-run after any CSV or media change (media is bundled from /media).
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const ROOT = path.resolve(__dirname, '..');
// Two variants (user decision 18 Nov 2026): the v1.0 release candidate, and the Admin build (Days 15+) in a separate file.
//   node tools/build-app.js          -> app-inventor/SITE_SAATHI.aia        (worker app, 9 Screens incl. Scan)
//   node tools/build-app.js --admin  -> app-inventor/SITE_SAATHI_admin.aia  (Scan inside Learn; 9th Screen = Admin)
const ADMIN = process.argv.includes('--admin');
const MVP_VERSION = ['1.0-rc5', '14'];        // rc5 = UI v2 + motion (20 Nov). Becomes '1.0' (code 15) only when Release_v1.0_Checklist gates pass
const ADMIN_VERSION = ['1.1-rc5', '25'];      // rc5 = UI v2 + admin redesign + motion (20 Nov). Becomes '1.1' (code 26) only when Release_v1.1_Checklist gates pass
const [VERSION_NAME, VERSION_CODE] = ADMIN ? ADMIN_VERSION : MVP_VERSION;
// Web app address of the Apps Script backend (not a secret). Put it in backend/api_url.txt after deploying.
const API_URL = (() => { try { return fs.readFileSync(path.join(ROOT, 'backend', 'api_url.txt'), 'utf8').trim(); } catch (e) { return ''; } })();
const REVIEWER = '—';   // LES-5: set to 'Name, qualification' ONLY after the expert signs the review sheets
const PKG_DIR = 'src/appinventor/ai_sitesaathi/SITE_SAATHI/';
const NS = 'SITE_SAATHI';
const C = { y: '&HFFFFC21A', k: '&HFF1B1F24', w: '&HFFFFFFFF', bg: '&HFFF4F2ED', card: '&HFFFFFFFF', line: '&HFFE4DFD5', red: '&HFFDC2626', redL: '&HFFFDECEC', yelL: '&HFFFFF8E1', mut: '&HFF5B6068', grn: '&HFF15A34A' };
const FONT = 'font_deva.ttf', FONTB = 'font_deva_bold.ttf';

// =====================================================================================
// Blocks DSL (Blockly XML used by App Inventor)
// =====================================================================================
const X = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
let bid = 0; const nid = () => 'ss' + (++bid);
const V = (name, b) => (b ? `<value name="${name}">${b}</value>` : '');
const S = (name, b) => (b ? `<statement name="${name}">${b}</statement>` : '');
const blk = (type, inner = '', mut = '') => `<block type="${type}" id="${nid()}">${mut}${inner}</block>`;
// chain statements with <next>. A chain may itself be a chain: always attach to its LAST block,
// i.e. inside the trailing "</next></block>" wrappers, never to its first block.
const WRAP = '</next></block>';
const append = (a, b) => { let k = 0; while (a.endsWith(WRAP.repeat(k + 1))) k++; const core = a.slice(0, a.length - WRAP.length * k); return core.slice(0, -8) + `<next>${b}</next></block>` + WRAP.repeat(k); };
const seq = (...ss) => ss.flat(Infinity).filter(Boolean).reduce((acc, s) => (acc ? append(acc, s) : s), '');

const txt = (s) => blk('text', `<field name="TEXT">${X(s)}</field>`);
const num = (n) => blk('math_number', `<field name="NUM">${n}</field>`);
const bool = (b) => blk('logic_boolean', `<field name="BOOL">${b ? 'TRUE' : 'FALSE'}</field>`);
const lit = (v) => (typeof v === 'string' && v.startsWith('<block') ? v : typeof v === 'number' ? num(v) : typeof v === 'boolean' ? bool(v) : txt(v));
const gget = (n) => blk('lexical_variable_get', `<field name="VAR">global ${n}</field>`);
const lget = (n) => blk('lexical_variable_get', `<field name="VAR">${n}</field>`);
const eget = (n) => blk('lexical_variable_get', `<field name="VAR">${n}</field>`, `<mutation><eventparam name="${n}"></eventparam></mutation>`);
const gset = (n, v) => blk('lexical_variable_set', `<field name="VAR">global ${n}</field>${V('VALUE', lit(v))}`);
const lset = (n, v) => blk('lexical_variable_set', `<field name="VAR">${n}</field>${V('VALUE', lit(v))}`);
const glob = (n, v) => blk('global_declaration', `<field name="NAME">${n}</field>${V('VALUE', lit(v))}`);

const setp = (type, comp, prop, v) => blk('component_set_get', `<field name="COMPONENT_SELECTOR">${comp}</field><field name="PROP">${prop}</field>${V('VALUE', lit(v))}`,
  `<mutation component_type="${type}" set_or_get="set" property_name="${prop}" is_generic="false" instance_name="${comp}"></mutation>`);
const getp = (type, comp, prop) => blk('component_set_get', `<field name="COMPONENT_SELECTOR">${comp}</field><field name="PROP">${prop}</field>`,
  `<mutation component_type="${type}" set_or_get="get" property_name="${prop}" is_generic="false" instance_name="${comp}"></mutation>`);
const meth = (type, comp, method, ...args) => blk('component_method', `<field name="COMPONENT_SELECTOR">${comp}</field>${args.map((a, i) => V('ARG' + i, lit(a))).join('')}`,
  `<mutation component_type="${type}" method_name="${method}" is_generic="false" instance_name="${comp}"></mutation>`);
let ey = 20;
const ev = (type, comp, event, body) => { const y = ey; ey += 160; return `<block type="component_event" id="${nid()}" x="20" y="${y}"><mutation component_type="${type}" is_generic="false" instance_name="${comp}" event_name="${event}"></mutation><field name="COMPONENT_SELECTOR">${comp}</field>${S('DO', body)}</block>`; };
const top = (b) => { const y = ey; ey += 120; return b.replace('<block ', `<block x="420" y="${y}" `); };

const iff = (c, then, els) => blk('controls_if', `${V('IF0', c)}${S('DO0', then)}${els ? S('ELSE', els) : ''}`, els ? '<mutation else="1"></mutation>' : '');
const ifs = (pairs, els) => blk('controls_if', pairs.map(([c, b], i) => V('IF' + i, c) + S('DO' + i, b)).join('') + (els ? S('ELSE', els) : ''),
  `<mutation${pairs.length > 1 ? ` elseif="${pairs.length - 1}"` : ''}${els ? ' else="1"' : ''}></mutation>`);
const choose = (c, a, b) => blk('controls_choose', `${V('TEST', c)}${V('THENRETURN', lit(a))}${V('ELSERETURN', lit(b))}`);
const eq = (a, b) => blk('logic_compare', `<field name="OP">EQ</field>${V('A', lit(a))}${V('B', lit(b))}`);
const mcmp = (op, a, b) => blk('math_compare', `<field name="OP">${op}</field>${V('A', lit(a))}${V('B', lit(b))}`);
const and = (a, b) => blk('logic_operation', `<field name="OP">AND</field>${V('A', a)}${V('B', b)}`, '<mutation items="2"></mutation>');
const or = (a, b) => blk('logic_operation', `<field name="OP">OR</field>${V('A', a)}${V('B', b)}`, '<mutation items="2"></mutation>');
const not = (a) => blk('logic_negate', V('BOOL', a));
const add = (a, b) => blk('math_add', V('NUM0', lit(a)) + V('NUM1', lit(b)), '<mutation items="2"></mutation>');
const sub = (a, b) => blk('math_subtract', V('A', lit(a)) + V('B', lit(b)));
const mul = (a, b) => blk('math_multiply', V('NUM0', lit(a)) + V('NUM1', lit(b)), '<mutation items="2"></mutation>');
const div = (a, b) => blk('math_division', V('A', lit(a)) + V('B', lit(b)));
const round = (a) => blk('math_round', `<field name="OP">ROUND</field>${V('NUM', lit(a))}`);
const posIn = (item, l) => blk('lists_position_in', V('ITEM', lit(item)) + V('LIST', l));
// Day 17-18 (admin build) helpers
const isIn = (item, l) => blk('lists_is_in', V('ITEM', lit(item)) + V('LIST', l));
const apiUrl = () => choose(isEmpty(dbGet('adm_url', '')), API_URL, dbGet('adm_url', ''));
const closeWith = (v) => blk('controls_closeScreenWithValue', V('SCREEN', lit(v)));
const join = (...p) => blk('text_join', p.map((x, i) => V('ADD' + i, lit(x))).join(''), `<mutation items="${p.length}"></mutation>`);
const isEmpty = (t) => blk('text_isEmpty', V('VALUE', lit(t)));
const trim = (t) => blk('text_trim', V('TEXT', lit(t)));
const upcase = (t) => blk('text_changeCase', `<field name="OP">UPCASE</field>${V('TEXT', lit(t))}`);
const downcase = (t) => blk('text_changeCase', `<field name="OP">DOWNCASE</field>${V('TEXT', lit(t))}`);
const replaceAll = (t, a, b) => blk('text_replace_all', V('TEXT', lit(t)) + V('SEGMENT', lit(a)) + V('REPLACEMENT', lit(b)));
const split = (t, at) => blk('text_split', `<field name="OP">SPLIT</field>${V('TEXT', lit(t))}${V('AT', lit(at))}`, '<mutation mode="SPLIT"></mutation>');
const list = (...items) => blk('lists_create_with', items.map((x, i) => V('ADD' + i, lit(x))).join(''), `<mutation items="${items.length}"></mutation>`);
const sel = (l, i) => blk('lists_select_item', V('LIST', l) + V('NUM', lit(i)));
const len = (l) => blk('lists_length', V('LIST', l));
const listEmpty = (l) => blk('lists_is_empty', V('LIST', l));
const addItem = (l, item) => blk('lists_add_items', V('LIST', l) + V('ITEM0', lit(item)), '<mutation items="1"></mutation>');
const csvTable = (t) => blk('lists_from_csv_table', V('TEXT', t));
const forEach = (v, l, body) => blk('controls_forEach', `<field name="VAR">${v}</field>${V('LIST', l)}${S('DO', body)}`);
const localS = (n, init, body) => blk('local_declaration_statement', `<field name="VAR0">${n}</field>${V('DECL0', lit(init))}${S('STACK', body)}`, `<mutation><localname name="${n}"></localname></mutation>`);
const localE = (n, init, ret) => blk('local_declaration_expression', `<field name="VAR0">${n}</field>${V('DECL0', lit(init))}${V('RETURN', ret)}`, `<mutation><localname name="${n}"></localname></mutation>`);
const doReturn = (body, val) => blk('controls_do_then_return', S('STM', body) + V('VALUE', val));
const argsMut = (args) => args.map((a) => `<arg name="${a}"></arg>`).join('');
const defP = (name, args, body) => top(blk('procedures_defnoreturn', `<field name="NAME">${name}</field>${args.map((a, i) => `<field name="VAR${i}">${a}</field>`).join('')}${S('STACK', body)}`, `<mutation>${argsMut(args)}</mutation>`));
const defF = (name, args, ret) => top(blk('procedures_defreturn', `<field name="NAME">${name}</field>${args.map((a, i) => `<field name="VAR${i}">${a}</field>`).join('')}${V('RETURN', ret)}`, `<mutation>${argsMut(args)}</mutation>`));
const PARAMS = {};   // proc name -> arg names (for call mutations)
const callP = (name, ...a) => blk('procedures_callnoreturn', `<field name="PROCNAME">${name}</field>${a.map((x, i) => V('ARG' + i, lit(x))).join('')}`, `<mutation name="${name}">${argsMut(PARAMS[name] || [])}</mutation>`);
const callF = (name, ...a) => blk('procedures_callreturn', `<field name="PROCNAME">${name}</field>${a.map((x, i) => V('ARG' + i, lit(x))).join('')}`, `<mutation name="${name}">${argsMut(PARAMS[name] || [])}</mutation>`);
Object.assign(PARAMS, { t: ['key'], tCol: ['key', 'col'], rowFor: ['id'], countMod: ['code'], openLesson: ['id'], showLessons: ['code'], pickModule: ['code'], lessonLine: ['id'], setLang: ['code'], setTs: ['size'], fmtStep: ['n', 'total'],
  pick: ['letter'], markBtn: ['letter', 'img'], workerLine: ['w', 'html'], classify: ['image'], showHelmet: ['result'], media: ['name'], say: ['text'], askQ: ['q'], showAnswer: ['text'], checkNew: ['code'], optText: ['q', 'letter'], process: ['code'], showMsg: ['msg', 'code'], doneIn: ['code'], badgeIn: ['code'], statusOf: ['id'] });
const openScreen = (n) => blk('controls_openAnotherScreen', V('SCREEN', txt(n)));
const openWith = (n, v) => blk('controls_openAnotherScreenWithStartValue', V('SCREENNAME', txt(n)) + V('STARTVALUE', lit(v)));
const startValue = () => blk('controls_getStartValue');
const closeScreen = () => blk('controls_closeScreen');
const closeApp = () => blk('controls_closeApplication');
const db = (method, ...a) => meth('TinyDB', 'TinyDB1', method, ...a);
const dbGet = (tag, dflt) => db('GetValue', tag, dflt);
const alert = (m) => meth('Notifier', 'Notifier1', 'ShowAlert', m);
const t = (key) => callF('t', key);
const vis = (type, comp, on) => setp(type, comp, 'Visible', typeof on === 'string' && on.startsWith('<block') ? on : !!on);   // block -> as is

// =====================================================================================
// Designer DSL (.scm)
// =====================================================================================
let uuid = 100;
function screen(name, title, opts = {}) {
  const st = { name, comps: [], texts: [], blocks: [], props: { $Name: name, $Type: 'Form', $Version: '27', Uuid: '0', Title: title, TitleVisible: 'False', BackgroundColor: C.bg, AlignHorizontal: '3', Scrollable: 'True', OpenScreenAnimation: 'slidehorizontal', CloseScreenAnimation: 'slidehorizontal', ...opts } };
  return st;
}
const node = (type, name, version, props = {}, kids) => ({ $Name: name, $Type: type, $Version: version, Uuid: String(uuid++), ...props, ...(kids ? { $Components: kids } : {}) });
// text components register (key, base font size) so applyLabels sets Text from strings.csv and FontSize x text scale
function L(st, name, key, size = 16, p = {}) { st.texts.push({ type: 'Label', name, key, size }); return node('Label', name, '4', { Text: key ? `[${key}]` : '', FontSize: String(size), FontTypeface: p.bold ? FONTB : FONT, ...(p.bold ? { FontBold: 'True' } : {}), TextColor: C.k, Width: '-2', HasMargins: 'True', ...p.props }); }   // FontBold: Latin text falls back to the system font, which needs it to look bold
function B(st, name, key, size = 18, props = {}) { st.texts.push({ type: 'Button', name, key, size }); return node('Button', name, '6', { Text: key ? `[${key}]` : '', FontSize: String(size), FontTypeface: FONTB, FontBold: 'True', TextColor: C.k, ...props }); }
const VA = (name, props, kids) => node('VerticalArrangement', name, '3', props, kids);
const HA = (name, props, kids) => node('HorizontalArrangement', name, '3', props, kids);
const IMG = (name, pic, w, h, props = {}) => node('Image', name, '3', { Picture: pic, Width: String(w), Height: String(h), ScalePictureToFit: 'True', ...props });
// UI v2: padded box. The outer VA keeps the name/type the blocks use; text sits 4% in from each side.
const padRow = (name, kids, inner = '-1084') => HA(name + 'P', { Width: '-2' }, [SP(name + 'PL', '-1004'), VA(name + 'PI', { Width: inner }, kids), SP(name + 'PR', '-1004')]);
// fitRows: App Inventor % widths are % of the SCREEN. A row whose children add up to more than its own width
// overflows the page (the old "no padding" look). Scale such rows down to fit, keeping proportions.
function fitRows(comps, avail = 100) {
  for (const c of comps) {
    const own = parseInt(c.Width || '-1', 10); const mine = own <= -1000 ? -own - 1000 : avail;
    const kids = c.$Components || [];
    if (c.$Type === 'HorizontalArrangement') {
      const pk = kids.filter((k) => parseInt(k.Width || '-1', 10) <= -1000);
      const sum = pk.reduce((t, k) => t + (-parseInt(k.Width, 10) - 1000), 0);
      if (sum > mine) pk.forEach((k) => { k.Width = String(-1000 - Math.max(1, Math.floor((-parseInt(k.Width, 10) - 1000) * mine / sum))); });
    }
    fitRows(kids, mine);
  }
}
// Button backgrounds come in full / half / third width so their round corners never stretch
const variantName = (img, width) => {
  const m = /^bg_btn_(yellow|outline|danger|charcoal|ai)\.png$/.exec(img || ''); const w = parseInt(width || '-2', 10);
  if (!m || w > -1000) return img;
  const pct = -w - 1000; return pct <= 34 ? `bg_btn_${m[1]}_t.png` : pct <= 64 ? `bg_btn_${m[1]}_h.png` : img;
};
function applyVariants(comps) { for (const c of comps) { if (c.Image && /Button|Picker/.test(c.$Type)) c.Image = variantName(c.Image, c.Width); applyVariants(c.$Components || []); } }
// Press animation: finger down -> "_p" picture (face sinks onto its edge, a little darker); finger up -> normal.
// Works with pictures that change at run time because it edits whatever picture the button has now.
const PRESSABLE = /^(bg_btn_|tile_|bg_opt|bg_scan_big|bg_card_continue)/;
function pressBlocks(st) {
  const out = []; const typeOf = { Button: 'Button', ListPicker: 'ListPicker', ImagePicker: 'ImagePicker' };
  (function walk(cs) { for (const c of cs) {
    const ty = typeOf[c.$Type];
    if (ty && PRESSABLE.test(c.Image || '')) {
      const img = getp(ty, c.$Name, 'Image');
      out.push(ev(ty, c.$Name, 'TouchDown', setp(ty, c.$Name, 'Image', replaceAll(replaceAll(img, '_p.png', '.png'), '.png', '_p.png'))));
      out.push(ev(ty, c.$Name, 'TouchUp', setp(ty, c.$Name, 'Image', replaceAll(img, '_p.png', '.png'))));
    }
    walk(c.$Components || []);
  } })(st.comps);
  return out;
}
const findComp = (comps, name) => { for (const c of comps) { if (c.$Name === name) return c; const r = findComp(c.$Components || [], name); if (r) return r; } return null; };
// vimg: the picture a block should set on a button (same variant rule as the designer)
const vimg = (st, name, img) => { fitRows(st.comps); const c = findComp(st.comps, name); return variantName(img, c && c.Width); };
const SP = (name, w = '8', h = '8') => node('Label', name, '4', { Text: '', Width: String(w), Height: String(h), HasMargins: 'False' });
const nonVisible = () => [node('TinyDB', 'TinyDB1', '2', { Namespace: NS }), node('File', 'FileStr', '2', {}), node('File', 'FileLes', '2', {}), node('Notifier', 'Notifier1', '5', {})];
// Title bar used by every inner screen: back button + title + subtitle
const bar = (st, titleKey) => HA('ArrBar', { BackgroundColor: C.k, Width: '-2', Height: '64', AlignVertical: '2' }, [
  node('Button', 'BtnBack', '6', { Image: 'ic_back_w.png', Text: '', Width: '48', Height: '48' }),
  SP('SpBar', 6, 8),
  VA('ArrBarText', { Width: '-2', BackgroundColor: C.k }, [
    L(st, 'LblBarTitle', titleKey, 20, { bold: true, props: { TextColor: C.w } }),
    L(st, 'LblBarSub', null, 13, { props: { TextColor: '&HFF7BE0A0', Text: '' } }),
  ]),
]);

// =====================================================================================
// Shared blocks for every screen: globals, t(key), applyLabels, strings/lessons loading
// =====================================================================================
function common(st, { lessons = false, afterStrings = [], afterLessons = [] } = {}) {
  const b = st.blocks;
  b.push(top(glob('STR', list())), top(glob('LES', list())), top(glob('LANG', 'mr')), top(glob('TS', 1)));
  // t(key): text for the chosen language (mr col 2, hi col 3, en col 4); key itself if missing
  b.push(defF('tCol', ['key', 'col'], localE('r', lget('key'), doReturn(
    forEach('row', gget('STR'), iff(and(mcmp('GTE', len(lget('row')), lget('col')), eq(sel(lget('row'), 1), lget('key'))), lset('r', sel(lget('row'), lget('col'))))),
    lget('r')))));
  if (ADMIN) b.push(defP('mergeStrings', [], iff(not(isEmpty(dbGet('pub_strings_csv', ''))), forEach('row', csvTable(dbGet('pub_strings_csv', '')), addItem(gget('STR'), lget('row'))))));   // published labels win: t() keeps the last match
  b.push(defF('t', ['key'], callF('tCol', lget('key'), choose(eq(gget('LANG'), 'mr'), 2, choose(eq(gget('LANG'), 'hi'), 3, 4)))));
  // applyLabels: every registered Label/Button gets Text (if it has a key) and FontSize x TS (Large text = 1.2)
  // built at the END (writer loop): components added later (admin-build extras) must get their text too
  b.push('__APPLY_LABELS__');
  st.applyLabels = () => defP('applyLabels', [], seq(st.texts.map((x) => [x.key ? setp(x.type, x.name, 'Text', t(x.key)) : null, setp(x.type, x.name, 'FontSize', mul(x.size, gget('TS')))])));
  b.push(defP('loadSettings', [], seq(
    gset('LANG', dbGet('lang', st.name === 'Screen1' ? '' : 'mr')),
    gset('TS', choose(eq(dbGet('text_size', 'normal'), 'large'), 1.2, 1)),
    meth('File', 'FileStr', 'ReadFrom', '//strings.csv'))));
  b.push(ev('File', 'FileStr', 'GotText', seq(gset('STR', csvTable(eget('text'))), ADMIN ? callP('mergeStrings') : null, callP('applyLabels'), afterStrings, lessons ? meth('File', 'FileLes', 'ReadFrom', '//lessons.csv') : null)));
  if (lessons) {
    b.push(ev('File', 'FileLes', 'GotText', seq(gset('LES', csvTable(eget('text'))), ADMIN ? callP('mergeLessons') : null, afterLessons)));
    if (ADMIN) {
      // UPD-5: lessons from the last complete update replace built-in rows with the same ID; built-in lessons are never deleted (UPD-4)
      b.push(defP('mergeLessons', [], iff(not(isEmpty(dbGet('pub_lessons_csv', ''))), localS('P', csvTable(dbGet('pub_lessons_csv', '')), localS('ids', list(), localS('keep', list(), seq(
        forEach('row', lget('P'), addItem(lget('ids'), sel(lget('row'), 1))),
        forEach('row', gget('LES'), iff(not(isIn(sel(lget('row'), 1), lget('ids'))), addItem(lget('keep'), lget('row')))),
        forEach('row', lget('P'), iff(neq(sel(lget('row'), 1), 'id'), addItem(lget('keep'), lget('row')))),
        gset('LES', lget('keep')))))))));
      // media(name): downloaded file path if this picture/audio came with an update, else the built-in file name
      b.push(defF('media', ['name'], lk(dbGet('dl_map', list()), lget('name'), lget('name'))));
    }
    // rowFor(id): lesson row in the chosen language, else English, else empty list
    const find = (lang) => forEach('row', gget('LES'), iff(and(mcmp('GTE', len(lget('row')), 13), and(eq(sel(lget('row'), 1), lget('id')), eq(sel(lget('row'), 3), lang))), lset('r', lget('row'))));
    b.push(defF('rowFor', ['id'], localE('r', list(), doReturn(seq(find(gget('LANG')), iff(listEmpty(lget('r')), find('en'))), lget('r')))));
    b.push(defF('fmtStep', ['n', 'total'], replaceAll(replaceAll(t('step_of'), '{n}', lget('n')), '{total}', lget('total'))));
  }
}
const backBlocks = (st, body) => { st.blocks.push(ev('Button', 'BtnBack', 'Click', body), ev('Form', st.name, 'BackPressed', body)); };

// =====================================================================================
// Screen1 · splash + language (SPL-1, LNG-1, LNG-2)
// =====================================================================================
function screen1() {
  const st = screen('Screen1', 'SITE SAATHI', {
    AppName: 'SITE_SAATHI', Icon: 'app_icon_512.png', Sizing: 'Responsive', VersionCode: VERSION_CODE, VersionName: VERSION_NAME,
    PrimaryColor: C.k, PrimaryColorDark: '&HFF000000', AccentColor: C.y, BackgroundColor: C.k, Scrollable: 'False', AlignVertical: '2',
    Theme: 'AppTheme.Light.DarkActionBar', OpenScreenAnimation: 'fade', CloseScreenAnimation: 'fade',
    ...(ADMIN ? { DefaultFileScope: 'App' } : {}),   // UPD-3: downloaded lessons go into the app's own storage
  });
  const langBtn = (name, label) => node('Button', name, '6', { Text: label, FontSize: '26', FontTypeface: FONTB, FontBold: 'True', TextColor: C.k, Image: 'bg_btn_outline.png', Width: '-1090', Height: '76' });
  st.comps = [
    VA('ArrSplash', { Width: '-2', Height: '-2', AlignHorizontal: '3', AlignVertical: '2', BackgroundColor: C.k }, [
      IMG('ImgSplash', 'logo_yellow_512.png', 60, 60), SP('SpSpl', 8, 12),
      L(st, 'LblWordmark', 'app_name', 36, { bold: true, props: { TextColor: C.w, Width: '-1', TextAlignment: '1' } }),
      L(st, 'LblSplashTag', 'tagline', 16, { props: { TextColor: C.w, TextAlignment: '1', Width: '-1080' } }),
      SP('SpLoad', 8, 28),
      HA('ArrLoad', { Width: '-1040', Height: '6', BackgroundColor: '&HFF3A3F46' }, [node('Label', 'LblLoad', '4', { Text: '', Width: '-1001', Height: '6', BackgroundColor: C.y, HasMargins: 'False' })]),
      SP('SpLoad2', 8, 14),
      L(st, 'LblSplashVer', null, 12, { props: { TextColor: '&HFF9AA0A6', TextAlignment: '1', Text: 'v' + VERSION_NAME } }),
    ]),
    VA('ArrLanguage', { Width: '-2', Height: '-2', AlignHorizontal: '3', AlignVertical: '2', BackgroundColor: C.bg, Visible: 'False' }, [
      IMG('ImgLangLogo', 'logo_yellow_512.png', 64, 64),
      L(st, 'LblLangTitle', null, 18, { bold: true, props: { TextAlignment: '1', Width: '-1090' } }),
      SP('SpL1', 8, 12), langBtn('BtnMr', 'मराठी'), SP('SpL2', 8, 10), langBtn('BtnHi', 'हिंदी'), SP('SpL3', 8, 10), langBtn('BtnEn', 'English'), SP('SpL4', 8, 24),
      B(st, 'BtnLangNext', 'btn_next', 20, { Image: 'bg_btn_yellow.png', Width: '-1090', Height: '56', Enabled: 'False' }),
    ]),
    node('Clock', 'Clock1', '3', { TimerInterval: '2000', TimerAlwaysFires: 'False' }),
    node('Clock', 'ClockAnim', '3', { TimerInterval: '30', TimerAlwaysFires: 'False' }),
    node('TextToSpeech', 'TextToSpeech1', '5', { Country: 'IND' }),
    ...nonVisible(),
  ];
  common(st, { afterStrings: [setp('Label', 'LblLangTitle', 'Text', join(callF('tCol', 'lang_title', 2), '\n', callF('tCol', 'lang_title', 3), '\n', callF('tCol', 'lang_title', 4)))] });
  const b = st.blocks;
  b.push(ev('Form', 'Screen1', 'Initialize', callP('loadSettings')));
  // UI v2 splash animation: 20 frames x 30 ms. Logo grows 60 -> 120 dp with an ease-out curve, loading bar fills.
  b.push(top(glob('ANI', 0)));
  b.push(ev('Clock', 'ClockAnim', 'Timer', seq(gset('ANI', add(gget('ANI'), 1)),
    localS('k', sub(1, div(gget('ANI'), 20)), localS('e', sub(1, mul(lget('k'), mul(lget('k'), lget('k')))), seq(
      setp('Image', 'ImgSplash', 'Width', round(add(60, mul(60, lget('e'))))), setp('Image', 'ImgSplash', 'Height', round(add(60, mul(60, lget('e'))))),
      setp('Label', 'LblLoad', 'WidthPercent', round(mul(40, div(gget('ANI'), 20))))))),
    iff(mcmp('GTE', gget('ANI'), 20), setp('Clock', 'ClockAnim', 'TimerEnabled', false)))));
  b.push(ev('Clock', 'Clock1', 'Timer', seq(setp('Clock', 'Clock1', 'TimerEnabled', false),
    iff(isEmpty(gget('LANG')), seq(vis('VerticalArrangement', 'ArrSplash', false), vis('VerticalArrangement', 'ArrLanguage', true)), openScreen('Home')))));
  const img = (code) => choose(eq(gget('LANG'), code), 'bg_btn_yellow.png', 'bg_btn_outline.png');
  b.push(defP('setLang', ['code'], seq(
    gset('LANG', lget('code')), db('StoreValue', 'lang', lget('code')),
    setp('Button', 'BtnMr', 'Image', img('mr')), setp('Button', 'BtnHi', 'Image', img('hi')), setp('Button', 'BtnEn', 'Image', img('en')),
    setp('Button', 'BtnLangNext', 'Enabled', true), callP('applyLabels'),
    setp('TextToSpeech', 'TextToSpeech1', 'Language', lget('code')), meth('TextToSpeech', 'TextToSpeech1', 'Speak', t('lang_prompt')))));
  for (const [btn, code] of [['BtnMr', 'mr'], ['BtnHi', 'hi'], ['BtnEn', 'en']]) b.push(ev('Button', btn, 'Click', callP('setLang', code)));
  b.push(ev('Button', 'BtnLangNext', 'Click', openScreen('Home')));
  b.push(ev('Form', 'Screen1', 'OtherScreenClosed', closeApp()));   // Back from Home leaves the app
  return st;
}

// =====================================================================================
// Home (HOM-1, HOM-3, HOM-4)
// =====================================================================================
function home() {
  const st = screen('Home', 'SITE SAATHI');
  const tile = (name, key, img, color = C.k) => B(st, name, key, 19, { Image: img, Width: '-1044', Height: '160', TextColor: color });
  st.comps = [
    VA('ArrPage', { Width: '-1092', AlignHorizontal: '3' }, [
      SP('SpTop', 8, 16),
      HA('ArrHeader', { Width: '-2', AlignVertical: '2' }, [
        IMG('ImgHomeLogo', 'logo_yellow_512.png', 56, 56), SP('SpH', 12, 8),
        VA('ArrHeadText', { Width: '-2' }, [L(st, 'LblHomeName', 'app_name', 26, { bold: true }), L(st, 'LblHomeTag', 'tagline', 14, { props: { TextColor: C.mut } })]),
      ]),
      SP('SpH2', 8, 16),
      HA('ArrRow1', { Width: '-2', AlignHorizontal: '3' }, [tile('BtnStart', 'btn_start', 'tile_home_start.png'), SP('SpR1', '-1004'), tile('BtnScan', 'btn_scan', 'tile_home_scan.png', C.w)]),
      SP('SpRows', 8, 12),
      HA('ArrRow2', { Width: '-2', AlignHorizontal: '3' }, [tile('BtnSkills', 'btn_skills', 'tile_home_skills.png'), SP('SpR2', '-1004'), tile('BtnSettings', 'btn_settings', 'tile_home_settings.png')]),
      SP('SpH3', 8, 12),
      ...(ADMIN ? [B(st, 'BtnAsk', null, 18, { Image: 'bg_btn_ai.png', TextColor: C.w, Width: '-2', Height: '72' }), SP('SpAsk', 8, 10),
        B(st, 'BtnSafety', null, 16, { Image: 'bg_btn_ai.png', TextColor: C.w, Width: '-2', Height: '60' }), SP('SpSaf', 8, 10),
        B(st, 'BtnRevise', null, 15, { Image: 'bg_btn_yellow.png', Width: '-2', Height: '64', Visible: 'False' }), SP('SpRev', 8, 10),
        B(st, 'BtnUpd', 'upd_available', 15, { Image: 'bg_btn_yellow.png', Width: '-2', Height: '56', Visible: 'False' }), SP('SpUpd', 8, 10)] : []),
      B(st, 'BtnContinue', null, 15, { Image: 'bg_card_continue.png', Width: '-2', Height: '76', Visible: 'False' }), SP('SpEndH', 8, 16),
    ]),
    ...nonVisible(),
  ];
  st.comps.push(node('Clock', 'ClockIntro', '3', { TimerEnabled: 'False', TimerInterval: '30' }));
  if (ADMIN) st.comps.push(node('Web', 'Web1', '4', {}), node('Clock', 'Clock1', '3', { TimerEnabled: 'False' }));
  common(st, { lessons: true, afterLessons: [callP('updateContinue'), ADMIN ? callP('homeAdmin') : null, ADMIN ? callP('homeAdmin19') : null] });
  if (ADMIN) { homeAdmin(st, st.blocks); homeAdmin19(st, st.blocks); }
  const b = st.blocks;
  b.push(defP('updateContinue', [], localS('id', dbGet('last_lesson', ''), ifs([[isEmpty(lget('id')), vis('Button', 'BtnContinue', false)]],
    localS('r', callF('rowFor', lget('id')), iff(listEmpty(lget('r')), vis('Button', 'BtnContinue', false), seq(
      vis('Button', 'BtnContinue', true),
      // two short lines, clear of the yellow bar and the arrow: "Continue · Step 3 of 7" / lesson title
      setp('Button', 'BtnContinue', 'Text', join(t('continue_card'), ' · ',
        choose(mcmp('GT', dbGet('last_step', 0), 0), callF('fmtStep', dbGet('last_step', 0), len(split(sel(lget('r'), 8), '|'))), sel(lget('r'), 1)), '\n', sel(lget('r'), 4))))))))));
  b.push(ev('Form', 'Home', 'Initialize', seq(callP('loadSettings'),
    ['BtnStart', 'BtnScan', 'BtnSkills', 'BtnSettings'].map((x) => setp('Button', x, 'Height', 120)), gset('INTRO', 0), setp('Clock', 'ClockIntro', 'TimerEnabled', true))));
  b.push(top(glob('INTRO', 0)));
  const popH = (i) => localS('p', choose(mcmp('LT', sub(gget('INTRO'), mul(2, i)), 0), 0, choose(mcmp('GT', div(sub(gget('INTRO'), mul(2, i)), 8), 1), 1, div(sub(gget('INTRO'), mul(2, i)), 8))),
    localS('k', sub(1, lget('p')), setp('Button', ['BtnStart', 'BtnScan', 'BtnSkills', 'BtnSettings'][i], 'Height', round(add(120, mul(40, sub(1, mul(lget('k'), mul(lget('k'), lget('k'))))))))));
  b.push(ev('Clock', 'ClockIntro', 'Timer', seq(gset('INTRO', add(gget('INTRO'), 1)), [0, 1, 2, 3].map(popH),
    iff(mcmp('GTE', gget('INTRO'), 16), setp('Clock', 'ClockIntro', 'TimerEnabled', false)))));
  b.push(ev('Form', 'Home', 'OtherScreenClosed', callP('loadSettings')));   // language / text size may have changed
  b.push(ev('Button', 'BtnStart', 'Click', openScreen('Learn')));
  b.push(ev('Button', 'BtnScan', 'Click', ADMIN ? openWith('Learn', '#scan') : openScreen('Scan')));
  b.push(ev('Button', 'BtnSkills', 'Click', openScreen('Skills')));
  b.push(ev('Button', 'BtnSettings', 'Click', openScreen('Settings')));
  b.push(ev('Button', 'BtnContinue', 'Click', openWith('Learn', join(dbGet('last_lesson', ''), '#', dbGet('last_step', 0)))));
  return st;
}

// =====================================================================================
// Learn (MOD-1, MOD-2, LES-1..4) · module grid -> lesson list -> lesson, as show / hide arrangements
// =====================================================================================
const MODS = ['MAS', 'CON', 'SAF', 'REI', 'CUR', 'QUA'];
function learn() {
  const st = screen('Learn', 'Learn');
  const modBtn = (code) => B(st, 'BtnMod' + code, null, 16, { Image: `tile_mod_${code.toLowerCase()}.png`, Width: '-1044', Height: '160' });
  const rows = [[0, 1], [2, 3], [4, 5]].map(([a, c], i) => HA('ArrModRow' + i, { Width: '-2', AlignHorizontal: '3' }, [modBtn(MODS[a]), SP('SpM' + i, '-1004'), modBtn(MODS[c])]));
  st.comps = [
    bar(st, 'title_modules'),
    VA('ArrBody', { Width: '-1092', AlignHorizontal: '3' }, [
      SP('SpB0', 8, 10),
      VA('ArrModules', { Width: '-2' }, [rows[0], SP('SpMr1', 8, 12), rows[1], SP('SpMr2', 8, 12), rows[2], SP('SpMr3', 8, 16)]),
      VA('ArrLessons', { Width: '-2', Visible: 'False' }, [
        node('ListView', 'LvLessons', '6', { Width: '-2', Height: '-2', BackgroundColor: C.w, TextColor: C.k, TextSize: '20', ShowFilterBar: 'False' }),
        SP('SpLv', 8, 10), L(st, 'LblMore', 'coming_soon', 13, { props: { TextColor: C.mut, TextAlignment: '1' } }),
      ]),
      VA('ArrLesson', { Width: '-2', Visible: 'False' }, [
        IMG('ImgStep', '', '-2', 220),
        // Audio bar (AUD-1): play / pause, label, restart. One recorded file per lesson per language.
        HA('ArrAudio', { BackgroundColor: C.k, Width: '-2', Height: '64', AlignVertical: '2' }, [
          SP('SpAu0', 6, 8), node('Button', 'BtnPlay', '6', { Image: 'btn_play.png', Text: '', Width: '52', Height: '52' }), SP('SpAu1', 10, 8),
          L(st, 'LblAudio', 'btn_listen', 15, { bold: true, props: { TextColor: C.w } }),
          node('Button', 'BtnRestart', '6', { Image: 'ic_restart_w.png', Text: '', Width: '48', Height: '48' }), SP('SpAu2', 6, 8),
        ]),
        VA('ArrIntro', { Width: '-2' }, [
          SP('SpIn0', 8, 10), L(st, 'LblDesc', null, 17),
          SP('SpIn1', 8, 10),
          VA('ArrObjective', { Width: '-2', BackgroundColor: C.card }, [SP('SpOb0', 8, 10), padRow('ArrObj', [L(st, 'LblObjHead', 'lbl_objective', 13, { bold: true, props: { TextColor: C.mut } }), L(st, 'LblObj', null, 16)]), SP('SpOb1', 8, 10)]),
          SP('SpIn2', 8, 10),
          VA('ArrMat', { Width: '-2', BackgroundColor: C.card }, [SP('SpMt0', 8, 10), padRow('ArrMt', [L(st, 'LblMatHead', 'lbl_materials', 13, { bold: true, props: { TextColor: C.mut } }), L(st, 'LblMat', null, 15)]), SP('SpMt1', 8, 10)]),
        ]),
        VA('ArrStepBody', { Width: '-2', Visible: 'False', BackgroundColor: C.card }, [SP('SpSb0', 8, 12), padRow('ArrSb', [L(st, 'LblCounter', null, 14, { bold: true, props: { TextColor: '&HFF8A6400' } }), L(st, 'LblStepText', null, 20, { bold: true })]), SP('SpSb1', 8, 14)]),
        VA('ArrFinal', { Width: '-2', Visible: 'False' }, [
          VA('ArrSafety', { Width: '-2', BackgroundColor: C.redL }, [padRow('ArrSfH', [L(st, 'LblSafetyHead', 'lbl_safety', 17, { bold: true, props: { TextColor: C.red } })], '-1084'), padRow('ArrSf', [L(st, 'LblSafety', null, 15)]), SP('SpSf1', 8, 12)]),
          SP('SpF1', 8, 10),
          VA('ArrMistakes', { Width: '-2', BackgroundColor: C.yelL }, [padRow('ArrMkH', [L(st, 'LblMistakeHead', 'lbl_mistakes', 17, { bold: true, props: { TextColor: '&HFF8A6400' } })], '-1084'), padRow('ArrMk', [L(st, 'LblMistakes', null, 15)]), SP('SpMk1', 8, 12)]),
          SP('SpF2', 8, 12),
          B(st, 'BtnStartQuiz', 'btn_start_quiz', 20, { Image: 'bg_btn_yellow.png', Width: '-2', Height: '56' }),
        ]),
        SP('SpNav', 8, 12),
        HA('ArrNav', { Width: '-2', AlignHorizontal: '3' }, [
          B(st, 'BtnPrev', 'btn_back', 18, { Image: 'bg_btn_outline.png', Width: '-1044', Height: '56' }), SP('SpNv', '-1004'),
          B(st, 'BtnNext', 'btn_next', 18, { Image: 'bg_btn_yellow.png', Width: '-1044', Height: '56' }),
        ]),
        SP('SpEnd', 8, 16),
      ]),
    ]),
    node('Player', 'Player1', '6', {}),
    ...nonVisible(),
  ];
  const b = st.blocks;
  b.push(top(glob('CUR', list())), top(glob('STEPS', list())), top(glob('IMGS', list())), top(glob('STEP', 0)), top(glob('VIEW', 'modules')),
    top(glob('MOD', '')), top(glob('IDS', list())), top(glob('FROMSV', false)), top(glob('PLAYING', false)), top(glob('AUDIO_SET', false)));
  // ---- audio (Day 11) ----
  b.push(defP('updateAudio', [], seq(setp('Button', 'BtnPlay', 'Image', choose(gget('PLAYING'), 'btn_pause.png', 'btn_play.png')),
    setp('Label', 'LblAudio', 'Text', t(choose(gget('PLAYING'), 'btn_pause', 'btn_listen'))))));
  b.push(defP('stopAudio', [], seq(iff(gget('AUDIO_SET'), meth('Player', 'Player1', 'Stop')), ADMIN ? meth('TextToSpeech', 'TextToSpeech1', 'Stop') : null, gset('PLAYING', false), callP('updateAudio'))));
  b.push(defP('ensureSource', [], iff(not(gget('AUDIO_SET')), seq(setp('Player', 'Player1', 'Source', ADMIN ? callF('media', sel(gget('CUR'), 12)) : sel(gget('CUR'), 12)), gset('AUDIO_SET', true)))));
  b.push(ev('Button', 'BtnPlay', 'Click', seq(callP('ensureSource'),
    iff(gget('PLAYING'), seq(meth('Player', 'Player1', 'Pause'), gset('PLAYING', false)), seq(meth('Player', 'Player1', 'Start'), gset('PLAYING', true))), callP('updateAudio'))));
  b.push(ev('Button', 'BtnRestart', 'Click', seq(callP('ensureSource'), meth('Player', 'Player1', 'Stop'), meth('Player', 'Player1', 'Start'), gset('PLAYING', true), callP('updateAudio'))));
  b.push(ev('Player', 'Player1', 'Completed', seq(gset('PLAYING', false), callP('updateAudio'))));
  // A missing or broken audio file must never crash the lesson: show a clear message instead
  const playerRef = blk('component_component_block', '<field name="COMPONENT_SELECTOR">Player1</field>', '<mutation component_type="Player" instance_name="Player1"></mutation>');
  const learnWeb = blk('component_component_block', '<field name="COMPONENT_SELECTOR">Web1</field>', '<mutation component_type="Web" instance_name="Web1"></mutation>');
  b.push(ev('Form', 'Learn', 'ErrorOccurred', iff(eq(eget('component'), playerRef),
    seq(gset('PLAYING', false), gset('AUDIO_SET', false), callP('updateAudio'), alert(t('audio_missing'))),
    ADMIN ? iff(not(eq(eget('component'), learnWeb)), alert(eget('message'))) : alert(eget('message')))));   // offline update check stays silent
  b.push(ev('Form', 'Learn', 'OtherScreenClosed', iff(eq(eget('result'), 'lessons'), callP('showLessons', gget('MOD')))));
  common(st, {
    lessons: true,
    afterStrings: [iff(eq(gget('VIEW'), 'lesson'), callP('showStep')), callP('updateAudio'), ADMIN ? iff(eq(gget('VIEW'), 'scan'), callP('showScan')) : null],
    afterLessons: [callP('showModules'), localS('sv', startValue(), ifs([
      ...(ADMIN ? [[eq(lget('sv'), '#scan'), seq(callP('showScan'), meth('BarcodeScanner', 'BarcodeScanner1', 'DoScan'))]] : []),
      [not(isEmpty(lget('sv'))), localS('parts', split(lget('sv'), '#'), seq(
        gset('FROMSV', true), callP('openLesson', sel(lget('parts'), 1)),
        iff(and(eq(gget('VIEW'), 'lesson'), mcmp('GT', len(lget('parts')), 1)), seq(gset('STEP', sel(lget('parts'), 2)), callP('showStep')))))],
    ]))],
  });
  const show = (m, ls, l, s = false) => [vis('VerticalArrangement', 'ArrModules', m), vis('VerticalArrangement', 'ArrLessons', ls), vis('VerticalArrangement', 'ArrLesson', l),
    ADMIN ? vis('VerticalArrangement', 'ArrScan', s) : null];
  if (ADMIN) {
    // ---- Scan inside Learn (admin build: frees the Scan Screen slot for Admin; same behaviour as the Scan Screen) ----
    st.comps.find((c) => c.$Name === 'ArrBody').$Components.push(
      VA('ArrScan', { Width: '-2', Visible: 'False' }, [
        B(st, 'BtnScanBig', null, 20, { Image: 'bg_scan_big.png', Width: '-2', Height: '120', TextColor: C.w }),
        L(st, 'LblScanHint', 'scan_hint', 14, { props: { TextAlignment: '1', TextColor: C.mut } }),
        VA('ArrMsg', { Width: '-2', BackgroundColor: C.redL, Visible: 'False' }, [SP('SpMg0', 8, 10), padRow('ArrMg', [L(st, 'LblMsg', null, 16, { bold: true, props: { TextColor: C.red } }), L(st, 'LblMsgCode', null, 13, { props: { TextColor: C.mut } })]), SP('SpMg1', 8, 10)]),
        SP('SpSc1', 8, 12), L(st, 'LblTypeHead', 'scan_type_code', 14, { bold: true, props: { TextColor: C.mut } }),
        HA('ArrType', { Width: '-2', AlignVertical: '2' }, [
          node('TextBox', 'TxtCode', '5', { Hint: 'SS-MAS-01', FontSize: '20', FontTypeface: FONTB, Width: '-1066', Height: '56', MultiLine: 'False' }), SP('SpT', '-1003'),
          B(st, 'BtnOpen', 'btn_open', 18, { BackgroundColor: C.y, Shape: '1', Width: '-1030', Height: '56' })]),
      ]));
    st.comps.push(node('BarcodeScanner', 'BarcodeScanner1', '2', { UseExternalScanner: 'False' }));
    b.push(defP('showScan', [], seq(gset('VIEW', 'scan'), gset('FROMSV', true), show(false, false, false, true), callP('stopAudio'),
      setp('Label', 'LblBarTitle', 'Text', t('btn_scan')), setp('Label', 'LblBarSub', 'Text', t('offline_badge')),
      setp('Button', 'BtnScanBig', 'Text', join('\n\n', t('btn_scan'))))));
    b.push(defP('showMsg', ['msg', 'code'], seq(vis('VerticalArrangement', 'ArrMsg', true), setp('Label', 'LblMsg', 'Text', lget('msg')), setp('Label', 'LblMsgCode', 'Text', lget('code')))));
    b.push(defP('process', ['code'], localS('c', upcase(trim(lget('code'))), iff(not(isEmpty(lget('c'))), ifs([
      [not(eq(sel(split(lget('c'), '-'), 1), 'SS')), callP('showMsg', t('qr_not_ss'), lget('c'))],
      [listEmpty(callF('rowFor', lget('c'))), seq(callP('showMsg', t('qr_not_found'), lget('c')), callP('checkNew', lget('c')))],
    ], seq(vis('VerticalArrangement', 'ArrMsg', false), setp('TextBox', 'TxtCode', 'Text', ''), callP('openLesson', lget('c'))))))));
    learnAdmin(st, b);
    b.push(ev('BarcodeScanner', 'BarcodeScanner1', 'AfterScan', callP('process', eget('result'))));
    b.push(ev('Button', 'BtnScanBig', 'Click', meth('BarcodeScanner', 'BarcodeScanner1', 'DoScan')));
    b.push(ev('Button', 'BtnOpen', 'Click', callP('process', getp('TextBox', 'TxtCode', 'Text'))));
  }
  // countMod(code): number of lessons in a module (counted on English rows)
  b.push(defF('countMod', ['code'], localE('n', 0, doReturn(forEach('row', gget('LES'), iff(and(mcmp('GTE', len(lget('row')), 3), and(eq(sel(lget('row'), 2), lget('code')), eq(sel(lget('row'), 3), 'en'))), lset('n', add(lget('n'), 1)))), lget('n')))));
  b.push(defP('showModules', [], seq(gset('VIEW', 'modules'), show(true, false, false),
    setp('Label', 'LblBarTitle', 'Text', t('title_modules')), setp('Label', 'LblBarSub', 'Text', t('offline_badge')),
    MODS.map((code) => localS('c', callF('countMod', code), seq(
      setp('Button', 'BtnMod' + code, 'Image', choose(mcmp('GT', lget('c'), 0), `tile_mod_${code.toLowerCase()}.png`, `tile_mod_${code.toLowerCase()}_soon.png`)),
      setp('Button', 'BtnMod' + code, 'Text', join('\n\n', t('mod_' + code.toLowerCase()), '\n', choose(mcmp('GT', lget('c'), 0), join(t('lbl_lessons'), ': ', lget('c')), t('coming_soon'))))))))));
  b.push(defP('pickModule', ['code'], iff(mcmp('GT', callF('countMod', lget('code')), 0), callP('showLessons', lget('code')), alert(t('coming_soon')))));
  for (const code of MODS) b.push(ev('Button', 'BtnMod' + code, 'Click', callP('pickModule', code)));
  // lessonLine(id): "Title \n SS-MAS-01 · 5 min · Audio · Completed"
  b.push(defF('lessonLine', ['id'], localE('r', callF('rowFor', lget('id')), join(sel(lget('r'), 4), '\n', lget('id'), ' · ', sel(lget('r'), 13), ' ', t('lbl_min'), ' · ', t('lbl_audio'),
    choose(not(isEmpty(dbGet(join('score_', lget('id')), ''))), join(' · ', t('skills_completed')), choose(not(isEmpty(dbGet(join('viewed_', lget('id')), ''))), join(' · ', t('skills_viewed')), ''))))));
  b.push(defP('showLessons', ['code'], localS('names', list(), seq(
    gset('MOD', lget('code')), gset('VIEW', 'lessons'), show(false, true, false), gset('IDS', list()),
    setp('Label', 'LblBarTitle', 'Text', t(join('mod_', downcase(lget('code'))))),
    setp('Label', 'LblBarSub', 'Text', join(t('lbl_lessons'), ': ', callF('countMod', lget('code')))),
    forEach('row', gget('LES'), iff(and(mcmp('GTE', len(lget('row')), 3), and(eq(sel(lget('row'), 2), lget('code')), eq(sel(lget('row'), 3), 'en'))),
      seq(addItem(gget('IDS'), sel(lget('row'), 1)), addItem(lget('names'), callF('lessonLine', sel(lget('row'), 1)))))),
    setp('ListView', 'LvLessons', 'Elements', lget('names'))))));
  b.push(ev('ListView', 'LvLessons', 'AfterPicking', callP('openLesson', sel(gget('IDS'), getp('ListView', 'LvLessons', 'SelectionIndex')))));
  // openLesson(id) (PRD 12.2): find the row; if found show the lesson at step 0, else a clear message
  b.push(defP('openLesson', ['id'], localS('r', callF('rowFor', upcase(trim(lget('id')))), iff(listEmpty(lget('r')), alert(t('qr_not_found')), seq(
    gset('CUR', lget('r')), gset('STEPS', split(sel(lget('r'), 8), '|')), gset('IMGS', split(sel(lget('r'), 11), '|')),
    callP('stopAudio'), gset('AUDIO_SET', false),
    gset('MOD', sel(lget('r'), 2)), gset('STEP', 0), gset('VIEW', 'lesson'), show(false, false, true),
    setp('Label', 'LblBarTitle', 'Text', sel(lget('r'), 4)), callP('showStep'), ADMIN ? callP('askWho') : null)))));
  if (ADMIN) learnAdmin19(st, b);
  // showStep: 0 = intro, 1..n = steps (LES-2), n+1 = safety + mistakes before the quiz (LES-3); marks viewed (LES-4)
  const n = len(gget('STEPS'));
  b.push(defP('showStep', [], seq(
    db('StoreValue', 'last_lesson', sel(gget('CUR'), 1)), db('StoreValue', 'last_step', gget('STEP')),
    vis('Image', 'ImgStep', true), vis('Button', 'BtnNext', true),
    vis('VerticalArrangement', 'ArrIntro', false), vis('VerticalArrangement', 'ArrStepBody', false), vis('VerticalArrangement', 'ArrFinal', false),
    ifs([
      [mcmp('EQ', gget('STEP'), 0), seq(vis('VerticalArrangement', 'ArrIntro', true),
        setp('Image', 'ImgStep', 'Picture', ADMIN ? callF('media', sel(gget('IMGS'), 1)) : sel(gget('IMGS'), 1)),
        setp('Label', 'LblBarSub', 'Text', join(sel(gget('CUR'), 1), ' · ', t('offline_badge'))),
        setp('Label', 'LblDesc', 'Text', sel(gget('CUR'), 5)), setp('Label', 'LblObj', 'Text', sel(gget('CUR'), 6)),
        setp('Label', 'LblMat', 'Text', replaceAll(sel(gget('CUR'), 7), '|', ' · ')))],
      [mcmp('LTE', gget('STEP'), n), seq(vis('VerticalArrangement', 'ArrStepBody', true),
        iff(mcmp('LTE', gget('STEP'), len(gget('IMGS'))), setp('Image', 'ImgStep', 'Picture', ADMIN ? callF('media', sel(gget('IMGS'), gget('STEP'))) : sel(gget('IMGS'), gget('STEP')))),
        setp('Label', 'LblCounter', 'Text', callF('fmtStep', gget('STEP'), n)), setp('Label', 'LblBarSub', 'Text', callF('fmtStep', gget('STEP'), n)),
        setp('Label', 'LblStepText', 'Text', sel(gget('STEPS'), gget('STEP'))))],
    ], seq(vis('Image', 'ImgStep', false), vis('VerticalArrangement', 'ArrFinal', true), vis('Button', 'BtnNext', false),
      setp('Label', 'LblBarSub', 'Text', t('lbl_safety')),
      setp('Label', 'LblSafety', 'Text', join('• ', replaceAll(sel(gget('CUR'), 9), '|', '\n• '))),
      setp('Label', 'LblMistakes', 'Text', join('• ', replaceAll(sel(gget('CUR'), 10), '|', '\n• '))),
      db('StoreValue', join('viewed_', sel(gget('CUR'), 1)), true))))));
  b.push(ev('Button', 'BtnNext', 'Click', iff(mcmp('LTE', gget('STEP'), n), seq(gset('STEP', add(gget('STEP'), 1)), callP('showStep')))));
  b.push(ev('Button', 'BtnPrev', 'Click', iff(mcmp('GT', gget('STEP'), 0), seq(gset('STEP', sub(gget('STEP'), 1)), callP('showStep')), callP('goBack'))));
  b.push(ev('Button', 'BtnStartQuiz', 'Click', seq(callP('stopAudio'), openWith('Quiz', sel(gget('CUR'), 1)))));
  b.push(defP('goBack', [], seq(callP('stopAudio'), ifs([
    [eq(gget('VIEW'), 'lesson'), iff(gget('FROMSV'), closeScreen(), callP('showLessons', gget('MOD')))],
    [eq(gget('VIEW'), 'lessons'), callP('showModules')],
  ], closeScreen()))));
  backBlocks(st, callP('goBack'));
  b.push(ev('Form', 'Learn', 'Initialize', callP('loadSettings')));
  return st;
}

// =====================================================================================
// Settings + About (SET-1, SET-2, SET-3, FR-23)
// =====================================================================================
function settings() {
  const st = screen('Settings', 'Settings');
  const seg = (name, key, label) => key ? B(st, name, key, 17, { Image: 'bg_btn_outline.png', Width: '-1031', Height: '52' })
    : node('Button', name, '6', { Text: label, FontSize: '17', FontTypeface: FONTB, TextColor: C.k, Image: 'bg_btn_outline.png', Width: '-1031', Height: '52' });
  st.comps = [
    bar(st, 'btn_settings'),
    VA('ArrMain', { Width: '-1092' }, [
      SP('SpS0', 8, 8), L(st, 'LblLangHead', 'set_language', 14, { bold: true, props: { TextColor: C.mut } }),
      HA('ArrLangRow', { Width: '-2', AlignHorizontal: '3' }, [seg('BtnLMr', null, 'मराठी'), SP('SpLa', '-1003'), seg('BtnLHi', null, 'हिंदी'), SP('SpLb', '-1003'), seg('BtnLEn', null, 'English')]),
      SP('SpS1', 8, 12), L(st, 'LblTsHead', 'set_text_size', 14, { bold: true, props: { TextColor: C.mut } }),
      HA('ArrTsRow', { Width: '-2', AlignHorizontal: '3' }, [
        B(st, 'BtnTsNormal', 'set_normal', 17, { Image: 'bg_btn_outline.png', Width: '-1048', Height: '52' }), SP('SpTs', '-1004'),
        B(st, 'BtnTsLarge', 'set_large', 20, { Image: 'bg_btn_outline.png', Width: '-1048', Height: '52' })]),
      SP('SpS2', 8, 12),
      B(st, 'BtnVoiceHelp', 'set_voice_help', 16, { Image: 'bg_btn_outline.png', Width: '-2', Height: '56' }),
      ...(ADMIN ? [SP('SpVs0', 8, 12), L(st, 'LblVsHead', 'set_voice_speed', 14, { bold: true, props: { TextColor: C.mut } }),
        HA('ArrVsRow', { Width: '-2', AlignHorizontal: '3' }, [B(st, 'BtnVsSlow', 'set_slow', 17, { Image: 'bg_btn_outline.png', Width: '-1048', Height: '52' }), SP('SpVs', '-1004'),
          B(st, 'BtnVsNormal', 'set_normal', 17, { Image: 'bg_btn_outline.png', Width: '-1048', Height: '52' })]),
        SP('SpUp0', 8, 12), B(st, 'BtnCheckUpd', 'upd_check', 18, { Image: 'bg_btn_yellow.png', Width: '-2', Height: '56' }),
        L(st, 'LblUpd', null, 14, { bold: true }), L(st, 'LblDl', null, 14, { props: { TextColor: C.mut } }),
        B(st, 'BtnClearDl', 'set_clear_dl', 16, { Image: 'bg_btn_outline.png', Width: '-2', Height: '52' }),
        SP('SpSup', 8, 12), B(st, 'BtnSupervisor', 'sup_title', 17, { Image: 'bg_btn_outline.png', Width: '-2', Height: '56' })] : []),
      SP('SpS3', 8, 8), L(st, 'LblStorage', null, 15),
      SP('SpS4', 8, 8), B(st, 'BtnAbout', 'btn_about', 18, { Image: 'bg_btn_outline.png', Width: '-2', Height: '56' }),
      SP('SpS5', 8, 18), B(st, 'BtnReset', 'set_reset', 18, { Image: 'bg_btn_danger.png', Width: '-2', Height: '56', TextColor: C.red }),
      SP('SpS6', 8, 16),
    ]),
    VA('ArrAbout', { Width: '-1092', Visible: 'False', AlignHorizontal: '3' }, [
      SP('SpA0', 8, 16), IMG('ImgAboutLogo', 'logo_yellow_512.png', 84, 84),
      L(st, 'LblAboutName', 'app_name', 28, { bold: true, props: { TextAlignment: '1' } }),
      L(st, 'LblAboutPurpose', 'about_purpose', 16, { props: { TextAlignment: '1' } }),
      ADMIN ? B(st, 'BtnVersion', null, 14, { BackgroundColor: '&H00FFFFFF', TextColor: C.mut, FontTypeface: FONT, Width: '-2', Height: '48' })   // ADM-1: tap 5x
        : L(st, 'LblAboutVersion', null, 14, { props: { TextAlignment: '1', TextColor: C.mut } }),
      SP('SpA1', 8, 10), L(st, 'LblAboutDev', null, 15), L(st, 'LblAboutReviewer', null, 15),
      SP('SpA2', 8, 10), L(st, 'LblDisclaimer', 'disclaimer', 15, { props: { BackgroundColor: C.redL } }),
    ]),
    ...(ADMIN ? [node('Web', 'Web1', '4', {}), node('Web', 'Web2', '4', {}), node('File', 'FileDel', '2', {})] : []),
    ...nonVisible(),
  ];
  const b = st.blocks;
  b.push(top(glob('INABOUT', false)));
  if (ADMIN) { settingsAdmin(st, b); b.push(ev('Button', 'BtnSupervisor', 'Click', openWith('Skills', '#sup'))); }
  if (ADMIN) {   // hidden Admin Mode entry: Settings -> About -> tap the version 5 times (PRD 10.13.1, ADM-1)
    b.push(top(glob('TAPS', 0)));
    b.push(ev('Button', 'BtnVersion', 'Click', seq(gset('TAPS', add(gget('TAPS'), 1)), iff(mcmp('GTE', gget('TAPS'), 5), seq(gset('TAPS', 0), openScreen('Admin'))))));
  }
  const mark = () => seq(
    [['BtnLMr', 'mr'], ['BtnLHi', 'hi'], ['BtnLEn', 'en']].map(([btn, c]) => setp('Button', btn, 'Image', choose(eq(gget('LANG'), c), vimg(st, btn, 'bg_btn_yellow.png'), vimg(st, btn, 'bg_btn_outline.png')))),
    setp('Button', 'BtnTsNormal', 'Image', choose(mcmp('EQ', gget('TS'), 1), vimg(st, 'BtnTsNormal', 'bg_btn_yellow.png'), vimg(st, 'BtnTsNormal', 'bg_btn_outline.png'))),
    setp('Button', 'BtnTsLarge', 'Image', choose(mcmp('EQ', gget('TS'), 1), vimg(st, 'BtnTsLarge', 'bg_btn_outline.png'), vimg(st, 'BtnTsLarge', 'bg_btn_yellow.png'))));
  common(st, {
    lessons: true,
    afterStrings: [callP('afterText')],
    afterLessons: [callP('showStorage')],
  });
  b.push(defP('afterText', [], seq(mark(),
    setp('Label', 'LblBarTitle', 'Text', choose(gget('INABOUT'), t('btn_about'), t('btn_settings'))),
    ADMIN ? setp('Button', 'BtnVersion', 'Text', join(t('lbl_version'), ' ', VERSION_NAME)) : setp('Label', 'LblAboutVersion', 'Text', join(t('lbl_version'), ' ', VERSION_NAME)),
    setp('Label', 'LblAboutDev', 'Text', join(t('lbl_developer'), ': Vaibhav C. Jadhav · RIT Sangli')),
    setp('Label', 'LblAboutReviewer', 'Text', join(t('lbl_reviewed_by'), ': ', REVIEWER)),   // LES-5
    ADMIN ? callP('afterText2') : null,
    callP('showStorage'))));
  b.push(defP('showStorage', [], localS('n', 0, seq(
    forEach('row', gget('LES'), iff(and(mcmp('GTE', len(lget('row')), 3), eq(sel(lget('row'), 3), 'en')), lset('n', add(lget('n'), 1)))),
    setp('Label', 'LblStorage', 'Text', join(t('set_storage'), ': ', lget('n')))))));
  b.push(defP('setLang', ['code'], seq(gset('LANG', lget('code')), db('StoreValue', 'lang', lget('code')), callP('applyLabels'), callP('afterText'))));
  b.push(defP('setTs', ['size'], seq(db('StoreValue', 'text_size', lget('size')), gset('TS', choose(eq(lget('size'), 'large'), 1.2, 1)), callP('applyLabels'), callP('afterText'))));
  for (const [btn, c] of [['BtnLMr', 'mr'], ['BtnLHi', 'hi'], ['BtnLEn', 'en']]) b.push(ev('Button', btn, 'Click', callP('setLang', c)));
  b.push(ev('Button', 'BtnTsNormal', 'Click', callP('setTs', 'normal')));
  b.push(ev('Button', 'BtnTsLarge', 'Click', callP('setTs', 'large')));
  b.push(ev('Button', 'BtnVoiceHelp', 'Click', alert(t('set_voice_help_text'))));
  b.push(ev('Button', 'BtnAbout', 'Click', seq(gset('INABOUT', true), vis('VerticalArrangement', 'ArrMain', false), vis('VerticalArrangement', 'ArrAbout', true), callP('afterText'))));
  b.push(ev('Button', 'BtnReset', 'Click', seq(ADMIN ? gset('CONFIRM', 'reset') : null, meth('Notifier', 'Notifier1', 'ShowChooseDialog', t('confirm_reset'), t('set_reset'), t('btn_yes'), t('btn_no'), false))));
  // Reset clears progress only (keeps language and text size)
  if (!ADMIN) b.push(ev('Notifier', 'Notifier1', 'AfterChoosing', iff(eq(eget('choice'), t('btn_yes')),
    forEach('tag', db('GetTags'), iff(not(or(eq(lget('tag'), 'lang'), eq(lget('tag'), 'text_size'))), db('ClearTag', lget('tag')))))));
  backBlocks(st, iff(gget('INABOUT'), seq(gset('INABOUT', false), vis('VerticalArrangement', 'ArrAbout', false), vis('VerticalArrangement', 'ArrMain', true), callP('afterText')), closeScreen()));
  b.push(ev('Form', 'Settings', 'Initialize', callP('loadSettings')));
  return st;
}

// =====================================================================================
// Quiz (QZ-1..QZ-4) · 5 questions, right / wrong + saved explanation, result, best score
// quiz.csv columns: 1 lesson_id, 2 lang, 3 q_no, 4 question, 5-8 options A-D, 9 correct, 10 explanation
// =====================================================================================
function quiz() {
  const st = screen('Quiz', 'Quiz');
  const opt = (x) => B(st, 'Btn' + x, null, 17, { Image: 'bg_opt.png', Width: '-2', Height: '64', TextAlignment: '1' });
  st.comps = [
    bar(st, 'btn_start_quiz'),
    VA('ArrQuestion', { Width: '-1092' }, [
      SP('SpQ0', 8, 10),
      HA('ArrProg', { Width: '-1092', Height: '8', BackgroundColor: '&HFFE2DED6' }, [node('Label', 'LblProgFill', '4', { Text: '', Width: '-1018', Height: '8', BackgroundColor: C.y, HasMargins: 'False' })]), SP('SpQp', 8, 8),
      L(st, 'LblQNum', null, 13, { bold: true, props: { TextColor: C.mut } }),
      L(st, 'LblQuestion', null, 20, { bold: true }),
      ...(ADMIN ? [speakBtn('BtnSayQ')] : []),
      SP('SpQ1', 8, 12), opt('A'), SP('SpQ2', 8, 10), opt('B'), SP('SpQ3', 8, 10), opt('C'), SP('SpQ4', 8, 10), opt('D'), SP('SpQ5', 8, 12),
      L(st, 'LblFbOk', 'quiz_correct', 16, { bold: true, props: { BackgroundColor: '&HFFE7F5EC', TextColor: '&HFF0F7A37', Visible: 'False' } }),
      L(st, 'LblFbNo', 'quiz_wrong', 16, { bold: true, props: { BackgroundColor: C.redL, TextColor: C.red, Visible: 'False' } }),
      L(st, 'LblExplain', null, 15, { props: { Visible: 'False' } }),
      ...(ADMIN ? [B(st, 'BtnWhy', 'btn_why', 17, { Image: 'bg_btn_ai.png', TextColor: C.w, Width: '-2', Height: '52', Visible: 'False' }),
        L(st, 'LblWhy', null, 15, { props: { Visible: 'False', BackgroundColor: '&HFFEEF3FE', TextColor: '&HFF1E3A8A' } })] : []),
      SP('SpQ6', 8, 10),
      B(st, 'BtnQNext', 'btn_next', 20, { Image: 'bg_btn_yellow.png', Width: '-2', Height: '56', Visible: 'False' }),
      SP('SpQ7', 8, 16),
    ]),
    VA('ArrResult', { Width: '-1092', Visible: 'False', AlignHorizontal: '3' }, [
      SP('SpR0', 8, 16),
      L(st, 'LblScoreBig', null, 48, { bold: true, props: { TextAlignment: '1' } }),
      L(st, 'LblScoreText', 'quiz_score', 18, { bold: true, props: { TextAlignment: '1' } }),
      SP('SpRbar', 8, 10),
      HA('ArrScoreBar', { Width: '-1060', Height: '12', BackgroundColor: '&HFFE2DED6' }, [node('Label', 'LblScoreFill', '4', { Text: '', Width: '-1001', Height: '12', BackgroundColor: C.grn, HasMargins: 'False' })]),
      SP('SpRbar2', 8, 12),
      L(st, 'LblBadge', null, 16, { bold: true, props: { TextAlignment: '1', BackgroundColor: '&HFFE7F5EC', TextColor: '&HFF0F7A37', Visible: 'False' } }),
      SP('SpR1', 8, 10),
      L(st, 'LblAnsHead', 'lbl_correct_answers', 14, { bold: true, props: { TextColor: C.mut } }),
      L(st, 'LblAnswers', null, 15),
      SP('SpR2', 8, 12),
      HA('ArrResBtns', { Width: '-2', AlignHorizontal: '3' }, [
        B(st, 'BtnRetry', 'btn_retry', 17, { Image: 'bg_btn_outline.png', Width: '-1044', Height: '56' }), SP('SpRb', '-1004'),
        B(st, 'BtnBackLessons', 'btn_back_lessons', 17, { Image: 'bg_btn_yellow.png', Width: '-1044', Height: '56' })]),
      SP('SpR3', 8, 16),
    ]),
    node('File', 'FileQuiz', '2', {}), node('Clock', 'Clock1', '3', { TimerEnabled: 'False' }), node('Clock', 'ClockGrow', '3', { TimerEnabled: 'False', TimerInterval: '30' }),
    node('Clock', 'ClockPulse', '3', { TimerEnabled: 'False', TimerInterval: '30' }),
    ...(ADMIN ? [node('ChatBot', 'ChatBot1', '1', {}), node('Web', 'Web1', '4', {}), node('TextToSpeech', 'TextToSpeech1', '5', { Country: 'IND' })] : []),
    ...nonVisible(),
  ];
  const b = st.blocks;
  b.push(top(glob('ID', '')), top(glob('QROWS', list())), top(glob('QI', 1)), top(glob('SCORE', 0)), top(glob('ANS', list())), top(glob('PICKED', false)), top(glob('QZ', list())));
  common(st, {
    lessons: true,
    afterStrings: [iff(mcmp('GT', len(gget('QROWS')), 0), callP('showCurrent'))],
    afterLessons: [gset('ID', upcase(trim(startValue()))),
      localS('r', callF('rowFor', gget('ID')), iff(not(listEmpty(lget('r'))), seq(setp('Label', 'LblBarTitle', 'Text', sel(lget('r'), 4)), gset('QZ', lget('r'))))),
      meth('File', 'FileQuiz', 'ReadFrom', '//quiz.csv')],
  });
  const findQ = (lang) => forEach('row', csvTable(eget('text')), iff(and(mcmp('GTE', len(lget('row')), 10), and(eq(sel(lget('row'), 1), gget('ID')), eq(sel(lget('row'), 2), lang))), addItem(gget('QROWS'), lget('row'))));
  const findQP = (lang) => forEach('row', csvTable(dbGet('pub_quiz_csv', '')), iff(and(mcmp('GTE', len(lget('row')), 10), and(eq(sel(lget('row'), 1), gget('ID')), eq(sel(lget('row'), 2), lang))), addItem(gget('QROWS'), lget('row'))));
  b.push(ev('File', 'FileQuiz', 'GotText', seq(gset('QROWS', list()), ...(ADMIN ? [findQP(gget('LANG')), iff(listEmpty(gget('QROWS')), findQP('en')), iff(listEmpty(gget('QROWS')), findQ(gget('LANG')))] : [findQ(gget('LANG'))]),
    iff(listEmpty(gget('QROWS')), findQ('en')),
    iff(listEmpty(gget('QROWS')), seq(alert(t('coming_soon')), closeScreen()), callP('startQuiz')))));
  b.push(defP('startQuiz', [], seq(gset('QI', 1), gset('SCORE', 0), gset('ANS', list()),
    vis('VerticalArrangement', 'ArrResult', false), vis('VerticalArrangement', 'ArrQuestion', true), callP('showQ'))));
  // optText(q, letter): the option text for A-D (columns 5-8)
  b.push(defF('optText', ['q', 'letter'], sel(lget('q'), add(4, posIn(lget('letter'), list('A', 'B', 'C', 'D'))))));
  b.push(defP('markBtn', ['letter', 'img'], seq(['A', 'B', 'C', 'D'].map((x) => iff(eq(lget('letter'), x), setp('Button', 'Btn' + x, 'Image', lget('img')))))));
  b.push(defP('showQ', [], seq(gset('PICKED', false),
    ['A', 'B', 'C', 'D'].map((x) => setp('Button', 'Btn' + x, 'Image', 'bg_opt.png')),
    vis('Label', 'LblFbOk', false), vis('Label', 'LblFbNo', false), vis('Label', 'LblExplain', false), vis('Button', 'BtnQNext', false),
    ADMIN ? seq(vis('Button', 'BtnWhy', false), vis('Label', 'LblWhy', false)) : null,
    callP('showCurrent'))));
  // showCurrent: (re)writes the texts of the current question in the chosen language (also after a language reload)
  b.push(defP('showCurrent', [], localS('q', sel(gget('QROWS'), gget('QI')), seq(
    setp('Label', 'LblProgFill', 'WidthPercent', round(mul(div(gget('QI'), len(gget('QROWS'))), 92))),   // % of the screen: the track is 92%
    setp('Label', 'LblQNum', 'Text', replaceAll(replaceAll(t('quiz_q_of'), '{n}', gget('QI')), '{total}', len(gget('QROWS')))),
    setp('Label', 'LblBarSub', 'Text', replaceAll(replaceAll(t('quiz_q_of'), '{n}', gget('QI')), '{total}', len(gget('QROWS')))),
    setp('Label', 'LblQuestion', 'Text', sel(lget('q'), 4)),
    ['A', 'B', 'C', 'D'].map((x) => setp('Button', 'Btn' + x, 'Text', join(x, '    ', callF('optText', lget('q'), x)))),
    setp('Label', 'LblExplain', 'Text', join(t('lbl_explanation'), ': ', sel(lget('q'), 10))),
    setp('Button', 'BtnQNext', 'Text', choose(mcmp('LT', gget('QI'), len(gget('QROWS'))), t('btn_next'), t('quiz_score')))))));
  // pick(letter) (QZ-2): first tap only; right answer green, wrong pick red, explanation shown
  b.push(defP('pick', ['letter'], iff(not(gget('PICKED')), localS('correct', upcase(trim(sel(sel(gget('QROWS'), gget('QI')), 9))), seq(
    gset('PICKED', true), addItem(gget('ANS'), lget('letter')),
    callP('markBtn', lget('correct'), 'bg_opt_right.png'), gset('PULSE', lget('correct')), gset('PF', 0), setp('Clock', 'ClockPulse', 'TimerEnabled', true),
    iff(eq(lget('letter'), lget('correct')), seq(gset('SCORE', add(gget('SCORE'), 1)), vis('Label', 'LblFbOk', true)),
      seq(callP('markBtn', lget('letter'), 'bg_opt_wrong.png'), vis('Label', 'LblFbNo', true), ADMIN ? vis('Button', 'BtnWhy', true) : null)),
    vis('Label', 'LblExplain', true), vis('Button', 'BtnQNext', true))))));
  for (const x of ['A', 'B', 'C', 'D']) b.push(ev('Button', 'Btn' + x, 'Click', callP('pick', x)));
  // Motion: pulse of the right answer, 8 frames x 30 ms
  b.push(top(glob('PULSE', '')), top(glob('PF', 0)));
  b.push(ev('Clock', 'ClockPulse', 'Timer', seq(gset('PF', add(gget('PF'), 1)),
    localS('h', sel(list(68, 72, 74, 72, 69, 66, 65, 64), gget('PF')),
      seq(['A', 'B', 'C', 'D'].map((x) => iff(eq(gget('PULSE'), x), setp('Button', 'Btn' + x, 'Height', lget('h')))))),
    iff(mcmp('GTE', gget('PF'), 8), setp('Clock', 'ClockPulse', 'TimerEnabled', false)))));
  // UI v2: score bar grows to SCORE/total of its 60% track in 15 frames (ease-out)
  b.push(top(glob('GROW', 0)));
  b.push(ev('Clock', 'ClockGrow', 'Timer', seq(gset('GROW', add(gget('GROW'), 1)),
    localS('k', sub(1, div(gget('GROW'), 15)), seq(setp('Label', 'LblScoreFill', 'WidthPercent',
      round(mul(mul(60, div(gget('SCORE'), len(gget('QROWS')))), sub(1, mul(lget('k'), mul(lget('k'), lget('k'))))))),
      setp('Label', 'LblScoreBig', 'Text', join(round(mul(gget('SCORE'), sub(1, mul(lget('k'), mul(lget('k'), lget('k')))))), ' / ', len(gget('QROWS')))))),
    iff(mcmp('GTE', gget('GROW'), 15), setp('Clock', 'ClockGrow', 'TimerEnabled', false)))));
  b.push(ev('Button', 'BtnQNext', 'Click', iff(mcmp('LT', gget('QI'), len(gget('QROWS'))), seq(gset('QI', add(gget('QI'), 1)), callP('showQ')), callP('showResult'))));
  // showResult (QZ-3, QZ-4, SKL-2): score, correct answers, best score + date saved, badge at >= 4/5
  b.push(defP('showResult', [], localS('lines', '', seq(
    vis('VerticalArrangement', 'ArrQuestion', false), vis('VerticalArrangement', 'ArrResult', true),
    setp('Label', 'LblBarSub', 'Text', t('quiz_score')),
    setp('Label', 'LblScoreBig', 'Text', join(gget('SCORE'), ' / ', len(gget('QROWS')))),
    setp('Label', 'LblScoreFill', 'WidthPercent', 0), gset('GROW', 0), setp('Clock', 'ClockGrow', 'TimerEnabled', true),   // UI v2: score bar fills
    iff(or(isEmpty(dbGet(join('score_', gget('ID')), '')), mcmp('GT', gget('SCORE'), dbGet(join('score_', gget('ID')), 0))),
      db('StoreValue', join('score_', gget('ID')), gget('SCORE'))),
    db('StoreValue', join('date_', gget('ID')), meth('Clock', 'Clock1', 'FormatDate', meth('Clock', 'Clock1', 'Now'), 'yyyy-MM-dd')),
    ADMIN ? iff(not(isEmpty(dbGet('cur_worker', ''))), localS('wk', join('w_', dbGet('cur_worker', ''), '_score_', gget('ID')),   // SUP-3: progress per worker
      iff(or(isEmpty(dbGet(lget('wk'), '')), mcmp('GT', gget('SCORE'), dbGet(lget('wk'), 0))), db('StoreValue', lget('wk'), gget('SCORE'))))) : null,
    iff(mcmp('GTE', gget('SCORE'), 4), seq(vis('Label', 'LblBadge', true),
      setp('Label', 'LblBadge', 'Text', join(t('skills_badges'), ': ', t(join('mod_', downcase(sel(gget('QZ'), 2))))))), vis('Label', 'LblBadge', false)),
    forEach('q', gget('QROWS'), localS('i', posIn(lget('q'), gget('QROWS')), localS('c', upcase(trim(sel(lget('q'), 9))),
      lset('lines', join(lget('lines'), choose(eq(sel(gget('ANS'), lget('i')), lget('c')), t('quiz_correct'), t('quiz_wrong')), '  ', sel(lget('q'), 4), '\n→ ', lget('c'), '. ', callF('optText', lget('q'), lget('c')), '\n\n'))))),
    setp('Label', 'LblAnswers', 'Text', lget('lines'))))));
  b.push(ev('Button', 'BtnRetry', 'Click', callP('startQuiz')));
  if (ADMIN) quizAdmin(st, b);
  b.push(ev('Button', 'BtnBackLessons', 'Click', closeWith('lessons')));
  b.push(ev('Form', 'Quiz', 'Initialize', callP('loadSettings')));
  backBlocks(st, closeScreen());
  return st;
}

// =====================================================================================
// Scan (QR-1..QR-4, FR-08) · built-in scanner, trim + upper case, type-code backup
// =====================================================================================
function scan() {
  const st = screen('Scan', 'Scan');
  st.comps = [
    bar(st, 'btn_scan'),
    VA('ArrScanBody', { Width: '-1092' }, [
      SP('SpS0', 8, 12),
      B(st, 'BtnScanBig', null, 20, { Image: 'bg_scan_big.png', Width: '-2', Height: '120', TextColor: C.w }),
      L(st, 'LblScanHint', 'scan_hint', 14, { props: { TextAlignment: '1', TextColor: C.mut } }),
      SP('SpS1', 8, 8),
      VA('ArrMsg', { Width: '-2', BackgroundColor: C.redL, Visible: 'False' }, [SP('SpMg0', 8, 10), padRow('ArrMg', [L(st, 'LblMsg', null, 16, { bold: true, props: { TextColor: C.red } }), L(st, 'LblMsgCode', null, 13, { props: { TextColor: C.mut } })]), SP('SpMg1', 8, 10)]),
      SP('SpS2', 8, 12),
      L(st, 'LblTypeHead', 'scan_type_code', 14, { bold: true, props: { TextColor: C.mut } }),
      HA('ArrType', { Width: '-2', AlignVertical: '2' }, [
        node('TextBox', 'TxtCode', '5', { Hint: 'SS-MAS-01', FontSize: '20', FontTypeface: FONTB, Width: '-1066', Height: '56', MultiLine: 'False' }),
        SP('SpT', '-1003'),
        B(st, 'BtnOpen', 'btn_open', 18, { BackgroundColor: C.y, Shape: '1', Width: '-1030', Height: '56' })]),
    ]),
    node('BarcodeScanner', 'BarcodeScanner1', '2', { UseExternalScanner: 'False' }),
    ...nonVisible(),
  ];
  const b = st.blocks;
  b.push(top(glob('SCANNED', false)));
  common(st, {
    lessons: true,
    afterStrings: [setp('Button', 'BtnScanBig', 'Text', join('\n\n', t('btn_scan')))],
    afterLessons: [iff(not(gget('SCANNED')), seq(gset('SCANNED', true), meth('BarcodeScanner', 'BarcodeScanner1', 'DoScan')))],   // camera opens at once: 1 tap from Home
  });
  b.push(defP('showMsg', ['msg', 'code'], seq(vis('VerticalArrangement', 'ArrMsg', true), setp('Label', 'LblMsg', 'Text', lget('msg')), setp('Label', 'LblMsgCode', 'Text', lget('code')))));
  // process(code) (PRD 12.2): upcase(trim) -> not "SS-..." -> "Not a SITE SAATHI code"; not in lessons.csv -> QR-3 message; else open
  b.push(defP('process', ['code'], localS('c', upcase(trim(lget('code'))), iff(not(isEmpty(lget('c'))), ifs([
    [not(eq(sel(split(lget('c'), '-'), 1), 'SS')), callP('showMsg', t('qr_not_ss'), lget('c'))],
    [listEmpty(callF('rowFor', lget('c'))), callP('showMsg', t('qr_not_found'), lget('c'))],
  ], seq(vis('VerticalArrangement', 'ArrMsg', false), setp('TextBox', 'TxtCode', 'Text', ''), openWith('Learn', lget('c'))))))));
  b.push(ev('BarcodeScanner', 'BarcodeScanner1', 'AfterScan', callP('process', eget('result'))));
  b.push(ev('Button', 'BtnScanBig', 'Click', meth('BarcodeScanner', 'BarcodeScanner1', 'DoScan')));
  b.push(ev('Button', 'BtnOpen', 'Click', callP('process', getp('TextBox', 'TxtCode', 'Text'))));
  b.push(ev('Form', 'Scan', 'OtherScreenClosed', closeScreen()));   // after the lesson, Back goes straight Home (HOM-4)
  b.push(ev('Form', 'Scan', 'Initialize', callP('loadSettings')));
  backBlocks(st, closeScreen());
  return st;
}

// =====================================================================================
// Skills · My Skills (SKL-1, SKL-2) · viewed / completed, best score, progress per module, badges
// =====================================================================================
function skills() {
  const st = screen('Skills', 'Skills');
  const modRow = (code) => VA('ArrSk' + code, { Width: '-2', Visible: 'False' }, [
    HA('ArrSkHead' + code, { Width: '-2' }, [L(st, 'LblSk' + code, null, 15, { bold: true }), node('Label', 'LblSkCnt' + code, '4', { Text: '', FontSize: '15', FontTypeface: FONTB, TextColor: C.k, Width: '-1' })]),
    HA('ArrSkBar' + code, { Width: '-1092', Height: '10', BackgroundColor: '&HFFE2DED6' }, [node('Label', 'LblSkFill' + code, '4', { Text: '', Width: '-1001', Height: '10', BackgroundColor: C.grn, HasMargins: 'False' })]),
    SP('SpSk' + code, 8, 10)]);
  st.comps = [
    bar(st, 'btn_skills'),
    VA('ArrSkBody', { Width: '-1092' }, [
      SP('SpK0', 8, 12),
      VA('ArrSum', { Width: '-2', BackgroundColor: C.k, AlignHorizontal: '3' }, [
        SP('SpK1', 8, 14),
        HA('ArrSumRow', { Width: '-1084', AlignVertical: '2' }, [
          node('Label', 'LblSumBig', '4', { Text: '0/0', FontSize: '40', FontTypeface: FONTB, TextColor: C.y, Width: '-1', HasMargins: 'True' }), SP('SpK2', 12, 8),
          L(st, 'LblSumText', 'skills_completed', 16, { bold: true, props: { TextColor: C.w } })]),
        SP('SpK3', 8, 8),
        HA('ArrSumBar', { Width: '-1084', Height: '10', BackgroundColor: '&HFF3A3F46' }, [node('Label', 'LblSumFill', '4', { Text: '', Width: '-1001', Height: '10', BackgroundColor: C.grn, HasMargins: 'False' })]),
        SP('SpK3b', 8, 16)]),
      SP('SpK4', 8, 12),
      ...MODS.map(modRow),
      L(st, 'LblLessonsHead', 'lbl_lessons', 14, { bold: true, props: { TextColor: C.mut } }),
      node('ListView', 'LvSkills', '6', { Width: '-2', Height: '-2', BackgroundColor: C.w, TextColor: C.k, TextSize: '18', ShowFilterBar: 'False' }),
      SP('SpK5', 8, 12),
      L(st, 'LblBadgesHead', 'skills_badges', 14, { bold: true, props: { TextColor: C.mut } }),
      HA('ArrBadges', { Width: '-2' }, MODS.map((c) => IMG('ImgBadge' + c, `icon_mod_${c.toLowerCase()}.png`, 56, 56, { Visible: 'False' }))),
      L(st, 'LblBadgeNames', null, 14),
      SP('SpK6', 8, 16),
    ]),
    node('Clock', 'ClockGrow', '3', { TimerEnabled: 'False', TimerInterval: '30' }),
    ...nonVisible(),
  ];
  const b = st.blocks;
  b.push(top(glob('IDS', list())));
  common(st, { lessons: true, afterStrings: [iff(mcmp('GT', len(gget('LES')), 0), callP('refresh'))], afterLessons: [callP('refresh'), ADMIN ? callP('skillsStart') : null] });
  if (ADMIN) skillsAdmin(st, b);
  // helpers over lessons.csv (English rows = the list of lessons on this phone)
  const enRows = (body) => forEach('row', gget('LES'), iff(and(mcmp('GTE', len(lget('row')), 3), eq(sel(lget('row'), 3), 'en')), body));
  const hasScore = (idB) => not(isEmpty(dbGet(join('score_', idB), '')));
  b.push(defF('countMod', ['code'], localE('n', 0, doReturn(enRows(iff(eq(sel(lget('row'), 2), lget('code')), lset('n', add(lget('n'), 1)))), lget('n')))));
  b.push(defF('doneIn', ['code'], localE('n', 0, doReturn(enRows(iff(and(eq(sel(lget('row'), 2), lget('code')), hasScore(sel(lget('row'), 1))), lset('n', add(lget('n'), 1)))), lget('n')))));
  b.push(defF('badgeIn', ['code'], localE('b', false, doReturn(enRows(iff(and(eq(sel(lget('row'), 2), lget('code')), hasScore(sel(lget('row'), 1))),
    iff(mcmp('GTE', dbGet(join('score_', sel(lget('row'), 1)), 0), 4), lset('b', true)))), lget('b')))));
  b.push(defF('statusOf', ['id'], choose(hasScore(lget('id')), join(t('skills_best'), ': ', dbGet(join('score_', lget('id')), 0), '/5'),
    choose(not(isEmpty(dbGet(join('viewed_', lget('id')), ''))), t('skills_viewed'), t('skills_not_started')))));
  b.push(defP('refresh', [], localS('lines', list(), localS('total', 0, localS('done', 0, localS('badges', '', seq(
    gset('IDS', list()),
    enRows(seq(lset('total', add(lget('total'), 1)), iff(hasScore(sel(lget('row'), 1)), lset('done', add(lget('done'), 1))),
      addItem(gget('IDS'), sel(lget('row'), 1)),
      localS('r', callF('rowFor', sel(lget('row'), 1)), addItem(lget('lines'), join(sel(lget('r'), 4), '\n', sel(lget('row'), 1), ' · ', callF('statusOf', sel(lget('row'), 1))))))),
    setp('Label', 'LblSumBig', 'Text', join(lget('done'), '/', lget('total'))),
    gset('BARS', list(choose(mcmp('GT', lget('total'), 0), mul(div(lget('done'), lget('total')), 84), 0))),   // UI v2: targets in % of the screen (track 84%)
    MODS.map((code) => localS('c', callF('countMod', code), localS('d', callF('doneIn', code), seq(
      vis('VerticalArrangement', 'ArrSk' + code, mcmp('GT', lget('c'), 0)),
      setp('Label', 'LblSk' + code, 'Text', t('mod_' + code.toLowerCase())),
      setp('Label', 'LblSkCnt' + code, 'Text', join(lget('d'), '/', lget('c'))),
      addItem(gget('BARS'), choose(mcmp('GT', lget('c'), 0), mul(div(lget('d'), lget('c')), 92), 0)),   // track 92%
      setp('Image', 'ImgBadge' + code, 'Visible', callF('badgeIn', code)),
      iff(callF('badgeIn', code), lset('badges', join(lget('badges'), choose(isEmpty(lget('badges')), '', ' · '), t('mod_' + code.toLowerCase())))))))),
    setp('Label', 'LblBadgeNames', 'Text', choose(isEmpty(lget('badges')), '—', lget('badges'))),
    setp('ListView', 'LvSkills', 'Elements', lget('lines')),
    gset('GROW', 0), callP('drawBars'), setp('Clock', 'ClockGrow', 'TimerEnabled', true))))))));
  // UI v2: bars grow from 0 to their value in 15 frames (ease-out)
  b.push(top(glob('BARS', list())), top(glob('GROW', 0)));
  b.push(defP('drawBars', [], localS('k', sub(1, div(gget('GROW'), 15)), localS('e', sub(1, mul(lget('k'), mul(lget('k'), lget('k')))), seq(
    setp('Label', 'LblSumFill', 'WidthPercent', round(mul(sel(gget('BARS'), 1), lget('e')))),
    MODS.map((code, i) => setp('Label', 'LblSkFill' + code, 'WidthPercent', round(mul(sel(gget('BARS'), i + 2), lget('e'))))))))));
  b.push(ev('Clock', 'ClockGrow', 'Timer', seq(gset('GROW', add(gget('GROW'), 1)), callP('drawBars'),
    iff(mcmp('GTE', gget('GROW'), 15), setp('Clock', 'ClockGrow', 'TimerEnabled', false)))));
  b.push(ev('ListView', 'LvSkills', 'AfterPicking', openWith('Learn', sel(gget('IDS'), getp('ListView', 'LvSkills', 'SelectionIndex')))));
  b.push(ev('Form', 'Skills', 'OtherScreenClosed', callP('refresh')));
  b.push(ev('Form', 'Skills', 'Initialize', callP('loadSettings')));
  backBlocks(st, closeScreen());
  return st;
}

// =====================================================================================
// Admin (admin build only) · PRD 10.13 · Days 15-16
// Login (ADM-1/2), dashboard, lesson list, lesson editor (3 languages, auto ID - ADM-3), steps with pictures,
// audio recording, quiz editor, completeness (ADM-6), submit, review (approve / send back), publish (Admin only),
// QR codes and App texts. All calls go to the Apps Script web app (backend/apps-script) as form posts.
// Photo / audio upload needs the Base64 extension: procedure toBase64(path) is the ONE place to add its blocks,
// then call sendUpload(base64) from the extension's result event (setup/Day15_16_Guide.md).
// =====================================================================================
const lk = (d, k, nf = '') => blk('lists_lookup_in_pairs', V('KEY', lit(k)) + V('LIST', d) + V('NOTFOUND', lit(nf)));
const neq = (a, b) => not(eq(a, b));
Object.assign(PARAMS, { api: ['action', 'body'], showView: ['name'], sendUpload: ['b64'], startUpload: ['kind', 'file'], toBase64: ['file'], linesOf: ['items'], adminLesson: ['id'] });
function admin() {
  const st = screen('Admin', 'Admin Mode');
  const head = (name, key) => L(st, name, key, 14, { bold: true, props: { TextColor: C.mut } });
  const card = (name, kids) => VA(name, { Width: '-2', BackgroundColor: C.card }, [SP(name + 'T', 8, 12), padRow(name, kids), SP(name + 'B', 8, 14)]);
  const tb = (name, multi = false, props = {}) => node('TextBox', name, '5', { FontSize: '16', FontTypeface: FONT, Width: '-2', MultiLine: multi ? 'True' : 'False', ...(multi ? { Height: '96' } : {}), ...props });
  const btn = (name, key, img = 'bg_btn_outline.png', props = {}) => B(st, name, key, 17, { Image: img, Width: '-2', Height: '56', ...props });
  const half = (name, key, img = 'bg_btn_outline.png', props = {}) => B(st, name, key, 16, { Image: img, Width: '-1048', Height: '52', ...props });
  const third = (name, label) => node('Button', name, '6', { Text: label, FontSize: '16', FontTypeface: FONTB, FontBold: 'True', TextColor: C.k, Image: 'bg_btn_outline.png', Width: '-1031', Height: '48' });
  const VIEWS = ['ArrLogin', 'ArrDash', 'ArrEdit', 'ArrStep', 'ArrQuiz', 'ArrQr', 'ArrTexts'];
  const sp = (n) => SP('SpAd' + n, 8, 10);
  st.comps = [
    bar(st, 'adm_title'),
    VA('ArrAdm', { Width: '-1092' }, [
      SP('SpAdTop', 8, 8),
      L(st, 'LblStatus', null, 15, { bold: true, props: { Visible: 'False', BackgroundColor: '&HFFFFF1C7', TextColor: '&HFF7A5600', TextAlignment: '1' } }),
      B(st, 'BtnRetry', 'btn_retry', 16, { Image: 'bg_btn_yellow.png', Width: '-2', Height: '48', Visible: 'False' }),
      // ---- Login: logo + title, form in a white card ----
      VA('ArrLogin', { Width: '-2', AlignHorizontal: '3' }, [sp(1),
        IMG('ImgAdmLogo', 'logo_yellow_512.png', 64, 64), SP('SpAdL1', 8, 6),
        L(st, 'LblAdmHero', 'adm_title', 22, { bold: true, props: { TextAlignment: '1' } }), SP('SpAdL2', 8, 14),
        card('CrdLogin', [
          head('LblSrvHead', 'adm_server'), tb('TxtUrl', false, { Hint: 'https://script.google.com/macros/s/…/exec', FontSize: '13' }), SP('SpAdL3', 8, 8),
          head('LblMailHead', 'adm_email'), tb('TxtEmail', false, { Hint: 'name@example.com' }), SP('SpAdL4', 8, 8),
          head('LblPassHead', 'adm_password'), node('PasswordTextBox', 'PwdPass', '4', { FontSize: '16', Width: '-2' })]),
        sp(2), btn('BtnLogin', 'adm_login', 'bg_btn_yellow.png')]),
      // ---- Dashboard: counts card, new lesson, list, tools ----
      VA('ArrDash', { Width: '-2', Visible: 'False' }, [sp(3),
        VA('CrdCounts', { Width: '-2', BackgroundColor: C.k }, [SP('SpCc0', 8, 14), padRow('CrdCnt', [L(st, 'LblCounts', null, 17, { bold: true, props: { TextColor: C.y } })]), SP('SpCc1', 8, 14)]),
        sp(16), btn('BtnNew', 'adm_new_lesson', 'bg_btn_yellow.png'), sp(4),
        head('LblLesHeadA', 'lbl_lessons'),
        node('ListView', 'LvAdmLessons', '6', { Width: '-2', Height: '320', BackgroundColor: C.w, TextColor: C.k, TextSize: '17', ShowFilterBar: 'False' }), sp(5),
        HA('ArrDashBtns', { Width: '-2' }, [half('BtnQrOpen', 'adm_qr'), SP('SpDb', '-1004'), half('BtnTextsOpen', 'adm_texts')]), sp(6),
        btn('BtnPublish', 'adm_publish', 'bg_btn_charcoal.png', { TextColor: C.w }), sp(7),
        btn('BtnLogout', 'adm_logout', 'bg_btn_danger.png', { TextColor: C.red })]),
      // ---- Lesson editor: basics, text, audio cards; checks; submit / review ----
      VA('ArrEdit', { Width: '-2', Visible: 'False' }, [sp(8),
        card('CrdEdBasic', [
          L(st, 'LblEdHead', null, 17, { bold: true }),
          node('ListPicker', 'LpModule', '9', { Text: '[adm_module]', FontSize: '16', FontTypeface: FONTB, FontBold: 'True', Image: 'bg_btn_outline.png', Width: '-2', Height: '52', Visible: 'False' }),
          head('LblDurHead', 'adm_duration'), tb('TxtDur', false, { NumbersOnly: 'True', Width: '-1030' }), SP('SpEb1', 8, 8),
          HA('ArrEdLang', { Width: '-2' }, [third('BtnEMr', 'मराठी'), SP('SpEl1', '-1003'), third('BtnEHi', 'हिंदी'), SP('SpEl2', '-1003'), third('BtnEEn', 'English')])]),
        sp(17),
        card('CrdEdText', [
          head('LblTitleHead', 'adm_f_title'), tb('TxtTitle'), SP('SpEt1', 8, 6),
          head('LblDescHead', 'adm_f_desc'), tb('TxtDesc', true), SP('SpEt2', 8, 6),
          head('LblObjHeadA', 'lbl_objective'), tb('TxtObj', true), SP('SpEt3', 8, 6),
          head('LblMatHeadA', 'lbl_materials'), tb('TxtMat', true, { Hint: '[adm_one_per_line]' }), SP('SpEt4', 8, 6),
          head('LblSafeHead', 'lbl_safety'), tb('TxtSafe', true), SP('SpEt5', 8, 6),
          head('LblMistHead', 'lbl_mistakes'), tb('TxtMist', true)]),
        sp(18),
        card('CrdEdAudio', [
          L(st, 'LblAudioUrl', null, 13, { props: { TextColor: C.mut } }),
          HA('ArrRec', { Width: '-2' }, [third('BtnRec', ''), SP('SpRc1', '-1003'), third('BtnPlayRec', ''), SP('SpRc2', '-1003'), third('BtnUpAudio', '')]),
          node('CheckBox', 'ChkRead', '2', { Text: '[adm_read_aloud]', FontSize: '15', FontTypeface: FONT, Width: '-2' })]),
        sp(9), btn('BtnSaveText', 'adm_save', 'bg_btn_yellow.png'), sp(19),
        HA('ArrEdNav', { Width: '-2' }, [half('BtnSteps', 'adm_steps'), SP('SpEn', '-1004'), half('BtnQuiz', 'adm_quiz')]), sp(20),
        L(st, 'LblMissing', null, 14, { props: { BackgroundColor: '&HFFFFF8E1' } }), sp(21),
        btn('BtnSubmit', 'adm_submit', 'bg_btn_charcoal.png', { TextColor: C.w }),
        VA('ArrReviewBox', { Width: '-2', Visible: 'False', BackgroundColor: '&HFFE7F5EC' }, [SP('SpRvb0', 8, 12),
          padRow('ArrRvb', [L(st, 'LblLastReview', null, 14), head('LblComHead', 'adm_comment'), tb('TxtComment', true)]), SP('SpRvb1', 8, 10),
          HA('ArrRvBtns', { Width: '-2', AlignHorizontal: '3' }, [half('BtnApprove', 'adm_approve', 'bg_btn_yellow.png'), SP('SpRv', '-1004'), half('BtnSendBack', 'adm_send_back', 'bg_btn_danger.png', { TextColor: C.red })]),
          SP('SpRvb2', 8, 12)]),
        sp(10)]),
      // ---- Steps editor: picture card, text card ----
      VA('ArrStep', { Width: '-2', Visible: 'False' }, [sp(11),
        node('ListPicker', 'LpStep', '9', { Text: '', FontSize: '16', FontTypeface: FONTB, FontBold: 'True', Image: 'bg_btn_outline.png', Width: '-2', Height: '52' }), sp(22),
        card('CrdStPic', [
          L(st, 'LblStepHead', null, 17, { bold: true }),
          IMG('ImgStepPrev', '', '-2', 200), SP('SpSp1', 8, 10),
          HA('ArrPhoto', { Width: '-2' }, [third('BtnCam', ''), SP('SpPh1', '-1003'),
            node('ImagePicker', 'PickGallery', '5', { Text: '', FontSize: '16', FontTypeface: FONTB, FontBold: 'True', Image: 'bg_btn_outline.png', Width: '-1031', Height: '48' }), SP('SpPh2', '-1003'), third('BtnUpPhoto', '')])]),
        sp(23),
        card('CrdStText', [
          L(st, 'LblSmr', null, 14, { bold: true, props: { Text: 'मराठी', TextColor: C.mut } }), tb('TxtSmr', true), SP('SpSt1', 8, 6),
          L(st, 'LblShi', null, 14, { bold: true, props: { Text: 'हिंदी', TextColor: C.mut } }), tb('TxtShi', true), SP('SpSt2', 8, 6),
          L(st, 'LblSen', null, 14, { bold: true, props: { Text: 'English', TextColor: C.mut } }), tb('TxtSen', true)]),
        sp(24), btn('BtnSaveStep', 'adm_save', 'bg_btn_yellow.png'), sp(12), btn('BtnDelStep', 'adm_delete_step', 'bg_btn_danger.png', { TextColor: C.red })]),
      // ---- Quiz editor ----
      VA('ArrQuiz', { Width: '-2', Visible: 'False' }, [sp(13),
        node('ListPicker', 'LpQno', '9', { Text: '', ElementsFromString: '1,2,3,4,5', FontSize: '16', FontTypeface: FONTB, FontBold: 'True', Image: 'bg_btn_outline.png', Width: '-2', Height: '52' }), sp(25),
        card('CrdQz', [
          head('LblQHead', 'adm_question'), tb('TxtQ', true), SP('SpQz1', 8, 6),
          ...['A', 'B', 'C', 'D'].map((x) => tb('TxtQ' + x, false, { Hint: x })), SP('SpQz2', 8, 10),
          node('ListPicker', 'LpCorrect', '9', { Text: '', ElementsFromString: 'A,B,C,D', FontSize: '16', FontTypeface: FONTB, FontBold: 'True', Image: 'bg_btn_outline.png', Width: '-2', Height: '52' }), SP('SpQz3', 8, 6),
          head('LblExpHead', 'lbl_explanation'), tb('TxtQexp', true)]),
        sp(26), btn('BtnSaveQ', 'adm_save', 'bg_btn_yellow.png')]),
      // ---- QR codes ----
      VA('ArrQr', { Width: '-2', Visible: 'False' }, [sp(14),
        node('ListView', 'LvQr', '6', { Width: '-2', Height: '220', BackgroundColor: C.w, TextColor: C.k, TextSize: '17' }), sp(27),
        card('CrdQr', [
          VA('ArrQrImg', { Width: '-2', AlignHorizontal: '3' }, [IMG('ImgQr', '', 200, 200), L(st, 'LblQrId', null, 18, { bold: true, props: { TextAlignment: '1' } })]),
          head('LblPlaceHead', 'adm_place'), tb('TxtPlace'),
          node('CheckBox', 'ChkPrinted', '2', { Text: '[adm_printed]', FontSize: '15', FontTypeface: FONT })]),
        sp(28), btn('BtnSaveQr', 'adm_save', 'bg_btn_yellow.png')]),
      // ---- App texts ----
      VA('ArrTexts', { Width: '-2', Visible: 'False' }, [sp(15),
        node('ListView', 'LvTexts', '6', { Width: '-2', Height: '260', BackgroundColor: C.w, TextColor: C.k, TextSize: '15', ShowFilterBar: 'True' }), sp(29),
        card('CrdTx', [
          L(st, 'LblKey', null, 16, { bold: true }),
          L(st, 'LblTmr', null, 14, { bold: true, props: { Text: 'मराठी', TextColor: C.mut } }), tb('TxtTmr'),
          L(st, 'LblThi', null, 14, { bold: true, props: { Text: 'हिंदी', TextColor: C.mut } }), tb('TxtThi'),
          L(st, 'LblTen', null, 14, { bold: true, props: { Text: 'English', TextColor: C.mut } }), tb('TxtTen')]),
        sp(30), btn('BtnSaveTxt', 'adm_save', 'bg_btn_yellow.png')]),
      SP('SpAdEnd', 8, 20),
    ]),
    node('Web', 'Web1', '4', {}), node('Clock', 'Clock1', '3', { TimerEnabled: 'False' }),
    node('Camera', 'Camera1', '3', {}), node('SoundRecorder', 'SoundRecorder1', '2', {}), node('Player', 'Player1', '6', {}),
    ...nonVisible(),
  ];
  const b = st.blocks;
  ['TOKEN', 'ROLE', 'NAME', 'URL', 'PENDING', 'LASTBODY', 'CUR', 'VIEWA', 'PHOTO', 'REC', 'UPKIND', 'UPFILE', 'CONFIRM'].forEach((g) => b.push(top(glob(g, ''))));
  ['RESP', 'CURL', 'LESSONS', 'IDS', 'MODS', 'QRS', 'KEYS'].forEach((g) => b.push(top(glob(g, list()))));
  b.push(top(glob('ED', 'en')), top(glob('STEPNO', 1)), top(glob('QNO', 1)), top(glob('RECORDING', false)), top(glob('STARTED', false)), top(glob('QRI', 1)), top(glob('KEYI', 1)));
  common(st, { afterStrings: [callP('afterText'), iff(not(gget('STARTED')), seq(gset('STARTED', true), callP('startAdmin')))] });
  const req = (action, ...pairs) => list(list('action', action), list('token', gget('TOKEN')), ...pairs.map(([k, v]) => list(k, v)));
  const api = (action, ...pairs) => callP('api', action, req(action, ...pairs));
  const say = (txt) => seq(setp('Label', 'LblStatus', 'Text', txt), vis('Label', 'LblStatus', true));
  const isRole = (r) => eq(gget('ROLE'), r);

  // ---- views ----
  const VTITLE = { ArrLogin: 'adm_title', ArrDash: 'adm_dashboard', ArrEdit: 'adm_edit_lesson', ArrStep: 'adm_steps', ArrQuiz: 'adm_quiz', ArrQr: 'adm_qr', ArrTexts: 'adm_texts' };
  b.push(defP('showView', ['name'], seq(gset('VIEWA', lget('name')), VIEWS.map((v) => vis('VerticalArrangement', v, eq(lget('name'), v))),
    VIEWS.map((v) => iff(eq(lget('name'), v), setp('Label', 'LblBarTitle', 'Text', t(VTITLE[v])))))));   // UI v2: title per page
  b.push(defP('afterText', [], seq(
    setp('Button', 'BtnRec', 'Text', t(choose(gget('RECORDING'), 'adm_stop', 'adm_record'))), setp('Button', 'BtnPlayRec', 'Text', t('btn_listen')), setp('Button', 'BtnUpAudio', 'Text', t('adm_save')),
    setp('Button', 'BtnCam', 'Text', t('lbl_camera')), setp('ImagePicker', 'PickGallery', 'Text', t('adm_gallery')), setp('Button', 'BtnUpPhoto', 'Text', t('adm_save')),
    setp('ListPicker', 'LpModule', 'Text', t('adm_module')), setp('TextBox', 'TxtMat', 'Hint', t('adm_one_per_line')),
    setp('CheckBox', 'ChkRead', 'Text', t('adm_read_aloud')), setp('CheckBox', 'ChkPrinted', 'Text', t('adm_printed')),
    [['BtnEMr', 'mr'], ['BtnEHi', 'hi'], ['BtnEEn', 'en']].map(([x, c]) => setp('Button', x, 'Image', choose(eq(gget('ED'), c), vimg(st, x, 'bg_btn_yellow.png'), vimg(st, x, 'bg_btn_outline.png')))))));
  b.push(defP('applyRole', [], seq(
    setp('Label', 'LblBarSub', 'Text', join(gget('NAME'), ' · ', gget('ROLE'))),
    vis('Button', 'BtnNew', neq(gget('ROLE'), 'Reviewer')), vis('Button', 'BtnPublish', isRole('Admin')), vis('Button', 'BtnTextsOpen', isRole('Admin')),
    ['BtnSaveText', 'BtnSubmit', 'BtnSaveStep', 'BtnDelStep', 'BtnSaveQ', 'BtnUpPhoto', 'BtnUpAudio', 'BtnRec', 'ChkRead'].map((x) => setp(x === 'ChkRead' ? 'CheckBox' : 'Button', x, 'Visible', neq(gget('ROLE'), 'Reviewer'))))));

  // ---- server calls: one at a time, form-encoded, JSON back; Retry repeats the last call ----
  b.push(defP('api', ['action', 'body'], seq(gset('PENDING', lget('action')), say(t('adm_wait')), vis('Button', 'BtnRetry', false),
    gset('LASTBODY', meth('Web', 'Web1', 'BuildRequestData', lget('body'))), callP('post'))));
  b.push(defP('post', [], seq(setp('Web', 'Web1', 'Url', gget('URL')),
    setp('Web', 'Web1', 'RequestHeaders', list(list('Content-Type', 'application/x-www-form-urlencoded'))), meth('Web', 'Web1', 'PostText', gget('LASTBODY')))));
  b.push(defP('netError', [], seq(say(t('adm_net_error')), vis('Button', 'BtnRetry', true))));
  b.push(ev('Button', 'BtnRetry', 'Click', seq(vis('Button', 'BtnRetry', false), say(t('adm_wait')), callP('post'))));
  b.push(ev('Web', 'Web1', 'GotText', iff(neq(eget('responseCode'), 200), callP('netError'), seq(
    gset('RESP', meth('Web', 'Web1', 'JsonTextDecode', eget('responseContent'))), vis('Label', 'LblStatus', false),
    iff(eq(lk(gget('RESP'), 'ok', false), true), callP('handle'), seq(say(lk(gget('RESP'), 'error', '?')),
      iff(eq(lk(gget('RESP'), 'relogin', false), true), callP('logout'))))))));
  const webRef = blk('component_component_block', '<field name="COMPONENT_SELECTOR">Web1</field>', '<mutation component_type="Web" instance_name="Web1"></mutation>');
  b.push(ev('Form', 'Admin', 'ErrorOccurred', iff(eq(eget('component'), webRef), callP('netError'), say(eget('message')))));   // only network errors offer Retry

  // ---- start, login, logout (token kept 12 h in TinyDB; ADM-2) ----
  b.push(defP('startAdmin', [], seq(
    gset('URL', choose(isEmpty(dbGet('adm_url', '')), API_URL, dbGet('adm_url', ''))), setp('TextBox', 'TxtUrl', 'Text', gget('URL')),
    iff(and(not(isEmpty(dbGet('adm_token', ''))), mcmp('LT', meth('Clock', 'Clock1', 'SystemTime'), dbGet('adm_expires', 0))),
      seq(gset('TOKEN', dbGet('adm_token', '')), gset('ROLE', dbGet('adm_role', '')), gset('NAME', dbGet('adm_name', '')), callP('loadDash')),
      callP('showView', 'ArrLogin')))));
  b.push(ev('Button', 'BtnLogin', 'Click', seq(gset('URL', trim(getp('TextBox', 'TxtUrl', 'Text'))), db('StoreValue', 'adm_url', gget('URL')),
    api('login', ['email', trim(getp('TextBox', 'TxtEmail', 'Text'))], ['password', getp('PasswordTextBox', 'PwdPass', 'Text')]))));
  b.push(defP('logout', [], seq(['adm_token', 'adm_role', 'adm_name', 'adm_expires'].map((k) => db('ClearTag', k)), gset('TOKEN', ''),
    setp('PasswordTextBox', 'PwdPass', 'Text', ''), setp('Label', 'LblBarSub', 'Text', ''), callP('showView', 'ArrLogin'))));
  b.push(ev('Button', 'BtnLogout', 'Click', seq(callP('logout'), vis('Label', 'LblStatus', false))));
  b.push(defP('loadDash', [], seq(callP('applyRole'), api('listLessons'))));

  // ---- lesson editor ----
  b.push(defF('linesOf', ['items'], localE('s', '', doReturn(forEach('x', lget('items'), lset('s', join(lget('s'), choose(isEmpty(lget('s')), '', '\n'), '• ', lget('x')))), lget('s')))));
  b.push(defP('adminLesson', ['id'], seq(gset('CUR', lget('id')), api('getLesson', ['id', lget('id')]))));
  b.push(ev('ListView', 'LvAdmLessons', 'AfterPicking', seq(gset('VIEWA', 'ArrEdit'), callP('adminLesson', sel(gget('IDS'), getp('ListView', 'LvAdmLessons', 'SelectionIndex'))))));
  const fields = [['TxtTitle', 'title'], ['TxtDesc', 'description'], ['TxtObj', 'objective'], ['TxtMat', 'materials'], ['TxtSafe', 'safety'], ['TxtMist', 'mistakes']];
  b.push(ev('Button', 'BtnNew', 'Click', seq(gset('CUR', ''), gset('CURL', list()), gset('ED', 'en'), callP('afterText'),
    fields.map(([x]) => setp('TextBox', x, 'Text', '')), setp('TextBox', 'TxtDur', 'Text', '5'), vis('ListPicker', 'LpModule', true),
    setp('Label', 'LblEdHead', 'Text', t('adm_new_lesson')), setp('Label', 'LblMissing', 'Text', ''), setp('Label', 'LblAudioUrl', 'Text', ''),
    vis('HorizontalArrangement', 'ArrEdNav', false), vis('Button', 'BtnSubmit', false), vis('VerticalArrangement', 'ArrReviewBox', false),
    vis('HorizontalArrangement', 'ArrRec', false), vis('CheckBox', 'ChkRead', false), callP('showView', 'ArrEdit'))));
  b.push(ev('ListPicker', 'LpModule', 'BeforePicking', setp('ListPicker', 'LpModule', 'Elements', localE('out', list(), doReturn(
    forEach('m', gget('MODS'), addItem(lget('out'), join(lk(lget('m'), 'code'), ' – ', lk(lget('m'), 'name'))))
    , lget('out'))))));
  b.push(ev('ListPicker', 'LpModule', 'AfterPicking', setp('ListPicker', 'LpModule', 'Text', getp('ListPicker', 'LpModule', 'Selection'))));
  // fillEditor: the chosen language's text, audio, missing list, review box
  b.push(defP('fillEditor', [], localS('les', lk(gget('CURL'), 'lesson', list()), localS('tl', lk(lk(gget('CURL'), 'texts', list()), gget('ED'), list()), localS('miss', lk(gget('CURL'), 'missing', list()), seq(
    callP('afterText'), vis('ListPicker', 'LpModule', false), vis('HorizontalArrangement', 'ArrEdNav', true), vis('HorizontalArrangement', 'ArrRec', true),
    setp('Label', 'LblEdHead', 'Text', join(lk(lget('les'), 'id'), ' · ', lk(lget('les'), 'status'))),
    setp('TextBox', 'TxtDur', 'Text', lk(lget('les'), 'duration_min')),
    fields.map(([x, f]) => setp('TextBox', x, 'Text', lk(lget('tl'), f))),
    setp('CheckBox', 'ChkRead', 'Checked', eq(lk(lget('tl'), 'audio_url'), 'READ_ALOUD')),
    setp('Label', 'LblAudioUrl', 'Text', join(t('lbl_audio'), ' (', gget('ED'), '): ', lk(lget('tl'), 'audio_url', '—'))),
    setp('Label', 'LblMissing', 'Text', choose(listEmpty(lget('miss')), t('adm_complete'), join(t('adm_missing'), ':\n', callF('linesOf', lget('miss'))))),
    vis('Button', 'BtnSubmit', and(neq(gget('ROLE'), 'Reviewer'), listEmpty(lget('miss')))),
    vis('VerticalArrangement', 'ArrReviewBox', and(neq(gget('ROLE'), 'Writer'), eq(lk(lget('les'), 'status'), 'In review'))),
    setp('Label', 'LblLastReview', 'Text', lk(lk(gget('CURL'), 'last_review', list()), 'comment'))))))));
  for (const [x, c] of [['BtnEMr', 'mr'], ['BtnEHi', 'hi'], ['BtnEEn', 'en']]) b.push(ev('Button', x, 'Click', seq(gset('ED', c), iff(isEmpty(gget('CUR')), callP('afterText'), callP('fillEditor')))));
  b.push(ev('Button', 'BtnSaveText', 'Click', iff(isEmpty(gget('CUR')),
    iff(isEmpty(getp('ListPicker', 'LpModule', 'Selection')), say(t('adm_module')),
      api('saveLesson', ['module', sel(split(getp('ListPicker', 'LpModule', 'Selection'), ' – '), 1)], ['duration_min', getp('TextBox', 'TxtDur', 'Text')], ['lang', gget('ED')],
        ...fields.map(([x, f]) => [f, getp('TextBox', x, 'Text')]))),
    api('saveLesson', ['id', gget('CUR')], ['duration_min', getp('TextBox', 'TxtDur', 'Text')], ['lang', gget('ED')], ['readAloudOnly', choose(getp('CheckBox', 'ChkRead', 'Checked'), 'true', 'false')],
      ...fields.map(([x, f]) => [f, getp('TextBox', x, 'Text')])))));
  b.push(ev('Button', 'BtnSubmit', 'Click', api('submit', ['id', gget('CUR')])));
  b.push(ev('Button', 'BtnApprove', 'Click', api('review', ['id', gget('CUR')], ['decision', 'approve'], ['comment', getp('TextBox', 'TxtComment', 'Text')])));
  b.push(ev('Button', 'BtnSendBack', 'Click', api('review', ['id', gget('CUR')], ['decision', 'sendback'], ['comment', getp('TextBox', 'TxtComment', 'Text')])));

  // ---- audio for the chosen language (ADM-5): record, listen, upload ----
  b.push(ev('Button', 'BtnRec', 'Click', iff(gget('RECORDING'), meth('SoundRecorder', 'SoundRecorder1', 'Stop'), seq(meth('SoundRecorder', 'SoundRecorder1', 'Start'), gset('RECORDING', true), callP('afterText')))));
  b.push(ev('SoundRecorder', 'SoundRecorder1', 'AfterSoundRecorded', seq(gset('REC', eget('sound')), gset('RECORDING', false), callP('afterText'))));
  b.push(ev('Button', 'BtnPlayRec', 'Click', iff(isEmpty(gget('REC')), say(t('adm_record_first')), seq(setp('Player', 'Player1', 'Source', gget('REC')), meth('Player', 'Player1', 'Start')))));
  b.push(ev('Button', 'BtnUpAudio', 'Click', iff(isEmpty(gget('REC')), say(t('adm_record_first')), callP('startUpload', 'audio', gget('REC')))));

  // ---- steps (pictures: camera or gallery; ADM-4) ----
  b.push(ev('Button', 'BtnSteps', 'Click', seq(gset('STEPNO', 1), callP('fillStep'), callP('showView', 'ArrStep'))));
  b.push(defP('fillStep', [], localS('steps', lk(gget('CURL'), 'steps', list()), localS('s', list(), seq(
    forEach('x', lget('steps'), iff(mcmp('EQ', lk(lget('x'), 'step_no', 0), gget('STEPNO')), lset('s', lget('x')))),
    setp('Label', 'LblStepHead', 'Text', join(t('adm_step'), ' ', gget('STEPNO'))),
    setp('TextBox', 'TxtSmr', 'Text', lk(lget('s'), 'text_mr')), setp('TextBox', 'TxtShi', 'Text', lk(lget('s'), 'text_hi')), setp('TextBox', 'TxtSen', 'Text', lk(lget('s'), 'text_en')),
    setp('Image', 'ImgStepPrev', 'Picture', lk(lget('s'), 'image_url')), gset('PHOTO', ''),
    setp('ListPicker', 'LpStep', 'Text', join(t('adm_steps'), ' (', len(lget('steps')), ')')))))));
  b.push(ev('ListPicker', 'LpStep', 'BeforePicking', localS('out', list(), seq(
    forEach('x', lk(gget('CURL'), 'steps', list()), addItem(lget('out'), join(t('adm_step'), ' ', lk(lget('x'), 'step_no'), ': ', lk(lget('x'), 'text_en')))),
    iff(mcmp('LT', len(lget('out')), 10), addItem(lget('out'), join('+ ', t('adm_step'), ' ', add(len(lget('out')), 1)))),
    setp('ListPicker', 'LpStep', 'Elements', lget('out'))))));
  b.push(ev('ListPicker', 'LpStep', 'AfterPicking', seq(gset('STEPNO', getp('ListPicker', 'LpStep', 'SelectionIndex')), callP('fillStep'))));
  b.push(ev('Button', 'BtnSaveStep', 'Click', api('saveStep', ['id', gget('CUR')], ['step_no', gget('STEPNO')],
    ['text_mr', getp('TextBox', 'TxtSmr', 'Text')], ['text_hi', getp('TextBox', 'TxtShi', 'Text')], ['text_en', getp('TextBox', 'TxtSen', 'Text')])));
  b.push(ev('Button', 'BtnDelStep', 'Click', seq(gset('CONFIRM', 'delete'),
    meth('Notifier', 'Notifier1', 'ShowChooseDialog', join(t('adm_delete_step'), ' ', gget('STEPNO'), '?'), t('adm_delete_step'), t('btn_yes'), t('btn_no'), false))));
  b.push(ev('Button', 'BtnCam', 'Click', meth('Camera', 'Camera1', 'TakePicture')));
  b.push(ev('Camera', 'Camera1', 'AfterPicture', seq(gset('PHOTO', eget('image')), setp('Image', 'ImgStepPrev', 'Picture', eget('image')))));
  b.push(ev('ImagePicker', 'PickGallery', 'AfterPicking', seq(gset('PHOTO', getp('ImagePicker', 'PickGallery', 'Selection')), setp('Image', 'ImgStepPrev', 'Picture', gget('PHOTO')))));
  b.push(ev('Button', 'BtnUpPhoto', 'Click', iff(isEmpty(gget('PHOTO')), say(t('adm_pick_photo')), callP('startUpload', 'image', gget('PHOTO')))));

  // ---- upload: file -> base64 (extension) -> uploadMedia -> Cloudinary; progress text + Retry on failure ----
  b.push(defP('startUpload', ['kind', 'file'], seq(gset('UPKIND', lget('kind')), gset('UPFILE', lget('file')), say(t('adm_uploading')), callP('toBase64', lget('file')))));
  // REPLACE the body of toBase64 with your Base64 extension's "encode file" block (setup/Day15_16_Guide.md, step 5).
  b.push(defP('toBase64', ['file'], say(t('adm_need_ext'))));
  b.push(defP('sendUpload', ['b64'], localS('parts', split(gget('UPFILE'), '.'), api('uploadMedia', ['id', gget('CUR')], ['kind', gget('UPKIND')],
    ['ext', downcase(sel(lget('parts'), len(lget('parts'))))], ['step_no', gget('STEPNO')], ['lang', gget('ED')], ['data', lget('b64')]))));

  // ---- quiz (5 questions in the chosen language) ----
  b.push(ev('Button', 'BtnQuiz', 'Click', seq(gset('QNO', 1), callP('fillQuiz'), callP('showView', 'ArrQuiz'))));
  b.push(defP('fillQuiz', [], localS('q', list(), seq(
    forEach('x', lk(gget('CURL'), 'quiz', list()), iff(and(eq(lk(lget('x'), 'lang'), gget('ED')), mcmp('EQ', lk(lget('x'), 'q_no', 0), gget('QNO'))), lset('q', lget('x')))),
    setp('ListPicker', 'LpQno', 'Text', join(t('adm_quiz'), ' · ', gget('ED'), ' · ', t('adm_question'), ' ', gget('QNO'), ' / 5')),
    setp('TextBox', 'TxtQ', 'Text', lk(lget('q'), 'question')),
    ['A', 'B', 'C', 'D'].map((x) => setp('TextBox', 'TxtQ' + x, 'Text', lk(lget('q'), x.toLowerCase()))),
    setp('ListPicker', 'LpCorrect', 'Selection', lk(lget('q'), 'correct')),
    setp('ListPicker', 'LpCorrect', 'Text', join(t('adm_correct'), ': ', lk(lget('q'), 'correct', '?'))),
    setp('TextBox', 'TxtQexp', 'Text', lk(lget('q'), 'explanation'))))));
  b.push(ev('ListPicker', 'LpQno', 'AfterPicking', seq(gset('QNO', getp('ListPicker', 'LpQno', 'SelectionIndex')), callP('fillQuiz'))));
  b.push(ev('ListPicker', 'LpCorrect', 'AfterPicking', setp('ListPicker', 'LpCorrect', 'Text', join(t('adm_correct'), ': ', getp('ListPicker', 'LpCorrect', 'Selection')))));
  b.push(ev('Button', 'BtnSaveQ', 'Click', api('saveQuiz', ['id', gget('CUR')], ['lang', gget('ED')], ['q_no', gget('QNO')], ['question', getp('TextBox', 'TxtQ', 'Text')],
    ...['A', 'B', 'C', 'D'].map((x) => [x.toLowerCase(), getp('TextBox', 'TxtQ' + x, 'Text')]), ['correct', getp('ListPicker', 'LpCorrect', 'Selection')], ['explanation', getp('TextBox', 'TxtQexp', 'Text')])));

  // ---- publish (Admin; confirm first), QR codes, App texts ----
  b.push(ev('Button', 'BtnPublish', 'Click', seq(gset('CONFIRM', 'publish'), meth('Notifier', 'Notifier1', 'ShowChooseDialog', t('adm_confirm_publish'), t('adm_publish'), t('btn_yes'), t('btn_no'), false))));
  b.push(ev('Notifier', 'Notifier1', 'AfterChoosing', iff(eq(eget('choice'), t('btn_yes')), ifs([
    [eq(gget('CONFIRM'), 'publish'), api('publish', ['note', 'Admin Mode'])],
    [eq(gget('CONFIRM'), 'delete'), api('saveStep', ['id', gget('CUR')], ['step_no', gget('STEPNO')], ['delete', 'true'])]]))));
  b.push(ev('Button', 'BtnQrOpen', 'Click', api('listQr')));
  b.push(ev('ListView', 'LvQr', 'AfterPicking', seq(gset('QRI', getp('ListView', 'LvQr', 'SelectionIndex')), localS('q', sel(gget('QRS'), gget('QRI')), seq(
    setp('Image', 'ImgQr', 'Picture', lk(lget('q'), 'qr_url')), setp('Label', 'LblQrId', 'Text', lk(lget('q'), 'id')),
    setp('TextBox', 'TxtPlace', 'Text', lk(lget('q'), 'poster_location')), setp('CheckBox', 'ChkPrinted', 'Checked', eq(lk(lget('q'), 'printed'), 'yes')))))));
  b.push(ev('Button', 'BtnSaveQr', 'Click', iff(not(isEmpty(getp('Label', 'LblQrId', 'Text'))), api('saveQr', ['id', getp('Label', 'LblQrId', 'Text')],
    ['poster_location', getp('TextBox', 'TxtPlace', 'Text')], ['printed', choose(getp('CheckBox', 'ChkPrinted', 'Checked'), 'yes', 'no')]))));
  b.push(ev('Button', 'BtnTextsOpen', 'Click', api('listStrings')));
  b.push(ev('ListView', 'LvTexts', 'AfterPicking', seq(gset('KEYI', getp('ListView', 'LvTexts', 'SelectionIndex')), localS('k', sel(gget('KEYS'), gget('KEYI')), seq(
    setp('Label', 'LblKey', 'Text', lk(lget('k'), 'key')), setp('TextBox', 'TxtTmr', 'Text', lk(lget('k'), 'mr')), setp('TextBox', 'TxtThi', 'Text', lk(lget('k'), 'hi')), setp('TextBox', 'TxtTen', 'Text', lk(lget('k'), 'en')))))));
  b.push(ev('Button', 'BtnSaveTxt', 'Click', iff(not(isEmpty(getp('Label', 'LblKey', 'Text'))), api('saveString', ['key', getp('Label', 'LblKey', 'Text')],
    ['mr', getp('TextBox', 'TxtTmr', 'Text')], ['hi', getp('TextBox', 'TxtThi', 'Text')], ['en', getp('TextBox', 'TxtTen', 'Text')]))));

  // ---- answers from the server ----
  const reload = seq(say(t('adm_saved')), api('getLesson', ['id', gget('CUR')]));
  b.push(defP('handle', [], ifs([
    [eq(gget('PENDING'), 'login'), seq(gset('TOKEN', lk(gget('RESP'), 'token')), gset('ROLE', lk(gget('RESP'), 'role')), gset('NAME', lk(gget('RESP'), 'name')),
      db('StoreValue', 'adm_token', gget('TOKEN')), db('StoreValue', 'adm_role', gget('ROLE')), db('StoreValue', 'adm_name', gget('NAME')),
      db('StoreValue', 'adm_expires', add(meth('Clock', 'Clock1', 'SystemTime'), 12 * 3600 * 1000)), setp('PasswordTextBox', 'PwdPass', 'Text', ''), callP('loadDash'))],
    [eq(gget('PENDING'), 'listLessons'), localS('names', list(), localS('c', lk(gget('RESP'), 'counts', list()), seq(
      gset('LESSONS', lk(gget('RESP'), 'lessons', list())), gset('MODS', lk(gget('RESP'), 'modules', list())), gset('IDS', list()),
      forEach('l', gget('LESSONS'), seq(addItem(gget('IDS'), lk(lget('l'), 'id')), addItem(lget('names'), join(lk(lget('l'), 'id'), ' · ', lk(lget('l'), 'status'), '\n', lk(lget('l'), 'title'),
        choose(mcmp('GT', lk(lget('l'), 'missing', 0), 0), join('  (', t('adm_missing'), ': ', lk(lget('l'), 'missing'), ')'), ''))))),
      setp('ListView', 'LvAdmLessons', 'Elements', lget('names')),
      setp('Label', 'LblCounts', 'Text', join(t('adm_live'), ': ', lk(lget('c'), 'live', 0), '   ', t('adm_to_review'), ': ', lk(lget('c'), 'review', 0), '   ', t('lbl_version'), ': ', lk(lget('c'), 'version', 0))),
      callP('showView', 'ArrDash'))))],
    [eq(gget('PENDING'), 'getLesson'), seq(gset('CURL', gget('RESP')), callP('fillEditor'),
      ifs([[eq(gget('VIEWA'), 'ArrStep'), callP('fillStep')], [eq(gget('VIEWA'), 'ArrQuiz'), callP('fillQuiz')]], callP('showView', 'ArrEdit')))],
    [eq(gget('PENDING'), 'saveLesson'), seq(gset('CUR', lk(gget('RESP'), 'id')), gset('VIEWA', 'ArrEdit'), reload)],
    [or(eq(gget('PENDING'), 'saveStep'), or(eq(gget('PENDING'), 'saveQuiz'), eq(gget('PENDING'), 'uploadMedia'))), reload],
    [or(eq(gget('PENDING'), 'submit'), eq(gget('PENDING'), 'review')), seq(say(lk(gget('RESP'), 'status')), api('getLesson', ['id', gget('CUR')]))],
    [eq(gget('PENDING'), 'publish'), seq(alert(join(t('adm_published'), ' ', lk(gget('RESP'), 'version'))), api('listLessons'))],
    [eq(gget('PENDING'), 'listQr'), localS('names', list(), seq(gset('QRS', lk(gget('RESP'), 'qr', list())),
      forEach('q', gget('QRS'), addItem(lget('names'), join(lk(lget('q'), 'id'), ' · ', lk(lget('q'), 'poster_location', '—'), ' · ', t('adm_printed'), ': ', lk(lget('q'), 'printed')))),
      setp('ListView', 'LvQr', 'Elements', lget('names')), callP('showView', 'ArrQr')))],
    [eq(gget('PENDING'), 'saveQr'), seq(say(t('adm_saved')), api('listQr'))],
    [eq(gget('PENDING'), 'listStrings'), localS('names', list(), seq(gset('KEYS', lk(gget('RESP'), 'strings', list())),
      forEach('k', gget('KEYS'), addItem(lget('names'), join(lk(lget('k'), 'key'), ': ', lk(lget('k'), 'en')))),
      setp('ListView', 'LvTexts', 'Elements', lget('names')), callP('showView', 'ArrTexts')))],
    [eq(gget('PENDING'), 'saveString'), seq(say(t('adm_saved')), api('listStrings'))],
  ])));
  // Back: step / quiz -> editor; editor / QR / texts -> dashboard; dashboard / login -> leave Admin Mode
  backBlocks(st, ifs([
    [or(eq(gget('VIEWA'), 'ArrStep'), eq(gget('VIEWA'), 'ArrQuiz')), seq(callP('fillEditor'), callP('showView', 'ArrEdit'))],
    [or(eq(gget('VIEWA'), 'ArrEdit'), or(eq(gget('VIEWA'), 'ArrQr'), eq(gget('VIEWA'), 'ArrTexts'))), api('listLessons')],
  ], closeScreen()));
  b.push(ev('Form', 'Admin', 'Initialize', callP('loadSettings')));
  return st;
}

// =====================================================================================
// Days 17-18 (admin build): read-aloud, lesson updates, Ask Saathi, Explain My Mistake
// =====================================================================================
const speakBtn = (name) => node('Button', name, '6', { Image: 'ic_speaker_k.png', Text: '', Width: '48', Height: '48' });
const findNode = (list, name) => { for (const c of list) { if (c.$Name === name) return c; const k = c.$Components && findNode(c.$Components, name); if (k) return k; } return null; };
const compRef = (type, name) => blk('component_component_block', `<field name="COMPONENT_SELECTOR">${name}</field>`, `<mutation component_type="${type}" instance_name="${name}"></mutation>`);
const decode = (v) => meth('Web', 'Web1', 'JsonTextDecode', v);
const escHtml = (x) => replaceAll(replaceAll(x, '&', '&amp;'), '<', '&lt;');
const fmt = (key, pairs) => pairs.reduce((acc, [k, v]) => replaceAll(acc, k, v), t(key));
// Form post to the backend "ask" action (Gemini free-tier backup, ASK-7)
const askPost = (kind, q) => seq(setp('Web', 'Web1', 'Url', apiUrl()),
  setp('Web', 'Web1', 'RequestHeaders', list(list('Content-Type', 'application/x-www-form-urlencoded'))),
  meth('Web', 'Web1', 'PostText', meth('Web', 'Web1', 'BuildRequestData', list(list('action', 'ask'), list('kind', kind), list('lang', gget('LANG')), list('q', q)))));
const personaFor = (lessonsBlock) => replaceAll(replaceAll(t('ai_persona'), '{lang}', t('ai_lang_name')), '{lessons}', lessonsBlock);

/** RAL-1..3: say(text) in the chosen language and speed; a missing voice gives the install help. */
function sayProcs(b) {
  b.push(defP('say', ['text'], seq(setp('TextToSpeech', 'TextToSpeech1', 'Language', gget('LANG')), setp('TextToSpeech', 'TextToSpeech1', 'Country', 'IND'),
    setp('TextToSpeech', 'TextToSpeech1', 'SpeechRate', choose(eq(dbGet('voice_speed', 'normal'), 'slow'), 0.8, 1.0)),
    meth('TextToSpeech', 'TextToSpeech1', 'Speak', lget('text')))));
  b.push(ev('TextToSpeech', 'TextToSpeech1', 'AfterSpeaking', iff(not(eq(eget('result'), true)), alert(join(t('ral_no_voice'), '\n\n', t('set_voice_help_text'))))));
}

function learnAdmin(st, b) {
  // speaker buttons on the intro, every step, the safety box and the mistakes box (RAL-1)
  findNode(st.comps, 'ArrIntro').$Components.push(speakBtn('BtnSayIntro'));
  findNode(st.comps, 'ArrStepBody').$Components.push(speakBtn('BtnSayStep'));
  findNode(st.comps, 'ArrSafety').$Components.push(speakBtn('BtnSaySafety'));
  findNode(st.comps, 'ArrMistakes').$Components.push(speakBtn('BtnSayMist'));
  st.comps.push(node('TextToSpeech', 'TextToSpeech1', '5', { Country: 'IND' }), node('Web', 'Web1', '4', {}));
  sayProcs(b);
  b.push(ev('Button', 'BtnSayIntro', 'Click', callP('say', join(getp('Label', 'LblBarTitle', 'Text'), '. ', getp('Label', 'LblDesc', 'Text'), '. ', getp('Label', 'LblObj', 'Text')))));
  b.push(ev('Button', 'BtnSayStep', 'Click', callP('say', getp('Label', 'LblStepText', 'Text'))));
  b.push(ev('Button', 'BtnSaySafety', 'Click', callP('say', join(t('lbl_safety'), '. ', getp('Label', 'LblSafety', 'Text')))));
  b.push(ev('Button', 'BtnSayMist', 'Click', callP('say', join(t('lbl_mistakes'), '. ', getp('Label', 'LblMistakes', 'Text')))));
  // UPD-6: unknown code -> usual message; if the phone is online and the code is in the published list -> "may be new"
  b.push(top(glob('NEWQ', '')));
  b.push(defP('checkNew', ['code'], iff(not(isEmpty(apiUrl())), seq(gset('NEWQ', lget('code')),
    setp('Web', 'Web1', 'Url', join(apiUrl(), '?action=getPublished')), meth('Web', 'Web1', 'Get')))));
  b.push(ev('Web', 'Web1', 'GotText', iff(eq(eget('responseCode'), 200), localS('R', decode(eget('responseContent')),
    iff(mcmp('GT', len(split(lk(lget('R'), 'lessons_csv', ''), join(gget('NEWQ'), ','))), 1), callP('showMsg', t('upd_may_be_new'), gget('NEWQ')))))));
}

function quizAdmin(st, b) {
  sayProcs(b);
  b.push(ev('Button', 'BtnSayQ', 'Click', callP('say', join(getp('Label', 'LblQuestion', 'Text'), '. ',
    getp('Button', 'BtnA', 'Text'), '. ', getp('Button', 'BtnB', 'Text'), '. ', getp('Button', 'BtnC', 'Text'), '. ', getp('Button', 'BtnD', 'Text')))));
  // Explain My Mistake (EXP-1): ChatBot online; Gemini backup; saved explanation stays visible offline (EXP-2)
  b.push(top(glob('WHYP', '')));
  b.push(ev('Button', 'BtnWhy', 'Click', localS('q', sel(gget('QROWS'), gget('QI')), localS('c', upcase(trim(sel(lget('q'), 9))), localS('w', sel(gget('ANS'), len(gget('ANS'))), seq(
    gset('WHYP', fmt('ai_why_prompt', [['{q}', sel(lget('q'), 4)], ['{w}', join(lget('w'), '. ', callF('optText', lget('q'), lget('w')))],
      ['{c}', join(lget('c'), '. ', callF('optText', lget('q'), lget('c')))], ['{lang}', t('ai_lang_name')]])),
    setp('Label', 'LblWhy', 'Text', t('ask_thinking')), vis('Label', 'LblWhy', true),
    setp('ChatBot', 'ChatBot1', 'System', personaFor('none')), meth('ChatBot', 'ChatBot1', 'ResetConversation'), meth('ChatBot', 'ChatBot1', 'Converse', gget('WHYP'))))))));
  b.push(ev('ChatBot', 'ChatBot1', 'GotResponse', setp('Label', 'LblWhy', 'Text', join(t('ask_ai_label'), '\n', eget('responseText')))));
  const offline = setp('Label', 'LblWhy', 'Text', t('quiz_why_offline'));
  b.push(ev('Form', 'Quiz', 'ErrorOccurred', ifs([
    [eq(eget('component'), compRef('ChatBot', 'ChatBot1')), iff(isEmpty(apiUrl()), offline, askPost('why', gget('WHYP')))],
    [eq(eget('component'), compRef('Web', 'Web1')), offline],
  ], alert(eget('message')))));
  b.push(ev('Web', 'Web1', 'GotText', iff(eq(eget('responseCode'), 200), localS('R', decode(eget('responseContent')),
    iff(eq(lk(lget('R'), 'ok', false), true), setp('Label', 'LblWhy', 'Text', join(t('ask_ai_label'), '\n', lk(lget('R'), 'answer'))), offline)), offline)));
}

function settingsAdmin(st, b) {
  ['CONFIRM'].forEach((g) => b.push(top(glob(g, ''))));
  ['PUB', 'TODO', 'NEWMAP'].forEach((g) => b.push(top(glob(g, list()))));
  b.push(top(glob('DI', 0)));
  const say2 = (txt) => setp('Label', 'LblUpd', 'Text', txt);
  b.push(defP('afterText2', [], seq(
    setp('Button', 'BtnVsSlow', 'Image', choose(eq(dbGet('voice_speed', 'normal'), 'slow'), vimg(st, 'BtnVsSlow', 'bg_btn_yellow.png'), vimg(st, 'BtnVsSlow', 'bg_btn_outline.png'))),
    setp('Button', 'BtnVsNormal', 'Image', choose(eq(dbGet('voice_speed', 'normal'), 'slow'), vimg(st, 'BtnVsNormal', 'bg_btn_outline.png'), vimg(st, 'BtnVsNormal', 'bg_btn_yellow.png'))),
    setp('Label', 'LblDl', 'Text', join(t('set_downloaded'), ': ', len(dbGet('dl_map', list())), ' · ', t('lbl_version'), ' ', dbGet('content_version', 0))))));
  b.push(ev('Button', 'BtnVsSlow', 'Click', seq(db('StoreValue', 'voice_speed', 'slow'), callP('afterText2'))));
  b.push(ev('Button', 'BtnVsNormal', 'Click', seq(db('StoreValue', 'voice_speed', 'normal'), callP('afterText2'))));
  // UPD-1/2: check -> compare content_version -> say how many lessons/files -> ask before downloading
  b.push(ev('Button', 'BtnCheckUpd', 'Click', iff(isEmpty(apiUrl()), say2(t('upd_no_server')),
    seq(say2(t('adm_wait')), setp('Web', 'Web1', 'Url', join(apiUrl(), '?action=getPublished')), meth('Web', 'Web1', 'Get')))));
  b.push(ev('Web', 'Web1', 'GotText', iff(neq(eget('responseCode'), 200), say2(t('upd_failed')), localS('R', decode(eget('responseContent')), ifs([
    [not(eq(lk(lget('R'), 'ok', false), true)), say2(t('upd_failed'))],
    [mcmp('LTE', lk(lget('R'), 'content_version', 0), dbGet('content_version', 0)), say2(t('upd_none'))],
  ], localS('have', list(), seq(gset('PUB', lget('R')), gset('TODO', list()),
    forEach('p', dbGet('dl_map', list()), addItem(lget('have'), sel(lget('p'), 1))),
    forEach('f', lk(lget('R'), 'files', list()), iff(not(isIn(lk(lget('f'), 'name'), lget('have'))), addItem(gget('TODO'), lget('f')))),   // UPD-3: skip files already on the phone
    say2(''), gset('CONFIRM', 'update'),
    meth('Notifier', 'Notifier1', 'ShowChooseDialog', fmt('upd_found', [['{n}', lk(lget('R'), 'lessons_count', 0)], ['{f}', len(gget('TODO'))]]), t('upd_check'), t('btn_yes'), t('btn_no'), false))))))));
  // UPD-3/4: download every file into the app's own storage first; switch content only when all arrived
  b.push(defP('startDownload', [], seq(gset('NEWMAP', list()), forEach('p', dbGet('dl_map', list()), addItem(gget('NEWMAP'), lget('p'))), gset('DI', 0), callP('nextFile'))));
  b.push(defP('nextFile', [], seq(gset('DI', add(gget('DI'), 1)), iff(mcmp('GT', gget('DI'), len(gget('TODO'))), callP('finishUpdate'), localS('f', sel(gget('TODO'), gget('DI')), seq(
    say2(fmt('upd_downloading', [['{i}', gget('DI')], ['{f}', len(gget('TODO'))]])),
    setp('Web', 'Web2', 'SaveResponse', true), setp('Web', 'Web2', 'ResponseFileName', lk(lget('f'), 'name')),
    setp('Web', 'Web2', 'Url', lk(lget('f'), 'url')), meth('Web', 'Web2', 'Get')))))));
  b.push(ev('Web', 'Web2', 'GotFile', iff(eq(eget('responseCode'), 200),
    seq(addItem(gget('NEWMAP'), list(lk(sel(gget('TODO'), gget('DI')), 'name'), eget('fileName'))), callP('nextFile')), say2(t('upd_failed')))));
  b.push(defP('finishUpdate', [], seq(
    db('StoreValue', 'pub_lessons_csv', lk(gget('PUB'), 'lessons_csv')), db('StoreValue', 'pub_quiz_csv', lk(gget('PUB'), 'quiz_csv')),
    db('StoreValue', 'pub_strings_csv', lk(gget('PUB'), 'strings_csv')), db('StoreValue', 'dl_map', gget('NEWMAP')),
    db('StoreValue', 'content_version', lk(gget('PUB'), 'content_version')),   // switch version last (UPD-4)
    say2(t('upd_done')), meth('File', 'FileStr', 'ReadFrom', '//strings.csv'))));
  // Clear downloaded lessons (PRD 10.15): files deleted, built-in lessons and scores stay
  b.push(ev('Button', 'BtnClearDl', 'Click', seq(gset('CONFIRM', 'clear'), meth('Notifier', 'Notifier1', 'ShowChooseDialog', t('confirm_clear_dl'), t('set_clear_dl'), t('btn_yes'), t('btn_no'), false))));
  b.push(defP('clearDownloads', [], seq(forEach('p', dbGet('dl_map', list()), meth('File', 'FileDel', 'Delete', sel(lget('p'), 2))),
    ['pub_lessons_csv', 'pub_quiz_csv', 'pub_strings_csv', 'dl_map', 'content_version'].map((k) => db('ClearTag', k)), say2(''), meth('File', 'FileStr', 'ReadFrom', '//strings.csv'))));
  // Reset my progress clears ONLY progress (scores, viewed, dates, continue) - not downloads, voice speed or the Admin session
  b.push(ev('Notifier', 'Notifier1', 'AfterChoosing', iff(eq(eget('choice'), t('btn_yes')), ifs([
    [eq(gget('CONFIRM'), 'reset'), forEach('tag', db('GetTags'), iff(or(isIn(sel(split(lget('tag'), '_'), 1), list('score', 'viewed', 'date')), isIn(lget('tag'), list('last_lesson', 'last_step'))), db('ClearTag', lget('tag'))))],
    [eq(gget('CONFIRM'), 'update'), callP('startDownload')],
    [eq(gget('CONFIRM'), 'clear'), callP('clearDownloads')],
  ]))));
  b.push(ev('Form', 'Settings', 'ErrorOccurred', iff(or(eq(eget('component'), compRef('Web', 'Web1')), eq(eget('component'), compRef('Web', 'Web2'))), say2(t('upd_failed')), alert(eget('message')))));
}

function homeAdmin(st, b) {
  b.push(defP('homeAdmin', [], localS('today', meth('Clock', 'Clock1', 'FormatDate', meth('Clock', 'Clock1', 'Now'), 'yyyy-MM-dd'), seq(
    setp('Button', 'BtnAsk', 'Text', join(t('ask_title'), '\n', 'AI · ', t('ask_needs_net'))), vis('Button', 'BtnUpd', false),
    iff(and(not(isEmpty(apiUrl())), neq(dbGet('last_check', ''), lget('today'))), seq(db('StoreValue', 'last_check', lget('today')),   // UPD-1: quietly once a day
      setp('Web', 'Web1', 'Url', join(apiUrl(), '?action=getPublished')), meth('Web', 'Web1', 'Get')))))));
  b.push(ev('Web', 'Web1', 'GotText', iff(eq(eget('responseCode'), 200), localS('R', decode(eget('responseContent')),
    iff(mcmp('GT', lk(lget('R'), 'content_version', 0), dbGet('content_version', 0)), vis('Button', 'BtnUpd', true))))));
  b.push(ev('Form', 'Home', 'ErrorOccurred', vis('Button', 'BtnUpd', false)));   // offline: no message on Home
  b.push(ev('Button', 'BtnUpd', 'Click', openScreen('Settings')));
  b.push(ev('Button', 'BtnAsk', 'Click', openScreen('Ask')));
}

/** Ask Saathi (AI-2, ASK-1..8): voice or text, construction-only persona, AI label, related lesson, offline message. */
function askScreen() {
  const st = screen('Ask', 'Ask Saathi');
  const BLUE = '&HFF2563EB';
  const barNode = bar(st, 'ask_title'); barNode.BackgroundColor = BLUE; findNode([barNode], 'ArrBarText').BackgroundColor = BLUE;
  const sug = (n) => B(st, 'BtnSug' + n, 'ask_q' + n, 14, { Image: 'bg_btn_outline.png', Width: '-1048', Height: '64' });
  st.comps = [
    barNode,
    VA('ArrAskBody', { Width: '-1092' }, [
      L(st, 'LblAiNote', 'ask_ai_label', 12, { bold: true, props: { TextColor: BLUE } }),
      L(st, 'LblChat', null, 16, { props: { HTMLFormat: 'True' } }),
      L(st, 'LblThinking', 'ask_thinking', 14, { bold: true, props: { TextColor: BLUE, Visible: 'False' } }),
      B(st, 'BtnRelated', null, 16, { Image: 'bg_btn_outline.png', Width: '-2', Height: '52', Visible: 'False' }),
      VA('ArrOffline', { Width: '-2', BackgroundColor: C.redL, Visible: 'False' }, [
        L(st, 'LblOffline', 'ask_offline', 16, { bold: true }), B(st, 'BtnToLessons', 'btn_start', 17, { Image: 'bg_btn_yellow.png', Width: '-2', Height: '52' })]),
      SP('SpAs1', 8, 10), L(st, 'LblSugHead', 'ask_suggested', 13, { bold: true, props: { TextColor: C.mut } }),
      HA('ArrSug1', { Width: '-2' }, [sug(1), SP('SpSg1', '-1004'), sug(2)]), SP('SpAs2', 8, 8),
      HA('ArrSug2', { Width: '-2' }, [sug(3), SP('SpSg2', '-1004'), sug(4)]), SP('SpAs3', 8, 12),
      HA('ArrAskIn', { Width: '-2', AlignVertical: '2' }, [
        node('TextBox', 'TxtAsk', '5', { FontSize: '16', FontTypeface: FONT, Width: '-1068', Height: '56', Hint: '[ask_placeholder]' }), SP('SpAi', '-1002'),
        B(st, 'BtnSend', 'ask_send', 16, { Image: 'bg_btn_ai.png', TextColor: C.w, Width: '-1030', Height: '56' })]),
      SP('SpAs4', 8, 8), B(st, 'BtnMic', 'ask_mic', 18, { Image: 'bg_btn_ai.png', TextColor: C.w, Width: '-2', Height: '64' }),
      SP('SpAs5', 8, 8), B(st, 'BtnNewChat', 'btn_new_chat', 16, { Image: 'bg_btn_outline.png', Width: '-2', Height: '52' }), SP('SpAs6', 8, 16),
    ]),
    node('ChatBot', 'ChatBot1', '1', {}), node('SpeechRecognizer', 'SpeechRecognizer1', '1', {}),
    node('TextToSpeech', 'TextToSpeech1', '5', { Country: 'IND' }), node('Web', 'Web1', '4', {}),
    ...nonVisible(),
  ];
  const b = st.blocks;
  b.push(top(glob('CHAT', '')), top(glob('LASTQ', '')), top(glob('REL', '')));
  common(st, { lessons: true, afterStrings: [setp('TextBox', 'TxtAsk', 'Hint', t('ask_placeholder'))] });
  sayProcs(b);
  b.push(defP('askQ', ['q'], localS('qq', trim(lget('q')), iff(not(isEmpty(lget('qq'))), localS('ls', '', seq(
    gset('LASTQ', lget('qq')), vis('VerticalArrangement', 'ArrOffline', false), vis('Button', 'BtnRelated', false), vis('Label', 'LblThinking', true),
    gset('CHAT', join(gget('CHAT'), '<p><b>', t('ask_you'), ':</b> ', escHtml(lget('qq')), '</p>')), setp('Label', 'LblChat', 'Text', gget('CHAT')), setp('TextBox', 'TxtAsk', 'Text', ''),
    forEach('row', gget('LES'), iff(and(mcmp('GTE', len(lget('row')), 4), eq(sel(lget('row'), 3), 'en')), lset('ls', join(lget('ls'), sel(lget('row'), 1), ' ', sel(lget('row'), 4), '; ')))),
    setp('ChatBot', 'ChatBot1', 'System', personaFor(lget('ls'))),    // ASK-2 persona (editable in the strings tab)
    meth('ChatBot', 'ChatBot1', 'Converse', lget('qq'))))))));
  // showAnswer: bubble with the AI label (ASK-5), "Open lesson" if the AI named a lesson that exists (ASK-3), spoken, logged without names (ASK-6)
  b.push(defP('showAnswer', ['text'], localS('parts', split(lget('text'), 'LESSON:'), localS('ans', trim(sel(lget('parts'), 1)), localS('log', dbGet('ai_log', list()), seq(
    vis('Label', 'LblThinking', false),
    gset('CHAT', join(gget('CHAT'), '<p><font color="#1E3A8A">', escHtml(lget('ans')), '<br><small>', t('ask_ai_label'), '</small></font></p>')), setp('Label', 'LblChat', 'Text', gget('CHAT')),
    iff(mcmp('GT', len(lget('parts')), 1), localS('id', upcase(sel(split(trim(sel(lget('parts'), 2)), ' '), 1)), iff(not(listEmpty(callF('rowFor', lget('id')))),
      seq(gset('REL', lget('id')), setp('Button', 'BtnRelated', 'Text', join(t('btn_open'), ' ', lget('id'))), vis('Button', 'BtnRelated', true))))),
    callP('say', lget('ans')),
    addItem(lget('log'), list(gget('LANG'), gget('LASTQ'), lget('ans'))), db('StoreValue', 'ai_log', lget('log'))))))));
  b.push(defP('showOffline', [], seq(vis('Label', 'LblThinking', false), vis('VerticalArrangement', 'ArrOffline', true))));
  b.push(ev('ChatBot', 'ChatBot1', 'GotResponse', callP('showAnswer', eget('responseText'))));
  // ASK-4 / ASK-7: ChatBot error (no internet or MIT free limit) -> Gemini backup through the script -> else offline message
  b.push(ev('Form', 'Ask', 'ErrorOccurred', ifs([
    [eq(eget('component'), compRef('ChatBot', 'ChatBot1')), iff(isEmpty(apiUrl()), callP('showOffline'), askPost('ask', gget('LASTQ')))],
    [or(eq(eget('component'), compRef('Web', 'Web1')), eq(eget('component'), compRef('SpeechRecognizer', 'SpeechRecognizer1'))), callP('showOffline')],
  ], alert(eget('message')))));
  b.push(ev('Web', 'Web1', 'GotText', iff(eq(eget('responseCode'), 200), localS('R', decode(eget('responseContent')),
    iff(eq(lk(lget('R'), 'ok', false), true), callP('showAnswer', lk(lget('R'), 'answer')), callP('showOffline'))), callP('showOffline'))));
  b.push(ev('Button', 'BtnSend', 'Click', callP('askQ', getp('TextBox', 'TxtAsk', 'Text'))));
  for (let n = 1; n <= 4; n++) b.push(ev('Button', 'BtnSug' + n, 'Click', callP('askQ', getp('Button', 'BtnSug' + n, 'Text'))));
  b.push(ev('Button', 'BtnMic', 'Click', seq(setp('SpeechRecognizer', 'SpeechRecognizer1', 'Language', choose(eq(gget('LANG'), 'mr'), 'mr-IN', choose(eq(gget('LANG'), 'hi'), 'hi-IN', 'en-IN'))),
    meth('SpeechRecognizer', 'SpeechRecognizer1', 'GetText'))));
  b.push(ev('SpeechRecognizer', 'SpeechRecognizer1', 'AfterGettingText', callP('askQ', eget('result'))));
  b.push(ev('Button', 'BtnNewChat', 'Click', seq(meth('ChatBot', 'ChatBot1', 'ResetConversation'), meth('TextToSpeech', 'TextToSpeech1', 'Stop'), gset('CHAT', ''),
    setp('Label', 'LblChat', 'Text', ''), vis('Button', 'BtnRelated', false), vis('VerticalArrangement', 'ArrOffline', false))));
  b.push(ev('Button', 'BtnRelated', 'Click', openWith('Learn', gget('REL'))));
  b.push(ev('Button', 'BtnToLessons', 'Click', openScreen('Learn')));
  b.push(ev('Form', 'Ask', 'Initialize', callP('loadSettings')));
  backBlocks(st, seq(meth('TextToSpeech', 'TextToSpeech1', 'Stop'), closeScreen()));
  return st;
}

// =====================================================================================
// Day 19 (admin build): smart revision (FR-17), Supervisor Mode (FR-18, SUP-1..4), Helmet Check (AI-4, HLM-1..5)
// =====================================================================================
const textLen = (x) => blk('text_length', V('VALUE', lit(x)));
const TRADES = ['trade_mason', 'trade_helper', 'trade_bar', 'trade_concrete', 'trade_other'];

/** weakest(): the lesson with the lowest best score below 3/5 ("" if none) - rule-based, labelled "Suggested for you", not AI. */
function revisionProcs(b) {
  b.push(top(glob('REVID', '')));
  b.push(defP('findRevision', [], localS('low', 3, seq(gset('REVID', ''),
    forEach('row', gget('LES'), iff(and(mcmp('GTE', len(lget('row')), 3), eq(sel(lget('row'), 3), 'en')), localS('sc', dbGet(join('score_', sel(lget('row'), 1)), ''),
      iff(and(not(isEmpty(lget('sc'))), mcmp('LT', lget('sc'), lget('low'))), seq(lset('low', lget('sc')), gset('REVID', sel(lget('row'), 1)))))))))));
  b.push(defF('revisionText', [], join(t('rev_suggest'), ': ', t('rev_repeat'), ' – ', sel(callF('rowFor', gget('REVID')), 4), ' (', dbGet(join('score_', gget('REVID')), 0), '/5)')));
}

function homeAdmin19(st, b) {
  revisionProcs(b);
  // Safety Check tile (HOM-2): AI (blue), camera; hidden on phones where Helmet Check failed (HLM-5)
  b.push(defP('homeAdmin19', [], seq(
    setp('Button', 'BtnSafety', 'Text', join(t('safety_check'), '\n', 'AI · ', t('lbl_camera'))),
    vis('Button', 'BtnSafety', neq(dbGet('helmet_supported', 'yes'), 'no')),
    callP('findRevision'), vis('Button', 'BtnRevise', not(isEmpty(gget('REVID')))),
    iff(not(isEmpty(gget('REVID'))), setp('Button', 'BtnRevise', 'Text', callF('revisionText'))))));
  b.push(ev('Button', 'BtnSafety', 'Click', openScreen('Safety')));
  b.push(ev('Button', 'BtnRevise', 'Click', openWith('Learn', gget('REVID'))));
}

const supCard = (name, kids) => VA(name, { Width: '-2', BackgroundColor: C.card }, [SP(name + 'T', 8, 14), padRow(name, kids), SP(name + 'B', 8, 16)]);
function skillsAdmin(st, b) {
  // ---- components: smart revision row + Supervisor PIN page + Supervisor page ----
  findNode(st.comps, 'ArrSkBody').$Components.splice(2, 0,
    B(st, 'BtnRevSk', null, 15, { Image: 'bg_btn_yellow.png', Width: '-2', Height: '64', Visible: 'False' }));
  st.comps.splice(2, 0,
    VA('ArrSupPin', { Width: '-1092', Visible: 'False', AlignHorizontal: '3' }, [SP('SpP0', 8, 24),
      supCard('CrdPin', [VA('ArrPinC', { Width: '-2', AlignHorizontal: '3' }, [IMG('ImgPinLock', 'ic_lock_k.png', 48, 48), SP('SpP1', 8, 8),
        L(st, 'LblPinHead', null, 19, { bold: true, props: { TextAlignment: '1' } }), SP('SpP2', 8, 10),
        node('PasswordTextBox', 'PwdPin', '4', { FontSize: '28', Width: '-1050', NumbersOnly: 'True', Hint: '••••', TextAlignment: '1' }), SP('SpP3', 8, 6),
        L(st, 'LblPinMsg', null, 15, { bold: true, props: { TextColor: C.red, TextAlignment: '1' } })])]),
      SP('SpP4', 8, 14),
      B(st, 'BtnPinOk', 'btn_next', 18, { Image: 'bg_btn_yellow.png', Width: '-2', Height: '56' })]),
    VA('ArrSup', { Width: '-1092', Visible: 'False' }, [SP('SpS0', 8, 12),
      supCard('CrdSupTable', [L(st, 'LblSupTable', null, 16, { props: { HTMLFormat: 'True' } })]), SP('SpS1', 8, 12),
      supCard('CrdAddW', [
      L(st, 'LblAddHead', 'btn_add_worker', 16, { bold: true }),
      node('TextBox', 'TxtWName', '5', { FontSize: '16', FontTypeface: FONT, Width: '-2', Hint: '[sup_name]' }),
      (st.texts.push({ type: 'ListPicker', name: 'LpTrade', key: 'sup_trade', size: 16 }), 0) || node('ListPicker', 'LpTrade', '9', { Text: '[sup_trade]', FontSize: '16', FontTypeface: FONTB, FontBold: 'True', Image: 'bg_btn_outline.png', Width: '-2', Height: '52' }),
      L(st, 'LblNoIds', 'sup_no_ids', 13, { props: { TextColor: C.mut } }), SP('SpS1b', 8, 6),
      B(st, 'BtnAddW', 'btn_add_worker', 17, { Image: 'bg_btn_outline.png', Width: '-2', Height: '52' })]), SP('SpS2', 8, 14),
      B(st, 'BtnShareSum', 'btn_share', 17, { Image: 'bg_btn_yellow.png', Width: '-2', Height: '56' }), SP('SpS3', 8, 10),
      B(st, 'BtnSupLock', 'sup_lock', 16, { Image: 'bg_btn_outline.png', Width: '-2', Height: '52' }), SP('SpS4', 8, 16)]));
  st.comps.push(node('Sharing', 'Sharing1', '1', {}), node('Clock', 'Clock1', '3', { TimerEnabled: 'False' }));
  revisionProcs(b);
  b.push(top(glob('TRADEKEY', 'trade_other')));
  const view = (body, pin, sup) => seq(vis('VerticalArrangement', 'ArrSkBody', body), vis('VerticalArrangement', 'ArrSupPin', pin), vis('VerticalArrangement', 'ArrSup', sup));
  b.push(defP('skillsStart', [], seq(callP('findRevision'), vis('Button', 'BtnRevSk', not(isEmpty(gget('REVID')))),
    iff(not(isEmpty(gget('REVID'))), setp('Button', 'BtnRevSk', 'Text', callF('revisionText'))),
    iff(eq(startValue(), '#sup'), callP('showPin')))));
  b.push(ev('Button', 'BtnRevSk', 'Click', openWith('Learn', gget('REVID'))));
  // ---- SUP-1: PIN set on first use; 5 wrong tries -> wait 1 minute ----
  b.push(defP('showPin', [], seq(view(false, true, false), setp('PasswordTextBox', 'PwdPin', 'Text', ''), setp('Label', 'LblPinMsg', 'Text', ''),
    setp('Label', 'LblBarTitle', 'Text', t('sup_title')), setp('Label', 'LblPinHead', 'Text', choose(isEmpty(dbGet('sup_pin', '')), t('sup_pin_set'), t('sup_enter_pin'))))));
  const now = meth('Clock', 'Clock1', 'SystemTime');
  b.push(ev('Button', 'BtnPinOk', 'Click', localS('pin', trim(getp('PasswordTextBox', 'PwdPin', 'Text')), ifs([
    [mcmp('LT', now, dbGet('sup_lock_until', 0)), setp('Label', 'LblPinMsg', 'Text', t('sup_locked'))],
    [isEmpty(dbGet('sup_pin', '')), iff(mcmp('EQ', textLen(lget('pin')), 4), seq(db('StoreValue', 'sup_pin', lget('pin')), callP('showSup')), setp('Label', 'LblPinMsg', 'Text', t('sup_pin_set')))],
    [eq(lget('pin'), dbGet('sup_pin', '')), seq(db('StoreValue', 'sup_fails', 0), callP('showSup'))],
  ], localS('n', add(dbGet('sup_fails', 0), 1), iff(mcmp('GTE', lget('n'), 5),
    seq(db('StoreValue', 'sup_fails', 0), db('StoreValue', 'sup_lock_until', add(meth('Clock', 'Clock1', 'SystemTime'), 60000)), setp('Label', 'LblPinMsg', 'Text', t('sup_locked'))),
    seq(db('StoreValue', 'sup_fails', lget('n')), setp('Label', 'LblPinMsg', 'Text', replaceAll(t('sup_pin_wrong'), '{n}', sub(5, lget('n')))))))))));
  // ---- SUP-4: workers x lessons table (first name + trade only) ----
  b.push(defF('workerLine', ['w', 'html'], localE('s', join(choose(lget('html'), '<b>', ''), sel(lget('w'), 2), choose(lget('html'), '</b>', ''), ' (', t(sel(lget('w'), 3)), '): '), doReturn(
    forEach('row', gget('LES'), iff(and(mcmp('GTE', len(lget('row')), 3), eq(sel(lget('row'), 3), 'en')), localS('sc', dbGet(join('w_', sel(lget('w'), 1), '_score_', sel(lget('row'), 1)), ''),
      lset('s', join(lget('s'), sel(split(sel(lget('row'), 1), '-'), 2), ' ', choose(isEmpty(lget('sc')), '–', join(lget('sc'), '/5')), '  '))))),
    lget('s')))));
  b.push(defP('showSup', [], localS('html', '', seq(view(false, false, true), setp('Label', 'LblBarTitle', 'Text', t('sup_title')),
    forEach('w', dbGet('workers', list()), lset('html', join(lget('html'), callF('workerLine', lget('w'), true), '<br>'))),
    setp('Label', 'LblSupTable', 'Text', join('<b>', t('sup_workers'), ': ', len(dbGet('workers', list())), '</b><br><br>', lget('html'))),
    setp('TextBox', 'TxtWName', 'Hint', t('sup_name')), setp('ListPicker', 'LpTrade', 'Text', join(t('sup_trade'), ': ', t(gget('TRADEKEY'))))))));
  b.push(ev('ListPicker', 'LpTrade', 'BeforePicking', setp('ListPicker', 'LpTrade', 'Elements', list(...TRADES.map((k) => t(k))))));
  b.push(ev('ListPicker', 'LpTrade', 'AfterPicking', seq(gset('TRADEKEY', sel(list(...TRADES), getp('ListPicker', 'LpTrade', 'SelectionIndex'))),
    setp('ListPicker', 'LpTrade', 'Text', join(t('sup_trade'), ': ', t(gget('TRADEKEY')))))));
  // SUP-2: first word of the name only, no numbers stored; stable worker IDs so scores stay right
  b.push(ev('Button', 'BtnAddW', 'Click', localS('nm', trim(getp('TextBox', 'TxtWName', 'Text')), iff(not(isEmpty(lget('nm'))), localS('ws', dbGet('workers', list()), localS('id', add(dbGet('w_next', 0), 1), seq(
    addItem(lget('ws'), list(lget('id'), sel(split(lget('nm'), ' '), 1), gget('TRADEKEY'))), db('StoreValue', 'workers', lget('ws')), db('StoreValue', 'w_next', lget('id')),
    setp('TextBox', 'TxtWName', 'Text', ''), callP('showSup'))))))));
  b.push(ev('Button', 'BtnShareSum', 'Click', localS('txt', join(t('sup_summary'), ' · ', meth('Clock', 'Clock1', 'FormatDate', meth('Clock', 'Clock1', 'Now'), 'dd-MM-yyyy'), '\n'), seq(
    forEach('w', dbGet('workers', list()), lset('txt', join(lget('txt'), callF('workerLine', lget('w'), false), '\n'))),
    meth('Sharing', 'Sharing1', 'ShareMessage', lget('txt'))))));
  b.push(ev('Button', 'BtnSupLock', 'Click', seq(view(true, false, false), setp('Label', 'LblBarTitle', 'Text', t('btn_skills')))));
}

/** SUP-3: "Who is learning?" before a lesson, only when workers exist; Quiz saves the score for that worker too. */
function learnAdmin19(st, b) {
  st.comps.push(node('ListPicker', 'LpWho', '9', { Text: '', Visible: 'False', Title: '[who_learning]' }));
  b.push(defP('askWho', [], iff(not(listEmpty(dbGet('workers', list()))), localS('names', list(), seq(
    forEach('w', dbGet('workers', list()), addItem(lget('names'), join(sel(lget('w'), 2), ' (', t(sel(lget('w'), 3)), ')'))), addItem(lget('names'), t('sup_myself')),
    setp('ListPicker', 'LpWho', 'Elements', lget('names')), setp('ListPicker', 'LpWho', 'Title', t('who_learning')), meth('ListPicker', 'LpWho', 'Open'))))));
  b.push(ev('ListPicker', 'LpWho', 'AfterPicking', localS('i', getp('ListPicker', 'LpWho', 'SelectionIndex'), iff(mcmp('LTE', lget('i'), len(dbGet('workers', list()))),
    db('StoreValue', 'cur_worker', sel(sel(dbGet('workers', list()), lget('i')), 1)), db('ClearTag', 'cur_worker')))));
}

/** Helmet Check (AI-4): photo -> on-device model -> result + confidence + disclaimer; photo never leaves the phone (HLM-2). */
function safetyScreen() {
  const st = screen('Safety', 'Helmet Check');
  const BLUE = '&HFF2563EB';
  const barNode = bar(st, 'safety_check'); barNode.BackgroundColor = BLUE; findNode([barNode], 'ArrBarText').BackgroundColor = BLUE;
  st.comps = [
    barNode,
    VA('ArrSafBody', { Width: '-1092', AlignHorizontal: '3' }, [SP('SpH0', 8, 12),
      IMG('ImgPhoto', '', '-2', 280),
      B(st, 'BtnTakePhoto', 'btn_take_photo', 18, { Image: 'bg_btn_ai.png', TextColor: C.w, Width: '-2', Height: '56' }), SP('SpH1', 8, 10),
      L(st, 'LblHelmetOk', 'helmet_ok', 18, { bold: true, props: { Visible: 'False', BackgroundColor: '&HFFE7F5EC', TextColor: '&HFF0F7A37' } }),
      L(st, 'LblHelmetNo', 'helmet_no', 18, { bold: true, props: { Visible: 'False', BackgroundColor: C.redL, TextColor: C.red } }),
      L(st, 'LblConf', null, 14, { props: { TextColor: C.mut } }),
      L(st, 'LblSafMsg', null, 14, { bold: true, props: { Visible: 'False' } }),
      L(st, 'LblDiscl', 'helmet_disclaimer', 14, { bold: true, props: { BackgroundColor: '&HFFF4F2EE' } }),
      L(st, 'LblStays', 'helmet_photo_stays', 12, { props: { TextColor: C.mut } }), SP('SpH2', 8, 10),
      B(st, 'BtnSafLesson', null, 16, { Image: 'bg_btn_outline.png', Width: '-2', Height: '52' }), SP('SpH3', 8, 16)]),
    node('Camera', 'Camera1', '3', {}),
    ...nonVisible(),
  ];
  const b = st.blocks;
  common(st, { lessons: true, afterStrings: [setp('Button', 'BtnSafLesson', 'Text', join(t('btn_open'), ' SS-SAF-01 · ', t('mod_saf')))] });
  b.push(ev('Button', 'BtnTakePhoto', 'Click', meth('Camera', 'Camera1', 'TakePicture')));
  b.push(ev('Camera', 'Camera1', 'AfterPicture', seq(setp('Image', 'ImgPhoto', 'Picture', eget('image')),
    vis('Label', 'LblHelmetOk', false), vis('Label', 'LblHelmetNo', false), setp('Label', 'LblConf', 'Text', ''), callP('classify', eget('image')))));
  // REPLACE the body of classify with: call PersonalImageClassifier1.ClassifyImageData(image)  (setup/Day19_20_Guide.md, Part A)
  b.push(defP('classify', ['image'], seq(setp('Label', 'LblSafMsg', 'Text', t('helmet_need_ext')), vis('Label', 'LblSafMsg', true))));
  // Call showHelmet(result) from PersonalImageClassifier1.GotClassification: result = list of [label, confidence]
  b.push(defP('showHelmet', ['result'], localS('topL', '', localS('topC', -1, seq(
    forEach('p', lget('result'), iff(mcmp('GT', sel(lget('p'), 2), lget('topC')), seq(lset('topL', sel(lget('p'), 1)), lset('topC', sel(lget('p'), 2))))),
    localS('isNo', mcmp('GT', len(split(downcase(lget('topL')), 'no')), 1), seq(
      vis('Label', 'LblSafMsg', false), vis('Label', 'LblHelmetNo', lget('isNo')), vis('Label', 'LblHelmetOk', not(lget('isNo'))),
      setp('Label', 'LblConf', 'Text', join(t('lbl_confidence'), ': ', round(mul(lget('topC'), 100)), '%')))))))));
  // HLM-5: a classifier error means this phone is not supported -> the Home tile is hidden from now on
  // The PIC extension reports problems in its own Error event: put ONE block there -> call helmetUnsupported (Day19_20_Guide Part A)
  b.push(defP('helmetUnsupported', [], seq(db('StoreValue', 'helmet_supported', 'no'), alert(t('helmet_not_supported')))));
  b.push(ev('Form', 'Safety', 'ErrorOccurred', iff(not(eq(eget('component'), compRef('Camera', 'Camera1'))),
    callP('helmetUnsupported'), alert(eget('message')))));
  b.push(ev('Button', 'BtnSafLesson', 'Click', openWith('Learn', 'SS-SAF-01')));
  b.push(ev('Form', 'Safety', 'Initialize', callP('loadSettings')));
  backBlocks(st, closeScreen());
  return st;
}

// =====================================================================================
// Placeholders: Ask + Safety (v1.1, Days 18-19)
// =====================================================================================
function placeholder(name, titleKey) {
  const st = screen(name, name);
  st.comps = [bar(st, titleKey), SP('SpP', 8, 40), L(st, 'LblSoon', 'coming_soon', 18, { bold: true, props: { TextAlignment: '1', Width: '-1090' } }), ...nonVisible()];
  common(st);
  st.blocks.push(ev('Form', name, 'Initialize', callP('loadSettings')));
  backBlocks(st, closeScreen());
  return st;
}

// =====================================================================================
// Write the .aia
// =====================================================================================
const screens = ADMIN
  ? [screen1(), home(), learn(), quiz(), skills(), askScreen(), safetyScreen(), settings(), admin()]
  : [screen1(), home(), learn(), quiz(), scan(), skills(), placeholder('Ask', 'ask_title'), placeholder('Safety', 'safety_check'), settings()];
const asciiJSON = (o) => JSON.stringify(o).replace(/[\u007f-￿]/g, (ch) => '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0'));

function checkXml(xml, where) {   // tag balance check (catches DSL mistakes before App Inventor does)
  const stack = []; const re = /<(\/?)([a-zA-Z_][\w-]*)([^>]*?)(\/?)>/g; let m;
  while ((m = re.exec(xml))) { if (m[4]) continue; if (!m[1]) stack.push(m[2]); else if (stack.pop() !== m[2]) throw new Error(`XML mismatch in ${where} near ${m.index}`); }
  if (stack.length) throw new Error(`Unclosed tags in ${where}: ${stack.join(',')}`);
}

const entries = [];
for (const st of screens) {
  fitRows(st.comps); applyVariants(st.comps);
  if (st.applyLabels) st.blocks = st.blocks.map((x) => (x === '__APPLY_LABELS__' ? st.applyLabels() : x));
  st.blocks.push(...pressBlocks(st));
  st.props.$Components = st.comps;
  entries.push([PKG_DIR + st.name + '.scm', Buffer.from('#|\n$JSON\n' + asciiJSON({ authURL: ['ai2.appinventor.mit.edu'], YaVersion: '208', Source: 'Form', Properties: st.props }) + '\n|#')]);
  const xml = `<xml xmlns="http://www.w3.org/1999/xhtml">${st.blocks.join('')}<yacodeblocks ya-version="208" language-version="33"></yacodeblocks></xml>`;
  checkXml(xml, st.name);
  entries.push([PKG_DIR + st.name + '.bky', Buffer.from(xml)]);
}
entries.unshift(['youngandroidproject/project.properties', Buffer.from([
  '#', `main=appinventor.ai_sitesaathi.SITE_SAATHI.Screen1`, 'name=SITE_SAATHI', 'assets=../assets', 'source=../src', 'build=../build',
  `versioncode=${VERSION_CODE}`, `versionname=${VERSION_NAME}`, 'useslocation=False', 'aname=SITE_SAATHI', 'sizing=Responsive', ...(ADMIN ? ['defaultfilescope=App'] : []),
  'theme=AppTheme.Light.DarkActionBar', 'color.primary=&HFF1B1F24', 'color.primary.dark=&HFF000000', 'color.accent=&HFFFFC21A', ''].join('\n'))]);

// Media: only what the app uses (keeps the APK small, PRD 10.15 < 30 MB)
const media = ['logo_yellow_512.png', 'app_icon_512.png'].map((f) => [f, path.join(ROOT, 'brand', f)])
  .concat(['font_deva.ttf', 'font_deva_bold.ttf'].map((f) => [f, path.join(ROOT, 'brand', 'fonts', f)]))
  .concat(['lessons.csv', 'quiz.csv', 'strings.csv'].map((f) => [f, path.join(ROOT, 'content', 'sheet', f)]))
  .concat(fs.readdirSync(path.join(ROOT, 'media')).filter((f) => /^(SS-.*\.jpg|tile_.*\.png|bg_btn_(yellow|outline|danger|charcoal|ai)(_h|_t)?(_p)?\.png|ic_(speaker|lock)_k\.png|bg_card_continue(_p)?\.png|ic_(back|restart)_w\.png|btn_(play|pause)\.png|bg_opt(_right|_wrong)?(_p)?\.png|bg_scan_big(_p)?\.png|icon_mod_\w+\.png)$/.test(f)).map((f) => [f, path.join(ROOT, 'media', f)]))
  // Recorded lesson audio (Day 8): put SS-MAS-01_mr.mp3 etc. in media/audio/ and rebuild. Missing files -> "audio not recorded yet" message.
  .concat(fs.existsSync(path.join(ROOT, 'media', 'audio')) ? fs.readdirSync(path.join(ROOT, 'media', 'audio')).filter((f) => /^SS-[A-Z]{3}-\d{2}_(mr|hi|en)\.(mp3|m4a)$/.test(f)).map((f) => [f, path.join(ROOT, 'media', 'audio', f)]) : []);
for (const [name, file] of media) entries.push(['assets/' + name, fs.readFileSync(file)]);

function zip(list) {
  const locals = [], centrals = []; let offset = 0;
  for (const [name, data] of list) {
    const nb = Buffer.from(name), cd = zlib.deflateRawSync(data), crc = zlib.crc32(data) >>> 0;
    const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x0800, 6); lh.writeUInt16LE(8, 8); lh.writeUInt16LE(0x21, 12);
    lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(cd.length, 18); lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(nb.length, 26);
    const ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0x0800, 8); ch.writeUInt16LE(8, 10); ch.writeUInt16LE(0x21, 14);
    ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(cd.length, 20); ch.writeUInt32LE(data.length, 24); ch.writeUInt16LE(nb.length, 28); ch.writeUInt32LE(offset, 42);
    locals.push(lh, nb, cd); centrals.push(ch, nb); offset += 30 + nb.length + cd.length;
  }
  const cdb = Buffer.concat(centrals), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(list.length, 8); end.writeUInt16LE(list.length, 10); end.writeUInt32LE(cdb.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cdb, end]);
}
const out = path.join(ROOT, 'app-inventor', ADMIN ? 'SITE_SAATHI_admin.aia' : 'SITE_SAATHI.aia');
const aia = zip(entries);
fs.writeFileSync(out, aia);
const blocksCount = screens.map((s) => `${s.name}:${(s.blocks.join('').match(/<block /g) || []).length}`).join(' ');
console.log(`${path.basename(out)} v${VERSION_NAME}: ${screens.length} screens, ${media.length} media files, ${(aia.length / 1024).toFixed(0)} KB`);
console.log('blocks per screen ->', blocksCount);
