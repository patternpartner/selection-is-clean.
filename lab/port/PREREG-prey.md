# #366 — PRE-REGISTERED: does switching predation off stop TASKS worlds collapsing? (committed before any decision run)

Engine at the commit that adds this file (`REPL_PREY` exists, default 1). Probe `lab/port/probe-arrivals.js` (rows carry prey events).

## Why
#365: both TASKS crashes examined were predator outbreaks: op 155 drained stores to the 0.05 prey floor until nobody could breed, then
the computing lineages died. 9803 OLD had no predators for 27,000 ticks, then collapsed within 6,000 of their arrival. In #362, 6 of 12
worlds collapsed below a quarter of their peak by 40,000.

## Design (seed 9802 TRICKLE, design, not evidence)
| arm | tick 5,000 | tick 10,000 |
|---|---|---|
| predation on | 286 alive, mean store 0.054, task income 33 / 250 ticks | 161 alive |
| `REPL_PREY=0` | 1,588 alive, store 0.77, income 258 | 1,718 alive, store 0.80, income 253 |

Against it: before its crash the predation world earned MORE task income (about 390 per 250 ticks at tick 4,000 against about 250). So turnover may
feed novelty, and the guard below is real.

## Arms, seeds 9901-9908 (never run), `TICKS=40000 BLOCK=5000 WALLMIN=900`
| arm | knobs |
|---|---|
| PREY | `TASKS=1` (today's default) |
| NOPREY | `TASKS=1 REPL_PREY=0` |

16 runs, 3 at a time. Batch `lab/port/prey-batch.sh`, analysis `lab/port/analyse-prey.js`.

## Measures
- **Collapse:** a block whose mean alive is under 25% of the highest block mean before it.
- **Executed:** a seed counts only if PREY ran predation (prey events above 0 in some block) and NOPREY ran none (0 in every block, the
  knob's negative side). Both arms must reach tick 40,000.
- **Late arrivals:** new functions arrived in the last two blocks (ticks 30,000-40,000). Late income: task income in the same blocks.

## Rule (at least 6 of 8 seeds counted, else INCONCLUSIVE)
- **CONFIRMED:** NOPREY collapses on at least 3 fewer counted seeds than PREY, AND on at most 1.
- **Guard, the dependent variable (SPLIT):** take the counted seeds on which neither arm collapsed. If there are at least 3, and NOPREY's late
  arrivals are lower than PREY's by more than 25% relative on at least two-thirds of them, the verdict is SPLIT and the default does not move.
- **CONFIRMED and not SPLIT** → under TASKS, `REPL_PREY` defaults to 0. Predation stays in plain REPL worlds, where TASKS is off.
- **Otherwise** the default stays 1.

## Prediction
CONFIRMED: PREY collapses on 3-5 of 8, NOPREY on 0-1. The guard: unsure, because of the design run's income.

## Departures from the template, stated
- **No null band.** CLAUDE.md asks for at least three null replicates per seed. The primary claim here is a frequency across seeds (collapse,
  yes or no), for which the seeds are the replicates. The guard is a per-seed comparison of a continuous measure without nulls. So it can
  STOP a ship, but nothing in this test can claim NOPREY is BETTER on novelty. Three nulls per seed would be 24 more runs of about 2 hours each.
- **Floor 6, not 3:** a frequency over fewer seeds says too little.

## What it cannot say
- **40,000 ticks.** 9803's predators arrived at 27,000; later arrivals of anything are outside the horizon.
- **It removes one mechanism, not "predators".** A world without op 155's take can still evolve other exploits (gifts, scavenging,
  stealing words through READ). If something else collapses NOPREY worlds, that is the next finding.
- **Saved worlds:** a shipped default changes saved TASKS universes on reload: their predators stop taking (CLAUDE.md rule 6: says so and ships).
- **The food web #275 found** is what predation buys in plain REPL worlds. It is not measured here, and it is not touched there.

## Addendum (execution only; the rules are unchanged)
At about 23:50 the container restarted and killed every run. Seven had finished (9901 and 9902 both arms; 9903, 9904 and 9905 PREY) and
stand. The three NOPREY runs in flight (9903, 9904, 9905) are restarted from scratch with the same seeds, so the same trajectories, and
9906-9908 have not begun. Partial results seen before the restart (9901-9902, both arms) are reported in OEE-NOTES; the rule is unchanged.
