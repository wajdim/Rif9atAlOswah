# رِفقة الأُسوة — تشكيل من المصادر: يطابق نصوص التطبيق مع المصحف (Tanzil) وكتب الحديث التسعة المشكولة
# (Open-Hadith-Data: البخاري، مسلم، أبو داود، الترمذي، النسائي، ابن ماجه، الموطأ، مسند أحمد، الدارمي)
# ويأخذ ضبط المصدر حرفًا بحرف لكل كلمة وُجدت فيه ضمن سلسلة متطابقة (كلمتان فأكثر).
#
# الاستخدام: python source-match.py <ohd_dir> <out_dir>
#   المدخلات: build/tashkeel/cache/quran-simple.json، hadith-tashkeel*.json (ضبطي اليدوي كبديل)،
#             prose-tashkeel.json (التشكيل الآلي للشرح)، ونصوص التطبيق عبر node.
#   المخرجات: source-hadith.json {معرّف الحديث: نص مشكول}، prose-sourced.json {نص: نص مشكول}،
#             source-report.json (نسبة التغطية من المصادر لكل نص).
import json, re, sys, os, csv, glob, subprocess
csv.field_size_limit(10**9)
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
OHD, OUTD = sys.argv[1], sys.argv[2]

DIAC = "ًٌٍَُِّْٰ"
WAQF = re.compile(r"[ۖ-ۭ‎‏۞]")
def lk(c):
    if c in "أإآٱا": return "ا"
    if c in "ىي": return "ي"
    if c in "ؤئء": return "ء"
    if c == "ة": return "ه"
    return c
def is_letter(c): return "ء" <= c <= "ي" or c == "ٱ"
def word_letters_marks(w):
    """حروف الكلمة (موحّدة للمقارنة) وحركات كل حرف"""
    keys, marks = [], []
    for c in w:
        if is_letter(c) and c != "ـ": keys.append(lk(c)); marks.append("")
        elif c in DIAC and marks: marks[-1] += c
    return "".join(keys), marks
WORD = re.compile(r"[ء-يٱً-ْٰـ]+")

# ---------- نصوص التطبيق ----------
data = json.loads(subprocess.check_output(["node", "-e", r'''
const G=require(process.argv[1])(process.argv[2]); const H={};
G.HADITH_LIB.forEach(h=>H[h.id]=h.t);
G.SITUATIONS.forEach(s=>(s.hadithRefs||[]).forEach((h,i)=>H[s.id+"#"+i]=h.text));
process.stdout.write(JSON.stringify(H));''', os.path.join(ROOT, "build", "tests", "load.js"), os.path.join(ROOT, "js")], encoding="utf-8"))
manual = {}
for f in glob.glob(os.path.join(HERE, "hadith-tashkeel*.json")): manual.update(json.load(open(f, encoding="utf-8")))
prose = json.load(open(os.path.join(HERE, "prose-tashkeel.json"), encoding="utf-8"))

def words_of(text):
    return [(m.start(), m.end(), word_letters_marks(m.group())[0]) for m in WORD.finditer(text)]

# ---------- أزواج الكلمات المطلوبة (للفهرسة الانتقائية) ----------
need = set()
def add_pairs(text):
    ws = [w[2] for w in words_of(text) if w[2]]
    for i in range(len(ws) - 1): need.add(ws[i] + " " + ws[i + 1])
for t in data.values(): add_pairs(t)
QUOTE = re.compile(r"«([^»]+)»|﴿([^﴾]+)﴾")
for t in prose:
    for m in QUOTE.finditer(t): add_pairs(m.group(1) or m.group(2))

# ---------- المصادر ----------
corpora = []   # (name, words[(key, vocal_word)], index{pair: [pos]})
def add_corpus(name, docs):
    words = []
    for d in docs:
        d = WAQF.sub(" ", d.replace("۞", " "))
        for m in WORD.finditer(d):
            k, _ = word_letters_marks(m.group())
            if k: words.append((k, m.group()))
        words.append(("|", ""))                     # فاصل بين النصوص
    idx = {}
    for i in range(len(words) - 1):
        p = words[i][0] + " " + words[i + 1][0]
        if p in need: idx.setdefault(p, []).append(i)
    corpora.append((name, words, idx))
    print(f"  {name}: {len(words):,} كلمة، {len(idx):,} زوجًا مطلوبًا", flush=True)

quran = json.load(open(os.path.join(HERE, "cache", "quran-simple.json"), encoding="utf-8"))
add_corpus("القرآن (Tanzil)", [a for s in quran for a in s])
for f in sorted(glob.glob(os.path.join(OHD, "*", "*mushakkala*.csv"))):
    rows = [r[1] for r in csv.reader(open(f, encoding="utf-8")) if len(r) > 1]
    add_corpus(os.path.basename(os.path.dirname(f)), rows)

