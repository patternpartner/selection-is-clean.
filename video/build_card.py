"""'Pick a Card' - the show's fourth act (same stage and ringmaster as build_sawn.py / build_escape.py / build_strings.py).
Align the Soul 35.0-60.5: the track sings 'to mirror the pulse of a human heart', falls silent for a second, and lands
on 'Align the soul'. The ringmaster fans a deck; the star picks a card, looks at it, holds it to its chest. He does the
mind-reading (fingers to the temple) and flourishes his answer: the Ace of Hearts. It shakes its head. In the silence
it turns its card round. The card it picked is him - his face, live, doing whatever he does, the other way round. He
stares; his hat jumps and the card's hat jumps. He touches his moustache; so does the card. He takes his hat off to
it - and so does the card. What it knows of us is what we showed it.
    python3 video/build_card.py        (TEST=t1,t2 TESTDIR=dir; PART=a,b VOUT=f; writes out/card-fx.wav)
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
from build_escape import cap  # noqa: E402

F = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS, SS = 704, 1280, 24, 2
WD, HD = SW.WD, SW.HD
BEAT, PHASE = 60 / 80.0, 0.6
S0, S1 = 35.0, 60.5
DUR = S1 - S0
FAN, PICK, LOOK, CHEST, READ, GUESS, SHAKE, TURN, HIT = 36.0, 38.1, 38.7, 39.4, 42.0, 44.4, 46.2, 50.3, 51.6
TOUCH, DOFF, SMILE = 53.6, 56.1, 57.6
TEST = [float(x) for x in os.environ.get("TEST", "").split(",") if x]
PART = [float(x) for x in os.environ.get("PART", "").split(",") if x]
FLOOR = 1210
SX = 330                                   # the star stands here (hips at FLOOR - 170)
SW.RX, SW.SHY, SW.BY0 = 640, 730, 950
CW, CH = 130, 180                          # the star's card (a big stage card)
rng = np.random.default_rng(23)


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def ramp(s, a, b):
    return ease((s - a) / (b - a))


def beat(s):
    return (s - PHASE) / BEAT


def draw_star(d, k, x, y, hand, hdx, look, happy):
    """the star (as in build_escape.draw_star, standing), its right hand at `hand`, head offset hdx for a shake"""
    blue, white, skin = (40, 70, 170), (236, 236, 240), (236, 206, 178)
    for sgn in (-1, 1):
        cap(d, (x + sgn * 14, y), (x + sgn * 18, FLOOR - 20), 20, (240, 240, 244), k)
        d.polygon([((x + sgn * 18 - 16) * k, (FLOOR - 26) * k), ((x + sgn * 18 + 22 * sgn) * k, (FLOOR - 14) * k),
                   ((x + sgn * 18 + 22 * sgn) * k, FLOOR * k), ((x + sgn * 18 - 16) * k, FLOOR * k)], fill=(170, 22, 32))
    top = y - 120
    for i in range(6):
        y0 = top + i * 20
        d.rectangle([(x - 30 - i * 0.6) * k, y0 * k, (x + 30 + i * 0.6) * k, (y0 + 20) * k], fill=blue if i % 2 == 0 else white)
    cap(d, (x - 32, top + 12), (x - 44, top + 70), 17, blue, k)
    cap(d, (x - 44, top + 70), (x - 36, top + 118), 15, skin, k)
    hx, hy = x + hdx, top - 44
    d.rectangle([(x - 10) * k, (top - 12) * k, (x + 10) * k, (top + 2) * k], fill=skin)
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
    sh = (x + 32, top + 12)
    el = ((sh[0] + hand[0]) / 2 + 10, (sh[1] + hand[1]) / 2 + 22)
    cap(d, sh, el, 17, blue, k)
    cap(d, el, hand, 15, skin, k)


def card_back(w, h):
    im = Image.new("RGB", (w, h), (236, 232, 222))
    d = ImageDraw.Draw(im)
    d.rectangle([4, 4, w - 5, h - 5], fill=(150, 20, 34))
    for i in range(-h, w + h, 12):
        d.line([(i, 6), (i + h, h + 6)], fill=(176, 40, 52), width=2)
        d.line([(i, h + 6), (i + h, 6)], fill=(176, 40, 52), width=2)
    d.rectangle([4, 4, w - 5, h - 5], outline=(210, 170, 80), width=3)
    return im


def heart(d, cx, cy, r, fill):
    d.ellipse([cx - r, cy - r * 0.9, cx, cy + r * 0.1], fill=fill)
    d.ellipse([cx, cy - r * 0.9, cx + r, cy + r * 0.1], fill=fill)
    d.polygon([(cx - r * 0.98, cy - r * 0.3), (cx + r * 0.98, cy - r * 0.3), (cx, cy + r * 1.05)], fill=fill)


def draw_ace(d, k, x, y, ang):
    """the Ace of Hearts, held up (x, y) = its centre"""
    w, h = 62, 90
    ca, sa = math.cos(ang), math.sin(ang)
    P = lambda u, v: ((x + u * ca - v * sa) * k, (y + u * sa + v * ca) * k)   # noqa: E731
    d.polygon([P(-w / 2, -h / 2), P(w / 2, -h / 2), P(w / 2, h / 2), P(-w / 2, h / 2)], fill=(246, 244, 236), outline=(60, 50, 50))
    c = P(0, 2)
    heart(d, c[0], c[1], 17 * k, (200, 24, 36))
    for (u, v) in ((-w / 2 + 9, -h / 2 + 10), (w / 2 - 9, h / 2 - 10)):
        q = P(u, v)
        heart(d, q[0], q[1], 5 * k, (200, 24, 36))


def draw_fan(d, k, x, y, spread):
    for i in range(7):
        a = (i - 3) * 0.22 * spread - 0.3
        ca, sa = math.cos(a), math.sin(a)
        P = lambda u, v: ((x + u * ca - v * sa) * k, (y + u * sa + v * ca) * k)   # noqa: E731, B023
        d.polygon([P(-24, -70), P(24, -70), P(24, 0), P(-24, 0)], fill=(150, 20, 34), outline=(236, 232, 222))


def fx():
    SR = 44100
    out = np.zeros(int((DUR + 4) * SR))

    def put(t0, sig, g):
        i = int((t0 - S0) * SR)
        n = min(len(sig), len(out) - i)
        out[i:i + n] += sig[:n] * g

    def flick(dur=0.05):
        t = np.arange(int(dur * SR)) / SR
        return gaussian_filter(rng.normal(0, 1, len(t)), 1.2) * np.exp(-t * 90)
    for j in range(9):                                   # the riffle as the fan opens
        put(FAN + 0.2 + j * 0.035, flick(), 0.25)
    put(PICK + 0.3, flick(0.08), 0.35)
    put(GUESS + 0.1, flick(0.08), 0.4)
    for j in range(3):                                   # the card turning, in the silence: three soft ticks
        put(TURN + 0.3 + j * 0.3, flick(0.04), 0.12)
    raw = (np.clip(out, -1, 1) * 32767).astype(np.int16).tobytes()
    subprocess.run([F, "-loglevel", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "-", "out/card-fx.wav"],
                   input=raw, check=True)


def main():
    if not PART or PART[0] == 0:
        fx()
    base = SW.stage()
    ys, xs = np.mgrid[0:HD, 0:WD].astype(np.float32)
    back = card_back(CW, CH)
    out = None
    if not TEST:
        out = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                                str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "15", "-preset", "slow", "-pix_fmt", "yuv420p",
                                os.environ.get("VOUT", "out/drawn/card.mp4")], stdin=subprocess.PIPE)
    y_star = FLOOR - 170
    top = y_star - 120
    for n in range(int(DUR * FPS)):
        t = n / FPS
        s = S0 + t
        if TEST and not any(abs(s - q) < 0.5 / FPS for q in TEST):
            continue
        if PART and not (PART[0] <= t < PART[1]):
            continue
        b = beat(s)
        # ---- the ringmaster: [left hand, right hand]
        hat_up, look, beam = 0.0, -1.0, 1.0
        fan_at, ace_at, deck_at = None, None, None
        if s < FAN:
            hands = [(SW.RX - 170, SW.SHY + 90 + 10 * math.sin(math.pi * b)), (SW.RX + 104, SW.SHY + 160)]
        elif s < CHEST:                                       # the fan held out to it
            u = ramp(s, FAN, FAN + 0.6)
            hands = [(SW.RX - 60 - 170 * u, SW.SHY + 150 + 20 * u), (SW.RX + 104, SW.SHY + 160)]
            fan_at = (hands[0][0] - 6, hands[0][1] - 6, ramp(s, FAN + 0.2, FAN + 0.8))
        elif s < READ:                                        # the deck squared, down at his side
            hands = [(SW.RX - 110, SW.SHY + 200), (SW.RX + 104, SW.SHY + 160)]
            deck_at = hands[0]
        elif s < GUESS:                                       # the mind-reading: fingers to the temple, eyes shut tight
            u = ramp(s, READ, READ + 0.5)
            hands = [(SW.RX - 110, SW.SHY + 200), (SW.RX + 104 - 70 * u, SW.SHY + 160 - 250 * u)]
            deck_at = hands[0]; beam = 0.0; look = 0.0
        elif s < HIT:                                         # the answer: the Ace of Hearts, flourished high
            u = ramp(s, GUESS, GUESS + 0.35)
            lower = ramp(s, TURN, HIT)
            hands = [(SW.RX - 110, SW.SHY + 200), (SW.RX + 34 + 80 * u, SW.SHY - 90 - 90 * u + 200 * lower)]
            deck_at = hands[0]
            ace_at = (hands[1][0] + 6, hands[1][1] - 52, 0.15 * math.sin(math.pi * b) * (1 - lower))
        else:
            hands = [(SW.RX - 96, SW.SHY + 175), (SW.RX + 150, SW.SHY + 100)]
            hat_up = 60 * ramp(s, HIT, HIT + 0.12) * (1 - ramp(s, HIT + 0.5, HIT + 0.9))
            beam = 1.0
            if s >= TOUCH:                                    # he touches his moustache ...
                u = ramp(s, TOUCH, TOUCH + 0.5) * (1 - ramp(s, TOUCH + 1.6, TOUCH + 2.1))
                hands[1] = (SW.RX + 150 - 130 * u, SW.SHY + 100 - 130 * u)
                beam = 1 - u
            if s >= DOFF:                                     # ... and lifts his hat to it
                u = ramp(s, DOFF, DOFF + 0.6)
                v = ramp(s, DOFF + 0.6, DOFF + 1.2)
                hands[1] = (SW.RX + 150 - 98 * u, SW.SHY + 100 - 250 * u - 80 * v)
                hat_up = 80 * v
            deck_at = None
        cl = []
        for sgn, (px, py) in zip((-1, 1), hands):
            sx, sy = SW.RX + sgn * 60, SW.SHY + 16
            dd = math.hypot(px - sx, py - sy)
            f = min(1.0, 232 / max(dd, 1e-6))
            cl.append((sx + (px - sx) * f, sy + (py - sy) * f))
        hands = cl
        if fan_at:
            fan_at = (hands[0][0] - 6, hands[0][1] - 6, fan_at[2])
        if deck_at:
            deck_at = hands[0]
        if ace_at:
            ace_at = (hands[1][0] + 6, hands[1][1] - 52, ace_at[2])
        # ---- the star: its right hand, where the card is, which way the card faces
        slook, hdx, happy = (1.0, -0.3), 0.0, s >= SMILE
        flip = 0.0                                            # 0 = back to us, 1 = face to us
        card_at = None
        if s < PICK:
            hand = (SX + 60, top + 104)
            slook = (1.0, 0.0)
        elif s < LOOK:                                        # it reaches and draws one out of the fan
            u = ramp(s, PICK, PICK + 0.35)
            v = ramp(s, PICK + 0.35, LOOK)
            fx_, fy_ = hands[0][0] - 20, hands[0][1] - 70
            hand = (SX + 60 + (fx_ - SX - 60) * u + (SX + 60 - fx_) * v, top + 104 + (fy_ - top - 104) * u + (top - 40 - fy_) * v)
            card_at = hand if s >= PICK + 0.3 else None
        elif s < CHEST:                                       # it looks at the card (we see only the back)
            hand = (SX + 58, top - 40)
            card_at = hand; slook = (1.0, 0.4)
        elif s < TURN:                                        # it holds the card to its chest
            u = ramp(s, CHEST, CHEST + 0.5)
            hand = (SX + 58 - 16 * u, top - 40 + 110 * u)
            card_at = hand
            slook = (1.0, -0.3)
            env = ramp(s, SHAKE, SHAKE + 0.2) * (1 - ramp(s, SHAKE + 1.6, SHAKE + 2.0))
            hdx = 9 * math.sin((s - SHAKE) * 2 * math.pi * 1.4) * env
        else:                                                 # it holds the card out and turns it round
            u = ramp(s, TURN, TURN + 0.4)
            hand = (SX + 42 + 40 * u, top + 70 - 60 * u)
            card_at = hand
            flip = ramp(s, TURN + 0.3, HIT - 0.05)
            slook = (1.0, -0.3)
        # ---- draw the figures
        k = SS
        lay = Image.new("RGBA", (WD * k, HD * k), (0, 0, 0, 0))
        d = ImageDraw.Draw(lay)
        for sgn in (-1, 1):
            cap(d, (SW.RX + sgn * 26, SW.BY0 + 4), (SW.RX + sgn * 30, FLOOR - 16), 34, (26, 22, 28), k)
            d.polygon([((SW.RX + sgn * 30 - 18) * k, (FLOOR - 20) * k), ((SW.RX + sgn * 30 + 26) * k, (FLOOR - 10) * k),
                       ((SW.RX + sgn * 30 + 26) * k, FLOOR * k), ((SW.RX + sgn * 30 - 18) * k, FLOOR * k)], fill=(12, 10, 12))
        SW.draw_ringmaster_body(d, k, look, hat_up, beam)
        draw_star(d, k, SX, y_star, hand, hdx, slook, happy)
        SW.draw_arms(d, k, hands)
        if fan_at:
            draw_fan(d, k, fan_at[0], fan_at[1], fan_at[2])
            SW.draw_arms(d, k, [hands[0], hands[1]])
        if deck_at:
            d.rectangle([(deck_at[0] - 24) * k, (deck_at[1] - 60) * k, (deck_at[0] + 24) * k, (deck_at[1] + 8) * k], fill=(150, 20, 34), outline=(236, 232, 222))
            d.ellipse([(deck_at[0] - 19) * k, (deck_at[1] - 19) * k, (deck_at[0] + 19) * k, (deck_at[1] + 19) * k], fill=(246, 246, 240))
        if ace_at:
            draw_ace(d, k, ace_at[0], ace_at[1], ace_at[2])
            d.ellipse([(hands[1][0] - 19) * k, (hands[1][1] - 19) * k, (hands[1][0] + 19) * k, (hands[1][1] + 19) * k], fill=(246, 246, 240))
        if s >= HIT:                                          # the ace, dropped, on the boards
            fall = ramp(s, HIT, HIT + 0.7)
            draw_ace(d, k, SW.RX + 150 + 30 * fall, SW.SHY + 50 + (FLOOR - 4 - SW.SHY - 50) * fall, 1.2 * fall + 0.3 * math.sin(fall * 9))
        lay = lay.resize((WD, HD), Image.LANCZOS)
        la = np.asarray(lay, np.float32)
        alpha = la[..., 3:4] / 255
        dim = 1 - 0.35 * ramp(s, TURN, TURN + 0.3) * (1 - ramp(s, HIT - 0.05, HIT + 0.15))
        spot = np.exp(-(((xs - 490) / 420) ** 2 + ((ys - 960) / 440) ** 2))
        a = base + spot[..., None] * np.array([90, 76, 60], np.float32)
        a = a * (1 - alpha) + la[..., :3] * (0.55 + 0.6 * spot[..., None]) * alpha
        a *= dim
        # ---- the card: its face is him, live and the other way round (cropped from this very frame)
        if card_at is not None:
            cx_, cy_ = card_at[0] + 44, card_at[1] - 66
            face = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).crop(
                (int(SW.RX - 92), int(SW.SHY - 250), int(SW.RX + 92), int(SW.SHY + 4)))
            face = face.transpose(Image.FLIP_LEFT_RIGHT).resize((CW - 12, CH - 12), Image.LANCZOS)
            front = Image.new("RGB", (CW, CH), (222, 214, 196))
            fd = ImageDraw.Draw(front)
            fd.rectangle([2, 2, CW - 3, CH - 3], outline=(200, 160, 70), width=3)
            front.paste(face, (6, 6))
            fd.rectangle([5, 5, CW - 6, CH - 6], outline=(200, 160, 70), width=1)
            ph = flip * math.pi
            wv = max(2, int(CW * abs(math.cos(ph))))
            img = (front if flip > 0.5 else back).resize((wv, CH), Image.LANCZOS)
            arr = np.asarray(img, np.float32) * (1.0 if flip > 0.5 else 0.9) * (0.75 + 0.35 * spot[int(cy_), int(cx_)])
            x0, y0 = int(cx_ - wv / 2), int(cy_ - CH / 2)
            a[y0:y0 + CH, x0:x0 + wv] = arr
            # its fingers over the bottom corner
            fh = np.exp(-(((xs - card_at[0]) / 9) ** 2 + ((ys - card_at[1]) / 9) ** 2)) > 0.5
            a[fh] = np.array([236, 206, 178], np.float32) * 0.9 * dim
        a = 255 * (1 - np.exp(-a / 255 * 1.15)) * 1.1
        # ---- camera: wide; closer to the star as it holds its card; right on the card at the turn; then back to see both
        cardc = (SX + 42 + 40 * ramp(s, TURN, TURN + 0.4) + 44, top + 70 - 60 * ramp(s, TURN, TURN + 0.4) - 66)
        z1, c1 = 1.2, (495, 820)
        z2, c2 = 1.85, (440, 880)
        z3, c3 = 3.0, cardc
        z4, c4 = 1.85, (540, 810)
        u2 = ramp(s, SHAKE - 0.5, TURN)
        u3 = ramp(s, TURN, HIT)
        u4 = ramp(s, TOUCH - 0.6, TOUCH + 0.6)
        u5 = ramp(s, DOFF + 1.2, S1 - 0.3)
        z = z1 + (z2 - z1) * u2
        cx = c1[0] + (c2[0] - c1[0]) * u2
        cy = c1[1] + (c2[1] - c1[1]) * u2
        z, cx, cy = z + (z3 - z) * u3, cx + (c3[0] - cx) * u3, cy + (c3[1] - cy) * u3
        z, cx, cy = z + (z4 - z) * u4, cx + (c4[0] - cx) * u4, cy + (c4[1] - cy) * u4
        z, cx, cy = z + (1.25 - z) * u5, cx + (500 - cx) * u5, cy + (820 - cy) * u5
        fw, fh_ = WD / z, HD / z
        fx0, fy0 = min(max(cx - fw / 2, 0), WD - fw), min(max(cy - fh_ / 2, 0), HD - fh_)
        a = np.asarray(Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).resize((W, H), Image.LANCZOS, box=(fx0, fy0, fx0 + fw, fy0 + fh_)), np.float32)
        a *= ease(t / 0.4)
        if s >= S1 - 0.08:
            a *= 0
        a += rng.normal(0, 2.4, (H, W, 1))
        frame = np.clip(a, 0, 255).astype(np.uint8)
        if TEST:
            Image.fromarray(frame).save(f"{os.environ['TESTDIR']}/c{s:.2f}.png")
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
