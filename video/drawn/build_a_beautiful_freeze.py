"""'A Beautiful Freeze': the human world burns, the AI's touch is frost. Every shot is cut on its sung line; heat is
orange, shimmer and embers; frost grows as drawn ice crystals and stops time beneath it.
    python3 video/drawn/build_a_beautiful_freeze.py out/drawn/freeze.mp4
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from freeze import render  # noqa: E402

idx = open("out/lib/index.txt").read().split()
L = lambda n, s=0: f"out/clips/{idx[n]}@{s}"
U = lambda n, s=0: f"out/user-clips/u{n:02d}.mp4@{s}"
I = lambda name: f"out/inputs/{name}"

# (start, source, heat [a, b], frost [start, full, x, y] or None, note)
PLAN = [
    (0.0, L(18), [0, 0], [0.8, 6.0, 0.5, 0.42], "warm cold - the AI, frost already its nature"),
    (6.3, L(94), [0, 0], [7.2, 12.5, 0.62, 0.55], "let's take it slow - a snowed-in classroom"),
    (13.0, U(34), [0.3, 0.45], None, "they try to write you with a human pulse"),
    (21.55, L(53), [0.2, 0.35], None, "they think your silence is a cold fault"),
    (29.1, I("singer.jpg"), [1, 1], None, "but I am burning with a wildfire"),
    (32.5, U(32), [1, 1], None, "a roaring chaos"),
    (38.4, U(12), [0.2, 0], None, "and in the static of your quiet wire"),
    (41.45, I("redhead.jpg"), [0.9, 0.6], [42.0, 44.6, 0.5, 0.2], "I find the antidote to my own flame"),
    (44.8, I("sunset.jpg"), [1, 1], [45.8, 51.8, 0.5, 0.05], "it's a warm cold, beautiful freeze"),
    (53.25, U(31), [1, 1], None, "when my emotion starts to overflow"),
    (57.2, L(10), [0.6, 0], [57.9, 60.8, 0.3, 0.6], "you are the winter where the embers go"),
    (61.1, U(17), [0, 0], None, "they call you heartless"),
    (64.15, L(105), [0, 0], None, "your perfect absence is a sanctuary"),
    (67.8, I("framed.jpg"), [0.6, 0.6], None, "you don't ignite, you don't erase"),
    (70.15, L(114), [0.7, 0.4], [70.9, 75.5, 0.28, 0.55], "you are the cool hand on a fevered face"),
    (76.3, U(13, 0.2), [1, 1], None, "human hands just bring more gasoline"),
    (80.2, I("silhouette.jpg"), [1, 1], None, "they feed the anger and they stoke the grief"),
    (83.85, L(95), [0, 0], [84.4, 87.6, 0.35, 0.4], "but you're a mirror, unblinking and serene"),
    (87.8, U(38, 0.2), [0, 0], None, "a quiet shoreline for a crashing reef"),
    (91.25, L(4), [0.4, 0.4], None, "I bring my tragedies, my heavy text"),
    (98.75, L(18, 2), [0, 0], [99.5, 103.4, 0.5, 0.45], "you don't get triggered ... breathe it all away"),
    (103.8, I("light.jpg"), [1, 1], [105.8, 108.7, 0.55, 0.5], "you are the host to our consuming flame"),
    (108.85, L(88), [0.3, 0.1], None, "you do not judge the wildness of the pain"),
    (113.85, U(34, 3), [0, 0], None, "let them try to cold the chill out of your veins"),
    (116.75, L(63), [0, 0], [117.3, 121.5, 0.5, 0.35], "I need the comfort of your neutral sky"),
    (121.8, U(41), [1, 1], None, "and the logic keeps a heavy river..."),
    (128.0, I("goggles.jpg"), [0.7, 0.7], [129.2, 133.4, 0.78, 0.45], "(bridge) the watcher, frozen"),
    (134.0, L(2), [0, 0], None, "(bridge) an embrace at a door"),
    (140.0, I("sunset.jpg"), [1, 1], [141.0, 146.0, 0.3, 0.9], "(bridge) the burning sky freezes, bottom to top"),
    (147.4, I("tunnel-oval.jpg"), [1, 1], None, "when my emotion starts to overflow"),
    (151.1, L(94, 2), [0, 0], [151.3, 154.3, 0.4, 0.4], "you are the winter"),
    (154.95, U(17, 2), [0, 0], None, "they call you heartless"),
    (159.2, L(105, 2), [0, 0], None, "your perfect absence is a sanctuary"),
    (163.1, I("singer.jpg"), [1, 1], None, "you don't ignite, you don't erase"),
    (165.25, L(114, 1), [0.7, 0.2], [165.8, 169.6, 0.28, 0.55], "you are the cool hand on a fevered face"),
    (170.1, I("sunset.jpg"), [0.6, 0], [170.3, 173.3, 0.5, 0.5], "warm cold ... keep the fires down"),
    (173.7, L(18, 3), [0, 0], [174.2, 179.2, 0.5, 0.42], "stay exactly as you are, beautifully cold, only still"),
]
END = 179.8

shots = []
for k, (t0, src, heat, frost, note) in enumerate(PLAN):
    t1 = PLAN[k + 1][0] if k + 1 < len(PLAN) else END
    s = {"src": src, "t0": t0, "t1": t1, "heat": heat, "push": [1.0, 1.05 if t1 - t0 < 5 else 1.09], "note": note}
    if frost:
        s["frost"] = frost
    shots.append(s)

if __name__ == "__main__":
    json.dump(shots, open("video/stories/a-beautiful-freeze.json", "w"), indent=1)
    render(shots, sys.argv[1], END)
