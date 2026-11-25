"""Bred by the Song - the body, its physics, its brain and what it hears.

A 2D body of 11 point masses joined by rigid bones (position-based dynamics, gravity, ground with friction) and moved
by 9 muscles: springs between non-adjacent masses whose rest lengths the brain sets every step. The brain is a small
neural net (12 inputs -> 12 tanh -> 9) that hears the song (onset strength, loudness, beat phase, bar phase) and feels
its own body (torso angle, pelvis height, which feet touch the floor). Everything is vectorised over a population.
"""
import subprocess
import numpy as np

FPS_SIM = 60
DT = 1 / FPS_SIM
G = -9.8

# masses: 0 head, 1 neck, 2 pelvis, 3 l.knee, 4 l.foot, 5 r.knee, 6 r.foot, 7 l.elbow, 8 l.hand, 9 r.elbow, 10 r.hand
REST = np.array([[0, 1.80], [0, 1.52], [0, 1.00], [-0.12, 0.52], [-0.16, 0.0], [0.12, 0.52], [0.16, 0.0],
                 [-0.20, 1.22], [-0.26, 0.92], [0.20, 1.22], [0.26, 0.92]])
INVM = np.array([1.2, 1.0, 0.6, 1.0, 0.7, 1.0, 0.7, 1.6, 2.0, 1.6, 2.0])
BONES = [(0, 1), (1, 2), (2, 3), (3, 4), (2, 5), (5, 6), (1, 7), (7, 8), (1, 9), (9, 10)]
MUSCLES = [(0, 2), (1, 3), (1, 5), (2, 4), (2, 6), (2, 7), (2, 9), (1, 8), (1, 10)]   # spine, hips, knees, shoulders, elbows
N_IN, N_HID, N_OUT = 12, 12, len(MUSCLES)
N_GENE = N_IN * N_HID + N_HID + N_HID * N_OUT + N_OUT
SPAN = 0.32          # a muscle can move its rest length +-32%


def length(a, b):
    return float(np.linalg.norm(REST[a] - REST[b]))
BONE_L = np.array([length(a, b) for a, b in BONES])
MUS_L = np.array([length(a, b) for a, b in MUSCLES])
BONE_PASS = list(zip(BONES, BONE_L)) * 3     # bones three times a pass: rigid to 0.02% (median)


# ---------------------------------------------------------------- what it hears
def song_features(path, t0, t1, beat=0.445, phase=None):
    """per 1/60 s: onset strength, loudness (both 0..1-ish), beat phase, bar phase. Beat grid from the onset
    autocorrelation (134.8 bpm); phase: the offset whose beats carry the most onset strength."""
    sr = 22050
    a = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'quiet', '-i', path, '-f', 'f32le', '-ac', '1', '-ar', str(sr), '-'],
                                     capture_output=True).stdout, np.float32)
    hop = sr // FPS_SIM
    n = len(a) // hop
    fr = a[:n * hop].reshape(n, hop)
    rms = np.sqrt((fr ** 2).mean(1)) + 1e-5
    # spectral flux on 1024-point frames
    win = np.hanning(1024)
    pad = np.r_[np.zeros(512), a, np.zeros(1024)]
    S = np.array([np.abs(np.fft.rfft(pad[i * hop:i * hop + 1024] * win)) for i in range(n)])
    S = np.log1p(S * 10)
    flux = np.r_[0, np.maximum(0, np.diff(S, axis=0)).sum(1)]
    flux = flux / np.percentile(flux, 99)
    loud = np.clip((20 * np.log10(rms) + 40) / 32, 0, 1)
    t = np.arange(n) / FPS_SIM
    if phase is None:
        best = max(np.arange(0, beat, 0.005), key=lambda p: np.interp(np.arange(p, t[-1], beat), t, flux).sum())
        phase = best
    bp = ((t - phase) / beat) % 1.0
    barp = ((t - phase) / (4 * beat)) % 1.0
    i0, i1 = int(t0 * FPS_SIM), int(t1 * FPS_SIM)
    return dict(t=t[i0:i1], onset=np.clip(flux[i0:i1], 0, 1.5), loud=loud[i0:i1], beat=bp[i0:i1], bar=barp[i0:i1],
                phase=phase, beat_len=beat)


# ---------------------------------------------------------------- the brain
def unpack(Wg):
    """genomes (P, N_GENE) -> layers"""
    P = Wg.shape[0]; o = 0
    W1 = Wg[:, o:o + N_IN * N_HID].reshape(P, N_IN, N_HID); o += N_IN * N_HID
    b1 = Wg[:, o:o + N_HID]; o += N_HID
    W2 = Wg[:, o:o + N_HID * N_OUT].reshape(P, N_HID, N_OUT); o += N_HID * N_OUT
    b2 = Wg[:, o:o + N_OUT]
    return W1, b1, W2, b2


def senses(x, feat, k, contact):
    torso = x[:, 1] - x[:, 2]
    ang = np.arctan2(torso[:, 0], torso[:, 1])
    th, br = 2 * np.pi * feat['beat'][k], 2 * np.pi * feat['bar'][k]
    P = x.shape[0]
    return np.stack([np.full(P, feat['onset'][k]), np.full(P, feat['loud'][k]), np.full(P, np.sin(th)), np.full(P, np.cos(th)),
                     np.full(P, np.sin(br)), np.full(P, np.cos(br)), np.sin(ang), np.cos(ang) - 1,
                     x[:, 2, 1] - 1.0, contact[:, 0], contact[:, 1], np.ones(P)], -1)


