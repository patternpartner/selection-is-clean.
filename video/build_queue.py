"""'Next' - a silent comedy about a queue, drawn in code and shot from straight above. ~36 s, 720x1280, a crowd of 54.
python3 video/build_queue.py [OUT_DIR]     STILLS=2,9.5 -> PNGs     SHEET=a,b,step -> contact sheet     AUDIO_ONLY=1 -> just the sound
THE JOKE: a red-coated man joins the back of a very long queue that spirals in to a little pod at the middle. He asks the person in front what it is for;
the question goes up the line as a ripple of turning heads and the answer comes back down it as a ripple of shrugs: nobody knows. The day passes
(the shadows swing all the way round the sun, it rains and the umbrellas open in a wave, it gets dark) while the whole line shuffles in like a conveyor.
He reaches the pod, goes in, comes out of a glass tunnel that runs back to the START of the line, and he is at the back of the queue again.
Seen from above it is a ring of people. A child comes and asks him what it is for.
THE CROWD IS ONE CHAIN: 54 slots round a closed loop (the spiral, the pod, the tunnel); each event moves everybody on one slot, a ripple that starts at
the front and runs backwards down the line. Sun, rain, night and the sound are all functions of time and of those events."""
import math, os, sys, subprocess, random
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import door_draw
from door_draw import *

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
OUT = sys.argv[1] if len(sys.argv) > 1 else 'out/queue'
os.makedirs(OUT, exist_ok=True)
FPS, SC, SBG, WH = 30, 2, 3, 1280
T0, SCENE = 1.4, 37.4
TOTAL = SCENE + T0
CX, CY = 360.0, 640.0
R0, R1, TURNS = 330.0, 100.0, 2.5
N = 54

def ss(t): t = min(1.0, max(0.0, t)); return t * t * (3 - 2 * t)
def lerp(a, b, u): return a + (b - a) * u
def facing(x0, y0, x1, y1): return math.atan2(x1 - x0, -(y1 - y0))

# ================================================================ the loop: spiral in, straight through the pod, out along the glass tunnel to the start
def build_ring():
    th0 = -math.pi / 2; th1 = th0 + TURNS * 2 * math.pi; n = 3600
    pts = []
    for i in range(n + 1):
        th = th0 + (th1 - th0) * i / n; r = R0 + (R1 - R0) * i / n
        pts.append((CX + r * math.cos(th), CY + r * math.sin(th)))
    ex, ey = pts[-1]
    m = 214
    for i in range(1, m + 1): pts.append((ex, ey + (310.0 - ey) * i / m))             # up through the pod and the tunnel to (360, 310): the start again
    P = np.array(pts); d = np.hypot(*np.diff(P, axis=0).T); U = np.concatenate([[0.0], np.cumsum(d)])
    # a finer, evenly spaced table
    L = float(U[-1]); us = np.arange(0.0, L, 2.0); xs = np.interp(us, U, P[:, 0]); ys = np.interp(us, U, P[:, 1])
    return us, xs, ys, L, float(U[3600])
RU, RX, RY, RL, L_SPIRAL = build_ring()
SP = RL / N
def ring_xy(u):
    u = u % RL; return float(np.interp(u, RU, RX, period=RL)), float(np.interp(u, RU, RY, period=RL))
def ring_head(u):
    x0, y0 = ring_xy(u - 20.0); x1, y1 = ring_xy(u + 20.0); return facing(x0, y0, x1, y1)

# ================================================================ events: the whole line shuffles on one slot, as a ripple that starts at the front
T_JOIN = 5.0
M = N                                          # one full lap for the man who joins at the back
T_A, T_B = 6.6, 27.0
def inv_ss(y):
    lo, hi = 0.0, 1.0
    for _ in range(40):
        mid = (lo + hi) / 2
        if mid * mid * (3 - 2 * mid) < y: lo = mid
        else: hi = mid
    return (lo + hi) / 2
EVENTS = [T_A + (T_B - T_A) * inv_ss((m - 0.5) / M) for m in range(1, M + 1)]
FRONT_SLOT = L_SPIRAL / SP
DELAY = 0.04
STEP_D = 0.5

def person_u(i0, tarr):
    """ring coordinate of the person who starts in slot i0, as a function of time (vectorised over tarr)"""
    steps = np.zeros_like(tarr)
    for m, Em in enumerate(EVENTS):
        slot = (i0 + m) % N
        dist = max(0.0, FRONT_SLOT - slot) if slot < FRONT_SLOT else 0.0          # people behind the front step later; those in the pod and tunnel go first
        t0 = Em + DELAY * dist
        x = np.clip((tarr - t0) / STEP_D, 0.0, 1.0); steps += x * x * (3 - 2 * x)
    return (i0 + steps) * SP

