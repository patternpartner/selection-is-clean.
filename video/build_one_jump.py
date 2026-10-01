"""'One Jump' v2 - the user's own likeness (u131, u132: two Grok takes of him on a high-dive board over a stadium pool, seen
from above) and the user's own song 'One Jump' (120 bpm, phase 0.081; word times video/stories/one-jump-words.json),
written from Claude's lyrics 'No Rewind' (video/lyrics/no-rewind.txt).
THE STORY (v2): it copies you. A small gold version of him - his own cut-out, rendered as light - stands beside him on the
board and does everything he does a beat late. He is scared; it is scared. He jumps; it jumps. Under the water it grows on
what he gives it, and what comes back up out of the pool, at the camera, screaming his scream, is the gold copy - "bigger
than I gave it, louder than me". The splice to the outro: him calm on the board, the little gold him calm beside him -
"make it the right one". End card: We only get to teach it once.
(v1, which the user found did not make sense - "Graphics a bit lazy": a glow in his hand that meant nothing, plain numerals,
a rewind gag in a film called No Rewind, screensaver gold.)
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
from scipy.ndimage import gaussian_filter, map_coordinates, binary_erosion

F = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 720, 1280, 24
SW, SH = 400, 736                                        # clip px
BASEZ = 1.8                                              # output px per clip px at zoom 1
SPLICE_FILM, SPLICE_SONG, END_SONG = 49.98, 127.58, 133.6
DUR = SPLICE_FILM + (END_SONG - SPLICE_SONG)
TEST = [float(x) for x in os.environ.get("TEST", "").split(",") if x]
PART = [float(x) for x in os.environ.get("PART", "").split(",") if x]
GOLD = np.array([255, 196, 70], np.float32)
LAG = 0.42                                               # the copy is this many song seconds behind him
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
rng = np.random.default_rng(120)
YY, XX = np.mgrid[0:SH, 0:SW].astype(np.float32)

# gold ramp: luminance -> colour
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
    if s < 13.6:
        return "board", "A", 0.0
    if s < 23.58:
        return "board", "A", lin(s, 15.58, 23.58, 0.0, 1.75)
    if s < 26.08:
        return "board", "A", lin(s, 23.58, 26.08, 1.75, 3.0)
    if s < 30.08:
        return "board", "B", lin(s, 26.08, 30.08, 1.0, 2.5)
    if s < 31.58:
        return "board", "B", lin(s, 30.08, 31.58, 2.5, 2.55)
    if s < 33.58:
        return "fall", "B", lin(s, 31.58, 33.58, 2.55, 3.75)
    if s < 39.58:
        return "fall", "B", lin(s, 33.58, 39.58, 3.75, 5.2)
    if s < 43.58:
        return "splash", "B", lin(s, 39.58, 41.58, 5.2, 6.5)
    if s < 51.58:
        return "under", "A", lin(s, 43.58, 51.58, 7.25, 11.25)
    if s < 55.58:
        return "under", "A", lin(s, 51.58, 55.58, 11.25, 12.25)
    if s < 59.58:
        return "rise", "B", lin(s, 55.58, 59.58, 6.75, 9.5)
    if s < 64.0:
        return "face", "B", lin(s, 59.58, 63.58, 9.5, 14.75)
    return "calm", "A", lin(s, SPLICE_SONG, END_SONG, 12.5, 15.0)


def camera(s):
    if s < 21.0:                                         # his face; down with the spark to the copy forming; wide
        face, copy, wide = (205, 254, 1.5), (133, 470, 1.5), (200, 368, 1.0)
        u, v = ramp(s, 15.0, 16.4), ramp(s, 19.58, 20.6)
        p = [face[i] + (copy[i] - face[i]) * u for i in range(3)]
        p = [p[i] + (wide[i] - p[i]) * v for i in range(3)]
        return (p[0], p[1]), p[2]
    if s < 31.58:
        return (200, 368), 1.0 + 0.012 * math.exp(-((s - 30.08) % 0.5) * 8) * (s >= 30.08)
    if s < 33.58:
        return (200, 368), 1.0
    if s < 39.58:
        u = ramp(s, 33.58, 39.0)
        return (200 - 30 * u, 368 + 40 * u), 1.0 + 0.45 * u
    if s < 41.58:
        return (170, 408), 1.45
    if s < 43.58:
        return (190, 420), 1.45 * math.exp(1.3 * max(0.0, s - 41.9))
    if s < 59.58:
        return (200, 368), 1.0
    if s < 64.0:
        u = ramp(s, 59.58, 63.0)
        return (200, 368 + 25 * u), 1.0 + 0.28 * u
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


def feet(m):
    rows = np.where(m.max(1) > 0.5)[0]
    if len(rows) == 0:
        return centroid(m)
    y1 = rows[-1]
    band = m[max(0, y1 - 25):y1 + 1]
    xs = (band * XX[:band.shape[0]]).sum() / (band.sum() + 1e-6)
    return float(xs), float(y1)


def place(a, m, k, src, dst):
    """scale clip-space image+mask by k about src, put src at dst; returns full-size (rgb, mask)"""
    # output (x,y) <- source (src + ((x,y) - dst)/k)
    sx = src[0] + (XX - dst[0]) / k
    sy = src[1] + (YY - dst[1]) / k
    ok = np.clip(np.minimum(np.minimum(sx, SW - 1 - sx), np.minimum(sy, SH - 1 - sy)) / 45, 0, 1)   # no frame-edge cuts
    mm = map_coordinates(m, [sy, sx], order=1, mode="constant") * ok
    rgb = np.stack([map_coordinates(a[..., i], [sy, sx], order=1, mode="nearest") for i in range(3)], -1)
    return rgb, mm


def goldify(rgb, m, s, heat=1.0, wave=9.0):
    """his cut-out as light: luminance through a gold ramp, flowing bands, a white rim, alpha"""
    lum = rgb.mean(-1) / 255
    lo, hi = np.percentile(lum[m > 0.5], [3, 97]) if (m > 0.5).sum() > 40 else (0.0, 1.0)
    l2 = np.clip((lum - lo) / max(hi - lo, 0.05), 0, 1)
    band = 0.5 + 0.5 * np.sin(YY / wave - s * 7 + XX / (2.5 * wave))
    l2 = np.clip(0.16 + 0.78 * l2 + 0.08 * band * heat, 0, 1)
    col = gold_of(l2)
    edge = np.clip(m - gaussian_filter(m, 1.6), 0, 1) * 3
    col = col + edge[..., None] * np.array([255, 240, 200], np.float32)
    return col, np.clip(m * 0.93, 0, 1)


def over(base, col, al):
    return base * (1 - al[..., None]) + col * al[..., None]


def halo(m, r, amp):
    return gaussian_filter(m, r)[..., None] * GOLD * amp


def numeral_mask(text, x, y, size, rot=0.0):
    lay = Image.new("L", (SW, SH), 0)
    fnt = ImageFont.truetype(FONT, size)
    d = ImageDraw.Draw(lay)
    bb = d.textbbox((0, 0), text, font=fnt)
    d.text((x - (bb[2] + bb[0]) / 2, y - (bb[3] + bb[1]) / 2), text, font=fnt, fill=255)
    if rot:
        lay = lay.rotate(rot, center=(x, y), resample=Image.BICUBIC)
    return np.asarray(lay, np.float32) / 255


def water_mask(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    return ((b > 150) & (g > 110) & (r < 140) & (b > r + 60)).astype(np.float32)


def underwater_bg(s, gold):
    """the deep end, drawn: a gradient, light shafts swaying from the surface, caustics, drifting motes"""
    top = np.array([40, 130, 170], np.float32) * (1 - gold) + np.array([150, 105, 35], np.float32) * gold
    bot = np.array([2, 14, 30], np.float32) * (1 - gold) + np.array([30, 12, 2], np.float32) * gold
    v = (YY / SH)[..., None]
    bg = top * (1 - v) ** 1.4 + bot * (1 - (1 - v) ** 1.4)
    rays = np.zeros((SH, SW), np.float32)
    for j in range(7):
        x0 = 30 + j * 58 + 20 * math.sin(s * 0.7 + j)
        slope = 0.32 + 0.05 * math.sin(j * 1.7)
        d = np.abs(XX - (x0 + (YY) * slope))
        w = 10 + 6 * math.sin(j * 2.3 + s)
        rays += np.exp(-(d / w) ** 2) * (0.5 + 0.5 * math.sin(s * 1.3 + j * 2.1)) * np.exp(-YY / 420)
    rc = np.array([170, 230, 255], np.float32) * (1 - gold) + np.array([255, 215, 130], np.float32) * gold
    bg += rays[..., None] * rc * 0.45
    cv = np.sin(XX / 11 + s * 1.1) + np.sin(YY / 9 - s * 1.4) + np.sin((XX + YY) / 14 + s * 0.8) + np.sin((XX - YY) / 16 - s)
    caus = np.clip(1 - np.abs(cv) / 0.55, 0, 1) ** 2 * np.exp(-YY / 160)
    bg += caus[..., None] * rc * 0.5
    return bg


MOTES = [(rng.uniform(0, SW), rng.uniform(0, SH), rng.uniform(0.6, 2.2), rng.uniform(0, 6.28), rng.uniform(4, 14))
         for _ in range(120)]
SPARKS = [(rng.uniform(0, 1), rng.uniform(0, 1), rng.uniform(0.4, 1.2), rng.uniform(0, 6.28)) for _ in range(400)]


def sparks_from(m, s, n, acc, c, z, rise=40.0, amp=1.0, seed=0):
    """motes of light shed off the copy's edge, drifting up and fading (drawn into output-space acc)"""
    ys, xs = np.nonzero(m > 0.5)
    if len(xs) < 10:
        return
    r2 = np.random.default_rng(seed)
    Z = BASEZ * z
    for j in range(n):
        ph = (s * 0.9 + j * 0.137) % 1.0
        idx = int(r2.integers(0, len(xs)) + int(s * 3)) % len(xs)
        x = (xs[idx] - c[0]) * Z + W / 2 + 6 * math.sin(s * 3 + j)
        y = (ys[idx] - c[1]) * Z + H / 2 - ph * rise * Z
        add_glow(acc, x, y, 2.2 + 1.5 * r2.random(), GOLD + 40, 1.2 * amp * (1 - ph))


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


