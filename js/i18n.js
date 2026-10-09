/* ======================================================================
   رِفقة الأُسوة — اللغات (العربية / English / Nederlands / Español / Português)
   ----------------------------------------------------------------------
   - اللغة تُحفظ في rifqa.prefs.lang ("ar" افتراضيًا، أو en / nl / es / pt). تبديلها يعيد تحميل التطبيق.
   - I18N.en (ومتغير EN في بقية الملفات) يعني «واجهة مترجمة من اليسار لليمين» (أي لغة غير العربية)؛
     وما يخص لغة بعينها يُقرأ من I18N.lang.
   - T(نص_عربي, ...قيم): بالعربية يعيد النص كما هو (مع تعويض {0} {1})،
     وبالإنجليزية يعيد ترجمته من القاموس EN_UI (js/i18n-dict.js) أو النص العربي إن لم يوجد.
   - في الواجهة الإنجليزية تُطبَّق ترجمة المحتوى (js/data-en.js) على بيانات المواقف
     والموضوعات والمكتبة قبل بناء محرك البحث. الآيات والأحاديث تبقى بنصها العربي،
     ويُضاف تحتها المعنى بالإنجليزية من ترجمات منشورة:
       القرآن: Saheeh International (عبر Tanzil.net)
       الحديث: ترجمات sunnah.com المنشورة في مجموعة hadith-json
     والهولندية (js/data-nl.js): القرآن: Sofian S. Siregar (Tanzil.net)؛
       الحديث: ترجمة خاصة بالتطبيق عن النص الإنجليزي لـ sunnah.com (لا توجد ترجمة هولندية منشورة متاحة)
     والإسبانية (js/data-es.js): القرآن: Julio Cortés؛ والبرتغالية (js/data-pt.js): القرآن: Samir El-Hayek
       (كلاهما عبر Tanzil.net)؛ والحديث فيهما ترجمة خاصة بالتطبيق عن النص الإنجليزي لـ sunnah.com
   ====================================================================== */
