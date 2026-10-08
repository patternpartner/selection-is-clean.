"""Put the user's real face back into Intertwined's close shot (Wan clip cdef5f27144b7c0f, first 3 s).
Wan invented a squinting, toothy grin there; the user: "keep the segment but change the face".
Wan's hands, light and shoulders stay; the head is replaced with his real head from u114 0.4-1.0 s (eyes already
lowered, mouth closed, tilting gently down), keyed off the blue, placed by hand-measured keyframes so its glasses
sit where Wan's glasses are, and colour-matched each frame to Wan's warm under-lit head.
-> out/drawn/close_realface.mp4 (73 frames, 24 fps, 704x1280)."""
import os, sys
import cv2
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
from bluekey import key
import build_kept as K

SRC, OUT = "out/clips/cdef5f27144b7c0f.mp4", "out/drawn/close_realface.mp4"
N = 73
# Wan frame -> (glasses centre x, glasses y, head width), measured on a 50 px grid
WAN = {0: (348, 224, 294), 12: (347, 245, 308), 24: (364, 259, 315), 36: (365, 273, 318),
       48: (368, 294, 329), 60: (368, 297, 331), 72: (365, 301, 332)}
# u114 time -> (glasses centre x, glasses y, head width, beard bottom y), source pixels
REAL = {0.4: (356, 132, 140, 240), 0.9: (352, 152, 136, 250), 1.0: (350, 160, 140, 256)}


def interp(table, x):
    ks = sorted(table)
    x = min(max(x, ks[0]), ks[-1])
    for a, b in zip(ks, ks[1:]):
        if a <= x <= b:
            u = (x - a) / (b - a) if b > a else 0
            return [p + (q - p) * u for p, q in zip(table[a], table[b])]
    return list(table[ks[-1]])


def real_frame(cap, t):
    """blend the two nearest source frames, so the slowed motion stays smooth"""
    x = t * 24; i = int(x); u = x - i
    out = []
    for j in (i, i + 1):
        cap.set(cv2.CAP_PROP_POS_FRAMES, j); ok, fr = cap.read()
        out.append(cv2.cvtColor(fr, cv2.COLOR_BGR2RGB).astype(np.float32))
    return out[0] * (1 - u) + out[1] * u


def main():
    wan = cv2.VideoCapture(SRC); real = cv2.VideoCapture("out/user-clips/u114.mp4")
    H, W = 1280, 704
    ff = __import__("subprocess").Popen([K.FF, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                                         "-r", "24", "-i", "-", "-c:v", "libx264", "-crf", "14", "-pix_fmt", "yuv420p", OUT],
                                        stdin=__import__("subprocess").PIPE)
    yy = np.arange(1280, dtype=np.float32)   # source rows
    for f in range(N):
        ok, fr = wan.read()
        base = cv2.cvtColor(fr, cv2.COLOR_BGR2RGB).astype(np.float32)
        e = (f / (N - 1)); e = e * e * (3 - 2 * e)          # ease in and out
        t = 0.4 + 0.6 * e
        wx, wy, ww = interp(WAN, f)
        rx, ry, rw, rb = interp(REAL, t)
        s = ww / rw
        rgb = real_frame(real, t)
        col, a = key(rgb)
        # only the head: everything above the beard's bottom edge, feathered
        a = a * np.clip((rb + 8 - yy[:, None]) / 10.0, 0, 1)
        # and only inside an oval round the head, so his own shoulders and shirt never come with it
        top = ry - 90; cy, ay, ax = (top + rb) / 2, (rb - top) / 2 + 8, rw * .54
        xx = np.arange(720, dtype=np.float32)[None, :]
        a = a * np.clip((1 - ((xx - rx) / ax) ** 2 - ((yy[:, None] - cy) / ay) ** 2) / .12, 0, 1)
        M = np.float32([[s, 0, wx - s * rx], [0, s, wy - s * ry]])
        hc = cv2.warpAffine(col, M, (W, H), flags=cv2.INTER_CUBIC)
        ha = cv2.warpAffine(a, M, (W, H))
        ha = cv2.GaussianBlur(ha, (0, 0), 2.5) * (ha > .02)
        # match Wan's head colour (the amber light coming up under it), per channel mean/std over the head
        m = ha > .6
        if m.sum() > 500:
            for c in range(3):
                bm, bs = base[..., c][m].mean(), base[..., c][m].std() + 1
                hm, hs = hc[..., c][m].mean(), hc[..., c][m].std() + 1
                hc[..., c] = (hc[..., c] - hm) * (.5 + .5 * bs / hs) + hm + (bm - hm) * .85
        # a little extra warmth from below, as the light is under his chin
        lift = np.clip((np.arange(H, dtype=np.float32) - (wy - 40)) / 260.0, 0, 1)[:, None, None]
        hc = hc * (1 + lift * np.array([.10, .04, -.04], np.float32) * min(1, f / 24))
        out = base * (1 - ha[..., None]) + hc * ha[..., None]
        ff.stdin.write(np.clip(out, 0, 255).astype(np.uint8).tobytes())
    ff.stdin.close(); ff.wait()


if __name__ == "__main__":
    main()
