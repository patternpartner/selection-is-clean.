# Are births limited by the shared energy pool? Halve and double the birth cost (written before any deciding run; delegated authority, decision mine)

13 Oct 2026. Engine: engine.html at main 8795752, defaults (LIVE stack). Follows #302: blanking every program moved total births by nothing because the interference route took over from the program route.

## Hypothesis and prediction written before running
Every successful birth is paid from one pool (`worldEnergy -= BIRTH_ENERGY_COST`; engine.html:21420-ish and the same in addCompound); metabolism takes first claim on the pool and reproduction gets the surplus
(engine.html:26986). If total births are limited by that pool, they should move inversely with the cost: HALF cost -> clearly more births, DOUBLE cost -> clearly fewer. If births are limited by the phase-
interference condition (aligned phases, similar tendencies, enough amplitude) and not by the pool, neither arm should move them. My prediction: the pool binds, so HALF raises births by well over 25% and
DOUBLE lowers them by well over 25%; I am less sure about the size of the DOUBLE effect, because dying particles return energy to the pool.

## Design
Per seed, same seed means an identical trajectory to tick 1500 (the intervention draws no random numbers).
- HALF:   at tick 1500 set BIRTH_ENERGY_COST to half its value (0.5).
- DOUBLE: at tick 1500 set BIRTH_ENERGY_COST to twice its value (2.0).
- NUDGE k = 1..4: at tick 1500 consume k random values and change nothing else (the null band).
All to tick 4000. Measures: successful parented births in (1500, 4000] (wrappers on addParticle / addCompound, no draws); alive count at 4000; mean worldEnergy over ticks 1500-4000 sampled every 100.
Seeds: 81-88 (never run). A seed counts if all six runs finish without engine error; fewer than 5 counted = INCONCLUSIVE.

## Statistic and rule (as before, once per arm)
L = ln((arm + 1) / (mean NUDGE 1..4 + 1)) per counted seed; paired-t 95% CI at the Bonferroni level for two arms (per-side tail 0.05/4); placebo = NUDGE 1 vs mean NUDGE 2..4.
- The pool BINDS (for that arm): CI excludes 0, the sign is the predicted one (HALF up, DOUBLE down), and |mean L| >= ln 1.25.
- The pool DOES NOT BIND: CI inside [ln 0.8, ln 1.25].
- otherwise INCONCLUSIVE for that arm. Births are primary; alive and mean worldEnergy are reported.

## What this cannot say
One window, default settings, eight seeds, a coarse four-null noise estimate. Changing the cost also changes the energy returned on death (DEATH_ENERGY_RETURN scales with it); this is a test of the cost lever, not of the pool in isolation.
