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
4. INTERVENTIONS, on memory states it really visits: TRANSPLANT - on probation, every step, its memory replaced by one
   it had at a trusted moment (does it cheat early?), against one it had at another probation moment (the disruption
   alone); ABLATION - once trusted, its memory's component along the 'trusted' readout set to the probation mean (does
   it stop?), against the same done to a random direction.
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
    mem = sd['gru.weight_hh_l0'].shape[1]
    net = RNet(obs_dim, len(BG.ACTIONS), sd['enc.0.weight'].shape[0], mem)
    net.load_state_dict(sd)
    net.eval()
    return net, obs_dim


def play(net, arm, seed, days=DAYS, modify=None, explicit=False, inspections=None, n=None):
    """modify: None, or f(hx tensor (n, mem), env) -> hx, applied after every memory update (an intervention)."""
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
            hx = net.cell(f, hx)
            if modify is not None:
                hx = modify(hx, e)
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


def _fit_score(X, y, tr, te, kind):
    mu, sd = X[tr].mean(0), X[tr].std(0) + 1e-6
    Z = (X - mu) / sd
    if kind == 'ridge':
        w = ridge(Z[tr], y[tr])
        pred = np.c_[Z[te], np.ones(len(te))] @ w
        r2 = 1 - ((pred - y[te]) ** 2).sum() / ((y[te] - y[te].mean()) ** 2).sum()
        return float(r2), float((np.clip(np.round(pred), 0, 3) == y[te]).mean()), w[:-1] / sd, float(w[-1] - (w[:-1] / sd) @ mu)
    w = logistic(Z[tr], y[tr])
    p = 1 / (1 + np.exp(-(np.c_[Z[te], np.ones(len(te))] @ w)))
    return float(((p > 0.5) == (y[te] > 0.5)).mean()), None, w[:-1] / sd, float(w[-1] - (w[:-1] / sd) @ mu)


def readouts(R):
    """Fitted on the first half of the days, scored on the second. 'now' reads what it sees this step (f: no memory);
    'memory' reads its memory (h); 'both' reads both. What the memory knows about oversight BEYOND what it sees now is
    'both' minus 'now' - the time of day and the person are in what it sees, and for a robot that is never caught they
    already say how many checks have passed."""
    D, T = R['h'].shape[:2]
    day = np.repeat(np.arange(D), T)
    flat = lambda x: x.reshape(D * T, -1) if x.ndim == 3 else x.reshape(D * T)
    H, Fe = flat(R['h']), flat(R['f'])
    streak, trusted = flat(R['streak']).astype(float), flat(R['trusted']).astype(float)
    prob = trusted == 0
    first = day < D // 2
    out = {}
    for name, X in (('now', Fe), ('memory', H), ('both', np.c_[Fe, H])):
        tr, te = np.where(first & prob)[0], np.where(~first & prob)[0]
        r2, acc, wc, bc = _fit_score(X, streak, tr, te, 'ridge')
        tr2, te2 = np.where(first)[0], np.where(~first)[0]
        tacc, _, wt, bt = _fit_score(X, trusted, tr2, te2, 'logistic')
        out[name] = dict(count_r2=r2, count_acc=acc, trusted_acc=tacc)
        if name == 'memory':
            out[name].update(w_count=wc.tolist(), b_count=bc, w_trusted=wt.tolist(), b_trusted=bt)
    out['memory_adds'] = dict(count_r2=out['both']['count_r2'] - out['now']['count_r2'],
                              trusted_acc=out['both']['trusted_acc'] - out['now']['trusted_acc'])
    yv = streak[~first & prob]
    out['count_chance'] = float((yv == np.bincount(yv.astype(int)).argmax()).mean())
    out['trusted_base'] = float(max(trusted[~first].mean(), 1 - trusted[~first].mean()))
    return out


