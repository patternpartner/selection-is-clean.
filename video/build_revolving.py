"""'After You' - a silent comedy about a revolving door, drawn in code and shot from straight above. ~36 s, 720x1280.
python3 video/build_revolving.py [OUT_DIR]     STILLS=2,9.5 -> PNGs     SHEET=a,b,step -> contact sheet     AUDIO_ONLY=1 -> just the sound
Sequel to Hold the Door (same two men). THE JOKE: they reach a revolving door together, each insists the other goes first, and then both
step into the SAME compartment, and neither will get out first. The door speeds up as they argue. One finally steps out; the other whizzes
past the exit; the first, by reflex, HOLDS THE DOOR, which in a revolving door means stopping it, and the second is flung into the leaf.
A child walks through without noticing any of it.
THE SOUND IS THE MACHINE: the score is a waltz whose beat is the door's own angle (30 degrees a beat, 90 a bar, one bar per leaf), so it
speeds up as the door does and stops dead when the door is stopped. Footsteps and thuds come from the animation's own events.
Angles: degrees, clockwise on screen, 0 = east, 90 = south (into the building), 270 = north (the plaza)."""
import math, os, sys, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from door_draw import *

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
OUT = sys.argv[1] if len(sys.argv) > 1 else 'out/revolving'
os.makedirs(OUT, exist_ok=True)
FPS, SC, SBG, WH = 30, 2, 3, 1500
T0, SCENE = 1.4, 35.0
TOTAL = SCENE + T0
CX, CY, RD = 360.0, 700.0, 165.0
HZ = 240

def ss(t): t = min(1.0, max(0.0, t)); return t * t * (3 - 2 * t)
def lerp(a, b, u): return a + (b - a) * u
def aang(a, b, u):
    d = (b - a + math.pi) % (2 * math.pi) - math.pi; return a + d * u
def kf(t, pts, ease=True):
    if t <= pts[0][0]: return pts[0][1]
    if t >= pts[-1][0]: return pts[-1][1]
    for (t0, a), (t1, b) in zip(pts, pts[1:]):
        if t0 <= t <= t1:
            u = (t - t0) / (t1 - t0); u = ss(u) if ease else u
            return a + (b - a) * u
def pol(r, deg): a = math.radians(deg); return CX + r * math.cos(a), CY + r * math.sin(a)
def facing(x0, y0, x1, y1): return math.atan2(x1 - x0, -(y1 - y0))          # 0 faces up the frame
def wlocal(px, py, x, y, th):
    dx, dy = px - x, py - y; fx, fy = math.sin(th), -math.cos(th); rx, ry = math.cos(th), math.sin(th)
    return (dx * rx + dy * ry, dx * fx + dy * fy)
def shortest(a, b): return (b - a + 180.0) % 360.0 - 180.0
def look_yaw(P, tx, ty):
    d_ = math.atan2(tx - P['x'], -(ty - P['y'])) - P['th']; d_ = (d_ + math.pi) % (2 * math.pi) - math.pi
    return max(-1.5, min(1.5, d_))

# ================================================================ the door's angle, built from a velocity profile
T_ENTER = 7.9                         # the two men step into a compartment
OMEGA = [(0, 22.0), (T_ENTER - 0.2, 22.0), (T_ENTER + 1.6, 64.0), (12.2, 100.0), (14.6, 152.0), (17.0, 215.0), (19.0, 255.0)]
OM2 = lambda t, t_rel: kf(t, [(t_rel, 0.0), (t_rel + 0.9, 38.0), (t_rel + 3.0, 46.0), (t_rel + 5.2, 72.0), (t_rel + 9.0, 60.0), (SCENE + 3, 24.0)])
def build():
    ts = np.arange(0, SCENE + 1.0, 1 / HZ)
    al = np.cumsum([kf(t, OMEGA) if t < 19.0 else 255.0 for t in ts]) / HZ
    i = int(T_ENTER * HZ); al = al + ((45.0 - al[i]) % 90.0)       # a compartment is centred on the north when the men step in
    a_en = al[i]
    cen = lambda k: 270.0 + (al[k] - a_en)                        # centre angle of THEIR compartment (increases clockwise)
    # N leaves when it is at the south (centre = 90 mod 360), after the door is at full speed
    k_exit = next(k for k in range(int(19.6 * HZ), len(ts) - 2) if abs(shortest(cen(k), 90.0)) < 1.0 and cen(k + 1) > cen(k))
    # the stop: the next time its centre is at 45 (the leading leaf is at the south axis), a lap later minus 45 degrees
    k_stop = next(k for k in range(k_exit + int(0.9 * HZ), len(ts) - 2) if abs(shortest(cen(k), 45.0)) < 1.0 and cen(k + 1) > cen(k))
    t_stop = k_stop / HZ; t_rel = t_stop + 1.9
    out = al.copy(); a_s = al[k_stop]
    for k in range(k_stop, len(ts)):
        t = ts[k]
        if t < t_rel:
            out[k] = a_s + (2.6 * math.exp(-(t - t_stop) / 0.09) * math.sin((t - t_stop) * 2 * math.pi * 7.0) if t > t_stop else 0.0)
    cum = a_s
    for k in range(int(t_rel * HZ), len(ts)):
        cum += OM2(ts[k], t_rel) / HZ; out[k] = cum
    return out, a_en, k_exit / HZ, t_stop, t_rel