# ================================================================ the cast
rng = random.Random(21)
def rand_pal():
    coat = rng.choice([(44, 62, 102), (70, 130, 96), (214, 170, 60), (120, 80, 140), (60, 60, 70), (230, 230, 226), (180, 110, 70), (90, 150, 190), (150, 40, 70), (40, 100, 80), (240, 150, 90)])
    hat = rng.choice([(224, 168, 46), (60, 56, 70), (200, 60, 60), (70, 110, 190), (30, 30, 36), (90, 60, 40), (210, 210, 210), (60, 150, 90)])
    skin = rng.choice([(236, 190, 156), (222, 172, 138), (190, 140, 108), (150, 100, 76), (110, 76, 56)])
    bare = rng.random() < 0.35
    if bare: hat = rng.choice([(40, 30, 28), (90, 60, 40), (190, 150, 90), (30, 30, 30), (210, 190, 160), (150, 150, 150), (130, 50, 30)])
    return dict(coat=coat, coat2=tuple(int(c * 0.72) for c in coat), hat=hat, hat2=tuple(int(c * 0.82) for c in hat), brim=(not bare) and rng.random() < 0.3, pom=(not bare) and rng.random() < 0.25, bare=bare,
                skin=skin, shoe=(rng.choice([(36, 36, 44), (60, 40, 30), (220, 220, 220), (180, 50, 50)])), pants=(54, 54, 66))
PEOPLE_Q = []
for p in range(N - 1):
    i0 = p + 1                                   # slot 0 is the gap at the start of the line, where the red man will stand
    pal = rand_pal(); who = 'x'
    if i0 == 44: pal = dict(PEOPLE['holder']); who = 'navy'
    PEOPLE_Q.append(dict(i0=i0, pal=pal, who=who, sc=rng.uniform(0.92, 1.06), prop=rng.choice(['phone', 'coffee', 'bag', None, None]),
                         umb=[(214, 60, 70), (60, 110, 200), (240, 190, 60), (60, 160, 120), (230, 230, 230), (150, 70, 160)][rng.randrange(6)], rank=i0))
RED = dict(i0=0, pal=dict(PEOPLE['walker']), who='red', sc=1.0, prop=None, umb=(214, 60, 70), rank=0)
ALL = [RED] + PEOPLE_Q
TS60 = np.arange(0, (SCENE + 1.0) * 60.0 + 1) / 60.0
for P_ in ALL:
    P_['u'] = person_u(P_['i0'], TS60)
    sp = np.abs(np.diff(P_['u'], prepend=P_['u'][0])) * 60.0
    P_['speed'] = sp; P_['phase'] = np.cumsum(sp / 60.0 / 70.0 * 2 * math.pi)
    g = random.Random(100 + P_['i0']); P_['gest'] = []
    for _ in range(g.randrange(3, 6)):
        P_['gest'].append((g.uniform(1.0, SCENE - 3.0), g.uniform(0.9, 1.8), g.choice(['phone', 'stretch', 'look', 'sway', 'check', 'wave']), g.choice([-1, 1])))

# ================================================================ the sky: the sun goes round, it rains, it gets dark
def tod(t): return ss((t - 4.0) / 26.0)
def sun_vec(t):
    d = tod(t); psi = math.radians(lerp(-90.0, 90.0, d)); ln = 12.0 + 30.0 * abs(math.sin(psi)) ** 1.6
    return (ln * math.sin(psi), -ln * math.cos(psi), ln)
def night(t): return ss((t - 27.5) / 5.0)
RAIN = (16.0, 20.6)
def umb_amount(rank, t):
    o = RAIN[0] + 0.045 * rank; c = RAIN[1] + 0.045 * rank
    return ss((t - o) / 0.3) * (1 - ss((t - c) / 0.3))

# ================================================================ the questions and the shrugs: two ripples, one up the line and one back down it
Q_T0, Q_DT = 6.4, 0.06
A_T0 = Q_T0 + 0.06 * N + 0.5
def ripple_pose(P_, t, pos):
    """the head turn of the question (rises up the line) and the shrug of the answer (comes back down it)"""
    i = P_['i0']; out = {}
    qt = Q_T0 + Q_DT * i
    if qt <= t < qt + 0.7:
        u = ss((t - qt) / 0.2) * (1 - ss((t - qt - 0.4) / 0.28)); out['head_yaw'] = 2.2 * u; out['turn'] = u
    at_ = A_T0 + Q_DT * (N - 1 - i)
    if at_ <= t < at_ + 0.8:
        u = math.sin(math.pi * (t - at_) / 0.8); out['shrug'] = u
    return out

