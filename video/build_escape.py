"""'The Escape Act' (Cathedral of the Storm 38.0-66.0 + the end line). The second act of the show in build_sawn.py:
same stage, same ringmaster. The escapologist's classic, done to the story everyone tells about AI - that it will
get out of the box. The star waves and hops into a trunk; the lid shuts; chains go round it on the beat; a padlock
snaps; the ringmaster shows the key and pockets it; a cloth goes over. Hush (49.0). A glow leaks from under the cloth,
the cloth twitches. The build (54.5): he grabs a corner. The breath (59.5). He pulls it (61.4) - the hit (61.6):
chains on the floor, padlock open, lid up. It got out. And it is still sitting there, holding the key out to him.
He pats his pocket - empty - takes the key, and tips his hat to it.
    python3 video/build_escape.py      (TEST=t1,t2 TESTDIR=dir; PART=a,b VOUT=f; writes out/escape-fx.wav)
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
import build_sawn as SW  # noqa: E402  (the stage and the ringmaster)

F = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS, SS = 704, 1280, 24, 2
WD, HD = SW.WD, SW.HD
BEAT, PHASE = 60 / 124.0, 0.03
S0, S1 = 38.0, 66.0
DUR = S1 - S0
HOP0, HOP1, LID1, CHAIN0, LOCK, KEYUP, POCKET, CLOTH0, CLOTH1 = 40.4, 41.4, 41.9, 42.0, 44.9, 45.1, 46.4, 47.0, 48.6
HUSH, TWITCH, BUILD, BREATH, PULL, HIT, PAT, TAKE, TIP = 49.0, 51.5, 54.5, 59.5, 61.25, 61.6, 62.0, 63.0, 64.6
TEST = [float(x) for x in os.environ.get("TEST", "").split(",") if x]
PART = [float(x) for x in os.environ.get("PART", "").split(",") if x]
FLOOR = 1210
TX0, TX1, TY0 = 300, 600, 1050          # the trunk: left, right, top of its body (bottom on the floor)
TCX = (TX0 + TX1) / 2
SW.RX, SW.SHY, SW.BY0 = 700, 730, 950     # the ringmaster stands to the right of the trunk, whole
rng = np.random.default_rng(77)


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def ramp(s, a, b):
    return ease((s - a) / (b - a))


def beat(s):
    return (s - PHASE) / BEAT


def cap(d, a, b, w, fill, k):
    d.line([(a[0] * k, a[1] * k), (b[0] * k, b[1] * k)], fill=fill, width=int(w * k))
    for q in (a, b):
        d.ellipse([(q[0] - w / 2) * k, (q[1] - w / 2) * k, (q[0] + w / 2) * k, (q[1] + w / 2) * k], fill=fill)


def draw_star(d, k, x, y, wave, happy, arm_to=None, sitting=False):
    """the star of the show (the head from the box, now whole): bob hair, striped suit, white tights, red shoes.
    (x, y) = the hips. wave: 0..1 raises the right hand; arm_to: a point the right hand reaches to (holding the key)"""
    blue, white = (40, 70, 170), (236, 236, 240)
    if not sitting:
        for sgn in (-1, 1):
            cap(d, (x + sgn * 14, y), (x + sgn * 18, FLOOR - 20), 20, (240, 240, 244), k)
            d.polygon([((x + sgn * 18 - 16) * k, (FLOOR - 26) * k), ((x + sgn * 18 + 22 * sgn) * k, (FLOOR - 14) * k),
                       ((x + sgn * 18 + 22 * sgn) * k, FLOOR * k), ((x + sgn * 18 - 16) * k, FLOOR * k)], fill=(170, 22, 32))
    # torso in stripes
    top = y - 120
    for i in range(6):
        y0 = top + i * 20
        d.rectangle([(x - 30 - i * 0.6) * k, y0 * k, (x + 30 + i * 0.6) * k, (y0 + 20) * k], fill=blue if i % 2 == 0 else white)
    # arms
    sl, sr = (x - 32, top + 12), (x + 32, top + 12)
    cap(d, sl, (x - 44, top + 70), 17, blue, k)
    cap(d, (x - 44, top + 70), (x - 36, top + 118), 15, (236, 206, 178), k)
    if arm_to is not None:
        el = ((sr[0] + arm_to[0]) / 2 + 6, (sr[1] + arm_to[1]) / 2 + 14)
        cap(d, sr, el, 17, blue, k)
        cap(d, el, arm_to, 15, (236, 206, 178), k)
    else:
        hand = (x + 44 + 30 * wave, top + 110 - 170 * wave)
        el = (x + 50 + 20 * wave, top + 64 - 70 * wave)
        cap(d, sr, el, 17, blue, k)
        cap(d, el, hand, 15, (236, 206, 178), k)
    # head
    hx, hy = x, top - 44
    d.rectangle([(hx - 10) * k, (top - 12) * k, (hx + 10) * k, (top + 2) * k], fill=(236, 206, 178))
    d.ellipse([(hx - 38) * k, (hy - 40) * k, (hx + 38) * k, (hy + 40) * k], fill=(236, 206, 178))
    d.chord([(hx - 42) * k, (hy - 46) * k, (hx + 42) * k, (hy + 26) * k], 180, 360, fill=(40, 26, 20))
    d.rectangle([(hx - 42) * k, (hy - 12) * k, (hx - 30) * k, (hy + 20) * k], fill=(40, 26, 20))
    d.rectangle([(hx + 30) * k, (hy - 12) * k, (hx + 42) * k, (hy + 20) * k], fill=(40, 26, 20))
    for sgn in (-1, 1):
        ex, ey = hx + sgn * 15, hy + 4
        if happy:
            d.arc([(ex - 8) * k, (ey - 6) * k, (ex + 8) * k, (ey + 6) * k], 200, 340, fill=(60, 40, 30), width=int(3 * k))
        else:
            d.ellipse([(ex - 7) * k, (ey - 7) * k, (ex + 7) * k, (ey + 7) * k], fill=(250, 250, 250))
            d.ellipse([(ex - 3 + 3) * k, (ey - 3) * k, (ex + 3 + 3) * k, (ey + 3) * k], fill=(20, 20, 30))
        d.ellipse([(hx + sgn * 26 - 6) * k, (hy + 16) * k, (hx + sgn * 26 + 6) * k, (hy + 24) * k], fill=(240, 170, 160))


def draw_key(d, k, x, y, ang=0.0):
    ca, sa = math.cos(ang), math.sin(ang)
    P = lambda u, v: ((x + u * ca - v * sa) * k, (y + u * sa + v * ca) * k)   # noqa: E731
    d.ellipse([P(-9, -9)[0], P(-9, -9)[1], P(9, 9)[0], P(9, 9)[1]], outline=(230, 190, 70), width=int(4 * k))
    d.line([P(8, 0), P(34, 0)], fill=(230, 190, 70), width=int(4 * k))
    d.line([P(28, 0), P(28, 7)], fill=(230, 190, 70), width=int(4 * k))
    d.line([P(33, 0), P(33, 6)], fill=(230, 190, 70), width=int(4 * k))


def draw_trunk_back(d, k, lid_open):
    """the trunk's inside and its lid (behind anything sitting in it)"""
    if lid_open > 0.02:
        lh = 150 * lid_open
        d.polygon([(TX0 * k, TY0 * k), (TX1 * k, TY0 * k), ((TX1 - 16) * k, (TY0 - lh) * k), ((TX0 + 16) * k, (TY0 - lh) * k)], fill=(96, 56, 30))
        d.polygon([((TX0 + 10) * k, (TY0 - 4) * k), ((TX1 - 10) * k, (TY0 - 4) * k), ((TX1 - 22) * k, (TY0 - lh + 8) * k),
                   ((TX0 + 22) * k, (TY0 - lh + 8) * k)], fill=(120, 20, 34))                     # the lining
        d.rectangle([TX0 * k, (TY0 - 6) * k, TX1 * k, (TY0 + 16) * k], fill=(24, 12, 10))         # the dark inside


