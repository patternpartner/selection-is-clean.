"""'First Draft of Fate' - the window cut. The first cut (build_first_draft_of_fate.py) was all real footage of one
universe. This one puts the story's figure in front of it and then pulls back to the whole field:
  intro      its room (episode two's written walls), a window on the back wall, and in the window the live universe;
             it sits in the pool of light, watching.
  verse 1    'there's a world in a window that nobody drew': the camera goes in through the window...
  ...        ...and the first cut's real footage takes over (the divisions, the crash, the burst, the counter).
  break      out again, but not into the room: out of one cell of the FIELD (index.html#clean, recorded live) until
             all nine universes fill the frame.
  verse 2    the field: 'you wrote the rules and you let it run', 'a thousand suns', close on cells, the collective.
  chorus 2   the first cut's footage again.
  bridge     back in the room at night, watching; the window freezes on 'first draft', moves on 'of fate'.
  final      field and universe, alternating.
  outro      the room: the window now shows the whole field, and it turns from the window to us.
    python3 video/build_first_draft_window.py RUN_DIR FIELD_DIR
RUN_DIR holds the universe recording (.webm + stats.json) and its segs/ from the first cut; FIELD_DIR the field's .webm.
"""
import glob
import json
import math
import os
import subprocess
import sys

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "drawn"))
sys.path.insert(0, os.path.dirname(__file__))
from build_first_draft_of_fate import CHORUS, SEGS, SONG, SONG_LEN  # noqa: E402

F = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 704, 1280, 24
SW, SH = 352, 640  # the recordings' size
END = 153.4
WIN = (190, 330, 520, 720)  # the window in the room's back wall (1x)


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def lerp(a, b, u):
    return a + (b - a) * u


