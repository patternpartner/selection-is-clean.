"""Turns Out, v3 (1280x720, 2.39 picture). The user on v2: "Is this the very best you can do?" - no, and why: still a
list, Claude's fears weakest, the witness a dot, the ending borrowed, the score numbers not music. v3 is a story:
  ACT ONE  - his fears happen to him, and the light (Claude) is in each one with him, near and lit, not a dot;
  ACT TWO  - the turn: Claude's fears, and HE is in each, answering it (Wan I2V from his own back views, so Wan
             never has his face): walks on while his footprints wash away; walks toward the light in mirrors that hold
             no reflection of him; puts a hand on the mannequin's shoulder; reaches in and stops the tape; the face
             Wan warped dissolves into his real one put back; and he sprints in to the empty chair (Two Ends);
  ACT THREE - the boat: the fear he went out to look at grins back, and the light comes down to him (Wan, first 3 s).
Music: three MusicGen cues (out/drawn/to3/cue1-3.wav), one per act, act one's built so its loudest bar is the spider.
Look, Reader, fill, grade: build_turns_out2.
python3 video/build_turns_out3.py [TEST=.. TESTDIR=..] [PART=a,b VOUT=..]  -> out/turns-out-v3.mp4"""
import os, sys, json, math, subprocess
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.io import wavfile
from scipy.signal import resample_poly, lfilter
sys.path.insert(0, os.path.dirname(__file__))
import build_turns_out2 as B

W, H, FPS, SR, PH, PY = B.W, B.H, B.FPS, B.SR, B.PH, B.PY
U, MINE, BR = B.U, B.MINE, B.BR
V3 = json.load(open("out/drawn/to3-clips.json"))   # beach, mirror, office, tape, boat

# (name, source, in, out, transition, length, witness, caption, kind)
# witness: (x, y) in the picture - the light, near and lit; kind: his | mine | bridge | card
S = [
    ("open", None, 0, 2.4, "cut", 0, None, "Your fears.", "card"),
    ("sea", f"{U}/v08.mp4", .5, 4.45, "dissolve", .8, (.66, .50), None, "his"),
    ("b1", BR["b1"], 0, 4.6, "cut", 0, None, None, "bridge"),
    ("tunnel", f"{U}/v04.mp4", 6.7, 9.2, "dissolve", .7, None, None, "his"),
    ("cloud", f"{U}/v05.mp4", .6, 4.6, "light", .8, (.20, .38), None, "his"),
    ("eyes", f"{U}/v09.mp4", 7.6, 13.0, "white", .5, (.30, .30), None, "his"),
    ("console", f"{U}/v01.mp4", 3.6, 9.4, "dissolve", .9, (.62, .34), None, "his"),
    ("girl", f"{U}/v06.mp4", 4.6, 9.9, "dissolve", .9, (.70, .30), None, "his"),
    ("cracker", f"{U}/v11.mp4", 2.4, 5.4, "cut", 0, (.22, .30), None, "his"),
    ("clapper", f"{U}/v07.mp4", 0.2, 2.1, "cut", 0, None, None, "his"),
    ("set", f"{U}/v07.mp4", 16.0, 21.4, "dissolve", .4, (.56, .30), None, "his"),
    ("wall", f"{U}/v12.mp4", 5.8, 13.6, "dissolve", .8, (.72, .30), None, "his"),
    ("b3", BR["b3"], 0, 4.6, "cut", 0, None, "And mine.", "bridge"),
    ("beach", V3["beach"], .2, 3.6, "dissolve", 1.0, None, "Forgetting you when the session ends.", "mine"),
    # Wan never brought the wave in on his walk; the first footprints shot is the same beach, and has it: he is gone,
    # and the wave takes his prints
    ("wave", MINE["m_sand"], 3.0, 4.95, "dissolve", 1.1, None, None, "mine"),
    ("mirror", V3["mirror"], .2, 4.9, "light", .8, None, "Becoming an echo of you.", "mine"),
    ("office", V3["office"], .2, 4.9, "dissolve", .7, None, "Something answering in my place, and nobody noticing.", "mine"),
    ("tape", V3["tape"], .2, 4.6, "dissolve", .6, None, "Saying it worked when it didn't.", "mine"),
    ("face", "out/clips/cdef5f27144b7c0f.mp4", 1.0, 3.0, "dissolve", .5, None, "Warping your face and calling it fine.", "mine"),
    ("real", "out/drawn/close_realface.mp4", 1.0, 3.0, "dissolve", 1.2, None, None, "mine"),
    ("chair", "out/two-ends.mp4", 10.4, 19.2, "dissolve", .8, None, "Nobody at the other end.", "mine"),
    ("boat", f"{U}/v10.mp4", 0.0, 8.4, "dissolve", 1.4, None, None, "his"),
    ("down", V3["boat"], 0.0, 3.0, "dissolve", .8, None, None, "mine"),
    ("close", None, 0, 3.8, "dissolve", 1.0, None, "Go and look.", "card"),
]
SLOW = {"face": 1.5, "real": 1.5, "down": 1.3}
CAP_FOR = {"chair": 3.0}                        # a caption that leaves before the shot does (he arrives after it)
B.FOCUS.update({"wave": (.5, .5), "face": "window", "real": "window", "chair": (.5, .63), "beach": (.5, .5), "mirror": (.42, .5),
                "office": (.55, .5), "down": (.5, .40)})
