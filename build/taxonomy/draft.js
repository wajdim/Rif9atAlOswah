// Prints a first-pass category/subcategory guess for every LIFE situation (a helper for writing life-XX.tsv by hand).
const fs=require("fs"),vm=require("vm"),path=require("path");
const c={};c.window=c;vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(__dirname,"../../js/data-life.js"),"utf8"),c);
const tax=JSON.parse(fs.readFileSync(path.join(__dirname,"taxonomy.json"),"utf8"));
const byTheme={};tax.cats.forEach(k=>k.subs.forEach(s=>s.th.forEach(t=>{ if(!byTheme[t]) byTheme[t]=k.id+"."+s.id; })));
const bySection={11:"life.abroad",12:"life.papers",13:"life.identity",14:"life.abroad_work",15:"life.return",17:"life.digital",26:"life.digital",23:"work.study",18:"work.leadership",16:"people.boundaries",25:"family.independence"};
const [from,to]=(process.argv[2]||"1-500").split("-").map(Number);
c.LIFE.filter(x=>x.n>=from&&x.n<=to).forEach(x=>console.log([x.n,x.s,bySection[x.s]||byTheme[x.th[0]]||"?",x.th.join(","),x.t].join("\t")));
