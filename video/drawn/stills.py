"""Bring stills (and clips) to life frame by frame, with hand-drawn layers on top. Local, no video model, no cost.

    from stills import animate, tunnel
    animate("out/inputs/framed.jpg", "out/drawn/x.mp4", 4.0, zoom=(1.0, 1.12), ink=[...], cracks=[...])

- animate: a slow camera move over a still (zoom, pan), optional parallax (the subject, cut out with rembg, drifts
  toward the camera faster than the background), plus drawn layers:
    ink mask   a yellow smiley inked onto a face (image coordinates), drawn stroke by stroke over `draw`, and peeled
               off (lifts, tilts, falls away) over `peel`. Boiling lines, redrawn on twos like hand-inked cels.
    cracks     broken glass spreading from a point over a time window, fixed to the screen.
  A video can stand in for the still (`video=`), for cracks over moving footage.
- tunnel: the user's viewfinder-tunnel artwork made endless: white corner brackets stream inward toward a picture.
"""
import math
import os
import subprocess

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

F = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 704, 1280, 24
INK, YELLOW = (22, 18, 16), (242, 194, 48)


def ease(t):
    t = min(max(t, 0.0), 1.0)
    return t * t * (3 - 2 * t)


def writer(out):
    os.makedirs(os.path.dirname(out) or ".", exist_ok=True)
    return subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                             "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "15", "-pix_fmt", "yuv420p", out],
                            stdin=subprocess.PIPE)


