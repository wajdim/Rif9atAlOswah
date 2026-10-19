/* ======================================================================
   رِفقة الأُسوة — مُركِّب الإجابة ومدقّق الاستشهادات (COMPOSE)
   ----------------------------------------------------------------------
   يحوّل نتيجة RAG.analyze إلى إجابة بعمق يختاره المستخدم:
     brief    مختصر : القراءة الأولية مختصرة، الموقف الأقرب، آية وحديث، خطوات الآن، دعاء واحد
     standard متوسط : الإجابة الكاملة المعتادة
     deep     معمّق : يضيف أعماق الموقف من السيرة (الصعوبة، الخيارات، ما اختاره، ما امتنع عنه، الدروس)،
                      وأدلة ومواقف أكثر
   ما لا يتغير بالعمق: تنبيهات السلامة، والتمييزات الدقيقة، وحدود المثال (متى لا ينطبق).

   مدقق الاستشهادات: لا تصل آية ولا حديث إلى الإجابة إلا إذا كان له سجل تحقق في EVIDENCE
   (js/data-evidence.js، يولّده build/kb/verify.py) بحالة مقبولة، وبصمةُ نصه المعروض تطابق البصمة المسجلة.
   ما يفشل يُسقط من الإجابة ويُذكر في dropped (والاختبار build/tests/test-compose.js يشترط ألا يسقط شيء).
   ====================================================================== */
var COMPOSE = (function(){
  var DEPTHS = ["brief", "standard", "deep"];
  var N = {                       // عدد العناصر في كل عمق
    brief:    {para:2, ayat:1, hadith:1, others:0, duas:1, questions:0, avoid:2, distinctions:2},
    standard: {para:99, ayat:4, hadith:4, others:4, duas:3, questions:4, avoid:5, distinctions:2},
    deep:     {para:99, ayat:6, hadith:6, others:6, duas:4, questions:6, avoid:6, distinctions:3}
  };
  var OK = {quran:{verified:1, excerpt:1}, hadith:{source:1, secondary:1, summary:1}};

  // FNV-1a على وحدات UTF-16، مثل fingerprint() في build/kb/kbsrc.py
  function fp(text){
    var h = 0x811c9dc5, s = String(text == null ? "" : text);
    for (var i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return ("0000000" + h.toString(16)).slice(-8);
  }
  /* kind: quran | hadith ؛ id: معرّف المكتبة أو «موقف#رقم» / «موقف#qرقم» ؛ text: النص كما سيُعرض */
  function validate(kind, id, text){
    var E = window.EVIDENCE;
    if (!E) return {ok:false, reason:"no-evidence-table"};
    var e = E[id];
    if (!e) return {ok:false, reason:"no-record"};
    if (!OK[kind] || !OK[kind][e.v]) return {ok:false, reason:"status:" + e.v, status:e.v};
    if (e.f !== fp(text)) return {ok:false, reason:"text-changed", status:e.v};
    return {ok:true, status:e.v};
  }
  /* النص المشكول المعروض يجب أن يطابق النص الموثق حرفًا بحرف بعد حذف الحركات؛ وإلا يُعرض الموثق كما هو */
  var MARKS = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g;
  // تُهمل الحركات وعلامات الترقيم وصور كتابة الهمزة (مسؤولا/مسئولا)، ويبقى الحرف نفسه شرطًا
  function letters(t){ return String(t == null ? "" : t).replace(MARKS, "").replace(/[ؤئأإآٱ]/g, "ء")
    .replace(/[^ء-ي٠-٩a-zA-Z0-9ﷺ]+/g, " ").replace(/\s+/g, " ").trim(); }
  function shown(plain, vocalized){ return vocalized && letters(vocalized) === letters(plain) ? vocalized : plain; }
  /* بيانات «تفاصيل المصدر» لعرضها تحت الاستشهاد */
  function citation(kind, id){
    var e = (window.EVIDENCE || {})[id];
    if (!e) return null;
    return {kind:kind, id:id, status:e.v, ref:e.r || "",
            collections:(e.c || []).map(function(c){ return {book:c[0], number:c[1], kitab:c[2] || ""}; }),
            graders:(e.g || []).map(function(g){ return {name:g[0], verdict:g[1]}; })};
  }

  function compose(a, depth){
    if (DEPTHS.indexOf(depth) < 0) depth = "standard";
    var n = N[depth], u = a.understanding, r = a.retrieval, top = r.sits[0] || null;
    var dropped = [], cites = [];
    function keep(kind, id, text){
      var v = validate(kind, id, text);
      if (!v.ok){ dropped.push({kind:kind, id:id, reason:v.reason}); return false; }
      cites.push(citation(kind, id)); return true;
    }
    function lib(list, kind, max){
      var out = [];
      for (var i = 0; i < list.length && out.length < max; i++){ var x = list[i]; if (keep(kind, x.item.id, x.item.t)) out.push(x); }
      return out;
    }
    // الموقف الأقرب: أدلته المضمّنة (قرآن وحديث) تمر بالمدقق نفسه
    var sit = null;
    if (top){
      var s = top.s, q = [], h = [];
      (s.quranRefs || []).forEach(function(x, i){ if (keep("quran", s.id + "#q" + i, x.text)) q.push({ref:x, cite:citation("quran", s.id + "#q" + i)}); });
      (s.hadithRefs || []).forEach(function(x, i){ if (keep("hadith", s.id + "#" + i, x.text)) h.push({ref:x, cite:citation("hadith", s.id + "#" + i)}); });
      sit = {s:s, quran:q, hadith:h, depth:depth === "deep" ? (s.depth || null) : null,
             observations:depth === "brief" ? [] : (s.behaviorObservations || []),
             principles:depth === "brief" ? [] : (s.principles || []),
             applications:(s.modernApplications || []).slice(0, depth === "brief" ? 2 : 99),
             limits:s.notToApplyTo || [], reflection:depth === "brief" ? "" : (s.reflection || "")};
    }
    var duas = [];
    (r.duas || []).forEach(function(d){ if (duas.length < n.duas && keep(d.kind === "quran" ? "quran" : "hadith", d.item.id, d.item.t)) duas.push(d); });
    var paras = String(a.reading || "").split(/\n\n+/).filter(Boolean);
    return {
      depth:depth, safety:!!(u.crisis || u.softRisk),
      reading:paras.slice(0, n.para), readingCut:paras.length > n.para,
      insights:depth === "brief" ? [] : a.insights,
      distinctions:u.crisis ? [] : (u.distinctions || []).slice(0, n.distinctions),
      sit:sit,
      others:r.sits.slice(1, 1 + n.others),
      ayat:lib(r.ayat || [], "quran", n.ayat),
      hadith:lib(r.hadith || [], "hadith", n.hadith),
      plan:depth === "brief" ? {now:a.plan.now, week:[], long:[]} : a.plan,
      duas:duas,
      questions:a.questions.slice(0, n.questions),
      avoid:a.avoid.slice(0, n.avoid),
      citations:cites, dropped:dropped
    };
  }
  return {DEPTHS:DEPTHS, compose:compose, validate:validate, citation:citation, fingerprint:fp, shown:shown, letters:letters};
})();
