# #458 — pay the last word of an epoch, not the first (stop rule, written after one 2,000-tick look)

`TASK_LAST=1`. Measured premise (`probe-last.js`, world-identical, seeds 11-13, 6,000 ticks): a creature's last clean word of an
epoch is new to the universe 6-10 points more often than its first and deeper more often than shallower. Seen so far: seed 11 at
2,000 ticks, 1,627 functions against the shipped 8,281 (0.20).

**Stop rule, written before any further run** (the same as #457's): seeds 11, 12, 13, `TASKS=1 MIND=20`, 4,000 ticks; shipped
25,391; 21,187; 11,593. Under 0.67x on all three: removed, no field pair. Otherwise one 25-minute field design pair; 1.10x or more
by 25 minutes: a registered set of 8 pairs; under that, removed.
