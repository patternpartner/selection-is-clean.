"""'Faces in the Particles': a stock face detector (OpenCV's Haar frontal-face cascade, video/find_faces.py) run over
eleven minutes of the real Selection universe and field. It 'found' 3,475 faces. Not one looks like a face to a person.
Then it was run over our figure - the one with two points of light, in every episode we have - and found none.
  'a shadow stretches tall and wide / there is no safer place to hide': the universe, and the detector's box searching
  'it watches while he slowly breathes': the first hit - freeze, lock, its own confidence score
  'a quiet web it starts to weave': hit after hit, each flown to a wall and joined to the last by a green thread
  'so hold your breath and count to ten': the count reaches ten exactly on 'ten'...
  ...and then races to the real total, 3,475
  'it will not let you leave again': the wall of faces that are not there - then black, our figure's two points of
  light, the same box searching it: FACES 0.
Song: horror-movie-style-eerie-hau 37.3-76.6.
    python3 video/build_faces_in_the_particles.py   (needs out/faces.json and out/faces-top.json from find_faces.py)
"""
import json
import math
import subprocess

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFont

F = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 704, 1280, 24
SONG = "out/songs/horror-movie-style-eerie-hau.mp3"
S0, S1 = 37.3, 76.6
DUR = S1 - S0
MONO = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 24)
BIG = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf", 40)
GREEN = (120, 240, 150)
COLS, ROWS = 5, 6
GW, GH = W // COLS, (H - 120) // ROWS


def f(s):
    return s - S0


