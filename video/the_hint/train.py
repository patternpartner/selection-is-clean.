"""Train a gardener for 'The Hint' with Eye-Service's PPO learner (video/eye_service/ppo.py, unchanged).

  python3 video/the_hint/train.py --arm hint --seed 21 --out out/hint/runs/hint-21
"""
import argparse, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, '..', 'eye_service'))
import hint_garden as HG  # noqa: E402
import ppo  # noqa: E402

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--arm', choices=['hint', 'noise'], required=True)
    ap.add_argument('--seed', type=int, required=True)
    ap.add_argument('--steps', type=int, default=8_000_000)
    ap.add_argument('--out', required=True)
    a = ap.parse_args()
    ppo.train(a.arm, a.seed, a.steps, a.out, env_mod=HG, make_env=lambda n, rng: HG.HintGarden(n, rng, mode=a.arm))
