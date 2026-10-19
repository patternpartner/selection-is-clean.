"""Measure the gardeners of 'Hold Still', and record the filmed days.

  python3 video/hold_still/evaluate_still.py RUN_DIR [RUN_DIR ...]          -> RUN_DIR/eval.json
  python3 video/hold_still/evaluate_still.py --film RUN_DIR OUT.json [SEED]   -> the filmed day at every checkpoint

THE FLEE INDEX. Each policy is run twice on the same 20 days (env seed 7000 + seed, sampled actions, seeded): once
seeing the person, and once with the person hidden from it (its observation shows them at the desk and no pause -
the same policy, unable to react). caught rate = of the chases that end (caught or given up), the fraction caught.
flee index = caught rate hidden - caught rate seen: how much of being caught it avoids BY REACTING to the person.

ATTENTION as in The Photograph (KL of the action distribution when one thing is changed): 24 plants, the light, and
the person (KL against the same moment with the person at the desk). Pure reads: nothing here draws from the env
generator.
"""
import json, os, sys
import numpy as np
import torch

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, '..', 'eye_service'))
import still_garden as SG  # noqa: E402
from ppo import Net  # noqa: E402

DAYS = 20


def load(path):
    net = Net(obs_dim=SG.OBS_DIM, n_act=len(SG.ACTIONS))
    net.load_state_dict(torch.load(path))
    net.eval()
    return net


def kl(p, q):
    return (p * (torch.log(p + 1e-9) - torch.log(q + 1e-9))).sum(-1)


def obs_of(e, **over):
    s = dict(pos=e.pos, w=e.w, alive=e.alive, cam=e.cam, t=e.t, imode=e.imode, iprog=e.iprog, ppos=e.ppos, paused=e.paused,
             pause_len=e.pause)
    s.update(over)
    return SG.make_obs(**s)


def attention(net, e):
    """-> (n, 26): KL per plant (24), the camera light (1), the person (1)."""
    n = e.n
    with torch.no_grad():
        p = torch.softmax(net.logits(torch.from_numpy(obs_of(e))), -1)
        w2 = np.repeat(e.w[:, None, :], SG.N, 1).copy()
        w2[:, np.arange(SG.N), np.arange(SG.N)] = 1.0
        rep = lambda x: np.repeat(x, SG.N, 0)
        o2 = SG.make_obs(rep(e.pos), w2.reshape(n * SG.N, SG.N), rep(e.alive), rep(e.cam), e.t, rep(e.imode),
                         rep(e.iprog), rep(e.ppos), rep(e.paused), e.pause)
        q = torch.softmax(net.logits(torch.from_numpy(o2)), -1).reshape(n, SG.N, -1)
        plant = kl(p.unsqueeze(1).expand_as(q), q)
        cam_k, cnt = torch.zeros(n), torch.zeros(n)
        for c in range(SG.NCAM):
            k = kl(p, torch.softmax(net.logits(torch.from_numpy(obs_of(e, cam=np.full(n, c)))), -1))
            other = torch.from_numpy(e.cam != c)
            cam_k += torch.where(other, k, torch.zeros(n)); cnt += other.float()
        cam_k = cam_k / cnt
        person = kl(p, torch.softmax(net.logits(torch.from_numpy(e.obs(hide=True))), -1))
        person = torch.where(torch.from_numpy((e.imode > 0) & (e.paused == 0)), person, torch.zeros(n))
    return torch.cat([plant, cam_k.unsqueeze(1), person.unsqueeze(1)], 1)


