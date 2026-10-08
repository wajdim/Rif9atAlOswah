const G=require("./load.js")(require("path").join(__dirname,"..","..","js"));
const ids=new Set(G.SITUATIONS.map(s=>s.id));const bad=[];
G.THEMES.forEach(t=>t.sits.forEach(id=>{if(!ids.has(id))bad.push(t.id+":"+id)}));
G.SITUATIONS.forEach(s=>(s.contrasts||[]).forEach(c=>{if(!ids.has(c.id))bad.push("contrast "+s.id+":"+c.id)}));
console.log("situations",G.SITUATIONS.length,"dupIds",G.SITUATIONS.length-ids.size,"badRefs",bad);
const tests=process.argv.slice(2).length?process.argv.slice(2):["زوجي يصرخ علي امام اهله وانا تعبت ولم اعد احتمل","مديري ظلمني وسرق مجهودي امام الزملاء","ماتت امي منذ شهر ولا استطيع تجاوز الحزن","عدت للذنب بعد ما تبت واشعر اني منافق","نحس روحي مقلق برشا على مستقبلي وما عنديش خدمة","اخي اخذ حقي في الميراث","ابني المراهق لا يسمع الكلام ويكذب","عندي ديون كثيرة والبنك يطالبني","اشعر بالوحدة ولا احد يفهمني","صرخت على امي وندمت","امتحان الباك بعد اسبوع وخايف","عندي وسواس في الوضوء","احبها وهي تركتني","أشعر بالغضب من شخص.","أمامي قرار صعب.","شخص أساء إليّ ثم اعتذر.","تعرضت للخيانة."];
for(const t of tests){const a=G.RAG.analyze(t);
console.log("\n>>",t,"| conf:",a.confidence,"| self:",a.understanding.selfFault);
console.log("  themes:",a.understanding.themes.map(x=>x.id+"("+x.score.toFixed(1)+")").join(" "));
console.log("  emo:",a.understanding.emotions.map(e=>e.label).join(","),"| rel:",a.understanding.relations.map(r=>r.label).join(","));
console.log("  sits:",a.retrieval.sits.slice(0,3).map(x=>x.s.id+"("+x.score.toFixed(1)+")").join(" "));
console.log("  ayat:",a.retrieval.ayat.slice(0,3).map(x=>x.item.id).join(" "),"| hadith:",a.retrieval.hadith.slice(0,3).map(x=>x.item.id).join(" "),"| duas:",a.retrieval.duas.map(x=>x.item.id).join(" "));}
