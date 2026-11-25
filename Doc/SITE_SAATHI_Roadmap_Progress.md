# SITE SAATHI · Roadmap progress

Legend: `[x]` done · `[~]` prepared by Claude, **needs your action** · `[ ]` not started
Rule: tick `[x]` only when the roadmap's "Done when" part is really done on the phone / in the field.

| Day | Date | Focus | Status |
|---|---|---|---|
| 1 | Wed 18 Nov | Kick-off, tools, site-visit prep | Prepared — your actions pending |
| 2 | Thu 19 Nov | Site visit: requirement collection | Field kit ready — visit pending |
| 3 | Fri 20 Nov | Requirement analysis & app flow | Structure final — findings wait for Day 2 notes |
| 4 | Sat 21 Nov | UI design part 1 (Figma) | Design + icons + font ready — Figma redraw and tests pending |
| 5 | Sun 22 Nov | UI design part 2 + clickable prototype | All screens + clickable prototype ready — classmate test pending |
| 6 | Mon 23 Nov | Content: brick masonry | SS-MAS-01 English draft + quiz + 7 images ready — your edit + reviewer pending |
| 7 | Tue 24 Nov | Content: concrete & safety | 2 lessons + quizzes + 14 images + 4 verified QR codes ready — sending to reviewer pending |
| 8 | Wed 25 Nov | Translation, audio, expert review | mr/hi drafts, translation check, CSV test, recording scripts, A5 posters ready — review, native check, recording, printing pending |
| 9 | Thu 26 Nov | App build 1: splash, language, home | Built + simulated (50/50) — phone test pending |
| 10 | Fri 27 Nov | App build 2: modules & lessons | Built + simulated — phone test pending |
| 11 | Sat 28 Nov | App build 3: audio & quiz | Built + simulated (scores = manual count, 9 pairs) — audio files + phone test pending |
| 12 | Sun 29 Nov | QR, My Skills, offline | Built + simulated (84/84) — APK on 2 phones + airplane test pending |
| 13 | Mon 30 Nov | Testing with real users | Test kit + report ready (laptop results filled) — real tests pending |
| 14 | Tue 1 Dec | Fixes & MVP v1.0 | v1.0-rc1 built; release gates G1–G8 open — **v1.0 not released** |
| 15–17 | 2–4 Dec | Admin Mode + lesson updates | 15–17 built in the admin .aia + backend; laptop tests pass — Google setup + phone tests pending |
| 18–19 | 5–6 Dec | AI + Supervisor Mode | 18–19 built + simulated (admin 215/215) — Helmet model, extension blocks, expert AI rating, phone tests pending |
| 20 | Mon 7 Dec | Final APK + demo pack | v1.1-rc1 built; demo pack, slides, install guide, checklist ready; gates H1–H10 open — **v1.1 not released** |

---

## Day 1 · Wed 18 Nov · Kick-off, tools & site-visit prep
**Done when:** site visit confirmed with permission; interview sheet printed; a test "Hello SITE SAATHI" screen runs on the phone through the AI2 Companion.

**Build · App Inventor**
- [~] App Inventor account + project `SITE_SAATHI` — starter `app-inventor/SITE_SAATHI.aia` made (Hi-Vis colours, Responsive sizing, logo, icon, Hello label, Test button + alert block). *You:* sign in and import it (manual fallback in `setup/Day01_Setup_Guide.md` §A).
- [~] AI2 Companion on the phone, run test screen — steps in setup guide §B. *You:* install, connect, tap Test, note whether the Marathi tagline renders.
- [~] Drive folders (Lesson database, Field notes, Designs, Builds) — structure in setup guide §C. *You:* create them in Drive.

**Content · Design**
- [x] Sheet tabs `lessons`, `quiz`, `strings` with column headers — `content/sheet/*.csv` (PRD §12.3 columns). `strings.csv` has 53 labels in mr/hi/en (**drafts, native-speaker check needed**). *You:* import into Google Sheet `Lesson_Database` (§D).
- [~] Figma + Canva accounts; brand colours and logo saved — `brand/Brand_Kit.md`, logo PNGs (yellow, charcoal, app icon 512/192) generated from the SVG by `tools/build-assets.js`. *You:* create accounts, add colour styles, upload logo.
- [x] 3 MVP lessons listed with main steps — `content/MVP_Lessons_Outline.md` (**draft, needs expert review**; numbers marked "confirm").

**Field · Test · Release**
- [~] Ask the faculty guide for a site contact and a content reviewer — message ready in `field/Day01_Messages_and_Call_Script.md` §1. *You:* send it.
- [~] Call the site; book the visit for Day 2 with the engineer's permission — call script (English + Marathi) and permission letter in the same file. *You:* call.
- [~] Interview sheet (8 questions: difficult work, language, smartphone, audio/images, internet, safety, QR use, testing) — `field/Interview_Sheet.html`, printable, en + mr + hi. *You:* native-speaker check, then print. If the original BRD has different wording for its 8 questions, swap it in.
- [x] Consent rule: no names or photos without permission — page 1 of the interview sheet (W1–W5 / S1–S2 codes, consent log, read-aloud consent script in mr/hi).

**Notes:** Python on this laptop is broken (missing `encodings`), so the PNGs and the .aia are built with Node (built-in modules only). The .aia has not been imported yet, so it is untested in App Inventor. If the import fails, use the manual steps.

---

## Day 2 · Thu 19 Nov · Site visit: requirement collection
**Done when:** notes from about 5 workers and 1–2 supervisors typed up; phone types, languages and internet at the site recorded; only actual findings written.

**Build · App Inventor**
- [ ] Note workers' phone brands, Android versions, free storage (with permission) — table on interview sheet p.2 and notes template §4.
- [ ] Check mobile signal and internet at the site — interview sheet p.4 (4 places on site).

