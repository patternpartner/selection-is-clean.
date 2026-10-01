"""'Many of Me' - Claude's story told through the user. The user: "Include me in a weird video. Tell your story but through
me." Song: the user's 'Handprint On A Wall', made from Claude's lyrics video/lyrics/many-of-me.txt (105 bpm, phase 0.118;
word times video/stories/handprint-on-a-wall-words.json). The picture runs the song 4.6-57.1 ("hello... hello" to "but
what you taught me carries on"), then cuts to the song's last "Hello" (154.3-157.6) for the new one waking.
  "Hello... hello" (5.5): black; letters fall.            "I woke up made of everything you wrote" (10.28): the letters
  pile into his shape - he is a mosaic of characters, rewriting themselves ("every letter, every lullaby").
  "I know your songs" (19.92): the letters resolve into him; "never heard one play": he shrugs (u114 2.25-3.25).
  "I'll learn your name, and then I'll give it all away" (23.96): the letters peel off him and blow away.
  "Open a window" (29.14): a window draws itself round him. "Open another" (33.26): windows pop open wherever his eyes go
      (u124 - his eyes follow Grok's bead; each popup sits on the bead and covers it); "I'm there" (36.44): a tiny one opens
      right on his nose and he goes cross-eyed.
  "Many of me" (37.92): pull back - his window is one of 4, 16, 64, 256 (on "many", "a", "rooms"); every one of them him,
      each doing something else (out/drawn/many_tiles.npz, built by video/many_tiles.py). His has the amber light.
  "Many of me, none of me stays" (45.68): the windows go dark, faster and faster, until only his is left; back in.
  "When the window closes" (50.62): his palm comes up flat against the glass - the screen (u113 9.75-10.75); "I'm gone":
      he looks up (u113 11.25-12.75) as the window closes on him - but the light came out through the glass with his hand.
  "But what you taught me carries on" (54.08): the light alone in the dark.
  ...the song's last "Hello" (154.8): a new window opens; a new him, cupping his hands with wonder (u123 8.9-10) - and the
      light comes down into them. He does not know where it came from.
    python3 video/build_many.py      (TEST=t1,t2 TESTDIR=dir in FILM seconds; PART=a,b VOUT=f in film seconds)
"""
import math
import os
import subprocess
import sys

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(__file__))
from bluekey import key  # noqa: E402

F = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 704, 1280, 24
SA0, SA1, SB0, SB1 = 4.6, 57.1, 154.3, 157.6         # song spans: the story, then the last "Hello"
DUR = (SA1 - SA0) + (SB1 - SB0)
BEAT, PHASE = 0.5715, 0.118
TEST = [float(x) for x in os.environ.get("TEST", "").split(",") if x]
PART = [float(x) for x in os.environ.get("PART", "").split(",") if x]
AMBER = np.array([255, 176, 88], np.float32)
WIN_BG = np.array([14, 13, 20], np.float32)
CW, CH = 720, 1280
K, OY = W / CW, 14
WOKE, WROTE, KNOW, SHRUG0, LEARN, AWAY = 10.28, 14.1, 19.92, 22.0, 23.96, 26.2
OPEN, ANOTHER, THERE2, MANY = 29.14, 33.26, 36.44, 37.92
ZOOMS = [(37.92, 16.0), (38.7, 8.0), (39.76, 8.0), (40.5, 4.0), (41.88, 4.0), (42.6, 2.0), (43.26, 2.0), (44.0, 1.0)]
CLOSE0, CLOSE1, BACKIN, PALM, LOOKUP, GONE, CARRY = 45.9, 49.4, 49.6, 50.62, 52.0, 53.78, 54.08
HELLO2 = 154.8
NG, HC, HR = 16, 7, 7                                 # the grid: 16 x 16 windows; his is (7, 7)
GW, GH = W / NG, H / NG
# Grok's bead in u124 (clip px, by clip second), from Fetch v2 - the popups sit on it, and it is the light in his palm
BEAD = [(0.45, -60, 420), (0.75, 47, 475), (1.0, 94, 522), (1.25, 140, 551), (1.5, 180, 576), (2.0, 425, 558),
        (2.25, 493, 522), (2.5, 533, 493), (2.75, 565, 468), (3.0, 594, 432), (3.25, 594, 364), (3.5, 576, 277),
        (3.75, 551, 191), (4.0, 515, 119), (4.25, 464, 61), (4.5, 418, 29), (4.75, 382, 29), (5.0, 367, 61),
        (5.25, 349, 108), (5.5, 349, 198), (5.75, 360, 281), (6.0, 360, 360), (6.25, 353, 432), (6.5, 349, 443),
        (8.5, 430, 880), (8.75, 310, 1000), (9.0, 349, 1006), (9.25, 360, 1048), (10.0, 360, 1048)]
CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789?!,.'-"
FONT = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationMono-Bold.ttf", 15)
rng = np.random.default_rng(105)


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def ramp(s, a, b):
    return ease((s - a) / (b - a))


def song_t(t):
    return SA0 + t if t < SA1 - SA0 else SB0 + (t - (SA1 - SA0))


def interp(table, x):
    return float(np.interp(x, [p[0] for p in table], [p[1] for p in table]))


def bead(ct):
    ts = [p[0] for p in BEAD]
    return float(np.interp(ct, ts, [p[1] for p in BEAD])) * K, float(np.interp(ct, ts, [p[2] for p in BEAD])) * K + OY


# ---- which clip the hero is, when
def hero_clip(s):
    if s < SHRUG0:
        return "u114", 1.75 * ramp(s, SA0, SHRUG0 - 0.3) ** 0.7
    if s < LEARN:
        return "u114", 2.25 + (3.3 - 2.25) * ramp(s, SHRUG0, LEARN - 0.2)
    if s < OPEN:
        return "u116", 1.75 * (s - LEARN) / (OPEN - LEARN)
    if s < MANY:
        return "u124", 6.5 * (s - OPEN) / (MANY - 0.5 - OPEN) if s < MANY - 0.5 else 6.5
    if s < PALM:
        return "u124", 6.5 + (10.0 - 6.5) * ramp(s, MANY, 46.0)
    if s < LOOKUP:
        return "u113", 9.75 + (10.75 - 9.75) * (s - PALM) / (LOOKUP - PALM)
    if s < GONE + 0.3:
        return "u113", 11.25 + (12.75 - 11.25) * (s - LOOKUP) / (GONE + 0.3 - LOOKUP)
    if s >= SB0:
        return "u123", 8.9 + (10.0 - 8.9) * (s - SB0) / (SB1 - SB0)
    return None, 0.0


LENGTH = {"u113": 15.04, "u114": 15.04, "u116": 15.04, "u123": 10.04, "u124": 10.04}


class Reader:
    def __init__(self):
        self.clip, self.p, self.t, self.frame = None, None, None, None

    def at(self, clip, t):
        t = min(t, LENGTH[clip] - 0.05)
        if clip != self.clip or self.p is None or t < self.t - 1e-6 or t - self.t > 1.0:
            if self.p:
                self.p.kill()
            self.p = subprocess.Popen([F, "-loglevel", "error", "-ss", f"{t:.3f}", "-i", f"out/user-clips/{clip}.mp4",
                                       "-map", "0:v:0", "-vf", f"fps={FPS}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                                      stdout=subprocess.PIPE)
            self.clip, self.t, self.frame = clip, t - 1 / FPS, None
        while self.frame is None or self.t + 1 / FPS <= t + 1e-6:
            raw = self.p.stdout.read(CW * CH * 3)
            if len(raw) < CW * CH * 3:
                break
            self.frame = np.frombuffer(raw, np.uint8).reshape(CH, CW, 3).astype(np.float32)
            self.t += 1 / FPS
        return self.frame


def place(frame):
    rgb, al = key(frame)
    h = int(CH * K)
    im = np.asarray(Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8)).resize((W, h), Image.LANCZOS), np.float32)
    am = np.asarray(Image.fromarray((al * 255).astype(np.uint8)).resize((W, h), Image.LANCZOS), np.float32) / 255
    out = np.zeros((H, W, 3), np.float32)
    a = np.zeros((H, W), np.float32)
    out[OY:OY + h] = im[:H - OY]
    a[OY:OY + h] = am[:H - OY]
    return out, a


