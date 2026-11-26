# SITE SAATHI · Host the server, make the 2 APKs, hand over

*3 simple steps. Free tools only: never add a card or turn on billing.*

## Step 1 · Host the server (once, about 20 min, on a laptop)
Use the **client's Google account**.
1. **drive.google.com** → New → File upload → `content/admin-sheet/SITE_SAATHI_Content.xlsx` → open it → **File → Save as Google Sheets**. Name it **SITE SAATHI Content**. Keep it private.
2. In this Google Sheet: **Extensions → Apps Script**. Rename the project **SITE SAATHI API**.
3. Click **+ → Script** 12 times and paste each file from `backend/apps-script/` (same name, without `.gs`):
   Config, Sheets, Auth, Keys, Lessons, Media, Review, Publish, Texts, Router, Setup, Ask.
   Delete the empty `Code.gs`. Press **Ctrl + S**.
4. Choose **setupSheets** → **Run** → **Allow**.
   If you see "Google hasn't verified this app": **Advanced → Go to SITE SAATHI API → Allow**.
5. **Deploy → New deployment → Web app** → Execute as: **Me** → Who has access: **Anyone** → **Deploy**.
6. Copy the link (it ends with `/exec`). Open it in a browser: you see `{"ok":true` → **the server is live**.
7. Put the link in `backend/api_url.txt` and run `node tools/build-app.js --admin`, so the link is inside the admin app.

> Later, if a script file changes: **Deploy → Manage deployments → Edit → New version**. Never make a "New deployment" again: it changes the link.

## Step 2 · Make the 2 APKs (ai2.appinventor.mit.edu)
Always use **the same App Inventor account**. Updates install only from the same account.

**Site worker APK**
1. **Projects → Import project (.aia)** → `app-inventor/SITE_SAATHI.aia`.
2. **Build → Android App (.apk)** → **Download** → `SITE_SAATHI.apk`. Done.

**Admin APK**
1. **Projects → Import project (.aia)** → `app-inventor/SITE_SAATHI_admin.aia`.
2. Do the 3 hand steps (needed again after every new import):

| Hand step | Screen | Guide |
|---|---|---|
| Base64 extension (photo and audio upload) | Admin | `setup/Day15_16_Guide.md` Part E |
| ChatBot1 → Token filled (Ask Saathi) | Ask and Quiz | `setup/Day17_18_Guide.md` Setup 1 |
| Helmet model (skip if not ready) | Safety | `setup/Day19_20_Guide.md` Part A |

3. **Projects → Export selected project (.aia)** → keep this copy.
4. **Build → Android App (.apk)** → **Download** → `SITE_SAATHI_admin.apk`. Done.
5. **Projects → Export keystore** → keep it private. Every future update needs it.

## Step 3 · Hand over
| Give | To |
|---|---|
| `SITE_SAATHI.apk` (offline app) | Site workers |
| `SITE_SAATHI_admin.apk` (full app + hidden Admin Mode) | Content team, and supervisors who need new lessons |
| `Doc/SITE_SAATHI_Guide_Site_Users_EN_MR.pdf` and `Doc/SITE_SAATHI_Guide_Admin_Users_EN_MR.pdf` | Users |
| Google account, keystore (privately) | Client owner |

**First start of the admin app (client's Admin, once):**
1. Install the admin APK → **Settings → About → tap the version 5 times** → **First setup** opens.
2. Google Sheet → tab **setup** → 6-digit code. Type the code, name, email and password → **Create Admin account**.
3. **Dashboard → Server keys** → paste the Cloudinary keys (free at cloudinary.com: Cloud name, API key, API secret) and the Gemini key (optional, free at aistudio.google.com) → **Save**.
4. Add a Writer or Reviewer: Apps Script → **+ → Script** → paste the code below with their details → **Run addTeam** → then delete this file.

```
function addTeam() {
  addMember_({ email: 'person@example.com', name: 'Name', role: 'Writer',
               qualification: 'Diploma Civil', password: 'first-password-1' });
}
```

**Done.** The content team now writes, reviews and publishes lessons in the app. No developer is needed for daily work.