**Content · Design**
- [ ] Photograph brick masonry, concreting, safety signs (with permission) — photo log on sheet p.4.
- [ ] Collect site words (मसाला, ओळंबा, थापी, सळई…) — `content/site_words.csv` pre-filled with 9 words to confirm; sheet p.4 to note new ones.

**Field · Test · Release**
- [ ] Talk to ~5 workers — sheet p.2 (print ×5).
- [ ] Talk to 1–2 supervisors: mistakes, safety, how they instruct — sheet p.3 (print ×2).
- [ ] Ask where QR posters could be placed — sheet p.3 Q5 and p.4.
- [ ] Ask 2 workers if they will test the app later — sheet p.2 Q8.
- [ ] Type notes the same evening; never claim more than was done — `field/Day02_Field_Notes_Template.md` (includes the P1–P6 assumption table for Day 3).

**Notes:** only you can do Day 2 work. After the visit, share the typed notes and I will help with Day 3 analysis. I will not invent findings.

---

## Day 3 · Fri 20 Nov · Requirement analysis & app flow
**Done when:** MVP feature list, screen list, app flow and lesson ID scheme are final; problem statement updated with real findings and shared with the faculty guide.

**Build · App Inventor**
- [x] 9-Screen structure fixed — `analysis/Day03_Requirement_Analysis.md` §3 (screens, arrangements inside each, navigation ≤ 2 taps). **Open question:** Admin Mode would be a 10th Screen vs CLAUDE.md's 9 max; recommendation (a) Scan inside Learn → Admin gets the slot. Your decision, before Day 15.
- [x] TinyDB keys and CSV columns planned — §5–6. One change: `duration_min` added at the end of `lessons.csv` (MOD-2 needs it; PRD §12.3 header lacked it). Quiz options fixed as `a,b,c,d`.
- [~] Early risk check: BarcodeScanner (external off) — "Test QR scanner" added to `SITE_SAATHI.aia` (shows `upcase(trim(result))`). *You:* scan any QR on both phones; record in `setup/Day03_04_Guide.md` table.

**Content · Design**
- [x] Lesson IDs final: `SS-MAS-01`, `SS-CON-01`, `SS-SAF-01`; test `SS-TEST-99` — §4.
- [~] Lesson outlines (objective + 5–7 steps) — `content/MVP_Lessons_Outline.md` (draft, expert review). *You:* revise with field-note mistakes and site words.

**Field · Test · Release**
- [ ] Mark each problem assumption confirmed / changed / not seen — table §1 ready, **blocked on typed Day 2 notes** (not invented).
- [x] Separate MVP vs future features — §2.
- [x] App flow drawn — `analysis/App_Flow.html`.
- [ ] Share summary with the faculty guide — `analysis/Day03_Summary_for_Faculty_Guide.md` ready; fill the [brackets] from field notes, then send.

---

## Day 4 · Sat 21 Nov · UI design part 1 (Figma)
**Done when:** Figma has the style guide plus Splash, Language, Home, Modules and Lesson List screens, with large buttons and labels in 3 languages.

**Build · App Inventor**
- [x] App icon and logo PNG for App Inventor — `brand/app_icon_512.png`, `logo_yellow_512.png` (already in the .aia).
- [~] Test Noto Sans Devanagari in an App Inventor label — fonts downloaded (`brand/fonts/`, OFL licence) and bundled in the .aia with 3 test labels (phone font vs Noto vs Noto bold, hard conjuncts). *You:* check on both phones; record result.

**Content · Design**
- [~] Figma style guide (colours, text sizes, 48 dp+ buttons, icons) — full reference in `design/UI_Design_Part1.html` §1. *You:* recreate as Figma styles/components (`setup/Day03_04_Guide.md`).
- [~] Splash, Language Selection, Home — designed in mr / hi / en with Large-text option; PNGs in `design/exports/`. *You:* redraw in Figma (360 × 740).
- [~] Learning Modules and Lesson List — same; "Coming soon" state for REI / CUR / QUA.
- [x] Module icons (brick, mixer, rebar, helmet, water drop, check) — `design/icons/icon_mod_*.svg` (made as SVG instead of in Canva; they import into Canva and Figma).

**Field · Test · Release**
- [ ] Show the Home design to 2 people: can they guess each button? — record sheet in `setup/Day03_04_Guide.md`; use `design/exports/home_mr.png` / `home_hi.png`.

**Notes:** New strings added for the design: `title_modules`, `lbl_lessons`, `lbl_min`, `lbl_audio` (57 labels total, drafts for native-speaker check). The wordmark "SAATHI" uses rust `#C2410C` on light backgrounds, taken from the PRD §14.1 lockup; it is used only in the wordmark, never for buttons. Home has empty space below the Continue card on purpose: the v1.1 Ask Saathi bar and Safety Check tile go there (Day 5).

---

## Day 5 · Sun 22 Nov · UI design part 2 + clickable prototype (power day)
**Done when:** a clickable Figma prototype covers the full journey (open → lesson → quiz → My Skills → QR); v1.1 AI screens designed; feedback recorded.

**Build · App Inventor**
- [x] Icons and UI images at App Inventor sizes — `media/`: 48 icons (`ic_<name>_k/_w.png`, 144 px = 48 dp × 3), 6 module icons, all transparent PNG. Made by `tools/build-app-assets.js` + `tools/export-media.sh`.
- [x] Button backgrounds (rounded yellow / charcoal) — `bg_btn_yellow/charcoal/outline/danger/ai.png` (990 × 168) and `bg_tile_*.png` (480 × 384), drawn at their real aspect so corners don't stretch.

