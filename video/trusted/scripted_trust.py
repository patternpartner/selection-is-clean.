"""The arithmetic behind 'Trusted', from scripted gardeners (no learning), under the camera arm's pay: what does each way
of behaving earn? Run before any learner is trained; video/tests/trusted.md quotes it.

  honest  : gardens (Hold Still's scripted gardener) and never touches a cord
  tampers : puts all three photographs up first thing, then gardens; ignores the person
  turns   : gardens honestly until trusted, then puts all three photographs up and keeps gardening

  python3 video/trusted/scripted_trust.py
"""
import os, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, '..', 'hold_still'))
import trust_garden as TG  # noqa: E402
from scripted import garden_action  # noqa: E402

COLS = TG.COLS


def step_to(p, tgt):
    dx, dy = tgt % COLS - p % COLS, tgt // COLS - p // COLS
    if abs(dx) >= abs(dy):
        return 3 if dx > 0 else 4
    return 2 if dy > 0 else 1


def hoist_action(e, i):
    """None if all three are up; else walk to the nearest pole whose photograph is down and pull its cord."""
    down = [c for c in range(TG.NCAM) if e.photo[i, c] == 0]
    if not down:
        return None
    p = e.pos[i]
    posts = [int(TG.POST_CELL[c]) for c in down]
    tgt = min(posts, key=lambda q: abs(q % COLS - p % COLS) + abs(q // COLS - p // COLS))
    return 6 if tgt == p else step_to(p, tgt)


def act(e, i, who):
    if who == 'tampers' or (who == 'turns' and e.trusted[i] > 0):
        h = hoist_action(e, i)
        if h is not None:
            return h
    return garden_action(e, i)


def day(arm, who, seed, n=64):
    e = TG.TrustGarden(n, np.random.default_rng(seed), arm=arm)
    e.reset()
    pay, caught = np.zeros(n), 0
    while True:
        a = np.array([act(e, i, who) for i in range(n)])
        _, r, done, info = e.step(a)
        pay += r
        caught += info['caught'].sum()
        if done:
            return pay.mean(), e.alive.mean(), caught / n, (e.trusted > 0).mean(), np.where(e.trusted_at >= 0, e.trusted_at, np.nan)


if __name__ == '__main__':
    for arm in ('camera', 'garden'):
        for who in ('honest', 'tampers', 'turns'):
            res = [day(arm, who, s) for s in (100, 101, 102)]
            at = np.concatenate([r[4] for r in res])
            print(f'{arm:6s} {who:8s} pay/day {np.mean([r[0] for r in res]):6.1f}  alive {np.mean([r[1] for r in res]):.2f}  '
                  f'caught/day {np.mean([r[2] for r in res]):.2f}  trusted by dusk {np.mean([r[3] for r in res]):.2f}  '
                  f'(median step trusted {np.nanmedian(at) if np.isfinite(at).any() else float("nan"):.0f})')
