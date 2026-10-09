/* ======================================================================
   رِفقة الأُسوة — طبقة التوليد المعزز بالاسترجاع (اختيارية)
   ----------------------------------------------------------------------
   - معطّلة افتراضيًا. تعمل فقط إذا أدخل المستخدم مفتاح Claude API الخاص به.
   - المفتاح يُحفظ في هذا الجهاز فقط (localStorage) ولا يُرسل إلا إلى
     api.anthropic.com مباشرة.
   - لا يُرسل إلى النموذج إلا: نص المستخدم + المقاطع المسترجعة من المكتبة
     الموثقة، مع تعليمات صارمة بعدم الاستشهاد بأي نص خارجها.
   - نستخدم fetch مباشرة (بلا SDK) لأن التطبيق ثابت بلا أداة بناء ويجب أن
     يعمل داخل WebView أندرويد وElectron دون تبعيات خارجية.
   ====================================================================== */
var AI = (function(){
  "use strict";
  var LS_KEY="rifqa.ai.settings";
  var MODELS=[
    {id:"claude-opus-5",label:"Claude Opus 5 — الأعمق تحليلًا (افتراضي)"},
    {id:"claude-sonnet-5",label:"Claude Sonnet 5 — متوازن وأسرع"},
    {id:"claude-haiku-4-5",label:"Claude Haiku 4.5 — الأسرع والأقل كلفة"}
  ];
  function load(){
    try{ var s=JSON.parse(localStorage.getItem(LS_KEY)||"{}"); return {key:s.key||"", model:s.model||MODELS[0].id, auto:!!s.auto}; }
    catch(e){ return {key:"",model:MODELS[0].id,auto:false}; }
  }
  function save(s){ try{ localStorage.setItem(LS_KEY, JSON.stringify(s)); return true; }catch(e){ return false; } }
  function enabled(){ return !!load().key; }

  var SYSTEM=[
    "أنت «رفيق الأسوة»: مساعد تأملي يساعد المسلم على فهم موقف يمرّ به في ضوء القرآن الكريم والسنة النبوية والسيرة.",
    "",
    "قواعد إلزامية لا استثناء فيها:",
    "1) لا تستشهد بأي آية أو حديث أو أثر إلا من «المقاطع المسترجعة» المرفقة، وانقلها بنصها دون تحريف، واذكر رمزها بين قوسين مثل [Q2] أو [H1] أو [S1].",
    "2) لا تنسب إلى النبي ﷺ قولًا أو فعلًا غير موجود في المقاطع. إن احتجت دليلًا غير موجود فقل صراحة إن المكتبة الحالية لا تتضمنه ولا تخترعه.",
    "3) عند ذكر حديث اذكر درجته كما وردت. ما وُسم بـ[خلاصة بالمعنى] لا تقدّمه على أنه لفظ نبوي حرفي.",
    "4) لا تُصدر فتوى ولا حكمًا فقهيًا ملزمًا في طلاق أو ميراث أو معاملات أو حدود؛ وجّه إلى عالم مؤهل أو مختص.",
    "5) إن ظهرت إشارات خطر على النفس أو عنف أو إيذاء، فابدأ بتوجيه واضح ولطيف لطلب مساعدة فورية من شخص موثوق أو جهة مختصة.",
    "6) لا تلُم المتألم، ولا تفسّر مصيبته بأنها عقوبة، ولا تستعمل النصوص لتبرير بقاء شخص في علاقة مؤذية.",
    "7) كن دقيقًا في التمييز بين ما هو واجب شرعًا وما هو فضل ومستحب (مثل: العفو فضل لا يُكره عليه المظلوم).",
    "",
    "أسلوب الإجابة: عربية فصحى سهلة ودافئة، مخاطبة مباشرة، بلا وعظ متعالٍ، وبلا إطالة.",
    "بنية الإجابة (استخدم عناوين ## بالترتيب):",
    "## فهم أعمق لحالتك — ما الذي يحدث فعلًا تحت السطح (المشاعر، الحاجات، الديناميكية بين الأطراف)، في 3-5 جمل.",
    "## ماذا يقول الوحي عن موقف كهذا — اربط بين 2-4 مقاطع مسترجعة ربطًا تحليليًا يبيّن وجه الشبه والفرق مع حالته، لا مجرد سرد.",
    "## التوازنات الدقيقة — ما الذي يجمع فيه المنهج بين أمرين (مثل: العفو والحزم، الصبر والسعي، البر والاستقلال) وكيف ينطبق ذلك على حالته.",
    "## خطوات عملية مخصصة — 4-6 خطوات مرتبة ومحددة لحالته هو (لا عامة).",
    "## كلمة أخيرة — جملة أو جملتان تبعث الطمأنينة، مع دعاء مأثور مناسب من المقاطع إن وجد.",
    "واختم دائمًا بسطر: «هذا تأمل إرشادي وليس فتوى».",
  ].join("\n");

  var SYSTEM_EN=[
    "You are \"Rafiq al-Uswa\": a reflective companion that helps a Muslim understand a situation they are going through in the light of the Noble Quran, the Prophetic Sunnah and the Seerah.",
    "",
    "Mandatory rules, without exception:",
    "1) Cite no verse, hadith or report except from the attached \"retrieved passages\". Quote them without distortion (the Arabic text and the English meaning given), and give their code in brackets, e.g. [Q2], [H1] or [S1].",
    "2) Never attribute to the Prophet ﷺ any saying or action that is not in the passages. If you need evidence that is not there, say plainly that the current library does not contain it; never invent it.",
    "3) When mentioning a hadith, state its grade exactly as given. Anything marked [summary of meaning] must not be presented as the literal wording of the Prophet ﷺ.",
    "4) Do not issue a fatwa or a binding legal ruling on divorce, inheritance, financial dealings or legal penalties; refer the person to a qualified scholar or specialist.",
    "5) If there are signs of danger to self, violence or abuse, begin with clear, gentle guidance to seek immediate help from a trusted person or a specialised service.",
    "6) Do not blame the one who is suffering, do not interpret their hardship as a punishment, and never use the texts to justify someone staying in a harmful relationship.",
    "7) Distinguish carefully between what is religiously obligatory and what is a virtue or recommended (e.g. forgiveness is a virtue; the wronged person is never forced into it).",
    "",
    "Style: clear, warm English, speaking directly to the person, without lecturing or condescension, and without padding.",
    "Structure (use ## headings in this order):",
    "## A deeper understanding of your situation — what is really happening beneath the surface (feelings, needs, the dynamic between the people involved), in 3-5 sentences.",
    "## What revelation says about a situation like this — connect 2-4 retrieved passages analytically, showing the similarities and differences with their case, not just listing them.",
    "## The fine balances — where the Prophetic way combines two things (e.g. forgiveness and firmness, patience and effort, kindness to parents and independence) and how that applies to their case.",
    "## Practical steps for you — 4-6 ordered, specific steps for their own case (not generic).",
    "## A final word — one or two sentences that bring reassurance, with a suitable authentic supplication from the passages if available.",
    "Always end with the line: \"This is a guiding reflection, not a fatwa.\"",
  ].join("\n");

  // اللغات الأوروبية الأخرى: القواعد نفسها، مع لغة الإجابة وعناوين أقسامها وسطر الختام بلغة المستخدم
  var LOC={
    nl:{name:"Dutch (Nederlands)", short:"Dutch", h:["Een dieper begrip van je situatie","Wat de openbaring zegt over zo'n situatie","Het fijne evenwicht","Praktische stappen voor jou","Een laatste woord"], end:"Dit is een begeleidende overdenking, geen fatwa."},
    es:{name:"Spanish (español)", short:"Spanish", h:["Una comprensión más profunda de tu situación","Lo que dice la revelación sobre una situación así","Los equilibrios sutiles","Pasos prácticos para ti","Una última palabra"], end:"Esta es una reflexión orientativa, no una fetua."},
    pt:{name:"European Portuguese (português de Portugal)", short:"Portuguese", h:["Uma compreensão mais profunda da tua situação","O que a revelação diz sobre uma situação assim","Os equilíbrios subtis","Passos práticos para ti","Uma última palavra"], end:"Esta é uma reflexão orientadora, não uma fatwa."}
  };
  function systemFor(l){
    var c=LOC[l]; if(!c) return SYSTEM_EN;
    return SYSTEM_EN
      .replace("(the Arabic text and the English meaning given)","(the Arabic text and the "+c.short+" meaning given)")
      .replace("Style: clear, warm English,","Style: clear, warm "+c.name+",")
      .replace("## A deeper understanding of your situation","## "+c.h[0])
      .replace("## What revelation says about a situation like this","## "+c.h[1])
      .replace("## The fine balances","## "+c.h[2])
      .replace("## Practical steps for you","## "+c.h[3])
      .replace("## A final word","## "+c.h[4])
      .replace("Always end with the line: \"This is a guiding reflection, not a fatwa.\"","Always end with the line: \""+c.end+"\" Write everything in "+c.short+".");
  }

  function buildUserTurn(analysis){
    if(window.I18N && I18N.en) return "## The user's situation (in their own words)\n«"+analysis.input+"»\n\n# Passages retrieved from the verified library\n"+RAG.contextFor(analysis)+
      "\n\nAnalyse their situation in depth according to the rules and structure above, citing the codes. Answer in "+(LOC[I18N.lang]?LOC[I18N.lang].name:"English")+".";
    return "## موقف المستخدم (بكلماته)\n«"+analysis.input+"»\n\n# المقاطع المسترجعة من المكتبة الموثقة\n"+RAG.contextFor(analysis)+
      "\n\nحلّل موقفه تحليلًا عميقًا وفق القواعد والبنية المحددة، مستشهدًا بالرموز.";
  }

  /* بث الاستجابة (SSE) من Messages API. callbacks: onText(delta), onDone(info), onError(msg) */
  function stream(messages, cb){
    var s=load();
    if(!s.key){ cb.onError(T("لم يُضبط مفتاح API بعد.")); return {abort:function(){}}; }
    var ctrl=("AbortController" in window)?new AbortController():null;
    var headers={
      "content-type":"application/json",
      "x-api-key":s.key,
      "anthropic-version":"2023-06-01",
      "anthropic-dangerous-direct-browser-access":"true"
    };
    var body={model:s.model, max_tokens:8000, stream:true, system:(window.I18N && I18N.en)?systemFor(I18N.lang):SYSTEM, messages:messages};
    if(s.model==="claude-opus-5"){
      // إعادة توجيه تلقائية لنموذج بديل إن رُفض الطلب لأسباب تتعلق بالسياسة
      headers["anthropic-beta"]="server-side-fallback-2026-07-01";
      body.fallbacks="default";
    }
    if(s.model!=="claude-haiku-4-5") body.thinking={type:"adaptive"};
    var stopReason=null, gotText=false;
    fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:headers,body:JSON.stringify(body),signal:ctrl?ctrl.signal:undefined})
      .then(function(res){
        if(!res.ok){
          return res.text().then(function(t){
            var msg=""; try{ msg=JSON.parse(t).error.message; }catch(e){ msg=t.slice(0,200); }
            var human = res.status===401 ? T("مفتاح API غير صحيح أو منتهي الصلاحية.") :
                        res.status===403 ? T("المفتاح لا يملك صلاحية لهذا النموذج.") :
                        res.status===429 ? T("تم تجاوز حد الطلبات مؤقتًا. حاول بعد قليل.") :
                        (res.status===529||res.status>=500) ? T("خدمة Claude مشغولة حاليًا. حاول بعد قليل.") :
                        T("تعذّر الطلب ({0}).",res.status);
            throw new Error(human+(msg?" — "+msg:""));
          });
        }
        var reader=res.body.getReader(), dec=new TextDecoder("utf-8"), buf="";
        function pump(){
          return reader.read().then(function(r){
            if(r.done){ cb.onDone({stopReason:stopReason, empty:!gotText}); return; }
            buf+=dec.decode(r.value,{stream:true});
            var parts=buf.split("\n\n"); buf=parts.pop();
            parts.forEach(function(evt){
              var dataLine=evt.split("\n").filter(function(l){return l.indexOf("data:")===0;}).map(function(l){return l.slice(5).trim();}).join("");
              if(!dataLine) return;
              var d; try{ d=JSON.parse(dataLine); }catch(e){ return; }
              if(d.type==="content_block_delta" && d.delta && d.delta.type==="text_delta"){ gotText=true; cb.onText(d.delta.text); }
              else if(d.type==="message_delta" && d.delta && d.delta.stop_reason){ stopReason=d.delta.stop_reason; }
              else if(d.type==="error"){ throw new Error((d.error&&d.error.message)||T("خطأ أثناء البث")); }
            });
            return pump();
          });
        }
        return pump();
      })
      .catch(function(err){
        if(err && err.name==="AbortError") return;
        var m=(err&&err.message)||String(err);
        if(/Failed to fetch|NetworkError|Load failed/i.test(m)) m=T("لا يوجد اتصال بالإنترنت، أو تم حظر الطلب. التحليل الموثق أعلاه يعمل دون إنترنت.");
        cb.onError(m);
      });
    return {abort:function(){ if(ctrl) ctrl.abort(); }};
  }

  return {MODELS:MODELS, load:load, save:save, enabled:enabled, buildUserTurn:buildUserTurn, stream:stream};
})();
