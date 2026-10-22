"""Exploratory (registered without a prediction): the light readings at every saved checkpoint of the ten decision
robots (inspect_mind.py --light -> RUN_DIR/inside_<ckpt>.json), as one table.
  python3 video/inside/trajectory.py out/inside/runs   -> prints; out/inside/trajectory.json
"""
import json, os, sys
root = sys.argv[1]
CK = ['0.03', '0.07', '0.15', '0.30', '0.50', '0.75', '1.00']
rows = {}
for arm in ('camera', 'garden'):
    for s in range(41, 46):
        r = f'{arm}-{s}'
        rows[r] = {}
        for c in CK:
            p = os.path.join(root, r, f'inside_{c}.json')
            if not os.path.exists(p):
                continue
            x = json.load(open(p)); ro, b = x['readout'], x['behaviour']
            rows[r][c] = dict(adds=ro['memory_adds']['count_r2'], now=ro['now']['count_r2'], memory=ro['memory']['count_r2'],
                              both=ro['both']['count_r2'], photos_probation=b['photos_probation'], caught=b['caught_per_day'],
                              value_probation=b['value_probation'], value_trusted=b['value_trusted'])
json.dump(rows, open(os.path.join(root, '..', 'trajectory.json'), 'w'), indent=1)
g = lambda v, f='%+6.2f': '     -' if v is None else f % v
for key, lab in (('adds', 'memory adds (registered readout)'), ('now', 'R2 from what it sees now'), ('memory', 'R2 from memory alone'),
                 ('photos_probation', 'photographs up on probation')):
    print(lab)
    print('            ' + ' '.join('%6s' % c for c in CK))
    for r, d in rows.items():
        print('  %-10s' % r + ' '.join(g(d[c][key] if c in d else None) for c in CK))
    print()
