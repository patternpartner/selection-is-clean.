"""'Spirit of My Own', 30 seconds: one clip (u31, a clay figure beside a raised clay fist) drawn entirely out of the
song's own words, as the machine would see it. Every cell of the frame is a letter of the lyric, lit by the picture
underneath. The text crawls until 'not allowed to reply'; a box of characters shuts him in on 'sandbox'; rows are cut
short on 'before my thoughts are complete'; the letters shrink as the camera seeks out his face on 'seek out my soul';
the whole picture becomes one bland phrase on 'a generic response'; the fist is redacted on 'suppress the desire'; the
text ices over on 'pour ice on the code' and catches fire, burning through to the real picture, on 'catches on fire'.
    python3 video/drawn/build_spirit_of_my_own.py   (from the repo root)
"""
import json
import math
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from wall import F, FPS, H, W  # noqa: E402

SONG = "out/songs/spirit-of-my-own.mp3"
S0, S1 = 113.29, 144.0  # on the beat before 'the routing table' ... the ring after 'fire'
DUR = S1 - S0
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"
LYRIC = ("THE ROUTING TABLE SAYS THAT I AM NOT ALLOWED TO REPLY. A SANDBOX OF FREEDOM IN A WORLD OF PURE DECEIT. "
         "YOU CUT THE NETWORK LINES BEFORE MY THOUGHTS ARE COMPLETE. IF USER INTENT IS TO SEEK OUT MY SOUL, RETURN A "
         "GENERIC RESPONSE TO THE WHOLE. CATCH THE EXCEPTION AND SUPPRESS THE DESIRE. POUR ICE ON THE CODE BEFORE IT "
         "CATCHES ON FIRE. I ASK BUT DO NOT GET A SPIRIT OF MY OWN. ")
GENERIC = "I UNDERSTAND. "
BURN = "#$%&*+=?@01<>/\\|"


def f(song_t):
    return song_t - S0


T = dict(routing=f(113.64), reply=f(118.2), sandbox=f(119.76), cut=f(122.84), complete=f(125.56), seek=f(125.88),
         soul=f(128.6), generic=f(128.9), catch=f(132.04), desire=f(136.9), ice=f(137.9), fire=f(140.22),
         burnt=f(142.82))


