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


OXBLOOD = "colorbalance=rs=0.35:gs=-0.1:bs=-0.1:rm=0.12:gm=-0.03:bm=-0.06,eq=contrast=1.1"


def look(label, name, out):
    """One graded picture from another. 'wire' traces every edge as glowing gold line on black; 'outline' lays that
    wire over the full-colour picture (flesh with its wiring showing); 'hot' is white-hot wire for the loudest bars."""
    if name == "full":
        return f"[{label}]null[{out}]"
    if name == "iron":
        return f"[{label}]{IRON}[{out}]"
    if name == "oxblood":
        return f"[{label}]{IRON},{OXBLOOD}[{out}]"
    if name in ("wire", "hot", "outline"):
        tint = "r='val':g='val*0.8':b='val*0.15'" if name != "hot" else "r='val':g='val*0.95':b='val*0.7'"
        pre = f"[{label}]format=gbrp,split[{out}o][{out}q];[{out}q]" if name == "outline" else f"[{label}]"
        g = (f"{pre}format=gbrp,colorchannelmixer=.3:.59:.11:0:.3:.59:.11:0:.3:.59:.11,edgedetect=low=0.06:high=0.2,dilation,lutrgb={tint},split[{out}x][{out}y];"
             f"[{out}y]gblur=sigma=4[{out}z];[{out}x][{out}z]blend=all_mode=screen")
        if name == "outline":
            return g + f"[{out}w];[{out}o]colorlevels=romax=0.9:gomax=0.9:bomax=0.9[{out}p];[{out}p][{out}w]blend=all_mode=screen[{out}]"
        return g + f"[{out}]"
    raise ValueError(name)


def source(spec, clipdir, base, off):
    """An input: a clip from the library (looped), or any film by path with an in-point (the earlier remixes)."""
    if "src" in spec:
        return ["-ss", f"{spec.get('in', 0.0) + off:.3f}", "-i", os.path.join(base, spec["src"])]
    return ["-stream_loop", "-1", "-ss", f"{(off + spec.get('in', 0.0)) % 4.5:.3f}", "-i", os.path.join(clipdir, spec["clip"])]


def render(seg, clipdir, path, dur, cut=None, base=".", at=0.0):
    cut = cut or {}
    ins, g = [], []
    if seg["type"] == "black":
        subprocess.run([F, "-loglevel", "error", "-y", "-f", "lavfi", "-i", f"color=black:s={W}x{H}:r={FPS}:d={dur:.3f}",
                        "-c:v", "libx264", "-crf", "12", "-pix_fmt", "yuv420p", path], check=True)
        return
    speed = seg.get("speed", 1.0)  # >1 is slower
    if seg["type"] == "single":
        n, cells = 1, [seg]
    else:
        n = seg["n"]
        cl = seg["clips"]
        cl = cl if len(cl) == n * n else [cl[k % len(cl)] for k in range(n * n)]
        cells = [dict(c) if isinstance(c, dict) else {"clip": c} for c in cl]
    cw, ch = W // n, H // n
    looks = seg.get("looks")
    for k, c in enumerate(cells):
        ins += source(c, clipdir, base, seg.get("offset", 0.0) * k + (seg.get("in", 0.0) if n > 1 else 0.0))
        g.append(f"[{k}:v]setpts={c.get('speed', speed)}*(PTS-STARTPTS),fps={FPS},setsar=1[s{k}]")
        g.append(mirror(f"s{k}", c.get("mirror", seg.get("mirror", "none")), cw, ch, f"n{k}"))
        g.append(look(f"n{k}", looks[k % len(looks)] if looks else "full", f"m{k}"))
    k0 = len(cells)
    if n == 1:
        last = "m0"
    else:
        layout = "|".join(f"{(k % n) * cw}_{(k // n) * ch}" for k in range(n * n))
        g.append("".join(f"[m{k}]" for k in range(n * n)) + f"xstack=inputs={n * n}:layout={layout}[grid]")
        last = "grid"
    if "fuse" in seg:  # a second picture laid into the first: flesh and wire in one frame
        fz = seg["fuse"]
        ins += source(fz, clipdir, base, 0.0)
        g.append(f"[{k0}:v]setpts={fz.get('speed', speed)}*(PTS-STARTPTS),fps={FPS},setsar=1[fs]")
        g.append(mirror("fs", fz.get("mirror", "none"), W, H, "fm"))
        g.append(look("fm", fz.get("look", "full"), "fl"))
        g.append(f"[{last}]scale={W}:{H},format=gbrp[fb];[fl]format=gbrp[fc];"
                 f"[fb][fc]blend=all_mode={fz.get('mode', 'screen')}:all_opacity={fz.get('opacity', 1.0)}[fused]")
        last = "fused"
    post = [f"scale={W}:{H}"]
    if seg.get("stutter"):  # loop the opening slice, like a stuck record
        k = max(1, round(seg["stutter"] * FPS))
        post.append(f"trim=end_frame={k},loop=loop=-1:size={k}:start=0,setpts=N/{FPS}/TB")
    if seg.get("trails"):
        post.append("lagfun=decay=0.96")
    g.append(f"[{last}]" + ",".join(post) + "[pre]")
    main_look = seg.get("color", seg.get("look", cut.get("default_look", "iron")))
    if "fade_to_iron" in seg:
        seg = dict(seg, morph=["iron"] + list(seg["fade_to_iron"]))
    if "morph" in seg or seg.get("flip"):
        # Two versions of the same picture: morph cross-fades to the second over [start, seconds]; flip swaps between
        # them on every beat of the song (so flesh and wire trade places in time with it).
        other = seg["morph"][0] if "morph" in seg else seg.get("flip_look", "wire")
        g.append(f"[pre]format=gbrp,split[pa][pb]")
        g.append(look("pa", main_look, "la"))
        g.append(look("pb", other, "lb"))
        if "morph" in seg:
            _, s0, d0 = seg["morph"]
            ex = f"A+(B-A)*clip((T-{s0})/{d0},0,1)"
        else:
            beat, ph = cut["beat"] * seg.get("flip_every", 1), cut["phase"]
            ex = f"if(lt(mod(T+{at - ph:.4f},{2 * beat:.4f}),{beat:.4f}),A,B)"
        g.append(f"[la]format=gbrp[ma];[lb]format=gbrp[mb];[ma][mb]blend=all_expr='{ex}'[graded]")
    else:
        g.append(look("pre", main_look, "graded"))
    tail = []
    if seg.get("rgb"):  # tear the colour channels apart: electric
        tail.append(f"rgbashift=rh=-{seg['rgb']}:bh={seg['rgb']}:edge=smear")
    if seg.get("fade_out"):
        tail.append(f"fade=t=out:st={dur - seg['fade_out']:.3f}:d={seg['fade_out']}")
    if seg.get("fade_in"):
        tail.append(f"fade=t=in:d={seg['fade_in']}")
    g.append("[graded]" + ",".join(tail + ["format=yuv420p"]) + "[v]")
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
        render(seg, clipdir, p, t1 - t0, cut, base, t0)
        parts.append(p)
        print(f"{t0:7.2f}-{t1:7.2f} {seg['type']:6s} {seg.get('clip', seg.get('src', seg.get('n', '')))}", flush=True)
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
