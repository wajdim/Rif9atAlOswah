// رِفقة الأُسوة — يتحقق من اكتمال ترجمة لغة مقارنةً بالإنجليزية (المرجع)
// الاستخدام: node build/i18n/check-lang.js <nl|es|pt> [--quiet]
const fs = require("fs"), path = require("path");
const LANG = process.argv[2], QUIET = process.argv.includes("--quiet");
if (!/^(nl|es|pt)$/.test(LANG || "")) { console.error("usage: check-lang.js <nl|es|pt>"); process.exit(2); }
const load = dir => { const out = {}; if (!fs.existsSync(dir)) return out;
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith(".json")).sort()) { const d = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); for (const k in d) Object.assign(out[k] = out[k] || {}, d[k]); }
  return out; };
const EN = load(path.join(__dirname, "content")), L = load(path.join(__dirname, LANG, "content"));
const bad = [], stat = {};
const need = (cond, msg) => { if (!cond) bad.push(msg); };

// 1) المواقف: نفس المعرّفات ونفس عدد العناصر في كل قائمة
const es = EN.sit || {}, ls = L.sit || {};
for (const id of Object.keys(ls)) {
  const e = es[id], n = ls[id];
  if (!e) { bad.push("sit " + id + ": unknown id"); continue; }
  for (const k of Object.keys(e)) {
    if (k === "keywords" || k === "semanticTags") { need((n[k] || []).length, "sit " + id + "." + k + " empty"); continue; }
    if (Array.isArray(e[k])) need((n[k] || []).length === e[k].length, "sit " + id + "." + k + " " + e[k].length + "/" + (n[k] || []).length);
    else if (typeof e[k] === "string") need(n[k], "sit " + id + "." + k + " missing");
  }
}
for (const id of Object.keys(es)) if (!ls[id]) bad.push("sit " + id + " missing");
stat.sits = Object.keys(ls).length + "/" + Object.keys(es).length;

// 2) الموضوعات: كل الحقول، ونفس أطوال القوائم
const et = EN.theme || {}, lt = L.theme || {};
for (const id of Object.keys(et)) {
  const e = et[id], n = lt[id];
  if (!n) { bad.push("theme " + id + " missing"); continue; }
  for (const k of Object.keys(e)) {
    if (k === "triggers") { need((n[k] || []).length, "theme " + id + ".triggers empty"); continue; }
    if (k === "plan") { for (const p of Object.keys(e.plan)) need(((n.plan || {})[p] || []).length === e.plan[p].length, "theme " + id + ".plan." + p); continue; }
    if (Array.isArray(e[k])) need((n[k] || []).length === e[k].length, "theme " + id + "." + k + " " + e[k].length + "/" + (n[k] || []).length);
    else need(n[k], "theme " + id + "." + k + " missing");
  }
}
stat.themes = Object.keys(lt).length + "/" + Object.keys(et).length;

// 3) ملاحظات الآيات والأحاديث
const eq = EN.quran || {}, lq = L.quran || {}, eh = EN.hadith || {}, lh = L.hadith || {};
for (const id of Object.keys(eq)) need(lq[id] && lq[id].n, "quran " + id + " missing");
for (const id of Object.keys(eh)) { need(lh[id] && lh[id].n && lh[id].r, "hadith " + id + " missing"); if (eh[id].w) need(lh[id] && lh[id].w, "hadith " + id + ".w missing"); }
stat.quranNotes = Object.keys(lq).length + "/" + Object.keys(eq).length; stat.hadithNotes = Object.keys(lh).length + "/" + Object.keys(eh).length;

// 4) نصوص الأحاديث المترجمة (te): نفس المفاتيح؛ «@lib:x» إحالة إلى نص مكرر
const ete = EN.te || {}, lte = L.te || {};
for (const k of Object.keys(ete)) need(lte[k], "te " + k + " missing");
for (const [k, v] of Object.entries(lte)) if (/^@/.test(v)) need(lte[v.slice(1)] && !/^@/.test(lte[v.slice(1)]), "te " + k + " bad alias " + v);
stat.te = Object.keys(lte).length + "/" + Object.keys(ete).length;

// 5) المعجم
const el = EN.lexicon || {}, ll = L.lexicon || {};
for (const g of ["emotion", "relation"]) for (const id of Object.keys(el[g] || {})) need(((ll[g] || {})[id] || {}).label && ((ll[g] || {})[id].words || []).length, "lexicon " + g + "." + id);
for (const g of ["intensifiers", "selfFault"]) need((ll[g] || []).length, "lexicon " + g + " empty");
stat.lexicon = Object.keys(ll.emotion || {}).length + "+" + Object.keys(ll.relation || {}).length;

// 6) نصوص الواجهة
const uiE = JSON.parse(fs.readFileSync(path.join(__dirname, "ui-en.json"), "utf8"));
const uiF = path.join(__dirname, "ui-" + LANG + ".json"), ui = fs.existsSync(uiF) ? JSON.parse(fs.readFileSync(uiF, "utf8")) : {};
const missUi = Object.keys(uiE).filter(k => !(k in ui) || ui[k] === "");
for (const k of missUi) bad.push("ui missing: " + k.slice(0, 50));
for (const k of Object.keys(ui)) if (/\{\d\}/.test(uiE[k] || "")) { const a = (uiE[k].match(/\{\d\}/g) || []).sort().join(), b = (ui[k].match(/\{\d\}/g) || []).sort().join(); need(a === b, "ui placeholders differ: " + k.slice(0, 50)); }
stat.ui = (Object.keys(uiE).length - missUi.length) + "/" + Object.keys(uiE).length;

console.log("[" + LANG + "] " + Object.entries(stat).map(([k, v]) => k + " " + v).join(" · ") + (bad.length ? "  ✗ " + bad.length + " problems" : "  ✓ complete"));
if (bad.length && !QUIET) console.log(bad.slice(0, 40).map(x => "  - " + x).join("\n") + (bad.length > 40 ? "\n  … +" + (bad.length - 40) : ""));
process.exit(bad.length ? 1 : 0);
