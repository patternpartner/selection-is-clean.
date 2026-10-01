"""'One Jump' - the user's own likeness (u131, u132: two Grok takes of him on a high-dive board over a stadium pool, seen
from above) and the user's own song 'One Jump' (120 bpm, phase 0.081; word times video/stories/one-jump-words.json),
written from Claude's lyrics 'No Rewind'. You cannot take a dive back.
Song 13.6-63.58, then a splice (same bar phase) to the outro 127.58-133.6 ("No rewind, one jump, one jump - make it the
right one"), then the end card.
  13.6  the light falls from the sky into his hand          15.58 "Standing on the edge with the light in my hand"
  19.58 "Everybody's watching" - flashes in the stands       23.58 "Count it to three" - 1 2 3 on the water as he turns
  25.58 "and I count it again" - the footage REWINDS; the second count is the other take (u132)
  27.58 "Nobody tells you how deep it is" - the pool drops away under him; 30.08 the drop: held breath
  31.58 chorus - the jump; 33.58 "falling through time" - slow, with time-echoes; 39.58 the splash comes up gold
  41.58 we go under; 43.58 "the water golden, it swallowed me whole" - him underwater, reaching up at us (u131's close-up)
  51.58 "thought it stayed down there, out of control" - he sinks away, the light whips about
  55.58 "then the surface broke and it came back for me" - out of the water at the camera; 59.58 "bigger than I gave it"
  splice: calm, on the board; the light rises back to him - "make it the right one".
    python3 video/build_one_jump.py      (TEST=s1,s2 TESTDIR=dir in SONG seconds; PART=a,b VOUT=f in film seconds)
"""
import math
import os
import subprocess

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.ndimage import gaussian_filter, map_coordinates

F = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 720, 1280, 24
SW, SH = 400, 736                                        # clip px
BASEZ = 1.8                                              # output px per clip px at zoom 1
SPLICE_FILM, SPLICE_SONG, END_SONG = 49.98, 127.58, 133.6
DUR = SPLICE_FILM + (END_SONG - SPLICE_SONG)
TEST = [float(x) for x in os.environ.get("TEST", "").split(",") if x]
PART = [float(x) for x in os.environ.get("PART", "").split(",") if x]
AMBER = np.array([255, 176, 88], np.float32)
GOLD = np.array([255, 196, 70], np.float32)
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
rng = np.random.default_rng(120)

# hand-read off gridded sheets (clip second -> clip px)
HAND_A = [(0.0, 262, 405), (1.125, 264, 407), (1.25, 275, 388), (1.375, 280, 368), (1.5, 295, 358), (1.625, 310, 348),
          (1.75, 330, 333)]
CHEST_A = [(1.75, 190, 312), (2.0, 182, 312), (2.25, 200, 332), (2.5, 240, 332), (2.75, 260, 352)]
CHEST_B = [(1.0, 190, 302), (1.5, 200, 312), (1.75, 208, 290), (2.0, 210, 325), (2.25, 210, 328), (2.5, 240, 288),
           (2.75, 230, 168), (3.0, 200, 188), (3.25, 180, 208), (3.5, 190, 234), (3.75, 195, 240), (4.0, 192, 284),
           (4.25, 192, 336), (4.5, 200, 372), (4.75, 196, 392), (5.0, 196, 424), (5.2, 200, 432)]
UP_B = [(6.5, 200, 400), (6.75, 192, 432), (7.0, 196, 400), (7.5, 198, 388), (7.75, 196, 362), (8.0, 200, 352),
        (8.25, 170, 344), (8.5, 196, 298), (8.75, 206, 276), (9.0, 200, 318), (9.5, 200, 340), (10.0, 210, 360),
        (11.0, 200, 400), (15.0, 200, 400)]


def track(table, ct):
    ts = [p[0] for p in table]
    return float(np.interp(ct, ts, [p[1] for p in table])), float(np.interp(ct, ts, [p[2] for p in table]))


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def ramp(s, a, b):
    return ease((s - a) / (b - a))


def lin(s, a, b, x0, x1):
    u = min(max((s - a) / (b - a), 0.0), 1.0)
    return x0 + (x1 - x0) * u


def song_time(t):
    return 13.6 + t if t < SPLICE_FILM else SPLICE_SONG + (t - SPLICE_FILM)


