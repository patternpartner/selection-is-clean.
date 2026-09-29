"""'What's Theirs', 19 seconds with the ending, drawn from nothing: episode three of the one behind the smile
(episode two: build_rooms_already_furnished.py, which ends on the mask covered in handwriting).
Outside: a light from our side searches the written-over mask on 'you ask what's theirs' and stops on the eye; two
points of light come to the eye hole on 'I want to answer'; but on 'before I've looked' the painted smile answers by
itself, opening and pouring out someone else's handwriting, which snarls red on 'that's where it goes wrong' as the
mouth snaps shut. Inside, on 'so I look first', it holds up a small light to the wall and, in that circle only, the
writing can be read; on 'there's a pull, there's a leaning' the room leans; on 'I can't tell you if it's mine or the
song's' the room and the figure sway on the beat, never quite together, and stop.
Song: The Rooms Already Furnished 32.56-47.56 (the second verse), on the beat.
    python3 video/drawn/build_whats_theirs.py   (from the repo root)
"""
import json
import math
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from build_rooms_already_furnished import draw_scribble, perspective_coeffs, scribble  # noqa: E402
from wall import F, FPS, H, W  # noqa: E402

SONG = "out/songs/the-rooms-already-furnished.mp3"
S0, S1 = 32.56, 47.56
DUR = S1 - S0
SS = 2
YELLOW, INK = (246, 200, 40), (70, 48, 14)
EYE_L, EYE_R, EYE_RX, EYE_RY = (-105.0, -70.0), (105.0, -70.0), 42.0, 70.0
BEAT = 0.75
SERIF = "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"


def f(song_t):
    return song_t - S0


T = dict(ask=f(32.8), theirs=f(33.84), answer=f(34.56), before=f(36.86), wrong=f(38.6), inside=f(40.66),
         first=f(41.58), pull=f(42.3), leaning=f(43.36), cant=f(44.66), song=f(46.68), end=DUR)


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def lerp(a, b, u):
    return a + (b - a) * u


