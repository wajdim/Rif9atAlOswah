/* رِفقة الأُسوة — مفاتيح نصوص «القراءة الأولية» العميقة (js/data-reading.js): معرّف ثابت ← النص العربي بصيغة المذكر (مفتاح الترجمة)
   الترجمات في build/i18n/reading/<lang>.json بالمعرّفات نفسها، ومعها cues: ألفاظ العوامل والخيارات بتلك اللغة.
   البناء: node build/i18n/reading/build.js */
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.join(__dirname, "..", "..", "..");
function keys() {
  const c = { window: {} }; c.window = c; vm.createContext(c);
  vm.runInContext(fs.readFileSync(path.join(ROOT, "js", "data-reading.js"), "utf8"), c);
  const X = c.READING_TEXT, out = {}, m = v => Array.isArray(v) ? v[0] : v;
  for (const k of Object.keys(X)) {
    const v = X[k];
    if (typeof v === "string" || Array.isArray(v)) out["rd." + k] = m(v);
    else for (const j of Object.keys(v)) out["rd." + k + "." + j] = m(v[j]);
  }
  c.READING_FACTORS.filter(f => f.label).forEach(f => out["rd.factor." + f.id] = m(f.label));
  return out;
}
module.exports = keys;
if (require.main === module) { const k = keys(); console.log(Object.keys(k).length + " keys"); for (const [id, t] of Object.entries(k)) console.log(id + "\t" + t); }
