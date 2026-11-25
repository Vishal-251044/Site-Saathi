# AI Content Studio · prompt log (for the project report)

PRD §10.12.6 (AI-6): AI drafts, people check. Every entry says what the AI produced and what a person must still do.
Tool: Claude (AI assistant in VS Code), free use. No worker data, names or photos were given to the AI.

| # | Date | Lesson / item | Prompt (summary of what was asked) | AI output | Human check status |
|---|---|---|---|---|---|
| 1 | 17 Nov 2026 | 3 MVP lessons — outline | "List the 3 MVP lessons (SS-MAS-01, SS-CON-01, SS-SAF-01) with objective and the main 5–7 steps, safety and common mistakes, in simple words; mark every number that needs checking." | `content/MVP_Lessons_Outline.md` | Developer read; expert review pending |
| 2 | 17 Nov 2026 | App labels | "Write all MVP button labels and messages as key, mr, hi, en for strings.csv, short and simple; use the PRD wording for the not-found message and disclaimer." | `content/sheet/strings.csv` | Native-speaker check pending (Day 8) |
| 3 | 23 Nov 2026 | SS-MAS-01 English lesson | "From the outline and the PRD lesson fields, write SS-MAS-01 in English at about class-5 reading level: description, objective, materials, 7 steps of 1–2 short sentences, 5 safety points, mistakes. Avoid exact numbers unless standard; list every value the reviewer must confirm." | `content/lessons/SS-MAS-01_en.md`, `lessons.csv` row | Developer edit ☐ · expert review ☐ |
| 4 | 23 Nov 2026 | SS-MAS-01 quiz | "Write 8 multiple-choice questions (4 options, one correct, answers spread over A–D) with a 1–2 sentence explanation each; then pick the best 5 and say why." | 8 questions + selection table; 5 rows in `quiz.csv` | Developer check ☐ · expert approval ☐ |
| 5 | 23 Nov 2026 | SS-MAS-01 step pictures | "Draw one simple, word-free picture per step showing the correct method (tick) and, where useful, the wrong one (cross)." | `design/illustrations/*.svg` → `media/SS-MAS-01_s1–s7.jpg` | Developer checked each shows the correct method; expert check ☐; replace with site photos where available |

| 6 | 24 Nov 2026 | SS-CON-01, SS-SAF-01 English lessons | Same prompt as #3, from the Day 1 outlines and PRD fields; safety lesson must send height, electrical and injury cases to the supervisor (AIR-4 wording). | 2 `lessons.csv` rows (en) | Developer edit ☐ · expert review ☐ |
| 7 | 24 Nov 2026 | SS-CON-01, SS-SAF-01 quizzes | Same prompt as #4. | `content/lessons/Quiz_Drafting_CON_SAF.md`; 10 `quiz.csv` rows (en) | Developer check ☐ · expert approval ☐ |
| 8 | 24 Nov 2026 | SS-CON-01, SS-SAF-01 step pictures | Same as #5; safety pictures in pictogram style (worker figure with PPE). | `media/SS-CON-01_s1–s7.jpg`, `SS-SAF-01_s1–s7.jpg` | Developer checked; 3 redrawn after checking; expert check ☐ |
| 9 | 25 Nov 2026 | Marathi + Hindi translations (3 lessons, 15 quiz questions each language) | "Translate each field into simple spoken Marathi and Hindi a site worker uses; keep site words (मसाला, ओळंबा, थापी, सळई / करनी, साहुल, सरिया, गिट्टी); keep all numbers exactly; same meaning, short sentences." | 6 `lessons.csv` rows + 30 `quiz.csv` rows (mr, hi) | Native-speaker check ☐ mr · ☐ hi (`content/review/Translation_Check.html`) |

**Rule:** nothing above is shown to workers until the reviewer signs `content/review/SS-MAS-01_Review_Sheet.html` (CLAUDE.md §4).

### Prompt pattern that worked
1. Give the source (outline / PRD fields / site notes) — never ask the AI to invent site facts.
2. Ask for short sentences and a list of values to verify.
3. Ask for more quiz questions than needed (8 → 5) and a reason for each choice.
4. Keep a human check column, and fill it honestly.
