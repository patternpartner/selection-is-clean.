"""Scan the user's songs into a catalogue, locally and free: length, tempo, beat phase, loud/quiet sections and the
sung words with timestamps (faster-whisper 'small' on CPU).   python3 video/song_scan.py out/songs/*.mp3

Writes out/songs/<name>.json per song and video/songs.json (all of them). Whisper invents words in silences and
instrumentals; trust words inside loud sections, and treat a song with a handful of words as instrumental.
"""
import json
import os
import subprocess
import sys

import imageio_ffmpeg
import numpy as np

F = imageio_ffmpeg.get_ffmpeg_exe()
SR = 11025


def audio(path):
    raw = subprocess.run([F, "-loglevel", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.int16).astype(float) / 32768


def tempo(x):
    hop = 256
    fr = np.array([np.sum(x[i:i + 512] ** 2) for i in range(0, len(x) - 512, hop)]) + 1e-9
    on = np.maximum(0, np.diff(np.log(fr)))
    on -= on.mean()
    fps = SR / hop
    seg = on[int(0.2 * len(on)):int(0.8 * len(on))]
    ac = np.correlate(seg, seg, "full")[len(seg) - 1:]
    lags = np.arange(int(fps * 60 / 180), int(fps * 60 / 70))
    lag = lags[np.argmax(ac[lags])]
    best = (0, 0, 0)
    for bpm in np.arange(60 * fps / (lag + 1), 60 * fps / (lag - 1), 0.05):
        b = 60 / bpm
        for ph in np.arange(0, b, 0.01):
            t = np.arange(ph, len(x) / SR - 1, b)
            s = on[(t * fps).astype(int)].sum()
            if s > best[0]:
                best = (s, bpm, ph)
    return round(best[1], 2), round(best[2], 3)


def sections(x):
    """Loudness per second and the places it jumps or drops by 4 dB or more (section edges)."""
    db = np.array([20 * np.log10(np.sqrt(np.mean(x[i:i + SR] ** 2)) + 1e-6) for i in range(0, len(x) - SR, SR)])
    sm = np.convolve(db, np.ones(3) / 3, "same")
    edges = [int(i) for i in range(2, len(sm) - 2) if abs(sm[i + 1] - sm[i - 2]) >= 4]
    merged = []
    for e in edges:
        if not merged or e - merged[-1] > 3:
            merged.append(e)
    return [round(float(v), 1) for v in db], merged


def words(path):
    from faster_whisper import WhisperModel
    m = WhisperModel("small", device="cpu", compute_type="int8")
    segs, _ = m.transcribe(path, condition_on_previous_text=False)
    return [[round(s.start, 1), round(s.end, 1), s.text.strip()] for s in segs]


def main(paths):
    cat = {}
    if os.path.exists("video/songs.json"):
        cat = json.load(open("video/songs.json"))
    for p in paths:
        name = os.path.splitext(os.path.basename(p))[0]
        out = os.path.join(os.path.dirname(p), name + ".json")
        if os.path.exists(out):
            cat[name] = json.load(open(out))
            continue
        x = audio(p)
        bpm, phase = tempo(x)
        db, edges = sections(x)
        lyr = words(p)
        rec = {"file": p, "seconds": round(len(x) / SR, 2), "bpm": bpm, "beat_phase": phase, "section_edges": edges,
               "loudness_db": db, "lyrics": lyr, "instrumental": sum(len(l[2].split()) for l in lyr) < 25}
        json.dump(rec, open(out, "w"))
        cat[name] = rec
        print(name, rec["seconds"], "s", bpm, "bpm", len(lyr), "lines", flush=True)
    json.dump(cat, open("video/songs.json", "w"), indent=1)


if __name__ == "__main__":
    main(sys.argv[1:])
