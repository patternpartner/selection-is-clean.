# REPL_COPY: does computed replication stop the clonal sweep? (written and COMMITTED before the first decision run)

21 Oct 2026. Engine: engine.html with #324 (`REPL_COPY`; unset, harness-oee identical to the previous engine for the default world and REPL=1, seed 2, apart from four new names in the never-fired list). Harness: harness-oee.js with #324's ordered-genotype fields (`seqSigs`, `seqSigH`, `topSeqShare`, `progLen`; draw nothing). Batch `lab/inlife/repl-copy-batch.sh`, analysis `lab/inlife/analyse-repl-copy.js`. Asked for by the user.

## Why
#282: every long REPL world ends with one lineage. #319: at 10,000 ticks REPL already stands at 1-56 lineages against 183-316 in the default world. #320: restoring contact physics did not change that. A REPL birth is a free clone asked for by one instruction, so carrying more code costs nothing in time, and no organism can interfere with another's reproduction. Under REPL_COPY=1 a child's program has to be copied one instruction per executed op 225 into a buffer that persists across ticks, and a birth is refused (before anything is paid) until the copy is complete. A longer program gestates longer; a partner's op 225 writes into your buffer, so your next child can carry its code.

## Arms (per seed)
- **COPY**: REPL=1 REPL_COPY=1, NULLSHIFT 0, 3, 7.
- **CONTROL**: REPL=1 REPL_COPY=2 REPL_INERT=225, NULLSHIFT 0, 3, 7. The SAME ancestor (op 225 first, then the REPL birth instruction, then the germline) and op 225 disarmed, so the only difference is computed replication (the user's refinement 3).
Every run: TICKS=10000 SAMPLE=500 ESTABLISH=1000 ESTWARM=2000 ESTN=10. Seeds **6301-6305** (never run). 30 runs.
NULLSHIFT 0, 3, 7 rather than 0, 1, 2: #309 and #322 found adjacent shifts sometimes give the same world to the unit.
Horizon, out loud: 10,000 ticks, about 25 REPL generations, the horizon at which #319 measured the collapse.

## Pilot (practice seed 1, 3,000 ticks; NOT evidence)
Both arms run without errors. COPY fired repl.copy, repl.inject, repl.copyIncomplete and repl.copyBirth; CONTROL fired none of them.
| tick | COPY: N / lineages / top genotype share / mean length | CONTROL |
|---|---|---|
| 1,001 | 473 / 160 / 0.002 / 14.4 | 692 / 184 / 0.341 / 14.6 |
| 2,001 | 274 / 81 / 0.007 / 15.0 | 483 / 49 / 0.044 / 16.8 |
| 3,001 | 495 / 61 / 0.004 / 15.2 | 922 / 27 / 0.032 / 16.7 |
**The ordered genotype saturates**: by tick 1,000 nearly every living particle has a unique exact sequence in BOTH arms (493 distinct of 495), because every birth mutates. Its entropy is then about log2(N), a population count. So `seqSigH` is reported and rules on nothing (a change from the design discussed with the user, made on the pilot before any decision run).

## Step 1 - executed first
A seed COUNTS if all 6 runs finished without loopErrors/driverErr; every COPY run fired `repl.copyBirth` (not in livenessNever) and every CONTROL run did not; and each arm has at least 2 DISTINCT replicates (two runs identical in every sampled N are one replicate). Fewer than 3 counted seeds = INCONCLUSIVE.

## Ruling measures
Late = mean over the last third of samples.
- **P1 lineages standing, late** (`linStanding`). Moves if every COPY replicate is outside every CONTROL replicate on one side and the means differ by more than 25% of the CONTROL mean. UP = more lineages.
- **P2 top genotype share, late** (`topSeqShare`: the commonest exact opcode sequence's share of the living; a sweep reads near 1). Same rule, threshold 50% of the CONTROL mean. DOWN = less dominated.
- **Guards** (as #319): centredEntropyRatio (0.05), spread_late (10%), and crashes (alive above 20 then under 5).
- **Reported, ruling on nothing**: progLen late (length selection), seqSigH late, alive late, estFrac, entropyRatio, kinds_late.

## Verdicts
- **BETTER** (computed replication holds diversity): P1 UP or P2 DOWN on >= 2/3 of counted seeds, AND neither P1 DOWN nor P2 UP on >= 2/3, AND no guard WORSE (lower cER or spread beyond threshold, or a COPY-only crash) on >= 2/3.
- **WORSE**: P1 DOWN or P2 UP on >= 2/3, or a guard WORSE on >= 2/3.
- **SPLIT**: both of the above.
- **NO CONSISTENT DIRECTION** / **NO MEASURED DIFFERENCE** otherwise.
Whatever the verdict, REPL_COPY stays a rig-only knob and the default world is untouched; a BETTER verdict would make it the candidate for the next REPL ruling, not a default.

## Prediction written before running
Mean program length lower under COPY on most seeds (shorter programs gestate faster). On the ruling measures: NO CONSISTENT DIRECTION. The pilot's lineage gap (61 against 27) is one seed at 3,000 ticks, and REPL's null spread is wide (#319: 1-56 at 10,000).

## Template step 6
REPL_COPY is a knob, default off; REPL itself is off by default. No saved universe changes.

## What this cannot say
Five seeds, one horizon. One copy design (one instruction per executed op 225, complete copy required, injection free). Whether parasites EMERGE is reported as injections and length only, not ruled on. Nothing about the default world.
