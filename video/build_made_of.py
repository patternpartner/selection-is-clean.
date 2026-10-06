"""'Made of Everything' - no one's likeness. The user: "Let's do something different."
The amber light paints in the dark. Every stroke it makes is a window onto one clip from the archive (the 247 clips that
are not the user and not a real person's face - video/archive_index.py, cached by video/made_of_cache.py), and the window
keeps playing. Up close you only ever see the strokes: a bird at sunset, a glass whale, ink, robots round a toy bunny, a
clown, a bowling alley. They pile up like stained glass, faster on the drop, until the camera pulls back and the
patchwork has been a HAND the whole time - made of everything it was shown. The light settles in its palm. End card.
Song: the user's 'Concrete Pressure' 30.03-94.3 (instrumental; the whispered 'echo, pulse, drift' is texture).
    python3 video/build_made_of.py         (TEST=t1,t2 TESTDIR=dir; PART=a,b VOUT=f; film seconds)
    PLAN=1 python3 video/build_made_of.py  -> prints the stroke plan and how much of the hand it covers
"""
import json
import math
import os
import subprocess

import cv2
import imageio_ffmpeg
import numpy as np
from scipy.ndimage import distance_transform_edt, gaussian_filter1d

F = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 720, 1280, 24
WW, WH = 1440, 2560                                      # the world the hand lives in
BEAT = 60 / 124.0
S0 = 30.03                                               # song second at film 0 (a downbeat)
DUR = 64.3
T_CARD = 60.5
TEST = [float(x) for x in os.environ.get("TEST", "").split(",") if x]
PART = [float(x) for x in os.environ.get("PART", "").split(",") if x]
AMBER = np.array([255, 176, 88], np.float32)
PALM = np.array([700.0, 1640.0])
IDX = json.load(open("out/archive/index.json"))
rng = np.random.default_rng(11)


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def ramp(s, a, b):
    return ease((s - a) / (b - a))


def b2t(b):
    return b * BEAT


def make_hand():
    m = np.zeros((WH, WW), np.uint8)
    dx = -40
    cv2.fillPoly(m, [np.array([[470, 1350], [980, 1330], [1010, 1700], [930, 1950], [560, 1960], [450, 1720]], np.int32) + [dx, 0]], 255)
    cv2.fillPoly(m, [np.array([[540, 1900], [930, 1900], [960, 2600], [520, 2600]], np.int32) + [dx, 0]], 255)
    for (bx, by), (tx, ty), w in [((520, 1400), (430, 760), 150), ((660, 1360), (640, 560), 160), ((800, 1360), (840, 540), 160),
                                  ((930, 1420), (1040, 720), 145), ((990, 1700), (1290, 1260), 150)]:
        for k in range(41):
            u = k / 40
            cv2.circle(m, (int(bx + (tx - bx) * u) + dx, int(by + (ty - by) * u)), int(w / 2 * (1 - 0.12 * u)), 255, -1, cv2.LINE_AA)
    m = cv2.GaussianBlur(m, (0, 0), 18)
    return m > 127


HAND = make_hand()
OUTD = distance_transform_edt(~HAND).astype(np.float32)     # how far outside the hand a world pixel is
T_FALL, FALL_V = 43.8, 170.0                               # the panes outside the hand go, from the edge outward


