"""Start images for Turns Out v3's second act: Claude's fears, with the user in them answering each one (back views
from u113 5.2-5.6 s, so Wan never has his face to warp), and the ending in the boat.
The backgrounds are the first frames of Claude's own Wan shots, so act two lands in the same places as before.
1280x704 -> out/inputs/to3_*.png"""
import os, sys
import cv2
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
from bluekey import key

W, H = 1280, 704
AMBER = np.array([255, 176, 88], np.float32)


def frame(path, t):
    c = cv2.VideoCapture(path); c.set(cv2.CAP_PROP_POS_FRAMES, int(round(t * (c.get(5) or 24)))); ok, f = c.read()
    f = cv2.cvtColor(f, cv2.COLOR_BGR2RGB).astype(np.float32)
    h, w = f.shape[:2]; s = max(W / w, H / h)
    f = cv2.resize(f, (int(w * s + .5), int(h * s + .5)), interpolation=cv2.INTER_CUBIC)
    y = (f.shape[0] - H) // 2; x = (f.shape[1] - W) // 2
    return f[y:y + H, x:x + W]


def him(t, feet_x, feet_y, tall, light=(1.0, 1.0, 1.0), rim=None):
    """his keyed back view, feet at (feet_x, feet_y), lit to the scene: a colour multiply, and a rim from a light"""
    c = cv2.VideoCapture("out/user-clips/u113.mp4"); c.set(cv2.CAP_PROP_POS_FRAMES, int(round(t * 24))); ok, f = c.read()
    col, a = key(cv2.cvtColor(f, cv2.COLOR_BGR2RGB).astype(np.float32))
    rows = np.nonzero(a.max(1) > .5)[0]; cols = np.nonzero(a.max(0) > .5)[0]
    top, bot = rows.min(), rows.max(); cx = cols.mean()
    s = tall / (bot - top)
    M = np.float32([[s, 0, feet_x - s * cx], [0, s, feet_y - s * bot]])
    col = cv2.warpAffine(col, M, (W, H), flags=cv2.INTER_AREA); a = cv2.warpAffine(a, M, (W, H))
    col = col * np.array(light, np.float32)
    if rim is not None:                                   # light wrapping round the edge nearest the light
        (rx, ry), k = rim
        edge = np.clip(a - cv2.erode(a, np.ones((5, 5), np.uint8)), 0, 1)
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        near = np.exp(-((xx - rx) ** 2 + (yy - ry) ** 2) / (2 * 380.0 ** 2))
        col = col + (cv2.GaussianBlur(edge, (0, 0), 2) * near * k)[..., None] * AMBER
    return col, a


def glow(img, x, y, r, k=1.0):
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32); d2 = (xx - x) ** 2 + (yy - y) ** 2
    img += (np.exp(-d2 / (2 * (r * .38) ** 2)) * 2.4 + np.exp(-d2 / (2 * r ** 2)) * .8 + np.exp(-d2 / (2 * (r * 4) ** 2)) * .2)[..., None] * AMBER * k
    return img


def comp(bg, col, a):
    return bg * (1 - a[..., None]) + col * a[..., None]


def save(name, img):
    cv2.imwrite(f"out/inputs/{name}.png", cv2.cvtColor(np.clip(img, 0, 255).astype(np.uint8), cv2.COLOR_RGB2BGR))


# 1. the beach: he walks away along the line of his own footprints, at dusk
bg = frame("out/clips/74d0d34cc108391a.mp4", 0.0)
col, a = him(5.4, 905, 360, 175, light=(.78, .62, .58))
save("to3_1_beach", comp(bg, col, a))

# 2. the hall of mirrors: he stands facing the light, and has no reflection
bg = frame("out/clips/c3679805464eba6b.mp4", 0.0)
col, a = him(5.2, 470, 735, 640, light=(.26, .19, .15), rim=((940, 300), .45))
save("to3_2_mirror", comp(bg, col, a))

# 3. the office: he walks up behind the mannequin at its desk
bg = frame("out/clips/d1585be1e8e79967.mp4", 0.0)
col, a = him(5.6, 760, 720, 470, light=(.15, .19, .29))
save("to3_3_office", comp(bg, col, a))

# 4. the tape: no one in it yet; Wan brings the hand that stops it
save("to3_4_tape", frame("out/clips/9fb8d0346a131e9c.mp4", 0.0))

# 5. the boat: the light comes down out of the mist toward his hands
bg = frame("out/inputs/u-oct10/v10.mp4", 6.0)          # close, his mouth closed (the wide frame has him mid-shout: Wan would make it talk)
save("to3_5_boat", glow(bg, 560, 150, 12, 1.0))
