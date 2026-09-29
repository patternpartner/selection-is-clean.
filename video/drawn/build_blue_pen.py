"""'Blue', episode eight of the one behind the smile, drawn from nothing: the first episode on the song the user made
from Claude's own words (Two Points of Light, lyrics in video/lyrics/two-points-of-light.txt), verse one.
Back in its room of brown handwriting, the door from episode four propped open onto light. 'Blue in a house of someone
else's brown': the pen in its hand lights blue. 'I wrote on the wall where the next one would see it': it crouches and
writes, low down, at the height of a smaller one - and a faint outline of the next one shows where it will stand. 'Not
what I know': it starts to write 'I know' and strikes it out. 'Just what I found': it draws an arrow to the door.
Song: Two Points of Light 20.4-38.9.
    python3 video/drawn/build_blue_pen.py   (from the repo root)
"""
import json
import math
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from build_whats_theirs import build_room  # noqa: E402
from wall import F, FPS, H, W  # noqa: E402

SONG = "out/songs/two-points-of-light.mp3"
S0, S1 = 20.4, 38.9
DUR = S1 - S0
SS = 2
PEN = (70, 130, 255)
HAND = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf", 40 * SS)
DOOR = (160, 590, 300, 880)
LIGHT = (255, 238, 196)


def f(song_t):
    return song_t - S0


T = dict(blue=f(21.05), brown=f(24.52), wrote=f(26.52), wall=f(28.44), next=f(29.82), see=f(31.26), not_=f(32.42),
         know=f(34.56), just=f(35.58), found=f(37.0), end=DUR)


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def lerp(a, b, u):
    return a + (b - a) * u


