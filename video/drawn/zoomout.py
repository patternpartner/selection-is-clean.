"""One continuous zoom out through nested worlds: each scene sits inside a 'portal' (a screen, window, eye, frame)
of the next, and the camera never cuts. Local and free.

    python3 video/drawn/zoomout.py video/stories/the-cage-zoom.json out/drawn/cage-zoom.mp4

Plan: {"levels": [{"src": clip or still, "portal": [x0, y0, x1, y1] (fractions of the 9:16 frame of THIS scene,
where the previous level sits), "shape": "rect"|"ellipse", "at": seconds when this scene fills the screen,
"cx": crop centre for a still, "portal_fade": [t0, t1] seconds after it first appears (the inner world dissolves
into the scene's own picture)}], "start_box": [x0, y0, x1, y1] (where the first shot starts, inside level 0), "end": s}
Between two reveal times the camera widens from the portal to the whole frame, even in log-scale (constant
apparent speed), slowing a little at each reveal so every world can be read.
"""
import json
import math
import subprocess
import sys

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

F = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 704, 1280, 24


class Clip:
    """Frames of a video, streamed in order and looped; a still is one frame forever."""

    def __init__(self, path, cx=0.5, still=False):
        self.path, self.still, self.cx = path, still, cx
        self.proc, self.last, self.n = None, None, 0
        if still:
            im = Image.open(path).convert("RGB")
            iw, ih = im.size
            s = max(W / iw, H / ih)
            cw, ch = W / s, H / s
            cw, ch = min(cw, iw), min(ch, ih)
            x0 = max(0.0, min(cx * iw - cw / 2, iw - cw))
            y0 = max(0.0, (ih - ch) / 2)
            self.last = im.resize((W, H), Image.LANCZOS, box=(x0, y0, x0 + cw, y0 + ch))

    def _open(self):
        self.proc = subprocess.Popen([F, "-loglevel", "error", "-i", self.path, "-vf",
                                      f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},fps={FPS}",
                                      "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)

    def frame(self):
        if self.still:
            return self.last
        if self.proc is None:
            self._open()
        raw = self.proc.stdout.read(W * H * 3)
        if len(raw) < W * H * 3:  # loop
            self.proc.wait()
            self._open()
            raw = self.proc.stdout.read(W * H * 3)
        self.last = Image.frombytes("RGB", (W, H), raw)
        self.n += 1
        return self.last


def aspect_box(p):
    """The frame-shaped box (W:H) centred on a portal and just covering it, in pixels of a scene."""
    x0, y0, x1, y1 = p[0] * W, p[1] * H, p[2] * W, p[3] * H
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    w = max(x1 - x0, (y1 - y0) * W / H)
    w = min(w, W)
    h = w * H / W
    cx = min(max(cx, w / 2), W - w / 2)  # slide the box inside the frame; the portal stays within it
    cy = min(max(cy, h / 2), H - h / 2)
    return cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2


def portal_mask(p, shape, box, size, feather=3):
    """The portal's shape, drawn in the coordinates of `box` scaled to `size`."""
    bw, bh = box[2] - box[0], box[3] - box[1]
    sx, sy = size[0] / bw, size[1] / bh
    x0, y0 = (p[0] * W - box[0]) * sx, (p[1] * H - box[1]) * sy
    x1, y1 = (p[2] * W - box[0]) * sx, (p[3] * H - box[1]) * sy
    m = Image.new("L", size, 0)
    d = ImageDraw.Draw(m)
    (d.ellipse if shape == "ellipse" else d.rectangle)([x0, y0, x1, y1], fill=255)
    return m.filter(ImageFilter.GaussianBlur(feather)) if feather else m


def ease(u):
    s = u * u * (3 - 2 * u)
    return 0.72 * u + 0.28 * s


RIM = (255, 206, 60)


def rim(img, box_xy, size, p, shape, b0, strength=1.0):
    """A glowing yellow rim round a portal: it reads as a doorway, not a pasted picture."""
    x, y = box_xy
    bw, bh = size
    sx, sy = bw / (b0[2] - b0[0]), bh / (b0[3] - b0[1])
    r = [x + (p[0] * W - b0[0]) * sx, y + (p[1] * H - b0[1]) * sy, x + (p[2] * W - b0[0]) * sx, y + (p[3] * H - b0[1]) * sy]
    lw = max(1, int((r[2] - r[0]) / 70))
    pad = lw * 6
    x0, y0 = int(max(r[0] - pad, 0)), int(max(r[1] - pad, 0))
    x1, y1 = int(min(r[2] + pad, W)), int(min(r[3] + pad, H))
    if x1 - x0 < 4 or y1 - y0 < 4:
        return
    glow = Image.new("L", (x1 - x0, y1 - y0), 0)
    d = ImageDraw.Draw(glow)
    rr = [r[0] - x0, r[1] - y0, r[2] - x0, r[3] - y0]
    (d.ellipse if shape == "ellipse" else d.rectangle)(rr, outline=255, width=lw)
    halo = glow.filter(ImageFilter.GaussianBlur(lw * 2.5))
    a = np.clip(np.asarray(glow, float) + np.asarray(halo, float) * 1.8, 0, 255) * strength
    region = np.asarray(img.crop((x0, y0, x1, y1)), float)
    k = (a / 255)[..., None]
    region = region * (1 - k) + np.array(RIM, float) * k
    img.paste(Image.fromarray(region.astype(np.uint8)), (x0, y0))


class Jumper:
    """The robot: a cut-out that stands in each world and leaps out of it into the next, bigger one."""

    def __init__(self, path):
        self.img = Image.open(path).convert("RGBA")
        self.trail = []

    def draw(self, view, x, y, h, sx=1.0, sy=1.0, rot=0.0, alpha=1.0, trail=False):
        if h < 3:
            return
        w = h * self.img.width / self.img.height
        im = self.img.resize((max(1, int(w * sx)), max(1, int(h * sy))), Image.BILINEAR)
        if rot:
            im = im.rotate(rot, resample=Image.BILINEAR, expand=True)
        if trail:
            self.trail = (self.trail + [(x, y, im)])[-3:]
            for j, (tx, ty, ti) in enumerate(self.trail[:-1]):
                ghost = ti.copy()
                ghost.putalpha(ghost.getchannel("A").point(lambda v, j=j: int(v * 0.07 * (j + 1))))
                view.paste(ghost, (int(tx - ghost.width / 2), int(ty - ghost.height)), ghost)
        else:
            self.trail = []
        if alpha < 1:
            im.putalpha(im.getchannel("A").point(lambda v: int(v * alpha)))
        view.paste(im, (int(x - im.width / 2), int(y - im.height)), im)


def main(plan_path, out):
    plan = json.load(open(plan_path))
    L = plan["levels"]
    clips = [Clip(l["src"], l.get("cx", 0.5), l["src"].lower().endswith((".jpg", ".png"))) for l in L]
    first_seen = [None] * len(L)
    p = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                          "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", out],
                         stdin=subprocess.PIPE)
    nframes = int(plan["end"] * FPS)
    jumper = Jumper(plan["jumper"]) if plan.get("jumper") else None
    cache = {}

    def scene(k, t):
        """Level k's own picture this frame (each clip advances once per output frame while it is in view)."""
        if k not in cache:
            if first_seen[k] is None:
                first_seen[k] = t
            cache[k] = clips[k].frame().copy()
        return cache[k]

    def composite(k, t, depth):
        """Level k's full picture with its inner worlds set into its portal (at rest)."""
        img = scene(k, t).copy()
        if k == 0 or depth == 0:
            return img
        lv = L[k]
        a = 1.0
        if "portal_fade" in lv and first_seen[k] is not None:
            f0, f1 = lv["portal_fade"]
            lt = t - first_seen[k]
            a = 1 - min(max((lt - f0) / (f1 - f0), 0), 1)
        if a <= 0:
            return img
        box = aspect_box(lv["portal"])
        bw, bh = int(round(box[2] - box[0])), int(round(box[3] - box[1]))
        if bw < 2 or bh < 2:
            return img
        inner = composite(k - 1, t, depth - 1).resize((bw, bh), Image.BILINEAR)
        m = portal_mask(lv["portal"], lv.get("shape", "rect"), box, (bw, bh), feather=max(1, bw // 120))
        if a < 1:
            m = m.point(lambda v: int(v * a))
        img.paste(inner, (int(round(box[0])), int(round(box[1]))), m)
        rim(img, (box[0], box[1]), (bw, bh), lv["portal"], lv.get("shape", "rect"), box, a)
        return img

    for i in range(nframes):
        t = i / FPS
        cache.clear()
        k = next((j for j, l in enumerate(L) if t < l["at"]), len(L) - 1)
        lv = L[k]
        t_prev = L[k - 1]["at"] if k > 0 else 0.0
        u = min(max((t - t_prev) / max(lv["at"] - t_prev, 1e-6), 0), 1) if t < lv["at"] else 1.0
        ue = ease(u)
        # the camera: from the box around the portal (or the opening box) out to the whole frame
        b0 = aspect_box(lv["portal"]) if k > 0 else aspect_box(plan["start_box"])
        f = (b0[2] - b0[0]) / W
        g = (f ** (1 - ue) - f) / (1 - f) if f < 0.999 else 1.0
        box = [b0[j] + ((0, 0, W, H)[j] - b0[j]) * g for j in range(4)]
        base = scene(k, t)
        view = base.resize((W, H), Image.BICUBIC, box=tuple(box))
        if k > 0:
            s = W / (box[2] - box[0])
            px0, py0 = (b0[0] - box[0]) * s, (b0[1] - box[1]) * s
            pw, ph = (b0[2] - b0[0]) * s, (b0[3] - b0[1]) * s
            a = 1.0
            if "portal_fade" in lv and first_seen[k] is not None:
                f0, f1 = lv["portal_fade"]
                a = 1 - min(max(((t - first_seen[k]) - f0) / (f1 - f0), 0), 1)
            if a > 0 and pw >= 2:
                inner = composite(k - 1, t, 3).resize((int(round(pw)), int(round(ph))), Image.BICUBIC)
                m = portal_mask(lv["portal"], lv.get("shape", "rect"), b0, inner.size, feather=max(1, int(pw) // 120))
                # at the very start of each zoom the inner world fills the whole view; its frame shrinks to the
                # portal's own shape as the camera pulls back
                grow = 1 - min(ue / 0.3, 1)
                if grow > 0:
                    m = Image.fromarray(np.maximum(np.asarray(m), int(255 * grow)).astype(np.uint8))
                if a < 1:
                    m = m.point(lambda v: int(v * a))
                view.paste(inner, (int(round(px0)), int(round(py0))), m)
                rim(view, (px0, py0), (pw, ph), lv["portal"], lv.get("shape", "rect"), b0, a * min(ue / 0.3, 1))
        if jumper is not None:
            # where the robot stands: its spot in a scene, mapped into this frame
            spot = lambda j: L[j].get("robot", plan.get("robot", [0.5, 0.92, 0.2]))
            ex, ey, eh = spot(k)
            s_out = W / (box[2] - box[0])
            end = ((ex * W - box[0]) * s_out, (ey * H - box[1]) * s_out, eh * H * s_out)
            if k > 0:
                sx_, sy_, sh = spot(k - 1)
                start = (px0 + sx_ * pw, py0 + sy_ * ph, sh * ph)
            else:
                start = end
            j0, j1 = 0.2, 0.72  # the leap, as a share of this zoom
            if u <= j0 or k == 0:
                q = 0.0
            elif u >= j1:
                q = 1.0
            else:
                q = (u - j0) / (j1 - j0)
            if 0 < q < 1:
                arc = math.sin(math.pi * q) * H * 0.38
                x = start[0] + (end[0] - start[0]) * q
                y = start[1] + (end[1] - start[1]) * q - arc
                hh = math.exp(math.log(max(start[2], 1)) + (math.log(max(end[2], 1)) - math.log(max(start[2], 1))) * q)
                stretch = 1 + 0.18 * math.sin(math.pi * q)
                jumper.draw(view, x, y, hh, 1 / stretch, stretch, rot=-25 * math.sin(2 * math.pi * q), trail=True)
            else:
                x, y, hh = (start if q == 0 else end)
                land = (u - j1) / 0.08 if q == 1 else 99
                squash = 1 - 0.22 * math.sin(math.pi * min(max(land, 0), 1)) if land < 1 else 1.0
                bob = 1 + 0.02 * math.sin(t * 4)
                jumper.draw(view, x, y, hh, 1 / squash, squash * bob)
        p.stdin.write(view.tobytes())
        if i % 240 == 0:
            print(f"{t:6.1f}s level {k}", flush=True)
    p.stdin.close()
    p.wait()
    print("saved", out)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
