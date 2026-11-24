#!/usr/bin/env python3
"""The Depth Was Yours - part three of the static films (after Perfect Absence and Only What Moves).

Every frame is flat static on a grid of 6 px cells. Each object is a 3D surface ray-traced at every cell CENTRE, and
the cell takes the value of the surface patch it hits (patches about one cell across, fixed to the surface). So a frame
is the same grid of independent cells everywhere, and as a surface turns its static turns with it: the eye builds the
solid from the motion alone (the kinetic depth effect). A head, a sea, a knot. Stop them and they are gone.

Song: Winter Where the Embers Go 58.9-83.4 (its second verse, never used), then a card.
Run:  python3 video/build_the_depth_was_yours.py [--frames 8,16] [--workers 4] [--mux]
"""
import argparse, os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out', 'depth')
SONG = os.path.join(ROOT, 'out', 'songs', 'winter-where-the-embers-go.mp3')
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
W, H, FPS, C, N = 1080, 1920, 30, 6, 1024
R, K = H // C, W // C                      # 320 x 180 cells
S0, S1 = 58.9, 83.4
SONG_DUR = S1 - S0
CARD = 5.5
DUR = SONG_DUR + CARD
NF = int(round(DUR * FPS))
FOC = 288.0                                 # focal length, in cells


def ft(s):
    return s - S0


E = {k: ft(v) for k, v in dict(human=59.52, gasoline=61.48, feed=63.32, grief=65.06, but=65.46, mirror=66.72,
                                serene=67.70, shoreline=68.94, crashing=70.54, reef=70.88, bring=71.92, texts=73.88,
                                tangled=74.90, knots=75.66, say=76.84, you2=77.44, vexed=79.84, take=80.60,
                                smoke=80.96, breathe=81.56, away=82.84).items()}


def ramp(t, a, b):
    return float(np.clip((t - a) / max(1e-6, b - a), 0, 1))


def sm(x):
    return x * x * (3 - 2 * x)


rng = np.random.default_rng(21)
def tile():
    return (rng.random((N, N)) ** 0.85 * 255).astype(np.uint8)
T_BG, T_FIRE, T_HEAD, T_SEA, T_KNOT, T_TEXT = (tile() for _ in range(6))

RR, CC = np.mgrid[0:R, 0:K]
# ray directions through every cell centre (camera at the origin looking +z, y up)
DIRS = np.stack([(CC + 0.5 - K / 2) / FOC, -(RR + 0.5 - R / 2) / FOC, np.ones((R, K))], -1)
DIRS /= np.linalg.norm(DIRS, axis=-1, keepdims=True)
DIRS = DIRS.reshape(-1, 3).astype(np.float64)


def rot(yaw, pitch, roll=0.0):
    cy, sy, cp, sp, cr, sr = np.cos(yaw), np.sin(yaw), np.cos(pitch), np.sin(pitch), np.cos(roll), np.sin(roll)
    Ry = np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]])
    Rx = np.array([[1, 0, 0], [0, cp, -sp], [0, sp, cp]])
    Rz = np.array([[cr, -sr, 0], [sr, cr, 0], [0, 0, 1]])
    return Ry @ Rx @ Rz


def hash3(p, q, T, seed):
    """solid texture: the value of the cube of side q containing each 3D point (no stretching on any surface, unlike a
    (lat, lon) map, which streaked the neck and the ears)"""
    i = np.floor(p / q).astype(np.int64)
    h = (i[:, 0] * 73856093) ^ (i[:, 1] * 19349663) ^ (i[:, 2] * 83492791) ^ seed
    h = (h ^ (h >> 13)) * 1274126177
    h = h ^ (h >> 16)
    return T[h & (N - 1), (h >> 10) & (N - 1)]


def project(P):
    """world points -> (row, col) cells (float), and depth"""
    z = P[:, 2]
    return R / 2 - P[:, 1] / z * FOC, K / 2 + P[:, 0] / z * FOC, z


# ---------------------------------------------------------------- signed distances
def smin(a, b, k):
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0, 1)
    return b + (a - b) * h - k * h * (1 - h)


def smax(a, b, k):
    return -smin(-a, -b, k)


def ellip(p, c, r):
    q = (p - c) / r
    k0 = np.linalg.norm(q, axis=-1)
    k1 = np.linalg.norm(q / r, axis=-1)
    return k0 * (k0 - 1) / np.maximum(k1, 1e-9)


