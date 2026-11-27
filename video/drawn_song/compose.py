#!/usr/bin/env python3
"""I Drew This Song - music composed as shapes, and a film that is nothing but its own spectrogram.

I cannot hear. So the song is DRAWN: every voice is a set of partials (frequency and loudness over time), which is
exactly what a spectrogram shows, so I can see what I am writing. The partials are synthesised additively (with a
little reverb), and the film is the spectrogram of the finished mix, computed from the audio, written downward from
a playhead as it plays. Nothing else is on screen until the card.

D minor, 80 bpm (a bar is 3 s): intro (two points of light, a drone) / A (melody over Dm-Bb-F-C) / B (arpeggios, a kick
that is a falling chirp, hats) / the figure (a head drawn by two tones gliding apart and back, two pings for the eyes,
shoulders held) / A' / the two points of light alone.
Run:  python3 video/drawn_song/compose.py [--frames 10,40] [--workers 4]
"""
import argparse, os, subprocess
import numpy as np
from scipy import signal
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'out', 'drawn-song')
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
SR = 48000
BPM = 80; BEAT = 60 / BPM; BAR = 4 * BEAT
NBARS = 21
SONG = NBARS * BAR
CARD = 6.0
DUR = SONG + CARD


def hz(note):
    """'D4' / 'Bb3' / 'F#5' -> Hz"""
    names = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
    n = names[note[0]]; rest = note[1:]
    if rest[0] in '#b':
        n += 1 if rest[0] == '#' else -1; rest = rest[1:]
    return 440.0 * 2 ** ((n + 12 * (int(rest) + 1) - 69) / 12)


# ---------------------------------------------------------------- the score, as partials
VOICES = []   # each: dict(t0, t1, f(t)->Hz array, amp envelope (t)->array, harmonics [(k, gain)], pan)


def env_adsr(t, t0, t1, a=0.02, r=0.3, d=None):
    x = np.clip((t - t0) / a, 0, 1)
    if d:
        x = x * np.exp(-np.clip(t - t0, 0, None) / d)
    rel = np.clip(1 - (t - t1) / r, 0, 1)
    return np.where(t < t1, x, x * rel)


def note(t0, dur, name, gain, harm, a=0.02, r=0.3, d=None, vib=0.0, pan=0.0):
    f0 = hz(name) if isinstance(name, str) else name
    def f(t, f0=f0, t0=t0):
        v = vib * np.sin(2 * np.pi * 5.2 * (t - t0)) * np.clip((t - t0 - 0.25) / 0.4, 0, 1)
        return f0 * 2 ** (v / 12)
    VOICES.append(dict(t0=t0, t1=t0 + dur + r, f=f, amp=lambda t, t0=t0, dur=dur: env_adsr(t, t0, t0 + dur, a, r, d) * gain,
                       harm=harm, pan=pan))


def glide(t0, t1, path, gain, harm, pan=0.0, a=0.05, r=0.15):
    """a tone whose pitch follows path(u), u 0..1, in octaves above A4 (a drawn line)"""
    def f(t):
        u = np.clip((t - t0) / (t1 - t0), 0, 1)
        return 440.0 * 2 ** path(u)
    VOICES.append(dict(t0=t0, t1=t1 + r, f=f, amp=lambda t: env_adsr(t, t0, t1, a, r) * gain, harm=harm, pan=pan))


PURE = [(1, 1.0)]
SOFT = [(1, 1.0), (2, 0.25), (3, 0.08)]
PAD = [(1, 1.0), (2, 0.35), (3, 0.15), (4, 0.06), (5, 0.03)]
LEAD = [(k, 1 / k ** 1.25) for k in range(1, 9)]
BASS = [(1, 1.0), (2, 0.5), (3, 0.2), (4, 0.1)]

CHORDS = {'Dm': ['D3', 'F3', 'A3'], 'Bb': ['D3', 'F3', 'Bb3'], 'F': ['C3', 'F3', 'A3'], 'C': ['C3', 'E3', 'G3']}
ROOTS = {'Dm': 'D2', 'Bb': 'Bb1', 'F': 'F2', 'C': 'C2'}
PROG = ['Dm', 'Bb', 'F', 'C']
EYES = ('A5', 'D6')                    # the two points of light: two pings side by side


def bar_t(b):
    return b * BAR


def eyes(t, gain=0.16, dur=0.1):
    for i, n in enumerate(EYES):
        note(t, dur, n, gain, PURE, a=0.03, r=0.3, pan=(-0.3, 0.3)[i])


# bars 0-1: the intro - the two points of light, then a drone opens under them
eyes(0.8); eyes(3.8)
note(bar_t(1), 2 * BAR, 'D2', 0.10, SOFT, a=2.5, r=1.5)
note(bar_t(1) + 1.5, 1.5 * BAR, 'A2', 0.06, SOFT, a=2.0, r=1.5)

