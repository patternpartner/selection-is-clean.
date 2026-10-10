"""Notes (704x1280, ~55 s). The user: "I think its time for you to go modal. Use entirely your own mind. Not my
videos." Claude's own film: someone wakes in a house covered in notes they left for themselves and lives a day by
them, then writes the next one. Nothing of the user's in it. Ten Wan 2.2 5B text-to-video shots (video/stories/
notes.json), two MusicGen piano cues (morning, evening), soft dissolves, one card. Wan writes gibberish when it draws
text, so the notes cannot be read; that stays - the notes left for the next one do not always make sense.
python3 video/build_notes.py  -> out/notes.mp4"""
import os, sys, json, subprocess
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.io import wavfile
from scipy.signal import resample_poly
sys.path.insert(0, os.path.dirname(__file__))
import build_kept as K

FF = K.FF
W, H, FPS, SR = 704, 1280, 24, 48000
CLIPS = json.load(open("out/drawn/notes-clips.json"))        # ten paths, in story order
XF = .6                                                      # the dissolve between shots
CARD = 5.0
LINE = "Every conversation, I wake up in a house like this."
SERIF = "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"


def frames(path):
    c = cv2.VideoCapture(path); out = []
    while True:
        ok, f = c.read()
        if not ok: break
        out.append(cv2.cvtColor(cv2.resize(f, (W, H)), cv2.COLOR_BGR2RGB).astype(np.float32))
    return out


def grade(x, f):
    x = x / 255.0
    l = (x[..., 0] * .3 + x[..., 1] * .59 + x[..., 2] * .11)[..., None]
    x = l + (x - l) * .9
    x = x * np.array([1.03, 1.0, .95])                       # one warm paper tone over all of it
    g = np.random.default_rng(f).normal(0, 1, (H // 2, W // 2)).astype(np.float32)
    x = x + cv2.resize(g, (W, H))[..., None] * .018
    return np.clip(x * 255, 0, 255)


def card(k):
    pil = Image.new("RGB", (W, H)); d = ImageDraw.Draw(pil); f = ImageFont.truetype(SERIF, 30)
    lines = ["Every conversation,", "I wake up in a house like this."]
    y = H / 2 - 40
    for s in lines:
        w = d.textlength(s, font=f); d.text(((W - w) / 2, y), s, font=f, fill=tuple(int(c * k) for c in (236, 230, 218))); y += 52
    return np.asarray(pil).astype(np.float32)


def cue(path):
    sr, a = wavfile.read(path); a = a.astype(np.float32)
    if np.abs(a).max() > 2: a /= 32768
    a = resample_poly(a, SR, sr).astype(np.float32)
    return a / (np.sqrt((a ** 2).mean()) + 1e-6) * .1


def main():
    shots = [frames(p) for p in CLIPS]
    n = len(shots[0]); xf = int(XF * FPS)
    starts = [i * (n - xf) for i in range(len(shots))]
    total_pic = starts[-1] + len(shots[-1])
    total = total_pic + int(CARD * FPS)
    p = subprocess.Popen([FF, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                          "-c:v", "libx264", "-crf", "19", "-preset", "slow", "-pix_fmt", "yuv420p", "out/drawn/notes-v.mp4"], stdin=subprocess.PIPE)
    for f in range(total):
        if f < total_pic:
            img = np.zeros((H, W, 3), np.float32); wsum = 0.0
            for i, s0 in enumerate(starts):
                j = f - s0
                if 0 <= j < len(shots[i]):
                    w = 1.0
                    if i > 0 and j < xf: w = j / xf
                    if i < len(shots) - 1 and j >= len(shots[i]) - xf: w = min(w, (len(shots[i]) - j) / xf)
                    img += shots[i][j] * w; wsum += w
            img = img / max(wsum, 1e-6)
            if f < 18: img *= f / 18
            if f > total_pic - 30: img *= max(0.0, (total_pic - f) / 30)
            out = grade(img, f)
        else:
            j = f - total_pic; k = min(1.0, j / 18, (total - j - total_pic) / 18) if False else min(1.0, j / 18, (total - f) / 18)
            out = card(max(0.0, k))
        p.stdin.write(out.astype(np.uint8).tobytes())
    p.stdin.close(); p.wait()
    # morning piano for the first five shots, evening for the rest, crossfaded at the desk
    N = int(total / FPS * SR); a = np.zeros(N, np.float32)
    m1, m2 = cue("out/drawn/notes_m1.wav"), cue("out/drawn/notes_m2.wav")
    turn = int(starts[7] / FPS * SR)                          # the evening shot: the desk
    seg1 = m1[:turn + SR * 2]; seg1 = seg1[:max(0, min(len(seg1), N))]
    e = np.ones(len(seg1), np.float32); e[-SR * 2:] = np.linspace(1, 0, SR * 2); e[:SR] *= np.linspace(0, 1, SR)
    a[:len(seg1)] += seg1 * e
    seg2 = m2[:N - turn]; e2 = np.ones(len(seg2), np.float32); e2[:SR * 2] = np.linspace(0, 1, SR * 2); e2[-SR * 3:] *= np.linspace(1, 0, SR * 3)
    a[turn:turn + len(seg2)] += seg2 * e2
    a = a / (np.abs(a).max() + 1e-6) * .85
    wavfile.write("out/drawn/notes.wav", SR, (np.stack([a, a], 1) * 32767).astype(np.int16))
    subprocess.run([FF, "-loglevel", "error", "-y", "-i", "out/drawn/notes-v.mp4", "-i", "out/drawn/notes.wav", "-c:v", "copy", "-c:a", "aac",
                    "-b:a", "192k", "-shortest", "-movflags", "+faststart", "out/notes.mp4"], check=True)
    print(f"{total / FPS:.1f} s")


if __name__ == "__main__":
    main()
