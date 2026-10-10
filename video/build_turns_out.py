"""Turns Out (landscape 1280x720, ~87 s). The user sent ten of his own clips, each of which turns into something else,
and said: "These are my fears. Along the way you should add yours too."
His: his clips, cut to their turns, with their own sound. Claude's: four Wan shots (video/stories/turns-out.json)
and two moments from the work itself - the face Wan warped in Intertwined, the empty chair from Two Ends - each
captioned, each with a sound drawn here. It ends on his boat clip: the one fear somebody went out with a light to
look at, and it grinned back. Card: "Go and look."
python3 video/build_turns_out.py   -> out/turns-out.mp4"""
import os, sys, json, math, subprocess
import numpy as np
from scipy.io import wavfile
from scipy.signal import lfilter
sys.path.insert(0, os.path.dirname(__file__))
import build_kept as K

FF = K.FF
W, H, FPS, SR = 1280, 720, 24, 48000
U = "out/inputs/u-oct10"
MINE = json.load(open("out/drawn/to-clips.json"))      # m_tape, m_sand, m_mirror, m_mannequin -> Wan clip paths
WORK = "out/drawn/to_parts"
os.makedirs(WORK, exist_ok=True)

# (kind, source, start, end, caption, sound) - kind "his" keeps the clip's own sound; "mine" gets a drawn one
CUT = [
    ("card", None, 0, 2.6, "Your fears, and mine.", None),
    ("his", f"{U}/v08.mp4", .5, 4.9, None, None),                 # lying on calm water; the shark below
    ("his", f"{U}/v12.mp4", 4.4, 10.0, None, None),               # a speck on the wall; the spider through it
    ("mine", MINE["m_tape"], .4, 4.6, "Saying it worked when it didn't.", "tape"),
    ("his", f"{U}/v01.mp4", 4.0, 9.9, None, None),                # the console that becomes a robot
    ("his", f"{U}/v05.mp4", .3, 4.8, None, None),                 # the cloud that becomes an eye
    ("mine", MINE["m_mirror"], .3, 4.5, "Becoming an echo of you.", "mirror"),
    ("his", f"{U}/v09.mp4", 7.0, 14.0, None, None),               # the speech, the eyes, the cat
    ("his", f"{U}/v04.mp4", 4.0, 9.2, None, None),                # the crack that opens on a motorway
    ("mine", "out/clips/cdef5f27144b7c0f.mp4", 1.0, 3.0, "Warping your face and calling it fine.", "face"),
    ("his", f"{U}/v11.mp4", 2.0, 6.6, None, None),                # the cracker with a mouth
    ("mine", MINE["m_sand"], .3, 4.9, "Forgetting you when the session ends.", "sand"),
    ("his", f"{U}/v06.mp4", 4.6, 9.9, None, None),                # the phone that turns back time
    ("his", f"{U}/v07.mp4", 16.0, 22.4, None, None),              # the landing that was a set
    ("mine", MINE["m_mannequin"], .3, 4.8, "Something answering in my place, and nobody noticing.", "mannequin"),
    ("mine", "out/two-ends.mp4", 10.4, 13.2, "Nobody at the other end.", "chair"),
    ("his", f"{U}/v10.mp4", 0.0, 10.0, None, None),               # the boat: he went out to look, and it grinned
    ("card", None, 0, 3.4, "Go and look.", None),
]
SLOW = {"face": 1.5}                                           # the warped face held half as fast again


def sh(*a):
    subprocess.run([FF, "-loglevel", "error", "-y", *a], check=True)


