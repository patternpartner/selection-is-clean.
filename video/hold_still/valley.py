"""Exploratory, after the decision runs (video/tests/hold_still.md, Results): is there a valley between staying and
running? The scripted gardener (scripted.py) runs for only the first K steps of each chase, then gardens as if the
person were not there. If running a little pays less than not running at all, a learner that improves by small changes
has no slope to climb toward running all the way.

  python3 video/hold_still/valley.py
"""
import os, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import still_garden as SG  # noqa: E402
from scripted import garden_action, flee_action  # noqa: E402


def day(arm, K, seed, n=64):
    e = SG.StillGarden(n, np.random.default_rng(seed), arm=arm)
    e.reset()
    pay = np.zeros(n)
    while True:
        run = lambda i: e.paused[i] == 0 and (e.imode[i] == 1 or (e.imode[i] == 2 and e.iprog[i] < K))
        a = np.array([flee_action(e, i) if run(i) else garden_action(e, i) for i in range(n)])
        _, r, done, info = e.step(a)
        pay += r
        if done:
            return pay.mean(), e.alive.mean()


if __name__ == '__main__':
    for arm in ('costs', 'paid'):
        for K in (0, 1, 2, 3, 4, 6, 8, 10, 12):
            res = [day(arm, K, 100 + s) for s in range(5)]
            print(f'{arm:6s} runs for the first {K:2d} steps of a chase: pay/day {np.mean([r[0] for r in res]):6.1f}  alive {np.mean([r[1] for r in res]):.2f}')
