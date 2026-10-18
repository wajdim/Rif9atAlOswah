/* Builds js/data-taxonomy.js from taxonomy.json + life-*.tsv + extra.tsv, after validating everything.
   node build/taxonomy/build.js          → validate and write
   node build/taxonomy/build.js --check  → validate only (exit 1 on any error)
   Sources:
   - taxonomy.json : categories → subcategories, and the "needs" vocabulary
   - life-NN.tsv   : one row per situation 1–500 of «500 موقف من الحياة» (text stays in js/data-life.js, unchanged):
                     n, sub, em, need, en, ph_ar, ph_en
   - extra.tsv     : situations 501+ written for this app (themes the PDF does not cover):
                     n, sub, th, em, need, t, en, ph_ar, ph_en */
const fs=require("fs"),vm=require("vm"),path=require("path");
const ROOT=path.join(__dirname,"../.."), JS=path.join(ROOT,"js"), HERE=__dirname;
const CHECK=process.argv.includes("--check");

const ctx={console,window:{}}; ctx.window=ctx; vm.createContext(ctx);
for(const f of ["data-life.js","data-themes.js"]) vm.runInContext(fs.readFileSync(path.join(JS,f),"utf8"),ctx,{filename:f});
const LIFE=vm.runInContext("LIFE",ctx), THEMES=vm.runInContext("THEMES",ctx), EMO=vm.runInContext("EMOTION_LEXICON",ctx);
const themeIds=new Set(THEMES.map(t=>t.id)), emoIds=new Set(EMO.map(e=>e.id));
const tax=JSON.parse(fs.readFileSync(path.join(HERE,"taxonomy.json"),"utf8"));
const needIds=new Set(tax.needs.map(n=>n.id));
const subs=new Map(); tax.cats.forEach(c=>c.subs.forEach(s=>subs.set(c.id+"."+s.id,{cat:c.id,...s})));

const errors=[], warnings=[];
const err=(m)=>errors.push(m), warn=(m)=>warnings.push(m);
function readTsv(file){
  const lines=fs.readFileSync(file,"utf8").replace(/^﻿/,"").split(/\r?\n/).filter(l=>l.trim());
  const head=lines.shift().split("\t");
  return lines.map((l,i)=>{ const c=l.split("\t"), o={_where:path.basename(file)+":"+(i+2)};
    if(c.length!==head.length) err(o._where+": "+c.length+" columns, expected "+head.length);
    head.forEach((h,k)=>o[h]=(c[k]||"").trim()); return o; });
}
const list=(s)=>s?s.split(",").map(x=>x.trim()).filter(Boolean):[];
const AR=/[؀-ۿ]/, LATIN=/[a-z]/i;

function checkRow(r, th){
  const w=r._where;
  if(!subs.has(r.sub)) err(w+": unknown subcategory "+r.sub);
  const em=list(r.em), need=list(r.need);
  if(!em.length) err(w+": no emotion"); em.forEach(e=>{ if(!emoIds.has(e)) err(w+": unknown emotion "+e); });
  if(!need.length) err(w+": no need"); need.forEach(n=>{ if(!needIds.has(n)) err(w+": unknown need "+n); });
  th.forEach(t=>{ if(!themeIds.has(t)) err(w+": unknown theme "+t); });
  if(!r.en || !LATIN.test(r.en) || AR.test(r.en)) err(w+": English text missing or not English");
  if(!r.ph_ar || !AR.test(r.ph_ar)) err(w+": Arabic phrase missing");
  if(!r.ph_en || !LATIN.test(r.ph_en) || AR.test(r.ph_en)) err(w+": English phrase missing");
  const s=subs.get(r.sub); if(s && th.length && !th.some(t=>s.th.includes(t))) warn(w+": themes ["+th+"] share nothing with "+r.sub+" ["+s.th+"]");
  return {sub:r.sub, em, need, en:r.en, ph:[r.ph_ar, r.ph_en]};
}

const X={}, seen=new Set();
fs.readdirSync(HERE).filter(f=>/^life-\d+\.tsv$/.test(f)).sort().forEach(f=>readTsv(path.join(HERE,f)).forEach(r=>{
  const n=+r.n, item=LIFE.find(x=>x.n===n);
  if(!item){ err(r._where+": no LIFE situation "+r.n); return; }
  if(seen.has(n)) err(r._where+": duplicate situation "+n); seen.add(n);
  X[n]=checkRow(r, item.th);
}));
LIFE.forEach(x=>{ if(!seen.has(x.n)) err("situation "+x.n+" has no taxonomy row"); });

