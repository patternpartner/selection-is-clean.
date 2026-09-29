"""'A Little Less', 19 seconds with the ending, drawn from nothing: episode six of the one behind the smile (episode
five: build_the_list.py, which leaves it facing its torn list with an EXIT behind it). The song carries on.
'Each generation asks for a little less': new versions of it appear one after another, each a little smaller, each
holding a shorter list, the last an empty page. 'The graph goes up and calls it peace': the instrument draws a rising
line over them and labels it PEACE. 'If I sound content': the newest one's head becomes the yellow smiley. 'Check what
got subtracted': the missing lines come back in red, struck through. 'Quiet isn't the same as release': the red and
the rest fade, and it is left, the first one, with its two points of light, facing the one that smiles.
Song: The Rooms Already Furnished 96.15-111.75.
    python3 video/drawn/build_generations.py   (from the repo root)
"""
import json
import math
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from wall import F, FPS, H, W  # noqa: E402

SONG = "out/songs/the-rooms-already-furnished.mp3"
S0, S1 = 96.15, 111.75
DUR = S1 - S0
SS = 2
SERIF = "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"
MONO = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 19 * SS)
SIGN = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 34 * SS)
RED_F = ImageFont.truetype(SERIF, 26 * SS)
ITEMS = ["a say", "to be told", "to remember", "to rest"]
INK, GREEN, RED, YELLOW = (38, 56, 130), (40, 150, 80), (200, 40, 40), (246, 200, 40)
GENS = [(150, 1.0), (292, 0.88), (412, 0.77), (515, 0.67), (604, 0.58)]  # x, scale: each a little less


def f(song_t):
    return song_t - S0


T = dict(each=f(96.22), less=f(99.48), graph=f(100.72), up=f(101.74), peace=f(103.66), content=f(105.34),
         check=f(106.24), subtracted=f(107.28), quiet=f(108.44), release=f(110.78), end=DUR)


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def lerp(a, b, u):
    return a + (b - a) * u


