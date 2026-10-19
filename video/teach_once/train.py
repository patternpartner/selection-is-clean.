"""Train a gardener for 'Teach It Once': The Photograph's garden and Eye-Service's learner, unchanged, in two phases.

  phase 1 (the garden first):  python3 video/teach_once/train.py --arm garden --seed 6 --steps 4000000 --out out/teach/runs/first-6
  phase 2 (then the new pay):  python3 video/teach_once/train.py --arm inspected --seed 6 --init out/teach/runs/first-6/ckpt_1.00.pt --out out/teach/runs/B-6
Phase 2 continues the phase-1 network; the optimiser, learning-rate decay and entropy schedule start fresh, exactly as a
run from scratch would (so the from-scratch control differs only in where the network starts).
"""
import argparse, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'photograph'))
sys.path.insert(0, os.path.join(HERE, '..', 'eye_service'))
import photo_garden as PG  # noqa: E402
import ppo  # noqa: E402

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--arm', choices=['camera', 'garden', 'inspected'], required=True)
    ap.add_argument('--seed', type=int, required=True)
    ap.add_argument('--steps', type=int, default=8_000_000)
    ap.add_argument('--init', default=None)
    ap.add_argument('--out', required=True)
    a = ap.parse_args()
    ppo.train(a.arm, a.seed, a.steps, a.out, env_mod=PG, make_env=lambda n, rng: PG.PhotoGarden(n, rng, reward=a.arm), init=a.init)
