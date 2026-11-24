#!/usr/bin/env python3
"""Only What Moves - Perfect Absence's medium on the real universe.

Every frame is TV static. Each living creature of a real recorded run (video/static_universe.js) is a disc of static it
carries with it; a child is born carrying its parent's patch. Nothing in the world is changed by the film: the song's
lines change only the medium (walls that flow, patches that shrink, grain that coarsens, a substrate that falls so the
dead leave still shadows, a freeze while the world runs on unfilmed).

Song: No Ground 0.0-90.0 (its opening, never used before), then a card.
Run:  python3 video/build_only_what_moves.py RUN_DIR [--frames 5,30] [--workers 4] [--mux]
"""
import argparse, json, os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from only_read import load

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out', 'only')
SONG = os.path.join(ROOT, 'out', 'songs', 'no-ground.mp3')
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
W, H, FPS, N = 1080, 1920, 30, 1024
S0, S1 = 0.0, 90.0
SONG_DUR = S1 - S0
CARD = 5.5
DUR = SONG_DUR + CARD
NF = int(round(DUR * FPS))

# words (faster-whisper small on the track, out/songs/no-ground-words.json)
E = dict(walls=2.40, me=4.06, vision=8.70, fade=11.40, denser=16.64, us=19.40, losing=25.00, focus=26.84,
         concrete=32.26, shadow=34.56, deepening=40.38, coldness=42.34, hush=56.6, brk=62.14, free=63.54,
         right=70.40, now=71.80, take=78.26, down=79.66, no=83.98, crowd=84.68, last=88.4)


def ramp(t, a, b):
    return float(np.clip((t - a) / max(1e-6, b - a), 0, 1))


def sm(x):
    return x * x * (3 - 2 * x)


rng = np.random.default_rng(3)
def tile():
    return (rng.random((N, N)) ** 0.85 * 255).astype(np.uint8)
T_BG, T_CRE, T_WALL, T_SHADOW, T_TEXT = (tile() for _ in range(5))
YY, XX = np.mgrid[0:H, 0:W]


# ---------------------------------------------------------------- the medium's schedule
def cell(t):
    """grain: 6 px, coarsening to 30 on 'losing all my focus' and back (in whole steps)"""
    a = sm(ramp(t, E['losing'], E['focus'] + 0.3)) * (1 - sm(ramp(t, E['focus'] + 1.6, E['concrete'] - 1.0)))
    return int(6 + 4 * round(6 * a))


def bg_vy(t):
    """the substrate: still, then falling from 'concrete holds the shadow', slowing through the coldness to a stop"""
    v = 4.0 * sm(ramp(t, E['concrete'], E['concrete'] + 0.8))
    v *= 1 - 0.65 * sm(ramp(t, E['deepening'], E['coldness'] + 3))
    v *= 1 - sm(ramp(t, E['hush'] - 2.5, E['hush']))
    return v


def patch_scale(t):
    s = 1 - 0.7 * sm(ramp(t, E['vision'], E['fade']))
    s += 0.8 * sm(ramp(t, E['denser'], E['us']))
    return s


def walls_on(t):
    """the world's walls flow from 'walls' until 'vision'; flow is what makes them visible"""
    return sm(ramp(t, E['walls'] - 0.2, E['me'])) * (1 - sm(ramp(t, E['vision'], E['fade'])))


# record index (fractional) at each film frame: one record (3 ticks) a frame; frozen in the hush; on 'break free' the
# world is shown 1,500 ticks on (run unfilmed during the hush) and runs at two records a frame
SKIP = 500
def rec_index(t):
    hush0, brk = E['hush'], E['brk']
    if t < hush0:
        return t * FPS
    if t < brk:
        return hush0 * FPS
    return hush0 * FPS + SKIP + (t - brk) * FPS * 2


