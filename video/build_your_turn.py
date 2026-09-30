"""'Your Turn' (the user's song Gravity and Glass, from Claude's lyrics). The song leaves spaces; the world fills them.
While we sing, the world is dim and silent - it is still living, we are just not listening. In the spaces the colour
comes back and the world is heard: every real birth (logged by video/your_turn.js) is one glass note - pitch from its
lineage's colour on E major pentatonic, octave from its height, pan from where it was born, nudged onto the song's
eighth-note grid (at most 0.19 s) - and a birth that founds a new species (42% of them here) is the same note with a shimmer above it. In the last chorus we keep
listening while we sing. The opening recaps what we did to it: gravity (Cold Pulse), the glass (The Observer), orders.
    python3 video/build_your_turn.py     (writes out/drawn/your-turn.mp4 and out/your-turn/world-voice.wav)
"""
import colorsys
import json
import subprocess

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFont

F = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS, SR = 704, 1280, 24, 44100
SONG_END = 177.0
DUR = 180.0
MONO = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 24)
PALE = (215, 225, 235)
GRID, PHASE = 60 / 156.4, 0.01          # the song's beat (song_scan), used as the eighth-note grid
PENTA = [0, 2, 4, 7, 9]                 # E major pentatonic, semitones above E
E4 = 329.63

# who has the floor: (start, end, state). D = we are singing (world dim, unheard), L = listening, B = both (final)
FLOOR = [(0.0, 21.5, "R"), (21.5, 22.6, "D"), (22.6, 25.1, "L"), (25.1, 45.2, "D"), (45.2, 55.4, "L"),
         (55.4, 77.0, "D"), (77.0, 90.3, "L"), (90.3, 114.8, "D"), (114.8, 145.0, "D2"), (145.0, 153.6, "L"),
         (153.6, DUR, "B")]
SUNG_FINAL = [(153.6, 157.3), (159.2, 163.3), (167.3, 169.5), (172.6, 175.8)]   # the last chorus's lines
RECAP = [(1.1, 7.0, "out/drawn/cold-pulse.mp4", 32.0), (7.0, 13.1, "out/drawn/the-observer.mp4", 9.0),
         (13.2, 18.9, "out/drawn/cold-pulse.mp4", 65.4)]   # gravity, the glass, the orders


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def state(t):
    for a, b, s in FLOOR:
        if a <= t < b:
            return s
    return "B"


def listen_level(t):
    """how much the world has the floor: 1 = heard and in colour, 0 = dim and silent (0.4 s crossfades)"""
    def lv(s, t):
        if s in ("L",):
            return 1.0
        if s == "B":
            return 0.55 if any(a <= t < b for a, b in SUNG_FINAL) else 1.0
        return 0.0
    k = 0.4
    vals = [lv(state(t + d), t + d) for d in np.linspace(-k, 0, 5)]
    return float(np.mean(vals))


def hue_rgb(h, s=0.6, v=1.0):
    r, g, b = colorsys.hsv_to_rgb((h % 360) / 360, s, v)
    return int(r * 255), int(g * 255), int(b * 255)


def notes_from(log):
    """every birth -> (play time, freq, pan, amp, is_bell, x, y, hue)"""
    out = []
    for n, r in enumerate(log):
        for j, (x, y, hue, rep, spec) in enumerate(r["b"]):
            t = (n + j / max(1, len(r["b"]))) / FPS
            q = PHASE + np.ceil((t - PHASE) / (GRID / 2)) * (GRID / 2)   # onto the next eighth
            deg = PENTA[int(hue / 360 * 5) % 5]
            octv = 2 if y < H / 3 else (1 if y < 2 * H / 3 else 0)
            f = E4 * 2 ** ((deg + 12 * octv) / 12)
            out.append((q, f, x / W, 1.0, spec, x, y, hue))
    return out


def synth(notes, gain_at):
    L = np.zeros(int(DUR * SR) + SR * 4)
    R = np.zeros_like(L)
    slots = {}
    for nt in notes:
        slots.setdefault(round(nt[0], 3), []).append(nt)
    for q, group in slots.items():
        g = gain_at(q)
        if g <= 0.01:
            continue
        k = len(group)
        for (t, f, pan, amp, bell, *_ ) in group[:4]:
            a = amp * g / np.sqrt(k)
            d = 1.8 if bell else 1.6
            tt = np.arange(int(d * SR)) / SR
            env = np.exp(-tt * 2.6) * np.minimum(1, tt / 0.006)
            w = np.sin(2 * np.pi * f * tt) + 0.28 * np.sin(2 * np.pi * f * 2.01 * tt) * np.exp(-tt * 3) \
                + 0.1 * np.sin(2 * np.pi * f * 3.98 * tt) * np.exp(-tt * 6)
            if bell:   # a new species: the same glass, with a shimmer a twelfth above
                w = w + 0.42 * np.sin(2 * np.pi * f * 3 * tt) * np.exp(-tt * 1.8) \
                    + 0.18 * np.sin(2 * np.pi * f * 4.5 * tt) * np.exp(-tt * 2.4)
            s = w * env * a * 0.16
            i0 = int(t * SR)
            L[i0:i0 + len(s)] += s * np.sqrt(1 - pan)
            R[i0:i0 + len(s)] += s * np.sqrt(pan)
    # a little room: two short echoes
    for dl, gn in ((0.19, 0.28), (0.41, 0.16)):
        sh = int(dl * SR)
        L[sh:] += R[:-sh] * gn
        R[sh:] += L[:-sh] * gn
    st = np.stack([L, R], 1)[: int(DUR * SR)]
    return np.clip(st, -1, 1)


