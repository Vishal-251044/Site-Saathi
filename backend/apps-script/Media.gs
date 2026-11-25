/**
 * SITE SAATHI API · Media.gs
 * action=uploadMedia (Writer, Admin) - ADM-4, ADM-5. The phone sends the file as base64 (Base64 extension).
 *   id, kind = image | audio, step_no (image) or lang (audio), ext (jpg, png, mp3, m4a, 3gp, aac), data (base64)
 * Cloudinary free plan (signed upload, keys only in Script Properties), folder site-saathi/<lessonId>/.
 * Audio is converted to MP3 by Cloudinary (format=mp3). Without Cloudinary keys, Google Drive is used (backup).
 * The returned link is saved straight into the sheet (steps.image_url or lesson_text.audio_url).
 */

const MIME_ = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', mp3: 'audio/mpeg', m4a: 'audio/mp4', '3gp': 'audio/3gpp', aac: 'audio/aac' };
const MAX_MB_ = { image: 8, audio: 8 };   // phone camera photos can be large; Cloudinary shrinks them on upload

function uploadMedia_(p, u) {
  const row = lessonRow_(p.id); checkEditable_(row, u);
  const kind = String(p.kind);
  const ext = String(p.ext || '').toLowerCase().replace('.', '');
  if (kind !== 'image' && kind !== 'audio') throw new Error('kind must be image or audio.');
  if (!MIME_[ext] || (kind === 'image') !== /^(jpg|jpeg|png)$/.test(ext)) throw new Error('File type .' + ext + ' is not allowed for ' + kind + '.');
  const data = String(p.data || '').replace(/^data:[^,]*,/, '').replace(/\s/g, '');
  if (!data) throw new Error('No file data received. Tap Retry.');
  const mb = data.length * 0.75 / 1048576;
  if (mb > MAX_MB_[kind]) throw new Error('File too big (' + mb.toFixed(1) + ' MB). Limit ' + MAX_MB_[kind] + ' MB; use a smaller photo or shorter audio.');
  let name;
  if (kind === 'image') {
    const n = Number(p.step_no);
    if (!(n >= 1 && n <= 10)) throw new Error('Step number must be 1 to 10.');
    name = row.lesson_id + '_s' + n;
  } else {
    if (LANGS.indexOf(p.lang) < 0) throw new Error('Language must be mr, hi or en.');
    name = row.lesson_id + '_' + p.lang;
  }
  const res = getProp_('CLOUDINARY_API_SECRET', false) ? toCloudinary_(row.lesson_id, name, kind, MIME_[ext], data) : toDrive_(row.lesson_id, name + '.' + ext, MIME_[ext], data);
  if (kind === 'image') upsert_('steps', ['lesson_id', 'step_no'], { lesson_id: row.lesson_id, step_no: Number(p.step_no), image_url: res.url });
  else upsert_('lesson_text', ['lesson_id', 'lang'], { lesson_id: row.lesson_id, lang: p.lang, audio_url: res.url });
  touch_(row, u);
  return { url: res.url, provider: res.provider, missing: missing_(row.lesson_id) };
}

/** Signed upload: signature = SHA-1 of the sorted parameters + API secret (Cloudinary docs). */
function toCloudinary_(lessonId, publicId, kind, mime, data) {
  const cloud = getProp_('CLOUDINARY_CLOUD_NAME', true), key = getProp_('CLOUDINARY_API_KEY', true), secret = getProp_('CLOUDINARY_API_SECRET', true);
  const params = { folder: 'site-saathi/' + lessonId, overwrite: 'true', public_id: publicId, timestamp: String(Math.floor(now_() / 1000)) };
  if (kind === 'audio') params.format = 'mp3';           // phones play MP3 offline (AUD-2)
  else params.transformation = 'c_limit,w_1080,q_auto';  // shrink big phone photos to 1080 px wide (ADM-4, PRD 07)
  const toSign = Object.keys(params).sort().map(function (k) { return k + '=' + params[k]; }).join('&');
  params.signature = hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_1, toSign + secret, Utilities.Charset.UTF_8));
  params.api_key = key;
  params.file = 'data:' + mime + ';base64,' + data;
  const type = kind === 'image' ? 'image' : 'video';      // Cloudinary stores audio as resource type "video"
  const resp = UrlFetchApp.fetch('https://api.cloudinary.com/v1_1/' + cloud + '/' + type + '/upload', { method: 'post', payload: params, muteHttpExceptions: true });
  let out;
  try { out = JSON.parse(resp.getContentText()); } catch (e) { throw new Error('Cloudinary did not answer properly. Tap Retry.'); }
  if (resp.getResponseCode() !== 200 || !out.secure_url) throw new Error('Cloudinary: ' + ((out.error && out.error.message) || ('error ' + resp.getResponseCode())));
  return { url: out.secure_url, provider: 'cloudinary' };
}

/** Backup: save in the Drive folder "SITE SAATHI Media/<lessonId>/" and return a direct-download link. */
function toDrive_(lessonId, fileName, mime, data) {
  const rootId = getProp_('DRIVE_FOLDER_ID', false);
  if (!rootId) throw new Error('Setup missing: set Cloudinary keys or DRIVE_FOLDER_ID in Script Properties.');
  const root = DriveApp.getFolderById(rootId);
  const it = root.getFoldersByName(lessonId);
  const folder = it.hasNext() ? it.next() : root.createFolder(lessonId);
  const old = folder.getFilesByName(fileName);
  while (old.hasNext()) old.next().setTrashed(true);
  const file = folder.createFile(Utilities.newBlob(Utilities.base64Decode(data), mime, fileName));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return { url: 'https://drive.google.com/uc?export=download&id=' + file.getId(), provider: 'drive' };
}