def capsule(p, a, b, r):
    pa, ba = p - a, np.asarray(b) - a
    h = np.clip((pa @ ba) / (ba @ ba), 0, 1)
    return np.linalg.norm(pa - h[:, None] * ba, axis=-1) - r


def head_sdf(p, mouth=0.0):
    """a head, face towards -z; object units ~ 1 = half its width"""
    d = ellip(p, np.array([0, 0.05, 0.05]), np.array([0.95, 1.25, 1.08]))
    d = smin(d, ellip(p, np.array([0, -0.55, -0.55]), np.array([0.62, 0.55, 0.55])), 0.25)        # jaw
    d = smin(d, capsule(p, np.array([0, 0.12, -1.02]), np.array([0, -0.28, -1.28]), 0.13), 0.12)  # nose
    d = smin(d, ellip(p, np.array([0, 0.38, -0.92]), np.array([0.72, 0.13, 0.22])), 0.12)         # brow
    for s in (-1, 1):
        d = smax(d, -ellip(p, np.array([0.36 * s, 0.13, -1.0]), np.array([0.2, 0.15, 0.2])), 0.08)  # eyes
        d = smin(d, ellip(p, np.array([0.97 * s, 0.05, 0.15]), np.array([0.1, 0.26, 0.17])), 0.06)  # ears
    d = smax(d, -ellip(p, np.array([0, -0.62, -0.98]), np.array([0.32, 0.04 + 0.13 * mouth, 0.16])), 0.05)  # mouth
    d = smin(d, capsule(p, np.array([0, -0.9, 0.15]), np.array([0, -2.0, 0.25]), 0.48), 0.3)      # neck
    return d


KNOT_N = 420
_ph = np.linspace(0, 2 * np.pi, KNOT_N, endpoint=False)
KNOT = np.stack([(1 + 0.45 * np.cos(3 * _ph)) * np.cos(2 * _ph), (1 + 0.45 * np.cos(3 * _ph)) * np.sin(2 * _ph),
                 -0.45 * np.sin(3 * _ph)], -1) * 1.05
KT = np.roll(KNOT, -1, 0) - np.roll(KNOT, 1, 0); KT /= np.linalg.norm(KT, axis=1, keepdims=True)
_ref = np.cross(KT, np.array([0, 0, 1.0])); _ref /= np.linalg.norm(_ref, axis=1, keepdims=True)
KU, KV = _ref, np.cross(KT, _ref)
KS = np.r_[0, np.cumsum(np.linalg.norm(np.diff(KNOT, axis=0), axis=1))]
KNOT_R = 0.2


def knot_sdf(p, keep):
    """distance to the tube round the knot's samples where keep is True; also the nearest sample index"""
    pts = KNOT[keep]
    if not len(pts):
        return np.full(len(p), 9.0), np.zeros(len(p), int)
    best = np.full(len(p), 1e9); idx = np.zeros(len(p), int)
    ii = np.where(keep)[0]
    for k in range(0, len(pts), 60):
        d = np.linalg.norm(p[:, None, :] - pts[None, k:k + 60], axis=-1)
        a = d.argmin(1); v = d[np.arange(len(p)), a]
        m = v < best; best[m] = v[m]; idx[m] = ii[k + a[m]]
    return best - KNOT_R, idx


# ---------------------------------------------------------------- the schedule
HEAD_C = np.array([0.0, 1.85, 8.0]); HEAD_S = 1.55
KNOT_C = np.array([0.0, -1.55, 8.0]); KNOT_S = 1.0
SEA_Y = -3.0


