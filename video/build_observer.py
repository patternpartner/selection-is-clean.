"""'The Observer': the scientist in the goggles (out/inputs/goggles.jpg, a painting) watches the real universe, and his
gaze IS the engine's attention input (#135: where the pointer rests, living costs less, and evolved code can read it).
Four worlds watched at the same spot (video/observer_tape.js, out/observer/s1..s4) plus world 3 never watched
(out/observer/s3-blind). World 3 crowds under his gaze - and crowds there just the same when nobody is watching, and
stays when he looks away. The other three never gathered. He was seeing his own reflection.
Song: No More Ground, 16.49-63.91 then 110.36-144.30 (bar-aligned splice).
    python3 video/build_observer.py      (writes out/drawn/the-observer.mp4, video only; the mux adds the song)
"""
import json
import os
import subprocess

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

F = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 704, 1280, 24
A0, A1, B0, B1 = 16.492, 63.911, 110.363, 144.30
DUR = (A1 - A0) + (B1 - B0)
MONO = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 24)
MONOB = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf", 44)
SMALL = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 20)
WARM = (255, 206, 130)
PALE = (215, 225, 235)
DIM = (120, 140, 160)
CACHE = os.environ.get("CACHE", "/tmp/observer-cache")
TAPES = {"s1": "out/observer/s1", "s2": "out/observer/s2", "s3": "out/observer/s3", "s4": "out/observer/s4",
         "blind": "out/observer/s3-blind"}
LENS_BOX = (1270, 530, 1885, 955)   # the visor's glass in the painting, original pixels


def f(song):
    """film time of a song time, across the splice"""
    return song - A0 if song <= A1 + 1e-6 else (A1 - A0) + (song - B0)


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def lerp(a, b, u):
    return a + (b - a) * u


# ---------------------------------------------------------------- the plan: what each frame shows
# scene: (start film time, end film time, kind, params)
S = [
    (0.0, f(32.9), "portrait_in", {}),
    (f(32.9), f(36.56), "world", dict(tape="s3", t0=3000, t1=6500, gaze=1)),
    (f(36.56), f(40.62), "lens", dict(tape="s3", t0=6500, t1=6900, dark=0)),
    (f(40.62), f(47.8), "world", dict(tape="s3", t0=9800, t1=11300, gaze=1)),
    (f(47.8), f(51.4), "pullback", dict(t0=11300, t1=11800)),
    (f(51.4), f(A1), "grid", dict(t0=11800, t1=14800)),
    (f(B0), f(120.35), "twin", dict(t0=9500, t1=12500)),
    (f(120.35), f(127.9), "world", dict(tape="s3", t0=13000, t1=15000, gaze=1)),
    (f(127.9), f(131.7), "lens", dict(tape="s3", t0=15000, t1=15300, dark=1)),
    (f(131.7), DUR, "world", dict(tape="s3", t0=15000, t1=24000, gaze=0)),
]
GRID = [("s3", 0, 0), ("s1", 1, 0), ("s2", 0, 1), ("s4", 1, 1)]


def scene_at(t):
    for sc in S:
        if sc[0] <= t < sc[1]:
            return sc
    return S[-1]


def idx_of(p, u):
    return int(round(lerp(p["t0"], p["t1"], u) / 6))


def needs(n):
    """which tape frames output frame n reads: [(tape, idx)]"""
    t = n / FPS
    a, b, kind, p = scene_at(t)
    u = (t - a) / (b - a)
    if kind == "portrait_in":
        return [("s3", idx_of(dict(t0=0, t1=3000), u))]
    if kind in ("world", "lens"):
        return [(p["tape"], idx_of(p, u))]
    if kind in ("pullback", "grid"):
        return [(g, idx_of(p, u)) for g, _, _ in GRID]
    if kind == "twin":
        return [("s3", idx_of(p, u)), ("blind", idx_of(p, u))]
    return []


