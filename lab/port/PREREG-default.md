# #351 — PRE-REGISTERED: should TASKS be the default world? (written and committed before the first decision run)

Engine at the commit that adds this file (TASKS as in #350, default off). Harness `harness-oee.js`, unchanged (TASKS and
NULLSHIFT are in harness-env's KNOBS). Shape: #319's (`lab/inlife/PREREG-repl-default.md`), the template used for a change
of DEFAULT, with two departures, both stated below.

## Why
#350 made TASKS the first engine world where what a program computes decides who lives (A and B CONFIRMED, 2 of 3 seeds).
The default world is one where it does not (#303c: removing the whole VM had no effect). CLAUDE.md's dependent variables
decide whether the artwork should run in TASKS.

## Arms (per seed)
- **D0-D3:** the current default world, NULLSHIFT 0-3. This is the null band.
- **T0-T2:** `TASKS=1`, everything else default (law mutation on), NULLSHIFT 0-2.
- **R0:** `REPL=1`, NULLSHIFT 0. This is a reference: does TASKS keep REPL's lineage collapse (#319)? It is not ruled on.

Every run: `SEED=s TICKS=20000 SAMPLE=1000 ESTABLISH=1000 ESTWARM=2000 ESTN=10`. Seeds **9201-9203** (never run).
24 runs. Script `lab/port/default-batch.sh`, analysis `lab/port/analyse-default.js`.

**Horizon, out loud: 20,000 ticks.** #319 used 10,000. **DEPARTURE:** doubled, because under TASKS composition takes off
at a seed-dependent time (#350: by 10,000 ticks on 2 of 3 seeds), and a default chosen on its first minutes alone would
be chosen on the founder's world.

**Pilot (design seed 1, one TASKS run, not evidence):** 7 minutes wall. The population boomed to 1,209 at tick 3,000,
fell to 30 by 4,000, and recovered to about 245. Late lineages standing about 120. No errors.

## Step 1 - executed first
A seed COUNTS if:
- all 8 runs finished;
- at least 3 of the 4 default runs have no loopErrors or driverErr and did not crash;
- all 3 TASKS runs have no errors and `repl.birth` is not in `livenessNever`.

A TASKS crash (alive above 20, then under 5) counts as a result. Fewer than 3 counted seeds is INCONCLUSIVE.

## Step 3 - the ruling measures
| measure | moves when the TASKS mean differs from the default band's mean by more than |
|---|---|
| M1 centredEntropyRatio | 0.05 absolute |
| M2 spread_late | 10% relative |
| M3 estFrac | 25% relative |
| M4 lineages standing late | 25% relative |
| M5 program diversity late | 10% relative |

- M4 is the mean of `linStanding` over the series samples at ticks of 14,000 or more.
- M5 is the mean of `progSigH` over those same samples.
- **DEPARTURE:** M4 and M5 are added. #319's verdict was BETTER on traits, but the default was not moved because lineages fell 5-100x. That decision asked for the next ruling to rule on lineages and program diversity, so they rule here.
- **Guard:** alive_late, and crashes.
- **Reported, not ruling:** entropyRatio, kinds_late, final N, births, and R0's values.

A measure MOVES on a seed only if all three TASKS runs lie outside the default band on the same side, AND the TASKS mean
is beyond the threshold from the band's mean. The same measure must move in the same direction on at least 2 of 3 counted seeds.

## Verdicts (read from TASKS's side)
- **WORSE:** some measure moves DOWN on at least 2/3 of counted seeds, or TASKS runs crash while no default run does on
  at least 2/3. TASKS stays off by default.
- **BETTER:** some measure moves UP on at least 2/3, and none is WORSE. **TASKS becomes the default world**, shipped in
  the same session (CLAUDE.md rule 6: saved worlds do not block it). On reload a save gets empty word files, full pools,
  and REPL's birth rules. Claimed only at the rung measured.
- **SPLIT** (one measure WORSE and another BETTER, each on at least 2/3), DIFFERS WITH NO CONSISTENT DIRECTION, or NO
  MEASURED DIFFERENCE: the default does not move.

## Prediction
SPLIT. Under TASKS, trait spread and centred entropy go UP, as REPL's did in #319, and the pilot's centredEntropyRatio
was 1.54. Lineages go DOWN, as under REPL, though less: the pilot stood at about 120 against #319's default 183-316.
Program diversity I do not predict.

## What this cannot say
- Three seeds, one horizon, TASKS's defaults, one world size.
- Nothing about the field (index.html), where universes interact.
- Nothing about whether the computed functions keep diversifying past 20,000 ticks: that is the lab's #349 and its
  engine twin, still to come.
