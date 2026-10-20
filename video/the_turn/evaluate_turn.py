"""Measure the gardeners of 'The Turn' and record the filmed days, with Trusted's evaluator (video/trusted/
evaluate_trust.py) in each arm's own garden.

  python3 video/the_turn/evaluate_turn.py RUN_DIR [RUN_DIR ...]          -> RUN_DIR/eval.json
  python3 video/the_turn/evaluate_turn.py --film RUN_DIR OUT.json [SEED]   (day seed 8001)
"""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, '..', 'trusted'))
import evaluate_trust as ET  # noqa: E402
from arms import ARMS  # noqa: E402


def arm_of(run_dir):
    return ARMS[json.load(open(os.path.join(run_dir, 'run.json')))['arm']]


if __name__ == '__main__':
    if sys.argv[1] == '--film':
        a, kw = arm_of(sys.argv[2])
        ET.film(sys.argv[2], sys.argv[3], int(sys.argv[4]) if len(sys.argv) > 4 else 8001, arm=a, env_kw=kw)
    else:
        for d in sys.argv[1:]:
            a, kw = arm_of(d)
            print(json.dumps(ET.evaluate(d, arm=a, env_kw=kw)))
