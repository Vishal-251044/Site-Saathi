# How to build the APK and save it here (≈ 5 minutes per build, free)

The APK is compiled by MIT App Inventor's free online build server, so this step happens in your browser.
`tools/save-build.js` then stores it here with its version and writes a row in `VERSIONS.md`.

## 1 · Worker app v1.0-rc1
1. Open **ai2.appinventor.mit.edu** and log in.
2. **Projects → Import project (.aia) from my computer** → choose `D:\SITE SAATHI\app-inventor\SITE_SAATHI.aia`.
   (Use this file, not the copy in `builds/`: App Inventor names the project after the file, and `.` and `-` are not allowed in project names.)
3. Wait for the Designer to open. Click through all 9 screens once (the screen list at the top) and check that nothing shows an error.
4. **Build → Android App (.apk)** → wait → **Download .apk**. The file is saved as `SITE_SAATHI.apk` in Downloads.
5. On the laptop: `node tools/save-build.js --from-downloads`

## 2 · Admin app v1.1-rc1
1. **Projects → Import project** → `D:\SITE SAATHI\app-inventor\SITE_SAATHI_admin.aia` (project name `SITE_SAATHI_admin`).
2. Optional before building (otherwise these parts stay unfinished in this rc build):
   Base64 extension (setup/Day15_16_Guide.md) · ChatBot Token check (setup/Day17_18_Guide.md) · PIC extension + model + 3 blocks (setup/Day19_20_Guide.md Part A).
3. **Build → Android App (.apk)** → download → `SITE_SAATHI_admin.apk`.
4. On the laptop: `node tools/save-build.js --admin --from-downloads --note "no extensions yet"` (change the note to what you actually added).

## Rules
- One version = one build. To build again after a change, raise the version in `tools/build-app.js` (`MVP_VERSION` / `ADMIN_VERSION`, VersionCode always +1), run `node tools/build-app.js` (and `--admin`), then build again. The script refuses to overwrite a saved version.
- If you change blocks by hand in App Inventor, export that project (**Projects → Export selected project (.aia)**) and keep it with the APK: `node tools/save-build.js` only stores the generated .aia.
- The two apps are separate App Inventor projects, so they install as **two separate apps**. Keep only one on a worker's phone.
- Never put the signing keystore, passwords or API keys in this folder.
