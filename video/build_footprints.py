"""'Footprints' - drawn, no clips. The user: "Let's move on. You choose." Same Time Tomorrow? verse 2 (the user's song from
Claude's lyrics 'Area 51'), 76.7-107.0, with the end line over "No speech, no flag, no plan".
Looking straight down on dark desert sand at night. An invisible dancer leaves footprints on the beat; two steps behind
("Two steps behind, but he's doing just fine", 80.52), the amber light hops into each print exactly and lights it.
  "He copies my shoulders, he copies my grin" (84.16): the prints turn a full circle - copied exactly.
  "If I come out angry, they'd learn it too" (91.22): the prints become hard, jagged red stomps - and it copies those
      too: its landings burn red and the light itself goes red.
  "So I spin it slow, and I make it kind" (98.62): a slow, soft spiral, one step every two beats; it goes warm again.
  "Leave a better step for them to find" (102.72): the dancer stops, and one golden print appears ahead ("step", 104.12).
      The light finds it on "find" (105.78) - and then makes a step of its own, a print of a shape nobody showed it.
126 bpm, beat phase 0.124. Everything (world, steps, light) is computed for every frame so PART renders agree.
    python3 video/build_footprints.py      (TEST=s1,s2 TESTDIR=dir in SONG seconds; PART=a,b VOUT=f in film seconds)
"""
import math
import os
import subprocess

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy.ndimage import gaussian_filter

F = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 704, 1280, 24
S0, S1 = 76.7, 107.0
DUR = S1 - S0
BEAT, PHASE = 0.47619, 0.124
TEST = [float(x) for x in os.environ.get("TEST", "").split(",") if x]
PART = [float(x) for x in os.environ.get("PART", "").split(",") if x]
AMBER = np.array([255, 176, 88], np.float32)
RED = np.array([255, 52, 34], np.float32)
GOLD = np.array([255, 222, 150], np.float32)
A0, B0, C0, D0, E0 = 76.7, 84.16, 91.22, 98.62, 102.72
GOLD_T, FIND_T, OWN_T = 104.12, 105.78, 106.35
WORLD_H = 9000
ZS = 1.55                                     # world scale: prints big enough to read as shoes, tread and all
rng = np.random.default_rng(126)
prng = np.random.default_rng(7)                # dust: drawn every frame, so PART renders agree


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def beats(a, b, every=1):
    k0 = math.ceil((a - PHASE) / BEAT)
    out, k = [], k0
    while PHASE + k * BEAT < b:
        if (k - k0) % every == 0:
            out.append(PHASE + k * BEAT)
        k += 1
    return out


def make_steps():
    """the dancer's prints: (time, x, y, heading, foot, style, scale). Heading 0 = up the screen, + = turning right"""
    x, y, th = 352.0, WORLD_H - 900.0, 0.0
    steps, foot = [], -1

    def put(t, style="calm", stride=64, lat=26, scale=1.0):
        nonlocal x, y, foot
        stride, lat, scale = stride * ZS, lat * ZS, scale * ZS
        x += stride * math.sin(th)
        y -= stride * math.cos(th)
        px, py = x + foot * lat * math.cos(th), y + foot * lat * math.sin(th)
        steps.append((t, px, py, th, foot, style, scale))
        foot = -foot
    for k, t in enumerate(beats(77.0, B0)):                         # walking up, a gentle sway
        th = 0.28 * math.sin(k * 0.55)
        put(t)
    bb = beats(B0, C0)
    for t in bb:                                                     # a full circle, copied exactly
        th += 2 * math.pi / len(bb)
        put(t, stride=52)
    for k, t in enumerate(beats(C0, D0)):                            # angry: short, hard, zig-zag stomps
        th = (0.32 if k % 2 else -0.32) + 0.1 * math.sin(k)            # (v1 reversed direction each stomp: a red heap)
        put(t, style="angry", stride=60, lat=30, scale=1.2)
    th = 0.0
    for t in beats(D0, E0, every=2):                                 # slow and kind: a spiral, one step per two beats
        th += math.pi / 2.2
        put(t, style="kind", stride=56)
    th = 0.0
    for t in beats(E0, 103.9)[:2]:                                   # two steps on, then standing
        put(t)
    put(beats(103.0, 104.0)[-1] if beats(103.0, 104.0) else 103.8, stride=0)
    return steps


