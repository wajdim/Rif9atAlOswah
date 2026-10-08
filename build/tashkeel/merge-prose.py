# يدمج نواتج العمال المتوازية: out-*.json → prose-tashkeel.json و words-*.json → words-tashkeel.json
import json, glob, sys, os
src = sys.argv[1]; here = os.path.dirname(os.path.abspath(__file__))
for pattern, name in (("out-*.json", "prose-tashkeel.json"), ("words-*.json", "words-tashkeel.json")):
    out = os.path.join(here, name)
    merged = json.load(open(out, encoding="utf-8")) if os.path.exists(out) else {}
    for f in glob.glob(os.path.join(src, pattern)):
        try: merged.update(json.load(open(f, encoding="utf-8")))
        except Exception as e: print("skip", f, e)
    json.dump(merged, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    print(name, len(merged))
