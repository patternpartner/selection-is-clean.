"""'Sawn in Half' (The Iron Ballroom 43.0-66.0 + the end line). The oldest trick, done to the question everyone asks
about AI: what is inside? A stage, red curtains, one box on a stand - a head out of one end, feet out of the other - and a ringmaster.
The band drops to nothing (45.6); he raises a saw, blade down, and cuts straight down through the box, the only
sound its rasp, on the beat. He pulls the halves apart himself.
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


RX = MID + 112                    # the ringmaster stands behind the box, beside the cut, so the saw never hides his face
SHY = BY0 - 232                   # his shoulders


def draw_saw(d, x, tip, k):
    """a big hand saw held upright, blade pointing down: teeth down its leading edge, wooden handle on top"""
    L, w0, w1 = 230, 26, 60
    top = tip - L
    blade = [(x - w0 / 2, tip), (x + w0 / 2, tip), (x + w1 / 2, top), (x - w1 / 2, top)]
    d.polygon([(px * k, py * k) for px, py in blade], fill=(196, 202, 210))
    d.line([((x + w0 / 2 - 4) * k, (tip - 6) * k), ((x + w1 / 2 - 5) * k, (top + 4) * k)], fill=(240, 244, 250), width=int(3 * k))
    for i in range(22):
        ty = tip - i * L / 22
        wx = x - (w0 + (w1 - w0) * i / 22) / 2
        d.polygon([(wx * k, ty * k), ((wx - 9) * k, (ty - L / 44) * k), (wx * k, (ty - L / 22) * k)], fill=(170, 176, 186))
    d.rounded_rectangle([(x - 44) * k, (top - 58) * k, (x + 44) * k, (top + 8) * k], radius=int(18 * k), fill=(120, 60, 30))
    d.ellipse([(x - 24) * k, (top - 44) * k, (x + 24) * k, (top - 12) * k], fill=(10, 6, 8))


def draw_ringmaster_body(d, k, look_x, hat_up, beam):
    """behind the box: red tailcoat, white shirt, bow tie, a face with a big moustache, a tall top hat"""
    x, sy = RX, SHY
    d.polygon([((x - 70) * k, (sy + 6) * k), ((x + 70) * k, (sy + 6) * k), ((x + 58) * k, (BY0 + 12) * k), ((x - 58) * k, (BY0 + 12) * k)],
              fill=(168, 22, 30))                                                                   # coat
    d.polygon([((x - 22) * k, (sy + 4) * k), ((x + 22) * k, (sy + 4) * k), ((x + 12) * k, (sy + 150) * k), ((x - 12) * k, (sy + 150) * k)],
              fill=(240, 236, 228))                                                                 # shirt
    for sgn in (-1, 1):
        d.polygon([((x + sgn * 22) * k, (sy + 4) * k), ((x + sgn * 44) * k, (sy + 10) * k), ((x + sgn * 14) * k, (sy + 120) * k)],
                  fill=(30, 10, 14))                                                                # lapels
    for yb in (sy + 60, sy + 110, sy + 160, sy + 205):
        d.ellipse([(x - 30 - 6) * k, (yb - 6) * k, (x - 30 + 6) * k, (yb + 6) * k], fill=(222, 180, 80))
        d.ellipse([(x + 30 - 6) * k, (yb - 6) * k, (x + 30 + 6) * k, (yb + 6) * k], fill=(222, 180, 80))
    d.polygon([((x - 18) * k, (sy + 6) * k), ((x - 2) * k, (sy + 14) * k), ((x - 18) * k, (sy + 22) * k)], fill=(20, 16, 20))   # bow tie
    d.polygon([((x + 18) * k, (sy + 6) * k), ((x + 2) * k, (sy + 14) * k), ((x + 18) * k, (sy + 22) * k)], fill=(20, 16, 20))
    hx, hy = x, sy - 62
    d.rectangle([(hx - 14) * k, (sy - 20) * k, (hx + 14) * k, (sy + 6) * k], fill=(232, 196, 166))    # neck
    d.ellipse([(hx - 42) * k, (hy - 50) * k, (hx + 42) * k, (hy + 50) * k], fill=(236, 200, 170))    # face
    for sgn in (-1, 1):
        ex, ey = hx + sgn * 16, hy - 8
        d.ellipse([(ex - 8) * k, (ey - 8) * k, (ex + 8) * k, (ey + 8) * k], fill=(250, 250, 250))
        d.ellipse([(ex - 4 + 4 * look_x) * k, (ey - 4) * k, (ex + 4 + 4 * look_x) * k, (ey + 4) * k], fill=(20, 20, 30))
        d.line([((ex - 10) * k, (ey - 16) * k), ((ex + 8) * k, (ey - 19 - 3 * beam) * k)], fill=(40, 26, 20), width=int(4 * k))   # brows
    d.ellipse([(hx - 34) * k, (hy + 6) * k, (hx - 20) * k, (hy + 16) * k], fill=(240, 160, 150))
    d.ellipse([(hx + 20) * k, (hy + 6) * k, (hx + 34) * k, (hy + 16) * k], fill=(240, 160, 150))
    d.ellipse([(hx - 6) * k, (hy - 2) * k, (hx + 6) * k, (hy + 14) * k], fill=(222, 170, 140))       # nose
    d.chord([(hx - 40) * k, (hy + 8) * k, (hx + 2) * k, (hy + 36) * k], 180, 360, fill=(40, 24, 18))     # moustache
    d.chord([(hx - 2) * k, (hy + 8) * k, (hx + 40) * k, (hy + 36) * k], 180, 360, fill=(40, 24, 18))
    ty = hy - 44 - hat_up
    d.rectangle([(hx - 58) * k, (ty - 8) * k, (hx + 58) * k, (ty + 6) * k], fill=(18, 16, 20))       # brim
    d.rectangle([(hx - 38) * k, (ty - 118) * k, (hx + 38) * k, (ty - 4) * k], fill=(22, 20, 26))     # crown
    d.rectangle([(hx - 38) * k, (ty - 30) * k, (hx + 38) * k, (ty - 12) * k], fill=(168, 22, 30))    # band


def draw_arms(d, k, hands):
    """two red sleeves from the shoulders to white gloves at the given hand points"""
    for sgn, (hx, hy) in zip((-1, 1), hands):
        sx, sy = RX + sgn * 60, SHY + 16
        dx, dy = hx - sx, hy - sy
        dist = max(1e-3, math.hypot(dx, dy))
        L = 120
        reach = min(dist, 2 * L - 1)
        h = math.sqrt(max(0, L * L - (reach / 2) ** 2))
        mx, my = sx + dx / 2, sy + dy / 2
        nx, ny = -dy / dist, dx / dist
        if nx * sgn < 0:
            nx, ny = -nx, -ny
        ex, ey = mx + nx * h, my + ny * h                                    # the elbow bends outward
        for (a, b) in (((sx, sy), (ex, ey)), ((ex, ey), (hx, hy))):
            d.line([(a[0] * k, a[1] * k), (b[0] * k, b[1] * k)], fill=(168, 22, 30), width=int(30 * k))
            d.ellipse([(b[0] - 15) * k, (b[1] - 15) * k, (b[0] + 15) * k, (b[1] + 15) * k], fill=(168, 22, 30))
        d.ellipse([(hx - 19) * k, (hy - 19) * k, (hx + 19) * k, (hy + 19) * k], fill=(246, 246, 240))   # glove


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
        # the saw: lifted from the wings, raised over the box, down through it in strokes on the beat, put away
        b0 = beat(CUT0)
        stroke = 34 * math.sin(math.pi * (b - b0)) if CUT0 <= s < CUT1 else 0.0
        lift = ramp(s, SAW_IN, CUT0)
        tip = (SHY - 40) * (1 - lift) + (BY0 - 8) * lift + (BY1 - BY0 + 34) * cut + stroke
        saw_x = (MID + 330) * (1 - lift) + MID * lift
        away = ramp(s, CUT1 + 0.15, CUT1 + 1.3)
        tip -= (BY1 - BY0 + 330) * away
        saw_x += 360 * away ** 1.4
        handle = (saw_x, tip - 230 - 26)
        # the ringmaster's hands
        if s < HUSH:                     # presenting: one hand sweeps toward the head, the other on his hip, on the beat
            wave = 20 * math.sin(math.pi * b)
            hands = [(MID - 250, 720 + wave), (RX + 104, SHY + 160)]
        elif s < CUT1 + 0.9:             # on the saw
            hands = [(handle[0], handle[1] - 4), (RX + 104, SHY + 160)]         # one hand saws, the other on his hip
        elif s < OPEN0 - 0.3:            # waiting
            hands = [(RX - 34, SHY + 150), (RX + 34, SHY + 150)]
        elif s < OPEN1 + 0.3:            # pulling the halves apart
            hands = [(MID - dx - 26, BY0 + 18), (MID + dx + 26, BY0 + 18)]
        elif s < TADA - 0.1:             # hands clasped, watching the head look
            hands = [(RX - 14, SHY + 120), (RX + 14, SHY + 120)]
        else:                            # ta-da
            up = ramp(s, TADA - 0.1, TADA + 0.25)
            hands = [(RX - 34 - 140 * up, SHY + 120 - 230 * up), (RX + 34 + 140 * up, SHY + 120 - 230 * up)]
        rm_look = -ramp(s, LOOK0 + 0.4, LOOK0 + 1.4) * (1 - ramp(s, TADA, TADA + 0.4))
        hat_up = 70 * ramp(s, TADA, TADA + 0.25) * (1 - ramp(s, TADA + 1.2, TADA + 1.8))
        beam = 1.0 if (s < HUSH or s >= TADA) else 0.0
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
        draw_ringmaster_body(d, k, rm_look, hat_up, beam)
        draw_box(d, dx, dx, cut, k)
        draw_head(d, dx, look, k, eyes)
        draw_feet(d, dx, wig, k)
        if SAW_IN <= s < CUT1 + 1.4:
            draw_saw(d, saw_x, tip, k)
        draw_arms(d, k, hands)
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
