"""'The Mirror' - the funny-faces film (the user's own likeness, u119, keyed off the blue screen with video/bluekey.py).
The user, after The Lesson v4: "That's it. Let's move to your next idea" - the idea, proposed with The Lesson: the light
has learned to dance; now it tries to learn a FACE. It arrives, draws itself one (two dots and a line) and copies every
face he pulls, wrongly: it smiles at his 'ooh', its tongue comes out three times too long, it laughs so hard its face
bounces, its eyes roll, it cannot wink (it blinks both), it stretches its whole face when he pulls his cheeks. Then he
stops pulling faces and just smiles, and it paints on the perfect smile - and on "She peels her own face away from the
lies" the painted face peels off and falls away in sparks, and what is left is only the light, warm, close to him.
Song: A Smile Painted 60.4-82.6 ("It goes first, lifting up the disguise" 61.9, "An imperfect mirror of a human heart"
68.4, "Ready for the moment where the truth can start" 73.8, "She peels her own face away from the lies" 77.0).
The clip is time-mapped (TMAP) so each face is held while the light tries it.
    python3 video/build_mirror.py      (TEST=s1,s2 TESTDIR=dir in SONG seconds; PART=a,b VOUT=f in film seconds)
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
S0, S1 = 60.4, 82.6
DUR = S1 - S0
TEST = [float(x) for x in os.environ.get("TEST", "").split(",") if x]
PART = [float(x) for x in os.environ.get("PART", "").split(",") if x]
AMBER = np.array([255, 176, 88], np.float32)
CORE = np.array([255, 226, 170], np.float32)
CW, CH = 720, 1280
Z, OX, OY = 1.15, -118, 265                  # the clip, scaled and placed: his head centre lands at about (296, 461)
FACE = (535.0, 461.0)                        # where the light's face sits, beside his head
R = 74.0                                     # the light's face radius
# song second -> clip second: each face is held (slowed) while the light tries it
TMAP = [(60.4, 0.0), (62.7, 2.4), (63.0, 2.85), (65.3, 3.45), (65.7, 3.9), (66.6, 4.9), (66.8, 5.4), (67.9, 5.95),
        (68.1, 6.25), (70.3, 8.45), (73.7, 11.15), (74.3, 11.75), (76.9, 13.75), (77.4, 14.05), (82.6, 15.0)]
PEEL0, PEEL1 = 77.9, 79.5
rng = np.random.default_rng(7)


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def ramp(s, a, b):
    return ease((s - a) / (b - a))


def clip_t(s):
    return float(np.interp(s, [p[0] for p in TMAP], [p[1] for p in TMAP]))


class Reader:
    """frames of a clip at arbitrary (mostly increasing) times: decode forwards, keep the latest frame at or before t"""
    def __init__(self, clip):
        self.clip, self.p, self.t, self.frame = clip, None, None, None

    def at(self, t):
        t = min(t, 15.0)
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


# ---- the light's face: each expression is a list of strokes (polylines in face units, radius 1, y down)
def arc(cx, cy, rx, ry, a0, a1, n=24):
    return [(cx + rx * math.cos(a), cy + ry * math.sin(a)) for a in np.linspace(a0, a1, n)]


def mouth(kind, k=0.0, s=0.0):
    if kind == "flat":
        return [[(-0.32, 0.38), (0.32, 0.38)]]
    if kind == "wobble":
        return [[(x, 0.38 + 0.04 * math.sin(x * 22 + s * 9)) for x in np.linspace(-0.3, 0.3, 20)]]
    if kind == "smile":
        return [[(x, 0.28 + 0.2 * (1 - (x / 0.42) ** 2)) for x in np.linspace(-0.42, 0.42, 24)]]
    if kind == "o":
        return [arc(0, 0.42, 0.17, 0.21, 0, 2 * math.pi, 32)]
    if kind == "kiss":
        return [arc(0.06, 0.4, 0.08, 0.07, 0, 2 * math.pi, 20), [(0.17, 0.34), (0.22, 0.4), (0.17, 0.46)]]
    if kind == "tongue":                     # a smile with a tongue of length k hanging out (wobbling)
        sm = [(x, 0.3 + 0.12 * (1 - (x / 0.34) ** 2)) for x in np.linspace(-0.34, 0.34, 20)]
        L = 0.15 + k
        sway = 0.06 * math.sin(s * 11) * min(1.0, k)
        tg = [(-0.1, 0.42)] + [(-0.1 + sway * (j / 10) ** 2, 0.42 + L * j / 10) for j in range(1, 11)]
        tg += [(sway + 0.1 * math.cos(a), 0.42 + L + 0.1 * math.sin(a)) for a in np.linspace(math.pi, 0, 10)]
        tg += [(0.1 + sway * (j / 10) ** 2, 0.42 + L * j / 10) for j in range(10, -1, -1)]
        return [sm, tg]
    if kind == "laugh":
        return [[(-0.36, 0.3), (0.36, 0.3)] + arc(0, 0.3, 0.36, 0.3, 0, math.pi, 24)]
    if kind == "grin":
        top = [(x, 0.3 + 0.06 * (1 - (x / 0.46) ** 2)) for x in np.linspace(-0.46, 0.46, 20)]
        bot = [(x, 0.3 + 0.22 * (1 - (x / 0.46) ** 2)) for x in np.linspace(0.46, -0.46, 20)]
        return [top + bot + [top[0]], [(x, 0.3 + 0.13 * (1 - (x / 0.46) ** 2)) for x in np.linspace(-0.4, 0.4, 16)]]
    if kind == "pout":
        return [arc(0.0, 0.42, 0.13, 0.1, 0, 2 * math.pi, 24), arc(0.0, 0.42, 0.05, 0.035, 0, 2 * math.pi, 12)]
    return []


def eyes(kind, s=0.0, look=0.0, roll=None):
    out = []
    for side in (-1, 1):
        ex, ey = side * 0.36 + look * 0.12, -0.18
        if roll is not None:
            ex += 0.09 * math.cos(roll + (side * 0.4))
            ey += 0.09 * math.sin(roll + (side * 0.4))
        k = kind if isinstance(kind, str) else kind[0 if side < 0 else 1]
        if k == "dot":
            out.append(("dot", ex, ey, 0.075))
        elif k == "wide":
            out.append(("ring", ex, ey, 0.13))
            out.append(("dot", ex + look * 0.04, ey, 0.05))
        elif k == "shut":
            out.append(("line", [(ex - 0.12, ey + 0.02), (ex + 0.12, ey + 0.02)]))
        elif k == "happy":
            out.append(("line", arc(ex, ey + 0.06, 0.12, 0.11, math.pi, 2 * math.pi, 12)))
    return out


def face_at(s):
    """(features, sx, sy, dy) for the light's face at song second s. features: list of ('line', pts) / ('dot', x, y, r)
    / ('ring', x, y, r); sx/sy stretch the face; dy bounces it"""
    sx, sy, dy, look, roll = 1.0, 1.0, 0.0, 0.0, None
    ek, mk, k = "dot", "flat", 0.0
    blink = any(abs(s - b) < 0.07 for b in (62.95, 65.0))
    if s < 63.4:
        pass
    elif s < 64.3:
        mk = "smile"                                                  # his 'ooh' - it smiles. confidently.
    elif s < 64.6:
        mk, look = "smile", -1.0                                      # it looks at him
    elif s < 65.85:
        mk, ek = "o", "wide"                                          # oh. 'ooh'
    elif s < 66.85:
        mk = "kiss"
    elif s < 67.95:
        mk, k = "tongue", 1.7 * ramp(s, 67.0, 67.6) * (1 - ramp(s, 67.72, 67.9))   # far too much tongue, then back in
    elif s < 69.0:
        mk, ek = "laugh", "happy"
        dy = -14 * abs(math.sin(2 * math.pi * 3.2 * (s - 67.95))) * (1 - ramp(s, 68.7, 69.0))
    elif s < 69.75:
        mk = "grin"
    elif s < 73.7:
        mk = "pout"
        roll = (s - 69.75) * 2 * math.pi / 1.1                         # its eyes roll, round and round
        if 72.9 <= s < 73.3 or 73.5 <= s < 73.7:                      # his wink: it cannot wink. it blinks both.
            ek, roll = "shut", None
        elif 73.3 <= s < 73.5:
            ek, roll = ("shut", "dot"), None
    elif s < 74.35:
        mk = "wobble"                                                 # a sheepish wobble
    elif s < 76.9:
        mk, k = "tongue", 0.25
        u = ramp(s, 74.6, 76.6)
        sx, sy = 1 + 1.6 * u, 1 - 0.3 * u                            # he pulls his cheeks: it stretches its whole face
    elif s < 77.4:
        u = s - 76.9
        sx = 1 + 0.35 * math.exp(-u * 6) * math.cos(u * 30)          # snaps back, wobbling
        mk = "flat"
    else:
        mk = "smile"                                                  # his smile: it paints on the perfect smile
    if blink:
        ek = "shut"
    feats = [("line", st) for st in mouth(mk, k, s)] + eyes(ek, s, look, roll)
    return feats, sx, sy, dy


def render_face(feats, cx, cy, sx, sy, peel=0.0, alpha=1.0):
    """the face strokes as an intensity map (core, glow) in a patch around (cx, cy); peel slides and shears them off"""
    P = 520
    im = Image.new("L", (P, P), 0)
    dr = ImageDraw.Draw(im)
    for f in feats:
        def tr(x, y):
            px, py = x * R * sx, y * R * sy
            if peel > 0:                                               # peeling: falls away down-right, curling
                px += 70 * peel + 30 * peel * y
                py += 200 * peel ** 1.6 + 40 * peel * (x + 1)
            return (P / 2 + px, P / 2 + py)
        if f[0] == "line":
            dr.line([tr(*p) for p in f[1]], fill=255, width=6, joint="curve")
        elif f[0] == "dot":
            x, y = tr(f[1], f[2])
            r = f[3] * R
            dr.ellipse([x - r, y - r, x + r, y + r], fill=255)
        elif f[0] == "ring":
            x, y = tr(f[1], f[2])
            r = f[3] * R
            dr.ellipse([x - r, y - r, x + r, y + r], outline=255, width=5)
    core = np.asarray(im.filter(ImageFilter.GaussianBlur(1.6)), np.float32) / 255 * alpha
    glow = np.asarray(im.filter(ImageFilter.GaussianBlur(9)), np.float32) / 255 * alpha
    return core, glow, int(cx - P / 2), int(cy - P / 2)


def add_patch(a, m, x0, y0, col):
    h, w = m.shape
    ya, yb, xa, xb = max(0, y0), min(H, y0 + h), max(0, x0), min(W, x0 + w)
    if ya < yb and xa < xb:
        a[ya:yb, xa:xb] += m[ya - y0:yb - y0, xa - x0:xb - x0, None] * col


def place(frame):
    rgb, al = key(frame)
    w, h = int(CW * Z), int(CH * Z)
    im = np.asarray(Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8)).resize((w, h), Image.LANCZOS), np.float32)
    am = np.asarray(Image.fromarray((al * 255).astype(np.uint8)).resize((w, h), Image.LANCZOS), np.float32) / 255
    out = np.zeros((H, W, 3), np.float32)
    a = np.zeros((H, W), np.float32)
    ya, yb, xa, xb = max(0, OY), min(H, OY + h), max(0, OX), min(W, OX + w)
    out[ya:yb, xa:xb] = im[ya - OY:yb - OY, xa - OX:xb - OX]
    a[ya:yb, xa:xb] = am[ya - OY:yb - OY, xa - OX:xb - OX]
    return out, a


def main():
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    rd = Reader("u119")
    out = None
    if not TEST:
        out = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                                str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p",
                                os.environ.get("VOUT", "out/drawn/mirror.mp4")], stdin=subprocess.PIPE)
    sparks = []                                                         # (x, y, vx, vy, born)
    for fr in range(int(DUR * FPS)):
        t = fr / FPS
        s = S0 + t
        # ---- where the light is: it arrives, sits by his head; after the peel it drifts close to his cheek
        u = ramp(s, S0, 62.0)
        lx = FACE[0] + (1 - u) * 260 + 10 * math.sin(s * 1.7) * (1 - ramp(s, 62.0, 63.0))
        ly = FACE[1] - (1 - u) * 330 + 8 * math.sin(s * 2.3)
        if s > PEEL1:
            v = ramp(s, PEEL1, 81.6)
            lx, ly = lx + (440 - lx) * v, ly + (500 - ly) * v
        faceon = ramp(s, 62.0, 62.6)                                    # the face appears on the light
        peel = ramp(s, PEEL0, PEEL1)
        # peeled-off sparks: shed from the falling strokes
        if PEEL0 <= s < PEEL1 + 0.3:
            for _ in range(6):
                sparks.append((lx + rng.normal(0, 40) + 70 * peel, ly + rng.normal(0, 30) + 160 * peel ** 1.6,
                               rng.normal(15, 25), rng.normal(40, 30), s))
        sparks = [p for p in sparks if s - p[4] < 1.2]
        if TEST and not any(abs(s - q) < 0.5 / FPS for q in TEST):
            continue
        if PART and not (PART[0] <= t < PART[1]):
            continue
        frame = rd.at(clip_t(s))
        person, al = place(frame)
        # ---- the stage: near black, a faint haze behind him
        a = np.zeros((H, W, 3), np.float32) + np.array([4, 4, 7], np.float32)
        a += np.exp(-((xs - 320) ** 2 + (ys - 520) ** 2) / (2 * 430 ** 2))[..., None] * np.array([22, 19, 28], np.float32)
        # ---- him: a dim key from above, and the light's warmth on the side of him near it
        warm = 1.0 + 0.6 * ramp(s, PEEL1, 81.6)
        near = 1 / (1 + ((xs - lx) ** 2 + (ys - ly) ** 2) / ((300 * warm) ** 2)) * ramp(s, S0 + 0.3, 62.0)
        top_light = np.clip(1.1 - ys / H * 0.5, 0.5, 1.05)[..., None]
        lit = person * (0.40 * top_light) + person / 255 * AMBER[None, None] * (near * 0.9 * warm)[..., None]
        a = a * (1 - al[..., None]) + lit * al[..., None]
        # ---- the light: a bright core that opens into a soft disc while it wears a face, and closes again after
        disc = faceon * (1 - peel)
        d2 = (xs - lx) ** 2 + (ys - ly) ** 2
        feats, sx, sy, dy = face_at(s)
        rc = 11 + 4 * (warm - 1)
        g = np.exp(-d2 / (2 * (rc * 6 + 40 * disc) ** 2)) * (0.45 + 0.25 * (warm - 1))
        g += np.exp(-d2 / (2 * rc ** 2)) * 1.4 * (1 - disc) + np.exp(-d2 / (2 * (rc * 0.35) ** 2)) * 2 * (1 - disc)
        de = np.sqrt(((xs - lx) / sx) ** 2 + ((ys - ly - dy) / sy) ** 2)            # the disc (stretched with the face)
        g += np.clip(1 - (de - R * 1.05) / 14, 0, 1) * 0.22 * disc
        a += g[..., None] * AMBER
        # ---- the face, and its peeling
        if faceon > 0 and s < PEEL1:
            core, glow, x0, y0 = render_face(feats, lx, ly + dy, sx, sy, peel, faceon * (1 - ramp(s, PEEL0 + 0.6, PEEL1)))
            add_patch(a, core * 1.7, x0, y0, CORE)
            add_patch(a, glow * 0.9, x0, y0, AMBER)
        for (px, py, vx, vy, born) in sparks:
            age = s - born
            qx, qy = px + vx * age, py + vy * age + 60 * age * age
            k = (1 - age / 1.2) * 1.4
            ya, yb, xa, xb = int(max(0, qy - 12)), int(min(H, qy + 13)), int(max(0, qx - 12)), int(min(W, qx + 13))
            if ya < yb and xa < xb:
                a[ya:yb, xa:xb] += (np.exp(-((xs[ya:yb, xa:xb] - qx) ** 2 + (ys[ya:yb, xa:xb] - qy) ** 2) / (2 * 3 ** 2)) * k)[..., None] * AMBER
        a = 255 * (1 - np.exp(-a / 255 * 1.2))
        a *= ease(t / 0.8)
        if s > S1 - 0.45:
            a *= 1 - ease((s - (S1 - 0.45)) / 0.4)
        a += rng.normal(0, 2.0, (H, W, 1))
        frame_out = np.clip(a, 0, 255).astype(np.uint8)
        if TEST:
            Image.fromarray(frame_out).save(f"{os.environ['TESTDIR']}/m{s:05.2f}.png")
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
