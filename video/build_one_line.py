"""'One Line' - the user's own likeness (blue-screen dances u114, u118, u121, u113), drawn by ONE glowing line that never
lifts, like the trace of an oscilloscope. Claude's idea (the user: "Ok"): one line, one take, no going back. The line is
his outline, traced off his keyed footage every frame, and the song's own waveform shivers along it. Early on, on a hit,
the line takes a knot - a small amber loop at his chest - and nothing undoes it: it rides in every frame after and
grows. In the silence it tries to unpick it, and it snaps back. At the end the line leaves him and writes the end card,
and the knot is the 'o' of "once".
Song: the user's 'Before the Sky Unfolds' (structure read off its loudness: a breath at 72.0, the lift at 72.5, the long
loud stretch to 102, a fade into near-silence 103-107, a soft rebuild from 107). Song 64.0-131.0.
  64.0-72.5   a dot draws a flat trace across the dark; it rises and becomes him, standing (u114)
  72.5-86.0   he dances, all one line (u118)
  86.0        a hit: the line catches - the knot
  86.0-102.0  he dances on with it; it grows (u121)
  103-107     near-silence: still; the line tries to pull the knot out; it snaps back, bigger
  107-119     slower, careful, carrying it (u113 open hand, palm to the glass)
  119-131     the line unravels off him and writes "We only get to teach it once." - the knot lands as the o of once
    python3 video/build_one_line.py   (TEST=s1,s2 TESTDIR=dir in SONG seconds; PART=a,b VOUT=f in film seconds)
"""
import math
import os
import subprocess
import sys

import cv2
import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.ndimage import gaussian_filter, gaussian_filter1d

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bluekey import key  # noqa: E402

F = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 720, 1280, 24
S0, S1 = 64.0, 131.0
DUR = S1 - S0
TEST = [float(x) for x in os.environ.get("TEST", "").split(",") if x]
PART = [float(x) for x in os.environ.get("PART", "").split(",") if x]
OBL = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-BoldOblique.ttf"
SERIF = "/usr/share/fonts/truetype/liberation/LiberationSerif-Italic.ttf"
GREEN = np.array([120, 255, 160], np.float32)
AMBER = np.array([255, 180, 70], np.float32)
NPTS = 1100
T_RISE, T_LIFT, T_KNOT, T_FADE, T_QUIET, T_BACK, T_END = 68.0, 72.5, 86.0, 102.0, 103.0, 107.0, 119.0
rng = np.random.default_rng(1)

# (song from, song to, clip, clip from, clip to)
SHOTS = [(64.0, 72.5, "u114", 0.0, 1.8), (72.5, 86.0, "u118", 1.0, 13.0), (86.0, 103.0, "u121", 2.0, 14.5),
         (103.0, 107.0, "u114", 11.0, 12.8), (107.0, 113.0, "u113", 7.4, 10.9), (113.0, 119.5, "u129", 2.6, 6.2)]
# the camera: (song from, zoom, aim) - aim "body" or "knot"
CAM = [(64.0, 0.9, "body"), (84.8, 0.9, "body"), (86.0, 2.0, "knot"), (88.4, 0.9, "body"), (96.0, 1.5, "knot"),
       (98.5, 0.9, "body"), (103.0, 2.4, "knot"), (107.0, 0.9, "body")]


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def ramp(s, a, b):
    return ease((s - a) / (b - a))


class Song:
    def __init__(self):
        raw = subprocess.run([F, "-loglevel", "error", "-i", "out/songs/before-the-sky-unfolds.mp3", "-ac", "1", "-ar", "22050",
                              "-f", "s16le", "-"], capture_output=True).stdout
        self.a = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
        self.env = gaussian_filter1d(np.abs(self.a), 2205)

    def wave(self, s, n):
        """the song's own waveform at s, n samples along the line, smoothed so it reads as a shiver"""
        i = int(s * 22050)
        seg = self.a[i:i + n * 6]
        if len(seg) < n * 6:
            seg = np.pad(seg, (0, n * 6 - len(seg)))
        seg = gaussian_filter1d(seg.reshape(n, 6).mean(1), 3.5)
        return seg / (np.abs(seg).max() + 1e-6)

    def loud(self, s):
        return float(self.env[min(int(s * 22050), len(self.env) - 1)])