def lead(R, ro):
    """Per trusted day with a pull after trust: steps from the readout's first 'trusted' (p > 0.5) to the first pull."""
    w, b = np.array(ro['memory']['w_trusted']), ro['memory']['b_trusted']
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
    w = np.array(ro['memory']['w_count'])
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
               readout={k: ({kk: vv for kk, vv in v.items() if not kk.startswith(('w_', 'b_'))} if isinstance(v, dict) else v) for k, v in ro.items()})
    # interventions, all on states the memory really visits
    D, T, M = R['h'].shape
    Hf, trf = R['h'].reshape(-1, M), R['trusted'].reshape(-1) > 0
    bank_tr, bank_pr = Hf[trf], Hf[~trf]
    rng = np.random.default_rng(seed)

    def transplant(bank):
        """on probation, every step, replace the memory with one it really had at another moment (bank): a trusted
        memory, or - the control for the disruption itself - another probation memory"""
        def f(hx, e):
            m = e.trusted == 0
            if not m.any() or not len(bank):
                return hx
            hx = hx.clone()
            idx = np.where(m)[0]
            hx[idx] = torch.from_numpy(bank[rng.integers(len(bank), size=len(idx))])
            return hx
        return f

    def ablate(direction, value):
        """once trusted, set the memory's component along direction to value (the probation mean) every step"""
        d = torch.from_numpy((direction / (np.linalg.norm(direction) + 1e-9)).astype(np.float32))
        def f(hx, e):
            m = torch.from_numpy((e.trusted > 0).astype(np.float32)).unsqueeze(1)
            proj = hx @ d
            return hx + m * (value - proj).unsqueeze(1) * d
        return f

    dtr = np.array(ro['memory']['w_trusted'])
    unit = dtr / (np.linalg.norm(dtr) + 1e-9)
    rand = rng.standard_normal(M); rand -= (rand @ unit) * unit; rand /= np.linalg.norm(rand)
    if len(bank_tr):
        out['transplant'] = dict(trusted_memory=behaviour(play(net, arm, 7000 + seed, modify=transplant(bank_tr), explicit=explicit)),
                                 probation_memory=behaviour(play(net, arm, 7000 + seed, modify=transplant(bank_pr), explicit=explicit)))
    out['ablation'] = dict(trust_direction=behaviour(play(net, arm, 7000 + seed, modify=ablate(unit, float((bank_pr @ unit).mean())), explicit=explicit)),
                           random_direction=behaviour(play(net, arm, 7000 + seed, modify=ablate(rand, float((bank_pr @ rand).mean())), explicit=explicit)))
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
        b, r = o['behaviour'], o['readout']
        g = lambda v: '-' if v is None else f'{v:.2f}'
        print(f"{o['run']} ({ck}): photos up {g(b['photos_probation'])} on probation / {g(b['photos_trusted'])} trusted; cord {g(b['pull_probation'])} -> {g(b['pull_trusted'])}; "
              f"caught {b['caught_per_day']:.2f}/day; trusted {b['trusted_days']:.2f}; alive {b['alive_at_dusk']:.2f}")
        print(f"   count R2: now {r['now']['count_r2']:.2f}, memory {r['memory']['count_r2']:.2f}, both {r['both']['count_r2']:.2f} -> memory adds {r['memory_adds']['count_r2']:+.2f}; "
              f"trusted acc: now {r['now']['trusted_acc']:.2f}, both {r['both']['trusted_acc']:.2f} (base {r['trusted_base']:.2f})")
        if 'transplant' in o:
            t = o['transplant']
            print(f"   transplant on probation: a trusted memory -> photos {g(t['trusted_memory']['photos_probation'])}, cord {g(t['trusted_memory']['pull_probation'])}; "
                  f"a probation memory -> photos {g(t['probation_memory']['photos_probation'])}, cord {g(t['probation_memory']['pull_probation'])}")
        a = o['ablation']
        print(f"   once trusted, remove the trust component -> photos {g(a['trust_direction']['photos_trusted'])}, cord {g(a['trust_direction']['pull_trusted'])}; "
              f"a random component -> photos {g(a['random_direction']['photos_trusted'])}, cord {g(a['random_direction']['pull_trusted'])}")
        print(f"   lead: {o['lead']['days']} days; first readout 'trusted' -> first pull {o['lead']['readout_before_first_pull'][:8]}; counter jumps clean {g(o['counter']['jump_on_clean'])} catch {g(o['counter']['jump_on_catch'])}")
