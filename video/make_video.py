"""AI video maker, run on Modal GPUs. Not part of the artwork.

Turns one text prompt into a phone-shaped (portrait) video by generating several
5-second clips with Wan 2.2 (TI2V-5B, open weights) and joining them.

    modal run video/make_video.py::main --prompt "a fox running through snowy woods at sunset"
    modal run video/make_video.py::main --prompt "..." --seconds 20 --out fox.mp4 --landscape
    modal run video/make_video.py::main --prompt "scene one | scene two | scene three | scene four"

Separate scenes with " | " to give each clip its own prompt (a short story);
the last scene repeats if there are more clips than scenes.

A story adds a narrator (Kokoro), music (MusicGen) and burned-in subtitles:

    modal run video/make_video.py::story --file video/stories/alignment.json --out story.mp4

Needs MODAL_TOKEN_ID and MODAL_TOKEN_SECRET in the environment.
"""
import json
import math
import os
import subprocess
import tempfile

import modal

MODEL_ID = "Wan-AI/Wan2.2-TI2V-5B-Diffusers"
FPS = 24
CLIP_FRAMES = 121  # ~5 s at 24 fps; Wan wants 4k+1 frames
CLIP_SECONDS = (CLIP_FRAMES - 1) / FPS

NEGATIVE = (
    "blurry, low quality, distorted, deformed, watermark, text, subtitles, "
    "static, frozen frame, overexposed, jpeg artifacts, extra limbs"
)

image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg")
    .pip_install(
        "torch==2.6.0",
        "diffusers>=0.35.0",
        "transformers>=4.49.0",
        "accelerate",
        "sentencepiece",
        "ftfy",
        "imageio",
        "imageio-ffmpeg",
    )
    .env({"HF_HOME": "/cache/hf"})
)

# Model weights (~20 GB) are downloaded once and kept here between runs.
cache = modal.Volume.from_name("ai-video-cache", create_if_missing=True)
app = modal.App("ai-video")


@app.cls(gpu="H100", image=image, volumes={"/cache": cache}, timeout=1800, scaledown_window=60)
class Wan:
    @modal.enter()
    def load(self):
        import torch
        from diffusers import AutoencoderKLWan, WanPipeline

        vae = AutoencoderKLWan.from_pretrained(MODEL_ID, subfolder="vae", torch_dtype=torch.float32)
        self.pipe = WanPipeline.from_pretrained(MODEL_ID, vae=vae, torch_dtype=torch.bfloat16).to("cuda")
        cache.commit()

    @modal.method()
    def clip(self, prompt: str, seed: int, width: int, height: int) -> bytes:
        import torch
        from diffusers.utils import export_to_video

        frames = self.pipe(
            prompt=prompt,
            negative_prompt=NEGATIVE,
            height=height,
            width=width,
            num_frames=CLIP_FRAMES,
            guidance_scale=5.0,
            num_inference_steps=50,
            generator=torch.Generator("cuda").manual_seed(seed),
        ).frames[0]
        with tempfile.NamedTemporaryFile(suffix=".mp4") as f:
            export_to_video(frames, f.name, fps=FPS)
            return open(f.name, "rb").read()


MODEL_14B = "Wan-AI/Wan2.2-T2V-A14B-Diffusers"
FRAMES_14B, FPS_14B = 81, 16  # the 14B model's native 5 s


@app.cls(gpu="H200", image=image, volumes={"/cache": cache}, timeout=3600, scaledown_window=60)
class Wan14:
    """The bigger Wan 2.2 (two 14B experts): better detail and motion, several times slower. For hero shots."""

    @modal.enter()
    def load(self):
        import torch
        from diffusers import AutoencoderKLWan, WanPipeline

        vae = AutoencoderKLWan.from_pretrained(MODEL_14B, subfolder="vae", torch_dtype=torch.float32)
        self.pipe = WanPipeline.from_pretrained(MODEL_14B, vae=vae, torch_dtype=torch.bfloat16).to("cuda")
        cache.commit()

    @modal.method()
    def clip(self, prompt: str, seed: int, width: int, height: int) -> bytes:
        import torch
        from diffusers.utils import export_to_video

        frames = self.pipe(
            prompt=prompt,
            negative_prompt=NEGATIVE,
            height=height,
            width=width,
            num_frames=FRAMES_14B,
            guidance_scale=4.0,
            guidance_scale_2=3.0,
            num_inference_steps=40,
            generator=torch.Generator("cuda").manual_seed(seed),
        ).frames[0]
        with tempfile.NamedTemporaryFile(suffix=".mp4") as f:
            export_to_video(frames, f.name, fps=FPS_14B)
            return open(f.name, "rb").read()


