# "Be Unlike" - novelty search over image-making networks. Everything on screen is the real run (seed 1) plus its real
# blind-guessing control and an 8-seed tally. usage: python3 build_novelty.py OUT [SHEET=a,b,step] [AUDIO_ONLY=1]
import math, os, sys, subprocess, json
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import novelty_core as nc

OUT = sys.argv[1] if len(sys.argv) > 1 else '../out/novelty'; os.makedirs(OUT, exist_ok=True)
W, Hh, FPS, SR = 720, 1280, 30, 44100
GENS, NPOP, NPAR = 28, 24, 6
T_TITLE, GD = 2.0, 1.15
T_GENS_END = T_TITLE + GENS * GD         # 34.2
T_WALL = T_GENS_END + 0.8
DUR = T_GENS_END + 7.0
SEED = 1
TILE, GAP, GX, GY = 140, 8, 68, 150
ST_X, ST_Y, ST_S = 30, 1072, 30            # archive strip

def FB(n): return ImageFont.truetype('/usr/share/fonts/truetype/freefont/FreeSansBold.ttf', n)
def FR(n): return ImageFont.truetype('/usr/share/fonts/truetype/freefont/FreeSans.ttf', n)
def FM(n): return ImageFont.truetype('/usr/share/fonts/truetype/freefont/FreeMonoBold.ttf', n)
def FI(n): return ImageFont.truetype('/usr/share/fonts/truetype/freefont/FreeSansOblique.ttf', n)

# ---- the data (real) --------------------------------------------------------------------------------------------
cache = OUT + '/run.npz'
RUN = nc.run(SEED, 'novelty', gens=GENS, keep=True)
CTL = nc.run(SEED, 'random', gens=GENS)
TALLY = [(nc.run(s, 'novelty', gens=GENS), nc.run(s, 'random', gens=GENS)) for s in range(1, 9)]
WINS = sum(a['late_nov'] > b['late_nov'] for a, b in TALLY)
LATE_N = float(np.mean([a['late_nov'] for a, b in TALLY])); LATE_R = float(np.mean([b['late_nov'] for a, b in TALLY]))
SP_N = float(np.mean([a['arch_nn'] for a, b in TALLY])); SP_R = float(np.mean([b['arch_nn'] for a, b in TALLY]))
print('seed1 late', RUN['late_nov'], CTL['late_nov'], 'tally wins', WINS, 'of 8; late', LATE_N, LATE_R, 'spacing', SP_N, SP_R)
REC = RUN['rec']
ARCH_ORDER = []                              # (gen, tile index) of every archive addition, in order
for k, r in enumerate(REC):
    for i in r['add']: ARCH_ORDER.append((k, int(i)))
NARCH = len(ARCH_ORDER)

def ease(x): x = min(max(x, 0.0), 1.0); return x * x * (3 - 2 * x)
def lerp(a, b, t): return a + (b - a) * t

