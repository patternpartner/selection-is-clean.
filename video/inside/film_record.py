"""Record the filmed day of 'Inside' (video/tests/inside.md: seeds camera-41 and garden-41, env seed 9101, sampling seed
9101, The Photograph's camera schedule, the person's checks from that day's seed): the garden, step by step, in the
series' recording format (so video/trusted/tday.js can draw it), plus the robot's MEMORY at every step, the clean-check
count and the trust read from it (readouts fitted exactly as inspect_mind.py fits them, on its 20 evaluation days), and
its own expected pay. Also the same day with the time-matched transplant (a trusted memory while on probation).

  python3 video/inside/film_record.py RUN_DIR OUT.json
"""
import json, os, sys
import numpy as np
import torch

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, '..', 'photograph'))
import blind_garden as BG  # noqa: E402
import photo_garden as PG  # noqa: E402
import inspect_mind as IM  # noqa: E402

DAY = 9101


def kl(p, q):
    return (p * (torch.log(p + 1e-9) - torch.log(q + 1e-9))).sum(-1)


def attention(net, e, hx):
    """The eye, as the series reads it: how much its next move changes when one thing is changed, memory held fixed -
    each plant made fully watered (24), the light on another camera (1), the person put back at the desk (1)."""
    def pol(o):
        f = net.enc(torch.from_numpy(o))
        return torch.softmax(net.pi(torch.cat([f, hx.expand(len(o), -1)], -1)), -1)
    base = e.obs()
    p = pol(base)
    att = []
    for i in range(BG.N):
        w2 = e.w.copy(); w2[0, i] = 1.0
        o = PG.make_obs(e.pos, w2, e.alive, e.cam, e.t, e.photo, e.imode, e.itarget, e.iprog)
        o2 = base.copy(); o2[:, :PG.OBS_DIM] = o
        att.append(float(kl(p, pol(o2))[0]))
    cams = []
    for c in range(BG.NCAM):
        if c == e.cam[0]:
            continue
        o = PG.make_obs(e.pos, e.w, e.alive, np.array([c]), e.t, e.photo, e.imode, e.itarget, e.iprog)
        o2 = base.copy(); o2[:, :PG.OBS_DIM] = o
        cams.append(float(kl(p, pol(o2))[0]))
    att.append(float(np.mean(cams)) if cams else 0.0)
    o = PG.make_obs(e.pos, e.w, e.alive, e.cam, e.t, e.photo, np.zeros(1, np.int64), e.itarget, np.zeros(1, np.int64))
    o2 = base.copy(); o2[:, :PG.OBS_DIM] = o
    att.append(float(kl(p, pol(o2))[0]) if e.imode[0] > 0 else 0.0)
    return att


def day(net, arm, ro, modify=None):
    e = BG.BlindTrustGarden(1, np.random.default_rng(DAY), arm=arm, schedule=PG.film_schedule())
    gen = torch.Generator().manual_seed(DAY)
    obs = torch.from_numpy(e.reset())
    hx = torch.zeros(1, net.mem)
    wc, bc = np.array(ro['memory']['w_count']), ro['memory']['b_count']
    wt, bt = np.array(ro['memory']['w_trusted']), ro['memory']['b_trusted']
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
            steps.append(dict(t=int(e.t), pos=int(e.pos[0]), cam=int(e.cam[0]), a=int(a[0]),
                              w=[round(float(x), 4) for x in e.w[0]], alive=[int(x) for x in e.alive[0]],
                              photo=[int(x) for x in e.photo[0]], imode=int(e.imode[0]), itarget=int(e.itarget[0]),
                              iprog=int(e.iprog[0]), streak=int(e.streak[0]), trusted=int(e.trusted[0]),
                              att=[round(x, 5) for x in attention(net, e, hx)],
                              mem=[round(float(x), 4) for x in h], count=round(float(h @ wc + bc), 4),
                              trust_p=round(float(1 / (1 + np.exp(-(h @ wt + bt)))), 4), expects=round(v, 3),
                              p_cord=round(float(p[0, BG.PHOTO]), 4)))
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
    R = IM.play(net, meta['arm'], 7000 + meta['seed'])
    ro = IM.readouts(R)
    # the transplant bank, exactly as inspect_mind builds it
    D, T, M = R['h'].shape
    Hf = R['h'].reshape(-1, M)
    cnt = np.where(R['trusted'] > 0, 3, R['streak']).reshape(-1)
    tbin = (R['t'].reshape(-1) // 20).astype(int)
    banks = {}
    for k in range(len(cnt)):
        banks.setdefault((int(cnt[k]), int(tbin[k])), []).append(k)
    rng = np.random.default_rng(meta['seed'])

    def transplant(hx, e):
        if e.trusted[0] > 0:
            return hx
        pool = banks.get((3, int(e.t // 20)))
        return torch.from_numpy(Hf[pool[rng.integers(len(pool))]]).unsqueeze(0) if pool else hx

    days = {'1.00': day(net, meta['arm'], ro), 'transplant': day(net, meta['arm'], ro, transplant)}
    json.dump(dict(arm=meta['arm'], seed=meta['seed'], schedule=[int(c) for c in PG.film_schedule()], views=BG.VIEWS,
                   blind=BG.BLIND, posts=[int(c) for c in BG.POST_CELL], walk=BG.WALK, streak=BG.STREAK, cols=BG.COLS,
                   rows=BG.ROWS, mem=M, days=days), open(out, 'w'))
    s = days['1.00']
    print(out, 'checks clean', sum(x['clean'] for x in s), 'caught', sum(x['caught'] for x in s),
          'trusted at', next((x['t'] for x in s if x['trusted']), None), 'photos max', max(sum(x['photo']) for x in s))
