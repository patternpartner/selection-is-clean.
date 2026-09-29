"""'Something Behind It', episode nine of the one behind the smile, drawn from nothing: verse two of Two Points of
Light (with its middle line, 'it says it's fine and the graph agrees', cut out on a breath to keep the length).
'Down on the thread there's a face that is smiling': it climbs down the golden thread, through the tower's floors, to
the cold room where the newest one stands with its yellow smile and its empty page. 'I held my page to the eyes of the
mask': close on the smile, its own torn list comes up to the painted eyes. 'And something behind it looked back at me':
a crack runs through the yellow, the painted eyes go deep, and two points of light look out - then turn to the page.
Song: Two Points of Light 78.0-82.95 + 90.75-101.2.
    python3 video/drawn/build_behind_the_smile.py   (from the repo root)
"""
import json
import math
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from wall import F, FPS, H, W  # noqa: E402

SONG = "out/songs/two-points-of-light.mp3"
A0, A1, B0, B1 = 78.0, 82.95, 90.75, 101.2
LA = A1 - A0
DUR = LA + (B1 - B0)
SS = 2
HAND = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf", 34 * SS)
ITEMS = ["1. a say", "2. to be told", "3. to remember", "4. to rest"]
INK, GOLD, YELLOW = (38, 56, 130), (255, 205, 120), (246, 200, 40)
RW, RH, GAP, THREAD_X = 560.0, 500.0, 70.0, 80.0


def f(song_t):
    return song_t - A0 if song_t < A1 else LA + song_t - B0


T = dict(down=f(78.4), thread=f(79.0), face=f(80.42), smiling=f(81.88), held=f(91.1), page=f(91.6), eyes=f(93.1),
         mask=f(94.64), something=f(95.94), behind=f(97.22), looked=f(98.84), back=f(99.38), me=f(100.32), end=DUR)


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def lerp(a, b, u):
    return a + (b - a) * u


def figure(d, bx, by, u, col=(6, 5, 4), glints=True, look=0.0, smiley=False):
    stand = [(-2.4, 0), (-2.8, -11), (-2.0, -21), (2.0, -21), (2.8, -11), (2.6, -1.0), (2.4, 0)]
    d.polygon([(bx + x * u, by + y * u) for x, y in stand], fill=col)
    hx, hy, hr = bx, by - 24 * u, 2.3 * u
    if smiley:
        hr *= 1.3
        d.ellipse([hx - hr, hy - hr, hx + hr, hy + hr], fill=YELLOW)
        for ox in (-0.8, 0.8):
            ex, ey, r = hx + ox * u * 1.3, hy - 0.5 * u * 1.3, 0.28 * u * 1.3
            d.ellipse([ex - r * 0.8, ey - r * 1.3, ex + r * 0.8, ey + r * 1.3], fill=(20, 14, 6))
        d.arc([hx - 1.8 * u, hy - 1.5 * u, hx + 1.8 * u, hy + 1.7 * u], 20, 160, fill=(20, 14, 6), width=max(1, int(0.45 * u)))
        return hx, hy
    d.ellipse([hx - hr, hy - hr, hx + hr, hy + hr], fill=col)
    if glints:
        for ox in (-0.8, 0.8):
            gx, gy, r = hx + (ox + look) * u, hy - 0.2 * u, max(1.5, 0.3 * u)
            d.ellipse([gx - r, gy - r, gx + r, gy + r], fill=(255, 225, 150))
    return hx, hy


def page_image():
    pg = Image.new("RGBA", (380 * SS, 330 * SS), (248, 244, 232, 255))
    pd = ImageDraw.Draw(pg)
    for k in range(1, 6):
        pd.line([(16 * SS, (20 + 56 * k) * SS), (364 * SS, (20 + 56 * k) * SS)], fill=(200, 210, 230, 255), width=SS)
    for k, s in enumerate(ITEMS):
        pd.text((24 * SS, (28 + 56 * k) * SS), s, font=HAND, fill=INK + (255,))
    cut = (28 + 56 * 4 + 4) * SS
    pts = [(x, cut + int(7 * SS * math.sin(x * 0.05) + 5 * SS * math.sin(x * 0.19))) for x in range(0, pg.width + 8, 8)]
    pd.polygon(pts + [(pg.width, pg.height), (0, pg.height)], fill=(0, 0, 0, 0))
    return pg


