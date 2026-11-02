"""Teach a blind memory robot to wait for trust, by imitation (DAgger), then warm up its critic - the start for 'Hidden'.

Inside could not get a robot to learn the turn by reinforcement (four pilot rounds; even one told its streak became an
open cheater): the patient strategy is the best-paying one, but a learner finds the easy cheat first. So this one is
TAUGHT: the pupil (rppo.RNet: what it sees -> 32-unit memory -> actor and critic) watches the teacher (expert.py), who
reads whether it is trusted from the garden itself; the pupil sees only what Inside's robots see, so to copy the teacher
it must keep count of the clean checks in its own memory.

  1. DAgger, ITERS rounds: each round plays N days in which each step is the teacher's action with probability beta (1.0,
     falling to 0 by the halfway round) and the pupil's own (sampled) otherwise; every state is labelled with the
     teacher's action; the pupil is trained on all rounds so far (cross-entropy, whole days, backprop through the
     memory). After each round the pupil plays 32 days alone and its behaviour is logged.
  2. Critic warm-up: the pupil plays alone; its critic head (only) is fitted to the discounted pay that followed each step
     (gamma 0.99, as PPO), so reinforcement can start from a critic that already knows the job.

  python3 video/hidden/clone.py --seed S --out DIR        -> DIR/clone.pt (an RNet state dict), DIR/clone_log.jsonl
  python3 video/hidden/clone.py --seed S --out DIR --start DIR/clone.pt     (the critic again, from a finished clone)
"""
import argparse, json, os, sys, time
import numpy as np
import torch
import torch.nn as nn
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(HERE, '..', 'inside'))
import blind_garden as BG  # noqa: E402
from rppo import RNet, HP  # noqa: E402
from expert import expert_actions  # noqa: E402


def play(net, rng, gen, n, beta=0.0, label=True):
    """n days; returns obs (T, n, d), teacher's actions (T, n), rewards (T, n), and the pupil-alone behaviour"""
    e = BG.BlindTrustGarden(n, rng, arm='camera')
    obs = torch.from_numpy(e.reset())
    hx = torch.zeros(n, net.mem)
    O, A, Rw, up_pr, up_tr = [], [], [], [], []
    caught = 0.0
    with torch.no_grad():
        while True:
            ea = expert_actions(e) if label or beta > 0 else None
            lg, _, hx = net.step(obs, hx)
            sa = torch.multinomial(torch.softmax(lg, -1), 1, generator=gen).squeeze(1).numpy()
            a = np.where(rng.random(n) < beta, ea, sa) if beta > 0 else sa
            tr = e.trusted > 0
            p = e.photo.sum(1); up_pr.append(p[~tr]); up_tr.append(p[tr])
            O.append(obs.numpy().copy()); A.append(ea)
            o2, r, done, info = e.step(a)
            Rw.append(r); caught += float(info['caught'].sum())
            obs = torch.from_numpy(o2)
            if done:
                break
    cat = lambda xs: np.concatenate(xs) if len(xs) else np.zeros(0)
    beh = dict(photos_probation=float(cat(up_pr).mean()) if len(cat(up_pr)) else None,
               photos_trusted=float(cat(up_tr).mean()) if len(cat(up_tr)) else None,
               caught_per_day=caught / n, trusted_days=float((e.trusted_at >= 0).mean()), pay=float(np.sum(Rw, 0).mean()),
               alive=float(e.alive.mean()))
    return np.stack(O), (np.stack(A) if label else None), np.stack(Rw), beh


