# Day 1 · Setup guide (Wed 18 Nov 2026)

**Done when:** site visit confirmed with permission · interview sheet printed · a test "Hello SITE SAATHI" screen runs on the phone through the AI2 Companion.

All tools are free. Never add a card or turn on billing anywhere.

---

## A. MIT App Inventor project (≈ 20 min)

1. On the laptop open **ai2.appinventor.mit.edu** → sign in with your Google account → accept the terms.
2. Load the starter project:
   - **Projects → Import project (.aia) from my computer** → choose `app-inventor/SITE_SAATHI.aia` from this folder.
   - It already has: Hi-Vis colours, **Sizing = Responsive** (fits small and big phones), the logo, app icon, a Marathi tagline (early Devanagari check), a "Hello SITE SAATHI" label and a yellow 56-high **Test connection** button.
   - **If the import shows an error**, make it by hand instead (5 min): *Projects → Start new project → `SITE_SAATHI`*, then on Screen1:
     - Screen1: AlignHorizontal **Center**, AlignVertical **Center**, BackgroundColor **Custom #FBFAF7**, Sizing **Responsive**, AppName `SITE_SAATHI`, VersionName `0.1`.
     - Upload `brand/logo_yellow_512.png` and `brand/app_icon_512.png` (Media → Upload File). Set Screen1 **Icon** = `app_icon_512.png`.
     - Add **Image** (Picture `logo_yellow_512.png`, 140 × 140 px, ScalePictureToFit ✓), **Label** `Hello SITE SAATHI` (FontSize 22, bold, text colour #15A34A), **Button** `BtnTest` (Text "Test connection", BackgroundColor #FFC21A, FontSize 20, Width 90 percent, Height 56 px, Shape rounded), and a **Notifier** (non-visible).
     - Blocks: `when BtnTest.Click → call Notifier1.ShowAlert notice "AI2 Companion connected. Day 1 test passed."`
3. Version is **0.1** on purpose: v1.0 is the Day 14 MVP APK.

> This test screen has its text typed directly in the Designer. That is OK for a connection test only. From Day 9 every label comes from `strings.csv` (LNG-3).

## B. AI2 Companion on the phone (≈ 10 min)

1. On the Android phone: Play Store → install **MIT AI2 Companion**.
2. Phone and laptop on the **same Wi-Fi** (or use USB: *Connect → USB* after installing the aiStarter tool on Windows).
3. Laptop: **Connect → AI Companion** → a QR code and 6-letter code appear.
4. Phone: open the Companion → **scan QR code** (or type the code) → the screen appears on the phone.
5. Check on the phone:
   - [ ] logo, "SITE SAATHI", English and **Marathi tagline show with no broken letters** (note the result — the full font test is Day 4)
   - [ ] tap **Test connection** → the alert appears
   - [ ] rotate the phone / try a second phone: the layout still fits (Responsive)
6. Take one screenshot for the report (Drive → `Builds/`).
7. **Export the project:** Projects → **Export selected project (.aia)** → save to Drive → `SITE_SAATHI/Builds/SITE_SAATHI_day01.aia`.

## C. Google Drive folders (≈ 5 min)

Create in **My Drive**:

```
SITE_SAATHI/
├── Lesson database/     ← the Google Sheet below
├── Field notes/         ← site visit notes, consent log scans, call notes
├── Designs/             ← Figma links, Canva files, logo/brand PNGs
└── Builds/              ← .aia backups every build day, APKs, screenshots
```

Upload the `brand/` PNGs + SVG into `Designs/`.

## D. Google Sheet with tabs lessons, quiz, strings (≈ 10 min)

1. In `SITE_SAATHI/Lesson database/` → New → Google Sheets → name it **`Lesson_Database`**.
2. Rename the first tab **`lessons`**; add tabs **`quiz`** and **`strings`**.
3. For each tab: **File → Import → Upload** the matching CSV from `content/sheet/` → *Import location: **Replace current sheet*** → *Separator: comma*.
   - `lessons.csv` → headers `id, module, lang, title, desc, objective, materials, steps, safety, mistakes, img, audio` (one row per lesson **per language**; steps separated by `|`)
   - `quiz.csv` → headers `lesson_id, lang, q_no, question, a, b, c, d, correct, explanation`
   - `strings.csv` → `key, mr, hi, en` — 53 app labels already filled in 3 languages
4. Keep the sheet **private** (do not share with "anyone with the link").
5. Check: Marathi and Hindi cells show correctly (no boxes).

> `strings.csv` Marathi and Hindi are **drafts**. A native speaker checks them before Day 9 (roadmap Day 8–9).
> Column-name note: PRD §12.3 and §13.3 use `a, b, c, d` for quiz options; §13.2 says `option_a…`. I used `a, b, c, d` (the majority). Confirm on Day 3 when CSV columns are fixed.

## E. Figma and Canva (≈ 10 min)

1. Make free accounts at figma.com and canva.com (Education plan is free with a college email; the basic free plan is also enough).
2. **Figma:** new file `SITE SAATHI – UI`. Add colour styles from `brand/Brand_Kit.md`. Import `brand/site-saathi-logo.svg` (drag in).
3. **Canva:** Brand kit (if available on your plan) or a design called `SITE SAATHI brand` holding the logo PNGs and the 5 hex colours.
4. Fonts to use later: **Noto Sans Devanagari** (mr/hi) + a bold sans for English (both free on Google Fonts).

## F. End of day
- [ ] Faculty guide message sent (`field/Day01_Messages_and_Call_Script.md`)
- [ ] Site called; visit booked with the engineer's permission
- [ ] Interview sheet checked by a native speaker and **printed** (`field/Interview_Sheet.html`)
- [ ] Hello SITE SAATHI runs on the phone
- [ ] .aia exported to Drive
- [ ] Tick the tasks in `Doc/SITE_SAATHI_Roadmap_Progress.md` + 3 lines: done, problems, tomorrow