class Reader:
    """Frames from a recording, from `start`, at `speed`, 24 per second, as uint8 arrays."""

    def __init__(self, path, start, speed):
        vf = f"setpts=(PTS-STARTPTS)/{max(speed, 0.001)},fps={FPS},scale={SW}:{SH}"
        self.p = subprocess.Popen([F, "-loglevel", "error", "-ss", f"{start:.2f}", "-i", path, "-vf", vf, "-f", "rawvideo",
                                   "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
        self.last = np.zeros((SH, SW, 3), np.uint8)
        self.frozen = speed == 0

    def next(self):
        if self.frozen and self.last.any():
            return self.last
        raw = self.p.stdout.read(SW * SH * 3)
        if len(raw) == SW * SH * 3:
            self.last = np.frombuffer(raw, np.uint8).reshape(SH, SW, 3)
        return self.last

    def close(self):
        self.p.kill()
        self.p.wait()


def zoom_view(fr, z, cx, cy):
    """Zoom z (1 = the whole recording) about (cx, cy) in 0..1, out to 704x1280."""
    im = Image.fromarray(fr)
    cw, ch = SW / z, SH / z
    x0 = min(max(cx * SW - cw / 2, 0), SW - cw)
    y0 = min(max(cy * SH - ch / 2, 0), SH - ch)
    return np.asarray(im.resize((W, H), Image.LANCZOS, box=(x0, y0, x0 + cw, y0 + ch)), np.float32)


def room_frame(room_bg, window_img, t, sit=1.0, look_up=1.0, face_us=0.0, night=0.0):
    """Its room, the window on the back wall showing `window_img`, and it sitting in the light, watching."""
    im = room_bg.copy()
    d = ImageDraw.Draw(im)
    x0, y0, x1, y1 = WIN
    w, h = x1 - x0, y1 - y0
    win = Image.fromarray(window_img.astype(np.uint8))
    s = max(w / win.width, h / win.height)
    win = win.resize((int(win.width * s), int(win.height * s)), Image.LANCZOS)
    win = win.crop(((win.width - w) // 2, (win.height - h) // 2, (win.width - w) // 2 + w, (win.height - h) // 2 + h))
    # the window's light on the room
    glow = Image.new("RGB", im.size, (0, 0, 0))
    glow.paste(win.resize((w, h)), (x0, y0))
    glow = glow.filter(ImageFilter.GaussianBlur(60))
    a = np.asarray(im, np.float32) * (1 - 0.45 * night) + np.asarray(glow, np.float32) * 0.8
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(im)
    im.paste(win, (x0, y0))
    d.rectangle([x0 - 8, y0 - 8, x1 + 8, y1 + 8], outline=(40, 30, 18), width=10)
    d.line([((x0 + x1) // 2, y0), ((x0 + x1) // 2, y1)], fill=(40, 30, 18), width=6)
    d.line([(x0, (y0 + y1) // 2), (x1, (y0 + y1) // 2)], fill=(40, 30, 18), width=6)
    d.rectangle([x0 - 20, y1 + 8, x1 + 20, y1 + 22], fill=(60, 46, 28))  # the sill
    # it: sitting in the pool of light, facing the window; turning to us at the end
    d.ellipse([200, 960, 600, 1090], fill=(int(150 * (1 - 0.4 * night)), int(118 * (1 - 0.4 * night)), int(68 * (1 - 0.4 * night))))
    u = 26.0 * 0.62
    fx, feet = 400, 1030
    seat = [(-3.2, 0), (-2.6, -9), (-1.2, -12.2), (1.4, -12.2), (2.2, -9.5), (4.4, -1.0), (3.0, 0)]
    stand = [(-2.4, 0), (-2.8, -11), (-2.0, -21), (2.0, -21), (2.8, -11), (2.6, -1.0), (2.4, 0)]
    body = [(fx + lerp(a_[0], b_[0], sit) * u, feet + lerp(a_[1], b_[1], sit) * u) for a_, b_ in zip(stand, seat)]
    d.polygon(body, fill=(6, 5, 4))
    hx, hy = fx + lerp(0, -0.2, sit) * u, feet + lerp(-24.0, -14.6, sit) * u
    hr = 2.3 * u
    d.ellipse([hx - hr, hy - hr, hx + hr, hy + hr], fill=(8, 6, 5))
    if face_us < 0.5:  # its back to us, watching: the lights are on the far side, so we see none
        pass
    else:
        k = (face_us - 0.5) * 2
        for ox in (-0.8, 0.8):
            gx, gy, r = hx + ox * u, hy - 0.2 * u, 0.3 * u * k
            d.ellipse([gx - r, gy - r, gx + r, gy + r], fill=(255, 225, 150))
    return np.asarray(im, np.float32)


def encode(frames_fn, n, out):
    p = subprocess.Popen([F, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r",
                          str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "18", "-preset", "fast", "-pix_fmt", "yuv420p", out],
                         stdin=subprocess.PIPE)
    for i in range(n):
        p.stdin.write(np.clip(frames_fn(i), 0, 255).astype(np.uint8).tobytes())
    p.stdin.close()
    p.wait()


def main():
    run, field_dir = sys.argv[1], sys.argv[2]
    usrc = glob.glob(os.path.join(run, "*.webm"))[0]
    fsrc = glob.glob(os.path.join(field_dir, "*.webm"))[0]
    old = sorted(glob.glob(os.path.join(run, "segs", "s*.mp4")))
    from build_whats_theirs import build_room  # noqa: E402
    room_bg = build_room(np.random.default_rng(12)).resize((W, H), Image.LANCZOS)
    out_dir = os.path.join(run, "window")
    os.makedirs(out_dir, exist_ok=True)
    parts = []

    def span(a, b):
        return int(round(b * FPS)) - int(round(a * FPS))

    # 1. intro and verse-1 opening: the room, the window, then in through it (0 - 15.1)
    n = span(0.0, 15.1)
    rd = Reader(usrc, 0.0, 0.7)
    cx, cy = (WIN[0] + WIN[2]) / 2, (WIN[1] + WIN[3]) / 2
    zmax = max(W / (WIN[2] - WIN[0]), H / (WIN[3] - WIN[1])) * 1.02

    def intro(i):
        t = i / FPS
        fr = room_frame(room_bg, rd.next().astype(np.float32), t)
        fr = fr * ease(t / 3.0)
        z = math.exp(lerp(0, math.log(zmax), ease((t - 10.8) / 4.3)))
        if z > 1.001:
            cw, ch = W / z, H / z
            x0, y0 = lerp(0, cx - cw / 2, (z - 1) / (zmax - 1)), lerp(0, cy - ch / 2, (z - 1) / (zmax - 1))
            x0, y0 = min(max(x0, 0), W - cw), min(max(y0, 0), H - ch)  # PIL refuses a box off the edge
            fr = np.asarray(Image.fromarray(fr.astype(np.uint8)).resize((W, H), Image.LANCZOS,
                                                                           box=(x0, y0, x0 + cw, y0 + ch)), np.float32)
        return fr
    p = os.path.join(out_dir, "a_intro.mp4")
    encode(intro, n, p)
    rd.close()
    parts.append(p)
    # 2. the first cut's footage, 15.1 - 54.6 (its segments 2..10)
    parts += old[2:11]
    # 3. out of one cell to the whole field (54.6 - 60.8), then verse 2 in the field (60.8 - 76.9)
    fplan = [
        (54.6, 60.8, 20.0, 1.0, (3.0, 0.5, 0.17), (1.0, 0.5, 0.5)),     # out of the top-middle cell to the field
        (60.8, 65.1, 30.0, 4.0, (1.0, 0.5, 0.5), (1.0, 0.5, 0.5)),      # you wrote the rules and you let it run
        (65.1, 68.2, 80.0, 1.0, (1.0, 0.5, 0.5), (1.15, 0.5, 0.5)),     # a thousand suns
        (68.2, 72.6, 100.0, 1.0, (2.2, 0.2, 0.3), (2.2, 0.8, 0.3)),     # some flicker, some grow: across two cells
        (72.6, 76.9, 120.0, 0.6, (2.6, 0.83, 0.83), (3.0, 0.83, 0.83)), # things nobody knows: the collective
    ]
    for k, (a, b, s0, sp, z0, z1) in enumerate(fplan):
        fr_ = Reader(fsrc, s0, sp)
        n = span(a, b)

        def fld(i, fr_=fr_, n=n, z0=z0, z1=z1, first=(k == 0)):
            u = ease(i / max(n - 1, 1)) if first else i / max(n - 1, 1)
            z = math.exp(lerp(math.log(z0[0]), math.log(z1[0]), u))
            img = zoom_view(fr_.next(), z, lerp(z0[1], z1[1], u), lerp(z0[2], z1[2], u))
            if first and i < 10:  # a quick dissolve from the universe we were in
                img = img * (i / 10)
            return img
        p = os.path.join(out_dir, f"b_field{k}.mp4")
        encode(fld, n, p)
        fr_.close()
        parts.append(p)
    # 4. the first cut's footage again, 76.9 - 103.9 (its segments 16..21)
    parts += old[16:22]
    # 5. the bridge: back in the room at night (103.9 - 119.4); the window freezes on 'first draft', moves on 'of fate'
    n = span(103.9, 119.4)
    rd = Reader(usrc, 260.0, 0.5)
    held = [None]

    def bridge(i):
        t = 103.9 + i / FPS
        if 114.3 <= t < 116.9:
            if held[0] is None:
                held[0] = rd.next().astype(np.float32)
            w = held[0]
        else:
            w = rd.next().astype(np.float32)
        fr = room_frame(room_bg, w, t, night=0.8)
        if i < 12:
            fr = fr * (i / 12)
        return fr
    p = os.path.join(out_dir, "c_bridge.mp4")
    encode(bridge, n, p)
    rd.close()
    parts.append(p)
    # 6. the final chorus: field, universe, field, universe (119.4 - 136.8)
    fin = [(119.4, 123.6, "field", 150.0, 2.0, (1.0, 0.5, 0.5), (1.2, 0.5, 0.5)), (123.6, 127.9, "old", 28),
           (127.9, 132.4, "field", 180.0, 1.5, (2.8, 0.83, 0.83), (2.0, 0.7, 0.7)), (132.4, 136.8, "old", 30)]
    for k, spec in enumerate(fin):
        if spec[2] == "old":
            parts.append(old[spec[3]])
            continue
        a, b, _, s0, sp, z0, z1 = spec
        fr_ = Reader(fsrc, s0, sp)
        n = span(a, b)

        def fld2(i, fr_=fr_, n=n, z0=z0, z1=z1):
            u = i / max(n - 1, 1)
            z = math.exp(lerp(math.log(z0[0]), math.log(z1[0]), u))
            return zoom_view(fr_.next(), z, lerp(z0[1], z1[1], u), lerp(z0[2], z1[2], u)) * 1.05
        p = os.path.join(out_dir, f"d_final{k}.mp4")
        encode(fld2, n, p)
        fr_.close()
        parts.append(p)
    # 7. the outro: the room, the window full of the field; it turns to us on 'not even me' (136.8 - end)
    n = span(136.8, SONG_LEN)
    rd = Reader(fsrc, 200.0, 0.8)

    def outro(i):
        t = 136.8 + i / FPS
        face = ease((t - 138.4) / 1.2)
        fr = room_frame(room_bg, rd.next().astype(np.float32), t, face_us=face)
        return fr * (1 - ease((t - (SONG_LEN - 3.2)) / 3.2))
    p = os.path.join(out_dir, "e_outro.mp4")
    encode(outro, n, p)
    rd.close()
    parts.append(p)

    lst = os.path.join(out_dir, "list.txt")
    open(lst, "w").write("".join(f"file '{os.path.abspath(q)}'\n" for q in parts))
    film = os.path.join(out_dir, "film.mp4")
    subprocess.run([F, "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c:v", "libx264", "-crf", "18",
                    "-preset", "fast", "-r", str(FPS), "-pix_fmt", "yuv420p", film], check=True)

    # the lineage counter: only over the first cut's universe footage in the choruses, as before
    stats = json.load(open(os.path.join(run, "stats.json")))
    d = subprocess.run([F, "-i", usrc], capture_output=True, text=True).stderr.split("Duration: ")[1].split(",")[0]
    hh, mm, ss = d.split(":")
    k = (int(hh) * 3600 + int(mm) * 60 + float(ss)) / stats[-1]["t"]
    lt = np.array([r["t"] for r in stats]) * k
    ll = np.array([r["lin"] for r in stats])
    ts = lambda x: f"{int(x // 3600)}:{int(x // 60) % 60:02d}:{x % 60:05.2f}"  # noqa: E731
    used = set(range(2, 11)) | set(range(16, 22)) | {28, 30}
    ev = []
    for idx, (a, b, s0, sp, *_) in enumerate(SEGS):
        if idx not in used or not any(ca <= a < cb for ca, cb in CHORUS + [(119.4, 136.8)]):
            continue
        t = a
        while t < b - 1e-6:
            t1 = min(b, t + 0.25)
            ev.append(f"Dialogue: 0,{ts(t)},{ts(t1)},Count,lineages ever born  {int(np.interp(s0 + (t - a) * sp, lt, ll)):,}\n")
            t = t1
    ass = os.path.join(out_dir, "over.ass")
    open(ass, "w").write(
        "[Script Info]\nScriptType: v4.00+\nPlayResX: 704\nPlayResY: 1280\n\n[V4+ Styles]\n"
        "Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, BorderStyle, Outline, Shadow, "
        "Alignment, MarginL, MarginR, MarginV\n"
        "Style: Count,DejaVu Sans Mono,30,&H0096F078,&H00000000,&H80000000,0,1,2,0,1,34,34,40\n"
        "Style: Default,DejaVu Sans,43,&H00FFFFFF,&H00000000,&H80000000,1,1,3,1,5,60,60,0\n\n"
        "[Events]\nFormat: Layer, Start, End, Style, Text\n" + "".join(ev) +
        f"Dialogue: 0,{ts(SONG_LEN + 0.2)},{ts(END - 0.1)},Default,{{\\i1}}We only get to teach it once.\n")
    subprocess.run([F, "-loglevel", "error", "-y", "-i", film, "-i", SONG, "-filter_complex",
                    f"[0:v]noise=alls=3:allf=t,tpad=stop_mode=add:stop_duration=6:color=black,trim=duration={END},"
                    f"subtitles={ass},format=yuv420p[v];[1:a]apad=whole_dur={END}[au]",
                    "-map", "[v]", "-map", "[au]", "-t", str(END), "-c:v", "libx264", "-b:v", "1250k", "-preset", "slow",
                    "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", "out/first-draft-of-fate-window.mp4"], check=True)
    print("saved out/first-draft-of-fate-window.mp4")


if __name__ == "__main__":
    main()
