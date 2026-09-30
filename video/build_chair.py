"""'The Chair' - the second film with the user in it (u114, keyed with video/bluekey.py). No Ground 50.0-69.5: the band
drops to near silence at 56.5-61.5 and crashes back at 61.8. On the dark stage from 'The Lesson', he stands with the
amber light beside him. He shrugs - why not - and sits down, without looking, on nothing. In the silence it happens in
slow motion (the clip's half-second sit stretched over 5.8 s, adjacent frames blended), and the light, which has been
watching, notices - flickers - races in, and draws a chair of light under him stroke by stroke (back posts, top rail,
seat, legs), finishing exactly as he lands, on the crash. He sits, easy, trusting it. Then he stands and bows - to the
chair - and the chair melts back into the light, which dips a bow of its own; ta-da, the two of them.
    python3 video/build_chair.py       (TEST=t1,t2 TESTDIR=dir in SONG seconds; PART=a,b VOUT=f in film seconds;
                                        writes out/chair-fx.wav)
"""
import math
import os
import subprocess
import sys

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import gaussian_filter

sys.path.insert(0, os.path.dirname(__file__))
from bluekey import key  # noqa: E402

F = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 704, 1280, 24
S0, S1 = 50.0, 69.5
DUR = S1 - S0
BEAT, PHASE = 60 / 82.65, 0.02
SHRUG, SIT0, NOTICE, RACE, DRAW0, LAND, BOW0, TADA, REST = 54.5, 56.0, 59.4, 59.8, 60.3, 61.8, 65.5, 66.3, 67.5
TEST = [float(x) for x in os.environ.get("TEST", "").split(",") if x]
PART = [float(x) for x in os.environ.get("PART", "").split(",") if x]
AMBER = np.array([255, 176, 88], np.float32)
SC = 0.62                                              # clip px -> screen px (his standing height 1223 -> 760)
CW, CH = int(720 * SC) // 2 * 2, int(1280 * SC) // 2 * 2
FEET_Y = 1110
OX, OY = W / 2 - 353 * SC, FEET_Y - 1251 * SC         # clip (353, 1251) = between his feet -> screen
# the chair, in clip px (drawn behind him): back posts, top rail, seat front, legs - in drawing order
CHAIR = [((215, 440), (222, 800)), ((215, 440), (360, 424)), ((360, 424), (505, 440)), ((505, 440), (498, 800)),
         ((222, 610), (498, 610)),                                                   # back: posts, curved top rail, a slat
         ((222, 800), (498, 800)), ((498, 800), (535, 852)), ((535, 852), (185, 852)), ((185, 852), (222, 800)),   # seat
         ((190, 852), (174, 1245)), ((530, 852), (546, 1245)), ((226, 804), (236, 1212)), ((494, 804), (484, 1212))]  # legs
rng = np.random.default_rng(3)


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def ramp(s, a, b):
    return ease((s - a) / (b - a))


def to_screen(p):
    return OX + p[0] * SC, OY + p[1] * SC


def clip_time(s):
    """song time -> time in u114 (the sit is stretched into the silence)"""
    if s < SHRUG:
        return (s - S0) * 0.4
    if s < SIT0:
        return 2.0 + (s - SHRUG)
    if s < LAND:
        return 3.5 + (s - SIT0) / (LAND - SIT0) * 0.8
    if s < REST:
        return 4.3 + (s - LAND) * (3.7 / (BOW0 - LAND)) if s < BOW0 else 8.0 + (s - BOW0) * 1.0
    return min(11.5, 10.0 + (s - REST))


