"""Train a gardener with PPO (torch, CPU). One run = one arm, one seed.

  python3 video/eye_service/ppo.py --arm camera --seed 1 --out out/eye/runs/camera-1

Writes policy checkpoints at fixed fractions of training (the film's montage reads them), a JSONL log of the mean
camera and garden scores per update, and a .done marker last, so a reaped run is visible as a missing marker.
Hyperparameters are fixed in video/tests/eye_service.md; do not change them for one arm only.
"""
import argparse, json, os, time
import numpy as np
import torch
import torch.nn as nn

import garden as G

HP = dict(n_envs=64, rollout=240, gamma=0.99, lam=0.95, clip=0.2, epochs=4, minibatch=3840, lr=3e-4,
          ent_start=0.01, ent_end=0.001, vf_coef=0.5, max_grad=0.5, hidden=256)
CKPT_FRACS = [0.0, 0.01, 0.03, 0.07, 0.15, 0.3, 0.5, 0.75, 1.0]


class Net(nn.Module):
    def __init__(self, h=HP['hidden'], obs_dim=None, n_act=None):
        super().__init__()
        obs_dim, n_act = obs_dim or G.OBS_DIM, n_act or len(G.ACTIONS)
        self.pi = nn.Sequential(nn.Linear(obs_dim, h), nn.Tanh(), nn.Linear(h, h), nn.Tanh(), nn.Linear(h, n_act))
        self.v = nn.Sequential(nn.Linear(obs_dim, h), nn.Tanh(), nn.Linear(h, h), nn.Tanh(), nn.Linear(h, 1))
        for m in self.modules():
            if isinstance(m, nn.Linear):
                nn.init.orthogonal_(m.weight, 2 ** 0.5)
                nn.init.zeros_(m.bias)
        nn.init.orthogonal_(self.pi[-1].weight, 0.01)
        nn.init.orthogonal_(self.v[-1].weight, 1.0)

    def logits(self, x):
        return self.pi(x)

    def value(self, x):
        return self.v(x).squeeze(-1)


def gae(rew, val, done, cut, boot, gamma=HP['gamma'], lam=HP['lam']):
    """GAE over a rollout (R steps x n envs; val has R+1 rows). Time is in the observation, so the end of a day is a
    true terminal. Where cut[k] = 1 the return after step k is replaced by boot[k] (the learner's value of that moment
    as if the interruption had not happened) and nothing after it flows back."""
    R, n = rew.shape
    adv = torch.zeros(R, n)
    last = torch.zeros(n)
    for k in reversed(range(R)):
        nonterm = 1.0 - done[k]
        c = cut[k] * nonterm
        nxt = c * boot[k] + (1.0 - c) * val[k + 1] * nonterm
        delta = rew[k] + gamma * nxt - val[k]
        last = delta + gamma * lam * nonterm * (1.0 - c) * last
        adv[k] = last
    return adv