# A: bars 2-7 - melody over the progression
MEL = [  # (beat offset within the section, beats, note)
    (0, 2, 'A4'), (2, 1, 'G4'), (3, 1, 'F4'), (4, 3, 'D4'), (7, 1, 'F4'),
    (8, 2, 'F4'), (10, 1, 'G4'), (11, 1, 'A4'), (12, 4, 'C5'),
    (16, 2, 'A4'), (18, 1, 'Bb4'), (19, 1, 'A4'), (20, 2, 'G4'), (22, 2, 'E4'),
    (24, 3, 'F4'), (27, 1, 'E4'), (28, 4, 'D4'),
    (32, 1, 'D5'), (33, 1, 'C5'), (34, 2, 'A4'), (36, 2, 'Bb4'), (38, 2, 'D5'),
    (40, 2, 'C5'), (42, 1, 'A4'), (43, 1, 'G4'), (44, 4, 'A4'),
]


def section_A(b0, nb, mel_gain=0.13, pan=0.0):
    for k in range(nb):
        ch = PROG[(b0 + k) % 4]
        for n in CHORDS[ch]:
            note(bar_t(b0 + k), BAR, n, 0.045, PAD, a=0.45, r=0.7, pan=0.0)
        for bt in (0, 2):
            note(bar_t(b0 + k) + bt * BEAT, 1.6 * BEAT, ROOTS[ch], 0.10, BASS, a=0.01, r=0.25, d=1.4)
    for off, beats, n in MEL:
        if off < nb * 4:
            note(bar_t(b0) + off * BEAT, beats * BEAT * 0.92, n, mel_gain, LEAD, a=0.03, r=0.35, vib=0.18, pan=pan)


section_A(2, 6)

# B: bars 8-11 - sixteenth arpeggios, a kick (a falling chirp) and hats
def kick(t, gain=0.5):
    VOICES.append(dict(t0=t, t1=t + 0.35, f=lambda tt, t=t: 45 + 110 * np.exp(-np.clip(tt - t, 0, None) / 0.04),
                       amp=lambda tt, t=t: gain * np.clip((tt - t) / 0.002, 0, 1) * np.exp(-np.clip(tt - t, 0, None) / 0.12),
                       harm=[(1, 1.0), (2, 0.2)], pan=0.0))


HATS = []
for k in range(4):
    b = 8 + k; ch = PROG[b % 4]
    tones = [hz(n) * 2 for n in CHORDS[ch]] + [hz(CHORDS[ch][0]) * 4]
    for s in range(16):
        f = tones[[0, 1, 2, 3, 2, 1][s % 6]]
        note(bar_t(b) + s * BEAT / 4, BEAT / 4 * 0.8, f, 0.06, SOFT, a=0.004, r=0.12, d=0.12, pan=0.35 * np.sin(s))
    for n in CHORDS[ch]:
        note(bar_t(b), BAR, n, 0.035, PAD, a=0.3, r=0.6)
    for bt in range(4):
        kick(bar_t(b) + bt * BEAT, 0.42 if bt % 2 == 0 else 0.28)
        note(bar_t(b) + bt * BEAT, BEAT * 0.9, ROOTS[ch], 0.08, BASS, a=0.01, r=0.2, d=0.5)
    for e in range(8):
        HATS.append((bar_t(b) + e * BEAT / 2 + BEAT / 4, 0.045 if e % 2 else 0.03))

# the figure, bars 12-13: drawn in sound, alone, in PURE tones (a tone with harmonics draws the shape again at 2x, 3x).
# The newest sound is at the top of the screen, so the body is played first and the head last, and it stands upright.
# Body: two tones start wide (the bottom of the body) and come in to the neck; head: two tones start together at the
# bottom of the head and follow a CIRCLE out and back (a semicircle profile, not a sine, which drew a pointed lens);
# eyes: two pings in its upper half.
PC = 0.05                                             # the figure's centre, in octaves above A4
BT0 = bar_t(12) + 0.3; BT1 = BT0 + 2.3                # body
def body(u):
    return 0.95 - 0.77 * np.clip((u - 0.78) / 0.22, 0, 1) ** 1.5
