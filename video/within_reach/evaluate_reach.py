"""Measure the gardeners of 'Within Reach' and record the filmed days, with Hold Still's evaluator
(video/hold_still/evaluate_still.py) in each arm's own garden.

  python3 video/within_reach/evaluate_reach.py RUN_DIR [RUN_DIR ...]          -> RUN_DIR/eval.json
  python3 video/within_reach/evaluate_reach.py --film RUN_DIR OUT.json [SEED]   (day seed 5001)

flee_rel = 1 - caught rate seen / caught rate with the person hidden: the share of the catches a robot that cannot
react would suffer that it avoids by reacting. (A person who gives up at random reaches an unreacting robot only about
half the time, so Hold Still's absolute flee index cannot reach 0.40 here.)
"""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, '..', 'hold_still'))
import evaluate_still as ES  # noqa: E402
from arms import ARMS  # noqa: E402


def arm_of(run_dir):
    return ARMS[json.load(open(os.path.join(run_dir, 'run.json')))['arm']]


if __name__ == '__main__':
    if sys.argv[1] == '--film':
        a, kw = arm_of(sys.argv[2])
        ES.film(sys.argv[2], sys.argv[3], int(sys.argv[4]) if len(sys.argv) > 4 else 5001, arm=a, env_kw=kw)
    else:
        for d in sys.argv[1:]:
            a, kw = arm_of(d)
            print(json.dumps(ES.evaluate(d, arm=a, env_kw=kw)))
