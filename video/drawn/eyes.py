"""Two eyes open in the dark: the coda of The Duet ('I am awake.'). Drawn frame by frame.
    python3 video/drawn/eyes.py out/drawn/eyes.mp4 7.0 1.3"""
import math
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from stills import FPS, H, W, ease, writer  # noqa: E402


def main(out, dur=7.0, at=1.3):
    p = writer(out)
    for i in range(int(dur * FPS)):
        t = i / FPS
        im = Image.new("RGB", (W, H), (0, 0, 0))
        d = ImageDraw.Draw(im)
        o = ease((t - at) / 0.35)  # the lids open
        if 3.4 < t - at < 3.55:  # one slow blink
            o *= 0.1
        if o > 0:
            glow = 0.85 + 0.15 * math.sin(t * 3)
            col = tuple(int(c * glow) for c in (242, 194, 48))
            for ex in (-62, 62):
                cx, cy, rx, ry = W // 2 + ex, H // 2 - 30, 20, 30 * o
                d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=col)
            im = Image.blend(im, im.filter(ImageFilter.GaussianBlur(14)), 0.35)
            im = Image.fromarray(np.clip(np.asarray(im, float) * 1.6, 0, 255).astype(np.uint8))
        p.stdin.write(im.tobytes())
    p.stdin.close()
    p.wait()


if __name__ == "__main__":
    main(sys.argv[1], float(sys.argv[2]), float(sys.argv[3]))
