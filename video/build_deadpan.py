"""'Deadpan' (was 'No Quarters Left' v2; the user swapped the song for 'Same Time Tomorrow?') - the user's own likeness WALKING, deadpan, through a world of 90s home-video weirdness. From the
6 Oct batches (u133-u171) and Claude's pitch, which the user liked: "you ... calmly walking through all that 90s weirdness
as if it's perfectly normal". Song chosen by Claude: 'No Quarters Left' (144.43 bpm, bar 1.6617 s, beat phase 0.197; a
chopped, scratched breakbeat). Song 13.49-68.33 = 33 bars (ending where the song drops away), then the end card.
v1 was rejected, rightly: "You said walking through and I just stood there. Trainers missing half the time. It's
essentially just the same video with me plopped into them." v2:
 - HE WALKS. The walking is his own blue-screen footage (u117, u113, u114 side view; keyed with video/bluekey.py, so the
   trainers are there), normalised to a steady size on screen while the background dollies in - he walks THROUGH each
   place. The walk carries across the channel changes.
 - THE PLACES HAPPEN TO HIM AND HE ANSWERS, barely: he turns to look back as the head rises from the bowling pins; the
   arcade hand snatches at the air behind him; he bows to the dancing skeleton, then gives it a deadpan ta-da; he shrugs
   at the hollow-faced teddy; he sits on thin air and floats up with the broccoli head; he presses his palm to the glass
   of the staring sun's TV from inside; he looks up with the crowd at the opening sky; he walks the row of identical
   figures side-on. His own deadpan tux clips (penguins, chickens, fridge, the orange can) are stops on the way, and in
   the laundrette with the puppets (u147) he finally dances.
Square 960x960 with a VHS look; every cut a channel change (tracking tear, green CH number).
    python3 video/build_deadpan.py   (TEST=s1,s2 TESTDIR=dir in SONG seconds; PART=a,b VOUT=f in film seconds)
"""
import math
import os
import subprocess
import sys

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.ndimage import gaussian_filter, median_filter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bluekey import key  # noqa: E402

F = imageio_ffmpeg.get_ffmpeg_exe()
N, FPS = 960, 24
BAR, PH = 4 * 60 / 126.0, 0.124                       # 'Same Time Tomorrow?' (the user's pick), 126 bpm
S0 = PH + 3 * BAR                                        # 5.84: one bar of VHS PLAY, the first shot on the drop
DUR = 34 * BAR
TEST = [float(x) for x in os.environ.get("TEST", "").split(",") if x]
PART = [float(x) for x in os.environ.get("PART", "").split(",") if x]
MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"
rng = np.random.default_rng(144)

CROP = {'u146': (152, 32, 416), 'u151': (150, 60, 420), 'u155': (120, 0, 480), 'u138': (280, 0, 720), 'u147': (120, 0, 480),
        'u167': (184, 0, 496), 'u160': (152, 32, 416), 'u165': (184, 0, 496), 'u171': (152, 32, 416), 'u158': (190, 6, 484),
        'u170': (189, 32, 416), 'u163': (0, 120, 480), 'u169': (152, 32, 416), 'u153': (152, 32, 416), 'u159': (184, 0, 496),
        'u148': (152, 32, 416), 'u149': (5, 5, 950), 'u150': (184, 0, 496), 'u154': (152, 32, 416), 'u156': (125, 10, 470),
        'u157': (141, 22, 440), 'u161': (152, 32, 416), 'u162': (184, 0, 496), 'u164': (154, 32, 416), 'u168': (152, 32, 416)}