# ================================================================ the world
def build_bg():
    rng_ = np.random.default_rng(4)
    Wb, Hb = 720 * SBG, WH * SBG
    im = Image.new('RGB', (Wb, Hb), (96, 134, 88)); d = ImageDraw.Draw(im, 'RGBA'); S = lambda *a: [v * SBG for v in a]
    for _ in range(120):
        x, y, r = rng_.uniform(0, 720), rng_.uniform(0, 1280), rng_.uniform(10, 40); d.ellipse(S(x - r, y - r, x + r, y + r), fill=(80 + int(rng_.integers(-8, 8)), 120, 76, 40))
    # the plaza: a big round paved floor
    d.ellipse(S(CX - 372, CY - 372, CX + 372, CY + 372), fill=(222, 214, 199), outline=(160, 150, 134), width=SBG * 6)
    T = 60
    for gx in range(-8, 14):
        d.line(S(gx * T, 0, gx * T, 1280), fill=(205, 197, 181, 150), width=SBG * 2)
        d.line(S(0, gx * T, 720, gx * T), fill=(205, 197, 181, 150), width=SBG * 2)
    mask = Image.new('L', (Wb, Hb), 0); md = ImageDraw.Draw(mask); md.ellipse(S(CX - 372, CY - 372, CX + 372, CY + 372), fill=255)
    base = Image.new('RGB', (Wb, Hb), (96, 134, 88)); base.paste(im, (0, 0)); im2 = Image.composite(im, base, mask)
    # repaint the lawn outside the circle so the grid does not run over it
    lawn = Image.new('RGB', (Wb, Hb), (96, 134, 88)); lw = ImageDraw.Draw(lawn, 'RGBA')
    for _ in range(120):
        x, y, r = rng_.uniform(0, 720), rng_.uniform(0, 1280), rng_.uniform(10, 40); lw.ellipse(S(x - r, y - r, x + r, y + r), fill=(80 + int(rng_.integers(-8, 8)), 120, 76, 40))
    im = Image.composite(im, lawn, mask); d = ImageDraw.Draw(im, 'RGBA')
    d.ellipse(S(CX - 372, CY - 372, CX + 372, CY + 372), outline=(160, 150, 134), width=SBG * 6)
    # the spiral's ropes and posts: between the turns, and outside the first turn
    posts = []
    def spiral_pt(th, r): return CX + r * math.cos(th), CY + r * math.sin(th)
    th0 = -math.pi / 2; dth = TURNS * 2 * math.pi
    for off in (-(R0 - R1) / TURNS / 2.0, (R0 - R1) / TURNS / 2.0):
        pr = []
        for i in range(0, 3601):
            th = th0 + dth * i / 3600; r = R0 + (R1 - R0) * i / 3600 + off
            if off > 0 and th > th0 + 2 * math.pi: continue                       # the outer rope only guards the first turn
            if off < 0 and r < 56: continue
            pr.append(spiral_pt(th, r))
        pr = np.array(pr); dd = np.hypot(*np.diff(pr, axis=0).T); UU = np.concatenate([[0.0], np.cumsum(dd)]); k = 0.0; line = []
        for s_ in np.arange(0, UU[-1], 58.0):
            line.append((float(np.interp(s_, UU, pr[:, 0])), float(np.interp(s_, UU, pr[:, 1]))))
        for a, b in zip(line, line[1:]): d.line(S(a[0], a[1], b[0], b[1]), fill=(176, 36, 52, 255), width=SBG * 4)
        posts += line
    for (x, y) in posts:
        d.ellipse(S(x - 4.5, y - 4.5, x + 4.5, y + 4.5), fill=(214, 214, 222), outline=(70, 70, 82), width=SBG * 2)
    # the pod: a round room with a door to the south (in) and the tunnel to the north (out)
    d.ellipse(S(CX - 80, CY - 80, CX + 80, CY + 80), fill=(44, 44, 54))
    d.ellipse(S(CX - 70, CY - 70, CX + 70, CY + 70), fill=(190, 142, 94))
    for xx in range(-70, 71, 18): d.line(S(CX + xx, CY - 66, CX + xx, CY + 66), fill=(176, 130, 84, 120), width=SBG * 2)
    d.pieslice(S(CX - 52, CY - 52, CX + 52, CY + 52), 200, 340, fill=(86, 62, 48), outline=(40, 30, 26), width=SBG * 2)
    d.rectangle(S(CX - 22, CY + 70, CX + 22, CY + 82), fill=(190, 142, 94)); d.rectangle(S(CX - 22, CY - 82, CX + 22, CY - 68), fill=(190, 142, 94))
    f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf', 17 * SBG)
    d.text(S(CX, CY + 40), 'NEXT', font=f, fill=(250, 214, 80), anchor='mm')
    # the glass tunnel from the pod's north door back out to the start of the line
    d.rectangle(S(CX - 27, 306, CX + 27, CY - 76), fill=(206, 222, 230, 255))
    for yy in range(310, int(CY - 76), 24): d.line(S(CX - 27, yy, CX + 27, yy), fill=(190, 206, 216), width=SBG * 2)
    d.line(S(CX - 27, 306, CX - 27, CY - 76), fill=(70, 80, 96), width=SBG * 4); d.line(S(CX + 27, 306, CX + 27, CY - 76), fill=(70, 80, 96), width=SBG * 4)
    d.rectangle(S(CX - 27, 300, CX + 27, 308), fill=(70, 80, 96))
    # lamps
    for (x, y) in ((70, 80), (650, 80), (70, 1200), (650, 1200)):
        d.ellipse(S(x - 12, y - 12, x + 12, y + 12), fill=(60, 62, 74), outline=(30, 30, 38), width=SBG * 2); d.ellipse(S(x - 6, y - 6, x + 6, y + 6), fill=(236, 226, 170))
    arr = np.asarray(im).astype(np.int16); arr += rng_.integers(-3, 4, size=arr.shape[:2] + (1,)).astype(np.int16)
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
_BG = None
def bg():
    global _BG
    if _BG is None: _BG = build_bg()
    return _BG
