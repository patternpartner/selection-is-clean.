"""'The One You Kept' v2. The user on v1: "You can do better." Claude's own critique of v1: the glass was fixed to the
SCREEN and he was a cut-out moving over it (a mask, not a man made of glass); his moves ignored the music (cut on
phrases, slowed whole sections to fit, jumps landing anywhere, slow footage stuttering); and it was dark.
v2: HE IS THE INSTRUMENT. The glass is mapped onto his body (cells defined in his own box, so they move with him), and
the notes run up and down him the way they run up the window - bass at his feet, the melody through his chest, the top
notes in his head; a cell lights when its note sounds, and the light travels over HIM. His moves are TIME-WARPED so his
kinematic beats land on the music's beats (dance: the dips of his head; jumps: the landings; the leap's apex on a beat
as #7 returns); the run plays at real speed and loops at a matching stride; deliberate slow motion blends frames
instead of repeating them. The window stays visible behind him. Same music as v1 (out/drawn/kept.wav, the kept tunes).
    python3 video/build_kept2.py   -> out/drawn/kept2.mp4   (TEST=t1,t2 TESTDIR=dir; PART=a,b VOUT=f)
"""
import json
import math
import os
import subprocess
import sys

import cv2
import numpy as np
from scipy.ndimage import gaussian_filter1d

sys.path.insert(0, os.path.dirname(__file__))
import build_kept as K  # noqa: E402  the music, panes, notes, timing
from bluekey import key  # noqa: E402

W, H, FPS = K.W, K.H, K.FPS
SPB, PHRASE, DUR, T_CARD, LETGO = K.SPB, K.PHRASE, K.DUR, K.T_CARD, K.LETGO
PANES, PANE = K.PANES, K.PANE
MOT = json.load(open(os.path.join(os.path.dirname(__file__), "kept_motion.json")))
AMBER = np.array([255, 176, 88], np.float32)
# knobs for 'Intertwined' (defaults are v2 exactly): no body before NOBODY_UNTIL (the window alone, the light on its
# panes); no glass on him before GLASS_FROM (it arrives with the transformation shot); LETGO is read at run time
NOBODY_UNTIL = 0.0
GLASS_FROM = 0.0
FULLGLASS = bool(int(os.environ.get("FULLGLASS", "0")))   # he is all glass from the first frame


# ---------- 1. time: film seconds -> (clip, clip seconds, mirror) ----------
def _sm(u, field):
    fr = MOT[u]["frames"]
    if field == "top":
        return gaussian_filter1d(np.array([f["box"][1] for f in fr], float), 1.5)
    return gaussian_filter1d(np.array([f["cen"][0] for f in fr], float), 1.5)


def extrema(u, a, b, kind):
    """clip times in [a,b] where the head is LOWEST (a dip or a landing: kind='low') or HIGHEST ('high')"""
    top = _sm(u, "top")
    ia, ib = int(a * 24), int(b * 24)
    out = []
    for i in range(max(ia, 2), min(ib, len(top) - 2)):
        w = top[max(0, i - 5):i + 6]
        if (kind == "low" and top[i] == w.max() and top[i] - w.min() > 25) or (kind == "high" and top[i] == w.min() and w.max() - top[i] > 25):
            out.append(i / 24)
    return out


def snap_warp(fa, fb, ca, cb, events, grid, lo=.55, hi=1.7):
    """anchors (film, clip): the segment's ends, plus each event snapped to the nearest beat of `grid` on the linear map,
    kept only if local speed stays within [lo, hi] - so he lands on the beat without lurching"""
    r = (cb - ca) / (fb - fa)
    anc = [(fa, ca)]
    for c in events:
        f = fa + (c - ca) / r
        f = fa + round((f - fa) / grid) * grid
        pf, pc = anc[-1]
        if f <= pf + .2 or f >= fb - .2:
            continue
        s = (c - pc) / (f - pf)
        if lo <= s <= hi:
            anc.append((f, c))
    if (cb - anc[-1][1]) / (fb - anc[-1][0]) < lo or (cb - anc[-1][1]) / (fb - anc[-1][0]) > hi:
        anc.pop()
    anc.append((fb, cb))
    return anc


