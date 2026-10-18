# Downloads the hadith sources used by verify.py into build/kb/cache/ (git-ignored). Build time only.
# Usage: python -I build/kb/fetch.py
import os, sys, urllib.request
sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__)); CACHE = os.path.join(HERE, "cache")
API = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/%s.min.json"
HJ = "https://raw.githubusercontent.com/AhmedBaset/hadith-json/main/db/by_book/%s.json"
OHD = "https://raw.githubusercontent.com/mhashim6/Open-Hadith-Data/master/%s"
FILES = {}
for b in ["bukhari", "muslim", "abudawud", "tirmidhi", "nasai", "ibnmajah", "malik", "nawawi", "qudsi"]:
    for e in ("ara-", "eng-"): FILES[e + b + ".json"] = API % (e + b)
for f in ["other_books/aladab_almufrad", "other_books/riyad_assalihin", "other_books/mishkat_almasabih", "other_books/bulugh_almaram",
          "other_books/shamail_muhammadiyah", "the_9_books/ahmed", "the_9_books/darimi", "the_9_books/bukhari", "the_9_books/muslim",
          "the_9_books/abudawud", "the_9_books/tirmidhi", "the_9_books/nasai", "the_9_books/ibnmajah", "the_9_books/malik"]:
    FILES["hj/" + f.split("/")[1] + ".json"] = HJ % f
FILES["ohd/ahmad.csv"] = OHD % "Musnad_Ahmad_Ibn-Hanbal/musnad_ahmad_ibn-hanbal_ahadith_mushakkala.utf8.csv"
for name, url in FILES.items():
    dest = os.path.join(CACHE, name)
    if os.path.exists(dest) and os.path.getsize(dest) > 0: continue
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    print("↓", name)
    urllib.request.urlretrieve(url, dest)
print("sources ready in", CACHE)
