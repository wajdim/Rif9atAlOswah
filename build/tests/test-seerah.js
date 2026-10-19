/* Seerah layer (js/data-seerah-kb.js, built by build/kb/build-seerah.py):
   every event with depth is complete in Arabic and English, new events are linked to themes and reachable.
   node build/tests/test-seerah.js */
const path = require("path");
const JS = process.env.BENCH_JS || path.join(__dirname, "../../js");
let fail = 0; const bad = (m) => { fail++; console.log("FAIL " + m); };
const AR = require("./load.js")(JS, "ar"), EN = require("./load.js")(JS, "en");
const AREAS = ["self", "family", "work", "community"];
function complete(s, lang) {
  const d = s.depth;
  if (!d) return bad(lang + " " + s.id + ": no depth");
  if (["mecca", "hijra", "medina"].indexOf(d.era) < 0 || typeof d.order !== "number" || !d.when) bad(lang + " " + s.id + ": era/order/when");
  ["challenges", "alternatives", "notDone"].forEach(k => { if (!(d[k] || []).length) bad(lang + " " + s.id + ": depth." + k); });
  if (!d.chose) bad(lang + " " + s.id + ": depth.chose");
  AREAS.forEach(k => { if (!(d.lessons || {})[k]) bad(lang + " " + s.id + ": lesson " + k); });
  const txt = JSON.stringify(d);
  if (lang === "en" && /[؀-ۿ]/.test(txt.replace(/ﷺ/g, ""))) bad("en " + s.id + ": Arabic left in the English depth");
}
const evAr = AR.SITUATIONS.filter(s => s.depth), evEn = EN.SITUATIONS.filter(s => s.depth);
if (evAr.length < 30) bad("expected at least 30 events with depth, got " + evAr.length);
evAr.forEach(s => complete(s, "ar")); evEn.forEach(s => complete(s, "en"));
const orders = evAr.map(s => s.depth.order); if (new Set(orders).size !== orders.length) bad("duplicate timeline order");
// new events: linked to themes, verified evidence, and found by the engine from their own user phrasing
AR.SITUATIONS.filter(s => s.kb).forEach(s => {
  if (!AR.THEMES.some(t => t.sits.indexOf(s.id) > -1)) bad(s.id + ": not linked to any theme");
  (s.hadithRefs || []).forEach((h, i) => { if (h.ver !== "source") bad(s.id + "#" + i + ": evidence status " + h.ver); });
  const a = AR.RAG.analyze(s.keywords[0]);
  if (!a.retrieval.sits.slice(0, 5).some(x => x.s.id === s.id)) bad(s.id + ": not in the top 5 for «" + s.keywords[0] + "»");
});
console.log("seerah: " + evAr.length + " events with depth (" + AR.SITUATIONS.filter(s => s.kb).length + " new) · " + (fail ? fail + " failure(s)" : "seerah tests passed"));
process.exit(fail ? 1 : 0);
