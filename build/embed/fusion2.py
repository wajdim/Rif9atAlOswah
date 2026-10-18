"""Fusion strategies + anchor-type ablation. Usage: build/embed/.venv/Scripts/python -I build/embed/fusion2.py"""
import json, os, sys, numpy as np
sys.stdout.reconfigure(encoding="utf-8")
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "proto_lib.py"), encoding="utf-8").read())
S = json.load(open(os.path.join(H, "engine-scores.json"), encoding="utf-8"))
EX = {" ".join(t.lower().split()) for l in A.get("exemplars", {}).values() for t in l}
LIFE = {" ".join(x["t"].lower().split()) for x in A["life"]}
LABELS = {" ".join(d["label"].lower().split()) for langs in A["themes"].values() for d in langs.values()}
def kind(t):
    k = " ".join(t.lower().split())
    return "exemplar" if k in EX else "life" if k in LIFE else "label" if k in LABELS else "trigger"
kind_of = np.array([kind(t) for t in texts])
def knn_mask(q, k, mask):
    s = np.where(mask, M @ q, -9); top = np.argsort(-s)[:k]; vote = {}
    for i in top:
        for t, w in owner[i]: vote[t] = vote.get(t, 0) + w * float(s[i])
    return sorted(vote.items(), key=lambda x: -x[1])
def run(name, strat, mask, k=10, thr=3.0):
    rows = [r for r in S[name] if "crisis" not in r["flags"] and "vague" not in r["flags"]]
    Q = embed([r["prepared"] for r in rows]); ok = 0
    for r, q in zip(rows, Q):
        lex = r["themes"]; sem = knn_mask(q, k, mask)
        if strat == "sem": top = sem[0][0] if sem else None
        elif strat == "fallback": top = lex[0][0] if lex and lex[0][1] >= thr else (sem[0][0] if sem else (lex[0][0] if lex else None))
        elif strat == "rrf":
            sc = {}
            for rank, (t, _) in enumerate(lex): sc[t] = sc.get(t, 0) + 1 / (3 + rank)
            for rank, (t, _) in enumerate(sem[:5]): sc[t] = sc.get(t, 0) + 0.6 / (3 + rank)
            top = max(sc, key=sc.get) if sc else None
        elif strat == "rerank":   # semantic only reorders the lexical top-3, or fills in when lexical is empty
            if not lex: top = sem[0][0] if sem else None
            else:
                semd = dict(sem); cand = lex[:3]; best = cand[0][1]
                top = max(cand, key=lambda x: x[1] / best + 0.5 * semd.get(x[0], 0) / max(1e-9, max(semd.values(), default=1)))[0]
        ok += top in r["accept"]
    return ok / len(rows)
masks = {"all": np.ones(len(kind_of), bool), "life": kind_of == "life", "trigger": kind_of == "trigger", "label+trigger": (kind_of == "label") | (kind_of == "trigger"), "life+label": (kind_of == "life") | (kind_of == "label"), "exemplar": kind_of == "exemplar", "exemplar+label": (kind_of == "exemplar") | (kind_of == "label"), "exemplar+label+trigger": kind_of != "life"}
for mname, m in masks.items():
    print(f"{mname:14} sem-only main {100*run('benchmark.tsv','sem',m):.1f} holdout {100*run('benchmark-holdout.tsv','sem',m):.1f}")
for strat in ["fallback", "rrf", "rerank"]:
    for mname in ["all", "exemplar", "exemplar+label", "exemplar+label+trigger"]:
        print(f"{strat:8} {mname:14} main {100*run('benchmark.tsv',strat,masks[mname]):.1f} holdout {100*run('benchmark-holdout.tsv',strat,masks[mname]):.1f}")
