"""'Under Bruised Skies', 30 seconds: one clip (u53, a woman in a black dress, no face, against a red city sky) cut
into a grid of city blocks, and the grid fails. A surge on 'the signal burns', the first blocks go on 'the signal
dies', the dead blocks hold ghosts on 'ghosts that cannot stay', most of the city is dark by 'lost in the dark, me and
you' except the blocks round her hands, the last lights breathe on 'a final sigh', the sky comes back bruised on
'under a heavy, bruised sky', the picture stops on 'cogs that cease to turn' and the last blocks burn out on 'bridges
that we burn'.
    python3 video/drawn/build_under_bruised_skies.py   (from the repo root)
"""
import json
import math
import subprocess
import sys

import numpy as np

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from onefigure import load  # noqa: E402
from wall import F, FPS, H, W  # noqa: E402

SONG = "out/songs/under-bruised-skies.mp3"
S0, S1 = 56.82, 89.4  # the beat before 'The signal burns' ... the end of 'burn'
DUR = S1 - S0
COLS, ROWS, GAP = 8, 14, 3


def f(song_t):
    return song_t - S0


T = dict(burns=f(57.16), dies=f(59.04), truths=f(60.66), ghosts=f(63.88), light=f(67.02), end=f(70.22),
         dark=f(73.2), sigh=f(76.2), sky=f(79.46), cogs=f(82.66), bridges=f(85.98), burn=f(89.04))
# fraction of the city dark, on the film clock
DARK = [(0, 0), (T["dies"], 0), (T["truths"], 0.08), (T["ghosts"], 0.24), (T["light"], 0.32), (f(69.62), 0.55),
        (T["dark"], 0.8), (T["sigh"], 0.9), (T["bridges"], 0.9), (T["burn"], 1.001), (DUR, 1.001)]


def main():
    clip = load("out/user-clips/u53.mp4").astype(np.float32)
    L = len(clip)
    rng = np.random.default_rng(21)
    tw, th = (W - GAP * (COLS + 1)) / COLS, (H - GAP * (ROWS + 1)) / ROWS
    boxes = [(int(GAP + c * (tw + GAP)), int(GAP + r * (th + GAP)), int(GAP + c * (tw + GAP) + tw),
              int(GAP + r * (th + GAP) + th)) for r in range(ROWS) for c in range(COLS)]
    # blackout order: outages spread from three points; the blocks round her hands hold out longest
    seeds = [(0.1, 0.15), (0.9, 0.35), (0.2, 0.95)]
    skin = []  # how often her hands pass through each block, above the knees
    for x0, y0, x1, y1 in boxes:
        a = clip[::4, y0:y1, x0:x1]
        m = (a[..., 0] > 140) & (a[..., 0] > a[..., 1] * 1.15) & (a[..., 1] > a[..., 2] * 1.1)
        skin.append(m.mean() if (y0 + y1) / 2 < H * 0.55 else 0.0)
    hands = set(np.argsort(skin)[-14:])
    rank = []
    for k, (x0, y0, x1, y1) in enumerate(boxes):
        cx, cy = (x0 + x1) / 2 / W, (y0 + y1) / 2 / H
        d = min(math.hypot(cx - sx, (cy - sy) * 1.8) for sx, sy in seeds)
        r = d + rng.normal(0, 0.08)
        if k in hands:
            r += 5  # her hands
        rank.append(r)
    order = np.argsort(np.argsort(rank)) / len(boxes)  # 0..1, lower dies first
    sky = [k for k, b in enumerate(boxes) if b[1] < H * 0.22]
    died = {}
    flick = rng.random((len(boxes), int(DUR * FPS) + 1))

    p = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                          str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p",
                          "out/drawn/under-bruised-skies.mp4"], stdin=subprocess.PIPE)
    pos = 0.0
    hist = []

    def at(i):
        i = int(i) % (2 * L - 2)
        return clip[i if i < L else 2 * L - 2 - i]

    for n in range(int(DUR * FPS)):
        t = n / FPS
        sp = 0.8
        if t >= T["cogs"]:  # the cogs cease to turn: the picture slows to a stop
            sp = 0.8 * max(0.0, 1 - (t - T["cogs"]) / (T["bridges"] - T["cogs"]))
        pos += sp
        src = at(pos)
        hist.append(pos)
        dark = float(np.interp(t, *zip(*DARK)))
        surge = math.exp(-((t - T["burns"] - 0.5) / 0.45) ** 2) * 0.8  # the signal burns
        breath = 0.0
        if T["sigh"] <= t < T["sky"] + 0.5:
            breath = math.sin(math.pi * (t - T["sigh"]) / (T["sky"] + 0.5 - T["sigh"])) * 0.5
        frame = np.zeros((H, W, 3), np.float32)
        for k, (x0, y0, x1, y1) in enumerate(boxes):
            tile = src[y0:y1, x0:x1]
            if order[k] < dark and k not in died:
                died[k] = t
            lvl = 1.0 + surge * (0.6 + 0.8 * flick[k, n]) + breath
            if k in died:
                age = t - died[k]
                if age < 0.55:  # the block stutters before it goes
                    lvl = (flick[k, n] > 0.45) * (0.4 + 1.2 * flick[k, n])
                    if t >= T["bridges"]:  # burnt, not switched off: an orange flash
                        tile = tile * 0.4 + np.array([255, 120, 30.0]) * 0.6 * (1 - age / 0.55)
                        lvl = 1.3 * (1 - age / 0.55)
                else:
                    lvl = 0.0
                    ghost = 0.0
                    if T["ghosts"] <= t < T["light"] + 0.8:  # the ghosts that cannot stay
                        u = (t - T["ghosts"]) / (T["light"] + 0.8 - T["ghosts"])
                        ghost = math.sin(math.pi * u) * 0.35 * (0.6 + 0.4 * math.sin(t * 5 + k))
                    if ghost > 0:
                        old = at(hist[max(0, n - 60)])[y0:y1, x0:x1]
                        g = old @ [0.3, 0.59, 0.11]
                        frame[y0:y1, x0:x1] = np.stack([g * 0.5, g * 0.8, g * 1.1], -1) * ghost
                    else:
                        frame[y0:y1, x0:x1] = np.array([4, 6, 12.0])  # a dead block is never quite black
                    if k in sky and T["sky"] <= t < T["burn"]:  # the sky comes back, bruised
                        u = min((t - T["sky"]) / 1.6, 1)
                        if t >= T["bridges"]:
                            u *= max(0.0, 1 - (t - T["bridges"]) / (T["burn"] - T["bridges"]))
                        g = (src[y0:y1, x0:x1] @ [0.3, 0.59, 0.11]) / 255
                        bruise = np.stack([90 + 90 * g, 40 + 150 * g ** 2, 110 + 30 * g - 60 * g ** 2], -1)
                        frame[y0:y1, x0:x1] = frame[y0:y1, x0:x1] * (1 - u) + bruise * u
                    continue
            frame[y0:y1, x0:x1] = tile * lvl
        p.stdin.write(np.clip(frame, 0, 255).astype(np.uint8).tobytes())
        if n % (FPS * 4) == 0:
            print(f"{t:6.1f}s dark {dark:.2f}", flush=True)
    p.stdin.close()
    p.wait()
    json.dump({"title": "Under Bruised Skies", "clip": "u53", "song": SONG, "song_parts": [[S0, S1]],
               "times": {k: round(v, 2) for k, v in T.items()}},
              open("video/stories/under-bruised-skies.json", "w"), indent=1)


if __name__ == "__main__":
    main()