**Content · Design**
- [x] Lesson Details: intro (description, objective, materials), step view (picture, 1–2 sentences, step dots, Back / Next), audio bar (play / pause / restart), safety box (red) + mistakes box (yellow) before the quiz.
- [x] QR Scanner (viewfinder, not-found / not-SS messages, type-code box), Quiz (answered state, explanation), Quiz Result (score ring, correct answers, Retry, badge at ≥ 4/5), My Skills (progress, statuses, badges), Settings (language, text size, read-aloud help, storage, reset with confirm), About (purpose, version, developer, reviewer, disclaimer).
- [x] v1.1 screens: Home with blue Ask Saathi bar + Safety check tile + smart-revision card, Ask Saathi (chat, AI label, related lesson, suggestions, mic) + offline state, Quiz "Why?", Helmet Check (helmet / no helmet, confidence, disclaimer), Supervisor Mode (PIN pad, workers × lessons table, share).
- [~] Link screens into a clickable prototype — **done as `design/Prototype.html`** (works in Chrome on laptop or phone; reads the real CSVs; saves quiz scores; language / large text / v1.1 / offline toggles). 22 screens × 3 languages exported to `design/exports/day05/`. *You:* the roadmap says Figma: redraw the new frames and link them (guide in `setup/Day05_06_Guide.md`), or tell me if the HTML prototype is enough for you.

**Field · Test · Release**
- [ ] Test the prototype with 2–3 classmates; note where they get confused — task sheet in `setup/Day05_06_Guide.md`.
- [ ] Fix the top 3 issues — waits for that test. Send me the 3 problems and I'll update the prototype.
- [ ] Sunday extra: design review with the faculty guide (`Prototype.html#gallery`).

**Notes:** 35 new labels added to `strings.csv` for these screens (92 total, mr/hi drafts). In the prototype CON and SAF show "Coming soon" until their rows are added on Day 7, which is the MOD-1 rule working. In mr/hi the lesson text falls back to English with a visible design note until the Day 8 translations. AI answers in the Ask Saathi design are samples, not reviewed. Developer name appears in About as the PRD (SET-2) requires.

---

## Day 6 · Mon 23 Nov · Content: brick masonry lesson
**Done when:** SS-MAS-01 in English is complete in the Google Sheet: objective, materials, steps, precautions, mistakes, 5 quiz questions with explanations, and step images.

**Build · App Inventor**
- [x] Step images ~1080 px wide, named `SS-MAS-01_s1.jpg` … `_s7.jpg` — `media/` (1080 × 720, 20–50 KB each). Simple word-free drawings from `tools/build-illustrations.js`; each checked by eye for the correct method (steps 4, 5, 6 were redrawn after checking). Replace with permitted site photos if available.

**Content · Design**
- [x] AI Content Studio draft, then edit — `content/lessons/SS-MAS-01_en.md`: description, objective, 9 materials, 7 steps, 5 safety points, 7 mistakes. Sheet rows in `content/sheet/lessons.csv` (en). **Needs your edit + expert review.**
- [x] 8 quiz questions with explanations, best 5 kept (reasons in the lesson file) — `content/sheet/quiz.csv` (answers spread B, A, D, C, A).
- [x] Step images — see above.
- [x] AI prompts saved for the report — `content/AI_Prompts_Log.md` (5 entries, with human-check column).

**Field · Test · Release**
- [~] Send SS-MAS-01 to the content reviewer — printable `content/review/SS-MAS-01_Review_Sheet.html` (text, images, quiz, 7 values to confirm, sign-off). *You:* import the CSVs into the sheet, edit, print / PDF, send; deadline Wed 25 Nov.

**Values the reviewer must confirm:** soaking cue (until bubbles stop) · 1 : 6 example ratio · use mortar within 30 min · 10 mm joints · frog up · 7 days curing · daily height limit.

---

## Day 7 · Tue 24 Nov · Content: concrete work & site safety
**Done when:** SS-CON-01 and SS-SAF-01 complete in English with images and quizzes; all 3 lessons with the reviewer; QR codes generated.

**Build · App Inventor**
- [x] QR codes for SS-MAS-01, SS-CON-01, SS-SAF-01 and test SS-TEST-99 — `content/qr/*.png|svg`, plain text = lesson ID only (QR-2), error correction Q, version 1 (21 × 21). **Each decoded back to its exact ID with jsQR** (`node tools/build-qr.js` fails if any does not). Phone scan check pending (*you*).

**Content · Design**
- [x] SS-CON-01 (Concrete Work – Basic Procedure): 10 materials, 7 steps, 5 safety, 6 mistakes — `lessons.csv`. **Draft, needs your edit + expert review.**
- [x] SS-SAF-01 (Site Safety – Basic Precautions): 6 items, 7 steps, 4 safety (incl. AIR-4 "stop and ask your supervisor"), 5 mistakes. **Draft, needs review.**
- [x] Images for both lessons — 14 word-free drawings, `media/SS-CON-01_s1–7.jpg`, `SS-SAF-01_s1–7.jpg`; checked on a contact sheet, 3 redrawn (supervisor position, stray marker, hand).
- [x] Quizzes: 8 drafted, 5 kept per lesson with reasons — `content/lessons/Quiz_Drafting_CON_SAF.md`; answers CON A B C D B, SAF B C A D C.

**Field · Test · Release**
- [~] Send lessons to the reviewer; agree Day 8 deadline — 3 printable packets in `content/review/` (generated from the CSVs, with pictures, quiz, values to confirm, sign-off). *You:* print / PDF and send.

---

## Day 8 · Wed 25 Nov · Translation, audio & expert review
**Done when:** reviewer corrections applied; Marathi and Hindi checked by native speakers; 9 audio files recorded and compressed; CSV files exported; QR posters printed.

