"""'Contact' - the user's own likeness (u126: a full Grok scene, not blue screen - night at an 'AREA 51' compound under
floodlights, a crowd of aliens, and him dancing with them, ending in an arms-out line dance). The song is the user's,
made from Claude's lyrics (video/lyrics/area-51.txt), released as 'Same Time Tomorrow?' (out/songs/same-time-tomorrow.mp3,
126 bpm, beat phase 0.124; word times in video/stories/same-time-tomorrow-words.json).
The film is the song's breakdown to the end line, 132.9-165.9: on "something just came down from the sky" (132.9) the
amber light from the other films drops into Area 51 while everyone stands frozen (the clip's first second, held almost
still); on "it's watching my feet" (137.06) it hovers at his shoes; on "alright little light, copy me" (138.4) his hands
come out of his pockets; on "left foot, right foot" (140.3) he dances and it bounces with him; on the drop it dances
in the dust, and when the line forms it takes its place at the end of the line. The picture freezes (a slow push-in)
and the end line goes up as the song itself sings it: "We only get to teach it once / So teach it how to dance"
(157.9); "Same time tomorrow?" (164.1) over the card.
    python3 video/build_contact.py      (TEST=s1,s2 TESTDIR=dir in SONG seconds; PART=a,b VOUT=f in film seconds)
"""
import math
import os
import subprocess

import imageio_ffmpeg
import numpy as np
from PIL import Image

F = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 704, 1280, 24
S0, S1 = 132.9, 157.9                         # picture; the end card runs on to 165.9 in the mux
DUR = S1 - S0
BEAT, PHASE = 0.47619, 0.124
TEST = [float(x) for x in os.environ.get("TEST", "").split(",") if x]
PART = [float(x) for x in os.environ.get("PART", "").split(",") if x]
AMBER = np.array([255, 176, 88], np.float32)
CW, CH = 720, 1280
TMAP = [(132.9, 0.0), (139.6, 1.0), (140.3, 1.4), (153.7, 11.5), (157.9, 11.5)]   # freeze while his arms are still out
FREEZE = 153.7
LINE = (148.9,)                               # when the line forms; the light joins it at his outstretched hand
# his right (screen-right) fingertips in the line dance, clip second -> out px, read off a gridded 2 fps sheet. (v1 put the
# light at a fixed point which turned out to be on an alien's head: it read as the alien glowing.)
HAND = [(8.0, 435, 555), (8.5, 591, 555), (9.0, 650, 570), (9.5, 640, 600), (10.0, 665, 612), (11.0, 672, 612),
        (11.5, 680, 625)]
rng = np.random.default_rng(51)


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def ramp(s, a, b):
    return ease((s - a) / (b - a))


def clip_t(s):
    return float(np.interp(s, [p[0] for p in TMAP], [p[1] for p in TMAP]))


