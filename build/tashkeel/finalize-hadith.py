# الحديث النهائي = ضبط كتب الحديث (source-hadith.json) + توحيد الحركات والتقاء الساكنين + المراجعة اليدوية
import json, re, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from normalize import normalize
H = os.path.dirname(os.path.abspath(__file__))
src = json.load(open(os.path.join(H, "source-hadith.json"), encoding="utf-8"))
ov = json.load(open(os.path.join(H, "hadith-overrides.json"), encoding="utf-8"))
out, applied = {}, 0
for k, v in src.items():
    v = normalize(v)
    for a, b in ov.get(k, []):
        a, b = normalize(a), normalize(b)
        n = len(re.findall(r"(?<![ء-يً-ْ])" + re.escape(a) + r"(?![ء-يً-ْ])", v))
        if n: v = re.sub(r"(?<![ء-يً-ْ])" + re.escape(a) + r"(?![ء-يً-ْ])", b, v); applied += n
        else: print("override not found:", k, a)
    out[k] = v
json.dump(out, open(os.path.join(H, "hadith-final.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
print("hadith-final:", len(out), "overrides applied:", applied)
