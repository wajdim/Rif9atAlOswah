/* بنية الإجابة: تقديم النصوص، والمحاور والفصول، ووضوح الرسالة
   - التقديم (js/data-attrib.js): متزامن مع build/kb/attrib.js، ولكل حديث ورواية نوع معروف، ولكل نوع نص في الواجهة بكل اللغات
   - المحاور (js/data-facets.js): المجالات والموضوعات والأصول موجودة وموثقة؛ رسائل معروفة تُقسَّم كما يُتوقع، والرسالة ذات المجال الواحد لا تُقسَّم
   - الفصول: لا يسقط استشهاد، ولا يتكرر نص بين الفصول ولا بينها وبين بقية الإجابة، ولكل فصل دليل وخطوات
   - الوضوح: رسالة لا يُفهم منها شيء ← lost (طلب تفاصيل، مع موضوعات مقترحة)، ورسائل الأزمة لا تكون lost أبدًا؛
     واختيار «هل يدور موقفك حول…؟» يظهر في جزء محدود من رسائل المقياس ولا يظهر مع الأزمة
   node build/tests/test-structure.js */
const fs = require("fs"), path = require("path");
const JS = path.join(__dirname, "../../js"), FIX = path.join(__dirname, "fixtures"), I18 = path.join(__dirname, "../i18n");
const L = require("./load.js")(JS), LE = require("./load.js")(JS, "en");
const C = L.COMPOSE, F = L.FACETS;
let fail = 0; const bad = m => { if (fail++ < 30) console.log("  ✗ " + m); };

// 1) التقديم
const A = require("../kb/attrib.js");
const rows = A.rowsOf(), gen = {};
rows.forEach(r => { if (r[1] !== "qala") gen[r[0]] = r[1]; });
if (JSON.stringify(gen) !== JSON.stringify(L.ATTRIB)) bad("js/data-attrib.js is out of date: run node build/kb/attrib.js --write");
const KINDS = new Set(["qala", "qudsi", "report", "dua", "athar", "none"]);
rows.forEach(r => { if (!KINDS.has(r[1])) bad("unknown attribution " + r[1] + " for " + r[0]); });
// «قال رسول الله ﷺ» لا يسبق نصًا يحكي عنه بضمير الغائب في أوله، ولا خلاصة بالمعنى
rows.forEach(r => {
  if (r[1] === "qala" && /^…?\s*(عن |كان (النبي|رسول)|سألت|قالت|جاء رجل|أن رسول الله)/.test(r[2])) bad("narration introduced as a saying: " + r[0]);
  if (/^خلاصة الرواية/.test(r[2]) && r[1] !== "none") bad("summary introduced with wording attribution: " + r[0]);
});
if (C.attrib("quran", "q2-153") !== "quran" || C.attrib("hadith", "h-niyya") !== "qala") bad("COMPOSE.attrib defaults");
const LEADS = ["قال الله تعالى:", "قال رسول الله ﷺ:", "قال رسول الله ﷺ فيما يرويه عن ربه:", "من السنة النبوية:", "من الأدعية النبوية:", "من الآثار والروايات:"];
const app = fs.readFileSync(path.join(JS, "app.js"), "utf8");
LEADS.forEach(k => { if (app.indexOf('"' + k + '"') < 0) bad("lead not used in app.js: " + k); });
for (const l of ["en", "nl", "es", "pt", "fr", "ur", "id", "tr", "de", "ms", "fa", "bn"]) {
  const d = JSON.parse(fs.readFileSync(path.join(I18, "ui-" + l + ".json"), "utf8"));
  LEADS.forEach(k => { if (!d[k]) bad("lead missing in ui-" + l + ".json: " + k); });
}

// 2) بيانات المحاور
for (const [id, d] of Object.entries(F.domains)) {
  if (!L.RAG.byId("theme", d.theme)) bad("facet " + id + ": unknown theme " + d.theme);
  if (!["relation", "setting", "issue"].includes(d.kind)) bad("facet " + id + ": kind " + d.kind);
  if (!d.ar || !d.ar.name || !d.ar.phrase || !d.en || !d.en.name || !d.en.phrase) bad("facet " + id + ": ar/en name and phrase");
}
for (const [t, d] of Object.entries(F.byTheme)) { if (!F.domains[d]) bad("byTheme " + t + " → " + d); if (!L.RAG.byId("theme", t)) bad("byTheme: unknown theme " + t); }
for (const [r, d] of Object.entries(F.byRel)) if (!F.domains[d]) bad("byRel " + r + " → " + d);
for (const [d, ids] of Object.entries(F.lead)) {
  if (!F.domains[d]) bad("lead for unknown facet " + d);
  ids.forEach(id => {
    const k = id[0] === "q" ? "quran" : "hadith", it = L.RAG.byId(k, id);
    if (!it) bad("lead " + d + ": unknown id " + id); else if (!C.validate(k, id, it.t).ok) bad("lead " + d + ": not verified " + id);
  });
}
for (const k of Object.keys(F.pair)) { const [s, d] = k.split("|"); if (!F.domains[s] || F.domains[s].kind !== "setting" || !F.domains[d]) bad("pair key " + k); }
for (const k of Object.keys(F.link)) if (!F.domains[k] && k !== "relations" && k !== "other") bad("link key " + k);

