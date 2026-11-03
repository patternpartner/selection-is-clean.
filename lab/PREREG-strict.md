# STRICT composition: with copies AND complements of a neighbour's output unpaid, does reading others still lift the ceiling? (written and COMMITTED before the first decision run)

22 Oct 2026. Core: `lab/oee-core-tasks.js` with #336's `REFUSE_NOT` and `DEPTH` (both off: identical to the #334 file, seed 5, 20,000 ticks; `DEPTH` alone: same trajectory, bookkeeping only). Circuit sizes: `CSZ` in `lab/core-tasks.js` (exact minimum NAND circuit size, gates shared, all 256 three-input functions). Batch `lab/tasks2-batch.sh`, analysis `lab/analyse-strict.js`. Asked for by the user after #335.

## Why
#334: reading neighbours' outputs lifted the hardest active function from NAND formula size 6 to 10 on 3 of 3 seeds, then plateaued. #335: the reads are causal (knockout: hardest 10 -> 7), but almost every size-7+ function was the COMPLEMENT of the word just read (e.g. NOR3 from OR3 and back), and formula size charges NOT(f) as 2*size(f)+1. Re-graded by circuit size, #334's LIVE hardest is 7/7/7 gates against CONTROL's 4/6/4: smaller, still present.
On one wire w the only functions are 0, 1, w and NOT w; constants were never paid and w (a copy) was refused in #334. Refusing NOT w too means a read can only pay by being COMBINED with something else (the inputs, another read).

## The mechanism
As #334 (world-wide inputs redrawn every 50 ticks; op 28 READ_OTHER), plus:
- **REFUSE_NOT=1:** an output is not paid if it equals, or is the 32-bit complement of, ANY of the last four words this organism read this epoch (#334 checked only the last read for copies: read A, read B, output A was a loophole there too).
- **DEPTH=1 (both arms, bookkeeping):** composition depth through the registers - INPUT 0, READ_OTHER the neighbour's output depth + 1, NAND/ADD/SUB/MUL the deeper operand, GET/MOV copy, any other change 0 - and payments tallied by depth 0/1/2/3+. **It is a DATA-FLOW depth**: a register touched by a read keeps its depth even if the final function does not depend on the read (a sanity run on #334's seed-7001 save showed depth 2+ on trivial functions such as NOT x1). Reported only, never ruled on.

## Arms and runs
- **STRICT:** TASKS=1 TASK_RATE 0.2 TASK_SCALE 1, OTHERS=1, REFUSE_NOT=1, DEPTH=1.
- **CONTROL:** the same with OTHERS=2 (reads return 0), DEPTH=1.
Seeds **7101, 7102, 7103** (never run), 1,200,000 ticks, EVERY=1000, 150,000-tick chunks. 6 worlds.

## Sanity check (practice: #334's seed-7001 LIVE save run on 20,000 ticks; NOT evidence)
With REFUSE_NOT switched on: 5.7 million complements refused, and the hardest active function fell from formula 10 / circuit 7 to formula 7 / circuit 6 within 20,000 ticks. Payments by data-flow depth 0/1/2/3+: 189,694 / 33,864 / 14,917 / 75,391.

## Step 1 - executed first
A STRICT world counts if READ_OTHER hit in at least 1% of its reads over the second half. A seed counts if both its worlds finished and its STRICT world counts. Fewer than 3 counted = INCONCLUSIVE.

## Ruling measures (windows of 30,000 ticks; ACTIVE as #290/#334: at least 1% of the window's task income and at least 100 per sample)
1. **SUSTAINED** and 2. **NO DECELERATION** exactly as PREREG-others.md, with its exhaustion clause (ever-active 200).
3. **THE WALL, graded by CIRCUIT size (ruling):** STRICT's hardest ever-active function has a circuit size strictly above CONTROL's hardest on the same seed, and at least 6, on at least 2 of 3 seeds. (Formula size is reported beside it; #334's CONTROL reached circuit 4, 6, 4.)

## Verdict
**BREAKS THE WALL BY COMPOSITION** (rule 3, and rules 1-2 hold or are exhausted on every seed) / **BREAKS THE WALL, THEN PLATEAUS** (rule 3 only) / **NOT SUPPORTED** (rule 3 fails).
Reported, ruling on nothing: ever-active counts; hardest per window by both measures; payments by depth; the functions paid at depth 2+; copies and complements refused; read hits; population.

## Prediction written before running
BREAKS THE WALL, THEN PLATEAUS - by less than #334 (one or two gates above CONTROL), because NAND(g, x) of a read word and an input is still a one-gate step.

## What this cannot say
Three seeds, one horizon, three-input functions only. The depth readout is data-flow, an upper bound on real composition. Refusing complements of the last four reads leaves NOT of an older read (five or more reads back in the same epoch) unrefused; the refusal counts show how much is left.
