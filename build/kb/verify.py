# Audits every verse and hadith quoted by the app against the offline sources:
#   Qur'an  → Tanzil quran-simple (build/tashkeel/cache/quran-simple.json)
#   hadith  → fawazahmed0/hadith-api editions of the nine collections it carries (build/kb/cache/, see fetch.py)
# Usage: python -I build/kb/verify.py [--fail]      → build/kb/report.json + build/kb/REPORT.md
#   --fail : exit 1 when a quoted text is not found in its cited source (used by the test suite)
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kbsrc import *

sys.stdout.reconfigure(encoding="utf-8")
FAIL = "--fail" in sys.argv
app = load_app()
SNO, SURAHS = surah_names()
QURAN = load_quran()
COLL = {b: Collection(b) for b in BOOKS}
ok_cov, part_cov = 0.8, 0.5

def verse_range(a):
    a = str(a).replace("–", "-")
    if "-" in a:
        x, y = a.split("-"); return list(range(int(x), int(y) + 1))
    return [int(a)]

def check_quran(entry_id, surah, ayah, text):
    n = SNO.get(norm_ar(surah))
    if not n: return {"id": entry_id, "status": "bad-surah", "surah": surah}
    try: ayat = verse_range(ayah)
    except ValueError: return {"id": entry_id, "status": "bad-ayah", "ayah": ayah}
    if any(v < 1 or v > len(QURAN[n - 1]) for v in ayat): return {"id": entry_id, "status": "bad-ayah", "ayah": ayah}
    src = " ".join(QURAN[n - 1][v - 1] for v in ayat)
    q = toks(text.replace("*", " "))
    cov = coverage(q, toks(src)); back = coverage(toks(src), q)
    st = "verified" if cov >= 0.97 and back >= 0.97 else "excerpt" if cov >= 0.97 else "mismatch"
    return {"id": entry_id, "status": st, "ref": "%d:%s" % (n, ayah), "cov": round(cov, 3), "full": round(back, 3)}

def quoted_parts(text):
    """the whole quotation, and the words after each colon (the narrator's framing «عن فلان قال: قال رسول الله ﷺ:»
    is the app's own wording; what must match the source is what follows)"""
    parts = [toks(text.replace("…", " "))]
    for i, ch in enumerate(text):
        if ch in ":«":
            t = toks(text[i + 1:].replace("…", " "))
            if len(t) >= 5: parts.append(t)
    return parts
def cov_text(qparts, src_toks): return max(coverage(q, src_toks) for q in qparts)

def best_at(book, num, q):
    best = (0.0, None)
    for it in COLL[book].at(num):
        c = cov_text(q, it["toks"])
        if c > best[0]: best = (c, it)
    return best

def search_best(book, qp):
    best = []
    for q in qp:
        for c, it in COLL[book].search(q, 3):
            best.append((cov_text(qp, it["toks"]), it))
    return sorted(best, key=lambda x: -x[0])[:1]

