"""'Sync' (Concrete Pressure; its only words: 'Echo. Pulse. Drift. Drift. Sync.'). One idea, no text.
A dark wet concrete floor and two small lights, far apart, each flashing at its own rate; every flash lights a pool of
the floor around it. 'Echo': far off, faintly, another answers. 'Pulse': the near one. 'Drift. Drift.': they drift
together, their flashes sliding past each other. 'Sync': they flash together - and not because one gave in: the
flashing is a real pair of coupled oscillators (Kuramoto: each nudges the other's phase, more strongly the nearer they
are), so BOTH change rate and meet between their own. After, the camera pulls back, and far away a third light begins
to flash, in time with them.
    python3 video/build_sync.py        (TEST=t1,t2 TESTDIR=dir for stills; PART=a,b VOUT=f for a stretch)
"""
import json
import math
import os
import subprocess

import imageio_ffmpeg
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

F = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 704, 1280, 24
T = json.load(open("video/stories/sync-times.json"))
S0, S1 = T["start"], T["end"]
DUR = S1 - S0
TEST = [float(x) for x in os.environ.get("TEST", "").split(",") if x]
PART = [float(x) for x in os.environ.get("PART", "").split(",") if x]
AMBER = np.array([255, 178, 92], np.float32)
TEAL = np.array([110, 225, 255], np.float32)
rng = np.random.default_rng(41)


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def ramp(s, a, b):
    return ease((s - a) / (b - a))


# ------------------------------------------------------------------ the two oscillators, simulated
def simulate():
    """phases of A, B (and the late third light C) at every frame; K grows as they come close"""
    fA, fB, fC = 1.12, 0.92, 0.97
    beat_hz = 124 / 60 / 2
    th = np.array([0.3, 2.6, 1.0])
    out = []
    sub = 20
    dt = 1 / FPS / sub
    for n in range(int(DUR * FPS) + 1):
        s = S0 + n / FPS
        for _ in range(sub):
            ss = s
            prox = ramp(ss, T["drift"], T["sync"] + 0.3)
            K = 0.15 + 3.4 * prox ** 2                   # coupling grows as the distance closes
            dA = 2 * math.pi * fA + K * math.sin(th[1] - th[0])
            dB = 2 * math.pi * fB + K * math.sin(th[0] - th[1])
            # after they lock, the music joins in very lightly (so their flash lands on its beat)
            if ss > T["sync"]:
                mus = 2 * math.pi * beat_hz * (ss - 0.04)
                dA += 1.2 * math.sin(mus - th[0])
                dB += 1.2 * math.sin(mus - th[1])
            # the third light, far off, hears them only at the end
            kc = 3.0 * ramp(ss, T["third"], T["third"] + 2.5)
            dC = 2 * math.pi * fC + kc * math.sin((th[0] + th[1]) / 2 - th[2])
            th += np.array([dA, dB, dC]) * dt
        out.append(th.copy())
    return np.array(out)


def flash(theta, sharp=10):
    return max(0.0, math.cos(theta)) ** sharp


# ------------------------------------------------------------------ the floor
HZ = 330.0            # horizon on screen
FOC, CAMH = 700.0, 1.0


def floor_coords(camh, foc, cx=W / 2):
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    dy = ys - HZ
    ok = dy > 1
    Z = np.where(ok, foc * camh / np.maximum(dy, 1), 1e6)
    X = (xs - cx) * Z / foc
    return X, Z, ok


def tex_lookup(tex, X, Z, k):
    n = tex.shape[0]
    u = (np.floor(X * k) % n).astype(np.int64)
    v = (np.floor(Z * k) % n).astype(np.int64)
    return tex[v, u]


def make_textures():
    n = 1024
    a = rng.random((n, n)).astype(np.float32)
    grain = gaussian_filter(a, 1.0, mode="wrap") * 0.6 + gaussian_filter(a, 6, mode="wrap") * 2.5 + gaussian_filter(a, 30, mode="wrap") * 6
    grain = (grain - grain.min()) / (grain.max() - grain.min())
    wet = gaussian_filter(rng.random((n, n)).astype(np.float32), 40, mode="wrap")
    wet = np.clip((wet - np.percentile(wet, 55)) / (np.percentile(wet, 90) - np.percentile(wet, 55)), 0, 1)
    return grain, wet


def screen(X, Z, camh, foc, cx=W / 2):
    return cx + foc * X / Z, HZ + foc * camh / Z


