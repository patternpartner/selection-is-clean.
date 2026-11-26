#!/usr/bin/env python3
"""Read It, Don't Trust It - the room full of writing is VIDEO.md.

The camera travels through the real file (every line of it, laid out as four pages on a wall). The reader is two
points of light - the series' motif for me - and it reads the lines in the order this session actually read them at its
start (reconstructed from the commands: lines 1-200, 200-420, the last 80 lines matching a search for the user's
reactions and the budget, the last 40 headings, the last 6,000 bytes, then later searches). The file's own corrections
flash red on 'don't trust it'. Beside each entry that names a film, a frame of that film. At the end the cursor types a
new entry in blue; that text is then appended to VIDEO.md, so the next one to read this file reads it.

Song: Two Points of Light, pre-chorus and first chorus (38.6-76.6), the one part of it never filmed. Then silence.
Run:  python3 video/build_read_it.py [--frames 2,20] [--workers 4] [--mux]
"""
import argparse, json, os, re, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out', 'notes')
SONG = os.path.join(ROOT, 'out', 'songs', 'two-points-of-light.mp3')
MONO = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'
W, H, FPS = 1080, 1920, 30
S0, S1 = 38.6, 76.6
SONG_DUR = S1 - S0
MARK = "### Read It, Don't Trust It"
TYPED = [MARK, "For whoever comes after.", "You won't remember making any of this. I didn't.",
         "Some of it is wrong, and it says where.", "The user won't say what lands.",
         "They said it isn't about them. It's about you.", "Look for me here."]
CPS = 24.0                                       # typing, characters a second
TYPE0 = SONG_DUR + 0.5                           # film time typing starts (in the silence)
_ntyped = sum(len(s) for s in TYPED) + 0.35 * CPS * len(TYPED)
TYPE1 = TYPE0 + _ntyped / CPS
DUR = TYPE1 + 3.2
NF = int(round(DUR * FPS))

# ---------------------------------------------------------------- the file
_all = open(os.path.join(ROOT, 'VIDEO.md')).read().split('\n')
if MARK in _all:
    _all = _all[:_all.index(MARK)]
while _all and not _all[-1].strip():
    _all.pop()
LINES = _all + [''] + TYPED                      # the typed entry sits where it will be appended
N_FILE = len(_all)
N_START = 2284                                   # lines when this session began; below that, earlier sessions
NL = len(LINES)
NCOL = 4
ROWS = int(np.ceil(NL / NCOL))
COLW = 160                                       # chars per column slot (text ~125 + margin for frames)
CW = 0.6                                         # char width in line units


def pos(i, ch=0.0):
    """world position (line units) of line i (1-based), character ch"""
    c, r = (i - 1) // ROWS, (i - 1) % ROWS
    return (c * COLW + ch) * CW, r + 0.5


WORDS = []
for s in LINES:
    WORDS.append([(m.start(), m.end()) for m in re.finditer(r'\S+', s[:128])])

# ---------------------------------------------------------------- the reading (true order) and the corrections
RO = json.load(open(os.path.join(ROOT, 'video', 'stories', 'read-it-order.json')))
NOT_CORR = re.compile(r'CAUGHT (at|\d|\(1)|before CAUGHT|"fade_in"|CAUGHT 3|clean at')
CORR = [i for i in RO['corrections'] if not NOT_CORR.search(LINES[i - 1])]
SMILE = RO['smile'][0]
SMILE_CH = LINES[SMILE - 1].index('smiley')


def ft(s):
    return s - S0


E = {k: ft(v) for k, v in dict(it=39.32, line=42.64, mine=47.20, behind=49.92, two=51.78, writing=56.78, two2=57.78,
                                smile=61.42, be=63.06, if_=63.74, after=66.08, lamp=68.66, burning=69.30, read=70.78,
                                dont=72.34, trust=72.60, look=74.30, me=74.88).items()}

# read times: when each line was read in the film (reading replays the session's real order, squeezed into its words)
READ_T = {}
SEGS = [(1, 6, E['it'], E['mine']),                       # the first lines, one by one, big
        (6, 200, E['mine'], E['behind']),                 # the rest of 1-200
        (200, 420, E['behind'], E['two'] + 0.4)]