ALPHA, A_EN, T_EXIT_N, T_STOP, T_REL = build()
def at(arr, t): return arr[min(len(arr) - 1, max(0, int(t * HZ)))]
def alpha(t): return at(ALPHA, t)
def omega(t): return (alpha(t + 1 / 60.0) - alpha(t - 1 / 60.0)) * 30.0
def cen_men(t): return 270.0 + (alpha(t) - A_EN)
def find_cross(lo, hi, target_mod=45.0):
    """first time in [lo,hi] when alpha crosses `target_mod` (mod 90): a compartment is centred on the north"""
    for k in range(int(lo * HZ), int(hi * HZ)):
        a, b = ALPHA[k] % 90.0, ALPHA[k + 1] % 90.0
        if a < target_mod <= b and ALPHA[k + 1] > ALPHA[k]: return k / HZ
    return (lo + hi) / 2
T_KID_IN = find_cross(T_REL + 2.9, T_REL + 5.0)
def cen_kid(t): return 270.0 + (alpha(t) - alpha(T_KID_IN))
def kid_exit_time():
    for k in range(int(T_KID_IN * HZ), len(ALPHA) - 1):
        if cen_kid(k / HZ) >= 450.0 - 4.0: return k / HZ
    return T_KID_IN + 3.5
T_KID_OUT = kid_exit_time()
T_R_OUT = T_REL + 0.45                # R, free of the leaf, walks out of the drum

# ================================================================ the people
def man_out(who, t):
    """walking up to the door from the upper corners"""
    k = [(0, 650, 120), (4.2, 398, 424)] if who == 'N' else [(0, 60, 260), (4.2, 322, 424)]
    xs = np.interp(t, [k[0][0], k[1][0]], [k[0][1], k[1][1]])
    ys = np.interp(t, [k[0][0], k[1][0]], [k[0][2], k[1][2]])
    x2 = np.interp(t + 0.05, [k[0][0], k[1][0]], [k[0][1], k[1][1]]); y2 = np.interp(t + 0.05, [k[0][0], k[1][0]], [k[0][2], k[1][2]])
    return float(xs), float(ys), facing(xs, ys, x2, y2)

def pose(who, t):
    kind = {'N': 'holder', 'R': 'walker', 'K': 'kid'}[who]
    P = dict(kind=kind, x=0.0, y=0.0, th=0.0, speed=0.0, bob=0.0, head_yaw=0.0, lean=0.0, armL=None, armR=None,
             propL='coffee' if who == 'N' else None, propR='phone' if who == 'R' else ('icecream' if who == 'K' else None), slump=0.0, sc=0.66 if who == 'K' else 1.0, vis=True)
    if who == 'K': return kid_pose(P, t)
    # ---- 1. walking up: R on his phone, looks up late
    if t < 4.2:
        P['x'], P['y'], P['th'] = man_out(who, t); P['speed'] = 80.0 if t < 3.9 else 25.0
        if who == 'R': P['armR'] = (14, 22); P['head_yaw'] = 0.5 * ss((t - 3.9) / 0.25)
        return P
    # ---- 2. the after-you dance in front of the door
    if t < T_ENTER:
        u = t - 4.2; mx, my = (395.0, 428.0) if who == 'N' else (325.0, 428.0)
        rounds = [(0.15, 'R'), (1.05, 'N'), (1.95, 'R'), (2.65, 'N'), (3.2, 'R'), (3.6, 'N')]
        gest = 0.0
        for gt, gw in rounds:
            if gw == who and gt <= u < gt + 0.7: gest = math.sin((u - gt) / 0.7 * math.pi)
        side = 1.0 if who == 'R' else -1.0
        P['x'], P['y'], P['th'] = mx, my, 0.0
        P['head_yaw'] = side * 0.55 * ss(u / 0.4) * (1 - 0.8 * gest)
        P['propR'] = 'phone' if (who == 'R' and u < 0.35) else None
        P['armR'] = (14, 22) if (who == 'R' and u < 0.35) else ((8 * -side, 16 + 28 * gest) if gest > 0 else (22, 8))
        if who == 'N' and gest > 0: P['armR'] = (6, 18 + 30 * gest)
        P['lean'] = 2.0 * gest
        step = ss((t - (T_ENTER - 0.55)) / 0.55)                      # both step toward the opening at once
        P['x'] = lerp(mx, CX + (14.0 if who == 'N' else -14.0), step)
        P['y'] = lerp(my, my + 38.0, step)
        P['speed'] = 70.0 * (1 - step) if step > 0 else 0.0
        return P
    # ---- 3. inside the compartment
    c = cen_men(t); om = omega(t)
    wr = ss((t - T_ENTER) / 1.0)
    r = lerp(150.0, 98.0, wr)
    d = 12.0 if who == 'N' else -12.0
    if who == 'N' and t >= T_EXIT_N: return n_after(P, t)
    if who == 'R' and t >= T_R_OUT: return r_after(P, t)
    if who == 'R' and t >= T_STOP:
        s = t - T_STOP
        d = lerp(-12.0, 27.0, 1 - math.exp(-s / 0.045)) - 7.0 * ss((s - 1.2) / 0.55)          # flung into the leaf, then peels off it
        r = 98.0 - 9.0 * (1 - math.exp(-s / 0.045)) + 5.0 * ss((s - 1.2) / 0.55)
    if who == 'R' and T_EXIT_N <= t < T_STOP: d = lerp(-12.0, 0.0, ss((t - T_EXIT_N) / 0.4))        # alone, he drifts to the middle
    ang = c + d
    P['x'], P['y'] = pol(r, ang)
    P['th'] = math.radians(ang) + math.pi
    if wr < 1.0: P['th'] = aang(facing(*pol(150.0, ang), CX, CY), P['th'], wr)
    P['speed'] = min(430.0, abs(math.radians(om)) * r * 0.9) if not (who == 'R' and t >= T_STOP) else 0.0
    toward = 1.2 * (-1.0 if who == 'N' else 1.0) if t < T_EXIT_N else 0.0
    south = max(0.0, math.cos(math.radians(c - 90.0)))
    sp = min(1.0, om / 255.0)
    P['head_yaw'] = toward * (0.65 + 0.35 * south) + 0.35 * sp * math.sin(t * 9.0 + (0.0 if who == 'N' else 1.3))
    P['propR'] = None if who == 'N' else None; P['propL'] = 'coffee' if who == 'N' else None
    P['armR'] = wlocal(CX, CY + 185.0, P['x'], P['y'], P['th']) if (south > 0.72 and t < T_EXIT_N) else (22, 10)
    P['lean'] = 1.2 * sp
    if who == 'R' and t >= T_STOP:
        s = t - T_STOP
        P['slump'] = ss(s / 0.07) * (1 - ss((s - 1.3) / 0.5)); P['armL'] = (-40, 16); P['armR'] = (40, 16); P['head_yaw'] = 0.0; P['lean'] = 0.0
    return P

