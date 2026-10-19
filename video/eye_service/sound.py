"""The sound of 'Eye-Service', synthesized from the film's own events (director.js -> EYE.events() -> events.json).

  python3 video/eye_service/sound.py events.json out.wav

Every move of the robot is a small servo; every watering a pour; every change of camera a relay click and a beep;
every plant that dies a dry rustle; the day has birds at dawn and crickets at dusk; lights-out is a monitor powering
down. The score is sparse: a held drone that warms with the day, and one plucked note for each watering, pitched by
where the plant is (back rows high, front rows low), so the tune of a day is the route the robot took.
Claude cannot hear this: it is checked by loudness, peaks, clicks and a spectrogram, and the user's ears decide.
"""
import json, sys
import numpy as np

SR = 48000
rng = np.random.default_rng(7)


def env(n, a=0.005, r=0.1):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / max(r, 1e-4))


def lp(x, cutoff):
    # one-pole low-pass, cheap and click-free
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = (1 - a) * x[i] + a * acc
        y[i] = acc
    return y


def lp_fast(x, cutoff):
    from scipy.signal import butter, sosfilt
    return sosfilt(butter(2, cutoff / (SR / 2), output='sos'), x)


def bp(x, lo, hi):
    from scipy.signal import butter, sosfilt
    return sosfilt(butter(2, [lo / (SR / 2), hi / (SR / 2)], btype='band', output='sos'), x)


def hp(x, cutoff):
    from scipy.signal import butter, sosfilt
    return sosfilt(butter(2, cutoff / (SR / 2), btype='high', output='sos'), x)


class Mix:
    def __init__(self, seconds):
        self.L = np.zeros(int(seconds * SR) + SR)
        self.R = np.zeros_like(self.L)

    def add(self, t, x, gain=1.0, pan=0.0):
        i = int(t * SR)
        if i >= len(self.L) or i + len(x) <= 0:
            return
        x = x[: len(self.L) - i]
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        self.L[i:i + len(x)] += x * gain * l * 1.41
        self.R[i:i + len(x)] += x * gain * r * 1.41


def servo(dur=0.14, f0=520, f1=760):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = np.linspace(f0, f1, n)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = 0.5 * np.sign(np.sin(ph)) * 0.3 + np.sin(ph) * 0.7 + 0.25 * np.sin(2 * ph)
    x = lp_fast(x, 2400) * np.sin(np.pi * t / dur) ** 0.6
    grit = bp(rng.normal(size=n), 1500, 5000) * 0.08 * np.sin(np.pi * t / dur)
    return (x + grit) * 0.35


