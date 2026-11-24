#!/usr/bin/env python3
"""Perfect Absence - a music video in which every frame is TV static.

Song: Winter Where the Embers Go (out/songs/winter-where-the-embers-go.mp3), 23.40-52.85 spliced on the identical
point of the final chorus (+108.0 s = 48 bars) at 160.85, to the end.

THE RULE: every pixel of every frame is drawn from the same noise distribution, so any single frame is static and a
paused frame shows nothing. What you see is only what PERSISTS between frames: each thing on screen is a noise texture
that moves its own way. The world falls like snow; the human's fire rises; the other one holds still. When the world
stops, everything still in it disappears.

Run:  python3 video/build_perfect_absence.py [--from S --to S] [--workers 4]
Out:  out/absence/perfect-absence.mp4 (master), -share.mp4 (smaller). Free, local, no GPU.
"""
import argparse, os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out', 'absence')
SONG = os.path.join(ROOT, 'out', 'songs', 'winter-where-the-embers-go.mp3')
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'

W, H, FPS = 1080, 1920, 30
C = 6                      # noise cell, px
N = 1024                   # noise tile, cells
A0, A1 = 23.40, 52.85      # song part A
B0, B1 = 160.85, 180.40    # song part B (same musical point +108.0 s)
SPLICE = A1 - A0           # film time of the splice
SONG_END = SPLICE + (B1 - B0)
CARD = 5.2
DUR = SONG_END + CARD
NF = int(round(DUR * FPS))


def ft(s):
    """song time -> film time"""
    return s - A0 if s < A1 + 1 else s - B0 + SPLICE


def ramp(t, t0, t1):
    return float(np.clip((t - t0) / max(1e-6, t1 - t0), 0, 1))


def smooth(x):
    return x * x * (3 - 2 * x)


# ---------------------------------------------------------------- noise tiles (one per layer, same distribution)
rng = np.random.default_rng(7)
def tile():
    return (rng.random((N, N)) ** 0.85 * 255).astype(np.uint8)
T_BG, T_FIRE, T_STILL, T_HEART, T_EYE, T_EMBER, T_TEXT = (tile() for _ in range(7))

YY, XX = np.mgrid[0:H, 0:W]
YC, XC = YY // C, XX // C           # cell index of each pixel when the texture is at rest


