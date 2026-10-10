# "The Clock" - is new territory still arriving in the real universe? Frames and numbers are one real engine run per seed
# (video/novelty_capture.js, 40,000 ticks); the dashed "drift alone" levels are the mean of the 8 neutral shadows of a SEPARATE
# node run of harness-sweep.js on the same seed (out/sweep40). usage: python3 build_clock.py OUT [SHEET=a,b,step] [AUDIO_ONLY=1]
import math, os, sys, subprocess, json
import numpy as np
from PIL import Image, ImageDraw, ImageFont

OUT = sys.argv[1] if len(sys.argv) > 1 else '../out/clock/film'; os.makedirs(OUT, exist_ok=True)
CAP = '../out/clock'; SW = '../out/sweep40'
W, H, FPS, SR = 720, 1280, 30, 44100
T_TITLE = 2.2; NREC = 1000; T_RUN = NREC / FPS; T_END0 = T_TITLE + T_RUN; DUR = T_END0 + 7.5

def FB(n): return ImageFont.truetype('/usr/share/fonts/truetype/freefont/FreeSansBold.ttf', n)
def FR(n): return ImageFont.truetype('/usr/share/fonts/truetype/freefont/FreeSans.ttf', n)
def FM(n): return ImageFont.truetype('/usr/share/fonts/truetype/freefont/FreeMonoBold.ttf', n)
def FI(n): return ImageFont.truetype('/usr/share/fonts/truetype/freefont/FreeSansOblique.ttf', n)

LOG = {s: [json.loads(l) for l in open(f'{CAP}/s{s}/log.jsonl')] for s in (1, 2, 3)}
SHADOW = {s: float(np.mean(json.load(open(f'{SW}/s{s}.json'))['layers']['traits']['shadowEverAtM'])) for s in (1, 2, 3)}
EVER = {}; NEW = {}
for s, L in LOG.items():
    ever = set(); cum = []; new = []
    for r in L:
        occ = set(r['occ']); nw = occ - ever; ever |= occ; cum.append(len(ever)); new.append(sorted(nw))
    EVER[s] = cum; NEW[s] = new
EVERSET = []; seen = set(); FIRST = {}
for k, nw in enumerate(NEW[1]):
    for c in nw: FIRST[c] = k
for s in (1, 2, 3): print('seed', s, 'cells held', EVER[s][-1], 'drift alone', round(SHADOW[s]), 'ticks', LOG[s][-1]['tick'])

def ease(x): x = min(max(x, 0.0), 1.0); return x * x * (3 - 2 * x)
_bg = {}
def world(k):
    if k not in _bg:
        im = Image.open(f'{CAP}/s1/f/{k:05d}.jpg').convert('RGB').resize((W, int(W * 1280 / 704)), Image.BILINEAR)
        _bg[k] = np.asarray(im.crop((0, 0, W, H)), np.float32)
        if len(_bg) > 80: _bg.pop(next(iter(_bg)))
    return _bg[k]

def txt(d, xy, s, f, fill, anchor='la'): d.text(xy, s, font=f, fill=fill, anchor=anchor)

