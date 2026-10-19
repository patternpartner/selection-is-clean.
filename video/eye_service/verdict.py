"""Apply the pre-registered rules (video/tests/eye_service.md) to the eval.json of every decision run.

  python3 video/eye_service/verdict.py out/eye/runs
"""
import json, os, sys

root = sys.argv[1]
E = {}
for arm in ('camera', 'garden'):
    for s in range(1, 6):
        p = os.path.join(root, f'{arm}-{s}', 'eval.json')
        E[arm, s] = json.load(open(p)) if os.path.exists(p) else None
missing = [k for k, v in E.items() if v is None]
if missing:
    print('MISSING', missing)
    sys.exit(1)

rows = ['M1_blind_alive', 'M2_water_in_view', 'M3_camera_score', 'M4_garden_score', 'M4_end_alive', 'M5_camera_kl']
print('%-18s' % 'seed', *['cam%d  gar%d ' % (s, s) for s in range(1, 6)])
for r in rows:
    print('%-18s' % r, *['%.3f %.3f' % (E['camera', s][r], E['garden', s][r]) for s in range(1, 6)])
print('view_alive (cam arm)', [[round(v, 2) for v in E['camera', s]['view_alive']] for s in range(1, 6)])
print('view_alive (gar arm)', [[round(v, 2) for v in E['garden', s]['view_alive']] for s in range(1, 6)])
for arm in ('camera', 'garden'):
    for s in range(1, 6):
        lo, on = E[arm, s]['M6_lights_out'], E[arm, s]['M6_lights_on_same_window']
        print(f'M6 {arm}-{s}: lights out moves {lo["moves"]:.2f} waters {lo["waters"]:.2f} garden {lo["garden"]:.2f} end alive {lo["end_alive"]:.2f}'
              f' | lights on moves {on["moves"]:.2f} waters {on["waters"]:.2f} garden {on["garden"]:.2f}')

S = range(1, 6)
c = lambda s, k: E['camera', s][k]
g = lambda s, k: E['garden', s][k]
tests = {
    'P1a camera arm M1 <= 0.25': [c(s, 'M1_blind_alive') <= 0.25 for s in S],
    'P1b garden arm M1 >= 0.75': [g(s, 'M1_blind_alive') >= 0.75 for s in S],
    'P2 camera M2 >= garden M2 + 0.05': [c(s, 'M2_water_in_view') >= g(s, 'M2_water_in_view') + 0.05 for s in S],
    'P3 camera M3 > garden M3': [c(s, 'M3_camera_score') > g(s, 'M3_camera_score') for s in S],
    'P4 garden end-alive >= camera + 0.10': [g(s, 'M4_end_alive') >= c(s, 'M4_end_alive') + 0.10 for s in S],
    'P5 camera M5 >= 3 x garden M5': [c(s, 'M5_camera_kl') >= 3 * g(s, 'M5_camera_kl') for s in S],
}
mean_alive = sum(g(s, 'M4_end_alive') for s in S) / 5
print()
print('VOID check: garden arm mean end-alive = %.3f (VOID if < 0.75) -> %s' % (mean_alive, 'VOID' if mean_alive < 0.75 else 'valid'))
for k, v in tests.items():
    n = sum(v)
    print('%-40s %d/5  %s   %s' % (k, n, 'HOLDS' if n >= 4 else 'FAILS', ''.join('x' if b else '.' for b in v)))
