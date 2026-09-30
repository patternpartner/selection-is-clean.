"""'No Strings' - the show's third act (same stage and ringmaster as build_sawn.py / build_escape.py). The levitation.
The star lies on a draped table; the ringmaster raises his hands and it rises - and, if you look, four threads glint
above it, up into the dark: the act is rigged, and he is the one working it. In the hush a thread snaps (a small ping)
and it dips. He freezes. Another. He grabs for the loose end. On the build he gets his hands under it, braced to
catch. On the held breath the last thread goes. The hit: it does not fall. It was never the threads. It lights up,
turns upright in the air, drifts down beside him on its own, takes his hand, and they raise it together.
    python3 video/build_strings.py     (TEST=t1,t2 TESTDIR=dir; PART=a,b VOUT=f; writes out/strings-fx.wav)
"""
import json
import math
import os
import subprocess
import sys

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(__file__))
import build_sawn as SW  # noqa: E402  (the stage and the ringmaster)
from build_escape import cap, World  # noqa: E402

F = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS, SS = 704, 1280, 24, 2
WD, HD = SW.WD, SW.HD
T = json.load(open("video/stories/strings-times.json"))
BEAT, PHASE = 60 / T["bpm"], T["phase"]
S0, S1 = T["start"], T["end"]
DUR = S1 - S0
RISE0, RISE1, SNAP1, SNAP2, BRACE, SNAP3, SNAP4, HIT = (T[k] for k in ("rise0", "rise1", "snap1", "snap2", "brace", "snap3", "snap4", "hit"))
TURN, LAND, HOLD, RAISE = (T[k] for k in ("turn", "land", "hold", "raise"))
TEST = [float(x) for x in os.environ.get("TEST", "").split(",") if x]
PART = [float(x) for x in os.environ.get("PART", "").split(",") if x]
FLOOR = 1210
TCX, TTOP = 430, 1030               # the table: centre, top
SW.RX, SW.SHY, SW.BY0 = 740, 730, 950
TOPY = 236                          # where the threads go up into the dark (under the swag)
SNAPS = [SNAP1, SNAP2, SNAP3, SNAP4]
rng = np.random.default_rng(91)


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def ramp(s, a, b):
    return ease((s - a) / (b - a))


def beat(s):
    return (s - PHASE) / BEAT


# ------------------------------------------------------------------ the star, drawn upright on its own small canvas
LC = 640                            # local canvas (hips at its centre)


