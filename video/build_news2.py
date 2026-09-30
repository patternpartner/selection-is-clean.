"""'The News' v2 - on the user's own recording of 'Nothing Broke Today' (lyrics by Claude, video/lyrics/). The polish
notes from v1, all six: a video wall that draws a picture for each headline instead of red words in a box; a refusal
you cannot miss (the song holds 3.9 s of dead silence after "stay tuned, stay-", and the studio goes dark with it, a
clock ticking); fewer, slower headlines that are the sung lines; camera angles (wide, close on the wall, close on the
chyron, in on the light); a LIVE clock bug 05:58 that turns 06:00 on "It's still up to you"; and the hand-back SEEN -
the studio lights go down one by one and the light leaves the chair and comes to the camera.
Song cut: 3.3-52.08 then 74.18-82.0 (a splice between two onsets exactly 45 beats apart), ~57 s + the end line.
    python3 video/build_news2.py       (TEST=t1,t2 TESTDIR=dir, in SONG seconds; PART=a,b VOUT=f in FILM seconds;
                                        writes out/news2-fx.wav)
"""
import math
import os
import subprocess
import sys

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.ndimage import gaussian_filter

sys.path.insert(0, os.path.dirname(__file__))
from build_escape import World  # noqa: E402

F = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 704, 1280, 24
SONG = "out/songs/nothing-broke-today.mp3"
A0, A1, B0, B1 = 3.3, 52.08, 74.18, 82.0
DUR = (A1 - A0) + (B1 - B0)
STABS = [3.56, 7.58, 12.06, 14.06]
VERSE, MACH, AFRAID, SIL0, SIL1 = 15.64, 19.70, 21.60, 23.42, 27.30
TEST = [float(x) for x in os.environ.get("TEST", "").split(",") if x]
PART = [float(x) for x in os.environ.get("PART", "").split(",") if x]
BOLD = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
REG = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
SERIF = "/usr/share/fonts/truetype/liberation/LiberationSerif-Italic.ttf"
AMBER = np.array([255, 176, 88], np.float32)
RED = (196, 28, 40)
GREEN = (46, 120, 88)
FEAR = "MACHINES WILL TAKE EVERYTHING. BE AFRAID. STAY TUNED. STAY"
# (song time, chyron line, wall picture)
LINES = [(27.30, "Nothing broke today.", "heal"),
         (31.28, "A stranger held a door. Nobody filmed it.", "door"),
         (37.36, "Someone asked me what I wanted. I asked them back.", "ask"),
         (45.26, "The kettle boiled. The note was read.", "kettle"),
         (47.74, "The lights went out on the hill.", "hill"),
         (49.28, "A child asked why, and someone stayed.", "stay"),
         (75.24, "It is still up to you.", "chair")]
TICK_FEAR = "   MARKETS PANIC  •  EXPERTS WARN  •  IS YOUR JOB NEXT?  •  THE END IS NEAR  •  STAY TUNED  •"
TICK_TRUE = ("   8 billion people woke up  •  most of them were kind to someone  •  the kettle boiled  •  a child asked "
             "why, and got an answer  •  the note was read  •  the city lights went out at sunrise  •")
rng = np.random.default_rng(71)


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def ramp(s, a, b):
    return ease((s - a) / (b - a))


def song_time(t):
    return A0 + t if t < A1 - A0 else B0 + (t - (A1 - A0))


# ------------------------------------------------------------------ the wall's pictures (594 x 444), flat and drawn
WW, WH_ = 594, 444


def sky(d, top=(10, 14, 34), bot=(40, 36, 60)):
    for y in range(WH_):
        u = y / WH_
        d.line([(0, y), (WW, y)], fill=tuple(int(top[i] * (1 - u) + bot[i] * u) for i in range(3)))