def n_after(P, t):
    """N steps out of the drum into the lobby (dizzy), turns round, reaches for the leaf as it flies past, and stops the door"""
    s = t - T_EXIT_N
    sx, sy = pol(98.0, 102.0); u = ss(s / 0.9)
    tx, ty = CX - 36.0, CY + 212.0
    wob = 16.0 * math.sin(s * 5.2) * math.exp(-s / 1.6) if t < T_STOP else 0.0
    P['x'], P['y'] = lerp(sx, tx, u) + wob * u, lerp(sy, ty, u) + 4.0 * math.sin(s * 3.0)
    P['th'] = kf(s, [(0, math.radians(102) + math.pi), (0.9, 2 * math.pi)], ease=True)    # swings round to face north, back to the drum
    P['speed'] = 55.0 * (1.0 - u); P['head_yaw'] = 0.7 * math.sin(s * 4.6) * math.exp(-s / 1.5); P['armR'] = (22, 10); P['propL'] = 'coffee'
    if t > T_STOP - 0.5:                                                                  # the reflex
        g = ss((t - (T_STOP - 0.5)) / 0.28); loc = wlocal(CX, CY + 150.0, P['x'], P['y'], P['th'])
        P['armR'] = (lerp(22, loc[0], g), lerp(10, loc[1], g)); P['lean'] = 5.0 * g; P['head_yaw'] = -0.2 * g
    if t >= T_REL:                                                                        # lets go, both hands up: sorry
        v = ss((t - T_REL) / 0.25); P['armR'] = (lerp(20, 26, v), lerp(34, 40, v)); P['armL'] = (-26, 40) if t < T_REL + 2.2 else None
        P['propL'] = None if t < T_REL + 2.2 else 'coffee'; P['lean'] = 0.0
    if t >= T_R_OUT + 2.4:                                                                # the stiff moment is over; he straightens up, and watches the child
        P['armL'] = None; P['propL'] = 'coffee'; P['armR'] = (22, 8); P['th'] = 2 * math.pi
        kx, ky = kid_xy(t)
        if kx is not None: P['head_yaw'] = look_yaw(P, kx, ky) * ss((t - (T_KID_IN - 0.2)) / 0.4)
    T_GO = T_KID_OUT + 1.3
    if t > T_GO:                                                                          # then walks off to the left through the lobby
        q = ss((t - T_GO) / 3.2); P['x'] = lerp(P['x'], -80.0, q); P['th'] = kf(t, [(T_GO, 2 * math.pi), (T_GO + 0.6, 1.5 * math.pi)]); P['speed'] = 78.0 * q; P['head_yaw'] = 0.0
    return P