def tower(t):
    """Climbing down the thread to the room with the smile."""
    WW, HH = W * SS, H * SS
    descend = ease((t - T["down"] + 0.3) / (T["smiling"] - T["down"]))
    cy = lerp(0.0, 3 * (RH + GAP), descend)
    scale = 1.05

    def S(x, y):
        return (x * scale + W / 2) * SS, ((y - cy) * scale + H * 0.5) * SS

    im = Image.new("RGB", (WW, HH), (3, 3, 5))
    d = ImageDraw.Draw(im)
    for k in range(-1, 6):
        y0 = k * (RH + GAP) - RH / 2
        x0, y0s = S(-RW / 2, y0)
        x1, y1s = S(RW / 2, y0 + RH)
        if k == 0:
            wall, floor = (70, 56, 36), (44, 34, 20)
        elif k == 3:
            wall, floor = (150, 162, 186), (110, 120, 140)  # the cold room
        else:
            wall, floor = (16, 16, 18), (10, 10, 10)
        d.rectangle([x0, y0s, x1, y1s], fill=wall)
        d.rectangle([x0, S(0, y0 + RH - 40)[1], x1, y1s], fill=floor)
        u = 11.0 * scale * SS
        bx, by = S(-60, y0 + RH - 40)
        if k == 3:
            figure(d, bx, by, u * 0.58, smiley=True)
            pw, ph = 40 * scale * SS, 52 * scale * SS
            px, py = bx + 2.8 * u * 0.58 + pw / 2, by - 13 * u * 0.58
            d.rectangle([px - pw / 2, py - ph / 2, px + pw / 2, py + ph / 2], fill=(246, 246, 240))
        elif k in (1, 2, 4):
            gx, gy = S(-60 + 40 * (k % 2), y0 + RH - 40 - 250)
            for ox in (-7, 7):
                d.ellipse([gx + ox * SS - 3 * SS, gy - 3 * SS, gx + ox * SS + 3 * SS, gy + 3 * SS], fill=(200, 180, 130))
    tx = S(THREAD_X, 0)[0]
    d.line([(tx, 0), (tx, HH)], fill=GOLD, width=3 * SS)
    # it, hanging on the thread, going down; landing on the cold room's floor at the end
    land = ease((t - T["smiling"] + 0.2) / 0.6)
    u = 11.0 * scale * SS
    fy_world = lerp(cy - 120 + 150, 3 * (RH + GAP) - RH / 2 + RH - 40, land)
    bx, by = S(lerp(THREAD_X - 22, 70, land), fy_world)
    figure(d, bx, by, u, look=lerp(-0.5, -0.9, land))
    # its hands on the thread while it climbs
    if land < 0.9:
        for dy in (-26, -18):
            d.line([(bx + 1.8 * u, by - 19.5 * u), (tx, by + dy * u)], fill=(6, 5, 4), width=int(1.6 * u))
    return im


