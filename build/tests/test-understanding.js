/* رِفقة الأُسوة — اختبار جودة الفهم وسلامته (يفشل برمز خروج 1 عند التراجع)
   1) سلامة البيانات: معرّفات الموضوعات في المواقف الحياتية ووسوم الآيات والأحاديث ومواقف الموضوعات موجودة.
   2) الأزمات: كل رسالة في fixtures.crisis تُكتشف أزمةً، ولا تُكتشف الرسائل العادية أزمةً (بكل اللغات).
   3) الفهم: الموضوع الأول المكتشف من الموضوعات المقبولة لنسبة لا تقل عن MIN_TOP1، وقلّما تبقى رسالة بلا موضوع.
   5) القراءة الأولية العميقة: البنية والجنس والخيار والخوف المتوقعة، بلا أسئلة، ومترجمة، ولا تُكتب عند الأزمة.
   4) التحليل الأعمق: أنماط التفكير المتوقعة تُكتشف بدليلها، والأزمة لا تُحلَّل، ولا يبقى نص عربي في لغة أخرى.
   الاستخدام: node build/tests/test-understanding.js [-v] */
const fs = require("fs"), vm = require("vm"), path = require("path");
const JS = path.join(__dirname, "..", "..", "js"), VERBOSE = process.argv.includes("-v");
const MIN_TOP1 = 0.85, MAX_NONE = 0.05;
const F = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", "understanding.json"), "utf8"));
const cache = {};
function load(lang) {
  if (cache[lang]) return cache[lang];
  const ctx = { console, localStorage: { getItem: () => JSON.stringify({ lang }) }, document: {}, navigator: {} }; ctx.window = ctx; vm.createContext(ctx);
  for (const f of ["data-situations.js", "data-situations-2.js", "data-situations-3.js", "data-situations-4.js", "data-quran.js", "data-hadith.js", "data-themes.js", "data-life.js", "data-reading.js",
                   lang === "ar" ? "data-en.js" : "data-" + lang + ".js", "i18n.js", "rag.js", "reading.js"])
    vm.runInContext(fs.readFileSync(path.join(JS, f), "utf8"), ctx, { filename: f });
  return cache[lang] = vm.runInContext("({SITUATIONS,THEMES,QURAN_LIB,HADITH_LIB,LIFE,RAG})", ctx);
}
const fail = [];
// 1) سلامة البيانات
const G = load("ar"), themeIds = new Set(G.THEMES.map(t => t.id)), sitIds = new Set(G.SITUATIONS.map(s => s.id));
G.LIFE.forEach(x => x.th.forEach(id => { if (!themeIds.has(id)) fail.push("life " + x.n + ": unknown theme " + id); }));
if (G.LIFE.length !== 500 || new Set(G.LIFE.map(x => x.n)).size !== 500) fail.push("life: expected 500 unique situations");
G.QURAN_LIB.concat(G.HADITH_LIB).forEach(x => x.th.forEach(id => { if (!themeIds.has(id) && id !== "guilt" && id !== "orphan") fail.push(x.id + ": unknown theme tag " + id); }));
G.THEMES.forEach(t => t.sits.forEach(id => { if (!sitIds.has(id)) fail.push("theme " + t.id + ": unknown situation " + id); }));
// 2) الأزمات
F.crisis.forEach(c => { if (!load(c.lang).RAG.understand(c.text).crisis) fail.push("crisis missed [" + c.lang + "] " + c.text); });
F.notCrisis.forEach(c => { if (load(c.lang).RAG.understand(c.text).crisis) fail.push("false crisis [" + c.lang + "] " + c.text); });
// 3) الفهم
let top1 = 0, none = 0;
F.cases.forEach(c => {
  const ids = load(c.lang).RAG.understand(c.text).themes.map(t => t.id), ok = ids[0] && c.expect.includes(ids[0]);
  if (ok) top1++; if (!ids.length) none++;
  if (VERBOSE && !ok) console.log("  ✗ [" + c.lang + "] " + c.text + "  →  " + (ids.join(", ") || "—") + "  (expected " + c.expect.join("/") + ")");
});
// 4) التحليل الأعمق: الأنماط المتوقعة تُكتشف بدليلها، والأزمة لا تُحلَّل أنماطها، ولا نص عربي في واجهة لغة أخرى
let deepOk = 0;
(F.analysis || []).forEach(c => {
  const S = load(c.lang).RAG.analyze(c.text).analysis, got = (S.patterns || []).map(p => p.id);
  const ok = c.patterns.every(id => got.includes(id)) && (c.notPatterns || []).every(id => !got.includes(id)) && (S.patterns || []).every(p => p.ev.length);
  if (ok) deepOk++; else fail.push("analysis [" + c.lang + "] " + c.text + " → " + (got.join(",") || "—") + " (expected " + c.patterns.join(",") + ")");
});
F.crisis.forEach(c => { const S = load(c.lang).RAG.analyze(c.text).analysis; if ((S.patterns || []).length || S.core) fail.push("analysis on crisis [" + c.lang + "] " + c.text); });
F.cases.forEach(c => {
  const S = load(c.lang).RAG.analyze(c.text).analysis;
  if (!S || !S.control || !S.priority || !(S.strengths || []).length) fail.push("analysis incomplete [" + c.lang + "] " + c.text);
  else if (c.lang !== "ar" && c.lang !== "ur" && c.lang !== "fa" && /[ء-ي]/.test(JSON.stringify(S))) fail.push("untranslated analysis [" + c.lang + "] " + c.text);
});
// 5) القراءة الأولية العميقة: البنية والجنس والخيار والخوف المتوقعة، ولا أسئلة، ولا قراءة عميقة عند الأزمة
let readOk = 0;
const words = t => t.split(/\s+/).filter(Boolean).length;
(F.reading || []).forEach(c => {
  const a = load(c.lang).RAG.analyze(c.text), i = a.readingInfo, bad = [];
  if (!i) bad.push("no deep reading");
  else {
    if (c.kind && i.kind !== c.kind) bad.push("kind " + i.kind);
    if (c.notKind && i.kind === c.notKind) bad.push("kind " + i.kind);
    if ("gender" in c && i.gender !== c.gender) bad.push("gender " + i.gender);
    if (c.option && i.option !== c.option) bad.push("option " + i.option);
    if ("fear" in c && i.fear !== c.fear) bad.push("fear " + i.fear);
    if (c.minWords && words(a.reading) < c.minWords) bad.push(words(a.reading) + " words");
  }
  if (bad.length) fail.push("reading [" + c.lang + "] " + c.text.slice(0, 40) + "… → " + bad.join(", ")); else readOk++;
});
F.cases.forEach(c => {
  const a = load(c.lang).RAG.analyze(c.text); if (!a.readingInfo) return;
  const ps = a.reading.split(/\n\n+/), body = ps.slice(0, -1).join(" ");
  if (/[؟?]/.test(body.replace(/«[^»]*»|“[^”]*”/g, ""))) fail.push("question in reading [" + c.lang + "] " + c.text);
  if (ps.length < 3 || ps.length > 8) fail.push("reading paragraphs " + ps.length + " [" + c.lang + "] " + c.text);
  if (c.lang !== "ar" && c.lang !== "ur" && c.lang !== "fa" && /[ء-ي]/.test(body)) fail.push("untranslated reading [" + c.lang + "] " + c.text);
});
F.crisis.forEach(c => { if (load(c.lang).RAG.analyze(c.text).readingInfo) fail.push("deep reading on crisis [" + c.lang + "] " + c.text); });
// 6) الموضوع الذي يختاره المستخدم: يتقدّم في الفهم، ولا يُقدَّم على الأزمة أبدًا، ولا يرفع المطابقة إلى «قوية»
F.cases.slice(0, 12).forEach(c => {
  const a = load(c.lang).RAG.analyze(c.text, { focus: "patience" }), u = a.understanding;
  if (!u.crisis && (u.themes[0] || {}).id !== "patience") fail.push("focus ignored [" + c.lang + "] " + c.text);
  if (a.confidence === "high") fail.push("focus raised confidence [" + c.lang + "] " + c.text);
});
F.crisis.forEach(c => { const u = load(c.lang).RAG.analyze(c.text, { focus: "marriage" }).understanding; if (u.focus || (u.themes[0] || {}).id === "marriage") fail.push("focus overrode crisis [" + c.lang + "] " + c.text); });
// رسالة عامة بلا موضوع: لا تُفهم موضوعًا بعينه («hello» ليست «hell»)
if (load("en").RAG.understand("Hello, I want to talk about something that happened today").themes.length) fail.push("greeting detected as a topic [en]");
const n = F.cases.length, r1 = top1 / n, rn = none / n;
console.log("data: life " + G.LIFE.length + " · themes " + G.THEMES.length + " | crisis " + F.crisis.length + "+" + F.notCrisis.length +
  " | understanding: top-1 " + top1 + "/" + n + " (" + Math.round(r1 * 100) + "%) · no topic " + none + " | analysis " + deepOk + "/" + (F.analysis || []).length + " | reading " + readOk + "/" + (F.reading || []).length);
if (r1 < MIN_TOP1) fail.push("top-1 accuracy " + Math.round(r1 * 100) + "% < " + MIN_TOP1 * 100 + "%");
if (rn > MAX_NONE) fail.push("messages without a topic " + Math.round(rn * 100) + "% > " + MAX_NONE * 100 + "%");
if (fail.length) { console.log("✗ " + fail.length + " problem(s):\n" + fail.slice(0, 30).map(x => "  - " + x).join("\n")); process.exit(1); }
console.log("✓ all checks passed");
