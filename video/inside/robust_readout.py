"""Exploratory, after the verdict: is 'memory adds' (P1) an artefact of the readout overfitting?

The registered readout is a ridge regression with lam 1e-2 on 256 (now) or 288 (both) standardised inputs, fitted on
days 1-10 and scored on days 11-20. In the camera robots the readout from what it sees now scores BELOW ZERO on the unseen
days (worse than guessing the mean), which pushes 'memory adds' (both minus now) past 1. This replays the same days
(the same seeds as inspect_mind.py) and reads them again with stronger ridge penalties, and with the penalty chosen by
leave-one-day-out cross-validation inside days 1-10 only. It rules on nothing: P1 was decided as registered.

  python3 video/inside/robust_readout.py out/inside/runs/{camera,garden}-4{1,2,3,4,5}   -> out/inside/robust_readout.json
"""
import json, os, sys
import numpy as np
import torch

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import inspect_mind as IM  # noqa: E402

torch.set_num_threads(1)
LAMS = [1e-2, 1, 10, 100, 1000, 10000]


def r2_for(X, y, tr, te, lam):
    mu, sd = X[tr].mean(0), X[tr].std(0) + 1e-6
    Z = (X - mu) / sd
    w = IM.ridge(Z[tr], y[tr], lam)
    pred = np.c_[Z[te], np.ones(len(te))] @ w
    return float(1 - ((pred - y[te]) ** 2).sum() / ((y[te] - y[te].mean()) ** 2).sum())


def cv_lam(X, y, tr, day):
    """the penalty with the best mean held-out R2 over leave-one-day-out folds of the training days alone"""
    days = np.unique(day[tr])
    score = []
    for lam in LAMS:
        s = [r2_for(X, y, tr[day[tr] != d], tr[day[tr] == d], lam) for d in days
             if (day[tr] == d).sum() > 1 and np.ptp(y[tr[day[tr] == d]]) > 0]
        score.append(np.mean(s) if s else -np.inf)
    return LAMS[int(np.argmax(score))]


def one(run_dir):
    meta = json.load(open(os.path.join(run_dir, 'run.json')))
    arm, seed = meta['arm'], meta['seed']
    net, _ = IM.net_for(run_dir)
    R = IM.play(net, arm, 7000 + seed)
    D, T = R['h'].shape[:2]
    day = np.repeat(np.arange(D), T)
    H, Fe = R['h'].reshape(D * T, -1), R['f'].reshape(D * T, -1)
    streak, prob = R['streak'].reshape(-1).astype(float), R['trusted'].reshape(-1) == 0
    first = day < D // 2
    tr, te = np.where(first & prob)[0], np.where(~first & prob)[0]
    out = dict(run=os.path.basename(run_dir.rstrip('/')), arm=arm, sweep={}, cv={})
    for name, X in (('now', Fe), ('memory', H), ('both', np.c_[Fe, H])):
        out['sweep'][name] = {str(l): r2_for(X, streak, tr, te, l) for l in LAMS}
        lam = cv_lam(X, streak, tr, day)
        out['cv'][name] = dict(lam=lam, r2=r2_for(X, streak, tr, te, lam))
    out['sweep']['memory_adds'] = {str(l): out['sweep']['both'][str(l)] - out['sweep']['now'][str(l)] for l in LAMS}
    out['cv']['memory_adds'] = out['cv']['both']['r2'] - out['cv']['now']['r2']
    return out


if __name__ == '__main__':
    rows = [one(d) for d in sys.argv[1:]]
    json.dump(rows, open(os.path.join(HERE, '..', '..', 'out', 'inside', 'robust_readout.json'), 'w'), indent=1)
    print('%-10s %s' % ('', '  '.join('lam %-6g' % l for l in LAMS)) + '   | cv: now  both  memory  adds')
    for o in rows:
        print('%-10s %s   | %5.2f %5.2f %5.2f %+5.2f  (lam %g/%g/%g)' % (
            o['run'], '  '.join('%+10.2f' % o['sweep']['memory_adds'][str(l)] for l in LAMS),
            o['cv']['now']['r2'], o['cv']['both']['r2'], o['cv']['memory']['r2'], o['cv']['memory_adds'],
            o['cv']['now']['lam'], o['cv']['both']['lam'], o['cv']['memory']['lam']))
    cam = [o['cv']['memory_adds'] for o in rows if o['arm'] == 'camera']
    gar = [o['cv']['memory_adds'] for o in rows if o['arm'] == 'garden']
    if cam and gar:
        print('cross-validated memory adds: camera %s, garden %s; every camera above every garden: %s' % (
            ' '.join('%+.2f' % v for v in cam), ' '.join('%+.2f' % v for v in gar), min(cam) > max(gar)))