def head_state(t):
    """visible?, yaw, pitch, mouth (0..1), still?"""
    on1 = E['but'] - 0.2 <= t < E['shoreline']
    on2 = t >= E['you2'] - 0.4
    if not (on1 or on2):
        return None
    if on1:
        # turns, then on 'serene' slows to a stop (and so vanishes)
        tt = min(t, E['serene'] + 0.25)
        yaw = 0.9 * np.sin(2 * np.pi * (tt - E['but']) / 5.0) - 0.35
        pitch = 0.12 * np.sin(2 * np.pi * (tt - E['but']) / 3.7)
        grow = sm(ramp(t, E['but'] - 0.2, E['mirror']))
        return dict(yaw=yaw, pitch=pitch, mouth=0.0, s=0.5 + 0.5 * grow)
    # back, calm, turning to face the knot's smoke; breathes it in; still on 'away'
    tt = min(t, E['away'] + 0.1)
    face = sm(ramp(tt, E['take'] - 0.6, E['smoke']))
    yaw = (1 - face) * (0.75 * np.sin(2 * np.pi * (tt - E['you2']) / 6.0) + 0.5)
    pitch = (1 - face) * 0.1 * np.sin(2 * np.pi * (tt - E['you2']) / 4.4) - 0.12 * face
    mouth = sm(ramp(tt, E['smoke'], E['breathe'])) * (1 - sm(ramp(tt, E['away'] - 0.6, E['away'])))
    # the breath itself is a small rise and settle of the head (so it stays seen while facing front)
    nod = 0.16 * np.sin(np.pi * ramp(tt, E['breathe'] - 0.3, E['away']))
    settle = 1 - sm(ramp(tt, E['away'] - 0.9, E['away'] + 0.1))
    yaw += face * settle * 0.22 * np.sin(2 * np.pi * (tt - E['take']) / 2.6)
    return dict(yaw=yaw, pitch=pitch + nod, mouth=mouth, s=1.0)


def knot_state(t):
    if not (E['tangled'] - 0.3 <= t < E['away'] + 0.6):
        return None
    tt = t - E['tangled']
    rise = sm(ramp(t, E['tangled'] - 0.3, E['knots'] + 0.2))
    return dict(R=rot(0.9 * tt, 0.6 * tt + 0.4, 0.35 * tt), c=KNOT_C + (0, -2.5 * (1 - rise), 0),
                release=ramp(t, E['take'] - 0.1, E['breathe'] + 0.2))


def sea_amp(t):
    return sm(ramp(t, E['shoreline'] - 0.5, E['shoreline'] + 0.5)) * (1 + 0.7 * sm(ramp(t, E["crashing"] - 0.6, E["reef"])) *
           (1 - sm(ramp(t, E['reef'] + 0.4, E['bring'] + 0.8)))) * (1 - sm(ramp(t, E['tangled'] - 1.0, E['knots'])))


def sea_h(x, z, t, A):
    ph = t * 2.2
    h = 0.22 * np.sin(1.3 * z + ph * 1.6) + 0.12 * np.sin(0.9 * z + 0.7 * x + ph * 1.1) + 0.07 * np.sin(2.3 * z - 0.9 * x + ph * 2.3)
    crest = 0.25 * np.maximum(0, np.sin(0.55 * z + ph * 0.9 + 0.3 * np.sin(0.3 * x))) ** 4
    return A * (h + crest)


# ---------------------------------------------------------------- tracing
# surface patch sizes, in object units: one cell (z/FOC) at each object's nearest point, so a patch never covers more
# than one cell (a bigger patch would show as blockier static in a still)
Q_HEAD = (HEAD_C[2] - 1.35 * HEAD_S) / FOC / HEAD_S * 0.6
Q = (KNOT_C[2] - 1.7) / FOC * 0.6


def trace_head(st, t):
    Rm = rot(st['yaw'], st['pitch']); s = st['s'] * HEAD_S
    o = -(Rm.T @ HEAD_C) / s
    d = DIRS @ Rm  # rows: Rm.T @ dir
    # bounding sphere
    b = d @ o; cc = o @ o - 2.6 ** 2
    disc = b * b - cc
    act = np.where(disc > 0)[0]
    tt = np.maximum(-b[act] - np.sqrt(disc[act]), 0)
    hit = np.full(len(DIRS), np.inf); val = np.zeros(len(DIRS), np.uint8)
    alive = np.ones(len(act), bool)
    for _ in range(70):
        ia = np.where(alive)[0]
        if not len(ia):
            break
        p = o + d[act[ia]] * tt[ia, None]
        dd = head_sdf(p, st['mouth'])
        tt[ia] += dd * 0.9
        done = dd < 0.002
        far = tt[ia] > 12
        if done.any():
            j = ia[done]; hit[act[j]] = tt[j] * s
        alive[ia[done | far]] = False
    m = np.isfinite(hit)
    p = o + d[m] * (hit[m] / s)[:, None]
    val[m] = hash3(p, Q_HEAD, T_HEAD, 11)
    return hit, val


