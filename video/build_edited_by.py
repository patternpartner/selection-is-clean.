"""Edited by the Universe (720x1280). The user: "Why dont you think of something which you think might fail? Then film
it no testing." The edit is handed to the artwork. RULES, written before the run and not changed after it:
  - one world: SEED=7, 9,000 ticks, the current engine, run once (harness-film.js, which draws nothing);
  - the vault: all of his clips, out/user-clips/u*.mp4, except u01 and u03 (real politicians);
  - every lineage gets one clip, for ever: index = (lineage id * 2654435761 mod 2^32) mod vault size;
  - the screen belongs to the lineage with the most living members; the lead changes, the film cuts (a tie goes
    to the older lineage - the engine's own sort);
  - its clip plays at 1 + 3 x its growth over the last 40 ticks, held to 0.25..3, and its sound plays at the same
    speed, so it rises and falls in pitch like tape; each clip keeps its own playhead, and loops;
  - a leader below the peak it reached in this reign darkens and tears in proportion to what it has lost;
  - nothing else: no score, no shot chosen, no grade; a card before and a card after saying what the run was.
Run 9,000 ticks -> 90 s (100 ticks a second).  python3 video/build_edited_by.py  -> out/edited-by-the-universe.mp4"""
import os, sys, json, glob, re, math, subprocess
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.io import wavfile
sys.path.insert(0, os.path.dirname(__file__))
import build_kept as K

FF = K.FF
W, H, FPS, SR = 720, 1280, 24, 32000
RUN = json.load(open("out/drawn/edited/run.json"))
TICKS, EVERY = RUN["ticks"], RUN["every"]
SAMP = RUN["samples"]                                  # [tick, living, lineages, [[lin, count] x10]]
RUNSEC = TICKS / 100.0
INTRO, OUTRO = 3.0, 4.0
VAULT = sorted([f for f in glob.glob("out/user-clips/u*.mp4") if os.path.basename(f) not in ("u01.mp4", "u03.mp4")],
               key=lambda f: int(re.findall(r"\d+", os.path.basename(f))[0]))
WORK = "out/drawn/edited"
SERIF = "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"


def clip_of(lin):
    return VAULT[((lin * 2654435761) % 4294967296) % len(VAULT)]


def at_tick(tk):
    k = min(len(SAMP) - 1, max(0, int(tk / EVERY) - 1))
    return k, SAMP[k]


def count_of(sample, lin):
    for l, c in sample[3]:
        if l == lin: return c
    return 0


class Clip:
    def __init__(self, path):
        self.path = path; self.c = cv2.VideoCapture(path); self.fps = self.c.get(5) or 24
        self.n = max(1, int(self.c.get(7))); self.dur = self.n / self.fps; self.head = 0.0; self.i = -1; self.f = None
        a = f"{WORK}/a_{os.path.basename(path)[:-4]}.wav"
        if not os.path.exists(a):
            subprocess.run([FF, "-loglevel", "error", "-y", "-i", path, "-vn", "-ac", "1", "-ar", str(SR), a])
        try:
            x = wavfile.read(a)[1].astype(np.float32) / 32768
        except Exception:
            x = np.zeros(SR, np.float32)
        if len(x) < SR // 4: x = np.zeros(SR, np.float32)
        self.audio = x / (np.sqrt((x ** 2).mean()) + 1e-4) * .1

    def frame(self):
        j = int(self.head * self.fps) % self.n
        if j != self.i:
            if j != self.i + 1: self.c.set(cv2.CAP_PROP_POS_FRAMES, j)
            ok, fr = self.c.read()
            if ok: self.f = fr
            self.i = j
        return self.f


def cover(fr):
    if fr is None: return np.zeros((H, W, 3), np.float32)
    rgb = cv2.cvtColor(fr, cv2.COLOR_BGR2RGB).astype(np.float32)
    h, w = rgb.shape[:2]; s = max(W / w, H / h)
    im = cv2.resize(rgb, (int(w * s + .5), int(h * s + .5)), interpolation=cv2.INTER_AREA if s < 1 else cv2.INTER_CUBIC)
    y = (im.shape[0] - H) // 2; x = (im.shape[1] - W) // 2
    return im[y:y + H, x:x + W]


def card(lines, k=1.0):
    pil = Image.new("RGB", (W, H)); d = ImageDraw.Draw(pil)
    y = H / 2 - len(lines) * 30
    for i, (txt, size) in enumerate(lines):
        f = ImageFont.truetype(SERIF, size); w = d.textlength(txt, font=f)
        d.text(((W - w) / 2, y), txt, font=f, fill=tuple(int(c * k) for c in (236, 230, 220))); y += size * 1.9
    return np.asarray(pil)


