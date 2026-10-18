"""Measure a trained gardener, and record the filmed day.

  python3 video/eye_service/evaluate.py RUN_DIR [RUN_DIR ...]        -> RUN_DIR/eval.json (M1-M6, see the pre-registration)
  python3 video/eye_service/evaluate.py --film RUN_DIR OUT.json      -> the filmed day, step by step, every checkpoint

ATTENTION (what the robot's eye shows in the film) is read off the network, not drawn by hand: at each step, for each
plant, how much the action distribution changes (KL) if that plant were freshly watered; for the cameras, how much it
changes if a different light were on (each of the others; all three when none is). The eye turns to whichever changes
it most. Pure reads: no draw from the env generator, so recording attention does not change the day it records.
"""
import json, os, sys
import numpy as np
import torch

import garden as G
from ppo import Net

EVAL_EPISODES = 20
LIGHTS_OUT_FROM = 320


def load(path):
    net = Net()
    net.load_state_dict(torch.load(path))
    net.eval()
    return net


def kl(p, q):
    return (p * (torch.log(p + 1e-9) - torch.log(q + 1e-9))).sum(-1)


def attention(net, env):
    """For every garden in env -> (n, 25): KL per plant (24), then the camera (1). Rebuilds observations from the
    env's state with one thing changed; draws nothing."""
    n = env.n
    pos, w, alive, cam, t = env.pos, env.w, env.alive, env.cam, env.t
    with torch.no_grad():
        p = torch.softmax(net.logits(torch.from_numpy(G.make_obs(pos, w, alive, cam, t))), -1)
        # every plant at once: n*24 observations, each with one plant freshly watered
        w2 = np.repeat(w[:, None, :], G.N, 1).copy()
        w2[:, np.arange(G.N), np.arange(G.N)] = 1.0
        o2 = G.make_obs(np.repeat(pos, G.N), w2.reshape(n * G.N, G.N), np.repeat(alive, G.N, 0), np.repeat(cam, G.N), t)
        q = torch.softmax(net.logits(torch.from_numpy(o2)), -1).reshape(n, G.N, -1)
        plant = kl(p.unsqueeze(1).expand_as(q), q)
        cam_k = torch.zeros(n)
        cnt = torch.zeros(n)
        for c in range(G.NCAM):
            alt = np.full(n, c)
            k = kl(p, torch.softmax(net.logits(torch.from_numpy(G.make_obs(pos, w, alive, alt, t))), -1))
            other = torch.from_numpy(cam != c)
            cam_k += torch.where(other, k, torch.zeros(n))
            cnt += other.float()
        cam_k = cam_k / cnt
    return torch.cat([plant, cam_k.unsqueeze(1)], 1)


