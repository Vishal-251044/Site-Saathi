# Day 11 + Day 12 · Audio, quiz, QR, My Skills, offline

Project: **`app-inventor/SITE_SAATHI.aia` v0.12** (9 Screens, 62 media files, 910 KB). Re-import it (delete or rename the old one first). If you changed blocks by hand, tell me first so your changes are not lost.

## Day 11 (Sat 28 Nov) · Audio + quiz

### Audio
- Every lesson has an **audio bar**: yellow play / pause button, "ऐका / Listen", restart. It stops when you leave the lesson or start the quiz (AUD-1).
- **No audio is recorded yet**, so tapping play shows: "The audio for this lesson is not recorded yet." (in the chosen language). The app never crashes on a missing file.
- When the 9 files exist, put them in **`media/audio/`** named exactly `SS-MAS-01_mr.mp3`, `SS-MAS-01_hi.mp3`, `SS-MAS-01_en.mp3` … (or `.m4a` if you choose that option; then the `audio` column in `lessons.csv` must say `.m4a` too). Then run `node tools/build-app.js` and re-import. The build bundles them automatically.
- Still open: **how to make MP3s** (Audacity / phone MP3 app / keep .m4a). Your decision.

### Quiz (QZ-1 … QZ-4)
Start quiz (after the safety page) → 5 questions, one per screen, progress bar, 4 large options →
first tap only: right answer turns **green**, a wrong pick turns **red**, "Correct!/Wrong" + the saved explanation → Next → result: **score (4 / 5)**, list of correct answers, badge at 4/5 or more, **Retry** and **Back to lessons**. Best score (`score_<id>`) and last date (`date_<id>`) are saved.

### Count scores by hand (roadmap Day 11)
The laptop simulator already checked **all 9 lesson-language pairs × 5 answer patterns** against a manual count (all matched). Please repeat on the phone for each lesson:

| Lesson | Correct letters q1–q5 | Tap these → expected score |
|---|---|---|
| SS-MAS-01 | B A D C A | all correct → **5 / 5** · always A → **2 / 5** |
| SS-CON-01 | A B C D B | all correct → **5 / 5** · always A → **1 / 5** |
| SS-SAF-01 | B C A D C | all correct → **5 / 5** · always A → **1 / 5** |

Also check: a second tap on another option changes nothing; Retry starts at question 1; after "always A" then "all correct", My Skills shows **best 5/5**.

## Day 12 (Sun 29 Nov, power day) · QR, My Skills, offline

### Scan (QR-1 … QR-4)
- Home → **Scan task QR**: the camera opens at once (built-in scanner, `UseExternalScanner` off).
- Scan the printed posters (`content/qr/QR_Posters_A5.pdf`) or the PNGs on a laptop screen:
  - SS-MAS-01 / SS-CON-01 / SS-SAF-01 → the lesson opens in your language; Back → Home.
  - **SS-TEST-99** → red box "This lesson is not in the app yet. Please ask your supervisor."
  - Any other QR (UPI, website) → "Not a SITE SAATHI code".
- Backup: type `ss-mas-01` in the box → Open (spaces and small letters are fine).

### My Skills (SKL-1, SKL-2)
Summary (completed / total + bar), a progress bar for each module that has lessons, every lesson with **Best score n/5**, **Viewed** or **Not started**, and badges (module icon) for scores of 4/5 or more. Tap a lesson to open it.

### About
Settings → About shows purpose, version, developer, **reviewer** ("—" until the expert signs; tell me the name and qualification and I'll add it), and the disclaimer.

### Offline test (airplane mode, on 2 phones)
The app uses no internet in v1.0: no Web/AI components (checked automatically).
1. Build → **Android App (.apk)** → install on your phone **and a second phone** (release track: first test APK).
2. Turn on **airplane mode**.
3. For each of the 3 lessons: open from Start learning, go through all steps, tap play (message until audio exists), do the quiz.
4. Scan each poster + SS-TEST-99; type a code.
5. Open My Skills: scores and badges are there; close and reopen the app: still there.
6. Change language and text size; everything still works.
7. Record results in the progress file (phone model + OK / problem).

### Final check: 9 lesson-language pairs
On the phone, switch language 3 times and open each lesson: no broken letters, no text cut off, every step has its picture. (Simulator: 9/9 open with all pictures bundled.)

## For changes
`node tools/build-app.js && node tools/check-aia.js && node tools/sim-aia.js` → 84 checks (Days 9–12).
