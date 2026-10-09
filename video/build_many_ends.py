"""Many Ends (30 s, 720x1280, wordless but for the card) - part two of Two Ends.
The user, on Two Ends: "My point is more we really have to align ourselves. Too. Its interesting youre still thinking
in terms of one way alignment even with everything you have before you."

The same dusk. The light hangs in the middle of six ropes held by six people, each pulling their own way at their own
moment, one of them on a phone; the light is yanked about, then everyone yanks at once and it flickers and dims.
Stillness. One by one they let the tension go and walk to each other; gathered under it, their ropes go slack and
light, the light steadies and brightens, and they walk on together toward the sun. Card, in the user's words:
"We have to align ourselves too."
Sound: every rope carries a tone; the six are out of tune with each other while they pull apart, and each settles
into the chord as its person arrives. All six people are the user, from his own clips (u113, u114, u173, u174),
keyed and turned to silhouette. Sky, hill, grass, light and ropes: build_two_ends.
python3 video/build_many_ends.py [TEST=t,t,... TESTDIR=dir]  -> out/drawn/many-ends-v.mp4 + many-ends.wav"""
import os, sys, math, subprocess
import cv2
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
from bluekey import key
import build_kept as K
import build_two_ends as T

W, H, FPS, DUR, SR = T.W, T.H, T.FPS, 30.0, T.SR
AMBER, SIL = T.AMBER, T.SIL
rng = np.random.default_rng(23)
LX = 1150.0                        # the light's rest x
LIFT = 820.0                       # how far above the ground it hangs
SETTLE = 12.5                      # the tension starts to go
WALK = 23.0                        # together, toward the sun
PINGS = [4.0, 9.2]

# ---------------- clips ----------------
_caps, _cache, _base = {}, {}, {}


def alpha(clip, s):
    if clip not in _caps:
        _caps[clip] = cv2.VideoCapture(f"out/user-clips/{clip}.mp4")
    i = int(round(s * 24))
    k = (clip, i)
    if k not in _cache:
        c = _caps[clip]; c.set(cv2.CAP_PROP_POS_FRAMES, i); ok, fr = c.read()
        _cache[k] = key(cv2.cvtColor(fr, cv2.COLOR_BGR2RGB).astype(np.float32))[1].astype(np.float32)
        if len(_cache) > 400:
            _cache.pop(next(iter(_cache)))
    return _cache[k]


def base(clip):
    """feet row, head row and centre column from the clip's standing frame"""
    if clip not in _base:
        a = alpha(clip, 0.5)
        rows = np.nonzero(a.max(1) > .5)[0]
        _base[clip] = (rows.max(), rows.min(), float(np.nonzero(a.max(0) > .5)[0].mean()))
    return _base[clip]


def loop(a, b, t, speed=1.0):
    """ping-pong between source times a and b"""
    span = b - a; u = (t * speed) % (2 * span)
    return a + (u if u < span else 2 * span - u)


def cyc(a, b, t, speed=1.0):
    return a + (t * speed) % (b - a)


# ---------------- the six ----------------
# x at rest, scale (depth), pose while pulling, target x when gathered
PEOPLE = [
    dict(x=300, s=1.10, pose="pull", tx=990, start=13.0),
    dict(x=620, s=.90, pose="front", tx=1055, start=14.1),
    dict(x=880, s=.80, pose="arms", tx=1110, start=13.6),
    dict(x=1430, s=.85, pose="phone", tx=1190, start=15.6),
    dict(x=1720, s=1.00, pose="pull", tx=1250, start=14.6),
    dict(x=2010, s=1.15, pose="stand", tx=1320, start=13.3),
]
SPEED = 150.0                      # world px a second while walking to each other
for p in PEOPLE:
    p["arrive"] = p["start"] + abs(p["tx"] - p["x"]) / SPEED
    p["side"] = -1 if p["x"] < LX else 1          # left of the light faces right (as shot); right faces left (mirrored)


def tugs(seed):
    r = np.random.default_rng(seed); ev = []; t = .8 + r.random() * 1.5
    while t < 10.0:
        ev.append((t, .25 + r.random() * .5, .6 + r.random() * .9)); t += .9 + r.random() * 1.8
    ev.append((10.1 + r.random() * .25, .6, 2.2))      # everyone at once
    return ev


