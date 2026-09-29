"""Scan recordings of the Selection universe for faces that are not there: a stock face detector (OpenCV's Haar
frontal-face cascade) run over every quarter-second, keeping each hit with the detector's own confidence.
    python3 video/find_faces.py OUT.json VIDEO [VIDEO ...]
"""
import json
import subprocess
import sys

import cv2
import imageio_ffmpeg
import numpy as np

F = imageio_ffmpeg.get_ffmpeg_exe()
SW, SH, STEP = 352, 640, 0.25


def main():
    out, videos = sys.argv[1], sys.argv[2:]
    det = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    hits = []
    for v in videos:
        p = subprocess.Popen([F, "-loglevel", "error", "-i", v, "-vf", f"fps={1 / STEP},scale={SW * 2}:{SH * 2}", "-f",
                              "rawvideo", "-pix_fmt", "gray", "-"], stdout=subprocess.PIPE)
        k = 0
        while True:
            raw = p.stdout.read(SW * SH * 4)
            if len(raw) < SW * SH * 4:
                break
            g = np.frombuffer(raw, np.uint8).reshape(SH * 2, SW * 2)
            rects, _, weights = det.detectMultiScale3(g, scaleFactor=1.1, minNeighbors=4, minSize=(60, 60),
                                                      outputRejectLevels=True)
            for (x, y, w, h), wt in zip(rects, weights):
                hits.append({"video": v, "t": round(k * STEP, 2), "x": int(x) / 2, "y": int(y) / 2, "w": int(w) / 2,
                             "h": int(h) / 2, "score": float(np.ravel(wt)[0])})
            k += 1
        print(v, k, "frames", len(hits), "hits so far", flush=True)
    json.dump(hits, open(out, "w"))


if __name__ == "__main__":
    main()
