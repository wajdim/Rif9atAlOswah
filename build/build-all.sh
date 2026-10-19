#!/usr/bin/env bash
# رِفقة الأُسوة — إعادة بناء كل النسخ في dist/
#   TOOLS  : مجلد يحتوي jdk/ و sdk/ (للـ APK)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; DIST="$ROOT/dist"; mkdir -p "$DIST"
echo "== 0) التشكيل";      node "$ROOT/build/tashkeel/build-tashkeel.js"
echo "== 1) اختبار المحرك"; node "$ROOT/build/tests/test-engine.js" >/dev/null && echo "ok"
echo "== 1ب) جودة الفهم والسلامة"; node "$ROOT/build/tests/test-understanding.js"
echo "== 1ج) تصنيف المواقف"; node "$ROOT/build/tests/test-taxonomy.js"
echo "== 1د) سلامة الأدلة"; node "$ROOT/build/tests/test-evidence.js"
echo "== 1هـ) طبقة السيرة"; node "$ROOT/build/tests/test-seerah.js"
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
ls -la "$DIST"
