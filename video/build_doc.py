"""'Nobody Asked It To' - a deadpan nature documentary of the REAL universe (engine.html), seed 5.
python3 video/build_doc.py [OUT_DIR]        STILLS=3.5,12 -> only those output seconds, as PNGs
Inputs (made by doc_capture.js and doc_voice.py): out/doc/s5/f/*.jpg + log.jsonl (every frame is the engine's own canvas, every
number on screen and in the narration is its own log), out/doc/voice/l*.wav + lines.json (Kokoro bf_emma, local, free).
Score: made from the same log. One soft pluck for every 100 lineages that end; a drone that changes colour with the two fields.
I cannot hear it: level, peaks, clicks and a spectrogram are checked, the user's ears are the judge. No Modal, no cost."""
import json, os, subprocess, sys, math
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
OUT = sys.argv[1] if len(sys.argv) > 1 else 'out/doc/film'
os.makedirs(OUT, exist_ok=True)
SRC = 'out/doc/s5'
L = [json.loads(l) for l in open(SRC + '/log.jsonl')]
SER = json.load(open(SRC + '/series.json'))
VO = json.load(open('out/doc/voice/lines.json'))
FPS, W, H = 30, 720, 1280
STILLS = [float(x) for x in os.environ['STILLS'].split(',')] if os.environ.get('STILLS') else None

# ---- the plan: one picture span per spoken line, [first source frame, last source frame] ----
# Source frames are 3 engine ticks apart. Beats were checked by eye on contact sheets of the real frames.
SPAN = [(0, 46), (40, 110), (110, 300), (420, 520), (760, 980), (1250, 1860), (1860, 1965), (1985, 2040), (2190, 2252), (2400, 2650)]
FOCUS = ['pink', 'pink', 'pink', 'pink', 'teal', 'teal', 'teal', 'teal', 'square', 'wide']
ZOOM = [(1.0, 1.0), (1.0, 1.25), (1.25, 1.55), (1.45, 1.45), (1.25, 1.1), (1.1, 1.0), (1.0, 1.0), (1.0, 1.0), (1.4, 2.6), (1.6, 1.0)]
GAP, LEAD, TAIL = 0.45, 0.35, 0.3
starts, t = [], 1.0
for m in VO:
    starts.append(t); t += m['sec'] + GAP
seg_t = [0.0] + [s - LEAD for s in starts[1:]]
PIC_END = starts[-1] + VO[-1]['sec'] + TAIL
CARD_T0, CARD_END = PIC_END + 0.4, PIC_END + 0.4 + 3.9
TOTAL = CARD_END

# ---- camera targets from the real frames (pink / teal centroids, the claimed square) ----
def smooth(key):
    xs = [s[key] for s in SER]; out = []; last = None
    for v in xs:
        if v is not None: last = v
        out.append(last)
    first = next(v for v in out if v is not None)
    out = [v if v is not None else first for v in out]
    a = np.array(out, float)
    k = 25; pad = np.pad(a, ((k, k), (0, 0)), mode='edge'); c = np.cumsum(pad, 0)
    return (c[2 * k:] - c[:-2 * k]) / (2 * k)
PINK, TEAL = smooth('pc'), smooth('tc')
SQUARE = {2150: (571, 528), 2200: (272, 647), 2225: (272, 656), 2250: (272, 660)}  # detected from the pixels, see VIDEO.md

def focus_at(kind, f):
    if kind == 'pink': return PINK[int(f)]
    if kind == 'teal': return TEAL[int(f)]
    if kind == 'square': return (272, 655)
    return (352, 640)

_cache = {}
def src(i):
    i = max(0, min(len(L) - 1, i))
    if i not in _cache:
        if len(_cache) > 40: _cache.pop(next(iter(_cache)))
        _cache[i] = Image.open(f'{SRC}/f/{i:05d}.jpg').convert('RGB')
    return _cache[i]

