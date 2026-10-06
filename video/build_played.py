"""'Played' - no one's likeness, no borrowed song. The user: "Are you pushing yourself?" ... "Keep pushing".
The screen is one stained-glass window of 18 panes, each an archive clip with its own sound. Each pane is ONE NOTE: its
height is its pitch (low = dark pictures at the bottom, high = bright ones at the top), and its sound is that clip's own
audio, struck through a tuned resonator - so the bird sounds like the bird, pitched to D5. The amber light plays the
window like an instrument; a pane is exactly as bright as its note is loud, so you watch the sound. Same note, same
picture, every time - the tune can be followed by eye. No reveal: it has to hold second by second.
Score (Claude's): D minor, 80 bpm, i-VI-III-VII (Dm Bb F C). Motif alone -> bass enters -> arpeggio climax -> motif
returns on the same pictures -> one low D rings out, the panes go dark one by one. End card.
    AUDIO=1 python3 video/build_played.py   -> out/drawn/played.wav  (+ out/drawn/played-env.npy, the per-pane envelopes)
    python3 video/build_played.py           -> out/drawn/played.mp4  (TEST=t1,t2 TESTDIR=dir; PART=a,b VOUT=f)
"""
import json
import math
import os
import subprocess

import numpy as np
from scipy.signal import fftconvolve, resample_poly, butter, sosfilt

SR = 48000
FPS = 24
W, H = 720, 1280
BPM = 80
BEAT = 60 / BPM
BAR = 4 * BEAT
DUR = 53.0
T_CARD = 49.0
IDX = json.load(open("out/archive/index.json"))
BYID = {e["id"]: e for e in IDX}
NOTES = {"D2": 38, "F2": 41, "C2": 36, "Bb1": 34, "D4": 62, "E4": 64, "F4": 65, "G4": 67, "A4": 69, "Bb4": 70, "C5": 72,
         "D5": 74, "E5": 76, "F5": 77, "G5": 79, "A5": 81, "C6": 84, "D6": 86}
# pane: note -> clip id (dark low, bright high)
PANE = {"D2": "u57", "Bb1": "u69", "F2": "u105", "C2": "u160",
        "D4": "u12", "E4": "u46", "F4": "u78", "G4": "u18", "A4": "u50", "Bb4": "u48", "C5": "u65", "D5": "u38",
        "E5": "u109", "F5": "u67", "G5": "u76", "A5": "u148", "C6": "u99", "D6": "u107"}
ORDER = list(PANE)


