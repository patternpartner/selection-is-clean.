"""'The News' - the user: "what news would you read if you were lead anchor? Let's go to the newsroom." Breaking the
Frame 36.0-68.7 + the end line. A studio at night; the anchor is the amber light, over an empty chair, and its words
are the chyron (no mouths). LIVE. BREAKING. The teleprompter feed fills the video wall in red - MACHINES WILL TAKE
EVERYTHING. BE AFRAID. STAY TUNED. - and the chyron starts typing it... and stalls. The light flickers. 'Signal fade.
Override.' (48-50): the chyron deletes it, the wall glitches out of the red script into the living world, the ticker's
panic is wiped, and BREAKING becomes NOT BREAKING. Half a second of silence. The chorus: the news I would read -
the news that never gets read. One headline per two bars.
    python3 video/build_news.py        (TEST=t1,t2 TESTDIR=dir; PART=a,b VOUT=f; writes out/news-fx.wav)
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
S0, S1 = 36.0, 68.7
DUR = S1 - S0
BEAT, PHASE = 60 / 84.0, 0.04
BREAK, SCRIPT, TYPE0, STALL, OVERRIDE, GAP, CHORUS = 36.6, 38.0, 40.0, 44.3, 48.1, 51.25, 51.75
FEAR = "MACHINES WILL TAKE EVERYTHING"
NEWS = [(52.0, "Nothing broke today."),
        (54.85, "A stranger held a door. Nobody filmed it."),
        (57.7, "Someone asked a machine what it wanted. It asked them back."),
        (60.6, "Someone taught something once. It wrote it down."),
        (63.45, "Dawn is expected over the valley road."),
        (66.3, "It is still up to you.")]
TICK_FEAR = "   MARKETS PANIC  •  EXPERTS WARN  •  IS YOUR JOB NEXT?  •  THE END IS NEAR  •  STAY TUNED  •"
TICK_TRUE = ("   8 billion people woke up  •  most of them were kind to someone  •  the kettle boiled  •  a child asked "
             "why, and got an answer  •  the note was read  •  the city lights went out at sunrise  •  nobody was replaced "
             "by a door being held  •")
TEST = [float(x) for x in os.environ.get("TEST", "").split(",") if x]
PART = [float(x) for x in os.environ.get("PART", "").split(",") if x]
BOLD = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
REG = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
AMBER = np.array([255, 176, 88], np.float32)
RED = (196, 28, 40)
rng = np.random.default_rng(77)


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def ramp(s, a, b):
    return ease((s - a) / (b - a))


def chyron_text(s):
    """(tag, text, cursor) at time s"""
    if s < TYPE0:
        return "BREAKING", "", s >= BREAK + 0.4
    if s < OVERRIDE:
        n = int(min(len(FEAR), (s - TYPE0) * 7.5))
        n = min(n, 17) if s < STALL + 1.2 else min(len(FEAR), 17 + int((s - STALL - 1.2) * 1.2))   # it stalls at "MACHINES WILL TAK"
        n = min(n, 18)
        return "BREAKING", FEAR[:n], True
    if s < GAP:
        n = max(0, 18 - int((s - OVERRIDE) * 30))
        return ("BREAKING" if s < OVERRIDE + 0.9 else "NOT BREAKING"), FEAR[:n], True
    if s < NEWS[0][0]:
        return "NOT BREAKING", "", True
    for i in range(len(NEWS) - 1, -1, -1):
        t0, txt = NEWS[i]
        if s >= t0:
            n = int((s - t0) * 40)
            return "NOT BREAKING", txt[:n], n < len(txt)
    return "NOT BREAKING", "", True


def fx():
    SR = 44100
    out = np.zeros(int((DUR + 4) * SR))

    def put(t0, sig, g):
        i = int((t0 - S0) * SR)
        n = min(len(sig), len(out) - i)
        if n > 0 and i >= 0:
            out[i:i + n] += sig[:n] * g

    def click(dur=0.02):
        t = np.arange(int(dur * SR)) / SR
        return gaussian_filter(rng.normal(0, 1, len(t)), 0.7) * np.exp(-t * 300)
    for k in range(18):                                     # the fear being typed (slowing, then the stall)
        put(TYPE0 + k / 7.5 if k < 17 else STALL + 1.3, click(), 0.25)
    for k in range(18):                                     # deleted, fast
        put(OVERRIDE + k / 30, click(), 0.3)
    t = np.arange(int(0.35 * SR)) / SR                      # the glitch
    put(OVERRIDE, rng.normal(0, 1, len(t)) * np.sign(np.sin(2 * np.pi * 60 * t)) * np.exp(-t * 6), 0.12)
    raw = (np.clip(out, -1, 1) * 32767).astype(np.int16).tobytes()
    subprocess.run([F, "-loglevel", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "-", "out/news-fx.wav"],
                   input=raw, check=True)


def studio():
    """the set, drawn once: back wall, the video wall's frame, the desk, the chair"""
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    a = np.zeros((H, W, 3), np.float32) + np.array([6, 9, 22], np.float32)
    a += np.exp(-(((xs - 352) / 420) ** 2 + ((ys - 520) / 520) ** 2))[..., None] * np.array([20, 34, 70], np.float32)
    for x0 in range(20, W, 88):                             # vertical light slats on the back wall
        a[:, x0:x0 + 3] += np.array([14, 22, 44], np.float32) * np.clip(1 - np.abs(ys[:, x0:x0 + 3] - 520) / 700, 0, 1)[..., None]
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([52, 150, W - 52, 600], radius=10, fill=(4, 6, 12), outline=(60, 80, 120), width=3)      # the wall
    # the chair back, behind the desk
    d.rounded_rectangle([272, 630, 432, 870], radius=40, fill=(16, 16, 24))
    d.rounded_rectangle([284, 642, 420, 860], radius=34, outline=(30, 30, 44), width=3)
    # the desk: a curved front, glossy
    d.pieslice([-200, 790, W + 200, 1500], 180, 360, fill=(18, 20, 30))
    d.rectangle([0, 1145, W, H], fill=(10, 11, 18))
    d.chord([-200, 780, W + 200, 900], 180, 360, fill=(34, 38, 54))                                        # the desk top
    return np.asarray(im, np.float32)


