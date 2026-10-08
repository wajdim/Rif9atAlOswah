# رِفقة الأُسوة — تصحيح التشكيل الآلي للنصوص الشارحة
#   1) الشواهد «…» ﴿…﴾ من المصادر (prose-sourced.json) إن وُجدت
#   2) قواعد: ترتيب الحركات، التقاء الساكنين، همزة الوصل، كسرة «إ»، كاف الخطاب
#   3) المراجعة اليدوية: prose-review-*.json = [[النص الأصلي، الكلمة الخاطئة، الصواب] ...]
# الناتج: prose-final.json (ما يقرؤه build-tashkeel.js) + تقرير بعدد التصحيحات
import json, re, os, sys, glob
H = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, H)
from normalize import normalize
prose = json.load(open(os.path.join(H, "prose-tashkeel.json"), encoding="utf-8"))
srcd = os.path.join(H, "prose-sourced.json")
sourced = json.load(open(srcd, encoding="utf-8")) if os.path.exists(srcd) else {}

MARK = "[ً-ْٰ]"
def rules(t):
    # همزة الوصل في أول الكلمة (بعد و/ف اختيارًا): لا تُحرَّك ألفها — اُكْتُبْ → اكْتُبْ، فَاِسْمَحْ → فَاسْمَحْ
    t = re.sub(r"(^|[\s«(\"'])((?:[وف]َ)?)ا[َُِ](?=[ء-ي]ْ)", r"\1\2ا", t)
    # «إ» بلا حركة: إلَى → إِلَى
    t = re.sub(r"إ(?![ً-ْ])", "إِ", t)
    # كاف الخطاب في آخر الكلمة بلا حركة (والحرف قبلها مشكول): عِنْدَك → عِنْدَكَ
    t = re.sub(r"(?<=[ً-ْ])ك(?![ء-يً-ْ])", "كَ", t)
    # «اللَّه» بلا شدة بعد حرف جر/عطف: لِلَهِ → لِلَّهِ
    t = re.sub(r"\bلِلَه", "لِلَّه", t)
    return normalize(t)

review = {}
order = json.load(open(os.path.join(H, "review-order.json"), encoding="utf-8"))
for f in sorted(glob.glob(os.path.join(H, "prose-review-*.json"))):
    for idx, wrong, right in json.load(open(f, encoding="utf-8")):   # [رقم النص في review-order.json، الخطأ، الصواب]
        strip = lambda w: re.sub(MARK, "", w)
        if strip(wrong) != strip(right): print("  رُفض تصحيح يغيّر الحروف:", idx, wrong, right); continue
        review.setdefault(order[idx], []).append((normalize(wrong), normalize(right)))

WB_L, WB_R = r"(?<![ء-يً-ْٰ])", r"(?![ء-يً-ْٰ])"
out, stats = {}, {"sourced": 0, "rule_changed": 0, "review_applied": 0, "review_missing": []}
for plain, vocal in prose.items():
    v = sourced.get(plain, vocal)
    if plain in sourced: stats["sourced"] += 1
    r = rules(v)
    if r != v: stats["rule_changed"] += 1
    for wrong, right in review.get(plain, []):
        pat = WB_L + re.escape(wrong) + WB_R
        if re.search(pat, r): r = re.sub(pat, right, r); stats["review_applied"] += 1
        else: stats["review_missing"].append([plain[:40], wrong])
    out[plain] = r
json.dump(out, open(os.path.join(H, "prose-final.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
print("prose-final:", len(out), "| من المصادر:", stats["sourced"], "| تصحيح بالقواعد:", stats["rule_changed"],
      "| مراجعة يدوية:", stats["review_applied"], "| لم تُطبَّق:", len(stats["review_missing"]))
for m in stats["review_missing"][:20]: print("  missing:", m)
