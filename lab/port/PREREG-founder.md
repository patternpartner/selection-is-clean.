# #353 — PRE-REGISTERED: does a founder that reads make TASKS worlds take off reliably? (committed before any decision run)

Engine at the commit that adds this file. Knob `TASK_FOUNDER=1` (default 0 until this rules), probe `lab/port/probe-arrivals.js`.

## Why
#352 found that take-off (composition spreading, and arrivals with it) is a lottery. It waits for READ to enter a spreading
lineage by mutation: seed 9301 never took off in 100,000 ticks, and #350's 9102 not by 10,000. Argon proposed (relayed) a
founder with ONE output that is a read-composite when its read hits and NAND of two inputs when it misses. That needs READ
to leave its word unchanged on a miss, where today it writes 0. So the package under test is both:

- **READ keeps on a miss:** the word and its masks are left as they were, and nothing is added to the refusal ring.
- **The founder head:** INPUT; COPY to word 1; INPUT; READ (sector 0) into word 1; NAND; OUTPUT; then REPL's reproduction
  instruction.

It is one payment per epoch, so in each epoch roughly the particles whose neighbour published earlier in the same tick are
paid for the composite, and the rest for the NAND.

## Arms (per seed), seeds 9401-9410 (never run), 10,000 ticks, `BLOCK=1000`
| arm | knobs |
|---|---|
| OLD | `TASKS=1` |
| NEW | `TASKS=1 TASK_FOUNDER=1` |
| PIN | `TASKS=1 TASK_FOUNDER=1 PIN=anc`: every program pinned to the new founder's; nothing evolves |

30 runs. Batch `lab/port/founder-batch.sh`, analysis `lab/port/analyse-founder.js`.

## Measures
- **Arrived:** cumulative functions that ever earned at least 0.25 (one birth's cost) in one 500-tick window, by tick 10,000.
- **Took off:** Arrived of at least 500 by tick 10,000. For calibration, #352's 9302 (which took off at once) had 4,008 by
  5,000; 9303 (which took off at about 30,000) had 273 by 10,000; 9301 (which never took off) had 171.
- **Crash:** some block with maxAlive above 20 is followed by a block whose minAlive is under 5.

## Rules
- **A. RELIABLE TAKE-OFF:** NEW took off on at least 8 of 10 seeds, AND on at least 3 more seeds than OLD → CONFIRMED.
  Otherwise NOT CONFIRMED.
- **Guard:** NEW crashes on at least 2 more seeds than OLD → WORSE, and the package is not shipped whatever A says.
- **B. EVOLUTION ADDS (the rung, not a gate):** NEW's Arrived is greater than PIN's on at least 8 of 10 seeds → evolution
  makes functions the founder's own read-chains do not. Otherwise the arrivals are the founder's construction.

## What follows
- **A CONFIRMED and the guard clear:** TASK_FOUNDER becomes 1 by default wherever TASKS runs (the browser default world, and
  any TASKS=1 rig). Saved universes get the new head through `replEnsureHead` on reload (rule 6 allows it).
- **Otherwise:** the knob stays 0 and the lottery stands. The next try is supply (the READ draw rate), pre-registered again.

## Predictions
A CONFIRMED (NEW 10/10; OLD 3-5/10). Guard clear. B CONFIRMED: on design seed 9101, by tick 1,000, evolving NEW had 330
functions against PIN's 25.

## Corrections to the relayed design, recorded so they are not lost
- READ did not leave the register unchanged on a miss. It wrote 0, in the lab and in the engine alike; this package changes that.
- The composite is not paid "one tick later": one payment per epoch, to the first valid output. Within an epoch's first
  tick, roughly the particles whose neighbour has already run are paid for it.
