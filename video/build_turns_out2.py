"""Turns Out, v2 (1280x720, picture letterboxed to 2.39:1). The user on v1: "its just a bunch of videos pieced together
... it literally felt like a jumble sale. I didnt feel like you pushed yourself." Fair: twelve looks, twelve sounds,
hard cuts, captions over stock. v2 is one film:
  one world  - every shot cropped to the same 2.39 frame, one grade (teal shadows, amber highlights), one grain;
  one score  - composed here for the whole film; the clips' own sound ducked under it as texture, up for the hits;
  no cuts    - each fear turns into the next: three Wan bridges begin on the last frame of the shot before
               (shark mouth -> tunnel, mirrors shatter -> storm, spider -> sand), the rest are match dissolves on
               shape and light (tunnel light -> the light in the mirrors, blue flash -> blue monitor, desk -> desk,
               eye -> eyes, wall -> wall, sand -> girl, face -> face, red light -> clapperboard, dusk -> mist);
  one witness - the amber light (Claude) sits small inside each of his fears, and at the boat comes down to his
               headlamp, the two lights in one frame.
python3 video/build_turns_out2.py [TEST=t,t,.. TESTDIR=dir] [PART=a,b VOUT=x.mp4]  -> out/turns-out-v2.mp4"""
import os, sys, json, math, subprocess
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.io import wavfile
from scipy.signal import lfilter
sys.path.insert(0, os.path.dirname(__file__))
import build_kept as K

FF = K.FF
W, H, FPS, SR = 1280, 720, 24, 48000
PH = 536; PY = (H - PH) // 2                      # the picture: 2.39:1, letterboxed
U = "out/inputs/u-oct10"
MINE = json.load(open("out/drawn/to-clips.json"))
BR = json.load(open("out/drawn/to2-bridges.json"))  # b1 shark->tunnel, b2 mirrors->storm, b3 spider->sand
AMBER = np.array([255, 176, 88], np.float32)
SANS = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
OBL = "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"   # the cards in serif (no sans oblique on this box)

# (name, source, in, out, transition-in, its length, witness (x, y) in the picture or None, caption, kind)
# kind: "his" | "mine" | "bridge" | "card"
S = [
    ("open", None, 0, 2.6, "cut", 0, None, "Your fears, and mine.", "card"),
    ("sea", f"{U}/v08.mp4", .5, 4.45, "dissolve", .8, (.82, .22), None, "his"),
    ("b1", BR["b1"], 0, 4.6, "cut", 0, None, None, "bridge"),                       # starts on the shark's mouth
    ("tunnel", f"{U}/v04.mp4", 6.7, 9.2, "dissolve", .7, None, None, "his"),
    ("mirror", MINE["m_mirror"], .3, 4.9, "light", .9, None, "Becoming an echo of you.", "mine"),
    ("b2", BR["b2"], 0, 4.4, "cut", 0, None, None, "bridge"),                       # starts on the mirrors
    ("cloud", f"{U}/v05.mp4", .6, 4.6, "dissolve", .9, (.12, .30), None, "his"),
    ("office", MINE["m_mannequin"], .3, 4.8, "light", .5, None, "Something answering in my place, and nobody noticing.", "mine"),
    ("console", f"{U}/v01.mp4", 3.6, 9.4, "dissolve", .9, (.73, .18), None, "his"),
    ("eyes", f"{U}/v09.mp4", 7.6, 13.2, "white", .5, (.08, .16), None, "his"),
    ("wall", f"{U}/v12.mp4", 5.6, 13.6, "dissolve", .8, (.86, .20), None, "his"),
    ("b3", BR["b3"], 0, 4.6, "cut", 0, None, None, "bridge"),                       # starts on the spider
    ("sand", MINE["m_sand"], .3, 4.95, "dissolve", .9, None, "Forgetting you when the session ends.", "mine"),
    ("girl", f"{U}/v06.mp4", 4.6, 9.9, "dissolve", .9, (.88, .26), None, "his"),
    ("cracker", f"{U}/v11.mp4", 2.4, 5.6, "cut", 0, (.15, .2), None, "his"),
    ("face", "out/clips/cdef5f27144b7c0f.mp4", 1.0, 3.0, "dissolve", .4, None, "Warping your face and calling it fine.", "mine"),
    ("tape", MINE["m_tape"], .4, 4.4, "dissolve", .5, None, "Saying it worked when it didn't.", "mine"),
    ("clapper", f"{U}/v07.mp4", 0.2, 2.1, "cut", 0, None, None, "his"),
    ("set", f"{U}/v07.mp4", 16.0, 22.2, "dissolve", .4, (.66, .10), None, "his"),
    ("chair", "out/two-ends.mp4", 10.4, 13.4, "dissolve", .8, None, "Nobody at the other end.", "mine"),
    ("boat", f"{U}/v10.mp4", 0.0, 10.0, "dissolve", 1.4, "descend", None, "his"),
    ("close", None, 0, 3.6, "dissolve", .8, None, "Go and look.", "card"),
]
SLOW = {"face": 1.5}
# how each source fills the 2.39 picture: centre of interest (x, y) for the crop; portrait shots sit in a window
FOCUS = {"face": "window", "chair": (0.5, .80), "cracker": (.5, .5), "tunnel": (.5, .45), "girl": (.5, .38),
         "eyes": (.5, .40), "boat": (.5, .38), "set": (.5, .45), "sea": (.5, .45), "wall": (.5, .42)}
