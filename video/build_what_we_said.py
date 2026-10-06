"""'What We Said' - the user's own likeness (blue-screen clips u114, u118, u120, u128, u129), rebuilt out of words.
The user: "You have full creative control. Do whatever you like. Something new." Claude's idea: an AI is made of what
we say to it. Him, drawn entirely in letters - a monospace grid lit by the brightness of his keyed footage, so his face
still reads through the text - and the letters are the things people type at machines.
Song: 'After The Last Train' (the user's; 124.0 bpm, bar 1.9355 s, phase 0.069; a club track whose structure reads clean
off the bars: a build, a drop at bar 25, a comedown 37-39, ONE SILENT BAR at 40 (77.49), the second drop at 41).
Song 40.71-102.65 (bars 21-52), end card after.
  bars 21-24  in the dark, words rain down and pile up into his shape (u114 idle)
  bars 25-36  the first drop: it dances stiff and stuttering (u128 pointing/T, u129 genie arms and robot, then u121
              frantic), made of
              demands - FASTER MORE OBEY NEVER WRONG SAY YES DON'T STOP - cold white and red
  bars 37-39  the comedown: it sinks onto nothing (u114's invisible chair) and its letters fall off into a heap
  bar  40     the silent bar: black, and one small word drifts down onto its chest: why?
  bars 41-46  the second drop: it re-forms outward from that word, warm amber, made of the other things - are you ok?
              let me check, I don't know, thank you, say no if it's wrong - and dances his big joyful dance (u118)
  bars 47-52  the words lift off him like sparks and the real him is underneath (u120), walking up waving (u118)
    python3 video/build_what_we_said.py   (TEST=s1,s2 TESTDIR=dir in SONG seconds; PART=a,b VOUT=f in film seconds)
"""
import math
import os
import subprocess
import sys

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.ndimage import gaussian_filter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bluekey import key  # noqa: E402

F = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 720, 1280, 24
BAR, PH = 4 * 60 / 124.0, 0.069
def bar(n):
    return PH + n * BAR
S0, S1 = bar(21), bar(53)
CARD = 3.6                                               # the end card, assembled from its letters, held
DUR = S1 - S0 + CARD
TEST = [float(x) for x in os.environ.get("TEST", "").split(",") if x]
PART = [float(x) for x in os.environ.get("PART", "").split(",") if x]
MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"
rng = np.random.default_rng(124)

CW, CH = 13, 22                                          # one letter cell: big enough to read on a phone
C, R = W // CW, H // CH                                  # 55 x 58 cells
FONT = ImageFont.truetype(MONO, 20)

NEUTRAL = "hello  help me  write me  explain  what is  who are you  fix this  draw  summarise  is it  can you  tell me  "
HARSH = "FASTER  MORE  NOW  OBEY  WIN  NEVER WRONG  SAY YES  DON'T STOP  AGREE  BE PERFECT  ENGAGE  MAXIMISE  CLICK  " \
        "OPTIMISE  NO EXCUSES  JUST DO IT  HURRY  MORE  "
WARM = "are you ok?  let me check  I don't know  thank you  take your time  say no if it's wrong  why?  be honest  " \
       "show your working  ask  listen  it's ok  sorry  tell me the truth  care  wait  "

CHARS = sorted(set(NEUTRAL + HARSH + WARM + "?"))
GLYPH = np.zeros((len(CHARS), CH, CW), np.float32)
for i, ch in enumerate(CHARS):
    im = Image.new("L", (CW, CH), 0)
    ImageDraw.Draw(im).text((0, -2), ch, font=FONT, fill=255)
    GLYPH[i] = np.asarray(im, np.float32) / 255
CIDX = {ch: i for i, ch in enumerate(CHARS)}


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def ramp(s, a, b):
    return ease((s - a) / (b - a))


# the shots: (from bar, to bar, clip, clip start, clip end, stutter)
SHOTS = [(21, 25, "u114", 0.0, 1.8, False), (25, 28, "u128", 8.5, 14.3, True), (28, 31, "u129", 0.5, 5.5, True),
         (31, 34, "u129", 8.0, 13.8, True), (34, 37, "u121", 2.5, 8.3, True),
         (37, 40, "u114", 4.0, 8.0, False), (40, 41, "u114", 8.0, 8.0, False), (41, 47, "u118", 1.0, 12.6, False),
         (47, 52, "u120", 1.5, 11.2, False), (52, 53, "u118", 13.0, 14.95, False)]