def draw_trunk_front(d, k, lid_open, chains, lock, lock_open):
    d.rectangle([TX0 * k, TY0 * k, TX1 * k, FLOOR * k], fill=(122, 72, 38))
    for yy in range(TY0 + 30, FLOOR, 34):
        d.line([(TX0 * k, yy * k), (TX1 * k, yy * k)], fill=(100, 58, 30), width=int(2 * k))
    for xx in (TX0 + 60, TX1 - 60):                                                               # straps
        d.rectangle([(xx - 10) * k, TY0 * k, (xx + 10) * k, FLOOR * k], fill=(70, 40, 24))
    for (cx, cy) in ((TX0, TY0), (TX1, TY0), (TX0, FLOOR), (TX1, FLOOR)):                          # brass corners
        d.rectangle([(cx - 14) * k, (cy - 14) * k, (cx + 14) * k, (cy + 14) * k], fill=(200, 160, 70))
    if lid_open <= 0.02:
        d.rectangle([(TX0 - 4) * k, (TY0 - 30) * k, (TX1 + 4) * k, (TY0 + 4) * k], fill=(110, 64, 34))    # the lid, shut
        d.line([(TX0 * k, (TY0 - 30) * k), (TX1 * k, (TY0 - 30) * k)], fill=(200, 160, 70), width=int(4 * k))
    # chains: links along lines round the trunk
    wraps = [((TX0 - 8, TY0 + 30), (TX1 + 8, TY0 + 42)), ((TX0 - 8, TY0 + 110), (TX1 + 8, TY0 + 98)),
             ((TCX - 20, TY0 - 34), (TCX + 14, FLOOR - 4))]
    for i, (a, b) in enumerate(wraps):
        f = min(1.0, max(0.0, chains - i))
        n = int(26 * f)
        for j in range(n):
            u = j / 26
            px, py = a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u
            rw, rh = (8, 5) if j % 2 == 0 else (5, 8)
            if i == 2:
                rw, rh = rh, rw
            d.ellipse([(px - rw) * k, (py - rh) * k, (px + rw) * k, (py + rh) * k], outline=(170, 176, 186), width=int(3 * k))
    if lock > 0:
        lx, ly = TCX + 6, TY0 + 58
        d.rounded_rectangle([(lx - 22) * k, ly * k, (lx + 22) * k, (ly + 40) * k], radius=int(6 * k), fill=(200, 160, 70))
        d.ellipse([(lx - 4) * k, (ly + 14) * k, (lx + 4) * k, (ly + 22) * k], fill=(40, 30, 20))
        up = 14 * lock_open
        d.arc([(lx - 14) * k, (ly - 26 - up) * k, (lx + 14) * k, (ly + 6 - up) * k], 180, 360, fill=(170, 176, 186), width=int(5 * k))


