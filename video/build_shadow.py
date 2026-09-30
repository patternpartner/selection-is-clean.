"""'Shadow' (No Ground, the bridge: 'Voices in the distance / Gravity is failing / Hold my final breath now / Break
free'). One story, no words. A bare concrete room, one small high window, one beam of light, a figure sitting in it
with its long shadow across the floor. Gravity fails: the dust stops falling and drifts up, the figure lifts off the
floor - and its shadow stays exactly where it was. It rises to the window; on 'break free' it goes out into the light.
The camera stays with what was left behind: the shadow, with nothing casting it, peels up off the concrete, sits, and
looks up at the window. The dust in the beam is the real universe (recorded worlds, seen through the light).
    python3 video/build_shadow.py          (TEST=t1,t2 TESTDIR=dir for stills at song times; PART=a,b VOUT=f for a stretch)
"""
import json
import math
import os
import subprocess

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy.ndimage import gaussian_filter

F = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS, SS = 704, 1280, 24, 2
T = json.load(open("video/stories/shadow-times.json"))   # song times of the lines (from the vocal stem)
S0, S1 = T["start"], T["end"]
DUR = S1 - S0
TEST = [float(x) for x in os.environ.get("TEST", "").split(",") if x]
PART = [float(x) for x in os.environ.get("PART", "").split(",") if x]
rng = np.random.default_rng(23)
BEAM = np.array([255, 232, 196], np.float32)

# the room, one-point perspective
VP = (352.0, 600.0)
BW = (150, 554, 360, 820)          # back wall x0, x1, y0, y1
WIN = (318, 386, 420, 482)         # the window, high in the back wall
GROUND = 1000.0                    # where the figure sits (hip/feet line on screen)
FX = 400.0                         # the figure's x
UNIT = 250.0                       # px per figure unit when sitting on the floor
PATCH = [(262, 930), (482, 930), (600, 1180), (170, 1180)]   # where the beam lands on the floor


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def ramp(s, a, b):
    return ease((s - a) / (b - a))


# ------------------------------------------------------------------ the figure: joints in profile, facing left, y up
POSE = {
    "sit": dict(hip=(0, 0.03), neck=(-0.09, 0.5), head=(-0.15, 0.63), knee=(-0.31, 0.31), foot=(-0.37, 0.01),
                sh=(-0.08, 0.47), elb=(-0.21, 0.27), hand=(-0.31, 0.26), look=(-1.0, -0.35)),
    "float": dict(hip=(0, 0), neck=(0.01, 0.5), head=(0.03, 0.65), knee=(-0.06, -0.23), foot=(0.03, -0.46),
                  sh=(0.01, 0.47), elb=(-0.12, 0.31), hand=(-0.19, 0.17), look=(-0.35, 1.0)),
    "lookup": dict(hip=(0, 0.03), neck=(-0.05, 0.5), head=(-0.02, 0.64), knee=(-0.31, 0.31), foot=(-0.37, 0.01),
                   sh=(-0.05, 0.47), elb=(-0.2, 0.28), hand=(-0.31, 0.26), look=(-0.12, 1.0)),
}


def mix(a, b, u):
    return {k: tuple(a[k][i] * (1 - u) + b[k][i] * u for i in range(2)) for k in a}


