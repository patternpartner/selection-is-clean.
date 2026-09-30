"""'The Fork' v2. The user: "great idea, you can do better with it." v1 was side-on clip art: flat bands, two roads
that read as one diagonal, half the frame dead ground, and the one gesture a dot moving 200 px. v2 puts the camera
BEHIND them, in real perspective, and gives the light a power the story can turn on: it lights whatever road it is on.
The House of Geometry 26.0-55.9. We walk behind a person down a road before dawn, the amber light at their shoulder
(it leans in on "I'm listening close"). The road forks - a Y opening ahead - on "How can I walk a line you cannot
draw?": right, a straight road to a hill glittering with a cold white city; left, a road bending down into a dark
valley. The light darts up the bright road and the road LIGHTS behind it, all the way to the hill, the switchbacks up
the hill lighting lamp by lamp - it could lead them there in a moment. It stops. It comes back ("My code is patient");
its trail goes dark. The song drops: they look right, look left - and take the dark road. The light goes a step ahead
of them and lights THAT road: a lantern for the way they chose. The band returns, the sun comes up out of the valley,
and on the hill the city's lights go out one by one. The camera rises and lets them go.
    python3 video/build_fork2.py       (TEST=t1,t2 TESTDIR=dir; PART=a,b VOUT=f)
"""
import math
import os
import subprocess

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import gaussian_filter, binary_erosion

F = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS, SS = 704, 1280, 24, 2
S0, S1 = 26.0, 55.9
DUR = S1 - S0
LISTEN, STOP, DART0, DART1, BACK0, BACK1, LOOKR, LOOKL, CHOOSE, SUN = 26.3, 41.9, 43.3, 45.2, 46.1, 47.4, 50.0, 51.0, 52.3, 53.0
TEST = [float(x) for x in os.environ.get("TEST", "").split(",") if x]
PART = [float(x) for x in os.environ.get("PART", "").split(",") if x]
HZ, FOC = 760.0, 700.0
ZF = 40.0                                   # the fork, in metres down the road
BACKD = 2.7                                 # the camera walks this far behind them
AMBER = np.array([255, 176, 88], np.float32)
COLDW = np.array([200, 225, 255], np.float32)
rng = np.random.default_rng(31)


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def ramp(s, a, b):
    return ease((s - a) / (b - a))


def walked(s):
    """metres walked from Z=12 by time s (1.72 m/s, easing to a stop just short of the fork)"""
    v = (ZF - 1.2 - 12) / (STOP - S0 - 0.45)
    t = min(s, STOP) - S0
    if s < STOP - 0.9:
        return v * t
    u = min(1.0, (s - (STOP - 0.9)) / 0.9)
    return v * (STOP - 0.9 - S0) + v * 0.9 * (u - u * u / 2)


def XL(z):                                  # the valley road bends left and away
    dz = np.maximum(z - ZF, 0)
    return -0.22 * dz - 0.0009 * dz ** 2


def XR(z):                                  # the bright road runs straight to the hill
    return 0.30 * np.maximum(z - ZF, 0)


