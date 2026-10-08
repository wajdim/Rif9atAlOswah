#!/usr/bin/env bash
# ينسخ ملفات الويب إلى مشروع iOS (build/ios/Rifqa/www) قبل البناء في Xcode
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$(cd "$HERE/../.." && pwd)"; W="$HERE/Rifqa/www"
if [ ! -f "$ROOT/index.html" ]; then echo "• www جاهز داخل المشروع (لا توجد ملفات ويب أحدث في $ROOT)"; exit 0; fi
rm -rf "$W"; mkdir -p "$W"
cp "$ROOT/index.html" "$ROOT/manifest.json" "$W/"
cp -R "$ROOT/css" "$ROOT/js" "$ROOT/fonts" "$ROOT/icons" "$W/"
echo "✓ www → $W ($(du -sh "$W" | cut -f1))"
