# Day 3 · Requirement analysis & app flow (Fri 20 Nov 2026)

**Done when:** MVP feature list, screen list, app flow and lesson ID scheme are final; problem statement updated with real findings and shared with the faculty guide.

> Status: everything that comes from the PRD is final below. **§1 (assumptions) and the problem statement wait for the typed Day 2 field notes.** They must not be filled from guesses.

---

## 1. Problem assumptions → confirmed / changed / not seen

Fill from `field/Day02_Field_Notes_Template.md` §8. Evidence = worker / supervisor codes and what they said.

| # | Assumption (PRD §02) | Status | Evidence | Effect on the app |
|---|---|---|---|---|
| P1 | Limited access to structured construction training | *pending notes* | | |
| P2 | Language barrier between supervisors and workers | *pending notes* | | Default language, Hindi priority |
| P3 | Lengthy technical instructions are hard to follow | *pending notes* | | Step length, audio first |
| P4 | Few practical visual demonstrations | *pending notes* | | Step photos |
| P5 | Safety instructions not easy to access | *pending notes* | | Safety lesson, poster places |
| P6 | Hard to keep individual learning records | *pending notes* | | My Skills, Supervisor Mode (v1.1) |

Also record from the notes: most common phone (brand / Android / free space) → the main test phone · site internet → confirms offline-first · preferred learning (audio / pictures) → audio button size and position.

## 2. MVP vs later (from PRD §09, fixed)

| v1.0 MVP · Day 14 (P0, offline) | v1.1 · Day 20 (P1) | Later (P2) |
|---|---|---|
| FR-01 Splash | FR-12 Read-aloud | FR-16 Photo Doubt |
| FR-02 Language (mr / hi / en) | FR-13 Ask Saathi | FR-19 REI, CUR, QUA lessons |
| FR-03 Home (4 tiles + Continue) | FR-14 Explain My Mistake ("Why?") | FR-20 Accounts, cloud sync, web dashboard, skill passport, videos |
| FR-04 6 modules (3 with lessons, 3 "Coming soon") | FR-15 Helmet Check | |
| FR-05 Lesson details | FR-17 Smart revision | |
| FR-06 Recorded audio | FR-18 Supervisor Mode | |
| FR-07 Offline (all in Media) | FR-21 Admin Mode | |
| FR-08 QR + type-code backup | FR-22 In-app lesson updates | |
| FR-09 Quiz (5 × 4 options) | | |
| FR-10 My Skills | | |
| FR-11 Settings + About | | |
| FR-23 One APK; storage in Settings | | |

Rule: nothing in the right two columns is started before the v1.0 APK is safe (Day 14).

## 3. The 9 Screens (fixed)

One App Inventor Screen each; inner pages are **show / hide arrangements** (PRD §12.1).

| # | Screen | Arrangements inside | Release | Main components |
|---|---|---|---|---|
| 1 | `Screen1` | `ArrSplash`, `ArrLanguage` | v1.0 | Clock (2 s), TinyDB, File |
| 2 | `Home` | `ArrHeader`, `ArrTiles`, `ArrContinue` (+ `ArrAsk` bar, Safety tile in v1.1) | v1.0 | TinyDB, File |
| 3 | `Learn` | `ArrModules`, `ArrLessonList`, `ArrLesson` (step view, safety box, mistakes box, audio bar) | v1.0 | File, TinyDB, Player |
| 4 | `Quiz` | `ArrQuestion`, `ArrResult` | v1.0 | File, TinyDB (+ ChatBot "Why?" v1.1) |
| 5 | `Scan` | `ArrScan`, `ArrTypeCode` | v1.0 | BarcodeScanner (external **off**), TinyDB |
| 6 | `Skills` | `ArrSkills` (+ `ArrSupervisor` v1.1) | v1.0 | TinyDB, Sharing (v1.1) |
| 7 | `Ask` | `ArrChat` | v1.1 | ChatBot, SpeechRecognizer, TextToSpeech, Web |
| 8 | `Safety` | `ArrHelmet` | v1.1 | Camera, PersonalImageClassifier |
| 9 | `Settings` | `ArrSettings`, `ArrAbout` | v1.0 | TinyDB, Notifier |

