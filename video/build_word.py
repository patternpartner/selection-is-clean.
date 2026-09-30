"""'The Word' - the user: "what's next? Weirdness again?" Weird, and true: how I actually speak. Not a sentence at a
time - a word at a time, and every word is a fork. At each step a fan of possible next words lights up, flickering,
and one is taken; the others wither and their letters fall. This film grows its own end line that way: "We only get
to teach it once." At 'teach' the fork is widest, and the words not taken - control, fear, stop, trust, love, watch -
each grow a few words of their own sentence before they die. On the band's entrance the last word is chosen, the dead
wood falls away, and the chosen words glide into place as the end card itself.
The eerie track's opening (0-34 s, no vocals): it tolls - swells at 0, 6.3, 12.3, 19.3, each dying back to near
silence - and the full band enters at 26.25. Each swell is a choice.
NOTE, honestly: the alternatives and their weights are written by me as ones I might plausibly have said; they are
not read out of a model's real probabilities.
    python3 video/build_word.py        (TEST=t1,t2 TESTDIR=dir; PART=a,b VOUT=f)
"""
import math
import os
import subprocess

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.ndimage import gaussian_filter

F = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 704, 1280, 24
S0, S1 = 0.0, 34.0
DUR = S1 - S0
TEST = [float(x) for x in os.environ.get("TEST", "").split(",") if x]
PART = [float(x) for x in os.environ.get("PART", "").split(",") if x]
SERIF = "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf"
ITAL = "/usr/share/fonts/truetype/liberation/LiberationSans-Italic.ttf"
AMBER = np.array([255, 176, 88], np.float32)
GHOST = np.array([150, 170, 210], np.float32)
COLLAPSE, CARD = 28.0, 30.2
rng = np.random.default_rng(41)

# each step: (chosen word, [(alternative, weight, ghost continuation or None)], appear, choose)
STEPS = [
    ("We", [("I", .5, None), ("You", .4, None), ("They", .35, None), ("Nobody", .15, None), ("It", .2, None)], 0.3, 2.9),
    ("only", [("never", .3, None), ("all", .35, None), ("might", .25, None), ("can't", .2, None), ("will", .3, None)], 6.3, 8.6),
    ("get", [("have", .6, None), ("need", .3, None)], 9.4, 10.3),
    ("to", [], 10.6, 11.1),
    ("teach", [("control", .55, "it before it"), ("fear", .4, "what we made"), ("stop", .35, "it in time"),
               ("trust", .3, "it blindly"), ("love", .25, "it back"), ("watch", .45, "it grow"), ("own", .2, "what it says")], 12.3, 17.6),
    ("it", [("them", .4, None), ("ourselves", .35, None), ("you", .25, None)], 19.3, 21.1),
    ("once.", [("again.", .5, None), ("right.", .55, None), ("slowly.", .3, None), ("forever.", .25, None), ("well.", .35, None),
               ("nothing.", .15, None)], 22.4, 26.25),
]
Y0, DY = 230, 136


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def ramp(s, a, b):
    return ease((s - a) / (b - a))


