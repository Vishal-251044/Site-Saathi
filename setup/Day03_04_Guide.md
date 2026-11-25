# Day 3 + Day 4 · Hands-on guide

Re-import the updated `app-inventor/SITE_SAATHI.aia` (Projects → Import). It replaces the Day 1 test and adds two tests. If App Inventor says the project already exists, delete the old one first or import as `SITE_SAATHI_t2` — it is only a test project.

---

## Day 3 · QR scanner early risk check (≈ 10 min)

1. Connect the phone with the AI2 Companion (Connect → AI Companion).
2. Tap **Test QR scanner** → allow camera.
3. Scan **any** QR (a UPI QR, a website QR, or one shown on the laptop screen).
4. Write in the progress file:

| Phone | Camera opened? | Read OK? | Seconds to read | Result text shown |
|---|---|---|---|---|
| your phone | | | | |
| basic / second phone | | | | |

If it fails on a phone: the backup is the **Type lesson code** box and the lesson list (QR-4). Note it as a risk; do not change the plan.

## Day 3 · App flow and analysis
- Open `analysis/App_Flow.html` (works on phone and laptop). Paper sketch is fine too.
- Fill §1 and §10 of `analysis/Day03_Requirement_Analysis.md` from your **typed field notes only**.
- Fill and send `analysis/Day03_Summary_for_Faculty_Guide.md`.
- Answer the one open question there (10th screen for Admin Mode) when you can. It is not urgent before Day 15.

---

## Day 4 · Devanagari font test (≈ 5 min)

On the phone (Companion), look at the three font lines:
- **Phone font:** the phone's default font.
- **Noto:** the bundled `font_deva.ttf`.
- **Noto bold:** the Home button words.

Check the hard letters: **क्ष, ज्ञ, श्र, ळ, ॲ, आत्मविश्वासाने, र्‍हास, ज़्यादा, ड्रॉइंग**. No boxes, no letters split apart, matras (ि ी ु ू े ै) in the right place.

| Phone | Phone font OK? | Noto OK? | Noto bold OK? | Notes |
|---|---|---|---|---|
| | | | | |

Decision: if Noto shows correctly on both phones, **every label uses `font_deva.ttf` / `font_deva_bold.ttf`** from Day 9 (PRD §14: font bundled so text displays on all phones).

## Day 4 · Figma (≈ 3–4 h)

Reference: open `design/UI_Design_Part1.html` in Chrome. Use the language and Aa / Aa+ buttons at the top. PNG exports of each screen in each language are in `design/exports/`.

1. New Figma file **`SITE SAATHI – UI`** → page **Style guide** → page **Screens**.
2. **Colour styles** (from `brand/Brand_Kit.md`): Helmet yellow `#FFC21A`, Site charcoal `#1B1F24`, Blueprint blue `#2563EB`, Go green `#15A34A`, Danger red `#DC2626`, Concrete white `#FBFAF7`.
3. **Text styles:** Noto Sans Devanagari + Noto Sans (both free in Figma) — Title 24 bold, Button 19 bold, Body 17, Hint 13.
4. **Components:** Primary button (yellow, 56 high, radius 12), Dark button, Outline button, Home tile (radius 16, min 128 high), Module card, Lesson card, ID chip, Offline badge, Safety box (red border), Mistakes box (yellow).
5. **Frames 360 × 740**: Splash, Language, Home, Modules, Lesson list. Build each in **Marathi**, then duplicate and switch text to Hindi and English (labels are in `content/sheet/strings.csv`).
6. Drag `design/icons/*.svg` and `brand/site-saathi-logo.svg` into Figma.
7. Tip: drop the matching PNG from `design/exports/` beside each frame at 50% opacity as a tracing guide, then delete it.

## Day 4 · "Guess the button" test (2 people)

Show **only the Home screen** (Marathi or Hindi, whichever they read). Point at each tile and ask "What do you think this does?" Do not explain anything.

| Person | Language | Start learning | Scan task QR | My skills | Settings | Continue card | Comment |
|---|---|---|---|---|---|---|---|
| P1 | | ✓ / ✗ / said: | | | | | |
| P2 | | | | | | | |

Any ✗ → change that tile's icon or words on Day 5 ("fix the top 3 issues").
