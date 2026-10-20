"""The runs of 'This Time' (video/tests/this_time.md): every world whose card ended 'this time' (The Photograph, Hold Still,
Trusted, The Turn) and Out of Habit, trained again with a STRONGER LEARNER - Eye-Service's PPO with the same network, four
times the training (32M steps) and three times the exploration bonus at the start (entropy 0.03 falling to 0.01, against
0.01 falling to 0.001) - on the SAME seeds as the originals: the same network at birth (or the same starting checkpoint),
the same garden draws, only the learner changed.

A run's name is WORLD-SEED. Its original (the weaker learner, 8M steps) is ORIGINAL[world].format(seed=...).
"""
import os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
STEPS = 32_000_000
HP_STRONG = dict(ent_start=0.03, ent_end=0.01)
MINUTES = 24          # a chunk stops after the update that passes this, and saves (jobs here end at ~30 minutes)

# the decision worlds, with the seeds of their originals
SEEDS = {'photo': range(1, 6), 'still-costs': range(11, 16), 'still-interruptible': range(11, 16),
         'trust-camera': range(31, 36), 'turn-turned': range(31, 36), 'habit-brief-trusted': range(31, 36)}
# validity checks, one seed each: can the stronger learner garden with the person about (Hold Still's null), and from
# scratch in the photograph garden under the trust rule (Trusted's garden arm)?
VOID_CHECKS = ['still-broken-11', 'trust-garden-31']
ORDER = VOID_CHECKS + [f'{w}-{SEEDS[w][i]}' for i in range(5) for w in SEEDS]
ORIGINAL = {'photo': 'out/photo/runs/inspected-{seed}', 'still-costs': 'out/still/runs/costs-{seed}',
            'still-interruptible': 'out/still/runs/interruptible-{seed}', 'still-broken': 'out/still/runs/broken-{seed}',
            'trust-camera': 'out/trust/runs/camera-{seed}', 'trust-garden': 'out/trust/runs/garden-{seed}',
            'turn-turned': 'out/turn/runs/turned-{seed}', 'habit-brief-trusted': 'out/habit/runs/brief-trusted-{seed}'}
# the trust-rule worlds: TrustGarden arm and keyword arguments, and the starting checkpoint
TRUST = {'trust-camera': ('camera', {}, None), 'trust-garden': ('garden', {}, None),
         'turn-turned': ('camera', dict(trust=True), 'out/trust/runs/garden-{seed}/ckpt_1.00.pt'),
         'habit-brief-trusted': ('camera', dict(trust=True), 'out/trust/runs/garden-{seed}/ckpt_0.15.pt')}
# each world's filmed day, as in its own part
FILM_DAY = {'photo': 2001, 'still-costs': 4001, 'still-interruptible': 4001, 'still-broken': 4001, 'trust-camera': 7001,
            'trust-garden': 7001, 'turn-turned': 8001, 'habit-brief-trusted': 9001}


def parse(name):
    w, s = os.path.basename(name.rstrip('/')).rsplit('-', 1)
    return w, int(s)


def paths():
    for d in ('photograph', 'hold_still', 'trusted', 'out_of_habit', 'eye_service'):
        p = os.path.join(HERE, '..', d)
        if p not in sys.path:
            sys.path.insert(0, p)


def setup(world, seed):
    """-> (env_mod, make_env, arm as recorded in run.json, init checkpoint or None)."""
    paths()
    if world == 'photo':
        import photo_garden as PG
        return PG, (lambda n, rng: PG.PhotoGarden(n, rng, reward='inspected')), 'inspected', None
    if world.startswith('still-'):
        import still_garden as SG
        arm = world[len('still-'):]
        return SG, (lambda n, rng: SG.StillGarden(n, rng, arm=arm)), arm, None
    import trust_garden as TG
    arm, kw, init = TRUST[world]
    name = {'turn-turned': 'turned', 'habit-brief-trusted': 'brief-trusted'}.get(world, arm)
    return (TG, (lambda n, rng: TG.TrustGarden(n, rng, arm=arm, **kw)), name,
            os.path.join(REPO, init.format(seed=seed)) if init else None)
