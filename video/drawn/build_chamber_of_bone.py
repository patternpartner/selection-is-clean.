"""'Chamber of Bone', 30 seconds: one clip (u83, a woman sitting still over a valley) and one idea: she turns to dust
in a sunbeam. The picture breathes on 'breathing', the first grains leave her on 'I'm still breathing', she pours up
into the golden beam on 'dust motes dancing', fades to an old photograph on 'everything's a memory', the last of her
pulses on 'heartbeat of the house', and on 'a hollow echo' her outline flashes once over the empty seat.
Needs out/drawn/u83/{frames,masks}.npy (rembg u2net_human_seg per frame).
    python3 video/drawn/build_chamber_of_bone.py   (from the repo root)
"""
import json
import math
import subprocess
import sys

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from wall import F, FPS, H, W  # noqa: E402

SONG = "out/songs/chamber-of-bone.mp3"
S0, S1 = 51.2, 84.0  # a breath before 'Breathing' ... the bar after 'chamber of bone'
DUR = S1 - S0
BEAT = 60 / 80.07  # the song's pulse at half time: the house's heartbeat


def f(song_t):
    return song_t - S0


T = dict(breathing=f(52.4), pretty=f(55.4), still=f(59.34), dust=f(65.06), memory=f(68.12), heart=f(76.18),
         alone=f(79.58), echo=f(80.54), bone=f(82.44))
# how much of her has gone to dust, on the film clock
PROG = [(0, 0), (T["still"], 0), (T["dust"], 0.1), (T["memory"], 0.3), (T["heart"], 0.66), (T["alone"], 1.02),
        (DUR, 1.02)]


def prog(t):
    return float(np.interp(t, *zip(*PROG)))


