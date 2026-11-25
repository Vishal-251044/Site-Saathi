# Day 13 + Day 14 · Testing with real users, fixes, v1.0

## Day 13 (Mon 30 Nov) · Testing with real users
1. **Build a test APK**: import `app-inventor/SITE_SAATHI.aia` (v1.0-rc1) → Build → Android App (.apk). Install on **2 phones** (yours + a basic one).
2. **Print** `testing/Test_Kit.html`: page 1 once, the phone pages (A + B) twice, the tester page (C) 5 times, the issue log once.
3. **Functional test** F1–F8 and **offline test** O1–O7 on each phone (airplane mode for O).
4. **Usability** with 3–5 workers (the 2 who agreed on Day 2) or classmates, T1–T5, no names: choose language, find brick masonry, explain 3 pictures, finish a quiz. Note time, hesitation, help, and their exact words.
5. **Words not understood** → note the word they would use.
6. **Testing report**: open `testing/Testing_Report.html`. Sections 1–2 (laptop checks) are already filled. Fill 3–6 with what really happened (print and write, or send me your notes and I'll type them in). Rank the fix list H / M / L.

## Day 14 (Tue 1 Dec) · Fixes and v1.0
1. **Send me the fix list** (and the words to change). I change the generator / CSVs, rebuild, re-run all checks and send v1.0-rc2. Content fixes go into all three languages.
2. Go through `release/Release_v1.0_Checklist.md` gates G1–G8. **v1.0 is only built when all are ticked.**
3. Take phone **screenshots** (list in the testing report §7) → Drive `Builds/screenshots_v1.0/`.
4. **Rehearse the demo twice** with `release/Demo_Script.md`, once in airplane mode.
5. Back up `.aia` + `.apk` to Drive. Milestone M5: tested with real users, APK built, demo flow passes.

## Re-run all checks after any change
```
node tools/build-app.js && node tools/check-aia.js && node tools/sim-aia.js --report && node tools/prerelease-check.js && node tools/build-test-docs.js
```
