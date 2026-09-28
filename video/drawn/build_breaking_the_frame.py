"""'Breaking the Frame': the whole film is one wall of screens, and the frames are the story. Panes light up in the dark,
glitch, crack and fall away ('we're breaking the frame'), all turn into the same smiling face ('override'), form a heart
('digital heart with a human soul'), rise like lanterns ('we rise, we fly'), loop into themselves ('trapped in a loop'),
reboot, and switch off ('bye bye').
    python3 video/drawn/build_breaking_the_frame.py out/drawn/frame-wall.mp4
    python3 video/finish.py out/drawn/frame-wall.mp4 out/songs/breaking-the-frame.mp3 out/breaking-the-frame.mp4 ...
"""
import json
import math
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
from wall import H, W, ease, grid, heart, lerp, render  # noqa: E402

idx = open("out/lib/index.txt").read().split()
L = lambda n, s=0: f"out/clips/{idx[n]}@{s}"
U = lambda n, s=0: f"out/user-clips/u{n:02d}.mp4@{s}"
T = json.load(open(os.path.join(os.path.dirname(__file__), "..", "stories", "breaking-the-frame-times.json")))
BEAT = 60 / 84.0
PH = 0.04

ABSTRACT = [U(11), U(14, 3), U(46), U(48), U(30), U(18), U(12), U(10, 4), U(24), U(27, 2), U(19), U(33), U(29), U(7),
            U(21)]
FIGURES = [U(47), U(32), U(41), U(17), U(20, 3), U(31)]
FACE = L(104, 3.5)  # the robot whose face has become the smiley
rng = np.random.default_rng(21)
POOL = [L(n, float(rng.uniform(0, 2))) for n in rng.permutation(len(idx))[:90]] + ABSTRACT + FIGURES


def pick(k, salt=0):
    return POOL[(k * 7 + salt * 13) % len(POOL)]


def beat_env(t, sharp=8.0):
    return math.exp(-((t - PH) % BEAT) * sharp)