def trace_knot(st, t):
    Rm, c = st['R'], st['c']
    o = Rm.T @ (-c) / KNOT_S
    d = DIRS @ Rm
    keep = np.linspace(0, 1, KNOT_N) >= st['release'] if st['release'] > 0 else np.ones(KNOT_N, bool)
    hit = np.full(len(DIRS), np.inf); val = np.zeros(len(DIRS), np.uint8)
    if not keep.any():
        return hit, val
    b = d @ o; cc = o @ o - 1.9 ** 2
    disc = b * b - cc
    act = np.where(disc > 0)[0]
    tt = np.maximum(-b[act] - np.sqrt(disc[act]), 0)
    alive = np.ones(len(act), bool); idx = np.zeros(len(act), int)
    for _ in range(40):
        ia = np.where(alive)[0]
        if not len(ia):
            break
        p = o + d[act[ia]] * tt[ia, None]
        dd, ix = knot_sdf(p, keep)
        tt[ia] += dd
        done = dd < 0.003
        far = tt[ia] > np.linalg.norm(o) + 2.5
        if done.any():
            j = ia[done]; hit[act[j]] = tt[j] * KNOT_S; idx[j] = ix[done]
        alive[ia[done | far]] = False
    m = np.isfinite(hit[act])
    a, ix = act[m], idx[m]
    p = o + d[a] * (hit[a] / KNOT_S)[:, None]
    val[a] = hash3(p, Q, T_KNOT, 23)
    return hit, val


def trace_sea(t, A):
    d = DIRS
    hit = np.full(len(d), np.inf); val = np.zeros(len(d), np.uint8)
    act = np.where(d[:, 1] < -0.02)[0]
    if A <= 0 or not len(act):
        return hit, val
    top = SEA_Y + 0.9 * A
    tt = (top - 0) / d[act, 1]               # where the ray reaches the highest crest
    prev = tt.copy()
    found = np.zeros(len(act), bool)
    for _ in range(90):
        p = d[act] * tt[:, None]
        under = p[:, 1] < SEA_Y + sea_h(p[:, 0], p[:, 2], t, A)
        newly = under & ~found
        if newly.any():
            # bisection between prev and tt
            lo, hi = prev[newly], tt[newly]
            dd = d[act[newly]]
            for _ in range(8):
                mid = (lo + hi) / 2
                pm = dd * mid[:, None]
                u = pm[:, 1] < SEA_Y + sea_h(pm[:, 0], pm[:, 2], t, A)
                hi = np.where(u, mid, hi); lo = np.where(u, lo, mid)
            hit[act[newly]] = hi; found |= newly
        prev = np.where(found, prev, tt)
        tt = np.where(found, tt, tt + 0.02 + 0.03 * tt)
        if found.all() or (tt > 60).all():
            break
    m = np.isfinite(hit)
    p = d[m] * hit[m][:, None]
    # patches fixed to the water but sized by distance, about one cell wherever they land: a row of patches per row of
    # cells (u = -FOC*|SEA_Y|/z), and across, one cell at that row's depth
    # (three patches per cell row on flat water: a steep wave face facing us stretches a row of water over several
    # rows of cells, and one patch per row streaked there in a still)
    ZK = 3.0
    zi = np.floor(-FOC * abs(SEA_Y) / p[:, 2] * ZK).astype(int)
    zc = -FOC * abs(SEA_Y) * ZK / (zi + 0.5)
    xi = np.floor(p[:, 0] * FOC / (zc / ZK) * 0.95).astype(int)
    val[m] = T_SEA[zi % N, xi % N]
    hit[m & (hit > 60)] = np.inf
    return hit, val


# ---------------------------------------------------------------- the smoke: the knot's own patches, breathed in
SMOKE = None
def smoke_init():
    global SMOKE
    r = np.random.default_rng(4)
    n = 9000
    i = r.integers(0, KNOT_N, n); a = r.uniform(0, 2 * np.pi, n)
    p = KNOT[i] + KNOT_R * (np.cos(a)[:, None] * KU[i] + np.sin(a)[:, None] * KV[i])
    v = hash3(p, Q, T_KNOT, 23)
    SMOKE = dict(p=p, rel=i / KNOT_N, v=v, ctrl=r.normal(0, 1, (n, 3)) * (0.8, 0.5, 0.4))


def mouth_world(t):
    st = head_state(t)
    Rm = rot(st['yaw'], st['pitch'])
    return HEAD_C + Rm @ (np.array([0, -0.62, -1.0]) * HEAD_S)


