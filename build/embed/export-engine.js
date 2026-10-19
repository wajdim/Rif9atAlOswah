/* Dumps the lexical engine's theme scores and NLU-prepared text for every benchmark row,
   so fusion weights can be tuned (on the main set) and checked (on the held-out set).
   Usage: node build/embed/export-engine.js → build/embed/engine-scores.json */
const fs = require("fs"), vm = require("vm"), path = require("path");
const JS = path.join(__dirname, "..", "..", "js"), FIX = path.join(__dirname, "..", "tests", "fixtures");
const cache = {};
function load(lang) {
  if (cache[lang]) return cache[lang];
  const ctx = { console, localStorage: { getItem: () => JSON.stringify({ lang }) }, document: {}, navigator: {} }; ctx.window = ctx; vm.createContext(ctx);
  for (const f of ["data-situations.js", "data-situations-2.js", "data-situations-3.js", "data-situations-4.js", "data-quran.js", "data-quran-kb.js", "data-hadith.js", "data-hadith-kb.js", "data-themes.js", "data-seerah-kb.js", "data-evidence.js", "data-life.js", "data-taxonomy.js", "data-reading.js",
    lang === "ar" ? "data-en.js" : "data-" + lang + ".js", "i18n.js", "rag.js", "data-nlu.js", "nlu.js", "reading.js"]) vm.runInContext(fs.readFileSync(path.join(JS, f), "utf8"), ctx, { filename: f });
  return cache[lang] = vm.runInContext("RAG", ctx);
}
const out = {};
for (const set of ["benchmark.tsv", "benchmark-holdout.tsv"]) {
  out[set] = fs.readFileSync(path.join(FIX, set), "utf8").split(/\r?\n/).filter(l => l.trim() && !l.startsWith("#")).map(l => {
    const [kind, lang, themes, emotions, flags, text] = l.split("\t"), u = load(lang).understand(text);
    return { kind, lang, accept: themes.split(","), flags, text, prepared: u.raw, crisis: u.crisis,
             themes: u.themes.filter(t => !t.vague).map(t => [t.id, +t.score.toFixed(3)]) };
  });
}
fs.writeFileSync(path.join(__dirname, "engine-scores.json"), JSON.stringify(out));
console.log(Object.keys(out).map(k => k + ": " + out[k].length).join(", "));
