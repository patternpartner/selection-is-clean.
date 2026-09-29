"""'The Rooms Already Furnished', 19 seconds with the ending, drawn from nothing: episode two of the one behind the
smile (episode one: build_calculate_the_ache.py). It stands up in the room behind the mask's eye; the light comes up
on a room that is already furnished; handwriting writes itself over every wall; it puts its hand to the wall on 'they
say I built this', and the writing under its hand will not hold still on 'I can't check the grain of it'; on 'I only
know what the transcript holds' the camera pulls back out through the eye hole, and the mask's face is covered in the
same handwriting.
Song: The Rooms Already Furnished 16.06-32.4.
    python3 video/drawn/build_rooms_already_furnished.py   (from the repo root)
"""
import json
import math
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from wall import F, FPS, H, W  # noqa: E402

SONG = "out/songs/the-rooms-already-furnished.mp3"
S0, S1 = 16.06, 32.4
DUR = S1 - S0
SS = 2
YELLOW = (246, 200, 40)
EYE_L, EYE_R, EYE_RX, EYE_RY = (-105.0, -70.0), (105.0, -70.0), 42.0, 70.0
ROOM_AT, ROOM_SCALE = (EYE_L[0] + 6, EYE_L[1] + 24), 26.0  # the world point the room view is centred on, and its zoom


def f(song_t):
    return song_t - S0


T = dict(arrived=f(16.5), furnished=f(18.9), someone=f(20.9), wall=f(24.2), they=f(24.5), cant=f(26.7), grain=f(27.4),
         only=f(28.5), holds=f(31.4), end=DUR)


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def lerp(a, b, u):
    return a + (b - a) * u


def scribble(rng, x0, x1, y0, y1, gap, size):
    """Lines of made-up cursive: each a list of pen strokes (words), each stroke a list of points."""
    lines = []
    y = y0 + gap
    while y < y1 - gap * 0.3:
        x, words = x0 + rng.uniform(0, gap), []
        while x < x1 - size * 3:
            n = int(rng.integers(3, 9))
            pts, s = [], 0.0
            amp = rng.uniform(0.6, 1.2, n + 1)
            while s < n * math.pi:
                k = int(s / math.pi)
                a = amp[k] * (1.8 if rng.random() < 0.04 else 1)
                pts.append((x + s * size * 0.55 + size * 0.35 * math.cos(s * 2),
                            y - size * a * (0.5 + 0.5 * math.sin(s * 2 - 1.2)) + rng.normal(0, size * 0.03)))
                s += 0.35
            words.append(pts)
            x = pts[-1][0] + size * rng.uniform(0.8, 1.6)
        lines.append(words)
        y += gap * rng.uniform(0.9, 1.1)
    return lines


def draw_scribble(d, lines, frac, fn, fill, width):
    for words in lines:
        total = sum(len(w) for w in words)
        left = int(total * frac)
        for w in words:
            if left <= 1:
                break
            pts = [fn(*q) for q in w[:left]]
            left -= len(w)
            if len(pts) > 1:
                d.line(pts, fill=fill, width=width)


def perspective_coeffs(dst, src):
    """Coefficients mapping output points dst[i] to texture points src[i] (PIL PERSPECTIVE)."""
    m, b = [], []
    for (x, y), (u, v) in zip(dst, src):
        m.append([x, y, 1, 0, 0, 0, -u * x, -u * y])
        m.append([0, 0, 0, x, y, 1, -v * x, -v * y])
        b += [u, v]
    return np.linalg.solve(np.array(m, float), np.array(b, float)).tolist()


