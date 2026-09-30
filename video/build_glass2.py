"""'Glass' v2 - pushed. (Gravity and Glass 133.0-159.1 + the end line, ~30 s.)
The user liked v1 and asked whether Claude had really pushed itself; it had not. This is the pushed one:
  - real glass: a dome that bends what is behind it (cylindrical refraction), Fresnel brightening at its edges, the
    lamp caught in it, a shadow and a warm caustic thrown on the table;
  - real condensation: a haze plus ~16,000 beads that each catch the lamp; the breath that makes it follows the
    singer's actual voice (demucs vocal stem, per frame);
  - in the song's eight seconds of silence, a small palm presses flat against the INSIDE and leaves its print in the
    fog; then a fingertip wipes a window - one squeak - and water runs from it;
  - inside is not a small thing: through the window, a plain of the living universe (three real recorded worlds tiled
    across a perspective ground) stretching to a horizon. The camera flies in, and then back out to a small jar.
    python3 video/build_glass2.py   (writes out/drawn/glass2.mp4 and out/glass2-fx.wav)
"""
import json
import math
import os
import subprocess

import imageio_ffmpeg
import numpy as np
from scipy.ndimage import gaussian_filter
from PIL import Image, ImageDraw, ImageFilter

F = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS, SS = 704, 1280, 24, 2
W2, H2 = W * SS, H * SS
S0, S1 = 133.0, 159.1
DUR = S1 - S0
QUIET, SILENT, TURN, TURN_END = 138.5, 145.0, 153.6, 157.3
PALM_IN, PALM_ON, PALM_OFF, PALM_GONE = 145.5, 146.4, 148.3, 148.9
WIPE0, WIPE1 = 149.3, 152.4
DIVE0, DIVE1 = 153.6, 155.3       # into the window
GLIDE0, GLIDE1 = 155.3, 157.3     # out over the plain
BACK0, BACK1 = 157.3, 158.9       # and back out to the jar
# the jar (1x coordinates)
JX0, JX1, JTOP, JBOT = 150, 554, 330, 1010
JR = (JX1 - JX0) / 2
JCX = (JX0 + JX1) / 2
WIN = (452.0, 628.0)              # where the window is wiped: at the horizon, so it opens on a line of light
PALM = (300.0, 800.0)             # where its palm presses
LAMP = np.array([255, 214, 160], np.float32)
rng = np.random.default_rng(17)
PART = [float(x) for x in os.environ.get("PART", "").split(",") if x]   # film seconds [a, b): render only this stretch
TEST = [float(x) for x in os.environ.get("TEST", "").split(",") if x]   # song times: render only these, as PNGs


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def ramp(s, a, b):
    return ease((s - a) / (b - a))


# ------------------------------------------------------------------ the plain inside: perspective ground of worlds
RW, RH = W, H
HORIZON = 0.40 * RH
FOC = 0.9 * RH
CAMH = 520.0
SRC = [("out/your-turn/world.mp4", 60.0), ("out/cold-twin/world.mp4", 40.0), ("out/observer/s3/tape.mp4", 120.0)]