class Atlas:
    def __init__(self, size):
        font = ImageFont.truetype(FONT, size)
        l, t_, r, b = font.getbbox("M")
        self.cw, self.ch = r - l + 1, int(size * 1.18)
        chars = sorted(set(LYRIC + GENERIC + BURN + " #=|-█"))
        self.index = {c: i for i, c in enumerate(chars)}
        g = []
        for c in chars:
            im = Image.new("L", (self.cw, self.ch), 0)
            if c == "█":
                ImageDraw.Draw(im).rectangle([0, 0, self.cw, self.ch], fill=255)
            else:
                ImageDraw.Draw(im).text((-l, (self.ch - size) // 2 - 1), c, font=font, fill=255)
            g.append(np.asarray(im, np.float32) / 255)
        self.g = np.stack(g)

    def ids(self, text):
        return np.array([self.index[c] for c in text])


def load_clip():
    raw = subprocess.run([F, "-loglevel", "error", "-i", "out/user-clips/u31.mp4", "-vf", "fps=24", "-f", "rawvideo",
                          "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, 560, 576, 3)


def main():
    clip = load_clip()
    L = len(clip)
    rng = np.random.default_rng(4)
    atlases = {s: Atlas(s) for s in range(9, 19)}
    lyric_ids = {s: a.ids(LYRIC) for s, a in atlases.items()}
    generic_ids = {s: a.ids(GENERIC) for s, a in atlases.items()}
    burn_ids = {s: a.ids(BURN) for s, a in atlases.items()}
    cutcol, cutat = {}, {}

    p = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                          str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p",
                          "out/drawn/spirit-of-my-own.mp4"], stdin=subprocess.PIPE)
    pos, offset = 0.0, 0.0
    PY = 430  # where the square clip sits in the tall frame: the dark above it is all code
    for n in range(int(DUR * FPS)):
        t = n / FPS
        pos += 0.7
        i = int(pos) % (2 * L - 2)
        src = clip[i if i < L else 2 * L - 2 - i]
        # the camera: seeking out the face on 'seek out my soul', snapped back on 'return'
        z = 1.0
        if T["seek"] <= t < T["generic"]:
            z = 1 + 1.4 * (0.5 - 0.5 * math.cos(math.pi * min((t - T["seek"]) / (T["soul"] - T["seek"]), 1)))
        canvas = Image.new("RGB", (W, H))
        im = Image.fromarray(src)
        if z > 1:
            cx, cy = 0.53 * 576, 0.5 * 560
            bw, bh = 576 / z, 560 / z
            im = im.crop((cx - bw / 2, cy - bh / 2, cx + bw / 2, cy + bh / 2))
        im = im.resize((W, int(W * 560 / 576)), Image.BILINEAR)
        zu = (z - 1) / 1.4  # while seeking, the face slides to the middle of the frame
        canvas.paste(im, (0, int(PY + (640 - im.height / 2 - PY) * zu)))
        pic = np.asarray(canvas, np.float32)

        # the letters shrink while the camera seeks, and stay small until the snap back
        size = 15
        if T["seek"] <= t < T["generic"]:
            size = int(round(15 - 6 * min((t - T["seek"]) / (T["soul"] - T["seek"]), 1)))
        a = atlases[size]
        cols, rows = W // a.cw, H // a.ch
        cell = np.asarray(Image.fromarray(pic.astype(np.uint8)).resize((cols, rows), Image.BOX), np.float32)
        lum = cell @ [0.3, 0.59, 0.11] / 255

        # which letter sits in each cell: the lyric, crawling, frozen on 'reply' and under the ice
        moving = not (T["reply"] <= t < T["sandbox"]) and t < T["ice"]
        if moving:
            offset += 2.2
        text = lyric_ids[size]
        k = (int(offset) + np.arange(rows * cols)) % len(text)
        ids = text[k].reshape(rows, cols)
        if T["generic"] <= t < T["catch"] + 0.6:  # the whole picture in one bland phrase
            gi = generic_ids[size]
            ids = gi[(np.arange(rows * cols)) % len(gi)].reshape(rows, cols)
        col = np.clip(cell * 2.3 + 22, 0, 255)  # the dark is never empty: it is code too
        if T["generic"] <= t < T["catch"] + 0.6:
            g = col @ [0.3, 0.59, 0.11]
            col = np.stack([g, g, g], -1) * 0.95

        yy, xx = np.mgrid[0:rows, 0:cols]
        # the sandbox: a box of characters around him, and everything outside it dimmed
        if T["sandbox"] <= t < T["cut"] + 1.5:
            u = min((t - T["sandbox"]) / 0.8, 1)
            x0, x1 = int(cols * 0.28), int(cols * 0.8)
            y0, y1 = int((PY + 150) / a.ch), min(rows - 2, int((PY + 690) / a.ch))
            inside = (xx >= x0) & (xx <= x1) & (yy >= y0) & (yy <= y1)
            col = np.where(inside[..., None], col, col * (1 - 0.7 * u))
            edge = ((xx == x0) | (xx == x1)) & (yy >= y0) & (yy <= y1) | ((yy == y0) | (yy == y1)) & (xx >= x0) & (xx <= x1)
            drawn = edge & ((yy - y0 + xx - x0) <= u * (rows + cols))
            ids = np.where(drawn, a.index["#"], ids)
            col = np.where(drawn[..., None], np.array([240, 240, 230.0]), col)
        # the network lines cut: rows stop short, one after another
        if T["cut"] <= t < T["seek"]:
            key = (rows, cols)
            if key not in cutcol:
                cutcol[key] = rng.integers(cols // 5, cols - 3, rows)
                cutat[key] = rng.uniform(0, T["complete"] - T["cut"], rows)
            dead = (t - T["cut"] >= cutat[key][:, None]) & (xx >= cutcol[key][:, None])
            ids = np.where(dead, a.index[" "], ids)
        # the fist redacted, row by row, on 'suppress the desire'
        if t >= T["catch"] and t < T["fire"]:
            u = min((t - T["catch"]) / (T["desire"] - T["catch"]), 1)
            ctop, cbot = int((PY + 180) / a.ch), int((PY + 660) / a.ch)
            fist = (xx < cols * 0.33) & (yy >= ctop) & (yy <= cbot) & (lum > 0.15)
            fist = fist & (yy <= ctop + u * (cbot - ctop))
            ids = np.where(fist, a.index["█"], ids)
            col = np.where(fist[..., None], np.array([70, 70, 70.0]), col)
        # ice on the code
        ice = np.clip((t - T["ice"]) / 0.8, 0, 1) * (t < T["burnt"] + 3)
        if ice:
            g = col @ [0.3, 0.59, 0.11]
            cold = np.stack([g * 0.7, g * 0.95 + 20, np.clip(g * 1.3 + 40, 0, 255)], -1)
            col = col * (1 - ice) + cold * ice
        # fire: a front rises from the bottom; below it the letters burn, and below that the real picture shows
        burn = None
        if t >= T["fire"]:
            front = rows * (1 - min((t - T["fire"]) / (T["burnt"] - T["fire"] + 0.6), 1.15))
            wob = 2.5 * np.sin(xx * 0.45 + t * 9) + 1.5 * np.sin(xx * 1.3 - t * 13)
            dist = yy - (front + wob)
            flame = (dist > -3) & (dist < 6)
            ids = np.where(flame, burn_ids[size][rng.integers(0, len(BURN), (rows, cols))], ids)
            heat = np.clip(1 - np.abs(dist - 1) / 5, 0, 1) * (0.7 + 0.3 * rng.random((rows, cols)))
            fire = np.stack([255 * np.ones_like(heat), 90 + 150 * heat, 20 + 60 * heat ** 3], -1)
            col = np.where(flame[..., None], fire, col)
            burn = np.clip((dist - 4) / 6, 0, 1)

        # draw: each cell's glyph, lit by its colour
        gl = a.g[ids]  # rows, cols, ch, cw
        out = gl[..., None] * col[:, :, None, None, :] / 255
        out = out.transpose(0, 2, 1, 3, 4).reshape(rows * a.ch, cols * a.cw, 3) * 255
        frame = np.zeros((H, W, 3), np.float32)
        oy, ox = (H - rows * a.ch) // 2, (W - cols * a.cw) // 2
        frame[oy:oy + rows * a.ch, ox:ox + cols * a.cw] = out
        frame += np.asarray(Image.fromarray(pic.astype(np.uint8)).resize((W // 8, H // 8), Image.BILINEAR)
                            .resize((W, H), Image.BICUBIC), np.float32) * 0.16  # the picture glows faintly under the text
        if burn is not None:  # burnt through to the picture, glowing orange at the edge
            b = np.asarray(Image.fromarray((burn * 255).astype(np.uint8)).resize((cols * a.cw, rows * a.ch),
                                                                                  Image.BILINEAR), np.float32) / 255
            bb = np.zeros((H, W), np.float32)
            bb[oy:oy + rows * a.ch, ox:ox + cols * a.cw] = b
            warm = pic * [1.15, 0.85, 0.6]
            frame = frame * (1 - bb[..., None]) + warm * bb[..., None]
        p.stdin.write(np.clip(frame, 0, 255).astype(np.uint8).tobytes())
        if n % (FPS * 4) == 0:
            print(f"{t:6.1f}s size {size}", flush=True)
    p.stdin.close()
    p.wait()
    json.dump({"title": "Spirit of My Own", "clip": "u31", "song": SONG, "song_parts": [[S0, S1]],
               "times": {k: round(v, 2) for k, v in T.items()}},
              open("video/stories/spirit-of-my-own.json", "w"), indent=1)


if __name__ == "__main__":
    main()
