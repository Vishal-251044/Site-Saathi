# Day 19–20 guide · Supervisor Mode, Helmet Check, final APK and demo pack

**File:** `app-inventor/SITE_SAATHI_admin.aia` **v1.1-rc1** (version code 21). The worker build `SITE_SAATHI.aia` stays **v1.0-rc1** and is not changed.
Already built and tested on the laptop: Supervisor Mode, smart revision, the Safety screen, the Home tile and the "not supported" logic (simulator: admin build 215/215).
**You still need to do:** train the helmet model, add the extension, add 3 blocks, test on phones, then build the APK.

---

## Part A · Helmet Check (Day 19, PRD HLM-1..5)

### A1. Collect photos (consent first)
1. Ask each person **before** taking the photo: "This is for a college training app. The photo stays on my laptop and is used only to train the model." Only take photos of people who say yes. Write the count (not names) in your notes.
2. Take about **50 photos with a helmet** and **50 without**: different people, helmet colours, light (sun, shade, indoors), distances and backgrounds. Do not use photos from the internet.
3. Keep **20 more photos (10 + 10) aside** that are never used for training. You will test with these in A5.
4. Store them only in a private Drive folder `SITE_SAATHI/HelmetPhotos/`. Never put them in the app, the sheet, Git or Cloudinary. Delete them after the project if you promised that.

### A2. Train the model (free, in the browser)
1. Open the MIT **Personal Image Classifier** website (find it from appinventor.mit.edu → AI resources → Personal Image Classification).
2. Make exactly two labels: **`helmet`** and **`no_helmet`**.
   The app checks the top label: if it contains "no", it shows "No helmet". Any other label means "Helmet on". Use these two names exactly.
3. Upload the training photos into each label → **Train** → test with a few photos → **Export model** → you get `model.mdl`.

### A3. Add the extension and model in App Inventor
1. Import `SITE_SAATHI_admin.aia` (Projects → Import project). Keep a copy of your last hand-edited project first (see the build-pipeline note in the progress file).
2. Download the free **PersonalImageClassifier.aix** extension from the same MIT page. Palette → **Extension → Import extension** → choose the file.
3. Open the **Safety** screen. Drag in **PersonalImageClassifier** (it becomes `PersonalImageClassifier1`).
4. Media → **Upload File** → `model.mdl`. Select `PersonalImageClassifier1` → **Model** = `model.mdl`.
5. The extension needs a **WebViewer** on the same screen to run the model on the phone: drag in a WebViewer, set Height 1 pixel, and set it in PersonalImageClassifier1's **WebViewer** property. If classification never finishes on your phone, make the WebViewer taller (e.g. 200 px) and try again.
   The model runs inside the phone. The photo is not uploaded anywhere.

### A4. The 3 blocks you add (Blocks editor, Safety screen)
| # | Find this | Do this |
|---|---|---|
| 1 | `to classify image` procedure | Delete the two blocks inside it. Put in **`call PersonalImageClassifier1.ClassifyImageData image`** (plug `get image` into the slot). |
| 2 | Drawer `PersonalImageClassifier1` → **`when GotClassification result`** | Put in **`call showHelmet result`** (plug `get result`). It shows "Helmet on – stay safe" (green) or "No helmet – please wear your helmet" (red) and the confidence %. |
| 3 | Drawer `PersonalImageClassifier1` → **`when Error errorCode`** | Put in **`call helmetUnsupported`**. It saves "not supported" on that phone and hides the Safety Check tile from then on (HLM-5). |

Everything else (Camera, disclaimer "Training aid only", "photo stays on this phone", link to the Safety lesson) is already there.
Do not add any Web, ChatBot or upload block to this screen (HLM-2: the photo never leaves the phone).

### A5. Test the accuracy (Done-when for Day 19)
1. Build the APK (Part C) and install on a phone.
2. For each of the 20 photos you kept aside: show it on the laptop screen (or ask a consenting person) → Safety Check → Take photo → write down helmet / no helmet + confidence.
3. Fill the table and keep it in the testing report:

| Photos | Correct | Wrong | Accuracy |
|---|---|---|---|
| 10 with helmet | | | |
| 10 without helmet | | | |
| **20 total** | | | **__ %** |

If accuracy is low: add more varied photos (light, angle, distance), retrain, export, replace `model.mdl`. **Write the real number only.**
4. On an old / low-memory phone: if you get the "This phone does not support Helmet Check" message, check that the tile is gone from Home after reopening the app (HLM-5).
5. Record a **30–60 second screen video** of one helmet and one no-helmet result for the demo backup.

---

## Part B · Supervisor Mode and smart revision (Day 19, PRD SUP-1..4, FR-17) — already built

**How to open:** Settings → **Supervisor mode** → first time: set a 4-digit PIN (saved only on this phone, TinyDB `sup_pin`). 5 wrong PINs → wait 1 minute.

| What | How it works | Privacy |
|---|---|---|
| Add worker | First name + trade (Mason, Helper, Bar bender, Concrete worker, Other). Only the first word of the name is kept. | No phone number, Aadhaar, photo. Nothing is sent online. |
| Who is learning? | When workers exist, a list opens before each lesson: the worker's name or "Myself". | — |
| Scores per worker | The quiz saves the best score for that worker (`w_<n>_score_<lesson>`) and in My Skills as usual. | Stays on the phone. |
| Progress table | Workers × lessons with best scores. | — |
| Share summary | Phone share menu (WhatsApp etc.) with a plain-text summary. The supervisor chooses whom to send it to. | Only first names + trade + scores. Tell workers before sharing. |
| Smart revision | Home and My Skills show "Suggested for you: Repeat <lesson> (2/5)" for the lowest score below 3/5. Rule-based, works offline. | — |

**Phone test (Day 19):** set PIN → add 2 workers → learn a lesson as worker 1 → quiz → open Supervisor mode → check the table → share to yourself on WhatsApp → 5 wrong PINs → wait 1 minute.

---

## Part C · Final APK (Day 20)
1. Check the progress file: which gates in `release/Release_v1.1_Checklist.md` are open. **The version stays `1.1-rc1` until every gate is ticked.**
2. On the laptop: `node tools/build-app.js --admin && node tools/check-aia.js app-inventor/SITE_SAATHI_admin.aia && node tools/sim-aia.js app-inventor/SITE_SAATHI_admin.aia && node tools/test-backend.js`
3. Import into App Inventor → do the hand steps again if the .aia was regenerated: Base64 extension (Day 16 guide), ChatBot Token check (Day 17–18 guide), PIC extension + model + 3 blocks (Part A).
4. **Build → Android App (.apk)** → rename `SITE_SAATHI_v1.1-rc1.apk` (or `_v1.1.apk` after the gates).
5. **Fresh install test** on a phone that never had the app: follow `release/Install_Guide_v1.1.md` word by word; tick the fresh-install list in the checklist.
6. Back up (checklist § Backup).
7. Rehearse the demo twice (`release/Demo_Script.md`), once in airplane mode for steps 1–8.
8. Make the slides (the deck link is in the progress file) — fill the field findings and test results only with real numbers.
9. Fill `release/Retrospective.md` after the presentation.
