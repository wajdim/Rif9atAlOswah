# Situation taxonomy

Sources for `js/data-taxonomy.js`, which is generated from these files. Never edit the generated file by hand.

| File | Content |
|---|---|
| `taxonomy.json` | 8 categories → 52 subcategories (Arabic and English labels, usual themes), and the "needs" vocabulary |
| `life-NN.tsv` | one row per situation 1–500 of «500 موقف من الحياة»: `n, sub, em, need, en, ph_ar, ph_en` |
| `extra.tsv` | situations written for this app (n ≥ 501), for themes the collection does not cover: `n, sub, th, em, need, t, en, ph_ar, ph_en` |
| `build.js` | validates everything and writes `js/data-taxonomy.js` (`--check` validates only and fails if the generated file is stale) |
| `pdf-parity.py` | checks situations 1–500 in `js/data-life.js` against the source PDF (`docs/500-life-situations-arabic.pdf`, not in git): presence, text and section. Writes `PDF-PARITY.md` with `--write`. Needs PyMuPDF at build time only |
| `PDF-PARITY.md` | last parity report: 500/500 found, 500 identical |
| `draft.js` | prints a first-guess subcategory for a range of situations, as a helper when writing rows |

Columns:
- `sub` is `category.subcategory`, as in `taxonomy.json`.
- `em` holds emotion ids from `EMOTION_LEXICON` in `js/data-themes.js`. The first one is the main emotion.
- `need` holds ids from `needs` in `taxonomy.json`.
- `th` (only in `extra.tsv`) holds theme ids. The first one is the main theme. For situations 1–500 the themes stay in `js/data-life.js`.
- `ph_ar` and `ph_en` are a first-person sentence someone might actually type. The Arabic one is often in dialect (Tunisian, Gulf, Egyptian, Levantine, Moroccan).

Rules:
- The text of situations 1–500 stays identical to the source collection. Only the enrichment lives here.
- No Qur'an, hadith or Seerah text appears here. A situation reaches evidence only through its themes, and their sources are verified elsewhere.
- Phrases must not read as a crisis message. `build/tests/test-taxonomy.js` checks this.
- New content is written in Arabic and English first. The other languages fall back to English until they are translated.

After editing:
```bash
node build/taxonomy/build.js
node build/tests/test-taxonomy.js
node build/tests/bench.js --gate
node build/tests/bench.js --set holdout
```
