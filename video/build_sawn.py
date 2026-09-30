"""'Sawn in Half' (The Iron Ballroom 43.0-66.0 + the end line). The oldest trick, done to the question everyone asks
about AI: what is inside? A stage, red curtains, one box on a stand - a head out of one end, feet out of the other.
The band drops to nothing (45.6) and a saw floats in by itself and cuts, the only sound its own rasp, on the beat.
The feet wiggle: still alive. The band builds (56.0) and the halves slide apart: inside there is no body, only a
universe - the real one, living - and its light spills over the stage. In the hush (59.7) the head opens its eyes and
turns to look into itself. Full band (63.0): the universe bursts out over the stage like confetti. Ta-da.
    python3 video/build_sawn.py      (TEST=t1,t2 TESTDIR=dir for stills; PART=a,b VOUT=f; writes out/sawn-fx.wav)
"""
import math
import os
import subprocess

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import gaussian_filter

F = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS, SS = 704, 1280, 24, 2
WD, HD = 960, 1745                # the stage is drawn wider than the frame; a camera frames it
XO = (WD - W) / 2
BEAT, PHASE = 60 / 135.0, 0.01
S0, S1 = 43.0, 66.0
DUR = S1 - S0
HUSH, SAW_IN, CUT0, CUT1, WIGGLE, OPEN0, OPEN1, LOOK0, TADA = 45.6, 46.0, 47.25, 52.0, 53.6, 56.0, 59.6, 59.8, 63.0
TEST = [float(x) for x in os.environ.get("TEST", "").split(",") if x]
PART = [float(x) for x in os.environ.get("PART", "").split(",") if x]
rng = np.random.default_rng(55)
# the box (1x coordinates)
BX0, BX1, BY0, BY1 = 150 + XO, 554 + XO, 900, 1042
MID = (BX0 + BX1) / 2
SPREAD = 118                      # how far each half slides
CROP = (320, 640, 380, 639)       # where the recorded world is alive (from Glass)


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def ramp(s, a, b):
    return ease((s - a) / (b - a))


def beat(s):
    return (s - PHASE) / BEAT


# ------------------------------------------------------------------ the stage, drawn once
def stage():
    ys, xs = np.mgrid[0:HD, 0:WD].astype(np.float32)
    a = np.zeros((HD, WD, 3), np.float32) + np.array([10, 6, 8], np.float32)
    back = np.exp(-(((xs - WD / 2) / 380) ** 2 + ((ys - 760) / 520) ** 2))
    a += back[..., None] * np.array([60, 28, 40], np.float32)
    # curtains: deep red velvet in folds, left, right and a swag across the top
    fold = 0.5 + 0.5 * np.sin(xs / 17.0 + np.sin(ys / 190.0) * 1.3)
    velvet = np.array([120, 14, 26], np.float32) * (0.35 + 0.75 * fold[..., None] ** 1.6)
    left = xs < 60 + 26 * np.sin(ys / 260.0)
    right = xs > WD - 60 - 26 * np.sin(ys / 260.0 + 1)
    top = ys < 230 + 50 * np.cos((xs - WD / 2) / 150.0) ** 2
    cur = (left | right | top)
    a[cur] = velvet[cur] * (0.8 + 0.2 * (ys[cur] / HD))[..., None]
    gold = (np.abs(ys - (230 + 50 * np.cos((xs - WD / 2) / 150.0) ** 2)) < 4) & ~(left | right)
    a[gold] = np.array([200, 160, 70], np.float32)
    # the stage floor: boards, fading toward the front edge
    floor = ys > 1210
    boards = 0.8 + 0.2 * (np.sin(ys / 5.0 + np.floor(xs / 88) * 2) > 0.95)
    plank = np.array([60, 36, 22], np.float32) * (0.6 + 0.5 * np.clip(1 - (ys - 1210) / 535, 0, 1))[..., None]
    a[floor & ~cur] = (plank * boards[..., None])[floor & ~cur]
    return a


