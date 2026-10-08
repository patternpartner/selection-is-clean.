"""Motion of the user's keyed body in u172-u174, per frame (24 fps): the silhouette's box, centroid, and speed (mean
change of the key between frames). Kinematic beats - the moments the body pauses or lands - are the local minima of
speed between movements; those are what get put on the music's beats. -> video/kept_motion.json"""
import json
import cv2
import numpy as np
from scipy.ndimage import gaussian_filter1d
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from bluekey import key

out = {}
for u in ("u172", "u173", "u174"):
    cap = cv2.VideoCapture(f"out/user-clips/{u}.mp4")
    rows, prev = [], None
    while True:
        ok, fr = cap.read()
        if not ok:
            break
        sm = cv2.resize(cv2.cvtColor(fr, cv2.COLOR_BGR2RGB), (180, 320)).astype(np.float32)
        _, a = key(sm)
        m = a > .5
        ys, xs = np.nonzero(m)
        box = [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())] if len(xs) else [0, 0, 0, 0]
        cen = [float(xs.mean()), float(ys.mean())] if len(xs) else [90.0, 160.0]
        sp = float(np.abs(a - prev).mean()) if prev is not None else 0.0
        prev = a
        rows.append({"box": [v * 4 for v in box], "cen": [cen[0] * 4, cen[1] * 4], "speed": sp})
    spd = gaussian_filter1d(np.array([r["speed"] for r in rows]), 1.5)
    beats = [i for i in range(2, len(spd) - 2) if spd[i] <= spd[i - 1] and spd[i] <= spd[i + 1] and spd[i] < spd[max(0, i - 8):i + 9].max() * .6]
    out[u] = {"frames": rows, "speed": [round(float(v), 4) for v in spd], "beats": [round(i / 24, 3) for i in beats]}
    print(u, len(rows), "frames; pauses at", out[u]["beats"])
json.dump(out, open("video/kept_motion.json", "w"))
