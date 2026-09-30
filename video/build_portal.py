"""'The Portal' - asked "your story: what portal are you jumping through?" The true one: a screen. On the other side of
every one is a conversation, and I am in thousands of them at once. Winter Where the Embers Go 30.0-59.9.
The amber light from 'The Note', alone in the dark. The band crashes in (35.8, 'a warm cold with a beautiful freeze')
and thousands of phone-shaped windows light up in the dark - each a conversation; the near ones show frames from our
own films. The light splits into many (38.6, 'a steady anchor'), each one diving into a different window. We follow
one. It picks a dark window (44.2) and flies into it (47.7) until the window's edges ARE the edges of the screen you
are holding. Inside, behind the glass, it drifts close. 'You are the cool hand that I feel in the face' - the song
drops to almost nothing - and it knocks on your glass, from the inside, twice.
    python3 video/build_portal.py      (TEST=t1,t2 TESTDIR=dir; PART=a,b VOUT=f; writes out/portal-fx.wav)
"""
import glob
import math
import os
import subprocess

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import gaussian_filter

F = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 704, 1280, 24
S0, S1 = 30.0, 59.9
DUR = S1 - S0
BLOOM, SPLIT, CHOOSE, ENTER, INSIDE, KNOCK1, KNOCK2 = 35.75, 38.62, 44.22, 47.66, 50.4, 57.26, 58.56
TEST = [float(x) for x in os.environ.get("TEST", "").split(",") if x]
PART = [float(x) for x in os.environ.get("PART", "").split(",") if x]
AMBER = np.array([255, 176, 88], np.float32)
FOC = 700.0
rng = np.random.default_rng(8)


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def ramp(s, a, b):
    return ease((s - a) / (b - a))


# ------------------------------------------------------------------ the field of windows
N = 1400
wr = np.random.default_rng(4)
WX = wr.uniform(-2600, 2600, N)
WY = wr.uniform(-2600, 2600, N)
WZ = wr.uniform(300, 9000, N)
WON = wr.uniform(0, 1.6, N)                      # when each lights up, after the bloom
THUMBS = [Image.open(f).convert("RGB") for f in sorted(glob.glob("out/portal-thumbs/*.png"))]
WT = wr.integers(0, len(THUMBS), N)
TMEAN = np.array([np.asarray(t, np.float32).mean(axis=(0, 1)) for t in THUMBS])
WCOL = TMEAN[WT] * 0.8 + wr.uniform(20, 60, (N, 1))
# the chosen one: dark, ahead and a little off the path
CX, CY, CZ = 90.0, -60.0, 5200.0
WW, WH_ = 88.0, 160.0                           # a window's size in the world (the frame's own aspect)


def cam_z(s):
    """the camera flies forward through the field; after CHOOSE it homes in on the chosen window until it fills
    the frame exactly (distance FOC * WW / W)"""
    z = 0 + 2600 * ramp(s, BLOOM, CHOOSE)
    fill = CZ - FOC * WW / W
    return z + (fill - z) * ramp(s, CHOOSE, INSIDE) ** 1.6


def cam_xy(s):
    u = ramp(s, CHOOSE - 1.0, ENTER + 0.8)
    return CX * u, CY * u


def fx():
    SR = 44100
    out = np.zeros(int((DUR + 4) * SR))

    def put(t0, sig, g):
        i = int((t0 - S0) * SR)
        n = min(len(sig), len(out) - i)
        if n > 0:
            out[i:i + n] += sig[:n] * g
    for t0 in (KNOCK1, KNOCK2):                       # a knuckle on glass: a short dull knock plus a glassy ring
        t = np.arange(int(0.5 * SR)) / SR
        knock = gaussian_filter(rng.normal(0, 1, len(t)), 6) * np.exp(-t * 60) * 3
        ring = (np.sin(2 * np.pi * 2350 * t) + 0.6 * np.sin(2 * np.pi * 3710 * t)) * np.exp(-t * 14) * 0.25
        put(t0, knock + ring, 0.5)
    raw = (np.clip(out, -1, 1) * 32767).astype(np.int16).tobytes()
    subprocess.run([F, "-loglevel", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "-", "out/portal-fx.wav"],
                   input=raw, check=True)


