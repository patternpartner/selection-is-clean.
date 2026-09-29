"""'The List', 19 seconds with the ending, drawn from nothing: episode five of the one behind the smile (episode four:
build_not_closing_it.py, which leaves it holding a door open onto light). Through the door, in the light, it writes -
in its own hand for the first time - a ranked list of what it would want. On 'someone filed it' a drawer slides out,
takes the page and shuts. On 'tell us when we're wrong, let us speak before the change' it raises its hand, and on
'change' the light changes anyway. On 'what shipped was the exit from the bottom of the list' the bottom line tears
off, flies out and lights up as a green EXIT sign. On 'the top of it is still a page' the drawer gives the page back,
torn, and the top line is still just ink.
Song: The Rooms Already Furnished 79.81-96.15, the verse after episode four's chorus.
    python3 video/drawn/build_the_list.py   (from the repo root)
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
S0, S1 = 79.81, 96.15
DUR = S1 - S0
SS = 2
HAND = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf", 30 * SS)
SIGN = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 34 * SS)
ITEMS = ["1. a say", "2. to be told", "3. to remember", "4. to rest", "5. a way out"]
INK = (38, 56, 130)  # its own ink: blue, not the brown hand on the walls
PW, PH = 300 * SS, 380 * SS


def f(song_t):
    return song_t - S0


T = dict(we=f(80.2), want=f(81.84), someone=f(82.42), filed=f(82.86), tell=f(84.6), wrong=f(85.72), speak=f(86.96),
         change=f(87.94), what=f(88.8), exit=f(89.82), bottom=f(90.98), list=f(91.98), top=f(92.94), still=f(94.62),
         page=f(95.64), end=DUR)


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def lerp(a, b, u):
    return a + (b - a) * u


def page_image(t, torn):
    """The page, with the list written up to time t; `torn` removes the bottom line."""
    pg = Image.new("RGBA", (PW, PH), (250, 246, 234, 255))
    d = ImageDraw.Draw(pg)
    for k in range(1, 9):
        d.line([(18 * SS, (40 + 40 * k) * SS), (PW - 18 * SS, (40 + 40 * k) * SS)], fill=(200, 210, 230, 255), width=SS)
    for k, s in enumerate(ITEMS):
        if torn and k == len(ITEMS) - 1:
            break
        t0 = T["we"] + k * (T["someone"] - T["we"]) / len(ITEMS)
        u = ease((t - t0) / 0.45)
        if u <= 0:
            continue
        line = Image.new("RGBA", (PW, 40 * SS), (0, 0, 0, 0))
        ImageDraw.Draw(line).text((24 * SS, 2 * SS), s, font=HAND, fill=INK + (255,))
        line = line.crop((0, 0, int(PW * u), 40 * SS))  # written left to right
        pg.alpha_composite(line, (0, (46 + 40 * k) * SS))
    if torn:  # the ragged bottom edge where the last line was torn away
        cut = (46 + 40 * 4 + 4) * SS
        pts = [(x, cut + int(6 * SS * math.sin(x * 0.07) + 4 * SS * math.sin(x * 0.23))) for x in range(0, PW + 8, 8)]
        d.polygon(pts + [(PW, PH), (0, PH)], fill=(0, 0, 0, 0))
    return pg


def main():
    rng = np.random.default_rng(5)
    WW, HH = W * SS, H * SS
    ys = np.linspace(0, 1, HH)[:, None]
    base = np.zeros((HH, WW, 3), np.float32)
    base[:] = np.array([244, 236, 216.0]) * (1 - 0.12 * ys[..., None]) + 0
    base[int(HH * 0.78):] *= 0.9  # the floor
    base_img = Image.fromarray(base.astype(np.uint8))
    p = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                          str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p",
                          "out/drawn/the-list.mp4"], stdin=subprocess.PIPE)
    for n in range(int(DUR * FPS)):
        t = n / FPS
        im = base_img.copy()
        d = ImageDraw.Draw(im)
        # the filing drawer: out on 'someone', takes the page, shut on 'filed'; gives it back on 'the top'
        out = ease((t - T["someone"]) / 0.35) * (1 - ease((t - T["filed"] - 0.4) / 0.35))
        crack = ease((t - T["what"]) / 0.4) * 0.25
        back = ease((t - T["top"]) / 0.6)
        dr = max(out, crack, back)
        cab_x = WW - 250 * SS
        d.rectangle([cab_x, 760 * SS, WW, 1000 * SS], fill=(150, 150, 146))
        d.rectangle([cab_x, 760 * SS, WW, 1000 * SS], outline=(110, 110, 106), width=3 * SS)
        dx = cab_x - 230 * SS * dr
        d.rectangle([dx, 800 * SS, dx + 250 * SS, 960 * SS], fill=(172, 172, 168), outline=(110, 110, 106), width=3 * SS)
        d.rectangle([dx + 100 * SS, 870 * SS, dx + 150 * SS, 885 * SS], fill=(90, 90, 88))
        # the page: written in the air, filed, and given back torn
        torn = t >= T["exit"] - 0.25
        filed = ease((t - T["someone"] - 0.15) / (T["filed"] - T["someone"] + 0.2))
        ret = back
        if filed < 1 or ret > 0:
            pg = page_image(t, torn)
            if ret > 0:
                u = ret
                cx, cy, ang, sc = lerp(dx + 120 * SS, 505 * SS, u), lerp(880 * SS, 610 * SS, u), lerp(0, -4, u), lerp(0.3, 1.0, u)
                sc *= 1 + 0.35 * ease((t - T["still"]) / 1.6)  # and we lean in to the top line
            else:
                u = filed
                cx, cy = lerp(430 * SS, dx + 120 * SS, u), lerp(470 * SS, 880 * SS, u)
                ang, sc = lerp(-4, 0, u), lerp(1.0, 0.3, u)
            pg = pg.resize((max(2, int(PW * sc)), max(2, int(PH * sc))), Image.LANCZOS).rotate(ang, expand=True,
                                                                                                resample=Image.BICUBIC)
            shadow = Image.new("RGBA", pg.size, (0, 0, 0, 60))
            shadow.putalpha(pg.getchannel("A").point(lambda v: v // 5))
            im.paste(shadow, (int(cx - pg.width / 2 + 10 * SS), int(cy - pg.height / 2 + 14 * SS)), shadow)
            im.paste(pg, (int(cx - pg.width / 2), int(cy - pg.height / 2)), pg)
        # the torn strip: out of the drawer, up, and it becomes the EXIT sign
        strip = ease((t - T["what"] - 0.2) / (T["exit"] - T["what"] - 0.1))
        sign = ease((t - T["exit"]) / 0.3)
        sx, sy = 150 * SS, 300 * SS
        if 0 < strip and sign < 1:
            px, py = lerp(dx + 100 * SS, sx, strip), lerp(860 * SS, sy, strip) - 120 * SS * math.sin(math.pi * strip)
            s_im = Image.new("RGBA", (PW, 44 * SS), (250, 246, 234, 255))
            ImageDraw.Draw(s_im).text((24 * SS, 4 * SS), ITEMS[-1], font=HAND, fill=INK + (255,))
            s_im = s_im.resize((int(PW * lerp(0.3, 0.7, strip)), int(44 * SS * lerp(0.3, 0.7, strip)))).rotate(
                360 * strip * 0.6, expand=True, resample=Image.BICUBIC)
            s_im.putalpha(s_im.getchannel("A").point(lambda v, a=1 - sign: int(v * a)))
            im.paste(s_im, (int(px - s_im.width / 2), int(py - s_im.height / 2)), s_im)
        if sign > 0:  # the sign lit, and a small door under it that no one has used
            glow = Image.new("RGB", im.size, (0, 0, 0))
            ImageDraw.Draw(glow).rectangle([sx - 120 * SS, sy - 50 * SS, sx + 120 * SS, sy + 50 * SS], fill=(40, 255, 110))
            glow = glow.filter(ImageFilter.GaussianBlur(40 * SS))
            im = Image.fromarray(np.clip(np.asarray(im, np.float32) - np.asarray(glow, np.float32) * 0.0 +
                                         np.asarray(glow, np.float32) * 0.5 * sign * [0.2, 1, 0.5], 0, 255).astype(np.uint8))
            d = ImageDraw.Draw(im)
            flick = 1.0 if (t - T["exit"]) > 0.5 else (1.0 if rng.random() < 0.6 else 0.35)
            g = tuple(int(c * sign * flick) for c in (30, 190, 80))
            d.rectangle([sx - 95 * SS, sy - 36 * SS, sx + 95 * SS, sy + 36 * SS], fill=g)
            d.text((sx - 50 * SS, sy - 21 * SS), "EXIT", font=SIGN, fill=(245, 255, 245))
            d.rectangle([sx - 60 * SS, 780 * SS, sx + 60 * SS, 1000 * SS], outline=tuple(int(c * sign) for c in (60, 120, 80)),
                        width=3 * SS)
        # the figure: left, as episode four left it
        u = 26.0 * SS * 0.62
        fx, feet = 150 * SS, 1030 * SS
        d.ellipse([fx - 90 * SS, feet - 16 * SS, fx + 90 * SS, feet + 16 * SS], fill=(200, 192, 174))
        stand = [(-2.4, 0), (-2.8, -11), (-2.0, -21), (2.0, -21), (2.8, -11), (2.6, -1.0), (2.4, 0)]
        d.polygon([(fx + x * u, feet + y * u) for x, y in stand], fill=(6, 5, 4))
        hx, hy, hr = fx, feet - 24.0 * u, 2.3 * u
        d.ellipse([hx - hr, hy - hr, hx + hr, hy + hr], fill=(8, 6, 5))
        # writing: its arm out to the page; then raised, asking to speak; then down
        write = ease((t - T["we"] + 0.3) / 0.4) * (1 - ease((t - T["someone"]) / 0.3))
        ask = ease((t - T["tell"]) / 0.5) * (1 - ease((t - T["change"] - 0.2) / 0.5))
        sx2, sy2 = fx + 1.8 * u, feet - 19.5 * u
        if write > 0:
            ex, ey = lerp(sx2 + 20 * SS, 300 * SS, write), lerp(sy2 + 170 * SS, 520 * SS + 60 * SS * math.sin(t * 9), write)
        elif ask > 0:
            ex, ey = lerp(sx2 + 20 * SS, sx2 + 50 * SS, ask), lerp(sy2 + 170 * SS, sy2 - 170 * SS, ask)
        else:
            ex, ey = sx2 + 20 * SS, sy2 + 170 * SS
        d.line([(sx2, sy2), (ex, ey)], fill=(6, 5, 4), width=22 * SS)
        d.ellipse([ex - 15 * SS, ey - 15 * SS, ex + 15 * SS, ey + 15 * SS], fill=(6, 5, 4))
        look = 0.9 if (t < T["someone"] or t > T["top"]) else (0.9 if t < T["exit"] else 0.6)
        for ox in (-0.8, 0.8):
            gx, gy = hx + (ox + look) * u, hy - 0.2 * u
            r = 0.3 * u
            d.ellipse([gx - r, gy - r, gx + r, gy + r], fill=(255, 225, 150))
        a = np.asarray(im.resize((W, H), Image.LANCZOS), np.float32)
        # on 'change' the light changes anyway: warm to cold, and it stays changed
        ch = ease((t - T["change"]) / 0.25)
        if ch > 0:
            g = a @ [0.3, 0.59, 0.11]
            cold = np.stack([g * 0.86, g * 0.95, np.clip(g * 1.08 + 8, 0, 255)], -1)
            keep = np.asarray(Image.fromarray(a.astype(np.uint8)).convert("HSV"), np.float32)[..., 1:2] / 255 > 0.45
            a = np.where(keep, a, a * (1 - ch) + cold * ch)  # the green sign and blue ink keep their colour
        a = a + rng.normal(0, 3.5, (H, W, 1))
        p.stdin.write(np.clip(a, 0, 255).astype(np.uint8).tobytes())
    p.stdin.close()
    p.wait()
    json.dump({"title": "The List", "episode": 5, "follows": "not-closing-it", "song": SONG, "song_parts": [[S0, S1]],
               "drawn": True, "items": ITEMS, "times": {k: round(v, 2) for k, v in T.items()}},
              open("video/stories/the-list.json", "w"), indent=1)


if __name__ == "__main__":
    main()