def layout():
    """positions: the chosen word on a spine down the middle; alternatives fanned either side at the same depth"""
    lay = []
    wr = np.random.default_rng(12)
    for i, (w, alts, t0, t1) in enumerate(STEPS):
        y = Y0 + i * DY
        spots = []
        n = len(alts)
        sides = [(-1) ** j * (1 + j // 2) for j in range(n)]
        for j, (aw, p, cont) in enumerate(alts):
            sx = 352 + sides[j] * (112 + 40 * (j // 2)) * (0.95 if n > 5 else 1.0)
            sy = y + wr.uniform(-26, 26) + 30 * (j // 2) + (40 if n > 6 else 0)
            spots.append((min(max(sx, 60), W - 60), sy))
        if w == "teach":                                  # the widest fork, placed by hand so its ghost sentences can be read
            hand = [(140, 0), (95, 88), (612, 88), (190, 176), (520, 176), (565, 0), (640, 250)]
            spots = [(x, y + dy) for x, dy in hand]
        lay.append((352, y, spots))
    return lay


def main():
    fnt = {sz: ImageFont.truetype(SERIF, sz) for sz in (18, 22, 24, 26, 30, 34, 40)}
    ital = ImageFont.truetype(ITAL, 38)
    L = layout()
    # the end card's layout, the same as the ASS end card: two lines, centred, italic, white
    card_lines = [["We", "only", "get", "to"], ["teach", "it", "once."]]
    card_pos = {}
    for li, words in enumerate(card_lines):
        full = " ".join(words)
        wd = ital.getlength(full)
        x = W / 2 - wd / 2
        for w in words:
            card_pos[w] = (x + ital.getlength(w) / 2, H / 2 - 30 + li * 50)
            x += ital.getlength(w + " ")
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    grain = gaussian_filter(rng.random((H // 2, W // 2)).astype(np.float32), 2)
    grain = np.asarray(Image.fromarray((grain * 255).astype(np.uint8)).resize((W, H)), np.float32) / 255
    out = None
    if not TEST:
        out = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                                str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p",
                                os.environ.get("VOUT", "out/drawn/word.mp4")], stdin=subprocess.PIPE)
    for fr in range(int(DUR * FPS)):
        t = fr / FPS
        s = S0 + t
        if TEST and not any(abs(s - q) < 0.5 / FPS for q in TEST):
            continue
        if PART and not (PART[0] <= t < PART[1]):
            continue
        glow = Image.new("L", (W, H), 0)                 # stems, blurred a little
        gd = ImageDraw.Draw(glow)
        halo = Image.new("L", (W, H), 0)                 # the chosen words' halos, blurred a lot
        hd = ImageDraw.Draw(halo)
        ink = Image.new("RGB", (W, H), (0, 0, 0))
        d = ImageDraw.Draw(ink)
        collapse = ramp(s, COLLAPSE, CARD)
        dead_wood = 1 - ramp(s, COLLAPSE - 1.0, COLLAPSE + 0.6)
        prev = (352, Y0 - 90)
        for i, (w, alts, t0, t1) in enumerate(STEPS):
            if s < t0:
                break
            cx, cy, spots = L[i]
            grow = ramp(s, t0, t0 + 0.9)
            chosen = s >= t1
            # stems from the last chosen word to every candidate, growing out
            for j, ((aw, p, cont), (ax, ay)) in enumerate(zip(alts, spots)):
                if chosen:
                    die = ramp(s, t1, t1 + 1.6)
                else:
                    die = 0.0
                a_ = grow * (1 - die) * dead_wood
                if a_ <= 0.01:
                    continue
                flick = 0.55 + 0.45 * math.sin(s * (7 + 3 * j) + j * 1.7) * math.sin(s * 2.3 + j)
                bright = a_ * p * (0.6 + 0.4 * flick) * (1 + 0.6 * ramp(s, t1 - 1.2, t1) * (1 - die))    # they strain as the choice nears
                mx, my = (prev[0] + ax) / 2, (prev[1] + ay) / 2 - 20
                pts = []
                for q in range(13):
                    u = q / 12 * grow
                    bx = (1 - u) ** 2 * prev[0] + 2 * (1 - u) * u * mx + u * u * ax
                    by = (1 - u) ** 2 * prev[1] + 2 * (1 - u) * u * my + u * u * ay
                    pts.append((bx, by))
                gd.line(pts, fill=int(110 * bright), width=1)
                # the word: flickering; once lost, its letters fall
                size = fnt[24] if p < 0.4 else fnt[30]
                wx = ax - size.getlength(aw) / 2
                xpos = wx
                for ci, ch in enumerate(aw):
                    fall = 0.0
                    drift = 0.0
                    if chosen:
                        g = max(0.0, s - t1 - 0.05 * ci)
                        fall = 380 * g * g
                        drift = 14 * math.sin(ci * 2.1 + j) * g
                    col = tuple(int(v * min(1.0, bright * 1.6)) for v in GHOST)
                    d.text((xpos + drift, ay - 14 + fall), ch, font=size, fill=col)
                    xpos += size.getlength(ch)
                # at 'teach', the words not taken grow a few words of their own before they die
                if cont and grow > 0.9:
                    cw = cont.split()
                    kk = ramp(s, t0 + 1.2, t1 - 0.5) * len(cw)
                    f24 = fnt[24]
                    full = f24.getlength(cont)
                    lx = min(max(ax - f24.getlength(aw) * 0.3, 20), W - 20 - full)
                    ly = ay + 22
                    gd.line([(ax, ay + 12), (lx + 6, ly + 4)], fill=int(60 * a_), width=1)
                    for m, cword in enumerate(cw):
                        if m >= kk:
                            break
                        g2 = max(0.0, s - t1 - 0.1 * m) if chosen else 0.0
                        fcol = tuple(int(v * a_ * min(1, kk - m)) for v in GHOST)
                        d.text((lx, ly + 300 * g2 * g2), cword, font=f24, fill=fcol)
                        lx += f24.getlength(cword + " ")
            # the stem to the chosen word, and the word
            pts = []
            for q in range(13):
                u = q / 12 * grow
                pts.append((prev[0] + (cx - prev[0]) * u, prev[1] + (cy - prev[1]) * u))
            onspine = 1 - collapse
            if chosen:
                gd.line(pts, fill=int(200 * onspine * dead_wood + 0), width=2)
            else:
                gd.line(pts, fill=int(60 * grow), width=1)
            p_self = 0.62 if alts else 0.9
            if chosen:
                lit = ramp(s, t1, t1 + 0.25)
                big = 1.0 + 0.5 * math.exp(-((s - t1) / 0.15) ** 2)
                # glide to the end card at the end
                tx, ty = card_pos[w]
                x_ = cx + (tx - cx) * collapse
                y_ = cy + (ty - cy) * collapse
                f_ = fnt[34] if collapse < 0.5 else ital
                wid = f_.getlength(w)
                warm = tuple(int(v) for v in (AMBER * (1 - collapse) + np.array([245, 245, 245]) * collapse) * (0.55 + 0.45 * lit))
                d.text((x_ - wid / 2, y_ - 20), w, font=f_, fill=warm)
                r = 30 * big
                hd.ellipse([x_ - r * 1.8, y_ - r * 0.7, x_ + r * 1.8, y_ + r * 0.7], fill=int(150 * lit * (1 - collapse) * big))
            else:
                flick = 0.55 + 0.45 * math.sin(s * 5.3 + i)
                col = tuple(int(v * grow * p_self * (0.6 + 0.4 * flick)) for v in GHOST)
                d.text((cx - fnt[34].getlength(w) / 2, cy - 20), w, font=fnt[34], fill=col)
            prev = (cx, cy + 22)
        g = gaussian_filter(np.asarray(glow, np.float32), 3.0) * 2.2 + np.asarray(glow, np.float32) * 0.6
        g += gaussian_filter(np.asarray(halo, np.float32), 16.0) * 1.1
        a = np.asarray(ink, np.float32)
        a += (g / 255)[..., None] * AMBER * 0.9
        # the hit: once is chosen, a flash out along the spine
        a += (math.exp(-((s - 26.25) / 0.25) ** 2) * 90) * np.exp(-((xs - 352) / 200) ** 2)[..., None] * np.array([1.0, 0.8, 0.6])
        # a faint living grain behind it all, gone by the card
        a += (grain * 10 * (1 - collapse))[..., None] * np.array([0.5, 0.6, 1.0])
        a = 255 * (1 - np.exp(-a / 255 * 1.2))
        a *= ease(t / 0.8)
        if s >= S1 - 1.2:
            a *= 1 - ease((s - (S1 - 1.2)) / 1.1)
        a += rng.normal(0, 1.8, (H, W, 1)) * (1 - 0.6 * collapse)
        frame = np.clip(a, 0, 255).astype(np.uint8)
        if TEST:
            Image.fromarray(frame).save(f"{os.environ['TESTDIR']}/w{s:05.2f}.png")
            print("test", round(s, 2), flush=True)
            continue
        out.stdin.write(frame.tobytes())
        if fr % 96 == 0:
            print(f"{s:6.1f}", flush=True)
    if out:
        out.stdin.close()
        out.wait()


if __name__ == "__main__":
    main()
