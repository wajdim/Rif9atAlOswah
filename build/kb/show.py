# Inspection helper for reviewing evidence by hand.
#   python -I build/kb/show.py id <app id>...          app text + the cited source text + best matches in the corpus
#   python -I build/kb/show.py ref <book> <num>...      a source hadith (Arabic, English, chapter, grades)
#   python -I build/kb/show.py find <book|all> <words>  hadith containing all the words (diacritics ignored), best first
#   python -I build/kb/show.py ayah <surah> <ayah[-ayah]>
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kbsrc import *
sys.stdout.reconfigure(encoding="utf-8")
cmd, args = sys.argv[1], sys.argv[2:]
COLL = {}
def coll(b):
    if b not in COLL: COLL[b] = Collection(b)
    return COLL[b]
def show(it, full=False):
    g = "; ".join("%s: %s" % (x["name"], x["grade"]) for x in it["grades"])
    ar = it["ar"] if full or len(it["ar"]) < 700 else it["ar"][:700] + " …"
    en = it["en"] if full or len(it["en"]) < 600 else it["en"][:600] + " …"
    print("── %s %s (seq %s) · book %s «%s»%s\n  AR: %s\n  EN: %s" % (BOOK_AR[it["book"]], it["num"], it["seq"], it["kitabNum"], it["kitab"], ("\n  GRADES: " + g) if g else "", ar, en))

if cmd == "id":
    app = load_app(); allh = {h["id"]: (h["t"], h["src"], h["g"]) for h in app["hadith"]}
    allh.update({h["id"]: (h["text"], h["source"], h["grade"]) for h in app["sitHadith"]})
    for i in args:
        t, src, g = allh[i]
        print("\n######## %s  [%s] %s\n  APP: %s" % (i, g, src, t))
        q = toks(t.replace("…", " "))
        seen = set()
        for b, n in parse_cites(src):
            if n is not None:
                for it in coll(b).at(n): print("  cited:"); show(it); seen.add((b, it["num"]))
        for b in BOOKS:
            for c, it in coll(b).search(q, 2):
                if c >= 0.7 and (b, it["num"]) not in seen: print("  match %.2f:" % c); show(it); seen.add((b, it["num"]))
elif cmd == "ref":
    for k in range(0, len(args), 2):
        for it in coll(args[k]).at(int(args[k + 1])): show(it, full=True)
elif cmd == "find":
    books = BOOKS if args[0] == "all" else [args[0]]
    ws = toks(" ".join(args[1:])); n = 0
    for b in books:
        for it in coll(b).items:
            if all(any(t.startswith(w) or t == w for t in it["toks"]) for w in ws):
                show(it); n += 1
                if n >= 25: sys.exit(0)
elif cmd == "ayah":
    sno, names = surah_names(); q = load_quran()
    s = int(args[0]) if args[0].isdigit() else sno[norm_ar(args[0])]
    a = args[1].split("-"); a = range(int(a[0]), int(a[-1]) + 1)
    for v in a: print("%s %d:%d  %s" % (names[s - 1], s, v, q[s - 1][v - 1]))
