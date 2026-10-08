<p align="center"><img src="icons/icon-192.png" width="96" alt=""></p>

<h1 align="center">Rifqat al-Uswa · رِفقة الأُسوة</h1>

<p align="center">
Describe what you are going through, and read it in the light of the Quran, the Sunnah and the Seerah.<br>
Arabic · English · Nederlands · offline · no account · no ads
</p>

<p align="center">
<a href="https://wajdim.github.io/Rif9atAlOswah/privacy.html">Privacy policy</a> ·
<a href="README-ar.txt">دليل المستخدم وسجل الإصدارات (عربي)</a> ·
<a href="build/play/README.md">Publishing to Google Play</a>
</p>

---

## What it does

The user writes freely about a situation, such as a conflict, a loss, guilt or a decision. An on-device engine then:

1. **Understands the text.** It works out the themes, feelings, relationships and safety signals, in Arabic (formal or dialect), English or Dutch.
2. **Retrieves material** from a curated library:
   - 115 Prophetic situations
   - 57 life topics
   - 201 verses
   - 149 hadith and supplications, with sources and grades
3. **Composes a reading** that links the situation to the closest Prophetic example, with practical steps.

Every quoted text comes unchanged from the library; nothing is generated.

There is also an optional **AI layer**. With the user's own Anthropic key, Claude writes a reflection that is restricted to the retrieved passages. Each AI answer has a **Report** button.

## Project layout

```
index.html, css/, fonts/, icons/   the web app (PWA, also used as-is inside every native wrapper)
js/
  app.js        UI                      rag.js     understanding + retrieval engine
  i18n.js       ar / en / nl            tts.js     read-aloud (Android native TTS / Web Speech)
  ai.js         optional Claude layer   data-*.js  content (situations, Quran, hadith, themes, translations)
build/
  android/      Android wrapper (WebView), build-android.sh → signed AAB + APK, no Gradle needed
  play/         Google Play listing (3 languages, graphics, generators) + publishing guide
  ios/          Xcode project (XcodeGen) + GitHub Actions workflow
  electron/     Windows desktop build
  i18n/         translation sources and build-en.js (→ js/data-en.js, js/data-nl.js)
  tashkeel/     Arabic diacritisation pipeline
  tests/        engine regression test
  build-all.sh  rebuilds everything into dist/
docs/           GitHub Pages: landing page + privacy policy
```

## Build

| Target | Command | Output |
|---|---|---|
| All | `TOOLS=… EBUILD=… bash build/build-all.sh` | `dist/` |
| Android (Play + sideload) | `TOOLS=… bash build/android/build-android.sh` | `build/android/out/*.aab`, `*.apk` |
| Translations | `node build/i18n/build-en.js en` / `nl` | `js/data-en.js`, `js/data-nl.js` |
| Engine test | `node build/tests/test-engine.js` | – |
| Single-file HTML | `node build/bundle-html.js dist/RifqaAlUswa.html` | – |

`TOOLS` must contain:
- `jdk/<jdk-17>/`
- `sdk/build-tools/36.0.0/`
- `sdk/platforms/android-36/`
- `bundletool/bundletool.jar`

Android signing reads `~/.rifqa-signing/signing.env`, which lives **outside the repo**. Never commit keystores; `.gitignore` blocks them.

## Sources and licences

- **Quran.** The Arabic text and the meanings come from [Tanzil.net](https://tanzil.net): Saheeh International (English) and Sofian S. Siregar (Dutch). Tanzil allows them to be used unchanged, with attribution, for non-commercial purposes.
- **Hadith.** The Arabic comes from the classical collections; the English translations are from sunnah.com. The Dutch hadith translations were made for this app from the English and are labelled as such.
- **Fonts.** Amiri and Tajawal (SIL Open Font License), bundled locally.

The app is a reflective guide. It does not issue fatwas, and it does not replace a scholar, doctor, therapist or lawyer.

## Contact

Wajdi Chaouch · wajdi.chaouche@gmail.com