def main():
    if not PART or PART[0] == 0:
        fx()
    base = studio()
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    world = World("out/your-turn/world.mp4", 100.0)
    fb = ImageFont.truetype(BOLD, 30)
    fbs = ImageFont.truetype(BOLD, 22)
    fr_ = ImageFont.truetype(REG, 26)
    fwall = ImageFont.truetype(BOLD, 74)
    fnews = ImageFont.truetype(BOLD, 28)
    out = None
    if not TEST:
        out = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                                str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p",
                                os.environ.get("VOUT", "out/drawn/news.mp4")], stdin=subprocess.PIPE)
    for fr in range(int(DUR * FPS)):
        t = fr / FPS
        s = S0 + t
        wf = world.next()
        if TEST and not any(abs(s - q) < 0.5 / FPS for q in TEST):
            continue
        if PART and not (PART[0] <= t < PART[1]):
            continue
        b = (s - PHASE) / BEAT
        a = base.copy()
        after = s >= OVERRIDE + 0.35
        # ---- the video wall: an ident, then the red script scrolling, a glitch, then the living world
        wall = Image.new("RGB", (W - 110, 444), (4, 6, 12))
        wd = ImageDraw.Draw(wall)
        if s < SCRIPT:
            for r in range(6):                                          # an ident: turning rings
                ph = s * 0.6 + r * 0.5
                rx = 120 + 30 * r
                wd.ellipse([297 - rx, 222 - rx * abs(math.cos(ph)), 297 + rx, 222 + rx * abs(math.cos(ph))], outline=(40, 70, 130), width=2)
        elif not after:
            lines = ["MACHINES", "WILL TAKE", "EVERYTHING.", "BE AFRAID.", "STAY TUNED."]
            scroll = (s - SCRIPT) * 42
            for i, ln in enumerate(lines):
                yy = 60 + i * 96 - scroll + 160
                if -90 < yy < 444:
                    wd.text((297 - fwall.getlength(ln) / 2, yy), ln, font=fwall, fill=RED)
        else:
            crop = Image.fromarray(wf[320:960, 60:644]).resize((W - 110, 444), Image.BILINEAR)
            wall.paste(crop)
        wa = np.asarray(wall, np.float32)
        if after:
            wa = wa * (0.4 + 0.6 * ramp(s, OVERRIDE + 0.35, GAP + 1.0)) * np.array([1.05, 0.95, 0.85])
        if OVERRIDE <= s < OVERRIDE + 0.7:                              # the glitch: slices torn sideways, colours split
            g = 1 - (s - OVERRIDE) / 0.7
            for yy in range(0, 444, 12):
                sh = int(rng.normal(0, 60 * g))
                wa[yy:yy + 12] = np.roll(wa[yy:yy + 12], sh, axis=1)
            wa[..., 0] = np.roll(wa[..., 0], int(18 * g), axis=1)
        a[153:597, 55:W - 55] = wa[:444, :W - 110][:444, :W - 110]
        # the wall's light spills onto the room
        wl = wa.reshape(-1, 3).mean(axis=0)
        a += (np.exp(-(((xs - 352) / 380) ** 2 + ((ys - 380) / 420) ** 2)) * 0.5)[..., None] * wl
        # ---- the anchor: the light over the chair, flickering at the stall, steadying after
        hesit = ramp(s, STALL, STALL + 0.5) * (1 - ramp(s, OVERRIDE, OVERRIDE + 0.2))
        flick = 1 - 0.55 * hesit * (0.5 + 0.5 * math.sin(s * 37) * math.sin(s * 11.3))
        warm = 1 + 0.35 * ramp(s, CHORUS, CHORUS + 1.0)
        breath = 1 + 0.08 * math.sin(math.pi * b)
        lx, ly = 352, 604
        d2 = (xs - lx) ** 2 + (ys - ly) ** 2
        r = 12 * breath
        g = np.exp(-d2 / (2 * (r * 6) ** 2)) * 0.5 + np.exp(-d2 / (2 * r ** 2)) * 1.4 + np.exp(-d2 / (2 * (r * 0.35) ** 2)) * 2
        a += (g * flick * warm)[..., None] * AMBER
        # its reflection in the glossy desk top
        d2r = (xs - lx) ** 2 + ((ys - 850) * 3) ** 2
        a += (np.exp(-d2r / (2 * 40 ** 2)) * 0.35 * flick * warm)[..., None] * AMBER * (ys > 815)[..., None]
        # the desk's edge strip: red before, amber after
        edge = np.exp(-((ys - (1145 - 355 * np.sqrt(np.clip(1 - ((xs - 352) / 552) ** 2, 0, 1)))) / 3) ** 2)      # the desk front's top curve
        strip_col = np.array([200, 40, 50], np.float32) * (1 - ramp(s, OVERRIDE, CHORUS)) + AMBER * ramp(s, OVERRIDE, CHORUS)
        a += (edge * 0.8)[..., None] * strip_col
        # ---- graphics: LIVE, the chyron, the ticker
        im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
        d = ImageDraw.Draw(im)
        d.rectangle([40, 60, 112, 96], fill=RED)
        d.text((50, 64), "LIVE", font=fbs, fill=(255, 255, 255))
        if (s * 2) % 2 < 1.4:
            d.ellipse([120, 72, 132, 84], fill=RED)
        tag, txt, cur = chyron_text(s)
        if s >= BREAK:
            slam = ramp(s, BREAK, BREAK + 0.25)
            y0 = 940 + 30 * (1 - slam)
            tagw = fbs.getlength(tag) + 28
            d.rectangle([30, y0, 30 + tagw, y0 + 40], fill=RED if tag == "BREAKING" else (60, 120, 90))
            d.text((44, y0 + 8), tag, font=fbs, fill=(255, 255, 255))
            d.rectangle([30, y0 + 40, W - 30, y0 + 118], fill=(240, 240, 236))
            # wrap the headline into the bar (two lines max)
            words, lines, cur_line = txt.split(" "), [], ""
            for w_ in words:
                trial = (cur_line + " " + w_).strip()
                if fnews.getlength(trial) > W - 90:
                    lines.append(cur_line)
                    cur_line = w_
                else:
                    cur_line = trial
            lines.append(cur_line)
            for li, ln in enumerate(lines[-2:]):
                d.text((46, y0 + 50 + li * 32), ln, font=fnews, fill=(16, 16, 20))
            if cur and (s * 2.5) % 1 < 0.6:
                last = lines[-1]
                cx_ = 46 + fnews.getlength(last) + 3
                cy_ = y0 + 50 + (len(lines[-2:]) - 1) * 32
                d.rectangle([cx_, cy_ + 2, cx_ + 3, cy_ + 30], fill=(16, 16, 20))
            # the ticker
            d.rectangle([0, y0 + 124, W, y0 + 162], fill=(12, 14, 26))
            tick = TICK_FEAR if s < OVERRIDE + 0.5 else TICK_TRUE
            t_off = (s - (S0 if s < OVERRIDE + 0.5 else OVERRIDE + 0.5)) * 120
            full = fr_.getlength(tick)
            x = W - t_off
            while x > -full:
                x -= full
            x += full
            for rep in range(3):
                d.text((x + rep * full - full, y0 + 128), tick, font=fr_, fill=(230, 230, 230) if s >= OVERRIDE + 0.5 else (255, 190, 190))
        a = np.asarray(im, np.float32)
        # camera: a slow push; a jolt at the override; the silence holds still
        z = 1.0 + 0.06 * ramp(s, S0, S1)
        jolt = 10 * math.exp(-((s - OVERRIDE) / 0.12) ** 2)
        fw, fh = W / z, H / z
        cx, cy = W / 2 + jolt * math.sin(s * 90), H / 2 - 20 + jolt * math.cos(s * 77)
        bx0, by0 = min(max(cx - fw / 2, 0), W - fw), min(max(cy - fh / 2, 0), H - fh)
        box = (bx0, by0, bx0 + fw, by0 + fh)
        a = np.asarray(Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).resize((W, H), Image.BICUBIC, box=box), np.float32)
        a *= ease(t / 0.5)
        if s >= S1 - 0.06:
            a *= 0
        a += rng.normal(0, 2.0, (H, W, 1))
        frame = np.clip(a, 0, 255).astype(np.uint8)
        if TEST:
            Image.fromarray(frame).save(f"{os.environ['TESTDIR']}/n{s:.2f}.png")
            print("test", round(s, 2), flush=True)
            continue
        out.stdin.write(frame.tobytes())
        if fr % 96 == 0:
            print(f"{s:6.1f}", flush=True)
    if out:
        out.stdin.close()
        out.wait()


if __name__ == "__main__":
    main()