**Navigation (HOM-4: ≤ 2 taps from Home, Back → Home):**
- Home → Learn (modules) → lesson list → lesson → Quiz → result → Back to lessons / Home
- Home → Scan → (found) Learn opened on that lesson · (not found) message + type-code box
- Home → Skills · Home → Settings → About
- Passing data between Screens: `open another screen with start value` = lesson ID (e.g. Scan → Learn, Learn → Quiz). Every Screen's Back button = `close screen` (returns to Home).

> **Question for you (needed by Day 15, not now):** Admin Mode (PRD §10.13) needs its own screen (dashboard, editors, review), which would make **10** Screens, but CLAUDE.md says **9 max**. Options: (a) put Scan inside `Learn` as an arrangement (it only calls `openLesson`, which lives in Learn anyway) and use the freed slot for `Admin`; (b) put Admin arrangements inside `Settings`; (c) allow 10 Screens. My recommendation: **(a)**. I won't change the 9-screen list until you decide.

## 4. Lesson ID scheme (fixed)

- Format **`SS-<MOD>-<NN>`**: `SS` = SITE SAATHI · `MOD` = 3-letter module code · `NN` = 2-digit lesson number from `01`.
- Module codes: `MAS` Brick Masonry · `CON` Concrete Work · `SAF` Construction Safety · `REI` Reinforcement · `CUR` Curing · `QUA` Quality Control.
- MVP: **`SS-MAS-01`, `SS-CON-01`, `SS-SAF-01`**. Test only: **`SS-TEST-99`** (never assigned; must show the "not in the app yet" message).
- An ID **never changes or gets reused** after publishing (printed QR codes use it). A hidden lesson keeps its ID.
- QR content = the ID only, upper case, nothing else.
- Scan rule (QR-2): `upcase(trim(text))` → starts with `SS-`? → look up in the loaded lessons → open / "not in the app yet" (QR-3). Does not start with `SS-` → "Not a SITE SAATHI code".

## 5. CSV columns (fixed for the build)

All files **UTF-8**, comma-separated, any value containing a comma in quotes. Lists inside one cell use **`|`**.

**`lessons.csv`** — one row per lesson **per language** (3 rows per lesson)

| Column | Example | Rule |
|---|---|---|
| `id` | `SS-MAS-01` | Lesson ID |
| `module` | `MAS` | Module **code** (the name comes from `strings.csv` key `mod_mas`) |
| `lang` | `mr` | `mr` / `hi` / `en` |
| `title` | Basic Brick Masonry | Short |
| `desc` | | 1–2 sentences |
| `objective` | | One outcome |
| `materials` | `bricks|mortar|trowel` | `|` list |
| `steps` | `step 1|step 2|…` | 5–7 items, 1–2 short sentences each |
| `safety` | `wear helmet|…` | `|` list, red box |
| `mistakes` | `dry bricks|…` | `|` list, yellow box |
| `img` | `SS-MAS-01_s1.jpg|SS-MAS-01_s2.jpg|…` | one per step, same order as `steps` |
| `audio` | `SS-MAS-01_mr.mp3` | one per language |
| `duration_min` | `5` | **added** (see note) |

> **Note — one column added:** MOD-2 needs the lesson list to show the duration ("5 min"), but the PRD §12.3 header has no duration column. I added `duration_min` at the **end** (same name as the Admin `lessons` table, §13.3), so the PRD's column order is unchanged. `content/sheet/lessons.csv` is updated. Tell me if you'd rather keep the PRD header exactly.