class Reader:
    def __init__(self, path, start):
        self.p = subprocess.Popen([F, "-loglevel", "error", "-ss", str(start), "-i", path, "-vf", "fps=24", "-f", "rawvideo",
                                   "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
        self.last = np.zeros((H, W, 3), np.uint8)

    def next(self):
        raw = self.p.stdout.read(W * H * 3)
        if len(raw) == W * H * 3:
            self.last = np.frombuffer(raw, np.uint8).reshape(H, W, 3)
        return self.last


def plain(tex, small, s, ax, ay, sx, sy, zoff, out_w, out_h):
    """render the inside: screen (x,y) -> base-view coords -> ground plane -> tiled living worlds"""
    ys, xs = np.mgrid[0:out_h, 0:out_w].astype(np.float32)
    bx = (xs - sx) / s + ax
    by = (ys - sy) / s + ay
    dy = by - HORIZON
    ground = dy > 0.5
    z = np.where(ground, FOC * CAMH / np.maximum(dy, 0.5), 1e9)
    X = (bx - RW / 2) * z / FOC
    Z = z + zoff
    TW, TH = W, H
    ti = np.floor(X / TW).astype(np.int64)
    tj = np.floor(Z / TH).astype(np.int64)
    u = X - ti * TW
    v = Z - tj * TH
    flipx = (ti & 1) == 1
    flipy = (tj & 1) == 1
    u = np.where(flipx, TW - 1 - u, u)
    v = np.where(flipy, TH - 1 - v, v)
    which = ((ti * 7 + tj * 3) % 3 + 3) % 3
    zz = np.minimum(z, 1e6)
    near = tex[which, np.clip(v, 0, TH - 1).astype(np.int64), np.clip(u, 0, TW - 1).astype(np.int64)].astype(np.float32)
    far = small[which, np.clip(v / 4, 0, TH / 4 - 1).astype(np.int64), np.clip(u / 4, 0, TW / 4 - 1).astype(np.int64)].astype(np.float32)
    k = np.clip((zz - 1200) / 3000, 0, 1)[..., None]
    col = (near * (1 - k) + far * k * 1.6) * 1.7
    haze = (1 - np.exp(-zz / 14000))[..., None]
    glow = np.array([90, 140, 170], np.float32)
    col = col * (1 - haze) + glow * haze * 0.9
    # sky: dark, a glow along the horizon, a few far lights
    hy = np.clip(1 - (HORIZON - by) / (RH * 0.35), 0, 1)[..., None]
    sky = np.array([6, 7, 14], np.float32) + np.array([70, 100, 130], np.float32) * hy ** 4
    out = np.where(ground[..., None], col, sky)
    return out


# ------------------------------------------------------------------ static pieces
def dome_mask(scale):
    m = Image.new("L", (W * scale * 2, H * scale * 2), 0)
    d = ImageDraw.Draw(m)
    k = scale * 2
    d.rectangle([JX0 * k, (JTOP + JR) * k, JX1 * k, JBOT * k], fill=255)
    d.ellipse([JX0 * k, JTOP * k, JX1 * k, (JTOP + 2 * JR) * k], fill=255)
    return np.asarray(m.resize((W * scale, H * scale), Image.LANCZOS), np.float32) / 255


def room():
    ys, xs = np.mgrid[0:H2, 0:W2].astype(np.float32) / SS
    lamp = np.exp(-(((xs + 160) / 760) ** 2 + ((ys - 260) / 680) ** 2))
    wall = np.array([9, 8, 11], np.float32) + lamp[..., None] * np.array([78, 56, 36], np.float32)
    grain = np.asarray(Image.fromarray((rng.random((H2 // 6, W2 // 6)) * 255).astype(np.uint8)).resize((W2, H2), Image.BICUBIC),
                       np.float32)[..., None] / 255
    wall *= 0.92 + 0.12 * grain
    tabl = ys > 1000
    fall = np.clip(1 - (ys - 1000) / 420, 0, 1)
    wood_line = 0.5 + 0.5 * np.sin(xs * 0.021 + np.sin(xs * 0.004 + ys * 0.03) * 3 + ys * 0.002)
    wood = (np.array([34, 22, 15], np.float32) * (0.75 + 0.35 * wood_line[..., None])) * (0.35 + 0.9 * fall[..., None])
    wood += lamp[..., None] * np.array([60, 40, 24], np.float32) * fall[..., None]
    a = np.where(tabl[..., None], wood, wall)
    # the jar's shadow, thrown right by the lamp, and a warm caustic inside it
    sh = np.zeros((H2, W2), np.float32)
    im = Image.fromarray(sh, "F")
    d = ImageDraw.Draw(im)
    d.polygon([(JX0 * SS, 1030 * SS), (JX1 * SS, 1030 * SS), (700 * SS, 1100 * SS), (690 * SS, 1190 * SS), (360 * SS, 1120 * SS)], fill=1.0)
    sh = gaussian_filter(np.asarray(im, np.float32), 28 * SS)
    a *= (1 - 0.55 * sh[..., None])
    cau = np.exp(-(((xs - 560) / 70) ** 2 + ((ys - 1085) / 16) ** 2))
    a += cau[..., None] * LAMP * 0.45
    img = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(img)
    k = SS
    d.ellipse([(JX0 - 28) * k, 988 * k, (JX1 + 28) * k, 1064 * k], fill=(38, 25, 17))
    d.ellipse([(JX0 - 28) * k, 982 * k, (JX1 + 28) * k, 1040 * k], fill=(78, 52, 33))
    d.ellipse([(JX0 - 9) * k, 996 * k, (JX1 + 9) * k, 1026 * k], fill=(22, 15, 12))
    d.arc([(JX0 - 28) * k, 982 * k, (JX1 + 28) * k, 1040 * k], 190, 300, fill=(150, 108, 70), width=2 * k)
    return np.asarray(img, np.float32)


def glass_optics():
    """additive highlights and an edge tint, at 2x"""
    ys, xs = np.mgrid[0:H2, 0:W2].astype(np.float32) / SS
    xn = np.clip((xs - JCX) / JR, -1, 1)
    fres = np.abs(xn) ** 5
    add = fres[..., None] * np.array([70, 62, 52], np.float32)
    # the lamp's reflection: a soft warm window upper left, and a long streak
    add += np.exp(-(((xs - (JX0 + 70)) / 26) ** 2 + ((ys - (JTOP + 150)) / 60) ** 2))[..., None] * LAMP * 0.55
    streak = np.exp(-((xs - (JX0 + 40)) / 4.5) ** 2) * np.clip((ys - (JTOP + 170)) / 60, 0, 1) * np.clip((JBOT - 50 - ys) / 80, 0, 1)
    add += streak[..., None] * LAMP * 0.55
    streak2 = np.exp(-((xs - (JX1 - 34)) / 9) ** 2) * np.clip((ys - (JTOP + 230)) / 90, 0, 1) * np.clip((JBOT - 120 - ys) / 90, 0, 1)
    add += streak2[..., None] * np.array([120, 130, 140], np.float32) * 0.25
    # the top of the dome catching light
    r = np.sqrt((xs - JCX) ** 2 + (ys - (JTOP + JR)) ** 2)
    top = np.exp(-((r - (JR - 22)) / 5) ** 2) * (ys < JTOP + JR) * np.clip((JCX - xs + 60) / 160, 0, 1)
    add += top[..., None] * LAMP * 0.5
    rim = np.exp(-((r - JR + 2) / 2.2) ** 2) * (ys < JTOP + JR) + (np.exp(-((xs - JX0 - 1.5) / 2) ** 2) + np.exp(-((xs - JX1 + 1.5) / 2) ** 2)) * (ys >= JTOP + JR)
    add += rim[..., None] * np.array([110, 104, 92], np.float32) * 0.9
    tint = 1 - fres[..., None] * np.array([0.25, 0.12, 0.2], np.float32)
    return add, tint


def beads(mask2):
    """~16,000 condensation beads inside the dome, as an id map with per-pixel highlight and shade (2x)"""
    idm = Image.new("I", (W2, H2), -1)
    d = ImageDraw.Draw(idm)
    pts = []
    n = 0
    for (cnt, r0, r1) in ((15000, 1.1, 2.6), (1500, 3.0, 5.5), (260, 5.5, 9.0)):
        for _ in range(cnt):
            x = rng.uniform(JX0, JX1) * SS
            y = rng.uniform(JTOP, JBOT) * SS
            if mask2[int(min(H2 - 1, y)), int(min(W2 - 1, x))] < 0.9:
                continue
            r = rng.uniform(r0, r1) * (1 + 0.5 * (y / SS - JTOP) / (JBOT - JTOP))   # heavier water lower down
            d.ellipse([x - r, y - r, x + r, y + r], fill=n)
            pts.append((x, y, r))
            n += 1
    ids = np.asarray(idm, np.int32)
    P = np.array(pts, np.float32)
    ys, xs = np.mgrid[0:H2, 0:W2].astype(np.float32)
    has = ids >= 0
    idc = np.where(has, ids, 0)
    nx = (xs - P[idc, 0]) / P[idc, 2]
    ny = (ys - P[idc, 1]) / P[idc, 2]
    hl = np.exp(-(((nx + 0.38) ** 2 + (ny + 0.42) ** 2) / 0.05)) * has
    shade = np.clip(0.55 * nx + 0.65 * ny, 0, 1) * np.clip(np.sqrt(nx * nx + ny * ny), 0, 1) * has
    thr = rng.uniform(0.12, 0.75, len(P)).astype(np.float32)
    return ids, P, hl.astype(np.float32), shade.astype(np.float32), thr


def hand(scale, pressed):
    """a small hand (silhouette) or just the pads of it that touch the glass, at PALM, drawn at `scale`"""
    im = Image.new("L", (W * scale, H * scale), 0)
    d = ImageDraw.Draw(im)
    k = scale
    cx, cy = PALM
    rot = math.radians(-8)

    def P(x, y):
        return (cx + x * math.cos(rot) - y * math.sin(rot)) * k, (cy + x * math.sin(rot) + y * math.cos(rot)) * k

    def capsule(x0, y0, ang, length, wdt, fill):
        a = math.radians(ang)
        x1, y1 = x0 + length * math.sin(a), y0 - length * math.cos(a)
        d.line([P(x0, y0), P(x1, y1)], fill=fill, width=int(wdt * k))
        for (x, y) in ((x0, y0), (x1, y1)):
            px, py = P(x, y)
            d.ellipse([px - wdt * k / 2, py - wdt * k / 2, px + wdt * k / 2, py + wdt * k / 2], fill=fill)
        return x1, y1

    fingers = [(-22, -26, -13, 34), (-8, -31, -4, 42), (7, -31, 4, 40), (21, -26, 12, 32)]
    if not pressed:
        px, py = P(0, 0)
        d.ellipse([px - 32 * k, py - 34 * k, px + 32 * k, py + 36 * k], fill=255)
        for (x0, y0, ang, ln) in fingers:
            capsule(x0, y0, ang, ln, 12.5, 255)
        capsule(-28, 4, -62, 28, 13, 255)
    else:
        px, py = P(0, 12)
        d.ellipse([px - 24 * k, py - 17 * k, px + 24 * k, py + 17 * k], fill=255)      # the heel of the palm
        px, py = P(-14, -14)
        d.ellipse([px - 11 * k, py - 9 * k, px + 11 * k, py + 9 * k], fill=190)
        px, py = P(14, -14)
        d.ellipse([px - 11 * k, py - 9 * k, px + 11 * k, py + 9 * k], fill=190)
        for (x0, y0, ang, ln) in fingers:
            a = math.radians(ang)
            tx, ty = x0 + (ln - 3) * math.sin(a), y0 - (ln - 3) * math.cos(a)
            px, py = P(tx, ty)
            d.ellipse([px - 6.5 * k, py - 7.5 * k, px + 6.5 * k, py + 7.5 * k], fill=255)   # fingertip pads
            mx, my = x0 + ln * 0.45 * math.sin(a), y0 - ln * 0.45 * math.cos(a)
            px, py = P(mx, my)
            d.ellipse([px - 5 * k, py - 5 * k, px + 5 * k, py + 5 * k], fill=150)
        a = math.radians(-62)
        tx, ty = -28 + 24 * math.sin(a), 4 - 24 * math.cos(a)
        px, py = P(tx, ty)
        d.ellipse([px - 7 * k, py - 7 * k, px + 7 * k, py + 7 * k], fill=230)
    return np.asarray(im.filter(ImageFilter.GaussianBlur(0.8 * k)), np.float32) / 255


def gauss(A, cx, cy, r, amt, mode="mul"):
    x0, x1 = int(max(0, cx - 3 * r)), int(min(A.shape[1], cx + 3 * r + 1))
    y0, y1 = int(max(0, cy - 3 * r)), int(min(A.shape[0], cy + 3 * r + 1))
    if x1 <= x0 or y1 <= y0:
        return
    yy, xx = np.mgrid[y0:y1, x0:x1]
    g = np.exp(-((xx - cx) ** 2 + (yy - cy) ** 2) / (2 * r * r)).astype(np.float32)
    if mode == "mul":
        A[y0:y1, x0:x1] *= 1 - np.clip(g * amt, 0, 1)
    else:
        A[y0:y1, x0:x1] += g * amt * (1 - A[y0:y1, x0:x1])


# ------------------------------------------------------------------ sound: one squeak, one soft press
def fx():
    SR = 44100
    out = np.zeros(int((DUR + 4) * SR))
    # the palm meeting the glass: a soft low knock
    t = np.arange(int(0.18 * SR)) / SR
    knock = (np.sin(2 * np.pi * 180 * t) * 0.6 + np.sin(2 * np.pi * 410 * t) * 0.25) * np.exp(-t * 38)
    i = int((PALM_ON - S0) * SR)
    out[i:i + len(knock)] += knock * 0.12
    # the fingertip on wet glass: stick-slip, a wobbling tone and its harmonics
    for (t0, dur, amp, f0) in ((WIPE0 + 0.05, 0.34, 0.16, 1240), (WIPE0 + 1.35, 0.22, 0.05, 1420)):
        t = np.arange(int(dur * SR)) / SR
        wob = np.cumsum(rng.normal(0, 1, len(t))) / SR * 40
        f = f0 * (1 + 0.18 * t / dur) + 45 * np.sin(2 * np.pi * 31 * t) + wob * 60
        ph = 2 * np.pi * np.cumsum(f) / SR
        env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 0.6 * (0.7 + 0.3 * (rng.random(len(t)) > 0.3))
        s = (np.sin(ph) + 0.45 * np.sin(2 * ph) + 0.2 * np.sin(3 * ph)) * env
        i = int((t0 - S0) * SR)
        out[i:i + len(s)] += s * amp
    raw = (np.clip(out, -1, 1) * 32767).astype(np.int16).tobytes()
    subprocess.run([F, "-loglevel", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "-", "out/glass2-fx.wav"],
                   input=raw, check=True)


# ------------------------------------------------------------------ the film
def main():
    if not PART or PART[0] == 0:
        fx()
    rms = json.load(open("video/stories/gravity-and-glass-vocal-rms.json"))["rms"]
    mask1 = dome_mask(1)
    mask2 = dome_mask(SS)
    base = room()
    add, tint = glass_optics()
    ids, P, hl, shade, thr = beads(mask2)
    has = ids >= 0
    idc = np.where(has, ids, 0)
    hand_sil = hand(1, False)
    hand_pad = hand(1, True)
    print("beads", len(P), flush=True)
    # the dome's box and its refraction (a cylinder squeezes what is near its edges)
    bx0, bx1, by0, by1 = JX0 * SS, JX1 * SS, JTOP * SS, JBOT * SS
    bw, bh = bx1 - bx0, by1 - by0
    xn = (np.arange(bw) - bw / 2) / (bw / 2)
    src_x = (np.arcsin(np.clip(xn, -0.999, 0.999)) / (np.pi / 2) * 0.55 + xn * 0.45) * (bw / 2) + bw / 2
    src_x = np.clip(src_x, 0, bw - 1).astype(np.int64)
    m2 = mask2[by0:by1, bx0:bx1][..., None]
    fog = (0.5 + 0.2 * np.asarray(Image.fromarray((rng.random((H // 10, W // 10)) * 255).astype(np.uint8))
                                  .resize((W, H), Image.BICUBIC).filter(ImageFilter.GaussianBlur(5)), np.float32) / 255) * mask1
    drips = []
    readers = [Reader(p, s) for p, s in SRC]
    out = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                            str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "15", "-preset", "slow", "-pix_fmt", "yuv420p",
                            os.environ.get("VOUT", "out/drawn/glass2.mp4")], stdin=subprocess.PIPE)
    zoff = 0.0
    tip = None
    # where the window centre lands in the inside's base view
    wx_in = (WIN[0] - JX0) / (JX1 - JX0) * RW
    wy_in = (WIN[1] - JTOP) / (JBOT - JTOP) * RH
    for n in range(int(DUR * FPS)):
        t = n / FPS
        s = S0 + t
        frames = [r.next() for r in readers]
        tex = np.stack(frames)
        small = np.stack([np.asarray(Image.fromarray(f_).resize((W // 4, H // 4), Image.BOX)) for f_ in frames])
        if s >= GLIDE0:
            zoff += 55.0 * ramp(s, GLIDE0, GLIDE0 + 0.8) * (1 - ramp(s, GLIDE1 - 0.4, GLIDE1 + 0.3))
        # ---------------- fog: breath, thinning, the palm's print, the fingertip, the drips
        v = rms[min(len(rms) - 1, int(s * FPS))]
        if s < QUIET and v > 0.02:
            for _ in range(2):
                gauss(fog, JCX + rng.normal(0, 95), 650 + rng.normal(0, 160), 60 + rng.random() * 70, v * 0.7, "add")
        if s >= QUIET:
            fog *= 1 - 0.0007
        if PALM_ON <= s < PALM_ON + 0.2:
            fog *= 1 - np.clip(hand_sil * 0.95 + hand_pad * 0.05, 0, 1) * ramp(s, PALM_ON, PALM_ON + 0.15)
        if WIPE0 <= s < WIPE1:
            u = (s - WIPE0) / (WIPE1 - WIPE0)
            for k in range(4):
                uu = u + k / (4 * FPS * (WIPE1 - WIPE0))
                ang = uu * 2 * math.pi * 3.1 - 0.6
                rad = 5 + 52 * ease(uu * 1.08)
                tip = (WIN[0] + rad * math.cos(ang), WIN[1] + rad * math.sin(ang) * 0.93)
                gauss(fog, tip[0], tip[1], 12, 1.7)
            if rng.random() < 0.07 and u > 0.3:
                a = rng.uniform(0.2, 0.8) * math.pi
                drips.append([WIN[0] + 58 * math.cos(a), WIN[1] + 54 * math.sin(a), 0.7 + rng.random() * 1.3])
            if rng.random() < 0.012:
                drips.append([PALM[0] + rng.uniform(-20, 20), PALM[1] + 26, 0.4 + rng.random() * 0.6])
        else:
            tip = None
        for dr in drips:
            if dr[1] < JBOT - 16:
                dr[1] += dr[2]
                dr[2] = max(0.12, dr[2] * 0.993)
                gauss(fog, dr[0], dr[1], 1.3, 1.1)
        np.clip(fog, 0, 1, out=fog)
        if TEST and not any(abs(s - q) < 0.5 / FPS for q in TEST):
            continue
        if PART and not (PART[0] <= t < PART[1]):
            continue
        # ---------------- the inside, as seen through the glass (base view, squeezed at the edges)
        inner_full = plain(tex, small, 1.0, RW / 2, RH / 2, RW / 2, RH / 2, zoff, RW, RH)
        inner = np.asarray(Image.fromarray(np.clip(inner_full, 0, 255).astype(np.uint8)).resize((bw, bh), Image.LANCZOS), np.float32)
        inner = inner[:, src_x]
        # the hand, from inside: a dark shape rim-lit by the world behind it, sharp where it touches
        hand_a = ramp(s, PALM_IN, PALM_ON) * (1 - ramp(s, PALM_OFF, PALM_GONE))
        if hand_a > 0:
            blur_r = 1.5 + 14 * (1 - ramp(s, PALM_IN, PALM_ON)) + 12 * ramp(s, PALM_OFF, PALM_GONE)
            hs = np.asarray(Image.fromarray((hand_sil * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(blur_r))
                            .resize((W2, H2), Image.BILINEAR), np.float32)[by0:by1, bx0:bx1] / 255
            er = np.asarray(Image.fromarray((hand_sil * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(5))
                            .filter(ImageFilter.GaussianBlur(blur_r)).resize((W2, H2), Image.BILINEAR), np.float32)[by0:by1, bx0:bx1] / 255
            rim = np.clip(hs - er, 0, 1)
            inner = inner * (1 - 0.9 * hand_a * hs[..., None]) + rim[..., None] * np.array([90, 210, 200], np.float32) * hand_a * 0.8
        fog2 = np.asarray(Image.fromarray(fog, "F").resize((W2, H2), Image.BILINEAR), np.float32)[by0:by1, bx0:bx1]
        haze = np.clip(fog2 * 0.9, 0, 0.88)[..., None]
        blurred = np.asarray(Image.fromarray(inner.astype(np.uint8)).filter(ImageFilter.GaussianBlur(10 * SS)), np.float32)
        seen = inner * (1 - np.clip(haze * 2.5, 0, 1)) + blurred * np.clip(haze * 2.5, 0, 1)
        lampx = np.linspace(1.08, 0.6, bw)[None, :, None]
        lampy = np.linspace(1.05, 0.8, bh)[:, None, None]
        hazecol = np.array([176, 170, 160], np.float32) * lampx * lampy
        if hand_a > 0:
            hazecol = hazecol * (1 - 0.5 * hand_a * hs[..., None])
        g = seen * 0.9 * (1 - haze) + hazecol * haze
        # beads: each one visible where the fog is thick enough for it
        fb = fog[np.clip((P[:, 1] / SS).astype(int), 0, H - 1), np.clip((P[:, 0] / SS).astype(int), 0, W - 1)]
        vis = np.clip((fb - thr) / 0.12, 0, 1)
        vm = (vis[idc] * has)[by0:by1, bx0:bx1][..., None]
        g = g * (1 - 0.45 * shade[by0:by1, bx0:bx1][..., None] * vm) + hl[by0:by1, bx0:bx1][..., None] * vm * LAMP * 0.95
        # the wet edge the wiping leaves: a thin bright lip on the lamp side
        fsm = np.asarray(Image.fromarray(gaussian_filter(fog, 1.6), "F").resize((W2, H2), Image.BILINEAR),
                         np.float32)[by0:by1, bx0:bx1]
        gy, gx = np.gradient(fsm)
        lip = np.clip((gx * 0.6 + gy * 0.8) * 9, 0, 1)[..., None]
        g += lip * LAMP * 0.35
        if tip is not None:   # the fingertip itself, pressed to the glass: a dark soft pad, sharp
            pad = np.zeros((bh, bw), np.float32)
            yy, xx = np.mgrid[0:bh, 0:bw]
            pad = np.exp(-(((xx - (tip[0] * SS - bx0)) ** 2) / (2 * (9 * SS) ** 2) + ((yy - (tip[1] * SS - by0)) ** 2) / (2 * (11 * SS) ** 2)))
            g = g * (1 - 0.8 * pad[..., None])
        for dr in drips:      # the head of each run of water catches the lamp
            hx, hy = dr[0] * SS - bx0, dr[1] * SS - by0
            x0_, y0_ = int(hx - 6), int(hy - 6)
            if 0 <= x0_ < bw - 12 and 0 <= y0_ < bh - 12:
                yy, xx = np.mgrid[0:12, 0:12]
                bead = np.exp(-(((xx - 5.0) ** 2 + (yy - 5.5) ** 2) / 1.6))[..., None]
                g[y0_:y0_ + 12, x0_:x0_ + 12] += bead * LAMP * 0.8
        g = g * tint[by0:by1, bx0:bx1] + add[by0:by1, bx0:bx1]
        a = base.copy()
        a[by0:by1, bx0:bx1] = a[by0:by1, bx0:bx1] * (1 - m2) + g * m2
        # ---------------- the camera
        lean = 1.0 + 0.1 * ramp(s, S0, TURN)
        dive = ramp(s, DIVE0, DIVE1)
        back = ramp(s, BACK0, BACK1)
        zc = lean * (1 + 7.5 * dive ** 2.2) if s < BACK0 else lean * (1 + 7.5 * (1 - back) ** 2.2)
        mix = dive if s < BACK0 else 1 - back
        cx = W / 2 + (WIN[0] - W / 2) * ease(mix * 1.6)
        cy = H / 2 + 30 * (1 - mix) + (WIN[1] - H / 2) * ease(mix * 1.6)
        cw, ch = W / zc, H / zc
        x0, y0 = min(max(cx - cw / 2, 0), W - cw), min(max(cy - ch / 2, 0), H - ch)
        im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).resize((W, H), Image.LANCZOS,
                                                                          box=(x0 * SS, y0 * SS, (x0 + cw) * SS, (y0 + ch) * SS))
        frame = np.asarray(im, np.float32)
        # past the glass: the inside itself, rendered at the camera's own scale so it stays sharp
        if zc > 3.2:
            s_in = zc * (JX1 - JX0) / RW          # inside px -> screen px at this zoom
            wsx = (WIN[0] - x0) * zc
            wsy = (WIN[1] - y0) * zc
            glide = ramp(s, GLIDE0, GLIDE0 + 1.2) * (1 - ramp(s, BACK0 - 0.2, BACK0 + 0.6))
            sc = s_in * (1 - glide) + 1.0 * glide
            axx = wx_in * (1 - glide) + RW / 2 * glide
            ayy = wy_in * (1 - glide) + RH / 2 * glide
            sxx = wsx * (1 - glide) + W / 2 * glide
            syy = wsy * (1 - glide) + H / 2 * glide
            inside = plain(tex, small, sc, axx, ayy, sxx, syy, zoff, W, H)
            k = ease((zc - 3.2) / 2.6)
            frame = frame * (1 - k) + inside * k
        frame *= ease(t / 1.2)
        if s >= BACK1 + 0.05:
            frame *= 1 - ease((s - BACK1 - 0.05) / 0.12)
        frame += rng.normal(0, 2.0, (H, W, 1))
        if TEST:
            Image.fromarray(np.clip(frame, 0, 255).astype(np.uint8)).save(f"{os.environ['TESTDIR']}/g{s:.2f}.png")
            print("test", round(s, 2), flush=True)
            continue
        out.stdin.write(np.clip(frame, 0, 255).astype(np.uint8).tobytes())
        if n % 48 == 0:
            print(f"{s:6.1f} fog {fog[mask1 > 0.5].mean():.2f} zoom {zc:.2f}", flush=True)
    out.stdin.close()
    out.wait()


if __name__ == "__main__":
    main()
