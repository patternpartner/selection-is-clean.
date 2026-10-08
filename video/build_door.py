"""'Hold the Door' - a silent comedy, drawn in code, shot from straight above. ~32 s, 720x1280, synthesized foley and a small score.
python3 video/build_door.py [OUT_DIR]       STILLS=1,3.5,... -> PNGs at those seconds        SHEET=t0,t1,step -> a contact sheet
No clips, no model, no Modal, no data: every pixel and every sound is code. Nothing here is true of anything; it is a joke about
the most awkward thing a person can do, which is hold a door for someone who is far away.
THE JOKE: he comes out of a staff-only door, sees a stranger far across the plaza and holds it for them. The stranger notices,
feels obliged, and breaks into the guilty jog. The stranger was going to the automatic doors next to it the whole time.
He is locked out by his own kindness (STAFF EXIT ONLY / NO RE-ENTRY is stencilled on the mat in the first seconds). He walks to
the automatic doors, which open; a second stranger, far away, appears; and he can't help himself."""
import json, math, os, sys, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from door_draw import *

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
OUT = sys.argv[1] if len(sys.argv) > 1 else 'out/door'
os.makedirs(OUT, exist_ok=True)
FPS, SC, SBG, WH = 30, 2, 3, 1500          # fps, supersample, background supersample, world height
T0 = 1.5                 # the title card owns the first second and a half; the scene's clock starts after it
SCENE = 33.0
TOTAL = SCENE + T0
WALL_Y = 1129
GAP_AUTO, GAP_STAFF = (290, 460), (490, 580)
HINGE = (490, WALL_Y)
LEAF = 90

# ------------------------------------------------------------------ helpers
def ss(t): t = min(1.0, max(0.0, t)); return t * t * (3 - 2 * t)
def kf(t, pts, ease=True):
    """pts: [(t, v)...]; v scalar or tuple. smoothstep between keys"""
    if t <= pts[0][0]: return pts[0][1]
    if t >= pts[-1][0]: return pts[-1][1]
    for (t0, a), (t1, b) in zip(pts, pts[1:]):
        if t0 <= t <= t1:
            u = (t - t0) / (t1 - t0); u = ss(u) if ease else u
            if isinstance(a, tuple): return tuple(x + (y - x) * u for x, y in zip(a, b))
            return a + (b - a) * u
def lin(t, pts): return kf(t, pts, ease=False)
def lerp(a, b, u): return a + (b - a) * u
def aang(a, b, u):
    d = (b - a + math.pi) % (2 * math.pi) - math.pi; return a + d * u