def build_timeline():
    segs = []
    # 0-6 the first tune: standing, near still (blended slow motion)
    segs.append(dict(a=0, b=6, clip="u172", anc=[(0, 0.0), (6, 1.9)], mirror=False))
    # 6-12 #3: the arms rise; arms at their highest on the last beat of the phrase
    segs.append(dict(a=6, b=12, clip="u174", anc=[(6, 1.0), (11.25, 2.0), (12, 2.4)], mirror=False))
    # 12-24 #12 with the bass: dancing, each dip of his head on a beat
    segs.append(dict(a=12, b=24, clip="u174", anc=snap_warp(12, 24, 2.4, 14.4, extrema("u174", 2.4, 14.4, "low"), SPB), mirror=False))
    # 24-36 #7, the arpeggios: the jumps, landings on beats; then the same jumps again, mirrored
    segs.append(dict(a=24, b=31.5, clip="u172", anc=snap_warp(24, 31.5, 4.2, 11.6, extrema("u172", 4.2, 11.6, "low"), SPB), mirror=False))
    segs.append(dict(a=31.5, b=36, clip="u172", anc=snap_warp(31.5, 36, 4.3, 8.7, extrema("u172", 4.3, 8.7, "low"), SPB), mirror=True))
    # 36-48 #18 and #39: the run at real speed, looped at a matching stride
    segs.append(dict(a=36, b=42.4, clip="u173", anc=[(36, 2.8), (42.4, 9.2)], mirror=False))
    segs.append(dict(a=42.4, b=48, clip="u173", anc=[(42.4, 3.6), (48, 9.2)], mirror=False))
    # 48-54 #7 returns: the leap, slow, its apex on the third beat
    segs.append(dict(a=48, b=54, clip="u173", anc=[(48, 9.2), (49.5, 10.15), (54, 12.0)], mirror=False))
    # 54-end: standing, grinning, the glass lets go
    segs.append(dict(a=54, b=DUR + .1, clip="u172", anc=[(54, 7.8), (DUR + .1, 8.9)], mirror=False))
    return segs


SEGS = build_timeline()


from scipy.interpolate import PchipInterpolator
for _s in SEGS:   # a smooth monotone curve through the anchors: he eases from beat to beat instead of lurching
    _s["f"] = PchipInterpolator([f for f, c in _s["anc"]], [c for f, c in _s["anc"]]) if len(_s["anc"]) > 2 else None


def clip_time(t):
    for s in SEGS:
        if s["a"] <= t < s["b"]:
            if s["f"] is not None:
                return s["clip"], float(s["f"](t)), s["mirror"], s
            (f0, c0), (f1, c1) = s["anc"]
            return s["clip"], c0 + (c1 - c0) * (t - f0) / (f1 - f0), s["mirror"], s
    return None, None, False, None


# ---------- 2. his body, keyed, blended between frames ----------
class Clip:
    def __init__(self, u):
        self.cap = cv2.VideoCapture(f"out/user-clips/{u}.mp4")
        self.cache = {}

    def frame(self, i):
        if i not in self.cache:
            self.cap.set(cv2.CAP_PROP_POS_FRAMES, i)
            ok, fr = self.cap.read()
            if not ok:
                return self.frame(i - 1)
            rgb = cv2.cvtColor(fr, cv2.COLOR_BGR2RGB).astype(np.float32)
            col, a = key(rgb)
            if len(self.cache) > 6:
                self.cache.pop(next(iter(self.cache)))
            self.cache[i] = (col, a)
        return self.cache[i]

    def at(self, ct):
        x = ct * 24
        i = int(math.floor(x))
        f = x - i
        c0, a0 = self.frame(i)
        if f < .08:
            return c0, a0
        c1, a1 = self.frame(i + 1)
        return c0 * (1 - f) + c1 * f, a0 * (1 - f) + a1 * f


