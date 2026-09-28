"""Finish a drawn film: one grade that gives way to full colour at a moment, grain, the song, and the end line.
    python3 video/finish.py film.mp4 song.mp3 out.mp4 --iron-until 95.06 --music-end 162.2 --line-at 162.7 166.5"""
import argparse
import os
import subprocess
import tempfile

import imageio_ffmpeg

from remix import IRON

F = imageio_ffmpeg.get_ffmpeg_exe()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("film"), ap.add_argument("song"), ap.add_argument("out")
    ap.add_argument("--iron-until", type=float, default=None)
    ap.add_argument("--music-end", type=float, required=True)
    ap.add_argument("--line-at", type=float, nargs=2, required=True)
    ap.add_argument("--line", default="We only get to teach it once.")
    a = ap.parse_args()
    end = a.line_at[1] + 0.4
    d = tempfile.mkdtemp()
    subs = os.path.join(d, "end.ass")
    ts = lambda x: f"{int(x // 3600)}:{int(x // 60) % 60:02d}:{x % 60:05.2f}"
    open(subs, "w").write(
        "[Script Info]\nScriptType: v4.00+\nPlayResX: 704\nPlayResY: 1280\n\n[V4+ Styles]\n"
        "Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, BorderStyle, Outline, Shadow, "
        "Alignment, MarginL, MarginR, MarginV\nStyle: Default,DejaVu Sans,43,&H00FFFFFF,&H00000000,&H80000000,1,1,3,1,5,60,60,0\n\n"
        f"[Events]\nFormat: Layer, Start, End, Style, Text\nDialogue: 0,{ts(a.line_at[0])},{ts(a.line_at[1])},Default,"
        f"{{\\i1}}{a.line}\n")
    if a.iron_until is not None:
        g = (f"[0:v]format=gbrp,split[a][b];[a]{IRON},format=gbrp[i];"
             f"[i][b]blend=all_expr='A+(B-A)*clip((T-{a.iron_until})/2.4,0,1)',format=yuv420p[g];[g]")
    else:
        g = "[0:v]"
    vf = (f"{g}noise=alls=5:allf=t,fade=t=in:d=0.6,fade=t=out:st={a.music_end - 1.5:.2f}:d=1.5,"
          f"tpad=stop_mode=add:stop_duration={end - a.music_end + 1:.2f}:color=black,trim=duration={end:.2f},"
          f"subtitles={subs},format=yuv420p[v]")
    subprocess.run([F, "-loglevel", "error", "-y", "-i", a.film, "-i", a.song, "-filter_complex",
                    f"{vf};[1:a]atrim=0:{end:.2f},apad=whole_dur={end:.2f}[au]", "-map", "[v]", "-map", "[au]",
                    "-t", f"{end:.2f}", "-c:v", "libx264", "-crf", "23", "-preset", "slow", "-maxrate", "3000k",
                    "-bufsize", "6M", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", a.out], check=True)
    print("saved", a.out)


if __name__ == "__main__":
    main()