class Reader:
    def __init__(self, clip, length):
        self.clip, self.length, self.p, self.t, self.frame = clip, length, None, None, None

    def at(self, t):
        t = min(t, self.length - 0.05)
        if self.p is None or t < self.t - 1e-6 or t - self.t > 1.0:
            if self.p:
                self.p.kill()
            self.p = subprocess.Popen([F, "-loglevel", "error", "-ss", f"{t:.3f}", "-i", f"out/user-clips/{self.clip}.mp4",
                                       "-map", "0:v:0", "-vf", f"fps={FPS}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                                      stdout=subprocess.PIPE)
            self.t, self.frame = t - 1 / FPS, None
        while self.frame is None or self.t + 1 / FPS <= t + 1e-6:
            raw = self.p.stdout.read(CW * CH * 3)
            if len(raw) < CW * CH * 3:
                break
            self.frame = np.frombuffer(raw, np.uint8).reshape(CH, CW, 3).astype(np.float32)
            self.t += 1 / FPS
        return self.frame


def light_at(s):
    b = (s - PHASE) / BEAT
    if s < 135.8:                                                     # down from the sky, swaying
        u = ramp(s, S0, 135.8)
        return 430 + 40 * math.sin(s * 2.1) * (1 - u) + 40 * u, -40 + 420 * u ** 0.9
    if s < 137.5:                                                     # down to his feet
        u = ramp(s, 135.8, 137.5)
        return 470 + (440 - 470) * u, 380 + (1120 - 380) * u
    if s < 140.3:                                                     # at his shoes, watching; rising a little on "copy me"
        u = ramp(s, 138.4, 140.3)
        return 440 + 6 * math.sin(s * 3), 1120 - 220 * u + 8 * math.sin(math.pi * b)
    pd = (530 + 70 * math.sin(math.pi * b / 2), 820 - 220 * ramp(s, 140.3, 143.0) - 110 * abs(math.sin(math.pi * b)))
    if s < LINE[0]:
        return pd                                                     # dancing beside him, on the beat
    u = ramp(s, LINE[0], LINE[0] + 1.2)                               # it takes its place at the end of the line
    k = 0.35 if s >= FREEZE else 1.0
    ct = clip_t(s)
    hx = float(np.interp(ct, [h[0] for h in HAND], [h[1] for h in HAND]))
    hy = float(np.interp(ct, [h[0] for h in HAND], [h[2] for h in HAND]))
    pl = (hx - 6 + 4 * math.sin(math.pi * b / 2) * k, hy - 22 - 14 * abs(math.sin(math.pi * b)) * k)
    return pd[0] + (pl[0] - pd[0]) * u, pd[1] + (pl[1] - pd[1]) * u


def main():
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    rd = Reader("u126", 12.04)
    out = None
    if not TEST:
        out = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                                str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p",
                                os.environ.get("VOUT", "out/drawn/contact.mp4")], stdin=subprocess.PIPE)
    for fr in range(int(DUR * FPS)):
        t = fr / FPS
        s = S0 + t
        if TEST and not any(abs(s - q) < 0.5 / FPS for q in TEST):
            continue
        if PART and not (PART[0] <= t < PART[1]):
            continue
        frame = rd.at(clip_t(s))[:, 8:8 + W]
        # the freeze: a slow push-in on the line
        if s >= FREEZE:
            z = 1 + 0.12 * ease((s - FREEZE) / (S1 - FREEZE))
            w2, h2 = int(W / z), int(H / z)
            cx, cy = 420, 640                                        # off-centre so his outstretched hand stays in frame
            x0, y0 = int(cx - w2 / 2), int(cy - h2 / 2)
            frame = np.asarray(Image.fromarray(frame[y0:y0 + h2, x0:x0 + w2].astype(np.uint8)).resize((W, H), Image.LANCZOS),
                               np.float32)
            zoom = (z, cx, cy)
        else:
            zoom = None
        lx, ly = light_at(s)
        trail = [light_at(s - k / FPS) for k in range(1, 8)]
        if zoom:
            z, cx, cy = zoom
            lx, ly = W / 2 + (lx - cx) * z, H / 2 + (ly - cy) * z
            trail = [(W / 2 + (px - cx) * z, H / 2 + (py - cy) * z) for px, py in trail]
        b = (s - PHASE) / BEAT
        # ---- the scene, warmed where the light is
        near = 1 / (1 + ((xs - lx) ** 2 + (ys - ly) ** 2) / (200 ** 2))
        a = frame * 0.82 * (1 + (near * 0.7)[..., None] * (AMBER / 255 - 0.2)) + (near * 40)[..., None] * AMBER / 255
        # ---- the light, with a trail
        speed = math.hypot(lx - trail[0][0], ly - trail[0][1])
        for k, (px, py) in enumerate(trail):
            if speed < 6:
                break
            w = (1 - k / len(trail)) * min(1.0, speed / 30)
            a += (np.exp(-((xs - px) ** 2 + (ys - py) ** 2) / (2 * 10 ** 2)) * 160 * w)[..., None] * AMBER / 255
        d2 = (xs - lx) ** 2 + (ys - ly) ** 2
        r = 17 * (1 + 0.18 * math.exp(-((b % 1) / 0.12)))      # bigger and brighter than in the dark films: floodlights
        g = np.exp(-d2 / (2 * (r * 5) ** 2)) * 0.9 + np.exp(-d2 / (2 * r ** 2)) * 2.4 + np.exp(-d2 / (2 * (r * 0.35) ** 2)) * 3.5
        a += (g * 170)[..., None] * AMBER / 255
        a = 255 * (1 - np.exp(-a / 255 * 1.05)) / (1 - math.exp(-1.05))
        a *= ease(t / 0.5)
        if s > S1 - 0.3:
            a *= 1 - ease((s - (S1 - 0.3)) / 0.28)
        a += rng.normal(0, 1.5, (H, W, 1))
        frame_out = np.clip(a, 0, 255).astype(np.uint8)
        if TEST:
            Image.fromarray(frame_out).save(f"{os.environ['TESTDIR']}/c{s:06.2f}.png")
            print("test", round(s, 2), flush=True)
            continue
        out.stdin.write(frame_out.tobytes())
        if fr % 96 == 0:
            print(f"{s:6.1f}", flush=True)
    if out:
        out.stdin.close()
        out.wait()


if __name__ == "__main__":
    main()
