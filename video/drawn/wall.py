"""A wall of screens, drawn frame by frame: every pane is a clip, and the panes themselves move, flip, crack, fall,
form shapes and rise. The renderer behind 'Breaking the Frame'. Local and free.

A film is a function script(t) -> list of ops, drawn in order onto a black 704x1280 canvas:
  ("hero", src, alpha, look)                         a clip filling the screen
  ("tile", src, x, y, w, h, dict(rot, alpha, look, glitch, border, flip))   one pane (x, y = centre, pixels)
  ("cracks", key, x, y, reach, front)                 broken glass spreading from (x, y) out to `front` pixels
  ("feedback", x, y, w, h)                            the previous output frame, shrunk into a pane (a loop)
  ("fade", colour, a)                                 a full-screen wash (black-out, white-out)
  ("crt", level)                                      old-screen switch-off: the picture squeezes to a line, then a dot
"""
import math
import subprocess
import sys

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from stills import crack_tree  # noqa: E402

F = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 704, 1280, 24
GOLD = (236, 190, 70)


class Stream:
    """One clip decoded at a fixed size, looped; advances one frame per output frame in which it is used."""

    def __init__(self, path, w, h, start=0.0):
        self.path, self.w, self.h, self.start = path, w, h, start
        self.proc, self.img, self.at = None, None, -1

    def _open(self, ss):
        self.proc = subprocess.Popen([F, "-loglevel", "error", "-ss", f"{ss:.2f}", "-stream_loop", "-1", "-i", self.path,
                                      "-vf", f"scale={self.w}:{self.h}:force_original_aspect_ratio=increase,"
                                             f"crop={self.w}:{self.h},fps={FPS}",
                                      "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)

    def get(self, n):
        if self.at == n:
            return self.img
        if self.path.lower().endswith((".jpg", ".jpeg", ".png")):  # a still: ffmpeg would hang looping it
            if self.img is None:
                self.img = cover(Image.open(self.path).convert("RGB"), self.w, self.h)
            self.at = n
            return self.img
        if self.proc is None:
            self._open(self.start)
        raw = self.proc.stdout.read(self.w * self.h * 3)
        if len(raw) < self.w * self.h * 3:
            self.close()
            self._open(0)
            raw = self.proc.stdout.read(self.w * self.h * 3)
        self.img, self.at = Image.frombytes("RGB", (self.w, self.h), raw), n
        return self.img

    def close(self):
        if self.proc:
            self.proc.kill()
            self.proc.wait()
            self.proc = None


class Pool:
    def __init__(self):
        self.s = {}
        self.used = {}

    def get(self, src, size, n):
        path, start = (src.split("@") + ["0"])[:2]
        key = (src, size)
        if key not in self.s:
            self.s[key] = Stream(path, size[0], size[1], float(start))
        self.used[key] = n
        return self.s[key].get(n)

    def tidy(self, n):
        for k in [k for k, v in self.used.items() if n - v > FPS * 4]:
            self.s.pop(k).close()
            self.used.pop(k)


def look(im, name):
    if not name or name == "full":
        return im
    a = np.asarray(im, float)
    if name == "mono":
        g = a @ [0.3, 0.59, 0.11]
        a = np.stack([g * 1.02, g, g * 0.95], -1)
    elif name == "hot":
        g = a @ [0.3, 0.59, 0.11]
        a = np.stack([np.clip(g * 1.5, 0, 255), g * 0.85, g * 0.3], -1)
    elif name == "cold":
        g = a @ [0.3, 0.59, 0.11]
        a = np.stack([g * 0.55, g * 0.95, np.clip(g * 1.35, 0, 255)], -1)
    elif name == "pixel":
        small = im.resize((max(1, im.width // 14), max(1, im.height // 14)), Image.BILINEAR)
        return small.resize(im.size, Image.NEAREST)
    elif name == "white":
        a = a * 0.25 + 255 * 0.75
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def glitch(im, amount, rng):
    """Slices of the picture slide sideways and the colour channels part."""
    if amount <= 0:
        return im
    a = np.asarray(im).copy()
    h = a.shape[0]
    for _ in range(int(2 + 6 * amount)):
        y0 = rng.integers(0, h)
        y1 = min(h, y0 + rng.integers(2, max(3, h // 8)))
        a[y0:y1] = np.roll(a[y0:y1], int(rng.normal(0, 30 * amount)), axis=1)
    sh = int(6 * amount) + 1
    a[..., 0] = np.roll(a[..., 0], sh, axis=1)
    a[..., 2] = np.roll(a[..., 2], -sh, axis=1)
    return Image.fromarray(a)


def cover(img, w, h):
    iw, ih = img.size
    s = max(w / iw, h / ih)
    cw, ch = min(w / s, iw), min(h / s, ih)
    return img.resize((max(1, int(w)), max(1, int(h))), Image.BILINEAR,
                      box=(max(0.0, (iw - cw) / 2), max(0.0, (ih - ch) / 2), min(iw, (iw + cw) / 2), min(ih, (ih + ch) / 2)))


def render(script, out, dur, seed=5):
    pool = Pool()
    rng = np.random.default_rng(seed)
    trees = {}
    prev = Image.new("RGB", (W, H))
    p = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                          str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", out],
                         stdin=subprocess.PIPE)
    for n in range(int(dur * FPS)):
        t = n / FPS
        canvas = Image.new("RGB", (W, H), (0, 0, 0))
        for op in script(t):
            kind = op[0]
            if kind == "hero":
                _, src, alpha, lk = op
                im = look(pool.get(src, (W, H), n), lk)
                canvas = im if alpha >= 1 else Image.blend(canvas, im, alpha)
            elif kind == "tile":
                _, src, x, y, w, h, o = op
                if w < 2 or h < 2 or o.get("alpha", 1) <= 0:
                    continue
                flip = o.get("flip", 1.0)  # card flip: width squeezes to 0 and back
                w_draw = max(2, w * abs(flip))
                size = (264, 480) if max(w, h) < 480 else (W, H)
                im = cover(pool.get(src, size, n), w_draw, h)
                im = look(im, o.get("look"))
                im = glitch(im, o.get("glitch", 0), rng)
                if o.get("border", True):
                    d = ImageDraw.Draw(im)
                    bw = max(1, int(min(w_draw, h) / 90))
                    d.rectangle([0, 0, im.width - 1, im.height - 1], outline=o.get("border_colour", GOLD), width=bw)
                im = im.convert("RGBA")
                if o.get("rot"):
                    im = im.rotate(o["rot"], resample=Image.BILINEAR, expand=True)
                if o.get("alpha", 1) < 1:
                    im.putalpha(im.getchannel("A").point(lambda v, a=o["alpha"]: int(v * a)))
                canvas.paste(im, (int(x - im.width / 2), int(y - im.height / 2)), im)
            elif kind == "cracks":
                _, key, cx, cy, reach, front = op
                if key not in trees:
                    trees[key] = crack_tree(cx, cy, hash(key) % 1000, reach)
                d = ImageDraw.Draw(canvas)
                for x0, y0, x1, y1, dist in trees[key]:
                    if dist <= front:
                        d.line([(x0 + 1, y0 + 1), (x1 + 1, y1 + 1)], fill=(240, 240, 240), width=1)
                        d.line([(x0, y0), (x1, y1)], fill=(10, 10, 10), width=3)
            elif kind == "feedback":
                _, x, y, w, h = op
                im = prev.resize((int(w), int(h)), Image.BILINEAR)
                ImageDraw.Draw(im).rectangle([0, 0, im.width - 1, im.height - 1], outline=GOLD, width=2)
                canvas.paste(im, (int(x - w / 2), int(y - h / 2)))
            elif kind == "fade":
                _, col, a = op
                if a > 0:
                    canvas = Image.blend(canvas, Image.new("RGB", (W, H), col), min(a, 1))
            elif kind == "crt":
                lv = op[1]  # 0 = picture, 1 = gone
                if lv > 0:
                    sy = max(0.004, 1 - min(lv / 0.6, 1))
                    sx = 1.0 if lv < 0.6 else max(0.01, 1 - (lv - 0.6) / 0.4)
                    small = canvas.resize((max(1, int(W * sx)), max(1, int(H * sy))), Image.BILINEAR)
                    small = Image.eval(small, lambda v: min(255, int(v * (1 + 2 * lv))))
                    c2 = Image.new("RGB", (W, H))
                    c2.paste(small, ((W - small.width) // 2, (H - small.height) // 2))
                    canvas = c2
        prev = canvas
        p.stdin.write(canvas.tobytes())
        if n % (FPS * 10) == 0:
            pool.tidy(n)
            print(f"{t:6.1f}s", flush=True)
    p.stdin.close()
    p.wait()
    for s in pool.s.values():
        s.close()


# ---- layouts --------------------------------------------------------------------------------------------------------

def grid(cols, rows, gap=6, top=0, bottom=0):
    """Pane centres and sizes for a cols x rows wall filling the frame."""
    hh = H - top - bottom
    w, h = (W - gap * (cols + 1)) / cols, (hh - gap * (rows + 1)) / rows
    return [(gap + w / 2 + c * (w + gap), top + gap + h / 2 + r * (h + gap), w, h) for r in range(rows) for c in range(cols)]


def heart(n, size=560, cx=W / 2, cy=H * 0.45, tile=64):
    """n pane positions tracing and filling a heart."""
    pts = []
    for k in range(n):
        a = 2 * math.pi * k / n
        x = 16 * math.sin(a) ** 3
        y = -(13 * math.cos(a) - 5 * math.cos(2 * a) - 2 * math.cos(3 * a) - math.cos(4 * a))
        pts.append((cx + x * size / 34, cy + y * size / 34, tile, tile))
    return pts


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def lerp(a, b, u):
    return a + (b - a) * u