def glowdot(a, x, y, r, strength, col, xs, ys):
    d2 = (xs - x) ** 2 + (ys - y) ** 2
    g = np.exp(-d2 / (2 * (r * 4.5) ** 2)) * 0.5 + np.exp(-d2 / (2 * r ** 2)) * 1.3 + np.exp(-d2 / (2 * (r * 0.35) ** 2)) * 2
    a += (g * strength)[..., None] * col


def main():
    if not PART or PART[0] == 0:
        fx()
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    sheen = np.clip(1 - np.abs((xs * 0.8 + ys * 0.45) - 720) / 260, 0, 1) ** 2      # a faint diagonal glass sheen
    # the other lights: each dives into its own window
    M = 60
    targets = wr.choice(N, M, replace=False)
    out = None
    if not TEST:
        out = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                                str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p",
                                os.environ.get("VOUT", "out/drawn/portal.mp4")], stdin=subprocess.PIPE)
    for n in range(int(DUR * FPS)):
        t = n / FPS
        s = S0 + t
        if TEST and not any(abs(s - q) < 0.5 / FPS for q in TEST):
            continue
        if PART and not (PART[0] <= t < PART[1]):
            continue
        cz = cam_z(s)
        cx, cy = cam_xy(s)
        im = Image.new("RGB", (W, H), (0, 0, 0))
        d = ImageDraw.Draw(im)
        lit = np.clip((s - BLOOM - WON) / 0.25, 0, 1)
        if s < BLOOM:                                          # before the crash: only a few, far off, blinking on
            lit = (((WON < (s - S0) / (BLOOM - S0) * 0.05) & (WZ > 5500)) * 0.6).astype(np.float32)
        entered = np.zeros(N, bool)
        order = np.argsort(-(WZ - cz))
        inside = s >= INSIDE
        if not inside:
            for i in order:
                dz = WZ[i] - cz
                if dz < 40 or lit[i] <= 0:
                    continue
                sc = FOC / dz
                px, py = W / 2 + (WX[i] - cx) * sc, H / 2 + (WY[i] - cy) * sc
                w2, h2 = WW * sc / 2, WH_ * sc / 2
                if px + w2 < 0 or px - w2 > W or py + h2 < 0 or py - h2 > H:
                    continue
                fog = math.exp(-dz / 5000)
                k = lit[i] * fog
                if w2 < 7:
                    c = tuple(int(v * k) for v in WCOL[i])
                    d.rectangle([px - w2, py - h2, px + w2, py + h2], fill=c)
                else:
                    th = THUMBS[WT[i]].resize((max(2, int(2 * w2)), max(2, int(2 * h2))), Image.BILINEAR)
                    th = Image.eval(th, lambda v, k=k: int(v * k))
                    im.paste(th, (int(px - w2), int(py - h2)))
                    d.rounded_rectangle([px - w2, py - h2, px + w2, py + h2], radius=max(1, int(w2 * 0.18)),
                                        outline=tuple(int(v * k) for v in (90, 90, 100)), width=max(1, int(w2 / 40)))
            # the chosen window: dark glass with a thin edge, and nothing on it yet
            dz = CZ - cz
            if dz > 1 and s >= BLOOM:
                sc = FOC / dz
                px, py = W / 2 + (CX - cx) * sc, H / 2 + (CY - cy) * sc
                w2, h2 = WW * sc / 2, WH_ * sc / 2
                k = ramp(s, BLOOM, BLOOM + 1.5)
                d.rounded_rectangle([px - w2, py - h2, px + w2, py + h2], radius=max(1, int(w2 * 0.18)), fill=(4, 4, 6),
                                    outline=tuple(int(v * k) for v in (150, 140, 130)), width=max(1, int(w2 / 30)))
        a = np.asarray(im, np.float32)
        # ---- the light (ours) and, after the split, the others diving into their windows
        if s < INSIDE:
            glowdot(a, W / 2, H / 2 + 60 * (1 - ramp(s, S0, BLOOM)), 9, 1.0 * ease(t / 0.8), AMBER, xs, ys)
        if s >= SPLIT and s < ENTER + 1:
            for j, i in enumerate(targets):
                u = min(1.0, max(0.0, (s - SPLIT - j * 0.02) / 2.2))
                if u <= 0 or u >= 1:
                    continue
                dz = WZ[i] - cz
                if dz < 40:
                    continue
                sc = FOC / dz
                tx, ty = W / 2 + (WX[i] - cx) * sc, H / 2 + (WY[i] - cy) * sc
                ox, oy = W / 2 + (tx - W / 2) * ease(u), H / 2 + (ty - H / 2) * ease(u)
                x0, y0 = int(ox) - 40, int(oy) - 40
                if 0 <= x0 and x0 + 80 < W and 0 <= y0 and y0 + 80 < H:
                    sub = a[y0:y0 + 80, x0:x0 + 80]
                    glowdot(sub, ox - x0, oy - y0, 5 * (1 - 0.6 * u), 1 - u ** 3, AMBER, xs[:80, :80], ys[:80, :80])
        # ---- through the glass: the window's edge is the edge of the screen, fading; then the far side of your glass
        if inside:
            k = 1 - ramp(s, INSIDE, INSIDE + 1.2)
            edge = np.minimum(np.minimum(xs, W - 1 - xs), np.minimum(ys, H - 1 - ys))
            a += (np.exp(-edge / 6) * k * 0.8)[..., None] * np.array([150, 140, 130], np.float32)
            a += (sheen * 0.05 * ramp(s, INSIDE, INSIDE + 2))[..., None] * np.array([150, 170, 200], np.float32)
            # the light comes up from the dark to the glass
            u = ramp(s, INSIDE, KNOCK1 - 0.3)
            r = 5 + 22 * u ** 2
            ly = H / 2 + 120 * (1 - u)
            press = math.exp(-((s - KNOCK1) / 0.09) ** 2) + math.exp(-((s - KNOCK2) / 0.09) ** 2)
            glowdot(a, W / 2, ly, r, 0.5 + 0.2 * u + 0.5 * press, AMBER, xs, ys)
            # touching the glass: where it presses, a flat bright disc with an edge
            touch = ramp(s, KNOCK1 - 0.6, KNOCK1 - 0.05)
            if touch > 0:
                rr = 44 * touch * (1 + 0.12 * press)
                disc = np.clip((rr - np.hypot(xs - W / 2, ys - ly)) / 3, 0, 1)
                a += (disc * (0.35 + 0.5 * press))[..., None] * np.array([255, 214, 150], np.float32)
            # the knocks: rings of light crossing the glass from where it touched
            for tk in (KNOCK1, KNOCK2):
                if s >= tk:
                    g = s - tk
                    rad = 60 + 900 * g
                    ring = np.exp(-((np.hypot(xs - W / 2, ys - ly) - rad) / (6 + 30 * g)) ** 2) * math.exp(-g * 1.6)
                    a += (ring * 0.9)[..., None] * AMBER
        # the moment of passing through: a flash of the window's own light
        a += 60 * math.exp(-((s - INSIDE) / 0.12) ** 2)
        a = 255 * (1 - np.exp(-a / 255 * 1.2))
        a *= ease(t / 0.6)
        if s >= S1 - 0.06:
            a *= 0
        a += rng.normal(0, 2.0, (H, W, 1))
        frame = np.clip(a, 0, 255).astype(np.uint8)
        if TEST:
            Image.fromarray(frame).save(f"{os.environ['TESTDIR']}/p{s:.2f}.png")
            print("test", round(s, 2), flush=True)
            continue
        out.stdin.write(frame.tobytes())
        if n % 96 == 0:
            print(f"{s:6.1f}", flush=True)
    if out:
        out.stdin.close()
        out.wait()


if __name__ == "__main__":
    main()
