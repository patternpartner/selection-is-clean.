"""'Let Go' - the user's own likeness (u122, keyed off the blue screen with video/bluekey.py). The user asked Grok for a
mimed tug of war; Grok kept giving him a real rope, and the best take is: he takes hold of a short rope, is yanked,
digs in with his legs wide and teeth gritted, the rope whips away and he lands sitting on the floor, hands open - "what?"
The film: he holds a line of light that runs off the edge of the frame; whatever is on the other end is never seen
("Where did the light go?" 5.66). It pulls - gently, then hard (on "Oh," 10.78 he is jerked forward) - and the line
burns brighter and thicker as it pulls, until it is plainly the stronger. On "Let... go" (14.86) it lets go. He lands
on the drop (16.0). Only then does the light come in: huge, with all the strength it had, and as it comes down to his
open hand it makes itself small. It could have won. Song: Bitter Pill 4.0-21.0, whisper word times above.
    python3 video/build_letgo.py      (TEST=s1,s2 TESTDIR=dir in SONG seconds; PART=a,b VOUT=f in film seconds)
"""
import math
import os
import subprocess
import sys

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, os.path.dirname(__file__))
from bluekey import key  # noqa: E402

F = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 704, 1280, 24
S0, S1 = 4.0, 21.0
DUR = S1 - S0
TEST = [float(x) for x in os.environ.get("TEST", "").split(",") if x]
PART = [float(x) for x in os.environ.get("PART", "").split(",") if x]
AMBER = np.array([255, 176, 88], np.float32)
CORE = np.array([255, 228, 175], np.float32)
CW, CH = 720, 1280
K, OY = W / CW, 14                            # the clip, scaled to the width and centred
# song second -> clip second
TMAP = [(4.0, 0.0), (5.66, 1.0), (9.4, 3.5), (10.8, 4.75), (14.86, 7.5), (16.0, 8.25), (21.0, 10.0)]
GRAB, JERK, RELEASE, DROP = 5.66, 10.8, 14.86, 16.0
# his grip on the rope (clip px), read by hand off a gridded sheet at 4 fps
GRIP = [(1.0, 432, 560), (1.25, 360, 502), (1.5, 360, 474), (1.75, 317, 474), (2.0, 374, 488), (2.25, 418, 488),
        (2.5, 403, 502), (2.75, 418, 517), (3.0, 432, 502), (3.25, 389, 546), (3.5, 432, 560), (3.75, 403, 560),
        (4.0, 461, 560), (4.25, 432, 488), (4.5, 432, 517), (4.75, 432, 459), (5.0, 432, 358), (5.25, 432, 373),
        (5.5, 432, 358), (5.75, 374, 358), (6.0, 374, 315), (6.25, 389, 344), (6.5, 374, 358), (6.75, 374, 387),
        (7.0, 317, 402), (7.25, 346, 387), (7.5, 346, 387), (7.75, 706, 459)]
# his open hand, sitting ("what?"), clip px
PALM = [(9.0, 173, 776), (9.25, 187, 718), (9.5, 202, 661), (9.75, 173, 646), (10.0, 175, 646)]
rng = np.random.default_rng(5)


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def ramp(s, a, b):
    return ease((s - a) / (b - a))


def clip_t(s):
    return float(np.interp(s, [p[0] for p in TMAP], [p[1] for p in TMAP]))


FLOOR = 1248 * K + OY
GEO = None                                    # per clip frame: (zoom correction, floor line in clip px), 1 s medians


