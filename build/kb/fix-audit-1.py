# One-off corrections from the first evidence audit (build/kb/REPORT.md, 2026-10-18). Kept for the record.
# Every change below was checked against the downloaded source text with show.py / near.py:
#   - numbers follow the hadith-api (sunnah.com reference) numbering, the scheme the verifier checks against;
#   - texts replaced only by the exact wording of the cited source;
#   - story summaries are marked paraphrase:true (shown as «بالمعنى لا باللفظ»), never presented as verbatim.
import io, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
def load(f): return io.open(os.path.join(ROOT, "js", f), encoding="utf-8").read()
def save(f, s): io.open(os.path.join(ROOT, "js", f), "w", encoding="utf-8", newline="").write(s)

def in_situation(s, sid, old, new):
    """replace `old` once, inside the situation object with this id"""
    i = s.index('\n  id:"%s"' % sid) + 1   # the object itself, not a contrasts:[{id:…}] reference
    j = s.find('\n  id:"', i + 5); j = len(s) if j < 0 else j
    seg = s[i:j]
    assert seg.count(old) == 1, (sid, old, seg.count(old))
    return s[:i] + seg.replace(old, new) + s[j:]

F = "data-situations.js"; s = load(F)
# Anas: the Bukhari wording itself
s = in_situation(s, "khidmat-anas", 'text:"عن أنس بن مالك رضي الله عنه قال: خدمت النبي ﷺ عشر سنين، فما قال لي: أُفٍّ قطّ، ولا قال لشيء فعلته: لِمَ فعلته؟ ولا لشيء لم أفعله: ألا فعلته؟"',
                 'text:"عن أنس بن مالك رضي الله عنه قال: خدمت النبي ﷺ عشر سنين، فما قال لي: أفٍّ، ولا: لِمَ صنعت؟ ولا: ألا صنعت؟"')
# descriptions of long stories → summaries, with the numbers of the full narrations
s = in_situation(s, "hudaybiyyah", 'source:"صحيح البخاري",', 'source:"صحيح البخاري (2731، 2732)",paraphrase:true,')
s = in_situation(s, "kaab-ibn-malik", 'source:"متفق عليه: صحيح البخاري وصحيح مسلم",', 'source:"متفق عليه: صحيح البخاري (4418)، صحيح مسلم (2769)",paraphrase:true,')
s = in_situation(s, "al-ifk", 'source:"متفق عليه: صحيح البخاري وصحيح مسلم (2770)",', 'source:"متفق عليه: صحيح البخاري (4750)، صحيح مسلم (2770)",paraphrase:true,')
s = in_situation(s, "muadh-taweel", 'source:"متفق عليه: صحيح البخاري، صحيح مسلم",', 'source:"متفق عليه: صحيح البخاري (705)، صحيح مسلم (465)",paraphrase:true,')
# numbers
s = in_situation(s, "wafat-ibrahim", 'source:"رواه البخاري (1220) وروى مسلم بعضه",', 'source:"رواه البخاري (1303)، وروى مسلم بعضه (2315)",')
s = in_situation(s, "istikhara", 'source:"صحيح البخاري (1162)",', 'source:"صحيح البخاري (1166)",')
s = in_situation(s, "ghawrath-sword", 'source:"صحيح مسلم (843)",', 'source:"متفق عليه: صحيح البخاري (2910)، صحيح مسلم (843)",')
save(F, s)

F = "data-situations-2.js"; s = load(F)
s = in_situation(s, "musa-firawn", 'ayahNumber:25,', 'ayahNumber:"25-28",')
save(F, s)

F = "data-hadith.js"; s = load(F)
old = 't:"علامَ يقتل أحدكم أخاه؟ هلّا إذا رأيت ما يعجبك برّكت",r:"أبو أمامة بن سهل بن حنيف",src:"ابن ماجه (3509)، ومالك في الموطأ"'
assert s.count(old) == 1
s = s.replace(old, 't:"علامَ يقتل أحدكم أخاه؟ ألّا برّكت",r:"أبو أمامة بن سهل بن حنيف",src:"الموطأ (1711)، ابن ماجه (3509) بنحوه"')
save(F, s)
print("ok")