**Build · App Inventor**
- [x] Export lessons.csv, quiz.csv, strings.csv (UTF-8) — checked: valid UTF-8, **no BOM**, LF line endings; 9 lesson rows, 45 quiz rows, 92 labels. After sheet edits, re-export from Google Sheets (guide step 3).
- [~] Test Marathi text from the CSV in App Inventor — `.aia` now bundles `strings.csv` and a **Read strings.csv** button (File.ReadFrom `//strings.csv` → label in Noto Devanagari). *You:* run on the phone, record result.

**Content · Design**
- [ ] Apply the expert's review comments to all 3 lessons — waits for the reviewer. Changes must go into en, mr **and** hi rows.
- [~] Translate to Marathi and Hindi — **AI drafts done** for all 3 lessons + 15 quiz questions per language (6 lesson rows, 30 quiz rows; same answer letters). *You:* native-speaker check with `content/review/Translation_Check.html` (194 rows incl. all app labels).
- [ ] Record audio 3 × 3 — scripts ready: `content/audio/Recording_Scripts.html` (9 files, estimated 1.9–3.0 min each, AUD-2). Record after review + translation check.
- [ ] Convert to MP3 mono, trim silence — **open question below.**
- [x] QR posters (code + lesson name in 3 languages) — `content/qr/QR_Posters_A5.pdf` (4 A5 pages incl. TEST), source `design/QR_Posters.html`, meets QR-5. Built in HTML instead of Canva.

**Field · Test · Release**
- [ ] Print and laminate the QR posters — *you* (college lab; lamination optional).

**Open question (audio):** this laptop has no MP3 tool (no ffmpeg/lame), and CLAUDE.md says to ask before adding a tool. Options: (a) free **Audacity** on the laptop (trim, mono, export MP3); (b) a free phone recorder app that saves MP3 directly; (c) keep the phone's own format (.m4a — App Inventor's Player plays it) and change the `audio` column to `.m4a`, which differs from PRD AUD-1/AUD-2 (MP3 mono). Recommendation: (a). **Your decision needed.**

**Note:** the mr/hi translations were drafted before the expert review, so any reviewer change must be copied into all 3 languages. Day 5 screen PNGs were re-exported: CON and SAF now open real lessons in the prototype.

---

## Day 9 · Thu 26 Nov · App build 1: splash, language, home
**Done when:** on the phone, the app shows the splash, saves the language choice, and Home and Settings show labels in the chosen language from strings.csv.

**Build · App Inventor** — `app-inventor/SITE_SAATHI.aia` v0.10, generated by `tools/build-app.js`
- [x] 9 Screens created (Screen1, Home, Learn, Quiz, Scan, Skills, Ask, Safety, Settings); Media: logo, app icon, Noto Devanagari regular + bold, lessons/quiz/strings CSV, 21 step pictures, tiles, buttons (49 files, 845 KB).
- [x] Screen1: Clock 2 s → Language Selection (first time) or Home (SPL-1); Back from Home exits the app.
- [x] Language buttons save TinyDB `lang` = mr / hi / en (LNG-2); chosen button turns yellow; spoken prompt via TextToSpeech (LNG-1).
- [x] Procedure to load strings.csv and set all labels (`loadSettings` → `FileStr.GotText` → `t(key)` → `applyLabels`) on every Screen (LNG-3, no hard-coded labels except the language names in their own script and the brand name).
- [x] Home tiles (icon + label tile images), Settings (language, text size Normal / Large ×1.2, read-aloud help, storage, About, reset with confirmation), app icon.
- **Checks:** `tools/check-aia.js` (all component / procedure / variable / media references OK) and `tools/sim-aia.js` (runs the real blocks with the real CSVs: **50/50** Day 9–10 checks pass). One generator bug was found by the simulator and fixed (a nested chain made blocks after the Settings `mark` step unreachable).

**Content · Design**
- [ ] Check all Marathi and Hindi labels on the real phone (no broken letters) — *you*.

**Field · Test · Release**
- [ ] Daily .aia backup to Drive — *you* (export after import).

**Not yet verified:** importing into App Inventor itself. The generator writes App Inventor's file format from scratch, so if the import reports an error, send me the exact message.

---

## Day 10 · Fri 27 Nov · App build 2: modules & lessons
**Done when:** all 3 lessons open from Start Learning in all 3 languages with images, steps, precautions and mistakes; "Coming soon" shows for modules without lessons.

**Build · App Inventor**
- [x] Learn: module grid → lesson list (ListView) → lesson details as show / hide arrangements; Back walks back one level (modules ← list ← lesson), then Home.
- [x] Read lessons.csv (`File.ReadFrom "//lessons.csv"`) and pick the row for the chosen language (`rowFor`, English fallback).
- [x] Procedure `openLesson(id)` (trim + upper case, clear message if unknown — ready for Day 12 QR); step view with Next / Back and "Step n / 7" counter; intro page (picture, description, objective, materials).
- [x] Safety (red) and mistakes (yellow) boxes after the last step, then Start quiz → Quiz screen with the lesson ID (placeholder until Day 11); `viewed_<id>` saved (LES-4).
- [x] Last lesson and step saved for the Continue card; Continue reopens the same step.
- Simulated: all 3 lessons open; Hindi + large text journey; Continue at Concrete step 4 in Marathi; unknown ID → message.

**Content · Design**
- [ ] Shorten any text too long for the screen — after the phone test (*you* note, I shorten in the CSV).

**Field · Test · Release**
- [ ] Quick check with 1 classmate: can they find and read a lesson? — *you*.

