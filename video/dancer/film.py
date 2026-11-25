#!/usr/bin/env python3
"""Bred by the Song - the film. Everything shown is simulated from the real run: generation 0's crowd, the champion's
own ancestors (traced through the parent records to the generations whose populations were saved), the champion, and
the final population. Nothing is keyframed; every body is the physics driven by its evolved brain hearing the song.

Usage: python3 video/dancer/film.py RUN_DIR [--frames 10,30] [--workers 4] [--mux]
"""
import argparse, json, os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sim

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SONG = os.path.join(ROOT, 'out', 'songs', 'the-iron-ballroom.mp3')
OUT = os.path.join(ROOT, 'out', 'dancer')
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
W, H, FPS = 1080, 1920, 30
STEEL = (178, 186, 198); DIM = (92, 98, 108); YEL = (255, 200, 40)

FULL = sim.song_features(SONG, 0, 100)
BEAT, PH = FULL['beat_len'], FULL['phase']
def bar(k):
    return PH + 4 * BEAT * k

T0 = bar(4)                      # film starts (song time)
MONT0 = bar(9)                   # the ancestors
CHAMP0 = bar(25)                 # the champion alone
DROP = bar(35) + 2 * BEAT        # the drop (63.0 by loudness)
T1 = bar(41)                     # song ends here (faded)
SONG_DUR = T1 - T0
CARD = 6.5
DUR = SONG_DUR + CARD
NF = int(round(DUR * FPS))
ANC_GENS = [1, 2, 3, 5, 8, 12, 20, 30, 45, 70, 100, 150, 200, 250]
ANC_BARS = [1] * 12 + [2, 2]


def feats(t0, t1):
    i0, i1 = int(round(t0 * sim.FPS_SIM)), int(round(t1 * sim.FPS_SIM))
    return {k: (v[i0:i1] if isinstance(v, np.ndarray) else v) for k, v in FULL.items()}


class Plan:
    def __init__(self, run):
        self.run = run
        log = json.load(open(os.path.join(run, 'log.json')))
        parent = {int(k): v for k, v in log['parent'].items()}
        last = max(int(f[4:7]) for f in os.listdir(run) if f.startswith('pop_'))
        z = np.load(os.path.join(run, f'pop_{last:03d}.npz'))
        # the champion: the final population's best over the whole stretch it dances in the film
        F = feats(CHAMP0, T1)
        r = sim.simulate(z['pop'], F)
        fit = sim.fitness(r, F)
        o = np.argsort(-fit)
        self.last_gen = last
        self.champ = z['pop'][o[0]]; cid = int(z['ids'][o[0]])
        self.crowd_last = z['pop'][o[1:24]]
        line = [cid]
        while line[-1] in parent:
            line.append(parent[line[-1]])
        line = set(line)
        self.anc = []
        for g in ANC_GENS:
            p = os.path.join(run, f'pop_{g:03d}.npz')
            if not os.path.exists(p):
                continue
            zz = np.load(p)
            hit = [i for i, x in enumerate(zz['ids']) if int(x) in line]
            if hit:
                self.anc.append((g, zz['pop'][hit[0]]))
        z0 = np.load(os.path.join(run, 'pop_000.npz'))
        self.crowd0 = z0['pop'][:24]
        anc0 = [i for i, x in enumerate(z0['ids']) if int(x) in line]
        self.anc0 = anc0[0] if anc0 else None
        # shots: (t_start, t_end, kind, data)
        self.shots = [(T0, MONT0, 'crowd', dict(gen=0, genomes=self.crowd0))]
        t = MONT0
        for (g, w), nb in zip(self.anc, ANC_BARS[-len(self.anc):] if len(self.anc) < len(ANC_BARS) else ANC_BARS):
            self.shots.append((t, t + nb * 4 * BEAT, 'solo', dict(gen=g, genomes=w[None])))
            t += nb * 4 * BEAT
        self.shots.append((t, T1, 'champ', dict(gen=last, genomes=np.r_[self.champ[None], self.crowd_last])))
        self.rec = {}
        for i, (a, b, kind, d) in enumerate(self.shots):
            F = feats(a, b + 0.1)
            self.rec[i] = sim.simulate(d['genomes'], F, record=True)['rec'][::2]   # 60 Hz -> 30 fps
        self.champ_fit = float(fit[o[0]])


def capsule(d, a, b, w, col):
    d.line([tuple(a), tuple(b)], fill=col, width=int(w))
    for p in (a, b):
        d.ellipse((p[0] - w / 2, p[1] - w / 2, p[0] + w / 2, p[1] + w / 2), fill=col)


