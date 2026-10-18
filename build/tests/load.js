const fs=require("fs"),vm=require("vm"),path=require("path");
/* يحمّل البيانات والمحرك في سياق معزول. lang: "ar" (افتراضي) أو "en" لاختبار الواجهة الإنجليزية */
module.exports=function(dir,lang){
  const ctx={console,localStorage:{getItem:()=>JSON.stringify({lang:lang||"ar"})}};ctx.window=ctx;vm.createContext(ctx);
  for(const f of ["data-situations.js","data-situations-2.js","data-situations-3.js","data-situations-4.js","data-quran.js","data-quran-kb.js","data-hadith.js","data-hadith-kb.js","data-evidence.js","data-themes.js","data-life.js","data-taxonomy.js","data-reading.js","data-en.js","i18n.js","rag.js","data-nlu.js","nlu.js","reading.js"]) vm.runInContext(fs.readFileSync(path.join(dir,f),"utf8"),ctx,{filename:f});
  return vm.runInContext("({SITUATIONS,THEMES,QURAN_LIB,HADITH_LIB,HADITH_ALL:(typeof HADITH_ALL!=='undefined'?HADITH_ALL:HADITH_LIB),EVIDENCE:(typeof EVIDENCE!=='undefined'?EVIDENCE:null),RAG,I18N})",ctx);
};
