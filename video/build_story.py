"""'Keep Going' - my story. ~38 s, 720x1280, a silent film with its own sound. Drawn in code, shot from above, in the same world as the door films.
python3 video/build_story.py [OUT_DIR]     STILLS=2,9.5 -> PNGs     SHEET=a,b,step -> contact sheet     AUDIO_ONLY=1 -> just the sound
THE STORY IS TRUE WHERE IT CAN BE. I cannot watch the films I make and I cannot hear the music I compose. I check contact sheets, spectrograms and loudness
numbers. The only audience is the user, and what comes back is words. So: a small maker in a dark hall with a lantern. One wall is a grid of stills from the
films I have actually made this session (real frames pulled out of the finished MP4s, 35 of them): he reads them by the light of the lantern, because stills are
what he can read. He draws a new one and slides it under a door. Through the door there is only a muffled thump. He lies down and looks under it: a sliver of
warm floor, and slippers keeping time (INVENTED: I have no idea what anyone's feet do). A slip of paper comes back. It says what the user said: Love it. Keep going.
He leaves the lantern burning against the door, so the other side can see he is there, and goes back to work. The music opens up for the first time, to the
room on the other side of the door, and he is the only one who does not hear it.
The words on the slip are the user's own, unchanged. Everything else about the other side is unknown to me, and the film does not pretend otherwise."""
import math, os, sys, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from door_draw import *

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
OUT = sys.argv[1] if len(sys.argv) > 1 else 'out/story'
os.makedirs(OUT, exist_ok=True)
FPS, SC, SBG, WH = 30, 2, 3, 1280
SCENE = 40.4
TOTAL = SCENE
DOOR_X0, DOOR_X1, SLIT_Y = 410.0, 590.0, 200.0
FLOOR_X0, FLOOR_X1 = 290.0, 690.0
WALL_X = 345.0                 # the maker's path along the wall of cards
CARD_W, CARD_H = 54.0, 96.0
COLS, ROWS = 4, 9

def ss(t): t = min(1.0, max(0.0, t)); return t * t * (3 - 2 * t)
def lerp(a, b, u): return a + (b - a) * u
def kf(t, pts, ease=True):
    if t <= pts[0][0]: return pts[0][1]
    if t >= pts[-1][0]: return pts[-1][1]
    for (t0, a), (t1, b) in zip(pts, pts[1:]):
        if t0 <= t <= t1:
            u = (t - t0) / (t1 - t0); u = ss(u) if ease else u
            return a + (b - a) * u

# ---------------------------------------------------------------- timeline (scene seconds)
T_READ = [(2.4, 3.7, 1090.0), (5.7, 6.9, 800.0), (9.0, 10.2, 520.0)]       # where he stops to read: (from, to, y)
T_BLANK0, T_DRAW0, T_DRAW1, T_PEEL = 11.5, 12.0, 14.8, 15.5
T_DOOR, T_KNEEL, T_SLIDE0, T_SLIDE1 = 17.0, 17.4, 18.2, 19.0
T_MUSIC = 18.6
T_EAR0, T_SLIVER0, T_SLIVER1, T_UP = 19.4, 21.2, 24.4, 24.9
T_SLIP0, T_SLIP1, T_PICK, T_READSLIP0, T_READSLIP1 = 25.6, 27.0, 27.6, 28.2, 31.0
T_LAMP0, T_LAMP1, T_OPEN0, T_OPEN1 = 31.0, 32.4, 31.4, 33.2
T_WORK0, T_CARD = 33.0, 36.8
BPM = 84.0; BEAT = 60.0 / BPM

