"""Fire and frost, drawn frame by frame over footage: the renderer behind 'A Beautiful Freeze'. Local and free.

A film is a list of shots on the song's clock:
  {"src": "clip.mp4@start" (or a still), "t0": s, "t1": s,
   "heat": [h0, h1]          how much the picture burns across the shot (0..1): orange grade, heat shimmer, embers,
   "frost": [f0, f1, x, y]   frost grows from (x, y) (fractions of the frame) starting at song time f0, covering it all
                             by f1; under the frost TIME STOPS (the frame freezes) and turns ice-blue,
   "thaw": [a0, a1]          the frost melts back (the picture moves again),
   "push": [z0, z1]}         a slow camera push.
"""
import math
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from wall import F, FPS, H, W, Pool, cover  # noqa: E402


def crystals(x, y, seed, reach=1700):
    """Frost: arms at 60 degrees, each growing side branches at +-60 degrees, recursively; every segment carries its
    distance from the seed point along the crystal, so the frost can grow outward in time."""
    rng = np.random.default_rng(seed)
    segs = []
    base = rng.uniform(0, math.pi / 3)
    stack = [(x, y, base + k * math.pi / 3, 0.0, reach * rng.uniform(0.7, 1.0), 0) for k in range(6)]
    while stack:
        px, py, a, dist, left, depth = stack.pop()
        step = 14 if depth == 0 else 9
        while left > 0:
            nx, ny = px + step * math.cos(a), py + step * math.sin(a)
            segs.append((px, py, nx, ny, dist, depth))
            dist += step
            left -= step
            px, py = nx, ny
            a += rng.normal(0, 0.04)
            if depth < 3 and rng.random() < (0.16 if depth == 0 else 0.1):
                side = rng.choice([-1, 1]) * math.pi / 3
                stack.append((px, py, a + side, dist, left * rng.uniform(0.25, 0.6), depth + 1))
    return segs


def grade(a, kind, amt):
    if amt <= 0:
        return a
    g = a @ [0.3, 0.59, 0.11]
    if kind == "hot":
        tgt = np.stack([np.clip(g * 1.45 + 20, 0, 255), g * 0.78, g * 0.32], -1)
    else:
        tgt = np.stack([g * 0.78 + 30, g * 0.95 + 35, np.clip(g * 1.15 + 50, 0, 255)], -1)
    return a * (1 - amt) + tgt * amt


def render(shots, out, dur, seed=3):
    pool = Pool()
    rng = np.random.default_rng(seed)
    p = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                          str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", out],
                         stdin=subprocess.PIPE)
    ys = np.arange(H)[:, None]
    xs = np.arange(W)[None, :]
    frost_cache, frozen, embers, layers = {}, {}, {}, {}
    for n in range(int(dur * FPS)):
        t = n / FPS
        k = next((i for i, s in enumerate(shots) if s["t0"] <= t < s["t1"]), None)
        if k is None:
            p.stdin.write(bytes(W * H * 3))
            continue
        s = shots[k]
        u = (t - s["t0"]) / max(s["t1"] - s["t0"], 1e-6)
        z0, z1 = s.get("push", [1.0, 1.06])
        z = z0 + (z1 - z0) * u
        img = pool.get(s["src"], (int(W * 1.1), int(H * 1.1)), n)
        img = cover(img.crop(((img.width - img.width / z) / 2, (img.height - img.height / z) / 2,
                              (img.width + img.width / z) / 2, (img.height + img.height / z) / 2)), W, H)
        a = np.asarray(img, float)
        heat = s.get("heat", [0, 0])
        h = heat[0] + (heat[1] - heat[0]) * u
        if h > 0:  # the burning: shimmer, orange, embers
            shift = (np.sin(ys / 23.0 + t * 7) * 5 * h + np.sin(ys / 7.0 - t * 11) * 2 * h).astype(int)
            a = a[ys, np.clip(xs + shift, 0, W - 1)]
            a = grade(a, "hot", 0.7 * h)
        # frost
        m = None
        if "frost" in s:
            f0, f1, fx, fy = s["frost"]
            if t >= f0:
                if k not in frost_cache:
                    frost_cache[k] = crystals(fx * W, fy * H, k * 17 + 1)
                    frozen[k] = a.copy()  # the moment the frost touches, time stops under it
                reach = 1800 * min(max((t - f0) / max(f1 - f0, 1e-6), 0), 1) ** 0.8
                melt = 0.0
                if "thaw" in s and t >= s["thaw"][0]:
                    melt = min(max((t - s["thaw"][0]) / (s["thaw"][1] - s["thaw"][0]), 0), 1)
                if k not in layers:  # the frost only grows: draw just the new ice each frame
                    layers[k] = [Image.new("L", (W // 2, H // 2), 0), Image.new("L", (W // 2, H // 2), 0), -1.0]
                lines, fill, done = layers[k]
                dl, df = ImageDraw.Draw(lines), ImageDraw.Draw(fill)
                for x0, y0, x1, y1, dist, depth in frost_cache[k]:
                    if done < dist <= reach:
                        c = (x0 / 2, y0 / 2, x1 / 2, y1 / 2)
                        dl.line(c, fill=255 if depth < 2 else 170, width=2 if depth == 0 else 1)
                        df.line(c, fill=255, width=22 if depth == 0 else 12)
                layers[k][2] = max(done, reach)
                m = np.asarray(fill.filter(ImageFilter.GaussianBlur(14)).resize((W, H), Image.BILINEAR), float)[..., None] / 255
                m = np.clip(m * 1.6, 0, 1) * (1 - melt)
                ln = np.asarray(lines.resize((W, H), Image.BILINEAR), float)[..., None] / 255 * (1 - melt)
                ice = grade(frozen[k], "cold", 0.85) * 0.9 + 25
                a = a * (1 - m) + ice * m
                a = a * (1 - ln * 0.6) + 255 * ln * 0.6
        a = np.clip(a, 0, 255)
        frame = Image.fromarray(a.astype(np.uint8))
        if h > 0.05:  # embers rising where it is not frozen
            if k not in embers:
                r = np.random.default_rng(k + 99)
                embers[k] = [(r.uniform(0, W), r.uniform(0, H), r.uniform(40, 160), r.uniform(2.5, 6), r.uniform(0, 6))
                             for _ in range(90)]
            d = ImageDraw.Draw(frame)
            for ex, ey, sp, sz, ph in embers[k]:
                y = (ey - sp * (t - s["t0"])) % H
                x = ex + 12 * math.sin(t * 2 + ph)
                if m is not None and m[int(y) % H, int(x) % W, 0] > 0.5:
                    continue
                fl = 0.6 + 0.4 * math.sin(t * 9 + ph)
                d.ellipse([x - sz, y - sz, x + sz, y + sz], fill=(255, int(150 * fl), int(40 * fl)))
        p.stdin.write(frame.tobytes())
        if n % (FPS * 10) == 0:
            pool.tidy(n)
            print(f"{t:6.1f}s shot {k}", flush=True)
    p.stdin.close()
    p.wait()
