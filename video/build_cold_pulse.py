"""'Cold Pulse': the song is the law. Composes the film from the two worlds video/cold_pulse.js rendered - the one the
song commanded (out/cold) and its twin, same seed, that never heard it (out/cold-twin) - onto the song.
The camera sinks with HEAVY and settles on the frozen floor for STILL; LOST is black with only the tick counter
running; FOUND brings the light back with the real count of who was born and who died in the dark; each PULSE is a
ring; LOST TIME is a cut; I is the camera finding one of the strangers that fell in on LIGHT DUST and following it
through the instrumental. When the song stops giving orders the twin slides in beside it, at the same tick.
Every number on screen is read from the engine's log.
    python3 video/build_cold_pulse.py        (writes out/drawn/cold-pulse.mp4, video only; the mux adds the song)
"""
import json
import math
import subprocess

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFont

F = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 704, 1280, 24
BIGF = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf", 72)
MONO = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 26)
SMALL = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 22)
ICE = (222, 236, 255)
CODE = (140, 184, 228)
SONG_LEN = 175.33
SPLIT = 159.0   # the last order has been given


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


class Reader:
    def __init__(self, path):
        self.p = subprocess.Popen([F, "-loglevel", "error", "-i", path, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                                  stdout=subprocess.PIPE)
        self.last = np.zeros((H, W, 3), np.uint8)

    def next(self):
        raw = self.p.stdout.read(W * H * 3)
        if len(raw) == W * H * 3:
            self.last = np.frombuffer(raw, np.uint8).reshape(H, W, 3)
        return self.last


def main():
    law = json.load(open("out/cold/log.json"))
    twin = json.load(open("out/cold-twin/log.json"))
    L, T2 = law["log"], twin["log"]
    words = []   # (time, word, text) as they actually fired
    for r in L:
        for e in r["ev"]:
            if e[0] == "word":
                words.append((r["t"], e[1], e[2]))
    wt = {}
    for t, w_, _ in words:
        wt.setdefault(w_, []).append(t)
    heavy0, still0 = wt["HEAVY"][0], wt["STILL"][0]
    lost0, found0 = wt["LOST"][0], wt["FOUND"][0]
    i0 = wt["I"][0]
    pulses = wt["PULSE"]
    colds = wt["COLD"]
    jumps = wt["TIME"]
    a_law, a_twin = Reader("out/cold/world.mp4"), Reader("out/cold-twin/world.mp4")
    n_end = int(SONG_LEN * FPS)
    cam = [W / 2, H / 2, 1.0]
    out = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                            str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p",
                            "out/drawn/cold-pulse.mp4"], stdin=subprocess.PIPE)
    rng = np.random.default_rng(5)
    for n in range(n_end):
        t = n / FPS
        r = L[min(n, len(L) - 1)]
        r2 = T2[min(n, len(T2) - 1)]
        fr = a_law.next().astype(np.float32)
        ft = a_twin.next()
        tr = r["tr"]

        # --- camera target
        tx, ty, tz, snap = W / 2, H / 2, 1.0, False
        if heavy0 <= t < lost0:   # sink with the gravity, then settle on the frozen floor
            z = 1 + 0.6 * ease((t - heavy0) / (still0 - heavy0)) + 0.6 * ease((t - still0) / 4)
            tx, ty, tz = W / 2, H - H / (2 * z), z
        if i0 <= t < SPLIT and tr:
            z = 1 + 1.4 * ease((t - i0) / 4) - 1.4 * ease((t - 138.0) / 3.5)
            tx, ty, tz = tr["x"], tr["y"], z
        if any(abs(t - j) < 0.6 / FPS for j in jumps + [found0]):
            snap = True
        k = 1.0 if snap else 0.12
        cam = [cam[0] + (tx - cam[0]) * k, cam[1] + (ty - cam[1]) * k, cam[2] + (tz - cam[2]) * k]
        cx, cy, z = cam
        cw, ch = W / z, H / z
        x0, y0 = min(max(cx - cw / 2, 0), W - cw), min(max(cy - ch / 2, 0), H - ch)
        im = Image.fromarray(fr.astype(np.uint8))
        if z > 1.001:
            im = im.resize((W, H), Image.LANCZOS, box=(x0, y0, x0 + cw, y0 + ch))
        toS = lambda x, y: ((x - x0) * z, (y - y0) * z)  # noqa: E731
        a = np.asarray(im, np.float32)

        # --- cold: from each COLD to just after its PULSE, the world turns to ice
        cold = 0.0
        for c0 in colds:
            p0 = min([p for p in pulses if p > c0], default=c0 + 1)
            if c0 <= t < p0 + 1.2:
                cold = max(cold, ease((t - c0) / 0.5) * (1 - ease((t - p0 - 0.3) / 0.9)))
        if cold > 0:
            g = a.mean(axis=2, keepdims=True)
            ice = np.concatenate([g * 0.75, g * 0.92, g * 1.2 + 10], axis=2)
            a = a * (1 - 0.8 * cold) + ice * 0.8 * cold
        flash = 0.0
        for p0 in pulses + [found0] + jumps:
            if 0 <= t - p0 < 0.35:
                flash = max(flash, 0.55 * (1 - (t - p0) / 0.35))
        if flash:
            a = a * (1 - flash) + np.array([210, 230, 255], np.float32) * flash
        # --- lost: the dark, where the world goes on
        dark = 0.0
        if lost0 <= t < found0:
            dark = ease((t - lost0) / 0.8)
        a *= 1 - dark
        im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))

        # --- the split: the twin slides in beside it
        sp = ease((t - SPLIT) / 2.0)
        if sp > 0:
            s = 1 - 0.5 * sp
            big = im.resize((int(W * s), int(H * s)), Image.LANCZOS)
            tw = Image.fromarray(ft).resize((int(W * 0.5), int(H * 0.5)), Image.LANCZOS)
            canvas = Image.new("RGB", (W, H), (0, 0, 0))
            lx = int((W - W * s) / 2 * (1 - sp))
            ly = int((H - H * s) / 2)
            canvas.paste(big, (lx, ly))
            canvas.paste(tw, (int(W / 2 + (1 - sp) * W / 2), int(H / 4)))
            im = canvas
        d = ImageDraw.Draw(im)

        # --- pulse rings
        for p0 in pulses:
            age = t - p0
            if 0 <= age < 1.1 and sp == 0:
                rad = 1500 * ease(age / 1.0) * z
                sx, sy = toS(W / 2, H / 2)
                al = 1 - age / 1.1
                col = tuple(int(c * al) for c in ICE)
                d.ellipse([sx - rad, sy - rad, sx + rad, sy + rad], outline=col, width=4)
        # --- the dark's one light: the ticks going by
        if dark > 0.5:
            s_ = f"tick {r['tick']:,}"
            d.text((W / 2 - d.textlength(s_, font=MONO) / 2, H / 2 - 13), s_, font=MONO, fill=(70, 82, 104))

        # --- I: one of the strangers
        if tr and i0 <= t < SPLIT + 2:
            fade = ease((t - i0) / 1.0) * (1 - sp)
            sx, sy = toS(tr["x"], tr["y"])
            if fade > 0:
                col = tuple(int(c * fade) for c in ICE)
                rr = 30
                if tr["alive"]:
                    d.ellipse([sx - rr, sy - rr, sx + rr, sy + rr], outline=col, width=2)
                    d.text((sx + rr + 10, sy - 20), "I", font=MONO, fill=col)
                ln = (f"age {tr['age']:,} ticks" if tr["alive"] else f"gone at age {tr['age']:,}")
                d.text((40, H - 150), ln, font=MONO, fill=tuple(int(c * fade) for c in CODE))
                d.text((40, H - 112), f"its line: {tr['line']} alive", font=MONO,
                       fill=tuple(int(c * fade) for c in CODE))

        # --- the words, and what the world did with them
        cur = None
        for j, (t0, w_, txt) in enumerate(words):
            if t0 <= t:
                cur = j
        if cur is not None and sp == 0:
            t0, w_, txt = words[cur]
            nxt = words[cur + 1][0] if cur + 1 < len(words) else 1e9
            label = w_
            if w_ in ("PULSE", "DUST", "TIME") and cur > 0 and t0 - words[cur - 1][0] < 1.6:
                label = words[cur - 1][1] + " " + w_
                if not txt:
                    txt = words[cur - 1][2]
            end = min(nxt, t0 + (3.4 if w_ == "FOUND" else 2.6))
            if w_ == "I":
                end = t0 + 2.2
            al = ease((t - t0) / 0.12) * (1 - ease((t - end + 0.35) / 0.35))
            if w_ in ("COLD", "LIGHT", "LOST") and nxt - t0 < 1.6:
                al = ease((t - t0) / 0.12)
            if w_ == "LOST" and txt:   # the dark's own caption
                al *= 1.0
            if al > 0:
                d.text((40, H - 290), label, font=BIGF, fill=tuple(int(c * al) for c in ICE))
                if txt:
                    d.text((42, H - 200), txt, font=MONO, fill=tuple(int(c * al) for c in CODE))

        # --- the split's captions
        if sp > 0:
            c1 = tuple(int(c * sp) for c in ICE)
            c2 = tuple(int(c * sp) for c in CODE)
            d.text((24, H / 4 - 70), "sung to", font=MONO, fill=c1)
            d.text((W / 2 + 24, H / 4 - 70), "never heard it", font=MONO, fill=c1)
            d.text((24, H / 4 - 36), "same seed", font=SMALL, fill=c2)
            d.text((W / 2 + 24, H / 4 - 36), "same seed", font=SMALL, fill=c2)
            for x, rr_ in ((24, r), (W / 2 + 24, r2)):
                d.text((x, 3 * H / 4 + 20), f"tick {rr_['tick']:,}", font=SMALL, fill=c2)
                d.text((x, 3 * H / 4 + 52), f"{rr_['N']} alive", font=MONO, fill=c1)
                d.text((x, 3 * H / 4 + 90), f"{rr_['lin']:,} lines ever", font=SMALL, fill=c2)
            if tr:
                al2 = ease((t - SPLIT - 4) / 1.0)
                if al2 > 0:
                    msg = f"the stranger's line: {tr['line']} alive" if tr["line"] else "the stranger's line: gone"
                    d.text((24, 3 * H / 4 + 140), msg, font=SMALL, fill=tuple(int(c * al2) for c in CODE))
        a = np.asarray(im, np.float32) + rng.normal(0, 2.5, (H, W, 1))
        out.stdin.write(np.clip(a, 0, 255).astype(np.uint8).tobytes())
        if n % 480 == 0:
            print(f"{t:6.1f}s  N {r['N']}  tick {r['tick']}  twin N {r2['N']}", flush=True)
    out.stdin.close()
    out.wait()
    json.dump({"title": "Cold Pulse", "song": "out/songs/cold-pulse.mp3", "seed": law["seed"],
               "ticks_per_frame": law["tpf"], "jump": law["jump"], "words": words,
               "end": {"law": {k: L[-1][k] for k in ("N", "tick", "lin")},
                       "twin": {k: T2[-1][k] for k in ("N", "tick", "lin")}, "stranger": L[-1]["tr"]}},
              open("video/stories/cold-pulse.json", "w"), indent=1)


if __name__ == "__main__":
    main()