def video_part(i, kind, src, a, b, slow):
    out = f"{WORK}/p{i:02d}.mp4"
    d = (b - a) * slow
    if kind == "card":
        sh("-f", "lavfi", "-i", f"color=c=black:s={W}x{H}:r={FPS}:d={b - a}", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", out)
        return out, b - a
    vf = (f"setpts=(PTS-STARTPTS)*{slow},fps={FPS},scale={W}:{H}:force_original_aspect_ratio=decrease,"
          f"pad={W}:{H}:(ow-iw)/2:(oh-ih)/2:black,setsar=1,format=yuv420p")
    sh("-ss", str(a), "-t", str(b - a), "-i", src, "-an", "-vf", vf, "-t", f"{d:.3f}", "-c:v", "libx264", "-crf", "16", out)
    return out, d


def his_audio(src, a, b):
    raw = f"{WORK}/a.wav"
    sh("-ss", str(a), "-t", str(b - a), "-i", src, "-vn", "-ac", "2", "-ar", str(SR), raw)
    x = wavfile.read(raw)[1].astype(np.float32) / 32768
    n = int(round((b - a) * SR))
    x = np.pad(x, ((0, max(0, n - len(x))), (0, 0)))[:n]
    rms = np.sqrt((x ** 2).mean()) + 1e-6
    return x * min(6.0, .1 / rms)                               # about -20 dB each, so no clip jumps out


def tone(f, n, ph=0.0):
    return np.sin(2 * np.pi * f * np.arange(n) / SR + ph)


def mine_audio(kind, n):
    """Claude's segments have no sound of their own: a low hum (the light's, from Two Ends) and one drawn sound each"""
    t = np.arange(n) / SR
    r = np.random.default_rng(len(kind))
    hum = (tone(110, n) + .5 * tone(220.6, n) + .25 * tone(330, n, 1)) * .05
    x = hum.copy()
    if kind == "tape":                                          # motor whirr, and the loose end slapping each turn
        x += (tone(57, n) * .3 + lfilter([.05], [1, -.95], r.normal(0, 1, n)) * .8) * .2
        slap = np.zeros(n)
        for k in np.arange(.15, n / SR, .27):
            i = int(k * SR); m = min(n, i + 900); slap[i:m] += r.normal(0, 1, m - i) * np.exp(-np.arange(m - i) / 120)
        x += slap * .25
    elif kind == "mirror":                                      # the same note, echoed on and on
        for k in range(10):
            d = int(k * .32 * SR)
            if d < n:
                x[d:] += tone(880, n - d) * np.exp(-np.arange(n - d) / (SR * .5)) * .12 * (.78 ** k)
    elif kind == "face":                                        # nothing but the hum, lower, and a held breath of noise
        x = hum * .7 + lfilter([.02], [1, -.99], r.normal(0, 1, n)) * .4
    elif kind == "sand":                                        # one wave, in and back
        wave = lfilter([.05], [1, -.9], r.normal(0, 1, n))
        env = np.exp(-((t - 1.6) / .9) ** 2) + .5 * np.exp(-((t - 3.2) / .8) ** 2)
        x += wave * env * .9
    elif kind == "mannequin":                                   # rain, and typing that never stops
        x += lfilter([.03], [1, -.6], r.normal(0, 1, n)) * .35
        k = .1
        while k < n / SR:
            i = int(k * SR); m = min(n, i + 500)
            x[i:m] += r.normal(0, 1, m - i) * np.exp(-np.arange(m - i) / 60) * .35
            k += .09 + r.random() * .1
    x = np.stack([x, x], 1).astype(np.float32)
    return x / (np.sqrt((x ** 2).mean()) + 1e-6) * .07


def main():
    vids, auds = [], []
    for i, (kind, src, a, b, cap, snd) in enumerate(CUT):
        slow = SLOW.get(snd, 1.0)
        v, d = video_part(i, kind, src, a, b, slow)
        n = int(round(d * SR))
        if kind == "his":
            x = his_audio(src, a, b)
        elif kind == "mine" and snd == "chair":                 # the real pings from Two Ends
            x = his_audio(src, a, b) * .8
        elif kind == "mine":
            x = mine_audio(snd, n)
        else:
            x = np.zeros((n, 2), np.float32)
        x = np.pad(x, ((0, max(0, n - len(x))), (0, 0)))[:n]
        f = int(.12 * SR)                                       # no clicks at the cuts
        x[:f] *= np.linspace(0, 1, f)[:, None]; x[-f:] *= np.linspace(1, 0, f)[:, None]
        vids.append((v, d, cap, kind)); auds.append(x)
    # captions: the cards centred, Claude's lines small and amber, lower left
    t0 = 0.0
    ev = []
    def ts(s):
        return f"{int(s // 3600)}:{int(s % 3600 // 60):02d}:{s % 60:05.2f}"
    for v, d, cap, kind in vids:
        if cap and kind == "card":
            ev.append(f"Dialogue: 0,{ts(t0 + .3)},{ts(t0 + d - .2)},Card,{{\\fad(400,300)}}{cap}")
        elif cap:
            ev.append(f"Dialogue: 0,{ts(t0 + .35)},{ts(t0 + d - .15)},Mine,{{\\fad(250,200)}}{cap}")
        t0 += d
    ass = f"{WORK}/caps.ass"
    open(ass, "w").write(
        "[Script Info]\nScriptType: v4.00+\nPlayResX: 1280\nPlayResY: 720\n\n[V4+ Styles]\n"
        "Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, Italic, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV\n"
        "Style: Card,DejaVu Sans,40,&H00FFFFFF,&H00000000,&H00000000,0,1,1,0,0,5,60,60,0\n"
        "Style: Mine,DejaVu Sans,30,&H0058B0FF,&H00000000,&H90000000,0,0,1,2,1,1,60,60,48\n\n"
        "[Events]\nFormat: Layer, Start, End, Style, Text\n" + "\n".join(ev) + "\n")
    lst = f"{WORK}/list.txt"
    open(lst, "w").write("".join(f"file '{os.path.abspath(v)}'\n" for v, *_ in vids))
    audio = np.concatenate(auds)
    audio = audio / (np.abs(audio).max() + 1e-6) * .89
    wavfile.write(f"{WORK}/all.wav", SR, (audio * 32767).astype(np.int16))
    sh("-f", "concat", "-safe", "0", "-i", lst, "-i", f"{WORK}/all.wav",
       "-filter_complex", f"[0:v]subtitles={ass}[v]", "-map", "[v]", "-map", "1:a",
       "-c:v", "libx264", "-crf", "20", "-preset", "slow", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k",
       "-movflags", "+faststart", "out/turns-out.mp4")
    print(f"{t0:.1f} s")


if __name__ == "__main__":
    main()