LAMPS = [(70, 80), (650, 80), (70, 1200), (650, 1200)]
_GLOW = None
def glow():
    global _GLOW
    if _GLOW is None:
        g = Image.new('RGBA', (256, 256), (0, 0, 0, 0)); a = np.zeros((256, 256, 4), np.uint8); yy, xx = np.mgrid[0:256, 0:256]; r = np.hypot(xx - 128, yy - 128) / 128.0
        a[..., 0] = 255; a[..., 1] = 214; a[..., 2] = 150; a[..., 3] = (np.clip(1 - r, 0, 1) ** 2 * 200).astype(np.uint8); _GLOW = Image.fromarray(a)
    return _GLOW

# ================================================================ Red's story: arrives, asks, shrugs, loops; the child's
RED_IN = [(0.0, -80.0, 150.0), (T_JOIN, 360.0, 310.0)]
def red_pre(t):
    u = ss(t / T_JOIN) if False else min(1.0, t / T_JOIN); x = lerp(RED_IN[0][1], RED_IN[1][1], u); y = lerp(RED_IN[0][2], RED_IN[1][2], u) + 0 * u
    x2 = lerp(RED_IN[0][1], RED_IN[1][1], min(1.0, (t + 0.05) / T_JOIN)); y2 = lerp(RED_IN[0][2], RED_IN[1][2], min(1.0, (t + 0.05) / T_JOIN))
    return x, y, facing(x, y, x2, y2)
T_LOOP = EVENTS[-1] + STEP_D + 0.2
KID_T0, KID_T1 = T_LOOP + 5.6, T_LOOP + 8.2

def at60(arr, t): x = min(len(arr) - 2, max(0.0, t * 60.0)); i = int(x); return arr[i] + (arr[i + 1] - arr[i]) * (x - i)
def person_pose(P_, t):
    Q = dict(x=0.0, y=0.0, th=0.0, speed=0.0, phase=0.0, head_yaw=0.0, lean=0.0, armL=None, armR=None, propL=None, propR=P_['prop'], slump=0.0, sc=P_['sc'], pal=P_['pal'], vis=True)
    if P_['who'] == 'navy': Q['propR'] = None; Q['propL'] = 'coffee'
    if P_['who'] == 'red' and t < T_JOIN:
        Q['x'], Q['y'], Q['th'] = red_pre(t); Q['speed'] = 80.0; Q['phase'] = t * 80.0 / 70.0 * 2 * math.pi
        Q['armR'] = (14, 22); Q['propR'] = 'phone'
        if t > T_JOIN - 1.0: Q['head_yaw'] = 0.6 * math.sin((t - (T_JOIN - 1.0)) * 4.0)       # he looks down the line; it goes on a long way
        return Q
    u = at60(P_['u'], t); Q['x'], Q['y'] = ring_xy(u); Q['th'] = ring_head(u)
    Q['speed'] = at60(P_['speed'], t); Q['phase'] = at60(P_['phase'], t)
    # idle gestures
    for (g0, gd, kind, sd) in P_['gest']:
        if g0 <= t < g0 + gd:
            v = math.sin(math.pi * (t - g0) / gd)
            if kind == 'phone': Q['armR'] = (12, 12 + 14 * v); Q['propR'] = 'phone'
            elif kind == 'stretch': Q['armL'] = (-30, 14 + 28 * v); Q['armR'] = (30, 14 + 28 * v); Q['lean'] = 2.5 * v
            elif kind == 'look': Q['head_yaw'] = 0.9 * sd * v
            elif kind == 'sway': Q['lean'] = 3.0 * v * sd
            elif kind == 'check': Q['armR'] = (8, 12 + 6 * v); Q['propR'] = 'watch'
            elif kind == 'wave': Q['armR'] = (30, 20 + 24 * v + 3 * math.sin(t * 14)); Q['propR'] = None
    # the ripples: question (heads turn back, wave runs up the line) and answer (shrugs run back down it)
    R_ = ripple_pose(P_, t, 0)
    if 'head_yaw' in R_: Q['head_yaw'] = R_['head_yaw'] * 0.45; Q['th'] += 1.35 * R_['turn']; Q['glow'] = ('q', R_['turn'])
    if 'shrug' in R_:
        s = R_['shrug']; Q['glow'] = ('a', s); Q['armL'] = (-36, 10 + 8 * s); Q['armR'] = (36, 10 + 8 * s); Q['slump'] = 0.5 * s; Q['head_yaw'] = 0.5 * math.sin(t * 9.0) * s; Q['propR'] = None; Q['propL'] = None
    if P_['who'] == 'red':
        # red asks, then shrugs when the answer gets back to him; again at the end
        if T_JOIN < t < T_JOIN + 1.0: Q['head_yaw'] = 0.7 * math.sin((t - T_JOIN) * 5.0) * (1 - (t - T_JOIN))
        if Q_T0 - 0.2 < t < Q_T0 + 0.5: Q['armR'] = (10, 14 + 22 * ss((t - (Q_T0 - 0.2)) / 0.2) * (1 - ss((t - Q_T0 - 0.15) / 0.3))); Q['propR'] = None
        ta = A_T0 + Q_DT * (N - 1) + 0.1
        if ta <= t < ta + 1.2:
            s = math.sin(math.pi * (t - ta) / 1.2); Q['armL'] = (-36, 10 + 8 * s); Q['armR'] = (36, 10 + 8 * s); Q['slump'] = 0.5 * s; Q['head_yaw'] = 0.5 * math.sin(t * 9.0) * s; Q['propR'] = None
        if t > T_LOOP:
            # the end: the child asks, he shrugs
            ts = KID_T0 + 1.0
            if ts <= t < ts + 1.4:
                s = math.sin(math.pi * (t - ts) / 1.4); Q['armL'] = (-36, 10 + 8 * s); Q['armR'] = (36, 10 + 8 * s); Q['slump'] = 0.5 * s; Q['head_yaw'] = 0.5 * math.sin(t * 9.0) * s
            if KID_T0 - 0.2 <= t < KID_T0 + 1.0: Q['head_yaw'] = 1.2 * ss((t - (KID_T0 - 0.2)) / 0.25)
    return Q