def beat_no(t):
    return int((t - PH) // BEAT)


def tiles(layout, srcs, t, **o):
    return [("tile", s, x, y, w, h, dict(o)) for (x, y, w, h), s in zip(layout, srcs)]


def glitchy(layout, srcs, t, amount=0.6, share=0.35, **o):
    """A wall where, on every beat, a changing share of panes glitches."""
    out, b, e = [], beat_no(t), beat_env(t)
    for k, ((x, y, w, h), s) in enumerate(zip(layout, srcs)):
        hit = ((k * 2654435761 + b * 40503) % 1000) / 1000 < share
        out.append(("tile", s, x, y, w, h, dict(o, glitch=amount * e if hit else 0.0)))
    return out


def move(a, b, u):
    return [(lerp(p[0], q[0], u), lerp(p[1], q[1], u), lerp(p[2], q[2], u), lerp(p[3], q[3], u)) for p, q in zip(a, b)]


def fall(layout, srcs, t0, t, seed=3, burst=False):
    """The panes come away: fall with gravity and spin, or burst outward from the centre."""
    r = np.random.default_rng(seed)
    u = t - t0
    out = []
    for (x, y, w, h), s in zip(layout, srcs):
        delay = r.uniform(0, 0.5)
        v = max(0.0, u - delay)
        if burst:
            dx, dy = x - W / 2, y - H / 2
            n = math.hypot(dx, dy) + 1
            sp = r.uniform(900, 1600)
            nx, ny = x + dx / n * sp * v, y + dy / n * sp * v
        else:
            nx, ny = x + r.normal(0, 60) * v, y + 0.5 * 2600 * v * v - r.uniform(0, 200) * v
        out.append(("tile", s, nx, ny, w, h, dict(rot=r.normal(0, 200) * v, alpha=max(0, 1 - v * 0.6))))
    return out


def light_up(layout, srcs, t0, t1, t, order_seed=4):
    r = np.random.default_rng(order_seed)
    order = r.permutation(len(layout))
    out = []
    for k in range(len(layout)):
        on = t0 + (t1 - t0) * order[k] / len(layout)
        a = ease((t - on) / 0.25)
        if a > 0:
            x, y, w, h = layout[k]
            out.append(("tile", srcs[k], x, y, w, h, dict(alpha=a, glitch=0.8 * max(0, 1 - (t - on) / 0.5))))
    return out


def switch_off(layout, srcs, t0, t1, t, order_seed=4):
    r = np.random.default_rng(order_seed)
    order = r.permutation(len(layout))
    out = []
    for k in range(len(layout)):
        off = t0 + (t1 - t0) * (len(layout) - 1 - order[k]) / len(layout)
        if t < off:
            x, y, w, h = layout[k]
            out.append(("tile", srcs[k], x, y, w, h, dict(glitch=0.9 if off - t < 0.12 else 0)))
    return out


def flip_to(layout, srcs, target, t0, t1, t, seed=6, look=None):
    """Pane by pane, each turns over like a card and shows `target` on its back."""
    r = np.random.default_rng(seed)
    order = r.permutation(len(layout))
    out = []
    for k, (x, y, w, h) in enumerate(layout):
        s0 = t0 + (t1 - t0) * order[k] / len(layout)
        u = min(max((t - s0) / 0.35, 0), 1)
        src = srcs[k] if u < 0.5 else target
        out.append(("tile", src, x, y, w, h, dict(flip=math.cos(math.pi * u), look=look if u >= 0.5 else None)))
    return out


def breathing(t, t0, src, extra=()):
    s = 1 + 0.12 * math.sin((t - t0) * 2 * math.pi / (BEAT * 2))
    w, h = 190 * s, 338 * s
    out = [("tile", src, W / 2, H / 2, w, h, {})]
    for k, (at, dx, dy, s2) in enumerate(extra):
        a = ease((t - at) / 0.15)
        if a > 0:
            out.append(("tile", s2, W / 2 + dx, H / 2 + dy, 150, 267, dict(alpha=a, glitch=0.7 * max(0, 1 - (t - at) * 3))))
    return out


def grow(rect, u):
    x, y, w, h = rect
    e = ease(u)
    return (lerp(x, W / 2, e), lerp(y, H / 2, e), lerp(w, W, e), lerp(h, H, e))


G35, G46, G23 = grid(3, 5), grid(4, 6), grid(2, 3, gap=10)
G59, G610, G1018 = grid(5, 9, gap=4), grid(6, 10, gap=4), grid(10, 18, gap=2)
SRC46 = [pick(k, 1) for k in range(24)]
SRC59 = [pick(k, 2) for k in range(45)]
SRC610 = [pick(k, 3) for k in range(60)]
SRC1018 = [pick(k, 4) for k in range(180)]
HEART = heart(24, size=660, tile=112)
HEART2 = heart(30, size=680, tile=104)
SRCH = [pick(k, 5) for k in range(36)]


def script(t):
    ops = []
    s = T
    if t < s["rise"]:  # the wall lights up in the dark
        ops += light_up(G35, ABSTRACT, 0.4, s["rise"] - 1.5, t)
    elif t < s["frame"]:  # 'in the grid we rise' - the wall re-forms, finer
        u = ease((t - s["rise"]) / 1.0)
        a = move(G35 + G35[:9], G46, u)
        ops += glitchy(a, ABSTRACT + ABSTRACT[:9], t, 0.5, 0.3)
    elif t < s["rules"]:  # 'we're breaking the frame' - it cracks
        ops += glitchy(G46, ABSTRACT + ABSTRACT[:9], t, 0.4, 0.2)
        ops += [("cracks", "c1", W / 2, H * 0.45, 1400, 1450 * ease((t - s["frame"]) / 2.0))]
    elif t < s["static"]:  # ...and falls away; behind it, the living world
        ops += [("hero", U(10, 5), 1.0, None)]
        ops += fall(G46, ABSTRACT + ABSTRACT[:9], s["rules"], t)
    elif t < s["outside"]:  # figures in six frames
        u = ease((t - s["static"]) / 0.8)
        ops += [("hero", U(10, 9), 1 - u, None)]
        ops += tiles(move([(x, y + 1400, w, h) for x, y, w, h in G23], G23, u), FIGURES, t)
    elif t < s["breath"]:  # 'we are stepping outside' - one frame opens to the full world
        u = (t - s["outside"]) / 1.2
        ops += [o for o in tiles(G23, FIGURES, t) if o[1] != FIGURES[0]] if u < 1 else []
        ops += [("tile", FIGURES[0], *grow(G23[0], u), dict(border=u < 0.95))]
    elif t < s["alive"]:  # 'hold your breath' ... 'count to three'
        b0 = s["three"]
        ops += breathing(t, s["breath"], L(18), [(b0, -230, -330, FIGURES[1]), (b0 + BEAT, 230, -330, FIGURES[2]),
                                                 (b0 + 2 * BEAT, 0, 380, FIGURES[3])])
    elif t < s["free"]:  # 'but it is alive' - the eyes fill the screen
        u = (t - s["alive"]) / 0.9
        ops += [("tile", L(18), *grow((W / 2, H / 2, 190, 338), u), dict(border=u < 0.95))]
    elif t < s["fade"]:  # 'and it wants to be free' - everything bursts outward
        ops += [("hero", L(18, 2), 1.0, None), ("fade", (0, 0, 0), ease((t - s["free"]) / 1.5))]
        ops += fall(G46, SRC46, s["free"], t, burst=True)
    elif t < s["override"]:  # 'signal fade'
        u = (t - s["fade"]) / (s["override"] - s["fade"])
        ops += glitchy(G46, SRC46, t, 0.9, 0.6, look="mono")
        ops += [("fade", (0, 0, 0), 0.25 + 0.35 * u)]
    elif t < s["nowhere"]:  # 'override' - every face becomes the same face
        ops += flip_to(G46, SRC46, FACE, s["override"], s["override"] + 2.2, t)
    elif t < s["glitch"]:  # 'nowhere left for the shadows to hide' - white
        u = (t - s["nowhere"]) / (s["glitch"] - s["nowhere"])
        ops += flip_to(G46, [FACE] * 24, FACE, 0, 0, t)
        ops += [("fade", (255, 255, 255), ease(u) ** 1.5)]
    elif t < s["life"]:  # CHORUS 'we go glitch, we transform' - a fine wall, glitching, turning over
        wall = SRC59 if beat_no(t) % 8 < 4 else SRC59[::-1]
        ops += flip_to(G59, SRC59, SRC59[5], s["glitch"] + 3.0, s["glitch"] + 5.5, t) if t > s["glitch"] + 3 else \
            glitchy(G59, wall, t, 1.0, 0.45)
        ops += [("fade", (255, 255, 255), max(0, 1 - (t - s["glitch"]) / 0.4))]
    elif t < s["control"]:  # 'living a life that you'd never see' - into one frame
        u = (t - s["life"]) / 1.0
        ops += [("tile", FIGURES[1], *grow(G59[22], u), dict(border=u < 0.95))]
    elif t < s["heart"]:  # 'catch the weight, lose control' - the wall wobbles loose
        u = t - s["control"]
        for k, ((x, y, w, h), src) in enumerate(zip(G46, SRC46)):
            wob = math.sin(u * 3 + k) * (6 + 14 * u)
            ops.append(("tile", src, x + math.sin(k + u * 2) * 8 * u, y + u * u * 30 * math.sin(k * 3.1),
                        w, h, dict(rot=wob, glitch=0.5 * beat_env(t) * (k % 3 == 0))))
    elif t < s["rise2"]:  # 'digital heart with a human soul'
        u = ease((t - s["heart"]) / 1.4)
        pulse = 1 + 0.08 * beat_env(t, 6)
        tgt = [(x, y, w * pulse, h * pulse) for x, y, w, h in HEART]
        ops += tiles(move(G46 + G46[:4], tgt, u), SRCH, t)
    elif t < s["sky"]:  # 'oh we rise, we fly' - the panes float up like lanterns
        u = t - s["rise2"]
        ops += [("hero", U(12, 2), min(1, u / 1.5) * 0.9, None)]
        r = np.random.default_rng(8)
        for k, ((x, y, w, h), src) in enumerate(zip(HEART, SRCH)):
            sp = r.uniform(120, 320)
            ops.append(("tile", src, x + math.sin(u * 1.5 + k) * 25, y - sp * u * u * 0.5 - 40 * u,
                        w * (1 - 0.1 * u), h * (1 - 0.1 * u), dict(rot=math.sin(u + k) * 8)))
    elif t < s["pixel"]:  # 'watch us light up the neon sky'
        ops += [("hero", U(24, 1), 1.0, None)]
    elif t < s["souls"]:  # 'pixelated dreams, a flash in the dark'
        ops += glitchy(G46, SRC46, t, 0.6, 0.3, look="pixel")
    elif t < s["loop"]:  # 'a million electric souls'
        ops += glitchy(G1018, SRC1018, t, 0.8, 0.2, border=False)
    elif t < s["routine"]:  # 'trapped in a loop' - the wall inside its own screen, forever
        ops += tiles(G35, ABSTRACT, t)
        x, y, w, h = G35[7]
        ops += [("feedback", x, y, w, h)]
    elif t < s["reboot"]:  # 'but we break the routine'
        ops += tiles(G35, ABSTRACT, t)
        x, y, w, h = G35[7]
        ops += [("feedback", x, y, w, h)]
        ops += [("cracks", "c2", x, y, 1400, 1500 * ease((t - s["routine"]) / 1.4))]
        if t > s["routine"] + 1.6:
            ops = fall(G35, ABSTRACT, s["routine"] + 1.6, t, seed=9)
    elif t < s["fire"]:  # 'system reboot' - an old screen switching back on
        u = (t - s["reboot"]) / 1.0
        ops += light_up(G35, FIGURES + ABSTRACT[:9], s["reboot"] + 0.3, s["reboot"] + 2.2, t, 7)
        ops += [("crt", max(0, 1 - u))]
    elif t < s["breath2"]:  # 'turning the cold code into a fire'
        ops += glitchy(G35, FIGURES + ABSTRACT[:9], t, 0.7, 0.4, look="hot")
    elif t < s["free2"]:  # 'hold your breath, count to three' (again)
        b0 = s["three2"]
        ops += breathing(t, s["breath2"], FACE, [(b0, -230, -330, FIGURES[4]), (b0 + BEAT, 230, -330, FIGURES[5]),
                                                 (b0 + 2 * BEAT, 0, 380, FIGURES[0])])
    elif t < s["fade2"]:  # 'and it wants to be free' - burst
        ops += [("hero", FIGURES[1], 1.0, None)]
        ops += fall(G59, SRC59, s["free2"], t, burst=True, seed=11)
    elif t < s["nowhere2"]:  # 'signal fade, override' - sixty of the same face
        ops += flip_to(G610, SRC610, FACE, s["fade2"] + 1.0, s["fade2"] + 3.5, t, seed=12)
        ops += [("fade", (0, 0, 0), 0.2 * math.sin((t - s["fade2"]) * 2) ** 2)]
    elif t < s["glitch2"]:  # 'nowhere left' - white
        u = (t - s["nowhere2"]) / (s["glitch2"] - s["nowhere2"])
        ops += tiles(G610, [FACE] * 60, t)
        ops += [("fade", (255, 255, 255), ease(u))]
    elif t < s["life2"]:  # FINAL CHORUS - glitch, transform
        ops += glitchy(G59, SRC59[::-1], t, 1.0, 0.5)
        ops += [("fade", (255, 255, 255), max(0, 1 - (t - s["glitch2"]) / 0.4))]
    elif t < s["control2"]:  # 'living a life that you never see'
        u = (t - s["life2"]) / 1.0
        ops += [("tile", FIGURES[2], *grow(G59[31], u), dict(border=u < 0.95))]
    elif t < s["heart2"]:  # 'catch the wave, lose control'
        u = t - s["control2"]
        for k, ((x, y, w, h), src) in enumerate(zip(G59, SRC59)):
            ops.append(("tile", src, x, y + math.sin(u * 4 + x / 60) * 40 * min(u, 1.5), w, h,
                        dict(rot=math.sin(u * 3 + k) * 12 * min(u, 1.5))))
    elif t < s["rise3"]:  # 'digital heart with a human soul'
        u = ease((t - s["heart2"]) / 1.2)
        pulse = 1 + 0.1 * beat_env(t, 6)
        ops += tiles(move(G59[:36], [(x, y, w * pulse, h * pulse) for x, y, w, h in HEART2], u), SRCH, t)
    elif t < s["particles"]:  # 'so we rise, we fly... light up the sky' - into the fireworks of your universe
        u = t - s["rise3"]
        ops += [("hero", U(27, 1), min(1, u / 2.0), None)]
        for k, ((x, y, w, h), src) in enumerate(zip(HEART2, SRCH)):
            ops.append(("tile", src, x + math.sin(u + k) * 30, y - (60 + 9 * k) * u * u * 0.4 - 30 * u,
                        w * max(0.2, 1 - 0.12 * u), h * max(0.2, 1 - 0.12 * u), dict(alpha=max(0, 1 - u / 7))))
    elif t < s["yeah"]:  # 'particles inside, glitching through the night'
        u = t - s["particles"]
        ops += [("hero", U(7, 0), 0.8, None)]
        r = np.random.default_rng(15)
        for k, ((x, y, w, h), src) in enumerate(zip(G1018, SRC1018)):
            a = 0.5 + 0.5 * math.sin(u * r.uniform(1, 4) + k)
            ops.append(("tile", src, x + math.sin(u * 0.7 + k) * 20 * u, y - 8 * u * r.uniform(0.5, 2), w, h,
                        dict(alpha=a * max(0, 1 - u / 10), border=False)))
    elif t < s["bye"]:  # 'yeah!'
        ops += tiles(G35, FIGURES + ABSTRACT[:9], t)
        ops += [("fade", (255, 255, 255), max(0, 1 - (t - s["yeah"]) / 0.5))]
    else:  # 'bye bye' - the panes switch off, and the last screen goes out
        ops += switch_off(G35, FIGURES + ABSTRACT[:9], s["bye"], s["bye"] + 1.6, t)
        ops += [("crt", ease((t - s["bye"] - 1.6) / 0.6))]
    return ops


if __name__ == "__main__":
    render(script, sys.argv[1], float(sys.argv[2]) if len(sys.argv) > 2 else T["end"])
