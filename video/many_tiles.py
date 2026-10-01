"""Tile library for 'Many of Me': short keyed snippets of the user (all his blue-screen clips), each 3 s at 12 fps,
composited small (88x160) on a dark window background, saved as one .npz in out/drawn/many_tiles.npz.
Every cell of the grid plays one of these, offset in time, so hundreds of him run at once, each doing something else."""
import os
import subprocess
import sys

import imageio_ffmpeg
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from bluekey import key  # noqa: E402

F = imageio_ffmpeg.get_ffmpeg_exe()
TW, TH, TFPS, TLEN = 88, 160, 12, 3.0
SEGS = [("u113", 0.0), ("u113", 4.0), ("u114", 0.0), ("u114", 2.0), ("u114", 4.5), ("u114", 8.0), ("u114", 11.0),
        ("u115", 3.0), ("u115", 6.5), ("u116", 2.0), ("u116", 5.5), ("u116", 12.0), ("u117", 8.0), ("u118", 1.0),
        ("u118", 4.0), ("u118", 8.5), ("u119", 2.5), ("u119", 5.5), ("u119", 9.0), ("u119", 12.0), ("u120", 4.0),
        ("u120", 8.5), ("u121", 2.0), ("u121", 6.0), ("u121", 10.0), ("u122", 4.0), ("u122", 7.0), ("u123", 2.5),
        ("u123", 6.0), ("u125", 1.0), ("u125", 7.0), ("u124", 0.5)]


def main():
    tiles = []
    for clip, t0 in SEGS:
        raw = subprocess.run([F, "-loglevel", "error", "-ss", f"{t0}", "-t", f"{TLEN}", "-i", f"out/user-clips/{clip}.mp4",
                              "-map", "0:v:0", "-vf", f"fps={TFPS},scale=180:320", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                             capture_output=True).stdout
        frs = np.frombuffer(raw, np.uint8).reshape(-1, 320, 180, 3).astype(np.float32)[:int(TLEN * TFPS)]
        seq = []
        for f in frs:
            rgb, al = key(f)
            ys, xs = np.nonzero(al > 0.5)
            # crop to the figure, fit to the tile, feet to the bottom
            top, bot = max(0, ys.min() - 6), min(319, ys.max() + 4)
            cx = int(np.median(xs))
            h = bot - top
            w = int(h * TW / TH)
            x0 = max(0, min(180 - w, cx - w // 2)) if w <= 180 else 0
            w = min(w, 180)
            im = Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8)[top:bot, x0:x0 + w]).resize((TW, TH), Image.LANCZOS)
            am = Image.fromarray((al * 255).astype(np.uint8)[top:bot, x0:x0 + w]).resize((TW, TH), Image.LANCZOS)
            im = np.asarray(im, np.float32) * 0.8
            am = np.asarray(am, np.float32)[..., None] / 255
            bg = np.zeros((TH, TW, 3), np.float32) + np.array([14, 13, 20], np.float32)
            seq.append(np.clip(bg * (1 - am) + im * am, 0, 255).astype(np.uint8))
        while len(seq) < int(TLEN * TFPS):
            seq.append(seq[-1])
        tiles.append(np.stack(seq))
        print(clip, t0, len(seq), flush=True)
    np.savez_compressed("out/drawn/many_tiles.npz", tiles=np.stack(tiles))


if __name__ == "__main__":
    main()