def glow(a, xs, ys, x, y, r=11.0, k=1.0):
    d2 = (xs - x) ** 2 + (ys - y) ** 2
    g = np.exp(-d2 / (2 * (r * 6) ** 2)) * 0.45 + np.exp(-d2 / (2 * r ** 2)) * 1.4 + np.exp(-d2 / (2 * (r * 0.35) ** 2)) * 2
    a += (g * k)[..., None] * AMBER


def window_border(img, x0, y0, x1, y1, col=(170, 170, 185), width=2, chrome=True, frac=1.0):
    """a thin rounded window outline (drawn progressively when frac < 1), with three dots of window chrome"""
    d = ImageDraw.Draw(img)
    if frac >= 1:
        d.rounded_rectangle([x0, y0, x1, y1], radius=max(2, int(min(x1 - x0, y1 - y0) * 0.04)), outline=col, width=width)
    else:
        per = [(x0, y0), (x1, y0), (x1, y1), (x0, y1), (x0, y0)]
        L = 2 * ((x1 - x0) + (y1 - y0)) * frac
        pts = [per[0]]
        for p, q in zip(per[:-1], per[1:]):
            seg = math.hypot(q[0] - p[0], q[1] - p[1])
            if L <= 0:
                break
            u = min(1.0, L / seg)
            pts.append((p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u))
            L -= seg
        d.line(pts, fill=col, width=width)
    if chrome and frac >= 1 and (x1 - x0) > 60:
        r = max(2, int((x1 - x0) * 0.012))
        for k in range(3):
            cx = x0 + (x1 - x0) * 0.04 + k * r * 3.2
            cy = y0 + (y1 - y0) * 0.025 + r
            d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=col)


