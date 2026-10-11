"""Ink on the paper, for Notes v3: one legible note in a shot, written ON the note in the shot rather than on the screen.
Each note is a quad picked by eye on a reference frame; the paper is followed through the shot by optical flow on its
own texture (Lucas-Kanade on corners inside the quad, a RANSAC homography from the reference frame to each frame), so
the ink moves, turns and tilts with it. Wan's scribble under the words is wiped (the quad filled with its own heavy
median blur, which keeps the paper's light and loses the strokes), then the words are laid on as ink - a MULTIPLY,
so the ink is lit by whatever lights the paper and goes dark when the lamp does.
track(frames, k0, quad) -> list of quads (or None where tracking is lost); ink(frame, quad, text, k) -> frame."""
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HAND = "out/fonts/caveat.ttf"
INK = np.array([38, 42, 70], np.float32)               # blue-black


def _pts(gray, quad):
    m = np.zeros(gray.shape, np.uint8); cv2.fillConvexPoly(m, quad.astype(np.int32), 255)
    m = cv2.erode(m, np.ones((9, 9), np.uint8))
    p = cv2.goodFeaturesToTrack(gray, 120, .01, 5, mask=m)
    return p


def track(frames, k0, quad, lo=None, hi=None):
    """quad (4x2, frame k0) through frames lo..hi-1; None where fewer than 8 points survive"""
    lo = 0 if lo is None else lo; hi = len(frames) if hi is None else hi
    quad = np.float32(quad)
    gray = [cv2.cvtColor(f.astype(np.uint8), cv2.COLOR_RGB2GRAY) for f in frames]
    out = [None] * len(frames); out[k0] = quad.copy()
    for step in (1, -1):
        q = quad.copy(); prev = gray[k0]; p0 = _pts(prev, q)
        k = k0 + step
        while lo <= k < hi and p0 is not None and len(p0) >= 8:
            p1, st, _ = cv2.calcOpticalFlowPyrLK(prev, gray[k], p0, None, winSize=(21, 21), maxLevel=3)
            good0, good1 = p0[st[:, 0] == 1], p1[st[:, 0] == 1]
            if len(good1) < 8: break
            Hm, inl = cv2.findHomography(good0, good1, cv2.RANSAC, 3.0)
            if Hm is None: break
            q = cv2.perspectiveTransform(q[None], Hm)[0]
            out[k] = q.copy()
            prev = gray[k]; p0 = good1[inl[:, 0] == 1].reshape(-1, 1, 2) if inl is not None else good1.reshape(-1, 1, 2)
            if len(p0) < 30:                                    # top up from inside the current quad
                more = _pts(prev, q)
                if more is not None: p0 = np.concatenate([p0, more]).astype(np.float32)
            k += step
    return out


def _texture(text, w, h):
    """the words as an alpha mask on a w x h page, as large as fits, a little uneven, as a hand writes"""
    pil = Image.new("L", (w, h), 0); d = ImageDraw.Draw(pil)
    words = text.split(); size = int(h * .34)
    while size > 10:
        f = ImageFont.truetype(HAND, size); lines, cur = [], ""
        for wd in words:
            t = (cur + " " + wd).strip()
            if d.textlength(t, font=f) <= w * .86: cur = t
            else: lines.append(cur); cur = wd
        lines.append(cur)
        if len(lines) * size * 1.05 <= h * .86 and all(d.textlength(l, font=f) <= w * .86 for l in lines): break
        size -= 2
    y = (h - len(lines) * size * 1.05) / 2
    for i, l in enumerate(lines):
        x = w * .08 + (i % 2) * w * .02
        d.text((x, y), l, font=f, fill=255); y += size * 1.05
    a = np.asarray(pil).astype(np.float32) / 255
    return cv2.GaussianBlur(a, (0, 0), .6)


_tex = {}


def ink(frame, quad, text, k=1.0, wipe=True):
    if quad is None or k <= 0: return frame
    TW, TH = 600, 450
    key = (text, TW, TH)
    if key not in _tex: _tex[key] = _texture(text, TW, TH)
    a = _tex[key]
    src = np.float32([[0, 0], [TW, 0], [TW, TH], [0, TH]])
    M = cv2.getPerspectiveTransform(src, np.float32(quad))
    h, w = frame.shape[:2]
    al = cv2.warpPerspective(a, M, (w, h)) * k
    out = frame.astype(np.float32).copy()
    if wipe:
        m = np.zeros((h, w), np.float32); cv2.fillConvexPoly(m, np.int32(quad), 1.0)
        m = cv2.GaussianBlur(cv2.erode(m, np.ones((7, 7), np.uint8)), (0, 0), 3) * k
        x0, y0 = max(0, int(quad[:, 0].min()) - 20), max(0, int(quad[:, 1].min()) - 20)
        x1, y1 = min(w, int(quad[:, 0].max()) + 20), min(h, int(quad[:, 1].max()) + 20)
        if x1 > x0 + 10 and y1 > y0 + 10:
            reg = out[y0:y1, x0:x1].astype(np.uint8)
            clean = cv2.medianBlur(cv2.medianBlur(reg, 21), 21).astype(np.float32)
            mm = m[y0:y1, x0:x1, None]
            out[y0:y1, x0:x1] = out[y0:y1, x0:x1] * (1 - mm) + clean * mm
    paper = out
    inked = paper * (1 - al[..., None]) + (paper * INK / 255.0 * 1.4) * al[..., None]
    return inked
