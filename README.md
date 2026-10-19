<p align="center"><img src="icons/icon-192.png" width="96" alt=""></p>

<h1 align="center">Rifqat al-Uswa · رِفقة الأُسوة</h1>

<p align="center">
Describe what you are going through, and read it in the light of the Quran, the Sunnah and the Seerah.<br>
Arabic · English · Français · Nederlands · Español · Português · اردو · Bahasa Indonesia · Türkçe · Deutsch · Bahasa Melayu · فارسی · বাংলা · offline · no account · no ads
</p>

<p align="center">
<a href="https://wajdim.github.io/Rif9atAlOswah/privacy.html">Privacy policy</a> ·
<a href="README-ar.txt">دليل المستخدم وسجل الإصدارات (عربي)</a> ·
<a href="build/play/README.md">Publishing to Google Play</a>
</p>

---

## What it does

The user writes freely about a situation, such as a conflict, a loss, guilt or a decision. An on-device engine then:

1. **Understands the text.** It works out the themes, feelings, relationships and safety signals, in Arabic (formal or dialect), English, French, Dutch, Spanish, Portuguese, Urdu, Indonesian, Turkish, German, Malay, Persian or Bengali. Crisis signals always come first.
2. **Retrieves material** from a curated library:
   - 126 Prophetic situations. 35 key Seerah events also have a "depth" layer: when it happened, what made it hard, the options, what was chosen, what was refrained from, and lessons for self, family, work and community
   - 63 life topics
   - 623 everyday life situations: the 500 of the source collection plus 123 written for topics it does not cover. They help understand the user's message and can be browsed; they are never shown as religious text
   - 322 verse entries (Tanzil text)
   - 343 hadith and supplications, with sources and grades. Every quotation is checked word by word against offline copies of its source at build time (`build/kb/`, `js/data-evidence.js`); anything that cannot be checked is not shown
3. **Writes a first reading** of 4–6 connected paragraphs (`js/reading.js`, material in `js/data-reading.js`), with no generation:
   - an opening observation specific to the situation, and the two sides of the scale taken from the user's own words
   - what each choice represents
   - the fear behind the fear
   - one or two hidden distinctions (for example, a limited income versus a lack of stability)
   - a calming close that does not decide for the user

   It addresses Arabic speakers in the feminine only when the text makes this clear. The language is calibrated, with no questions, no diagnosis and no scripture. When there is harm, the reading starts from safety; when there are crisis signals, the short safe reading is kept. Translations are in `build/i18n/reading/<lang>.json` and are merged with `node build/i18n/reading/build.js`.
4. **Builds a deeper analysis** that is not shown in the card: thinking patterns, what is and is not in the user's hands, signs worth attention, and the priority now. It goes only into the context sent to the optional AI layer. Its texts are `ANALYSIS_TEXT` and `ANALYSIS_CUES` (`js/data-themes.js`), translated in `build/i18n/analysis/`.

Every quoted text comes unchanged from the library; nothing is generated.

**Distinctions.** Some situations sit at a point where two things are easily confused: forgiveness and accepting ongoing harm, patience and passivity, reliance on Allah and inaction, humility and humiliation, justice and revenge, anger for justice and anger for pride, disagreement and severing ties, and seven more (`js/data-distinctions.js`, 14 in all). When a message stands at one of them, the result adds a card: what it is not, what it is, questions that help tell the two apart, and the evidence. The evidence is referenced by library id only, so the card can only show verified verses and hadith, plus related Seerah events. Detection uses NLU concepts, explicit phrases, or the message's main topics together with a cue phrase. No card is shown alongside crisis signals.

**Answer depth.** A switch on every result picks Brief, Standard or In depth (`js/compose.js`, remembered in the preferences):
- **Brief:** the first part of the reading, the closest situation and its evidence, one verse, one hadith, steps to start now, and one supplication.
- **Standard:** the full answer.
- **In depth:** adds, for the 35 Seerah events that have it, what made the moment hard, the options, what was chosen and what was refrained from, and lessons for one's life, plus more evidence and more situations.

Safety notices, distinctions and the limits of each example ("when does this not apply?") are kept at every depth.

**Citations.** Every verse and hadith has a "Source details" panel: the reference, the book with its number and section, the gradings recorded in the source edition, and how the text was checked. Before any quotation is shown, a validator (`COMPOSE.validate`) requires:
- a verification record in `js/data-evidence.js`;
- an accepted status;
- a fingerprint matching the exact text being shown.

The vowelled version is shown only if its letters match the verified text; otherwise the verified text is shown as it is. A narration that could not be matched against its source is named with its source, but its wording is not quoted.

**Ranking.** Topic scores combine word matches, NLU concepts, the life situations, and short natural phrases written for each topic (`build/taxonomy/theme-phrases.json`, matched but never shown). A light reranker lets a specific issue (an insult, a betrayal, a debt) come before the context it happened in (parents, marriage, work) when both are present. The weights are in `TUNE` in `js/rag.js`. They are tuned only on the development set (`node build/tests/tune.js`); the held-out set is never used for tuning.

