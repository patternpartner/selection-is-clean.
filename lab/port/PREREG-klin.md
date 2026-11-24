# #465c — lineage passes through unpaid words (`TASK_KLIN`): the registered set (written before pair 1)

**Why (the measured result that predicts it):** #465 found 42-46% of new functions recorded as built on nothing, though #391 found 91-97%
built on read words: a read word carries its function's slot and an unpaid word has none, so the lineage stops there. The drain pays down
a payment's lineage, so it charged nothing for those payments; in node the drain took 24-26% of income where 50% is the design, and with
the knob 43-46%. The drain is the one dose-response measured in whole fields: off 0.67 (#410), 10% 0.81 (#422), 50% 1.00. Prediction:
ahead. Said before it runs: the drain's dose was tuned at today's coverage, so a fuller drain may be past its best; a 1.2x effect would
be within what eight pairs can see, a smaller one would not.

- **Arms:** the engine with `TASK_KLIN` 0 (shipped) against a copy with default 1 (`field-pair.sh`, `FROM="__tk('__TASK_KLIN',0)"`).
  Knob off is byte-identical (digests `4f01f2d0` seed 3 and `3738d7ff` seed 11, `MIND=20`, 2,000 ticks).
- **Pairs:** 8, 25 minutes each (`SECS=1500`), each alone on the machine, one per launch (`lab/port/klin-set.sh`). A pair cut short is void
  and rerun. No stopping early, with ONE registered futility stop: if pairs 1 and 2 are BOTH below 0.75 at the last sample, the set
  stops and the knob is removed.
- **Primary:** F at the last sample, ratio switch / shipped, per pair. **SHIP** if the median ratio is above 1.00 AND at least 7 of 8 are
  ahead AND the median size-17+ ratio is at least 0.90; then `TASK_KLIN` defaults to 1 wherever the open world runs.
- **Otherwise REMOVED.** The engine's lineage depth (`probe-depth.js` meanNew) is changed by the knob by definition and is not a reading
  of either arm.
- Analysis: `lab/port/analyse-klin.js` (written now).