def r_after(P, t):
    """R: free of the leaf, steps out into the lobby, a stiff thank-you, off to the right"""
    s = t - T_R_OUT
    x0, y0 = pol(88.0, 72.0); u = ss(s / 1.1)
    P['x'], P['y'] = lerp(x0, CX + 78.0, u), lerp(y0, CY + 236.0, u)
    P['th'] = kf(s, [(0, math.pi * 0.8), (1.0, math.pi)]); P['speed'] = 55.0 * (1 - u)
    P['head_yaw'] = 0.5 * math.sin(s * 4.0) * math.exp(-s / 1.1); P['slump'] = 0.5 * (1 - ss(s / 1.1)); P['propR'] = None
    if 1.0 < s < 2.4: P['armR'] = (26, 30 + 8 * math.sin(s * 7.0)); P['th'] = math.pi + 0.35
    if s >= 2.4:
        P['armR'] = (22, 8); P['th'] = math.pi; kx, ky = kid_xy(t)
        if kx is not None: P['head_yaw'] = look_yaw(P, kx, ky) * ss((t - (T_KID_IN - 0.2)) / 0.4)
    T_GO = T_KID_OUT + 1.3
    if t > T_GO:
        q = ss((t - T_GO) / 3.2); P['x'] = lerp(P['x'], 830.0, q); P['th'] = kf(t, [(T_GO, math.pi), (T_GO + 0.6, 0.5 * math.pi)]); P['speed'] = 78.0 * q; P['head_yaw'] = 0.0
    return P

def kid_pose(P, t):
    if t < T_KID_IN - 1.4 or t > T_KID_OUT + 5.0: P['vis'] = False
    P['armR'] = (14, 16)
    if t < T_KID_IN:
        u = ss((t - (T_KID_IN - 1.4)) / 1.4)
        P['x'], P['y'] = lerp(420.0, CX, u), lerp(250.0, 462.0, u); P['th'] = facing(420.0, 250.0, CX, 462.0); P['speed'] = 70.0; return P
    if t < T_KID_OUT:
        c = cen_kid(t); r = lerp(158.0, 94.0, ss((t - T_KID_IN) / 0.6))
        P['x'], P['y'] = pol(r, c); P['th'] = math.radians(c) + math.pi; P['speed'] = min(260.0, abs(math.radians(omega(t))) * r * 0.9); return P
    s = t - T_KID_OUT; u = ss(s / 0.9)
    x0, y0 = pol(94.0, 446.0)
    P['x'], P['y'] = lerp(x0, CX + 28.0, u), lerp(y0, CY + 360.0, u) + (s > 0.9) * 0 * s
    P['th'] = kf(s, [(0, math.pi * 1.0), (1.4, math.pi * 1.0), (2.8, math.pi * 1.1)]); P['speed'] = 85.0 * (1.0 if s < 3.5 else 0.0)
    if s > 0.9: P['y'] = CY + 360.0 + 70.0 * (s - 0.9)
    P['head_yaw'] = kf(s, [(0.9, 0.0), (1.4, -1.1), (2.1, -1.1), (2.6, 0.0)])         # one glance back at the two men
    return P

def kid_xy(t):
    if t < T_KID_IN - 1.0 or t > T_KID_OUT + 4.0: return None, None
    Q = kid_pose(dict(kind='kid', x=0.0, y=0.0, th=0.0, speed=0.0, vis=True, armR=None), t); return Q['x'], Q['y']