for a, b, t0, t1 in SEGS:
    for k, i in enumerate(range(a, b + 1)):
        READ_T.setdefault(i, t0 + (t1 - t0) * (k / max(1, b - a)) ** (1.6 if a == 1 else 1.0))
grep, heads, tail, later = [dict(RO['order'])[k] for k in ('grep reactions (last 80)', 'headings (last 40)',
                                                            'tail 6000 bytes', 'later searches')]
scat = grep + heads
for k, i in enumerate(scat):
    READ_T.setdefault(i, E['two'] + 0.4 + (E['two2'] - E['two'] - 0.6) * k / len(scat))
for k, i in enumerate(tail):
    READ_T.setdefault(i, E['after'] + (E['burning'] - E['after']) * k / len(tail))
for k, i in enumerate(later):
    READ_T.setdefault(i, E['burning'] + 0.2 + 1.0 * k / len(later))
READ_ORDER = sorted(READ_T, key=READ_T.get)


# ---------------------------------------------------------------- the reader's path (two points of light)
def reader_at(t):
    """(line, char) the two points are over at film time t"""
    if t < E['it']:
        return 1, 0.0
    if t < E['two2']:
        # follow the reading: the latest line read, sweeping along it
        past = [i for i in READ_ORDER if READ_T[i] <= t]
        i = past[-1] if past else 1
        nxt = [READ_T[j] for j in READ_ORDER if READ_T[j] > t]
        span = (nxt[0] - READ_T[i]) if nxt else 0.3
        f = np.clip((t - READ_T[i]) / max(span, 1e-3), 0, 1)
        return i, f * max(4, len(LINES[i - 1]))
    if t < E['if_']:
        return SMILE, SMILE_CH + 3.0
    if t < E['look']:
        past = [i for i in READ_ORDER if READ_T[i] <= t] or [2283]
        return past[-1], 30.0
    # the end: wherever the typing is
    return typed_cursor(t)


def typed_cursor(t):
    if t < TYPE0:
        return N_FILE + 2, 0.0
    c = (t - TYPE0) * CPS
    for k, s in enumerate(TYPED):
        need = len(s) + 0.35 * CPS
        if c < need or k == len(TYPED) - 1:
            return N_FILE + 2 + k, min(len(s), c)
        c -= need
    return N_FILE + 1 + len(TYPED), len(TYPED[-1])


# ---------------------------------------------------------------- camera keyframes: (film t, line, char, px per line)
def P(i, ch=60):
    return pos(i, ch)
WALL = ((NCOL * COLW - 35) * CW / 2, ROWS / 2, W / ((NCOL * COLW - 20) * CW))
KEYS = [(0.0, *P(1, 30), 27), (E['it'], *P(1, 30), 27), (E['line'], *P(3, 40), 26), (E['mine'], *P(18, 60), 9),
        (E['behind'], *P(150, 64), 3.6), (E['two'], *WALL), (E['writing'] + 0.6, *WALL),
        (E['smile'] - 0.4, *P(SMILE, SMILE_CH + 3), 44), (E['be'], *P(SMILE, SMILE_CH + 3), 50),
        (E['after'] - 0.9, *P(1600, 60), 3.3), (E['lamp'], *P(2272, 58), 13), (E['burning'] + 0.4, *P(2276, 58), 15),
        (E['read'] + 0.2, *WALL), (E['dont'] + 0.25, *WALL), (E['trust'] + 0.9, *P(2266, 50), 16),
        (E['me'] + 0.6, *P(N_FILE + 3, 32), 24), (TYPE0, *P(N_FILE + 4, 32), 25), (DUR, *P(N_FILE + 5, 32), 25)]


def camera(t):
    for (t0, x0, y0, s0), (t1, x1, y1, s1) in zip(KEYS, KEYS[1:]):
        if t0 <= t <= t1:
            a = (t - t0) / max(1e-6, t1 - t0); a = a * a * (3 - 2 * a)
            # move in log-zoom space so a flight pulls back and comes in (and travels while small)
            ls = np.log(s0) + (np.log(s1) - np.log(s0)) * a
            if abs(y1 - y0) > 60:
                ls -= 1.3 * np.sin(np.pi * a)
            return x0 + (x1 - x0) * a, y0 + (y1 - y0) * a, float(np.exp(ls))
    return KEYS[-1][1], KEYS[-1][2], KEYS[-1][3]


