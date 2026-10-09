# Convierte los TSV de notas y textos de hadices de una lengua en <lang>/content/*.json
#   <lang>/quran-notes.tsv   id \t nota
#   <lang>/hadith-notes.tsv  id \t narrador \t nota [\t w]
#   <lang>/te-*.tsv          clave(lib:id | sit:id:i) \t texto  (o «@lib:id» para un texto repetido)
# Uso: python build/i18n/tsv2content.py es
import io, json, os, sys, glob
H = os.path.dirname(os.path.abspath(__file__)); L = sys.argv[1]; D = os.path.join(H, L); C = os.path.join(D, "content")
os.makedirs(C, exist_ok=True)
def rows(p):
    for line in io.open(p, encoding="utf-8"):
        line = line.rstrip("\n").rstrip("\r")
        if line.strip(): yield line.split("\t")
def dump(name, obj): json.dump(obj, io.open(os.path.join(C, name), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
p = os.path.join(D, "quran-notes.tsv")
if os.path.exists(p): q = {r[0]: {"n": r[1]} for r in rows(p)}; dump("quran-notes.json", {"quran": q}); print("quran", len(q))
p = os.path.join(D, "hadith-notes.tsv")
if os.path.exists(p):
    h = {}
    for r in rows(p):
        h[r[0]] = {"r": r[1], "n": r[2]}
        if len(r) > 3 and r[3]: h[r[0]]["w"] = r[3]
    dump("hadith-notes.json", {"hadith": h}); print("hadith", len(h))
te = {}
for p in sorted(glob.glob(os.path.join(D, "te-*.tsv"))):
    for r in rows(p): te[r[0]] = r[1]
for k, v in list(te.items()):
    if v.startswith("@"): te[k] = te.get(v[1:], v)
if te: dump("hadith-te.json", {"te": te}); print("te", len(te))
