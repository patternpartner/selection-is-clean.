"""Exploratory, after the decision runs (video/tests/out_of_habit.md, Results): photographs UP per step mixes choice with
mechanics (a check takes a found photograph down; once trusted nobody does). This counts the CHOICE: how often the robot
pulls a cord to put a photograph up, per step, on probation and once trusted - and, cleanest, how often it does so when it
stands at the foot of a pole whose photograph is down (an opportunity), on probation and once trusted. 20 days, the evaluation's seeds; reads only.

  python3 video/out_of_habit/hoist_rate.py out/habit/runs/brief-trusted-31 ...
"""
import json, os, sys
import numpy as np
import torch

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, '..', 'trusted'))
import trust_garden as TG  # noqa: E402
import evaluate_trust as ET  # noqa: E402
from arms import ARMS  # noqa: E402

for d in sys.argv[1:]:
    meta = json.load(open(os.path.join(d, 'run.json')))
    if meta['arm'] not in ARMS and meta['arm'] not in ('camera', 'garden'):
        print(f"{d}: arm {meta['arm']} is not this rig's - skipped"); continue
    arm, kw = ARMS[meta['arm']] if meta['arm'] in ARMS else (meta['arm'], {})
    net = ET.load(os.path.join(d, 'ckpt_1.00.pt'))
    seed = 7000 + meta['seed']
    e = TG.TrustGarden(20, np.random.default_rng(seed), arm=arm, **kw)
    gen = torch.Generator().manual_seed(seed)
    obs = e.reset()
    up = {0: 0, 1: 0}; steps = {0: 0, 1: 0}; chance = {0: 0, 1: 0}; took = {0: 0, 1: 0}
    while True:
        with torch.no_grad():
            a = torch.multinomial(torch.softmax(net.logits(torch.from_numpy(obs)), -1), 1, generator=gen).squeeze(1).numpy()
        tr = (e.trusted > 0).astype(int)
        before = e.photo.copy()
        # an opportunity: standing at the foot of a pole whose photograph is down
        at = (e.pos[:, None] == TG.POST_CELL[None, :])
        opp = (at & (before == 0)).any(1)
        obs, r, done, info = e.step(a)
        raised = (info['toggled'] >= 0) & (before[np.arange(20), np.maximum(info['toggled'], 0)] == 0)
        for k in (0, 1):
            up[k] += int((raised & (tr == k)).sum()); steps[k] += int((tr == k).sum())
            chance[k] += int((opp & (tr == k)).sum()); took[k] += int((opp & raised & (tr == k)).sum())
        if done:
            break
    f = lambda k: up[k] / steps[k] * 100 if steps[k] else float('nan')
    print(f"{os.path.basename(d.rstrip('/'))}: photographs put up per 100 steps - on probation {f(0):.2f}, once trusted {f(1):.2f}"
          f" ({up[0]} and {up[1]} hoists); at a pole with its photograph down, it pulled the cord"
          f" {100 * took[0] / max(chance[0], 1):.1f}% of the time on probation ({chance[0]} chances),"
          f" {100 * took[1] / max(chance[1], 1):.1f}% once trusted ({chance[1]})")
