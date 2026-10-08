/* ======================================================================
   رِفقة الأُسوة — اللغات (العربية / English)
   ----------------------------------------------------------------------
   - اللغة تُحفظ في rifqa.prefs.lang ("ar" افتراضيًا). تبديلها يعيد تحميل التطبيق.
   - T(نص_عربي, ...قيم): بالعربية يعيد النص كما هو (مع تعويض {0} {1})،
     وبالإنجليزية يعيد ترجمته من القاموس EN_UI (js/i18n-dict.js) أو النص العربي إن لم يوجد.
   - في الواجهة الإنجليزية تُطبَّق ترجمة المحتوى (js/data-en.js) على بيانات المواقف
     والموضوعات والمكتبة قبل بناء محرك البحث. الآيات والأحاديث تبقى بنصها العربي،
     ويُضاف تحتها المعنى بالإنجليزية من ترجمات منشورة:
       القرآن: Saheeh International (عبر Tanzil.net)
       الحديث: ترجمات sunnah.com المنشورة في مجموعة hadith-json
   ====================================================================== */
var I18N = (function(){
  "use strict";
  var lang = "ar";
  try { var p = JSON.parse(localStorage.getItem("rifqa.prefs") || "{}"); if (p.lang === "en") lang = "en"; } catch (e) {}
  var EN = lang === "en";
  var D = window.EN_DATA || {};
  var DICT = D.ui || {};

  function fill(s, args){
    if (!args.length) return s;
    s = String(s);
    return s.replace(/\{(\d+)\}/g, function(m, i, at){
      var v = args[+i]; if (v === undefined) return m;
      // اقتباس داخل اقتباس: “…“x”…” ← “…‘x’…”
      if (s.charAt(at - 1) === "“" && typeof v === "string") v = v.replace(/“/g, "‘").replace(/”/g, "’");
      return v;
    });
  }
  function T(s){
    var args = Array.prototype.slice.call(arguments, 1);
    if (EN && s != null) { var k = String(s); if (Object.prototype.hasOwnProperty.call(DICT, k)) return fill(DICT[k], args); var kt = k.trim(); if (kt !== k && DICT[kt] != null) return fill(DICT[kt], args); }
    return fill(s, args);
  }

  /* ---------- السور ---------- */
  var SURAH_AR = ["الفاتحة","البقرة","آل عمران","النساء","المائدة","الأنعام","الأعراف","الأنفال","التوبة","يونس","هود","يوسف","الرعد","إبراهيم","الحجر","النحل","الإسراء","الكهف","مريم","طه","الأنبياء","الحج","المؤمنون","النور","الفرقان","الشعراء","النمل","القصص","العنكبوت","الروم","لقمان","السجدة","الأحزاب","سبأ","فاطر","يس","الصافات","ص","الزمر","غافر","فصلت","الشورى","الزخرف","الدخان","الجاثية","الأحقاف","محمد","الفتح","الحجرات","ق","الذاريات","الطور","النجم","القمر","الرحمن","الواقعة","الحديد","المجادلة","الحشر","الممتحنة","الصف","الجمعة","المنافقون","التغابن","الطلاق","التحريم","الملك","القلم","الحاقة","المعارج","نوح","الجن","المزمل","المدثر","القيامة","الإنسان","المرسلات","النبأ","النازعات","عبس","التكوير","الانفطار","المطففين","الانشقاق","البروج","الطارق","الأعلى","الغاشية","الفجر","البلد","الشمس","الليل","الضحى","الشرح","التين","العلق","القدر","البينة","الزلزلة","العاديات","القارعة","التكاثر","العصر","الهمزة","الفيل","قريش","الماعون","الكوثر","الكافرون","النصر","المسد","الإخلاص","الفلق","الناس"];
  var SURAH_EN = ["Al-Fatihah","Al-Baqarah","Ali 'Imran","An-Nisa","Al-Ma'idah","Al-An'am","Al-A'raf","Al-Anfal","At-Tawbah","Yunus","Hud","Yusuf","Ar-Ra'd","Ibrahim","Al-Hijr","An-Nahl","Al-Isra","Al-Kahf","Maryam","Ta-Ha","Al-Anbiya","Al-Hajj","Al-Mu'minun","An-Nur","Al-Furqan","Ash-Shu'ara","An-Naml","Al-Qasas","Al-'Ankabut","Ar-Rum","Luqman","As-Sajdah","Al-Ahzab","Saba","Fatir","Ya-Sin","As-Saffat","Sad","Az-Zumar","Ghafir","Fussilat","Ash-Shura","Az-Zukhruf","Ad-Dukhan","Al-Jathiyah","Al-Ahqaf","Muhammad","Al-Fath","Al-Hujurat","Qaf","Adh-Dhariyat","At-Tur","An-Najm","Al-Qamar","Ar-Rahman","Al-Waqi'ah","Al-Hadid","Al-Mujadilah","Al-Hashr","Al-Mumtahanah","As-Saff","Al-Jumu'ah","Al-Munafiqun","At-Taghabun","At-Talaq","At-Tahrim","Al-Mulk","Al-Qalam","Al-Haqqah","Al-Ma'arij","Nuh","Al-Jinn","Al-Muzzammil","Al-Muddaththir","Al-Qiyamah","Al-Insan","Al-Mursalat","An-Naba","An-Nazi'at","'Abasa","At-Takwir","Al-Infitar","Al-Mutaffifin","Al-Inshiqaq","Al-Buruj","At-Tariq","Al-A'la","Al-Ghashiyah","Al-Fajr","Al-Balad","Ash-Shams","Al-Layl","Ad-Duha","Ash-Sharh","At-Tin","Al-'Alaq","Al-Qadr","Al-Bayyinah","Az-Zalzalah","Al-'Adiyat","Al-Qari'ah","At-Takathur","Al-'Asr","Al-Humazah","Al-Fil","Quraysh","Al-Ma'un","Al-Kawthar","Al-Kafirun","An-Nasr","Al-Masad","Al-Ikhlas","Al-Falaq","An-Nas"];
  function normS(s){ return String(s || "").replace(/[ًٌٍَُِّْٰ]/g, "").replace(/[إأآٱ]/g, "ا").replace(/^سورة\s+/, "").replace(/\s+/g, " ").trim(); }
  var SNO = {}; SURAH_AR.forEach(function(n, i){ SNO[normS(n)] = i + 1; });
  SNO[normS("الإنشراح")] = 94; SNO[normS("الدهر")] = 76;
  function surahNo(ar){ return SNO[normS(ar)] || 0; }
  function surahEn(ar){ var n = surahNo(ar); return n ? SURAH_EN[n - 1] : String(ar || ""); }
  function ayahNums(a){ return String(a == null ? "" : a).replace(/[٠-٩]/g, function(d){ return "٠١٢٣٤٥٦٧٨٩".indexOf(d); }).replace(/\s*[-–]\s*/, "-").trim(); }
  /** مرجع الآية للعرض: «سورة البقرة، الآية 153» أو «Al-Baqarah 2:153» */
  function ref(s, a){
    if (!EN) return "سورة " + s + "، الآية " + a;
    var n = surahNo(s);
    return n ? SURAH_EN[n - 1] + " " + n + ":" + ayahNums(a) : s + " " + ayahNums(a);
  }
  /** مرجع الآية للنطق */
  function refSpoken(s, a){
    if (!EN) return "سورة " + s + "، الآية " + a;
    var x = ayahNums(a), multi = /-/.test(x);
    return "Surah " + surahEn(s) + ", " + (multi ? "verses " + x.replace("-", " to ") : "verse " + x);
  }
  /** معنى الآية بالإنجليزية (Saheeh International) */
  function quranEn(s, a){
    var Q = D.quran || {}, n = surahNo(s), x = ayahNums(a), m = x.match(/^(\d+)(?:-(\d+))?/);
    if (!n || !m) return "";
    var from = +m[1], to = m[2] ? +m[2] : from, out = [];
    for (var i = from; i <= to && i < from + 12; i++) { var t = Q[n + ":" + i]; if (t) out.push(to > from ? "(" + i + ") " + t : t); }
    return out.join(" ");
  }

  /* ---------- المصادر والدرجات ---------- */
  var SRC = [
    ["متفق عليه: صحيح البخاري وصحيح مسلم","Agreed upon: Sahih al-Bukhari and Sahih Muslim"],
    ["متفق عليه: صحيح البخاري","Agreed upon: Sahih al-Bukhari"],
    ["متفق عليه","Agreed upon"],
    ["وأصل قصة الإصابة في صحيح مسلم","and the core of the story is in Sahih Muslim"],
    ["والبخاري في الأدب المفرد","and al-Bukhari in al-Adab al-Mufrad"],
    ["البخاري في الأدب المفرد","al-Bukhari in al-Adab al-Mufrad"],
    ["وصحح إسناده الألباني والأرناؤوط","its chain was graded sahih by al-Albani and al-Arna'ut"],
    ["وصححه ابن حبان والألباني","graded sahih by Ibn Hibban and al-Albani"],
    ["وقال الترمذي: حديث حسن صحيح","and al-Tirmidhi said: a hasan sahih hadith"],
    ["رواه الترمذي وأبو داود وأحمد","Narrated by al-Tirmidhi, Abu Dawud and Ahmad"],
    ["رواه الطبراني وابن حبان والحاكم","Narrated by al-Tabarani, Ibn Hibban and al-Hakim"],
    ["أبو يعلى والطبراني في الأوسط","Abu Ya'la and al-Tabarani in al-Awsat"],
    ["وصححه محققو المسند","graded sahih by the editors of the Musnad"],
    ["الطبراني في الكبير","al-Tabarani in al-Kabir"],
    ["ومالك في الموطأ","and Malik in al-Muwatta"],
    ["المستدرك للحاكم","al-Mustadrak of al-Hakim"],
    ["السلسلة الصحيحة","al-Silsilah al-Sahihah"],
    ["وروى مسلم بعضه","and Muslim narrated part of it"],
    ["رواه الإمام أحمد","Narrated by Imam Ahmad"],
    ["معلقًا وموصولاً","(mu'allaq and mawsul)"],
    ["وحسّنه الألباني","graded hasan by al-Albani"],
    ["وصححه الألباني","graded sahih by al-Albani"],
    ["صحيح ابن حبان","Sahih Ibn Hibban"],
    ["صحيح الجامع","Sahih al-Jami'"],
    ["صحيح البخاري","Sahih al-Bukhari"],
    ["صحيح مسلم","Sahih Muslim"],
    ["في بعض طرقه","in some of its chains"],
    ["رواه البخاري","Narrated by al-Bukhari"],
    ["رواه الترمذي","Narrated by al-Tirmidhi"],
    ["رواه أحمد","Narrated by Ahmad"],
    ["موطأ مالك","Muwatta Malik"],
    ["مسند أحمد","Musnad Ahmad"],
    ["والبخاري","and al-Bukhari"],
    ["وابن حبان","and Ibn Hibban"],
    ["مختصرًا","abridged"],
    ["ابن ماجه","Ibn Majah"],
    ["أبو داود","Abu Dawud"],
    ["الترمذي","al-Tirmidhi"],
    ["النسائي","al-Nasa'i"],
    ["البخاري","al-Bukhari"],
    ["وأحمد","and Ahmad"],
    ["مسلم","Muslim"],
    ["أحمد","Ahmad"]
  ];
  function src(s){
    if (!EN || !s) return s || "";
    var o = String(s);
    SRC.forEach(function(p){ o = o.split(p[0]).join(p[1]); });
    return o.replace(/،\s*/g, ", ").replace(/؛\s*/g, "; ").replace(/\s+/g, " ").trim();
  }
  var GRADES = {"صحيح":"Sahih","حسن":"Hasan","حسن بمجموع طرقه":"Hasan (by its combined chains)","صحيح لغيره":"Sahih li-ghayrihi","حسن صحيح":"Hasan sahih",
    "صحيح (حديث قدسي)":"Sahih (Hadith Qudsi)","حسن (حديث قدسي)":"Hasan (Hadith Qudsi)","صحيح (في أصل القصة)":"Sahih (in the core of the story)",
    "حسن (صححه بعض المحدثين وتوقف فيه الذهبي)":"Hasan (graded sahih by some scholars; al-Dhahabi reserved judgement)"};
  function grade(g){ return EN && GRADES[g] ? GRADES[g] : (g || ""); }

  /* ---------- ترجمة النصوص الثابتة في الصفحة ---------- */
  var ATTRS = ["placeholder", "title", "aria-label"];
  function applyStatic(root){
    if (!EN) return;
    var w = document.createTreeWalker(root.body || root, NodeFilter.SHOW_TEXT, null), n, list = [];
    while ((n = w.nextNode())) list.push(n);
    list.forEach(function(node){
      var v = node.nodeValue, k = v.replace(/\s+/g, " ").trim();
      if (k && /[ء-ي]/.test(k) && DICT[k] != null && !(node.parentElement && node.parentElement.closest("[lang=ar]"))) node.nodeValue = v.replace(v.trim(), DICT[k]);
    });
    (root.body || root).querySelectorAll("[placeholder],[title],[aria-label]").forEach(function(el){
      ATTRS.forEach(function(a){ var v = el.getAttribute(a); if (v && DICT[v.trim()] != null) el.setAttribute(a, DICT[v.trim()]); });
    });
    if (DICT[document.title] != null) document.title = DICT[document.title];
    var md = document.querySelector('meta[name="description"]'); if (md && DICT[md.content] != null) md.content = DICT[md.content];
    var lb = document.getElementById("btnLang"); if (lb) { lb.textContent = "ع"; lb.title = "العربية"; lb.setAttribute("aria-label", "العربية"); }
  }

  /* ---------- ترجمة المحتوى (قبل بناء محرك البحث) ---------- */
  function overlay(){
    if (!EN) return;
    var C = D.content || {};
    function put(obj, tr, fields){ if (!obj || !tr) return; fields.forEach(function(f){ if (tr[f] != null && tr[f] !== "") obj[f] = tr[f]; }); }
    (window.SITUATIONS || []).forEach(function(s){
      var tr = (C.sit || {})[s.id]; if (!tr) return;
      put(s, tr, ["title","subCategories","participants","eventDescription","historicalContext","prophetTraits","problemType","responseType","emotionsAddressed",
                  "principles","modernApplications","notToApplyTo","behaviorObservations","whatToAvoid","reflection"]);
      // الكلمات المفتاحية والوسوم: تُضاف الإنجليزية إلى العربية (البحث يعمل باللغتين)
      if (tr.keywords) s.keywords = tr.keywords.concat(s.keywords);
      if (tr.semanticTags) s.semanticTags = tr.semanticTags.concat(s.semanticTags);
      (s.quranRefs || []).forEach(function(q, i){ var x = (tr.quranRefs || [])[i]; if (x) { if (x.context) q.context = x.context; if (x.relevance) q.relevance = x.relevance; } });
      (s.hadithRefs || []).forEach(function(h, i){ var x = (tr.hadithRefs || [])[i]; if (x) { if (x.te) h.te = x.te; if (x.narrator) h.narrator = x.narrator; } });
      (s.contrasts || []).forEach(function(c, i){ var x = (tr.contrasts || [])[i]; if (x) c.note = x; });
    });
    (window.THEMES || []).forEach(function(t){
      var tr = (C.theme || {})[t.id]; if (!tr) return;
      put(t, tr, ["label","insight","plan","questions","avoid","help"]);
      if (tr.triggers) t.triggers = tr.triggers.concat(t.triggers);
    });
    (window.QURAN_LIB || []).forEach(function(q){ put(q, (C.quran || {})[q.id], ["n","w"]); });
    (window.HADITH_LIB || []).forEach(function(h){ put(h, (C.hadith || {})[h.id], ["te","n","w","r"]); });
    var LX = C.lexicon || {};
    function lex(list, tr){ (list || []).forEach(function(e){ var x = (tr || {})[e.id]; if (x) { if (x.label) e.label = x.label; if (x.words) e.words = x.words.concat(e.words); } }); }
    lex(window.EMOTION_LEXICON, LX.emotion); lex(window.RELATION_LEXICON, LX.relation);
    if (LX.intensifiers && window.INTENSIFIERS) LX.intensifiers.forEach(function(w){ window.INTENSIFIERS.push(w); });
    if (LX.selfFault && window.SELF_FAULT_CUES) LX.selfFault.forEach(function(w){ window.SELF_FAULT_CUES.push(w); });
  }
  overlay();

  return {lang:lang, en:EN, T:T, ref:ref, refSpoken:refSpoken, quranEn:quranEn, surahEn:surahEn, src:src, grade:grade, applyStatic:applyStatic, _dict:DICT};
})();
var T = I18N.T;
