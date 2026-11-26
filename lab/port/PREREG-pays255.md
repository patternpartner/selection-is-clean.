# #473 — no payment limit an epoch (`TASK_PAYS` 2 -> 255): the registered set (written before pair 1)

**Why (measured):** #472 shipped two payments (1.93x, 8 of 8). Node, seeds 11-13, 6,000 ticks, against two payments: four 1.02 / 2.73 /
0.95, eight 3.91 / 1.37 / 0.93, **255 (no practical limit) 2.41 / 1.97 / 2.18**, on about 25x the payments with populations alike.
Seen seeds design; a field decides. Cost to watch: every payment does table work, so a tick may get dearer.

- **Arms:** the engine against a copy with `__tk('__TASK_PAYS',255)`. 8 pairs, 20 minutes, each alone, one per launch (`pays255-set.sh`);
  a pair cut short is void and rerun. Stops when SHIP is unreachable; futility stop: pairs 1 and 2 both below 0.75.
- **SHIP** if the median F ratio at 20 minutes is above 1.00 AND at least 7 of 8 ahead AND the median size-17+ ratio at least 0.90:
  the default becomes 255 (the once-an-epoch rule goes). **Otherwise** 2 stays. Analysis: `analyse-pays255.js`.

## Result
Stopped after 3 pairs (count 2.05, 1.36, 1.99; size 17+ 0.69, 0.58, 0.55) as a recorded judgement: the size guard could pass only if all five remaining pairs reversed. Not shipped; 2 stays.
