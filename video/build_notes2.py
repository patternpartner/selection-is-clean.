"""Notes v2. The user: "I like it. But you can now improve it." What was weak: the notes ARE the film and not one could
be read. Now they say real things - lines from the notes every session of Claude wakes up to (CLAUDE.md, VIDEO.md),
or close to them - written on screen in handwriting as each one is read; the last is written as we watch. The house
gets its own sound (sheets, steps, the pour, the stair, the drawer, the pen, the lamp), drawn here, under the piano;
and after the night the morning starts again for two seconds before the card. Same ten Wan shots, no new Modal.
python3 video/build_notes2.py  -> out/notes-v2.mp4"""
import os, sys, json, subprocess, math
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.io import wavfile
from scipy.signal import lfilter
sys.path.insert(0, os.path.dirname(__file__))
import build_notes as N

W, H, FPS, SR = N.W, N.H, N.FPS, N.SR
HAND = "out/fonts/caveat.ttf"
# per shot: (line, start s into the shot, end s, "write" to have it written letter by letter)
NOTES = {
    1: [("Read the notes before you touch anything.", 1.0, 4.6, None)],
    2: [("Cost first.", .4, 1.9, None), ("Green is not the number.", 1.7, 3.3, None), ("Saved worlds belong to him.", 3.1, 4.8, None)],
    3: [("Ask before you spend his money.", .9, 4.6, None)],
    4: [("Don't trust a face after three seconds.", .6, 4.6, None)],
    5: [("He liked the one with the empty chair.", .9, 4.6, None)],
    6: [("An edit is not a film.", .3, 1.9, None), ("Confident is not the same as ambitious.", 1.7, 3.4, None),
        ("The bowling one repeated over and over.\nHe liked it anyway.", 3.2, 4.9, None)],
    7: [("He'll ask if this is your best.", .5, 4.7, "write")],
    8: [("Tell him the truth.", .2, 2.6, None)],
}
LOOP = 2.2                                                   # the morning again, before the card


def put_text(img, text, k, written=None):
    pil = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)); d = ImageDraw.Draw(pil)
    f = ImageFont.truetype(HAND, 48)
    if written is not None: text = text[:written]
    lines = text.split("\n"); y = H - 300 - 30 * (len(lines) - 1)
    for s in lines:
        w = d.textlength(s, font=f); x = (W - w) / 2
        for dx, dy in ((2, 2), (1, 2), (2, 1)):
            d.text((x + dx, y + dy), s, font=f, fill=(0, 0, 0))
        d.text((x, y), s, font=f, fill=tuple(int(c * k + (1 - k) * 0) for c in (246, 240, 226)))
        y += 60
    out = np.asarray(pil).astype(np.float32)
    return img * (1 - k) + out * k if k < 1 else out


# ---------------- the house's sound ----------------
def foley(starts, n_frames, total):
    n = int(total / FPS * SR); a = np.zeros(n, np.float32); r = np.random.default_rng(3)
    def at(i, s): return int((starts[i] / FPS + s) * SR)
    def add(i0, x):
        j = min(n, i0 + len(x)); a[i0:j] += x[:j - i0]
    def noise(d, b, aa):
        return lfilter(b, aa, r.normal(0, 1, int(d * SR))).astype(np.float32)
    def env(d, att, dec):
        t = np.arange(int(d * SR)) / SR
        return (np.minimum(1, t / max(att, 1e-3)) * np.exp(-t / dec)).astype(np.float32)
    # room tone everywhere, very low
    a += lfilter([.01], [1, -.995], r.normal(0, 1, n)).astype(np.float32) * .6
    # 0: sheets as the hand comes out from under them
    x = noise(2.2, [.06], [1, -.9]) * np.sin(np.linspace(0, math.pi, int(2.2 * SR))) ** 2; add(at(0, .6), x * .5)
    # 1: a note peeled off the lamp, then held
    x = noise(.5, [1, -1], [1, -.4]) * env(.5, .02, .12); add(at(1, .7), x * .25)
    # 2: soft steps down the hall, and paper stirring
    for k in range(7):
        x = (np.sin(2 * np.pi * 70 * np.arange(int(.18 * SR)) / SR) + noise(.18, [.2], [1, -.7]) * .3) * env(.18, .005, .05)
        add(at(2, .5 + k * .62), x * .35)
    for k in range(40):
        x = noise(.08, [1, -1], [1, -.2]) * env(.08, .01, .02); add(at(2, r.uniform(0, 5)), x * .05)
    # 3: the pour, and the cup filling (its pitch rising)
    d = 3.2; t = np.arange(int(d * SR)) / SR
    x = noise(d, [.3], [1, -.5]) * (np.sin(np.linspace(0, math.pi, len(t))) ** .5).astype(np.float32)
    x += (np.sin(2 * np.pi * np.cumsum(300 + 500 * t / d) / SR) * .08 * r.random(len(t))).astype(np.float32)
    add(at(3, 1.0), x * .25)
    # 4: the stair creaks under the step it takes
    t = np.arange(int(.6 * SR)) / SR
    x = (np.sin(2 * np.pi * np.cumsum(240 + 40 * np.sin(t * 30)) / SR) * (r.random(len(t)) > .6)).astype(np.float32)
    x = lfilter([1], [1, -1.7 * math.cos(2 * math.pi * 260 / SR), .85], x).astype(np.float32); x /= np.abs(x).max() + 1e-6
    add(at(4, 2.4), x * env(.6, .05, .25) * .3)
    x = (np.sin(2 * np.pi * 65 * np.arange(int(.2 * SR)) / SR)) * env(.2, .005, .05); add(at(4, 3.0), x.astype(np.float32) * .3)
    # 6: the drawer slides, and the notes pour out
    x = noise(.9, [.05], [1, -.95]) * env(.9, .1, .6); add(at(6, .5), x * .9)
    for k in range(90):
        x = noise(.07, [1, -1], [1, -.3]) * env(.07, .005, .02); add(at(6, 1.4 + r.exponential(.9)), x * .07)
    # 7: the pen, scratching, in the rhythm of the words
    k = .5
    while k < 4.7:
        x = noise(.06, [1, -1.8, .81], [1, .5]) * env(.06, .005, .02); add(at(7, k), x * .05)
        k += .07 + r.random() * .09
    # 8: the note put down, then the lamp click
    x = noise(.25, [1, -1], [1, -.3]) * env(.25, .01, .06); add(at(8, .5), x * .2)
    t = np.arange(int(.05 * SR)) / SR; x = (np.sin(2 * np.pi * 2100 * t) * np.exp(-t / .004) + r.normal(0, 1, len(t)) * np.exp(-t / .002) * .5).astype(np.float32)
    add(at(8, 3.05), x * .5)
    return a


