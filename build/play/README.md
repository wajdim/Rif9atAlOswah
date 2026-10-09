# Publishing Rifqat al-Uswa on Google Play

Everything needed for the Play Console is in this folder. This guide walks through it in order and gives the exact answer for every form.

| | |
|---|---|
| Package name | `com.rifqa.aluswa` (permanent; cannot change after the first upload) |
| Version | 2.6.0 (version code 10) |
| Target / min SDK | 36 (Android 16) / 24 (Android 7.0) |
| Upload file | `build/android/out/RifqaAlUswa-2.6.0.aab` |
| Privacy policy | https://wajdim.github.io/Rif9atAlOswah/privacy.html |
| Support email | wajdi.chaouche@gmail.com |

---

## 1. One-time setup

1. **Developer account.** Create one at https://play.google.com/console ($25 one-time fee, plus identity verification).
2. **Signing key.** Your upload key is in `%USERPROFILE%\.rifqa-signing\`.
   - It is **not** in the repo, and it must never be committed.
   - Back up that folder now, in a password manager and an offline copy.
   - When you create the app, keep **Play App Signing** on (the default). Google then holds the real app-signing key, and this upload key only proves that uploads come from you. If the upload key is ever lost, Google can reset it.
3. **GitHub Pages**, which hosts the privacy policy.
   1. Go to the repo's Settings → Pages → Build and deployment.
   2. Choose **Deploy from a branch**, branch `main`, folder `/docs`.
   3. Wait about a minute, then open the policy URL above to check it works.

## 2. Build

```bash
# tools folder: jdk/, sdk/build-tools/36.0.0, sdk/platforms/android-36, bundletool/bundletool.jar
TOOLS=/path/to/tools bash build/android/build-android.sh
```

This produces two files:
- **`RifqaAlUswa-2.6.0.aab`**, which you upload to Play.
- **`RifqaAlUswa-2.6.0.apk`**, for installing directly (sideloading).

Before every release, bump `VERSION_NAME`/`VERSION_CODE` in `build-android.sh`, and `APP_VERSION` in `js/app.js`.

To regenerate the store graphics, run `npm i -D playwright`, then serve the project root on port 8765 and run:

```bash
node build/play/gen-icons.js            # launcher icons (all densities, adaptive, themed) + 512px store icon
node build/play/gen-feature-graphic.js  # 1024×500 feature graphic ×5 languages
node build/play/gen-screenshots.js      # 7 phone screenshots ×5 languages (1080×1920)
python build/play/listing-text.py       # listing texts + length check
```

## 3. Create the app

In Play Console, choose **Create app**:
- App name: *Rifqat al-Uswa*
- Default language: **Arabic – ar** (or English – en-US)
- App or game: App
- Free or paid: Free
- Accept the declarations.

## 4. Store listing (Grow → Store presence → Main store listing)

Add translations for **ar**, **en-US**, **nl-NL**, **es-ES** and **pt-PT**, then copy each one from `listing/<locale>/`:

| Field | File |
|---|---|
| App name (≤30) | `title.txt` |
| Short description (≤80) | `short_description.txt` |
| Full description (≤4000) | `full_description.txt` |
| App icon 512×512 | `images/icon.png` |
| Feature graphic 1024×500 | `images/featureGraphic.png` |
| Phone screenshots (2–8) | `images/phoneScreenshots/*.png` |
| Release notes | `changelogs/10.txt` |

- **Category:** Books & Reference. Alternatives are Education or Lifestyle.
- **Tags:** Religion, Reference, Self-help.
- **Contact:** email `wajdi.chaouche@gmail.com`; website `https://wajdim.github.io/Rif9atAlOswah/`.

*Optional:* you can upload all of this automatically with fastlane: `fastlane supply --metadata_path build/play/listing --skip_upload_aab`.

## 5. App content (Policy → App content)

| Form | Answer |
|---|---|
| Privacy policy | `https://wajdim.github.io/Rif9atAlOswah/privacy.html` |
| Ads | **No**, the app does not contain ads |
| App access | **All functionality is available without special access.** The optional AI feature needs the user's own Anthropic API key and is not needed to use the app. You may add that note in the "instructions" box. |
| Content rating | Start the IARC questionnaire. Category: **Reference, News, or Educational**. Answer **No** to violence, sexuality, profanity, controlled substances, gambling, user-to-user interaction, location sharing and digital purchases. Expected result: Everyone / PEGI 3. |
| Target audience | **13–15, 16–17, 18+**. Do *not* include under-13, so the Families policy does not apply. "Unintentional appeal to children": No. |
| News app | No |
| COVID-19 apps | No |
| Data safety | See section 6 |
| Government app | No |
| Financial features | None |
| Health | **No health features.** It is reflective religious guidance; crisis messages only point to official helplines. |
| Generative AI | Yes, optional, using the user's own key. Users can report any AI answer in the app via **"Report this answer"**, which opens a pre-filled email to the support address. The answers are restricted to texts retrieved from the app's curated library. |

## 6. Data safety form

What the app actually does, verified in the code:
- **On-device only:** settings, saved items, ratings, the optional API key. These are excluded from cloud backup (`allowBackup=false`).
- **Network calls:**
  1. `everyayah.com`, to stream recitation audio. No user data is sent; it is a plain GET request.
  2. `api.anthropic.com`, only if the user adds their own key and taps the AI button. Their situation text and the retrieved texts are sent over HTTPS.
- **No** analytics, ads, crash reporting, accounts or third-party SDKs.

Answers:

1. **Does your app collect or share any of the required user data types?** → **Yes.** This is only because of the optional AI feature. If you prefer, you can remove that feature and answer No.
2. **Is all of the user data collected by your app encrypted in transit?** → **Yes** (HTTPS only; mixed content is blocked).
3. **Do you provide a way for users to request that their data is deleted?** → Answer **No**: there is no account and no server, and the AI text goes to Anthropic under the user's own key. In the explanation, say that all data is on the device and is deleted by clearing app data.
4. **Data types → App activity → "Other user-generated content":**
   - Collected: **Yes**. Shared: **No**, because the user sends it themselves to their own Anthropic account (a user-initiated transfer).
   - Processed ephemerally: **No** (it is under Anthropic's retention policy).
   - Required or optional: **Optional** ("users can choose").
   - Purpose: **App functionality**.
5. Everything else, including location, personal info, financial info, health and fitness, messages, photos, audio, contacts, device IDs and crash logs: **not collected**.

> Why "collected" and not "none": Play counts any data your app sends off the device. The AI text leaves the device, even though it goes to Anthropic and not to you, so declaring it is the safe and honest answer.

## 7. Release

1. **Testing → Internal testing.** Create a release, upload the `.aab`, and add yourself as a tester.
   - Install it from the Play link and check it works.
   - Check the **Pre-launch report**, which Play runs automatically on real devices.
2. **Closed testing** (required for new *personal* accounts, i.e. accounts created after 13 Nov 2023):
   - It needs **at least 12 testers, opted in for 14 continuous days**, and they must actually use the app.
   - If the count drops below 12, the clock restarts.
   - Organisation accounts that register with a D-U-N-S number skip this step.
3. **Production.** After the closed test, choose **Apply for production**, answer the short questionnaire, then roll out. Start with a staged rollout of 20% → 100%.

## 8. Before each update

- Increase `VERSION_CODE`. Play rejects a code it has seen before.
- Write `listing/<locale>/changelogs/<code>.txt`.
- Rebuild, then upload to internal testing first.
- Target SDK: Google raises the requirement every August. Check https://developer.android.com/google/play/requirements/target-sdk each summer.

## Notes on content licences

- **Quran translations** (Saheeh International, Siregar) come from Tanzil.net. Tanzil allows redistribution **unchanged, with attribution, and for non-commercial use**, so keep the app free and keep the source credits on the About screen.
- **Hadith English** comes from sunnah.com translations. The Dutch hadith are the app's own translations from that English, and this is disclosed in the app and in the listing.
