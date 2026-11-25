/**
 * SITE SAATHI API · Lessons.gs
 * listLessons, getLesson, saveLesson, saveStep, saveQuiz + completeness checks (ADM-3, ADM-6, ADM-7).
 * Lists (materials, safety, mistakes) are stored with "|" like the app CSV; the editor sends/gets one item per line.
 */

const toPipe_ = function (s) { return String(s || '').split(/\r?\n/).map(function (x) { return x.trim(); }).filter(String).join('|'); };
const toLines_ = function (s) { return String(s || '').split('|').join('\n'); };

function lessonRow_(id) {
  const r = findRow_('lessons', function (x) { return same_(x.lesson_id, id); });
  if (!r) throw new Error('No lesson ' + id + '.');
  return r;
}

/** Writers may edit Draft / Changes needed (and Approved/Published, which go back to Draft); Admin always; Reviewer never. */
function checkEditable_(row, u) {
  if (u.role === 'Reviewer') throw new Error('Reviewers comment and approve; they do not edit.');
  if (u.role === 'Writer' && row.status === STATUS.REVIEW) throw new Error('This lesson is waiting for review. Ask the reviewer to send it back first.');
  if (row.status === STATUS.HIDDEN && u.role !== 'Admin') throw new Error('This lesson is hidden.');
}

/** Records who/when; an edit of an Approved or Published lesson needs a new review (published copy stays live until the next publish). */
function touch_(row, u) {
  const back = row.status === STATUS.APPROVED || row.status === STATUS.PUBLISHED;
  upsert_('lessons', ['lesson_id'], { lesson_id: row.lesson_id, updated_by: u.email, updated_at: today_(), status: back ? STATUS.DRAFT : row.status });
}

/** ADM-6 completeness: returns a list of what is missing (empty = ready to submit). */
function missing_(id) {
  const out = [];
  const texts = readTable_('lesson_text').filter(function (t) { return same_(t.lesson_id, id); });
  LANGS.forEach(function (l) {
    const t = texts.filter(function (x) { return x.lang === l; })[0] || {};
    ['title', 'description', 'objective', 'materials', 'safety', 'mistakes'].forEach(function (f) { if (!String(t[f] || '').trim()) out.push(l + ': ' + f); });
    if (!String(t.audio_url || '').trim()) out.push(l + ': audio (or mark read-aloud only)');
  });
  const steps = readTable_('steps').filter(function (s) { return same_(s.lesson_id, id); });
  if (!steps.length) out.push('steps: none yet');
  steps.forEach(function (s) {
    if (!String(s.image_url || '').trim()) out.push('step ' + s.step_no + ': picture');
    LANGS.forEach(function (l) { if (!String(s['text_' + l] || '').trim()) out.push('step ' + s.step_no + ': ' + l + ' text'); });
  });
  const quiz = readTable_('quiz').filter(function (q) { return same_(q.lesson_id, id); });
  LANGS.forEach(function (l) {
    const qs = quiz.filter(function (q) { return q.lang === l; });
    if (qs.length !== 5) out.push(l + ' quiz: ' + qs.length + ' of 5 questions');
    qs.forEach(function (q) {
      if (['A', 'B', 'C', 'D'].indexOf(String(q.correct).toUpperCase()) < 0) out.push(l + ' quiz ' + q.q_no + ': correct answer');
      if (['question', 'a', 'b', 'c', 'd', 'explanation'].some(function (f) { return !String(q[f] || '').trim(); })) out.push(l + ' quiz ' + q.q_no + ': empty field');
    });
  });
  return out;
}

/** action=listLessons (any member): lessons with status and what is missing; dashboard counts. */
function listLessons_() {
  const texts = readTable_('lesson_text');
  const lessons = readTable_('lessons').map(function (r) {
    const en = texts.filter(function (t) { return same_(t.lesson_id, r.lesson_id) && t.lang === 'en'; })[0];
    const any = texts.filter(function (t) { return same_(t.lesson_id, r.lesson_id); })[0];
    return { id: r.lesson_id, module: r.module_code, status: r.status, title: (en && en.title) || (any && any.title) || '', missing: missing_(r.lesson_id).length, updated_at: r.updated_at };
  }).sort(function (a, b) { return a.id < b.id ? -1 : 1; });
  const man = readTable_('manifest')[0] || {};
  const count = function (s) { return lessons.filter(function (l) { return l.status === s; }).length; };
  return { lessons: lessons, counts: { live: count(STATUS.PUBLISHED), review: count(STATUS.REVIEW), approved: count(STATUS.APPROVED), version: Number(man.content_version || 0) },
    modules: readTable_('modules').map(function (m) { return { code: m.code, name: m.name_en }; }) };
}