def video_frames(path, n):
    """n frames of a clip at W x H, looping if it is short."""
    raw = subprocess.run([F, "-loglevel", "error", "-stream_loop", "-1", "-i", path, "-vf",
                          f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},fps={FPS}", "-frames:v",
                          str(n), "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
    return [Image.frombytes("RGB", (W, H), raw[i * W * H * 3:(i + 1) * W * H * 3]) for i in range(n)]


_cut = {}


def cutout(path, im):
    """The subject as an alpha mask (rembg), cached next to the input."""
    if path in _cut:
        return _cut[path]
    cache = os.path.splitext(path)[0] + ".mask.png"
    if os.path.exists(cache):
        m = Image.open(cache).convert("L")
    else:
        from rembg import remove
        m = remove(im).split()[-1]
        m.save(cache)
    _cut[path] = m.filter(ImageFilter.GaussianBlur(2))
    return _cut[path]


def wob(pts, rng, a=2.0):
    return [(x + rng.normal(0, a), y + rng.normal(0, a)) for x, y in pts]


def arc(cx, cy, r, a0, a1, frac=1.0, n=80, sy=1.0):
    a1 = a0 + (a1 - a0) * frac
    return [(cx + r * math.cos(a), cy + sy * r * math.sin(a)) for a in np.linspace(a0, a1, max(2, int(n * frac) + 2))]


def draw_mask(d, cx, cy, r, t, spec, rng):
    """A crayon smiley, inked on over spec['draw'] and peeled away over spec['peel'] (seconds within the shot)."""
    d0, d1 = spec.get("draw", [-1, -0.5])
    u = ease((t - d0) / max(d1 - d0, 0.01))
    if u <= 0:
        return
    p0, p1 = spec.get("peel", [1e9, 1e9 + 1])
    lift = ease((t - p0) / max(p1 - p0, 0.01))
    ang = lift * 0.6 * spec.get("peel_dir", 1)
    ox, oy = lift * r * 1.2 * spec.get("peel_dir", 1), -lift * r * 3.2

    def tr(pts):
        return [(cx + ox + (x - cx) * math.cos(ang) - (y - cy) * math.sin(ang),
                 cy + oy + (x - cx) * math.sin(ang) + (y - cy) * math.cos(ang)) for x, y in pts]

    lw = max(3, int(r * 0.07))
    sy = spec.get("squash", 1.15)  # faces are taller than wide
    if u > 0.55:
        d.polygon(wob(tr(arc(cx, cy, r * 0.97, 0, 2 * math.pi, sy=sy)), rng, r * 0.012), fill=YELLOW)
    d.line(wob(tr(arc(cx, cy, r, -math.pi / 2, 1.5 * math.pi, min(1, u / 0.5), sy=sy)), rng, r * 0.012),
           fill=INK, width=lw, joint="curve")
    for i, ex in enumerate((-0.35, 0.35)):
        e = ease((u - 0.55 - i * 0.08) / 0.12)
        if e > 0:
            (px, py), = tr([(cx + ex * r, cy - 0.28 * r * sy)])
            rr = r * 0.1 * e
            d.ellipse([px - rr, py - rr * 1.4, px + rr, py + rr * 1.4], fill=INK)
    s = ease((u - 0.75) / 0.25)
    if s > 0:
        d.line(wob(tr(arc(cx, cy + 0.05 * r, r * 0.6, math.radians(20), math.radians(160), s, sy=sy)), rng, r * 0.012),
               fill=INK, width=lw)


def crack_tree(x, y, seed, reach=900):
    """Segments of a broken-glass pattern from an impact point; each carries its distance from the impact."""
    rng = np.random.default_rng(seed)
    segs = []
    for k in range(rng.integers(7, 11)):
        a = rng.uniform(0, 2 * math.pi)
        stack = [(x, y, a, 0.0, reach * rng.uniform(0.5, 1.0))]
        while stack:
            px, py, a, dist, left = stack.pop()
            while left > 0:
                step = rng.uniform(18, 45)
                a += rng.normal(0, 0.25)
                nx, ny = px + step * math.cos(a), py + step * math.sin(a)
                segs.append((px, py, nx, ny, dist))
                dist += step
                left -= step
                px, py = nx, ny
                if rng.random() < 0.07:
                    stack.append((px, py, a + rng.choice([-1, 1]) * rng.uniform(0.4, 1.0), dist, left * 0.5))
    for ring in (0.12, 0.22):  # concentric fractures near the impact
        r = reach * ring
        a0 = rng.uniform(0, 2 * math.pi)
        for j in range(14):
            if rng.random() < 0.7:
                a1, a2 = a0 + j * 2 * math.pi / 14, a0 + (j + 0.8) * 2 * math.pi / 14
                segs.append((x + r * math.cos(a1), y + r * math.sin(a1), x + r * math.cos(a2), y + r * math.sin(a2), r))
    return segs


def draw_cracks(d, segs, reach, t, spec):
    c0, c1 = spec["t"]
    front = reach * ease((t - c0) / max(c1 - c0, 0.01)) * 1.05
    for x0, y0, x1, y1, dist in segs:
        if dist <= front:
            d.line([(x0 + 1, y0 + 1), (x1 + 1, y1 + 1)], fill=(235, 235, 235), width=1)
            d.line([(x0, y0), (x1, y1)], fill=(8, 8, 8), width=3)


def animate(src, out, dur, zoom=(1.0, 1.1), pan=((0.5, 0.5), (0.5, 0.5)), parallax=0.0, ink=(), cracks=(),
            video=None, grade=None):
    n = int(round(dur * FPS))
    frames = video_frames(video, n) if video else None
    if not video:
        im = Image.open(src).convert("RGB")
        iw, ih = im.size
        base = max(W / iw, H / ih)
        mask = cutout(src, im) if parallax else None
    trees = [(crack_tree(c["x"] * W, c["y"] * H, c.get("seed", 1), c.get("reach", 900)), c) for c in cracks]
    p = writer(out)
    for i in range(n):
        t = (i // 2) * 2 / FPS  # drawn layers on twos
        u = i / max(n - 1, 1)
        rng = np.random.default_rng(1000 + i // 2)
        if video:
            fr = frames[i].copy()
            mp = lambda x, y: (x * W, y * H)
            scale = 1.0
        else:
            z = zoom[0] + (zoom[1] - zoom[0]) * ease(u)
            cx = (pan[0][0] + (pan[1][0] - pan[0][0]) * ease(u)) * iw
            cy = (pan[0][1] + (pan[1][1] - pan[0][1]) * ease(u)) * ih
            bw, bh = W / (base * z), H / (base * z)
            bw, bh = min(bw, iw), min(bh, ih)
            x0 = max(0.0, min(cx - bw / 2, iw - bw))
            y0 = max(0.0, min(cy - bh / 2, ih - bh))
            fr = im.resize((W, H), Image.BICUBIC, box=(x0, y0, x0 + bw, y0 + bh))
            if parallax:  # the subject comes forward a little faster than the room
                z2 = z * (1 + parallax * ease(u))
                bw2, bh2 = W / (base * z2), H / (base * z2)
                bw2, bh2 = min(bw2, iw), min(bh2, ih)
                x2 = max(0.0, min(cx - bw2 / 2, iw - bw2))
                y2 = max(0.0, min(cy - bh2 / 2, ih - bh2))
                box = (x2, y2, x2 + bw2, y2 + bh2)
                fr.paste(im.resize((W, H), Image.BICUBIC, box=box), (0, 0), mask.resize((W, H), Image.BILINEAR, box=box))
            scale = W / bw
            mp = lambda x, y, x0=x0, y0=y0, s=scale: ((x - x0) * s, (y - y0) * s)
        d = ImageDraw.Draw(fr)
        for tree, spec in trees:
            draw_cracks(d, tree, spec.get("reach", 900), t, spec)
        for spec in ink:
            fx, fy = mp(spec["x"], spec["y"]) if not video else (spec["x"] * W, spec["y"] * H)
            draw_mask(d, fx, fy, spec["r"] * (scale if not video else W), t, spec, rng)
        p.stdin.write(fr.tobytes())
    p.stdin.close()
    p.wait()
    return out


def tunnel(src, out, dur, direction=1, speed=0.9, pic=0.58, q=0.8, push=(1.0, 1.08)):
    """Endless viewfinder: nested white corner brackets and faint guide lines stream toward (direction 1) or away from
    (-1) a picture held in the middle, which itself pushes in slowly. After the user's own frame-tunnel artwork."""
    im = Image.open(src).convert("RGB")
    n = int(round(dur * FPS))
    p = writer(out)
    for i in range(n):
        t = i / FPS
        fr = Image.new("RGB", (W, H), (6, 6, 8))
        d = ImageDraw.Draw(fr)
        f = (t * speed * direction) % 1.0
        z = push[0] + (push[1] - push[0]) * ease(i / max(n - 1, 1))
        pw, ph = int(W * pic * z), int(H * pic * z)
        # guide lines (thirds) at a few depths
        for k in range(0, 9):
            s = q ** (k + f) if direction > 0 else q ** (k + 1 - f)
            bw, bh = W * s * 0.98, H * s * 0.98
            if bw < pw * 0.98:
                break
            x0, y0 = (W - bw) / 2, (H - bh) / 2
            g = int(40 + 50 * s)
            d.rectangle([x0, y0, x0 + bw, y0 + bh], outline=(g, g, g), width=1)
            for j in (1, 2):
                d.line([(x0 + bw * j / 3, y0), (x0 + bw * j / 3, y0 + bh)], fill=(g // 2, g // 2, g // 2), width=1)
                d.line([(x0, y0 + bh * j / 3), (x0 + bw, y0 + bh * j / 3)], fill=(g // 2, g // 2, g // 2), width=1)
        iw, ih = im.size
        s0 = max(pw / iw, ph / ih)
        cw, ch = pw / s0, ph / s0
        fr.paste(im.resize((pw, ph), Image.BICUBIC, box=(max(0.0, (iw - cw) / 2), max(0.0, (ih - ch) / 2), min(iw, (iw + cw) / 2), min(ih, (ih + ch) / 2))),
                 ((W - pw) // 2, (H - ph) // 2))
        for k in range(0, 10):
            s = q ** (k + f) if direction > 0 else q ** (k + 1 - f)
            bw, bh = W * s * 0.94, H * s * 0.94
            if bw < pw * 0.99:
                break
            x0, y0 = (W - bw) / 2, (H - bh) / 2
            L, th = max(10, int(70 * s)), max(3, int(16 * s))
            c = int(120 + 135 * min(1, s * 1.3))
            col = (c, c, c)
            for (ax, ay, sx, sy) in ((x0, y0, 1, 1), (x0 + bw, y0, -1, 1), (x0, y0 + bh, 1, -1), (x0 + bw, y0 + bh, -1, -1)):
                d.rectangle(sorted([ax, ax + sx * L])[:1] + sorted([ay, ay + sy * th])[:1] +
                            sorted([ax, ax + sx * L])[1:] + sorted([ay, ay + sy * th])[1:], fill=col)
                d.rectangle(sorted([ax, ax + sx * th])[:1] + sorted([ay, ay + sy * L])[:1] +
                            sorted([ax, ax + sx * th])[1:] + sorted([ay, ay + sy * L])[1:], fill=col)
        p.stdin.write(fr.tobytes())
    p.stdin.close()
    p.wait()
    return out
