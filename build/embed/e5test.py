"""Same evaluation with a transformer encoder (multilingual-e5-small, int8 ONNX). Build-time experiment only.
Usage: build/embed/.venv/Scripts/python -I build/embed/e5test.py"""
import json, os, sys, time, numpy as np, onnxruntime as ort
from tokenizers import Tokenizer
sys.stdout.reconfigure(encoding="utf-8")
H = os.path.dirname(os.path.abspath(__file__)); D = os.path.join(H, "model-e5")
tok = Tokenizer.from_file(os.path.join(D, "tokenizer.json")); tok.enable_truncation(128)
sess = ort.InferenceSession(os.path.join(D, "onnx", "model_quantized.onnx"), providers=["CPUExecutionProvider"])
names = [i.name for i in sess.get_inputs()]
def embed(texts, prefix):
    out = []
    for i in range(0, len(texts), 64):
        encs = tok.encode_batch([prefix + t for t in texts[i:i + 64]]); L = max(len(e.ids) for e in encs)
        ids = np.array([e.ids + [1] * (L - len(e.ids)) for e in encs], np.int64)
        mask = np.array([[1] * len(e.ids) + [0] * (L - len(e.ids)) for e in encs], np.int64)
        feed = {"input_ids": ids, "attention_mask": mask}
        if "token_type_ids" in names: feed["token_type_ids"] = np.zeros_like(ids)
        h = sess.run(None, feed)[0]; v = (h * mask[..., None]).sum(1) / mask.sum(1, keepdims=True)
        out.append(v / np.linalg.norm(v, axis=1, keepdims=True))
    return np.vstack(out)
A = json.load(open(os.path.join(H, "anchors.json"), encoding="utf-8"))
texts, owner, kinds = [], [], []
for tid, lst in A["exemplars"].items():
    for t in lst: texts.append(t); owner.append([(tid, 1.0)]); kinds.append("exemplar")
for tid, langs in A["themes"].items():
    for l in ("ar", "en"):
        texts.append(langs[l]["label"]); owner.append([(tid, 1.0)]); kinds.append("label")
for x in A["life"]:
    texts.append(x["t"]); owner.append([(t, 1.0 if i == 0 else 0.7) for i, t in enumerate(x["th"])]); kinds.append("life")
t0 = time.time(); M = embed(texts, "query: "); print(f"anchors {len(texts)} embedded in {time.time()-t0:.1f}s")
kinds = np.array(kinds)
S = json.load(open(os.path.join(H, "engine-scores.json"), encoding="utf-8"))
def knn(q, k, mask):
    s = np.where(mask, M @ q, -9); top = np.argsort(-s)[:k]; vote = {}
    for i in top:
        for t, w in owner[i]: vote[t] = vote.get(t, 0) + w * float(s[i])
    return sorted(vote.items(), key=lambda x: -x[1])
for name in ["benchmark.tsv", "benchmark-holdout.tsv"]:
    rows = [r for r in S[name] if "crisis" not in r["flags"] and "vague" not in r["flags"]]
    t0 = time.time(); Q = embed([r["prepared"] for r in rows], "query: "); dt = (time.time() - t0) / len(rows) * 1000
    for mname, mask in [("exemplar+label", kinds != "life"), ("all", np.ones(len(kinds), bool))]:
        sem_ok = rr_ok = 0
        for r, q in zip(rows, Q):
            lex = r["themes"]; sem = knn(q, 10, mask)
            sem_ok += bool(sem) and sem[0][0] in r["accept"]
            if not lex: top = sem[0][0] if sem else None
            else:
                semd = dict(sem); cand = lex[:3]; best = cand[0][1]; mx = max(semd.values(), default=1)
                top = max(cand + [(t, 0) for t, _ in sem[:1] if lex[0][1] < 3.0], key=lambda x: x[1] / best + 0.5 * semd.get(x[0], 0) / mx)[0]
            rr_ok += top in r["accept"]
        print(f"{name:22} {mname:15} semantic-only {100*sem_ok/len(rows):.1f}   fused {100*rr_ok/len(rows):.1f}   ({dt:.1f} ms/query on desktop CPU)")
if len(sys.argv) > 1:
    for q, v in zip(sys.argv[1:], embed(sys.argv[1:], "query: ")):
        s = M @ v; top = np.argsort(-s)[:5]
        print("\n>>", q); [print(f"   {s[i]:.3f} {owner[i][0][0]:13} {texts[i][:70]}") for i in top]
