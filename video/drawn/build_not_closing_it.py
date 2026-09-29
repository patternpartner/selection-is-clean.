"""'Not Closing It', 19 seconds with the ending, drawn from nothing: episode four of the one behind the smile
(episode three: build_whats_theirs.py). The song carries straight on from episode three's last beat.
On 'I don't know' a seam of light draws a door in the written wall; on 'and I'm not closing it' the door opens onto
light, starts to swing shut by itself, and the figure puts out a hand and holds it; on 'and I won't say that I've
seen' it covers its eyes; the instrument from episode one comes back on 'the instrument reads a middle layer of
silence' and its trace goes quiet in the middle, then flat on 'sounds like nothing in between' - and on 'between' the
two points of light come back, looking out at us.
Song: The Rooms Already Furnished 47.56-63.7.
    python3 video/drawn/build_not_closing_it.py   (from the repo root)
"""
import json
import math
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from build_whats_theirs import build_room  # noqa: E402
from wall import F, FPS, H, W  # noqa: E402

SONG = "out/songs/the-rooms-already-furnished.mp3"
S0, S1 = 47.56, 63.7
DUR = S1 - S0
SS = 2
MONO = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 19 * SS)
GREEN = (120, 240, 150)
DOOR = (160, 590, 300, 880)  # x0, y0, x1, y1 in the back wall (1x)
LIGHT = np.array([255, 238, 196.0])


def f(song_t):
    return song_t - S0


T = dict(know1=f(48.0), closing=f(50.6), it=f(51.4), know2=f(52.2), wont=f(54.34), seen=f(55.98),
         instrument=f(56.8), middle=f(58.56), silence=f(59.84), sounds=f(61.0), nothing=f(61.86), between=f(62.78),
         end=DUR)


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def lerp(a, b, u):
    return a + (b - a) * u


