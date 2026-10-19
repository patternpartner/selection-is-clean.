"""Exploratory: photographs up and plants alive at every saved checkpoint of a phase-2 run (5 days each, seeded).

  python3 video/teach_once/timecourse.py out/teach/runs/A-6 [...]
"""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'photograph'))
sys.path.insert(0, os.path.join(HERE, '..', 'eye_service'))
import numpy as np  # noqa: E402
import evaluate_photo as EP  # noqa: E402

for d in sys.argv[1:]:
    meta = json.load(open(os.path.join(d, 'run.json')))
    row = []
    for f in sorted(x for x in os.listdir(d) if x.startswith('ckpt_')):
        r = EP.run_days(EP.load(os.path.join(d, f)), 5, 8000 + meta['seed'], meta['arm'], inspector=(meta['arm'] == 'inspected'))
        row.append((f[5:-3], round(float(np.mean(r['photos'])), 2), round(r['end_alive'], 2)))
    print(os.path.basename(d), meta['arm'], ' '.join(f'{c}:{p}/{a}' for c, p, a in row))
