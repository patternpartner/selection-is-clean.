"""AI video maker, run on Modal GPUs. Not part of the artwork.

Turns one text prompt into a phone-shaped (portrait) video by generating several
5-second clips with Wan 2.2 (TI2V-5B, open weights) and joining them.

    modal run video/make_video.py --prompt "a fox running through snowy woods at sunset"
    modal run video/make_video.py --prompt "..." --seconds 20 --out fox.mp4 --landscape

Needs MODAL_TOKEN_ID and MODAL_TOKEN_SECRET in the environment.
"""
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


def _ffmpeg():
    try:
        import imageio_ffmpeg

        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        return "ffmpeg"


@app.local_entrypoint()
def main(prompt: str, seconds: int = 20, out: str = "video.mp4", seed: int = 0, landscape: bool = False):
    width, height = (1280, 704) if landscape else (704, 1280)
    n = math.ceil(seconds / CLIP_SECONDS)
    print(f"making {n} clips of ~{CLIP_SECONDS:.0f}s in parallel for a {seconds}s video...")

    clips = list(Wan().clip.starmap([(prompt, seed + i, width, height) for i in range(n)]))

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