def score():
    """(start s, note, length s, velocity)"""
    ev = []

    def add(bar, beat, n, beats, v=0.8):
        ev.append((bar * BAR + beat * BEAT, n, beats * BEAT, v))

    motif = [(0, "A4", 1.5), (1.5, "D5", 0.5), (2, "F5", 1), (3, "E5", 0.5), (3.5, "D5", 0.5)]
    ans1 = [(0, "C5", 2), (2, "A4", 2)]
    ans2 = [(0, "Bb4", 1), (1, "C5", 1), (2, "D5", 2)]
    # bars 0-3: the motif alone
    for b, ph, v in [(0, motif, 0.7), (1, ans1, 0.6), (2, motif, 0.75), (3, ans2, 0.65)]:
        for be, n, ln in ph:
            add(b, be, n, ln, v)
    # bars 4-7: the bass enters under it; a high answer on the off-beats
    roots = ["D2", "Bb1", "F2", "C2"]
    for k in range(4):
        add(4 + k, 0, roots[k], 4, 0.95)
        add(4 + k, 2.5, roots[k], 1.5, 0.45)
    for b, ph in [(4, motif), (5, ans1), (6, motif), (7, [(0, "G5", 1), (1, "F5", 1), (2, "E5", 1), (3, "C5", 1)])]:
        for be, n, ln in ph:
            add(b, be, n, ln, 0.8)
    for b in (4, 6):
        add(b, 1, "D6", 0.5, 0.35)
        add(b, 3, "A5", 0.5, 0.35)
    # bars 8-11: the climax - eighth-note arpeggios up and down each chord, bass on every beat
    chords = {"D2": ["D4", "F4", "A4", "D5", "F5", "A5", "D6", "A5"], "Bb1": ["G4", "Bb4", "D5", "F5", "G5", "F5", "D5", "Bb4"],
              "F2": ["F4", "A4", "C5", "F5", "A5", "C6", "A5", "F5"], "C2": ["E4", "G4", "C5", "E5", "G5", "C6", "G5", "E5"]}
    for k, r in enumerate(roots):
        for be in range(4):
            add(8 + k, be, r, 1, 0.9 if be == 0 else 0.6)
        for j, n in enumerate(chords[r]):
            add(8 + k, j * 0.5, n, 0.5, 0.75 if j % 2 == 0 else 0.6)
        add(8 + k, 0, ["F5", "D5", "A5", "G5"][k], 2, 0.85)        # the tune on top, octave up from the motif
    # bar 11 ends in a run to the top
    for j, n in enumerate(["E5", "G5", "A5", "C6"]):
        add(11, 2 + j * 0.5, n, 0.5, 0.85)
    add(12, 0, "D6", 3, 1.0)
    add(12, 0, "D2", 4, 1.0)
    # bars 12-14: the motif returns, slower - the same pictures in the same order
    slow = [(1, "A4", 1.5), (2.5, "D5", 0.5), (3, "F5", 1)]
    for be, n, ln in slow:
        add(12, be, n, ln, 0.6)
    for be, n, ln in [(0, "E5", 1), (1, "D5", 1), (2, "C5", 2)]:
        add(13, be, n, ln, 0.55)
    add(13, 0, "Bb1", 4, 0.7)
    for be, n, ln in [(0, "A4", 2), (2, "D5", 2)]:
        add(14, be, n, ln, 0.5)
    add(14, 0, "C2", 2, 0.6)
    # bar 15: one low D, and the D4 above it, ringing out
    add(15, 0, "D2", 8, 0.9)
    add(15, 0, "D4", 8, 0.55)
    return sorted(ev)


EV = score()


def layout():
    """pane seeds: melody climbs a zigzag up the frame, the four bass panes are big along the bottom"""
    seeds = {}
    mel = [n for n in ORDER if NOTES[n] >= 60]
    for k, n in enumerate(mel):
        u = k / (len(mel) - 1)
        y = 1020 - u * 900
        x = 360 + 215 * math.sin(k * 2.39 + 0.6)
        seeds[n] = (x, y, 0.0)
    for k, n in enumerate(["Bb1", "C2", "D2", "F2"]):
        seeds[n] = (90 + k * 180, 1205, 60.0)
    return seeds


SEEDS = layout()


def load_audio(cid):
    e = BYID[cid]
    x = np.load(e["audio"]).astype(np.float32) / 32768
    return resample_poly(x, 3, 1).astype(np.float32)                     # 16k -> 48k


def excitation(cid, n, vel, rng):
    """the strike: a slice of the clip's own sound where it is loudest-changing, with a short noise click"""
    x = load_audio(cid)
    hop = 480
    e = np.sqrt(np.convolve(x * x, np.ones(hop) / hop, "same"))[::hop]
    on = np.maximum(np.diff(e, prepend=e[0]), 0)
    k = int(np.argmax(on[10:-30]) + 10) * hop
    L = int(0.35 * SR)
    seg = x[k:k + L].copy()
    if len(seg) < L:
        seg = np.pad(seg, (0, L - len(seg)))
    seg = sosfilt(butter(2, 60, "hp", fs=SR, output="sos"), seg)
    seg /= np.sqrt((seg ** 2).mean()) + 1e-6
    env = np.exp(-np.arange(L) / (0.09 * SR)) * np.minimum(1, np.arange(L) / (0.002 * SR))
    click = rng.normal(0, 1, L) * np.exp(-np.arange(L) / (0.003 * SR)) * 0.8
    return (seg * env + click) * vel, x[k:k + int(1.2 * SR)]


