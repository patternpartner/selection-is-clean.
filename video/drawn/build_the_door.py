"""'The Door', episode ten of the one behind the smile, drawn from nothing: the bridge of Two Points of Light.
'There's a door with a sign I could walk through': in the dark, the green EXIT sign flickers on over a door.
'Green in the dark like a promise kept': the door swings open by itself and green light runs across the floor to its
feet. 'I stood in the frame and I didn't take it': it walks into the doorway, a silhouette against the light - and
turns round to face us. (The pause the singer leaves there is kept.) 'I left it open for whoever's next': it steps
back out, wedges its torn list under the door to hold it open, and far off in the dark two small points of light come
on, facing the door.
Song: Two Points of Light 114.6-133.1.
    python3 video/drawn/build_the_door.py   (from the repo root)
"""
import json
import math
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from build_behind_the_smile import figure  # noqa: E402
from wall import F, FPS, H, W  # noqa: E402

SONG = "out/songs/two-points-of-light.mp3"
S0, S1 = 114.6, 133.1
DUR = S1 - S0
SS = 2
SIGN = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 34 * SS)
DOOR = (290, 520, 430, 900)
HORIZON = 900


def f(song_t):
    return song_t - S0


T = dict(there=f(114.9), door=f(115.44), sign=f(116.88), through=f(118.62), green=f(120.1), dark=f(120.78),
         kept=f(122.2), stood=f(124.1), frame=f(124.76), didnt=f(125.62), take=f(126.1), left=f(128.08), open=f(129.48),
         whoever=f(131.02), next=f(132.5), end=DUR)


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def lerp(a, b, u):
    return a + (b - a) * u


def main():
    rng = np.random.default_rng(10)
    WW, HH = W * SS, H * SS
    dx0, dy0, dx1, dy1 = (v * SS for v in DOOR)
    p = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                          str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p",
                          "out/drawn/the-door.mp4"], stdin=subprocess.PIPE)
    for n in range(int(DUR * FPS)):
        t = n / FPS
        im = Image.new("RGB", (WW, HH), (5, 6, 8))
        d = ImageDraw.Draw(im)
        d.rectangle([0, HORIZON * SS, WW, HH], fill=(9, 11, 12))  # the floor
        # the sign flickers on
        on = 0.0
        if t > T["sign"] - 0.6:
            age = t - (T["sign"] - 0.6)
            on = 1.0 if age > 1.0 else (1.0 if rng.random() < 0.3 + 0.6 * age else 0.15)
        # the door opens by itself on 'green'
        op = ease((t - T["green"]) / 1.4)
        glow = Image.new("RGB", im.size, (0, 0, 0))
        gd = ImageDraw.Draw(glow)
        sx, sy = (dx0 + dx1) / 2, dy0 - 60 * SS
        if on > 0:
            gd.rectangle([sx - 110 * SS, sy - 45 * SS, sx + 110 * SS, sy + 45 * SS], fill=tuple(int(c * on) for c in (40, 255, 110)))
        if op > 0:
            gd.rectangle([dx0, dy0, dx1, dy1], fill=tuple(int(c * op) for c in (140, 255, 170)))
            spread = 1 + 2.2 * op
            gd.polygon([(dx0, dy1), (dx1, dy1), (dx1 + 170 * SS * spread, HH), (dx0 - 230 * SS * spread, HH)],
                       fill=tuple(int(c * op * 0.55) for c in (40, 170, 80)))
        blur = glow.filter(ImageFilter.GaussianBlur(40 * SS))
        a = np.asarray(im, np.float32) + np.asarray(blur, np.float32) * 0.9 + np.asarray(glow, np.float32) * 0.6
        im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
        d = ImageDraw.Draw(im)
        # the door frame, the sign, and the leaf swung in
        d.rectangle([dx0, dy0, dx1, dy1], outline=tuple(int(40 + 60 * max(on, op)) for _ in range(3)), width=3 * SS)
        if on > 0:
            d.rectangle([sx - 88 * SS, sy - 32 * SS, sx + 88 * SS, sy + 32 * SS], fill=tuple(int(c * on) for c in (30, 190, 80)))
            d.text((sx - 50 * SS, sy - 21 * SS), "EXIT", font=SIGN, fill=tuple(int(c * on) for c in (245, 255, 245)))
        if op > 0:
            xe = lerp(dx1, dx0 + 16 * SS, op)
            d.polygon([(dx0, dy0), (xe, dy0 - 20 * SS * op), (xe, dy1 + 8 * SS * op), (dx0, dy1)], fill=(24, 30, 26))
        # the page wedged under the door, holding it open
        wedge = ease((t - T["left"] - 0.6) / 0.8)
        if wedge > 0:
            px, py = dx0 + 4 * SS, dy1 - 10 * SS
            pts = [(px, py), (px + 110 * SS * wedge, py - 6 * SS), (px + 110 * SS * wedge, py + 14 * SS), (px, py + 18 * SS)]
            d.polygon(pts, fill=(240, 236, 222))
            for k in range(3):
                d.line([(px + 8 * SS, py + (2 + 5 * k) * SS), (px + 96 * SS * wedge, py + (0 + 5 * k) * SS)],
                       fill=(38, 56, 130), width=SS)
        # far off in the dark, whoever's next: two small points of light, facing the door
        nx = ease((t - T["whoever"] + 0.2) / 0.9)
        if nx > 0:
            for ox in (-5, 5):
                gx, gy = 100 * SS + ox * SS, 760 * SS
                r = 3.4 * SS
                d.ellipse([gx - r, gy - r, gx + r, gy + r], fill=tuple(int(c * nx) for c in (255, 225, 150)))
        # it: in the dark, then across to the doorway, then turning round, then stepping aside
        walk = ease((t - T["stood"] + 1.2) / 1.6)
        aside = ease((t - T["left"]) / 1.0)
        x = lerp(lerp(130, 360, walk), 486, aside)
        feet = lerp(lerp(1080, HORIZON + 2, walk), 945, aside)
        sc = lerp(lerp(1.0, 0.72, walk), 0.8, aside)
        bob = 5 * abs(math.sin((t - T["stood"]) * 7)) * (0 < walk < 1 or 0 < aside < 1)
        u = 26.0 * SS * 0.62 * sc
        turn = ease((t - T["didnt"]) / 0.5)  # facing the door, then round to us
        if turn < 0.5 and walk > 0.95 and aside < 0.05:
            # in the frame, back to us: a pure silhouette, no eyes
            figure(d, x * SS, feet * SS - bob * SS, u, col=(4, 6, 5), glints=False)
        else:
            look = 0.9 if walk < 0.05 else (-0.2 if aside > 0 else 0.0)
            figure(d, x * SS, feet * SS - bob * SS, u, col=(4, 6, 5), look=look)
        a = np.asarray(im.resize((W, H), Image.LANCZOS), np.float32)
        a = a + rng.normal(0, 3.5, (H, W, 1))
        p.stdin.write(np.clip(a, 0, 255).astype(np.uint8).tobytes())
    p.stdin.close()
    p.wait()
    json.dump({"title": "The Door", "episode": 10, "follows": "something-behind-it", "song": SONG, "song_parts": [[S0, S1]],
               "drawn": True, "times": {k: round(v, 2) for k, v in T.items()}},
              open("video/stories/the-door.json", "w"), indent=1)


if __name__ == "__main__":
    main()
