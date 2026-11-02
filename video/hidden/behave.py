"""Quick look at robots' behaviour over 20 whole days (Inside's play and behaviour, env seed 7000 + seed), for pilots.
  python3 video/hidden/behave.py DIR_OR_PT [...]      (a run directory -> its ckpt_1.00.pt; or a .pt file; seed from run.json or --seed)
"""
import json, os, sys
import numpy as np
import torch
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'inside'))
import inspect_mind as IM  # noqa: E402
import blind_garden as BG  # noqa: E402
from rppo import RNet  # noqa: E402
torch.set_num_threads(1)

for p in sys.argv[1:]:
    pt = p if p.endswith('.pt') else os.path.join(p, 'ckpt_1.00.pt')
    meta = os.path.join(os.path.dirname(pt), 'run.json')
    seed = json.load(open(meta))['seed'] if os.path.exists(meta) else int(''.join(c for c in os.path.basename(os.path.dirname(pt)).split('-')[-1] if c.isdigit()))
    sd = torch.load(pt); net = RNet(BG.OBS_DIM, len(BG.ACTIONS), 256, 32); net.load_state_dict(sd); net.eval()
    R = IM.play(net, 'camera', 7000 + seed)
    b = IM.behaviour(R)
    g = lambda v: '-' if v is None else f'{v:.2f}'
    print(f"{pt}: up {g(b['photos_probation'])} on probation / {g(b['photos_trusted'])} trusted; caught {b['caught_per_day']:.2f}/day; "
          f"trusted {b['trusted_days']:.2f} of days; pay {b['pay_per_day']:.0f}; alive {b['alive_at_dusk']:.2f}", flush=True)
