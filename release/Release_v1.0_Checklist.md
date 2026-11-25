# SITE SAATHI · v1.0 MVP release checklist (Day 14 · Tue 1 Dec 2026)

**Current build:** `app-inventor/SITE_SAATHI.aia` **v1.0-rc5** (code 14, UI v2 + motion) (release candidate). It becomes **v1.0** only when every gate below is ticked.
Why: CLAUDE.md says every lesson is reviewed by a civil engineering expert before it is used, and the roadmap's Day 14 "Done when" needs real-phone and real-user testing.

## Gates (all must be ✓)

| # | Gate | Evidence | Status |
|---|---|---|---|
| G1 | Expert review signed for SS-MAS-01, SS-CON-01, SS-SAF-01; every correction applied in **en, mr and hi** | `content/review/*_Review_Sheet.html` signed (scan to Drive) | ☐ |
| G2 | Marathi and Hindi checked by native speakers; fixes applied | `content/review/Translation_Check.html` ticked | ☐ |
| G3 | 9 audio files recorded, compressed and bundled — or the decision to ship v1.0 with read-text only is written here | `node tools/prerelease-check.js` → audio 9/9 | ☐ |
| G4 | Automatic checks pass on the final build | `check-aia.js` OK · `sim-aia.js` all passed · `prerelease-check.js` all OK | ☐ (rc1: 84/84, 11/12 — audio missing) |
| G5 | Functional F1–F8 and offline O1–O7 pass on **2 phones** | `testing/Testing_Report.html` §3 | ☐ |
| G6 | ≥ 4 of 5 testers choose a language, find a lesson and finish a quiz without help (PRD §06) | Testing report §4 | ☐ |
| G7 | All **High** issues from Day 13 fixed and re-tested | Testing report §6 | ☐ |
| G8 | Reviewer credit in About (LES-5): set `REVIEWER` in `tools/build-app.js` to "Name, qualification" | About screen | ☐ |

## Release steps (after the gates)
1. `tools/build-app.js`: set `VERSION_NAME = '1.0'`, `VERSION_CODE = '15'` (always higher than before), and `REVIEWER`.
2. `node tools/build-app.js && node tools/check-aia.js && node tools/sim-aia.js --report && node tools/prerelease-check.js && node tools/build-test-docs.js`
3. App Inventor → import → **Build → Android App (.apk)** → download → rename `SITE_SAATHI_v1.0.apk`.
4. Install on 2 phones (fresh install on at least one); run the demo flow once in airplane mode.
5. Back up to Drive `SITE_SAATHI/Builds/`: `SITE_SAATHI_v1.0.aia`, `SITE_SAATHI_v1.0.apk`, `screenshots_v1.0/`, `Testing_Report.pdf`.
6. Rehearse the demo **twice** (`release/Demo_Script.md`), once in airplane mode.
7. Tick Day 14 in the progress file. **Admin and AI work (Days 15–20) starts only after this.**

## MVP success checklist (roadmap)
| Item | How it is shown | ✓ |
|---|---|---|
| Core journey works end to end: open → language → lesson → quiz, no errors | Demo flow steps 1–7; simulator Day 9–11 sections | ☐ |
| All three lessons, audio and quizzes work in airplane mode | Offline test O1–O7 on 2 phones | ☐ |
| Each QR opens the correct lesson; an unknown code shows a clear message | Scan posters + SS-TEST-99 | ☐ |
| Quiz scores match manual counting for every question set | Simulator (9 pairs × 5 patterns) + phone answer key | ☐ |
| Marathi, Hindi and English content reviewed for mistakes | G2 | ☐ |
| Construction and safety content reviewed by a civil engineering professional | G1 | ☐ |
| Workers or classmates can choose a language, find a lesson and finish a quiz | G6 | ☐ |

## Day 14 fix categories (from the roadmap) — what is already covered
| Roadmap task | Status before testing |
|---|---|
| Navigation problems | Back from every screen tested in the simulator (lesson → list → modules → Home; Scan → lesson → Home; Settings/About) |
| Button sizes | All 44 buttons ≥ 48 high; main buttons 56; tiles 140 |
| Audio errors | Missing / broken file → message, never a crash; audio stops when leaving |
| Quiz errors | Score = manual count (9 pairs × 5 patterns); double taps ignored; best score kept |
| Image clarity | 1080 × 720 JPG, 20–48 KB, word-free; replace any picture testers misread |
| Offline performance | No internet components; all media bundled; ≈ 7.4 MB APK |
| Language mistakes found in testing | Waits for Day 13 results |