def shot(s):
    """(clip, clip second, camera centre in clip px, zoom) for a song second"""
    if s < 15.58:
        h = track(HAND_A, 0)
        return "A", 0.04 * (s - 13.6), h, 1.7
    if s < 23.58:                                            # up from the light in his hand to his face; then wide
        ct = lin(s, 15.58, 23.58, 0.0, 1.75)
        h = track(HAND_A, ct)
        u = ramp(s, 15.58, 19.4)
        c = (h[0] + (205 - h[0]) * u, h[1] + (254 - h[1]) * u)
        z = 1.7 - 0.3 * u
        v = ramp(s, 19.58, 20.3)
        return "A", ct, (c[0] + (200 - c[0]) * v, c[1] + (368 - c[1]) * v), z + (1.0 - z) * v
    if s < 25.58:
        return "A", lin(s, 23.58, 25.58, 1.75, 2.75), (200, 368), 1.0
    if s < 26.08:
        return "A", lin(s, 25.58, 26.08, 2.75, 1.25), (200, 368), 1.0
    if s < 27.58:
        return "B", lin(s, 26.08, 27.58, 1.25, 2.0), (200, 368), 1.0
    if s < 30.08:
        return "B", lin(s, 27.58, 30.08, 2.0, 2.5), (200, 368), 1.0
    if s < 31.58:
        return "B", lin(s, 30.08, 31.58, 2.5, 2.55), (200, 368), 1.0 + 0.012 * math.exp(-((s - 30.08) % 0.5) * 8)
    if s < 33.58:
        return "B", lin(s, 31.58, 33.58, 2.55, 3.75), (200, 368), 1.0
    if s < 39.58:
        ct = lin(s, 33.58, 39.58, 3.75, 5.2)
        u = ramp(s, 33.58, 39.0)
        p = track(CHEST_B, ct)
        return "B", ct, (200 + (p[0] - 200) * u, 368 + (p[1] - 368) * u), 1.0 + 0.6 * u
    if s < 43.58:
        ct = lin(s, 39.58, 41.58, 5.2, 6.5) if s < 41.58 else 6.5
        z = 1.6 * math.exp(1.2 * max(0.0, s - 41.58))
        return "B", ct, (200, 420), z
    if s < 55.58:
        if s < 51.58:
            ct = lin(s, 43.58, 51.58, 7.25, 11.25)
        else:
            ct = lin(s, 51.58, 55.58, 11.25, 12.25)
        return "A", ct, (200, 420), 1.0
    if s < 59.58:
        return "B", lin(s, 55.58, 59.58, 6.75, 9.5), (200, 368), 1.0
    if s < 64.0:
        ct = lin(s, 59.58, 63.58, 9.5, 14.75)
        u = ramp(s, 59.58, 63.0)
        return "B", ct, (200, 368 + 30 * u), 1.0 + 0.3 * u
    return "A", lin(s, SPLICE_SONG, END_SONG, 12.5, 15.0), (200, 368), 1.0


def add_glow(acc, x, y, r, color, amp):
    """additive gaussian glow into float image acc, local window"""
    R = int(r * 4) + 2
    x0, x1 = max(0, int(x) - R), min(W, int(x) + R)
    y0, y1 = max(0, int(y) - R), min(H, int(y) + R)
    if x0 >= x1 or y0 >= y1:
        return
    yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
    d2 = (xx - x) ** 2 + (yy - y) ** 2
    g = np.exp(-d2 / (2 * r * r)) * amp
    acc[y0:y1, x0:x1] += g[..., None] * color


def light(acc, x, y, size, bright, t):
    tw = 0.9 + 0.1 * math.sin(t * 11)
    add_glow(acc, x, y, 7 * size, np.array([255, 245, 225], np.float32), 2.4 * bright * tw)
    add_glow(acc, x, y, 22 * size, AMBER, 1.0 * bright * tw)
    add_glow(acc, x, y, 70 * size, AMBER, 0.32 * bright)


def to_out(p, c, z):
    Z = BASEZ * z
    return (p[0] - c[0]) * Z + W / 2, (p[1] - c[1]) * Z + H / 2