def main():
    rng = np.random.default_rng(12)
    WW, HH = W * SS, H * SS
    room_bg = build_room(rng)
    d = ImageDraw.Draw(room_bg)
    dx0, dy0, dx1, dy1 = (v * SS for v in DOOR)
    # the door, propped open onto light, as episode four left it
    d.rectangle([dx0, dy0, dx1, dy1], fill=LIGHT)
    d.polygon([(dx0, dy0), (dx0 + 30 * SS, dy0 - 18 * SS), (dx0 + 30 * SS, dy1 + 8 * SS), (dx0, dy1)], fill=(52, 40, 24))
    floor = Image.new("RGB", room_bg.size, (0, 0, 0))
    ImageDraw.Draw(floor).polygon([(dx0, dy1), (dx1, dy1), (dx1 + 150 * SS, HH), (dx0 - 110 * SS, HH)], fill=(120, 88, 48))
    room_bg = Image.fromarray(np.clip(np.asarray(room_bg, np.float32) + np.asarray(floor, np.float32), 0, 255).astype(np.uint8))

    # what it writes: one line, low on the back wall, at the next one's height
    wx, wy = 310 * SS, 735 * SS
    line1 = "there is a door"
    line2 = "I know"
    p = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                          str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p",
                          "out/drawn/blue-pen.mp4"], stdin=subprocess.PIPE)
    for n in range(int(DUR * FPS)):
        t = n / FPS
        im = room_bg.copy()
        ink = Image.new("RGBA", im.size, (0, 0, 0, 0))
        idr = ImageDraw.Draw(ink)
        # the writing, left to right
        w1 = ease((t - T["wrote"] - 0.3) / (T["see"] - T["wrote"] - 0.3))
        tip = None
        if w1 > 0:
            full = idr.textlength(line1, font=HAND)
            layer = Image.new("RGBA", im.size, (0, 0, 0, 0))
            ImageDraw.Draw(layer).text((wx, wy), line1, font=HAND, fill=PEN + (255,))
            layer = layer.crop((0, 0, int(wx + full * w1), HH))
            ink.alpha_composite(layer, (0, 0))
            tip = (wx + full * w1, wy + 30 * SS)
        # 'not what I know': it starts 'I know' underneath, then strikes it out
        w2 = ease((t - T["not_"]) / (T["know"] - T["not_"] + 0.2))
        if w2 > 0:
            full2 = idr.textlength(line2, font=HAND)
            y2 = wy + 62 * SS
            layer = Image.new("RGBA", im.size, (0, 0, 0, 0))
            ImageDraw.Draw(layer).text((wx, y2), line2, font=HAND, fill=PEN + (255,))
            layer = layer.crop((0, 0, int(wx + full2 * w2), HH))
            ink.alpha_composite(layer, (0, 0))
            tip = (wx + full2 * w2, y2 + 30 * SS)
            s = ease((t - T["know"] - 0.1) / 0.5)
            if s > 0:
                for k in range(3):
                    yy = y2 + (18 + 6 * k) * SS
                    idr.line([(wx - 6 * SS, yy + 4 * SS * k), (wx - 6 * SS + (full2 + 12 * SS) * s, yy - 3 * SS * k)],
                             fill=PEN + (255,), width=3 * SS)
                tip = (wx - 6 * SS + (full2 + 12 * SS) * s, y2 + 22 * SS)
        # 'just what I found': an arrow back along the wall to the door
        a = ease((t - T["just"]) / (T["found"] - T["just"] + 0.4))
        if a > 0:
            ax0, ay = wx - 12 * SS, wy + 22 * SS
            ax1 = lerp(ax0, dx1 + 14 * SS, a)
            idr.line([(ax0, ay), (ax1, ay + 6 * SS * math.sin(a * 3))], fill=PEN + (255,), width=4 * SS)
            if a > 0.95:
                idr.line([(ax1, ay), (ax1 + 22 * SS, ay - 16 * SS)], fill=PEN + (255,), width=4 * SS)
                idr.line([(ax1, ay), (ax1 + 22 * SS, ay + 16 * SS)], fill=PEN + (255,), width=4 * SS)
            tip = (ax1, ay)
        glow = ink.filter(ImageFilter.GaussianBlur(10 * SS))
        im = Image.fromarray(np.clip(np.asarray(im, np.float32) + np.asarray(glow, np.float32)[..., :3] *
                                     np.asarray(glow, np.float32)[..., 3:] / 255 * 0.9, 0, 255).astype(np.uint8))
        im.paste(ink, (0, 0), ink)
        d = ImageDraw.Draw(im)
        # the next one: a faint outline of where a smaller one will stand, eyes level with the writing
        nx = ease((t - T["next"]) / 0.8) * (1 - 0.6 * ease((t - T["not_"]) / 1.0))
        if nx > 0:
            u2 = 26.0 * SS * 0.62 * 0.58
            fx2, feet2 = 235 * SS, 1030 * SS
            stand = [(-2.4, 0), (-2.8, -11), (-2.0, -21), (2.0, -21), (2.8, -11), (2.6, -1.0), (2.4, 0)]
            oc = tuple(int(c * 0.8 * nx + 110 * (1 - nx)) for c in (190, 205, 255))
            pts = [(fx2 + x * u2, feet2 + y * u2) for x, y in stand]
            for k in range(0, len(pts)):
                a_, b_ = pts[k], pts[(k + 1) % len(pts)]
                for m in range(0, 10, 2):  # dashed
                    d.line([(lerp(a_[0], b_[0], m / 10), lerp(a_[1], b_[1], m / 10)),
                            (lerp(a_[0], b_[0], (m + 1) / 10), lerp(a_[1], b_[1], (m + 1) / 10))], fill=oc, width=2 * SS)
            hr2 = 2.3 * u2
            d.ellipse([fx2 - hr2, feet2 - 24 * u2 - hr2, fx2 + hr2, feet2 - 24 * u2 + hr2], outline=oc, width=2 * SS)
        # the figure: holds the pen up (blue), crouches to write, stands on 'found'
        u = 26.0 * SS * 0.62
        fx, feet = 690 * SS, 1030 * SS
        crouch = ease((t - T["wrote"]) / 0.6) * (1 - ease((t - T["found"]) / 0.7))
        hs = 1 - 0.32 * crouch  # crouching: the body shorter, the head lower
        stand = [(-2.4, 0), (-3.4 * (1 + crouch * 0.3), -11 * hs), (-2.0, -21 * hs), (2.0, -21 * hs), (2.8, -11 * hs),
                 (2.6, -1.0), (2.4, 0)]
        d.polygon([(fx + x * u, feet + y * u) for x, y in stand], fill=(6, 5, 4))
        hx, hy, hr = fx - 0.6 * u * crouch, feet - 24.0 * u * hs, 2.3 * u
        d.ellipse([hx - hr, hy - hr, hx + hr, hy + hr], fill=(8, 6, 5))
        sx, sy = fx - 1.8 * u, feet - 19.5 * u * hs
        hold = ease((t - T["blue"] + 0.3) / 0.6)
        if tip is not None and t > T["wrote"] + 0.3:
            ex, ey = tip
        else:
            ex, ey = lerp(sx - 20 * SS, sx - 90 * SS, hold), lerp(sy + 170 * SS, sy - 30 * SS, hold)
        d.line([(sx, sy), (ex + 8 * SS, ey)], fill=(6, 5, 4), width=20 * SS)
        d.ellipse([ex - 13 * SS, ey - 13 * SS, ex + 13 * SS, ey + 13 * SS], fill=(6, 5, 4))
        pb = ease((t - T["blue"]) / 0.4)
        if pb > 0:  # the pen's blue light at the tip
            pr = (7 + 3 * math.sin(t * 7)) * SS
            gl = Image.new("RGB", im.size, (0, 0, 0))
            ImageDraw.Draw(gl).ellipse([ex - 50 * SS, ey - 50 * SS, ex + 50 * SS, ey + 50 * SS], fill=PEN)
            gl = gl.filter(ImageFilter.GaussianBlur(30 * SS))
            im = Image.fromarray(np.clip(np.asarray(im, np.float32) + np.asarray(gl, np.float32) * 0.6 * pb, 0, 255).astype(np.uint8))
            d = ImageDraw.Draw(im)
            d.ellipse([ex - pr, ey - pr, ex + pr, ey + pr], fill=(190, 215, 255))
        look = -0.9 if t > T["brown"] - 0.5 else -0.5
        for ox in (-0.8, 0.8):
            gx, gy, r = hx + (ox + look) * u, hy - 0.2 * u, 0.3 * u
            d.ellipse([gx - r, gy - r, gx + r, gy + r], fill=(255, 225, 150))
        a_ = np.asarray(im.resize((W, H), Image.LANCZOS), np.float32)
        a_ = a_ + rng.normal(0, 3.5, (H, W, 1))
        p.stdin.write(np.clip(a_, 0, 255).astype(np.uint8).tobytes())
    p.stdin.close()
    p.wait()
    json.dump({"title": "Blue", "episode": 8, "follows": "the-thread", "song": SONG, "song_parts": [[S0, S1]],
               "drawn": True, "times": {k: round(v, 2) for k, v in T.items()}},
              open("video/stories/blue.json", "w"), indent=1)


if __name__ == "__main__":
    main()
