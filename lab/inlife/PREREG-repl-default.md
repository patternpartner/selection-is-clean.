# Should REPL be the default world? (written and COMMITTED before the first decision run)

21 Oct 2026. Engine: engine.html with #318 (the draw-trial guard; headless trajectories identical to the commit before it). Harness: harness-oee.js, unchanged (REPL and NULLSHIFT already in KNOBS).
Shape: CLAUDE.md's retire-or-prove template, used here for a change of DEFAULT rather than a deletion. Where I depart from it I say so and why.
Asked for by the user after an external review pointed at it ("SUN and REPL are the most sound version of this engine, but they are off by default").

## Why this question
In the default world programs barely decide who reproduces: #303c removed the whole VM from tick 0 and found no effect; births come mostly from physics (`interferenceCreate`) and one global energy pool (#219, #267-#270).
Under REPL (#273) physics makes no babies and a particle breeds only when its own program asks and its own store pays. There, removing the VM collapses the population on 5 of 5 unseen seeds (PREREG-repl.md, #303d-era entry),
and predation arises by mutation and spreads by selection on 3 of 3 seeds against a disarmed control (#273). By CLAUDE.md's own test ("if a mechanism does not change who has offspring, it is decoration"),
the evolved programs are decoration in the world people see and the replicator in a world nobody sees by default.
Against that, the record says long REPL worlds go clonal (#282: "every long REPL world ends with one lineage") and one of #273's three seeds overexploited itself to extinction. So the direction on the diversity measures is genuinely open.

## Arms (per seed)
- **D0-D3**: the current default world (REPL unset), NULLSHIFT 0, 1, 2, 3. This is the null band (template: at least three nulls as well as the control).
- **R0-R2**: REPL=1, everything else default (law mutation ON, no REPL_ARMS/ATOMS/SEX/COST), NULLSHIFT 0, 1, 2.
DEPARTURE: earlier REPL runs used LAWMUT=0. A default world has law mutation, so the candidate default must too.
DEPARTURE: three REPL replicates rather than one arm, so a seed's REPL result is not one draw (see "moves" below).
Every run: SEED=s TICKS=10000 SAMPLE=1000 ESTABLISH=1000 ESTWARM=2000 ESTN=10. Seeds **6101-6105** (never run). 35 runs. Script: `lab/inlife/repl-default-batch.sh`, analysis: `lab/inlife/analyse-repl-default.js`.

**Horizon, out loud.** 10,000 ticks. That is about 25 generations under REPL (median life about 400) and about 3 in the default world (median life about 3,800). The generation gap is part of what is being compared, not a confound to remove,
but it means a verdict here is about the first 10,000 ticks of a world, which is where a newly opened universe spends its first minutes. It says nothing about the 30,000+ tick behaviour #275-#282 describe.

## Pilot (practice seed 1, 3,000 ticks, REPL=1; NOT evidence, timing and manipulation check only)
56 s wall. N 329 -> 522 -> 301 -> 564 at ticks 1, 1,001, 2,001, 3,001; 1,722 births; `repl.birth` fired (not in livenessNever). Never fired: repl.prey, repl.scavenge, repl.gift (no predation yet by 3,000 ticks, as in #273, where it first spread at 4,000-6,000).

## Step 1 - executed first
A seed COUNTS only if: all 7 runs finished; at least 3 of the 4 default runs have no loopErrors/driverErr and did not crash; all 3 REPL runs have no errors and `repl.birth` is NOT in `livenessNever` (REPL births happened).
A REPL run that crashed (alive above 20 then under 5) still counts: a crash is a result, ruled on below. Fewer than 3 counted seeds = INCONCLUSIVE; the default does not change.

## Step 3 - the ruling measures (grid-free twins; old two reported beside them)
- M1 centredEntropyRatio: threshold 0.05 absolute from the default band's mean.
- M2 spread_late: threshold 10% of the default band's mean.
- M3 establishment fraction (estFrac): threshold 25% relative (a default mean of 0 with REPL 0 = no move).
- Guard: alive_late, and crashes. Reported, not ruling: entropyRatio, kinds_late (the origin-corner grid, #257c), final N, generation, births.

A measure MOVES on a seed only if ALL THREE REPL runs lie outside the default band on the SAME side (all above its maximum, or all below its minimum) AND the REPL mean is beyond the threshold from the default mean.
Same measure, same direction, on at least two thirds of counted seeds (as in PREREG-vm-retire-or-prove.md, for the same reason: with three measures, "any measure on any seed" fires by luck, #249b).

## Verdicts (read from REPL's side)
- **WORSE**: some measure moves DOWN on >= 2/3 of counted seeds, or REPL runs crash while no default run does on >= 2/3. -> REPL stays off by default.
- **BETTER**: some measure moves UP on >= 2/3 of counted seeds, and none is WORSE. -> I recommend making REPL the default, and **it goes to the user before it ships** (step 6 below). Claimed only at the rung measured: a diversity measure, not "more open-ended".
- **SPLIT**: one measure WORSE and another BETTER, each on >= 2/3. -> default does not move (CLAUDE.md: the default does not move on a SPLIT).
- **DIFFERS, NO CONSISTENT DIRECTION** / **NO MEASURED DIFFERENCE** -> default does not move.
DEPARTURE, on purpose: for a deletion the template keeps a mechanism that is "not WORSE and differs". A change of default alters every new and every reloaded universe, so here the burden is the other way: it moves only on BETTER.

## Prediction written before running
SPLIT or WORSE on diversity. I expect REPL to lower centredEntropyRatio and spread_late (selection sweeps a lineage within 25 generations, #282) and to raise or leave establishment, and I give a real chance (one seed in five) of a REPL crash.
If REPL comes out BETTER on the grid-free diversity measures at this horizon, that is the surprising result, and the step-6 question goes to the user.

## Template step 6 - saved worlds
Making REPL the default would change every saved universe on reload: physics would stop making babies, the store economy (SUN) would replace the global pool, and the germline's ancestor instruction is only installed at boot of a fresh world.
NOTHING from this round changes the default or any saved universe. Whatever the verdict, the engine is not changed by this pre-registration.

## What this cannot say
Five seeds, one horizon, REPL's defaults, one world size. It cannot say anything about the field (index.html), where universes interact. It cannot say whether a REPL default would hold diversity past #282's clonal sweeps.
It does not test which of REPL's parts (no physics births, own-store payment, short lives) does the work.