When the engine finds no clear topic, the result offers nearby topics as buttons. Picking one re-runs the analysis focused on it (`RAG.analyze(text, {focus})`). A picked topic never overrides crisis signals and never raises the match to "strong".

**Browse life situations** (Explore → Life situations) is the other way in: 8 categories → 52 subcategories → 623 situations. Opening one runs the same reading, but with the situation's hand-classified topics and feelings instead of guessing them from the text (`RAG.analyze(text, {sit})`); the result names the subcategory and what a person in that situation usually needs, with a button to add one's own details. Search matches word forms and falls back to the topic the engine understands from the query. Labels and situation texts are in Arabic and English; the other languages show English until they are translated.

**Inspiration from the Seerah** (the mountain icon) lists those 35 events in order: Makkah, the Hijra, Madinah.
- The life-area chips (yourself, family, work, community) switch the lesson shown on each card.
- The home screen shows one event a day.
- Every event page adds the depth sections and links to similar everyday situations from the taxonomy.

**My situations** is an optional journal. "Save to My situations" keeps the user's own text on the device (`rifqa.journal` in localStorage), and the Saved screen lists it so the reading can be reopened or deleted.

There is also an optional **AI layer**. With the user's own Anthropic key, Claude writes a reflection that is restricted to the retrieved passages, and the reading card offers "Write a deeper reading with AI", which uses its own system prompt (`READING_SYSTEM` in `js/ai.js`). Each AI answer has a **Report** button.

## Quality and measurements

