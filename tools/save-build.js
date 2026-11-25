// save-build.js — keep every build in builds/ with its version, so nothing is overwritten by mistake.
//
//   node tools/save-build.js                       -> snapshot both .aia files (worker + admin) into builds/
//   node tools/save-build.js --apk <file.apk>      -> also store an APK you downloaded from App Inventor (worker build)
//   node tools/save-build.js --admin --apk <file>  -> same for the admin build (v1.1 line)
//   node tools/save-build.js --admin --from-downloads  -> take the newest SITE_SAATHI*.apk from your Downloads folder
//
// Layout:  builds/<worker|admin>/v<version>/SITE_SAATHI[_admin]_v<version>.(aia|apk)  +  builds/VERSIONS.md (log)
// Rule: one version = one build. If a file for that version already exists with different contents,
// the script stops and asks you to raise the version in tools/build-app.js (VersionCode must always go up).
// No keys or keystores are ever copied here.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const os = require('os');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'builds');
const LOG = path.join(OUT, 'VERSIONS.md');
const VARIANTS = {
  worker: { aia: 'app-inventor/SITE_SAATHI.aia', base: 'SITE_SAATHI' },
  admin: { aia: 'app-inventor/SITE_SAATHI_admin.aia', base: 'SITE_SAATHI_admin' },
};

function fail(msg) { console.error('ERROR: ' + msg); process.exit(1); }
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

// Read VersionName / VersionCode from Screen1.scm inside the .aia (plain zip)
function aiaVersion(file) {
  const b = fs.readFileSync(file);
  const sig = Buffer.from([0x50, 0x4b, 3, 4]);
  let i = 0;
  while ((i = b.indexOf(sig, i)) >= 0) {
    const method = b.readUInt16LE(i + 8), size = b.readUInt32LE(i + 18);
    const n = b.readUInt16LE(i + 26), x = b.readUInt16LE(i + 28);
    const name = b.slice(i + 30, i + 30 + n).toString();
    if (name.endsWith('/Screen1.scm')) {
      const d = b.slice(i + 30 + n + x, i + 30 + n + x + size);
      const t = (method ? zlib.inflateRawSync(d) : d).toString();
      const vn = (t.match(/"VersionName":"([^"]+)"/) || [])[1];
      const vc = (t.match(/"VersionCode":"([^"]+)"/) || [])[1];
      if (!vn || !vc) fail(`${file}: VersionName/VersionCode not found`);
      return { name: vn, code: vc };
    }
    i += 30 + n + x + size;
  }
  fail(`${file}: Screen1.scm not found (is this an App Inventor project?)`);
}

// Copy src -> dest; same contents = nothing to do; different contents = stop (version must be raised)
function store(src, dest, what) {
  const data = fs.readFileSync(src);
  if (fs.existsSync(dest)) {
    if (sha(fs.readFileSync(dest)) === sha(data)) { console.log(`  = ${what} already saved: ${path.relative(ROOT, dest)}`); return null; }
    fail(`${path.relative(ROOT, dest)} already exists with DIFFERENT contents.\n` +
      `  Raise the version in tools/build-app.js (VersionCode +1), rebuild, then save again. Old builds are never overwritten.`);
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, data);
  console.log(`  + ${what} saved: ${path.relative(ROOT, dest)} (${Math.round(data.length / 1024)} KB)`);
  return { sha: sha(data).slice(0, 12), kb: Math.round(data.length / 1024) };
}

function logRow(variant, v, kind, info, note) {
  if (!fs.existsSync(LOG)) {
    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(LOG, '# SITE SAATHI · build versions\n\n' +
      'Written by `node tools/save-build.js`. One row per saved file. Never edit or delete old rows.\n' +
      'APK = built by MIT App Inventor (Build → Android App) from the .aia of the same version.\n\n' +
      '| Date | Build | Version | Code | File | Size | SHA-256 (first 12) | Note |\n|---|---|---|---|---|---|---|---|\n');
  }
  const d = new Date(), p2 = (n) => String(n).padStart(2, '0');   // local time (IST on this laptop)
  const date = `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
  fs.appendFileSync(LOG, `| ${date} | ${variant} | ${v.name} | ${v.code} | ${kind} | ${info.kb} KB | \`${info.sha}\` | ${note || ''} |\n`);
}

// App Inventor downloads <project name>.apk; the browser may add " (1)" for repeats
function newestDownloadApk(admin) {
  const dl = path.join(os.homedir(), 'Downloads');
  if (!fs.existsSync(dl)) fail('Downloads folder not found; use --apk <path>');
  const re = admin ? /^SITE_SAATHI_admin( \(\d+\))?\.apk$/i : /^SITE_SAATHI( \(\d+\))?\.apk$/i;
  const apks = fs.readdirSync(dl).filter((f) => re.test(f))
    .map((f) => ({ f: path.join(dl, f), t: fs.statSync(path.join(dl, f)).mtimeMs })).sort((a, b) => b.t - a.t);
  if (!apks.length) fail(`No ${admin ? 'SITE_SAATHI_admin' : 'SITE_SAATHI'}.apk in Downloads. Build it in App Inventor first (Build → Android App (.apk)).`);
  console.log('Using ' + apks[0].f + ' (' + new Date(apks[0].t).toLocaleString() + ')');
  return apks[0].f;
}

try {
  const args = process.argv.slice(2);
  const admin = args.includes('--admin');
  const ai = args.indexOf('--apk');
  const apkPath = ai >= 0 ? args[ai + 1] : (args.includes('--from-downloads') ? newestDownloadApk(admin) : null);
  const note = (() => { const k = args.indexOf('--note'); return k >= 0 ? args[k + 1] : ''; })();

  for (const [variant, cfg] of Object.entries(VARIANTS)) {
    const src = path.join(ROOT, cfg.aia);
    if (!fs.existsSync(src)) { console.log(`- ${variant}: ${cfg.aia} missing, skipped`); continue; }
    const v = aiaVersion(src);
    const dir = path.join(OUT, variant, 'v' + v.name);
    console.log(`${variant}: v${v.name} (code ${v.code})`);
    const a = store(src, path.join(dir, `${cfg.base}_v${v.name}.aia`), '.aia');
    if (a) logRow(variant, v, '.aia', a, 'generated by tools/build-app.js');
    if (apkPath && (variant === 'admin') === admin) {
      if (!fs.existsSync(apkPath)) fail('APK not found: ' + apkPath);
      if (!/\.apk$/i.test(apkPath)) fail('not an .apk file: ' + apkPath);
      const p = store(apkPath, path.join(dir, `${cfg.base}_v${v.name}.apk`), '.apk');
      if (p) logRow(variant, v, '.apk', p, note || 'App Inventor build');
    }
  }
  console.log('Log: builds/VERSIONS.md');
} catch (e) {
  fail(e.message);
}
