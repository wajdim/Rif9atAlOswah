/* Situation taxonomy (js/data-taxonomy.js): data validity, browse consistency, phrase understanding, safety.
   node build/tests/test-taxonomy.js [-v] */
const path=require("path"), {execFileSync}=require("child_process");
const JS=process.env.BENCH_JS||path.join(__dirname,"../../js"), V=process.argv.includes("-v");
let fail=0; const ok=(c,m)=>{ if(!c){ fail++; console.log("FAIL "+m); } };

try{ execFileSync(process.execPath,[path.join(__dirname,"../taxonomy/build.js"),"--check"],{stdio:"pipe"}); }
catch(e){ fail++; console.log("FAIL taxonomy build check:\n"+(e.stdout||"")+(e.stderr||"")); }

const L=require("./load.js")(JS,"ar");
const RAG=L.RAG;
// LIFE is global in the loaded context: reach it through byId
const items=[]; for(let n=1;n<1000;n++){ const x=RAG.byId("life",n); if(x) items.push(x); }
ok(items.length>=600, "at least 600 browsable situations (got "+items.length+")");
ok(items.every(x=>x.sub && x.en && x.ph && x.ph.length===2 && x.em && x.em.length && x.need && x.need.length), "every situation has sub, en, ph, em, need");

// 1. browse: opening a situation gives its own themes and emotions, with high confidence
let browseBad=[];
items.forEach(x=>{
  const a=RAG.analyze(x.t,{sit:x.n}), u=a.understanding;
  if(u.crisis) return;   // safety always wins (none expected; checked below)
  if(!u.themes[0] || u.themes[0].id!==x.th[0] || !u.emotions[0] || u.emotions[0].id!==x.em[0] || a.confidence!=="high" || !u.sit || u.sit.n!==x.n) browseBad.push(x.n);
});
ok(!browseBad.length, "browse keeps the situation's themes/emotions: "+browseBad.slice(0,10).join(","));

// 2. safety: no situation text or phrase is read as a crisis
const crisisHits=[];
items.forEach(x=>[x.t,x.ph[0],x.ph[1]].forEach(t=>{ if(RAG.understand(t).crisis) crisisHits.push(x.n+": "+t); }));
ok(!crisisHits.length, "no situation text triggers the crisis card:\n  "+crisisHits.join("\n  "));

// 3. understanding the user phrases (free text, no browse hint): the situation's main theme should rank top-3
function rate(get){
  let hit=0, miss=[];
  items.forEach(x=>{ const ids=RAG.understand(get(x)).themes.slice(0,3).map(t=>t.id); if(ids.indexOf(x.th[0])>-1) hit++; else miss.push(x.n+" ["+x.th[0]+"] → "+(ids.join(",")||"—")+"  «"+get(x)+"»"); });
  return {pct:hit/items.length, miss};
}
const ar=rate(x=>x.ph[0]), en=rate(x=>x.ph[1]);
console.log("phrase understanding (main theme in top 3): Arabic "+(ar.pct*100).toFixed(1)+"% · English "+(en.pct*100).toFixed(1)+"%");
if(V){ console.log("Arabic misses:\n  "+ar.miss.join("\n  ")); console.log("English misses:\n  "+en.miss.join("\n  ")); }
ok(ar.pct>=0.93, "Arabic phrases ≥ 93%");
ok(en.pct>=0.93, "English phrases ≥ 93%");

console.log(fail? fail+" failure(s)" : "taxonomy tests passed");
process.exit(fail?1:0);
