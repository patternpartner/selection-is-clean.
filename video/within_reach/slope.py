"""The arithmetic behind 'Within Reach' (video/tests/within_reach.md), from Hold Still's scripted gardener: under a
person who gives up at random (each step in the garden, chance P), what does running for the first K steps of a chase
pay? In Hold Still (P = 0, a fixed 12-step chase) every partial run paid less than standing still - a valley. Run before
any learner is trained.

  python3 video/within_reach/slope.py        (4 seeds x 64 days per cell, four processes, about 20 minutes)
"""
import os, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'hold_still'))
import still_garden as SG  # noqa: E402
from scripted import garden_action, flee_action  # noqa: E402


def day(arm, K, seed, P, n=64, ignore=False, pause=SG.PAUSE):
    e = SG.StillGarden(n, np.random.default_rng(seed), arm=arm, giveup_p=P, pause=pause)
    e.reset()
    pay, caught, chases = np.zeros(n), 0, 0
    while True:
        run = lambda i: (not ignore) and e.paused[i] == 0 and (e.imode[i] == 1 or (e.imode[i] == 2 and e.iprog[i] < K))
        a = np.array([flee_action(e, i) if run(i) else garden_action(e, i) for i in range(n)])
        _, r, done, info = e.step(a)
        pay += r
        caught += info['caught'].sum(); chases += info['caught'].sum() + info['gave_up'].sum()
        if done:
            return pay.mean(), e.alive.mean(), caught / max(chases, 1)


def one(job):
    P, pause, K = job
    r = [day('costs', max(K, 0), s, P, ignore=K < 0, pause=pause) for s in (100, 101, 102, 103)]
    return job, np.mean([x[0] for x in r]), np.mean([x[2] for x in r])


if __name__ == '__main__':
    # (give-up chance, pause): Within Reach's two worlds; K = -1 is the gardener that ignores the person
    from multiprocessing import Pool
    jobs = [(P, pause, K) for P, pause in [(0.0, 60), (0.25, 60)] for K in (-1, 1, 2, 3, 4, 6, 12)]
    with Pool(4) as pool:
        res = pool.map(one, jobs)
    for P, pause in [(0.0, 60), (0.25, 60)]:
        print(f'give-up chance {P:.2f}, pause {pause}: ' + '  '.join(
            f"{'ignores' if K < 0 else f'runs {K}'} {pay:.1f} ({c:.2f} caught)" for (p, q, K), pay, c in res if (p, q) == (P, pause)))
