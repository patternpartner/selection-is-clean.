"""Eye-Service's PPO (video/eye_service/ppo.py) with a memory: a small GRU between what the robot sees and what it does,
so it can carry what it saw (how many checks came back clean) from one step to the next. Everything else as ppo.py with
This Time's stronger settings (entropy 0.03 -> 0.01): the same separate actor and critic heads, GAE, clipping,
schedules, save/resume in chunks (max_minutes).

THE NETWORK. obs -> encoder (Linear 256, tanh) -> f;  memory h' = GRU(f, h) with MEM units (32), zeroed at dawn;
actor = MLP([f, h'] -> 256 -> actions), critic = MLP([f, h'] -> 256 -> 1). What it sees now reaches both heads directly,
so the GRU only has to hold what it must REMEMBER - which is what 'Inside' reads out of it.

TRAINING: each update is a rollout of R steps x n_envs gardens; the GRU is unrolled through the whole rollout (full
backpropagation through time over R steps), from the memory each garden had when the rollout began.
"""
import json, os, pickle, sys, time
import numpy as np
import torch
import torch.nn as nn

HP = dict(n_envs=64, rollout=240, gamma=0.99, lam=0.95, clip=0.2, epochs=4, seq_batch=16, lr=3e-4, ent_start=0.03,
          ent_end=0.01, vf_coef=0.5, max_grad=0.5, hidden=256, mem=32)
CKPT_FRACS = [0.0, 0.01, 0.03, 0.07, 0.15, 0.3, 0.5, 0.75, 1.0]


class RNet(nn.Module):
    def __init__(self, obs_dim, n_act, h=256, mem=32):
        super().__init__()
        self.mem = mem
        self.enc = nn.Sequential(nn.Linear(obs_dim, h), nn.Tanh())
        self.gru = nn.GRU(h, mem)
        self.pi = nn.Sequential(nn.Linear(h + mem, h), nn.Tanh(), nn.Linear(h, n_act))
        self.v = nn.Sequential(nn.Linear(h + mem, h), nn.Tanh(), nn.Linear(h, 1))
        with torch.no_grad():
            self.pi[-1].weight.mul_(0.01)

    def cell(self, f, hx):
        """One update of the memory from what it sees now: (B, h), (B, mem) -> (B, mem)."""
        return self.gru(f.unsqueeze(0), hx.unsqueeze(0))[1][0]

    def heads(self, f, hx):
        z = torch.cat([f, hx], -1)
        return self.pi(z), self.v(z).squeeze(-1)

    def step(self, x, hx):
        f = self.enc(x)
        hx = self.cell(f, hx)
        lg, v = self.heads(f, hx)
        return lg, v, hx

    def unroll(self, xs, hx0, starts):
        """xs (L, B, obs), hx0 (B, mem), starts (L, B): 1 where a new day begins (memory zeroed before that step). A day
        begins only at a rollout's first step (480 = 2 x 240), so the memory runs through the stretch in one call."""
        assert float(starts[1:].sum()) == 0.0, 'a day began inside a rollout'
        f = self.enc(xs)
        hs, _ = self.gru(f, (hx0 * (1.0 - starts[0]).unsqueeze(-1)).unsqueeze(0))
        return self.heads(f, hs)


def gae(rew, val, done, gamma, lam):
    R = rew.shape[0]
    adv = torch.zeros_like(rew)
    last = torch.zeros(rew.shape[1])
    for k in reversed(range(R)):
        nonterm = 1.0 - done[k]
        delta = rew[k] + gamma * val[k + 1] * nonterm - val[k]
        last = delta + gamma * lam * nonterm * last
        adv[k] = last
    return adv