# one bar each unless said. (background clip, its start, him or None)
# him = (clip, start, mode, a, b, c, flip): mode "walk": feet x, feet y, height (fractions of the frame), size normalised;
#                                          mode "frame": his whole 720x1280 frame, centre x, centre y, scale
W_, D_ = "walk", "dance"
SHOTS = [
    # ---- the instrumental: deadpan, walking through it
    ("u146", 2.0, None, 2),                                                   # penguins: deadpan, standing
    ("u167", 4.0, ("u117", 3.0, W_, 0.60, 0.93, 0.62, False), 1),             # the turkey crawls; he walks on
    ("u160", 7.3, ("u117", 4.9, W_, 0.70, 0.95, 0.55, False), 1),             # the head rises behind him...
    ("u160", 8.4, ("u117", 8.5, W_, 0.70, 0.95, 0.55, False), 1),             # ...he turns to look at it
    ("u151", 1.0, None, 1),                                                   # chickens
    ("u165", 3.0, ("u117", 11.0, W_, 0.24, 0.86, 0.30, False), 1),            # tiny, on the counter, past the jug's mouth
    ("u171", 4.6, ("u117", 12.9, W_, 0.70, 0.97, 0.62, False), 1),            # the arcade hand snatches behind him
    ("u155", 3.0, None, 1),                                                   # fridge
    ("u164", 2.0, ("u114", 13.0, W_, 0.20, 0.88, 0.40, False), 1),            # side-on along the row of identical figures
    ("u158", 3.0, ("u114", 7.6, W_, 0.78, 0.97, 0.62, False), 1),             # he bows to the skeleton
    # ---- "So I took my hands out of my pockets slow"
    ("u149", 3.0, ("u120", 0.0, D_, 0.40, 0.88, 0.40, False, 0.4), 2),        # on the forecourt as the car doors open
    # ---- "and I gave them the only thing I know"
    ("u149", 6.8, ("u120", 1.5, D_, 0.40, 0.88, 0.40, False), 1),
    ("u158", 5.0, ("u120", 3.4, D_, 0.78, 0.97, 0.62, False), 1),             # dancing with the skeleton
    ("u163", 5.0, ("u120", 5.3, D_, 0.80, 0.93, 0.34, False), 1),             # at the hollow teddy's party
    ("u159", 5.0, ("u118", 1.0, D_, 0.50, 1.00, 0.55, False), 1),             # "no speech, no flag, no plan" under the sun
    ("u156", 4.0, ("u118", 2.9, D_, 0.50, 0.95, 0.50, False), 1),             # "a left foot, a right foot" in the office
    ("u168", 3.0, ("u118", 4.8, D_, 0.27, 0.90, 0.40, False), 1),             # "a clap of the hands" by the doughnut
    ("u169", 5.5, ("u118", 8.5, D_, 0.74, 0.93, 0.40, False), 2),             # "Area 51, hey!" - jumping, floating up
    ("u148", 2.5, ("u120", 7.2, D_, 0.70, 0.80, 0.42, False), 1),             # "we came out dancing" - spinning in space
    ("u154", 4.0, ("u118", 6.4, D_, 0.50, 0.97, 0.50, False), 1),             # under the opening sky
    ("u153", 7.0, ("u120", 9.1, D_, 0.50, 0.96, 0.52, False), 1),             # "they copy everything" - the troupe in step
    ("u170", 5.5, ("u120", 12.9, D_, 0.16, 0.96, 0.30, False), 1),            # "arms up, round and round"
    ("u161", 5.0, ("u120", 11.0, D_, 0.72, 0.70, 0.30, False), 1),            # past the car in the lightning
    ("u150", 3.0, ("u118", 12.4, D_, 0.45, 0.97, 0.60, False), 1),            # "arms up" - waving both hands
    ("u162", 4.5, ("u120", 9.1, D_, 0.80, 0.98, 0.66, True), 1),              # by the crying doll
    ("u157", 4.0, ("u120", 5.3, D_, 0.70, 0.95, 0.58, True), 1),              # "first thing they ever saw us do"
    ("u147", 1.0, None, 4),                                                   # the laundrette: "Area 51, hey!"
]
assert sum(s[3] for s in SHOTS) == 33, sum(s[3] for s in SHOTS)


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def load_bg(u, t0, dur):
    """only the seconds a shot uses"""
    x, y, sz = CROP[u]
    raw = subprocess.run([F, "-loglevel", "error", "-ss", f"{t0:.3f}", "-t", f"{dur:.3f}", "-i", f"out/user-clips/{u}.mp4",
                          "-map", "0:v:0", "-vf", f"fps={FPS},crop={sz}:{sz}:{x}:{y},scale={N}:{N}:flags=lanczos", "-f",
                          "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, N, N, 3)


def load_him(u, t0, dur, flip, steady=False):
    """his blue-screen frames, keyed; plus a smoothed bounding box (top, bottom, centre x) per frame"""
    raw = subprocess.run([F, "-loglevel", "error", "-ss", f"{t0:.3f}", "-t", f"{dur:.3f}", "-i", f"out/user-clips/{u}.mp4",
                          "-map", "0:v:0", "-vf", f"fps={FPS}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                         capture_output=True).stdout
    fr = np.frombuffer(raw, np.uint8).reshape(-1, 1280, 720, 3)
    out, boxes = [], []
    for f in fr:
        rgb, al = key(f.astype(np.float32))
        if flip:
            rgb, al = rgb[:, ::-1], al[:, ::-1]
        out.append((rgb.astype(np.uint8), (al * 255).astype(np.uint8)))
        rows = np.where((al > 0.5).sum(1) > 3)[0]
        cols = np.where((al > 0.5).sum(0) > 3)[0]
        boxes.append((rows[0], rows[-1], (cols[0] + cols[-1]) / 2) if len(rows) else (0, 1279, 360))
    b = np.array(boxes, np.float32)
    if steady:                                               # dancing: one size and one floor line for the whole shot,
        h = np.median(b[:, 1] - b[:, 0])                     # so the jumps and arm swings move, not the scale
        b[:, 1] = np.median(b[:, 1])
        b[:, 0] = b[:, 1] - h
        b[:, 2] = np.median(b[:, 2])
        return out, b
    for j in range(3):
        b[:, j] = median_filter(b[:, j], 9, mode="nearest")
        b[:, j] = gaussian_filter(b[:, j], 2.0, mode="nearest")
    return out, b


def put_him(bg, rgb, al, box, mode, a, b, c, s):
    """stand him in the scene, colour-matched to it, a contact shadow under his feet when he is walking"""
    top, bot, cx = box
    rgba = np.dstack([rgb, al]).astype(np.uint8)
    im = Image.fromarray(rgba, "RGBA")
    if mode in ("walk", "dance"):
        k = c * N / max(bot - top, 50)
        fx, fy = a * N, b * N
        coeffs = (1 / k, 0, cx - fx / k, 0, 1 / k, bot - fy / k)
    else:
        k = c * N / 1280
        X, Y = a * N, b * N
        coeffs = (1 / k, 0, 360 - X / k, 0, 1 / k, 640 - Y / k)
    o = np.asarray(im.transform((N, N), Image.AFFINE, coeffs, resample=Image.BICUBIC), np.float32)
    col, alpha = o[..., :3], o[..., 3] / 255
    if alpha.sum() < 10:
        return bg
    sm = bg.reshape(-1, 3).mean(0) + 1
    hm = (col * alpha[..., None]).reshape(-1, 3).sum(0) / (alpha.sum() + 1e-6) + 1
    gain = (sm / hm) ** 0.4
    gain = gain / gain.mean() * (sm.mean() / hm.mean()) ** 0.3
    col = np.clip(col * gain, 0, 255)
    if mode in ("walk", "dance"):
        hp = c * N
        yy, xx = np.mgrid[0:N, 0:N].astype(np.float32)
        sh = np.exp(-(((xx - fx) / (0.2 * hp)) ** 2 + ((yy - fy) / (0.03 * hp)) ** 2)) * 0.5
        bg = bg * (1 - sh[..., None])
    alpha = gaussian_filter(alpha, 0.7)
    return bg * (1 - alpha[..., None]) + col * alpha[..., None]


def dolly(a, ls, nb, i):
    """the camera moves in on the place as he walks through it"""
    z = 1.0 + 0.10 * ls / (nb * BAR)
    if z <= 1.001:
        return a
    im = Image.fromarray(a.astype(np.uint8))
    cx, cy = N / 2 + 40 * math.sin(i * 1.7), N * 0.48
    coeffs = (1 / z, 0, cx - cx / z, 0, 1 / z, cy - cy / z)
    return np.asarray(im.transform((N, N), Image.AFFINE, coeffs, resample=Image.BILINEAR), np.float32)


def vhs(img, t, glitch):
    """the tape: chroma bleed, scanlines, a little wobble, lifted blacks, noise; a tracking tear on a channel change"""
    a = img.astype(np.float32)
    a = 16 + a * 0.93
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    a = np.stack([np.roll(r, 3, 1), g, np.roll(b, -2, 1)], -1)
    a = a * 0.75 + gaussian_filter(a, (0, 1.6, 0)) * 0.25
    wob = (np.sin(np.arange(N) / 37.0 + t * 3.1) * 1.2).astype(int)
    if glitch > 0:
        band = int((t * 997) % N)
        for y0 in range(0, N, 6):
            sh = int(glitch * (40 * math.exp(-abs(y0 - band) / 60) + rng.normal(0, 6)))
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
    fnt = ImageFont.truetype(MONO, 64 if big else 46)
    x, y = (70, 70) if big else (N - 300, 60)
    lay = Image.new("L", (N, N), 0)
    ImageDraw.Draw(lay).text((x + 4, y + 4), text, font=fnt, fill=90)
    m = np.asarray(lay, np.float32)[..., None] / 255
    lay2 = Image.new("L", (N, N), 0)
    ImageDraw.Draw(lay2).text((x, y), text, font=fnt, fill=255)
    m2 = np.asarray(lay2, np.float32)[..., None] / 255
    a = a * (1 - m * 0.6 * alpha)
    col = np.array([120, 255, 120], np.float32) if not big else np.array([235, 235, 235], np.float32)
    return a * (1 - m2 * alpha) + col * m2 * alpha


def main():
    out = None
    if not TEST:
        out = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{N}x{N}", "-r",
                                str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "17", "-preset", "slow", "-pix_fmt", "yuv420p",
                                os.environ.get("VOUT", "out/drawn/deadpan.mp4")], stdin=subprocess.PIPE)
    starts, b = [], 1
    for s in SHOTS:
        starts.append(S0 + b * BAR)
        b += s[3]
    chans = [(7 * j + 3) % 40 + 1 for j in range(len(SHOTS))]
    lo, hi = (PART[0], PART[1]) if PART else (0.0, DUR)
    bgs, hims = {}, {}
    for j, (u, t0, him, nb) in enumerate(SHOTS):
        a0, a1 = starts[j] - S0, starts[j] - S0 + nb * BAR
        if a1 > lo and a0 < hi and (not TEST or any(a0 <= q - S0 < a1 for q in TEST)):
            bgs[j] = load_bg(u, t0, nb * BAR + 0.2)
            if him:
                sp = him[7] if len(him) > 7 else 1.0
                hims[j] = load_him(him[0], him[1], nb * BAR * sp + 0.2, him[6], him[2] == D_)
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
            u_, t0, him, nb = SHOTS[i]
            ls = s - starts[i]
            fb = bgs[i]
            a = fb[min(int(ls * FPS), len(fb) - 1)].astype(np.float32)
            if him is not None:
                a = dolly(a, ls, nb, i)
                frames, boxes = hims[i]
                sp = him[7] if len(him) > 7 else 1.0
                k = min(int(ls * sp * FPS), len(frames) - 1)
                hu, ht, mode, pa, pb, pc, flip = him[:7]
                if u_ == "u169":                             # he floats up with it, still sitting on nothing
                    pb = pb - 0.5 * ease((ls - 0.5) / 2.6)
                a = put_him(a, frames[k][0], frames[k][1], boxes[k], mode, pa, pb, pc, s)
            glitch = max(0.0, 1 - ls / 0.16) if ls < 0.16 else 0.0
            a = vhs(a, t, glitch)
            a = osd(a, f"CH {chans[i]:02d}", 1.0 if ls < 1.0 else max(0.0, 1 - (ls - 1.0) / 0.2))
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