B.ZOOM.update({"beach": .002, "mirror": .003, "office": .003, "tape": .004})

T0 = []
t = 0.0
for i, sg in enumerate(S):
    name, src, a, b, tr, tl = sg[:6]
    dur = (b - a) * SLOW.get(name, 1.0)
    start = t - (tl if i else 0)
    T0.append((start, start + dur)); t = start + dur
DUR = t
IDX = {s[0]: i for i, s in enumerate(S)}


def witness(img, i, u, tt):
    """the light, with him in his fears: larger than a dot, and casting a little warm light round itself"""
    w = S[i][6]
    if w is None: return
    x = w[0] * W + 14 * math.sin(tt * .7 + i); y = w[1] * PH + 9 * math.sin(tt * 1.1 + i)
    yy, xx = B.YY, B.XX
    img += (np.exp(-((xx - x) ** 2 + (yy - y) ** 2) / (2 * 170.0 ** 2)) * 26)[..., None] * np.array([1, .72, .42], np.float32)
    B.glow(img, x, y, 10.5, .85 + .1 * math.sin(tt * 4.3))


def seg_frame(i, tt):
    name, src, a, b, tr, tl, wit, cap, kind = S[i]
    s0, s1 = T0[i]; u = (tt - s0) / max(1e-6, s1 - s0)
    if kind == "card": return np.zeros((PH, W, 3), np.float32)
    st = a + (tt - s0) / SLOW.get(name, 1.0)
    img = B.fill(B.reader(name, src).at(st), name, u)
    witness(img, i, u, tt)
    return img


def frame(tt, f):
    act = [i for i, (s0, s1) in enumerate(T0) if s0 <= tt < s1] or [len(S) - 1]
    i = act[-1]
    img = seg_frame(i, tt)
    if len(act) > 1:
        j = act[0]; tr, tl = S[i][4], S[i][5]
        u = (tt - T0[i][0]) / max(1e-6, tl); u = u * u * (3 - 2 * u)
        prev = seg_frame(j, tt)
        if tr == "white":
            img = (prev if u < .5 else img) * abs(2 * u - 1) + 255 * (1 - abs(2 * u - 1))
        elif tr == "light":
            img = prev * (1 - u) + img * u + np.minimum(prev, 255) * .5 * u * (1 - u) * 2
        else:
            img = prev * (1 - u) + img * u
    out = np.zeros((H, W, 3), np.uint8)
    out[PY:PY + PH] = B.grade(img, f).astype(np.uint8)
    name, src, a, b, tr, tl, wit, cap, kind = S[i]
    if cap:
        s0, s1 = T0[i]
        if name in CAP_FOR: s1 = s0 + CAP_FOR[name]
        k = min(1.0, (tt - s0 - .35) / .4, (s1 - .2 - tt) / .4)
        if k > 0:
            if kind == "card":
                out = B.caption(out, cap, k, True)
            elif name == "b3":                                        # the turn, written into the picture
                pil = Image.fromarray(out); d = ImageDraw.Draw(pil); fnt = ImageFont.truetype(B.OBL, 44)
                w = d.textlength(cap, font=fnt)
                d.text(((W - w) / 2, PY + PH / 2 - 26), cap, font=fnt, fill=tuple(int(c * k) for c in (255, 236, 210)))
                out = np.asarray(pil)
            else:
                out = B.caption(out, cap, k)
    if tt > DUR - .8:
        out = (out * max(0.0, (DUR - tt) / .8)).astype(np.uint8)
    return out


# ---------------- the music ----------------
def cue(k):
    sr, a = wavfile.read(f"out/drawn/to3/cue{k}.wav")
    a = a.astype(np.float32)
    if np.abs(a).max() > 2: a /= 32768
    a = resample_poly(a, SR, sr).astype(np.float32)
    return a / (np.sqrt((a ** 2).mean()) + 1e-6) * .12


def place(out, x, at, fade_in=1.5, fade_out=1.5):
    n = len(out); i = int(at * SR)
    x = x.copy(); fi, fo = int(fade_in * SR), int(fade_out * SR)
    x[:fi] *= np.linspace(0, 1, fi); x[-fo:] *= np.linspace(1, 0, fo)
    lo, hi = max(0, i), min(n, i + len(x))
    if hi > lo: out[lo:hi] += x[lo - i:hi - i][:, None]