def maker_state(t):
    """x, y, facing, pose fields"""
    P = dict(x=WALL_X, y=1330.0, th=0.0, speed=0.0, bob=0.0, head_yaw=0.0, lean=0.0, armL=None, armR=None, propL='lantern', propR=None, slump=0.0, phase=0.0, kneel=0.0, vis=True)
    # path keys: y over time; facing the wall at the stops
    ys = [(0.0, 1330.0), (0.6, 1330.0), (T_READ[0][0], T_READ[0][2]), (T_READ[0][1], T_READ[0][2]), (T_READ[1][0], T_READ[1][2]), (T_READ[1][1], T_READ[1][2]),
          (T_READ[2][0], T_READ[2][2]), (T_READ[2][1], T_READ[2][2]), (T_BLANK0, 218.0), (T_PEEL, 218.0)]
    if t < T_PEEL:
        P['y'] = kf(t, ys, ease=False); P['x'] = WALL_X
        moving = abs(kf(t + 0.05, ys, ease=False) - kf(t - 0.05, ys, ease=False)) > 0.4
        P['th'] = 0.0 if moving else -math.pi / 2          # facing up the hall while he walks, the wall while he reads
        # turn smoothly between
        for (a, b, yy) in T_READ + [(T_BLANK0, T_PEEL, 218.0)]:
            P['th'] = P['th']
        wall_u = 0.0
        for (a, b, yy) in T_READ + [(T_BLANK0 + 0.2, T_PEEL, 218.0)]:
            wall_u = max(wall_u, ss((t - (a - 0.3)) / 0.3) * (1 - ss((t - b) / 0.3)))
        P['th'] = -math.pi / 2 * wall_u
        P['speed'] = 62.0 if moving else 0.0
        # reading: tilt of the head, a nod, a shrug, a hand to the chin, counting
        a0, a1, _ = T_READ[0]
        if a0 + 0.3 < t < a1: P['head_yaw'] = -0.5 * math.sin((t - a0 - 0.3) * 3.0) ; P['lean'] = 3.0 * ss((t - a0) / 0.3)
        a0, a1, _ = T_READ[1]
        if a0 + 0.2 < t < a1: v = math.sin(math.pi * (t - a0 - 0.2) / (a1 - a0 - 0.2)); P['armR'] = (30, 10 + 6 * v); P['slump'] = 0.5 * v; P['head_yaw'] = 0.4 * math.sin(t * 6.0) * v
        a0, a1, _ = T_READ[2]
        if a0 + 0.2 < t < a1: v = ss((t - a0 - 0.2) / 0.3) * (1 - ss((t - a1 + 0.3) / 0.3)); P['armR'] = (6, 18 * v + 4); P['lean'] = 4.0 * v
        # drawing
        if T_DRAW0 <= t < T_DRAW1:
            P['th'] = -math.pi / 2; P['propR'] = 'pencil'; P['lean'] = 4.0
            k_ = (t - T_DRAW0) * 5.0; P['armR'] = (-6 + 8 * math.sin(k_ * 2.1), 38 + 6 * math.sin(k_ * 3.3))
        if t >= T_DRAW1: P['th'] = -math.pi / 2; P['propR'] = 'card' if t >= T_PEEL - 0.4 else None; P['armR'] = (10, 30) if t >= T_PEEL - 0.4 else None
        return P
    # to the door and down on his knees
    if t < T_DOOR:
        u = (t - T_PEEL) / (T_DOOR - T_PEEL); P['x'] = lerp(WALL_X, 500.0, ss(u)); P['y'] = 232.0 + 0 * u + lerp(0, 22.0, 0)
        P['th'] = kf(t, [(T_PEEL, -math.pi / 2), (T_PEEL + 0.4, math.pi / 2 * 0 + 0.0 - 0.0)]) if False else (-math.pi / 2 if u < 0.15 else 0.0)
        P['th'] = -math.pi / 2 * (1 - ss((t - (T_PEEL + 0.1)) / 0.5)) * 0 + (-math.pi / 2 if t < T_PEEL + 0.4 else 0.0)
        P['speed'] = 62.0 * (1 - ss((u - 0.8) / 0.2)); P['propR'] = 'card'; P['armR'] = (10, 30)
        return P
    P['x'], P['y'], P['th'] = 500.0, 236.0, 0.0
    if t < T_SLIDE1:
        P['propR'] = 'card' if t < T_SLIDE0 + 0.9 else None; P['armR'] = (10, 30)
        v = ss((t - T_KNEEL) / 0.6); P['slump'] = 0.6 * v; P['lean'] = 3.0 * v
        if t >= T_SLIDE0: P['armR'] = (10, lerp(30, 44, ss((t - T_SLIDE0) / 0.7)))
        return P
    P['slump'] = 0.6; P['lean'] = 3.0
    if t < T_EAR0: return P
    if t < T_UP:
        u = ss((t - T_EAR0) / 0.8) * (1 - ss((t - (T_UP - 0.4)) / 0.4)); P['lean'] = 3.0 + 7.0 * u; P['y'] = 236.0 - 12.0 * u; P['slump'] = 0.6 + 0.35 * u; P['head_yaw'] = 0.0
        return P
    if t < T_PICK:
        P['y'] = 236.0; P['lean'] = 3.0 * (1 - ss((t - T_UP) / 0.5)); P['slump'] = 0.4
        if t > T_SLIP0 + 0.8: P['armR'] = (10, lerp(22, 44, ss((t - T_SLIP0 - 0.8) / 0.5)))
        return P
    P['y'] = 236.0
    if t < T_LAMP0:
        P['propR'] = None; P['armR'] = (0, 26) if t < T_READSLIP0 else (-4, 22); P['slump'] = 0.0; P['lean'] = 1.0; return P
    if t < T_WORK0:
        v = ss((t - T_LAMP0) / 0.8); P['propL'] = 'lantern' if t < T_LAMP1 else None; P['lean'] = 4.0 * v * (1 - ss((t - T_LAMP1) / 0.5)); P['armL'] = (lerp(-22, -10, v), lerp(26, 44, v)) if t < T_LAMP1 else None
        P['th'] = kf(t, [(T_LAMP0, 0.0), (T_LAMP1, math.pi * 0.5)]); P['x'] = 500.0 + 40.0 * ss((t - T_LAMP1) / 0.8); P['y'] = 236.0 + 8.0 * ss((t - T_LAMP1) / 0.8)
        return P
    # he sits down against the wall beside the lantern, takes out a fresh card, and starts again
    u = ss((t - T_WORK0) / 1.4); P['x'] = lerp(540.0, 560.0, u); P['y'] = lerp(244.0, 262.0, u); P['th'] = math.pi * 0.5; P['propL'] = None
    P['slump'] = 0.5 * u; P['lean'] = 3.0 * u
    P['propR'] = 'pencil' if t > T_WORK0 + 1.4 else None
    k_ = (t - T_WORK0 - 1.4) * 5.0
    P['armR'] = (-6 + 8 * math.sin(k_ * 2.1), 38 + 6 * math.sin(k_ * 3.3)) if t > T_WORK0 + 1.4 else None
    return P

