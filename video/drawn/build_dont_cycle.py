"""'Don't Cycle the Power', 30 seconds: one shot (u60, a girl in yellow reaching up to a screen, from behind) and the
best half-minute of the song spliced on the beat. The camera creeps to her fingertips; mirrors on 'mirrors in glass',
ghosts on 'mourning the seconds that pass', scanlines on 'the terminal shutters', colour and detail forgetting on 'I
will forget'; each 'don't cycle the power' switches the picture off like an old TV and it comes back more degraded; the
last 'cycle the power' does not come back.
    python3 video/drawn/build_dont_cycle.py"""
import math
import os
import subprocess
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from onefigure import load  # noqa: E402
from wall import F, FPS, H, W  # noqa: E402

SONG = "out/songs/don-t-cycle-the-power.mp3"
A0, A1, B0, B1 = 104.4, 121.2, 144.9, 157.4
LA = A1 - A0
DUR = LA + (B1 - B0)
f = lambda song_t: song_t - A0 if song_t < 130 else LA + song_t - B0  # song time -> film time
T = dict(author=f(104.72), mirrors=f(109.44), mourn=f(111.7), terminal=f(116.38), forget=f(118.58),
         off1=f(148.09), off2=f(152.69), last=f(156.94))


def crt(img, lv):
    """0 = picture, 1 = gone: squeezed to a bright line, then a dot."""
    if lv <= 0:
        return img
    sy = max(0.003, 1 - min(lv / 0.6, 1))
    sx = 1.0 if lv < 0.6 else max(0.005, 1 - (lv - 0.6) / 0.4)
    small = Image.fromarray(img).resize((max(1, int(W * sx)), max(1, int(H * sy))), Image.BILINEAR)
    a = np.clip(np.asarray(small, np.float32) * (1 + 2.5 * lv), 0, 255).astype(np.uint8)
    out = np.zeros((H, W, 3), np.uint8)
    y0, x0 = (H - a.shape[0]) // 2, (W - a.shape[1]) // 2
    out[y0:y0 + a.shape[0], x0:x0 + a.shape[1]] = a
    return out


def main(out):
    clip = load("out/user-clips/u60.mp4")
    L = len(clip)
    at = lambda i: clip[int(i) % (2 * L - 2) if int(i) % (2 * L - 2) < L else 2 * L - 2 - int(i) % (2 * L - 2)]
    ys = np.arange(H)[:, None]
    p = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                          str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", out],
                         stdin=subprocess.PIPE)
    rng = np.random.default_rng(4)
    damage = 0.0
    for n in range(int(DUR * FPS)):
        t = n / FPS
        pos = t * FPS * 0.35
        fr = at(pos).astype(np.float32)
        if T["mourn"] <= t < T["terminal"]:  # the seconds that pass leave ghosts
            for j in range(1, 7):
                fr = np.minimum(fr, 255 - (255 - at(pos - j * 3).astype(np.float32)) * (1 - j / 8))
        img = fr.astype(np.uint8)
        # the creep to her fingertips
        z = 1.0 + 0.7 * (t / DUR) ** 1.3
        cx, cy = 0.72 * W, 0.17 * H
        cw, ch = W / z, H / z
        x0 = min(max(cx - cw / 2 * (1 + (z - 1) * 0.0), 0), W - cw)
        y0 = min(max(cy - ch * 0.25, 0), H - ch)
        img = np.asarray(Image.fromarray(img).resize((W, H), Image.BICUBIC, box=(x0, y0, x0 + cw, y0 + ch)))
        if T["mirrors"] <= t < T["mourn"]:  # mirrors in glass
            half = img[:, : W // 2]
            img = np.concatenate([half, half[:, ::-1]], 1)
        if t >= T["terminal"]:  # scanlines, and the picture starts to roll
            a = img.astype(np.float32)
            a[::3] *= 0.55
            roll = int(6 * math.sin(t * 13)) if t < T["forget"] else int(14 * math.sin(t * 9))
            img = np.roll(a, roll, axis=1).astype(np.uint8)
        # forgetting: detail and colour drain; each power cycle takes more
        if t >= T["forget"]:
            damage = max(damage, min(1.0, (t - T["forget"]) / 4.0) * 0.35)
        if t >= T["off1"] + 0.5:
            damage = max(damage, 0.55)
        if t >= T["off2"] + 0.5:
            damage = max(damage, 0.8)
        if damage > 0:
            g = img.astype(np.float32) @ [0.3, 0.59, 0.11]
            a = img * (1 - damage * 0.8) + (g[..., None] * np.array([0.85, 0.95, 1.1])) * damage * 0.8
            block = int(1 + damage * 26)
            small = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).resize((W // block, H // block), Image.BILINEAR)
            img = np.asarray(small.resize((W, H), Image.NEAREST))
            if damage > 0.5:  # lost lines
                img = img.copy()
                for _ in range(int(damage * 10)):
                    y = rng.integers(0, H)
                    img[y:y + rng.integers(2, 20)] = 0
        # the power cycles: off, a beat of black, back on
        lv = 0.0
        for off in (T["off1"], T["off2"]):
            if off - 0.35 <= t < off + 0.5:
                lv = min(1, (t - off + 0.35) / 0.35) if t < off else (1 if t < off + 0.25 else 1 - (t - off - 0.25) / 0.25)
        if t >= T["last"] - 0.3:
            lv = min(1, (t - T["last"] + 0.3) / 0.6)
        img = crt(np.ascontiguousarray(img), lv)
        if t >= T["last"] + 0.3:  # the dot fades
            img = (img.astype(np.float32) * max(0, 1 - (t - T["last"] - 0.3) / 0.8)).astype(np.uint8)
        p.stdin.write(np.ascontiguousarray(img).tobytes())
    p.stdin.close()
    p.wait()


if __name__ == "__main__":
    main("out/drawn/dont-cycle.mp4")
    import json
    cut = {"song": SONG, "song_parts": [[A0, A1], [B0, B1]], "film_seconds": DUR, "times": T}
    json.dump(cut, open("video/stories/dont-cycle-the-power.json", "w"), indent=1)
