# Day 15 + Day 16 · Admin Mode (separate build) — setup and test

**Your decisions (18 Nov):** Admin Mode is built in **`app-inventor/SITE_SAATHI_admin.aia`** (v1.1-dev1); the v1.0 release candidate `SITE_SAATHI.aia` is untouched. Scan now lives inside Learn, and the 9th Screen is **Admin**. Photo/audio upload uses a free **Base64 extension** you import.
Everything is free. **Never** add a card or turn on billing (Google Cloud, Cloudinary).

---

## Part A · Google Sheet "SITE SAATHI Content" (≈ 10 min)
1. Drive → `SITE_SAATHI/` → **Upload** `content/admin-sheet/SITE_SAATHI_Content.xlsx` → right-click → **Open with → Google Sheets** → File → **Save as Google Sheets**. Name it **SITE SAATHI Content**. Keep it **private**.
2. Check the 15 tabs: modules (6), lessons (3, "In review"), lesson_text (9), steps (21), quiz (45), strings (142), team (empty), qr (3), manifest (version 0), and empty reviews / publish_log / pub_*.

## Part B · Apps Script backend (≈ 20 min)
1. In the sheet: **Extensions → Apps Script**. Name the project **SITE SAATHI API**.
2. Create 10 script files with the same names as `backend/apps-script/*.gs` (Config, Sheets, Auth, Lessons, Media, Review, Publish, Texts, Router, Setup) and paste each file's content. Delete the empty `Code.gs`.
3. **Project Settings (gear) → Script properties → Add**:
   | Property | Value |
   |---|---|
   | `PEPPER` | any long random text (e.g. 40 random letters/numbers) |
   | `TOKEN_SECRET` | another long random text |
   | `ADMIN_SETUP` | `your-email|Vaibhav|a-strong-password` (deleted automatically after use) |
   | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | from Part C |
   | `DRIVE_FOLDER_ID` | optional backup: ID of Drive folder "SITE SAATHI Media" (the part after `/folders/`) |
   Never write these anywhere else (not in the app, not in blocks, not in this project folder).
4. Editor: select **setupSheets** → Run → allow the permissions (your own Google account). Then **setupFirstAdmin** → Run. Then **checkSetup** → Run → View → Logs: "Missing required properties: none".
5. **Deploy → New deployment → Web app**: Execute as **Me**, Who has access **Anyone** (ADM-10). Copy the **Web app URL** (ends with `/exec`).
6. Save the URL in `backend/api_url.txt` (one line, not secret) — then I rebuild so it is pre-filled; or type it on the Admin login page.
7. **After any script change:** Deploy → Manage deployments → Edit (pencil) → Version **New version** → Deploy (same URL).

## Part C · Cloudinary free plan (≈ 10 min, Day 16)
1. cloudinary.com → Sign up **free** (no card). Dashboard → copy **Cloud name, API Key, API Secret** into Script Properties (Part B.3). Never into the app.
2. Nothing else: the script uploads into folder `site-saathi/<lessonId>/`, shrinks photos to 1080 px wide and converts recordings to MP3.
3. Optional Drive backup: create Drive folder "SITE SAATHI Media", put its ID in `DRIVE_FOLDER_ID`. Used only if the Cloudinary keys are missing.

## Part D · Team (Day 15)
1. Import `app-inventor/SITE_SAATHI_admin.aia` into App Inventor (as a **new** project; keep the v1.0 one).
2. Companion → Settings → About → **tap the version 5 times** → Admin Mode → paste the server address → log in as Admin.
3. Team members are added with the backend (Admin only). For now, in the Apps Script editor run once per person, after editing the values:
   ```
   function addTeam() { addMember_({ email: 'guide@example.com', name: 'Prof. Name', role: 'Reviewer', qualification: 'M.E. Structures', password: 'first-password-1' }); }
   ```
   Roles: **Admin** (you), **Reviewer** (faculty guide), **Writer** (1 person). Give each their first password privately; they can change it later.

## Part E · Base64 extension for photo/audio upload (Day 16, ADM-4)
1. Find a **free** "Base64" extension on the MIT App Inventor Community that can turn a **file path into a Base64 text** (look for a method like *FileToBase64* / *EncodeFile* and a result event). Download its `.aix`. (CLAUDE.md: you approved adding this one extension.)
2. App Inventor → Admin screen → Palette → **Extension → Import extension** → choose the `.aix` → drag it onto the Admin screen.
3. Blocks, **procedure `toBase64(file)`**: delete the blocks inside it and put the extension's *encode file* call with `get file`.
4. Add the extension's **result event** (e.g. *GotBase64 (result)*) and inside it: **call `sendUpload` b64 = result**.
5. That's all — progress text ("Uploading…"), Retry on failure, Cloudinary upload and saving the link are already built.
6. **Important:** if you re-import a new `SITE_SAATHI_admin.aia` from me, those 2 blocks are lost. Tell me the extension's name and put the `.aix` in `tools/vendor/` — I can then try to bundle it so they are not lost.

## Part F · Test on the phone ("Done when")
**Day 15:** a team member opens the hidden Admin Mode, logs in (role checked by the script) and creates **SS-REI-01** with text in 3 languages, saved in the Google Sheet.
- [ ] Tap version 5× → login page. Wrong password 5× → "Too many wrong tries. Wait 10 minutes."
- [ ] Log in as Writer → New lesson → Choose module "REI – Reinforcement Work" → title, description, objective, materials (one per line), safety, mistakes → Save → header shows **SS-REI-01 · Draft**. Switch to मराठी and हिंदी and fill those too. Check the sheet tabs `lessons` and `lesson_text`.
- [ ] Writer has no Publish / App texts buttons. Reviewer has no New lesson.

**Day 16:** a writer adds steps with photos and recorded audio (Cloudinary), adds 5 quiz questions and submits; the reviewer approves; the admin publishes and the content version goes up.
- [ ] Steps and pictures → step 1…5: text in 3 languages, Save; Camera or Gallery → Save picture (needs Part E) → preview shows the Cloudinary picture.
- [ ] Editor: मराठी → Record → Stop → Listen → Save audio; same for हिंदी; English: tick "read-aloud only" → Save.
- [ ] Quiz → question 1…5 in each language → Correct answer → Save. The grey box changes to "Complete – ready to submit" → **Submit for review**.
- [ ] Log in as Reviewer → open SS-REI-01 → Send back (with comment) → Writer sees the comment, fixes, submits → Reviewer approves.
- [ ] Log in as Admin → **Publish to all phones** → "Published. Content version 1". Check tabs `pub_lessons`, `manifest`, `publish_log`.
- [ ] Role test: Writer cannot publish; Reviewer cannot edit.
- [ ] QR codes: pick SS-REI-01 → QR picture → poster place + Printed → Save. App texts (Admin): change a label → Save.

## Laptop checks already passed (before your phone test)
| Check | Result |
|---|---|
| `node tools/test-backend.js` — the real .gs files with stand-in Google services | 56 / 56 |
| `node tools/sim-aia.js app-inventor/SITE_SAATHI_admin.aia` — worker app + Admin screen blocks talking to that backend | 136 / 136 |
| `node tools/sim-aia.js` — v1.0 release candidate unchanged | 84 / 84 |
Not tested on the laptop: the real Google services, the real App Inventor import, camera, microphone and the Base64 extension.