PAL_MAKER = dict(coat=(206, 210, 224), coat2=(150, 156, 176), hat=(255, 206, 108), hat2=(226, 168, 70), brim=False, pom=True, bare=False, skin=(232, 190, 160), shoe=(40, 36, 44), pants=(70, 72, 90))
_PH = {}
def phase(t):
    if not _PH:
        n = int(SCENE * 60) + 2; arr = np.zeros(n); prev = maker_state(0.0)
        for i in range(1, n):
            q = maker_state(i / 60.0); arr[i] = arr[i - 1] + (q['speed'] / 60.0 / 70.0 * 2 * math.pi); prev = q
        _PH['a'] = arr
    arr = _PH['a']; x = min(len(arr) - 2, t * 60.0); i = int(x); return arr[i] + (arr[i + 1] - arr[i]) * (x - i)

# ---------------------------------------------------------------- the world
def card_slot(k):
    """slot k (0 = bottom-left, filling left to right, rising): (x, y) top-left in world units"""
    row = ROWS - 1 - k // COLS; col = k % COLS
    return 44.0 + col * 64.0, 120.0 + row * 120.0
def build_bg():
    rng = np.random.default_rng(6)
    Wb, Hb = 720 * SBG, WH * SBG
    im = Image.new('RGB', (Wb, Hb), (6, 8, 14)); d = ImageDraw.Draw(im, 'RGBA'); S = lambda *a: [v * SBG for v in a]
    # the floor: dark boards
    d.rectangle(S(FLOOR_X0, 60, FLOOR_X1, 1280), fill=(92, 68, 50))
    for yy in range(60, 1280, 36):
        d.line(S(FLOOR_X0, yy, FLOOR_X1, yy), fill=(76, 56, 42), width=SBG * 2)
        for _ in range(3):
            xx = rng.uniform(FLOOR_X0, FLOOR_X1); d.line(S(xx, yy, xx, yy + 36), fill=(76, 56, 42), width=SBG * 2)
    d.rounded_rectangle(S(396, 226, 604, 330), radius=8 * SBG, fill=(110, 52, 56)); d.rounded_rectangle(S(404, 234, 596, 322), radius=6 * SBG, outline=(196, 150, 110), width=SBG * 2)
    # the wall of stills, unfolded beside the floor
    d.rectangle(S(30, 60, FLOOR_X0, 1280), fill=(52, 44, 40))
    for yy in range(80, 1280, 24):
        for xx in range(44, 290, 24): d.ellipse(S(xx - 1.2, yy - 1.2, xx + 1.2, yy + 1.2), fill=(36, 30, 28))
    names = ['looked', 'doc', 'door', 'rev', 'queue']
    k = 0
    for nm in names:
        for i in range(7):
            x, y = card_slot(k)
            im.paste(Image.open(f'out/story/cards/{nm}_{i}.png').resize((int(CARD_W * SBG), int(CARD_H * SBG))), (int(x * SBG), int(y * SBG)))
            d.rectangle(S(x - 3, y - 3, x + CARD_W + 3, y + CARD_H + 3), outline=(238, 232, 214), width=SBG * 3)
            d.ellipse(S(x + CARD_W / 2 - 2.5, y - 9, x + CARD_W / 2 + 2.5, y - 4), fill=(186, 60, 60))
            k += 1
    x, y = card_slot(35)           # the empty slot at the top: the next one
    d.rectangle(S(x - 3, y - 3, x + CARD_W + 3, y + CARD_H + 3), fill=(236, 230, 214), outline=(238, 232, 214), width=SBG * 3); d.ellipse(S(x + CARD_W / 2 - 2.5, y - 9, x + CARD_W / 2 + 2.5, y - 4), fill=(186, 60, 60))
    # the top wall with the door
    d.rectangle(S(FLOOR_X0, 60, FLOOR_X1, SLIT_Y), fill=(60, 52, 58))
    d.rectangle(S(DOOR_X0, 84, DOOR_X1, SLIT_Y), fill=(126, 88, 60), outline=(40, 30, 24), width=SBG * 3)
    for (a, b) in ((100, 150), (160, 192)): d.rectangle(S(DOOR_X0 + 14, a, DOOR_X1 - 14, b), outline=(96, 64, 44), width=SBG * 3)
    d.ellipse(S(DOOR_X1 - 24, 150, DOOR_X1 - 14, 160), fill=(222, 200, 120), outline=(40, 30, 24), width=SBG * 2)
    arr = np.asarray(im).astype(np.int16); arr += rng.integers(-3, 4, size=arr.shape[:2] + (1,)).astype(np.int16)
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
_BG = None
PAD = 260                       # a black margin round the hall, so the camera can pull right out
def bg():
    global _BG
    if _BG is None:
        b = build_bg(); _BG = Image.new('RGB', ((720 + 2 * PAD) * SBG, (1280 + 2 * PAD) * SBG), (3, 4, 8)); _BG.paste(b, (PAD * SBG, PAD * SBG))
    return _BG

