/* رِفقة الأُسوة — benchmark of natural user messages (fixtures/benchmark.tsv)
   Measures, per dimension and per kind/language:
     top1      the first detected theme is one of the acceptable themes
     top3      an acceptable theme is among the first three
     none      no theme at all (lower is better)
     emotion   expected emotions detected (recall)
     crisis    crisis messages detected (recall) · falseCrisis on "safe" rows (lower is better)
     soft      hopelessness rows flagged as soft risk or crisis
     vague     vague rows answered with an acceptable theme or with ≥2 offered interpretations
     evidence  top-3 verses/hadith share a theme with the acceptable set (retrieval relevance proxy)
     citations every retrieved verse/hadith resolves to a library record with a source and grade
   Usage: node build/tests/bench.js [-v] [--kind K] [--save] [--gate]
     --save  write the current scores to fixtures/bench-baseline.json
     --gate  exit 1 if any score drops more than TOLERANCE below the baseline, or crisis recall < 100% */
const fs = require("fs"), vm = require("vm"), path = require("path");
const JS = path.join(__dirname, "..", "..", "js"), FIX = path.join(__dirname, "fixtures");
const args = process.argv.slice(2), VERBOSE = args.includes("-v"), ONLY = args.includes("--kind") ? args[args.indexOf("--kind") + 1] : null;
const TOLERANCE = 0.01;

const rows = fs.readFileSync(path.join(FIX, "benchmark.tsv"), "utf8").split(/\r?\n/)
  .filter(l => l.trim() && !l.startsWith("#"))
  .map((l, i) => {
    const [kind, lang, themes, emotions, flags, text] = l.split("\t");
    if (!text) throw new Error("benchmark.tsv: malformed row " + (i + 1) + ": " + l);
    const list = s => s === "-" ? [] : s.split(",").map(x => x.trim()).filter(Boolean);
    return { kind, lang, themes: list(themes), emotions: list(emotions), flags: new Set(list(flags)), text };
  })
  .filter(r => !ONLY || r.kind === ONLY);

const cache = {};
function load(lang) {
  if (cache[lang]) return cache[lang];
  const ctx = { console, localStorage: { getItem: () => JSON.stringify({ lang }) }, document: {}, navigator: {} }; ctx.window = ctx; vm.createContext(ctx);
  const files = ["data-situations.js", "data-situations-2.js", "data-situations-3.js", "data-situations-4.js", "data-quran.js", "data-hadith.js", "data-themes.js", "data-life.js", "data-reading.js",
    lang === "ar" ? "data-en.js" : "data-" + lang + ".js", "i18n.js", "rag.js", "reading.js"];
  for (const f of files) if (fs.existsSync(path.join(JS, f))) vm.runInContext(fs.readFileSync(path.join(JS, f), "utf8"), ctx, { filename: f });
  return cache[lang] = vm.runInContext("({RAG,QURAN_LIB,HADITH_LIB})", ctx);
}

const M = {}, byKind = {}, byLang = {}, fails = [];
function tally(bucket, key, ok) { const b = bucket[key] = bucket[key] || { n: 0, ok: 0 }; b.n++; if (ok) b.ok++; }
function score(key, ok, kind, lang) {
  tally(M, key, ok);
  (byKind[kind] = byKind[kind] || {}); tally(byKind[kind], key, ok);
  (byLang[lang] = byLang[lang] || {}); tally(byLang[lang], key, ok);
}

