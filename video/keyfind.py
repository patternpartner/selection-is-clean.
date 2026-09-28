"""Estimate a song's key from its chroma (Krumhansl-Schmuckler profiles). Local, rough but usually right.
    python3 video/keyfind.py a.mp3 b.mp3"""
import subprocess
import sys

import imageio_ffmpeg
import numpy as np

NAMES = "C C# D D# E F F# G G# A A# B".split()
MAJ = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
MIN = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])


def chroma(path, sr=22050):
    raw = subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-loglevel", "error", "-i", path, "-ac", "1", "-ar", str(sr),
                          "-f", "s16le", "-"], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.int16).astype(float) / 32768
    n = 8192
    c = np.zeros(12)
    f = np.fft.rfftfreq(n, 1 / sr)
    ok = (f > 60) & (f < 2000)
    pc = (np.round(12 * np.log2(f[ok] / 261.63)) % 12).astype(int)
    for i in range(0, len(x) - n, n // 2):
        m = np.abs(np.fft.rfft(x[i:i + n] * np.hanning(n)))[ok]
        np.add.at(c, pc, m)
    return c / c.sum()


def key(path):
    c = chroma(path)
    best = max(((np.corrcoef(np.roll(p, k), c)[0, 1], NAMES[k] + (" major" if p is MAJ else " minor"), k, p is MAJ)
                for p in (MAJ, MIN) for k in range(12)))
    return best


if __name__ == "__main__":
    for p in sys.argv[1:]:
        r, name, k, major = key(p)
        print(f"{p}: {name} (fit {r:.2f})")