def body(midi, lum, length):
    """the tuned resonator: damped partials, brighter clips ring with more upper partials"""
    f0 = 440 * 2 ** ((midi - 69) / 12)
    bass = midi < 50
    T0 = 4.5 if bass else float(np.interp(midi, [60, 86], [2.6, 1.1]))
    roll = float(np.interp(lum, [5, 110], [2.1, 1.05]))
    n = int(T0 * 1.15 * SR)
    t = np.arange(n) / SR
    ir = np.zeros(n, np.float32)
    B = 0.00025 if not bass else 0.00008
    for k in range(1, 11):
        f = f0 * k * math.sqrt(1 + B * k * k)
        if f > 0.45 * SR:
            break
        a = k ** -roll * (1.0 if k == 1 else 0.8)
        ir += (a * np.sin(2 * np.pi * f * t) * np.exp(-t * 6.9 * (1 + 0.55 * (k - 1)) / T0)).astype(np.float32)
    ir *= np.clip((n - np.arange(n)) / (0.15 * SR), 0, 1)        # taper the tail, never a cut
    ir /= np.sqrt((ir[: int(0.25 * SR)] ** 2).sum()) + 1e-9      # every note strikes equally hard, whatever its pitch
    # note-off: a short note is damped after its length, so fast arpeggios stay clear
    off = int((length * 1.05 + 0.04) * SR)
    if off < n:
        ir[off:] *= np.exp(-np.arange(n - off) / (0.12 * SR))
    return ir


def reverb_ir(rng):
    n = int(3.2 * SR)
    t = np.arange(n) / SR
    out = []
    for ch in range(2):
        r = rng.normal(0, 1, n) * np.exp(-t * 6.9 / 2.4)
        r = sosfilt(butter(1, 5200, "lp", fs=SR, output="sos"), r)
        r[: int(0.022 * SR)] = 0
        out.append(r / np.sqrt((r ** 2).sum()))
    return out