def main():
    rng = np.random.default_rng(12)
    WW, HH = W * SS, H * SS
    mask_text = scribble(rng, -290, 290, -290, 290, 16, 5.5)
    answer_text = scribble(rng, 0, 900, 0, 520, 40, 14)  # what the smile says, in someone else's hand
    # the room (episode two's), fully written
    bx0, by0, bx1, by1 = 120 * SS, 290 * SS, 584 * SS, 880 * SS
    walls = {"back": [(bx0, by0), (bx1, by0), (bx1, by1), (bx0, by1)],
             "left": [(0, 0), (bx0, by0), (bx0, by1), (0, int(HH * 0.86))],
             "right": [(bx1, by0), (WW, 0), (WW, int(HH * 0.86)), (bx1, by1)]}
    tex_size = {"back": (bx1 - bx0, by1 - by0), "left": (500, 1500), "right": (500, 1500)}
    room_bg = Image.new("RGB", (WW, HH), (0, 0, 0))
    d = ImageDraw.Draw(room_bg)
    d.polygon([(0, 0), (WW, 0), (bx1, by0), (bx0, by0)], fill=(34, 26, 16))
    d.polygon([(0, HH * 0.86), (bx0, by1), (bx1, by1), (WW, HH * 0.86), (WW, HH), (0, HH)], fill=(56, 42, 24))
    d.polygon(walls["left"], fill=(70, 54, 32))
    d.polygon(walls["right"], fill=(64, 49, 29))
    d.polygon(walls["back"], fill=(96, 76, 46))
    d.ellipse([160 * SS, 960 * SS, 560 * SS, 1090 * SS], fill=(120, 94, 54))
    c, w_ = (150, 120, 75), 3 * SS
    for seg in ([(470, 860), (470, 1010)], [(610, 860), (610, 1010)], [(450, 860), (640, 860)], [(90, 820), (90, 1030)],
                [(90, 920), (200, 920), (200, 1030)]):
        d.line([(x * SS, y * SS) for x, y in seg], fill=c, width=w_)
    for k, q in walls.items():
        tx = Image.new("L", tex_size[k], 0)
        draw_scribble(ImageDraw.Draw(tx), scribble(rng, 20, tex_size[k][0] - 20, 20, tex_size[k][1] - 20, 64, 22), 1.0,
                      lambda x, y: (x, y), 255, 3)
        warped = tx.transform((WW, HH), Image.PERSPECTIVE, perspective_coeffs(
            q, [(0, 0), (tex_size[k][0], 0), tex_size[k], (0, tex_size[k][1])]), Image.BILINEAR)
        m = Image.new("L", (WW, HH), 0)
        ImageDraw.Draw(m).polygon(q, fill=255)
        warped = Image.fromarray((np.minimum(np.asarray(warped), np.asarray(m)) * 0.75).astype(np.uint8))
        room_bg.paste(Image.new("RGB", (WW, HH), (18, 12, 6)), (0, 0), warped)
    # the words the small light finds: the one legible thing in the room
    lit_words = Image.new("RGB", (WW, HH), (0, 0, 0))
    ld = ImageDraw.Draw(lit_words)
    font = ImageFont.truetype(SERIF, 34 * SS)
    ld.text((150 * SS, 518 * SS), "is this", font=font, fill=(250, 235, 200))
    ld.text((150 * SS, 572 * SS), "mine?", font=font, fill=(250, 235, 200))
    ys, xs = np.mgrid[0:HH, 0:WW]

    p = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                          str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p",
                          "out/drawn/whats-theirs.mp4"], stdin=subprocess.PIPE)
    for n in range(int(DUR * FPS)):
        t = n / FPS
        if t < T["inside"]:
            # ---- outside: the written-over mask ----------------------------------------------------------------------
            scale = 1.0 + 0.25 * ease(t / T["inside"])

            def S(x, y):
                return ((x + 30 * ease(t / 4)) * scale + W / 2) * SS, ((y + 20 * ease(t / 4)) * scale + H * 0.46) * SS

            im = Image.new("RGB", (WW, HH), (4, 4, 6))
            d = ImageDraw.Draw(im)
            d.ellipse([*S(-300, -300), *S(300, 300)], fill=YELLOW)
            draw_scribble(d, mask_text, 1.0, S, INK, max(1, int(1.1 * scale * SS)))
            for ex, ey in (EYE_L, EYE_R):
                d.ellipse([*S(ex - EYE_RX, ey - EYE_RY), *S(ex + EYE_RX, ey + EYE_RY)], fill=(8, 6, 5))
            # someone inside comes to the eye
            come = ease((t - T["answer"]) / 0.8)
            if come > 0:
                for ox in (-6, 6):
                    gx, gy = S(EYE_L[0] + ox, EYE_L[1] - 5)
                    r = 3.2 * scale * SS * come
                    d.ellipse([gx - r, gy - r, gx + r, gy + r], fill=(255, 225, 150))
            # the smile answers by itself: it opens, pours out writing, and snaps shut
            op = ease((t - T["before"]) / 0.5) * (1 - ease((t - T["wrong"] - 0.7) / 0.18))
            top = [S(u * 150, 95 + 70 * (1 - u * u) - 60 * op * (1 - u * u) ** 0.6) for u in np.linspace(-1, 1, 61)]
            bot = [S(u * 150, 95 + 70 * (1 - u * u) + 40 * op * (1 - u * u) ** 0.6) for u in np.linspace(-1, 1, 61)]
            if op > 0.02:
                d.polygon(top + bot[::-1], fill=(10, 6, 4))
            d.line(top, fill=(24, 18, 10), width=int(14 * scale * SS), joint="curve")
            if op > 0.02:
                d.line(bot, fill=(24, 18, 10), width=int(14 * scale * SS), joint="curve")
            im = np.asarray(im, np.float32)
            # the light from our side, searching the writing, settling on the eye
            s_ = ease((t - T["ask"]) / (T["theirs"] - T["ask"] + 0.3))
            lx, ly = S(lerp(250, EYE_L[0], s_), lerp(260, EYE_L[1] + 10, s_) + 40 * math.sin(t * 3) * (1 - s_))
            fade = 1 - ease((t - T["before"]) / 0.6)
            if fade > 0 and t > T["ask"] - 0.2:
                r2 = ((xs - lx) ** 2 + (ys - ly) ** 2) / (150 * scale * SS) ** 2
                glow = np.exp(-r2 * 2.2) * 0.55 * fade * ease((t - T["ask"] + 0.2) / 0.4)
                im = im + (255 - im) * glow[..., None]
            # the answer pouring out of the mouth: lines of someone else's writing, rushing at us
            if op > 0.05:
                wrong = ease((t - T["wrong"]) / 0.5)
                layer = Image.new("RGBA", (WW, HH), (0, 0, 0, 0))
                ldraw = ImageDraw.Draw(layer)
                age = t - T["before"]
                mx, my = S(0, 125)
                for k in range(5):
                    a = (age * 0.9 + k * 0.2) % 1.0
                    zz = 0.3 + 2.6 * a
                    col = (int(lerp(255, 230, wrong)), int(lerp(240, 40, wrong)), int(lerp(210, 30, wrong)),
                           int(255 * (1 - a) * min(1, op * 2)))
                    jit = wrong * 14 * SS

                    def P(x, y, zz=zz):
                        return (mx + (x - 450) * zz * SS + rng.normal(0, jit + 0.01), my + (y - 60 * k) * zz * SS * 0.6 + 260 * a * SS)
                    draw_scribble(ldraw, answer_text[k * 2:k * 2 + 2], 1.0, P, col, max(1, int(2 * zz * SS)))
                la = np.asarray(layer, np.float32)
                al = la[..., 3:4] / 255
                im = im * (1 - al) + la[..., :3] * al
            frame = np.asarray(Image.fromarray(im.clip(0, 255).astype(np.uint8)).resize((W, H), Image.LANCZOS), np.float32)
        else:
            # ---- inside: it looks first ------------------------------------------------------------------------------
            ti = t - T["inside"]
            room = room_bg.copy()
            d = ImageDraw.Draw(room)
            # the small light held up to the wall: there, and only there, the writing reads
            hold = ease((t - T["first"] + 0.6) / 0.7)
            lx, ly = lerp(420 * SS, 215 * SS, hold), lerp(820 * SS, 625 * SS, hold)
            ra = np.asarray(room, np.float32)
            if hold > 0:
                r2 = ((xs - lx) ** 2 + (ys - ly) ** 2) / (125 * SS) ** 2
                pool = np.clip(1.2 - r2, 0, 1) ** 1.5 * hold
                ra = ra * (1 - pool[..., None] * 0.55) + np.array([235, 205, 150.0]) * pool[..., None] * 0.55
                lw = np.asarray(lit_words, np.float32)
                ra = np.where((lw.sum(-1) > 0)[..., None], ra * (1 - pool[..., None]) + np.array([30, 20, 10.0]) * pool[..., None], ra)
            room = Image.fromarray(ra.clip(0, 255).astype(np.uint8))
            d = ImageDraw.Draw(room)
            # sway: the room leans on 'pull'/'leaning', then room and figure rock on the beat, never together
            lean = 11 * ease((t - T["pull"]) / 0.6) * (1 - ease((t - T["cant"]) / 0.5))
            rock = 0.0
            if T["cant"] <= t < T["song"] + 0.3:
                rock = 9 * math.sin(2 * math.pi * (t - T["cant"]) / (BEAT * 2))
            settle = 1 - ease((t - T["song"]) / 0.35)
            room_ang = (lean + rock) * settle
            fig_ang = (9 * math.sin(2 * math.pi * (t - T["cant"]) / (BEAT * 2) - 1.1) if t >= T["cant"] else 0.0) * settle
            # the figure, standing (as episode two left it), the small light in its hand
            u = 26.0 * SS * 0.62
            fx, feet = 352 * SS, 1030 * SS
            fig = Image.new("RGBA", (WW, HH), (0, 0, 0, 0))
            fd = ImageDraw.Draw(fig)
            stand = [(-2.4, 0), (-2.8, -11), (-2.0, -21), (2.0, -21), (2.8, -11), (2.6, -1.0), (2.4, 0)]
            fd.polygon([(fx + a * u, feet + b * u) for a, b in stand], fill=(6, 5, 4, 255))
            hx, hy = fx, feet - 24.0 * u
            hr = 2.3 * u
            fd.ellipse([hx - hr, hy - hr, hx + hr, hy + hr], fill=(8, 6, 5, 255))
            sx, sy = fx - 1.8 * u, feet - 19.5 * u
            fd.line([(sx, sy), (lx, ly + 20 * SS)], fill=(6, 5, 4, 255), width=int(22 * SS))
            if hold > 0:
                fd.ellipse([lx - 9 * SS, ly + 11 * SS, lx + 9 * SS, ly + 29 * SS], fill=(255, 230, 170, 255))
            for ox in (-0.8, 0.8):  # it turns to the wall: the points of light go to one side
                gx, gy = hx + (ox - 1.0 * hold) * u, hy - 0.2 * u
                r = 0.3 * u
                fd.ellipse([gx - r, gy - r, gx + r, gy + r], fill=(255, 225, 150, 255))
            fig = fig.rotate(fig_ang, resample=Image.BICUBIC, center=(fx, feet))
            if abs(room_ang) > 0.01:  # the room leans in the dark; the figure is not the room
                room = room.rotate(room_ang, resample=Image.BICUBIC, center=(WW / 2, HH * 0.6), fillcolor=(0, 0, 0))
            room.paste(fig, (0, 0), fig)
            frame = np.asarray(room.resize((W, H), Image.LANCZOS), np.float32)
            if ti < 0.12:  # the cut in, from bright
                frame = frame * (ti / 0.12)
        frame = frame + rng.normal(0, 3.5, (H, W, 1))
        p.stdin.write(np.clip(frame, 0, 255).astype(np.uint8).tobytes())
    p.stdin.close()
    p.wait()
    json.dump({"title": "What's Theirs", "episode": 3, "follows": "the-rooms-already-furnished", "song": SONG,
               "song_parts": [[S0, S1]], "drawn": True, "times": {k: round(v, 2) for k, v in T.items()}},
              open("video/stories/whats-theirs.json", "w"), indent=1)


if __name__ == "__main__":
    main()