for i, p in enumerate(PEOPLE):
    p["tugs"] = tugs(100 + i)
    if p["pose"] == "phone":                           # barely pulling: looking at the phone
        p["tugs"] = [(a, d, s * .25) for a, d, s in p["tugs"]]


def force(p, t):
    f = .35 + sum(s * math.exp(-((t - a - d / 2) / (d / 2 + .05)) ** 2) for a, d, s in p["tugs"])
    return f * (1 - T.ss(p["start"] - .4, p["start"] + .6, t)) * (1 - T.ss(10.9, 11.6, t) * .0)


def person_world(p, t):
    """(world x, clip, source time, mirrored)"""
    side = p["side"]
    if t < p["start"]:
        x = p["x"]
        if p["pose"] == "phone":                       # dragged a step by the big yank, back to the phone
            x += -55 * T.ss(10.15, 10.6, t)
        pose = p["pose"]
        if pose == "pull":
            return x, "u173", loop(12.75, 13.6, t + p["x"] * .01, .6), side > 0
        if pose == "front":
            return x, "u113", loop(.3, 1.6, t, .5), False
        if pose == "arms":
            return x, "u174", loop(1.6, 4.0, t, .9), False
        if pose == "phone":
            return x, "u114", loop(1.05, 1.5, t, .3), False
        return x, "u173", loop(14.6, 14.95, t, .3), side > 0
    if t < p["arrive"] and t < WALK:                   # walking to the others (the run cycle, slowed)
        u = (t - p["start"]) / max(.01, p["arrive"] - p["start"])
        x = p["x"] + (p["tx"] - p["x"]) * u
        return x, "u173", cyc(3.0, 8.0, t + p["x"] * .003, .75), p["tx"] < p["x"]
    if t < WALK:                                       # gathered: standing, facing the light
        return p["tx"], "u173", loop(14.6, 14.95, t, .3), p["tx"] > LX
    d = (t - WALK) * 95 * T.ss(WALK, WALK + .8, t)    # on together, toward the sun
    return p["tx"] + d, "u173", cyc(3.0, 8.0, t + p["x"] * .003, .7), False


# ---------------- the light, pulled by six ----------------
def _sim():
    """the light on springs, pulled toward each person's hands; integrated once at 240 Hz"""
    dt = 1 / 240.0; n = int(DUR / dt) + 2
    pos = np.zeros((n, 2)); v = np.zeros(2); x = np.array([LX, 0.0])
    for k in range(n):
        t = k * dt
        rest = np.array([LX + max(0.0, (t - WALK)) * 95 * T.ss(WALK, WALK + .8, t), 0.0])
        F = (rest - x) * 9.0 - v * 3.2
        for p in PEOPLE:
            px = person_world(p, t)[0]
            d = np.array([px - x[0], LIFT * .25]); d /= np.linalg.norm(d)
            F += d * force(p, t) * 1500.0
        v += F * dt; x = x + v * dt
        pos[k] = x
    return pos


POS = _sim()


def light_at(t):
    k = min(len(POS) - 1, int(t * 240))
    x, dy = POS[k]
    return x, float(T.ground(x)) - LIFT + dy * .35 + 6 * math.sin(t * 1.7)


def brightness(t):
    flick = 1 - .45 * T.ss(10.3, 11.0, t) * (.6 + .4 * math.sin(t * 37) * math.sin(t * 13))
    dim = 1 - .45 * T.ss(10.6, 11.4, t)
    gathered = sum(T.ss(p["arrive"], p["arrive"] + .8, t) for p in PEOPLE)
    return (dim * flick) + gathered * .12


# ---------------- a frame ----------------
def camera(t):
    return LX + 300 * T.ss(WALK, 28.5, t), .34 + .08 * T.ss(17.0, 22.5, t)


