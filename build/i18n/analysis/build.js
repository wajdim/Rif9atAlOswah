/* رِفقة الأُسوة — يدمج ترجمات «التحليل الأعمق» في نصوص الواجهة لكل اللغات، وألفاظ الأنماط في lexicon.analysis
   الاستخدام: node build/i18n/analysis/build.js   (ثم أعد بناء ملفات اللغات بـ build-en.js) */
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const H = __dirname, I18N = path.join(H, ".."), keys = require("./keys.js")();
const LANGS = ["en", "fr", "nl", "es", "pt", "ur", "id", "tr", "de", "ms", "fa", "bn"], CUE_GROUPS = ["absolute", "absoluteSoft", "label", "catastrophe", "mindread", "should", "compare", "selfblame", "faith", "effort", "patience", "sleep", "body"];
const out = {}, bad = [];
for (const l of LANGS) {
  const d = JSON.parse(fs.readFileSync(path.join(H, l + ".json"), "utf8"));
  for (const id in keys) {
    const v = d[id];
    if (!v || typeof v !== "string") { bad.push(l + ": missing " + id); continue; }
    (out[keys[id]] = out[keys[id]] || {})[l] = v;
  }
  for (const id in d) if (id !== "cues" && !(id in keys)) bad.push(l + ": unknown key " + id);
  for (const g of CUE_GROUPS) if (!((d.cues || {})[g] || []).length) bad.push(l + ": cues." + g + " empty");
  const lex = path.join(I18N, l === "en" ? "content" : path.join(l, "content"), "lexicon.json");
  const L = JSON.parse(fs.readFileSync(lex, "utf8"));
  L.lexicon.analysis = {}; for (const g of CUE_GROUPS) L.lexicon.analysis[g] = d.cues[g];
  fs.writeFileSync(lex, JSON.stringify(L, null, 1) + "\n");
}
if (bad.length) { console.log(bad.join("\n")); process.exit(1); }
const tmp = path.join(I18N, "ui-new-analysis.json");
fs.writeFileSync(tmp, JSON.stringify(out, null, 1) + "\n");
console.log(execFileSync("python", [path.join(I18N, "add-ui.py"), tmp], { encoding: "utf8" }).trim());
