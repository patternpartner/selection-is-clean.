# Is op 225 (PROG_LATERAL_COPY) selected under REPL? ("somatic mimicry") (written and COMMITTED before the first decision run)

21 Oct 2026. Engine: engine.html with #322's `__on225` hook (null unless a probe sets it; harness-oee identical to the previous engine with it unset, default world and REPL=1 REPL_INERT=225, seed 2). Probe: `lab/inlife/probe225.js`. Batch: `lab/inlife/op225-batch.sh`. Analysis: `lab/inlife/analyse-op225.js`.

## Why
#320's desync probe found, under REPL only, 1-7 of 350-650 living particles running a program their children will not inherit, from about tick 4,000 (seed 1). op 225 replaces a particle's RUNNING program (`pProg[i]`) with a copy of its partner's; children are built from the germline (`pGenome[i].vmProgram`), which it does not touch. A review proposed "somatic mimicry": a lineage carrying op 225 borrows a working neighbour's program to earn births while passing on its own germline. Variation is not selection: the question is whether carrying op 225 SPREADS because of what it does.
op 225 only acts in the pairwise VM (a no-op in the solo VM) and needs `localRes[i] >= 0.3`, which is reset every tick and built only by contact, so it fires in crowds. Crowding is the confound the particle readout controls for.

## Arms (per seed)
- **ACTIVE**: REPL=1, NULLSHIFT 0, 1, 2.
- **INERT**: REPL=1 REPL_INERT=225, NULLSHIFT 0, 1, 2. op 225 is carried and mutated but does nothing (#273's design: byte-identical to ACTIVE until the first op 225 that would act).
Every run: TICKS=12000 SAMPLE=500 WINDOW=500. Seeds **6201-6205** (never run). 30 runs.
Horizon, out loud: 12,000 ticks (#273's horizon), about 30 REPL generations. In the pilot op 225 first acted near tick 4,000, so this is about 8,000 ticks of exposure.

## Pilot (practice seed 1, 6,000 ticks; NOT evidence)
ACTIVE: 52 copies by 28 particles; germline carriers 0 until 3,500, then 1, 4, 5, 8, 6 (of 348-647 living). Its split counts equal #320's desync probe exactly (the probe does not perturb the run); 0 identity mismatches across compactions.
Flagged particles 0.79 children each in their 500-tick window, density-matched controls 0.54 (n = 28 pairs). INERT: 47 would-copy calls by 3 particles; carriers 2 at 4,000, then 0.

## Step 1 - executed first
A seed COUNTS if all 6 runs finished with idMismatch 0, and op 225 actually copied (`flagCalls[1] > 0`) in at least 2 of the 3 ACTIVE runs. Fewer than 3 counted seeds = INCONCLUSIVE.

## The ruling measure (world level)
**C = germline carriage of op 225**: the share of the living whose `pGenome[i].vmProgram` contains op 225, averaged over the last four samples (ticks 10,500-12,000).
A seed is **UP** if all three ACTIVE runs have C above every INERT run's C, AND the ACTIVE mean is at least twice the INERT mean, AND at least 0.01 (one percent of the living) above it. **DOWN** is the mirror. Otherwise **none**.
The absolute floor is there because the pilot's counts are single digits; a doubling from 1 to 2 carriers is not a result.

## Verdicts
- **SELECTED**: UP on >= 2/3 of counted seeds, DOWN on none. op 225 spreads because of what it does (the #273 rung, measured causally).
- **SELECTED AGAINST**: DOWN on >= 2/3.
- **NOT SHOWN**: anything else, including mixed seeds.
No engine change follows from any verdict: op 225 stays as it is. A SELECTED verdict would make "should a lateral copy be inherited" a question worth a retire-or-prove of its own; NOT SHOWN closes it at this horizon.

## Mechanism readouts (reported, rule on nothing)
Pooled over every ACTIVE run of the counted seeds:
1. **Within arm, crowding held**: children per flagged particle (first copy, 500-tick window or until death) against its control (an unflagged living particle with the nearest pNeighborCount at the end of the same tick). Paired difference, mean and a bootstrap 95% interval (analysis's own stream).
2. **Across arms**: children per flagged ACTIVE particle against children per would-have-copied INERT particle. The arms are different worlds after the first copy, so this is the weaker comparison.

## Prediction written before running
NOT SHOWN. I expect carriage to stay at or under about 2% in both arms on most seeds, so the floor is not met, and the particle readout to sit slightly above its controls with an interval that spans zero.

## What this cannot say
Five seeds, one horizon, REPL defaults (no contact physics: REPL_CONTACT unset, as in every REPL result so far). Nothing about the default world, where #320's probe saw no split at all.
