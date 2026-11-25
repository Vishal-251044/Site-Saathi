# SITE SAATHI API (Google Apps Script)

Small backend for Admin Mode and lesson updates (PRD 10.13.6). Free: Google Apps Script + Google Sheets + Cloudinary free plan (Drive as backup). No card, no billing.

| File | What it does |
|---|---|
| `apps-script/Config.gs` | Tables, statuses, roles, limits; list of Script Properties |
| `apps-script/Sheets.gs` | Read / write tabs as objects |
| `apps-script/Auth.gs` | Hashed passwords, 12-hour signed tokens, 5-try lockout, team members, `setupFirstAdmin()` |
| `apps-script/Lessons.gs` | `listLessons`, `getLesson`, `saveLesson` (auto ID), `saveStep`, `saveQuiz`, completeness checks |
| `apps-script/Media.gs` | `uploadMedia` → Cloudinary signed upload (photos ≤ 1080 px, audio → MP3) or Drive |
| `apps-script/Review.gs` | `submit`, `review` (approve / send back), `hideLesson` |
| `apps-script/Publish.gs` | `publish` (version +1, publish log), `getPublished` (for phones, Day 17) |
| `apps-script/Texts.gs` | App texts and QR codes |
| `apps-script/Router.gs` | `doPost` / `doGet`: one web address, role check before every change |
| `apps-script/Setup.gs` | `setupSheets()`, `checkSetup()` |

**Secrets** (`PEPPER`, `TOKEN_SECRET`, Cloudinary keys) live only in **Script Properties** — never in the app, the blocks, this folder or Git (CLAUDE.md).

**Tests on the laptop:** `node tools/test-backend.js` runs these exact files with stand-ins for the Google services (56 checks).
**Web app address:** after deploying, put the `…/exec` link in `backend/api_url.txt` (not secret) and rebuild the admin app, or type it on the login page.
