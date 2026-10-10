"""Edited by the Universe, with inheritance (720x1280). The user chose it: "Do it". RULES, committed before the one run:
  - one world: SEED=9, 9,000 ticks, the current engine, run once (harness-film2.js: lineage sizes and the lineage
    family tree, read only);
  - the vault: his clips, out/user-clips/u*.mp4, without u01, u03, u05 (real public figures);
  - a FOUNDER lineage (alive at tick 0, or with no parent on record) gets a clip by hash, played as it is;
  - a NEW lineage inherits its parent lineage's clip and every change made to it, plus ONE mutation chosen by its own
    id: speed x0.5-2 | runs backwards | colour shift | crop-in | mirror | hard contrast | jump in time | and, one time
    in ten, a different clip from the vault (new material entering);
  - the lineage with the most living members holds the screen (a tie to the older); the lead changes, the film cuts;
  - when the LEADER buds a new lineage, the newborn, mutated, cuts in for six frames (a quarter of a second);
  - speed 1 + 3 x growth over 40 ticks (0.25..3) times its inherited speed; sound at the same speed, like tape;
  - a leader below its reign's peak darkens and tears with what it has lost;
  - a small line names what is on screen: lineage, the clip it came from, how many mutations deep;
  - a card before and a card after stating the run. No score, no shot chosen, no test render.
python3 video/build_evolving.py  -> out/the-universe-inherits.mp4"""
import os, sys, json, glob, re, subprocess, random
import cv2
sys.setrecursionlimit(20000)
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.io import wavfile
sys.path.insert(0, os.path.dirname(__file__))
import build_kept as K

FF = K.FF
W, H, FPS, SR = 720, 1280, 24, 32000
WORK = "out/drawn/evolving"
RUN = json.load(open(f"{WORK}/run.json"))
SEED, TICKS, EVERY = RUN["seed"], RUN["ticks"], RUN["every"]
SAMP = RUN["samples"]
PARENT = {l: p for t, l, p in RUN["births"]}
BORN = {}
for t, l, p in RUN["births"]:
    BORN.setdefault(p, []).append((t, l))
INTRO, OUTRO = 3.2, 4.5
VAULT = sorted([f for f in glob.glob("out/user-clips/u*.mp4") if os.path.basename(f) not in ("u01.mp4", "u03.mp4", "u05.mp4")],
               key=lambda f: int(re.findall(r"\d+", os.path.basename(f))[0]))
SERIF = "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"
MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"


def hashed(x):
    return ((x * 2654435761) % 4294967296)


_g = {}


def genome(lin):
    """(clip, speed, reverse, hue, crop, mirror, contrast, offset, depth, kinds) - inherited, plus one mutation"""
    if lin in _g: return _g[lin]
    p = PARENT.get(lin, -1)
    if p is None or p < 0 or p == lin:
        g = dict(clip=VAULT[hashed(lin) % len(VAULT)], speed=1.0, rev=False, hue=0, crop=1.0, mirror=False, contrast=False, offset=0.0, depth=0, kinds=[])
    else:
        g = dict(genome(p)); g["kinds"] = list(g["kinds"])
        r = random.Random(hashed(lin))
        k = r.choice(["speed", "rev", "hue", "crop", "mirror", "contrast", "offset", "speed", "hue", "crop"]) if r.random() >= .1 else "swap"
        if k == "speed": g["speed"] = float(np.clip(g["speed"] * r.choice([.5, .66, 1.5, 2.0]), .25, 4))
        elif k == "rev": g["rev"] = not g["rev"]
        elif k == "hue": g["hue"] = (g["hue"] + r.choice([-60, -30, 30, 60, 90])) % 180
        elif k == "crop": g["crop"] = float(np.clip(g["crop"] * r.choice([1.25, 1.5]), 1, 3.5))
        elif k == "mirror": g["mirror"] = not g["mirror"]
        elif k == "contrast": g["contrast"] = not g["contrast"]
        elif k == "offset": g["offset"] += r.uniform(.5, 4)
        elif k == "swap": g["clip"] = VAULT[r.randrange(len(VAULT))]
        g["depth"] += 1; g["kinds"].append(k)
    _g[lin] = g
    return g


