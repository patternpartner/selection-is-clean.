"""'One Jump' v3 - the user's own likeness (u131, u132: two Grok takes of him on a high-dive board over a stadium pool, seen
from above) and the user's own song 'One Jump' (120 bpm, phase 0.081; word times video/stories/one-jump-words.json),
written from Claude's lyrics 'No Rewind' (video/lyrics/no-rewind.txt).
THE STORY (v3): it copies you - and then it IS you. A spark falls past his face and becomes a little gold him on the board.
On "everybody's watching" more of them pop into being, standing on the water round the board, six little gold hims, and
every one does what he does in a wave, each a beat later than the last. He jumps; THEN they jump, one after another, after
him. They stream down and fly into him one by one, and each one turns more of him gold (the user's idea: "before they hit
the bottom the gold one merges into the bigger one"), so he hits the water gold. Underwater he is gold; "out of control" he
splits into a spinning ring of gold screaming hims. What comes back up out of the pool, at the camera, is the whole gold
him, "bigger than I gave it, louder than me", until the camera goes into his open mouth - black, on the song's breath.
Splice to the outro: him calm on the board, one little gold him calm beside him - "make it the right one".
(v1: a glow that meant nothing. v2: one copy beside him - the user: "the timing is off ... just before the dive the gold
one goes to dive before the big version of me", and "is it silly enough? We could be weirder.")
Person masks: out/masks/u131.npy, u132.npy (rembg u2net_human_seg, every frame at 24 fps; scratchpad masks.py).
Song 13.6-63.58, then a splice on the same bar phase to 127.58-133.6.
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
GOLD = np.array([255, 196, 70], np.float32)
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
rng = np.random.default_rng(120)
YY, XX = np.mgrid[0:SH, 0:SW].astype(np.float32)
EDGE = np.clip(np.minimum(np.minimum(XX, SW - 1 - XX), np.minimum(YY, SH - 1 - YY)) / 45, 0, 1)
REF = (195.0, 692.0)                                     # his feet on the board, clip px: the copies are placed by this
MOUTH = (200.0, 478.0)                                   # his open mouth in u132 at 11.5-12.5 s (gridded sheet)
# the copies: (feet x, feet y, scale, lag behind him in song s, the beat it pops into being)
COPIES = [(62, 702, 0.42, 0.35, 15.58), (332, 640, 0.34, 0.50, 19.58), (52, 470, 0.31, 0.65, 20.08),
          (340, 452, 0.31, 0.80, 20.58), (66, 288, 0.27, 0.95, 21.08), (324, 268, 0.27, 1.10, 21.58)]
JUMP = 31.58                                             # he leaves the board
MERGE = [34.3 + 0.72 * k for k in range(6)]              # each copy reaches him, in turn, on the way down
SPLASH = 39.58

_GR = np.array([[0.0, 40, 14, 0], [0.3, 150, 70, 8], [0.55, 235, 150, 40], [0.8, 255, 214, 110], [1.0, 255, 250, 225]],
               np.float32)


def gold_of(lum):
    return np.stack([np.interp(lum, _GR[:, 0], _GR[:, i]) for i in (1, 2, 3)], -1).astype(np.float32)


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
    """(scene, clip, clip second) for a song second"""
    if s < 23.58:
        return "board", "A", lin(s, 15.58, 23.58, 0.0, 1.75)
    if s < 26.08:
        return "board", "A", lin(s, 23.58, 26.08, 1.75, 3.0)
    if s < 30.08:
        return "board", "B", lin(s, 26.08, 30.08, 1.0, 2.5)
    if s < JUMP:
        return "board", "B", lin(s, 30.08, JUMP, 2.5, 2.55)
    if s < 33.58:
        return "fall", "B", lin(s, JUMP, 33.58, 2.55, 3.75)
    if s < SPLASH:
        return "fall", "B", lin(s, 33.58, SPLASH, 3.75, 5.2)
    if s < 43.58:
        return "splash", "B", lin(s, SPLASH, 41.58, 5.2, 6.5)
    if s < 51.58:
        return "under", "A", lin(s, 43.58, 51.58, 7.25, 11.25)
    if s < 55.58:
        return "kaleido", "A", lin(s, 51.58, 55.58, 11.25, 12.4)
    if s < 59.58:
        return "rise", "B", lin(s, 55.58, 59.58, 6.75, 9.5)
    if s < 64.0:
        return "face", "B", lin(s, 59.58, 62.4, 9.5, 12.0) if s < 62.4 else lin(s, 62.4, 63.1, 12.0, 12.3)
    return "calm", "A", lin(s, SPLICE_SONG, END_SONG, 12.5, 15.0)


def camera(s):
    if s < 21.0:                                         # his face; down with the spark to the copy forming; wide
        face, copy, wide = (205, 254, 1.5), (133, 470, 1.5), (200, 368, 1.0)
        u, v = ramp(s, 15.0, 16.4), ramp(s, 19.4, 20.4)
        p = [face[i] + (copy[i] - face[i]) * u for i in range(3)]
        p = [p[i] + (wide[i] - p[i]) * v for i in range(3)]
        return (p[0], p[1]), p[2]
    if s < 30.08:
        return (200, 368), 1.0
    if s < JUMP:
        return (200, 368), 1.0 + 0.014 * math.exp(-((s - 30.08) % 0.5) * 8)
    if s < 33.58:
        return (200, 368), 1.0
    if s < SPLASH:
        u = ramp(s, 33.58, 39.0)
        return (200 - 10 * u, 368 + 50 * u), 1.0 + 0.45 * u
    if s < 41.58:
        return (190, 418), 1.45
    if s < 43.58:
        return (195, 425), 1.45 * math.exp(1.3 * max(0.0, s - 41.9))
    if 43.58 <= s < 51.58:                               # underwater: drifting in on him, not holding still
        u = ramp(s, 43.58, 51.58)
        return (200 + 14 * math.sin(s * 0.8), 360 + 10 * math.sin(s * 1.1)), 1.0 + 0.32 * u
    if s < 59.58:
        return (200, 368), 1.0
    if s < 64.0:
        u = ramp(s, 59.58, 62.3)
        c = (200, 368 + 30 * u)
        z = 1.0 + 0.25 * u
        m = max(0.0, s - 62.4) / 0.7                     # into his mouth
        if m > 0:
            k = ease(min(m, 1.0))
            c = (c[0] + (MOUTH[0] - c[0]) * k, c[1] + (MOUTH[1] - c[1]) * k)
            z = z * math.exp(2.6 * min(m, 1.0) ** 1.6)
        return c, z
    return (200, 368), 1.0


class Clips:
    def __init__(self):
        self.f, self.m = {}, {}
        for k, u in (("A", "u131"), ("B", "u132")):
            raw = subprocess.run([F, "-loglevel", "error", "-i", f"out/user-clips/{u}.mp4", "-map", "0:v:0", "-vf", "fps=24",
                                  "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
            self.f[k] = np.frombuffer(raw, np.uint8).reshape(-1, SH, SW, 3)
            self.m[k] = np.load(f"out/masks/{u}.npy", mmap_mode="r")

    def at(self, k, ct):
        fr, ms = self.f[k], self.m[k]
        n = min(len(fr), len(ms))
        x = min(max(ct * 24, 0), n - 1.001)
        i = int(x)
        w = x - i
        a = fr[i].astype(np.float32) * (1 - w) + fr[i + 1].astype(np.float32) * w
        m = (ms[i].astype(np.float32) * (1 - w) + ms[i + 1].astype(np.float32) * w) / 255
        return a, m


def centroid(m):
    s = m.sum() + 1e-6
    return float((m * XX).sum() / s), float((m * YY).sum() / s)


def goldify(rgb, m, s, heat=1.0, wave=9.0):
    """his cut-out as light: luminance through a gold ramp, slow flowing bands, a white rim"""
    lum = rgb.mean(-1) / 255
    lo, hi = np.percentile(lum[m > 0.5], [3, 97]) if (m > 0.5).sum() > 40 else (0.0, 1.0)
    l2 = np.clip((lum - lo) / max(hi - lo, 0.05), 0, 1)
    band = 0.5 + 0.5 * np.sin(YY / wave - s * 7 + XX / (2.5 * wave))
    l2 = np.clip(0.16 + 0.78 * l2 + 0.08 * band * heat, 0, 1)
    col = gold_of(l2)
    edge = np.clip(m - gaussian_filter(m, 1.6), 0, 1) * 3
    col = col + edge[..., None] * np.array([255, 240, 200], np.float32)
    return col, np.clip(m * 0.95, 0, 1)


def place(col, al, k, src, dst, rot=0.0, edge=False):
    """scale a clip-space layer by k about src, put src at dst (optionally rotated); PIL affine, so it is quick"""
    if edge:
        al = al * EDGE
    rgba = np.dstack([np.clip(col, 0, 255), np.clip(al * 255, 0, 255)]).astype(np.uint8)
    im = Image.fromarray(rgba, "RGBA")
    ca, sa = math.cos(math.radians(rot)), math.sin(math.radians(rot))
    # output (x,y) -> source: src + R^-1 ((x,y) - dst) / k
    a, b = ca / k, sa / k
    d, e = -sa / k, ca / k
    coeffs = (a, b, src[0] - a * dst[0] - b * dst[1], d, e, src[1] - d * dst[0] - e * dst[1])
    o = np.asarray(im.transform((SW, SH), Image.AFFINE, coeffs, resample=Image.BILINEAR), np.float32)
    return o[..., :3], o[..., 3] / 255


def over(base, col, al):
    return base * (1 - al[..., None]) + col * al[..., None]


def halo(m, r, amp):
    return gaussian_filter(m, r)[..., None] * GOLD * amp


def water_mask(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    return ((b > 150) & (g > 110) & (r < 140) & (b > r + 60)).astype(np.float32)


def underwater_bg(s, gold):
    """the deep end, drawn: a gradient, light shafts swaying from the surface, caustics"""
    top = np.array([40, 130, 170], np.float32) * (1 - gold) + np.array([150, 105, 35], np.float32) * gold
    bot = np.array([2, 14, 30], np.float32) * (1 - gold) + np.array([30, 12, 2], np.float32) * gold
    v = (YY / SH)[..., None]
    bg = top * (1 - v) ** 1.4 + bot * (1 - (1 - v) ** 1.4)
    rays = np.zeros((SH, SW), np.float32)
    for j in range(7):
        x0 = 30 + j * 58 + 20 * math.sin(s * 0.7 + j)
        slope = 0.32 + 0.05 * math.sin(j * 1.7)
        d = np.abs(XX - (x0 + YY * slope))
        w = 10 + 6 * math.sin(j * 2.3 + s)
        rays += np.exp(-(d / w) ** 2) * (0.5 + 0.5 * math.sin(s * 1.3 + j * 2.1)) * np.exp(-YY / 420)
    rc = np.array([170, 230, 255], np.float32) * (1 - gold) + np.array([255, 215, 130], np.float32) * gold
    bg += rays[..., None] * rc * 0.45
    cv = np.sin(XX / 11 + s * 1.1) + np.sin(YY / 9 - s * 1.4) + np.sin((XX + YY) / 14 + s * 0.8) + np.sin((XX - YY) / 16 - s)
    caus = np.clip(1 - np.abs(cv) / 0.55, 0, 1) ** 2 * np.exp(-YY / 160)
    bg += caus[..., None] * rc * 0.5
    return bg


def add_glow(acc, x, y, r, color, amp):
    R = int(r * 4) + 2
    x0, x1 = max(0, int(x) - R), min(acc.shape[1], int(x) + R)
    y0, y1 = max(0, int(y) - R), min(acc.shape[0], int(y) + R)
    if x0 >= x1 or y0 >= y1:
        return
    yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
    g = np.exp(-((xx - x) ** 2 + (yy - y) ** 2) / (2 * r * r)) * amp
    acc[y0:y1, x0:x1] += g[..., None] * np.asarray(color, np.float32)


def render(a, c, z):
    Z = BASEZ * z
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    coeffs = (1 / Z, 0, c[0] - W / 2 / Z, 0, 1 / Z, c[1] - H / 2 / Z)
    return np.asarray(im.transform((W, H), Image.AFFINE, coeffs, resample=Image.BICUBIC), np.float32)


def numeral_mask(text, x, y, size, rot=0.0):
    lay = Image.new("L", (SW, SH), 0)
    fnt = ImageFont.truetype(FONT, size)
    d = ImageDraw.Draw(lay)
    bb = d.textbbox((0, 0), text, font=fnt)
    d.text((x - (bb[2] + bb[0]) / 2, y - (bb[3] + bb[1]) / 2), text, font=fnt, fill=255)
    if rot:
        lay = lay.rotate(rot, center=(x, y), resample=Image.BICUBIC)
    return np.asarray(lay, np.float32) / 255


def pop_scale(s, t0):
    u = (s - t0) / 0.32
    if u <= 0:
        return 0.0
    if u >= 1:
        return 1.0
    return min(1.0, u * 1.5) + 0.32 * math.sin(math.pi * u)


def gold_level(s):
    """how much of him is gold: a sixth more each time a copy flies into him"""
    return sum(ramp(s, mk, mk + 0.3) for mk in MERGE) / len(MERGE)


def to_out(p, c, z):
    return (p[0] - c[0]) * BASEZ * z + W / 2, (p[1] - c[1]) * BASEZ * z + H / 2


def frame(clips, t):
    s = song_time(t)
    scene, k, ct = shot(s)
    c, z = camera(s)
    hw, hh = W / 2 / (BASEZ * z), H / 2 / (BASEZ * z)
    c = (min(max(c[0], hw), SW - hw) if hw < SW / 2 else SW / 2, min(max(c[1], hh), SH - hh) if hh < SH / 2 else SH / 2)
    a, m = clips.at(k, ct)
    glows = []                                               # (clip x, clip y, radius in output px, colour, amp)
    if scene in ("board", "fall", "splash"):
        if 27.58 <= s < JUMP:                                # how deep it is: the water drops away beneath him
            u = ramp(s, 27.58, 30.6)
            wm0 = gaussian_filter(water_mask(a), 2.0) * (1 - m)
            kk = 1 + 0.9 * u
            sx, sy = 200 + (XX - 200) * kk, 120 + (YY - 120) * kk
            sx = np.abs(sx) % (2 * SW)
            sx = np.where(sx >= SW, 2 * SW - 1 - sx, sx)
            sy = np.clip(sy, 0, SH - 1)
            warped = np.stack([map_coordinates(a[..., i], [sy, sx], order=1) for i in range(3)], -1)
            wm1 = gaussian_filter(water_mask(warped), 2.0)
            deep = warped * (1 - 0.62 * u) * np.array([0.7, 0.85, 1.0], np.float32)
            dim = a * (1 - 0.62 * u)
            a = a * (1 - wm0[..., None]) + (deep * wm1[..., None] + dim * (1 - wm1[..., None])) * wm0[..., None]
        # him, going gold as they fly into him
        g = gold_level(s)
        if g > 0:
            col, al = goldify(a, m, s, heat=1.2)
            a = a + halo(m, 6, 0.6 * g)
            a = over(a, col, al * g)
        # the copies
        hc = centroid(m)
        for i, (fx, fy, sc, lag, born) in enumerate(COPIES):
            if s < born or s >= MERGE[i]:
                continue
            ts = s - lag
            tsc, tk, tct = shot(max(ts, 15.58))
            ta, tm = clips.at(tk, tct)
            launch = JUMP + lag + 0.55                       # when it stops copying the jump and comes after him
            if s < launch:
                q = sc * (pop_scale(s, born) if i > 0 else 1.0)
                if q <= 0.01:
                    continue
                tcol, tal = goldify(ta, tm, s)
                pc, pa = place(tcol, tal, q, REF, (fx, fy))
                if i == 0 and s < 16.8:                      # the first assembles out of sparks
                    born_u = ramp(s, 15.58, 16.6)
                    noise = gaussian_filter(np.random.default_rng(7).random((SH, SW)).astype(np.float32), 2.5)
                    noise = (noise - noise.min()) / (noise.max() - noise.min() + 1e-6)
                    pa = pa * np.clip((born_u * 1.3 - noise) * 6, 0, 1)
                if s < JUMP:                                  # its shadow on whatever it stands on
                    shm = np.roll(np.roll(gaussian_filter(pa, 3), 8, 0), 10, 1) * 0.3
                    a = a * (1 - shm[..., None])
                a = a + halo(pa, 6, 0.5)
                a = over(a, pc, pa)
                if i > 0 and born <= s < born + 0.3:
                    glows.append((fx, fy - 180 * sc, 90, GOLD, 1.4 * (1 - (s - born) / 0.3)))
            else:                                             # after him: a gold diver in his shape, homing in
                u = ease((s - launch) / (MERGE[i] - launch))
                start = (fx, fy - 150 * sc)
                arc = math.sin(math.pi * u) * (-60 if fx < 200 else 60)
                pos = (start[0] + (hc[0] - start[0]) * u + arc, start[1] + (hc[1] - start[1]) * u)
                q = (sc + 0.08) * (1 - u) + 0.95 * u
                hcol, hal = goldify(a, m, s)
                pc, pa = place(hcol, hal, q, hc, pos)
                a = a + halo(pa, 6, 0.6)
                a = over(a, pc, pa)
                for j in range(1, 6):                         # a trail of light behind it
                    uj = ease(max(0.0, (s - 0.05 * j - launch) / (MERGE[i] - launch)))
                    pj = (start[0] + (hc[0] - start[0]) * uj + math.sin(math.pi * uj) * (-60 if fx < 200 else 60),
                          start[1] + (hc[1] - start[1]) * uj)
                    glows.append((pj[0], pj[1], 14, GOLD, 0.5 * (1 - j / 6)))
        for mk in MERGE:                                      # each arrival: a flash on him
            if mk <= s < mk + 0.4:
                glows.append((hc[0], hc[1], 70, [255, 235, 180], 1.8 * (1 - (s - mk) / 0.4)))
        if scene == "splash":                                 # he hits the water gold: the splash is gold
            lum = a.mean(-1, keepdims=True)
            gg = np.clip((lum - 165) / 60, 0, 1) * ramp(s, SPLASH, SPLASH + 0.25)
            a = a * (1 - gg) + (GOLD * 0.62 + a * 0.45) * gg
    elif scene == "under":
        gold = ramp(s, 47.3, 49.4)
        bg = underwater_bg(s, gold)
        col, al = goldify(a, m, s, heat=1 + gold, wave=12)
        pc, pa = place(col, al, 0.84, centroid(m), (200 + 12 * math.sin(s * 0.9), 400 + 10 * math.sin(s * 1.3)), edge=True)
        pa = pa * ramp(s, 43.58, 44.4)
        bg = bg + halo(pa, 12, 0.7 + 0.5 * gold)
        a = over(bg, pc, pa)
    elif scene == "kaleido":                                  # out of control: he comes apart into a ring of himself
        bg = underwater_bg(s, 1.0)
        col, al = goldify(a, m, s, heat=2, wave=12)
        u = ramp(s, 51.58, 52.6)
        n = 7
        R = 150 * u
        spin = (s - 51.58) * 95
        for j in range(n):
            ang = math.radians(spin + j * 360 / n)
            q = 0.34 + 0.06 * math.sin(s * 6 + j)
            pos = (200 + R * math.cos(ang), 380 + R * math.sin(ang) * 1.25)
            pc, pa = place(col, al, q, centroid(m), pos, rot=-(spin + j * 360 / n) + 90 if u > 0 else 0, edge=True)
            bg = bg + halo(pa, 8, 0.5)
            bg = over(bg, pc, pa)
        pc, pa = place(col, al, 0.5 - 0.15 * u, centroid(m), (200, 380), rot=-spin * 0.5, edge=True)
        bg = over(bg + halo(pa, 10, 0.8), pc, pa)
        a = bg
    elif scene in ("rise", "face"):                           # what comes back up is the whole gold him
        col, al = goldify(a, m, s, heat=1.4, wave=22)
        if scene == "face":
            a = a * (1 - 0.55 * ramp(s, 59.58, 60.2))
        a = a + halo(m, 9, 0.7)
        a = over(a, col, al)
    elif scene == "calm":
        ts = max(s - 0.35, SPLICE_SONG)
        ta, tm = clips.at("A", shot(ts)[2])
        tcol, tal = goldify(ta, tm, s, heat=0.6)
        pc, pa = place(tcol, tal, 0.34, (200, 736), (335, 735), edge=False)
        pa = pa * ramp(s, SPLICE_SONG, SPLICE_SONG + 0.6)
        a = a * 0.88 + halo(pa, 7, 0.5)
        a = over(a, pc, pa)
    out = render(a, c, z)
    acc = np.zeros_like(out)
    for (gx, gy, r, colr, amp) in glows:
        X, Y = to_out((gx, gy), c, z)
        add_glow(acc, X, Y, r, colr, amp)
    # the spark that becomes the first one: it falls past his face to the board beside him
    if 14.3 <= s < 15.58:
        tx, ty = COPIES[0][0], COPIES[0][1] - 20
        for i in range(14):
            u = ease((s - i * 0.03 - 14.3) / 1.28)
            px, py = 175 + (tx - 175) * u, 60 + (ty - 60) * u ** 1.5
            PX, PY = to_out((px, py), c, z)
            if i == 0:
                add_glow(acc, PX, PY, 7, [255, 245, 225], 2.6)
                add_glow(acc, PX, PY, 26, GOLD, 1.0)
            else:
                add_glow(acc, PX, PY, 5, GOLD, 0.5 * (1 - i / 14))
    if 15.58 <= s < 16.4:
        X, Y = to_out((COPIES[0][0], COPIES[0][1] - 90), c, z)
        add_glow(acc, X, Y, 150, GOLD, 1.0 * math.exp(-(s - 15.58) * 4))
    # everybody's watching: flashes in the stands
    if 19.58 <= s < 23.58:
        k8 = int((s - 19.58) / 0.25)
        ph = (s - 19.58) % 0.25
        r2 = np.random.default_rng(1000 + k8)
        for _ in range(6):
            side = r2.integers(0, 3)
            q = [(r2.uniform(10, 390), r2.uniform(4, 34)), (r2.uniform(0, 30), r2.uniform(620, 720)),
                 (r2.uniform(370, 400), r2.uniform(620, 720))][side]
            X, Y = to_out(q, c, z)
            amp = math.exp(-ph * 22) * r2.uniform(0.6, 1.2)
            add_glow(acc, X, Y, 4, [255, 255, 255], 3.0 * amp)
            add_glow(acc, X, Y, 18, [220, 230, 255], 0.8 * amp)
    # count it to three, and again: numbers of the same light, in the water between them
    for i, (bt, x, y, rot) in enumerate([(24.08, 58, 382, 8), (24.58, 338, 548, -6), (25.08, 58, 590, 4),
                                         (26.58, 338, 360, -8), (27.08, 58, 382, 6), (27.58, 338, 548, -4)]):
        age = s - bt
        if 0 <= age < 0.5:
            nm = gaussian_filter(numeral_mask(str(i % 3 + 1), x, y, 96, rot), 0.6)
            nm = nm * (1 if age < 0.36 else 1 - (age - 0.36) / 0.14) * min(1, age / 0.06)
            o = np.clip(render(np.stack([nm * 255] * 3, -1), c, z)[..., 0] / 255, 0, 1)
            lum = np.clip(0.55 + 0.45 * np.sin(np.arange(H, dtype=np.float32)[:, None] / 12 - s * 9), 0, 1) * 0.6 + 0.4
            out = out * (1 - o[..., None]) + gold_of(np.broadcast_to(lum, (H, W))) * o[..., None]
            acc += gaussian_filter(o, 9)[..., None] * GOLD * 0.8
    # the gold splash
    if SPLASH <= s < 42.5:
        age = s - SPLASH
        X, Y = to_out((200, 432), c, z)
        add_glow(acc, X, Y, 70 + 140 * age, GOLD, 1.5 * math.exp(-age * 2.0))
        r2 = np.random.default_rng(42)
        for j in range(90):
            ang = r2.uniform(0, 6.28)
            v = r2.uniform(150, 560)
            dx = math.cos(ang) * v * age
            dy = math.sin(ang) * v * age * 0.8 + 260 * age * age
            add_glow(acc, X + dx, Y + dy, 3 + 2 * r2.random(), [255, 220, 140], 1.6 * math.exp(-age * 1.6))
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        d = np.sqrt((xx - X) ** 2 + ((yy - Y) * 1.2) ** 2)
        for rr in range(3):
            R = (age - rr * 0.3) * 320
            if R > 0:
                acc += (np.exp(-((d - R) ** 2) / (2 * 6 ** 2)) * 0.7 * max(0, 1 - R / 800))[..., None] * GOLD
    out = out + acc
    if 41.58 <= s < 43.58:                                   # under: a rush of gold bubbles wipes up the frame
        u = ramp(s, 41.7, 43.5)
        deep = np.zeros_like(out) + np.array([30, 50, 60], np.float32)
        out = out * (1 - u) + deep * u
        acc2 = np.zeros_like(out)
        for j in range(160):
            bx = (j * 97.3) % W
            sp = 900 + (j * 37) % 700
            y = H + 60 - (s - 41.58) * sp + (j * 53) % 400
            add_glow(acc2, bx + 10 * math.sin(s * 8 + j), y, 3 + (j % 5), [255, 230, 170], 0.9)
        out += acc2 * (1 - ramp(s, 43.0, 43.58))
    if 43.58 <= s < 55.58:                                   # bubbles off him, rising
        acc3 = np.zeros_like(out)
        for j in range(50):
            sp = 60 + (j * 41) % 120
            y = (H - ((s - 43.58) * sp + j * 97) % (H + 40))
            x = W / 2 + ((j * 131) % 300 - 150) + 14 * math.sin(s * 2 + j)
            add_glow(acc3, x, y, 2 + j % 4, [255, 240, 200], 0.55)
        out += acc3
    if 47.34 <= s < 48.6:                                    # "golden": the water catches
        age = s - 47.34
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        d = np.sqrt((xx - W / 2) ** 2 + (yy - H * 0.42) ** 2)
        R = age * 900
        out += (np.exp(-((d - R) ** 2) / (2 * 30 ** 2)) * 0.8 * (1 - age / 1.26))[..., None] * GOLD
    if 55.25 <= s < 55.58:                                   # it rushes up out of the deep
        out += 255 * ramp(s, 55.25, 55.58)
    if 55.58 <= s < 56.0:
        out += 255 * (1 - ramp(s, 55.58, 56.0))
    if JUMP <= s < JUMP + 0.2:
        out += 70 * (1 - (s - JUMP) / 0.2)
    if 59.58 <= s < 62.4:                                    # louder than me: the hits shake it, a ring goes out
        hit = math.exp(-((s - 59.58) % 0.5) * 9)
        R = ((s - 59.58) % 0.5) * 1800
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        d = np.sqrt((xx - W / 2) ** 2 + (yy - H * 0.45) ** 2)
        out += (np.exp(-((d - R) ** 2) / (2 * 14 ** 2)) * 0.5 * hit)[..., None] * GOLD
        out = np.roll(out, (int(rng.normal(0, 12 * hit)), int(rng.normal(0, 12 * hit))), (0, 1))
    if 62.4 <= s < 64.0:                                     # into the mouth: dark, then black on the breath
        out *= 1 - ramp(s, 62.75, 63.1)
    out += rng.normal(0, 1.4, (H, W, 1))
    return np.clip(out, 0, 255).astype(np.uint8)


def main():
    clips = Clips()
    out = None
    if not TEST:
        out = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                                str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p",
                                os.environ.get("VOUT", "out/drawn/one-jump.mp4")], stdin=subprocess.PIPE)
    for fr in range(int(round(DUR * FPS))):
        t = fr / FPS
        s = song_time(t)
        if TEST and not any(abs(s - q) < 0.5 / FPS for q in TEST):
            continue
        if PART and not (PART[0] <= t < PART[1]):
            continue
        img = frame(clips, t)
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