var I18N = (function(){
  "use strict";
  var LANGS = ["ar", "en", "nl", "es", "pt"];
  var lang = "ar";
  try { var p = JSON.parse(localStorage.getItem("rifqa.prefs") || "{}"); if (LANGS.indexOf(p.lang) > 0) lang = p.lang; } catch (e) {}
  var EN = lang !== "ar";                                  // واجهة مترجمة (أي لغة غير العربية)
  var NL = lang === "nl";
  var COL = Math.max(1, LANGS.indexOf(lang));              // عمود اللغة في جداول المصادر والدرجات (1 = الإنجليزية)
  var D = (EN ? window[lang.toUpperCase() + "_DATA"] : null) || {};
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
    var W = {en:["Surah","verse","verses","to"], nl:["Soera","vers","verzen","tot"], es:["Sura","aleya","aleyas","a"], pt:["Surata","versículo","versículos","a"]}[lang] || ["Surah","verse","verses","to"];
    return W[0] + " " + surahEn(s) + ", " + (multi ? W[2] + " " + x.replace("-", " " + W[3] + " ") : W[1] + " " + x);
  }
  /** معنى الآية بلغة الواجهة (en: Saheeh International؛ nl: Siregar؛ es: Cortés؛ pt: El-Hayek) */
  function quranEn(s, a){
    var Q = D.quran || {}, n = surahNo(s), x = ayahNums(a), m = x.match(/^(\d+)(?:-(\d+))?/);
    if (!n || !m) return "";
    var from = +m[1], to = m[2] ? +m[2] : from, out = [];
    for (var i = from; i <= to && i < from + 12; i++) { var t = Q[n + ":" + i]; if (t) out.push(to > from ? "(" + i + ") " + t : t); }
    return out.join(" ");
  }

  /* ---------- المصادر والدرجات ---------- */
  var SRC = [
    ["متفق عليه: صحيح البخاري وصحيح مسلم","Agreed upon: Sahih al-Bukhari and Sahih Muslim","Overeengekomen (muttafaq ʿalayh): Sahih al-Bukhari en Sahih Muslim","Acordado (muttafaq ʿalayh): Sahih al-Bukhari y Sahih Muslim","Acordado (muttafaq ʿalayh): Sahih al-Bukhari e Sahih Muslim"],
    ["متفق عليه: صحيح البخاري","Agreed upon: Sahih al-Bukhari","Overeengekomen (muttafaq ʿalayh): Sahih al-Bukhari","Acordado (muttafaq ʿalayh): Sahih al-Bukhari","Acordado (muttafaq ʿalayh): Sahih al-Bukhari"],
    ["متفق عليه","Agreed upon","Overeengekomen (muttafaq ʿalayh)","Acordado (muttafaq ʿalayh)","Acordado (muttafaq ʿalayh)"],
    ["وأصل قصة الإصابة في صحيح مسلم","and the core of the story is in Sahih Muslim","en de kern van het verhaal staat in Sahih Muslim","y el núcleo de la historia está en Sahih Muslim","e o núcleo da história está em Sahih Muslim"],
    ["والبخاري في الأدب المفرد","and al-Bukhari in al-Adab al-Mufrad","en al-Bukhari in al-Adab al-Mufrad","y al-Bukhari en al-Adab al-Mufrad","e al-Bukhari em al-Adab al-Mufrad"],
    ["البخاري في الأدب المفرد","al-Bukhari in al-Adab al-Mufrad","al-Bukhari in al-Adab al-Mufrad","al-Bukhari en al-Adab al-Mufrad","al-Bukhari em al-Adab al-Mufrad"],
    ["وصحح إسناده الألباني والأرناؤوط","its chain was graded sahih by al-Albani and al-Arna'ut","de keten werd als sahih beoordeeld door al-Albani en al-Arna'ut","su cadena fue calificada de sahih por al-Albani y al-Arna'ut","a sua cadeia foi classificada como sahih por al-Albani e al-Arna'ut"],
    ["وصححه ابن حبان والألباني","graded sahih by Ibn Hibban and al-Albani","als sahih beoordeeld door Ibn Hibban en al-Albani","calificado de sahih por Ibn Hibban y al-Albani","classificado como sahih por Ibn Hibban e al-Albani"],
    ["وقال الترمذي: حديث حسن صحيح","and al-Tirmidhi said: a hasan sahih hadith","en al-Tirmidhi zei: een hasan sahih hadith","y al-Tirmidhi dijo: un hadiz hasan sahih","e al-Tirmidhi disse: um hadith hasan sahih"],
    ["رواه الترمذي وأبو داود وأحمد","Narrated by al-Tirmidhi, Abu Dawud and Ahmad","Overgeleverd door al-Tirmidhi, Abu Dawud en Ahmad","Narrado por al-Tirmidhi, Abu Dawud y Ahmad","Narrado por al-Tirmidhi, Abu Dawud e Ahmad"],
    ["رواه الطبراني وابن حبان والحاكم","Narrated by al-Tabarani, Ibn Hibban and al-Hakim","Overgeleverd door al-Tabarani, Ibn Hibban en al-Hakim","Narrado por al-Tabarani, Ibn Hibban y al-Hakim","Narrado por al-Tabarani, Ibn Hibban e al-Hakim"],
    ["أبو يعلى والطبراني في الأوسط","Abu Ya'la and al-Tabarani in al-Awsat","Abu Ya'la en al-Tabarani in al-Awsat","Abu Ya'la y al-Tabarani en al-Awsat","Abu Ya'la e al-Tabarani em al-Awsat"],
    ["وصححه محققو المسند","graded sahih by the editors of the Musnad","als sahih beoordeeld door de redacteuren van de Musnad","calificado de sahih por los editores del Musnad","classificado como sahih pelos editores do Musnad"],
    ["الطبراني في الكبير","al-Tabarani in al-Kabir","al-Tabarani in al-Kabir","al-Tabarani en al-Kabir","al-Tabarani em al-Kabir"],
    ["ومالك في الموطأ","and Malik in al-Muwatta","en Malik in al-Muwatta","y Malik en al-Muwatta","e Malik em al-Muwatta"],
    ["المستدرك للحاكم","al-Mustadrak of al-Hakim","al-Mustadrak van al-Hakim","al-Mustadrak de al-Hakim","al-Mustadrak de al-Hakim"],
    ["السلسلة الصحيحة","al-Silsilah al-Sahihah","al-Silsilah al-Sahihah","al-Silsilah al-Sahihah","al-Silsilah al-Sahihah"],
    ["وروى مسلم بعضه","and Muslim narrated part of it","en Muslim heeft een deel ervan overgeleverd","y Muslim narró una parte","e Muslim narrou parte dele"],
    ["رواه الإمام أحمد","Narrated by Imam Ahmad","Overgeleverd door imam Ahmad","Narrado por el imam Ahmad","Narrado pelo imam Ahmad"],
    ["معلقًا وموصولاً","(mu'allaq and mawsul)","(mu'allaq en mawsul)","(mu'allaq y mawsul)","(mu'allaq e mawsul)"],
    ["وحسّنه الألباني","graded hasan by al-Albani","als hasan beoordeeld door al-Albani","calificado de hasan por al-Albani","classificado como hasan por al-Albani"],
    ["وصححه الألباني","graded sahih by al-Albani","als sahih beoordeeld door al-Albani","calificado de sahih por al-Albani","classificado como sahih por al-Albani"],
    ["صحيح ابن حبان","Sahih Ibn Hibban","Sahih Ibn Hibban","Sahih Ibn Hibban","Sahih Ibn Hibban"],
    ["صحيح الجامع","Sahih al-Jami'","Sahih al-Jami'","Sahih al-Jami'","Sahih al-Jami'"],
    ["صحيح البخاري","Sahih al-Bukhari","Sahih al-Bukhari","Sahih al-Bukhari","Sahih al-Bukhari"],
    ["صحيح مسلم","Sahih Muslim","Sahih Muslim","Sahih Muslim","Sahih Muslim"],
    ["في بعض طرقه","in some of its chains","in sommige van zijn ketens","en algunas de sus cadenas","em algumas das suas cadeias"],
    ["رواه البخاري","Narrated by al-Bukhari","Overgeleverd door al-Bukhari","Narrado por al-Bukhari","Narrado por al-Bukhari"],
    ["رواه الترمذي","Narrated by al-Tirmidhi","Overgeleverd door al-Tirmidhi","Narrado por al-Tirmidhi","Narrado por al-Tirmidhi"],
    ["رواه أحمد","Narrated by Ahmad","Overgeleverd door Ahmad","Narrado por Ahmad","Narrado por Ahmad"],
    ["موطأ مالك","Muwatta Malik","Muwatta Malik","Muwatta Malik","Muwatta Malik"],
    ["مسند أحمد","Musnad Ahmad","Musnad Ahmad","Musnad Ahmad","Musnad Ahmad"],
    ["والبخاري","and al-Bukhari","en al-Bukhari","y al-Bukhari","e al-Bukhari"],
    ["وابن حبان","and Ibn Hibban","en Ibn Hibban","e Ibn Hibban","e Ibn Hibban"],
    ["مختصرًا","abridged","verkort","abreviado","abreviado"],
    ["ابن ماجه","Ibn Majah","Ibn Majah","Ibn Majah","Ibn Majah"],
    ["أبو داود","Abu Dawud","Abu Dawud","Abu Dawud","Abu Dawud"],
    ["الترمذي","al-Tirmidhi","al-Tirmidhi","al-Tirmidhi","al-Tirmidhi"],
    ["النسائي","al-Nasa'i","al-Nasa'i","al-Nasa'i","al-Nasa'i"],
    ["البخاري","al-Bukhari","al-Bukhari","al-Bukhari","al-Bukhari"],
    ["وأحمد","and Ahmad","en Ahmad","y Ahmad","e Ahmad"],
    ["مسلم","Muslim","Muslim","Muslim","Muslim"],
    ["أحمد","Ahmad","Ahmad","Ahmad","Ahmad"]
  ];
  function src(s){
    if (!EN || !s) return s || "";
    var o = String(s);
    SRC.forEach(function(p){ o = o.split(p[0]).join(p[COL] || p[1]); });
    return o.replace(/،\s*/g, ", ").replace(/؛\s*/g, "; ").replace(/\s+/g, " ").trim();
  }
  var GRADES = {"صحيح":"Sahih","حسن":"Hasan","حسن بمجموع طرقه":"Hasan (by its combined chains)","صحيح لغيره":"Sahih li-ghayrihi","حسن صحيح":"Hasan sahih",
    "صحيح (حديث قدسي)":"Sahih (Hadith Qudsi)","حسن (حديث قدسي)":"Hasan (Hadith Qudsi)","صحيح (في أصل القصة)":"Sahih (in the core of the story)",
    "حسن (صححه بعض المحدثين وتوقف فيه الذهبي)":"Hasan (graded sahih by some scholars; al-Dhahabi reserved judgement)"};
  var GRADES_NL = {"صحيح":"Sahih (authentiek)","حسن":"Hasan (goed)","حسن بمجموع طرقه":"Hasan (door zijn gezamenlijke ketens)","صحيح لغيره":"Sahih li-ghayrihi","حسن صحيح":"Hasan sahih",
    "صحيح (حديث قدسي)":"Sahih (Hadith Qudsi)","حسن (حديث قدسي)":"Hasan (Hadith Qudsi)","صحيح (في أصل القصة)":"Sahih (in de kern van het verhaal)",
    "حسن (صححه بعض المحدثين وتوقف فيه الذهبي)":"Hasan (door sommige geleerden als sahih beoordeeld; al-Dhahabi hield zijn oordeel aan)"};
  var GRADES_ES = {"صحيح":"Sahih (auténtico)","حسن":"Hasan (bueno)","حسن بمجموع طرقه":"Hasan (por el conjunto de sus cadenas)","صحيح لغيره":"Sahih li-ghayrihi","حسن صحيح":"Hasan sahih",
    "صحيح (حديث قدسي)":"Sahih (hadiz qudsi)","حسن (حديث قدسي)":"Hasan (hadiz qudsi)","صحيح (في أصل القصة)":"Sahih (en el núcleo de la historia)",
    "حسن (صححه بعض المحدثين وتوقف فيه الذهبي)":"Hasan (algunos sabios lo calificaron de sahih; al-Dhahabi se reservó el juicio)"};
  var GRADES_PT = {"صحيح":"Sahih (autêntico)","حسن":"Hasan (bom)","حسن بمجموع طرقه":"Hasan (pelo conjunto das suas cadeias)","صحيح لغيره":"Sahih li-ghayrihi","حسن صحيح":"Hasan sahih",
    "صحيح (حديث قدسي)":"Sahih (hadith qudsi)","حسن (حديث قدسي)":"Hasan (hadith qudsi)","صحيح (في أصل القصة)":"Sahih (no núcleo da história)",
    "حسن (صححه بعض المحدثين وتوقف فيه الذهبي)":"Hasan (alguns sábios classificaram-no como sahih; al-Dhahabi reservou o seu juízo)"};
  function grade(g){ var G = {en:GRADES, nl:GRADES_NL, es:GRADES_ES, pt:GRADES_PT}[lang] || GRADES; return EN && G[g] ? G[g] : (g || ""); }

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

  return {lang:lang, langs:LANGS, en:EN, nl:NL, T:T, ref:ref, refSpoken:refSpoken, quranEn:quranEn, surahEn:surahEn, src:src, grade:grade, applyStatic:applyStatic, _dict:DICT};
})();
var T = I18N.T;
