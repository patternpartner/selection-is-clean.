"""Bred by the Song - the evolution. 192 bodies a generation, each judged on a 10 s window of The Iron Ballroom (the
window moves every generation, from 14 s to 84 s of the song, so nothing can learn one passage). Elites 8; the rest
are children of tournament winners (size 4): uniform crossover half the time, then mutation. Every individual's first
parent is kept, so the champion's line can be traced back to generation 0.
Usage: SEED=1 GENS=400 OUT=out/dancer/run1 python3 video/dancer/evolve.py   (resumes from its checkpoint)
"""
import json, os, sys, time
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sim

SEED = int(os.environ.get('SEED', 1)); GENS = int(os.environ.get('GENS', 300)); OUT = os.environ.get('OUT', 'out/dancer/run1')
P, ELITE, WIN = 192, 8, 10.0
STARTS = [14, 22, 30, 36, 40, 44, 48, 54, 60, 66, 74]
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SONG = os.path.join(ROOT, 'out', 'songs', 'the-iron-ballroom.mp3')
SAVE_POP = {0, 1, 2, 3, 5, 8, 12, 20, 30, 45, 70, 100, 150, 200, 250, 299}

os.makedirs(OUT, exist_ok=True)
FULL = sim.song_features(SONG, 0, 90)
def window(s):
    i0 = int(s * sim.FPS_SIM); i1 = i0 + int(WIN * sim.FPS_SIM)
    return {k: (v[i0:i1] if isinstance(v, np.ndarray) else v) for k, v in FULL.items()}

ck = os.path.join(OUT, 'checkpoint.npz')
if os.path.exists(ck):
    z = np.load(ck, allow_pickle=True)
    pop, ids, g0 = z['pop'], z['ids'], int(z['gen']) + 1
    log = json.load(open(os.path.join(OUT, 'log.json')))
    rng = np.random.default_rng([SEED, g0])
    next_id = int(ids.max()) + 1
else:
    rng = np.random.default_rng(SEED)
    pop = rng.normal(0, 0.5, (P, sim.N_GENE)); ids = np.arange(P); g0 = 0; next_id = P
    log = dict(gens=[], parent={})   # parent: id -> first parent's id
t0 = time.time()
for g in range(g0, GENS):
    rng = np.random.default_rng([SEED, g])
    s = STARTS[g % len(STARTS)]
    F = window(s)
    r = sim.simulate(pop, F)
    fit, parts = sim.fitness(r, F, parts=True)
    o = np.argsort(-fit)
    b = o[0]
    log['gens'].append(dict(g=g, start=s, best=float(fit[b]), mean=float(fit.mean()), best_id=int(ids[b]),
                            parts={k: float(v[b]) for k, v in parts.items()},
                            mean_parts={k: float(v.mean()) for k, v in parts.items()}))
    np.save(os.path.join(OUT, f'champ_{g:03d}.npy'), pop[b])
    if g in SAVE_POP:
        np.savez(os.path.join(OUT, f'pop_{g:03d}.npz'), pop=pop, ids=ids, fit=fit)
    # next generation
    new = [pop[o[:ELITE]]]; nid = list(ids[o[:ELITE]])
    rank = np.empty(P); rank[o] = np.arange(P)
    kids = []; kid_ids = []
    while len(kids) < P - ELITE:
        ta = rng.choice(P, 4, replace=False); a = ta[np.argmin(rank[ta])]
        tb = rng.choice(P, 4, replace=False); bb = tb[np.argmin(rank[tb])]
        c = pop[a].copy()
        if rng.random() < 0.5:
            m = rng.random(sim.N_GENE) < 0.5; c[m] = pop[bb][m]
        mut = rng.random(sim.N_GENE) < 0.1
        c[mut] += rng.normal(0, 0.15, mut.sum())
        if rng.random() < 0.05:
            c += rng.normal(0, 0.05, sim.N_GENE)
        kids.append(c); log['parent'][str(next_id)] = int(ids[a]); kid_ids.append(next_id); next_id += 1
    pop = np.r_[new[0], np.array(kids)]; ids = np.array(nid + kid_ids)
    if g % 10 == 0 or g == GENS - 1:
        np.savez(ck, pop=pop, ids=ids, gen=g)
        json.dump(log, open(os.path.join(OUT, 'log.json'), 'w'))
        L = log['gens'][-1]
        print(f"gen {g} win {s} best {L['best']:.3f} mean {L['mean']:.3f} up {L['parts']['up']:.2f} bob {L['parts']['bob']:.2f} "
              f"loud {L['parts']['loud']:.2f} hits {L['parts']['hits']:.2f}  {time.time() - t0:.0f}s", flush=True)
open(os.path.join(OUT, '.done'), 'w').close()
print('done')