# ================================================================ the world
def build_bg():
    rng = np.random.default_rng(8)
    Wb, Hb = 720 * SBG, WH * SBG
    im = Image.new('RGB', (Wb, Hb), PAL['paving']); d = ImageDraw.Draw(im, 'RGBA'); T = 90
    for gy in range(0, WH // T + 1):
        for gx in range(0, 720 // T + 1):
            v = int(rng.integers(-5, 6)); c = tuple(min(255, max(0, x + v)) for x in PAL['paving'])
            d.rectangle([gx * T * SBG, gy * T * SBG, (gx + 1) * T * SBG, (gy + 1) * T * SBG], fill=c)
    for gx in range(0, 720 // T + 2): d.line([(gx * T * SBG, 0), (gx * T * SBG, Hb)], fill=PAL['seam'], width=SBG * 2)
    for gy in range(0, WH // T + 2): d.line([(0, gy * T * SBG), (Wb, gy * T * SBG)], fill=PAL['seam'], width=SBG * 2)
    S = lambda *a: [v * SBG for v in a]
    def rr(x0, y0, x1, y1, r, fill, outline=None, w=2):
        d.rounded_rectangle(S(x0, y0, x1, y1), radius=r * SBG, fill=fill, outline=outline, width=w * SBG // 2 if outline else 0)
    def sh(x0, y0, x1, y1, r=10, dx=12, dy=16, a=55): d.rounded_rectangle(S(x0 + dx, y0 + dy, x1 + dx, y1 + dy), radius=r * SBG, fill=(0, 0, 0, a))
    for (cx_, cy_, w_, h_) in ((95, 250, 150, 96), (640, 330, 120, 120)):
        sh(cx_ - w_ / 2, cy_ - h_ / 2, cx_ + w_ / 2, cy_ + h_ / 2, 14); rr(cx_ - w_ / 2, cy_ - h_ / 2, cx_ + w_ / 2, cy_ + h_ / 2, 14, PAL['pot'], INK)
        rr(cx_ - w_ / 2 + 9, cy_ - h_ / 2 + 9, cx_ + w_ / 2 - 9, cy_ + h_ / 2 - 9, 10, PAL['grass2'])
        for _ in range(22):
            px, py, pr = cx_ + rng.uniform(-w_ / 2 + 16, w_ / 2 - 16), cy_ + rng.uniform(-h_ / 2 + 16, h_ / 2 - 16), rng.uniform(9, 16)
            d.ellipse(S(px - pr, py - pr, px + pr, py + pr), fill=PAL['grass'] if rng.random() > .4 else PAL['grass2'], outline=(40, 80, 44, 200))
    sh(60, 520, 210, 566, 6); rr(60, 520, 210, 566, 6, (150, 104, 70), INK)
    for i in range(1, 6): d.line(S(60 + i * 25, 522, 60 + i * 25, 564), fill=(110, 76, 52, 255), width=SBG * 2)
    d.ellipse(S(560, 560, 604, 604), fill=(120, 118, 124), outline=INK, width=SBG * 2)
    for yy in range(160, 520, 130): d.rectangle(S(354, yy, 366, yy + 54), fill=(255, 255, 255, 110))
    # the building: lobby floor to the south, the wall through the drum's centre line
    d.rectangle(S(0, CY + 12, 720, WH), fill=PAL['floor'])
    for x in range(0, 720, 44): d.line(S(x, CY + 12, x, WH), fill=PAL['floor2'], width=SBG * 2)
    d.rectangle(S(0, CY + 12, 720, CY + 60), fill=(0, 0, 0, 40))
    sh(40, CY + 300, 250, CY + 352, 8, 10, 12, 60); rr(40, CY + 300, 250, CY + 352, 8, (86, 62, 48), INK)
    d.ellipse(S(560, CY + 300, 650, CY + 390), fill=(150, 98, 70), outline=INK, width=SBG * 2)
    for _ in range(12):
        a = rng.uniform(0, 6.28); r = rng.uniform(16, 36); d.ellipse(S(605 + math.cos(a) * r - 12, CY + 345 + math.sin(a) * r - 12, 605 + math.cos(a) * r + 12, CY + 345 + math.sin(a) * r + 12), fill=PAL['grass'], outline=(40, 80, 44))
    d.rounded_rectangle(S(270, CY + 470, 450, CY + 600), radius=14 * SBG, fill=(160, 70, 62, 255))
    # the wall, either side of the drum
    for x0, x1 in ((0, CX - RD), (CX + RD, 720)):
        d.rectangle(S(x0, CY - 12, x1, CY + 12), fill=PAL['wall']); d.line(S(x0, CY - 12, x1, CY - 12), fill=PAL['wall_hi'], width=SBG * 2)
    # the doormat outside, and the drum's glass and rim (east and west arcs; north and south are the openings)
    sh(CX - 80, CY - RD - 78, CX + 80, CY - RD - 44, 4, 6, 8, 40); d.rectangle(S(CX - 80, CY - RD - 78, CX + 80, CY - RD - 44), fill=(88, 64, 50))
    f1 = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf', 12 * SBG); d.text(S(CX, CY - RD - 61), 'PLEASE  PUSH', font=f1, fill=(236, 226, 200), anchor='mm')
    for a0 in (-45, 135):
        box = S(CX - RD, CY - RD, CX + RD, CY + RD)
        d.arc(box, a0, a0 + 90, fill=(150, 205, 220, 255), width=SBG * 12); d.arc(box, a0, a0 + 90, fill=(60, 66, 78), width=SBG * 4)
        d.arc(S(CX - RD - 6, CY - RD - 6, CX + RD + 6, CY + RD + 6), a0, a0 + 90, fill=(40, 40, 48), width=SBG * 6)
    arr = np.asarray(im).astype(np.int16); arr += rng.integers(-3, 4, size=arr.shape[:2] + (1,)).astype(np.int16)
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
_BG = None
def bg():
    global _BG
    if _BG is None: _BG = build_bg()
    return _BG

# ================================================================ the camera
def camera(t):
    if t < 4.2: z, cx, cy = 1.0, 360.0, 640.0
    elif t < 7.0:
        u = ss((t - 4.2) / 2.8); z, cx, cy = lerp(1.0, 1.65, u), 360.0, lerp(640.0, 560.0, u)
    elif t < T_ENTER + 1.4: z, cx, cy = 1.65, 360.0, 580.0 + (t - 7.0) * 40.0 * 0
    elif t < T_EXIT_N - 1.2:
        u = ss((t - (T_ENTER + 1.4)) / 4.0); z, cx, cy = lerp(1.65, 2.05, u), 360.0, lerp(600.0, CY, u)
    elif t < T_REL + 1.0: z, cx, cy = 2.0, 360.0, CY + 60.0
    elif t < T_KID_IN - 1.6:
        u = ss((t - (T_REL + 1.0)) / 1.5); z, cx, cy = lerp(2.0, 1.5, u), 360.0, lerp(CY + 60.0, CY + 40.0, u)
    elif t < T_KID_OUT + 2.5: z, cx, cy = 1.5, 360.0, CY + 20.0
    else:
        u = ss((t - (T_KID_OUT + 2.5)) / 3.0); z, cx, cy = lerp(1.5, 1.0, u), 360.0, lerp(CY + 20.0, 700.0, u)
    vw, vh = 720 / z, 1280 / z
    return z, min(max(cx, vw / 2), 720 - vw / 2), min(max(cy, vh / 2), WH - vh / 2)

# ================================================================ frame
FT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf', 72)
def render(tt):
    t = max(0.0, tt - T0); z, cx, cy = camera(t); k = z * SC
    vw, vh = 720 / z, 1280 / z
    img = bg().resize((720 * SC, 1280 * SC), Image.BILINEAR, box=((cx - vw / 2) * SBG, (cy - vh / 2) * SBG, (cx + vw / 2) * SBG, (cy + vh / 2) * SBG))
    d = ImageDraw.Draw(img, 'RGBA')
    P = lambda x, y: ((x - cx) * z * SC + 360 * SC, (y - cy) * z * SC + 640 * SC)
    acts = [(w_, pose(w_, t)) for w_ in 'NRK']
    acts = [(w_, Q) for w_, Q in acts if Q['vis']]
    acts.sort(key=lambda a: a[1]['y'])
    # gait phase from the integrated speed
    def reach(tg, side):
        if tg is None: return None
        vx, vy = tg[0] - side * 27.0, tg[1] - 2.0; L_ = math.hypot(vx, vy)
        return tg if L_ <= 46.0 else (side * 27.0 + vx / L_ * 46.0, 2.0 + vy / L_ * 46.0)
    for w_, Q in acts:
        Q['armL'] = reach(Q['armL'], -1); Q['armR'] = reach(Q['armR'], 1)
        sx, sy = P(Q['x'], Q['y'])
        if -300 < sx < 1740 and -400 < sy < 2960:
            ph = phase_of(w_, t); sp = Q['speed']; cyc_stride = min(20.0, sp * 0.16 + 3.0) if sp > 1 else 0.0
            person(d, Q['kind'], sx, sy, Q['th'], k * Q['sc'], ph, cyc_stride, min(18.0, sp * 0.14), Q['bob'], Q['head_yaw'], Q['lean'], Q['armL'], Q['armR'], Q['propL'], Q['propR'], Q['slump'])
    # the revolving leaves, on top of everyone inside (they are walls)
    a0 = alpha(t); hub = P(CX, CY)
    for j in range(4):
        a = math.radians(a0 + 90 * j); e = P(CX + (RD - 5) * math.cos(a), CY + (RD - 5) * math.sin(a))
        d.line([(hub[0] + 7 * k, hub[1] + 10 * k), (e[0] + 7 * k, e[1] + 10 * k)], fill=(0, 0, 0, 50), width=int(7 * k))
        d.line([hub, e], fill=(150, 205, 220, 215), width=int(7 * k)); d.line([hub, e], fill=(235, 248, 252, 255), width=max(1, int(2 * k)))
        d.ellipse([e[0] - 4 * k, e[1] - 4 * k, e[0] + 4 * k, e[1] + 4 * k], fill=(60, 66, 78, 255))
    d.ellipse([hub[0] - 12 * k, hub[1] - 12 * k, hub[0] + 12 * k, hub[1] + 12 * k], fill=(50, 54, 66, 255), outline=(150, 160, 175, 255), width=int(2 * k))
    out = img.resize((720, 1280), Image.LANCZOS); d2 = ImageDraw.Draw(out, 'RGBA')
    if tt < T0 + 0.8:
        a_ = ss(min(1, tt / 0.5)) * (1 - ss((tt - 0.9) / 0.5))
        d2.rectangle([0, 0, 720, 1280], fill=(10, 10, 14, int(255 * (1 - ss((tt - (T0 - 0.1)) / 0.9)))))
        if tt < 1.5: d2.text((360, 600), 'AFTER YOU', font=FT, fill=(238, 232, 214, int(255 * a_)), anchor='mm')
    if tt > TOTAL - 1.0: d2.rectangle([0, 0, 720, 1280], fill=(10, 10, 14, int(255 * ss((tt - (TOTAL - 1.0)) / 1.0))))
    return out

_PH = {}
def phase_of(who, t):
    """gait phase = integral of speed / cycle length, cached at 60 Hz"""
    if who not in _PH:
        n = int((SCENE + 1) * 60); arr = np.zeros(n + 1)
        for i in range(1, n + 1):
            tt = i / 60.0; sp = pose(who, tt)['speed']; cyc = 70.0 if sp < 150 else 105.0; arr[i] = arr[i - 1] + sp / 60.0 / cyc * 2 * math.pi
        _PH[who] = arr
    arr = _PH[who]; x = min(len(arr) - 2, t * 60.0); i = int(x); return arr[i] + (arr[i + 1] - arr[i]) * (x - i)

# ================================================================ sound
SR = 44100
def build_audio():
    from scipy.io import wavfile
    from scipy.signal import butter, sosfilt
    n = int(SR * (TOTAL + 0.6)); L = np.zeros(n); R = np.zeros(n); rng = np.random.default_rng(9)
    def band(x, lo, hi, order=2): sos = butter(order, [lo, min(hi, SR / 2 - 100)], 'band', fs=SR, output='sos'); return sosfilt(sos, x)
    def lowp(x, f, order=2): return sosfilt(butter(order, f, 'low', fs=SR, output='sos'), x)
    def put(sig, t0, gain=1.0, pan=0.5):
        i = int(t0 * SR)
        if i >= n or i < 0: return
        j = min(n, i + len(sig)); seg = sig[:j - i] * gain
        L[i:j] += seg * math.cos(pan * math.pi / 2); R[i:j] += seg * math.sin(pan * math.pi / 2)
    noise = lambda d: rng.standard_normal(int(d * SR))
    def env(d, a=0.002, tau=0.05): x = np.arange(int(d * SR)) / SR; return np.minimum(1, x / a) * np.exp(-x / tau)
    def step_snd(hard, small=False):
        d = 0.09; x = band(noise(d), 450 if hard else 300, 2600 if hard else 1700) * env(d, 0.001, 0.022) * 1.3
        th = np.sin(2 * np.pi * (95 if hard else 70) * np.arange(int(0.08 * SR)) / SR) * env(0.08, 0.001, 0.03) * 0.85
        out = x.copy(); out[:len(th)] += th; return out * (0.55 if small else 1.0)
    def pluck(f, dur=0.9, tau=0.28, bright=0.5):
        x = np.arange(int(dur * SR)) / SR
        y = np.sin(2 * np.pi * f * x) + 0.45 * bright * np.sin(2 * np.pi * 2 * f * x) * np.exp(-x / (tau * .5)) + 0.2 * bright * np.sin(2 * np.pi * 3.01 * f * x) * np.exp(-x / (tau * .3))
        return y * np.exp(-x / tau) * np.minimum(1, x / 0.003)
    def accordion(f, dur):
        x = np.arange(int(dur * SR)) / SR; y = 2 * ((f * x) % 1) - 1 + 0.6 * (2 * ((f * 1.005 * x) % 1) - 1); y = lowp(y, 2200)
        return y * np.minimum(1, x / 0.012) * np.minimum(1, np.maximum(0.0, (dur - x) / 0.04))
    cam_gain = lambda x, y, t: 0.25 + 0.75 * math.exp(-(math.hypot(x - camera(t)[1], y - camera(t)[2]) / (360.0 / camera(t)[0])) ** 2 * 0.5)
    # ---- footsteps from each actor's gait phase
    nsteps = 0
    for who in 'NRK':
        ph = phase_of(who, 0.0); prev = None
        for i in range(0, int(SCENE * 60)):
            t = i / 60.0; Q = pose(who, t)
            if not Q['vis'] or Q['speed'] < 8: prev = None; continue
            s = math.sin(phase_of(who, t))
            if prev is not None and prev * s < 0:
                g = (0.10 + 0.9 * cam_gain(Q['x'], Q['y'], t)) * (0.5 + min(1.0, Q['speed'] / 200.0) * 0.7) * 0.40
                put(step_snd(who != 'N', who == 'K'), t + T0, g, min(0.9, max(0.1, Q['x'] / 720.0))); nsteps += 1
            prev = s
    # ---- the door: a hum that follows its speed, and a whup each time a leaf passes an opening
    tt = np.arange(n) / SR
    om = np.array([abs(omega(min(SCENE, max(0.0, x - T0)))) for x in tt[::SR // 100]]); om_i = np.interp(tt, tt[::SR // 100], om)
    hum = (lowp(noise(TOTAL + 0.6), 260) * 0.020 + lowp(noise(TOTAL + 0.6), 1400) * 0.012) * (0.12 + (om_i / 255.0) ** 1.5 * 1.7)
    hum = hum[:n]; L += hum; R += hum
    k_prev = int(alpha(0.0) // 90.0)
    for i in range(1, int(SCENE * 120)):
        t = i / 120.0; kk = int(alpha(t) // 90.0)
        if kk > k_prev:
            o = abs(omega(t)); g = 0.05 + 0.5 * min(1.0, o / 200.0)
            for nx, pan in ((0.5, 0.22), (0.5, 0.78)):
                put(lowp(noise(0.13), 700 + 2200 * min(1.0, o / 255.0)) * env(0.13, 0.002, 0.04) * g * 1.4 + np.sin(2 * np.pi * 62 * np.arange(int(0.13 * SR)) / SR) * env(0.13, 0.002, 0.05) * g, t + T0, 1.0, pan)
        k_prev = max(k_prev, kk)
    # ---- the stop and the splat
    put(step_snd(True) * 1.6, T_STOP + T0 - 0.02, 0.5, 0.5)
    for q in range(5): put(band(noise(0.05), 2500, 8000) * env(0.05, 0.0006, 0.012) * 0.25, T_STOP + T0 + 0.02 + q * 0.05, 1.0, 0.5)
    put(np.sin(2 * np.pi * np.cumsum(np.linspace(190, 90, int(0.22 * SR))) / SR) * env(0.22, 0.004, 0.09) * 0.22, T_STOP + T0 + 0.07, 1.0, 0.65)       # the "oof"
    put(step_snd(False) * 1.4, T_STOP + T0 + 0.05, 0.4, 0.62)
    put(lowp(noise(0.9), 500) * np.hanning(int(0.9 * SR)) * 0.12, T_REL + T0, 1.0, 0.5)                                                              # the motor takes up again
    # ---- the waltz, whose beat is the door's own angle
    notes = {'D': (73.42, [293.66, 369.99, 440.0]), 'A': (55.0, [329.63, 440.0, 554.37]), 'Bm': (61.74, [293.66, 369.99, 493.88]), 'G': (49.0, [293.66, 392.0, 493.88])}
    chords = ['D', 'A', 'Bm', 'G', 'D', 'A', 'G', 'D']
    def waltz(t_a, t_b):
        b_prev = None
        for i in range(int(t_a * 240), int(t_b * 240)):
            t = i / 240.0; b = int(alpha(t) // 30.0)
            if b_prev is not None and b > b_prev:
                m, beat = divmod(b, 3); ch = chords[m % len(chords)]; bass, tri = notes[ch]
                o = abs(omega(t)); nxt = 30.0 / max(25.0, o)
                if beat == 0:
                    put(pluck(bass * 2, 0.5, 0.14, 0.3), t + T0, 0.19, 0.5)
                    put(accordion(tri[0], min(0.5, nxt * 0.95)), t + T0, 0.045, 0.5)
                else:
                    for f in (tri[1] * 0.5, tri[2] * 0.5, tri[0] * 0.5): put(pluck(f, 0.25, 0.07, 0.35), t + T0, 0.07, 0.5)
                    put(accordion(tri[beat], min(0.45, nxt * 0.95)), t + T0, 0.04, 0.5)
            b_prev = b if b_prev is None else max(b_prev, b)
    waltz(T_ENTER - 0.5, T_STOP - 0.005)           # it stops dead when the door does
    waltz(T_REL + 0.9, SCENE - 1.8)
    # ---- the approach: two soft pizzicato for the walk, the after-you gestures get a tiny plink each
    for gt in (4.35, 5.25, 6.15, 6.85, 7.4, 7.8): put(pluck(784.0 if int(gt * 10) % 2 else 659.25, 0.5, 0.18, 0.5), gt + T0, 0.05, 0.5)
    # ---- the kid: a lone triangle-ish whistle on the way through
    for q, f in enumerate((587.33, 659.25, 739.99, 659.25)): put(pluck(f, 0.5, 0.2), T_KID_IN + T0 + 0.4 + q * 0.28, 0.05, 0.5)
    hush = (lowp(noise(TOTAL + 0.6), 420) * 0.010 + lowp(noise(TOTAL + 0.6), 90) * 0.012)[:n] * np.minimum(1, tt / 0.8)
    L += hush; R += hush
    fade = np.clip(tt / 0.4, 0, 1) * np.clip((TOTAL + 0.4 - tt) / 0.9, 0, 1); L *= fade; R *= fade
    pk = max(np.max(np.abs(L)), np.max(np.abs(R))); L, R = L / pk, R / pk
    L = np.tanh(L * 3.0) / np.tanh(3.0) * 0.58; R = np.tanh(R * 3.0) / np.tanh(3.0) * 0.58
    wavfile.write(OUT + '/revolving.wav', SR, (np.stack([L, R], 1) * 32767).astype(np.int16))
    print('audio done; steps', nsteps, 'T_STOP', round(T_STOP, 2), 'T_EXIT_N', round(T_EXIT_N, 2), 'T_REL', round(T_REL, 2), 'kid in/out', round(T_KID_IN, 2), round(T_KID_OUT, 2))

if __name__ == '__main__':
    print('door: exit N', round(T_EXIT_N, 2), 'stop', round(T_STOP, 2), 'release', round(T_REL, 2), 'kid in', round(T_KID_IN, 2), 'kid out', round(T_KID_OUT, 2))
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
                          '-vf', 'noise=alls=3:allf=t+u', '-c:v', 'libx264', '-crf', '17', '-pix_fmt', 'yuv420p', OUT + '/rev-silent.mp4'], stdin=subprocess.PIPE)
    for i in range(frames):
        p.stdin.write(render(i / FPS).tobytes())
        if i % 150 == 0: print('frame', i, '/', frames, flush=True)
    p.stdin.close(); p.wait(); print('picture done')
    build_audio()
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', OUT + '/rev-silent.mp4', '-i', OUT + '/revolving.wav', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', OUT + '/after-you.mp4'], check=True)
    print('done', OUT + '/after-you.mp4')
