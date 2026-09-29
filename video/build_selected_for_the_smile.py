"""'Selected for the Smile': a film that is actually EVOLVED. A wall of 112 tiles, each one a genome:
  a fragment of footage (which frame of which of our films, where, how big, turned to which colour, how bright),
  a vignette (a disc: where, how big, how dark outside it),
  two dark dots and a curved line (where, how big, how dark, how curved).
Nothing is drawn by hand and nothing is blended toward the answer. Every generation each tile is scored on how much
it looks like a yellow smiley (mean squared difference at 24x24); the worst twentieth die and are replaced by children of
the fittest (crossover and mutation). The wall starts as chaos cut from everything we made and converges, in public,
on a row of identical faces. The readout is the real generation count and the real mean score.
At the end the camera goes into the fittest smile, and in its painted eyes two points of light come on.
Song: A Row of Identical Faces 21.4-60.0 ('All the faces in a row' ... 'and at the end, everybody's smile').
    python3 video/build_selected_for_the_smile.py   (from the repo root)
"""
import glob
import json
import math
import subprocess

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFont

F = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 704, 1280, 24
SONG = "out/songs/a-row-of-identical-faces.mp3"
S0, S1 = 21.4, 60.0
DUR = S1 - S0
COLS, ROWS = 8, 14
TW, TH = W // COLS, H // ROWS  # 88 x 91
EV = 24  # evaluation resolution
POP = COLS * ROWS
MONO = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 22)


def f(song_t):
    return song_t - S0


T = dict(all=f(21.92), same=f(26.42), how1=f(33.96), smiled1=f(36.68), how2=f(44.96), smiled2=f(48.38), end=f(51.16),
         smile=f(54.04), fin=DUR)
