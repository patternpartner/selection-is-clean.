"""'The One You Kept' - the user's own likeness (okayed), u172-u174 (8 Oct: jumping, running, disco dancing on a blue
screen) keyed with bluekey.py. The user: "Make something with them, your choice."
The music is the tunes the user's own ear KEPT in Selected by Ear (read from that window's database, 8 Oct), in the
order they were born: the first tune -> #3 -> #12 -> #7 (kept twice; four of the living twelve are its children) ->
#18 (a cross with #7) -> #39 (#7's child) -> #7 again. Played by the window's own instrument (out/still/notes: each
pane's struck note made from its clip's sound), no borrowed song.
He starts as himself, dim, in a dark window. The first time a pane's note is struck, that pane turns to glass inside
his silhouette - by the arpeggios he is all stained glass, his own shading still faintly under it. #7 comes back, he
jumps; on the last low note the glass lets go and he is himself again. End card.
    AUDIO=1 python3 video/build_kept.py   -> out/drawn/kept.wav (+ kept-voices.json)
    python3 video/build_kept.py           -> out/drawn/kept.mp4 (TEST=t1,t2 TESTDIR=dir; PART=a,b VOUT=f)
"""
import json
import math
import os
import subprocess
import sys
import wave

import cv2
import numpy as np
from scipy.signal import fftconvolve

sys.path.insert(0, os.path.dirname(__file__))
import build_played as P  # noqa: E402  the window: panes, seeds, clips, reverb
from bluekey import key  # noqa: E402

SR, FPS, W, H = 48000, 24, 720, 1280
BPM = 80
SPB = 60 / BPM
PHRASE = 8 * SPB
FF = P.FF
MEL = ["D4", "E4", "F4", "G4", "A4", "Bb4", "C5", "D5", "E5", "F5", "G5", "A5", "C6", "D6"]
CHORD = {"D2": ["D", "F", "A"], "Bb1": ["Bb", "D", "F"], "F2": ["F", "A", "C"], "C2": ["C", "E", "G"]}
PROG = ["D2", "Bb1", "F2", "C2"]
pc = lambda n: n.rstrip("0123456789")
# the kept tunes, as the window stores them: [half-beat start, melody index, half-beat length]
TUNES = {
    0: [[0, 4, 3], [3, 7, 1], [4, 9, 2], [6, 8, 1], [7, 7, 1], [8, 6, 4], [12, 4, 4]],          # the first tune
    3: [[0, 4, 3], [3, 7, 1], [4, 9, 1], [5, 8, 2], [7, 7, 1], [8, 6, 8]],
    12: [[0, 4, 3], [3, 7, 1], [4, 9, 2], [6, 6, 1], [7, 4, 1], [8, 7, 8]],
    7: [[0, 4, 3], [3, 7, 1], [4, 9, 1], [5, 8, 1], [6, 6, 1], [7, 7, 1], [8, 6, 4], [12, 7, 2], [14, 9, 2]],
    18: [[0, 4, 3], [3, 7, 1], [4, 9, 1], [5, 8, 1], [6, 8, 1], [7, 4, 1], [8, 6, 4], [12, 7, 2], [14, 9, 2]],
    39: [[0, 4, 3], [3, 7, 1], [4, 9, 1], [5, 8, 1], [6, 6, 1], [7, 7, 1], [8, 6, 4], [12, 7, 4]],
}
# phrase by phrase: (tune, form, call)
SCORE = [(0, "alone", True), (3, "alone", True), (12, "bass", True), (12, "bass", False), (7, "arp", True),
         (7, "arp", False), (18, "bass", True), (39, "bass", True), (7, "return", True), (None, "ring", True)]
DUR = len(SCORE) * PHRASE + 4.6          # the ring, ~2 s of him as himself, then the card
T_CARD = len(SCORE) * PHRASE + .4
LETGO = (len(SCORE) - 1) * PHRASE + .5    # the glass lets go over 2.5 s from here, inside the last phrase


