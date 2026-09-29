"""'First Draft of Fate': a music video shot inside the real Selection universe. No drawing, no generated clips: every
frame is engine.html#cleanart running in headless Chromium, recorded by video/record_universe.js (7 minutes, with the
engine's own numbers - particles N, tick, lineages ever born - logged every half second beside the video).
The cuts follow the song's lines and land on real events from that log: early divisions on 'little lights that divide',
the run's one big crash (a third of the population in five seconds, 4 minutes in) on 'most of them vanish', and the
burst of new lineages that came straight after it on 'something new keeps arriving'. During the choruses a small
counter shows the engine's real count of lineages ever born, so the claim on screen is the measured one.
    python3 video/build_first_draft_of_fate.py RUN_DIR   (RUN_DIR holds the .webm and stats.json)
"""
import glob
import json
import os
import subprocess
import sys

import imageio_ffmpeg
import numpy as np

F = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 704, 1280, 24
SONG = "out/songs/first-draft-of-fate.mp3"
SONG_LEN = 149.92
END = 153.4

# song start, song end, source (video) start, speed, zoom, pan from (x, y) to (x, y) as fractions, look
# 'look' is an ffmpeg eq/hue string or ''. speed 0 = a held frame.
SEGS = [
    (0.0, 10.8, 0.0, 0.5, 1.0, (0.5, 0.5), (0.5, 0.5), "fadein"),       # the world begins: first seconds of the run
    (10.8, 15.1, 5.4, 1.0, 1.0, (0.5, 0.5), (0.5, 0.5), ""),            # there's a world in a window that nobody drew
    (15.1, 19.4, 1.5, 0.6, 2.2, (0.82, 0.12), (0.72, 0.2), ""),         # little lights that divide (early growth)
    (19.4, 23.5, 28.0, 1.0, 1.4, (0.3, 0.3), (0.7, 0.6), ""),           # no one tells them the shape
    (23.5, 27.4, 60.0, 1.0, 2.0, (0.6, 0.4), (0.4, 0.6), ""),           # they find it by losing
    (27.4, 32.3, 20.0, 8.0, 1.0, (0.5, 0.5), (0.5, 0.5), ""),           # copy and change and keep what stays (8x)
    (32.3, 36.0, 211.0, 2.0, 1.0, (0.5, 0.5), (0.5, 0.5), "vanish"),    # most of them vanish: THE crash
    (36.0, 39.1, 218.4, 1.0, 1.0, (0.5, 0.5), (0.5, 0.5), "bright"),    # something new keeps arriving: the burst after
    (39.1, 43.3, 221.5, 0.7, 3.2, (0.18, 0.22), (0.3, 0.3), ""),        # out of rules too small to see
    (43.3, 47.3, 240.0, 1.0, 1.6, (0.3, 0.6), (0.7, 0.4), "bright"),    # something new keeps arriving
    (47.3, 54.6, 150.0, 1.0, 1.0, (0.5, 0.5), (0.5, 0.5), ""),          # nobody planned it, not even me
    (54.6, 60.8, 100.0, 20.0, 1.0, (0.5, 0.5), (0.5, 0.5), ""),         # instrumental: the run, 20x
    (60.8, 65.1, 0.0, 12.0, 1.0, (0.5, 0.5), (0.5, 0.5), ""),           # you wrote the rules and you let it run
    (65.1, 68.2, 300.0, 1.0, 1.0, (0.5, 0.5), (0.5, 0.5), "bright"),    # a thousand suns
    (68.2, 72.6, 120.0, 1.0, 2.4, (0.15, 0.3), (0.35, 0.3), ""),        # some of them flicker, some of them grow
    (72.6, 76.9, 170.0, 0.5, 3.0, (0.2, 0.18), (0.22, 0.4), ""),        # some of them do things that nobody knows
    (76.9, 81.9, 250.0, 10.0, 1.0, (0.5, 0.5), (0.5, 0.5), ""),         # copy and change (10x)
    (81.9, 86.6, 209.0, 2.0, 2.0, (0.4, 0.5), (0.6, 0.5), "vanish"),    # most of them vanish (the crash, closer)
    (86.6, 90.8, 219.0, 1.0, 1.3, (0.5, 0.4), (0.5, 0.6), "bright"),    # something new keeps arriving
    (90.8, 94.8, 330.0, 0.7, 3.4, (0.78, 0.82), (0.84, 0.74), ""),      # out of rules too small to see
    (94.8, 99.8, 350.0, 1.0, 1.0, (0.5, 0.5), (0.5, 0.5), "bright"),    # something new keeps arriving
    (99.8, 103.9, 380.0, 1.0, 1.5, (0.6, 0.4), (0.4, 0.6), ""),         # nobody planned it, not even me
    (103.9, 108.0, 260.0, 0.4, 3.0, (0.2, 0.75), (0.3, 0.8), "quiet"),   # if it surprises you, it's working
    (108.0, 111.3, 265.0, 0.3, 3.0, (0.8, 0.2), (0.7, 0.25), "quiet"),   # if it doesn't yet, then wait
    (111.3, 114.3, 280.0, 0.5, 2.0, (0.25, 0.2), (0.35, 0.3), "quiet"),   # nothing here was ever finished
    (114.3, 116.9, 290.0, 0.0, 1.4, (0.5, 0.5), (0.5, 0.5), "quiet"),   # everything here is a first draft... (held)
    (116.9, 119.4, 290.0, 1.0, 1.4, (0.5, 0.5), (0.5, 0.5), ""),        # ...of fate (and it moves again)
    (119.4, 123.6, 300.0, 2.0, 1.0, (0.5, 0.5), (0.5, 0.5), "bright"),  # final chorus
    (123.6, 127.9, 320.0, 1.0, 2.8, (0.15, 0.8), (0.3, 0.7), "bright"),
    (127.9, 132.4, 340.0, 2.0, 1.5, (0.3, 0.5), (0.7, 0.5), "bright"),
    (132.4, 136.8, 370.0, 1.0, 1.0, (0.5, 0.5), (0.5, 0.5), "bright"),
    (136.8, SONG_LEN, 380.0, 0.8, 1.0, (0.5, 0.5), (0.5, 0.5), "fadeout"),  # not even me ... something new
]
CHORUS = [(36.0, 54.6), (86.6, 103.9), (119.4, 136.8)]  # when the lineage counter shows


