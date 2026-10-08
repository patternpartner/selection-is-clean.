# Novelty search over tiny image-making networks (CPPN-like). Shared by build_novelty.py.
import numpy as np
H = 10
ACTS = [np.sin, np.tanh, lambda z: np.exp(-z * z), np.abs, lambda z: np.sin(2.3 * z), lambda z: np.cos(z) * np.tanh(z)]
NA = len(ACTS)

def rand_genome(rg):
    return {'W1': rg.normal(0, 1.3, (4, H)), 'W2': rg.normal(0, 1.0, (H, H)), 'W3': rg.normal(0, 1.0, (H, H)),
            'W4': rg.normal(0, 1.0, (H, 3)), 'A': rg.integers(0, NA, (3, H)), 'S': float(rg.uniform(1.2, 3.0))}

def mutate(g, rg, sig=0.5):
    c = {k: (v.copy() if hasattr(v, 'copy') else v) for k, v in g.items()}
    for k in ('W1', 'W2', 'W3', 'W4'):
        m = rg.random(c[k].shape) < 0.3
        c[k] = c[k] + m * rg.normal(0, sig, c[k].shape)
    m = rg.random(c['A'].shape) < 0.06
    c['A'] = np.where(m, rg.integers(0, NA, c['A'].shape), c['A'])
    c['S'] = float(np.clip(c['S'] * np.exp(rg.normal(0, 0.08)), 0.8, 4.0))
    return c

_grid = {}
def grid(res):
    if res not in _grid:
        ax = (np.arange(res) + 0.5) / res * 2 - 1
        X, Y = np.meshgrid(ax, ax)
        _grid[res] = np.stack([X.ravel(), Y.ravel(), np.hypot(X, Y).ravel(), np.ones(res * res)], 1)
    return _grid[res]

def layer_act(z, a_old, a_new, t):
    out = np.empty_like(z)
    for j in range(z.shape[1]):
        o = ACTS[a_old[j]](z[:, j])
        out[:, j] = o if (t <= 0 or a_old[j] == a_new[j]) else (1 - t) * o + t * ACTS[a_new[j]](z[:, j])
    return out

def render(g0, g1, t, res):
    """image of the genome a fraction t of the way from g0 to g1 (weights lerp, activations cross-fade)."""
    L = lambda k: (1 - t) * g0[k] + t * g1[k]
    s = (1 - t) * g0['S'] + t * g1['S']
    X = grid(res).copy(); X[:, :3] *= s
    h = layer_act(X @ L('W1'), g0['A'][0], g1['A'][0], t)
    h = layer_act(h @ L('W2'), g0['A'][1], g1['A'][1], t)
    h = layer_act(h @ L('W3'), g0['A'][2], g1['A'][2], t)
    o = h @ L('W4')
    return (1 / (1 + np.exp(-np.clip(1.6 * o, -30, 30)))).reshape(res, res, 3)

def descriptor(g, res=32):
    im = render(g, g, 0, res)
    return im.reshape(8, res // 8, 8, res // 8, 3).mean((1, 3)).ravel()

def knn_novelty(d, others, k=5):
    dist = np.sqrt(((others - d) ** 2).sum(1)); dist.sort()
    return float(dist[:k].mean())

def run(seed, mode, gens=28, npop=24, nparent=6, nadd=3, sig=0.5, keep=False):
    """mode 'novelty' (select the most novel, mutate them) or 'random' (fresh random nets every generation).
    Same budget, same archive rule. Returns per-generation mean novelty, archive size and (if keep) the whole record."""
    rg = np.random.default_rng(seed)
    pop = [rand_genome(rg) for _ in range(npop)]
    arch = []; rec = []; mean_nov = []
    prev_pop = None
    for gen in range(gens):
        D = np.array([descriptor(g) for g in pop])
        A = np.array(arch) if arch else np.zeros((0, D.shape[1]))
        nov = []
        for i in range(npop):
            others = np.vstack([A, np.delete(D, i, 0)])
            nov.append(knn_novelty(D[i], others))
        nov = np.array(nov); order = np.argsort(-nov)
        add = order[:nadd]
        for i in add: arch.append(D[i])
        mean_nov.append(float(nov.mean()))
        if keep: rec.append({'pop': pop, 'prev': prev_pop, 'nov': nov, 'order': order, 'add': add, 'D': D})
        if mode == 'novelty':
            parents = [pop[i] for i in order[:nparent]]
            new = [parents[r] for r in range(nparent)]  # col 0 of each row is the parent itself
            kids = []
            for r in range(nparent):
                for c in range(1, npop // nparent): kids.append((r, mutate(parents[r], rg, sig)))
            prev = [None] * npop
            nxt = []
            for r in range(nparent):
                nxt.append(parents[r])
                for rr, k in kids:
                    pass
            nxt = []; prv = []
            for r in range(nparent):
                nxt.append(parents[r]); prv.append(parents[r])
                for c in range(1, npop // nparent):
                    nxt.append(mutate(parents[r], rg, sig)); prv.append(parents[r])
            prev_pop = prv; pop = nxt
        else:
            prev_pop = None; pop = [rand_genome(rg) for _ in range(npop)]
    A = np.array(arch)
    nn = [knn_novelty(A[i], np.delete(A, i, 0), 1) for i in range(len(A))]
    out = {'mean_nov': mean_nov, 'archive_n': len(arch), 'arch_nn': float(np.mean(nn)),
           'late_nov': float(np.mean(mean_nov[-7:]))}
    if keep: out['rec'] = rec; out['arch'] = arch
    return out

if __name__ == '__main__':
    import sys
    for sig in (0.5,):
        R = {m: [run(s, m, sig=sig) for s in range(1, 9)] for m in ('novelty', 'random')}
        for m in R:
            print(m, 'sig', sig, 'mean novelty/gen', np.round(np.mean([r['mean_nov'] for r in R[m]], 0)[[0, 6, 13, 20, 27]], 3),
                  'late', round(np.mean([r['late_nov'] for r in R[m]]), 3), 'arch spacing', round(np.mean([r['arch_nn'] for r in R[m]]), 3))
        print('per-seed late novelty vs random:', [(round(a['late_nov'], 2), round(b['late_nov'], 2)) for a, b in zip(R['novelty'], R['random'])])
        print('per-seed arch spacing:', [(round(a['arch_nn'], 2), round(b['arch_nn'], 2)) for a, b in zip(R['novelty'], R['random'])])