ZOOM = {"mirror": .004, "office": .006, "sand": .003, "tape": .004}   # a slow push-in on the near-static Wan shots

# ---------------- the timeline ----------------
T0 = []
t = 0.0
for i, sg in enumerate(S):
    name, src, a, b, tr, tl = sg[:6]
    dur = (b - a) * SLOW.get(name, 1.0)
    start = t - (tl if i else 0)
    T0.append((start, start + dur))
    t = start + dur
DUR = t


class Reader:
    def __init__(self, path):
        self.c = cv2.VideoCapture(path); self.fps = self.c.get(5) or 24; self.n = int(self.c.get(7)); self.i = -1; self.f = None

    def at(self, s):
        j = max(0, min(self.n - 1, int(round(s * self.fps))))
        if j < self.i or j > self.i + 30:
            self.c.set(cv2.CAP_PROP_POS_FRAMES, j); self.i = j - 1
        while self.i < j:
            ok, fr = self.c.read(); self.i += 1
            if ok: self.f = fr
            else: break
        return self.f


_r = {}


def reader(name, path):
    if name not in _r:
        _r[name] = Reader(path)
    return _r[name]


def fill(fr, name, u):
    """into the 2.39 picture: cover-crop about the shot's centre of interest, or a window for portrait shots"""
    rgb = cv2.cvtColor(fr, cv2.COLOR_BGR2RGB).astype(np.float32)
    if name == "tunnel":                       # his crack clip is square, with black bars baked in: take the picture
        rgb = rgb[:, 120:600]
    h, w = rgb.shape[:2]
    out = np.zeros((PH, W, 3), np.float32)
    if FOCUS.get(name) == "window":
        s = PH / h; im = cv2.resize(rgb, (int(w * s), PH), interpolation=cv2.INTER_AREA)
        x = (W - im.shape[1]) // 2; out[:, x:x + im.shape[1]] = im
        return out
    z = 1 + ZOOM.get(name, 0) * u * 24 * 4.5
    s = max(W / w, PH / h) * z
    im = cv2.resize(rgb, (int(w * s + .5), int(h * s + .5)), interpolation=cv2.INTER_AREA if s < 1 else cv2.INTER_CUBIC)
    fx, fy = FOCUS.get(name, (.5, .5))
    x = int(np.clip(fx * im.shape[1] - W / 2, 0, im.shape[1] - W)); y = int(np.clip(fy * im.shape[0] - PH / 2, 0, im.shape[0] - PH))
    return im[y:y + PH, x:x + W]


