/* ======================================================================
   رِفقة الأُسوة — القراءة الصوتية (Text-to-Speech + تلاوة القرآن)
   ----------------------------------------------------------------------
   كل مقطع يُقرأ بأحد صوتين، كأنه حوار سؤال وجواب:
   - الصوت 1 (صوت الشيخ): الآيات والأحاديث والأدعية. صوت رجالي، أعمق نبرة
     وأهدأ إيقاعًا.
     * الآيات تُتلى بصوت قارئ حقيقي (تسجيلات everyayah.com) لأن محركات النطق
       لا تضبط القرآن، والنص في المكتبة بلا تشكيل. إن تعذّر الاتصال يقرؤها
       الصوت 1 من النص مع تنبيه.
   - الصوت 2 (المحاور): العناوين والشرح والتمهيد («قال الله تعالى في سورة…»).
   محركان: أندرويد (TextToSpeech الأصلي عبر AndroidBridge) والمتصفح/ويندوز
   (Web Speech API).
   ====================================================================== */
var TTS = (function(){
  "use strict";
  var NATIVE = !!(window.AndroidBridge && typeof window.AndroidBridge.ttsSpeak === "function");
  var LANG = (window.I18N && I18N.lang) || "ar";       // لغة النطق = لغة الواجهة (ar | en | nl | es | pt)
  var EN = LANG !== "ar";
  var LANG_RE = new RegExp("^" + LANG + "([-_]|$)", "i");
  var SAY = {   // ما يُنطق بدل الرموز في كل لغة
    ar: {pbuh:" صلى الله عليه وسلم ", to:"$1 إلى $2", num:" رقم $1 ", tag:"ar-SA"},
    en: {pbuh:", peace be upon him, ", to:"$1 to $2", num:" number $1 ", tag:"en-US"},
    nl: {pbuh:", vrede zij met hem, ", to:"$1 tot $2", num:" nummer $1 ", tag:"nl-NL"},
    es: {pbuh:", la paz sea con él, ", to:"$1 a $2", num:" número $1 ", tag:"es-ES"},
    pt: {pbuh:", que a paz esteja com ele, ", to:"$1 a $2", num:" número $1 ", tag:"pt-PT"}
  }[LANG];
  var synth = window.speechSynthesis || null;
  var MAX_CHUNK = 220;
  var IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  // صوت صامت قصير: تشغيله داخل نقرة المستخدم «يفتح» عنصر الصوت في iOS فتعمل التلاوات التالية تلقائيًا
  var SILENT = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

  /* ---------- القراء (تلاوة مرتلة) ---------- */
  // lat: الاسم في الواجهات غير العربية. mb: حجم تقريبي من عينة ملفات الخادم (يُصحَّح في estimateMB). كل المجلدات متحقَّق منها على everyayah.com
  var RECITERS = [
    {id:"Husary_128kbps", name:"محمود خليل الحصري", lat:"Mahmoud Khalil Al-Husary", mb:110},
    {id:"Minshawy_Murattal_128kbps", name:"محمد صديق المنشاوي", lat:"Muhammad Siddiq Al-Minshawi", mb:71},
    {id:"Minshawy_Mujawwad_192kbps", name:"محمد صديق المنشاوي (مجوَّد)", lat:"Al-Minshawi (mujawwad)", mb:213},
    {id:"Abdul_Basit_Murattal_192kbps", name:"عبد الباسط عبد الصمد", lat:"Abdul Basit Abdul Samad", mb:121},
    {id:"Abdul_Basit_Mujawwad_128kbps", name:"عبد الباسط عبد الصمد (مجوَّد)", lat:"Abdul Basit (mujawwad)", mb:153},
    {id:"Mohammad_al_Tablaway_128kbps", name:"محمد محمود الطبلاوي", lat:"Muhammad Al-Tablawi", mb:73},
    {id:"Muhammad_Jibreel_128kbps", name:"محمد جبريل", lat:"Muhammad Jibreel", mb:63},
    {id:"Alafasy_128kbps", name:"مشاري راشد العفاسي", lat:"Mishary Rashid Alafasy", mb:75},
    {id:"Abdurrahmaan_As-Sudais_192kbps", name:"عبد الرحمن السديس", lat:"Abdul Rahman Al-Sudais", mb:81},
    {id:"Saood_ash-Shuraym_128kbps", name:"سعود الشريم", lat:"Saud Al-Shuraim", mb:44},
    {id:"MaherAlMuaiqly128kbps", name:"ماهر المعيقلي", lat:"Maher Al-Muaiqly", mb:52},
    {id:"Yasser_Ad-Dussary_128kbps", name:"ياسر الدوسري", lat:"Yasser Al-Dosari", mb:70},
    {id:"Hudhaify_128kbps", name:"علي بن عبد الرحمن الحذيفي", lat:"Ali Al-Hudhaifi", mb:73},
    {id:"Muhammad_Ayyoub_128kbps", name:"محمد أيوب", lat:"Muhammad Ayyub", mb:76},
    {id:"Abdullah_Basfar_192kbps", name:"عبد الله بصفر", lat:"Abdullah Basfar", mb:114},
    {id:"Abu_Bakr_Ash-Shaatree_128kbps", name:"أبو بكر الشاطري", lat:"Abu Bakr Al-Shatri", mb:70},
    {id:"Ahmed_ibn_Ali_al-Ajamy_128kbps_ketaballah.net", name:"أحمد بن علي العجمي", lat:"Ahmad Al-Ajmi", mb:67},
    {id:"Ghamadi_40kbps", name:"سعد الغامدي", lat:"Saad Al-Ghamdi", mb:19},
    {id:"Fares_Abbad_64kbps", name:"فارس عبّاد", lat:"Fares Abbad", mb:28},
    {id:"Nasser_Alqatami_128kbps", name:"ناصر القطامي", lat:"Nasser Al-Qatami", mb:57},
    {id:"Hani_Rifai_192kbps", name:"هاني الرفاعي", lat:"Hani Al-Rifai", mb:95},
    {id:"Khaalid_Abdullaah_al-Qahtaanee_192kbps", name:"خالد القحطاني", lat:"Khalid Al-Qahtani", mb:96},
    {id:"Salah_Al_Budair_128kbps", name:"صلاح البدير", lat:"Salah Al-Budair", mb:63},
    {id:"Ali_Jaber_64kbps", name:"علي جابر", lat:"Ali Jaber", mb:33},
    {id:"Akram_AlAlaqimy_128kbps", name:"أكرم العلاقمي", lat:"Akram Al-Alaqimi", mb:71},
    {id:"Ayman_Sowaid_64kbps", name:"أيمن سويد", lat:"Ayman Suwaid", mb:51},
    {id:"", name:"بدون تلاوة (يقرأ صوت الشيخ النص)"}
  ];
  function reciterById(id){ for (var i = 0; i < RECITERS.length; i++) if (RECITERS[i].id === id) return RECITERS[i]; return null; }
  function reciterLabel(r){ return r ? (LANG !== "ar" && r.lat ? r.lat : r.name) : ""; }
  var SURAHS = ["الفاتحة","البقرة","آل عمران","النساء","المائدة","الأنعام","الأعراف","الأنفال","التوبة","يونس","هود","يوسف","الرعد","إبراهيم","الحجر","النحل","الإسراء","الكهف","مريم","طه","الأنبياء","الحج","المؤمنون","النور","الفرقان","الشعراء","النمل","القصص","العنكبوت","الروم","لقمان","السجدة","الأحزاب","سبأ","فاطر","يس","الصافات","ص","الزمر","غافر","فصلت","الشورى","الزخرف","الدخان","الجاثية","الأحقاف","محمد","الفتح","الحجرات","ق","الذاريات","الطور","النجم","القمر","الرحمن","الواقعة","الحديد","المجادلة","الحشر","الممتحنة","الصف","الجمعة","المنافقون","التغابن","الطلاق","التحريم","الملك","القلم","الحاقة","المعارج","نوح","الجن","المزمل","المدثر","القيامة","الإنسان","المرسلات","النبأ","النازعات","عبس","التكوير","الانفطار","المطففين","الانشقاق","البروج","الطارق","الأعلى","الغاشية","الفجر","البلد","الشمس","الليل","الضحى","الشرح","التين","العلق","القدر","البينة","الزلزلة","العاديات","القارعة","التكاثر","العصر","الهمزة","الفيل","قريش","الماعون","الكوثر","الكافرون","النصر","المسد","الإخلاص","الفلق","الناس"];
  var normS = function(s){ return String(s||"").replace(/[إأآ]/g,"ا").replace(/^سورة\s+/,"").replace(/\s+/g," ").trim(); };
  var SURAH_NO = {}; SURAHS.forEach(function(n,i){ SURAH_NO[normS(n)] = i+1; });
  SURAH_NO[normS("الإنشراح")] = 94; SURAH_NO[normS("الدهر")] = 76; SURAH_NO[normS("غافر")] = 40;
  var pad3 = function(n){ return ("00"+n).slice(-3); };
  /** روابط تلاوة آية أو مجموعة آيات: ayah = "27" أو "155-157" */
  function recitationUrls(surah, ayah, reciter){
    var sn = SURAH_NO[normS(surah)], m = String(ayah||"").match(/(\d+)(?:\s*[-–]\s*(\d+))?/);
    if (!reciter || !sn || !m) return null;
    var a = +m[1], b = m[2] ? Math.min(+m[2], a + 9) : a, out = [];
    var base = offlineReady(reciter) ? LOCAL_REC + reciter + "/" : "https://everyayah.com/data/" + reciter + "/";
    for (var i = a; i <= b; i++) out.push(base + pad3(sn) + pad3(i) + ".mp3");
    return out;
  }

  /* ---------- القراء دون إنترنت (أندرويد): تنزيل آيات التطبيق فقط إلى مساحة التطبيق الخاصة ---------- */
  var REC_BRIDGE = !!(window.AndroidBridge && window.AndroidBridge.recDownload);
  var LOCAL_REC = "https://appassets.androidplatform.net/rec/";
  var recLocal = {}, recProg = null, recFiles = null, recCbs = [];
  function recRefresh(){ if (!REC_BRIDGE) return; try { recLocal = JSON.parse(window.AndroidBridge.recStatus() || "{}"); } catch (e) { recLocal = {}; } }
  /** ملفات كل الآيات التي قد يتلوها التطبيق (من مكتبة الآيات والمواقف) — نحو 300 ملف */
  function offlineFiles(){
    if (recFiles) return recFiles;
    var set = {}, seen = [];
    function add(s, a){ var sn = SURAH_NO[normS(s)], m = String(a||"").match(/(\d+)(?:\s*[-–]\s*(\d+))?/); if (!sn || !m) return;
      var x = +m[1], y = m[2] ? Math.min(+m[2], x + 9) : x; for (var i = x; i <= y; i++) set[pad3(sn) + pad3(i) + ".mp3"] = 1; }
    function walk(o, d){
      if (!o || typeof o !== "object" || d > 6 || seen.indexOf(o) > -1) return; seen.push(o);
      if (typeof o.s === "string" && o.a !== undefined) add(o.s, o.a);
      if (typeof o.surahName === "string" && o.ayahNumber !== undefined) add(o.surahName, o.ayahNumber);
      for (var k in o) if (o[k] && typeof o[k] === "object") walk(o[k], d + 1);
    }
    walk(window.QURAN_LIB, 0); walk(window.SITUATIONS, 0);
    var list = Object.keys(set).sort(); if (list.length) recFiles = list; return list;
  }
  function offlineReady(id){ var r = id && recLocal[id]; return !!(r && (r.c || (offlineFiles().length && r.n >= offlineFiles().length))); }
  window.__rifqaRec = function(id, done, total, state){
    recProg = state === "progress" ? {id:id, done:done, total:total} : null;
    if (state !== "progress") recRefresh();
    var ev = {id:id, done:done, total:total, state:state};
    recCbs.forEach(function(f){ try { f(ev); } catch (e) {} });
  };
  recRefresh();

  /* ---------- الحالة ---------- */
  var chunks = [], idx = 0, state = "idle", rate = 1, token = 0, listeners = [];
  var cfg = {voice1:"", voice2:"", reciter:"Husary_128kbps"};
  // صوت الشيخ أعمق وأهدأ قليلًا؛ وصوت المحاور طبيعي
  var STYLE = {1:{pitch:0.82, rate:0.9}, 2:{pitch:1.0, rate:1.0}};
  var audio = null, recitationFailed = false;

  function emit(){ var info = status(); listeners.forEach(function(f){ try{ f(info); }catch(e){} }); }
  function status(){ var c = chunks[idx]; return {state:state, index:idx, total:chunks.length, el:c ? c.el : null, seg:c ? c.seg : -1, voice:c ? c.voice : 0, reciting:!!(c && c.reciting)}; }

  /* ---------- تهيئة النص للنطق ---------- */
  function clean(t){
    return String(t||"")
      .replace(/ﷺ/g, SAY.pbuh)
      .replace(/…|\.\.\./g, "، ")
      .replace(/[﴿﴾«»"“”*_#‹›↔✕]/g, " ")
      .replace(/(\d+)\s*[-–]\s*(\d+)/g, SAY.to)
      .replace(/\((\d+)\)/g, SAY.num)
      .replace(/https?:\/\/\S+/g, " ")
      .replace(/\s+([،,.؛:!؟])/g, "$1")
      .replace(/\s+/g, " ").trim();
  }
  function split(text){
    if (text.length <= MAX_CHUNK) return [text];
    var parts = text.replace(/([.!؟?؛:،,\n])\s+/g, "$1\u0001").split("\u0001"), out = [], cur = "";   // بلا lookbehind: يعمل على iOS 15
    parts.forEach(function(p){
      if ((cur + " " + p).trim().length > MAX_CHUNK && cur) { out.push(cur.trim()); cur = p; }
      else cur = (cur + " " + p).trim();
      while (cur.length > MAX_CHUNK * 1.5) {
        var cut = cur.lastIndexOf(" ", MAX_CHUNK); if (cut < 40) cut = MAX_CHUNK;
        out.push(cur.slice(0, cut).trim()); cur = cur.slice(cut).trim();
      }
    });
    if (cur) out.push(cur);
    return out;
  }

  /* ---------- الأصوات ---------- */
  // تقدير جنس الصوت من اسمه: Windows / Edge / Apple / Google (رموز الأصوات) / Samsung (SMTm و SMTf)
  var MALE = /maged|naayf|hamed|shakir|omar|bassel|taim|fahed|moaz|rami|hamdan|jamal|\bali\b|saleh|hedi|ismael|abdulla|majed|tarik|laith|kareem|\bmale|-ard-|-are-|david|mark|james|guy|ryan|eric|brian|christopher|andrew|george|daniel|thomas|alex|fred|arthur|liam|william|aaron|gordon|oliver|-iom-|-iol-|-rjs-|-gbd-|frank|maarten|arnaud|xander|willem|bart|daan|-bmh-|-dma-|-bed-|jorge|pablo|alvaro|álvaro|diego|carlos|enrique|juan|raul|raúl|jose|josé|duarte|cristiano|antonio|antónio|ricardo|daniel|-eed-|-eef-|-ptd-|-pmj-|smtm\d/i;
  var FEMALE = /hoda|zariyah|salma|amany|laila|layla|fatima|reem|amina|mouna|sana|iman|noura|rana|aysha|amal|mariam|maryam|yasmin|dalia|female|-arc-|-arz-|zira|hazel|susan|samantha|karen|moira|tessa|victoria|aria|jenny|libby|sonia|emma|michelle|ava|allison|serena|kate|catherine|olivia|-sfg-|-tpc-|-tpf-|colette|fenna|claire|ellen|dena|lotte|anouk|-lfc-|-tfb-|-yfr-|-bec-|helena|laura|elvira|lucia|lucía|monica|mónica|paulina|sabina|elena|ximena|raquel|fernanda|ines|inês|joana|catarina|francisca|helia|hélia|-eea-|-eec-|-pte-|-jfb-|smtf\d/i;
  function gender(v){ var n = v.name + " " + (v.voiceURI||""); return MALE.test(n) ? "m" : FEMALE.test(n) ? "f" : "?"; }
  function quality(v){ var n = v.name + " " + (v.voiceURI||""); return (/natural|online|neural|wavenet|network/i.test(n) ? 3 : 0) + (/google/i.test(n) ? 1 : 0) + (v.localService ? 1 : 0); }
  var voices = [];   // [{id, name, lang, g, q, raw}]
  function loadVoices(){
    if (NATIVE) {
      try { voices = JSON.parse(window.AndroidBridge.ttsVoices() || "[]").filter(function(v){ return !v.lang || LANG_RE.test(v.lang); }).map(function(v){ return {id:v.name, name:v.label||v.name, lang:v.lang, g:v.gender||gender(v),q:(v.network?3:0)+(v.quality||0)/100, raw:null}; }); }
      catch(e){ voices = []; }
    } else if (synth) {
      voices = synth.getVoices().filter(function(v){ return LANG_RE.test(v.lang); })
        .map(function(v){ return {id:v.voiceURI, name:v.name, lang:v.lang, g:gender(v), q:quality(v), raw:v}; });
    }
    emit();
  }
  if (!NATIVE && synth) {
    loadVoices();
    if (synth.addEventListener) synth.addEventListener("voiceschanged", loadVoices); else synth.onvoiceschanged = loadVoices;
  }
  /** أفضل صوت من جنس معيّن، أو أفضل صوت متاح إن لم يوجد (يُعوَّض الجنس بالنبرة) */
  function bestOf(g, except){
    var list = voices.filter(function(v){ return !except || v.id !== except; });
    if (!list.length) list = voices.slice();
    return list.sort(function(a,b){ return (b.g===g) - (a.g===g) || b.q - a.q; })[0] || null;
  }
  /** الصوت 1: رجالي بأعلى جودة. الصوت 2: صوت مختلف (رجالي آخر ثم أي صوت). */
  function autoVoice(role){
    if (!voices.length) return null;
    var sorted = voices.slice().sort(function(a,b){ return (b.g==="m") - (a.g==="m") || b.q - a.q; });
    var v1 = byId(cfg.voice1) || sorted[0];
    if (role === 1) return v1;
    var others = voices.filter(function(v){ return v.id !== v1.id; }).sort(function(a,b){ return (b.g==="m") - (a.g==="m") || b.q - a.q; });
    return others[0] || v1;
  }
  function byId(id){ for (var i = 0; i < voices.length; i++) if (voices[i].id === id) return voices[i]; return null; }
  /** الاختيار: "" تلقائي، "~m" رجالي، "~f" نسائي، أو معرّف صوت بعينه */
  function want(role){ return role === 1 ? cfg.voice1 : cfg.voice2; }
  function voiceFor(role){
    var w = want(role);
    if (w === "~m" || w === "~f") {
      var other = role === 2 ? voiceFor(1) : null;      // الصوت 2 يُفضَّل أن يختلف عن الأول
      return bestOf(w.slice(1), other && voices.length > 1 ? other.id : "");
    }
    return byId(w) || autoVoice(role);
  }
  function styleFor(role){
    var s = {pitch:STYLE[role].pitch, rate:STYLE[role].rate * rate}, w = want(role), v = voiceFor(role);
    // طُلب صوت رجالي ولا يوجد إلا صوت نسائي/غير معروف: نخفض النبرة ليقترب من الصوت الرجالي
    if (v && v.g !== "m" && (w === "~m" || (role === 1 && !w))) s.pitch = Math.min(s.pitch, 0.72);
    if (v && v.g !== "f" && w === "~f") s.pitch = 1.18;
    // صوت واحد فقط على الجهاز؟ نميّز الدورين بالنبرة
    var v1 = voiceFor(1), v2 = voiceFor(2);
    if (role === 2 && v1 && v2 && v1.id === v2.id) s.pitch = 1.12;
    return s;
  }

  /* ---------- التشغيل ---------- */
  function next(my){ if (my === token && state === "playing") { idx++; speakCurrent(); } }
  function speakText(my, text, role){
    var st = styleFor(role), v = voiceFor(role);
    if (NATIVE) { window.AndroidBridge.ttsSpeak(String(my), text, st.rate, st.pitch, v ? v.id : ""); return; }
    var u = new SpeechSynthesisUtterance(text);
    if (v && v.raw) { u.voice = v.raw; u.lang = v.lang; } else u.lang = SAY.tag;
    u.rate = st.rate; u.pitch = st.pitch;
    u.onend = function(){ next(my); };
    u.onerror = function(e){ if (e && (e.error === "interrupted" || e.error === "canceled")) return; next(my); };
    if (IOS) setTimeout(function(){ if (my === token) synth.speak(u); }, 60);   // WebKit يُسقط speak() إذا جاء فور cancel()
    else synth.speak(u);
  }
  function playRecitation(my, c){
    var i = 0;
    if (!audio) { audio = new Audio(); audio.preload = "auto"; }
    c.reciting = true; emit();
    var fallback = function(){
      if (my !== token) return;
      c.reciting = false;
      if (!recitationFailed) { recitationFailed = true; listeners.forEach(function(f){ try{ f({notice:"recitation-offline"}); }catch(e){} }); }
      speakText(my, c.text, 1);
    };
    var watchdog = null;
    var playNext = function(){
      clearTimeout(watchdog);
      if (my !== token || state !== "playing") return;
      if (i >= c.audio.length) { c.reciting = false; next(my); return; }
      // شبكة بطيئة أو متوقفة: إن لم تبدأ التلاوة خلال 10 ثوانٍ يقرأ صوت الشيخ النص بدلها
      watchdog = setTimeout(function(){ if (my === token && state === "playing") { try{ audio.pause(); }catch(e){} if (i === 0) fallback(); else { i++; playNext(); } } }, 10000);
      audio.onplaying = function(){ clearTimeout(watchdog); };
      audio.onended = function(){ i++; playNext(); };
      audio.onerror = function(){ clearTimeout(watchdog); if (i === 0) fallback(); else { i++; playNext(); } };
      var src = c.audio[i], start = function(u){
        if (my !== token || state !== "playing") return;
        audio.src = u; audio.playbackRate = 1;
        var p = audio.play(); if (p && p.catch) p.catch(function(){ if (my === token && state === "playing") fallback(); });
      };
      if (src.indexOf(LOCAL_REC) === 0) localBlob(src).then(start, function(){ start(src.replace(LOCAL_REC, "https://everyayah.com/data/")); });
      else start(src);
    };
    playNext();
  }
  // التلاوة المنزَّلة تُقرأ عبر fetch ثم تُشغَّل من blob: (أضمن من تحميل الوسائط مباشرة من الأصل الخاص)
  var lastBlob = null;
  function localBlob(url){
    return fetch(url).then(function(r){ if (!r.ok) throw new Error(r.status); return r.blob(); })
      .then(function(b){ if (lastBlob) { try { URL.revokeObjectURL(lastBlob); } catch (e) {} } lastBlob = URL.createObjectURL(b); return lastBlob; });
  }
  function speakCurrent(){
    if (idx >= chunks.length) { finish(); return; }
    var my = ++token, c = chunks[idx];
    emit();
    if (c.audio && cfg.reciter && (navigator.onLine !== false || offlineReady(cfg.reciter))) playRecitation(my, c);
    else speakText(my, c.text, c.voice);
  }
  function hardStop(){
    token++;
    if (audio) { try{ audio.pause(); audio.removeAttribute("src"); audio.load(); }catch(e){} }
    if (NATIVE) { try{ window.AndroidBridge.ttsStop(); }catch(e){} }
    else if (synth) synth.cancel();
  }
  function finish(){ hardStop(); state = "idle"; idx = 0; chunks = []; emit(); }

  window.__rifqaTTS = function(id, ev){
    if (ev === "voices") { loadVoices(); return; }
    if (String(token) !== String(id) || state !== "playing") return;
    if (ev === "done" || ev === "error") { idx++; speakCurrent(); }
  };
  if (NATIVE && EN && window.AndroidBridge.ttsSetLang) { try { window.AndroidBridge.ttsSetLang(LANG); } catch (e) {} }
  if (NATIVE) setTimeout(loadVoices, 1500);

  return {
    native: NATIVE,
    RECITERS: RECITERS,
    reciterLabel: function(id){ return reciterLabel(reciterById(id)); },
    /** تنزيل القراء للاستماع دون إنترنت (في تطبيق أندرويد فقط) */
    offline: {
      supported: REC_BRIDGE,
      files: function(){ return offlineFiles().length; },
      /** {n, b, ready, busy, progress, any} لقارئ */
      status: function(id){ var r = recLocal[id] || {n:0, b:0}; return {n:r.n, b:r.b, ready:offlineReady(id), complete:!!r.c, busy:recLocal._busy === id || !!(recProg && recProg.id === id), progress:recProg && recProg.id === id ? recProg : null, any:!!(recProg || recLocal._busy)}; },
      /** الحجم التقريبي بالميغابايت */
      estimateMB: function(id){ var r = reciterById(id); return r && r.mb ? Math.max(1, Math.round(r.mb * 1.3 * offlineFiles().length / 305)) : 0; },   // ×1.3: العينة تقلّ عن الحجم الفعلي بنحو 30٪
      freeMB: function(){ try { return Math.floor(+window.AndroidBridge.recFree() / 1048576); } catch (e) { return -1; } },
      download: function(id){ if (!REC_BRIDGE || !id || !reciterById(id)) return false; var ok = window.AndroidBridge.recDownload(id, JSON.stringify(offlineFiles())); if (ok) recProg = {id:id, done:0, total:offlineFiles().length}; return ok; },
      cancel: function(){ if (REC_BRIDGE) window.AndroidBridge.recCancel(); },
      remove: function(id){ if (!REC_BRIDGE) return false; var ok = window.AndroidBridge.recDelete(id); recRefresh(); return ok; },
      downloaded: function(){ recRefresh(); return RECITERS.filter(function(r){ return r.id && recLocal[r.id] && recLocal[r.id].n > 0; }).map(function(r){ return r.id; }); },
      onChange: function(f){ recCbs.push(f); }
    },
    recitationUrls: function(s, a){ return recitationUrls(s, a, cfg.reciter); },
    supported: function(){ return NATIVE || !!(synth && window.SpeechSynthesisUtterance); },
    arabicStatus: function(){
      if (NATIVE) { try{ return window.AndroidBridge.ttsStatus() || "unknown"; }catch(e){ return "unknown"; } }
      if (!synth) return "missing";
      if (voices.length) return "ok";
      return synth.getVoices().length ? "missing" : "unknown";
    },
    /** يُستدعى داخل نقرة المستخدم: يفتح الصوت والنطق في iOS وفي المتصفحات التي تمنع التشغيل التلقائي */
    unlock: function(){
      try {
        if (!audio) { audio = new Audio(); audio.preload = "auto"; }
        audio.src = SILENT; var p = audio.play(); if (p && p.catch) p.catch(function(){});
        if (synth && !NATIVE && IOS) { var u = new SpeechSynthesisUtterance(" "); u.volume = 0; synth.speak(u); }
      } catch (e) {}
    },
    installVoice: function(){ if (NATIVE && window.AndroidBridge.ttsInstall) window.AndroidBridge.ttsInstall(); },
    voiceSettings: function(){ if (NATIVE && window.AndroidBridge.ttsSettings) window.AndroidBridge.ttsSettings(); },
    lang: LANG,
    /** أصوات لغة النطق مع تقدير الجنس (g = m | f | ?)، الرجالية أولًا ثم الأعلى جودة */
    voices: function(){ if (NATIVE && !voices.length) loadVoices(); return voices.slice().sort(function(a,b){ return (b.g==="m") - (a.g==="m") || b.q - a.q; }).map(function(v){ return {id:v.id, name:v.name, lang:v.lang, g:v.g}; }); },
    /** الصوت الفعلي لدور معيّن مع الإعداد الحالي، وهل الجنس مُحاكى بالنبرة */
    resolved: function(role){ var v = voiceFor(role), w = want(role); return v ? {id:v.id, name:v.name, g:v.g, simulated:(w === "~m" && v.g !== "m") || (w === "~f" && v.g !== "f")} : null; },
    autoVoiceId: function(role){ var v = autoVoice(role); return v ? v.id : ""; },
    configure: function(o){ for (var k in o) if (o[k] !== undefined) cfg[k] = o[k]; },
    setRate: function(r){
      rate = Math.max(0.5, Math.min(2, +r || 1));
      if (state === "playing" && !(chunks[idx] && chunks[idx].reciting)) { hardStop(); state = "playing"; speakCurrent(); }
    },
    getRate: function(){ return rate; },
    /** تجربة صوت دور معيّن من الإعدادات */
    preview: function(role){
      hardStop(); chunks = []; state = "idle"; emit();
      var my = ++token;
      var P = {
        ar: ["قال رسول الله صلى الله عليه وسلم: إنما الأعمال بالنيات، وإنما لكل امرئ ما نوى.", "هذا صوت المحاور: يقرأ العناوين والشرح، ثم يجيبه صوت الشيخ بالآيات والأحاديث."],
        en: ["The Messenger of Allah, peace be upon him, said: Actions are judged only by intentions, and every person will have only what he intended.", "This is the narrator's voice: it reads the headings and explanations, and the second voice answers with the verses and hadith."],
        nl: ["De Boodschapper van Allah, vrede zij met hem, zei: Daden worden slechts beoordeeld naar de intenties, en ieder mens krijgt slechts wat hij beoogde.", "Dit is de stem van de verteller: hij leest de titels en de uitleg, en de tweede stem antwoordt met de verzen en de hadith."],
        es: ["El Mensajero de Allah, la paz sea con él, dijo: Las obras dependen únicamente de las intenciones, y cada persona obtendrá solo lo que se propuso.", "Esta es la voz del narrador: lee los títulos y las explicaciones, y la segunda voz responde con las aleyas y los hadices."],
        pt: ["O Mensageiro de Allah, que a paz esteja com ele, disse: As ações valem apenas pelas intenções, e cada pessoa terá apenas aquilo que pretendeu.", "Esta é a voz do narrador: lê os títulos e as explicações, e a segunda voz responde com os versículos e os hadiths."]
      }[LANG];
      speakText(my, P[role === 1 ? 0 : 1], role);
    },
    previewRecitation: function(){
      hardStop(); var my = ++token, urls = recitationUrls("البقرة", "153", cfg.reciter);
      if (!urls) return false;
      if (!audio) audio = new Audio();
      audio.onended = audio.onerror = null;
      var go = function(u){ if (my !== token) return; audio.src = u; var p = audio.play(); if (p && p.catch) p.catch(function(){}); };
      if (urls[0].indexOf(LOCAL_REC) === 0) localBlob(urls[0]).then(go, function(){ go(urls[0].replace(LOCAL_REC, "https://everyayah.com/data/")); });
      else go(urls[0]);
      return my;
    },
    /** segs: [{text, el, voice:1|2, audio?:[url]}] */
    play: function(segs){
      hardStop(); chunks = []; recitationFailed = false;
      segs.forEach(function(s, si){
        var t = clean(s.text); if (!t) return;
        var role = s.voice === 1 ? 1 : 2;
        if (s.audio && s.audio.length) { chunks.push({text:t, el:s.el, seg:si, voice:1, audio:s.audio}); return; }  // الآية كاملة مقطعًا واحدًا
        split(t).forEach(function(p){ chunks.push({text:p, el:s.el, seg:si, voice:role}); });
      });
      idx = 0;
      if (!chunks.length) { state = "idle"; emit(); return false; }
      state = "playing"; speakCurrent(); return true;
    },
    pause: function(){ if (state !== "playing") return; hardStop(); if (chunks[idx]) chunks[idx].reciting = false; state = "paused"; emit(); },
    resume: function(){ if (state !== "paused") return; state = "playing"; speakCurrent(); },
    toggle: function(){ if (state === "playing") this.pause(); else if (state === "paused") this.resume(); },
    stop: function(){ finish(); },
    skip: function(dir){
      if (!chunks.length) return;
      var curSeg = chunks[idx] ? chunks[idx].seg : 0, target = curSeg + dir, j;
      if (dir < 0 && chunks[idx] && idx > 0 && chunks[idx-1].seg === curSeg) target = curSeg;
      for (j = 0; j < chunks.length && chunks[j].seg < target; j++);
      idx = Math.max(0, Math.min(chunks.length - 1, j));
      hardStop(); chunks.forEach(function(c){ c.reciting = false; });
      if (state === "paused") { emit(); return; }
      state = "playing"; speakCurrent();
    },
    state: function(){ return state; },
    status: status,
    on: function(f){ listeners.push(f); }
  };
})();