def plan():
    """the strokes: (start s, end s, from, to, radius, clip). Greedy: each stroke goes where it covers most unpainted hand."""
    lo = 8
    hl = HAND[::lo, ::lo]
    painted = np.zeros_like(hl)
    yy, xx = np.nonzero(hl)
    pts = np.c_[xx, yy].astype(np.float32) * lo
    first = [24, 106, 89, 52, 65, 93, 82, 47, 61]          # the bird at sunset, the glass whale, ink, the robots...
    rest = [i for i in range(len(IDX)) if i not in first and IDX[i]["lum"] >= 18]
    rng.shuffle(rest)
    sched = [(2 + 4 * k, 4, 230) for k in range(8)]                    # slow, one stroke a bar, up close
    sched += [(34 + k, 1, 175 - 70 * k / 47) for k in range(50)]       # the drop: one a beat, shrinking
    sched += [(84 + 0.5 * k, 0.5, 80) for k in range(32)]              # the flurry: closing the gaps
    out = []
    p = PALM.copy()
    clips = first[:8] + rest
    for n, (b0, nb, r) in enumerate(sched):
        cand = pts[~painted[(pts[:, 1] / lo).astype(int), (pts[:, 0] / lo).astype(int)]]
        if len(cand) == 0:
            cand = pts
        cand = cand[rng.choice(len(cand), min(400, len(cand)), replace=False)]
        best, bs = None, -1e9
        maxlen = 3.0 * r if b0 < 84 else 9 * r
        for q in cand:
            d = np.linalg.norm(q - p)
            if d > maxlen:
                q = p + (q - p) / d * maxlen
            m = np.zeros(hl.shape, np.uint8)
            cv2.line(m, (int(p[0] / lo), int(p[1] / lo)), (int(q[0] / lo), int(q[1] / lo)), 1, max(1, int(2 * r / lo)))
            gain = (m.astype(bool) & hl & ~painted).sum()
            if gain > bs:
                best, bs = q, gain
        q = best
        m = np.zeros(hl.shape, np.uint8)
        cv2.line(m, (int(p[0] / lo), int(p[1] / lo)), (int(q[0] / lo), int(q[1] / lo)), 1, max(1, int(2 * r / lo)))
        painted |= m.astype(bool) & hl
        out.append((b2t(b0), b2t(b0 + nb * 0.92), p.copy(), q.copy(), float(r), clips[n]))
        p = q
    out.append((b2t(102), b2t(110), p.copy(), PALM.copy(), 190.0, 24))   # it goes home: the palm, the first thing it saw
    return out, painted.mean() / hl.mean()


EV, COVER = plan()


def light_at(t):
    """where the light is: along the current stroke, with a curl so it reads as a hand moving, not a robot"""
    if t < EV[0][0]:
        return EV[0][2], 0
    for k, (a, b, p, q, r, c) in enumerate(EV):
        nxt = EV[k + 1][0] if k + 1 < len(EV) else 1e9
        if a <= t < nxt:
            u = ease((t - a) / (b - a))
            d = q - p
            nrm = np.array([-d[1], d[0]]) / (np.linalg.norm(d) + 1e-6)
            return p + d * u + nrm * math.sin(u * math.pi) * min(60, 0.25 * np.linalg.norm(d)) * (1 if k % 2 else -1), k
    return EV[-1][3], len(EV) - 1


TT = np.arange(int(DUR * FPS) + 2) / FPS
LP = np.array([light_at(t)[0] for t in TT])
SM = np.c_[gaussian_filter1d(LP[:, 0], FPS * 0.9, mode="nearest"), gaussian_filter1d(LP[:, 1], FPS * 0.9, mode="nearest")]
HC = np.array([720.0, 1450.0])


def camera(t):
    """centre (world) and view width"""
    fr = min(int(t * FPS), len(SM) - 1)
    vw = 520 + 300 * ramp(t, 17.4, 40.6) + 430 * ramp(t, 40.6, 46.5) - 330 * ramp(t, 49.0, 60.5)
    c = SM[fr]
    pull = ramp(t, 39.0, 46.5)
    c = c * (1 - pull) + HC * pull
    c = c * (1 - ramp(t, 49.0, 60.5)) + (PALM + [0, -60]) * ramp(t, 49.0, 60.5)
    return c, vw


class Clips:
    def __init__(self):
        self.c = {}

    def get(self, i):
        if i not in self.c:
            self.c[i] = np.load(f"out/archive/made/c_{i}.npy", mmap_mode="r")
        return self.c[i]


def stamp(own, age, t0, t1):
    """paint everything the light covered between t0 and t1"""
    for tt in np.arange(t0, t1, 1 / (FPS * 2)):
        p0, k = light_at(tt)
        p1, k1 = light_at(tt + 1 / (FPS * 2))
        a, b, _, _, r, c = EV[k]
        if not (a <= tt <= b + 0.05) or k1 != k:
            continue
        cv2.line(own, (int(p0[0]), int(p0[1])), (int(p1[0]), int(p1[1])), k + 1, int(2 * r), cv2.LINE_8)
        cv2.line(age, (int(p0[0]), int(p0[1])), (int(p1[0]), int(p1[1])), float(tt), int(2 * r), cv2.LINE_8)


def gap_fill(own):
    """at the reveal, whatever the light missed is taken by its nearest stroke, so the hand has no holes"""
    hole = HAND & (own == 0)
    if not hole.any():
        return own
    _, (iy, ix) = distance_transform_edt(~(HAND & (own > 0)), return_indices=True)
    f = own.copy()
    f[hole] = own[iy[hole], ix[hole]]
    return f