def main():
    ph = simulate()
    grain, wet = make_textures()
    out = None
    if not TEST:
        out = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                                str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "15", "-preset", "slow", "-pix_fmt", "yuv420p",
                                os.environ.get("VOUT", "out/drawn/sync.mp4")], stdin=subprocess.PIPE)
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    for n in range(int(DUR * FPS)):
        t = n / FPS
        s = S0 + t
        if TEST and not any(abs(s - q) < 0.5 / FPS for q in TEST):
            continue
        if PART and not (PART[0] <= t < PART[1]):
            continue
        # camera: close and low, pulling back and up after they meet
        back = ramp(s, T["sync"] + 1.5, T["end"] - 0.5)
        camh = CAMH * (1 + 1.4 * back)
        foc = FOC * (1 - 0.25 * back)
        X, Z, ok = floor_coords(camh, foc)
        g = gaussian_filter(tex_lookup(grain, X, Z, 260.0), 0.7)
        wt = tex_lookup(wet, X, Z, 20.0)
        # the two lights on the floor: where they are
        d1 = ramp(s, T["drift"], T["drift2"] + 0.8)
        d2 = ramp(s, T["drift2"], T["sync"])
        dd = 0.55 * d1 + 0.45 * d2
        A = (-0.72 + (0.72 - 0.2) * dd, 2.1 + (2.9 - 2.1) * dd)
        B = (1.9 + (0.2 - 1.9) * dd, 9.0 + (2.9 - 9.0) * dd)
        C = (-2.6, 26.0)
        fa = flash(ph[n][0]) * (1.0 if s >= T["pulse"] - 1.2 else 0.55)
        fb = flash(ph[n][1]) * (0.0 if s < T["echo"] - 0.2 else 1.0) * (0.35 + 0.65 * ramp(s, T["echo"], T["drift"]))
        fc = flash(ph[n][2]) * ramp(s, T["third"], T["third"] + 1.5) * 0.9
        base = np.array([11, 12, 14], np.float32) * (0.5 + 1.0 * g[..., None])
        light = np.zeros((H, W, 3), np.float32)
        for (P, fl, col, pw) in ((A, fa, AMBER, 1.0), (B, fb, TEAL, 1.0), (C, fc, TEAL * 0.6 + AMBER * 0.4, 2.2)):
            if fl <= 0.002:
                continue
            dist2 = (X - P[0]) ** 2 + (Z - P[1]) ** 2
            pool = 1.15 * pw * fl / (1 + dist2 * 1.1)
            light += pool[..., None] * col * (0.35 + 0.9 * g[..., None])
            # wet patches mirror the light: a long streak straight down from it
            sx, sy = screen(P[0], P[1], camh, foc)
            hy = sy - 22 * foc / FOC / P[1] * 6          # the light hovers a little above the floor
            streak = np.exp(-((xs - sx) / (5 + 60 / P[1])) ** 2) * np.clip(1 - (ys - sy) / (1600 / P[1] + 80), 0, 1) * (ys > sy)
            light += (streak * (0.25 + wt) * fl * 1.3)[..., None] * col
        a = base * ok[..., None] + light * ok[..., None]
        a *= (0.25 + 0.75 * np.clip((ys - HZ) / 500, 0, 1))[..., None]     # the far floor sinks into dark
        # the lights themselves: a small hot core and a halo, sized by distance
        for (P, fl, col, alive) in ((A, fa, AMBER, 1.0), (B, fb, TEAL, 1.0 if s >= T["echo"] - 0.2 else 0.0),
                                    (C, fc, TEAL * 0.6 + AMBER * 0.4, ramp(s, T["third"], T["third"] + 1.5))):
            if alive <= 0:
                continue
            sx, sy = screen(P[0], P[1], camh, foc)
            sy -= 0.18 * foc * camh / P[1] * 0.9
            r = 7 * 6 / P[1] * (foc / FOC)
            glow = np.exp(-(((xs - sx) ** 2 + (ys - sy) ** 2) / (2 * (r * 5) ** 2)))
            core = np.exp(-(((xs - sx) ** 2 + (ys - sy) ** 2) / (2 * r ** 2)))
            ember = 0.10 * alive            # between flashes it is still there, a dim ember
            a += (glow * (ember + fl) * 0.9)[..., None] * col + (core * (ember * 2 + fl * 3))[..., None] * np.array([255, 245, 230], np.float32)
        a = 255 * (1 - np.exp(-a / 255 * 1.25))      # highlights roll off instead of clipping to white
        a *= ease(t / 1.0)
        if s >= S1 - 0.6:
            a *= 1 - ease((s - (S1 - 0.6)) / 0.55)
        a += rng.normal(0, 2.2, (H, W, 1))
        frame = np.clip(a, 0, 255).astype(np.uint8)
        if TEST:
            Image.fromarray(frame).save(f"{os.environ['TESTDIR']}/y{s:.2f}.png")
            print("test", round(s, 2), f"fa {fa:.2f} fb {fb:.2f}", flush=True)
            continue
        out.stdin.write(frame.tobytes())
        if n % 96 == 0:
            print(f"{s:6.1f}", flush=True)
    if out:
        out.stdin.close()
        out.wait()
    # how the two phases actually came together (for the notes)
    dph = np.angle(np.exp(1j * (ph[:, 0] - ph[:, 1])))
    lock = next((S0 + i / FPS for i in range(len(dph)) if all(abs(dph[j]) < 0.25 for j in range(i, min(len(dph), i + 24)))), None)
    print("phase gap at sync:", round(float(dph[int((T['sync'] - S0) * FPS)]), 3), "locked from:", lock)


if __name__ == "__main__":
    main()
