"""'The Rabbit' - the show's fifth act and its finale (same stage and ringmaster as build_sawn.py and the rest).
A History of Dreaming 31.0-60.5. The oldest trick, shown exactly once: he pulls a rabbit out of his top hat and takes
his bow. Then he hands the star the hat. It reaches in: one rabbit - he claps. Two. Three, four, faster; he stops
clapping. It holds its breath with the song and looks into the hat, lit from inside. The band comes back (48.5,
'drifting off the track') and so do the rabbits - a fountain of them, hundreds, a real pile (each one flies, lands and
settles on a heightmap that slumps like sand) - rising round his legs, his waist, his chest, while the star rides up on
top of it. Hatless, buried to the chest, he looks up at it. It stops. It leans over and puts the hat back on his head.
    python3 video/build_rabbit.py      (TEST=t1,t2 TESTDIR=dir; PART=a,b VOUT=f; writes out/rabbit-fx.wav)
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
from build_escape import cap, World  # noqa: E402

F = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS, SS = 704, 1280, 24, 2
WD, HD = SW.WD, SW.HD
BEAT, PHASE = 60 / 162.05, 0.13
S0, S1 = 31.0, 60.5
DUR = S1 - S0
SHOW, DIP, PULL, BOW, GIVE, GOT = 31.6, 32.6, 33.6, 35.6, 37.4, 38.8
TRIES = [40.2, 43.3, 44.6, 45.7]
PEER, HIT, FLOOD_END, STOP, CROWN = 47.0, 48.5, 55.8, 56.3, 57.4
TEST = [float(x) for x in os.environ.get("TEST", "").split(",") if x]
PART = [float(x) for x in os.environ.get("PART", "").split(",") if x]
FLOOR = 1210
SX0 = 320                                  # where the star stands at first
SW.RX, SW.SHY, SW.BY0 = 640, 730, 950
X0, X1, CELL = 64, 896, 4                  # the pile lives between the curtains, on a heightmap of 4 px cells
rng = np.random.default_rng(12)


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def ramp(s, a, b):
    return ease((s - a) / (b - a))


def beat(s):
    return (s - PHASE) / BEAT


# ------------------------------------------------------------------ sprites
def rabbit_sprite(k, shade, flip):
    w, h = 60, 52
    im = Image.new("RGBA", (w * k, h * k), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    c = tuple(int(v * shade) for v in (246, 244, 240)) + (255,)
    ol = (150, 146, 150, 255)
    E = lambda box, **kw: d.ellipse([v * k for v in box], **kw)   # noqa: E731
    E((2, 26, 14, 38), fill=c, outline=ol, width=k)                 # tail
    E((6, 18, 46, 50), fill=c, outline=ol, width=k)                 # body
    E((34, 36, 50, 50), fill=c, outline=ol, width=k)                # front paw
    E((40, 0, 49, 26), fill=c, outline=ol, width=k)                 # ears
    E((48, 2, 57, 26), fill=c, outline=ol, width=k)
    E((42, 4, 47, 22), fill=(236, 170, 176, 255))
    E((50, 6, 55, 22), fill=(236, 170, 176, 255))
    E((34, 14, 58, 38), fill=c, outline=ol, width=k)                # head
    E((48, 20, 53, 26), fill=(40, 30, 40, 255))                     # eye
    E((55, 27, 59, 31), fill=(230, 140, 150, 255))                  # nose
    return im.transpose(Image.FLIP_LEFT_RIGHT) if flip else im


def draw_hat(d, k, cx, by, mouth_up, glow=None):
    """a top hat; (cx, by) = the middle of the brim. mouth_up: held upside down, crown hanging below the brim"""
    if mouth_up:
        d.rectangle([(cx - 38) * k, by * k, (cx + 38) * k, (by + 112) * k], fill=(22, 20, 26))
        d.rectangle([(cx - 38) * k, (by + 12) * k, (cx + 38) * k, (by + 28) * k], fill=(168, 22, 30))
        d.rectangle([(cx - 58) * k, (by - 7) * k, (cx + 58) * k, (by + 7) * k], fill=(18, 16, 20))
        d.ellipse([(cx - 36) * k, (by - 6) * k, (cx + 36) * k, (by + 6) * k], fill=glow or (6, 5, 8))    # the mouth
    else:
        d.rectangle([(cx - 58) * k, (by - 8) * k, (cx + 58) * k, (by + 6) * k], fill=(18, 16, 20))
        d.rectangle([(cx - 38) * k, (by - 118) * k, (cx + 38) * k, (by - 4) * k], fill=(22, 20, 26))
        d.rectangle([(cx - 38) * k, (by - 30) * k, (cx + 38) * k, (by - 12) * k], fill=(168, 22, 30))


def draw_star(d, k, x, feet, handR, handL, look, happy, standing=True):
    """the star standing with its feet at y=feet; both hands placed (handL holds the hat, handR pulls)"""
    blue, white, skin = (40, 70, 170), (236, 236, 240), (236, 206, 178)
    y = feet - 170
    for sgn in (-1, 1):
        cap(d, (x + sgn * 14, y), (x + sgn * 18, feet - 20), 20, (240, 240, 244), k)
        d.polygon([((x + sgn * 18 - 16) * k, (feet - 26) * k), ((x + sgn * 18 + 22 * sgn) * k, (feet - 14) * k),
                   ((x + sgn * 18 + 22 * sgn) * k, feet * k), ((x + sgn * 18 - 16) * k, feet * k)], fill=(170, 22, 32))
    top = y - 120
    for i in range(6):
        y0 = top + i * 20
        d.rectangle([(x - 30 - i * 0.6) * k, y0 * k, (x + 30 + i * 0.6) * k, (y0 + 20) * k], fill=blue if i % 2 == 0 else white)
    for sh, hand, sg in (((x - 32, top + 12), handL, -1), ((x + 32, top + 12), handR, 1)):
        el = ((sh[0] + hand[0]) / 2 + 12 * sg, (sh[1] + hand[1]) / 2 + 20)
        cap(d, sh, el, 17, blue, k)
        cap(d, el, hand, 15, skin, k)
    hx, hy = x, top - 44
    d.rectangle([(hx - 10) * k, (top - 12) * k, (hx + 10) * k, (top + 2) * k], fill=skin)
    d.ellipse([(hx - 38) * k, (hy - 40) * k, (hx + 38) * k, (hy + 40) * k], fill=skin)
    d.chord([(hx - 42) * k, (hy - 46) * k, (hx + 42) * k, (hy + 26) * k], 180, 360, fill=(40, 26, 20))
    d.rectangle([(hx - 42) * k, (hy - 12) * k, (hx - 30) * k, (hy + 20) * k], fill=(40, 26, 20))
    d.rectangle([(hx + 30) * k, (hy - 12) * k, (hx + 42) * k, (hy + 20) * k], fill=(40, 26, 20))
    for sgn in (-1, 1):
        ex, ey = hx + sgn * 15, hy + 4
        if happy:
            d.arc([(ex - 8) * k, (ey - 6) * k, (ex + 8) * k, (ey + 6) * k], 200, 340, fill=(60, 40, 30), width=int(3 * k))
        else:
            d.ellipse([(ex - 7) * k, (ey - 7) * k, (ex + 7) * k, (ey + 7) * k], fill=(250, 250, 250))
            d.ellipse([(ex - 3 + 3 * look[0]) * k, (ey - 3 + 3 * look[1]) * k, (ex + 3 + 3 * look[0]) * k, (ey + 3 + 3 * look[1]) * k], fill=(20, 20, 30))
        d.ellipse([(hx + sgn * 26 - 6) * k, (hy + 16) * k, (hx + sgn * 26 + 6) * k, (hy + 24) * k], fill=(240, 170, 160))


# ------------------------------------------------------------------ the pile: every rabbit flies, lands, settles
class Pile:
    def __init__(self):
        self.h = np.zeros((X1 - X0) // CELL, np.float32)
        self.fly = []          # [x, y, vx, vy, sprite]
        self.sat = []          # (x, y, sprite) in landing order
        self.landed = []       # landing times, for the thumps

    def surface(self, x):
        i = int(min(max((x - X0) / CELL, 0), len(self.h) - 1))
        return FLOOR - self.h[i]

    def add(self, x, y, vx, vy, spr):
        self.fly.append([x, y, vx, vy, spr])

    def step(self, dt, s):
        keep = []
        for r in self.fly:
            r[3] += 1500 * dt
            r[0] += r[2] * dt
            r[1] += r[3] * dt
            if r[0] < X0 + 30 or r[0] > X1 - 30:
                r[2] = -r[2] * 0.5
                r[0] = min(max(r[0], X0 + 30), X1 - 30)
            if r[3] > 0 and r[1] + 20 >= self.surface(r[0]):
                y = self.surface(r[0]) - 22
                self.sat.append((r[0], y, r[4]))
                self.landed.append(s)
                i = int((r[0] - X0) / CELL)
                xs = np.arange(len(self.h))
                self.h += 30 * np.exp(-((xs - i) * CELL / 26.0) ** 2)
            else:
                keep.append(r)
        self.fly = keep
        for _ in range(6):                                   # slump: nothing steeper than about 40 degrees
            dh = np.diff(self.h)
            mv = np.clip((np.abs(dh) - 3.4) / 2, 0, None) * np.sign(dh)
            self.h[:-1] += mv
            self.h[1:] -= mv


def fx(pile_landings):
    SR = 44100
    out = np.zeros(int((DUR + 4) * SR))

    def put(t0, sig, g):
        i = int((t0 - S0) * SR)
        n = min(len(sig), len(out) - i)
        if n > 0:
            out[i:i + n] += sig[:n] * g

    def pop(f0=420, dur=0.12):
        t = np.arange(int(dur * SR)) / SR
        return np.sin(2 * np.pi * (f0 * t + 2600 * t * t)) * np.exp(-t * 30)
    put(PULL, pop(), 0.35)
    for i, t0 in enumerate(TRIES):
        put(t0 + 0.55, pop(420 + 60 * i), 0.35)
    put(CROWN + 0.9, pop(300, 0.18), 0.3)
    for t0 in pile_landings[::3]:                             # soft landings under the band
        t = np.arange(int(0.06 * SR)) / SR
        put(t0, np.sin(2 * np.pi * 110 * t) * np.exp(-t * 60), 0.05)
    raw = (np.clip(out, -1, 1) * 32767).astype(np.int16).tobytes()
    subprocess.run([F, "-loglevel", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "-", "out/rabbit-fx.wav"],
                   input=raw, check=True)


def main():
    base = SW.stage()
    ys, xs = np.mgrid[0:HD, 0:WD].astype(np.float32)
    k = SS
    sprites = [rabbit_sprite(k, sh, fl) for sh in (1.0, 0.93, 0.86) for fl in (False, True)]
    world = World("out/your-turn/world.mp4", 100.0)
    out = None
    if not TEST and os.environ.get("SIMONLY") is None:
        out = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                                str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "15", "-preset", "slow", "-pix_fmt", "yuv420p",
                                os.environ.get("VOUT", "out/drawn/rabbit.mp4")], stdin=subprocess.PIPE)
    pile = Pile()
    lesson_down = False
    srng = np.random.default_rng(7)                          # the flood's own draws: every PART sees the same pile
    carried = set()
    spawn_acc = 0.0
    for n in range(int(DUR * FPS)):
        t = n / FPS
        s = S0 + t
        wf = world.next()
        b = beat(s)
        # ---- the star: where it stands (it rides up on the pile and drifts toward him)
        drift = ramp(s, HIT + 2.0, STOP)
        sx = SX0 + 150 * drift
        feet = pile.surface(sx) + 6 if s >= HIT else FLOOR
        top = feet - 290
        # ---- the simulation (runs every frame, drawn only where asked)
        if s >= PULL + 2.1 and not lesson_down:
            pile.add(SW.RX + 120, SW.SHY - 110, 60, -100, 0); lesson_down = True
        for i, t0 in enumerate(TRIES):                       # each pulled rabbit is set down (tossed) beside it
            if s >= t0 + 1.0 and i not in carried:
                carried.add(i)
                pile.add(sx + 40, top - 110, -140 + 60 * i, -200, (2 + i) % 6)
        if HIT <= s < FLOOD_END:
            rate = 36 * ramp(s, HIT, HIT + 0.6) * (1 - 0.5 * ramp(s, FLOOD_END - 1.5, FLOOD_END))
            spawn_acc += rate / FPS
            hat_mouth = (sx - 60, top + 30)
            while spawn_acc >= 1:
                spawn_acc -= 1
                pile.add(hat_mouth[0] + srng.normal(0, 10), hat_mouth[1] - 10, srng.normal(120, 190), -srng.uniform(650, 1050),
                         int(srng.integers(0, 6)))
        for _ in range(3):
            pile.step(1 / FPS / 3, s)
        if TEST and not any(abs(s - q) < 0.5 / FPS for q in TEST):
            continue
        if PART and not (PART[0] <= t < PART[1]):
            continue
        if os.environ.get("SIMONLY"):
            continue
        # ---- the ringmaster [left hand, right hand]; hat: where it is and who holds it
        look, beam, hat = -1.0, 1.0, None               # hat = (cx, brim_y, mouth_up)
        held_rabbit = None
        his_hat_on = False
        if s < GIVE:
            u = ramp(s, SHOW, SHOW + 0.5)
            L = (SW.RX - 150, SW.SHY + 120 - 40 * u)
            if s < DIP:
                R = (SW.RX + 110, SW.SHY + 40 + 10 * math.sin(math.pi * b))
            elif s < PULL:
                R = (L[0] + 10, L[1] - 30 + 20 * math.sin((s - DIP) * 12))
            elif s < BOW:
                v = ramp(s, PULL, PULL + 0.3)
                R = (L[0] + 10 + (SW.RX + 80 - L[0] - 10) * v, L[1] - 30 + (SW.SHY - 170 - L[1] + 30) * v)
                held_rabbit = (R[0], R[1] + 6) if s < PULL + 2.1 else None
            else:
                R = (SW.RX + 110, SW.SHY + 60)
            if s >= PULL + 2.1:
                R = (SW.RX + 110, SW.SHY + 60)
            hat = (L[0], L[1] - 26, True)
            if s < SHOW:                                   # the hat starts on his head
                hat = None; his_hat_on = True
                L = (SW.RX - 104, SW.SHY + 160)
            hands = [L, R]
        elif s < GOT:
            u = ramp(s, GIVE, GOT - 0.3)
            L = (SW.RX - 150 - 90 * u, SW.SHY + 80 + 90 * u)
            hands = [L, (SW.RX + 110, SW.SHY + 60)]
            hat = (L[0], L[1] - 26, True)
        elif s < HIT:                                      # he claps, then stops clapping
            clap = abs(math.sin(math.pi * b / 2)) * (1 - ramp(s, TRIES[2], TRIES[2] + 0.5))
            if s < TRIES[0] + 0.6:
                clap = 0.9
            gap = 20 + 60 * clap
            hands = [(SW.RX - gap, SW.SHY + 70), (SW.RX + gap, SW.SHY + 70)]
            if s >= TRIES[2] + 0.5:
                hands = [(SW.RX - 104, SW.SHY + 160), (SW.RX + 60, SW.SHY + 80)]
                beam = 0.0
        else:                                              # buried: hands up, then still
            wav = 30 * math.sin(s * 11) * (1 - ramp(s, STOP - 1, STOP))
            hands = [(SW.RX - 120 + wav, SW.SHY - 150), (SW.RX + 120 - wav, SW.SHY - 150)]
            beam = 1.0 if s < STOP else 0.0
            look = -1.0
        cl = []
        for sgn, (px, py) in zip((-1, 1), hands):
            sx_, sy_ = SW.RX + sgn * 60, SW.SHY + 16
            dd = math.hypot(px - sx_, py - sy_)
            f = min(1.0, 232 / max(dd, 1e-6))
            cl.append((sx_ + (px - sx_) * f, sy_ + (py - sy_) * f))
        hands = cl
        # ---- the star's hands
        pulled = None
        rest_L = (sx - 44, top + 118)
        if s < GIVE:
            hL, hR = rest_L, (sx + 40, top + 118)
            slook, happy = (1.0, -0.2), False
        elif s < GOT:
            u = ramp(s, GIVE + 0.4, GOT - 0.3)
            hL, hR = rest_L, (sx + 40 + (hands[0][0] - sx - 40) * u, top + 118 + (hands[0][1] - 30 - top - 118) * u)
            slook, happy = (1.0, -0.2), False
            if s >= GOT - 0.3:
                hat = (hR[0], hR[1] - 26, True)
        else:
            u = ramp(s, GOT, GOT + 0.5)
            hL = (sx - 44 - 26 * u, top + 118 - 70 * u)
            hat = (hL[0], hL[1] - 26, True)
            hR = (sx + 40, top + 118)
            slook, happy = (-0.6, 0.5), False
            for i, t0 in enumerate(TRIES):
                if t0 <= s < t0 + 1.0:
                    dip = ramp(s, t0, t0 + 0.25)
                    up = ramp(s, t0 + 0.45, t0 + 0.7)
                    hR = (sx + 40 + (hat[0] - sx - 30) * dip * (1 - up) + 20 * up, top + 118 + (hat[1] - 30 - top - 118) * dip * (1 - up) - 250 * up)
                    if s >= t0 + 0.5:
                        pulled = (hR[0], hR[1] + 6)
                    slook = (0.0, 0.8) if s < t0 + 0.5 else (1.0, -0.4)
                    happy = s >= t0 + 0.5
            if PEER <= s < HIT:
                slook, happy = (-0.5, 1.0), False
            if s >= HIT:
                slook, happy = (-0.3, -1.0), True
                hR = (sx + 60, top + 20)
                if s >= STOP:                                  # it looks at him; then crowns him with the hat
                    slook, happy = (1.0, 0.2), False
                    u = ramp(s, CROWN, CROWN + 0.9)
                    head = (SW.RX, SW.SHY - 62 - 44)           # where the brim sits on his head
                    hR = (sx + 40 + (head[0] - sx - 40) * u, top + 118 + (head[1] - 118 - top - 118) * u)
                    if s >= CROWN:                           # held by the crown, the right way up
                        hat = (hR[0], hR[1] + 118, False)
                        hL = (sx - 44, top + 118)
                    if s >= CROWN + 0.9:
                        hat = None; his_hat_on = True
                        hR = (sx + 50, top + 60) if s >= CROWN + 1.4 else hR
                        happy = s >= CROWN + 1.3
        # ---- draw
        lay = Image.new("RGBA", (WD * k, HD * k), (0, 0, 0, 0))
        d = ImageDraw.Draw(lay)
        for sgn in (-1, 1):
            cap(d, (SW.RX + sgn * 26, SW.BY0 + 4), (SW.RX + sgn * 30, FLOOR - 16), 34, (26, 22, 28), k)
            d.polygon([((SW.RX + sgn * 30 - 18) * k, (FLOOR - 20) * k), ((SW.RX + sgn * 30 + 26) * k, (FLOOR - 10) * k),
                       ((SW.RX + sgn * 30 + 26) * k, FLOOR * k), ((SW.RX + sgn * 30 - 18) * k, FLOOR * k)], fill=(12, 10, 12))
        SW.draw_ringmaster_body(d, k, look, 0.0 if his_hat_on else 5000.0, beam)
        SW.draw_arms(d, k, hands)
        glow = None
        if PEER <= s < HIT + 0.4:
            wc = wf[900:1100:4, 300:600:4].reshape(-1, 3).mean(axis=0) * 2.0 + np.array([80, 90, 120])
            gl = ramp(s, PEER, PEER + 0.6)
            glow = tuple(int(min(255, 6 + v * gl)) for v in wc)
        if s >= HIT:                                        # the rabbits under the star go behind its feet
            for (x_, y_, sp) in pile.sat:
                lay.alpha_composite(sprites[sp], (int((x_ - 30) * k), int((y_ - 26) * k)))
            d = ImageDraw.Draw(lay)
        draw_star(d, k, sx, feet, hR, hL, slook, happy)
        if hat is not None:
            draw_hat(d, k, hat[0], hat[1], hat[2], glow)
        if s < HIT:
            for (x_, y_, sp) in pile.sat:
                lay.alpha_composite(sprites[sp], (int((x_ - 30) * k), int((y_ - 26) * k)))
        for r in pile.fly:
            lay.alpha_composite(sprites[r[4]], (int((r[0] - 30) * k), int((r[1] - 26) * k)))
        for hr in (held_rabbit, pulled):                    # a rabbit held up by the ears
            if hr is not None:
                spr = sprites[0].rotate(-80, expand=True, resample=Image.BICUBIC)
                spr = spr.resize((int(spr.width * 1.35), int(spr.height * 1.35)), Image.LANCZOS)
                lay.alpha_composite(spr, (int((hr[0] - 30) * k), int((hr[1] - 8) * k)))
        d = ImageDraw.Draw(lay)
        lay = lay.resize((WD, HD), Image.LANCZOS)
        la = np.asarray(lay, np.float32)
        alpha = la[..., 3:4] / 255
        spot = np.exp(-(((xs - 490) / 440) ** 2 + ((ys - 960) / 460) ** 2))
        dim = 1 - 0.35 * ramp(s, PEER, PEER + 0.4) * (1 - ramp(s, HIT - 0.05, HIT + 0.1))
        a = base + spot[..., None] * np.array([90, 76, 60], np.float32)
        a = a * (1 - alpha) + la[..., :3] * (0.55 + 0.6 * spot[..., None]) * alpha
        a *= dim
        if glow is not None and hat is not None:            # the hat lit from inside, on its face
            g = np.exp(-(((xs - hat[0]) / 90) ** 2 + ((ys - hat[1] + 60) / 120) ** 2)) * ramp(s, PEER, PEER + 0.6)
            a += g[..., None] * (np.array(glow, np.float32) - 6) * 0.55
        a = 255 * (1 - np.exp(-a / 255 * 1.15)) * 1.1
        # ---- camera: the act; closer on the star as it peers in; wide for the flood
        u1 = ramp(s, GIVE, GOT + 0.5)
        u2 = ramp(s, PEER - 0.8, PEER + 0.6) * (1 - ramp(s, HIT, HIT + 0.35))
        u3 = ramp(s, HIT, HIT + 1.5)
        z = 1.25 + 0.1 * u1 + 0.45 * u2 - 0.2 * u3
        cx = 500 - 40 * u1 - 60 * u2 + 30 * u3
        cy = 830 + 30 * u2 - 40 * u3
        if s >= STOP - 0.6:                                 # in on the two of them for the crowning
            u4 = ramp(s, STOP - 0.6, STOP + 0.6)
            z, cx, cy = z + (1.7 - z) * u4, cx + (560 - cx) * u4, cy + (720 - cy) * u4
        fw, fh = WD / z, HD / z
        fx0, fy0 = min(max(cx - fw / 2, 0), WD - fw), min(max(cy - fh / 2, 0), HD - fh)
        a = np.asarray(Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).resize((W, H), Image.LANCZOS, box=(fx0, fy0, fx0 + fw, fy0 + fh)), np.float32)
        a *= ease(t / 0.4)
        if s >= S1 - 0.08:
            a *= 0
        a += rng.normal(0, 2.4, (H, W, 1))
        frame = np.clip(a, 0, 255).astype(np.uint8)
        if TEST:
            Image.fromarray(frame).save(f"{os.environ['TESTDIR']}/r{s:.2f}.png")
            print("test", round(s, 2), "pile at him", round(float(FLOOR - pile.surface(SW.RX)), 1), "rabbits", len(pile.sat), flush=True)
            continue
        out.stdin.write(frame.tobytes())
        if n % 96 == 0:
            print(f"{s:6.1f}", flush=True)
    if out:
        out.stdin.close()
        out.wait()
    if not PART or PART[0] == 0:
        fx(pile.landed)
    print("pile at him", round(float(FLOOR - pile.surface(SW.RX)), 1), "under star", round(float(FLOOR - pile.surface(SX0 + 150)), 1),
          "rabbits", len(pile.sat), flush=True)


if __name__ == "__main__":
    main()