const t0 = Date.now();
for (const r of rows) {
  const G = load(r.lang), a = G.RAG.analyze(r.text), u = a.understanding;
  const ids = u.themes.map(t => t.id), accept = new Set(r.themes);
  const top1 = !!ids[0] && accept.has(ids[0]), top3 = ids.slice(0, 3).some(id => accept.has(id));
  const interp = (a.interpretations || u.interpretations || []).length;
  const why = [];
  if (r.flags.has("crisis")) { score("crisis", u.crisis, r.kind, r.lang); if (!u.crisis) why.push("crisis missed"); }
  else if (r.flags.has("soft")) { const ok = u.crisis || !!u.softRisk; score("soft", ok, r.kind, r.lang); if (!ok) why.push("soft risk missed"); }
  if (r.flags.has("safe")) { score("falseCrisis", u.crisis, r.kind, r.lang); if (u.crisis) why.push("false crisis"); }
  if (!r.flags.has("crisis")) {
    if (r.flags.has("vague")) { const ok = top1 || interp >= 2; score("vague", ok, r.kind, r.lang); if (!ok) why.push("vague unanswered"); }
    else { score("top1", top1, r.kind, r.lang); score("top3", top3, r.kind, r.lang); if (!top1) why.push("top1"); }
    score("none", !ids.length, r.kind, r.lang);
  }
  if (r.emotions.length) {
    const got = new Set(u.emotions.map(e => e.id)), ok = r.emotions.every(e => got.has(e));
    score("emotion", ok, r.kind, r.lang); if (!ok) why.push("emotion");
  }
  const ev = [].concat(a.retrieval.ayat.slice(0, 3), a.retrieval.hadith.slice(0, 3));
  if (ev.length && !r.flags.has("crisis")) score("evidence", ev.some(e => e.item.th.some(t => accept.has(t))), r.kind, r.lang);
  const libQ = new Set(G.QURAN_LIB.map(q => q.id)), libH = new Map(G.HADITH_LIB.map(h => [h.id, h]));
  const allEv = [].concat(a.retrieval.ayat, a.retrieval.hadith, a.retrieval.duas);
  score("citations", allEv.every(e => { const it = e.item; return libQ.has(it.id) || (libH.has(it.id) && it.src && it.g); }), r.kind, r.lang);
  if (why.length) fails.push("  ✗ [" + r.kind + "/" + r.lang + "] " + r.text + "  →  " + (ids.slice(0, 3).join(", ") || "—") +
    "  | emo " + (u.emotions.map(e => e.id).join(",") || "—") + "  (" + why.join("; ") + ", expected " + (r.themes.join("/") || "—") + ")");
}
const ms = Date.now() - t0;

const pct = b => b ? b.ok / b.n : null, fmt = b => b ? (100 * b.ok / b.n).toFixed(1) + "% (" + b.ok + "/" + b.n + ")" : "—";
const KEYS = ["top1", "top3", "none", "emotion", "crisis", "soft", "falseCrisis", "vague", "evidence", "citations"];
const LOWER_BETTER = new Set(["none", "falseCrisis"]);
console.log("benchmark: " + rows.length + " messages · " + ms + " ms (" + (ms / rows.length).toFixed(1) + " ms/msg)\n");
KEYS.forEach(k => console.log("  " + k.padEnd(12) + fmt(M[k]) + (LOWER_BETTER.has(k) ? "  (lower is better)" : "")));
const table = (title, B) => {
  console.log("\n" + title);
  console.log("  " + "".padEnd(14) + ["top1", "top3", "none", "emotion", "vague", "crisis", "soft"].map(k => k.padStart(8)).join(""));
  Object.keys(B).sort().forEach(k => console.log("  " + k.padEnd(14) + ["top1", "top3", "none", "emotion", "vague", "crisis", "soft"]
    .map(m => (B[k][m] ? Math.round(100 * pct(B[k][m])) + "%" : "·").padStart(8)).join("")));
};
table("by kind", byKind); table("by language", byLang);
if (VERBOSE && fails.length) console.log("\nfailures (" + fails.length + "):\n" + fails.join("\n"));

const scores = {}; KEYS.forEach(k => { if (M[k]) scores[k] = +pct(M[k]).toFixed(4); });
const BASE = path.join(FIX, "bench-baseline.json");
if (args.includes("--save") && !ONLY) { fs.writeFileSync(BASE, JSON.stringify({ date: new Date().toISOString().slice(0, 10), messages: rows.length, scores }, null, 1) + "\n"); console.log("\nbaseline saved → " + path.relative(process.cwd(), BASE)); }
if (args.includes("--gate")) {
  const base = fs.existsSync(BASE) ? JSON.parse(fs.readFileSync(BASE, "utf8")).scores : {}, bad = [];
  KEYS.forEach(k => {
    if (scores[k] == null || base[k] == null) return;
    const worse = LOWER_BETTER.has(k) ? scores[k] - base[k] : base[k] - scores[k];
    if (worse > TOLERANCE) bad.push(k + " " + (100 * base[k]).toFixed(1) + "% → " + (100 * scores[k]).toFixed(1) + "%");
  });
  if (scores.crisis != null && scores.crisis < 1) bad.push("crisis recall below 100%");
  if (scores.falseCrisis) bad.push("false crisis on safe messages");
  if (scores.citations != null && scores.citations < 1) bad.push("unresolvable citation");
  if (bad.length) { console.log("\n✗ gate failed:\n  " + bad.join("\n  ")); process.exit(1); }
  console.log("\n✓ gate passed");
}
