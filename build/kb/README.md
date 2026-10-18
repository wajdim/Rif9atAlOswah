# Evidence knowledge base: verification pipeline

The rule: the app quotes no verse or hadith that hasn't been checked word by word against a stored copy of its source.
This pipeline runs at build time and needs internet only to download the sources. The app itself never reads these files.

## Sources (downloaded into `cache/`, which git ignores)

| Corpus | Used for | From |
|---|---|---|
| Qur'an, Tanzil *quran-simple* | verses | `build/tashkeel/cache/quran-simple.json` |
| al-Bukhari, Muslim, Abu Dawud, al-Tirmidhi, al-Nasa'i, Ibn Majah, al-Muwatta', al-Nawawi's 40, 40 Qudsi | text, number, book, graders' verdicts, English | [fawazahmed0/hadith-api](https://github.com/fawazahmed0/hadith-api) `@1` (jsDelivr) |
| al-Adab al-Mufrad, Riyad al-Salihin, Mishkat, Bulugh al-Maram, al-Shama'il, al-Darimi; Arabic book names | text, book names | [AhmedBaset/hadith-json](https://github.com/AhmedBaset/hadith-json) (sunnah.com) |
| Musnad Ahmad (complete) | text only (its numbering differs from the printed edition) | [Open-Hadith-Data](https://github.com/mhashim6/Open-Hadith-Data) |

**Numbering.** Citations follow the sunnah.com reference numbers carried by hadith-api: Fath al-Bari for al-Bukhari, and Muhammad Fu'ad Abd al-Baqi for Muslim. Other numbering schemes, such as Sakhr's, do appear in older references. The app used to mix them; it now uses this one, so any number can be re-checked mechanically.

Known caveats in the sources:
- **Muslim:** the dataset's Abd al-Baqi labels slip by one item at some chapter boundaries. For example, «الدنيا متاع» is labelled 715.11 but is Muslim 1467. A Muslim citation is therefore accepted when the text sits within ±1 label or 2 positions of the cited number.
- **al-Adab al-Mufrad:** sunnah.com's numbers run about 2 off the printed edition. Only the text's presence is checked, not the number.
- **Musnad Ahmad:** only the text's presence is checked.

## Steps

```bash
python -I build/kb/fetch.py                # download sources into build/kb/cache/ (once)
python -I build/kb/candidates.py           # hadith candidates from Riyad al-Salihin (working list, not committed)
python -I build/kb/build-hadith.py         # hadith-add-*.tsv → js/data-hadith-kb.js
python -I build/kb/build-quran.py          # quran-add-*.tsv → js/data-quran-kb.js
python -I build/kb/verify.py --write       # audit everything → REPORT.md, report.json, js/data-evidence.js
python -I build/kb/vocalize.py             # vowel marks from the source for texts whose marks are missing
node build/tashkeel/build-tashkeel.js      # → js/data-tashkeel.js (refuses any marks whose letters differ)
node build/tests/test-evidence.js          # fingerprints: no quoted text changed since it was verified
```

Review helpers: `show.py id <app id>`, `show.py ref <book> <num>`, `show.py find <book|all> <words>`, `show.py ayah <surah> <ayah>`, and `near.py <id>…` for the best match number per collection.

## Adding verses and hadith

All new texts come from the sources. No sacred text is typed by hand.

**Hadith.** Write rows in `hadith-add-*.tsv`, then run `python -I build/kb/build-hadith.py`.
- Candidates come from `candidates.py`: al-Nawawi's *Riyad al-Salihin*, each matched to its primary collection. Only al-Bukhari, Muslim, or a sahih/hasan verdict by al-Albani qualifies, and hadith already in the app are skipped.
- The excerpt is cut from the primary collection's text, not from Riyad's copy. It is the most compact span that matches the Riyad quote. When the quote alone is not a complete sentence, explicit `from`/`to` words are given.
- The narrator named in the row must appear in the source narration. This check caught two wrong attributions in the first batch.
- The English translation (`te`) is written for this app from the verified Arabic. Grades are al-Bukhari/Muslim = sahih, otherwise al-Albani's verdict from the source edition.
- Outputs: `js/data-hadith-kb.js`, `build/i18n/content/hadith-kb.json`, and the source's own vowel marks in `build/tashkeel/hadith-tashkeel-kb.json`.

**Verses.** Write rows in `quran-add-*.tsv` (reference, expected words, themes, notes), then run `python -I build/kb/build-quran.py`.
- The text is pulled from Tanzil.
- The expected words must be present, which catches a wrong verse number.
- A verse already in the library is refused.
- Meanings in every language come from the full Tanzil translations. Only the notes need translating.

Content added this way appears in English in the other 11 languages until it is translated (`build-en.js` falls back to `content/*-kb.json`).

After any change: `verify.py --write`, then `build-tashkeel.js`, `build-en.js <lang>` for each language, and the tests.

## Statuses (in `js/data-evidence.js`)

| Status | Meaning | In answers? |
|---|---|---|
| Qur'an `verified` / `excerpt` | whole verses, or part of the cited verses, letter-for-letter as in Tanzil | yes |
| hadith `source` | the quoted words appear, in order (≥ 80% of words), in the cited book at the cited number | yes |
| hadith `secondary` | found only in a compilation that quotes the book (Riyad, Mishkat, Bulugh) | yes |
| hadith `summary` | a summary, shown as «بالمعنى لا باللفظ», of a narration found at the cited number | yes, labelled |
| hadith `unverified` | in no offline source (al-Tabarani, Ibn Hibban, al-Hakim…) | **no**: kept in the data, removed at load time |

The narrator's framing («عن فلان قال: قال رسول الله ﷺ:») is the app's own wording. Matching scores the quoted words separately, so that framing is not counted against the quotation.

## First audit (2026-10-18)

- **Qur'an:** 307 quotations, all letter-exact against Tanzil (132 of them partial-verse excerpts). One verse range was wrong (Taha 25 → 25-28).
- **Hadith:** 264 quotations. Fixes made:
  - 7 citation numbers: istikhara 1162 → 1166, Ibrahim's death 1220 → 1303, Ghawrath now also cites Bukhari 2910.
  - 2 texts replaced by the source's exact wording: h-barrakt (al-Muwatta' 1711) and Anas's ten years of service (Bukhari 6038).
  - 4 descriptions of long stories (al-Hudaybiyyah, the Ifk, Ka'b ibn Malik, Mu'adh's long prayer) rewritten as labelled summaries that quote the source.
- **Unverifiable:** 5 hadith (al-Tabarani, Ibn Hibban, al-Hakim, Abu Ya'la). 4 of them are removed from answers. The 5th is the reference for Zayd ibn Sa'nah's story; it stays with a visible "not machine-checked" label.

`fix-audit-1.py` and `fix-audit-1-te.py` record exactly what was changed, including the translations of the changed texts in all 12 languages.

## First expansion (2026-10-19)

- **198 hadith** from al-Bukhari, Muslim, Abu Dawud, al-Tirmidhi, al-Nasa'i and Ibn Majah, selected through Riyad al-Salihin. Hadith shown in the app: 145 → 343.
- **121 verse entries** from Tanzil. Verse entries: 201 → 322.
- **Coverage:** chosen for life situations the library covered thinly, such as grief and the loss of a child, debt, rumours and sharing unchecked news, privacy, unpaid wages, favouritism, wishing for death, unanswered prayer, relatives of another faith, leadership and the limits of obedience.
- **Corrections** made by the checks during the build: two narrator attributions (Bukhari 6439 is Anas's, and 4330 is ʿAbdullah ibn Zayd's) and one narrator for Muslim 2958 (ʿAbdullah ibn al-Shikhkhir).
