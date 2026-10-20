/* Attribution of every hadith-library text and every narration inside a situation, so the answer can introduce it
   accurately (js/data-attrib.js, read by js/app.js):
     qala    the Prophet's own words                                  «قال رسول الله ﷺ:»
     qudsi   words he reports from his Lord                           «قال رسول الله ﷺ فيما يرويه عن ربه:»
     report  a narration about him (an event, a question, his practice) «من السنة النبوية:»
     dua     a supplication reported from him                         «من الأدعية النبوية:»
     athar   words of a Companion or a later narrator, or a historical report   «من الآثار والروايات:»
     none    a summary in meaning (already labelled «خلاصة الرواية / بالمعنى لا باللفظ»): no introduction
   Rules first, then OVERRIDES (each one read by hand). Only non-«qala» entries are written.
   node build/kb/attrib.js [--write] [--list]   (--list prints every text with its class, for review) */
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "../..");
const L = require(path.join(ROOT, "build/tests/load.js"))(path.join(ROOT, "js"), "ar");
const OVERRIDES = {
  // the Prophet's words, although the wording mentions him, opens like a narration or reads like a supplication
  "h-unsur": "qala", "h-unsur-akhak": "qala", "h-ghiba": "qala", "h-islah": "qala", "h-nasiha": "qala", "h-rughm": "qala",
  "h-muflis": "qala", "h-kibr": "qala", "h-athara": "qala", "h-dhunnun": "qala", "h-man-ghashshana": "qala",
  "h-rahima-musa": "qala", "h-bayt-al-hamd": "qala", "h-tawadau": "qala", "h-nuzul": "qala", "h-tala-umruhu": "qala",
  "h-yasubbu-aba-rajul": "qala", "h-mali-mali": "qala", "h-ma-al-faqr-akhsha": "qala", "h-qatil-mia": "qala",
  "h-man-taraka": "qala", "h-kalima-lil-ahl": "qala", "h-dawat-mazlum": "qala", "h-haqq-zawja": "qala", "h-ahdini": "qala",
  "h-sal-afiya": "qala", "h-aainni-dhikr": "qala", "h-kalimat-tammat": "qala",
  "h-dua-bi-zahr-ghayb": "qala", "h-muawwidhat": "qala", "h-muawwidhat-sabah": "qala", "h-bismika-wadatu": "qala",
  "h-aslamtu-nafsi": "qala", "h-ighfir-warhamni": "qala", "h-zalamtu-nafsi": "qala", "h-sharr-sami": "qala",
  "h-jahd-bala": "qala", "h-astaghfiru-hayy": "qala", "h-bismillah-tawakkaltu": "qala", "h-bismillah-yadurr": "qala",
  "h-dua-marid": "qala", "h-ruqya-alam": "qala", "h-sayyid-istighfar": "qala", "h-abduk": "qala", "h-rahmataka": "qala",
  "h-la-yatamanna": "qala", "h-hilm-anah": "qala", "h-arihna": "qala", "h-kanat-wa-kanat": "qala", "h-abulluha": "qala",
  "h-thalithuhuma": "qala", "h-abdan-shakura": "qala", "h-laallaka-aghdabtahum": "qala", "h-khayrun-min-mil": "qala",
  "h-bima-tutiqun": "qala", "h-yusalli-nashatahu": "qala", "h-munaffirin": "qala", "h-innaha-amana": "qala",
  "h-bi-sakhawat-nafs": "qala", "h-radiya-ghadba": "qala", "h-yughan": "qala", "h-lillahi-ma-akhadh": "qala",
  "h-firsin-shat": "qala", "h-ihfadh": "qala", "h-shabab": "qala", "h-idha-lam-tastahi": "qala", "h-majra-dam": "qala",
  "h-dam-al-ayn": "qala", "h-rahma-qulub": "qala", "h-barrakt": "qala", "h-liqa-allah": "qala", "h-mutahabbun": "qala",
  "h-qurab-al-ard": "qala", "h-rahim-maqam": "qala", "h-mia-rahma": "qala", "h-man-waliya": "qala",
  "h-azfar-nuhas": "qala", "h-ahsibu": "qala",
  // words he reports from his Lord, even when the text does not open with «قال الله»
  "h-ma-la-ayn-raat": "qudsi", "h-shibran-dhiraa": "qudsi", "h-habibatayn": "qudsi", "h-man-ada-li-waliyya": "qudsi",
  "h-ma-daawtani": "qudsi", "h-ajir-ajrah": "qudsi", "h-aghna-shuraka": "qudsi", "h-zann-abdi": "qudsi", "h-safiyyuhu": "qudsi",
  // he told it about another prophet; a Companion's words he approved; a Companion's own words; narrations about him
  "h-ighfir-li-qawmi": "report", "h-haqq-nafs": "report", "h-hasbuna": "athar", "h-uidhukuma": "report",
  "h-arhamu-biibadihi": "report", "h-illa-ddayn": "report", "h-la-tasal-imara": "report",
  "h-asma-umm": "report", "h-mal": "report", "h-iqilha": "report", "h-ashadd-bala": "report", "h-ghadab-istiadha": "report",
  "h-waswasa-sarih": "report", "h-la-bas": "report", "h-hazabahu": "report", "h-muqallib": "report",
  // situations
  "abubakr-mistah#0": "athar", "am-al-huzn#0": "athar", "wafat-nabi#0": "athar", "musab-kafan#0": "athar",
  "abusufyan-heraclius#0": "athar", "abubakr-umar-khilaf#0": "report", "hajar-zamzam#0": "athar",
  "salman-abuddarda#0": "report", "safiyya-ghiba#0": "qala", "fatima-khadim#0": "qala", "abudhar-jahiliyya#0": "qala",
  "hummara#0": "qala", "hummara#1": "qala", "himar-khamr#0": "qala", "himar-khamr#1": "qala", "sahl-ayn#1": "qala",
  "hanzala#0": "qala", "fatima-qays#0": "qala", "saad-wasiyya#0": "qala", "hijra-watan#0": "qala",
  "shib-abi-talib#0": "report", "waswasa-sarih#1": "qala", "liqa-allah#0": "qala", "ibn-ubayy#0": "report",
  "khadija-wahy#0": "report", "mughith-barira#0": "report", "thabit-khul#0": "report", "wahshi#0": "report",
  "umm-salama-hudaybiyyah#0": "report", "aisha-sibaq#0": "report", "ghart-ummukum#0": "report", "muawiya-hakam#0": "report",
  "shab-zina#0": "report", "qatil-mia#0": "qala", "sadaqa-sariq#0": "qala", "musa-khidr#0": "qala", "abasa#0": "report",
  "hubb-fillah#0": "qala", "am-al-huzn#1": "report", "masjid-cleaner#0": "report", "lastu-bimalik#0": "report",
  "badr-dua#0": "report", "khandaq#0": "report", "khandaq#1": "report", "bir-mauna#0": "report", "jar-mataa#0": "report",
  "iqilha-tawakkul#0": "report", "waswasa-sarih#0": "report", "mumin-qawi#1": "dua", "ibrahim-abihi#0": "report", "sam-alaykum#0": "report"
};
const QUDSI = /^…?\s*(قال الله|إن الله قال|يقول الله|إن الله يقول|إن الله تبارك وتعالى)/;
const NARR = /^…?\s*(عن |كان |كانت |جاء |أن |قال رجل|قالت|سئل|سُئل|سألت|أتى|دخل|خرج|مر |مرّ|بعث|نظر|قنت|شج|شُج|توفي|تُوفي|أُنزل|فلما|فرجع|هاجرنا|إن فتى|إنا يوم|لما |خرجت|خدمت|ما شبع|ما ضرب|ما غرت|أخذ|قام|فسمع|فوالله|كنت|روى|استب)/;
const THIRD = /(النبي|رسول الله|نبي الله) ﷺ/;
const DUA = /^…?\s*(اللهم|رب |ربنا|لا إله|سبحان|الحمد لله|أعوذ|بسم|يا مقلب)/;
function classify(id, text, opts) {
  if (opts.summary) return "none";
  if (OVERRIDES[id]) return OVERRIDES[id];
  if (QUDSI.test(text)) return "qudsi";
  if (NARR.test(text) || THIRD.test(text)) return "report";
  if (opts.dua && DUA.test(text)) return "dua";
  return "qala";
}
function rowsOf() {
  const rows = [];
  L.HADITH_LIB.forEach(h => rows.push([h.id, classify(h.id, h.t, {dua: h.dua}), h.t]));
  L.SITUATIONS.forEach(s => (s.hadithRefs || []).forEach((x, i) => {
    const id = s.id + "#" + i, ev = (L.EVIDENCE || {})[id] || {};
    rows.push([id, classify(id, x.text, {summary: x.paraphrase || ev.v === "summary"}), x.text]);
  }));
  return rows;
}
module.exports = {classify, rowsOf, OVERRIDES};
if (require.main === module) {
  const rows = rowsOf();
  const unknown = Object.keys(OVERRIDES).filter(id => !rows.some(r => r[0] === id));
  if (unknown.length) { console.log("overrides for unknown ids: " + unknown.join(", ")); process.exit(1); }
  const count = {}; rows.forEach(r => count[r[1]] = (count[r[1]] || 0) + 1);
  console.log(rows.length + " texts: " + Object.keys(count).map(k => k + " " + count[k]).join(" · "));
  if (process.argv.includes("--list")) rows.forEach(r => console.log(r[1].padEnd(7) + r[0].padEnd(26) + r[2].slice(0, 110)));
  if (process.argv.includes("--write")) {
    const out = {}; rows.filter(r => r[1] !== "qala").forEach(r => out[r[0]] = r[1]);
    fs.writeFileSync(path.join(ROOT, "js/data-attrib.js"),
      "/* GENERATED by build/kb/attrib.js --write - do not edit by hand.\n   How each hadith text is introduced (absent = qala: «قال رسول الله ﷺ:»):\n" +
      "   qudsi (from his Lord) · report (a narration about him) · dua (a supplication from him) · athar (a Companion's or narrator's words) · none (summary in meaning). */\n" +
      "var ATTRIB = " + JSON.stringify(out).replace(/","/g, "\",\n\"") + ";\n", "utf8");
    console.log("wrote js/data-attrib.js (" + Object.keys(out).length + " entries)");
  }
}
