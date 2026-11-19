# #457b — the ground keeps unrecorded discoveries: the registered set (written before pair 1)

This is a NEW experiment, chosen after #457's design pair (1.06x at 25 minutes against its own bar of 1.10, deeper at every mark).
Said before it runs: a 1.06x effect is small beside the ~15% that fields of one engine vary by, so the likely outcome is not SHIP.

- **Arms:** the engine with `TASK_GNEW` 0 (shipped world) against a copy with default 1 (`field-pair.sh`, `FROM="__tk('__TASK_GNEW',0)"`).
- **Pairs:** 8, each 25 minutes (`SECS=1500`), each run alone on the machine, one per launch (`lab/port/gnew-set.sh`). A pair cut
  short by a restart is void and rerun from scratch. **No stopping early** (#437): all 8 run whatever the first ones show.
- **Primary:** F (distinct functions found anywhere in the field) at the last sample, ratio switch / shipped, per pair.
- **SHIP** if the median ratio is above 1.00 AND at least 7 of 8 pairs are ahead (one-sided sign test, p = 0.035) AND the median
  ratio of size-17+ new functions is at least 0.90. Then `TASK_GNEW` defaults to 1 wherever the ground runs.
- **Otherwise REMOVED** for good, and the depth readout is reported beside the count, not used to rescue it.
- Analysis: `lab/port/analyse-gnew-set.js` (written now, before any pair).