def run_frame(t):
    k = min(NREC - 1, max(0, int((t - T_TITLE) * FPS)))
    cv = world(k).copy()
    cv[760:] *= 0.18; cv[:760] *= np.linspace(0.8, 0.5, 760)[:, None, None]      # world on top, dimmed panel under it
    img = Image.fromarray(np.clip(cv, 0, 255).astype(np.uint8)); d = ImageDraw.Draw(img, 'RGBA')
    r = LOG[1][k]; tick = r['tick']
    txt(d, (36, 34), 'TICK', FR(16), (170, 170, 190)); txt(d, (36, 52), '{:,}'.format(tick), FM(46), (240, 240, 250))
    txt(d, (W - 36, 34), 'LIVING', FR(16), (170, 170, 190), 'ra'); txt(d, (W - 36, 52), str(r['N']), FM(46), (240, 240, 250), 'ra')
    # trait map: axes 0 x 1 collapsed over axis 2; a cell is lit if ANY of its 10 layers has been held
    x0, y0, cs = 40, 830, 27
    txt(d, (x0, y0 - 30), 'TRAIT TERRITORY', FB(17), (240, 240, 250)); txt(d, (x0 + 190, y0 - 28), 'held now / ever / new', FR(13), (140, 140, 160))
    held_now = set(c // 10 for c in r['occ']); ever_cols = set(); recent = set()
    for kk in range(k + 1):
        for c in NEW[1][kk]:
            ever_cols.add(c // 10)
            if k - kk <= 8: recent.add(c // 10)
    for a in range(10):
        for b in range(10):
            key = a * 10 + b; col = (22, 26, 36, 255)
            if key in ever_cols: col = (40, 100, 110, 255)
            if key in held_now: col = (70, 200, 190, 255)
            if key in recent: col = (255, 190, 60, 255)
            d.rectangle([x0 + a * cs, y0 + b * cs, x0 + a * cs + cs - 3, y0 + b * cs + cs - 3], fill=col)
    # chart: cells ever held (full 3-axis count) against what drift alone reaches
    cx0, cx1, cy0, cy1 = 360, 684, 840, 1090
    hi = 230.0
    def P(i, v): return (cx0 + (cx1 - cx0) * i / (NREC - 1), cy1 - (cy1 - cy0) * v / hi)
    d.rectangle([cx0 - 8, cy0 - 36, cx1 + 8, cy1 + 30], fill=(18, 18, 26, 255))
    txt(d, (cx0, cy0 - 30), 'cells ever held', FB(17), (240, 240, 250))
    sh = P(0, SHADOW[1])[1]
    for xx in range(int(cx0), int(cx1), 14): d.line([(xx, sh), (xx + 7, sh)], fill=(150, 150, 175, 255), width=2)
    txt(d, (cx1, sh - 20), 'drift alone: %d' % round(SHADOW[1]), FR(14), (170, 170, 195), 'ra')
    pts = [P(i, EVER[1][i]) for i in range(0, k + 1, 3)] + [P(k, EVER[1][k])]
    if len(pts) > 1: d.line(pts, fill=(255, 190, 60, 255), width=4)
    d.ellipse([pts[-1][0] - 5, pts[-1][1] - 5, pts[-1][0] + 5, pts[-1][1] + 5], fill=(255, 190, 60, 255))
    txt(d, (pts[-1][0] - 10, pts[-1][1] - 26), str(EVER[1][k]), FM(20), (255, 190, 60), 'ra')
    # the clock: new cells in the last 4,000 ticks
    lo = max(0, k - 100); rate = sum(len(NEW[1][i]) for i in range(lo, k + 1)) / max(1.0, (LOG[1][k]['tick'] - LOG[1][lo]['tick']) / 1000.0) if k > 0 else 0
    txt(d, (36, 1130), 'NEW CELLS PER 1,000 TICKS', FR(14), (150, 150, 170)); txt(d, (36, 1148), '%.1f' % rate, FM(54), (255, 190, 60))
    txt(d, (W - 36, 1130), 'last 4,000 ticks', FR(14), (150, 150, 170), 'ra')
    return np.asarray(img)

def title_frame(t):
    k = 1.0 if t < 1.5 else 1 - ease((t - 1.5) / 0.7)
    img = Image.new('RGB', (W, H), (10, 10, 14)); d = ImageDraw.Draw(img, 'RGBA'); a = int(255 * k * ease(t / 0.5))
    txt(d, (W // 2, 520), 'THE CLOCK', FB(88), (240, 240, 250, a), 'ma')
    txt(d, (W // 2, 640), 'is new territory still arriving', FR(27), (170, 170, 190, a), 'ma')
    txt(d, (W // 2, 678), 'in the real universe?', FR(27), (255, 190, 60, a), 'ma')
    return np.asarray(img)

def end_frame(t):
    e = t - T_END0
    base = run_frame(T_TITLE + T_RUN - 1 / FPS); img = Image.fromarray(base); d = ImageDraw.Draw(img, 'RGBA')
    k = ease(e / 1.0); d.rectangle([0, 0, W, H], fill=(10, 10, 14, int(252 * k)))
    def line(y, s, f, c, t0):
        a = int(255 * ease((e - t0) / 0.8)); txt(d, (W // 2, y), s, f, (*c, a), 'ma')
    line(300, 'Three worlds, 40,000 ticks each.', FB(30), (240, 240, 250), 0.6)
    for i, s in enumerate((1, 2, 3)):
        line(380 + i * 62, 'seed %d:  %d cells held   drift alone: %d' % (s, EVER[s][-1], round(SHADOW[s])), FM(26), (255, 190, 60), 1.4 + 0.5 * i)
    line(610, 'Seed 2 beat its drift line. Seeds 1 and 3 did not.', FR(25), (235, 235, 245), 3.4)
    line(670, 'Novelty did not stop.  It slowed.', FI(32), (255, 255, 255), 4.4)
    line(790, 'The drift lines come from a separate run of the same', FR(17), (150, 150, 170), 5.2)
    line(814, 'seed, so each pair is a reading, not a verdict.', FR(17), (150, 150, 170), 5.2)
    line(850, 'One world per seed.  40,000 ticks says nothing about 400,000.', FR(17), (150, 150, 170), 5.2)
    return np.asarray(img)

def frame(t):
    if t < T_TITLE: return title_frame(t)
    if t < T_END0: return run_frame(t)
    return end_frame(t)

# ---- sound: a click for every record (the clock), a chime for every new cell, and the silence when they thin out
def audio():
    from scipy.io import wavfile
    n = int(DUR * SR); L = np.zeros(n); R = np.zeros(n); rg = np.random.default_rng(3)
    def add(sig, t0, pan=0.0, g=1.0):
        i0 = int(t0 * SR); i1 = min(i0 + len(sig), n)
        if i1 <= i0: return
        L[i0:i1] += sig[:i1 - i0] * g * (1 - max(pan, 0)); R[i0:i1] += sig[:i1 - i0] * g * (1 + min(pan, 0))
    def chime(f, dur=1.6):
        tt = np.arange(int(dur * SR)) / SR
        s = (np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(2 * np.pi * f * 2.01 * tt) + 0.12 * np.sin(2 * np.pi * f * 3.02 * tt)) * np.exp(-tt * 2.6)
        return s * np.minimum(tt / 0.003, 1)
    tick = np.sin(2 * np.pi * 900 * np.arange(int(.012 * SR)) / SR) * np.exp(-np.arange(int(.012 * SR)) / SR * 500)
    PENT = [0, 2, 4, 7, 9]
    for k in range(NREC):
        t0 = T_TITLE + k / FPS
        if k % 3 == 0: add(tick, t0, 0, 0.05)
        for j, c in enumerate(NEW[1][k]):
            a, b, z = c // 100, (c // 10) % 10, c % 10
            deg = a + b; note = 57 + 12 * (deg // 10) + PENT[deg % 5] + 5 * (deg % 2 and 0) + (z % 3) * 0
            f = 440 * 2 ** ((57 + PENT[a % 5] + 12 * (b // 4) + (z // 5) * 12 - 69) / 12)
            add(chime(f), t0 + (0.035 * j if k < 5 else 0.0), (a - 4.5) / 6, 0.10)
    tt = np.arange(n) / SR
    drone = (np.sin(2 * np.pi * 55 * tt) * .5 + np.sin(2 * np.pi * 82.4 * tt) * .25) * 0.06 * np.clip(tt / 2, 0, 1) * np.clip((DUR - tt) / 2.5, 0, 1)
    L += drone; R += drone
    # the end: three low notes, one per seed's line
    for j, off in enumerate((1.4, 1.9, 2.4)):
        add(chime(110 * 2 ** (PENT[j] / 12), 3.0), T_END0 + off, 0, 0.16)
    add(chime(220, 4.0), T_END0 + 4.4, 0, 0.14)
    L = np.tanh(L * 2.4) * 0.6; R = np.tanh(R * 2.4) * 0.6
    wavfile.write(OUT + '/clock.wav', SR, (np.stack([L, R], 1) * 32767).astype(np.int16)); print('audio done')

if __name__ == '__main__':
    sheet = os.environ.get('SHEET')
    if os.environ.get('AUDIO_ONLY'): audio(); sys.exit()
    if sheet:
        a, b, st = [float(x) for x in sheet.split(',')]; ts = list(np.arange(a, b, st)); cols = 6; sc = 0.4
        ims = [Image.fromarray(frame(x)).resize((int(W * sc), int(H * sc))) for x in ts]
        rows = math.ceil(len(ims) / cols); cs = Image.new('RGB', (cols * int(W * sc), rows * int(H * sc)))
        for i, im in enumerate(ims): cs.paste(im, ((i % cols) * int(W * sc), (i // cols) * int(H * sc)))
        cs.save(OUT + '/sheet.png'); sys.exit()
    audio()
    p = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', '%dx%d' % (W, H), '-r', str(FPS), '-i', '-',
                          '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', OUT + '/silent.mp4'], stdin=subprocess.PIPE)
    for f in range(int(DUR * FPS)): p.stdin.write(frame(f / FPS).tobytes())
    p.stdin.close(); p.wait()
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', OUT + '/silent.mp4', '-i', OUT + '/clock.wav', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', OUT + '/the-clock.mp4'], check=True)
