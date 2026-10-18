# Semantic layer experiment (build-time only, nothing here ships)

Question: does an on-device embedding model improve situation understanding enough to justify its size?
Measured on the held-out benchmark (`build/tests/fixtures/benchmark-holdout.tsv`, 113 scored messages, never tuned on).
The main benchmark (`benchmark.tsv`) was used only to choose settings.

| Setup | Size in app | Held-out top-1 |
|---|---|---|
| Lexical engine + `js/nlu.js` (shipped) | 0 | **55.8%** |
| + static model2vec `potion-multilingual-128M`, sentence kNN, best fusion | ~5–8 MB | 58.4% |
| + same model, word-level "soft lexicon" | ~5–8 MB | 54.9% |
| + transformer `multilingual-e5-small` (int8 ONNX), best fusion | ~118 MB + ~10 MB runtime | 60.2% |
| Semantic only (no lexical engine), e5-small | | 36–40% |

One held-out message is 0.9 points, and the standard error at n=113 is about ±4.6 points.

**Decision: no embedding model ships.** The best gain (+4.4 points) is within one standard error and would cost about 128 MB.
Both models place most emotional first-person sentences close together. They separate "sad" from "about money",
but not betrayal from slander from heartbreak, which are exactly the distinctions this app needs.
The gains come from curated understanding data (concepts, dialect vocabulary, user phrases per situation) instead.

What we keep:
- `exemplars.json`: natural first-person phrases per theme (Arabic, including dialects, and English). They feed the
  situation taxonomy as "possible user phrases".
- The scripts, so the experiment can be re-run when a better small multilingual model appears.

## Re-running

```bash
python -m venv build/embed/.venv
build/embed/.venv/Scripts/python -m pip install numpy safetensors tokenizers huggingface_hub onnxruntime
# models (git-ignored): minishlab/potion-multilingual-128M → build/embed/model,
#                       Xenova/multilingual-e5-small (onnx/model_quantized.onnx, tokenizer.json) → build/embed/model-e5
node build/embed/export-anchors.js      # anchors.json: theme labels/triggers (13 languages), 500 life situations, exemplars
node build/embed/export-engine.js       # engine-scores.json: lexical engine output for every benchmark row
build/embed/.venv/Scripts/python -I build/embed/fusion2.py      # static model: anchor ablation + fusion strategies
build/embed/.venv/Scripts/python -I build/embed/wordlevel.py    # static model: word-level soft lexicon
build/embed/.venv/Scripts/python -I build/embed/e5test.py       # transformer encoder
```

Notes: e5 needs the `query: ` prefix on both sides for sentence-to-sentence similarity (`passage: ` on the anchors gives
meaningless neighbours). SIF weighting does not help the model2vec model (its vectors are already frequency-weighted).
