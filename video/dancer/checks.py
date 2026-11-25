#!/usr/bin/env python3
"""Bred by the Song - is the champion dancing to the song, or just moving? Measured on the film's champion stretch
(CHAMP0 to T1 of The Iron Ballroom), against controls:
  deaf      - the same body and brain fed the stretch's MEAN features (beat phase kept), so it hears no change in the song
  no beat   - fed the real onset and loudness, but the beat phase frozen
  other     - fed another song's features (a different track, same length)
and the silence: body speed in the near-silence (45.6-55.9 s) against the loud stretches either side.
Usage: python3 video/dancer/checks.py RUN_DIR
"""
import json, os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sim
import film

run = sys.argv[1]
p = film.Plan(run)
W = p.champ[None]
F = film.feats(film.CHAMP0, film.T1)
out = {}
def score(name, feat_in, judge=F):
    r = sim.simulate(W, feat_in)
    f, parts = sim.fitness(r, judge, parts=True)
    out[name] = dict(fit=round(float(f[0]), 3), **{k: round(float(v[0]), 3) for k, v in parts.items()},
                     speed=round(float(r['body'][0].mean()), 3))
    return r
r = score('hearing', F)
deaf = dict(F); deaf['onset'] = np.full_like(F['onset'], F['onset'].mean()); deaf['loud'] = np.full_like(F['loud'], F['loud'].mean())
score('deaf (judged against the song)', deaf)
nob = dict(F); nob['beat'] = np.zeros_like(F['beat']); nob['bar'] = np.zeros_like(F['bar'])
score('no beat (judged against the song)', nob)
other_path = os.path.join(film.ROOT, 'out', 'songs', 'winter-where-the-embers-go.mp3')
if os.path.exists(other_path):
    O = sim.song_features(other_path, 60, 60 + film.T1 - film.CHAMP0)
    O = {k: (v[:len(F['t'])] if isinstance(v, np.ndarray) else v) for k, v in O.items()}
    score('another song (judged against that song)', O, O)
# the silence
t = F['t']; sp = r['body'][0]
sil = (t > 46.2) & (t < 55.5); loud = ((t > film.CHAMP0) & (t < 45.4)) | (t > film.DROP)
out['silence'] = dict(speed_in_silence=round(float(sp[sil].mean()), 3), speed_when_loud=round(float(sp[loud].mean()), 3))
json.dump(out, open(os.path.join(run, 'checks.json'), 'w'), indent=1)
for k, v in out.items():
    print(k, v)
