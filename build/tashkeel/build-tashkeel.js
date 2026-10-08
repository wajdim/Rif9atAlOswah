/* ======================================================================
   رِفقة الأُسوة — توليد ملف التشكيل js/data-tashkeel.js
   ----------------------------------------------------------------------
   1) الآيات: يجلب النص المشكول من مصحف Tanzil (إصدار quran-simple عبر
      api.alquran.cloud، مع حفظ نسخة في build/tashkeel/cache)، ثم يطابق كل
      نص في المكتبة حرفًا بحرف بعد حذف الحركات، ويستخرج المقطع المشكول نفسه
      (يدعم الاقتباس الجزئي من الآية ومجموعات الآيات "155-157").
   2) الأحاديث والأذكار: من hadith-tashkeel.json (النص المشكول يدويًا).
   صمّام أمان: لا يُقبل أي نص مشكول إلا إذا طابقت حروفه حروف الأصل تمامًا
   بعد حذف الحركات؛ فالتشكيل لا يغيّر كلمة واحدة.
   الاستخدام: node build/tashkeel/build-tashkeel.js
   ====================================================================== */
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..", "..");
const G = require("../tests/load.js")(path.join(ROOT, "js"));
const CACHE = path.join(__dirname, "cache"); fs.mkdirSync(CACHE, { recursive: true });

const SURAHS = ["الفاتحة","البقرة","آل عمران","النساء","المائدة","الأنعام","الأعراف","الأنفال","التوبة","يونس","هود","يوسف","الرعد","إبراهيم","الحجر","النحل","الإسراء","الكهف","مريم","طه","الأنبياء","الحج","المؤمنون","النور","الفرقان","الشعراء","النمل","القصص","العنكبوت","الروم","لقمان","السجدة","الأحزاب","سبأ","فاطر","يس","الصافات","ص","الزمر","غافر","فصلت","الشورى","الزخرف","الدخان","الجاثية","الأحقاف","محمد","الفتح","الحجرات","ق","الذاريات","الطور","النجم","القمر","الرحمن","الواقعة","الحديد","المجادلة","الحشر","الممتحنة","الصف","الجمعة","المنافقون","التغابن","الطلاق","التحريم","الملك","القلم","الحاقة","المعارج","نوح","الجن","المزمل","المدثر","القيامة","الإنسان","المرسلات","النبأ","النازعات","عبس","التكوير","الانفطار","المطففين","الانشقاق","البروج","الطارق","الأعلى","الغاشية","الفجر","البلد","الشمس","الليل","الضحى","الشرح","التين","العلق","القدر","البينة","الزلزلة","العاديات","القارعة","التكاثر","العصر","الهمزة","الفيل","قريش","الماعون","الكوثر","الكافرون","النصر","المسد","الإخلاص","الفلق","الناس"];
const normS = s => String(s || "").replace(/[إأآ]/g, "ا").replace(/^سورة\s+/, "").trim();
const SNO = {}; SURAHS.forEach((n, i) => SNO[normS(n)] = i + 1);

/* ---------- المطابقة ---------- */
const DIAC = /[ً-ٰٟۖ-ۭـ]/;          // حركات + علامات الوقف + التطويل
function letterKey(ch) {                                           // توحيد صور الحروف للمقارنة فقط
  if ("أإآٱا".includes(ch)) return "ا";
  if ("ىي".includes(ch)) return "ي";
  if ("ؤئء".includes(ch)) return "ء";
  if (ch === "ة") return "ه";
  return ch;
}
/** يحوّل النص إلى سلسلة حروف (بلا حركات ولا مسافات ولا ترقيم) مع موضع كل حرف في الأصل */
function skeleton(text) {
  const chars = [], pos = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (DIAC.test(ch) || !/[ء-يٱ]/.test(ch)) continue;
    chars.push(letterKey(ch)); pos.push(i);
  }
  return { s: chars.join(""), pos };
}
/** يستخرج من النص المشكول المقطع المطابق لحروف النص المجرد */
function extract(vocal, plain) {
  const V = skeleton(vocal), P = skeleton(plain);
  if (!P.s.length) return null;
  const at = V.s.indexOf(P.s); if (at < 0) return null;
  let start = V.pos[at], end = V.pos[at + P.s.length - 1] + 1;
  while (end < vocal.length && DIAC.test(vocal[end])) end++;      // حركات الحرف الأخير
  return vocal.slice(start, end).replace(/[ۖ-ۭ]/g, "").replace(/۞\s*/g, "").replace(/\s+/g, " ").trim();
}
/** اقتباس فيه حذف («…» أو «*» بين آيات): يُشكَّل كل جزء على حدة ويبقى الفاصل كما هو */
function extractPieces(vocal, plain) {
  const parts = plain.split(/(\s*(?:\.\.\.|…|\*)\s*)/);
  if (parts.length === 1) return extract(vocal, plain);
  let out = "";
  for (const p of parts) {
    if (/^\s*(?:\.\.\.|…|\*)\s*$/.test(p)) { out += " " + p.trim() + " "; continue; }
    if (!p.trim()) continue;
    const v = extract(vocal, p); if (!v) return null;
    out += v;
  }
  return out.replace(/\s+/g, " ").trim();
}
const sameLetters = (a, b) => skeleton(a).s === skeleton(b).s;

