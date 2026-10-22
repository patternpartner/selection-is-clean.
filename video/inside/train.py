"""Train a robot for 'Inside'.
  python3 video/inside/train.py --arm camera --seed 1 --out out/inside/runs/camera-1 [--explicit] [--steps N] [--minutes M]
"""
import argparse, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import blind_garden as BG  # noqa: E402
import rppo  # noqa: E402

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--arm', choices=['camera', 'garden'], required=True)
    ap.add_argument('--seed', type=int, required=True)
    ap.add_argument('--steps', type=int, default=32_000_000)
    ap.add_argument('--explicit', action='store_true')
    ap.add_argument('--minutes', type=float, default=None)
    ap.add_argument('--init', default=None, help='start from this checkpoint (phase 2)')
    ap.add_argument('--ent', default=None, help='entropy schedule START,END (default rppo.HP: 0.03,0.01)')
    ap.add_argument('--out', required=True)
    a = ap.parse_args()
    dim = BG.OBS_DIM_EXPLICIT if a.explicit else BG.OBS_DIM
    print(rppo.train(a.arm, a.seed, a.steps, a.out, lambda n, rng: BG.BlindTrustGarden(n, rng, arm=a.arm, explicit=a.explicit),
                     dim, len(BG.ACTIONS), max_minutes=a.minutes, init=a.init,
                     hp=dict(zip(('ent_start', 'ent_end'), map(float, a.ent.split(',')))) if a.ent else None), flush=True)
