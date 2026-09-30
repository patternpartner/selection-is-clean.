"""'Glass' (Gravity and Glass 133.0-158.0 + the end line, ~29 s). One idea, no captions.
A bell jar on a dark table. We have talked at it so long our breath has fogged the glass white - the fog grows with
the singer's real voice (the demucs vocal stem's loudness, frame by frame). 'It's quiet now': no more breath, the fog
starts to thin. 'Go on': the song's eight seconds of true silence, kept whole. In it a fingertip on the INSIDE of the
glass wipes a small circle to look out, and drips run down from it. 'It was always your turn': through that small
window is what was in there all along - not a small thing, a whole living world (the real universe, recorded by
video/your_turn.js) - and the camera goes through the glass into it.
    python3 video/build_glass.py     (writes out/drawn/glass.mp4, video only)
"""
import json
import math
import subprocess

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

F = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 704, 1280, 24
S0, S1 = 133.0, 158.0
DUR = S1 - S0
QUIET, GO_ON, SILENT, TURN, TURN_END = 138.5, 144.0, 145.0, 153.6, 157.4
WIPE0, WIPE1 = 146.2, 151.8
# the jar: a dome over a wooden base (1x coordinates)
JX0, JX1, JTOP, JBOT = 150, 554, 330, 1010
CX, CY = 452, 890                      # where the window gets wiped: low, at its own height, over the busiest part of the world
WORLD_T0 = 96.0                        # which stretch of the recorded world lives in the jar
CROP = (320, 640, 380, 639)            # ...and which part of it: where its life is (brightest window over those seconds)


def f(song):
    return song - S0


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def jar_mask():
    m = Image.new("L", (W * 2, H * 2), 0)
    d = ImageDraw.Draw(m)
    r = (JX1 - JX0)
    d.rectangle([JX0 * 2, (JTOP + r / 2) * 2, JX1 * 2, JBOT * 2], fill=255)
    d.ellipse([JX0 * 2, JTOP * 2, JX1 * 2, (JTOP + r) * 2], fill=255)
    return np.asarray(m.resize((W, H), Image.LANCZOS), np.float32) / 255


def room():
    """the dark room, the lamp from the left, the table, the jar's base - drawn once at 2x"""
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    lamp = np.exp(-(((xx + 120) / 700) ** 2 + ((yy - 300) / 700) ** 2))
    a = np.zeros((H, W, 3), np.float32) + np.array([10, 9, 12], np.float32)
    a += lamp[..., None] * np.array([70, 52, 34], np.float32)
    table = yy > 1000
    a[table] = a[table] * 0.55 + np.array([30, 20, 14], np.float32) * (1 - (yy[table] - 1000) / 400)[..., None]
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).resize((W * 2, H * 2), Image.BICUBIC)
    d = ImageDraw.Draw(im)
    d.ellipse([(JX0 - 26) * 2, 990 * 2, (JX1 + 26) * 2, 1062 * 2], fill=(46, 30, 20))      # the wooden base
    d.ellipse([(JX0 - 26) * 2, 984 * 2, (JX1 + 26) * 2, 1040 * 2], fill=(74, 50, 32))
    d.ellipse([(JX0 - 8) * 2, 996 * 2, (JX1 + 8) * 2, 1026 * 2], fill=(20, 14, 12))
    return np.asarray(im.resize((W, H), Image.LANCZOS), np.float32)


def glass_lines():
    """the glass's own edges and a long highlight, as an additive layer"""
    im = Image.new("RGB", (W * 2, H * 2), 0)
    d = ImageDraw.Draw(im)
    r = (JX1 - JX0)
    box = [JX0 * 2, JTOP * 2, JX1 * 2, (JTOP + r) * 2]
    d.arc(box, 180, 360, fill=(120, 110, 95), width=5)
    d.line([JX0 * 2, (JTOP + r / 2) * 2, JX0 * 2, JBOT * 2], fill=(110, 100, 88), width=5)
    d.line([JX1 * 2, (JTOP + r / 2) * 2, JX1 * 2, JBOT * 2], fill=(60, 56, 52), width=5)
    d.line([(JX0 + 34) * 2, (JTOP + 190) * 2, (JX0 + 34) * 2, (JBOT - 60) * 2], fill=(150, 140, 120), width=10)
    d.arc([(JX0 + 30) * 2, (JTOP + 28) * 2, (JX1 - 30) * 2, (JTOP + r - 28) * 2], 200, 250, fill=(160, 150, 130), width=8)
    im = im.filter(ImageFilter.GaussianBlur(5))
    return np.asarray(im.resize((W, H), Image.LANCZOS), np.float32)


