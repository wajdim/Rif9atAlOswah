# يضيف نصوص واجهة جديدة إلى كل اللغات دفعة واحدة، مع الحفاظ على ترتيب ui-en.json (الذي تعتمد عليه ملفات TSV).
# الاستخدام: python build/i18n/add-ui.py build/i18n/ui-new-28.json
#   الملف: { "النص العربي": {"en": "...", "fr": "...", ...}, ... }
import io, json, os, sys
H = os.path.dirname(os.path.abspath(__file__))
new = json.load(io.open(sys.argv[1], encoding="utf-8"))
def load(p): return json.load(io.open(p, encoding="utf-8"))
def save(p, d): json.dump(d, io.open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
en = load(os.path.join(H, "ui-en.json")); keys = list(en.keys())
added = [k for k in new if k not in en]
for k in added: en[k] = new[k]["en"]
save(os.path.join(H, "ui-en.json"), en)
keys = list(en.keys())
kj = os.path.join(H, "ui-keys.json")
if os.path.exists(kj): save(kj, keys)
langs = sorted({l for v in new.values() for l in v} - {"en"})
for l in langs:
    p = os.path.join(H, "ui-%s.json" % l)
    d = load(p) if os.path.exists(p) else {}
    for k in new:
        if l in new[k]: d[k] = new[k][l]
    save(p, d)
    # مصادر TSV (index\ttext) إن وُجدت
    for src in ["%s/ui-%s.tsv" % (l, l), "%s/ui-%s-list.txt" % (l, l)]:
        sp = os.path.join(H, src)
        if not os.path.exists(sp): continue
        have = {int(x.split("\t", 1)[0]) for x in io.open(sp, encoding="utf-8") if "\t" in x}
        with io.open(sp, "a", encoding="utf-8", newline="\n") as f:
            for k in new:
                i = keys.index(k)
                if i not in have and l in new[k]: f.write("%d\t%s\n" % (i, new[k][l].strip()))
    print(l, "ok")
print("added", len(added), "keys; total", len(keys))
