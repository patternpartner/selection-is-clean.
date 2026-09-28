"""Time as a material: every part of the frame shows a different moment. Local and free.

The renderer keeps the last N frames; each output pixel is taken from the frame `depth * map(x, y)` ago, where the map
is a shape (rows = slit-scan, radial = ripples from a point, spiral, bands...) and the depth follows the song's
loudness plus per-shot boosts. Calm passages look nearly normal; loud ones melt. Across a cut the new shot washes in
through the old one along the same map.

Shots: {"src": "clip.mp4@start" or still, "t0", "t1", "map": name, "depth": [d0, d1] (0..1 of N frames),
        "cx", "cy" (centre for radial/spiral), "speed": playback rate (<1 slows the source)}.
"""
import math
import subprocess
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from wall import F, FPS, H, W, Pool  # noqa: E402

N = 72  # three seconds of history


def make_map(name, t, cx=0.5, cy=0.5):
    """0..1 per pixel: how far back in time that pixel looks."""
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    if name == "rows":
        m = y / H
    elif name == "rows_up":
        m = 1 - y / H
    elif name == "cols":
        m = x / W
    elif name == "radial":
        m = np.hypot(x - cx * W, (y - cy * H)) / math.hypot(W, H) * 1.6
    elif name == "radial_in":
        m = 1 - np.hypot(x - cx * W, (y - cy * H)) / math.hypot(W, H) * 1.6
    elif name == "spiral":
        a = (np.arctan2(y - cy * H, x - cx * W) / (2 * math.pi) + 0.5)
        r = np.hypot(x - cx * W, y - cy * H) / 400
        m = (a + r) % 1.0
    elif name == "bands":
        m = ((y // 80) % 2) * 0.9 + 0.05
    elif name == "waves":
        m = 0.5 + 0.5 * np.sin(y / 70 + np.sin(x / 90) * 2 + t * 1.5)
    elif name == "checker":
        m = (((x // 88) + (y // 80)) % 2) * 0.9 + 0.05
    else:
        m = np.zeros((H, W), np.float32)
    return np.clip(m, 0, 1)


def loudness(song, dur):
    raw = subprocess.run([F, "-loglevel", "error", "-i", song, "-ac", "1", "-ar", "8000", "-f", "s16le", "-"],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.int16).astype(float) / 32768
    hop = 8000 // FPS
    env = np.array([np.sqrt(np.mean(x[i:i + hop * 3] ** 2)) for i in range(0, len(x), hop)])
    db = 20 * np.log10(env + 1e-6)
    lo, hi = np.percentile(db, 20), np.percentile(db, 97)
    e = np.clip((db - lo) / (hi - lo + 1e-9), 0, 1)
    k = np.ones(12) / 12
    return np.convolve(e, k, "same")


def render(shots, song, out, dur):
    pool = Pool()
    env = loudness(song, dur)
    buf = np.zeros((N, H, W, 3), np.uint8)
    ys, xs = np.mgrid[0:H, 0:W]
    maps = {}
    p = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                          str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", out],
                         stdin=subprocess.PIPE)
    for n in range(int(dur * FPS)):
        t = n / FPS
        k = next((i for i, s in enumerate(shots) if s["t0"] <= t < s["t1"]), len(shots) - 1)
        s = shots[k]
        u = (t - s["t0"]) / max(s["t1"] - s["t0"], 1e-6)
        sp = s.get("speed", 1.0)
        img = pool.get(s["src"], (W, H), int(n * sp) if sp != 1 else n)
        buf[n % N] = np.asarray(img)
        d0, d1 = s.get("depth", [0.6, 0.6])
        depth = (d0 + (d1 - d0) * u) * (0.25 + 0.75 * env[min(n, len(env) - 1)])
        name = s.get("map", "rows")
        key = (name, s.get("cx", 0.5), s.get("cy", 0.5)) if name != "waves" else None
        if key is None:
            m = make_map(name, t)
        else:
            if key not in maps:
                maps[key] = make_map(name, 0, s.get("cx", 0.5), s.get("cy", 0.5))
            m = maps[key]
        back = np.minimum((m * depth * (N - 1)).astype(np.int32), min(n, N - 1))
        frame = buf[(n - back) % N, ys, xs]
        p.stdin.write(frame.tobytes())
        if n % (FPS * 10) == 0:
            pool.tidy(n)
            print(f"{t:6.1f}s shot {k}", flush=True)
    p.stdin.close()
    p.wait()