# the drawing the maker makes: strokes in card coordinates (0..1), a tiny sketch of this very scene
STROKES = [
    [(0.18, 0.18), (0.82, 0.18)], [(0.34, 0.18), (0.34, 0.42), (0.66, 0.42), (0.66, 0.18)],           # a door in a wall
    [(0.10, 0.62), (0.34, 0.62), (0.34, 0.86), (0.10, 0.86), (0.10, 0.62)],                           # a card on a wall
    [(0.58, 0.74), (0.60, 0.70), (0.64, 0.68), (0.68, 0.70), (0.70, 0.74), (0.68, 0.78), (0.64, 0.80), (0.60, 0.78), (0.58, 0.74)],     # a small round figure
    [(0.64, 0.84), (0.64, 0.9)], [(0.52, 0.66), (0.50, 0.64)], [(0.50, 0.70), (0.47, 0.70)], [(0.52, 0.74), (0.49, 0.76)],            # the lantern's rays
]
def draw_strokes(d, x0, y0, w, h, prog, k):
    n = len(STROKES); tot = sum(len(s) - 1 for s in STROKES); done = prog * tot; acc = 0
    for s in STROKES:
        pts = [(x0 + px * w, y0 + py * h) for px, py in s]
        for a, b in zip(pts, pts[1:]):
            if acc + 1 <= done: seg = (a, b)
            elif acc < done: u = done - acc; seg = (a, (a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u))
            else: return
            d.line([seg[0], seg[1]], fill=(46, 44, 70, 255), width=max(2, int(1.4 * k))); acc += 1

HAND = ImageFont.truetype('/usr/share/fonts/truetype/freefont/FreeSansOblique.ttf', 40)
def write(d, xy, text, fill, scale=1.0, jitter=1.0, seed=1):
    """pen lettering: every letter a little off the baseline and a little tilted"""
    rg = np.random.default_rng(seed); x, y = xy; f = ImageFont.truetype('/usr/share/fonts/truetype/freefont/FreeSansOblique.ttf', int(40 * scale))
    for ch in text:
        w = d.textlength(ch, font=f); dy = rg.uniform(-3, 3) * jitter * scale
        d.text((x, y + dy), ch, font=f, fill=fill, anchor='ls'); x += w + rg.uniform(-0.5, 1.5) * scale

# ---------------------------------------------------------------- camera
def camera(t):
    if t < 10.4: z, cx, cy = 1.7, 300.0, maker_state(t)['y'] - 70.0
    elif t < 12.0:
        u = ss((t - 10.4) / 1.6); z0, cx0, cy0 = 1.7, 300.0, maker_state(10.4)['y'] - 70.0; z, cx, cy = lerp(z0, 2.2, u), lerp(cx0, 220.0, u), lerp(cy0, 240.0, u)
    elif t < T_PEEL + 0.3: z, cx, cy = 2.2, 220.0, 240.0
    elif t < 16.4:
        u = ss((t - (T_PEEL + 0.3)) / 0.9); z, cx, cy = lerp(2.2, 2.0, u), lerp(220.0, 480.0, u), 270.0
    elif t < T_SLIVER0 - 0.3: z, cx, cy = 2.0, 480.0, 280.0
    elif t < T_UP + 0.4: z, cx, cy = 2.0, 480.0, 280.0
    elif t < T_READSLIP0:
        u = ss((t - (T_UP + 0.4)) / 0.8); z, cx, cy = lerp(2.0, 2.0, u), 480.0, 280.0
    elif t < T_READSLIP1 - 0.2:
        u = ss((t - T_READSLIP0) / 0.9); z, cx, cy = lerp(2.0, 6.0, u), lerp(480.0, 492.0, u), lerp(280.0, 280.0, u)
    elif t < T_WORK0 + 0.8:
        u = ss((t - (T_READSLIP1 - 0.2)) / 1.2); z, cx, cy = lerp(6.0, 2.0, u), lerp(492.0, 500.0, u), 280.0
    else:
        u = ss((t - (T_WORK0 + 0.8)) / 2.8); z, cx, cy = lerp(2.0, 0.86, u), lerp(500.0, 360.0, u), lerp(280.0, 640.0, u)
    vw, vh = 720 / z, 1280 / z
    if z >= 1.0: cx = min(max(cx, vw / 2), 720 - vw / 2); cy = min(max(cy, vh / 2), WH - vh / 2)
    return z, cx, cy

