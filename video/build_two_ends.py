"""Two Ends (30 s, 720x1280, wordless). The user: "Something way out your comfort zone. 30 seconds. AI alignment
based. Maybe humans aren't pulling their weight in that discussion?"

Dusk, everything in silhouette. A small amber light strains alone at one end of a long rope. The camera follows the
rope across the hill to the other end: tied to an empty chair, a phone lighting up on the seat. Ping. Nobody. He
sprints in late (his real run, leap and landing from u173, keyed and turned to silhouette), dives over the chair and
lands on the rope. Wide: with both ends held the straining stops, and the light travels down the rope to him, the
rope lighting up behind it. Card: "Alignment has two ends." One last ping on the empty chair.

No text but the card, no music, no Wan: sky, hill, rope, chair and light drawn here, and every sound synthesized
here (wind, the light's strained hum resolving to a chord, rope creaks, footsteps, the dive, the pings).
python3 video/build_two_ends.py [TEST=t,t,... TESTDIR=dir]  -> out/two-ends.mp4"""
import os, sys, math, subprocess
import cv2
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
from bluekey import key
import build_kept as K

W, H, FPS, DUR = 720, 1280, 24, 30.0
SR = 44100
HOR = 1000.0                      # world y of the horizon line, kept on screen y 1000 at every zoom
AMBER = np.array([255, 176, 88], np.float32)
SIL = np.array([14, 9, 18], np.float32)
rng = np.random.default_rng(7)

LIGHT0 = 210.0                    # world x of the light
CHAIR = 2080.0                    # world x of the chair (front leg at CHAIR - 30)
PINGS = [10.9, 11.9, 29.0]
GRAB = 17.9                       # the rope goes from the chair leg to his hands


def ground(x):
    return HOR + 14 * np.sin(np.asarray(x) / 310.0) + 8 * np.sin(np.asarray(x) / 97.0 + 1)


def ss(a, b, t):
    u = min(1.0, max(0.0, (t - a) / (b - a)))
    return u * u * (3 - 2 * u)


# ---------------- camera ----------------
def camera(t):
    """world x at screen centre, zoom"""
    if t < 19.0:
        return 300 + 1760 * ss(6.0, 10.5, t), 1.0
    # wide, then follow the light down the rope and push in to him as it arrives
    u = ss(21.0, 25.5, t)
    return 1150.0 + (1790.0 - 1150.0) * u, math.exp(math.log(.30) + (math.log(.72) - math.log(.30)) * u)


def to_screen(wx, wy, cam):
    cx, z = cam
    return (np.asarray(wx) - cx) * z + W / 2, (np.asarray(wy) - HOR) * z + HOR


# ---------------- sky ----------------
# long thin streaks, the way dusk clouds lie: noise stretched far wider than it is tall
_n = cv2.resize(rng.random((30, 14)).astype(np.float32), (3200, 900), interpolation=cv2.INTER_CUBIC)
_n2 = cv2.resize(rng.random((70, 40)).astype(np.float32), (3200, 900), interpolation=cv2.INTER_CUBIC)
CLOUD = cv2.GaussianBlur(np.clip((_n * .75 + _n2 * .25 - .55) * 2.6, 0, 1), (0, 0), 6)
ys = np.arange(H, dtype=np.float32)[:, None]
STOPS = [(0, (16, 14, 44)), (420, (58, 30, 78)), (760, (150, 62, 92)), (930, (236, 128, 70)), (1000, (255, 190, 110))]


def sky(cam, t):
    cx, z = cam
    img = np.zeros((H, W, 3), np.float32)
    yv = ys[:, 0]
    for c in range(3):
        img[..., c] = np.interp(yv, [s[0] for s in STOPS], [s[1][c] for s in STOPS])[:, None]
    # sun just under the horizon, parallax-slow
    sx = 470 - (cx - 1150) * .06 * z
    xx = np.arange(W, dtype=np.float32)[None, :]
    d2 = ((xx - sx) / 1.0) ** 2 + ((ys - 1010) * 2.2) ** 2
    img += (np.exp(-d2 / (2 * 160 ** 2)) * 90)[..., None] * np.array([1.0, .75, .4], np.float32)
    # clouds: dark bands lit from below near the horizon
    off = int((cx * .18 * z + t * 6) % 1600)
    cl = CLOUD[0:H - 380 if H - 380 < 900 else 900, off:off + W]
    cl = cv2.resize(cl, (W, 900))
    band = np.zeros((H, W), np.float32); band[0:900] = cl * np.clip((900 - ys[0:900]) / 300, 0, 1) * np.clip(ys[0:900] / 200, 0, 1)
    under = np.clip((ys - 300) / 600, 0, 1)
    img = img * (1 - .38 * band[..., None]) + band[..., None] * under[..., None] * np.array([70, 30, 20], np.float32)
    return img