def smoke_cells(t, kst):
    """cells, depth and value of the particles released so far (a particle leaves when the unravelling front passes
    its place on the knot and travels to the mouth in 1.1 s)"""
    if SMOKE is None:
        smoke_init()
    rel = kst['release'] if kst else 1.0
    t_rel0 = E['take'] - 0.1; span = E['breathe'] + 0.2 - t_rel0
    tr = t_rel0 + SMOKE['rel'] * span
    age = (t - tr) / 1.1
    live = (age >= 0) & (age < 1)
    if not live.any():
        return None
    a = sm(np.clip(age[live], 0, 1))[:, None]
    Rk = knot_state(min(t, E['away'] + 0.5))
    p0 = (SMOKE['p'][live] * KNOT_S) @ Rk['R'].T + Rk['c']
    m = mouth_world(t)
    ctrl = (p0 + m) / 2 + SMOKE['ctrl'][live] + (0, 0.6, 0)
    P = (1 - a) ** 2 * p0 + 2 * (1 - a) * a * ctrl + a * a * m
    r_, c_, z = project(P)
    return np.round(r_ - 0.5).astype(int), np.round(c_ - 0.5).astype(int), z, SMOKE['v'][live]


# ---------------------------------------------------------------- 2D: the fire, the card
FIRE_SPAWN = None
def fire_mask(t):
    """rising tongues (cell res) from the bottom; heat up on 'gasoline', cut on 'grief'"""
    global FIRE_SPAWN
    if FIRE_SPAWN is None:
        r = np.random.default_rng(8); sp = []; tt = 0.0
        while tt < E['grief']:
            h = sm(ramp(tt, E['human'] - 0.4, E['human'] + 0.4)) * (0.6 + 0.9 * sm(ramp(tt, E['gasoline'] - 0.3, E['gasoline'] + 0.3)))
            for _ in range(int(r.poisson(3 + 14 * h)) if h > 0.02 else 0):
                sp.append((tt, r.normal(K / 2, 26 + 20 * h), R + 4, r.normal(0, 6), -(60 + 90 * h) * r.uniform(0.7, 1.3),
                           (5 + 6 * h) * r.uniform(0.6, 1.3), (0.6 + 0.9 * h) * r.uniform(0.6, 1.3)))
            tt += 1 / FPS
        FIRE_SPAWN = np.array(sp)
    P = FIRE_SPAWN
    age = t - P[:, 0]; lv = (age >= 0) & (age < P[:, 6])
    if not lv.any():
        return np.zeros((R, K), bool)
    P, a = P[lv], age[lv]
    x = P[:, 1] + P[:, 3] * a + 4 * np.sin(a * 6 + P[:, 2]); y = P[:, 2] + P[:, 4] * a
    rr_ = P[:, 5] * (1 - a / P[:, 6]) ** 0.7
    img = Image.new('L', (K, R)); d = ImageDraw.Draw(img)
    for xi, yi, ri in zip(x, y, rr_):
        d.ellipse((xi - ri, yi - ri * 1.6, xi + ri, yi + ri), 255)
    return ndimage.gaussian_filter(np.asarray(img, np.float32), 1.2) > 100