def load_frames():
    raw = subprocess.run([F, "-loglevel", "error", "-ss", "0", "-t", "11.6", "-i", "out/user-clips/u114.mp4", "-map", "0:v:0",
                          "-vf", f"fps={FPS},scale={CW}:{CH}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, CH, CW, 3)


def fx():
    SR = 44100
    out = np.zeros(int((DUR + 4) * SR))

    def put(ts, sig, g):
        i = int((ts - S0) * SR)
        n = min(len(sig), len(out) - i)
        if n > 0 and i >= 0:
            out[i:i + n] += sig[:n] * g
    t = np.arange(int(0.5 * SR)) / SR                      # the race: a soft rising whoosh
    n = gaussian_filter(rng.normal(0, 1, len(t)), 2)
    put(RACE, n * np.sin(np.pi * t / 0.5) ** 2, 0.25)
    for k, (a, b) in enumerate(CHAIR):                     # each stroke of the chair: a small bright glassy tick
        ts = DRAW0 + (LAND - DRAW0) * k / len(CHAIR)
        tt = np.arange(int(0.4 * SR)) / SR
        put(ts, np.sin(2 * np.pi * (1320 + 110 * k) * tt) * np.exp(-tt * 12), 0.06)
    raw = (np.clip(out, -1, 1) * 32767).astype(np.int16).tobytes()
    subprocess.run([F, "-loglevel", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "-", "out/chair-fx.wav"],
                   input=raw, check=True)


def main():
    if not PART or PART[0] == 0:
        fx()
    frames = load_frames()
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    seg_len = [math.dist(a, b) for a, b in CHAIR]
    total = sum(seg_len)
    out = None
    if not TEST:
        out = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                                str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p",
                                os.environ.get("VOUT", "out/drawn/chair.mp4")], stdin=subprocess.PIPE)
    for fr in range(int(DUR * FPS)):
        t = fr / FPS
        s = S0 + t
        if TEST and not any(abs(s - q) < 0.5 / FPS for q in TEST):
            continue
        if PART and not (PART[0] <= t < PART[1]):
            continue
        b = (s - PHASE) / BEAT
        # ---- him (adjacent frames blended in the slow motion)
        ct = clip_time(s) * FPS
        i0 = int(min(len(frames) - 2, ct))
        f = ct - i0
        img = frames[i0].astype(np.float32) * (1 - f) + frames[i0 + 1].astype(np.float32) * f
        rgb, al = key(img)
        person = np.zeros((H, W, 3), np.float32)
        alpha = np.zeros((H, W), np.float32)
        x0, y0 = int(round(OX)), int(round(OY))
        ya, yb, xa, xb = max(0, y0), min(H, y0 + CH), max(0, x0), min(W, x0 + CW)
        person[ya:yb, xa:xb] = rgb[ya - y0:yb - y0, xa - x0:xb - x0]
        alpha[ya:yb, xa:xb] = al[ya - y0:yb - y0, xa - x0:xb - x0]
        # ---- the chair of light: drawn up to `drawn` of its length; glowing while he sits; melting on the bow
        drawn = ramp(s, DRAW0, LAND) ** 0.9 if s < BOW0 else 1.0
        melt = ramp(s, BOW0, TADA)
        pen = None
        chair = Image.new("L", (W, H), 0)
        cd = ImageDraw.Draw(chair)
        acc = 0.0
        for (a, c), ln in zip(CHAIR, seg_len):
            fa = (drawn * total - acc) / ln
            acc += ln
            if fa <= 0:
                break
            fa = min(1.0, fa)
            pa, pc = to_screen(a), to_screen(c)
            pe = (pa[0] + (pc[0] - pa[0]) * fa, pa[1] + (pc[1] - pa[1]) * fa)
            cd.line([pa, pe], fill=255, width=4)
            if fa < 1.0:
                pen = pe
        ch = np.asarray(chair, np.float32) / 255
        if melt > 0:                                      # it melts: brightness drains upward, bits of it rise as sparks
            ch = ch * (1 - melt) * np.clip(1 - (ys - (FEET_Y - 700 * melt)) / 200, 0, 1) ** 0 * (1 - melt)
        chair_glow = gaussian_filter(ch, 6) * 2.5 + ch * 1.2
        flare = math.exp(-((s - LAND) / 0.18) ** 2)
        pulse = 1 + 0.12 * math.exp(-((b % 1) / 0.15)) if LAND <= s < BOW0 else 1.0
        # ---- the light: beside him; notices; races to the chair's first corner; is the pen; then (after the melt) back
        home = (W / 2 + 200, FEET_Y - 560 + 10 * math.sin(s * 1.7))
        start = to_screen(CHAIR[0][0])
        seat_c = to_screen(((215 + 505) / 2, 845))
        if s < RACE:
            L = home
            flick = 1 - 0.5 * math.exp(-((s - NOTICE) / 0.12) ** 2)
        elif s < DRAW0:
            u = ramp(s, RACE, DRAW0)
            L = (home[0] + (start[0] - home[0]) * u, home[1] + (start[1] - home[1]) * u - 80 * math.sin(math.pi * u))
            flick = 1.0
        elif s < LAND:
            L = pen if pen is not None else to_screen(CHAIR[-1][1])
            flick = 1.0
        elif s < BOW0:
            L = None                                       # it IS the chair
            flick = 1.0
        else:
            u = ramp(s, BOW0, BOW0 + 0.5)
            dip = 40 * math.sin(math.pi * ramp(s, BOW0 + 0.2, TADA))       # its own bow
            up = 220 * ramp(s, TADA, TADA + 0.5)
            L = (seat_c[0] + (home[0] - seat_c[0]) * ramp(s, TADA, REST), seat_c[1] - 60 * u + dip - up)
            flick = u
        # ---- compose: stage, chair behind him, him (lit dim + the chair's and the light's warmth), the light
        a = np.zeros((H, W, 3), np.float32) + np.array([4, 4, 7], np.float32)
        cone = np.clip(1 - np.abs(xs - W / 2) / (60 + (ys / H) * 330), 0, 1) ** 1.5 * 0.10
        a += cone[..., None] * np.array([150, 140, 160], np.float32)
        a += np.exp(-(((xs - W / 2) / 300) ** 2 + ((ys - FEET_Y) / 50) ** 2))[..., None] * np.array([70, 64, 70], np.float32)
        a *= 1 - 0.7 * np.exp(-(((xs - W / 2) / 110) ** 2 + ((ys - FEET_Y + 4) / 12) ** 2))[..., None]
        a += (chair_glow * pulse * (1 + 1.5 * flare))[..., None] * AMBER * 0.8
        warm = gaussian_filter(ch, 40) * 6 * (1 + flare)
        if L is not None:
            warm = warm + 1 / (1 + ((xs - L[0]) ** 2 + (ys - L[1]) ** 2) / (240 ** 2)) * flick
        top = np.clip(1.15 - ys / H * 0.6, 0.5, 1.1)[..., None]
        lit = person * (0.42 * top) + person / 255 * AMBER[None, None] * np.clip(warm, 0, 1.2)[..., None] * 0.9
        a = a * (1 - alpha[..., None]) + lit * alpha[..., None]
        if L is not None:
            d2 = (xs - L[0]) ** 2 + (ys - L[1]) ** 2
            r = 11
            g = np.exp(-d2 / (2 * (r * 6) ** 2)) * 0.45 + np.exp(-d2 / (2 * r ** 2)) * 1.4 + np.exp(-d2 / (2 * (r * 0.35) ** 2)) * 2
            a += (g * flick)[..., None] * AMBER
            if TADA <= s < REST + 1.0:                      # ta-da: a few sparks
                k = ramp(s, TADA, TADA + 0.8)
                for q in range(14):
                    ang = q / 14 * 2 * math.pi
                    px, py = L[0] + math.cos(ang) * 90 * k, L[1] + math.sin(ang) * 90 * k
                    a += (np.exp(-((xs - px) ** 2 + (ys - py) ** 2) / (2 * 4 ** 2)) * (1 - k) * 1.5)[..., None] * AMBER
        a = 255 * (1 - np.exp(-a / 255 * 1.2))
        a *= ease(t / 0.8)
        if s > S1 - 0.6:
            a *= 1 - ease((s - (S1 - 0.6)) / 0.55)
        a += rng.normal(0, 2.0, (H, W, 1))
        frame = np.clip(a, 0, 255).astype(np.uint8)
        if TEST:
            Image.fromarray(frame).save(f"{os.environ['TESTDIR']}/c{s:05.2f}.png")
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
