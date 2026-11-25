# Day 9 + Day 10 · App build 1 and 2 (App Inventor)

The real project is **`app-inventor/SITE_SAATHI.aia`** (version 0.10, 9 Screens, 49 media files, 845 KB).
The old test project is now `app-inventor/SITE_SAATHI_tests.aia` (QR, font and CSV tests from Days 1–8).

## 1. Import and run (≈ 15 min)
1. ai2.appinventor.mit.edu → **Projects → Import project (.aia)** → `SITE_SAATHI.aia`. If the name exists, delete or rename the old test project first.
2. Check the Designer: 9 Screens in the screen drop-down (Screen1, Home, Learn, Quiz, Scan, Skills, Ask, Safety, Settings). **Media** has the logo, icon, 2 fonts, 3 CSVs, 21 step pictures and the tiles.
3. **Connect → AI Companion** on the phone. Companion starts on Screen1.
4. If the import shows an error, copy the exact message and send it to me. I'll fix the generator and send a new file.

## 2. Test on the phone ("Done when" lines)

**Day 9:** splash, saved language, Home and Settings in the chosen language from `strings.csv`.
- [ ] Splash (logo, SITE SAATHI, tagline) for about 2 s → **Language** on first open
- [ ] Tap **मराठी**: it turns yellow, the phone says "मराठी निवडा" (if a Marathi voice is installed), Next = **पुढे** → Home
- [ ] Home tiles in Marathi; no broken letters (Noto font)
- [ ] Close and reopen the app (in the Companion: reconnect): splash → Home directly
- [ ] Settings: switch to हिंदी → every label changes at once; **बड़ा** (Large) → text grows; back to Home → Home is Hindi + large
- [ ] Settings → read-aloud voice help message; About (purpose, version, developer, reviewer, disclaimer); Back returns to Settings
- [ ] Reset my progress → Yes/No dialog; Yes keeps the language

**Day 10:** all 3 lessons open from Start Learning in all 3 languages, with pictures, steps, precautions and mistakes; "Coming soon" for empty modules.
- [ ] Start learning → 6 module tiles; Brick, Concrete, Safety show "Lessons: 1"; Reinforcement, Curing, Quality show "Coming soon" and a message when tapped
- [ ] Brick Masonry → list row (title, SS-MAS-01, 5 min, Audio) → lesson intro (picture, description, objective, materials)
- [ ] Next × 7: each step shows its picture, "Step n / 7" and the text; Back works
- [ ] After step 7: red safety box + yellow mistakes box + Start quiz (opens the Quiz placeholder; real quiz Day 11)
- [ ] Back from the lesson → list shows "Viewed" → modules → Home; Home now shows the **Continue** card; tapping it reopens the same step
- [ ] Repeat for Concrete Work and Site Safety, and in all 3 languages (9 lesson-language pairs)
- [ ] Note any text too long for the screen (roadmap Day 10 content task); send it to me to shorten

## 3. How the blocks work (plain language)

Every Screen has the same small "kit" of blocks:

| Block | What it does |
|---|---|
| globals `STR`, `LES`, `LANG`, `TS` | strings table, lessons table, chosen language, text scale (1 or 1.2) |
| `loadSettings` | reads TinyDB `lang` and `text_size`, then `FileStr.ReadFrom "//strings.csv"` (the `//` means "from the app's Media") |
| `when FileStr.GotText` | `STR = list from csv table(text)`, then `applyLabels`; screens that need lessons then read `//lessons.csv` |
| `t(key)` | returns the label for `key` in the chosen language: walks the rows of `STR`, column 2 = mr, 3 = hi, 4 = en |
| `applyLabels` | one pair of blocks per label/button: `set Text to t("btn_start")` and `set FontSize to 18 × TS` |
| `rowFor(id)` | the `lessons.csv` row for that lesson in the chosen language (falls back to English) |

**Screen1:** `Clock1.Timer` (2 s) → if `LANG` is empty show `ArrLanguage`, else open Home. `setLang(code)` stores TinyDB `lang`, colours the chosen button yellow (button image), re-applies labels and speaks `lang_prompt`. `OtherScreenClosed` → close application, so Back on Home exits instead of showing a frozen splash.

**Home:** tiles open Learn / Scan / Skills / Settings. `updateContinue` reads TinyDB `last_lesson` and `last_step` and shows "Continue: title · Step 4 / 7". `OtherScreenClosed` runs `loadSettings` again, so a language change in Settings shows straight away.

**Learn:** three arrangements shown one at a time (`ArrModules`, `ArrLessons`, `ArrLesson`), plus global `VIEW`.
- `showModules`: for each module, `countMod(code)` counts its lessons; 0 → grey tile + "Coming soon".
- `showLessons(code)`: fills `LvLessons` (ListView) and keeps the matching lesson IDs in `IDS`; `AfterPicking` → `openLesson(select IDS at SelectionIndex)`.
- `openLesson(id)`: `rowFor(upcase(trim(id)))`; empty → "This lesson is not in the app yet…"; else keeps the row in `CUR`, splits steps and images at `|`, `STEP = 0`, `showStep`.
- `showStep`: STEP 0 = intro, 1–7 = picture + "Step n / 7" + text, 8 = safety and mistakes boxes (marks `viewed_<id>`). Saves `last_lesson` / `last_step` every time.
- Start value: Home's Continue sends `"SS-CON-01#4"`; Scan (Day 12) will send just the ID. `goBack` returns to where you came from.

**Settings:** `setLang`, `setTs` store TinyDB and re-apply labels; About is an arrangement inside Settings (Admin Mode entry comes on Day 15). Reset deletes every TinyDB tag except `lang` and `text_size`.

## 4. How this file is made (for changes)
- Edit the CSVs (from the Google Sheet) or media → run, in the project folder:
  `node tools/build-app.js && node tools/check-aia.js && node tools/sim-aia.js`
- `check-aia.js` checks every block refers to a real component, procedure, variable and media file.
- `sim-aia.js` runs the real blocks on the laptop against the real CSVs: **50 checks** of the Day 9–10 journeys (first launch, language, Settings, Learn in Hindi with large text, Continue, open by ID, reset). It does not replace the phone test, because it can't see layout, fonts or the real Companion.
- **If you change blocks by hand in App Inventor**, export the .aia to Drive. Re-running `build-app.js` would overwrite your hand changes, so tell me what you changed and I'll put it into the generator.

## 5. End of each build day
- [ ] App Inventor → Projects → **Export selected project (.aia)** → Drive `SITE_SAATHI/Builds/SITE_SAATHI_day09.aia`, then `…_day10.aia`
- [ ] 3 lines in the progress file: done, problems, tomorrow