def smooth_noise(rng, scale, shape=(H, W)):
    n = rng.random((shape[0] // scale + 2, shape[1] // scale + 2)).astype(np.float32)
    return np.asarray(Image.fromarray((n * 255).astype(np.uint8)).resize((shape[1], shape[0]), Image.BICUBIC),
                      np.float32) / 255


def main():
    frames = np.load("out/drawn/u83/frames.npy")
    masks = np.clip(np.load("out/drawn/u83/masks.npy").astype(np.float32) / 255 * 1.5, 0, 1)
    L = len(frames)
    rng = np.random.default_rng(11)

    # the empty seat: her region filled from its surroundings by diffusion, on the median frame
    med = np.median(frames[::6], 0).astype(np.float32)
    hole = ndimage.binary_dilation(masks.max(0) > 0.15, iterations=10)
    small = Image.fromarray(med.astype(np.uint8)).resize((W // 4, H // 4), Image.BILINEAR)
    s = np.asarray(small, np.float32)
    h4 = np.asarray(Image.fromarray(hole.astype(np.uint8) * 255).resize((W // 4, H // 4)), np.float32)[..., None] > 0
    fill = np.where(h4, s.mean((0, 1)), s)
    for _ in range(300):
        fill = np.where(h4, ndimage.uniform_filter(fill, (5, 5, 1)), s)
    fill = np.asarray(Image.fromarray(fill.clip(0, 255).astype(np.uint8)).resize((W, H), Image.BICUBIC), np.float32)
    grain = (smooth_noise(rng, 3) - 0.5)[..., None] * 18
    plate = np.where(hole[..., None], fill + grain, med)
    plate = np.asarray(Image.fromarray(plate.clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6)),
                       np.float32)

    # when each pixel of her goes: rough noise plus a lean towards the light (upper right) so she pours into the beam
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    lean = 1 - (xx / W * 0.45 + (1 - yy / H) * 0.55)
    lean = (lean - lean[hole].min()) / (lean[hole].max() - lean[hole].min())
    rel = np.clip(0.55 * lean + 0.3 * smooth_noise(rng, 40) + 0.15 * smooth_noise(rng, 6), 0, 1)
    her = masks.max(0) > 0.5
    rel = np.clip((rel - rel[her].min()) / (rel[her].max() - rel[her].min()), 0, 1) * 0.97

    # the grains: one per 3x3 cell of her, released when the dissolve front passes it
    m0 = masks[0] > 0.5
    gy, gx = np.mgrid[1:H:3, 1:W:3]
    keep = m0[gy, gx]
    px, py = gx[keep].astype(np.float32), gy[keep].astype(np.float32)
    pr = rel[gy, gx][keep]
    pv = np.stack([rng.uniform(15, 55, len(px)), -rng.uniform(25, 80, len(px))], 1)  # up and to the right, px/s
    pph = rng.uniform(0, 6.3, len(px))
    psz = rng.choice([1, 2, 2, 3], len(px))
    pcol = np.zeros((len(px), 3), np.float32)
    born = np.full(len(px), -1.0)

    # the beam: a soft diagonal band from the top right corner down across her
    ang = math.radians(118)
    along = (xx - W * 0.95) * -math.sin(ang) + (yy + 60) * math.cos(ang)
    beam = np.exp(-(((xx - W * 0.95) * math.sin(ang) - (yy + 60) * math.cos(ang)) / 150) ** 2)
    beam = beam * np.clip(1 - np.abs(along) / 1900, 0, 1)
    motes = np.stack([rng.uniform(0, W, 420), rng.uniform(0, H, 420), rng.uniform(0, 6.3, 420),
                      rng.uniform(4, 14, 420)], 1)
    gold = np.array([255, 205, 120], np.float32)

    p = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                          str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p",
                          "out/drawn/chamber-of-bone.mp4"], stdin=subprocess.PIPE)
    pos = 0.0
    for n in range(int(DUR * FPS)):
        t = n / FPS
        pos += 0.6
        i = int(pos) % (2 * L - 2)
        i = i if i < L else 2 * L - 2 - i
        fr, m = frames[i].astype(np.float32), masks[i]
        pr_t = prog(t)
        # the dissolve: her pixels whose time has come are gone, with a thin burning edge
        a = m * (rel > pr_t)
        edge = m * np.clip(1 - np.abs(rel - pr_t) / 0.025, 0, 1) * (pr_t > 0)
        img = plate * (1 - a[..., None]) + fr * a[..., None]
        img = img * (1 - edge[..., None] * 0.7) + gold * edge[..., None] * 0.7
        # the picture breathes on 'breathing' and the lines after it
        br = 0.0
        if T["breathing"] <= t < T["dust"]:
            br = 0.5 - 0.5 * math.cos((t - T["breathing"]) * 2 * math.pi / (BEAT * 4))
        # the heartbeat: a thump every other beat once 'heartbeat of the house' is sung
        hb = 0.0
        if T["heart"] <= t < T["bone"]:
            ph = ((t - T["heart"]) % (BEAT * 2)) / (BEAT * 2)
            hb = math.exp(-ph * 9) + 0.6 * math.exp(-max(ph - 0.18, 0) * 12) * (ph > 0.18)
        # the light
        warm = 0.22 + 0.12 * (T["pretty"] <= t) + 0.1 * br + 0.18 * hb + 0.1 * min(pr_t, 1)
        img = img + beam[..., None] * gold * warm * 0.55
        # grains: released as the front passes, drifting up into the beam, turning gold, fading
        new = (born < 0) & (pr < pr_t)
        if new.any():
            born[new] = t
            pcol[new] = fr[py[new].astype(int), px[new].astype(int)]
        live = born >= 0
        if live.any():
            age = t - born[live]
            ok = age < 5.5
            idx = np.where(live)[0][ok]
            age = age[ok]
            gx_ = px[idx] + pv[idx, 0] * age + 14 * np.sin(age * 1.7 + pph[idx]) * np.minimum(age, 1)
            gy_ = py[idx] + pv[idx, 1] * age + 6 * np.sin(age * 2.3 + pph[idx])
            if hb:
                gx_ = gx_ + (gx_ - W * 0.35) * 0.04 * hb
                gy_ = gy_ + (gy_ - H * 0.55) * 0.04 * hb
            fade = np.clip(1 - age / 5.5, 0, 1) ** 1.3 * np.clip(age * 6, 0, 1)
            col = pcol[idx] * np.clip(1 - age / 1.2, 0, 1)[:, None] + gold * np.clip(age / 1.2, 0, 1)[:, None]
            glow = 1 + 0.8 * beam[np.clip(gy_, 0, H - 1).astype(int), np.clip(gx_, 0, W - 1).astype(int)]
            layer = np.zeros((H, W, 3), np.float32)
            acc = np.zeros((H, W), np.float32)
            for sz in (1, 2, 3):
                sel = psz[idx] >= sz
                xi, yi = gx_[sel].astype(int) + (sz - 1), gy_[sel].astype(int)
                okk = (xi >= 0) & (xi < W) & (yi >= 0) & (yi < H)
                w_ = (fade * glow)[sel][okk]
                np.add.at(layer, (yi[okk], xi[okk]), col[sel][okk] * w_[:, None])
                np.add.at(acc, (yi[okk], xi[okk]), w_)
            acc = np.clip(acc, 0, 1)[..., None]
            layer = layer / np.maximum(acc, 1e-6) * (acc > 0)
            img = img * (1 - acc) + layer * acc
        # ambient motes turning in the beam
        mx = (motes[:, 0] + 9 * np.sin(t * 0.3 + motes[:, 2]) + t * 4) % W
        my = (motes[:, 1] - motes[:, 3] * t) % H
        vis = beam[my.astype(int), mx.astype(int)] * (0.5 + 0.5 * np.sin(t * 1.3 + motes[:, 2]))
        for x_, y_, v in zip(mx.astype(int), my.astype(int), vis):
            if v > 0.05:
                img[max(0, y_ - 1):y_ + 1, max(0, x_ - 1):x_ + 1] += gold * v * 0.8
        # everything's a memory: the picture yellows into an old photograph and stays that way
        mem = np.clip((t - T["memory"]) / 2.5, 0, 1) * 0.65
        if mem:
            g = img @ [0.3, 0.59, 0.11]
            sep = np.stack([g * 1.08 + 12, g * 0.92 + 6, g * 0.7], -1)
            img = img * (1 - mem) + sep * mem
        # the hollow echo: her whole outline once, faint, over the empty seat
        if T["echo"] <= t < T["echo"] + 1.4:
            e = math.exp(-(t - T["echo"]) * 2.2) * 0.35
            img = img * (1 - m[..., None] * e) + (fr * 0.4 + gold * 0.6) * m[..., None] * e
        # breathing: a slow push in and out
        z = 1 + 0.025 * br
        if z > 1.0005:
            im = Image.fromarray(img.clip(0, 255).astype(np.uint8))
            cw, ch = W / z, H / z
            im = im.resize((W, H), Image.BILINEAR, box=((W - cw) / 2, (H - ch) * 0.55, (W + cw) / 2, (H - ch) * 0.55 + ch))
            img = np.asarray(im, np.float32)
        p.stdin.write(img.clip(0, 255).astype(np.uint8).tobytes())
        if n % (FPS * 4) == 0:
            print(f"{t:6.1f}s  gone {pr_t:.2f}", flush=True)
    p.stdin.close()
    p.wait()
    json.dump({"title": "Chamber of Bone", "clip": "u83", "song": SONG, "song_parts": [[S0, S1]],
               "times": {k: round(v, 2) for k, v in T.items()}},
              open("video/stories/chamber-of-bone.json", "w"), indent=1)


if __name__ == "__main__":
    main()
