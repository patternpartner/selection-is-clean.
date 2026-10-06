"""Index the archive for 'Where I Keep Everything': every clip that is NOT the user's likeness and NOT a real person's
face or someone's character IP (the user-clips catalogue tags) plus the generated episode clips in out/clips/.
For each: a 4 s loop at 12 fps, the long side 192 px (out/archive/thumbs_<i>.npy), a feature for the layout (a 12x12
colour thumbnail of the middle frame), and its own sound if it has any (mono 16 kHz, first 8 s).
    python3 video/archive_index.py      -> out/archive/index.json + per-clip npy
"""
import glob
import json
import os
import subprocess

import imageio_ffmpeg
import numpy as np

F = imageio_ffmpeg.get_ffmpeg_exe()
OUT = "out/archive"
SKIP_TAGS = {"own-likeness", "real-face", "character-ip", "real-context"}


def probe(p):
    r = subprocess.run([F, "-i", p], capture_output=True, text=True).stderr
    import re
    m = re.search(r"Video:.*?(\d{3,4})x(\d{3,4})", r)
    d = re.search(r"Duration: (\d+):(\d+):([\d.]+)", r)
    dur = int(d.group(1)) * 3600 + int(d.group(2)) * 60 + float(d.group(3)) if d else 5
    return (int(m.group(1)), int(m.group(2))) if m else (720, 1280), dur, "Audio:" in r


def main():
    os.makedirs(OUT, exist_ok=True)
    cat = json.load(open("video/user-clips.json"))
    srcs = []
    for e in cat:
        tags = set(e.get("tags", []))
        if tags & SKIP_TAGS or "OWN LIKENESS" in e.get("what", "").upper() or "USER'S OWN" in e.get("what", "").upper():
            continue
        srcs.append((e["id"], e["file"], e.get("what", "")))
    for p in sorted(glob.glob("out/clips/*.mp4")):
        srcs.append(("g" + os.path.basename(p)[:8], p, "generated episode clip"))
    index = []
    for i, (cid, path, what) in enumerate(srcs):
        if not os.path.exists(path):
            continue
        (w, h), dur, has_a = probe(path)
        s = 192 / max(w, h)
        tw, th = int(w * s) // 2 * 2, int(h * s) // 2 * 2
        t0 = max(0.0, min(dur * 0.3, dur - 4.2))
        raw = subprocess.run([F, "-loglevel", "error", "-ss", f"{t0:.2f}", "-t", "4", "-i", path, "-map", "0:v:0", "-vf",
                              f"fps=12,scale={tw}:{th}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
        fr = np.frombuffer(raw, np.uint8)
        n = len(fr) // (tw * th * 3)
        if n < 4:
            continue
        fr = fr[:n * tw * th * 3].reshape(n, th, tw, 3)
        np.save(f"{OUT}/thumbs_{i}.npy", fr)
        mid = fr[n // 2].astype(np.float32)
        feat = np.asarray(__import__("PIL.Image", fromlist=["Image"]).fromarray(mid.astype(np.uint8)).resize((12, 12)),
                          np.float32).ravel() / 255
        audio = None
        if has_a:
            ra = subprocess.run([F, "-loglevel", "error", "-ss", f"{t0:.2f}", "-t", "8", "-i", path, "-map", "0:a:0", "-ac", "1",
                                 "-ar", "16000", "-f", "s16le", "-"], capture_output=True).stdout
            if len(ra) > 32000:
                np.save(f"{OUT}/audio_{i}.npy", np.frombuffer(ra, np.int16))
                audio = f"{OUT}/audio_{i}.npy"
        lum = float(mid.mean())
        index.append({"i": i, "id": cid, "what": what[:120], "w": tw, "h": th, "frames": n, "lum": lum,
                      "thumbs": f"{OUT}/thumbs_{i}.npy", "audio": audio, "feat": feat.round(3).tolist()})
        print(i, cid, tw, th, n, "audio" if audio else "", flush=True)
    json.dump(index, open(f"{OUT}/index.json", "w"))
    print("indexed", len(index))


if __name__ == "__main__":
    main()
