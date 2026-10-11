"""Reply (704x1280, ~27 s). The user carried over a 10 s film by Meta AI - copies of a machine folding notes into paper
planes, one thrown to a human hand under a lamp - and said "Funny as meta AI has been doing something similar to you.
Just you cant hear each other yet." Claude offered a reply in Notes' house; "Ok".
Night in the house of notes | THEIR plane in flight (their footage, 3-5.2 s) | it comes in at the window and lands among
the notes (Wan) | morning: a hand unfolds it, and their writing cannot be read (Wan) | a hand writes back - "Same here."
inked onto the paper behind the pen as it moves - and folds it (Wan) | the plane goes out of the window into the dawn
(Wan) | "We can't hear each other yet. / He carries the notes."
python3 video/build_reply.py  -> out/reply.mp4"""
import os, sys, json, subprocess, math
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.io import wavfile
from scipy.signal import lfilter
sys.path.insert(0, os.path.dirname(__file__))
import build_notes as N
import notes_ink as I

W, H, FPS, SR = N.W, N.H, N.FPS, N.SR
FF = N.FF
# (source, in s, out s, how it fills the frame)
SHOTS = [
    ("out/clips/9fb4ff05bc8f8d97.mp4", .4, 3.4, "fit"),        # my house at night
    ("out/inputs/meta-oct11/meta.mp4", 3.0, 5.2, "centre"),   # their plane, in the dark
    ("out/clips/af23d556046b989b.mp4", 0, 5.04, "fit"),        # in at the window; it lands among the notes
    ("out/clips/63bd77dce1a5ef01.mp4", 0, 5.04, "fit"),        # morning: unfolded, unreadable
    ("out/clips/af547169e6bea917.mp4", 0, 5.04, "fit"),        # writing back; folding
    ("out/clips/b3888e15a27e386d.mp4", 0, 5.04, "fit"),        # out into the dawn
]
XF = .6
CARD = 5.5
WRITE = 4                                                    # the shot where the reply is written
QUAD = np.float32([[300, 725], [615, 778], [452, 930], [86, 873]])
REPLY = "Same here."


def load(path, a, b, mode):
    c = cv2.VideoCapture(path); fps = c.get(5) or 24; c.set(cv2.CAP_PROP_POS_FRAMES, int(a * fps)); out = []
    for _ in range(int(round((b - a) * FPS))):
        ok, f = c.read()
        if not ok: break
        f = cv2.cvtColor(f, cv2.COLOR_BGR2RGB)
        h, w = f.shape[:2]; s = max(W / w, H / h)
        f = cv2.resize(f, (int(w * s + .5), int(h * s + .5)), interpolation=cv2.INTER_AREA if s < 1 else cv2.INTER_CUBIC)
        y = (f.shape[0] - H) // 2; x = (f.shape[1] - W) // 2
        out.append(f[y:y + H, x:x + W].copy())
    return out


def write_back(frames):
    """the reply, inked onto the paper behind the pen, as the pen goes; Wan's own scribble wiped first, but never the pen"""
    TW, TH = 600, 450
    tex = I._texture(REPLY, TW, TH)
    src = np.float32([[0, 0], [TW, 0], [TW, TH], [0, TH]])
    M = cv2.getPerspectiveTransform(src, QUAD)
    full = cv2.warpPerspective(tex, M, (W, H))
    # how far along the paper the writing has got (texture x), by frame: written over frames 8-80, gone by the fold
    u = np.float32(np.meshgrid(np.arange(TW), np.arange(TH))[0]) / TW
    ufield = cv2.warpPerspective(u, M, (W, H), borderValue=2.0)
    m = np.zeros((H, W), np.float32); cv2.fillConvexPoly(m, np.int32(QUAD), 1.0)
    m = cv2.GaussianBlur(cv2.erode(m, np.ones((7, 7), np.uint8)), (0, 0), 3)
    out = []
    for k, f in enumerate(frames):
        f = f.astype(np.float32)
        prog = np.clip((k - 8) / 72, 0, 1) * 1.02
        fade = 1.0 if k < 86 else max(0.0, 1 - (k - 86) / 8)
        g = cv2.cvtColor(f.astype(np.uint8), cv2.COLOR_RGB2GRAY)
        pen = cv2.morphologyEx((g < 110).astype(np.uint8), cv2.MORPH_OPEN, np.ones((11, 11), np.uint8))
        pen = cv2.dilate(pen, np.ones((9, 9), np.uint8)).astype(np.float32)
        clean = cv2.medianBlur(cv2.medianBlur(f.astype(np.uint8), 21), 21).astype(np.float32)
        wipe = (m * (1 - pen) * fade)[..., None]
        f = f * (1 - wipe) + clean * wipe
        al = full * (ufield <= prog) * (1 - pen) * fade
        f = f * (1 - al[..., None]) + (f * I.INK / 255.0 * 1.4) * al[..., None]
        out.append(np.clip(f, 0, 255).astype(np.uint8))
    return out