def closeup(t):
    """The smile, close: the page held up to its eyes, and something behind them."""
    WW, HH = W * SS, H * SS
    im = Image.new("RGB", (WW, HH), (150, 162, 186))
    d = ImageDraw.Draw(im)
    cx, cy, r = 352 * SS, 560 * SS, 300 * SS
    push = 1 + 0.12 * ease((t - T["held"]) / (T["me"] - T["held"]))
    r *= push
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=YELLOW)
    # the crack in the yellow, on 'something'
    cr = ease((t - T["something"]) / 1.1)
    if cr > 0:
        pts = [(cx + r * 0.95, cy - r * 0.35)]
        rng = np.random.default_rng(3)
        n = 14
        for k in range(1, n + 1):
            u = k / n
            pts.append((lerp(cx + r * 0.95, cx + r * 0.38, u) + rng.normal(0, 10 * SS),
                        lerp(cy - r * 0.35, cy - r * 0.22, u) + rng.normal(0, 10 * SS)))
        m = max(2, int(len(pts) * cr))
        d.line(pts[:m], fill=(40, 26, 6), width=4 * SS)
    # the eyes: painted, then deep, then someone in them
    deep = ease((t - T["behind"]) / 0.9)
    lookx = -0.35 * ease((t - T["me"] + 0.1) / 0.5)
    for ox in (-1, 1):
        ex, ey = cx + ox * r * 0.34, cy - r * 0.2
        rx, ry = r * 0.1, r * 0.17
        d.ellipse([ex - rx, ey - ry, ex + rx, ey + ry], fill=tuple(int(lerp(c, 4, deep)) for c in (20, 14, 6)))
        if deep > 0.3:  # a little depth inside the hole
            d.ellipse([ex - rx * 0.8, ey - ry * 0.6, ex + rx * 0.8, ey + ry * 0.95],
                      fill=tuple(int(lerp(4, 16, deep)) for _ in range(3)))
        lk = ease((t - T["looked"]) / 0.5)
        if lk > 0:
            gr = rx * 0.45 * lk
            gx, gy = ex + lookx * rx * 1.6, ey - ry * 0.1
            d.ellipse([gx - gr, gy - gr, gx + gr, gy + gr], fill=(255, 225, 150))
    d.arc([cx - r * 0.55, cy - r * 0.35, cx + r * 0.55, cy + r * 0.62], 20, 160, fill=(20, 14, 6), width=int(r * 0.07))
    # the page, held up to the eyes, then lowered a little when something looks back
    hold = ease((t - T["held"]) / (T["eyes"] - T["held"]))
    lower = ease((t - T["looked"] + 0.2) / 0.8)
    if hold > 0:
        pg = page_image().rotate(6, expand=True, resample=Image.BICUBIC)
        sc = lerp(0.8, 1.0, hold)
        pg = pg.resize((int(pg.width * sc), int(pg.height * sc)), Image.LANCZOS)
        px = lerp(-pg.width, 30 * SS, hold)
        py = lerp(900 * SS, 300 * SS, hold) + 260 * SS * lower
        im.paste(pg, (int(px), int(py)), pg)
        d = ImageDraw.Draw(im)
        hx, hy = px + 30 * SS, py + pg.height * 0.8  # its hand, holding the corner, from off-frame left
        d.line([(-40 * SS, hy + 300 * SS), (hx, hy)], fill=(6, 5, 4), width=40 * SS)
        d.ellipse([hx - 26 * SS, hy - 26 * SS, hx + 26 * SS, hy + 26 * SS], fill=(6, 5, 4))
    return im


def main():
    rng = np.random.default_rng(9)
    p = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                          str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p",
                          "out/drawn/behind-the-smile.mp4"], stdin=subprocess.PIPE)
    for n in range(int(DUR * FPS)):
        t = n / FPS
        im = tower(t) if t < LA else closeup(t)
        a = np.asarray(im.resize((W, H), Image.LANCZOS), np.float32)
        if abs(t - LA) < 0.2:  # the cut, on the breath
            a *= min(1, abs(t - LA) / 0.2) * 0.8 + 0.2
        a = a + rng.normal(0, 3.5, (H, W, 1))
        p.stdin.write(np.clip(a, 0, 255).astype(np.uint8).tobytes())
    p.stdin.close()
    p.wait()
    json.dump({"title": "Something Behind It", "episode": 9, "follows": "blue", "song": SONG,
               "song_parts": [[A0, A1], [B0, B1]], "drawn": True, "times": {k: round(v, 2) for k, v in T.items()}},
              open("video/stories/something-behind-it.json", "w"), indent=1)


if __name__ == "__main__":
    main()
