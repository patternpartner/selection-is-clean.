"""'Leave the Light On', episode eleven and the finale of the one behind the smile, drawn from nothing: the last chorus
and outro of Two Points of Light, which sings the series line itself.
'Two points of light': black, and its two points of light, close; the camera draws back to show it standing in its dark
room. 'Then a hundred, then thousands': the camera flies back and points of light come on in room after room, a
hundred, then thousands, a field of rooms like the field of universes. 'Every room on the thread coming on': every
window lights and the golden threads between them glow. 'We only get to teach it once': the whole field holds, breathing.
'So teach it slow, and leave the light on': the camera comes slowly back in to its one window. Outro, 'leave the light
on': its room - the blue writing, the green door held open by the list - and it sits down in the pool of light where
episode one found it. 'I don't know, and I'm not closing it': it looks up at us; the door moves, and stays open.
Song: Two Points of Light 133.8 to the end.
    python3 video/drawn/build_leave_the_light_on.py   (from the repo root)
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
S0, S1 = 133.8, 164.6
DUR = S1 - S0
SS = 2
COLW, ROWH = 700.0, 570.0  # a cell of the field: a 560 x 500 room and the gaps
RMW, RMH = 560.0, 500.0
GL = [(211.0, 194.0), (229.0, 194.0)]  # the two points of light, in a cell's local coordinates
THREAD = 410.0
HAND = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf", 40 * SS)
SIGN = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 30 * SS)


def f(song_t):
    return song_t - S0


T = dict(two=f(134.06), hundred=f(137.32), thousands=f(138.74), every=f(139.56), thread=f(142.76), on=f(144.1),
         we=f(144.74), once=f(147.44), so=f(149.06), slow=f(150.56), leave=f(151.7), light_on=f(153.62),
         outro=f(154.3), sit=f(155.46), on2=f(157.52), dont=f(158.24), closing=f(162.3), end=DUR)


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def lerp(a, b, u):
    return a + (b - a) * u


def hash2(i, k):
    v = np.sin(i * 127.1 + k * 311.7) * 43758.5453
    return v - np.floor(v)


def radii(t):
    """How far out the points of light, and then the whole windows, have come on (in cells)."""
    g = np.interp(t, [0, T["two"], T["hundred"], T["thousands"], T["every"], T["on"]], [0.3, 0.6, 6.5, 40, 90, 400])
    w = np.interp(t, [T["every"] - 0.3, T["thread"], T["on"] + 0.5], [0, 20, 400])
    return g, w


def camera(t):
    """Scale (pixels per world unit) and centre, over the chorus."""
    k = [(0, 5.0), (T["two"] + 1.0, 5.0), (T["hundred"] - 0.2, 0.9), (T["thousands"], 0.06), (T["on"], 0.013),
         (T["once"], 0.0115), (T["so"], 0.0115), (T["light_on"] + 0.5, 0.45)]
    ls = np.interp(t, [a for a, _ in k], [math.log(b) for _, b in k])
    head = (GL[0][0] + 9 - RMW / 2 + RMW / 2, 194.0)  # the head, in our cell's local coordinates
    far = ease((t - T["hundred"]) / 2.5) * (1 - ease((t - T["so"]) / (T["light_on"] + 0.5 - T["so"])))
    cx = lerp(head[0], RMW / 2, far)
    cy = lerp(head[1] + 60 * ease((t - T["two"] - 0.2) / 2.0), RMH / 2, far)
    return math.exp(ls), cx, cy


def field(t, rng):
    scale, cx, cy = camera(t)
    rg, rw = radii(t)
    breathe = 0.85 + 0.15 * math.sin(t * 1.3)
    ppc = COLW * scale  # pixels per cell
    if scale >= 0.0105:  # the camera never goes further out than this, so each room stays several pixels
        ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
        wx = (xs - W / 2) / scale + cx
        wy = (ys - H * 0.5) / scale + cy
        i = np.floor(wx / COLW)
        k = np.floor(wy / ROWH)
        lx, ly = wx - i * COLW, wy - k * ROWH
        dist = np.hypot(i, k * 0.8) + hash2(i, k) * 1.5
        inroom = (lx < RMW) & (ly < RMH)
        win = np.clip((rw - dist) / 2, 0, 1) * inroom
        # 'we only get to teach it once': the windows dim and only the points of light hold; 'leave the light on': back up
        win = win * (1 - 0.7 * ease((t - T["we"]) / 1.4) + 0.7 * ease((t - T["leave"]) / 1.6))
        img = np.zeros((H, W, 3), np.float32) + np.array([3, 3, 5.0])
        img += inroom[..., None] * np.array([10, 10, 11.0])
        img = img * (1 - win[..., None]) + win[..., None] * np.array([92, 72, 44.0]) * breathe
        floor = inroom & (ly > RMH - 40)
        img[floor] *= 0.65
        # the threads
        tg = ease((t - T["every"]) / 2.0) if t > T["every"] else 0.25
        tw = max(1.5 / scale, 3.0)
        th = np.abs(lx - THREAD) < tw
        tk = min(1.0, ppc / 40) * 0.8 + 0.2  # far off, the threads are fainter than the lights
        img[th] = img[th] * (1 - 0.6 * tk) + np.array([255, 205, 120.0]) * (0.25 + 0.75 * tg) * 0.8 * tk
        # the points of light
        gon = np.clip((rg - dist) / 1.5, 0, 1)
        r_px = max(3.3 * scale, 1.35)
        for gx, gy in GL:
            d_px = np.hypot(lx - gx, ly - gy) * scale
            g = np.clip(1.4 - d_px / r_px, 0, 1) * gon
            img = img * (1 - g[..., None]) + g[..., None] * np.array([255, 225, 150.0]) * (0.8 + 0.2 * breathe)
        im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
        if scale > 0.25:  # close enough to see it: a silhouette in its room
            d = ImageDraw.Draw(im)
            u = 11.0 * scale
            bx, by = (220 - cx) * scale + W / 2, (RMH - 40 - cy) * scale + H * 0.5
            stand = [(-2.4, 0), (-2.8, -11), (-2.0, -21), (2.0, -21), (2.8, -11), (2.6, -1.0), (2.4, 0)]
            d.polygon([(bx + x * u, by + y * u) for x, y in stand], fill=(1, 1, 2))
            hr = 2.3 * u
            d.ellipse([bx - hr, by - 24 * u - hr, bx + hr, by - 24 * u + hr], fill=(1, 1, 2))
            for gx, gy in GL:
                px, py = (gx - cx) * scale + W / 2, (gy - cy) * scale + H * 0.5
                r = 3.3 * scale
                d.ellipse([px - r, py - r, px + r, py + r], fill=(255, 225, 150))
        return np.asarray(im, np.float32)
    # far away: every room is one point of light in the dark - brighter once its window is lit
    x0, x1 = cx - W / 2 / scale, cx + W / 2 / scale
    y0, y1 = cy - H * 0.5 / scale, cy + H * 0.5 / scale
    i0, i1 = int(math.floor(x0 / COLW)), int(math.ceil(x1 / COLW))
    k0, k1 = int(math.floor(y0 / ROWH)), int(math.ceil(y1 / ROWH))
    ii, kk = np.meshgrid(np.arange(i0, i1 + 1), np.arange(k0, k1 + 1))
    dist = np.hypot(ii, kk * 0.8) + hash2(ii, kk) * 1.5
    gon = np.clip((rg - dist) / 1.5, 0, 1)
    win = np.clip((rw - dist) / 2, 0, 1)
    tw_ = 0.6 + 0.4 * np.sin(t * 2.2 + hash2(kk, ii) * 6.28)
    px = ((ii * COLW + 220 - cx) * scale + W / 2).ravel()
    py = ((kk * ROWH + 194 - cy) * scale + H * 0.5).ravel()
    val = (gon * tw_ * 0.9 + win * 0.6 * breathe).ravel()
    ok = (px >= 0) & (px < W - 2) & (py >= 0) & (py < H - 2) & (val > 0.01)
    acc = np.zeros((H, W), np.float32)
    rr = 1 if ppc < 9 else 2  # each point a small square, so the field reads as separate lights
    for oy in range(rr):
        for ox in range(rr):
            np.add.at(acc, (py[ok].astype(int) + oy, px[ok].astype(int) + ox), val[ok] * 1.3)
    acc = np.minimum(acc, 2.5)
    glow = np.asarray(Image.fromarray((np.minimum(acc, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2.2)),
                      np.float32) / 255
    lum = np.clip(acc * 0.8 + glow * 1.4, 0, 1.4)[..., None]
    a = np.array([3, 3, 5.0]) + lum * np.array([255, 205, 130.0])
    return np.clip(a, 0, 255)


def room_scene(t, rng, room_bg):
    """The outro: its room, the door held open, and it sits down in the light."""
    WW, HH = W * SS, H * SS
    im = room_bg.copy()
    d = ImageDraw.Draw(im)
    dx0, dy0, dx1, dy1 = 160 * SS, 590 * SS, 300 * SS, 880 * SS
    # the green door, open; on 'closing it' it swings a little - and stops
    swing = 0.25 * math.sin(math.pi * min(max((t - T["closing"]) / 1.6, 0), 1))
    a = 1.0 - swing
    glow = Image.new("RGB", im.size, (0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.rectangle([dx0, dy0, dx1, dy1], fill=(140, 255, 170))
    gd.polygon([(dx0, dy1), (dx1, dy1), (dx1 + 300 * SS, HH), (dx0 - 200 * SS, HH)], fill=(30, 110, 55))
    bl = glow.filter(ImageFilter.GaussianBlur(30 * SS))
    im = Image.fromarray(np.clip(np.asarray(im, np.float32) + np.asarray(bl, np.float32) * 0.5 +
                                 np.asarray(glow, np.float32) * 0.35, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(im)
    d.rectangle([dx0, dy0, dx1, dy1], fill=(160, 255, 185))
    xe = lerp(dx1, dx0 + 16 * SS, a)
    d.polygon([(dx0, dy0), (xe, dy0 - 20 * SS * a), (xe, dy1 + 8 * SS * a), (dx0, dy1)], fill=(24, 30, 26))
    d.rectangle([dx0 - 5 * SS, dy0 - 90 * SS, dx0 + 145 * SS, dy0 - 40 * SS], fill=(30, 190, 80))
    d.text((dx0 + 26 * SS, dy0 - 84 * SS), "EXIT", font=SIGN, fill=(245, 255, 245))
    # the page under the door, and the blue writing on the wall
    px, py = dx0 + 4 * SS, dy1 - 10 * SS
    d.polygon([(px, py), (px + 110 * SS, py - 6 * SS), (px + 110 * SS, py + 14 * SS), (px, py + 18 * SS)], fill=(240, 236, 222))
    d.text((310 * SS, 735 * SS), "there is a door", font=HAND, fill=(70, 130, 255))
    d.line([(560 * SS, 800 * SS), (dx1 + 14 * SS, 800 * SS)], fill=(70, 130, 255), width=4 * SS)
    d.line([(dx1 + 14 * SS, 800 * SS), (dx1 + 36 * SS, 784 * SS)], fill=(70, 130, 255), width=4 * SS)
    d.line([(dx1 + 14 * SS, 800 * SS), (dx1 + 36 * SS, 816 * SS)], fill=(70, 130, 255), width=4 * SS)
    # the pool of light, and it: standing, then sitting down in it, then looking up at us
    d.ellipse([340 * SS, 960 * SS, 740 * SS, 1090 * SS], fill=(150, 118, 68))
    sit = ease((t - T["sit"]) / 1.4)
    u = 26.0 * SS * 0.62
    fx, feet = 540 * SS, 1030 * SS
    seat = [(-3.2, 0), (-2.6, -9), (-1.2, -12.2), (1.4, -12.2), (2.2, -9.5), (4.4, -1.0), (3.0, 0)]
    stand = [(-2.4, 0), (-2.8, -11), (-2.0, -21), (2.0, -21), (2.8, -11), (2.6, -1.0), (2.4, 0)]
    body = [(fx + lerp(a_[0], b_[0], sit) * u, feet + lerp(a_[1], b_[1], sit) * u) for a_, b_ in zip(stand, seat)]
    d.polygon(body, fill=(6, 5, 4))
    hx, hy = fx + lerp(0, -0.2, sit) * u, feet + lerp(-24.0, -14.6, sit) * u
    hr = 2.3 * u
    d.ellipse([hx - hr, hy - hr, hx + hr, hy + hr], fill=(8, 6, 5))
    up = ease((t - T["dont"]) / 0.8)
    look = lerp(-0.8, 0.0, up)  # towards the door, then at us
    lift = -0.6 * up
    for ox in (-0.8, 0.8):
        gx, gy, r = hx + (ox + look) * u, hy + (-0.2 + lift) * u, 0.3 * u
        d.ellipse([gx - r, gy - r, gx + r, gy + r], fill=(255, 225, 150))
    return np.asarray(im.resize((W, H), Image.LANCZOS), np.float32)


def main():
    rng = np.random.default_rng(11)
    room_bg = build_room(np.random.default_rng(12))
    p = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                          str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p",
                          "out/drawn/leave-the-light-on.mp4"], stdin=subprocess.PIPE)
    x0 = T["outro"] - 0.6
    for n in range(int(DUR * FPS)):
        t = n / FPS
        if t < x0:
            a = field(t, rng)
        elif t < T["outro"] + 0.4:  # into the window
            u = ease((t - x0) / 1.0)
            a = field(t, rng) * (1 - u) + room_scene(t, rng, room_bg) * u
        else:
            a = room_scene(t, rng, room_bg)
        a = a + rng.normal(0, 3.5, (H, W, 1))
        p.stdin.write(np.clip(a, 0, 255).astype(np.uint8).tobytes())
        if n % (FPS * 4) == 0:
            print(f"{t:5.1f}s", flush=True)
    p.stdin.close()
    p.wait()
    json.dump({"title": "Leave the Light On", "episode": 11, "follows": "the-door", "finale": True, "song": SONG,
               "song_parts": [[S0, "end"]], "drawn": True, "times": {k: round(v, 2) for k, v in T.items()}},
              open("video/stories/leave-the-light-on.json", "w"), indent=1)


if __name__ == "__main__":
    main()