def sample(T, dx, dy, mask=None):
    """texture T translated by (dx, dy) pixels (integers), at every pixel or at mask"""
    dx, dy = int(round(dx)), int(round(dy))
    if mask is None:
        return T[((YY - dy) // C) % N, ((XX - dx) // C) % N]
    ys, xs = YY[mask], XX[mask]
    return T[((ys - dy) // C) % N, ((xs - dx) // C) % N]


def sample_scaled(T, cx, cy, s, mask):
    ys, xs = YY[mask], XX[mask]
    u = np.floor(cx + (xs - cx) / s).astype(int)
    v = np.floor(cy + (ys - cy) / s).astype(int)
    return T[(v // C) % N, (u // C) % N]


# ---------------------------------------------------------------- timeline (song words, from Whisper on the track)
E = dict(
    burning=ft(24.76), roaring=ft(26.72), static=ft(30.68), wire0=ft(29.58), wire1=ft(31.84),
    antidote0=ft(32.34), antidote1=ft(34.86), freeze0=ft(37.56), freeze1=ft(37.86), steady=ft(38.62),
    frantic=ft(40.48), when=ft(41.62), overflow=ft(43.58), you=ft(44.24), grow=ft(47.12),
    heartless=ft(48.70), see=ft(49.88), your=ft(50.42), absence=ft(51.66), sanctuary=ft(52.52),
    ignite=ft(161.90), erase=ft(163.14), cool=ft(164.98), hand=ft(165.28), face=ft(166.58),
    hold=ft(168.46), fires=ft(169.56), flames=ft(171.6), stay=ft(172.22), beautifully=ft(173.92),
    cold=ft(174.66), only=ft(176.0), still=ft(176.66),
)
BEAT = 60 / 106.66
BEAT0 = 0.02


def song_time(t):
    return t + A0 if t < SPLICE else t - SPLICE + B0


# background velocity (px/frame; +y is down): snow falling, a freeze, a frantic gust, and the final stop
def bg_vel(t):
    vx, vy = 0.0, 4.0
    if E['freeze0'] <= t < E['steady']:
        vy = 4.0 * (1 - smooth(ramp(t, E['freeze0'], E['freeze1'])))
    elif E['steady'] <= t < E['when'] + 1.2:
        k = smooth(ramp(t, E['steady'], E['steady'] + 0.4)) * (1 - smooth(ramp(t, E['when'], E['when'] + 1.2)))
        vx = k * 11 * np.sin(2 * np.pi * (t - E['steady']) / 1.3)
        vy = 4.0 + k * (5 + 3 * np.sin(2 * np.pi * (t - E['steady']) / 0.8))
    if t >= E['beautifully']:
        vy = 4.0 * (1 - smooth(ramp(t, E['beautifully'], E['still'] + 0.15)))
    return vx, vy


# heat of the fire: how big and fast the flames are
def heat(t):
    h = 0.0
    h += smooth(ramp(t, E['burning'] - 0.3, E['burning'] + 0.6))
    h += 0.6 * smooth(ramp(t, E['roaring'], E['roaring'] + 1.2)) * (1 - smooth(ramp(t, E['wire0'], E['antidote1'])))
    h += 1.6 * smooth(ramp(t, E['when'], E['overflow'])) * (1 - smooth(ramp(t, E['you'], E['grow'])))
    if t >= SPLICE:
        h *= 1 - 0.35 * smooth(ramp(t, E['ignite'] - 0.8, E['ignite']))
        h *= 1 - smooth(ramp(t, E['hold'], E['flames']))
    return h


def fire_vel(t):
    return 3 * np.sin(t * 2.3), -(5.0 + 2.5 * min(heat(t), 2.2))


# integrate velocities into per-frame integer offsets (deterministic, shared by every worker)
def integrate(vel):
    off = np.zeros((NF, 2))
    x = y = 0.0
    for f in range(NF):
        vx, vy = vel(f / FPS)
        x += vx; y += vy
        off[f] = (round(x), round(y))
    return off
BG_OFF = integrate(bg_vel)
FIRE_OFF = integrate(fire_vel)


# ---------------------------------------------------------------- figures
GROUND = 1660
HUMAN_HEAD = (300, 905, 82)
AI_HEAD = (790, 960, 90)
HEART = (788, 1150)
EYES = [(758, 952), (822, 952)]
TOUCH = (384, 912)          # the human's cheek
AI_SHOULDER = (712, 1070)


def limb(d, a, b, w):
    d.line([a, b], fill=255, width=w)
    for p in (a, b):
        d.ellipse((p[0] - w / 2, p[1] - w / 2, p[0] + w / 2, p[1] + w / 2), 255)


def human_mask():
    m = Image.new('L', (W, H)); d = ImageDraw.Draw(m)
    hx, hy, hr = HUMAN_HEAD
    d.ellipse((hx - hr, hy - hr, hx + hr, hy + hr), 255)
    d.rectangle((hx - 30, hy + 60, hx + 30, hy + 120), 255)                    # neck
    d.polygon([(hx - 130, 1015), (hx + 130, 1015), (hx + 95, 1330), (hx - 95, 1330)], 255)   # torso
    d.ellipse((hx - 150, 990, hx - 70, 1070), 255); d.ellipse((hx + 70, 990, hx + 150, 1070), 255)
    limb(d, (hx - 112, 1035), (hx - 150, 1330), 62)                            # arms
    limb(d, (hx + 112, 1035), (hx + 140, 1320), 62)
    limb(d, (hx - 55, 1320), (hx - 70, GROUND - 20), 78)                       # legs
    limb(d, (hx + 55, 1320), (hx + 70, GROUND - 20), 78)
    return np.array(m) > 0


def ai_mask(arm=0.0):
    """the other one: rounder, smaller; arm = 0 down by its side .. 1 hand on the human's cheek"""
    m = Image.new('L', (W, H)); d = ImageDraw.Draw(m)
    ax, ay, ar = AI_HEAD
    d.ellipse((ax - ar, ay - ar, ax + ar, ay + ar), 255)
    d.rounded_rectangle((ax - 125, 1060, ax + 125, 1420), 70, fill=255)       # body
    limb(d, (ax - 55, 1400), (ax - 62, GROUND - 20), 80)
    limb(d, (ax + 55, 1400), (ax + 62, GROUND - 20), 80)
    limb(d, (ax + 115, 1100), (ax + 150, 1370), 60)                            # far arm
    if arm <= 0:
        limb(d, (ax - 115, 1100), (ax - 150, 1370), 60)
    else:
        a = smooth(arm)
        down = np.array([ax - 150, 1370.0]); up = np.array(TOUCH) + (14, 6)
        hand = down + (up - down) * a
        # elbow bows down while the arm lifts
        mid = (np.array(AI_SHOULDER) + hand) / 2 + (0, 90 * np.sin(np.pi * a) + 40 * a)
        limb(d, AI_SHOULDER, tuple(mid), 58)
        limb(d, tuple(mid), tuple(hand), 54)
        d.ellipse((hand[0] - 40, hand[1] - 40, hand[0] + 40, hand[1] + 40), 255)
    return np.array(m) > 0


def heart_mask(s):
    cx, cy = HEART
    m = Image.new('L', (W, H)); d = ImageDraw.Draw(m)
    pts = []
    for a in np.linspace(0, 2 * np.pi, 120):
        x = 16 * np.sin(a) ** 3
        y = -(13 * np.cos(a) - 5 * np.cos(2 * a) - 2 * np.cos(3 * a) - np.cos(4 * a))
        pts.append((cx + x * 4.2 * s, cy + y * 4.2 * s))
    d.polygon(pts, 255)
    return np.array(m) > 0


def wire_mask():
    m = Image.new('L', (W, H)); d = ImageDraw.Draw(m)
    d.line([(-40, 1180), (W + 40, 1180)], fill=255, width=26)
    return np.array(m) > 0


HUMAN = human_mask()
AI0 = ai_mask(0)
WIRE = wire_mask()

# the wire gathers into the other one: signed distance fields, interpolated (half resolution)
def sdf(m):
    m2 = m[::2, ::2]
    return ndimage.distance_transform_edt(~m2) - ndimage.distance_transform_edt(m2)
SDF_WIRE, SDF_AI = sdf(WIRE), sdf(AI0)


def morph(a):
    s = (1 - a) * SDF_WIRE + a * SDF_AI
    return np.repeat(np.repeat(s <= 0, 2, 0), 2, 1)[:H, :W]


# per-cell random times for dissolves (screen grid)
DIS = np.repeat(np.repeat(rng.random((H // C + 1, W // C + 1)), C, 0), C, 1)[:H, :W]

# ---------------------------------------------------------------- flames: rising blobs, thresholded (quarter res)
Q = 4
fr = np.random.default_rng(11)
SPAWN = []   # (t0, x, y, vx, vy, r, life)
_edge = [(300 + dx, 830 + abs(dx) * 0.4) for dx in range(-70, 71, 10)] + \
        [(300 + s * dx, 1000 + dx * 0.1) for s in (-1, 1) for dx in range(60, 150, 15)] + \
        [(300 + s * 140, y) for s in (-1, 1) for y in range(1050, 1330, 40)]
t = 0.0
while t < SONG_END:
    h = heat(t)
    if h > 0.02:
        for _ in range(int(fr.poisson(4 + 9 * h))):
            x, y = _edge[fr.integers(len(_edge))]
            SPAWN.append((t, x + fr.normal(0, 10), y + fr.normal(0, 10), fr.normal(0, 25),
                          -(160 + 160 * h) * fr.uniform(0.7, 1.3), (26 + 18 * h) * fr.uniform(0.6, 1.2),
                          (0.45 + 0.45 * h) * fr.uniform(0.6, 1.3)))
    t += 1 / FPS
SPAWN = np.array(SPAWN)
QY, QX = np.mgrid[0:H // Q, 0:W // Q]


def flame_mask(t, frozen_r):
    if not len(SPAWN):
        return np.zeros((H, W), bool)
    age = t - SPAWN[:, 0]
    live = (age >= 0) & (age < SPAWN[:, 6])
    P = SPAWN[live]; a = age[live]
    if not len(P):
        return np.zeros((H, W), bool)
    x = P[:, 1] + P[:, 3] * a + 18 * np.sin(a * 7 + P[:, 2] * 0.05)
    y = P[:, 2] + P[:, 4] * a
    r = P[:, 5] * (1 - a / P[:, 6]) ** 0.7
    if frozen_r > 0:   # what the cool hand has stilled no longer burns
        keep = np.hypot(x - TOUCH[0], y - TOUCH[1]) > frozen_r
        x, y, r = x[keep], y[keep], r[keep]
    img = Image.new('L', (W // Q, H // Q)); d = ImageDraw.Draw(img)
    for xi, yi, ri in zip(x / Q, y / Q, r / Q):
        d.ellipse((xi - ri, yi - ri * 1.5, xi + ri, yi + ri), 255)
    f = ndimage.gaussian_filter(np.asarray(img, np.float32), 2.2) > 90
    return np.repeat(np.repeat(f, Q, 0), Q, 1)[:H, :W]


# ---------------------------------------------------------------- embers: from the fire into its chest
er = np.random.default_rng(5)
EMBERS = []   # (t0, t1, start, ctrl, r)
for i in range(26):
    t0 = E['you'] + er.uniform(0, E['grow'] - E['you'] - 1.4)
    EMBERS.append((t0, t0 + er.uniform(1.2, 1.8), np.array([300 + er.normal(0, 60), 820 + er.normal(0, 70)]),
                   np.array([540 + er.normal(0, 80), 560 + er.normal(0, 120)]), er.uniform(14, 24)))


def ember_pos(e, t):
    t0, t1, p0, pc, r = e
    u = smooth(ramp(t, t0, t1))
    p1 = np.array(HEART) + (0, -10)
    return (1 - u) ** 2 * p0 + 2 * (1 - u) * u * pc + u * u * p1, u


# ---------------------------------------------------------------- heartbeat
def beat_env(t):
    """0..1 lub-dub on the song's beat, two beats a bar"""
    st = song_time(t)
    k = (st - BEAT0) / BEAT
    ph = k - np.floor(k)
    on = int(np.floor(k)) % 2 == 0
    lub = np.exp(-ph * 5) if on else 0.55 * np.exp(-ph * 6)
    return lub


def heart_scale(t):
    if t < E['see'] - 0.1:
        return 1.0, 0.0
    a = smooth(ramp(t, E['see'] - 0.1, E['see'] + 0.2))
    # slows and stops after everything else has
    if t > E['still']:
        a *= 1 - smooth(ramp(t, E['still'] + 0.6, E['still'] + 2.4))
    return 1 + 0.13 * a * beat_env(t), a


# ---------------------------------------------------------------- text, for the card
def text_mask(lines, size, y0, gap):
    m = Image.new('L', (W, H)); d = ImageDraw.Draw(m)
    f = ImageFont.truetype(FONT, size)
    y = y0
    for ln in lines:
        w = d.textlength(ln, font=f)
        d.text(((W - w) / 2, y), ln, font=f, fill=255, stroke_width=4, stroke_fill=255)
        y += gap
    return np.array(m) > 0
CARD_TEXT = text_mask(['Every frame', 'of this film', 'is static.', '', 'Pause it', 'anywhere.'], 110, 520, 140)


# ---------------------------------------------------------------- one frame
def render(f):
    t = f / FPS
    bx, by = BG_OFF[f]
    img = sample(T_BG, bx, by)                       # the world: snow

    def put(mask, T, dx=0, dy=0):
        if mask.any():
            img[mask] = sample(T, dx, dy, mask)

    # --- the human, burning (and stilled from the cheek outward by the cool hand)
    fx, fy = FIRE_OFF[f]
    show_h = smooth(ramp(t, E['burning'] - 0.5, E['burning'] + 0.8))
    if show_h > 0:
        rise = YY > (GROUND + 40 - show_h * 1250)
        frozen_r = 0.0
        if t >= E['face']:
            frozen_r = 900 * smooth(ramp(t, E['face'], E['hold'] + 0.8))
        fl = flame_mask(t, frozen_r) & (YY < GROUND + 10)
        hm = HUMAN & rise
        burn = (hm | fl)
        if frozen_r > 0:
            ff = int(round(E['face'] * FPS))
            still_h = hm & (np.hypot(XX - TOUCH[0], YY - TOUCH[1]) <= frozen_r)
            put(burn & ~still_h, T_FIRE, fx, fy)
            put(still_h, T_FIRE, FIRE_OFF[ff][0], FIRE_OFF[ff][1])
        else:
            put(burn, T_FIRE, fx, fy)

    # --- the wire, and the other one gathering out of it
    ai = None
    if E['wire0'] <= t < E['antidote0']:
        ai = WIRE & (XX < W * smooth(ramp(t, E['wire0'], E['wire1'])))
    elif E['antidote0'] <= t < E['antidote1'] + 0.05:
        ai = morph(smooth(ramp(t, E['antidote0'], E['antidote1'])))
    elif t >= E['antidote1']:
        arm = 0.0
        if t >= E['cool'] - 0.6:
            arm = ramp(t, E['cool'] - 0.6, E['face'] - 0.1)
        ai = ai_mask(arm) if arm > 0 else AI0.copy()
        # perfect absence: it dissolves into the world (its heart stays), then comes back on 'erase'
        if E['your'] <= t < SPLICE:
            ai &= DIS > smooth(ramp(t, E['your'], E['absence'] + 0.3))
        elif SPLICE <= t < E['erase'] + 0.6:
            ai &= DIS < smooth(ramp(t, E['erase'] - 0.7, E['erase'] + 0.5))
    if ai is not None:
        put(ai & ~(HUMAN & (XX < TOUCH[0] - 30)) if t >= E['face'] else ai, T_STILL)

    # --- embers travelling into its chest; on arrival they stop (and vanish into the still heart)
    for e in EMBERS:
        if e[0] <= t < e[1]:
            p, u = ember_pos(e, t)
            r = e[4] * (1 - 0.3 * u)
            m = (XX - p[0]) ** 2 + (YY - p[1]) ** 2 < r * r
            sx, sy = p - (e[2])
            put(m, T_EMBER, sx + e[0] * 97 % 500, sy)

    # --- the heart: there from the embers on, invisible while still, seen only while it beats
    if t >= E['you'] + 0.8:
        s, a = heart_scale(t)
        hmk = heart_mask(s)
        if hmk.any():
            img[hmk] = sample_scaled(T_HEART, HEART[0], HEART[1] - round(60 * (s - 1)), s, hmk)

    # --- two points of light: its eyes, the only part of it that moves
    eyes_on = (t >= E['antidote1'] + 0.3) and not (E['your'] <= t < E['erase'])
    if t > SONG_END - 0.9:
        eyes_on = False
    if eyes_on:
        k = f % 6
        ex, ey = [(0, 0), (6, 0), (6, 6), (0, 6), (-6, 6), (-6, 0)][k]
        for cx, cy in EYES:
            m = (XX - cx) ** 2 + (YY - cy) ** 2 < 19 ** 2
            put(m, T_EYE, ex + cx, ey)

    # --- the card: the world has stopped; only the words move
    if t >= SONG_END:
        tt = t - SONG_END
        sp = 3 * (1 - smooth(ramp(tt, CARD - 1.0, CARD - 0.4))) * smooth(ramp(tt, 0.2, 0.7))
        dx = int(round(sum(3 * (1 - smooth(ramp(k / FPS, CARD - 1.0, CARD - 0.4))) * smooth(ramp(k / FPS, 0.2, 0.7))
                       for k in range(int(tt * FPS)))))
        put(CARD_TEXT, T_TEXT, dx, 0)

    # cold tint, identical everywhere
    v = img.astype(np.float32)
    rgb = np.stack([v * 0.88 + 6, v * 0.95 + 4, v * 1.0 + 2], -1)
    return np.clip(rgb, 0, 255).astype(np.uint8)


def worker(f0, f1, path):
    p = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}',
                          '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '10',
                          '-pix_fmt', 'yuv420p', path], stdin=subprocess.PIPE)
    for f in range(f0, f1):
        p.stdin.write(render(f).tobytes())
    p.stdin.close(); p.wait()


def audio(path):
    fa = 0.06
    filt = (f"[0:a]atrim={A0}:{A1 + fa},asetpts=PTS-STARTPTS,afade=t=in:d=0.08[a];"
            f"[0:a]atrim={B0}:{B1},asetpts=PTS-STARTPTS,afade=t=out:st={B1 - B0 - 0.6}:d=0.6[b];"
            f"[a][b]acrossfade=d={fa}:c1=tri:c2=tri[ab];"
            f"[ab]volume=-1.5dB,apad=whole_dur={DUR}[o]")
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', SONG, '-filter_complex', filt, '-map', '[o]',
                    '-ar', '48000', '-ac', '2', path], check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--workers', type=int, default=4)
    ap.add_argument('--from', dest='t0', type=float, default=0)
    ap.add_argument('--to', dest='t1', type=float, default=DUR)
    ap.add_argument('--mux', action='store_true', help='only rebuild the sound and re-mux the rendered picture')
    ap.add_argument('--frames', help='comma list of film seconds: write PNGs (frame and frame-difference) and exit')
    a = ap.parse_args()
    os.makedirs(OUT, exist_ok=True)
    if a.frames:
        for s in a.frames.split(','):
            f = int(float(s) * FPS)
            x0, x1 = render(f), render(f + 1)
            Image.fromarray(x1).resize((540, 960)).save(f'{OUT}/frame-{s}.png')
            d = np.abs(x1.astype(int) - x0.astype(int)).max(-1)
            Image.fromarray(np.clip(d * 2, 0, 255).astype(np.uint8)).resize((540, 960)).save(f'{OUT}/diff-{s}.png')
        return
    f0, f1 = int(a.t0 * FPS), min(NF, int(a.t1 * FPS))
    if a.mux:
        return mux()
    from multiprocessing import Process
    cuts = np.linspace(f0, f1, a.workers + 1).astype(int)
    parts = [f'{OUT}/part{i}.mp4' for i in range(a.workers)]
    ps = [Process(target=worker, args=(cuts[i], cuts[i + 1], parts[i])) for i in range(a.workers)]
    [p.start() for p in ps]; [p.join() for p in ps]
    with open(f'{OUT}/parts.txt', 'w') as fh:
        fh.writelines(f"file '{p}'\n" for p in parts)
    silent = f'{OUT}/perfect-absence-silent.mp4'
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', f'{OUT}/parts.txt', '-c', 'copy',
                    silent], check=True)
    if f0 == 0 and f1 == NF:
        mux()
    print('done', f0, f1)


def mux():
    silent = f'{OUT}/perfect-absence-silent.mp4'
    wav = f'{OUT}/perfect-absence.wav'
    audio(wav)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', silent, '-i', wav, '-c:v', 'copy', '-c:a', 'aac',
                    '-b:a', '256k', '-shortest', f'{OUT}/perfect-absence.mp4'], check=True)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', silent, '-i', wav, '-c:v', 'libx264', '-b:v', '4500k',
                    '-maxrate', '6M', '-bufsize', '9M', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k',
                    '-shortest', '-movflags', '+faststart', f'{OUT}/perfect-absence-share.mp4'], check=True)


if __name__ == '__main__':
    main()