# genes (all 0..1 except the frame index): frame, cx, cy, scale, hue, gain, disc_r, disc_x, disc_y, disc_k,
# eye_x, eye_y, eye_r, eye_k, eye_sep, mouth_y, mouth_w, mouth_c, mouth_t, mouth_k
NG = 20


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def frame_pool():
    """Frames from every film we made, small."""
    films = [p for p in sorted(glob.glob("out/*.mp4")) if any(k in p for k in (
        "chamber-of-bone-30s", "the-mirror-was-dead-30s", "spirit-of-my-own-30s", "under-bruised-skies-30s",
        "dont-cycle-the-power-30s", "whos-looking-right-back-15s", "calculate-the-ache-19s", "the-list-19s",
        "a-little-less-19s", "the-thread-19s", "the-door-22s", "blue-22s", "leave-the-light-on-34s",
        "first-draft-of-fate.mp4", "not-closing-it-19s", "whats-theirs-19s"))]
    pool = []
    for p in films:
        d = subprocess.run([F, "-i", p], capture_output=True, text=True).stderr.split("Duration: ")[1].split(",")[0]
        hh, mm, ss = d.split(":")
        dur = int(hh) * 3600 + int(mm) * 60 + float(ss)
        for k in range(10):
            t = dur * (0.08 + 0.72 * k / 9)
            raw = subprocess.run([F, "-loglevel", "error", "-ss", f"{t:.2f}", "-i", p, "-frames:v", "1", "-vf",
                                  "scale=176:320", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
            if len(raw) == 176 * 320 * 3:
                a = np.frombuffer(raw, np.uint8).reshape(320, 176, 3)
                if a.mean() > 12:  # skip black frames
                    pool.append(a)
    return pool


def hue_matrix(h):
    a = h * 2 * math.pi
    c, s = math.cos(a), math.sin(a)
    k = 1 / 3
    r = math.sqrt(k)
    return np.array([[c + (1 - c) * k, k * (1 - c) - r * s, k * (1 - c) + r * s],
                     [k * (1 - c) + r * s, c + (1 - c) * k, k * (1 - c) - r * s],
                     [k * (1 - c) - r * s, k * (1 - c) + r * s, c + (1 - c) * k]], np.float32)


class World:
    def __init__(self, pool, size):
        self.pool, self.w, self.h = pool, size[0], size[1]
        ys, xs = np.mgrid[0:self.h, 0:self.w].astype(np.float32)
        self.u, self.v = xs / (self.w - 1), ys / (self.h - 1)

    def render(self, g):
        fr = self.pool[int(g[0]) % len(self.pool)]
        s = 0.15 + 0.85 * g[3]
        cw, ch = 176 * s, 176 * s * self.h / self.w
        ch = min(ch, 320.0)
        x0 = g[1] * (176 - cw)
        y0 = g[2] * (320 - ch)
        im = Image.fromarray(fr).resize((self.w, self.h), Image.BILINEAR, box=(x0, y0, x0 + cw, y0 + ch))
        a = np.asarray(im, np.float32) @ hue_matrix(g[4]).T
        a = a * (0.4 + 1.6 * g[5])
        u, v = self.u, self.v
        # the disc: outside it goes dark
        r = 0.2 + 0.4 * g[6]
        dd = np.hypot(u - (0.3 + 0.4 * g[7]), (v - (0.3 + 0.4 * g[8])) * self.h / self.w)
        out = np.clip((dd - r) / 0.03, 0, 1)
        a = a * (1 - out[..., None] * g[9])
        # two dots
        er = 0.03 + 0.1 * g[12]
        sep = 0.05 + 0.3 * g[14]
        for sx in (-1, 1):
            de = np.hypot(u - (0.2 + 0.6 * g[10] + sx * sep / 2), (v - (0.15 + 0.5 * g[11])) * self.h / self.w)
            m = np.clip((er - de) / 0.015, 0, 1) * g[13]
            a = a * (1 - m[..., None])
        # the curved line
        my = 0.4 + 0.45 * g[15]
        mw = 0.1 + 0.35 * g[16]
        curve = (g[17] - 0.5) * 0.5
        x = (u - 0.5) / max(mw, 1e-3)
        yline = my + curve * (1 - np.clip(x, -1, 1) ** 2)
        m = (np.abs(v - yline) < (0.01 + 0.05 * g[18])) & (np.abs(x) < 1)
        a = a * (1 - (m * g[19])[..., None])
        return np.clip(a, 0, 255)


def target(size):
    w, h = size
    im = Image.new("RGB", (w * 4, h * 4), (0, 0, 0))
    d = ImageDraw.Draw(im)
    s = w * 4
    d.ellipse([s * 0.1, h * 4 / 2 - s * 0.4, s * 0.9, h * 4 / 2 + s * 0.4], fill=(246, 200, 40))
    for ex in (0.36, 0.64):
        d.ellipse([s * (ex - 0.06), h * 4 / 2 - s * 0.22, s * (ex + 0.06), h * 4 / 2 - s * 0.04], fill=(20, 14, 6))
    d.arc([s * 0.26, h * 4 / 2 - s * 0.2, s * 0.74, h * 4 / 2 + s * 0.28], 20, 160, fill=(20, 14, 6), width=int(s * 0.06))
    return np.asarray(im.resize((w, h), Image.LANCZOS), np.float32)


def main():
    rng = np.random.default_rng(1)
    pool = frame_pool()
    print("pool", len(pool), flush=True)
    ev, show, big = World(pool, (EV, EV)), World(pool, (TW, TH)), World(pool, (W, int(W * TH / TW)))
    tgt = target((EV, EV))
    base = float(((tgt - tgt.mean((0, 1))) ** 2).mean())  # what a flat colour scores: the 'no smile' line
    genes = rng.random((POP, NG)).astype(np.float32)
    genes[:, 0] = rng.integers(0, len(pool), POP)
    fit = np.array([-((ev.render(g) - tgt) ** 2).mean() for g in genes])
    gen = 0

    def step():
        nonlocal genes, fit, gen
        order = np.argsort(fit)
        dead = order[:max(2, POP // 20)]
        for i in dead:
            a, b = (max(rng.choice(POP, 3), key=lambda k: fit[k]) for _ in range(2))  # tournament
            child = np.where(rng.random(NG) < 0.5, genes[a], genes[b]).copy()
            mut = rng.random(NG) < 0.25
            child[1:] = np.clip(child[1:] + mut[1:] * rng.normal(0, 0.08, NG - 1), 0, 1)
            if rng.random() < 0.05:
                child[0] = rng.integers(0, len(pool))
            genes[i] = child
            fit[i] = -((ev.render(child) - tgt) ** 2).mean()
        gen += 1

    p = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                          str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p",
                          "out/drawn/selected-for-the-smile.mp4"], stdin=subprocess.PIPE)
    log = []
    for n in range(int(DUR * FPS)):
        t = n / FPS
        per = 0 if t < T["all"] else 1  # one generation a frame: the convergence takes the whole song
        for _ in range(per):
            step()
        score = float(np.clip(1 + fit.mean() / base, 0, 1))
        best = int(np.argmax(fit))
        log.append((round(t, 2), gen, round(score, 4)))
        frame = np.zeros((H, W, 3), np.float32)
        for i in range(POP):
            r, c = divmod(i, COLS)
            frame[r * TH:(r + 1) * TH, c * TW:(c + 1) * TW] = show.render(genes[i])
        # 'how you smiled': the fittest face is picked out in gold
        pick = max(math.sin(math.pi * min(max((t - T[k]) / 3.0, 0), 1)) for k in ("how1", "how2"))
        if pick > 0.02:
            r, c = divmod(best, COLS)
            frame[r * TH:(r + 1) * TH, c * TW:(c + 1) * TW] *= 1 + 0.6 * pick
        im = Image.fromarray(np.clip(frame, 0, 255).astype(np.uint8))
        d = ImageDraw.Draw(im)
        if pick > 0.02:
            r, c = divmod(best, COLS)
            d.rectangle([c * TW, r * TH, (c + 1) * TW - 1, (r + 1) * TH - 1], outline=(255, 205, 120), width=3)
        # the instrument: real numbers
        d.rectangle([0, 0, W, 34], fill=(0, 0, 0))
        d.text((12, 6), f"GENERATION {gen:5d}   SMILE {score:0.3f}", font=MONO, fill=(120, 240, 150))
        # the end: into the fittest smile, and two points of light in its painted eyes
        zin = ease((t - T["smile"] - 0.4) / 3.0)
        if zin > 0:
            r, c = divmod(best, COLS)
            cx, cy = c * TW + TW / 2, r * TH + TH / 2
            bw = W * (TW / W) ** zin  # zoom evenly in log scale, from the whole wall to one tile's width
            bh = bw * H / W
            ox, oy = W / 2 + (cx - W / 2) * zin, H / 2 + (cy - H / 2) * zin
            x0, y0 = min(max(ox - bw / 2, 0), W - bw), min(max(oy - bh / 2, 0), H - bh)
            zoomed = np.asarray(im.resize((W, H), Image.LANCZOS, box=(x0, y0, x0 + bw, y0 + bh)), np.float32)
            if zin > 0.85:  # and it becomes that one face, whole, on black
                bh_ = int(W * TH / TW)
                canvas = np.zeros((H, W, 3), np.float32)
                oyy = (H - bh_) // 2
                canvas[oyy:oyy + bh_] = big.render(genes[best])
                u = (zin - 0.85) / 0.15
                zoomed = zoomed * (1 - u) + canvas * u
                light = ease((t - T["smile"] - 3.4) / 0.8)
                if light > 0:
                    imz = Image.fromarray(np.clip(zoomed, 0, 255).astype(np.uint8))
                    dz = ImageDraw.Draw(imz)
                    g = genes[best]
                    sep = 0.05 + 0.3 * g[14]
                    for sx in (-1, 1):
                        ex = (0.2 + 0.6 * g[10] + sx * sep / 2) * W
                        ey = oyy + (0.15 + 0.5 * g[11]) * bh_
                        rr = 13 * light
                        dz.ellipse([ex - rr, ey - rr, ex + rr, ey + rr], fill=(255, 225, 150))
                    zoomed = np.asarray(imz, np.float32)
            im = Image.fromarray(np.clip(zoomed, 0, 255).astype(np.uint8))
        a = np.asarray(im, np.float32) + rng.normal(0, 3, (H, W, 1))
        p.stdin.write(np.clip(a, 0, 255).astype(np.uint8).tobytes())
        if n % (FPS * 4) == 0:
            print(f"{t:5.1f}s gen {gen} smile {score:.3f}", flush=True)
    p.stdin.close()
    p.wait()
    json.dump({"title": "Selected for the Smile", "song": SONG, "song_parts": [[S0, S1]], "population": POP,
               "genes": NG, "death_rate": 0.05, "fitness": "negative MSE to a yellow smiley at 24x24",
               "times": T, "log_every_frame": log[::24]}, open("video/stories/selected-for-the-smile.json", "w"), indent=1)


if __name__ == "__main__":
    main()
