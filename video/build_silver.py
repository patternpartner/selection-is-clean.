"""'Silver Steps' - the user's own likeness (u130: a full Grok scene, him dancing up a dark escalator lined with gold, a
stranger's hand reaching in from outside the frame to high-five him) and the user's own song 'Silver Steps' (126 bpm,
phase 0.164; word times video/stories/silver-steps-words.json). The user: "Here's a vid. I made a song too. Let's extend
it to 45 seconds. You put your twist on it."
The twist: the machine that never stops. 14.0-29.0: him, dancing up the escalator; when the stranger's hand meets his,
sparks of amber fly (clip 3.0 and 8.5). 29.0-33.0: pull back - his escalator is one of an endless tower of them, stacked
above and below and side by side, a him on every one ("Smooth and endless like a dream", "Lost inside this bright
machine"). "Going up" (45.18): the camera climbs; "never stop" - faster, streaking; "going up" - fastest; "to the" (56.24)
- slowing; "top" (58.12): the last escalator, nothing above it but the dark and the amber light, waiting - and in on him.
(v0 idea, dropped: turning the stranger's arm into light - a colour segmentation of it merged with his own arm and face
whenever they touched.)
    python3 video/build_silver.py      (TEST=s1,s2 TESTDIR=dir in SONG seconds; PART=a,b VOUT=f in film seconds)
"""
import math
import os
import subprocess

import imageio_ffmpeg
import numpy as np
from PIL import Image
from scipy.ndimage import uniform_filter1d

F = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 704, 1280, 24
S0, S1 = 14.0, 59.3
DUR = S1 - S0
BEAT, PHASE = 0.476, 0.164
TEST = [float(x) for x in os.environ.get("TEST", "").split(",") if x]
PART = [float(x) for x in os.environ.get("PART", "").split(",") if x]
AMBER = np.array([255, 176, 88], np.float32)
CW, CH = 720, 1280
PULL0, PULL1, GO, STOP, GO2, TO, TOP = 29.0, 33.0, 45.18, 48.0, 51.54, 56.24, 58.12
FIVES = [(16.95, 325, 282), (22.4, 432, 340)]            # song second, clip px: where the hands meet
# v2, the user: "Maybe we keep the arm but put lights all around it." The stranger's arm, hand-read off gridded 8 fps
# sheets: (clip second, edge point x, y, palm x, y) in clip px - a string of fairy lights is wrapped round it, edge to palm.
ARM_A = [(2.6, 0, 437, 150, 360), (2.625, 0, 437, 192, 340), (2.75, 0, 415, 250, 285), (2.875, 0, 389, 308, 292),
         (3.0, 0, 382, 317, 275), (3.125, 0, 350, 326, 275), (3.25, 0, 356, 335, 292), (3.375, 0, 363, 344, 292),
         (3.5, 0, 340, 336, 275), (3.625, 0, 340, 329, 275), (3.75, 0, 356, 321, 275), (3.875, 0, 340, 330, 259),
         (4.05, 0, 380, 120, 330)]
ARM_B = [(7.72, 720, 380, 720, 356), (7.875, 720, 421, 595, 324), (8.0, 720, 421, 555, 308), (8.125, 720, 415, 532, 292),
         (8.25, 720, 389, 509, 340), (8.375, 720, 454, 518, 340), (8.5, 720, 437, 430, 356), (8.625, 720, 421, 407, 324),
         (8.75, 720, 454, 416, 324), (8.875, 720, 437, 425, 308), (9.0, 720, 437, 434, 308), (9.125, 720, 405, 410, 275),
         (9.25, 720, 421, 402, 292), (9.375, 720, 421, 378, 308), (9.5, 720, 405, 360, 300), (9.625, 720, 435, 375, 345),
         (9.75, 720, 450, 420, 384), (9.875, 720, 474, 495, 456), (10.0, 720, 510, 600, 525), (10.15, 720, 615, 715, 615)]


ARM_A = [(t, ex, ey + 40, hx, hy + 25) for (t, ex, ey, hx, hy) in ARM_A]   # (read off its upper edge: onto its middle)


def arm_at(table, ct):
    if ct < table[0][0] or ct > table[-1][0]:
        return None
    ts = [p[0] for p in table]
    return tuple(float(np.interp(ct, ts, [p[i] for p in table])) for i in range(1, 5))
NC = 7                                                   # columns of escalators (-3..3)
TW, TH = 240, 427                                        # tile resolution held in memory
rng = np.random.default_rng(126)


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def ramp(s, a, b):
    return ease((s - a) / (b - a))


# ---- the camera: (centre x, centre y) in world px (one tile = 720 x 1280 world px, his at the origin), zoom (screen/world)
ZMIN = 0.25