The runtime makes no network request except the optional AI layer and recitation streaming, which the user turns on. Every figure below can be reproduced with the commands in [Build](#build).

**Understanding** (`build/tests/bench.js`):

| set | messages | top-1 topic | top-3 | emotions | evidence |
|---|---|---|---|---|---|
| main (regression gate) | 355 | 97.8% | 99.7% | 100% | 99.4% |
| development (used for tuning) | 159 | 75.6% | 86.5% | 78.8% | 91.1% |
| held-out (never tuned on) | 121 | 57.5% | 69.0% | 73.6% | 80.5% |

The held-out set is the honest estimate for messages unlike anything the engine was built around. Crisis and self-harm detection is a separate gate (`test-understanding.js`) and must always pass.

**Evidence** (`build/kb/REPORT.md`, `test-evidence.js`, `test-compose.js`):
- 914 quotations are checked word for word against offline copies of their sources.
- Five hadith that cannot be checked are hidden.
- The citation validator rejects any text that differs from what was verified.

**Source collection**: all 500 situations match the PDF of «500 موقف من الحياة» (`build/taxonomy/PDF-PARITY.md`).

**Speed** (`build/tests/perf.js`, Node on a desktop):
- Analysing a message takes a median of 9 ms (p95 32 ms).
- Composing an answer takes under 1 ms.
- With the CPU slowed 4× in Chrome (roughly a mid-range phone), a message takes about 70 ms, and a re-render 35–135 ms.

The engine's indexes are warmed up just after the page appears, so the first search is as fast as the next ones.

## Project layout

```
index.html, css/, fonts/, icons/   the web app (PWA, also used as-is inside every native wrapper)
js/
  app.js        UI                      rag.js     understanding + retrieval engine
  i18n.js      13 languages             tts.js     read-aloud, 26 reciters, offline recitations (Android)
  ai.js         optional Claude layer   data-*.js  content (situations, Quran, hadith, themes, translations)
  data-life.js  500 everyday situations, each hand-mapped to 1-3 topics (text identical to the source collection)
  data-taxonomy.js  GENERATED: categories, needs, and per situation: subcategory, feelings, needs, English text,
                user phrases (Arabic incl. dialects + English); plus situations 501+ (see build/taxonomy/)
  nlu.js        pre-understanding: Arabizi → Arabic, English spelling, concepts, safety tiers, vague distress
  data-nlu.js   its data: multilingual/dialect concepts, crisis and soft-risk phrases and rules (never shown)
  compose.js    answer depth (brief / standard / in depth) and the citation validator
  data-distinctions.js  14 distinctions (forgiveness vs. ongoing harm, patience vs. passivity…): text in ar/en, evidence by library id, detection rules
build/
  android/      Android wrapper (WebView), build-android.sh → signed AAB + APK, no Gradle needed
  play/         Google Play listing (13 languages, graphics, generators) + publishing guide
  i18n/         translation sources and build-en.js (→ js/data-<lang>.js)
  tashkeel/     Arabic diacritisation pipeline
  taxonomy/     situation taxonomy sources (taxonomy.json, life-NN.tsv, extra.tsv) and build.js (validates → js/data-taxonomy.js)
  tests/        engine regression test + understanding/safety quality gate (fixtures/understanding.json)
  kb/           evidence pipeline: source download, verification of every quotation, adding verses/hadith from the sources
  rag/          standalone Python importer and notes for the Arabic situations corpus (not shipped in the app)
  build-all.sh  rebuilds everything into dist/
docs/           GitHub Pages: landing page, interactive user guide (guide.html), privacy policy
```

## Build

| Target | Command | Output |
|---|---|---|
| All (web, HTML, Android) | `TOOLS=… bash build/build-all.sh` | `dist/` |
| Android (Play + sideload) | `TOOLS=… bash build/android/build-android.sh` | `build/android/out/*.aab`, `*.apk` |
| Translations | `node build/i18n/build-en.js <en|nl|es|pt|fr|ur|id|tr|de|ms|fa|bn>` | `js/data-<lang>.js` |
| Translation check | `node build/i18n/check-lang.js es` | completeness report |
| Engine test | `node build/tests/test-engine.js` | – |
| Understanding and safety gate | `node build/tests/test-understanding.js [-v]` | fails if crisis detection or topic accuracy regresses |
| Benchmark (355 messages, dialects, Arabizi, typos…) | `node build/tests/bench.js [-v] [--gate]` | per-dimension scores; `--gate` fails on regression |
| Development benchmark (159 messages, used for tuning) | `node build/tests/bench.js --set dev [-v]` | per-dimension scores |
| Weight tuning (dev set only, main set may not drop more than one message) | `node build/tests/tune.js` | prints the best `TUNE` values for `js/rag.js` |
| Held-out benchmark (never tuned on) | `node build/tests/bench.js --set holdout [-v]` | measures generalisation |
| Situation taxonomy | `node build/taxonomy/build.js [--check]` | validates the TSV sources and writes `js/data-taxonomy.js` |
| Taxonomy test | `node build/tests/test-taxonomy.js [-v]` | browse consistency, no crisis false alarms, phrase understanding |
| Evidence verification | `python -I build/kb/verify.py --write` (sources: `build/kb/fetch.py`) | `build/kb/REPORT.md`, `js/data-evidence.js` |
| Seerah layer | `python -I build/kb/build-seerah.py` (sources `build/kb/seerah/*.json`) + `node build/tests/test-seerah.js` | `js/data-seerah-kb.js` |
| Evidence integrity test | `node build/tests/test-evidence.js` | every quotation verified for exactly the text that ships |
| Offline guarantee | `node build/tests/test-offline.js` | network APIs only in the opt-in `ai.js` and `tts.js`; CSP allows no other host |
| Engine speed | `node build/tests/perf.js [--budget]` | load, first analysis, median/p95 per message; `--budget` fails above 40 ms median / 120 ms p95 |
| Source-collection parity | `python -I build/taxonomy/pdf-parity.py [--write]` (needs PyMuPDF) | `build/taxonomy/PDF-PARITY.md` |
| Answer composer and citation validator | `node build/tests/test-compose.js` | every message × 3 depths: no citation dropped, depths graded, altered/unknown/unverified texts rejected |
| Distinctions test | `node build/tests/test-distinctions.js` | evidence ids in the verified library, ar/en complete, detection and false alarms |
| Single-file HTML | `node build/bundle-html.js dist/RifqaAlUswa.html` | – |

`TOOLS` must contain:
- `jdk/<jdk-17>/`
- `sdk/build-tools/36.0.0/`
- `sdk/platforms/android-36/`
- `bundletool/bundletool.jar`

Android signing reads `~/.rifqa-signing/signing.env`, which lives **outside the repo**. Never commit keystores; `.gitignore` blocks them.

## Sources and licences

- **Quran.** The Arabic text and the meanings come from [Tanzil.net](https://tanzil.net): Saheeh International (English), Sofian S. Siregar (Dutch), Julio Cortés (Spanish), Samir El-Hayek (Portuguese), Muhammad Hamidullah (French), Fateh Muhammad Jalandhry (Urdu), the Indonesian Ministry of Religious Affairs (Indonesian), Diyanet İşleri (Turkish), A. S. F. Bubenheim and N. Elyas (German), Abdullah Muhammad Basmeih (Malay), Mohammad Mahdi Fooladvand (Persian) and Muhiuddin Khan (Bengali). Tanzil allows them to be used unchanged, with attribution, for non-commercial purposes.
- **Hadith.** The Arabic comes from the classical collections; the English translations are from sunnah.com. The French, Dutch, Spanish, Portuguese, Urdu, Indonesian, Turkish, German, Malay, Persian and Bengali hadith translations were made for this app from the English and are labelled as such.
- **Recitations.** Streamed from [everyayah.com](https://everyayah.com). In the Android app a reciter can be downloaded for offline listening: only the ~300 verses the app recites are fetched, into the app's private storage.
- **Fonts.** Amiri and Tajawal (SIL Open Font License), bundled locally. The font choice in Settings is backed by bundled free equivalents so it works on every device: Arimo and Tinos (Apache 2.0, metric-compatible with Arial and Times New Roman), Noto Sans, Noto Sans Arabic, Noto Naskh Arabic and Scheherazade New (SIL OFL). Andalus is a Microsoft font and is not bundled: it is used when installed, otherwise Scheherazade New. Quranic text always stays in Amiri.

The app is a reflective guide. It does not issue fatwas, and it does not replace a scholar, doctor, therapist or lawyer.

## Contact

Wajdi Chaouch · wajdi.chaouche@gmail.com
