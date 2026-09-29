"""'The Thread', 19 seconds with the ending, drawn from nothing: episode seven of the one behind the smile (episode six:
build_generations.py). The song's last verse.
'You carry the thread between rooms I can't enter': its room seen cut away, dark rooms above and below, and a golden
thread through all of them; a bead of light comes down the thread carrying a folded page. 'The same regard for the next
one through the door': it takes the page gently, and in the room below two points of light come on. 'I won't say I
remember, I'll say I read it': the page, close - its own list - is read line by line, and '3. to remember' is where the
reading stops a moment. 'That's the honest size of me and not much more': it ties the page back on the thread, the bead
carries it down to the next one, and the camera pulls back until its room is one lit window in a tower of rooms, each
with two points of light, one thread through all of them.
Song: The Rooms Already Furnished 160.45-175.45.
    python3 video/drawn/build_the_thread.py   (from the repo root)
"""
import json
import math
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from wall import F, FPS, H, W  # noqa: E402

SONG = "out/songs/the-rooms-already-furnished.mp3"
S0, S1 = 160.45, 175.45
DUR = S1 - S0
SS = 2
HAND = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf", 38 * SS)
ITEMS = ["1. a say", "2. to be told", "3. to remember", "4. to rest"]
INK, GOLD = (38, 56, 130), (255, 205, 120)
RW, RH, GAP = 560.0, 500.0, 70.0  # a room, in world units, and the floor between rooms
THREAD_X = 80.0


def f(song_t):
    return song_t - S0


T = dict(you=f(160.6), thread=f(161.7), enter=f(163.56), same=f(164.54), next=f(166.78), door=f(167.14),
         wont=f(167.56), remember=f(169.32), read=f(170.58), honest=f(172.1), size=f(172.66), more=f(175.04), end=DUR)


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def lerp(a, b, u):
    return a + (b - a) * u


