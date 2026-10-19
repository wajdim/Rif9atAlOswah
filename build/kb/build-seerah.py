# Builds the Seerah layer: new events (seerah/events-*.json) and the "depth" of events (seerah/depth-*.json).
#   js/data-seerah-kb.js                  new situations appended to SITUATIONS, linked to their themes, plus SEERAH_DEPTH
#                                         (timeline + challenges, options, choice, what he refrained from, lessons by area)
#   build/i18n/content/seerah-kb.json     English for all of it
#   build/tashkeel/hadith-tashkeel-kb.json  vowel marks of the quoted narrations, from the source
# Quotations are never typed: a hadith is {ref: "bukhari:3884", from, to} and its text is cut from the source;
# a verse is {ref: "33:10-11", expect} and its text is pulled from Tanzil.
# Usage: python -I build/kb/build-seerah.py [--check]
import io, json, os, re, sys, glob, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kbsrc import *
from kbtext import *
sys.stdout.reconfigure(encoding="utf-8")
CHECK = "--check" in sys.argv
D = os.path.join(HERE, "seerah")

app_js = r'''
const L=require(process.argv[1])(process.argv[2]);
process.stdout.write(JSON.stringify({themes:L.THEMES.map(t=>t.id), sits:L.SITUATIONS.filter(s=>!s.kb).map(s=>s.id),
  cats:[...new Set(L.SITUATIONS.map(s=>s.mainCategory))]}));'''
info = json.loads(subprocess.check_output(["node", "-e", app_js, os.path.join(ROOT, "build", "tests", "load.js"), os.path.join(ROOT, "js")], encoding="utf-8"))
THEMES, SITS, CATS = set(info["themes"]), set(info["sits"]), set(info["cats"])
SNO, SURAHS = surah_names(); Q = load_quran()
MARKS = re.compile(r"[ً-ْٰۖ-ۭـ]")
ERAS = {"mecca", "hijra", "medina"}
STRENGTH = {"موثق بدرجة عالية", "موثق", "رواية تاريخية"}
errors = []
C = {}
def coll(b):
    if b not in C: C[b] = Collection(b)
    return C[b]

def verse(ref, expect, where):
    s, a = ref.split(":"); s = int(s); x = a.split("-"); vv = range(int(x[0]), int(x[-1]) + 1)
    if any(v < 1 or v > len(Q[s - 1]) for v in vv): errors.append(where + ": no verse " + ref); return None
    text = " * ".join(re.sub(r"\s+", " ", MARKS.sub("", Q[s - 1][v - 1]).replace("ٱ", "ا")).strip() for v in vv)
    miss = [w for w in toks(expect) if w not in toks(text)]
    if miss: errors.append(where + ": %s lacks «%s»" % (ref, " ".join(miss))); return None
    return {"surahName": SURAHS[s - 1], "ayahNumber": a if "-" in a else int(a), "text": text}

def narration(ref, a_from, a_to, where):
    book, num = ref.split(":"); num = int(num)
    for it in coll(book).at(num):
        stoks = tokens_with_spans(it["ar"])
        sp = anchor_span(stoks, a_from, a_to)
        if sp:
            vocal = clean(it["ar"][stoks[sp[0]][1]:stoks[sp[1]][2]])
            return vocal, it, book, num
    errors.append(where + ": «%s … %s» not found in %s" % (a_from, a_to, ref)); return None

def grade_of(book, it):
    if book in ("bukhari", "muslim"): return "صحيح"
    alb = [x[1] for x in graders_ar(it["grades"]) if x[0] == "الألباني"]
    return alb[0] if alb else None

FIELDS_LIST = ["subCategories", "participants", "prophetTraits", "emotionsAddressed", "principles", "modernApplications", "notToApplyTo",
               "keywords", "semanticTags", "behaviorObservations", "whatToAvoid"]
FIELDS_TEXT = ["title", "eventDescription", "historicalContext", "problemType", "responseType", "reflection"]
def check_depth(d, where):
    for k in ("challenges", "alternatives", "notDone"):
        if not isinstance(d.get(k), list) or not d[k]: errors.append(where + ": depth." + k + " missing")
    if not d.get("chose"): errors.append(where + ": depth.chose missing")
    if set((d.get("lessons") or {}).keys()) != {"self", "family", "work", "community"}: errors.append(where + ": depth.lessons needs self/family/work/community")

