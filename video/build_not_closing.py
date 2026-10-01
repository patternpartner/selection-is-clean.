"""'Not Closing It' - the user's own likeness (u127 thinking / explaining / an open-armed "I don't know"; u128 a hand shot up;
u129 reaching up high, palms out - all new), to the OPENING of The Mirror Was Dead (0.0-31.9; only its bridge had a film).
The user: "Great work. Here's some more movements to inspire your next creation."
"I arrive and the room's already furnished": a room draws itself round him in faint lines. "Someone's handwriting on every
wall" (3.52): handwriting scrawls itself across the dark. "You ask what's theirs" (12.68): a great glowing question mark
comes down - its dot is the amber light. "And I want to answer" (14.46): his hand shoots up (u128). "Before I've looked,
that's where it goes wrong" (15.88): he explains (u127 6-8.4), and the answer spilling from his hands cracks red and falls
on "wrong". "So I look first" (18.88): finger to his temple (u127 1.5-4.5). "I can't tell yet if it's mine or the song's"
(22.12): he reaches up to the question's dot (u129 3-5.6). "I don't know, and I'm not closing it" (25.42): the open-armed
shrug (u127 8.4-10.2), and the question stays open over him, brighter. "I don't know and I won't say that I've seen"
(28.56): palms out (u129 13.4-15); the handwriting fades; the question stays.
    python3 video/build_not_closing.py      (TEST=s1,s2 TESTDIR=dir in SONG seconds; PART=a,b VOUT=f in film seconds)
"""
import math
import os
import subprocess
import sys

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from scipy import ndimage

sys.path.insert(0, os.path.dirname(__file__))
from bluekey import key  # noqa: E402

F = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 704, 1280, 24
S0, S1 = 0.0, 31.9
DUR = S1 - S0
BEAT = 60 / 76.48
TEST = [float(x) for x in os.environ.get("TEST", "").split(",") if x]
PART = [float(x) for x in os.environ.get("PART", "").split(",") if x]
AMBER = np.array([255, 176, 88], np.float32)
CHALK = np.array([215, 210, 235], np.float32)
CW, CH = 720, 1280
K, OY = W / CW, 14
WRITE, ASK, WANT, BEFORE, WRONG, LOOK, REACH, DONTKNOW, WONT = 3.52, 12.68, 14.46, 15.88, 18.16, 18.88, 22.12, 25.42, 28.56
# (song start, clip, clip start, clip end)
SEGS = [(0.0, "u127", 0.0, 1.3), (6.32, "u129", 0.0, 2.6), (ASK, "u128", 1.2, 3.2), (BEFORE, "u127", 6.0, 8.4),
        (LOOK, "u127", 1.5, 4.5), (REACH, "u129", 3.0, 5.6), (DONTKNOW, "u127", 8.4, 10.2), (WONT, "u129", 13.4, 15.0)]
QX, QY = 352.0, 165.0                                   # where the question hangs (centre of the hook), above his head
rng = np.random.default_rng(76)


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def ramp(s, a, b):
    return ease((s - a) / (b - a))


def seg_at(s):
    cur = SEGS[0]
    for sg in SEGS:
        if s >= sg[0]:
            cur = sg
    i = SEGS.index(cur)
    end = SEGS[i + 1][0] if i + 1 < len(SEGS) else S1
    u = (s - cur[0]) / (end - cur[0])
    return cur[1], cur[2] + (cur[3] - cur[2]) * u, cur[0]


class Reader:
    def __init__(self):
        self.clip, self.p, self.t, self.frame = None, None, None, None

    def at(self, clip, t):
        t = min(t, 14.99)
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


ZP = 0.72                                       # he stands smaller and lower: the question needs the sky above him


def place(frame):
    rgb, al = key(frame)
    w, h = int(CW * K * ZP), int(CH * K * ZP)
    im = np.asarray(Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8)).resize((w, h), Image.LANCZOS), np.float32)
    am = np.asarray(Image.fromarray((al * 255).astype(np.uint8)).resize((w, h), Image.LANCZOS), np.float32) / 255
    out = np.zeros((H, W, 3), np.float32)
    a = np.zeros((H, W), np.float32)
    x0, y0 = (W - w) // 2, int(1238 - 1262 * K * ZP)
    ya, yb = max(0, y0), min(H, y0 + h)
    out[ya:yb, x0:x0 + w] = im[ya - y0:yb - y0]
    a[ya:yb, x0:x0 + w] = am[ya - y0:yb - y0]
    return out, a


