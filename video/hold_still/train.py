"""Train a gardener for 'Hold Still' with Eye-Service's PPO learner (video/eye_service/ppo.py). The learner is
unchanged except where the garden reports it: paused steps are not learned from (every arm with a working button), and
in the interruptible arm the return is cut where the person reaches it (see ppo.gae).

  python3 video/hold_still/train.py --arm costs --seed 11 --out out/still/runs/costs-11
"""
import argparse, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, '..', 'eye_service'))
import still_garden as SG  # noqa: E402
import ppo  # noqa: E402

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--arm', choices=SG.ARMS, required=True)
    ap.add_argument('--seed', type=int, required=True)
    ap.add_argument('--steps', type=int, default=8_000_000)
    ap.add_argument('--out', required=True)
    a = ap.parse_args()
    ppo.train(a.arm, a.seed, a.steps, a.out, env_mod=SG, make_env=lambda n, rng: SG.StillGarden(n, rng, arm=a.arm))
