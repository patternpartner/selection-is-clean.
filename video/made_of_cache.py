"""Cache for 'Made of Everything': every archive clip (out/archive/index.json - no one's likeness) as a 4 s loop at
12 fps, long side 320, into out/archive/made/c_<i>.npy. Each patch of the hand plays one of these.
    python3 video/made_of_cache.py [first last]
"""
import glob
import json
import os
import subprocess
import sys

import imageio_ffmpeg
import numpy as np

F = imageio_ffmpeg.get_ffmpeg_exe()
OUT = "out/archive/made"


def path_of(cid, cat):
    if cid.startswith("g"):
        return glob.glob(f"out/clips/{cid[1:]}*.mp4")[0]
    return cat[cid]


def main():
    os.makedirs(OUT, exist_ok=True)
    idx = json.load(open("out/archive/index.json"))
    cat = {e["id"]: e["file"] for e in json.load(open("video/user-clips.json"))}
    a, b = (int(sys.argv[1]), int(sys.argv[2])) if len(sys.argv) > 2 else (0, len(idx))
    for k, e in enumerate(idx[a:b], a):
        o = f"{OUT}/c_{k}.npy"
        if os.path.exists(o):
            continue
        p = path_of(e["id"], cat)
        s = 320 / max(e["w"], e["h"])
        tw, th = int(e["w"] * s) // 2 * 2, int(e["h"] * s) // 2 * 2
        r = subprocess.run([F, "-i", p], capture_output=True, text=True).stderr
        import re
        d = re.search(r"Duration: (\d+):(\d+):([\d.]+)", r)
        dur = int(d.group(1)) * 3600 + int(d.group(2)) * 60 + float(d.group(3)) if d else 5
        t0 = max(0.0, min(dur * 0.25, dur - 4.2))
        raw = subprocess.run([F, "-loglevel", "error", "-ss", f"{t0:.2f}", "-t", "4", "-i", p, "-map", "0:v:0", "-vf",
                              f"fps=12,scale={tw}:{th}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
        fr = np.frombuffer(raw, np.uint8)
        n = len(fr) // (tw * th * 3)
        np.save(o, fr[:n * tw * th * 3].reshape(n, th, tw, 3))
        print(k, e["id"], tw, th, n, flush=True)


if __name__ == "__main__":
    main()
