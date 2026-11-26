/**
 * SITE SAATHI API · Config.gs
 * Tables (PRD 13.3), statuses (PRD 10.13.2), roles (PRD 10.13.4) and Script Properties access.
 *
 * Script Properties (Project Settings -> Script properties). NEVER put these in the app, blocks or Git.
 * Since admin build 1.1-rc8 NOBODY has to type them: Keys.gs makes / saves them (see below).
 *   PEPPER, TOKEN_SECRET   made automatically the first time (long random text; password hashing, session tokens)
 *   SETUP_CODE             one-time code for the first Admin, shown in the sheet tab "setup"; deleted after use
 *   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET   saved from the app: Admin Mode -> Server keys
 *   GEMINI_API_KEY         saved from the app: Admin Mode -> Server keys (free tier, billing never enabled)
 *   KEYS_UPDATED           who saved the keys last, and when
 * Still possible by hand (optional): DRIVE_FOLDER_ID (media backup without Cloudinary), SHEET_ID (script not bound
 * to the sheet), GEMINI_MODEL / AI_PER_MINUTE / AI_PER_DAY, ADMIN_SETUP "email|name|password" for setupFirstAdmin().
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
  setup:       ['item', 'value', 'made_on'],                 // first-setup code for the first Admin (Keys.gs)
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
