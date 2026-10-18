# Compact review: app text + best match number per collection (no source text). python -I build/kb/near.py <id>...
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kbsrc import *
sys.stdout.reconfigure(encoding="utf-8")
app = load_app(); allh = {h["id"]: (h["t"], h["src"], h["g"], False) for h in app["hadith"]}
allh.update({h["id"]: (h["text"], h["source"], h["grade"], bool(h.get("paraphrase"))) for h in app["sitHadith"]})
C = {b: Collection(b) for b in ["bukhari", "muslim", "abudawud", "tirmidhi", "riyad", "adab", "ahmadfull"]}
for i in sys.argv[1:]:
    t, src, g, para = allh[i]
    q = toks(t.replace("…", " "))
    best = []
    for b, c in C.items():
        for cov, it in c.search(q, 2):
            if cov >= 0.3: best.append("%s %s (%.2f)" % (b, it["num"], cov))
    print("\n## %s%s [%s] %s\n   %s\n   → %s" % (i, " (paraphrase)" if para else "", g, src, t, " · ".join(best) or "—"))
