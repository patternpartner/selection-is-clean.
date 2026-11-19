# #457 — the ground keeps unrecorded discoveries (pre-registered stop, written after one 2,000-tick look)

`TASK_GNEW=1`. Measured premise (`probe-lost.js`, seeds 11-13, 12,000 ticks): 5-13 new functions go unrecorded for each one
recorded, 2-6% of them ever paid later. Seen so far: seed 11 at 2,000 ticks, 3,401 functions against the shipped 8,281 (0.41).

**Stop rule, written before any further run:** seeds 11, 12, 13, `TASKS=1 MIND=20`, 4,000 ticks. Shipped at 4,000 (same world,
`out-lost/`): 25,391; 21,187; 11,593. If the switch is under 0.67x on all three, it is removed, with no field pair. Otherwise one
25-minute field design pair; at 1.10x or more by 25 minutes, a registered set of 8 pairs; under that, removed.
