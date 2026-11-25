# #474 — four payments an epoch (`TASK_PAYS` 2 -> 4): the registered set (written before pair 1)

**Why:** two payments raised count and depth (#472: 1.93x, size 17+ 1.55x); no limit doubled the count again but cut size 17+ to
0.55-0.69 (#473, three pairs). Four sits between. Node against two: 1.02 / 2.73 / 0.95 (no direction at that resolution).
Prediction, written now: count ahead, size 17+ near 1.0; it ships only if depth holds.

- **Arms:** the engine against `__tk('__TASK_PAYS',4)`. 8 pairs, 20 minutes, each alone, one per launch (`pays4-set.sh`); a pair cut
  short is void and rerun. Stops when SHIP is unreachable (two behind on count, or the size-17+ guard impossible).
- **SHIP** if the median F ratio at 20 minutes is above 1.00 AND at least 7 of 8 ahead AND the median size-17+ ratio at least 0.90.
  **Otherwise** 2 stays. Analysis: `analyse-pays4.js`.
