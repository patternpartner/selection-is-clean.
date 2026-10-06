"""'Where I Keep Everything' - no one's likeness. The user: "Let's take me out of the equation now ... how much you have at
your disposal. All those videos and songs. Let's try something completely different. Weird. Creative. Tell your story
but like you have never before."
The inside of a memory, as a place. Every clip in the archive that is not the user and not a real person's face (247:
the 6 Oct batches, the older Grok scenes, the generated episode clips - video/archive_index.py) hangs as a small lit
screen in black space, laid out by likeness (PCA of a 12x12 colour thumbnail) the way a model sorts what it has seen.
The amber light - Claude, from the earlier films - travels through it and the camera follows. Screens play as it passes,
and you HEAR them: each clip's own sound, mixed by distance (AUDIO=1). It is pulled into the dark nebula (the clowns, the
crying doll, the hollow teddy, the ghoul, the sausage TV), where the sound warps and the light gutters; in the middle of
it, everything stops; it turns; and it goes looking - fast, out through everything - for one small screen with something
good in it (a child and a little robot in a field at golden hour, from one of our own episodes). The song (the user's
'Breath On The Pane') starts only then. The screen opens to fill the frame; the light goes into it. End card.
    python3 video/build_where_i_keep.py         (TEST=t1,t2 TESTDIR=dir; PART=a,b VOUT=f; film seconds)
    AUDIO=1 python3 video/build_where_i_keep.py -> out/drawn/where-i-keep.wav (the distance mix + the song)
"""
import json
import math
import os
import subprocess

import cv2
import imageio_ffmpeg
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

F = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 720, 1280, 24
DUR = 62.0
TEST = [float(x) for x in os.environ.get("TEST", "").split(",") if x]
PART = [float(x) for x in os.environ.get("PART", "").split(",") if x]
AMBER = np.array([255, 176, 88], np.float32)
FOC = 820.0
DARK = [0, 26, 28, 30, 33, 35, 108, 112, 116, 118, 119, 120, 121, 122]
FINAL = 202
T_IN, T_DARK, T_DEEP, T_STILL, T_TURN, T_OUT, T_FIND, T_OPEN, T_CARD = 8.0, 24.0, 33.0, 36.0, 39.5, 41.0, 50.0, 55.5, 58.4
rng = np.random.default_rng(7)


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def ramp(s, a, b):
    return ease((s - a) / (b - a))


IDX = json.load(open("out/archive/index.json"))
N = len(IDX)


def layout():
    feats = np.array([e["feat"] for e in IDX], np.float32)
    feats -= feats.mean(0)
    u, s_, vt = np.linalg.svd(feats, full_matrices=False)
    p = u[:, :3] * s_[:3]
    p = (p - p.mean(0)) / p.std(0) * np.array([8, 10, 7])
    p += rng.normal(0, 1.6, p.shape)                          # a little air between likenesses
    d = np.array(DARK)
    dc = np.array([16.0, -6.0, 22.0])                         # the dark nebula, off to one side
    p[d] = dc + (p[d] - p[d].mean(0)) * 0.35 + rng.normal(0, 1.2, (len(d), 3))
    for i in range(N):                                       # keep the rest out of the nebula
        if i not in DARK and np.linalg.norm(p[i] - dc) < 7:
            p[i] = dc + (p[i] - dc) / (np.linalg.norm(p[i] - dc) + 1e-6) * 9
    fp = np.array([-20.0, 9.0, -14.0])                        # the good one: alone, far from the dark
    for i in range(N):
        if i != FINAL and np.linalg.norm(p[i] - fp) < 6:
            p[i] = fp + (p[i] - fp) / (np.linalg.norm(p[i] - fp) + 1e-6) * 7
    p[FINAL] = fp
    return p, dc, fp


POS, DC, FP = layout()
CEN = POS.mean(0)
SRC = list(range(N))                                        # which clip each screen shows
CROWD = []                                                   # (screen, its shell position)
for rep_ in range(3):
    for i in DARK:
        v = rng.normal(0, 1, 3)
        v /= np.linalg.norm(v)
        CROWD.append((len(SRC), DC + v * rng.uniform(4.5, 7.5)))
        SRC.append(i)
