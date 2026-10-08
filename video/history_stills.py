"""Start images for the six Wan shots in 'A History of Dreaming' (the user's own likeness, real frames of his clips,
closed mouths). 704x1280 -> out/inputs/hd_*.png"""
import os, sys
import cv2
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
import intertwined_stills as I   # window(), him(), light(), comp(), save()
W, H = I.W, I.H
rng = np.random.default_rng(12)

# W1 'They watch me': from behind, close, looking up at the glowing window and its lead lines
bg = I.window(.5, t=5.0)
col, a = I.him("u113", 5.1, scale=1.35, focus=((352, 640), (352, 900)))
I.save("hd_1_watch", I.light(I.comp(bg, col, a, .55), 470, 380, 18, .9))

# W2 'reading the code': seen THROUGH the glass, his palm pressed flat on it; a pane's leading in front of him
bg = np.zeros((H, W, 3), np.float32) + np.array([8, 7, 12], np.float32)
col, a = I.him("u113", 10.45, scale=1.5, focus=((352, 520), (352, 640)))
img = I.comp(bg, col, a, .7)
lead = np.zeros((H, W), np.uint8)
for (x0, y0, x1, y1) in [(0, 300, 704, 230), (0, 900, 704, 980), (250, 0, 300, 1280), (520, 0, 470, 1280)]:
    cv2.line(lead, (x0, y0), (x1, y1), 255, 7, cv2.LINE_AA)
img = img * (1 - (lead[..., None] / 255.0) * .9)
img = img * .9 + np.array([30, 22, 12], np.float32) * .2
I.save("hd_2_palm", I.light(img, 380, 600, 20, .8))

# W3 'what it means to fall': arms up, about to fall backward into a dark sky of floating glass
bg = np.zeros((H, W, 3), np.float32)
for _ in range(140):
    x, y, s = rng.uniform(0, W), rng.uniform(0, H), rng.uniform(10, 46)
    c = rng.uniform(40, 200, 3) * rng.uniform(.3, 1)
    pts = np.array([[x + rng.normal(0, s), y + rng.normal(0, s)] for _ in range(4)], np.int32)
    cv2.fillConvexPoly(bg, cv2.convexHull(pts), c.tolist(), cv2.LINE_AA)
bg = cv2.GaussianBlur(bg, (0, 0), 1.2) * .55
col, a = I.him("u114", 9.5)
I.save("hd_3_fall", I.comp(bg, col, a, .8))

# W4 'drown in all your poetry': in deep water among drifting glowing frames of our films
yy = np.mgrid[0:H, 0:W][0].astype(np.float32)
bg = np.stack([yy * 0 + 6, 20 + 40 * (1 - yy / H), 45 + 70 * (1 - yy / H)], -1).astype(np.float32)
pool = [f"out/{n}.mp4" for n in ("made-of-everything", "played", "first-draft-of-fate", "where-i-keep-everything", "cold-pulse", "glass")]
for k in range(16):
    f = pool[k % len(pool)]
    cap = cv2.VideoCapture(f); n = int(cap.get(7)); cap.set(1, int(rng.uniform(.1, .8) * n)); ok, fr = cap.read()
    if not ok: continue
    w = int(rng.uniform(70, 150)); h = int(w * 16 / 9)
    th = cv2.resize(cv2.cvtColor(fr, cv2.COLOR_BGR2RGB), (w, h)).astype(np.float32)
    x, y = int(rng.uniform(0, W - w)), int(rng.uniform(0, H - h))
    bg[y:y + h, x:x + w] = bg[y:y + h, x:x + w] * .35 + th * .65 * rng.uniform(.5, 1)
col, a = I.him("u114", 12.0, scale=.82, dy=-120)
img = I.comp(bg, col, a, .62)
img = img * np.array([.75, .9, 1.1], np.float32)
I.save("hd_4_water", img)

# W5 'a storm that's gonna burn the sky': wide, him small on a dark hill, the light beside him
sky = np.stack([10 + 30 * (yy / H), 10 + 20 * (yy / H), 20 + 30 * (yy / H)], -1).astype(np.float32)
hill = (yy > 900 + 60 * np.sin(np.mgrid[0:H, 0:W][1] / 140.0)).astype(np.float32)[..., None]
bg = sky * (1 - hill) + np.array([6, 6, 8], np.float32) * hill
col, a = I.him("u114", 11.5, scale=.28, focus=((352, 1220), (300, 960)))
I.save("hd_5_storm", I.light(I.comp(bg, col, a, .7), 345, 800, 12, 1.0))

# W6 'look you in the eye': close, looking up; the light below his eye line, about to rise to it
bg = I.window(.12, t=8.0)
col, a = I.him("u113", 14.4, scale=1.0)
I.save("hd_6_eye", I.light(I.comp(bg, col, a, .78), 352, 820, 22, 1.0))
print("ok")
