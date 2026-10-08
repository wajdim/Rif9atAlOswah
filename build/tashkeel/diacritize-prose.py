# رِفقة الأُسوة — تشكيل آلي للنصوص الشارحة (غير القرآن والحديث) بنموذج CATT (abjadai/catt، رخصة MIT)
# الاستخدام: python diacritize-prose.py <catt_dir> <prose.json> <out.json>
#   prose.json: قائمة النصوص الأصلية. out.json: {النص الأصلي: النص المشكول}
# يُغذّى النموذج بالنص بلا حركات، ثم تُنقل الحركات حرفًا بحرف إلى النص الأصلي (فتبقى علامات الترقيم
# والأقواس والأرقام كما هي). أي نص لا تتطابق حروفه مع ناتج النموذج يُترك بلا تشكيل.
import json, re, sys, os, time

CATT, SRC, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
SHARD, NSHARDS = (int(sys.argv[4]), int(sys.argv[5])) if len(sys.argv) > 5 else (0, 1)   # تشغيل متوازٍ
sys.path.insert(0, CATT); os.chdir(CATT)
import onnxruntime as ort
_IS = ort.InferenceSession
def _limited(path, sess_options=None, **kw):
    so = sess_options or ort.SessionOptions(); so.intra_op_num_threads = int(os.environ.get("CATT_THREADS", "4"))
    return _IS(path, so, **kw)
ort.InferenceSession = _limited
from catt_models_onnx import CATTEncoderDecoder
model = CATTEncoderDecoder(encoder_path="onnx_models/encoder.onnx", decoder_path="onnx_models/decoder.onnx")

DIAC = re.compile(r"[ً-ْٰ]")
LET = re.compile(r"[ء-يٱ]")
def key(ch):
    if ch in "أإآٱا": return "ا"
    if ch in "ىي": return "ي"
    if ch in "ؤئء": return "ء"
    if ch == "ة": return "ه"
    return ch

def transfer(orig, vocal):
    """ينقل حركات vocal إلى حروف orig. يعيد None إن لم تتطابق الحروف."""
    marks = []                                  # حركات كل حرف في ناتج النموذج بالترتيب
    letters = []
    for ch in vocal:
        if LET.match(ch): letters.append(key(ch)); marks.append("")
        elif DIAC.match(ch) and marks: marks[-1] += ch
    base = DIAC.sub("", orig).replace("ـ", "")
    olet = [key(c) for c in base if LET.match(c)]
    if olet != letters: return None
    out, i = [], 0
    for ch in base:
        out.append(ch)
        if LET.match(ch): out.append(marks[i]); i += 1
    return "".join(out)

def chunks(text):
    """مقاطع ≤ 300 حرف تُقطع بعد علامات الترقيم مع الإبقاء على كل حرف ومسافة (فإعادة الجمع تعيد النص نفسه)"""
    cuts = [m.end() for m in re.finditer(r"[.!؟?؛:،,\n«»()﴿﴾—-]\s*", text)]
    out, start, last = [], 0, 0
    for c in cuts + [len(text)]:
        if c - start > 300 and last > start: out.append(text[start:last]); start = last
        last = c
    out.append(text[start:])
    return [x for x in out if x]

texts = json.load(open(SRC, encoding="utf-8"))
done = json.load(open(OUT, encoding="utf-8")) if os.path.exists(OUT) else {}
todo = [t for i, t in enumerate(texts) if i % NSHARDS == SHARD and t not in done]
print("total", len(texts), "todo", len(todo), flush=True)
t0 = time.time(); fail = 0
B = 8
for bi in range(0, len(todo), B):
    batch = todo[bi:bi + B]
    pieces, owners = [], []
    for ti, t in enumerate(batch):
        for c in chunks(t):
            plain = " ".join(re.findall(r"[ء-يٱ]+", DIAC.sub("", c).replace("ـ", "")))
            pieces.append((c, plain)); owners.append(ti)
    inputs = [p[1] if p[1] else "ا" for p in pieces]
    voc = model.do_tashkeel_batch(inputs, 8, False)
    res = [""] * len(batch); ok = [True] * len(batch)
    for (c, plain), v, ti in zip(pieces, voc, owners):
        if not plain: res[ti] += c; continue
        tv = transfer(c, v)
        if tv is None: ok[ti] = False
        else: res[ti] += tv
    for t, r, good in zip(batch, res, ok):
        if good: done[t] = r
        else: fail += 1
    json.dump(done, open(OUT, "w", encoding="utf-8"), ensure_ascii=False)
    print(f"{bi + len(batch)}/{len(todo)}  {time.time() - t0:.0f}s  fail={fail}", flush=True)
print("DONE", len(done), "fail", fail)