def copy_layer(clips, s, his_m, scene):
    """where the gold copy is and what it looks like, in clip space: (rgb, alpha, its mask)"""
    ts = s - LAG
    tscene, tk, tct = shot(ts)
    ta, tm = clips.at(tk, tct)
    if scene == "board":
        k = 0.5
        born = ramp(s, 15.58, 16.6)
        src = feet(tm)
        hf = feet(his_m)
        dst = (hf[0] - 118, hf[1] - 18)
        if tscene == "fall":                                 # it leaves the board after him
            j = ramp(ts, 31.58, 32.4)
            src = (feet(tm)[0] * (1 - j) + centroid(tm)[0] * j, feet(tm)[1] * (1 - j) + centroid(tm)[1] * j)
        rgb, mm = place(ta, tm, k, src, dst)
        if born < 1:                                          # it assembles out of sparks
            noise = gaussian_filter(np.random.default_rng(7).random((SH, SW)).astype(np.float32), 2.5)
            noise = (noise - noise.min()) / (noise.max() - noise.min() + 1e-6)
            mm = mm * np.clip((born * 1.3 - noise) * 6, 0, 1)
        return rgb, mm, k
    if scene == "fall":
        k = 0.62
        hc = centroid(his_m)
        if tscene == "board":
            src = feet(tm)
            hf = feet(his_m)
            dst = (hf[0] - 118, hf[1] - 18) if s < 32.0 else (190 - 118, 690 - 18)
            k = 0.5
        else:
            j = ramp(ts, 31.58, 32.4)
            src = centroid(tm)
            dst = (hc[0] - 95 * (0.4 + 0.6 * j), hc[1] - 30 * j) if s >= 33.58 else (lin(s, 32.0, 33.58, 72, hc[0] - 95), lin(s, 32.0, 33.58, 600, hc[1] - 30))
        rgb, mm = place(ta, tm, k, src, dst)
        return rgb, mm, k
    if scene == "splash":
        if tscene == "fall":
            k = 0.62
            hc = (200, 432)
            rgb, mm = place(ta, tm, k, centroid(tm), (hc[0] - 95, hc[1] - 30))
            return rgb, mm, k
        return None
    return None