# ---------------------------------------------------------------- the world
def simulate(Wg, feat, record=False, iters=6):
    """run every genome through the song features; returns per-step pelvis y, head y, hand speed, body speed (P, T)
    and, if record, all positions (T, P, 11, 2)"""
    P = Wg.shape[0]; T = len(feat['t'])
    W1, b1, W2, b2 = unpack(Wg)
    x = np.repeat(REST[None], P, 0).copy(); xp = x.copy()
    w = INVM[None, :, None]
    pel = np.zeros((P, T)); head = np.zeros((P, T)); strain = np.zeros((P, T)); hand = np.zeros((P, T)); body = np.zeros((P, T))
    rec = np.zeros((T, P, 11, 2), np.float32) if record else None
    contact = np.zeros((P, 2))
    for k in range(T):
        s = senses(x, feat, k, contact)
        h = np.tanh(np.einsum('pi,pih->ph', s, W1) + b1)
        out = np.tanh(np.einsum('ph,pho->po', h, W2) + b2)
        target = MUS_L[None] * (1 + SPAN * out)
        v = (x - xp) * 0.995
        xp = x.copy()
        x = x + v
        x[:, :, 1] += G * DT * DT
        # muscles first, bones LAST in every pass (and two extra bone passes): a muscle applied after the bones
        # stretched them, and evolution found it at once (bodies two metres tall, heads 'up' while upside down)
        for it in range(iters + 4):
            if it < iters:
                for m, (a, b) in enumerate(MUSCLES):
                    d = x[:, b] - x[:, a]; dist = np.linalg.norm(d, axis=1, keepdims=True) + 1e-9
                    c = 0.6 * (dist - target[:, m:m + 1]) / dist / (INVM[a] + INVM[b])
                    x[:, a] += d * c * INVM[a]; x[:, b] -= d * c * INVM[b]
            for (a, b), L in BONE_PASS:
                d = x[:, b] - x[:, a]; dist = np.linalg.norm(d, axis=1, keepdims=True) + 1e-9
                c = (dist - L) / dist / (INVM[a] + INVM[b])
                x[:, a] += d * c * INVM[a]; x[:, b] -= d * c * INVM[b]
            below = x[:, :, 1] < 0
            x[:, :, 1] = np.where(below, 0, x[:, :, 1])
        # friction on whatever touches the floor
        touch = x[:, :, 1] <= 1e-4
        x[:, :, 0] = np.where(touch, xp[:, :, 0] + (x[:, :, 0] - xp[:, :, 0]) * 0.15, x[:, :, 0])
        contact = touch[:, [4, 6]].astype(float)
        pel[:, k] = x[:, 2, 1]
        # 'up' only counts a head above its own pelvis (a body upside down is not standing, however high its head)
        head[:, k] = np.where(x[:, 0, 1] > x[:, 2, 1] + 0.45, x[:, 0, 1], 0)
        strain[:, k] = np.max([np.abs(np.linalg.norm(x[:, b] - x[:, a], axis=1) / L - 1) for (a, b), L in zip(BONES, BONE_L)], 0)
        head[:, k] = np.where(strain[:, k] > 0.05, 0, head[:, k])   # a stretched body is not standing either
        sp = np.linalg.norm(x - xp, axis=2) * FPS_SIM
        hand[:, k] = sp[:, [8, 10]].mean(1); body[:, k] = sp.mean(1)
        if record:
            rec[k] = x
    return dict(pel=pel, head=head, hand=hand, body=body, rec=rec, strain=strain)


def smooth(a, n):
    k = np.ones(n) / n
    return np.apply_along_axis(lambda r: np.convolve(r, k, 'same'), -1, a)


def corr_rows(A, b):
    A = A - A.mean(1, keepdims=True); b = b - b.mean()
    return (A @ b) / (np.linalg.norm(A, axis=1) * np.linalg.norm(b) + 1e-9)


def fitness(r, feat, parts=False):
    """dancing to THIS song, as three measured things, all gated on staying up:
    bob   - the pelvis rises and falls with the beat (its coherence with the beat phase, times its size, up to 4 cm)
    loud  - the body moves big when the song is loud and goes quiet when it does (correlation, 0.5 s smoothing)
    hits  - the hands move on the song's hits (correlation of hand speed with onset strength)"""
    up = (r['head'] > 1.25).mean(1)
    th = 2 * np.pi * feat['beat']
    y = r['pel'] - r['pel'].mean(1, keepdims=True)
    z = (y * np.exp(-1j * th)[None]).mean(1) * 2
    amp = np.abs(z)
    coh = amp / (np.sqrt(2) * y.std(1) + 1e-6)
    bob = np.clip(coh, 0, 1) * np.clip(amp / 0.04, 0, 1)
    loud = np.clip(corr_rows(smooth(r['body'], 30), smooth(feat['loud'][None], 30)[0]), 0, 1)
    hits = np.clip(corr_rows(smooth(r['hand'], 4), smooth(feat['onset'][None], 4)[0]), 0, 1)
    moving = np.clip(r['hand'].mean(1) / 0.6, 0, 1)
    f = up ** 2 * (0.4 * bob + 0.35 * loud + 0.25 * hits) * (0.3 + 0.7 * moving)
    if parts:
        return f, dict(up=up, bob=bob, loud=loud, hits=hits, moving=moving)
    return f