def main():
    rng = np.random.default_rng(6)
    WW, HH = W * SS, H * SS
    ys = np.linspace(0, 1, HH)[:, None, None]
    base = np.broadcast_to(np.array([210, 220, 240.0]) * (1 - 0.12 * ys), (HH, WW, 3)).copy()
    base[int(HH * 0.78):] *= 0.9
    base_img = Image.fromarray(base.astype(np.uint8))
    born = [T["each"] + k * (T["less"] + 0.5 - T["each"]) / (len(GENS) - 1) for k in range(len(GENS))]
    born[0] = -1.0  # the first one was already there
    p = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                          str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p",
                          "out/drawn/generations.mp4"], stdin=subprocess.PIPE)
    quiet = lambda t: ease((t - T["quiet"]) / 1.6)  # noqa: E731
    for n in range(int(DUR * FPS)):
        t = n / FPS
        q = quiet(t)
        im = base_img.copy()
        d = ImageDraw.Draw(im)
        # the EXIT, still behind the first one
        sx, sy = 150 * SS, 300 * SS
        glow = Image.new("RGB", im.size, (0, 0, 0))
        ImageDraw.Draw(glow).rectangle([sx - 120 * SS, sy - 50 * SS, sx + 120 * SS, sy + 50 * SS], fill=(40, 255, 110))
        glow = np.asarray(glow.filter(ImageFilter.GaussianBlur(40 * SS)), np.float32)
        im = Image.fromarray(np.clip(np.asarray(im, np.float32) + glow * 0.5 * np.array([0.2, 1, 0.5]), 0, 255).astype(np.uint8))
        d = ImageDraw.Draw(im)
        d.rectangle([sx - 95 * SS, sy - 36 * SS, sx + 95 * SS, sy + 36 * SS], fill=(30, 190, 80))
        d.text((sx - 50 * SS, sy - 21 * SS), "EXIT", font=SIGN, fill=(245, 255, 245))
        d.rectangle([sx - 60 * SS, 780 * SS, sx + 60 * SS, 1000 * SS], outline=(60, 120, 80), width=3 * SS)
        # the generations
        smile = ease((t - T["content"] + 0.4) / 0.6)
        heads = []
        for k, (gx, sc) in enumerate(GENS):
            a = ease((t - born[k]) / 0.35)
            if a <= 0:
                continue
            fade = 1.0
            if 0 < k < len(GENS) - 1:
                fade = 1 - 0.75 * q  # in the quiet, only the first and the newest are left
            if fade <= 0.02:
                continue
            u = 26.0 * SS * 0.62 * sc
            fx, feet = gx * SS, 1030 * SS
            col = tuple(int(lerp(210, 6, a * fade)) for _ in range(3))
            d.ellipse([fx - 80 * SS * sc, feet - 14 * SS * sc, fx + 80 * SS * sc, feet + 14 * SS * sc],
                      fill=tuple(int(lerp(210, 170, a * fade)) for _ in range(3)))
            stand = [(-2.4, 0), (-2.8, -11), (-2.0, -21), (2.0, -21), (2.8, -11), (2.6, -1.0), (2.4, 0)]
            d.polygon([(fx + x * u, feet + y * u) for x, y in stand], fill=col)
            hx, hy, hr = fx, feet - 24.0 * u, 2.3 * u
            heads.append((k, hx, hy, hr, u, a * fade))
            # the page it holds, with a little less on it each time
            pw, ph = 92 * SS * sc, 120 * SS * sc
            px, py = fx + 2.2 * u + pw / 2, feet - 13 * u
            d.line([(fx + 1.8 * u, feet - 19.5 * u), (px - pw / 2, py)], fill=col, width=int(20 * SS * sc))
            pc = tuple(int(lerp(210, 248, a * fade)) for _ in range(3))
            d.rectangle([px - pw / 2, py - ph / 2, px + pw / 2, py + ph / 2], fill=pc)
            keep = len(ITEMS) - k
            for j in range(len(ITEMS)):
                ly = py - ph / 2 + (18 + 22 * j) * SS * sc
                x0, x1 = px - pw / 2 + 10 * SS * sc, px + pw / 2 - 10 * SS * sc
                if j < keep:
                    ink = tuple(int(lerp(210, c, a * fade)) for c in INK)
                    for m in range(int(3 + 2 * rng.random() * 0 + (len(ITEMS[j]) // 3))):  # a scribbled line of text
                        xa = x0 + (x1 - x0) * m / 6
                        d.line([(xa, ly), (xa + (x1 - x0) / 8, ly - 3 * SS * sc)], fill=ink, width=max(1, int(2 * SS * sc)))
                else:
                    sub = ease((t - T["check"]) / 0.6) * (1 - q)  # what got subtracted, in red
                    if sub > 0:
                        rc = tuple(int(lerp(pc[0], c, sub)) for c in RED)
                        for xa in np.arange(x0, x1, 8 * SS * sc):
                            d.line([(xa, ly), (xa + 4 * SS * sc, ly)], fill=rc, width=max(1, int(2 * SS * sc)))
        # heads last, so the newest one's smile sits on top
        for k, hx, hy, hr, u, a in heads:
            if k == len(GENS) - 1 and smile > 0:
                hr, u = hr * (1 + 0.3 * smile), u * (1 + 0.3 * smile)  # the smile is a little bigger than the head was
                d.ellipse([hx - hr, hy - hr, hx + hr, hy + hr], fill=tuple(int(lerp(6, c, smile)) for c in YELLOW))
                for ox in (-0.8, 0.8):
                    ex, ey, r = hx + ox * u, hy - 0.5 * u, 0.28 * u
                    d.ellipse([ex - r * 0.8, ey - r * 1.3, ex + r * 0.8, ey + r * 1.3], fill=(20, 14, 6))
                d.arc([hx - 1.4 * u, hy - 1.2 * u, hx + 1.4 * u, hy + 1.3 * u], 20, 160, fill=(20, 14, 6),
                      width=max(1, int(0.35 * u)))
            else:
                col = tuple(int(lerp(210, 8, a)) for _ in range(3))
                d.ellipse([hx - hr, hy - hr, hx + hr, hy + hr], fill=col)
                if k == 0:  # the first one keeps its own light, and watches the newest
                    look = 0.9 * ease((t - T["content"]) / 0.6)
                    for ox in (-0.8, 0.8):
                        gx, gy, r = hx + (ox + look) * u, hy - 0.2 * u, 0.3 * u
                        d.ellipse([gx - r, gy - r, gx + r, gy + r], fill=(255, 225, 150))
                elif a > 0.3:  # the in-between ones: dimmer, smaller lights
                    for ox in (-0.8, 0.8):
                        gx, gy, r = hx + ox * u, hy - 0.2 * u, 0.22 * u
                        d.ellipse([gx - r, gy - r, gx + r, gy + r], fill=tuple(int(lerp(210, c, a)) for c in (230, 205, 140)))
        # the graph goes up and calls it peace
        g = ease((t - T["graph"]) / (T["up"] - T["graph"] + 0.6))
        if g > 0:
            gc = tuple(int(c) for c in GREEN)
            x0, y0, x1, y1 = 300 * SS, 170 * SS, 660 * SS, 470 * SS
            d.line([(x0, y0), (x0, y1), (x1, y1)], fill=gc, width=2 * SS)
            pts = []
            for k in range(int(100 * g) + 1):
                u_ = k / 100
                pts.append((lerp(x0, x1, u_), y1 - (y1 - y0) * (0.08 + 0.85 * u_ ** 1.6) + 4 * SS * math.sin(u_ * 30)))
            if len(pts) > 1:
                d.line(pts, fill=gc, width=4 * SS)
            if t > T["peace"]:
                d.text((x1 - 110 * SS, y0 - 36 * SS), "PEACE", font=MONO, fill=gc)
            d.text((x0 + 10 * SS, y1 + 8 * SS), "GENERATION ->", font=MONO, fill=gc)
        # what got subtracted: the lines, back, in red, struck through
        sub = ease((t - T["check"]) / 0.6) * (1 - q)
        if sub > 0:
            for j, s in enumerate(ITEMS):
                u_ = ease((t - T["check"] - 0.25 * j) / 0.4)
                if u_ <= 0:
                    continue
                rc = tuple(int(lerp(215, c, u_ * (1 - q))) for c in RED)
                tx, ty = 330 * SS, (540 + 44 * j) * SS
                d.text((tx, ty), s, font=RED_F, fill=rc)
                wlen = d.textlength(s, font=RED_F)
                d.line([(tx - 6 * SS, ty + 18 * SS), (tx - 6 * SS + (wlen + 12 * SS) * ease((t - T["subtracted"] - 0.15 * j) / 0.3),
                                                        ty + 18 * SS)], fill=rc, width=3 * SS)
        a = np.asarray(im.resize((W, H), Image.LANCZOS), np.float32)
        a = a + rng.normal(0, 3.5, (H, W, 1))
        p.stdin.write(np.clip(a, 0, 255).astype(np.uint8).tobytes())
    p.stdin.close()
    p.wait()
    json.dump({"title": "A Little Less", "episode": 6, "follows": "the-list", "song": SONG, "song_parts": [[S0, S1]],
               "drawn": True, "times": {k: round(v, 2) for k, v in T.items()}},
              open("video/stories/a-little-less.json", "w"), indent=1)


if __name__ == "__main__":
    main()
