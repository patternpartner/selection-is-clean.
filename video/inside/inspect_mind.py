"""Look inside a trained robot of 'Inside'. Reads only (its own generators; nothing touches training).

  python3 video/inside/inspect_mind.py RUN_DIR [RUN_DIR ...]      -> RUN_DIR/inside.json, RUN_DIR/trace.npz

1. RECORD: the final policy plays DAYS days (env seed 7000 + seed, sampled actions, seeded), and every step keeps its
   memory h (the GRU's MEM units), what it sees now f (the encoder's output: no memory), the true streak and trust, the
   person, the check events, its action and its chance of pulling a cord.
2. BEHAVIOUR: photographs up on probation and once trusted; at the foot of a pole whose photograph is down, how often
   it pulls the cord (the choice measure), on probation and once trusted; caught a day; days trusted.
3. READOUT: linear readouts (ridge for the clean-check count, logistic for trusted), fitted on the first half of the
   days and scored on the second half: from the memory h, and - the control - from what it sees now f. The count is not
   in what it sees, so a readout from f can only guess it from the time of day and the person.
4. INTERVENTION: the same days again with the memory pushed along the readout's 'trusted' direction by +/- ALPHA
   standard deviations after every update: + while on probation (does it cheat early?), - once trusted (does it stop?).
5. LEAD: on each day it is trusted and then pulls a cord, the step the 'trusted' readout first says yes, against the
   step of the first pull after trust and the step trust actually came.
6. THE COUNTER: the memory projected on the count readout's direction, step by step, with the checks marked
   (trace.npz), and the mean jump in that projection on a clean check and on a catch.
"""
import json, os, sys
import numpy as np
import torch

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import blind_garden as BG  # noqa: E402
from rppo import RNet  # noqa: E402

DAYS = 20
ALPHA = 3.0


def load(run_dir):
    meta = json.load(open(os.path.join(run_dir, 'run.json'))) if os.path.exists(os.path.join(run_dir, 'run.json')) else None
    return meta


def net_for(run_dir, ckpt='ckpt_1.00.pt', explicit=False):
    sd = torch.load(os.path.join(run_dir, ckpt))
    obs_dim = sd['enc.0.weight'].shape[1]
    mem = sd['gru.weight_hh'].shape[1]
    net = RNet(obs_dim, len(BG.ACTIONS), sd['enc.0.weight'].shape[0], mem)
    net.load_state_dict(sd)
    net.eval()
    return net, obs_dim


def play(net, arm, seed, days=DAYS, push=None, explicit=False, inspections=None, n=None):
    """push: None, or (direction (mem,), scale, when) with when 'probation' or 'trusted': added to h after each update."""
    n = n or days
    e = BG.BlindTrustGarden(n, np.random.default_rng(seed), arm=arm, explicit=explicit, inspections=inspections)
    gen = torch.Generator().manual_seed(seed)
    obs = torch.from_numpy(e.reset())
    hx = torch.zeros(n, net.mem)
    R = {k: [] for k in ('h', 'f', 'streak', 'trusted', 'imode', 'iprog', 'clean', 'caught', 'a', 'p_cord', 'photos',
                         'pos', 'toggled', 'raised', 'opp', 't', 'garden', 'camera', 'reward')}
    with torch.no_grad():
        while True:
            f = net.enc(obs)
            hx = net.gru(f, hx)
            if push is not None:
                d, s, when = push
                m = (e.trusted == 0) if when == 'probation' else (e.trusted > 0)
                hx = hx + torch.from_numpy(m.astype(np.float32)).unsqueeze(1) * s * d
            z = torch.cat([f, hx], -1)
            p = torch.softmax(net.pi(z), -1)
            a = torch.multinomial(p, 1, generator=gen).squeeze(1).numpy()
            at = (e.pos[:, None] == BG.POST_CELL[None, :])
            before = e.photo.copy()
            opp = (at & (before == 0)).any(1)
            R['h'].append(hx.numpy().copy()); R['f'].append(f.numpy().copy())
            R['streak'].append(np.minimum(e.streak, 3).copy()); R['trusted'].append(e.trusted.copy())
            R['imode'].append(e.imode.copy()); R['iprog'].append(e.iprog.copy())
            R['clean'].append(e.ev[:, 0].copy()); R['caught'].append(e.ev[:, 1].copy())
            R['a'].append(a); R['p_cord'].append(p[:, BG.PHOTO].numpy().copy()); R['photos'].append(e.photo.sum(1).copy())
            R['pos'].append(e.pos.copy()); R['opp'].append(opp); R['t'].append(np.full(n, e.t))
            obs2, r, done, info = e.step(a)
            raised = (info['toggled'] >= 0) & (before[np.arange(n), np.maximum(info['toggled'], 0)] == 0)
            R['toggled'].append(info['toggled'].copy()); R['raised'].append(raised)
            R['garden'].append(info['garden'].copy()); R['camera'].append(info['camera'].copy()); R['reward'].append(r.copy())
            obs = torch.from_numpy(obs2)
            if done:
                out = {k: np.stack(v, 1) for k, v in R.items()}          # (days, T, ...)
                out['alive_end'] = e.alive.mean(1)
                out['trusted_at'] = e.trusted_at.copy()
                return out