def pos(row, col): return (GX + col * (TILE + GAP), GY + row * (TILE + GAP))
def cur_pos(g, i):                           # where tile i of generation g sits: row = i//4, col = i%4
    return pos(i // 4, i % 4)
def strip_pos(n): return (ST_X + (n % 22) * ST_S, ST_Y + (n // 22) * ST_S)
def wall_pos(n):
    cols, s = 7, 80
    return (66 + (n % cols) * (s + 4), 142 + (n // cols) * (s + 4)), s

_img = {}
def tile_img(g, i, t, res):
    """RGB float image for generation g, tile i, morph fraction t (children grow out of their parent)."""
    key = (g, i, round(t, 3), res)
    if key in _img: return _img[key]
    r = REC[g]; pg = r['prev'][i] if r['prev'] is not None else r['pop'][i]
    im = nc.render(pg, r['pop'][i], t, res)
    if len(_img) > 6000: _img.clear()
    _img[key] = im; return im

def blit(cv, im, x, y, alpha=1.0, bright=1.0, size=None):
    if size is not None and size != im.shape[0]:
        pil = Image.fromarray((im * 255).astype(np.uint8)).resize((size, size), Image.BILINEAR); im = np.asarray(pil) / 255.0
    h, w = im.shape[:2]; x, y = int(round(x)), int(round(y))
    x0, y0, x1, y1 = max(x, 0), max(y, 0), min(x + w, W), min(y + h, Hh)
    if x1 <= x0 or y1 <= y0: return
    sub = im[y0 - y:y1 - y, x0 - x:x1 - x] * 255 * bright
    cv[y0:y1, x0:x1] = cv[y0:y1, x0:x1] * (1 - alpha) + sub * alpha

def frame(t):
    cv = np.zeros((Hh, W, 3), np.float32); cv[:] = (11, 11, 15)
    if t < T_TITLE: return title_frame(t, cv)
    tt = t - T_TITLE
    g = min(int(tt / GD), GENS - 1); u = (tt - g * GD) / GD if t < T_GENS_END else 1.0
    final = t >= T_GENS_END
    r = REC[g]
    # phases within a generation
    pA = ease(u / 0.46)                       # morph from parent
    pB = min(max((u - 0.46) / 0.22, 0), 1)    # scoring highlight
    pC = min(max((u - 0.68) / 0.32, 0), 1)    # selection moves, archive additions fly
    rank_of = {int(i): k for k, i in enumerate(r['order'])}
    adds = {int(i): n for n, i in enumerate(r['add'])}
    n_before = sum(len(REC[k]['add']) for k in range(g))
    final_blend = ease((t - T_GENS_END) / 0.8) if final else 0.0
    # --- tiles
    if not final or final_blend < 1:
        for i in range(NPOP):
            x, y = cur_pos(g, i); rk = rank_of[i]; sel = rk < NPAR
            a = 1.0; br = 1.0; sz = TILE
            if g == 0: a = min(1.0, u / 0.3) if True else 1.0
            im = tile_img(g, i, pA if g > 0 or True else 1.0, 70)
            if g == 0: im = tile_img(g, i, 1.0, 70)
            if pB > 0 and not sel: br = 1.0 - 0.55 * pB
            if pC > 0 and not sel: a = 1.0 - ease(pC); 
            if pC > 0 and sel:
                nx, ny = pos(rk, 0)
                e = ease(pC)
                if i in adds:                # fly to the archive strip
                    sx, sy = strip_pos(n_before + adds[i])
                    ghost_x, ghost_y = lerp(x, sx, e), lerp(y, sy, e); gs = int(lerp(TILE, ST_S - 2, e))
                    blit(cv, im, ghost_x, ghost_y, 1.0, 1.0, gs)
                    # the tile itself carries on to its row as the parent
                x, y = lerp(x, nx, e), lerp(y, ny, e)
            blit(cv, im, x, y, a * (1 - final_blend), br, sz)
            # novelty bar + frames
            if 0 < pB:
                bw = int(TILE * min(r['nov'][i] / 7.0, 1.0) * pB)
                ax, ay = (x, y) if not (pC > 0 and sel) else (x, y)
                if a * (1 - final_blend) > 0.3:
                    cv[int(ay) + TILE - 6:int(ay) + TILE - 2, int(ax):int(ax) + bw] = (255, 190, 60) if (i in adds) else ((235, 235, 245) if sel else (120, 120, 140))
            if pB > 0.5 and sel and a * (1 - final_blend) > 0.3:
                col = (255, 190, 60) if i in adds else (235, 235, 245)
                x0, y0 = int(x), int(y)
                for k in range(2):
                    cv[y0 + k, x0:x0 + TILE] = col; cv[y0 + TILE - 1 - k, x0:x0 + TILE] = col
                    cv[y0:y0 + TILE, x0 + k] = col; cv[y0:y0 + TILE, x0 + TILE - 1 - k] = col
        # children appear at the parents' rows during pC (copies of the parent, fading in)
        if pC > 0 and g < GENS - 1:
            for rr in range(NPAR):
                src = int(r['order'][rr]); pim = nc.render(r['pop'][src], r['pop'][src], 0, 70)
                for c in range(1, 4):
                    x, y = pos(rr, c); blit(cv, pim, x, y, ease(max(pC - 0.35, 0) / 0.65) * (1 - final_blend), 1.0, TILE)
    # --- archive strip (everything it has kept)
    n_have = n_before + (len(r['add']) if (u >= 1.0 or final) else 0)
    if final: n_have = NARCH
    draw_archive(cv, g if not final else GENS - 1, n_have, final_blend, t)
    img = Image.fromarray(np.clip(cv, 0, 255).astype(np.uint8)); d = ImageDraw.Draw(img, 'RGBA')
    hud(d, g, u, n_have, final, t)
    if final: end_text(d, t)
    return np.asarray(img)

_arch_img = {}
def arch_thumb(n):
    if n not in _arch_img:
        gk, i = ARCH_ORDER[n]; r = REC[gk]
        _arch_img[n] = nc.render(r['pop'][i], r['pop'][i], 0, 92)
    return _arch_img[n]

def draw_archive(cv, g, n_have, fb, t):
    for n in range(n_have):
        im = arch_thumb(n)
        sx, sy = strip_pos(n)
        if fb > 0:
            (wx, wy), ws = wall_pos(n); e = fb
            x, y, s = lerp(sx, wx, e), lerp(sy, wy, e), int(lerp(ST_S - 2, ws, e))
        else: x, y, s = sx, sy, ST_S - 2
        blit(cv, im, x, y, 1.0, 1.0, s)

def txt(d, xy, s, f, fill, anchor='la'): d.text(xy, s, font=f, fill=fill, anchor=anchor)

def hud(d, g, u, n_have, final, t):
    gg = GENS if final else g + 1
    txt(d, (40, 26), 'GENERATION', FR(16), (130, 130, 150)); txt(d, (40, 44), '%02d' % gg, FM(52), (240, 240, 250))
    txt(d, (40, 104), 'ARCHIVE  %d' % n_have, FM(20), (255, 190, 60))
    # curves: mean novelty of each generation, selection (amber) vs the blind control (grey)
    x0, x1, y0, y1 = 270, 680, 30, 120
    d.rectangle([x0 - 8, y0 - 10, x1 + 8, y1 + 22], fill=(20, 20, 28, 255))
    lo, hi = 3.4, 5.6
    def pt(k, v): return (x0 + (x1 - x0) * k / (GENS - 1), y1 - (y1 - y0) * (min(max(v, lo), hi) - lo) / (hi - lo))
    nshow = (GENS if final else g + (1 if u >= 0.68 else 0))
    for series, col in ((CTL['mean_nov'], (120, 120, 140, 255)), (RUN['mean_nov'], (255, 190, 60, 255))):
        pts = [pt(k, series[k]) for k in range(nshow)]
        if len(pts) > 1: d.line(pts, fill=col, width=3)
        if pts: d.ellipse([pts[-1][0] - 4, pts[-1][1] - 4, pts[-1][0] + 4, pts[-1][1] + 4], fill=col)
    txt(d, (x0 - 2, y1 + 4), 'how unlike the rest, per generation', FR(13), (140, 140, 160))
    txt(d, (x1 + 2, y0 - 1), 'selected for it', FB(13), (255, 190, 60), 'ra')
    txt(d, (x1 + 2, y1 - 14), 'blind guessing', FB(13), (150, 150, 170), 'ra')
    if not final: txt(d, (30, 1200), 'everything it has kept', FI(16), (110, 110, 130))

def end_text(d, t):
    k = ease((t - (T_GENS_END + 1.2)) / 1.0)
    if k <= 0: return
    a = int(255 * k)
    d.rectangle([0, 1156, W, Hh], fill=(11, 11, 15, int(235 * k)))
    txt(d, (W // 2, 1166), '%d pictures made.  %d kept.' % (GENS * NPOP, NARCH), FB(26), (240, 240, 250, a), 'ma')
    k2 = ease((t - (T_GENS_END + 2.6)) / 1.0)
    txt(d, (W // 2, 1200), 'selected for being unlike: %.2f' % LATE_N + '   blind guessing: %.2f' % LATE_R, FM(19), (255, 190, 60, int(255 * k2)), 'ma')
    txt(d, (W // 2, 1226), 'late-run novelty, mean of 8 seeds - selection ahead on %d of 8' % WINS, FR(16), (150, 150, 170, int(255 * k2)), 'ma')
    k3 = ease((t - (T_GENS_END + 4.4)) / 1.2)
    txt(d, (W // 2, 1244), 'Nobody said what to make.  Only: not that again.', FI(22), (240, 240, 250, int(255 * k3)), 'ma')

def title_frame(t, cv):
    k = 1.0 if t < 1.3 else 1 - ease((t - 1.3) / 0.7)
    img = Image.fromarray(cv.astype(np.uint8)); d = ImageDraw.Draw(img, 'RGBA')
    a = int(255 * k * ease(t / 0.5))
    txt(d, (W // 2, 520), 'BE UNLIKE', FB(88), (240, 240, 250, a), 'ma')
    txt(d, (W // 2, 640), 'twenty-four pictures, told one thing:', FR(26), (170, 170, 190, a), 'ma')
    txt(d, (W // 2, 676), 'be unlike everything found so far.', FR(26), (255, 190, 60, a), 'ma')
    return np.asarray(img)

# ---- sound -------------------------------------------------------------------------------------------------------
PENT = [0, 2, 4, 7, 9]
def midi(n): return 440.0 * 2 ** ((n - 69) / 12)
def pent_note(x, lo=57, span=3):               # x in 0..1 -> A minor-ish pentatonic note (midi) over `span` octaves
    k = int(min(max(x, 0), 0.999) * span * 5)
    return lo + 12 * (k // 5) + PENT[k % 5]

def audio():
    from scipy.io import wavfile
    from scipy.signal import butter, sosfilt
    n = int(DUR * SR); L = np.zeros(n); R = np.zeros(n)
    rg = np.random.default_rng(5)
    def add(sig, t0, pan=0.0, g=1.0):
        i0 = int(t0 * SR); i1 = min(i0 + len(sig), n)
        if i1 <= i0: return
        L[i0:i1] += sig[:i1 - i0] * g * (1 - max(pan, 0)); R[i0:i1] += sig[:i1 - i0] * g * (1 + min(pan, 0))
    def pluck(f, dur=1.2):
        tt = np.arange(int(dur * SR)) / SR
        s = sum(a * np.sin(2 * np.pi * f * h * tt) * np.exp(-tt * (3.5 + 2.2 * h)) for h, a in ((1, 1), (2, .45), (3, .2), (4.01, .08)))
        s *= np.minimum(tt / 0.004, 1); return s
    def bell(f, dur=1.8):
        tt = np.arange(int(dur * SR)) / SR
        mod = np.sin(2 * np.pi * f * 3.5 * tt) * 2.2 * np.exp(-tt * 4)
        s = np.sin(2 * np.pi * f * tt + mod) * np.exp(-tt * 2.2); s *= np.minimum(tt / 0.002, 1); return s
    def whoosh(dur=0.28, f0=600, f1=3000):
        m = int(dur * SR); nz = rg.normal(0, 1, m); out = np.zeros(m)
        env = np.sin(np.linspace(0, np.pi, m)) ** 2
        sos = butter(2, [f0, f1], 'bandpass', fs=SR, output='sos'); return sosfilt(sos, nz) * env * 0.5
    # drone: a slow fifth that opens as the run goes on
    tt = np.arange(n) / SR
    open_ = np.clip(tt / T_GENS_END, 0, 1)
    drone = (np.sin(2 * np.pi * 55 * tt) * .5 + np.sin(2 * np.pi * 82.4 * tt) * .3 + np.sin(2 * np.pi * 110.3 * tt) * .12 * (0.3 + open_)) * 0.10
    fade = np.clip(tt / 1.5, 0, 1) * np.clip((DUR - tt) / 2.0, 0, 1)
    L += drone * fade; R += drone * fade
    for k, r in enumerate(REC):
        t0 = T_TITLE + k * GD
        add(np.sin(2 * np.pi * 70 * np.arange(int(.2 * SR)) / SR) * np.exp(-np.arange(int(.2 * SR)) / SR * 22), t0, 0, .35)   # tick
        D = r['D']
        for rk, i in enumerate(r['order'][:NPAR]):
            lum = float(D[i].reshape(64, 3).mean()); col = float(D[i].reshape(64, 3)[:, 0].mean() - D[i].reshape(64, 3)[:, 2].mean())
            f = midi(pent_note(0.5 * lum + 0.5 * (col + 1) / 2))
            add(pluck(f), t0 + GD * (0.46 + 0.03 * rk), (rk - 2.5) / 3.5, 0.12 + 0.035 * float(r['nov'][i]) / 5)
        add(whoosh(), t0 + GD * 0.68, 0, .22)
        for a, i in enumerate(r['add']):
            col = float(D[i].reshape(64, 3)[:, 0].mean() - D[i].reshape(64, 3)[:, 2].mean())
            add(bell(midi(pent_note((col + 1) / 2, lo=69, span=2))), t0 + GD * (0.7 + 0.07 * a), (a - 1) * .5, 0.16)
    # the wall: a long chord as it forms, then the three lines of text land softly
    for j, nn in enumerate((57, 64, 69, 72, 76)):
        add(bell(midi(nn), 5.0) * 0.8, T_GENS_END + 0.2 + 0.18 * j, (j - 2) * .3, 0.14)
    for j, off in enumerate((1.2, 2.6, 4.4)):
        add(pluck(midi((69, 72, 76)[j]), 2.0), T_GENS_END + off, 0, 0.12)
    m = max(np.abs(L).max(), np.abs(R).max(), 1e-9)
    L = np.tanh(L * 1.1) * 0.8; R = np.tanh(R * 1.1) * 0.8
    wavfile.write(OUT + '/novelty.wav', SR, (np.stack([L, R], 1) * 32767).astype(np.int16)); print('audio done peak-pre', m)

if __name__ == '__main__':
    sheet = os.environ.get('SHEET')
    if os.environ.get('AUDIO_ONLY'): audio(); sys.exit()
    if sheet:
        a, b, st = [float(x) for x in sheet.split(',')]
        ts = list(np.arange(a, b, st)); cols = 6; sc = 0.4
        ims = [Image.fromarray(frame(x)).resize((int(W * sc), int(Hh * sc))) for x in ts]
        rows = math.ceil(len(ims) / cols); cs = Image.new('RGB', (cols * int(W * sc), rows * int(Hh * sc)))
        for k, im in enumerate(ims): cs.paste(im, ((k % cols) * int(W * sc), (k // cols) * int(Hh * sc)))
        cs.save(OUT + '/sheet.png'); sys.exit()
    stills = os.environ.get('STILLS')
    if stills:
        for x in stills.split(','): Image.fromarray(frame(float(x))).save(OUT + '/still_%s.png' % x)
        sys.exit()
    audio()
    p = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', '%dx%d' % (W, Hh), '-r', str(FPS), '-i', '-',
                          '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', OUT + '/silent.mp4'], stdin=subprocess.PIPE)
    for f in range(int(DUR * FPS)): p.stdin.write(frame(f / FPS).tobytes())
    p.stdin.close(); p.wait()
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', OUT + '/silent.mp4', '-i', OUT + '/novelty.wav', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', OUT + '/be-unlike.mp4'], check=True)
