# #467 — the amplitude economy's neighbour scan off (`ENTROPY_PAIRS` 1 -> 0): the registered set (written before pair 1)

**Why (measured):** after #466, `applyEntropy` is 16.6% of a field universe's tick (`field-phase.js`, 120 s; processGrid 22.6%, the
solo VM 21%). Its first block scans every creature's neighbours, compares trait vectors and moves only `amp` (similarity crowding and
a trait-distance predation of amplitude). Under `STORE_DEATH` (shipped with TASKS) amplitude no longer kills and sits near its floor
(line 1596's note); what still reads it is the program (register 3 is `amp`) and the display (`visAmp` reads the store). Knob on is
byte-identical (`5875f42a`); off changes the world (seed 11, 2,000 ticks: 6,549 functions against 4,291, one seen seed, design only).

- **Arms:** the engine against a copy with `__tk('__ENTROPY_PAIRS',0)` (`field-pair.sh`). 8 pairs, 20 minutes each (`SECS=1200`, the
  horizon #466's amendment set because container restarts come every 23-34 minutes), each alone, one per launch (`lab/port/entropy-set.sh`).
  A pair cut short is void and rerun. No stopping early; one futility stop: pairs 1 and 2 both below 0.75.
- **SHIP** if the median F ratio at 20 minutes is above 1.00 AND at least 7 of 8 are ahead AND the median size-17+ ratio is at least
  0.90: the default becomes 0 wherever STORE_DEATH runs (the world without TASKS keeps the scan, since there amplitude kills).
- **Otherwise REMOVED** (the knob goes; the scan stays). Analysis: `lab/port/analyse-entropy.js`, written now.

## Result
REMOVED after 4 pairs (1.31, 0.91, 1.10, 0.90): two behind, SHIP unreachable; stopped there as a recorded deviation from "no stopping
early". Engine restored from `94e0c56~1` (digest `5875f42a`).
