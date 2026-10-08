# -*- coding: utf-8 -*-
"""
رِفقة الأُسوة — مطابقة نصوص الأحاديث في التطبيق مع مصادرها في مجموعة hadith-json
(نصوص sunnah.com العربية والإنجليزية) لاستخراج الترجمة الإنجليزية المنشورة.

الاستخدام:
  python hadith-match.py <hadith-json dir> <out.json>

المخرجات: لكل نص (مكتبة الأحاديث + أحاديث المواقف):
  {key, kind, ar, src, matches:[{book, no, score, ar, en_narrator, en}]}
  key = "lib:<id>" أو "sit:<sitId>:<index>"
ثم تُراجع يدويًا ويُكتب منها te (المقطع المطابق من الترجمة المنشورة).
"""
import json, os, re, sys, subprocess
from collections import defaultdict

SRC_DIR, OUT = sys.argv[1], sys.argv[2]
ROOT = os.path.join(os.path.dirname(__file__), "..", "..")

def norm(t):
    t = re.sub(r"[ً-ْٰـۖ-ۭ]", "", t or "")
    t = re.sub(r"[إأآٱ]", "ا", t).replace("ى", "ي").replace("ة", "ه").replace("ؤ", "و").replace("ئ", "ي")
    t = t.replace("صلى الله عليه وسلم", " ").replace("ﷺ", " ")
    return re.findall(r"[ء-ي]+", t)

# بيانات التطبيق عبر node
dump = subprocess.run(["node", "-e", r'''
const vm=require("vm"),fs=require("fs");const c={window:{}};c.window=c;vm.createContext(c);
for(const f of ["data-situations","data-situations-2","data-situations-3","data-situations-4","data-hadith"]) vm.runInContext(fs.readFileSync("js/"+f+".js","utf8"),c);
const out=[];
c.HADITH_LIB.forEach(h=>out.push({key:"lib:"+h.id,kind:"lib",ar:h.t,src:h.src,narr:h.r}));
c.SITUATIONS.forEach(s=>(s.hadithRefs||[]).forEach((h,i)=>out.push({key:"sit:"+s.id+":"+i,kind:h.paraphrase?"para":"sit",ar:h.text,src:h.source,narr:h.narrator})));
process.stdout.write(JSON.stringify(out));
'''], cwd=ROOT, capture_output=True, text=True, encoding="utf-8")
targets = json.loads(dump.stdout)

BOOKS = ["bukhari", "muslim", "abudawud", "tirmidhi", "nasai", "ibnmajah", "malik", "ahmed", "darimi",
         "aladab_almufrad", "riyad_assalihin", "mishkat_almasabih", "bulugh_almaram", "nawawi40", "qudsi40"]
HINT = {"البخاري": ["bukhari", "aladab_almufrad"], "مسلم": ["muslim"], "داود": ["abudawud"], "الترمذي": ["tirmidhi"],
        "النسائي": ["nasai"], "ماجه": ["ibnmajah"], "مالك": ["malik"], "الموطأ": ["malik"], "أحمد": ["ahmed"], "الأدب المفرد": ["aladab_almufrad"]}

docs = []; index = defaultdict(set)
for b in BOOKS:
    f = os.path.join(SRC_DIR, b + ".json")
    if not os.path.exists(f): continue
    d = json.load(open(f, encoding="utf-8"))
    for h in d["hadiths"]:
        en = h.get("english") or {}
        if isinstance(en, str): en = {"text": en}
        w = norm(h.get("arabic", ""))
        if not w: continue
        i = len(docs)
        docs.append({"book": b, "no": h.get("idInBook") or h.get("id"), "w": w, "ar": h.get("arabic", ""),
                     "en_narrator": (en.get("narrator") or "").strip(), "en": re.sub(r"\s+", " ", en.get("text") or "").strip()})
        for k in set(zip(w, w[1:])): index[k].add(i)

def best(ar, src):
    w = norm(ar); pairs = set(zip(w, w[1:]))
    if not pairs: return []
    score = defaultdict(int)
    for p in pairs:
        cands = index.get(p, ())
        if len(cands) > 3000: continue          # أزواج شائعة جدًا لا تميّز
        for i in cands: score[i] += 1
    prefer = set(sum([v for k, v in HINT.items() if k in (src or "")], []))
    ranked = sorted(score.items(), key=lambda x: (-(x[1] / len(pairs) + (0.08 if docs[x[0]]["book"] in prefer else 0)), len(docs[x[0]]["w"])))[:3]
    out = []
    for i, s in ranked:
        d = docs[i]
        out.append({"book": d["book"], "no": d["no"], "score": round(s / len(pairs), 2), "ar": d["ar"][:1500], "en_narrator": d["en_narrator"], "en": d["en"][:2500]})
    return out

res = []
for t in targets:
    t["matches"] = best(t["ar"], t["src"]); res.append(t)
json.dump(res, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
good = sum(1 for r in res if r["matches"] and r["matches"][0]["score"] >= 0.6)
print("texts:", len(res), "· strong matches (>=0.6):", good, "· docs indexed:", len(docs))