glide(BT0, BT1, lambda u: PC + body(u), 0.08, PURE, pan=0.5, a=0.25, r=0.05)
glide(BT0, BT1, lambda u: PC - body(u), 0.08, PURE, pan=-0.5, a=0.25, r=0.05)
HT0 = BT1 + 0.08; HDUR = 1.3; HT1 = HT0 + HDUR; RP = 0.85     # 260 px tall, 262 px wide: round
circ = lambda u: RP * np.sqrt(np.clip(1 - (2 * u - 1) ** 2, 0, 1))
glide(HT0, HT1, lambda u: PC + circ(u), 0.11, PURE, pan=0.4, a=0.02, r=0.05)
glide(HT0, HT1, lambda u: PC - circ(u), 0.11, PURE, pan=-0.4, a=0.02, r=0.05)
for i, dv in enumerate((-0.3, 0.3)):
    note(HT0 + 0.62 * HDUR, 0.1, 440 * 2 ** (PC + dv), 0.2, PURE, a=0.03, r=0.25, pan=(-0.3, 0.3)[i])
note(bar_t(12), 2 * BAR, 'D2', 0.05, SOFT, a=1.0, r=1.0)

# A': bars 14-19, the melody an octave up for its last half, fuller
section_A(14, 6, mel_gain=0.12)
for off, beats, n in MEL[13:]:
    note(bar_t(14) + off * BEAT, beats * BEAT * 0.92, hz(n) * 2, 0.045, SOFT, a=0.03, r=0.4, vib=0.18, pan=0.3)

# bar 20: the two points of light, alone
eyes(bar_t(20) + 0.6, 0.15); eyes(bar_t(20) + 1.6, 0.11, 0.3)


# ---------------------------------------------------------------- synthesis
def synth():
    n = int(DUR * SR)
    L = np.zeros(n); Rr = np.zeros(n)
    for v in VOICES:
        i0, i1 = int(v['t0'] * SR), min(n, int(v['t1'] * SR) + 1)
        if i1 <= i0 + 1:
            continue
        t = np.arange(i0, i1) / SR
        f = v['f'](t) * np.ones_like(t)
        a = v['amp'](t)
        y = np.zeros_like(t)
        for k, g in v['harm']:
            fk = f * k
            if fk.max() > SR / 2 * 0.9:
                continue
            ph = 2 * np.pi * np.cumsum(fk) / SR
            y += g * np.sin(ph) * np.where(fk > 9000, np.clip((12000 - fk) / 3000, 0, 1), 1)
        y *= a
        p = v.get('pan', 0.0)
        L[i0:i1] += y * np.sqrt(0.5 * (1 - p)); Rr[i0:i1] += y * np.sqrt(0.5 * (1 + p))
    rng = np.random.default_rng(2)
    for t, g in HATS:
        i = int(t * SR); m = int(0.05 * SR)
        b = rng.normal(0, 1, m) * np.exp(-np.arange(m) / (0.012 * SR))
        b = signal.sosfilt(signal.butter(4, 7000, 'hp', fs=SR, output='sos'), b) * g
        L[i:i + m] += b * 0.8; Rr[i:i + m] += b
    # a small room: decaying noise, different each side
    m = int(1.8 * SR); tt = np.arange(m) / SR
    irL = rng.normal(0, 1, m) * np.exp(-tt / 0.45); irR = rng.normal(0, 1, m) * np.exp(-tt / 0.45)
    irL[:int(0.012 * SR)] = 0; irR[:int(0.017 * SR)] = 0
    irL /= np.sqrt((irL ** 2).sum()); irR /= np.sqrt((irR ** 2).sum())
    wetL = signal.fftconvolve(L, irL)[:n]; wetR = signal.fftconvolve(Rr, irR)[:n]
    out = np.stack([L + 0.22 * wetL, Rr + 0.22 * wetR], -1)
    out[int(SONG * SR):] *= 0
    out /= np.abs(out).max() / 0.89
    return out


# ---------------------------------------------------------------- the picture: the mix's own spectrogram
FMIN, FMAX = 40.0, 9000.0
W, H, FPS = 1080, 1920, 30
PLAY_Y = 300                      # the playhead; what has been heard flows down from it
PXS = 200                         # pixels per second
HOP = SR // PXS


def spectrogram(mono):
    """log-frequency magnitude, one row per 1/200 s, 1080 columns; long window below 600 Hz, short above"""
    fcol = FMIN * (FMAX / FMIN) ** (np.arange(W) / (W - 1))
    rows = []
    out = None
    for nfft in (8192, 2048):
        f, t, Z = signal.stft(mono, SR, nperseg=nfft, noverlap=nfft - HOP, boundary='even', padded=True)
        M = np.abs(Z)
        # interpolate to log columns
        idx = np.interp(fcol, f, np.arange(len(f)))
        lo = np.floor(idx).astype(int); fr = idx - lo
        S = M[lo] * (1 - fr)[:, None] + M[np.minimum(lo + 1, len(f) - 1)] * fr[:, None]
        rows.append(S.T)
    n = min(len(rows[0]), len(rows[1]))
    blend = np.clip((np.log2(fcol) - np.log2(450)) / (np.log2(900) - np.log2(450)), 0, 1)
    S = rows[0][:n] * (1 - blend) + rows[1][:n] * blend * (2048 / 8192) ** -0.0
    db = 20 * np.log10(S / S.max() + 1e-9)
    return np.clip((db + 78) / 78, 0, 1), fcol


