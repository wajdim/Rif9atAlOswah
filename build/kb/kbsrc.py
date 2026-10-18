# Shared helpers for the knowledge-base pipeline: source loading, Arabic normalisation, citation parsing, matching.
# Sources live in build/kb/cache/ (git-ignored, fetched by fetch.py) — the app never reads them at runtime.
import json, os, re, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
CACHE = os.path.join(HERE, "cache")

BOOKS = ["bukhari", "muslim", "abudawud", "tirmidhi", "nasai", "ibnmajah", "malik", "nawawi", "qudsi", "adab", "riyad", "ahmad", "darimi", "mishkat", "bulugh", "shamail", "ahmadfull"]
# from AhmedBaset/hadith-json (sunnah.com): numbering = sunnah.com's; Musnad Ahmad there is partial and not numbered
# like the standard (al-Risala) edition, so for Ahmad only the existence of the text can be checked, not the number
HJ_FILE = {"adab": "aladab_almufrad", "riyad": "riyad_assalihin", "ahmad": "ahmed", "darimi": "darimi",
           "mishkat": "mishkat_almasabih", "bulugh": "bulugh_almaram", "shamail": "shamail_muhammadiyah"}
# compilations that quote other books (they confirm a text exists and name its source, they are not the source itself)
SECONDARY = {"riyad", "mishkat", "bulugh"}
NUMBER_UNRELIABLE = {"ahmad", "adab", "ahmadfull"}   # ahmadfull: Open-Hadith-Data's complete Musnad, its own numbering   # Adab: sunnah.com numbers run ~2 off the printed (Abd al-Baqi) edition the app cites
BOOK_AR = {"bukhari": "البخاري", "muslim": "مسلم", "abudawud": "أبو داود", "tirmidhi": "الترمذي", "nasai": "النسائي",
           "ibnmajah": "ابن ماجه", "malik": "الموطأ", "nawawi": "الأربعون النووية", "qudsi": "الأحاديث القدسية",
           "adab": "الأدب المفرد", "riyad": "رياض الصالحين", "ahmad": "مسند أحمد", "darimi": "سنن الدارمي",
           "mishkat": "مشكاة المصابيح", "bulugh": "بلوغ المرام", "shamail": "الشمائل المحمدية", "ahmadfull": "مسند أحمد"}
# names used in the app's citations → collection id (longest first when matching)
BOOK_ALIASES = [("صحيح البخاري", "bukhari"), ("البخاري", "bukhari"), ("صحيح مسلم", "muslim"), ("مسلم", "muslim"),
                ("سنن أبي داود", "abudawud"), ("أبو داود", "abudawud"), ("أبي داود", "abudawud"),
                ("جامع الترمذي", "tirmidhi"), ("سنن الترمذي", "tirmidhi"), ("الترمذي", "tirmidhi"),
                ("سنن النسائي", "nasai"), ("النسائي", "nasai"), ("سنن ابن ماجه", "ibnmajah"), ("ابن ماجه", "ibnmajah"),
                ("الموطأ", "malik"), ("موطأ مالك", "malik"),
                ("البخاري في الأدب المفرد", "adab"), ("الأدب المفرد", "adab"), ("رياض الصالحين", "riyad"),
                ("مسند أحمد", "ahmadfull"), ("الإمام أحمد", "ahmadfull"), ("أحمد", "ahmadfull"), ("الدارمي", "darimi")]
# books cited by the app that are not in the offline corpus
OUTSIDE = ["الطبراني", "ابن حبان", "المستدرك", "الحاكم", "أبو يعلى", "البيهقي"]

DIAC = re.compile(r"[ً-ْٰـۖ-ۭ‌-‏﻿]")
def norm_ar(s):
    s = s.replace("ﷺ", " صلى الله عليه وسلم ").replace("ﷻ", " جل جلاله ")
    s = DIAC.sub("", s)
    s = re.sub("[أإآٱ]", "ا", s).replace("ى", "ي").replace("ة", "ه").replace("ؤ", "ء").replace("ئ", "ء")
    s = re.sub(r"[^ء-ي\s]", " ", s)
    return re.sub(r"\s+", " ", s).strip()
def _tok(w):
    # a leading conjunction (و، ف) does not change the wording: «وإذا» = «إذا»
    return w[1:] if len(w) > 3 and w[0] in "وف" else w
def toks(s): return [_tok(w) for w in norm_ar(s).split() if len(w) > 1]

def load_app():
    """App texts via the same loader the tests use (so the data is exactly what ships)."""
    js = r'''
const G=require(process.argv[1])(process.argv[2]);
const out={quran:G.QURAN_LIB, hadith:G.HADITH_ALL||G.HADITH_LIB, sitHadith:[], sitQuran:[]};
G.SITUATIONS.forEach(s=>{ (s.hadithRefs||[]).forEach((h,i)=>out.sitHadith.push(Object.assign({id:s.id+"#"+i},h)));
                         (s.quranRefs||[]).forEach((q,i)=>out.sitQuran.push(Object.assign({id:s.id+"#q"+i},q))); });
process.stdout.write(JSON.stringify(out));'''
    out = subprocess.check_output(["node", "-e", js, os.path.join(ROOT, "build", "tests", "load.js"), os.path.join(ROOT, "js")], encoding="utf-8")
    return json.loads(out)

