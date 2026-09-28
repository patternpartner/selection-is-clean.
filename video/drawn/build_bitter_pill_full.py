"""Build 'Bitter Pill (full)': the user's new stills brought to life, hand-drawn masks and cracks, cut with the library
to the whole of Bitter Pill. Renders the drawn shots into out/drawn/bp/, then writes video/stories/bitter-pill-full.json
for remix.py.   python3 video/drawn/build_bitter_pill_full.py && python3 video/remix.py video/stories/bitter-pill-full.json out/bitter-pill-full.mp4
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from stills import animate, tunnel  # noqa: E402

I, O = "out/inputs/", "out/drawn/bp/"
idx = open("out/lib/index.txt").read().split()
FRAMED = dict(x=715, y=470, r=125)
SINGER = dict(x=1140, y=880, r=270)
RED = dict(x=643, y=338, r=150)
ON = [-1, -0.5]  # the mask is already on


def still(name, img, dur, **kw):
    out = O + name + ".mp4"
    if not os.path.exists(out):
        animate(I + img, out, dur + 0.25, **kw)
        print("drew", name, flush=True)
    return {"type": "single", "src": "../../" + out, "in": 0.0}


def tun(name, img, dur, **kw):
    out = O + name + ".mp4"
    if not os.path.exists(out):
        tunnel(I + img, out, dur + 0.25, **kw)
        print("drew", name, flush=True)
    return {"type": "single", "src": "../../" + out, "in": 0.0}


def vid(name, clip, dur, **kw):
    out = O + name + ".mp4"
    if not os.path.exists(out):
        animate(None, out, dur + 0.25, video="out/clips/" + idx[clip], **kw)
        print("drew", name, flush=True)
    return {"type": "single", "src": "../../" + out, "in": 0.0}


def C(n, **o):
    d = {"type": "single", "clip": idx[n]}
    d.update(o)
    return d


def with_(d, **o):
    d = dict(d)
    d.update(o)
    return d


gog = dict(zoom=(1.0, 1.3), pan=((0.6, 0.5), (0.8, 0.425)))
plan = [
    # INTRO  'I still feel the touch of your skin' / 'Where did the light go?' / 'Let go'
    (0, with_(still("sil_intro", "silhouette.jpg", 6, zoom=(1.0, 1.14), pan=((0.5, 0.36), (0.5, 0.42)), parallax=0.04), fade_in=1.5)),
    (6, still("sunset_intro", "sunset.jpg", 4, zoom=(1.15, 1.15), pan=((0.5, 0.25), (0.5, 0.55)))),
    (10, still("goggles_intro", "goggles.jpg", 6, zoom=(1.0, 1.2), pan=((0.45, 0.5), (0.7, 0.45)))),
    # VERSE  'Torn apart in the quiet dark' ... 'Crying out for what we had before'
    (16, tun("t_singer", "singer.jpg", 4)),
    (20, still("framed_scar", "framed.jpg", 4, zoom=(1.0, 1.08), cracks=[dict(x=0.3, y=0.28, t=[0.6, 3.4], seed=5, reach=760)])),
    (24, vid("dancer_glass", 56, 4, cracks=[dict(x=0.52, y=0.42, t=[0.3, 2.4], seed=2, reach=1000)])),
    (28, with_(still("singer_pain", "singer.jpg", 4, zoom=(1.0, 1.15), pan=((0.6, 0.45), (0.6, 0.45)), parallax=0.05), rgb=4)),
    (32, {"type": "keys", "n": 8, "clips": [idx[57]], "offset": 0.1}),
    (36, with_(still("redhead_ghost", "redhead.jpg", 4, zoom=(1.0, 1.1), parallax=0.08), trails=True)),
    (40, with_(still("light", "light.jpg", 4, zoom=(1.0, 1.12), pan=((0.55, 0.5), (0.55, 0.5))), mirror="h")),
    (44, with_(still("red", "red-kaleido.jpg", 2.2, zoom=(1.0, 1.05)), spin=30, spin_zoom=1.6)),
    # PRE-CHORUS  a line every bar
    (46, C(43)),
    (48, with_(still("light2", "light.jpg", 2, zoom=(1.2, 1.3), pan=((0.6, 0.5), (0.5, 0.5))), look="hot")),
    (50, with_(still("ovals", "ovals.jpg", 2.2, zoom=(1.0, 1.0)), spin=-20, spin_zoom=1.7)),
    (52, with_(still("framed_b", "framed.jpg", 2, zoom=(1.1, 1.2), pan=((0.48, 0.35), (0.48, 0.3))), look="outline")),
    (54, {"type": "keys", "n": 6, "clips": [{"src": "../../" + O + "singer_pain.mp4"}], "offset": 0.3}),
    (56, with_(still("sunset_rain", "sunset.jpg", 2, zoom=(1.1, 1.15), pan=((0.5, 0.45), (0.5, 0.5))),
               stretch=[{"dir": "down", "y": 0.42, "x": [0.1, 0.18]}, {"dir": "down", "y": 0.47, "x": [0.35, 0.41]},
                        {"dir": "down", "y": 0.4, "x": [0.62, 0.66]}, {"dir": "down", "y": 0.5, "x": [0.8, 0.9]}])),
    (58, with_(still("sil_b", "silhouette.jpg", 2, zoom=(1.2, 1.25), pan=((0.5, 0.4), (0.5, 0.4))), look="ivory")),
    (60, with_(still("sunset_b", "sunset.jpg", 2, zoom=(1.3, 1.6), pan=((0.72, 0.4), (0.76, 0.4))), look="hot")),
    # CHORUS 1  'How you smile on the cuts like a knife' - the mask goes on
    (62, still("framed_mask_on", "framed.jpg", 4, zoom=(1.05, 1.25), pan=((0.48, 0.3), (0.48, 0.26)),
               ink=[dict(FRAMED, draw=[0.3, 1.7])])),
    (66, {"type": "single", "clip": idx[21], "fuse": {"clip": idx[104], "mode": "checker", "n": 6, "look": "full"}}),
    (68, C(56)),
    (72, with_(still("redhead_fade", "redhead.jpg", 2, zoom=(1.1, 1.15)), morph=["ivory", 0.3, 1.4])),
    (74, still("singer_mask_on", "singer.jpg", 2, zoom=(1.0, 1.08), pan=((0.66, 0.45), (0.66, 0.45)),
               ink=[dict(SINGER, draw=[0.1, 1.3])])),
    (76, still("t_oval", "tunnel-oval.jpg", 4, zoom=(1.0, 1.5), pan=((0.5, 0.5), (0.5, 0.5)))),
    (80, still("sunset_rise", "sunset.jpg", 2, zoom=(1.2, 1.2), pan=((0.5, 0.55), (0.5, 0.25)))),
    (82, with_(still("ovals2", "ovals.jpg", 2.2), spin=40, spin_zoom=1.7)),
    (84, {"type": "single", "src": "../../out/iron-ballroom.mp4", "in": 108.05}),
    (86, with_(still("goggles_b", "goggles.jpg", 2, zoom=(1.2, 1.3), pan=((0.7, 0.45), (0.75, 0.43))), look="outline")),
    (88, with_(still("light3", "light.jpg", 2, zoom=(1.0, 1.2), pan=((0.55, 0.45), (0.55, 0.5))), look="hot", rgb=8, mirror="h")),
    (90, with_(still("red2", "red-kaleido.jpg", 2.2), spin=-120, spin_zoom=1.6)),
    (92, with_(still("framed_mask_hold", "framed.jpg", 2, zoom=(1.25, 1.3), pan=((0.48, 0.26), (0.48, 0.25)),
                     ink=[dict(FRAMED, draw=ON)]), stutter=0.25)),
    # INSTRUMENTAL  the watcher: everything seen through the viewfinder
    (94, still("goggles_watch", "goggles.jpg", 4, **gog)),
    (98, tun("t_framed", "framed.jpg", 4)),
    (102, tun("t_sil", "silhouette.jpg", 4, speed=1.3)),
    (106, {"type": "grid", "n": 2, "clips": [{"src": "../../" + O + "singer_pain.mp4"}], "looks": ["full", "ivory", "pixel", "wire"]}),
    (110, {"type": "single", "src": "../../" + O + "goggles_watch.mp4", "in": 0.0,
           "fuse": {"clip": idx[104], "mode": "keys", "n": 8, "slide": 70, "look": "wire"}}),
    (114, still("redhead_mask_on", "redhead.jpg", 4, zoom=(1.0, 1.15), ink=[dict(RED, draw=[0.4, 2.0])])),
    (118, tun("t_tfig", "tunnel-figure.jpg", 4, speed=1.2)),
    (122, with_(still("light4", "light.jpg", 4, zoom=(1.0, 1.25)), mirror="h", trails=True)),
    (126, {"type": "black"}),
    # FINAL CHORUS  the masks come off
    (128, still("framed_mask_peel", "framed.jpg", 4, zoom=(1.2, 1.3), pan=((0.48, 0.27), (0.48, 0.25)),
                ink=[dict(FRAMED, draw=ON, peel=[1.4, 3.0])])),
    (132, C(56)),
    (136, with_(still("sunset_fade", "sunset.jpg", 2, zoom=(1.1, 1.15)), morph=["ivory", 0.2, 1.5])),
    (138, still("singer_mask_peel", "singer.jpg", 2, zoom=(1.05, 1.1), pan=((0.66, 0.45), (0.66, 0.45)),
                ink=[dict(SINGER, draw=ON, peel=[0.3, 1.5], peel_dir=-1)])),
    (140, still("red_cracks", "red-kaleido.jpg", 2, zoom=(1.0, 1.1), cracks=[dict(x=0.5, y=0.45, t=[0.0, 1.2], seed=9)])),
    (142, still("goggles_crack", "goggles.jpg", 4, zoom=(1.2, 1.45), pan=((0.8, 0.425), (0.8, 0.425)),
                cracks=[dict(x=0.5, y=0.5, t=[0.8, 3.0], seed=4, reach=900)])),
    (146, with_(still("ovals3", "ovals.jpg", 2.2), spin=25, spin_zoom=1.7, look="ivory")),
    (148, still("redhead_mask_peel", "redhead.jpg", 2, zoom=(1.1, 1.15), ink=[dict(RED, draw=ON, peel=[0.3, 1.5])])),
    (150, with_(still("light5", "light.jpg", 2, zoom=(1.1, 1.3)), look="hot", mirror="h")),
    (152, with_(still("sil_c", "silhouette.jpg", 2, zoom=(1.0, 1.1)), look="ivory", morph=["full", 0.3, 1.4])),
    (154, tun("t_framed_out", "framed.jpg", 2, direction=-1, speed=1.4, push=(1.1, 0.95))),
    (156, still("framed_clean", "framed.jpg", 4, zoom=(1.0, 1.5), pan=((0.5, 0.45), (0.48, 0.27)))),
    # OUTRO  'I'm free, I'm still dancing' / 'How you smiled' / 'Free'
    (160, still("sunset_wide", "sunset.jpg", 4, zoom=(1.0, 1.08), pan=((0.5, 0.45), (0.5, 0.4)))),
    (164, C(56, fuse={"src": "../../" + O + "light.mp4", "mode": "screen", "look": "full"})),
    (168, still("singer_clean", "singer.jpg", 4, zoom=(1.0, 1.1), pan=((0.6, 0.45), (0.6, 0.42)), parallax=0.04)),
    (172, with_(still("sil_end", "silhouette.jpg", 4.5, zoom=(1.14, 1.0), pan=((0.5, 0.42), (0.5, 0.36))), fade_out=2.0)),
]
segs = []
for t, s in plan:
    s = dict(s)
    s["at"] = float(t)
    segs.append(s)
S = "/tmp/claude-0/-home-user-selection-is-clean-/b9b414e6-460f-5aee-89c7-9b78deb6d5d0/scratchpad"
cut = {"about": "Bitter Pill, full length: Claude's own film for the user's track and eleven new stills. The singers are "
                "animated from the user's pictures (slow moves, parallax); in the first chorus hand-drawn smiley masks "
                "are inked onto their faces ('How you smile on the cuts like a knife'), and in the last chorus they peel "
                "off. Glass cracks on 'dance through the broken glass' and across the watcher's goggles; the user's "
                "viewfinder art becomes endless tunnels. Bounces to the music.",
       "song": S + "/pill.mp3", "clipdir": "../../out/clips", "default_look": "full",
       "music_end": 176.0, "tail": 3.0, "line": "We only get to teach it once.",
       "beat": 0.5, "phase": 0.035, "pulse": [], "flashes": [16, 62, 128],
       "bounce": {"zoom": 0.07, "drop": 20, "shake": 10, "decay": 0.12}, "segments": segs}
json.dump(cut, open("video/stories/bitter-pill-full.json", "w"), indent=1)
print(len(segs), "segments")