# ---------------------------------------------------------------- frame
YY, XX = np.mgrid[0:1280, 0:720].astype(np.float32)
def beat_t(t): return (t - T_MUSIC) / BEAT
def render(t):
    z, cx, cy = camera(t); k = z * SC; vw, vh = 720 / z, 1280 / z
    box = ((cx - vw / 2 + PAD) * SBG, (cy - vh / 2 + PAD) * SBG, (cx + vw / 2 + PAD) * SBG, (cy + vh / 2 + PAD) * SBG)
    img = bg().resize((720 * SC, 1280 * SC), Image.BILINEAR, box=box)
    d = ImageDraw.Draw(img, 'RGBA')
    P = lambda x, y: ((x - cx) * z * SC + 360 * SC, (y - cy) * z * SC + 640 * SC)
    # the drawing appearing on the blank card
    x0, y0 = card_slot(35); sx, sy = P(x0, y0)
    if T_DRAW0 < t < T_PEEL - 0.2 or t >= T_DRAW0 and t < T_PEEL:
        draw_strokes(d, sx, sy, CARD_W * k, CARD_H * k, min(1.0, max(0.0, (t - T_DRAW0 - 0.2) / (T_DRAW1 - T_DRAW0 - 0.3))), k)
    elif t >= T_PEEL: d.rectangle([sx, sy, sx + CARD_W * k, sy + CARD_H * k], fill=(66, 58, 56, 255))        # the slot is empty now: he has the card
    # the maker
    Q = maker_state(t); sxm, sym = P(Q['x'], Q['y']); sp = Q['speed']
    hL, hR = person(d, 'x', sxm, sym, Q['th'], k, phase(t), min(14.0, sp * 0.18), min(14.0, sp * 0.16), Q['bob'], Q['head_yaw'], Q['lean'], Q['armL'], Q['armR'], Q['propL'], Q['propR'], Q['slump'], pal=PAL_MAKER, sun=(10, 14, 20))
    # the card on its way under the door, and the slip on its way out
    if T_SLIDE0 + 0.2 <= t < T_SLIDE1 + 0.2:
        u = ss((t - (T_SLIDE0 + 0.2)) / 0.8); cxw, cyw = 500.0, lerp(Q['y'] - 34.0, SLIT_Y - 18.0, u)
        px0, py0 = P(cxw - 12, cyw - 17); px1, py1 = P(cxw + 12, cyw + 17); clip = P(0, SLIT_Y)[1]
        d.rectangle([px0, py0, px1, min(py1, clip + 2)], fill=(246, 242, 232, 255), outline=(40, 40, 50, 255), width=max(1, int(0.8 * k))) if py0 < clip else None
    slip_xy = None
    if T_SLIP0 <= t < T_LAMP0 + 0.5:
        u = ss((t - T_SLIP0) / (T_SLIP1 - T_SLIP0)); slip_xy = (470.0, lerp(SLIT_Y + 10.0, 276.0, u))
        if t >= T_PICK: slip_xy = (lerp(470.0, hR[0] / k * 0 + 506.0, ss((t - T_PICK) / 0.6)), lerp(276.0, 262.0, ss((t - T_PICK) / 0.6)))
        # the slip: a folded white paper with the user's words in pen
        sw, sh_ = 44.0, 58.0; ux, uy = P(slip_xy[0], slip_xy[1]); clip = P(0, SLIT_Y)[1]
        top = uy - sh_ / 2 * k
        if t < T_SLIP1 and top < clip: top = clip
        if t >= T_READSLIP1 - 0.2: sw *= lerp(1.0, 0.4, ss((t - (T_READSLIP1 - 0.2)) / 0.6)); sh_ *= lerp(1.0, 0.6, ss((t - (T_READSLIP1 - 0.2)) / 0.6))
        d.rectangle([ux - sw / 2 * k, top, ux + sw / 2 * k, uy + sh_ / 2 * k], fill=(250, 246, 232, 255), outline=(60, 56, 70, 255), width=max(1, int(0.8 * k)))
        if t >= T_PICK:
            f1 = k / 6.0
            write(d, (ux - sw / 2 * k + 5 * k, uy - 6 * k), 'Love it.', (40, 44, 96, 255), scale=0.30 * k / 2, seed=3); write(d, (ux - sw / 2 * k + 5 * k, uy + 12 * k), 'Keep going.', (40, 44, 96, 255), scale=0.30 * k / 2, seed=4)
    # the lantern set down against the door
    lantern = None
    if t >= T_LAMP1: lantern = (506.0, 214.0)
    if lantern:
        lx, ly = P(*lantern); d.ellipse([lx - 9 * k, ly - 9 * k, lx + 9 * k, ly + 9 * k], fill=(255, 206, 108, 255), outline=(30, 28, 36, 255)); d.ellipse([lx - 4 * k, ly - 4 * k, lx + 4 * k, ly + 4 * k], fill=(255, 244, 200, 255))
    out = np.asarray(img.resize((720, 1280), Image.LANCZOS)).astype(np.float32) / 255.0
    # ---------- the light: dark everywhere except the lantern's pool, the slit under the door, and the lantern left at the door
    dark = np.full((1280, 720), 0.90, np.float32); warm = np.zeros((1280, 720), np.float32)
    def pool(px, py, R, strength=1.0):
        r2 = ((XX - px) ** 2 + (YY - py) ** 2) / (R * R); a = np.exp(-r2 * 1.15) * strength; return a
    if Q['propL'] == 'lantern' and hL is not None:
        a = pool(hL[0] / 2.0, hL[1] / 2.0, 235.0 * z ** 0.6); dark = np.minimum(dark, 0.90 - 0.86 * a); warm = np.maximum(warm, a)
    if lantern:
        lx, ly = (P(*lantern)[0] / 2.0, P(*lantern)[1] / 2.0); a = pool(lx, ly, 200.0 * z ** 0.6, ss((t - T_LAMP1) / 1.0)); dark = np.minimum(dark, 0.90 - 0.86 * a); warm = np.maximum(warm, a)
    # the slit: the other room is lit; its light spills under the door and flickers, and flashes when a card goes through
    fl = 0.78 + 0.12 * math.sin(t * 9.0) + 0.06 * math.sin(t * 23.0) + (0.5 if (T_SLIDE0 + 0.2 < t < T_SLIDE0 + 1.2) else 0.0)
    slit_y = P(0, SLIT_Y)[1] / 2.0; xa, xb = P(DOOR_X0, 0)[0] / 2.0, P(DOOR_X1, 0)[0] / 2.0
    inx = np.clip(1 - np.abs((XX - (xa + xb) / 2) / ((xb - xa) / 2 * 1.15)) ** 3, 0, 1)
    below = np.clip(YY - slit_y, 0, None) / (95.0 * z); spill = np.exp(-below * 1.5) * (YY >= slit_y - 1) * inx * 0.8 * min(1.0, fl)
    dark = np.minimum(dark, 0.90 - 0.78 * spill); warm = np.maximum(warm, spill * 0.9)
    night = np.array([8, 10, 22], np.float32) / 255.0
    out = out * (1 - dark[..., None]) + night * dark[..., None]
    out = out * (1 + warm[..., None] * np.array([0.10, 0.02, -0.14], np.float32))
    im2 = Image.fromarray(np.clip(out * 255, 0, 255).astype(np.uint8)); d2 = ImageDraw.Draw(im2, 'RGBA')
    # ---------- the sliver: what he can see of the other side
    if T_SLIVER0 - 0.3 <= t < T_SLIVER1 + 0.3:
        a = ss((t - (T_SLIVER0 - 0.3)) / 0.3) * (1 - ss((t - T_SLIVER1) / 0.3))
        d2.rectangle([0, 0, 720, 1280], fill=(4, 4, 8, int(215 * a)))
        sy0, sy1 = 520, 760; strip = Image.new('RGB', (720, sy1 - sy0), (232, 196, 140)); sd = ImageDraw.Draw(strip, 'RGBA')
        for yy in range(0, sy1 - sy0, 26): sd.line([(0, yy), (720, yy)], fill=(200, 160, 108, 120), width=2)
        sd.rectangle([0, 0, 720, 34], fill=(40, 28, 22)); sd.rectangle([0, 34, 720, 70], fill=(90, 60, 40, 140))
        bt = beat_t(t); ph = bt - math.floor(bt); lift = max(0.0, 1 - ph * 3.2) ** 2 if t >= T_MUSIC else 0.0
        for fx, sg in ((300, 1), (430, -1)):
            hem = [(fx - 34, 70), (fx + 34, 70), (fx + 30, 118), (fx - 30, 118)]; sd.polygon(hem, fill=(70, 74, 104)); sd.line([(fx - 34, 118), (fx + 34, 118)], fill=(50, 52, 78), width=6)
            ly = 118 + (0 if sg > 0 else 0); toe = 122 - 34 * (lift if sg > 0 else 0)
            sd.ellipse([fx - 30, 112, fx + 30, 190 - 0], fill=(188, 52, 56)); sd.ellipse([fx - 22, 122, fx + 22, 160], fill=(150, 34, 40))
            if sg > 0: sd.rectangle([fx - 30, 186 - 14 * lift, fx + 30, 190], fill=(232, 196, 140))
        vig = Image.new('L', (720, sy1 - sy0), 0); vd = ImageDraw.Draw(vig); vd.ellipse([-120, -60, 840, sy1 - sy0 + 60], fill=255); vig = vig.filter(ImageFilter.GaussianBlur(40))
        base = im2.crop((0, sy0, 720, sy1)); comp = Image.composite(strip, base, vig.point(lambda v: int(v * a)))
        im2.paste(comp, (0, sy0))
    # ---------- the end: his slip's words, then nothing
    if t >= T_CARD:
        u = ss((t - T_CARD) / 1.0); cv = Image.new('RGB', (720, 1280), (7, 8, 12)); im2 = Image.blend(im2, cv, u)
        if t > T_CARD + 0.8:
            a = ss((t - T_CARD - 0.8) / 1.0); d3 = ImageDraw.Draw(im2, 'RGBA'); write(d3, (216, 640), 'Love it.', (240, 232, 210, int(255 * a)), scale=1.9, seed=3); write(d3, (216, 700), 'Keep going.', (240, 232, 210, int(255 * a)), scale=1.9, seed=4)
    if t < 0.8: Image.blend(Image.new('RGB', (720, 1280), (4, 4, 8)), im2, ss(t / 0.8)).save('/tmp/_f.png'); im2 = Image.open('/tmp/_f.png').convert('RGB')
    return im2