def check_hadith(entry_id, text, src, grade, paraphrase=False):
    qp = quoted_parts(text); q = qp
    cites = parse_cites(src)
    res = {"id": entry_id, "src": src, "grade": grade, "paraphrase": paraphrase, "cites": []}
    best_cov, best_cite = 0.0, None
    for book, num in cites:
        if num is None or book in NUMBER_UNRELIABLE:
            m = search_best(book, qp)
            c, it = (m[0] if m else (0.0, None))
            res["cites"].append({"book": book, "num": None, "cov": round(c, 3), "foundAt": it["num"] if it else None})
        else:
            c, it = best_at(book, num, q)
            cite = {"book": book, "num": num, "cov": round(c, 3)}
            if c < ok_cov:
                m = search_best(book, qp)
                if m and m[0][0] >= ok_cov and m[0][1]["num"] != num:
                    cite["foundAt"] = m[0][1]["num"]; cite["foundCov"] = round(m[0][0], 3)
                    # Muslim: the dataset's Abd al-Baqi label is off by one at some boundaries — the text is there
                    if book == "muslim" and abs(m[0][1]["num"] - num) <= 1: c, it = m[0]; cite["cov"] = round(c, 3); cite["labelSlip"] = True
            res["cites"].append(cite)
        if c > best_cov: best_cov, best_cite = c, (book, it)
    outside = [o for o in OUTSIDE if o in src]
    res["outside"] = outside
    if best_cov >= ok_cov: res["status"] = "verified"
    elif any(c.get("foundAt") and c.get("foundCov", 0) >= ok_cov for c in res["cites"]): res["status"] = "wrong-number"
    elif best_cov >= part_cov: res["status"] = "partial"
    else:
        # nothing in the cited books: is it anywhere in the corpus?
        alt = max(((search_best(b, qp) or [(0, None)])[0] + (b,) for b in BOOKS), key=lambda x: x[0])
        if alt[0] >= ok_cov: res["alt"] = {"book": alt[2], "num": alt[1]["num"], "cov": round(alt[0], 3)}
        res["status"] = "outside-corpus" if (outside and not cites) else "not-found"
    # graders' verdicts for the matched hadith (the four Sunan carry them)
    if paraphrase and res["status"] != "verified":
        # a summary cannot match word for word: the cited narration must exist and share the summary's distinctive words
        rare = [w for w in set(toks(text)) if all(COLL[b].df.get(w, 0) <= 150 for b, _ in cites if b in COLL) and len(w) > 3]
        ok = []
        for b, n in cites:
            if n is None: continue
            for it in COLL[b].at(n):
                if sum(1 for w in rare if w in it["toks"]) >= 2: ok.append((b, it)); break
        if ok: res["status"] = "summary"; best_cite = ok[0]; res["summaryOf"] = [[b, it["num"]] for b, it in ok]
    res["_items"] = []
    for b, n in cites:
        if n is None or b in NUMBER_UNRELIABLE: continue
        its = COLL[b].at(n)
        if its: res["_items"].append((b, n, its[0]))
    if best_cite and best_cite[1] and best_cov >= ok_cov:
        res["grades"] = best_cite[1]["grades"]; res["matchedBook"] = best_cite[0]; res["matchedNum"] = best_cite[1]["num"]
        alb = [g["grade"] for g in best_cite[1]["grades"] if g["name"] == "Al-Albani"]
        if alb: res["albani"] = alb[0]
    return res

report = {"quran": [], "hadith": []}
for q in app["quran"]: report["quran"].append(check_quran(q["id"], q["s"], q["a"], q["t"]))
for q in app["sitQuran"]: report["quran"].append(check_quran(q["id"], q["surahName"], q["ayahNumber"], q["text"]))
for h in app["hadith"]: report["hadith"].append(check_hadith(h["id"], h["t"], h["src"], h["g"]))
for h in app["sitHadith"]: report["hadith"].append(check_hadith(h["id"], h["text"], h["source"], h["grade"], bool(h.get("paraphrase"))))

def count(lst, key="status"):
    c = {}
    for x in lst: c[x[key]] = c.get(x[key], 0) + 1
    return c
# ---------- js/data-evidence.js: what the app ships about every quotation ----------
STATUS = {"verified": "source", "summary": "summary"}
ev = {}
texts = {q["id"]: q["t"] for q in app["quran"]}; texts.update({q["id"]: q["text"] for q in app["sitQuran"]})
for x in report["quran"]:
    ev[x["id"]] = {"v": x["status"], "r": x.get("ref", ""), "f": fingerprint(texts[x["id"]])}
htexts = {h["id"]: h["t"] for h in app["hadith"]}; htexts.update({h["id"]: h["text"] for h in app["sitHadith"]})
for x in report["hadith"]:
    v = STATUS.get(x["status"], "unverified")
    if v == "source" and x.get("matchedBook") in SECONDARY: v = "secondary"
    rec = {"v": v, "f": fingerprint(htexts[x["id"]])}
    cites = [[b, n, it.get("kitabAr") or it.get("kitab", "")] for b, n, it in x["_items"]]
    if cites: rec["c"] = cites
    if x.get("grades"): rec["g"] = graders_ar(x["grades"])
    ev[x["id"]] = rec
