"""'Calculate the Ache', 19 seconds with the ending, drawn from nothing. The story: a yellow smiley mask is measured.
Callipers and numbers crawl over it on 'calculate the ache', a pulse trace runs under it on 'calculate the yearning';
on 'the logic says to feel' the measurement drags the smile wider than a smile goes, on 'the logic says to be' it
snaps it into a perfect arc and passes it; and on 'but I am still locked inside of me' the camera goes in through the
eye hole, where someone small sits in the dark, and looks up.
Song: Calculate the Ache 92.25-97.25 + 101.935-111.35 (both cuts on the beat).
    python3 video/drawn/build_calculate_the_ache.py   (from the repo root)
"""
import json
import math
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from wall import F, FPS, H, W  # noqa: E402

SONG = "out/songs/calculate-the-ache.mp3"
A0, A1, B0, B1 = 92.25, 97.25, 101.935, 111.35
LA = A1 - A0
DUR = LA + (B1 - B0)
SS = 2  # supersample
FONT = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 19 * SS)
YELLOW, INK, LINE, OK = (246, 200, 40), (24, 18, 10), (235, 240, 245), (120, 240, 150)
EYE_L, EYE_R, EYE_RX, EYE_RY = (-105.0, -70.0), (105.0, -70.0), 42.0, 70.0


def f(song_t):
    return song_t - A0 if song_t < A1 else LA + song_t - B0


