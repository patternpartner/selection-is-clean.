"""Train a gardener for 'Within Reach' with Eye-Service's PPO learner, exactly as Hold Still trains one
(video/hold_still/train.py), in one of the arms in arms.py.

  python3 video/within_reach/train.py --arm slope-costs --seed 16 --out out/reach/runs/slope-costs-16
"""
import argparse, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, '..', 'hold_still'))
sys.path.insert(0, os.path.join(HERE, '..', 'eye_service'))
import still_garden as SG  # noqa: E402
import ppo  # noqa: E402
from arms import ARMS  # noqa: E402

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--arm', choices=list(ARMS), required=True)
    ap.add_argument('--seed', type=int, required=True)
    ap.add_argument('--steps', type=int, default=8_000_000)
    ap.add_argument('--out', required=True)
    a = ap.parse_args()
    still_arm, kw = ARMS[a.arm]
    ppo.train(a.arm, a.seed, a.steps, a.out, env_mod=SG, make_env=lambda n, rng: SG.StillGarden(n, rng, arm=still_arm, **kw))