def draw_body(d, pts, sc, ox, floor, col, joint=None):
    P = np.c_[ox + pts[:, 0] * sc, floor - pts[:, 1] * sc]
    capsule(d, P[1], P[2], 0.15 * sc, col)
    for a, b in sim.BONES:
        if (a, b) in ((1, 2), (0, 1)):
            continue
        capsule(d, P[a], P[b], 0.075 * sc, col)
    capsule(d, P[0], P[1], 0.07 * sc, col)
    r = 0.125 * sc
    d.ellipse((P[0][0] - r, P[0][1] - r * 1.1, P[0][0] + r, P[0][1] + r * 1.1), fill=col)
    if joint:
        for j in (4, 6, 8, 10):
            q = 0.035 * sc
            d.ellipse((P[j][0] - q, P[j][1] - q, P[j][0] + q, P[j][1] + q), fill=joint)


FONT_L = ImageFont.truetype(FONT, 46)
FONT_S = ImageFont.truetype(FONT, 30)
FONT_C = ImageFont.truetype(FONT, 62)


def stage(floor):
    img = Image.new('RGB', (W, H), (6, 6, 8))
    a = np.zeros((H, W), np.float32)
    yy, xx = np.mgrid[0:H, 0:W]
    # a cone of light from above and its pool on the floor
    cone = np.clip(1 - np.abs(xx - W / 2) / (120 + 0.33 * yy), 0, 1) * (yy < floor) * 0.10
    pool = np.exp(-(((xx - W / 2) / 420) ** 2 + ((yy - floor - 40) / 90) ** 2)) * 0.55 * (yy >= floor - 4)
    a = cone + pool
    base = np.stack([a * 200, a * 200, a * 190], -1) + 6
    floorband = (yy >= floor) * 10
    base += floorband[..., None]
    return np.clip(base, 0, 255).astype(np.uint8)
STAGES = {}


class Film:
    def __init__(self, run):
        self.p = Plan(run)

    def shot_at(self, st):
        for i, (a, b, kind, d) in enumerate(self.p.shots):
            if a <= st < b:
                return i
        return len(self.p.shots) - 1

    def render(self, f):
        t = f / FPS
        st = T0 + min(t, SONG_DUR - 1e-3)
        floor = 1480
        if floor not in STAGES:
            STAGES[floor] = stage(floor)
        img = Image.fromarray(STAGES[floor].copy())
        body = Image.new('RGB', (W, H)); bd = ImageDraw.Draw(body)
        glow = Image.new('RGB', (W, H)); gd = ImageDraw.Draw(glow)
        i = self.shot_at(st)
        a, b, kind, data = self.p.shots[i]
        rec = self.p.rec[i]
        k = min(int((st - a) * FPS), len(rec) - 1)
        X = rec[k]
        label = None
        if kind == 'crowd':
            rows = [(0.34, 1150, 6, DIM), (0.46, 1300, 5, DIM), (0.62, floor, 4, STEEL)]
            n = 0
            for sc_, fl, cnt, col in rows:
                for j in range(cnt):
                    if n >= len(X):
                        break
                    ox = W * (j + 0.5) / cnt
                    draw_body(bd, X[n] - [0, 0], 530 * sc_, ox, fl, col)
                    n += 1
            label = 'GENERATION 0'
        elif kind == 'solo':
            x0 = X[0, 2, 0]
            draw_body(bd, X[0] - [x0, 0], 530, W / 2, floor, STEEL, joint=YEL)
            label = f'GENERATION {data["gen"]}'
        else:
            # the champion; from the drop the final population dances behind it
            if st >= DROP:
                a2 = min(1, (st - DROP) / 0.25)
                col = tuple(int(c * a2) for c in DIM)
                for j in range(1, min(len(X), 15)):
                    row = (j - 1) // 7
                    cnt = 7
                    sc_ = 0.36 if row == 0 else 0.5
                    fl = 1150 if row == 0 else 1300
                    ox = W * (((j - 1) % cnt) + 0.5) / cnt
                    draw_body(bd, X[j] - [X[j, 2, 0], 0], 530 * sc_, ox, fl, col)
            x0 = X[0, 2, 0]
            draw_body(bd, X[0] - [x0, 0], 560, W / 2, floor, (226, 230, 236), joint=YEL)
            draw_body(gd, X[0] - [x0, 0], 560, W / 2, floor, YEL)
            label = f'GENERATION {data["gen"]}'
        # glow, reflection
        g = glow.filter(ImageFilter.GaussianBlur(22))
        arr = np.asarray(img).astype(np.int32) + np.asarray(body).astype(np.int32)
        arr += (np.asarray(g).astype(np.float32) * 0.45).astype(np.int32)
        ref = np.asarray(body)[2 * floor - H:floor][::-1].astype(np.float32)
        fade = np.linspace(0.32, 0, ref.shape[0])[:, None, None]
        arr[floor:H] += (ref * fade).astype(np.int32)[:H - floor]
        img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
        d = ImageDraw.Draw(img)
        if label and t < SONG_DUR:
            w_ = d.textlength(label, font=FONT_L)
            d.text(((W - w_) / 2, 210), label, font=FONT_L, fill=YEL)
        if t >= SONG_DUR - 0.6:
            k2 = min(1, (t - SONG_DUR + 0.6) / 0.6)
            arr = (np.asarray(img).astype(np.float32) * (1 - k2)).astype(np.uint8)
            img = Image.fromarray(arr); d = ImageDraw.Draw(img)
        if t >= SONG_DUR:
            tt = t - SONG_DUR
            lines = [('Nobody choreographed this.', 0.3), ('', 0), ('192 bodies a generation.', 1.2),
                     ('Only the ones that moved', 2.1), ('to this song had children.', 2.1), ('', 0),
                     (f'{self.p.last_gen + 1} generations.', 3.2)]
            y = 640
            for s, at in lines:
                if s and tt >= at:
                    al = min(1, (tt - at) / 0.5)
                    col = tuple(int(c * al) for c in ((255, 255, 255) if 'children' not in s and 'moved' not in s else YEL))
                    w_ = d.textlength(s, font=FONT_C if s.startswith('Nobody') else FONT_L)
                    d.text(((W - w_) / 2, y), s, font=FONT_C if s.startswith('Nobody') else FONT_L, fill=col)
                y += 80 if s else 50
        return np.asarray(img)


