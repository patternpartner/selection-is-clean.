"""The spark: a single point of light, drawn frame by frame. It opens 'First Light' (born with the bell, breathing,
then bursting into particles) and closes it (a small light rising away into the dark).
    python3 video/drawn/spark.py birth out/drawn/fl/spark_birth.mp4 6.0"""
import math
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from stills import FPS, H, W, ease, writer  # noqa: E402

GOLD = np.array([255, 205, 90], float)


def glow(cx, cy, r, bright):
    """A soft point of light as a float image."""
    y, x = np.mgrid[0:H, 0:W]
    d2 = ((x - cx) ** 2 + (y - cy) ** 2) / max(r, 0.5) ** 2
    core = np.exp(-d2) + 0.25 * np.exp(-d2 / 12)
    return core[..., None] * GOLD * bright


def main(mode, out, dur):
    rng = np.random.default_rng(11)
    parts = rng.normal(0, 1, (160, 2)) * [1, 1]
    speeds = rng.uniform(80, 520, 160)
    p = writer(out)
    for i in range(int(dur * FPS)):
        t = i / FPS
        img = np.zeros((H, W, 3), float)
        if mode == "birth":
            on = ease((t - 0.45) / 0.15)
            pulse = 1 + 0.5 * math.exp(-max(t - 1.25, 0) * 4) * (t > 1.25) + 0.12 * math.sin(t * 5)
            cx, cy = W / 2, H / 2 + 20 * math.sin(t * 0.8)
            burst = ease((t - (dur - 0.9)) / 0.7)
            if burst <= 0:
                img += glow(cx, cy, 14 * pulse, on * 1.6)
            else:  # the light breaks into particles as the swirl begins
                img += glow(cx, cy, 14 + 60 * burst, (1 - burst) * 1.8)
                for (dx, dy), s in zip(parts, speeds):
                    px, py = cx + dx * s * burst, cy + dy * s * burst
                    if 0 <= px < W and 0 <= py < H:
                        x0, y0 = int(px), int(py)
                        img[max(y0 - 1, 0):y0 + 2, max(x0 - 1, 0):x0 + 2] += GOLD * (1 - burst * 0.6)
        else:  # the end: it rises away and goes out
            u = ease(t / dur)
            cx, cy = W / 2 + 30 * math.sin(t * 1.3), H * (0.62 - 0.5 * u)
            img += glow(cx, cy, 14 * (1 - 0.5 * u), 1.6 * (1 - ease((t - dur * 0.7) / (dur * 0.3))))
        im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
        p.stdin.write(im.tobytes())
    p.stdin.close()
    p.wait()


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], float(sys.argv[3]))