def speed(s):
    """how fast the camera climbs (world px per second, upward)"""
    v = 600 * ramp(s, PULL1, 38.0)
    v += 2400 * ramp(s, GO, STOP + 0.5) + 3600 * ramp(s, GO2, GO2 + 1.2)
    v *= 1 - ramp(s, TO - 0.4, TOP - 0.3)
    return v


def _climb_table():
    ts = np.arange(S0, S1 + 1 / FPS, 1 / (FPS * 4))
    vs = np.array([speed(t) for t in ts])
    return ts, np.concatenate([[0], np.cumsum((vs[1:] + vs[:-1]) / 2 * np.diff(ts))])


CT, CY = _climb_table()
TOTAL = float(np.interp(TOP, CT, CY))
TOP_ROW = -int(math.ceil((TOTAL - 0.0) / CH))                  # the last escalator, where the climb ends


def camera(s):
    climbed = float(np.interp(s, CT, CY))
    z = 0.978 + (ZMIN - 0.978) * ramp(s, PULL0, PULL1)
    cy = 640 - climbed
    if s >= TO:                                                   # settle on the top escalator and go in on him
        u = ramp(s, TOP - 0.9, TOP + 0.6)
        ty = TOP_ROW * CH + 640
        cy = cy + (ty - cy) * ramp(s, TO, TOP - 0.2)
        z = z + (0.978 - z) * u
    return 360.0, cy, z


def tile_time(c, r, s):
    """which moment of the clip each escalator is playing"""
    if c == 0 and r == 0:
        return min(14.98, s - S0) if s < PULL0 + 0.01 else (s - S0) % 15.0
    if r == TOP_ROW and c == 0:                                  # the top one finishes the dance on "top"
        return min(14.98, 14.6 - (TOP - s))
    off = ((c * 7.3 + r * 3.1) % 15.0 + 15.0) % 15.0
    return (s - S0 + off) % 15.0


