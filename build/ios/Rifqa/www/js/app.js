/* ======================================================================
   رِفقة الأُسوة — طبقة الواجهة (v2)
   كل نص في الواجهة يمر عبر T() (js/i18n.js): بالعربية كما هو، وبالإنجليزية من القاموس.
   ====================================================================== */
(function(){
"use strict";

/* ---------------- أدوات عامة ---------------- */
function qs(id){ return document.getElementById(id); }
function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];}); }
function toast(msg,ms){ var t=qs("toast"); t.textContent=msg; t.classList.add("show"); clearTimeout(toast._t); toast._t=setTimeout(function(){t.classList.remove("show");},ms||2200); }
var APP_VERSION="2.6.0";
var EN=I18N.en;
function store(key, val){ try{ if(val===undefined) return JSON.parse(localStorage.getItem(key)||"null"); localStorage.setItem(key, JSON.stringify(val)); }catch(e){ return null; } }
function iconSvg(k){ return '<svg viewBox="0 0 24 24">'+(ICONS[k]||ICONS.star)+'</svg>'; }
function badgeClass(s){ return s==="موثق بدرجة عالية"?"badge-high":s==="موثق"?"badge-mid":"badge-low"; }
function gradeClass(g){ return /صحيح/.test(g)?"g-sahih":"g-hasan"; }
/* النص المشكول: الآيات من مصحف Tanzil، والأحاديث والأذكار مشكولة للنطق (js/data-tashkeel.js) */
function qText(surah, ayah, plain){ return (window.TASHKEEL && TASHKEEL.quranFor(surah, ayah, plain)) || plain; }
function sayText(plain){ return (window.TASHKEEL && TASHKEEL.speech(plain)) || plain; }
function hText(plain){ return sayText(plain); }   // الحديث يُعرض مشكولًا دائمًا
/** «القراءة القرآنية النبوية»: كل عبارة في سطر.
    - يُشكَّل النص كاملًا أولًا (إن كان التشكيل مفعّلًا) ثم يُقسَّم، حتى يطابق النص المشكول المحفوظ.
    - التقسيم عند . ؛ : ، (و; , بالإنجليزية) خارج «» و“” و﴿﴾ والأقواس؛ والعبارة القصيرة تُضم لما بعدها.
    - السطر الأول = الفكرة الرئيسة (بارز)، وما قبل «:» عنوان فكرة (بخط عريض)، والشواهد مظللة. */
function insightLines(text){
  var t=String(text||""), tk=!EN && window.TashkeelView && TashkeelView.enabled();
  if(tk) t=TashkeelView.vocalizeString(t);
  var parts=[], cur="", depth=0;
  for(var i=0;i<t.length;i++){
    var ch=t[i]; cur+=ch;
    if("«﴿(“".indexOf(ch)>-1) depth++; else if("»﴾)”".indexOf(ch)>-1) depth=Math.max(0,depth-1);
    var endQ = EN && depth===0 && ch==="”" && ".!?".indexOf(t[i-1])>-1;   // نهاية جملة داخل اقتباس: “… forgive.”
    if((endQ || (depth===0 && (EN?".;":".؛:،;,").indexOf(ch)>-1)) && (i+1>=t.length || t[i+1]===" ")){ parts.push({text:cur.trim(), end:endQ?".":ch}); cur=""; }  // الإنجليزية: تقطيع بالجمل فقط
  }
  if(cur.trim()) parts.push({text:cur.trim(), end:""});
  var lines=[], hold=null;                                      // ضم العبارات القصيرة (أقل من 4 كلمات)
  parts.forEach(function(p){
    if(hold){ p={text:hold.text+" "+p.text, end:p.end, key:hold.key}; hold=null; }
    if(p.end===":" ){ p.key=true; }
    if(!p.key && (p.end==="،"||p.end===",") && p.text.split(/\s+/).length<(EN?6:4)){ hold=p; return; }
    lines.push(p);
  });
  if(hold) lines.push(hold);
  var keyNext=false;
  return '<ul class="ins-lines'+(tk?' tk-done':'')+'">'+lines.map(function(p,i){
    var h=esc(p.text).replace(/«([^»]+)»/g,'<mark class="ins-ev">«$1»</mark>').replace(/“([^”]+)”/g,'<mark class="ins-ev">“$1”</mark>').replace(/﴿([^﴾]+)﴾/g,'<mark class="ins-ev q">﴿$1﴾</mark>');
    var cls="ins-line"+(i===0?" ins-lead":"")+(p.key&&i>0?" ins-head":"")+(keyNext?" ins-sub":"");
    keyNext=!!p.key || (keyNext && (p.end==="،"||p.end===","));
    return '<li class="'+cls+'">'+h+'</li>';
  }).join("")+'</ul>';
}
function figureOf(s){ return s.figure?T(s.figure):T("النبي ﷺ"); }
function copyText(text){
  function fallback(){ var ta=document.createElement("textarea"); ta.value=text; ta.style.position="fixed"; ta.style.opacity="0"; document.body.appendChild(ta); ta.select(); try{document.execCommand("copy");}catch(e){} ta.remove(); toast(T("تم النسخ")); }
  if(window.AndroidBridge && window.AndroidBridge.copy){ window.AndroidBridge.copy(text); toast(T("تم النسخ")); return; }
  if(navigator.clipboard && window.isSecureContext){ navigator.clipboard.writeText(text).then(function(){toast(T("تم النسخ"));},fallback); } else fallback();
}
RAG.build();