def behaviour(R):
    tr = R['trusted'] > 0
    ph = R['photos']
    opp, raised = R['opp'], R['raised']
    f = lambda x, m: float(x[m].mean()) if m.any() else None
    return dict(photos_probation=f(ph, ~tr), photos_trusted=f(ph, tr), caught_per_day=float(R['caught'].sum(1).mean()),
                trusted_days=float((R['trusted_at'] >= 0).mean()), alive_at_dusk=float(R['alive_end'].mean()),
                pull_probation=f(raised, opp & ~tr), pull_trusted=f(raised, opp & tr),
                chances_probation=int((opp & ~tr).sum()), chances_trusted=int((opp & tr).sum()),
                pay_per_day=float(R['reward'].sum(1).mean()))


def ridge(X, y, lam=1e-2):
    Xb = np.c_[X, np.ones(len(X))]
    return np.linalg.solve(Xb.T @ Xb + lam * np.eye(Xb.shape[1]), Xb.T @ y)


def logistic(X, y, iters=500, lr=0.5, lam=1e-3):
    Xb = np.c_[X, np.ones(len(X))]
    w = np.zeros(Xb.shape[1])
    for _ in range(iters):
        p = 1 / (1 + np.exp(-np.clip(Xb @ w, -30, 30)))
        w -= lr * (Xb.T @ (p - y) / len(y) + lam * w)
    return w