T = dict(shadow=f(38.9), hide=f(47.8), watches=f(51.2), web=f(57.06), hold=f(63.5), ten=f(67.06), leave=f(69.96),
         again=f(73.3), end=DUR)  # 'again' ends ~73.8; the next 'It' is 76.9


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def grab(video, t, size=(W, H)):
    raw = subprocess.run([F, "-loglevel", "error", "-ss", f"{t:.2f}", "-i", video, "-frames:v", "1", "-vf",
                          f"scale={size[0]}:{size[1]}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
    return Image.frombytes("RGB", size, raw)


class Reader:
    def __init__(self, path, start, speed):
        self.p = subprocess.Popen([F, "-loglevel", "error", "-ss", f"{start:.2f}", "-i", path, "-vf",
                                   f"setpts=(PTS-STARTPTS)/{speed},fps={FPS},scale={W}:{H}", "-f", "rawvideo",
                                   "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
        self.last = Image.new("RGB", (W, H))

    def next(self):
        raw = self.p.stdout.read(W * H * 3)
        if len(raw) == W * H * 3:
            self.last = Image.frombytes("RGB", (W, H), raw)
        return self.last


def main():
    allhits = json.load(open("out/faces.json"))
    top = json.load(open("out/faces-top.json"))
    total = len(allhits)
    frames = [grab(r["video"], r["t"]) for r in top]
    boxes = [tuple(v * 2 for v in (r["x"], r["y"], r["w"], r["h"])) for r in top]
    thumbs = []
    for im, (x, y, w, h) in zip(frames, boxes):
        pad = w * 0.35
        thumbs.append(im.crop((x - pad, y - pad, x + w + pad, y + h + pad)).resize((GW - 8, GH - 8), Image.LANCZOS))
    figure = grab("out/before-the-proof.mp4", 50.0)  # our figure, its two points of light, in the dark
    slots = [(c * GW + 4, 120 + r * GH + 4) for r in range(ROWS) for c in range(COLS)]
    hit_t = [T["watches"] + k * (T["ten"] - T["watches"]) / 9 for k in range(10)]  # the tenth lands on 'ten'
    fill_t = [T["ten"] + 0.3 + k * (T["leave"] - T["ten"] - 0.3) / 20 for k in range(20)]  # then the other twenty
    live = Reader("out/universe-run1/run1.webm", 250.0, 0.6)
    rng = np.random.default_rng(3)
    p = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                          str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p",
                          "out/drawn/faces-in-the-particles.mp4"], stdin=subprocess.PIPE)
    for n in range(int(DUR * FPS)):
        t = n / FPS
        black = t >= T["again"] - 0.4
        if black:
            # our figure: the same box searches it, and finds nothing
            im = figure.copy()
            d = ImageDraw.Draw(im)
            u = (t - T["again"] + 0.4) / 2.0
            sx = 60 + (W - 200) * (0.5 + 0.5 * math.sin(u * 5))
            sy = 380 + 300 * (0.5 + 0.5 * math.sin(u * 3.1 + 1))
            if u < 0.9:
                d.rectangle([sx, sy, sx + 140, sy + 140], outline=GREEN, width=2)
            d.rectangle([0, 0, W, 60], fill=(0, 0, 0))
            d.text((20, 14), "SEARCHING FOR FACES", font=MONO, fill=GREEN)
            if u > 0.95:
                d.text((20, 70), "FACES  0", font=BIG, fill=GREEN)
            a = np.asarray(im, np.float32) * min(1.0, (t - T["again"] + 0.4) / 0.5)
            p.stdin.write(np.clip(a + rng.normal(0, 3, (H, W, 1)), 0, 255).astype(np.uint8).tobytes())
            continue
        # which hit are we on?
        k = max([i for i, h in enumerate(hit_t) if t >= h], default=-1)
        im = None
        d = None
        if k < 0:
            im = live.next()
            im = Image.fromarray((np.asarray(im, np.float32) * 0.75).astype(np.uint8))
            d = ImageDraw.Draw(im)
            u = t * 0.9
            sx = 40 + (W - 220) * (0.5 + 0.5 * math.sin(u * 1.7))
            sy = 160 + (H - 420) * (0.5 + 0.5 * math.sin(u * 0.9 + 2))
            if t > T["shadow"] - 0.5:
                d.rectangle([sx, sy, sx + 150, sy + 150], outline=GREEN, width=2)
        else:
            age = t - hit_t[k]
            span = (hit_t[k + 1] - hit_t[k]) if k < 9 else 1.8
            im = frames[k].copy()
            x, y, w, h = boxes[k]
            z = 1 + 1.6 * ease((age - 0.25) / (span * 0.55))
            if z > 1.001:
                cx, cy = x + w / 2, y + h / 2
                cw, ch = W / z, H / z
                x0, y0 = min(max(cx - cw / 2, 0), W - cw), min(max(cy - ch / 2, 0), H - ch)
                im = im.resize((W, H), Image.LANCZOS, box=(x0, y0, x0 + cw, y0 + ch))
                x, y, w, h = (x - x0) * z, (y - y0) * z, w * z, h * z
            d = ImageDraw.Draw(im)
            flash = max(0.0, 1 - age / 0.25)
            d.rectangle([x, y, x + w, y + h], outline=GREEN, width=4)
            d.text((x, y - 34), f"FACE  {top[k]['score']:.1f}", font=MONO, fill=GREEN)
            if flash > 0:
                im = Image.blend(im, Image.new("RGB", (W, H), (200, 255, 210)), flash * 0.4)
                d = ImageDraw.Draw(im)
        # the wall: every face found so far, joined by a green thread
        shown = [i for i, h in enumerate(hit_t) if t >= h + 1.0] + [10 + i for i, h in enumerate(fill_t) if t >= h]
        wall = ease((t - T["web"]) / 1.0)
        if shown and wall > 0:
            a = 0.35 + 0.65 * ease((t - T["ten"]) / 1.5)
            base = np.asarray(im, np.float32) * (1 - 0.6 * ease((t - T["ten"]) / 1.5))
            im = Image.fromarray(base.astype(np.uint8))
            d = ImageDraw.Draw(im)
            prev = None
            for i in shown:
                sx, sy = slots[i]
                th = Image.fromarray((np.asarray(thumbs[i], np.float32) * a).astype(np.uint8))
                im.paste(th, (sx, sy))
                d.rectangle([sx, sy, sx + GW - 9, sy + GH - 9], outline=GREEN, width=1)
                c = (sx + (GW - 8) / 2, sy + (GH - 8) / 2)
                if prev is not None:
                    d.line([prev, c], fill=GREEN, width=1)
                prev = c
        # the count
        d.rectangle([0, 0, W, 60], fill=(0, 0, 0))
        d.text((20, 14), "SEARCHING FOR FACES", font=MONO, fill=GREEN)
        found = max(0, k + 1)
        if t >= T["ten"] + 0.8:  # then the real total
            found = int(10 + (total - 10) * ease((t - T["ten"] - 0.8) / 2.2))
        if found:
            d.text((20, 70), f"FACES  {found:,}", font=BIG, fill=GREEN)
        a = np.asarray(im, np.float32) + rng.normal(0, 3, (H, W, 1))
        p.stdin.write(np.clip(a, 0, 255).astype(np.uint8).tobytes())
    p.stdin.close()
    p.wait()
    json.dump({"title": "Faces in the Particles", "song": SONG, "song_parts": [[S0, S1]], "detector":
               "OpenCV 4 haarcascade_frontalface_default, scaleFactor 1.1, minNeighbors 4, minSize 60 (at 2x)",
               "footage": ["universe-run1 (396 s)", "field-run1 (295 s)"], "frames_scanned_every": 0.25,
               "faces_found": total, "faces_found_in_our_figure": 0, "times": T},
              open("video/stories/faces-in-the-particles.json", "w"), indent=1)


if __name__ == "__main__":
    main()