def draw_box(d, dx_left, dx_right, cut_depth, k):
    """the two halves of the box, their stands, the stars; cut_depth 0..1 = how far the saw has gone"""
    for half, dx in (("L", -dx_left), ("R", dx_right)):
        x0 = (BX0 if half == "L" else MID) + dx
        x1 = (MID if half == "L" else BX1) + dx
        # the stand: a gold leg under each half
        lx = (x0 + x1) / 2
        d.polygon([((lx - 16) * k, BY1 * k), ((lx + 16) * k, BY1 * k), ((lx + 9) * k, 1212 * k), ((lx - 9) * k, 1212 * k)], fill=(170, 130, 60))
        d.ellipse([(lx - 40) * k, 1204 * k, (lx + 40) * k, 1222 * k], fill=(130, 96, 44))
        # the box: midnight lacquer, gold trim, gold stars
        d.rectangle([x0 * k, BY0 * k, x1 * k, BY1 * k], fill=(18, 22, 58))
        d.rectangle([x0 * k, BY0 * k, x1 * k, (BY0 + 6) * k], fill=(200, 160, 70))
        d.rectangle([x0 * k, (BY1 - 6) * k, x1 * k, BY1 * k], fill=(200, 160, 70))
        edge_x = x0 if half == "L" else x1
        d.rectangle([(edge_x - 3) * k, BY0 * k, (edge_x + 3) * k, BY1 * k], fill=(200, 160, 70))
        r2 = np.random.default_rng(3 if half == "L" else 4)
        for _ in range(9):
            sx, sy = r2.uniform(x0 + 16, x1 - 16), r2.uniform(BY0 + 22, BY1 - 22)
            rr = r2.uniform(5, 9)
            pts = []
            for q in range(10):
                ang = -math.pi / 2 + q * math.pi / 5
                rad = rr if q % 2 == 0 else rr * 0.42
                pts.append(((sx + rad * math.cos(ang)) * k, (sy + rad * math.sin(ang)) * k))
            d.polygon(pts, fill=(220, 180, 80))
    # the cut: a dark slit where the blade has gone
    if cut_depth > 0 and dx_left < 1:
        d.rectangle([(MID - 1.5) * k, BY0 * k, (MID + 1.5) * k, (BY0 + (BY1 - BY0) * cut_depth) * k], fill=(4, 4, 8))


def draw_head(d, dx, look, k, eyes_open):
    """a head out of the left end, lying on its back on a small pillow; `look` 0..1 turns it toward the gap"""
    cx, cy = BX0 - 74 - dx, BY0 + 66
    g = 1.3
    d.ellipse([(cx - 48 * g) * k, (cy + 18 * g) * k, (cx + 44 * g) * k, (cy + 58 * g) * k], fill=(230, 226, 214))      # pillow
    d.rectangle([(cx + 30 * g) * k, (cy - 16 * g) * k, (BX0 - dx + 2) * k, (cy + 20 * g) * k], fill=(236, 206, 178))   # neck into the box
    d.ellipse([(cx - 40 * g) * k, (cy - 44 * g) * k, (cx + 40 * g) * k, (cy + 44 * g) * k], fill=(236, 206, 178))      # face
    d.chord([(cx - 44 * g) * k, (cy - 50 * g) * k, (cx + 44 * g) * k, (cy + 30 * g) * k], 180, 360, fill=(40, 26, 20))   # hair
    ex = 14 * look
    for sx in (-19, 19):
        x, y = cx + sx + ex, cy + 5
        if eyes_open > 0.5:
            d.ellipse([(x - 8) * k, (y - 8) * k, (x + 8) * k, (y + 8) * k], fill=(250, 250, 250))
            d.ellipse([(x - 4 + 4 * look) * k, (y - 4) * k, (x + 4 + 4 * look) * k, (y + 4) * k], fill=(20, 20, 30))
        else:
            d.arc([(x - 7) * k, (y - 5) * k, (x + 7) * k, (y + 5) * k], 20, 160, fill=(80, 50, 40), width=int(2 * k))
    d.ellipse([(cx - 36 + ex) * k, (cy + 18) * k, (cx - 23 + ex) * k, (cy + 26) * k], fill=(240, 170, 160))   # a cheek
    d.ellipse([(cx + 23 + ex) * k, (cy + 18) * k, (cx + 36 + ex) * k, (cy + 26) * k], fill=(240, 170, 160))


