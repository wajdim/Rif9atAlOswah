/* ======================================================================
   رِفقة الأُسوة — جمع نصوص الواجهة التي تحتاج ترجمة إنجليزية
   - كل T("…") في ملفات js
   - النصوص الثابتة في index.html (نصوص + placeholder/title/aria-label + title + description)
   - المصطلحات المحددة في البيانات: التصنيفات، المجموعات، درجة التوثيق، الشخصيات، مصادر السيرة، القراء
   يطبع المفاتيح الناقصة في القاموس (js/i18n.js) أو يكتبها JSON.
   الاستخدام: node build/i18n/collect-ui.js [--lang en|nl] [--json out.json]
   ====================================================================== */
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.join(__dirname, "..", "..");
const keys = new Set();
const AR = /[ء-ي]/;

for (const f of ["app.js", "rag.js", "ai.js", "tts.js", "i18n.js"]) {
  const src = fs.readFileSync(path.join(ROOT, "js", f), "utf8");
  for (const m of src.matchAll(/\bT\("((?:[^"\\]|\\.)*)"/g)) keys.add(JSON.parse('"' + m[1] + '"'));
}
// قوائم المراحل والتقييم في app.js (تمرّ على T عند العرض)
const app = fs.readFileSync(path.join(ROOT, "js", "app.js"), "utf8");
for (const name of ["STAGES", "STAR_LABELS"]) {
  const m = app.match(new RegExp("var " + name + "=\\[([^\\]]*)\\]"));
  if (m) for (const s of m[1].matchAll(/"([^"]*)"/g)) keys.add(s[1]);
}
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8").replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "");
for (const m of html.matchAll(/>([^<>]+)</g)) { const s = m[1].replace(/\s+/g, " ").trim(); if (AR.test(s)) keys.add(s); }
for (const m of html.matchAll(/(?:placeholder|title|aria-label|content)="([^"]+)"/g)) if (AR.test(m[1])) keys.add(m[1].trim());

const ctx = { window: {}, console }; ctx.window = ctx; vm.createContext(ctx);
for (const f of ["data-situations", "data-situations-2", "data-situations-3", "data-situations-4", "data-themes"])
  vm.runInContext(fs.readFileSync(path.join(ROOT, "js", f + ".js"), "utf8").replace(/^(const|let) /gm, "var "), ctx);
ctx.SITUATIONS.forEach(s => { keys.add(s.mainCategory); keys.add(s.sourceStrength); if (s.figure) keys.add(s.figure); (s.seerahSources || []).forEach(x => keys.add(x)); });
ctx.THEMES.forEach(t => keys.add(t.group));
const tts = fs.readFileSync(path.join(ROOT, "js", "tts.js"), "utf8");
for (const m of tts.matchAll(/name:"([^"]+)"/g)) keys.add(m[1]);
const ai = fs.readFileSync(path.join(ROOT, "js", "ai.js"), "utf8");
for (const m of ai.matchAll(/label:"([^"]+)"/g)) keys.add(m[1]);

// القاموس الحالي
const li = process.argv.indexOf("--lang"), LANG = li > -1 ? process.argv[li + 1] : "en";
const ictx = { window: {}, localStorage: { getItem: () => JSON.stringify({ lang: LANG }) }, document: { documentElement: { setAttribute() {} } }, navigator: {} }; ictx.window = ictx;
vm.createContext(ictx); vm.runInContext((fs.existsSync(path.join(ROOT, "js", "data-" + LANG + ".js")) ? fs.readFileSync(path.join(ROOT, "js", "data-" + LANG + ".js"), "utf8") : "") + fs.readFileSync(path.join(ROOT, "js", "i18n.js"), "utf8"), ictx);
const dict = ictx.I18N ? ictx.I18N._dict : {};
const all = [...keys].filter(k => k && AR.test(k));
const missing = all.filter(k => !(k in dict));
const extra = Object.keys(dict).filter(k => !keys.has(k));
const out = process.argv.indexOf("--json");
if (out > -1) fs.writeFileSync(process.argv[out + 1], JSON.stringify(missing, null, 1));
console.log("[" + LANG + "] keys:", all.length, "· missing:", missing.length, "· unused in dict:", extra.length);
if (out < 0) missing.forEach(k => console.log("  " + k));
