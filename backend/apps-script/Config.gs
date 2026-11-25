/**
 * SITE SAATHI API · Config.gs
 * Tables (PRD 13.3), statuses (PRD 10.13.2), roles (PRD 10.13.4) and Script Properties access.
 *
 * Script Properties (Project Settings -> Script properties). NEVER put these in the app, blocks or Git:
 *   PEPPER            long random text, used in password hashing          (required)
 *   TOKEN_SECRET      long random text, signs the 12-hour session tokens  (required)
 *   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET       (Cloudinary free plan, no card)
 *   DRIVE_FOLDER_ID   Drive folder "SITE SAATHI Media" (backup if Cloudinary keys are not set)
 *   GEMINI_API_KEY    Gemini API FREE tier key from Google AI Studio (billing never enabled) - Ask Saathi backup
 *   GEMINI_MODEL, AI_PER_MINUTE, AI_PER_DAY   optional (defaults in Ask.gs)
 *   SHEET_ID          only if this script is NOT bound to the "SITE SAATHI Content" sheet
 *   ADMIN_SETUP       one-time "email|name|password" for setupFirstAdmin(); deleted after use
 */

const SCHEMA = {
  modules:     ['code', 'name_mr', 'name_hi', 'name_en', 'icon', 'order', 'active'],
  lessons:     ['lesson_id', 'module_code', 'lesson_no', 'duration_min', 'status', 'reviewer', 'reviewed_on', 'created_by', 'updated_by', 'updated_at'],
  lesson_text: ['lesson_id', 'lang', 'title', 'description', 'objective', 'materials', 'safety', 'mistakes', 'audio_url'],
  steps:       ['lesson_id', 'step_no', 'image_url', 'text_mr', 'text_hi', 'text_en'],
  quiz:        ['lesson_id', 'lang', 'q_no', 'question', 'a', 'b', 'c', 'd', 'correct', 'explanation'],
  reviews:     ['lesson_id', 'reviewer_email', 'comment', 'decision', 'date'],
  qr:          ['lesson_id', 'poster_location', 'printed', 'printed_on'],
  strings:     ['key', 'mr', 'hi', 'en'],
  team:        ['email', 'name', 'role', 'qualification', 'password_hash', 'active'],
  publish_log: ['version', 'published_by', 'date', 'lessons_count', 'change_note'],
  // Published copies read by phones (getPublished). pub_lessons uses the SAME columns as the app's lessons.csv.
  pub_lessons: ['id', 'module', 'lang', 'title', 'desc', 'objective', 'materials', 'steps', 'safety', 'mistakes', 'img', 'audio', 'duration_min'],
  pub_quiz:    ['lesson_id', 'lang', 'q_no', 'question', 'a', 'b', 'c', 'd', 'correct', 'explanation'],
  pub_strings: ['key', 'mr', 'hi', 'en'],
  pub_files:   ['name', 'url', 'lesson_id'],          // media file list of the manifest
  manifest:    ['content_version', 'published_on', 'lessons_count'],
};

const STATUS = { DRAFT: 'Draft', REVIEW: 'In review', CHANGES: 'Changes needed', APPROVED: 'Approved', PUBLISHED: 'Published', HIDDEN: 'Hidden' };
const ROLES = ['Admin', 'Reviewer', 'Writer'];
const LANGS = ['mr', 'hi', 'en'];
const SESSION_HOURS = 12;          // ADM-1 / Day 15: session ends after 12 hours
const MAX_TRIES = 5;               // ADM-1: 5 wrong attempts ...
const LOCK_MINUTES = 10;           // ... lock login for 10 minutes
const READ_ALOUD = 'READ_ALOUD';   // ADM-6: audio for a language may be marked "read-aloud only"

/** Script Property; throws a clear message if a required one is missing. */
function getProp_(name, required) {
  const v = PropertiesService.getScriptProperties().getProperty(name);
  if (required && !v) throw new Error('Setup missing: Script Property ' + name + ' is not set.');
  return v || '';
}

/** Current time in ms (one place, so tests can move the clock). */
function now_() { return new Date().getTime(); }

function today_() { return Utilities.formatDate(new Date(now_()), 'Asia/Kolkata', 'yyyy-MM-dd HH:mm'); }
