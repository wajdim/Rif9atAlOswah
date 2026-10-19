# Text helpers shared by the builders: locate an excerpt in a source narration and clean it for display.
import re
from kbsrc import toks

WORD = re.compile(r"[ء-يٱً-ْٰ]+")
def tokens_with_spans(text):
    out = []
    for m in WORD.finditer(text):
        t = toks(m.group(0))
        if t: out.append((t[0], m.start(), m.end()))
    return out

def lcs_span(q, src):
    """positions in src of the in-order match of q (DP with backtrack) → (first, last, matched)"""
    n, m = len(q), len(src)
    dp = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n - 1, -1, -1):
        for j in range(m - 1, -1, -1):
            dp[i][j] = dp[i + 1][j + 1] + 1 if q[i] == src[j] else max(dp[i + 1][j], dp[i][j + 1])
    i = j = 0; pos = []
    while i < n and j < m:
        if q[i] == src[j]: pos.append(j); i += 1; j += 1
        elif dp[i + 1][j] >= dp[i][j + 1]: i += 1
        else: j += 1
    return (pos[0], pos[-1], len(pos)) if pos else (None, None, 0)

def compact_span(q, src):
    """the shortest window of src that matches the most quote words in order (greedy from each plausible start),
    so a word repeated earlier in the narrative does not drag the excerpt back into the story"""
    best = (None, None, 0)
    starts = [j for j, w in enumerate(src) if w in q[:3]]
    for j0 in starts:
        i, j, got, first, last = 0, j0, 0, None, None
        while i < len(q) and j < len(src):
            k = j
            while k < len(src) and k - j <= 12 and src[k] != q[i]: k += 1   # look ahead a little for the next quote word
            if k < len(src) and src[k] == q[i]:
                got += 1; first = k if first is None else first; last = k; j = k + 1
            i += 1
        if first is None: continue
        if got > best[2] or (got == best[2] and best[0] is not None and last - first < best[1] - best[0]): best = (first, last, got)
    return best

def anchor_span(stoks, a_from, a_to):
    f, t = toks(a_from), toks(a_to)
    words = [w for w, _, _ in stoks]
    for i in range(len(words)):
        if words[i:i + len(f)] == f:
            for j in range(i + max(0, len(f) - len(t)), len(words)):
                if words[j:j + len(t)] == t: return i, j + len(t) - 1
    return None

def clean(excerpt):
    s = excerpt.replace("صلى الله عليه وسلم", "ﷺ").replace("‏", "").replace("‎", "")
    s = re.sub(r"[\"“”]", "", s)
    s = s.replace("{", "﴿").replace("}", "﴾")                       # Qur'an quoted inside the hadith
    if s.count("﴿") != s.count("﴾"): s = s.replace("﴿", "").replace("﴾", "")   # cut through by the excerpt
    s = re.sub(r"﴿\s+", "﴿", re.sub(r"\s+﴾", "﴾", s))
    s = re.sub(r"\s+([،.؛:؟!])", r"\1", s)
    s = re.sub(r"\s+", " ", s).strip(" .،:؛-")
    return s

