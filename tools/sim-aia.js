// SITE SAATHI - tiny simulator for the App Inventor blocks used in this project.
// It runs the real .bky blocks of a screen against the real CSV assets, so the Day 9-10 logic can be
// checked on the laptop before testing on the phone. Not a full App Inventor: only the blocks this project uses.
// Usage: node tools/sim-aia.js     (runs the scenario tests at the bottom)
'use strict';
const fs = require('fs');
const zlib = require('zlib');
const AIA = process.argv.slice(2).find((a) => !a.startsWith('--')) || 'app-inventor/SITE_SAATHI.aia';

// ---------- unzip ----------
const zb = fs.readFileSync(AIA); const FILES = {}; let o = 0;
while (zb.readUInt32LE(o) === 0x04034b50) { const cs = zb.readUInt32LE(o + 18), nl = zb.readUInt16LE(o + 26), name = zb.slice(o + 30, o + 30 + nl).toString(); FILES[name] = zlib.inflateRawSync(zb.slice(o + 30 + nl, o + 30 + nl + cs)); o += 30 + nl + cs; }
const fileOf = (suffix) => FILES[Object.keys(FILES).find((k) => k.endsWith(suffix))];

// ---------- minimal XML parser ----------
function parseXml(s) {
  const root = { tag: '#root', attrs: {}, kids: [], text: '' }; const stack = [root]; const re = /<(\/?)([\w:-]+)((?:\s+[\w:-]+="[^"]*")*)\s*(\/?)>|([^<]+)/g; let m;
  const un = (x) => x.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  while ((m = re.exec(s))) {
    if (m[5] !== undefined) { stack[stack.length - 1].text += un(m[5]); continue; }
    if (m[1]) { stack.pop(); continue; }
    const attrs = {}; for (const a of m[3].matchAll(/([\w:-]+)="([^"]*)"/g)) attrs[a[1]] = un(a[2]);
    const n = { tag: m[2], attrs, kids: [], text: '' }; stack[stack.length - 1].kids.push(n); if (!m[4]) stack.push(n);
  }
  return root;
}
const kid = (n, tag, name) => n.kids.find((k) => k.tag === tag && (name === undefined || k.attrs.name === name));
const field = (b, name) => { const f = kid(b, 'field', name); return f ? f.text : undefined; };
const valueBlock = (b, name) => { const v = kid(b, 'value', name); return v && kid(v, 'block'); };
const stmtBlock = (b, name) => { const s = kid(b, 'statement', name); return s && kid(s, 'block'); };
const mut = (b) => kid(b, 'mutation') || { attrs: {}, kids: [] };

// ---------- CSV like App Inventor's "list from csv table" ----------
function csvTable(text) { const rows = []; let r = [], f = '', q = false; for (let i = 0; i < text.length; i++) { const c = text[i]; if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; } else if (c === '"') q = true; else if (c === ',') { r.push(f); f = ''; } else if (c === '\n') { r.push(f); rows.push(r); r = []; f = ''; } else if (c !== '\r') f += c; } if (f || r.length) { r.push(f); rows.push(r); } return rows; }
const isNum = (x) => typeof x === 'number' || (typeof x === 'string' && x.trim() !== '' && !isNaN(Number(x)));
const aiEq = (a, b) => (Array.isArray(a) || Array.isArray(b) ? JSON.stringify(a) === JSON.stringify(b) : isNum(a) && isNum(b) ? Number(a) === Number(b) : String(a) === String(b));
const str = (x) => (Array.isArray(x) ? '(' + x.map(str).join(' ') + ')' : typeof x === 'boolean' ? (x ? 'true' : 'false') : String(x));

