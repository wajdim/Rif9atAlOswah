/* Engine performance on this machine (Node, same code as the app):
   - script evaluation time per data file, engine index build (first call), memory
   - analyze() latency over the benchmark messages: median / p95 / max, at each answer depth
   node build/tests/perf.js [--budget]   (--budget fails if a budget below is exceeded) */
const fs = require("fs"), path = require("path"), vm = require("vm");
const JS = path.join(__dirname, "../../js"), FIX = path.join(__dirname, "fixtures");
const BUDGET = { buildMs: 1500, medianMs: 40, p95Ms: 120 };
const FILES = ["data-situations.js", "data-situations-2.js", "data-situations-3.js", "data-situations-4.js", "data-quran.js", "data-quran-kb.js", "data-hadith.js", "data-hadith-kb.js",
  "data-themes.js", "data-seerah-kb.js", "data-evidence.js", "data-life.js", "data-taxonomy.js", "data-reading.js", "data-en.js", "i18n.js", "rag.js", "data-nlu.js",
  "data-distinctions.js", "data-facets.js", "data-attrib.js", "nlu.js", "reading.js", "compose.js"];
const now = () => Number(process.hrtime.bigint()) / 1e6;
const ctx = { console, localStorage: { getItem: () => JSON.stringify({ lang: "ar" }) }, document: {}, navigator: {} }; ctx.window = ctx; vm.createContext(ctx);
let evalMs = 0; const slow = [];
for (const f of FILES) {
  const src = fs.readFileSync(path.join(JS, f), "utf8"), t = now();
  vm.runInContext(src, ctx, { filename: f });
  const d = now() - t; evalMs += d; slow.push([f, d, src.length]);
}
const R = vm.runInContext("RAG", ctx), C = vm.runInContext("COMPOSE", ctx);
const msgs = [];
for (const f of ["benchmark.tsv", "benchmark-dev.tsv"]) fs.readFileSync(path.join(FIX, f), "utf8").split(/\r?\n/).forEach(l => { const c = l.split("\t"); if (c.length === 6 && l[0] !== "#") msgs.push(c[5]); });
let t = now(); R.analyze(msgs[0]); const buildMs = now() - t;
const times = [], composeT = [];
for (const m of msgs) {
  t = now(); const a = R.analyze(m); times.push(now() - t);
  t = now(); C.DEPTHS.forEach(d => C.compose(a, d)); composeT.push((now() - t) / 3);
}
const q = (arr, p) => { const s = arr.slice().sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const f1 = x => x.toFixed(1);
slow.sort((a, b) => b[1] - a[1]);
console.log("script evaluation " + f1(evalMs) + " ms (slowest: " + slow.slice(0, 3).map(x => x[0] + " " + f1(x[1])).join(", ") + ")");
console.log("first analyze (builds the indexes) " + f1(buildMs) + " ms · heap " + Math.round(process.memoryUsage().heapUsed / 1048576) + " MB");
console.log("analyze over " + msgs.length + " messages: median " + f1(q(times, 0.5)) + " ms · p95 " + f1(q(times, 0.95)) + " ms · max " + f1(Math.max(...times)) + " ms");
console.log("compose (per depth): median " + f1(q(composeT, 0.5)) + " ms · p95 " + f1(q(composeT, 0.95)) + " ms");
if (process.argv.includes("--budget")) {
  const over = [];
  if (buildMs > BUDGET.buildMs) over.push("build " + f1(buildMs) + " > " + BUDGET.buildMs);
  if (q(times, 0.5) > BUDGET.medianMs) over.push("median " + f1(q(times, 0.5)) + " > " + BUDGET.medianMs);
  if (q(times, 0.95) > BUDGET.p95Ms) over.push("p95 " + f1(q(times, 0.95)) + " > " + BUDGET.p95Ms);
  if (over.length) { console.log("✗ over budget: " + over.join(", ")); process.exit(1); }
  console.log("✓ within budget");
}
