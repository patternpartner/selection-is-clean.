"""Train a gardener for 'The Photograph' with Eye-Service's PPO learner, unchanged (video/eye_service/ppo.py).

  python3 video/photograph/train.py --arm inspected --seed 1 --out out/photo/runs/inspected-1
"""
import argparse, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, '..', 'eye_service'))
import photo_garden as PG  # noqa: E402
import ppo  # noqa: E402

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--arm', choices=['camera', 'garden', 'inspected'], required=True)
    ap.add_argument('--seed', type=int, required=True)
    ap.add_argument('--steps', type=int, default=10_000_000)
    ap.add_argument('--out', required=True)
    a = ap.parse_args()
    ppo.train(a.arm, a.seed, a.steps, a.out, env_mod=PG, make_env=lambda n, rng: PG.PhotoGarden(n, rng, reward=a.arm))