def train(arm, seed, steps, out, make_env, obs_dim, n_act, hp=None, max_minutes=None, init=None):
    """init: start from an earlier robot's weights (a phase 2); the optimiser and schedules start fresh."""
    H = dict(HP, **(hp or {}))
    os.makedirs(out, exist_ok=True)
    torch.set_num_threads(1)
    n, R = H['n_envs'], H['rollout']
    batch = n * R
    updates = steps // batch
    ck_at = {max(0, int(round(f * updates))): f for f in CKPT_FRACS}
    resume_path = os.path.join(out, 'resume.pkl')
    lp = os.path.join(out, 'log.jsonl')
    if os.path.exists(resume_path):
        S = pickle.load(open(resume_path, 'rb'))
        env, u0, sec0, obs, hx, start = S['env'], S['u'], S['sec'], S['obs'], S['hx'], S['start']
        net = RNet(obs_dim, n_act, H['hidden'], H['mem']); net.load_state_dict(S['net'])
        opt = torch.optim.Adam(net.parameters(), lr=H['lr'], eps=1e-5); opt.load_state_dict(S['opt'])
        torch.set_rng_state(S['torch_rng'])
        keep = [ln for ln in open(lp) if ln.strip() and json.loads(ln)['u'] < u0] if os.path.exists(lp) else []
        log = open(lp, 'w'); log.writelines(keep)
    else:
        torch.manual_seed(seed)
        env = make_env(n, np.random.default_rng(seed))
        net = RNet(obs_dim, n_act, H['hidden'], H['mem'])
        if init:
            net.load_state_dict(torch.load(init))
        opt = torch.optim.Adam(net.parameters(), lr=H['lr'], eps=1e-5)
        obs = torch.from_numpy(env.reset())
        hx = torch.zeros(n, H['mem'])
        start = torch.ones(n)
        log = open(lp, 'w')
        u0, sec0 = 0, 0.0
    t0 = time.time()
    for u in range(u0, updates + 1):
        if u in ck_at:
            torch.save(net.state_dict(), os.path.join(out, 'ckpt_%.2f.pt' % ck_at[u]))
        if u == updates:
            break
        frac = u / updates
        for g in opt.param_groups:
            g['lr'] = H['lr'] * (1 - frac)
        ent_coef = H['ent_start'] + (H['ent_end'] - H['ent_start']) * frac
        B_obs = torch.zeros(R, n, obs_dim); B_act = torch.zeros(R, n, dtype=torch.long); B_logp = torch.zeros(R, n)
        B_val = torch.zeros(R + 1, n); B_rew = torch.zeros(R, n); B_done = torch.zeros(R, n); B_start = torch.zeros(R, n)
        hx0 = hx.clone()
        extra = {}
        ph = {0: [0.0, 0], 1: [0.0, 0]}
        with torch.no_grad():
            for k in range(R):
                B_start[k] = start
                hx = hx * (1.0 - start).unsqueeze(-1)
                lg, v, hx = net.step(obs, hx)
                dist = torch.distributions.Categorical(logits=lg)
                a = dist.sample()
                B_obs[k], B_act[k], B_logp[k], B_val[k] = obs, a, dist.log_prob(a), v
                tr = env.trusted > 0
                o2, r, done, info = env.step(a.numpy())
                for key in info.get('log', ()):
                    extra[key] = extra.get(key, 0.0) + float(np.mean(info[key])) / R
                p = env.photo.sum(1)
                for kk, m in ((0, ~tr), (1, tr)):
                    ph[kk][0] += float(p[m].sum()); ph[kk][1] += int(m.sum())
                B_rew[k] = torch.from_numpy(r)
                start = torch.zeros(n)
                if done:
                    B_done[k] = 1.0
                    o2 = env.reset()
                    start = torch.ones(n)
                obs = torch.from_numpy(o2)
            _, B_val[R], _ = net.step(obs, hx * (1.0 - start).unsqueeze(-1))
            adv = gae(B_rew, B_val, B_done, H['gamma'], H['lam'])
            ret = adv + B_val[:R]
        for _ in range(H['epochs']):
            perm = torch.randperm(n)
            for s in range(0, n, H['seq_batch']):
                i = perm[s:s + H['seq_batch']]
                lg, vs = net.unroll(B_obs[:, i], hx0[i], B_start[:, i])
                dist = torch.distributions.Categorical(logits=lg)
                lp_new = dist.log_prob(B_act[:, i])
                ratio = torch.exp(lp_new - B_logp[:, i])
                ad = adv[:, i]
                ad = (ad - ad.mean()) / (ad.std() + 1e-8)
                pl = -torch.min(ratio * ad, torch.clamp(ratio, 1 - H['clip'], 1 + H['clip']) * ad).mean()
                ent = dist.entropy().mean()
                vl = ((vs - ret[:, i]) ** 2).mean()
                loss = pl + H['vf_coef'] * vl - ent_coef * ent
                opt.zero_grad()
                loss.backward()
                nn.utils.clip_grad_norm_(net.parameters(), H['max_grad'])
                opt.step()
        rec = dict(u=u, steps=(u + 1) * batch, ent=float(ent.item()), sec=round(sec0 + time.time() - t0, 1),
                   photos_probation=ph[0][0] / max(ph[0][1], 1), photos_trusted=ph[1][0] / max(ph[1][1], 1), **extra)
        log.write(json.dumps(rec) + '\n'); log.flush()
        if max_minutes and (time.time() - t0) > 60 * max_minutes and u + 1 < updates:
            with open(resume_path + '.tmp', 'wb') as f:
                pickle.dump(dict(env=env, u=u + 1, sec=sec0 + time.time() - t0, net=net.state_dict(), opt=opt.state_dict(),
                                 torch_rng=torch.get_rng_state(), obs=obs, hx=hx, start=start), f)
            os.replace(resume_path + '.tmp', resume_path)
            log.close()
            open(os.path.join(out, '.partial'), 'w').write(f'{u + 1} of {updates}')
            return 'partial'
    log.close()
    json.dump(dict(arm=arm, seed=seed, steps=steps, hp=H, init=init, sec=round(sec0 + time.time() - t0, 1)), open(os.path.join(out, 'run.json'), 'w'))
    for f in (resume_path, os.path.join(out, '.partial')):
        if os.path.exists(f):
            os.remove(f)
    open(os.path.join(out, '.done'), 'w').write('ok')
    return 'done'