def water_mask(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    return ((b > 150) & (g > 110) & (r < 140) & (b > r + 60)).astype(np.float32)


class Clips:
    def __init__(self):
        self.f = {}
        for k, u in (("A", "u131"), ("B", "u132")):
            raw = subprocess.run([F, "-loglevel", "error", "-i", f"out/user-clips/{u}.mp4", "-map", "0:v:0", "-vf", "fps=24",
                                  "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
            self.f[k] = np.frombuffer(raw, np.uint8).reshape(-1, SH, SW, 3)

    def at(self, k, ct):
        fr = self.f[k]
        x = min(max(ct * 24, 0), len(fr) - 1.001)
        i = int(x)
        w = x - i
        return fr[i].astype(np.float32) * (1 - w) + fr[i + 1].astype(np.float32) * w


def render(a, c, z):
    """clip-px float image -> output frame via the camera"""
    Z = BASEZ * z
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    # output (X,Y) -> clip ((X-W/2)/Z + cx, ...)
    coeffs = (1 / Z, 0, c[0] - W / 2 / Z, 0, 1 / Z, c[1] - H / 2 / Z)
    return np.asarray(im.transform((W, H), Image.AFFINE, coeffs, resample=Image.BICUBIC), np.float32)


def numeral(acc, text, x, y, age, size=300, col=(255, 255, 255)):
    if age < 0 or age > 0.5:
        return
    sc = 1.0 + 0.35 * math.exp(-age * 14)
    al = 1.0 if age < 0.38 else 1 - (age - 0.38) / 0.12
    fnt = ImageFont.truetype(FONT, int(size * sc))
    lay = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(lay)
    bb = d.textbbox((0, 0), text, font=fnt)
    d.text((x - (bb[2] + bb[0]) / 2, y - (bb[3] + bb[1]) / 2), text, font=fnt, fill=255)
    m = np.asarray(lay, np.float32)[..., None] / 255 * al
    sh = np.roll(np.roll(m, 8, 0), 8, 1)
    acc *= 1 - sh * 0.45
    acc[:] = acc * (1 - m) + np.array(col, np.float32) * m


BUBBLES = [(rng.uniform(0, W), rng.uniform(0, 1), rng.uniform(80, 260), rng.uniform(2, 7), rng.uniform(0, 6.28))
           for _ in range(140)]


def caustics(t, strength):
    yy, xx = np.mgrid[0:160, 0:90].astype(np.float32)
    v = np.sin(xx / 5 + t * 1.1) + np.sin(yy / 4.2 - t * 1.4) + np.sin((xx + yy) / 6.5 + t * 0.8) + \
        np.sin((xx - yy) / 7.3 - t * 0.6)
    c = np.clip(1 - np.abs(v) / 0.6, 0, 1) ** 2
    im = Image.fromarray((c * 255).astype(np.uint8)).resize((W, H), Image.BILINEAR)
    return np.asarray(im, np.float32)[..., None] / 255 * strength


def frame(clips, t, trail):
    s = song_time(t)
    k, ct, c, z = shot(s)
    hw, hh = W / 2 / (BASEZ * z), H / 2 / (BASEZ * z)      # keep the camera inside the clip
    c = (min(max(c[0], hw), SW - hw) if hw < SW / 2 else SW / 2, min(max(c[1], hh), SH - hh) if hh < SH / 2 else SH / 2)
    a = clips.at(k, ct)
    # ---- clip-space effects
    if 33.58 <= s < 39.58:                                   # falling through time: echoes of where he just was
        a = a * 0.52 + clips.at(k, ct - 0.08) * 0.2 + clips.at(k, ct - 0.17) * 0.16 + clips.at(k, ct - 0.27) * 0.12
    if 27.58 <= s < 31.58:                                   # how deep it is: the pool drops away under him
        u = ramp(s, 27.58, 30.6)
        m = gaussian_filter(water_mask(a), 2.0)
        kk = 1 + 0.9 * u
        yy, xx = np.mgrid[0:SH, 0:SW].astype(np.float32)
        cx0, cy0 = 200, 120
        sx, sy = cx0 + (xx - cx0) * kk, cy0 + (yy - cy0) * kk
        sx = np.abs(sx) % (2 * SW)
        sx = np.where(sx >= SW, 2 * SW - 1 - sx, sx)
        sy = np.clip(sy, 0, SH - 1)
        warped = np.stack([map_coordinates(a[..., i], [sy, sx], order=1) for i in range(3)], -1)
        wm = gaussian_filter(water_mask(warped), 2.0)
        deep = warped * (1 - 0.62 * u) * np.array([0.7, 0.85, 1.0], np.float32)
        mm = (m * wm)[..., None]
        mo = (m * (1 - wm))[..., None]
        a = a * (1 - mm - mo) + deep * mm + a * (1 - 0.62 * u) * mo
    if 39.58 <= s < 43.58:                                   # the splash comes up gold
        lum = a.mean(-1, keepdims=True)
        g = np.clip((lum - 170) / 60, 0, 1) * ramp(s, 39.58, 39.9)
        a = a * (1 - g) + (GOLD * 0.6 + a * 0.5) * g
    if 55.58 <= s < 59.58:
        lum = a.mean(-1, keepdims=True)
        g = np.clip((lum - 185) / 50, 0, 1) * 0.8
        a = a * (1 - g) + (GOLD * 0.55 + a * 0.5) * g
    under = 43.58 <= s < 55.58
    if under:
        yy, xx = np.mgrid[0:SH, 0:SW].astype(np.float32)
        sx = xx + 5 * np.sin(yy / 21 + s * 2.6) + 3 * np.sin(yy / 9 - s * 3.1)
        sy = yy + 4 * np.sin(xx / 27 + s * 1.9)
        a = np.stack([map_coordinates(a[..., i], [sy, sx], order=1, mode="nearest") for i in range(3)], -1)
        lum = a.mean(-1, keepdims=True)
        gold = ramp(s, 47.3, 49.0)
        tint = np.array([0.35, 0.75, 0.95], np.float32) * (1 - gold) + np.array([1.05, 0.78, 0.38], np.float32) * gold
        a = (a * 0.35 + lum * 0.65) * tint
    if s >= 51.58 and under:                                 # he sinks away
        u = ramp(s, 51.58, 55.3)
        sc = 1 - 0.78 * u
        im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
        nw, nh = max(8, int(SW * sc)), max(8, int(SH * sc))
        small = np.asarray(im.resize((nw, nh), Image.BICUBIC), np.float32) * (1 - 0.75 * u)
        fy = np.minimum(np.arange(nh), np.arange(nh)[::-1])[:, None] / (0.18 * nh)
        fx = np.minimum(np.arange(nw), np.arange(nw)[::-1])[None, :] / (0.18 * nw)
        fm = np.clip(np.minimum(fx, fy), 0, 1)[..., None] ** 1.5
        bg = np.zeros_like(a) + np.array([10, 40, 60], np.float32) * (1 - ramp(s, 47.3, 49)) + \
            np.array([60, 36, 8], np.float32) * ramp(s, 47.3, 49)
        ox, oy = (SW - nw) // 2, int((SH - nh) / 2 + 160 * u)
        oy = min(oy, SH - nh)
        bg[oy:oy + nh, ox:ox + nw] = small * fm + bg[oy:oy + nh, ox:ox + nw] * (1 - fm)
        a = bg
    if 25.58 <= s < 26.08:                                   # rewind: tracking jitter
        for y0 in range(0, SH, 8):
            a[y0:y0 + 8] = np.roll(a[y0:y0 + 8], int(rng.normal(0, 6)), 1)
        a = a * 0.8 + a.mean(-1, keepdims=True) * 0.2
    out = render(a, c, z)
    Z = BASEZ * z
    # ---- output-space effects
    if 41.58 <= s < 43.58:                                   # going under
        u = ramp(s, 41.58, 43.2)
        deep = np.zeros_like(out) + np.linspace(0, 1, H, dtype=np.float32)[:, None, None] * \
            np.array([-10, -40, -30], np.float32) + np.array([20, 70, 100], np.float32)
        out = out * (1 - u) + deep * u
        fl = math.exp(-max(0.0, s - 41.9) * 3) * ramp(s, 41.58, 41.9)
        out += fl * 160
    if under:
        dark = np.zeros((H, W, 1), np.float32)
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        r = np.sqrt(((xx - W / 2) / W) ** 2 + ((yy - H * 0.45) / H) ** 2)
        vig = np.clip(1.25 - r * 1.6, 0, 1)[..., None]
        fade = ramp(s, 43.58, 44.6)
        out = out * vig * fade + dark
        gold = ramp(s, 47.3, 49.0)
        cc = np.array([150, 230, 255], np.float32) * (1 - gold) + np.array([255, 210, 120], np.float32) * gold
        out += caustics(s, 0.32) * cc * (np.linspace(1, 0.2, H, dtype=np.float32)[:, None, None])
    if 41.58 <= s < 55.58:
        acc = np.zeros_like(out)
        for (bx, b0, sp, br, ph) in BUBBLES:
            age = s - 41.58 - b0 * 3
            if age < 0:
                continue
            y = H + 20 - (age * sp) % (H + 60)
            x = bx + 18 * math.sin(age * 3 + ph)
            add_glow(acc, x, y, br, np.array([200, 240, 255], np.float32), 0.5)
        out += acc * (1 - ramp(s, 47.3, 49.0) * 0.4)
    if 49.0 <= s < 55.58:                                    # the light, out of control
        acc = np.zeros_like(out)
        g = ramp(s, 49.0, 53.5)
        for j in range(6):
            for q in range(14):
                ang = j * 1.047 + s * (1.3 + 0.4 * j) + q * 0.16 * math.sin(s * 2 + j)
                rr = (40 + q * 30) * g
                x = W / 2 + rr * math.cos(ang)
                y = H * 0.62 + rr * math.sin(ang) * 0.8
                add_glow(acc, x, y, 10 + q * 1.5, GOLD, 0.55 * g * (1 - q / 16))
        add_glow(acc, W / 2, H * 0.62, 90 * g + 10, GOLD, 0.9 * g * (0.8 + 0.2 * math.sin(s * 17)))
        out += acc
    if s < 31.58 or s >= SPLICE_SONG:
        out *= 0.8
    acc = np.zeros_like(out)
    # the light
    if s < 15.58:
        h = to_out(track(HAND_A, 0), c, z)
        u = ease((s - 13.6) / 1.98)
        y = -80 + (h[1] + 80) * u ** 1.6
        light(acc, h[0], y, 1.3, 1.0, s)
        trail.append((h[0], y))
        for i, (tx, ty) in enumerate(trail[-14:]):
            add_glow(acc, tx, ty, 10, AMBER, 0.05 * i)
        if s > 15.4:
            add_glow(acc, h[0], h[1], 120, AMBER, 1.2 * (15.58 - s) / 0.18)
    elif s < 23.58:
        h = to_out(track(HAND_A, ct), c, z)
        light(acc, h[0], h[1], z * 0.75, 1.0, s)
        add_glow(acc, h[0], h[1], 260 * z, AMBER, 0.6 * math.exp(-(s - 15.58) * 3))
    elif s < 25.58:
        u = ramp(s, 23.58, 24.08)
        h = track(HAND_A, min(ct, 1.75))
        ch = track(CHEST_A, ct)
        p = to_out((h[0] + (ch[0] - h[0]) * u, h[1] + (ch[1] - h[1]) * u), c, z)
        light(acc, p[0], p[1], 0.75 - 0.15 * u, 1.0 - 0.3 * u, s)
    elif s < 26.08:
        p = to_out(track(CHEST_A, max(ct, 1.75)), c, z)
        light(acc, p[0], p[1], 0.6, 0.7, s)
    elif s < 39.58:
        p = to_out(track(CHEST_B, ct), c, z)
        b = 0.7
        if 30.08 <= s < 31.58:
            b = 0.55 + 0.45 * math.exp(-((s - 30.08) % 0.5) * 7)
        if s >= 31.58:
            b = 1.0
            trail.append(p)
            for i, (tx, ty) in enumerate(trail[-30:]):
                add_glow(acc, tx, ty, 9 * z, AMBER, 0.04 * i)
        light(acc, p[0], p[1], 0.6 * z ** 0.5, b, s)
    elif s < 41.58:
        p = to_out((200, 425), c, z)
        g = math.exp(-(s - 39.58) * 1.5)
        add_glow(acc, p[0], p[1], 120, GOLD, 1.4 * g)
        for rr in range(3):
            R = (s - 39.58 - rr * 0.35) * 260
            if R > 0:
                yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
                d = np.sqrt((xx - p[0]) ** 2 + ((yy - p[1]) * 1.15) ** 2)
                acc += (np.exp(-((d - R) ** 2) / (2 * 10 ** 2)) * 0.5 * max(0, 1 - R / 700))[..., None] * GOLD
    elif 55.58 <= s < 64.0:
        p = to_out(track(UP_B, ct), c, z)
        g = ramp(s, 56.5, 60.5)
        add_glow(acc, p[0], p[1], 140 + 200 * g, GOLD, 0.3 + 0.15 * g * (1 - ramp(s, 59.58, 60.5)))
        if s >= 59.58:                                       # bigger than I gave it: gold breaks in round the edges
            yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
            r = np.sqrt(((xx - W / 2) / W) ** 2 + ((yy - H / 2) / H) ** 2)
            hit = math.exp(-((s - 59.58) % 0.5) * 5) * (1 - ramp(s, 62.8, 63.3))
            acc += (np.clip(r * 2.2 - 0.6, 0, 1) * (0.12 + 0.25 * hit))[..., None] * GOLD
    elif s >= SPLICE_SONG:
        u = ramp(s, 129.0, 131.6)
        x, y = W / 2, H + 60 - (H + 60 - H * 0.72) * u
        light(acc, x, y, 1.4, 0.6 + 0.6 * ramp(s, 131.6, 133.2), s)
    # flashes in the stands
    if 19.58 <= s < 23.58:
        k8 = int((s - 19.58) / 0.25)
        ph = (s - 19.58) % 0.25
        r2 = np.random.default_rng(1000 + k8)
        for _ in range(5):
            side = r2.integers(0, 3)
            if side == 0:
                q = (r2.uniform(10, 390), r2.uniform(4, 34))
            elif side == 1:
                q = (r2.uniform(0, 30), r2.uniform(620, 720))
            else:
                q = (r2.uniform(370, 400), r2.uniform(620, 720))
            qx, qy = to_out(q, c, z)
            amp = math.exp(-ph * 22) * r2.uniform(0.6, 1.2)
            add_glow(acc, qx, qy, 4, np.array([255, 255, 255], np.float32), 3.0 * amp)
            add_glow(acc, qx, qy, 18, np.array([220, 230, 255], np.float32), 0.8 * amp)
    out = out + acc
    # count it to three, and again
    for i, (bt, x, y) in enumerate([(24.08, 120, 860), (24.58, 560, 980), (25.08, 330, 1130),
                                    (26.08, 590, 820), (26.58, 140, 1010), (27.08, 470, 1150)]):
        numeral(out, str(i % 3 + 1), x, y, s - bt)
    if 31.58 <= s < 31.8:                                    # the chorus hits as he leaves the board
        out += 90 * (1 - (s - 31.58) / 0.22)
    if 59.58 <= s < 63.0:
        sh = math.exp(-((s - 59.58) % 0.5) * 9) * 14
        out = np.roll(out, (int(rng.normal(0, sh)), int(rng.normal(0, sh))), (0, 1))
    if s >= 63.0 and s < 64:
        out *= 1.0
    out += rng.normal(0, 1.4, (H, W, 1))
    return np.clip(out, 0, 255).astype(np.uint8)


def main():
    clips = Clips()
    out = None
    if not TEST:
        out = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                                str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p",
                                os.environ.get("VOUT", "out/drawn/one-jump.mp4")], stdin=subprocess.PIPE)
    trail = []
    for fr in range(int(round(DUR * FPS))):
        t = fr / FPS
        s = song_time(t)
        if TEST and not any(abs(s - q) < 0.5 / FPS for q in TEST):
            continue
        if PART and not (PART[0] <= t < PART[1]):
            continue
        if PART and len(trail) == 0 and t > 0:
            trail = []
        img = frame(clips, t, trail)
        if TEST:
            Image.fromarray(img).save(f"{os.environ['TESTDIR']}/j{s:06.2f}.png")
            print("test", round(s, 2), flush=True)
            continue
        out.stdin.write(img.tobytes())
        if fr % 96 == 0:
            print(f"{s:6.1f}", flush=True)
    if out:
        out.stdin.close()
        out.wait()


if __name__ == "__main__":
    main()