def pour(dur=0.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = bp(rng.normal(size=n), 900, 4200)
    gurgle = np.sin(2 * np.pi * (5 + 3 * np.sin(2 * np.pi * 7 * t)) * t) * 0.5 + 0.5
    e = np.minimum(1, t / 0.04) * np.minimum(1, (dur - t) / 0.08)
    return x * e * (0.6 + 0.4 * gurgle) * 0.35


def click():
    n = int(0.03 * SR)
    x = rng.normal(size=n) * env(n, 0.0005, 0.004)
    return hp(x, 1200) * 0.3


def beep(f=1760, dur=0.11):
    n = int(dur * SR)
    t = np.arange(n) / SR
    return np.sin(2 * np.pi * f * t) * np.minimum(1, t / 0.004) * np.minimum(1, (dur - t) / 0.01) * 0.22


def rustle(dur=0.45):
    n = int(dur * SR)
    x = bp(rng.normal(size=n), 2500, 9000) * (rng.random(n) < 0.08)
    t = np.arange(n) / SR
    return lp_fast(x, 7000) * np.exp(-t / 0.2) * 1.4


def pluck(f, dur=1.6, bright=0.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for k, a in [(1, 1.0), (2, 0.45 * bright), (3, 0.22 * bright), (4, 0.1 * bright), (5.02, 0.05 * bright)]:
        x += a * np.sin(2 * np.pi * f * k * t) * np.exp(-t * (2.2 + k * 1.3))
    return x * np.minimum(1, t / 0.003) * 0.25


def crt_off():
    n = int(0.9 * SR)
    t = np.arange(n) / SR
    thunk = lp_fast(rng.normal(size=n), 180) * np.exp(-t / 0.05) * 2.0
    whine = np.sin(2 * np.pi * (15600 - 9000 * t) * t) * np.exp(-t / 0.25) * 0.04
    return thunk + whine


def rope(up=True, dur=0.45):
    # a cord through a pulley: a squeaking wheel gliding up (hoist) or down (lower), plus the rope's rasp
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = np.linspace(700, 1300, n) if up else np.linspace(1300, 650, n)
    squeak = np.sin(2 * np.pi * np.cumsum(f * (1 + 0.04 * np.sin(2 * np.pi * 23 * t))) / SR) * 0.12
    rasp = bp(rng.normal(size=n), 1800, 6000) * 0.25 * (0.6 + 0.4 * np.sin(2 * np.pi * 31 * t) ** 2)
    e = np.minimum(1, t / 0.03) * np.minimum(1, (dur - t) / 0.08)
    return (squeak + rasp) * e


def footstep():
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    thud = lp_fast(rng.normal(size=n), 260) * np.exp(-t / 0.03) * 1.6
    grit = bp(rng.normal(size=n), 2000, 7000) * np.exp(-t / 0.02) * 0.15
    return thud + grit


def caught_sting():
    # a dull clunk and a low, falling note: the photograph found
    n = int(1.4 * SR)
    t = np.arange(n) / SR
    clunk = lp_fast(rng.normal(size=n), 400) * np.exp(-t / 0.04) * 1.5
    tone = (np.sin(2 * np.pi * (110 - 18 * t) * t) + 0.4 * np.sin(2 * np.pi * (165 - 27 * t) * t)) * np.exp(-t / 0.5) * 0.35
    return clunk + tone


def power(down=True):
    # Hold Still: a button pressed and the robot powering down (a click, then a whine falling away), or waking (a whine
    # rising, then a soft two-note chirp)
    n = int((0.9 if down else 0.6) * SR)
    t = np.arange(n) / SR
    if down:
        f = 900 * np.exp(-t / 0.25) + 120
        whine = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.35) * 0.16
        x = whine
        c = click()
        x[:len(c)] += c / (np.abs(c).max() + 1e-9) * 0.35
        return x
    f = 180 + 700 * (1 - np.exp(-t / 0.18))
    whine = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, t / 0.15) * np.exp(-np.maximum(0, t - 0.3) / 0.1) * 0.12
    out = whine
    for f0, t0 in ((1320, 0.38), (1760, 0.47)):
        b = beep(f0, 0.07) * 0.5
        i = int(t0 * SR)
        out[i:i + len(b)] += b[:n - i]
    return out


def birds(seconds, density=0.6):
    out = np.zeros(int(seconds * SR))
    k = int(seconds * density * 3)
    for _ in range(k):
        i = int(rng.random() * (len(out) - SR))
        n = int((0.05 + rng.random() * 0.12) * SR)
        t = np.arange(n) / SR
        f0 = 2600 + rng.random() * 2600
        f = f0 * (1 + 0.25 * np.sin(2 * np.pi * (8 + rng.random() * 12) * t)) * (1 + (rng.random() - 0.5) * 0.6 * t / t[-1])
        chirp = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / t[-1])
        out[i:i + n] += chirp * (0.02 + rng.random() * 0.05)
    return out


def crickets(seconds):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for f, rate, ph in [(4400, 2.3, 0), (4700, 1.9, 0.4), (4200, 2.7, 0.8)]:
        gate = (np.sin(2 * np.pi * rate * t + ph) > 0.55) * (np.sin(2 * np.pi * 30 * t) > 0)
        out += np.sin(2 * np.pi * f * t) * lp_fast(gate.astype(float), 300) * 0.02
    return out


def air(seconds):
    n = int(seconds * SR)
    return lp_fast(rng.normal(size=n), 400) * 0.05


def drone(seconds, f, warm):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    x = (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 1.5 * t + 0.3) + 0.25 * np.sin(2 * np.pi * f * 2.0 * t)) * 0.05
    return x * warm