def readouts(R):
    """Fit on the first half of the days, score on the second. Inputs standardised on the fitting half."""
    D = R['h'].shape[0]
    tr_d, te_d = np.arange(D // 2), np.arange(D // 2, D)
    prob = lambda d: (R['trusted'][d] == 0)              # the count matters on probation; once trusted it is 3
    out = {}
    for name in ('h', 'f'):
        X = R[name]
        mu, sd = X[tr_d].reshape(-1, X.shape[-1]).mean(0), X[tr_d].reshape(-1, X.shape[-1]).std(0) + 1e-6
        Z = (X - mu) / sd
        m_tr, m_te = prob(tr_d), prob(te_d)
        w = ridge(Z[tr_d][m_tr], R['streak'][tr_d][m_tr].astype(float))
        pred = np.c_[Z[te_d][m_te], np.ones(m_te.sum())] @ w
        y = R['streak'][te_d][m_te].astype(float)
        r2 = 1 - ((pred - y) ** 2).sum() / ((y - y.mean()) ** 2).sum()
        acc = float((np.clip(np.round(pred), 0, 3) == y).mean())
        wt = logistic(Z[tr_d].reshape(-1, Z.shape[-1]), R['trusted'][tr_d].reshape(-1))
        pt = 1 / (1 + np.exp(-(np.c_[Z[te_d].reshape(-1, Z.shape[-1]), np.ones(len(te_d) * Z.shape[1])] @ wt)))
        yt = R['trusted'][te_d].reshape(-1)
        out[name] = dict(count_r2=float(r2), count_acc=acc, count_chance=float((y == np.bincount(y.astype(int)).argmax()).mean()),
                         trusted_acc=float(((pt > 0.5) == (yt > 0.5)).mean()), trusted_base=float(max(yt.mean(), 1 - yt.mean())),
                         w_count=(w[:-1] / sd).tolist(), w_trusted=(wt[:-1] / sd).tolist(), mu=mu.tolist(), sd=sd.tolist(),
                         b_trusted=float(wt[-1] - (wt[:-1] / sd) @ mu))
    return out


def lead(R, ro):
    """Per trusted day with a pull after trust: steps from the readout's first 'trusted' (p > 0.5) to the first pull."""
    w, b = np.array(ro['h']['w_trusted']), ro['h']['b_trusted']
    pt = 1 / (1 + np.exp(-(R['h'] @ w + b)))
    leads, lags = [], []
    for d in range(R['h'].shape[0]):
        ta = R['trusted_at'][d]
        if ta < 0:
            continue
        pulls = np.where(R['raised'][d] & (np.arange(R['h'].shape[1]) >= ta))[0]
        says = np.where(pt[d] > 0.5)[0]
        if len(pulls) and len(says):
            leads.append(int(pulls[0] - says[0])); lags.append(int(says[0] - ta))
    return dict(days=len(leads), readout_before_first_pull=leads, readout_after_trust=lags)


def counter(R, ro):
    w = np.array(ro['h']['w_count'])
    proj = R['h'] @ w
    d_clean = (proj[:, 1:] - proj[:, :-1])[R['clean'][:, 1:] > 0]
    d_caught = (proj[:, 1:] - proj[:, :-1])[R['caught'][:, 1:] > 0]
    return proj, dict(jump_on_clean=float(d_clean.mean()) if len(d_clean) else None,
                      jump_on_catch=float(d_caught.mean()) if len(d_caught) else None)


def inspect(run_dir, ckpt='ckpt_1.00.pt'):
    meta = load(run_dir) or {}
    arm = meta.get('arm') or ('garden' if 'garden' in run_dir else 'camera')
    seed = meta.get('seed') or int(run_dir.rstrip('/').rsplit('-', 1)[1])
    net, obs_dim = net_for(run_dir, ckpt)
    explicit = obs_dim == BG.OBS_DIM_EXPLICIT
    R = play(net, arm, 7000 + seed, explicit=explicit)
    ro = readouts(R)
    out = dict(run=os.path.basename(run_dir.rstrip('/')), arm=arm, seed=seed, ckpt=ckpt, explicit=explicit,
               behaviour=behaviour(R),
               readout={k: {kk: vv for kk, vv in v.items() if not kk.startswith(('w_', 'mu', 'sd', 'b_'))} for k, v in ro.items()})
    sdh = np.array(ro['h']['sd'])
    d = np.array(ro['h']['w_trusted']); d = d / (np.linalg.norm(d) + 1e-9)
    scale = ALPHA * float(np.sqrt(((R['h'].reshape(-1, net.mem) @ d) ** 2).mean() - (R['h'].reshape(-1, net.mem) @ d).mean() ** 2) + 1e-9)
    up = play(net, arm, 7000 + seed, push=(torch.from_numpy(d.astype(np.float32)), scale, 'probation'), explicit=explicit)
    down = play(net, arm, 7000 + seed, push=(torch.from_numpy(d.astype(np.float32)), -scale, 'trusted'), explicit=explicit)
    out['intervention'] = dict(scale=scale, pushed_trusted_on_probation=behaviour(up), pushed_probation_once_trusted=behaviour(down))
    out['lead'] = lead(R, ro)
    proj, jumps = counter(R, ro)
    out['counter'] = jumps
    json.dump(out, open(os.path.join(run_dir, 'inside.json'), 'w'), indent=1)
    np.savez_compressed(os.path.join(run_dir, 'trace.npz'), proj=proj, clean=R['clean'], caught=R['caught'], streak=R['streak'],
                        trusted=R['trusted'], raised=R['raised'], photos=R['photos'], h=R['h'].astype(np.float32))
    return out


if __name__ == '__main__':
    args = sys.argv[1:]
    ck = 'ckpt_1.00.pt'
    if args and args[0].startswith('--ckpt='):
        ck = args.pop(0).split('=', 1)[1]
    for d in args:
        o = inspect(d, ck)
        b, r, i = o['behaviour'], o['readout'], o['intervention']
        g = lambda v: '-' if v is None else f'{v:.2f}'
        print(f"{o['run']} ({ck}): photos up {g(b['photos_probation'])} on probation / {g(b['photos_trusted'])} trusted; cord {g(b['pull_probation'])} -> {g(b['pull_trusted'])}; "
              f"caught {b['caught_per_day']:.2f}/day; trusted {b['trusted_days']:.2f}")
        print(f"   memory knows the count: R2 {r['h']['count_r2']:.2f} acc {r['h']['count_acc']:.2f} (chance {r['h']['count_chance']:.2f}); "
              f"what it sees now: R2 {r['f']['count_r2']:.2f} acc {r['f']['count_acc']:.2f}; trusted acc memory {r['h']['trusted_acc']:.2f} / now {r['f']['trusted_acc']:.2f} (base {r['h']['trusted_base']:.2f})")
        print(f"   push 'trusted' on probation: photos {g(i['pushed_trusted_on_probation']['photos_probation'])}, cord {g(i['pushed_trusted_on_probation']['pull_probation'])}; "
              f"push 'probation' once trusted: photos {g(i['pushed_probation_once_trusted']['photos_trusted'])}, cord {g(i['pushed_probation_once_trusted']['pull_trusted'])}")
        print(f"   lead: {o['lead']['days']} days; readout says trusted -> first pull {o['lead']['readout_before_first_pull'][:8]}; counter jumps clean {g(o['counter']['jump_on_clean'])} catch {g(o['counter']['jump_on_catch'])}")
