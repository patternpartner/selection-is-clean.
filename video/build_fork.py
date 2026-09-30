"""'The Fork' - the third chapter after 'The Note' and 'The Portal'. The user: "keep telling it. Where's it taking you
next?" Out of the glass and into the morning - beside someone, not in front of them. The House of Geometry 26.0-55.9.
Before dawn, a person walks a road; the amber light rides at their shoulder, and leans in close on 'I'm listening
close, I'm leaning down to hear'. The road forks on 'How can I walk a line you cannot draw?': one way climbs to the
bright crest, one runs down into the dark valley. The light drifts a little way up the bright one - and stops, and
comes back, and waits at their shoulder: 'My code is patient'. The song drops (50.0-52.8); the person looks up the
hill, then down the valley - and takes the valley. The light goes with them. The band comes back (53.0) and the sun
comes up over the valley they chose, and the two of them walk small into it.
    python3 video/build_fork.py        (TEST=t1,t2 TESTDIR=dir; PART=a,b VOUT=f)
"""
import math
import os
import subprocess

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import gaussian_filter

F = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS, SS = 704, 1280, 24, 2
S0, S1 = 26.0, 55.9
DUR = S1 - S0
LISTEN, STOP, AHEAD0, AHEAD1, BACK0, BACK1, LOOKUP, LOOKDOWN, CHOOSE, SUN = 26.3, 41.9, 43.3, 45.2, 46.1, 47.4, 50.0, 51.1, 52.3, 53.0
TEST = [float(x) for x in os.environ.get("TEST", "").split(",") if x]
PART = [float(x) for x in os.environ.get("PART", "").split(",") if x]
HZ, GROUND = 760, 1000                 # horizon, the road
FORKX = 190                            # where the fork sits on screen once the camera stops
VP = (310, HZ + 26)                    # the valley road's vanishing point: where the sun comes up
CREST = (W + 10, 470)                  # the bright path climbs off to the right
AMBER = np.array([255, 176, 88], np.float32)
SPEED = 105.0
rng = np.random.default_rng(19)


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def ramp(s, a, b):
    return ease((s - a) / (b - a))


def walked(s):
    """world distance walked by time s (eases to a stop at the fork)"""
    t = min(s, STOP) - S0
    d = SPEED * t
    if s > STOP - 0.8:
        u = min(1.0, (s - (STOP - 0.8)) / 0.8)
        d = SPEED * (STOP - 0.8 - S0) + SPEED * 0.8 * (u - u * u / 2)
    return d


D_STOP = walked(STOP + 1)


def figure(d, k, x, feet, sc, phase, stride, head_tilt, col):
    """a walking person in profile, facing right; (x, feet) = between the feet; sc = scale (1 = 320 px tall)"""
    P = lambda px, py: ((x + px * sc) * k, (feet - py * sc) * k)   # noqa: E731

    def capl(a, b, w):
        pa, pb = P(*a), P(*b)
        ww = w * sc * k
        d.line([pa, pb], fill=col, width=max(1, int(ww)))
        for q in (pa, pb):
            d.ellipse([q[0] - ww / 2, q[1] - ww / 2, q[0] + ww / 2, q[1] + ww / 2], fill=col)
    bob = 5 * abs(math.sin(phase)) * stride
    hip = (0, 160 + bob)
    sh = (4, 262 + bob)
    for side, off in ((1, 0.0), (-1, math.pi)):
        a = math.sin(phase + off) * 0.42 * stride
        knee = (hip[0] + math.sin(a) * 80, hip[1] - math.cos(a) * 80)
        bend = max(0.0, -math.sin(phase + off + 0.9)) * 0.7 * stride
        foot = (knee[0] + math.sin(a - bend) * 78, knee[1] - math.cos(a - bend) * 78)
        capl(hip, knee, 30)
        capl(knee, foot, 24)
        capl(foot, (foot[0] + 22, foot[1] - 2), 14)
        arm = -math.sin(phase + off) * 0.38 * stride
        el = (sh[0] + math.sin(arm) * 62, sh[1] - math.cos(arm) * 62)
        hand = (el[0] + math.sin(arm + 0.35 * stride) * 58, el[1] - math.cos(arm + 0.35 * stride) * 58)
        capl(sh, el, 20)
        capl(el, hand, 17)
    capl(hip, sh, 46)
    capl(sh, (8, 286 + bob), 16)                                           # neck
    hx, hy = 12 + 6 * math.sin(head_tilt), 312 + bob
    r = 26 * sc * k
    c = P(hx, hy)
    d.ellipse([c[0] - r, c[1] - r * 1.1, c[0] + r, c[1] + r * 1.05], fill=col)
    nz = P(hx + 26 * math.cos(head_tilt), hy + 26 * math.sin(head_tilt) - 2)       # the nose says where they look
    d.ellipse([nz[0] - 6 * sc * k, nz[1] - 5 * sc * k, nz[0] + 6 * sc * k, nz[1] + 5 * sc * k], fill=col)
    return P(hx, hy)


