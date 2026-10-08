/* ======================================================================
   رِفقة الأُسوة — محرك الاسترجاع والتحليل (RAG engine, 100% offline)
   ----------------------------------------------------------------------
   المراحل:
   1) الفهم (Understanding): تطبيع النص العربي + تجذيع خفيف + كشف الموضوعات
      والمشاعر والعلاقات وشدة الموقف وموقع المتكلم (مظلوم/مخطئ).
   2) التوسيع (Query expansion): إضافة مفردات الموضوعات المكتشفة للاستعلام.
   3) الاسترجاع (Retrieval): BM25 على ثلاثة فهارس (المواقف، الآيات، الأحاديث)
      مع تعزيز دلالي من خريطة الموضوعات.
   4) التركيب (Synthesis): بناء تحليل متعدد الأبعاد من المقاطع المسترجعة فقط.
   لا يُولَّد أي نص ديني؛ كل آية وحديث يأتي من المكتبة الموثقة كما هو.
   ====================================================================== */
var RAG = (function(){
  "use strict";

  /* ---------------- 1. معالجة النص العربي ---------------- */
  function normalize(str){
    var t=String(str||"");
    if(t.normalize) t=t.normalize("NFD").replace(/[\u0300-\u036f]/g,"");   // é ë ï ← e e i (الهولندية)؛ همزات العربية تُوحَّد بعدها كما كانت
    return t
      .toLowerCase()
      .replace(/[ً-ٰٟـ]/g,"")      // تشكيل وتطويل
      .replace(/[إأآٱا]/g,"ا")
      .replace(/ى/g,"ي").replace(/ة/g,"ه")
      .replace(/ؤ/g,"و").replace(/ئ/g,"ي")
      .replace(/[٠-٩]/g,d=>String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
      .replace(/[^ء-ي0-9a-z\s]/g," ")
      .replace(/\s+/g," ").trim();
  }

  var STOP = new Set(("من في على الي الى عن مع هو هي انا انت انتي انتم انتما هم هن نحن ثم او ام لا لم لن ولا و ف ب ك ل هذا هذه ذلك تلك هذي هاذا هاذي " +
    "الذي التي الذين اللذين اللاتي كان كانت كانوا يكون تكون قد لقد ما ماذا لماذا كيف متي اين كل بعض غير بين عند عندي حتي اذا ان انه انها " +
    "له لها لهم لي لك لكم عليه عليها عليك عليكم علي معه معها معي معك منه منها مني منك اليه اليها به بها بي بك فيه فيها فيا " +
    "نفس بنفس جدا ايضا كنت اكون يا ايها اي لكن لان لانه لانها لاني بعد قبل حين عندما لما الان هنا هناك فقط حتى " +
    "راني راه راهو هاذ اللي الي بش باش كي وقتلي برشا ياسر شنو شنوه علاش كيفاش واش ماشي مش مو ايش شو ليش هيك كده ده دي " +
    "يعني طيب اه ايوه نعم بس " +
    "the a an and or of to in is i my me it this that am are was were be been being have has had do does did so but if then than " +
    "he she they them his her their we us our you your yours im ive dont didnt doesnt cant wont isnt its at on for with from by as about " +
    "into over after before when what who whom which why how just very really also too much many more most some any all no not " +
    "can could would should will shall may might must there here up down out off again still even ever " +
    "de het een en of van te in is ik mijn me mij het dit dat die deze ben zijn was waren wordt werd worden heb heeft had hebben " +
    "hij zij ze hem haar hun wij we ons onze jij je jou jouw u uw er hier daar op voor met uit door als aan om tot bij naar over " +
    "na toen wanneer wat wie welke waarom hoe maar dan al ook nog wel niet geen nooit zo zeer erg heel veel meer meest alle alles " +
    "iets niets kan kon zou zouden moet moeten mag mogen wil willen zal zullen gaat gaan doe doet deed").split(" "));

  var PREFIXES = ["وبال","وال","بال","كال","فال","لل","ال","وب","ول","وس","فس","و","ف","ب","ك","ل","س"];
  var SUFFIXES = ["تموها","كموها","هما","كما","تما","تان","تين","ونا","ون","ين","ان","ات","ها","هم","هن","كم","كن","نا","ني","وا","يه","يا","ته","تي","ه","ي","ك","ت"];

  /* تجذيع خفيف: يحذف سابقة واحدة ولاحقة (أو اثنتين) مع إبقاء جذر لا يقل عن 3 أحرف */
  /* تجذيع إنجليزي خفيف (للواجهة الإنجليزية): يوحّد صيغ الجمع والأفعال الشائعة */
  function stemEn(w){
    if(w.length<=3 || /[0-9]/.test(w)) return w;
    if(/ies$/.test(w) && w.length>4) return w.slice(0,-3)+"y";
    if(/(ness|ment|ings?)$/.test(w) && w.length>6) w=w.replace(/(ness|ment|ings?)$/,"");
    else if(/edly$/.test(w)) w=w.slice(0,-4);
    else if(/(ed|ly)$/.test(w) && w.length>5) w=w.slice(0,-2);
    else if(/(ss|sh|ch|x|z)es$/.test(w)) w=w.slice(0,-2);
    else if(/s$/.test(w) && !/(ss|us|is)$/.test(w)) w=w.slice(0,-1);
    if(/(.)\1$/.test(w) && !/(ll|ss|ff|zz)$/.test(w)) w=w.slice(0,-1);
    if(/e$/.test(w) && w.length>4) w=w.slice(0,-1);
    return w;
  }
  /* تجذيع هولندي خفيف: الجمع (-en, -s)، والنهايات الشائعة، وتوحيد الحرف المضاعف (vrienden ← vriend، zorgen ← zorg) */
  function stemNl(w){
    if(w.length<=3 || /[0-9]/.test(w)) return w;
    if(/heden$/.test(w)) return w.slice(0,-5)+"heid";
    if(/(ingen|ing)$/.test(w) && w.length>6) w=w.replace(/(ingen|ing)$/,"");
    else if(/(lijk|lijke|baar|bare)$/.test(w) && w.length>7) w=w.replace(/(lijke|lijk|bare|baar)$/,"");
    else if(/en$/.test(w) && w.length>5) w=w.slice(0,-2);
    else if(/(te|de)$/.test(w) && w.length>5) w=w.slice(0,-2);
    else if(/[^aeiou]e$/.test(w) && w.length>4) w=w.slice(0,-1);
    else if(/s$/.test(w) && !/(ss|is|us)$/.test(w) && w.length>4) w=w.slice(0,-1);
    else if(/t$/.test(w) && w.length>5 && !/(st|cht|ft)$/.test(w)) w=w.slice(0,-1);
    if(/([bcdfgklmnprst])\1$/.test(w)) w=w.slice(0,-1);
    return w.replace(/v$/,"f").replace(/z$/,"s");
  }
  var NL_STEM=!!(window.I18N && I18N.nl);
  function stem(w){
    if(!w) return w;
    if(/[a-z]/.test(w)) return NL_STEM?stemNl(w):stemEn(w);
    if(w.length<=3 || /[0-9]/.test(w)) return w;
    var s=w, i;
    for(i=0;i<PREFIXES.length;i++){
      var p=PREFIXES[i];
      if(s.indexOf(p)===0 && s.length-p.length>=3){ s=s.slice(p.length); break; }
    }
    for(var pass=0; pass<2; pass++){
      var cut=false;
      for(i=0;i<SUFFIXES.length;i++){
        var x=SUFFIXES[i];
        if(s.length-x.length>=3 && s.slice(-x.length)===x){ s=s.slice(0,-x.length); cut=true; break; }
      }
      if(!cut) break;
    }
    return s;
  }
  function words(norm){ return norm.split(" ").filter(Boolean); }
  function contentWords(norm){ return words(norm).filter(function(w){ return !STOP.has(w) && w.length>1; }); }
  function stems(text){ return contentWords(normalize(text)).map(stem); }

  /* ---------------- 2. فهرس BM25 ---------------- */
  function Index(){ this.docs=[]; this.df=Object.create(null); this.avg=1; }
  Index.prototype.add=function(id, fields){
    var tf=Object.create(null), len=0;
    fields.forEach(function(f){
      if(!f || !f.text) return;
      var arr=Array.isArray(f.text)?f.text.join("   "):f.text;
      stems(arr).forEach(function(s){ tf[s]=(tf[s]||0)+f.w; len+=f.w; });
    });
    this.docs.push({id:id, tf:tf, len:len||1});
  };
  Index.prototype.finish=function(){
    var df=this.df, total=0;
    this.docs.forEach(function(d){ total+=d.len; for(var t in d.tf) df[t]=(df[t]||0)+1; });
    this.avg=total/Math.max(1,this.docs.length);
    this.N=this.docs.length;
  };
  Index.prototype.idf=function(t){
    var n=this.df[t]||0; return Math.log(1+(this.N-n+0.5)/(n+0.5));
  };
  /* q: {stem: weight} → Map id→score */
  Index.prototype.search=function(q){
    var k1=1.4, b=0.72, out=Object.create(null), self=this;
    this.docs.forEach(function(d){
      var s=0;
      for(var t in q){
        var f=d.tf[t]; if(!f) continue;
        s+=self.idf(t)*(f*(k1+1))/(f+k1*(1-b+b*d.len/self.avg))*q[t];
      }
      if(s>0) out[d.id]=s;
    });
    return out;
  };

  var IDX={sit:new Index(), quran:new Index(), hadith:new Index(), theme:new Index()};
  var BY={sit:{}, quran:{}, hadith:{}, theme:{}};
  var THEME_OF_SIT=Object.create(null);   // sitId -> [themeIds]
  var TRIG=[];                              // [{theme, norm, multi, len}]
  var built=false;

  function build(){
    if(built) return;
    SITUATIONS.forEach(function(s){
      BY.sit[s.id]=s;
      IDX.sit.add(s.id,[
        {text:s.title,w:3},{text:s.keywords,w:3},{text:s.semanticTags,w:2.5},
        {text:s.problemType,w:2},{text:s.emotionsAddressed,w:1.6},{text:s.subCategories,w:1.6},
        {text:s.mainCategory,w:1},{text:s.responseType,w:0.8},{text:s.principles,w:0.8},
        {text:s.modernApplications,w:0.6},{text:s.eventDescription,w:0.5},{text:s.whatToAvoid,w:0.4},
        {text:(s.hadithRefs||[]).map(function(h){return h.text;}),w:0.3},
        {text:(s.quranRefs||[]).map(function(q){return q.text+" "+(q.relevance||"");}),w:0.4}
      ]);
    });
    QURAN_LIB.forEach(function(q){
      BY.quran[q.id]=q;
      IDX.quran.add(q.id,[{text:q.t,w:1.2},{text:q.n,w:1},{text:q.th.map(themeLabel),w:1.5}]);
    });
    HADITH_LIB.forEach(function(h){
      BY.hadith[h.id]=h;
      IDX.hadith.add(h.id,[{text:h.t,w:1.2},{text:h.n,w:1},{text:h.th.map(themeLabel),w:1.5},{text:h.w||"",w:1}]);
    });
    THEMES.forEach(function(t){
      BY.theme[t.id]=t;
      IDX.theme.add(t.id,[{text:t.label,w:3},{text:t.triggers,w:2},{text:t.insight,w:0.35},{text:t.questions,w:0.3}]);
      t.sits.forEach(function(id){ (THEME_OF_SIT[id]=THEME_OF_SIT[id]||[]).push(t.id); });
      t.triggers.forEach(function(tr){
        var n=normalize(tr); if(!n) return;
        TRIG.push({theme:t.id, norm:n, multi:n.indexOf(" ")>-1, len:n.length});
      });
    });
    ["sit","quran","hadith","theme"].forEach(function(k){ IDX[k].finish(); });
    built=true;
  }
  function themeLabel(id){ var t=BY.theme[id]||THEMES.find(function(x){return x.id===id;}); return t?t.label:""; }

  /* ---------------- 3. الفهم ---------------- */
  function stripPrefix(w){
    for(var i=0;i<PREFIXES.length;i++){ var p=PREFIXES[i]; if(w.indexOf(p)===0 && w.length-p.length>=2) return w.slice(p.length); }
    return w;
  }
  /* هل تظهر الكلمة المفردة ضمن كلمات المستخدم (مع السوابق واللواحق)؟ */
  function wordHit(userWords, trig){
    if(trig.length<3){ return userWords.indexOf(trig)>-1; }
    for(var i=0;i<userWords.length;i++){
      var u=userWords[i];
      if(u===trig) return true;
      var sp=stripPrefix(u);
      if(sp===trig) return true;
      if(trig.length>=4 && (sp.indexOf(trig)===0 || u.indexOf(trig)===0)) return true;
      if(trig.length===3 && sp.indexOf(trig)===0 && sp.length<=trig.length+3) return true;
    }
    return false;
  }
  /* عبارة متعددة الكلمات داخل النص، مع التسامح مع و/ف/ب الملتصقة بأولها */
  function phraseIn(norm, n){
    var h=" "+norm+" ";
    return h.indexOf(" "+n)>-1 || h.indexOf(" و"+n)>-1 || h.indexOf(" ف"+n)>-1 || h.indexOf(" ب"+n)>-1;
  }
  function lexHits(norm, userWords, list){
    return list.filter(function(w){
      var n=normalize(w); if(!n) return false;
      return n.indexOf(" ")>-1 ? phraseIn(norm,n) : wordHit(userWords,n);
    });
  }

  function detectThemes(norm, userWords, qStems){
    var scores=Object.create(null), hits=Object.create(null);
    TRIG.forEach(function(tr){
      var ok = tr.multi ? phraseIn(norm, tr.norm) : wordHit(userWords, tr.norm);
      if(!ok) return;
      var w = tr.multi ? 1.6+Math.min(1.2,tr.len/12) : (tr.len>=5?1.15:0.9);
      scores[tr.theme]=(scores[tr.theme]||0)+w;
      (hits[tr.theme]=hits[tr.theme]||[]).push(tr.norm);
    });
    // إشارة دلالية إضافية من فهرس الموضوعات (تلتقط ما لم تلتقطه الألفاظ)
    var q={}; qStems.forEach(function(s){ q[s]=(q[s]||0)+1; });
    var sem=IDX.theme.search(q);
    for(var id in sem){ var sv=Math.min(1.3, sem[id]*0.18); if(scores[id]) scores[id]+=sv; else if(sv>=1.0) scores[id]=sv; }
    var list=Object.keys(scores).map(function(id){
      return {id:id, theme:BY.theme[id], score:scores[id], hits:(hits[id]||[])};
    }).filter(function(x){ return x.theme && x.score>=0.9; })
      .sort(function(a,b){ return b.score-a.score; });
    var top=list.length?list[0].score:1;
    list.forEach(function(x){ x.conf=Math.max(0.15, Math.min(1, x.score/Math.max(3.2, top))); });
    // تجميع: الموضوعات ذات الثقة المنخفضة جدًا مقارنة بالأول تُستبعد
    return list.filter(function(x,i){ return i<2 || x.score>=top*0.34; }).slice(0,5);
  }

  function understand(raw){
    build();
    var norm=normalize(raw), userWords=words(norm), qStems=stems(raw);
    var themes=detectThemes(norm, userWords, qStems);
    // عند إشارات إيذاء النفس: موضوع «اليأس» أولًا دائمًا، ويُستبعد «الخوف من الموت» حتى لا يُساء الفهم
    var crisis=/(اموت|الموت ارحم|انتحار|انتحر|انهي حياتي|اقتل نفسي|نقتل روحي|ان اعيش|اذي نفسي|اؤذي نفسي|suicid|kill myself|end my life|want to die|wish i (was|were) dead|hurt myself|harm myself|self harm|no reason to live|zelfmoord|mezelf (van kant|iets aan)|dood wil|wil (dood|sterven)|niet meer (leven|verder)|wou dat ik dood|mezelf pijn|zelfbeschadiging|een eind aan mijn leven)/.test(norm);
    if(crisis){
      themes=themes.filter(function(t){ return t.id!=="death_fear" && t.id!=="despair"; });
      themes.unshift({id:"despair", theme:BY.theme.despair, score:9, conf:1, hits:[T("إشارات ألم شديد")]});
    }
    var emotions=EMOTION_LEXICON.map(function(e){
      var h=lexHits(norm,userWords,e.words); return {id:e.id,label:e.label,count:h.length,hits:h};
    }).filter(function(e){ return e.count>0; }).sort(function(a,b){ return b.count-a.count; });
    // استنتاج مشاعر من الموضوعات إن لم تُذكر صراحة
    var implied={anger:"anger",sadness:"sadness",grief:"sadness",anxiety:"fear",fear:"fear",loneliness:"loneliness",despair:"despair",sin:"guilt",betrayal:"betrayal",insult:"shame",burnout:"exhaustion",decision:"confusion",envy:"jealousy",jealousy_spouse:"jealousy",heartbreak:"love"};
    themes.slice(0,3).forEach(function(t){
      var eid=implied[t.id]; if(!eid) return;
      if(!emotions.some(function(e){return e.id===eid;})){
        var def=EMOTION_LEXICON.find(function(e){return e.id===eid;});
        if(def) emotions.push({id:eid,label:def.label,count:0,implied:true,hits:[]});
      }
    });
    var relations=RELATION_LEXICON.map(function(r){
      var h=lexHits(norm,userWords,r.words); return {id:r.id,label:r.label,count:h.length};
    }).filter(function(r){ return r.count>0; }).sort(function(a,b){ return b.count-a.count; });
    var intens=lexHits(norm,userWords,INTENSIFIERS).length + ((raw.match(/[!！؟?]{2,}/g)||[]).length);
    var intensity = Math.min(3, 1 + (intens>=1?1:0) + (intens>=3?1:0) + (userWords.length>60?0.5:0));
    var selfFault = lexHits(norm,userWords,SELF_FAULT_CUES).length>0;
    return {raw:raw, norm:norm, words:userWords, stems:qStems, themes:themes, emotions:emotions.slice(0,4),
            relations:relations.slice(0,3), intensity:intensity, selfFault:selfFault, crisis:crisis};
  }

  /* ---------------- 4. الاسترجاع ---------------- */
  function legacySitScore(userWords, norm, s){
    var score=0;
    (s.keywords||[]).forEach(function(kw){
      var n=normalize(kw); if(!n) return;
      var ws=contentWords(n); if(!ws.length) return;
      var hit=ws.filter(function(w){ return wordHit(userWords,w) || userWords.some(function(u){ return stem(u)===stem(w); }); }).length;
      var r=hit/ws.length;
      if(r>=0.6) score+=2.2*r;
      if(phraseIn(norm,n)) score+=1.5;
    });
    return score;
  }
  function rankMap(map){ return Object.keys(map).map(function(id){return {id:id,score:map[id]};}).sort(function(a,b){return b.score-a.score;}); }

  function retrieve(u){
    var q=Object.create(null);
    u.stems.forEach(function(s){ q[s]=(q[s]||0)+1; });
    // توسيع الاستعلام بمفردات الموضوعات المكتشفة
    u.themes.slice(0,3).forEach(function(t){
      var add=stems(t.theme.label+" "+t.theme.triggers.slice(0,8).join(" "));
      add.forEach(function(s){ q[s]=(q[s]||0)+0.3*t.conf; });
    });
    var themeConf=Object.create(null); u.themes.forEach(function(t){ themeConf[t.id]=t.conf; });

    // المواقف
    var sitBm=IDX.sit.search(q), sits=[];
    SITUATIONS.forEach(function(s){
      var bm=sitBm[s.id]||0, lg=legacySitScore(u.words,u.norm,s), boost=0, via=[];
      (THEME_OF_SIT[s.id]||[]).forEach(function(tid){ if(themeConf[tid]){ boost+=2.6*themeConf[tid]; via.push(tid);} });
      if(u.selfFault && /الأخطاء|التوبة/.test(s.mainCategory+" "+s.semanticTags.join(" "))) boost+=0.8;
      var score=bm*0.9+lg*0.8+boost;
      if(score>0) sits.push({s:s, score:score, bm:bm, legacy:lg, via:via});
    });
    sits.sort(function(a,b){ return b.score-a.score; });

    function libRank(idx, lib, extra){
      var bm=idx.search(q), out=[];
      lib.forEach(function(it){
        if(it.sensitive && !u.crisis) return;   // نصوص خاصة بحالات الأزمة لا تظهر إلا عند وجود إشاراتها
        var b=bm[it.id]||0, boost=0, via=[];
        it.th.forEach(function(tid){ if(themeConf[tid]){ boost+=2.1*themeConf[tid]; via.push(tid);} });
        if(extra) boost+=extra(it);
        // بلا صلة موضوعية يُشترط تطابق نصي قوي حتى لا تظهر نصوص بعيدة عن الحالة
        if(!via.length && b<2.6) return;
        var s=b+boost; if(s>0.4) out.push({item:it, score:s, via:via});
      });
      return out.sort(function(a,b){ return b.score-a.score; });
    }
    var ayat=libRank(IDX.quran, QURAN_LIB);
    var hadith=libRank(IDX.hadith, HADITH_LIB);

    // إزالة الآيات/الأحاديث المكررة داخل الموقف الأول (تفادي التكرار في العرض)
    var top=sits[0]&&sits[0].s;
    var shownQ=new Set((top&&top.quranRefs||[]).map(function(r){return r.surahName+"|"+r.ayahNumber;}));
    ayat=ayat.filter(function(a){ return !shownQ.has(a.item.s+"|"+parseInt(a.item.a,10)); });

    // الأدعية: لا تُقترح إلا ما ارتبط بموضوعات الحالة نفسها
    var duas=[].concat(
      hadith.filter(function(h){return h.item.dua && h.via.length;}).map(function(h){return {kind:"hadith",item:h.item,score:h.score};}),
      ayat.filter(function(a){return a.item.dua && a.via.length;}).map(function(a){return {kind:"quran",item:a.item,score:a.score*0.9};})
    ).sort(function(a,b){return b.score-a.score;});
    // أدعية مقترحة من الموضوعات حتى لو ضعفت مطابقتها النصية
    if(duas.length<2){
      HADITH_LIB.filter(function(h){ return h.dua && h.th.some(function(t){return themeConf[t];}); })
        .forEach(function(h){ if(!duas.some(function(d){return d.item.id===h.id;})) duas.push({kind:"hadith",item:h,score:0.5}); });
    }
    if(!duas.length){ ["h-rahmataka","h-ahdini"].forEach(function(id){ duas.push({kind:"hadith",item:BY.hadith[id],score:0.1}); }); }
    return {
      sits:sits.slice(0,5),
      ayat:ayat.filter(function(a){return !a.item.dua;}).slice(0,5),
      hadith:hadith.filter(function(h){return !h.item.dua;}).slice(0,5),
      duas:duas.slice(0,4)
    };
  }

  /* ---------------- 5. التركيب: بناء التحليل العميق ---------------- */
  function uniq(arr){ var seen=new Set(); return arr.filter(function(x){ var k=normalize(x).slice(0,60); if(seen.has(k)) return false; seen.add(k); return true; }); }

  function composeReading(u, r){
    var parts=[];
    var rel=u.relations[0], t0=u.themes[0], t1=u.themes[1];
    var emo=u.emotions.filter(function(e){return !e.implied;}).map(function(e){return e.label;});
    var emoImp=u.emotions.filter(function(e){return e.implied;}).map(function(e){return e.label;});
    if(t0){
      parts.push(T("يدور ما كتبته أساسًا حول «{0}»",t0.theme.label)+(t1?T("، ويتقاطع مع «{0}»",t1.theme.label):"")+(rel?T("، في سياق علاقتك بـ{0}",rel.label):"")+".");
    } else if(rel){
      parts.push(T("يدور ما كتبته حول علاقتك بـ{0}.",rel.label));
    }
    if(emo.length) parts.push(T("تظهر في كلماتك مشاعر {0}، وهي مشاعر مفهومة لا تُلام عليها في ذاتها؛ المهم ما نفعله بها.",emo.slice(0,3).join(T(" و"))));
    else if(emoImp.length) parts.push(T("قد يصاحب موقفًا كهذا شعور بـ{0}، حتى لو لم تذكره صراحة.",emoImp.slice(0,2).join(T(" أو "))));
    if(u.intensity>=2.5) parts.push(T("يبدو أن الموقف ثقيل عليك ومستمر منذ مدة، لذلك سنبدأ بما يخفف الضغط الآن قبل الخطط البعيدة."));
    if(u.selfFault) parts.push(T("ولاحظت أنك تتحدث عن خطأ وقع منك؛ والاعتراف بالخطأ نصف الطريق، فالهدي النبوي يفتح لك باب الإصلاح لا باب جلد الذات."));
    else if(t0 && /injustice|insult|betrayal|slander|oppressor_power/.test(t0.id)) parts.push(T("وموقعك هنا موقع من وقع عليه الأذى؛ والمنهج النبوي يعترف بحقك أولًا، ثم يعرض عليك خيارات أرفع دون أن يُلزمك بها."));
    if(r.sits[0]) parts.push(T("وأقرب ما وجدته لحالتك: «{0}».",r.sits[0].s.title));
    return parts.join(" ");
  }

  function analyze(raw){
    build();
    var u=understand(raw);
    var r=retrieve(u);
    var topThemes=u.themes.slice(0,2).map(function(t){return t.theme;});
    // الخطة العملية: من الموضوعين الأعلى + تطبيقات الموقف الأول
    var plan={now:[],week:[],long:[]};
    topThemes.forEach(function(t,i){
      var n=i===0?3:2;
      plan.now=plan.now.concat(t.plan.now.slice(0,n));
      plan.week=plan.week.concat(t.plan.week.slice(0,n));
      plan.long=plan.long.concat(t.plan.long.slice(0,n));
    });
    if(r.sits[0]) plan.week=plan.week.concat(r.sits[0].s.modernApplications.slice(0,1));
    plan.now=uniq(plan.now).slice(0,4); plan.week=uniq(plan.week).slice(0,5); plan.long=uniq(plan.long).slice(0,4);

    var questions=uniq([].concat.apply([],topThemes.map(function(t){return t.questions.slice(0,2);}))).slice(0,4);
    var avoid=uniq([].concat.apply([],topThemes.map(function(t){return t.avoid.slice(0,2);}))
      .concat(r.sits[0]?r.sits[0].s.whatToAvoid.slice(0,1):[])).slice(0,5);
    var help=uniq(u.themes.slice(0,3).map(function(t){return t.theme.help;}).filter(Boolean));

    var topScore=r.sits[0]?r.sits[0].score:0, themeScore=u.themes[0]?u.themes[0].score:0;
    var confidence = (topScore>=7 || themeScore>=3) ? "high" : (topScore>=3 || themeScore>=1.5) ? "mid" : "low";

    return {
      input:raw, understanding:u, retrieval:r, reading:composeReading(u,r),
      insights:topThemes.map(function(t){return {label:t.label, text:t.insight, id:t.id};}),
      plan:plan, questions:questions, avoid:avoid, help:help, confidence:confidence
    };
  }

  /* يبني السياق النصي المسترجع لنموذج اللغة (وضع RAG التوليدي الاختياري) */
  function contextFor(a){
    var r=a.retrieval, L=[];
    L.push(T("## الموضوعات المكتشفة"));
    a.understanding.themes.forEach(function(t){ L.push("- "+t.theme.label+" ("+T("ثقة")+" "+Math.round(t.conf*100)+"%)"); });
    if(a.understanding.emotions.length) L.push(T("المشاعر:")+" "+a.understanding.emotions.map(function(e){return e.label;}).join(T("، ")));
    if(a.understanding.relations.length) L.push(T("العلاقة:")+" "+a.understanding.relations.map(function(e){return e.label;}).join(T("، ")));
    L.push(T("المتكلم يعترف بخطأ منه:")+" "+(a.understanding.selfFault?T("نعم"):T("لا")));
    L.push("\n"+T("## مواقف من السيرة والقرآن (مسترجعة)"));
    r.sits.slice(0,4).forEach(function(x,i){
      var s=x.s;
      L.push("[S"+(i+1)+"] "+s.title+"\n"+T("الواقعة:")+" "+s.eventDescription+"\n"+T("المبادئ:")+" "+s.principles.join(T("؛ "))+
        (s.notToApplyTo.length?"\n"+T("حدود التطبيق:")+" "+s.notToApplyTo.join(T("؛ ")):"")+
        (s.hadithRefs||[]).map(function(h){return "\n"+T("نص:")+" «"+h.text+"»"+(h.te?" — “"+h.te+"”":"")+" — "+I18N.src(h.source)+" ("+I18N.grade(h.grade)+")"+(h.paraphrase?" "+T("[خلاصة بالمعنى]"):"");}).join("")+
        (s.quranRefs||[]).map(function(q){return "\n"+T("آية:")+" ﴿"+q.text+"﴾ ["+I18N.ref(q.surahName,q.ayahNumber)+"]"+(I18N.en?" — “"+I18N.quranEn(q.surahName,q.ayahNumber)+"”":"");}).join(""));
    });
    L.push("\n"+T("## آيات (مسترجعة)"));
    r.ayat.forEach(function(x,i){ L.push("[Q"+(i+1)+"] ﴿"+x.item.t+"﴾ ["+I18N.ref(x.item.s,x.item.a)+"]"+(I18N.en?" — “"+I18N.quranEn(x.item.s,x.item.a)+"”":"")+" — "+T("فائدة:")+" "+x.item.n); });
    L.push("\n"+T("## أحاديث (مسترجعة)"));
    r.hadith.forEach(function(x,i){ L.push("[H"+(i+1)+"] «"+x.item.t+"»"+(x.item.te?" — “"+x.item.te+"”":"")+" — "+x.item.r+" — "+I18N.src(x.item.src)+" — "+T("الدرجة:")+" "+I18N.grade(x.item.g)); });
    L.push("\n"+T("## أدعية مأثورة (مسترجعة)"));
    r.duas.forEach(function(x,i){ var it=x.item; L.push("[D"+(i+1)+"] "+(x.kind==="quran"?"﴿"+it.t+"﴾ ["+I18N.ref(it.s,it.a)+"]":"«"+it.t+"»"+(it.te?" — “"+it.te+"”":"")+" — "+I18N.src(it.src))); });
    L.push("\n"+T("## القراءة القرآنية النبوية للموضوعات"));
    a.insights.forEach(function(x){ L.push("- "+x.label+": "+x.text); });
    return L.join("\n");
  }

  return {normalize:normalize, stem:stem, stems:stems, analyze:analyze, understand:understand, build:build,
          contextFor:contextFor, byId:function(kind,id){ build(); return BY[kind][id]; }, themeLabel:themeLabel};
})();
