# CLAUDE.md — SITE SAATHI

Read this fully before helping on SITE SAATHI, and follow it in every session.

## 1. Project
- **SITE SAATHI** — offline Android learning app for on-site construction workers. "Learn at the Site. Build with Confidence." · Civilathon (Construction Technologies).
- **Owner:** Vaibhav Chandrakant Jadhav (Civil Engineering, RIT Sangli). Beginner-friendly, no-code first.
- **Delivery:** ONE APK with **Worker Mode** (default) and hidden **Admin Mode** (content team).
- **Cost rule: ₹0.** Only free tools and free plans. Never suggest paid APIs, paid storage, a credit card or billing.

## 2. Stack (all free)
| Part | Tool |
|---|---|
| App | MIT App Inventor (blocks), 9 Screens max |
| Content DB | Google Sheets (private) |
| Backend | Google Apps Script web app (login, save, uploadMedia, publish, getPublished, ask) |
| Media | Cloudinary free plan (Google Drive as backup) |
| AI | App Inventor ChatBot (MIT free default) → Gemini **free tier** via Apps Script as backup · TextToSpeech · SpeechRecognizer · Personal Image Classifier (on-device) |
| Design | Figma + Canva (free) |

## 3. Docs first
`Doc/` holds `SITE_SAATHI_PRD_BRD_v1.0.pdf` (source of truth), `SITE_SAATHI_20_Day_Roadmap_v1.0.pdf` and `SITE_SAATHI_Roadmap_Progress.md`.
1. Before any task, read the PRD section (use IDs like `QR-2`, `ADM-4`, `UPD-3`) and that roadmap day.
2. Build in roadmap order: Days 1–14 MVP (offline), 15–17 Admin Mode + updates, 18–19 AI, 20 final APK.
3. After a task, tick it in the progress file with a short note. Never edit the PDFs.
4. If something conflicts with the PRD or is unclear, **stop and ask**.

## 4. Non-negotiable rules
- **Offline first:** lessons, images, audio, quiz, QR and My Skills must work in airplane mode. AI and Admin Mode are optional extras.
- **Lesson IDs** `SS-<MOD>-<NN>` (e.g. `SS-MAS-01`) never change after publishing — printed QR codes use them.
- **All text in 3 languages** (mr, hi, en) via `strings.csv` / sheet — no hard-coded labels.
- **Content safety:** every lesson is reviewed by a civil engineering expert before publishing. AI drafts are never used unreviewed.
- **AI rules:** construction-only persona, short simple answers, safety first ("ask your supervisor"), labelled as AI, never required for core use.
- **Privacy:** no phone numbers, IDs or faces stored or sent to AI; Supervisor Mode keeps first name + trade only, on the phone.
- **Secrets** (Cloudinary keys, Gemini key, password hashes) live only in Apps Script **Script Properties** — never in the APK, blocks or Git.
- **Publish safely:** only Approved lessons publish; phones switch content version only after every file downloads.

## 5. Naming
- Media: `SS-MAS-01_s1.jpg`, `SS-MAS-01_mr.mp3`. Cloudinary folder `site-saathi/<lessonId>/`.
- TinyDB keys: `lang`, `content_version`, `score_<id>`, `viewed_<id>`, `sup_pin`.
- Project file: `SITE_SAATHI.aia` — back up to Drive after every build day.

## 6. UI — "Hi-Vis" theme
Helmet yellow `#FFC21A` (main actions) · charcoal `#1B1F24` (text) · blueprint blue `#2563EB` (**only** AI) · green `#15A34A` (correct / done / offline) · red `#DC2626` (safety boxes). Buttons ≥ 48 dp, large text option, icons + few words, Noto Sans Devanagari for mr/hi. No emoji in the UI.

## 7. How Claude helps (App Inventor is visual)
- Explain block logic step by step (screen → component → event → blocks).
- Write Apps Script code, CSV/sheet structures, lesson drafts, translations and quiz drafts (marked "needs expert review").
- Keep every Apps Script file small, commented, with try/catch and clear error messages.

## 8. Git
Never `git push` without my explicit "yes, push". Never commit keys, `.env`, or the signing keystore.

## 9. Ask me before
Adding a new tool or extension · anything not in the PRD · anything that could cost money · deleting content or files.
