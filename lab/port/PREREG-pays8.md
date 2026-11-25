# #475 — eight payments an epoch (`TASK_PAYS` 4 -> 8): the registered set (written before pair 1)

**Why:** each step of the dose has paid less (1 -> 2: 1.93x, 2 -> 4: 1.46x) and no limit cut size 17+ to 0.55-0.69 (#473). Eight is
where depth may turn over. **Prediction, written now:** count ahead by about 1.2x, size 17+ near 0.9; it may fail the guard.

- **Arms:** the engine against `__tk('__TASK_PAYS',8)`. 8 pairs, 20 minutes, each alone, one per launch (`pays8-set.sh`); a pair cut
  short is void and rerun. Stops when SHIP is unreachable (two behind on count, or the size-17+ guard cannot pass).
- **SHIP** if the median F ratio at 20 minutes is above 1.00 AND at least 7 of 8 ahead AND the median size-17+ ratio at least 0.90.
  **Otherwise** 4 stays. Analysis: `analyse-pays8.js`.