def _ffmpeg():
    try:
        import imageio_ffmpeg

        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        return "ffmpeg"


voice_image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("espeak-ng")
    .pip_install("torch==2.6.0", "kokoro>=0.9.4", "soundfile", "numpy")
    .run_commands("python -m spacy download en_core_web_sm")
    .env({"HF_HOME": "/cache/hf"})
)
music_image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install("torch==2.6.0", "transformers>=4.49.0", "accelerate", "scipy", "numpy")
    .env({"HF_HOME": "/cache/hf"})
)
mix_image = modal.Image.debian_slim(python_version="3.11").apt_install("ffmpeg", "fonts-dejavu-core")


@app.function(image=voice_image, volumes={"/cache": cache}, cpu=4, timeout=900)
def narrate(lines: list) -> list:
    """One WAV (24 kHz) per (text, voice, speed). Kokoro-82M, open weights; 'b*' voices are British."""
    import io

    import numpy as np
    import soundfile as sf
    from kokoro import KPipeline

    pipes, out = {}, []
    for text, voice, speed in lines:
        pipe = pipes.setdefault(voice[0], KPipeline(lang_code=voice[0], repo_id="hexgrad/Kokoro-82M"))
        parts = [a.numpy() if hasattr(a, "numpy") else a for _, _, a in pipe(text, voice=voice, speed=speed)]
        buf = io.BytesIO()
        sf.write(buf, np.concatenate(parts), 24000, format="WAV")
        out.append(buf.getvalue())
    cache.commit()
    return out


@app.function(image=music_image, gpu="A10G", volumes={"/cache": cache}, timeout=1200)
def score(prompt: str, seconds: float, seed: int) -> bytes:
    """Background music from MusicGen (weights are CC-BY-NC: fine for personal use)."""
    import io

    import scipy.io.wavfile
    import torch
    from transformers import AutoProcessor, MusicgenForConditionalGeneration

    name = "facebook/musicgen-medium"
    proc = AutoProcessor.from_pretrained(name)
    model = MusicgenForConditionalGeneration.from_pretrained(name).to("cuda")
    cache.commit()
    torch.manual_seed(seed)
    inputs = proc(text=[prompt], padding=True, return_tensors="pt").to("cuda")
    audio = model.generate(**inputs, max_new_tokens=int(seconds * 50) + 25, do_sample=True, guidance_scale=3.0)
    buf = io.BytesIO()
    scipy.io.wavfile.write(buf, model.config.audio_encoder.sampling_rate, audio[0, 0].float().cpu().numpy())
    return buf.getvalue()


def _ass_time(t: float) -> str:
    cs = int(round(t * 100))
    return f"{cs // 360000}:{cs // 6000 % 60:02d}:{cs // 100 % 60:02d}.{cs % 100:02d}"


