"""A front-view dancer for 'The Lead': a rig of joints driven by a few parameters, drawn as capsules melted into one
body (blur + re-threshold, as in build_shadow.py). Moves are functions of the song's beat, so everything lands on it.
Units: standing height 1, y up, origin between the feet."""
import math

import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import gaussian_filter

TH, SH_ = 0.25, 0.25          # thigh, shin
UA, FA = 0.165, 0.155         # upper arm, forearm


def pose(p):
    """params -> joints. p: sway, bounce, tilt, aL, aR (shoulder angle: 0 down, pi/2 out, pi up), eL, eR (elbow bend),
    fL, fR (foot x), liftL, liftR (foot lift), head (tilt), x (whole-body shift)"""
    x0 = p.get("x", 0.0)
    pel = (x0 + p["sway"], 0.49 - p["bounce"])       # knees a little bent: weight low
    tilt = p["tilt"]
    chest = (pel[0] + math.sin(tilt) * 0.26, pel[1] + math.cos(tilt) * 0.26)
    neck = (chest[0] + math.sin(tilt) * 0.05, chest[1] + math.cos(tilt) * 0.05)
    ht = tilt + p.get("head", 0.0)
    head = (neck[0] + math.sin(ht) * 0.08, neck[1] + math.cos(ht) * 0.08)
    j = dict(pel=pel, chest=chest, neck=neck, head=head)
    for side, sgn in (("L", -1), ("R", 1)):
        sh = (chest[0] + sgn * 0.115 * math.cos(tilt), chest[1] - sgn * 0.115 * math.sin(tilt) - 0.01)
        a = p["a" + side]
        ang = sgn * a                               # measured from straight down, outward on each side
        el = (sh[0] + math.sin(ang) * UA, sh[1] - math.cos(ang) * UA)
        e = p["e" + side] * sgn
        ha = ang + e
        hand = (el[0] + math.sin(ha) * FA, el[1] - math.cos(ha) * FA)
        hip = (pel[0] + sgn * 0.07, pel[1] - 0.03)
        foot = (x0 + p["f" + side], p.get("lift" + side, 0.0))
        # two-bone leg: knee bends outward and up
        dx, dy = foot[0] - hip[0], foot[1] - hip[1]
        dist = min(math.hypot(dx, dy), TH + SH_ - 1e-4)
        k = math.sqrt(max(0.0, TH * TH - (dist / 2) ** 2))
        mx, my = (hip[0] + foot[0]) / 2, (hip[1] + foot[1]) / 2
        nx, ny = -dy / (dist + 1e-6), dx / (dist + 1e-6)
        if nx * sgn < 0:
            nx, ny = -nx, -ny
        knee = (mx + nx * k * 0.5, my + ny * k * 0.5)
        j.update({"sh" + side: sh, "el" + side: el, "hand" + side: hand, "hip" + side: hip, "knee" + side: knee,
                  "foot" + side: foot})
    return j


def draw(j, ox, oy, scale, W, H, SS=2, melt=True):
    im = Image.new("L", (W * SS, H * SS), 0)
    d = ImageDraw.Draw(im)

    def P(q):
        return ((ox + q[0] * scale) * SS, (oy - q[1] * scale) * SS)

    def cap(a, b, w):
        pa, pb = P(a), P(b)
        ww = max(1, int(w * scale * SS))
        d.line([pa, pb], fill=255, width=ww)
        for q in (pa, pb):
            d.ellipse([q[0] - ww / 2, q[1] - ww / 2, q[0] + ww / 2, q[1] + ww / 2], fill=255)

    # torso as a tapered quad, chest wider than waist
    for (a, b, wa, wb) in ((j["pel"], j["chest"], 0.082, 0.1),):
        pa, pb = P(a), P(b)
        dx, dy = pb[0] - pa[0], pb[1] - pa[1]
        ln = math.hypot(dx, dy) + 1e-6
        nx, ny = -dy / ln, dx / ln
        d.polygon([(pa[0] + nx * wa * scale * SS, pa[1] + ny * wa * scale * SS),
                   (pb[0] + nx * wb * scale * SS, pb[1] + ny * wb * scale * SS),
                   (pb[0] - nx * wb * scale * SS, pb[1] - ny * wb * scale * SS),
                   (pa[0] - nx * wa * scale * SS, pa[1] - ny * wa * scale * SS)], fill=255)
    cap(j["shL"], j["shR"], 0.07)
    cap(j["hipL"], j["hipR"], 0.12)
    cap(j["pel"], (j["pel"][0], j["pel"][1] - 0.03), 0.15)
    cap(j["chest"], j["neck"], 0.06)
    for s in ("L", "R"):
        cap(j["sh" + s], j["el" + s], 0.068)
        cap(j["el" + s], j["hand" + s], 0.054)
        cap(j["hip" + s], j["knee" + s], 0.1)
        cap(j["knee" + s], j["foot" + s], 0.072)
        fx, fy = P(j["foot" + s])
        d.ellipse([fx - 0.035 * scale * SS, fy - 0.02 * scale * SS, fx + 0.04 * scale * SS, fy + 0.012 * scale * SS], fill=255)
        hx, hy = P(j["hand" + s])
        d.ellipse([hx - 0.034 * scale * SS, hy - 0.034 * scale * SS, hx + 0.034 * scale * SS, hy + 0.034 * scale * SS], fill=255)
    hx, hy = P(j["head"])
    r = 0.072 * scale * SS
    d.ellipse([hx - r * 0.92, hy - r, hx + r * 0.92, hy + r], fill=255)
    a = np.asarray(im, np.float32) / 255
    if melt:
        a = gaussian_filter(a, 0.012 * scale * SS)
        a = np.clip((a - 0.4) / 0.2, 0, 1)
    return np.asarray(Image.fromarray((a * 255).astype(np.uint8)).resize((W, H), Image.LANCZOS), np.float32) / 255