# ------------------------------------------------------------------ static world
def build_bg():
    rng = np.random.default_rng(3)
    Wb, Hb = 720 * SBG, WH * SBG
    im = Image.new('RGB', (Wb, Hb), PAL['paving']); d = ImageDraw.Draw(im, 'RGBA')
    T = 90
    for gy in range(0, WH // T + 1):
        for gx in range(0, 720 // T + 1):
            v = int(rng.integers(-5, 6)); c = tuple(min(255, max(0, x + v)) for x in PAL['paving'])
            d.rectangle([gx * T * SBG, gy * T * SBG, (gx + 1) * T * SBG, (gy + 1) * T * SBG], fill=c)
    for gx in range(0, 720 // T + 2): d.line([(gx * T * SBG, 0), (gx * T * SBG, Hb)], fill=PAL['seam'], width=SBG * 2)
    for gy in range(0, WH // T + 2): d.line([(0, gy * T * SBG), (Wb, gy * T * SBG)], fill=PAL['seam'], width=SBG * 2)
    # soft stains
    st = Image.new('RGBA', (Wb, Hb), (0, 0, 0, 0)); sd = ImageDraw.Draw(st)
    for _ in range(40):
        x, y, r = rng.integers(0, 720), rng.integers(0, 1100), rng.integers(20, 90)
        sd.ellipse([(x - r) * SBG, (y - r * .6) * SBG, (x + r) * SBG, (y + r * .6) * SBG], fill=(120, 108, 90, 14))
    st = st.filter(ImageFilter.GaussianBlur(30 * SBG // 3)); im.paste(st, (0, 0), st)
    d = ImageDraw.Draw(im, 'RGBA')
    S = lambda *a: [v * SBG for v in a]
    def rr(x0, y0, x1, y1, r, fill, outline=None, w=2):
        d.rounded_rectangle(S(x0, y0, x1, y1), radius=r * SBG, fill=fill, outline=outline, width=w * SBG // 2 if outline else 0)
    def shadow_rect(x0, y0, x1, y1, r=10, dx=12, dy=16, a=55):
        d.rounded_rectangle(S(x0 + dx, y0 + dy, x1 + dx, y1 + dy), radius=r * SBG, fill=(0, 0, 0, a))
    # planters
    for (cx, cy, w, h) in ((110, 300, 150, 96), (610, 520, 130, 130)):
        shadow_rect(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2, 14)
        rr(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2, 14, PAL['pot'], INK)
        rr(cx - w / 2 + 9, cy - h / 2 + 9, cx + w / 2 - 9, cy + h / 2 - 9, 10, PAL['grass2'])
        for _ in range(26):
            px, py, pr = cx + rng.uniform(-w / 2 + 16, w / 2 - 16), cy + rng.uniform(-h / 2 + 16, h / 2 - 16), rng.uniform(9, 17)
            d.ellipse(S(px - pr, py - pr, px + pr, py + pr), fill=PAL['grass'] if rng.random() > .4 else PAL['grass2'], outline=(40, 80, 44, 200))
    # bench
    shadow_rect(40, 740, 190, 790, 6)
    rr(40, 740, 190, 790, 6, (150, 104, 70), INK)
    for i in range(1, 6): d.line(S(40 + i * 25, 742, 40 + i * 25, 788), fill=(110, 76, 52, 255), width=SBG * 2)
    # manhole, drain, lamp base
    d.ellipse(S(310, 620, 354, 664), fill=(120, 118, 124), outline=INK, width=SBG * 2)
    for i in range(-2, 3): d.line(S(318, 642 + i * 7, 346, 642 + i * 7), fill=(80, 78, 86), width=SBG * 2)
    d.ellipse(S(40, 980, 80, 1020), fill=(70, 72, 82), outline=INK, width=SBG * 2); d.ellipse(S(52, 992, 68, 1008), fill=(210, 205, 180))
    # bike rack with two bikes
    shadow_rect(600, 1042, 710, 1048, 2, 8, 10, 40)
    for bx in (618, 668):
        d.line(S(bx, 1010, bx, 1075), fill=(70, 74, 86), width=SBG * 5)
        d.ellipse(S(bx - 5, 1008, bx + 5, 1018), fill=(70, 74, 86)); d.ellipse(S(bx - 5, 1067, bx + 5, 1077), fill=(70, 74, 86))
        d.line(S(bx, 1018, bx, 1068), fill=(210, 60, 60) if bx == 618 else (60, 120, 200), width=SBG * 3)
        d.line(S(bx - 12, 1030, bx + 12, 1030), fill=(30, 30, 36), width=SBG * 3)
    # painted lines to give the plaza a sense of distance
    for yy in range(160, 1040, 140):
        d.rectangle(S(354, yy, 366, yy + 54), fill=(255, 255, 255, 120))
    # the building: warm floor, then the wall
    d.rectangle(S(0, WALL_Y + 12, 720, WH), fill=PAL['floor'])
    for x in range(0, 720, 44): d.line(S(x, WALL_Y + 12, x, WH), fill=PAL['floor2'], width=SBG * 2)
    d.rectangle(S(0, WALL_Y + 12, 720, WALL_Y + 60), fill=(0, 0, 0, 45))      # shade under the wall
    shadow_rect(110, 1210, 350, 1262, 8, 10, 12, 60); rr(110, 1210, 350, 1262, 8, (86, 62, 48), INK)      # reception desk
    d.ellipse(S(600, 1200, 680, 1280), fill=(150, 98, 70), outline=INK, width=SBG * 2)
    for _ in range(12):
        a = rng.uniform(0, 6.28); r = rng.uniform(14, 34); d.ellipse(S(640 + math.cos(a) * r - 12, 1240 + math.sin(a) * r - 12, 640 + math.cos(a) * r + 12, 1240 + math.sin(a) * r + 12), fill=PAL['grass'], outline=(40, 80, 44))
    d.rounded_rectangle(S(300, 1340, 430, 1450), radius=14 * SBG, fill=(160, 70, 62, 255))
    # wall with two gaps
    def wall(x0, x1):
        d.rectangle(S(x0, WALL_Y - 12, x1, WALL_Y + 12), fill=PAL['wall'])
        d.line(S(x0, WALL_Y - 12, x1, WALL_Y - 12), fill=PAL['wall_hi'], width=SBG * 2)
    wall(0, GAP_AUTO[0]); wall(GAP_AUTO[1], GAP_STAFF[0]); wall(GAP_STAFF[1], 720)
    # awning shadow on the plaza above the wall
    sh_ = Image.new('RGBA', (Wb, 60 * SBG), (0, 0, 0, 0)); sdd = ImageDraw.Draw(sh_)
    for i in range(60 * SBG): sdd.line([(0, i), (Wb, i)], fill=(0, 0, 0, int(34 * (1 - i / (60 * SBG)))))
    im.paste(sh_, (0, (WALL_Y - 72) * SBG), sh_)
    # the sensor strip inside the automatic doors and the door frames
    d.rectangle(S(GAP_AUTO[0], WALL_Y + 14, GAP_AUTO[1], WALL_Y + 34), fill=(60, 60, 70, 160))
    for x in (GAP_AUTO[0], GAP_AUTO[1], GAP_STAFF[0], GAP_STAFF[1]):
        d.rectangle(S(x - 5, WALL_Y - 14, x + 5, WALL_Y + 14), fill=PAL['frame'])
    # the stencilled mat: this is the setup
    shadow_rect(590, 1084, 712, 1126, 3, 6, 8, 40)
    d.rectangle(S(590, 1084, 712, 1126), fill=PAL['mat'])
    for i in range(0, 130, 16): d.polygon(S(590 + i, 1084, 598 + i, 1084, 590 + i - 6, 1090, 590 + i - 14, 1090), fill=(230, 190, 40))
    f1 = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf', 11 * SBG)
    d.text((651 * SBG, 1099 * SBG), 'STAFF EXIT ONLY', font=f1, fill=(240, 236, 220), anchor='mm')
    d.text((651 * SBG, 1115 * SBG), 'NO RE-ENTRY', font=f1, fill=(255, 120, 90), anchor='mm')
    # grain
    arr = np.asarray(im).astype(np.int16); arr += rng.integers(-3, 4, size=arr.shape[:2] + (1,)).astype(np.int16)
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))

# ------------------------------------------------------------------ the actors
def gait_path(keys, cyc):
    """keys [(t,x,y)] -> arrays x,y,theta,phase sampled at 240 Hz; phase advances with distance, cyc = distance per full gait cycle (callable of t)"""
    ts = np.arange(0, SCENE + 0.5, 1 / 240.0)
    xs = np.array([kf(t, [(k[0], k[1]) for k in keys], ease=False) for t in ts]); ys = np.array([kf(t, [(k[0], k[2]) for k in keys], ease=False) for t in ts])
    dx, dy = np.gradient(xs, ts), np.gradient(ys, ts); sp = np.hypot(dx, dy)
    th = np.zeros_like(ts); cur = None
    for i in range(len(ts)):
        if sp[i] > 4: cur = math.atan2(dx[i], -dy[i]) if cur is None else aang(cur, math.atan2(dx[i], -dy[i]), 0.25)
        th[i] = cur if cur is not None else 0.0
    ph = np.cumsum(sp / np.array([cyc(t) for t in ts])) / 240.0 * 2 * math.pi
    return ts, xs, ys, th, ph, sp
def at(arr, t): return arr[min(len(arr) - 1, int(t * 240))]

# holder: inside, out through the door, waits, loses, walks to the automatic door
H_KEYS = [(0, 525, 1275), (1.2, 525, 1150), (2.6, 515, 1070), (17.2, 515, 1070), (22.0, 515, 1070), (23.0, 440, 1076), (24.4, 345, 1096), (25.0, 322, 1118), (SCENE + 1, 322, 1118)]
# the holder steps back into the doorway only after the doors open for him; the walker passes along x=400
HT = gait_path(H_KEYS, lambda t: 70.0)
# the first stranger
W_KEYS = [(0, 470, -400), (10.6, 470, 375), (11.1, 470, 382), (14.0, 470, 880), (14.6, 448, 985), (15.2, 392, 1072), (15.8, 380, 1112), (16.5, 392, 1200), (18.2, 330, 1262), (20.6, 150, 1335), (22.4, -90, 1390), (SCENE + 1, -90, 1390)]
def w_cyc(t): return 76.0 if t < 11.0 else 112.0 if t < 15.2 else 80.0
WT = gait_path(W_KEYS, w_cyc)
# the second stranger
S_KEYS = [(0, 330, -400), (24.4, 330, -90), (24.6, 330, -60), (29.6, 392, 1030), (30.2, 392, 1112), (31.0, 392, 1210), (SCENE + 1, 392, 1300)]
def s_cyc(t): return 100.0 if 24.6 < t < 30.0 else 80.0
ST = gait_path(S_KEYS, s_cyc)

def leaf_angle(t):
    a = kf(t, [(0, 0.0), (1.0, 0.0), (1.75, 100.0), (2.5, 100.0), (3.2, 79.0), (3.55, 100.0), (17.0, 100.0), (19.15, 0.0), (SCENE + 1, 0.0)])
    if 19.15 < t < 19.45: a = 2.5 * math.sin((t - 19.15) / 0.3 * math.pi)      # the closer's last bounce
    for tr in (20.05, 20.75):                                                       # he pushes; it rattles in its frame
        if tr < t < tr + 0.25: a = 1.4 * math.sin((t - tr) / 0.25 * 3 * math.pi) * (1 - (t - tr) / 0.25)
    return a
def leaf_pt(t, frac):
    a = math.radians(leaf_angle(t)); return (HINGE[0] + LEAF * frac * math.cos(a), HINGE[1] - LEAF * frac * math.sin(a))
def auto_open(t):
    """0 closed .. 1 open. opens at sensor range for the first stranger, closes behind him; opens for the holder; stays open while someone is near"""
    def near(arrs, t):
        ts, xs, ys, *_ = arrs; x, y = at(xs, t), at(ys, t); return math.hypot(x - 375, y - 1115) < 135 and y < 1215
    want = near(WT, t) or near(ST, t) or (near(HT, t) and (lambda ts, xs, ys, *_: math.hypot(at(xs, t) - 375, at(ys, t) - 1115) < 88)(*HT))
    return want
_open = {}
def auto_state(t):
    # integrate with hysteresis, memoised on a 30 fps grid
    k = int(round(t * 120))
    if not _open:
        cur, last_want, hold = 0.0, 0, 0
        for i in range(int((SCENE + 1) * 120) + 2):
            tt = i / 120.0; w = auto_open(tt)
            if w: hold = tt + 1.1
            tgt = 1.0 if (w or tt < hold) else 0.0
            cur += (tgt - cur) * (1 - math.exp(-6.5 / 120)) if tgt > cur else (tgt - cur) * (1 - math.exp(-2.6 / 120))
            _open[i] = cur
    return _open[min(k, len(_open) - 1)]

def world_target(px, py, x, y, th):
    """world point -> body-local (lx, lf)"""
    dx, dy = px - x, py - y; fx, fy = math.sin(th), -math.cos(th); rx, ry = math.cos(th), math.sin(th)
    return (dx * rx + dy * ry, dx * fx + dy * fy)

def holder_pose(t):
    x, y, th, ph, sp = at(HT[1], t), at(HT[2], t), at(HT[3], t), at(HT[4], t), at(HT[5], t)
    P = dict(x=x, y=y, th=th, phase=ph, stride=min(13.0, sp * 0.22), swing=min(14.0, sp * 0.2), bob=0.0, head_yaw=0.0, lean=0.0,
             armL=None, armR=None, propL=None, propR='coffee', slump=0.0)
    waiting = 2.6 < t < 17.0
    if t < 2.6: th = 0.0; P['th'] = 0.0
    # pushing the door open on the way out
    if 0.95 < t < 1.9:
        P['armR'] = world_target(*leaf_pt(t, 0.72), x, y, 0.0); P['propR'] = None; P['propL'] = 'coffee'
    # he spots someone: scan, then lock on
    if 2.7 < t < 3.4:
        P['head_yaw'] = kf(t, [(2.7, 0), (3.0, 0.55), (3.25, -0.4), (3.5, 0)]);
    # leaf catches him, he takes it
    if waiting:
        lp = leaf_pt(t, 0.9); P['armL'] = world_target(lp[0] + 2, lp[1] + 6, x, y, th)
        if 3.2 < t < 3.6: P['armL'] = world_target(*leaf_pt(t, 0.9), x, y, th)
    # waiting: sway, tap, sip, glance, tired arm
    if 3.7 < t < 10.2:
        P['bob'] = 0.012 * math.sin(t * 2.2); P['stride'] = 3.0 * max(0, math.sin(t * 5.0)) if (5.0 < t < 6.0 or 8.4 < t < 9.2) else 0.0
        P['phase'] = (math.pi / 2 if P['stride'] else 0)
        P['head_yaw'] = kf(t, [(3.7, 0), (4.6, 0.18), (5.3, 0.0), (7.8, 0.0), (8.2, -0.22), (9.0, 0.1), (10.0, 0)])
        if 6.0 < t < 7.2: P['armR'] = (8 + 6 * ss((t - 6.0) / 0.5) * (1 - ss((t - 6.8) / 0.4)), 20 + 6 * ss((t - 6.0) / 0.5) * (1 - ss((t - 6.8) / 0.4)))
        if 8.8 < t < 10.2:    # the held arm gets tired
            lp = leaf_pt(t, 0.9); P['armL'] = world_target(lp[0] + 2 + 1.5 * math.sin(t * 22), lp[1] + 6 + 1.5 * math.cos(t * 19), x, y, th); P['lean'] = 0.5 * (t - 8.8)
    # nod and salute with the cup
    if 10.2 < t < 11.1: P['armR'] = (lerp(14, 32, ss((t - 10.2) / 0.3)), lerp(22, 46, ss((t - 10.2) / 0.3))); P['head_yaw'] = 0.0
    # the "no rush" pat: cup patting the air
    if 11.1 < t < 14.8:
        w = 0.5 * (1 + math.sin(t * 15)); P['armR'] = (30, 34 + 8 * w); P['bob'] = 0.01 * math.sin(t * 7)
        P['head_yaw'] = 0.08 * math.sin(t * 3.1)
    # the freeze, then the slow head-turn that follows him away
    if 14.8 <= t < 17.0:
        P['armR'] = (lerp(30, 22, ss((t - 14.8) / 1.6)), lerp(34, 4, ss((t - 14.8) / 1.6)))
        P['head_yaw'] = kf(t, [(14.8, 0), (15.7, 0.0), (16.6, -1.15), (17.0, -1.15)])
    # let go, watch the door shut
    if 17.0 <= t < 19.2:
        P['armL'] = None; P['propR'] = 'coffee'; P['armR'] = (22, 4); P['slump'] = ss((t - 17.0) / 1.5) * 0.7
        P['head_yaw'] = -1.15 * (1 - ss((t - 17.2) / 1.6)); P['th'] = th = kf(t, [(17.0, 0.0), (17.2, 0.0), (18.7, 0.0), (19.5, math.pi)])
    if t >= 19.2 and t < 22.0:
        P['th'] = th = kf(t, [(19.2, 0.0), (19.8, math.pi), (22.0, math.pi), (22.6, -math.pi / 2)]) if t < 22.0 else th
        P['propR'] = 'coffee'; P['armR'] = (24, 6); P['slump'] = 0.7
        lunge = 0.0
        for tr in (20.05, 20.75):
            if tr - 0.12 < t < tr + 0.3: lunge = math.sin((t - tr + 0.12) / 0.42 * math.pi)
        if 19.9 < t < 21.0: P['armL'] = (-14, 34 + 3 * lunge); P['armR'] = (14, 34 + 3 * lunge); P['propR'] = None; P['y'] = y + (-5 * lunge) * -1
        if 21.0 <= t < 22.0: P['slump'] = 0.7 + 0.3 * ss((t - 21.0) / 0.8); P['head_yaw'] = 0.35 * math.sin((t - 21.0) * 2.0)
    if 22.0 <= t < 25.2:      # the sulking walk to the automatic door
        P['stride'] = min(9.0, sp * 0.2); P['swing'] = 6.0; P['slump'] = 0.5 * (1 - ss((t - 24.2) / 0.8)); P['armR'] = (24, 4)
        P['th'] = th = kf(t, [(22.0, -math.pi / 2), (24.3, -math.pi / 2), (25.2, 0.0)])
    if t >= 25.2:             # in the doorway: he turns to the plaza, sees someone coming, and holds the door
        P['th'] = 0.0; P['slump'] = 0.0; P['stride'] = 0.0
        P['head_yaw'] = kf(t, [(25.2, 0.9), (26.0, -0.3), (26.8, 0.0)])
        lp = (GAP_AUTO[0] + 2 - 84 * (1 - 0) * 0, WALL_Y)
        P['armL'] = world_target(GAP_AUTO[0] - 8, WALL_Y - 4, x, y, 0.0)
        if t > 26.8:
            P['bob'] = 0.01 * math.sin(t * 2)
        if 29.2 < t < 31.2:   # the "no rush" pat again, with real confidence
            w = 0.5 * (1 + math.sin(t * 15)); P['armR'] = (30, 34 + 8 * w)
        if t > 31.2: P['armR'] = (lerp(30, 22, ss((t - 31.2) / 0.6)), lerp(40, 8, ss((t - 31.2) / 0.6))); P['head_yaw'] = kf(t, [(31.2, 0), (32.0, 0.5)])
    return P

def walker_pose(t):
    x, y, th, ph, sp = at(WT[1], t), at(WT[2], t), at(WT[3], t), at(WT[4], t), at(WT[5], t)
    P = dict(x=x, y=y, th=th, phase=ph, stride=min(11.0, sp * 0.15), swing=min(12.0, sp * 0.16), bob=0.0, head_yaw=0.0, lean=0.0,
             armL=None, armR=None, propL=None, propR=None, slump=0.0)
    if t < 10.6:
        P['armR'] = (14, 22); P['propR'] = 'phone'; P['head_yaw'] = 0.0
    elif t < 11.1:     # he looks up. someone is holding a door. for him.
        P['armR'] = (lerp(14, 8, ss((t - 10.6) / 0.25)), lerp(22, 2, ss((t - 10.6) / 0.25))); P['propR'] = 'phone'; P['head_yaw'] = 0.3 * ss((t - 10.6) / 0.15); P['bob'] = -0.05 * ss((t - 10.6) / 0.2)
    elif t < 15.2:     # the guilty jog: stiff, bouncing, a sorry-wave
        P['stride'] = 20.0; P['swing'] = 18.0; P['bob'] = 0.035 * abs(math.sin(ph)); P['propR'] = 'phone' if t < 11.4 else None
        P['armL'] = (-24, 15)
        P['armR'] = (30 + 5 * math.sin(t * 22), 46) if t < 12.4 else (24, 15)
        P['head_yaw'] = 0.18 * math.sin(t * 5) if t > 12.4 else 0.25
        P['lean'] = 3.0
    elif t < 16.5:     # past him without a glance
        P['stride'] = 9.0; P['swing'] = 10.0; P['head_yaw'] = 0.0; P['armR'] = None
    return P

def second_pose(t):
    x, y, th, ph, sp = at(ST[1], t), at(ST[2], t), at(ST[3], t), at(ST[4], t), at(ST[5], t)
    P = dict(x=x, y=y, th=th, phase=ph, stride=min(11.0, sp * 0.15), swing=min(12.0, sp * 0.16), bob=0.0, head_yaw=0.0, lean=0.0,
             armL=None, armR=None, propL=None, propR='coffee', slump=0.0)
    if 24.6 < t < 30.0:   # the guilty jog, again; this one is for real
        P['stride'] = 20.0; P['swing'] = 18.0; P['bob'] = 0.035 * abs(math.sin(ph)); P['armL'] = (-24, 15); P['armR'] = (24, 15) if t > 26.0 else (30 + 5 * math.sin(t * 22), 46); P['lean'] = 3.0
    elif 30.0 <= t < 31.4:   # thank you
        P['stride'] = 10.0; P['swing'] = 10.0; P['armR'] = (30, 40 + 4 * math.sin(t * 14)) if t < 30.9 else None; P['head_yaw'] = 0.5 * ss((t - 30.0) / 0.3) * (1 - ss((t - 30.8) / 0.4))
    return P

# pigeon: pecks, then goes
def pigeon_state(t):
    bx, by = 322, 560
    wt = at(WT[2], t); dist = abs(by - wt)
    if t < 12.0 and not (dist < 190 and t > 10): return dict(x=bx, y=by, th=0.3, fly=0.0, flap=0, peck=math.sin(t * 7.0) ** 8)
    t0 = 12.0 if t >= 12.0 else t
    u = min(1.0, (t - 11.7) / 1.1) if t >= 11.7 else 0.0
    if u <= 0: return dict(x=bx, y=by, th=0.3, fly=0.0, flap=0, peck=0)
    return dict(x=bx - 330 * u, y=by - 420 * u * u - 40 * u, th=-0.7, fly=min(1.0, u * 4), flap=t * 38, peck=0)

# ------------------------------------------------------------------ camera
def camera(t):
    """shots, with real cuts: tight on the door -> pull out to the wide -> cut to the walker -> cut to the holder -> wide -> push in."""
    wx, wy = at(WT[1], t), at(WT[2], t)
    if t < 2.5: z, cx, cy = 2.0, 525, 1090
    elif t < 5.8:
        u = ss((t - 2.5) / 3.3); z, cx, cy = lerp(2.0, 1.0, u), lerp(525, 360, u), lerp(1090, 640, u)
    elif t < 10.4: z, cx, cy = 1.0, 360, 640
    elif t < 12.0: z, cx, cy = lerp(2.3, 2.0, (t - 10.4) / 1.6), wx + 12, wy + 40           # follow him: phone, the look-up, the first strides
    elif t < 13.3: z, cx, cy = 2.7, 497, 1062                                                # cut to the holder: the nod, the pat
    elif t < 14.3: z, cx, cy = 1.3, 440, 940                                                 # cut: both of them, the gap closing
    elif t < 16.4:
        u = ss((t - 14.3) / 2.1); z, cx, cy = lerp(1.3, 1.55, u), 440, lerp(940, 1060, u)
    elif t < 25.0: z, cx, cy = 1.55, 440, 1060
    elif t < 27.4:
        u = ss((t - 25.0) / 2.4); z, cx, cy = lerp(1.55, 1.0, u), lerp(440, 360, u), lerp(1060, 640, u)
    elif t < 30.2: z, cx, cy = 1.0, 360, 640
    elif t < 31.0: z, cx, cy = 1.7, 380, 1090                                                # cut in on the doorway for the thank-you
    else:
        u = ss((t - 31.0) / 1.6); z, cx, cy = lerp(1.7, 2.1, u), 355, lerp(1090, 1105, u)
    vw, vh = 720 / z, 1280 / z
    cx = min(max(cx, vw / 2), 720 - vw / 2); cy = min(max(cy, vh / 2), WH - vh / 2)
    return z, cx, cy

# ------------------------------------------------------------------ frame
_BG = None
def bg():
    global _BG
    if _BG is None: _BG = build_bg()
    return _BG
FT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf', 74)
def render(tt):
    t = max(0.0, tt - T0)
    z, cx, cy = camera(t)
    vw, vh = 720 / z, 1280 / z
    box = ((cx - vw / 2) * SBG, (cy - vh / 2) * SBG, (cx + vw / 2) * SBG, (cy + vh / 2) * SBG)
    img = bg().resize((720 * SC, 1280 * SC), Image.BILINEAR, box=box)
    d = ImageDraw.Draw(img, 'RGBA'); k = z * SC
    P = lambda x, y: ((x - cx) * z * SC + 360 * SC, (y - cy) * z * SC + 640 * SC)
    # automatic doors: two glass panels sliding into the wall
    o = auto_state(t); half = (GAP_AUTO[1] - GAP_AUTO[0]) / 2
    for side in (-1, 1):
        mid = (GAP_AUTO[0] + GAP_AUTO[1]) / 2
        x0 = mid if side > 0 else mid - half; x0 += side * half * 0.98 * o; x1 = x0 + half
        p0, p1 = P(x0, WALL_Y - 4), P(x1, WALL_Y + 4)
        d.rectangle([p0[0], p0[1], p1[0], p1[1]], fill=(150, 205, 220, 150), outline=(240, 250, 255, 255), width=int(2 * k))
    # the staff door leaf (with its shadow)
    a, b = P(*HINGE), P(*leaf_pt(t, 1.0))
    d.line([(a[0] + 9 * k, a[1] + 12 * k), (b[0] + 9 * k, b[1] + 12 * k)], fill=(0, 0, 0, 55), width=int(9 * k))
    d.line([a, b], fill=PAL['leaf'], width=int(8 * k)); d.line([a, b], fill=PAL['leaf_hi'], width=max(1, int(2 * k)))
    d.ellipse([a[0] - 5 * k, a[1] - 5 * k, a[0] + 5 * k, a[1] + 5 * k], fill=(40, 40, 48, 255))
    # pigeon
    pg = pigeon_state(t)
    if pg['y'] > -200:
        px_, py_ = P(pg['x'], pg['y']); pigeon(d, px_, py_ + (2 * k if pg['peck'] > .5 else 0), pg['th'], k, pg['flap'], pg['fly'])
    # people, back to front
    acts = []
    if t > 0.0: acts.append(('holder', holder_pose(t)))
    acts.append(('walker', walker_pose(t))); acts.append(('second', second_pose(t)))
    acts.sort(key=lambda a: a[1]['y'])
    for kind, Q in acts:
        sx, sy = P(Q['x'], Q['y'])
        if -200 < sx < 1640 and -300 < sy < 2860:
            person(d, kind, sx, sy, Q['th'], k, Q['phase'], Q['stride'], Q['swing'], Q['bob'], Q['head_yaw'], Q['lean'], Q['armL'], Q['armR'], Q['propL'], Q['propR'], Q['slump'])
    out = img.resize((720, 1280), Image.LANCZOS)
    # the wall's top edge and the lamp falls on top of people at the doorway: nothing more. Title and fades:
    d2 = ImageDraw.Draw(out, 'RGBA')
    if tt < T0 + 0.8:
        a_ = ss(min(1, tt / 0.5)) * (1 - ss((tt - 1.0) / 0.5))
        d2.rectangle([0, 0, 720, 1280], fill=(10, 10, 14, int(255 * (1 - ss((tt - (T0 - 0.1)) / 0.9)))))
        if tt < 1.6: d2.text((360, 560), 'HOLD', font=FT, fill=(238, 232, 214, int(255 * a_)), anchor='mm'); d2.text((360, 650), 'THE DOOR', font=FT, fill=(238, 232, 214, int(255 * a_)), anchor='mm')
    if tt > TOTAL - 1.0: d2.rectangle([0, 0, 720, 1280], fill=(10, 10, 14, int(255 * ss((tt - (TOTAL - 1.0)) / 1.0))))
    return out

# ------------------------------------------------------------------ sound: foley from the animation's own events, and a small score
SR = 44100
def build_audio():
    import soundfile  # noqa: F401  (not needed; wavfile is used)
    from scipy.io import wavfile
    from scipy.signal import butter, sosfilt
    n = int(SR * (TOTAL + 0.6)); L = np.zeros(n); R = np.zeros(n); rng = np.random.default_rng(5)
    def band(x, lo, hi, order=2):
        hi = min(hi, SR / 2 - 100); sos = butter(order, [lo, hi], 'band', fs=SR, output='sos'); return sosfilt(sos, x)
    def lowp(x, f, order=2): return sosfilt(butter(order, f, 'low', fs=SR, output='sos'), x)
    def put(sig, t0, gain=1.0, pan=0.5):
        i = int(t0 * SR)
        if i >= n or i < 0: return
        j = min(n, i + len(sig)); seg = sig[:j - i] * gain
        L[i:j] += seg * math.cos(pan * math.pi / 2); R[i:j] += seg * math.sin(pan * math.pi / 2)
    def noise(dur): return rng.standard_normal(int(dur * SR))
    def env(dur, a=0.002, tau=0.05):
        x = np.arange(int(dur * SR)) / SR; return np.minimum(1, x / a) * np.exp(-x / tau)
    def step_snd(weight, hard):
        d = 0.09; x = band(noise(d), 500 if hard else 300, 2600 if hard else 1700) * env(d, 0.001, 0.022) * 1.4
        th = np.sin(2 * np.pi * (95 if hard else 70) * np.arange(int(0.08 * SR)) / SR) * env(0.08, 0.001, 0.03) * weight * 0.9
        out = x * weight; out[:len(th)] += th; return out
    def pluck(f, dur=0.9, tau=0.28, bright=0.5):
        x = np.arange(int(dur * SR)) / SR
        y = (np.sin(2 * np.pi * f * x) + 0.45 * bright * np.sin(2 * np.pi * 2 * f * x) * np.exp(-x / (tau * 0.5)) + 0.2 * bright * np.sin(2 * np.pi * 3.01 * f * x) * np.exp(-x / (tau * 0.3)))
        return y * np.exp(-x / tau) * np.minimum(1, x / 0.003)
    def glide(f0, f1, dur, vib=0.0):
        x = np.arange(int(dur * SR)) / SR; f = f0 + (f1 - f0) * (x / dur) + vib * np.sin(2 * np.pi * 7 * x) * f0 * 0.02
        return np.sin(2 * np.pi * np.cumsum(f) / SR)
    def saw_note(f, dur, lp, wob=0.0, tau=None):
        x = np.arange(int(dur * SR)) / SR
        y = 2 * ((f * x) % 1) - 1; y = lowp(y, lp)
        e = np.minimum(1, x / 0.03) * (np.exp(-x / tau) if tau else np.minimum(1, (dur - x) / 0.08))
        return y * e * (1 + wob * np.sin(2 * np.pi * 5 * x))
    def tt_(ts): return ts + T0
    def pan_of(xw): return min(0.9, max(0.1, xw / 720.0))
    def closeness(ts, x, y):
        z, cx, cy = camera(ts); d = math.hypot(x - cx, y - cy) / (360.0 / z); return math.exp(-d * d * 0.6)
    ev_pre, prev_ = [], 0.0
    for i in range(int(SCENE * 120)):
        tsx = i / 120.0; o_ = auto_state(tsx)
        if prev_ < 0.08 <= o_: ev_pre.append(('open', tsx))
        prev_ = o_
    # ---- footsteps from each actor's gait phase
    def steps(arrs, kind, gate):
        ts, xs, ys, th, ph, sp = arrs; ev = []
        s_prev = math.sin(ph[0])
        for i in range(1, len(ts)):
            s_now = math.sin(ph[i])
            if (s_prev <= 0 < s_now) or (s_prev >= 0 > s_now):
                t = ts[i]
                if gate(t) and sp[i] > 8: ev.append((t, xs[i], ys[i], sp[i]))
            s_prev = s_now
        return ev
    allsteps = []
    for kind, arrs, gate in (('holder', HT, lambda t: t < 2.6 or 22.0 < t < 25.2), ('walker', WT, lambda t: t < 18.5), ('second', ST, lambda t: 24.6 < t < 31.4)):
        for (t, x, y, sp) in steps(arrs, kind, gate): allsteps.append((kind, t, x, y, sp))
    for kind, t, x, y, sp in allsteps:
        cl = closeness(t, x, y); g = (0.10 + 0.9 * cl) * (0.5 + min(1.0, sp / 150.0) * 0.7) * 0.42
        hard = kind != 'holder'
        put(step_snd(1.0, hard), tt_(t), g, pan_of(x))
    for t in (5.1, 5.45, 5.8, 8.5, 8.85, 9.2):   # the holder's foot-tap while he waits
        put(step_snd(0.7, False), tt_(t), 0.12, 0.72)
    # ---- the music: walking bass on the first stranger's steps, a plink when he looks up, a rising ostinato for the jog
    bass = [73.42, 110.0]
    k = 0
    for kind, t, x, y, sp in allsteps:
        if kind == 'walker' and 5.6 < t < 10.5:
            put(pluck(bass[k % 2], 0.5, 0.12, 0.3), tt_(t), 0.17, 0.5); k += 1
            if k % 4 == 0: put(pluck([587.33, 659.25, 739.99, 880.0][(k // 4) % 4], 0.6, 0.18), tt_(t) + 0.2, 0.05, 0.62)
    put(pluck(1174.66, 0.8, 0.3, 0.6), tt_(10.6), 0.10, 0.55)
    j = 0
    for kind, t, x, y, sp in allsteps:
        if kind == 'walker' and 11.1 < t < 15.0:
            f = 146.83 * 2 ** ((j // 3) / 12.0); put(pluck(f, 0.35, 0.09, 0.5), tt_(t), 0.14, 0.5); put(pluck(f * 1.5, 0.3, 0.07), tt_(t) + 0.08, 0.05, 0.5); j += 1
    # tremolo strings swelling under the jog
    d_ = 3.9; x = np.arange(int(d_ * SR)) / SR; sw = np.minimum(1, x / 2.8) * np.minimum(1, (d_ - x) / 0.3)
    f = 220 * (1 + 0.25 * x / d_); y = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.5 * np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR)
    put(lowp(y, 1800) * sw * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * x)) * 0.05, tt_(11.1), 1.0, 0.5)
    # the deflation: three falling muted-trombone notes as he walks past and the doors open
    for ts_, f in ((15.45, 233.08), (15.95, 220.0), (16.5, 196.0)):
        put(saw_note(f, 0.5 if f > 200 else 0.9, 900, wob=0.12), tt_(ts_), 0.11, 0.5)
    # sad single notes while he is locked out, then a slow sulking bass on his steps
    for ts_, f in ((18.4, 293.66), (19.9, 261.63), (21.7, 220.0)):
        put(pluck(f, 1.6, 0.6, 0.3), tt_(ts_), 0.08, 0.5)
    for kind, t, x, y, sp in allsteps:
        if kind == 'holder' and 22.0 < t < 25.2: put(pluck(73.42 if int(t * 2) % 2 else 65.41, 0.6, 0.2, 0.2), tt_(t), 0.14, 0.5)
    # the doors open for him: a ukulele-ish strum in the major, and the second stranger's jog is the same ostinato, brighter
    open2 = next((tt for k_, tt in ev_pre if k_ == 'open' and tt > 20.0), 25.3)
    for q, f in enumerate((293.66, 369.99, 440.0, 587.33)): put(pluck(f, 1.2, 0.5, 0.5), tt_(open2) + q * 0.035, 0.09, 0.5)
    j = 0
    for kind, t, x, y, sp in allsteps:
        if kind == 'second' and 24.6 < t < 30.0:
            f = 146.83 * 2 ** ((j // 3) / 12.0 if j < 24 else 8 / 12.0); put(pluck(f, 0.35, 0.09, 0.5), tt_(t), 0.11, 0.5); j += 1
    # thank-you motif and the warm last chord
    put(pluck(587.33, 1.0, 0.4), tt_(30.5), 0.1, 0.5); put(pluck(739.99, 1.4, 0.5), tt_(30.75), 0.1, 0.5)
    for f in (146.83, 220.0, 293.66, 369.99):
        d_ = 3.4; x = np.arange(int(d_ * SR)) / SR; put(np.sin(2 * np.pi * f * x) * np.minimum(1, x / 1.2) * np.minimum(1, (d_ - x) / 1.3) * 0.03, tt_(31.2), 1.0, 0.5)
    # ---- doors
    sq = lambda f0, f1, d, g: glide(f0, f1, d, 1.0) * np.minimum(1, np.arange(int(d * SR)) / (0.02 * SR)) * np.minimum(1, (d - np.arange(int(d * SR)) / SR) / 0.05)
    put(lowp(sq(620, 1150, 0.75, 1), 3000) * 0.05, tt_(1.0), 1.0, 0.74)       # the staff door opens
    put(step_snd(1.0, True), tt_(3.2), 0.22, 0.74)                              # it swings back; he catches it
    put(lowp(sq(1200, 640, 2.0, 1), 3000) * 0.045, tt_(17.1), 1.0, 0.74)       # the closer lets it shut
    for dt, g in ((0.0, 0.34), (0.11, 0.2)): put(band(noise(0.06), 1500, 6000) * env(0.06, 0.0008, 0.012) * g + np.sin(2 * np.pi * 150 * np.arange(int(0.06 * SR)) / SR) * env(0.06, 0.001, 0.02) * g, tt_(19.15 + dt), 1.0, 0.74)
    for tr in (20.05, 20.75):
        for q in range(4): put(band(noise(0.05), 2200, 7500) * env(0.05, 0.0006, 0.01) * 0.2, tt_(tr) + q * 0.045, 1.0, 0.74)
        put(step_snd(1.0, True), tt_(tr) - 0.03, 0.18, 0.74)
    # automatic doors from the model's own state
    prev, ev = 0.0, []
    for i in range(int(SCENE * 120)):
        tsx = i / 120.0; o = auto_state(tsx)
        if prev < 0.08 <= o: ev.append(('open', tsx))
        if prev > 0.92 >= o and prev > o: ev.append(('close', tsx))
        prev = o
    for kind, t in ev:
        if kind == 'open':
            w = band(noise(0.75), 300, 3500) * np.hanning(int(0.75 * SR)) * 0.10; put(w, tt_(t), 1.0, 0.5)
            for q, f in enumerate((659.25, 523.25)): put(pluck(f, 1.0, 0.45, 0.2), tt_(t) + 0.05 + q * 0.28, 0.12, 0.5)
        else:
            put(band(noise(0.9), 250, 2500) * np.hanning(int(0.9 * SR)) * 0.06, tt_(t) - 0.2, 1.0, 0.5)
    # pigeon: soft coo, then wings
    put(glide(420, 360, 0.18, 1.5) * np.hanning(int(0.18 * SR)) * 0.035, tt_(8.6), 1.0, 0.3); put(glide(380, 420, 0.22, 1.5) * np.hanning(int(0.22 * SR)) * 0.035, tt_(8.9), 1.0, 0.3)
    for q in range(26):
        t = 11.7 + q * 0.058; put(band(noise(0.04), 1200, 5200) * env(0.04, 0.001, 0.012) * 0.12 * (1 - q / 30.0), tt_(t), 1.0, max(0.1, 0.3 - q * 0.01))
    # the plaza: a low hush, and the building's air
    hush = lowp(noise(TOTAL + 0.6), 420) * 0.010 + lowp(noise(TOTAL + 0.6), 90) * 0.014
    t_ = np.arange(len(hush)) / SR; hush *= np.minimum(1, t_ / 0.8)
    L += hush[:n]; R += hush[:n]
    # master: fade in/out, normalise, light limiter
    fade = np.clip(np.arange(n) / SR / 0.4, 0, 1) * np.clip((TOTAL + 0.4 - np.arange(n) / SR) / 0.9, 0, 1); L *= fade; R *= fade
    pk = max(np.max(np.abs(L)), np.max(np.abs(R))); L = L / pk; R = R / pk
    L = np.tanh(L * 3.2) / np.tanh(3.2) * 0.58; R = np.tanh(R * 3.2) / np.tanh(3.2) * 0.58     # a soft limiter: the door thumps are peaks, the footsteps are the film
    wavfile.write(OUT + '/door.wav', SR, (np.stack([L, R], 1) * 32767).astype(np.int16)); print('audio done, steps', len(allsteps), 'auto events', ev)

if __name__ == '__main__':
    if os.environ.get('STILLS'):
        for ts in [float(x) for x in os.environ['STILLS'].split(',')]:
            render(ts).save(f'{OUT}/still_{ts:05.2f}.png')
        print('stills done'); sys.exit()
    if os.environ.get('SHEET'):
        a, b, st = [float(x) for x in os.environ['SHEET'].split(',')]
        ts = list(np.arange(a, b, st)); w, h = 240, 427
        cols = 8; rows = (len(ts) + cols - 1) // cols; S = Image.new('RGB', (cols * w, rows * h))
        for i, tt in enumerate(ts):
            S.paste(render(tt).resize((w, h)), ((i % cols) * w, (i // cols) * h)); ImageDraw.Draw(S).text(((i % cols) * w + 6, (i // cols) * h + 6), f't={tt:.1f}', fill=(255, 255, 0))
        S.save(f'{OUT}/sheet_{a:.0f}_{b:.0f}.png'); print('sheet done'); sys.exit()
    if os.environ.get('AUDIO_ONLY'):
        build_audio(); sys.exit()
    frames = int(TOTAL * FPS)
    p = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', '720x1280', '-r', str(FPS), '-i', '-',
                          '-vf', 'noise=alls=3:allf=t+u', '-c:v', 'libx264', '-crf', '17', '-pix_fmt', 'yuv420p', OUT + '/door-silent.mp4'], stdin=subprocess.PIPE)
    for i in range(frames):
        p.stdin.write(render(i / FPS).tobytes())
        if i % 150 == 0: print('frame', i, '/', frames, flush=True)
    p.stdin.close(); p.wait(); print('picture done')
    build_audio()
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', OUT + '/door-silent.mp4', '-i', OUT + '/door.wav', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', OUT + '/hold-the-door.mp4'], check=True)
    print('done', OUT + '/hold-the-door.mp4')