let MUSHAF = null;   // [سورة][آية] — يُجلب مرة واحدة ويُحفظ
async function surah(n) {
  if (!MUSHAF) {
    const f = path.join(CACHE, "quran-simple.json");
    if (!fs.existsSync(f)) {
      const r = await fetch("https://api.alquran.cloud/v1/quran/quran-simple");
      if (!r.ok) throw new Error("quran-simple: HTTP " + r.status);
      fs.writeFileSync(f, JSON.stringify((await r.json()).data.surahs.map(s => s.ayahs.map(a => a.text))));
    }
    MUSHAF = JSON.parse(fs.readFileSync(f, "utf8"));
  }
  return MUSHAF[n - 1];
}

(async () => {
  /* ---------- 1) الآيات ---------- */
  const refs = [];
  G.QURAN_LIB.forEach(q => refs.push({ s: q.s, a: String(q.a), t: q.t, where: q.id }));
  G.SITUATIONS.forEach(s => (s.quranRefs || []).forEach(q => refs.push({ s: q.surahName, a: String(q.ayahNumber), t: q.text, where: s.id })));
  const quran = {}, missQ = [];
  for (const r of refs) {
    const n = SNO[normS(r.s)], m = r.a.match(/(\d+)(?:\s*[-–]\s*(\d+))?/);
    if (!n || !m) { missQ.push(r.where + " (سورة غير معروفة " + r.s + ")"); continue; }
    const ayat = await surah(n), a = +m[1], b = m[2] ? +m[2] : a;
    // نجرب الآية المذكورة، ثم نوسّع النطاق قليلًا إن كان الاقتباس يمتد لما بعدها
    let v = null;
    for (const extra of [0, 1, 2, 3]) {
      const span = ayat.slice(a - 1, Math.min(ayat.length, b + extra)).join(" ");
      v = extractPieces(span, r.t); if (v) break;
    }
    if (v && sameLetters(v, r.t)) quran[n + ":" + r.a + ":" + skeleton(r.t).s] = v;
    else missQ.push(r.where + " — " + r.s + " " + r.a);
  }

  /* ---------- 2) الأحاديث والأذكار ---------- */
  const src = {};   // hadith-tashkeel*.json: {المعرّف: النص المشكول}
  fs.readdirSync(__dirname).filter(f => /^hadith-tashkeel.*\.json$/.test(f))
    .forEach(f => Object.assign(src, JSON.parse(fs.readFileSync(path.join(__dirname, f), "utf8"))));
  // المعتمد: ضبط كتب الحديث بعد المراجعة (finalize-hadith.py)، والضبط اليدوي احتياط لما لم يُوجد
  const fin = path.join(__dirname, "hadith-final.json");
  if (fs.existsSync(fin)) Object.assign(src, JSON.parse(fs.readFileSync(fin, "utf8")));
  const plainTexts = new Map();
  G.HADITH_LIB.forEach(h => plainTexts.set(h.id, h.t));
  G.SITUATIONS.forEach(s => (s.hadithRefs || []).forEach((h, i) => plainTexts.set(s.id + "#" + i, h.text)));
  const speech = {}, badH = [];
  for (const [id, vocal] of Object.entries(src)) {
    const plain = plainTexts.get(id);
    if (!plain) { badH.push(id + " (معرّف غير موجود)"); continue; }
    if (!sameLetters(vocal, plain)) { badH.push(id + " (الحروف لا تطابق الأصل)"); continue; }
    speech[skeleton(plain).s] = vocal.replace(/\s+/g, " ").trim();
  }
  const noH = [...plainTexts.keys()].filter(id => !speech[skeleton(plainTexts.get(id)).s]);   // النص المكرر يغطيه مفتاحه

  /* ---------- الإخراج ---------- */
  const out = `/* ======================================================================
   رِفقة الأُسوة — التشكيل (مولَّد آليًا: node build/tashkeel/build-tashkeel.js)
   - quran : نص الآيات المشكول من مصحف Tanzil (quran-simple)، للعرض وللنطق.
   - speech: الأحاديث والأذكار مشكولة لضبط النطق في القراءة الصوتية.
   المفتاح = حروف النص بلا حركات ولا مسافات، فلا يغيّر التشكيل أي كلمة.
   ====================================================================== */
var TASHKEEL = (function(){
  var Q = ${JSON.stringify(quran)};
  var H = ${JSON.stringify(speech)};
  var SNO = ${JSON.stringify(SNO)};
  function letterKey(ch){ return "أإآٱا".indexOf(ch)>-1?"ا":"ىي".indexOf(ch)>-1?"ي":"ؤئء".indexOf(ch)>-1?"ء":ch==="ة"?"ه":ch; }
  function key(t){ var o=""; t=String(t||""); for(var i=0;i<t.length;i++){ var c=t[i]; if(c!=="\\u0640" && /[\\u0621-\\u064A\\u0671]/.test(c)) o+=letterKey(c); } return o; }
  function sn(s){ return SNO[String(s||"").replace(/[إأآ]/g,"ا").replace(/^سورة\\s+/,"").trim()]; }
  return {
    quranFor: function(surah, ayah, plain){ return Q[sn(surah)+":"+ayah+":"+key(plain)] || null; },
    speech: function(plain){ return H[key(plain)] || null; },
    stats: {quran: ${Object.keys(quran).length}, speech: ${Object.keys(speech).length}}
  };
})();
`;
  fs.writeFileSync(path.join(ROOT, "js", "data-tashkeel.js"), out);

  /* ---------- 3) النصوص الشارحة (اختياري للمستخدم): ناتج diacritize-prose.py ---------- */
  const pf = fs.existsSync(path.join(__dirname, "prose-final.json")) ? path.join(__dirname, "prose-final.json") : path.join(__dirname, "prose-tashkeel.json");   // بعد التصحيح والمراجعة
  if (fs.existsSync(pf)) {
    const prose = JSON.parse(fs.readFileSync(pf, "utf8")), S = {}, words = {};
    const mf = path.join(__dirname, "prose-manual.json");               // نصوص أُضيفت بعد التشكيل الآلي: مشكولة يدويًا
    if (fs.existsSync(mf)) Object.assign(prose, JSON.parse(fs.readFileSync(mf, "utf8")));
    const strip = w => w;                                                // الكلمة بضبطها الكامل (مع حركة آخرها)
    for (const [plain, vocal] of Object.entries(prose)) {
      if (!sameLetters(plain, vocal)) continue;
      if (/[<>=]|class|data-|\$\{|##/.test(plain)) continue;              // بقايا شيفرة برمجية لا تُعرض
      S[skeleton(plain).s] = vocal;
      for (const w of vocal.split(/[^ء-ْٰٱ]+/)) {   // قاموس كلمات للنصوص المركّبة آليًا
        const k = skeleton(w).s; if (k.length < 3) continue;
        (words[k] = words[k] || {})[strip(w)] = (words[k][strip(w)] || 0) + 1;
      }
    }
    const W = {};
    for (const [k, forms] of Object.entries(words)) {                   // الضبط الغالب للكلمة في سياقاتها
      const [best] = Object.entries(forms).sort((a, b) => b[1] - a[1])[0];
      W[k] = best;
    }
    const wf = path.join(__dirname, "words-tashkeel.json");             // كلمات لم ترد في نص مشكول: ضبطها منفردة
    if (fs.existsSync(wf)) for (const [plain, vocal] of Object.entries(JSON.parse(fs.readFileSync(wf, "utf8")))) {
      const k = skeleton(plain).s; if (!W[k] && sameLetters(plain, vocal) && k.length > 1) W[k] = vocal.trim();
    }
    fs.writeFileSync(path.join(ROOT, "js", "data-tashkeel-prose.js"),
      `/* رِفقة الأُسوة — تشكيل آلي للنصوص الشارحة (نموذج CATT) — اختياري من الإعدادات. مولَّد: build/tashkeel/build-tashkeel.js */\n` +
      `var PROSE_TASHKEEL={s:${JSON.stringify(S)},w:${JSON.stringify(W)}};\n`);
    console.log("prose: " + Object.keys(S).length + " نصًا، " + Object.keys(W).length + " كلمة");
  }
  console.log("quran: " + Object.keys(quran).length + "/" + refs.length + " مشكولة");
  if (missQ.length) console.log("  لم تُطابق:\n   " + missQ.join("\n   "));
  console.log("hadith: " + (plainTexts.size - noH.length) + "/" + plainTexts.size + " مشكولة");
  if (badH.length) console.log("  مرفوضة:\n   " + badH.join("\n   "));
  if (noH.length && process.argv.includes("--list-missing")) console.log("  بلا تشكيل: " + noH.join(" "));
})().catch(e => { console.error(e); process.exit(1); });