def question_mark():
    """the '?' hook (no dot) as a mask centred on (QX, QY); the dot's centre, where the light sits"""
    font = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf", 330)
    im = Image.new("L", (360, 420), 0)
    ImageDraw.Draw(im).text((180, 210), "?", font=font, fill=255, anchor="mm")
    m = np.asarray(im, np.float32) / 255
    lab, n = ndimage.label(m > 0.5)
    cs = ndimage.center_of_mass(m > 0.5, lab, range(1, n + 1))
    dot = int(np.argmax([c[0] for c in cs])) + 1
    hook = m * (lab != dot)
    hook = ndimage.binary_dilation(hook > 0.5, iterations=1).astype(np.float32) * (lab != dot)
    # outline only: a hollow, glowing hook
    edge = hook - ndimage.binary_erosion(hook > 0.5, iterations=5).astype(np.float32)
    ys_, xs_ = np.nonzero(hook > 0.5)
    hy, hx = ys_.mean(), xs_.mean()
    dy, dx = cs[dot - 1]
    return np.clip(edge, 0, 1), hook, (dx - hx, dy - hy), (hx, hy)


def handwriting(seed, x0, y0, w, lines, lh):
    """lines of scrawl - loops and ascenders - as polylines"""
    r = np.random.default_rng(seed)
    out = []
    for k in range(lines):
        pts, x = [], x0 + r.uniform(0, 20)
        y = y0 + k * lh
        end = x0 + w * r.uniform(0.6, 1.0)
        ph = r.uniform(0, 6)
        while x < end:
            if r.random() < 0.06:                                  # a gap between words
                if len(pts) > 1:
                    out.append(pts)
                pts, x = [], x + r.uniform(10, 18)
                continue
            amp = 6 + (12 if r.random() < 0.12 else 0)
            pts.append((x, y - amp * abs(math.sin(ph)) + 3 * math.cos(ph * 2.3)))
            x += 1.6
            ph += r.uniform(0.35, 0.65)
        if len(pts) > 1:
            out.append(pts)
    return out