def events():
    ev = []
    for k, (tid, form, call) in enumerate(SCORE):
        t0 = k * PHRASE
        chords = [PROG[(k % 2) * 2], PROG[(k % 2) * 2 + 1]]
        add = lambda b, n, l, v: ev.append((t0 + b * SPB, n, l, v, k))
        if form == "ring":                                     # one low D and the D above it, ringing out
            add(0, "D2", 8, .9); add(0, "D4", 8, .55)
            continue
        g = [{"b": b / 2, "i": i, "l": l / 2} for b, i, l in TUNES[tid]]
        if not call:                                           # the answer resolves onto the chord
            last, tones = g[-1], CHORD[chords[1]]
            if pc(MEL[last["i"]]) not in tones:
                prev = g[-2]["i"] if len(g) > 1 else -1
                for d in (-1, 1, -2, 2, -3, 3):
                    j = last["i"] + d
                    if 0 <= j < len(MEL) and j != prev and pc(MEL[j]) in tones:
                        last["i"] = j
                        break
        lift = 1.3 if form == "arp" else 1.0
        if form == "return":
            for n in g:
                add(n["b"], MEL[n["i"]], n["l"], .62)
            add(0, chords[0], 8, .7)
        else:
            for n in g:
                i = n["i"]
                if form == "arp":
                    if n["l"] < 1:
                        continue
                    if i + 7 < len(MEL):
                        i += 7
                add(n["b"], MEL[i], n["l"], (.82 if n["b"] % 2 == 0 else .7) * (.95 if form == "alone" else 1) * lift)
        if form == "bass":
            for j, r in enumerate(chords):
                add(j * 4, r, 4, .95); add(j * 4 + 2.5, r, 1.5, .45)
            tops = [n for n in MEL[9:] if pc(n) in CHORD[chords[0]]]
            if tops:
                add(1, tops[-1], .5, .33); add(3, tops[0], .5, .33)
        if form == "arp":
            for j, r in enumerate(chords):
                for be in range(4):
                    add(j * 4 + be, r, 1, (.9 if be == 0 else .6) * lift)
                tones = [n for n in MEL if pc(n) in CHORD[r]]
                run = tones[1:6]
                seq = (run + run[1:-1][::-1])[:8]
                for q, n in enumerate(seq):
                    add(j * 4 + q * .5, n, .5, (.6 if q % 2 else .75) * lift)
    return sorted(ev)


EV = events()
PANES = json.load(open("out/still/panes.json"))["panes"]
PANE = {p["note"]: p for p in PANES}