def star_layer(k, look, happy):
    """the star from the escape act, upright, hips at (LC/2, LC/2); legs its own (it is not standing on the floor).
    look: None = eyes shut, else the pupils' sideways offset"""
    im = Image.new("RGBA", (LC * k, LC * k), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    x, y = LC / 2, LC / 2
    blue, white, skin = (40, 70, 170), (236, 236, 240), (236, 206, 178)
    for sgn in (-1, 1):
        cap(d, (x + sgn * 14, y), (x + sgn * 16, y + 150), 20, (240, 240, 244), k)
        d.polygon([((x + sgn * 16 - 12) * k, (y + 146) * k), ((x + sgn * 16 + 12) * k, (y + 146) * k),
                   ((x + sgn * 16 + 14) * k, (y + 176) * k), ((x + sgn * 16 - 14) * k, (y + 170) * k)], fill=(170, 22, 32))
    top = y - 120
    for i in range(6):
        y0 = top + i * 20
        d.rectangle([(x - 30 - i * 0.6) * k, y0 * k, (x + 30 + i * 0.6) * k, (y0 + 20) * k], fill=blue if i % 2 == 0 else white)
    cap(d, (x - 32, top + 12), (x - 40, top + 66), 17, blue, k)     # the left arm down along its side
    cap(d, (x - 40, top + 66), (x - 36, top + 114), 15, skin, k)
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
        elif look is None:
            d.arc([(ex - 7) * k, (ey - 3) * k, (ex + 7) * k, (ey + 7) * k], 20, 160, fill=(80, 50, 40), width=int(2 * k))
        else:
            d.ellipse([(ex - 7) * k, (ey - 7) * k, (ex + 7) * k, (ey + 7) * k], fill=(250, 250, 250))
            d.ellipse([(ex - 3 + 3 * look) * k, (ey - 3) * k, (ex + 3 + 3 * look) * k, (ey + 3) * k], fill=(20, 20, 30))
        d.ellipse([(hx + sgn * 26 - 6) * k, (hy + 16) * k, (hx + sgn * 26 + 6) * k, (hy + 24) * k], fill=(240, 170, 160))
    return im


def star_arm(d, k, sh, hand):
    """its right arm (drawn on the main layer so it can reach out of the rotated figure)"""
    el = ((sh[0] + hand[0]) / 2 + 4, (sh[1] + hand[1]) / 2 + 16)
    cap(d, sh, el, 17, (40, 70, 170), k)
    cap(d, el, hand, 15, (236, 206, 178), k)


def body_point(u, v, cx, cy, ang):
    """a point (u, v) of the upright figure (relative to the hips, y down), placed with its hips at (cx, cy) and turned
    by ang (radians, counterclockwise on screen: pi/2 lays it on its back with the head to the left)"""
    ca, sa = math.cos(ang), math.sin(ang)
    return cx + u * ca + v * sa, cy - u * sa + v * ca


ATTACH = [(0, -104), (0, -10), (0, 80), (0, 150)]      # threads at the shoulders, hips, knees, ankles
ORDER = [1, 3, 0, 2]                                   # which thread snaps 1st, 2nd, 3rd, 4th


def draw_table(d, k):
    d.rectangle([(TCX - 190) * k, TTOP * k, (TCX + 190) * k, (TTOP + 16) * k], fill=(200, 160, 70))
    d.polygon([((TCX - 190) * k, (TTOP + 16) * k), ((TCX + 190) * k, (TTOP + 16) * k), ((TCX + 176) * k, (TTOP + 96) * k),
               ((TCX - 176) * k, (TTOP + 96) * k)], fill=(18, 22, 58))
    for i in range(8):
        xx = TCX - 170 + i * 42.5
        d.polygon([(xx * k, (TTOP + 96) * k), ((xx + 21) * k, (TTOP + 118) * k), ((xx + 42.5) * k, (TTOP + 96) * k)], fill=(18, 22, 58))
        d.ellipse([(xx + 17) * k, (TTOP + 112) * k, (xx + 25) * k, (TTOP + 120) * k], fill=(200, 160, 70))
    for sgn in (-1, 1):
        lx = TCX + sgn * 150
        d.rectangle([(lx - 7) * k, (TTOP + 100) * k, (lx + 7) * k, FLOOR * k], fill=(170, 130, 60))
        d.ellipse([(lx - 22) * k, (FLOOR - 6) * k, (lx + 22) * k, (FLOOR + 6) * k], fill=(130, 96, 44))


def fx():
    SR = 44100
    out = np.zeros(int((DUR + 4) * SR))

    def put(t0, sig, g):
        i = int((t0 - S0) * SR)
        n = min(len(sig), len(out) - i)
        out[i:i + n] += sig[:n] * g

    for i, t0 in enumerate(SNAPS):                          # a thread snapping: a bright pluck that dies fast
        t = np.arange(int(0.6 * SR)) / SR
        f = 1800 + 260 * i
        ping = (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.7 * t)) * np.exp(-t * 9)
        ping[:60] += rng.normal(0, 1.0, 60)
        put(t0, ping, 0.10 if i < 3 else 0.16)
    t = np.arange(int(1.6 * SR)) / SR                       # the hit: a soft rising shimmer as it lights
    sh = sum(np.sin(2 * np.pi * f0 * (1 + 0.3 * t) * t) for f0 in (880, 1320, 1760, 2640)) * np.sin(np.pi * t / 1.6) ** 2
    put(HIT, sh, 0.03)
    raw = (np.clip(out, -1, 1) * 32767).astype(np.int16).tobytes()
    subprocess.run([F, "-loglevel", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "-", "out/strings-fx.wav"],
                   input=raw, check=True)


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
                                os.environ.get("VOUT", "out/drawn/strings.mp4")], stdin=subprocess.PIPE)
    lying_y = TTOP - 34                                     # hips when lying on the table
    for n in range(int(DUR * FPS)):
        t = n / FPS
        s = S0 + t
        wf = world.next()
        if TEST and not any(abs(s - q) < 0.5 / FPS for q in TEST):
            continue
        if PART and not (PART[0] <= t < PART[1]):
            continue
        b = beat(s)
        free = s >= HIT
        # ---- where the star is: rising on the show, a dip at every snap, held at the hit, then turning upright and
        # drifting down to stand beside him
        hy = lying_y - 230 * ramp(s, RISE0, RISE1) + 6 * math.sin(math.pi * b / 2) * ramp(s, RISE1, RISE1 + 1)
        for i, ts in enumerate(SNAPS[:3]):
            if s >= ts:
                hy += (10 + 6 * i) * (1 - 0.45 * math.exp(-(s - ts) * 3) * math.cos((s - ts) * 14))
        if s >= SNAP4:                                      # the last one goes: a lurch - then the hit holds it
            hy += 24 * ramp(s, SNAP4, SNAP4 + 0.12) * (1 - ramp(s, HIT, HIT + 0.5))
        hy -= 70 * ramp(s, HIT, HIT + 1.2)
        ang = math.pi / 2 * (1 - ramp(s, TURN, TURN + 1.4))
        hx = TCX
        if s >= TURN:
            u = ramp(s, TURN + 0.4, LAND)
            hx = TCX + (SW.RX - 145 - TCX) * u
            hy = hy + (FLOOR - 176 - hy) * u
        # ---- the ringmaster
        hat_up, look, beam = 0.0, -1.0, 0.0
        if s < RISE0:
            hands = [(SW.RX - 150, SW.SHY + 100 + 8 * math.sin(math.pi * b)), (SW.RX + 104, SW.SHY + 160)]; beam = 1
        elif s < SNAP1:                                     # the rise: both palms lifting, slow, on the beat
            u = ramp(s, RISE0, RISE1)
            lift = 20 * math.sin(math.pi * b / 2)
            hands = [(SW.RX - 170, SW.SHY + 40 - 220 * u + lift), (SW.RX + 110, SW.SHY - 40 - 180 * u + lift)]; beam = 1
        elif s < SNAP2:                                     # a thread goes: he freezes, hands still up
            hands = [(SW.RX - 170, SW.SHY - 170), (SW.RX + 110, SW.SHY - 210)]
        elif s < BRACE:                                     # another: he snatches at the loose end
            u = ramp(s, SNAP2 + 0.1, SNAP2 + 0.5)
            hands = [(SW.RX - 170 - 40 * u, SW.SHY - 170 - 60 * u), (SW.RX + 70, SW.SHY - 120)]
        elif s < HIT:                                       # braced underneath, ready to catch it
            u = ramp(s, BRACE, BRACE + 1.2)
            tr = 2.5 * math.sin(s * 37) * ramp(s, BRACE + 2, SNAP4)
            under = hy + 70                                  # palms up under its back, not touching
            hands = [(SW.RX - 170 - 80 * u + tr, SW.SHY - 170 + (under - SW.SHY + 170) * u),
                     (SW.RX + 70 - 170 * u - tr, SW.SHY - 120 + (under - SW.SHY + 120) * u)]
        elif s < HOLD:                                      # it holds: hat jumps, hands open, staring
            hat_up = 50 * ramp(s, HIT, HIT + 0.15) * (1 - ramp(s, HIT + 0.5, HIT + 0.9))
            hands = [(SW.RX - 180, SW.SHY + 110), (SW.RX + 160, SW.SHY + 80)]
        elif s < RAISE:                                     # it takes his hand
            hands = [(SW.RX - 110, SW.SHY + 205), (SW.RX + 104, SW.SHY + 160)]
        else:                                               # and they lift it together; his other hand tips the hat
            u = ramp(s, RAISE, RAISE + 0.6)
            hands = [(SW.RX - 110, SW.SHY + 205 - 370 * u), (SW.RX + 20, SW.SHY - 110 - 40 * u)]
            hat_up = 40 * ramp(s, RAISE + 0.5, RAISE + 1.0); beam = 1
        cl = []
        for sgn, (px, py) in zip((-1, 1), hands):
            sx, sy = SW.RX + sgn * 60, SW.SHY + 16
            dd = math.hypot(px - sx, py - sy)
            f = min(1.0, 232 / max(dd, 1e-6))
            cl.append((sx + (px - sx) * f, sy + (py - sy) * f))
        hands = cl
        # ---- draw
        k = SS
        lay = Image.new("RGBA", (WD * k, HD * k), (0, 0, 0, 0))
        d = ImageDraw.Draw(lay)
        for sgn in (-1, 1):
            cap(d, (SW.RX + sgn * 26, SW.BY0 + 4), (SW.RX + sgn * 30, FLOOR - 16), 34, (26, 22, 28), k)
            d.polygon([((SW.RX + sgn * 30 - 18) * k, (FLOOR - 20) * k), ((SW.RX + sgn * 30 + 26) * k, (FLOOR - 10) * k),
                       ((SW.RX + sgn * 30 + 26) * k, FLOOR * k), ((SW.RX + sgn * 30 - 18) * k, FLOOR * k)], fill=(12, 10, 12))
        SW.draw_ringmaster_body(d, k, look if s < HOLD else -0.6, hat_up, beam)
        draw_table(d, k)
        # the threads: from the attachments straight up into the dark; at its snap the top end whips up out of sight
        # and the bottom end hangs off the star, swinging, until the hit drops it
        thr = Image.new("RGBA", (WD * k, HD * k), (0, 0, 0, 0))
        dt = ImageDraw.Draw(thr)
        for j, (au, av) in enumerate(ATTACH):
            px, py = body_point(au, av, hx, hy, ang)
            ts = SNAPS[ORDER.index(j)]
            glint = 0.45 + 0.55 * max(0.0, math.sin(math.pi * b * 0.5 + j * 1.3)) ** 6
            col = (int(235 * glint + 20), int(235 * glint + 20), 255, int(255 * min(1.0, 0.55 + 0.45 * glint)))
            if s < RISE0 - 0.5:
                continue
            if s < ts:
                dt.line([(px * k, py * k), (px * k, TOPY * k)], fill=col, width=2 * k)
            else:
                g = s - ts
                if g < 0.5:
                    y1 = py - 40 - 1400 * g
                    if y1 > TOPY:
                        dt.line([(px * k, y1 * k), (px * k, TOPY * k)], fill=col, width=2 * k)
                fall = 900 * max(0.0, s - HIT) ** 2
                if py + fall < FLOOR:
                    sw_ = 18 * math.sin(g * 6) * math.exp(-g * 0.8)
                    dt.line([(px * k, (py + fall) * k), ((px + sw_) * k, (py - 50 + fall) * k)], fill=col, width=2 * k)
        happy = s >= RAISE - 0.3
        eyes = None if s < SNAP1 else (1.0 if s < HIT + 0.6 else -1.0 if s < TURN else 1.0)
        rot = star_layer(k, eyes, happy).rotate(math.degrees(ang), resample=Image.BICUBIC)
        lay.alpha_composite(rot, (int((hx - LC / 2) * k), int((hy - LC / 2) * k)))
        lay.alpha_composite(thr)
        d = ImageDraw.Draw(lay)
        sh = body_point(32, -108, hx, hy, ang)
        if s < HOLD:
            star_arm(d, k, sh, body_point(36, -6, hx, hy, ang))
        SW.draw_arms(d, k, hands)
        if s >= HOLD:                                        # it takes his hand: its arm to his glove, drawn over it
            gl = hands[0]
            reach = ramp(s, HOLD, HOLD + 0.5)
            rest = body_point(36, -6, hx, hy, ang)
            star_arm(d, k, sh, (rest[0] + (gl[0] - 6 - rest[0]) * reach, rest[1] + (gl[1] + 4 - rest[1]) * reach))
        lay = lay.resize((WD, HD), Image.LANCZOS)
        la = np.asarray(lay, np.float32)
        alpha = la[..., 3:4] / 255
        dim = 1 - 0.45 * ramp(s, SNAP1, SNAP1 + 0.6) * (1 - ramp(s, HIT - 0.05, HIT + 0.2))
        spot = np.exp(-(((xs - 520) / 420) ** 2 + ((ys - 960) / 440) ** 2))
        a = base * dim
        a += spot[..., None] * np.array([90, 76, 60], np.float32) * dim
        a = a * (1 - alpha) + la[..., :3] * (0.55 + 0.6 * spot[..., None]) * dim * alpha
        # at the hit: its own light, coloured by the living world, blooming out of it, and motes rising off it
        if free:
            gl = ramp(s, HIT, HIT + 0.25) * (0.75 + 0.25 * math.sin(math.pi * b)) * (1 - 0.5 * ramp(s, LAND, LAND + 1.5))
            c0 = body_point(0, -40, hx, hy, ang)
            halo = np.exp(-(((xs - c0[0]) / 190) ** 2 + ((ys - c0[1]) / 190) ** 2))
            col = np.array(wf[900:1100:4, 300:600:4].reshape(-1, 3).mean(axis=0), np.float32) * 2.2 + np.array([70, 90, 130], np.float32)
            a += halo[..., None] * np.clip(col, 0, 255) * 0.6 * gl
            rr = np.random.default_rng(5)
            m = np.zeros((HD, WD), np.float32)
            mc = np.zeros((HD, WD, 3), np.float32)
            for q in range(70):
                life = (s - HIT) * 0.5 + rr.random()
                ph = life % 1.0
                ox, oy = rr.normal(0, 90), rr.normal(0, 50)
                wy, wx = int(rr.integers(700, 1200)), int(rr.integers(250, 650))
                mx = int(c0[0] + ox + 20 * math.sin(life * 5 + q))
                my = int(c0[1] + oy - 260 * ph)
                if 3 <= mx < WD - 3 and 3 <= my < HD - 3:
                    m[my - 2:my + 2, mx - 2:mx + 2] = math.sin(math.pi * ph)
                    mc[my - 2:my + 2, mx - 2:mx + 2] = wf[wy, wx].astype(np.float32) * 0.6 + 100
            a = a * (1 - m[..., None] * gl) + mc * m[..., None] * gl
        a = 255 * (1 - np.exp(-a / 255 * 1.15)) * 1.1
        # camera: the act framed; leaning in on the build; back out on the hit
        push = ramp(s, BRACE, SNAP4) * (1 - ramp(s, HIT, HIT + 0.5))
        zc = 1.2 + 0.22 * push
        fw, fh = WD / zc, HD / zc
        cx, cy = 505 - 20 * push, 820 - 10 * push
        fx0, fy0 = min(max(cx - fw / 2, 0), WD - fw), min(max(cy - fh / 2, 0), HD - fh)
        a = np.asarray(Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).resize((W, H), Image.LANCZOS, box=(fx0, fy0, fx0 + fw, fy0 + fh)), np.float32)
        a *= ease(t / 0.4)
        if s >= S1 - 0.08:
            a *= 0
        a += rng.normal(0, 2.4, (H, W, 1))
        frame = np.clip(a, 0, 255).astype(np.uint8)
        if TEST:
            Image.fromarray(frame).save(f"{os.environ['TESTDIR']}/n{s:.2f}.png")
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