def draw_floor_mess(d, k):
    """after the escape: the chains in a heap and the open padlock on the floor"""
    for i in range(40):
        a = i * 0.7
        px, py = 250 + 70 * math.cos(a) * (1 - i / 60) + i * 1.5, FLOOR - 8 - 10 * abs(math.sin(a * 1.7))
        d.ellipse([(px - 7) * k, (py - 5) * k, (px + 7) * k, (py + 5) * k], outline=(170, 176, 186), width=int(3 * k))
    lx, ly = 650, FLOOR - 40
    d.rounded_rectangle([(lx - 20) * k, ly * k, (lx + 20) * k, (ly + 36) * k], radius=int(6 * k), fill=(200, 160, 70))
    d.arc([(lx - 6) * k, (ly - 34) * k, (lx + 22) * k, (ly - 2) * k], 180, 360, fill=(170, 176, 186), width=int(5 * k))


def draw_cloth(d, k, drop, twitch, tremble, off):
    """a red drape with a gold fringe; drop 0..1 settles it over the trunk; off 0..1 whips it away up and right"""
    if drop <= 0 or off >= 1:
        return
    oy = -520 * (1 - drop) - 700 * off ** 1.4
    ox = 560 * off ** 1.2
    top = TY0 - 60 + oy - 12 * twitch
    pts = [(TX0 - 40 + ox, FLOOR + 4 + oy * 0.3), (TX0 - 20 + ox + tremble, top + 60), (TX0 + 10 + ox, top + 8),
           (TCX + ox + 8 * twitch, top - 6), (TX1 - 10 + ox, top + 8), (TX1 + 20 + ox - tremble, top + 60), (TX1 + 40 + ox, FLOOR + 4 + oy * 0.3)]
    d.polygon([(x * k, y * k) for x, y in pts], fill=(150, 18, 32))
    for i in range(5):                                                                          # folds
        fx = TX0 + 30 + i * 60 + ox
        d.line([(fx * k, (top + 30) * k), ((fx - 10) * k, (FLOOR + oy * 0.3) * k)], fill=(120, 12, 24), width=int(6 * k))
    d.line([((TX0 - 40 + ox) * k, (FLOOR + oy * 0.3) * k), ((TX1 + 40 + ox) * k, (FLOOR + oy * 0.3) * k)], fill=(220, 180, 80), width=int(8 * k))


