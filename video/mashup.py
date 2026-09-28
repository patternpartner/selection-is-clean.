"""Build a new track from the user's songs, locally: stems (Demucs) placed bar by bar on one tempo grid.

    python3 -m demucs -n htdemucs -o out/stems song.mp3        # once per song: vocals / drums / bass / other
    python3 video/mashup.py video/stories/the-duet-track.json out/the-duet-track.wav

The plan names each song (its stems, measured tempo, first downbeat, pitch shift in semitones) and a list of items
placed on the output grid (`bar` = output bar, bars of 4 beats at the plan's `bpm`):
  bed    {"song", "from_bar", "bars", "stems": [drums, bass, other]}   the song's own bars, stretched to the grid
  vocal  {"song", "t0", "t1", "anchor_bar"}   a phrase (seconds in the song) placed so that the song's downbeat
         `anchor_bar` lands on the output `bar`: pickups before the downbeat fall into the bar before, as sung
Every item is time-stretched (and pitch-shifted) with rubberband so both songs share one tempo and key.
Writes the WAV plus <out>.lines.json: every sung line with its time in the new track, for cutting the film to it.
"""
import json
import os
import subprocess
import sys

import imageio_ffmpeg
import numpy as np

F = imageio_ffmpeg.get_ffmpeg_exe()
SR = 44100


def render(path, t0, t1, tempo, semis):
    """[t0, t1] of a file, stretched by `tempo` (>1 faster) and shifted by `semis`, as float32 stereo."""
    raw = subprocess.run([F, "-loglevel", "error", "-ss", f"{max(t0, 0):.4f}", "-t", f"{t1 - max(t0, 0):.4f}", "-i", path,
                          "-af", f"rubberband=tempo={tempo:.6f}:pitch={2 ** (semis / 12):.6f}:transients=crisp",
                          "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()


def fade(a, fin, fout):
    n = len(a)
    i, o = min(int(fin * SR), n), min(int(fout * SR), n)
    if i:
        a[:i] *= np.linspace(0, 1, i)[:, None]
    if o:
        a[n - o:] *= np.linspace(1, 0, o)[:, None]
    return a


def main(plan_path, out):
    plan = json.load(open(plan_path))
    bar = 4 * 60 / plan["bpm"]
    songs = plan["songs"]
    total = plan["bars"] * bar + plan.get("tail", 0)
    mix = np.zeros((int(total * SR) + SR, 2), np.float32)
    lines = []
    for it in plan["items"]:
        s = songs[it["song"]]
        sbar = 4 * 60 / s["bpm"]
        tempo = plan["bpm"] / s["bpm"]
        down = lambda k: s["downbeat"] + k * sbar
        gain = it.get("gain", 1.0) * s.get("gain", 1.0)
        if it["kind"] == "bed":
            t0, t1 = down(it["from_bar"]), down(it["from_bar"] + it["bars"])
            parts = [render(os.path.join(s["stems"], st + ".wav"), t0, t1, tempo, s.get("semis", 0))
                     for st in it.get("stems", ["drums", "bass", "other"])]
            a = sum(p[:min(len(q) for q in parts)] for p in parts)
            want = int(it["bars"] * bar * SR)
            a = np.pad(a, ((0, max(0, want - len(a))), (0, 0)))[:want]
            a = fade(a, it.get("fade_in", 0.01), it.get("fade_out", 0.01))
            start = int(it["bar"] * bar * SR)
        else:
            a = render(os.path.join(s["stems"], "vocals.wav"), it["t0"], it["t1"], tempo, s.get("semis", 0))
            a = fade(a, 0.04, it.get("fade_out", 0.12))
            start = int((it["bar"] * bar + (it["t0"] - down(it["anchor_bar"])) / tempo) * SR)
            for a0, a1, text in json.load(open(s["lines"])):
                if a1 > it["t0"] + 0.2 and a0 < it["t1"] - 0.2:
                    at = it["bar"] * bar + (max(a0, it["t0"]) - down(it["anchor_bar"])) / tempo
                    lines.append([round(at, 2), it["song"], text])
        a = a * gain
        mix[start:start + len(a)] += a[:len(mix) - start]
    for fx in plan.get("gaps", []):  # silence everything for a moment (a held breath before a line)
        mix[int(fx[0] * SR):int(fx[1] * SR)] *= 0.0
    peak = np.abs(mix).max()
    mix = mix / peak * 0.89 if peak > 0 else mix
    mix = mix[:int(total * SR)]
    tmp = out + ".f32"
    mix.astype(np.float32).tofile(tmp)
    subprocess.run([F, "-loglevel", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", tmp,
                    "-af", "acompressor=threshold=0.25:ratio=2.5:attack=10:release=200,alimiter=limit=0.95", out],
                   check=True)
    os.remove(tmp)
    json.dump(sorted(lines), open(out + ".lines.json", "w"), indent=1)
    print("saved", out, f"{total:.1f} s,", len(lines), "sung lines")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