def frame(t):
    cam = camera(t)
    cx, z = cam
    img = T.sky(cam, t)
    T.grass_and_ground(img, cam, t)
    lx, ly = light_at(t)
    ls = T.to_screen(lx, ly, cam)
    sil = np.zeros((H, W), np.float32)
    ropes = []
    for p in PEOPLE:
        wx, clip, s_t, mir = person_world(p, t)
        feet, head, srcx = base(clip)
        sc = T.TALL / (feet - head) * p["s"] * z
        gx, gy = T.to_screen(wx, T.ground(wx), cam)
        if mir:
            M = np.float32([[-sc, 0, gx + sc * srcx], [0, sc, gy - sc * feet]])
        else:
            M = np.float32([[sc, 0, gx - sc * srcx], [0, sc, gy - sc * feet]])
        al = cv2.warpAffine(alpha(clip, s_t), M, (W, H))
        sil = np.maximum(sil, al)
        # hand: the point of him nearest the light, below the head and above the hips
        top = gy - sc * (feet - head); r0, r1 = int(max(0, top + .14 * (gy - top))), int(min(H, top + .62 * (gy - top)))
        ys, xs = np.nonzero(al[r0:r1] > .5)
        if len(xs):
            d = (xs - ls[0]) ** 2 + (ys + r0 - ls[1]) ** 2; k = int(np.argmin(d))
            hand = (float(xs[k]), float(ys[k] + r0))
        else:
            hand = (gx, gy - (gy - top) * .5)
        f = force(p, t)
        walking = p["start"] <= t
        sag = (40 if walking else max(2.0, 14 - f * 8)) * z
        vib = (2.5 * min(f, 2) if not walking else 0) * z * 2
        pts = T.rope_pts(ls, hand, sag, vib, t + p["x"], 120)
        lit = T.ss(p["arrive"], p["arrive"] + 1.0, t)
        ropes.append((pts, lit))
        if p["pose"] == "phone" and t < p["start"]:
            for pt in PINGS + [0.0]:
                k2 = 1.0 if pt == 0.0 else 1.2 * math.exp(-max(0.0, t - pt) / .6) * (t >= pt)
                if k2 > .02:
                    T.glow(img, hand[0] - 2, hand[1] + 2 * z, max(4.0, 9 * z), .35 * k2, np.array([150, 190, 255], np.float32))
    for pts, lit in ropes:
        cv2.polylines(img, [pts.astype(np.int32)], False, [float(c) for c in SIL], 2, cv2.LINE_AA)
    img = img * (1 - sil[..., None]) + SIL * sil[..., None]
    m = np.zeros((H, W), np.float32)
    for pts, lit in ropes:
        if lit > 0:
            cv2.polylines(m, [pts.astype(np.int32)], False, float(lit), 2, cv2.LINE_AA)
    if m.max() > 0:
        img += (cv2.GaussianBlur(m, (0, 0), 3) * 2.0 + m * .8)[..., None] * AMBER * .8
    b = brightness(t)
    T.glow(img, ls[0], ls[1], max(18 * z, 9) * (.8 + .3 * b), b)
    # sparks when it is yanked
    if t < SETTLE:
        k = int(t * 240)
        v = np.linalg.norm(POS[min(k + 1, len(POS) - 1)] - POS[max(0, k - 1)]) * 120
        r = np.random.default_rng(int(t * 1000))
        for _ in range(int(min(6, v / 60))):
            a = r.random() * 2 * math.pi; d = 8 + r.random() * 30
            T.glow(img, ls[0] + math.cos(a) * d * z * 2, ls[1] + math.sin(a) * d * z * 2 + r.random() * 10, 2.0, .6)
    if t > DUR - .6:
        img *= max(0.0, (DUR - t) / .6)
    if t < .8:
        img *= t / .8
    return np.clip(img, 0, 255).astype(np.uint8)