def worker(run, f0, f1, path):
    film = Film(run)
    p = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS),
                          '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', path],
                         stdin=subprocess.PIPE)
    for f in range(f0, f1):
        p.stdin.write(film.render(f).tobytes())
    p.stdin.close(); p.wait()


def mux():
    silent, wav = f'{OUT}/bred-by-the-song-silent.mp4', f'{OUT}/bred-by-the-song.wav'
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', SONG, '-af',
                    f'atrim={T0}:{T1},asetpts=PTS-STARTPTS,afade=t=out:st={SONG_DUR - 0.6}:d=0.6,volume=-1dB,apad=whole_dur={DUR}',
                    '-ar', '48000', '-ac', '2', wav], check=True)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', silent, '-i', wav, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k',
                    '-shortest', f'{OUT}/bred-by-the-song.mp4'], check=True)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', silent, '-i', wav, '-c:v', 'libx264', '-b:v', '2800k', '-maxrate', '4M',
                    '-bufsize', '6M', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart',
                    f'{OUT}/bred-by-the-song-share.mp4'], check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('run'); ap.add_argument('--workers', type=int, default=4)
    ap.add_argument('--frames'); ap.add_argument('--mux', action='store_true')
    a = ap.parse_args()
    if a.mux:
        return mux()
    if a.frames:
        film = Film(a.run)
        print('shots', [(round(x[0] - T0, 1), x[2], x[3]['gen']) for x in film.p.shots], 'champ fit', round(film.p.champ_fit, 3))
        ims = [Image.fromarray(film.render(int(float(s) * FPS))).resize((270, 480)) for s in a.frames.split(',')]
        sh = Image.new('RGB', (270 * len(ims), 480))
        for i, im in enumerate(ims):
            sh.paste(im, (270 * i, 0))
        sh.save(f'{OUT}/sheet.png')
        return
    from multiprocessing import Process
    cuts = np.linspace(0, NF, a.workers + 1).astype(int)
    parts = [f'{OUT}/part{i}.mp4' for i in range(a.workers)]
    ps = [Process(target=worker, args=(a.run, cuts[i], cuts[i + 1], parts[i])) for i in range(a.workers)]
    [p.start() for p in ps]; [p.join() for p in ps]
    with open(f'{OUT}/parts.txt', 'w') as fh:
        fh.writelines(f"file '{p}'\n" for p in parts)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', f'{OUT}/parts.txt', '-c', 'copy',
                    f'{OUT}/bred-by-the-song-silent.mp4'], check=True)
    mux()
    print('done')


if __name__ == '__main__':
    main()
