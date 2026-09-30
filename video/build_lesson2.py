"""'The Lesson' v2 - the user asked to redo it with a new clip (u118: a big, joyful dance with a spin, arms flung out,
jumps with both arms up, and a walk-up waving both hands). The light now learns THAT dance (its path is his tracked hand
through the spin and all), and when it dances its own he cheers - arms up, jumping. Full shots are steadied by a rolling
median (1.5 s) of his head-to-feet height and his floor line, not pinned per frame, so the jumps leave the ground.
v1 notes follow.
'The Lesson' - the first film with the user in it (their own likeness, u113-u117, keyed off the blue screen with
video/bluekey.py). The user: "you make whatever you want. New film." Surrender to the Undertow 11.0-38.6 ("We don't
speak but we understand", 23.0). A dark stage, the user, and the amber light from 'The Note' onward. He dances; the
light watches; then it tries to copy him - late and clumsy at first, then exactly: its path is HIS HAND, tracked frame
by frame from the key's matte, played back with a lag and a wobble that both shrink to nothing. On "We don't speak but
we understand" he stops, and it keeps going with a move of its own (a figure-eight on the beat, with a trail). He
shrugs. Cut in close: he holds out his open hand, and the light comes down and settles in his palm. Cut in closer: his
wink, lit amber from below.
    python3 video/build_lesson.py      (TEST=t1,t2 TESTDIR=dir in SONG seconds; PART=a,b VOUT=f in film seconds)
"""
import math
import os
import subprocess
import sys

import imageio_ffmpeg
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

sys.path.insert(0, os.path.dirname(__file__))
from bluekey import key  # noqa: E402

F = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 704, 1280, 24
S0, S1 = 11.0, 38.6
DUR = S1 - S0
BEAT, PHASE = 60 / 124.0, 0.04
TEST = [float(x) for x in os.environ.get("TEST", "").split(",") if x]
PART = [float(x) for x in os.environ.get("PART", "").split(",") if x]
AMBER = np.array([255, 176, 88], np.float32)
CW, CH = 720, 1280
# (song start, song end, clip, clip start, rate, shot)
SEGS = [(11.0, 15.0, "u115", 0.0, 0.7, "full"),       # standing; the light arrives
        (15.0, 23.0, "u118", 1.0, 1.0, "full"),       # he dances (the new one); it watches, then copies
        (23.0, 24.5, "u116", 10.5, 1.0, "full"),      # he stops
        (24.5, 27.0, "u117", 0.0, 1.0, "full"),       # standing, hands in pockets: it dances its own
        (27.0, 29.4, "u118", 9.5, 1.0, "full"),       # he cheers it: arms up, jumping
        (29.4, 31.0, "u118", 13.0, 1.0, "full"),      # and comes toward it, waving
        (31.0, 35.0, "u113", 7.9, 0.375, "medium"),   # the open hand: it comes to rest in his palm
        (35.0, 38.6, "u116", 12.0, 0.84, "close")]    # the wink
DANCE0, COPY0, SYNC, OWN, OWN1, LAND0, LAND1 = 15.0, 17.0, 21.5, 23.0, 28.5, 31.6, 33.8
PALM = (0.44, 0.425)                                  # where the palm is in the medium shot (fractions of the frame)
FEET_Y, HEIGHT, CX = 1110, 780, 250                   # full shots: where he stands and how tall
rng = np.random.default_rng(12)


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def ramp(s, a, b):
    return ease((s - a) / (b - a))


def seg_at(s):
    for sg in SEGS:
        if sg[0] <= s < sg[1]:
            return sg
    return SEGS[-1]


