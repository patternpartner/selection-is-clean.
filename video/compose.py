"""A small code-only studio: compose an original track, note by note, locally and free.

    python3 video/compose.py out/first-light.wav

Synth voices (supersaw pad, glass bell, pluck, sub bass, kick, clap, hats) are drawn sample by sample with numpy and
finished with pedalboard (filters, reverb, delay, compression). The arrangement below is 'First Light': a mind is
born, learns, takes a body and flies. A major, 80 BPM, bars of 3 s, so the film cuts on the bar.
"""
import sys

import numpy as np
from pedalboard import Chorus, Compressor, Delay, Gain, HighpassFilter, Limiter, LowpassFilter, Pedalboard, Reverb

SR = 44100
BPM = 80
BEAT = 60 / BPM
BAR = 4 * BEAT
rng = np.random.default_rng(3)


def hz(n):  # MIDI note to Hz
    return 440.0 * 2 ** ((n - 69) / 12)


def env(n, a, r, sus=1.0):
    e = np.ones(n) * sus
    ai, ri = min(int(a * SR), n), min(int(r * SR), n)
    if ai:
        e[:ai] = np.linspace(0, sus, ai)
    if ri:
        e[n - ri:] *= np.linspace(1, 0, ri)
    return e


def saw(f, t, phase=0.0):
    return 2 * ((f * t + phase) % 1.0) - 1