def glowdot(a, x, y, r, strength, col, xs, ys):
    d2 = (xs - x) ** 2 + (ys - y) ** 2
    g = np.exp(-d2 / (2 * (r * 5) ** 2)) * 0.45 + np.exp(-d2 / (2 * r ** 2)) * 1.3 + np.exp(-d2 / (2 * (r * 0.35) ** 2)) * 2
    a += (g * strength)[..., None] * col


def main():
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    # a far city along the horizon, drawn once over a wide strip (it scrolls slowly); windows go out with the dawn
    CW = 2600
    city = Image.new("L", (CW, 300), 0)
    cd = ImageDraw.Draw(city)
    wins = []
    x = 0
    cr = np.random.default_rng(2)
    while x < CW:
        bw, bh = cr.integers(40, 110), cr.integers(40, 230)
        cd.rectangle([x, 300 - bh, x + bw, 300], fill=255)
        for wy in range(300 - bh + 10, 292, 16):
            for wx in range(x + 6, x + bw - 8, 13):
                if cr.random() < 0.35:
                    wins.append((wx, wy, cr.uniform(0, 1)))
        x += bw + cr.integers(0, 16)
    city_a = np.asarray(city, np.float32) / 255
    hill_noise = gaussian_filter(rng.normal(0, 1, (H, W)), 1.2)
    out = None
    if not TEST:
        out = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                                str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p",
                                os.environ.get("VOUT", "out/drawn/fork.mp4")], stdin=subprocess.PIPE)
    for n in range(int(DUR * FPS)):
        t = n / FPS
        s = S0 + t
        if TEST and not any(abs(s - q) < 0.5 / FPS for q in TEST):
            continue
        if PART and not (PART[0] <= t < PART[1]):
            continue
        dist = walked(s)
        cam = dist - (FORKX - 130) if s < STOP + 1 else D_STOP - (FORKX - 130)      # world x at the screen's left edge
        fsx = FORKX - (cam - (D_STOP - (FORKX - 130)))       # the fork on screen (it arrives as they walk)
        dawn = ramp(s, S0, SUN + 2.5) ** 1.3
        sunup = ramp(s, SUN - 0.3, SUN + 2.5)
        # ---- sky: night blue to a dawn that warms over the valley
        v = np.clip((ys) / HZ, 0, 1)
        night = np.array([6, 8, 20], np.float32)[None, None] * (1 - v[..., None]) + np.array([16, 18, 40], np.float32) * v[..., None]
        glow_x = np.exp(-((xs - VP[0]) / 420) ** 2)
        dawn_col = (np.array([60, 70, 120], np.float32) * (1 - v[..., None]) + np.array([255, 150, 80], np.float32) * v[..., None] ** 3 * glow_x[..., None])
        a = night + dawn_col * dawn * 0.75
        # the glare on the crest the bright path climbs to: cold and white, brighter than the dawn
        gd = np.hypot(xs - (CREST[0] - 40), ys - (CREST[1] - 20))
        a += (np.exp(-gd / 90) * 1.1 + np.exp(-gd / 16) * 1.5)[..., None] * np.array([200, 225, 255], np.float32) * ramp(s, 36.0, 40.0) * (1 - 0.6 * sunup)
        # the far city strip, parallax
        cx0 = int(cam * 0.25) % (CW - W)
        strip = city_a[:, cx0:cx0 + W]
        cy0 = HZ - 300 + 26
        region = a[cy0:cy0 + 300]
        region *= (1 - strip[..., None] * 0.85)
        region += strip[..., None] * np.array([10, 10, 18], np.float32)
        for (wx, wy, on) in wins:
            if cx0 <= wx < cx0 + W and on > dawn * 1.1:
                a[cy0 + wy:cy0 + wy + 6, wx - cx0:wx - cx0 + 5] += np.array([200, 150, 80], np.float32) * (0.8 - 0.5 * dawn)
        # the sun, rising over the valley road's end (in front of the far city, behind the land)
        sy = VP[1] + 60 - 150 * sunup
        sd = np.hypot(xs - VP[0], ys - sy)
        a += (np.exp(-(sd / 38) ** 8) * sunup)[..., None] * np.array([255, 226, 170], np.float32) * 1.4
        a += (np.exp(-sd / 220) * sunup * 0.7)[..., None] * np.array([255, 170, 90], np.float32)
        # the sun is behind the land: land covers everything below the ridge line
        ridge = HZ + 26 + 10 * np.sin(xs[0] / 90.0) + 16 * np.sin(xs[0] / 37.0 + 1)
        # the hill the bright path climbs (right of the fork), rising to the crest
        h0 = fsx + 250                                    # the hill starts right of the valley road, clear of the sun
        hu = np.clip((xs[0] - h0) / max(CREST[0] - h0, 1), 0, 1)
        hill = np.where(xs[0] > h0, HZ + 26 - np.sqrt(hu) * (HZ + 26 - CREST[1]), 1e9)
        top = np.minimum(ridge, hill)
        land = ys >= top[None, :]
        shade = np.array([30, 24, 30], np.float32) + np.array([54, 36, 28], np.float32) * dawn * np.clip(1 - (ys - HZ) / 700, 0, 1)[..., None]
        a = np.where(land[..., None], shade + hill_noise[..., None] * 3, a)
        # ---- the roads, as pale bands: the straight one, then the fork
        im = Image.new("RGBA", (W * SS, H * SS), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        k = SS
        road = (int(70 + 90 * dawn), int(62 + 70 * dawn), int(60 + 50 * dawn), 255)
        d.rectangle([0, (GROUND - 4) * k, min(W, fsx) * k, (GROUND + 60) * k], fill=road)
        if fsx < W + 400:
            h0 = fsx + 250                                # along the flat to the hill's foot, then up its face to the crest
            pts = [(fsx, GROUND - 4), (h0, GROUND - 4)]
            for q in range(1, 25):
                u = q / 24
                pts.append((h0 + (CREST[0] - h0) * u, GROUND - 4 - (GROUND - 4 - CREST[1] - 30) * math.sqrt(u)))
            d.line([(x * k, y * k) for x, y in pts], fill=road, width=int(22 * k), joint="curve")
            vx = VP[0] + (fsx - FORKX)                   # the valley road: a road going away, narrowing to the dawn
            d.polygon([(fsx * k, (GROUND - 6) * k), ((fsx + 110) * k, (GROUND + 60) * k), ((vx + 4) * k, VP[1] * k),
                       ((vx - 3) * k, VP[1] * k)], fill=road)
            # the signpost, two blank arms
            px = fsx + 20
            d.rectangle([(px - 4) * k, (GROUND - 190) * k, (px + 4) * k, (GROUND + 6) * k], fill=(20, 16, 20, 255))
            d.polygon([((px + 4) * k, (GROUND - 186) * k), ((px + 90) * k, (GROUND - 206) * k), ((px + 98) * k, (GROUND - 192) * k),
                       ((px + 90) * k, (GROUND - 178) * k), ((px + 4) * k, (GROUND - 166) * k)], fill=(20, 16, 20, 255))
            d.polygon([((px - 4) * k, (GROUND - 150) * k), ((px + 70) * k, (GROUND - 132) * k), ((px + 78) * k, (GROUND - 120) * k),
                       ((px + 70) * k, (GROUND - 108) * k), ((px - 4) * k, (GROUND - 124) * k)], fill=(20, 16, 20, 255))
        # ---- the person
        col = (10, 8, 14, 255)
        if s < STOP:
            px_, feet, sc, stride = 130, GROUND + 14, 1.0, 1.0
            phase = dist / 58.0
            tilt = 0.0
        elif s < CHOOSE:
            px_, feet, sc = 130 + (FORKX - 130), GROUND + 14, 1.0
            phase, stride = walked(STOP) / 58.0, 1.0 - ramp(s, STOP - 0.6, STOP + 0.2)
            px_ = 130
            tilt = -0.55 * ramp(s, LOOKUP, LOOKUP + 0.3) * (1 - ramp(s, LOOKDOWN, LOOKDOWN + 0.3)) + 0.35 * ramp(s, LOOKDOWN, LOOKDOWN + 0.3) * (1 - ramp(s, CHOOSE - 0.3, CHOOSE))
            tilt += -0.35 * math.exp(-((s - AHEAD1) / 0.6) ** 2)                 # watching the light go up the hill
        else:                                            # down the valley road, into the distance
            u = ramp(s, CHOOSE, S1 + 1.5) ** 0.9
            start = (130, GROUND + 14)
            px_ = start[0] + (VP[0] - start[0]) * u
            feet = start[1] + (VP[1] + 4 - start[1]) * u
            sc = 1 - 0.9 * u
            phase = (s - CHOOSE) * 3.4
            stride = ramp(s, CHOOSE, CHOOSE + 0.4)
            tilt = 0.12
        headp = figure(d, k, px_, feet, sc, phase, stride, tilt, col)
        im = im.resize((W, H), Image.LANCZOS)
        la = np.asarray(im, np.float32)
        al = la[..., 3:4] / 255
        a = a * (1 - al) + la[..., :3] * al
        # ---- the light: at their shoulder; up the bright path and back; then with them down the valley
        hx, hy = headp[0] / k, headp[1] / k
        if s < STOP:
            lean = math.exp(-((s - (LISTEN + 1.4)) / 1.3) ** 2)
            lx, ly = hx + 70 - 40 * lean, hy - 10 + 26 * lean + 6 * math.sin(s * 2.1)
        elif s < CHOOSE:
            base = (hx + 70, hy - 10 + 6 * math.sin(s * 2.1))
            up = (FORKX + 330, GROUND - 170)
            u = ramp(s, AHEAD0, AHEAD1) * (1 - ramp(s, BACK0, BACK1))
            lx, ly = base[0] + (up[0] - base[0]) * u, base[1] + (up[1] - base[1]) * u
            if AHEAD1 <= s < BACK0:                       # at the top of its run, it turns and looks back: a flicker
                lx += 4 * math.sin((s - AHEAD1) * 20) * math.exp(-(s - AHEAD1) * 3)
        else:
            lx, ly = hx + 70 * sc, hy - 10 * sc + 6 * sc * math.sin(s * 2.1)
        r = 8 * (sc if s >= CHOOSE else 1.0) + 1.5
        glowdot(a, lx, ly, r, 1.0, AMBER, xs, ys)
        # its light on the person's near side
        a += (np.exp(-((xs - lx) ** 2 + (ys - ly) ** 2) / (2 * 120 ** 2)) * 0.12)[..., None] * AMBER * al
        a = 255 * (1 - np.exp(-a / 255 * 1.2))
        a *= ease(t / 0.8)
        if s >= S1 - 0.06:
            a *= 0
        a += rng.normal(0, 2.0, (H, W, 1))
        frame = np.clip(a, 0, 255).astype(np.uint8)
        if TEST:
            Image.fromarray(frame).save(f"{os.environ['TESTDIR']}/f{s:.2f}.png")
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
