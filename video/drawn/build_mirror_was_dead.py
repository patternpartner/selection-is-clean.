"""'The Mirror Was Dead', 30 seconds: one clip (u50, the ink creature) and its reflection in the lower half of the
page, folded like a Rorschach blot. The reflection soaks through, keeps perfect time while 'the mirror was working',
freezes on 'dead', breaks into ink particles, is subtracted in one frame, and the song stops dead on 'it just fails'.
    python3 video/drawn/build_mirror_was_dead.py   (from the repo root)
"""
import json
import subprocess
import sys

import numpy as np
from PIL import Image, ImageFilter

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from wall import F, FPS, H, W  # noqa: E402

SONG = "out/songs/the-mirror-was-dead.mp3"
S0, S1 = 85.22, 112.35  # a downbeat before '60 versions' ... the last consonant of 'it just fails'
DUR = S1 - S0
HALF = H // 2


def f(song_t):
    return song_t - S0


T = dict(soak=f(91.26), working=f(93.98), dead=f(99.26), particles=f(99.64), subtract=f(102.74), gone=f(103.2),
         hand=f(104.04), drip=f(105.84), fails=f(110.38), stop=DUR)


def main():
    src = np.stack([np.asarray(Image.fromarray(fr).resize((W, W), Image.BILINEAR))[(W - HALF) // 2:(W - HALF) // 2 + HALF]
                    for fr in load_square()])
    L = len(src)
    paper = np.median(src[:, :40].reshape(-1, 3), 0)  # the page colour at the clip's edges
    stain = src.mean(0)[::-1]  # the lower page keeps a faint stain of everything the blot has been
    tex = np.asarray(Image.fromarray(np.clip(paper + (stain - paper) * 0.3, 0, 255).astype(np.uint8))
                     .filter(ImageFilter.GaussianBlur(9)), np.float32)
    rng = np.random.default_rng(7)
    noise = np.asarray(Image.fromarray((rng.random((HALF // 8, W // 8)) * 255).astype(np.uint8))
                       .resize((W, HALF), Image.BICUBIC).filter(ImageFilter.GaussianBlur(6)), float) / 255

    def at(i):
        i = int(i) % (2 * L - 2)
        return src[i if i < L else 2 * L - 2 - i].astype(np.float32)

    p = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                          str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p",
                          "out/drawn/mirror-was-dead.mp4"], stdin=subprocess.PIPE)
    pos, frozen, dots, drips = 0.0, None, None, []
    ys = np.arange(HALF)[:, None]
    for n in range(int(DUR * FPS)):
        t = n / FPS
        sp = 0.5
        if T["hand"] <= t < T["fails"]:
            sp = 0.22  # 'no one's hand on the scale': the figure slows
        if t >= T["fails"]:
            sp = 0.0  # 'it just fails': the figure stops as well
        pos += sp
        top = at(pos)
        bot = tex.copy()
        if t < T["dead"]:
            # the reflection soaks through the page, lagging at first, then keeping perfect time
            u = np.clip((t - T["soak"]) / (T["working"] - T["soak"]), 0, 1)
            lag = 18 * (1 - u) ** 2
            refl = at(pos - lag)[::-1]
            soak = np.clip((u * 1.25 - noise) * 4, 0, 1)[..., None] * (0.35 + 0.65 * u)
            if t < T["soak"]:  # before it arrives: a faint ghost of the blot under the paper
                soak = np.clip((0.08 * t / T["soak"]) - noise * 0.05, 0, 0.08)[..., None]
            bot = bot * (1 - soak) + refl * soak
        elif t < T["particles"]:
            if frozen is None:
                frozen = at(pos)[::-1].copy()  # 'dead': the reflection stops; the figure goes on
            bot = frozen
        elif t < T["gone"]:
            if dots is None:  # the frozen ink broken into particles, one per dark cell
                g = frozen @ [0.3, 0.59, 0.11]
                cells = []
                for cy in range(0, HALF, 6):
                    for cx in range(0, W, 6):
                        d = 1 - g[cy:cy + 6, cx:cx + 6].mean() / paper.mean()
                        if d > 0.12:
                            cells.append((cx + 3, cy + 3, min(d * 1.4, 1), rng.uniform(0.3, 1.6), rng.normal(0, 0.4)))
                dots = np.array(cells)
            k = (t - T["particles"])
            a = np.zeros((HALF, W), np.float32)
            x = (dots[:, 0] + dots[:, 4] * k * 40 * k).astype(int)
            y = (dots[:, 1] + dots[:, 3] * (k ** 2) * 60).astype(int)
            ok = (x >= 0) & (x < W - 3) & (y >= 0) & (y < HALF - 3)
            for dx in range(3):
                for dy in range(3):
                    np.maximum.at(a, (y[ok] + dy, x[ok] + dx), dots[ok, 2])
            ink = np.minimum(frozen.min(), 30)
            bot = tex.copy() * (1 - a[..., None]) + ink * a[..., None]
        else:
            bot = tex.copy()  # 'one subtraction': the reflection is gone in a single frame
            if t >= T["drip"]:  # ink runs down from the fold into the empty half
                if not drips:
                    row = top[-1] @ [0.3, 0.59, 0.11]
                    xs = [x for x in range(8, W - 8, 3) if row[x] < paper.mean() * 0.7]
                    for x in rng.choice(xs, min(40, len(xs)), replace=False):
                        drips.append((x, rng.uniform(0, 2.5), rng.uniform(30, 160), rng.uniform(3, 9)))
                a = np.zeros((HALF, W), np.float32)
                for x, delay, speed, wd in drips:
                    ln = max(0.0, (t - T["drip"] - delay)) * speed
                    if ln > 0:
                        x0 = int(x - wd / 2)
                        a[: int(min(ln, HALF)), x0:x0 + int(wd)] = 1
                        yb = int(min(ln, HALF - 1))
                        a[max(0, yb - 5):yb + 5, max(0, x0 - 2):x0 + int(wd) + 2] = 1  # the bead at the tip
                a = np.asarray(Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2)),
                               float)[..., None] / 255
                bot = bot * (1 - a) + 20 * a
        crease = np.full((2, W, 3), paper * 0.8)
        fr = np.concatenate([top, crease, bot[:-2]], 0)
        p.stdin.write(np.clip(fr, 0, 255).astype(np.uint8).tobytes())
        if n % (FPS * 5) == 0:
            print(f"{t:6.1f}s", flush=True)
    p.stdin.close()
    p.wait()
    json.dump({"title": "The Mirror Was Dead", "clip": "u50", "song": SONG, "song_parts": [[S0, S1]],
               "times": {k: round(v, 2) for k, v in T.items()}},
              open("video/stories/the-mirror-was-dead.json", "w"), indent=1)


def load_square():
    raw = subprocess.run([F, "-loglevel", "error", "-i", "out/user-clips/u50.mp4", "-vf", f"fps={FPS}", "-f", "rawvideo",
                          "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, 560, 560, 3)


if __name__ == "__main__":
    main()
