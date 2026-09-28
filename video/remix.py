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
    """Fold a picture into symmetry: 'h' mirrors the left half, 'quad' the top-left quarter four ways. Any source is
    first cropped to fill w x h (never squashed: the user's clips come square, landscape and portrait)."""
    cover = f"scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h},setsar=1"
    if mode == "h":
        return (f"[{label}]{cover},crop={w // 2}:{h}:0:0,split[{out}a][{out}b];[{out}b]hflip[{out}c];"
                f"[{out}a][{out}c]hstack[{out}]")
    if mode == "quad":
        return (f"[{label}]{cover},crop={w // 2}:{h // 2}:0:0,split=4[{out}a][{out}b][{out}c][{out}d];"
                f"[{out}b]hflip[{out}e];[{out}c]vflip[{out}f];[{out}d]hflip,vflip[{out}g];"
                f"[{out}a][{out}e]hstack[{out}t];[{out}f][{out}g]hstack[{out}u];[{out}t][{out}u]vstack[{out}]")
    return f"[{label}]{cover}[{out}]"


OXBLOOD = "colorbalance=rs=0.35:gs=-0.1:bs=-0.1:rm=0.12:gm=-0.03:bm=-0.06,eq=contrast=1.1"


def look(label, name, out):
    """One graded picture from another. 'wire' traces every edge as glowing gold line on black; 'outline' lays that
    wire over the full-colour picture (flesh with its wiring showing); 'hot' is white-hot wire for the loudest bars."""
    if name == "full":
        return f"[{label}]null[{out}]"
    if name == "off":  # an unlit key
        return f"[{label}]lutrgb=r=0:g=0:b=0[{out}]"
    if name == "iron":
        return f"[{label}]{IRON}[{out}]"
    if name == "ivory":  # piano black and ivory: ink shadows, warm paper whites, only yellow keeps its colour
        return (f"[{label}]colorhold=color=0xF2C230:similarity=0.16:blend=0.1,eq=contrast=1.5:gamma=0.85:saturation=1.3,"
                f"colorbalance=rh=0.05:gh=0.03:bh=-0.04,curves=all='0/0 0.25/0.08 0.75/0.9 1/1'[{out}]")
    if name == "pixel":  # the machine's view: coarse blocks
        return f"[{label}]scale={W // 22}:{H // 22},scale={W}:{H}:flags=neighbor[{out}]"
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
        return ["-stream_loop", "-1", "-ss", f"{spec.get('in', 0.0) + off:.3f}", "-i", os.path.join(base, spec["src"])]
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
    elif seg["type"] == "keys":  # the frame cut into n vertical keys, each its own clip, moment or look
        n = seg["n"]
        cl = seg["clips"]
        cells = [dict(c) if isinstance(c, dict) else {"clip": c} for c in (cl[k % len(cl)] for k in range(n))]
    else:
        n = seg["n"]
        cl = seg["clips"]
        cl = cl if len(cl) == n * n else [cl[k % len(cl)] for k in range(n * n)]
        cells = [dict(c) if isinstance(c, dict) else {"clip": c} for c in cl]
    keys = seg["type"] == "keys"
    cw, ch = W // n, (H if keys else H // n)
    looks = seg.get("looks")
    for k, c in enumerate(cells):
        ins += source(c, clipdir, base, seg.get("offset", 0.0) * k + (seg.get("in", 0.0) if n > 1 else 0.0))
        g.append(f"[{k}:v]setpts={c.get('speed', speed)}*(PTS-STARTPTS),fps={FPS},setsar=1[s{k}]")
        if keys:
            g.append(mirror(f"s{k}", c.get("mirror", seg.get("mirror", "none")), W, H, f"r{k}"))
            g.append(f"[r{k}]crop={cw}:{H}:{k * cw}:0[n{k}]")
        else:
            g.append(mirror(f"s{k}", c.get("mirror", seg.get("mirror", "none")), cw, ch, f"n{k}"))
        g.append(look(f"n{k}", looks[k % len(looks)] if looks else "full", f"m{k}"))
    k0 = len(cells)
    if n == 1:
        last = "m0"
    elif keys:
        g.append("".join(f"[m{k}]" for k in range(n)) + f"hstack=inputs={n}[grid]")
        last = "grid"
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
        mode, nn, sl = fz.get("mode", "screen"), fz.get("n", 8), fz.get("slide", 0)
        if mode in ("rows", "keys", "checker"):
            # Pixel-aligned crossover: the two pictures interleave in bands, keys or a weave, sliding at `slide` px/s.
            cell = (H if mode == "rows" else W) / nn
            sel = {"rows": f"mod(floor((Y+T*{sl})/{cell:.2f}),2)", "keys": f"mod(floor((X+T*{sl})/{cell:.2f}),2)",
                   "checker": f"mod(floor((X+T*{sl})/{cell:.2f})+floor(Y/{cell:.2f}),2)"}[mode]
            bl = f"blend=all_expr='if({sel},B,A)'"
        else:
            bl = f"blend=all_mode={mode}:all_opacity={fz.get('opacity', 1.0)}"
        g.append(f"[{last}]scale={W}:{H},format=gbrp[fb];[fl]format=gbrp[fc];[fb][fc]{bl}[fused]")
        last = "fused"
    post = [f"scale={W}:{H}"]
    if seg.get("spin"):  # turn the picture, degrees per second (corners go black: a spinning card)
        z = seg.get("spin_zoom", 1.3)
        post.append(f"scale={int(W * z) // 2 * 2}:-2,rotate=a='t*{seg['spin']}*PI/180':ow={W}:oh={H}:c=black")
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
    for j, st in enumerate(seg.get("stretch", [])):
        # Pixel stretch: one line of the picture is pulled out across part of the screen, like smeared paint.
        # dir 'down' takes the row at y (fractions of the frame, moving from y[0] to y[1] over the shot) and drags it
        # to the bottom inside the columns x; 'right' takes the column at x and drags it right inside the rows y.
        a0, a1 = st.get("t", [0, dur])
        u = f"min(max((t-{a0})/{max(a1 - a0, 0.01)},0),1)"
        if st.get("dir", "down") == "down":
            y0, y1 = st["y"] if isinstance(st["y"], list) else [st["y"], st["y"]]
            x0, x1 = st.get("x", [0, 1])
            wpx = int(W * (x1 - x0)) // 2 * 2
            pos = f"{H}*({y0}+({y1 - y0})*{u})"
            g.append(f"[graded]split[g{j}a][g{j}b];[g{j}b]crop={wpx}:2:{int(W * x0)}:'{pos}',scale={wpx}:{H}[g{j}s];"
                     f"[g{j}a][g{j}s]overlay={int(W * x0)}:'{pos}':eval=frame:enable='between(t,{a0},{a1})'[graded]")
        else:
            x0, x1 = st["x"] if isinstance(st["x"], list) else [st["x"], st["x"]]
            y0, y1 = st.get("y", [0, 1])
            hpx = int(H * (y1 - y0)) // 2 * 2
            pos = f"{W}*({x0}+({x1 - x0})*{u})"
            g.append(f"[graded]split[g{j}a][g{j}b];[g{j}b]crop=2:{hpx}:'{pos}':{int(H * y0)},scale={W}:{hpx}[g{j}s];"
                     f"[g{j}a][g{j}s]overlay='{pos}':{int(H * y0)}:eval=frame:enable='between(t,{a0},{a1})'[graded]")
    tail = []
    if seg.get("rgb"):  # tear the colour channels apart: electric
        tail.append(f"rgbashift=rh=-{seg['rgb']}:bh={seg['rgb']}:edge=smear")
    if seg.get("fade_out"):
        tail.append(f"fade=t=out:st={dur - seg['fade_out']:.3f}:d={seg['fade_out']}")
    if seg.get("fade_in"):
        tail.append(f"fade=t=in:d={seg['fade_in']}")
    # every segment exactly `dur` long, whatever its source: a short one would pull the film off the music
    tail.append(f"tpad=stop_mode=clone:stop_duration={dur:.3f},trim=duration={dur:.3f}")
    g.append("[graded]" + ",".join(tail + ["format=yuv420p"]) + "[v]")
    subprocess.run([F, "-loglevel", "error", "-y", *ins, "-filter_complex", ";".join(g), "-map", "[v]",
                    "-t", f"{dur:.3f}", "-r", str(FPS), "-c:v", "libx264", "-crf", "14", "-pix_fmt", "yuv420p", path],
                   check=True)