STEPS = make_steps()
LAST = STEPS[-1]
GOLDEN = (GOLD_T, LAST[1] + 10, LAST[2] - 150 * ZS, 0.0, 1, "gold", ZS)
OWN = (OWN_T, GOLDEN[1] + 24 * ZS, GOLDEN[2] - 120 * ZS, 0.2, 1, "own", ZS)
# the light: lands in every dancer's print two beats after it is made, then the golden one on "find", then its own
LANDS = [(s[0] + 2 * BEAT, s[1], s[2], s[5]) for s in STEPS if s[0] + 2 * BEAT < FIND_T - 0.3]
LANDS = [(S0, 352.0, STEPS[0][2] + 120 * ZS, "calm")] + LANDS + [(FIND_T, GOLDEN[1], GOLDEN[2], "gold"), (OWN_T, OWN[1], OWN[2], "own")]


def light_at(s):
    """(x, y, hop height, style of the print it last landed in)"""
    for i in range(len(LANDS) - 1):
        t0, x0, y0, st0 = LANDS[i]
        t1, x1, y1, st1 = LANDS[i + 1]
        if t0 <= s < t1:
            dur = t1 - t0
            fly = min(dur, 0.42)                                     # it waits in the print, then hops
            u = (s - (t1 - fly)) / fly if s > t1 - fly else 0.0
            u = min(max(u, 0.0), 1.0)
            uu = u * u * (3 - 2 * u)
            return x0 + (x1 - x0) * uu, y0 + (y1 - y0) * uu, 4 * u * (1 - u) * (45 + 0.15 * math.hypot(x1 - x0, y1 - y0)), st0
    t, x, y, st = LANDS[-1] if s >= LANDS[-1][0] else LANDS[0]
    return x, y, 0.0, st


# ---- print stamps
def shoe_mask(scale, style):
    w, h = int(70 * scale), int(150 * scale)
    im = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(im)
    s = scale
    if style == "angry":
        pts = []
        for k in range(28):
            a = 2 * math.pi * k / 28
            r = 1.0 + (0.18 if k % 2 else -0.08)
            pts.append((w / 2 + 24 * s * r * math.sin(a), 46 * s + 40 * s * r * math.cos(a)))
        d.polygon(pts, fill=255)
        d.polygon([(w / 2 - 17 * s, 98 * s), (w / 2 + 17 * s, 96 * s), (w / 2 + 14 * s, 140 * s), (w / 2 - 15 * s, 142 * s)], fill=255)
    else:
        d.ellipse([w / 2 - 22 * s, 6 * s, w / 2 + 22 * s, 86 * s], fill=255)
        d.ellipse([w / 2 - 17 * s, 96 * s, w / 2 + 17 * s, 142 * s], fill=255)
        for k in range(5):                                           # tread
            yy = (18 + 13 * k) * s
            d.line([(w / 2 - 15 * s, yy), (w / 2 + 15 * s, yy + 3 * s)], fill=150, width=max(1, int(3 * s)))
    return im


def own_mask(s=ZS):
    im = Image.new("L", (int(70 * s), int(90 * s)), 0)
    d = ImageDraw.Draw(im)
    d.ellipse([17 * s, 38 * s, 53 * s, 80 * s], fill=255)
    for dx, dy in ((-20, -2), (0, -12), (20, -2)):
        d.ellipse([(35 + dx - 8) * s, (26 + dy - 8) * s, (35 + dx + 8) * s, (26 + dy + 8) * s], fill=255)
    return im


_cache = {}


def stamp(style, scale, heading, foot):
    key = (style, round(scale, 2), int(round(math.degrees(heading) / 3)) * 3, foot)
    if key not in _cache:
        m = own_mask() if style == "own" else shoe_mask(scale, style)
        if foot < 0 and style != "own":
            m = m.transpose(Image.FLIP_LEFT_RIGHT)
        m = m.rotate(-key[2], resample=Image.BICUBIC, expand=True)
        a = np.asarray(m, np.float32) / 255
        _cache[key] = gaussian_filter(a, 1.0)
    return _cache[key]