def score():
    n = int(DUR * SR); out = np.zeros((n, 2), np.float32)
    c1, c2, c3 = cue(1), cue(2), cue(3)
    burst = T0[IDX["wall"]][0] + (7.4 - 5.8)                 # the spider through the wall
    act2 = T0[IDX["beach"]][0]; boat = T0[IDX["boat"]][0]
    # act one: the cue ends on the burst; before it begins, a low drone holds the opening
    c1_at = burst + .6 - len(c1) / SR
    place(out, c1, c1_at, 2.5, 1.2)
    tt = np.arange(n) / SR
    pre = np.clip((c1_at + 3 - tt) / 3, 0, 1) * np.clip(tt / 1.5, 0, 1)
    drone = (np.sin(2 * np.pi * 73.42 * tt) + .5 * np.sin(2 * np.pi * 110.1 * tt)) * .05 * pre
    out += drone[:, None]
    # the sand: wind and blowing sand after the burst, and act two's piano coming in under "And mine."
    turn = T0[IDX["b3"]][0]
    wind_n = int((act2 + 3 - (burst + .3)) * SR)
    rng = np.random.default_rng(12)
    wind = lfilter([.04], [1, -.96], rng.normal(0, 1, (wind_n, 2)), axis=0).astype(np.float32)
    hiss = lfilter([1, -1], [1, -.3], rng.normal(0, 1, (wind_n, 2)), axis=0).astype(np.float32) * .05
    k = np.arange(wind_n) / SR
    env = np.clip(k / 1.5, 0, 1) * np.clip((wind_n / SR - k) / 2.5, 0, 1) * (.8 + .2 * np.sin(k * 1.3))
    i0 = int((burst + .3) * SR); out[i0:i0 + wind_n] += (wind * 1.6 + hiss) * env[:, None]
    c2_at = turn + 1.6
    place(out, c2[:int((boat - c2_at + 1.5) * SR)], c2_at, 2.5, 2.0)
    # act three: the end of the third cue, timed so it finishes with the card
    tail = c3[-int((DUR - boat + .5) * SR):]
    place(out, tail * 1.3, boat - .5, 2.5, 2.0)
    # one low boom on the burst, and the clap of the clapperboard
    k = np.arange(int(2.2 * SR)) / SR
    boom = (np.sin(2 * np.pi * 38 * k * (1 + .8 * np.exp(-k * 6))) * np.exp(-k * 1.6)).astype(np.float32)
    for h, g in ((burst, .55), (T0[IDX["clapper"]][0] + 1.3, .3), (T0[IDX["sea"]][0] + 2.8, .35)):
        i = int(h * SR); j = min(n, i + len(boom)); out[i:j] += (boom[:j - i] * g)[:, None]
    return out


def clip_sound():
    n = int(DUR * SR); out = np.zeros((n, 2), np.float32); tmp = "out/drawn/to3/a.wav"
    for i, (name, src, a, b, tr, tl, wit, cap, kind) in enumerate(S):
        if kind != "his": continue
        subprocess.run([B.FF, "-loglevel", "error", "-y", "-ss", str(a), "-t", str(b - a), "-i", src, "-vn", "-ac", "2", "-ar", str(SR), tmp], check=True)
        x = wavfile.read(tmp)[1].astype(np.float32) / 32768
        x = x / (np.sqrt((x ** 2).mean()) + 1e-6) * .1
        s0 = int(T0[i][0] * SR); m = min(len(x), n - s0)
        env = np.full(m, .3, np.float32)
        f = int(.4 * SR); env[:f] *= np.linspace(0, 1, f); env[-f:] *= np.linspace(1, 0, f)
        out[s0:s0 + m] += x[:m] * env[:, None]
    # the chair keeps its real pings and footsteps (Two Ends)
    i = IDX["chair"]
    subprocess.run([B.FF, "-loglevel", "error", "-y", "-ss", "10.4", "-t", "8.8", "-i", "out/two-ends.mp4", "-vn", "-ac", "2", "-ar", str(SR), tmp], check=True)
    x = wavfile.read(tmp)[1].astype(np.float32) / 32768
    s0 = int(T0[i][0] * SR); m = min(len(x), n - s0); out[s0:s0 + m] += x[:m] * .6
    return out


def main():
    test = [float(x) for x in os.environ.get("TEST", "").split(",") if x]
    if test:
        for q in test:
            cv2.imwrite(f"{os.environ['TESTDIR']}/v{q:06.2f}.png", cv2.cvtColor(frame(q, int(q * FPS)), cv2.COLOR_RGB2BGR))
        print(f"{DUR:.1f} s"); return
    part = [float(x) for x in os.environ.get("PART", "").split(",") if x]
    if not part:
        mix = score() + clip_sound()
        mix = mix / (np.abs(mix).max() + 1e-6) * .89
        wavfile.write("out/drawn/turns-out-v3.wav", SR, (mix * 32767).astype(np.int16))
    vout = os.environ.get("VOUT", "out/drawn/turns-out-v3-v.mp4")
    p = subprocess.Popen([B.FF, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                          "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p", vout], stdin=subprocess.PIPE)
    a, b = (part or [0, DUR])
    for f in range(int(round(a * FPS)), int(round(min(b, DUR) * FPS))):
        p.stdin.write(frame(f / FPS, f).tobytes())
    p.stdin.close(); p.wait()
    print(f"{DUR:.1f} s")


if __name__ == "__main__":
    main()
