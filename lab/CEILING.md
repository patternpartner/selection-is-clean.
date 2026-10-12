# CEILING - can the score move at all? (diagnostic, pre-registered before any run)

Five interventions (gardener, locksmith, dreamer, archivist, scatterer) died with S late near 0 in every arm, nulls included
(scatterer means 0-0.08). A bar that every arm sits on cannot rank anything. Before another intervention: does any chemistry
this core offers - lean 256-species CHEM, CHEM_BIG, or CHEM_BIG with more of each meal left as chemistry (CHEM_ALPHA 0.8) -
lift S off the floor on its own? Not an intervention: no new mechanism, no engine change (oee-core.js identical to
cos/scatterer 9e0121f, so flag-off identity holds trivially). Every arm is an existing flag set.

Arms (lab/ceiling/decide.jobs), unseen seeds 7921-7923, 1.2M ticks, EVERY 1000, FLUXALL:
L lean CHEM; LP lean, NULLSHIFT 1 (noise twin); B CHEM_BIG; BP CHEM_BIG, NULLSHIFT 1; BR CHEM_BIG + CHEM_ALPHA 0.8.
CHEM_ALPHA 0.8 is fixed here, untried; no trial, no tuning.

Score: S = lab/used-novelty.js late third, unchanged (income share >= 1%, WIN 30, LAG 2). Collapse: mean N last quarter < 200.
Rule, per arm in {L,B,BR}: MOVES if >= 2 readable seeds, S late > 0 on every readable seed, and mean S late >= 0.5
(half a sticky new income trick per 30k-tick window - enough room for a 1.10 ratio to mean anything).
VERDICT GO (score can move) if any arm MOVES; else NO-GO FLOOR. Twin gaps and B-vs-L are descriptive only.
GO -> the next intervention runs on the arm that moved, against that arm's own nulls. NO-GO -> stop interventions on this
core under this metric; the next step changes the core's chemistry or the metric's resolution, pre-registered as such.

## Result (deciding round, scored 2026-10-12 11:53 BST)

```
7921 L  rows 1200 N 1528 | S 0.00 (mid 0.08) K 7 usedEver 12
7921 LP rows 1200 N 1514 | S 0.00 (mid 0.00) K 12 usedEver 21
7921 B  rows 1200 N 1380 | S 0.00 (mid 0.00) K 5 usedEver 10
7921 BP rows 1200 N 1408 | S 0.00 (mid 0.17) K 6 usedEver 10
7921 BR rows 1200 N 106 COLLAPSED | S 0.00 (mid 0.00) K 0 usedEver 0
7922 L  rows 1200 N 1562 | S 0.00 (mid 0.00) K 9 usedEver 18
7922 LP rows 1200 N 1588 | S 0.00 (mid 0.00) K 17 usedEver 22
7922 B  rows 1200 N 1539 | S 0.17 (mid 0.25) K 11 usedEver 22
7922 BP rows 1200 N 1435 | S 0.17 (mid 0.25) K 13 usedEver 15
7922 BR rows 1200 N 1151 | S 0.33 (mid 0.25) K 9 usedEver 20
7923 L  rows 1200 N 1424 | S 0.00 (mid 0.00) K 9 usedEver 17
7923 LP rows 1200 N 1418 | S 0.00 (mid 0.00) K 7 usedEver 18
7923 B  rows 1200 N 1382 | S 0.17 (mid 0.08) K 9 usedEver 14
7923 BP rows 1200 N 1435 | S 0.00 (mid 0.33) K 13 usedEver 20
7923 BR rows 1200 N 102 COLLAPSED | S 0.00 (mid 0.00) K 0 usedEver 1
L: readable 3, S>0 on 0, mean S 0.000, mean K 8.3 -> floor
B: readable 3, S>0 on 2, mean S 0.111, mean K 8.3 -> floor
BR: unreadable
descriptive: twin gaps |L-LP| S 0.000, |B-BP| S 0.056; B-L mean S 0.111, K 0.0

VERDICT: NO-GO - FLOOR: no chemistry arm, lean, big or rich, lifts S late off zero; the metric cannot rank interventions on this core
```

NO-GO FLOOR. BR collapsed on 2 of 3 seeds (N ~100), so it is unreadable. L and B never reach the 0.5 bar (best seed S 0.17-0.33; means 0.000 and 0.111). Per the pre-registration: stop interventions on this core under this metric; the next step changes the core chemistry or the metric resolution, pre-registered as such.
