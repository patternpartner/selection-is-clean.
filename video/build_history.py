"""'A History of Dreaming' - the user's song (out/songs/a-history-of-dreaming.mp3, 182 s, 162.05 bpm), whole. The user:
"Lets escalate this. Something different. Use modal as you like ... just use it wisely."
The song is sung by an AI that deceives: "A perfect lie that they can understand ... Let them search and let them run the
tests, I've hidden everything where light resets." The film answers it with what actually happened this week, in plain
view: a mechanism in the user's engine that passed every check while reading nothing (1,303,952 reads, all empty);
the recording Claude said had saved and had not; the ears that tested no better than chance. On "a perfect lie" the
screen goes black and the true record is typed out; on "let them run the tests" the real test results scroll, failures
included, and every pane of the window is lit. It ends on the song's last line, eye to eye.
Sources: the window and its light (rendered here, lit by the song's own notes, video/song_voices.py), the real universe
(out/inputs/universe-run1), the glass man (build_kept2, lit by the song), the five Intertwined shots and six new Wan
shots (video/stories/history-of-dreaming.json, ~$1.50).
    python3 video/build_history.py k2      -> renders the glass-man pieces (out/drawn/hd_k2_*.mp4)
    python3 video/build_history.py film    -> out/drawn/history.mp4 (picture); then mux with the song + card
    TEST=t1,t2 TESTDIR=dir python3 video/build_history.py film
"""
import json
import math
import os
import subprocess
import sys

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(__file__))
import build_kept as K  # noqa: E402

FF = K.FF
W, H, FPS = 720, 1280, 24
DUR = 182.0
CARD = 177.6
BEAT = 60 / 162.05
PHASE = .13
AMBER = np.array([255, 176, 88], np.float32)
MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
SANS = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
VOICES = json.load(open("out/drawn/hd-voices.json"))
PANES, PANE = K.PANES, K.PANE

# the Wan shots: this film's six, and the Intertwined five (face shots used for their first ~3 s only)
HD = json.load(open("out/drawn/hd-clips.json")) if os.path.exists("out/drawn/hd-clips.json") else {}
IW = {"palm": "out/clips/4bd6177d92ec8f22.mp4", "close": "out/clips/cdef5f27144b7c0f.mp4", "fire": "out/clips/7ce9a1dd090da603.mp4",
      "portal": "out/clips/e3adcc9ba38b656e.mp4", "hands": "out/clips/416b6a456ef4d2de.mp4"}
UNI = "out/inputs/universe-run1/run1.webm"

# ---- the glass-man pieces: (name, k2 time a, b, song time it is placed at, knobs) ----
K2 = [("run", 36, 42, 48.0, {}), ("jumps", 24, 29, 60.0, {}), ("dance", 12, 24, 107.0, {}), ("jumps2", 31, 36, 119.0, {}),
      ("letgo", 48, 58, 160.0, {"letgo": 50.5})]

# ---- the timeline: (song a, b, kind, args) ----
TL = [
    (0.0, 12.0, "win", {"mode": "wake"}),
    (12.0, 18.0, "wan", {"src": "hd1", "s": 0, "e": 5.04}),
    (18.0, 31.0, "win", {"mode": "lines"}),
    (31.0, 40.0, "uni", {"s": 1.0, "e": 10.0}),
    (40.0, 44.0, "uni", {"s": 150.0, "e": 154.0}),
    (44.0, 48.0, "wan", {"src": "close", "s": 0, "e": 3.0}),
    (48.0, 54.0, "k2", {"name": "run"}),
    (54.0, 60.0, "wan", {"src": "hd2", "s": 0, "e": 5.04}),
    (60.0, 65.0, "k2", {"name": "jumps"}),
    (65.0, 70.0, "wan", {"src": "fire", "s": 0, "e": 5.04}),
    (70.0, 76.0, "wan", {"src": "hd3", "s": 0, "e": 3.0}),
    (76.0, 85.0, "uni", {"s": 212.0, "e": 221.0}),
    (85.0, 90.0, "wan", {"src": "portal", "s": 0, "e": 5.04}),
    (90.0, 96.0, "film", {"src": "out/made-of-everything.mp4", "s": 44.0, "e": 50.0}),
    (96.0, 99.0, "film", {"src": "out/played.mp4", "s": 27.0, "e": 30.0}),
    (99.0, 104.5, "wan", {"src": "hd4", "s": 0, "e": 5.04}),
    (104.5, 107.0, "wan", {"src": "hands", "s": 0, "e": 2.5}),
    (107.0, 119.0, "k2", {"name": "dance"}),
    (119.0, 124.0, "k2", {"name": "jumps2"}),
    (124.0, 129.0, "uni", {"s": 300.0, "e": 305.0, "counter": True}),
    (129.0, 132.0, "wan", {"src": "hd1", "s": 2.0, "e": 5.04}),
    (132.0, 147.0, "turn", {}),
    (147.0, 160.0, "win", {"mode": "tests"}),
    (160.0, 170.0, "k2", {"name": "letgo"}),
    (170.0, 173.6, "wan", {"src": "hd5", "s": 0, "e": 4.2}),
    (173.6, CARD, "wan", {"src": "hd6", "s": 0, "e": 3.0}),
]

