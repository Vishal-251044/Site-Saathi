# SITE SAATHI · v1.1 release checklist (Day 20 · Mon 7 Dec 2026)

**Current build:** `app-inventor/SITE_SAATHI_admin.aia` **v1.1-rc5** (version code 25, UI v2 + admin redesign + motion) — release candidate.
It becomes **v1.1** (code 26) only when every gate below is ticked. v1.1 = v1.0 lessons + Admin Mode + lesson updates + read-aloud + Ask Saathi + Explain My Mistake + Supervisor Mode + Helmet Check.
v1.1 needs the v1.0 gates too: an unreviewed lesson must never reach workers (CLAUDE.md content safety).

## Gates (all must be ✓)

| # | Gate | Evidence | Status |
|---|---|---|---|
| H1 | All v1.0 gates G1–G8 ticked (expert review, native check, audio decision, phone + user tests, reviewer credit) | `release/Release_v1.0_Checklist.md` | ☐ |
| H2 | Automatic checks pass on the final build | `check-aia` OK · `sim-aia` admin all passed · `test-backend` all passed | ☐ (rc1: 215/215 · 65/65) |
| H3 | Backend live: Apps Script deployed, Script Properties set (pepper, token secret, Cloudinary, Gemini free key), `backend/api_url.txt` filled, real login works | Day 15–16 guide checklist | ☐ |
| H4 | Admin Mode on a phone: login → new lesson → photo + audio upload → quiz → submit → review → publish → worker phone gets it (UPD) | Day 15–17 phone tests | ☐ |
| H5 | Content update safe: switch off Wi-Fi in the middle of a download → old content still works; version changes only after all files | Day 17 test | ☐ |
| H6 | Ask Saathi: expert rated the 20 test questions — **0 unsafe answers**; offline message correct; answers labelled AI | `content/ai/Ask_Saathi_Test_Questions.html` signed | ☐ |
| H7 | Helmet Check: model added; accuracy on 20 unseen photos written down (real number); unsupported phone hides the tile | Day 19–20 guide A5 table | ☐ |
| H8 | Supervisor Mode phone test: PIN, 2 workers, per-worker scores, share, lock after 5 wrong | Day 19–20 guide Part B | ☐ |
| H9 | Fresh-install test passed (list below) | this file | ☐ |
| H10 | No secret in the APK, blocks or project files: search the .aia for `key`, `secret`, `password` → only labels | `grep -i` on the unzipped .aia | ☐ |

## Fresh-install test (on a phone that never had SITE SAATHI)
- [ ] Install from the Drive / WhatsApp file using only `release/Install_Guide_v1.1.md` (no extra help)
- [ ] First open → language screen → Marathi → Home in Marathi
- [ ] Airplane mode **on**: 3 lessons, pictures, audio (if bundled), quiz, QR scan, My Skills all work
- [ ] Ask Saathi in airplane mode → friendly "needs internet" message + "Open the lessons" button
- [ ] Camera permission asked only when scanning / Helmet Check; microphone only when tapping the mic
- [ ] Airplane mode **off**: Settings → Check for new lessons → works or says "no new lessons"
- [ ] Admin Mode: Settings → About → tap the version 5 times → login with the **test account** → logout
- [ ] Uninstall and reinstall once: no crash, starts at the language screen

## Release steps (after the gates)
1. `tools/build-app.js`: `ADMIN_VERSION = ['1.1', '26']`.
2. `node tools/build-app.js --admin && node tools/check-aia.js app-inventor/SITE_SAATHI_admin.aia && node tools/sim-aia.js app-inventor/SITE_SAATHI_admin.aia && node tools/test-backend.js`
3. App Inventor → import → hand steps (Base64 extension, ChatBot Token check, PIC extension + model + 3 blocks) → **Build → Android App (.apk)** → `SITE_SAATHI_v1.1.apk`.
4. Fresh-install test again with the final APK.
5. Backup (below). 6. Rehearse twice. 7. Tick Day 20 in the progress file.

## Backup (Drive `SITE_SAATHI/Builds/v1.1/`)
| File | From |
|---|---|
| `SITE_SAATHI_v1.1.aia` | App Inventor → Projects → Export selected project (**after** your hand steps) |
| `SITE_SAATHI_v1.1.apk` | the build |
| `SITE_SAATHI_v1.0.aia` + `.apk` | worker-only build |
| `apps-script/` (11 `.gs` files) | `backend/apps-script/` (no keys in them — keys stay in Script Properties) |
| `SITE_SAATHI_Content` sheet | File → Download → .xlsx |
| `model.mdl` + PIC training notes (no photos) | Part A |
| `testing/Testing_Report` PDF, accuracy table, screenshots, demo video | testing + phone |
| Slides (PDF export) + `release/Retrospective.md` | Day 20 |

**Never back up into a shared/public place:** the signing keystore, Script Properties values, passwords, helmet photos.
