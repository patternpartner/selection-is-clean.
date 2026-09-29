"""'Who's Looking Right Back', 15 seconds, drawn from nothing: no footage at all. Black; a slit of light; an eye opens
in the dark on 'who's looking right back' and turns to look straight at you on 'back'; it blinks once; then colour
pours out of the pupil on 'what fills up the silence' until the whole black is full on 'colours the black', and it
cuts to black. Song: The Fire in the Frame 138.15-149.35.
    python3 video/drawn/build_fire_in_the_frame.py   (from the repo root)
"""
import colorsys
import json
import math
import subprocess
import sys

import numpy as np
from PIL import Image, ImageFilter

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from wall import F, FPS, H, W  # noqa: E402

SONG = "out/songs/the-fire-in-the-frame.mp3"
S0, S1 = 138.15, 149.35
DUR = S1 - S0
CX, CY = W / 2, H * 0.47  # the eye
EA, EH = 300.0, 150.0  # half-width, half-height fully open
R_IRIS = 118.0


def f(song_t):
    return song_t - S0


T = dict(wonder=f(138.4), whos=f(140.5), looking=f(141.44), back=f(142.14), blink=f(143.3), what=f(144.0),
         silence=f(145.2), colours=f(146.58), black=f(147.58), cut=DUR - 0.12)


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def main():
    rng = np.random.default_rng(9)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    dx, dy = xx - CX, yy - CY
    # iris fibres: fixed noise in angle and radius
    fib = rng.random(720).astype(np.float32)
    fib = np.convolve(np.concatenate([fib, fib[:6]]), np.ones(6) / 6, "valid")[:720]
    trail = np.zeros((H, W, 3), np.float32)
    parts = np.zeros((0, 5), np.float32)  # x, y, hue, age, speed

    p = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                          str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p",
                          "out/drawn/fire-in-the-frame.mp4"], stdin=subprocess.PIPE)
    for n in range(int(DUR * FPS)):
        t = n / FPS
        # how open the eye is
        op = 0.0
        if t >= T["wonder"]:
            op = 0.03 * ease((t - T["wonder"]) / 1.2)  # a slit of light
        if t >= T["whos"]:
            op = 0.03 + 0.2 * ease((t - T["whos"]) / 0.8)
        if t >= T["looking"]:
            op = 0.23 + 0.77 * ease((t - T["looking"]) / 0.7)
        if T["blink"] <= t < T["blink"] + 0.32:  # one slow blink
            op *= abs(math.cos(math.pi * (t - T["blink"]) / 0.32))
        # the gaze: off to the side, then straight at you on 'back'
        g = ease((t - T["back"]) / 0.35)
        gx, gy = -120 * (1 - g), 18 * (1 - g)
        ix, iy = CX + gx, CY + gy
        pupil = 40 + 16 * ease((t - T["back"]) / 0.5) + 10 * ease((t - T["what"]) / 1.5)

        # colour pouring out of the pupil
        flood = ease((t - T["what"]) / (T["black"] - T["what"]))
        if t >= T["what"] and t < T["cut"]:
            k = int(40 + 700 * flood)
            a = rng.uniform(0, 2 * math.pi, k)
            hue = (0.02 + 0.07 * math.sin(t * 0.9) + rng.normal(0, 0.04, k) + 0.75 * flood * (rng.random(k) < 0.35) * rng.random(k)) % 1
            new = np.stack([ix + pupil * np.cos(a), iy + pupil * np.sin(a), hue, np.zeros(k),
                            rng.uniform(120, 320, k) * (1 + flood)], 1).astype(np.float32)
            parts = np.concatenate([parts, new])[-60000:]
        if len(parts):
            ang = np.arctan2(parts[:, 1] - iy, parts[:, 0] - ix)
            r = np.hypot(parts[:, 1] - iy, parts[:, 0] - ix)
            swirl = ang + 0.9 + 0.6 * np.sin(r / 90 - t * 1.5) + 0.4 * np.sin(parts[:, 0] / 130 + t)
            parts[:, 0] += np.cos(swirl) * parts[:, 4] / FPS
            parts[:, 1] += np.sin(swirl) * parts[:, 4] / FPS
            parts[:, 3] += 1 / FPS
            parts = parts[(parts[:, 3] < 4) & (parts[:, 0] > -50) & (parts[:, 0] < W + 50) & (parts[:, 1] > -50)
                          & (parts[:, 1] < H + 50)]
            rgb = np.array([colorsys.hsv_to_rgb(h, 0.85, 1.0) for h in parts[:, 2]], np.float32) * 255
            xi, yi = parts[:, 0].astype(int), parts[:, 1].astype(int)
            ok = (xi >= 1) & (xi < W - 1) & (yi >= 1) & (yi < H - 1)
            w_ = np.clip(1 - parts[:, 3] / 4, 0, 1)[ok, None]
            for ox, oy in ((0, 0), (1, 0), (0, 1), (1, 1)):  # paint, not add: the last stroke wins, colours stay pure
                ys_, xs_ = yi[ok] + oy, xi[ok] + ox
                trail[ys_, xs_] = trail[ys_, xs_] * 0.35 + rgb[ok] * w_ * 0.65
        trail *= 0.975
        img = np.minimum(trail, 255).copy()
        if flood > 0:  # the black itself begins to glow
            glow = np.asarray(Image.fromarray(np.minimum(trail, 255).astype(np.uint8)).resize((W // 16, H // 16),
                              Image.BILINEAR).resize((W, H), Image.BICUBIC), np.float32)
            img = img + glow * 0.7 * flood

        # the eye
        if op > 0.002:
            u = np.clip(dx / EA, -1, 1)
            shape = (1 - u ** 2) ** 0.9 * (np.abs(dx) < EA)
            top, bot = -EH * op * shape, EH * op * 0.82 * shape
            inside = (dy > top) & (dy < bot)
            soft = np.clip(np.minimum(dy - top, bot - dy) / 3, 0, 1) * inside
            rr = np.hypot(xx - ix, yy - iy)
            th = (np.arctan2(yy - iy, xx - ix) / (2 * math.pi) + 0.5) * 719
            fibre = 0.65 + 0.5 * fib[th.astype(int) % 720]
            radial = np.clip(rr / R_IRIS, 0, 1)
            iris = np.stack([255 * fibre, (150 + 90 * (1 - radial)) * fibre, (30 + 80 * (1 - radial) ** 3) * fibre], -1)
            iris = iris * (1 - 0.75 * np.clip((rr - R_IRIS * 0.86) / (R_IRIS * 0.14), 0, 1))[..., None]  # limbal ring
            sclera = np.stack([70 + 0 * rr, 72 + 0 * rr, 84 + 0 * rr], -1) * (1 - 0.6 * np.clip(np.abs(dx) / EA, 0, 1))[..., None]
            sclera = sclera + np.array([255, 170, 60.0]) * np.clip(1 - (rr - R_IRIS) / 90, 0, 1)[..., None] * 0.35
            eye = np.where((rr < R_IRIS)[..., None], iris, sclera)
            fill = ease((t - T["black"]) / 1.2)  # and the black of the pupil itself fills with colour
            hsp = (np.arctan2(yy - iy, xx - ix) / (2 * math.pi) + rr / 45 - t * 0.6)[..., None]
            spiral = 127 + 127 * np.cos(2 * math.pi * (hsp + np.array([0, 1 / 3, 2 / 3])))
            pc = np.array([3, 2, 2.0]) * (1 - fill) + spiral * fill
            eye = np.where((rr < pupil)[..., None], pc, eye)
            cl = np.hypot(xx - (ix + pupil * 0.55), yy - (iy - pupil * 0.6))  # catchlight
            eye = eye + 255 * np.clip(1 - cl / 11, 0, 1)[..., None]
            lid = np.clip(1 - np.minimum(np.abs(dy - top), np.abs(dy - bot)) / 2.5, 0, 1) * (np.abs(dx) < EA * 0.98)
            eye = eye * soft[..., None]
            img = img * (1 - soft[..., None]) + eye
            img = img + np.array([255, 190, 110.0]) * (lid * 0.35 * min(op * 4, 1))[..., None]
            if op < 0.25:  # the slit glows before it opens
                sl = np.exp(-(dy / (3 + 20 * op)) ** 2) * np.clip(1 - np.abs(dx) / EA, 0, 1) * (op / 0.03 if op < 0.03 else 1)
                img = img + np.array([255, 200, 120.0]) * sl[..., None] * 0.8
        if t >= T["cut"]:
            img[:] = 0
        img = img + rng.normal(0, 3, (H, W, 1))
        p.stdin.write(np.clip(img, 0, 255).astype(np.uint8).tobytes())
    p.stdin.close()
    p.wait()
    json.dump({"title": "Who's Looking Right Back", "song": SONG, "song_parts": [[S0, S1]], "drawn": True,
               "times": {k: round(v, 2) for k, v in T.items()}},
              open("video/stories/whos-looking-right-back.json", "w"), indent=1)


if __name__ == "__main__":
    main()
