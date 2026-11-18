# #456 — a universe sets its own birth price (pre-registered before any field run)

`AUTOK=1` / `#autok` (TASKS; default 0, byte-identical `9e88d2f9`). Every 60 s of its own clock a universe compares its new
functions per ms with the last window's, keeps moving K (x1.25) the same way if the rate held or rose, turns back if it fell,
inside 25-1,600, starting at the shipped 100 with a first step toward a cheaper birth.

**The measured result that predicts it helps:** the best K changes with a field's age (`#416`: K=100 behind 0.84 at 5 minutes,
ahead from 20; `#419`: the lead grows to 150 minutes; `#420`: below 100 is worse). **Expected size, said before:** about the early
deficit (around 1.2x at 5 minutes) and little after, unless the best K keeps moving. It tunes a rate; it is not a new source of
novelty.

**Design pair** (`field-pair.sh`, `FROM="__tk('__AUTOK',0)"`, 25 minutes, run alone). It STOPS here, and the knob is removed, if:
- **it does not move:** the median universe's K at 25 minutes is within 80-125; or
- **the premise fails:** the self-setting field is not ahead at 5 minutes (ratio under 1.00).

Otherwise a registered set of 8 pairs, ruled as `#416` was: SHIP if the median ratio at 25 minutes is above 1.00 with a one-sided
sign test p < 0.05, and functions of size 17+ at least 0.90x; else removed.