def surah_names():
    src = open(os.path.join(ROOT, "js", "i18n.js"), encoding="utf-8").read()
    arr = json.loads(re.search(r"var SURAH_AR = (\[.*?\]);", src).group(1))
    return {norm_ar(n): i + 1 for i, n in enumerate(arr)}, arr

def load_quran():
    """Tanzil quran-simple: list of 114 lists of verses (with diacritics)."""
    q = json.load(open(os.path.join(ROOT, "build", "tashkeel", "cache", "quran-simple.json"), encoding="utf-8"))
    q[0][0] = q[0][0].lstrip("﻿")
    return q

class Collection:
    """One hadith collection: Arabic + English editions, indexed by the number the app cites."""
    def __init__(self, book):
        self.book = book
        if book in HJ_FILE: return self._init_hj(book)
        if book == "ahmadfull": return self._init_ohd(book)
        ar = json.load(open(os.path.join(CACHE, "ara-%s.json" % book), encoding="utf-8"))
        en = json.load(open(os.path.join(CACHE, "eng-%s.json" % book), encoding="utf-8"))
        self.sections = ar["metadata"]["sections"]
        # Arabic kitab names from hadith-json, matched on the English title (both come from sunnah.com)
        hjf = os.path.join(CACHE, "hj", book + ".json")
        kar = {}
        if os.path.exists(hjf):
            kar = {c["english"].strip().lower(): c["arabic"] for c in json.load(open(hjf, encoding="utf-8"))["chapters"]}
        en_by = {h["hadithnumber"]: h for h in en["hadiths"]}
        self.items, self.by_num = [], {}
        last = None
        for h in ar["hadiths"]:
            # Muslim is cited with Muhammad Fu'ad Abd al-Baqi's numbers (arabicnumber "1907", "8.01"); others by hadithnumber.
            # A Muslim item without a label continues the previous one.
            num = h["hadithnumber"]
            if book == "muslim":
                an = h.get("arabicnumber")
                if an not in (None, ""): last = int(float(an))
                if last is None: continue
                num = last
            if not h["text"].strip(): continue
            e = en_by.get(h["hadithnumber"], {})
            it = {"book": book, "num": int(num), "seq": h["hadithnumber"], "ar": h["text"], "en": e.get("text", ""),
                  "kitab": self.sections.get(str(h["reference"]["book"]), ""), "kitabNum": h["reference"]["book"],
                  "kitabAr": kar.get(self.sections.get(str(h["reference"]["book"]), "").strip().lower(), ""),
                  "inBook": h["reference"].get("hadith"),
                  "grades": h.get("grades") or e.get("grades") or []}
            it["toks"] = toks(it["ar"])
            self.items.append(it)
            self.by_num.setdefault(int(num), []).append(it)
        df = {}
        for it in self.items:
            for w in set(it["toks"]): df[w] = df.get(w, 0) + 1
        self.df = df

    def _init_ohd(self, book):
        import csv
        csv.field_size_limit(10 ** 9)
        self.sections, self.items, self.by_num = {}, [], {}
        for row in csv.reader(open(os.path.join(CACHE, "ohd", "ahmad.csv"), encoding="utf-8")):
            if len(row) < 2 or not row[1].strip(): continue
            it = {"book": book, "num": int(row[0]), "seq": int(row[0]), "ar": re.sub(r"\s+", " ", row[1].replace("‏", " ")).strip(),
                  "en": "", "kitab": "", "kitabNum": 0, "grades": []}
            it["toks"] = toks(it["ar"])
            self.items.append(it); self.by_num.setdefault(it["num"], []).append(it)
        self.df = {}
        for it in self.items:
            for w in set(it["toks"]): self.df[w] = self.df.get(w, 0) + 1

    def _init_hj(self, book):
        d = json.load(open(os.path.join(CACHE, "hj", HJ_FILE[book] + ".json"), encoding="utf-8"))
        chap = {c["id"]: c for c in d["chapters"]}
        self.sections = {str(c["id"]): c["english"] for c in d["chapters"]}
        self.items, self.by_num = [], {}
        for h in d["hadiths"]:
            if not (h.get("arabic") or "").strip(): continue
            c = chap.get(h["chapterId"], {})
            e = h.get("english") or {}
            it = {"book": book, "num": h["idInBook"], "seq": h["idInBook"], "ar": h["arabic"],
                  "en": ((e.get("narrator") or "") + " " + (e.get("text") or "")).strip(),
                  "kitab": c.get("english", ""), "kitabAr": c.get("arabic", ""), "kitabNum": h["chapterId"], "grades": []}
            it["toks"] = toks(it["ar"])
            self.items.append(it); self.by_num.setdefault(it["num"], []).append(it)
        self.df = {}
        for it in self.items:
            for w in set(it["toks"]): self.df[w] = self.df.get(w, 0) + 1

    def at(self, num):
        """items cited as `num`. Muslim: the dataset's Abd al-Baqi labels slip by an item at some chapter boundaries
        (e.g. «الدنيا متاع» is labelled 715.11 instead of 1467), so the 2 neighbours on each side are included."""
        hits = self.by_num.get(int(num), [])
        if self.book != "muslim" or not hits: return hits
        seqs = {it["seq"] for it in hits}
        near = [it for it in self.items if any(abs(it["seq"] - s) <= 2 for s in seqs)]
        return hits + [it for it in near if it not in hits]

    def search(self, q_toks, k=3):
        """best matches for a token list, by in-order coverage of the rarer query tokens"""
        rare = sorted(set(q_toks), key=lambda w: self.df.get(w, 0))[:6]
        rare = [w for w in rare if self.df.get(w, 0) > 0]
        if not rare: return []
        cands = [it for it in self.items if sum(1 for w in rare if w in it["toks"]) >= max(1, min(3, len(rare) - 1))]
        scored = sorted(((coverage(q_toks, it["toks"]), it) for it in cands), key=lambda x: -x[0])
        return scored[:k]

