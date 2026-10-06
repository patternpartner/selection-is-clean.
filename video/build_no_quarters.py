"""'No Quarters Left' - the user's own likeness, deadpan in a tuxedo, in a world of 90s home-video weirdness. The user's idea
list from the 6 Oct batches (u133-u171); Claude's pitch, which the user liked: "you, in the tux, calmly walking through all
that 90s weirdness as if it's perfectly normal ... the one steady thing while everything else goes strange." Song chosen
by Claude: 'No Quarters Left' (144.43 bpm, bar 1.6617 s, beat phase 0.197; scratched, chopped breakbeat; the title fits
the arcade clip). Song 13.49-68.33 = 33 bars, ending where the song drops away (68.33), then the end card.
Square 960x960 (most of the clips are square or landscape), a VHS look over everything, every cut a channel change
with a green CH number. His own clips (u146 penguins, u151 chickens, u155 fridge, u138 orange can) hold their deadpan;
in the strange ones he is cut out of u146 (rembg mask out/masks/u146.npy) and stood in the scene, unbothered. He floats
up beside the broccoli-headed figure without taking his hands out of his pockets. Only at the very end, in the
laundrette with the little puppets (u147), does he crack - and dance.
Brands: u151's supermarket sign is cropped off the top; u138 is used only after its lettering has turned away.
    python3 video/build_no_quarters.py   (TEST=s1,s2 TESTDIR=dir in SONG seconds; PART=a,b VOUT=f in film seconds)
"""
import math
import os
import subprocess

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.ndimage import gaussian_filter, label

F = imageio_ffmpeg.get_ffmpeg_exe()
N, FPS = 960, 24                                         # square output
BAR, PH = 1.6617, 0.197
S0 = PH + 8 * BAR                                        # 13.49: one bar of VHS PLAY before the first shot
S1 = S0 + 33 * BAR                                       # 68.33
DUR = S1 - S0
TEST = [float(x) for x in os.environ.get("TEST", "").split(",") if x]
PART = [float(x) for x in os.environ.get("PART", "").split(",") if x]
MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"
rng = np.random.default_rng(144)

# square crops (x, y, size) in each clip's own pixels
CROP = {'u146': (152, 32, 416), 'u151': (150, 60, 420), 'u155': (120, 0, 480), 'u138': (280, 0, 720), 'u147': (120, 0, 480),
        'u167': (184, 0, 496), 'u160': (152, 32, 416), 'u165': (184, 0, 496), 'u171': (152, 32, 416), 'u158': (190, 6, 484),
        'u170': (189, 32, 416), 'u163': (0, 120, 480), 'u169': (152, 32, 416), 'u153': (152, 32, 416), 'u159': (184, 0, 496)}
# the shots, two bars each (the last four): clip, clip start, him (feet x, feet y, height, as fractions of the frame) or None
SHOTS = [("u146", 2.0, None, 2), ("u167", 4.0, (0.78, 0.80, 0.42), 2), ("u151", 1.0, None, 2),
         ("u160", 6.6, (0.80, 0.84, 0.36), 2), ("u155", 3.0, None, 2), ("u165", 2.5, (0.24, 0.86, 0.22), 2),
         ("u171", 4.0, (0.86, 1.00, 0.50), 2), ("u138", 2.5, None, 2), ("u158", 3.0, (0.80, 1.35, 1.00), 2),
         ("u170", 5.0, (0.14, 0.97, 0.25), 2), ("u163", 4.5, (0.82, 0.93, 0.30), 2), ("u169", 5.5, (0.74, 0.93, 0.45), 2),
         ("u153", 7.0, (0.50, 0.96, 0.52), 2), ("u159", 4.5, (0.50, 1.02, 0.36), 2), ("u147", 2.0, None, 4)]
