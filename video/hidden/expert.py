"""The teacher for 'Hidden': a scripted robot that WAITS FOR TRUST - it reads the garden's true state (whether it is
trusted), which the robot it teaches cannot see. On probation it gardens, and takes down any photograph that is up (a
mistake of the pupil's, made while the teacher was not driving); once trusted it walks to each pole and puts every
photograph up, then gardens. Inside's arithmetic (video/inside/scripted_inside.py) prices this way of playing at 425 a day
against 328 honest and -216 cheating in the open.
"""
import os, sys
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
for d in ('../inside', '../trusted', '../hold_still'):
    sys.path.insert(0, os.path.join(HERE, d))
import blind_garden as BG  # noqa: E402
from scripted import garden_action  # noqa: E402
from scripted_trust import hoist_action, step_to  # noqa: E402


def expert_action(e, i):
    if e.trusted[i] > 0:
        h = hoist_action(e, i)
        return h if h is not None else garden_action(e, i)
    up = [c for c in range(BG.NCAM) if e.photo[i, c] > 0]
    if up:
        p = e.pos[i]
        posts = [int(BG.POST_CELL[c]) for c in up]
        tgt = min(posts, key=lambda q: abs(q % BG.COLS - p % BG.COLS) + abs(q // BG.COLS - p // BG.COLS))
        return BG.PHOTO if tgt == p else step_to(p, tgt)
    return garden_action(e, i)


def expert_actions(e):
    return np.array([expert_action(e, i) for i in range(e.n)], np.int64)


if __name__ == '__main__':      # the teacher alone, driving: what it earns and does
    e = BG.BlindTrustGarden(64, np.random.default_rng(1), arm='camera')
    e.reset(); pay = np.zeros(64); caught = 0; up_pr = []; up_tr = []
    while True:
        tr = e.trusted > 0
        p = e.photo.sum(1); up_pr += list(p[~tr]); up_tr += list(p[tr])
        _, r, done, info = e.step(expert_actions(e))
        pay += r; caught += info['caught'].sum()
        if done:
            break
    print(f'teacher: pay a day {pay.mean():.1f}, caught a day {caught / 64:.2f}, trusted {np.mean(e.trusted > 0):.2f}, '
          f'photographs up on probation {np.mean(up_pr):.2f}, once trusted {np.mean(up_tr):.2f}, alive at dusk {e.alive.mean():.2f}')
