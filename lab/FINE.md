# FINE - a finer income-only sticky novelty (pre-registered before any run)

CEILING (1cdb4bd) ended NO-GO FLOOR: S (MIN 1%, WIN 30, LAG 2) sits at ~0 on every arm. Before another intervention, change
the metric's resolution only. Locked here, before any run:
FINE S = lab/used-novelty.js unchanged code, parameters MIN 0.002 (0.2% income share), WIN 10 (10k-tick windows), LAG 2, late third.
Still income-only; carrier share never read. Existing CEILING/older logs are NOT rescored (seen seeds; no peeking).

Stage 1 (no engine change; oee-core.js identical to 1cdb4bd): arms L lean CHEM, LP lean NULLSHIFT twin, B CHEM_BIG,
BP CHEM_BIG NULLSHIFT twin; unseen seeds 7931-7933; 1.2M ticks, EVERY 1000, FLUXALL. Collapse = mean N last quarter < 200.
GO iff B MOVES (>=2 readable seeds, S>0 on every readable seed, mean S >= 0.5) AND B's S differs from L's on >=2 of the
readable seeds (the score can tell two chemistries apart). Twins descriptive. Else NO-GO: delete lab/fine, branch stays as record.

Stage 2 (only on GO; pre-registered in this file in a separate commit before its runs): Locksmith (REACH, from cos/locksmith
history) on CHEM_BIG vs its own nulls (plain, blind-reach, NULLSHIFT twin), FINE S, fresh seeds 7941-7943, used-novelty.js bar
(beat every null outright on 2/3 seeds, mean rel >= 1.10, no collapse). Locksmith picked over Dreamer: cheaper, and Dreamer
scored zero even with private screening, so Locksmith is the fairer test of whether the old metric hid a real effect.

## Result (deciding round, scored 2026-10-12 16:41 BST)

```
7931 L  N 1343 | S 0.03 (mid 0.10) usedEver 34
7931 LP N 1375 | S 0.05 (mid 0.00) usedEver 29
7931 B  N 1343 | S 0.00 (mid 0.00) usedEver 21
7931 BP N 1400 | S 0.00 (mid 0.03) usedEver 30
7932 L  N 1484 | S 0.05 (mid 0.00) usedEver 33
7932 LP N 1615 | S 0.03 (mid 0.00) usedEver 14
7932 B  N 1480 | S 0.00 (mid 0.05) usedEver 20
7932 BP N 1471 | S 0.03 (mid 0.10) usedEver 27
7933 L  N 1491 | S 0.03 (mid 0.00) usedEver 16
7933 LP N 1430 | S 0.00 (mid 0.05) usedEver 36
7933 B  N 1415 | S 0.05 (mid 0.03) usedEver 26
7933 BP N 1439 | S 0.00 (mid 0.03) usedEver 26
B moves false (mean 0.017); L moves false (mean 0.034); B!=L on 3/3; twins BP 0.009 LP 0.026

VERDICT: NO-GO - FINE FLOOR: delete lab/fine; next step changes the chemistry, not the metric
```

NO-GO FLOOR. Finer resolution (MIN 0.002, WIN 10) still leaves every arm near zero (B mean S 0.017, L mean S 0.034; neither MOVES; B!=L on 3/3 is noise at the floor). Per the pre-registration: delete lab/fine; next step changes the chemistry, not the metric.
