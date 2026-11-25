# #468 — no encounters at all (`INTERACTION_CAP` 1 -> 0): the registered set (written before pair 1)

**Why:** #466 took the cap from 10 to 1 and a field found 1.75x (8 of 8). At 0 the pair loop still finds neighbours (interference
between touching creatures is outside the cap) but runs no pair VM, no entrainment and no neighbour models, so predation (op 155,
which needs a partner) stops. The two measured results point opposite ways: the dose-response 10 -> 1, and #410's field without
predation at 0.61 of its twin (in the cap-10 world). The answer also says whether #466's gain ran through predation.

- **Arms:** the engine (cap 1) against a copy with `const INTERACTION_CAP=0;`. 8 pairs, 20 minutes (`SECS=1200`), each alone, one per
  launch (`lab/port/cap0-set.sh`). A pair cut short is void and rerun. Futility stop: pairs 1 and 2 both below 0.75. And, said now: the
  set stops as soon as SHIP is unreachable (two behind) or certain (seven ahead is not enough to stop; all 8 run when it can ship).
- **SHIP** if the median F ratio at 20 minutes is above 1.00 AND at least 7 of 8 are ahead AND the median size-17+ ratio is at least
  0.90: the cap becomes 0. **Otherwise** the cap stays 1. Analysis: `lab/port/analyse-cap0.js`.
