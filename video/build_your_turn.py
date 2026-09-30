"""'Your Turn' (the user's song Gravity and Glass, from Claude's lyrics). The song leaves spaces; the world fills them.
While we sing, the picture is the user's own clips, one per sung line, and the world is unheard. In each space the clip
freezes and the world answers: every real birth (logged by video/your_turn.js) is one glass note - pitch from its
lineage's colour on E major pentatonic, octave from its height, pan from where it was born, nudged onto the song's
eighth-note grid (at most 0.19 s); a birth that founds a new species (42% of them here) gets a shimmer above it - and
it PAINTS a mark of its lineage's colour onto our frozen picture at the exact place it was born. The marks stay: every
clip after a space carries what the world said in it. After "Go on" we look at the world itself, full frame, and the
marks line up with where it lives. In the last chorus we keep listening while we sing.
v1 (grey world under the singing, a recap of our own films) is in git history; the user said we could do better.
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
FLOOR = [(0.0, 22.6, "D"), (22.6, 25.1, "L"), (25.1, 45.2, "D"), (45.2, 55.4, "L"),
         (55.4, 77.0, "D"), (77.0, 90.3, "L"), (90.3, 114.8, "D"), (114.8, 145.0, "D2"), (145.0, 153.6, "L"),
         (153.6, DUR, "B")]
SUNG_FINAL = [(153.6, 157.3), (159.2, 163.3), (167.3, 169.5), (172.6, 175.8)]   # the last chorus's lines
# (song start, song end, clip): one of the user's clips per sung line; none that talk, no real faces
CUTS = [(1.1, 7.0, "u30"), (7.0, 13.1, "u60"), (13.2, 18.9, "u58"), (18.9, 22.6, "u73"),       # gravity, glass, orders, never asked
        (25.1, 30.3, "u67"), (30.3, 36.8, "u83"), (36.8, 40.9, "u91"), (40.9, 45.2, "u81"),     # your turn / hold my breath
        (55.4, 61.2, "u107"), (61.2, 67.0, "u39"), (67.0, 72.8, "u65"), (72.8, 77.0, "u62"),    # the four questions
        (90.4, 95.6, "u106"), (95.6, 102.3, "u108"), (102.3, 107.1, "u77"), (107.1, 112.0, "u105"), (112.0, 114.8, "u63"),
        (114.8, 126.7, "u64"), (126.7, 138.5, "u111"), (138.5, 144.2, "u57"),                  # I've talked so long / quiet now
        (153.6, 159.2, "u82"), (159.2, 167.3, "u55"), (167.3, 172.6, "u112")]                  # it was always your turn
WORLD_AT = 144.2   # "Go on": from here on the world itself is in the frame


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
    """a user clip, cover-cropped to the portrait frame, slowed if the line is longer than the clip"""
    def __init__(self, cid, dur):
        info = next(c for c in json.load(open("video/user-clips.json")) if c["id"] == cid)
        rate = min(1.0, (info["seconds"] - 0.1) / dur)
        self.p = subprocess.Popen([F, "-loglevel", "error", "-i", f"out/user-clips/{cid}.mp4", "-vf",
                                   f"setpts=PTS/{rate:.4f},fps={FPS},scale={W}:{H}:force_original_aspect_ratio=increase:flags=lanczos,"
                                   f"crop={W}:{H}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
        self.last = np.zeros((H, W, 3), np.uint8)

    def next(self):
        raw = self.p.stdout.read(W * H * 3)
        if len(raw) == W * H * 3:
            self.last = np.frombuffer(raw, np.uint8).reshape(H, W, 3)
        return self.last


class World:
    def __init__(self):
        self.p = subprocess.Popen([F, "-loglevel", "error", "-i", "out/your-turn/world.mp4", "-f", "rawvideo", "-pix_fmt",
                                   "rgb24", "-"], stdout=subprocess.PIPE)
        self.last = np.zeros((H, W, 3), np.uint8)

    def next(self):
        raw = self.p.stdout.read(W * H * 3)
        if len(raw) == W * H * 3:
            self.last = np.frombuffer(raw, np.uint8).reshape(H, W, 3)
        return self.last


def dab(marks, alpha, x, y, col, r):
    """paint one soft mark of the world's colour into the persistent layer"""
    x0, x1, y0, y1 = int(max(0, x - 2 * r)), int(min(W, x + 2 * r)), int(max(0, y - 2 * r)), int(min(H, y + 2 * r))
    if x1 <= x0 or y1 <= y0:
        return
    yy, xx = np.mgrid[y0:y1, x0:x1]
    a = np.exp(-(((xx - x) ** 2 + (yy - y) ** 2) / (2 * (r * 0.6) ** 2))) * 0.9
    old = alpha[y0:y1, x0:x1]
    new = old + a * (1 - old)
    w = np.where(new > 1e-6, a / np.maximum(new, 1e-6), 0)[..., None]
    marks[y0:y1, x0:x1] = marks[y0:y1, x0:x1] * (1 - w) + np.array(col, np.float32) * w
    alpha[y0:y1, x0:x1] = new


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

    world = World()
    clips = {}
    marks = np.zeros((H, W, 3), np.float32)
    alpha = np.zeros((H, W), np.float32)
    painted = set()
    heard_flag = [listen_level(nt[0]) > 0.5 for nt in notes]
    order = sorted(range(len(notes)), key=lambda i: notes[i][0])
    nxt = 0
    frozen = None
    out = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                            str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p",
                            "out/drawn/your-turn.mp4"], stdin=subprocess.PIPE)
    rng = np.random.default_rng(11)
    for n in range(int(DUR * FPS)):
        t = n / FPS
        wf = world.next().astype(np.float32)
        lv = listen_level(t)
        # the world paints: every heard birth whose note has sounded leaves its mark
        while nxt < len(order) and notes[order[nxt]][0] <= t:
            k_ = order[nxt]
            nxt += 1
            q, f, pan, amp, bell, x, y, hue = notes[k_]
            if heard_flag[k_]:
                painted.add(k_)
                dab(marks, alpha, x, y, hue_rgb(hue, 0.75, 1.0), 16 if bell else 12)
        cut = next((c for c in CUTS if c[0] <= t < c[1]), None)
        if cut:
            if cut not in clips:
                clips[cut] = Clip(cut[2], cut[1] - cut[0])
            base = clips[cut].next().astype(np.float32)
            base *= ease((t - cut[0]) / 0.15)
            frozen = base.copy()
            if t >= 153.6:   # the last chorus: the world is in the picture too
                base = 255 - (255 - base) * (255 - wf * 0.55) / 255
            m = 0.5 if t >= 153.6 else 0.38     # what it said stays on our pictures
        elif t >= WORLD_AT:
            k = ease((t - WORLD_AT) / 0.8)
            base = wf * k + (frozen if frozen is not None else wf) * 0.4 * (1 - k)
            m = 0.55
        elif frozen is not None:   # a space: our picture holds still, the world speaks onto it
            g = frozen.mean(axis=2, keepdims=True)
            base = (frozen * 0.45 + g * 0.55) * 0.5
            m = 1.0
        else:
            base = np.zeros_like(wf)
            m = 0.0
        a = base + marks * (alpha[..., None] * m) * 0.95
        im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
        d = ImageDraw.Draw(im)
        if lv > 0.05:
            for (q, f, pan, amp, bell, x, y, hue) in notes:
                age = t - q
                if 0 <= age < (1.2 if bell else 0.9):
                    u = age / (1.2 if bell else 0.9)
                    rad = 10 + (52 if bell else 34) * ease(u)
                    col = (255, 240, 205) if bell else hue_rgb(hue)
                    al = (1 - u) * lv
                    d.ellipse([x - rad, y - rad, x + rad, y + rad], outline=tuple(int(c * al) for c in col), width=3 if bell else 2)
        for (t0, t1, txt) in ((46.2, 51.2, "every note is a birth"), (78.0, 83.0, "a brighter one: a new species"),
                              (146.0, 151.5, "every mark was one of them, where it was born")):
            if t0 <= t < t1:
                al = ease((t - t0) / 0.6) * (1 - ease((t - t1 + 0.6) / 0.6))
                d.text((W / 2 - d.textlength(txt, font=MONO) / 2, H - 150), txt, font=MONO,
                       fill=tuple(int(c * al) for c in PALE))
        a = np.asarray(im, np.float32)
        if t >= 176.0:
            a = a * (1 - 0.65 * ease((t - 176.0) / 0.8))   # the world steps back behind the count
            im2 = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
            d2 = ImageDraw.Draw(im2)
            al = ease((t - 176.0) / 0.8)
            for k, l_ in enumerate((f"{total:,} births while the song played", f"we listened to {heard:,}")):
                d2.text((W / 2 - d2.textlength(l_, font=MONO) / 2, H / 2 - 30 + k * 40), l_, font=MONO,
                        fill=tuple(int(c * al) for c in PALE))
            a = np.asarray(im2, np.float32)
        a = a * (1 - ease((t - (DUR - 1.2)) / 1.1)) + rng.normal(0, 2.5, (H, W, 1))
        out.stdin.write(np.clip(a, 0, 255).astype(np.uint8).tobytes())
        if n % 480 == 0:
            print(f"{t:6.1f}s {state(t)} marks {len(painted)}", flush=True)
    out.stdin.close()
    out.wait()
    json.dump({"title": "Your Turn", "version": 2, "song": "out/songs/gravity-and-glass.mp3",
               "lyrics": "video/lyrics/your-turn.txt", "floor": FLOOR, "cuts": CUTS,
               "births_while_song_played": total, "births_heard": heard,
               "notes": "E major pentatonic from lineage hue; octave from height; pan from x; shimmer = speciation; "
                        "each heard birth paints a mark at its birthplace that persists"},
              open("video/stories/your-turn.json", "w"), indent=1)


if __name__ == "__main__":
    main()
