"""Cut existing clips to a finished song: every cut on a lyric, every glitch on a skip. Local, no GPU.

    python3 video/fit_to_song.py video/stories/only-the-happy-ones-song.json out/final.mp4

The edit list (JSON) names each segment's clip, where it starts in the song and where the next begins; a
clip slower or faster than its slot is retimed to fit (a slight slow-motion suits memories). Glitch
bursts are in song time. The song is cut at `song_end`; the end line sits on black, in silence, after it.
"""
import json
import os
import subprocess
import sys
import tempfile

import imageio_ffmpeg

sys.path.insert(0, os.path.dirname(__file__))
from make_video import _ass_time, glitch_graph  # noqa: E402

F = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 704, 1280, 24
LOOKS = {
    "home_movie": "colorbalance=rs=0.08:gs=0.02:bs=-0.08:rm=0.04:bm=-0.04,eq=saturation=0.8:contrast=1.05:gamma=1.02,"
                  "vignette=angle=PI/4.5,noise=alls=9:allf=t",
}


def dur(path):
    out = subprocess.run([F, "-i", path], capture_output=True, text=True).stderr
    h, m, s = out.split("Duration: ")[1].split(",")[0].split(":")
    return int(h) * 3600 + int(m) * 60 + float(s)


def main(edl_path, out):
    edl = json.load(open(edl_path))
    base = os.path.dirname(os.path.abspath(edl_path))
    segs = edl["segments"]
    end_video = edl["song_end"] + edl.get("tail", 3.0)
    d = tempfile.mkdtemp()

    # 1. Each segment retimed to exactly fill its slot, then all joined.
    parts = []
    for n, sg in enumerate(segs):
        src = os.path.join(base, sg["clip"])
        start = sg["at"]
        stop = segs[n + 1]["at"] if n + 1 < len(segs) else edl["song_end"]
        slot = stop - start
        inp = sg.get("in", 0.0)
        avail = dur(src) - inp
        speed = slot / avail  # >1 slows the clip down
        p = os.path.join(d, f"s{n}.mp4")
        subprocess.run([F, "-loglevel", "error", "-y", "-ss", str(inp), "-i", src, "-vf",
                        f"setpts={speed:.5f}*(PTS-STARTPTS),fps={FPS},scale={W}:{H},setsar=1,trim=duration={slot:.3f}",
                        "-an", "-c:v", "libx264", "-crf", "12", "-pix_fmt", "yuv420p", p], check=True)
        parts.append(p)
        print(f"{start:6.2f}-{stop:6.2f}  {os.path.basename(src)}  x{speed:.2f}")
    joined = os.path.join(d, "joined.mp4")
    listing = os.path.join(d, "list.txt")
    open(listing, "w").write("".join(f"file '{p}'\n" for p in parts))
    subprocess.run([F, "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", listing, "-c", "copy", joined],
                   check=True)

    # 2. Glitches on the skips, the look, fade to black, the end line, the song.
    subs = os.path.join(d, "end.ass")
    a, b = edl["song_end"] + 0.25, end_video - 0.2
    open(subs, "w").write(
        "[Script Info]\nScriptType: v4.00+\nPlayResX: 704\nPlayResY: 1280\n\n[V4+ Styles]\n"
        "Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, BorderStyle, Outline, Shadow, "
        "Alignment, MarginL, MarginR, MarginV\nStyle: Default,DejaVu Sans,43,&H00FFFFFF,&H00000000,&H80000000,1,1,3,1,5,60,60,0\n\n"
        f"[Events]\nFormat: Layer, Start, End, Style, Text\nDialogue: 0,{_ass_time(a)},{_ass_time(b)},Default,"
        "{\\i1}" + edl["line"] + "\n")
    fade_at = edl.get("fade_at", edl["song_end"] - 1.0)
    graph = glitch_graph(edl.get("glitch", []))
    graph = graph.replace("[v]", "[g]")
    graph += (f";[g]{LOOKS[edl['look']]},tpad=stop_mode=add:stop_duration={end_video - edl['song_end']:.2f}:color=black,"
              f"fade=t=in:d=0.5,fade=t=out:st={fade_at:.2f}:d=0.8,subtitles={subs},format=yuv420p[v]")
    song = edl["song"] if os.path.isabs(edl["song"]) else os.path.join(base, edl["song"])
    audio = (f"[1:a]atrim=0:{edl['song_end']:.3f},afade=t=out:st={edl['song_end'] - 0.4:.3f}:d=0.4,"
             f"apad=whole_dur={end_video:.3f}[a]")
    subprocess.run([F, "-loglevel", "error", "-y", "-i", joined, "-i", song, "-filter_complex", graph + ";" + audio,
                    "-map", "[v]", "-map", "[a]", "-t", f"{end_video:.3f}", "-c:v", "libx264", "-crf", "25",
                    "-preset", "slow", "-maxrate", "3500k", "-bufsize", "7M", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k",
                    "-movflags", "+faststart", out], check=True)
    print("saved", out)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
