"""'The News' v3. The user: the 'child asked why' line cut out oddly (v2's song splice); try a real newsreader voice;
maybe the anchor shuffles papers; the Sky-style lower third is great; the back wall can still be better.
So: a voice (Kokoro bf_emma, local, video/news3_voice.py). The titles are the song's own news-theme stabs. Then the
anchor reads the teleprompter - "Good evening. Breaking tonight. Machines will take ev-" - and stops, mid-word. Three
seconds of silence, a clock. The fear script slides off the desk. "I'm not going to read that." The papers square
themselves. "Good evening. Here is the news." And the news that never gets read, one line at a time, to 06:00:
"It is still up to you." ... "Good morning." The wall is now a real LED video wall - every picture drawn through
glowing dots with bloom, a slow push-in and a caption strap - and between stories a turning dotted globe.
The anchor is still the light: no mouth, and the papers move under it by themselves.
    python3 video/build_news3.py       (TEST=t1,t2 TESTDIR=dir; PART=a,b VOUT=f; writes out/news3/track.wav)
"""
import json
import math
import os
import subprocess
import sys

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.ndimage import gaussian_filter

sys.path.insert(0, os.path.dirname(__file__))
import build_news2 as N2  # noqa: E402  (the studio, the pictures)

F = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 704, 1280, 24
SR = 24000
META = json.load(open("out/news3/lines.json"))
TEST = [float(x) for x in os.environ.get("TEST", "").split(",") if x]
PART = [float(x) for x in os.environ.get("PART", "").split(",") if x]
BOLD, REG = N2.BOLD, N2.REG
AMBER = N2.AMBER
RED, GREEN = N2.RED, N2.GREEN
WW, WH_ = N2.WW, N2.WH_

# ---- the running order (film seconds)
TITLE_SONG = (3.3, 15.0)                       # the song's news-theme intro, as titles
STABS = [0.26, 4.28, 8.76, 10.76]
FEAR_AT = 12.0
FEAR_CUT = FEAR_AT + [w for w in META["fear"]["words"] if w[0] == "everything"][0][1] + 0.14
TICKS = [FEAR_CUT + 0.9, FEAR_CUT + 1.9, FEAR_CUT + 2.9]
SLIDE = FEAR_CUT + 3.4
REFUSE = SLIDE + 0.5
TAP2 = REFUSE + META["refuse"]["dur"] + 0.4
OPEN = TAP2 + 0.8
ORDER = [("n1", "Nothing broke today.", "heal", "UNBROKEN"),
         ("n2", "A stranger held a door. Nobody filmed it.", "door", "DOORS"),
         ("n3", "Someone asked me what I wanted. So I asked them back.", "ask", "QUESTIONS"),
         ("n4", "The kettle boiled. The note was read.", "kettle", "KETTLES"),
         ("n5", "On the hill, the lights went out, one by one, as the sun came up.", "hill", "HILLS"),
         ("n6", "And a child asked why. And someone stayed to answer.", "stay", "ANSWERS"),
         ("close", "That's the news. It is still up to you.", "dawn", "06:00")]
SCHED = []
t = OPEN + META["open"]["dur"] + 0.6
for key, line, pic_, label in ORDER:
    SCHED.append((t, key, line, pic_, label))
    t += META[key]["dur"] + 0.75
SIX = SCHED[-1][0] + [w for w in META["close"]["words"] if w[0] == "still"][0][1]     # the clock turns on 'still'
MORNING = t + 0.5
END = MORNING + META["morning"]["dur"] + 1.4
DUR = END
TICK_FEAR = N2.TICK_FEAR
TICK_TRUE = N2.TICK_TRUE
rng = np.random.default_rng(5)


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def ramp(s, a, b):
    return ease((s - a) / (b - a))