def at_tick(tk):
    k = min(len(SAMP) - 1, max(0, int(tk / EVERY) - 1))
    return k, SAMP[k]


def count_of(sample, lin):
    for l, c in sample[3]:
        if l == lin: return c
    return 0


class Clip:
    def __init__(self, path):
        self.c = cv2.VideoCapture(path); self.fps = self.c.get(5) or 24
        self.n = max(1, int(self.c.get(7))); self.dur = self.n / self.fps; self.i = -1; self.f = None
        a = f"{WORK}/a_{os.path.basename(path)[:-4]}.wav"
        if not os.path.exists(a):
            subprocess.run([FF, "-loglevel", "quiet", "-y", "-i", path, "-vn", "-ac", "1", "-ar", str(SR), a])
        try: x = wavfile.read(a)[1].astype(np.float32) / 32768
        except Exception: x = np.zeros(SR, np.float32)
        if len(x) < SR // 4: x = np.zeros(SR, np.float32)
        self.audio = x / (np.sqrt((x ** 2).mean()) + 1e-4) * .1

    def frame(self, t):
        j = int(t * self.fps) % self.n
        if j != self.i:
            if j != self.i + 1: self.c.set(cv2.CAP_PROP_POS_FRAMES, j)
            ok, fr = self.c.read()
            if ok: self.f = fr
            self.i = j
        return self.f


_clips = {}


def clip(path):
    if path not in _clips: _clips[path] = Clip(path)
    return _clips[path]


HEADS = {}                                                # each lineage keeps its own playhead


def look(lin, speed):
    """this lineage's frame and sound for one frame of film, with its inherited changes"""
    g = genome(lin); c = clip(g["clip"])
    h = HEADS.get(lin, g["offset"] % c.dur)
    v = speed * g["speed"]
    t = (c.dur - h) % c.dur if g["rev"] else h
    fr = c.frame(t)
    per = SR // FPS
    a0 = t * SR; idx = (a0 + np.arange(per) * v * (-1 if g["rev"] else 1)) % len(c.audio)
    snd = np.interp(idx, np.arange(len(c.audio)), c.audio).astype(np.float32)
    HEADS[lin] = (h + v / FPS) % c.dur
    if fr is None: return np.zeros((H, W, 3), np.float32), snd
    img = fr
    if g["hue"]:
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV); hsv[..., 0] = (hsv[..., 0].astype(int) + g["hue"]) % 180; img = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB).astype(np.float32)
    hh, ww = rgb.shape[:2]; s = max(W / ww, H / hh) * g["crop"]
    im = cv2.resize(rgb, (int(ww * s + .5), int(hh * s + .5)), interpolation=cv2.INTER_AREA if s < 1 else cv2.INTER_CUBIC)
    y = (im.shape[0] - H) // 2; x = (im.shape[1] - W) // 2; im = im[y:y + H, x:x + W]
    if g["mirror"]: im = im[:, ::-1]
    if g["contrast"]: im = np.clip((im - 128) * 1.9 + 128, 0, 255)
    return im, snd


def card(lines, k=1.0):
    pil = Image.new("RGB", (W, H)); d = ImageDraw.Draw(pil)
    y = H / 2 - len(lines) * 30
    for txt, size in lines:
        f = ImageFont.truetype(SERIF, size); w = d.textlength(txt, font=f)
        d.text(((W - w) / 2, y), txt, font=f, fill=tuple(int(c * k) for c in (236, 230, 220))); y += size * 1.9
    return np.asarray(pil)


FL = ImageFont.truetype(MONO, 19)


def label(img, lin):
    g = genome(lin)
    txt = f"lineage {lin}  ·  {os.path.basename(g['clip'])[:-4]}  ·  {g['depth']} mutation{'s' if g['depth'] != 1 else ''} deep"
    pil = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)); d = ImageDraw.Draw(pil)
    d.text((25, H - 52), txt, font=FL, fill=(0, 0, 0)); d.text((24, H - 53), txt, font=FL, fill=(240, 236, 228))
    return np.asarray(pil)


