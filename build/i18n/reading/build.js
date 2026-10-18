/* رِفقة الأُسوة — يدمج ترجمات «القراءة الأولية» العميقة في نصوص الواجهة لكل اللغات، وألفاظ العوامل والخيارات في lexicon.reading
   الاستخدام: node build/i18n/reading/build.js   (ثم أعد بناء ملفات اللغات بـ build-en.js) */
const fs = require("fs"), path = require("path"), vm = require("vm"), { execFileSync } = require("child_process");
const H = __dirname, I18N = path.join(H, ".."), ROOT = path.join(I18N, "..", ".."), keys = require("./keys.js")();
const c = { window: {} }; c.window = c; vm.createContext(c);
vm.runInContext(fs.readFileSync(path.join(ROOT, "js", "data-reading.js"), "utf8"), c);
const FACTORS = c.READING_FACTORS.map(f => f.id), OPTIONS = c.READING_OPTIONS.map(o => o.id);
const LANGS = ["en", "fr", "nl", "es", "pt", "ur", "id", "tr", "de", "ms", "fa", "bn"], out = {}, bad = [];
for (const l of LANGS) {
  const d = JSON.parse(fs.readFileSync(path.join(H, l + ".json"), "utf8"));
  for (const id in keys) {
    const v = d[id];
    if (!v || typeof v !== "string") { bad.push(l + ": missing " + id); continue; }
    const ph = s => (s.match(/\{\d\}/g) || []).sort().join();
    if (ph(v) !== ph(keys[id])) bad.push(l + ": placeholders differ in " + id);
    (out[keys[id]] = out[keys[id]] || {})[l] = v;
  }
  for (const id in d) if (id !== "cues" && !(id in keys)) bad.push(l + ": unknown key " + id);
  const cu = d.cues || {}, rf = {}, ro = {};
  for (const f of FACTORS) { if ((cu.factors || {})[f] && cu.factors[f].length) rf[f] = cu.factors[f]; else bad.push(l + ": cues.factors." + f + " empty"); }
  for (const o of OPTIONS) { if ((cu.options || {})[o] && cu.options[o].length) ro[o] = cu.options[o]; else bad.push(l + ": cues.options." + o + " empty"); }
  const lex = path.join(I18N, l === "en" ? "content" : path.join(l, "content"), "lexicon.json");
  const L = JSON.parse(fs.readFileSync(lex, "utf8"));
  L.lexicon.reading = { factors: rf, options: ro };
  fs.writeFileSync(lex, JSON.stringify(L, null, 1) + "\n");
}
if (bad.length) { console.log(bad.join("\n")); process.exit(1); }
const tmp = path.join(I18N, "ui-new-reading.json");
fs.writeFileSync(tmp, JSON.stringify(out, null, 1) + "\n");
console.log(execFileSync("python", [path.join(I18N, "add-ui.py"), tmp], { encoding: "utf8" }).trim());
