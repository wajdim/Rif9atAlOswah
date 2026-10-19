/* ======================================================================
   رِفقة الأُسوة — طبقة الفهم قبل المحرك (NLU pre-processing, 100% offline)
   ----------------------------------------------------------------------
   Called by js/rag.js before theme detection. Data: js/data-nlu.js.
   1) prepare(raw)   Arabizi → Arabic script (consonant-skeleton matching against
                     the engine's own Arabic vocabulary), then spelling correction
                     of Latin words (Damerau distance against the engine's vocabulary).
                     Replacements are made in place, so negation scopes and the
                     evidence quoted back to the user stay aligned.
   2) safety(norm)   crisis (explicit intent) and soft risk (hopelessness).
   3) concepts(...)  multilingual co-occurrence rules → theme and emotion votes.
   4) interpret(...) unspecific distress → ordered interpretations to offer.
   No religious text is produced or changed here.
   ====================================================================== */
var NLU = (function(){
  "use strict";
  var D = window.NLU_DATA || {concepts:[], vague:[], crisis:[], soft:[], arabizi:{words:{}, prefixes:[], cue:[]}, vocab:"", commonEn:""};
  var norm = function(s){ return window.RAG ? RAG.normalize(s) : String(s || "").toLowerCase(); };
  var ready = false, CONCEPTS = [], VAGUE = [], CRISIS = [], SOFT = [], VORDER = [], COMBOS = [];
  var SKEL = Object.create(null), LATIN = Object.create(null), LATIN_BY = Object.create(null), COMMON = new Set();
  var AW = Object.create(null), APRE = [], ACUE = new Set();

  /* ---------------- shared helpers ---------------- */
  var AR_PRE = ["وبال","وال","بال","فال","كال","لل","ال","وب","ول","فل","و","ف","ب","ل","ك"];
  var AR_SUF = ["ها","هم","هن","نا","ني","كم","تي","وش","ش","ي","ك","ه","و","ت"];
  function forms(u){
    var out = [u], i, p, s;
    if (/^[ء-ي]/.test(u)) {
      for (i = 0; i < AR_PRE.length; i++) { p = AR_PRE[i]; if (u.indexOf(p) === 0 && u.length - p.length >= 2) { out.push(u.slice(p.length)); break; } }
      out.slice().forEach(function(w){
        for (var j = 0; j < AR_SUF.length; j++) { s = AR_SUF[j]; if (w.length - s.length >= 3 && w.slice(-s.length) === s) { out.push(w.slice(0, -s.length)); break; } }
      });
    }
    return out;
  }
  function tokMatch(u, pw){
    var f = forms(u);
    if (pw.star) return f.some(function(x){ return x.indexOf(pw.w) === 0; });
    return f.indexOf(pw.w) > -1;
  }
  /* a phrase: list of {w, star}; matches consecutive user tokens */
  var PH_CACHE = {};
  function compile(phrase){
    var parts = String(phrase).trim().split(/\s+/).map(function(x){ return {w: norm(x.replace(/\*$/, "")), star: /\*$/.test(x)}; })
      .filter(function(p){ return p.w; });
    // normalize may split a token ("mother-in-law" → "mother in law")
    var flat = [];
    parts.forEach(function(p){ var ws = p.w.split(" "); ws.forEach(function(w, i){ flat.push({w: w, star: p.star && i === ws.length - 1}); }); });
    return {src: phrase, parts: flat};
  }
  /* every start position of a phrase */
  function positions(tokens, ph){
    var n = ph.parts.length, out = [];
    for (var i = 0; i + n <= tokens.length; i++) {
      var ok = true;
      for (var j = 0; j < n && ok; j++) ok = tokMatch(tokens[i + j], ph.parts[j]);
      if (ok) out.push(i);
    }
    return out;
  }
  function comboHit(tokens, c){
    var pa = [], pb = [];
    c.a.forEach(function(ph){ pa = pa.concat(positions(tokens, ph)); });
    if (!pa.length) return false;
    // «no hope that he will change» is about one hope, not hopelessness: skip a target followed by a "notAfter" word
    c.b.forEach(function(ph){ positions(tokens, ph).forEach(function(y){ if (c.notAfter.indexOf(tokens[y + ph.parts.length]) < 0) pb.push(y); }); });
    return pa.some(function(x){ return pb.some(function(y){ return Math.abs(x - y) <= c.window; }); });
  }
  function findPhrase(tokens, ph){
    var n = ph.parts.length;
    for (var i = 0; i + n <= tokens.length; i++) {
      var ok = true;
      for (var j = 0; j < n && ok; j++) ok = tokMatch(tokens[i + j], ph.parts[j]);
      if (ok) return tokens.slice(i, i + n).join(" ");
    }
    return null;
  }
  function inText(normText, list){
    var h = " " + normText + " ";
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      if (h.indexOf(" " + p + " ") > -1 || h.indexOf(" و" + p + " ") > -1 || h.indexOf(" ف" + p + " ") > -1) return p;
      if (p.length >= 6 && h.indexOf(" " + p) > -1) return p;   // long phrases may carry a suffix: «ending it all», «تعبت من الحياه»
    }
    return null;
  }

  /* ---------------- Arabizi skeletons ---------------- */
  // consonant classes shared by both scripts: ت/ط, ح/ه, ذ/ض/ظ, س/ص; vowels and و/ي are dropped
  var AR_CLASS = {"ت":"T","ط":"T","ح":"H","ه":"H","ذ":"D","ض":"D","ظ":"D","س":"S","ص":"S","ة":"H","ڨ":"ق"};
  function arClass(w, keepVowels){
    var out = "";
    for (var i = 0; i < w.length; i++) {
      var c = w[i];
      if (AR_CLASS[c]) c = AR_CLASS[c];
      else if (/[اويىءآأإئؤ]/.test(c)) { if (!keepVowels) continue; c = (c === "و") ? "و" : (c === "ي" || c === "ى" || c === "ئ") ? "ي" : "ا"; }
      if (!keepVowels && out.slice(-1) === c) continue;
      out += c;
    }
    return out;
  }
  var LAT_DI = [["ch","ش"],["sh","ش"],["kh","خ"],["gh","غ"],["th","ث"],["dh","D"],["ou","و"],["oo","و"],["ee","ي"],["ii","ي"],["aa","ا"]];
  var LAT_1 = {b:"ب",t:"T",j:"ج",h:"H",d:"د",r:"ر",z:"ز",s:"S",f:"ف",q:"ق",k:"ك",l:"ل",m:"م",n:"ن",g:"ق",p:"ب",v:"ف",c:"ك",x:"كS",
               "2":"ا","3":"ع","4":"D","5":"خ","6":"T","7":"H","8":"غ","9":"ق",a:"",e:"",i:"ي",o:"و",u:"و",y:"ي",w:"و"};
  /* Latin token → class string; keepVowels keeps long vowels (و ي ا) for tie-breaking */
  function latClass(t, keepVowels){
    var out = "", i = 0;
    t = t.toLowerCase();
    while (i < t.length) {
      var two = t.substr(i, 2), hit = null;
      for (var k = 0; k < LAT_DI.length; k++) if (LAT_DI[k][0] === two) { hit = LAT_DI[k][1]; break; }
      var c;
      if (hit) { c = hit; i += 2; } else { c = LAT_1[t[i]]; if (c == null) c = ""; i += 1; }
      if (i === t.length && !hit && (t[i - 1] === "a" || t[i - 1] === "e") && keepVowels) c = "ا";   // final -a: «barcha» → برشا
      if (/[اوي]/.test(c) && !keepVowels) c = "";
      if (!c) continue;
      if (!keepVowels && out.slice(-1) === c) continue;   // shadda: «najjem» → نجم
      out += c;
    }
    return out;
  }
  function lev(a, b){
    var m = a.length, n = b.length, prev = [], cur, i, j;
    for (j = 0; j <= n; j++) prev[j] = j;
    for (i = 1; i <= m; i++) {
      cur = [i];
      for (j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[n];
  }
  function skelLookup(t){
    var sk = latClass(t, false);
    if (sk.length < 2) return null;
    var cands = SKEL[sk]; if (!cands) return null;
    var v = latClass(t, true), best = null, bd = 1e9;
    cands.forEach(function(w){ var d = lev(v, arClass(w, true)); if (d < bd) { bd = d; best = w; } });
    return bd <= Math.max(1, Math.floor(v.length / 2)) ? best : null;
  }
  function arabiziWord(t){
    if (AW[t]) return AW[t];
    var w = skelLookup(t); if (w) return w;
    for (var i = 0; i < APRE.length; i++) {
      var p = APRE[i][0], ar = APRE[i][1];
      if (t.indexOf(p) === 0 && t.length - p.length >= 2) {
        var rest = t.slice(p.length), r = AW[rest] || skelLookup(rest);
        if (r) return (ar === "ال" && /^ال/.test(r)) ? r : ar + r;   // «el» + «الشاف» stays «الشاف»; «ma» + «عادش» → «ما عادش»
      }
    }
    return null;
  }
  var LATIN_TOK = /^[a-z0-9]+$/;
  var STRONG = /[a-z][235679]|[235679][a-z]/;
  function isArabizi(tokens){
    var strong = 0, cue = 0;
    tokens.forEach(function(t){ if (!LATIN_TOK.test(t)) return; if (STRONG.test(t) && /[a-z]/.test(t)) strong++; if (ACUE.has(t)) cue++; });
    return strong >= 1 || cue >= 2;
  }

  /* ---------------- spelling (Latin script) ---------------- */
  function damerau(a, b, max){
    if (Math.abs(a.length - b.length) > max) return max + 1;
    var d = [], i, j;
    for (i = 0; i <= a.length; i++) { d[i] = [i]; }
    for (j = 0; j <= b.length; j++) d[0][j] = j;
    for (i = 1; i <= a.length; i++) {
      var rowMin = 1e9;
      for (j = 1; j <= b.length; j++) {
        var cost = a[i - 1] === b[j - 1] ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        if (d[i][j] < rowMin) rowMin = d[i][j];
      }
      if (rowMin > max) return max + 1;
    }
    return d[a.length][b.length];
  }
  function correct(t){
    if (t.length < 4 || LATIN[t] || COMMON.has(t) || /[0-9]/.test(t)) return null;
    // a known word plus an English ending is a real word, not a typo: «hates», «helped», «talking»
    var m = t.match(/^(.{3,}?)(s|es|ed|d|ing|ly|er|ers)$/);
    if (m && (LATIN[m[1]] || COMMON.has(m[1]) || LATIN[m[1] + "e"] || COMMON.has(m[1] + "e"))) return null;
    var max = t.length >= 7 ? 2 : 1, best = null, bd = max + 1;
    (LATIN_BY[t[0]] || []).forEach(function(w){
      if (Math.abs(w.length - t.length) > max) return;
      var d = damerau(t, w, max);
      if (t.indexOf(w) === 0) return;   // dropping the last letters turns words into other words: «hello» is not «hell»
      if (d < bd || (d === bd && best && w.length > best.length)) { bd = d; best = w; }
    });
    return bd <= max ? best : null;
  }

  /* ---------------- build (lazy, once) ---------------- */
  function addArabicVocab(text){
    norm(text).split(" ").forEach(function(w){
      if (!/^[ء-ي]{2,}$/.test(w)) return;
      [w, w.indexOf("ال") === 0 && w.length > 3 ? w.slice(2) : null].forEach(function(x){
        if (!x) return; var sk = arClass(x, false); if (sk.length < 2) return;
        var l = SKEL[sk] = SKEL[sk] || []; if (l.indexOf(w) < 0 && l.length < 12) l.push(w);
      });
    });
  }
  function addLatinVocab(text){
    norm(text).split(" ").forEach(function(w){ if (/^[a-z]{4,}$/.test(w) && !LATIN[w]) { LATIN[w] = 1; (LATIN_BY[w[0]] = LATIN_BY[w[0]] || []).push(w); } });
  }
  function build(){
    if (ready) return; ready = true;
    CONCEPTS = (D.concepts || []).map(function(c){
      return {id: c.id, th: c.th || {}, emo: c.emo || [], distinction: c.distinction || null, all: c.all.map(function(g){ return g.map(compile); })};
    });
    VAGUE = (D.vague || []).map(compile);
    CRISIS = (D.crisis || []).map(norm).filter(Boolean);
    SOFT = (D.soft || []).map(norm).filter(Boolean);
    VORDER = (D.vagueOrder || []).map(function(o){ return {cue: o.cue.map(norm), first: o.first}; });
    COMBOS = (D.safetyCombos || []).map(function(c){ return {level: c.level, window: c.window || 10, a: c.a.map(compile), b: c.b.map(compile), notAfter: (c.notAfter || []).map(norm)}; });
    var A = D.arabizi || {};
    Object.keys(A.words || {}).forEach(function(k){ AW[k] = A.words[k]; });
    APRE = A.prefixes || []; (A.cue || []).forEach(function(w){ ACUE.add(w); });
    norm(D.commonEn || "").split(" ").forEach(function(w){ if (w) COMMON.add(w); });
    // vocabulary = everything the engine can already recognise
    var texts = [D.vocab || ""];
    (window.THEMES || []).forEach(function(t){ texts.push(t.triggers.join(" ")); });
    (window.EMOTION_LEXICON || []).concat(window.RELATION_LEXICON || []).forEach(function(e){ texts.push(e.words.join(" ")); });
    [window.NEED_CUES, window.TIME_CUES].forEach(function(o){ if (o) Object.keys(o).forEach(function(k){ texts.push((o[k] || []).join(" ")); }); });
    (D.concepts || []).forEach(function(c){ c.all.forEach(function(g){ texts.push(g.join(" ").replace(/\*/g, "")); }); });
    texts.push((D.vague || []).join(" "), (D.crisis || []).join(" "), (D.soft || []).join(" "));
    Object.keys(AW).forEach(function(k){ texts.push(AW[k]); });
    texts.forEach(function(t){ addArabicVocab(t); addLatinVocab(t); });
  }

  /* ---------------- public API ---------------- */
  /* Arabizi and spelling, in place. Returns the text the engine should read. */
  function prepare(raw){
    build();
    raw = String(raw || "");
    var pieces = raw.split(/(\s+)/), lower = pieces.map(function(p){ return p.toLowerCase().replace(/^[^a-z0-9ء-ي]+|[^a-z0-9ء-ي]+$/g, ""); });
    var toks = lower.filter(function(x){ return x && !/^\s+$/.test(x); });
    var arabizi = isArabizi(toks);
    // spelling correction only for English text: in French/Dutch/… most words are "unknown" and must not be "fixed"
    var latin = toks.filter(function(x){ return /^[a-z]+$/.test(x); }), known = latin.filter(function(x){ return COMMON.has(x); }).length;
    var english = latin.length >= 2 && known / latin.length >= 0.4;
    var translit = [], corrections = [];
    var out = pieces.map(function(p, i){
      var t = lower[i]; if (!t || !LATIN_TOK.test(t)) return p;
      var rep = null;
      if (arabizi) { rep = arabiziWord(t); if (rep) translit.push([t, rep]); }
      else if (english) { rep = correct(t); if (rep) corrections.push([t, rep]); }
      if (!rep) return p;
      var m = p.match(/^([^a-zA-Z0-9]*)(.*?)([^a-zA-Z0-9]*)$/);   // keep surrounding punctuation
      return (m ? m[1] : "") + rep + (m ? m[3] : "");
    });
    return {text: out.join(""), arabizi: arabizi, translit: translit, corrections: corrections};
  }
  /* crisis = explicit intent · soft = hopelessness without stated intent */
  function safety(normText){
    build();
    var c = inText(normText, CRISIS), s = c ? null : inText(normText, SOFT), tokens = normText.split(" ");
    if (!c) COMBOS.forEach(function(k){ if (k.level === "crisis" && !c && comboHit(tokens, k)) c = "combo"; });
    if (!c && !s) COMBOS.forEach(function(k){ if (k.level === "soft" && !s && comboHit(tokens, k)) s = "combo"; });
    return {crisis: !!c, soft: !c && !!s, cue: c || s || ""};
  }
  /* concepts present in the message → [{id, th, emo, ev, distinction}] */
  function concepts(tokens){
    build();
    var out = [];
    CONCEPTS.forEach(function(c){
      var ev = [];
      for (var g = 0; g < c.all.length; g++) {
        var hit = null;
        for (var k = 0; k < c.all[g].length && !hit; k++) hit = findPhrase(tokens, c.all[g][k]);
        if (!hit) return;
        ev.push(hit);
      }
      out.push({id: c.id, th: c.th, emo: c.emo, ev: ev.join(" … "), distinction: c.distinction});
    });
    return out;
  }
  /* unspecific distress → ordered theme ids to offer (null if the message is specific enough) */
  function interpret(tokens, normText, themes){
    build();
    var vague = null;
    for (var i = 0; i < VAGUE.length && !vague; i++) vague = findPhrase(tokens, VAGUE[i]);
    var top = themes[0], strong = top && top.score >= 3.2 && (top.hits || []).length && !top.vague;
    var feeling = /(^| )(feel|feeling|i m|im|حاسس|حاسه|نحس|احس|اشعر|حالتي|نفسيتي)( |$)/.test(normText);
    if (!vague && (themes.length || !feeling)) return null;
    if (strong && themes.length > 0 && !vague) return null;
    if (vague && strong && themes.length && top.score >= 4.5) return null;
    var ids = [];
    themes.slice(0, 2).forEach(function(t){ if (!t.vague) ids.push(t.id); });
    VORDER.forEach(function(o){ if (o.cue.some(function(c){ return (" " + normText).indexOf(" " + c) > -1 || normText.indexOf(c) > -1; })) o.first.forEach(function(id){ ids.push(id); }); });
    (D.vagueDefault || []).forEach(function(id){ ids.push(id); });
    ids = ids.filter(function(id, k){ return ids.indexOf(id) === k; });
    return {cue: vague || "", ids: ids.slice(0, 5)};
  }
  return {prepare: prepare, safety: safety, concepts: concepts, interpret: interpret,
          phrase: function(tokens, ph){ build(); var c = PH_CACHE[ph] || (PH_CACHE[ph] = compile(ph)); return c.parts.length ? findPhrase(tokens, c) : null; },
          _skel: function(t){ build(); return {latin: latClass(t, false), vowels: latClass(t, true), word: arabiziWord(t)}; }};
})();