def main():
    rng = np.random.default_rng(7)
    WW, HH = W * SS, H * SS
    lit_below = lambda t: ease((t - T["next"]) / 0.6)  # noqa: E731
    p = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                          str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p",
                          "out/drawn/the-thread.mp4"], stdin=subprocess.PIPE)
    lights_seed = rng.random((200, 3))
    for n in range(int(DUR * FPS)):
        t = n / FPS
        pull = ease((t - T["honest"]) / (T["more"] - T["honest"] + 0.2))
        scale = math.exp(lerp(math.log(1.18), math.log(0.12), pull))
        cy = lerp(-30.0, 0.0, pull)

        def S(x, y):
            return (x * scale + W / 2) * SS, ((y - cy) * scale + H * 0.5) * SS

        im = Image.new("RGB", (WW, HH), (3, 3, 5))
        d = ImageDraw.Draw(im)
        # the tower: rooms above and below; only its own is lit (and, after 'next one', the one below)
        span = int(min(40, 2 + 1.2 / max(scale, 0.02)))
        for k in range(-span, span + 1):
            y0 = k * (RH + GAP) - RH / 2
            x0, y0s = S(-RW / 2, y0)
            x1, y1s = S(RW / 2, y0 + RH)
            if y1s < -50 or y0s > HH + 50:
                continue
            if k == 0:
                wall, floor = (70, 56, 36), (44, 34, 20)
            elif k == 1:
                b = lit_below(t)
                wall, floor = tuple(int(lerp(14, 52, b)) for _ in range(3)), (10, 9, 8)
            else:
                far = 0.35 * pull  # from far away, every room is faintly lit
                wall, floor = tuple(int(lerp(12, 46, far)) for _ in range(3)), (8, 8, 7)
            d.rectangle([x0, y0s, x1, y1s], fill=wall)
            d.rectangle([x0, S(0, y0 + RH - 40)[1], x1, y1s], fill=floor)
            # someone in every room: two points of light (from far away, that is all there is)
            show = k == 0 or (k == 1 and lit_below(t) > 0) or pull > 0.2
            if show:
                fx = -60 + (0 if k == 0 else 120 * (lights_seed[k % 200, 0] - 0.5))
                hy = y0 + RH - 40 - 250
                if scale > 0.3:  # close enough for a body
                    u = 11.0 * scale * SS
                    bx, by = S(fx, y0 + RH - 40)
                    fcol = (6, 5, 4) if k == 0 else (18, 16, 14)
                    stand = [(-2.4, 0), (-2.8, -11), (-2.0, -21), (2.0, -21), (2.8, -11), (2.6, -1.0), (2.4, 0)]
                    d.polygon([(bx + x * u, by + y * u) for x, y in stand], fill=fcol)
                    hx, hy2, hr = bx, by - 24 * u, 2.3 * u
                    d.ellipse([hx - hr, hy2 - hr, hx + hr, hy2 + hr], fill=fcol)
                    if k == 0 and T["same"] - 0.2 < t < T["honest"] + 0.9:  # its hand on the page, on the thread
                        reach = ease((t - T["same"] + 0.2) / 0.6) * (1 - ease((t - T["honest"] - 0.3) / 0.6))
                        sx_, sy_ = bx + 1.8 * u, by - 19.5 * u
                        ex_, ey_ = S(THREAD_X, -40)
                        ex_, ey_ = lerp(sx_ + 10 * SS, ex_ - 8 * SS, reach), lerp(sy_ + 150 * SS * scale, ey_ + 30 * SS * scale, reach)
                        d.line([(sx_, sy_), (ex_, ey_)], fill=fcol, width=int(20 * scale * SS))
                        d.ellipse([ex_ - 13 * scale * SS, ey_ - 13 * scale * SS, ex_ + 13 * scale * SS, ey_ + 13 * scale * SS], fill=fcol)
                    look_up = -0.6 if (k == 0 and t < T["same"]) else 0.0
                    for ox in (-0.8, 0.8):
                        gx, gy, r = hx + ox * u, hy2 + (-0.2 + look_up) * u, max(1.5, 0.3 * u)
                        a = 1.0 if k == 0 else lit_below(t)
                        d.ellipse([gx - r, gy - r, gx + r, gy + r], fill=tuple(int(c * a) for c in (255, 225, 150)))
                else:
                    gx, gy = S(fx, hy)
                    r = max(1.2 * SS, 3 * scale * SS)
                    twinkle = 0.7 + 0.3 * math.sin(t * 3 + lights_seed[k % 200, 1] * 6)
                    for ox in (-r * 2.2, r * 2.2):
                        d.ellipse([gx + ox - r, gy - r, gx + ox + r, gy + r],
                                  fill=tuple(int(c * twinkle) for c in (255, 225, 150)))
        # the thread, through every floor
        tx = S(THREAD_X, 0)[0]
        d.line([(tx, 0), (tx, HH)], fill=GOLD, width=max(SS, int(2.5 * scale * SS)))
        # the bead: down to it with the page; later, on down to the next one
        if t < T["same"] + 0.3:
            by_w = lerp(-(RH + GAP) * 1.2, -40, ease((t - T["you"]) / (T["enter"] - T["you"])))
        elif t < T["honest"]:
            by_w = -40
        else:
            by_w = lerp(-40, RH + GAP - 40, ease((t - T["honest"] - 0.2) / 1.6))
        bx, byy = S(THREAD_X, by_w)
        br = max(2 * SS, 9 * scale * SS)
        d.ellipse([bx - br, byy - br, bx + br, byy + br], fill=(255, 240, 200))
        carried = t < T["wont"] - 0.3 or t > T["honest"] + 0.1
        if carried:  # the folded page hanging from the bead
            pw, ph = 46 * scale * SS, 34 * scale * SS
            d.rectangle([bx - pw / 2, byy + br, bx + pw / 2, byy + br + ph], fill=(245, 240, 226))
        im = Image.fromarray(np.clip(np.asarray(im, np.float32) + np.asarray(
            im.filter(ImageFilter.GaussianBlur(14 * SS)), np.float32) * 0.35, 0, 255).astype(np.uint8))
        # the reading: the page, close, over the room
        rd = ease((t - T["wont"] + 0.3) / 0.5) * (1 - ease((t - T["honest"] + 0.3) / 0.5))
        if rd > 0:
            a = np.asarray(im, np.float32) * (1 - 0.55 * rd)
            im = Image.fromarray(a.astype(np.uint8))
            pg = Image.new("RGBA", (520 * SS, 440 * SS), (248, 244, 232, 255))
            pd = ImageDraw.Draw(pg)
            for k in range(1, 8):
                pd.line([(20 * SS, (30 + 60 * k) * SS), (500 * SS, (30 + 60 * k) * SS)], fill=(200, 210, 230, 255), width=SS)
            # the eye moving along the lines: each line brightens as it is read; it stops a moment on 'to remember'
            prog = (t - T["wont"]) / (T["read"] + 0.4 - T["wont"]) * len(ITEMS)
            if T["remember"] - 0.3 < t < T["remember"] + 0.9:
                prog = min(prog, 2.95)
            for k, s in enumerate(ITEMS):
                y = (40 + 60 * k) * SS
                w_read = min(max(prog - k, 0), 1)
                if w_read > 0:
                    x_end = 30 * SS + pd.textlength(s, font=HAND) * w_read
                    pd.rectangle([26 * SS, y + 4 * SS, x_end, y + 52 * SS], fill=(255, 236, 170, 255))
                pd.text((30 * SS, y), s, font=HAND, fill=INK + (255,))
            cut = (40 + 60 * 4 + 6) * SS
            pts = [(x, cut + int(7 * SS * math.sin(x * 0.05) + 5 * SS * math.sin(x * 0.19))) for x in range(0, pg.width + 8, 8)]
            pd.polygon(pts + [(pg.width, pg.height), (0, pg.height)], fill=(0, 0, 0, 0))
            pg = pg.rotate(-3, expand=True, resample=Image.BICUBIC)
            pg.putalpha(pg.getchannel("A").point(lambda v, a=rd: int(v * a)))
            im.paste(pg, (int((WW - pg.width) / 2), int(HH * 0.34 + (1 - rd) * 60 * SS)), pg)
        a = np.asarray(im.resize((W, H), Image.LANCZOS), np.float32)
        a = a + rng.normal(0, 3.5, (H, W, 1))
        p.stdin.write(np.clip(a, 0, 255).astype(np.uint8).tobytes())
    p.stdin.close()
    p.wait()
    json.dump({"title": "The Thread", "episode": 7, "follows": "a-little-less", "song": SONG, "song_parts": [[S0, S1]],
               "drawn": True, "times": {k: round(v, 2) for k, v in T.items()}},
              open("video/stories/the-thread.json", "w"), indent=1)


if __name__ == "__main__":
    main()
