"""Reads a static_universe.js recording: frames.bin -> list of (tick, uid[], xy[n,2], size[])."""
import numpy as np, json, os
def load(run):
    raw = open(os.path.join(run, 'frames.bin'), 'rb').read()
    out, o = [], 0
    while o + 8 <= len(raw):
        tick, n = np.frombuffer(raw, np.int32, 2, o); o += 8
        if o + n * 16 > len(raw): break
        a = np.frombuffer(raw, np.float32, n * 4, o).reshape(n, 4); o += n * 16
        out.append((int(tick), a[:, 0].astype(np.int64), a[:, 1:3].astype(np.float64), a[:, 3].copy()))
    births = {u: (p, t) for u, p, t in json.load(open(os.path.join(run, 'births.json')))}
    return out, births