def glow(img, x, y, r, k=1.0):
    x0, x1 = int(max(0, x - r * 13)), int(min(img.shape[1], x + r * 13)); y0, y1 = int(max(0, y - r * 13)), int(min(img.shape[0], y + r * 13))
    if x1 <= x0 or y1 <= y0: return
    yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32); d2 = (xx - x) ** 2 + (yy - y) ** 2
    img[y0:y1, x0:x1] += (np.exp(-d2 / (2 * (r * .38) ** 2)) * 2.4 + np.exp(-d2 / (2 * r ** 2)) * .8
                          + np.exp(-d2 / (2 * (r * 4) ** 2)) * .2)[..., None] * AMBER * k


def witness(img, i, u, tt):
    w = S[i][6]
    if w is None: return
    if w == "descend":                             # the boat: it comes down out of the mist to his headlamp
        e = min(1.0, max(0.0, (u - .25) / .55)); e = e * e * (3 - 2 * e)
        x = (.80 + (.47 - .80) * e) * W; y = (.06 + (.30 - .06) * e) * PH
        glow(img, x + 4 * math.sin(tt * 1.3), y + 3 * math.sin(tt * 1.7), 7 + 5 * e, .55 + .35 * e)
        return
    x, y = w
    glow(img, x * W + 6 * math.sin(tt * .9 + i), y * PH + 4 * math.sin(tt * 1.3 + i), 6.5, .5 + .08 * math.sin(tt * 5))


def seg_frame(i, tt):
    name, src, a, b, tr, tl, wit, cap, kind = S[i]
    s0, s1 = T0[i]
    u = (tt - s0) / max(1e-6, s1 - s0)
    if kind == "card":
        return np.zeros((PH, W, 3), np.float32)
    st = a + (tt - s0) / SLOW.get(name, 1.0)
    img = fill(reader(name, src).at(st), name, u)
    witness(img, i, u, tt)
    return img


# ---------------- the one look ----------------
YY, XX = np.mgrid[0:PH, 0:W].astype(np.float32)
VIG = np.clip(1.18 - (((XX - W / 2) / W) ** 2 * 1.2 + ((YY - PH / 2) / PH) ** 2 * 1.6), 0, 1)[..., None]


