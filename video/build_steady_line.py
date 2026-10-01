"""'One Steady Line' - drawn, no clips. The user: "Great stuff. Next" (Claude's choice). The House of Geometry's bridge,
never used before (the verses, with "How can I walk a line you cannot draw?", went into 'The Fork'): 124.0-158.5.
A black room roaring with static - hundreds of scribbles going every way, redrawn every few frames - and the amber light
darting from one to the next, trying to follow all of them. "Quiet the room" (127.08): they freeze and fade; "just for
a second" (130.3): it hangs, trembling. "Give me one coordinate" (133.74): one point; it goes to it ("one", 134.72).
"One steady line" (140.06): a clean line draws itself up the frame and the light walks it, calm for the first time.
"I am waiting" (143.5): the line stops; it waits at the end. "But the air is heavy with static" (146.0): the scribbles
creep back; "you're on the wrong wavelength" (148.84): the line warps into a jittery wave and the light has to ride it;
"turn the dial" (153.62): the wave sweeps through wavelengths like a radio being tuned; "please" (156.94): it locks,
steady - and the cut to black comes as it does. End line after, short (the user: end cards 3.5-4 s).
    python3 video/build_steady_line.py      (TEST=s1,s2 TESTDIR=dir in SONG seconds; PART=a,b VOUT=f in film seconds)
"""
import math
import os
import subprocess

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

F = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 704, 1280, 24
S0, S1 = 124.0, 158.5
DUR = S1 - S0
TEST = [float(x) for x in os.environ.get("TEST", "").split(",") if x]
PART = [float(x) for x in os.environ.get("PART", "").split(",") if x]
AMBER = np.array([255, 176, 88], np.float32)
QUIET, SECOND, COORD, ONE, LINE, WAIT, STATIC, WRONG, DIAL, PLEASE = (127.08, 130.3, 133.74, 134.72, 140.06, 143.5,
                                                                      146.0, 148.84, 153.62, 156.94)
X0, YB, YT = 352.0, 1040.0, 170.0              # the line: from the coordinate (bottom) up the frame
rng = np.random.default_rng(33)


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def ramp(s, a, b):
    return ease((s - a) / (b - a))


def static_level(s):
    """how loud the room is: full, then quieted, then creeping back, then tuned out"""
    # (the hush is held, not emptied: the frozen scribbles fade slowly through "just for a second" - the user does not like
    # long pauses, and 6.7 s of a lone light would be one)
    lv = 1.0 - ramp(s, QUIET, QUIET + 1.0) * 0.6 - ramp(s, SECOND + 0.6, COORD + 0.4) * 0.4
    lv += ramp(s, STATIC, WRONG + 1.0) * 0.55
    lv -= ramp(s, DIAL + 0.6, PLEASE + 0.4) * 0.55
    return max(0.0, lv)


def line_top(s):
    """how far up the frame the steady line has drawn"""
    if s < LINE:
        return YB
    a = YB - (YB - 520) * ramp(s, LINE, LINE + 2.2)                 # draws itself, then stops: waiting
    return a - (520 - YT) * ramp(s, WRONG, PLEASE + 0.8)


def wave(s):
    """(amplitude, wavelength, phase speed) of the wrong wavelength; tuned out by 'please'"""
    amp = 46 * ramp(s, WRONG - 0.2, WRONG + 0.8) * (1 - ramp(s, PLEASE - 0.1, PLEASE + 0.5))
    if s < DIAL:
        lam = 34.0
    else:                                                              # turning the dial: the wavelength sweeps
        u = (s - DIAL) / (PLEASE - DIAL)
        lam = 34 * (1 - u) + 420 * u + 26 * math.sin(u * 19)
    return amp, max(20.0, lam), 9.0


def line_x(y, s):
    amp, lam, sp = wave(s)
    return X0 + amp * math.sin(2 * math.pi * y / lam + s * sp)


SCRIB = None


def scribbles(seed):
    r = np.random.default_rng(seed)
    out = []
    for _ in range(120):
        x, y = r.uniform(-40, W + 40), r.uniform(-40, H + 40)
        ang = r.uniform(0, 2 * math.pi)
        pts = [(x, y)]
        for _ in range(r.integers(6, 22)):
            ang += r.normal(0, 0.9)
            st = r.uniform(12, 60)
            x, y = x + st * math.cos(ang), y + st * math.sin(ang)
            pts.append((x, y))
        out.append(pts)
    return out


