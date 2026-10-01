"""'Fetch' - the user's own likeness (u123: a mimed game of catch; u124: eyes following a small floating bead that Grok
drew in, which the amber light replaces). The user: "Yeah" to the pitch: he plays fetch with the light and it always
comes back - then he throws it up and away and it does not; he waits, hands in pockets, and it comes back ON ITS OWN,
looks him over, comes nose to nose (two points of light in his glasses), and settles in his palm. It comes back because
it wants to, not because it was fetched.
Song: Two Points of Light (the user's, from Claude's lyrics) 44.4-70.6: the light floats up out of his palm and he
throws it away on "It isn't mine till I leave it behind" (49.92); it rockets back on the chorus ("Two" 51.78); he throws
it straight up and it is gone ("light" 53.7); he waits; it drifts back in on "a room full of writing"; nose to nose on
"where the smile used to be" and he smiles; it lands in his palm on "If you come after" (66.1) and rests there through
"I left the lamp burning". The end line over "Read it, don't trust it, and look for me".
Light positions are read by hand off gridded 4 fps sheets (clip px; u124's from the bead Grok drew).
v3 - the user on v2: "it's not matched. When I duck my eyes are not following. Also grok put in a little rubber thing
that's still in the video. Shall we try re-prompting grok?" Re-prompted (VIDEO.md has the prompt): u125, in which Grok
draws a small orange light itself, so his eyes and hands follow it for real - it drifts down, circles his head (behind
it for a moment), comes nose to nose, and settles in his palm. The duck-and-catch (u123 6.5-8) is CUT, and u124 with it:
he throws it away on "behind" and watches the edge; on "Two" (51.78) it is back, on its own. The amber light rides on
Grok's (PATH_B read by hand off a frame sheet with the tracked point drawn on - colour trackers locked onto his lit face
and shirt whenever the light was over the blue), and hides when Grok's goes behind his head.
    python3 video/build_fetch.py      (TEST=s1,s2 TESTDIR=dir in SONG seconds; PART=a,b VOUT=f in film seconds)
"""
import math
import os
import subprocess
import sys

import imageio_ffmpeg
import json

import numpy as np
from scipy.ndimage import gaussian_filter1d
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from bluekey import key  # noqa: E402

F = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 704, 1280, 24
S0, S1 = 44.4, 70.6
CUT = 51.78                                   # u123 -> u125, on "Two"
DUR = S1 - S0
TEST = [float(x) for x in os.environ.get("TEST", "").split(",") if x]
PART = [float(x) for x in os.environ.get("PART", "").split(",") if x]
AMBER = np.array([255, 176, 88], np.float32)
CW, CH = 720, 1280
K, OY = W / CW, 14
# song second -> clip second, per shot
MAP_A = [(44.4, 0.4), (49.92, 4.0), (51.78, 5.9)]
MAP_B = [(51.78, 0.0), (52.6, 0.45), (61.42, 7.5), (63.0, 8.25), (66.1, 10.5), (70.6, 12.0)]
# the light, clip px, by clip second (None = not in frame)
# (v2, the user: "it's a bit out of sync" - re-read at 8 fps off larger sheets: the light sits just above his palm, floats
# free when his hand drops, rises as he looks up, rides his hand up and through the throw; on the return it is in frame
# BEFORE he startles - v1 had it arrive half a second after his "oh")
PATH_A = [(0.4, 250, 570), (0.5, 250, 565), (0.625, 259, 552), (0.75, 269, 528), (0.875, 277, 510), (1.0, 285, 510),
          (1.125, 279, 526), (1.25, 288, 519), (1.375, 282, 516), (1.5, 288, 510), (1.625, 282, 503), (1.75, 275, 503),
          (1.875, 278, 500), (2.25, 272, 515), (2.375, 272, 552), (2.5, 280, 380), (2.625, 300, 300), (2.75, 340, 200),
          (3.0, 420, 120), (3.125, 437, 165), (3.25, 447, 48), (3.375, 425, 32), (3.5, 451, 80), (3.625, 470, 140),
          (3.75, 535, 210), (3.875, 590, 305), (4.0, 713, 188), (4.12, 950, 120), (5.85, 950, 230), (5.95, 760, 200),
          (6.5, 483, 450), (6.75, 330, 350), (7.0, 300, 440), (7.25, 300, 430), (7.5, 360, 306), (7.75, 360, 54),
          (8.0, 360, -160)]
# u125's light: TRACKED per frame from Grok's light's white-hot core (luminance > 245; video/stories/u125-light-track.json,
# checked by drawing the point on the frames). Before it appears, and while it is behind his head, the tracker picks up
# shoes or shirt highlights instead: those spans are dropped and interpolated, and the light is hidden (HIDDEN).
def _track_b():
    tr = json.load(open(os.path.join(os.path.dirname(__file__), "stories", "u125-light-track.json")))
    t = np.array([q[0] for q in tr])
    ok = np.array([q[1] is not None and q[0] >= 0.45 and not (3.7 <= q[0] < 4.7) for q in tr])
    x = np.array([q[1] if q[1] is not None else 0 for q in tr], float)
    y = np.array([q[2] if q[2] is not None else 0 for q in tr], float)
    x, y = np.interp(t, t[ok], x[ok]), np.interp(t, t[ok], y[ok])
    first = t[ok][0]
    y = np.where(t < first, y[ok][0] - (first - t) * 300, y)          # it comes down from above the frame
    return t, gaussian_filter1d(x, 1.0), gaussian_filter1d(y, 1.0)


TB = None
HIDDEN = (3.6, 3.7, 4.62, 4.72)                 # Grok's light goes behind his head: fade out, gone, fade in
rng = np.random.default_rng(9)


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def ramp(s, a, b):
    return ease((s - a) / (b - a))


