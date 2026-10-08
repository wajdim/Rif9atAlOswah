#!/usr/bin/env bash
# رِفقة الأُسوة — إعادة بناء كل النسخ في dist/
#   TOOLS  : مجلد يحتوي jdk/ و sdk/ (للـ APK)
#   EBUILD : مجلد فيه node_modules لـ electron و electron-builder (للـ EXE)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; DIST="$ROOT/dist"; mkdir -p "$DIST"
echo "== 0) التشكيل";      node "$ROOT/build/tashkeel/build-tashkeel.js"
echo "== 1) اختبار المحرك"; node "$ROOT/build/tests/test-engine.js" >/dev/null && echo "ok"
echo "== 2) HTML مستقل";   node "$ROOT/build/bundle-html.js" "$DIST/RifqaAlUswa.html"
echo "== 3) حزمة PWA للاستضافة"
rm -f "$DIST/RifqaAlUswa-web.zip"
( cd "$ROOT" && python - <<'PY'
import zipfile, os
with zipfile.ZipFile("dist/RifqaAlUswa-web.zip","w",zipfile.ZIP_DEFLATED) as z:
    for f in ["index.html","manifest.json","service-worker.js"]: z.write(f)
    for d in ["css","js","fonts","icons"]:
        for r,_,fs in os.walk(d):
            for f in fs: z.write(os.path.join(r,f))
PY
)
echo "== 4) Android (AAB لمتجر Play + APK)"; TOOLS="$TOOLS" bash "$ROOT/build/android/build-android.sh" | tail -2 && cp "$ROOT/build/android/out/"*.aab "$ROOT/build/android/out/"*.apk "$DIST/"
echo "== 5) EXE"
W="${TMP:-/tmp}/rifqa-exe"; rm -rf "$W"; mkdir -p "$W/www"
cp "$ROOT/build/electron/main.js" "$ROOT/build/electron/package.json" "$W/"
( cd "$ROOT" && cp -r index.html manifest.json service-worker.js css js fonts icons "$W/www/" )
EV="$(cd "$EBUILD" && node -p "require('./node_modules/electron/package.json').version")"
( cd "$W" && "$EBUILD/node_modules/.bin/electron-builder" --win --x64 -c.electronVersion="$EV" >/dev/null )
cp "$W/out/"*.exe "$DIST/"
ls -la "$DIST"
echo "== 6) مشروع iOS (Xcode)"
bash "$ROOT/build/ios/sync-www.sh"
rm -f "$DIST/RifqaAlUswa-iOS-Xcode.zip"
( cd "$ROOT" && python - <<'PY'
import zipfile, os
with zipfile.ZipFile("dist/RifqaAlUswa-iOS-Xcode.zip","w",zipfile.ZIP_DEFLATED) as z:
    for r,_,fs in os.walk("build/ios"):
        for f in fs: z.write(os.path.join(r,f), os.path.relpath(os.path.join(r,f),"build"))
    z.write(".github/workflows/ios.yml", "ios/.github/workflows/ios.yml")
PY
)
ls -la "$DIST"