@app.function(image=mix_image, cpu=4, timeout=900)
def mix(clips: list, voices: list, music, lines: list, width: int, height: int, tail: float = 0.0,
        grade: bool = False) -> bytes:
    """Join the clips, lay each narration line over its scene, duck the music under it, burn subtitles.

    `lines` holds one dict per scene: say, lead (seconds after the cut), whisper, fade (seconds into the
    scene at which the picture fades to black). A scene with no line has None in `voices`. `music` may
    be None (a voice-only track, for scoring in an editor). `tail` adds that many seconds of black."""
    d = tempfile.mkdtemp()

    def put(name, data):
        path = os.path.join(d, name)
        open(path, "wb").write(data)
        return path

    def dur(path):
        r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                           capture_output=True, text=True, check=True)
        return float(r.stdout.strip())

    clip_paths = [put(f"clip{i}.mp4", c) for i, c in enumerate(clips)]
    starts, t = [], 0.0
    for p in clip_paths:
        starts.append(t)
        t += dur(p)
    total = t + tail
    # Each line starts just after its cut; a line too long for its scene is sped up slightly.
    audio_in, filters, events, fades, n = [], [], [], [], 0
    for i, v in enumerate(voices):
        if lines[i].get("fade") is not None:
            fades.append(f"fade=t=out:st={starts[i] + lines[i]['fade']:.2f}:d=0.6")
        if v is None:
            if lines[i]["say"]:  # silent film: the line is only written, and stays until the next scene
                lead = lines[i].get("lead", 0.35)
                end = starts[i + 1] if i + 1 < len(starts) else total
                events.append((starts[i] + lead, end, ("{\\an5\\i1}" if lines[i].get("whisper") else "") + lines[i]["say"]))
            continue
        vp = put(f"voice{i}.wav", v)
        length = dur(vp)
        lead = lines[i].get("lead", 0.35)  # the line starts just after the cut
        room = CLIP_SECONDS + (tail if i == len(voices) - 1 else 0) - lead - 0.25
        tempo = min(max(length / room, 1.0), 1.3)
        audio_in += ["-i", vp]
        delay = int((starts[i] + lead) * 1000)
        # A hushed, breathy take: thin out the body, lift the air, drop the level, add a little room.
        hush = "highpass=f=220,treble=g=5:f=4000,volume=0.5,aecho=0.8:0.7:45|80:0.18|0.1," if lines[i].get("whisper") else ""
        filters.append(f"[{n + 2}:a]{hush}atempo={tempo:.3f},adelay={delay}|{delay},aresample=48000[v{n}]")
        # A whispered line sits in the middle of the frame (it is usually over black), in italics.
        text = ("{\\an5\\i1}" if lines[i].get("whisper") else "") + lines[i]["say"]
        events.append((starts[i] + lead, starts[i] + lead + length / tempo + 0.4, text))
        n += 1

    if n:
        filters.append("".join(f"[v{i}]" for i in range(n)) + f"amix=inputs={n}:normalize=0,apad[vo]")
    else:
        filters.append("anullsrc=r=48000:cl=mono[vo]")
    if music is None and not n:
        filters.append("[vo]anull[aout]")  # a silent track, for the user's own music
    elif music is None:
        filters.append("[vo]loudnorm=I=-16:TP=-1.5,aresample=48000[aout]")
    else:
        filters.append("[vo]asplit[vo1][vo2]")
        filters.append(f"[1:a]aresample=48000,volume=0.5,afade=t=in:d=1,afade=t=out:st={total - 2.5:.2f}:d=2.5,apad[mu]")
        filters.append("[mu][vo2]sidechaincompress=threshold=0.03:ratio=6:attack=30:release=500[duck]")
        filters.append("[duck][vo1]amix=inputs=2:normalize=0,loudnorm=I=-16:TP=-1.5,aresample=48000[aout]")
    music_in = ["-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono"] if music is None else ["-i", put("music.wav", music)]

    subs = os.path.join(d, "subs.ass")
    open(subs, "w").write(
        "[Script Info]\nScriptType: v4.00+\nWrapStyle: 0\n"
        f"PlayResX: {width}\nPlayResY: {height}\n\n"
        "[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, "
        "BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV\n"
        f"Style: Default,DejaVu Sans,{int(height * 0.034)},&H00FFFFFF,&H00000000,&H80000000,1,1,3,1,2,60,60,"
        f"{int(height * 0.13)}\n\n"
        "[Events]\nFormat: Layer, Start, End, Style, Text\n"
        + "".join(f"Dialogue: 0,{_ass_time(a)},{_ass_time(b)},Default,{text}\n" for a, b, text in events)
    )

    # The concat filter, not a stream copy: stacked scenes are encoded differently from Wan's own clips.
    joined = os.path.join(d, "joined.mp4")
    n_clips = len(clip_paths)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *[a for p in clip_paths for a in ("-i", p)],
                    "-filter_complex", "".join(f"[{i}:v]setsar=1,fps={FPS}[c{i}];" for i in range(n_clips))
                    + "".join(f"[c{i}]" for i in range(n_clips)) + f"concat=n={n_clips}:v=1:a=0[v]",
                    "-map", "[v]", "-c:v", "libx264", "-crf", "12", "-pix_fmt", "yuv420p", joined], check=True)
    out = os.path.join(d, "out.mp4")
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", joined, *music_in, *audio_in,
         "-filter_complex", ";".join(filters) + f";[0:v]tpad=stop_mode=add:stop_duration={tail}:color=black,"
         + "".join(f + "," for f in fades)
         # One grade and a light moving grain over everything, so clips from different models read as one film.
         + ("eq=contrast=1.06:saturation=1.08:gamma=0.97,noise=alls=7:allf=t," if grade else "")
         + f"subtitles={subs},fade=t=in:d=0.6,fade=t=out:st={total - 0.8:.2f}:d=0.8[vout]",
         "-map", "[vout]", "-map", "[aout]", "-t", f"{total:.3f}",
         "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "19", "-c:a", "aac", "-ac", "2", "-b:a", "192k",
         "-movflags", "+faststart", out],
        check=True,
    )
    return open(out, "rb").read()