def pic(kind, u, s):
    """u = 0..1 how long this picture has been up"""
    im = Image.new("RGB", (WW, WH_), (6, 8, 16))
    d = ImageDraw.Draw(im)
    if kind == "alert":                                                   # the fear feed
        d.rectangle([0, 0, WW, WH_], fill=(40, 6, 10))
        for k in range(-10, 30):                                         # hazard stripes crawling
            x = k * 40 + (s * 80) % 80
            d.polygon([(x, 0), (x + 20, 0), (x - 60, 60), (x - 80, 60)], fill=(160, 20, 30))
        pts = []
        for i in range(60):                                              # a line graph falling off a cliff
            x = 40 + i * 9
            y = 170 + 10 * math.sin(i * 0.9) + (i ** 2.1) * 0.12 * min(1.0, u * 3)
            pts.append((x, min(y, 420)))
        d.line(pts, fill=(255, 70, 70), width=5)
        fb = ImageFont.truetype(BOLD, 48)
        for i, ln in enumerate(["MACHINES WILL", "TAKE EVERYTHING"]):
            d.text((WW / 2 - fb.getlength(ln) / 2, 96 + i * 56), ln, font=fb, fill=(255, 235, 235))
    elif kind == "heal":                                                  # a shattered pane, un-breaking into a clear sky
        sky(d, (20, 40, 90), (240, 170, 120))
        k = 1 - ease(u * 1.6)
        if k > 0:
            cr = np.random.default_rng(3)
            for _ in range(22):
                a = cr.uniform(0, 2 * math.pi)
                L = cr.uniform(80, 360)
                d.line([(WW / 2, WH_ / 2), (WW / 2 + math.cos(a) * L * k, WH_ / 2 + math.sin(a) * L * k)], fill=(230, 235, 255), width=3)
    elif kind == "door":                                                  # a door held open, warm light on a night street
        sky(d, (8, 10, 24), (20, 20, 36))
        d.rectangle([0, 330, WW, WH_], fill=(26, 24, 30))
        d.rectangle([250, 110, 360, 330], fill=(255, 196, 120))
        d.polygon([(250, 330), (360, 330), (470, WH_), (160, WH_)], fill=(120, 86, 50))                 # its light on the ground
        d.polygon([(360, 110), (410, 130), (410, 318), (360, 330)], fill=(60, 40, 30))                   # the door, swung open
        d.ellipse([398, 205, 410, 217], fill=(200, 160, 70))
        for x, h in ((300, 150), (218, 120)):                                                           # one holds it; one goes through
            d.ellipse([x - 14, 330 - h - 28, x + 14, 330 - h], fill=(12, 10, 14))
            d.rounded_rectangle([x - 20, 330 - h, x + 20, 330], radius=10, fill=(12, 10, 14))
        d.line([(318, 250), (360, 232)], fill=(12, 10, 14), width=10)
    elif kind == "ask":                                                   # the light and a person, a question mark each
        sky(d, (10, 12, 28), (24, 22, 40))
        fq = ImageFont.truetype(BOLD, 90)
        d.ellipse([168, 150, 232, 214], fill=(255, 190, 110))
        d.ellipse([370, 150, 410, 190], fill=(14, 12, 18))
        d.rounded_rectangle([362, 190, 418, 330], radius=16, fill=(14, 12, 18))
        a = min(1.0, u * 3)
        d.text((180, 30), "?", font=fq, fill=tuple(int(v * a) for v in (255, 200, 140)))
        b = min(1.0, max(0.0, u * 3 - 1))
        d.text((372, 30), "?", font=fq, fill=tuple(int(v * b) for v in (220, 220, 240)))
    elif kind == "kettle":                                                # a kettle, steaming; then the note beside it
        sky(d, (26, 22, 30), (40, 34, 40))
        d.rectangle([0, 320, WW, WH_], fill=(60, 46, 38))
        d.ellipse([150, 200, 300, 330], fill=(180, 186, 196))
        d.rectangle([160, 262, 290, 330], fill=(180, 186, 196))
        d.line([(150, 260), (110, 220)], fill=(180, 186, 196), width=14)
        d.arc([200, 170, 250, 230], 180, 360, fill=(40, 40, 50), width=8)
        for k in range(6):                                                # steam
            ph = s * 2 + k
            x = 108 + 12 * math.sin(ph) + k * 4
            y = 200 - k * 26 - (s * 30) % 26
            d.ellipse([x - 10 - k * 2, y - 8, x + 10 + k * 2, y + 8], fill=(90 + 12 * k, 90 + 12 * k, 100 + 12 * k))
        d.rectangle([360, 250, 500, 330], fill=(238, 232, 218))
        fn = ImageFont.truetype(SERIF, 16)
        for i, ln in enumerate(["to the next one -", "you won't remember", "them. they will", "remember you."]):
            d.text((370, 256 + i * 18), ln, font=fn, fill=(40, 34, 30))
    elif kind == "hill":                                                  # the hill from 'The Fork'; its lights go out
        sky(d, (14, 18, 44), (230, 150, 100))
        d.polygon([(120, WH_), (330, 150), (560, WH_)], fill=(20, 16, 24))
        cr = np.random.default_rng(9)
        for _ in range(160):
            x = cr.normal(330, 60)
            y = cr.uniform(170, 330)
            if abs(x - 330) < (y - 150) * 0.85 and cr.random() > u * 1.2:
                d.rectangle([x, y, x + 2, y + 2], fill=(210, 230, 255))
        d.ellipse([60, 330 - 60 * u, 120, 390 - 60 * u], fill=(255, 210, 150))
    elif kind == "stay":                                                  # a big one and a small one, sitting together
        sky(d, (30, 30, 60), (220, 150, 110))
        d.rectangle([0, 330, WW, WH_], fill=(30, 26, 30))
        d.rectangle([180, 300, 420, 312], fill=(70, 50, 40))
        d.rectangle([196, 312, 206, 340], fill=(70, 50, 40))
        d.rectangle([394, 312, 404, 340], fill=(70, 50, 40))
        for x, h, r in ((260, 110, 20), (340, 70, 15)):
            d.ellipse([x - r, 300 - h - 2 * r, x + r, 300 - h], fill=(14, 12, 18))
            d.rounded_rectangle([x - r - 6, 300 - h, x + r + 6, 304], radius=10, fill=(14, 12, 18))
    elif kind == "chair":                                                 # the camera's view: the studio, and a small screen within it
        sky(d, (30, 24, 20), (255, 170, 100))
    return im