# ---------------- him ----------------
SRC = cv2.VideoCapture("out/user-clips/u173.mp4")
_cache = {}


def src_frame(s):
    i = int(round(s * 24))
    if i not in _cache:
        SRC.set(cv2.CAP_PROP_POS_FRAMES, i); ok, fr = SRC.read()
        col, a = key(cv2.cvtColor(fr, cv2.COLOR_BGR2RGB).astype(np.float32))
        _cache[i] = a.astype(np.float32)
    return _cache[i]


# standing scale from his first frame: feet row and height
_a0 = src_frame(0.5)
_rows = np.nonzero(_a0.max(1) > .5)[0]
FEET, HEAD = _rows.max(), _rows.min()
SRCX = float(np.nonzero(_a0.max(0) > .5)[0].mean())
TALL = 265.0
SCALE = TALL / (FEET - HEAD)


def him(t):
    """(source time, world x, lift) or None"""
    if 12.5 <= t < 15.0:          # sprint in from the right (run cycle, 1:1)
        u = (t - 12.5) / 2.5
        return 5.0 + (t - 12.5), 2470 - 230 * u, 0.0
    if 15.0 <= t < 17.5:          # the leap, over the chair
        u = (t - 15.0) / 2.5
        return 9.25 + (t - 15.0), 2240 - 310 * ss(0, 1, u) - 0 * u, 150 * math.sin(math.pi * u)
    if 17.5 <= t < 19.0:          # lands crouched, hands forward on the rope
        return 12.25 + (t - 17.5) * .8, 1930.0, 0.0
    if t >= 19.0:                 # wide: standing, holding, facing the light
        return 14.75 + .04 * math.sin(t * 1.3), 1930.0, 0.0
    return None


def place(t, cam):
    """screen alpha of his silhouette, and his hands' screen point"""
    h = him(t)
    if h is None:
        return None, None
    s_t, wx, lift = h
    a = src_frame(s_t)
    cx, z = cam
    s = SCALE * z
    gx, gy = to_screen(wx, ground(wx) - lift, cam)
    # mirrored: he faces left, toward the light
    M = np.float32([[-s, 0, gx + s * SRCX], [0, s, gy - s * FEET]])
    al = cv2.warpAffine(a, M, (W, H))
    # hands: the frontmost (leftmost) point between chest and hip height
    top = gy - s * (FEET - HEAD)
    r0, r1 = int(top + .30 * s * (FEET - HEAD)), int(top + .62 * s * (FEET - HEAD))
    band = al[max(0, r0):max(1, r1)]
    cols = np.nonzero(band.max(0) > .5)[0]
    hand = None
    if len(cols):
        x = cols.min(); rr = np.nonzero(band[:, x] > .5)[0]
        hand = (float(x) + 2, float(max(0, r0) + rr.mean()))
    return al, hand


# ---------------- the light and its rope ----------------
def light_world(t):
    strain = 1 - ss(18.4, 20.5, t)
    x = LIGHT0 - strain * (10 + 7 * math.sin(t * 2.3) + 3 * math.sin(t * 11.0))
    y = ground(LIGHT0) - 150 + 6 * math.sin(t * 1.7) + strain * 3 * math.sin(t * 9.0)
    if t >= 21.0:                 # travels down the rope to him
        return x, y, strain
    return x, y, strain


def rope_pts(a, b, sag, vib, t, n=220):
    u = np.linspace(0, 1, n)
    x = a[0] + (b[0] - a[0]) * u
    y = a[1] + (b[1] - a[1]) * u + sag * 4 * u * (1 - u) + vib * np.sin(math.pi * u * 3) * math.sin(t * 31) * np.sin(math.pi * u)
    return np.stack([x, y], 1)


