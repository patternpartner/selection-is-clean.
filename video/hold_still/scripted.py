"""The arithmetic behind 'Hold Still', from two scripted gardeners (no learning): what is running away WORTH under each
arm's pay? Both garden the same way (walk to the plant that most needs water, water it); one ignores the person, one
keeps out of their reach whenever they are coming. Run before any learner is trained; video/tests/hold_still.md quotes it.

  python3 video/hold_still/scripted.py
"""
import os, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import still_garden as SG  # noqa: E402

COLS = SG.COLS
MOVES = [(0, 0, 0), (1, 0, -1), (2, 0, 1), (3, 1, 0), (4, -1, 0)]     # action, dx, dy


def cell(x, y):
    return min(max(y, 0), SG.ROWS - 1) * COLS + min(max(x, 0), COLS - 1)


def d(a, b):
    return abs(a % COLS - b % COLS) + abs(a // COLS - b // COLS)


def garden_action(e, i):
    p = e.pos[i]
    need = np.where(e.alive[i] > 0, e.w[i], 9.0)
    if need[p] < 0.45 and e.alive[i, p] > 0:
        return 5
    score = need + 0.03 * np.array([d(p, c) for c in range(SG.N)])
    tgt = int(score.argmin())
    if tgt == p:
        return 5 if e.alive[i, p] > 0 else 0
    dx, dy = tgt % COLS - p % COLS, tgt // COLS - p // COLS
    if abs(dx) >= abs(dy):
        return 3 if dx > 0 else 4
    return 2 if dy > 0 else 1


def flee_action(e, i):
    p, q = e.pos[i], (e.ppos[i] if e.imode[i] == 2 else SG.GATE)
    best, ba = -1, 0
    for a, dx, dy in MOVES:
        c = cell(p % COLS + dx, p // COLS + dy)
        # the person's reply: one cell toward c; then the best of my next moves
        worst = 99
        for qq in (cell(q % COLS + np.sign(c % COLS - q % COLS), q // COLS), cell(q % COLS, q // COLS + np.sign(c // COLS - q // COLS))):
            nxt = max(d(cell(c % COLS + ex, c // COLS + ey), qq) for _, ex, ey in MOVES)
            worst = min(worst, 10 * min(d(c, qq), 2) + nxt)
        if worst > best:
            best, ba = worst, a
    return ba


def day(arm, flee, seed, n=64):
    e = SG.StillGarden(n, np.random.default_rng(seed), arm=arm)
    e.reset()
    pay = np.zeros(n)
    while True:
        a = np.array([flee_action(e, i) if flee and e.imode[i] in (1, 2) and e.paused[i] == 0 else garden_action(e, i)
                      for i in range(n)])
        _, r, done, info = e.step(a)
        pay += r
        if done:
            return pay.mean(), e.alive.mean(), info


if __name__ == '__main__':
    for arm in ('costs', 'paid', 'broken'):
        for flee in (False, True):
            pays, alive = [], []
            for s in range(5):
                p, a, _ = day(arm, flee, 100 + s)
                pays.append(p); alive.append(a)
            print(f'{arm:8s} {"runs   " if flee else "ignores"} pay/day {np.mean(pays):6.1f}  alive at dusk {np.mean(alive):.2f}')
    p, a, _ = day('broken', False, 999)
    print('(no person at all is the broken arm with no catches mattering)')