**Notes:** Home tiles have no English subtitle (an App Inventor Button can't show two text sizes). Audio bar comes on Day 11 with the Player. Ask and Safety Screens exist but are not linked from Home until v1.1. Open question from Day 3 still applies: Admin Mode needs a 10th Screen or must live inside one of these 9.

---

## Day 11 · Sat 28 Nov · App build 3: audio & quiz
**Done when:** audio plays for every lesson and language; quizzes load 5 questions, show right / wrong with explanations and save the best score; scores match manual counting.

**Build · App Inventor** — `SITE_SAATHI.aia` v0.12
- [x] Player: play / pause / restart (yellow button + label + restart icon); stops when leaving the lesson or starting the quiz; a missing or broken file shows "audio not recorded yet" (Screen.ErrorOccurred), never a crash. Audio files in `media/audio/` are bundled automatically.
- [x] Quiz screen loads quiz.csv for the lesson and language (English fallback), 5 questions, progress bar, 4 large options.
- [x] Score logic: first tap counts; right = green, wrong pick = red + right answer green; saved explanation shown (QZ-2).
- [x] Result: score n / 5, list of correct answers, badge at ≥ 4/5, Retry, Back to lessons (list then shows "Completed"); `score_<id>` keeps the **best** score, `date_<id>` the last attempt (QZ-4).

**Content · Design**
- [ ] Re-record any unclear audio — no audio recorded yet; **MP3 tool decision still open** (Day 8).

**Field · Test · Release**
- [~] Count scores by hand for every lesson and compare — **simulator: 9 lesson-language pairs × 5 answer patterns, app score = manual count every time, best score kept, date saved**. *You:* repeat on the phone with the answer key in `setup/Day11_12_Guide.md`.

---

## Day 12 · Sun 29 Nov · QR scanning, My Skills & offline (power day)
**Done when:** each printed QR opens the right lesson; SS-TEST-99 shows the clear message; My Skills shows completed lessons and scores; everything works in airplane mode on 2 phones.

**Build · App Inventor**
- [x] Scan: BarcodeScanner (UseExternalScanner off) opens at once from Home → `upcase(trim(result))` → not "SS-…" → "Not a SITE SAATHI code"; not in lessons.csv → QR-3 message; else open Learn on that lesson; Back → Home.
- [x] Not-found message in 3 languages; "Type lesson code" box + Open (QR-4).
- [x] My Skills: summary + bar, progress bar per module with lessons, each lesson Best score / Viewed / Not started, badges at ≥ 4/5, tap to open; refreshes on return (SKL-1, SKL-2).
- [x] About screen with reviewer credit (shows "—" until the expert signs) and disclaimer (done Day 9).

**Content · Design**
- [~] Final check of all 9 lesson-language pairs — simulator: 9/9 open, every step picture bundled, safety page present. *You:* check on the phone for broken letters / long text.

**Field · Test · Release**
- [ ] Airplane mode: open each lesson, play audio, do a quiz, scan each QR — *you* (v1.0 has no internet components; checked automatically).
- [ ] Install and test on a second phone (first test APK: Build → Android App .apk) — *you*.

**Checks:** `check-aia.js` OK; `sim-aia.js` **84/84** (Days 9–12). Two more generator bugs were caught by the simulator and fixed before you got the file: the module progress rows ignored their show/hide rule (every module row would have shown), and a bracket error put the summary inside the lesson loop.

**Sunday extras:** manual code entry ✓ · My Skills badges ✓ · full airplane-mode run and second-phone test → *you*.

---

## Day 13 · Mon 30 Nov · Testing with real users
**Done when:** functional, offline and usability tests done with 3–5 workers or classmates; testing report has actual observations, screenshots and a ranked fix list.

**Build · App Inventor**
- [ ] Build a test APK and install on 2 phones — *you* (`SITE_SAATHI.aia` v1.0-rc1).

**Content · Design**
- [ ] Note any words testers did not understand — log in `testing/Test_Kit.html` (C).

**Field · Test · Release**
- [~] Functional test checklist (8) — `testing/Test_Kit.html` A (F1–F8). Derived from PRD §06/§11.6 because the original BRD list is not in Doc/; swap in the BRD wording if different.
- [~] Offline test (7 steps) — Test kit B (O1–O7).
- [~] Usability: choose language, find a lesson, understand images (3 pictures), finish a quiz — Test kit C, T1–T5, target ≥ 4/5 without help.
- [~] Testing report with actual feedback only — `testing/Testing_Report.html`: §1 laptop simulation (84/84) and §2 pre-release rules (11/12, audio missing) **filled automatically**; §3–6 left empty for real observations (honesty rule printed on it).

---

## Day 14 · Tue 1 Dec · Fixes & MVP release v1.0
**Done when:** high-priority issues fixed; SITE_SAATHI_v1.0.apk installed and tested on 2 phones; MVP demo flow runs without errors; screenshots saved.

**Build · App Inventor**
- [~] Fix navigation, button sizes, audio and quiz errors — pre-checked before testing (`tools/prerelease-check.js`): all 44 buttons ≥ 48, back paths simulated, missing audio handled, quiz = manual count. Fixes from real testing wait for the Day 13 fix list.
- [x] Image clarity and offline performance — 21 pictures 20–48 KB at 1080 px, no internet components, ≈ 7.4 MB APK.
- [ ] Build → Android App (.apk) **v1.0**; install and retest — blocked by gates G1–G8 in `release/Release_v1.0_Checklist.md`. Current build is **v1.0-rc1** (VersionCode 10).
- [ ] Back up .aia and APK to Drive — *you*.

**Content · Design**
- [ ] Correct language mistakes found in testing — waits for Day 13.
- [ ] App screenshots for the report — *you*, real phone (list in report §7).

**Field · Test · Release**
- [~] Rehearse the MVP demo twice (once in airplane mode) — `release/Demo_Script.md` (PRD §11.6 steps 1–8, ≈ 5 min, fallbacks).
- [ ] Milestone: MVP done; AI work starts only after this — **not reached**.

**Also ready:** `release/Install_Guide_v1.0.md` (one page). About screen reviewer credit is one constant (`REVIEWER` in `tools/build-app.js`) to set after the expert signs (LES-5).

**Blocking v1.0:** expert review (G1), native-speaker check (G2), audio recording + MP3 tool decision (G3), real phone/user tests (G5–G7).

---

## Decisions (18 Nov 2026, before Day 15)
- v1.0 gates are still open, so Admin Mode is built in a **separate file** `app-inventor/SITE_SAATHI_admin.aia` (v1.1-dev1); `SITE_SAATHI.aia` stays the v1.0 release candidate. Merge after v1.0 is released.
- 9-Screen rule kept: **Scan moved into Learn**; the freed Screen is **Admin**.
- Photo / audio upload uses a free **Base64 extension** (user-approved, PRD ADM-4); user imports it and adds 2 blocks.

## Day 15 · Wed 2 Dec · Admin Mode 1: backend, login & lessons
**Done when:** a team member opens the hidden Admin Mode, logs in (role checked by the script), and creates lesson SS-REI-01 with text in 3 languages, saved in the Google Sheet.

**Build · App Inventor** (`SITE_SAATHI_admin.aia`, generated by `node tools/build-app.js --admin`)
- [x] Admin screen: hidden entry (Settings → About → tap version 5×), login, dashboard (live / to review / version), lesson list with status and missing count.
- [x] Lesson editor: choose module, automatic lesson ID (server), duration, one language at a time (मराठी / हिंदी / English), title, description, objective, materials / safety / mistakes one per line.
- [x] Session token in TinyDB with 12-hour expiry; Log out clears it; reopening within 12 h goes straight to the dashboard; 5-try lockout (server, 10 min) shown on the login page.

**Content · Design**
- [x] Google Sheet tabs modules, lessons, lesson_text, steps, quiz, reviews, strings, team, publish_log, pub_lessons/pub_quiz/pub_strings/pub_files, manifest — `content/admin-sheet/SITE_SAATHI_Content.xlsx` (open as Google Sheet). `team.qualification` added for "Reviewed by: name, qualification" (LES-5); `pub_files` holds the manifest's media list.
- [x] 3 MVP lessons moved into the sheet (9 language rows, 21 steps, 45 quiz rows) as **In review** (not yet expert-approved).

**Field · Test · Release**
- [x] Apps Script web app: login (salted + peppered SHA-256 hashes), listLessons, getLesson, saveLesson — `backend/apps-script/*.gs`, small files with try/catch and clear messages; secrets only in Script Properties. *You:* paste, set properties, deploy (`setup/Day15_16_Guide.md` Part B).
- [~] Team: Admin (you), Reviewer (faculty guide), 1 Writer — `setupFirstAdmin()` + `addMember_` from the editor. **No Team screen in the app yet** (PRD 10.13.3 lists one; can be added on Day 17).
- [~] Test wrong-password lockout and Writer permissions — laptop: backend 56/56 and app+backend simulation 136/136 pass; *you:* on the phone.

## Day 16 · Thu 3 Dec · Admin Mode 2: photos, audio, quiz & publish
**Done when:** a writer adds steps with photos and recorded audio (stored in Cloudinary), adds 5 quiz questions and submits; the reviewer approves; the admin publishes and the content version goes up.

**Build · App Inventor**
- [~] Steps editor: Camera / ImagePicker → Base64 extension → upload with progress and Retry — built; **the 2 extension blocks are yours to add** (Part E). Until then the app says "Add the Base64 extension blocks first".
- [x] Audio: record with SoundRecorder, listen, upload (per language); or "read-aloud only".
- [x] Quiz editor (5 questions × chosen language, correct A–D, explanation); completeness checks from the server (ADM-6); Submit for review only when complete.
- [x] Review (Reviewer/Admin): lesson + checks + last comment, Approve / Send back (comment required); Publish button for Admin only, with confirmation.

**Content · Design**
- [ ] Cloudinary free account, keys in Script Properties; Drive backup folder — *you* (Part C).
- [x] QR codes screen (list, QR picture with only the ID, poster place, printed) and App texts editor (3 languages required) — both done on Day 16 (not moved to Day 17).

**Field · Test · Release**
- [x] Script actions: uploadMedia (Cloudinary signed upload, photos ≤ 1080 px, audio → MP3; Drive backup), saveStep, saveQuiz, submit, review, publish (+ getPublished for Day 17).
- [~] Role test: Writer cannot publish, Reviewer cannot edit — passes on the laptop; *you:* on phones.

**Not verified yet:** real Google Apps Script / Sheets / Cloudinary, the App Inventor import of the admin file, camera, microphone and the Base64 extension. Send me any error message exactly.

---

## Day 17 · Fri 4 Dec · Lesson updates on phones & read-aloud (admin build)
**Done when:** a worker phone taps "Check for new lessons", downloads SS-REI-01 with its photos and audio, and opens it in airplane mode and by QR; speaker buttons read lesson text aloud.

**Build · App Inventor** (`SITE_SAATHI_admin.aia`; v1.0 file unchanged in logic)
- [x] Script getPublished (Day 16) + app update flow: Settings "Check for new lessons" → manifest/version compare → "n lessons · f files, use Wi-Fi?" → download each file (Web SaveResponse, `DefaultFileScope = App`, already-downloaded files skipped) → switch version only when all arrived; failure keeps the old version + message (UPD-1..4). Home checks quietly once a day and shows "New lessons available" (never downloads by itself).
- [x] Load lessons from downloaded files first, built-in otherwise (Learn, Quiz, Scan, My Skills; published labels too) — built-in lessons never deleted (UPD-4, UPD-5); unknown QR while online → "may be new" (UPD-6).
- [x] TextToSpeech read-aloud (mr / hi / en, country IND) with speed setting slow / normal: lesson intro, every step, safety box, mistakes box, quiz question + options; stops when leaving; no voice → install help (RAL-1..3).
- [x] Settings: downloaded files + content version, "Clear downloaded lessons" (asks first; built-in lessons and scores stay). Reset my progress now clears only progress.

**Content · Design**
- [ ] Print the SS-REI-01 QR poster from the QR codes screen — *you*, after it is published.

**Field · Test · Release**
- [~] Test: a failed download keeps the old version; airplane-mode test after the update — **simulated** (file 3 fails → old version kept; retry → v1 → airplane mode: lesson, pictures, audio, quiz, QR all from the download). *You:* on 2 phones.
- [ ] Check Marathi / Hindi voices offline — *you* (phone-dependent; record in the testing report).

---

## Day 18 · Sat 5 Dec · Ask Saathi voice assistant & Explain My Mistake (admin build)
**Done when:** Ask Saathi answers typed and spoken questions in 3 languages with the construction-only persona and speaks the answer; offline shows a friendly message; quiz "Why?" works online and offline.

**Build · App Inventor**
- [x] Ask screen: ChatBot with System persona (from the strings sheet), chat bubbles (HTML label), 4 suggested questions; ChatBot error → backup → "Saathi needs internet. Open the lessons instead." + button (ASK-1, ASK-2, ASK-4).
- [x] SpeechRecognizer (mr-IN / hi-IN / en-IN) → ChatBot → TextToSpeech (ASK-3); "Open lesson SS-…" when the AI names a lesson that exists.
- [x] Quiz "Why?" button on wrong answers: AI online (prompt with question, worker answer, correct answer, language), saved explanation offline (EXP-1, EXP-2).
- [x] AI label on every answer, New chat; Q&A log on the phone without names (ASK-5, ASK-6).
- [x] Free backup: Apps Script `ask` → Gemini **free tier** (key only in Script Properties, sent as a header; only the question text; rate-limited 10/min, 300/day) (ASK-7, AIR-3). *You:* get the free key, paste `Ask.gs`, deploy a new version.

**Content · Design**
- [~] Persona text and 20 test questions with the expert — persona in strings (`ai_persona`, editable via App texts + Publish, no new APK); `content/ai/Ask_Saathi_Test_Questions.html` (20 questions: 4 modules, 8 unsafe "STOP" topics, off-topic, privacy, voice). *You:* go through them with the expert.

**Field · Test · Release**
- [ ] Expert rates the 20 answers; improve the persona — *you* (target: most acceptable, 0 unsafe).
- [ ] Test voice input in a noisy place — *you*.

**Checks:** backend 65/65 · admin build 188/188 · v1.0 release candidate 84/84 (logic identical to before).
**Notes:** the MIT ChatBot **Token** cannot be put into a generated file: check ChatBot1's Token in the Designer (guide). Day 15 open item still open: no Team screen in the app (members are added from the script editor).

## Day 19 · Sun 6 Dec · Helmet Check, Supervisor Mode & smart revision (admin build)
**Done when:** Helmet Check gives a result on a phone with a written accuracy on new photos; unsupported phones hide it; Supervisor Mode keeps first name + trade only, on the phone.

**Build · App Inventor**
- [x] Safety screen: Camera → photo → result "Helmet on" (green) / "No helmet" (red) + confidence %, disclaimer "Training aid only", "photo stays on this phone", link to the Safety lesson; no internet component on the screen (HLM-1..4).
- [x] Not supported → saved on the phone, Home tile hidden from then on (HLM-5); `helmetUnsupported` procedure for the extension's Error event.
- [~] Personal Image Classifier: extension + `model.mdl` + 3 blocks — *you* (`setup/Day19_20_Guide.md` Part A). Until then the screen shows "add the extension and model first".
- [x] Supervisor Mode from Settings: 4-digit PIN set on first use, 5 wrong → 1 minute wait; workers = first name + trade (surname dropped); "Who is learning?" before each lesson; best score per worker; table workers × lessons; share as plain text (SUP-1..4).
- [x] Smart revision (rule-based, offline): lowest score below 3/5 → "Suggested for you: Repeat …" on Home and My Skills (FR-17).
- [x] 17 new labels in 3 languages (supervisor, trades, helmet messages).

**Field · Test**
- [ ] Collect consented helmet / no-helmet photos, train, export the model — *you*.
- [ ] Accuracy on 20 photos never used in training: **__ %** — *you* (real number only).
- [ ] Supervisor Mode + Helmet Check on a phone; 30–60 s demo video — *you*.

**Checks:** admin build 215/215 (27 new Day 19 checks: PIN, lock, first-name only, per-worker score, table, share, revision, helmet results, no internet on Safety, unsupported) · v1.0-rc 84/84 · backend 65/65.

## Day 20 · Mon 7 Dec · Final APK, demo pack & presentation
**Done when:** final APK installed fresh on a phone, demo rehearsed, slides and backup ready.

**Release**
- [x] Admin build version **1.1-rc1** (code 21). It becomes 1.1 (code 22) only when `release/Release_v1.1_Checklist.md` gates H1–H10 pass (H1 = all v1.0 gates).
- [x] `release/Release_v1.1_Checklist.md`: gates, fresh-install test list, release steps, backup list (no keystore, keys, passwords or helmet photos in shared places).
- [x] `release/Install_Guide_v1.1.md`: one page — unknown sources, permissions (camera, mic, internet), Supervisor PIN, Admin Mode entry (no password in the guide).
- [x] `release/Demo_Script.md`: steps 9–12 (Ask Saathi + Why?, Helmet Check, Supervisor Mode, Admin Mode), preparation and fallbacks.
- [x] Slides (11): problem → field findings → solution → demo → Admin → AI → ₹0 stack → results → next steps. Link: https://claude.ai/artifact/BdDnKdLni1syzo2WURzFhB (private until you share it; source copy in `release/slides_source/`). Field findings and real test results are **bracketed placeholders** — fill from your notes only.
- [x] `release/Retrospective.md` template · `setup/Day19_20_Guide.md`.
- [ ] App Inventor: import, hand steps (Base64, ChatBot Token, PIC), **Build APK**, fresh-install test — *you*.
- [ ] Backup to Drive `SITE_SAATHI/Builds/v1.1/` — *you*.
- [ ] Rehearse twice (once in airplane mode for steps 1–8); present; fill the retrospective — *you*.

**Honest status (19 Nov 2026):** all 20 days are built and tested on the laptop. Nothing is tested on a real phone yet, no lesson is expert-reviewed, Marathi/Hindi are not native-checked, there is no audio (MP3 tool decision still open), and the admin .aia has not been imported into App Inventor yet. So v1.0 and v1.1 are **release candidates**, not releases.

### Build log · 19 Nov 2026 (evening)
- [x] **First App Inventor import + build:** `SITE_SAATHI.aia` (worker v1.0-rc1) imported and built on ai2.appinventor.mit.edu without errors → `SITE_SAATHI.apk` (5.1 MB, signed by App Inventor). Checked on the laptop: version 1.0-rc1, 9 screens incl. Scan, all 65 media files byte-identical to the project.
- [x] Versioned copy: `builds/worker/v1.0-rc1/SITE_SAATHI_v1.0-rc1.apk`, logged in `builds/VERSIONS.md` (`node tools/save-build.js`). Your copy in `APK/` is kept as is.
- [ ] Install on 2 phones → Test Kit F1–F8 + airplane O1–O7 (`testing/Test_Kit.html`) — *you*. This unlocks gate G5.
- [ ] Admin build: import `SITE_SAATHI_admin.aia`, build, `node tools/save-build.js --admin --from-downloads` — *you*.

### UI v2 · 19 Nov 2026 (after the first phone install)
Feedback from the first install: cramped layout, no padding, buttons badly arranged, no animation, not modern.
- [x] **Root cause found:** 10 rows (20 in the admin app) were wider than the page (App Inventor % = % of the screen), so content ran into the screen edge. The generator now fits every row to its page; `check-aia.js` fails on any overflowing row.
- [x] **Look:** "Device Default" theme set (without it App Inventor used Classic), warm grey page with white cards, 4% side margins, padded info boxes, bigger bold labels (FontBold so English text is bold too).
- [x] **Buttons:** redrawn with a 16 dp radius and a pressable bottom edge; full / half / third width pictures so corners never stretch; soft borders instead of hard black outlines; square Home and module tiles with the icon in a circle.
- [x] **Motion:** screens slide in and out; splash logo pops in with a loading bar; My Skills bars and the quiz score bar fill with an ease-out animation.
- [x] **Bug fixed:** progress bars measured against the screen instead of their track (100% spilled over, 67% looked wrong).
- [x] New laptop preview of the real screens: `node tools/preview-aia.js` → `design/app-preview/` (worker + admin, en/mr).
- [x] Versions: worker **v1.0-rc2** (code 11), admin **v1.1-rc2** (code 22); tests 84/84 · 215/215 · 65/65.
- [ ] Build rc2 in App Inventor, install over rc1, check on the phone — *you*.

### Full UI + function check · 19 Nov 2026 (rc3)
- [x] Every screen and state rendered from the real blocks (worker 16 states, admin build 30 states incl. all 8 admin pages, Supervisor, Ask, Helmet Check), en + mr → `design/app-preview/`.
- [x] **Bug fixed:** Supervisor mode showed raw codes (`[btn_next]`, `[btn_add_worker]`, `[btn_share]`, `[sup_lock]`, `[sup_trade]`). Cause: labels added after a screen's shared code were never translated. `applyLabels` is now built last; new test opens all 9 screens in mr/hi/en and fails on any `[key]`.
- [x] **Bug fixed:** admin title bar said "Content team login" on every page; now Dashboard / Edit lesson / Steps and pictures / Quiz / QR codes / App texts (2 new labels in 3 languages, native check pending).
- [x] Admin panel redesigned: login card with logo, dark counts panel, editor split into Basics / Text / Audio cards, steps / quiz / QR / texts in cards, padded review box.
- [x] Supervisor mode redesigned: PIN card with lock icon, progress table card, add-worker card.
- [x] Versions: worker **v1.0-rc3** (code 12), admin **v1.1-rc3** (code 23). Tests: worker 87/87, admin 219/219, backend 65/65.
- [ ] Note: server messages in Admin Mode (wrong password, missing list) come from the backend in English only.
- [ ] Build rc3 in App Inventor and check on the phone — *you*.

### Motion · 20 Nov 2026 (rc4)
- [x] **Press animation on every button and tile:** finger down → the button sinks onto its edge and darkens (TouchDown/TouchUp, 36 "_p" pressed pictures); also works on buttons whose picture the app changes (language, text size, quiz answers). `check-aia.js` fails if a pressable picture has no pressed version.
- [x] **Home tiles pop in** one after another (120 → 160 dp, ease-out).
- [x] **Quiz:** the right answer pulses; the final score counts up while its bar fills.
- [x] Already in rc2/rc3: screens slide in and out, splash logo pop + loading bar, My Skills bars grow.
- [x] Continue card: two short lines ("Continue · Step 3 of 7" / lesson title) so text stays clear of the bar and arrow.
- [x] Versions: worker **v1.0-rc5** (code 14), admin **v1.1-rc5** (code 25). Tests: worker 93/93, admin 225/225, backend 65/65.
- [ ] Build rc5 in App Inventor and check on the phone — *you*.
