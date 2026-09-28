"""Hand-drawn animation, frame by frame, in code: no video model, no cost.

    python3 video/drawn/mask_test.py out/drawn-mask-test.mp4

Drawn 'on twos' (a new drawing every second frame at 24 fps) with boiling lines: each drawing jitters a little, the
way hand-inked cels never quite line up. A smiley is inked stroke by stroke, filled, blinks, then lifts like a mask
off the face underneath: two robot eyes. The series' peel that the video model could never draw cleanly.
"""
import math
import subprocess
import sys

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw

W, H, FPS = 704, 1280, 24
PAPER, INK, YELLOW, CYAN = (236, 228, 208), (28, 24, 22), (242, 194, 48), (80, 230, 255)
CX, CY, R = W // 2, H // 2 - 40, 230


def wobble(points, rng, amp=2.2):
    return [(x + rng.normal(0, amp), y + rng.normal(0, amp)) for x, y in points]


def arc(cx, cy, r, a0, a1, frac=1.0, n=90):
    a1 = a0 + (a1 - a0) * frac
    return [(cx + r * math.cos(a), cy + r * math.sin(a)) for a in np.linspace(a0, a1, max(2, int(n * abs(frac)) + 2))]


def ease(t):
    t = min(max(t, 0.0), 1.0)
    return t * t * (3 - 2 * t)


def frame(t, rng):
    im = Image.new("RGB", (W, H), PAPER)
    # paper grain
    g = rng.normal(0, 6, (H // 4, W // 4, 1)).repeat(4, 0).repeat(4, 1)
    im = Image.fromarray(np.clip(np.asarray(im, float) + g, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(im)
    lift = ease((t - 4.6) / 1.1)  # the mask comes off
    dy, tilt = -lift * 520, lift * 0.35
    # underneath: the robot face, only once the mask starts to move
    if lift > 0:
        d.ellipse([CX - R + 8, CY - R + 8, CX + R - 8, CY + R - 8], fill=(20, 22, 30))
        glow = 0.6 + 0.4 * math.sin(t * 9)
        for ex in (-80, 80):
            c = tuple(int(v * glow) for v in CYAN)
            d.ellipse([CX + ex - 30, CY - 50, CX + ex + 30, CY + 10], fill=c)
    # the mask, drawn relative to its own centre so it can lift and tilt
    mx, my = CX + lift * 60, CY + dy
    rot = lambda pts: [(mx + (x - CX) * math.cos(tilt) - (y - CY) * math.sin(tilt),
                        my + (x - CX) * math.sin(tilt) + (y - CY) * math.cos(tilt)) for x, y in pts]
    ring = ease(t / 1.4)
    if t > 2.9:  # crayon fill
        d.polygon(wobble(rot(arc(CX, CY, R - 4, 0, 2 * math.pi)), rng, 3), fill=YELLOW)
    if ring > 0:
        d.line(wobble(rot(arc(CX, CY, R, -math.pi / 2, 1.5 * math.pi, ring)), rng), fill=INK, width=9, joint="curve")
    blink = 3.8 < t < 3.95
    for i, ex in enumerate((-80, 80)):
        pop = ease((t - 1.5 - i * 0.25) / 0.2)
        if pop > 0:
            if blink:
                d.line(wobble(rot([(CX + ex - 22, CY - 40), (CX + ex + 22, CY - 40)]), rng), fill=INK, width=9)
            else:
                rr = 22 * pop
                pts = rot([(CX + ex, CY - 40)])[0]
                d.ellipse([pts[0] - rr, pts[1] - rr * 1.4, pts[0] + rr, pts[1] + rr * 1.4], fill=INK)
    smile = ease((t - 2.2) / 0.6)
    if smile > 0:
        d.line(wobble(rot(arc(CX, CY + 10, 140, math.radians(20), math.radians(160), smile)), rng), fill=INK, width=10)
    fade = ease((t - 6.6) / 0.6)
    if fade > 0:
        im = Image.blend(im, Image.new("RGB", (W, H), (0, 0, 0)), fade)
    return im


def main(out, seconds=7.5):
    p = subprocess.Popen([imageio_ffmpeg.get_ffmpeg_exe(), "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt",
                          "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "18",
                          "-pix_fmt", "yuv420p", out], stdin=subprocess.PIPE)
    for i in range(int(seconds * FPS)):
        rng = np.random.default_rng(i // 2)  # on twos: each drawing is held for two frames, then redrawn
        p.stdin.write(frame((i // 2) * 2 / FPS, rng).tobytes())
    p.stdin.close()
    p.wait()


if __name__ == "__main__":
    main(sys.argv[1])
