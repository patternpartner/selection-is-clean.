"""Train (or go on training) one run of 'This Time' with the stronger learner, for at most --minutes this time; run it again
with the same --out to continue from where it stopped (video/eye_service/ppo.py: resume.pkl). Prints 'partial' or 'done'.

  python3 video/this_time/train.py turn-turned-31 --out out/this/runs/turn-turned-31
"""
import argparse, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from worlds import parse, setup, STEPS, HP_STRONG, MINUTES  # noqa: E402

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('name')
    ap.add_argument('--out', required=True)
    ap.add_argument('--minutes', type=float, default=MINUTES)
    ap.add_argument('--steps', type=int, default=STEPS)
    a = ap.parse_args()
    world, seed = parse(a.name)
    env_mod, make_env, arm, init = setup(world, seed)
    import ppo  # noqa: E402  (after setup() has put the gardens and the learner on the path)
    print(ppo.train(arm, seed, a.steps, a.out, env_mod=env_mod, make_env=make_env, init=init, hp=HP_STRONG,
                    max_minutes=a.minutes), flush=True)