// 3) رسائل معروفة
const CASES = [
  [L, "التعامل مع زوجة والأبناء في الغربة", ["spouse", "children", "ghurba"]],
  [L, "أمي مريضة وأنا مشغول في عملي ولا أجد وقتًا لأولادي", ["parents", "health", "work", "children"]],
  [L, "عندي ديون وزوجتي غاضبة مني", ["money", "spouse"]],
  [LE, "I need help with my wife, my kids and my job abroad", ["spouse", "children", "work", "ghurba"]],
  [L, "زوجي لا يحترمني أمام الناس", []],
  [L, "أشعر بالقلق من المستقبل", []]
];
for (const [X, msg, want] of CASES) {
  const a = X.RAG.analyze(msg), got = (a.understanding.facets || []).map(f => f.id);
  if (JSON.stringify(got) !== JSON.stringify(want)) bad("facets for «" + msg + "»: " + got.join(",") + " (expected " + (want.join(",") || "none") + ")");
  for (const depth of X.COMPOSE.DEPTHS) {
    const c = X.COMPOSE.compose(a, depth), ch = c.chapters;
    if (!want.length){ if (ch) bad("chapters for a single-matter message: " + msg); continue; }
    if (!ch || ch.chapters.length !== want.length) { bad("chapters missing for " + msg + " (" + depth + ")"); continue; }
    if (c.dropped.length) bad("dropped citations in " + msg + " (" + depth + ")");
    if (c.insights.length) bad("theme insights repeated beside chapters: " + msg);
    const seen = new Set();
    ch.chapters.forEach(x => {
      if (!x.ayat.length && !x.hadith.length) bad("chapter without evidence: " + x.id + " in " + msg);
      if (!x.steps.length) bad("chapter without steps: " + x.id);
      if (depth !== "brief" && !x.insight) bad("chapter without insight: " + x.id);
      x.ayat.concat(x.hadith).forEach(it => { if (seen.has(it.id)) bad("evidence repeated across chapters: " + it.id); seen.add(it.id); });
    });
    c.ayat.concat(c.hadith).forEach(x => { if (seen.has(x.item.id)) bad("chapter evidence repeated in the main answer: " + x.item.id); });
    if (!ch.intro || !ch.link) bad("chapter intro or link missing: " + msg);
  }
}
const en = LE.COMPOSE.compose(LE.RAG.analyze("I need help with my wife, my kids and my job abroad"), "standard").chapters;
if (!/four connected matters/.test(en.intro) || /[ء-ي]/.test(en.intro + en.link)) bad("English intro: " + en.intro);

// 4) الوضوح
for (const m of ["مرحبا", "عندي مشكلة", "hello", "سلام عليكم"]) {
  const a = L.RAG.analyze(m); if (C.clarity(a) !== "lost") bad("expected lost: " + m + " → " + C.clarity(a));
}
if (!L.RAG.suggest("عندي مشكلة مع الناس", 6).length) bad("no suggested topics for a vague message");
const rowsOf = f => fs.readFileSync(path.join(FIX, f), "utf8").split(/\r?\n/).filter(l => l.trim() && l[0] !== "#").map(l => l.split("\t"));
let n = 0, amb = 0;
for (const [kind, lang, themes, em, flags, text] of rowsOf("benchmark.tsv")) {
  const X = lang === "en" ? LE : L;
  if (lang !== "ar" && lang !== "en") continue;
  const a = X.RAG.analyze(text), cl = X.COMPOSE.clarity(a); n++;
  if (/crisis/.test(flags || "") && (cl === "lost" || X.COMPOSE.ambiguous(a).length)) bad("crisis message got " + cl + ": " + text.slice(0, 50));
  if (themes && themes !== "-" && cl === "lost") bad("understood message marked lost: " + text.slice(0, 50));
  if (cl === "ambiguous") amb++;
}
if (amb / n > 0.25) bad("«did you mean» shown too often: " + Math.round(100 * amb / n) + "%");

if (fail) { console.log(fail + " problem(s)"); process.exit(1); }
console.log("attribution: " + rows.length + " texts (" + Object.keys(gen).length + " not «qala») · facets: " + Object.keys(F.domains).length + " domains · " +
  "did-you-mean on " + Math.round(100 * amb / n) + "% of " + n + " benchmark messages · structure tests passed");
