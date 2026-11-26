# SITE SAATHI

Offline Android learning app for on-site construction workers — *Learn at the Site. Build with Confidence.*
Built in MIT App Inventor (one APK, Worker + hidden Admin Mode). ₹0 tools only. Rules: [CLAUDE.md](CLAUDE.md).

| Folder | What is inside |
|---|---|
| `Doc/` | PRD + BRD (source of truth), 20-day roadmap, **progress tracker** |
| `analysis/` | Day 3 requirement analysis, app flow, summary for the faculty guide |
| `design/` | `Prototype.html` (clickable, all screens, reads the sheet CSVs), style guide, icons, illustrations, PNG exports |
| `media/` | Files to upload to App Inventor Media: step images, icons, button and tile backgrounds |
| `app-inventor/` | `SITE_SAATHI.aia` — v1.0 release candidate (worker app) · `SITE_SAATHI_admin.aia` — v1.1-rc1 (Admin Mode, updates, AI, Supervisor Mode, Helmet Check; Scan inside Learn) · `SITE_SAATHI_tests.aia` — Day 1–8 phone tests |
| `backend/` | Apps Script backend (`apps-script/*.gs`) for Admin Mode and lesson updates; README |
| `content/admin-sheet/` | `SITE_SAATHI_Content.xlsx` — all Admin tabs with the 3 MVP lessons, to open as a Google Sheet |
| `brand/` | Logo SVG + PNGs, brand kit (Hi-Vis colours, fonts, sizes) |
| `content/` | Sheet tabs as CSV (`lessons`, `quiz`, `strings`), lesson outlines, site words |
| `content/review/` | Printable expert review sheets (per lesson) and the Marathi/Hindi translation check |
| `content/qr/` | QR codes (PNG + SVG, verified) and `QR_Posters_A5.pdf` |
| `content/audio/` | Audio recording scripts (9 files, with length estimates) |
| `testing/` | Day 13 test kit (printable), testing report (laptop results filled, phone/user sections for real observations) |
| `builds/` | Every saved build by version: `worker/v1.0-rc1/`, `admin/v1.1-rc1/` (.aia + .apk) · `VERSIONS.md` log · `HOW_TO_BUILD_APK.md` |
| `release/` | v1.0 + v1.1 release checklists (gates, fresh-install test, backup list), demo script (steps 1–12), install guides v1.0 + v1.1, retrospective template, `slides_source/` (deck files) |
| `content/ai/` | Ask Saathi test questions (20, incl. unsafe topics) for the expert to rate |
| `field/` | Site-visit kit: interview sheet, consent rule, messages, field notes template |
| `setup/` | Step-by-step setup guides per day |
| `tools/` | `build-fonts.py` (app font: Noto Sans Devanagari + Figtree for English, needs Python + fontTools) · `build-assets.js` (logo PNGs + test .aia) · `build-design-data.js` (CSVs → prototype) · `build-illustrations.js` + `build-app-assets.js` → `export-media.sh` (media PNG/JPG; `export-media.sh ui` = UI pictures only) · `export-screens.sh` (screen PNGs) · `build-qr.js` (QR + posters) · `build-review-sheets.js` · `build-recording-scripts.js` · `build-app.js` (the app .aia) · `check-aia.js` (reference checks) · `sim-aia.js` (runs the blocks on the laptop: 84 checks v1.0, 215 admin build, `--report`) · `prerelease-check.js` · `build-test-docs.js` · `build-app.js --admin` · `build-admin-sheet.js` · `test-backend.js` (backend, 65 checks) · `save-build.js` (versioned copies of .aia/.apk into builds/) · `preview-aia.js` (draws the real app screens at phone size → design/app-preview/) · `export-ui-screens.js` (those screens + before/after into `Doc/UI_v3_Screens/` and `Doc/SITE_SAATHI_UI_v3_Screens.pdf`) · `md-to-pdf.js` (a Markdown doc → A4 PDF with the app font) · `build-guides.js` (user guides with real screens, English + Marathi: `Doc/SITE_SAATHI_Guide_Site_Users_EN_MR.pdf`, `Doc/SITE_SAATHI_Guide_Admin_Users_EN_MR.pdf`) · `vendor/` (qrcode-generator MIT, jsQR Apache-2.0) |

Current day and status: see `Doc/SITE_SAATHI_Roadmap_Progress.md`.
