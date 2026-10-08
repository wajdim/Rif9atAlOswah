#!/usr/bin/env bash
# رِفقة الأُسوة — بناء APK موقّع بدون Gradle
# الاستخدام: TOOLS=/path/to/tools bash build-apk.sh
#   حيث يحتوي TOOLS على: jdk/<jdk-17>/ و sdk/build-tools/34.0.0 و sdk/platforms/android-34
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$(cd "$HERE/../.." && pwd)"
JAVA_HOME="$(ls -d "$TOOLS"/jdk/*/ | head -1)"; export PATH="$JAVA_HOME/bin:$PATH"
BT="$TOOLS/sdk/build-tools/34.0.0"; JAR="$TOOLS/sdk/platforms/android-34/android.jar"
# أدوات SDK لا تقبل المسارات غير اللاتينية؛ نبني في مجلد مؤقت بأحرف لاتينية ثم ننسخ الناتج
OUT="${BUILD_DIR:-${TMP:-/tmp}/rifqa-apk-build}"; rm -rf "$OUT"; mkdir -p "$OUT/assets/www" "$OUT/gen" "$OUT/classes" "$OUT/dex" "$OUT/src"
cp -r "$HERE/res" "$HERE/AndroidManifest.xml" "$OUT/src/"; cp -r "$HERE/src" "$OUT/src/java"
FINAL_DIR="$HERE/out"; mkdir -p "$FINAL_DIR"
VERSION_NAME="2.3.0"; VERSION_CODE=7

echo "• نسخ ملفات الويب إلى assets"
cp -r "$ROOT/index.html" "$ROOT/manifest.json" "$ROOT/css" "$ROOT/js" "$ROOT/fonts" "$ROOT/icons" "$OUT/assets/www/"

echo "• aapt2: ترجمة الموارد وربطها"
"$BT/aapt2.exe" compile --dir "$OUT/src/res" -o "$OUT/res.zip"
"$BT/aapt2.exe" link -o "$OUT/base.apk" -I "$JAR" --manifest "$OUT/src/AndroidManifest.xml" \
  -A "$OUT/assets" --java "$OUT/gen" --min-sdk-version 24 --target-sdk-version 34 \
  --version-code $VERSION_CODE --version-name $VERSION_NAME "$OUT/res.zip"

echo "• javac"
javac -encoding UTF-8 -source 8 -target 8 -nowarn -Xlint:-options -classpath "$JAR" -d "$OUT/classes" \
  $(find "$OUT/src/java" "$OUT/gen" -name "*.java")

echo "• d8"
"$BT/d8.bat" --release --min-api 24 --lib "$JAR" --output "$OUT/dex" $(find "$OUT/classes" -name "*.class")

echo "• إضافة classes.dex"
python - "$OUT/base.apk" "$OUT/dex/classes.dex" <<'PY'
import sys, zipfile
with zipfile.ZipFile(sys.argv[1], "a", zipfile.ZIP_DEFLATED) as z: z.write(sys.argv[2], "classes.dex")
PY

echo "• zipalign + توقيع"
"$BT/zipalign.exe" -p -f 4 "$OUT/base.apk" "$OUT/aligned.apk"
KS="$HERE/rifqa-release.jks"; KSPASS="${KSPASS:-}"; KSTMP="$OUT/release.jks"
if [ ! -f "$KS" ]; then
  KSPASS="$(python -c 'import secrets;print(secrets.token_urlsafe(18))')"
  keytool -genkeypair -keystore "$KSTMP" -storepass "$KSPASS" -keypass "$KSPASS" -alias rifqa -keyalg RSA -keysize 3072 \
    -validity 10000 -dname "CN=Rifqa Al-Uswa, O=Wajdi Chaouch, C=TN" >/dev/null 2>&1
  cp "$KSTMP" "$KS"
  printf "keystore: rifqa-release.jks\nalias: rifqa\npassword: %s\n\nاحتفظ بهذا الملف وكلمة المرور في مكان آمن: بدونهما لا يمكن إصدار تحديث لنفس التطبيق.\n" "$KSPASS" > "$HERE/KEYSTORE-SECRET.txt"
fi
[ -z "$KSPASS" ] && KSPASS="$(sed -n 's/^password: //p' "$HERE/KEYSTORE-SECRET.txt")"
cp "$KS" "$KSTMP"
"$BT/apksigner.bat" sign --ks "$KSTMP" --ks-pass "pass:$KSPASS" --key-pass "pass:$KSPASS" --ks-key-alias rifqa \
  --out "$OUT/RifqaAlUswa-$VERSION_NAME.apk" "$OUT/aligned.apk"
"$BT/apksigner.bat" verify --verbose "$OUT/RifqaAlUswa-$VERSION_NAME.apk" | head -5
cp "$OUT/RifqaAlUswa-$VERSION_NAME.apk" "$FINAL_DIR/"; rm -f "$KSTMP"
echo "✓ $FINAL_DIR/RifqaAlUswa-$VERSION_NAME.apk"
