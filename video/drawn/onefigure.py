"""One figure, one song: a single short clip held in memory and pulled through time for the whole film. Local and free.

Sections on the song clock: {"t0", "t1", "fx": name, plus options}. The source position is driven by `speed` (and
`reverse`, `freeze_at`); effects:
  plain       the clip as it is (with `speed`, `reverse`, `freeze_at`)
  echo        n ghost copies at `gap`-frame intervals, lightest wins: the body becomes a many-limbed creature
  kaleido     the echo folded four ways into a mandala
  slit        each row a moment later than the one above, `depth` frames top to bottom
  finish      a photo-finish camera: the whole frame built from ONE column of pixels scanned over time
  rgbtime     red now, green and blue `split` frames behind, drifting back together
Loudness (of the song) scales echo counts and depths, so the picture breathes with the music.
"""
import math
import subprocess
import sys

import numpy as np

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from timeslip import loudness  # noqa: E402
from wall import F, FPS, H, W  # noqa: E402


def load(path, start=0.0, dur=None):
    args = [F, "-loglevel", "error", "-ss", str(start), "-i", path]
    if dur:
        args += ["-t", str(dur)]
    raw = subprocess.run(args + ["-vf", f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},fps={FPS}",
                                 "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)


def render(src, sections, song, out, dur, darken=0.0):
    clip = load(src)
    L = len(clip)
    env = loudness(song, dur)
    ys, xs = np.mgrid[0:H, 0:W]
    finish = np.zeros((H, W, 3), np.uint8)
    p = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                          str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", out],
                         stdin=subprocess.PIPE)
    pos = 0.0

    def at(i):  # ping-pong through the clip so it never jumps back to the start
        i = int(i) % (2 * L - 2)
        return clip[i if i < L else 2 * L - 2 - i]

    for n in range(int(dur * FPS)):
        t = n / FPS
        s = next((x for x in sections if x["t0"] <= t < x["t1"]), sections[-1])
        e = env[min(n, len(env) - 1)]
        sp = s.get("speed", 1.0)
        pos += -sp if s.get("reverse") else sp
        cur = pos if "freeze_at" not in s else s["freeze_at"]
        fx = s.get("fx", "plain")
        if fx == "plain":
            fr = at(cur)
        elif fx in ("echo", "kaleido"):
            k = int(s.get("n", 6) * (0.4 + 0.6 * e)) + 1
            gap = s.get("gap", 4)
            acc = at(cur).astype(np.float32)
            for j in range(1, k):
                g = at(cur - j * gap).astype(np.float32)
                g = 255 - (255 - g) * (1 - 0.5 * j / (k + 1))  # older ghosts are fainter
                acc = np.minimum(acc, g)  # darkest wins: the dark figure multiplies against the bright sky
            fr = acc.astype(np.uint8)
            if fx == "kaleido":  # the ghost creature folded onto itself, left against right
                half = fr[:, : W // 2]
                fr = np.concatenate([half, half[:, ::-1]], 1)
        elif fx == "slit":
            depth = s.get("depth", 40) * (0.3 + 0.7 * e)
            back = (ys / H * depth).astype(np.int32)
            idx = (np.asarray(cur - back, np.int64)) % (2 * L - 2)
            idx = np.where(idx < L, idx, 2 * L - 2 - idx)
            fr = clip[idx, ys, xs]
        elif fx == "finish":
            if s.get("_started") is None:  # begin from the whole picture, which the scan then eats away
                s["_started"] = True
                finish = at(cur).copy()
            col = at(cur)[:, int(s.get("x", 0.5) * W)]
            step = int(s.get("step", 3))
            finish = np.roll(finish, -step, axis=1)
            finish[:, -step:] = col[:, None, :]
            fr = finish
        elif fx == "rgbtime":
            split = s.get("split", 10) * (0.3 + 0.7 * e) * (0.5 + 0.5 * math.cos(t * s.get("tune", 0.8)))
            fr = np.stack([at(cur)[..., 0], at(cur - split)[..., 1], at(cur - 2 * split)[..., 2]], -1)
        else:
            fr = at(cur)
        if darken or s.get("dark"):
            a = s.get("dark", darken)
            fr = (fr.astype(np.float32) * (1 - a)).astype(np.uint8)
        p.stdin.write(np.ascontiguousarray(fr).tobytes())
        if n % (FPS * 10) == 0:
            print(f"{t:6.1f}s {fx}", flush=True)
    p.stdin.close()
    p.wait()