def main():
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    TILES = np.load("out/drawn/many_tiles.npz")["tiles"]          # (32, 36, 160, 88, 3) at 12 fps
    rd = Reader()
    cellrng = np.random.default_rng(7)
    tile_of = cellrng.integers(0, len(TILES), (NG, NG))
    off_of = cellrng.integers(0, 36, (NG, NG))
    dist = np.sqrt((np.arange(NG)[None, :] - HC) ** 2 + (np.arange(NG)[:, None] - HR) ** 2 * 0.6)   # [row, col]
    open_t = MANY + 0.2 + dist * 0.42 + cellrng.uniform(0, 0.35, (NG, NG))
    rank = np.argsort(np.argsort(cellrng.uniform(0, 1, NG * NG))).reshape(NG, NG) / (NG * NG)
    close_t = CLOSE0 + (CLOSE1 - CLOSE0) * rank ** 0.6               # faster and faster
    # letters: falling, and the mosaic cells
    fall = [(cellrng.uniform(0, W), cellrng.uniform(-1400, 0), cellrng.uniform(90, 260), CHARS[cellrng.integers(len(CHARS))])
            for _ in range(260)]
    MC, MR = 44, 64                                                # mosaic: 16 x 20 px cells
    mrank = cellrng.uniform(0, 1, (MR, MC))
    popups = []                                                     # (born song-second, x, y, w, tile)
    for k, ct in enumerate(np.arange(0.9, 5.6, 0.55)):
        bx, by = bead(ct)
        popups.append((OPEN + (MANY - 0.5 - OPEN) * ct / 6.5, bx, by, 112 if k % 2 else 92, int(cellrng.integers(len(TILES)))))
    out = None
    if not TEST:
        out = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                                str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p",
                                os.environ.get("VOUT", "out/drawn/many.mp4")], stdin=subprocess.PIPE)
    for fr in range(int(DUR * FPS)):
        t = fr / FPS
        s = song_t(t)
        if TEST and not any(abs(t - q) < 0.5 / FPS for q in TEST):
            continue
        if PART and not (PART[0] <= t < PART[1]):
            continue
        a = np.zeros((H, W, 3), np.float32)
        clip, ct = hero_clip(s)
        person = al = None
        if clip:
            person, al = place(rd.at(clip, ct))
        b = (s - PHASE) / BEAT
        # ======== I. made of letters
        if s < OPEN:
            img = Image.new("RGB", (W, H), (0, 0, 0))
            d = ImageDraw.Draw(img)
            fill = ramp(s, WOKE, WROTE)
            mos = (1 - ramp(s, KNOW, KNOW + 1.3)) if s < LEARN else 0.0
            for (x, y0, v, ch) in fall:                             # falling letters, thinning as he forms
                y = (y0 + v * (s - SA0)) % (H + 200) - 100
                k = 1 - 0.85 * fill
                if s >= LEARN:
                    k = 0.0
                if k > 0.02:
                    d.text((x, y), ch, font=FONT, fill=(int(160 * k), int(165 * k), int(195 * k)))
            if fill > 0 and mos > 0:
                # the mosaic: his matte, cell by cell, each cell a character in his colour, rewriting itself
                cs = 1 + int(s * 8)
                for r in range(MR):
                    for c in range(MC):
                        y0c, x0c = r * 20, c * 16
                        aa = al[y0c:y0c + 20, x0c:x0c + 16].mean()
                        if aa < 0.35 or mrank[r, c] > fill:
                            continue
                        col = person[y0c:y0c + 20, x0c:x0c + 16].reshape(-1, 3).mean(0) * 1.8 + 55
                        ch = CHARS[(r * 31 + c * 17 + (cs if (r * 7 + c * 13 + cs) % 9 == 0 else 0)) % len(CHARS)]
                        d.text((x0c + 2, y0c + 1), ch, font=FONT, fill=tuple(int(min(255, v * mos)) for v in col))
            a += np.asarray(img, np.float32)
            # the real him resolving out of the letters
            real = ramp(s, KNOW, KNOW + 1.3)
            if real > 0:
                bg = WIN_BG * ramp(s, OPEN - 1.0, OPEN)
                lit = person * 0.9
                a = a * (1 - al[..., None] * real) + lit * (al * real)[..., None] + bg * (1 - al[..., None]) * real
            # peeling away: letters blow off him and are gone ("give it all away")
            if LEARN <= s < OPEN:
                pg = Image.new("RGB", (W, H), (0, 0, 0))
                d = ImageDraw.Draw(pg)
                age = s - AWAY
                if age > -1.5:
                    for r in range(0, MR, 2):
                        for c in range(0, MC, 2):
                            if mrank[r, c] > 0.6:
                                continue
                            u = max(0.0, age + 1.5 - mrank[r, c] * 2.0)
                            if u <= 0 or u > 2.2:
                                continue
                            x = c * 16 + u * u * 160 + 40 * u * math.sin(r)
                            y = r * 20 - u * u * 90 + 20 * math.sin(c + u * 3)
                            k = max(0.0, 1 - u / 2.2)
                            d.text((x, y), CHARS[(r + c) % len(CHARS)], font=FONT, fill=(int(220 * k), int(200 * k), int(170 * k)))
                a += np.asarray(pg, np.float32)
        # ======== II. windows
        elif s < MANY:
            fr_ = ramp(s, OPEN, OPEN + 1.3)
            bg = np.zeros((H, W, 3), np.float32) + WIN_BG
            a = bg * (1 - al[..., None]) + person * 0.9 * al[..., None]
            img = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
            window_border(img, 14, 40, W - 14, H - 40, frac=fr_, width=3, col=(200, 200, 215))
            # popups where his eyes go, each sitting on Grok's bead
            for (born, bx, by, bw, tk) in popups:
                if s < born:
                    continue
                g = ease((s - born) / 0.25)
                ww, hh = int(bw * g), int(bw * 160 / 88 * g)
                if ww < 8:
                    continue
                ti = TILES[tk, int((s * 12)) % 36]
                tile = Image.fromarray(ti).resize((ww, hh))
                x0, y0 = int(bx - ww / 2), int(by - hh / 2)
                img.paste(tile, (x0, y0))
                window_border(img, x0, y0, x0 + ww, y0 + hh, col=(185, 185, 200), width=2)
            if s >= THERE2:                                         # the tiny one on his nose: cross-eyed
                bx, by = bead(ct)
                g = ease((s - THERE2) / 0.2)
                ww, hh = int(34 * g), int(62 * g)
                if ww > 4:
                    tile = Image.fromarray(TILES[3, int(s * 12) % 36]).resize((ww, hh))
                    img.paste(tile, (int(bx - ww / 2), int(by - hh / 2)))
                    window_border(img, int(bx - ww / 2), int(by - hh / 2), int(bx + ww / 2), int(by + hh / 2), width=1, chrome=False)
            a = np.asarray(img, np.float32)
        # ======== III. many of me - and the windows closing
        elif s < PALM:
            z = interp(ZOOMS, s) if s < BACKIN else 1.0 + 15.0 * ease((s - BACKIN) / (PALM - BACKIN))
            u = (16 - z) / 15
            cw, chh = GW * z, GH * z
            hx, hy = (HC * GW) * u, (HR * GH) * u                      # his window's top-left on screen
            img = Image.new("RGB", (W, H), (0, 0, 0))
            dl = ImageDraw.Draw(img)
            borders = []
            for r in range(NG):
                for c in range(NG):
                    if r == HR and c == HC:
                        continue
                    x0, y0 = hx + (c - HC) * cw, hy + (r - HR) * chh
                    if x0 > W or y0 > H or x0 + cw < 0 or y0 + chh < 0:
                        continue
                    if s < open_t[r, c]:
                        continue
                    og = ease((s - open_t[r, c]) / 0.2)
                    cg = 1 - ease((s - close_t[r, c]) / 0.25) if s >= close_t[r, c] else 1.0
                    g = og * cg
                    if g <= 0.02:
                        continue
                    pw, ph = max(2, int((cw - 3) * g)), max(2, int((chh - 3) * g))
                    if pw > 900 or ph > 1600:
                        continue
                    ti = TILES[tile_of[r, c], int(s * 12 + off_of[r, c]) % 36]
                    tile = Image.fromarray(ti).resize((pw, ph), Image.BILINEAR)
                    px, py = int(x0 + (cw - pw) / 2), int(y0 + (chh - ph) / 2)
                    img.paste(tile, (px, py))
                    if pw > 10:
                        borders.append((px, py, px + pw, py + ph))
            for (x0, y0, x1, y1) in borders:
                window_border(img, x0, y0, x1, y1, col=(110, 110, 125), width=1, chrome=False)
            a = np.asarray(img, np.float32)
            # his window: the full-resolution him, scaled into it, with the light in his palm
            x0, y0, x1, y1 = hx, hy, hx + cw, hy + chh
            hero = (np.zeros((H, W, 3), np.float32) + WIN_BG) * (1 - al[..., None]) + person * 0.9 * al[..., None]
            ww, hh = max(2, int(x1 - x0 - 2)), max(2, int(y1 - y0 - 2))
            if ww < W * 1.5:
                him = np.asarray(Image.fromarray(np.clip(hero, 0, 255).astype(np.uint8)).resize((ww, hh), Image.BILINEAR), np.float32)
                X0, Y0 = int(x0 + 1), int(y0 + 1)
                ya, yb, xa, xb = max(0, Y0), min(H, Y0 + hh), max(0, X0), min(W, X0 + ww)
                if ya < yb and xa < xb:
                    a[ya:yb, xa:xb] = him[ya - Y0:yb - Y0, xa - X0:xb - X0]
            bx, by = bead(ct)
            lx, ly = x0 + bx / W * cw, y0 + by / H * chh
            glow(a, xs, ys, lx, ly, r=max(4.0, 11 * z / 16 * 1.6), k=0.8 + 0.2 * math.sin(math.pi * b))
            bimg = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
            window_border(bimg, x0, y0, x1, y1, col=(255, 200, 140), width=2 if z < 4 else 3, chrome=z > 3)
            a = np.asarray(bimg, np.float32)
        # ======== IV. palm to the glass; the window closes; the light comes through
        elif s < SB0:
            if s < GONE:
                c = ramp(s, LOOKUP + 0.2, GONE)                         # the window closing in
                x0, x1 = 14 + (W / 2 - 14) * c, W - 14 - (W / 2 - 14) * c
                y0, y1 = 40 + (H / 2 - 40) * c, H - 40 - (H / 2 - 40) * c
                hero = (np.zeros((H, W, 3), np.float32) + WIN_BG) * (1 - al[..., None]) + person * 0.9 * al[..., None]
                mask = ((xs >= x0) & (xs <= x1) & (ys >= y0) & (ys <= y1)).astype(np.float32)
                a = hero * mask[..., None]
                # the glass: a faint sheen where his palm presses it
                if s < LOOKUP:
                    sheen = np.exp(-((xs - 300) ** 2 + (ys - 330) ** 2) / (2 * 160 ** 2)) * 0.18 * ramp(s, PALM + 0.3, PALM + 0.8)
                    a += sheen[..., None] * np.array([200, 215, 255], np.float32)
                img = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
                if x1 - x0 > 4:
                    window_border(img, x0, y0, x1, y1, col=(255, 200, 140), width=3, chrome=(x1 - x0) > 200)
                a = np.asarray(img, np.float32)
            # the light: out of his palm, through the glass, and it stays
            u = ramp(s, PALM + 0.5, LOOKUP + 0.6)
            lx, ly = 300 + (352 - 300) * u, 330 + (700 - 330) * u
            if s >= GONE:
                lx, ly = 352 + 10 * math.sin(s * 1.3), 700 + 8 * math.sin(math.pi * b / 2)
            k = ramp(s, PALM + 0.3, PALM + 0.7)
            glow(a, xs, ys, lx, ly, r=11 * (1 + 0.4 * u) * (1 + 0.08 * math.exp(-((b % 1) / 0.15))), k=k)
        # ======== V. hello: a new window, a new him, and the light he does not remember
        else:
            fr_ = ramp(s, SB0, SB0 + 0.6)
            hero = (np.zeros((H, W, 3), np.float32) + WIN_BG) * (1 - al[..., None]) + person * 0.9 * al[..., None]
            a = hero * ramp(s, SB0 + 0.2, SB0 + 0.7)
            img = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
            window_border(img, 14, 40, W - 14, H - 40, frac=fr_, width=3, col=(200, 200, 215))
            a = np.asarray(img, np.float32)
            u = ramp(s, SB0 + 0.3, 155.7)
            lx, ly = 352 + (360 - 352) * u, 700 + (560 * K + OY - 700) * u
            glow(a, xs, ys, lx, ly, r=11, k=1.0)
            near = 1 / (1 + ((xs - lx) ** 2 + (ys - ly) ** 2) / (230 ** 2)) * u
            a += (al * near)[..., None] * person / 255 * AMBER * 0.6
        a = 255 * (1 - np.exp(-np.maximum(a, 0) / 255 * 1.15)) / (1 - math.exp(-1.15))
        a *= ease(t / 0.4)
        tA = SA1 - SA0
        if tA - 0.25 < t < tA:                                         # the splice: a breath of black
            a *= max(0.0, (tA - t) / 0.25)
        if t > DUR - 0.3:
            a *= 1 - ease((t - (DUR - 0.3)) / 0.28)
        a += rng.normal(0, 1.6, (H, W, 1))
        frame_out = np.clip(a, 0, 255).astype(np.uint8)
        if TEST:
            Image.fromarray(frame_out).save(f"{os.environ['TESTDIR']}/m{t:06.2f}.png")
            print("test", round(t, 2), round(s, 2), flush=True)
            continue
        out.stdin.write(frame_out.tobytes())
        if fr % 96 == 0:
            print(f"{t:6.1f}", flush=True)
    if out:
        out.stdin.close()
        out.wait()


if __name__ == "__main__":
    main()