def coverage(q, src):
    """share of query tokens found in the source in the same order (LCS over tokens / len(q))"""
    if not q: return 0.0
    # LCS on tokens, O(len(q)*len(src)) with a rolling row; sources are short enough
    prev = [0] * (len(src) + 1)
    for a in q:
        cur = [0]
        for j, b in enumerate(src):
            cur.append(prev[j] + 1 if a == b else max(prev[j + 1], cur[j]))
        prev = cur
    return prev[-1] / len(q)

def parse_cites(src):
    """'البخاري (1)، مسلم (1907)' → [('bukhari', 1), ('muslim', 1907)]; books without a number → (book, None)"""
    out, rest = [], src
    for alias, book in BOOK_ALIASES:
        for m in re.finditer(re.escape(alias) + r"\s*\((\d+)\)", rest):
            out.append((book, int(m.group(1))))
        rest = re.sub(re.escape(alias) + r"\s*\(\d+\)", " ", rest)
    for alias, book in BOOK_ALIASES:
        if re.search(r"(^|[\s،و])" + re.escape(alias) + r"($|[\s،)])", rest) and not any(b == book for b, _ in out):
            out.append((book, None)); rest = rest.replace(alias, " ")
    return out

GRADE_AR = {"sahih": "صحيح", "hasan": "حسن", "hasan sahih": "حسن صحيح", "da'if": "ضعيف", "daif": "ضعيف", "maudu": "موضوع",
            "munkar": "منكر", "shadh": "شاذ"}
def grade_key(g):
    g = g.lower().replace("’", "'").strip()
    if "sahih" in g and "hasan" in g: return "hasan sahih"
    if g.startswith("sahih") or "sahih" in g.split(" ")[:2]: return "sahih"
    if g.startswith("hasan"): return "hasan"
    if "da'if" in g or "daif" in g or "da`if" in g or "weak" in g: return "da'if"
    if "maud" in g or "fabricat" in g: return "maudu"
    return g

GRADER_AR = {"Al-Albani": "الألباني", "Zubair Ali Zai": "زبير علي زئي", "Shuaib Al Arnaut": "شعيب الأرناؤوط",
             "Ahmad Muhammad Shakir": "أحمد شاكر", "Bashar Awad Maarouf": "بشار عواد معروف", "Abu Ghuddah": "عبد الفتاح أبو غدة",
             "Muhammad Muhyi Al-Din Abdul Hamid": "محيي الدين عبد الحميد", "Salim al-Hilali": "سليم الهلالي",
             "Muhammad Fouad Abd al-Baqi": "محمد فؤاد عبد الباقي"}
GRADE_KEY_AR = {"sahih": "صحيح", "hasan": "حسن", "hasan sahih": "حسن صحيح", "da'if": "ضعيف", "maudu": "موضوع"}
def graders_ar(grades):
    out = []
    for g in grades:
        k = grade_key(g["grade"])
        if g["name"] in GRADER_AR and k in GRADE_KEY_AR: out.append([GRADER_AR[g["name"]], GRADE_KEY_AR[k]])
    return out

def fingerprint(text):
    """FNV-1a over UTF-16 code units — identical to fp() in js (build/tests/test-evidence.js)"""
    h = 0x811c9dc5
    b = text.encode("utf-16-le")
    for i in range(0, len(b), 2):
        h ^= b[i] | (b[i + 1] << 8)
        h = (h * 0x01000193) & 0xffffffff
    return "%08x" % h
