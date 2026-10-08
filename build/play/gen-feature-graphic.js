// رِفقة الأُسوة — صورة العرض في متجر Play (1024×500) بثلاث لغات، بخطوط التطبيق نفسها.
// الاستخدام: خادم محلي لجذر المشروع على المنفذ 8765، ثم: node build/play/gen-feature-graphic.js
const { chromium } = require("playwright");
const path = require("path");
const BASE = process.env.RIFQA_URL || "http://localhost:8765/";

const T = {
  ar: { dir: "rtl", name: "رِفقة الأُسوة", line: "اكتب ما تمرّ به، واقرأه في ضوء القرآن والسنة والسيرة", sub: "١١٥ موقفًا نبويًا · آيات وأحاديث موثقة بدرجاتها · يعمل بلا إنترنت" },
  en: { dir: "ltr", name: "Rifqat al-Uswa", line: "Describe what you're going through — read it in the light of the Quran and Sunnah", sub: "115 Prophetic situations · Sourced verses & graded hadith · Works offline" },
  nl: { dir: "ltr", name: "Rifqat al-Uswa", line: "Beschrijf wat je doormaakt — lees het in het licht van de Koran en de Soenna", sub: "115 Profetische situaties · Gestaafde verzen & hadith · Werkt offline" }
};
const BOOK = '<svg viewBox="0 0 24 24" fill="none" stroke="#C9A15C" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6.5C10 5 7 4.6 3.5 5.2v12.6C7 17.2 10 17.6 12 19c2-1.4 5-1.8 8.5-1.2V5.2C17 4.6 14 5 12 6.5z"/><path d="M12 6.5V19"/></svg>';

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1024, height: 500 }, deviceScaleFactor: 1 });
  for (const [lang, t] of Object.entries(T)) {
    await p.goto(BASE + "manifest.json");   // نفس الأصل كي تُحمَّل الخطوط
    await p.setContent(`<!doctype html><html lang="${lang}" dir="${t.dir}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="${BASE}fonts/fonts.css"><style>
      html,body{margin:0;width:1024px;height:500px;overflow:hidden}
      body{background:radial-gradient(120% 140% at 85% 10%,#2F4C3E 0%,#1F2E28 55%,#16211C 100%);color:#F7F2E4;
        font-family:${lang === "ar" ? "'Tajawal'" : "'Tajawal'"},sans-serif;display:flex;align-items:center;gap:56px;padding:0 72px;box-sizing:border-box}
      .icon{flex:none;width:210px;height:210px;border-radius:48px;background:#1F2E28;border:1.5px solid rgba(201,161,92,.35);
        display:grid;place-items:center;box-shadow:0 24px 60px rgba(0,0,0,.35)}
      .icon svg{width:150px;height:150px}
      .txt{min-width:0}
      h1{font-family:'Amiri',serif;font-weight:700;font-size:${lang === "ar" ? 84 : 72}px;line-height:1.15;margin:0 0 14px;color:#F3E7C9}
      .rule{width:160px;height:2px;background:linear-gradient(90deg,transparent,#C9A15C,transparent);margin:0 0 22px}
      p{margin:0;font-size:${lang === "ar" ? 30 : 27}px;line-height:1.45;font-weight:500;max-width:620px;text-wrap:balance}
      small{display:block;margin-top:20px;font-size:${lang === "ar" ? 21 : 19}px;color:#C9A15C;letter-spacing:.02em}
      </style></head><body><div class="icon">${BOOK}</div><div class="txt"><h1>${t.name}</h1><div class="rule"></div><p>${t.line}</p><small>${t.sub}</small></div></body></html>`,
      { waitUntil: "networkidle" });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(__dirname, "listing", { ar: "ar", en: "en-US", nl: "nl-NL" }[lang], "images/featureGraphic.png") });
    console.log("✓ feature graphic", lang);
  }
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
