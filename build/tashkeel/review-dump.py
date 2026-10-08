# يطبع دفعة من النصوص الشارحة المشكولة للمراجعة اليدوية: python review-dump.py <من> <عدد>
import json, sys, os
H = os.path.dirname(os.path.abspath(__file__))
order = json.load(open(os.path.join(H, "review-order.json"), encoding="utf-8"))
fin = json.load(open(os.path.join(H, "prose-final.json"), encoding="utf-8"))
a, n = int(sys.argv[1]), int(sys.argv[2])
for i in range(a, min(len(order), a + n)):
    v = fin.get(order[i])
    print(f"{i}|{v if v else '—(لم يُشكَّل بعد)'}")
