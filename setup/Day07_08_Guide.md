# Day 7 + Day 8 · Hands-on guide

## Day 7 (Tue 24 Nov) · Concrete work + site safety

1. **Sheet:** re-import `content/sheet/lessons.csv` (9 rows) and `quiz.csv` (45 rows) into `Lesson_Database` (File → Import → Replace current sheet). All 3 lessons now exist in en, mr and hi.
2. **Read and edit** SS-CON-01 and SS-SAF-01 (English rows). Quiz choices and reasons: `content/lessons/Quiz_Drafting_CON_SAF.md`.
3. **Pictures:** `media/SS-CON-01_s1–s7.jpg`, `media/SS-SAF-01_s1–s7.jpg`. Upload to Drive → `SITE_SAATHI/Media/`. Check each shows the correct method; swap in permitted site photos with the same name if you have them.
4. **Send all 3 lessons to the reviewer** today — print or save as PDF (Ctrl+P):
   - `content/review/SS-MAS-01_Review_Sheet.html`
   - `content/review/SS-CON-01_Review_Sheet.html`
   - `content/review/SS-SAF-01_Review_Sheet.html`

   Agree the deadline: **Wed 25 Nov**.
5. **QR codes** (done, verified): `content/qr/SS-MAS-01.png`, `SS-CON-01.png`, `SS-SAF-01.png`, `SS-TEST-99.png` (+ `.svg`). Each contains only the lesson ID (QR-2) and was decoded back to the exact ID. Re-check on the phone with the Day 3 "Test QR scanner" button: open a PNG on the laptop screen and scan it.

## Day 8 (Wed 25 Nov) · Translation, audio, expert review

Work in this order. Each step uses the result of the one before it.

1. **Apply the reviewer's corrections** to the English rows. Then make the **same change in the mr and hi rows** (or send me the comments and I'll update all three).
2. **Native-speaker check:** print `content/review/Translation_Check.html` (194 rows). One Marathi speaker and one Hindi speaker tick each row or write a better site word. Apply the fixes in the sheet (or send them to me).
3. **Re-export CSVs** from the sheet: File → Download → **Comma-separated values (.csv)** for each tab → save as `lessons.csv`, `quiz.csv`, `strings.csv` in `content/sheet/` (Google exports UTF-8 without BOM, which App Inventor needs). Then run:
   `node tools/build-design-data.js && node tools/build-review-sheets.js && node tools/build-recording-scripts.js && node tools/build-qr.js`
4. **Marathi CSV test in App Inventor:** re-import `app-inventor/SITE_SAATHI.aia` → Companion → **Read strings.csv**. All Marathi and Hindi labels must show without broken letters. Note the result.
5. **Record audio:** print `content/audio/Recording_Scripts.html` (9 scripts, 1.9–3.0 min each). Quiet room, native speaker, slow voice. File names: `SS-MAS-01_mr.mp3` etc.
6. **Convert to MP3 mono, trim silence** — see the open question in the progress file (this laptop has no audio tool yet).
7. **QR posters:** print `content/qr/QR_Posters_A5.pdf` (4 A5 pages: 3 lessons + 1 TEST page) in the college lab; laminate if possible (optional, about ₹100–300). Only use the TEST poster for testing; never put it on site.
   *Roadmap says "QR posters in Canva": these posters already follow QR-5 (code + lesson name in 3 languages + phone icon). Use Canva only if you want to restyle them; keep the QR image unchanged.*
