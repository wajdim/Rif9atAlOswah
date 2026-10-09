/* يولّد نسخة HTML واحدة مستقلة (كل CSS وJS والخطوط مضمّنة) تعمل بنقرة مزدوجة */
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, ".."), OUT = process.argv[2] || path.join(ROOT, "dist", "RifqaAlUswa.html");
const read = p => fs.readFileSync(path.join(ROOT, p), "utf8");
let html = read("index.html");
function inlineCss(href) {
  let css = read(href);
  const dir = path.dirname(href);
  css = css.replace(/url\(([^)]+)\)/g, (m, u) => {
    u = u.replace(/['"]/g, "").trim();
    if (/^data:|^https?:/.test(u)) return m;
    const f = path.join(ROOT, dir, u);
    const ext = path.extname(f).slice(1);
    const mime = ext === "woff2" ? "font/woff2" : ext === "png" ? "image/png" : "application/octet-stream";
    return `url(data:${mime};base64,${fs.readFileSync(f).toString("base64")})`;
  });
  return css;
}
// ملفات الترجمة: تُضمَّن كلها مغلّفة بدوال، ولا تُشغَّل إلا دالة اللغة الحالية (يغيّر المستخدم اللغة فتُعاد الصفحة)
const LANGS = ["en", "nl", "es", "pt"];
html = html.replace(/<!-- i18n-data[\s\S]*?<!-- \/i18n-data -->/, () => {
  const fns = LANGS.map(l => {
    const v = l.toUpperCase() + "_DATA";
    return `__RD.${l}=function(){\n${read("js/data-" + l + ".js").replace(/<\/script/gi, "<\\/script")}\nwindow.${v}=${v};};`;
  }).join("\n");
  return `<script>\nvar __RD={};\n${fns}\n(function(){var l=document.documentElement.lang;if(__RD[l])__RD[l]();__RD=null;})();\n</script>`;
});
if (/data-' ?\+ ?l/.test(html)) throw new Error("i18n-data loader was not replaced");
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (m, href) => `<style>\n${inlineCss(href)}\n</style>`);
html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, src) => `<script>\n${read(src).replace(/<\/script/gi, "<\/script")}\n</script>`);
const icon = "data:image/png;base64," + fs.readFileSync(path.join(ROOT, "icons/icon-192.png")).toString("base64");
html = html.replace(/<link rel="manifest"[^>]*>\n?/, "")
           .replace(/<link rel="apple-touch-icon"[^>]*>/, `<link rel="apple-touch-icon" href="${icon}">`)
           .replace(/<link rel="icon"[^>]*>/, `<link rel="icon" href="${icon}">`)
           .replace(/manifest-src 'self'; worker-src 'self'/, "");
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, html);
console.log("✓", OUT, (fs.statSync(OUT).size / 1024 / 1024).toFixed(2) + " MB");