# ------------------------------------------------------------------ the person, from behind
def person(k, sc, phase, stride, turn, lean):
    """a figure seen from behind, drawn on its own canvas; sc = px per metre. Returns (RGBA, feet offset)."""
    w, h = int(1.2 * sc) + 8, int(2.0 * sc) + 8
    im = Image.new("L", (w * k, h * k), 0)
    d = ImageDraw.Draw(im)
    fx, fy = w / 2, h - 4
    P = lambda x, y: ((fx + x * sc) * k, (fy - y * sc) * k)   # noqa: E731

    def capl(a, b, wd):
        pa, pb = P(*a), P(*b)
        ww = max(1, int(wd * sc * k))
        d.line([pa, pb], fill=255, width=ww)
        for q in (pa, pb):
            d.ellipse([q[0] - ww / 2, q[1] - ww / 2, q[0] + ww / 2, q[1] + ww / 2], fill=255)
    bob = 0.025 * abs(math.sin(phase)) * stride
    for side in (-1, 1):
        lift = max(0.0, math.sin(phase + (0 if side < 0 else math.pi))) * 0.12 * stride     # the stepping foot rises
        capl((side * 0.1, 0.9 + bob), (side * 0.11, 0.47 + bob + lift * 0.5), 0.15)
        capl((side * 0.11, 0.47 + bob + lift * 0.5), (side * 0.11, 0.05 + lift), 0.12)
        capl((side * 0.11, 0.05 + lift), (side * 0.11, 0.02 + lift), 0.13)
        sw = math.sin(phase + (math.pi if side < 0 else 0)) * 0.05 * stride
        capl((side * 0.22, 1.42 + bob), (side * 0.27, 1.1 + bob), 0.1)
        capl((side * 0.27, 1.1 + bob), (side * 0.28, 0.82 + bob + sw), 0.085)
    d.polygon([P(-0.24, 0.72 + bob), P(0.24, 0.72 + bob), P(0.24, 1.44 + bob), P(-0.24, 1.44 + bob)], fill=255)   # coat
    capl((-0.2, 1.44 + bob), (0.2, 1.44 + bob), 0.12)
    capl((0, 1.44 + bob), (0.0 + lean * 0.03, 1.56 + bob), 0.1)                                        # neck
    hx, hy = 0.0 + lean * 0.06 + turn * 0.015, 1.64 + bob - abs(lean) * 0.02
    r = 0.115 * sc * k
    c = P(hx, hy)
    d.ellipse([c[0] - r, c[1] - r * 1.15, c[0] + r, c[1] + r * 1.0], fill=255)
    if abs(turn) > 0.05:                                                                               # a profile edge when they look aside
        n = P(hx + turn * 0.13, hy - 0.01)
        d.ellipse([n[0] - 0.03 * sc * k, n[1] - 0.025 * sc * k, n[0] + 0.03 * sc * k, n[1] + 0.03 * sc * k], fill=255)
    m = np.asarray(im.resize((w, h), Image.LANCZOS), np.float32) / 255
    return m, (w / 2, h - 4)


def glowdot(a, x, y, r, strength, col, xs, ys):
    d2 = (xs - x) ** 2 + (ys - y) ** 2
    g = np.exp(-d2 / (2 * (r * 5) ** 2)) * 0.45 + np.exp(-d2 / (2 * r ** 2)) * 1.3 + np.exp(-d2 / (2 * (r * 0.35) ** 2)) * 2
    a += (g * strength)[..., None] * col