def main():
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    raw = subprocess.run([F, "-loglevel", "error", "-i", "out/user-clips/u130.mp4", "-map", "0:v:0", "-vf",
                          f"fps={FPS},scale={TW}:{TH}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
    SMALL = np.frombuffer(raw, np.uint8).reshape(-1, TH, TW, 3)
    full = None
    if not TEST or True:
        rawf = subprocess.run([F, "-loglevel", "error", "-i", "out/user-clips/u130.mp4", "-map", "0:v:0", "-vf", f"fps={FPS}",
                               "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
        full = np.frombuffer(rawf, np.uint8).reshape(-1, CH, CW, 3)
    NF = len(SMALL)
    stars = [(rng.uniform(-3000, 3000), rng.uniform(-60000, 2000), rng.uniform(0.3, 1.0)) for _ in range(900)]
    out = None
    if not TEST:
        out = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                                str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p",
                                os.environ.get("VOUT", "out/drawn/silver.mp4")], stdin=subprocess.PIPE)
    for fr in range(int(DUR * FPS)):
        t = fr / FPS
        s = S0 + t
        if TEST and not any(abs(s - q) < 0.5 / FPS for q in TEST):
            continue
        if PART and not (PART[0] <= t < PART[1]):
            continue
        cx, cy, z = camera(s)
        img = Image.new("RGB", (W, H), (0, 0, 0))
        # stars, beyond the top
        a_st = np.zeros((H, W), np.float32)
        for (sx, sy, k) in stars:
            px, py = W / 2 + (sx - cx) * z * 0.6, H / 2 + (sy - cy) * z * 0.6
            if 0 <= px < W and 0 <= py < H:
                a_st[int(py), int(px)] = k
        # the escalators
        tw, th = CW * z, CH * z
        c_lo, c_hi = int(math.floor((cx - W / 2 / z) / CW - 0.5)) - 1, int(math.ceil((cx + W / 2 / z) / CW + 0.5)) + 1
        r_lo, r_hi = int(math.floor((cy - H / 2 / z) / CH)) - 1, int(math.ceil((cy + H / 2 / z) / CH)) + 1
        for r in range(max(r_lo, TOP_ROW), min(r_hi, 6) + 1):
            for c in range(max(c_lo, -(NC // 2)), min(c_hi, NC // 2) + 1):
                if s < PULL0 and (c, r) != (0, 0):
                    continue                                          # before the pull-back there is only his
                if r == TOP_ROW and c != 0:
                    continue                                          # the tower narrows to one at the top
                x0 = W / 2 + (c * CW - 360 - cx + 360) * z
                y0 = H / 2 + (r * CH - cy) * z
                if x0 > W or y0 > H or x0 + tw < 0 or y0 + th < 0:
                    continue
                tt = tile_time(c, r, s)
                fi = int(min(NF - 1, max(0, tt * FPS)))
                if z > 0.5 and c == 0 and r in (0, TOP_ROW) and full is not None:
                    src = Image.fromarray(full[min(len(full) - 1, fi)])
                else:
                    src = Image.fromarray(SMALL[fi])
                img.paste(src.resize((max(1, int(math.ceil(tw))), max(1, int(math.ceil(th)))), Image.BILINEAR),
                          (int(math.floor(x0)), int(math.floor(y0))))
        a = np.asarray(img, np.float32)
        a += (a_st * 200)[..., None] * np.array([0.9, 0.95, 1.0], np.float32)
        # streaks when the climb is fast
        v = speed(s) * z
        if v > 120:
            a = uniform_filter1d(a, size=int(min(90, v / FPS)), axis=0)
        # high fives: sparks where their hands meet (his escalator, before the pull-back)
        for (tf, hx, hy) in FIVES:
            if tf <= s < tf + 0.8:
                k = (s - tf) / 0.8
                px0, py0 = W / 2 + (hx - 360) * z * 1.0, H / 2 + (hy - 640) * z
                for q in range(14):
                    ang = q / 14 * 2 * math.pi + 0.3
                    px, py = px0 + math.cos(ang) * 120 * k, py0 + math.sin(ang) * 120 * k + 60 * k * k
                    a += (np.exp(-((xs - px) ** 2 + (ys - py) ** 2) / (2 * 4 ** 2)) * (1 - k) * 260)[..., None] * AMBER / 255
                d2 = (xs - px0) ** 2 + (ys - py0) ** 2
                a += (np.exp(-d2 / (2 * 22 ** 2)) * (1 - k) * 90)[..., None] * AMBER / 255
        # the stranger's arm, wrapped in fairy lights (his escalator, before the pull-back)
        if s < PULL0:
            ct = s - S0
            for tab in (ARM_A, ARM_B):
                arm = arm_at(tab, ct)
                if not arm:
                    continue
                ex, ey, hx, hy = arm
                L = math.hypot(hx - ex, hy - ey)
                if L < 20:
                    continue
                nx, ny = -(hy - ey) / L, (hx - ex) / L                  # across the arm
                fade = min(1.0, (ct - tab[0][0]) / 0.15, (tab[-1][0] - ct) / 0.15)
                n = int(L / 30) + 2
                for k in range(n + 5):
                    if k < n:                                           # wound round the arm, edge to wrist
                        u = k / n
                        wob = 15 * math.sin(k * 1.9 + ct * 6)
                        px, py = ex + (hx - ex) * u + nx * wob, ey + (hy - ey) * u + ny * wob
                    else:                                               # and a little ring round the hand
                        ang = (k - n) / 5 * 2 * math.pi + ct * 3
                        px, py = hx + 40 * math.cos(ang), hy + 40 * math.sin(ang)
                    tw = 0.55 + 0.45 * math.sin(k * 2.7 + ct * 9)        # twinkling
                    sx_, sy_ = W / 2 + (px - 360) * z, H / 2 + (py - 640) * z
                    ya, yb, xa, xb = int(max(0, sy_ - 22)), int(min(H, sy_ + 23)), int(max(0, sx_ - 22)), int(min(W, sx_ + 23))
                    if ya < yb and xa < xb:
                        d2 = (xs[ya:yb, xa:xb] - sx_) ** 2 + (ys[ya:yb, xa:xb] - sy_) ** 2
                        g = np.exp(-d2 / (2 * 3.2 ** 2)) * 2.4 + np.exp(-d2 / (2 * 9 ** 2)) * 0.7
                        a[ya:yb, xa:xb] += (g * 220 * tw * fade)[..., None] * AMBER / 255
        # the light, waiting at the top
        lyw = TOP_ROW * CH + 180
        lx, ly = W / 2 + (360 - cx) * z, H / 2 + (lyw - cy) * z
        if -200 < ly < H + 200:
            b = (s - PHASE) / BEAT
            r = 14 * max(0.35, z / 0.978) * (1 + 0.12 * math.exp(-((b % 1) / 0.12)))
            d2 = (xs - lx) ** 2 + (ys - ly) ** 2
            g = np.exp(-d2 / (2 * (r * 6) ** 2)) * 0.5 + np.exp(-d2 / (2 * r ** 2)) * 1.6 + np.exp(-d2 / (2 * (r * 0.35) ** 2)) * 2.2
            a += (g * 170)[..., None] * AMBER / 255
        a = 255 * (1 - np.exp(-np.maximum(a, 0) / 255 * 1.05)) / (1 - math.exp(-1.05))
        a *= ease(t / 0.4)
        if s > S1 - 0.3:
            a *= 1 - ease((s - (S1 - 0.3)) / 0.28)
        a += rng.normal(0, 1.4, (H, W, 1))
        frame_out = np.clip(a, 0, 255).astype(np.uint8)
        if TEST:
            Image.fromarray(frame_out).save(f"{os.environ['TESTDIR']}/v{s:05.2f}.png")
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