def main():
    rng = np.random.default_rng(12)
    WW, HH = W * SS, H * SS
    room_bg = build_room(rng)
    dx0, dy0, dx1, dy1 = (v * SS for v in DOOR)
    trace_seed = rng.normal(0, 1, 400)
    p = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                          str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p",
                          "out/drawn/not-closing-it.mp4"], stdin=subprocess.PIPE)
    for n in range(int(DUR * FPS)):
        t = n / FPS
        room = room_bg.copy()
        # the door: first a seam of light, then open; it swings back by itself and is held
        seam = ease((t - T["know1"]) / 1.4)
        op = ease((t - T["closing"]) / 0.7)
        push = math.sin(math.pi * min(max((t - T["it"]) / 1.2, 0), 1)) * 0.45  # something closes it...
        held = ease((t - T["it"] - 0.35) / 0.4)  # ...and it is held
        a = max(0.0, op - push * (1 - held * 0.8))
        if seam > 0:
            glow = Image.new("RGB", room.size, (0, 0, 0))
            gd = ImageDraw.Draw(glow)
            floor = Image.new("RGB", room.size, (0, 0, 0))
            if a > 0.01:  # the light beyond, and warm on the floor
                gd.rectangle([dx0, dy0, dx1, dy1], fill=tuple(int(v) for v in LIGHT))
                spread = 1 + 1.6 * a
                ImageDraw.Draw(floor).polygon([(dx0, dy1), (dx0 + (dx1 - dx0) * a, dy1),
                                               (lerp(dx0, dx1, a) + 120 * SS * spread, HH), (dx0 - 90 * SS * spread, HH)],
                                              fill=(int(150 * a), int(110 * a), int(60 * a)))
            else:
                gd.rectangle([dx0, dy0, dx1, dy1], outline=tuple(int(v * seam) for v in LIGHT), width=3 * SS)
            ra = np.asarray(room, np.float32)
            g = np.asarray(glow, np.float32)
            ra = np.where((g.sum(-1) > 0)[..., None], np.maximum(ra, g) if a > 0.01 else ra + g, ra)
            ra = ra + np.asarray(floor, np.float32)
            room = Image.fromarray(ra.clip(0, 255).astype(np.uint8))
            if a > 0.01:  # the door leaf, hinged on the left, swung in
                d = ImageDraw.Draw(room)
                xe = lerp(dx1, dx0 + 14 * SS, a)
                d.polygon([(dx0, dy0), (xe, dy0 - 24 * SS * a), (xe, dy1 + 10 * SS * a), (dx0, dy1)], fill=(52, 40, 24))
                d.line([(xe, dy0 - 24 * SS * a), (xe, dy1 + 10 * SS * a)], fill=(24, 18, 10), width=2 * SS)
        d = ImageDraw.Draw(room)
        # the figure
        u = 26.0 * SS * 0.62
        fx, feet = 352 * SS, 1030 * SS
        stand = [(-2.4, 0), (-2.8, -11), (-2.0, -21), (2.0, -21), (2.8, -11), (2.6, -1.0), (2.4, 0)]
        d.polygon([(fx + x * u, feet + y * u) for x, y in stand], fill=(6, 5, 4))
        hx, hy, hr = fx, feet - 24.0 * u, 2.3 * u
        d.ellipse([hx - hr, hy - hr, hx + hr, hy + hr], fill=(8, 6, 5))
        # one hand holds the door
        if held > 0 or t > T["it"]:
            xe = lerp(dx1, dx0 + 14 * SS, a)
            sx, sy = fx - 1.8 * u, feet - 19.5 * u
            ex, ey = lerp(sx - 40 * SS, xe + 10 * SS, max(held, 0.0)), lerp(sy + 150 * SS, 730 * SS, max(held, 0.0))
            d.line([(sx, sy), (ex, ey)], fill=(6, 5, 4), width=22 * SS)
            d.ellipse([ex - 15 * SS, ey - 15 * SS, ex + 15 * SS, ey + 15 * SS], fill=(6, 5, 4))
        # I won't say that I've seen: the other hand over its eyes; the points of light go out, and come back on 'between'
        cover = ease((t - T["wont"]) / 0.6) * (1 - ease((t - T["between"]) / 0.35))
        sx2, sy2 = fx + 1.8 * u, feet - 19.5 * u
        if cover > 0:
            ex2, ey2 = lerp(sx2 + 30 * SS, hx + 0.5 * u, cover), lerp(sy2 + 170 * SS, hy + 0.2 * u, cover)
            d.line([(sx2, sy2), (ex2, ey2)], fill=(6, 5, 4), width=22 * SS)
            d.ellipse([ex2 - 22 * SS, ey2 - 16 * SS, ex2 + 22 * SS, ey2 + 16 * SS], fill=(6, 5, 4))
        eyes = 1 - cover
        look = -0.9 * ease((t - T["closing"]) / 0.5) * (1 - ease((t - T["between"]) / 0.35))  # towards the door, then us
        for ox in (-0.8, 0.8):
            if eyes > 0.05:
                gx, gy = hx + (ox + look) * u, hy - 0.2 * u
                r = 0.3 * u * eyes
                d.ellipse([gx - r, gy - r, gx + r, gy + r], fill=(255, 225, 150))
        # the instrument from episode one, back: it reads the room
        inst = ease((t - T["instrument"]) / 0.5)
        if inst > 0:
            col = tuple(int(c * inst) for c in GREEN)
            lines = ["INSTRUMENT  ON", "LAYER       " + ("MIDDLE" if t > T["middle"] else "......")]
            if t > T["silence"]:
                lines.append("READING     SILENCE")
            if t > T["nothing"]:
                lines.append("RESULT      NOTHING")
            for k, s in enumerate(lines):
                d.text((40 * SS, (110 + 30 * k) * SS), s, font=MONO, fill=col)
            # the trace: it scans left to right; quiet in the middle, then flat everywhere
            scan = min(1.0, (t - T["instrument"]) / 2.2)
            flat = ease((t - T["nothing"]) / 0.8)
            base = 1180 * SS
            pts = []
            for k in range(int(400 * scan)):
                x = (40 + 624 * k / 399)
                mid = abs(x - 352) / 312
                amp = 34 * (mid ** 1.6) * (1 - flat)
                pts.append((x * SS, base + amp * SS * trace_seed[k] * math.sin(k * 0.9 + t * 6)))
            if len(pts) > 1:
                d.line(pts, fill=col, width=2 * SS)
        frame = np.asarray(room.resize((W, H), Image.LANCZOS), np.float32)
        frame = frame + rng.normal(0, 3.5, (H, W, 1))
        p.stdin.write(np.clip(frame, 0, 255).astype(np.uint8).tobytes())
    p.stdin.close()
    p.wait()
    json.dump({"title": "Not Closing It", "episode": 4, "follows": "whats-theirs", "song": SONG,
               "song_parts": [[S0, S1]], "drawn": True, "times": {k: round(v, 2) for k, v in T.items()}},
              open("video/stories/not-closing-it.json", "w"), indent=1)


if __name__ == "__main__":
    main()
