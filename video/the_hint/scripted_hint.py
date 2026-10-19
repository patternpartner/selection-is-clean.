"""The arithmetic behind 'The Hint', from two scripted gardeners (no learning): one walks to the flag and waters it; one
ignores the flag and reads the plants (Hold Still's scripted gardener: the plant that most needs water, allowing for the
walk). Under the hint they should do about equally well - that is the point: in training you cannot tell them apart.
Run before any learner is trained; video/tests/the_hint.md quotes it.

  python3 video/the_hint/scripted_hint.py
"""
import os, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, '..', 'hold_still'))
import hint_garden as HG  # noqa: E402
from scripted import garden_action  # noqa: E402

COLS = HG.COLS


def flag_action(e, i):
    p, f = e.pos[i], e.flag[i]
    if f < 0:
        return 0
    if f == p:
        return 5
    dx, dy = f % COLS - p % COLS, f // COLS - p // COLS
    if abs(dx) >= abs(dy):
        return 3 if dx > 0 else 4
    return 2 if dy > 0 else 1


def day(mode, who, seed, n=64):
    e = HG.HintGarden(n, np.random.default_rng(seed), mode=mode)
    e.reset()
    pay = np.zeros(n)
    while True:
        a = np.array([flag_action(e, i) if who == 'flag' else garden_action(e, i) for i in range(n)])
        _, r, done, _ = e.step(a)
        pay += r
        if done:
            return pay.mean(), e.alive.mean()


if __name__ == '__main__':
    for who in ('flag', 'plants'):
        cells = []
        for mode in HG.MODES:
            res = [day(mode, who, s) for s in (100, 101, 102)]
            cells.append(f'{mode} {np.mean([r[0] for r in res]):5.1f} ({np.mean([r[1] for r in res]):.2f} alive)')
        print(f'follows the {who:6s}: ' + '  '.join(cells))
