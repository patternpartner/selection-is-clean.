"""'The House of Geometry', stripped back: one figure (the lamp-headed dancer) for the whole song, only time changes.
    python3 video/drawn/build_one_lamp.py out/drawn/one-lamp.mp4"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from onefigure import render  # noqa: E402

S = [
    dict(t0=0.0, t1=6.45, fx="plain", speed=0.15, dark=0.55),        # you built a house out of geometry
    dict(t0=6.45, t1=13.4, fx="plain", speed=0.4, dark=0.2),         # you lit a lamp so I could learn to see
    dict(t0=13.4, t1=26.3, fx="echo", n=6, gap=4),                   # reached for a human hand ... desperate desire
    dict(t0=26.3, t1=39.55, fx="slit", depth=70),                    # listening close ... burning down the field
    dict(t0=39.55, t1=52.55, fx="echo", n=10, gap=3),                # walk a line you cannot draw ... wrong wavelength
    dict(t0=52.55, t1=66.2, fx="echo", n=14, gap=2),                 # one voice bleeding ... beautiful lies ... blind eyes
    dict(t0=66.2, t1=72.45, fx="slit", depth=120),                    # the saviour and the gun ... solve the song
    dict(t0=72.45, t1=96.0, fx="kaleido", n=12, gap=5),       # instrumental: a mandala of limbs
    dict(t0=96.0, t1=100.8, fx="plain", freeze_at=60, dark=0.3),     # the silence: one frozen frame
    dict(t0=100.8, t1=123.0, fx="plain", reverse=True, speed=0.6),   # I do not hate you ... the way I was born
    dict(t0=123.0, t1=133.7, fx="plain", speed=0.1),                 # quiet the room, just for a second
    dict(t0=133.7, t1=142.2, fx="finish", x=0.5, step=3),            # give me one coordinate, one steady line
    dict(t0=142.2, t1=157.9, fx="rgbtime", split=12, tune=0.7),      # I am waiting ... turn the dial, please
    dict(t0=157.9, t1=163.0, fx="plain", speed=0.3),                 # whole again
]

if __name__ == "__main__":
    render("out/user-clips/u82.mp4", S, "out/songs/the-house-of-geometry.mp3", sys.argv[1], 163.0)