def supersaw(note, dur, a=1.5, r=2.0, voices=7, spread=0.18):
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = sum(saw(hz(note + spread * (k - voices // 2) / (voices // 2)), t, rng.random()) for k in range(voices))
    return out / voices * env(n, a, r)


def bell(note, dur=4.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    parts = [(1, 1.0, 1.4), (2.76, 0.45, 2.2), (5.4, 0.25, 3.5), (8.93, 0.12, 5.0)]
    return sum(g * np.sin(2 * np.pi * hz(note) * m * t) * np.exp(-t * d) for m, g, d in parts) * 0.5


def pluck(note, dur=0.6):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = (np.sin(2 * np.pi * hz(note) * t) + 0.35 * np.sin(2 * np.pi * hz(note) * 2 * t) +
         0.15 * np.sign(np.sin(2 * np.pi * hz(note) * t)))
    return x * np.exp(-t * 7) * env(n, 0.003, 0.05)


def sub(note, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    return (np.sin(2 * np.pi * hz(note) * t) + 0.2 * np.sin(2 * np.pi * hz(note) * 2 * t)) * env(n, 0.01, 0.1)


def kick(dur=0.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 45 + 110 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7) + 0.3 * np.exp(-t * 300) * rng.normal(0, 1, n)


def clap(dur=0.35):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = rng.normal(0, 1, n) * (np.exp(-t * 18) + 0.6 * np.exp(-np.maximum(t - 0.012, 0) * 30) * (t > 0.012))
    return Pedalboard([HighpassFilter(900), LowpassFilter(6000)])(x.astype(np.float32), SR) * 0.8


def hat(dur=0.08, open_=False):
    n = int((0.3 if open_ else dur) * SR)
    t = np.arange(n) / SR
    x = rng.normal(0, 1, n) * np.exp(-t * (9 if open_ else 55))
    return Pedalboard([HighpassFilter(7000)])(x.astype(np.float32), SR) * 0.35


class Track:
    def __init__(self, seconds):
        self.x = np.zeros(int(seconds * SR) + SR * 6, np.float32)

    def add(self, at, sig, gain=1.0):
        i = int(at * SR)
        s = np.asarray(sig, np.float32) * gain
        self.x[i:i + len(s)] += s[:len(self.x) - i]

    def fx(self, board):
        self.x = board(self.x, SR)
        return self


# A - F#m - D - E, two bars each; chord tones as MIDI notes (pad voicing / arpeggio / bass root)
CHORDS = [([57, 61, 64, 69], [69, 73, 76, 81], 45), ([54, 57, 61, 66], [66, 69, 73, 78], 42),
          ([50, 54, 57, 62], [62, 66, 69, 74], 38), ([52, 56, 59, 64], [64, 68, 71, 76], 40)]


def chord_at(bar):
    return CHORDS[(bar // 2) % 4]


def compose(out, bars=42, tail=6.0):
    total = bars * BAR + tail
    pad, arp, bass, drums, bells, chops = (Track(total) for _ in range(6))
    # sections (bars): spark 0-2, birth 2-10, learning 10-22, body 22-32, flight 32-40, return 40-42
    # the pad opens as the mind grows: each chord is filtered at the brightness of its moment in the story
    bright = lambda t: float(np.interp(t, [0, 30, 66, 96, 120, 126], [300, 900, 1800, 3200, 6000, 1500]))
    for b in range(2, bars, 2):
        voicing, _, _ = chord_at(b)
        level = 0.07 if b < 10 else 0.12 if b < 22 else 0.17 if b < 32 else 0.22
        if b >= 40:
            level = 0.16
        notes = [(nn, level) for nn in voicing] + ([(nn + 12, 0.09) for nn in voicing[1:]] if b >= 32 else [])
        for nn, lv in notes:
            s = supersaw(nn, 2 * BAR + 1.5, a=1.8 if b < 10 else 0.8, r=2.2).astype(np.float32)
            pad.add(b * BAR, LowpassFilter(bright(b * BAR + BAR))(s, SR), lv)
    pad.fx(Pedalboard([Chorus(rate_hz=0.3, depth=0.3, mix=0.4), Reverb(room_size=0.9, damping=0.4, wet_level=0.45,
                                                                       dry_level=0.6, width=1.0)]))
    # the spark: a glass bell, the recurring motif (it rings when the spark appears in the film)
    for at, nn in [(0.5, 81), (1.25, 88), (6, 81), (12, 85), (18, 81), (24, 88), (30, 81), (66, 88), (96, 93),
                   (120, 81), (121.5, 88), (123, 85), (124.5, 81)]:
        bells.add(at, bell(nn, 5.0), 0.22)
    bells.fx(Pedalboard([Delay(delay_seconds=BEAT * 0.75, feedback=0.35, mix=0.3),
                         Reverb(room_size=0.95, wet_level=0.5, dry_level=0.5)]))
    # learning: an arpeggio of eighth notes, climbing through the chord
    for b in range(10, 40):
        _, tones, _ = chord_at(b)
        up = 12 if b >= 32 else 0
        pattern = [0, 1, 2, 3, 2, 1, 3, 2]
        for k in range(8):
            if b < 12 and k % 2:
                continue  # it starts halting, every other note
            arp.add(b * BAR + k * BEAT / 2, pluck(tones[pattern[k]] + up), 0.16 if b < 22 else 0.13)
    arp.fx(Pedalboard([LowpassFilter(4200), Delay(delay_seconds=BEAT * 0.75, feedback=0.3, mix=0.25),
                       Reverb(room_size=0.6, wet_level=0.25)]))
    # heartbeat from the learning section on; the full beat when it takes a body
    for b in range(10, 40):
        base = b * BAR
        if b < 22:
            drums.add(base, kick(), 0.5)
            drums.add(base + BEAT * 0.4, kick(), 0.28)  # lub-dub
            drums.add(base + 2 * BEAT, kick(), 0.45)
            drums.add(base + 2 * BEAT + BEAT * 0.4, kick(), 0.25)
        else:
            for k in range(4):
                drums.add(base + k * BEAT, kick(), 0.7 if k in (0, 2) else 0.0)
                if k in (1, 3):
                    drums.add(base + k * BEAT, clap(), 0.5)
            for k in range(8):
                drums.add(base + k * BEAT / 2, hat(open_=(k % 4 == 2)), 0.5 if k % 2 else 0.3)
            if b % 4 == 3:  # a small fill into every other phrase
                for k in range(4):
                    drums.add(base + 3 * BEAT + k * BEAT / 4, clap(0.2), 0.18 + 0.06 * k)
    drums.fx(Pedalboard([Compressor(threshold_db=-14, ratio=3), Reverb(room_size=0.3, wet_level=0.12)]))
    # bass with the body
    for b in range(22, 40):
        _, _, root = chord_at(b)
        for k in (0, 1.5, 2, 3.5):
            bass.add(b * BAR + k * BEAT, sub(root, BEAT * (0.9 if k in (0, 2) else 0.45)), 0.42)
    bass.fx(Pedalboard([LowpassFilter(900), Compressor(threshold_db=-12, ratio=4)]))
    # flight: a soaring lead made of the bell and a bright saw, the motif sung out
    lead_notes = [(0, 81, 1.0), (1, 83, 0.5), (1.5, 85, 1.5), (4, 88, 2.0), (6, 86, 1.0), (7, 85, 1.0),
                  (8, 81, 2.0), (10, 83, 1.0), (11, 85, 1.0), (12, 88, 3.0), (16, 90, 2.0), (18, 88, 2.0),
                  (20, 85, 2.0), (22, 83, 1.0), (23, 81, 1.0)]
    for rep in range(2):
        for beat, nn, d in lead_notes:
            at = 32 * BAR + (beat + rep * 24) * BEAT
            if at < 40 * BAR:
                chops.add(at, supersaw(nn, d * BEAT + 0.4, a=0.03, r=0.35, voices=5, spread=0.1), 0.11)
                chops.add(at, bell(nn, 2.0), 0.08)
    chops.fx(Pedalboard([LowpassFilter(5000), Delay(delay_seconds=BEAT * 0.75, feedback=0.4, mix=0.3),
                         Reverb(room_size=0.85, wet_level=0.4)]))
    mix = pad.x + bells.x + arp.x + drums.x + bass.x + chops.x
    mix = Pedalboard([HighpassFilter(30), Compressor(threshold_db=-14, ratio=1.8, attack_ms=30, release_ms=300)])(
        mix.astype(np.float32), SR)
    mix = Limiter(threshold_db=-1.0)(mix / np.abs(mix).max() * 0.95, SR)
    n = int(total * SR)
    mix = mix[:n]
    mix[-int(tail * SR):] *= np.linspace(1, 0, int(tail * SR)) ** 2
    import soundfile as sf
    sf.write(out, np.stack([mix, mix], 1), SR)
    print("saved", out, f"{total:.1f} s")


if __name__ == "__main__":
    compose(sys.argv[1])
