// build-guides.js — two "how to use" guides (simple English + Marathi) with the real app screens:
//   Doc/SITE_SAATHI_Guide_Site_Users_EN_MR.pdf    workers and site supervisors
//   Doc/SITE_SAATHI_Guide_Admin_Users_EN_MR.pdf   content team: Admin, Reviewer, Writer (Admin Mode)
//
//   node tools/build-guides.js            (draws fresh screens with tools/preview-aia.js first, ~3 min)
//   node tools/build-guides.js --no-draw  (use the screens already in design/app-preview/)
//
// Marathi text = draft for a native-speaker check (like all project translations).
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const PREV = path.join(ROOT, 'design', 'app-preview');
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
if (!CHROME) { console.error('Chrome or Edge not found - install Google Chrome (free)'); process.exit(1); }
const url = (p) => 'file:///' + p.replace(/\\/g, '/').replace(/ /g, '%20');
const run = (args) => execFileSync(process.execPath, args, { cwd: ROOT, stdio: ['ignore', 'pipe', 'inherit'] }).toString().trim().split('\n').pop();

if (!process.argv.includes('--no-draw')) {
  console.log('Drawing worker screens ...', run(['tools/preview-aia.js', '--lang=en,mr', '--clean']));
  console.log('Drawing admin-build screens ...', run(['tools/preview-aia.js', 'app-inventor/SITE_SAATHI_admin.aia', '--lang=en,mr', '--clean']));
}
const SRC = fs.readFileSync(path.join(ROOT, 'tools', 'build-app.js'), 'utf8');
const VER = (/MVP_VERSION = \['([^']+)'/.exec(SRC) || [])[1], AVER = (/ADMIN_VERSION = \['([^']+)'/.exec(SRC) || [])[1];

// ---------- page building blocks ----------
// shot: { b: 'worker' | 'admin', id, pos: '0%' (which part of a long page) }; shown in Marathi and English
const pic = (s, lang) => {
  const f = path.join(PREV, s.b || 'worker', `${s.id}_${lang}.png`);
  if (!fs.existsSync(f)) throw new Error('missing screen ' + f + ' (run without --no-draw)');
  return `<figure><img src="${url(f)}" style="object-position:50% ${s.pos || '0%'}"><figcaption>${lang === 'mr' ? 'मराठी' : 'English'}</figcaption></figure>`;
};
const icon = (name) => `<img class="ic" src="${url(path.join(ROOT, 'media', name + '.png'))}">`;
// step: n, titles, shot(s), English lines, Marathi lines
const step = (n, en, mr, shots, enLines, mrLines) => `<section class="step">
  <div class="pics">${(Array.isArray(shots) ? shots : [shots]).map((s) => (s.lang ? pic(s, s.lang) : pic(s, 'mr') + pic(s, 'en'))).join('')}</div>
  <div class="txt"><h3><span class="n">${n}</span>${en}<br><span class="mrh">${mr}</span></h3>
    <ul class="en">${enLines.map((l) => `<li>${l}</li>`).join('')}</ul>
    <ul class="mr">${mrLines.map((l) => `<li>${l}</li>`).join('')}</ul></div></section>`;
const box = (cls, html) => `<div class="box ${cls}">${html}</div>`;
const table = (rows) => `<table>${rows.map((r, i) => `<tr>${r.map((c) => (i ? `<td>${c}</td>` : `<th>${c}</th>`)).join('')}</tr>`).join('')}</table>`;
const cover = (title, mrTitle, who, mrWho, ver, points) => `<section class="cover">
  <img class="logo" src="${url(path.join(ROOT, 'brand', 'logo_yellow_512.png'))}">
  <h1>${title}</h1><h2 class="mrh">${mrTitle}</h2><div class="stripe"></div>
  <p class="who"><b>${who}</b><br>${mrWho}</p><p class="ver">${ver}</p>${points}</section>`;

const CSS = `<style>
@font-face{font-family:SS;src:url('${url(path.join(ROOT, 'brand', 'fonts', 'font_ss.ttf'))}')}
@font-face{font-family:SS;font-weight:700;src:url('${url(path.join(ROOT, 'brand', 'fonts', 'font_ss_bold.ttf'))}')}
@page{size:A4;margin:11mm 11mm 12mm}
*{box-sizing:border-box}body{font-family:SS,'Nirmala UI',sans-serif;color:#1B1F24;font-size:10.5pt;line-height:1.42;margin:0}
b{font-weight:700}
.cover{text-align:left;padding:18mm 6mm 0;break-after:page}.cover .logo{width:30mm;height:30mm}
.cover h1{font-size:25pt;margin:6mm 0 1mm;line-height:1.15}.cover h2{font-size:18pt;margin:0 0 4mm;color:#3a3f46}
.stripe{height:4mm;background:repeating-linear-gradient(-45deg,#FFC21A 0 4mm,#1B1F24 4mm 8mm);border-radius:2px;margin:3mm 0 6mm;width:120mm}
.who{font-size:12.5pt;margin:0 0 2mm}.ver{color:#8A6400;font-weight:700;margin:0 0 6mm}
h2.part{font-size:15pt;margin:2mm 0 4mm;padding:2.5mm 4mm;background:#1B1F24;color:#fff;border-left:5px solid #FFC21A;border-radius:3px;break-after:avoid}
.step{display:flex;gap:5mm;align-items:flex-start;padding:3.5mm 0;border-bottom:1px solid #E4DFD5;break-inside:avoid}
.pics{display:flex;gap:2.5mm;flex:none}
figure{margin:0;text-align:center}figure img{width:36mm;height:76mm;object-fit:cover;border-radius:3mm;box-shadow:0 0.5mm 2mm rgba(0,0,0,.22);display:block}
figcaption{font-size:8pt;color:#6B7078;margin-top:1mm}
.txt{flex:1;min-width:0}
h3{font-size:12.5pt;margin:0 0 2mm;line-height:1.3}.n{display:inline-block;width:7.5mm;height:7.5mm;line-height:7.5mm;text-align:center;border-radius:50%;background:#FFC21A;margin-right:2mm;font-size:11pt}
.mrh{color:#3a3f46}h3 .mrh{display:inline-block;margin-left:9.5mm;font-size:11.5pt}
ul{margin:0 0 2mm;padding-left:5mm}li{margin:0 0 1.2mm}ul.mr{color:#3a3f46;border-top:1px dashed #E4DFD5;padding-top:1.5mm}
.box{border-radius:3mm;padding:3mm 4mm;margin:3mm 0;break-inside:avoid}.box p{margin:0 0 1.5mm}
.green{background:#E3F4E8;border-left:4px solid #15A34A}.yellow{background:#FFF4D1;border-left:4px solid #FFC21A}.red{background:#FDECEC;border-left:4px solid #DC2626}
table{border-collapse:collapse;width:100%;margin:2mm 0 4mm;font-size:9.8pt;break-inside:avoid}
th{background:#FFF4D1;text-align:left;border:1px solid #E4DFD5;padding:1.8mm 2.5mm}td{border:1px solid #E4DFD5;padding:1.8mm 2.5mm;vertical-align:middle}
.ic{width:8mm;height:8mm;vertical-align:middle}
.k{display:inline-block;background:#F1EEE8;border-radius:2mm;padding:0 1.6mm;font-weight:700}
.y{background:#FFC21A}.dark{background:#1B1F24;color:#fff}.g{background:#15A34A;color:#fff}.rd{color:#DC2626;background:#fff;border:1px solid #F1B5B5}
.foot{font-size:8.5pt;color:#6B7078;margin-top:4mm}
</style>`;
const K = (t, cls = '') => `<span class="k ${cls}">${t}</span>`;   // a button name as it looks in the app

// =====================================================================================
// Guide 1 · site users (workers + supervisors)
// =====================================================================================
const site = [
  cover('SITE SAATHI — How to use the app', 'SITE SAATHI — ॲप कसे वापरायचे',
    'For site workers and supervisors', 'साइटवरील कामगार आणि सुपरवायझरसाठी', `App version ${VER} (v1.1 extras marked)`,
    box('green', `<p><b>Works without internet.</b> Lessons, pictures, audio, quiz, QR scan and My skills work in airplane mode too.</p>
      <p><b>इंटरनेटशिवाय चालते.</b> धडे, चित्रे, आवाज, क्विझ, QR स्कॅन आणि माझी कौशल्ये — सर्व इंटरनेटशिवाय चालते.</p>`) +
    box('yellow', `<p><b>Install:</b> open the file <b>SITE_SAATHI.apk</b> from WhatsApp / Google Drive → allow "install from this source" → <b>Install</b>.</p>
      <p><b>इन्स्टॉल:</b> WhatsApp / Google Drive मधील <b>SITE_SAATHI.apk</b> फाइल उघडा → "या स्रोतातून इन्स्टॉल" परवानगी द्या → <b>Install</b>.</p>`) +
    box('red', `<p>This app helps you learn. It does <b>not</b> replace your supervisor or safety training. When in doubt — <b>ask your supervisor</b>.</p>
      <p>हे ॲप शिकायला मदत करते; सुपरवायझर किंवा सुरक्षा प्रशिक्षणाची जागा घेत नाही. शंका असल्यास — <b>सुपरवायझरला विचारा</b>.</p>`)),
  `<h2 class="part">Part A · Worker / भाग अ · कामगार</h2>`,
  step(1, 'Open the app and choose your language', 'ॲप उघडा आणि भाषा निवडा', { id: '02_language', lang: 'en' },
    [`Tap the <b>SITE SAATHI</b> icon.`, `The first time, tap <b>मराठी</b>, <b>हिंदी</b> or <b>English</b>. The phone says the choice aloud.`, `Tap ${K('Next', 'y')}. You can change the language later in Settings.`],
    [`<b>SITE SAATHI</b> चिन्हावर टॅप करा.`, `पहिल्यांदा <b>मराठी</b>, <b>हिंदी</b> किंवा <b>English</b> निवडा. फोन निवड मोठ्याने सांगतो.`, `${K('पुढे', 'y')} दाबा. भाषा नंतर सेटिंग्जमध्ये बदलता येते.`]),
  step(2, 'The Home screen', 'होम स्क्रीन', { id: '03_home' },
    [`The <b>gauge</b> shows how many lessons you have finished.`, `${K('Continue')} takes you back to the step where you stopped.`,
      `${K('Start learning', 'y')} — all lessons · ${K('Scan task QR', 'dark')} — scan a poster · ${K('My skills')} — your progress · ${K('Settings')}.`],
    [`<b>गेज</b> दाखवतो की तुम्ही किती धडे पूर्ण केले.`, `${K('पुढे चालू ठेवा')} — जिथे थांबलात तिथून पुन्हा सुरू.`,
      `${K('शिकणे सुरू करा', 'y')} — सर्व धडे · ${K('QR स्कॅन करा', 'dark')} — पोस्टर स्कॅन · ${K('माझी कौशल्ये')} — प्रगती · ${K('सेटिंग्ज')}.`]),
  step(3, 'Choose a module', 'विषय निवडा', { id: '04_modules' },
    [`Tap ${K('Start learning', 'y')}.`, `Tap a module, for example <b>Brick Masonry</b>.`, `Grey cards with a clock say <b>Coming soon</b> — those lessons are not ready yet.`],
    [`${K('शिकणे सुरू करा', 'y')} दाबा.`, `एक विषय निवडा, उदा. <b>वीट बांधकाम</b>.`, `घड्याळ असलेले राखाडी कार्ड = <b>लवकरच येत आहे</b> — ते धडे अजून तयार नाहीत.`]),
  step(4, 'Choose a lesson', 'धडा निवडा', { id: '05_lessons' },
    [`Each card shows the picture, title, lesson code, time (5 min) and audio.`, `A <b>green tick</b> means you finished the quiz of that lesson.`, `Tap the card to open the lesson.`],
    [`प्रत्येक कार्डवर चित्र, नाव, धड्याचा कोड, वेळ (5 मिनिटे) आणि ऑडिओ दिसतो.`, `<b>हिरवी खूण</b> = त्या धड्याचे क्विझ पूर्ण.`, `धडा उघडण्यासाठी कार्डवर टॅप करा.`]),
  step(5, 'Start the lesson', 'धडा सुरू करा', { id: '06_lesson_intro' },
    [`The first page tells you what you will learn: the <b>objective</b> and the <b>materials and tools</b>.`, `Tap the yellow <b>▶ Listen</b> button to hear the lesson. Tap again to pause; ↻ starts again.`, `Tap ${K('Next', 'y')}.`],
    [`पहिल्या पानावर काय शिकणार ते दिसते: <b>उद्दिष्ट</b> आणि <b>साहित्य आणि साधने</b>.`, `धडा ऐकण्यासाठी पिवळे <b>▶ ऐका</b> बटण दाबा. पुन्हा दाबल्यास थांबते; ↻ पुन्हा सुरुवातीपासून.`, `${K('पुढे', 'y')} दाबा.`]),
  step(6, 'Learn step by step', 'एकेक पायरी शिका', { id: '07_lesson_step' },
    [`Each step has <b>one picture</b> and 1–2 short sentences. "Step 1 of 7" shows where you are.`, `${K('Next', 'y')} goes forward, ${K('Back')} goes back.`, `If you see "audio not recorded yet", read the text — the audio will come in an update.`],
    [`प्रत्येक पायरीत <b>एक चित्र</b> आणि 1–2 छोटी वाक्ये. "पायरी 1 / 7" — तुम्ही कुठे आहात ते दिसते.`, `${K('पुढे', 'y')} — पुढची पायरी, ${K('मागे')} — मागची पायरी.`, `"आवाज अजून रेकॉर्ड झालेला नाही" दिसल्यास मजकूर वाचा — आवाज नंतर अपडेटमध्ये येईल.`]),
  step(7, 'Read safety and common mistakes', 'सुरक्षा आणि नेहमीच्या चुका वाचा', { id: '08_lesson_safety' },
    [`After the last step you see two boxes:`, `<b>Red box</b> = safety precautions. <b>Yellow box</b> = common mistakes to avoid.`, `Read them carefully, then tap ${K('Start quiz', 'y')}.`],
    [`शेवटच्या पायरीनंतर दोन बॉक्स दिसतात:`, `<b>लाल बॉक्स</b> = सुरक्षा खबरदारी. <b>पिवळा बॉक्स</b> = टाळायच्या नेहमीच्या चुका.`, `नीट वाचा, मग ${K('क्विझ सुरू करा', 'y')} दाबा.`]),
  step(8, 'Answer the quiz', 'क्विझची उत्तरे द्या', { id: '10_quiz_answered' },
    [`There are <b>5 questions</b>. Tap the answer you think is right.`, `<b>Green</b> = right answer. <b>Red</b> = your answer was wrong. The reason ("Why this answer") is shown below.`, `Tap ${K('Next', 'y')} for the next question.`],
    [`<b>5 प्रश्न</b> आहेत. बरोबर वाटणाऱ्या उत्तरावर टॅप करा.`, `<b>हिरवा</b> = बरोबर उत्तर. <b>लाल</b> = तुमचे उत्तर चुकले. खाली "उत्तराचे कारण" दिसते.`, `पुढच्या प्रश्नासाठी ${K('पुढे', 'y')} दाबा.`]),
  step(9, 'See your score', 'तुमचे गुण पाहा', { id: '11_quiz_result' },
    [`The ring shows your score out of 5. With <b>4 or 5</b> you get a <b>badge</b>.`, `The list shows the correct answers.`, `${K('Try again')} to improve, or ${K('Back to lessons', 'y')}. Your best score is saved.`],
    [`वर्तुळात 5 पैकी गुण दिसतात. <b>4 किंवा 5</b> गुण मिळाल्यास <b>बॅज</b> मिळतो.`, `खाली बरोबर उत्तरांची यादी दिसते.`, `गुण वाढवण्यासाठी ${K('पुन्हा प्रयत्न करा')}, किंवा ${K('धड्यांकडे परत', 'y')}. सर्वोत्तम गुण जतन होतात.`]),
  step(10, 'Scan the QR poster at the work area', 'कामाच्या ठिकाणी QR पोस्टर स्कॅन करा', { id: '12_scan' },
    [`On Home, tap ${K('Scan task QR', 'dark')}. The camera opens.`, `Hold the poster's QR code inside the box. The right lesson opens directly.`, `Camera not working? Type the code printed under the QR (e.g. <b>SS-MAS-01</b>) and tap ${K('Open', 'y')}.`],
    [`होमवर ${K('QR स्कॅन करा', 'dark')} दाबा. कॅमेरा उघडतो.`, `पोस्टरचा QR कोड चौकटीत धरा. योग्य धडा थेट उघडतो.`, `कॅमेरा चालत नाही? QR खाली छापलेला कोड टाइप करा (उदा. <b>SS-MAS-01</b>) आणि ${K('उघडा', 'y')} दाबा.`]),
  step(11, 'If the QR code does not open a lesson', 'QR कोडने धडा उघडत नसेल तर', { id: '12b_scan_unknown' },
    [`"<b>This lesson is not in the app yet</b>" — the lesson is not on this phone yet. Ask your supervisor.`, `"<b>Not a SITE SAATHI code</b>" — this QR is something else (e.g. a payment QR).`, `You can always find lessons with ${K('Start learning', 'y')} too.`],
    [`"<b>हा धडा अजून ॲपमध्ये नाही</b>" — हा धडा अजून या फोनवर नाही. सुपरवायझरला विचारा.`, `"<b>हा SITE SAATHI कोड नाही</b>" — हा दुसरा QR आहे (उदा. पेमेंटचा).`, `धडे ${K('शिकणे सुरू करा', 'y')} मधूनही नेहमी मिळतात.`]),
  step(12, 'Check your progress', 'तुमची प्रगती पाहा', { id: '13_skills' },
    [`Tap ${K('My skills')} on Home.`, `You see: lessons completed, progress for each module, your <b>best score</b> in each lesson and your <b>badges</b>.`, `Tap a lesson card to open it again.`],
    [`होमवर ${K('माझी कौशल्ये')} दाबा.`, `दिसते: किती धडे पूर्ण, प्रत्येक विषयाची प्रगती, प्रत्येक धड्यातील <b>सर्वोत्तम गुण</b> आणि तुमचे <b>बॅज</b>.`, `धडा पुन्हा उघडण्यासाठी त्याच्या कार्डवर टॅप करा.`]),
  step(13, 'Settings', 'सेटिंग्ज', { id: '14_settings' },
    [`<b>Language</b>: मराठी / हिंदी / English. <b>Text size</b>: ${K('Large')} makes all text bigger.`, `<b>How to install a reading voice</b>: help to make the phone read Marathi / Hindi aloud.`, `${K('Reset my progress', 'rd')} deletes your scores (it asks first). ${K('About')} shows the app information.`],
    [`<b>भाषा</b>: मराठी / हिंदी / English. <b>अक्षरांचा आकार</b>: ${K('मोठा')} — सर्व अक्षरे मोठी.`, `<b>वाचून दाखवण्याचा आवाज कसा बसवायचा</b>: फोनला मराठी / हिंदी वाचायला लावण्याची मदत.`, `${K('माझी प्रगती पुसा', 'rd')} — गुण पुसले जातात (आधी विचारते). ${K('माहिती')} — ॲपची माहिती.`]),
  `<h2 class="part">Part B · Supervisor (v1.1 app) / भाग ब · सुपरवायझर (v1.1 ॲप)</h2>`,
  step(14, 'Open Supervisor mode', 'सुपरवायझर मोड उघडा', { b: 'admin', id: '17_sup_pin' },
    [`Settings → ${K('Supervisor mode')}.`, `The first time, set your own <b>4-digit PIN</b>. Do not tell it to workers.`, `5 wrong tries → wait 1 minute.`],
    [`सेटिंग्ज → ${K('सुपरवायझर मोड')}.`, `पहिल्यांदा तुमचा स्वतःचा <b>4 अंकी PIN</b> ठेवा. कामगारांना सांगू नका.`, `5 वेळा चुकीचा PIN → 1 मिनिट थांबा.`]),
  step(15, 'Add workers and see their progress', 'कामगार जोडा आणि प्रगती पाहा', { b: 'admin', id: '17b_sup_table' },
    [`Type the <b>first name</b>, choose the <b>trade</b> (mason, helper…), tap ${K('Add worker')}. <b>No</b> phone number, Aadhaar or photo.`, `Before a lesson, the app asks "<b>Who is learning?</b>" — the score is saved for that worker.`, `The table shows each worker's score per lesson. ${K('Share summary', 'y')} sends it on WhatsApp.`],
    [`<b>पहिले नाव</b> टाका, <b>काम</b> निवडा (गवंडी, मदतनीस…), ${K('कामगार जोडा')} दाबा. फोन नंबर, आधार, फोटो <b>नाही</b>.`, `धड्यापूर्वी ॲप विचारते "<b>कोण शिकत आहे?</b>" — गुण त्या कामगाराच्या नावावर जतन होतात.`, `तक्त्यात प्रत्येक कामगाराचे गुण दिसतात. ${K('सारांश पाठवा', 'y')} — WhatsApp वर पाठवा.`]),
  step(16, 'Get new lessons', 'नवीन धडे मिळवा', { b: 'admin', id: '14_settings' },
    [`When Home says "<b>New lessons available</b>", connect to internet (Wi-Fi is best).`, `Settings → ${K('Check for new lessons', 'y')} → confirm. The phone downloads them <b>once</b>.`, `After that the new lessons and their QR posters work <b>without internet</b>.`],
    [`होमवर "<b>नवीन धडे उपलब्ध</b>" दिसल्यास इंटरनेट चालू करा (Wi-Fi चांगले).`, `सेटिंग्ज → ${K('नवीन धडे तपासा', 'y')} → होय. फोन ते <b>एकदाच</b> डाउनलोड करतो.`, `नंतर नवीन धडे आणि त्यांचे QR पोस्टर <b>इंटरनेटशिवाय</b> चालतात.`]),
  step(17, 'AI helpers (need internet / camera)', 'AI मदतनीस (इंटरनेट / कॅमेरा लागतो)', [{ b: 'admin', id: '15_ask', lang: 'en' }, { b: 'admin', id: '16_safety_ok', lang: 'en' }],
    [`<b>Ask Saathi</b> (blue): type or speak a construction question. Answers are marked "AI" — check with your supervisor.`, `<b>Safety check</b> (blue): take a photo to check a helmet. The photo stays on the phone. It is a training aid only.`, `Lessons never need these — they are extras.`],
    [`<b>साथीला विचारा</b> (निळे): बांधकामाचा प्रश्न टाइप करा किंवा बोला. उत्तरावर "AI" लिहिलेले असते — सुपरवायझरकडून खात्री करा.`, `<b>सुरक्षा तपासणी</b> (निळे): हेल्मेट तपासण्यासाठी फोटो काढा. फोटो फोनवरच राहतो. हे फक्त प्रशिक्षणासाठी.`, `धड्यांसाठी यांची गरज नाही — हे अतिरिक्त आहेत.`]),
  `<h2 class="part">Problems and tips / अडचणी आणि टिप्स</h2>`,
  table([['Problem / अडचण', 'What to do / काय करायचे'],
    ['No internet / इंटरनेट नाही', 'Lessons still work. Only Ask Saathi and new-lesson downloads need internet. / धडे चालतातच. फक्त साथीला विचारा आणि नवीन धडे डाउनलोडसाठी इंटरनेट लागते.'],
    ['Text too small / अक्षरे लहान', 'Settings → Text size → Large. / सेटिंग्ज → अक्षरांचा आकार → मोठा.'],
    ['Wrong language / चुकीची भाषा', 'Settings → Language. / सेटिंग्ज → भाषा.'],
    ['No sound / आवाज येत नाही', 'Turn up the volume. "Audio not recorded yet" = audio comes later; read the text. / आवाज वाढवा. "आवाज अजून रेकॉर्ड झालेला नाही" = नंतर येईल; मजकूर वाचा.'],
    ['QR does not scan / QR स्कॅन होत नाही', 'Clean the camera, hold the phone steady, or type the code (SS-MAS-01). / कॅमेरा पुसा, फोन स्थिर धरा, किंवा कोड टाइप करा.'],
    ['Anything else / इतर काहीही', 'Ask your supervisor. / सुपरवायझरला विचारा.']]),
  `<p class="foot">SITE SAATHI · Civilathon · RIT Sangli. Screens: app ${VER} / admin build ${AVER} (drawn from the real app). मराठी मजकूर मसुदा आहे — मूळ भाषकाकडून तपासावा.</p>`,
];

// =====================================================================================
// Guide 2 · admin users (content team in Admin Mode)
// =====================================================================================
const legend = table([['Icon', 'Status', 'Meaning / अर्थ'],
  [icon('st_draft'), 'Draft', 'Being written. Workers never see it. / लिहिणे चालू. कामगारांना दिसत नाही.'],
  [icon('st_review'), 'In review', 'Waiting for the expert. / तज्ञाच्या तपासणीची वाट.'],
  [icon('st_changes'), 'Changes needed', 'Sent back with a comment — fix it. / सूचनेसह परत — दुरुस्त करा.'],
  [icon('st_approved'), 'Approved', 'Expert approved. Ready to publish. / तज्ञाने मंजूर केले. प्रकाशित करण्यास तयार.'],
  [icon('st_live'), 'Published', 'Live on all phones. / सर्व फोनवर उपलब्ध.'],
  [icon('st_hidden'), 'Hidden', 'Removed from workers\' lists. / कामगारांच्या यादीतून काढला.']]);
const admin = [
  cover('SITE SAATHI — Admin Mode guide', 'SITE SAATHI — Admin Mode मार्गदर्शक',
    'For the content team: Writer, Reviewer (expert), Admin', 'कंटेंट टीमसाठी: लेखक (Writer), तज्ञ (Reviewer), Admin', `Admin build ${AVER}`,
    table([['Role / भूमिका', 'Job / काम'],
      ['<b>Writer</b> / लेखक, अनुवादक', 'Writes lessons in 3 languages, adds photos, audio and the quiz, then submits for review. / 3 भाषांत धडे लिहितो, फोटो, आवाज, क्विझ टाकतो आणि तपासणीसाठी पाठवतो.'],
      ['<b>Reviewer</b> / तज्ञ', 'Reads and checks the lesson, then approves or sends it back with a comment. Does not edit. / धडा वाचून तपासतो, मंजूर करतो किंवा सूचनेसह परत पाठवतो. बदल करत नाही.'],
      ['<b>Admin</b>', 'Everything above, plus publishes to all phones, edits app texts, manages QR posters. / वरील सर्व, आणि सर्व फोनवर प्रकाशित करणे, ॲपमधील मजकूर, QR पोस्टर.']]) +
    box('yellow', `<p><b>You need internet</b> in Admin Mode. Workers' phones do not. / Admin Mode साठी <b>इंटरनेट लागते</b>. कामगारांच्या फोनला नाही.</p>`) +
    box('red', `<p>Never share your password in a group chat. Log out on a shared phone. / पासवर्ड ग्रुप चॅटमध्ये कधीच पाठवू नका. शेअर केलेल्या फोनवर लॉगआउट करा.</p>`)),
  `<h2 class="part">Start / सुरुवात</h2>`,
  step(1, 'Open Admin Mode (hidden)', 'Admin Mode उघडा (लपलेला)', { b: 'admin', id: '14b_about' },
    [`Open the app → ${K('Settings')} → ${K('About')}.`, `Tap the <b>version line</b> (e.g. "Version 1.1…") <b>5 times</b>.`, `The Admin login opens. Workers never see this.`],
    [`ॲप उघडा → ${K('सेटिंग्ज')} → ${K('माहिती')}.`, `<b>आवृत्तीच्या ओळीवर</b> (उदा. "आवृत्ती 1.1…") <b>5 वेळा</b> टॅप करा.`, `Admin लॉगिन उघडते. कामगारांना हे दिसत नाही.`]),
  step(2, 'First setup (only once, on a new server)', 'पहिली सेटिंग (फक्त एकदा, नवीन सर्व्हरवर)', { b: 'admin', id: '29_adm_setup' },
    [`On a brand-new server, Admin Mode opens <b>First setup</b> by itself.`, `Open the Google Sheet → tab <b>setup</b> → copy the <b>6-digit code</b>. Only people with the sheet can see it.`,
      `Type the code, your name, email and a password (8+ characters) → ${K('Create Admin account', 'y')}. You are now the Admin. 5 wrong codes → a new code appears in the sheet.`],
    [`नवीन सर्व्हरवर Admin Mode आपोआप <b>पहिली सेटिंग</b> उघडतो.`, `Google Sheet उघडा → <b>setup</b> टॅब → <b>6 अंकी कोड</b> कॉपी करा. शीट ज्यांच्याकडे आहे त्यांनाच तो दिसतो.`,
      `कोड, तुमचे नाव, ईमेल आणि पासवर्ड (8+ अक्षरे) टाका → ${K('Admin खाते तयार करा', 'y')}. आता तुम्ही Admin. 5 वेळा चुकीचा कोड → शीटमध्ये नवीन कोड येतो.`]),
  step(3, 'Server keys (Admin, once)', 'सर्व्हर कीज (Admin, एकदा)', { b: 'admin', id: '30_adm_keys_full', pos: '0%' },
    [`Dashboard → ${K('Server keys')}. The green card shows what is already saved.`, `<b>Cloudinary</b> (photos and audio): free account at cloudinary.com → Dashboard → paste <b>Cloud name, API key, API secret</b>. <b>Gemini</b> (Ask Saathi backup, optional): free key from aistudio.google.com — never turn on billing.`,
      `Tap ${K('Save', 'y')}. The server checks the keys; wrong keys are refused. Keys are saved on the server only — never on the phone, and never shown again.`],
    [`डॅशबोर्ड → ${K('सर्व्हर कीज')}. हिरव्या कार्डवर आधी काय जतन आहे ते दिसते.`, `<b>Cloudinary</b> (फोटो आणि आवाज): cloudinary.com वर मोफत खाते → Dashboard → <b>Cloud name, API key, API secret</b> पेस्ट करा. <b>Gemini</b> (Ask Saathi बॅकअप, ऐच्छिक): aistudio.google.com वरून मोफत की — बिलिंग कधीच चालू करू नका.`,
      `${K('जतन करा', 'y')} दाबा. सर्व्हर कीज तपासतो; चुकीच्या कीज नाकारल्या जातात. कीज फक्त सर्व्हरवर जतन होतात — फोनवर कधीच नाही, आणि पुन्हा दाखवल्या जात नाहीत.`]),
  step(4, 'Log in', 'लॉगिन करा', { b: 'admin', id: '20_adm_login' },
    [`<b>Server address</b>: paste it once (the Admin gives it to you).`, `Type your <b>email</b> and <b>password</b> → ${K('Log in', 'y')}.`, `5 wrong passwords → wait 10 minutes. You stay logged in for 12 hours.`],
    [`<b>सर्व्हर पत्ता</b>: एकदाच पेस्ट करा (Admin देतो).`, `तुमचा <b>ईमेल</b> आणि <b>पासवर्ड</b> टाका → ${K('लॉगिन करा', 'y')}.`, `5 वेळा चुकीचा पासवर्ड → 10 मिनिटे थांबा. 12 तास लॉगिन राहता.`]),
  step(5, 'The Dashboard', 'डॅशबोर्ड', { b: 'admin', id: '21_adm_dashboard' },
    [`Top tiles: <b>Live</b> lessons, lessons <b>To review</b>, content <b>Version</b>.`, `Each lesson row has a <b>colour icon</b> for its status (see the table below). Tap a row to open it.`, `${K('New lesson', 'y')} · ${K('QR codes')} · ${K('App texts')} (Admin) · ${K('Publish to all phones', 'dark')} (Admin) · ${K('Log out', 'rd')}.`],
    [`वरच्या टाइल्स: <b>चालू</b> धडे, <b>तपासायचे</b> धडे, मजकुराची <b>आवृत्ती</b>.`, `प्रत्येक धड्याच्या ओळीवर स्टेटसचा <b>रंगीत चिन्ह</b> (खालील तक्ता). उघडण्यासाठी ओळीवर टॅप करा.`, `${K('नवीन धडा', 'y')} · ${K('QR कोड')} · ${K('ॲपमधील मजकूर')} (Admin) · ${K('सर्व फोनवर प्रकाशित करा', 'dark')} (Admin) · ${K('लॉगआउट', 'rd')}.`]),
  legend,
  `<h2 class="part">Writer: make a lesson / लेखक: धडा तयार करा</h2>`,
  step(6, 'Start a new lesson', 'नवीन धडा सुरू करा', { b: 'admin', id: '22_adm_new' },
    [`Tap ${K('New lesson', 'y')} → ${K('Choose module')} (e.g. REI – Reinforcement).`, `Set the <b>duration</b> in minutes.`, `Choose the language ${K('English', 'y')} first, fill the fields (next step) and tap ${K('Save', 'y')}. The lesson code (e.g. <b>SS-REI-01</b>) is made automatically.`],
    [`${K('नवीन धडा', 'y')} → ${K('विषय निवडा')} (उदा. REI – सळई काम).`, `<b>वेळ</b> मिनिटांत टाका.`, `आधी ${K('English', 'y')} भाषा निवडा, माहिती भरा (पुढची पायरी) आणि ${K('जतन करा', 'y')}. धड्याचा कोड (उदा. <b>SS-REI-01</b>) आपोआप तयार होतो.`]),
  step(7, 'Write the lesson in 3 languages', '3 भाषांत धडा लिहा', { b: 'admin', id: '23_adm_editor', pos: '18%' },
    [`Fill <b>Title, Description, Objective, Materials and tools, Safety precautions, Common mistakes</b> — one item per line.`, `Tap ${K('Save', 'y')}. Then tap ${K('मराठी')} and ${K('हिंदी')} and fill the same fields in each language.`, `Short, simple sentences. Never use AI text without checking.`],
    [`<b>शीर्षक, वर्णन, उद्दिष्ट, साहित्य आणि साधने, सुरक्षा खबरदारी, नेहमीच्या चुका</b> भरा — प्रत्येक ओळीत एक.`, `${K('जतन करा', 'y')} दाबा. मग ${K('मराठी')} आणि ${K('हिंदी')} निवडून प्रत्येक भाषेत तीच माहिती भरा.`, `छोटी, सोपी वाक्ये. AI चा मजकूर तपासल्याशिवाय वापरू नका.`]),
  step(8, 'Record the audio', 'आवाज रेकॉर्ड करा', { b: 'admin', id: '23_adm_editor_full', pos: '64%' },
    [`In the audio card: ${K('Record')} → speak slowly in a quiet place → ${K('Stop')}.`, `${K('Listen')} to check, then ${K('Save', 'y')} to upload it. Do this for each language.`, `No recording? Tick "<b>No recording: read-aloud only</b>" — the phone reads the text.`],
    [`ऑडिओ कार्डमध्ये: ${K('रेकॉर्ड करा')} → शांत जागी हळू बोला → ${K('थांबवा')}.`, `${K('ऐका')} ने तपासा, मग ${K('जतन करा', 'y')} — अपलोड होते. प्रत्येक भाषेसाठी करा.`, `रेकॉर्डिंग नाही? "<b>रेकॉर्डिंग नाही: फक्त वाचून दाखवणे</b>" निवडा — फोन मजकूर वाचून दाखवतो.`]),
  step(9, 'Add steps and pictures', 'पायऱ्या आणि चित्रे टाका', { b: 'admin', id: '24_adm_steps' },
    [`Tap ${K('Steps and pictures')} → choose the step (or "+ Step 2").`, `${K('Camera')} or ${K('Gallery')} → ${K('Save', 'y')} uploads the photo. Clear photo, no faces, no words in the picture.`, `Write the step text in मराठी, हिंदी and English → ${K('Save', 'y')}. Back arrow returns to the lesson.`],
    [`${K('पायऱ्या आणि चित्रे')} → पायरी निवडा (किंवा "+ पायरी 2").`, `${K('कॅमेरा')} किंवा ${K('गॅलरी')} → ${K('जतन करा', 'y')} — फोटो अपलोड होतो. स्पष्ट फोटो, चेहरे नाहीत, चित्रात शब्द नाहीत.`, `पायरीचा मजकूर मराठी, हिंदी, English मध्ये लिहा → ${K('जतन करा', 'y')}. मागचा बाण — धड्याकडे परत.`]),
  step(10, 'Make the quiz', 'क्विझ तयार करा', { b: 'admin', id: '25_adm_quiz' },
    [`Tap ${K('Quiz')}. Choose question <b>1 to 5</b>.`, `Type the question and options <b>A–D</b>, choose the <b>Correct answer</b>, write <b>Why this answer</b>.`, `${K('Save', 'y')}. Make all 5 questions in each language (same correct letter).`],
    [`${K('क्विझ')} दाबा. प्रश्न <b>1 ते 5</b> निवडा.`, `प्रश्न आणि पर्याय <b>A–D</b> लिहा, <b>बरोबर उत्तर</b> निवडा, <b>उत्तराचे कारण</b> लिहा.`, `${K('जतन करा', 'y')}. प्रत्येक भाषेत 5 प्रश्न (बरोबर उत्तराचे अक्षर तेच).`]),
  step(11, 'Check the list and submit', 'यादी तपासा आणि पाठवा', { b: 'admin', id: '23_adm_editor_full', pos: '96%' },
    [`At the bottom of the lesson: <b>yellow card</b> = list of what is still <b>Missing</b>.`, `When everything is done the card turns <b>green</b>: "Complete – ready to submit".`, `Tap ${K('Submit for review', 'dark')}. The status becomes <b>In review</b> (amber).`],
    [`धड्याच्या तळाशी: <b>पिवळे कार्ड</b> = अजून काय <b>बाकी</b> आहे त्याची यादी.`, `सर्व पूर्ण झाल्यावर कार्ड <b>हिरवे</b> होते: "पूर्ण – पाठवू शकता".`, `${K('तपासणीसाठी पाठवा', 'dark')} दाबा. स्टेटस <b>In review</b> (पिवळसर) होतो.`]),
  `<h2 class="part">Reviewer and Admin / तज्ञ आणि Admin</h2>`,
  step(12, 'Reviewer: approve or send back', 'तज्ञ: मंजूर करा किंवा परत पाठवा', { b: 'admin', id: '28_adm_review_full', pos: '100%' },
    [`Log in as Reviewer → tap a lesson with the <b>amber eye</b> icon.`, `Read all 3 languages, the steps, pictures and quiz. Write a comment.`, `${K('Approve', 'g')} if it is correct and safe, or ${K('Send back', 'rd')} with what to fix. The writer fixes it and submits again.`],
    [`Reviewer म्हणून लॉगिन → <b>पिवळसर डोळा</b> चिन्ह असलेला धडा उघडा.`, `तिन्ही भाषा, पायऱ्या, चित्रे आणि क्विझ वाचा. सूचना लिहा.`, `बरोबर आणि सुरक्षित असल्यास ${K('मंजूर करा', 'g')}, नाहीतर काय दुरुस्त करायचे ते लिहून ${K('परत पाठवा', 'rd')}. लेखक दुरुस्त करून पुन्हा पाठवतो.`]),
  step(13, 'Admin: publish to all phones', 'Admin: सर्व फोनवर प्रकाशित करा', { b: 'admin', id: '21_adm_dashboard' },
    [`On the Dashboard tap ${K('Publish to all phones', 'dark')} → ${K('Yes')}.`, `All <b>Approved</b> lessons become <b>Published</b> and the <b>Version</b> goes up by 1.`, `Phones get them with "Check for new lessons" (site guide, step 16).`],
    [`डॅशबोर्डवर ${K('सर्व फोनवर प्रकाशित करा', 'dark')} → ${K('होय')}.`, `सर्व <b>मंजूर</b> धडे <b>प्रकाशित</b> होतात आणि <b>आवृत्ती</b> 1 ने वाढते.`, `फोनवर ते "नवीन धडे तपासा" ने येतात (साइट मार्गदर्शक, पायरी 16).`]),
  step(14, 'QR codes and posters', 'QR कोड आणि पोस्टर', { b: 'admin', id: '26_adm_qr' },
    [`Tap ${K('QR codes')} → tap a lesson. Its QR code holds only the lesson code (e.g. SS-REI-01).`, `Write the <b>Poster place</b> (e.g. "Bar bending yard"), tick <b>Printed</b> when it is up → ${K('Save', 'y')}.`, `Print the poster at A5 and put it near that work.`],
    [`${K('QR कोड')} → धडा निवडा. त्याच्या QR मध्ये फक्त धड्याचा कोड असतो (उदा. SS-REI-01).`, `<b>पोस्टरची जागा</b> लिहा (उदा. "सळई वाकवण्याची जागा"), लावल्यावर <b>छापले</b> खूण करा → ${K('जतन करा', 'y')}.`, `पोस्टर A5 आकारात छापून त्या कामाजवळ लावा.`]),
  step(15, 'App texts (Admin)', 'ॲपमधील मजकूर (Admin)', { b: 'admin', id: '27_adm_texts' },
    [`Tap ${K('App texts')}. Search for a button or message.`, `Change the मराठी, हिंदी and English text → ${K('Save', 'y')}.`, `Then ${K('Publish to all phones', 'dark')} — no new APK is needed.`],
    [`${K('ॲपमधील मजकूर')} दाबा. बटण किंवा संदेश शोधा.`, `मराठी, हिंदी आणि English मजकूर बदला → ${K('जतन करा', 'y')}.`, `मग ${K('सर्व फोनवर प्रकाशित करा', 'dark')} — नवीन APK लागत नाही.`]),
  `<h2 class="part">Rules and problems / नियम आणि अडचणी</h2>`,
  box('red', `<p><b>Every lesson must be approved by a civil engineering expert before publishing.</b> / <b>प्रकाशित करण्यापूर्वी प्रत्येक धडा सिव्हिल इंजिनिअरिंग तज्ञाने मंजूर केलाच पाहिजे.</b></p>
    <p>Never change a lesson code after publishing — printed QR posters use it. / प्रकाशित झाल्यावर धड्याचा कोड कधीच बदलू नका — छापलेले QR पोस्टर त्यावर चालतात.</p>
    <p>No phone numbers, Aadhaar or faces in lessons or photos. / धड्यात किंवा फोटोत फोन नंबर, आधार किंवा चेहरे नकोत.</p>`),
  table([['Message / संदेश', 'What to do / काय करायचे'],
    ['Network problem + Retry / नेटवर्क अडचण', 'Check internet, tap Retry. / इंटरनेट तपासा, Retry दाबा.'],
    ['Wrong setup code / चुकीचा सेटअप कोड', 'Copy the code again from the sheet tab setup. After 5 tries a new code appears there. / शीटच्या setup टॅबमधून कोड पुन्हा कॉपी करा. 5 वेळांनंतर तिथे नवीन कोड येतो.'],
    ['Cloudinary / Gemini did not accept the key / की स्वीकारली नाही', 'Copy the key again from the Cloudinary Dashboard or Google AI Studio, then Save. / Cloudinary Dashboard किंवा Google AI Studio मधून की पुन्हा कॉपी करा, मग जतन करा.'],
    ['Wrong email or password / चुकीचा ईमेल किंवा पासवर्ड', 'Type again. After 5 tries wait 10 minutes. / पुन्हा टाका. 5 वेळांनंतर 10 मिनिटे थांबा.'],
    ['"Add the Base64 extension blocks first"', 'Photo/audio upload is not set up yet — tell the Admin (one-time setup). / फोटो/आवाज अपलोड अजून सेट नाही — Admin ला सांगा (एकदाच करायचे).'],
    ['Submit button missing / पाठवा बटण दिसत नाही', 'Something is still Missing — see the yellow card. / काहीतरी बाकी आहे — पिवळे कार्ड पाहा.'],
    ['Cannot edit (Reviewer) / बदल करता येत नाही', 'Normal: Reviewers only approve or send back. / बरोबर: तज्ञ फक्त मंजूर करतो किंवा परत पाठवतो.']]),
  `<p class="foot">SITE SAATHI · Civilathon · RIT Sangli. Screens: admin build ${AVER} with example data (drawn from the real app). Server messages appear in English. मराठी मजकूर मसुदा आहे — मूळ भाषकाकडून तपासावा.</p>`,
];

// ---------- write + print ----------
const make = (name, title, parts) => {
  const html = path.join(os.tmpdir(), `ss_guide_${process.pid}_${name}.html`);
  fs.writeFileSync(html, `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>${CSS}</head><body>${parts.join('\n')}</body></html>`);
  const pdf = path.join(ROOT, 'Doc', name + '.pdf');
  try {
    execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--allow-file-access-from-files', `--user-data-dir=${path.join(os.tmpdir(), 'ss_guide_ud_' + process.pid + name)}`,
      '--no-pdf-header-footer', '--print-to-pdf-no-header', `--print-to-pdf=${pdf}`, '--virtual-time-budget=10000', url(html)], { stdio: 'ignore' });
  } catch (e) { /* Chrome can return non-zero even when the PDF is written */ }
  if (process.argv.includes('--keep')) console.log('HTML kept: ' + html); else fs.unlinkSync(html);
  console.log(fs.existsSync(pdf) ? `${path.relative(ROOT, pdf)} (${(fs.statSync(pdf).size / 1048576).toFixed(1)} MB)` : `${name}.pdf NOT written`);
};
make('SITE_SAATHI_Guide_Site_Users_EN_MR', 'SITE SAATHI guide · site users', site);
make('SITE_SAATHI_Guide_Admin_Users_EN_MR', 'SITE SAATHI guide · Admin Mode', admin);