def main():
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    n = 1024
    gr = gaussian_filter(rng.random((n, n)).astype(np.float32), 1.0, mode="wrap")
    gr = (gr - gr.min()) / (gr.max() - gr.min())
    tuft = gaussian_filter(rng.random((n, n)).astype(np.float32), 5, mode="wrap")
    tuft = (tuft - tuft.min()) / (tuft.max() - tuft.min())
    # skyline: far hills, low in the valley on the left; the big hill on the right with its city
    xline = np.arange(W, dtype=np.float32)
    far = HZ - 26 - 22 * np.sin(xline / 140 + 0.5) - 10 * np.sin(xline / 47) + 30 * np.exp(-((xline - 190) / 150) ** 2)
    hillc, hillw = 600.0, 240.0
    hill = HZ + 2 - 250 * np.exp(-((xline - hillc) / hillw) ** 2 * 2.2) * (xline > 380) - 250 * np.exp(-((xline - hillc) / hillw) ** 2 * 2.2) * (xline <= 380) * np.exp(-((380 - xline) / 40) ** 2)
    ridge = np.minimum(far, hill)
    cr = np.random.default_rng(6)
    city = []                                                          # the city on the hill: many small cold lights
    for _ in range(700):
        x = cr.normal(hillc + 20, 70)
        if 430 < x < W - 2:
            top = hill[int(x)]
            y = top + abs(cr.normal(0, 1)) * 38 + 2
            if y < HZ - 4:
                city.append((x, y, cr.uniform(0.4, 1.0), cr.uniform(0, 1)))
    # the switchback path up the hill: screen points from the road's end at the hill's foot up into the city
    foot = (352 + FOC * XR(ZF + 300) / (300 + BACKD + 1.2), HZ + 3)
    swb = [foot]
    for i, (dx, dy) in enumerate([(40, -40), (-50, -35), (55, -38), (-45, -36), (40, -34)]):
        p = swb[-1]
        swb.append((p[0] + dx, p[1] + dy))
    lamps = []
    for i in range(len(swb) - 1):
        for u in (0.25, 0.75):
            lamps.append((swb[i][0] + (swb[i + 1][0] - swb[i][0]) * u, swb[i][1] + (swb[i + 1][1] - swb[i][1]) * u, (i * 2 + (1 if u > 0.5 else 0)) / (2 * (len(swb) - 1))))
    stars = [(cr.uniform(0, W), cr.uniform(0, HZ - 200), cr.uniform(0.3, 1)) for _ in range(260)]
    out = None
    if not TEST:
        out = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                                str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p",
                                os.environ.get("VOUT", "out/drawn/fork2.mp4")], stdin=subprocess.PIPE)
    for fr in range(int(DUR * FPS)):
        t = fr / FPS
        s = S0 + t
        if TEST and not any(abs(s - q) < 0.5 / FPS for q in TEST):
            continue
        if PART and not (PART[0] <= t < PART[1]):
            continue
        # ---- the person and the camera
        if s < CHOOSE:
            pz = 12 + walked(s)
            px_w = 0.0
            stride = 1.0 - ramp(s, STOP - 0.7, STOP + 0.1)
            phase = walked(s) / 0.78 * math.pi
        else:
            dist = 1.55 * (s - CHOOSE) * ramp(s, CHOOSE, CHOOSE + 0.6)
            pz = 12 + walked(STOP) + dist * 0.9
            px_w = float(XL(pz)) - 0.25 * ramp(s, CHOOSE, CHOOSE + 1)
            stride = ramp(s, CHOOSE, CHOOSE + 0.5)
            phase = dist / 0.78 * math.pi
        camz = (12 + walked(min(s, CHOOSE))) - BACKD
        camh = 1.45 + 1.6 * ramp(s, SUN + 0.5, S1)                   # the camera rises and lets them go
        camx = 0.25
        dawn = ramp(s, S0, SUN + 2) ** 1.4
        sun = ramp(s, SUN - 0.2, SUN + 2.4)
        # ---- sky
        v = np.clip(ys / HZ, 0, 1)
        a = np.array([4, 6, 16], np.float32) * (1 - v[..., None]) + np.array([14, 16, 34], np.float32) * v[..., None]
        valley = np.exp(-((xs - 190) / 330) ** 2) * v ** 4
        a += valley[..., None] * np.array([150, 80, 50], np.float32) * (0.25 * dawn + 1.4 * sun)
        a += (v ** 2)[..., None] * np.array([30, 40, 80], np.float32) * dawn
        for (sx, sy, b) in stars:
            if b * (1 - dawn) > 0.15:
                a[int(sy), int(sx)] += 160 * b * (1 - dawn)
        sy = HZ - 14 - 100 * sun
        sd = np.hypot(xs - 190, ys - sy)
        a += (np.clip((34 - sd) / 2, 0, 1) * sun)[..., None] * np.array([255, 200, 130], np.float32) * 1.4
        a += (np.exp(-sd / 200) * sun)[..., None] * np.array([255, 140, 60], np.float32) * 1.1
        # ---- the land beyond: far hills and the big hill, then the ground plane
        top = ridge[None, :]
        beyond = (ys >= top) & (ys < HZ + 1)
        a = np.where(beyond[..., None], np.array([10, 9, 14], np.float32) + np.array([40, 26, 30], np.float32) * dawn * 0.4, a)
        dy = ys - HZ
        ok = dy > 0.5
        Z = np.where(ok, FOC * camh / np.maximum(dy, 0.5), 1e6)
        X = camx + (xs - W / 2) * Z / FOC
        Zw = Z + camz
        u_ = (np.floor(X * 90) % n).astype(np.int64)
        v_ = (np.floor(Zw * 90) % n).astype(np.int64)
        g = gr[v_, u_]
        tu = tuft[(np.floor(Zw * 7) % n).astype(np.int64), (np.floor(X * 7) % n).astype(np.int64)]
        rmain = (np.abs(X) < 1.5) & (Zw < ZF + 1.5)
        rl = np.abs(X - XL(Zw)) < 1.5 * (1 + 0.004 * np.maximum(Zw - ZF, 0))
        rr = np.abs(X - XR(Zw)) < 1.5 * (1 + 0.004 * np.maximum(Zw - ZF, 0))
        road = ((rmain | ((rl | rr) & (Zw >= ZF - 1.5))) & ok).astype(np.float32)
        road = gaussian_filter(road, 0.8)
        grass = np.array([14, 16, 14], np.float32) + np.array([20, 22, 14], np.float32) * tu[..., None] + 8 * g[..., None]
        grav = np.array([46, 42, 44], np.float32) + np.array([40, 36, 32], np.float32) * g[..., None]
        ground = grass * (1 - road[..., None]) + grav * road[..., None]
        fog = np.exp(-np.clip(Z, 0, 4000) / 55)
        ground = ground * (0.25 + 0.75 * fog[..., None]) + np.array([20, 22, 40], np.float32) * (1 - fog[..., None]) * (0.6 + dawn)
        ground *= (0.55 + 0.6 * dawn)
        a = np.where((ok & (ys >= HZ))[..., None], ground, a)
        # mist lying in the valley, gold when the sun comes
        mist = np.exp(-((ys - HZ - 6) / 16) ** 2) * np.exp(-((xs - 200) / 260) ** 2)
        a += mist[..., None] * (np.array([40, 44, 70], np.float32) + np.array([200, 130, 70], np.float32) * sun)
        # ---- the light: its place in the world (or on the hill path, in screen)
        head = (px_w, pz, 1.66)
        on_screen = None
        if s < STOP + 0.2:
            lean = math.exp(-((s - (LISTEN + 1.6)) / 1.4) ** 2)
            L = (px_w + 0.42 - 0.26 * lean, pz + 0.05, 1.62 + 0.04 * math.sin(s * 2.2) + 0.06 * lean)
        elif s < CHOOSE:
            home = (px_w + 0.42, pz + 0.05, 1.62 + 0.04 * math.sin(s * 2.2))
            out_u = ramp(s, DART0, DART1)
            back_u = ramp(s, BACK0, BACK1)
            if s < DART0 or s >= BACK1:
                L = home
            else:
                # the dart: along the bright road to the hill's foot (first 55%), then up the switchbacks
                uu = out_u if s < BACK0 else 1.0
                ground_u = min(1.0, uu / 0.55)
                zz = ZF + (ZF + 300 - ZF) * ground_u ** 2.2
                far_pt = (float(XR(zz)), zz, 1.2)
                L = (home[0] + (far_pt[0] - home[0]) * min(1, ground_u * 4), far_pt[1] if ground_u > 0 else home[1], home[2] + (1.2 - home[2]) * min(1, ground_u * 4))
                if uu > 0.55:
                    k2 = (uu - 0.55) / 0.45 * (len(swb) - 1) * 0.6                   # 60% of the way up the hill
                    i = min(int(k2), len(swb) - 2)
                    f = k2 - i
                    on_screen = (swb[i][0] + (swb[i + 1][0] - swb[i][0]) * f, swb[i][1] + (swb[i + 1][1] - swb[i][1]) * f - 6)
                if s >= BACK0:                                              # coming home: straight back, fast
                    far = on_screen
                    on_screen = None
                    L = home if back_u > 0.98 else L
                    if back_u < 0.98:
                        # interpolate in screen space from where it was to its home
                        dzh = home[1] - camz
                        hx_ = W / 2 + FOC * (home[0] - camx) / dzh
                        hy_ = HZ + FOC * (camh - home[2]) / dzh
                        f0 = far if far else (hx_, hy_)
                        on_screen = (f0[0] + (hx_ - f0[0]) * back_u, f0[1] + (hy_ - f0[1]) * back_u)
        else:                                                           # the lantern: a step ahead, low, on their road
            ahead = 1.3 * ramp(s, CHOOSE, CHOOSE + 0.7)
            L = (float(XL(pz + ahead)) - 0.5 * ramp(s, CHOOSE, CHOOSE + 0.7), pz + ahead, 1.5)
        # ---- light on the ground: its own pool, the bright road's trail (fading after it comes back), the lantern
        pool = 1.4 / (1 + ((X - L[0]) ** 2 + (Zw - L[1]) ** 2 + L[2] ** 2) * 1.6) if on_screen is None else 0 * X
        lit = pool
        tr_fade = 1 - ramp(s, BACK0 + 0.3, BACK1 + 0.8)
        if s >= DART0 and tr_fade > 0:
            gu = min(1.0, ramp(min(s, BACK0), DART0, DART1) / 0.55)          # how far down the bright road it has been
            reach = ZF + 300 * gu ** 2.2
            onroad = rr & (Zw >= ZF - 1) & (Zw <= reach)
            centre = np.exp(-np.abs(X - XR(Zw)) / 0.35)                         # a glowing line up the middle of the road
            lit = lit + onroad * tr_fade * (0.25 + 1.4 * centre) * np.clip((Zw - ZF + 1) / 3, 0, 1) * 0.6
        if s >= CHOOSE:
            # the lantern lights THEIR road the way it lit the other: a glowing line running on ahead of them
            reach_l = L[1] + 2 + 26 * ramp(s, CHOOSE + 0.2, S1 - 0.5)
            cx_road = np.where(Zw < ZF, 0.0, XL(Zw))
            centre_l = np.exp(-np.abs(X - cx_road) / 0.35)
            onl = (rl | rmain) & (Zw >= pz - 1.5) & (Zw <= reach_l)
            lit = lit + onl * (0.12 + 2.2 * centre_l) * 0.6 * ramp(s, CHOOSE, CHOOSE + 0.8) * np.clip((reach_l - Zw) / 4, 0, 1) * np.clip((Zw - (pz - 1.5)) / 2.5, 0, 1)
        a += (lit * (0.35 + 0.65 * road))[..., None] * AMBER * 0.55 * ok[..., None]
        # ---- the hill's city: cold lights; the switchback lamps light as the light passes; the city goes out at sunrise
        for (cx_, cy_, b, when) in city:
            off = sun > when * 0.9 + 0.08
            if not off:
                a[int(cy_), int(cx_)] += COLDW * b * (0.8 + 0.4 * ramp(s, 36, 40))
                if b > 0.9:
                    a[max(0, int(cy_) - 1):int(cy_) + 2, max(0, int(cx_) - 1):int(cx_) + 2] += COLDW * 0.25
        hill_glow = np.exp(-(((xs - hillc - 20) / 120) ** 2 + ((ys - (HZ - 200)) / 90) ** 2)) * (1 - 0.8 * sun)
        a += (hill_glow * 0.25)[..., None] * COLDW
        up_u = 0.0
        if DART0 <= s < BACK0:
            up_u = max(0.0, (ramp(s, DART0, DART1) - 0.55) / 0.45) * 0.6
        elif s >= BACK0:
            up_u = 0.6
        lamp_fade = tr_fade if s >= BACK0 else 1.0
        for (lx_, ly_, at) in lamps:
            if at <= up_u + 1e-3 and lamp_fade > 0:
                glowdot(a, lx_, ly_, 1.6, 0.8 * lamp_fade, AMBER, xs, ys)
        far_light = on_screen is not None or L[1] > pz + 0.2
        if far_light:
            # ---- the light itself (drawn before the person when it is beyond them)
            if on_screen is not None:
                glowdot(a, on_screen[0], on_screen[1], 3.0, 1.0, AMBER, xs, ys)
            else:
                dzl = L[1] - camz
                if dzl > 0.2:
                    lx_s = W / 2 + FOC * (L[0] - camx) / dzl
                    ly_s = HZ + FOC * (camh - L[2]) / dzl
                    r = max(3.0 if s >= CHOOSE else 2.0, 0.05 * FOC / dzl)
                    glowdot(a, lx_s, ly_s, r, 1.6 if s >= CHOOSE else 1.0, AMBER, xs, ys)
        # ---- the person
        dzp = pz - camz
        if dzp > 0.3:
            sc = FOC / dzp
            turn = 0.0
            if STOP < s < CHOOSE:
                turn = 1.0 * ramp(s, DART0 - 0.2, DART0 + 0.3) * (1 - ramp(s, BACK0, BACK1)) \
                    + 1.0 * ramp(s, LOOKR, LOOKR + 0.3) * (1 - ramp(s, LOOKL - 0.1, LOOKL + 0.2)) \
                    - 1.0 * ramp(s, LOOKL, LOOKL + 0.3) * (1 - ramp(s, CHOOSE - 0.2, CHOOSE + 0.3))
            lean = math.exp(-((s - (LISTEN + 1.6)) / 1.4) ** 2) if s < STOP else 0.0
            m, (ox, oy) = person(SS, sc, phase, stride, turn, lean)
            fx_ = W / 2 + FOC * (px_w - camx) / dzp
            fy_ = HZ + FOC * camh / dzp
            x0, y0 = int(fx_ - ox), int(fy_ - oy)
            hh, ww = m.shape
            ya, yb, xa, xb = max(0, y0), min(H, y0 + hh), max(0, x0), min(W, x0 + ww)
            if yb > ya and xb > xa:
                mm = m[ya - y0:yb - y0, xa - x0:xb - x0]
                # the rim: the side of them facing the light, lit amber
                lsx = W / 2 + FOC * (L[0] - camx) / max(L[1] - camz, 0.3) if on_screen is None else on_screen[0]
                dirx = 1 if lsx > fx_ else -1
                sh = np.roll(mm, -dirx * 3, axis=1)
                rim = np.clip(mm - sh, 0, 1)
                col = np.array([8, 7, 12], np.float32)
                reg = a[ya:yb, xa:xb]
                reg[:] = reg * (1 - mm[..., None]) + col * mm[..., None] + rim[..., None] * AMBER * 0.55
                if s >= SUN:
                    rim2 = np.clip(mm - np.roll(mm, 3, axis=1), 0, 1)
                    reg += rim2[..., None] * np.array([255, 180, 110], np.float32) * 0.5 * sun
        if not far_light:
            # ---- the light itself
            if on_screen is not None:
                glowdot(a, on_screen[0], on_screen[1], 3.0, 1.0, AMBER, xs, ys)
            else:
                dzl = L[1] - camz
                if dzl > 0.2:
                    lx_s = W / 2 + FOC * (L[0] - camx) / dzl
                    ly_s = HZ + FOC * (camh - L[2]) / dzl
                    r = max(3.0 if s >= CHOOSE else 2.0, 0.05 * FOC / dzl)
                    glowdot(a, lx_s, ly_s, r, 1.6 if s >= CHOOSE else 1.0, AMBER, xs, ys)
        a = 255 * (1 - np.exp(-a / 255 * 1.25))
        a *= ease(t / 0.8)
        if s >= S1 - 0.06:
            a *= 0
        a += rng.normal(0, 2.2, (H, W, 1))
        frame = np.clip(a, 0, 255).astype(np.uint8)
        if TEST:
            Image.fromarray(frame).save(f"{os.environ['TESTDIR']}/g{s:.2f}.png")
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
