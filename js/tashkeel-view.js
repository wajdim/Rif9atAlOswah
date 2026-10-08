/* ======================================================================
   رِفقة الأُسوة — عرض النصوص الشارحة مشكولة (اختياري من الإعدادات)
   ----------------------------------------------------------------------
   - الآيات والأحاديث مشكولة دائمًا من مصادرها ولا يمسّها هذا الملف.
   - يمرّ على نصوص الصفحة: إن طابق النص كاملًا نصًا مشكولًا في PROSE_TASHKEEL.s
     عُرض كما هو، وإلا شُكّلت كلماته من قاموس الكلمات (الضبط الغالب بلا حركة الإعراب
     الأخيرة)، فالنصوص المركّبة آليًا تُشكَّل جزئيًا بأمان.
   - لا يغيّر أي حرف: المطابقة بالحروف المجردة فقط. ويحفظ الأصل لإعادته عند الإطفاء.
   ====================================================================== */
var TashkeelView = (function(){
  "use strict";
  var P = window.PROSE_TASHKEEL || {s:{}, w:{}};
  var SKIP = ".tk-done,[data-q],[data-voice],.evidence-quote,.dt,.d-text,.li-text,.user-quote,textarea,input,select,script,style,code,.ai-body,.cite";
  var on = false, touched = [], touchedAttrs = [], observer = null, pending = false;
  var AR = /[ء-ي]/;

  function lk(ch){ return "أإآٱا".indexOf(ch)>-1?"ا":"ىي".indexOf(ch)>-1?"ي":"ؤئء".indexOf(ch)>-1?"ء":ch==="ة"?"ه":ch; }
  function key(t){ var o=""; for(var i=0;i<t.length;i++){ var c=t[i]; if(c!=="ـ" && /[ء-يٱ]/.test(c)) o+=lk(c); } return o; }
  function stripMarks(t){ return t.replace(/[ً-ْٰ]/g, ""); }

  function vocalize(text){
    var trimmed = text.trim(); if (!AR.test(trimmed)) return null;
    // 1) النص كاملًا: يُقبل فقط إن طابق الأصل حرفًا حرفًا (بما فيه الترقيم) بعد حذف الحركات،
    //    وإن كان في الأصل حركات جزئية (كـ«يُندم») فحركات الأصل هي المعتمدة على حروفها
    var whole = P.s[key(trimmed)];
    if (whole && stripMarks(whole).replace(/ـ/g, "") === stripMarks(trimmed).replace(/ـ/g, "")) return text.replace(trimmed, keepMarks(trimmed, whole));
    // 2) كلمةً كلمة: الكلمة المشكولة أصلًا تبقى كما هي، والباقي بضبطه الوقفي (بلا حركة إعراب أخيرة)
    var changed = false;
    var out = text.replace(/[ء-يٱً-ْٰـ]+/g, function(w){
      if (/[ً-ْٰ]/.test(w)) return w;
      var v = P.w[key(w)];
      if (!v || key(v) !== key(w)) return w;
      changed = true;
      return applyOnto(w, pausal(v));
    });
    return changed ? out : null;
  }
  /** حركات كل حرف (بعد حذف التطويل) */
  function marksOf(t){
    var m = [], cur = -1; t = t.replace(/ـ/g, "");
    for (var i = 0; i < t.length; i++) { if (/[ً-ْٰ]/.test(t[i])) { if (cur >= 0) m[cur] = (m[cur] || "") + t[i]; } else { cur++; } }
    return m;
  }
  /** النص المشكول، مع إبقاء حركات الأصل على حروفها حيث وُجدت */
  function keepMarks(orig, voc){
    if (!/[ً-ْٰ]/.test(orig)) return voc;
    var a = marksOf(orig), b = marksOf(voc), base = stripMarks(orig).replace(/ـ/g, ""), out = "";
    for (var i = 0; i < base.length; i++) out += base[i] + (a[i] || b[i] || "");
    return out;
  }
  /** الضبط الوقفي: حذف حركة الحرف الأخير (مع إبقاء الشدة) — صحيح في كل سياق */
  function pausal(v){ return v.replace(/([ء-يٱ])(ّ?)[ً-ِْ]+$/, "$1$2"); }
  // يضع حركات v على حروف w نفسها (يحافظ على شكل الهمزات والألف كما في الأصل)
  function applyOnto(w, v){
    var marks = [], cur = -1;
    for (var i = 0; i < v.length; i++) { var c = v[i]; if (/[ً-ْٰ]/.test(c)) { if (cur >= 0) marks[cur] = (marks[cur] || "") + c; } else { cur++; } }
    var base = stripMarks(w).replace(/ـ/g, ""), out = "", j = 0;
    for (var k = 0; k < base.length; k++) { out += base[k] + (marks[j] || ""); j++; }
    return out;
  }

  var ATTRS = ["placeholder", "title", "aria-label"];
  function applyAttrs(root){
    root.querySelectorAll("[placeholder],[title],[aria-label]").forEach(function(el){
      ATTRS.forEach(function(a){
        var v = el.getAttribute(a); if (!v || !AR.test(v) || el["__tk_" + a] === v) return;
        var o = v, nv = vocalize(o);                 // قيمة جديدة من التطبيق = أصل جديد
        if (nv) { el.setAttribute("data-tk-" + a, o); el.setAttribute(a, nv); el["__tk_" + a] = nv; touchedAttrs.push(el); }
      });
    });
  }
  function apply(root){
    if (!on || !root) return;
    applyAttrs(root);
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {acceptNode: function(n){
      if (!n.nodeValue || !AR.test(n.nodeValue) || n.__tk) return NodeFilter.FILTER_REJECT;
      var p = n.parentElement; if (!p || p.closest(SKIP)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }});
    var list = [], n; while ((n = walker.nextNode())) list.push(n);
    list.forEach(function(node){
      var v = vocalize(node.nodeValue);
      if (v && v !== node.nodeValue) { node.__orig = node.nodeValue; node.__tk = true; node.nodeValue = v; touched.push(node); }
    });
  }
  function restore(){
    touched.forEach(function(n){ if (n.__orig != null) { n.nodeValue = n.__orig; n.__orig = null; n.__tk = false; } });
    touched = [];
    touchedAttrs.forEach(function(el){ ATTRS.forEach(function(a){ var o = el.getAttribute("data-tk-" + a); if (o != null) { el.setAttribute(a, o); el.removeAttribute("data-tk-" + a); el["__tk_" + a] = null; } }); });
    touchedAttrs = [];
  }
  function schedule(){
    if (pending) return; pending = true;
    (window.requestAnimationFrame || setTimeout)(function(){ pending = false; touched = touched.filter(function(n){ return n.isConnected; }); apply(document.body); });
  }
  return {
    available: function(){ return Object.keys(P.s).length > 0; },
    set: function(enabled){
      on = !!enabled && this.available();
      if (on) {
        apply(document.body);
        if (!observer && window.MutationObserver) { observer = new MutationObserver(schedule); observer.observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:["placeholder"]}); }
      } else { if (observer) { observer.disconnect(); observer = null; } restore(); }
      if (typeof this.onChange === "function") this.onChange(on);
    },
    enabled: function(){ return on; },
    /** يشكّل نصًا كاملًا (للنصوص التي تُقسَّم قبل العرض) */
    vocalizeString: function(t){ return vocalize(String(t || "")) || String(t || ""); },
    onChange: null
  };
})();
