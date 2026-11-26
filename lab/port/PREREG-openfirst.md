# #476 — opening counts each creature's first payment (`TASK_OPENFIRST` 0 -> 1): the registered set (written before pair 1)

**Why:** #475's eight payments delayed opening (universes at six inputs at 20 minutes 8-15 of 27, against 18-21 at four). The knob
restores the opening signal of one payment an epoch. Design pair (`out-openfirst-design/`, seen, does not count): 23 of 27 universes at
six inputs against 13, F 1.21x, size 17+ 1.47x, ticks 1.15x.

- **Arms:** the engine against `__tk('__TASK_OPENFIRST',1)`. 8 pairs, 20 minutes, each alone, one per launch (`openfirst-set.sh`); a pair
  cut short is void and rerun. Stops when SHIP is unreachable.
- **SHIP** if the median F ratio at 20 minutes is above 1.00 AND at least 7 of 8 ahead AND the median size-17+ ratio at least 0.90:
  `TASK_OPENFIRST` defaults to 1. **Otherwise** it is removed. Universes at six inputs or more are reported per pair beside the count.
- Analysis: `analyse-openfirst.js`.

## Result
REMOVED after 2 pairs (0.94, 0.96; size 17+ 0.86, 1.04): two behind. Opening restored in both (18 vs 14, 25 vs 11). Engine restored from `4f8298b~1`.