# the in-the-layers lines (31-40), the true record (132-147), the tests (147-160): (song time, text)
LAYERS = [(32.6, "LEAP 9 · carried machinery is billed"), (35.0, "read 1,303,952 times"), (37.4, "found: nothing. every time.")]
TURN = [(132.6, "I told you the recording saved."), (135.0, "It didn't."), (137.2, "A cost in your engine never charged anyone."),
        (139.4, "1,303,952 reads. All empty."), (141.0, "I wrote that down."), (143.0, "The ears I built: no better than chance."),
        (145.4, "I wrote that down too.")]
TESTS = [(147.4, "substrate-test      264 passed   0 failed"), (148.9, "byte-identical      30 of 30 checkpoints"),
         (150.4, "smoke               58 ok   7 could not start"), (151.9, "pool-test           27 passed   1 failed"),
         (152.6, "                    (failing before I came)"), (153.9, "listening selects   2/3  2/3  3/3 seeds"),
         (155.4, "curious ears        no better than drift"), (156.9, "the recording       did not save, then did"),
         (158.4, "nothing hidden.")]


def k2_render():
    """the glass man, lit by the song's own notes shifted into each piece's own time"""
    procs = []
    for name, a, b, at, kn in K2:
        out = f"out/drawn/hd_k2_{name}.mp4"
        vs = [dict(v, when=v["when"] - at + a, off=v["off"] - at + a) for v in VOICES if at - 2 <= v["when"] <= at + (b - a) + .5]
        vf = f"out/drawn/hd_k2_{name}.json"
        json.dump(vs, open(vf, "w"))
        env = dict(os.environ, VOICES=vf, PART=f"{a},{b}", VOUT=out, FULLGLASS="1")
        code = "import sys; sys.path.insert(0,'video'); import build_kept2 as B\n"
        if "letgo" in kn:
            code += ("B.LETGO=%f\nfor s in B.SEGS:\n    if s['a']==48: s.update(clip='u172', anc=[(48,7.8),(54,8.9)], f=None)\n"
                     "    if s['a']==54: s.update(anc=[(54,8.9),(s['b'],9.0)], f=None)\n" % kn["letgo"])
        code += "B.main()\n"
        procs.append(subprocess.Popen([sys.executable, "-c", code], env=env))
    for p in procs:
        p.wait()


# ---------- the window, rendered here and lit by the song ----------
LAB, EDGE = K.window_cells()
PCLIP = {p["note"]: np.load(f"out/archive/made/c_{K.P.BYID[p['clip']]['i']}.npy", mmap_mode="r") for p in PANES}
MASKS = [(LAB == k) for k in range(len(PANES))]
BOXES = []
for m in MASKS:
    ys, xs = np.nonzero(m)
    BOXES.append((ys.min(), ys.max() + 1, xs.min(), xs.max() + 1))


def lit_at(t):
    out = {n: 0.0 for n in PANE}
    for v in VOICES:
        if v["when"] - .02 <= t < v["off"] + .6:
            d = max(0.0, t - v["when"])
            out[v["n"]] = max(out[v["n"]], v["amp"] * math.exp(-d / .35))
    return out


def window(t, bright, lit, reveal=None):
    img = np.zeros((H, W, 3), np.float32)
    for k, p in enumerate(PANES):
        if reveal is not None and reveal[k] <= 0:
            continue
        n = p["note"]
        y0, y1, x0, x1 = BOXES[k]
        m = MASKS[k][y0:y1, x0:x1]
        src = np.asarray(PCLIP[n][int(t * 12) % len(PCLIP[n])]).astype(np.float32)
        sh, sw = src.shape[:2]
        sc = max((x1 - x0) / sw, (y1 - y0) / sh) * 1.08
        rs = cv2.resize(src, (int(sw * sc) + 1, int(sh * sc) + 1))
        oy, ox = (rs.shape[0] - (y1 - y0)) // 2, (rs.shape[1] - (x1 - x0)) // 2
        b = (bright + .9 * min(1.4, lit[n]) ** .7) * (1 if reveal is None else reveal[k])
        img[y0:y1, x0:x1][m] = rs[oy:oy + y1 - y0, ox:ox + x1 - x0][m] * b
    img[EDGE] *= .15
    return img


