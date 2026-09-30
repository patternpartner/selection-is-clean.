"""'The Lead' (Surrender to the Undertow 45.9-65.9 + the end line). One turn, no words.
Two dancers either side of a thin line of light - a mirror. The dark one is us; the other, made of the living
universe, is its reflection and follows every move. 'Let the music show you how': the reflection breaks the mirror
and dances a move of its own - the mirror line cracks and goes - and the dark one stops. 'Breathe it in and let it
go': a beat late, small at first, it copies. 'Surrendering to the undertow': together, no longer mirrored.
'...stepping into the light': both step the SAME way, toward the light - a reflection would have stepped the other.
'We are going to ignite': the drop. 'Where the lost are finally found': their inner hands meet.
Choreography in video/dancer.py, every move a function of the song's beat.
    python3 video/build_the_lead.py        (TEST=t1,t2 TESTDIR=dir for stills; PART=a,b VOUT=f for a stretch)
"""
import math
import os
import subprocess
import sys

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import gaussian_filter

sys.path.insert(0, os.path.dirname(__file__))
import dancer as D  # noqa: E402

F = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 704, 1280, 24
BPM, PHASE = 124.0, 0.04
BEAT = 60 / BPM
S0, S1 = 45.9, 65.9
DUR = S1 - S0
L = dict(show=52.6, breathe=54.38, surrender=56.34, step=58.4, ignite=61.56, deep=62.1, found=64.2)
TEST = [float(x) for x in os.environ.get("TEST", "").split(",") if x]
PART = [float(x) for x in os.environ.get("PART", "").split(",") if x]
SCALE, FEET = 430.0, 1070.0
XL, XR = 226.0, 478.0          # the two dancers; the mirror between them at 352
WARM = np.array([255, 214, 160], np.float32)
COOL = np.array([150, 220, 255], np.float32)
rng = np.random.default_rng(31)


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def ramp(s, a, b):
    return ease((s - a) / (b - a))


def beat(s):
    return (s - PHASE) / BEAT


def params(s):
    """(leader params, follower params) at song time s"""
    b = beat(s)
    bshow = beat(L["show"])
    # the leader
    if s < L["show"]:
        lead = D.groove(b)
    elif s < L["breathe"]:
        frozen = D.groove(bshow)                    # stops where it was, only breathing
        lead = dict(frozen)
        lead["bounce"] = frozen["bounce"] * 0.3 + 0.01 * math.sin(2 * math.pi * (s - L["show"]) / 2.2)
        lead["head"] = frozen["head"] * (1 - ramp(s, L["show"], L["show"] + 0.6)) + 0.15   # it watches
    else:
        u = ramp(s, L["breathe"], L["surrender"])
        lag = BEAT * (1 - ramp(s, L["breathe"] + 0.8, L["surrender"]))   # a beat behind, catching up
        lead = D.lerp(D.groove(bshow), D.reach(beat(s - lag), 0.35 + 0.65 * u), ramp(s, L["breathe"], L["breathe"] + 0.5))
    # the reflection: mirrors the leader exactly, until it doesn't
    if s < L["show"]:
        fol = D.mirror(lead)
    else:
        own = D.reach(b, ramp(s, L["show"], L["show"] + BEAT * 1.5))
        own = D.lerp(D.mirror(D.groove(b)), own, ramp(s, L["show"], L["show"] + BEAT))
        together = ramp(s, L["breathe"], L["surrender"])
        fol = D.lerp(D.mirror(own), own, together) if s >= L["breathe"] else D.mirror(own)
        fol = own if s >= L["surrender"] else fol
    # together: the same move, same direction
    if s >= L["surrender"]:
        lead = D.reach(b, 1.0)
        fol = D.reach(b, 1.0)
    if s >= L["step"]:
        st = D.step_right(b, beat(L["step"]), ramp(s, L["step"], L["step"] + 0.4) * (1 - ramp(s, L["ignite"] - 0.2, L["ignite"] + 0.2)))
        lead, fol = st, dict(st)
        cap = 0.18
        lead["x"] = min(lead["x"], cap)
        fol["x"] = min(fol["x"], cap)
    if s >= L["ignite"] - 0.2:
        # the drop: arms flung up, then grooving together, travelled to where the steps left them
        g = D.reach(b, 1.0)
        g["x"] = 0.18
        for p in (lead, fol):
            k = ramp(s, L["ignite"] - 0.2, L["ignite"] + 0.2)
            p.update(D.lerp(p, g, k))
    if s >= L["found"]:
        # inner hands reach for each other: the leader's right, the reflection's left
        k = ramp(s, L["found"], L["found"] + 1.0)
        for p in (lead, fol):
            p["x"] = p["x"] * (1 - k)                 # they come back toward each other to meet
        target = (352 - XL) / SCALE
        best = min(((abs(D.pose(dict(lead, aR=a_, eR=0.15, x=0.0))["handR"][0] - target), a_) for a_ in np.linspace(0.2, 1.6, 57)))[1]
        lead["aR"] = lead["aR"] * (1 - k) + best * k
        lead["eR"] = lead["eR"] * (1 - k) + 0.15 * k
        best_f = min(((abs(D.pose(dict(fol, aL=a_, eL=0.15, x=0.0))["handL"][0] + target), a_) for a_ in np.linspace(0.2, 1.6, 57)))[1]
        fol["aL"] = fol["aL"] * (1 - k) + best_f * k
        fol["eL"] = fol["eL"] * (1 - k) + 0.15 * k
    return lead, fol


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