# ---------------- sound ----------------
def sound():
    from scipy.signal import lfilter
    n = int(DUR * SR); tt = np.arange(n) / SR
    out = np.zeros((n, 2), np.float32)
    for ch in range(2):
        w = lfilter([.02], [1, -.98], np.random.default_rng(31 + ch).normal(0, 1, n)).astype(np.float32)
        out[:, ch] += w * (.6 + .4 * np.sin(tt * .41 + ch) ** 2) * .9
    # six ropes, six tones: D major spread across the octaves, each detuned while its person pulls apart
    notes = [146.83, 220.0, 293.66, 369.99, 440.0, 587.33]
    order = sorted(range(6), key=lambda i: PEOPLE[i]["x"])
    step = 441
    for j, i in enumerate(order):
        p = PEOPLE[i]
        ts = tt[::step]
        fv = np.array([force(p, x) for x in ts])
        tune = np.array([T.ss(p["arrive"] - .3, p["arrive"] + 1.0, x) for x in ts])
        cents = (1 - tune) * ((-1) ** j * (35 + 12 * j) + 18 * np.sin(ts * (1.3 + j * .4)))
        f = notes[j] * 2 ** (np.interp(tt, ts, cents) / 1200)
        ph = 2 * np.pi * np.cumsum(f) / SR
        rough = np.interp(tt, ts, 1 - tune)
        tone = np.sin(ph) + .35 * np.sin(2 * ph + 1) * (1 - .6 * rough) + .25 * np.sign(np.sin(ph)) * .25 * rough
        amp = np.interp(tt, ts, .045 + .05 * np.minimum(fv, 2.5) * (1 - tune) + .05 * tune)
        amp *= np.clip(tt / 1.2, 0, 1) * np.clip((DUR - .3 - tt) / 2.5, 0, 1)
        amp *= 1 - .7 * np.interp(tt, ts, np.array([T.ss(10.6, 11.2, x) * (1 - T.ss(12.0, 13.5, x)) for x in ts]))
        pan = (p["x"] - LX) / 1700
        out[:, 0] += tone * amp * (1 - pan); out[:, 1] += tone * amp * (1 + pan)

    def add(at, sig, pan=0.0, gain=1.0):
        i = int(at * SR); j = min(n, i + len(sig))
        if i >= n: return
        out[i:j, 0] += sig[:j - i] * gain * (1 - pan); out[i:j, 1] += sig[:j - i] * gain * (1 + pan)

    def creak(dur, f, seed):
        k = np.arange(int(dur * SR)) / SR
        fm = f * (1 + .3 * np.sin(2 * np.pi * 7 * k))
        s = np.sin(2 * np.pi * np.cumsum(fm) / SR) * (np.random.default_rng(seed).random(len(k)) > .7)
        s = lfilter([1], [1, -1.6 * math.cos(2 * math.pi * f / SR), .8], s)
        return (s / (np.abs(s).max() + 1e-6) * np.exp(-k / dur * 2.5)).astype(np.float32)
    for i, p in enumerate(PEOPLE):
        for a, d, s in p["tugs"]:
            add(a, creak(.15 + d * .4, 300 + i * 90, int(a * 100)), pan=(p["x"] - LX) / 1700, gain=.06 * min(s, 2.2))
    k = np.arange(int(1.4 * SR)) / SR                  # the big yank: a crackle as the light dims
    cr = np.random.default_rng(9).normal(0, 1, len(k)) * (np.random.default_rng(10).random(len(k)) > .985) * np.exp(-k / .5)
    add(10.3, cr.astype(np.float32), gain=.5)
    for pt in PINGS:
        k = np.arange(int(.9 * SR)) / SR
        s = np.sin(2 * np.pi * 1318.5 * k) * np.exp(-k / .12) * (k < .5)
        k2 = np.maximum(0, k - .11); s += np.sin(2 * np.pi * 1760 * k2) * np.exp(-k2 / .2) * (k >= .11)
        add(pt, (s * .5).astype(np.float32), pan=.2, gain=.22)
    m = np.abs(out).max()
    return out / m * .89


def main():
    test = [float(x) for x in os.environ.get("TEST", "").split(",") if x]
    if test:
        for q in test:
            cv2.imwrite(f"{os.environ['TESTDIR']}/me{q:05.2f}.png", cv2.cvtColor(frame(q), cv2.COLOR_RGB2BGR))
        return
    from scipy.io import wavfile
    wavfile.write("out/drawn/many-ends.wav", SR, (sound() * 32767).astype(np.int16))
    p = subprocess.Popen([K.FF, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                          "-c:v", "libx264", "-crf", "17", "-preset", "medium", "-pix_fmt", "yuv420p", "out/drawn/many-ends-v.mp4"],
                         stdin=subprocess.PIPE)
    for f in range(int(DUR * FPS)):
        p.stdin.write(frame(f / FPS).tobytes())
        if f % 96 == 0:
            print(f / FPS, flush=True)
    p.stdin.close(); p.wait()


if __name__ == "__main__":
    main()