def kid_pose(t):
    Q = dict(x=0.0, y=0.0, th=0.0, speed=0.0, phase=0.0, head_yaw=0.0, lean=0.0, armL=None, armR=None, propL=None, propR='icecream', slump=0.0, sc=0.66, pal=dict(PEOPLE['kid']), vis=True)
    if t < KID_T0 - 3.2: Q['vis'] = False; return Q
    rx, ry = ring_xy(0.0)
    if t < KID_T0:
        u = (t - (KID_T0 - 3.2)) / 3.2; x0, y0 = 90.0, 260.0; tx, ty = rx + 46.0, ry - 30.0
        Q['x'], Q['y'] = lerp(x0, tx, ss(u)), lerp(y0, ty, ss(u)); Q['th'] = facing(x0, y0, tx, ty); Q['speed'] = 80.0 * (1 - ss((u - 0.8) / 0.2)); Q['phase'] = t * 80.0 / 70.0 * 2 * math.pi; return Q
    Q['x'], Q['y'] = rx + 46.0, ry - 30.0; Q['th'] = math.radians(-60.0)
    s = t - KID_T0
    if 1.0 <= s < 2.4: Q['armR'] = (10, 14 + 24 * math.sin(math.pi * (s - 1.0) / 1.4)); Q['propR'] = None
    if 2.8 <= s < 4.2:
        v = math.sin(math.pi * (s - 2.8) / 1.4); Q['armL'] = (-36, 10 + 8 * v); Q['armR'] = (36, 10 + 8 * v); Q['slump'] = 0.5 * v; Q['propR'] = None
    return Q

# ================================================================ camera
def camera(t):
    if t < 2.0: z, cx, cy = 1.0, 360.0, 640.0
    elif t < T_JOIN + 0.4:
        u = ss((t - 2.0) / (T_JOIN + 0.4 - 2.0)); z, cx, cy = lerp(1.0, 1.9, u), lerp(360.0, 330.0, u), lerp(640.0, 330.0, u)
    elif t < 8.0:
        u = ss((t - (T_JOIN + 0.4)) / (8.0 - T_JOIN - 0.4)); z, cx, cy = lerp(1.9, 1.0, u), lerp(330.0, 360.0, u), lerp(330.0, 640.0, u)
    elif t < T_B - 3.2: z, cx, cy = 1.0, 360.0, 640.0
    elif t < T_B - 0.4:
        u = ss((t - (T_B - 3.2)) / 2.8); z, cx, cy = lerp(1.0, 2.1, u), 360.0, lerp(640.0, 560.0, u)
    elif t < T_LOOP - 0.3: z, cx, cy = 2.1, 360.0, 540.0
    elif t < T_LOOP + 3.0:
        u = ss((t - (T_LOOP - 0.3)) / 3.3); z, cx, cy = lerp(2.1, 1.0, u), 360.0, lerp(540.0, 640.0, u)
    elif t < T_LOOP + 5.6 - 1.2: z, cx, cy = 1.0, 360.0, 640.0
    else:
        u = ss((t - (T_LOOP + 5.6 - 1.2)) / 1.2); z, cx, cy = lerp(1.0, 1.9, u), lerp(360.0, 350.0, u), lerp(640.0, 330.0, u)
    vw, vh = 720 / z, 1280 / z
    return z, min(max(cx, vw / 2), 720 - vw / 2), min(max(cy, vh / 2), WH - vh / 2)