def pic_at(tt):
    """(source frame float, line index, progress in span) for output time tt"""
    k = 0
    for j in range(len(seg_t)):
        if tt >= seg_t[j]: k = j
    t0 = seg_t[k]; t1 = seg_t[k + 1] if k + 1 < len(seg_t) else PIC_END
    u = min(1.0, max(0.0, (tt - t0) / max(1e-6, t1 - t0)))
    e = u * u * (3 - 2 * u) * 0.35 + u * 0.65   # gentle ease, mostly linear
    a, b = SPAN[k]
    return a + (b - a) * e, k, u

FM = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'
FMB = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'
FI = '/usr/share/fonts/truetype/liberation/LiberationSerif-Italic.ttf'
f_small, f_big, f_lab, f_sub, f_card = ImageFont.truetype(FM, 19), ImageFont.truetype(FMB, 62), ImageFont.truetype(FM, 22), ImageFont.truetype(FI, 35), ImageFont.truetype(FI, 54)

def wrap(draw, text, font, maxw):
    words, lines, cur = text.split(), [], ''
    for w in words:
        t = (cur + ' ' + w).strip()
        if draw.textlength(t, font=font) <= maxw: cur = t
        else: lines.append(cur); cur = w
    lines.append(cur); return lines

def text_shadow(d, xy, s, font, fill, anchor='la', sh=2):
    x, y = xy
    d.text((x + sh, y + sh), s, font=font, fill=(0, 0, 0), anchor=anchor)
    d.text((x, y), s, font=font, fill=fill, anchor=anchor)

