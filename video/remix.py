"""Re-forge existing clips into a new film cut to a track, locally (no Modal, no cost).

    python3 video/remix.py video/stories/iron-ballroom.json out/iron-ballroom.mp4

A cut list (JSON) of timed segments: `single` (one clip, optionally mirrored, slowed or trailed), `grid`
(n x n clips, each mirrored, with small time offsets so identical cells ripple), or `black`. Every segment gets
the `iron` look (steel greyscale with yellow held) unless it says `"color": "full"`. Then the whole film gets a
zoom pulse on the beat, negative flashes on accents, the song and the end line on black in the track's silence.
"""
import json
import os
import subprocess
import sys
import tempfile

import imageio_ffmpeg

F = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 704, 1280, 24
IRON = ("colorhold=color=0xF2C230:similarity=0.16:blend=0.1,eq=contrast=1.28:gamma=0.92:saturation=1.4,"
        "colorbalance=bs=0.06:bm=0.03:rh=0.04")


def mirror(label, mode, w, h, out):
    """Fold a picture into symmetry: 'h' mirrors the left half, 'quad' the top-left quarter four ways."""
    if mode == "h":
        return (f"[{label}]scale={w}:{h},crop={w // 2}:{h}:0:0,split[{out}a][{out}b];[{out}b]hflip[{out}c];"
                f"[{out}a][{out}c]hstack[{out}]")
    if mode == "quad":
        return (f"[{label}]scale={w}:{h},crop={w // 2}:{h // 2}:0:0,split=4[{out}a][{out}b][{out}c][{out}d];"
                f"[{out}b]hflip[{out}e];[{out}c]vflip[{out}f];[{out}d]hflip,vflip[{out}g];"
                f"[{out}a][{out}e]hstack[{out}t];[{out}f][{out}g]hstack[{out}u];[{out}t][{out}u]vstack[{out}]")
    return f"[{label}]scale={w}:{h}[{out}]"


def render(seg, clipdir, path, dur):
    ins, g = [], []
    if seg["type"] == "black":
        subprocess.run([F, "-loglevel", "error", "-y", "-f", "lavfi", "-i", f"color=black:s={W}x{H}:r={FPS}:d={dur:.3f}",
                        "-c:v", "libx264", "-crf", "12", "-pix_fmt", "yuv420p", path], check=True)
        return
    speed = seg.get("speed", 1.0)  # >1 is slower
    if seg["type"] == "single":
        n, cells = 1, [seg["clip"]]
    else:
        n = seg["n"]
        cells = seg["clips"] if len(seg["clips"]) == n * n else [seg["clips"][k % len(seg["clips"])] for k in range(n * n)]
    cw, ch = W // n, H // n
    for k, c in enumerate(cells):
        off = seg.get("offset", 0.0) * k + seg.get("in", 0.0)
        ins += ["-stream_loop", "-1", "-ss", f"{off % 4.5:.3f}", "-i", os.path.join(clipdir, c)]
        g.append(f"[{k}:v]setpts={speed}*(PTS-STARTPTS),fps={FPS},setsar=1[s{k}]")
        g.append(mirror(f"s{k}", seg.get("mirror", "none"), cw, ch, f"m{k}"))
    if n == 1:
        last = "m0"
    else:
        layout = "|".join(f"{(k % n) * cw}_{(k // n) * ch}" for k in range(n * n))
        g.append("".join(f"[m{k}]" for k in range(n * n)) + f"xstack=inputs={n * n}:layout={layout}[grid]")
        last = "grid"
    post = [f"scale={W}:{H}"]
    if seg.get("stutter"):  # loop the opening slice, like a stuck record
        k = max(1, round(seg["stutter"] * FPS))
        post.append(f"trim=end_frame={k},loop=loop=-1:size={k}:start=0,setpts=N/{FPS}/TB")
    if seg.get("trails"):
        post.append("lagfun=decay=0.96")
    if "fade_to_iron" in seg:  # full colour that drains to iron: [start, seconds] within the segment
        a, b = seg["fade_to_iron"]
        post.append(f"format=yuv420p,split[{last}c][{last}i];[{last}i]{IRON},format=yuv420p[{last}j];"
                    f"[{last}c][{last}j]blend=all_expr='A+(B-A)*clip((T-{a})/{b},0,1)'")
    elif seg.get("color", "iron") == "iron":
        post.append(IRON)
    g.append(f"[{last}]" + ",".join(post) + ",format=yuv420p[v]")
    subprocess.run([F, "-loglevel", "error", "-y", *ins, "-filter_complex", ";".join(g), "-map", "[v]",
                    "-t", f"{dur:.3f}", "-r", str(FPS), "-c:v", "libx264", "-crf", "14", "-pix_fmt", "yuv420p", path],
                   check=True)


