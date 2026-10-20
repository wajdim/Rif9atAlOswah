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

  /* كيف يُقدَّم النص: الآية «قال الله تعالى»، والحديث بحسب نوعه (js/data-attrib.js، يولّده build/kb/attrib.js):
     qala «قال رسول الله ﷺ» · qudsi «فيما يرويه عن ربه» · report «من السنة النبوية» · dua «من الأدعية النبوية»
     · athar «من الآثار والروايات» (كلام صحابي أو خبر تاريخي) · none خلاصة بالمعنى: بلا تقديم */
  function attrib(kind, id){
    if (kind === "quran") return "quran";
    return ((window.ATTRIB || {})[id]) || "qala";
  }

  /* وضوح الرسالة: lost لم يُفهم منها شيء (نطلب التفاصيل قبل أي إجابة) · vague ضيق غير محدد (قراءات محتملة)
     · ambiguous موضوعان متقاربان (اختيار اختياري) · clear */
  var AMBIG = 0.75;
  function ambiguous(a){
    var u = a.understanding, t = u.themes;
    if (u.crisis || u.softRisk || u.focus || u.sit || (u.facets || []).length >= 2 || (u.interpretations || []).length) return [];
    if (t.length < 2 || t[1].score < AMBIG * t[0].score) return [];
    return t.slice(0, 3).filter(function(x, i){ return i < 2 || x.score >= 0.6 * t[0].score; }).map(function(x){ return x.id; });
  }
  function clarity(a){
    var u = a.understanding;
    if (u.crisis || u.softRisk || u.focus || u.sit) return "clear";
    if (!u.themes.length && !(u.interpretations || []).length) return "lost";
    if ((u.interpretations || []).length >= 2) return "vague";
    return ambiguous(a).length ? "ambiguous" : "clear";
  }

  /* محاور الرسالة (js/data-facets.js) ← فصول: لكل محور قراءته وآية وحديث من المكتبة الموثقة وخطوات وموقف من السيرة،
     وفقرة تجمع ألفاظ المستخدم، وما يربط بين المحاور. النصوص الشرعية تمر بالمدقق نفسه، ولا تتكرر بين الفصول. */
  var CH = {brief:{ayat:1, hadith:1, steps:2, insight:false}, standard:{ayat:1, hadith:1, steps:3, insight:true}, deep:{ayat:2, hadith:2, steps:4, insight:true}};
  function lang(o){ return o ? ((window.I18N && I18N.en) ? (o.en || o.ar) : o.ar) : ""; }
  function chapters(a, depth, keep, used){
    var F = window.FACETS, u = a.understanding, fs = u.facets || [];
    if (!F || fs.length < 2 || u.crisis || !window.RAG) return null;
    var c = CH[depth], r = a.retrieval, tx = lang(F.text);
    var names = fs.map(function(f){ return lang(F.domains[f.id]).phrase; });
    var list = names.slice(0, -1).join(tx.sep) + (names.length === 2 ? tx.two : tx.last) + names[names.length - 1];
    var setting = fs.filter(function(f){ return f.kind === "setting"; })[0] || null;
    var link = setting && F.link[setting.id] ? F.link[setting.id] : fs.every(function(f){ return f.kind === "relation"; }) ? F.link.relations : F.link.other;
    var usedSit = {}; if (r.sits[0]) usedSit[r.sits[0].s.id] = 1;
    function pick(kind, retrieved, all, theme, max, dom){
      // ما موضوعه الأول هو المحور نفسه أولًا بترتيب المكتبة (أصول الباب قبل فروعه)، ثم ما يتصل به
      var ret = (retrieved || []).filter(function(x){ return x.via.indexOf(theme) > -1; }).map(function(x){ return x.item; });
      var lib0 = all.filter(function(it){ return it.th.indexOf(theme) > -1 && !it.dua && !it.sensitive; });
      var main = function(it){ return it.th[0] === theme; }, side = function(it){ return it.th[0] !== theme; };
      var lead = ((F.lead || {})[dom] || []).filter(function(id){ return (id.charAt(0) === "q") === (kind === "quran"); })
        .map(function(id){ return RAG.byId(kind, id); }).filter(Boolean);
      var out = [], cand = lead.concat(lib0.filter(main), ret.filter(main), ret.filter(side), lib0.filter(side));
      for (var i = 0; i < cand.length && out.length < max; i++){
        var it = cand[i]; if (used[it.id]) continue;
        if (!keep(kind, it.id, it.t)) continue;
        used[it.id] = 1; out.push(it);
      }
      return out;
    }
    var chs = fs.map(function(f, i){
      var t = RAG.byId("theme", f.theme), d = lang(F.domains[f.id]);
      var steps = t.plan.now.slice(0, Math.min(2, c.steps)).concat(t.plan.week.slice(0, Math.max(0, c.steps - 2)));
      var sit = null;
      r.sits.forEach(function(x){ if (!sit && !usedSit[x.s.id] && x.via.indexOf(f.theme) > -1) sit = x.s; });
      (t.sits || []).forEach(function(id){ var s = RAG.byId("sit", id); if (!sit && s && !usedSit[id]) sit = s; });
      if (sit) usedSit[sit.id] = 1;
      return {n:i + 1, id:f.id, theme:f.theme, kind:f.kind, name:d.name, ev:f.ev.slice(0, 3),
              insight:c.insight ? t.insight : "", pair:setting && f !== setting ? lang(F.pair[setting.id + "|" + f.id]) : "",
              ayat:pick("quran", r.ayat, window.QURAN_LIB || [], f.theme, c.ayat, f.id),
              hadith:pick("hadith", r.hadith, window.HADITH_LIB || [], f.theme, c.hadith, f.id),
              steps:steps, sit:sit};
    });
    return {intro:tx.intro.replace("{0}", tx.count[fs.length]).replace("{1}", list), order:tx.order, link:lang(link),
            setting:setting ? lang(F.domains[setting.id]).name : "", chapters:chs};
  }

  function compose(a, depth){
    if (DEPTHS.indexOf(depth) < 0) depth = "standard";
    var n = N[depth], u = a.understanding, r = a.retrieval, top = r.sits[0] || null;
    var dropped = [], cites = [], used = {};
    function keep(kind, id, text){
      var v = validate(kind, id, text);
      if (!v.ok){ dropped.push({kind:kind, id:id, reason:v.reason}); return false; }
      cites.push(citation(kind, id)); return true;
    }
    function lib(list, kind, max){
      var out = [];
      for (var i = 0; i < list.length && out.length < max; i++){ var x = list[i]; if (!used[x.item.id] && keep(kind, x.item.id, x.item.t)) out.push(x); }
      return out;
    }
    var chs = chapters(a, depth, keep, used);
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
      insights:depth === "brief" || chs ? [] : a.insights,
      chapters:chs, clarity:clarity(a), ambiguous:ambiguous(a),
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
  return {DEPTHS:DEPTHS, compose:compose, validate:validate, citation:citation, fingerprint:fp, shown:shown, letters:letters,
          attrib:attrib, clarity:clarity, ambiguous:ambiguous, AMBIG:AMBIG};
})();