class Him:
    def __init__(self, lo, hi):
        self.fr = {}
        for j, (s0, s1, u, c0, c1) in enumerate(SHOTS):
            if s1 - S0 <= lo - 0.5 or s0 - S0 >= hi:
                continue
            raw = subprocess.run([F, "-loglevel", "error", "-ss", f"{c0:.3f}", "-t", f"{c1 - c0 + 0.1:.3f}", "-i",
                                  f"out/user-clips/{u}.mp4", "-map", "0:v:0", "-vf", f"fps={FPS}", "-f", "rawvideo",
                                  "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
            self.fr[j] = np.frombuffer(raw, np.uint8).reshape(-1, 1280, 720, 3)

    def mask(self, s):
        s = min(max(s, SHOTS[0][0]), SHOTS[-1][1] - 0.01)
        j = max(k for k, sh in enumerate(SHOTS) if sh[0] <= s + 1e-6)
        s0, s1, u, c0, c1 = SHOTS[j]
        ct = (c1 - c0) * (s - s0) / (s1 - s0)
        fr = self.fr[j]
        f = fr[min(int(ct * FPS), len(fr) - 1)].astype(np.float32)
        _, al = key(f)
        return al


def outline(al):
    """his outer contour, NPTS points, evenly spaced, starting at the top of his head, always the same way round"""
    m = (al > 0.5).astype(np.uint8)
    cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    if not cs:
        return None
    c = max(cs, key=cv2.contourArea)[:, 0, :].astype(np.float32)
    if cv2.contourArea(c) < 0:
        c = c[::-1]
    seg = np.r_[0, np.cumsum(np.hypot(*np.diff(np.r_[c, c[:1]], axis=0).T))]
    tt = np.linspace(0, seg[-1], NPTS, endpoint=False)
    p = np.stack([np.interp(tt, seg, np.r_[c[:, 0], c[0, 0]]), np.interp(tt, seg, np.r_[c[:, 1], c[0, 1]])], 1)
    p = np.stack([gaussian_filter1d(p[:, 0], 2.0, mode="wrap"), gaussian_filter1d(p[:, 1], 2.0, mode="wrap")], 1)
    top = int(np.argmin(p[:, 1] + 0.05 * np.abs(p[:, 0] - p[:, 0].mean())))
    p = np.roll(p, -top, 0)
    d1, d2 = p[5] - p[0], p[-5] - p[0]
    if d1[0] * d2[1] - d1[1] * d2[0] < 0:              # keep it going the same way round
        p = np.r_[p[:1], p[1:][::-1]]
    return p


def normals(p):
    t = np.roll(p, -1, 0) - np.roll(p, 1, 0)
    t /= np.linalg.norm(t, axis=1, keepdims=True) + 1e-6
    return t, np.stack([-t[:, 1], t[:, 0]], 1)


def knot_index(p):
    """where on him the knot sits: the outline point nearest the right of his chest"""
    top, bot = p[:, 1].min(), p[:, 1].max()
    cy = top + 0.3 * (bot - top)
    cx = np.median(p[:, 0])
    d = (p[:, 0] - (cx + 80)) ** 2 + (p[:, 1] - cy) ** 2 * 4
    return int(np.argmin(d))


def tie(p, ik, r, m=8):
    """put a loop of radius r into the line at ik: the line goes round itself and carries on"""
    if r <= 0.5:
        return p, None
    t, n = normals(p)
    q = p.copy()
    idx = (ik + np.arange(-m, m + 1)) % len(p)
    ph = np.linspace(0, 2 * np.pi, len(idx))
    w = np.sin(np.linspace(0, np.pi, len(idx))) ** 0.25
    tt, nn = t[ik], n[ik]
    # the line runs on, doubles back over itself and round - a loop that CROSSES the line, so it reads as a knot
    q[idx] = p[idx] + (r * 1.9 * (-np.sin(ph))[:, None] * tt + r * (1 - np.cos(ph))[:, None] * nn) * w[:, None]
    return q, idx


def to_screen(p, k, aim_pt):
    """clip px -> screen: zoom k about aim_pt (clip px), which lands at the screen's middle"""
    return (p - aim_pt) * k + np.array([W / 2, H * 0.5])


def camera(s):
    i = max(j for j, c in enumerate(CAM) if c[0] <= s + 1e-6)
    s0, z, aim = CAM[i]
    s1 = CAM[i + 1][0] if i + 1 < len(CAM) else S1
    return z * (1 + 0.05 * (s - s0) / (s1 - s0)), aim


def text_path():
    """the end card as one pen path: every letter's outline, joined in reading order (the o of once left out)"""
    lines = ["We only get to", "teach it once."]
    fnt = ImageFont.truetype(SERIF, 66)
    pts, o_centre = [], None
    for li, line in enumerate(lines):
        im = Image.new("L", (W, 140), 0)
        d = ImageDraw.Draw(im)
        wdt = d.textlength(line, font=fnt)
        x0 = W / 2 - wdt / 2
        y0 = H * 0.43 + li * 92
        for ci, ch in enumerate(line):
            if ch == " ":
                continue
            g = Image.new("L", (W, 140), 0)
            ImageDraw.Draw(g).text((x0 + d.textlength(line[:ci], font=fnt), 20), ch, font=fnt, fill=255)
            arr = np.asarray(g)
            if li == 1 and line[ci:ci + 4] == "once":
                ys, xs = np.nonzero(arr > 128)
                o_centre = (xs.mean(), ys.mean() - 20 + y0, (xs.max() - xs.min()) / 2)
                continue
            cs, _ = cv2.findContours((arr > 128).astype(np.uint8), cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)
            for c in sorted(cs, key=lambda c: -cv2.contourArea(c)):
                c = c[:, 0, :].astype(np.float32)
                c[:, 1] += y0 - 20
                pts.append(np.r_[c, c[:1]])
    return pts, o_centre


TEXT, O_CENTRE = text_path()


def draw(buf, p, col, thick=2, alpha=1.0):
    pts = np.round(p * 4).astype(np.int32).reshape(-1, 1, 2)
    lay = np.zeros((H, W), np.uint8)
    cv2.polylines(lay, [pts], False, 255, thick, cv2.LINE_AA, shift=2)
    buf += (lay.astype(np.float32) / 255 * alpha)[..., None] * col


def graticule():
    g = np.zeros((H, W, 3), np.float32)
    for x in range(0, W, 72):
        g[:, x] += 7
    for y in range(40, H, 72):
        g[y, :] += 7
    g[H // 2, :] += 6
    g[:, W // 2] += 6
    return g * np.array([0.5, 1.0, 0.7], np.float32)


GRAT = graticule()
YY, XX = np.mgrid[0:H, 0:W].astype(np.float32)
VIG = np.clip(1.25 - (((XX - W / 2) / W) ** 2 + ((YY - H / 2) / H) ** 2) * 2.2, 0, 1)[..., None]


def frame(him, song, s, prev):
    out = np.zeros((H, W, 3), np.float32)
    k, aim = camera(s)
    loud = song.loud(s)
    if s < T_END + 2.0:
        al = him.mask(s)
        p = outline(al)
    else:
        p = None
    knot_r = 0.0
    if s >= T_KNOT:
        knot_r = 20 + 22 * ramp(s, T_KNOT, T_FADE)
        if T_QUIET <= s < T_BACK:                            # it tries to pull it out... and it will not come
            u = (s - T_QUIET) / (T_BACK - T_QUIET)
            knot_r *= 1 - 0.75 * math.sin(math.pi * min(u / 0.8, 1)) if u < 0.8 else 1 + 0.25 * math.exp(-(u - 0.8) * 20)
        if s >= T_BACK:
            knot_r = 44
    aim_pt = np.array([360.0, 640.0])
    line, kidx = None, None
    if p is not None:
        ik = knot_index(p)
        if aim == "knot":
            aim_pt = p[ik] + np.array([-30, 0])
        t, n = normals(p)
        amp = 1.5 + 45 * loud
        if T_QUIET <= s < T_BACK:
            amp = 0.6
        wv = song.wave(s, NPTS)
        q = p + n * (wv * amp / k)[:, None]
        line = to_screen(q, k, aim_pt)
        kidx = None
        if knot_r > 0.5:                                     # the knot: a closed loop the line has thrown round itself,
            tn, nn_ = normals(q)                             # crossing it - drawn in amber, riding at his chest
            rr = knot_r * k
            c = line[ik] + nn_[ik] * rr * 0.55
            ang = np.linspace(0, 2 * np.pi, 90)
            tw = 0.18 * np.sin(2 * ang)                      # a slight twist, so it reads as tied, not a ring
            kidx = np.stack([c[0] + rr * np.cos(ang) + rr * tw * tn[ik][0], c[1] + rr * 1.15 * np.sin(ang) + rr * tw * tn[ik][1]], 1)
    # ---- the opening: a dot draws a flat trace, which rises into him
    if s < T_RISE + 2.5:
        u = (s - S0) / (T_RISE - S0)
        xs = np.linspace(-20, W + 20, NPTS)
        wv = song.wave(s, NPTS) * 10
        flat = np.stack([xs, H * 0.55 + wv], 1)
        if s < T_RISE:
            n_on = int(NPTS * min(1, u * 1.3))
            if n_on > 2:
                draw(out, flat[:n_on], GREEN, 2)
                hx, hy = flat[n_on - 1]
                cv2.circle(out, (int(hx), int(hy)), 6, (230, 255, 235), -1, cv2.LINE_AA)
        elif line is not None:
            v = ease((s - T_RISE) / 2.5)
            # the pen leaves the flat trace and draws him, from the top of his head, round
            draw(out, flat, GREEN, 2, 1 - v)
            n_on = int(NPTS * v)
            if n_on > 2:
                draw(out, line[:n_on], GREEN, 2)
                hx, hy = line[n_on - 1]
                cv2.circle(out, (int(hx), int(hy)), 6, (230, 255, 235), -1, cv2.LINE_AA)
            line = None
    if line is not None and s < T_END:
        draw(out, np.r_[line, line[:1]], GREEN, 2)
        if kidx is not None:
            kl = kidx
            draw(out, kl, AMBER, 3)
            kc = kl.mean(0)
            flash = math.exp(-max(0.0, s - T_KNOT) * 3) if s >= T_KNOT else 0
            if T_BACK - 0.25 <= s < T_BACK + 0.4:
                flash = max(flash, math.exp(-abs(s - (T_BACK - 0.1)) * 8))
            if flash > 0.02:                                 # the snag: a ring of light goes out from it
                cv2.circle(out, (int(kc[0]), int(kc[1])), int(30 + 260 * (1 - flash)), (255 * flash, 170 * flash, 60 * flash),
                           3, cv2.LINE_AA)
    # ---- the ending: the line comes off him and writes the card; the knot flies to the o of once
    if s >= T_END and O_CENTRE is not None:
        u = (s - T_END) / 2.0
        ox, oy, orad = O_CENTRE
        if line is not None and u < 1:
            n_keep = int(NPTS * (1 - ease(u)))               # it unravels from the top of his head
            if n_keep > 3:
                draw(out, line[NPTS - n_keep:], GREEN, 2, 1 - 0.3 * u)
        # the knot, travelling to its place
        kc0 = np.array([W / 2 + 60, H * 0.38])
        v = ease((s - T_END - 0.3) / 2.2)
        kc = kc0 * (1 - v) + np.array([ox, oy]) * v
        rr = 40 * (1 - v) + orad * 0.95 * v
        ang = np.linspace(0, 2 * np.pi, 80)
        ring = np.stack([kc[0] + rr * np.cos(ang), kc[1] + rr * 1.08 * np.sin(ang)], 1)
        draw(out, ring, AMBER, 3)
        # the pen writes, letter after letter
        total = sum(len(c) for c in TEXT)
        wv = ease((s - T_END - 1.6) / 6.0) * total
        done = 0
        head = None
        for c in TEXT:
            if done >= wv:
                break
            n_on = int(min(len(c), wv - done))
            if n_on > 1:
                draw(out, c[:n_on], GREEN, 2)
                head = c[n_on - 1]
            done += len(c)
        if head is not None and wv < total:
            cv2.circle(out, (int(head[0]), int(head[1])), 5, (230, 255, 235), -1, cv2.LINE_AA)
    # phosphor: the last frames linger
    if prev is not None:
        out = np.maximum(out, prev * 0.62)
    glow = gaussian_filter(out, (5, 5, 0)) * 1.4 + gaussian_filter(out, (18, 18, 0)) * 0.6
    img = (out + glow + GRAT) * VIG
    img[::3] *= 0.92
    img += rng.normal(0, 2.0, (H, W, 1))
    if s > S1 - 0.8:
        img *= 1 - ramp(s, S1 - 0.8, S1)
    return np.clip(img, 0, 255).astype(np.uint8), out


def main():
    lo, hi = (PART[0], PART[1]) if PART else (0.0, DUR)
    if TEST:
        lo, hi = 0.0, DUR
    him, song = Him(lo, hi), Song()
    out = None
    if not TEST:
        out = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                                str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "17", "-preset", "slow", "-pix_fmt", "yuv420p",
                                os.environ.get("VOUT", "out/drawn/one-line.mp4")], stdin=subprocess.PIPE)
    prev = None
    for fr in range(int(round(DUR * FPS))):
        t = fr / FPS
        s = S0 + t
        if TEST and not any(abs(s - q) < 0.5 / FPS for q in TEST):
            continue
        warm = PART and (PART[0] - 0.3 <= t < PART[0])        # warm the phosphor up before a part starts
        if PART and not (PART[0] <= t < PART[1]) and not warm:
            continue
        img, prev = frame(him, song, s, prev)
        if warm:
            continue
        if TEST:
            Image.fromarray(img).save(f"{os.environ['TESTDIR']}/l{s:06.2f}.png")
            print("test", round(s, 2), flush=True)
            prev = None
            continue
        out.stdin.write(img.tobytes())
        if fr % 96 == 0:
            print(f"{s:6.1f}", flush=True)
    if out:
        out.stdin.close()
        out.wait()


if __name__ == "__main__":
    main()
