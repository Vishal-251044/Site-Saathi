/**
 * SITE SAATHI API · Publish.gs
 * action=publish (Admin): Approved lessons -> pub_* tabs in the app's CSV format, content version +1, publish log (ADM-7).
 *   Published lessons that are being edited again keep their last published copy until they are re-approved.
 *   Hidden lessons are removed (UPD-7). Media: Cloudinary/Drive links become file names like SS-REI-01_s1.jpg.
 * getPublished (GET, no login): manifest + CSV texts + file list for phones (Day 17, UPD-2..UPD-5).
 */

function extOf_(url, dflt) { const m = String(url).split('?')[0].match(/\.([a-z0-9]{2,4})$/i); return m ? m[1].toLowerCase() : dflt; }

/** Builds the phone rows (3 languages) + media files for one lesson from the editing tables. */
function buildPublished_(L, texts, steps, quiz) {
  const st = steps.filter(function (s) { return same_(s.lesson_id, L.lesson_id); }).sort(function (a, b) { return a.step_no - b.step_no; });
  const files = [];
  const img = st.map(function (s) {
    const u = String(s.image_url);
    if (!/^https?:/i.test(u)) return u;                         // bundled MVP picture (already in the APK)
    const name = L.lesson_id + '_s' + s.step_no + '.' + extOf_(u, 'jpg');
    files.push({ name: name, url: u, lesson_id: L.lesson_id });
    return name;
  }).join('|');
  const lessons = LANGS.map(function (l) {
    const t = texts.filter(function (x) { return same_(x.lesson_id, L.lesson_id) && x.lang === l; })[0] || {};
    let audio = String(t.audio_url || '');
    if (audio === READ_ALOUD) audio = '';
    else if (/^https?:/i.test(audio)) { const name = L.lesson_id + '_' + l + '.' + extOf_(audio, 'mp3'); files.push({ name: name, url: audio, lesson_id: L.lesson_id }); audio = name; }
    return { id: L.lesson_id, module: L.module_code, lang: l, title: t.title, desc: t.description, objective: t.objective, materials: t.materials,
      steps: st.map(function (s) { return String(s['text_' + l] || '').replace(/\|/g, '/'); }).join('|'), safety: t.safety, mistakes: t.mistakes, img: img, audio: audio, duration_min: L.duration_min };
  });
  const q = quiz.filter(function (x) { return same_(x.lesson_id, L.lesson_id); }).map(function (x) { return Object.assign({}, x); });
  return { lessons: lessons, quiz: q, files: files };
}

function publish_(p, u) {
  const lessons = readTable_('lessons'), texts = readTable_('lesson_text'), steps = readTable_('steps'), quiz = readTable_('quiz');
  const old = { lessons: readTable_('pub_lessons'), quiz: readTable_('pub_quiz'), files: readTable_('pub_files') };
  const approved = lessons.filter(function (l) { return l.status === STATUS.APPROVED; });
  if (!approved.length && String(p.force) !== 'true') throw new Error('Nothing approved to publish.');
  const out = { lessons: [], quiz: [], files: [] };
  let count = 0;
  lessons.forEach(function (L) {
    if (L.status === STATUS.HIDDEN) return;                                          // removed from phones
    if (L.status === STATUS.APPROVED || L.status === STATUS.PUBLISHED) {
      const b = buildPublished_(L, texts, steps, quiz);
      out.lessons = out.lessons.concat(b.lessons); out.quiz = out.quiz.concat(b.quiz); out.files = out.files.concat(b.files); count++;
    } else {                                                                         // being edited: keep the last published copy
      const keep = function (r) { return same_(r.id || r.lesson_id, L.lesson_id); };
      const kl = old.lessons.filter(keep);
      if (kl.length) { out.lessons = out.lessons.concat(kl); out.quiz = out.quiz.concat(old.quiz.filter(keep)); out.files = out.files.concat(old.files.filter(keep)); count++; }
    }
  });
  const version = Number((readTable_('manifest')[0] || {}).content_version || 0) + 1;
  writeTable_('pub_lessons', out.lessons);
  writeTable_('pub_quiz', out.quiz);
  writeTable_('pub_files', out.files);
  writeTable_('pub_strings', readTable_('strings'));
  writeTable_('manifest', [{ content_version: version, published_on: today_(), lessons_count: count }]);
  approved.forEach(function (L) { upsert_('lessons', ['lesson_id'], { lesson_id: L.lesson_id, status: STATUS.PUBLISHED }); });
  appendRow_('publish_log', { version: version, published_by: u.email, date: today_(), lessons_count: count, change_note: String(p.note || '').trim() });
  return { version: version, lessons_count: count, files: out.files.length, published: approved.map(function (L) { return L.lesson_id; }) };
}

/** CSV exactly like the app's bundled files (UTF-8, comma, quotes when needed). */
function toCsv_(name, rows) {
  const q = function (v) { v = String(v === undefined || v === null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  return [SCHEMA[name]].concat(rows.map(function (r) { return SCHEMA[name].map(function (c) { return r[c]; }); })).map(function (r) { return r.map(q).join(','); }).join('\n') + '\n';
}

function getPublished_() {
  const man = readTable_('manifest')[0] || { content_version: 0 };
  return {
    content_version: Number(man.content_version || 0), published_on: man.published_on || '', lessons_count: Number(man.lessons_count || 0),
    lessons_csv: toCsv_('pub_lessons', readTable_('pub_lessons')),
    quiz_csv: toCsv_('pub_quiz', readTable_('pub_quiz')),
    strings_csv: toCsv_('pub_strings', readTable_('pub_strings')),
    files: readTable_('pub_files').map(function (f) { return { name: f.name, url: f.url }; }),
  };
}
