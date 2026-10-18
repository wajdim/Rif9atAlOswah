/* رِفقة الأُسوة — مفاتيح نصوص «التحليل الأعمق»: معرّف ثابت ← النص العربي (من ANALYSIS_TEXT ومن نصوص الواجهة في app.js/rag.js)
   تُكتب الترجمات في build/i18n/analysis/<lang>.json بالمعرّفات نفسها، ثم: node build/i18n/analysis/build.js */
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.join(__dirname, "..", "..", "..");
const UI = {
  "ui.title": "تحليل أعمق لموقفك",
  "ui.sub": "قراءة تأملية مبنية على كلماتك وحدها؛ ليست تشخيصًا نفسيًا ولا فتوى.",
  "ui.core": "جوهر الموقف",
  "ui.beneath": "ما وراء المشاعر",
  "ui.relation": "طبيعة العلاقة",
  "ui.patterns": "أنماط في طريقة التفكير",
  "ui.control": "ما بيدك وما ليس بيدك",
  "ui.mine": "بيدك:",
  "ui.notMine": "ليس بيدك:",
  "ui.strengths": "مواطن قوة في كلامك",
  "ui.signals": "إشارات تستحق الانتباه",
  "ui.priority": "الأولوية الآن",
  "ui.ctxHead": "## تحليل أعمق (تأملي، ليس تشخيصًا)",
  "ui.ctxPattern": "نمط في التفكير:",
  "ui.ctxSignal": "إشارة تستحق الانتباه:"
};
function keys() {
  const c = { window: {} }; c.window = c; vm.createContext(c);
  vm.runInContext(fs.readFileSync(path.join(ROOT, "js", "data-themes.js"), "utf8").replace(/^(const|let) /gm, "var "), c);
  const A = c.ANALYSIS_TEXT, out = Object.assign({}, UI);
  for (const g of ["lens", "emo", "rel", "str", "sig", "pri"]) for (const k in A[g]) out[g + "." + k] = A[g][k];
  for (const k in A.pat) { out["pat." + k + ".name"] = A.pat[k].name; out["pat." + k + ".text"] = A.pat[k].text; }
  for (const k in A.ctl) A.ctl[k].forEach((t, i) => out["ctl." + k + "." + i] = t);
  return out;
}
module.exports = keys;
if (require.main === module) console.log(JSON.stringify(keys(), null, 1));
