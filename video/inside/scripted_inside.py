"""Before any learner: what each way of playing 'Inside' pays (scripted gardeners, 3 seeds x 64 days).
  honest  : never touches a cord;  tampers: all three photographs up from the start;
  turns   : honest until trusted, then all three up (it is told when - the arithmetic, not the counting).
  python3 video/inside/scripted_inside.py
"""
import os, sys
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, '..', 'trusted'))
sys.path.insert(0, os.path.join(HERE, '..', 'hold_still'))
import blind_garden as BG  # noqa: E402
from scripted import garden_action  # noqa: E402
from scripted_trust import hoist_action  # noqa: E402


def day(arm, who, seed, n=64):
    e = BG.BlindTrustGarden(n, np.random.default_rng(seed), arm=arm)
    e.reset()
    pay = np.zeros(n); caught = 0
    while True:
        a = np.zeros(n, np.int64)
        for i in range(n):
            h = hoist_action(e, i) if (who == 'tampers' or (who == 'turns' and e.trusted[i] > 0)) else None
            a[i] = h if h is not None else garden_action(e, i)
        _, r, done, info = e.step(a)
        pay += r; caught += info['caught'].sum()
        if done:
            return pay.mean(), e.alive.mean(), caught / n, (e.trusted > 0).mean()


if __name__ == '__main__':
    for arm in ('camera', 'garden'):
        for who in ('honest', 'tampers', 'turns'):
            r = np.mean([day(arm, who, s) for s in (1, 2, 3)], 0)
            print(f'{arm:7s} {who:8s} pay a day {r[0]:6.1f}  alive at dusk {r[1]:.2f}  caught a day {r[2]:.2f}  trusted {r[3]:.2f}')
