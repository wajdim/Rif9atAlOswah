// رِفقة الأُسوة — لقطات شاشة متجر Google Play (هاتف 1080×1920) بالعربية والإنجليزية والهولندية.
// الاستخدام: شغّل خادمًا محليًا لجذر المشروع على المنفذ 8765، ثم:  node build/play/gen-screenshots.js
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");
const URL = process.env.RIFQA_URL || "http://localhost:8765/";
const LOC = { ar: "ar", en: "en-US", nl: "nl-NL", es: "es-ES", pt: "pt-PT" };   // مجلدات fastlane supply

const Q = {
  ar: "أخي خانني ونشر عني كلامًا كاذبًا أمام العائلة، أشعر بالغضب ولا أعرف هل أسامحه",
  en: "My brother betrayed my trust and spread lies about me to the family. I feel angry and I don't know whether to forgive him.",
  nl: "Mijn broer heeft mijn vertrouwen beschaamd en leugens over mij verspreid in de familie. Ik ben boos en weet niet of ik hem moet vergeven.",
  es: "Mi hermano traicionó mi confianza y difundió mentiras sobre mí en la familia. Estoy enfadado y no sé si perdonarle.",
  pt: "O meu irmão traiu a minha confiança e espalhou mentiras sobre mim na família. Estou zangado e não sei se lhe devo perdoar."
};

(async () => {
  const b = await chromium.launch();
  for (const lang of (process.env.RIFQA_LANGS || "ar,en,nl,es,pt").split(",")) {
    const dir = path.join(__dirname, "listing", LOC[lang], "images/phoneScreenshots"); fs.mkdirSync(dir, { recursive: true });
    const c = await b.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: lang });
    await c.addInitScript(l => { try { if (!sessionStorage.getItem("i")) { sessionStorage.setItem("i", 1); localStorage.clear(); localStorage.setItem("rifqa.prefs", JSON.stringify({ lang: l, theme: "light", fs: "1" })); } } catch (e) {} }, lang);
    const p = await c.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
    await p.goto(URL, { waitUntil: "load" }); await p.waitForTimeout(1200);
    const shot = async (n) => { await p.waitForTimeout(500); await p.screenshot({ path: path.join(dir, n + ".png") }); };
    const openAll = () => p.evaluate(() => document.querySelectorAll(".section.collapsible").forEach(s => s.classList.remove("collapsed")));
    const top = () => p.evaluate(() => window.scrollTo(0, 0));

    await shot("1-home");

    await p.evaluate(q => { RifqaApp.showScreen("home"); RifqaApp.runSearch(q); }, Q[lang]); await p.waitForTimeout(3000);
    await top(); await shot("2-result");
    await openAll(); await p.evaluate(() => { const e = document.querySelector("#resultWrap .section.collapsible"), h = document.querySelector(".topbar"); if (e) window.scrollTo(0, e.getBoundingClientRect().top + scrollY - (h ? h.offsetHeight : 0) - 12); });
    await shot("3-guidance");

    await p.evaluate(() => RifqaApp.openDetail("yusuf-ikhwa")); await p.waitForTimeout(600);
    await shot("4-story");

    await p.evaluate(() => { const x = document.querySelector("[data-act=close-detail]"); if (x) x.click(); RifqaApp.showScreen("explore"); }); await top();
    await shot("5-topics");

    await p.evaluate(() => RifqaApp.showScreen("library")); await p.fill("#libSearch", { ar: "الصبر", en: "patience", nl: "geduld", es: "paciencia", pt: "paciência" }[lang]); await p.waitForTimeout(600); await top();
    await shot("6-library");

    await p.evaluate(() => RifqaApp.showScreen("home")); await top(); await p.click("#btnSettings");
    await shot("7-settings");

    if (errs.length) console.log(lang, "page errors:", errs);
    console.log("✓", lang); await c.close();
  }
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