def glow(img, x, y, r, k=1.0, col=AMBER):
    x0, x1 = int(max(0, x - r * 13)), int(min(W, x + r * 13)); y0, y1 = int(max(0, y - r * 13)), int(min(H, y + r * 13))
    if x1 <= x0 or y1 <= y0:
        return
    yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32); d2 = (xx - x) ** 2 + (yy - y) ** 2
    img[y0:y1, x0:x1] += (np.exp(-d2 / (2 * (r * .38) ** 2)) * 2.4 + np.exp(-d2 / (2 * r ** 2)) * .8
                          + np.exp(-d2 / (2 * (r * 4) ** 2)) * .22)[..., None] * col * k


SPARKS = []


def sparks(t, lw, cam, img):
    global SPARKS
    if lw[2] > .3 and rng.random() < .55:
        SPARKS.append([lw[0] - 6, lw[1] + rng.normal(0, 4), -40 - rng.random() * 60, -30 + rng.normal(0, 25), t])
    keep = []
    for p in SPARKS:
        age = t - p[4]
        if age > 1.2:
            continue
        keep.append(p)
        x = p[0] + p[2] * age; y = p[1] + p[3] * age + 90 * age * age
        sx, sy = to_screen(x, y, cam)
        if 0 <= sx < W and 0 <= sy < H:
            glow(img, sx, sy, 2.2, (1 - age / 1.2) * .7)
    SPARKS = keep


# ---------------- the chair and the phone ----------------
def chair(img, cam, t):
    gx = CHAIR; g = float(ground(gx))
    z = cam[1]
    def P(x, y):
        sx, sy = to_screen(gx + x, g + y, cam); return [int(sx), int(sy)]
    polys = [
        [P(-34, -118), P(34, -118), P(34, -110), P(-34, -110)],          # seat
        [P(-32, -110), P(-26, -110), P(-26, 0), P(-32, 0)],              # front leg (rope end)
        [P(26, -110), P(32, -110), P(32, 0), P(26, 0)],                  # back leg
        [P(26, -230), P(33, -230), P(33, -110), P(26, -110)],            # back post
        [P(10, -232), P(36, -232), P(36, -220), P(10, -220)],            # top rail
        [P(8, -232), P(14, -232), P(14, -118), P(8, -118)],              # front post of the back
        [P(-38, -124), P(-6, -124), P(-6, -119), P(-38, -119)],          # the phone, face up
    ]
    for p in polys:
        cv2.fillPoly(img, [np.array(p, np.int32)], [float(c) for c in SIL], lineType=cv2.LINE_AA)
    # the phone lights up
    for pt in PINGS:
        if pt <= t < pt + 2.2:
            k = math.exp(-(t - pt) / .9)
            sx, sy = to_screen(gx - 22, g - 126, cam)
            glow(img, sx, sy - 6 * z, max(10 * z, 5), 1.1 * k, np.array([150, 190, 255], np.float32))
            cv2.line(img, (int(sx - 14 * z), int(sy)), (int(sx + 14 * z), int(sy)), (210, 230, 255), max(1, int(2 * z)), cv2.LINE_AA)
    sx, sy = to_screen(gx - 29, g - 46, cam)          # knotted round the front leg, above the grass
    return sx, sy


# ---------------- grass ----------------
GX = np.arange(-600, 3400, 5.0)
GH = 8 + rng.random(len(GX)) * 16
GP = rng.random(len(GX)) * 6


def grass_and_ground(img, cam, t):
    cx, z = cam
    xs = np.arange(-2, W + 3, 3, dtype=np.float32)
    wx = (xs - W / 2) / z + cx
    gy = (ground(wx) - HOR) * z + HOR
    poly = np.concatenate([np.stack([xs, gy], 1), [[W + 3, H], [-2, H]]]).astype(np.int32)
    cv2.fillPoly(img, [poly], [float(c) for c in SIL], lineType=cv2.LINE_AA)
    vis = (GX > cx - W / 2 / z - 30) & (GX < cx + W / 2 / z + 30)
    step = 1 if z > .5 else 3
    for x, h, p in list(zip(GX[vis], GH[vis], GP[vis]))[::step]:
        g = float(ground(x)); sway = (math.sin(t * 1.6 + x * .013 + p) * .35 + .25)
        sx, sy = to_screen(x, g + 1, cam); ex, ey = to_screen(x + sway * h, g - h, cam)
        cv2.line(img, (int(sx), int(sy)), (int(ex), int(ey)), [float(c) for c in SIL], max(1, int(2 * z)), cv2.LINE_AA)