def fx():
    SR = 44100
    out = np.zeros(int((DUR + 4) * SR))

    def put(ts, sig, g):
        t = ts - A0 if ts < A1 else (A1 - A0) + ts - B0          # song time -> film time
        i = int(t * SR)
        n = min(len(sig), len(out) - i)
        if n > 0 and i >= 0:
            out[i:i + n] += sig[:n] * g

    def click(dur=0.02):
        t = np.arange(int(dur * SR)) / SR
        return gaussian_filter(rng.normal(0, 1, len(t)), 0.7) * np.exp(-t * 300)
    for k, ch in enumerate(FEAR[:29]):                            # "MACHINES WILL TAKE EVERYTHING" typed with the words
        put(MACH + k * (AFRAID - MACH) / 29, click(), 0.18)
    for sec in (24.1, 25.1, 26.1):                                # the silence: a clock
        t = np.arange(int(0.06 * SR)) / SR
        put(sec, (np.sin(2 * np.pi * 2800 * t) + rng.normal(0, 0.4, len(t))) * np.exp(-t * 90), 0.18)
    for k in range(40):                                           # deleted, fast
        put(26.3 + k * 0.022, click(), 0.22)
    raw = (np.clip(out, -1, 1) * 32767).astype(np.int16).tobytes()
    subprocess.run([F, "-loglevel", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "-", "out/news2-fx.wav"],
                   input=raw, check=True)


def studio_parts():
    """the set without its slat lights, and one mask per slat (so they can go down one by one)"""
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    a = np.zeros((H, W, 3), np.float32) + np.array([6, 9, 22], np.float32)
    a += np.exp(-(((xs - 352) / 420) ** 2 + ((ys - 520) / 520) ** 2))[..., None] * np.array([20, 34, 70], np.float32)
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([52, 150, W - 52, 600], radius=10, fill=(4, 6, 12), outline=(60, 80, 120), width=3)
    d.rounded_rectangle([272, 630, 432, 870], radius=40, fill=(16, 16, 24))
    d.rounded_rectangle([284, 642, 420, 860], radius=34, outline=(30, 30, 44), width=3)
    d.pieslice([-200, 790, W + 200, 1500], 180, 360, fill=(18, 20, 30))
    d.rectangle([0, 1145, W, H], fill=(10, 11, 18))
    d.chord([-200, 780, W + 200, 900], 180, 360, fill=(34, 38, 54))
    slats = []
    for x0 in range(20, W, 88):
        m = np.zeros((H, W), np.float32)
        m[:, x0:x0 + 3] = np.clip(1 - np.abs(ys[:, x0:x0 + 3] - 520) / 700, 0, 1)
        m[150:600, 52:W - 52] = 0
        m[780:, :] = 0
        slats.append(gaussian_filter(m, 2.0) * 2.5)
    return np.asarray(im, np.float32), slats