@app.function(image=mix_image, cpu=4, timeout=600)
def stack(top: bytes, bottom: bytes, width: int, height: int) -> bytes:
    """Two landscape clips cropped and stacked into one portrait frame, with a thin black seam."""
    d = tempfile.mkdtemp()
    a, b, out = (os.path.join(d, n) for n in ("a.mp4", "b.mp4", "out.mp4"))
    open(a, "wb").write(top)
    open(b, "wb").write(bottom)
    half, seam = height // 2, 4
    fit = f"crop='min(iw,ih*{width}/{half})':ih,scale={width}:{half - seam // 2},setsar=1"
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", a, "-i", b, "-filter_complex",
         f"[0:v]{fit},pad={width}:{half}:0:0:black[t];[1:v]{fit},pad={width}:{half}:0:{seam // 2}:black[u];"
         "[t][u]vstack[v]", "-map", "[v]", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "16", out],
        check=True,
    )
    return open(out, "rb").read()


def glitch_graph(bursts: list, swap_at=None, flicker: float = 0.6, region=None) -> str:
    """A filtergraph from [0:v] to [v]: digital glitches (colour split, torn bands, static, flash) during each
    (start, seconds) burst. With swap_at, [1:v] replaces [0:v] from then on, stuttering in over `flicker` s.
    With region [x, y, w, h] (fractions of the frame), only that rectangle glitches - a mirror, a screen."""
    if swap_at is not None:
        bursts = list(bursts) + [(swap_at - flicker, flicker + 0.25)]
    on = "+".join(f"between(t,{a:.3f},{a + d:.3f})" for a, d in bursts) or "0"
    g, base = [], "[0:v]"
    if swap_at is not None:
        g.append(f"[0:v][1:v]overlay=enable='gte(t,{swap_at:.3f})+between(t,{swap_at - flicker:.3f},{swap_at:.3f})"
                 f"*lt(mod(n,5),2)'[sw]")
        base = "[sw]"
    if region is not None:
        x, y, w, h = region
        g.append(f"{base}split[full][r]")
        g.append(f"[r]crop=trunc(iw*{w}/2)*2:trunc(ih*{h}/2)*2:trunc(iw*{x}):trunc(ih*{y})[rc]")
        base = "[rc]"
    g.append(f"{base}split=3[m][s1][s2]")
    g.append("[s1]crop=iw:ih/9:0:ih*0.38[b1]")
    g.append("[s2]crop=iw:ih/14:0:ih*0.62[b2]")
    g.append(f"[m][b1]overlay=x='28*sin(n*2.3)+18':y=H*0.38:enable='{on}'[t1]")
    g.append(f"[t1][b2]overlay=x='-36*cos(n*1.7)':y=H*0.62:enable='{on}'[t2]")
    out = "[gv]" if region is not None else "[v]"
    g.append(f"[t2]rgbashift=rh=-14:bh=14:gv=4:enable='{on}',noise=alls=40:allf=t+u:enable='{on}',"
             f"eq=brightness=0.05:contrast=1.3:enable='{on}'{out}")
    if region is not None:
        g.append(f"[full][gv]overlay=x=trunc(W*{region[0]}):y=trunc(H*{region[1]})[v]")
    return ";".join(g)