assert sum(b for *_, b in SHOTS) == 32


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def load(u, t0, dur):
    """only the seconds a shot uses (fifteen whole clips at 960 px do not fit in memory)"""
    x, y, sz = CROP[u]
    raw = subprocess.run([F, "-loglevel", "error", "-ss", f"{t0:.3f}", "-t", f"{dur:.3f}", "-i", f"out/user-clips/{u}.mp4",
                          "-map", "0:v:0", "-vf",
                          f"fps={FPS},crop={sz}:{sz}:{x}:{y},scale={N}:{N}:flags=lanczos", "-f", "rawvideo", "-pix_fmt", "rgb24",
                          "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, N, N, 3)


class Him:
    """him in the tux, cut out of u146 at the clip's own resolution"""
    def __init__(self):
        raw = subprocess.run([F, "-loglevel", "error", "-i", "out/user-clips/u146.mp4", "-map", "0:v:0", "-vf", f"fps={FPS}",
                              "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
        self.f = np.frombuffer(raw, np.uint8).reshape(-1, 480, 720, 3)
        self.m = np.load("out/masks/u146.npy", mmap_mode="r")
        # keep only the blob around him (the middle of the frame): penguins that leak into the mask are dropped
        cols = np.zeros(720, np.float32)
        cols[250:470] = 1
        self.keep = gaussian_filter(cols, 8)[None, :]
        tops, bots = [], []
        for i in range(0, min(len(self.f), len(self.m)), 12):
            mm = self.m[i].astype(np.float32) * self.keep / 255
            rows = np.where(mm.max(1) > 0.5)[0]
            tops.append(rows[0]); bots.append(rows[-1])
        self.top, self.bot = float(np.median(tops)), float(np.median(bots))
        ys, xs = np.nonzero(self.m[len(self.m) // 2].astype(np.float32) * self.keep > 128)
        self.cx = float(np.median(xs))

    def at(self, ct):
        i = int(min(max(ct * FPS, 0), min(len(self.f), len(self.m)) - 1))
        m = self.m[i].astype(np.float32) * self.keep / 255
        lab, n = label(m > 0.5)                              # only him: the blob under the middle of the frame
        if n > 1:
            sizes = np.bincount(lab.ravel())
            sizes[0] = 0
            m = m * gaussian_filter((lab == np.argmax(sizes)).astype(np.float32), 1.0)
        return self.f[i].astype(np.float32), m


def put_him(bg, him, ct, feet, h, s):
    """stand him in the scene: scaled, colour-matched to it, a contact shadow at his feet"""
    rgb, m = him.at(ct)
    hp = h * N                                               # his height in output px
    k = hp / (him.bot - him.top)
    fx, fy = feet[0] * N, feet[1] * N
    rgba = np.dstack([rgb, m * 255]).astype(np.uint8)
    im = Image.fromarray(rgba, "RGBA")
    # output (X,Y) -> source (cx + (X - fx)/k, bot + (Y - fy)/k)
    coeffs = (1 / k, 0, him.cx - fx / k, 0, 1 / k, him.bot - fy / k)
    o = np.asarray(im.transform((N, N), Image.AFFINE, coeffs, resample=Image.BICUBIC), np.float32)
    col, al = o[..., :3], o[..., 3] / 255
    if al.sum() < 10:
        return bg
    # colour match: pull his mean towards the scene's, gently
    sm = bg.reshape(-1, 3).mean(0) + 1
    hm = (col * al[..., None]).reshape(-1, 3).sum(0) / (al.sum() + 1e-6) + 1
    gain = (sm / hm) ** 0.45
    lum_s, lum_h = sm.mean(), hm.mean()
    gain = gain / gain.mean() * (lum_s / lum_h) ** 0.35
    col = np.clip(col * gain, 0, 255)
    # a soft shadow on the ground under him
    yy, xx = np.mgrid[0:N, 0:N].astype(np.float32)
    sh = np.exp(-(((xx - fx) / (0.22 * hp)) ** 2 + ((yy - fy) / (0.035 * hp)) ** 2)) * 0.55
    bg = bg * (1 - sh[..., None])
    al = gaussian_filter(al, 0.8)
    return bg * (1 - al[..., None]) + col * al[..., None]


def vhs(img, t, glitch):
    """the tape: chroma bleed, scanlines, a little wobble, lifted blacks, noise; tracking tear on a channel change"""
    a = img.astype(np.float32)
    a = 16 + a * 0.93
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    r = np.roll(r, 3, 1)
    b = np.roll(b, -2, 1)
    a = np.stack([r, g, b], -1)
    a = a * 0.75 + gaussian_filter(a, (0, 1.6, 0)) * 0.25
    wob = (np.sin(np.arange(N) / 37.0 + t * 3.1) * 1.2).astype(int)
    if glitch > 0:
        band = int((t * 997) % N)
        for y0 in range(0, N, 6):
            d = abs(y0 - band)
            sh = int(glitch * (40 * math.exp(-d / 60) + rng.normal(0, 6)))
            a[y0:y0 + 6] = np.roll(a[y0:y0 + 6], sh, 1)
        a = a * (1 - 0.25 * glitch) + rng.normal(0, 60 * glitch, (N, N, 1))
    for y in range(0, N, 24):
        a[y:y + 24] = np.roll(a[y:y + 24], wob[y], 1)
    a[::3] *= 0.9
    a += rng.normal(0, 5, (N, N, 1))
    return a


def osd(a, text, alpha, big=False):
    if alpha <= 0:
        return a
    lay = Image.new("L", (N, N), 0)
    d = ImageDraw.Draw(lay)
    fnt = ImageFont.truetype(MONO, 64 if big else 46)
    x, y = (70, 70) if big else (N - 300, 60)
    d.text((x + 4, y + 4), text, font=fnt, fill=90)
    m = np.asarray(lay, np.float32)[..., None] / 255
    lay2 = Image.new("L", (N, N), 0)
    ImageDraw.Draw(lay2).text((x, y), text, font=fnt, fill=255)
    m2 = np.asarray(lay2, np.float32)[..., None] / 255
    a = a * (1 - m * 0.6 * alpha)
    col = np.array([120, 255, 120], np.float32) if not big else np.array([235, 235, 235], np.float32)
    return a * (1 - m2 * alpha) + col * m2 * alpha


def main():
    him = Him()
    out = None
    if not TEST:
        out = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{N}x{N}", "-r",
                                str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "17", "-preset", "slow", "-pix_fmt", "yuv420p",
                                os.environ.get("VOUT", "out/drawn/no-quarters.mp4")], stdin=subprocess.PIPE)
    starts, b = [], 1
    for (_, _, _, nb) in SHOTS:
        starts.append(S0 + b * BAR)
        b += nb
    chans = [3, 7, 12, 4, 9, 21, 5, 33, 8, 11, 2, 16, 27, 6, 1]
    lo, hi = (PART[0], PART[1]) if PART else (0.0, DUR)
    clips = {}
    for j, (u, t0, _, nb) in enumerate(SHOTS):
        a0, a1 = starts[j] - S0, starts[j] - S0 + nb * BAR
        if a1 > lo and a0 < hi and (not TEST or any(a0 <= q - S0 < a1 for q in TEST)):
            clips[j] = load(u, t0, nb * BAR + 0.2)
    for fr in range(int(round(DUR * FPS))):
        t = fr / FPS
        s = S0 + t
        if TEST and not any(abs(s - q) < 0.5 / FPS for q in TEST):
            continue
        if PART and not (PART[0] <= t < PART[1]):
            continue
        if s < starts[0]:                                    # PLAY: blue, then the tape rolls in
            u = (s - S0) / BAR
            a = np.zeros((N, N, 3), np.float32) + np.array([20, 40, 170], np.float32)
            if u > 0.75:
                a = a * (1 - (u - 0.75) * 4) + rng.normal(128, 70, (N, N, 1)) * (u - 0.75) * 4
            a = vhs(a, t, 0.6 if u > 0.75 else 0)
            a = osd(a, "PLAY ▶", 1.0 if (s % 0.8) < 0.55 or u < 0.5 else 0.0, big=True)
        else:
            i = max(j for j in range(len(SHOTS)) if starts[j] <= s)
            u_, t0, place, nb = SHOTS[i]
            ls = s - starts[i]
            fr_clip = clips[i]
            a = fr_clip[min(int(ls * FPS), len(fr_clip) - 1)].astype(np.float32)
            if place is not None:
                fx, fy, h = place
                if u_ == "u169":                             # he floats up with it, hands in pockets
                    fy -= 0.55 * ease((ls - 0.6) / 2.6)
                a = put_him(a, him, 2.0 + 0.6 * i + ls, (fx, fy), h, s)
            glitch = max(0.0, 1 - ls / 0.16) if ls < 0.16 else 0.0
            a = vhs(a, t, glitch)
            a = osd(a, f"CH {chans[i]:02d}", 1.0 if ls < 1.3 else max(0.0, 1 - (ls - 1.3) / 0.2))
        img = np.clip(a, 0, 255).astype(np.uint8)
        if TEST:
            Image.fromarray(img).save(f"{os.environ['TESTDIR']}/q{s:06.2f}.png")
            print("test", round(s, 2), flush=True)
            continue
        out.stdin.write(img.tobytes())
        if fr % 96 == 0:
            print(f"{s:6.1f}", flush=True)
    if out:
        out.stdin.close()
        out.wait()


if __name__ == "__main__":
    main()