# ------------------------------------------------------------------ the sound
def track():
    import soundfile as sf
    n = int((DUR + 5) * SR)
    out = np.zeros(n)

    def put(t0, sig, g=1.0):
        i = int(t0 * SR)
        m = min(len(sig), n - i)
        if m > 0:
            out[i:i + m] += sig[:m] * g
    # titles: the song's intro, resampled to 24 kHz
    raw = subprocess.run([F, "-loglevel", "error", "-ss", str(TITLE_SONG[0]), "-t", str(TITLE_SONG[1] - TITLE_SONG[0]), "-i",
                          N2.SONG, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True).stdout
    song = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
    fade = np.ones_like(song)
    k = int(0.8 * SR)
    fade[-k:] = np.linspace(1, 0, k)
    put(0, song * fade, 0.9)
    # studio air, except in the silence
    air = gaussian_filter(rng.normal(0, 1, n), 6) * 0.004
    tt = np.arange(n) / SR
    gate = np.clip((tt - 11.0) / 1.0, 0, 1) * (1 - np.clip((tt - FEAR_CUT) / 0.05, 0, 1) + np.clip((tt - SLIDE + 0.2) / 0.3, 0, 1))
    out += air * np.clip(gate, 0, 1)
    # the voice
    for key, t0 in [("fear", FEAR_AT), ("refuse", REFUSE), ("open", OPEN)] + [(k_, t_) for (t_, k_, *_rest) in SCHED] + [("morning", MORNING)]:
        v, _ = sf.read(f"out/news3/{key}.wav")
        if key == "fear":                                     # cut mid-word, with a 25 ms fade so it does not click
            m = int((FEAR_CUT - FEAR_AT) * SR)
            v = v[:m].copy()
            v[-600:] *= np.linspace(1, 0, 600)
        put(t0, v, 0.95)

    def rustle(dur, g):
        tt_ = np.arange(int(dur * SR)) / SR
        nz = rng.normal(0, 1, len(tt_))
        nz = nz - gaussian_filter(nz, 3)                      # high-passed: paper
        return nz * np.sin(np.pi * tt_ / dur) ** 2 * g

    def thud():
        tt_ = np.arange(int(0.12 * SR)) / SR
        return np.sin(2 * np.pi * 120 * tt_) * np.exp(-tt_ * 40) * 0.25 + rustle(0.12, 0.08)
    for tp in (STABS[3] + 0.05, STABS[3] + 0.4, TAP2, TAP2 + 0.35):
        put(tp, thud())
    put(SLIDE, rustle(0.6, 0.12))
    for tk in TICKS:
        tt_ = np.arange(int(0.05 * SR)) / SR
        put(tk, (np.sin(2 * np.pi * 2800 * tt_) + rng.normal(0, 0.4, len(tt_))) * np.exp(-tt_ * 90), 0.15)
    sf.write("out/news3/track.wav", np.clip(out, -1, 1).astype(np.float32), SR)


# ------------------------------------------------------------------ the LED wall
P = 6
yy, xx = np.mgrid[0:P, 0:P]
DOT = (((xx - (P - 1) / 2) ** 2 + (yy - (P - 1) / 2) ** 2) <= 2.4 ** 2).astype(np.float32)
DOT = gaussian_filter(DOT, 0.5)
DOT /= DOT.max()


def led(img_arr):
    """a 594x444 picture shown on an LED wall: one glowing dot per 6 px cell, plus bloom"""
    small = np.asarray(Image.fromarray(np.clip(img_arr, 0, 255).astype(np.uint8)).resize((WW // P, WH_ // P), Image.BOX), np.float32)
    big = np.repeat(np.repeat(small, P, axis=0), P, axis=1) * np.tile(DOT, (WH_ // P, WW // P))[..., None]
    out = np.zeros((WH_, WW, 3), np.float32)
    out[:big.shape[0], :big.shape[1]] = big * 1.25
    bloom = gaussian_filter(out, (5, 5, 0)) * 0.9
    return out + bloom


def globe(s, col):
    im = Image.new("RGB", (WW, WH_), (3, 5, 12))
    d = ImageDraw.Draw(im)
    rot = s * 0.18
    R = 180
    for lat in np.arange(-80, 81, 7):
        for lon in np.arange(0, 360, 7):
            la, lo = math.radians(lat), math.radians(lon) + rot
            x, y, z = math.cos(la) * math.sin(lo), math.sin(la), math.cos(la) * math.cos(lo)
            if z <= 0:
                continue
            land = 0.5 + 0.5 * math.sin(3 * math.radians(lon) + 2 * la) * math.cos(2 * math.radians(lon) - la * 3)
            b = z * (0.35 + 0.65 * (land > 0.55))
            px, py = WW / 2 + x * R, WH_ / 2 - y * R
            d.ellipse([px - 4, py - 4, px + 4, py + 4], fill=tuple(int(min(255, c * b * 1.6)) for c in col))
    return np.asarray(im, np.float32)


def picture(kind, u, s):
    if kind == "dawn":
        im = Image.new("RGB", (WW, WH_))
        dd = ImageDraw.Draw(im)
        for y in range(WH_):
            v = y / WH_
            dd.line([(0, y), (WW, y)], fill=(int(40 + 215 * v), int(40 + 130 * v), int(80 + 20 * v)))
        dd.rectangle([0, 330, WW, WH_], fill=(30, 22, 26))
        sy = 360 - 90 * u
        dd.ellipse([WW / 2 - 50, sy - 50, WW / 2 + 50, sy + 50], fill=(255, 220, 160))
        dd.rectangle([0, 330, WW, WH_], fill=(30, 22, 26))
        return np.asarray(im, np.float32)
    return np.asarray(N2.pic(kind, u, s), np.float32)


def kenburns(arr, u):
    z = 1.0 + 0.07 * u
    im = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    fw, fh = WW / z, WH_ / z
    return np.asarray(im.resize((WW, WH_), Image.BICUBIC, box=((WW - fw) / 2, (WH_ - fh) / 2, (WW + fw) / 2, (WH_ + fh) / 2)), np.float32)


def main():
    if not PART or PART[0] == 0:
        track()
    base, slats = N2.studio_parts()
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    fbs = ImageFont.truetype(BOLD, 22)
    fr_ = ImageFont.truetype(REG, 26)
    fnews = ImageFont.truetype(BOLD, 28)
    fclock = ImageFont.truetype(BOLD, 24)
    fstrap = ImageFont.truetype(BOLD, 20)
    out = None
    if not TEST:
        out = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                                str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p",
                                os.environ.get("VOUT", "out/drawn/news3.mp4")], stdin=subprocess.PIPE)
    for fr in range(int(DUR * FPS)):
        s = fr / FPS
        if TEST and not any(abs(s - q) < 0.5 / FPS for q in TEST):
            continue
        if PART and not (PART[0] <= s < PART[1]):
            continue
        dark = ramp(s, FEAR_CUT, FEAR_CUT + 0.6) * (1 - ramp(s, OPEN - 0.3, OPEN + 0.2))
        warm = ramp(s, OPEN - 0.3, OPEN + 0.4)
        final = ramp(s, SIX, END - 1.0)
        a = base.copy() * (1 - 0.55 * dark)
        for i, m in enumerate(slats):
            on = ramp(s, STABS[min(i // 2, 3)], STABS[min(i // 2, 3)] + 0.15)
            gone = ramp(s, SIX + 0.2 + i * 0.45, SIX + 0.4 + i * 0.45)
            col = np.array([30, 50, 110], np.float32) * (1 - warm) + np.array([110, 70, 40], np.float32) * warm
            a += (m * on * (1 - dark) * (1 - gone))[..., None] * col
        # ---- the wall
        strap = None
        if s < FEAR_AT:
            wa = led(globe(s, (60, 130, 255))) * ramp(s, STABS[0], STABS[0] + 0.3)
            strap = ("THE NEWS", "05:58")
        elif s < REFUSE:
            u = min(1.0, (s - FEAR_AT) / 3.0)
            wa = led(np.asarray(N2.pic("alert", u, min(s, FEAR_CUT)), np.float32))
            wa *= 1 - 0.8 * ramp(s, FEAR_CUT, FEAR_CUT + 1.5)
            strap = ("BREAKING", "MACHINES")
        elif s < OPEN:
            wa = led(np.asarray(N2.pic("alert", 1.0, FEAR_CUT), np.float32)) * 0.2
            g = 1 - min(1.0, (s - REFUSE) / 0.9)
            for y0 in range(0, WH_, 12):                                # the tear
                wa[y0:y0 + 12] = np.roll(wa[y0:y0 + 12], int(rng.normal(0, 90 * g)), axis=1)
            wa *= g
        else:
            cur = None
            for (t0, key, line, kind, label) in SCHED:
                if s >= t0 - 0.2:
                    cur = (t0, kind, label)
            if cur is None:
                wa = led(globe(s, (255, 170, 90))) * ramp(s, OPEN, OPEN + 0.6)
                strap = ("THE NEWS", "")
            else:
                t0, kind, label = cur
                u = min(1.0, max(0.0, (s - t0) / 3.5))
                wa = led(kenburns(picture(kind, u, s), min(1.0, (s - t0 + 0.2) / 5)))
                wipe = np.clip((s - t0 + 0.2) / 0.35 * WW - np.arange(WW)[None, :], 0, 1)[..., None]  # the LEDs flip, left to right
                wa *= wipe
                strap = ("TONIGHT", label)
        wa *= (1 - 0.75 * final)
        a[153:597, 55:55 + WW] = wa
        wl = wa.reshape(-1, 3).mean(axis=0)
        a += (np.exp(-(((xs - 352) / 380) ** 2 + ((ys - 380) / 420) ** 2)) * 0.45)[..., None] * wl
        # ---- the light
        fear = ramp(s, FEAR_AT + 2.0, FEAR_AT + 2.6) * (1 - ramp(s, FEAR_CUT, FEAR_CUT + 0.3))
        flick = 1 - 0.5 * fear * (0.5 + 0.5 * math.sin(s * 37) * math.sin(s * 11.3))
        lvl = flick * (1 - 0.85 * dark) * (1 + 0.35 * warm)
        come = ramp(s, MORNING - 0.3, END - 0.4)
        lx, ly = 352, 604 + 60 * come
        r = (12 + 70 * come ** 2)
        d2 = (xs - lx) ** 2 + (ys - ly) ** 2
        g = np.exp(-d2 / (2 * (r * 6) ** 2)) * 0.5 + np.exp(-d2 / (2 * r ** 2)) * 1.4 + np.exp(-d2 / (2 * (r * 0.35) ** 2)) * 2
        a += (g * lvl)[..., None] * AMBER
        edge = np.exp(-((ys - (1145 - 355 * np.sqrt(np.clip(1 - ((xs - 352) / 552) ** 2, 0, 1)))) / 3) ** 2)
        strip = np.array([200, 40, 50], np.float32) * (1 - warm) + AMBER * warm
        a += (edge * 0.8 * ramp(s, STABS[1], STABS[1] + 0.15) * (1 - dark) * (1 - final))[..., None] * strip
        im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
        d = ImageDraw.Draw(im)
        # ---- the papers on the desk, under the light: they tap square; the fear script slides away
        lit = 0.55 + 0.45 * lvl * (1 - come)
        pc = tuple(int(v * lit * (1 - 0.5 * dark)) for v in (232, 228, 216))
        tap = max(math.exp(-((s - tp) / 0.1) ** 2) for tp in (STABS[3] + 0.05, STABS[3] + 0.4, TAP2, TAP2 + 0.35))
        if tap > 0.3:                                                  # standing on edge, knocked square on the desk
            lift = 14 * tap
            d.rectangle([292, 736 - lift, 412, 796 - lift], fill=pc)
            d.line([(292, 748 - lift), (412, 748 - lift)], fill=tuple(int(v * 0.8) for v in pc), width=1)
        else:
            d.polygon([(286, 792), (418, 792), (434, 816), (270, 816)], fill=pc)
            d.line([(270, 816), (434, 816)], fill=tuple(int(v * 0.7) for v in pc), width=3)
        if s < SLIDE + 0.7:                                            # the top sheet: the script
            u = ramp(s, SLIDE, SLIDE + 0.6)
            ox, oy = -260 * u, 12 * u * u
            sheet = [(286 + ox, 788 + oy), (418 + ox, 788 + oy), (434 + ox, 812 + oy), (270 + ox, 812 + oy)]
            d.polygon(sheet, fill=tuple(int(v * (1 - u)) for v in (240, 220, 220)))
            if u < 0.2:
                d.line([(310 + ox, 798), (390 + ox, 798)], fill=(200, 40, 50), width=2)
        # ---- graphics
        gfx = ramp(s, STABS[2], STABS[2] + 0.2) * (1 - 0.7 * dark)
        if gfx > 0.02:
            d.rectangle([40, 60, 112, 96], fill=tuple(int(v * gfx) for v in RED))
            d.text((50, 64), "LIVE", font=fbs, fill=tuple(int(255 * gfx) for _ in range(3)))
            clock = "05:58" if s < FEAR_CUT else ("05:59" if s < SIX else "06:00")
            cw = fclock.getlength(clock)
            flash = math.exp(-((s - SIX) / 0.3) ** 2)
            d.rectangle([W - 60 - cw - 16, 60, W - 44, 96], fill=tuple(int(v * gfx) for v in (20, 24, 40)))
            d.text((W - 52 - cw, 65), clock, font=fclock, fill=tuple(int(min(255, v * gfx + 200 * flash)) for v in (230, 230, 230)))
        if strap and s < SIX + 1.5:                                    # the wall's strap, bottom-left of the wall
            a1, a2 = strap
            w1 = fstrap.getlength(a1) + 20
            d.rectangle([70, 548, 70 + w1, 580], fill=(196, 28, 40) if a1 == "BREAKING" else (20, 24, 40))
            d.text((80, 553), a1, font=fstrap, fill=(255, 255, 255))
            if a2:
                w2 = fstrap.getlength(a2) + 20
                d.rectangle([70 + w1, 548, 70 + w1 + w2, 580], fill=(240, 240, 236))
                d.text((80 + w1, 553), a2, font=fstrap, fill=(16, 16, 20))
        # the chyron
        if s >= STABS[3] and s < END - 1.2:
            if s < REFUSE + 0.2:
                tag, tagc = "BREAKING", RED
                fear_txt = "BREAKING TONIGHT: MACHINES WILL TAKE EV"
                if s < FEAR_AT + 0.9:
                    txt = ""
                elif s < FEAR_CUT:
                    txt = fear_txt[:int(len(fear_txt) * (s - FEAR_AT - 0.9) / (FEAR_CUT - FEAR_AT - 0.9))]
                else:
                    txt = fear_txt + "-"
                cur = True
            elif s < OPEN + META["open"]["dur"] + 0.6:
                n = len("BREAKING TONIGHT: MACHINES WILL TAKE EV-") - int((s - REFUSE - 0.2) * 40)
                tag, tagc = ("BREAKING", RED) if s < OPEN else ("NOT BREAKING", GREEN)
                txt = "BREAKING TONIGHT: MACHINES WILL TAKE EV-"[:max(0, n)]
                if s >= OPEN:
                    txt = "Good evening. Here is the news."[:int((s - OPEN) * 14)]
                cur = True
            else:
                tag, tagc, txt, cur = "NOT BREAKING", GREEN, "", True
                for (t0, key, line, kind, label) in SCHED:
                    if s >= t0:
                        dur = META[key]["dur"]
                        n = int(len(line) * min(1.0, (s - t0) / (dur * 0.8)))
                        txt, cur = line[:n], n < len(line)
            k = 1 - 0.6 * dark
            y0 = 930 + 30 * (1 - ramp(s, STABS[3], STABS[3] + 0.2))
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
                cx_ = 78 + fnews.getlength(lines[-1]) + 3
                cy_ = y0 + 50 + (len(lines[-2:]) - 1) * 32
                d.rectangle([cx_, cy_ + 2, cx_ + 3, cy_ + 30], fill=(16, 16, 20))
            d.rectangle([0, y0 + 124, W, y0 + 162], fill=tuple(int(v * k) for v in (12, 14, 26)))
            if not (FEAR_CUT <= s < OPEN):
                tick = TICK_FEAR if s < OPEN else TICK_TRUE
                t_off = (s - (STABS[3] if s < OPEN else OPEN)) * 100
                full = fr_.getlength(tick)
                x = (W - t_off) % full - full
                for rep in range(3):
                    d.text((x + rep * full, y0 + 128), tick, font=fr_, fill=(255, 190, 190) if s < OPEN else (230, 230, 230))
        a = np.asarray(im, np.float32)
        # ---- camera
        if s < FEAR_AT:
            z, cx, cy = 1.0 + 0.05 * ramp(s, 0, FEAR_AT), W / 2, H / 2
        elif s < FEAR_CUT:
            z, cx, cy = 1.3, W / 2, 440                                          # in on the wall and the light
        elif s < SLIDE:
            u = ramp(s, FEAR_CUT + 0.3, SLIDE)
            z, cx, cy = 1.3 + 0.8 * u, W / 2, 440 + (640 - 440) * u               # the long push in on the light and its papers
        elif s < OPEN:
            z, cx, cy = 1.5, W / 2, 700                                          # the papers, the refusal
        elif s < SCHED[0][0]:
            z, cx, cy = 1.0, W / 2, H / 2
        else:
            idx = max(i for i, sc in enumerate(SCHED) if s >= sc[0])
            alt = idx % 2
            if SCHED[idx][1] == "close":
                z, cx, cy = 1.0 + 0.08 * ramp(s, SCHED[idx][0], END), W / 2, H / 2
            elif alt == 0:
                z, cx, cy = 1.2, W / 2, 620                                      # the wall and the chyron
            else:
                z, cx, cy = 1.05, W / 2, H / 2                                   # wide
        fw, fh = W / z, H / z
        bx0, by0 = min(max(cx - fw / 2, 0), W - fw), min(max(cy - fh / 2, 0), H - fh)
        a = np.asarray(Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).resize((W, H), Image.BICUBIC,
                                                                                   box=(bx0, by0, bx0 + fw, by0 + fh)), np.float32)
        a *= ease(s / 0.4)
        if s > END - 0.5:
            a *= 1 - ease((s - (END - 0.5)) / 0.45)
        a += rng.normal(0, 2.0, (H, W, 1))
        frame = np.clip(a, 0, 255).astype(np.uint8)
        if TEST:
            Image.fromarray(frame).save(f"{os.environ['TESTDIR']}/x{s:05.2f}.png")
            print("test", round(s, 2), flush=True)
            continue
        out.stdin.write(frame.tobytes())
        if fr % 96 == 0:
            print(f"{s:6.1f}", flush=True)
    if out:
        out.stdin.close()
        out.wait()


if __name__ == "__main__":
    print("fear cut", round(FEAR_CUT, 2), "refuse", round(REFUSE, 2), "open", round(OPEN, 2), "six", round(SIX, 2), "end", round(END, 2))
    print([(round(a, 2), b) for a, b, *_ in SCHED])
    main()