def bounce(cut, d):
    """The picture bounces to the music itself, not a metronome: every onset in the track zooms it in and drops it a
    little, decaying fast; loud passages bounce harder than quiet ones, and the strongest hits shake it. Written as
    per-frame scale-and-crop commands for ffmpeg's sendcmd (the output
    size never changes; a crop that changed size per frame crashed ffmpeg)."""
    import numpy as np
    bo = cut["bounce"]
    sr = 11025
    raw = subprocess.run([F, "-loglevel", "error", "-i", cut["song"], "-ac", "1", "-ar", str(sr), "-f", "s16le", "-"],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.int16).astype(float) / 32768
    parts_ = cut.get("song_parts", [[0, cut["music_end"]]])
    x = np.concatenate([x[int(a * sr):int(b * sr)] for a, b in parts_])
    hop = 256
    fr = np.array([np.sum(x[i:i + 512] ** 2) for i in range(0, len(x) - 512, hop)]) + 1e-9
    on = np.maximum(0, np.diff(np.log(fr), prepend=np.log(fr[0])))
    on /= np.percentile(on, 99.5)
    fps_a = sr / hop
    n = int(cut["music_end"] * FPS)
    rms = np.array([np.sqrt(np.mean(x[int(i / FPS * sr):int(i / FPS * sr) + sr] ** 2)) for i in range(n)])
    loud = np.clip((20 * np.log10(rms + 1e-6) + 25) / 14, 0, 1)
    decay = np.exp(-1 / (FPS * bo.get("decay", 0.12)))
    env, e, shake = np.zeros(n), 0.0, np.zeros((n, 2))
    rng = np.random.default_rng(7)
    sx = sy = 0.0
    for i in range(n):
        a, b = int(i / FPS * fps_a), int((i + 1) / FPS * fps_a) + 1
        hit = min(1.0, on[a:b].max()) if b <= len(on) and a < b else 0.0
        e = max(hit if hit > 0.35 else 0.0, e * decay)
        env[i] = e
        if hit > 0.85 and loud[i] > 0.7:
            sx, sy = rng.uniform(-1, 1, 2) * bo.get("shake", 10)
        sx, sy = sx * 0.6, sy * 0.6
        shake[i] = sx, sy
    lines = []
    for i in range(n):
        k = env[i] * (0.3 + 0.7 * loud[i])
        z = 1 + bo.get("zoom", 0.06) * k
        sw, sh = int(W * z) // 2 * 2 + 2, int(H * z) // 2 * 2 + 2  # always a little overscan for the shake
        mx, my = (sw - W) / 2, (sh - H) / 2
        cx = min(max(mx + shake[i][0], 0), sw - W)
        cy = min(max(my - bo.get("drop", 18) * k + shake[i][1], 0), sh - H)
        lines.append(f"{i / FPS:.4f} scale@b w {sw}, scale@b h {sh}, crop@b x {int(cx)}, crop@b y {int(cy)};")
    p = os.path.join(d, "bounce.cmd")
    open(p, "w").write("\n".join(lines) + "\n")
    return p


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
    a, b = cut.get("line_at", [cut["music_end"] + 0.3, end - 0.2])  # or exactly when the line is sung
    ts = lambda x: f"{int(x // 3600)}:{int(x // 60) % 60:02d}:{x % 60:05.2f}"
    open(subs, "w").write(
        "[Script Info]\nScriptType: v4.00+\nPlayResX: 704\nPlayResY: 1280\n\n[V4+ Styles]\n"
        "Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, BorderStyle, Outline, Shadow, "
        "Alignment, MarginL, MarginR, MarginV\nStyle: Default,DejaVu Sans,43,&H00FFFFFF,&H00000000,&H80000000,1,1,3,1,5,60,60,0\n\n"
        f"[Events]\nFormat: Layer, Start, End, Style, Text\nDialogue: 0,{ts(a)},{ts(b)},Default,{{\\i1}}{cut['line']}\n")
    look = (cut["look"] + ",") if cut.get("look") else ""
    move = f"scale=w='{W}*(1+{pulse})':h='{H}*(1+{pulse})':eval=frame,crop={W}:{H}"
    if cut.get("bounce"):
        move = f"sendcmd=f={bounce(cut, d)},scale@b=w={W + 2}:h={H + 2},crop@b=w={W}:h={H}:x=1:y=1"
    neg = f"negate=enable='{flash}'," if cut["flashes"] else ""
    vf = (f"{look}{move},{neg}"
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
