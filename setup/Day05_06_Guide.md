# Day 5 + Day 6 · Hands-on guide

## Day 5 (Sun 22 Nov, power day) · UI design part 2 + clickable prototype

### Open the prototype
- Laptop: double-click `design/Prototype.html` (Chrome). Tap inside the phone like a real app.
- Left panel: language, Aa / Aa+ (large text), **Show v1.1** (Ask Saathi, Safety check, Supervisor Mode, "Why?"), **Phone offline**, simulated QR scans, jump to any screen.
- **All screens on one page:** `design/Prototype.html#gallery` (22 screens, switch mr / hi / en).
- PNG of every screen in every language: `design/exports/day05/<screen>_<lang>.png` (for Figma, slides, report).
- It reads the real sheet data. After editing a CSV run `node tools/build-design-data.js`, then refresh.

Full journey to check (roadmap "Done when"): **open → language → Home → Start learning → Brick Masonry → lesson (intro, 7 steps, safety + mistakes) → quiz (5) → result → My Skills → Home → Scan QR → type `SS-MAS-01` / simulate `SS-TEST-99`.**

> CON and SAF show "Coming soon" in the prototype on purpose: their lesson rows are added on Day 7, and the app follows the same rule (MOD-1).

### Figma (Day 5 design tasks)
Redraw these frames (360 × 740) next to the Day 4 ones, using the PNGs as tracing guides:
Lesson intro · Lesson step · Safety + mistakes · Quiz (answered) · Quiz result · Scan (not found) · My Skills · Settings · About · v1.1: Home, Ask Saathi, Ask offline, Helmet Check (helmet / no helmet), Supervisor PIN, Supervisor table.
Then **Prototype mode** in Figma: link the tiles and buttons along the journey above. (If time is short, the HTML prototype already covers the journey for testing.)

### App Inventor assets (already made, in `media/`)
| Files | Size | Use in App Inventor |
|---|---|---|
| `ic_<name>_k.png` / `_w.png` | 144 × 144 | Image or Button.Image, set Width/Height **48 px**. `_k` charcoal on light, `_w` white on dark |
| `icon_mod_mas.png` … `icon_mod_qua.png` | 144 × 144 | Module grid images, 56–64 px |
| `bg_btn_yellow/charcoal/outline/danger/ai.png` | 990 × 168 | Button.Image for full-width buttons: Width **Fill parent**, Height **56 px**; text stays on top |
| `bg_tile_yellow/charcoal/green/grey.png` | 480 × 384 | Home tiles: Width 48 percent, Height 128 px |
| `SS-MAS-01_s1.jpg` … `_s7.jpg` | 1080 × 720 | Lesson step images (Day 6) |

Icon names: book, qr, star, gear, back, chev, speaker, play, pause, restart, clock, tick, cross, warn, mistake, mic, camera, share, lock, plus, info, wifioff, helmet, users.
Rule: `bg_btn_ai`, `ic_mic` on blue, and the Safety check tile are **only** for AI features (CLAUDE.md §6).
Re-make any time: `node tools/build-app-assets.js && bash tools/export-media.sh`.

### Test the prototype with 2–3 classmates (≈ 30 min)
Give them the phone or laptop on Home, in the language they read best. Say only the task, never where to tap.

| Task | P1 | P2 | P3 |
|---|---|---|---|
| 1. Choose your language | | | |
| 2. Open the brick masonry lesson | | | |
| 3. Go through the steps and play the audio | | | |
| 4. Finish the quiz | | | |
| 5. Find your score | | | |
| 6. Open a lesson by typing its code | | | |
| 7. Make the text bigger | | | |

Write ✓ (no help) / ? (hesitated) / ✗ (needed help) + what they said. **Top 3 problems** → fix in Figma and tell me; I'll update the prototype.

| # | Problem seen | Screen | Fix |
|---|---|---|---|
| 1 | | | |
| 2 | | | |
| 3 | | | |

### Sunday extra
- Design review with the faculty guide: show `Prototype.html#gallery`; note comments in the progress file.

---

## Day 6 (Mon 23 Nov) · Content: brick masonry lesson

### Update the Google Sheet
In `Lesson_Database`: tab **lessons** → File → Import → `content/sheet/lessons.csv` → **Replace current sheet**. Do the same for tab **quiz** with `quiz.csv`, and **strings** with `strings.csv` (92 labels now).
Check: 1 lesson row (SS-MAS-01, en) and 5 quiz rows.

### Images
- Step images: `media/SS-MAS-01_s1.jpg` … `_s7.jpg` (1080 × 720, 20–50 KB each, already compressed). Upload them to Drive → `SITE_SAATHI/Media/`.
- If you took site photos on Day 2 (with permission), you can replace any drawing: crop to 3:2, resize to 1080 px wide, save with the **same file name**.
- Look at each picture: does it show the correct method? (`content/AI_Prompts_Log.md` row 5.)

### Edit, then send to the reviewer
1. Read `content/lessons/SS-MAS-01_en.md`. Change anything that does not match how your site does it.
2. Open `content/review/SS-MAS-01_Review_Sheet.html` → Ctrl+P → PDF (or print). Send it to the reviewer with the 7 "values to confirm".
3. Agree the deadline: **Wed 25 Nov** (Day 8).
4. Fill the "Human check" column in `content/AI_Prompts_Log.md` honestly.
