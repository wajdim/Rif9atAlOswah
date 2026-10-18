# Hadith candidates for the library, from Riyad al-Salihin (al-Nawawi's thematic selection), each matched to its
# primary collection (number, Arabic book, graders) and given the engine's suggested themes.
# Output: build/kb/cache/candidates.json (not committed: a working list for hand selection into hadith-add.tsv)
# Usage: python -I build/kb/candidates.py
import json, os, re, sys, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kbsrc import *
sys.stdout.reconfigure(encoding="utf-8")

PRIMARY = ["bukhari", "muslim", "abudawud", "tirmidhi", "nasai", "ibnmajah", "malik"]
C = {b: Collection(b) for b in PRIMARY + ["riyad"]}
app = load_app()
lib_toks = [toks(h["t"]) for h in app["hadith"]] + [toks(h["text"]) for h in app["sitHadith"]]

QUOTE = re.compile(r"[“\"]([^”\"]{12,})[”\"]")
NARR = re.compile(r"عن ([^:‏]{3,60}?) رضي الله عن(?:ه|ها|هما|هم)")
ATTR = re.compile(r"\(\(([^)]{3,120})\)\)")
def plain(s): return re.sub(r"\s+", " ", re.sub(r"[ً-ْٰ‌-‏]", "", s)).strip()

out = []
for it in C["riyad"].items:
    ar = it["ar"]
    quotes = [q.strip() for q in QUOTE.findall(ar)]
    if not quotes: continue
    q = max(quotes, key=len)
    qt = toks(q)
    if len(qt) < 5: continue
    if any(coverage(qt, lt) >= 0.6 or coverage(lt, qt) >= 0.8 for lt in lib_toks if lt): continue   # already in the app
    best = None
    for b in PRIMARY:
        for c, s in C[b].search(qt, 2):
            if c >= 0.85 and (best is None or (c > best[0] + 0.05) or (abs(c - best[0]) <= 0.05 and PRIMARY.index(b) < PRIMARY.index(best[1]))):
                best = (c, b, s)
    if not best: continue
    c, b, s = best
    grades = graders_ar(s["grades"])
    alb = [g[1] for g in grades if g[0] == "الألباني"]
    if b not in ("bukhari", "muslim"):
        if not alb or alb[0] not in ("صحيح", "حسن", "حسن صحيح"): continue
    m = NARR.search(ar); a = ATTR.search(ar)
    eq = re.findall(r"\"([^\"]{12,})\"", it["en"])
    out.append({"rid": it["num"], "riyadBook": it.get("kitabAr", ""), "narr": m.group(1).strip() if m else "", "attr": plain(a.group(1)) if a else "",
                "book": b, "num": s["num"], "kitab": s.get("kitabAr") or s.get("kitab"), "cov": round(c, 2), "grades": grades,
                "q": plain(q), "en": max(eq, key=len).strip() if eq else it["en"][:400]})

# engine's themes for each candidate (Arabic quote + English) — a suggestion, reviewed by hand
js = r'''
const L=require(process.argv[1])(process.argv[2]); const C=JSON.parse(require("fs").readFileSync(0,"utf8"));
process.stdout.write(JSON.stringify(C.map(c=>L.RAG.understand(c.q+" . "+c.en).themes.slice(0,3).map(t=>t.id))));'''
th = json.loads(subprocess.run(["node", "-e", js, os.path.join(ROOT, "build", "tests", "load.js"), os.path.join(ROOT, "js")],
                               input=json.dumps(out, ensure_ascii=False), capture_output=True, encoding="utf-8").stdout)
for c, t in zip(out, th): c["th"] = t
json.dump(out, open(os.path.join(CACHE, "candidates.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
from collections import Counter
print("candidates:", len(out), dict(Counter(c["book"] for c in out)))
print("riyad books:", Counter(c["riyadBook"] for c in out).most_common(25))
