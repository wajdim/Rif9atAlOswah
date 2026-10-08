# يشغّل diacritize-prose.py على 7 عمال متوازين: المرحلة 1 النصوص، والمرحلة 2 الكلمات المفردة.
# الاستخدام: python run-parallel.py <catt_dir> <work_dir>   (work_dir فيه prose.json و words.json)
import subprocess, os, sys
CATT, WORK = sys.argv[1], sys.argv[2]
HERE = os.path.dirname(os.path.abspath(__file__))
SHARDS = os.path.join(WORK, "shards"); os.makedirs(SHARDS, exist_ok=True)
env = dict(os.environ, PYTHONIOENCODING="utf-8", CATT_THREADS="4")
N = 7

def phase(src, prefix):
    ps = [subprocess.Popen([sys.executable, os.path.join(HERE, "diacritize-prose.py"), CATT, os.path.join(WORK, src),
                            os.path.join(SHARDS, f"{prefix}-{i}.json"), str(i), str(N)],
                           stdout=open(os.path.join(SHARDS, f"log-{prefix}-{i}.txt"), "w", encoding="utf-8"),
                           stderr=subprocess.STDOUT, env=env) for i in range(N)]
    return [p.wait() for p in ps]

print("strings", phase("prose.json", "out"), flush=True)
print("words", phase("words.json", "words"), flush=True)
