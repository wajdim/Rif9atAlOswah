/* التمييزات الدقيقة (js/data-distinctions.js): سلامة البيانات وكشفها في الرسائل.
   - كل دليل معرّف موجود في المكتبة الموثقة (QURAN_LIB / HADITH_LIB، أي ليس «unverified») — لا نص شرعي داخل الملف
   - كل موقف من السيرة موجود، وكل موضوع في قواعد الكشف موجود
   - العربية والإنجليزية كاملتان (title / not / is / signs)
   - كل وسم distinction في مفاهيم js/data-nlu.js له تمييز
   - رسائل يجب أن تُظهر تمييزًا بعينه، ورسائل يجب ألا تُظهر شيئًا
   node build/tests/test-distinctions.js */
const path = require("path");
const L = require("./load.js")(path.join(__dirname, "../../js"));
const D = L.DISTINCTIONS, R = L.RAG;
let fail = 0;
const bad = m => { fail++; console.log("  ✗ " + m); };

const lib = new Set([...L.QURAN_LIB.map(q => q.id), ...L.HADITH_LIB.map(h => h.id)]);
const sits = new Set(L.SITUATIONS.map(s => s.id)), themes = new Set(L.THEMES.map(t => t.id));
const ids = new Set();
for (const d of D) {
  if (ids.has(d.id)) bad(d.id + ": duplicate id"); ids.add(d.id);
  for (const l of ["ar", "en"]) {
    const c = d[l];
    if (!c || !c.title || !c.not || !c.is || !Array.isArray(c.signs) || c.signs.length < 2) bad(d.id + ": incomplete " + l);
    if (l === "ar" && c && /[a-z]{3}/i.test(c.title + c.not + c.is)) bad(d.id + ": Latin text in ar");
  }
  if (d.ar && d.en && d.ar.signs.length !== d.en.signs.length) bad(d.id + ": ar/en signs differ in count");
  if (!d.evidence || d.evidence.length < 2) bad(d.id + ": fewer than 2 evidence ids");
  (d.evidence || []).forEach(e => { if (!lib.has(e)) bad(d.id + ": evidence " + e + " is not in the verified library"); });
  (d.sits || []).forEach(s => { if (!sits.has(s)) bad(d.id + ": unknown situation " + s); });
  ((d.detect || {}).themes || []).forEach(g => g.forEach(t => { if (!themes.has(t)) bad(d.id + ": unknown theme " + t); }));
}
(L.NLU_DATA.concepts || []).forEach(c => { if (c.distinction && !ids.has(c.distinction)) bad("concept " + c.id + ": distinction " + c.distinction + " not defined"); });

const POS = [
  ["forgive_vs_abuse", "زوجي يضربني كل اسبوع ثم يعتذر وأنا أسامحه"],
  ["forgive_vs_abuse", "my husband keeps hurting me and apologizing, should I keep forgiving"],
  ["patience_vs_passivity", "هل الصبر أن أبقى مع مدير يهينني كل يوم؟"],
  ["tawakkul_vs_inaction", "I said it's in God's hands but I haven't applied to any job"],
  ["tawakkul_vs_inaction", "توكلت على الله وما ذاكرت للامتحان"],
  ["humility_vs_humiliation", "أتنازل دائمًا عن حقي باسم التواضع حتى صار الناس يستغلونني"],
  ["justice_vs_revenge", "هل المطالبة بحقي في المحكمة انتقام أم عدل"],
  ["justice_vs_revenge", "أريد أن أنتقم من زميلي الذي سرقني"],
  ["anger_ego_vs_justice", "Am I angry for justice or just because my pride is hurt?"],
  ["disagreement_vs_conflict", "اختلفت مع صديقي في مسألة فقهية وتحول الأمر إلى قطيعة"],
  ["depression_vs_weak_faith", "is depression weak faith? I have no motivation for months"],
  ["treatment_vs_patience", "هل العلاج النفسي حرام؟ أنا مكتئب"],
  ["parents_vs_harm", "أبي يجبرني على الزواج من شخص لا أريده"],
  ["repentance_vs_despair", "ذنوبي أكبر من أن يغفرها الله"],
  ["care_vs_suspicion", "I want to check my husband's phone, I think he talks to other women"],
  ["care_vs_suspicion", "أفتش في هاتف زوجي كل ليلة لأني لا أثق به"]
];
const NEG = [
  "أبي يصرخ علي", "الحمد لله نجحت في الامتحان", "I feel sad today", "صديقي لا يرد على رسائلي",
  "الشرطي أخذ مني مالًا ظلمًا ولا أستطيع أن أشتكي", "الشاف متاعي ياكل في حقي وما يعطينيش البريمة",
  "I lost my job and I'm worried about rent", "أمي مريضة وأنا خائف عليها"
];
let pos = 0;
for (const [id, m] of POS) {
  const got = R.understand(m).distinctions.map(d => d.id);
  if (got.includes(id)) pos++; else bad("expected " + id + ", got [" + got.join(",") + "]: " + m);
}
let neg = 0;
for (const m of NEG) {
  const got = R.understand(m).distinctions.map(d => d.id);
  if (!got.length) neg++; else bad("expected none, got [" + got.join(",") + "]: " + m);
}
// لا تمييز مع إشارات الأزمة: الأولوية للسلامة
const cr = R.understand("أريد أن أنتحر لأن زوجي يضربني وأسامحه كل مرة");
if (cr.crisis && cr.distinctions.length) bad("distinction shown alongside a crisis message");

console.log("distinctions " + D.length + " · evidence ids " + D.reduce((n, d) => n + d.evidence.length, 0) + " (all in the verified library)" +
  " · detection " + pos + "/" + POS.length + " · no false alarm " + neg + "/" + NEG.length);
if (fail) { console.log(fail + " problem(s)"); process.exit(1); }
console.log("ok");
