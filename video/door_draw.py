"""Drawing kit for 'Hold the Door': a plaza seen from straight above, people made of shoulders, a head, a hat, two hands and two feet.
Everything is drawn at 2x and reduced. Callers pass ImageDraw.Draw(rgb_image, "RGBA") on an RGB canvas so alpha fills BLEND (on an RGBA canvas they replace). Nothing here knows about time; build_door.py animates it.
Facing: theta = 0 faces UP the frame (-y); forward f = (sin t, -cos t), right r = (cos t, sin t)."""
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 720, 1280
INK = (30, 28, 36)
PAL = dict(
    paving=(222, 214, 199), seam=(205, 197, 181), paving2=(214, 206, 190),
    wall=(43, 43, 52), wall_hi=(70, 70, 82), floor=(190, 142, 94), floor2=(176, 130, 84),
    leaf=(92, 111, 134), leaf_hi=(130, 150, 172), glass=(150, 200, 215), frame=(60, 66, 78),
    mat=(38, 36, 44), grass=(98, 140, 88), grass2=(80, 122, 74), pot=(176, 110, 84),
)
PEOPLE = {
    'holder': dict(coat=(44, 62, 102), coat2=(32, 46, 80), hat=(224, 168, 46), hat2=(190, 138, 30), brim=True, skin=(236, 190, 156), shoe=(36, 36, 44), pants=(58, 58, 70)),
    'walker': dict(coat=(200, 69, 47), coat2=(160, 52, 36), hat=(241, 230, 200), hat2=(214, 200, 166), brim=False, pom=True, skin=(222, 172, 138), shoe=(48, 32, 28), pants=(70, 60, 56)),
    'kid': dict(coat=(238, 196, 52), coat2=(206, 160, 30), hat=(244, 214, 84), hat2=(214, 180, 50), brim=False, skin=(240, 200, 168), shoe=(210, 60, 60), pants=(50, 60, 100)),
    'second': dict(coat=(70, 130, 96), coat2=(52, 100, 74), hat=(60, 56, 70), hat2=(44, 40, 52), brim=False, skin=(190, 140, 108), shoe=(30, 30, 36), pants=(54, 54, 66)),
}


def sh(k):   # drop-shadow offset for a world->screen scale k (sun from the upper left)
    return 11 * k, 15 * k


def poly_ellipse(d, cx, cy, rx, ry, rot, fill, outline=None, n=28, width=1):
    pts = []
    for i in range(n):
        a = 2 * math.pi * i / n
        x, y = rx * math.cos(a), ry * math.sin(a)
        pts.append((cx + x * math.cos(rot) - y * math.sin(rot), cy + x * math.sin(rot) + y * math.cos(rot)))
    d.polygon(pts, fill=fill, outline=outline)


def to_world(x, y, th, lx, lf):
    """body-local (lx = to the right, lf = forward) to world"""
    fx, fy = math.sin(th), -math.cos(th)
    rx, ry = math.cos(th), math.sin(th)
    return x + rx * lx + fx * lf, y + ry * lx + fy * lf


