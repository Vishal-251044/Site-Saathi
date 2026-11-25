# SITE SAATHI · Brand kit ("Hi-Vis")

Source: PRD §14.1 and CLAUDE.md §6. Save these as colour styles in Figma and Canva.

| Name | Hex | App Inventor value | Use |
|---|---|---|---|
| Helmet yellow | `#FFC21A` | `&HFFFFC21A` | Main action buttons, highlights, QR posters, mistakes box |
| Site charcoal | `#1B1F24` | `&HFF1B1F24` | Text, headers, dark tiles |
| Blueprint blue | `#2563EB` | `&HFF2563EB` | **Only** AI: Ask Saathi, Why?, Helmet Check |
| Go green | `#15A34A` | `&HFF15A34A` | Correct, completed, offline available |
| Danger red | `#DC2626` | `&HFFDC2626` | Safety boxes, wrong answers |
| Concrete white | `#FBFAF7` | `&HFFFBFAF7` | Screen background |

**Type:** body 16–18 sp · buttons 18–20 sp · titles 22–26 sp · "Large text" adds ~20%.
**Fonts:** Noto Sans Devanagari (mr, hi) + bold sans for English, uploaded as Media.
**Touch:** buttons ≥ 48 dp; main buttons full width, 56 dp high.
**Icons:** one per module — brick, mixer, rebar, helmet, water drop, check. Icons + few words. **No emoji.**
**Stripes:** hazard stripes only for section headers and safety.

## Logo files
| File | Use |
|---|---|
| `site-saathi-logo.svg` | Master (vector) — Figma, Canva, posters |
| `logo_yellow_512.png` | Yellow bubble, charcoal hat — on dark or light screens |
| `logo_charcoal_512.png` | Charcoal bubble, yellow hat — on yellow backgrounds |
| `app_icon_512.png` / `app_icon_192.png` | Launcher icon (charcoal tile) |

## Fonts
`fonts/font_deva.ttf` and `fonts/font_deva_bold.ttf` = Noto Sans Devanagari Regular / Bold, SIL Open Font License 1.1 (`fonts/OFL.txt`). Free to bundle in the APK.

PNGs are made from the SVG by `node tools/build-assets.js` (re-run after any logo change).
