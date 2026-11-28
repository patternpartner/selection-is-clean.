# #482 — a finer ground (`GROUND_RES` 1 -> 2) judged on DEPTH: a new registered set (written before pair 1)

**Why:** #481's count-primary set did not ship (count median 1.07, two behind), but size 17+ was up in 5 of 6 (median 1.34). #402's
second ruler is the size of what is new; this set asks it directly. #481's pairs designed this rule and do not count here.

- **Arms:** as #481 (`__tk('__GROUND_RES',2)`), 8 FRESH pairs, 20 minutes, each alone, one per launch (`gres2-set.sh`). A pair cut
  short is void and rerun. Stops when SHIP is unreachable.
- **Primary:** new functions of formula size 17 or more at 20 minutes (the `D.ge17` count), ratio finer / shipped, per pair.
- **SHIP** if the median size-17+ ratio is above 1.00 AND at least 7 of 8 pairs are ahead on it AND the median COUNT ratio is at least
  0.95 (a guard: not worse on count). Then `GROUND_RES` defaults to 2 (a reload of a world saved at 1 starts its ground empty).
  **Otherwise** the knob is removed.
- Analysis: `analyse-gres2.js`.

## Result
REMOVED after 5 pairs (size 17+ 0.74, 1.07, 1.29, 1.36, 0.89: two behind). Engine restored from `5e30e355~1` (`1b574e9a`).