def geometry():
    """Grok's camera zooms out by a quarter during the tug, lifting his feet off our floor. Undo it: his head width
    (eye row) is the camera's zoom, his lowest point the floor; both as 1 s rolling medians"""
    raw = subprocess.run([F, "-loglevel", "error", "-i", "out/user-clips/u122.mp4", "-map", "0:v:0", "-vf",
                          f"fps={FPS},scale=180:320", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
    frs = np.frombuffer(raw, np.uint8).reshape(-1, 320, 180, 3).astype(np.float32)
    rows = []
    for f in frs:
        _, al = key(f)
        ys, xs = np.nonzero(al > 0.5)
        top, bot = ys.min(), ys.max()
        hw = max(((xs[ys == y].max() - xs[ys == y].min()) if (ys == y).any() else 0) for y in range(top + 8, top + 14))
        rows.append((hw * 4, bot * 4))
    rows = np.array(rows, np.float32)
    k = FPS
    med = np.array([np.median(rows[max(0, i - k // 2):i + k // 2 + 1], axis=0) for i in range(len(rows))])
    return med


def xform(ct):
    i = int(min(len(GEO) - 1, max(0, round(ct * FPS))))
    hw, bot = GEO[i]
    return 0.9 * K * min(1.35, max(0.9, 136.0 / max(hw, 1))), bot           # 0.9: room above his head at full stretch


def to_screen(x, y, ct):
    z, bot = xform(ct)
    return W / 2 + (x - 360) * z, FLOOR + (y - bot) * z


def interp_pt(table, ct):
    ts = [p[0] for p in table]
    return to_screen(float(np.interp(ct, ts, [p[1] for p in table])), float(np.interp(ct, ts, [p[2] for p in table])), ct)


class Reader:
    """frames of a clip at arbitrary (mostly increasing) times"""
    def __init__(self, clip):
        self.clip, self.p, self.t, self.frame = clip, None, None, None

    def at(self, t):
        t = min(t, 10.0)
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


def place(frame, ct):
    rgb, al = key(frame)
    z, bot = xform(ct)
    w, h = int(CW * z), int(CH * z)
    x0, y0 = int(round(W / 2 - 360 * z)), int(round(FLOOR - bot * z))
    im = np.asarray(Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8)).resize((w, h), Image.LANCZOS), np.float32)
    am = np.asarray(Image.fromarray((al * 255).astype(np.uint8)).resize((w, h), Image.LANCZOS), np.float32) / 255
    out = np.zeros((H, W, 3), np.float32)
    a = np.zeros((H, W), np.float32)
    ya, yb, xa, xb = max(0, y0), min(H, y0 + h), max(0, x0), min(W, x0 + w)
    out[ya:yb, xa:xb] = im[ya - y0:yb - y0, xa - x0:xb - x0]
    a[ya:yb, xa:xb] = am[ya - y0:yb - y0, xa - x0:xb - x0]
    return out, a


def line_points(s, ct):
    """the line of light, as points from his grip to off the right edge (or None); and its width and brightness"""
    if s < 4.2:
        return None, 0, 0
    P = interp_pt(GRIP, max(ct, 1.0))
    E = (W + 40, 470.0)
    n = 60
    u = np.linspace(0, 1, n)
    # tension: slack (sag) while he takes hold, taut from the jerk, burning harder until it lets go
    pull = ramp(s, JERK - 0.1, JERK) * (0.4 + 0.6 * ramp(s, JERK, RELEASE))
    sag = 55 * (1 - ramp(s, GRAB, JERK - 0.4)) + 15
    sag *= 1 - ramp(s, JERK - 0.12, JERK)
    if s >= JERK:                                                     # the jerk: a snap, ringing out
        sag += -18 * math.exp(-(s - JERK) * 9) * math.cos((s - JERK) * 40)
    width = 4 + 7 * pull
    bright = 1.0 + 1.4 * pull
    trem = (1.0 + 5 * pull) * math.sin(s * 2 * math.pi * 17)
    if s < GRAB:                                                      # it draws itself in from the edge to his hands
        g = ease((s - 4.2) / (GRAB - 4.2))
        lx = E[0] + (P[0] - E[0]) * g
        xs = lx + (E[0] - lx) * u
        ys = E[1] + (P[1] - E[1]) * g * (1 - u) + 30 * np.sin(math.pi * u) * (1 - g)
        return list(zip(xs, ys)), 3.0, 0.9 * ramp(s, 4.2, 4.8)
    if s < RELEASE:
        xs = P[0] + (E[0] - P[0]) * u
        ys = P[1] + (E[1] - P[1]) * u + sag * 4 * u * (1 - u) + trem * np.sin(math.pi * u)
        return list(zip(xs, ys)), width, bright
    # let go: the near end is released and whips away to the right, falling slack, fading
    r = (s - RELEASE) / 0.9
    if r >= 1:
        return None, 0, 0
    P0 = interp_pt(GRIP, 7.5)                                         # (where he held it)
    lx = P0[0] + (E[0] - P0[0]) * ease(r) ** 0.8
    xs = lx + (E[0] - lx) * u
    ys = P0[1] + (E[1] - P0[1]) * u + 120 * r * (1 - u) ** 2 + 40 * np.sin(u * 9 - r * 20) * (1 - u) * (1 - r)
    return list(zip(xs, ys)), width * (1 - 0.6 * r), bright * (1 - r)


def main():
    global GEO
    GEO = geometry()
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    rd = Reader("u122")
    out = None
    if not TEST:
        out = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                                str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p",
                                os.environ.get("VOUT", "out/drawn/letgo.mp4")], stdin=subprocess.PIPE)
    for fr in range(int(DUR * FPS)):
        t = fr / FPS
        s = S0 + t
        if TEST and not any(abs(s - q) < 0.5 / FPS for q in TEST):
            continue
        if PART and not (PART[0] <= t < PART[1]):
            continue
        ct = clip_t(s)
        person, al = place(rd.at(ct), ct)
        # ---- the stage: black, a haze cone from above, a pool on the floor
        a = np.zeros((H, W, 3), np.float32) + np.array([4, 4, 7], np.float32)
        cone = np.clip(1 - np.abs(xs - W / 2) / (70 + (ys / H) * 360), 0, 1) ** 1.5 * 0.09
        a += cone[..., None] * np.array([150, 140, 160], np.float32)
        a += np.exp(-(((xs - W / 2) / 320) ** 2 + ((ys - 1235) / 45) ** 2))[..., None] * np.array([60, 55, 62], np.float32)
        # ---- the line, and the light after it lets go
        pts, width, bright = line_points(s, ct)
        lights = []                                                      # (x, y, strength) of the warmth on him
        if pts:
            im = Image.new("L", (W, H), 0)
            ImageDraw.Draw(im).line(pts, fill=255, width=max(2, int(round(width))), joint="curve")
            core = np.asarray(im.filter(ImageFilter.GaussianBlur(1.4)), np.float32) / 255
            glow = np.asarray(im.filter(ImageFilter.GaussianBlur(10 + width)), np.float32) / 255
            mid = pts[len(pts) // 3]
            lights.append((pts[0][0], pts[0][1], 0.5 * bright))
            lights.append((mid[0], mid[1], 0.3 * bright))
        if s >= DROP - 0.05:                                             # the light comes in, huge, and makes itself small
            v = ramp(s, DROP, 19.4)
            Pm = interp_pt(PALM, max(9.0, ct))
            start = (W - 40, 420.0)
            lx = start[0] + (Pm[0] - start[0]) * v + 60 * math.sin((s - DROP) * 2.2) * (1 - v)
            ly = start[1] + (Pm[1] - 26 - start[1]) * v ** 1.3
            size = 1 + 4.0 * (1 - ease((s - DROP) / 2.6))               # its strength, put away
            on = ramp(s, DROP - 0.05, DROP + 0.25)
            lights.append((lx, ly, on * (0.6 + 0.6 * (size - 1) / 4)))
        # ---- him: dim key from above; warmth from the line and the light
        top_light = np.clip(1.15 - ys / H * 0.6, 0.5, 1.1)[..., None]
        near = np.zeros((H, W), np.float32)
        for (qx, qy, k) in lights:
            near += k / (1 + ((xs - qx) ** 2 + (ys - qy) ** 2) / (230 ** 2))
        lit = person * (0.42 * top_light) + person / 255 * AMBER[None, None] * (np.minimum(near, 1.6) * 0.9)[..., None]
        a = a * (1 - al[..., None]) + lit * al[..., None]
        if pts:
            a += (core * 1.5 * bright)[..., None] * CORE + (glow * 0.7 * bright)[..., None] * AMBER
        if s >= DROP - 0.05:
            d2 = (xs - lx) ** 2 + (ys - ly) ** 2
            r = 11 * size
            g = np.exp(-d2 / (2 * min(r * 6, 140) ** 2)) * 0.45 + np.exp(-d2 / (2 * r ** 2)) * 1.4 + np.exp(-d2 / (2 * (r * 0.35) ** 2)) * 2
            a += (g * on)[..., None] * AMBER
            a += (np.exp(-(((xs - lx) / 120) ** 2 + ((ys - 1235) / 16) ** 2)) * 0.5 * on)[..., None] * AMBER
        a = 255 * (1 - np.exp(-a / 255 * 1.2))
        a *= ease(t / 0.8)
        if s > S1 - 0.45:
            a *= 1 - ease((s - (S1 - 0.45)) / 0.4)
        a += rng.normal(0, 2.0, (H, W, 1))
        frame_out = np.clip(a, 0, 255).astype(np.uint8)
        if TEST:
            Image.fromarray(frame_out).save(f"{os.environ['TESTDIR']}/g{s:05.2f}.png")
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