def render(tt):
    if tt >= CARD_T0:
        im = Image.new('RGB', (W, H), (7, 8, 12)); a = min(1, max(0, (tt - CARD_T0 - 0.5) / 0.8))
        d = ImageDraw.Draw(im, 'RGBA'); c = (int(232 * a), int(226 * a), int(208 * a))
        d.text((W // 2, 650), 'Somebody should look in.', font=f_card, fill=c, anchor='mm')
        return im
    if tt >= PIC_END:
        return Image.new('RGB', (W, H), (7, 8, 12))
    s, k, u = pic_at(tt)
    i0 = int(math.floor(s)); w1 = s - i0
    A = src(i0); B = src(i0 + 1)
    # crop: zoom path and focus drift, clamped inside the frame
    z = ZOOM[k][0] + (ZOOM[k][1] - ZOOM[k][0]) * u
    fx, fy = focus_at(FOCUS[k], s)
    cw, ch = 704 / z, 1280 / z
    cx = min(max(fx, cw / 2), 704 - cw / 2); cy = min(max(fy, ch / 2), 1280 - ch / 2)
    box = (cx - cw / 2, cy - ch / 2, cx + cw / 2, cy + ch / 2)
    a = A.resize((W, H), Image.LANCZOS, box=box)
    if w1 > 0.02: a = Image.blend(a, B.resize((W, H), Image.LANCZOS, box=box), w1)
    # fade in from black at the very start
    if tt < 0.9: a = Image.blend(Image.new('RGB', (W, H), (7, 8, 12)), a, tt / 0.9)
    d = ImageDraw.Draw(a, 'RGBA')
    r = L[min(len(L) - 1, int(round(s)))]
    tick, N, lin, ext = r['tick'], r['N'], r['lin'], r['ext']
    # the documentary's caption: the engine's own numbers, top left
    cap = f"TICK {tick:>5}   ALIVE {N:>3}   BEGUN {lin:>5,}   ENDED {ext:>5,}"
    text_shadow(d, (22, 22), cap, f_small, (230, 226, 210, 215), sh=1)
    # the numbers line: the three counts, large, while they are spoken
    if k == 7:
        v = min(1, max(0, (tt - seg_t[7] - 0.4) / 0.8))
        if v > 0:
            q = L[2000]   # the values the voice reads, held: the corner counter keeps ticking, these do not
            cols = [('BEGUN', f"{q['lin']:,}", (255, 222, 150)), ('ENDED', f"{q['ext']:,}", (160, 170, 190)), ('ALIVE', f"{q['N']:,}", (150, 240, 220))]
            y = 880
            for lab, val, col in cols:
                d.text((W // 2 - 20, y), lab, font=f_lab, fill=(220, 220, 220, int(190 * v)), anchor='ra')
                d.text((W // 2 + 4, y - 18), val, font=f_big, fill=col + (int(255 * v),), anchor='la')
                y += 84
    # a soft dark band under the narration so it reads over the bright fields
    band = Image.new('L', (1, 360)); band.putdata([int(150 * (y / 360) ** 1.4) for y in range(360)])
    a.paste((5, 6, 10), (0, H - 360), band.resize((W, 360)))
    d = ImageDraw.Draw(a, 'RGBA')
    # the claimed square: a ring drawn on, tracked to the detected cell (held still from source frame 2200 to 2250)
    if k == 8:
        v = min(1, max(0, (tt - seg_t[8] - 0.7) / 0.7))
        if v > 0:
            ox = (272 - box[0]) / (box[2] - box[0]) * W; oy = (655 - box[1]) / (box[3] - box[1]) * H
            rad = 40 * z * (W / 704)
            for off in (0, 2):
                d.arc([ox - rad - off, oy - rad - off, ox + rad + off, oy + rad + off], -90, -90 + 360 * v, fill=(250, 245, 230, 235), width=3)
    # narration, burned in
    spoken = None
    for j, m in enumerate(VO):
        if starts[j] - 0.1 <= tt <= starts[j] + m['sec'] + 0.2: spoken = m['text']
    if spoken and k != 7:
        txt = spoken[0].upper() + spoken[1:]
        lines = wrap(d, txt, f_sub, 620); y = 1128 - 20 * (len(lines) - 1)
        for ln in lines:
            text_shadow(d, (W // 2, y), ln, f_sub, (240, 236, 222, 235), anchor='mm', sh=2); y += 46
    # vignette
    return a

# ---- sound ----
SR = 44100
def build_audio():
    n = int(SR * (TOTAL + 0.5)); t = np.arange(n) / SR; out = np.zeros(n)
    rng = np.random.default_rng(11)
    def add(sig, t0, g=1.0):
        i = int(t0 * SR)
        if i >= n: return
        j = min(n, i + len(sig)); out[i:j] += g * sig[:j - i]
    # voice
    voice = np.zeros(n)
    import soundfile as sf
    for j, m in enumerate(VO):
        w, sr = sf.read(f"out/doc/voice/l{j:02d}.wav"); assert sr == SR or True
        if sr != SR:
            x = np.linspace(0, len(w) - 1, int(len(w) * SR / sr)); w = np.interp(x, np.arange(len(w)), w)
        w = w / (np.max(np.abs(w)) + 1e-9) * 0.9
        i = int(starts[j] * SR); voice[i:i + len(w)] += w[:n - i]
    # duck envelope from the voice
    env = np.convolve(np.abs(voice), np.ones(int(0.25 * SR)) / int(0.25 * SR), 'same'); duck = 1 - 0.55 * np.clip(env / 0.08, 0, 1)
    # drone and chords: pink = warm (Bb maj7), teal = cool (D sus2 / lydian), numbers = one low D
    def tone(f, amp=1.0):
        return amp * (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t + 1.1) + 0.12 * np.sin(2 * np.pi * 3 * f * t + 2.0))
    def gate(a0, a1, b0, b1):
        return np.interp(t, [a0, a1, b0, b1], [0, 1, 1, 0], left=0, right=0)
    s = {j: seg_t[j] for j in range(len(seg_t))}
    pink_on = (starts[1] - 0.5, seg_t[5] + 1.0)      # pink present
    teal_on = (seg_t[4] + 0.5, PIC_END)
    d0 = tone(73.42, .5) + tone(110.0, .3)           # D2 + A2 always
    out += d0 * gate(0.3, 3.0, PIC_END - 1.5, PIC_END + 0.4) * 0.05
    warm = tone(116.54, .4) + tone(146.83, .35) + tone(174.61, .3) + tone(220.0, .22)   # Bb2 D3 F3 A3
    out += warm * gate(pink_on[0], pink_on[0] + 3, pink_on[1] - 1, pink_on[1] + 3) * 0.045
    cool = tone(146.83, .4) + tone(220.0, .3) + tone(329.63, .25) + tone(277.18, .2)    # D3 A3 E4 C#4
    out += cool * gate(teal_on[0], teal_on[0] + 4, teal_on[1] - 1.5, teal_on[1] + 0.3) * 0.05
    out *= 1.0
    out *= (0.6 + 0.4 * duck)
    # one soft pluck for every 100 lineages that end, at the film time its source frame is on screen
    notes = [293.66, 261.63 * 1.0, 220.0, 196.0, 164.81]
    last = 0; k = 0
    for tt in np.arange(0, PIC_END, 1 / FPS):
        s_, _, _ = pic_at(tt); r = L[min(len(L) - 1, int(round(s_)))]
        while r['ext'] // 100 > last:
            last += 1
            f0 = notes[last % len(notes)] * 0.5 * (1.0 if last < 20 else 0.75)
            x = np.arange(int(1.4 * SR)) / SR
            ks = np.sin(2 * np.pi * f0 * x) * np.exp(-x / 0.45) + 0.4 * np.sin(2 * np.pi * 2 * f0 * x) * np.exp(-x / 0.2) + 0.15 * np.sin(2 * np.pi * 3.01 * f0 * x) * np.exp(-x / 0.1)
            add(ks * np.minimum(1, x / 0.004), tt, 0.09 * (0.6 + 0.4 * duck[min(n - 1, int(tt * SR))])); k += 1
    if os.environ.get('STEMS'):
        wavfile.write(OUT + '/stem_music.wav', SR, (out / (np.max(np.abs(out)) + 1e-9) * 0.7 * 32767).astype(np.int16)); wavfile.write(OUT + '/stem_voice.wav', SR, (voice * 0.9 * 32767).astype(np.int16))
    print('mix rms dB: music %.1f voice %.1f' % (20 * np.log10(np.sqrt((out ** 2).mean()) + 1e-9), 20 * np.log10(np.sqrt(((voice * .95) ** 2).mean()) + 1e-9)))
    mix = out + voice * 0.95
    mix *= np.clip((PIC_END + 0.5 - t) / 0.5, 0, 1) * np.clip(t / 0.5, 0, 1)
    pk = np.max(np.abs(mix)); mix = mix / pk * 0.72
    st = np.stack([mix, np.roll(mix, 11)], 1)
    wavfile.write(OUT + '/doc.wav', SR, (st * 32767).astype(np.int16)); print('plucks', k)

if os.environ.get('AUDIO_ONLY'):
    build_audio(); sys.exit()
if STILLS is not None:
    for ts in STILLS:
        render(ts).save(f'{OUT}/still_{ts:06.2f}.png')
    print('stills', STILLS, 'total', round(TOTAL, 2)); sys.exit()
print('total', round(TOTAL, 2), 's, picture to', round(PIC_END, 2))
frames = int(round(TOTAL * FPS))
p = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                      '-vf', 'noise=alls=5:allf=t+u,vignette=PI/6', '-c:v', 'libx264', '-crf', '17', '-pix_fmt', 'yuv420p', OUT + '/doc-silent.mp4'], stdin=subprocess.PIPE)
for fi in range(frames):
    p.stdin.write(render(fi / FPS).tobytes())
    if fi % 300 == 0: print('frame', fi, '/', frames, flush=True)
p.stdin.close(); p.wait()
build_audio()
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', OUT + '/doc-silent.mp4', '-i', OUT + '/doc.wav', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', OUT + '/doc.mp4'], check=True)
print('done', OUT + '/doc.mp4')