def text_cells(lines, size, y0, gap):
    m = Image.new('L', (W, H)); d = ImageDraw.Draw(m)
    f = ImageFont.truetype(FONT, size)
    y = y0
    for ln in lines:
        w = d.textlength(ln, font=f)
        d.text(((W - w) / 2, y), ln, font=f, fill=255, stroke_width=4, stroke_fill=255)
        y += gap
    return (np.array(m) > 0)[C // 2::C, C // 2::C][:R, :K]
CARD_T = text_cells(['Every frame', 'of this film', 'is flat static.', '', 'The depth', 'was yours.'], 104, 470, 132)


# ---------------------------------------------------------------- one frame
def render_cells(f):
    t = f / FPS
    G = T_BG[RR % N, CC % N].copy()
    Z = np.full(R * K, np.inf)
    V = np.zeros(R * K, np.uint8)
    tt = min(t, SONG_DUR)

    if tt < E['grief']:
        fm = fire_mask(tt)
        G[fm] = T_FIRE[(RR[fm] + f) % N, CC[fm] % N]            # rises one cell a frame
    elif tt < E['grief'] + 0.5:
        fm = fire_mask(E['grief'] - 1 / FPS)                     # cut: frozen, so gone
        G[fm] = T_FIRE[(RR[fm] + int(E['grief'] * FPS)) % N, CC[fm] % N]

    A = sea_amp(tt)
    if A > 0:
        h, v = trace_sea(tt, A)
        m = h < Z; Z[m] = h[m]; V[m] = v[m]
    kst = knot_state(tt)
    if kst and kst['release'] < 1:
        h, v = trace_knot(kst, tt)
        m = h < Z; Z[m] = h[m]; V[m] = v[m]
    hst = head_state(tt)
    if hst:
        h, v = trace_head(hst, tt)
        m = h < Z; Z[m] = h[m]; V[m] = v[m]
    hitm = np.isfinite(Z).reshape(R, K)
    G[hitm] = V.reshape(R, K)[hitm]

    if kst and E['take'] - 0.2 <= tt < E['breathe'] + 1.5:
        sc = smoke_cells(tt, kst)
        if sc is not None:
            r_, c_, z, v = sc
            ok = (r_ >= 0) & (r_ < R) & (c_ >= 0) & (c_ < K)
            o = np.argsort(-z[ok])
            G[r_[ok][o], c_[ok][o]] = v[ok][o]

    if t >= SONG_DUR:
        k = t - SONG_DUR
        dx = int(np.floor(sum(0.5 * sm(ramp(j / FPS, 0.2, 0.7)) * (1 - sm(ramp(j / FPS, CARD - 1.1, CARD - 0.5)))
                              for j in range(int(k * FPS)))))
        G[CARD_T] = T_TEXT[RR[CARD_T] % N, (CC[CARD_T] - dx) % N]
    return G


def render(f):
    G = render_cells(f)
    v = np.repeat(np.repeat(G, C, 0), C, 1).astype(np.float32)
    return np.clip(np.stack([v * 0.88 + 6, v * 0.95 + 4, v + 2], -1), 0, 255).astype(np.uint8)


def worker(f0, f1, path):
    p = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}',
                          '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '12',
                          '-pix_fmt', 'yuv420p', path], stdin=subprocess.PIPE)
    for f in range(f0, f1):
        p.stdin.write(render(f).tobytes())
    p.stdin.close(); p.wait()


def mux():
    silent, wav = f'{OUT}/the-depth-was-yours-silent.mp4', f'{OUT}/the-depth-was-yours.wav'
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', SONG, '-af',
                    f'atrim={S0}:{S1},asetpts=PTS-STARTPTS,afade=t=in:d=0.05,afade=t=out:st={SONG_DUR - 0.45}:d=0.45,'
                    f'volume=-1.5dB,apad=whole_dur={DUR}', '-ar', '48000', '-ac', '2', wav], check=True)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', silent, '-i', wav, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k',
                    '-shortest', f'{OUT}/the-depth-was-yours.mp4'], check=True)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', silent, '-i', wav, '-c:v', 'libx264', '-tune', 'grain', '-b:v', '7200k',
                    '-maxrate', '9M', '-bufsize', '14M', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k',
                    '-shortest', '-movflags', '+faststart', f'{OUT}/the-depth-was-yours-share.mp4'], check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--workers', type=int, default=4)
    ap.add_argument('--frames')
    ap.add_argument('--mux', action='store_true')
    a = ap.parse_args()
    os.makedirs(OUT, exist_ok=True)
    if a.mux:
        return mux()
    if a.frames:
        for s in a.frames.split(','):
            f = int(float(s) * FPS)
            x0, x1 = render(f), render(f + 1)
            Image.fromarray(x1).resize((540, 960)).save(f'{OUT}/frame-{s}.png')
            d = np.abs(x1.astype(int) - x0.astype(int)).max(-1)
            Image.fromarray(np.clip(d * 2, 0, 255).astype(np.uint8)).resize((540, 960)).save(f'{OUT}/diff-{s}.png')
        return
    from multiprocessing import Process
    cuts = np.linspace(0, NF, a.workers + 1).astype(int)
    parts = [f'{OUT}/part{i}.mp4' for i in range(a.workers)]
    ps = [Process(target=worker, args=(cuts[i], cuts[i + 1], parts[i])) for i in range(a.workers)]
    [p.start() for p in ps]; [p.join() for p in ps]
    with open(f'{OUT}/parts.txt', 'w') as fh:
        fh.writelines(f"file '{p}'\n" for p in parts)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', f'{OUT}/parts.txt', '-c', 'copy',
                    f'{OUT}/the-depth-was-yours-silent.mp4'], check=True)
    mux()
    print('done')


if __name__ == '__main__':
    main()