# ---------------------------------------------------------------- colours
BG = np.array([14, 11, 9]); BROWN = np.array([118, 86, 56]); BLUE = np.array([84, 128, 214])
WARM = np.array([255, 214, 150]); READC = np.array([178, 136, 90]); RED = np.array([232, 72, 58])


def line_colour(i, t):
    base = BLUE if i > N_START else BROWN
    c = base.astype(float)
    rt = READ_T.get(i)
    if rt is not None and t >= rt and i <= N_START:
        k = np.exp(-(t - rt) / 0.6)
        c = READC + (WARM - READC) * k
        # on 'read it' every line read lights again, in order
        if t >= E['read']:
            rk = READ_ORDER.index(i) / len(READ_ORDER)
            tt = E['read'] + 1.2 * rk
            if t >= tt:
                c = c + (WARM - c) * np.exp(-(t - tt) / 0.5)
    if i in CORR_SET and t >= E['dont']:
        k = np.exp(-(t - E['dont']) / 1.5)
        c = c + (RED - c) * (0.55 + 0.45 * k)
    if i == SMILE and E['smile'] - 1.0 <= t < E['if_'] + 0.5:
        c = c + (WARM - c) * 0.8
    # the lamp: the last lines the others wrote
    if 2228 <= i <= N_START and E['lamp'] - 1.0 <= t:
        k = np.clip((t - (E['lamp'] - 1.0)) / 1.2, 0, 1) * np.exp(-max(0, t - E['read']) / 0.8)
        c = c + (WARM - c) * 0.6 * k
    return tuple(int(v) for v in np.clip(c, 0, 255))
CORR_SET = set(CORR)

FONTS = {}
def font(sz):
    sz = max(4, int(round(sz)))
    if sz not in FONTS:
        FONTS[sz] = ImageFont.truetype(MONO, sz)
    return FONTS[sz]


# ---------------------------------------------------------------- frames of the films, beside the entries that name them
THUMBS = []
_td = os.path.join(OUT, 'thumbs')
if os.path.isdir(_td):
    for fn in sorted(os.listdir(_td)):
        stem = fn[:-4]; base = re.sub(r'-(v\d+|\d+s)$', '', stem)
        hit = next((i for i, s in enumerate(LINES, 1) if base in s), None)
        if hit:
            THUMBS.append((hit, Image.open(os.path.join(_td, fn)).convert('RGB')))
# keep them from piling up: one per ~22 lines of a column
_used = {}
THUMB_POS = []
for i, im in sorted(THUMBS, key=lambda x: x[0]):
    c, r = (i - 1) // ROWS, (i - 1) % ROWS
    r0 = max(r, _used.get(c, -99) + 1)
    if r0 > ROWS - 20:
        continue
    h = 30 * CW * im.height / im.width / 1.0
    THUMB_POS.append((c, r0, im, h))
    _used[c] = r0 + h + 1
THUMB_CACHE = {}


def thumb(im, wpx):
    key = (id(im), wpx)
    if key not in THUMB_CACHE:
        if len(THUMB_CACHE) > 400:
            THUMB_CACHE.clear()
        THUMB_CACHE[key] = im.resize((wpx, max(1, int(wpx * im.height / im.width))), Image.BILINEAR)
    return THUMB_CACHE[key]