def figure_mask(pose, ox, oy, scale, fy=1.0):
    """silhouette at 2x: pose joints (units) -> screen at origin (ox, oy) with y up; fy stretches/flips vertically"""
    im = Image.new("L", (W * SS, H * SS), 0)
    d = ImageDraw.Draw(im)

    def P(p):
        return ((ox + p[0] * scale) * SS, (oy - p[1] * scale * fy) * SS)

    def cap(a, b, w):
        pa, pb = P(a), P(b)
        ww = max(1, int(w * scale * SS))
        d.line([pa, pb], fill=255, width=ww)
        for q in (pa, pb):
            d.ellipse([q[0] - ww / 2, q[1] - ww / 2, q[0] + ww / 2, q[1] + ww / 2], fill=255)

    # the torso: wider at the chest than at the hips
    hx0, hy0 = P(pose["hip"])
    nx0, ny0 = P(pose["neck"])
    dx, dy = nx0 - hx0, ny0 - hy0
    ln = math.hypot(dx, dy) + 1e-6
    px_, py_ = -dy / ln, dx / ln
    wh, wc = 0.085 * scale * SS, 0.105 * scale * SS
    d.polygon([(hx0 + px_ * wh, hy0 + py_ * wh), (nx0 + px_ * wc, ny0 + py_ * wc), (nx0 - px_ * wc, ny0 - py_ * wc),
               (hx0 - px_ * wh, hy0 - py_ * wh)], fill=255)
    cap(pose["hip"], pose["neck"], 0.15)
    cap(pose["hip"], pose["knee"], 0.085)
    cap(pose["knee"], pose["foot"], 0.07)
    cap(pose["sh"], pose["elb"], 0.06)
    cap(pose["elb"], pose["hand"], 0.055)
    cap(pose["neck"], pose["head"], 0.06)
    hx, hy = P(pose["head"])
    r = 0.112 * scale * SS
    d.ellipse([hx - r, hy - r * abs(fy), hx + r, hy + r * abs(fy)], fill=255)
    lx, ly = pose["look"]
    n = math.hypot(lx, ly)
    nx, ny = P((pose["head"][0] + lx / n * 0.085, pose["head"][1] + ly / n * 0.085))
    rn = 0.035 * scale * SS
    d.ellipse([nx - rn, ny - rn * abs(fy), nx + rn, ny + rn * abs(fy)], fill=255)      # the nose: which way it looks
    a = gaussian_filter(np.asarray(im, np.float32) / 255, 2.2 * SS * max(0.4, scale / UNIT))
    a = np.clip((a - 0.42) / 0.16, 0, 1)                       # melt the joints into one body
    return np.asarray(Image.fromarray((a * 255).astype(np.uint8)).resize((W, H), Image.LANCZOS), np.float32) / 255


def floor_shadow(pose, k, widen, soft):
    """the shadow: the silhouette flipped/stretched by k about the ground line, widening as it comes toward us"""
    from scipy.ndimage import map_coordinates
    m = figure_mask(pose, FX, GROUND, UNIT, fy=k if abs(k) > 0.04 else 0.04)
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    grow = 1 + widen * np.clip((ys - GROUND) / 320, 0, 1)
    src_x = FX + (xs - FX) / grow
    out = map_coordinates(m, [ys, src_x], order=1, mode="constant")
    return gaussian_filter(out, soft)


# ------------------------------------------------------------------ the room
def poly_mask(pts, blur=0):
    im = Image.new("L", (W * SS, H * SS), 0)
    ImageDraw.Draw(im).polygon([(x * SS, y * SS) for x, y in pts], fill=255)
    if blur:
        im = im.filter(ImageFilter.GaussianBlur(blur * SS))
    return np.asarray(im.resize((W, H), Image.LANCZOS), np.float32) / 255