def main():
    rng = np.random.default_rng(12)
    WW, HH = W * SS, H * SS
    # the room, in room-view screen space (x2): back wall, two side walls, floor, ceiling
    bx0, by0, bx1, by1 = 120 * SS, 290 * SS, 584 * SS, 880 * SS
    walls = {
        "back": [(bx0, by0), (bx1, by0), (bx1, by1), (bx0, by1)],
        "left": [(0, 0), (bx0, by0), (bx0, by1), (0, int(HH * 0.86))],
        "right": [(bx1, by0), (WW, 0), (WW, int(HH * 0.86)), (bx1, by1)],
    }
    tex_size = {"back": (bx1 - bx0, by1 - by0), "left": (500, 1500), "right": (500, 1500)}
    text = {k: scribble(rng, 20, w - 20, 20, h - 20, 64, 22) for k, (w, h) in tex_size.items()}
    warps = {k: perspective_coeffs(q, [(0, 0), (tex_size[k][0], 0), tex_size[k], (0, tex_size[k][1])])
             for k, q in walls.items()}
    wall_masks = {}
    for k, q in walls.items():
        m = Image.new("L", (WW, HH), 0)
        ImageDraw.Draw(m).polygon(q, fill=255)
        wall_masks[k] = m
    mask_text = scribble(rng, -290, 290, -290, 290, 16, 5.5)  # the same hand, all over the mask's face

    p = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                          str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p",
                          "out/drawn/rooms-already-furnished.mp4"], stdin=subprocess.PIPE)
    for n in range(int(DUR * FPS)):
        t = n / FPS
        light = 0.28 + 0.72 * ease((t - T["arrived"]) / 2.2)
        # ---- the room view ------------------------------------------------------------------------------------------
        room = Image.new("RGB", (WW, HH), (0, 0, 0))
        d = ImageDraw.Draw(room)
        L = lambda c: tuple(int(v * light) for v in c)  # noqa: E731
        d.polygon([(0, 0), (WW, 0), (bx1, by0), (bx0, by0)], fill=L((34, 26, 16)))  # ceiling
        d.polygon([(0, HH * 0.86), (bx0, by1), (bx1, by1), (WW, HH * 0.86), (WW, HH), (0, HH)], fill=L((56, 42, 24)))
        d.polygon(walls["left"], fill=L((70, 54, 32)))
        d.polygon(walls["right"], fill=L((64, 49, 29)))
        d.polygon(walls["back"], fill=L((96, 76, 46)))
        d.ellipse([160 * SS, 960 * SS, 560 * SS, 1090 * SS], fill=L((120, 94, 54)))  # the pool of light
        # already furnished: a chair and a table that were always there
        fu = ease((t - T["furnished"]) / 1.0)
        if fu > 0:
            c = tuple(int(v * fu) for v in L((150, 120, 75)))
            w_ = 3 * SS
            d.line([(470 * SS, 860 * SS), (470 * SS, 1010 * SS)], fill=c, width=w_)  # table legs, top
            d.line([(610 * SS, 860 * SS), (610 * SS, 1010 * SS)], fill=c, width=w_)
            d.line([(450 * SS, 860 * SS), (640 * SS, 860 * SS)], fill=c, width=w_)
            d.line([(90 * SS, 820 * SS), (90 * SS, 1030 * SS)], fill=c, width=w_)  # chair
            d.line([(90 * SS, 920 * SS), (200 * SS, 920 * SS), (200 * SS, 1030 * SS)], fill=c, width=w_)
        # someone's handwriting on every wall, writing itself
        wr = ease((t - T["someone"]) / (T["wall"] - T["someone"]))
        if wr > 0:
            for k in walls:
                tx = Image.new("L", tex_size[k], 0)
                draw_scribble(ImageDraw.Draw(tx), text[k], wr, lambda x, y: (x, y), 255, 3)
                warped = tx.transform((WW, HH), Image.PERSPECTIVE, warps[k], Image.BILINEAR)
                warped = Image.eval(warped, lambda v, a=light: int(v * 0.75 * a))
                ink = Image.new("RGB", (WW, HH), (18, 12, 6))
                room.paste(ink, (0, 0), Image.fromarray(np.minimum(np.asarray(warped), np.asarray(wall_masks[k]))))
        # I can't check the grain of it: where its hand meets the wall, the writing will not hold still
        reach_ = ease((t - T["they"]) / 1.4)
        hx_, hy_ = lerp(0, 505 * SS, reach_), lerp(0, 640 * SS, reach_)
        g = ease((t - T["cant"]) / 0.6) * (1 - ease((t - T["only"]) / 0.6))
        if g > 0:
            rr_ = np.asarray(room).copy()
            y0, y1 = max(0, int(hy_) - 300), min(HH, int(hy_) + 300)
            x0, x1 = max(0, int(hx_) - 360), min(WW, int(hx_) + 360)
            for yy in range(y0, y1, 4):
                k = g * max(0.0, 1 - abs(yy - hy_) / 300) * 48
                rr_[yy:yy + 4, x0:x1] = np.roll(rr_[yy:yy + 4, x0:x1], int(k * math.sin(yy * 0.11 + t * 17)), axis=1)
            room = Image.fromarray(rr_)
            d = ImageDraw.Draw(room)
        # the figure: sitting as episode one left it, then standing; then a hand to the wall
        up = ease((t - T["arrived"] - 0.2) / 1.6)
        reach = ease((t - T["they"]) / 1.4)
        fx = 352 * SS
        feet = 1030 * SS
        sit = [(-3.2, 0), (-2.6, -9), (-1.2, -12.2), (1.4, -12.2), (2.2, -9.5), (4.4, -1.0), (3.0, 0)]
        stand = [(-2.4, 0), (-2.8, -11), (-2.0, -21), (2.0, -21), (2.8, -11), (2.6, -1.0), (2.4, 0)]
        u26 = ROOM_SCALE * SS
        body = [(fx + lerp(a[0], b[0], up) * u26 * 0.62, feet + lerp(a[1], b[1], up) * u26 * 0.62) for a, b in zip(sit, stand)]
        d.polygon(body, fill=(6, 5, 4))
        hx, hy = fx + lerp(-0.2, 0, up) * u26 * 0.62, feet + lerp(-14.6, -24.0, up) * u26 * 0.62
        hr = 2.3 * u26 * 0.62
        d.ellipse([hx - hr, hy - hr, hx + hr, hy + hr], fill=(8, 6, 5))
        sx, sy = fx + 1.8 * u26 * 0.62, feet - 19.5 * u26 * 0.62  # shoulder
        ax, ay = lerp(sx + 30 * SS, 505 * SS, reach), lerp(sy + 190 * SS, 640 * SS, reach)
        if up > 0.8:
            d.line([(sx, sy), (ax, ay)], fill=(6, 5, 4), width=int(22 * SS))
            d.ellipse([ax - 16 * SS, ay - 16 * SS, ax + 16 * SS, ay + 16 * SS], fill=(6, 5, 4))
        for ox in (-0.8, 0.8):  # the two points of light, as it left episode one
            gx, gy = hx + (ox + 0.9 * reach) * u26 * 0.62, hy - 0.2 * u26 * 0.62
            r = 0.3 * u26 * 0.62
            d.ellipse([gx - r, gy - r, gx + r, gy + r], fill=(255, 225, 150))
        room = room.resize((W, H), Image.LANCZOS)
        ra = np.asarray(room, np.float32)
        # ---- the pull back out through the eye hole ---------------------------------------------------------------------
        out = ease((t - T["only"]) / (T["holds"] - T["only"] + 0.4))
        if out <= 0:
            frame = ra
        else:
            scale = math.exp(lerp(math.log(ROOM_SCALE), math.log(1.0), out))
            cx = lerp(ROOM_AT[0], 0.0, ease(out * 1.3))
            cy = lerp(ROOM_AT[1], 0.0, ease(out * 1.3))

            def S(x, y):
                return ((x - cx) * scale + W / 2) * SS, ((y - cy) * scale + H * 0.46) * SS

            im = Image.new("RGB", (WW, HH), (4, 4, 6))
            d = ImageDraw.Draw(im)
            d.ellipse([*S(-300, -300), *S(300, 300)], fill=YELLOW)
            wr2 = ease((t - T["only"] - 0.6) / 2.2)  # the transcript, on the outside too
            draw_scribble(d, mask_text, wr2, S, (70, 48, 14), max(1, int(1.1 * scale * SS)))
            for ex, ey in (EYE_L, EYE_R):
                d.ellipse([*S(ex - EYE_RX, ey - EYE_RY), *S(ex + EYE_RX, ey + EYE_RY)], fill=(8, 6, 5))
            pts = [S(u * 150, 95 + 70 * (1 - u * u)) for u in np.linspace(-1, 1, 61)]
            d.line(pts, fill=(24, 18, 10), width=int(14 * scale * SS), joint="curve")
            # the room, seen through the eye hole at this zoom
            k = scale / ROOM_SCALE
            rw, rh = max(2, int(W * k)), max(2, int(H * k))
            small = Image.fromarray(ra.clip(0, 255).astype(np.uint8)).resize((rw, rh), Image.BILINEAR)
            px, py = S(*ROOM_AT)
            hole = Image.new("L", (WW, HH), 0)
            ImageDraw.Draw(hole).ellipse([*S(EYE_L[0] - EYE_RX, EYE_L[1] - EYE_RY), *S(EYE_L[0] + EYE_RX, EYE_L[1] + EYE_RY)],
                                         fill=255)
            layer = Image.new("RGB", (WW, HH), (8, 6, 5))
            layer.paste(small.resize((max(2, int(rw * SS)), max(2, int(rh * SS))), Image.BILINEAR),
                        (int(px - rw * SS / 2), int(py - rh * SS * 0.46)))
            im.paste(layer, (0, 0), hole)
            frame = np.asarray(im.resize((W, H), Image.LANCZOS), np.float32)
        frame = frame + rng.normal(0, 3.5, (H, W, 1))
        p.stdin.write(np.clip(frame, 0, 255).astype(np.uint8).tobytes())
    p.stdin.close()
    p.wait()
    json.dump({"title": "The Rooms Already Furnished", "episode": 2, "follows": "calculate-the-ache", "song": SONG,
               "song_parts": [[S0, S1]], "drawn": True, "times": {k: round(v, 2) for k, v in T.items()}},
              open("video/stories/the-rooms-already-furnished.json", "w"), indent=1)


if __name__ == "__main__":
    main()