def tmap(m, s):
    return float(np.interp(s, [p[0] for p in m], [p[1] for p in m]))


def path(p, ct):
    ts = [q[0] for q in p]
    return (float(np.interp(ct, ts, [q[1] for q in p])) * K, float(np.interp(ct, ts, [q[2] for q in p])) * K + OY)


class Reader:
    """frames of a clip at arbitrary (mostly increasing) times"""
    def __init__(self, clip, length):
        self.clip, self.length, self.p, self.t, self.frame = clip, length, None, None, None

    def at(self, t):
        t = min(t, self.length - 0.05)                  # (v2 clamped every clip at 10.0 s: u125 is 12 s and froze)
        if self.p is None or t < self.t - 1e-6 or t - self.t > 1.0:
            if self.p:
                self.p.kill()
            self.p = subprocess.Popen([F, "-loglevel", "error", "-ss", f"{t:.3f}", "-i", f"out/user-clips/{self.clip}.mp4",
                                       "-map", "0:v:0", "-vf", f"fps={FPS}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                                      stdout=subprocess.PIPE)
            self.t, self.frame = t - 1 / FPS, None
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


def light_at(s):
    if s < CUT:
        return path(PATH_A, tmap(MAP_A, s))
    global TB
    if TB is None:
        TB = _track_b()
    ct = tmap(MAP_B, s)
    return (float(np.interp(ct, TB[0], TB[1])) * K, float(np.interp(ct, TB[0], TB[2])) * K + OY)


def main():
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    ra, rb = Reader("u123", 10.04), Reader("u125", 12.04)
    out = None
    if not TEST:
        out = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                                str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p",
                                os.environ.get("VOUT", "out/drawn/fetch.mp4")], stdin=subprocess.PIPE)
    for fr in range(int(DUR * FPS)):
        t = fr / FPS
        s = S0 + t
        if TEST and not any(abs(s - q) < 0.5 / FPS for q in TEST):
            continue
        if PART and not (PART[0] <= t < PART[1]):
            continue
        shot_b = s >= CUT
        ct = tmap(MAP_B, s) if shot_b else tmap(MAP_A, s)
        person, al = place((rb if shot_b else ra).at(ct))
        lx, ly = light_at(s)
        # a trail behind it when it moves fast (the throw, the return, the throw up)
        trail = [light_at(s - k / FPS) for k in range(1, 7) if (s - k / FPS >= CUT) == shot_b]
        speed = math.hypot(lx - trail[0][0], ly - trail[0][1]) if trail else 0.0
        # ---- the stage: black, haze from above, a floor pool (fading out as u124's camera pushes in)
        a = np.zeros((H, W, 3), np.float32) + np.array([4, 4, 7], np.float32)
        cone = np.clip(1 - np.abs(xs - W / 2) / (70 + (ys / H) * 360), 0, 1) ** 1.5 * 0.09
        a += cone[..., None] * np.array([150, 140, 160], np.float32)
        floor = 1.0 if not shot_b else 1 - ramp(ct, 1.5, 3.0)
        a += (np.exp(-(((xs - W / 2) / 320) ** 2 + ((ys - 1235) / 45) ** 2)) * floor)[..., None] * np.array([60, 55, 62], np.float32)
        # ---- him: dim key from above; the light's warmth
        vis = ramp(s, S0, S0 + 0.6)
        top_light = np.clip(1.15 - ys / H * 0.6, 0.5, 1.1)[..., None]
        near = 1 / (1 + ((xs - lx) ** 2 + (ys - ly) ** 2) / (240 ** 2)) * vis * (0.5 if shot_b else 1.0)  # Grok lit u125 already
        lit = person * (0.42 * top_light) + person / 255 * AMBER[None, None] * (near * 0.95)[..., None]
        a = a * (1 - al[..., None]) + lit * al[..., None]
        # ---- the light
        for k, (px, py) in enumerate(trail):
            if speed < 18:
                break
            w = (1 - k / len(trail)) * min(1.0, speed / 60)
            d2 = (xs - px) ** 2 + (ys - py) ** 2
            a += (np.exp(-d2 / (2 * 8 ** 2)) * 0.7 * w)[..., None] * AMBER
        d2 = (xs - lx) ** 2 + (ys - ly) ** 2
        r = 11.0 + (5.0 * ramp(ct, 10.0, 10.8) if shot_b else 0.0)    # bigger in his palm, over Grok's own
        hv = 1.0
        if shot_b:
            hv = 1 - ramp(ct, HIDDEN[0], HIDDEN[1]) * (1 - ramp(ct, HIDDEN[2], HIDDEN[3]))
        g = np.exp(-d2 / (2 * (r * 6) ** 2)) * 0.45 + np.exp(-d2 / (2 * r ** 2)) * 1.4 + np.exp(-d2 / (2 * (r * 0.35) ** 2)) * 2
        a += (g * hv)[..., None] * AMBER
        a += (np.exp(-(((xs - lx) / 110) ** 2 + ((ys - 1235) / 16) ** 2)) * 0.5 * floor)[..., None] * AMBER
        a = 255 * (1 - np.exp(-a / 255 * 1.2))
        a *= ease(t / 0.8)
        if abs(s - CUT) < 0.12:                                     # a breath of black at the cut
            a *= abs(s - CUT) / 0.12
        if s > S1 - 0.45:
            a *= 1 - ease((s - (S1 - 0.45)) / 0.4)
        a += rng.normal(0, 2.0, (H, W, 1))
        frame_out = np.clip(a, 0, 255).astype(np.uint8)
        if TEST:
            Image.fromarray(frame_out).save(f"{os.environ['TESTDIR']}/f{s:05.2f}.png")
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