def noise(scale, seed):
    r = np.random.default_rng(seed)
    a = r.random((H // scale + 2, W // scale + 2)).astype(np.float32)
    return np.asarray(Image.fromarray((a * 255).astype(np.uint8)).resize((W + scale * 2, H + scale * 2), Image.BICUBIC),
                      np.float32)[:H, :W] / 255


def room():
    x0, x1, y0, y1 = BW
    back = poly_mask([(x0, y0), (x1, y0), (x1, y1), (x0, y1)])
    floor = poly_mask([(x0, y1), (x1, y1), (W + 400, H), (-400, H)])
    ceil = poly_mask([(-400, 0), (W + 400, 0), (x1, y0), (x0, y0)])
    left = poly_mask([(-400, 0), (x0, y0), (x0, y1), (-400, H)])
    right = poly_mask([(W + 400, 0), (x1, y0), (x1, y1), (W + 400, H)])
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    tex = 0.55 * noise(3, 1) + 0.3 * noise(14, 2) + 0.15 * noise(60, 3)
    stain = gaussian_filter(noise(40, 4), 6)
    concrete = np.array([58, 60, 64], np.float32)
    a = np.zeros((H, W, 3), np.float32)
    for m, lvl in ((back, 0.62), (floor, 0.5), (ceil, 0.28), (left, 0.4), (right, 0.34)):
        a += m[..., None] * concrete * lvl
    a *= (0.78 + 0.35 * tex[..., None]) * (0.85 + 0.25 * stain[..., None])
    # formwork: the seams of the boards the concrete was poured against, and the tie holes
    seam = np.zeros((H, W), np.float32)
    for yy in range(y0 + 58, y1, 58):
        seam += np.exp(-((ys - yy) / 1.1) ** 2)
    for yy in range(y0 + 116, y1, 116):
        for xx in range(x0 + 50, x1, 101):
            seam += np.exp(-(((xs - xx) ** 2 + (ys - yy) ** 2) / 14.0)) * 2
    a *= 1 - 0.35 * np.clip(seam * back, 0, 1)[..., None]
    # a long crack in the floor
    cr = Image.new("L", (W * SS, H * SS), 0)
    d = ImageDraw.Draw(cr)
    pts, x, y = [], 120.0, 1270.0
    while y > 880:
        pts.append((x * SS, y * SS))
        x += rng.normal(3, 9)
        y -= rng.uniform(10, 26)
    d.line(pts, fill=255, width=2 * SS)
    crack = np.asarray(cr.resize((W, H), Image.LANCZOS), np.float32) / 255
    a *= 1 - 0.5 * crack[..., None]
    # corners darker (ambient occlusion along the edges of the back wall)
    edge = np.zeros((H, W), np.float32)
    for (px, py, qx, qy) in ((x0, y0, x0, y1), (x1, y0, x1, y1), (x0, y1, x1, y1), (x0, y0, x1, y0)):
        if px == qx:
            edge += np.exp(-((xs - px) / 16) ** 2) * ((ys > py) & (ys < qy))
        else:
            edge += np.exp(-((ys - py) / 16) ** 2) * ((xs > px) & (xs < qx))
    a *= 1 - 0.35 * np.clip(edge, 0, 1)[..., None]
    return a, floor


def window_bars():
    """the window's cross, as a mask of where light gets through (1 = glass)"""
    wx0, wx1, wy0, wy1 = WIN
    m = poly_mask([(wx0, wy0), (wx1, wy0), (wx1, wy1), (wx0, wy1)])
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    bar = (np.abs(xs - (wx0 + wx1) / 2) < 2.5) | (np.abs(ys - (wy0 + wy1) / 2) < 2.5)
    return m * (~bar)


def beam_geom():
    wx0, wx1, wy0, wy1 = WIN
    shaft = poly_mask([(wx0, wy0), (wx1, wy0), PATCH[1], PATCH[2], PATCH[3], PATCH[0]], blur=6)
    patch = poly_mask(PATCH, blur=10)
    # the bars' shadows inside the shaft and on the patch: a vertical and a horizontal stripe, projected
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    u = np.clip((ys - wy1) / (PATCH[2][1] - wy1), 0, 1)
    cxw = (wx0 + wx1) / 2
    cxp = (PATCH[0][0] + PATCH[1][0] + PATCH[2][0] + PATCH[3][0]) / 4
    xbar = cxw + (cxp - cxw) * u
    vstripe = np.exp(-((xs - xbar) / (2.5 + 9 * u)) ** 2)
    hy = (wy0 + wy1) / 2 + (PATCH[0][1] + 110 - (wy0 + wy1) / 2) * np.clip((ys - wy0) / (1060 - wy0), 0, 1)
    hstripe = np.exp(-((ys - 1045) / 9) ** 2) * patch
    bars = np.clip(vstripe + hstripe, 0, 1)
    # the shaft is brighter near the window and fades toward the floor
    fall = np.clip(1 - (ys - wy0) / 900, 0.25, 1)
    return shaft * fall, patch, bars


class World:
    def __init__(self, path, t0):
        self.p = subprocess.Popen([F, "-loglevel", "error", "-ss", str(t0), "-i", path, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                                  stdout=subprocess.PIPE)
        self.last = np.zeros((H, W, 3), np.uint8)

    def next(self):
        raw = self.p.stdout.read(W * H * 3)
        if len(raw) == W * H * 3:
            self.last = np.frombuffer(raw, np.uint8).reshape(H, W, 3)
        return self.last


def main():
    base, floor = room()
    glass = window_bars()
    shaft, patch, bars = beam_geom()
    world = World("out/your-turn/world.mp4", 30.0)
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    vign = np.clip(1.25 - np.sqrt(((xs - W / 2) / W) ** 2 + ((ys - H * 0.55) / H) ** 2) * 1.35, 0, 1)[..., None]
    sit_shadow = floor_shadow(POSE["sit"], -1.35, 0.45, 1.6)               # flat on the floor, toward us
    out = None
    if not TEST:
        out = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                                str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "15", "-preset", "slow", "-pix_fmt", "yuv420p",
                                os.environ.get("VOUT", "out/drawn/shadow.mp4")], stdin=subprocess.PIPE)
    scroll = 0.0
    for n in range(int(DUR * FPS)):
        t = n / FPS
        s = S0 + t
        wf = world.next()
        # dust drifts down, then - gravity failing - slows, stops and drifts up
        vel = 0.9 * (1 - ramp(s, T["gravity"], T["gravity"] + 3.0)) - 1.6 * ramp(s, T["gravity"] + 1.0, T["gravity"] + 5.0)
        scroll += vel
        if TEST and not any(abs(s - q) < 0.5 / FPS for q in TEST):
            continue
        if PART and not (PART[0] <= t < PART[1]):
            continue
        dust = np.roll(wf, int(scroll) % H, axis=0).astype(np.float32)
        dust = dust * 0.4 + dust.mean(axis=2, keepdims=True) * 0.6 * np.array([1.05, 1.0, 0.9], np.float32)
        # ---- the figure: sitting, then rising toward the window, smaller as it goes back, then gone into the light
        rise = ramp(s, T["gravity"] + 1.5, T["break"] + 0.6)
        gone = ramp(s, T["break"] - 0.2, T["break"] + 0.8)
        pose = mix(POSE["sit"], POSE["float"], ramp(s, T["gravity"] + 1.0, T["gravity"] + 5.0))
        wcx, wcy = (WIN[0] + WIN[1]) / 2, (WIN[2] + WIN[3]) / 2 + 30
        fx = FX + (wcx - FX) * rise ** 1.3
        fy = GROUND + (wcy - GROUND) * rise
        sc = UNIT * (1 - 0.8 * rise ** 0.9)
        fig = figure_mask(pose, fx, fy, sc) * (1 - gone)
        # ---- the shadow: pinned where it was; after the figure is gone it peels up off the floor, sits, looks up
        peel = ramp(s, T["peel"], T["peel"] + 2.4)
        if peel <= 0:
            sh = sit_shadow
            sh_up = 0.0
        else:
            k = -1.35 + 2.35 * peel                         # flat and long -> a line -> upright
            p2 = mix(POSE["sit"], POSE["lookup"], ramp(s, T["look"], T["look"] + 1.6))
            sh = floor_shadow(p2, k, 0.45 * (1 - peel), 1.6 + 1.2 * peel)
            sh_up = peel
        # ---- light
        win_glow = 1.0 + 1.6 * ramp(s, T["break"] - 0.4, T["break"] + 0.3) * (1 - ramp(s, T["break"] + 0.6, T["break"] + 2.6))
        a = base.copy()
        light = patch * (1 - 0.55 * bars) * (1 - 0.92 * sh * (1 - sh_up)) * (1 - 0.9 * fig)
        a += light[..., None] * BEAM * 0.42 * win_glow
        # bounce: the lit patch lifts the room around it a little
        a += gaussian_filter(patch, 60)[..., None] * BEAM * 0.10 * win_glow * floor[..., None]
        shaft_l = shaft * (1 - 0.5 * bars) * (1 - 0.6 * fig)
        a += shaft_l[..., None] * BEAM * 0.10 * win_glow
        a += shaft_l[..., None] * dust * 0.5 * win_glow                  # the dust in the light is the world
        a = a * (1 - glass[..., None]) + glass[..., None] * BEAM * min(1.0, 0.85 * win_glow)
        # the figure: dark, rimmed by the window's light on its upper edges
        up = np.roll(fig, 3, axis=0)
        rim = np.clip(fig - up, 0, 1) * (fig > 0.05)
        a = a * (1 - 0.93 * fig[..., None]) + np.array([10, 10, 12], np.float32) * fig[..., None]
        a += rim[..., None] * BEAM * 0.8
        # the shadow standing up: a darkness the light goes straight through
        if sh_up > 0:
            a = a * (1 - 0.8 * sh[..., None] * sh_up)
        # flare when it goes into the light
        fl = ramp(s, T["break"] - 0.3, T["break"] + 0.2) * (1 - ramp(s, T["break"] + 0.3, T["break"] + 1.8))
        if fl > 0:
            g = np.exp(-(((xs - wcx) / 180) ** 2 + ((ys - wcy + 30) / 180) ** 2))
            a += g[..., None] * BEAM * 0.8 * fl
        a *= vign
        a *= ease(t / 1.5)
        if s >= S1 - 0.5:
            a *= 1 - ease((s - (S1 - 0.5)) / 0.45)
        a += rng.normal(0, 3.0, (H, W, 1))
        frame = np.clip(a, 0, 255).astype(np.uint8)
        if TEST:
            Image.fromarray(frame).save(f"{os.environ['TESTDIR']}/s{s:.2f}.png")
            print("test", round(s, 2), flush=True)
            continue
        out.stdin.write(frame.tobytes())
        if n % 96 == 0:
            print(f"{s:6.1f}", flush=True)
    if out:
        out.stdin.close()
        out.wait()


if __name__ == "__main__":
    main()