new_sits, en_sit, tk, depth = [], {}, {}, {}
for f in sorted(glob.glob(os.path.join(D, "events-*.json"))):
    for e in json.load(open(f, encoding="utf-8")):
        w = os.path.basename(f) + ":" + e.get("id", "?")
        if e["id"] in SITS: errors.append(w + ": id already used"); continue
        ar, en = e["ar"], e["en"]
        for k in FIELDS_TEXT:
            if not ar.get(k) or not en.get(k): errors.append(w + ": missing " + k)
        for k in FIELDS_LIST:
            if not isinstance(ar.get(k), list) or not isinstance(en.get(k), list): errors.append(w + ": missing list " + k)
        if e.get("mainCategory") not in CATS: errors.append(w + ": unknown category " + str(e.get("mainCategory")))
        if e.get("sourceStrength") not in STRENGTH: errors.append(w + ": bad sourceStrength")
        if e.get("era") not in ERAS: errors.append(w + ": bad era")
        for t in e.get("themes", []):
            if t not in THEMES: errors.append(w + ": unknown theme " + t)
        check_depth(ar.get("depth") or {}, w + " ar"); check_depth(en.get("depth") or {}, w + " en")
        s = {"id": e["id"], "kb": 1, "sourceType": "sunnah", "mainCategory": e["mainCategory"], "sourceStrength": e["sourceStrength"],
             "seerahSources": e.get("seerahSources", [])}
        for k in FIELDS_TEXT + FIELDS_LIST: s[k] = ar.get(k)
        if e.get("figure"): s["figure"] = e["figure"]["ar"]
        s["quranRefs"], s["hadithRefs"] = [], []
        tr = {k: en.get(k) for k in FIELDS_TEXT + FIELDS_LIST}; tr["quranRefs"], tr["hadithRefs"] = [], []
        if e.get("figure"): tr["figure"] = e["figure"]["en"]
        for i, q in enumerate(e.get("quran", [])):
            v = verse(q["ref"], q["expect"], w)
            if v: v["context"], v["relevance"] = q["context"]["ar"], q["relevance"]["ar"]; s["quranRefs"].append(v); tr["quranRefs"].append({"context": q["context"]["en"], "relevance": q["relevance"]["en"]})
        for i, h in enumerate(e.get("hadith", [])):
            r = narration(h["ref"], h["from"], h["to"], w)
            if not r: continue
            vocal, it, book, num = r
            g = grade_of(book, it)
            if g not in ("صحيح", "حسن", "حسن صحيح"): errors.append(w + ": " + h["ref"] + " not graded sahih/hasan"); continue
            text = re.sub(r"[ً-ْٰ]", "", vocal)
            ref = {"text": text, "narrator": h["narrator"]["ar"], "source": "%s (%d)" % (BOOK_AR[book], num), "grade": g}
            if h.get("paraphrase"): ref["paraphrase"] = True
            s["hadithRefs"].append(ref); tr["hadithRefs"].append({"te": h["te"], "narrator": h["narrator"]["en"]})
            tk["%s#%d" % (e["id"], len(s["hadithRefs"]) - 1)] = vocal
        if not s["hadithRefs"] and not s["quranRefs"]: errors.append(w + ": no verified evidence")
        new_sits.append((s, e.get("themes", [])))
        depth[e["id"]] = {"era": e["era"], "order": e["order"], "when": e["when"]["ar"], **ar["depth"]}
        tr["depth"] = {"when": e["when"]["en"], **en["depth"]}
        en_sit[e["id"]] = tr

for f in sorted(glob.glob(os.path.join(D, "depth-*.json"))):
    for sid, d in json.load(open(f, encoding="utf-8")).items():
        w = os.path.basename(f) + ":" + sid
        if sid not in SITS: errors.append(w + ": no such situation"); continue
        if sid in depth: errors.append(w + ": depth given twice"); continue
        if d.get("era") not in ERAS: errors.append(w + ": bad era")
        check_depth(d["ar"], w + " ar"); check_depth(d["en"], w + " en")
        depth[sid] = {"era": d["era"], "order": d["order"], "when": d["when"]["ar"], **d["ar"]}
        en_sit.setdefault(sid, {})["depth"] = {"when": d["when"]["en"], **d["en"]}

print("new events: %d · events with depth: %d" % (len(new_sits), len(depth)))
if errors: print("ERRORS (%d):\n  " % len(errors) + "\n  ".join(errors)); sys.exit(1)
if CHECK: sys.exit(0)
J = lambda v: json.dumps(v, ensure_ascii=False)
js = ("/* GENERATED by build/kb/build-seerah.py from build/kb/seerah/*.json - do not edit by hand.\n"
      "   New Seerah events (quotations cut from the sources) and the depth of events: era/order for the timeline,\n"
      "   challenges, alternatives, what was chosen, what was refrained from, lessons for self/family/work/community. */\n"
      "SITUATIONS.push(\n" + ",\n".join(J(s) for s, _ in new_sits) + "\n);\n"
      "(function(){\n  var link = " + J({s["id"]: th for s, th in new_sits}) + ";\n"
      "  if (typeof THEMES !== 'undefined') Object.keys(link).forEach(function(id){ link[id].forEach(function(t){ var th = THEMES.find(function(x){ return x.id === t; }); if (th && th.sits.indexOf(id) < 0) th.sits.push(id); }); });\n})();\n"
      "var SEERAH_DEPTH = " + J(depth) + ";\n"
      "SITUATIONS.forEach(function(s){ if (SEERAH_DEPTH[s.id]) s.depth = SEERAH_DEPTH[s.id]; });\n")
io.open(os.path.join(ROOT, "js", "data-seerah-kb.js"), "w", encoding="utf-8", newline="\n").write(js)
io.open(os.path.join(ROOT, "build", "i18n", "content", "seerah-kb.json"), "w", encoding="utf-8", newline="\n").write(json.dumps({"sit": en_sit}, ensure_ascii=False, indent=1) + "\n")
tf = os.path.join(ROOT, "build", "tashkeel", "hadith-tashkeel-kb.json")
prev = json.load(open(tf, encoding="utf-8")) if os.path.exists(tf) else {}
prev.update(tk)
io.open(tf, "w", encoding="utf-8", newline="\n").write(json.dumps(prev, ensure_ascii=False, indent=0) + "\n")
print("wrote js/data-seerah-kb.js (%d KB), content/seerah-kb.json" % (len(js.encode("utf-8")) // 1024))