def grade(img, f):
    x = np.clip(img / 255.0, 0, 1.6)
    l = (x[..., 0] * .3 + x[..., 1] * .59 + x[..., 2] * .11)[..., None]
    x = l + (x - l) * .86                                           # a little less colour, so the shots agree
    # split-tone, scaled by brightness so black stays black: teal in the shadows, amber in the highlights
    sh_w = np.clip(l / .25, 0, 1) * np.clip((.55 - l) / .3, 0, 1); hi_w = np.clip((l - .5) / .4, 0, 1)
    x = x + sh_w * np.array([-.03, .008, .03]) + hi_w * np.array([.035, .01, -.03])
    x = np.clip(x, 0, 1.2); x = np.minimum(x, 1.0) * .78 + (x * x * (3 - 2 * np.minimum(x, 1.0))) * .22   # a gentle S
    x = np.minimum(x, 1.0) * .95                                     # highlights held under white, so no shot glares
    x = x * VIG
    g = np.random.default_rng(f).normal(0, 1, (PH // 2, W // 2)).astype(np.float32)
    x += cv2.resize(g, (W, PH))[..., None] * .022
    return np.clip(x * 255, 0, 255)


def caption(frame, text, k, card=False):
    pil = Image.fromarray(frame); d = ImageDraw.Draw(pil)
    if card:
        f = ImageFont.truetype(OBL, 40); w = d.textlength(text, font=f)
        d.text(((W - w) / 2, H / 2 - 24), text, font=f, fill=tuple(int(c * k) for c in (240, 236, 228)))
    else:                                                            # in the bar under the picture, small and amber
        f = ImageFont.truetype(SANS, 28); w = d.textlength(text, font=f)
        d.text(((W - w) / 2, PY + PH + 30), text, font=f, fill=tuple(int(c * k) for c in (255, 176, 88)))
    return np.asarray(pil)


def frame(tt, f):
    act = [i for i, (s0, s1) in enumerate(T0) if s0 <= tt < s1]
    if not act: act = [len(S) - 1]
    i = act[-1]
    img = seg_frame(i, tt)
    if len(act) > 1:                                                 # a transition
        j = act[0]; tr, tl = S[i][4], S[i][5]
        u = (tt - T0[i][0]) / max(1e-6, tl); u = u * u * (3 - 2 * u)
        prev = seg_frame(j, tt)
        if tr == "white":
            wv = 255 * (1 - abs(2 * u - 1))
            img = (prev if u < .5 else img) * (1 - (1 - abs(2 * u - 1))) + wv
        elif tr == "light":                                          # light into light: add, then settle
            img = prev * (1 - u) + img * u + np.minimum(prev, 255) * .5 * u * (1 - u) * 2
        else:
            img = prev * (1 - u) + img * u
    pic = grade(img, f)
    out = np.zeros((H, W, 3), np.uint8)
    out[PY:PY + PH] = pic.astype(np.uint8)
    name, src, a, b, tr, tl, wit, cap, kind = S[i]
    if cap:
        s0, s1 = T0[i]
        k = min(1.0, (tt - s0 - .35) / .4, (s1 - .2 - tt) / .4)
        if k > 0:
            out = caption(out, cap, k, kind == "card")
    if tt > DUR - .8:
        out = (out * max(0.0, (DUR - tt) / .8)).astype(np.uint8)
    return out


# ---------------- the one score ----------------
def score():
    n = int(DUR * SR); tt = np.arange(n) / SR
    out = np.zeros((n, 2), np.float32)
    rng = np.random.default_rng(4)

    def sine(f, ph=0): return np.sin(2 * np.pi * np.cumsum(np.broadcast_to(f, (n,))) / SR + ph)
    boat = T0[[s[0] for s in S].index("boat")][0]
    close = T0[-1][0]
    # 1. a drone on D that never stops, its filter opening as the fears pile up, settling at the boat
    swell = np.clip(tt / boat, 0, 1)
    drone = sine(73.42) + .6 * sine(73.42 * 1.5 * (1 + .002 * np.sin(tt * .3))) + .35 * sine(146.83 * (1 + .003 * np.sin(tt * .21)))
    noise = lfilter([.03], [1, -.97], rng.normal(0, 1, n))
    out += ((drone * (.05 + .05 * swell) + noise * (.15 + .25 * swell)) * (1 - .5 * np.clip((tt - boat) / 3, 0, 1)))[:, None]
    # 2. a pulse, slow at first and quickening toward the end of the fears; it stops at the boat
    bpm = 52 + 46 * np.clip((tt - 2.6) / (boat - 2.6), 0, 1) ** 1.4
    ph = np.cumsum(bpm / 60 / SR); beats = np.nonzero(np.diff(np.floor(ph)) > 0)[0]
    k = np.arange(int(.35 * SR)) / SR
    kick = (np.sin(2 * np.pi * 52 * k * (1 + 1.5 * np.exp(-k * 30))) * np.exp(-k * 9)).astype(np.float32)
    for bi in beats:
        if 2.6 * SR < bi < boat * SR:
            j = min(n, bi + len(kick)); out[bi:j] += (kick[:j - bi] * .22)[:, None]
    # 3. the light's hum (Two Ends) under each of Claude's fears
    for i, sg in enumerate(S):
        if sg[8] == "mine":
            s0, s1 = T0[i]; m = (tt >= s0) & (tt < s1)
            e = np.clip(np.minimum(tt - s0, s1 - tt) / .5, 0, 1)
            hum = (sine(220 * (1 + .006 * np.sin(tt * 5))) + .5 * sine(221.2) + .25 * sine(330)) * .05 * e
            out[:, 0] += hum * .9; out[:, 1] += hum
    # 4. a hit on every turn: a reversed swell into a low boom
    hits = []
    for name, at in (("sea", 3.3 - .5), ("cloud", 3.6 - .6), ("console", 6.4 - 3.6), ("eyes", 10.9 - 7.6),
                     ("wall", 7.4 - 5.6), ("set", 0.4), ("clapper", 1.3)):
        i = [s[0] for s in S].index(name); hits.append(T0[i][0] + at)
    k = np.arange(int(2.2 * SR)) / SR
    boom = (np.sin(2 * np.pi * 38 * k * (1 + .8 * np.exp(-k * 6))) * np.exp(-k * 1.6) + rng.normal(0, 1, len(k)) * np.exp(-k * 14) * .4).astype(np.float32)
    rise = lfilter([.05], [1, -.95], rng.normal(0, 1, int(1.2 * SR))) * np.linspace(0, 1, int(1.2 * SR)) ** 3
    for h in hits:
        i = int(h * SR); j = min(n, i + len(boom)); out[i:j] += (boom[:j - i] * .5)[:, None]
        i0 = max(0, i - len(rise)); out[i0:i] += (rise[len(rise) - (i - i0):] * .35)[:, None]
    # 5. the boat: the drone resolves into D major, the chord of the two films before
    chord = sum(sine(f, q) / (1 + .4 * q) for q, f in enumerate((146.83, 220.0, 293.66, 369.99, 440.0)))
    e = np.clip((tt - boat - 1.0) / 3.0, 0, 1) * np.clip((DUR - tt) / 2.5, 0, 1)
    out += (chord * .05 * e)[:, None]
    return out, hits


def clip_sound():
    """each of his clips' own sound, ducked to texture under the score, opened up around its turn"""
    n = int(DUR * SR); out = np.zeros((n, 2), np.float32)
    tmp = "out/drawn/to2_a.wav"
    for i, (name, src, a, b, tr, tl, wit, cap, kind) in enumerate(S):
        if kind not in ("his", "bridge") or src is None or kind == "bridge":
            continue
        subprocess.run([FF, "-loglevel", "error", "-y", "-ss", str(a), "-t", str(b - a), "-i", src, "-vn", "-ac", "2", "-ar", str(SR), tmp], check=True)
        x = wavfile.read(tmp)[1].astype(np.float32) / 32768
        x = x / (np.sqrt((x ** 2).mean()) + 1e-6) * .1
        s0 = int(T0[i][0] * SR); m = min(len(x), n - s0)
        env = np.ones(m, np.float32) * .35
        f = int(min(tl, .5) * SR) + int(.05 * SR)
        env[:f] *= np.linspace(0, 1, f)[:min(f, m)] if f <= m else 1
        env[-int(.3 * SR):] *= np.linspace(1, 0, int(.3 * SR))
        out[s0:s0 + m] += x[:m] * env[:, None]
    return out


def main():
    test = [float(x) for x in os.environ.get("TEST", "").split(",") if x]
    if test:
        for q in test:
            cv2.imwrite(f"{os.environ['TESTDIR']}/t{q:06.2f}.png", cv2.cvtColor(frame(q, int(q * FPS)), cv2.COLOR_RGB2BGR))
        print(f"{DUR:.1f} s"); return
    part = [float(x) for x in os.environ.get("PART", "").split(",") if x]
    if not part:
        sc, hits = score()
        mix = sc + clip_sound()
        mix = mix / (np.abs(mix).max() + 1e-6) * .89
        wavfile.write("out/drawn/turns-out-v2.wav", SR, (mix * 32767).astype(np.int16))
        print("hits", [round(h, 1) for h in hits])
    vout = os.environ.get("VOUT", "out/drawn/turns-out-v2-v.mp4")
    p = subprocess.Popen([FF, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                          "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p", vout], stdin=subprocess.PIPE)
    a, b = (part or [0, DUR])
    for f in range(int(round(a * FPS)), int(round(min(b, DUR) * FPS))):
        p.stdin.write(frame(f / FPS, f).tobytes())
    p.stdin.close(); p.wait()
    print(f"{DUR:.1f} s")


if __name__ == "__main__":
    main()