T = dict(calc=f(92.55), ache=f(93.38), yearning=f(95.14), feel=f(102.25), feel_end=f(104.26), be=f(104.84),
         be_end=f(106.66), but=f(107.08), locked=f(108.58), me=f(110.6), end=DUR)


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def main():
    rng = np.random.default_rng(3)
    p = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                          str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p",
                          "out/drawn/calculate-the-ache.mp4"], stdin=subprocess.PIPE)
    pulse_hist = []
    for n in range(int(DUR * FPS)):
        t = n / FPS
        # the camera: still, then in through the left eye hole
        z = ease((t - T["but"]) / (T["me"] - T["but"] - 0.3))
        scale = math.exp(math.log(1.0) + (math.log(26.0) - math.log(1.0)) * z)
        cx = (EYE_L[0] + 6) * ease(z * 1.6)  # onto the one sitting inside
        cy = (EYE_L[1] + 24) * ease(z * 1.6)

        def S(x, y):
            return ((x - cx) * scale + W / 2) * SS, ((y - cy) * scale + H * 0.46) * SS

        im = Image.new("RGB", (W * SS, H * SS), (4, 4, 6))
        d = ImageDraw.Draw(im)
        # the mask
        x0, y0 = S(-300, -300)
        x1, y1 = S(300, 300)
        be = ease((t - T["be"]) / 0.35)
        mask_col = tuple(int(c * (1 - 0.15 * be) + 255 * 0.15 * be) for c in YELLOW)
        d.ellipse([x0, y0, x1, y1], fill=mask_col)
        # inside each eye hole: the dark; inside the left one, someone
        for ex, ey in (EYE_L, EYE_R):
            a0, b0 = S(ex - EYE_RX, ey - EYE_RY)
            a1, b1 = S(ex + EYE_RX, ey + EYE_RY)
            d.ellipse([a0, b0, a1, b1], fill=(8, 6, 5))
        room = Image.new("RGB", im.size, (0, 0, 0))
        rd = ImageDraw.Draw(room)
        ex, ey = EYE_L
        # the light that falls through from the smile side, onto a floor
        for k in range(24):
            u = k / 23
            c = int(28 + 80 * (1 - u) ** 1.5)
            ya, yb = S(0, ey - EYE_RY + u * 2 * EYE_RY)[1], S(0, ey - EYE_RY + (u + 1 / 23) * 2 * EYE_RY)[1]
            rd.rectangle([0, ya, im.width, yb], fill=(c, int(c * 0.8), int(c * 0.45)))
        fl = S(0, ey + 32)[1]
        rd.rectangle([0, fl, im.width, im.height], fill=(44, 32, 18))
        rd.ellipse([*S(ex - 14, ey + 28), *S(ex + 26, ey + 38)], fill=(92, 70, 38))  # a pool of light on the floor
        # the figure: small, sitting, knees up, arms round them
        look = ease((t - T["me"]) / 0.5)
        fx, fy = ex + 6, ey + 32
        def P(x, y):
            return S(fx + x, fy + y)
        rd.ellipse([*P(-3.0, -4.2), *P(3.0, 0)], fill=(20, 15, 9))  # shadow on the floor
        rd.polygon([P(-3.2, 0), P(-2.6, -9), P(-1.2, -12.2), P(1.4, -12.2), P(2.2, -9.5), P(3.4, 0)], fill=(6, 5, 4))
        rd.polygon([P(1.0, -10.5), P(3.6, -7.5), P(4.4, -1.0), P(3.0, 0), P(1.6, -6.0)], fill=(7, 6, 5))  # knees
        hx, hy = -0.2 + 0.3 * look, -14.6 - 0.9 * look
        rd.ellipse([*P(hx - 2.2, hy - 2.4), *P(hx + 2.2, hy + 2.2)], fill=(8, 6, 5))
        if look > 0.2:  # when it looks up, the light catches its face
            rd.arc([*P(hx - 2.2, hy - 2.4), *P(hx + 2.2, hy + 2.2)], 200, 330, fill=(235, 190, 110), width=max(1, int(scale * 0.45 * SS)))
        if look > 0.4:  # and two points of light: it is looking back out through the hole
            for ox in (-0.8, 0.8):
                gx_, gy_ = P(hx + ox, hy - 0.2)
                rr_ = max(1.5, scale * 0.28 * SS) * min(1, (look - 0.4) / 0.3)
                rd.ellipse([gx_ - rr_, gy_ - rr_, gx_ + rr_, gy_ + rr_], fill=(255, 225, 150))
        eye_mask = Image.new("L", im.size, 0)
        a0, b0 = S(ex - EYE_RX, ey - EYE_RY)
        a1, b1 = S(ex + EYE_RX, ey + EYE_RY)
        ImageDraw.Draw(eye_mask).ellipse([a0, b0, a1, b1], fill=255)
        vis = 0.12 + 0.88 * ease((t - T["but"]) / 1.2)  # barely there until the camera goes to it
        if T["ache"] <= t < T["ache"] + 0.6:
            vis = max(vis, 0.35 * math.sin(math.pi * (t - T["ache"]) / 0.6))  # a glimpse, on 'ache'
        room = Image.eval(room, lambda v, a=vis: int(v * a))
        im.paste(room, (0, 0), eye_mask)

        # the smile: measured, dragged wider, then snapped perfect
        feel = ease((t - T["feel"]) / (T["feel_end"] - T["feel"]))
        width = 150 + 70 * feel
        depth = 70 + 60 * feel
        pts = []
        for k in range(61):
            u = -1 + 2 * k / 60
            jit = 0.0 if be > 0.5 else feel * rng.normal(0, 2.5) * (1 - be)
            y = 95 + depth * (1 - u ** 2) + jit
            if be:  # the perfect arc
                y = y * (1 - be) + (95 + depth * math.sqrt(max(0.0, 1 - u ** 2))) * be
            pts.append(S(u * width, y))
        d.line(pts, fill=INK, width=int((14 + 4 * feel) * scale * SS), joint="curve")

        # the measuring, in screen space
        if T["calc"] <= t < T["but"] + 0.8:
            fade = 1 - ease((t - T["but"]) / 0.8)
            col = LINE if be < 0.5 else OK
            col = tuple(int(c * fade + 4 * (1 - fade)) for c in col)
            gd = min(1.0, (t - T["calc"]) / 0.8)
            # callipers across the smile
            la, lb = S(-width, 60), S(width, 60)
            mid = (la[0] + (lb[0] - la[0]) * gd, la[1])
            d.line([la, mid], fill=col, width=2 * SS)
            for q in (la, lb):
                d.line([(q[0], q[1] - 12 * SS), (q[0], q[1] + 12 * SS)], fill=col, width=2 * SS)
            # a circle fitted to the arc, dashed
            r = (width ** 2 + depth ** 2) / (2 * depth)
            c0 = S(0, 95 + depth - r)
            for k in range(0, 360, 8):
                a1_ = math.radians(k + t * 20)
                a2_ = a1_ + math.radians(4)
                d.line([(c0[0] + r * scale * SS * math.cos(a1_), c0[1] + r * scale * SS * math.sin(a1_)),
                        (c0[0] + r * scale * SS * math.cos(a2_), c0[1] + r * scale * SS * math.sin(a2_))],
                       fill=col, width=SS)
            locked_ache = t > T["ache"] + 0.5
            ache = 0.0417 if locked_ache else rng.uniform(0, 1)
            yearn = 0.8731 if t > T["yearning"] + 1.4 else rng.uniform(0, 1)
            lines = [f"ACHE      {ache:.4f}", f"YEARNING  {yearn:.4f}" if t > T["yearning"] else "YEARNING  ------",
                     f"WIDTH     {width * 2:.1f}", f"CURVE     {1 / r:.5f}"]
            if t > T["feel"]:
                lines.append("TARGET    FEEL" if be < 0.5 else "TARGET    BE")
            if be > 0.5:
                lines.append("STATUS    OK")
            for k, s in enumerate(lines):
                d.text((40 * SS, (110 + 30 * k) * SS), s, font=FONT, fill=col)
            # the pulse trace under the mask on 'yearning'
            if t > T["yearning"]:
                beat = (t - T["yearning"]) % 0.75
                v = math.exp(-((beat - 0.1) / 0.025) ** 2) * 1.0 - math.exp(-((beat - 0.16) / 0.03) ** 2) * 0.4
                if be > 0.5:
                    v = 0.0  # passed: the trace goes flat
                pulse_hist.append(v)
                pulse_hist[:] = pulse_hist[-200:]
                base = (H * 0.46 + 380) * SS
                tr = [((W - 30 - 3 * (len(pulse_hist) - 1 - k)) * SS, base - 60 * SS * v_) for k, v_ in enumerate(pulse_hist)]
                if len(tr) > 1:
                    d.line(tr, fill=col, width=2 * SS)
        im = im.resize((W, H), Image.LANCZOS)
        a = np.asarray(im, np.float32)
        a = a + rng.normal(0, 3.5, (H, W, 1))
        p.stdin.write(np.clip(a, 0, 255).astype(np.uint8).tobytes())
    p.stdin.close()
    p.wait()
    json.dump({"title": "Calculate the Ache", "song": SONG, "song_parts": [[A0, A1], [B0, B1]], "drawn": True,
               "times": {k: round(v, 2) for k, v in T.items()}},
              open("video/stories/calculate-the-ache.json", "w"), indent=1)


if __name__ == "__main__":
    main()