# ---------- 3. the glass on his body: cells in his own box, pitch by height ----------
def body_cells():
    """(u, v, note) seeds in his normalised box: three cells per melody note across a band (D6 at the head,
    D4 at the hips), two per bass note at the legs and feet"""
    mel = [p["note"] for p in PANES if p["midi"] >= 60]
    mel.sort(key=lambda n: -PANE[n]["midi"])
    bass = ["Bb1", "C2", "D2", "F2"]
    rng = np.random.default_rng(4)
    seeds = []
    for k, n in enumerate(mel):
        v = .06 + k * (.6 / (len(mel) - 1))
        for u in (.22, .5, .78):
            seeds.append((u + rng.normal(0, .06), v + rng.normal(0, .012), n))
    for k, n in enumerate(bass):
        v = .72 + .07 * (k % 4)
        for u in (.3, .7):
            seeds.append((u + rng.normal(0, .05), v, n))
    return seeds


SEEDS = body_cells()


def smooth_box(u):
    b = np.array([f["box"] for f in MOT[u]["frames"]], float)
    return np.stack([gaussian_filter1d(b[:, k], 3) for k in range(4)], 1)


BOX = {u: smooth_box(u) for u in MOT}


def main():
    voices = json.load(open(os.environ.get("VOICES", "out/drawn/kept-voices.json")))   # another film can light him with its own notes
    first = {}
    for v in voices:
        first[v["n"]] = min(first.get(v["n"], 1e9), v["when"])
    envref = max(max(p["env"]) for p in PANES) * .55
    lab, edge = K.window_cells()
    pclips = {p["note"]: np.load(f"out/archive/made/c_{K.P.BYID[p['clip']]['i']}.npy", mmap_mode="r") for p in PANES}
    clips = {u: Clip(u) for u in ("u172", "u173", "u174")}
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    test = [float(x) for x in os.environ.get("TEST", "").split(",") if x]
    part = [float(x) for x in os.environ.get("PART", "").split(",") if x]
    out = None
    if not test:
        out = subprocess.Popen([K.FF, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
                                "-i", "-", "-c:v", "libx264", "-crf", "17", "-preset", "slow", "-pix_fmt", "yuv420p",
                                os.environ.get("VOUT", "out/drawn/kept2.mp4")], stdin=subprocess.PIPE)
    tops = {}
    for v in voices:
        k = round(v["when"], 3)
        if k not in tops or PANE[v["n"]]["midi"] > PANE[tops[k]]["midi"]:
            tops[k] = v["n"]
    tops = sorted(tops.items())
    camx = None
    for f in range(int(DUR * FPS)):
        t = f / FPS
        if part and not (part[0] <= t < part[1]):
            continue
        if test and not any(abs(t - q) < .5 / FPS for q in test):
            continue
        lit = {n: 0.0 for n in PANE}
        for v in voices:
            if v["when"] - .02 <= t < v["off"] + 1.2:
                p = PANE[v["n"]]
                kk = int((t - v["when"]) * 60)
                if 0 <= kk < len(p["env"]):
                    rel = math.exp(-(t - v["off"]) / .12) if t > v["off"] else 1
                    lit[v["n"]] = max(lit[v["n"]], v["amp"] * p["env"][kk] / envref * rel)
        # the pane picture for each note at this moment (the same clip the window uses for that note)
        pic = {}
        for n in PANE:
            fr = pclips[n]
            pic[n] = np.asarray(fr[int(max(t - first.get(n, 0), 0) * 12) % len(fr)]).astype(np.float32)
        # the window behind him, visible
        win = np.zeros((H, W, 3), np.float32)
        for k, p in enumerate(PANES):
            n = p["note"]
            m = lab == k
            ys, xs = np.nonzero(m)
            y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
            src = pic[n]
            sh, sw = src.shape[:2]
            sc = max((x1 - x0) / sw, (y1 - y0) / sh) * 1.08
            rs = cv2.resize(src, (int(sw * sc) + 1, int(sh * sc) + 1))
            oy, ox = (rs.shape[0] - (y1 - y0)) // 2, (rs.shape[1] - (x1 - x0)) // 2
            win[y0:y1, x0:x1][m[y0:y1, x0:x1]] = rs[oy:oy + y1 - y0, ox:ox + x1 - x0][m[y0:y1, x0:x1]] * (.14 + .5 * min(1.4, lit[n]) ** .7)
        win[edge] *= .2
        img = win.copy()
        u, ct, mirror, seg = clip_time(t)
        if t < NOBODY_UNTIL:
            u = None
            # the window alone: the light plays its panes, as in Played
            j = max(0, np.searchsorted([x[0] for x in tops], t, "right") - 1)
            A_, B_ = tops[j], tops[min(j + 1, len(tops) - 1)]
            q = 0.0 if B_[0] == A_[0] else min(1, max(0, ((t - A_[0]) / (B_[0] - A_[0]) - .35) / .65))
            q = q * q * (3 - 2 * q)
            lx = (PANE[A_[1]]["x"] * (1 - q) + PANE[B_[1]]["x"] * q) * W
            ly = (PANE[A_[1]]["y"] * (1 - q) + PANE[B_[1]]["y"] * q) * H
            d2 = (xx - lx) ** 2 + (yy - ly) ** 2
            img += (np.exp(-d2 / (2 * 9.0 ** 2)) * 2.0 + np.exp(-d2 / (2 * 24.0 ** 2)) * .6 + np.exp(-d2 / (2 * 96.0 ** 2)) * .18)[..., None] * AMBER * min(1, t / .8)
            img = img * (1 + .9 * min(1, t / 2))           # the window brighter while it is alone
        if u is not None:
            col, a = clips[u].at(ct)
            bx = BOX[u][min(len(BOX[u]) - 1, int(ct * 24))].copy()
            if mirror:
                col, a = col[:, ::-1], a[:, ::-1]
                bx[0], bx[2] = W - bx[2], W - bx[0]
            # the camera follows him gently, so the run stays in frame
            cx = (bx[0] + bx[2]) / 2
            camx = cx if camx is None else camx * .9 + cx * .1
            sh_ = int(round(W / 2 - camx)) if seg["clip"] == "u173" else 0
            if sh_:
                M = np.float32([[1, 0, sh_], [0, 1, 0]])
                col = cv2.warpAffine(col, M, (W, H)); a = cv2.warpAffine(a, M, (W, H))
                bx[0] += sh_; bx[2] += sh_
            bw, bh = max(40, bx[2] - bx[0]), max(80, bx[3] - bx[1])
            # cells in HIS box: each pixel belongs to the nearest seed, measured in his own proportions
            sub = 2
            gx = xx[::sub, ::sub]; gy = yy[::sub, ::sub]
            uu, vv = (gx - bx[0]) / bw, (gy - bx[1]) / bh
            d = np.stack([((uu - su) * bw) ** 2 + ((vv - sv) * bh * .8) ** 2 for su, sv, _ in SEEDS])
            cl = np.argmin(d, 0)
            cl = cv2.resize(cl.astype(np.uint16), (W, H), interpolation=cv2.INTER_NEAREST).astype(np.int32)
            glass = np.zeros((H, W, 3), np.float32)
            gw = np.zeros((H, W), np.float32)
            body = a > .02
            ys, xs = np.nonzero(body)
            if len(ys):
                Y0, Y1, X0, X1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
                clb = cl[Y0:Y1, X0:X1]
                for j, (su, sv, n) in enumerate(SEEDS):
                    m = clb == j
                    if not m.any():
                        continue
                    src = pic[n]
                    sh2, sw2 = src.shape[:2]
                    # each cell shows its note's clip, offset per cell so neighbours of one note differ
                    ox2 = int((j * 37) % max(1, sw2 // 3)); oy2 = int((j * 53) % max(1, sh2 // 3))
                    my, mx = np.nonzero(m)
                    py = ((my - my.min()) * .5 + oy2).astype(int) % sh2
                    px = ((mx - mx.min()) * .5 + ox2).astype(int) % sw2
                    e = min(1.6, lit[n])
                    br = .5 + 1.15 * e ** .7
                    glass[Y0:Y1, X0:X1][m] = src[py, px] * br
                    age = 99.0 if FULLGLASS else t - max(first.get(n, 1e9), GLASS_FROM)
                    gw[Y0:Y1, X0:X1][m] = np.clip(age / .5, 0, 1) * (1 - np.clip((t - LETGO) / 2.5, 0, 1))
            lum = col.mean(-1, keepdims=True) / 255
            facew = np.clip((yy[:, :1] - bx[1] - bh * .03) / (bh * .12), 0, 1) * .85 + .15   # his face stays his
            g = (gw * .92 * facew)[..., None]
            himself = col * (.9 - .25 * g)
            inside = himself * (1 - g) + glass * (.5 + .7 * lum) * g
            # the leading between his cells, only where he is glass
            ed = np.zeros((H, W), bool)
            ed[:, 1:] |= cl[:, 1:] != cl[:, :-1]
            ed[1:, :] |= cl[1:, :] != cl[:-1, :]
            ed = cv2.dilate(ed.astype(np.uint8), np.ones((2, 2), np.uint8)).astype(bool) & (a > .5)
            inside[ed] *= (1 - .8 * gw[ed])[:, None]
            img = img * (1 - a[..., None]) + inside * a[..., None]
            rim = cv2.morphologyEx((a > .5).astype(np.uint8), cv2.MORPH_GRADIENT, np.ones((3, 3), np.uint8)).astype(np.float32)
            img += cv2.GaussianBlur(rim, (0, 0), 5)[..., None] * AMBER * (.4 + .5 * min(1, max(lit.values())))
            # the light plays HIM: it travels to the cell of the note being struck, on his body
            j = max(0, np.searchsorted([x[0] for x in tops], t, "right") - 1)
            A_, B_ = tops[j], tops[min(j + 1, len(tops) - 1)]
            uu_ = 0.0 if B_[0] == A_[0] else min(1, max(0, ((t - A_[0]) / (B_[0] - A_[0]) - .35) / .65))
            uu_ = uu_ * uu_ * (3 - 2 * uu_)
            pa = [s for s in SEEDS if s[2] == A_[1]][1 % max(1, len([s for s in SEEDS if s[2] == A_[1]]))]
            pb = [s for s in SEEDS if s[2] == B_[1]][1 % max(1, len([s for s in SEEDS if s[2] == B_[1]]))]
            lx = bx[0] + bw * (pa[0] * (1 - uu_) + pb[0] * uu_)
            ly = bx[1] + bh * (pa[1] * (1 - uu_) + pb[1] * uu_)
            d2 = (xx - lx) ** 2 + (yy - ly) ** 2
            rad = 20 + 4 * math.sin(t * 2.3)
            fade = min(1, t / .8) * (1 - min(1, max(0, (t - LETGO) / 2.5)))
            img += (np.exp(-d2 / (2 * (rad * .38) ** 2)) * 1.8 + np.exp(-d2 / (2 * rad ** 2)) * .55 +
                    np.exp(-d2 / (2 * (rad * 4) ** 2)) * .16)[..., None] * AMBER * fade
        img = img + cv2.GaussianBlur(img, (0, 0), 6) * .2
        vig = np.clip(1.3 - ((xx - W / 2) ** 2 / W ** 2 + (yy - H / 2) ** 2 / H ** 2) * 1.4, 0, 1)[..., None]
        img = img * vig
        if t > T_CARD - .8:
            img *= max(0.0, 1 - (t - (T_CARD - .8)) / .8)
        img = np.clip(img, 0, 255).astype(np.uint8)
        if test:
            cv2.imwrite(f"{os.environ['TESTDIR']}/k{t:05.2f}.png", cv2.cvtColor(img, cv2.COLOR_RGB2BGR))
            continue
        out.stdin.write(img.tobytes())
        if f % 96 == 0:
            print(f"{t:6.1f}", flush=True)
    if out:
        out.stdin.close()
        out.wait()


if __name__ == "__main__":
    if os.environ.get("PLAN"):
        for s in SEGS:
            print(s["clip"], s["a"], s["b"], "mirror" if s["mirror"] else "", [(round(f, 2), round(c, 2)) for f, c in s["anc"]])
    else:
        main()