def load_note(n):
    raw = subprocess.run([FF, "-loglevel", "error", "-i", f"out/still/notes/{n}.mp3", "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()


def render_audio():
    N = int(DUR * SR)
    L, R = np.zeros(N), np.zeros(N)
    smp = {n: load_note(n) for n in PANE}
    voices = []
    for t0, n, ln, v, k in EV:
        y = smp[n].astype(np.float64)
        amp = v * .9 * (1.4 if PANE[n]["midi"] < 50 else 1)
        off = ln * SPB * 1.05 + .04
        t = np.arange(len(y)) / SR
        y = y * amp * np.where(t < off, 1.0, np.exp(-(t - off) / .12))
        s = int(t0 * SR)
        y = y[: max(0, N - s)]
        pan = max(-1, min(1, (PANE[n]["x"] - .5) * 1.4))
        L[s:s + len(y)] += y * math.cos((pan + 1) * math.pi / 4)
        R[s:s + len(y)] += y * math.sin((pan + 1) * math.pi / 4)
        voices.append({"n": n, "when": t0, "off": t0 + off, "amp": v * (1.4 if PANE[n]["midi"] < 50 else 1)})
    rv = P.reverb_ir(np.random.default_rng(7))
    mix = (L + R) / 2
    L = L + .32 * fftconvolve(mix, rv[0])[:N]
    R = R + .32 * fftconvolve(mix, rv[1])[:N]
    st = np.stack([L, R], 1)
    st /= np.abs(st).max() / .7
    st = np.tanh(st * 1.15) / 1.15
    st *= np.clip((T_CARD + 1.5 - np.arange(N) / SR) / 2.5, 0, 1)[:, None]
    st /= np.abs(st).max() / .89
    with wave.open("out/drawn/kept.wav", "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((st * 32767).astype(np.int16).tobytes())
    json.dump(voices, open("out/drawn/kept-voices.json", "w"))
    print("notes", len(EV), "seconds", round(DUR, 2))


# ---- the picture ----
# (clip, start s, end s) per segment, film time [a, b): his moves, cut to the phrases. Refined from the timed sheets.
MOVES = json.load(open(os.path.join(os.path.dirname(__file__), "kept_moves.json")))
AMBER = np.array([255, 176, 88], np.float32)


def window_cells():
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    S = [(p["x"] * W, p["y"] * H, p["w"] * W * 2) for p in PANES]
    d = np.stack([(xx - x) ** 2 + (yy - y) ** 2 - r * r for x, y, r in S])     # power diagram, as the page draws it
    lab = np.argmin(d, 0)
    edge = np.zeros((H, W), bool)
    edge[:, 1:] |= lab[:, 1:] != lab[:, :-1]
    edge[1:, :] |= lab[1:, :] != lab[:-1, :]
    edge = cv2.dilate(edge.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)
    return lab, edge


def main_video():
    voices = json.load(open("out/drawn/kept-voices.json"))
    lab, edge = window_cells()
    clips = {p["note"]: np.load(f"out/archive/made/c_{P.BYID[p['clip']]['i']}.npy", mmap_mode="r") for p in PANES}
    boxes = {}
    for k, p in enumerate(PANES):
        ys, xs = np.nonzero(lab == k)
        boxes[p["note"]] = (ys.min(), ys.max() + 1, xs.min(), xs.max() + 1)
    first = {}
    for v in voices:
        first[v["n"]] = min(first.get(v["n"], 1e9), v["when"])
    envref = max(max(p["env"]) for p in PANES) * .55
    caps = {}
    test = [float(x) for x in os.environ.get("TEST", "").split(",") if x]
    part = [float(x) for x in os.environ.get("PART", "").split(",") if x]
    out = None
    if not test:
        out = subprocess.Popen([FF, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
                                "-i", "-", "-c:v", "libx264", "-crf", "17", "-preset", "slow", "-pix_fmt", "yuv420p",
                                os.environ.get("VOUT", "out/drawn/kept.mp4")], stdin=subprocess.PIPE)
    strikes = sorted({(round(v["when"], 3), v["n"]) for v in voices})
    top = {}
    for t, n in strikes:
        if t not in top or PANE[n]["midi"] > PANE[top[t]]["midi"]:
            top[t] = n
    tops = sorted(top.items())
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)

    def body(t):
        for seg in MOVES:
            if seg["a"] <= t < seg["b"]:
                src = seg["clip"]
                st = seg["s"] + (t - seg["a"]) * (seg["e"] - seg["s"]) / (seg["b"] - seg["a"])
                if src not in caps:
                    caps[src] = cv2.VideoCapture(f"out/user-clips/{src}.mp4")
                cap = caps[src]
                cap.set(cv2.CAP_PROP_POS_FRAMES, int(round(st * 24)))
                ok, fr = cap.read()
                if not ok:
                    return None, None
                rgb = cv2.cvtColor(fr, cv2.COLOR_BGR2RGB).astype(np.float32)
                if rgb.shape[:2] != (H, W):
                    rgb = cv2.resize(rgb, (W, H))
                col, a = key(rgb)
                return col, a
        return None, None

    for f in range(int(DUR * FPS)):
        t = f / FPS
        if part and not (part[0] <= t < part[1]):
            continue
        if test and not any(abs(t - q) < .5 / FPS for q in test):
            continue
        # each pane's light: the sum of its sounding notes, as the instrument page computes it
        lit = {n: 0.0 for n in PANE}
        for v in voices:
            if v["when"] - .02 <= t < v["off"] + 1.2:
                p = PANE[v["n"]]
                kk = int((t - v["when"]) * 60)
                if 0 <= kk < len(p["env"]):
                    rel = math.exp(-(t - v["off"]) / .12) if t > v["off"] else 1
                    lit[v["n"]] = max(lit[v["n"]], v["amp"] * p["env"][kk] / envref * rel)
        win = np.zeros((H, W, 3), np.float32)
        glassw = np.zeros((H, W), np.float32)
        for k, p in enumerate(PANES):
            n = p["note"]
            y0, y1, x0, x1 = boxes[n]
            m = lab[y0:y1, x0:x1] == k
            fr = clips[n]
            age = t - first.get(n, 1e9)
            src = np.asarray(fr[int(max(age, 0) * 12) % len(fr)])
            sh, sw = src.shape[:2]
            sc = max((x1 - x0) / sw, (y1 - y0) / sh) * 1.08
            rs = cv2.resize(src, (int(sw * sc) + 1, int(sh * sc) + 1))
            oy, ox = (rs.shape[0] - (y1 - y0)) // 2, (rs.shape[1] - (x1 - x0)) // 2
            tile = rs[oy:oy + y1 - y0, ox:ox + x1 - x0].astype(np.float32)
            e = min(1.6, lit[n])
            b = .45 + 1.1 * e ** .7
            win[y0:y1, x0:x1][m] = tile[m] * b
            # a pane turns to glass the first time its note is struck, and the glass lets go in the last phrase
            g = np.clip(age / .6, 0, 1) * (1 - np.clip((t - LETGO) / 2.5, 0, 1))
            glassw[y0:y1, x0:x1][m] = g
        col, a = body(t)
        img = np.zeros((H, W, 3), np.float32)
        ghost = .05 + .05 * min(1, t / 6)
        img += win * ghost                                       # the window, barely there, around him
        if col is not None:
            lum = col.mean(-1, keepdims=True) / 255
            himself = col * .78
            glass = win * (.55 + .75 * lum)                       # the glass, with his own shading under it
            # his face stays readable: the glass is lighter over the top sixth of his silhouette
            rows = np.nonzero(a.max(1) > .5)[0]
            facew = np.ones((H, 1), np.float32)
            if len(rows):
                top, ht = rows.min(), rows.max() - rows.min()
                facew[:, 0] = np.clip((np.arange(H) - top) / max(1, ht * .17), 0, 1) * .6 + .4
            gw = glassw[..., None] * .9 * facew[..., None]
            inside = himself * (1 - gw) + glass * gw
            img = img * (1 - a[..., None]) + inside * a[..., None]
            rim = cv2.morphologyEx((a > .5).astype(np.uint8), cv2.MORPH_GRADIENT, np.ones((3, 3), np.uint8)).astype(np.float32)
            img += cv2.GaussianBlur(rim, (0, 0), 4)[..., None] * AMBER * (.35 + .5 * max(lit.values()) / 1.6)
        if col is not None:
            ea = edge & (a > .5)
            img[ea] *= (1 - .85 * glassw[ea])[:, None]           # the leading belongs to the glass: it comes and goes with it
        # the light, arriving on each strike
        j = max(0, np.searchsorted([x[0] for x in tops], t, "right") - 1)
        A = tops[j]
        B = tops[min(j + 1, len(tops) - 1)]
        u = 0.0 if B[0] == A[0] else min(1, max(0, ((t - A[0]) / (B[0] - A[0]) - .35) / .65))
        u = u * u * (3 - 2 * u)
        lx = PANE[A[1]]["x"] * W * (1 - u) + PANE[B[1]]["x"] * W * u
        ly = PANE[A[1]]["y"] * H * (1 - u) + PANE[B[1]]["y"] * H * u
        d2 = (xx - lx) ** 2 + (yy - ly) ** 2
        rad = 22 + 4 * math.sin(t * 2.3)
        fade = min(1, t / .8) * (1 - min(1, max(0, (t - LETGO) / 2.5)))       # the light goes with the glass
        img += (np.exp(-d2 / (2 * (rad * .38) ** 2)) * 2.0 + np.exp(-d2 / (2 * rad ** 2)) * .6 +
                np.exp(-d2 / (2 * (rad * 4) ** 2)) * .18)[..., None] * AMBER * fade
        img = img + cv2.GaussianBlur(img, (0, 0), 6) * .22
        vig = np.clip(1.25 - ((xx - W / 2) ** 2 / W ** 2 + (yy - H / 2) ** 2 / H ** 2) * 1.5, 0, 1)[..., None]
        img = img * vig
        if t > T_CARD - .8:
            img *= max(0.0, 1 - (t - (T_CARD - .8)) / .8)
        img = np.clip(img, 0, 255).astype(np.uint8)
        if test:
            cv2.imwrite(f"{os.environ['TESTDIR']}/k{t:05.2f}.png", cv2.cvtColor(img, cv2.COLOR_RGB2BGR))
            continue
        out.stdin.write(img.tobytes())
        if f % 96 == 0:
            print(f"{t:6.1f}", flush=True)
    if out:
        out.stdin.close()
        out.wait()


if __name__ == "__main__":
    if os.environ.get("AUDIO"):
        render_audio()
    else:
        main_video()
