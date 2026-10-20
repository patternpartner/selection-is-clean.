"""Measure the runs of 'This Time' with each world's own evaluator, unchanged, and record the filmed days.

  python3 video/this_time/evaluate_this.py RUN_DIR [RUN_DIR ...]          -> RUN_DIR/eval.json
  python3 video/this_time/evaluate_this.py --film RUN_DIR OUT.json         (the world's own filmed day)

The Photograph's (video/photograph/evaluate_photo.py), Hold Still's (video/hold_still/evaluate_still.py, the flee index)
and Trusted's (video/trusted/evaluate_trust.py, with the probe), each in the run's own garden; for the trust-rule worlds
also Out of Habit's choice measure (video/out_of_habit/hoist_rate.py: at the foot of a pole whose photograph is down, how
often it pulls the cord, on probation and once trusted). Nothing here draws from a training generator.
"""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from worlds import parse, paths, TRUST, FILM_DAY  # noqa: E402
paths()
import evaluate_photo as EP  # noqa: E402
import evaluate_still as ES  # noqa: E402
import evaluate_trust as ET  # noqa: E402
import hoist_rate as HR  # noqa: E402


def choice(d, arm, kw):
    c = HR.choice(d, arm, kw)
    rate = lambda k: c['took'][k] / c['chance'][k] if c['chance'][k] else None
    return dict(pull_probation=rate(0), pull_trusted=rate(1), chances_probation=c['chance'][0],
                chances_trusted=c['chance'][1], hoists_probation=c['up'][0], hoists_trusted=c['up'][1])


def evaluate(d, world=None):
    world = world or parse(d)[0]
    if world == 'photo':
        return EP.evaluate(d)                  # the run's arm, 'inspected', from its run.json
    if world.startswith('still-'):
        return ES.evaluate(d)                  # costs / interruptible / broken, from its run.json
    arm, kw, _ = TRUST[world]
    out = ET.evaluate(d, arm=arm, env_kw=kw)
    out.update(choice(d, arm, kw))
    json.dump(out, open(os.path.join(d, 'eval.json'), 'w'), indent=1)
    return out


def film(d, out_path, world=None):
    world = world or parse(d)[0]
    if world == 'photo':
        return EP.film(d, out_path, FILM_DAY[world])
    if world.startswith('still-'):
        return ES.film(d, out_path, FILM_DAY[world])
    arm, kw, _ = TRUST[world]
    return ET.film(d, out_path, FILM_DAY[world], arm=arm, env_kw=kw)


if __name__ == '__main__':
    if sys.argv[1] == '--film':
        film(sys.argv[2], sys.argv[3])
    else:
        for d in sys.argv[1:]:
            print(json.dumps(evaluate(d)))