/** action=getLesson (id): everything for the editor and the review screen. Lists come back one item per line. */
function getLesson_(p) {
  const row = lessonRow_(p.id);
  const texts = {};
  readTable_('lesson_text').filter(function (t) { return same_(t.lesson_id, p.id); }).forEach(function (t) {
    texts[t.lang] = { title: t.title, description: t.description, objective: t.objective, materials: toLines_(t.materials), safety: toLines_(t.safety), mistakes: toLines_(t.mistakes), audio_url: t.audio_url };
  });
  const steps = readTable_('steps').filter(function (s) { return same_(s.lesson_id, p.id); }).sort(function (a, b) { return a.step_no - b.step_no; })
    .map(function (s) { return { step_no: Number(s.step_no), image_url: s.image_url, text_mr: s.text_mr, text_hi: s.text_hi, text_en: s.text_en }; });
  const quiz = readTable_('quiz').filter(function (q) { return same_(q.lesson_id, p.id); }).sort(function (a, b) { return a.q_no - b.q_no; });
  const reviews = readTable_('reviews').filter(function (r) { return same_(r.lesson_id, p.id); });
  return { lesson: { id: row.lesson_id, module: row.module_code, status: row.status, duration_min: row.duration_min, reviewer: row.reviewer, reviewed_on: row.reviewed_on },
    texts: texts, steps: steps, quiz: quiz, last_review: reviews[reviews.length - 1] || null, missing: missing_(p.id) };
}

/**
 * action=saveLesson (Writer, Admin).
 * New lesson: module (code) [+ duration_min] -> ID created automatically, e.g. SS-REI-01 (ADM-3; never changes).
 * Existing: id [+ duration_min] [+ lang + title, description, objective, materials, safety, mistakes] [+ readAloudOnly=true].
 */
function saveLesson_(p, u) {
  let row;
  if (!p.id) {
    const mod = String(p.module || '').toUpperCase();
    if (!findRow_('modules', function (m) { return same_(m.code, mod); })) throw new Error('Unknown module ' + mod + '.');
    const n = readTable_('lessons').filter(function (r) { return same_(r.module_code, mod); }).reduce(function (m, r) { return Math.max(m, Number(r.lesson_no) || 0); }, 0) + 1;
    const id = 'SS-' + mod + '-' + ('0' + n).slice(-2);
    row = upsert_('lessons', ['lesson_id'], { lesson_id: id, module_code: mod, lesson_no: n, duration_min: Number(p.duration_min) || 5, status: STATUS.DRAFT, created_by: u.email, updated_by: u.email, updated_at: today_() });
    upsert_('qr', ['lesson_id'], { lesson_id: id, poster_location: '', printed: 'no', printed_on: '' });
  } else {
    row = lessonRow_(p.id);
    checkEditable_(row, u);
    if (p.duration_min) upsert_('lessons', ['lesson_id'], { lesson_id: row.lesson_id, duration_min: Number(p.duration_min) });
  }
  if (p.lang) {
    if (LANGS.indexOf(p.lang) < 0) throw new Error('Language must be mr, hi or en.');
    const t = { lesson_id: row.lesson_id, lang: p.lang };
    ['title', 'description', 'objective'].forEach(function (f) { if (p[f] !== undefined) t[f] = String(p[f]).trim(); });
    ['materials', 'safety', 'mistakes'].forEach(function (f) { if (p[f] !== undefined) t[f] = toPipe_(p[f]); });
    if (String(p.readAloudOnly) === 'true') t.audio_url = READ_ALOUD;
    upsert_('lesson_text', ['lesson_id', 'lang'], t);
  }
  touch_(lessonRow_(row.lesson_id), u);
  return { id: row.lesson_id, missing: missing_(row.lesson_id) };
}

/** action=saveStep (Writer, Admin): id, step_no (1-10), text_mr/text_hi/text_en (any) [, delete=true]. Pictures come from uploadMedia. */
function saveStep_(p, u) {
  const row = lessonRow_(p.id); checkEditable_(row, u);
  const n = Number(p.step_no);
  if (!(n >= 1 && n <= 10)) throw new Error('Step number must be 1 to 10.');
  if (String(p.delete) === 'true') {
    const rest = readTable_('steps').filter(function (s) { return !(same_(s.lesson_id, p.id) && Number(s.step_no) === n); });
    rest.forEach(function (s) { if (same_(s.lesson_id, p.id) && Number(s.step_no) > n) s.step_no = Number(s.step_no) - 1; });
    writeTable_('steps', rest);
  } else {
    const s = { lesson_id: row.lesson_id, step_no: n };
    LANGS.forEach(function (l) { if (p['text_' + l] !== undefined) s['text_' + l] = String(p['text_' + l]).trim(); });
    upsert_('steps', ['lesson_id', 'step_no'], s);
  }
  touch_(row, u);
  return { missing: missing_(row.lesson_id) };
}

/** action=saveQuiz (Writer, Admin): id, lang, q_no (1-5), question, a, b, c, d, correct (A-D), explanation. */
function saveQuiz_(p, u) {
  const row = lessonRow_(p.id); checkEditable_(row, u);
  const n = Number(p.q_no), c = String(p.correct || '').trim().toUpperCase();
  if (LANGS.indexOf(p.lang) < 0) throw new Error('Language must be mr, hi or en.');
  if (!(n >= 1 && n <= 5)) throw new Error('Question number must be 1 to 5.');
  if (['A', 'B', 'C', 'D'].indexOf(c) < 0) throw new Error('Correct answer must be A, B, C or D.');
  const q = { lesson_id: row.lesson_id, lang: p.lang, q_no: n, correct: c };
  ['question', 'a', 'b', 'c', 'd', 'explanation'].forEach(function (f) { q[f] = String(p[f] || '').trim(); if (!q[f]) throw new Error('Fill the ' + f + ' field.'); });
  upsert_('quiz', ['lesson_id', 'lang', 'q_no'], q);
  touch_(row, u);
  return { missing: missing_(row.lesson_id) };
}