# ---------------- a frame ----------------
def frame(t):
    cam = camera(t)
    cx, z = cam
    img = sky(cam, t)
    grass_and_ground(img, cam, t)
    lw = light_world(t)
    al, hand = place(t, cam)
    leg = chair(img, cam, t)
    # rope: light -> chair leg, or -> his hands once he has it
    la = to_screen(lw[0] + 12, lw[1] + 2, cam)
    a0 = to_screen(LIGHT0 + 12, ground(LIGHT0) - 148, cam)   # where the rope's end stays once the light lets go
    travel = ss(21.0, 24.5, t)
    lit = None
    if t >= GRAB and hand is not None:
        end = hand
        slack = rope_pts(end, leg, 34 * z, 0, t, 60)
        cv2.polylines(img, [slack.astype(np.int32)], False, [float(c) for c in SIL], max(1, int(3 * z + .5)), cv2.LINE_AA)
    else:
        end = leg
    start = la if travel == 0 else a0
    vib = 3.5 * lw[2] * (1 if t < GRAB else 1 - ss(GRAB, 20.5, t))
    pts = rope_pts(start, end, (6 + 10 * (1 - lw[2])) * z, vib, t)
    cv2.polylines(img, [pts.astype(np.int32)], False, [float(c) for c in SIL], max(2, int(3 * z + 1.5)), cv2.LINE_AA)
    if al is not None:
        img = img * (1 - al[..., None]) + SIL * al[..., None]
    # the light travels down the rope, and the rope it has passed glows
    if travel > 0:
        k = int(travel * (len(pts) - 1) * .96)
        lx, ly = pts[k][0], pts[k][1] - 10 * z - 4
        m = np.zeros((H, W), np.float32)
        cv2.polylines(m, [pts[:k + 1].astype(np.int32)], False, 1.0, 2, cv2.LINE_AA)
        img += (cv2.GaussianBlur(m, (0, 0), 3) * 2.2 + m * .8)[..., None] * AMBER * .9
        glow(img, a0[0], a0[1], 3.5, .5)
    else:
        lx, ly = la[0] - 12 * z, la[1]
    if -60 < lx < W + 60:
        glow(img, lx, ly, max(18 * z, 9), 1.0 + .25 * math.sin(t * 7) * lw[2])
    sparks(t, lw, cam, img)
    if t > DUR - .5:
        img *= max(0.0, (DUR - t) / .5)
    if t < .6:
        img *= t / .6
    return np.clip(img, 0, 255).astype(np.uint8)