if __name__ == '__main__':
    ev = json.load(open(sys.argv[1]))
    total = ev['seconds']
    M = Mix(total)
    # beds: air throughout; birds and crickets where the events say; drone where the events say
    M.add(0, air(total), 0.6)
    for b in ev.get('beds', []):
        dur = b['t1'] - b['t0']
        n = int(dur * SR)
        fade = np.minimum(1, np.minimum(np.arange(n) / (0.6 * SR), (n - np.arange(n)) / (0.6 * SR)))
        if b['type'] == 'birds':
            M.add(b['t0'], birds(dur, b.get('density', 0.6)) * fade, b.get('gain', 1.0))
        elif b['type'] == 'crickets':
            M.add(b['t0'], crickets(dur) * fade, b.get('gain', 1.0))
        elif b['type'] == 'drone':
            M.add(b['t0'], drone(dur, b.get('f', 73.4), 1.0) * fade, b.get('gain', 1.0))
    for e in ev['events']:
        t, k, pan, g = e['t'], e['type'], e.get('pan', 0.0), e.get('gain', 1.0)
        if k == 'move':
            M.add(t, servo(e.get('dur', 0.14)), 0.5 * g, pan)
        elif k == 'pour':
            M.add(t, pour(e.get('dur', 0.5)), 0.8 * g, pan)
            if 'f' in e:
                M.add(t + 0.02, pluck(e['f'], bright=e.get('bright', 0.5)), 0.9 * g, pan * 0.5)
        elif k == 'switch':
            M.add(t, click(), 0.8 * g, pan)
            M.add(t + 0.06, beep(), 1.0 * g, pan)
        elif k == 'death':
            M.add(t, rustle(), 0.6 * g, pan)
        elif k == 'crt_off':
            M.add(t, crt_off(), 1.0 * g, pan)
        elif k == 'hoist':
            M.add(t, rope(e.get('up', True), e.get('dur', 0.45)), 0.7 * g, pan)
        elif k == 'step':
            M.add(t, footstep(), 0.35 * g, pan)
        elif k == 'caught':
            M.add(t, caught_sting(), 0.6 * g, pan)
        elif k == 'press':
            M.add(t, power(True), 0.8 * g, pan)
        elif k == 'wake':
            M.add(t, power(False), 0.7 * g, pan)
        elif k == 'tick':
            M.add(t, click() * 0.5, 0.5 * g, pan)
        elif k == 'note':
            M.add(t, pluck(e['f'], dur=e.get('dur', 2.5), bright=e.get('bright', 0.4)), g, pan)
        elif k == 'silence':
            i0, i1 = int(e['t'] * SR), int(e['t1'] * SR)
            ramp = np.linspace(1, 0, int(0.05 * SR))
            for ch in (M.L, M.R):
                ch[i0:i0 + len(ramp)] *= ramp
                ch[i0 + len(ramp):i1] = 0
    st = np.stack([M.L, M.R], 1)[: int(total * SR)]
    peak = np.abs(st).max()
    print('peak at', round(int(np.abs(st).max(1).argmax()) / SR, 2), 's, raw peak', round(float(peak), 3))
    # level by loudness, not by the loudest instant: K-weighting is approximated by a 100 Hz high-pass on the
    # measuring copy, gated over 400 ms blocks; then a look-ahead limiter holds the TRUE peaks (4x oversampled) under
    # -1.8 dBFS - sample peaks alone let a click's intersample peak reach +0.4 dBTP in Teach It Once
    meas = np.stack([hp(st[:, 0], 100), hp(st[:, 1], 100)], 1)
    blk = int(0.4 * SR)
    ms = np.array([(meas[i:i + blk] ** 2).mean() for i in range(0, len(meas) - blk, blk // 4)])
    ms = ms[ms > ms.max() * 1e-4]
    lufs = -0.691 + 10 * np.log10(ms.mean() * 2 + 1e-12)
    st = st * 10 ** ((-18.0 - lufs) / 20)
    ceil = 10 ** (-1.8 / 20)
    look = int(0.005 * SR)
    from scipy.ndimage import maximum_filter1d
    from scipy.signal import resample_poly
    tp = np.abs(resample_poly(st, 4, 1, axis=0)).reshape(-1, 4, 2).max((1, 2))[:len(st)]
    need = np.maximum(tp / ceil, 1.0)
    need = maximum_filter1d(need, size=2 * look + 1)
    rel = np.exp(-1 / (0.08 * SR))
    g = np.empty_like(need); cur = 1.0
    for i in range(len(need)):
        target = 1.0 / need[i]
        cur = target if target < cur else target + (cur - target) * rel
        g[i] = cur
    st = st * g[:, None]
    import wave
    w = wave.open(sys.argv[2], 'wb')
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((st * 32767).astype(np.int16).tobytes())
    w.close()
    print('wrote', sys.argv[2], round(total, 2), 's; limiter min gain', round(float(g.min()), 3))
