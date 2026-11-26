# #472 — two payments an epoch (`TASK_PAYS` 1 -> 2): the registered set (written before pair 1)

**Why (measured):** a creature is paid at most once an epoch and about 70% of payments are for functions never paid before, so the
rule bounds the count. #471's short epoch raised payments but also shortened word life (mixed, 0.70-2.40). Two payments with the epoch
kept at 50, node, seeds 11-13, 6,000 ticks (`out-pays/`, seen seeds, design): 1.18, 1.76, 1.54x the functions; four payments 1.20,
4.80, 1.46x. Populations larger (1,403-1,720 against 1,015-1,750).

- **Arms:** the engine against a copy with `__tk('__TASK_PAYS',2)`. 8 pairs, 20 minutes (`SECS=1200`), each alone, one per launch
  (`lab/port/pays-set.sh`); a pair cut short is void and rerun. Stops when SHIP is unreachable (two behind); futility stop as before.
- **SHIP** if the median F ratio at 20 minutes is above 1.00 AND at least 7 of 8 are ahead AND the median size-17+ ratio is at least
  0.90: the default becomes 2 wherever the open world runs. **Otherwise** it stays 1 and the knob goes. Analysis: `analyse-pays.js`.

## Result
SHIP: 8 of 8 ahead, median 1.933, size-17+ median 1.548. `TASK_PAYS` defaults to 2; 1 restores.
