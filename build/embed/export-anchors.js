/* Exports what the semantic layer embeds: theme labels/triggers (Arabic + every UI language),
   the 500 life situations, and the hand-written exemplars. Output: build/embed/anchors.json
   Usage: node build/embed/export-anchors.js */
const fs = require("fs"), vm = require("vm"), path = require("path");
const JS = path.join(__dirname, "..", "..", "js");
function load(lang) {
  const ctx = { console, localStorage: { getItem: () => JSON.stringify({ lang }) }, document: {}, navigator: {} }; ctx.window = ctx; vm.createContext(ctx);
  for (const f of ["data-situations.js", "data-situations-2.js", "data-situations-3.js", "data-situations-4.js", "data-quran.js", "data-hadith.js", "data-themes.js", "data-life.js", "data-taxonomy.js",
    lang === "ar" ? null : "data-" + lang + ".js", "i18n.js"].filter(Boolean)) vm.runInContext(fs.readFileSync(path.join(JS, f), "utf8"), ctx, { filename: f });
  return vm.runInContext("({THEMES,LIFE})", ctx);
}
const AR = load("ar"), out = { themes: {}, life: AR.LIFE.map(x => ({ n: x.n, t: x.t, th: x.th })) };
AR.THEMES.forEach(t => out.themes[t.id] = { ar: { label: t.label, triggers: t.triggers } });
for (const l of ["en", "fr", "nl", "es", "pt", "ur", "id", "tr", "de", "ms", "fa", "bn"]) {
  const G = load(l);
  G.THEMES.forEach(t => { out.themes[t.id][l] = { label: t.label, triggers: t.triggers.filter(x => !/[ء-ي]/.test(x) || l === "ur" || l === "fa") }; });
}
const ex = path.join(__dirname, "exemplars.json");
out.exemplars = fs.existsSync(ex) ? JSON.parse(fs.readFileSync(ex, "utf8")) : {};
fs.writeFileSync(path.join(__dirname, "anchors.json"), JSON.stringify(out));
console.log("themes", Object.keys(out.themes).length, "life", out.life.length, "exemplars", Object.keys(out.exemplars).length);