def stage():
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    a = np.zeros((H, W, 3), np.float32) + np.array([7, 7, 11], np.float32)
    horizon = 820.0
    floor = ys > horizon
    # the light on the right: a bright doorway of haze at the edge of the floor
    glow = np.exp(-(((xs - 760) / 260) ** 2 + ((ys - 760) / 420) ** 2))
    a += glow[..., None] * WARM * 0.35
    back = np.exp(-(((xs - 352) / 420) ** 2 + ((ys - 520) / 380) ** 2))
    a += back[..., None] * np.array([40, 50, 80], np.float32) * 0.6
    fl = np.clip((ys - horizon) / (H - horizon), 0, 1)
    a[floor] = a[floor] * 0.6 + (np.array([14, 14, 20], np.float32) * (0.6 + 0.8 * fl[floor][..., None]))
    # floor boards receding
    for k in range(-12, 13):
        x_far, x_near = 352 + k * 26, 352 + k * 150
        u = np.clip((ys - horizon) / (H - horizon), 0, 1)
        xl = x_far + (x_near - x_far) * u
        a *= 1 - (0.25 * np.exp(-((xs - xl) / 1.4) ** 2) * floor)[..., None]
    return a, glow, horizon


def main():
    base, glow, horizon = stage()
    world = World("out/your-turn/world.mp4", 120.0)
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    trails = {"L": [], "F": []}
    out = None
    if not TEST:
        out = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                                str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "15", "-preset", "slow", "-pix_fmt", "yuv420p",
                                os.environ.get("VOUT", "out/drawn/the-lead.mp4")], stdin=subprocess.PIPE)
    for n in range(int(DUR * FPS)):
        t = n / FPS
        s = S0 + t
        wf = world.next().astype(np.float32)
        half = np.asarray(Image.fromarray(wf.astype(np.uint8)).resize((W // 2, H // 2), Image.BOX), np.float32)
        fine = gaussian_filter(np.tile(half, (2, 2, 1)), (1.2, 1.2, 0))       # smaller, more, softer: a body of light
        lp, fp = params(s)
        jl, jf = D.pose(lp), D.pose(fp)
        # hand trails: remember where the hands have been (screen coords), keep ~0.6 s
        for key, j, x0 in (("L", jl, XL), ("F", jf, XR)):
            pts = [(x0 + j[h][0] * SCALE, FEET - j[h][1] * SCALE) for h in ("handL", "handR")]
            trails[key].append(pts)
            trails[key] = trails[key][-14:]
        if TEST and not any(abs(s - q) < 0.5 / FPS for q in TEST):
            continue
        if PART and not (PART[0] <= t < PART[1]):
            continue
        ml = D.draw(jl, XL, FEET, SCALE, W, H)
        mf = D.draw(jf, XR, FEET, SCALE, W, H)
        drop = ramp(s, L["ignite"] - 0.05, L["ignite"] + 0.25)
        b = beat(s)
        pulse = (0.5 + 0.5 * math.cos(2 * math.pi * b)) ** 6
        a = base.copy()
        # after the drop the light floods and the floor fills with the world, rising
        if drop > 0:
            a += glow[..., None] * WARM * 0.5 * drop * (0.8 + 0.2 * pulse)
            rise = np.roll(fine, -int((s - L["ignite"]) * 120) % H, axis=0)
            fl = np.clip((ys - horizon + 200) / 500, 0, 1)[..., None]
            a += rise * fl * 0.55 * drop
        # the mirror: a thin line of light between them, until the reflection breaks it
        if s < L["show"] + 1.2:
            crack = ramp(s, L["show"], L["show"] + 1.2)
            line = np.exp(-((xs - 352) / 1.2) ** 2) * np.clip((FEET + 20 - ys) / 60, 0, 1) * np.clip((ys - 360) / 80, 0, 1)
            if crack > 0:   # it splits into pieces that fall away and fade
                seg = (np.floor(ys / 70) % 2 == 0)
                shift = np.where(seg, 1, -1) * crack * 28
                line = np.exp(-((xs - 352 - shift) / 1.2) ** 2) * np.clip((FEET + 20 - ys) / 60, 0, 1) * np.clip((ys - 360 - crack * 300) / 80, 0, 1)
            a += line[..., None] * np.array([200, 225, 255], np.float32) * 0.8 * (1 - crack)
        # reflections on the glossy floor
        for m, col in ((ml, None), (mf, None)):
            refl = np.zeros_like(m)
            hgt = int(H - FEET)
            src = m[int(FEET) - hgt:int(FEET)][::-1]
            refl[int(FEET):int(FEET) + len(src)] = src
            refl = gaussian_filter(refl, 4) * np.clip(1 - (ys - FEET) / 220, 0, 1)
            if m is ml:
                a *= (1 - 0.35 * refl[..., None])
            else:
                a += refl[..., None] * np.clip(fine * 1.5 + 40, 0, 255) * 0.22
        # the leader: dark, rimmed by the light on the right
        a += gaussian_filter(ml, 30)[..., None] * np.array([70, 80, 120], np.float32) * 0.9
        rim_l = np.clip(ml - np.roll(ml, -4, axis=1), 0, 1) + 0.5 * np.clip(ml - np.roll(ml, 3, axis=0), 0, 1)
        a = a * (1 - 0.95 * ml[..., None]) + np.array([8, 8, 10], np.float32) * ml[..., None]
        a += np.clip(rim_l, 0, 1)[..., None] * WARM * (0.8 + 0.3 * drop)
        # the reflection: made of the living world, with a glow
        halo = gaussian_filter(mf, 9)
        a += halo[..., None] * COOL * 0.18
        body = np.clip(fine * 3.2 + gaussian_filter(fine, (6, 6, 0)) * 2.5 + np.array([30, 55, 95], np.float32), 0, 255)
        a = a * (1 - mf[..., None]) + body * mf[..., None]
        rim_f = np.clip(mf - np.roll(mf, -3, axis=1), 0, 1)
        a += rim_f[..., None] * COOL * 0.5
        # hand trails
        im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
        d = ImageDraw.Draw(im, "RGBA")
        for key, col in (("L", (255, 206, 140)), ("F", (150, 225, 255))):
            tr = trails[key]
            for h in range(2):
                for i in range(1, len(tr)):
                    al = int(150 * (i / len(tr)) ** 2)
                    d.line([tr[i - 1][h], tr[i][h]], fill=col + (al,), width=3)
        a = np.asarray(im, np.float32)
        # camera: still until the drop, then a push in that breathes on the beat
        z = 1.0 + 0.06 * drop + 0.012 * pulse * drop
        if z > 1.001:
            cw, ch = W / z, H / z
            x0, y0 = min(W - cw, (W - cw) / 2 + 20 * drop), min(H - ch, (H - ch) / 2 + 60 * drop)
            a = np.asarray(Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).resize((W, H), Image.LANCZOS,
                                                                                         box=(x0, y0, x0 + cw, y0 + ch)), np.float32)
        a *= ease(t / 0.5)
        if s >= S1 - 0.1:
            a *= 0.0
        a += rng.normal(0, 2.5, (H, W, 1))
        frame = np.clip(a, 0, 255).astype(np.uint8)
        if TEST:
            Image.fromarray(frame).save(f"{os.environ['TESTDIR']}/l{s:.2f}.png")
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