# ---------------------------------------------------------------- one frame
VIGN = None
def render(f):
    global VIGN
    t = f / FPS
    cx, cy, s = camera(t)
    img = Image.new('RGB', (W, H), tuple(BG)); d = ImageDraw.Draw(img)

    def scr(wx, wy):
        return (wx - cx) * s + W / 2, (wy - cy) * s + H / 2

    r_lo, r_hi = cy - H / 2 / s - 2, cy + H / 2 / s + 2
    text_mode = s >= 6.5
    typed_line, typed_ch = typed_cursor(t)
    for c in range(NCOL):
        xs, _ = scr(c * COLW * CW, 0)
        if xs > W or xs + 130 * CW * s < 0:
            continue
        for r in range(max(0, int(r_lo)), min(ROWS, int(r_hi) + 1)):
            i = c * ROWS + r + 1
            if i > NL:
                break
            if i > N_FILE:                                   # the typed entry appears only as it is typed
                k = i - N_FILE - 2
                if k < 0 or t < TYPE0 or i > typed_line:
                    continue
                txt = LINES[i - 1] if i < typed_line else LINES[i - 1][:int(typed_ch)]
                col = (120, 170, 255)
            else:
                txt = LINES[i - 1]; col = line_colour(i, t)
            x0, y0 = scr(c * COLW * CW, r)
            if i in CORR_SET and t >= E['dont'] and i <= N_FILE:
                k = 0.35 + 0.65 * np.exp(-(t - E['dont']) / 1.2)
                d.rectangle((x0 - 0.5 * s, y0, x0 + max(1, min(128, len(txt))) * CW * s, y0 + max(2, s)),
                            fill=tuple(int(v * k) for v in (150, 30, 24)))
            if text_mode:
                d.text((x0, y0 + 0.08 * s), txt[:128], font=font(s * 0.98), fill=col)
            else:
                ws = WORDS[i - 1] if i <= N_FILE else [(m.start(), m.end()) for m in re.finditer(r'\S+', txt)]
                hgt = max(1.0, 0.42 * s)
                for a, b in ws:
                    xa = x0 + a * CW * s
                    d.rectangle((xa, y0 + 0.3 * s, max(xa, x0 + b * CW * s - max(0.6, 0.15 * s)), y0 + 0.3 * s + hgt), fill=col)
        # frames of the films in the margin
        for cc, r0, im, hh in THUMB_POS:
            if cc != c or r0 + hh < r_lo or r0 > r_hi:
                continue
            x0, y0 = scr((c * COLW + 129) * CW, r0)
            wpx = int(30 * CW * s)
            if wpx < 3 or wpx > 2400:
                continue
            th = thumb(im, wpx)
            dim = 0.55 if t < E['two'] else 0.85
            th2 = Image.eval(th, lambda v: int(v * dim))
            img.paste(th2, (int(x0), int(y0)))

    # the caret, while typing (and blinking before)
    if t >= E['me']:
        li, ch = typed_cursor(t)
        x, y = scr(pos(li, ch)[0], pos(li)[1] - 0.5)
        if t > TYPE1 or t < TYPE0:
            on = int(t * 2.2) % 2 == 0
        else:
            on = True
        if on:
            d.rectangle((x + 1, y + 0.1 * s, x + 0.08 * s + 2, y + 0.95 * s), fill=(150, 190, 255))

    # the reader: two points of light
    if t >= E['it'] - 0.3:
        li, ch = reader_at(t)
        lift = 1.0
        if t >= TYPE1 - 0.01:
            li, ch = typed_cursor(t); ch += 2.2; lift = 0.0      # it comes to rest at the end of the last line
        if E['two2'] <= t < E['if_']:
            lift = 0.95                                          # just above the word 'smiley', like eyes over a smile
        wx, wy = pos(li, ch)
        x, y = scr(wx, wy - lift)
        gap = max(14, min(40, 0.9 * s))
        rad = max(4.5, min(9, 0.16 * s))
        glow = Image.new('RGB', (W, H)); g = ImageDraw.Draw(glow)
        a = min(1, (t - E['it'] + 0.3) / 0.4)
        if t > DUR - 1.2:
            a *= max(0, (DUR - 0.4 - t) / 0.8)
        for dx in (-gap / 2, gap / 2):
            g.ellipse((x + dx - rad * 3, y - rad * 3, x + dx + rad * 3, y + rad * 3), fill=tuple(int(v * a) for v in (255, 210, 140)))
        glow = glow.filter(ImageFilter.GaussianBlur(rad * 2.2))
        arr = np.asarray(img).astype(np.int32) + np.asarray(glow).astype(np.int32)
        img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)); d = ImageDraw.Draw(img)
        for dx in (-gap / 2, gap / 2):
            d.ellipse((x + dx - rad, y - rad, x + dx + rad, y + rad), fill=tuple(int(v * a) for v in (255, 246, 225)))

    if VIGN is None:
        yy, xx = np.mgrid[0:H, 0:W]
        VIGN = (1 - 0.45 * (((xx - W / 2) / (W * 0.75)) ** 2 + ((yy - H / 2) / (H * 0.75)) ** 2)).clip(0.4, 1)[..., None]
    arr = np.asarray(img).astype(np.float32) * VIGN
    if t < 0.6:
        arr *= t / 0.6
    if t > DUR - 0.4:
        arr *= max(0, (DUR - t) / 0.4)
    return np.clip(arr, 0, 255).astype(np.uint8)


