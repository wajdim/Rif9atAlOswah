/* Tunes the fusion/rerank parameters (RAG.TUNE in js/rag.js) by coordinate descent.
   Objective: top-1 on the development set (fixtures/benchmark-dev.tsv), with the main set (benchmark.tsv) not allowed
   to lose more than one message. The held-out set is never read here.
   node build/tests/tune.js            → prints the best parameters (copy them into TUNE in js/rag.js) */
const fs = require("fs"), path = require("path"), vm = require("vm");
const JS = path.join(__dirname, "../../js"), FIX = path.join(__dirname, "fixtures");
// one engine per interface language, exactly as bench.js does
const cache = {};
function load(lang) {
  if (cache[lang]) return cache[lang];
  const ctx = { console, localStorage: { getItem: () => JSON.stringify({ lang }) }, document: {}, navigator: {} }; ctx.window = ctx; vm.createContext(ctx);
  const files = ["data-situations.js", "data-situations-2.js", "data-situations-3.js", "data-situations-4.js", "data-quran.js", "data-quran-kb.js", "data-hadith.js", "data-hadith-kb.js", "data-themes.js", "data-seerah-kb.js", "data-evidence.js", "data-life.js", "data-taxonomy.js", "data-reading.js",
    lang === "ar" ? "data-en.js" : "data-" + lang + ".js", "i18n.js", "rag.js", "data-nlu.js", "data-distinctions.js", "data-facets.js", "data-attrib.js", "nlu.js", "reading.js"];
  for (const f of files) if (fs.existsSync(path.join(JS, f))) vm.runInContext(fs.readFileSync(path.join(JS, f), "utf8"), ctx, { filename: f });
  return cache[lang] = vm.runInContext("RAG", ctx);
}
function rows(file) {
  return fs.readFileSync(path.join(FIX, file), "utf8").split(/\r?\n/).filter(l => l && !l.startsWith("#")).map(l => l.split("\t"))
    .filter(c => c.length === 6 && !/crisis|vague/.test(c[4]) && c[2] !== "-")
    .map(c => ({ lang: c[1], accept: new Set(c[2].split(",").map(s => s.trim())), text: c[5] }));
}
const DEV = rows("benchmark-dev.tsv"), MAIN = rows("benchmark.tsv");
function top1(set) { let ok = 0; for (const r of set) { const t = load(r.lang).understand(r.text).themes[0]; if (t && r.accept.has(t.id)) ok++; } return ok; }
DEV.concat(MAIN).forEach(r => load(r.lang));
const ENGINES = () => Object.values(cache);
const GRID = {
  lifeMin: [0.3, 0.35, 0.4, 0.45, 0.5],
  ctxPenalty: [1, 0.9, 0.8, 0.7, 0.6, 0.5],
  genPenalty: [1, 0.9, 0.8, 0.7, 0.6],
  issueRatio: [0.35, 0.5, 0.6, 0.75, 0.9],
  phraseW: [0.5, 0.75, 1, 1.25, 1.5],
  lifeW: [1.5, 2, 2.5, 3],
  lifeCap: [1.0, 1.4, 1.8, 2.2],
  conceptW: [1.8, 2.2, 2.6],
  semScale: [0.12, 0.18, 0.24]
};
const T = Object.assign({}, ENGINES()[0].TUNE);
const apply = () => ENGINES().forEach(R => Object.assign(R.TUNE, T));
const mainBase = top1(MAIN);
let best = { dev: top1(DEV), main: mainBase };
console.log("start  dev " + best.dev + "/" + DEV.length + "  main " + best.main + "/" + MAIN.length, JSON.stringify(T));
for (let pass = 0; pass < (+process.env.PASSES || 2); pass++) {
  for (const k of Object.keys(GRID)) {
    let keep = T[k];
    for (const v of GRID[k]) {
      if (v === keep) continue;
      T[k] = v; apply();
      const d = top1(DEV); if (d < best.dev) continue;
      const m = top1(MAIN);
      if (m < mainBase - 1) continue;
      if (d > best.dev || (d === best.dev && m > best.main)) { best = { dev: d, main: m }; keep = v; console.log("  " + k + "=" + v + "  dev " + d + "  main " + m); }
    }
    T[k] = keep; apply();
  }
}
console.log("best   dev " + best.dev + "/" + DEV.length + "  main " + best.main + "/" + MAIN.length);
console.log(JSON.stringify(T));