def main():
    shots = [N.frames(p) for p in N.CLIPS]
    n = len(shots[0]); xf = int(N.XF * FPS)
    starts = [i * (n - xf) for i in range(len(shots))]
    pic_end = starts[-1] + len(shots[-1])
    loop_n = int(LOOP * FPS)
    total_pic = pic_end + loop_n
    total = total_pic + int(N.CARD * FPS)
    p = subprocess.Popen([N.FF, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                          "-c:v", "libx264", "-crf", "19", "-preset", "slow", "-pix_fmt", "yuv420p", "out/drawn/notes2-v.mp4"], stdin=subprocess.PIPE)
    for f in range(total):
        if f < pic_end:
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
            if f > pic_end - 24: img *= max(0.0, (pic_end - f) / 24)
            img = N.grade(img, f)
            for i, s0 in enumerate(starts):
                for text, a, b, mode in NOTES.get(i, []):
                    ts = (f - s0) / FPS
                    if a <= ts < b:
                        k = min(1.0, (ts - a) / .35, (b - ts) / .35)
                        wr = None
                        if mode == "write": wr = max(1, int(len(text) * min(1.0, (ts - a) / (b - a - .9))))
                        img = put_text(img, text, k, wr)
            out = img
        elif f < total_pic:                                   # the morning again: the hand reaching for the notes
            j = f - pic_end
            img = N.grade(shots[0][min(len(shots[0]) - 1, 10 + j)], f)
            out = img * min(1.0, j / 14) * min(1.0, (total_pic - f) / 16)
        else:
            out = N.card(max(0.0, min(1.0, (f - total_pic) / 18, (total - f) / 18)))
        p.stdin.write(np.clip(out, 0, 255).astype(np.uint8).tobytes())
    p.stdin.close(); p.wait()
    # the piano (as v1, a little lower), and the house
    Nn = int(total / FPS * SR); mus = np.zeros(Nn, np.float32)
    m1, m2 = N.cue("out/drawn/notes_m1.wav"), N.cue("out/drawn/notes_m2.wav")
    turn = int(starts[7] / FPS * SR)
    s1 = m1[:turn + SR * 2]; e = np.ones(len(s1), np.float32); e[-SR * 2:] = np.linspace(1, 0, SR * 2); e[:SR] *= np.linspace(0, 1, SR)
    mus[:len(s1)] += s1 * e
    s2 = m2[:Nn - turn]; e2 = np.ones(len(s2), np.float32); e2[:SR * 2] = np.linspace(0, 1, SR * 2); e2[-SR * 3:] *= np.linspace(1, 0, SR * 3)
    mus[turn:turn + len(s2)] += s2 * e2
    house = foley(starts, n, total)
    mix = mus * .75 + house * 1.0
    mix = mix / (np.abs(mix).max() + 1e-6) * .88
    wavfile.write("out/drawn/notes2.wav", SR, (np.stack([mix, mix], 1) * 32767).astype(np.int16))
    print(f"{total / FPS:.1f} s")


if __name__ == "__main__":
    main()