def draw_feet(d, dx, wig, k):
    """two shoes out of the right end, toes up, wiggling"""
    for i, oy in enumerate((BY0 + 40, BY0 + 92)):
        a = math.radians(wig * (1 if i == 0 else -1))
        bx, by = BX1 + dx, oy
        pts = [(x * 1.3, y * 1.3) for x, y in [(0, -10), (34, -12), (58, -40), (70, -38), (72, -8), (70, 14), (0, 14)]]
        rp = [((bx + x * math.cos(a) - y * math.sin(a)) * k, (by + x * math.sin(a) + y * math.cos(a)) * k) for x, y in pts]
        d.polygon(rp, fill=(150, 20, 30))
        d.rectangle([bx * k, (by - 12) * k, (bx + 10) * k, (by + 14) * k], fill=(240, 240, 240))    # a white sock


def draw_saw(d, x, y, k):
    """a big hand saw, floating: blade with teeth, wooden handle"""
    bw, bh = 330, 70
    blade = [(x - bw / 2, y - bh), (x + bw / 2, y - bh * 0.55), (x + bw / 2, y), (x - bw / 2, y)]
    d.polygon([(px * k, py * k) for px, py in blade], fill=(196, 202, 210))
    d.line([((x - bw / 2) * k, (y - bh + 8) * k), ((x + bw / 2) * k, (y - bh * 0.55 + 6) * k)], fill=(240, 244, 250), width=int(3 * k))
    for i in range(34):
        tx = x - bw / 2 + i * bw / 34
        d.polygon([(tx * k, y * k), ((tx + bw / 68) * k, (y + 9) * k), ((tx + bw / 34) * k, y * k)], fill=(170, 176, 186))
    hx = x + bw / 2
    d.rounded_rectangle([(hx - 6) * k, (y - bh * 0.7) * k, (hx + 66) * k, (y + 14) * k], radius=int(18 * k), fill=(120, 60, 30))
    d.ellipse([(hx + 14) * k, (y - bh * 0.45) * k, (hx + 50) * k, (y - 4) * k], fill=(10, 6, 8))