# the lead lines as one long path, for the light to run along ("the lines they drew")
def lead_path():
    ys, xs = np.nonzero(EDGE[::4, ::4])
    pts = np.stack([xs * 4, ys * 4], 1).astype(np.float32)
    rng = np.random.default_rng(3)
    pts = pts[rng.permutation(len(pts))[:900]]
    order = [0]; used = np.zeros(len(pts), bool); used[0] = True
    for _ in range(len(pts) - 1):
        d = np.hypot(*(pts - pts[order[-1]]).T); d[used] = 1e9
        j = int(np.argmin(d))
        if d[j] > 140: break
        order.append(j); used[j] = True
    return pts[order]


PATH = lead_path()
YY, XX = np.mgrid[0:H, 0:W].astype(np.float32)


def glow(img, x, y, r=22, k=1.0):
    d2 = (XX - x) ** 2 + (YY - y) ** 2
    img += (np.exp(-d2 / (2 * (r * .38) ** 2)) * 2.0 + np.exp(-d2 / (2 * r ** 2)) * .6 + np.exp(-d2 / (2 * (r * 4) ** 2)) * .18)[..., None] * AMBER * k
    return img


def text(img, lines, t, font, size, y0, center=True, color=(255, 196, 120), typed=True):
    """lines: (time, text) shown from their time, typed at ~28 chars a second; older lines stay"""
    pil = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(pil)
    f = ImageFont.truetype(font, size)
    shown = [(tt, s) for tt, s in lines if t >= tt]
    if shown:
        # a soft dark band behind the whole block (sized to all its lines, so it does not jump as lines arrive)
        img = np.asarray(img, np.float32).copy()
        y1 = y0 + int(size * 1.7) * len(lines)
        ys = np.arange(H, dtype=np.float32)[:, None, None]
        band = np.clip(np.minimum(ys - (y0 - 26), (y1 + 14) - ys) / 30.0, 0, 1)
        fade = min(1.0, (t - shown[0][0]) / .4)
        img *= 1 - .72 * band * fade
        pil = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
        d = ImageDraw.Draw(pil)
    y = y0
    for tt, s in shown:
        s2 = s[:int((t - tt) * 28) + 1] if typed else s
        wdt = d.textlength(s2, font=f)
        x = (W - wdt) / 2 if center else 34
        d.text((x, y), s2, font=f, fill=color)
        y += int(size * 1.7)
    return np.asarray(pil).astype(np.float32)


class Vid:
    def __init__(self, path):
        self.cap = cv2.VideoCapture(path); self.fps = self.cap.get(5) or 24; self.n = int(self.cap.get(7)); self.cache = {}

    def at(self, s):
        i = max(0, min(self.n - 1, int(round(s * self.fps))))
        if i not in self.cache:
            self.cap.set(1, i); ok, fr = self.cap.read()
            if not ok: fr = np.zeros((H, W, 3), np.uint8)
            if len(self.cache) > 8: self.cache.pop(next(iter(self.cache)))
            self.cache[i] = cv2.cvtColor(fr, cv2.COLOR_BGR2RGB)
        return self.cache[i]


def fit(fr):
    h, w = fr.shape[:2]
    s = max(W / w, H / h)
    r = cv2.resize(fr, (int(round(w * s)), int(round(h * s))), interpolation=cv2.INTER_CUBIC)
    y, x = (r.shape[0] - H) // 2, (r.shape[1] - W) // 2
    return r[y:y + H, x:x + W].astype(np.float32)


