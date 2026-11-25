/**
 * SITE SAATHI API · Review.gs
 * action=submit (Writer, Admin): only complete lessons go to review (ADM-6).
 * action=review (Reviewer, Admin): approve / send back with a comment; approver name, qualification and date saved.
 * action=hideLesson (Admin): removed from phones at the next publish (UPD-7).
 */

function submit_(p, u) {
  const row = lessonRow_(p.id); checkEditable_(row, u);
  const miss = missing_(row.lesson_id);
  if (miss.length) throw new Error('Not complete yet: ' + miss.slice(0, 6).join('; ') + (miss.length > 6 ? ' (+' + (miss.length - 6) + ' more)' : ''));
  upsert_('lessons', ['lesson_id'], { lesson_id: row.lesson_id, status: STATUS.REVIEW, updated_by: u.email, updated_at: today_() });
  return { status: STATUS.REVIEW };
}

function review_(p, u) {
  const row = lessonRow_(p.id);
  if (row.status !== STATUS.REVIEW) throw new Error('Only lessons "In review" can be reviewed (this one is ' + row.status + ').');
  const decision = String(p.decision);
  const comment = String(p.comment || '').trim();
  if (decision !== 'approve' && decision !== 'sendback') throw new Error('Decision must be approve or sendback.');
  if (decision === 'sendback' && !comment) throw new Error('Write what to change before sending back.');
  appendRow_('reviews', { lesson_id: row.lesson_id, reviewer_email: u.email, comment: comment, decision: decision, date: today_() });
  if (decision === 'approve') {
    upsert_('lessons', ['lesson_id'], { lesson_id: row.lesson_id, status: STATUS.APPROVED, reviewer: u.name + (u.qualification ? ', ' + u.qualification : ''), reviewed_on: today_() });
    return { status: STATUS.APPROVED };
  }
  upsert_('lessons', ['lesson_id'], { lesson_id: row.lesson_id, status: STATUS.CHANGES });
  return { status: STATUS.CHANGES };
}

function hideLesson_(p, u) {
  const row = lessonRow_(p.id);
  upsert_('lessons', ['lesson_id'], { lesson_id: row.lesson_id, status: STATUS.HIDDEN, updated_by: u.email, updated_at: today_() });
  return { status: STATUS.HIDDEN };
}