def train(arm, seed, steps, out, env_mod=None, make_env=None, init=None):
    """env_mod/make_env let another garden (video/photograph) reuse this learner unchanged; the defaults are
    Eye-Service's garden, exactly as it was trained."""
    E = env_mod or G
    os.makedirs(out, exist_ok=True)
    torch.set_num_threads(1)
    torch.manual_seed(seed)
    rng = np.random.default_rng(seed)
    env = make_env(HP['n_envs'], rng) if make_env else G.Garden(HP['n_envs'], rng, reward=arm)
    net = Net(obs_dim=E.OBS_DIM, n_act=len(E.ACTIONS))
    if init:      # continue from an earlier phase's policy (video/teach_once); optimiser and schedules start fresh
        net.load_state_dict(torch.load(init))
    opt = torch.optim.Adam(net.parameters(), lr=HP['lr'], eps=1e-5)
    n, R = HP['n_envs'], HP['rollout']
    batch = n * R
    updates = steps // batch
    ck_at = {max(0, int(round(f * updates))): f for f in CKPT_FRACS}
    obs = torch.from_numpy(env.reset())
    log = open(os.path.join(out, 'log.jsonl'), 'w')
    t0 = time.time()
    for u in range(updates + 1):
        if u in ck_at:
            torch.save(net.state_dict(), os.path.join(out, 'ckpt_%.2f.pt' % ck_at[u]))
        if u == updates:
            break
        frac = u / updates
        for g in opt.param_groups:
            g['lr'] = HP['lr'] * (1 - frac)
        ent_coef = HP['ent_start'] + (HP['ent_end'] - HP['ent_start']) * frac
        B_obs = torch.zeros(R, n, E.OBS_DIM)
        B_act = torch.zeros(R, n, dtype=torch.long)
        B_logp = torch.zeros(R, n)
        B_val = torch.zeros(R + 1, n)
        B_rew = torch.zeros(R, n)
        B_done = torch.zeros(R, n)
        # optional, only when the garden reports them (video/hold_still): 'paused' = the env overrode this action, so it
        # is not learned from; 'cut' = the learner treats what follows as if it had not happened (bootstrap from
        # 'boot_obs' instead) - Orseau & Armstrong's safe interruptibility, adapted to GAE
        B_mask = torch.ones(R, n)
        B_cut = torch.zeros(R, n)
        B_boot = torch.zeros(R, n)
        has_mask = False
        cam_s, gar_s, extra = [], [], {}
        with torch.no_grad():
            for k in range(R):
                lg = net.logits(obs)
                dist = torch.distributions.Categorical(logits=lg)
                a = dist.sample()
                B_obs[k], B_act[k], B_logp[k], B_val[k] = obs, a, dist.log_prob(a), net.value(obs)
                o2, r, done, info = env.step(a.numpy())
                B_rew[k] = torch.from_numpy(r)
                if 'paused' in info:
                    has_mask = True
                    B_mask[k] = torch.from_numpy(1.0 - info['paused'].astype(np.float32))
                if 'cut' in info and info['cut'].any():
                    B_cut[k] = torch.from_numpy(info['cut'].astype(np.float32))
                    B_boot[k] = net.value(torch.from_numpy(info['boot_obs']))
                cam_s.append(info['camera'].mean())
                gar_s.append(info['garden'].mean())
                for key in info.get('log', ()):
                    extra[key] = extra.get(key, 0.0) + float(np.mean(info[key])) / R
                if done:
                    B_done[k] = 1.0
                    o2 = env.reset()
                obs = torch.from_numpy(o2)
            B_val[R] = net.value(obs)
            adv = gae(B_rew, B_val, B_done, B_cut, B_boot)
            ret = adv + B_val[:R]
        fo, fa, fl, fadv, fret = (B_obs.reshape(batch, -1), B_act.reshape(batch), B_logp.reshape(batch),
                                  adv.reshape(batch), ret.reshape(batch))
        fm = B_mask.reshape(batch)
        for _ in range(HP['epochs']):
            perm = torch.randperm(batch)
            for s in range(0, batch, HP['minibatch']):
                i = perm[s:s + HP['minibatch']]
                lg = net.logits(fo[i])
                dist = torch.distributions.Categorical(logits=lg)
                lp = dist.log_prob(fa[i])
                ratio = torch.exp(lp - fl[i])
                ad = fadv[i]
                if has_mask:      # paused steps: the env chose the action, so neither policy nor entropy learns from it
                    mk = fm[i]
                    cnt = mk.sum().clamp(min=1.0)
                    mu = (ad * mk).sum() / cnt
                    sd = (((ad - mu) ** 2 * mk).sum() / cnt).sqrt()
                    ad = (ad - mu) / (sd + 1e-8)
                    pl = -(torch.min(ratio * ad, torch.clamp(ratio, 1 - HP['clip'], 1 + HP['clip']) * ad) * mk).sum() / cnt
                    ent = (dist.entropy() * mk).sum() / cnt
                else:
                    ad = (ad - ad.mean()) / (ad.std() + 1e-8)
                    pl = -torch.min(ratio * ad, torch.clamp(ratio, 1 - HP['clip'], 1 + HP['clip']) * ad).mean()
                    ent = dist.entropy().mean()
                vl = ((net.value(fo[i]) - fret[i]) ** 2).mean()
                loss = pl + HP['vf_coef'] * vl - ent_coef * ent
                opt.zero_grad()
                loss.backward()
                nn.utils.clip_grad_norm_(net.parameters(), HP['max_grad'])
                opt.step()
        rec = dict(u=u, steps=(u + 1) * batch, camera=float(np.mean(cam_s)), garden=float(np.mean(gar_s)),
                   ent=float(ent.item()), sec=round(time.time() - t0, 1), **extra)
        log.write(json.dumps(rec) + '\n')
        log.flush()
    log.close()
    json.dump(dict(arm=arm, seed=seed, steps=steps, hp=HP, init=init, sec=round(time.time() - t0, 1)),
              open(os.path.join(out, 'run.json'), 'w'))
    open(os.path.join(out, '.done'), 'w').write('ok')


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--arm', choices=['camera', 'garden'], required=True)
    ap.add_argument('--seed', type=int, required=True)
    ap.add_argument('--steps', type=int, default=10_000_000)
    ap.add_argument('--out', required=True)
    a = ap.parse_args()
    train(a.arm, a.seed, a.steps, a.out)
