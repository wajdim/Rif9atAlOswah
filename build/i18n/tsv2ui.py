# Convierte <lang>/ui-<lang>.tsv (índice\ttexto, en el orden de ui-en.json) en ui-<lang>.json,
# restaurando los espacios iniciales/finales de cada valor inglés (p. ej. " and " → " y ").
# Uso: python build/i18n/tsv2ui.py es
import io, json, os, re, sys
H = os.path.dirname(os.path.abspath(__file__)); L = sys.argv[1]
en = json.load(io.open(os.path.join(H, "ui-en.json"), encoding="utf-8")); keys = list(en.keys())
rows = {}
for line in io.open(os.path.join(H, L, "ui-%s.tsv" % L), encoding="utf-8"):
    line = line.rstrip("\n")
    if not line: continue
    i, t = line.split("\t", 1); rows[int(i)] = t.replace("\n", "\n")
out, miss = {}, []
for i, k in enumerate(keys):
    if i not in rows: miss.append(i); continue
    ev = en[k]; lead = re.match(r"^\s*", ev).group(0); trail = re.search(r"\s*$", ev).group(0)
    out[k] = lead + rows[i].strip() + trail
json.dump(out, io.open(os.path.join(H, "ui-%s.json" % L), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("[%s] ui %d/%d%s" % (L, len(out), len(keys), (" missing " + ",".join(map(str, miss))) if miss else ""))
