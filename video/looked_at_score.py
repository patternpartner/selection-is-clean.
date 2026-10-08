"""Score for 'Somebody Has to Look First' v2, made from the film's own events (events.json from build_looked_at_film2.js).
python3 video/looked_at_score.py EVENTS.json OUT.wav

Nothing here is a recording. The heart is the stranger's real pulse (the ring on screen): one lub-dub per pulse, as loud as its
energy, so it weakens as it starves and stretches while time slows at the contact. Every birth in its lineage is a glass note.
A quiet triad grows when the visitor looks and is held while it looks. The newcomer arrives on one unresolved note. I cannot hear
it: it is checked by level, peaks, a click scan and a spectrogram (see VIDEO.md), and the user's ears are the judge.
"""
import json, sys
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 44100
d = json.load(open(sys.argv[1]))
ev, total, LOOK = d['events'], d['total'], d['look']
NEW_F = LOOK + 400 + 30
FRAMES = NEW_F + 215
dur = total / 30.0
n = int(SR * (dur + 0.5))
out = np.zeros(n)
t = np.arange(n) / SR


def add(sig, t0, gain=1.0):
    i = int(t0 * SR)
    if i >= n:
        return
    j = min(n, i + len(sig))
    out[i:j] += gain * sig[:j - i]


def env_ad(length, a=0.01, tau=0.3):
    x = np.arange(int(length * SR)) / SR
    return np.minimum(1, x / a) * np.exp(-x / tau)


def sine(f, length):
    x = np.arange(int(length * SR)) / SR
    return np.sin(2 * np.pi * f * x)


# 1. the room: a very low bed, always there (D2 + A2 + a breath of filtered noise), fading in and cutting at the card
rng = np.random.default_rng(7)
bed = 0.5 * np.sin(2 * np.pi * 73.42 * t) + 0.3 * np.sin(2 * np.pi * 110.0 * t + .7)
noise = sosfilt(butter(2, 400, 'low', fs=SR, output='sos'), rng.standard_normal(n)) * 0.6
swell = 0.7 + 0.3 * np.sin(2 * np.pi * t / 9.0)
bed = (bed + noise) * swell * 0.035
cut = FRAMES / 30.0
bed *= np.clip(t / 1.5, 0, 1) * np.clip((cut + 0.4 - t) / 0.4, 0, 1)
out += bed

# 2. the stranger's heart (hero before the newcomer arrives, the newcomer after)
for e in ev:
    if not e['hb'] or e['f'] < 150:
        continue
    t0 = e['f'] / 30.0
    amp = 0.04 + 0.55 * min(1.0, e['e'] / 0.5) ** 0.8
    x = np.arange(int(0.5 * SR)) / SR
    pitch = 40 + 22 * np.exp(-x / 0.05)
    lub = np.sin(2 * np.pi * np.cumsum(pitch) / SR) * np.exp(-x / 0.075) * np.minimum(1, x / 0.006)
    add(lub, t0, amp * 0.5)
    pitch2 = 36 + 18 * np.exp(-x / 0.05)
    dub = np.sin(2 * np.pi * np.cumsum(pitch2) / SR) * np.exp(-x / 0.06) * np.minimum(1, x / 0.006)
    add(dub, t0 + 0.17, amp * 0.3)

# 3. the visitor: a triad that grows on arrival, opens on eye contact, is held while it looks, fades when it leaves
tri = (np.sin(2 * np.pi * 293.66 * t) + 0.8 * np.sin(2 * np.pi * 440.0 * t) + 0.6 * np.sin(2 * np.pi * 369.99 * t)) / 2.4
a0, a1 = (LOOK - 60) / 30.0, (LOOK + 45) / 30.0
hold_end, gone = (LOOK + 400) / 30.0, (LOOK + 510) / 30.0
g = np.interp(t, [a0, a1, a1 + 1.2, hold_end, gone], [0, .25, .75, .75, 0], left=0, right=0)
fifth = (np.sin(2 * np.pi * 293.66 * t) + 0.8 * np.sin(2 * np.pi * 440.0 * t)) / 1.8
g2 = np.interp(t, [a0, a1, hold_end, gone], [0, 1, 1, 0], left=0, right=0)
trem = 0.92 + 0.08 * np.sin(2 * np.pi * 0.35 * t)
out += (fifth * g2 * 0.35 + (tri - fifth * 0.7) * g * 0.35) * trem * 0.06

# 4. births in the lineage: glass notes up a D major pentatonic
notes = [587.33, 659.25, 739.99, 880.0, 987.77, 1174.66]
k = 0
for e in ev:
    for _ in range(e['births']):
        f0 = notes[k % len(notes)]
        k += 1
        x = np.arange(int(1.6 * SR)) / SR
        bell = sum(a * np.sin(2 * np.pi * f0 * m * x) * np.exp(-x / (0.9 / m ** .7)) for m, a in [(1, 1), (2.76, .35), (5.4, .12)])
        add(bell * np.minimum(1, x / 0.004), e['f'] / 30.0, 0.06)

# 5. the newcomer arrives on one note that nothing answers (E4, long, quiet)
x = np.arange(int(4.5 * SR)) / SR
add(np.sin(2 * np.pi * 329.63 * x) * np.minimum(1, x / 0.6) * np.exp(-x / 2.2), NEW_F / 30.0, 0.07)

# hard cut at the card: everything gone 0.3 s after the cut
out *= np.clip((cut + 0.3 - t) / 0.3, 0, 1)
pk = np.max(np.abs(out))
out = out / pk * 0.7
stereo = np.stack([out, np.roll(out, 9)], 1)  # 0.2 ms apart: a little width
wavfile.write(sys.argv[2], SR, (stereo * 32767).astype(np.int16))
print('births', k, 'dur', round(dur, 2))