def longest_at(ws, i, prefer_quran):
    """أطول سلسلة كلمات متطابقة تبدأ من الكلمة i في أي مصدر"""
    if i + 1 >= len(ws): return 0, None
    pair = ws[i] + " " + ws[i + 1]
    best = (0, None)
    order = corpora if prefer_quran else corpora[1:] + corpora[:1]
    for name, words, idx in order:
        for p in idx.get(pair, ())[:400]:
            n = 0
            while i + n < len(ws) and p + n < len(words) and words[p + n][0] == ws[i + n]: n += 1
            if n > best[0]: best = (n, (name, words, p))
        if best[0] >= len(ws) - i: break
    return best

def source_marks(text, ranges=None, min_run=3, prefer_quran=False):
    """حركات كل حرف من المصادر (None إن لم يُغطَّ) — ranges: مقاطع النص المسموح بمطابقتها"""
    toks = words_of(text)
    per_word = [None] * len(toks); covered_from = [None] * len(toks)
    spans = ranges or [(0, len(text))]
    for (a, b) in spans:
        ids = [j for j, t in enumerate(toks) if t[0] >= a and t[1] <= b and t[2]]
        ws = [toks[j][2] for j in ids]
        i = 0
        while i < len(ws):
            n, hit = longest_at(ws, i, prefer_quran)
            need_n = min_run if len(ws) > min_run else max(2, len(ws))
            if hit and n >= need_n:
                name, words, p = hit
                for k in range(n):
                    _, marks = word_letters_marks(words[p + k][1])
                    per_word[ids[i + k]] = marks; covered_from[ids[i + k]] = name
                i += n
            else: i += 1
    return toks, per_word, covered_from

def fallback_marks(text, vocal):
    """حركات كل كلمة من نص مشكول سابق (يدوي أو آلي) إن تطابقت حروفه"""
    if not vocal: return None
    a, b = words_of(text), [word_letters_marks(m.group()) for m in WORD.finditer(vocal)]
    b = [x for x in b if x[0]]
    a2 = [t for t in a if t[2]]
    if [t[2] for t in a2] != [x[0] for x in b]: return None
    out, j = [], 0
    for t in a:
        if t[2]: out.append(b[j][1]); j += 1
        else: out.append(None)
    return out

def render(text, toks, per_word, fb):
    out, last = [], 0
    for j, (s, e, k) in enumerate(toks):
        out.append(text[last:s]); last = e
        marks = per_word[j] if per_word[j] is not None else (fb[j] if fb and fb[j] is not None else None)
        w = text[s:e]
        if marks is None: out.append(w); continue
        base = "".join(c for c in w if c not in DIAC and c != "ـ"); r, li = "", 0
        for c in base:
            r += c
            if is_letter(c): r += marks[li] if li < len(marks) else ""; li += 1
        out.append(r)
    out.append(text[last:])
    return "".join(out)

# ---------- الأحاديث ----------
report = {}
src_hadith = {}
for hid, text in data.items():
    t2 = text.replace("ﷺ", " ﷺ ")
    toks, pw, frm = source_marks(text, min_run=3)
    fb = fallback_marks(text, manual.get(hid)) or fallback_marks(text, None)
    src_hadith[hid] = render(text, toks, pw, fb)
    nw = sum(1 for t in toks if t[2]); ns = sum(1 for x in pw if x is not None)
    report[hid] = {"words": nw, "from_source": ns, "books": sorted({f for f in frm if f})}
json.dump(src_hadith, open(os.path.join(OUTD, "source-hadith.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)

# ---------- الشواهد داخل الشرح «…» و﴿…﴾ ----------
prose_out, qcount = {}, 0
for plain, vocal in prose.items():
    ranges = [(m.start(), m.end()) for m in QUOTE.finditer(plain)]
    if not ranges: continue
    toks, pw, frm = source_marks(plain, ranges, min_run=2, prefer_quran=True)
    if not any(x is not None for x in pw): continue
    prose_out[plain] = render(plain, toks, pw, fallback_marks(plain, vocal)); qcount += 1
json.dump(prose_out, open(os.path.join(OUTD, "prose-sourced.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
json.dump(report, open(os.path.join(OUTD, "source-report.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)

tw = sum(r["words"] for r in report.values()); ts = sum(r["from_source"] for r in report.values())
full = sum(1 for r in report.values() if r["words"] and r["from_source"] == r["words"])
print(f"hadith: {len(report)} نصًا، {ts}/{tw} كلمة من المصادر ({100*ts/max(1,tw):.0f}%)، مغطى بالكامل: {full}")
print(f"prose quotes sourced in {qcount} نصًا")