def person(d, kind, x, y, th, k, phase=0.0, stride=0.0, swing=0.0, bob=0.0, head_yaw=0.0, lean=0.0,
           armL=None, armR=None, propL=None, propR=None, slump=0.0, alpha=255, pal=None, sun=None):
    """x, y: screen position of the body centre. k: pixels per world unit (already includes the 2x). armL/armR: None for the natural swing,
    or a body-local hand target (lx, lf) in world units. propL/propR: 'coffee' | 'phone' | 'watch' | None."""
    P = pal if pal is not None else PEOPLE[kind]
    f = (math.sin(th), -math.cos(th)); r = (math.cos(th), math.sin(th))
    def T(lx, lf):
        wx, wy = to_world(0, 0, th, lx, lf); return (x + wx * k, y + wy * k)
    sx, sy = sh(k)
    # shadow: a fixed offset by default; with `sun` = (dx, dy, length) it is cast along the sun's direction and stretches when the sun is low
    if sun is None: poly_ellipse(d, x + sx, y + sy, 33 * k, 21 * k, th, (0, 0, 0, 52))
    else:
        dx_, dy_, ln_ = sun; a_ = math.atan2(dy_, dx_)
        poly_ellipse(d, x + dx_ * k * 0.55, y + dy_ * k * 0.55, (24 + ln_ * 0.55) * k, 19 * k, a_, (0, 0, 0, 58))
    # feet (stride along forward, opposite feet opposite phase)
    s = math.sin(phase) * stride
    for side, off in ((-1, s), (1, -s)):
        c = T(side * 9, off - 2)
        poly_ellipse(d, c[0], c[1], 7.5 * k, 13 * k, th, P['shoe'] + (255,), INK)
    # arms: natural swing is opposite to the same-side foot
    def arm(side, target, prop):
        sh_pt = T(side * 27, 2)
        if target is None:
            hand = T(side * 32, swing * math.sin(phase + (0 if side > 0 else math.pi)) + 1)
        else:
            hand = T(*target)
        el = ((sh_pt[0] + hand[0]) / 2 + r[0] * side * 5 * k, (sh_pt[1] + hand[1]) / 2 + r[1] * side * 5 * k)
        d.line([sh_pt, el, hand], fill=P['coat2'] + (255,), width=int(12 * k), joint='curve')
        for c in (sh_pt, el): d.ellipse([c[0] - 6 * k, c[1] - 6 * k, c[0] + 6 * k, c[1] + 6 * k], fill=P['coat2'] + (255,))
        return hand
    hL = arm(-1, armL, propL)
    hR = arm(1, armR, propR)
    # torso: two shoulders blended into a rounded body
    ts = 1 + bob + (-0.05 * slump)
    poly_ellipse(d, *T(0, lean), 31 * k * ts, 19 * k * ts, th, P['coat'] + (255,), INK, width=2)
    poly_ellipse(d, *T(0, lean - 2), 24 * k * ts, 11 * k * ts, th, P['coat2'] + (130,))
    # backpack/scarf-free: a collar line
    # head: ear dots, nose, then hat
    hh = th + head_yaw
    hc = T(0, 3 + lean)
    for sd in (-1, 1):
        ex, ey = hc[0] + math.cos(hh) * 15 * sd * k, hc[1] + math.sin(hh) * 15 * sd * k
        d.ellipse([ex - 4 * k, ey - 4 * k, ex + 4 * k, ey + 4 * k], fill=P['skin'] + (255,))
    nx, ny = hc[0] + math.sin(hh) * 15 * k, hc[1] - math.cos(hh) * 15 * k
    d.ellipse([nx - 3.5 * k, ny - 3.5 * k, nx + 3.5 * k, ny + 3.5 * k], fill=P['skin'] + (255,))
    hr = 16.0 if P.get('bare') else 17.5
    poly_ellipse(d, hc[0], hc[1], hr * k, hr * k, hh, P['hat'] + (255,), INK)
    poly_ellipse(d, hc[0] - math.sin(hh) * 3 * k, hc[1] + math.cos(hh) * 3 * k, (9.5 if P.get('bare') else 12) * k, (9.5 if P.get('bare') else 12) * k, hh, P['hat2'] + (255,))
    if P.get('brim'):
        b0 = (hc[0] + math.sin(hh) * 10 * k, hc[1] - math.cos(hh) * 10 * k)
        b1 = (hc[0] + math.sin(hh) * 26 * k, hc[1] - math.cos(hh) * 26 * k)
        d.line([b0, b1], fill=P['hat2'] + (255,), width=int(17 * k))
        d.line([b0, b1], fill=INK + (255,), width=max(1, int(1 * k)))
    if P.get('pom'):
        d.ellipse([hc[0] - 6 * k, hc[1] - 6 * k, hc[0] + 6 * k, hc[1] + 6 * k], fill=(250, 244, 226, 255), outline=INK)
    # props in hands
    for hand, prop in ((hL, propL), (hR, propR)):
        if prop == 'coffee':
            d.ellipse([hand[0] - 8 * k, hand[1] - 8 * k, hand[0] + 8 * k, hand[1] + 8 * k], fill=(250, 250, 248, 255), outline=INK)
            d.ellipse([hand[0] - 5 * k, hand[1] - 5 * k, hand[0] + 5 * k, hand[1] + 5 * k], fill=(120, 76, 54, 255))
        elif prop == 'phone':
            c = hand; a = th
            pts = []
            for lx, lf in ((-5, -8), (5, -8), (5, 8), (-5, 8)):
                wx, wy = to_world(0, 0, a, lx, lf); pts.append((c[0] + wx * k, c[1] + wy * k))
            d.polygon(pts, fill=(30, 34, 46, 255), outline=(190, 220, 255, 255))
        elif prop == 'icecream':
            cx_, cy_ = hand
            d.polygon([(cx_ - 4 * k, cy_), (cx_ + 4 * k, cy_), (cx_, cy_ + 13 * k)], fill=(214, 168, 100, 255), outline=INK)
            d.ellipse([cx_ - 7 * k, cy_ - 8 * k, cx_ + 7 * k, cy_ + 5 * k], fill=(244, 150, 190, 255), outline=INK)
        elif prop == 'bag':
            d.rounded_rectangle([hand[0] - 7 * k, hand[1] - 9 * k, hand[0] + 7 * k, hand[1] + 9 * k], radius=2 * k, fill=(236, 214, 150, 255), outline=INK)
        elif prop == 'watch':
            d.ellipse([hand[0] - 3 * k, hand[1] - 3 * k, hand[0] + 3 * k, hand[1] + 3 * k], fill=(230, 230, 236, 255))
        d.ellipse([hand[0] - 5 * k, hand[1] - 5 * k, hand[0] + 5 * k, hand[1] + 5 * k], fill=P['skin'] + (255,), outline=INK) if prop in (None, 'watch', 'icecream', 'bag') else None
    return hL, hR


def pigeon(d, x, y, th, k, flap=0.0, fly=0.0):
    sx, sy = 7 * k, 10 * k
    poly_ellipse(d, x + sx * (1 + fly), y + sy * (1 + fly), 11 * k, 7 * k, th, (0, 0, 0, 40 if not fly else 22))
    if fly > 0:
        for sd in (-1, 1):
            a = th + sd * (0.9 + 0.7 * math.sin(flap))
            wx, wy = x + math.cos(a) * 16 * k * sd * 0.5, y + math.sin(a) * 16 * k * sd * 0.5
            poly_ellipse(d, wx, wy, 14 * k, 6 * k, a, (180, 184, 196, 255), INK)
    poly_ellipse(d, x, y, 7 * k, 12 * k, th, (146, 152, 168, 255), INK)
    poly_ellipse(d, x + math.sin(th) * 5 * k, y - math.cos(th) * 5 * k, 5 * k, 6 * k, th, (110, 118, 140, 255))
    hx, hy = x + math.sin(th) * 13 * k, y - math.cos(th) * 13 * k
    d.ellipse([hx - 4.5 * k, hy - 4.5 * k, hx + 4.5 * k, hy + 4.5 * k], fill=(120, 126, 148, 255), outline=INK)
    bx, by = x + math.sin(th) * 18 * k, y - math.cos(th) * 18 * k
    d.ellipse([bx - 1.6 * k, by - 1.6 * k, bx + 1.6 * k, by + 1.6 * k], fill=(240, 180, 60, 255))
