# Vowel marks for hadith texts, copied from the diacritised source edition (never generated):
# a word takes the marks of the same word in the matched source narration, only inside runs of 3+ consecutive matching words.
# Words not found in the source stay unmarked. Output: build/tashkeel/hadith-tashkeel-kb.json {id: text}, which
# build/tashkeel/build-tashkeel.js picks up (it accepts a text only if its letters equal the original's).
# Usage: python -I build/kb/vocalize.py   (after verify.py; only ids whose current tashkeel is missing are written)
import json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kbsrc import *
sys.stdout.reconfigure(encoding="utf-8")

LETTERS = re.compile(r"[ء-يٱ]+[ً-ْٰء-يٱ]*")
DI = re.compile(r"[ً-ْٰ]")
def bare(w): return DI.sub("", w)
def key(w):
    w = bare(w)
    w = re.sub("[أإآٱ]", "ا", w).replace("ى", "ي").replace("ة", "ه")
    return w

WORD = re.compile(r"[ء-يٱً-ْٰ]+")
PUNCT = "،؛:.!?؟«»\"“”()…-—"
def boundary_before(t, k):
    k -= 1
    while k >= 0 and t[k] == " ": k -= 1
    return k < 0 or t[k] in PUNCT
def boundary_after(t, k):
    while k < len(t) and t[k] == " ": k += 1
    return k >= len(t) or t[k] in PUNCT
def vocalize(app_text, src_text):
    """marks are copied only inside runs of 3+ consecutive words that appear in the same order in the source,
    so case endings come with their real context (a lone word could carry the wrong ending)"""
    src = [w for w in WORD.findall(src_text)]
    sk = [key(w) for w in src]
    app = list(WORD.finditer(app_text))
    ak = [key(m.group(0)) for m in app]
    pos = {}
    for j, k in enumerate(sk): pos.setdefault(k, []).append(j)
    take = {}
    i = 0
    while i < len(app):
        best = (0, None)
        for j in pos.get(ak[i], []):
            n = 0
            while i + n < len(app) and j + n < len(src) and ak[i + n] == sk[j + n]: n += 1
            if n > best[0]: best = (n, j)
        if best[0] >= 3:
            n = best[0]
            for t in range(n):
                # a run's edge words depend on context outside the run (case ending after «عن»/«قال», active vs passive
                # «أَنزَل/أُنزِل»): marked only where the run meets a clause boundary in the app's text
                if t == 0 and not boundary_before(app_text, app[i].start()): continue
                if t == n - 1 and not boundary_after(app_text, app[i + t].end()): continue
                take[i + t] = src[best[1] + t]
            i += n
        else: i += 1
    out, last = [], 0
    for idx, m in enumerate(app):
        out.append(app_text[last:m.start()])
        w, v = m.group(0), take.get(idx)
        if v and not DI.search(w) and len([c for c in v if not DI.match(c)]) == len(w):
            # transfer marks letter by letter, keeping the app's own letter forms
            r, k = [], 0
            for c in v:
                if DI.match(c): r.append(c)
                else: r.append(w[k]); k += 1
            w = "".join(r)
        out.append(w); last = m.end()
    out.append(app_text[last:])
    return "".join(out)

if __name__ == "__main__":
    report = json.load(open(os.path.join(HERE, "report.json"), encoding="utf-8"))
    app = load_app()
    texts = {h["id"]: h["t"] for h in app["hadith"]}; texts.update({h["id"]: h["text"] for h in app["sitHadith"]})
    have = {}
    TK = os.path.join(ROOT, "build", "tashkeel")
    for f in os.listdir(TK):
        if re.match(r"^hadith-tashkeel(?!-kb).*\.json$", f) or f in ("hadith-final.json", "source-hadith.json"):
            have.update(json.load(open(os.path.join(TK, f), encoding="utf-8")))
    colls, out = {}, {}
    for x in report["hadith"]:
        i = x["id"]
        if x["status"] not in ("verified", "summary") or not x.get("matchedBook"): continue
        old = have.get(i)
        if old and key("".join(re.findall(r"[ء-يٱ]", old))) == key("".join(re.findall(r"[ء-يٱ]", texts[i]))): continue
        b = x["matchedBook"]
        if b not in colls: colls[b] = Collection(b)
        its = colls[b].at(x["matchedNum"])
        if not its: continue
        v = vocalize(texts[i], " ".join(it["ar"] for it in its))
        if v != texts[i]: out[i] = v
    path = os.path.join(TK, "hadith-tashkeel-kb.json")
    prev = json.load(open(path, encoding="utf-8")) if os.path.exists(path) else {}
    prev.update(out)
    json.dump(prev, open(path, "w", encoding="utf-8", newline="\n"), ensure_ascii=False, indent=0)
    print("vocalised from source:", len(out), sorted(out)[:10])