def frame(clips, t):
    s = song_time(t)
    scene, k, ct = shot(s)
    c, z = camera(s)
    hw, hh = W / 2 / (BASEZ * z), H / 2 / (BASEZ * z)
    c = (min(max(c[0], hw), SW - hw) if hw < SW / 2 else SW / 2, min(max(c[1], hh), SH - hh) if hh < SH / 2 else SH / 2)
    a, m = clips.at(k, ct)
    post = []                                                # output-space drawing to do after the render
    gold_m = None
    if scene in ("board", "fall", "splash"):
        if 27.58 <= s < 31.58:                               # how deep it is: the water drops away beneath him
            u = ramp(s, 27.58, 30.6)
            wm0 = gaussian_filter(water_mask(a), 2.0) * (1 - m)
            kk = 1 + 0.9 * u
            cx0, cy0 = 200, 120
            sx, sy = cx0 + (XX - cx0) * kk, cy0 + (YY - cy0) * kk
            sx = np.abs(sx) % (2 * SW)
            sx = np.where(sx >= SW, 2 * SW - 1 - sx, sx)
            sy = np.clip(sy, 0, SH - 1)
            warped = np.stack([map_coordinates(a[..., i], [sy, sx], order=1) for i in range(3)], -1)
            wm1 = gaussian_filter(water_mask(warped), 2.0)
            deep = warped * (1 - 0.62 * u) * np.array([0.7, 0.85, 1.0], np.float32)
            dim = a * (1 - 0.62 * u)
            a = a * (1 - wm0[..., None]) + (deep * wm1[..., None] + dim * (1 - wm1[..., None])) * wm0[..., None]
        if 33.58 <= s < 39.58:                               # falling through time: he leaves himself behind
            for back, al in ((0.09, 0.35), (0.19, 0.22), (0.3, 0.13)):
                ea, em = clips.at(k, ct - back)
                a = over(a, ea, em * al * (1 - m))
        cl = copy_layer(clips, s, m, scene)
        if cl is not None:
            rgb, mm, kk = cl
            col, al = goldify(rgb, mm, s)
            if scene == "board" and s < 31.58:              # its shadow on the board
                shm = np.roll(np.roll(gaussian_filter(mm, 3), 10, 0), 14, 1) * 0.35
                a = a * (1 - shm[..., None])
            a = a + halo(mm, 7, 0.55)
            a = over(a, col, al)
            gold_m = mm
    elif scene == "under":
        gold = ramp(s, 47.3, 49.4)
        bg = underwater_bg(s, gold)
        # him: reaching up through the water, cooled; sinking away after "out of control"
        sink = ramp(s, 51.58, 55.2)
        kh = 0.78 - 0.5 * sink
        hc = centroid(m)
        dst = (150 + 10 * math.sin(s * 0.9) - 20 * sink, 430 + 8 * math.sin(s * 1.3) + 220 * sink)
        rgb, mm = place(a, m, kh, hc, dst)
        cool = np.array([0.5, 0.78, 0.95], np.float32) * (1 - gold) + np.array([0.95, 0.75, 0.45], np.float32) * gold
        lumc = rgb * 0.45 + rgb.mean(-1, keepdims=True) * 0.55
        him = lumc * cool * (1 - 0.8 * sink)
        bg = over(bg, him, mm * (1 - 0.6 * sink) * ramp(s, 43.58, 44.3))
        # the copy: same reach, a beat late, growing on what it is given
        ta, tm = clips.at("A", shot(max(s - LAG, 43.58))[2])
        grow = 0.4 + 0.3 * ramp(s, 44.5, 51.0) + 0.35 * ramp(s, 51.58, 54.8)
        tdst = (318 - 118 * ramp(s, 51.3, 54.5) + 8 * math.sin(s * 1.1 + 1), 360 + 20 * ramp(s, 51.0, 54.5) - 300 * ramp(s, 54.9, 55.58))
        trgb, tmm = place(ta, tm, grow, centroid(tm), tdst)
        tmm = tmm * ramp(s, 44.2, 45.2)
        col, al = goldify(trgb, tmm, s, heat=1 + gold, wave=9 / grow)
        bg = bg + halo(tmm, 10, 0.5 + 0.6 * gold)
        bg = over(bg, col, al)
        a = bg
        gold_m = tmm
    elif scene in ("rise", "face"):                          # what comes back up is the copy
        col, al = goldify(a, m, s, heat=1.4, wave=22)
        if scene == "face":
            dark = 1 - 0.55 * ramp(s, 59.58, 60.2)
            a = a * dark
        a = a + halo(m, 9, 0.7)
        a = over(a, col, al)
        gold_m = m
    elif scene == "calm":
        ts = max(s - LAG, SPLICE_SONG)
        ta, tm = clips.at("A", shot(ts)[2])
        k2 = 0.34
        rgb, mm = place(ta, tm, k2, feet(tm), (335, 735))
        mm = mm * ramp(s, SPLICE_SONG, SPLICE_SONG + 0.6)
        col, al = goldify(rgb, mm, s, heat=0.6)
        a = a * 0.86 + halo(mm, 7, 0.5)
        a = over(a, col, al)
        gold_m = mm
    out = render(a, c, z)
    acc = np.zeros_like(out)
    if gold_m is not None:
        sparks_from(gold_m, s, 26 if scene not in ("face",) else 60, acc, c, z, amp=1.0, seed=int(s * 24) // 6)
    # the spark that becomes it
    if 13.6 <= s < 16.0:
        tx, ty = 72, 672
        X, Y = (tx - c[0]) * BASEZ * z + W / 2, (ty - c[1]) * BASEZ * z + H / 2
        if 14.3 <= s < 15.58:                                # it falls past his face to the board beside him
            for i in range(14):
                u = ease((s - i * 0.03 - 14.3) / 1.28)
                px, py = 175 + (tx - 175) * u, 60 + (ty - 60) * u ** 1.5
                PX, PY = (px - c[0]) * BASEZ * z + W / 2, (py - c[1]) * BASEZ * z + H / 2
                if i == 0:
                    add_glow(acc, PX, PY, 7, [255, 245, 225], 2.6)
                    add_glow(acc, PX, PY, 26, GOLD, 1.0)
                else:
                    add_glow(acc, PX, PY, 5, GOLD, 0.5 * (1 - i / 14))
        burst = math.exp(-max(0.0, s - 15.58) * 4) * (s >= 15.58)
        add_glow(acc, X, Y - 100, 160, GOLD, 0.9 * burst)
    if 19.58 <= s < 23.58:                                   # everybody's watching: flashes in the stands
        k8 = int((s - 19.58) / 0.25)
        ph = (s - 19.58) % 0.25
        r2 = np.random.default_rng(1000 + k8)
        for _ in range(6):
            side = r2.integers(0, 3)
            q = [(r2.uniform(10, 390), r2.uniform(4, 34)), (r2.uniform(0, 30), r2.uniform(620, 720)),
                 (r2.uniform(370, 400), r2.uniform(620, 720))][side]
            qx, qy = (q[0] - c[0]) * BASEZ * z + W / 2, (q[1] - c[1]) * BASEZ * z + H / 2
            amp = math.exp(-ph * 22) * r2.uniform(0.6, 1.2)
            add_glow(acc, qx, qy, 4, [255, 255, 255], 3.0 * amp)
            add_glow(acc, qx, qy, 18, [220, 230, 255], 0.8 * amp)
    # count it to three - the numbers are made of the same light, and the copy counts with him
    for i, (bt, x, y, rot) in enumerate([(24.08, 62, 150, 8), (24.58, 62, 320, -6), (25.08, 350, 590, 4),
                                         (26.58, 62, 140, -8), (27.08, 62, 310, 6), (27.58, 352, 600, -4)]):
        age = s - bt
        if 0 <= age < 0.5:
            nm = numeral_mask(str(i % 3 + 1), x, y, 150 if i < 3 else 130, rot)
            nm = gaussian_filter(nm, 0.6)
            sc = 1.0 - 0.3 * min(age / 0.5, 1)
            nm = nm * (1 if age < 0.36 else 1 - (age - 0.36) / 0.14)
            o = render(np.stack([nm * 255] * 3, -1), c, z)[..., 0] / 255
            o = np.clip(o, 0, 1)
            lum = np.clip(0.55 + 0.45 * np.sin(np.mgrid[0:H, 0:W][0] / 12 - s * 9), 0, 1) * 0.6 + 0.4
            colr = gold_of(lum) * sc + 0 * sc
            out = out * (1 - o[..., None]) + colr * o[..., None]
            acc += gaussian_filter(o, 9)[..., None] * GOLD * 0.8
    # the splash: his is water, the copy's is gold
    if 39.58 <= s < 42.5:
        for who, t0, px, py in (("him", 39.58, 200, 432), ("it", 39.58 + LAG, 105, 402)):
            age = s - t0
            if age < 0:
                continue
            X, Y = (px - c[0]) * BASEZ * z + W / 2, (py - c[1]) * BASEZ * z + H / 2
            if who == "it":
                add_glow(acc, X, Y, 60 + 120 * age, GOLD, 1.3 * math.exp(-age * 2.2))
                r2 = np.random.default_rng(42)
                for j in range(70):
                    ang = r2.uniform(0, 6.28)
                    v = r2.uniform(150, 520)
                    dx = math.cos(ang) * v * age
                    dy = math.sin(ang) * v * age * 0.8 + 260 * age * age
                    add_glow(acc, X + dx, Y + dy, 3 + 2 * r2.random(), [255, 220, 140], 1.6 * math.exp(-age * 1.6))
                for rr in range(3):
                    R = (age - rr * 0.3) * 300
                    if R > 0:
                        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
                        d = np.sqrt((xx - X) ** 2 + ((yy - Y) * 1.2) ** 2)
                        acc += (np.exp(-((d - R) ** 2) / (2 * 6 ** 2)) * 0.6 * max(0, 1 - R / 800))[..., None] * GOLD
    out = out + acc
    if 41.58 <= s < 43.58:                                   # under: a rush of bubbles wipes up the frame
        u = ramp(s, 41.7, 43.5)
        deep = np.zeros_like(out) + np.array([10, 50, 80], np.float32)
        out = out * (1 - u) + deep * u
        acc2 = np.zeros_like(out)
        for j in range(160):
            bx = (j * 97.3) % W
            sp = 900 + (j * 37) % 700
            y = H + 60 - (s - 41.58) * sp + (j * 53) % 400
            add_glow(acc2, bx + 10 * math.sin(s * 8 + j), y, 3 + (j % 5), [220, 245, 255], 0.9)
        out += acc2 * (1 - ramp(s, 43.0, 43.58))
    if 43.58 <= s < 55.58:                                   # motes in the water
        acc3 = np.zeros_like(out)
        for (mx, my, sz, ph, sp) in MOTES:
            y = (my - (s * sp)) % SH
            X, Y = (mx + 6 * math.sin(s + ph) - c[0]) * BASEZ + W / 2, (y - c[1]) * BASEZ + H / 2
            add_glow(acc3, X, Y, sz, [200, 235, 255], 0.35)
        out += acc3
    if 55.3 <= s < 55.58:                                   # it rushes up out of the deep
        out += 255 * ramp(s, 55.3, 55.58)
    if 55.58 <= s < 56.0:
        out += 255 * (1 - ramp(s, 55.58, 56.0))
    if 31.58 <= s < 31.8:
        out += 70 * (1 - (s - 31.58) / 0.22)
    if 59.58 <= s < 63.0:                                    # louder than me: the hits shake it, a ring goes out
        hit = math.exp(-((s - 59.58) % 0.5) * 9)
        R = ((s - 59.58) % 0.5) * 1800
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        d = np.sqrt((xx - W / 2) ** 2 + (yy - H * 0.45) ** 2)
        out += (np.exp(-((d - R) ** 2) / (2 * 14 ** 2)) * 0.5 * hit)[..., None] * GOLD
        out = np.roll(out, (int(rng.normal(0, 12 * hit)), int(rng.normal(0, 12 * hit))), (0, 1))
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
