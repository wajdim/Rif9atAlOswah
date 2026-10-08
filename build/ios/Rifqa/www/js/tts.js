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
  var EN = !!(window.I18N && I18N.en);                 // الواجهة الإنجليزية: أصوات إنجليزية للشرح والمعاني
  var LANG_RE = EN ? /^en([-_]|$)/i : /^ar([-_]|$)/i;
  var synth = window.speechSynthesis || null;
  var MAX_CHUNK = 220;
  var IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  // صوت صامت قصير: تشغيله داخل نقرة المستخدم «يفتح» عنصر الصوت في iOS فتعمل التلاوات التالية تلقائيًا
  var SILENT = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

  /* ---------- القراء (تلاوة مرتلة) ---------- */
  var RECITERS = [
    {id:"Husary_128kbps", name:"محمود خليل الحصري"},
    {id:"Minshawy_Murattal_128kbps", name:"محمد صديق المنشاوي"},
    {id:"Abdul_Basit_Murattal_192kbps", name:"عبد الباسط عبد الصمد"},
    {id:"Alafasy_128kbps", name:"مشاري راشد العفاسي"},
    {id:"MaherAlMuaiqly128kbps", name:"ماهر المعيقلي"},
    {id:"Ghamadi_40kbps", name:"سعد الغامدي"},
    {id:"Fares_Abbad_64kbps", name:"فارس عبّاد"},
    {id:"", name:"بدون تلاوة (يقرأ صوت الشيخ النص)"}
  ];
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
    for (var i = a; i <= b; i++) out.push("https://everyayah.com/data/" + reciter + "/" + pad3(sn) + pad3(i) + ".mp3");
    return out;
  }

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
      .replace(/ﷺ/g, EN ? ", peace be upon him, " : " صلى الله عليه وسلم ")
      .replace(/…|\.\.\./g, "، ")
      .replace(/[﴿﴾«»"“”*_#‹›↔✕]/g, " ")
      .replace(/(\d+)\s*[-–]\s*(\d+)/g, EN ? "$1 to $2" : "$1 إلى $2")
      .replace(/\((\d+)\)/g, EN ? " number $1 " : " رقم $1 ")
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
  var MALE = /maged|naayf|hamed|shakir|omar|bassel|taim|fahed|moaz|rami|hamdan|jamal|\bali\b|saleh|hedi|ismael|abdulla|majed|tarik|laith|kareem|\bmale|-ard-|-are-|david|mark|james|guy|ryan|eric|brian|christopher|andrew|george|daniel|thomas|alex|fred|arthur|liam|william|aaron|gordon|oliver|-iom-|-iol-|-rjs-|-gbd-/i;
  var FEMALE = /hoda|zariyah|salma|amany|laila|layla|fatima|reem|amina|mouna|sana|iman|noura|rana|aysha|amal|mariam|maryam|yasmin|dalia|female|-arc-|-arz-|zira|hazel|susan|samantha|karen|moira|tessa|victoria|aria|jenny|libby|sonia|emma|michelle|ava|allison|serena|kate|catherine|olivia|-sfg-|-tpc-|-tpf-/i;
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
  function voiceFor(role){ return byId(role === 1 ? cfg.voice1 : cfg.voice2) || autoVoice(role); }
  function styleFor(role){
    var s = {pitch:STYLE[role].pitch, rate:STYLE[role].rate * rate};
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
    if (v && v.raw) { u.voice = v.raw; u.lang = v.lang; } else u.lang = EN ? "en-US" : "ar-SA";
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
      audio.src = c.audio[i];
      audio.playbackRate = 1;
      var p = audio.play(); if (p && p.catch) p.catch(function(){ if (my === token && state === "playing") fallback(); });
    };
    playNext();
  }
  function speakCurrent(){
    if (idx >= chunks.length) { finish(); return; }
    var my = ++token, c = chunks[idx];
    emit();
    if (c.audio && cfg.reciter && (navigator.onLine !== false)) playRecitation(my, c);
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
  if (NATIVE && EN && window.AndroidBridge.ttsSetLang) { try { window.AndroidBridge.ttsSetLang("en"); } catch (e) {} }
  if (NATIVE) setTimeout(loadVoices, 1500);

  return {
    native: NATIVE,
    RECITERS: RECITERS,
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
    /** قائمة الأصوات العربية مع تقدير الجنس: g = m | f | ? */
    voices: function(){ if (NATIVE && !voices.length) loadVoices(); return voices.map(function(v){ return {id:v.id, name:v.name, lang:v.lang, g:v.g}; }); },
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
      speakText(my, EN ? (role === 1 ? "The Messenger of Allah, peace be upon him, said: Actions are judged only by intentions, and every person will have only what he intended." : "This is the narrator's voice: it reads the headings and explanations, and the second voice answers with the verses and hadith.")
                       : (role === 1 ? "قال رسول الله صلى الله عليه وسلم: إنما الأعمال بالنيات، وإنما لكل امرئ ما نوى." : "هذا صوت المحاور: يقرأ العناوين والشرح، ثم يجيبه صوت الشيخ بالآيات والأحاديث."), role);
    },
    previewRecitation: function(){
      hardStop(); var my = ++token, urls = recitationUrls("البقرة", "153", cfg.reciter);
      if (!urls) return false;
      if (!audio) audio = new Audio();
      audio.onended = audio.onerror = null; audio.src = urls[0];
      var p = audio.play(); if (p && p.catch) p.catch(function(){});
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