def extract(want):
    """decode each tape once, keep the frames asked for as JPEGs in the cache"""
    os.makedirs(CACHE, exist_ok=True)
    for tape, idxs in want.items():
        idxs = sorted(set(idxs))
        todo = [i for i in idxs if not os.path.exists(f"{CACHE}/{tape}-{i}.jpg")]
        if not todo:
            continue
        need = set(todo)
        p = subprocess.Popen([F, "-loglevel", "error", "-i", TAPES[tape] + "/tape.mp4", "-f", "rawvideo", "-pix_fmt", "rgb24",
                              "-"], stdout=subprocess.PIPE)
        i = 0
        while i <= max(need):
            raw = p.stdout.read(W * H * 3)
            if len(raw) < W * H * 3:
                break
            if i in need:
                Image.frombytes("RGB", (W, H), raw).save(f"{CACHE}/{tape}-{i}.jpg", quality=94)
            i += 1
        p.kill()
        print(f"extracted {len(todo)} from {tape}", flush=True)


def frame(tape, i):
    try:
        return Image.open(f"{CACHE}/{tape}-{i}.jpg").convert("RGB")
    except FileNotFoundError:   # past the tape's end: hold the last
        return frame(tape, i - 1)


# ---------------------------------------------------------------- drawing
def gaze_overlay(im, gaze, scale=1.0, ox=0, oy=0, glow=1.0):
    gx, gy, r = (704 * 0.35) * scale + ox, (1280 * 0.4) * scale + oy, 220 * scale
    if gaze and glow > 0:
        a = np.asarray(im, np.float32)
        yy, xx = np.mgrid[0:im.height, 0:im.width]
        d = np.sqrt((xx - gx) ** 2 + (yy - gy) ** 2) / r
        g = np.clip(1 - d, 0, 1) ** 1.6 * 0.22 * glow
        a = a + g[..., None] * np.array(WARM, np.float32) * 0.9
        im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(im)
    col = tuple(int(c * (0.55 if gaze else 0.35)) for c in (WARM if gaze else PALE))
    steps = 72
    for k in range(steps):
        if not gaze and k % 2:
            continue   # after he has gone: a dashed circle where he looked
        a0, a1 = 2 * np.pi * k / steps, 2 * np.pi * (k + 1) / steps
        d.line([(gx + r * np.cos(a0), gy + r * np.sin(a0)), (gx + r * np.cos(a1), gy + r * np.sin(a1))], fill=col, width=2)
    return im


def counter(d, x, y, rec, gaze, al=1.0, big=True):
    lab = "under his gaze" if gaze else "where he looked"
    d.text((x, y), lab, font=SMALL if not big else MONO, fill=tuple(int(c * al) for c in DIM))
    d.text((x, y + (28 if big else 22)), f"{rec['near']} of {rec['a']}", font=MONOB if big else MONO,
           fill=tuple(int(c * al) for c in (WARM if gaze else PALE)))