def main():
    run = sys.argv[1]
    src = glob.glob(os.path.join(run, "*.webm"))[0]
    stats = json.load(open(os.path.join(run, "stats.json")))
    d = subprocess.run([F, "-i", src], capture_output=True, text=True).stderr.split("Duration: ")[1].split(",")[0]
    hh, mm, ss = d.split(":")
    vlen = int(hh) * 3600 + int(mm) * 60 + float(ss)
    k = vlen / stats[-1]["t"]  # the recording runs a little behind the wall clock: map log time to video time
    tmp = os.path.join(run, "segs")
    os.makedirs(tmp, exist_ok=True)
    parts = []
    for n, (a, b, s0, sp, z, p0, p1, look) in enumerate(SEGS):
        dur = b - a
        sw, sh = int(W * z / 2) * 2, int(H * z / 2) * 2
        fx = f"({sw}-{W})*({p0[0]}+({p1[0]}-{p0[0]})*t/{dur:.3f})"
        fy = f"({sh}-{H})*({p0[1]}+({p1[1]}-{p0[1]})*t/{dur:.3f})"
        vf = []
        if sp == 0:
            vf.append(f"trim=start_frame=0:end_frame=1,loop=loop=-1:size=1,setpts=N/{FPS}/TB")
        else:
            vf.append(f"setpts=(PTS-STARTPTS)/{sp}")
        vf += [f"fps={FPS}", f"scale={sw}:{sh}:flags=lanczos", f"crop={W}:{H}:'{fx}':'{fy}'"]
        if look == "vanish":
            vf.append("eq=saturation=0.55:brightness=-0.03")
        elif look == "bright":
            vf.append("eq=saturation=1.2:brightness=0.02:contrast=1.05")
        elif look == "quiet":
            vf.append("eq=saturation=0.8:brightness=-0.05")
        elif look == "fadein":
            vf.append(f"fade=t=in:st=0:d=3")
        elif look == "fadeout":
            vf.append(f"fade=t=out:st={dur - 3.2:.2f}:d=3.2")
        vf.append(f"trim=duration={dur:.3f},tpad=stop_mode=clone:stop_duration=2,trim=duration={dur:.3f},format=yuv420p")
        out = os.path.join(tmp, f"s{n:02d}.mp4")
        span = dur * max(sp, 0.05) + 1.0
        subprocess.run([F, "-loglevel", "error", "-y", "-ss", f"{s0:.2f}", "-t", f"{span:.2f}", "-i", src, "-vf", ",".join(vf),
                        "-an", "-c:v", "libx264", "-crf", "18", "-preset", "fast", "-r", str(FPS), out], check=True)
        parts.append(out)
        print(f"seg {n:02d} {a:6.1f}-{b:6.1f}  src {s0}  x{sp}  zoom {z}", flush=True)
    lst = os.path.join(tmp, "list.txt")
    open(lst, "w").write("".join(f"file '{os.path.abspath(p)}'\n" for p in parts))
    film = os.path.join(tmp, "film.mp4")
    subprocess.run([F, "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", film], check=True)

    # the counter: the engine's own count of lineages ever born, at the moment on screen
    lt = np.array([r["t"] for r in stats]) * k
    ll = np.array([r["lin"] for r in stats])
    ts = lambda x: f"{int(x // 3600)}:{int(x // 60) % 60:02d}:{x % 60:05.2f}"  # noqa: E731
    ev = []
    for a, b, s0, sp, *_ in SEGS:
        if not any(ca <= a < cb for ca, cb in CHORUS):
            continue
        t = a
        while t < b - 1e-6:
            t1 = min(b, t + 0.25)
            v = int(np.interp(s0 + (t - a) * sp, lt, ll))
            ev.append(f"Dialogue: 0,{ts(t)},{ts(t1)},Count,lineages ever born  {v:,}\n")
            t = t1
    ass = os.path.join(tmp, "over.ass")
    open(ass, "w").write(
        "[Script Info]\nScriptType: v4.00+\nPlayResX: 704\nPlayResY: 1280\n\n[V4+ Styles]\n"
        "Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, BorderStyle, Outline, Shadow, "
        "Alignment, MarginL, MarginR, MarginV\n"
        "Style: Count,DejaVu Sans Mono,30,&H0096F078,&H00000000,&H80000000,0,1,2,0,1,34,34,40\n"
        "Style: Default,DejaVu Sans,43,&H00FFFFFF,&H00000000,&H80000000,1,1,3,1,5,60,60,0\n\n"
        "[Events]\nFormat: Layer, Start, End, Style, Text\n" + "".join(ev) +
        f"Dialogue: 0,{ts(SONG_LEN + 0.2)},{ts(END - 0.1)},Default,{{\\i1}}We only get to teach it once.\n")
    subprocess.run([F, "-loglevel", "error", "-y", "-i", film, "-i", SONG, "-filter_complex",
                    f"[0:v]noise=alls=3:allf=t,tpad=stop_mode=add:stop_duration=5:color=black,trim=duration={END},"
                    f"subtitles={ass},format=yuv420p[v];[1:a]apad=whole_dur={END}[au]",
                    "-map", "[v]", "-map", "[au]", "-t", str(END), "-c:v", "libx264", "-crf", "23", "-preset", "slow",
                    "-maxrate", "3500k", "-bufsize", "7M", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart",
                    "out/first-draft-of-fate.mp4"], check=True)
    json.dump({"title": "First Draft of Fate", "song": SONG, "source": "engine.html#cleanart, recorded live",
               "video_per_log_second": k, "segments": SEGS, "chorus_counter": CHORUS},
              open("video/stories/first-draft-of-fate.json", "w"), indent=1)
    print("saved out/first-draft-of-fate.mp4")


if __name__ == "__main__":
    main()