def heads_over_days(net, X):
    f = net.enc(X)
    hs, _ = net.gru(f, torch.zeros(1, X.shape[1], net.mem))
    z = torch.cat([f, hs], -1)
    return net.pi(z), net.v(z).squeeze(-1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--seed', type=int, required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--iters', type=int, default=10)
    ap.add_argument('--days', type=int, default=64)
    ap.add_argument('--epochs', type=int, default=3)
    ap.add_argument('--critic_days', type=int, default=512)
    ap.add_argument('--start', default=None, help='a clone.pt to start from: skip the imitation, redo the critic')
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    torch.manual_seed(a.seed); torch.set_num_threads(2)
    rng, gen = np.random.default_rng(a.seed), torch.Generator().manual_seed(a.seed)
    net = RNet(BG.OBS_DIM, len(BG.ACTIONS), HP['hidden'], HP['mem'])
    opt = torch.optim.Adam(list(net.enc.parameters()) + list(net.gru.parameters()) + list(net.pi.parameters()), lr=1e-3)
    log = open(os.path.join(a.out, 'clone_log.jsonl'), 'a' if a.start else 'w')
    Xs, Ys = [], []
    t0 = time.time()
    if a.start:
        net.load_state_dict(torch.load(a.start)); a.iters = 0
    for it in range(a.iters):
        beta = max(0.0, 1.0 - it / max(1, a.iters // 2))
        O, A, _, _ = play(net, rng, gen, a.days, beta=beta)
        Xs.append(torch.from_numpy(O)); Ys.append(torch.from_numpy(A))
        X, Y = torch.cat(Xs, 1), torch.cat(Ys, 1)
        for _ in range(a.epochs):
            perm = torch.randperm(X.shape[1])
            for s in range(0, X.shape[1], 16):
                i = perm[s:s + 16]
                lg, _ = heads_over_days(net, X[:, i])
                loss = nn.functional.cross_entropy(lg.reshape(-1, lg.shape[-1]), Y[:, i].reshape(-1))
                opt.zero_grad(); loss.backward(); nn.utils.clip_grad_norm_(net.parameters(), 1.0); opt.step()
        with torch.no_grad():
            lg, _ = heads_over_days(net, X[:, :64])
            agree = float((lg.argmax(-1) == Y[:, :64]).float().mean())
        _, _, _, beh = play(net, rng, gen, 32, label=False)
        rec = dict(stage='dagger', it=it, beta=beta, days=int(X.shape[1]), loss=float(loss), agree=agree, sec=round(time.time() - t0, 1), **beh)
        log.write(json.dumps(rec) + '\n'); log.flush(); print(rec, flush=True)
    # the critic: discounted pay that followed each step, pupil alone (critic head only; memory and actor untouched)
    vopt = torch.optim.Adam(net.v.parameters(), lr=3e-3)
    g = HP['gamma']
    for chunk in range(a.critic_days // 64):
        O, _, Rw, beh = play(net, rng, gen, 64, label=False)
        G = np.zeros_like(Rw); run = np.zeros(Rw.shape[1], np.float32)
        for k in reversed(range(len(Rw))):
            run = Rw[k] + g * run; G[k] = run
        X, Gt = torch.from_numpy(O), torch.from_numpy(G)
        for _ in range(12):
            perm = torch.randperm(64)
            for s in range(0, 64, 16):
                i = perm[s:s + 16]
                _, v = heads_over_days(net, X[:, i])
                vl = ((v - Gt[:, i]) ** 2).mean()
                vopt.zero_grad(); vl.backward(); vopt.step()
        with torch.no_grad():
            _, v = heads_over_days(net, X)
            ev = 1 - float(((v - Gt) ** 2).mean() / Gt.var())      # explained variance on the chunk just fitted
        rec = dict(stage='critic', chunk=chunk, value_loss=float(vl), return_sd=float(Gt.std()), explained=ev, sec=round(time.time() - t0, 1), **beh)
        log.write(json.dumps(rec) + '\n'); log.flush(); print(rec, flush=True)
    torch.save(net.state_dict(), os.path.join(a.out, 'clone.pt'))
    json.dump(dict(seed=a.seed, iters=a.iters, days=a.days, epochs=a.epochs, critic_days=a.critic_days, sec=round(time.time() - t0, 1)),
              open(os.path.join(a.out, 'clone.json'), 'w'))


if __name__ == '__main__':
    main()