class Clip:
    def __init__(self, path, start):
        self.p = subprocess.Popen([F, "-loglevel", "error", "-ss", f"{start:.2f}", "-i", path, "-vf", f"fps={FPS},scale={W}:{H}",
                                   "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
        self.last = np.zeros((H, W, 3), np.uint8)

    def next(self):
        raw = self.p.stdout.read(W * H * 3)
        if len(raw) == W * H * 3:
            self.last = np.frombuffer(raw, np.uint8).reshape(H, W, 3)
        return self.last


def main():
    log = json.load(open("out/your-turn/log.json"))["log"]
    notes = notes_from(log)
    total = sum(len(r["b"]) for r in log[: int(SONG_END * FPS)])
    heard = sum(1 for nt in notes if nt[0] < SONG_END and listen_level(nt[0]) > 0.5)
    print(f"births while the song played: {total}; in the spaces: {heard}", flush=True)
    voice = synth(notes, listen_level)
    raw = (voice * 32767).astype(np.int16).tobytes()
    subprocess.run([F, "-loglevel", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "2", "-i", "-",
                    "out/your-turn/world-voice.wav"], input=raw, check=True)

    world = Clip("out/your-turn/world.mp4", 0)
    recaps = {}
    out = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                            str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p",
                            "out/drawn/your-turn.mp4"], stdin=subprocess.PIPE)
    rng = np.random.default_rng(11)
    yy, xx = np.mgrid[0:H, 0:W]
    vign = np.clip(1.25 - np.sqrt(((xx - W / 2) / W) ** 2 + ((yy - H / 2) / H) ** 2) * 1.3, 0, 1)[..., None]
    for n in range(int(DUR * FPS)):
        t = n / FPS
        fr = world.next().astype(np.float32)
        s = state(t)
        if s == "R":
            rec = next((r for r in RECAP if r[0] <= t < r[1]), None)
            if rec:
                if rec not in recaps:
                    recaps[rec] = Clip(rec[2], rec[3])
                c = recaps[rec].next().astype(np.float32)
                g = c.mean(axis=2, keepdims=True)
                a = (c * 0.55 + g * 0.45) * 0.8 * vign        # a memory: faded, vignetted
                a *= ease((t - rec[0]) / 0.3) * (1 - ease((t - rec[1] + 0.35) / 0.35))
            else:
                a = np.zeros_like(fr)
                if t >= 21.0:   # the world, before anyone asked it anything
                    a = fr * 0.3 * ease((t - 21.0) / 1.0)
        else:
            lv = listen_level(t)
            dim = 0.28 if s != "D2" else 0.2
            g = fr.mean(axis=2, keepdims=True)
            grey = (fr * 0.25 + g * 0.75) * dim
            a = grey * (1 - lv) + fr * lv
        im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
        d = ImageDraw.Draw(im)
        # the notes, seen: a ring where each heard birth happened, as its note sounds
        lvn = listen_level(t) if s != "R" else 0
        if lvn > 0.05:
            for (q, f, pan, amp, bell, x, y, hue) in notes:
                age = t - q
                if 0 <= age < (1.2 if bell else 0.9):
                    u = age / (1.2 if bell else 0.9)
                    rad = (10 + (52 if bell else 34) * ease(u))
                    col = (255, 236, 190) if bell else hue_rgb(hue)
                    al = (1 - u) * lvn
                    d.ellipse([x - rad, y - rad, x + rad, y + rad], outline=tuple(int(c * al) for c in col), width=3 if bell else 2)
        # three captions, once each
        for (t0, t1, txt) in ((46.0, 51.0, "every note is a birth"), (78.0, 83.0, "a brighter one: a new species")):
            if t0 <= t < t1:
                al = ease((t - t0) / 0.6) * (1 - ease((t - t1 + 0.6) / 0.6))
                d.text((W / 2 - d.textlength(txt, font=MONO) / 2, H - 150), txt, font=MONO,
                       fill=tuple(int(c * al) for c in PALE))
        a = np.asarray(im, np.float32)
        if t >= 176.0:
            a = a * (1 - 0.65 * ease((t - 176.0) / 0.8))   # the world steps back behind the count
            im2 = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
            d2 = ImageDraw.Draw(im2)
            l1 = f"{total:,} births while the song played"
            l2 = f"we listened to {heard:,}"
            al = ease((t - 176.0) / 0.8)
            for k, l_ in enumerate((l1, l2)):
                d2.text((W / 2 - d2.textlength(l_, font=MONO) / 2, H / 2 - 30 + k * 40), l_, font=MONO,
                        fill=tuple(int(c * al) for c in PALE))
            a = np.asarray(im2, np.float32)
        a = a * (1 - ease((t - (DUR - 1.2)) / 1.1)) + rng.normal(0, 2.5, (H, W, 1))
        out.stdin.write(np.clip(a, 0, 255).astype(np.uint8).tobytes())
        if n % 480 == 0:
            print(f"{t:6.1f}s {s}", flush=True)
    out.stdin.close()
    out.wait()
    json.dump({"title": "Your Turn", "song": "out/songs/gravity-and-glass.mp3", "lyrics": "video/lyrics/your-turn.txt",
               "floor": FLOOR, "births_while_song_played": total, "births_heard": heard,
               "notes": "E major pentatonic from lineage hue; octave from height; pan from x; brighter note (shimmer) = speciation"},
              open("video/stories/your-turn.json", "w"), indent=1)


if __name__ == "__main__":
    main()
