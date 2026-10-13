# Population-wide blank at a LATER horizon (written before any deciding run; the user is away, decision mine)

13 Oct 2026. Engine: engine.html at main 8795752, defaults (= the LIVE stack). Replicates PREREG-popblank.md (sha256 a0176d7243af8c93) at T = 6000.

## Why
The tick-1500 result (births 0.94x, CI [0.81, 1.10]; alive 0.99x) held because 100% of births (seed 41, ticks 1500-3500) came from interferenceCreate, a phase-interference
rule with no VM involvement. Earlier probes showed addParticle-route parented births appearing later on some seeds (seed 1: 1 -> 208 between ticks 2000 and 6000).
That route may be program-driven. So the early result may not hold later.

## Prediction written before running
On seeds where the addParticle route is active before tick 6000, BLANK births in (6000, 8000] fall relative to NUDGE. Pooled over seeds the effect is expected to be smaller
than 25% unless that route carries a large share of births.

## Design (identical to PREREG-popblank.md except the times)
Per seed: BLANK (every alive program set to [], re-emptied every 20 ticks) and NUDGE k = 1..4 (consume k random values) at tick T = 6000; all run to tick 8000.
Measures: successful parented births in (6000, 8000], split by route (addParticle / addCompound); alive at 8000; mean program length (manipulation check).
Seeds: 51, 52, 53, 54, 55, 56 deciding (never run). Seed 1 is also run and REPORTED SEPARATELY (it was seen earlier); it does not enter the statistic.
A seed counts if all five runs finish without engine error; fewer than 5 counted seeds = INCONCLUSIVE.

## Statistic and rule (as before)
L = ln((BLANK + 1) / (mean NUDGE 1..4 + 1)) per seed; paired-t 95% CI over counted seeds; placebo = NUDGE 1 vs mean NUDGE 2..4.
MATTERS: CI excludes 0 and |mean L| >= ln 1.25. DOES NOT MATTER: CI inside [ln 0.8, ln 1.25]. Otherwise INCONCLUSIVE. Births primary; alive and route split reported.

## What this cannot say
One later window (2,000 ticks from tick 6,000), default settings, 6 deciding seeds.
