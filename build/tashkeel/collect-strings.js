/* ======================================================================
   رِفقة الأُسوة — جمع كل النصوص العربية المعروضة في التطبيق لتشكيلها
   - كل حقول البيانات المعروضة (ما عدا نصوص الآيات والأحاديث: لها مصدرها المشكول)
   - نصوص الواجهة: index.html (نصوص + placeholder/title/aria-label) وسلاسل app.js/rag.js/tts.js
   - قائمة كل الكلمات العربية في التطبيق (لتشكيل النصوص المركّبة آليًا كلمةً كلمة)
   الإخراج: <out>/prose.json (الترتيب القديم محفوظ ثم الجديد) و <out>/words.json
   الاستخدام: node collect-strings.js <out_dir>
   ====================================================================== */
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..", ".."), OUT = process.argv[2];
const G = require("../tests/load.js")(path.join(ROOT, "js"));
const AR = /[ء-ي]/;
const set = new Set();
const CODE = /[<>=]|class|data-|\$\{|##/;                       // ليست نصًا معروضًا
const add = x => { if (Array.isArray(x)) x.forEach(add); else if (typeof x === "string" && AR.test(x) && !CODE.test(x)) set.add(x.trim()); };

// حقول لا تُعرض أو لها تشكيل من مصدر موثق
const SKIP_KEYS = new Set(["id", "keywords", "triggers", "semanticTags", "th", "sits", "icon", "t", "text", "a", "s"]);
function walk(o, k) {
  if (k && SKIP_KEYS.has(k)) return;
  if (typeof o === "string") return add(o);
  if (Array.isArray(o)) return o.forEach(v => walk(v));
  if (o && typeof o === "object") for (const [kk, v] of Object.entries(o)) walk(v, kk);
}
G.SITUATIONS.forEach(s => walk(s));
G.THEMES.forEach(t => walk(t));
G.QURAN_LIB.forEach(q => { add(q.n); add(q.w); add(q.s); });
G.HADITH_LIB.forEach(h => { add(h.n); add(h.w); add(h.r); add(h.src); add(h.g); });
G.SITUATIONS.forEach(s => (s.quranRefs || []).forEach(q => add(q.surahName)));

// نصوص الواجهة
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8").replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "");
for (const m of html.matchAll(/>([^<>]+)</g)) add(m[1].replace(/\s+/g, " "));
for (const m of html.matchAll(/(?:placeholder|title|aria-label)="([^"]+)"/g)) add(m[1]);
for (const f of ["app.js", "rag.js", "tts.js", "tashkeel-view.js"]) {
  const src = fs.readFileSync(path.join(ROOT, "js", f), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
  for (const m of src.matchAll(/"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'/g)) {
    const s = (m[1] || m[2] || "").replace(/<[^>]*>/g, " ").replace(/\\n/g, " ");
    s.split(/\s{2,}/).forEach(p => add(p.replace(/\s+/g, " ")));
  }
}

const out = path.join(OUT, "prose.json");
const old = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, "utf8")) : [];
const oldSet = new Set(old), fresh = [...set].filter(s => !oldSet.has(s));
fs.writeFileSync(out, JSON.stringify(old.concat(fresh)));

// كل الكلمات العربية المعروضة (بما فيها كلمات النصوص المركّبة والمدخلات اللغوية في rag.js)
const words = new Set();
for (const s of old.concat(fresh)) for (const w of s.replace(/[ً-ْٰـ]/g, "").match(/[ء-يٱ]+/g) || []) words.add(w);
fs.writeFileSync(path.join(OUT, "words.json"), JSON.stringify([...words]));
console.log("strings: " + old.length + " قديم + " + fresh.length + " جديد = " + (old.length + fresh.length) + " · كلمات: " + words.size);