# ================================================================ frame
FT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf', 78)
def render(tt):
    t = max(0.0, tt - T0); z, cx, cy = camera(t); k = z * SC; vw, vh = 720 / z, 1280 / z
    img = bg().resize((720 * SC, 1280 * SC), Image.BILINEAR, box=((cx - vw / 2) * SBG, (cy - vh / 2) * SBG, (cx + vw / 2) * SBG, (cy + vh / 2) * SBG))
    d = ImageDraw.Draw(img, 'RGBA')
    P = lambda x, y: ((x - cx) * z * SC + 360 * SC, (y - cy) * z * SC + 640 * SC)
    sun = sun_vec(t)
    acts = [(P_, person_pose(P_, t)) for P_ in ALL] + [(None, kid_pose(t))]
    acts = [(p_, Q) for p_, Q in acts if Q['vis']]
    acts.sort(key=lambda a: a[1]['y'])
    def reach(tg, side):
        if tg is None: return None
        vx, vy = tg[0] - side * 27.0, tg[1] - 2.0; L_ = math.hypot(vx, vy)
        return tg if L_ <= 46.0 else (side * 27.0 + vx / L_ * 46.0, 2.0 + vy / L_ * 46.0)
    for p_, Q in acts:                                      # the two ripples are lit as they pass: yellow up the line, a cool blue back down it
        g_ = Q.get('glow')
        if g_:
            sx, sy = P(Q['x'], Q['y']); r = 44.0 * k; col = (255, 226, 120) if g_[0] == 'q' else (130, 190, 255)
            d.ellipse([sx - r, sy - r, sx + r, sy + r], fill=col + (int(110 * g_[1]),))
    for p_, Q in acts:
        sx, sy = P(Q['x'], Q['y'])
        if -160 < sx < 1600 and -200 < sy < 2760:
            sp = Q['speed']; stride = min(18.0, sp * 0.1 + 2.0) if sp > 4 else 0.0
            person(d, 'x', sx, sy, Q['th'], k * Q['sc'], Q['phase'], stride, min(16.0, sp * 0.1), 0.0, Q['head_yaw'], Q['lean'], reach(Q['armL'], -1), reach(Q['armR'], 1), Q['propL'], Q['propR'], Q['slump'], pal=Q['pal'], sun=sun)
    # umbrellas, on top of everyone
    for p_, Q in acts:
        if p_ is None: continue
        a = umb_amount(p_['rank'], t)
        if a > 0.01:
            sx, sy = P(Q['x'], Q['y']); r = 38.0 * a * k; col = p_['umb']; col2 = tuple(int(c * 0.78) for c in col)
            d.ellipse([sx + 5 * k - r, sy - r, sx + 5 * k + r, sy + r], fill=(0, 0, 0, 40))
            for w in range(8):
                d.pieslice([sx - r, sy - r, sx + r, sy + r], w * 45, (w + 1) * 45, fill=col if w % 2 else col2)
            d.ellipse([sx - r, sy - r, sx + r, sy + r], outline=(30, 28, 36, 255), width=max(1, int(1.5 * k))); d.ellipse([sx - 3 * k, sy - 3 * k, sx + 3 * k, sy + 3 * k], fill=(40, 40, 48, 255))
    # a faint ring round the red man, so he can be followed in the crowd
    for p_, Q in acts:
        if p_ is not None and p_['who'] == 'red':
            sx, sy = P(Q['x'], Q['y']); pulse = 0.5 + 0.5 * math.sin(t * 5.0); r = (47.0 + 2.0 * pulse) * k
            d.ellipse([sx - r, sy - r, sx + r, sy + r], outline=(255, 236, 130, int(190 + 60 * pulse)), width=max(4, int(4.2 * k)))
    out = img.resize((720, 1280), Image.LANCZOS)
    # the sky's tint, the rain, the night and the lamps
    tv = tod(t); layer = Image.new('RGBA', (720, 1280), (0, 0, 0, 0)); ld = ImageDraw.Draw(layer, 'RGBA')
    if tv < 0.18: ld.rectangle([0, 0, 720, 1280], fill=(190, 210, 255, int(46 * (1 - tv / 0.18))))
    if 0.62 < tv < 1.0: ld.rectangle([0, 0, 720, 1280], fill=(255, 168, 80, int(52 * math.sin(math.pi * min(1.0, (tv - 0.62) / 0.38)))))
    if RAIN[0] - 0.5 < t < RAIN[1] + 1.5:
        wet = ss((t - RAIN[0]) / 1.0) * (1 - ss((t - RAIN[1] - 1.0) / 1.0)); ld.rectangle([0, 0, 720, 1280], fill=(40, 60, 100, int(70 * wet)))
        rr = random.Random(int(t * 30));
        for _ in range(int(260 * wet)):
            x, y = rr.uniform(0, 720), rr.uniform(0, 1280); ld.line([(x, y), (x - 6, y + 22)], fill=(220, 232, 255, 90), width=1)
    nt = night(t)
    if nt > 0: ld.rectangle([0, 0, 720, 1280], fill=(10, 18, 54, int(150 * nt)))
    out = Image.alpha_composite(out.convert('RGBA'), layer)
    if nt > 0.05:
        gl = glow(); add = Image.new('RGBA', (720, 1280), (0, 0, 0, 0))
        for (lx, ly) in LAMPS + [(CX, CY)]:
            sx, sy = (lx - cx) * z + 360, (ly - cy) * z + 640; rad = int(210 * z * (1.2 if (lx, ly) == (CX, CY) else 1.0)); g2 = gl.resize((rad * 2, rad * 2)); a_ = g2.split()[3].point(lambda v: int(v * nt)); g2.putalpha(a_)
            add.alpha_composite(g2, (int(sx - rad), int(sy - rad))) if (-rad < sx < 720 + rad and -rad < sy < 1280 + rad) else None
        out = Image.alpha_composite(out, add)
    out = out.convert('RGB'); d2 = ImageDraw.Draw(out, 'RGBA')
    # vignette, title and fades
    if tt < T0 + 0.8:
        a_ = ss(min(1, tt / 0.5)) * (1 - ss((tt - 0.9) / 0.5))
        d2.rectangle([0, 0, 720, 1280], fill=(10, 10, 14, int(255 * (1 - ss((tt - (T0 - 0.1)) / 0.9)))))
        if tt < 1.5: d2.text((360, 600), 'NEXT', font=FT, fill=(238, 232, 214, int(255 * a_)), anchor='mm')
    if tt > TOTAL - 1.0: d2.rectangle([0, 0, 720, 1280], fill=(10, 10, 14, int(255 * ss((tt - (TOTAL - 1.0)) / 1.0))))
    return out