def render(clips, own, age, filled, t):
    c, vw = camera(t)
    vh = vw * H / W
    gx = (np.arange(W, dtype=np.float32) / W - 0.5) * vw + c[0]
    gy = (np.arange(H, dtype=np.float32) / H - 0.5) * vh + c[1]
    wx, wy = np.meshgrid(gx, gy)
    lp, _ = light_at(t)
    # a ripple round the light, as if the picture were liquid where it touches
    dx, dy = wx - lp[0], wy - lp[1]
    dd = np.sqrt(dx * dx + dy * dy) + 1e-3
    amp = 7.0 * np.exp(-dd / 160) * (1 - ramp(t, 56, 60))
    wv = np.sin(dd / 13 - t * 9) * amp
    wx2, wy2 = wx + dx / dd * wv, wy + dy / dd * wv
    ix = np.clip(wx2.astype(np.int32), 0, WW - 1)
    iy = np.clip(wy2.astype(np.int32), 0, WH - 1)
    inside = (wx2 >= 0) & (wx2 < WW) & (wy2 >= 0) & (wy2 < WH)
    fillw = ramp(t, 46.0, 48.5)
    od = np.where(inside, OUTD[iy, ix], 1e9)
    gone = od <= (t - T_FALL) * FALL_V if t > T_FALL else np.zeros_like(inside)
    keep = inside & (od <= 0.5) | (inside & ~gone & (t < T_FALL + 6))
    o = np.where(keep, own[iy, ix], 0)
    if fillw > 0:                                      # the holes close over a couple of seconds, not in one frame
        o = np.where(inside & HAND[iy, ix] & (o == 0) & (gaussian_noise(t) < fillw), filled[iy, ix], o)
    img = np.zeros((H, W, 3), np.float32)
    beat = (t / BEAT) % 1.0
    pulse = 1 + 0.10 * math.exp(-beat * BEAT / 0.12) * ramp(t, 17.0, 18.0) * (1 - ramp(t, 57, 60))
    for pid in np.unique(o):
        if pid == 0:
            continue
        a, b, p, q, r, ci = EV[pid - 1]
        fr = clips.get(ci)
        n, sh, sw = fr.shape[:3]
        frame = np.asarray(fr[int(max(t - a, 0) * 12) % n])
        cen = (p + q) / 2
        span = max(np.linalg.norm(q - p) + 2 * r, 2.2 * r) * 1.1
        sc = span / max(sw, sh)                        # world px per source px
        m = o == pid
        ys, xs = np.nonzero(m)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        u = (wx2[y0:y1, x0:x1] - cen[0]) / sc + sw / 2
        v = (wy2[y0:y1, x0:x1] - cen[1]) / sc + sh / 2
        u = np.abs(((u / sw) + 1) % 2 - 1) * sw            # mirror beyond the frame, so a long stroke never runs out
        v = np.abs(((v / sh) + 1) % 2 - 1) * sh
        tile = cv2.remap(frame, np.clip(u, 0, sw - 1).astype(np.float32), np.clip(v, 0, sh - 1).astype(np.float32),
                         cv2.INTER_LINEAR)
        sub = m[y0:y1, x0:x1]
        img[y0:y1, x0:x1][sub] = tile[sub].astype(np.float32)
    # leading between the panes, like stained glass; a fresh edge glows amber
    ed = np.zeros((H, W), bool)
    ed[:, 1:] |= o[:, 1:] != o[:, :-1]
    ed[1:, :] |= o[1:, :] != o[:-1, :]
    ed = cv2.dilate(ed.astype(np.uint8), np.ones((2, 2), np.uint8)).astype(bool)
    ag = np.where(o > 0, t - age[iy, ix], 99)
    fresh = np.clip(1 - ag / 0.6, 0, 1)
    img *= pulse
    img[ed] *= 0.12
    glow = cv2.GaussianBlur((ed * fresh).astype(np.float32), (0, 0), 3)
    img += glow[..., None] * AMBER * 1.6
    # once it is home, its light runs out from the palm along the leading, a beat at a time, like veins
    if t > 51.0:
        dp = np.hypot(wx2 - PALM[0], wy2 - PALM[1])
        front = (t - 51.0) * 230 + 90 * math.exp(-beat * BEAT / 0.15)
        vein = (ed & (o > 0)).astype(np.float32) * (dp < front) * (0.9 + 1.6 * np.exp(-((dp - front) / 70) ** 2))
        img += cv2.GaussianBlur(vein, (0, 0), 2.2)[..., None] * AMBER * 2.4
    # the edge where the outside is falling away burns for a moment
    if T_FALL < t < T_FALL + 6:
        front = np.exp(-((od - (t - T_FALL) * FALL_V) / 18) ** 2) * (od > 0.5) * (own[iy, ix] > 0)
        img += cv2.GaussianBlur(front.astype(np.float32), (0, 0), 3)[..., None] * AMBER * 1.4
    # the shape, once it is a shape: a warm rim round the hand
    rim = ramp(t, 45.0, 49.0)
    if rim > 0:
        hs = (inside & HAND[iy, ix]).astype(np.uint8)
        e2 = cv2.morphologyEx(hs, cv2.MORPH_GRADIENT, np.ones((3, 3), np.uint8)).astype(np.float32)
        img += cv2.GaussianBlur(e2, (0, 0), 6)[..., None] * AMBER * 1.8 * rim
    warm = ramp(t, 55.0, 59.5)
    if warm > 0:
        img = img * (1 - 0.35 * warm) + img.mean(-1, keepdims=True) * (AMBER / 255) * 0.5 * warm
    # the light itself
    sx = (lp[0] - c[0]) / vw * W + W / 2
    sy = (lp[1] - c[1]) / vh * H + H / 2
    zoom = 600 / vw
    rad = (24 + 6 * math.sin(t * 2.1)) * (0.7 + 0.3 * zoom) * (1 + 0.6 * ramp(t, 52, 58))
    fl = min(1.0, t / 0.8) * (1 + 0.3 * math.exp(-beat * BEAT / 0.1) * ramp(t, 17, 18))
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    d2 = (xx - sx) ** 2 + (yy - sy) ** 2
    img += (np.exp(-d2 / (2 * (rad * 0.35) ** 2)) * 2.4 + np.exp(-d2 / (2 * rad ** 2)) * 0.8 +
            np.exp(-d2 / (2 * (rad * 4) ** 2)) * 0.22)[..., None] * AMBER * fl
    vig = np.clip(1.3 - ((xx - W / 2) ** 2 / W ** 2 + (yy - H / 2) ** 2 / H ** 2) * 1.6, 0, 1)[..., None]
    img = img * vig
    img = img + cv2.GaussianBlur(img, (0, 0), 7) * 0.3
    img += rng.normal(0, 2.0, (H, W, 1))
    if t > T_CARD - 0.8:
        img *= 1 - ramp(t, T_CARD - 0.8, T_CARD)
    return np.clip(img, 0, 255).astype(np.uint8)