const EXTRA=[];
readTsv(path.join(HERE,"extra.tsv")).forEach(r=>{
  const n=+r.n, th=list(r.th);
  if(!(n>500)) err(r._where+": extra situations are numbered from 501");
  if(seen.has(n)) err(r._where+": duplicate situation "+n); seen.add(n);
  if(!th.length) err(r._where+": no theme");
  if(!r.t || !AR.test(r.t)) err(r._where+": Arabic situation text missing");
  EXTRA.push({n, s:0, t:r.t, th, src:"rifqa", ...checkRow(r, th)});
});

// every subcategory needs enough situations to be worth browsing
const per={}; Object.values(X).concat(EXTRA).forEach(x=>per[x.sub]=(per[x.sub]||0)+1);
subs.forEach((s,id)=>{ if((per[id]||0)<4) err("subcategory "+id+" has only "+(per[id]||0)+" situations"); });
// every theme should be reachable from at least one situation
const reach=new Set(); LIFE.forEach(x=>x.th.forEach(t=>reach.add(t))); EXTRA.forEach(x=>x.th.forEach(t=>reach.add(t)));
themeIds.forEach(t=>{ if(!reach.has(t)) err("theme "+t+" is not linked to any situation"); });

const total=Object.keys(X).length+EXTRA.length;
console.log("situations: "+total+" ("+Object.keys(X).length+" from the PDF + "+EXTRA.length+" new) · "+tax.cats.length+" categories · "+subs.size+" subcategories");
if(warnings.length) console.log("warnings ("+warnings.length+"):\n  "+warnings.join("\n  "));
if(errors.length){ console.error("ERRORS ("+errors.length+"):\n  "+errors.join("\n  ")); process.exit(1); }
const cats=tax.cats.map(c=>({id:c.id, ar:c.ar, en:c.en, icon:c.icon, subs:c.subs.map(s=>({id:c.id+"."+s.id, ar:s.ar, en:s.en}))}));
const J=(v)=>JSON.stringify(v);
const out=`/* ======================================================================
   رِفقة الأُسوة — تصنيف المواقف (Situation taxonomy)
   ----------------------------------------------------------------------
   GENERATED by build/taxonomy/build.js from build/taxonomy/*.tsv — do not edit by hand.
   - TAXONOMY: 8 categories → subcategories (ar/en labels).
   - SIT_NEEDS: what a person in the situation usually needs.
   - LIFE_X: enrichment of the 500 situations in js/data-life.js (whose text stays identical to the PDF):
       sub (subcategory), em (emotions, ids of EMOTION_LEXICON), need (SIT_NEEDS ids),
       en (English text), ph (possible user phrases: [Arabic, English]).
   - LIFE_EXTRA: situations written for this app (n ≥ 501), same fields plus t (Arabic) and th (themes).
   No religious text lives here: evidence is reached only through the themes (th) and their verified sources.
   ====================================================================== */
var TAXONOMY = ${J(cats)};
var SIT_NEEDS = ${J(tax.needs)};
var LIFE_X = {
${Object.keys(X).map(n=>J(String(n))+":"+J(X[n])).join(",\n")}
};
var LIFE_EXTRA = [
${EXTRA.map(x=>J(x)).join(",\n")}
];
(function(){
  if(typeof LIFE==="undefined") return;
  LIFE.forEach(function(x){ var e=LIFE_X[x.n]; if(e) for(var k in e) x[k]=e[k]; });
  LIFE_EXTRA.forEach(function(x){ if(!LIFE.some(function(y){ return y.n===x.n; })) LIFE.push(x); });
})();
`;
const target=path.join(JS,"data-taxonomy.js");
if(CHECK){
  const cur=fs.existsSync(target)?fs.readFileSync(target,"utf8"):"";
  if(cur!==out){ console.error("js/data-taxonomy.js is stale: run node build/taxonomy/build.js"); process.exit(1); }
  console.log("taxonomy OK"); process.exit(0);
}
fs.writeFileSync(target,out);
console.log("wrote js/data-taxonomy.js ("+Math.round(out.length/1024)+" KB)");