# ================================================================ sound
SR = 44100
def build_audio():
    from scipy.io import wavfile
    from scipy.signal import butter, sosfilt
    n = int(SR * (TOTAL + 0.6)); L = np.zeros(n); R = np.zeros(n); rg = np.random.default_rng(13)
    def band(x, lo, hi, order=2): sos = butter(order, [lo, min(hi, SR / 2 - 100)], 'band', fs=SR, output='sos'); return sosfilt(sos, x)
    def lowp(x, f, order=2): return sosfilt(butter(order, f, 'low', fs=SR, output='sos'), x)
    def put(sig, t0, gain=1.0, pan=0.5):
        i = int(t0 * SR)
        if i >= n or i < 0: return
        j = min(n, i + len(sig)); seg = sig[:j - i] * gain
        L[i:j] += seg * math.cos(pan * math.pi / 2); R[i:j] += seg * math.sin(pan * math.pi / 2)
    noise = lambda dd: rg.standard_normal(int(dd * SR))
    def env(dd, a=0.002, tau=0.05): x = np.arange(int(dd * SR)) / SR; return np.minimum(1, x / a) * np.exp(-x / tau)
    def step_snd(): dd = 0.07; return band(noise(dd), 350, 2200) * env(dd, 0.001, 0.02) * 1.0
    def pluck(f, dur=0.8, tau=0.25, bright=0.5):
        x = np.arange(int(dur * SR)) / SR
        y = np.sin(2 * np.pi * f * x) + 0.45 * bright * np.sin(2 * np.pi * 2 * f * x) * np.exp(-x / (tau * .5)) + 0.2 * bright * np.sin(2 * np.pi * 3.01 * f * x) * np.exp(-x / (tau * .3))
        return y * np.exp(-x / tau) * np.minimum(1, x / 0.003)
    tt = np.arange(n) / SR
    # ---- footsteps: every gait contact, far ones softer; the queue shuffle is a rustle that thickens with the events
    cnt = 0
    for P_ in ALL:
        ph = P_['phase']; s = np.sin(ph); cross = np.where(s[:-1] * s[1:] < 0)[0]
        for i in cross:
            t = i / 60.0
            if P_['speed'][i] < 6: continue
            z, cx, cy = camera(t); x, y = ring_xy(P_['u'][i]); close = math.exp(-(math.hypot(x - cx, y - cy) / (360.0 / z)) ** 2 * 0.6)
            put(step_snd(), t + T0, (0.010 + 0.26 * close) * min(1.0, 0.4 + P_['speed'][i] / 150.0), min(0.9, max(0.1, x / 720.0))); cnt += 1
    # ---- the questions go up the scale, the answers come back down it
    scale = [293.66, 329.63, 369.99, 440.0, 493.88, 587.33, 659.25, 739.99, 880.0, 987.77, 1174.66]
    for i in range(1, N):
        qt = Q_T0 + Q_DT * i + T0; put(pluck(scale[(i * len(scale)) // N], 0.35, 0.09, 0.6), qt, 0.045, 0.3 + 0.4 * i / N)
        at_ = A_T0 + Q_DT * (N - 1 - i) + T0; put(band(noise(0.18), 300, 1800) * env(0.18, 0.01, 0.07) * 0.5 + pluck(scale[(i * len(scale)) // N] / 2, 0.18, 0.12, 0.3) * 0.7, at_, 0.045, 0.3 + 0.4 * i / N)
    put(pluck(220.0, 1.0, 0.4), A_T0 + Q_DT * (N - 1) + 0.1 + T0, 0.12, 0.5)
    # ---- the line moves: a marimba note on every shuffle, so the score is the queue's own rhythm and it speeds up and slows with it
    pat = [220.0, 261.63, 293.66, 329.63, 392.0, 329.63, 293.66, 261.63]
    for m, Em in enumerate(EVENTS):
        f = pat[m % 8] * (2.0 if (m // 8) % 3 == 2 else 1.0); put(pluck(f, 0.5, 0.14, 0.4), Em + T0, 0.10, 0.5)
        if m % 4 == 0: put(pluck(f / 2.0, 0.7, 0.2, 0.2), Em + T0, 0.10, 0.5)
    # ---- weather: birds in the morning, rain and a pop for every umbrella, crickets at night
    for q in range(26):
        t = 1.0 + q * 0.27 + rg.uniform(0, 0.2); f = rg.uniform(2400, 4200)
        if t < 11.0: put(np.sin(2 * np.pi * np.cumsum(np.linspace(f, f * 1.25, int(0.09 * SR))) / SR) * np.hanning(int(0.09 * SR)) * 0.07, t + T0, 1.0, rg.uniform(0.2, 0.8))
    rain = band(noise(TOTAL + 0.6), 2000, 7000) * 0.03
    renv = np.interp(tt, [0, RAIN[0] + T0 - 0.5, RAIN[0] + T0 + 1.2, RAIN[1] + T0 + 1.0, RAIN[1] + T0 + 3.0, 99], [0, 0, 1, 1, 0, 0]); rain = rain[:n] * renv; L += rain; R += rain
    for p_ in ALL[1:]:
        for sgn, t0 in ((1, RAIN[0] + 0.045 * p_['rank']), (-1, RAIN[1] + 0.045 * p_['rank'])):
            put((band(noise(0.08), 800, 4000) * env(0.08, 0.0008, 0.012) + np.sin(2 * np.pi * np.cumsum(np.linspace(260, 180, int(0.08 * SR))) / SR) * env(0.08, 0.002, 0.03) * 0.5) * (0.12 if sgn > 0 else 0.07), t0 + T0, 1.0, rg.uniform(0.2, 0.8))
    for q in range(60):
        t = T_B + 1.0 + q * 0.19 + rg.uniform(0, 0.1)
        if t < SCENE: x = np.arange(int(0.07 * SR)) / SR; put(np.sin(2 * np.pi * 4300 * x) * np.hanning(len(x)) * 0.012, t + T0, 1.0, rg.uniform(0.2, 0.8))
    # ---- the loop: a warm chord blooms as the camera rises; the child's question and the shrug use the same two notes as the first
    for f in (146.83, 220.0, 293.66, 369.99):
        d_ = 5.2; x = np.arange(int(d_ * SR)) / SR; put(np.sin(2 * np.pi * f * x) * np.minimum(1, x / 1.6) * np.minimum(1, (d_ - x) / 1.8) * 0.035, T_LOOP + T0 - 0.2, 1.0, 0.5)
    put(pluck(659.25, 0.5, 0.15), KID_T0 + 1.0 + T0, 0.07, 0.5); put(pluck(493.88, 0.7, 0.2), KID_T0 + 2.8 + T0, 0.06, 0.5); put(pluck(220.0, 1.3, 0.5), KID_T0 + 3.1 + T0, 0.10, 0.5)
    hush = (lowp(noise(TOTAL + 0.6), 400) * 0.022 + lowp(noise(TOTAL + 0.6), 90) * 0.020)[:n] * np.minimum(1, tt / 0.8); L += hush; R += hush
    fade = np.clip(tt / 0.4, 0, 1) * np.clip((TOTAL + 0.4 - tt) / 0.9, 0, 1); L *= fade; R *= fade
    pk = max(np.max(np.abs(L)), np.max(np.abs(R))); L, R = L / pk, R / pk
    L = np.tanh(L * 2.2) / np.tanh(2.2) * 0.30; R = np.tanh(R * 2.2) / np.tanh(2.2) * 0.30
    wavfile.write(OUT + '/queue.wav', SR, (np.stack([L, R], 1) * 32767).astype(np.int16)); print('audio done; steps', cnt)

if __name__ == '__main__':
    print('ring', round(RL, 1), 'spiral', round(L_SPIRAL, 1), 'SP', round(SP, 1), 'slots in the queue', round(FRONT_SLOT, 1), 'events', round(EVENTS[0], 2), '->', round(EVENTS[-1], 2), 'loop', round(T_LOOP, 2), 'kid', round(KID_T0, 2))
    if os.environ.get('STILLS'):
        for ts in [float(x) for x in os.environ['STILLS'].split(',')]: render(ts).save(f'{OUT}/still_{ts:05.2f}.png')
        print('stills done'); sys.exit()
    if os.environ.get('SHEET'):
        a, b, st = [float(x) for x in os.environ['SHEET'].split(',')]
        ts = list(np.arange(a, b, st)); w, h = 240, 427; cols = 8; rows = (len(ts) + cols - 1) // cols; Sh = Image.new('RGB', (cols * w, rows * h))
        for i, tt in enumerate(ts):
            Sh.paste(render(tt).resize((w, h)), ((i % cols) * w, (i // cols) * h)); ImageDraw.Draw(Sh).text(((i % cols) * w + 6, (i // cols) * h + 6), f't={tt:.1f}', fill=(255, 255, 0))
        Sh.save(f'{OUT}/sheet_{a:.0f}_{b:.0f}.png'); print('sheet done'); sys.exit()
    if os.environ.get('AUDIO_ONLY'): build_audio(); sys.exit()
    frames = int(TOTAL * FPS)
    p = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', '720x1280', '-r', str(FPS), '-i', '-',
                          '-vf', 'noise=alls=3:allf=t+u', '-c:v', 'libx264', '-crf', '17', '-pix_fmt', 'yuv420p', OUT + '/queue-silent.mp4'], stdin=subprocess.PIPE)
    for i in range(frames):
        p.stdin.write(render(i / FPS).tobytes())
        if i % 150 == 0: print('frame', i, '/', frames, flush=True)
    p.stdin.close(); p.wait(); print('picture done')
    build_audio()
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', OUT + '/queue-silent.mp4', '-i', OUT + '/queue.wav', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', OUT + '/next.mp4'], check=True)
    print('done', OUT + '/next.mp4')
