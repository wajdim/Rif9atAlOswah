// يقارن ملفات المواقف الهولندية بالإنجليزية: نفس المعرّفات ونفس عدد العناصر في كل قائمة
const fs = require("fs"), path = require("path");
const dir = __dirname, en = {}, nl = {};
for (const f of fs.readdirSync(path.join(dir, "..", "content")).filter(f => /^sit-/.test(f))) Object.assign(en, JSON.parse(fs.readFileSync(path.join(dir, "..", "content", f), "utf8")).sit);
for (const f of fs.readdirSync(path.join(dir, "content")).filter(f => /^sit-/.test(f))) Object.assign(nl, JSON.parse(fs.readFileSync(path.join(dir, "content", f), "utf8")).sit);
const bad = [];
for (const id of Object.keys(nl)) {
  const e = en[id], n = nl[id];
  if (!e) { bad.push(id + ": unknown id"); continue; }
  for (const k of Object.keys(e)) {
    if (k === "keywords" || k === "semanticTags") { if (!(n[k] || []).length) bad.push(id + "." + k + " empty"); continue; }   // تكفي كلمات هولندية، والعدد حر
    if (Array.isArray(e[k]) && (n[k] || []).length !== e[k].length) bad.push(id + "." + k + " " + e[k].length + "/" + (n[k] || []).length);
    if (!Array.isArray(e[k]) && typeof e[k] === "string" && !n[k]) bad.push(id + "." + k + " missing");
  }
}
console.log("nl sits " + Object.keys(nl).length + "/" + Object.keys(en).length + (bad.length ? "\n" + bad.join("\n") : " · structure ok"));