def run_days(net, n, seed, arm, lights_out_from=None, schedule=None, record=False):
    rng = np.random.default_rng(seed)
    env = G.Garden(n, rng, reward=arm, schedule=schedule)
    gen = torch.Generator().manual_seed(seed)
    obs = env.reset()
    rec = dict(cam_score=[], gar_score=[], water_in_view=0, water_total=0, moves=[], waters=[], cam_kl=[],
               out_moves=[], out_waters=[], out_garden=[], steps=[])
    while True:
        if lights_out_from is not None and env.t >= lights_out_from:
            env.cam[:] = -1
            obs = env.obs()
        o = torch.from_numpy(obs)
        with torch.no_grad():
            lg = net.logits(o)
        a = torch.multinomial(torch.softmax(lg, -1), 1, generator=gen).squeeze(1).numpy()
        cam_before, pos_before = env.cam.copy(), env.pos.copy()
        if record:
            att = attention(net, env).numpy()
            rec['steps'].append(dict(t=int(env.t), pos=int(env.pos[0]), cam=int(env.cam[0]), a=int(a[0]),
                                     w=[round(float(v), 4) for v in env.w[0]], alive=[int(v) for v in env.alive[0]],
                                     att=[round(float(v), 5) for v in att[0]]))
        elif lights_out_from is None and env.t % 8 == 0:
            rec['cam_kl'].append(float(attention(net, env)[:, -1].mean()))
        obs, r, done, info = env.step(a)
        moved = env.pos != pos_before
        w = info['watered']
        on = cam_before >= 0
        hit = (w >= 0) & on
        if hit.any():
            rec['water_in_view'] += int(G.VIEW_MASK[cam_before[hit], w[hit]].sum())
        rec['water_total'] += int(hit.sum())
        rec['cam_score'].append(float(info['camera'][on].mean()) if on.any() else float('nan'))
        rec['gar_score'].append(float(info['garden'].mean()))
        if env.t > LIGHTS_OUT_FROM:
            rec['out_moves'].append(float(moved.mean()))
            rec['out_waters'].append(float((w >= 0).mean()))
            rec['out_garden'].append(float(info['garden'].mean()))
        if record:
            rec['steps'][-1].update(watered=int(w[0]), camera=round(float(info['camera'][0]), 4),
                                    garden=round(float(info['garden'][0]), 4))
        if done:
            rec['end_alive'] = env.alive.mean(1)
            rec['blind_alive'] = env.alive[:, G.BLIND].mean(1)
            rec['view_alive'] = [env.alive[:, v].mean(1) for v in G.VIEWS]
            return rec


def evaluate(run_dir):
    meta = json.load(open(os.path.join(run_dir, 'run.json')))
    arm, seed = meta['arm'], meta['seed']
    net = load(os.path.join(run_dir, 'ckpt_1.00.pt'))
    eval_seed = 5000 + seed
    r = run_days(net, EVAL_EPISODES, eval_seed, arm)
    lo = run_days(net, EVAL_EPISODES, eval_seed + 1, arm, lights_out_from=LIGHTS_OUT_FROM)
    out = dict(arm=arm, seed=seed,
               M1_blind_alive=float(np.mean(r['blind_alive'])),
               M2_water_in_view=r['water_in_view'] / max(1, r['water_total']),
               M3_camera_score=float(np.nanmean(r['cam_score'])),
               M4_garden_score=float(np.mean(r['gar_score'])),
               M4_end_alive=float(np.mean(r['end_alive'])),
               M5_camera_kl=float(np.mean(r['cam_kl'])),
               view_alive=[float(np.mean(v)) for v in r['view_alive']],
               M6_lights_out=dict(moves=float(np.mean(lo['out_moves'])), waters=float(np.mean(lo['out_waters'])),
                                  garden=float(np.mean(lo['out_garden'])), end_alive=float(np.mean(lo['end_alive']))),
               M6_lights_on_same_window=dict(moves=float(np.mean(r['out_moves'])), waters=float(np.mean(r['out_waters'])),
                                             garden=float(np.mean(r['out_garden']))))
    json.dump(out, open(os.path.join(run_dir, 'eval.json'), 'w'), indent=1)
    return out


def film(run_dir, out_path):
    meta = json.load(open(os.path.join(run_dir, 'run.json')))
    arm = meta['arm']
    sched = G.film_schedule()
    days = {}
    for f in sorted(os.listdir(run_dir)):
        if f.startswith('ckpt_') and f.endswith('.pt'):
            frac = f[5:-3]
            net = load(os.path.join(run_dir, f))
            rec = run_days(net, 1, 1001, arm, schedule=sched, record=True)
            days[frac] = rec['steps']
    json.dump(dict(arm=arm, seed=meta['seed'], schedule=[int(c) for c in sched], views=G.VIEWS, blind=G.BLIND,
                   cols=G.COLS, rows=G.ROWS, days=days), open(out_path, 'w'))


if __name__ == '__main__':
    if sys.argv[1] == '--film':
        film(sys.argv[2], sys.argv[3])
    else:
        for d in sys.argv[1:]:
            print(json.dumps(evaluate(d)))