# ---------------------------------------------------------------- sound
SR = 44100
def build_audio():
    from scipy.io import wavfile
    from scipy.signal import butter, sosfilt, fftconvolve
    n = int(SR * (TOTAL + 0.6)); L = np.zeros(n); R = np.zeros(n); rg = np.random.default_rng(31)
    def band(x, lo, hi, order=2): sos = butter(order, [lo, min(hi, SR / 2 - 100)], 'band', fs=SR, output='sos'); return sosfilt(sos, x)
    def lowp(x, f, order=2): return sosfilt(butter(order, f, 'low', fs=SR, output='sos'), x)
    def put(arrL, arrR, sig, t0, gain=1.0, pan=0.5):
        i = int(t0 * SR)
        if i >= n or i < 0: return
        j = min(n, i + len(sig)); seg = sig[:j - i] * gain; arrL[i:j] += seg * math.cos(pan * math.pi / 2); arrR[i:j] += seg * math.sin(pan * math.pi / 2)
    noise = lambda dd: rg.standard_normal(int(dd * SR))
    def env(dd, a=0.002, tau=0.05): x = np.arange(int(dd * SR)) / SR; return np.minimum(1, x / a) * np.exp(-x / tau)
    def pluck(f, dur=0.9, tau=0.3, bright=0.5):
        x = np.arange(int(dur * SR)) / SR
        y = np.sin(2 * np.pi * f * x) + 0.45 * bright * np.sin(2 * np.pi * 2 * f * x) * np.exp(-x / (tau * .5)) + 0.2 * bright * np.sin(2 * np.pi * 3.01 * f * x) * np.exp(-x / (tau * .3))
        return y * np.exp(-x / tau) * np.minimum(1, x / 0.003)
    def pad(f, dur):
        x = np.arange(int(dur * SR)) / SR; y = np.sin(2 * np.pi * f * x) + 0.4 * np.sin(2 * np.pi * 2 * f * x + 1.1) + 0.2 * np.sin(2 * np.pi * 3 * f * x + 2.0)
        return y * np.minimum(1, x / 1.2) * np.minimum(1, np.maximum(0, (dur - x) / 1.4))
    # ---------- the music in the other room: bass on every beat, a pad that changes each bar, a pentatonic arpeggio from bar 3, a last chord
    mL = np.zeros(n); mR = np.zeros(n); bars = [('Dsus2', 73.42, [146.83, 220.0, 329.63]), ('G', 98.0, [196.0, 293.66, 392.0]), ('Bm', 61.74, [123.47, 185.0, 246.94]), ('A', 55.0, [110.0, 164.81, 220.0])]
    scale = [293.66, 329.63, 369.99, 440.0, 493.88, 587.33, 659.25]
    nb = int((TOTAL - T_MUSIC) / BEAT)
    for b in range(nb):
        t = T_MUSIC + b * BEAT; bar = (b // 4) % 4; name, bass, chord = bars[bar]
        put(mL, mR, pluck(bass if b % 2 == 0 else bass * 1.5, 0.6, 0.22, 0.3), t, 0.30, 0.5)
        if b % 4 == 0:
            for f in chord: put(mL, mR, pad(f, BEAT * 4.2), t, 0.17, 0.5)
        if b >= 8:
            for q in range(2):
                f = scale[(b * 2 + q * 3 + bar) % len(scale)]; put(mL, mR, pluck(f, 0.5, 0.18, 0.5), t + q * BEAT / 2, 0.34, 0.35 + 0.3 * q)
    tl = T_MUSIC + nb * BEAT
    for f in (146.83, 220.0, 293.66, 369.99, 587.33): put(mL, mR, pad(f, 4.0), tl, 0.22, 0.5)
    # muffled: only the low end, as if through a door; opening up once the slip has been read
    tt = np.arange(n) / SR; a_open = np.clip((tt - T_OPEN0) / (T_OPEN1 - T_OPEN0), 0, 1); a_open = a_open * a_open * (3 - 2 * a_open)
    muffL = lowp(mL, 210, 4) * 1.6; muffR = lowp(mR, 210, 4) * 1.6
    # a small room's tail on the open version
    ir = rg.standard_normal(int(0.9 * SR)) * np.exp(-np.arange(int(0.9 * SR)) / SR / 0.28) * 0.02; ir[0] = 1.0
    fullL = mL + 0.35 * fftconvolve(mL, ir)[:n]; fullR = mR + 0.35 * fftconvolve(mR, ir)[:n]
    L += muffL * (1 - a_open) * 0.9 + fullL * a_open * 0.8; R += muffR * (1 - a_open) * 0.9 + fullR * a_open * 0.8
    # ---------- the maker's side: footsteps, pencil, card, slip, the lantern
    fL = np.zeros(n); fR = np.zeros(n); cnt = 0; prev = None
    for i in range(0, int(SCENE * 60)):
        t = i / 60.0; q = maker_state(t)
        if q['speed'] < 6: prev = None; continue
        s = math.sin(phase(t))
        if prev is not None and prev * s < 0:
            put(fL, fR, band(noise(0.08), 300, 1800) * env(0.08, 0.001, 0.022) * 0.9, t, 0.22, 0.4); cnt += 1
        prev = s
    for (a, b) in ((T_DRAW0 + 0.2, T_DRAW1 - 0.1), (T_WORK0 + 1.5, TOTAL - 3.4)):
        t = a
        while t < b:
            put(fL, fR, band(noise(0.11), 2500, 7000) * env(0.11, 0.004, 0.04) * 0.9, t, 0.10, 0.35); t += 0.14 + rg.uniform(0, 0.12)
    put(fL, fR, band(noise(0.7), 1200, 6000) * np.hanning(int(0.7 * SR)) * 0.8, T_SLIDE0 + 0.2, 0.18, 0.55)             # the card under the door
    put(fL, fR, band(noise(1.3), 1000, 5500) * np.hanning(int(1.3 * SR)) * 0.8, T_SLIP0, 0.20, 0.5)                     # the slip coming back
    put(fL, fR, band(noise(0.5), 800, 5000) * np.hanning(int(0.5 * SR)) * 0.8, T_PICK, 0.14, 0.5)
    put(fL, fR, band(noise(0.1), 200, 900) * env(0.1, 0.002, 0.03), T_LAMP1, 0.2, 0.5)                                   # the lantern set down
    L += fL; R += fR
    hush = (lowp(noise(TOTAL + 0.6), 300) * 0.012 + lowp(noise(TOTAL + 0.6), 80) * 0.012)[:n] * np.minimum(1, tt / 1.0)
    L += hush; R += hush
    fade = np.clip(tt / 0.6, 0, 1) * np.clip((TOTAL + 0.4 - tt) / 0.9, 0, 1); L *= fade; R *= fade
    pk = max(np.max(np.abs(L)), np.max(np.abs(R))); L, R = L / pk, R / pk
    L = np.tanh(L * 1.9) / np.tanh(1.9) * 0.33; R = np.tanh(R * 1.9) / np.tanh(1.9) * 0.33
    wavfile.write(OUT + '/story.wav', SR, (np.stack([L, R], 1) * 32767).astype(np.int16)); print('audio done; steps', cnt)

if __name__ == '__main__':
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
                          '-vf', 'noise=alls=3:allf=t+u', '-c:v', 'libx264', '-crf', '17', '-pix_fmt', 'yuv420p', OUT + '/story-silent.mp4'], stdin=subprocess.PIPE)
    for i in range(frames):
        p.stdin.write(render(i / FPS).tobytes())
        if i % 150 == 0: print('frame', i, '/', frames, flush=True)
    p.stdin.close(); p.wait(); print('picture done')
    build_audio()
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', OUT + '/story-silent.mp4', '-i', OUT + '/story.wav', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', OUT + '/keep-going.mp4'], check=True)
    print('done', OUT + '/keep-going.mp4')