class Portrait:
    def __init__(self):
        self.img = Image.open("out/inputs/goggles.jpg").convert("RGB")
        self.mask = Image.open("out/inputs/goggles.lens.png").convert("L")
        bg = self.img.resize((W, H), Image.BILINEAR).filter(ImageFilter.GaussianBlur(40))
        self.bg = Image.fromarray((np.asarray(bg, np.float32) * 0.45).astype(np.uint8))
        x0, y0, x1, y1 = LENS_BOX
        self.glass = np.asarray(self.img.crop(LENS_BOX), np.float32)
        self.m = np.asarray(self.mask.crop(LENS_BOX), np.float32)[..., None] / 255

    def with_world(self, world, dark):
        """the world he watches, reflected in his glass (mirrored, the glass's own highlights kept on top)"""
        x0, y0, x1, y1 = LENS_BOX
        bw, bh = x1 - x0, y1 - y0
        gy = int(1280 * 0.4)
        ch = int(704 * bh / bw)
        crop = world.crop((0, max(0, gy - ch // 2), 704, max(0, gy - ch // 2) + ch)).transpose(Image.FLIP_LEFT_RIGHT)
        refl = np.asarray(crop.resize((bw, bh), Image.LANCZOS), np.float32)
        lum = self.glass.mean(axis=2, keepdims=True)
        hi = np.clip(lum - 90, 0, 255) * 0.9                     # the painted sheen
        inside = refl * 1.25 * (1 - dark) + self.glass * 0.25 + hi
        comp = self.glass * (1 - self.m) + np.clip(inside, 0, 255) * self.m
        out = self.img.copy()
        out.paste(Image.fromarray(comp.astype(np.uint8)), (x0, y0))
        return out

    def view(self, im, cx, cy, s):
        """camera: centre (cx, cy) in painting pixels, s output px per painting px; outside the painting is its blur"""
        x0, y0 = cx - W / s / 2, cy - H / s / 2
        ix0, iy0 = max(0, x0), max(0, y0)
        ix1, iy1 = min(2000, x0 + W / s), min(1767, y0 + H / s)
        v = self.bg.copy()
        ox, oy = int(round((ix0 - x0) * s)), int(round((iy0 - y0) * s))
        tw, th = int(round((ix1 - ix0) * s)), int(round((iy1 - iy0) * s))
        v.paste(im.resize((tw, th), Image.LANCZOS, box=(ix0, iy0, ix1, iy1)), (ox, oy))
        return v


def main():
    logs = {k: json.load(open(v + "/log.json"))["log"] for k, v in TAPES.items()}
    nF = int(DUR * FPS)
    want = {}
    for n in range(nF):
        for tape, i in needs(n):
            want.setdefault(tape, []).append(min(i, len(logs[tape]) - 1))
    extract(want)
    avgw = {k: sum(r["near"] / r["a"] for r in L[833:2500]) / 1667 for k, L in logs.items()}   # ticks 5k-15k
    print("watched 5k-15k:", {k: round(v, 3) for k, v in avgw.items()}, flush=True)
    P = Portrait()
    LC = ((LENS_BOX[0] + LENS_BOX[2]) / 2, (LENS_BOX[1] + LENS_BOX[3]) / 2)
    out = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                            str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p",
                            "out/drawn/the-observer.mp4"], stdin=subprocess.PIPE)
    rng = np.random.default_rng(7)
    story = {"captions": []}
    for n in range(nF):
        t = n / FPS
        a, b, kind, p = scene_at(t)
        u = (t - a) / (b - a)
        need = [(tp, min(i, len(logs[tp]) - 1)) for tp, i in needs(n)]
        if kind == "portrait_in":
            w_ = frame(*need[0])
            por = P.with_world(w_, 0)
            k = ease(u) ** 1.7
            s = lerp(704 / 2000, 2.4, k)
            cx, cy = lerp(1000, LC[0], ease(u * 1.3)), lerp(883, LC[1], ease(u * 1.3))
            im = P.view(por, cx, cy, s)
            if u > 0.9:   # through the glass
                im = Image.blend(im, gaze_overlay(w_, 1), ease((u - 0.9) / 0.1))
        elif kind == "lens":
            tp, i = need[0]
            dark = ease(u / 0.45) if p["dark"] else 0
            por = P.with_world(frame(tp, i), dark)
            s = lerp(1.25, 1.4, u)
            im = P.view(por, LC[0] - 60, LC[1] + 60, s)
        elif kind == "world":
            tp, i = need[0]
            rec = logs[tp][i]
            im = gaze_overlay(frame(tp, i), p["gaze"])
            d = ImageDraw.Draw(im)
            counter(d, 40, H - 170, rec, p["gaze"])
            if not p["gaze"]:
                d.text((40, H - 206), f"tick {rec['tick']:,}", font=SMALL, fill=DIM)
            if not p["gaze"] and t >= f(139.0):
                al = ease((t - f(139.0)) / 0.8)
                d.text((40, 120), "he looked away.", font=MONO, fill=tuple(int(c * al) for c in PALE))
                d.text((40, 156), "they stayed.", font=MONO, fill=tuple(int(c * al) for c in PALE))
        elif kind in ("pullback", "grid"):
            k = ease(u) if kind == "pullback" else 1.0
            im = Image.new("RGB", (W, H), (0, 0, 0))
            d = ImageDraw.Draw(im)
            pw, ph = W // 2, H // 2
            for tp, gx_, gy_ in GRID:
                i = min(idx_of(p, u), len(logs[tp]) - 1)
                rec = logs[tp][i]
                fr = gaze_overlay(frame(tp, i), 1)
                if tp == "s3":
                    sw, sh = int(lerp(W, pw, k)), int(lerp(H, ph, k))
                    im.paste(fr.resize((sw, sh), Image.LANCZOS), (0, 0))
                else:
                    if k <= 0.02:
                        continue
                    sm = fr.resize((pw, ph), Image.LANCZOS)
                    sm = Image.fromarray((np.asarray(sm, np.float32) * k).astype(np.uint8))
                    im.paste(sm, (gx_ * pw, gy_ * ph))
                if kind == "grid":
                    counter(d, gx_ * pw + 16, gy_ * ph + ph - 70, rec, 1, big=False)
                    if t >= f(58.9):
                        al = ease((t - f(58.9)) / 0.6)
                        lab = "gathered" if avgw[tp] > 0.3 else "didn't"   # over the whole watched stretch, not one frame
                        d.text((gx_ * pw + 16, gy_ * ph + 16), lab, font=MONO,
                               fill=tuple(int(c * al) for c in (WARM if lab == "gathered" else PALE)))
            if kind == "grid" and t >= f(61.9):
                al = ease((t - f(61.9)) / 0.5)
                s_ = "one in four"
                bw = d.textlength(s_, font=MONOB)
                d.rectangle([W / 2 - bw / 2 - 18, H / 2 - 36, W / 2 + bw / 2 + 18, H / 2 + 36], fill=(0, 0, 0))
                d.text((W / 2 - bw / 2, H / 2 - 26), s_, font=MONOB, fill=tuple(int(c * al) for c in PALE))
        elif kind == "twin":
            im = Image.new("RGB", (W, H), (0, 0, 0))
            d = ImageDraw.Draw(im)
            pw, ph = W // 2, H // 2
            for j, (tp, lab, gz) in enumerate((("s3", "watched", 1), ("blind", "never watched", 0))):
                i = min(idx_of(p, u), len(logs[tp]) - 1)
                rec = logs[tp][i]
                fr = frame(tp, i)
                fr = gaze_overlay(fr, 1) if gz else gaze_overlay(fr, 0)
                im.paste(fr.resize((pw, ph), Image.LANCZOS), (j * pw, H // 4))
                d.text((j * pw + 16, H // 4 - 64), "world 3", font=SMALL, fill=DIM)
                d.text((j * pw + 16, H // 4 - 38), lab, font=MONO, fill=WARM if gz else PALE)
                d.text((j * pw + 16, 3 * H // 4 + 18), "in that circle", font=SMALL, fill=DIM)
                d.text((j * pw + 16, 3 * H // 4 + 42), f"{rec['near']} of {rec['a']}", font=MONO, fill=WARM if gz else PALE)
            if t >= f(115.3):
                al = ease((t - f(115.3)) / 0.7)
                s_ = "it gathers there anyway."
                d.text((W / 2 - d.textlength(s_, font=MONO) / 2, 3 * H // 4 + 120), s_, font=MONO,
                       fill=tuple(int(c * al) for c in PALE))
        # fades: in from black, out at the end
        g = ease(t / 1.2) * (1 - ease((t - (DUR - 1.6)) / 1.5))
        arr = np.asarray(im, np.float32) * g + rng.normal(0, 2.5, (H, W, 1))
        out.stdin.write(np.clip(arr, 0, 255).astype(np.uint8).tobytes())
        if n % 240 == 0:
            print(f"{t:5.1f}s {kind}", flush=True)
    out.stdin.close()
    out.wait()
    summ = {}
    for k, L in logs.items():
        fr = [r["near"] / r["a"] for r in L]
        summ[k] = {"watched_0_15k": round(sum(fr[:2500]) / 2500, 3), "after_15k": round(sum(fr[2500:]) / max(1, len(fr) - 2500), 3)}
    json.dump({"title": "The Observer", "song": "out/songs/no-more-ground.mp3", "parts": [[A0, A1], [B0, B1]],
               "gaze": "attention input at (0.35W, 0.4H), radius 220 counted", "fraction_in_circle": summ, "scenes": S},
              open("video/stories/the-observer.json", "w"), indent=1)


if __name__ == "__main__":
    main()
