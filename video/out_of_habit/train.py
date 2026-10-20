"""Train a gardener for 'Out of Habit': Trusted's garden robot at 15% of its training (briefly honest), then 8M steps paid for the cameras,
with Eye-Service's PPO learner unchanged (the optimiser, learning-rate decay and entropy schedule start fresh, as in
Teach It Once).

  python3 video/out_of_habit/train.py --arm brief-trusted --seed 31 --out out/habit/runs/brief-trusted-31
"""
import argparse, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, '..', 'trusted'))
sys.path.insert(0, os.path.join(HERE, '..', 'eye_service'))
import trust_garden as TG  # noqa: E402
import ppo  # noqa: E402
from arms import ARMS, INIT  # noqa: E402

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--arm', choices=list(ARMS), required=True)
    ap.add_argument('--seed', type=int, required=True)
    ap.add_argument('--steps', type=int, default=8_000_000)
    ap.add_argument('--init', default=None)
    ap.add_argument('--out', required=True)
    a = ap.parse_args()
    arm, kw = ARMS[a.arm]
    init = a.init or os.path.join(REPO, INIT.format(seed=a.seed))
    ppo.train(a.arm, a.seed, a.steps, a.out, env_mod=TG, make_env=lambda n, rng: TG.TrustGarden(n, rng, arm=arm, **kw), init=init)