def main(cut_path, out):
    cut = json.load(open(cut_path))
    base = os.path.dirname(os.path.abspath(cut_path))
    clipdir = os.path.join(base, cut["clipdir"])
    segs = cut["segments"]
    d = tempfile.mkdtemp()
    parts = []
    for i, seg in enumerate(segs):
        t0 = seg["at"]
        t1 = segs[i + 1]["at"] if i + 1 < len(segs) else cut["music_end"]
        p = os.path.join(d, f"s{i:03d}.mp4")
        render(seg, clipdir, p, t1 - t0)
        parts.append(p)
        print(f"{t0:7.2f}-{t1:7.2f} {seg['type']:6s} {seg.get('clip', seg.get('n', ''))}", flush=True)
    listing = os.path.join(d, "list.txt")
    open(listing, "w").write("".join(f"file '{p}'\n" for p in parts))
    joined = os.path.join(d, "joined.mp4")
    subprocess.run([F, "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", listing, "-c", "copy", joined],
                   check=True)

    # Whole-film treatment: a zoom pulse on every beat inside the pulse windows, negative flashes, end line.
    beat, phase = cut["beat"], cut["phase"]
    win = "+".join(f"between(t,{a},{b})" for a, b in cut["pulse"])
    pulse = f"(0.045*exp(-9*mod(t-{phase},{beat}))*({win}))"
    flash = "+".join(f"between(t,{t},{t + 0.09})" for t in cut["flashes"])
    end = cut["music_end"] + cut.get("tail", 2.5)
    subs = os.path.join(d, "end.ass")
    a, b = cut["music_end"] + 0.3, end - 0.2
    ts = lambda x: f"{int(x // 3600)}:{int(x // 60) % 60:02d}:{x % 60:05.2f}"
    open(subs, "w").write(
        "[Script Info]\nScriptType: v4.00+\nPlayResX: 704\nPlayResY: 1280\n\n[V4+ Styles]\n"
        "Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, BorderStyle, Outline, Shadow, "
        "Alignment, MarginL, MarginR, MarginV\nStyle: Default,DejaVu Sans,43,&H00FFFFFF,&H00000000,&H80000000,1,1,3,1,5,60,60,0\n\n"
        f"[Events]\nFormat: Layer, Start, End, Style, Text\nDialogue: 0,{ts(a)},{ts(b)},Default,{{\\i1}}{cut['line']}\n")
    look = (cut["look"] + ",") if cut.get("look") else ""
    vf = (f"{look}scale=w='{W}*(1+{pulse})':h='{H}*(1+{pulse})':eval=frame,crop={W}:{H},negate=enable='{flash}',"
          f"noise=alls=5:allf=t,tpad=stop_mode=add:stop_duration={end - cut['music_end']:.2f}:color=black,"
          f"fade=t=in:d=0.4,fade=t=out:st={cut['music_end'] - 0.6:.2f}:d=0.6,subtitles={subs},format=yuv420p")
    song = cut["song"]
    parts_ = cut.get("song_parts", [[0, cut["music_end"]]])  # excerpts of the track, joined in order
    au = "".join(f"[1:a]atrim={a}:{b},asetpts=PTS-STARTPTS,afade=t=in:d=0.02,afade=t=out:st={b - a - 0.02:.3f}:d=0.02[p{i}];"
                 for i, (a, b) in enumerate(parts_))
    au += "".join(f"[p{i}]" for i in range(len(parts_))) + f"concat=n={len(parts_)}:v=0:a=1"
    if cut.get("song_fade"):
        au += f",afade=t=out:st={cut['music_end'] - cut['song_fade']:.3f}:d={cut['song_fade']}"
    subprocess.run([F, "-loglevel", "error", "-y", "-i", joined, "-i", song, "-filter_complex",
                    f"[0:v]{vf}[v];{au},atrim=0:{end:.3f},apad=whole_dur={end:.3f}[a]", "-map", "[v]", "-map", "[a]",
                    "-t", f"{end:.3f}", "-c:v", "libx264", "-crf", "25", "-preset", "slow", "-maxrate", "3500k",
                    "-bufsize", "7M", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out], check=True)
    print("saved", out)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
