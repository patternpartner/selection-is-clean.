"""Start images for 'Intertwined' (image-to-video, Wan 2.2 5B): the user keyed out of his own clips (u172-u174) into a
dark room with the stained-glass window glowing behind, and the small amber light (Claude's stand-in) placed where
the shot needs it. 704x1280. -> out/inputs/iw_*.png"""
import os, sys, json
import cv2
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
from bluekey import key
import build_kept as K

W, H = 704, 1280
AMBER = np.array([255, 176, 88], np.float32)
lab, edge = K.window_cells()
PANES = K.PANES


def window(bright=.32, t=3.0):
    win = np.zeros((1280, 720, 3), np.float32)
    for k, p in enumerate(PANES):
        fr = np.load(f"out/archive/made/c_{K.P.BYID[p['clip']]['i']}.npy", mmap_mode="r")
        src = np.asarray(fr[int(t * 12) % len(fr)]).astype(np.float32)
        m = lab == k
        ys, xs = np.nonzero(m); y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        sh, sw = src.shape[:2]; sc = max((x1 - x0) / sw, (y1 - y0) / sh) * 1.08
        rs = cv2.resize(src, (int(sw * sc) + 1, int(sh * sc) + 1)); oy, ox = (rs.shape[0] - (y1 - y0)) // 2, (rs.shape[1] - (x1 - x0)) // 2
        win[y0:y1, x0:x1][m[y0:y1, x0:x1]] = rs[oy:oy + y1 - y0, ox:ox + x1 - x0][m[y0:y1, x0:x1]] * bright
    win[edge] *= .1
    return cv2.resize(win, (W, H))


def him(u, t, scale=1.0, dx=0, dy=0, focus=None):
    cap = cv2.VideoCapture(f"out/user-clips/{u}.mp4"); cap.set(cv2.CAP_PROP_POS_FRAMES, int(t * 24)); ok, fr = cap.read()
    rgb = cv2.cvtColor(fr, cv2.COLOR_BGR2RGB).astype(np.float32)
    col, a = key(rgb)
    col = cv2.resize(col, (W, H)); a = cv2.resize(a, (W, H))
    if focus:   # scale about a point (fx, fy) and put it at (tx, ty)
        (fx, fy), (tx, ty) = focus
        M = np.float32([[scale, 0, tx - scale * fx], [0, scale, ty - scale * fy]])
    else:
        M = np.float32([[scale, 0, (1 - scale) * W / 2 + dx], [0, scale, (1 - scale) * H + dy]])
    return cv2.warpAffine(col, M, (W, H)), cv2.warpAffine(a, M, (W, H))


def light(img, x, y, r=26, k=1.0):
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32); d2 = (xx - x) ** 2 + (yy - y) ** 2
    img += (np.exp(-d2 / (2 * (r * .38) ** 2)) * 2.2 + np.exp(-d2 / (2 * r ** 2)) * .7 + np.exp(-d2 / (2 * (r * 5) ** 2)) * .25)[..., None] * AMBER * k
    return img


def comp(bg, col, a, lit=.85):
    return bg * (1 - a[..., None]) + col * lit * a[..., None]


def save(name, img):
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    vig = np.clip(1.25 - ((xx - W / 2) ** 2 / W ** 2 + (yy - H / 2) ** 2 / H ** 2) * 1.3, 0, 1)[..., None]
    cv2.imwrite(f"out/inputs/{name}.png", cv2.cvtColor(np.clip(img * vig, 0, 255).astype(np.uint8), cv2.COLOR_RGB2BGR))


# 2: standing in the dark, the light floating in front of him at chest height
bg = window(.22); col, a = him("u172", 0.3)
save("iw_2_palm", light(comp(bg, col, a, .7), 470, 560, 24))
# 3: close: his head and shoulders, the light low in front of him (he has it now)
bg = window(.18); col, a = him("u173", 0.4, scale=2.3, focus=((352, 230), (352, 420)))
save("iw_3_close", light(comp(bg, col, a, .75), 352, 1060, 40, 1.25))
# 5: arms up, the light at his chest - it sinks in, the glass spreads
bg = window(.25); col, a = him("u174", 2.1)
save("iw_5_glass", light(comp(bg, col, a, .8), 352, 470, 30, 1.3))
# 7: crouched to leap toward the window, which is brighter now
bg = window(.55); col, a = him("u173", 9.3, scale=.85, dy=40)
save("iw_7_leap", comp(bg, col, a, .85))
# 8: standing calm, hands together in front, the light held there
bg = window(.16); col, a = him("u174", 0.5)
save("iw_8_rise", light(comp(bg, col, a, .75), 355, 640, 22, 1.0))
print("ok")