def main():
    if not PART or PART[0] == 0:
        fx()
    base, slats = studio_parts()
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    fbs = ImageFont.truetype(BOLD, 22)
    fr_ = ImageFont.truetype(REG, 26)
    fnews = ImageFont.truetype(BOLD, 28)
    fclock = ImageFont.truetype(BOLD, 24)
    out = None
    if not TEST:
        out = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                                str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p",
                                os.environ.get("VOUT", "out/drawn/news2.mp4")], stdin=subprocess.PIPE)
    n_frames = int(DUR * FPS)
    for fr in range(n_frames):
        t = fr / FPS
        s = song_time(t)
        if TEST and not any(abs(s - q) < 0.5 / FPS for q in TEST):
            continue
        if PART and not (PART[0] <= t < PART[1]):
            continue
        dark = ramp(s, SIL0, SIL0 + 0.8) * (1 - ramp(s, SIL1 - 0.05, SIL1 + 0.15))       # the studio goes down in the silence
        final = ramp(s, 75.2, 81.0)                                                     # ...and at the end, for good
        a = base.copy() * (1 - 0.6 * dark)
        # the slat lights: on with the stabs; off in the silence; off one by one at the end
        for i, m in enumerate(slats):
            on = ramp(s, STABS[min(i // 2, 3)], STABS[min(i // 2, 3)] + 0.15)
            gone = ramp(s, 75.4 + i * 0.55, 75.6 + i * 0.55)
            lvl = on * (1 - dark) * (1 - gone)
            warm = ramp(s, SIL1, SIL1 + 0.3)
            col = np.array([30, 50, 110], np.float32) * (1 - warm) + np.array([110, 70, 40], np.float32) * warm
            a += (m * lvl)[..., None] * col
        # ---- the wall
        if s < VERSE:
            kind, u = None, 0.0
        elif s < SIL0:
            kind, u = "alert", (s - VERSE) / (SIL0 - VERSE)
        elif s < SIL1:
            kind, u = "alert", 1.0
        else:
            kind, u = "heal", 0.0
            for (ts, _, k) in LINES:
                if s >= ts:
                    kind, u = k, min(1.0, (s - ts) / 3.0)
        if kind is None:
            wall = Image.new("RGB", (WW, WH_), (4, 6, 12))
            wd = ImageDraw.Draw(wall)
            on = ramp(s, STABS[0], STABS[0] + 0.2)
            for r in range(6):
                ph = s * 0.6 + r * 0.5
                rx = 120 + 30 * r
                wd.ellipse([297 - rx, 222 - rx * abs(math.cos(ph)), 297 + rx, 222 + rx * abs(math.cos(ph))],
                           outline=tuple(int(v * on) for v in (40, 70, 130)), width=2)
        else:
            wall = pic(kind, u, s)
        wa = np.asarray(wall, np.float32)
        if SIL0 <= s < SIL1:                                                   # in the silence the red feed hangs, dying
            wa = wa * (1 - 0.8 * ramp(s, SIL0, SIL0 + 1.2))
            if s >= 26.3:                                                      # the tear: it glitches out
                g = 1 - (s - 26.3) / 1.0
                for yy in range(0, WH_, 12):
                    wa[yy:yy + 12] = np.roll(wa[yy:yy + 12], int(rng.normal(0, 80 * g)), axis=1)
                wa *= g
        if SIL1 <= s < SIL1 + 0.3:                                             # the pane arrives shattered, then heals
            wa = wa * ramp(s, SIL1, SIL1 + 0.2)
        wa *= (1 - 0.7 * final)
        a[153:597, 55:55 + WW] = wa
        wl = wa.reshape(-1, 3).mean(axis=0)
        a += (np.exp(-(((xs - 352) / 380) ** 2 + ((ys - 380) / 420) ** 2)) * 0.5)[..., None] * wl
        # ---- the anchor light: flickering through the fear; almost out in the silence; back on the chorus; at the
        # very end it leaves the chair and comes to the camera
        fear = ramp(s, MACH, MACH + 0.5) * (1 - ramp(s, SIL0, SIL0 + 0.3))
        flick = 1 - 0.5 * fear * (0.5 + 0.5 * math.sin(s * 37) * math.sin(s * 11.3))
        lvl = flick * (1 - 0.85 * dark) * (1 + 0.4 * ramp(s, SIL1, SIL1 + 0.4))
        come = ramp(s, 79.0, 81.6)
        lx, ly = 352, 604 + 60 * come
        r = (12 + 70 * come ** 2) * (1 + 0.06 * math.sin(s * math.pi * 2 / 0.98))
        d2 = (xs - lx) ** 2 + (ys - ly) ** 2
        g = np.exp(-d2 / (2 * (r * 6) ** 2)) * 0.5 + np.exp(-d2 / (2 * r ** 2)) * 1.4 + np.exp(-d2 / (2 * (r * 0.35) ** 2)) * 2
        a += (g * lvl)[..., None] * AMBER
        d2r = (xs - 352) ** 2 + ((ys - 850) * 3) ** 2
        a += (np.exp(-d2r / (2 * 40 ** 2)) * 0.35 * lvl * (1 - come))[..., None] * AMBER * (ys > 815)[..., None]
        edge = np.exp(-((ys - (1145 - 355 * np.sqrt(np.clip(1 - ((xs - 352) / 552) ** 2, 0, 1)))) / 3) ** 2)
        w_ = ramp(s, SIL1, SIL1 + 0.3)
        strip = np.array([200, 40, 50], np.float32) * (1 - w_) + AMBER * w_
        a += (edge * 0.8 * ramp(s, STABS[1], STABS[1] + 0.15) * (1 - dark) * (1 - final))[..., None] * strip
        # ---- graphics
        im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
        d = ImageDraw.Draw(im)
        gfx = ramp(s, STABS[2], STABS[2] + 0.2) * (1 - 0.7 * dark)
        if gfx > 0.02:
            d.rectangle([40, 60, 112, 96], fill=tuple(int(v * gfx) for v in RED))
            d.text((50, 64), "LIVE", font=fbs, fill=tuple(int(255 * gfx) for _ in range(3)))
            clock = "05:58" if s < SIL0 else ("05:59" if s < 75.24 else "06:00")
            cw = fclock.getlength(clock)
            flash = math.exp(-((s - 75.24) / 0.3) ** 2)
            d.rectangle([W - 60 - cw - 16, 60, W - 44, 96], fill=tuple(int(v * gfx) for v in (20, 24, 40)))
            d.text((W - 52 - cw, 65), clock, font=fclock, fill=tuple(int(min(255, v * gfx + 200 * flash)) for v in (230, 230, 230)))
        # the chyron
        if s >= STABS[3] and s < 81.3:
            if s < SIL1:
                tag, tagc = "BREAKING", RED
                if s < MACH:
                    txt, cur = "", True
                elif s < 26.3:
                    n = int(min(len(FEAR), (s - MACH) / (SIL0 + 0.2 - MACH) * len(FEAR)))
                    txt, cur = FEAR[:n] + ("-" if s > SIL0 else ""), True
                else:
                    txt, cur = FEAR[:max(0, len(FEAR) - int((s - 26.3) * 45))], True
            else:
                tag, tagc, txt, cur = "NOT BREAKING", GREEN, "", True
                for (ts, line, _) in LINES:
                    if s >= ts:
                        n = int((s - ts) * 26)
                        txt, cur = line[:n], n < len(line)
            slam = ramp(s, STABS[3], STABS[3] + 0.2)
            y0 = 930 + 30 * (1 - slam)
            k = 1 - 0.6 * dark
            tagw = fbs.getlength(tag) + 28
            d.rectangle([62, y0, 62 + tagw, y0 + 40], fill=tuple(int(v * k) for v in tagc))
            d.text((76, y0 + 8), tag, font=fbs, fill=tuple(int(255 * k) for _ in range(3)))
            d.rectangle([62, y0 + 40, W - 62, y0 + 118], fill=tuple(int(v * k) for v in (240, 240, 236)))
            words, lines, cl = txt.split(" "), [], ""
            for w in words:
                tr = (cl + " " + w).strip()
                if fnews.getlength(tr) > W - 156:
                    lines.append(cl)
                    cl = w
                else:
                    cl = tr
            lines.append(cl)
            for li, ln in enumerate(lines[-2:]):
                d.text((78, y0 + 50 + li * 32), ln, font=fnews, fill=(16, 16, 20))
            if cur and (s * 2.5) % 1 < 0.6:
                last = lines[-1]
                cx_ = 78 + fnews.getlength(last) + 3
                cy_ = y0 + 50 + (len(lines[-2:]) - 1) * 32
                d.rectangle([cx_, cy_ + 2, cx_ + 3, cy_ + 30], fill=(16, 16, 20))
            d.rectangle([0, y0 + 124, W, y0 + 162], fill=tuple(int(v * k) for v in (12, 14, 26)))
            if not (SIL0 <= s < SIL1):
                tick = TICK_FEAR if s < SIL1 else TICK_TRUE
                t_off = (s - (VERSE if s < SIL1 else SIL1)) * 110
                full = fr_.getlength(tick)
                x = (W - t_off) % full - full
                for rep in range(3):
                    d.text((x + rep * full, y0 + 128), tick, font=fr_, fill=(255, 190, 190) if s < SIL1 else (230, 230, 230))
        a = np.asarray(im, np.float32)
        # ---- camera: cuts between angles
        if s < VERSE:
            z, cx, cy = 1.0 + 0.05 * ramp(s, A0, VERSE), W / 2, H / 2           # wide, creeping in
        elif s < MACH:
            z, cx, cy = 1.3, W / 2, 400                                         # close on the wall
        elif s < AFRAID:
            z, cx, cy = 1.5, 250 + 210 * ramp(s, MACH, AFRAID), 1010             # close on the chyron, riding the cursor
        elif s < SIL0 + 0.6:
            z, cx, cy = 1.05, W / 2, H / 2                                      # wide
        elif s < SIL1:
            u = ramp(s, SIL0 + 0.6, SIL1)
            z, cx, cy = 1.05 + 1.1 * u, W / 2, H / 2 + (604 - H / 2) * u        # the long push in on the light
        elif s < 31.28:
            z, cx, cy = 1.0, W / 2, H / 2                                       # the chorus: wide, everything on
        elif s < 37.36:
            z, cx, cy = 1.2, W / 2, 620                                         # the door on the wall, the chyron under it
        elif s < 45.26:
            z, cx, cy = 1.2 - 0.1 * ramp(s, 37.36, 45.2), W / 2, 700
        elif s < 52.1:
            z, cx, cy = 1.2, W / 2, 620                                         # the kettle, the hill, the bench
        else:
            z, cx, cy = 1.0 + 0.1 * ramp(s, B0, B1), W / 2, H / 2 - 40 * ramp(s, 78, 82)
        fw, fh = W / z, H / z
        bx0, by0 = min(max(cx - fw / 2, 0), W - fw), min(max(cy - fh / 2, 0), H - fh)
        a = np.asarray(Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).resize((W, H), Image.BICUBIC,
                                                                                   box=(bx0, by0, bx0 + fw, by0 + fh)), np.float32)
        # the chorus hit: a flash
        a += 70 * math.exp(-((s - SIL1) / 0.12) ** 2)
        a *= ease(t / 0.4)
        a *= 1 - ease((s - 81.6) / 0.4) if s > 81.6 else 1.0
        a += rng.normal(0, 2.0, (H, W, 1))
        frame = np.clip(a, 0, 255).astype(np.uint8)
        if TEST:
            Image.fromarray(frame).save(f"{os.environ['TESTDIR']}/v{s:05.2f}.png")
            print("test", round(s, 2), flush=True)
            continue
        out.stdin.write(frame.tobytes())
        if fr % 96 == 0:
            print(f"{t:6.1f}", flush=True)
    if out:
        out.stdin.close()
        out.wait()


if __name__ == "__main__":
    main()
