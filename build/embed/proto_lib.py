"""Shared by proto.py and fusion.py: tokenizer, embeddings, anchors, kNN theme votes."""
import json, os, sys, numpy as np
from tokenizers import Tokenizer
from safetensors.numpy import load_file
H = os.path.dirname(os.path.abspath(__file__)); R = os.path.join(H, "..", "..")
tok = Tokenizer.from_file(os.path.join(H, "model", "tokenizer.json"))
E = load_file(os.path.join(H, "model", "model.safetensors"))["embeddings"]
SPECIAL = {0, 1, 2, 3}
# SIF weights from the unigram log-probabilities: frequent pieces («▁my», «▁ما», «▁») count less
_V = json.load(open(os.path.join(H, "model", "tokenizer.json"), encoding="utf-8"))["model"]["vocab"]
SIF_A = float(os.environ.get("SIF_A", "1e-4"))
P = np.exp(np.array([sc for _, sc in _V], np.float64))
W = (SIF_A / (SIF_A + P)).astype(np.float32)
PUNCT = {i for i, (piece, _) in enumerate(_V) if not any(ch.isalnum() for ch in piece.replace("▁", ""))}
def embed(texts):
    out = np.zeros((len(texts), E.shape[1]), np.float32)
    for i, enc in enumerate(tok.encode_batch(texts, add_special_tokens=False)):
        ids = [x for x in enc.ids if x not in SPECIAL and x not in PUNCT]
        if ids:
            w = W[ids] if SIF_A > 0 else np.ones(len(ids), np.float32)
            v = (E[ids] * w[:, None]).sum(0); out[i] = v / (np.linalg.norm(v) + 1e-9)
    return out
A = json.load(open(os.path.join(H, "anchors.json"), encoding="utf-8"))
texts, owner = [], []   # owner: list of (theme, weight)
for tid, langs in A["themes"].items():
    for l, d in langs.items():
        texts.append(d["label"]); owner.append([(tid, 1.0)])
        for tr in d["triggers"]: texts.append(tr); owner.append([(tid, 1.0)])
for x in A["life"]:
    texts.append(x["t"]); owner.append([(t, 1.0 if i == 0 else 0.7) for i, t in enumerate(x["th"])])
for tid, lst in A.get("exemplars", {}).items():
    for t in lst: texts.append(t); owner.append([(tid, 1.0)])
_seen = {}; _t2, _o2 = [], []
for t_, o_ in zip(texts, owner):
    k_ = " ".join(t_.lower().split())
    if k_ in _seen:
        j_ = _seen[k_]; have = {a for a, _ in _o2[j_]}; _o2[j_] += [(a, w) for a, w in o_ if a not in have]
    else: _seen[k_] = len(_t2); _t2.append(t_); _o2.append(list(o_))
texts, owner = _t2, _o2
M = embed(texts); print("anchors", len(texts))
def knn(q, k=12):
    s = M @ q; top = np.argsort(-s)[:k]; vote = {}
    for i in top:
        for t, w in owner[i]: vote[t] = vote.get(t, 0) + w * float(s[i])
    return sorted(vote.items(), key=lambda x: -x[1])