def fx():
    SR = 44100
    out = np.zeros(int((DUR + 4) * SR))

    def put(t0, sig, g):
        i = int((t0 - S0) * SR)
        out[i:i + len(sig)] += sig * g

    def rattle(dur):
        t = np.arange(int(dur * SR)) / SR
        s = np.zeros_like(t)
        for _ in range(14):
            t0 = rng.uniform(0, dur * 0.7)
            f = rng.uniform(2500, 6500)
            tt = np.clip(t - t0, 0, None)
            s += np.sin(2 * np.pi * f * tt) * np.exp(-tt * 40) * (t >= t0)
        return s
    for i in range(3):
        put(CHAIN0 + i * (LOCK - CHAIN0) / 3, rattle(0.5), 0.06)
    t = np.arange(int(0.08 * SR)) / SR
    put(LOCK, (np.sin(2 * np.pi * 3100 * t) + rng.normal(0, 0.6, len(t))) * np.exp(-t * 70), 0.2)      # click
    for (t0, dur, g) in ((CLOTH0 + 0.4, 0.9, 0.05), (PULL, 0.5, 0.09)):                                 # whooshes
        t = np.arange(int(dur * SR)) / SR
        n = gaussian_filter(rng.normal(0, 1, len(t)), 3)
        put(t0, n * np.sin(np.pi * t / dur) ** 2, g)
    raw = (np.clip(out, -1, 1) * 32767).astype(np.int16).tobytes()
    subprocess.run([F, "-loglevel", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "-", "out/escape-fx.wav"],
                   input=raw, check=True)


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