def render_audio():
    rng = np.random.default_rng(5)
    N = int(DUR * SR)
    L, R = np.zeros(N), np.zeros(N)
    nfr = int(DUR * FPS) + 1
    env = {n: np.zeros(nfr) for n in ORDER}
    win = SR // FPS
    for t0, n, ln, v in EV:
        cid = PANE[n]
        lum = BYID[cid]["lum"]
        ex, raw = excitation(cid, n, 1.0, rng)
        y = fftconvolve(ex, body(NOTES[n], lum, ln))[: int(7 * SR)]
        # the clips' own sound is mostly rumble under 120 Hz and the resonator only damps it 33 dB: cut below the note
        f0 = 440 * 2 ** ((NOTES[n] - 69) / 12)
        y = sosfilt(butter(4, 0.7 * f0, "hp", fs=SR, output="sos"), y)
        # level every note: how much a clip's sound overlaps a pitch varied 30 dB between panes - musically wrong
        y /= np.sqrt((y[: int(0.4 * SR)] ** 2).mean()) + 1e-9
        lift = 1.3 if 8 * BAR - 0.01 <= t0 < 12 * BAR + 0.01 else 1.0      # the climax stands up out of the rest
        y *= 0.05 * v * lift * (1.4 if NOTES[n] < 50 else 1.0)
        # a breath of the clip's own sound under its note, so you can hear what it is
        tex = sosfilt(butter(4, [350, 6000], "bp", fs=SR, output="sos"), raw) * 0.016 * v
        tex *= np.exp(-np.arange(len(tex)) / (0.22 * SR))
        y[: len(tex)] += tex
        s = int(t0 * SR)
        y = y[: max(0, N - s)]
        pan = SEEDS[n][0] / W
        L[s:s + len(y)] += y * math.cos(pan * math.pi / 2) * 1.2
        R[s:s + len(y)] += y * math.sin(pan * math.pi / 2) * 1.2
        rms = np.sqrt(np.convolve(y * y, np.ones(win) / win, "same")[::win])
        f0 = int(t0 * FPS)
        m = min(len(rms), nfr - f0)
        env[n][f0:f0 + m] = np.maximum(env[n][f0:f0 + m], rms[:m])
    rv = reverb_ir(rng)
    mix = (L + R) / 2
    wl = fftconvolve(mix, rv[0])[:N]
    wr = fftconvolve(mix, rv[1])[:N]
    L, R = L + 0.32 * wl, R + 0.32 * wr
    st = np.stack([L, R], 1)
    print("pre-limit peak", float(np.abs(st).max()), "rms", float(np.sqrt((st ** 2).mean())))
    st /= np.abs(st).max() / 0.7
    st = np.tanh(st * 1.15) / 1.15                               # a gentle limiter on the loudest strikes only
    fade = np.clip((DUR - 0.3 - np.arange(N) / SR) / 2.5, 0, 1)
    st *= fade[:, None]
    st /= np.abs(st).max() / 0.89
    import wave
    with wave.open("out/drawn/played.wav", "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((st * 32767).astype(np.int16).tobytes())
    np.save("out/drawn/played-env.npy", np.stack([env[n] for n in ORDER]))
    print("notes", len(EV), "peak", float(np.abs(st).max()))


AMBER = np.array([255, 176, 88], np.float32)


def cells():
    """the window: a weighted Voronoi of the pane seeds, so the panes tile the whole frame like stained glass"""
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    d = np.stack([np.hypot(xx - SEEDS[n][0], (yy - SEEDS[n][1]) * 1.0) - SEEDS[n][2] for n in ORDER])
    lab = np.argmin(d, 0)
    edge = np.zeros((H, W), bool)
    edge[:, 1:] |= lab[:, 1:] != lab[:, :-1]
    edge[1:, :] |= lab[1:, :] != lab[:-1, :]
    import cv2
    edge = cv2.dilate(edge.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)
    return lab, edge


def light_path():
    """where the light is each frame: it arrives at the highest note of each strike exactly on the beat"""
    hits = {}
    for t0, n, ln, v in EV:
        k = round(t0, 3)
        if k not in hits or NOTES[n] > NOTES[hits[k]]:
            hits[k] = n
    ks = sorted(hits)
    nfr = int(DUR * FPS) + 1
    P = np.zeros((nfr, 2))
    for f in range(nfr):
        t = f / FPS
        j = np.searchsorted(ks, t, "right")
        if j == 0:
            a = b = np.array(SEEDS[hits[ks[0]]][:2])
            u = 1.0
        elif j >= len(ks):
            a = b = np.array(SEEDS[hits[ks[-1]]][:2])
            u = 1.0
        else:
            a = np.array(SEEDS[hits[ks[j - 1]]][:2])
            b = np.array(SEEDS[hits[ks[j]]][:2])
            span = ks[j] - ks[j - 1]
            # it waits on the note, then leaves late and arrives on time
            u = np.clip(((t - ks[j - 1]) / span - 0.35) / 0.65, 0, 1)
            u = u * u * (3 - 2 * u)
        P[f] = a + (b - a) * u
    return P


def render_video():
    import cv2
    lab, edge = cells()
    env = np.load("out/drawn/played-env.npy")
    env = np.clip(env / np.percentile(env[env > 0], 97), 0, 1.6)
    first = {n: min(t0 for t0, m, ln, v in EV if m == n) for n in ORDER}
    clips = {n: np.load(f"out/archive/made/c_{BYID[PANE[n]]['i']}.npy", mmap_mode="r") for n in ORDER}
    boxes = {}
    for k, n in enumerate(ORDER):
        ys, xs = np.nonzero(lab == k)
        boxes[n] = (ys.min(), ys.max() + 1, xs.min(), xs.max() + 1)
    path = light_path()
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    rng = np.random.default_rng(2)
    test = [float(x) for x in os.environ.get("TEST", "").split(",") if x]
    part = [float(x) for x in os.environ.get("PART", "").split(",") if x]
    out = None
    if not test:
        out = subprocess.Popen([FF, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                                str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "17", "-preset", "slow", "-pix_fmt", "yuv420p",
                                os.environ.get("VOUT", "out/drawn/played.mp4")], stdin=subprocess.PIPE)
    onsets = [(t0, n) for t0, n, ln, v in EV]
    for f in range(int(DUR * FPS)):
        t = f / FPS
        if part and not (part[0] <= t < part[1]):
            continue
        if test and not any(abs(t - q) < 0.5 / FPS for q in test):
            continue
        img = np.zeros((H, W, 3), np.float32)
        lit = np.zeros((H, W), np.float32)
        for k, n in enumerate(ORDER):
            if t < first[n] - 0.02:
                continue
            e = env[k, f]
            age = t - first[n]
            mem = 0.12 * math.exp(-age / 20) + 0.2                         # a pane once played keeps its light
            b = mem + 1.15 * e ** 0.7
            y0, y1, x0, x1 = boxes[n]
            fr = clips[n]
            src = np.asarray(fr[int(age * 12) % len(fr)])
            sh, sw = src.shape[:2]
            bh, bw = y1 - y0, x1 - x0
            sc = max(bw / sw, bh / sh) * 1.08
            rs = cv2.resize(src, (int(sw * sc) + 1, int(sh * sc) + 1), interpolation=cv2.INTER_LINEAR)
            oy, ox = (rs.shape[0] - bh) // 2, (rs.shape[1] - bw) // 2
            tile = rs[oy:oy + bh, ox:ox + bw].astype(np.float32)
            m = lab[y0:y1, x0:x1] == k
            img[y0:y1, x0:x1][m] = tile[m] * b
            lit[y0:y1, x0:x1][m] = e
            # the strike: a ring of amber runs out from where the light touched, inside its own pane
            for t0, nn in onsets:
                if nn == n and 0 <= t - t0 < 0.5:
                    sx, sy = SEEDS[n][:2]
                    r = 30 + (t - t0) * 420
                    ring = np.exp(-((np.hypot(xx[y0:y1, x0:x1] - sx, yy[y0:y1, x0:x1] - sy) - r) / 7) ** 2) * (1 - (t - t0) / 0.5)
                    img[y0:y1, x0:x1][m] += (ring[m, None] * AMBER * 0.9)
        # leading: dark between panes; where a pane is sounding, its edge burns
        img[edge] *= 0.08
        glow = cv2.GaussianBlur((edge * cv2.dilate(lit, np.ones((5, 5), np.float32))).astype(np.float32), (0, 0), 2.5)
        img += np.clip(glow, 0, 1.2)[..., None] * AMBER * 0.85
        # the light
        px, py = path[f]
        pf = path[max(f - 1, 0)]
        d2 = (xx - px) ** 2 + (yy - py) ** 2
        rad = 22 + 4 * math.sin(t * 2.3)
        core = np.exp(-d2 / (2 * (rad * 0.35) ** 2)) * 2.2 + np.exp(-d2 / (2 * rad ** 2)) * 0.7 + np.exp(-d2 / (2 * (rad * 4) ** 2)) * 0.2
        tr = np.exp(-((xx - pf[0]) ** 2 + (yy - pf[1]) ** 2) / (2 * (rad * 0.6) ** 2)) * 0.6
        fade_in = min(1.0, t / 0.6)
        out_l = 1 - min(1.0, max(0.0, (t - 46.0) / 2.5))
        img += (core + tr)[..., None] * AMBER * fade_in * out_l
        img = img + cv2.GaussianBlur(img, (0, 0), 6) * 0.25
        vig = np.clip(1.25 - ((xx - W / 2) ** 2 / W ** 2 + (yy - H / 2) ** 2 / H ** 2) * 1.5, 0, 1)[..., None]
        img = img * vig + rng.normal(0, 1.8, (H, W, 1))
        if t > T_CARD - 1.2:
            img *= max(0.0, 1 - (t - (T_CARD - 1.2)) / 1.2)
        img = np.clip(img, 0, 255).astype(np.uint8)
        if test:
            from PIL import Image
            Image.fromarray(img).save(f"{os.environ['TESTDIR']}/p{t:05.2f}.png")
            continue
        out.stdin.write(img.tobytes())
        if f % 96 == 0:
            print(f"{t:6.1f}", flush=True)
    if out:
        out.stdin.close()
        out.wait()


FF = "/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2"

if __name__ == "__main__":
    if os.environ.get("AUDIO"):
        render_audio()
    else:
        render_video()
