#!/usr/bin/env bash
# رِفقة الأُسوة — بناء أندرويد بدون Gradle: حزمة AAB لمتجر Google Play + APK موقّع للتثبيت المباشر.
#
# الاستخدام:
#   TOOLS=/path/to/tools bash build/android/build-android.sh
#
#   TOOLS يحتوي: jdk/<jdk-17>/  sdk/build-tools/36.0.0/  sdk/platforms/android-36/  bundletool/bundletool.jar
#   التوقيع: ملف خارج المستودع (لا يُرفع أبدًا) يحدده RIFQA_SIGNING، افتراضيًا ~/.rifqa-signing/signing.env
#            ويحتوي:  KS=<مسار upload.jks>  KS_ALIAS=upload  KS_PASS=<كلمة المرور>
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$(cd "$HERE/../.." && pwd)"

VERSION_NAME="2.6.0"; VERSION_CODE=10
MIN_SDK=24; TARGET_SDK=36; BT_VER=36.0.0

: "${TOOLS:?TOOLS غير محدد}"
JAVA_HOME="$(ls -d "$TOOLS"/jdk/*/ | head -1)"; export PATH="$JAVA_HOME/bin:$PATH"
BT="$TOOLS/sdk/build-tools/$BT_VER"; JAR="$TOOLS/sdk/platforms/android-$TARGET_SDK/android.jar"
BUNDLETOOL="$TOOLS/bundletool/bundletool.jar"
for f in "$BT/aapt2.exe" "$JAR" "$BUNDLETOOL"; do [ -f "$f" ] || { echo "✗ مفقود: $f"; exit 1; }; done

SIGNING="${RIFQA_SIGNING:-$HOME/.rifqa-signing/signing.env}"
[ -f "$SIGNING" ] || { echo "✗ ملف التوقيع غير موجود: $SIGNING (انظر build/play/README.md)"; exit 1; }
KS="$(sed -n 's/^KS=//p' "$SIGNING" | tr -d '\r')"; KS_ALIAS="$(sed -n 's/^KS_ALIAS=//p' "$SIGNING" | tr -d '\r')"
KS_PASS="$(sed -n 's/^KS_PASS=//p' "$SIGNING" | tr -d '\r')"
[ -f "$KS" ] && [ -n "$KS_ALIAS" ] && [ -n "$KS_PASS" ] || { echo "✗ ملف التوقيع ناقص: $SIGNING"; exit 1; }

# أدوات SDK لا تقبل المسارات غير اللاتينية؛ نبني في مجلد مؤقت بأحرف لاتينية ثم ننسخ الناتج
OUT="${BUILD_DIR:-${TMP:-/tmp}/rifqa-android-build}"; rm -rf "$OUT"
mkdir -p "$OUT/assets/www" "$OUT/gen" "$OUT/classes" "$OUT/dex" "$OUT/src" "$OUT/module"
cp -r "$HERE/res" "$HERE/AndroidManifest.xml" "$OUT/src/"; cp -r "$HERE/src" "$OUT/src/java"
cp "$KS" "$OUT/sign.jks"
FINAL="$HERE/out"; rm -rf "$FINAL"; mkdir -p "$FINAL"
NAME="RifqaAlUswa-$VERSION_NAME"

echo "• أصول الويب (بدون service worker: الأصول تُخدم من داخل الحزمة)"
cp -r "$ROOT/index.html" "$ROOT/manifest.json" "$ROOT/css" "$ROOT/js" "$ROOT/fonts" "$ROOT/icons" "$OUT/assets/www/"

echo "• aapt2 compile"
"$BT/aapt2.exe" compile --dir "$OUT/src/res" -o "$OUT/res.zip"
LINK=(-I "$JAR" --manifest "$OUT/src/AndroidManifest.xml" -A "$OUT/assets"
      --min-sdk-version $MIN_SDK --target-sdk-version $TARGET_SDK
      --version-code $VERSION_CODE --version-name "$VERSION_NAME" --auto-add-overlay)