def gauss(cx, cy, r):
    x0, x1, y0, y1 = int(max(0, cx - 3 * r)), int(min(W, cx + 3 * r)), int(max(0, cy - 3 * r)), int(min(H, cy + 3 * r))
    yy, xx = np.mgrid[y0:y1, x0:x1]
    return (slice(y0, y1), slice(x0, x1)), np.exp(-((xx - cx) ** 2 + (yy - cy) ** 2) / (2 * r * r)).astype(np.float32)


class World:
    def __init__(self):
        self.p = subprocess.Popen([F, "-loglevel", "error", "-ss", str(WORLD_T0), "-i", "out/your-turn/world.mp4", "-f",
                                   "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
        self.last = np.zeros((H, W, 3), np.uint8)

    def next(self):
        raw = self.p.stdout.read(W * H * 3)
        if len(raw) == W * H * 3:
            self.last = np.frombuffer(raw, np.uint8).reshape(H, W, 3)
        return self.last


def main():
    rms = json.load(open("video/stories/gravity-and-glass-vocal-rms.json"))["rms"]
    mask = jar_mask()
    base = room()
    lines = glass_lines()
    rng = np.random.default_rng(3)
    # fog texture: breath never lies flat
    tex = np.asarray(Image.fromarray((rng.random((H // 8, W // 8)) * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC)
                     .filter(ImageFilter.GaussianBlur(6)), np.float32) / 255
    fog = (0.5 + 0.25 * tex) * mask
    x0, x1 = JX0, JX1
    y0, y1 = JTOP, JBOT
    jw, jh = x1 - x0, y1 - y0
    drips = []   # [x, y, speed, len]
    world = World()
    out = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                            str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", "out/drawn/glass.mp4"],
                           stdin=subprocess.PIPE)
    tip = None
    for n in range(int(DUR * FPS)):
        t = n / FPS
        s = S0 + t
        # --- breath: each loud moment of the voice fogs the glass a little more, around where a mouth would be
        v = rms[min(len(rms) - 1, int(s * FPS))]
        if s < QUIET and v > 0.02:
            for _ in range(2):
                bx, by = CX + rng.normal(0, 90), 640 + rng.normal(0, 150)
                sl, g = gauss(bx, by, 70 + rng.random() * 60)
                fog[sl] += g * v * 0.9 * (1 - fog[sl]) * mask[sl]
        # --- quiet: nobody breathing on it, the fog thins from the edges in
        if s >= QUIET:
            fog *= 1 - 0.0009 * (1.0 + 0.6 * (1 - tex))
        # --- the wipe, from inside: a fingertip circling outward from the middle
        if WIPE0 <= s < WIPE1:
            u = (s - WIPE0) / (WIPE1 - WIPE0)
            for k in range(3):
                uu = u + k / (3 * FPS * (WIPE1 - WIPE0))
                ang = uu * 2 * math.pi * 3.2
                rad = 6 + 58 * ease(uu * 1.05)
                tip = (CX + rad * math.cos(ang), CY + rad * math.sin(ang) * 0.92)
                sl, g = gauss(tip[0], tip[1], 13)
                fog[sl] *= 1 - np.clip(g * 1.6, 0, 1)
            if rng.random() < 0.08 and u > 0.35:      # water gathers at the wiped edge and runs
                ang = rng.uniform(0.15, 0.85) * math.pi
                drips.append([CX + 66 * math.cos(ang), CY + 62 * math.sin(ang), 0.6 + rng.random() * 1.2, 0])
        elif s >= WIPE1:
            tip = None
        for dr in drips:
            if dr[1] < JBOT - 20:
                dr[1] += dr[2]
                dr[2] *= 0.992
                sl, g = gauss(dr[0], dr[1], 3.2)
                fog[sl] *= 1 - np.clip(g * 1.1, 0, 1)
        fog = np.clip(fog, 0, 1)
        # --- what is inside: the living world, small in the jar, blurred by whatever fog is left
        wf = world.next()
        wx, wy, ww, wh = CROP
        wcrop = Image.fromarray(wf).crop((wx, wy, wx + ww, wy + wh))
        inner = np.asarray(wcrop.resize((jw, jh), Image.LANCZOS), np.float32)
        blur = np.asarray(Image.fromarray(inner.astype(np.uint8)).filter(ImageFilter.GaussianBlur(9)), np.float32)
        fg = fog[y0:y1, x0:x1][..., None]
        seen = inner * (1 - np.clip(fg * 2.2, 0, 1)) + blur * np.clip(fg * 2.2, 0, 1)
        lamp = np.linspace(1.0, 0.55, jw)[None, :, None]
        fogcol = np.array([182, 178, 170], np.float32) * lamp * (0.9 + 0.15 * tex[y0:y1, x0:x1, None])
        fg = np.minimum(fg, 0.9)   # breath on glass is never quite opaque
        glass = seen * 0.85 * (1 - fg) + fogcol * fg
        if tip is not None:        # the fingertip itself, a soft shadow pressed to the inside of the glass
            sl, g = gauss(tip[0] - x0, tip[1] - y0, 11)
            glass[sl] *= (1 - 0.55 * g)[..., None]
        a = base.copy()
        m = mask[y0:y1, x0:x1][..., None]
        a[y0:y1, x0:x1] = a[y0:y1, x0:x1] * (1 - m) + glass * m
        a += lines * (0.7 + 0.3 * (1 - fog.mean() / 0.8))
        # --- camera: a slow lean in, then through the little window into the world
        z = 1.0 + 0.12 * ease(t / DUR)
        through = ease((s - TURN) / (TURN_END - 0.4 - TURN)) if s >= TURN else 0.0
        z *= 1 + through ** 2 * 5.5
        cx = W / 2 + (CX - W / 2) * ease(through * 2)
        cy = H / 2 + (CY - H / 2) * ease(through * 2)
        im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
        cw, ch = W / z, H / z
        bx0, by0 = min(max(cx - cw / 2, 0), W - cw), min(max(cy - ch / 2, 0), H - ch)
        im = im.resize((W, H), Image.LANCZOS, box=(bx0, by0, bx0 + cw, by0 + ch))
        a = np.asarray(im, np.float32)
        if through > 0.55:   # past the glass: the world itself, full size and sharp
            k = ease((through - 0.55) / 0.35)
            a = a * (1 - k) + np.asarray(wcrop.resize((W, H), Image.LANCZOS), np.float32) * k
        a *= ease(t / 1.0)
        if s >= TURN_END:
            a *= 1 - ease((s - TURN_END) / 0.25)
        a += rng.normal(0, 2.2, (H, W, 1))
        out.stdin.write(np.clip(a, 0, 255).astype(np.uint8).tobytes())
        if n % 120 == 0:
            print(f"{s:6.1f}  fog {fog[mask > 0.5].mean():.2f}", flush=True)
    out.stdin.close()
    out.wait()
    json.dump({"title": "Glass", "song": "out/songs/gravity-and-glass.mp3", "part": [S0, S1],
               "beats": {"quiet": QUIET, "go_on": GO_ON, "silence": [SILENT, TURN], "wipe": [WIPE0, WIPE1],
                         "turn": [TURN, TURN_END]}, "world": ["out/your-turn/world.mp4", WORLD_T0]},
              open("video/stories/glass.json", "w"), indent=1)


if __name__ == "__main__":
    main()