def main():
    if not PART or PART[0] == 0:
        fx()
    base = SW.stage()
    ys, xs = np.mgrid[0:HD, 0:WD].astype(np.float32)
    world = World("out/your-turn/world.mp4", 100.0)
    out = None
    if not TEST:
        out = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                                str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "15", "-preset", "slow", "-pix_fmt", "yuv420p",
                                os.environ.get("VOUT", "out/drawn/escape.mp4")], stdin=subprocess.PIPE)
    for n in range(int(DUR * FPS)):
        t = n / FPS
        s = S0 + t
        wf = world.next()
        if TEST and not any(abs(s - q) < 0.5 / FPS for q in TEST):
            continue
        if PART and not (PART[0] <= t < PART[1]):
            continue
        b = beat(s)
        revealed = s >= HIT
        # ---- state
        lid = 1.0 if s < HOP1 else (1 - ramp(s, HOP1, LID1)) if s < HIT else 1.0
        chains = 0.0 if s < CHAIN0 else min(3.0, (s - CHAIN0) / ((LOCK - CHAIN0) / 3))
        lock = 1.0 if s >= LOCK else 0.0
        drop = ramp(s, CLOTH0 + 0.3, CLOTH1)
        off = ramp(s, PULL, PULL + 0.45)
        twitch = math.exp(-((s - TWITCH) / 0.18) ** 2) + 0.6 * math.exp(-((s - TWITCH - 0.45) / 0.15) ** 2)
        tremble = 3 * math.sin(s * 40) * ramp(s, BUILD + 3, BREATH) * (1 - ramp(s, BREATH, BREATH + 0.3))
        dim = 1 - 0.4 * ramp(s, HUSH, HUSH + 0.8) * (1 - ramp(s, HIT - 0.05, HIT + 0.2))
        # the star
        if s < HOP0:
            star = (230, FLOOR - 170, 0.5 + 0.5 * math.sin(math.pi * b), False)
        elif s < HOP1:
            u = (s - HOP0) / (HOP1 - HOP0)
            star = (230 + (TCX - 230) * u, FLOOR - 170 - 180 * math.sin(math.pi * u) + 90 * u, 0.0, False)
        else:
            star = None
        # the ringmaster's hands and face
        hat_up, look, beam = 0.0, 0.0, 0.0
        if s < HOP1:
            hands = [(TX1 - 30, TY0 - 70 + 12 * math.sin(math.pi * b)), (SW.RX + 104, SW.SHY + 160)]; beam = 1
        elif s < LID1:
            hands = [(TX1 - 60, TY0 - 30), (SW.RX + 104, SW.SHY + 160)]
        elif s < LOCK:
            ph = (s - CHAIN0) * 2.2
            hands = [(TCX + 120 * math.cos(ph), TY0 + 60 + 40 * math.sin(ph)), (TX1 + 20, TY0 + 40)]
        elif s < POCKET:
            hands = [(SW.RX - 60, SW.SHY - 140 * ramp(s, KEYUP, KEYUP + 0.4)), (SW.RX + 104, SW.SHY + 160)]; beam = 1
        elif s < CLOTH0:
            hands = [(SW.RX - 30, SW.SHY + 60), (SW.RX + 104, SW.SHY + 160)]
        elif s < CLOTH1:
            u = ramp(s, CLOTH0, CLOTH1)
            hands = [(SW.RX - 120 - 160 * u, SW.SHY - 180 + 120 * u), (SW.RX + 40 - 100 * u, SW.SHY - 200 + 140 * u)]
        elif s < BUILD:
            hands = [(SW.RX - 14, SW.SHY + 120), (SW.RX + 14, SW.SHY + 120)]
            look = -1.0 * ramp(s, HUSH + 2, HUSH + 3)
        elif s < PULL:
            reach = ramp(s, BUILD + 1.5, BUILD + 3.5)
            hands = [(SW.RX - 40 - (SW.RX - 40 - (TX1 + 20)) * reach, SW.SHY - 120 + (TY0 - 40 - SW.SHY + 120) * reach),
                     (SW.RX + 60, SW.SHY - 160)]; beam = 1; look = -1
        elif s < HIT + 0.2:
            u = ramp(s, PULL, PULL + 0.4)
            hands = [(TX1 + 20 + 300 * u, TY0 - 40 - 400 * u), (SW.RX + 60, SW.SHY - 160)]
        elif s < TAKE:
            hat_up = 60 * ramp(s, HIT, HIT + 0.15) * (1 - ramp(s, HIT + 0.5, HIT + 0.9))
            look = -1
            hands = [(SW.RX - 10, SW.SHY + 40), (SW.RX + 20, SW.SHY + 50)] if s >= PAT else [(SW.RX - 80, SW.SHY - 60), (SW.RX + 80, SW.SHY - 60)]
        elif s < TIP:
            u = ramp(s, TAKE, TAKE + 0.8)
            hands = [(SW.RX - 60 - (SW.RX - 60 - (TCX + 110)) * u, SW.SHY + 20 + (TY0 - 110 - SW.SHY - 20) * u), (SW.RX + 104, SW.SHY + 160)]
            look = -1
        else:
            u = ramp(s, TIP, TIP + 0.5)
            hat_up = 40 * u
            hands = [(SW.RX + 4, SW.SHY - 120 - 40 * u), (SW.RX + 104, SW.SHY + 160)]; look = -1; beam = 1
        # an arm is two 120 px bones: never ask a hand to be further than that from its shoulder
        cl = []
        for sgn, (hx, hy) in zip((-1, 1), hands):
            sx, sy = SW.RX + sgn * 60, SW.SHY + 16
            dd = math.hypot(hx - sx, hy - sy)
            f = min(1.0, 232 / max(dd, 1e-6))
            cl.append((sx + (hx - sx) * f, sy + (hy - sy) * f))
        hands = cl
        # ---- draw
        k = SS
        lay = Image.new("RGBA", (WD * k, HD * k), (0, 0, 0, 0))
        d = ImageDraw.Draw(lay)
        # the ringmaster's legs, then his body (he stands on the floor)
        for sgn in (-1, 1):
            cap(d, (SW.RX + sgn * 26, SW.BY0 + 4), (SW.RX + sgn * 30, FLOOR - 16), 34, (26, 22, 28), k)
            d.polygon([((SW.RX + sgn * 30 - 18) * k, (FLOOR - 20) * k), ((SW.RX + sgn * 30 + 26) * k, (FLOOR - 10) * k),
                       ((SW.RX + sgn * 30 + 26) * k, FLOOR * k), ((SW.RX + sgn * 30 - 18) * k, FLOOR * k)], fill=(12, 10, 12))
        SW.draw_ringmaster_body(d, k, look, hat_up, beam)
        draw_trunk_back(d, k, lid)
        if revealed:
            reach = ramp(s, HIT + 0.2, HIT + 0.9)
            key_at = (TCX + 60 + 60 * reach, TY0 - 120 + 20 * reach)
            draw_star(d, k, TCX, TY0 + 30, 0, s >= TIP - 0.4, arm_to=key_at if s < TAKE + 0.8 else (TCX + 44, TY0 - 30), sitting=True)
        if star is not None and s < HOP1:
            draw_star(d, k, star[0], star[1], star[2], True)
        draw_trunk_front(d, k, lid, chains if not revealed else 0, lock if not revealed else 0, 0)
        if revealed:
            draw_floor_mess(d, k)
        draw_cloth(d, k, drop, twitch, tremble, off)
        SW.draw_arms(d, k, hands)
        # the key: in his raised hand, then gone into his pocket; at the reveal in the star's hand; then his
        if KEYUP + 0.3 <= s < POCKET:
            draw_key(d, k, hands[0][0] + 10, hands[0][1] - 20, -0.6)
        if revealed and s < TAKE + 0.8:
            draw_key(d, k, key_at[0] + 14, key_at[1] - 6, 0.0)
        if s >= TAKE + 0.8 and s < TIP:
            draw_key(d, k, hands[0][0] + 12, hands[0][1] - 8, -0.4)
        lay = lay.resize((WD, HD), Image.LANCZOS)
        la = np.asarray(lay, np.float32)
        alpha = la[..., 3:4] / 255
        spot = np.exp(-(((xs - 520) / 420) ** 2 + ((ys - 1000) / 420) ** 2))
        a = base * dim
        a += spot[..., None] * np.array([90, 76, 60], np.float32) * (0.8 + 0.5 * ramp(s, HIT, HIT + 0.2) * (1 - ramp(s, HIT + 0.3, HIT + 1.2)))
        a = a * (1 - alpha) + la[..., :3] * (0.55 + 0.6 * spot[..., None]) * dim * alpha
        # under the cloth, in the hush: a light that is not the stage's, leaking out at the hem
        if HUSH <= s < PULL:
            lk = (0.5 + 0.5 * math.sin((s - HUSH) * 3.1)) * ramp(s, HUSH + 0.6, HUSH + 1.6) * (1 + 1.5 * math.exp(-((s - TWITCH) / 0.3) ** 2))
            hem = np.exp(-(((xs - TCX) / 190) ** 4 + ((ys - (FLOOR - 2)) / 16) ** 2))
            col = np.array(wf[900:1100:4, 300:600:4].reshape(-1, 3).mean(axis=0), np.float32) * 2.5 + np.array([60, 90, 140], np.float32)
            a += hem[..., None] * np.clip(col, 0, 255) * 0.5 * lk
        # camera: the act, framed; leaning in on the build; back out on the hit
        push = ramp(s, BUILD, BREATH) * (1 - ramp(s, HIT, HIT + 0.3))
        zc = 1.2 + 0.24 * push
        fw, fh = WD / zc, HD / zc
        cx, cy = 505 - 5 * push, 805 + 40 * push
        fx0, fy0 = min(max(cx - fw / 2, 0), WD - fw), min(max(cy - fh / 2, 0), HD - fh)
        a = np.asarray(Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).resize((W, H), Image.LANCZOS, box=(fx0, fy0, fx0 + fw, fy0 + fh)), np.float32)
        a *= ease(t / 0.4)
        if s >= S1 - 0.08:
            a *= 0
        a += rng.normal(0, 2.4, (H, W, 1))
        frame = np.clip(a, 0, 255).astype(np.uint8)
        if TEST:
            Image.fromarray(frame).save(f"{os.environ['TESTDIR']}/e{s:.2f}.png")
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