def light_at(s, scr):
    if s < QUIET + 0.6:                                                # darting from scribble to scribble
        k = int((s - S0) / 0.32)
        r = np.random.default_rng(1000 + k)
        a = scribbles(5000 + k // 2)[r.integers(0, 120)]
        b = scribbles(5000 + (k + 1) // 2)[np.random.default_rng(1001 + k).integers(0, 120)]
        pa, pb = a[len(a) // 2], b[len(b) // 2]
        u = ease(((s - S0) / 0.32) % 1 * 1.6)
        p = (pa[0] + (pb[0] - pa[0]) * u, pa[1] + (pb[1] - pa[1]) * u)
        return min(max(p[0], 60), W - 60), min(max(p[1], 120), H - 120)
    if s < ONE:                                                        # it hangs, trembling, drifting to the middle
        u = ramp(s, QUIET + 0.6, SECOND + 1.0)
        tr = 6 * (1 - ramp(s, SECOND, COORD)) + 2
        hx, hy = 352 + 30 * (1 - u), 700 + 40 * (1 - u)
        return hx + tr * math.sin(s * 37), hy + tr * math.cos(s * 41)
    if s < LINE:                                                       # to the coordinate
        u = ramp(s, ONE, ONE + 1.6)
        return 352 + (X0 - 352) * u, 700 + (YB - 700) * u
    # walking the line, a little behind its drawn tip; waiting at the end
    tip = line_top(s)
    y = min(YB, tip + 60 - 40 * ramp(s, WAIT, WAIT + 0.6))
    y = max(y, tip + 18)
    return line_x(y, s), y


def main():
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    out = None
    if not TEST:
        out = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                                str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p",
                                os.environ.get("VOUT", "out/drawn/steady_line.mp4")], stdin=subprocess.PIPE)
    trail = []
    for fr in range(int(DUR * FPS)):
        t = fr / FPS
        s = S0 + t
        lv = static_level(s)
        # the scribbles are redrawn every 3 frames while the room is loud; frozen once it is quiet
        frozen = QUIET + 0.4 <= s < STATIC
        seed = int(QUIET * FPS / 3) if frozen else fr // 3
        lx, ly = light_at(s, None)
        trail.append((s, lx, ly))
        trail = [p for p in trail if s - p[0] < 0.35]
        if TEST and not any(abs(s - q) < 0.5 / FPS for q in TEST):
            continue
        if PART and not (PART[0] <= t < PART[1]):
            continue
        a = np.zeros((H, W, 3), np.float32) + np.array([3, 3, 5], np.float32)
        # ---- the static
        if lv > 0.01:
            im = Image.new("L", (W, H), 0)
            d = ImageDraw.Draw(im)
            sc = scribbles(seed)
            n = int(len(sc) * min(1.0, 0.25 + lv))
            for pts in sc[:n]:
                d.line(pts, fill=int(110 + 80 * rng.random()), width=1 if rng.random() < 0.7 else 2)
            st = np.asarray(im, np.float32) / 255 * lv
            a += st[..., None] * np.array([150, 160, 190], np.float32)
        # ---- the coordinate and the line
        if s >= COORD:
            k = ramp(s, COORD, COORD + 0.3)
            pulse = 1 + 0.4 * math.exp(-((s - COORD) % 1.5) / 0.2) * (s < LINE)
            d2 = (xs - X0) ** 2 + (ys - YB) ** 2
            a += (np.exp(-d2 / (2 * 4 ** 2)) * 2.0 * k * pulse + np.exp(-d2 / (2 * 22 ** 2)) * 0.3 * k)[..., None] * \
                np.array([235, 240, 255], np.float32)
        if s >= LINE:
            tip = line_top(s)
            im = Image.new("L", (W, H), 0)
            d = ImageDraw.Draw(im)
            yy = np.arange(YB, tip, -3.0)
            pts = [(line_x(y, s), y) for y in yy]
            if len(pts) > 1:
                d.line(pts, fill=255, width=3, joint="curve")
            core = np.asarray(im, np.float32) / 255
            glow = np.asarray(im.filter(ImageFilter.GaussianBlur(6)), np.float32) / 255
            amp = wave(s)[0]
            col = np.array([235, 240, 255], np.float32) * (1 - 0.35 * amp / 46) + np.array([200, 120, 255], np.float32) * 0.35 * amp / 46
            a += (core * 1.0)[..., None] * col + (glow * 0.9)[..., None] * col
        # ---- the light (a short trail when it darts)
        for (ts, px, py) in trail[:-1]:
            k = 1 - (s - ts) / 0.35
            if s < QUIET + 0.6:
                a += (np.exp(-((xs - px) ** 2 + (ys - py) ** 2) / (2 * 6 ** 2)) * 0.6 * k)[..., None] * AMBER
        d2 = (xs - lx) ** 2 + (ys - ly) ** 2
        r = 11.0
        calm = ramp(s, LINE, LINE + 1.0) * (1 - ramp(s, WRONG, WRONG + 1)) + ramp(s, PLEASE, PLEASE + 0.5)
        r *= 1 + 0.25 * calm + 0.12 * math.sin(2 * math.pi * (s - 0.05) / 0.625) * (QUIET <= s < LINE)   # breathing
        g = np.exp(-d2 / (2 * (r * 6) ** 2)) * 0.45 + np.exp(-d2 / (2 * r ** 2)) * 1.4 + np.exp(-d2 / (2 * (r * 0.35) ** 2)) * 2
        a += g[..., None] * AMBER
        a = 255 * (1 - np.exp(-a / 255 * 1.2))
        a *= ease(t / 0.4)
        if s > S1 - 0.12:                                              # the cut comes as it locks
            a *= 0.0
        a += rng.normal(0, 1.6, (H, W, 1))
        frame_out = np.clip(a, 0, 255).astype(np.uint8)
        if TEST:
            Image.fromarray(frame_out).save(f"{os.environ['TESTDIR']}/l{s:06.2f}.png")
            print("test", round(s, 2), flush=True)
            continue
        out.stdin.write(frame_out.tobytes())
        if fr % 96 == 0:
            print(f"{s:6.1f}", flush=True)
    if out:
        out.stdin.close()
        out.wait()


if __name__ == "__main__":
    main()