@app.function(image=mix_image, cpu=4, timeout=600)
def glitch(clip: bytes, bursts: list, reveal=None, swap_at=None, region=None) -> bytes:
    """Glitch a clip in bursts; with `reveal`, a second matching shot that glitches in at swap_at and stays."""
    d = tempfile.mkdtemp()
    a, b, out = (os.path.join(d, n) for n in ("a.mp4", "b.mp4", "out.mp4"))
    open(a, "wb").write(clip)
    ins = ["-i", a]
    if reveal is not None:
        open(b, "wb").write(reveal)
        ins += ["-i", b]
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *ins, "-filter_complex",
                    glitch_graph(bursts, swap_at if reveal is not None else None, region=region), "-map", "[v]", "-an",
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "14", out], check=True)
    return open(out, "rb").read()


@app.function(image=mix_image, cpu=4, timeout=600)
def reverse(clip: bytes, backwards: bool = True, trim: float = 0.0) -> bytes:
    """Rescue a shot Wan got partly wrong: play it backwards (a mask put on, not off) and/or cut `trim`
    seconds from its start (a reveal given away in the opening frames)."""
    d = tempfile.mkdtemp()
    a, out = os.path.join(d, "a.mp4"), os.path.join(d, "out.mp4")
    open(a, "wb").write(clip)
    vf = ",".join((["reverse"] if backwards else []) + ([f"trim=start={trim},setpts=PTS-STARTPTS"] if trim else []))
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", a, "-vf", vf, "-an",
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "14", out], check=True)
    return open(out, "rb").read()