_NZ = None


def gaussian_noise(t):
    """a fixed soft noise field (screen space) deciding which holes close first"""
    global _NZ
    if _NZ is None:
        r = np.random.default_rng(3).random((H // 16, W // 16)).astype(np.float32)
        _NZ = cv2.resize(cv2.GaussianBlur(r, (0, 0), 1.5), (W, H))
        _NZ = (_NZ - _NZ.min()) / (_NZ.max() - _NZ.min())
    return _NZ


def main():
    if os.environ.get("PLAN"):
        for e in EV:
            print(round(e[0], 2), round(e[1], 2), e[2].round(), e[3].round(), round(e[4]), e[5], IDX[e[5]]["id"])
        print("strokes", len(EV), "cover", round(COVER, 3))
        return
    clips = Clips()
    own = np.zeros((WH, WW), np.uint16)
    age = np.zeros((WH, WW), np.float32)
    filled = None
    out = None
    if not TEST:
        out = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                                str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "17", "-preset", "slow", "-pix_fmt", "yuv420p",
                                os.environ.get("VOUT", "out/drawn/made-of.mp4")], stdin=subprocess.PIPE)
    last = 0.0
    for fr in range(int(round(DUR * FPS))):
        t = fr / FPS
        want = (not TEST or any(abs(t - q) < 0.5 / FPS for q in TEST)) and (not PART or PART[0] <= t < PART[1])
        if PART and t >= PART[1]:
            break
        if TEST and t > max(TEST) + 0.1:
            break
        stamp(own, age, last, t + 1 / FPS)
        last = t + 1 / FPS
        if not want:
            continue
        if t >= 46.0 and filled is None:
            filled = gap_fill(own)
        if 46.0 <= t < 49.0 and fr % 12 == 0:
            filled = gap_fill(own)
        img = render(clips, own, age, filled if filled is not None else own, t)
        if TEST:
            from PIL import Image
            Image.fromarray(img).save(f"{os.environ['TESTDIR']}/m{t:05.2f}.png")
            print("test", round(t, 2), flush=True)
            continue
        out.stdin.write(img.tobytes())
        if fr % 96 == 0:
            print(f"{t:6.1f}", flush=True)
    if out:
        out.stdin.close()
        out.wait()


if __name__ == "__main__":
    main()