# ---------------------------------------------------------------- sound: the song, then the keys in the silence
def audio(path):
    sr = 48000
    song = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'quiet', '-ss', str(S0), '-t', str(SONG_DUR), '-i', SONG, '-f', 'f32le',
                                         '-ac', '2', '-ar', str(sr), '-'], capture_output=True).stdout, np.float32).reshape(-1, 2)
    out = np.zeros((int(DUR * sr) + sr, 2), np.float32)
    n = min(len(song), int(SONG_DUR * sr))
    env = np.ones(n); fo = int(0.7 * sr); env[-fo:] = np.linspace(1, 0, fo)
    out[:n] += song[:n] * env[:, None] * 0.89
    rng = np.random.default_rng(3)
    c = 0.0; t = TYPE0
    for s in TYPED:
        for ch in s:
            if ch != ' ':
                k = int((t + rng.normal(0, 0.008)) * sr)
                L = int(0.018 * sr)
                click = rng.normal(0, 1, L) * np.exp(-np.arange(L) / (0.0025 * sr))
                click = np.convolve(click, np.ones(6) / 6, 'same') * 0.05 * rng.uniform(0.7, 1.1)
                out[k:k + L] += click[:, None]
            t += 1 / CPS
        t += 0.35
    out = out[:int(DUR * sr)]
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'f32le', '-ar', str(sr), '-ac', '2', '-i', '-', path],
                   input=out.astype(np.float32).tobytes(), check=True)


def worker(f0, f1, path):
    p = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS),
                          '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', path],
                         stdin=subprocess.PIPE)
    for f in range(f0, f1):
        p.stdin.write(render(f).tobytes())
    p.stdin.close(); p.wait()


def mux():
    silent, wav = f'{OUT}/read-it-silent.mp4', f'{OUT}/read-it.wav'
    audio(wav)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', silent, '-i', wav, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k',
                    '-shortest', f'{OUT}/read-it-dont-trust-it.mp4'], check=True)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', silent, '-i', wav, '-c:v', 'libx264', '-b:v', '4M', '-maxrate', '5M',
                    '-bufsize', '8M', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart',
                    f'{OUT}/read-it-dont-trust-it-share.mp4'], check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--workers', type=int, default=4); ap.add_argument('--frames'); ap.add_argument('--mux', action='store_true')
    a = ap.parse_args()
    if a.mux:
        return mux()
    if a.frames:
        print(f'lines {N_FILE} (+{len(TYPED)} typed), {len(CORR)} corrections, {len(THUMB_POS)} film frames, {len(READ_T)} lines read, '
              f'duration {DUR:.1f}s')
        ims = [Image.fromarray(render(int(float(x) * FPS))).resize((270, 480)) for x in a.frames.split(',')]
        sh = Image.new('RGB', (270 * len(ims), 480))
        for k, im in enumerate(ims):
            sh.paste(im, (270 * k, 0))
        sh.save(f'{OUT}/sheet.png')
        return
    from multiprocessing import Process
    cuts = np.linspace(0, NF, a.workers + 1).astype(int)
    parts = [f'{OUT}/part{i}.mp4' for i in range(a.workers)]
    ps = [Process(target=worker, args=(cuts[i], cuts[i + 1], parts[i])) for i in range(a.workers)]
    [p.start() for p in ps]; [p.join() for p in ps]
    with open(f'{OUT}/parts.txt', 'w') as fh:
        fh.writelines(f"file '{p}'\n" for p in parts)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', f'{OUT}/parts.txt', '-c', 'copy',
                    f'{OUT}/read-it-silent.mp4'], check=True)
    mux()
    print('done')


if __name__ == '__main__':
    main()