def main():
    nf = int(TICKS / 100 * FPS); per = SR // FPS
    p = subprocess.Popen([FF, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                          "-c:v", "libx264", "-crf", "21", "-preset", "medium", "-pix_fmt", "yuv420p", f"{WORK}/v.mp4"], stdin=subprocess.PIPE)
    aud, shows = [], []
    intro = card([("The universe inherits.", 36), ("every new lineage takes its parent's clip, and changes one thing", 19),
                  (f"seed {SEED}  ·  9,000 ticks  ·  nothing chosen", 21)])
    for f in range(int(INTRO * FPS)):
        k = min(1.0, f / 12, (INTRO * FPS - f) / 12); p.stdin.write((intro * k).astype(np.uint8).tobytes()); aud.append(np.zeros(per, np.float32))
    lead, peak, bud, bud_left = None, 0, None, 0
    cuts, reigns, buds_shown, deepest = 0, set(), 0, (0, None)
    rng = np.random.default_rng(int(SEED))
    births_by_tick = sorted(RUN["births"])
    bi = 0
    for f in range(nf):
        t0 = f * TICKS / nf; tk = (f + 1) * TICKS / nf
        k, s = at_tick(tk)
        if not s[3]:
            p.stdin.write(np.zeros((H, W, 3), np.uint8).tobytes()); aud.append(np.zeros(per, np.float32)); continue
        lin, cnt = s[3][0]
        if lin != lead:
            if lead is not None: cuts += 1
            lead, peak = lin, cnt
        peak = max(peak, cnt); reigns.add(lin)
        # did the leader bud a new lineage in this frame's ticks?
        while bi < len(births_by_tick) and births_by_tick[bi][0] <= tk:
            bt, bl, bp = births_by_tick[bi]; bi += 1
            if bp == lead and bt > t0 - 1 and bud_left == 0:
                bud, bud_left = bl, 6; buds_shown += 1
        prev = count_of(SAMP[max(0, k - int(40 / EVERY))], lin)
        speed = float(np.clip(1 + 3 * (cnt - prev) / max(prev, 1), .25, 3.0))
        if bud_left > 0:
            img, snd = look(bud, speed); show = bud; bud_left -= 1
        else:
            img, snd = look(lin, speed); show = lin
            loss = 1 - cnt / max(peak, 1)
            if loss > 0:
                img = img * (1 - .7 * loss)
                for _ in range(int(3 + 20 * loss)):
                    y0 = int(rng.integers(0, H)); hb = int(rng.integers(4, 40)); sh = int(rng.normal(0, 70 * loss))
                    img[y0:y0 + hb] = np.roll(img[y0:y0 + hb], sh, axis=1)
        g = genome(show)
        if g["depth"] > deepest[0]: deepest = (g["depth"], show)
        p.stdin.write(label(img, show).tobytes()); aud.append(snd); shows.append((len(aud) - 1, show))
    last = SAMP[-1][3][0]
    outro = card([(f"{cuts} cuts.  {len(reigns)} lineages held the screen.", 24),
                  (f"{buds_shown} newborns were seen as they were born.", 22),
                  (f"Deepest on screen: lineage {deepest[1]}, {deepest[0]} mutations from {os.path.basename(genome(deepest[1])['clip'])[:-4] if deepest[1] is not None else '-'}.", 19),
                  (f"The last: lineage {last[0]}, {last[1]} of {SAMP[-1][1]} alive.", 19)])
    for f in range(int(OUTRO * FPS)):
        kk = min(1.0, f / 12, (OUTRO * FPS - f) / 12); p.stdin.write((outro * kk).astype(np.uint8).tobytes()); aud.append(np.zeros(per, np.float32))
    p.stdin.close(); p.wait()
    a = np.concatenate(aud)
    for (i0, s0), (i1, s1) in zip(shows, shows[1:]):   # 8 ms fades only where the picture changes lineage
        if s0 != s1:
            j = i1 * per; n = int(.008 * SR); a[j - n:j] *= np.linspace(1, 0, n); a[j:j + n] *= np.linspace(0, 1, n)
    a = a / (np.abs(a).max() + 1e-6) * .89
    wavfile.write(f"{WORK}/a.wav", SR, (a * 32767).astype(np.int16))
    print(json.dumps({"cuts": cuts, "reigns": len(reigns), "buds_shown": buds_shown, "deepest": deepest, "last": last}))


if __name__ == "__main__":
    main()
