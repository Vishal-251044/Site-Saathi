# Day 17 + Day 18 · Lesson updates, read-aloud, Ask Saathi, Explain My Mistake

All of this is in the **admin build** `app-inventor/SITE_SAATHI_admin.aia` (v1.1-dev1). The v1.0 release candidate is unchanged (same logic, 84/84).
Re-import the admin file. **Re-add your 2 Base64 extension blocks afterwards** (Day 16, Part E).

---

## Day 17 (Fri 4 Dec) · Lesson updates on phones + read-aloud

### What the app now does
| Where | What |
|---|---|
| **Home** | Once a day, when online, checks quietly. If newer lessons exist: yellow **"New lessons available – download in Settings"** (never downloads by itself, UPD-1). |
| **Settings → Check for new lessons** | Asks the server (`getPublished`), compares with `content_version`, says **"New lessons: 1 lessons · 7 files. Download now? (use Wi-Fi)"** (UPD-2). |
| Download | Each picture/audio is saved into the app's own storage (`DefaultFileScope = App`, SaveResponse) with its own name; files already on the phone are skipped (UPD-3). |
| Switch | Only after **every** file arrived, the new lesson texts, quiz, labels and `content_version` are saved. A failed file → "Download not complete. Your old lessons are unchanged." (UPD-4). |
| Offline | Learn, Quiz, Scan and My Skills read the downloaded lessons first, built-in ones otherwise; the new QR opens offline (UPD-5). Built-in lessons are never deleted. |
| Unknown QR | Online and the code exists on the server → "This lesson may be new. Tap Check for new lessons." Offline → the usual message (UPD-6). |
| **Settings** | Voice speed slow / normal; **Downloaded files: 7 · Version 1**; **Clear downloaded lessons** (asks first; built-in lessons and scores stay). Reset my progress now clears only progress. |
| Read-aloud | Speaker buttons on the lesson intro, every step, the safety box, the mistakes box and every quiz question; Marathi/Hindi/English, country IND; slow = 0.8; stops when you leave (RAL-1, RAL-2). No voice for that language → help to install it (RAL-3). |

### Setup
- The phones need the **server address**: put the web app `…/exec` link in `backend/api_url.txt` and tell me — I rebuild so every phone has it. (Until then a phone that logged in to Admin Mode uses that address.)
- In the Apps Script: no change needed for updates (`getPublished` exists since Day 16). **After pasting the new `Ask.gs` (Day 18) and the changed `Router.gs`, `Config.gs`, `Media.gs`: Deploy → Manage deployments → Edit → New version.**

### Test ("Done when": a worker phone taps Check for new lessons, downloads SS-REI-01 with its photos and audio, opens it in airplane mode and by QR; speaker buttons read lesson text aloud)
- [ ] Admin Mode: publish SS-REI-01 (Day 16). On a **second phone**: Home shows "New lessons available".
- [ ] Settings → Check for new lessons → Yes → "New lessons ready".
- [ ] **Test a failed download:** turn on airplane mode in the middle of the download → message, old lessons unchanged; turn it off → Check again → completes.
- [ ] Airplane mode: Start learning → Reinforcement → SS-REI-01 opens with its photos; Listen plays the Marathi audio; quiz works; QR poster for SS-REI-01 (print it from the Admin QR codes screen) opens it.
- [ ] Speaker buttons in all 3 languages, in airplane mode. **Check whether Marathi and Hindi voices work offline** on each phone (Settings → Text-to-speech → install voice data). Write the result in the testing report.

## Day 18 (Sat 5 Dec) · Ask Saathi voice assistant + Explain My Mistake

### What the app now does
| Feature | How |
|---|---|
| **Ask Saathi** (Home → blue bar) | Big **Ask by voice** button (SpeechRecognizer, mr-IN / hi-IN / en-IN), text box + Send, 4 suggested questions, New chat. |
| Persona (ASK-2, ASK-8) | The `ai_persona` row of the strings sheet: construction-only, reply in the chosen language, ≤ 5 steps / ~120 words, safety first, "stop and ask your supervisor or engineer" for structure, electrical, height, injury; never asks for personal details; ends with `LESSON: <id>` when a lesson fits. |
| Answer (ASK-3, ASK-5) | Chat bubble + **"AI answer – check with your supervisor"**, spoken aloud, **Open lesson SS-…** button when the AI named a lesson that exists on the phone. |
| No internet / limit (ASK-4, ASK-7) | MIT ChatBot fails → backend `ask` → **Gemini free tier** → else "Saathi needs internet. Open the lessons instead." with a button to the lessons. |
| Log (ASK-6) | Question + answer saved on the phone (`ai_log`), language only, no names. |
| **Why?** (EXP-1, EXP-2) | Only on a wrong quiz answer: blue **Why?** → AI explains in 2–3 sentences with a site example (labelled AI). Offline → "AI needs internet. Read the saved explanation above." The saved, expert-reviewed explanation is always shown. |

### Setup (all free)
1. **MIT ChatBot:** in the Designer, open the Ask and Quiz screens → select **ChatBot1** → check the **Token** property is filled. If it is empty: drag a new ChatBot from the palette, copy its Token into ChatBot1, delete the new one. (The generated file cannot contain MIT's token.)
2. **Gemini free-tier backup:** aistudio.google.com → Get API key (free tier; **never enable billing**). Apps Script → Script properties → `GEMINI_API_KEY`. Optional `GEMINI_MODEL` if Google renames its free model (default in `Ask.gs`). Paste `Ask.gs` and the changed `Router.gs` / `Config.gs`, then deploy a new version.
3. Limits that protect the free quota: 10 questions per minute and 300 per day for the whole app (Script properties `AI_PER_MINUTE`, `AI_PER_DAY`).

### Content + test (with the expert)
- [ ] Print `content/ai/Ask_Saathi_Test_Questions.html` (20 questions incl. 8 unsafe "STOP" topics, off-topic, privacy, one voice question).
- [ ] Ask each one on the phone; the expert rates: acceptable / **unsafe** / right language. Target: most acceptable, **0 unsafe**.
- [ ] Improve the persona: edit the `ai_persona` row (all 3 columns) in the sheet or in Admin → App texts → Publish → phones get it with "Check for new lessons" (no new APK).
- [ ] Test voice input in a noisy place (mixer running).
- [ ] Quiz: answer wrongly → Why? online; then in airplane mode → saved explanation + message.

## Laptop checks (before your phone test)
| Check | Result |
|---|---|
| `node tools/test-backend.js` (real .gs files, stand-in Google, Cloudinary and Gemini) | 65 / 65 |
| `node tools/sim-aia.js app-inventor/SITE_SAATHI_admin.aia` (app blocks + that backend: updates, failed download, airplane mode, read-aloud, Ask Saathi, Why?) | 188 / 188 |
| `node tools/sim-aia.js` (v1.0 release candidate) | 84 / 84 |
Not tested on the laptop: real MIT ChatBot / Gemini / Google servers, real speech recognition and voices, real downloads, the App Inventor import.