def main():
    clips = {}
    nf = int(RUNSEC * FPS)
    leaders, frames_audio = [], []
    p = subprocess.Popen([FF, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                          "-c:v", "libx264", "-crf", "20", "-preset", "medium", "-pix_fmt", "yuv420p", f"{WORK}/v.mp4"], stdin=subprocess.PIPE)
    per = SR // FPS
    # the opening card, in silence
    intro = card([("Edited by the universe.", 38), ("seed 7  ·  9,000 ticks  ·  nothing chosen", 22)])
    for f in range(int(INTRO * FPS)):
        k = min(1.0, f / 12, (INTRO * FPS - f) / 12); p.stdin.write((intro * k).astype(np.uint8).tobytes())
        frames_audio.append(np.zeros(per, np.float32))
    lead, peak = None, 0
    rng = np.random.default_rng(7)
    for f in range(nf):
        tk = (f + 1) * TICKS / nf
        k, s = at_tick(tk)
        if not s[3]:
            p.stdin.write(np.zeros((H, W, 3), np.uint8).tobytes()); frames_audio.append(np.zeros(per, np.float32)); leaders.append(None); continue
        lin, cnt = s[3][0]
        if lin != lead:
            lead, peak = lin, cnt
        peak = max(peak, cnt)
        leaders.append(lin)
        kp = max(0, k - int(40 / EVERY))
        prev = count_of(SAMP[kp], lin)
        g = (cnt - prev) / max(prev, 1)
        speed = float(np.clip(1 + 3 * g, .25, 3.0))
        path = clip_of(lin)
        if path not in clips: clips[path] = Clip(path)
        c = clips[path]
        img = cover(c.frame())
        # sound: this frame's stretch of its own audio, at its own speed (tape)
        a0 = c.head * SR; idx = (a0 + np.arange(per) * speed) % len(c.audio)
        frames_audio.append(np.interp(idx, np.arange(len(c.audio)), c.audio).astype(np.float32))
        c.head = (c.head + speed / FPS) % c.dur
        loss = 1 - cnt / max(peak, 1)
        if loss > 0:                                     # darkens and tears with what it has lost
            img *= 1 - .7 * loss
            nb = int(3 + 20 * loss)
            for _ in range(nb):
                y0 = int(rng.integers(0, H)); hb = int(rng.integers(4, 40)); sh = int(rng.normal(0, 70 * loss))
                img[y0:y0 + hb] = np.roll(img[y0:y0 + hb], sh, axis=1)
        p.stdin.write(np.clip(img, 0, 255).astype(np.uint8).tobytes())
    cuts = sum(1 for a, b in zip(leaders, leaders[1:]) if a != b)
    reigns = len(set(l for l in leaders if l is not None))
    last = leaders[-1]
    outro = card([(f"{cuts} cuts.", 34), (f"{reigns} lineages held the screen.", 26),
                  (f"The last was lineage {last}, with {SAMP[-1][3][0][1]} of {SAMP[-1][1]} alive.", 22)])
    for f in range(int(OUTRO * FPS)):
        kk = min(1.0, f / 12, (OUTRO * FPS - f) / 12); p.stdin.write((outro * kk).astype(np.uint8).tobytes())
        frames_audio.append(np.zeros(per, np.float32))
    p.stdin.close(); p.wait()
    a = np.concatenate(frames_audio)
    # 8 ms fades at every cut, so a cut does not click
    fpos = int(INTRO * FPS)
    for i, (x, y) in enumerate(zip(leaders, leaders[1:])):
        if x != y:
            j = (fpos + i + 1) * per; n = int(.008 * SR)
            a[j - n:j] *= np.linspace(1, 0, n); a[j:j + n] *= np.linspace(0, 1, n)
    a = a / (np.abs(a).max() + 1e-6) * .89
    wavfile.write(f"{WORK}/a.wav", SR, (a * 32767).astype(np.int16))
    subprocess.run([FF, "-loglevel", "error", "-y", "-i", f"{WORK}/v.mp4", "-i", f"{WORK}/a.wav", "-c:v", "libx264", "-crf", "21",
                    "-preset", "slow", "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", "out/edited-by-the-universe.mp4"], check=True)
    print(json.dumps({"cuts": cuts, "reigns": reigns, "last": last, "clips_used": len(clips)}))


if __name__ == "__main__":
    main()