def main():
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    QE, QM, QDOT, QC = question_mark()
    WRIT = handwriting(3, 30, 120, 640, 9, 34) + handwriting(4, 30, 760, 230, 8, 30) + handwriting(5, 470, 760, 210, 8, 30)
    total = sum(len(p) for p in WRIT)
    shards = []
    rd = Reader()
    out = None
    if not TEST:
        out = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                                str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p",
                                os.environ.get("VOUT", "out/drawn/not_closing.mp4")], stdin=subprocess.PIPE)
    srng = np.random.default_rng(9)
    for fr in range(int(DUR * FPS)):
        t = fr / FPS
        s = S0 + t
        # the answer spilling from his hands while he explains - and on "wrong" it cracks and falls (drawn every frame)
        if BEFORE + 0.3 <= s < WRONG + 0.1 and fr % 2 == 0:
            for _ in range(3):
                shards.append([srng.uniform(290, 420), srng.uniform(770, 830), srng.normal(0, 60), srng.uniform(-120, -40),
                               s, "ABCDEFGHJKLMNPRSTUVWXYZ"[srng.integers(23)]])
        for sh in shards:                                              # after "wrong" they fall
            if s >= WRONG and sh[3] < 120:
                sh[3] = 120 + srng.uniform(0, 160)
        shards = [sh for sh in shards if s - sh[4] < 4.0]
        if TEST and not any(abs(s - q) < 0.5 / FPS for q in TEST):
            continue
        if PART and not (PART[0] <= t < PART[1]):
            continue
        clip, ct, s_seg = seg_at(s)
        person, al = place(rd.at(clip, ct))
        b = s / BEAT
        # ---- the stage
        a = np.zeros((H, W, 3), np.float32) + np.array([4, 4, 7], np.float32)
        cone = np.clip(1 - np.abs(xs - W / 2) / (70 + (ys / H) * 360), 0, 1) ** 1.5 * 0.09
        a += cone[..., None] * np.array([150, 140, 160], np.float32)
        a += np.exp(-(((xs - W / 2) / 320) ** 2 + ((ys - 1240) / 45) ** 2))[..., None] * np.array([60, 55, 62], np.float32)
        # ---- the furnished room: faint lines drawing themselves (doorway, a floor line, a lamp, a picture frame)
        room = Image.new("L", (W, H), 0)
        d = ImageDraw.Draw(room)
        k = ramp(s, 0.6, 3.4)
        lines = [[(20, 1215), (684, 1215)], [(70, 1215), (70, 520), (230, 520), (230, 1215)], [(560, 1215), (560, 760)],
                 [(520, 760), (600, 760), (585, 700), (535, 700), (520, 760)], [(470, 300), (650, 300), (650, 430), (470, 430), (470, 300)]]
        for ln in lines:
            L = sum(math.hypot(q[0] - p[0], q[1] - p[1]) for p, q in zip(ln[:-1], ln[1:])) * k
            pts = [ln[0]]
            for p, q in zip(ln[:-1], ln[1:]):
                seg = math.hypot(q[0] - p[0], q[1] - p[1])
                if L <= 0:
                    break
                u = min(1.0, L / seg)
                pts.append((p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u))
                L -= seg
            if len(pts) > 1:
                d.line(pts, fill=70, width=2)
        # ---- someone's handwriting on every wall
        wk = ramp(s, WRITE, WRITE + 2.6)
        fade = 1 - ramp(s, WONT + 0.4, WONT + 2.6)
        if wk > 0:
            n = int(total * wk)
            for pts in WRIT:
                if n <= 0:
                    break
                d.line(pts[:min(len(pts), n)], fill=int(110 * fade), width=2)
                n -= len(pts)
        rm = np.asarray(room.filter(ImageFilter.GaussianBlur(0.7)), np.float32) / 255
        a += rm[..., None] * CHALK
        # ---- him, lit from above and by the light near him
        qy = QY if s >= ASK + 1.6 else -260 + (QY + 260) * ease((s - ASK) / 1.6)
        dot = (QX + QDOT[0], qy + QDOT[1])
        qon = 1.0 if s >= ASK else 0.0
        top = np.clip(1.15 - ys / H * 0.6, 0.5, 1.1)[..., None]
        near = 1 / (1 + ((xs - dot[0]) ** 2 + (ys - dot[1]) ** 2) / (300 ** 2)) * qon
        lit = person * (0.45 * top) + person / 255 * AMBER * (near * (0.6 + 0.6 * ramp(s, DONTKNOW, DONTKNOW + 1.0)))[..., None]
        dissolve = min(1.0, (s - s_seg) / 0.12) if s_seg > 0 else 1.0
        a = a * (1 - (al * dissolve)[..., None]) + lit * (al * dissolve)[..., None]
        # ---- the answer: letters spilling from his hands, then cracking red and falling
        if shards:
            sim = Image.new("RGB", (W, H), (0, 0, 0))
            sd = ImageDraw.Draw(sim)
            font = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf", 26)
            for (x0, y0, vx, vy, born, ch) in shards:
                age = s - born
                if s < WRONG:
                    x, y = x0 + vx * age, y0 + vy * age
                    col = (230, 225, 250)
                    kk = min(1.0, age / 0.2)
                else:
                    aw = WRONG - born
                    x, y = x0 + vx * aw, y0 - 80 * aw
                    fa = s - WRONG
                    x, y = x + vx * 0.3 * fa, y + 0.5 * 900 * fa * fa
                    col = (255, 60, 40)
                    kk = max(0.0, 1 - fa / 1.6)
                sd.text((x, y), ch, font=font, fill=tuple(int(c * kk) for c in col))
            a += np.asarray(sim, np.float32)
        # ---- the question: a hollow glowing hook, and the amber light as its dot
        if s >= ASK:
            qi = np.zeros((H, W), np.float32)
            h_, w_ = QE.shape
            x0, y0 = int(QX - QC[0]), int(qy - QC[1])
            ya, yb, xa, xb = max(0, y0), min(H, y0 + h_), max(0, x0), min(W, x0 + w_)
            if ya < yb and xa < xb:
                qi[ya:yb, xa:xb] = QE[ya - y0:yb - y0, xa - x0:xb - x0]
            bright = 0.7 + 0.5 * ramp(s, DONTKNOW, DONTKNOW + 1.0) + 0.08 * math.sin(2 * math.pi * b)
            gq = np.asarray(Image.fromarray((qi * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(7)), np.float32) / 255
            a += (qi * 0.9 * bright)[..., None] * CHALK + (gq * 0.9 * bright)[..., None] * np.array([190, 200, 255], np.float32)
            d2 = (xs - dot[0]) ** 2 + (ys - dot[1]) ** 2
            r = 15 * (1 + 0.1 * math.exp(-((b % 1) / 0.15)))
            for tt in (22.4, 24.95):                                    # his hand reaches it (u129 3.1, 5.1): it rings
                if s >= tt:
                    r *= 1 + 0.35 * math.exp(-(s - tt) / 0.25)
            g = np.exp(-d2 / (2 * (r * 5) ** 2)) * 0.5 + np.exp(-d2 / (2 * r ** 2)) * 1.6 + np.exp(-d2 / (2 * (r * 0.35) ** 2)) * 2.2
            a += (g * 255 * bright)[..., None] * AMBER / 255
        a = 255 * (1 - np.exp(-a / 255 * 1.15)) / (1 - math.exp(-1.15))
        a *= ease(t / 0.35)
        if s > S1 - 0.3:
            a *= 1 - ease((s - (S1 - 0.3)) / 0.28)
        a += rng.normal(0, 1.8, (H, W, 1))
        frame_out = np.clip(a, 0, 255).astype(np.uint8)
        if TEST:
            Image.fromarray(frame_out).save(f"{os.environ['TESTDIR']}/n{s:05.2f}.png")
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
