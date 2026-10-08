# توحيد التشكيل: ترتيب الحركات (الشدة أولًا) + قاعدة التقاء الساكنين قبل همزة الوصل
import re
SH, SUK = "ّ", "ْ"
VOW = "ًٌٍَُِ"
def order_marks(t):
    # كل حرف: الشدة ثم الحركة
    return re.sub(r"([ً-ِْٰ]+)ّ", lambda m: SH + m.group(1), t)
WORD = re.compile(r"[ء-يٱً-ْٰ]+")
def starts_wasl(w):
    # همزة وصل: ال، أو ألف بلا همزة يليها ساكن (افعل، استفعل، ابن، اسم، امرأة...)
    b = re.sub(r"[ً-ْٰ]", "", w)
    if b.startswith(("وال", "فال")): return False          # الواو/الفاء متحركة قبلها
    return b.startswith("ال") or (len(w) > 1 and w[0] == "ا" and (len(w) < 3 or w[1] not in VOW))
def sandhi(t):
    """كلمة آخرها سكون تليها همزة وصل: مِنْ → مِنَ، وغيرها بالكسر (عَنِ، لَمِ، قُلِ، هُمُ/كُمُ بالضم)"""
    toks = list(WORD.finditer(t)); out = list(t)
    for a, b in zip(toks, toks[1:]):
        between = t[a.end():b.start()]
        if between.strip() not in ("",): continue            # فقط عند الاتصال المباشر (بلا ترقيم)
        w = a.group()
        if not w.endswith(SUK) or not starts_wasl(b.group()): continue
        base = re.sub(r"[ً-ْٰ]", "", w)
        nb = re.sub(r"[ً-ْٰ]", "", b.group())
        if base == "من" and len(w) > 1 and w[1] == "ِ": rep = "َ" if nb.startswith("ال") else "ِ"   # مِنَ الْ… / مِنِ اتِّخَاذِ (ومَنْ → مَنِ)
        elif re.search(r"(هم|كم|تم)$", base) and w[-2] != "ي": rep = "ُ"   # هُمُ كُمُ تُمُ
        else: rep = "ِ"
        out[a.end() - 1] = rep
    return "".join(out)
def normalize(t): return sandhi(order_marks(t))
