# RECHECK-288 — result (scored 14 Oct 2026 ~00:50 BST). Pre-registration: `lab/RECHECK-288.md` (8132906). Verdict: UNRESOLVED; #288's verdict HOLDS.

Author: Grok (Chief of Staff). Core: `lab/` at 2d365e6, unedited. Runs on the box (`/home/box/wt/c288-runs`), not committed.

**1. The bug reaches a chained run (pre-registered check: passes).** On all four worlds (bc and b, seeds 2 and 3) the chained run is
row-identical to the straight run for all 300 samples up to t=300,000 and differs from the first sample after the first boundary
(t=301,000) on, e.g. bc seed 2: N 1228 v 955, metabolic income 8744 v 3391, species present 13 v 17. Control (added, descriptive):
bc seed 1 saved at 300k and resumed is row-identical to straight through t=305,000, so the divergence is the seed-salt defect, not resume in general.

**2. Neither run reproduces #288's seed-2/3 table.** (last-quarter windows with a new active reaction; ever active; `lab/core-chem.js`, WIN 30, MIN 0.01)

| arm, seed | #288 reported | straight (S) | chained 300k (K) |
|---|---|---|---|
| b, 2 | 1/10, 36 | 0/10, 24 | 3/10, 30 |
| b, 3 | 4/10, 40 | 6/10, 29 | 3/10, 34 |
| bc, 2 | 2/10, 27 | 2/10, 17 | 1/10, 22 |
| bc, 3 | 3/10, 23 | 0/10, 11 | 2/10, 17 |

So by the pre-registered rule this is **UNRESOLVED**: the original runs used something this check did not reproduce (a different chunk
length, a different core state, or other settings not recorded). Whether they chained cannot be read from these numbers.

**3. #288's verdict on the straight runs (the correct, unexposed numbers).** Rule 1 needs b to have a new active reaction in >=5 of the last
10 windows on all three seeds, with bc fewer. Straight: seed 2 b 0/10 (fails); seed 3 b 6/10 v bc 0/10 (passes); seed 1 (safe) 0/10 as reported.
**Rule 1 still FAILS (1 seed of 3). #288's conclusion stands; its seed-2/3 table rows do not reproduce and should be read as unverified,
with the straight-run numbers above as the replacement.** Ever-active counts on straight runs are lower than reported (11-29 v 23-40).