def grab(clip, t, w=CW, h=CH):
    raw = subprocess.run([F, "-loglevel", "error", "-ss", f"{max(0, t):.3f}", "-i", f"out/user-clips/{clip}.mp4", "-map", "0:v:0",
                          "-frames:v", "1", "-vf", f"scale={w}:{h}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(h, w, 3).astype(np.float32)


class Reader:
    """a clip read forwards at 24 fps from a start time; frames asked for out of order re-seek"""
    def __init__(self):
        self.p, self.key_, self.next_t, self.last = None, None, None, None

    def at(self, clip, t):
        t = round(t * FPS) / FPS
        if self.key_ != clip or self.next_t is None or abs(t - self.next_t) > 0.5 / FPS:
            if self.last is not None and self.key_ == clip and self.next_t is not None and t < self.next_t and t > self.next_t - 1.5 / FPS:
                return self.last
            if self.p:
                self.p.kill()
            self.p = subprocess.Popen([F, "-loglevel", "error", "-ss", f"{t:.3f}", "-i", f"out/user-clips/{clip}.mp4", "-map", "0:v:0",
                                       "-vf", f"fps={FPS}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
            self.key_, self.next_t = clip, t
        raw = self.p.stdout.read(CW * CH * 3)
        if len(raw) == CW * CH * 3:
            self.last = np.frombuffer(raw, np.uint8).reshape(CH, CW, 3).astype(np.float32)
        self.next_t = t + 1 / FPS
        return self.last


def track_hands():
    """his dancing hand, from the key's matte: for every frame of u116 2.0-10.0, the point of the upper body furthest
    from his centre line (relative to his chest, in units of his height)"""
    raw = subprocess.run([F, "-loglevel", "error", "-ss", "1.0", "-t", "8.2", "-i", "out/user-clips/u118.mp4", "-map", "0:v:0",
                          "-vf", f"fps={FPS},scale=180:320", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
    frs = np.frombuffer(raw, np.uint8).reshape(-1, 320, 180, 3).astype(np.float32)
    pts = []
    for f in frs:
        _, al = key(f)
        m = al > 0.5
        ys, xs = np.nonzero(m)
        top, bot = ys.min(), ys.max()
        hgt = bot - top
        cx = np.median(xs[(ys > top + 0.3 * hgt) & (ys < top + 0.5 * hgt)])
        upper = (ys > top + 0.12 * hgt) & (ys < top + 0.55 * hgt)
        dx = np.abs(xs[upper] - cx)
        i = np.argmax(dx)
        hx, hy = xs[upper][i], ys[upper][i]
        chest = (cx, top + 0.3 * hgt)
        pts.append(((hx - chest[0]) / hgt, (hy - chest[1]) / hgt))
    pts = np.array(pts)
    return np.stack([gaussian_filter(pts[:, 0], 1.5), gaussian_filter(pts[:, 1], 1.5)], axis=1)


def seg_geometry():
    """for each full-shot segment: per-frame (head-to-feet height along his centre, floor line, centre x) from the key
    at low res, then a 1.5 s rolling median, so the size and floor are steady but a jump still leaves the ground"""
    geo = {}
    for sg in SEGS:
        if sg[5] != "full":
            continue
        dur = (sg[1] - sg[0]) * sg[4] + 0.2
        raw = subprocess.run([F, "-loglevel", "error", "-ss", f"{sg[3]:.3f}", "-t", f"{dur:.3f}", "-i", f"out/user-clips/{sg[2]}.mp4",
                              "-map", "0:v:0", "-vf", f"fps={FPS},scale=180:320", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                             capture_output=True).stdout
        frs = np.frombuffer(raw, np.uint8).reshape(-1, 320, 180, 3).astype(np.float32)
        rows = []
        for f in frs:
            _, al = key(f)
            ys, xs = np.nonzero(al > 0.5)
            bot = ys.max()
            cx = np.median(xs[ys > ys.min() + 0.3 * (bot - ys.min())])
            band = np.abs(xs - cx) < 14
            head = ys[band].min() if band.any() else ys.min()
            rows.append((bot - head, bot, cx))
        rows = np.array(rows, np.float32) * 4                      # back to clip px (320 -> 1280)
        k = int(1.5 * FPS)
        med = np.array([np.median(rows[max(0, i - k // 2):i + k // 2 + 1], axis=0) for i in range(len(rows))])
        geo[sg[0]] = (med, rows)
    return geo


GEO = None


def place(frame, shot, sg=None, ct=None):
    """key him and place him: full shots at a steady size on the stage (jumps kept); medium/close as shot"""
    rgb, al = key(frame)
    if shot != "full":
        im = np.asarray(Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8)).resize((W, H), Image.LANCZOS), np.float32)
        a = np.asarray(Image.fromarray((al * 255).astype(np.uint8)).resize((W, H), Image.LANCZOS), np.float32) / 255
        return im, a, None
    med, rows = GEO[sg[0]]
    i = int(min(len(med) - 1, max(0, round((ct - sg[3]) * FPS))))
    hgt, ground, _ = med[i]
    cx = rows[i][2]
    sc = HEIGHT * 0.93 / max(1.0, hgt)                              # head-to-feet is a little less than the full figure
    w, h = int(CW * sc), int(CH * sc)
    im = np.asarray(Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8)).resize((w, h), Image.LANCZOS), np.float32)
    am = np.asarray(Image.fromarray((al * 255).astype(np.uint8)).resize((w, h), Image.LANCZOS), np.float32) / 255
    x0, y0 = int(CX - cx * sc), int(FEET_Y - ground * sc)
    out = np.zeros((H, W, 3), np.float32)
    a = np.zeros((H, W), np.float32)
    ya, yb, xa, xb = max(0, y0), min(H, y0 + h), max(0, x0), min(W, x0 + w)
    out[ya:yb, xa:xb] = im[ya - y0:yb - y0, xa - x0:xb - x0]
    a[ya:yb, xa:xb] = am[ya - y0:yb - y0, xa - x0:xb - x0]
    return out, a, (CX, FEET_Y - HEIGHT * 0.7)


def main():
    global GEO
    GEO = seg_geometry()
    hands = track_hands()
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    rd = Reader()
    out = None
    if not TEST:
        out = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                                str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p",
                                os.environ.get("VOUT", "out/drawn/lesson2.mp4")], stdin=subprocess.PIPE)
    trail = []
    for fr in range(int(DUR * FPS)):
        t = fr / FPS
        s = S0 + t
        b = (s - PHASE) / BEAT
        # the light's path is computed for every frame (the trail needs its history)
        anchor = (CX + 230, FEET_Y - HEIGHT * 0.62)
        if s < DANCE0:
            u = ramp(s, S0, S0 + 2.5)
            ang = (s - S0) * 1.4
            L = (anchor[0] + 120 * math.cos(ang) * u + 180 * (1 - u), anchor[1] - 60 + 50 * math.sin(ang * 1.3))
        elif s < COPY0:
            L = (anchor[0], anchor[1] + 8 * math.sin(math.pi * b))
        elif s < OWN:
            learn = ramp(s, COPY0, SYNC)
            lag = 0.7 * (1 - learn)
            k = int(min(len(hands) - 1, max(0, (s - DANCE0 - lag) * FPS)))
            hx, hy = hands[k]
            wob = (1 - learn) * 70
            L = (anchor[0] + hx * HEIGHT * 0.62 + wob * math.sin(s * 5.3), anchor[1] + hy * HEIGHT * 0.8 + wob * math.cos(s * 4.1))
        elif s < OWN1:
            ph = math.pi * b / 2
            amp = 150 * ramp(s, OWN, OWN + 0.8) * (1 - 0.6 * ramp(s, OWN1 - 1.0, OWN1))
            L = (anchor[0] - 40 + amp * math.sin(ph), anchor[1] - 40 + amp * 0.55 * math.sin(2 * ph))
        else:
            L = (anchor[0] - 60, anchor[1] - 20 + 10 * math.sin(s * 2))
        trail.append((s, L))
        trail = [p for p in trail if s - p[0] < 0.6]
        if TEST and not any(abs(s - q) < 0.5 / FPS for q in TEST):
            continue
        if PART and not (PART[0] <= t < PART[1]):
            continue
        sg = seg_at(s)
        ct = sg[3] + (s - sg[0]) * sg[4]
        frame = rd.at(sg[2], ct)
        person, al, chest = place(frame, sg[5], sg, ct)
        # ---- the stage: black, a haze cone from above, a pool of light on the floor (full shots)
        a = np.zeros((H, W, 3), np.float32) + np.array([4, 4, 7], np.float32)
        if sg[5] == "full":
            cone = np.clip(1 - np.abs(xs - CX) / (60 + (ys / H) * 330), 0, 1) ** 1.5 * 0.10
            a += cone[..., None] * np.array([150, 140, 160], np.float32)
            pool = np.exp(-(((xs - CX - 60) / 300) ** 2 + ((ys - FEET_Y) / 50) ** 2))
            a += pool[..., None] * np.array([70, 64, 70], np.float32)
            shadow = np.exp(-(((xs - CX) / 90) ** 2 + ((ys - FEET_Y + 4) / 12) ** 2))
            a *= 1 - 0.7 * shadow[..., None]
        else:
            a += np.exp(-((xs - W / 2) ** 2 + (ys - H * 0.35) ** 2) / (2 * 420 ** 2))[..., None] * np.array([26, 22, 30], np.float32)
        # the light's position on screen in this shot
        if sg[5] == "full":
            lx, ly = L
            lvis = ramp(s, S0 + 0.3, S0 + 2.0)
        elif sg[5] == "medium":
            pal = (PALM[0] * W, PALM[1] * H - 22)
            u = ramp(s, LAND0, LAND1)
            start = (W - 60, 120)
            sw = (1 - u) * 90 * math.sin((s - LAND0) * 4)
            lx, ly = start[0] + (pal[0] - start[0]) * u + sw, start[1] + (pal[1] - start[1]) * u ** 0.8
            lvis = 1.0
        else:
            lx, ly = W / 2, H + 160                                # below frame: it is in his hand
            lvis = 1.0
        # ---- him: dim stage light, a soft key from above, and the light's own warmth on the side of him near it
        top_light = np.clip(1.15 - ys / H * 0.6, 0.5, 1.1)[..., None]
        near = 1 / (1 + ((xs - lx) ** 2 + (ys - ly) ** 2) / (260 ** 2)) * lvis
        if sg[5] == "close":
            near = np.clip((ys - H * 0.45) / (H * 0.55), 0, 1) ** 1.5 * 0.9
        lit = person * (0.42 * top_light) + person / 255 * AMBER[None, None] * (near * 0.95)[..., None]
        a = a * (1 - al[..., None]) + lit * al[..., None]
        # ---- the light: a trail of where it just was while it dances its own; the glow; its pool on the floor
        if OWN <= s < OWN1 + 0.6 and sg[5] == "full":
            for (ts, P) in trail[:-1]:
                k = 1 - (s - ts) / 0.6
                d2 = (xs - P[0]) ** 2 + (ys - P[1]) ** 2
                a += (np.exp(-d2 / (2 * 7 ** 2)) * 0.5 * k)[..., None] * AMBER
        r = 11 * (1 + 0.12 * math.exp(-((b % 1) / 0.12)))
        if sg[5] == "medium":
            r *= 1.5
        d2 = (xs - lx) ** 2 + (ys - ly) ** 2
        g = np.exp(-d2 / (2 * (r * 6) ** 2)) * 0.45 + np.exp(-d2 / (2 * r ** 2)) * 1.4 + np.exp(-d2 / (2 * (r * 0.35) ** 2)) * 2
        a += (g * lvis)[..., None] * AMBER
        if sg[5] == "full":
            fp = np.exp(-(((xs - lx) / 110) ** 2 + ((ys - FEET_Y - 10) / 16) ** 2)) * lvis * 0.5
            a += fp[..., None] * AMBER
        if sg[5] == "close":
            a += (np.clip((ys - H * 0.7) / (H * 0.3), 0, 1) ** 2 * 0.5)[..., None] * AMBER
        a = 255 * (1 - np.exp(-a / 255 * 1.2))
        a *= ease(t / 1.0)
        if s > S1 - 0.5:
            a *= 1 - ease((s - (S1 - 0.5)) / 0.45)
        a += rng.normal(0, 2.0, (H, W, 1))
        frame_out = np.clip(a, 0, 255).astype(np.uint8)
        if TEST:
            Image.fromarray(frame_out).save(f"{os.environ['TESTDIR']}/l{s:05.2f}.png")
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
