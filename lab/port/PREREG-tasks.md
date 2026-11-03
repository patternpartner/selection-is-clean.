# #350 — PRE-REGISTERED: does computation decide who lives, once it pays? (TASKS in `engine.html`)

Written before any decision run. Engine at the commit that adds this file. Probe `lab/port/probe-tasks.js`.

## Why

#333 found that under REPL a world whose every program is the one reproduction instruction (the "rock") lives as well as
evolving REPL: sunlight pays, and nothing a program computes changes who lives. TASKS (#350) is the lab's recipe
(#334–#348) in the engine: logic functions of four world-wide input words are paid from scarce per-function pools, with the
trophic drain, and sunlight is cut to 25% of REPL's. This asks whether that turns #333 round.

## Pilots (design seeds 1 and 2 only, 3,000 ticks, not part of any verdict)

- Pool cap 1.0 per formula gate: seed 1 ignited (READ spread to nearly every program by tick 1,000; about 360 effective
  functions; mean formula size 5.4; the population ran to the 1,800 cap). Seed 2 did not ignite: size 1, about 8 functions.
- Pool cap 0.4 per gate: seed 1 ignited later (by tick 3,000: 1,209 alive, exp(H) 410, mean size 5.2); seed 2 again did not.
- So ignition (READ spreading) is a stochastic event, and whether it has happened depends on the horizon, not on the pool scale.
- The decision runs use the defaults: TASK_CAPM 400, TASK_RATEM 20, TASK_TROPHP 50, TASK_SUNP 25, TASK_DRAWP 25.

## Design

Seeds 9101, 9102, 9103 (never run). 10,000 ticks, SAMPLE 500. Four arms per seed:

| arm | knobs |
|---|---|
| TASKS | `TASKS=1` |
| ANC | `TASKS=1 PIN=anc`: every program pinned to the founder's (computes NAND of two inputs, then reproduces); nothing evolves |
| ROCK | `TASKS=1 PIN=rock`: every program pinned to `[4,2,4,1]`; computes nothing |
| REPL | `REPL=1`: the world TASKS modifies. A reference, not ruled on |

Measure: mean alive over the samples in the last third (ticks 7,000–10,000).

Executed-first: TASKS counts on a seed if its cumulative task income is over zero by the horizon (it is from tick 1, since
the founder computes). Ignition is reported per seed (READ carried by over 10% of living programs at the horizon), not ruled on.

## Rules (3 seeds; each rule needs 2 of 3)

- **A. COMPUTING PAYS FOR LIFE.** ROCK's late alive is under half of TASKS's on at least 2 of 3 seeds → CONFIRMED. At least
  half on at least 2 of 3 → NOT CONFIRMED (#333 stands under TASKS).
- **B. EVOLVED COMPUTING PAYS.** ANC's late alive is under half of TASKS's on at least 2 of 3 seeds → CONFIRMED. At least
  half on at least 2 of 3 → NOT CONFIRMED (what is paid is the founder's own NAND; evolving beyond it does not yet decide who lives).
- Reported beside them, not ruled on: births, exp(H), mean formula size, number of functions with at least 0.1% of income,
  task against sun income in the last third, READ and INPUT carriers, and REPL's late alive.

## Predictions

- A: CONFIRMED. With sunlight at a quarter, a rock lives on the floor alone.
- B: depends on ignition by 10,000 ticks, which happened on one of two pilot seeds. I predict NOT CONFIRMED on at least one
  seed and do not commit to the verdict.

## What follows

- A NOT CONFIRMED: the port has failed at its first purpose; recalibrate TASK_SUNP (pre-registered again) before anything else.
- A CONFIRMED: TASKS is the first engine world where computation decides who lives. Then #351 asks the template's question
  (should it become the default world?) against REPL and the default world, with null bands, on the engine's own dependent
  variables, before any retire-or-prove of the big layers is re-run inside it (PORT-PLAN.md, "Order").
- Saved worlds: TASKS is off by default, so nothing saved changes. If it is later made the default, a save reloaded into
  it starts with empty word files and full pools (none of the layer's state is saved yet), which CLAUDE.md rule 6 permits.

## Addendum (written before any valid decision run): the first three runs used the wrong pool scale

The first launch ran seed 9101's TASKS, ANC and ROCK arms with the engine's default `TASK_CAPM` of **50** (0.05 per formula
gate), not the 400 this file names as the default: the pilots had all set the knob by hand, so the code's default was never
the one tested. At 0.05 computing paid about 1/40 of sunlight and the three arms were indistinguishable (late alive about
100-330 in all three). Those three runs are VOID (kept outside the record in `lab/port/out-tasks-void/`). The engine's
default is now 400, matching the text above, and all twelve runs are made at it. Seed 9101 stays in the design: what was
seen was a different world, at a setting this rule does not rule on.