POS = np.r_[POS, np.array([c[1] for c in CROWD])]
BASE = POS.copy()
NS = len(SRC)


def catmull(pts, ts, t):
    ts = np.asarray(ts, np.float32)
    i = int(np.clip(np.searchsorted(ts, t) - 1, 0, len(ts) - 2))
    u = (t - ts[i]) / (ts[i + 1] - ts[i])
    u = u * u * (3 - 2 * u)
    p0, p1, p2, p3 = pts[max(i - 1, 0)], pts[i], pts[i + 1], pts[min(i + 2, len(pts) - 1)]
    return 0.5 * ((2 * p1) + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u ** 3)


# the path: where the camera is and what it looks at
WT = [0.0, 8.0, 15.0, 24.0, 33.0, 36.0, 39.5, 45.0, 50.0, 55.5, 58.4, 62.0]
CAMP = [CEN + [0, 4, -95], CEN + [0, 2, -40], CEN + [-6, 3, -8], DC + [-6, 2, -14], DC + [0, 0, -3], DC + [0, 0, -2.5],
        DC + [0, 0, -2.6], (DC + FP) / 2 + [0, 6, 0], FP + [0, 0, -9], FP + [0, 0, -1.4], FP + [0, 0, -0.8], FP + [0, 0, -0.8]]
LOOK = [CEN, CEN, CEN + [4, 0, 6], DC, DC + [0, 0, 6], DC + [0, 0, 6], FP, FP, FP, FP, FP, FP]
CAMP = [np.asarray(c, np.float32) for c in CAMP]
LOOK = [np.asarray(c, np.float32) for c in LOOK]


def camera(t):
    c = catmull(CAMP, WT, t)
    look = catmull(LOOK, WT, t)
    if T_STILL <= t < T_OUT:                                   # it turns, in the dark, from the nebula to the far light
        u = ease((t - T_STILL - 0.8) / (T_OUT - T_STILL - 0.8))
        a = DC + [0, 0, 6]
        look = a * (1 - u) + FP * u
    return c, look


def basis(c, look):
    f = look - c
    f /= np.linalg.norm(f) + 1e-6
    r = np.cross(f, [0, 1, 0])
    r /= np.linalg.norm(r) + 1e-6
    u = np.cross(r, f)
    return f, r, u


def project(p, c, f, r, u):
    d = p - c
    z = d @ f
    x = d @ r
    y = d @ u
    return x / np.maximum(z, 1e-3) * FOC + W / 2, -y / np.maximum(z, 1e-3) * FOC + H / 2, z


