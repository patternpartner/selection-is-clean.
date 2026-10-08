"""Assets for 'Still Playing' (video/still_playing.html): the window from 'Played' made into a live instrument.
For each of the 18 panes: its struck note (the clip's own sound through the tuned resonator, exactly as build_played
makes it, rung out with no note-off so the page can damp it live), that note's loudness curve at 60 Hz (the page lights
the pane by it), and its clip as a small looping video. Plus panes.json: seeds, pitches, clip ids, mean colours.
    python3 video/build_still_playing_assets.py   -> out/still/
"""
import json
import os
import subprocess
import sys
import wave

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

sys.path.insert(0, os.path.dirname(__file__))
import build_played as P  # noqa: E402

OUT = "out/still"
SR = P.SR
FF = P.FF


def note_sample(n, rng):
    cid = P.PANE[n]
    ex, raw = P.excitation(cid, n, 1.0, rng)
    y = fftconvolve(ex, P.body(P.NOTES[n], P.BYID[cid]["lum"], 30.0))
    f0 = 440 * 2 ** ((P.NOTES[n] - 69) / 12)
    y = sosfilt(butter(4, 0.7 * f0, "hp", fs=SR, output="sos"), y)
    y /= np.sqrt((y[: int(0.4 * SR)] ** 2).mean()) + 1e-9
    tex = sosfilt(butter(4, [350, 6000], "bp", fs=SR, output="sos"), raw) * 0.32
    tex *= np.exp(-np.arange(len(tex)) / (0.22 * SR))
    y[: len(tex)] += tex
    # trim where it has rung down 60 dB, with a taper
    e = np.sqrt(np.convolve(y * y, np.ones(480) / 480, "same"))
    end = int(np.nonzero(e > e.max() * 1e-3)[0][-1]) + SR // 10
    y = y[:end] * np.clip((end - np.arange(end)) / (0.1 * SR), 0, 1)
    return y.astype(np.float32)


def main():
    os.makedirs(f"{OUT}/notes", exist_ok=True)
    os.makedirs(f"{OUT}/clips", exist_ok=True)
    rng = np.random.default_rng(5)
    samples = {n: note_sample(n, rng) for n in P.ORDER}
    peak = max(np.abs(s).max() for s in samples.values())
    panes = []
    for k, n in enumerate(P.ORDER):
        y = samples[n] / peak * 0.95
        tmp = f"{OUT}/notes/{n}.wav"
        with wave.open(tmp, "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes((y * 32767).astype(np.int16).tobytes())
        subprocess.run([FF, "-loglevel", "error", "-y", "-i", tmp, "-c:a", "libmp3lame", "-b:a", "112k", f"{OUT}/notes/{n}.mp3"],
                       check=True)
        os.remove(tmp)
        hop = SR // 60
        env = np.sqrt(np.convolve(y * y, np.ones(hop) / hop, "same")[::hop])
        e = P.BYID[P.PANE[n]]
        fr = np.load(f"out/archive/made/c_{e['i']}.npy")
        mean = fr.reshape(-1, 3).mean(0)
        for ext, args in (("mp4", ["-c:v", "libx264", "-crf", "30", "-preset", "slow", "-pix_fmt", "yuv420p",
                                   "-movflags", "+faststart"]),
                          ("webm", ["-c:v", "libvpx-vp9", "-crf", "40", "-b:v", "0", "-row-mt", "1"])):
            h, w_ = fr.shape[1:3]
            s = 240 / max(h, w_)
            vf = f"scale={int(w_ * s) // 2 * 2}:{int(h * s) // 2 * 2}"
            subprocess.run([FF, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{w_}x{h}", "-r", "12",
                            "-i", "-", "-vf", vf, "-an", *args, f"{OUT}/clips/{n}.{ext}"], input=fr.tobytes(), check=True)
        x, y_, wgt = P.SEEDS[n]
        panes.append({"note": n, "midi": P.NOTES[n], "clip": P.PANE[n], "what": e["what"][:80], "x": x / P.W, "y": y_ / P.H,
                      "w": wgt / P.W, "mean": [int(v) for v in mean], "env": [round(float(v), 4) for v in env]})
        print(n, len(samples[n]) / SR, flush=True)
    json.dump({"sr": SR, "envHz": 60, "panes": panes}, open(f"{OUT}/panes.json", "w"))
    print(subprocess.run(["du", "-sh", OUT], capture_output=True, text=True).stdout)


if __name__ == "__main__":
    main()