// ---------- screen runtime ----------
class Screen {
  constructor(name, app, startValue = '') {
    this.name = name; this.app = app; this.startValue = startValue; this.log = [];
    const scm = JSON.parse(fileOf(`/${name}.scm`).toString().split('\n')[2]);
    this.comps = {}; (function walk(c, self) { self.comps[c.$Name] = { $Type: c.$Type, ...c }; (c.$Components || []).forEach((k) => walk(k, self)); })(scm.Properties, this);
    const xml = parseXml(fileOf(`/${name}.bky`).toString());
    const tops = kid(xml, 'xml').kids.filter((k) => k.tag === 'block');
    this.globals = {}; this.procs = {}; this.events = {};
    for (const b of tops) {
      const t = b.attrs.type;
      if (t === 'global_declaration') this.globals[field(b, 'NAME')] = undefined, this.pendingGlobals = (this.pendingGlobals || []).concat([b]);
      else if (t.startsWith('procedures_def')) this.procs[field(b, 'NAME')] = b;
      else if (t === 'component_event') this.events[mut(b).attrs.instance_name + '.' + mut(b).attrs.event_name] = b;
    }
    for (const g of this.pendingGlobals || []) this.globals[field(g, 'NAME')] = this.val(valueBlock(g, 'VALUE'), []);
    this.queue = [];
  }
  fire(evName, params = {}) { const b = this.events[evName]; if (!b) return false; this.run(stmtBlock(b, 'DO'), [params]); this.flush(); return true; }
  flush() { while (this.queue.length) { const f = this.queue.shift(); f(); } }
  lookup(scopes, n) { for (let i = scopes.length - 1; i >= 0; i--) if (n in scopes[i]) return scopes[i]; throw new Error(`${this.name}: unknown variable ${n}`); }
  run(b, scopes) {
    for (; b; b = (() => { const nx = kid(b, 'next'); return nx && kid(nx, 'block'); })()) this.exec(b, scopes);
  }
  exec(b, sc) {
    const t = b.attrs.type, v = (n) => this.val(valueBlock(b, n), sc);
    switch (t) {
      case 'lexical_variable_set': { const n = field(b, 'VAR'); if (n.startsWith('global ')) this.globals[n.slice(7)] = v('VALUE'); else this.lookup(sc, n)[n] = v('VALUE'); return; }
      case 'component_set_get': { const m = mut(b).attrs; this.comps[m.instance_name][m.property_name] = v('VALUE'); return; }
      case 'component_method': this.method(b, sc); return;
      case 'controls_if': { const nIf = 1 + Number(mut(b).attrs.elseif || 0); for (let i = 0; i < nIf; i++) if (v('IF' + i) === true) return this.run(stmtBlock(b, 'DO' + i), sc); if (mut(b).attrs.else) this.run(stmtBlock(b, 'ELSE'), sc); return; }
      case 'controls_forEach': { const list = v('LIST'); for (const item of [...list]) this.run(stmtBlock(b, 'DO'), sc.concat([{ [field(b, 'VAR')]: item }])); return; }
      case 'local_declaration_statement': return this.run(stmtBlock(b, 'STACK'), sc.concat([{ [field(b, 'VAR0')]: v('DECL0') }]));
      case 'lists_add_items': v('LIST').push(v('ITEM0')); return;
      case 'procedures_callnoreturn': return void this.call(b, sc);
      case 'controls_openAnotherScreen': this.app.open(v('SCREEN'), '', this); return;
      case 'controls_openAnotherScreenWithStartValue': this.app.open(v('SCREENNAME'), v('STARTVALUE'), this); return;
      case 'controls_closeScreen': this.app.close(this); return;
      case 'controls_closeScreenWithValue': this.app.close(this, v('SCREEN')); return;
      case 'controls_closeApplication': this.app.closedApp = true; return;
      default: throw new Error(`${this.name}: statement block ${t} not supported`);
    }
  }
  call(b, sc) {
    const name = field(b, 'PROCNAME'), def = this.procs[name]; if (!def) throw new Error(`no procedure ${name}`);
    const args = {}; mut(def).kids.forEach((a, i) => (args[a.attrs.name] = this.val(valueBlock(b, 'ARG' + i), sc)));
    if (def.attrs.type === 'procedures_defnoreturn') { this.run(stmtBlock(def, 'STACK'), [args]); return; }
    return this.val(valueBlock(def, 'RETURN'), [args]);
  }
  method(b, sc) {
    const m = mut(b).attrs, a = (i) => this.val(valueBlock(b, 'ARG' + i), sc), key = `${m.component_type}.${m.method_name}`;
    const db = this.app.db;
    switch (key) {
      case 'TinyDB.GetValue': return a(0) in db ? db[a(0)] : a(1);
      case 'TinyDB.StoreValue': db[a(0)] = a(1); return;
      case 'TinyDB.ClearTag': delete db[a(0)]; return;
      case 'TinyDB.GetTags': return Object.keys(db);
      case 'File.ReadFrom': { const p = a(0), inst = m.instance_name, data = FILES['assets/' + p.replace(/^\/\//, '')]; if (!data) throw new Error('missing asset ' + p); this.queue.push(() => this.fire(`${inst}.GotText`, { text: data.toString('utf8') })); return; }
      case 'Notifier.ShowAlert': this.log.push('ALERT: ' + a(0)); return;
      case 'Notifier.ShowChooseDialog': this.log.push(`CHOOSE: ${a(0)} [${a(2)} / ${a(3)}]`); return;
      case 'Player.Start': { const src = this.comps[m.instance_name].Source; if (!String(src).startsWith('/') && !FILES['assets/' + src]) { this.queue.push(() => this.fire(`${this.name}.ErrorOccurred`, { component: m.instance_name, functionName: 'Start', errorNumber: 701, message: 'Unable to prepare ' + src })); } this.log.push('PLAY ' + src); return; }
      case 'Player.Pause': this.log.push('PAUSE'); return;
      case 'Player.Stop': this.log.push('STOP'); return;
      case 'BarcodeScanner.DoScan': this.log.push('SCANNER OPENED'); return;
      case 'Clock.SystemTime': if (this.app.now !== undefined) return this.app.now; return this.app.backend ? this.app.backend.clock.t : Date.parse('2026-12-02T09:00:00+05:30');
      case 'Web.BuildRequestData': return a(0).map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(str(v))).join('&');
      case 'Web.PostText': {   // goes to the real Apps Script code (tools/test-backend.js) - or fails like a phone without internet
        const inst = m.instance_name, body = a(0);
        if (!this.app.backend || this.app.offline) { this.queue.push(() => this.fire(`${this.name}.ErrorOccurred`, { component: inst, functionName: 'PostText', errorNumber: 1101, message: 'Unable to get a response' })); return; }
        const params = Object.fromEntries(body.split('&').map((kv) => kv.split('=').map(decodeURIComponent)));
        this.app.requests.push(params.action);
        const out = this.app.backend.post(params);
        this.queue.push(() => this.fire(`${inst}.GotText`, { url: this.comps[inst].Url, responseCode: 200, responseType: 'application/json', responseContent: JSON.stringify(out) }));
        return;
      }
      case 'Web.JsonTextDecode': { const conv = (x) => (Array.isArray(x) ? x.map(conv) : x && typeof x === 'object' ? Object.entries(x).map(([k, v]) => [k, conv(v)]) : x === null ? '' : x); return conv(JSON.parse(a(0))); }
      case 'Web.Get': {
        const inst = m.instance_name, c = this.comps[inst], url = String(c.Url || '');
        if (!this.app.backend || this.app.offline) { this.queue.push(() => this.fire(`${this.name}.ErrorOccurred`, { component: inst, functionName: 'Get', errorNumber: 1101, message: 'Unable to get a response' })); return; }
        if (c.SaveResponse === true || c.SaveResponse === 'True') {   // file download into the app's own storage (UPD-3)
          const bad = this.app.failFile && this.app.failFile(url);
          const path = '/data/user/0/appinventor.ai_sitesaathi.SITE_SAATHI/files/' + c.ResponseFileName;
          if (!bad) this.app.files[path] = url;
          this.app.requests.push('GET ' + url);
          this.queue.push(() => this.fire(`${inst}.GotFile`, { url, responseCode: bad ? 404 : 200, responseType: 'image/jpeg', fileName: bad ? '' : path }));
          return;
        }
        const params = Object.fromEntries(new URLSearchParams(url.split('?')[1] || ''));
        this.app.requests.push('GET ' + (params.action || ''));
        const out = this.app.backend.get(params);
        this.queue.push(() => this.fire(`${inst}.GotText`, { url, responseCode: 200, responseType: 'application/json', responseContent: JSON.stringify(out) }));
        return;
      }
      case 'File.Delete': delete this.app.files[a(0)]; this.log.push('DELETE ' + a(0)); return;
      case 'TextToSpeech.Speak': { const c = this.comps[m.instance_name]; this.log.push('SPEAK: ' + a(0)); this.log.push(`TTS ${c.Language} ${c.SpeechRate === undefined ? 1 : c.SpeechRate}: ${a(0)}`); this.queue.push(() => this.fire(`${m.instance_name}.AfterSpeaking`, { result: !this.app.noVoice })); return; }
      case 'TextToSpeech.Stop': this.log.push('TTS STOP'); return;
      case 'ChatBot.ResetConversation': this.log.push('CHAT RESET'); return;
      case 'ChatBot.Converse': {
        const inst = m.instance_name, sys = this.comps[inst].System, q = a(0);
        this.app.chats.push({ system: sys, q });
        if (this.app.offline || this.app.ai === 'fail') { this.queue.push(() => this.fire(`${this.name}.ErrorOccurred`, { component: inst, functionName: 'Converse', errorNumber: 3000, message: 'ChatBot error' })); return; }
        this.queue.push(() => this.fire(`${inst}.GotResponse`, { responseText: this.app.ai(q, sys) }));
        return;
      }
      case 'SpeechRecognizer.GetText': this.queue.push(() => this.fire(`${m.instance_name}.AfterGettingText`, { result: this.app.speech, partial: false })); return;
      case 'Sharing.ShareMessage': this.log.push('SHARE ' + a(0)); return;
      case 'ListPicker.Open': this.log.push('PICKER ' + m.instance_name); return;
      case 'Camera.TakePicture': this.queue.push(() => this.fire(`${m.instance_name}.AfterPicture`, { image: '/storage/emulated/0/Pictures/app_inventor_1.jpg' })); return;
      case 'SoundRecorder.Start': this.log.push('REC START'); return;
      case 'SoundRecorder.Stop': this.queue.push(() => this.fire(`${m.instance_name}.AfterSoundRecorded`, { sound: '/storage/emulated/0/Music/rec_1.3gp' })); return;
      case 'Clock.Now': return new Date('2026-11-29T10:00:00');
      case 'Clock.FormatDate': return a(0).toISOString().slice(0, 10);
      default: throw new Error(`method ${key} not simulated`);
    }
  }
  val(b, sc) {
    if (!b) return undefined;
    const t = b.attrs.type, v = (n) => this.val(valueBlock(b, n), sc), items = (p) => Array.from({ length: Number(mut(b).attrs.items) }, (_, i) => v(p + i));
    switch (t) {
      case 'text': return field(b, 'TEXT');
      case 'math_number': return Number(field(b, 'NUM'));
      case 'logic_boolean': return field(b, 'BOOL') === 'TRUE';
      case 'lexical_variable_get': { const n = field(b, 'VAR'); if (n.startsWith('global ')) return this.globals[n.slice(7)]; return this.lookup(sc, n)[n]; }
      case 'component_set_get': { const m = mut(b).attrs; const v0 = this.comps[m.instance_name][m.property_name]; return v0 === undefined ? '' : v0; }   // unset text props are '' on a phone
      case 'component_method': return this.method(b, sc);
      case 'controls_choose': return v('TEST') === true ? v('THENRETURN') : v('ELSERETURN');
      case 'logic_compare': { const r = aiEq(v('A'), v('B')); return field(b, 'OP') === 'EQ' ? r : !r; }
      case 'math_compare': { const A = Number(v('A')), B = Number(v('B')); return { EQ: A === B, NEQ: A !== B, LT: A < B, LTE: A <= B, GT: A > B, GTE: A >= B }[field(b, 'OP')]; }
      case 'logic_operation': return field(b, 'OP') === 'AND' ? v('A') === true && v('B') === true : v('A') === true || v('B') === true;
      case 'logic_negate': return !(v('BOOL') === true);
      case 'math_add': return items('NUM').reduce((x, y) => Number(x) + Number(y), 0);
      case 'math_subtract': return Number(v('A')) - Number(v('B'));
      case 'math_multiply': return items('NUM').reduce((x, y) => Number(x) * Number(y), 1);
      case 'text_join': return items('ADD').map(str).join('');
      case 'text_isEmpty': return str(v('VALUE')) === '';
      case 'text_trim': return str(v('TEXT')).trim();
      case 'text_changeCase': return field(b, 'OP') === 'UPCASE' ? str(v('TEXT')).toUpperCase() : str(v('TEXT')).toLowerCase();
      case 'text_replace_all': return str(v('TEXT')).split(str(v('SEGMENT'))).join(str(v('REPLACEMENT')));
      case 'text_split': return str(v('TEXT')).split(str(v('AT')));
      case 'lists_create_with': return items('ADD');
      case 'lists_select_item': { const l = v('LIST'), i = Number(v('NUM')); if (!Array.isArray(l) || i < 1 || i > l.length) throw new Error(`${this.name}: select list item ${i} of ${str(l).slice(0, 60)}`); return l[i - 1]; }
      case 'lists_length': return v('LIST').length;
      case 'lists_is_empty': return v('LIST').length === 0;
      case 'lists_from_csv_table': return csvTable(str(v('TEXT')));
      case 'local_declaration_expression': return this.val(valueBlock(b, 'RETURN'), sc.concat([{ [field(b, 'VAR0')]: v('DECL0') }]));
      case 'controls_do_then_return': this.run(stmtBlock(b, 'STM'), sc); return v('VALUE');
      case 'procedures_callreturn': return this.call(b, sc);
      case 'controls_getStartValue': return this.startValue;
      case 'component_component_block': return field(b, 'COMPONENT_SELECTOR');
      case 'text_length': return str(v('VALUE')).length;
      case 'lists_is_in': { const l = v('LIST'), it = v('ITEM'); return Array.isArray(l) && l.some((x) => aiEq(x, it)); }
      case 'lists_lookup_in_pairs': { const l = v('LIST'), k = v('KEY'); if (!Array.isArray(l)) return v('NOTFOUND'); const p = l.find((x) => Array.isArray(x) && x.length === 2 && aiEq(x[0], k)); return p ? p[1] : v('NOTFOUND'); }
      case 'math_division': return Number(v('A')) / Number(v('B'));
      case 'math_round': return Math.round(Number(v('NUM')));
      case 'lists_position_in': { const l = v('LIST'), it = v('ITEM'); const i = l.findIndex((x) => aiEq(x, it)); return i + 1; }
      default: throw new Error(`${this.name}: value block ${t} not supported`);
    }
  }
  get(c, p = 'Text') { return this.comps[c][p]; }
  set(c, p, val) { this.comps[c][p] = val; return this; }
  callProc(name, ...args) { const def = this.procs[name]; const sc = {}; mut(def).kids.forEach((a, i) => (sc[a.attrs.name] = args[i])); this.run(stmtBlock(def, 'STACK'), [sc]); this.flush(); }
  visible(c) { return this.comps[c].Visible !== 'False' && this.comps[c].Visible !== false; }
}
class App {
  constructor(db = {}, backend = null) { this.db = db; this.stack = []; this.closedApp = false; this.backend = backend; this.offline = false; this.requests = []; this.files = {}; this.chats = []; this.ai = (q) => 'OK: ' + q; this.speech = ''; this.noVoice = false; this.failFile = null; }
  open(name, sv = '', from) { const s = new Screen(name, this, sv); this.stack.push(s); s.fire(`${name}.Initialize`); return s; }
  close(s, result = '') { this.stack.pop(); const back = this.stack[this.stack.length - 1]; if (back) back.fire(`${back.name}.OtherScreenClosed`, { otherScreenName: s.name, result }); }
  get top() { return this.stack[this.stack.length - 1]; }
}
module.exports = { App };

// =====================================================================================
// Scenario tests (the Day 9 + Day 10 "Done when" lines)
// =====================================================================================
if (require.main === module) {
  let pass = 0, fail = 0;
  const RESULTS = []; let SECTION = '';
  const ok = (cond, msg, extra = '') => { RESULTS.push({ section: SECTION, check: msg, pass: !!cond, detail: cond ? '' : String(extra) }); if (cond) { pass++; console.log('  ok  ' + msg); } else { fail++; console.log('  FAIL ' + msg + (extra ? '  -> ' + extra : '')); } };
  const step = (title) => { SECTION = title; console.log('\n' + title); };
  const VER = JSON.parse(fileOf('/Screen1.scm').toString().split('\n')[2]).Properties.VersionName;

  step('Day 9 · first launch: splash -> language -> Home');
  const app = new App();
  const s1 = app.open('Screen1');
  ok(s1.get('LblSplashTag') === 'Learn at the Site. Build with Confidence.', 'splash shows tagline from strings.csv', s1.get('LblSplashTag'));
  s1.fire('Clock1.Timer');
  ok(s1.visible('ArrLanguage') && !s1.visible('ArrSplash'), 'first launch shows Language selection (SPL-1)');
  ok(s1.get('LblLangTitle') === 'भाषा निवडा\nभाषा चुनें\nChoose language', 'language title in all 3 languages', JSON.stringify(s1.get('LblLangTitle')));
  ok(s1.get('BtnLangNext', 'Enabled') === 'False', 'Next disabled until a language is chosen');
  s1.fire('BtnMr.Click');
  ok(app.db.lang === 'mr', 'TinyDB lang = mr saved (LNG-2)');
  ok(s1.get('BtnMr', 'Image') === 'bg_choice_on.png' && s1.get('BtnHi', 'Image') === 'bg_choice.png', 'chosen language highlighted (yellow card with tick)');
  ok(s1.log.includes('SPEAK: मराठी निवडा'), 'spoken prompt "मराठी निवडा" (LNG-1)', s1.log.join(' | '));
  ok(s1.get('BtnLangNext') === 'पुढे', 'Next button now in Marathi', s1.get('BtnLangNext'));
  s1.fire('BtnLangNext.Click');
  const home = app.top;
  ok(home.name === 'Home', 'Home opened');
  ok(home.get('BtnStart') === 'शिकणे सुरू करा' && home.get('BtnScan') === 'QR स्कॅन करा' && home.get('BtnSkills') === 'माझी कौशल्ये' && home.get('BtnSettings') === 'सेटिंग्ज', 'Home tiles in Marathi (HOM-1)');
  ok(!home.visible('BtnContinue'), 'no Continue card before any lesson (HOM-3)');

  step('Day 9 · second launch goes straight to Home; Back from Home exits');
  const app2 = new App({ lang: 'hi' });
  const s1b = app2.open('Screen1'); s1b.fire('Clock1.Timer');
  ok(app2.top.name === 'Home' && app2.top.get('BtnStart') === 'सीखना शुरू करें', 'splash -> Home in Hindi');
  app2.close(app2.top);
  ok(app2.closedApp, 'Back on Home closes the app (no stuck splash)');

  step('Day 9 · Settings: language, text size, About, reset');
  home.fire('BtnSettings.Click');
  const set = app.top;
  ok(set.get('LblBarTitle') === 'सेटिंग्ज' && set.get('BtnLMr', 'Image') === 'bg_btn_yellow_t.png', 'Settings in Marathi, Marathi marked (third-width picture)');
  ok(/: 3$/.test(set.get('LblStorage')), 'storage shows 3 lessons on this phone (FR-23)', set.get('LblStorage'));
  set.fire('BtnLHi.Click');
  ok(app.db.lang === 'hi' && set.get('LblBarTitle') === 'सेटिंग्स' && set.get('BtnTsLarge') === 'बड़ा', 'switch to Hindi updates labels at once (SET-1)');
  set.fire('BtnTsLarge.Click');
  ok(app.db.text_size === 'large' && set.get('LblLangHead', 'FontSize') === 14 * 1.2 && set.get('BtnTsLarge', 'Image') === 'bg_btn_yellow_h.png', 'Large text: font sizes x1.2', set.get('LblLangHead', 'FontSize'));
  set.fire('BtnVoiceHelp.Click');
  ok(set.log.some((l) => l.startsWith('ALERT: फ़ोन की सेटिंग्स')), 'read-aloud voice help shown in Hindi (SET-3)');
  set.fire('BtnAbout.Click');
  ok(set.visible('ArrAbout') && !set.visible('ArrMain') && set.get('LblBarTitle') === 'जानकारी', 'About opens inside Settings');
  ok(set.get('LblDisclaimer').startsWith('यह ऐप') && set.get(set.comps.BtnVersion ? 'BtnVersion' : 'LblAboutVersion') === 'संस्करण ' + VER, 'About: disclaimer + version (SET-2)');
  set.fire('Settings.BackPressed');
  ok(set.visible('ArrMain') && !set.visible('ArrAbout'), 'Back from About returns to Settings');
  set.fire('BtnBack.Click');
  ok(app.top.name === 'Home' && app.top.get('BtnStart') === 'सीखना शुरू करें' && app.top.get('BtnStart', 'FontSize') === 19 * 1.2, 'Home refreshed in Hindi + large text after Settings');

  step('Day 10 · Learn: modules -> lesson list -> lesson (Hindi, large text)');
  app.top.fire('BtnStart.Click');
  const L = app.top;
  ok(L.name === 'Learn' && L.visible('ArrModules') && L.get('LblBarTitle') === 'सीखने के विषय', 'module grid shown (MOD-1)');
  ok(L.get('BtnModMAS', 'Image') === 'tile_mod_mas.png' && L.get('BtnModMAS').includes('पाठ: 1'), 'Brick Masonry active with 1 lesson', JSON.stringify(L.get('BtnModMAS')));
  ok(L.get('BtnModREI', 'Image') === 'tile_mod_rei_soon.png' && L.get('BtnModREI').includes('जल्द आ रहा है'), 'Reinforcement shows "Coming soon"');
  L.fire('BtnModREI.Click');
  ok(L.log.includes('ALERT: जल्द आ रहा है') && L.visible('ArrModules'), 'tapping a coming-soon module shows a message, no empty screen');
  L.fire('BtnModMAS.Click');
  ok(L.visible('ArrLessons') && L.get('LblBarTitle') === 'ईंट की चिनाई', 'lesson list for Brick Masonry');
  ok(L.visible('ArrLc1') && !L.visible('ArrLc2') && L.get('BtnLc1').startsWith('ईंट की चिनाई – बुनियादी तरीका\nSS-MAS-01 · 5 मिनट · ऑडियो') && L.get('BtnLc1Pic', 'Image') === 'SS-MAS-01_s1.jpg' && L.get('BtnLc1Go', 'Image') === 'st_go.png',
    'lesson card: picture, title, ID, duration, audio; one card per lesson (MOD-2)', JSON.stringify(L.get('BtnLc1')));
  L.fire('BtnLc1.Click');
  ok(L.visible('ArrLesson') && L.visible('ArrIntro') && L.get('ArrPic', 'Image') === 'SS-MAS-01_s1.jpg', 'lesson intro with picture (LES-1)');
  ok(L.get('LblObj').startsWith('पूरे और बराबर') && L.get('LblMat').includes(' · करनी · '), 'objective + materials in Hindi');
  L.fire('BtnNext.Click'); L.fire('BtnNext.Click');
  ok(L.get('LblCounter') === 'चरण 2 / 7' && L.get('ArrPic', 'Image') === 'SS-MAS-01_s2.jpg' && L.get('LblStepText').startsWith('इंजीनियर'), 'step 2 of 7 with its picture and text (LES-2)');
  ok(app.db.last_lesson === 'SS-MAS-01' && app.db.last_step === 2, 'last lesson + step saved for Continue');
  L.fire('BtnPrev.Click');
  ok(L.get('LblCounter') === 'चरण 1 / 7', 'Back goes to step 1');
  for (let i = 0; i < 7; i++) L.fire('BtnNext.Click');
  ok(L.visible('ArrFinal') && !L.visible('BtnNext') && !L.visible('ArrPic'), 'after step 7: safety + mistakes page, no Next (LES-3)');
  ok(L.get('LblSafety').startsWith('• हेलमेट') && L.get('LblSafety').split('\n').length === 5 && L.get('LblMistakes').split('\n').length === 7, 'red box 5 points, yellow box 7 points');
  ok(app.db['viewed_SS-MAS-01'] === true, 'lesson marked viewed at the end (LES-4)');
  L.fire('BtnNext.Click');
  ok(L.visible('ArrFinal'), 'extra taps cannot go past the last page');
  L.fire('BtnStartQuiz.Click');
  ok(app.top.name === 'Quiz' && app.top.startValue === 'SS-MAS-01' && app.top.get('LblQNum') === 'प्रश्न 1 / 5', 'Start quiz opens the Quiz for this lesson', app.top.get('LblQNum'));
  app.top.fire('BtnBack.Click');
  ok(app.top === L && L.visible('ArrFinal'), 'back from Quiz returns to the lesson');
  L.fire('Learn.BackPressed'); for (let i = 0; i < 8; i++) L.fire('BtnPrev.Click');
  ok(L.visible('ArrLessons') && L.get('BtnLc1').endsWith('देखा') && L.get('BtnLc1Go', 'Image') === 'st_go.png', 'back from intro -> list, which now shows "Viewed"', L.get('BtnLc1'));
  L.fire('BtnBack.Click');
  ok(L.visible('ArrModules'), 'Back -> modules');
  L.fire('BtnBack.Click');
  ok(app.top.name === 'Home', 'Back -> Home (HOM-4)');

  step('Day 10 · Continue card and opening by ID');
  const h = app.top;
  ok(h.visible('BtnContinue') && h.get('BtnContinue').startsWith('जारी रखें · ') && h.get('BtnContinue').split('\n')[1] === 'ईंट की चिनाई – बुनियादी तरीका', 'Continue card visible after a lesson (HOM-3)', JSON.stringify(h.get('BtnContinue')));
  const app3 = new App({ lang: 'mr', last_lesson: 'SS-CON-01', last_step: 4 });
  const h3 = app3.open('Home');
  ok(h3.get('BtnContinue') === 'पुढे चालू ठेवा · पायरी 4 / 7\nकाँक्रीट काम – मूलभूत पद्धत', 'Continue: Concrete work · step 4 of 7 (Marathi)', JSON.stringify(h3.get('BtnContinue')));
  h3.fire('BtnContinue.Click');
  const L3 = app3.top;
  ok(L3.get('LblCounter') === 'पायरी 4 / 7' && L3.get('ArrPic', 'Image') === 'SS-CON-01_s4.jpg', 'Continue opens Concrete Work at step 4');
  L3.fire('BtnBack.Click');
  ok(app3.top.name === 'Home', 'Back from a lesson opened by Continue returns to Home');
  const L4 = app3.open('Learn', ' ss-saf-01 ');
  ok(L4.visible('ArrLesson') && L4.get('LblBarTitle') === 'बांधकाम साइट सुरक्षा – मूलभूत खबरदारी', 'openLesson(" ss-saf-01 ") trims + upper-cases (QR-2 ready for Day 12)');
  const L5 = app3.open('Learn', 'SS-TEST-99');
  ok(L5.log.includes('ALERT: हा धडा अजून ॲपमध्ये नाही. कृपया तुमच्या सुपरवायझरला विचारा.') && L5.visible('ArrModules'), 'unknown ID -> clear message, stays on modules (QR-3)');

  step('Day 9 · reset progress keeps language and text size');
  const app6 = new App({ lang: 'en', text_size: 'large', 'score_SS-MAS-01': 4, 'viewed_SS-MAS-01': true, last_lesson: 'SS-MAS-01', last_step: 3 });
  const s6 = app6.open('Settings'); s6.fire('BtnReset.Click');
  ok(s6.log.some((l) => l.startsWith('CHOOSE: Are you sure?')), 'confirmation dialog in English');
  s6.fire('Notifier1.AfterChoosing', { choice: 'Yes' });
  ok(JSON.stringify(Object.keys(app6.db).sort()) === '["lang","text_size"]', 'only lang + text_size remain', JSON.stringify(app6.db));

  // ===================================================================================
  step('Day 11 · audio bar: play / pause / restart; missing file -> clear message; stops when leaving');
  {
    const a = new App({ lang: 'mr' }); const Lx = a.open('Learn', 'SS-MAS-01');
    ok(Lx.visible('ArrAudio') && Lx.get('LblAudio') === 'ऐका' && Lx.get('BtnPlay', 'Image') === 'btn_play.png', 'audio bar shows Listen (AUD-1)');
    Lx.fire('BtnPlay.Click');
    const hasAudio = !!FILES['assets/SS-MAS-01_mr.mp3'];
    if (hasAudio) ok(Lx.get('BtnPlay', 'Image') === 'btn_pause.png' && Lx.get('LblAudio') === 'थांबवा', 'playing -> Pause shown');
    else ok(Lx.log.includes('ALERT: या धड्याचा आवाज अजून रेकॉर्ड झालेला नाही.') && Lx.get('BtnPlay', 'Image') === 'btn_play.png', 'audio not recorded yet -> clear message, no crash', Lx.log.join(' | '));
    ok(Lx.get('Player1', 'Source') === undefined || Lx.log.some((l) => l.startsWith('PLAY SS-MAS-01_mr.mp3')), 'plays SS-MAS-01_mr.mp3 for Marathi');
    Lx.fire('BtnNext.Click'); Lx.fire('BtnBack.Click');
    ok(Lx.log.includes('STOP') || !hasAudio, 'audio stopped when leaving the lesson');
  }

  step('Day 11 · quiz scores = manual count, for all 9 lesson-language pairs');
  const quizRows = csvTable(FILES['assets/quiz.csv'].toString()).slice(1);
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (const id of ['SS-MAS-01', 'SS-CON-01', 'SS-SAF-01']) for (const lang of ['mr', 'hi', 'en']) {
    const qs = quizRows.filter((r) => r[0] === id && r[1] === lang);
    const patterns = [qs.map((q) => q[8]), qs.map((q) => 'ABCD'.replace(q[8], '')[0]), ...[1, 2, 3].map(() => qs.map(() => 'ABCD'[Math.floor(rnd() * 4)]))];
    const a = new App({ lang }); const Lq = a.open('Learn', id); Lq.fire('BtnStartQuiz.Click'); const Q = a.top;
    let best = -1, allOk = true, detail = '';
    patterns.forEach((pat, pi) => {
      if (pi > 0) Q.fire('BtnRetry.Click');
      pat.forEach((letter, i) => {
        if (Q.get('LblQuestion') !== qs[i][3]) { allOk = false; detail = `q${i + 1} text`; }
        Q.fire(`Btn${letter}.Click`);
        if (Q.visible('LblFbOk') !== (letter === qs[i][8]) || Q.get('Btn' + qs[i][8], 'Image') !== 'bg_opt_right.png') { allOk = false; detail = `feedback q${i + 1}`; }
        if (letter !== qs[i][8] && Q.get('Btn' + letter, 'Image') !== 'bg_opt_wrong.png') { allOk = false; detail = `wrong colour q${i + 1}`; }
        Q.fire(`BtnA.Click`);   // a second tap must not change anything
        Q.fire('BtnQNext.Click');
      });
      const manual = pat.filter((l, i) => l === qs[i][8]).length; best = Math.max(best, manual);
      if (Q.get('LblScoreBig') !== `${manual} / 5`) { allOk = false; detail = `pattern ${pat.join('')}: app ${Q.get('LblScoreBig')} manual ${manual}`; }
      if (a.db['score_' + id] !== best) { allOk = false; detail = `best ${a.db['score_' + id]} vs ${best}`; }
      if (Q.visible('LblBadge') !== (manual >= 4)) { allOk = false; detail = 'badge'; }
    });
    ok(allOk && a.db['date_' + id] === '2026-11-29', `${id} ${lang}: 5 patterns, score = manual count, best kept, date saved, badge at >= 4/5`, detail);
  }
  {
    const a = new App({ lang: 'hi' }); const Lq = a.open('Learn'); Lq.fire('BtnModCON.Click'); Lq.fire('BtnLc1.Click');
    for (let i = 0; i < 8; i++) Lq.fire('BtnNext.Click'); Lq.fire('BtnStartQuiz.Click');
    const Q = a.top; ['A', 'B', 'C', 'D', 'B'].forEach((l) => { Q.fire(`Btn${l}.Click`); Q.fire('BtnQNext.Click'); });
    ok(Q.get('LblScoreBig') === '5 / 5' && Q.get('LblBadge') === 'मेरे बैज: कंक्रीट का काम', 'result 5/5 + badge for Concrete Work (SKL-2)', Q.get('LblBadge'));
    ok(Q.get('LblAnswers').split('\n\n').filter(Boolean).length === 5 && Q.get('LblAnswers').startsWith('सही!'), 'result lists 5 correct answers (QZ-3)');
    Q.fire('BtnBackLessons.Click');
    ok(a.top === Lq && Lq.visible('ArrLessons') && Lq.get('BtnLc1').endsWith('पूरा') && Lq.get('BtnLc1Go', 'Image') === 'st_done.png', '"Back to lessons" -> card shows Completed + green tick (MOD-2)');
  }

  step('Day 12 · Scan: QR -> lesson; unknown -> clear message; type-code backup');
  {
    const a = new App({ lang: 'mr' }); const H = a.open('Home'); H.fire('BtnScan.Click'); const Sx = a.top;
    ok((Sx.name === 'Scan' || (Sx.comps.ArrScan && Sx.visible('ArrScan'))) && Sx.log.includes('SCANNER OPENED'), 'camera opens at once: 1 tap from Home (QR-1)');
    Sx.fire('BarcodeScanner1.AfterScan', { result: ' ss-mas-01 \n' });
    ok(a.top.name === 'Learn' && a.top.get('LblBarTitle') === 'वीट बांधकाम – मूलभूत पद्धत', 'scanned " ss-mas-01 " opens Brick Masonry in Marathi (QR-2)');
    a.top.fire('BtnBack.Click');
    ok(a.top.name === 'Home', 'Back from the scanned lesson goes Home (HOM-4)');
    H.fire('BtnScan.Click'); const S2 = a.top;
    S2.fire('BarcodeScanner1.AfterScan', { result: 'SS-TEST-99' });
    ok(S2.visible('ArrMsg') && S2.get('LblMsg') === 'हा धडा अजून ॲपमध्ये नाही. कृपया तुमच्या सुपरवायझरला विचारा.' && S2.get('LblMsgCode') === 'SS-TEST-99', 'SS-TEST-99 -> "not in the app yet" message in Marathi (QR-3)');
    S2.fire('BarcodeScanner1.AfterScan', { result: 'upi://pay?pa=x' });
    ok(S2.get('LblMsg') === 'हा SITE SAATHI कोड नाही', 'a UPI QR -> "Not a SITE SAATHI code"');
    S2.comps.TxtCode.Text = ' ss-saf-01'; S2.fire('BtnOpen.Click');
    ok(a.top.name === 'Learn' && a.top.get('LblBarTitle') === 'बांधकाम साइट सुरक्षा – मूलभूत खबरदारी', 'typed code opens Site Safety (QR-4)');
    a.top.fire('BtnBack.Click');
    const S3 = (a.top.fire('BtnScan.Click'), a.top); S3.comps.TxtCode.Text = '   '; S3.fire('BtnOpen.Click');
    ok(a.top === S3 && !S3.visible('ArrMsg'), 'empty code does nothing');
    S3.fire('BtnScanBig.Click');
    ok(S3.log.filter((l) => l === 'SCANNER OPENED').length === 2, 'big button scans again');
  }

  step('Day 12 · My Skills: completed, best scores, module progress, badges');
  {
    const a = new App({ lang: 'en', 'score_SS-MAS-01': 4, 'viewed_SS-MAS-01': true, 'viewed_SS-CON-01': true, 'score_SS-SAF-01': 2 });
    const K = a.open('Skills');
    for (let i = 0; i < 15; i++) K.fire('ClockGrow.Timer');   // UI v2: bars grow in 15 frames
    ok(K.get('LblSumBig') === '2/3' && K.get('ArrSum', 'Image') === 'gauge_8.png' && K.get('ClockGrow', 'TimerEnabled') === false, 'summary 2/3 completed, gauge 8 of 12 segments, animation stops', `${K.get('LblSumBig')} ${K.get('ArrSum', 'Image')}`);
    ok(K.visible('ArrSkMAS') && K.visible('ArrSkCON') && K.visible('ArrSkSAF') && !K.visible('ArrSkREI'), 'progress rows only for modules with lessons (SKL-1)');
    ok(K.get('LblSkCntMAS') === '1/1' && K.get('LblSkFillMAS', 'WidthPercent') === 84 && K.get('LblSkCntCON') === '0/1' && K.get('LblSkFillCON', 'WidthPercent') === 0, 'module bars: Brick full track (84% inside the card), Concrete 0%');
    const els = [1, 2, 3, 4].filter((i) => K.visible('ArrSk' + i)).map((i) => K.get('BtnSk' + i));
    ok(els.length === 3 && K.get('BtnSk1Pic', 'Image').startsWith('ic_sq_') && ['st_done.png', 'st_go.png'].includes(K.get('BtnSk1Go', 'Image')), 'one card per lesson, module icon + status icon');
    ok(els.some((e) => e.endsWith('SS-MAS-01 · Best score: 4/5')) && els.some((e) => e.endsWith('SS-CON-01 · Viewed')) && els.some((e) => e.endsWith('SS-SAF-01 · Best score: 2/5')), 'lesson list: best score / viewed', JSON.stringify(els));
    ok(K.visible('ImgBadgeMAS') && !K.visible('ImgBadgeSAF') && K.get('LblBadgeNames') === 'Brick Masonry', 'badge only for scores >= 4/5 (SKL-2)');
    K.fire('BtnSk2.Click');
    ok(a.top.name === 'Learn' && a.top.visible('ArrLesson'), 'tapping a lesson opens it');
    a.db['score_SS-CON-01'] = 5; a.top.fire('BtnBack.Click');
    ok(K.get('LblSumBig') === '3/3' && K.get('LblBadgeNames') === 'Brick Masonry · Concrete Work', 'My Skills refreshes after returning');
    const empty = new App({ lang: 'mr' }).open('Skills');
    ok(empty.get('LblSumBig') === '0/3' && empty.get('LblBadgeNames') === '—' && [1, 2, 3].every((i) => empty.get('BtnSk' + i).endsWith('सुरू नाही') && empty.get('BtnSk' + i + 'Go', 'Image') === 'st_go.png'), 'new phone: 0/3, no badges, all "Not started"');
  }

  step('Day 12 · offline: nothing needs internet; every lesson-language pair opens with all its pictures');
  {
    const OPTIONAL_ONLINE = ['/Admin.scm', '/Ask.scm', '/Home.scm', '/Learn.scm', '/Quiz.scm', '/Settings.scm'];   // update check, Ask Saathi, Why?, UPD-6
    const isAdminBuild = Object.keys(FILES).some((k) => k.endsWith('/Admin.scm'));
    const online = Object.keys(FILES).filter((k) => k.endsWith('.scm') && !(isAdminBuild ? OPTIONAL_ONLINE.some((x) => k.endsWith(x)) : k.endsWith('/Admin.scm'))).flatMap((k) => (FILES[k].toString().match(/"\$Type":"(Web|ChatBot|ImageBot|PersonalImageClassifier)"/g) || []).map((m) => k + ' ' + m));
    ok(online.length === 0, isAdminBuild ? 'internet parts only in optional features (updates, Ask, Why?, Admin); core screens offline (AIR-1)' : 'no internet components in the worker screens (OFF-1)', online.join(', '));
    let pairs = 0, bad = [];
    for (const id of ['SS-MAS-01', 'SS-CON-01', 'SS-SAF-01']) for (const lang of ['mr', 'hi', 'en']) {
      const a = new App({ lang }); const Lp = a.open('Learn', id);
      if (!Lp.visible('ArrLesson')) { bad.push(id + lang + ' not opened'); continue; }
      for (let s = 0; s <= 8; s++) { const pic = Lp.get('ArrPic', 'Image'); if (Lp.visible('ArrPic') && !FILES['assets/' + pic]) bad.push(`${id} ${lang} missing ${pic}`); Lp.fire('BtnNext.Click'); }
      if (!Lp.visible('ArrFinal') || !Lp.get('LblSafety')) bad.push(id + lang + ' no safety page');
      pairs++;
    }
    ok(pairs === 9 && bad.length === 0, `9/9 lesson-language pairs open, all step pictures bundled`, bad.join('; '));
    const audioMissing = ['SS-MAS-01', 'SS-CON-01', 'SS-SAF-01'].flatMap((id) => ['mr', 'hi', 'en'].map((l) => `${id}_${l}.mp3`)).filter((f) => !FILES['assets/' + f]);
    console.log(`  info audio files bundled: ${9 - audioMissing.length}/9${audioMissing.length ? ' (missing until recorded: ' + audioMissing.length + ')' : ''}`);
  }

  // ===================================================================================
  // Admin Mode (admin build only): the Admin screen's real blocks talk to the real Apps Script code
  if (Object.keys(FILES).some((k) => k.endsWith('/Admin.scm'))) {
    const { makeBackend } = require('./test-backend.js');
    const BK = makeBackend({ props: { ADMIN_SETUP: 'vaibhav@example.com|Vaibhav|admin-pass-123' } });
    BK.api.setupFirstAdmin();
    const T0 = BK.post({ action: 'login', email: 'vaibhav@example.com', password: 'admin-pass-123' }).token;
    BK.post({ action: 'addMember', token: T0, email: 'writer@example.com', name: 'Sneha', role: 'Writer', password: 'writer-pass-1' });
    BK.post({ action: 'addMember', token: T0, email: 'guide@example.com', name: 'Prof. Patil', role: 'Reviewer', qualification: 'M.E. Structures', password: 'review-pass-1' });

    step('Day 15 · hidden entry, login, lockout message, session, logout');
    const a = new App({ lang: 'en' }, BK);
    const set = a.open('Settings'); set.fire('BtnAbout.Click');
    for (let i = 0; i < 4; i++) set.fire('BtnVersion.Click');
    ok(a.top === set, '4 taps on the version do nothing');
    set.fire('BtnVersion.Click');
    let AD = a.top;
    ok(AD.name === 'Admin' && AD.visible('ArrLogin') && !AD.visible('ArrDash'), '5th tap opens Admin Mode at the login page (ADM-1)');
    const loginAs = (email, pw) => { AD.set('TxtUrl', 'Text', 'https://script.google.com/macros/s/TEST/exec').set('TxtEmail', 'Text', email).set('PwdPass', 'Text', pw); AD.fire('BtnLogin.Click'); };
    loginAs('vaibhav@example.com', 'nope');
    ok(AD.get('LblStatus') === 'Wrong email or password. 4 tries left.' && AD.visible('ArrLogin'), 'wrong password -> server message, stays on login', AD.get('LblStatus'));
    loginAs('vaibhav@example.com', 'admin-pass-123');
    ok(AD.visible('ArrDash') && AD.get('LblBarSub') === 'Vaibhav · Admin', 'login -> dashboard, name · role');
    ok(AD.get('LblBarTitle') === 'Dashboard', 'UI v2: title bar names the page (Dashboard)', AD.get('LblBarTitle'));
    ok(AD.get('LblStLiveN') === 0 && AD.get('LblStRevN') === 3 && AD.get('LblStVerN') === 0, 'dashboard stat tiles: Live 0, To review 3, Version 0', [AD.get('LblStLiveN'), AD.get('LblStRevN'), AD.get('LblStVerN')].join(' '));
    ok(AD.visible('ArrAl1') && AD.visible('ArrAl3') && !AD.visible('ArrAl4') && AD.get('BtnAl1').startsWith('SS-CON-01 · In review') && AD.get('BtnAl1Ic', 'Image') === 'st_review.png' && !AD.visible('LvAdmLessons'),
      'UI v3: one row per lesson, amber "in review" icon; plain list hidden (3 lessons <= 8)', AD.get('BtnAl1'));
    ok(AD.get('LvAdmLessons', 'Elements').length === 3 && AD.get('LvAdmLessons', 'Elements')[0].startsWith('SS-CON-01 · In review\n'), 'lesson list with status (3 MVP lessons from the sheet)', JSON.stringify(AD.get('LvAdmLessons', 'Elements')));
    ok(a.db.adm_token && a.db.adm_expires === BK.clock.t + 12 * 3600e3 && String(a.db.adm_url).endsWith('/exec'), 'token + 12 h expiry + server address saved on the phone (ADM-2)');
    ok(AD.visible('BtnPublish') && AD.visible('BtnTextsOpen') && AD.visible('BtnNew'), 'Admin sees New lesson, Publish, App texts');
    AD.fire('BtnBack.Click');
    ok(a.top === set, 'Back on the dashboard leaves Admin Mode');
    for (let i = 0; i < 5; i++) set.fire('BtnVersion.Click');
    AD = a.top;
    ok(AD.visible('ArrDash') && a.requests[a.requests.length - 1] === 'listLessons', 'reopening within 12 hours goes straight to the dashboard');
    AD.fire('BtnLogout.Click');
    ok(AD.visible('ArrLogin') && !a.db.adm_token, 'Log out clears the token from the phone (ADM-2)');
    loginAs('writer@example.com', 'writer-pass-1');
    ok(AD.get('LblBarSub') === 'Sneha · Writer' && !AD.visible('BtnPublish') && !AD.visible('BtnTextsOpen') && AD.visible('BtnNew'), 'Writer: New lesson yes; Publish and App texts hidden');

    step('Day 15 · new lesson SS-REI-01 with text in 3 languages');
    const fill = (o) => { for (const [k, v] of Object.entries(o)) AD.set(k, 'Text', v); };
    AD.fire('BtnNew.Click');
    ok(AD.visible('ArrEdit') && AD.visible('LpModule') && !AD.visible('ArrEdNav') && AD.get('LblBarTitle') === 'Edit lesson', 'new lesson form: choose the module first; title Edit lesson');
    AD.fire('BtnSaveText.Click');
    ok(AD.get('LblStatus') === 'Choose module', 'saving without a module asks for one');
    AD.fire('LpModule.BeforePicking');
    const mods = AD.get('LpModule', 'Elements');
    ok(mods.length === 6 && mods[3] === 'REI – Reinforcement Work', 'module list comes from the sheet', JSON.stringify(mods));
    AD.set('LpModule', 'Selection', mods[3]); AD.fire('LpModule.AfterPicking');
    fill({ TxtDur: '6', TxtTitle: 'Reinforcement – Basic', TxtDesc: 'How to cut, bend and tie bars.', TxtObj: 'Fix bars with the right cover.', TxtMat: 'Steel bars\nBinding wire\nCover blocks', TxtSafe: 'Wear gloves.\nCover bar ends.', TxtMist: 'Wrong lap length\nNo cover blocks' });
    AD.fire('BtnSaveText.Click');
    ok(AD.get('LblEdHead') === 'SS-REI-01 · Draft' && AD.visible('ArrEdNav') && !AD.visible('LpModule'), 'saved -> ID SS-REI-01 created automatically (ADM-3)', AD.get('LblEdHead'));
    ok(/^Missing:\n• mr: title/.test(AD.get('LblMissing')) && !AD.visible('BtnSubmit'), 'missing list shown; Submit hidden until complete (ADM-6)', String(AD.get('LblMissing')).slice(0, 40));
    ok(AD.visible('CrdMiss') && AD.get('CrdMissT', 'Picture') === 'cap_y_t.png' && AD.get('ImgEdSt', 'Picture') === 'st_draft.png', 'UI v3: checklist card is yellow while something is missing; grey Draft icon');
    let emptyOk = true;
    for (const [btn, title] of [['BtnEMr', 'सळई काम – मूलभूत'], ['BtnEHi', 'सरिया का काम – बुनियादी']]) {
      AD.fire(btn + '.Click'); if (AD.get('TxtTitle') !== '') emptyOk = false;
      fill({ TxtTitle: title, TxtDesc: 'वर्णन', TxtObj: 'उद्दिष्ट', TxtMat: 'सळई\nतार', TxtSafe: 'हातमोजे घाला.', TxtMist: 'चूक' }); AD.fire('BtnSaveText.Click');
    }
    ok(emptyOk && BK.api.readTable_('lesson_text').filter((x) => x.lesson_id === 'SS-REI-01').length === 3, 'each language starts empty; text saved in mr, hi, en in the sheet');
    AD.fire('BtnEEn.Click');
    ok(AD.get('TxtMat') === 'Steel bars\nBinding wire\nCover blocks', 'back to English: saved text shown, lists one item per line');

    step('Day 16 · steps with pictures (Base64 extension), audio, quiz, submit');
    AD.fire('BtnSteps.Click');
    ok(AD.visible('ArrStep') && AD.get('LblStepHead') === 'Step 1' && AD.get('LblBarTitle') === 'Steps and pictures', 'steps editor opens at step 1; title Steps and pictures');
    const pickStep = (n) => { AD.fire('LpStep.BeforePicking'); AD.set('LpStep', 'SelectionIndex', n); AD.fire('LpStep.AfterPicking'); };
    for (let n = 1; n <= 5; n++) { pickStep(n); fill({ TxtSmr: 'पायरी ' + n, TxtShi: 'चरण ' + n, TxtSen: 'Step ' + n }); AD.fire('BtnSaveStep.Click'); }
    ok(AD.get('LpStep', 'Text') === 'Steps and pictures (5)', '5 steps saved', AD.get('LpStep', 'Text'));
    AD.fire('BtnUpPhoto.Click');
    ok(AD.get('LblStatus') === 'Take or pick a picture first.', 'upload without a picture -> clear message');
    AD.fire('BtnCam.Click');
    ok(String(AD.get('ImgStepPrev', 'Picture')).endsWith('app_inventor_1.jpg'), 'camera photo shown as a preview');
    const before = a.requests.length; AD.fire('BtnUpPhoto.Click');
    ok(AD.get('LblStatus') === 'Add the Base64 extension blocks first (see the setup guide).' && a.requests.length === before, 'before the extension blocks are added: clear message, nothing sent');
    const b64 = Buffer.from([255, 216, 255, 224, 1, 2]).toString('base64');   // what the extension would return
    for (let n = 1; n <= 5; n++) { pickStep(n); AD.fire('BtnCam.Click'); AD.fire('BtnUpPhoto.Click'); AD.callProc('sendUpload', b64); }
    ok(BK.api.readTable_('steps').filter((x) => x.lesson_id === 'SS-REI-01').every((x) => /res\.cloudinary\.com\/demo\/image\/upload\/v1\/site-saathi\/SS-REI-01\/SS-REI-01_s\d\.jpg$/.test(x.image_url)), 'with the extension: 5 pictures in Cloudinary site-saathi/SS-REI-01/');
    ok(AD.visible('ArrStep') && String(AD.get('ImgStepPrev', 'Picture')).startsWith('https://res.cloudinary.com'), 'stays on the steps editor; preview shows the uploaded picture');
    AD.fire('Admin.BackPressed');
    ok(AD.visible('ArrEdit'), 'Back from steps -> editor');
    AD.fire('BtnEMr.Click'); AD.fire('BtnRec.Click');
    ok(AD.get('BtnRec') === 'Stop', 'recording: button says Stop');
    AD.fire('BtnRec.Click');
    ok(AD.get('BtnRec') === 'Record', 'stopped: recording kept');
    AD.fire('BtnPlayRec.Click');
    ok(AD.log.some((l) => l.startsWith('PLAY /storage')) && !AD.visible('BtnRetry'), 'listen before upload (ADM-5); no false "no internet"');
    AD.fire('BtnUpAudio.Click'); AD.callProc('sendUpload', b64);
    AD.fire('BtnEHi.Click'); AD.fire('BtnRec.Click'); AD.fire('BtnRec.Click'); AD.fire('BtnUpAudio.Click'); AD.callProc('sendUpload', b64);
    AD.fire('BtnEEn.Click'); AD.set('ChkRead', 'Checked', true); AD.fire('BtnSaveText.Click');
    const lt = BK.api.readTable_('lesson_text').filter((x) => x.lesson_id === 'SS-REI-01');
    ok(String(lt.find((x) => x.lang === 'mr').audio_url).endsWith('/video/upload/v1/site-saathi/SS-REI-01/SS-REI-01_mr.mp3') && lt.find((x) => x.lang === 'en').audio_url === 'READ_ALOUD', 'Marathi + Hindi recordings -> Cloudinary MP3; English read-aloud only');
    for (const [btn, lang] of [['BtnEMr', 'mr'], ['BtnEHi', 'hi'], ['BtnEEn', 'en']]) {
      AD.fire(btn + '.Click'); AD.fire('BtnQuiz.Click');
      for (let n = 1; n <= 5; n++) {
        AD.set('LpQno', 'SelectionIndex', n); AD.fire('LpQno.AfterPicking');
        fill({ TxtQ: `${lang} q${n}?`, TxtQA: 'a', TxtQB: 'b', TxtQC: 'c', TxtQD: 'd', TxtQexp: 'because' });
        AD.set('LpCorrect', 'Selection', 'ABCDA'[n - 1]); AD.fire('LpCorrect.AfterPicking'); AD.fire('BtnSaveQ.Click');
      }
      if (lang !== 'en') AD.fire('Admin.BackPressed');
    }
    ok(BK.api.readTable_('quiz').filter((q) => q.lesson_id === 'SS-REI-01').length === 15, '15 quiz questions saved (5 × 3 languages)');
    AD.set('LpQno', 'SelectionIndex', 2); AD.fire('LpQno.AfterPicking');
    ok(AD.get('TxtQ') === 'en q2?' && AD.get('LpCorrect', 'Text') === 'Correct answer: B', 'reopening a question shows it with its answer', `${AD.get('TxtQ')} | ${AD.get('LpCorrect', 'Text')}`);
    AD.fire('Admin.BackPressed');
    ok(AD.get('LblMissing') === 'Complete – ready to submit' && AD.visible('BtnSubmit'), 'all checks pass -> Submit appears', AD.get('LblMissing'));
    ok(AD.get('CrdMissT', 'Picture') === 'cap_g_t.png' && AD.get('ImgMiss', 'Picture') === 'ic_fb_ok.png', 'UI v3: checklist card turns green with a tick when complete');
    AD.fire('BtnSubmit.Click');
    ok(AD.get('LblEdHead') === 'SS-REI-01 · In review', 'submitted -> In review');

    step('Day 16 · review (send back, approve) and publish');
    const openLessonRow = (id) => { AD.set('LvAdmLessons', 'SelectionIndex', AD.globals.IDS.indexOf(id) + 1); AD.fire('LvAdmLessons.AfterPicking'); };
    AD.fire('BtnBack.Click'); AD.fire('BtnLogout.Click'); loginAs('guide@example.com', 'review-pass-1');
    ok(!AD.visible('BtnNew') && !AD.visible('BtnPublish'), 'Reviewer: no New lesson, no Publish');
    openLessonRow('SS-REI-01');
    ok(AD.visible('ArrReviewBox') && !AD.visible('BtnSaveText') && !AD.visible('BtnSubmit'), 'Reviewer sees the lesson, checks, Approve / Send back; no Save');
    AD.fire('BtnSendBack.Click');
    ok(AD.get('LblStatus') === 'Write what to change before sending back.', 'send back needs a comment');
    AD.set('TxtComment', 'Text', 'Step 3: add "ask the engineer for lap length".'); AD.fire('BtnSendBack.Click');
    ok(AD.get('LblEdHead') === 'SS-REI-01 · Changes needed', 'sent back -> Changes needed');
    AD.fire('BtnBack.Click'); AD.fire('BtnLogout.Click'); loginAs('writer@example.com', 'writer-pass-1'); openLessonRow('SS-REI-01');
    ok(String(AD.get('LblLastReview')).startsWith('Step 3: add'), 'Writer sees the reviewer comment');
    AD.fire('BtnSubmit.Click');
    AD.fire('BtnBack.Click'); AD.fire('BtnLogout.Click'); loginAs('guide@example.com', 'review-pass-1'); openLessonRow('SS-REI-01');
    AD.set('TxtComment', 'Text', 'OK'); AD.fire('BtnApprove.Click');
    ok(AD.get('LblEdHead') === 'SS-REI-01 · Approved', 'Reviewer approves (name + qualification saved by the server)');
    AD.fire('BtnBack.Click'); AD.fire('BtnLogout.Click'); loginAs('vaibhav@example.com', 'admin-pass-123');
    AD.fire('BtnPublish.Click');
    ok(AD.log.some((l) => l.startsWith('CHOOSE: Publish approved lessons to all phones?')), 'Publish asks first');
    AD.fire('Notifier1.AfterChoosing', { choice: 'Yes' });
    ok(AD.log.includes('ALERT: Published. Content version 1') && AD.get('LblStLiveN') === 1 && AD.get('LblStVerN') === 1, 'published -> content version 1; dashboard Live: 1', [AD.get('LblStLiveN'), AD.get('LblStVerN')].join(' '));
    ok(BK.get({}).lessons_csv.includes('SS-REI-01,REI,mr,सळई काम – मूलभूत'), 'phones can now download SS-REI-01 (getPublished)');

    step('Day 16 · QR codes and App texts (Admin)');
    AD.fire('BtnQrOpen.Click');
    ok(AD.visible('ArrQr') && AD.get('LvQr', 'Elements').length === 4, 'QR list for the 4 lessons', JSON.stringify(AD.get('LvQr', 'Elements')));
    ok(AD.visible('ArrQc4') && !AD.visible('ArrQc5') && /^SS-[A-Z]{3}-\d\d · Printed: no\n/.test(AD.get('BtnQc1')) && AD.get('BtnQc1Go', 'Image') === 'st_go.png', 'UI v3: one row per QR code, not printed yet', AD.get('BtnQc1'));
    AD.set('LvQr', 'SelectionIndex', AD.globals.QRS.findIndex((q) => q.find((p) => p[0] === 'id')[1] === 'SS-REI-01') + 1); AD.fire('LvQr.AfterPicking');
    ok(AD.get('LblQrId') === 'SS-REI-01' && String(AD.get('ImgQr', 'Picture')).endsWith('data=SS-REI-01'), 'QR picture for SS-REI-01 with only the ID inside (QR-2)');
    AD.set('TxtPlace', 'Text', 'Bar bending yard').set('ChkPrinted', 'Checked', true); AD.fire('BtnSaveQr.Click');
    ok(BK.api.readTable_('qr').find((q) => q.lesson_id === 'SS-REI-01').poster_location === 'Bar bending yard', 'poster place + printed saved');
    AD.fire('BtnBack.Click'); AD.fire('BtnTextsOpen.Click');
    AD.set('LvTexts', 'SelectionIndex', AD.globals.KEYS.findIndex((k) => k[0][1] === 'btn_start') + 1); AD.fire('LvTexts.AfterPicking');
    ok(AD.get('LblKey') === 'btn_start' && AD.get('TxtTen') === 'Start learning' && AD.get('TxtTmr') === 'शिकणे सुरू करा', 'App texts: a label with its 3 languages');
    AD.set('TxtTen', 'Text', 'Start a lesson'); AD.fire('BtnSaveTxt.Click');
    ok(BK.api.readTable_('strings').find((x) => x.key === 'btn_start').en === 'Start a lesson', 'label changed in the sheet (phones get it at the next publish)');

    step('Network errors and the 12-hour session');
    a.offline = true; AD.fire('BtnQrOpen.Click');
    ok(AD.visible('BtnRetry') && AD.get('LblStatus') === 'No internet or server error. Try again.', 'no internet -> message + Retry');
    a.offline = false; AD.fire('BtnRetry.Click');
    ok(AD.visible('ArrQr') && !AD.visible('BtnRetry'), 'Retry repeats the same call');
    BK.clock.t += 12 * 3600e3 + 1000; AD.fire('BtnBack.Click');
    ok(AD.visible('ArrLogin') && AD.get('LblStatus') === 'Session ended after 12 hours. Please log in again.', 'after 12 hours -> back to login with the reason');
  }

  // ===================================================================================
  // Days 17-18 (admin build): lesson updates, read-aloud, Ask Saathi, Explain My Mistake
  if (Object.keys(FILES).some((k) => k.endsWith('/Admin.scm'))) {
    const { makeBackend } = require('./test-backend.js');
    const URL = 'https://script.google.com/macros/s/TEST/exec';
    // Content team publishes SS-REI-01 (pictures + audio in Cloudinary) through the real backend code
    const BK = makeBackend({ props: { ADMIN_SETUP: 'vaibhav@example.com|Vaibhav|admin-pass-123' } });
    BK.api.setupFirstAdmin();
    const P = (x) => BK.post(x);
    const TA = P({ action: 'login', email: 'vaibhav@example.com', password: 'admin-pass-123' }).token;
    P({ action: 'addMember', token: TA, email: 'r@example.com', name: 'Prof. Patil', role: 'Reviewer', qualification: 'M.E.', password: 'review-pass-1' });
    const TR = P({ action: 'login', email: 'r@example.com', password: 'review-pass-1' }).token;
    const tiny = Buffer.from([255, 216, 255, 224, 1, 2]).toString('base64');
    const makeLesson = (mod, titles) => {
      const id = P({ action: 'saveLesson', token: TA, module: mod }).id;
      for (const l of ['mr', 'hi', 'en']) P({ action: 'saveLesson', token: TA, id, lang: l, title: titles[l], description: 'd', objective: 'o', materials: 'm1\nm2', safety: 's1', mistakes: 'x1' });
      for (let n = 1; n <= 5; n++) { P({ action: 'saveStep', token: TA, id, step_no: n, text_mr: `${titles.mr} पायरी ${n}`, text_hi: `चरण ${n}`, text_en: `Step ${n}` }); P({ action: 'uploadMedia', token: TA, id, kind: 'image', step_no: n, ext: 'jpg', data: tiny }); }
      P({ action: 'uploadMedia', token: TA, id, kind: 'audio', lang: 'mr', ext: '3gp', data: tiny }); P({ action: 'uploadMedia', token: TA, id, kind: 'audio', lang: 'hi', ext: '3gp', data: tiny });
      P({ action: 'saveLesson', token: TA, id, lang: 'en', readAloudOnly: 'true' });
      for (const l of ['mr', 'hi', 'en']) for (let n = 1; n <= 5; n++) P({ action: 'saveQuiz', token: TA, id, lang: l, q_no: n, question: `${l} REI q${n}?`, a: 'a', b: 'b', c: 'c', d: 'd', correct: 'A', explanation: 'why' });
      P({ action: 'submit', token: TA, id }); P({ action: 'review', token: TR, id, decision: 'approve' });
      return id;
    };
    const REI = makeLesson('REI', { mr: 'सळई काम – मूलभूत', hi: 'सरिया का काम', en: 'Reinforcement – Basic' });
    ok(P({ action: 'publish', token: TA }).version === 1, 'content team published SS-REI-01 (content version 1)');

    step('Day 17 · Home: quiet daily check, "New lessons available", Ask Saathi bar');
    const a = new App({ lang: 'mr', adm_url: URL, 'score_SS-MAS-01': 4 }, BK);
    const H = a.open('Home');
    ok(H.visible('BtnUpd') && H.get('BtnUpd') === 'नवीन धडे उपलब्ध – सेटिंग्जमध्ये डाउनलोड करा', 'Home shows "New lessons available" without downloading (UPD-1)');
    ok(H.get('BtnAsk') === 'साथीला विचारा\nAI · इंटरनेट लागते' && a.db.last_check === '2026-11-29', 'blue Ask Saathi bar with "needs internet" (HOM-2); checked once today');
    const nReq = a.requests.length; a.close(a.top); const H2 = a.open('Home');
    ok(a.requests.length === nReq, 'opening Home again the same day: no second check');

    step('Day 17 · download: a failed file keeps the old version (UPD-4)');
    H2.fire('BtnUpd.Click'); const ST = a.top;
    ok(ST.name === 'Settings' && ST.visible('BtnCheckUpd') && ST.get('LblDl') === 'डाउनलोड केलेल्या फाइल्स: 0 · आवृत्ती 0', 'Settings: Check for new lessons; 0 downloaded files, version 0');
    a.failFile = (u) => u.includes('_s3');
    ST.fire('BtnCheckUpd.Click');
    ok(ST.log.some((l) => l.startsWith('CHOOSE: नवीन धडे उपलब्ध: 1 धडे · 7 फाइल्स')), 'asks first: "1 lessons · 7 files · use Wi-Fi"', ST.log.slice(-1)[0]);
    ST.fire('Notifier1.AfterChoosing', { choice: 'होय' });
    ok(ST.get('LblUpd') === 'डाउनलोड अपूर्ण. जुने धडे तसेच आहेत. पुन्हा प्रयत्न करा.' && a.db.content_version === undefined && a.db.pub_lessons_csv === undefined, 'file 3 fails -> clear message, nothing switched');
    const L0 = a.open('Learn'); L0.fire('BtnModREI.Click');
    ok(L0.log.includes('ALERT: लवकरच येत आहे'), 'Reinforcement still "Coming soon" (old version kept)'); a.close(L0);

    step('Day 17 · retry: all files, then switch; works in airplane mode');
    a.failFile = null; ST.fire('BtnCheckUpd.Click'); ST.fire('Notifier1.AfterChoosing', { choice: 'होय' });
    ok(ST.get('LblUpd') === 'नवीन धडे तयार. आता इंटरनेटशिवाय वापरा.' && a.db.content_version === 1 && a.db.dl_map.length === 7, 'all 7 files downloaded, then content version 1 (UPD-3, UPD-4)');
    ok(Object.keys(a.files).length >= 7 && a.db.dl_map.every(([n, p]) => p.endsWith('/files/' + n)), 'files saved in the app\'s own storage with their names');
    ok(ST.get('LblDl') === 'डाउनलोड केलेल्या फाइल्स: 7 · आवृत्ती 1', 'Settings shows downloaded files and version (FR-23)');
    ST.fire('BtnCheckUpd.Click');
    ok(ST.get('LblUpd') === 'नवीन धडे नाहीत. सर्व धडे अद्ययावत आहेत.', 'checking again: up to date');
    a.offline = true;
    const L1 = a.open('Learn');
    ok(L1.get('BtnModREI', 'Image') === 'tile_mod_rei.png' && L1.get('BtnModREI').includes('धडे: 1'), 'airplane mode: Reinforcement now has 1 lesson');
    L1.fire('BtnModREI.Click'); L1.fire('BtnLc1.Click');
    ok(L1.get('LblBarTitle') === 'सळई काम – मूलभूत' && L1.get('ArrPic', 'Image') === a.db.dl_map.find((p) => p[0] === 'SS-REI-01_s1.jpg')[1], 'downloaded lesson opens offline with its downloaded picture (UPD-5)');
    L1.fire('BtnNext.Click');
    ok(L1.get('LblStepText') === 'सळई काम – मूलभूत पायरी 1' && L1.get('LblCounter') === 'पायरी 1 / 5', 'steps from the update');
    L1.fire('BtnPlay.Click');
    ok(L1.get('Player1', 'Source').endsWith('/files/SS-REI-01_mr.mp3') && !L1.log.includes('ALERT: या धड्याचा आवाज अजून रेकॉर्ड झालेला नाही.'), 'Marathi audio plays from the downloaded MP3');
    L1.fire('BtnBack.Click'); L1.fire('BtnBack.Click'); L1.fire('BtnBack.Click');
    const LS = a.open('Learn', '#scan'); LS.fire('BarcodeScanner1.AfterScan', { result: 'ss-rei-01' });
    ok(LS.visible('ArrLesson') && LS.get('LblBarTitle') === 'सळई काम – मूलभूत', 'its QR code opens it offline (UPD-5)'); a.close(LS);
    const LQ = a.open('Learn', 'SS-REI-01'); for (let i = 0; i < 6; i++) LQ.fire('BtnNext.Click'); LQ.fire('BtnStartQuiz.Click');
    ok(a.top.get('LblQuestion') === 'mr REI q1?', 'its quiz comes from the update'); a.close(a.top); a.close(LQ);
    const LM = a.open('Learn', 'SS-MAS-01');
    ok(LM.get('ArrPic', 'Image') === 'SS-MAS-01_s1.jpg' && a.db['score_SS-MAS-01'] === 4, 'built-in lessons and scores unchanged (UPD-4)'); a.close(LM);
    a.offline = false;

    step('Day 17 · new lesson + changed label published later (UPD-6, App texts)');
    P({ action: 'saveString', token: TA, key: 'btn_start', mr: 'धडा सुरू करा', hi: 'पाठ शुरू करें', en: 'Start a lesson' });
    const CUR = makeLesson('CUR', { mr: 'क्युरिंग – मूलभूत', hi: 'क्योरिंग', en: 'Curing – Basic' });
    P({ action: 'publish', token: TA });
    const LU = a.open('Learn', '#scan'); LU.fire('BarcodeScanner1.AfterScan', { result: 'SS-CUR-01' });
    ok(LU.get('LblMsg') === 'हा धडा नवीन असू शकतो. सेटिंग्जमध्ये "नवीन धडे तपासा" दाबा.', 'online, not yet downloaded: "This lesson may be new" (UPD-6)', LU.get('LblMsg'));
    a.offline = true; LU.fire('BarcodeScanner1.AfterScan', { result: 'SS-CUR-01' });
    ok(LU.get('LblMsg') === 'हा धडा अजून ॲपमध्ये नाही. कृपया तुमच्या सुपरवायझरला विचारा.' && !LU.log.some((l) => /^ALERT: Unable/.test(l)), 'offline: the usual message, no error popup');
    a.offline = false; a.close(LU);
    ST.fire('BtnCheckUpd.Click');
    ok(ST.log.some((l) => l.startsWith('CHOOSE: नवीन धडे उपलब्ध: 2 धडे · 7 फाइल्स')), 'second update: only the 7 new files (old ones skipped, UPD-3)', ST.log.slice(-1)[0]);
    ST.fire('Notifier1.AfterChoosing', { choice: 'होय' });
    const H3 = a.open('Home');
    ok(a.db.content_version === 2 && a.db.dl_map.length === 14 && H3.get('BtnStart') === 'धडा सुरू करा', 'version 2; label changed by the Admin now on the Home tile');
    a.close(H3);

    step('Day 17 · clear downloads; reset progress keeps downloads');
    a.db.voice_speed = 'slow';
    ST.fire('BtnReset.Click'); ST.fire('Notifier1.AfterChoosing', { choice: 'होय' });
    ok(a.db['score_SS-MAS-01'] === undefined && a.db.content_version === 2 && a.db.voice_speed === 'slow' && a.db.adm_url === URL, 'Reset my progress clears only scores/progress');
    ST.fire('BtnClearDl.Click');
    ok(ST.log.some((l) => l.startsWith('CHOOSE: डाउनलोड केलेले धडे काढायचे?')), 'Clear downloaded lessons asks first');
    ST.fire('Notifier1.AfterChoosing', { choice: 'होय' });
    ok(Object.keys(a.files).length === 0 && a.db.dl_map === undefined && a.db.content_version === undefined && ST.get('LblDl') === 'डाउनलोड केलेल्या फाइल्स: 0 · आवृत्ती 0', 'files deleted, back to the built-in lessons');
    const LC = a.open('Learn');
    ok(LC.get('BtnModREI', 'Image') === 'tile_mod_rei_soon.png' && LC.get('BtnModMAS', 'Image') === 'tile_mod_mas.png', 'built-in lessons stay; downloaded ones gone'); a.close(LC);

    step('Day 17 · read-aloud (RAL-1..3)');
    const b2 = new App({ lang: 'mr' });
    const LR = b2.open('Learn', 'SS-MAS-01'); LR.fire('BtnNext.Click'); LR.fire('BtnSayStep.Click');
    ok(LR.log.includes('TTS mr 1: विटा स्वच्छ पाण्यात बुडबुडे येणे थांबेपर्यंत भिजवा. ओल्या विटा मसाल्यातील पाणी शोषत नाहीत.') && LR.get('TextToSpeech1', 'Country') === 'IND', 'step read aloud in Marathi, country IND, normal speed', LR.log.filter((l) => l.startsWith('TTS')).join(' | '));
    b2.db.voice_speed = 'slow'; LR.fire('BtnSayStep.Click');
    ok(LR.log.some((l) => l.startsWith('TTS mr 0.8:')), 'voice speed "slow" from Settings (RAL-2)');
    for (let i = 0; i < 7; i++) LR.fire('BtnNext.Click'); LR.fire('BtnSaySafety.Click'); LR.fire('BtnSayMist.Click');
    ok(LR.log.some((l) => l.startsWith('TTS mr 0.8: सुरक्षा खबरदारी. • हेल्मेट')) && LR.log.some((l) => l.startsWith('TTS mr 0.8: नेहमीच्या चुका. • कोरड्या')), 'safety box and mistakes box read aloud');
    b2.noVoice = true; LR.fire('BtnSaySafety.Click');
    ok(LR.log.some((l) => l.startsWith('ALERT: या भाषेचा वाचून दाखवणारा आवाज फोनमध्ये नाही.')), 'no Marathi voice on the phone -> install help (RAL-3)');
    b2.noVoice = false; LR.fire('BtnBack.Click');
    ok(LR.log.includes('TTS STOP'), 'speaking stops when leaving the lesson (RAL-2)');
    const LQ2 = b2.open('Learn', 'SS-MAS-01'); for (let i = 0; i < 8; i++) LQ2.fire('BtnNext.Click'); LQ2.fire('BtnStartQuiz.Click'); const QZ = b2.top;
    QZ.fire('BtnSayQ.Click');
    ok(QZ.log.some((l) => l.startsWith('TTS mr 0.8: विटा लावण्यापूर्वी पाण्यात का भिजवतात?. A.   त्या जड')), 'quiz question + options read aloud');

    step('Day 18 · Explain My Mistake ("Why?")');
    QZ.fire('BtnB.Click');
    ok(!QZ.visible('BtnWhy'), 'right answer: no Why? button');
    QZ.fire('BtnQNext.Click'); QZ.fire('BtnC.Click');
    ok(QZ.visible('BtnWhy') && QZ.get('BtnWhy') === 'का?' && QZ.visible('LblExplain'), 'wrong answer: saved explanation + blue Why? button (EXP-1)');
    b2.ai = (q, sys) => (sys.includes('Reply only in Marathi') ? 'सुमारे 10 मिमी सांधा मजबूत असतो.' : 'wrong language');
    QZ.fire('BtnWhy.Click');
    const why = b2.chats[b2.chats.length - 1];
    ok(why.q.includes('विटांचा सांधा किती जाड असावा?') && why.q.includes('C. मसाल्याची गरज नाही') && why.q.includes('A. सुमारे 10 मिमी') && why.q.includes('In Marathi'), 'prompt: question, worker answer, correct answer, language', why.q.slice(0, 120));
    ok(QZ.get('LblWhy') === 'AI उत्तर – सुपरवायझरकडून खात्री करा\nसुमारे 10 मिमी सांधा मजबूत असतो.', 'AI explanation shown with the AI label (AIR-2)');
    b2.offline = true; QZ.fire('BtnWhy.Click');
    ok(QZ.get('LblWhy') === 'AI ला इंटरनेट लागते. वर दिलेले कारण वाचा.' && QZ.visible('LblExplain'), 'offline: the saved explanation stays; friendly message (EXP-2)');
    b2.offline = false;

    step('Day 18 · Ask Saathi: suggestions, voice, related lesson, backup, offline');
    const c = new App({ lang: 'mr', adm_url: URL }, BK);
    c.ai = () => 'काँक्रीट किमान 7 दिवस ओले ठेवा. शंका असल्यास सुपरवायझरला विचारा.\nLESSON: SS-CON-01';
    const HA1 = c.open('Home'); HA1.fire('BtnAsk.Click'); const AK = c.top;
    ok(AK.name === 'Ask' && AK.get('LblAiNote') === 'AI उत्तर – सुपरवायझरकडून खात्री करा' && AK.get('BtnSug1') === 'क्युरिंग किती दिवस करायचे?', 'Ask Saathi: AI label, 4 suggested questions (ASK-1, ASK-5)');
    AK.fire('BtnSug1.Click');
    const ch = c.chats[c.chats.length - 1];
    ok(ch.q === 'क्युरिंग किती दिवस करायचे?' && /Reply only in Marathi/.test(ch.system) && /stop and ask your supervisor or engineer/.test(ch.system) && ch.system.includes('SS-CON-01 Concrete Work – Basic Procedure'), 'ChatBot persona: Marathi, construction-only, safety rule, lesson list (ASK-2)');
    ok(AK.get('LblChat').includes('<b>तुम्ही:</b> क्युरिंग किती दिवस करायचे?') && AK.get('LblChat').includes('काँक्रीट किमान 7 दिवस ओले ठेवा.') && !AK.get('LblChat').includes('LESSON:'), 'chat shows question and answer (lesson tag removed)');
    ok(AK.visible('BtnRelated') && AK.get('BtnRelated') === 'उघडा SS-CON-01', '"Open lesson SS-CON-01" button (ASK-3)');
    ok(AK.log.some((l) => l.startsWith('TTS mr 1: काँक्रीट किमान 7 दिवस')), 'answer spoken in Marathi (ASK-3)');
    ok(JSON.stringify(c.db.ai_log) === JSON.stringify([['mr', 'क्युरिंग किती दिवस करायचे?', 'काँक्रीट किमान 7 दिवस ओले ठेवा. शंका असल्यास सुपरवायझरला विचारा.']]), 'Q&A saved on the phone for the expert review, no names (ASK-6)');
    AK.fire('BtnRelated.Click');
    ok(c.top.name === 'Learn' && c.top.get('LblBarTitle') === 'काँक्रीट काम – मूलभूत पद्धत', 'related lesson opens'); c.top.fire('BtnBack.Click');
    c.speech = 'प्लास्टरला <तडे> का जातात?'; c.ai = () => 'पाणी कमी पडल्याने.';
    AK.fire('BtnMic.Click');
    ok(AK.get('SpeechRecognizer1', 'Language') === 'mr-IN' && c.chats[c.chats.length - 1].q === 'प्लास्टरला <तडे> का जातात?' && AK.get('LblChat').includes('&lt;तडे>'), 'voice question in Marathi (mr-IN) -> asked; text shown safely');
    ok(!AK.visible('BtnRelated'), 'no lesson tag -> no Open lesson button');
    c.ai = 'fail';
    AK.set('TxtAsk', 'Text', 'Curing kiti divas?'); AK.fire('BtnSend.Click');
    ok(AK.get('LblChat').includes('Keep it wet for 7 days. Ask your supervisor. [Marathi]'), 'MIT ChatBot fails -> Gemini free-tier backup answers (ASK-7)');
    c.offline = true; AK.fire('BtnSug2.Click');
    ok(AK.visible('ArrOffline') && AK.get('LblOffline') === 'साथीला इंटरनेट लागते. त्याऐवजी धडे उघडा.' && !AK.visible('LblThinking'), 'no internet -> "Saathi needs internet. Open the lessons instead." (ASK-4)');
    AK.fire('BtnToLessons.Click');
    ok(c.top.name === 'Learn' && c.top.visible('ArrModules'), 'button opens the lessons'); c.top.fire('BtnBack.Click');
    AK.fire('BtnNewChat.Click');
    ok(AK.get('LblChat') === '' && AK.log.includes('CHAT RESET') && !AK.visible('ArrOffline'), 'New chat clears (ASK-5)');
    const d = new App({ lang: 'en' }); d.ai = 'fail'; const AK2 = d.open('Ask'); AK2.fire('BtnSug3.Click');
    ok(AK2.visible('ArrOffline'), 'no server address and ChatBot fails -> offline message (never a crash)');
  }

  // ===================================================================================
  // Day 19 (admin build): Supervisor Mode, smart revision, Helmet Check
  if (Object.keys(FILES).some((k) => k.endsWith('/Admin.scm'))) {
    step('Day 19 · Supervisor Mode: PIN, workers, who is learning, table, share (SUP-1..4)');
    const s = new App({ lang: 'mr' }); s.now = Date.parse('2026-12-06T10:00:00+05:30');
    const SE = s.open('Settings'); SE.fire('BtnSupervisor.Click'); const K = s.top;
    ok(K.name === 'Skills' && K.visible('ArrSupPin') && !K.visible('ArrSkBody') && K.get('LblPinHead') === 'नवीन 4 अंकी PIN ठरवा', 'Settings -> Supervisor mode -> first use: set a 4-digit PIN');
    K.set('PwdPin', 'Text', '12'); K.fire('BtnPinOk.Click');
    ok(K.get('LblPinMsg') === 'नवीन 4 अंकी PIN ठरवा' && s.db.sup_pin === undefined, 'PIN must have 4 digits');
    K.set('PwdPin', 'Text', '4826'); K.fire('BtnPinOk.Click');
    ok(K.visible('ArrSup') && s.db.sup_pin === '4826', 'PIN saved on the phone; supervisor page opens');
    K.set('TxtWName', 'Text', 'Ramesh Patil'); K.fire('LpTrade.BeforePicking');
    ok(JSON.stringify(K.get('LpTrade', 'Elements')) === JSON.stringify(['गवंडी', 'मदतनीस', 'सळई कामगार', 'काँक्रीट कामगार', 'इतर']), 'trades in Marathi');
    K.set('LpTrade', 'SelectionIndex', 1); K.fire('LpTrade.AfterPicking'); K.fire('BtnAddW.Click');
    K.set('TxtWName', 'Text', 'Sunita'); K.set('LpTrade', 'SelectionIndex', 2); K.fire('LpTrade.AfterPicking'); K.fire('BtnAddW.Click');
    ok(JSON.stringify(s.db.workers) === JSON.stringify([[1, 'Ramesh', 'trade_mason'], [2, 'Sunita', 'trade_helper']]), 'workers stored as first name + trade only (surname dropped, SUP-2)', JSON.stringify(s.db.workers));
    K.fire('BtnSupLock.Click');
    ok(K.visible('ArrSkBody') && !K.visible('ArrSup'), 'Close Supervisor mode -> back to My Skills');
    const L = s.open('Learn', 'SS-MAS-01');
    ok(L.log.length >= 0 && JSON.stringify(L.get('LpWho', 'Elements')) === JSON.stringify(['Ramesh (गवंडी)', 'Sunita (मदतनीस)', 'मी स्वतः']) && L.get('LpWho', 'Title') === 'कोण शिकत आहे?', '"Who is learning?" before the lesson (SUP-3)');
    L.set('LpWho', 'SelectionIndex', 1); L.fire('LpWho.AfterPicking');
    for (let i = 0; i < 8; i++) L.fire('BtnNext.Click'); L.fire('BtnStartQuiz.Click'); const Q = s.top;
    ['B', 'A', 'D', 'C', 'B'].forEach((x) => { Q.fire(`Btn${x}.Click`); Q.fire('BtnQNext.Click'); });
    ok(s.db['w_1_score_SS-MAS-01'] === 4 && s.db['score_SS-MAS-01'] === 4, 'Ramesh\'s score saved for him (4/5) and in My Skills');
    s.close(Q); s.close(L);
    const L2 = s.open('Learn', 'SS-SAF-01'); L2.set('LpWho', 'SelectionIndex', 3); L2.fire('LpWho.AfterPicking');
    ok(s.db.cur_worker === undefined, '"Myself" -> no worker'); s.close(L2);
    SE.fire('BtnSupervisor.Click'); const K2 = s.top;
    for (let i = 1; i <= 4; i++) { K2.set('PwdPin', 'Text', '0000'); K2.fire('BtnPinOk.Click'); }
    ok(K2.get('LblPinMsg') === 'चुकीचा PIN. 1 प्रयत्न बाकी.', 'wrong PIN -> tries left', K2.get('LblPinMsg'));
    K2.set('PwdPin', 'Text', '0000'); K2.fire('BtnPinOk.Click');
    K2.set('PwdPin', 'Text', '4826'); K2.fire('BtnPinOk.Click');
    ok(K2.get('LblPinMsg') === '5 चुकीचे प्रयत्न. 1 मिनिट थांबा.' && !K2.visible('ArrSup'), '5 wrong -> wait 1 minute, even the right PIN (SUP-1)');
    s.now += 61000; K2.set('PwdPin', 'Text', '4826'); K2.fire('BtnPinOk.Click');
    ok(K2.visible('ArrSup'), 'after 1 minute the right PIN works');
    ok(K2.get('LblSupTable').includes('<b>Ramesh</b> (गवंडी): CON –  MAS 4/5  SAF –') && K2.get('LblSupTable').includes('<b>Sunita</b> (मदतनीस)'), 'table: workers × lessons with scores (SUP-4)', K2.get('LblSupTable'));
    K2.fire('BtnShareSum.Click');
    const sh = K2.log.find((l) => l.startsWith('SHARE '));
    ok(sh && sh.includes('SITE SAATHI – कामगारांची प्रगती') && sh.includes('Ramesh (गवंडी): CON –  MAS 4/5') && !sh.includes('<b>'), 'summary shared as plain text through the phone\'s share menu', sh);

    step('Day 19 · smart revision (FR-17, rule-based)');
    const r = new App({ lang: 'mr', 'score_SS-CON-01': 2, 'score_SS-MAS-01': 4 });
    const H = r.open('Home');
    ok(H.visible('BtnRevise') && H.get('BtnRevise') === 'तुमच्यासाठी सुचवलेले: पुन्हा करा – काँक्रीट काम – मूलभूत पद्धत (2/5)', 'Home: "Suggested for you: Repeat Concrete work (2/5)"', H.get('BtnRevise'));
    H.fire('BtnRevise.Click');
    ok(r.top.name === 'Learn' && r.top.get('LblBarTitle') === 'काँक्रीट काम – मूलभूत पद्धत', 'opens that lesson'); r.top.fire('BtnBack.Click');
    const K3 = r.open('Skills');
    ok(K3.visible('BtnRevSk') && K3.get('BtnRevSk') === H.get('BtnRevise'), 'same suggestion in My Skills'); r.close(K3);
    r.db['score_SS-CON-01'] = 3; const H2 = r.open('Home');
    ok(!H2.visible('BtnRevise'), 'scores of 3/5 or more: no suggestion');

    step('Day 19 · Helmet Check (on-device model; photo stays on the phone)');
    const h = new App({ lang: 'mr' });
    const HH = h.open('Home');
    ok(HH.visible('BtnSafety') && HH.get('BtnSafety') === 'सुरक्षा तपासणी\nAI · कॅमेरा', 'Safety Check tile: AI, camera (HOM-2)');
    HH.fire('BtnSafety.Click'); const SF = h.top;
    ok(SF.name === 'Safety' && SF.get('LblDiscl') === 'फक्त प्रशिक्षणासाठी. ही सुरक्षा तपासणी नाही.' && SF.get('LblStays') === 'फोटो फोनवरच राहतो, कुठेही पाठवला जात नाही.', 'disclaimer "Training aid only" + "photo stays on this phone" (HLM-4)');
    SF.fire('BtnTakePhoto.Click');
    ok(String(SF.get('ImgPhoto', 'Picture')).endsWith('app_inventor_1.jpg') && SF.get('LblSafMsg') === 'आधी Personal Image Classifier एक्सटेंशन आणि मॉडेल जोडा (मार्गदर्शक पाहा).', 'before the model is added: clear message');
    SF.callProc('showHelmet', [['helmet', 0.92], ['no helmet', 0.08]]);
    ok(SF.visible('LblHelmetOk') && !SF.visible('LblHelmetNo') && SF.get('LblConf') === 'खात्री: 92%', 'model says helmet -> "Helmet on – stay safe", confidence 92% (HLM-3)');
    SF.callProc('showHelmet', [['helmet', 0.21], ['no_helmet', 0.79]]);
    ok(SF.visible('LblHelmetNo') && !SF.visible('LblHelmetOk') && SF.get('LblConf') === 'खात्री: 79%', 'no helmet -> "please wear your helmet", 79%');
    SF.fire('BtnSafLesson.Click');
    ok(h.top.name === 'Learn' && h.top.get('LblBarTitle') === 'बांधकाम साइट सुरक्षा – मूलभूत खबरदारी', 'link to the Safety lesson'); h.top.fire('BtnBack.Click');
    const onSafety = Object.keys(FILES).find((k) => k.endsWith('/Safety.scm'));
    ok(!/"\$Type":"(Web|ChatBot)"/.test(FILES[onSafety].toString()), 'Safety screen has no internet component: photos are never uploaded (HLM-2, AIR-3)');
    SF.fire('Safety.ErrorOccurred', { component: 'PersonalImageClassifier1', functionName: 'ClassifyImageData', errorNumber: 1, message: 'model' });
    ok(h.db.helmet_supported === 'no' && SF.log.includes('ALERT: हा फोन हेल्मेट तपासणीला सपोर्ट करत नाही.'), 'classifier error -> "not supported" (HLM-5)');
    h.close(SF); h.close(HH); const HH2 = h.open('Home');
    ok(!HH2.visible('BtnSafety'), 'tile hidden on that phone from now on (HLM-5)');

    step('rc8 · First setup and Server keys inside Admin Mode (no typing in Script Properties)');
    {
      const NB = require('./test-backend.js').makeBackend({ props: { PEPPER: null, TOKEN_SECRET: null, CLOUDINARY_CLOUD_NAME: null, CLOUDINARY_API_KEY: null, CLOUDINARY_API_SECRET: null, GEMINI_API_KEY: null } });
      const na = new App({ lang: 'en', adm_url: 'https://script.google.com/macros/s/NEW/exec' }, NB);
      const S0 = na.open('Settings'); S0.fire('BtnAbout.Click'); for (let i = 0; i < 5; i++) S0.fire('BtnVersion.Click');
      const AD = na.top;
      ok(AD.name === 'Admin' && AD.visible('ArrSetup') && !AD.visible('ArrLogin') && AD.get('LblBarTitle') === 'First setup', 'brand-new server -> Admin Mode opens First setup', AD.get('LblBarTitle'));
      const code = String(NB.api.readTable_('setup')[0].value);
      AD.set('TxtSetCode', 'Text', '111111').set('TxtSetName', 'Text', 'Vaibhav').set('TxtSetEmail', 'Text', 'v@example.com').set('PwdSetPass', 'Text', 'admin-pass-1');
      AD.fire('BtnCreateAdmin.Click');
      ok(AD.visible('ArrSetup') && /Wrong setup code/.test(AD.get('LblStatus')), 'wrong code -> clear message, stays on First setup', AD.get('LblStatus'));
      AD.set('TxtSetCode', 'Text', code); AD.fire('BtnCreateAdmin.Click');
      ok(AD.visible('ArrDash') && AD.get('LblBarSub') === 'Vaibhav · Admin' && na.db.adm_token && AD.get('PwdSetPass') === '' && AD.get('TxtSetCode') === '', 'code from the Google Sheet -> first Admin created, logged in, dashboard; password and code cleared');
      ok(AD.visible('ArrKeysRow'), 'Admin sees "Server keys" on the dashboard');
      AD.fire('BtnKeysOpen.Click');
      ok(AD.visible('ArrKeys') && AD.get('LblKCl') === 'Cloudinary – photos and audio: not set' && AD.get('ImgKCl', 'Picture') === 'ic_box_mistake.png', 'Server keys page: Cloudinary not set yet', AD.get('LblKCl'));
      AD.set('TxtKCloud', 'Text', 'demo').set('TxtKKey', 'Text', '123').set('PwdKSecret', 'Text', 'wrong');
      AD.fire('BtnSaveKeys.Click');
      ok(/did not accept/.test(AD.get('LblStatus')) && AD.get('PwdKSecret') === 'wrong' && !NB.props.CLOUDINARY_API_SECRET, 'wrong keys -> tested by the server, refused; fields kept to fix', AD.get('LblStatus'));
      AD.set('PwdKSecret', 'Text', 'good-secret').set('PwdKGem', 'Text', 'good-gemini'); AD.fire('BtnSaveKeys.Click');
      ok(AD.get('ImgKCl', 'Picture') === 'st_done.png' && /saved$/.test(AD.get('LblKGm')) && AD.get('LblStatus') === 'Saved: Cloudinary + Gemini' && NB.props.CLOUDINARY_API_SECRET === 'good-secret' && NB.props.GEMINI_API_KEY === 'good-gemini',
        'right keys -> saved on the server; status shows saved', AD.get('LblStatus'));
      ok(['TxtKCloud', 'TxtKKey', 'PwdKSecret', 'PwdKGem'].every((x) => AD.get(x) === '') && !JSON.stringify(na.db).includes('good-'), 'keys cleared from the screen and never stored on the phone');
      AD.fire('BtnBack.Click');
      ok(AD.visible('ArrDash'), 'Back -> dashboard');
      NB.post({ action: 'addMember', token: na.db.adm_token, email: 'w@example.com', name: 'Sneha', role: 'Writer', password: 'writer-pass-1' });
      AD.fire('BtnLogout.Click'); AD.set('TxtEmail', 'Text', 'w@example.com').set('PwdPass', 'Text', 'writer-pass-1'); AD.fire('BtnLogin.Click');
      ok(AD.visible('ArrDash') && !AD.visible('ArrKeysRow'), 'Writer does not see Server keys');
    }
  }

  // ===================================================================================
  // UI v2: every label/button gets its translated text (also parts added later, e.g. Supervisor mode)
  step('UI v2 · no raw [label_key] text on any screen, in any language');
  for (const lang of ['mr', 'hi', 'en']) {
    const names = Object.keys(FILES).filter((k) => k.endsWith('.scm')).map((k) => k.split('/').pop().replace('.scm', ''));
    const raw = [];
    for (const n of names) {
      const scr = new App({ lang }).open(n, n === 'Learn' ? '' : '');
      for (const [cn, c] of Object.entries(scr.comps)) if (typeof c.Text === 'string' && /^[[a-z0-9_]+]$/.test(c.Text)) raw.push(`${n}.${cn}=${c.Text}`);
    }
    ok(raw.length === 0, `${lang}: all ${names.length} screens show real text, no [key] placeholders`, raw.join(' '));
  }

  // ===================================================================================
  step('Motion · press animation, Home pop-in, quiz pulse and score count-up');
  {
    const m = new App({ lang: 'en' });
    const H = m.open('Home');
    for (let i = 0; i < 16; i++) H.fire('ClockIntro.Timer');
    ok(['BtnStart', 'BtnScan', 'BtnSkills', 'BtnSettings'].every((x) => H.get(x, 'Height') === 160) && H.get('ClockIntro', 'TimerEnabled') === false, 'Home tiles pop in and end at full size (160 dp); animation stops');
    H.fire('BtnStart.TouchDown');
    ok(H.get('BtnStart', 'Image') === 'tile_home_start_p.png', 'finger down -> pressed picture');
    H.fire('BtnStart.TouchUp');
    ok(H.get('BtnStart', 'Image') === 'tile_home_start.png', 'finger up -> normal picture');
    const S = m.open('Settings'); S.fire('BtnLHi.Click');
    S.fire('BtnLHi.TouchDown'); S.fire('BtnLHi.TouchDown'); S.fire('BtnLHi.TouchUp');
    ok(S.get('BtnLHi', 'Image') === 'bg_btn_yellow_t.png', 'press works on a picture changed by the app (selected language stays yellow)', S.get('BtnLHi', 'Image'));
    m.close(S); m.close(H);
    const q = new App({ lang: 'en' }); const L = q.open('Learn', 'SS-MAS-01');
    for (let i = 0; i < 8; i++) L.fire('BtnNext.Click'); L.fire('BtnStartQuiz.Click'); const Q = q.top;
    Q.fire('BtnB.Click');
    for (let i = 0; i < 8; i++) Q.fire('ClockPulse.Timer');
    ok(Q.get('BtnB', 'Height') === 64 && Q.get('ClockPulse', 'TimerEnabled') === false, 'right answer pulses and settles back to 64 dp');
    ['A', 'D', 'C', 'A'].forEach((x) => { Q.fire('BtnQNext.Click'); Q.fire(`Btn${x}.Click`); }); Q.fire('BtnQNext.Click');
    const finalText = Q.get('LblScoreBig');
    for (let i = 0; i < 15; i++) Q.fire('ClockGrow.Timer');
    ok(finalText === '5 / 5' && Q.get('LblScoreBig') === '5 / 5' && Q.get('ArrRing', 'Image') === 'ring_5.png', 'score counts up and ends at 5 / 5; the ring fills all 5 segments', `${Q.get('LblScoreBig')} ${Q.get('ArrRing', 'Image')}`);
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  if (process.argv.includes('--report')) {   // for the Day 13 testing report (laptop simulation results only)
    const out = require('path').resolve(__dirname, '..', 'testing', 'automated_results.json');
    fs.mkdirSync(require('path').dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify({ ran_at: new Date().toISOString(), aia: AIA, app_version: VER, passed: pass, failed: fail, results: RESULTS }, null, 1));
    console.log('Wrote ' + out);
  }
  process.exit(fail ? 1 : 0);
}