# RIFQA_DEBUG=1: نسخة اختبار قابلة للتصحيح (تفعّل أدوات مطوّري WebView) — لا تُرفع إلى المتجر
[ "${RIFQA_DEBUG:-0}" = "1" ] && LINK+=(--debug-mode)

echo "• aapt2 link (APK + صيغة proto للحزمة)"
"$BT/aapt2.exe" link -o "$OUT/base.apk" --java "$OUT/gen" "${LINK[@]}" "$OUT/res.zip"
"$BT/aapt2.exe" link -o "$OUT/proto.apk" --proto-format "${LINK[@]}" "$OUT/res.zip"

echo "• javac + d8"
javac -encoding UTF-8 --release 11 -nowarn -classpath "$JAR" -d "$OUT/classes" $(find "$OUT/src/java" "$OUT/gen" -name "*.java")
"$BT/d8.bat" --release --min-api $MIN_SDK --lib "$JAR" --output "$OUT/dex" $(find "$OUT/classes" -name "*.class")

echo "• APK: dex + zipalign + apksigner"
# نعيد كتابة الحزمة كاملة (لا إلحاق) مع الحفاظ على ضغط كل ملف: resources.arsc يبقى غير مضغوط (شرط API 30+)
python - "$OUT/base.apk" "$OUT/dex/classes.dex" "$OUT/unaligned.apk" <<'PY'
import sys, zipfile
src, dex, dst = sys.argv[1:4]
with zipfile.ZipFile(src) as zi, zipfile.ZipFile(dst, "w") as zo:
    for info in zi.infolist():
        zo.writestr(zipfile.ZipInfo(info.filename, info.date_time), zi.read(info), compress_type=info.compress_type)
    zo.write(dex, "classes.dex", compress_type=zipfile.ZIP_DEFLATED)
PY
"$BT/zipalign.exe" -p -f 4 "$OUT/unaligned.apk" "$OUT/aligned.apk"
"$BT/zipalign.exe" -c -p 4 "$OUT/aligned.apk"
"$BT/apksigner.bat" sign --ks "$OUT/sign.jks" --ks-pass "pass:$KS_PASS" --key-pass "pass:$KS_PASS" --ks-key-alias "$KS_ALIAS" \
  --out "$OUT/$NAME.apk" "$OUT/aligned.apk"
"$BT/apksigner.bat" verify "$OUT/$NAME.apk"

echo "• AAB: وحدة base ← bundletool ← jarsigner"
python - "$OUT/proto.apk" "$OUT/dex/classes.dex" "$OUT/base-module.zip" <<'PY'
import sys, zipfile
src, dex, dst = sys.argv[1:4]
with zipfile.ZipFile(src) as zi, zipfile.ZipFile(dst, "w", zipfile.ZIP_DEFLATED) as zo:
    for n in zi.namelist():
        data = zi.read(n)
        if n == "AndroidManifest.xml": zo.writestr("manifest/AndroidManifest.xml", data)
        elif n == "resources.pb" or n.startswith(("res/", "assets/")): zo.writestr(n, data)
        else: zo.writestr("root/" + n, data)
    zo.write(dex, "dex/classes.dex")
PY
java -jar "$BUNDLETOOL" build-bundle --modules="$OUT/base-module.zip" --output="$OUT/$NAME.aab" --overwrite
jarsigner -keystore "$OUT/sign.jks" -storepass "$KS_PASS" -keypass "$KS_PASS" -sigalg SHA256withRSA -digestalg SHA-256 \
  "$OUT/$NAME.aab" "$KS_ALIAS" >/dev/null
jarsigner -verify "$OUT/$NAME.aab" | tail -1
java -jar "$BUNDLETOOL" validate --bundle="$OUT/$NAME.aab" >/dev/null && echo "  bundletool validate: ok"

cp "$OUT/$NAME.apk" "$OUT/$NAME.aab" "$FINAL/"; rm -f "$OUT/sign.jks"
echo "✓ $FINAL/$NAME.aab"
echo "✓ $FINAL/$NAME.apk"