/* ---------------- التفضيلات والمحفوظات ---------------- */
var prefs=store("rifqa.prefs")||{theme:"auto",fs:"1"};
TTS.setRate(prefs.rate||1);
setTimeout(function(){ TTS.configure(TTS_CFG()); },0);
function applyPrefs(p){
  p=p||prefs;
  var r=document.documentElement;
  if(p.theme==="auto") r.removeAttribute("data-theme"); else r.setAttribute("data-theme",p.theme);
  r.style.setProperty("--fs",p.fs||"1");
  var dark = p.theme==="dark" || (p.theme==="auto" && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
  var m=document.querySelector('meta[name="theme-color"]'); if(m) m.setAttribute("content", dark?"#141B17":"#2F4C3E");
}
applyPrefs();
/** تبديل لغة الواجهة: يُحفظ ويُعاد تحميل التطبيق باللغة الجديدة */
function setLang(l){
  if(l===I18N.lang) return;
  stopReading(); prefs=store("rifqa.prefs")||prefs; prefs.lang=l; store("rifqa.prefs",prefs);
  try{ history.replaceState({screen:"home"},""); }catch(e){}
  location.reload();
}
var saved=store("rifqa.saved")||{sit:[],quran:[],hadith:[]};
function isSaved(kind,id){ return (saved[kind]||[]).indexOf(id)>-1; }
function toggleSave(kind,id){
  saved[kind]=saved[kind]||[];
  var i=saved[kind].indexOf(id);
  if(i>-1){ saved[kind].splice(i,1); toast(T("أُزيل من المحفوظات")); } else { saved[kind].unshift(id); toast(T("حُفظ في المحفوظات")); }
  store("rifqa.saved",saved);
  document.querySelectorAll('[data-save="'+kind+':'+CSS.escape(id)+'"]').forEach(function(b){ b.classList.toggle("on", isSaved(kind,id)); });
  if(currentScreen==="saved") renderSaved();
}
function saveBtn(kind,id){
  var on=isSaved(kind,id);
  return '<button class="save-btn'+(on?" on":"")+'" data-save="'+kind+':'+esc(id)+'" title="'+T("حفظ")+'"><svg viewBox="0 0 24 24"><path d="M6 4h12v16l-6-4-6 4z"/></svg>'+T("حفظ")+'</button>';
}

/* ---------------- التنقل (مع دعم زر الرجوع في أندرويد والمتصفح) ---------------- */
var currentScreen="home";
function showScreen(name, push){
  document.querySelectorAll(".screen").forEach(function(el){ el.classList.remove("active"); });
  var el=qs("screen-"+name); if(!el) return;
  if(name!==currentScreen) stopReading();
  el.classList.add("active"); currentScreen=name;
  document.querySelectorAll("[data-nav]").forEach(function(b){ if(b.classList.contains("icon-btn")) b.classList.toggle("active", b.getAttribute("data-nav")===name); });
  window.scrollTo(0,0);
  if(push!==false && name!=="loading"){ try{ history.pushState({screen:name},""); }catch(e){} }
}
window.addEventListener("popstate",function(e){
  if(qs("detailPanel").classList.contains("open")){ closeDetail(true); return; }
  var st=e.state||{screen:"home"};
  if(st.screen==="loading") st.screen="home";
  showScreen(st.screen||"home", false);
});

/* ---------------- الشاشة الرئيسية ---------------- */
var HOME_THEMES=["anger","sadness","anxiety","marriage","parents","parenting","betrayal","sin","debt","illness","decision","loneliness"];
function renderHome(){
  qs("homeThemes").innerHTML='<h3>'+T("أو ابدأ من موضوع")+'</h3><div class="row">'+HOME_THEMES.map(function(id){
    var t=RAG.byId("theme",id); return t?'<button class="theme-chip" data-theme-open="'+id+'">'+iconSvg(t.icon)+esc(t.label)+'</button>':"";
  }).join("")+'<button class="theme-chip" data-nav="explore">'+T("كل الموضوعات ‹")+'</button></div>';
  qs("statsHero").innerHTML=[T("{0} موقفًا وقصة",SITUATIONS.length), T("{0} آية وموضعًا",QURAN_LIB.length), T("{0} حديثًا وذكرًا",HADITH_LIB.length), T("{0} موضوعًا حياتيًا",THEMES.length)]
    .map(function(s){return '<span class="mini-pill">'+s+'</span>';}).join("");
  // آية أو حديث اليوم (ثابت لليوم نفسه)
  var day=Math.floor(Date.now()/86400000), pool=QURAN_LIB.filter(function(q){return !q.dua;}).concat(HADITH_LIB.filter(function(h){return !h.dua;}));
  var it=pool[(day*7919)%pool.length], isQ=!!it.s;
  qs("dailyCard").innerHTML='<div class="card"><div class="d-label">'+(isQ?T("آية اليوم"):T("حديث اليوم"))+'</div><div class="d-text"'+AR_ATTR+'>'+(isQ?"﴿ "+esc(qText(it.s,it.a,it.t))+" ﴾":"«"+esc(hText(it.t))+"»")+'</div>'+
    (isQ?enAyah(it.s,it.a):enHadith(it.te))+
    '<div class="d-src">'+(isQ?esc(I18N.ref(it.s,it.a)):esc(it.r)+" — "+esc(I18N.src(it.src))+" — "+esc(I18N.grade(it.g)))+'</div><div class="ev-note">'+esc(it.n)+'</div></div>';
  var aiOn=AI.enabled(); qs("aiModeRow").hidden=!aiOn;
  if(aiOn) qs("aiAuto").checked=!!AI.load().auto;
}

/* ---------------- التنبيهات الحساسة ---------------- */
var SELF_HARM=["افكار انتحاريه","انتحار","انتحر","اذي نفسي","اؤذي نفسي","اريد ان اموت","اريد الموت","لا اريد ان اعيش","اقتل نفسي","انهي حياتي","ان انهي حياتي","نقتل روحي","نحب نموت","ما نحبش نعيش","حابب اموت","بدي موت","الموت ارحم","جرح نفسي","اجرح نفسي","suicide","suicidal","kill myself","end my life","want to die","wish i was dead","wish i were dead","hurt myself","harm myself","self harm","cut myself","no reason to live","me suicider","zelfmoord","suicidaal","mezelf van kant maken","mezelf iets aandoen","ik wil dood","ik wil sterven","wil niet meer leven","een eind aan mijn leven","mezelf pijn doen","zelfbeschadiging","mezelf snijden","suicidio","suicidarme","quiero morir","matarme","quitarme la vida","acabar con mi vida","no quiero vivir","hacerme daño","autolesión","cortarme","suicídio","suicidar-me","quero morrer","matar-me","tirar a minha vida","acabar com a minha vida","não quero viver","magoar-me","automutilação","cortar-me"];
var LEGAL=["طلاق","ميراث","ارث","الورث","حد شرعي","ربا","محامي","قضيه","محكمه","نفقه","خلع","حضانه","فتوي","عقد","divorce","inheritance","custody","lawyer","court case","lawsuit","alimony","fatwa","khula","riba","usury","scheiding","echtscheiding","erfenis","voogdij","advocaat","rechtszaak","rechtbank","alimentatie","rente","divorcio","herencia","custodia","abogado","juicio","pensión alimenticia","usura","herança","guarda dos filhos","advogado","tribunal","processo judicial","pensão de alimentos"];
var VIOLENCE=["عنف","يضربني","تضربني","ضربني","ضربتني","تعنيف","اعتداء","اغتصاب","تحرش","يهددني بالقتل","abuse","abusive","hits me","beats me","beat me","hit me","violence","violent","rape","assault","harass","threatens to kill","threatened to kill","mishandeling","mishandelt","slaat me","sloeg me","geweld","verkrachting","aanranding","intimidatie","bedreigt me","dreigt me te vermoorden","maltrato","me pega","me golpea","violencia","violación","agresión","acoso","amenaza con matarme","violência","me bate","bate-me","agressão","violação","assédio","ameaça matar-me","ameaça me matar"];
function checkFlags(text){
  var n=" "+RAG.normalize(text)+" ";
  function hit(list){ return list.some(function(k){ var nk=RAG.normalize(k); return /[a-z]/.test(nk) ? n.indexOf(" "+nk)>-1 : n.indexOf(nk)>-1; }); }
  return {selfHarm:hit(SELF_HARM), legal:hit(LEGAL), violence:hit(VIOLENCE)};
}

/* ---------------- التشغيل ---------------- */
var STAGES=["أقرأ ما كتبته وأفهم سياقه…","أكتشف الموضوعات والمشاعر وطبيعة العلاقة…","أسترجع المواقف القريبة من السيرة وقصص الأنبياء…","أبحث في الآيات والأحاديث المرتبطة…","أراجع درجات النصوص ومصادرها…","أبني القراءة والخطة العملية…"];
var lastAnalysis=null, aiSession=null;
function runSearch(text){
  text=(text||"").trim();
  if(text.length<4){ toast(T("اكتب موقفك بتفصيل أكثر قليلًا")); qs("userInput").focus(); return; }
  showScreen("loading",false);
  var list=qs("stageList");
  list.innerHTML=STAGES.map(function(m,i){ return '<div class="stage-item" id="stage-'+i+'"><span class="dot"></span><span>'+T(m)+'</span></div>'; }).join("");
  var i=0, result=null;
  // التحليل الفعلي يُنفّذ فورًا؛ المراحل المرئية للإيضاح فقط
  setTimeout(function(){ result={a:RAG.analyze(text), flags:checkFlags(text)}; },0);
  (function step(){
    if(i>0) qs("stage-"+(i-1)).classList.replace("active","done");
    if(i<STAGES.length){ qs("stage-"+i).classList.add("active"); i++; setTimeout(step, 300); }
    else setTimeout(function(){
      result.a.id=Date.now().toString(36); lastAnalysis=result.a;
      window.__lastFlags=result.flags; renderResult(result.a, result.flags);
      showScreen("result");
      if(AI.enabled() && qs("aiAuto").checked) startAI();
    }, 250);
  })();
}

/* ---------------- مكونات عرض النصوص ---------------- */
/* في الواجهة الإنجليزية: نص الآية والحديث العربي يبقى كما هو (من اليمين إلى اليسار)، وتحته المعنى بالإنجليزية */
var AR_ATTR=EN?' lang="ar" dir="rtl"':'';
var AR_VOICE=EN?'data-voice="ar"':'data-voice="1"';      // محرك النطق الإنجليزي لا يقرأ العربية: يُقرأ المعنى بدلها
function enAyah(s,a){ if(!EN) return ""; var t=I18N.quranEn(s,a); return t?'<div class="en-trans" data-voice="1">'+esc(t)+'</div>':""; }
function enHadith(te){ return EN&&te?'<div class="en-trans" data-voice="1">“'+esc(te)+'”</div>':""; }
function themeTags(via){
  if(!via||!via.length) return "";
  return '<div class="tag-row" style="margin-top:8px;">'+via.slice(0,3).map(function(t){ return '<span class="tag soft">'+esc(RAG.themeLabel(t))+'</span>'; }).join("")+'</div>';
}
function ayahHTML(q, via){
  return '<div class="evidence-item"><div class="evidence-tag">'+T("قرآن كريم")+' — '+esc(I18N.ref(q.s,q.a))+'</div>'+
    '<div class="evidence-quote" data-q="'+esc(q.s)+'|'+esc(q.a)+'"'+AR_ATTR+'>﴿ '+esc(qText(q.s,q.a,q.t))+' ﴾</div>'+enAyah(q.s,q.a)+'<div class="ev-note">'+esc(q.n)+'</div>'+themeTags(via)+
    '<div class="ev-actions"><button class="mini-btn" data-copy="﴿'+esc(qText(q.s,q.a,q.t))+'﴾ ['+esc(I18N.ref(q.s,q.a))+']'+(EN?esc("\n"+I18N.quranEn(q.s,q.a)):"")+'">'+T("نسخ")+'</button>'+saveBtn("quran",q.id)+'</div></div>';
}
function hadithHTML(h, via){
  return '<div class="evidence-item"><div class="evidence-tag">'+T("حديث نبوي")+'<span class="grade '+gradeClass(h.g)+'">'+esc(I18N.grade(h.g))+'</span></div>'+
    '<div class="evidence-quote" '+AR_VOICE+AR_ATTR+' style="font-size:1.04rem;">«'+esc(hText(h.t))+'»</div>'+enHadith(h.te)+
    '<div class="evidence-meta">'+T("الراوي:")+' '+esc(h.r)+' — '+esc(I18N.src(h.src))+'</div><div class="ev-note">'+esc(h.n)+'</div>'+themeTags(via)+
    '<div class="ev-actions"><button class="mini-btn" data-copy="«'+esc(hText(h.t))+'»'+(EN&&h.te?esc("\n“"+h.te+"”"):"")+' — '+esc(I18N.src(h.src))+' ('+esc(I18N.grade(h.g))+')">'+T("نسخ")+'</button>'+saveBtn("hadith",h.id)+'</div></div>';
}
function duaHTML(d){
  var it=d.item, isQ=d.kind==="quran";
  return '<div class="dua-card"><div class="dw">'+esc(it.w||(isQ?T("دعاء قرآني"):T("ذكر مأثور")))+'</div><div class="dt" '+(isQ?'data-q="'+esc(it.s)+'|'+esc(it.a)+'"':AR_VOICE)+AR_ATTR+'>'+(isQ?"﴿ "+esc(qText(it.s,it.a,it.t))+" ﴾":esc(hText(it.t)))+'</div>'+
    (isQ?enAyah(it.s,it.a):enHadith(it.te))+
    '<div class="ds">'+(isQ?esc(I18N.ref(it.s,it.a)):esc(I18N.src(it.src))+" — "+esc(I18N.grade(it.g)))+'</div>'+
    '<div class="ev-actions"><button class="mini-btn" data-copy="'+esc(it.t)+(EN?esc("\n"+(isQ?I18N.quranEn(it.s,it.a):(it.te||""))):"")+'">'+T("نسخ")+'</button></div></div>';
}
function sitEvidenceHTML(s){
  var h="";
  (s.quranRefs||[]).forEach(function(q){
    h+='<div class="evidence-item"><div class="evidence-tag">'+T("قرآن كريم")+' — '+esc(I18N.ref(q.surahName,q.ayahNumber))+'</div><div class="evidence-quote" data-q="'+esc(q.surahName)+'|'+esc(q.ayahNumber)+'"'+AR_ATTR+'>﴿ '+esc(qText(q.surahName,q.ayahNumber,q.text))+' ﴾</div>'+enAyah(q.surahName,q.ayahNumber)+
      (q.context?'<div class="evidence-meta">'+esc(q.context)+'</div>':"")+'<div class="evidence-relevance">'+esc(q.relevance||"")+'</div></div>';
  });
  (s.hadithRefs||[]).forEach(function(x){
    h+='<div class="evidence-item"><div class="evidence-tag">'+(x.paraphrase?T("خلاصة الرواية"):T("نص الحديث"))+'<span class="grade '+gradeClass(x.grade)+'">'+esc(I18N.grade(x.grade))+'</span>'+(x.paraphrase?'<span class="paraphrase">'+T("بالمعنى لا باللفظ")+'</span>':"")+'</div>'+
      '<div class="evidence-quote" '+AR_VOICE+AR_ATTR+' style="font-size:1.02rem;">«'+esc(hText(x.text))+'»</div>'+enHadith(x.te)+'<div class="evidence-meta">'+T("الراوي:")+' '+esc(x.narrator)+' — '+esc(I18N.src(x.source))+'</div></div>';
  });
  if(s.seerahSources && s.seerahSources.length && s.sourceStrength==="رواية تاريخية"){
    h+='<div class="evidence-item"><div class="evidence-tag">'+T("من كتب السيرة")+'</div><div class="evidence-relevance">'+T("وردت تفاصيل هذا الموقف في مصادر السيرة المعتبرة ({0})، وبعض ألفاظه محل نقاش عند نقّاد الحديث، فهو خبر تاريخي معتمد في كتب السيرة لا حديث بدرجة الصحيح.", esc(s.seerahSources.map(function(x){return T(x);}).join(T("، "))))+'</div></div>';
  }
  return h || '<div class="evidence-relevance">'+T("المصادر:")+' '+esc((s.seerahSources||[]).map(function(x){return T(x);}).join(T("، ")))+'</div>';
}
function list(arr,cls){ return '<'+(cls==="steps"?"ol":"ul")+' class="'+(cls||"bullets")+'">'+arr.map(function(x){return "<li>"+esc(x)+"</li>";}).join("")+'</'+(cls==="steps"?"ol":"ul")+'>'; }
/** فصل قابل للطي: مطويّ افتراضيًا ليرى المستخدم كل الفصول ثم يفتح ما يريد */
function section(num,title,body){
  return '<div class="section collapsible collapsed"><div class="section-title" role="button" tabindex="0" aria-expanded="false"><span class="section-num">'+num+'</span><span class="st-text">'+title+'</span><span class="st-chev" aria-hidden="true"></span></div><div class="sec-body">'+body+'</div></div>';
}
function toggleSection(sec, open){
  if(!sec) return;
  var o = open===undefined ? sec.classList.contains("collapsed") : open;
  sec.classList.toggle("collapsed", !o);
  var t=sec.querySelector(":scope > .section-title"); if(t) t.setAttribute("aria-expanded", o?"true":"false");
}
function foldBarHTML(){
  return '<div class="fold-bar tts-skip"><button class="mini-btn" data-act="fold-open">'+T("فتح كل الفصول")+'</button><button class="mini-btn" data-act="fold-close">'+T("طي كل الفصول")+'</button></div>';
}
function foldAll(root, open){ (root||document).querySelectorAll(".section.collapsible").forEach(function(s){ toggleSection(s, open); }); }
function planTabsHTML(){
  return '<div class="plan-tabs"><button class="plan-tab active" data-plan="now">'+T("الآن")+'</button><button class="plan-tab" data-plan="week">'+T("هذا الأسبوع")+'</button><button class="plan-tab" data-plan="long">'+T("على المدى البعيد")+'</button></div>';
}
function strengthBadge(s){ return '<span class="badge '+badgeClass(s.sourceStrength)+'">'+esc(T(s.sourceStrength))+'</span>'; }

/* ---------------- عرض النتيجة ---------------- */
function renderResult(a, flags){
  var u=a.understanding, r=a.retrieval, top=r.sits[0], out="", n=0;
  out+='<div class="result-toolbar tts-skip">'+listenBtnHTML("result",T("استمع للإجابة كاملة"))+foldBarHTML()+'</div>';
  out+='<div class="user-quote">'+(EN?"“"+esc(a.input)+"”":"«"+esc(a.input)+"»")+'</div>';

  if(flags.selfHarm){
    out+='<div class="notice crisis"><b>'+T("قبل أي شيء آخر")+'</b>'+T("ما كتبته يدل على ألم كبير، ونحن نأخذه بجدية. حياتك غالية عند الله وعند من يحبك: «ولا تقتلوا أنفسكم إن الله كان بكم رحيمًا». هذا التطبيق تأملي ولا يكفي وحده لأزمة كهذه. أرجوك تواصل الآن مع شخص تثق به، أو مع خط مساعدة الأزمات النفسية في بلدك، أو أقرب قسم طوارئ. طلب المساعدة قوة لا ضعف، وأنت لست وحدك.")+'</div>';
  }
  if(flags.violence){
    out+='<div class="notice crisis"><b>'+T("سلامتك أولًا")+'</b>'+T("يبدو أن حالتك تتضمن عنفًا أو إيذاءً. لا يطلب منك الإسلام البقاء تحت الأذى باسم الصبر: «لا ضرر ولا ضرار». إن كنت في خطر فابتعد إلى مكان آمن وتواصل مع جهة حماية أو الشرطة أو شخص موثوق، ثم مع مختص أسري وقانوني.")+'</div>';
  }
  if(flags.legal){
    out+='<div class="notice"><b>'+T("جانب شرعي أو قانوني دقيق")+'</b>'+T("يتضمن موقفك مسألة (كالطلاق أو الميراث أو الحقوق) لها أحكام تفصيلية. ما يلي مبادئ وتوجيهات عامة للتأمل، وليس فتوى؛ ارجع إلى عالم شرعي مؤهل أو مختص قانوني للحكم في حالتك.")+'</div>';
  }

  if(!top || a.confidence==="low"){
    out+='<div class="confidence-note">'+T("لم أجد في المكتبة الحالية ما يطابق حالتك بدرجة كافية. جرّب إضافة تفاصيل: من الطرف الآخر؟ ماذا حدث؟ بماذا تشعر؟ ماذا تريد أن تفعل؟ أو")+' <button class="btn-ghost" style="padding:4px 10px;" data-nav="explore">'+T("تصفح الموضوعات")+'</button></div>';
    if(!top){ qs("resultWrap").innerHTML=out+actionsHTML(); return; }
  }

  // 1) قراءة الموقف
  var themesShown=u.themes.filter(function(t){return t.conf>=0.3;}).slice(0,4);
  var confLabel={high:T("مطابقة قوية"),mid:T("مطابقة متوسطة"),low:T("مطابقة ضعيفة")}[a.confidence];
  out+='<div class="reading-card"><div class="rc-head"><div class="rc-title">'+T("قراءة أولية لموقفك")+'</div><span class="conf-pill conf-'+a.confidence+'">'+confLabel+'</span></div>'+
    '<div class="rc-text">'+esc(a.reading)+'</div><div class="dims">'+
    '<div><div class="dim-label">'+T("الموضوعات المكتشفة")+'</div>'+(themesShown.length?themesShown.map(function(t){
      return '<div class="bar-row"><span class="bl">'+esc(t.theme.label)+'</span><span class="bt"><span class="bf" style="width:'+Math.round(t.conf*100)+'%"></span></span></div>'; }).join(""):'<span class="tag soft">'+T("عام")+'</span>')+'</div>'+
    '<div><div class="dim-label">'+T("المشاعر")+'</div><div class="tag-row">'+(u.emotions.length?u.emotions.map(function(e){ return '<span class="tag'+(e.implied?" soft":"")+'">'+esc(e.label)+(e.implied?" "+T("(محتمل)"):"")+'</span>'; }).join(""):'<span class="tag soft">'+T("لم تُذكر صراحة")+'</span>')+'</div>'+
      '<div class="dim-label" style="margin-top:12px;">'+T("الأطراف")+'</div><div class="tag-row">'+(u.relations.length?u.relations.map(function(x){return '<span class="tag">'+esc(x.label)+'</span>';}).join(""):'<span class="tag soft">'+T("غير محدد")+'</span>')+(u.selfFault?'<span class="tag clay">'+T("تتحدث عن خطأ منك")+'</span>':"")+'</div>'+
      '<div class="dim-label" style="margin-top:12px;">'+T("ثقل الموقف")+'</div><div class="meter">'+[1,2,3].map(function(k){return '<i class="'+(u.intensity>=k?"on":"")+'"></i>';}).join("")+'</div></div>'+
    '</div></div>';

  a.help.forEach(function(h){ out+='<div class="help-note">'+esc(h)+'</div>'; });

  // 2) المنظور القرآني النبوي
  if(a.insights.length){
    out+=section(++n,T("المنظور القرآني والنبوي لحالتك"), a.insights.map(function(x){
      return '<div class="insight"><div class="i-label">'+esc(x.label)+'</div>'+insightLines(x.text)+'</div>'; }).join(""));
  }

  // 3) الموقف الأقرب
  var s=top.s;
  out+=section(++n,T(s.sourceType==="quran"?"الموقف الأقرب لحالتك من القرآن":"الموقف الأقرب لحالتك من السيرة"),
    '<div class="card"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">'+strengthBadge(s)+saveBtn("sit",s.id)+'</div>'+
    '<div class="section-body" style="margin-bottom:10px;"><strong style="color:var(--pine-strong);">'+esc(s.title)+'</strong></div>'+
    '<div class="section-body" style="font-size:.93rem;">'+esc(s.eventDescription)+'</div>'+
    '<div class="section-body" style="font-size:.82rem;color:var(--muted);margin-top:10px;">'+esc(s.historicalContext)+'</div></div>');
  out+=section(++n,T("الدليل"), '<div class="card">'+sitEvidenceHTML(s)+'</div>');
  out+=section(++n,T("ماذا نلاحظ في موقف {0}؟",esc(figureOf(s))), list(s.behaviorObservations));
  out+=section(++n,T("المبادئ المستخلصة"), list(s.principles));
  out+=section(++n,T("كيف تستفيد منه أنت؟"), list(s.modernApplications,"steps"));

  // 4) مواقف أخرى
  if(r.sits.length>1){
    out+=section(++n,T("مواقف أخرى تضيء جوانب من حالتك"),'<div class="mini-sits">'+r.sits.slice(1,5).map(function(x){
      var why=x.via.length?T("يرتبط بـ: {0}",x.via.map(RAG.themeLabel).slice(0,2).join(T("، "))):x.s.problemType;
      return '<button class="mini-sit" data-sit="'+esc(x.s.id)+'"><div class="ms-fig">'+esc(figureOf(x.s))+(x.s.sourceType==="quran"?'<span class="src-quran">'+T("قرآن")+'</span>':"")+'</div><div class="ms-title">'+esc(x.s.title)+'</div><div class="ms-why">'+esc(why)+'</div></button>';
    }).join("")+'</div>');
  }

  // 5) من القرآن
  if(r.ayat.length) out+=section(++n,T("من القرآن الكريم"),'<div class="ev-list">'+r.ayat.slice(0,4).map(function(x){return ayahHTML(x.item,x.via);}).join("")+'</div>');
  // 6) من السنة
  if(r.hadith.length) out+=section(++n,T("من السنة النبوية"),'<div class="ev-list">'+r.hadith.slice(0,4).map(function(x){return hadithHTML(x.item,x.via);}).join("")+'</div>');

  // 7) الخطة العملية
  var P=a.plan;
  out+=section(++n,T("خطة عملية لحالتك"),
    planTabsHTML()+
    '<div class="plan-pane active" data-pane="now">'+list(P.now,"steps")+'</div><div class="plan-pane" data-pane="week">'+list(P.week,"steps")+'</div><div class="plan-pane" data-pane="long">'+list(P.long,"steps")+'</div>'+
    '<div class="set-hint">'+T("اضغط على أي خطوة لتعليمها كمنجزة.")+'</div>');

  // 8) الأدعية
  if(r.duas.length) out+=section(++n,T("أدعية وأذكار مأثورة تناسب حالتك"), r.duas.slice(0,3).map(duaHTML).join(""));
  // 9) أسئلة للتأمل
  if(a.questions.length) out+=section(++n,T("أسئلة تعينك على فهم نفسك"),'<div class="q-list">'+a.questions.map(function(q){return '<div class="q-item">'+esc(q)+'</div>';}).join("")+'</div>');
  // 10) ما يُتجنب
  var avoid=a.avoid, limits=s.notToApplyTo||[];
  if(avoid.length||limits.length){
    out+=section(++n,T("ما ينبغي تجنبه"),(avoid.length?'<div class="avoid-box">'+list(avoid)+'</div>':"")+
      (limits.length?'<div class="limits-box"><div class="lt">'+T("حدود هذا المثال — متى لا ينطبق؟")+'</div>'+list(limits)+'</div>':""));
  }
  // 11) تأمل
  out+=section(++n,T("تأمل"), '<div class="reflection-box">'+esc(s.reflection)+'</div>');

  // 12) التحليل التوليدي
  out+=section(++n,T("تحليل معمّق مخصص (اختياري)"), aiPanelHTML());

  // 13) المصادر والشفافية
  var srcs=[];
  (s.hadithRefs||[]).forEach(function(h){srcs.push(I18N.src(h.source));});
  (s.quranRefs||[]).forEach(function(q){srcs.push(T("القرآن الكريم، {0}",I18N.ref(q.surahName,q.ayahNumber)));});
  r.ayat.slice(0,4).forEach(function(x){srcs.push(T("القرآن الكريم، {0}",I18N.ref(x.item.s,x.item.a)));});
  r.hadith.slice(0,4).forEach(function(x){srcs.push(I18N.src(x.item.src));});
  (s.seerahSources||[]).forEach(function(x){srcs.push(T(x));});
  srcs=srcs.filter(function(x,i){return srcs.indexOf(x)===i;});
  out+=section(++n,T("المصادر"),'<div class="sources-box">'+srcs.map(esc).join("<br>")+
    '<div class="legend"><strong>'+T("موثق بدرجة عالية")+'</strong> = '+T("قرآن كريم أو حديث في الصحيحين أو صحيح")+' · <strong>'+T("موثق")+'</strong> = '+T("حديث صحيح أو حسن في السنن والمسانيد")+' · <strong>'+T("رواية تاريخية")+'</strong> = '+T("من كتب السيرة وليست بدرجة الحديث الصحيح.")+' '+T("الآيات بالرسم الإملائي؛ راجع المصحف عند التلاوة.")+'</div></div>'+
    '<details class="why"><summary>'+T("لماذا ظهرت هذه النتائج؟ (شفافية التحليل)")+'</summary><div class="why-body">'+
      T("الألفاظ التي التُقطت من كلامك:")+' '+(u.themes.map(function(t){return t.hits.slice(0,4).map(function(h){return "<code>"+esc(h)+"</code>";}).join(" ");}).join(" ")||"—")+'<br>'+
      T("درجات المواقف:")+' '+r.sits.map(function(x){return esc(x.s.title.split(":")[0])+" ("+x.score.toFixed(1)+")";}).join(T("، "))+'<br>'+
      T("المنهج: تطبيع النص العربي وتجذيعه ← كشف الموضوعات والمشاعر ← توسيع الاستعلام ← ترتيب BM25 مع تعزيز دلالي ← تركيب التحليل من النصوص المسترجعة فقط.")+'</div></details>');

  out+=section(++n,T("قيّم هذه الإجابة"), rateBoxHTML("res:"+a.id, {kind:"result", title:s.title, sitId:s.id, prompt:T("هل أفادتك هذه القراءة؟ تقييمك يساعدنا على تحسين التطبيق")}));
  out+=actionsHTML();
  qs("resultWrap").innerHTML=out;
  aiSession=null;
}
var IS_ANDROID_APP=!!window.AndroidBridge;
function actionsHTML(){
  var canShare=IS_ANDROID_APP||!!navigator.share;
  return '<div class="result-actions"><button class="btn-ghost" id="btnNewSearch">'+T("موقف جديد")+'</button><button class="btn-ghost" data-act="copy-result">'+T("نسخ الخلاصة")+'</button>'+
    (canShare?'<button class="btn-ghost" data-act="share-result">'+T("مشاركة")+'</button>':"")+(IS_ANDROID_APP?"":'<button class="btn-ghost" data-act="print">'+T("طباعة / PDF")+'</button>')+'<button class="btn-ghost" data-nav="explore">'+T("استكشف الموضوعات")+'</button></div>';
}
function resultSummaryText(){
  var a=lastAnalysis; if(!a) return "";
  var r=a.retrieval, L=[T("رِفقة الأُسوة — خلاصة التأمل"),"",T("الموقف:")+" "+a.input,"",a.reading,""];
  a.insights.forEach(function(x){ L.push("• "+x.label+": "+x.text); });
  if(r.sits[0]) L.push("",T("الموقف الأقرب:")+" "+r.sits[0].s.title);
  r.ayat.slice(0,2).forEach(function(x){ L.push("﴿"+x.item.t+"﴾ ["+I18N.ref(x.item.s,x.item.a)+"]"+(EN?"\n"+I18N.quranEn(x.item.s,x.item.a):"")); });
  r.hadith.slice(0,2).forEach(function(x){ L.push("«"+x.item.t+"»"+(EN&&x.item.te?"\n“"+x.item.te+"”":"")+" — "+I18N.src(x.item.src)+" ("+I18N.grade(x.item.g)+")"); });
  L.push("",T("خطة الآن:")); a.plan.now.forEach(function(p,i){ L.push((i+1)+". "+p); });
  L.push("",T("هذا تأمل إرشادي وليس فتوى."));
  return L.join("\n");
}

/* ---------------- التحليل التوليدي (Claude) ---------------- */
function aiPanelHTML(){
  var on=AI.enabled();
  return '<div class="ai-panel"><div class="ai-head"><div class="ai-ic"><svg viewBox="0 0 24 24"><path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z"/></svg></div>'+
    '<div><div class="ai-t">'+T("تعميق التحليل بالذكاء الاصطناعي")+'</div><div class="ai-s">'+(on?T("مقيّد بالنصوص المسترجعة أعلاه فقط، ويستشهد برموزها"):T("اختياري — يحتاج مفتاح Claude API واتصالًا بالإنترنت"))+'</div></div></div>'+
    (on?'<div class="ai-body" id="aiBody"><div class="ai-empty" style="padding:0;">'+T("سيقرأ النموذج موقفك مع المقاطع الموثقة المسترجعة، ويكتب تحليلًا مخصصًا يربط بينها ويقترح خطوات دقيقة لحالتك. سيُرسل نصك إلى Anthropic لهذا الغرض فقط.")+'<div style="margin-top:12px;"><button class="btn-primary" data-act="start-ai">'+T("ابدأ التحليل المعمّق")+'</button></div></div></div>'+
        '<div class="ai-foot" id="aiFoot" hidden><input type="text" id="aiFollow" placeholder="'+T("اسأل سؤالًا متابعًا عن حالتك…")+'"><button class="btn-primary" data-act="ai-follow">'+T("إرسال")+'</button></div>'
       :'<div class="ai-empty">'+T("التحليل الموثق أعلاه كامل ويعمل بلا إنترنت. إن أردت طبقة إضافية يكتب فيها نموذج لغوي تحليلًا شخصيًا يربط بين هذه النصوص نفسها (دون أي نص من خارجها)، أضف مفتاح Claude API من الإعدادات.")+'<div style="margin-top:12px;"><button class="btn-ghost" data-act="open-settings">'+T("فتح الإعدادات")+'</button></div></div>')+
    '</div>';
}
function mdToHTML(md){
  var lines=esc(md).split("\n"), html="", inUl=false, inOl=false;
  function close(){ if(inUl){html+="</ul>";inUl=false;} if(inOl){html+="</ol>";inOl=false;} }
  function inline(t){ return t.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/\[([SQHD]\d{1,2})\]/g,'<span class="cite">$1</span>'); }
  lines.forEach(function(l){
    var t=l.trim();
    if(!t){ close(); return; }
    var m;
    if((m=t.match(/^#{1,4}\s+(.*)/))){ close(); html+="<h2>"+inline(m[1])+"</h2>"; }
    else if((m=t.match(/^[-*•]\s+(.*)/))){ if(inOl){html+="</ol>";inOl=false;} if(!inUl){html+="<ul>";inUl=true;} html+="<li>"+inline(m[1])+"</li>"; }
    else if((m=t.match(/^\d+[.)]\s+(.*)/))){ if(inUl){html+="</ul>";inUl=false;} if(!inOl){html+="<ol>";inOl=true;} html+="<li>"+inline(m[1])+"</li>"; }
    else if((m=t.match(/^&gt;\s?(.*)/))){ close(); html+="<blockquote>"+inline(m[1])+"</blockquote>"; }
    else { close(); html+="<p>"+inline(t)+"</p>"; }
  });
  close(); return html;
}
function runAIStream(target, onFinish){
  var text="", raf=null;
  function paint(done){ target.innerHTML=mdToHTML(text)+(done?"":'<span class="cursor"></span>'); }
  paint(false);
  aiSession.handle=AI.stream(aiSession.messages,{
    onText:function(d){ text+=d; if(!raf) raf=requestAnimationFrame(function(){ raf=null; paint(false); }); },
    onDone:function(info){
      if(raf){ cancelAnimationFrame(raf); raf=null; }
      if(info.stopReason==="refusal" && !text) text=T("تعذّر على النموذج إكمال هذا الطلب. التحليل الموثق أعلاه يبقى متاحًا.");
      if(info.stopReason==="max_tokens") text+="\n\n"+T("(انتهى الحد الأقصى للطول.)");
      paint(true); aiSession.messages.push({role:"assistant",content:text||"…"}); aiSession.busy=false;
      // سياسة Google Play للمحتوى المولَّد: وسيلة للإبلاغ عن أي إجابة مسيئة أو خاطئة من داخل التطبيق
      if(text) target.insertAdjacentHTML("beforeend",'<div class="ai-report"><button class="mini-btn" data-act="ai-report" data-turn="'+(aiSession.messages.length-1)+'"><svg viewBox="0 0 24 24"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>'+T("الإبلاغ عن هذه الإجابة")+'</button></div>');
      onFinish&&onFinish(true);
    },
    onError:function(msg){ if(raf){ cancelAnimationFrame(raf); raf=null; } target.innerHTML=mdToHTML(text)+'<p class="ai-err">'+esc(msg)+'</p>'; aiSession.busy=false; aiSession.messages.pop(); onFinish&&onFinish(false); }
  });
}
function startAI(){
  if(!lastAnalysis || !AI.enabled()) return;
  var body=qs("aiBody"); if(!body) return;
  toggleSection(body.closest(".section"), true);
  if(aiSession && aiSession.busy) return;
  aiSession={messages:[{role:"user",content:AI.buildUserTurn(lastAnalysis)}], busy:true};
  body.innerHTML='<div id="aiTurn0"></div>';
  runAIStream(qs("aiTurn0"), function(ok){ if(ok) qs("aiFoot").hidden=false; });
}
function followUpAI(){
  var inp=qs("aiFollow"), q=(inp.value||"").trim();
  if(!q || !aiSession || aiSession.busy) return;
  inp.value=""; aiSession.busy=true;
  aiSession.messages.push({role:"user",content:q+"\n\n"+T("(التزم بالقواعد نفسها: لا نص إلا من المقاطع المسترجعة، واذكر الرموز.)")});
  var id="aiTurn"+aiSession.messages.length, body=qs("aiBody");
  body.insertAdjacentHTML("beforeend",'<div class="ai-turn-user">'+esc(q)+'</div><div id="'+id+'"></div>');
  runAIStream(qs(id));
}

/* ---------------- الاستكشاف ---------------- */
var exploreTab="topic";
function themeCounts(t){
  return {sits:t.sits.length, ayat:QURAN_LIB.filter(function(q){return q.th.indexOf(t.id)>-1;}).length, hadith:HADITH_LIB.filter(function(h){return h.th.indexOf(t.id)>-1;}).length};
}
function renderStats(){
  var c={high:0,mid:0,low:0};
  SITUATIONS.forEach(function(s){ var k=badgeClass(s.sourceStrength).slice(6); c[k]=(c[k]||0)+1; });
  qs("statsBar").innerHTML='<span class="stat-pill"><span class="dot high"></span>'+c.high+' '+T("موثق بدرجة عالية")+'</span><span class="stat-pill"><span class="dot mid"></span>'+c.mid+' '+T("موثق")+'</span><span class="stat-pill"><span class="dot low"></span>'+c.low+' '+T("رواية تاريخية")+'</span>';
  qs("allCount").textContent=SITUATIONS.length;
}
function renderExploreBody(filter){
  var nf=RAG.normalize(filter||"");
  if(exploreTab==="topic"){
    var groups=[]; THEMES.forEach(function(t){ if(groups.indexOf(t.group)<0) groups.push(t.group); });
    var html="";
    groups.forEach(function(g){
      var ts=THEMES.filter(function(t){ return t.group===g && (!nf || RAG.normalize(t.label+" "+t.triggers.join(" ")).indexOf(nf)>-1); });
      if(!ts.length) return;
      html+='<div class="topic-group"><div class="topic-group-title">'+esc(T(g))+'</div><div class="topic-grid">'+ts.map(function(t){
        var c=themeCounts(t);
        return '<button class="topic-card" data-theme-open="'+t.id+'" style="font-family:inherit;color:inherit;"><div class="topic-icon">'+iconSvg(t.icon)+'</div><div class="t-title">'+esc(t.label)+'</div><div class="t-count">'+T("{0} مواقف · {1} آيات · {2} أحاديث",c.sits,c.ayat,c.hadith)+'</div></button>';
      }).join("")+'</div></div>';
    });
    qs("exploreBody").innerHTML=html||'<div class="no-results">'+T("لا توجد موضوعات مطابقة. جرّب «كل المواقف» أو اكتب موقفك في الصفحة الرئيسية.")+'</div>';
  } else {
    var f=SITUATIONS.filter(function(s){ return !nf || RAG.normalize(s.title+" "+s.mainCategory+" "+T(s.mainCategory)+" "+s.semanticTags.join(" ")+" "+s.keywords.join(" ")+" "+(s.figure||"")+" "+figureOf(s)).indexOf(nf)>-1; });
    if(!f.length){ qs("exploreBody").innerHTML='<div class="no-results">'+T("لا توجد نتائج مطابقة لبحثك.")+'</div>'; return; }
    var by={}; f.forEach(function(s){ (by[s.mainCategory]=by[s.mainCategory]||[]).push(s); });
    qs("exploreBody").innerHTML=Object.keys(by).map(function(cat){
      return '<div class="all-sit-group"><div class="all-sit-group-title">'+esc(T(cat))+'</div><div class="sit-list" style="padding:0;">'+by[cat].map(sitItemHTML).join("")+'</div></div>';
    }).join("");
  }
}
function sitItemHTML(s){
  var desc=s.eventDescription, cut=EN?150:110, teaser=desc.length>cut?desc.slice(0,cut)+"…":desc;
  return '<div class="sit-item" data-sit="'+esc(s.id)+'" role="button" tabindex="0"><div class="s-fig">'+esc(figureOf(s))+(s.sourceType==="quran"?'<span class="src-quran">'+T("قرآن")+'</span>':"")+'</div><div class="s-title">'+esc(s.title)+'</div><div class="s-teaser">'+esc(teaser)+'</div><div class="s-badges">'+strengthBadge(s)+(fbFind("sit:"+s.id)?'<span class="my-rating" title="'+T("تقييمك")+'">★ '+fbFind("sit:"+s.id).stars+'</span>':"")+'</div></div>';
}
function openTheme(id){
  var t=RAG.byId("theme",id); if(!t) return;
  lastThemeId=id;
  var ay=QURAN_LIB.filter(function(q){return q.th.indexOf(id)>-1;}), hd=HADITH_LIB.filter(function(h){return h.th.indexOf(id)>-1;});
  var duas=hd.filter(function(h){return h.dua;}).map(function(h){return {kind:"hadith",item:h};}).concat(ay.filter(function(q){return q.dua;}).map(function(q){return {kind:"quran",item:q};}));
  var sits=t.sits.map(function(x){return RAG.byId("sit",x);}).filter(Boolean);
  var n=0, h='<div class="theme-hero"><h2>'+iconSvg(t.icon)+esc(t.label)+'</h2>'+listenBtnHTML("theme",T("استمع للموضوع"))+foldBarHTML()+'</div><div class="theme-body">';
  h+='<div class="insight"><div class="i-label">'+T("القراءة القرآنية النبوية")+'</div>'+insightLines(t.insight)+'</div>';
  if(t.help) h+='<div class="help-note">'+esc(t.help)+'</div>';
  h+='<div style="margin:16px 0 26px;"><button class="btn-primary" data-act="ask-theme" data-label="'+esc(t.label)+'">'+T("اكتب موقفك في هذا الموضوع")+'</button></div>';
  if(sits.length) h+=section(++n,T("مواقف مرتبطة"),'<div class="sit-list" style="padding:0;">'+sits.map(sitItemHTML).join("")+'</div>');
  h+=section(++n,T("خطة عملية"),
    planTabsHTML()+
    '<div class="plan-pane active" data-pane="now">'+list(t.plan.now,"steps")+'</div><div class="plan-pane" data-pane="week">'+list(t.plan.week,"steps")+'</div><div class="plan-pane" data-pane="long">'+list(t.plan.long,"steps")+'</div>');
  var ayN=ay.filter(function(q){return !q.dua;}), hdN=hd.filter(function(x){return !x.dua;});
  if(ayN.length) h+=section(++n,T("من القرآن الكريم ({0})",ayN.length),'<div class="ev-list">'+ayN.map(function(q){return ayahHTML(q);}).join("")+'</div>');
  if(hdN.length) h+=section(++n,T("من السنة النبوية ({0})",hdN.length),'<div class="ev-list">'+hdN.map(function(x){return hadithHTML(x);}).join("")+'</div>');
  if(duas.length) h+=section(++n,T("أدعية وأذكار"),duas.map(duaHTML).join(""));
  if(t.questions.length) h+=section(++n,T("أسئلة للتأمل"),'<div class="q-list">'+t.questions.map(function(q){return '<div class="q-item">'+esc(q)+'</div>';}).join("")+'</div>');
  if(t.avoid.length) h+=section(++n,T("ما ينبغي تجنبه"),'<div class="avoid-box">'+list(t.avoid)+'</div>');
  h+='</div>';
  qs("themePage").innerHTML=h;
  showScreen("theme");
}

/* ---------------- المكتبة ---------------- */
var libKind="all", libTheme=null, libLimit=40;
function renderLibFilters(){
  var kinds=[["all",T("الكل")],["quran",T("آيات")],["hadith",T("أحاديث")],["dua",T("أدعية وأذكار")]];
  qs("libFilters").innerHTML=kinds.map(function(k){ return '<button class="chip'+(libKind===k[0]?" active":"")+'" data-libkind="'+k[0]+'">'+k[1]+'</button>'; }).join("")+
    (libTheme?'<button class="chip active" data-libtheme="">'+esc(RAG.themeLabel(libTheme))+' ✕</button>':"");
}
function renderLibrary(){
  renderLibFilters();
  var nf=RAG.normalize(qs("libSearch").value||"");
  var items=[].concat(QURAN_LIB.map(function(q){return {k:"quran",it:q};}), HADITH_LIB.map(function(h){return {k:"hadith",it:h};}));
  items=items.filter(function(x){
    if(libKind==="quran" && x.k!=="quran") return false;
    if(libKind==="hadith" && (x.k!=="hadith"||x.it.dua)) return false;
    if(libKind==="dua" && !x.it.dua) return false;
    if(libTheme && x.it.th.indexOf(libTheme)<0) return false;
    if(nf){
      var extra=EN?(x.k==="quran"?I18N.quranEn(x.it.s,x.it.a)+" "+I18N.ref(x.it.s,x.it.a):(x.it.te||"")+" "+I18N.src(x.it.src)):"";
      var hay=RAG.normalize(x.it.t+" "+x.it.n+" "+(x.it.s||"")+" "+(x.it.src||"")+" "+extra+" "+x.it.th.map(RAG.themeLabel).join(" ")); if(hay.indexOf(nf)<0) return false;
    }
    return true;
  });
  qs("libCount").textContent=T("{0} نصًا",items.length);
  qs("libList").innerHTML=items.slice(0,libLimit).map(function(x){
    var it=x.it, isQ=x.k==="quran";
    return '<div class="lib-item"><div class="li-top"><div class="li-ref">'+(isQ?esc(I18N.ref(it.s,it.a)):esc(I18N.src(it.src))+'<span class="grade '+gradeClass(it.g)+'">'+esc(I18N.grade(it.g))+'</span>')+'</div>'+saveBtn(x.k,it.id)+'</div>'+
      '<div class="li-text"'+AR_ATTR+'>'+(isQ?"﴿ "+esc(qText(it.s,it.a,it.t))+" ﴾":"«"+esc(hText(it.t))+"»")+'</div>'+(isQ?enAyah(it.s,it.a):enHadith(it.te))+
      '<div class="li-note">'+(isQ?"":T("الراوي:")+" "+esc(it.r)+" · ")+esc(it.n)+'</div>'+
      '<div class="li-tags">'+it.th.filter(function(t){return RAG.themeLabel(t);}).map(function(t){return '<span class="tag soft" data-libtheme="'+t+'">'+esc(RAG.themeLabel(t))+'</span>';}).join("")+'</div></div>';
  }).join("")+(items.length>libLimit?'<div style="text-align:center;margin:14px 0;"><button class="btn-ghost" data-act="lib-more">'+T("عرض المزيد")+'</button></div>':"")+
  (items.length?"":'<div class="empty-state">'+T("لا توجد نصوص مطابقة.")+'</div>');
}

/* ---------------- المحفوظات ---------------- */
function renderSaved(){
  var h="";
  var ss=(saved.sit||[]).map(function(id){return RAG.byId("sit",id);}).filter(Boolean);
  var qq=(saved.quran||[]).map(function(id){return RAG.byId("quran",id);}).filter(Boolean);
  var hh=(saved.hadith||[]).map(function(id){return RAG.byId("hadith",id);}).filter(Boolean);
  if(ss.length) h+='<div class="all-sit-group-title" style="margin-top:16px;">'+T("مواقف")+'</div><div class="sit-list" style="padding:0;">'+ss.map(sitItemHTML).join("")+'</div>';
  if(qq.length) h+='<div class="all-sit-group-title" style="margin-top:20px;">'+T("آيات")+'</div><div class="ev-list">'+qq.map(function(q){return ayahHTML(q);}).join("")+'</div>';
  if(hh.length) h+='<div class="all-sit-group-title" style="margin-top:20px;">'+T("أحاديث وأذكار")+'</div><div class="ev-list">'+hh.map(function(x){return hadithHTML(x);}).join("")+'</div>';
  h+=feedbackListHTML();
  qs("savedList").innerHTML=h||'<div class="empty-state">'+T("لم تحفظ شيئًا بعد.")+'<br>'+T("اضغط «حفظ» بجانب أي موقف أو آية أو حديث ليظهر هنا، وقيّم المواقف لتظهر تقييماتك هنا أيضًا.")+'</div>';
}

/* ---------------- لوحة تفاصيل الموقف ---------------- */
function relatedSituations(s){
  var th=new Set(THEMES.filter(function(t){return t.sits.indexOf(s.id)>-1;}).map(function(t){return t.id;}));
  return SITUATIONS.filter(function(o){return o.id!==s.id;}).map(function(o){
    var sc=(o.mainCategory===s.mainCategory?1.5:0)+o.semanticTags.filter(function(t){return s.semanticTags.indexOf(t)>-1;}).length;
    THEMES.forEach(function(t){ if(th.has(t.id) && t.sits.indexOf(o.id)>-1) sc+=1.5; });
    return {o:o,score:sc};
  }).filter(function(x){return x.score>0;}).sort(function(a,b){return b.score-a.score;}).slice(0,4).map(function(x){return x.o;});
}
function openDetail(id){
  var s=RAG.byId("sit",id); if(!s) return;
  stopReading();
  var rel=relatedSituations(s), n=0;
  var themes=THEMES.filter(function(t){return t.sits.indexOf(s.id)>-1;});
  qs("detailPanel").innerHTML='<div class="detail-inner">'+
    '<div style="display:flex;justify-content:space-between;align-items:center;margin:10px 0 20px;"><button class="back-link" style="margin:0;padding:0;" data-act="close-detail">'+T("‹ رجوع")+'</button><div class="detail-tools">'+listenBtnHTML("detail",T("استمع"))+saveBtn("sit",s.id)+'</div></div>'+
    strengthBadge(s)+(s.sourceType==="quran"?'<span class="src-quran">'+T("من القرآن")+'</span>':"")+
    foldBarHTML()+'<h2 class="serif detail-title" style="font-size:1.5rem;color:var(--pine-strong);margin:10px 0 6px;line-height:1.6;">'+esc(s.title)+'</h2>'+
    '<div style="font-size:.8rem;color:var(--muted);margin-bottom:12px;">'+esc(T(s.mainCategory))+' · '+esc(s.subCategories.join(T("، ")))+'</div>'+
    (themes.length?'<div class="tag-row" style="margin-bottom:20px;">'+themes.map(function(t){return '<button class="theme-chip" data-theme-open="'+t.id+'">'+iconSvg(t.icon)+esc(t.label)+'</button>';}).join("")+'</div>':"")+
    section(++n,T("الواقعة"),'<div class="section-body">'+esc(s.eventDescription)+'</div>')+
    section(++n,T("السياق"),'<div class="section-body">'+esc(s.historicalContext)+'</div><div class="section-body" style="margin-top:8px;font-size:.85rem;color:var(--muted);">'+T("المشاركون:")+' '+esc(s.participants.join(T("، ")))+'</div>')+
    section(++n,T("النصوص"),'<div class="card">'+sitEvidenceHTML(s)+'</div>')+
    section(++n,T("ماذا نلاحظ في موقف {0}؟",esc(figureOf(s))),list(s.behaviorObservations))+
    section(++n,T("المبادئ"),list(s.principles))+
    section(++n,T("ماذا نتعلم اليوم؟"),list(s.modernApplications,"steps"))+
    (s.whatToAvoid.length?section(++n,T("ما ينبغي تجنبه"),'<div class="avoid-box">'+list(s.whatToAvoid)+'</div>'):"")+
    (s.notToApplyTo.length?section(++n,T("حدود هذا المثال"),'<div class="limits-box">'+list(s.notToApplyTo)+'</div>'):"")+
    section(++n,T("تأمل"),'<div class="reflection-box">'+esc(s.reflection)+'</div>')+
    (s.contrasts&&s.contrasts.length?section(++n,T("↔ قارن مع موقف مختلف"),s.contrasts.map(function(c){
      var t=RAG.byId("sit",c.id); return t?'<div class="compare-card" data-sit="'+esc(t.id)+'"><div class="c-title">'+esc(t.title)+'</div><div class="c-note">'+esc(c.note)+'</div></div>':"";}).join("")):"")+
    (rel.length?section(++n,T("مواقف ذات صلة"),rel.map(function(r){
      return '<div class="related-sit" data-sit="'+esc(r.id)+'"><div class="r-label">'+esc(figureOf(r))+' · '+esc(T(r.mainCategory))+'</div><div class="r-title">'+esc(r.title)+'</div></div>';}).join("")):"")+
    section(++n,T("قيّم هذا الموقف"),rateBoxHTML("sit:"+s.id,{kind:"sit",title:s.title,sitId:s.id,prompt:T("قيّم هذا الموقف واترك تعليقك")}))+
    '</div>';
  var p=qs("detailPanel"), wasOpen=p.classList.contains("open");
  p.classList.add("open"); p.scrollTop=0; document.body.style.overflow="hidden";
  if(!wasOpen){ try{ history.pushState({screen:currentScreen,detail:id},""); }catch(e){} }
}
function closeDetail(fromPop){
  var p=qs("detailPanel"); if(!p.classList.contains("open")) return;
  if(ttsSource==="detail") stopReading();
  p.classList.remove("open"); document.body.style.overflow="";
  if(!fromPop){ try{ history.back(); }catch(e){} }
}

/* ---------------- القراءة الصوتية للصفحة ---------------- */
var READ_SEL=".user-quote,.notice,.confidence-note,.rc-title,.rc-text,.help-note,.section-title,.i-label,.i-text,.section-body,.reflection-box,"+
  ".evidence-tag,.evidence-quote,.en-trans,.evidence-meta,.evidence-relevance,.ev-note,li,.dw,.dt,.q-item,.lt,.ms-title,.ms-why,.c-title,.c-note,.r-title,"+
  ".ai-body p,.ai-body h2,.ai-body blockquote,.detail-title,.theme-hero h2";
var SKIP_SEL=".tts-skip,.ev-actions,.result-actions,details.why,.sources-box,.ai-foot,.ai-empty,.rate-box,.dims,.tag-row,.back-link";
var RATES=[0.8,1,1.2,1.45];
var ttsEl=null, ttsCount=0, ttsSource=null;
function listenBtnHTML(target,label){
  return '<button class="listen-btn tts-skip" data-listen="'+target+'"><svg viewBox="0 0 24 24"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6"/><path d="M18 6.5a8 8 0 0 1 0 11"/></svg><span>'+label+'</span></button>';
}
function speakableText(el){
  var c=el.cloneNode(true), out=[];
  c.querySelectorAll(".section-num,.save-btn,svg,.cursor,.cite,button").forEach(function(x){ x.remove(); });
  var w=document.createTreeWalker(c,NodeFilter.SHOW_TEXT,null), n;
  while((n=w.nextNode())){ var t=n.nodeValue.trim(); if(t) out.push(t); }
  return out.join(" ");
}
function collectSegments(root){
  var segs=[];
  root.querySelectorAll(READ_SEL).forEach(function(el){
    if(el.closest(SKIP_SEL)) return;
    var par=el.parentElement && el.parentElement.closest(READ_SEL);
    if(par && root.contains(par)) return;                       // لا نقرأ العنصر مرتين
    if(el.getAttribute("data-voice")==="ar") return;            // نص عربي في الواجهة الإنجليزية: يُقرأ معناه بعده
    var t=speakableText(el); if(!t) return;
    var pane=el.closest(".plan-pane");
    if(pane && el===pane.querySelector("li")){                  // اسم المرحلة قبل أول خطوة
      var tab=pane.closest(".section").querySelector('.plan-tab[data-plan="'+pane.getAttribute("data-pane")+'"]');
      if(tab) t=tab.textContent.trim()+": "+t;
    }
    var q=el.getAttribute("data-q");
    if(q){                                                      // آية: تمهيد بصوت المحاور ثم تلاوة الشيخ
      var sa=q.split("|"), item=el.closest(".evidence-item");
      if(item) segs.push({text:T("قال الله تعالى، في {0}:",I18N.refSpoken(sa[0],sa[1])), el:el, voice:2});
      var urls=TTS.recitationUrls(sa[0],sa[1]);
      // بالإنجليزية: التلاوة العربية بصوت القارئ، ثم يُقرأ المعنى من العنصر التالي (.en-trans)
      if(EN){ if(urls) segs.push({text:"…", el:el, voice:1, audio:urls, quietFallback:true}); return; }
      segs.push({text:t, el:el, voice:1, audio:urls});
      return;
    }
    if(el.matches(".evidence-tag") && el.closest(".evidence-item") && el.closest(".evidence-item").querySelector("[data-q]")) return; // يغني عنه التمهيد
    var v1=el.getAttribute("data-voice")==="1";
    segs.push({text:v1&&!EN?sayText(t):t, el:el, voice:v1?1:2});
  });
  return segs;
}
function listen(source){
  if(!TTS.supported()){ toast(T("القراءة الصوتية غير مدعومة في هذا المتصفح"),4000); return; }
  if(ttsSource===source && TTS.state()!=="idle"){ TTS.toggle(); return; }
  var st=TTS.arabicStatus();
  if(st==="none"){ toast(T("لا يوجد محرك نطق على هذا الجهاز. ثبّت «خدمات Google للنطق» من المتجر."),6000); return; }
  if(st==="missing"){
    if(TTS.native){ toast(T("لا يوجد صوت عربي في محرك النطق؛ سيُفتح تثبيته"),4000); TTS.installVoice(); return; }
    toast(T("لا يوجد صوت عربي مثبّت. في ويندوز: الإعدادات ← الوقت واللغة ← اللغة ← أضف «العربية» مع ميزة «الكلام»، ثم أعد فتح التطبيق."),9000);
    return;
  }
  TTS.unlock();                                               // داخل النقرة: ضروري في iOS
  var root=source==="detail"?qs("detailPanel"):source==="theme"?qs("themePage"):qs("resultWrap");
  var segs=collectSegments(root); ttsCount=segs.length; ttsSource=source;
  qs("ttsTitle").textContent=source==="detail"?T("قراءة الموقف"):source==="theme"?T("قراءة الموضوع"):T("قراءة الإجابة كاملة");
  TTS.setRate(prefs.rate||1);
  if(!TTS.play(segs)) toast(T("لا يوجد نص للقراءة"));
}
function revealForReading(el){
  var sec=el.closest(".section.collapsed"); if(sec) toggleSection(sec,true);
  var pane=el.closest(".plan-pane");
  if(pane && !pane.classList.contains("active")){
    var sec2=pane.closest(".section"), k=pane.getAttribute("data-pane");
    sec2.querySelectorAll(".plan-tab").forEach(function(b){ b.classList.toggle("active",b.getAttribute("data-plan")===k); });
    sec2.querySelectorAll(".plan-pane").forEach(function(p){ p.classList.toggle("active",p===pane); });
  }
  var r=el.getBoundingClientRect(), barH=qs("ttsBar").offsetHeight||90;
  if(r.top<70 || r.bottom>window.innerHeight-barH-10) el.scrollIntoView({behavior:"smooth", block:"center"});
}
var ICON_PLAY='<svg viewBox="0 0 24 24"><path d="M17 12L8 6v12z"/></svg>', ICON_PAUSE='<svg viewBox="0 0 24 24"><rect x="7" y="6" width="3.5" height="12" rx="1"/><rect x="13.5" y="6" width="3.5" height="12" rx="1"/></svg>';
TTS.on(function(st){
  if(draft && !qs("settingsModal").hidden && TTS.voices().length!==draftVoiceCount) renderVoiceSettings();   // اكتمل تحميل الأصوات
  if(st.notice==="recitation-offline"){ toast(EN?T("تعذّر تحميل التلاوة (لا يوجد اتصال)"):T("تعذّر تحميل التلاوة (لا يوجد اتصال)؛ سيقرأ صوت الشيخ نص الآيات المشكول"),5000); return; }
  if(ttsEl && ttsEl!==st.el){ ttsEl.classList.remove("tts-reading"); ttsEl=null; }
  var bar=qs("ttsBar"); if(!bar) return;
  if(st.state==="idle"){
    bar.hidden=true; document.body.classList.remove("tts-on"); ttsSource=null;
    document.querySelectorAll(".listen-btn.on").forEach(function(b){ b.classList.remove("on"); });
    return;
  }
  bar.hidden=false; document.body.classList.add("tts-on");
  document.querySelectorAll(".listen-btn").forEach(function(b){ b.classList.toggle("on", b.getAttribute("data-listen")===ttsSource); });
  if(st.el && st.el!==ttsEl){ ttsEl=st.el; ttsEl.classList.add("tts-reading"); revealForReading(ttsEl); }
  var playing=st.state==="playing";
  qs("ttsToggle").innerHTML=playing?ICON_PAUSE:ICON_PLAY; qs("ttsToggle").title=playing?T("إيقاف مؤقت"):T("متابعة");
  var cur=Math.max(0,st.seg)+1;
  var who=st.reciting?T("تلاوة الشيخ {0}",reciterName()):st.voice===1?T("صوت الشيخ"):T("صوت المحاور");
  qs("ttsSub").textContent=(playing?who:T("متوقف مؤقتًا"))+" · "+T("{0} من {1}",cur,ttsCount);
  if(ttsEl){ ttsEl.classList.toggle("tts-sheikh", st.voice===1); }
  qs("ttsFill").style.width=Math.round(cur/Math.max(1,ttsCount)*100)+"%";
  qs("ttsRate").textContent=(TTS.getRate()+"").replace(/^0\./,".")+"×";
});
function ttsControl(cmd){
  if(cmd==="toggle") TTS.toggle();
  else if(cmd==="stop") TTS.stop();
  else if(cmd==="next") TTS.skip(1);
  else if(cmd==="prev") TTS.skip(-1);
  else if(cmd==="rate"){
    var i=RATES.indexOf(+prefs.rate||1); prefs.rate=RATES[(i+1)%RATES.length]; store("rifqa.prefs",prefs);
    TTS.setRate(prefs.rate); toast(T("سرعة القراءة: {0}×",prefs.rate));
    var s=TTS.status(); if(s.state!=="idle") qs("ttsRate").textContent=prefs.rate+"×";
  }
}
function reciterName(){ return TTS.reciterLabel(TTS_CFG().reciter); }
function TTS_CFG(){ return {voice1:prefs.voice1||"", voice2:prefs.voice2||"", reciter:prefs.reciter===undefined?"Husary_128kbps":prefs.reciter}; }
/** إعادة رسم الشاشة الحالية (بعد تغيير التشكيل) */
var lastThemeId=null;
function rerenderCurrent(){
  if(currentScreen==="result" && lastAnalysis && window.__lastFlags){ renderResult(lastAnalysis, window.__lastFlags); }
  else if(currentScreen==="theme" && lastThemeId){ var y=window.scrollY; openTheme(lastThemeId); window.scrollTo(0,y); }
  else if(currentScreen==="home"){ renderHome(); }
}
function stopReading(){ if(TTS.state()!=="idle") TTS.stop(); }

/* ---------------- التقييم والتعليقات ---------------- */
// لتصلك الملاحظات على بريدك مباشرة ضع عنوانه هنا (يُترك فارغًا ليختار المستخدم المستلم)
var FEEDBACK_EMAIL="wajdi.chaouche@gmail.com";
/** يفتح رسالة بريد جاهزة يراجعها المستخدم ويرسلها بنفسه (لا يُرسل شيء تلقائيًا) */
function composeEmail(subject, body){
  body=body.slice(0,1800);
  if(IS_ANDROID_APP && window.AndroidBridge.email){ window.AndroidBridge.email(FEEDBACK_EMAIL, subject, body); return; }
  location.href="mailto:"+encodeURIComponent(FEEDBACK_EMAIL)+"?subject="+encodeURIComponent(subject)+"&body="+encodeURIComponent(body);
}
function reportAI(turn){
  if(!aiSession || !aiSession.messages[turn]) return;
  var q=turn>1 ? String(aiSession.messages[turn-1].content).split("\n\n")[0] : (lastAnalysis?lastAnalysis.input:"");
  var L=[T("سبب البلاغ (اكتبه هنا):"),"","","— "+T("سؤالي:"),q,"","— "+T("إجابة النموذج:"),String(aiSession.messages[turn].content),"",
    T("رِفقة الأُسوة {0} · {1}",APP_VERSION,I18N.lang)];
  composeEmail(T("بلاغ عن إجابة الذكاء الاصطناعي في رِفقة الأُسوة"), L.join("\n"));
}
var feedback=store("rifqa.feedback")||[];
var STAR_LABELS=["اختر تقييمك","ضعيفة","مقبولة","جيدة","جيدة جدًا","ممتازة"];
function fbFind(key){ for(var i=0;i<feedback.length;i++) if(feedback[i].key===key) return feedback[i]; return null; }
function starsText(n){ return "★★★★★".slice(0,n)+"☆☆☆☆☆".slice(0,5-n); }
function fmtDate(ts){ return new Date(ts).toLocaleDateString(I18N.lang); }
function rateBoxHTML(key, meta){
  var ex=fbFind(key), n=ex?ex.stars:0;
  return '<div class="rate-box'+(ex?" is-done":"")+'" data-rate-key="'+esc(key)+'" data-kind="'+esc(meta.kind)+'" data-title="'+esc(meta.title)+'" data-sit="'+esc(meta.sitId||"")+'" data-stars="'+n+'">'+
    '<div class="rb-form"><div class="rb-title">'+esc(meta.prompt||T("ما رأيك في هذه الإجابة؟"))+'</div>'+
      '<div class="stars" role="radiogroup" aria-label="'+T("التقييم")+'">'+[1,2,3,4,5].map(function(i){
        return '<button type="button" class="star'+(i<=n?" on":"")+'" data-star="'+i+'" role="radio" aria-checked="'+(i===n)+'" aria-label="'+T("{0} من 5",i)+'"><svg viewBox="0 0 24 24"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/></svg></button>'; }).join("")+
      '<span class="star-label">'+T(STAR_LABELS[n])+'</span></div>'+
      '<textarea class="rb-comment" maxlength="1000" placeholder="'+T("اترك تعليقًا أو اقتراحًا (اختياري): ما الذي أفادك؟ ما الذي ينقص؟")+'">'+esc(ex?ex.comment:"")+'</textarea>'+
      (meta.kind==="result"?'<label class="rb-attach"><input type="checkbox" class="rb-attach-cb"'+(ex&&ex.input?" checked":"")+'> '+T("أرفق نص موقفي مع التقييم (يبقى على جهازك ما لم ترسله)")+'</label>':"")+
      '<div class="rb-foot"><span class="rb-hint">'+T("يُحفظ على جهازك فقط، وتجده في «المحفوظات»")+'</span><button class="btn-primary rb-send" data-act="rate-submit">'+T("حفظ التقييم")+'</button></div></div>'+
    '<div class="rb-done"><div class="rb-thanks">'+T("جزاك الله خيرًا على تقييمك")+'</div><div class="rb-stars-static" aria-label="'+T("{0} من 5",n)+'">'+starsText(n)+'</div>'+
      (ex&&ex.comment?'<div class="rb-quote">'+(EN?"“"+esc(ex.comment)+"”":"«"+esc(ex.comment)+"»")+'</div>':"")+
      '<div class="rb-done-actions"><button class="mini-btn" data-act="rate-edit">'+T("تعديل")+'</button><button class="mini-btn" data-nav="saved">'+T("كل تقييماتي")+'</button></div></div>'+
  '</div>';
}
function setStars(box,n){
  if(!box) return;
  box.setAttribute("data-stars",n);
  box.querySelectorAll(".star").forEach(function(b){ var i=+b.getAttribute("data-star"); b.classList.toggle("on",i<=n); b.setAttribute("aria-checked",i===n); });
  box.querySelector(".star-label").textContent=T(STAR_LABELS[n]);
}
function submitRating(box){
  var n=+box.getAttribute("data-stars");
  if(!n){ toast(T("اختر عدد النجوم أولًا")); return; }
  var key=box.getAttribute("data-rate-key"), kind=box.getAttribute("data-kind");
  var entry={key:key, kind:kind, sitId:box.getAttribute("data-sit")||"", title:box.getAttribute("data-title"), stars:n,
    comment:(box.querySelector(".rb-comment").value||"").trim(), ts:Date.now(), lang:I18N.lang};
  var cb=box.querySelector(".rb-attach-cb");
  if(kind==="result" && lastAnalysis){
    entry.themes=lastAnalysis.understanding.themes.slice(0,3).map(function(t){ return t.theme.label; });
    entry.confidence=lastAnalysis.confidence;
    if(cb && cb.checked) entry.input=lastAnalysis.input;
  }
  feedback=feedback.filter(function(f){ return f.key!==key; }); feedback.unshift(entry); store("rifqa.feedback",feedback);
  box.outerHTML=rateBoxHTML(key,{kind:kind,title:entry.title,sitId:entry.sitId});
  toast(T("حُفظ تقييمك، شكرًا لك"));
  if(entry.sitId) document.querySelectorAll('.sit-item[data-sit="'+CSS.escape(entry.sitId)+'"]').forEach(function(el){ el.outerHTML=sitItemHTML(RAG.byId("sit",entry.sitId)); });
}
function feedbackText(list){
  var L=[T("رِفقة الأُسوة — تقييمات وملاحظات المستخدم (الإصدار {0})",APP_VERSION),""];
  list.forEach(function(f,i){
    L.push((i+1)+") "+starsText(f.stars)+" ("+f.stars+"/5) — "+(f.kind==="result"?T("تحليل موقف"):T("موقف"))+": "+f.title);
    L.push("   "+T("التاريخ:")+" "+fmtDate(f.ts));
    if(f.themes&&f.themes.length) L.push("   "+T("الموضوعات:")+" "+f.themes.join(T("، "))+(f.confidence?" · "+T("المطابقة:")+" "+f.confidence:""));
    if(f.input) L.push("   "+T("نص الموقف:")+" "+f.input);
    if(f.comment) L.push("   "+T("التعليق:")+" "+f.comment);
    L.push("");
  });
  return L.join("\n");
}
function sendFeedback(list){
  if(!list.length){ toast(T("لا توجد تقييمات بعد")); return; }
  var text=feedbackText(list);
  if(!FEEDBACK_EMAIL){ if(IS_ANDROID_APP) window.AndroidBridge.share(text); else if(navigator.share) navigator.share({title:T("ملاحظات رِفقة الأُسوة"),text:text}).catch(function(){}); return; }
  composeEmail(T("ملاحظات على تطبيق رِفقة الأُسوة"), text);
}
function feedbackListHTML(){
  if(!feedback.length) return "";
  var avg=feedback.reduce(function(s,f){return s+f.stars;},0)/feedback.length;
  return '<div class="all-sit-group-title" style="margin-top:22px;">'+T("تقييماتي وملاحظاتي")+'</div>'+
    '<div class="fb-summary"><div><span class="fb-avg">'+avg.toFixed(1)+'</span><span class="fb-avg-stars">'+starsText(Math.round(avg))+'</span><div class="fb-count">'+T("{0} تقييم",feedback.length)+'</div></div>'+
    '<div class="fb-actions"><button class="btn-primary" data-act="fb-send">'+T("إرسال الملاحظات للمطوّر")+'</button><button class="btn-ghost" data-act="fb-copy">'+T("نسخ")+'</button></div></div>'+
    feedback.map(function(f){
      return '<div class="fb-item"><div class="fb-top"><span class="fb-stars">'+starsText(f.stars)+'</span><span class="fb-date">'+esc(fmtDate(f.ts))+'</span></div>'+
        '<div class="fb-title">'+(f.kind==="result"?T("تحليل:")+" ":"")+esc(f.title)+'</div>'+
        (f.comment?'<div class="fb-comment">'+esc(f.comment)+'</div>':"")+
        '<div class="ev-actions">'+(f.sitId?'<button class="mini-btn" data-sit="'+esc(f.sitId)+'">'+T("فتح الموقف")+'</button>':"")+'<button class="mini-btn" data-act="fb-del" data-key="'+esc(f.key)+'">'+T("حذف")+'</button></div></div>';
    }).join("");
}

/* ---------------- الإعدادات ---------------- */
// تُعدَّل نسخة مؤقتة (draft) ما دامت النافذة مفتوحة، وتُعايَن التغييرات فورًا (المظهر، الخط، التشكيل، السرعة، الأصوات).
// «حفظ» يثبّتها؛ و«إلغاء» أو ✕ أو Esc أو النقر خارج النافذة يُرجع كل شيء كما كان دون حفظ.
var draft=null, draftVoiceCount=-1;
function draftCfg(){ return {voice1:draft.voice1, voice2:draft.voice2, reciter:draft.reciter}; }
function previewDraft(){
  applyPrefs(draft); TTS.setRate(draft.rate); TTS.configure(draftCfg());
  if(!EN && TashkeelView.available() && TashkeelView.enabled()!==draft.tk) TashkeelView.set(draft.tk);
}
// اسم اللغة والصوت الرجالي في ويندوز لكل لغة (لتلميح تثبيت الأصوات)
var VOICE_HELP={ar:["عربي","العربية","نايف"], en:["English","English","David"], nl:["Nederlandse","Nederlands","Frank"], es:["español","Español","Pablo"], pt:["português","Português","Duarte"]}[I18N.lang];
function renderVoiceSettings(){
  var c=draftCfg();
  var offOk=TTS.offline.supported, have=offOk?TTS.offline.downloaded():[];
  qs("ttsReciter").innerHTML=TTS.RECITERS.map(function(r){ return '<option value="'+esc(r.id)+'"'+(r.id===c.reciter?" selected":"")+'>'+esc(r.id?TTS.reciterLabel(r.id):T(r.name))+(have.indexOf(r.id)>-1?" ✓":"")+'</option>'; }).join("");
  renderRecOffline();
  var vs=TTS.voices(), g={m:T("رجالي"),f:T("نسائي"),"?":""};
  var hasM=vs.some(function(v){return v.g==="m";}), hasF=vs.some(function(v){return v.g==="f";});
  draftVoiceCount=vs.length;
  function opts(role,cur){
    var auto=TTS.autoVoiceId(role), av=vs.filter(function(v){return v.id===auto;})[0];
    var o='<option value="">'+T("تلقائي")+(av?" — "+esc(av.name):"")+'</option>'+
      '<option value="~m"'+(cur==="~m"?" selected":"")+'>'+T("صوت رجالي")+(vs.length&&!hasM?" ("+T("بخفض النبرة")+")":"")+'</option>'+
      '<option value="~f"'+(cur==="~f"?" selected":"")+'>'+T("صوت نسائي")+(vs.length&&!hasF?" ("+T("برفع النبرة")+")":"")+'</option>';
    if(vs.length) o+='<optgroup label="'+esc(T("الأصوات المثبتة على الجهاز"))+'">'+vs.map(function(v){ return '<option value="'+esc(v.id)+'"'+(v.id===cur?" selected":"")+'>'+esc(v.name)+(g[v.g]?" ("+g[v.g]+")":"")+'</option>'; }).join("")+'</optgroup>';
    return o;
  }
  qs("ttsVoice1").innerHTML=opts(1,c.voice1); qs("ttsVoice2").innerHTML=opts(2,c.voice2);
  var install=TTS.native?' <button class="mini-btn" data-act="tts-install">'+T("تثبيت أصوات إضافية")+'</button> <button class="mini-btn" data-act="tts-settings">'+T("إعدادات النطق في الجهاز")+'</button>':"";
  var hint="";
  if(!vs.length) hint=TTS.native?esc(T("لم يُعثر على أصوات لهذه اللغة بعد."))+install
    :esc(T("لا يوجد صوت {0} مثبّت. في ويندوز: الإعدادات ← الوقت واللغة ← اللغة والمنطقة ← أضف «{1}» مع ميزة «الكلام» ثم أعد تشغيل التطبيق (يوفّر ويندوز صوت «{2}» الرجالي).",VOICE_HELP[0],VOICE_HELP[1],VOICE_HELP[2]));
  else if(!hasM) hint=esc(T("لا يوجد صوت رجالي مثبّت لهذه اللغة؛ اختيار «صوت رجالي» يخفض نبرة الصوت المتاح. لصوت رجالي حقيقي ثبّت صوتًا إضافيًا من إعدادات النطق في الجهاز."))+install;
  else hint=esc(T("الأصوات الرجالية في أول القائمة."))+install;
  qs("voiceHint").innerHTML=hint;
}
/* تنزيل تلاوات القارئ المختار للاستماع دون إنترنت (تطبيق أندرويد) */
function fmtMB(b){ return Math.max(1,Math.round(b/1048576)); }
function renderRecOffline(){
  var box=qs("recOffline"); if(!box) return;
  var id=draft?draft.reciter:TTS_CFG().reciter;
  if(!TTS.offline.supported || !id){ box.hidden=true; return; }
  var st=TTS.offline.status(id), total=TTS.offline.files(), h='<div class="rec-off-t">'+T("الاستماع دون إنترنت")+'</div>';
  if(st.busy){
    var pr=st.progress||{done:st.n,total:total}, pc=pr.total?Math.round(100*pr.done/pr.total):0;
    h+='<div class="rec-bar"><span style="width:'+pc+'%"></span></div><div class="rec-row"><span>'+esc(T("جارٍ التنزيل… {0} من {1}",pr.done,pr.total))+'</span><button class="mini-btn" data-act="rec-cancel">'+T("إيقاف")+'</button></div>';
  } else if(st.ready){
    h+='<div class="rec-row"><span>✓ '+esc(T("منزَّل للاستماع دون إنترنت ({0} ميغابايت)",fmtMB(st.b)))+'</span><button class="mini-btn" data-act="rec-delete">'+T("حذف")+'</button></div>';
  } else {
    var other=st.any && !st.busy;
    h+='<div class="set-hint">'+esc(st.n>0?T("منزَّل جزئيًا ({0} من {1}).",st.n,total):T("نزّل تلاوات هذا القارئ ({0} آية، نحو {1} ميغابايت) لتسمعها دون اتصال.",total,TTS.offline.estimateMB(id)))+'</div>'+
       '<div class="rec-row"><button class="btn-ghost sm" data-act="rec-download"'+(other?" disabled":"")+'>'+T(st.n>0?"إكمال التنزيل":"تنزيل")+'</button>'+(st.n>0?'<button class="mini-btn" data-act="rec-delete">'+T("حذف")+'</button>':"")+'</div>';
    if(other) h+='<div class="set-hint">'+esc(T("يجري تنزيل قارئ آخر؛ انتظر حتى ينتهي."))+'</div>';
  }
  box.innerHTML=h; box.hidden=false;
}
function recDownload(){
  var id=draft?draft.reciter:TTS_CFG().reciter; if(!id){ toast(T("اختر قارئًا أولًا")); return; }
  var free=TTS.offline.freeMB();
  if(free>=0 && free<TTS.offline.estimateMB(id)+50){ toast(T("مساحة التخزين غير كافية")); return; }
  if(!TTS.offline.download(id)) toast(T("تعذّر بدء التنزيل"));
  renderRecOffline();
}
if(TTS.offline.supported) TTS.offline.onChange(function(ev){
  if(ev.state==="done") toast(T("اكتمل التنزيل: {0}",TTS.reciterLabel(ev.id)));
  else if(ev.state==="partial"||ev.state==="error") toast(T("تعذّر تنزيل بعض الآيات؛ تحقق من الاتصال ثم أعد المحاولة"));
  else if(ev.state==="cancelled") toast(T("أُوقف التنزيل"));
  if(draft && !qs("settingsModal").hidden){ if(ev.state==="progress") renderRecOffline(); else renderVoiceSettings(); }
});
function renderSettingsSegs(){
  function mark(id,val){ document.querySelectorAll("#"+id+" button").forEach(function(b){ b.classList.toggle("active", String(b.getAttribute("data-v"))===String(val)); }); }
  mark("segLang",draft.lang); mark("segTheme",draft.theme); mark("segFs",draft.fs); mark("segRate",draft.rate); mark("segTk",draft.tk?"1":"0");
}
function openSettings(){
  var ai=AI.load();
  draft={lang:I18N.lang, theme:prefs.theme||"auto", fs:prefs.fs||"1", rate:+prefs.rate||1, tk:prefs.tk!==false,
         voice1:prefs.voice1||"", voice2:prefs.voice2||"", reciter:TTS_CFG().reciter, key:ai.key||"", model:ai.model};
  qs("aiKey").value=draft.key;
  qs("aiModel").innerHTML=AI.MODELS.map(function(m){return '<option value="'+m.id+'"'+(m.id===draft.model?" selected":"")+'>'+esc(T(m.label))+'</option>';}).join("");
  qs("tkGroup").hidden=EN || !TashkeelView.available();
  renderSettingsSegs(); renderVoiceSettings();
  qs("settingsModal").hidden=false;
  var body=document.querySelector("#settingsModal .set-body"); if(body) body.scrollTop=0;
}
/** إغلاق دون حفظ: يُرجع المعاينة إلى الإعدادات المحفوظة */
function cancelSettings(){
  if(qs("settingsModal").hidden) return;
  if(TTS.state()==="idle") TTS.stop();
  draft=null; qs("settingsModal").hidden=true;
  applyPrefs(); TTS.setRate(prefs.rate||1); TTS.configure(TTS_CFG());
  if(!EN && TashkeelView.available() && TashkeelView.enabled()!==(prefs.tk!==false)) TashkeelView.set(prefs.tk!==false);
}
function saveSettings(){
  var key=qs("aiKey").value.trim();
  if(key && !/^sk-ant-/.test(key)){ toast(T("صيغة المفتاح غير صحيحة (يبدأ بـ sk-ant-)")); return; }
  var d=draft; if(!d) return;
  prefs.theme=d.theme; prefs.fs=d.fs; prefs.rate=d.rate; prefs.tk=d.tk; prefs.voice1=d.voice1; prefs.voice2=d.voice2; prefs.reciter=d.reciter;
  store("rifqa.prefs",prefs);
  var cur=AI.load(); AI.save({key:key, model:qs("aiModel").value, auto:key?cur.auto:false});
  draft=null; qs("settingsModal").hidden=true;
  applyPrefs(); TTS.setRate(prefs.rate); TTS.configure(TTS_CFG());
  if(d.lang!==I18N.lang){ setLang(d.lang); return; }      // تغيير اللغة يعيد تحميل التطبيق
  renderHome(); toast(T("حُفظت الإعدادات"));
  if(currentScreen==="result" && lastAnalysis){ var p=document.querySelector(".ai-panel"); if(p) p.outerHTML=aiPanelHTML(); }
}
/** قائمة اللغات في الشريط العلوي */
function toggleLangMenu(force){
  var m=qs("langMenu"), btn=qs("btnLang"), open=force!==undefined?force:m.hidden;
  if(open){
    var r=btn.getBoundingClientRect();
    m.style.top=(r.bottom+6)+"px";
    if(document.documentElement.dir==="rtl"){ m.style.left=Math.max(8,r.left)+"px"; m.style.right="auto"; }
    else { m.style.right=Math.max(8,document.documentElement.clientWidth-r.right)+"px"; m.style.left="auto"; }
    m.querySelectorAll("[data-setlang]").forEach(function(b){ b.classList.toggle("active", b.getAttribute("data-setlang")===I18N.lang); });
  }
  m.hidden=!open; btn.setAttribute("aria-expanded", open?"true":"false");
}

/* ---------------- مفوّض الأحداث العام ---------------- */
document.addEventListener("click",function(e){
  var el=e.target.closest(".section.collapsible > .section-title,[data-tts],[data-listen],[data-star],[data-theme-open],[data-nav],[data-sit],[data-save],[data-copy],[data-plan],[data-act],[data-libkind],[data-libtheme],[data-close],#segTheme button,#segFs button,#segRate button,#segTk button,#segLang button,[data-setlang],ol.steps li");
  if(!el) return;
  if(el.matches("ol.steps li")){ el.classList.toggle("done"); return; }
  if(el.matches(".section.collapsible > .section-title")){ toggleSection(el.parentElement); return; }
  if(el.hasAttribute("data-tts")){ ttsControl(el.getAttribute("data-tts")); return; }
  if(el.hasAttribute("data-listen")){ listen(el.getAttribute("data-listen")); return; }
  if(el.hasAttribute("data-star")){ setStars(el.closest(".rate-box"), +el.getAttribute("data-star")); return; }
  if(el.hasAttribute("data-theme-open")){ closeDetail(true); openTheme(el.getAttribute("data-theme-open")); return; }
  if(el.hasAttribute("data-nav")){ var nv=el.getAttribute("data-nav"); closeDetail(true); if(nv==="library") renderLibrary(); if(nv==="saved") renderSaved(); showScreen(nv); return; }
  if(el.hasAttribute("data-sit")){ openDetail(el.getAttribute("data-sit")); return; }
  if(el.hasAttribute("data-save")){ var sv=el.getAttribute("data-save").split(":"); toggleSave(sv[0], sv.slice(1).join(":")); return; }
  if(el.hasAttribute("data-copy")){ copyText(el.getAttribute("data-copy")); return; }
  if(el.hasAttribute("data-plan")){
    var wrap=el.closest(".section"), k=el.getAttribute("data-plan");
    wrap.querySelectorAll(".plan-tab").forEach(function(b){b.classList.toggle("active",b===el);});
    wrap.querySelectorAll(".plan-pane").forEach(function(p){p.classList.toggle("active",p.getAttribute("data-pane")===k);});
    return;
  }
  if(el.hasAttribute("data-libkind")){ libKind=el.getAttribute("data-libkind"); libLimit=40; renderLibrary(); return; }
  if(el.hasAttribute("data-libtheme")){ libTheme=el.getAttribute("data-libtheme")||null; libLimit=40; renderLibrary(); window.scrollTo(0,0); return; }
  if(el.hasAttribute("data-close")){ qs(el.getAttribute("data-close")).hidden=true; return; }
  if(el.hasAttribute("data-setlang")){ toggleLangMenu(false); setLang(el.getAttribute("data-setlang")); return; }
  if(el.closest("#segLang,#segTheme,#segTk,#segRate,#segFs")){
    if(!draft) return;
    var v=el.getAttribute("data-v"), seg=el.closest(".seg").id;
    if(seg==="segLang") draft.lang=v; else if(seg==="segTheme") draft.theme=v; else if(seg==="segFs") draft.fs=v;
    else if(seg==="segRate") draft.rate=+v; else if(seg==="segTk") draft.tk=v==="1";
    renderSettingsSegs(); previewDraft(); return;
  }
  var act=el.getAttribute("data-act");
  if(act==="fold-open"||act==="fold-close"){ foldAll(el.closest("#detailPanel,#themePage,#resultWrap"), act==="fold-open"); return; }
  if(act==="close-detail") closeDetail();
  else if(act==="lang-menu") toggleLangMenu();
  else if(act==="settings-cancel") cancelSettings();
  else if(act==="rate-submit") submitRating(el.closest(".rate-box"));
  else if(act==="rate-edit") el.closest(".rate-box").classList.remove("is-done");
  else if(act==="fb-send") sendFeedback(feedback);
  else if(act==="fb-copy") copyText(feedbackText(feedback));
  else if(act==="fb-del"){ var k2=el.getAttribute("data-key"); feedback=feedback.filter(function(f){return f.key!==k2;}); store("rifqa.feedback",feedback); renderSaved(); toast(T("حُذف التقييم")); }
  else if(act==="tts-install") TTS.installVoice();
  else if(act==="tts-settings") TTS.voiceSettings();
  else if(act==="rec-download") recDownload();
  else if(act==="rec-cancel") TTS.offline.cancel();
  else if(act==="rec-delete"){ var rid=draft?draft.reciter:TTS_CFG().reciter; if(TTS.offline.remove(rid)){ toast(T("حُذفت تلاوات القارئ من الجهاز")); renderVoiceSettings(); } }
  else if(act==="preview-voice"){ TTS.unlock(); TTS.preview(+el.getAttribute("data-role")); }
  else if(act==="preview-reciter"){ if(TTS.previewRecitation()===false) toast(T("اخترت القراءة بدون تلاوة")); }
  else if(act==="start-ai") startAI();
  else if(act==="ai-follow") followUpAI();
  else if(act==="ai-report") reportAI(+el.getAttribute("data-turn"));
  else if(act==="open-settings") openSettings();
  else if(act==="copy-result") copyText(resultSummaryText());
  else if(act==="share-result"){
    if(IS_ANDROID_APP) window.AndroidBridge.share(resultSummaryText());
    else navigator.share({title:T("رِفقة الأُسوة"),text:resultSummaryText()}).catch(function(){});
  }
  else if(act==="print") window.print();
  else if(act==="lib-more"){ libLimit+=40; renderLibrary(); }
  else if(act==="ask-theme"){ showScreen("home"); var ta=qs("userInput"); ta.focus(); ta.placeholder=T("اكتب موقفك المتعلق بـ«{0}» بالتفصيل…",el.getAttribute("data-label")); }
});
document.addEventListener("keydown",function(e){
  if(e.key==="Enter" && e.target && e.target.id==="aiFollow"){ followUpAI(); }
  if((e.key==="Enter"||e.key===" ") && e.target && e.target.matches && e.target.matches(".section.collapsible > .section-title")){ e.preventDefault(); toggleSection(e.target.parentElement); }
  if(e.key==="Enter" && e.target && e.target.matches && e.target.matches(".sit-item")){ openDetail(e.target.getAttribute("data-sit")); }
  if(e.key==="Escape" && TTS.state()!=="idle" && !qs("detailPanel").classList.contains("open")){ TTS.stop(); return; }
  if(e.key==="Escape"){ toggleLangMenu(false); if(!qs("settingsModal").hidden){ cancelSettings(); return; } if(qs("detailPanel").classList.contains("open")) closeDetail(); document.querySelectorAll(".modal-overlay").forEach(function(m){m.hidden=true;}); }
});

/* ---------------- التهيئة ---------------- */
document.addEventListener("DOMContentLoaded",function(){
  try{ history.replaceState({screen:"home"},""); }catch(e){}
  I18N.applyStatic(document);
  renderHome(); renderStats(); renderExploreBody("");
  qs("btnSearch").addEventListener("click",function(){ runSearch(qs("userInput").value); });
  qs("userInput").addEventListener("keydown",function(e){ if(e.key==="Enter"&&(e.ctrlKey||e.metaKey)) runSearch(qs("userInput").value); });
  qs("userInput").addEventListener("input",function(){ var l=qs("userInput").value.length; qs("charCount").textContent=l?l+" / 3000":T("لن يُحفظ ما تكتبه"); });
  qs("btnHome").addEventListener("click",function(){ closeDetail(true); showScreen("home"); });
  qs("btnSettings").addEventListener("click",openSettings);
  qs("btnPrivacy").addEventListener("click",function(){ qs("privacyModal").hidden=false; });
  document.querySelectorAll(".modal-overlay").forEach(function(m){ m.addEventListener("click",function(e){ if(e.target!==m) return; if(m.id==="settingsModal") cancelSettings(); else m.hidden=true; }); });
  document.addEventListener("click",function(e){ if(!qs("langMenu").hidden && !e.target.closest("#langMenu,#btnLang")) toggleLangMenu(false); });
  window.addEventListener("resize",function(){ toggleLangMenu(false); });
  qs("btnSaveSettings").addEventListener("click",saveSettings);
  qs("btnClearKey").addEventListener("click",function(){ qs("aiKey").value=""; toast(T("سيُحذف المفتاح عند الحفظ")); });
  [["ttsVoice1","voice1"],["ttsVoice2","voice2"],["ttsReciter","reciter"]].forEach(function(p){
    qs(p[0]).addEventListener("change",function(e){ if(!draft) return; draft[p[1]]=e.target.value; TTS.configure(draftCfg()); renderVoiceSettings(); });
  });
  qs("aiAuto").addEventListener("change",function(){ var cur=AI.load(); cur.auto=qs("aiAuto").checked; AI.save(cur); });
  qs("exploreSearch").addEventListener("input",function(e){ renderExploreBody(e.target.value); });
  qs("tabByTopic").addEventListener("click",function(){ exploreTab="topic"; qs("tabByTopic").classList.add("active"); qs("tabAllSit").classList.remove("active"); renderExploreBody(qs("exploreSearch").value); });
  qs("tabAllSit").addEventListener("click",function(){ exploreTab="all"; qs("tabAllSit").classList.add("active"); qs("tabByTopic").classList.remove("active"); renderExploreBody(qs("exploreSearch").value); });
  qs("libSearch").addEventListener("input",function(){ libLimit=40; renderLibrary(); });
  document.addEventListener("click",function(e){ if(e.target && e.target.id==="btnNewSearch"){ qs("userInput").value=""; qs("charCount").textContent=T("لن يُحفظ ما تكتبه"); showScreen("home"); qs("userInput").focus(); } });
  if(window.matchMedia) matchMedia("(prefers-color-scheme: dark)").addEventListener && matchMedia("(prefers-color-scheme: dark)").addEventListener("change",function(){ applyPrefs(draft||prefs); });
  initInstallPrompt();
  TashkeelView.onChange=function(){ rerenderCurrent(); };
  TashkeelView.set(!EN && prefs.tk!==false);                  // التشكيل مفعّل افتراضيًا (للواجهة العربية)
});

/* ---------------- PWA ---------------- */
if("serviceWorker" in navigator && /^https?:/.test(location.protocol) && !IS_ANDROID_APP){
  window.addEventListener("load",function(){ navigator.serviceWorker.register("service-worker.js").catch(function(){}); });
}
function initInstallPrompt(){
  window.addEventListener("beforeinstallprompt",function(e){
    e.preventDefault(); var dp=e;
    var btn=document.createElement("button"); btn.className="icon-btn"; btn.title=T("تثبيت التطبيق");
    btn.innerHTML='<svg viewBox="0 0 24 24"><path d="M12 4v11"/><polyline points="8,11 12,15 16,11"/><path d="M5 18h14"/></svg>';
    btn.addEventListener("click",function(){ dp.prompt(); dp.userChoice.then(function(){ btn.remove(); }); });
    document.querySelector(".topnav").prepend(btn);
  });
}

// واجهة للاختبار الآلي
window.RifqaApp={runSearch:runSearch, openDetail:openDetail, openTheme:openTheme, showScreen:showScreen, setLang:setLang};
})();