**`quiz.csv`** — `lesson_id, lang, q_no, question, a, b, c, d, correct, explanation` (`correct` = `A`–`D`; 5 rows per lesson per language = 45 rows). Uses `a…d` as in PRD §12.3 / §13.3.

**`strings.csv`** — `key, mr, hi, en`. Keys are lower-case with a prefix: `btn_` buttons · `lbl_` labels · `mod_` modules · `quiz_` · `qr_` · `set_` · `skills_` · `title_`. Placeholders `{n}` / `{total}` are replaced in blocks.

**Module icons** (no extra CSV): `icon_mod_mas.png` … `icon_mod_qua.png`. A module shows "Coming soon" when `lessons.csv` has no row with its code (MOD-1).

## 6. TinyDB keys (fixed)

One TinyDB namespace on every Screen: **`SITE_SAATHI`**.

| Key | Value | Set by | Release |
|---|---|---|---|
| `lang` | `mr` / `hi` / `en` | Screen1, Settings | v1.0 |
| `text_size` | `normal` / `large` | Settings | v1.0 |
| `last_lesson` | lesson ID | Learn | v1.0 |
| `last_step` | number | Learn | v1.0 |
| `viewed_<id>` | `true` when last step reached (LES-4) | Learn | v1.0 |
| `score_<id>` | best score 0–5 ("completed" = key exists) | Quiz | v1.0 |
| `date_<id>` | last attempt date | Quiz | v1.0 |
| `content_version` | number (bundled = 0) | Updates | v1.1 |
| `voice_speed` | `slow` / `normal` | Settings | v1.1 |
| `sup_pin` | 4 digits | Skills | v1.1 |
| `sup_fails`, `sup_lock_until` | count, time (5 wrong → 1 min) | Skills | v1.1 |
| `workers` | list of [first name, trade] | Skills | v1.1 |
| `w_<n>_score_<id>` | per-worker best score | Quiz | v1.1 |
| `adm_token`, `adm_role`, `adm_expires` | session (12 h) | Admin | v1.1 |
| `adm_fails`, `adm_lock_until` | 5 wrong → 10 min (ADM-1) | Admin | v1.1 |
| `ai_log` | Q&A list, no names (testing only) | Ask | v1.1 |

## 7. Lesson outlines

Objective + 5–7 steps for all three lessons: `content/MVP_Lessons_Outline.md` (draft, needs expert review). **Revise after the field notes**: add site words actually heard, the mistakes supervisors named, and the local method where it differs.

## 8. Early risk check — QR scanner

Built into the test project (`app-inventor/SITE_SAATHI.aia`): **Test QR scanner** button → BarcodeScanner with `UseExternalScanner = false` → shows `upcase(trim(result))`.
On the phone, scan **any** QR (a UPI or website QR is fine) and note: opens camera? reads it? time to read? Result goes in the progress file. If it fails → the type-code box and lesson list are the backup (QR-4).

## 9. App flow

See `analysis/App_Flow.html` (open in a browser). Paper copy is fine too; add a photo to Drive.

## 10. Problem statement (update after field notes)

Template — replace the brackets with **real** findings only:

> Construction workers at [site type] learn activities such as brick masonry and concreting mainly by [finding, e.g. "watching senior masons" — W1, W3]. Of the [n] workers we spoke to, [n] preferred [language] and [n] said they read slowly / not at all. [n] used a smartphone ([common brand / Android]). Supervisors said the most common mistakes are [S1, S2 findings] and the main safety issues are [findings]. Mobile internet on site was [good / weak / none at …]. SITE SAATHI addresses this with short offline lessons with pictures and audio in Marathi, Hindi and English, opened by QR posters at the work area, with quick quizzes to check understanding.
>
> *Based on a site visit on 19 Nov 2026 with [n] workers and [n] supervisors. Small sample; not a survey.*

Then send `analysis/Day03_Summary_for_Faculty_Guide.md` to the faculty guide.