def paste(dst, m, cx, cy, k=1.0):
    h, w = m.shape
    x0, y0 = int(round(cx - w / 2)), int(round(cy - h / 2))
    ya, yb, xa, xb = max(0, y0), min(H, y0 + h), max(0, x0), min(W, x0 + w)
    if ya < yb and xa < xb:
        np.maximum(dst[ya:yb, xa:xb], m[ya - y0:yb - y0, xa - x0:xb - x0] * k, out=dst[ya:yb, xa:xb])


def main():
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    tex = gaussian_filter(rng.normal(0, 1, (WORLD_H + H, W)).astype(np.float32), 1.2) * 0.6 + \
        gaussian_filter(rng.normal(0, 1, (WORLD_H + H, W)).astype(np.float32), 9) * 2.2
    ripple = np.sin(np.arange(WORLD_H + H, dtype=np.float32)[:, None] * 0.045 + np.arange(W)[None, :] * 0.012) * 0.25
    tex = tex + ripple
    vign = np.clip(1.15 - ((xs - W / 2) / (W * 0.75)) ** 2 - ((ys - H * 0.5) / (H * 0.7)) ** 2, 0.25, 1.0)
    out = None
    if not TEST:
        out = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                                str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p",
                                os.environ.get("VOUT", "out/drawn/footprints.mp4")], stdin=subprocess.PIPE)
    cam = None
    puffs = []
    for fr in range(int(DUR * FPS)):
        t = fr / FPS
        s = S0 + t
        lx, ly, hop, lst = light_at(s)
        made = [p for p in STEPS if p[0] <= s]
        lead = made[-1][2] if made else ly
        target = 0.5 * (ly + lead) - 40
        if s >= GOLD_T:
            target = 0.5 * (ly + GOLDEN[2]) - 40
        cam = target if cam is None else cam + (target - cam) * (1 - math.exp(-1 / FPS / 0.45))
        for p in STEPS:                                               # dust puffs when a print is stamped
            if abs(p[0] - s) < 0.5 / FPS:
                n = 14 if p[5] == "angry" else 7
                for _ in range(n):
                    a = prng.uniform(0, 2 * math.pi)
                    v = prng.uniform(30, 110) * (1.6 if p[5] == "angry" else 1.0)
                    puffs.append((p[1], p[2], math.cos(a) * v, math.sin(a) * v, s, p[5]))
        puffs = [q for q in puffs if s - q[4] < 0.6]
        if TEST and not any(abs(s - q) < 0.5 / FPS for q in TEST):
            continue
        if PART and not (PART[0] <= t < PART[1]):
            continue
        off = H * 0.5 - cam                                           # world y -> screen y
        y0w = int(round(cam - H * 0.5))
        win = tex[max(0, y0w):max(0, y0w) + H]
        if win.shape[0] < H:
            win = np.vstack([win, np.zeros((H - win.shape[0], W), np.float32)])
        sand = (0.55 + 0.11 * win)[..., None] * np.array([66, 50, 38], np.float32)
        sand *= vign[..., None]
        sand += (np.exp(-((xs - W / 2) ** 2 + (ys - H * 0.5) ** 2) / (2 * 420 ** 2)) * 0.25)[..., None] * np.array([60, 52, 46], np.float32)
        indent = np.zeros((H, W), np.float32)
        fill_a = np.zeros((H, W), np.float32)                         # warm fill
        fill_r = np.zeros((H, W), np.float32)                         # red fill
        gold = np.zeros((H, W), np.float32)
        for p in made + ([GOLDEN] if s >= GOLD_T else []) + ([OWN] if s >= OWN_T else []):
            t0, px, py, th, foot, st, sc = p
            sy = py + off
            if sy < -150 or sy > H + 150:
                continue
            m = stamp(st if st != "gold" else "calm", sc, th, foot)
            if st == "gold":
                k = ease((s - GOLD_T) / 0.6)
                paste(gold, m, px, sy, k)
                continue
            if st == "own":
                k = ease((s - OWN_T) / 0.25)
                paste(fill_a, m, px, sy, 1.4 * k)
                paste(indent, m, px, sy, 0.6 * k)
                continue
            paste(indent, m, px, sy, 1.0)
            land = t0 + 2 * BEAT
            if s >= land and land < FIND_T - 0.3:
                age = s - land
                lev = 0.2 + 1.0 * math.exp(-age / 0.3)                 # the newest landing burns; the trail stays lit, low
                if st == "angry":
                    paste(fill_r, m, px, sy, lev)
                else:
                    paste(fill_a, m, px, sy, lev)
        rim = np.clip(np.roll(np.roll(indent, -3, 0), -2, 1) - indent, 0, 1)
        a = sand * (1 - 0.55 * indent[..., None]) + (rim * 34)[..., None]
        for (fa, col) in ((fill_a, AMBER), (fill_r, RED), (gold, GOLD)):
            if fa.any():
                bloom = gaussian_filter(fa, 9)
                a += (fa * 150)[..., None] * col / 255 + (bloom * 230)[..., None] * col / 255
        # dust
        for (px, py, vx, vy, t0, st) in puffs:
            age = s - t0
            qx, qy = px + vx * age, py + off + vy * age
            k = (1 - age / 0.6) * (0.9 if st == "angry" else 0.6)
            ya, yb, xa, xb = int(max(0, qy - 10)), int(min(H, qy + 11)), int(max(0, qx - 10)), int(min(W, qx + 11))
            if ya < yb and xa < xb:
                g = np.exp(-((xs[ya:yb, xa:xb] - qx) ** 2 + (ys[ya:yb, xa:xb] - qy) ** 2) / (2 * 3.5 ** 2)) * k
                a[ya:yb, xa:xb] += g[..., None] * np.array([150, 120, 95], np.float32)
        # ---- the light: a shadow on the sand, the light lifted by its hop
        red = 0.0
        if C0 + 2 * BEAT <= s < D0 + 2 * BEAT:
            red = min(1.0, (s - (C0 + 2 * BEAT)) / 0.6) * (1 - min(1.0, max(0.0, (s - D0 - BEAT) / 1.0)))
        col = AMBER * (1 - red) + RED * red
        sx, sy = lx, ly + off
        a *= 1 - (0.35 * np.exp(-((xs - sx) ** 2 + (ys - sy) ** 2) / (2 * (10 + hop * 0.2) ** 2)))[..., None]
        qx, qy = sx + hop * 0.35, sy - hop
        d2 = (xs - qx) ** 2 + (ys - qy) ** 2
        r = 14 * (1 + 0.01 * hop)
        g = np.exp(-d2 / (2 * (r * 6) ** 2)) * 0.5 + np.exp(-d2 / (2 * r ** 2)) * 1.5 + np.exp(-d2 / (2 * (r * 0.35) ** 2)) * 2.2
        a += (g * 170)[..., None] * col / 255
        near = np.exp(-((xs - sx) ** 2 + (ys - sy) ** 2) / (2 * 150 ** 2)) * 0.5
        a += near[..., None] * sand * col / 255 * 0.8
        # the find: a ring of warm light when it lands in the golden print; a sparkle on its own
        for (tb, bx, by, n, rad) in ((FIND_T, GOLDEN[1], GOLDEN[2], 18, 110), (OWN_T, OWN[1], OWN[2], 10, 70)):
            if tb <= s < tb + 0.9:
                k = (s - tb) / 0.9
                for q in range(n):
                    ang = q / n * 2 * math.pi
                    px, py = bx + math.cos(ang) * rad * k, by + off + math.sin(ang) * rad * k
                    a += (np.exp(-((xs - px) ** 2 + (ys - py) ** 2) / (2 * 3.5 ** 2)) * (1 - k) * 220)[..., None] * GOLD / 255
        a = 255 * (1 - np.exp(-a / 255 * 1.15)) / (1 - math.exp(-1.15))
        a *= ease(t / 0.6)
        if s > S1 - 0.35:
            a *= 1 - ease((s - (S1 - 0.35)) / 0.33)
        a += rng.normal(0, 1.8, (H, W, 1))
        frame_out = np.clip(a, 0, 255).astype(np.uint8)
        if TEST:
            Image.fromarray(frame_out).save(f"{os.environ['TESTDIR']}/p{s:06.2f}.png")
            print("test", round(s, 2), flush=True)
            continue
        out.stdin.write(frame_out.tobytes())
        if fr % 96 == 0:
            print(f"{s:6.1f}", flush=True)
    if out:
        out.stdin.close()
        out.wait()


if __name__ == "__main__":
    main()