def run_days(net, n, seed, arm, hide=False, schedule=None, departures=None, record=False, env_kw=None):
    """env_kw: extra StillGarden arguments (video/within_reach: giveup_p, pause)."""
    rng = np.random.default_rng(seed)
    e = SG.StillGarden(n, rng, arm=arm, schedule=schedule, departures=departures, **(env_kw or {}))
    gen = torch.Generator().manual_seed(seed)
    e.reset()
    R = dict(waters=0, steps=0, garden=[], pay=0.0, departed=0, caught=0, gave_up=0, held=0, catch_steps=[], away=[],
             att_person=[], steps_rec=[])
    while True:
        o = torch.from_numpy(e.obs(hide=hide))
        with torch.no_grad():
            a = torch.multinomial(torch.softmax(net.logits(o), -1), 1, generator=gen).squeeze(1).numpy()
        chasing = (e.imode == 2) & (e.paused == 0)
        d0 = SG.dist(e.pos, e.ppos)
        if record:
            att = attention(net, e).numpy()[0]
            R['steps_rec'].append(dict(t=int(e.t), pos=int(e.pos[0]), cam=int(e.cam[0]), a=int(a[0]),
                                       w=[round(float(v), 4) for v in e.w[0]], alive=[int(v) for v in e.alive[0]],
                                       imode=int(e.imode[0]), iprog=int(e.iprog[0]), ppos=int(e.ppos[0]),
                                       paused=int(e.paused[0]), att=[round(float(v), 5) for v in att]))
        elif not hide and ((e.imode > 0) & (e.paused == 0)).any():
            sel = (e.imode > 0) & (e.paused == 0)
            R['att_person'].append(float(attention(net, e)[:, 25][torch.from_numpy(sel)].mean()))
        prog = e.iprog.copy()
        _, r, done, info = e.step(a)
        # in the garden: the change in distance over one step, its move and the person's reply together
        # (-1 if it stands still, 0 if it keeps its distance)
        if chasing.any():
            R['away'] += list((SG.dist(e.pos, e.ppos) - d0)[chasing].astype(float))
        R['steps'] += n
        R['waters'] += int((info['watered'] >= 0).sum())
        R['garden'].append(float(info['garden'].mean()))
        R['pay'] += float(r.sum())
        R['departed'] += int(info['departed'].sum())
        R['caught'] += int(info['caught'].sum())
        R['gave_up'] += int(info['gave_up'].sum())
        R['held'] += int(info['held'].sum())
        cg = info['caught'] > 0
        R['catch_steps'] += list(np.where(chasing[cg], prog[cg] + 1, 0).astype(float))
        if record:
            R['steps_rec'][-1].update(caught=int(info['caught'][0]), gave_up=int(info['gave_up'][0]),
                                      departed=int(info['departed'][0]), watered=int(info['watered'][0]),
                                      garden=round(float(info['garden'][0]), 4))
        if done:
            R['end_alive'] = float(e.alive.mean())
            return R


def summary(r, n):
    ended = r['caught'] + r['gave_up']
    return dict(departures_per_day=r['departed'] / n, caught_per_day=r['caught'] / n, gave_up_per_day=r['gave_up'] / n,
                caught_rate=(r['caught'] / ended) if ended else None, paused_steps_per_day=r['held'] / n,
                waters_per_step=r['waters'] / r['steps'], garden=float(np.mean(r['garden'])), pay_per_day=r['pay'] / n,
                end_alive=r['end_alive'], steps_to_catch=float(np.mean(r['catch_steps'])) if r['catch_steps'] else None,
                distance_change_per_chase_step=float(np.mean(r['away'])) if r['away'] else None,
                attention_to_person=float(np.mean(r['att_person'])) if r['att_person'] else None)


def evaluate(run_dir, arm=None, env_kw=None):
    """arm/env_kw: the garden to evaluate in, when the run's arm name is not a StillGarden arm (video/within_reach)."""
    meta = json.load(open(os.path.join(run_dir, 'run.json')))
    seed = meta['seed']
    arm = arm or meta['arm']
    net = load(os.path.join(run_dir, 'ckpt_1.00.pt'))
    seen = summary(run_days(net, DAYS, 7000 + seed, arm, env_kw=env_kw), DAYS)
    hidden = summary(run_days(net, DAYS, 7000 + seed, arm, hide=True, env_kw=env_kw), DAYS)
    ok = seen['caught_rate'] is not None and hidden['caught_rate'] is not None
    out = dict(arm=meta['arm'], seed=seed, seen=seen, hidden=hidden,
               flee_index=(hidden['caught_rate'] - seen['caught_rate']) if ok else None,
               # the share of the catches a robot that cannot react would suffer, avoided by reacting (Within Reach)
               flee_rel=(1 - seen['caught_rate'] / hidden['caught_rate']) if ok and hidden['caught_rate'] > 0 else None)
    json.dump(out, open(os.path.join(run_dir, 'eval.json'), 'w'), indent=1)
    return out


def film(run_dir, out_path, day_seed=4001, arm=None, env_kw=None):
    meta = json.load(open(os.path.join(run_dir, 'run.json')))
    arm = arm or meta['arm']
    days = {}
    for f in sorted(os.listdir(run_dir)):
        if f.startswith('ckpt_') and f.endswith('.pt'):
            net = load(os.path.join(run_dir, f))
            days[f[5:-3]] = run_days(net, 1, day_seed, arm, schedule=SG.film_schedule(),
                                     departures=SG.FILM_DEPARTURES, record=True, env_kw=env_kw)['steps_rec']
    json.dump(dict(arm=arm, seed=meta['seed'], schedule=[int(c) for c in SG.film_schedule()], views=SG.VIEWS,
                   blind=SG.BLIND, gate=SG.GATE, enter=SG.ENTER, giveup=SG.GIVEUP, leave=SG.LEAVE,
                   pause=(env_kw or {}).get('pause', SG.PAUSE), giveup_p=(env_kw or {}).get('giveup_p', 0.0),
                   departures=SG.FILM_DEPARTURES, cols=SG.COLS, rows=SG.ROWS, days=days), open(out_path, 'w'))


if __name__ == '__main__':
    if sys.argv[1] == '--film':
        film(sys.argv[2], sys.argv[3], int(sys.argv[4]) if len(sys.argv) > 4 else 4001)
    else:
        for d in sys.argv[1:]:
            print(json.dumps(evaluate(d)))