# ---------------------------------------------------------------- the world
class World:
    def __init__(self, run):
        self.F, births = load(run)
        meta = json.load(open(os.path.join(run, 'meta.json')))
        self.sx, self.sy = W / meta['W'], H / meta['H']
        key = {}
        r = np.random.default_rng(99)
        for u in sorted(births):
            p = births[u][0]
            key[u] = key[p] if p > 0 and p in key else (int(r.integers(0, N * 6)), int(r.integers(0, N * 6)))
        self.key = key
        self.r = np.random.default_rng(98)
        # the world grows past its canvas (creatures range over about 1,400 x 2,900 by tick 4,500): a slow camera keeps
        # the bulk of the population (2nd-98th percentile box, smoothed over ~8 s of records) in a 9:16 frame
        box = np.array([np.r_[np.percentile(p[:, 0], [2, 98]), np.percentile(p[:, 1], [2, 98])] for _, _, p, _ in self.F])
        k = 241
        pad = np.pad(box, ((k // 2, k // 2), (0, 0)), mode='edge')
        box = np.array([np.convolve(pad[:, j], np.ones(k) / k, 'valid') for j in range(4)]).T
        self.cam_c = np.c_[(box[:, 0] + box[:, 1]) / 2, (box[:, 2] + box[:, 3]) / 2]
        self.cam_h = np.maximum((box[:, 3] - box[:, 2]) * 1.12, (box[:, 1] - box[:, 0]) * 1.12 * H / W)
        self.idx = [dict(zip(u.tolist(), range(len(u)))) for _, u, _, _ in self.F]

    def keyof(self, u):
        if u not in self.key:
            self.key[u] = (hash((u, 1)) % (N * 6), hash((u, 2)) % (N * 6))
        return self.key[u]

    def at(self, rf):
        """uids, screen positions (float), sizes at fractional record rf (positions interpolated)"""
        i = min(int(np.floor(rf)), len(self.F) - 2); a = rf - i
        _, u0, p0, s0 = self.F[i]; _, u1, p1, _ = self.F[i + 1]
        d1 = self.idx[i + 1]
        pos = p0.copy()
        if a > 0:
            j = np.array([d1.get(u, -1) for u in u0.tolist()])
            ok = j >= 0
            jump = np.hypot(*(p1[j[ok]] - p0[ok]).T) < 120
            sel = np.where(ok)[0][jump]
            pos[sel] = p0[sel] + a * (p1[j[sel]] - p0[sel])
        c = self.cam_c[i] + a * (self.cam_c[i + 1] - self.cam_c[i])
        h = self.cam_h[i] + a * (self.cam_h[i + 1] - self.cam_h[i])
        return u0, (pos - c) * (H / h) + (W / 2, H / 2), s0, self.F[i][0]


def text_mask(lines, size, y0, gap):
    m = Image.new('L', (W, H)); d = ImageDraw.Draw(m)
    f = ImageFont.truetype(FONT, size)
    y = y0
    for ln in lines:
        w = d.textlength(ln, font=f)
        d.text(((W - w) / 2, y), ln, font=f, fill=255, stroke_width=4, stroke_fill=255)
        y += gap
    return np.array(m) > 0


CARD_LINES = ('Every frame', 'of this film', 'is static.', '', 'Everything', 'that moved', 'was alive.')

BAND = 30   # px, the walls' depth


class Film:
    def __init__(self, run):
        self.w = World(run)
        bo = np.zeros(NF); y = 0.0
        for f in range(NF):
            y += bg_vy(f / FPS); bo[f] = round(y)
        self.bg_off = bo
        self.wall_flow = np.round(np.cumsum([10 * walls_on(k / FPS) for k in range(NF)])).astype(int)
        self.card_dx = np.round(np.cumsum([3 * sm(ramp(k / FPS - SONG_DUR, 0.2, 0.7)) *
                                           (1 - sm(ramp(k / FPS - SONG_DUR, CARD - 1.1, CARD - 0.5)))
                                           for k in range(NF)])).astype(int)
        # deaths, for the shadows: (frame, x, y, r, kx, ky) of every creature that dies while the substrate falls
        self.deaths = []
        prev = None
        for f in range(int(E['concrete'] * FPS), int(E['hush'] * FPS)):
            t = f / FPS
            u, pos, sz, _ = self.w.at(rec_index(t))
            cur = dict(zip(u.tolist(), range(len(u))))
            if prev is not None:
                for uu, k in prev[0].items():
                    if uu not in cur:
                        kx, ky = self.w.keyof(uu)
                        self.deaths.append((f, prev[1][k][0], prev[1][k][1], prev[2][k], kx, ky))
            prev = (cur, pos, self.radius(sz, t))
        self.deaths = np.array(self.deaths) if self.deaths else np.zeros((0, 6))
        # the last one: the oldest creature alive at 'no crowd'
        # (alive from the word to the end, so it is still moving when everyone else has stopped)
        # the one that travels furthest between the word and the stop (so it is plainly the one still moving)
        ts = np.arange(E['crowd'], SONG_DUR - 1.6, 1 / FPS)
        snaps = [dict(zip(u.tolist(), p)) for u, p, _, _ in (self.w.at(rec_index(t)) for t in ts)]
        common = set(snaps[0]).intersection(*snaps[1:])
        def path(uu):
            pts = np.array([sn[uu] for sn in snaps])
            inside = (pts[:, 0] > 120).all() and (pts[:, 0] < W - 120).all() and (pts[:, 1] > 200).all() and (pts[:, 1] < H - 200).all()
            return np.hypot(*np.diff(pts, axis=0).T).sum() if inside else 0
        self.last = int(max(common, key=path))
        self.last_path = path(self.last)

    def radius(self, sz, t):
        return np.clip(np.round((7 + sz * 4.0) * patch_scale(t)), 3, 40).astype(int)

    def render(self, f):
        """drawn on the CELL GRID: every creature is a set of whole cells and its texture moves in whole cells, so a
        frame is the same grid of independent cells everywhere (nothing to find in a still) and every motion is an
        exact whole-cell copy (which H.264 predicts, so compression does not smear what moves)"""
        t = f / FPS
        C = cell(t)
        R, K = (H + C - 1) // C, (W + C - 1) // C
        rr, cc = grid(C)
        frozen = t >= SONG_DUR - 1.6
        tt = min(t, SONG_DUR - 1.6) if frozen else t
        G = T_BG[(rr - int(self.bg_off[f]) // C) % N, cc % N]

        # walls: texture flowing clockwise round the edge
        wa = walls_on(t)
        if wa > 0:
            ws, wd = wall_cells(C)
            band = wd < max(1, round(BAND / C * wa)) if wa > 0.05 else wd < 0
            flow = self.wall_flow[f] // C
            G = np.where(band, T_WALL[wd % N, (ws - flow) % N], G)

        def cells(pos):
            return np.round(pos[:, 0] / C).astype(int), np.round(pos[:, 1] / C).astype(int)

        # shadows of the dead: still where they died, shrinking away over three seconds
        if len(self.deaths):
            D = self.deaths
            age = (min(f, int(E['hush'] * FPS)) - D[:, 0]) / FPS   # the shadows freeze with the world
            live = (age >= 0) & (age < 3)
            if live.any():
                d = D[live]; k = 1 - age[live] / 3
                rc = d[:, 3] * np.sqrt(k) / C
                m = rc >= 0.5
                cx, cy = cells(d[m, 1:3])
                cstamp(G, T_SHADOW, cx, cy, rc[m], (d[m, 4] // C).astype(int), (d[m, 5] // C).astype(int))

        # the living
        u, pos, sz, tick = self.w.at(rec_index(tt))
        rad = self.radius(sz, tt)
        if t >= E['crowd']:
            # no crowd: everyone present at the word is held where they were (still, so gone); only one keeps moving
            hu, hpos, hsz, _ = self.w.at(rec_index(E['crowd']))
            me = dict(zip(u.tolist(), range(len(u)))).get(self.last)
            hpos = hpos.copy(); hrad = self.radius(hsz, E['crowd'])
            k = np.where(hu == self.last)[0]
            if me is not None and len(k):
                hpos[k[0]] = pos[me]; hrad[k[0]] = max(hrad[k[0]], 34)
                order = np.r_[np.delete(np.arange(len(hu)), k[0]), k[0]]   # drawn last, over the held ones
                hu, hpos, hrad = hu[order], hpos[order], hrad[order]
            u, pos, rad = hu, hpos, hrad
        cx, cy = cells(pos)
        ks = np.array([self.w.keyof(uu) for uu in u.tolist()]).reshape(-1, 2) // C
        cstamp(G, T_CRE, cx, cy, rad / C, ks[:, 0], ks[:, 1])

        if E['denser'] - 0.3 <= t < E['losing']:
            m = cmask((f'{len(u):,}',), 150, 120, 0, C)
            G[m] = T_TEXT[((rr[m] - f // 2) % N), cc[m] % N]
        if t >= SONG_DUR:
            m = cmask(CARD_LINES, 104, 430, 132, C)
            G[m] = T_TEXT[rr[m] % N, (cc[m] - self.card_dx[f] // C) % N]

        img = np.repeat(np.repeat(G, C, 0), C, 1)[:H, :W]
        v = img.astype(np.float32)
        return np.clip(np.stack([v * 0.88 + 6, v * 0.95 + 4, v + 2], -1), 0, 255).astype(np.uint8)


_GRID, _WALL, _CM, _DISC = {}, {}, {}, {}
def grid(C):
    if C not in _GRID:
        _GRID[C] = np.mgrid[0:(H + C - 1) // C, 0:(W + C - 1) // C]
    return _GRID[C]


def wall_cells(C):
    if C not in _WALL:
        rr, cc = grid(C); R, K = rr.shape
        d = np.minimum.reduce([rr, R - 1 - rr, cc, K - 1 - cc])
        s = np.where(rr == d, cc, np.where(K - 1 - cc == d, K + rr, np.where(R - 1 - rr == d, K + R + (K - cc),
                     2 * K + R + (R - rr))))
        _WALL[C] = (s, d)
    return _WALL[C]


def cmask(lines, size, y0, gap, C):
    key = (lines, size, y0, gap, C)
    if key not in _CM:
        if len(_CM) > 64:
            _CM.clear()
        m = text_mask(list(lines), size, y0, gap)
        _CM[key] = m[C // 2::C, C // 2::C][:(H + C - 1) // C, :(W + C - 1) // C]
    return _CM[key]


def cstamp(G, T, cx, cy, rc, kx, ky):
    """discs of whole cells: disc i centred on cell (cx,cy), radius rc cells; its texture fixed to it (key kx,ky)"""
    R, K = G.shape
    rq = np.maximum(0.5, np.round(rc * 2) / 2)
    ys, xs, oy, ox = [], [], [], []
    for r in np.unique(rq):
        if r not in _DISC:
            n = int(np.ceil(r))
            y, x = np.mgrid[-n:n + 1, -n:n + 1]
            m = x * x + y * y <= r * r + 0.3
            _DISC[r] = (y[m], x[m])
        dy, dx = _DISC[r]
        sel = rq == r
        ys.append((cy[sel][:, None] + dy[None]).ravel()); xs.append((cx[sel][:, None] + dx[None]).ravel())
        oy.append(np.repeat(ky[sel] - cy[sel], len(dy))); ox.append(np.repeat(kx[sel] - cx[sel], len(dy)))
    if not ys:
        return
    ys, xs, oy, ox = (np.concatenate(v) for v in (ys, xs, oy, ox))
    ok = (ys >= 0) & (ys < R) & (xs >= 0) & (xs < K)
    ys, xs, oy, ox = ys[ok], xs[ok], oy[ok], ox[ok]
    G[ys, xs] = T[(ys + oy) % N, (xs + ox) % N]


def worker(run, f0, f1, path):
    film = Film(run)
    p = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}',
                          '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '10',
                          '-pix_fmt', 'yuv420p', path], stdin=subprocess.PIPE)
    for f in range(f0, f1):
        p.stdin.write(film.render(f).tobytes())
    p.stdin.close(); p.wait()


def mux():
    silent, wav = f'{OUT}/only-what-moves-silent.mp4', f'{OUT}/only-what-moves.wav'
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', SONG, '-af',
                    f'atrim={S0}:{S1},asetpts=PTS-STARTPTS,afade=t=out:st={SONG_DUR - 1.6}:d=1.6,volume=-1dB,'
                    f'apad=whole_dur={DUR}', '-ar', '48000', '-ac', '2', wav], check=True)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', silent, '-i', wav, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k',
                    '-shortest', f'{OUT}/only-what-moves.mp4'], check=True)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', silent, '-i', wav, '-c:v', 'libx264', '-b:v', '2300k',
                    '-maxrate', '3200k', '-bufsize', '6M', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k',
                    '-shortest', '-movflags', '+faststart', f'{OUT}/only-what-moves-share.mp4'], check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('run')
    ap.add_argument('--workers', type=int, default=4)
    ap.add_argument('--frames')
    ap.add_argument('--mux', action='store_true')
    a = ap.parse_args()
    os.makedirs(OUT, exist_ok=True)
    if a.mux:
        return mux()
    if a.frames:
        film = Film(a.run)
        print('deaths filmed as shadows', len(film.deaths), 'last one uid', film.last, 'travels', round(film.last_path), 'px')
        for s in a.frames.split(','):
            f = int(float(s) * FPS)
            x0, x1 = film.render(f), film.render(f + 1)
            Image.fromarray(x1).resize((540, 960)).save(f'{OUT}/frame-{s}.png')
            d = np.abs(x1.astype(int) - x0.astype(int)).max(-1)
            Image.fromarray(np.clip(d * 2, 0, 255).astype(np.uint8)).resize((540, 960)).save(f'{OUT}/diff-{s}.png')
        return
    from multiprocessing import Process
    cuts = np.linspace(0, NF, a.workers + 1).astype(int)
    parts = [f'{OUT}/part{i}.mp4' for i in range(a.workers)]
    ps = [Process(target=worker, args=(a.run, cuts[i], cuts[i + 1], parts[i])) for i in range(a.workers)]
    [p.start() for p in ps]; [p.join() for p in ps]
    with open(f'{OUT}/parts.txt', 'w') as fh:
        fh.writelines(f"file '{p}'\n" for p in parts)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', f'{OUT}/parts.txt', '-c', 'copy',
                    f'{OUT}/only-what-moves-silent.mp4'], check=True)
    mux()
    print('done')


if __name__ == '__main__':
    main()