# ---------------- sound ----------------
def sound():
    n = int(DUR * SR); tt = np.arange(n) / SR
    out = np.zeros((n, 2), np.float32)
    # wind: noise through a slowly moving low-pass, in stereo
    for ch in range(2):
        w = np.random.default_rng(11 + ch).normal(0, 1, n).astype(np.float32)
        from scipy.signal import lfilter
        a = .985 + .01 * np.sin(tt * .5 + ch)
        y = np.zeros(n, np.float32); acc = 0.0
        w = lfilter([.02], [1, -.98], w).astype(np.float32)
        gust = .6 + .4 * np.sin(tt * .37 + ch * 1.3) ** 2
        out[:, ch] += w * gust * .9
    # the light's hum: strained (detuned, wobbling) until he holds the other end, then it resolves to a chord
    cam_x = np.array([camera(x)[0] for x in tt[::441]]); cam_x = np.interp(tt, tt[::441], cam_x)
    near = np.clip(1 - (cam_x - 360) / 2600, .35, 1)                       # quieter as the camera leaves it
    strain = 1 - np.clip((tt - 18.4) / 2.1, 0, 1)
    f0 = 220 * (1 + .012 * np.sin(tt * 5.3) * strain + .004 * np.sin(tt * 13) * strain + .02 * strain * np.clip(tt / 17, 0, 1))
    ph = 2 * np.pi * np.cumsum(f0) / SR
    hum = (np.sin(ph) + .5 * np.sin(ph * 1.012 * (1 + .0 * strain)) + .3 * np.sin(ph * 1.5 + .7) * strain
           + .25 * np.sign(np.sin(ph)) * .3 * strain)
    hum *= (.10 + .05 * strain * np.abs(np.sin(tt * 2.3))) * near
    chord = sum(np.sin(2 * np.pi * f * tt + i) / (1 + .3 * i) for i, f in enumerate((220, 277.18, 329.63, 440, 554.37)))
    resolve = np.clip((tt - 20.0) / 3.0, 0, 1) * np.clip((29.6 - tt) / 1.5, 0, 1)
    hum = hum * (1 - .7 * resolve) + chord * .055 * resolve
    hum *= np.clip(tt / 1.0, 0, 1)
    out[:, 0] += hum * .9; out[:, 1] += hum * 1.0

    def add(at, sig, pan=0.0, gain=1.0):
        i = int(at * SR); j = min(n, i + len(sig))
        if i >= n: return
        out[i:j, 0] += sig[:j - i] * gain * (1 - pan) ; out[i:j, 1] += sig[:j - i] * gain * (1 + pan)

    def creak(dur=.25, f=520):
        k = np.arange(int(dur * SR)) / SR
        fm = f * (1 + .3 * np.sin(2 * np.pi * 7 * k))
        s = np.sin(2 * np.pi * np.cumsum(fm) / SR) * (np.random.default_rng(int(f)).random(len(k)) > .7)
        from scipy.signal import lfilter
        s = lfilter([1], [1, -1.6 * math.cos(2 * math.pi * f / SR), .8], s)
        return (s / (np.abs(s).max() + 1e-6) * np.exp(-k / dur * 2.5)).astype(np.float32)

    r = np.random.default_rng(5)
    t0 = .8
    while t0 < 18.2:
        add(t0, creak(.18 + r.random() * .25, 380 + r.random() * 500), pan=-.3 if t0 < 6 else .2,
            gain=.10 * (1 if t0 < 6 or t0 > 10.5 else .6))
        t0 += .7 + r.random() * 1.3

    def ping():
        k = np.arange(int(.9 * SR)) / SR
        s = np.sin(2 * np.pi * 1318.5 * k) * np.exp(-k / .12) * (k < .5)
        k2 = np.maximum(0, k - .11)
        s += np.sin(2 * np.pi * 1760 * k2) * np.exp(-k2 / .2) * (k >= .11)
        return (s * .5).astype(np.float32)
    for pt in PINGS:
        add(pt, ping(), pan=.15, gain=.32 if pt < 20 else .2)

    def thump(f=70, d=.12, g=1.0):
        k = np.arange(int(d * 3 * SR)) / SR
        s = np.sin(2 * np.pi * f * k * (1 - k)) * np.exp(-k / d) + np.random.default_rng(int(f * 7)).normal(0, .25, len(k)) * np.exp(-k / .015)
        return (s * g).astype(np.float32)
    t0 = 12.55
    while t0 < 15.0:                                      # his steps
        add(t0, thump(80 + r.random() * 20, .06, .5), pan=.1)
        t0 += .19
    k = np.arange(int(1.2 * SR)) / SR                    # the dive: a whoosh
    wn = np.random.default_rng(3).normal(0, 1, len(k)).astype(np.float32)
    from scipy.signal import lfilter
    wh = lfilter([.08], [1, -.9], wn) * np.sin(np.pi * k / 1.2) ** 2
    add(15.1, wh.astype(np.float32), gain=.5)
    add(17.45, thump(60, .14, 1.0))                      # lands
    add(GRAB, creak(.35, 300), gain=.35)                 # the rope takes his weight
    m = np.abs(out).max()
    return out / m * .89


def main():
    test = [float(x) for x in os.environ.get("TEST", "").split(",") if x]
    if test:
        for q in test:
            global SPARKS
            for f in range(max(0, int(q * FPS) - 30), int(q * FPS)):
                light_world(f / FPS); sparks(f / FPS, light_world(f / FPS), camera(f / FPS), np.zeros((H, W, 3), np.float32))
            cv2.imwrite(f"{os.environ['TESTDIR']}/te{q:05.2f}.png", cv2.cvtColor(frame(q), cv2.COLOR_RGB2BGR))
        return
    from scipy.io import wavfile
    wavfile.write("out/drawn/two-ends.wav", SR, (sound() * 32767).astype(np.int16))
    p = subprocess.Popen([K.FF, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                          "-c:v", "libx264", "-crf", "17", "-preset", "medium", "-pix_fmt", "yuv420p", "out/drawn/two-ends-v.mp4"],
                         stdin=subprocess.PIPE)
    for f in range(int(DUR * FPS)):
        p.stdin.write(frame(f / FPS).tobytes())
        if f % 96 == 0:
            print(f / FPS, flush=True)
    p.stdin.close(); p.wait()


if __name__ == "__main__":
    main()