for x in report["hadith"]: x.pop("_items", None)
if "--write" in sys.argv:
    HEAD = [
        "/* GENERATED by build/kb/verify.py --write - do not edit by hand.",
        "   Verification of every quoted verse and hadith against offline copies of the sources:",
        "   Qur'an: Tanzil (quran-simple). Hadith: fawazahmed0/hadith-api (numbers = sunnah.com reference numbering:",
        "   Fath al-Bari for al-Bukhari, Muhammad Fu'ad Abd al-Baqi for Muslim), AhmedBaset/hadith-json (al-Adab al-Mufrad,",
        "   Riyad al-Salihin, Mishkat), Open-Hadith-Data (complete Musnad Ahmad).",
        "   v: quran -> verified (whole verses) | excerpt (part of the verses);",
        "      hadith -> source (wording found in the cited book) | secondary (found only in a compilation quoting it)",
        "               | summary (a summary, labelled as such, of a narration found at the cited number)",
        "               | unverified (in no offline source: kept for the record, never shown in answers).",
        "   c: [[collection, number, kitab]] - g: [[grader, verdict]] from the source edition - f: fingerprint of the",
        "   verified text (a test fails if the text changes without re-running the verifier). */"]
    body = json.dumps(ev, ensure_ascii=False, separators=(",", ":")).replace('},"', '},' + chr(10) + '"')
    FOOT = [
        "/* Applied at load time: hadith not verifiable offline leave the library used for answers (HADITH_ALL keeps",
        "   the full list for the verifier and the tests); situation references carry their status for the UI. */",
        "var HADITH_ALL = typeof HADITH_LIB !== 'undefined' ? HADITH_LIB : [];",
        "if (typeof HADITH_LIB !== 'undefined') HADITH_LIB = HADITH_LIB.filter(function(h){ var e = EVIDENCE[h.id]; return !(e && e.v === 'unverified'); });",
        "if (typeof SITUATIONS !== 'undefined') SITUATIONS.forEach(function(s){ (s.hadithRefs || []).forEach(function(r, i){ var e = EVIDENCE[s.id + '#' + i]; if (e) r.ver = e.v; }); });"]
    out = chr(10).join(HEAD) + chr(10) + "var EVIDENCE = " + body + ";" + chr(10) + chr(10).join(FOOT) + chr(10)
    open(os.path.join(ROOT, "js", "data-evidence.js"), "w", encoding="utf-8", newline=chr(10)).write(out)
    print("wrote js/data-evidence.js (%d KB)" % (len(out.encode("utf-8")) // 1024))
json.dump(report, open(os.path.join(HERE, "report.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

L = ["# Evidence audit", "", "Generated by `python -I build/kb/verify.py`. Every quoted text is compared word by word (in order) with its cited source.", "",
     "## Qur'an (%d quotations)" % len(report["quran"]), ""]
for k, v in sorted(count(report["quran"]).items()): L.append("- %s: %d" % (k, v))
bad = [x for x in report["quran"] if x["status"] not in ("verified", "excerpt")]
if bad: L += ["", "| id | status | detail |", "|---|---|---|"] + ["| %s | %s | %s |" % (x["id"], x["status"], json.dumps({k: v for k, v in x.items() if k not in ("id", "status")}, ensure_ascii=False)) for x in bad]
L += ["", "## Hadith (%d quotations)" % len(report["hadith"]), ""]
for k, v in sorted(count(report["hadith"]).items()): L.append("- %s: %d" % (k, v))
bad = [x for x in report["hadith"] if x["status"] != "verified"]
if bad:
    L += ["", "| id | status | cited | detail |", "|---|---|---|---|"]
    for x in bad:
        det = "; ".join("%s %s→%s%s" % (c["book"], c["num"], c["cov"], (" found at %s" % c["foundAt"]) if c.get("foundAt") else "") for c in x["cites"])
        if x.get("alt"): det += " · elsewhere: %s %s (%s)" % (x["alt"]["book"], x["alt"]["num"], x["alt"]["cov"])
        if x.get("paraphrase"): det += " · marked as paraphrase"
        L.append("| %s | %s | %s | %s |" % (x["id"], x["status"], x["src"], det))
def app_grade_key(g):
    g = g.split("(")[0].strip()
    return {"صحيح": "sahih", "صحيح لغيره": "sahih", "حسن": "hasan", "حسن صحيح": "hasan sahih", "حسن لغيره": "hasan", "حسن بمجموع طرقه": "hasan"}.get(g, g)
# «حسن صحيح» is al-Tirmidhi's own term; counted as agreeing with either sahih or hasan sahih
gd = [x for x in report["hadith"] if x.get("albani") and grade_key(x["albani"]) != app_grade_key(x["grade"])
      and not (app_grade_key(x["grade"]) == "hasan sahih" and grade_key(x["albani"]) == "sahih")]
L += ["", "## Grades that differ from Al-Albani's verdict in the source (%d)" % len(gd), ""]
L += ["- %s: app «%s», Al-Albani «%s»" % (x["id"], x["grade"], x["albani"]) for x in gd]
open(os.path.join(HERE, "REPORT.md"), "w", encoding="utf-8").write("\n".join(L) + "\n")
print("quran:", count(report["quran"]))
print("hadith:", count(report["hadith"]))
print("grades differing from Al-Albani:", len(gd))
if FAIL and any(x["status"] in ("mismatch", "bad-surah", "bad-ayah") for x in report["quran"]) or FAIL and any(x["status"] in ("not-found", "wrong-number") for x in report["hadith"] if not x.get("paraphrase")):
    sys.exit(1)