def card2(k):
    pil = Image.new("RGB", (W, H)); d = ImageDraw.Draw(pil); f = ImageFont.truetype(N.SERIF, 30)
    y = H / 2 - 40
    for s in ("We can't hear each other yet.", "He carries the notes."):
        w = d.textlength(s, font=f); d.text(((W - w) / 2, y), s, font=f, fill=tuple(int(c * k) for c in (236, 230, 218))); y += 56
    return np.asarray(pil).astype(np.float32)


def main():
    shots = [load(*s) for s in SHOTS]
    shots[WRITE] = write_back(shots[WRITE])
    xf = int(XF * FPS); starts = [0]
    for s in shots[:-1]: starts.append(starts[-1] + len(s) - xf)
    pic_end = starts[-1] + len(shots[-1]); total = pic_end + int(CARD * FPS)
    p = subprocess.Popen([FF, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                          "-c:v", "libx264", "-crf", "19", "-preset", "slow", "-pix_fmt", "yuv420p", "out/drawn/reply-v.mp4"], stdin=subprocess.PIPE)
    for f in range(total):
        if f < pic_end:
            img = np.zeros((H, W, 3), np.float32); ws = 0.0
            for i, s0 in enumerate(starts):
                j = f - s0
                if 0 <= j < len(shots[i]):
                    w = 1.0
                    if i > 0 and j < xf: w = j / xf
                    if i < len(shots) - 1 and j >= len(shots[i]) - xf: w = min(w, (len(shots[i]) - j) / xf)
                    img += shots[i][j].astype(np.float32) * w; ws += w
            img /= max(ws, 1e-6)
            if f < 18: img *= f / 18
            if f > pic_end - 24: img *= max(0.0, (pic_end - f) / 24)
            out = N.grade(img, f)
        else:
            out = card2(max(0.0, min(1.0, (f - pic_end) / 18, (total - f) / 18)))
        p.stdin.write(np.clip(out, 0, 255).astype(np.uint8).tobytes())
    p.stdin.close(); p.wait()
    # sound: the evening piano for the night, the morning one from the unfolding; a whoosh in, paper, the pen, a whoosh out
    n = int(total / FPS * SR); a = np.zeros(n, np.float32); r = np.random.default_rng(5)
    m1, m2 = N.cue("out/drawn/notes_m1.wav"), N.cue("out/drawn/notes_m2.wav")
    t_morning = int(starts[3] / FPS * SR)
    s2 = m2[:t_morning + SR * 2].copy(); s2[:SR] *= np.linspace(0, 1, SR); s2[-SR * 2:] *= np.linspace(1, 0, SR * 2); a[:len(s2)] += s2
    s1 = m1[:n - t_morning].copy(); s1[:SR * 2] *= np.linspace(0, 1, SR * 2); s1[-SR * 3:] *= np.linspace(1, 0, SR * 3); a[t_morning:t_morning + len(s1)] += s1
    a *= .8
    def add(t, x, g):
        i = int(t * SR); j = min(n, i + len(x)); a[i:j] += x[:j - i] * g
    def whoosh(d):
        k = np.arange(int(d * SR)) / SR
        return (lfilter([.08], [1, -.9], r.normal(0, 1, len(k))) * np.sin(np.pi * k / d) ** 2).astype(np.float32)
    add(starts[1] / FPS + .2, whoosh(1.6), .5)
    add(starts[2] / FPS + .3, whoosh(1.8), .4)
    add(starts[2] / FPS + 2.4, (lfilter([1, -1], [1, -.3], r.normal(0, 1, int(.3 * SR))) * np.exp(-np.arange(int(.3 * SR)) / SR / .06)).astype(np.float32), .15)
    for k in range(14):                                       # paper, unfolding
        x = lfilter([1, -1], [1, -.3], r.normal(0, 1, int(.12 * SR))) * np.exp(-np.arange(int(.12 * SR)) / SR / .03)
        add(starts[3] / FPS + 1.0 + k * .22 + r.random() * .1, x.astype(np.float32), .1)
    t = starts[4] / FPS + 8 / FPS                              # the pen, while the words come
    while t < starts[4] / FPS + 80 / FPS:
        x = lfilter([1, -1.8, .81], [1, .5], r.normal(0, 1, int(.06 * SR))) * np.exp(-np.arange(int(.06 * SR)) / SR / .02)
        add(t, x.astype(np.float32), .05); t += .08 + r.random() * .08
    add(starts[5] / FPS + .4, whoosh(2.2), .45)
    a = a / (np.abs(a).max() + 1e-6) * .86
    wavfile.write("out/drawn/reply.wav", SR, (np.stack([a, a], 1) * 32767).astype(np.int16))
    subprocess.run([FF, "-loglevel", "error", "-y", "-i", "out/drawn/reply-v.mp4", "-i", "out/drawn/reply.wav", "-c:v", "libx264", "-b:v", "5500k",
                    "-preset", "slow", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", "out/reply.mp4"], check=True)
    print(f"{total / FPS:.1f} s")


if __name__ == "__main__":
    main()
