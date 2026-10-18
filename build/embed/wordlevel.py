"""Word-level soft lexicon: each content word of the message votes for the theme of its nearest
trigger word (static embeddings are strongest at word level). Fused with the lexical engine.
Usage: build/embed/.venv/Scripts/python -I build/embed/wordlevel.py"""
import json, os, re, sys, itertools, numpy as np
sys.stdout.reconfigure(encoding="utf-8")
os.environ["SIF_A"] = "0"
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "proto_lib.py"), encoding="utf-8").read())
S = json.load(open(os.path.join(H, "engine-scores.json"), encoding="utf-8"))
# single-word triggers only (all languages), each owned by its theme(s)
TW, TO = [], []
for t, o in zip(texts, owner):
    if len(t.split()) == 1 and len(t) >= 3: TW.append(t); TO.append(o)
TM = embed(TW); print("trigger words", len(TW))
STOP = set("""i me my myself we our you your he him his she her it its they them their what which who this that these those am is are was were be been being have has had do does did
a an the and but if or because as until while of at by for with about against between into through during before after above below to from up down in out on off over under again further then
once here there when where why how all any both each few more most other some such no nor not only own same so than too very can will just don should now feel feeling really always never
someone something anything everything nothing anyone everyone nobody lately today still even get got make made much many one also like know want think time day keep thing things
من في على الى إلى عن مع هو هي انا أنا انت أنت هم نحن ثم او أو لا لم لن ما ماذا هذا هذه ذلك تلك كل كان كانت قد لقد بعد قبل عند حتى إذا اذا لكن ولكن أن ان إن انه أنه التي الذي الذين كيف لماذا هل
شيء أي اي جدا جدًا كثيرا دائما دائمًا اليوم الآن وانا وأنا ولا وما فيه فيها منه منها عليه عليها لي لك له لها بي به بها""".split())
def words(t): return [w for w in re.findall(r"[\w؀-ۿ']+", t.lower()) if len(w) >= 3 and w not in STOP and not w.isdigit()]
def word_votes(text, tau, cap):
    ws = list(dict.fromkeys(words(text)));
    if not ws: return {}
    V = embed(ws); sims = V @ TM.T; votes = {}
    for i, w in enumerate(ws):
        j = int(np.argmax(sims[i])); s = float(sims[i, j])
        if s < tau: continue
        for th, wt in TO[j]: votes[th] = min(cap, votes.get(th, 0) + wt * (s - tau) / (1 - tau) * 3)
    return votes
cache = {}
for name in S:
    for r in S[name]: cache[r["prepared"]] = None
def run(name, tau, cap, w):
    ok = n = 0
    for r in S[name]:
        if "crisis" in r["flags"] or "vague" in r["flags"]: continue
        key = (r["prepared"], tau, cap)
        if key not in cache: cache[key] = word_votes(r["prepared"], tau, cap)
        lex = dict(r["themes"]); wv = cache[key]
        ids = set(lex) | set(wv)
        top = max(ids, key=lambda t: lex.get(t, 0) + w * wv.get(t, 0)) if ids else None
        n += 1; ok += top in r["accept"]
    return ok / n
print("lexical only: main %.1f holdout %.1f" % (100 * run("benchmark.tsv", 0.99, 1, 0), 100 * run("benchmark-holdout.tsv", 0.99, 1, 0)))
rows = []
for tau, cap, w in itertools.product([0.55, 0.65, 0.75], [1.5, 3], [0.5, 1, 2]):
    rows.append((run("benchmark.tsv", tau, cap, w), run("benchmark-holdout.tsv", tau, cap, w), tau, cap, w))
for m, h, tau, cap, w in sorted(rows, reverse=True)[:12]: print(f"tau={tau} cap={cap} w={w}: main {100*m:.1f} holdout {100*h:.1f}")
best = max(rows); print("chosen on MAIN only → holdout %.1f" % (100 * best[1]))