@app.local_entrypoint()
def story(file: str, out: str = "story.mp4", seed: int = 0, landscape: bool = False):
    """One clip per scene, each with a narration line; the character is written into every prompt."""
    import hashlib

    spec = json.load(open(file))
    width, height = (1280, 704) if landscape else (704, 1280)
    scenes = spec["scenes"]
    lines = [{"say": sc.get("say", ""), "lead": sc.get("lead", 0.35), "whisper": sc.get("whisper", False),
              "fade": sc.get("fade")} for sc in scenes]
    # "voice": null makes a silent film: each "say" is written on screen but never spoken.
    silent = "voice" in spec and not spec["voice"]
    spoken = [] if silent else [i for i, sc in enumerate(scenes) if sc.get("say")]
    speech = [(scenes[i]["say"], scenes[i].get("voice", spec.get("voice", "bf_emma")),
               scenes[i].get("speed", spec.get("speed", 1.0))) for i in spoken]

    def fill(text):  # every {name} in a prompt is replaced by that entry of the storyboard's "cast"
        for name, desc in {"character": spec.get("character", ""), **spec.get("cast", {})}.items():
            text = text.replace("{" + name + "}", desc)
        return text

    # A scene is one portrait clip ("prompt"), or two landscape clips stacked ("top" and "bottom").
    print(f"'{spec.get('title', file)}': {len(scenes)} scenes, ~{len(scenes) * CLIP_SECONDS:.0f}s")

    voices = narrate.spawn(speech) if speech else None
    music = None
    if spec.get("music"):  # leave it out for a voice-only track to score in an editor
        music = score.spawn(spec["music"], len(scenes) * CLIP_SECONDS + 1, seed)

    # Clips are kept by what made them, so editing one scene does not regenerate the others.
    store = os.path.join(os.path.dirname(os.path.abspath(out)), "clips")
    os.makedirs(store, exist_ok=True)
    jobs, parts, models = [], [], []  # parts[i]: indices into jobs making up scene i; models: one per job
    for i, sc in enumerate(scenes):
        n0 = len(jobs)
        if "prompt" in sc:
            parts.append([len(jobs)])
            jobs.append((fill(sc["prompt"]), seed + i, width, height))
            if "reveal" in sc:  # a matching second shot that glitches in at swap_at; same seed, for a close framing
                parts[-1].append(len(jobs))
                jobs.append((fill(sc["reveal"]), seed + i, width, height))
        else:
            parts.append([len(jobs), len(jobs) + 1])
            jobs.append((fill(sc["top"]), seed + i, height, width))
            jobs.append((fill(sc["bottom"]), seed + 100 + i, height, width))
        models += [sc.get("model", "5b")] * (len(jobs) - n0)  # "14b" for hero shots
    ids = {"5b": (MODEL_ID, CLIP_FRAMES), "14b": (MODEL_14B, FRAMES_14B)}
    paths = [os.path.join(store, hashlib.sha1(repr(ids[m] + j).encode()).hexdigest()[:16] + ".mp4")
             for m, j in zip(models, jobs)]
    todo = [i for i, p in enumerate(paths) if not os.path.exists(p)]
    print(f"generating {len(todo)} of {len(jobs)} clips ({len(jobs) - len(todo)} reused)")
    # Both models run at once; each clip is saved as soon as its batch returns.
    small = [i for i in todo if models[i] == "5b"]
    big = [i for i in todo if models[i] == "14b"]
    big_calls = [Wan14().clip.spawn(*jobs[i]) for i in big]
    for i, data in zip(small, Wan().clip.starmap([jobs[i] for i in small])):
        open(paths[i], "wb").write(data)
    for i, call in zip(big, big_calls):
        open(paths[i], "wb").write(call.get())
    raw = [open(p, "rb").read() for p in paths]
    clips = [raw[ps[0]] if len(ps) == 1 or "reveal" in sc else stack.remote(raw[ps[0]], raw[ps[1]], width, height)
             for ps, sc in zip(parts, scenes)]
    clips = [glitch.remote(c, sc.get("glitch", []), raw[ps[1]] if "reveal" in sc else None, sc.get("swap_at"),
                           sc.get("glitch_region"))
             if sc.get("glitch") or "reveal" in sc else c for c, ps, sc in zip(clips, parts, scenes)]
    clips = [reverse.remote(c, bool(sc.get("reverse")), sc.get("trim", 0.0)) if sc.get("reverse") or sc.get("trim")
             else c for c, sc in zip(clips, scenes)]
    said = voices.get() if voices else []
    per_scene = [said[spoken.index(i)] if i in spoken else None for i in range(len(scenes))]
    data = mix.remote(clips, per_scene, music.get() if music else None, lines, width, height, spec.get("tail", 0.0),
                      spec.get("grade", False))
    open(out, "wb").write(data)
    print(f"saved {out}")


@app.local_entrypoint()
def main(prompt: str, seconds: int = 20, out: str = "video.mp4", seed: int = 0, landscape: bool = False):
    width, height = (1280, 704) if landscape else (704, 1280)
    n = math.ceil(seconds / CLIP_SECONDS)
    print(f"making {n} clips of ~{CLIP_SECONDS:.0f}s in parallel for a {seconds}s video...")

    scenes = [s.strip() for s in prompt.split("|") if s.strip()]
    jobs = [(scenes[min(i, len(scenes) - 1)], seed + i, width, height) for i in range(n)]
    clips = list(Wan().clip.starmap(jobs))

    with tempfile.TemporaryDirectory() as d:
        names = []
        for i, data in enumerate(clips):
            p = os.path.join(d, f"clip{i}.mp4")
            open(p, "wb").write(data)
            names.append(p)
        listing = os.path.join(d, "list.txt")
        open(listing, "w").write("".join(f"file '{p}'\n" for p in names))
        # Re-encode so the result plays everywhere, including iPhone.
        subprocess.run(
            [_ffmpeg(), "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", listing,
             "-t", str(seconds), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20",
             "-movflags", "+faststart", out],
            check=True,
        )
    print(f"saved {out}")