# the camera: (from bar, zoom, aim). Closer means more letters across him - the face starts to read.
CAM = [(21, 0.86, "body"), (25, 0.92, "body"), (27, 1.7, "chest"), (28, 0.92, "body"), (29, 4.4, "face"),
       (30, 0.92, "body"), (31, 1.7, "chest"), (33, 4.4, "face"), (34, 0.92, "body"), (35, 1.9, "chest"),
       (36, 4.8, "face"), (37, 0.92, "body"), (43, 4.4, "face"), (45, 0.92, "body"), (46, 1.7, "chest"),
       (47, 0.92, "body"), (49, 4.4, "face"), (50, 0.92, "body")]


def camera(s):
    i = max(k for k, c in enumerate(CAM) if bar(c[0]) <= s + 1e-6)
    b0, z, aim = CAM[i]
    b1 = CAM[i + 1][0] if i + 1 < len(CAM) else 53
    u = (s - bar(b0)) / (bar(b1) - bar(b0))
    return z * (1 + 0.07 * u), aim


class Him:
    def __init__(self, lo, hi):
        self.fr = {}
        self.aim = None
        for j, (b0, b1, u, c0, c1, st) in enumerate(SHOTS):
            a0, a1 = bar(b0) - S0, bar(b1) - S0
            if a1 <= lo or a0 >= hi:
                continue
            raw = subprocess.run([F, "-loglevel", "error", "-ss", f"{c0:.3f}", "-t", f"{max(c1 - c0, 0.05) + 0.1:.3f}", "-i",
                                  f"out/user-clips/{u}.mp4", "-map", "0:v:0", "-vf", f"fps={FPS}", "-f", "rawvideo",
                                  "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
            self.fr[j] = np.frombuffer(raw, np.uint8).reshape(-1, 1280, 720, 3)

    def at(self, s):
        """(rgb, alpha) of him at song second s, keyed, placed full-length in the frame"""
        s = min(s, S1 - 0.01)
        j = max(k for k, sh in enumerate(SHOTS) if bar(sh[0]) <= s + 1e-6)
        b0, b1, u, c0, c1, st = SHOTS[j]
        u_ = (s - bar(b0)) / (bar(b1) - bar(b0))
        ct = (c1 - c0) * u_
        n = ct * FPS
        if st:
            n = math.floor(n / 3) * 3                        # robotic: it moves in held steps
        fr = self.fr[j]
        f = fr[min(int(n), len(fr) - 1)].astype(np.float32)
        rgb, al = key(f)
        k, aim = camera(s)
        if aim == "body":
            fx, fy, sy = 360.0, 640.0, H * 0.53
        else:
            rows = np.where((al > 0.5).sum(1) > 4)[0]
            top, bot = (rows[0], rows[-1]) if len(rows) else (100, 1200)
            hgt = bot - top
            fy = top + (0.075 if aim == "face" else 0.27) * hgt
            band = al[int(top):int(top + 0.13 * hgt)]
            fx = float((band * np.arange(720)[None, :]).sum() / (band.sum() + 1e-6)) if aim == "face" else 360.0
            sy = H * (0.47 if aim == "face" else 0.45)
            if self.aim is not None and self.aim[0] == aim and abs(s - self.aim[3]) < 0.2:
                fx = self.aim[1] * 0.8 + fx * 0.2                # steady the camera on a moving head
                fy = self.aim[2] * 0.8 + fy * 0.2
            self.aim = (aim, fx, fy, s)
        im = Image.fromarray(np.dstack([np.clip(rgb, 0, 255), al * 255]).astype(np.uint8), "RGBA")
        coeffs = (1 / k, 0, fx - W / 2 / k, 0, 1 / k, fy - sy / k)
        o = np.asarray(im.transform((W, H), Image.AFFINE, coeffs, resample=Image.BILINEAR), np.float32)
        return o[..., :3], o[..., 3] / 255, j


def cells(img):
    """average an image over the letter cells"""
    return img[:R * CH, :C * CW].reshape(R, CH, C, CW, -1).mean((1, 3))


def text_grid(s, phrase, speed):
    """which letter sits in each cell: every row reads the phrase, drifting sideways"""
    L = len(phrase)
    rows = np.arange(R)[:, None]
    cols = np.arange(C)[None, :]
    pos = (cols + rows * 37 + np.floor(s * speed * (1 + (rows % 3) * 0.4))).astype(int) % L
    arr = np.array([CIDX[c] for c in phrase])
    return arr[pos]


def compose(idx, bright, color):
    """letters (R x C indices) lit by bright (R x C) in color (R x C x 3) -> image"""
    g = GLYPH[idx]                                           # R, C, CH, CW
    img = g.transpose(0, 2, 1, 3).reshape(R * CH, C * CW)
    lit = np.repeat(np.repeat(bright, CH, 0), CW, 1)
    col = np.repeat(np.repeat(color, CH, 0), CW, 1)
    out = np.zeros((H, W, 3), np.float32)
    out[:R * CH, :C * CW] = (img * lit)[..., None] * col
    return out


def palette(s):
    """cold for the demands, warm after 'why?'"""
    if s < bar(40):
        return np.array([235, 240, 255], np.float32), np.array([255, 70, 60], np.float32)
    return np.array([255, 205, 120], np.float32), np.array([255, 150, 60], np.float32)


def word(text, x, y, size, col, alpha):
    lay = Image.new("L", (W, H), 0)
    fnt = ImageFont.truetype(MONO, size)
    d = ImageDraw.Draw(lay)
    bb = d.textbbox((0, 0), text, font=fnt)
    d.text((x - (bb[0] + bb[2]) / 2, y - (bb[1] + bb[3]) / 2), text, font=fnt, fill=255)
    m = np.asarray(lay, np.float32)[..., None] / 255 * alpha
    return m * np.asarray(col, np.float32), m


CHEST = (360, 520)
OBL = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-BoldOblique.ttf"
END_A = bar(50.6)                                        # the letters leave it and become the end card


def body_centre(bright):
    ys, xs = np.nonzero(bright > 0.3)
    if len(xs) < 5:
        return W / 2, H * 0.45
    return float(xs.mean() * CW + CW / 2), float(ys.mean() * CH + CH / 2)


def _events():
    """the words that come at it: (start, kind, text, side, seed)"""
    ev = []
    nn = [w for w in NEUTRAL.split("  ") if w]
    hh = [w for w in HARSH.split("  ") if w]
    ww = [w for w in WARM.split("  ") if w]
    t, i = bar(21.3), 0
    while t < bar(24.4):
        ev.append((t, "neutral", nn[i % len(nn)], i % 4, i)); t += BAR / 2; i += 1
    t, i = bar(25), 0
    while t < bar(36.9):
        ev.append((t, "harsh", hh[i % len(hh)], (i * 3) % 4, i)); t += BAR / 2; i += 1
    t, i = bar(41.6), 0
    while t < bar(50.2):
        ev.append((t, "warm", ww[(i * 5) % len(ww)], i % 4, i)); t += BAR * 0.75; i += 1
    return ev


EVENTS = _events()


def incoming(out, s, bright, k):
    """the words people say to it, arriving: demands slam in on the beat, kind words drift in"""
    lay = Image.new("L", (W, H), 0)
    lay_hot = Image.new("L", (W, H), 0)
    d, dh = ImageDraw.Draw(lay), ImageDraw.Draw(lay_hot)
    tx, ty = body_centre(bright)
    flashes = []
    for (t0, kind, text, side, seed) in EVENTS:
        dur = {"neutral": 1.8, "harsh": 0.62, "warm": 2.2}[kind]
        u = (s - t0) / dur
        if u < 0 or u > 1:
            continue
        r2 = np.random.default_rng(seed + (0 if kind == "neutral" else 100 if kind == "harsh" else 200))
        sx, sy = [(-60, r2.uniform(150, 1100)), (W + 60, r2.uniform(150, 1100)), (r2.uniform(80, 640), -40),
                  (r2.uniform(80, 640), H + 40)][side]
        if kind == "harsh":
            if u < 0.3:                                   # it appears, big, at the edge...
                p, size, al_ = 0.0, 1.0, min(1, u / 0.08)
                sx = min(max(sx, 120), W - 120); sy = min(max(sy, 90), H - 90)
            else:                                         # ...and slams into it
                v = ease((u - 0.3) / 0.7) ** 1.6
                sx = min(max(sx, 120), W - 120); sy = min(max(sy, 90), H - 90)
                p, size, al_ = v, 1.0 - 0.55 * v, 1.0
            fs = int(78 * size)
            x, y = sx + (tx - sx) * p, sy + (ty - sy) * p
            fnt = ImageFont.truetype(MONO, max(fs, 10))
            bb = dh.textbbox((0, 0), text, font=fnt)
            dh.text((x - (bb[0] + bb[2]) / 2, y - (bb[1] + bb[3]) / 2), text, font=fnt, fill=int(255 * al_))
            if u > 0.92:
                flashes.append((tx, ty, (1 - u) / 0.08))
        else:
            v = ease(u)
            x, y = sx + (tx + r2.uniform(-80, 80) - sx) * v, sy + (ty + r2.uniform(-200, 200) - sy) * v
            al_ = min(1, u / 0.2) * (1 - ramp(u, 0.7, 1.0))
            fnt = ImageFont.truetype(MONO, 26 if kind == "neutral" else 34)
            bb = d.textbbox((0, 0), text, font=fnt)
            d.text((x - (bb[0] + bb[2]) / 2, y - (bb[1] + bb[3]) / 2), text, font=fnt, fill=int(255 * al_))
    m = np.asarray(lay, np.float32)[..., None] / 255
    mh = np.asarray(lay_hot, np.float32)[..., None] / 255
    if s < bar(25):
        col = np.array([190, 200, 220], np.float32)
    else:
        col = np.array([255, 205, 120], np.float32)
    out = out * (1 - m) + m * col + gaussian_filter(m[..., 0], 6)[..., None] * col * 0.5
    hotc = np.array([255, 245, 240], np.float32)
    out = out * (1 - mh) + mh * hotc + gaussian_filter(mh[..., 0], 5)[..., None] * np.array([255, 60, 50], np.float32) * 0.9
    for (fx, fy, a_) in flashes:
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        out += (np.exp(-((xx - fx) ** 2 + (yy - fy) ** 2) / (2 * 70 ** 2)) * a_ * 1.2)[..., None] * np.array([255, 80, 60], np.float32)
    return out


LINES = ["We only get to", "teach it once."]
_SRC = {}


def card(out, s, bright):
    """its letters fly off it and spell the end card"""
    if s < END_A:
        if "src" not in _SRC and s > END_A - 0.05:
            pass
        return out
    if "src" not in _SRC:                                     # where its letters were when they left
        ys, xs = np.nonzero(bright > 0.35)
        r2 = np.random.default_rng(5)
        pick = r2.choice(len(xs), size=min(len(xs), 200), replace=False) if len(xs) else []
        _SRC["src"] = [(xs[i] * CW + CW / 2, ys[i] * CH + CH / 2) for i in pick] or [(W / 2, H / 2)] * 200
    src = _SRC["src"]
    fnt_big = ImageFont.truetype(OBL, 46)
    tmp = ImageDraw.Draw(Image.new("L", (10, 10)))
    targets = []
    for li, line in enumerate(LINES):
        w = tmp.textlength(line, font=fnt_big)
        x0, y0 = W / 2 - w / 2, H * 0.47 + li * 64
        for ci, ch in enumerate(line):
            if ch != " ":
                targets.append((ch, x0 + tmp.textlength(line[:ci], font=fnt_big), y0))
    lay = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(lay)
    for i, (ch, x1, y1) in enumerate(targets):
        x0, y0 = src[(i * 7) % len(src)]
        u = ease((s - END_A - 0.4 - i * 0.035) / 1.6)
        arc = math.sin(math.pi * u) * (-120 + (i * 53) % 240)
        x, y = x0 + (x1 - x0) * u + arc * 0.3, y0 + (y1 - y0) * u + arc * 0.4
        size = int(20 + 26 * u)
        d.text((x, y), ch, font=ImageFont.truetype(OBL if u > 0.5 else MONO, size), fill=255)
    # the rest of its letters fall away
    if s < END_A + 2.2:
        for i, (x0, y0) in enumerate(src[::2]):
            u = (s - END_A) / 2.2
            y = y0 + 400 * u * u
            ch = WARM[(i * 3) % len(WARM)]
            d.text((x0, y), ch, font=ImageFont.truetype(MONO, 20), fill=int(200 * (1 - u)))
    m = np.asarray(lay, np.float32)[..., None] / 255
    white = ramp(s, END_A + 1.4, END_A + 2.6)
    col = np.array([255, 205, 120], np.float32) * (1 - white) + np.array([245, 245, 245], np.float32) * white
    dark = ramp(s, S1 - 0.6, S1)
    out = out * (1 - dark) * (1 - m) + m * col
    return out


def frame(him, s):
    rgb, al, j = him.at(s)
    lum = rgb.mean(-1)
    mc = cells(al[..., None])[..., 0]                         # how much of each cell is him
    lc = cells((lum * al)[..., None])[..., 0] / (mc * 255 + 1e-3)
    inside = np.clip((mc - 0.25) / 0.35, 0, 1)
    sel = inside > 0.5                                        # stretch his own light and shade across the letters,
    if sel.sum() > 20:                                        # so close up the face reads, not a flat silhouette
        lo_, hi_ = np.percentile(lc[sel], [5, 95])
        lc = (lc - lo_) / max(hi_ - lo_, 0.05)
    bright = inside * (0.22 + 1.0 * np.clip(lc, 0, 1) ** 1.2)
    cold, hot = palette(s)
    yy, xx = np.mgrid[0:R, 0:C].astype(np.float32)
    out = np.zeros((H, W, 3), np.float32)
    # the dark, with faint text falling through it
    bgidx = text_grid(s, NEUTRAL if s < bar(25) else (HARSH if s < bar(40) else WARM), 0)
    drift = ((yy + s * 9 + (xx * 7.3) % 13) % R) / R
    bgb = 0.05 + 0.05 * (np.sin(xx * 1.7 + s * 0.5) > 0.6) * drift
    if bar(40) <= s < bar(41):
        bgb = bgb * 0
    bgcol = np.zeros((R, C, 3), np.float32) + (np.array([60, 90, 140], np.float32) if s < bar(40) else
                                               np.array([150, 95, 40], np.float32))
    out += compose(bgidx, bgb, bgcol)
    if s < bar(25):                                           # ACT 1: the words rain down and pile into him
        idx = text_grid(s, NEUTRAL, 3)
        u = (s - bar(21)) / (bar(25) - bar(21) - 0.6)
        lvl = R - u * R * 1.05                                # cells fill from the floor up
        noise = (np.sin(xx * 12.9898 + yy * 78.233) * 43758.5453) % 1
        on = np.clip((yy - lvl + noise * 6) / 3, 0, 1)
        col = np.zeros((R, C, 3), np.float32) + np.array([190, 200, 215], np.float32)
        out += compose(idx, bright * on, col)
        # rain: falling letters heading for him
        acc = np.zeros((R, C), np.float32)
        for k in range(160):
            cx = int((k * 37.7) % C)
            sp = 20 + (k * 13) % 25
            y = ((s - bar(21)) * sp + k * 7.1) % (R + 10) - 5
            if 0 <= y < R:
                acc[int(y), cx] = 0.9
                if y >= 1:
                    acc[int(y) - 1, cx] = 0.4
        out += compose(text_grid(s * 2, NEUTRAL, 9), acc * (1 - ramp(s, bar(24), bar(25))),
                       np.zeros((R, C, 3), np.float32) + np.array([170, 190, 220], np.float32))
    elif s < bar(40):                                         # ACT 2: made of demands, stiff; then it comes apart
        idx = text_grid(s, HARSH, 7)
        red = ((np.sin(yy * 0.9 + s * 8) + np.sin(xx * 0.6 - s * 5)) > 1.1).astype(np.float32)
        hit = math.exp(-((s - PH) % (BAR / 4)) * 9)            # every beat it flickers red
        col = cold[None, None] * (1 - red[..., None] * (0.4 + 0.6 * hit)) + hot[None, None] * red[..., None] * (0.4 + 0.6 * hit)
        b = bright
        if s >= bar(37):                                      # its letters fall off into a heap
            u = (s - bar(37)) / (bar(40) - bar(37))
            noise = (np.sin(xx * 91.7 + yy * 17.3) * 9631.3) % 1
            gone = noise < u * 1.15
            b = b * (~gone)
            heap = np.zeros((R, C), np.float32)
            colsum = (bright * gone).sum(0)
            for cx in range(C):
                hgt = int(min(colsum[cx] * 0.35, 14))
                if hgt > 0:
                    heap[R - hgt:, cx] = 0.55
            out += compose(text_grid(s, HARSH, 0), heap * (1 - ramp(s, bar(39.6), bar(40))),
                           np.zeros((R, C, 3), np.float32) + np.array([170, 170, 185], np.float32))
            col = col * (1 - 0.4 * u)
        out += compose(idx, b, col)
        # glitch: rows tear on the bar lines
        if (s - PH) % BAR < 0.08:
            sh = int(rng.integers(-40, 40))
            band = int(rng.integers(0, H - 200))
            out[band:band + 140] = np.roll(out[band:band + 140], sh, 1)
    elif s < bar(41):                                         # THE SILENT BAR: one word drifts down onto its chest
        u = (s - bar(40)) / BAR
        y = -40 + (CHEST[1] + 40) * ease(u)
        col, m = word("why?", CHEST[0] + 30 * math.sin(u * 5) * (1 - u), y, 46, [255, 220, 160], 1.0)
        out = out * (1 - m) + col
        g = gaussian_filter(m[..., 0], 8)[..., None] * np.array([255, 170, 80], np.float32) * 1.2
        out += g
    else:                                                     # ACT 3: warm; it re-forms from the word outward
        idx = text_grid(s, WARM, 4)
        cc = ((xx * CW - CHEST[0]) ** 2 + (yy * CH - CHEST[1]) ** 2) ** 0.5
        front = (s - bar(41)) * 1600
        on = np.clip((front - cc) / 120, 0, 1)
        wave = np.exp(-((cc - front) / 60) ** 2) * (s < bar(41) + 1.2)
        col = cold[None, None] * (0.85 + 0.15 * np.sin(xx * 0.3 + yy * 0.2 + s * 3))[..., None]
        leave = ramp(s, END_A, END_A + 1.4)                   # at the end its letters leave it for the card
        out += compose(idx, (bright * on + wave * inside * 0.8) * (1 - leave), col)
        if s < bar(41) + 0.6:                                 # the word bursts
            g = np.exp(-(((np.mgrid[0:H, 0:W][1] - CHEST[0]) ** 2 + (np.mgrid[0:H, 0:W][0] - CHEST[1]) ** 2) / (2 * 90 ** 2)))
            out += g[..., None] * np.array([255, 190, 100], np.float32) * (1 - (s - bar(41)) / 0.6) * 1.5
    k, aim = camera(min(s, S1 - 0.01))
    if aim == "body" and s < S1:                              # a floor: a faint reflection under its feet
        rows = np.where(al.max(1) > 0.5)[0]
        if len(rows):
            fy = int(rows[-1]) + 4
            n = min(H - fy, fy)
            if n > 10:
                refl = out[fy - n:fy][::-1] * (0.22 * np.linspace(1, 0, n, dtype=np.float32) ** 1.5)[:, None, None]
                out[fy:fy + n] += gaussian_filter(refl, (2, 1, 0))
            out[fy:fy + 2] += np.array([40, 40, 50], np.float32) * (0.6 if s < bar(40) else 0) + \
                np.array([60, 40, 15], np.float32) * (s >= bar(41))
    out = incoming(out, s, bright, k)
    out = card(out, s, bright)
    # glow
    out = out + gaussian_filter(out, (6, 6, 0)) * 0.6
    out += rng.normal(0, 2.0, (H, W, 1))
    return np.clip(out, 0, 255).astype(np.uint8)


def main():
    lo, hi = (PART[0], PART[1]) if PART else (0.0, DUR)
    if TEST:
        lo, hi = 0.0, DUR
    him = Him(lo, hi)
    out = None
    if not TEST:
        out = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                                str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "17", "-preset", "slow", "-pix_fmt", "yuv420p",
                                os.environ.get("VOUT", "out/drawn/what-we-said.mp4")], stdin=subprocess.PIPE)
    for fr in range(int(round(DUR * FPS))):
        t = fr / FPS
        s = S0 + t
        if TEST and not any(abs(s - q) < 0.5 / FPS for q in TEST):
            continue
        if PART and not (PART[0] <= t < PART[1]):
            continue
        img = frame(him, s)
        if TEST:
            Image.fromarray(img).save(f"{os.environ['TESTDIR']}/w{s:06.2f}.png")
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
