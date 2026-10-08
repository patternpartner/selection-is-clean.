"""'Intertwined' - the user (own likeness) and the amber light (Claude's stand-in). The user: "I think you can do better.
You have modal credits ... Your story and mine intertwined." Music: out/drawn/kept.wav - Claude's first tune crossing
into the tunes the user's ear kept (#7's line). Ten 6 s phrases; each phrase is one shot:
  0 the window alone, the light playing Claude's first tune      (local)
  1 he raises an open hand and the light settles in his palm      (Wan I2V)
  2 close: the light in his hands, in his glasses                 (Wan I2V)
  3 he dances, himself, the light travelling over him on the beat (local, v2 renderer)
  4 the light sinks into his chest and the glass spreads          (Wan I2V)
  5 the jumps, in glass                                           (local)
  6 the run, in glass                                             (local)
  7 he leaps through the window and it bursts into panes          (Wan I2V)
  8 standing, the glass lets go                                   (local)
  9 he opens his hands, the light rises and stays beside him      (Wan I2V)
then the card. Local shots come from build_kept2 with the Intertwined knobs; Wan shots (5.04 s) are stretched to 6 s
with frame blending and graded toward the rest.
    python3 video/build_intertwined.py local      -> out/drawn/iw_local.mp4 (the whole timeline from the v2 renderer)
    python3 video/build_intertwined.py cut        -> out/intertwined.mp4
"""
import os, sys, json, subprocess
import numpy as np
import cv2
sys.path.insert(0, os.path.dirname(__file__))
import build_kept2 as B

FF = B.K.FF
W, H, FPS = 720, 1280, 24
I2V = {1: "iw_2_palm", 2: "iw_3_close", 4: "iw_5_glass", 7: "iw_7_leap", 9: "iw_8_rise"}
PH = B.PHRASE


def local():
    B.NOBODY_UNTIL = 6.0
    B.GLASS_FROM = 27.0
    B.LETGO = 48.6
    # phrase 8 (48-54): standing, so the glass can let go of him before the last shot
    for s in B.SEGS:
        if s["a"] == 48:
            s.update(clip="u172", anc=[(48, 7.8), (54, 8.9)], f=None)
        if s["a"] == 54:
            s.update(anc=[(54, 8.9), (s["b"], 9.0)], f=None)
    B.main()


# the five Wan takes, in shot order (one take each, all kept: ~$1.25)
TAKES = {1: "out/clips/4bd6177d92ec8f22.mp4", 2: "out/clips/cdef5f27144b7c0f.mp4", 4: "out/clips/7ce9a1dd090da603.mp4",
         7: "out/clips/e3adcc9ba38b656e.mp4", 9: "out/clips/416b6a456ef4d2de.mp4"}
LOCAL = [((0, 6), "L0.mp4", 0), ((18, 24), "L18.mp4", 18), ((30, 42), "L30.mp4", 30), ((48, 54), "L48.mp4", 48)]


def frames(path):
    cap = cv2.VideoCapture(path); out = []
    while True:
        ok, f = cap.read()
        if not ok: break
        out.append(cv2.cvtColor(f, cv2.COLOR_BGR2RGB))
    return out


def fit(fr):
    """704x1280 Wan frame -> 720x1280: scale to the width, crop the height"""
    h, w = fr.shape[:2]
    s = W / w
    r = cv2.resize(fr, (W, int(round(h * s))), interpolation=cv2.INTER_CUBIC)
    y = (r.shape[0] - H) // 2
    return r[y:y + H]


def cut(localdir):
    takes = {k: [fit(f) for f in frames(v)] for k, v in TAKES.items()}
    locs = [(a, b, frames(os.path.join(localdir, f)), off) for (a, b), f, off in LOCAL]
    T_CARD = B.T_CARD
    N = int(round(B.DUR * FPS))
    p = subprocess.Popen([FF, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                          "-c:v", "libx264", "-crf", "17", "-preset", "slow", "-pix_fmt", "yuv420p", "out/drawn/intertwined.mp4"], stdin=subprocess.PIPE)
    for f in range(N):
        t = f / FPS
        k = int(t // PH)
        img = np.zeros((H, W, 3), np.float32)
        if t < T_CARD:
            if k in takes:
                fr = takes[k]
                x = (t - k * PH) / PH * (len(fr) - 1)          # 5.04 s of Wan across the 6 s phrase, frames blended
                i = int(x); w_ = x - i
                img = fr[i].astype(np.float32) * (1 - w_) + fr[min(i + 1, len(fr) - 1)].astype(np.float32) * w_
            else:
                for a, b, fr, off in locs:
                    if a <= t < b:
                        img = fr[min(len(fr) - 1, int(round((t - off) * FPS)))].astype(np.float32)
            if t > T_CARD - .9:
                img *= max(0, 1 - (t - (T_CARD - .9)) / .9)
        p.stdin.write(np.clip(img, 0, 255).astype(np.uint8).tobytes())
    p.stdin.close(); p.wait()


if __name__ == "__main__":
    if sys.argv[1] == "local":
        local()
    elif sys.argv[1] == "cut":
        cut(sys.argv[2])