class Thumbs:
    def __init__(self):
        self.t = [np.load(e["thumbs"], mmap_mode="r") for e in IDX]
        self.big = None

    def frame(self, i, t):
        fr = self.t[i]
        return np.asarray(fr[int((t * 12 + i * 7) % len(fr))])

    def final(self, t):
        if self.big is None:
            path = [p for p in os.listdir("out/clips") if p.startswith(IDX[FINAL]["id"][1:])][0]
            raw = subprocess.run([F, "-loglevel", "error", "-i", f"out/clips/{path}", "-map", "0:v:0", "-vf", "fps=24,scale=1280:704",
                                  "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
            self.big = np.frombuffer(raw, np.uint8).reshape(-1, 704, 1280, 3)
        return self.big[min(int(max(t - T_FIND, 0) * 24), len(self.big) - 1)]


NEIGH = [np.argsort(np.linalg.norm(POS[:N] - POS[i], axis=1))[1:3] for i in range(N)]


def dark_level(t):
    return ramp(t, T_DARK, T_DEEP) * (1 - ramp(t, T_TURN, T_OUT + 2))


def render(th, t):
    c, look = camera(t)
    f, r, u = basis(c, look)
    dk0 = dark_level(t)
    pos = BASE.copy()
    for k, (si, shell) in enumerate(CROWD):                  # the dark closes in on it
        pos[si] = shell + (c + (shell - DC) * 0.45 - shell) * 0.55 * dk0
    sx, sy, sz = project(pos, c, f, r, u)
    img = np.zeros((H, W, 3), np.float32)
    dk = dark_level(t)
    # far stars: a dust of tiny points so the dark has depth
    # threads between neighbours: the map's connections
    lay = np.zeros((H, W), np.float32)
    for i in range(N):
        if sz[i] < 0.5:
            continue
        for j in NEIGH[i]:
            if sz[j] < 0.5:
                continue
            a = min(1.0, 8.0 / (sz[i] + sz[j])) * 0.5
            cv2.line(lay, (int(sx[i]), int(sy[i])), (int(sx[j]), int(sy[j])), a, 1, cv2.LINE_AA)
    img += lay[..., None] * (np.array([70, 110, 160], np.float32) * (1 - dk) + np.array([150, 40, 40], np.float32) * dk)
    order = np.argsort(-sz)
    still = T_STILL <= t < T_TURN + 0.5
    for si in order:
        z = sz[si]
        if z < 0.35:
            continue
        i = SRC[si]
        e = IDX[i]
        hgt = FOC * (1.5 if i != FINAL else 1.2) / z
        wdt = hgt * e["w"] / e["h"]
        if hgt < 2.5 or sx[si] + wdt < 0 or sx[si] - wdt > W or sy[si] + hgt < 0 or sy[si] - hgt > H:
            continue
        x0, y0 = int(sx[si] - wdt / 2), int(sy[si] - hgt / 2)
        w_, h_ = max(2, int(wdt)), max(2, int(hgt))
        if i == FINAL and t >= T_FIND and h_ > 120:
            src = th.final(t)
        else:
            src = th.frame(i, (t if not still else T_STILL) + si * 0.37)
        if w_ * h_ > 4 * W * H:
            continue
        tile = np.asarray(Image.fromarray(src).resize((w_, h_), Image.BILINEAR), np.float32)
        fog = math.exp(-max(z - 6, 0) / 40)
        bright = (0.35 + 0.65 * fog)
        if i in DARK:
            tile = tile * (1 + 0.3 * dk) * np.array([1.15, 0.8, 0.8], np.float32)
        elif dk > 0:
            bright *= 1 - 0.75 * dk
        if t >= T_OUT and i != FINAL:
            bright *= 1 - 0.55 * ramp(t, T_FIND, T_OPEN)
        tile *= bright
        xa, ya, xb, yb = max(x0, 0), max(y0, 0), min(x0 + w_, W), min(y0 + h_, H)
        if xa >= xb or ya >= yb:
            continue
        img[ya:yb, xa:xb] = tile[ya - y0:yb - y0, xa - x0:xb - x0]
        # a lit edge, like a screen
        edge = (np.array([140, 190, 255], np.float32) if i not in DARK else np.array([255, 80, 70], np.float32)) * fog * 0.5
        if i == FINAL:
            edge = AMBER * (0.6 + 0.4 * ramp(t, T_OUT, T_FIND))
        cv2.rectangle(img, (x0, y0), (x0 + w_ - 1, y0 + h_ - 1), tuple(float(v) for v in edge), 1, cv2.LINE_AA)
    # the light: ahead of the camera, a little low; it gutters in the dark; it streaks on the way out
    lp = c + f * 3.2 - np.array([0, 0.35, 0])
    lx, ly, lz = project(lp[None], c, f, r, u)
    flick = 1 - dk * (0.55 + 0.35 * math.sin(t * 31) * math.sin(t * 7.3))
    if t >= T_OPEN:                                            # it goes into the screen
        v = ease((t - T_OPEN) / (T_CARD - T_OPEN - 0.6))
        flick *= 1 - v
        ly = ly * (1 - v) + (H * 0.5) * v
    rad = 26 * (1 + 0.2 * math.sin(t * 2.3))
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    d2 = (xx - float(lx[0])) ** 2 + (yy - float(ly[0])) ** 2
    img += (np.exp(-d2 / (2 * (rad * 0.35) ** 2)) * 2.2 + np.exp(-d2 / (2 * rad ** 2)) * 0.8 +
            np.exp(-d2 / (2 * (rad * 4) ** 2)) * 0.25)[..., None] * AMBER * flick
    # grade: the dark nebula closes in red; a vignette; the end goes warm, then to black
    vig = np.clip(1.25 - ((xx - W / 2) ** 2 / W ** 2 + (yy - H / 2) ** 2 / H ** 2) * (2.2 + 2.5 * dk), 0, 1)[..., None]
    img = img * vig
    if dk > 0:
        img = img * (1 - 0.25 * dk) + img.mean(-1, keepdims=True) * np.array([0.25, 0.0, 0.0], np.float32) * dk
    if still:                                                  # everything stops; the hum is gone
        img *= 0.75
    img = img + gaussian_filter(img, (8, 8, 0)) * 0.35
    img += rng.normal(0, 2.0, (H, W, 1))
    if t > T_CARD - 0.6:
        img *= 1 - ramp(t, T_CARD - 0.6, T_CARD)
    return np.clip(img, 0, 255).astype(np.uint8)


def audio():
    """each clip's own sound, by distance; warped in the dark; nothing in the stillness; then the song"""
    sr = 16000
    n = int(DUR * sr)
    mix = np.zeros(n, np.float32)
    clips = {i: np.load(e["audio"]).astype(np.float32) / 32768 for i, e in enumerate(IDX) if e["audio"]}
    step = sr // FPS
    gains = {i: np.zeros(int(DUR * FPS) + 1, np.float32) for i in clips}
    for fr in range(int(DUR * FPS)):
        t = fr / FPS
        c, look = camera(t)
        for i in clips:
            d = np.linalg.norm(POS[i] - c)
            gains[i][fr] = 1.0 / (1 + (d / 2.2) ** 2)
    for i, a in clips.items():
        g = np.repeat(gains[i], step)[:n]
        g = gaussian_filter(g, step)
        rep = np.tile(a, n // len(a) + 1)[:n]
        mix += rep * g
    t = np.arange(n) / sr
    dk = np.array([dark_level(x) for x in t[::step]], np.float32)
    dk = np.repeat(dk, step)[:n]
    # in the dark the world slows and sinks: a crude pitch-down by resampling, and a low-pass
    slow = np.interp(np.arange(n) * 0.82, np.arange(n), mix)
    from scipy.signal import butter, sosfilt
    low = sosfilt(butter(2, 900, 'low', fs=sr, output='sos'), slow) * 1.6
    mix = mix * (1 - dk) + low * dk
    mix *= 1 - (np.array([ramp(x, T_STILL - 0.4, T_STILL) * (1 - ramp(x, T_TURN, T_OUT)) for x in t[::step]])
                .repeat(step)[:n])
    mix = mix / (np.percentile(np.abs(mix), 99.5) + 1e-6) * 0.35
    # the song: only once it has turned
    raw = subprocess.run([F, "-loglevel", "error", "-i", "out/songs/breath-on-the-pane.mp3", "-ac", "1", "-ar", str(sr), "-f", "s16le",
                          "-"], capture_output=True).stdout
    song = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
    s0 = int(T_TURN * sr)
    seg = song[:n - s0]
    env = np.clip((np.arange(len(seg)) / sr) / 3.0, 0, 1) * (1 - np.clip(((np.arange(len(seg)) / sr) + T_TURN - (DUR - 3)) / 3, 0, 1))
    mix[s0:s0 + len(seg)] += seg * env * 0.9
    mix[s0:] *= 1.0
    mix = np.clip(mix, -1, 1)
    import wave
    w = wave.open("out/drawn/where-i-keep.wav", "wb")
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())
    w.close()
    print("wav", len(mix) / sr)


def main():
    if os.environ.get("AUDIO"):
        audio()
        return
    th = Thumbs()
    out = None
    if not TEST:
        out = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                                str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "17", "-preset", "slow", "-pix_fmt", "yuv420p",
                                os.environ.get("VOUT", "out/drawn/where-i-keep.mp4")], stdin=subprocess.PIPE)
    for fr in range(int(round(DUR * FPS))):
        t = fr / FPS
        if TEST and not any(abs(t - q) < 0.5 / FPS for q in TEST):
            continue
        if PART and not (PART[0] <= t < PART[1]):
            continue
        img = render(th, t)
        if TEST:
            Image.fromarray(img).save(f"{os.environ['TESTDIR']}/k{t:05.2f}.png")
            print("test", round(t, 2), flush=True)
            continue
        out.stdin.write(img.tobytes())
        if fr % 96 == 0:
            print(f"{t:6.1f}", flush=True)
    if out:
        out.stdin.close()
        out.wait()


if __name__ == "__main__":
    main()