class World:
    def __init__(self, path, t0):
        self.p = subprocess.Popen([F, "-loglevel", "error", "-ss", str(t0), "-i", path, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                                  stdout=subprocess.PIPE)
        self.last = np.zeros((H, W, 3), np.uint8)

    def next(self):
        raw = self.p.stdout.read(W * H * 3)
        if len(raw) == W * H * 3:
            self.last = np.frombuffer(raw, np.uint8).reshape(H, W, 3)
        return self.last


def fx():
    """the saw's own rasp: each stroke a burst of toothed, band-limited noise"""
    SR = 44100
    out = np.zeros(int((DUR + 4) * SR))
    b0 = beat(CUT0)
    k = 0
    while True:
        s = PHASE + (math.ceil(b0) + k) * BEAT
        if s >= CUT1:
            break
        t = np.arange(int(0.36 * SR)) / SR
        n = rng.normal(0, 1, len(t))
        from scipy.signal import butter, lfilter
        bb, aa = butter(2, [1800 / (SR / 2), 6500 / (SR / 2)], btype="band")
        n = lfilter(bb, aa, n)
        teeth = 0.55 + 0.45 * np.sign(np.sin(2 * np.pi * (70 + 30 * (k % 2)) * t))
        env = np.sin(np.pi * np.clip(t / 0.36, 0, 1)) ** 0.7
        i = int((s - S0) * SR)
        out[i:i + len(t)] += n * teeth * env * (0.22 if k % 2 == 0 else 0.16)
        k += 1
    raw = (np.clip(out, -1, 1) * 32767).astype(np.int16).tobytes()
    subprocess.run([F, "-loglevel", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "-", "out/sawn-fx.wav"],
                   input=raw, check=True)


def main():
    if not PART or PART[0] == 0:
        fx()
    base = stage()
    world = World("out/your-turn/world.mp4", 80.0)
    ys, xs = np.mgrid[0:HD, 0:WD].astype(np.float32)
    confetti = None
    out = None
    if not TEST:
        out = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                                str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "15", "-preset", "slow", "-pix_fmt", "yuv420p",
                                os.environ.get("VOUT", "out/drawn/sawn.mp4")], stdin=subprocess.PIPE)
    for n in range(int(DUR * FPS)):
        t = n / FPS
        s = S0 + t
        wf = world.next()
        b = beat(s)
        # confetti: born at the ta-da from the gap, coloured by the living world itself, simulated every frame
        if s >= TADA and confetti is None:
            wx, wy, ww, wh = CROP
            m = 900
            px = rng.uniform(MID - SPREAD + 8, MID + SPREAD - 8, m)
            py = rng.uniform(BY0 + 6, BY1 - 6, m)
            sx = np.clip((wx + (px - (MID - SPREAD)) / (2 * SPREAD) * ww).astype(int), 0, W - 1)   # sampled from the world frame
            sy = np.clip((wy + (py - BY0) / (BY1 - BY0) * wh).astype(int), 0, H - 1)
            col = wf[sy, sx].astype(np.float32)
            bright = col.max(axis=1) > 60
            col = np.where(bright[:, None], col * 1.4, np.array([255, 220, 150], np.float32) * rng.uniform(0.5, 1, (m, 1)))
            vx = rng.normal(0, 3.2, m)
            vy = -rng.uniform(8, 20, m)
            confetti = [px, py, vx, vy, np.clip(col, 0, 255), rng.uniform(2, 5, m), rng.uniform(0, 6.28, m)]
        if confetti is not None:
            px, py, vx, vy, col, sz, spin = confetti
            px += vx
            py += vy
            vy += 0.42
            vx *= 0.985
            vy *= 0.985
            spin += 0.3
        if TEST and not any(abs(s - q) < 0.5 / FPS for q in TEST):
            continue
        if PART and not (PART[0] <= t < PART[1]):
            continue
        dim = 1 - 0.45 * ramp(s, HUSH, HUSH + 0.6) * (1 - ramp(s, OPEN0, OPEN1))
        a = base * dim
        # the spotlight on the box
        spot = np.exp(-(((xs - MID) / 400) ** 2 + ((ys - 1000) / 400) ** 2))
        a += spot[..., None] * np.array([90, 76, 60], np.float32) * (0.8 + 0.4 * ramp(s, TADA, TADA + 0.3))
        # ---- the drawn things at 2x
        open_ = ramp(s, OPEN0, OPEN1 - 0.6)
        dx = SPREAD * open_
        cut = ramp(s, CUT0, CUT1)
        saw_y_top = -120 + (BY0 - 4 + 120) * ramp(s, SAW_IN, CUT0)
        saw_y = saw_y_top + (BY1 - BY0 + 10) * cut
        stroke = 64 * math.sin(math.pi * (b - beat(CUT0))) if CUT0 <= s < CUT1 else 0.0
        saw_out = ramp(s, CUT1 + 0.2, CUT1 + 1.4)
        saw_x = MID + stroke + 520 * saw_out ** 1.5
        saw_y -= 300 * saw_out
        wig = 0.0
        if s < HUSH:
            wig = 14 * math.sin(math.pi * b)
        elif WIGGLE <= s < WIGGLE + 1.2:
            wig = 18 * math.sin(2 * math.pi * (s - WIGGLE) / 0.3) * (1 - (s - WIGGLE) / 1.2)
        elif s >= TADA:
            wig = 16 * math.sin(math.pi * b)
        look = ramp(s, LOOK0 + 0.6, LOOK0 + 2.2)
        eyes = 1.0 if s >= LOOK0 + 0.3 else 0.0
        k = SS
        lay = Image.new("RGBA", (WD * k, HD * k), (0, 0, 0, 0))
        d = ImageDraw.Draw(lay)
        draw_box(d, dx, dx, cut, k)
        draw_head(d, dx, look, k, eyes)
        draw_feet(d, dx, wig, k)
        if SAW_IN <= s < CUT1 + 1.6:
            draw_saw(d, saw_x, saw_y, k)
        lay = lay.resize((WD, HD), Image.LANCZOS)
        la = np.asarray(lay, np.float32)
        alpha = la[..., 3:4] / 255
        # light falls on the drawn things from the spot
        lit = la[..., :3] * (0.55 + 0.6 * spot[..., None]) * dim
        a = a * (1 - alpha) + lit * alpha
        # ---- inside: no body, a universe, and its light
        if open_ > 0:
            gx0, gx1 = MID - dx, MID + dx
            wx, wy, ww, wh = CROP
            gw, gh = max(2, int(gx1 - gx0)), BY1 - BY0
            inner = np.asarray(Image.fromarray(wf).crop((wx, wy, wx + ww, wy + wh)).resize((2 * SPREAD, gh), Image.LANCZOS), np.float32)
            c0 = int(SPREAD - gw / 2)
            inner = inner[:, max(0, c0):max(0, c0) + gw]
            iy0, ix0 = int(BY0), int(gx0)
            a[iy0:iy0 + gh, ix0:ix0 + inner.shape[1]] = inner * 1.5 + np.array([8, 10, 22], np.float32)
            glow = np.exp(-(((xs - MID) / (40 + dx * 0.9)) ** 2)) * np.clip((BY1 - ys) / 700, 0, 1) * (ys < BY0)
            glow += np.exp(-(((xs - MID) / (60 + dx)) ** 2 + ((ys - (BY0 + BY1) / 2) / 130) ** 2)) * 0.6
            a += glow[..., None] * np.array([120, 170, 230], np.float32) * open_ * (0.7 + 0.5 * ramp(s, TADA, TADA + 0.4))
        # ---- the ta-da
        if confetti is not None:
            im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
            d = ImageDraw.Draw(im)
            px, py, vx, vy, col, sz, spin = confetti
            for i in range(len(px)):
                if 0 <= px[i] < WD and 0 <= py[i] < HD:
                    w_ = sz[i] * abs(math.cos(spin[i])) + 0.8
                    d.rectangle([px[i] - w_, py[i] - sz[i], px[i] + w_, py[i] + sz[i]], fill=tuple(int(c) for c in col[i]))
            a = np.asarray(im, np.float32)
            burst = ramp(s, TADA, TADA + 0.12) * (1 - ramp(s, TADA + 0.12, TADA + 0.9))
            a += np.exp(-(((xs - MID) / 320) ** 2 + ((ys - 960) / 320) ** 2))[..., None] * np.array([255, 240, 220], np.float32) * 0.5 * burst
        # the camera: the whole stage, a push in on the head and the gap in the hush, back out for the ta-da
        push = ramp(s, LOOK0 - 0.2, LOOK0 + 2.4) * (1 - ramp(s, TADA - 0.15, TADA + 0.35))
        closed = 1 - ramp(s, OPEN0, OPEN1)              # tighter on the box while it is whole
        zc = 1.0 + 0.16 * closed + 0.7 * push
        head_x = BX0 - 74 - dx
        tx = WD / 2 * (1 - push) + ((head_x + MID) / 2) * push      # between the head and the gap
        ty = (BY0 - 60) * (1 - push) + (BY0 + 20) * push
        fw, fh = WD / zc, HD / zc
        fx0, fy0 = tx - fw / 2, ty - fh * 0.55
        fx0, fy0 = min(max(fx0, 0), WD - fw), min(max(fy0, 0), HD - fh)
        a = np.asarray(Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).resize((W, H), Image.LANCZOS,
                                                                                   box=(fx0, fy0, fx0 + fw, fy0 + fh)), np.float32)
        a *= ease(t / 0.4)
        if s >= S1 - 0.08:
            a *= 0
        a += rng.normal(0, 2.4, (H, W, 1))
        frame = np.clip(a, 0, 255).astype(np.uint8)
        if TEST:
            Image.fromarray(frame).save(f"{os.environ['TESTDIR']}/w{s:.2f}.png")
            print("test", round(s, 2), flush=True)
            continue
        out.stdin.write(frame.tobytes())
        if n % 96 == 0:
            print(f"{s:6.1f}", flush=True)
    if out:
        out.stdin.close()
        out.wait()


if __name__ == "__main__":
    main()