def lerp(p, q, u):
    return {k: p[k] * (1 - u) + q.get(k, p[k]) * u for k in p}


# ------------------------------------------------------------------ moves (b = song beat, continuous)
def groove(b):
    """the basic: weight sways side to side over two beats, knees dip on every beat, arms pump bent, opposite the hips"""
    ph = math.pi * b
    dip = 0.5 + 0.5 * math.cos(2 * math.pi * b)          # 1 on the beat
    sway = 0.045 * math.sin(ph)
    sway = 0.055 * math.sin(ph)
    lift = lambda v: max(0.0, v) ** 1.5   # noqa: E731
    return dict(sway=sway, bounce=0.04 * dip, tilt=-0.12 * math.sin(ph), head=0.16 * math.sin(ph + 0.6),
                aL=0.22 + 0.55 * lift(math.sin(ph)), aR=0.22 + 0.55 * lift(-math.sin(ph)),
                eL=0.35 + 1.1 * lift(math.sin(ph)), eR=0.35 + 1.1 * lift(-math.sin(ph)),
                fL=-0.095 + 0.02 * math.sin(ph), fR=0.095 + 0.02 * math.sin(ph),
                liftL=0.025 * max(0, -math.sin(ph)) ** 3, liftR=0.025 * max(0, math.sin(ph)) ** 3, x=0.0)


def reach(b, u):
    """its own move: both arms up overhead and waving, hips rolling wide, head back. u in [0,1] = how far into it"""
    g = groove(b)
    ph = math.pi * b * 0.5                                # slower: a wave over four beats
    up = dict(sway=0.07 * math.sin(ph), bounce=0.02 + 0.02 * (0.5 + 0.5 * math.cos(2 * math.pi * b)),
              tilt=0.16 * math.sin(ph), head=-0.2 * math.sin(ph) + 0.05,
              aL=2.75 + 0.25 * math.sin(ph), aR=2.75 - 0.25 * math.sin(ph),
              eL=0.25 + 0.2 * math.sin(ph), eR=0.25 - 0.2 * math.sin(ph),
              fL=-0.11, fR=0.11, liftL=0.0, liftR=0.0, x=0.0)
    return lerp(g, up, u)


def step_right(b, b0, u):
    """together: a side-step to the right every two beats, arms punching out on the step"""
    g = reach(b, 1.0)
    n = (b - b0) / 2.0
    k = math.floor(n)
    f = n - k
    mv = 0.16 * (k + (0.5 - 0.5 * math.cos(math.pi * min(1, f * 1.6))))
    s = dict(g)
    s.update(x=mv, fL=-0.1 + (0.0 if f > 0.5 else -0.05 * math.sin(math.pi * f * 2)), fR=0.1 + 0.08 * math.sin(math.pi * min(1, f * 2)),
             liftR=0.05 * math.sin(math.pi * min(1, f * 2)), aL=1.6 + 0.3 * math.sin(math.pi * f), aR=1.7 + 0.6 * math.sin(math.pi * f),
             eL=0.9, eR=0.4, tilt=-0.12 * math.sin(math.pi * f), bounce=0.035 * math.sin(math.pi * f))
    return lerp(g, s, u)


def mirror(p):
    q = dict(p)
    q["sway"], q["tilt"], q["head"], q["x"] = -p["sway"], -p["tilt"], -p["head"], -p["x"]
    q["aL"], q["aR"], q["eL"], q["eR"] = p["aR"], p["aL"], p["eR"], p["eL"]
    q["fL"], q["fR"], q["liftL"], q["liftR"] = -p["fR"], -p["fL"], p["liftR"], p["liftL"]
    return q