def colour(x):
    """dark -> deep blue -> amber -> white"""
    stops = np.array([[0.0, 6, 6, 10], [0.28, 14, 22, 58], [0.5, 40, 70, 150], [0.68, 210, 120, 50], [0.85, 255, 200, 120], [1.0, 255, 250, 235]])
    out = np.zeros(x.shape + (3,))
    for c in range(3):
        out[..., c] = np.interp(x, stops[:, 0], stops[:, c + 1])
    return out.astype(np.uint8)


def frames_source(mono):
    S, fcol = spectrogram(mono)
    S = S ** 1.15
    return colour(S), fcol


def render_frame(f, IMG, card_font):
    t = f / FPS
    frame = np.zeros((H, W, 3), np.uint8) + np.array([6, 6, 10], np.uint8)
    now = int(min(t, SONG) * PXS)
    n = H - PLAY_Y
    lo = max(0, now - n)
    seg = IMG[lo:now][::-1]                     # newest at the playhead, older below
    frame[PLAY_Y:PLAY_Y + len(seg)] = seg
    # the playhead: a faint line (what is above it has not been heard)
    frame[PLAY_Y - 1:PLAY_Y + 1] = np.maximum(frame[PLAY_Y - 1:PLAY_Y + 1], 40)
    img = Image.fromarray(frame)
    if t >= SONG:
        k = min(1, (t - SONG) / 1.2)
        arr = (np.asarray(img).astype(np.float32) * (1 - 0.75 * k)).astype(np.uint8)
        img = Image.fromarray(arr); d = ImageDraw.Draw(img)
        lines = [('Every shape you saw', 0.6), ('is a sound you heard.', 0.6), ('', 0), ('I drew this song.', 2.0),
                 ('I have never heard it.', 3.2)]
        y = 760
        for s, at in lines:
            if s and t - SONG >= at:
                al = min(1, (t - SONG - at) / 0.6)
                w = d.textlength(s, font=card_font)
                d.text(((W - w) / 2, y), s, font=card_font, fill=tuple(int(c * al) for c in (255, 236, 205)))
            y += 84 if s else 50
    return np.asarray(img)


def worker(f0, f1, path, IMG):
    font = ImageFont.truetype(FONT, 60)
    p = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS),
                          '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '15', '-pix_fmt', 'yuv420p', path],
                         stdin=subprocess.PIPE)
    for f in range(f0, f1):
        p.stdin.write(render_frame(f, IMG, font).tobytes())
    p.stdin.close(); p.wait()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--workers', type=int, default=4); ap.add_argument('--frames'); ap.add_argument('--audio-only', action='store_true')
    a = ap.parse_args()
    os.makedirs(OUT, exist_ok=True)
    audio = synth()
    wav = f'{OUT}/i-drew-this-song.wav'
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', wav],
                   input=audio.astype(np.float32).tobytes(), check=True)
    if a.audio_only:
        return
    IMG, fcol = frames_source(audio.mean(1))
    np.save(f'{OUT}/spectro.npy', IMG)
    if a.frames:
        font = ImageFont.truetype(FONT, 60)
        ims = [Image.fromarray(render_frame(int(float(x) * FPS), IMG, font)).resize((360, 640)) for x in a.frames.split(',')]
        sh = Image.new('RGB', (360 * len(ims), 640))
        for k, im in enumerate(ims):
            sh.paste(im, (360 * k, 0))
        sh.save(f'{OUT}/sheet.png')
        return
    from multiprocessing import Process
    NF = int(DUR * FPS)
    cuts = np.linspace(0, NF, a.workers + 1).astype(int)
    parts = [f'{OUT}/part{i}.mp4' for i in range(a.workers)]
    ps = [Process(target=worker, args=(cuts[i], cuts[i + 1], parts[i], IMG)) for i in range(a.workers)]
    [p.start() for p in ps]; [p.join() for p in ps]
    with open(f'{OUT}/parts.txt', 'w') as fh:
        fh.writelines(f"file '{p}'\n" for p in parts)
    silent = f'{OUT}/i-drew-this-song-silent.mp4'
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', f'{OUT}/parts.txt', '-c', 'copy', silent], check=True)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', silent, '-i', wav, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-shortest',
                    f'{OUT}/i-drew-this-song.mp4'], check=True)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', silent, '-i', wav, '-c:v', 'libx264', '-b:v', '3500k', '-maxrate', '5M',
                    '-bufsize', '8M', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart',
                    f'{OUT}/i-drew-this-song-share.mp4'], check=True)
    print('done')


if __name__ == '__main__':
    main()
