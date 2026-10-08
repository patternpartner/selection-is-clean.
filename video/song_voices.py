"""Notes for the window's panes, read off a song: on every beat, the strongest pitch class in the music (a chroma of
that beat) picks the pane note nearest it in D minor; the bass panes take the downbeats; loudness sets the strength.
So glass lit 'to the song' glows in the song's own harmony. -> a voices json like build_kept's.
    python3 video/song_voices.py SONG.mp3 BPM PHASE OUT.json"""
import json, subprocess, sys
import numpy as np
sys.path.insert(0, __import__('os').path.dirname(__file__))
import build_kept as K

song, bpm, phase, out = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), sys.argv[4]
SR = 22050
raw = subprocess.run([K.FF, "-loglevel", "error", "-i", song, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True).stdout
x = np.frombuffer(raw, np.float32)
beat = 60 / bpm
PC = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "Bb": 10}
mel = [p for p in K.PANES if p["midi"] >= 60]                             # D4..D6: hips to head
bass = {"D2": 2, "Bb1": 10, "F2": 5, "C2": 0}
N = 4096
win = np.hanning(N)
fr = np.fft.rfftfreq(N, 1 / SR)
ok = (fr > 80) & (fr < 2000)
pcs = np.round(12 * np.log2(fr[ok] / 440) + 9) % 12
rms_all = []
voices = []
t = phase
k = 0
while t < len(x) / SR - .2:
    a = int(t * SR)
    seg = x[a:a + N]
    if len(seg) < N:
        break
    sp = np.abs(np.fft.rfft(seg * win))[ok] ** 2
    chroma = np.array([sp[pcs == c].sum() for c in range(12)])
    rms = float(np.sqrt((seg ** 2).mean()))
    rms_all.append(rms)
    top = int(np.argmax(chroma))
    # the octave from the song's own strongest frequency, so a high note lights his head and a low one his hips
    f0 = fr[ok][int(np.argmax(sp))]
    m0 = 69 + 12 * np.log2(f0 / 440)
    while m0 < 62: m0 += 12
    while m0 > 86: m0 -= 12
    cand = [p for p in mel if min((p["midi"] - top) % 12, (top - p["midi"]) % 12) <= 1] or mel
    best = min(cand, key=lambda p: abs(p["midi"] - m0))
    voices.append({"n": best["note"], "when": round(t, 4), "off": round(t + beat * .9, 4), "rms": rms})
    if k % 4 == 0:
        bn = min(bass, key=lambda n: min((bass[n] - top) % 12, (top - bass[n]) % 12))
        voices.append({"n": bn, "when": round(t, 4), "off": round(t + beat * 3.6, 4), "rms": rms})
    t += beat
    k += 1
ref = np.percentile(rms_all, 90)
for v in voices:
    v["amp"] = round(min(1.4, .35 + v.pop("rms") / ref), 3)
json.dump(voices, open(out, "w"))
print(len(voices), "voices over", round(t, 1), "s;", "notes used:", sorted({v["n"] for v in voices}))