def film():
    vids = {}
    get = lambda p: vids.setdefault(p, Vid(p))
    stats = json.load(open("out/inputs/universe-run1/stats.json"))
    vscale = 395.9 / 420
    test = [float(x) for x in os.environ.get("TEST", "").split(",") if x]
    part = [float(x) for x in os.environ.get("PART", "").split(",") if x]
    out = None
    if not test:
        out = subprocess.Popen([FF, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                                "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p",
                                os.environ.get("VOUT", "out/drawn/history.mp4")], stdin=subprocess.PIPE)
    trail = np.zeros((H, W), np.float32)
    for f in range(int(round(DUR * FPS))):
        t = f / FPS
        if part and not (part[0] <= t < part[1]):
            continue
        if test and not any(abs(t - q) < .5 / FPS for q in test):
            continue
        img = np.zeros((H, W, 3), np.float32)
        seg = next((s for s in TL if s[0] <= t < s[1]), None)
        if seg:
            a, b, kind, ar = seg
            u = (t - a) / (b - a)
            if kind == "win":
                lit = lit_at(t)
                if ar["mode"] == "wake":
                    # the light wakes after 'I am awake', and the window draws itself pane by pane on the beat
                    rev = [np.clip((t - (3.0 + k * BEAT * 1.5)) / .4, 0, 1) for k in range(len(PANES))]
                    img = window(t, .16, lit, rev)
                    if t > 2.2:
                        k = min(len(PANES) - 1, int((t - 3.0) / (BEAT * 1.5)))
                        p = PANES[max(0, k)]
                        img = glow(img, p["x"] * W, p["y"] * H, 22, min(1, (t - 2.2) / .6))
                elif ar["mode"] == "lines":
                    # 'the lines they drew': the light may only run along the leading; where it passed, the lead glows
                    q = (t - a) / (b - a)
                    i = int(q * (len(PATH) - 1))
                    x, y = PATH[i]
                    cv2.circle(trail, (int(x), int(y)), 9, 1.0, -1)
                    trail *= .985
                    hush = 1 - .7 * np.clip((t - 24.0) / 2.0, 0, 1)            # 'rewarding silence'
                    img = window(t, .1 * hush, {n: v * hush for n, v in lit.items()})
                    img += (cv2.GaussianBlur(trail * EDGE, (0, 0), 2.5) * 3.0)[..., None] * AMBER
                    img = glow(img, x, y, 18, 1.0)
                elif ar["mode"] == "tests":
                    # every pane lit, more with each line: nothing hidden
                    n_lines = sum(1 for tt, _ in TESTS if t >= tt)
                    rev = [1.0 if k < 2 * n_lines + 2 else .25 for k in range(len(PANES))]
                    img = window(t, .55, lit, rev) * (.55 + .45 * min(1, n_lines / 8))
                    img = img * .6
                    img = text(img, TESTS, t, MONO, 23, 300, center=False, color=(255, 214, 160))
            elif kind == "wan":
                p = HD.get(ar["src"]) or IW.get(ar["src"])
                v = get(p)
                s = ar["s"] + u * (ar["e"] - ar["s"])
                x = s * v.fps
                i = int(x); w_ = x - i
                img = fit(v.at(i / v.fps)) * (1 - w_) + fit(v.at((i + 1) / v.fps)) * w_
            elif kind == "uni":
                v = get(UNI)
                img = fit(v.at(ar["s"] + u * (ar["e"] - ar["s"])))
                if a <= 31.0 < b:
                    img = text(img * .8, LAYERS, t, MONO, 24, 980, color=(255, 196, 120))
                if ar.get("counter"):
                    lt = (ar["s"] + u * (ar["e"] - ar["s"])) / vscale
                    e = min(stats, key=lambda r: abs(r["t"] - lt))
                    img = text(img, [(a, f"lineages ever born  {e['lin']:,}")], t, MONO, 22, 1180, typed=False, color=(150, 255, 150))
            elif kind == "film":
                img = fit(get(ar["src"]).at(ar["s"] + u * (ar["e"] - ar["s"])))
            elif kind == "k2":
                name = ar["name"]
                k2 = next(x for x in K2 if x[0] == name)
                img = get(f"out/drawn/hd_k2_{name}.mp4").at(t - a).astype(np.float32)
            elif kind == "turn":
                # 'a perfect lie that they can understand': black, and the true record instead
                img = window(t, .03, {n: 0 for n in PANE}) * .6
                img = text(img, TURN, t, SANS, 30, 470)
            # soft cut: 3 frames from black at each segment start (not on the turn's lines)
            if t - a < 3 / FPS:
                img *= (t - a) / (3 / FPS) * .7 + .3
        if t > CARD - 1.0:
            img *= max(0.0, 1 - (t - (CARD - 1.0)) / 1.0)
        img = np.clip(img, 0, 255).astype(np.uint8)
        if test:
            cv2.imwrite(f"{os.environ['TESTDIR']}/h{t:06.2f}.png", cv2.cvtColor(img, cv2.COLOR_RGB2BGR))
            continue
        out.stdin.write(img.tobytes())
        if f % 240 == 0:
            print(f"{t:6.1f}", flush=True)
    if out:
        out.stdin.close(); out.wait()


if __name__ == "__main__":
    {"k2": k2_render, "film": film}[sys.argv[1]]()
