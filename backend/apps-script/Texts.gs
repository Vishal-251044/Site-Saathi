/**
 * SITE SAATHI API · Texts.gs
 * App texts editor (Admin): change button labels and messages in 3 languages without a new APK (PRD 10.13.3).
 * QR codes screen: each lesson's code, poster place and printed yes/no (PRD 10.13.3, QR-5).
 */

function listStrings_() { return { strings: readTable_('strings').map(function (s) { return { key: s.key, mr: s.mr, hi: s.hi, en: s.en }; }) }; }

/** action=saveString (Admin): key, mr, hi, en. All three languages are required (LNG-3). */
function saveString_(p) {
  const key = String(p.key || '').trim();
  if (!/^[a-z0-9_]+$/.test(key)) throw new Error('Key must use small letters, numbers and _ only.');
  const s = { key: key };
  LANGS.forEach(function (l) { s[l] = String(p[l] || '').trim(); if (!s[l]) throw new Error('Fill the ' + l + ' text.'); });
  upsert_('strings', ['key'], s);
  return { key: key };
}

/** Free QR image link with only the lesson ID inside (QR-2). Poster PDFs for printing: tools/build-qr.js. */
function qrUrl_(id) { return 'https://api.qrserver.com/v1/create-qr-code/?size=600x600&ecc=Q&data=' + encodeURIComponent(id); }

function listQr_() {
  const qr = readTable_('qr');
  return { qr: readTable_('lessons').filter(function (l) { return l.status !== STATUS.HIDDEN; }).map(function (l) {
    const q = qr.filter(function (x) { return same_(x.lesson_id, l.lesson_id); })[0] || {};
    return { id: l.lesson_id, status: l.status, poster_location: q.poster_location || '', printed: q.printed || 'no', printed_on: q.printed_on || '', qr_url: qrUrl_(l.lesson_id) };
  }) };
}

/** action=saveQr (Admin, Writer): id, poster_location, printed (yes/no). */
function saveQr_(p) {
  lessonRow_(p.id);
  const printed = String(p.printed).toLowerCase() === 'yes' ? 'yes' : 'no';
  upsert_('qr', ['lesson_id'], { lesson_id: p.id, poster_location: String(p.poster_location || '').trim(), printed: printed, printed_on: printed === 'yes' ? today_().slice(0, 10) : '' });
  return {};
}
