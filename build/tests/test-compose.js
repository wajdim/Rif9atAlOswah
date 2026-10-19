/* مركِّب الإجابة ومدقق الاستشهادات (js/compose.js)
   - المدقق: يقبل كل نص موثق كما هو، ويرفض: نصًا تغيّر ولو حرفًا، ومعرّفًا بلا سجل، وحديثًا «unverified»، ونوعًا خاطئًا
   - النص المشكول المعروض: يطابق حروف النص الموثق لكل آية وحديث (وإلا يُعرض الموثق بلا تشكيل)
   - على كل رسائل المقياس (الرئيسي والتطوير) وبالأعماق الثلاثة: لا يسقط أي استشهاد، وكل استشهاد له تفاصيل مصدر،
     والأعداد متدرجة (مختصر ≤ متوسط ≤ معمّق)، والمختصر يحتفظ بدليل واحد على الأقل متى وُجد، وحدود المثال لا تُحذف
   - رسائل الأزمة: لا تمييزات، وsafety=true
   node build/tests/test-compose.js */
const fs = require("fs"), path = require("path"), vm = require("vm");
const JS = path.join(__dirname, "../../js"), FIX = path.join(__dirname, "fixtures");
const L = require("./load.js")(JS);
const C = L.COMPOSE, E = L.EVIDENCE;
let fail = 0; const bad = m => { if (fail++ < 25) console.log("  ✗ " + m); };

// 1) المدقق
const lib = [...L.QURAN_LIB.map(q => ["quran", q.id, q.t]), ...L.HADITH_LIB.map(h => ["hadith", h.id, h.t])];
L.SITUATIONS.forEach(s => {
  (s.quranRefs || []).forEach((q, i) => lib.push(["quran", s.id + "#q" + i, q.text]));
  (s.hadithRefs || []).forEach((h, i) => lib.push(["hadith", s.id + "#" + i, h.text]));
});
let accepted = 0;
for (const [k, id, t] of lib) {
  const v = C.validate(k, id, t);
  if (v.ok) accepted++;
  else if (!(k === "hadith" && E[id] && E[id].v === "unverified")) bad("valid citation rejected: " + id + " (" + v.reason + ")");
  const mid = t.length >> 1, alt = t.slice(0, mid) + (t[mid] === "ن" ? "م" : "ن") + t.slice(mid + 1);   // one letter changed
  if (C.validate(k, id, alt).ok) bad("altered text accepted: " + id);
  if (C.validate(k === "quran" ? "hadith" : "quran", id, t).ok) bad("wrong kind accepted: " + id);
}
if (C.validate("hadith", "h-does-not-exist", "x").ok) bad("unknown id accepted");
L.HADITH_ALL.filter(h => E[h.id] && E[h.id].v === "unverified").forEach(h => { if (C.validate("hadith", h.id, h.t).ok) bad("unverified hadith accepted: " + h.id); });

// 2) النص المشكول المعروض
const ctx = { window: {} }; ctx.window = ctx; vm.createContext(ctx);
for (const f of ["data-tashkeel.js", "data-tashkeel-prose.js"]) vm.runInContext(fs.readFileSync(path.join(JS, f), "utf8"), ctx);
const TK = vm.runInContext("TASHKEEL", ctx);
let voc = 0;
L.QURAN_LIB.forEach(q => { const v = TK.quranFor(q.s, q.a, q.t); if (v) { voc++; if (C.shown(q.t, v) !== v) bad("vowelled verse differs from the verified letters: " + q.id); } });
L.HADITH_LIB.forEach(h => { const v = TK.speech(h.t); if (v) { voc++; if (C.shown(h.t, v) !== v) bad("vowelled hadith differs from the verified letters: " + h.id); } });
if (C.shown("إن الله مع الصابرين", "إِنَّ اللَّهَ مَعَ الشَّاكِرِينَ") !== "إن الله مع الصابرين") bad("a vowelled text with a different word was accepted");

// 3) التركيب على رسائل المقياس
const msgs = [];
for (const f of ["benchmark.tsv", "benchmark-dev.tsv"]) fs.readFileSync(path.join(FIX, f), "utf8").split(/\r?\n/).forEach(l => {
  const c = l.split("\t"); if (c.length === 6 && l[0] !== "#") msgs.push({ text: c[5], flags: c[4] });
});
const count = x => x.ayat.length + x.hadith.length + x.duas.length + (x.sit ? x.sit.quran.length + x.sit.hadith.length : 0);
let cites = 0, composed = 0, crisisN = 0;
for (const m of msgs) {
  const a = L.RAG.analyze(m.text), out = {};
  for (const d of C.DEPTHS) {
    const x = out[d] = C.compose(a, d); composed++;
    if (x.depth !== d) bad("depth not kept: " + d);
    x.dropped.forEach(z => bad("citation dropped (" + z.reason + "): " + z.id + " — " + m.text.slice(0, 40)));
    x.citations.forEach(c => { cites++; if (!c || !c.status) bad("citation without source details — " + m.text.slice(0, 40)); });
    if (x.sit && JSON.stringify(x.sit.limits) !== JSON.stringify(x.sit.s.notToApplyTo || [])) bad("limits of the example cut at depth " + d);
    if (x.sit && d === "deep" && x.sit.s.depth && !x.sit.depth) bad("deep mode lost the Seerah depth: " + x.sit.s.id);
  }
  const [b, s, dp] = C.DEPTHS.map(d => out[d]);
  if (!(count(b) <= count(s) && count(s) <= count(dp))) bad("evidence not graded by depth (" + [b, s, dp].map(count) + "): " + m.text.slice(0, 40));
  if (!(b.others.length <= s.others.length && s.others.length <= dp.others.length)) bad("other situations not graded by depth");
  if (count(s) > 0 && count(b) === 0) bad("brief answer lost all evidence: " + m.text.slice(0, 40));
  if (s.reading.join("") !== String(a.reading || "").split(/\n\n+/).filter(Boolean).join("")) bad("standard reading is not the full reading");
  if (a.understanding.crisis) { crisisN++; if (C.DEPTHS.some(d => out[d].distinctions.length || !out[d].safety)) bad("crisis message: distinctions shown or safety not set — " + m.text.slice(0, 40)); }
}
console.log("validator: " + accepted + "/" + lib.length + " verified quotations accepted, altered/unknown/unverified rejected · vowelled texts " + voc +
  " match their verified letters · composed " + composed + " answers (" + msgs.length + " messages × 3 depths), " + cites + " citations, none dropped · crisis " + crisisN);
if (fail) { console.log(fail + " problem(s)"); process.exit(1); }
console.log("compose tests passed");
