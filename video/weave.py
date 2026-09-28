"""Lay whole shots over a base film at set times, each dissolving in and out: the generated jumps over the zoom.
    python3 video/weave.py base.mp4 out.mp4 clip.mp4@at[+in][:dur] ...   (seconds)"""
import sys

import imageio_ffmpeg
import subprocess

F = imageio_ffmpeg.get_ffmpeg_exe()


def main(base, out, specs, fade=0.35):
    ins, g, last = ["-i", base], [], "0:v"
    for k, sp in enumerate(specs, 1):
        path, rest = sp.split("@")
        at, dur = rest.split(":") if ":" in rest else (rest, None)
        at, off = (at.split("+") + ["0"])[:2]
        at, off = float(at), float(off)
        ins += ["-ss", f"{off:.3f}", "-i", path]
        d = float(dur) if dur else 5.0
        g.append(f"[{k}:v]scale=704:1280:force_original_aspect_ratio=increase,crop=704:1280,fps=24,setsar=1,"
                 f"trim=duration={d:.3f},format=yuva420p,fade=t=in:d={fade}:alpha=1,"
                 f"fade=t=out:st={d - fade:.3f}:d={fade}:alpha=1,setpts=PTS-STARTPTS+{at:.3f}/TB[c{k}]")
        g.append(f"[{last}][c{k}]overlay=eof_action=pass:enable='between(t,{at:.3f},{at + d:.3f})'[o{k}]")
        last = f"o{k}"
    g.append(f"[{last}]format=yuv420p[v]")
    subprocess.run([F, "-loglevel", "error", "-y", *ins, "-filter_complex", ";".join(g), "-map", "[v]",
                    "-c:v", "libx264", "-crf", "16", out], check=True)
    print("saved", out)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], sys.argv[3:])
