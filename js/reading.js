/* ======================================================================
   رِفقة الأُسوة — مؤلّف «القراءة الأولية» العميقة (دون اتصال، دون توليد)
   ----------------------------------------------------------------------
   يختار من مادة js/data-reading.js فقرات مترابطة (4–6) بقواعد شفافة:
   1) ملاحظة افتتاحية حسب بنية الموقف (حيرة بين كفّتين، قرار، أذى، فقد، خطأ،
      رعاية، قلق على غيره، تراكم وإرهاق، صورة الذات، عام) + كفّتا الميزان من عوامل كلامه
   2) ما يمثله كل خيار (إن ذكر خيارين أو أحدهما مع حيرة)
   3) الخوف الذي وراء الخوف
   4) فرق خفي أو فرقان يوضحان الصورة
   5) زاوية أوسع من الموضوع الأول (إن قلّت الفقرات)
   6) خاتمة تمنح وضوحًا دون أن تقرر عنه + أقرب موقف من السيرة
   لا يُكتب شيء دون دليل من نصه أو مما فهمه المحرك؛ وعند الأزمة يُترك للقراءة الآمنة المختصرة.
   ====================================================================== */
var READING = (function(){
  "use strict";
  var AR = function(){ return !(window.I18N && I18N.en); };

  /* جنس المتكلم بالعربية: 1 مؤنث، 0 مذكر أو غير معروف (المذكر صيغة المخاطبة العامة) */
  function gender(u){
    if(!AR()) return 0;
    var G=window.READING_GENDER||{}, hit=function(l){ return RAG.cueHits(u, l||[]).length>0; };
    var f=hit(G.f), m=hit(G.m);
    // بعد ضمير المتكلم مباشرة: صفة مؤنثة («أنا خائفة»، «لكني محتارة»)
    var w=u.words, pron=new Set((G.pron||[]).map(RAG.normalize)), fa=0, ma=0;
    for(var i=0;i+1<w.length;i++){
      if(!pron.has(w[i])) continue;
      var x=w[i+1]; if(!x || x.length<4) continue;
      if(/ه$/.test(x) && !/^(ال|ان|لا|ما|في|من|هذه|كله)/.test(x)) fa++;
      else if(/^(خائف|محتار|حزين|تعبان|مرهق|متعب|نادم|وحيد|مكسور|مضغوط|قلقان|مرتاح|متردد|مشتت|ضائع|غاضب|زعلان)$/.test(x)) ma++;
    }
    if((f || fa) && !(m || ma)) return 1;
    return 0;
  }
  /* للمؤنث بالعربية في النصوص العامة المعاد استعمالها: كسرة على كاف المخاطبة («نفسكِ»، «عليكِ»)
     حتى لا يضبطها التشكيل الآلي بالمذكر؛ مع استثناء ما ينتهي بالكاف أصلًا */
  var K_KEEP=/^(و|ف|ب|ل)?(ذلك|لذلك|كذلك|بذلك|تلك|هناك|هنالك|اولئك|أولئك|مشترك|ترك|يترك|تترك|أدرك|ادرك|يدرك|تدرك|شارك|يشارك|تشارك|تحرك|يتحرك|يملك|تملك|ملك|سلك|يسلك|شك|يشك|ضحك|فك|يفك|هلك|مسك|يمسك|تمسك|تمسّك|التمسك|المشترك|الشك|ذاك|معترك|يتمسك|يشترك|تشترك)$/;
  function fem(t, g){
    if(!g || !AR()) return t;
    t=t.replace(/(^|[^ء-ي])(أنت)(?=$|[^ء-يً-ْ])/g, "$1$2ِ");
    return t.replace(/[ء-ي]+ك(?=$|[^ء-يً-ْ])/g, function(w){ return K_KEEP.test(w) || w.length<3 ? w : w+"ِ"; });
  }
  /* نصوص عامة فيها فعل أو صفة لمخاطَب مذكر («تتعامل»، «مسؤول») لا تُعرض للمؤنث بالعربية */
  var FEM_BAD_LENS=/^(grief|waswasa|people_pleasing|marriage|heartbreak|friends|gossip|poverty|envy|comparison|trust_amanah|charity|ungrateful|animals|transition)$/;
  var FEM_BAD_EMO=/^(anger|sadness|despair|betrayal|love|joy)$/;
  var FEM_BAD_REL=/^(child|colleague|friend|employee|self)$/;
  /* بعد النقطتين في اللغات اللاتينية تبدأ الجملة المضمَّنة بحرف صغير («From a wider angle: anger is…») */
  function lc(t){
    // الألمانية تبقي الحرف الكبير (الأسماء تُكتب بحرف كبير دائمًا)، والأردية والفارسية والبنغالية بلا حروف كبيرة
    if(AR() || !t || (window.I18N && /^(ur|fa|bn|de)$/.test(I18N.lang))) return t;
    if(/^(I |I'|Allah|Al-|Ibn |Yusuf|Musa)/.test(t)) return t;
    return t.charAt(0).toLocaleLowerCase(I18N.lang==="tr" ? "tr" : undefined)+t.slice(1);
  }
  function pick(x, g){ return Array.isArray(x) ? (AR() ? x[g] : T(x[0])) : T(x); }
  function list(arr){
    if(arr.length<2) return arr.join("");
    return arr.slice(0,-1).join(T("، "))+T(" و")+arr[arr.length-1];
  }
  /* «قصّرت معه»، «ليتني كنت معه»: شعور بالتقصير يصاحب الفقد */
  var FAIL=["افشل","الفشل","ارسب","الرسوب","اخفق","فشلت","رسبت"];
  var GRIEF_GUILT=["قصرت","قصرت معه","قصرت معها","ليتني كنت","لو كنت معه","لو كنت معها","لم اودعه","لم اودعها","ما ودعته","ذنبي انه","تقصيري"];
  function has(u, id){ return u.themes.slice(0,4).some(function(t){ return t.id===id; }); }
  function emo(u, id, explicit){ return u.emotions.some(function(e){ return e.id===id && (!explicit || !e.implied); }); }

  function compose(u, r, D, S){
    if(u.crisis || !window.READING_TEXT) return null;
    var X=READING_TEXT, g=gender(u), P=[], used={};
    var F={}; (window.READING_FACTORS||[]).forEach(function(f){ var h=RAG.cueHits(u, f.cues); if(h.length) F[f.id]={f:f, ev:h}; });
    var pulls=Object.keys(F).filter(function(k){ return F[k].f.side==="pull"; }), pushes=Object.keys(F).filter(function(k){ return F[k].f.side==="push"; });
    var opts=(window.READING_OPTIONS||[]).filter(function(o){ return RAG.cueHits(u, o.cues).length; });
    var pats=((S&&S.patterns)||[]).map(function(p){ return p.id; });
    var role=D.role?D.role.id:null;
    var fearish=emo(u,"fear") || has(u,"fear") || has(u,"anxiety") || !!F.regret;
    // «لا أعرف السبب» حيرة في الفهم لا قرار: القرار يحتاج موضوعًا أو صيغة تخيير
    // حاجة «قرار» حقيقية: «لا أعرف هل أقبل» نعم، أما «لا أعرف هل سيجددونها» (فعل الغائب) فترقّب لا قرار
    var needDecision=u.needs.some(function(n){
      if(n.id!=="decision") return false;
      var m=RAG.normalize(n.cue||"").match(/(?:^| )هل ([^ ]+)/);
      return !m || /^[اأن]/.test(m[1]) || opts.length>0;
    });
    // «لا أعرف هل سيجددونها» ترقّب لا قرار: موضوع القرار يحتاج خيارًا مذكورًا أو سؤالًا أو حاجة إلى الحسم
    var decisionish=(has(u,"decision") && (opts.length>0 || u.question || needDecision)) || (has(u,"marriage_seek") && (opts.length>0 || !!F.regret || pulls.length+pushes.length>0)) || needDecision;
    // «هل أسافر أم أبقى؟»: خيار مذكور بصيغة سؤال أو تخيير يكفي ليكون الموقف قرارًا
    if(!decisionish && opts.length && (u.question || /(^| )(ام|او|or|ou|of|o|ou|atau|yoksa|veya|یا)( |$)/.test(u.norm))) decisionish=true;
    var opt=decisionish ? opts[0] : null;
    // «حيرة بين كفّتين» فقط حين ذكر أسبابًا في الاتجاهين؛ ومجرد ذكر خيارين قرارٌ صعب
    var dilemma=decisionish && pulls.length>0 && pushes.length>0;
    // دليل كافٍ؟ وإلا تبقى القراءة المختصرة
    if(!u.themes.length && !u.emotions.length && !pulls.length && !pushes.length && !u.relations.length) return null;

    // الأذى المستمر يتقدم كل بنية: البداية من السلامة والكرامة
    // عائلة الموضوع الأول المسنود بلفظ صريح (للافتتاح والخاتمة حين لا تحدد البنيةُ غيرهما)
    var FAM={ghurba:"ghurba",transition:"transition",emergency:"emergency",digital:"digital",boundaries:"boundaries",people_pleasing:"boundaries",
      work:"work",leadership:"work",rizq:"money",debt:"money",poverty:"money",marriage:"conflict",siblings:"conflict",friends:"conflict",kin:"conflict",
      neighbors:"conflict",argument:"conflict",parents:"conflict",parenting:"parenting",faith_weak:"faith",sin:"faith",waswasa:"faith",death_fear:"faith",
      illness:"health",addiction:"habit",laziness:"habit",desire:"habit"};
    var t0=u.themes.filter(function(t){ return t.hits && t.hits.length && !/^(gratitude|patience|hope|charity)$/.test(t.id); })[0] || u.themes[0];
    var fam=t0 && FAM[t0.id] && X.open[FAM[t0.id]] ? FAM[t0.id] : null;
    var kind = F.harm ? "harm"
      : dilemma ? "dilemma"
      : F.power && (F.livelihood || has(u,"oppressor_power")) && role!=="erred" ? "power"
      : (role==="wronged" || u.themes.slice(0,3).some(function(t){ return /^(injustice|oppressor_power|insult|slander|betrayal)$/.test(t.id) && t.hits && t.hits.length; })) && role!=="erred" ? "wronged"
      : role && role!=="pain" && X.open[role] && (role!=="deciding" || decisionish) ? role
      : (emo(u,"exhaustion") || has(u,"burnout")) ? "burden"
      : (has(u,"self_worth") || pats.indexOf("label")>-1) ? "self"
      : (has(u,"loneliness") && u.themes[0].id==="loneliness") || (emo(u,"loneliness",true) && !u.themes.length) ? "lonely"
      : decisionish ? "deciding"
      : fam && /^(emergency|digital|ghurba|transition|health)$/.test(fam) ? fam
      : fearish && (u.time==="future" || has(u,"anxiety") || RAG.cueHits(u, FAIL).length) ? "anxious"
      : (emo(u,"sadness",true) || (u.themes[0] && /^(sadness|despair)$/.test(u.themes[0].id))) ? "sad"
      : fam || "general";

    // 1) الافتتاح + الكفّتان
    var lab=function(ids){ return ids.slice(0,3).map(function(k){ return pick(F[k].f.label, g); }); };
    var p1=pick(X.open[kind], g);
    if(dilemma && pulls.length && pushes.length) p1+=" "+T(X.balance, list(lab(pulls)), list(lab(pushes)));
    else if(decisionish && pulls.length) p1+=" "+T(pick(X.pullsOnly, g), list(lab(pulls)));
    else if(decisionish && pushes.length) p1+=" "+T(pick(X.pushesOnly, g), list(lab(pushes)));
    P.push(p1);

    // 2) ما يمثله كل خيار
    if(opt && X.option[opt.id]) P.push(pick(X.option[opt.id], g));

    // 3) الخوف الذي وراء الخوف
    var fear = F.harm ? null
      : F.regret && (opt || dilemma) ? "regret_both"
      : F.regret && decisionish ? "regret"
      : F.livelihood ? "livelihood"
      : F.people ? "people"
      : F.past ? "past"
      : F.money && (fearish || decisionish) ? "security"
      : fearish && (has(u,"study") || has(u,"self_worth") || RAG.cueHits(u, FAIL).length>0) ? "failure"
      : fearish && (emo(u,"love") || F.comfort || has(u,"heartbreak")) ? "loss" : null;
    if(fear){ P.push(pick(X.fear[fear], g)); used[fear]=1; }

    // 4) فرق خفي (واحد أو اثنان، بالأولوية)
    var themesIn=function(ids){ return ids.some(function(id){ return has(u,id); }); };
    var cand=[
      ["harm", !!F.harm],
      ["power", F.power && (kind==="wronged" || kind==="power" || has(u,"oppressor_power") || has(u,"injustice"))],
      ["income", F.money && (themesIn(["marriage_seek","marriage","decision"]) || (opt && opt.id==="accept_refuse"))],
      ["family", !!F.family],
      ["desire", F.family && F.desire],
      ["pressure", F.pressure || F.age],
      ["comfort", F.comfort && (themesIn(["marriage_seek","decision","heartbreak"]) || opt)],
      ["griefguilt", (role==="grieving" || has(u,"grief")) && (emo(u,"guilt") || RAG.cueHits(u, GRIEF_GUILT).length>0)],
      ["duty", has(u,"parents") && (F.distance || (opt && opt.id==="move_stay"))],
      ["intent", role==="erred" && themesIn(["argument","anger","insult","parenting","marriage","siblings","parents"])],
      ["guilt", role==="erred" || emo(u,"guilt",true)],
      ["identity", has(u,"self_worth") || pats.indexOf("label")>-1],
      ["facts", pats.indexOf("mindread")>-1],
      ["forgive", themesIn(["forgive","betrayal"]) || (opt && opt.id==="forgive_cut")],
      ["suspicion", themesIn(["jealousy_spouse","suspicion"])],
      ["attach", has(u,"heartbreak") && !F.harm],
      ["care", role==="carer"],
      ["boundaries", (themesIn(["boundaries","kin"]) || (themesIn(["parents","siblings"]) && (F.pressure || emo(u,"anger",true)))) && role!=="carer" && role!=="grieving"],
      ["control", role==="worried" || has(u,"anxiety")],
      ["lonely", has(u,"loneliness") || emo(u,"loneliness",true)],
      ["compare", themesIn(["comparison","envy"]) || pats.indexOf("compare")>-1],
      ["rest", themesIn(["burnout","laziness"]) || emo(u,"exhaustion",true)],
      ["anger", emo(u,"anger",true) || has(u,"anger")],
      ["evidence", fearish && decisionish],
      ["sadness", themesIn(["sadness","despair","grief"])]
    ].filter(function(c){ return c[1] && X.dist[c[0]]; }).map(function(c){ return c[0]; });
    if(fear==="security") cand=cand.filter(function(c){ return c!=="income" || !F.money || cand.length<2; });
    var nDist = 2;
    // فقرتا «فرق» متتاليتان: تنويع مطلع الثانية بالعربية حتى لا تتكرر «وثمة فرق»
    cand.slice(0,nDist).forEach(function(c,i){ var t=pick(X.dist[c], g); if(i>0 && AR()) t=t.replace(/^وثمة فرق/,"وهناك أيضًا فرق"); P.push(t); });

    // 5) فقرات تعميق من نصوص مترجمة مسبقًا، حتى 5 فقرات في المتن: طبيعة العلاقة ← ما وراء الشعور ← زاوية أوسع
    //    (بلا أسئلة ولا أوامر؛ وللمؤنث بالعربية تُستبعد النصوص التي فيها فعل مخاطَب بصيغة المذكر)
    var A=window.ANALYSIS_TEXT, clean=function(t){ return t && !/[؟?]|اسأل/.test(t); }, femOk=function(set, id){ return !(g && AR()) || !set.test(id); };
    var BODY=5, picked=cand.slice(0,nDist);
    var rel=u.relations[0];
    if(P.length<BODY && rel && A && clean(A.rel[rel.id]) && femOk(FEM_BAD_REL, rel.id) && !(kind==="carer" && /parent|child/.test(rel.id) && P.length>=4)) P.push(T(X.relFrame, AR() ? fem(T(A.rel[rel.id]), g) : T(A.rel[rel.id])));
    var taken={anger:picked.indexOf("anger")>-1, sadness:picked.indexOf("sadness")>-1, loneliness:picked.indexOf("lonely")>-1||kind==="lonely", fear:!!fear||kind==="anxious", guilt:picked.indexOf("guilt")>-1};
    var e0=u.emotions.filter(function(e){ return !e.implied && e.id!=="joy" && !taken[e.id] && (e.id!=="confusion" || decisionish) && A && clean(A.emo[e.id]) && femOk(FEM_BAD_EMO, e.id); })[0];
    if(P.length<BODY && e0) P.push(T(g && AR() ? X.emoFrame.replace("تشعر به","تشعرين به") : X.emoFrame, lc(fem(T(A.emo[e0.id]), g))));
    // زاوية أوسع من أول موضوع لا يكرر فكرة الافتتاح («ألمان» في الظلم من صاحب سلطة، القلق في القلق…)
    var DUP={ghurba:/^ghurba$/, transition:/^transition$/, emergency:/^emergency$/, digital:/^digital$/, boundaries:/^(boundaries|people_pleasing)$/, health:/^illness$/, habit:/^(addiction|laziness|desire)$/, money:/^(rizq|debt|poverty)$/, power:/^(injustice|oppressor_power)$/, anxious:/^(anxiety|fear)$/, lonely:/^loneliness$/, sad:/^sadness$/, grieving:/^grief$/, burden:/^burnout$/, self:/^self_worth$/};
    var lt=u.themes.filter(function(t){ return !/^(gratitude|patience|hope|charity|decision)$/.test(t.id) && A && clean(A.lens[t.id]) && femOk(FEM_BAD_LENS, t.id) && !(DUP[kind] && DUP[kind].test(t.id)); })[0];
    // انتقال أو غربة لم يُلتقط موضوعها: «منذ انتقلت إلى هذه المدينة»
    var ltId=lt ? lt.id : (F.distance && A && A.lens.transition && femOk(FEM_BAD_LENS,"transition") ? "transition" : null);
    if(P.length<BODY && ltId) P.push(T(X.lens, lc(fem(T(A.lens[ltId]), g))));

    // 6) الخاتمة + أقرب موقف
    var ck = kind==="dilemma" ? (F.regret ? "dilemma_regret" : "dilemma") : kind==="power" ? "wronged" : kind;
    P.push(pick(X.close[ck] || X.close.general, g));
    if(r.sits[0]) P.push(T("وأقرب ما وجدته لحالتك: «{0}».", r.sits[0].s.title));
    return {text:P.join("\n\n"), kind:kind, gender:g, factors:Object.keys(F), option:opt?opt.id:null, fear:fear};
  }

  return {compose:compose, gender:gender};
})();
