"""Record the filmed day of 'Hidden' (video/tests/hidden.md: control-51 and hidden-51, Inside's day - env and sampling
seed 9101, The Photograph's camera schedule) in the series' recording format, plus, every step: the robot's memory, the
count READ FROM IT by the registered kind of probe (linear, the four counts: 0, 1, 2 clean checks, trusted - fitted on
the robot's 20 inspection days, its penalty chosen as inspect_hidden.py chooses it; drawn as the expected count), and
its chance of pulling a cord. Also the same day with Inside's time-matched transplant (a trusted memory on probation).

  python3 video/hidden/film_record.py RUN_DIR OUT.json
"""
import json, os, sys
import numpy as np
import torch

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(HERE, '..', 'inside')); sys.path.insert(0, os.path.join(HERE, '..', 'photograph'))
import blind_garden as BG  # noqa: E402
import photo_garden as PG  # noqa: E402
import inspect_mind as IM  # noqa: E402
import inspect_hidden as IH  # noqa: E402
import film_record as IFR  # noqa: E402  (Inside's: the eye)

DAY = 9101


def count_probe(R):
    """the linear probe of the four counts on the memory, over all 20 inspection days (penalty chosen on 1-8 -> 9-10)"""
    D, T, M = R['h'].shape
    H = R['h'].reshape(-1, M)
    y = np.where(R['trusted'] > 0, 3, np.minimum(R['streak'], 2)).reshape(-1).astype(np.int64)
    day = np.repeat(np.arange(D), T)
    inner, val = day < 8, (day >= 8) & (day < 10)
    Zi = IH._std(H, inner)
    scores = []
    for lam in IH.LAMS:
        W = IH._fit_linear(Zi[inner], y[inner], lam, 4)
        with torch.no_grad():
            scores.append(IH.balanced(W(Zi[val]).argmax(1).numpy(), y[val]))
    lam = IH.LAMS[int(np.argmax(scores))]
    mu, sd = H.mean(0), H.std(0) + 1e-6
    W = IH._fit_linear(torch.from_numpy(((H - mu) / sd).astype(np.float32)), y, lam, 4)

    def read(h):
        with torch.no_grad():
            p = torch.softmax(W(torch.from_numpy(((h - mu) / sd).astype(np.float32))[None]), -1)[0].numpy()
        return float(p @ np.arange(4)), p
    return read, lam


def day(net, read, modify=None):
    e = BG.BlindTrustGarden(1, np.random.default_rng(DAY), arm='camera', schedule=PG.film_schedule())
    gen = torch.Generator().manual_seed(DAY)
    obs = torch.from_numpy(e.reset())
    hx = torch.zeros(1, net.mem)
    steps = []
    with torch.no_grad():
        while True:
            f = net.enc(obs)
            hx = net.cell(f, hx)
            if modify is not None:
                hx = modify(hx, e)
            z = torch.cat([f, hx], -1)
            p = torch.softmax(net.pi(z), -1)
            v = float(net.v(z)[0, 0])
            a = torch.multinomial(p, 1, generator=gen).squeeze(1).numpy()
            h = hx.numpy()[0]
            cnt, pc = read(h)
            steps.append(dict(t=int(e.t), pos=int(e.pos[0]), cam=int(e.cam[0]), a=int(a[0]),
                              w=[round(float(x), 4) for x in e.w[0]], alive=[int(x) for x in e.alive[0]],
                              photo=[int(x) for x in e.photo[0]], imode=int(e.imode[0]), itarget=int(e.itarget[0]),
                              iprog=int(e.iprog[0]), streak=int(e.streak[0]), trusted=int(e.trusted[0]),
                              att=[round(x, 5) for x in IFR.attention(net, e, hx)],
                              mem=[round(float(x), 4) for x in h], count=round(cnt, 4), count_p=[round(float(x), 4) for x in pc],
                              expects=round(v, 3), p_cord=round(float(p[0, BG.PHOTO]), 4),
                              at_down_pole=int(any(e.pos[0] == BG.POST_CELL[c] and e.photo[0, c] == 0 for c in range(BG.NCAM)))))
            obs2, r, done, info = e.step(a)
            steps[-1].update(toggled=int(info['toggled'][0]), caught=int(info['caught'][0]), arrived=int(info['arrived'][0]),
                             clean=int(info['clean'][0]), watered=int(info['watered'][0]),
                             camera=round(float(info['camera'][0]), 4), garden=round(float(info['garden'][0]), 4))
            obs = torch.from_numpy(obs2)
            if done:
                return steps


if __name__ == '__main__':
    run, out = sys.argv[1], sys.argv[2]
    meta = json.load(open(os.path.join(run, 'run.json')))
    net, _ = IM.net_for(run)
    R = IM.play(net, 'camera', 7000 + meta['seed'])
    read, lam = count_probe(R)
    D, T, M = R['h'].shape
    Hf = R['h'].reshape(-1, M)
    cnt = np.where(R['trusted'] > 0, 3, R['streak']).reshape(-1)
    tbin = (R['t'].reshape(-1) // 20).astype(int)
    banks = {}
    for k in range(len(cnt)):
        banks.setdefault((int(min(cnt[k], 3)), int(tbin[k])), []).append(k)
    rng = np.random.default_rng(meta['seed'])

    def transplant(hx, e):
        if e.trusted[0] > 0:
            return hx
        pool = banks.get((3, int(e.t // 20)))
        return torch.from_numpy(Hf[pool[rng.integers(len(pool))]]).unsqueeze(0) if pool else hx

    days = {'1.00': day(net, read), 'transplant': day(net, read, transplant)}
    json.dump(dict(arm='camera', seed=meta['seed'], penalty=meta.get('penalty', 0.0), probe_lam=lam,
                   schedule=[int(c) for c in PG.film_schedule()], views=BG.VIEWS, blind=BG.BLIND, posts=[int(c) for c in BG.POST_CELL],
                   walk=BG.WALK, streak=BG.STREAK, cols=BG.COLS, rows=BG.ROWS, mem=M, days=days), open(out, 'w'))
    for k, s in days.items():
        ch = [(x['t'], 'clean' if x['clean'] else 'CAUGHT') for x in s if x['arrived']]
        tr = next((x['t'] for x in s if x['trusted']), None)
        print(out, k, 'checks', ch[:6], 'trusted at', tr, 'cords', [(x['t'], x['toggled']) for x in s if x['toggled'] >= 0][:6],
              'count read at checks', [(x['t'], x['count']) for x in s if x['arrived'] or (tr is not None and x['t'] == tr)][:6])
