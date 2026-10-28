# #362 — PRE-REGISTERED: does a founder trickle (`TASK_TRICKLE=200`) stop TASKS worlds from stalling? (committed before any decision run)

Engine at the commit that adds this file (TASK_TRICKLE and GRACE_MAX exist, both default off). Probe `lab/port/probe-arrivals.js`.

## Why
#356 and #360: long TASKS worlds can boom, crash, and settle into a state that computes almost nothing: a sunlight and predator
ecology that has lost INPUT (#360b). The reseed rescue does not fire there, because the world stays above RESEED_FLOOR.

## Design (seed 9701 only, design, not evidence)
| arm | outcome |
|---|---|
| GRACE_MAX=20000 | crashed at about 30,000, regrew to about 1,550 alive, but **0 new functions** for 60,000 ticks |
| TASK_TRICKLE=200 | never crashed; new functions per 10,000 ticks 3,529, then 2,094, 4,080 and 6,817 to tick 40,000 |

So the candidate is the trickle.

## Arms, seeds 9801-9806 (never run), `TICKS=40000 BLOCK=5000 WALLMIN=115`
| arm | knobs |
|---|---|
| OLD | `TASKS=1` (today's default) |
| TRICKLE | `TASKS=1 TASK_TRICKLE=200` |

12 runs. Batch `lab/port/trickle-batch.sh`, analysis `lab/port/analyse-trickle.js`.

## Measures
- **Peak:** the largest task income of any 5,000-tick block in the run.
- **STALLED:** the run reached tick 40,000, AND in its last two blocks (ticks 30,000-40,000) task income is under 5% of its peak AND fewer than 20 new functions arrived. A run that was never above 500 functions arrived by 40,000 is also STALLED (never took off).
- **INCOMPLETE:** stopped by the wall clock before tick 40,000. Reported; not counted in the rule.
- **Crash:** a block with maxAlive above 20, followed by one with minAlive under 5. Reported, and the guard.

## Rule (on counted seeds; at least 4 of 6 must be complete in BOTH arms, else INCONCLUSIVE)
- **CONFIRMED:** TRICKLE is STALLED on at least 2 fewer counted seeds than OLD, AND TRICKLE is STALLED on at most 1 counted seed.
  → TASK_TRICKLE=200 becomes the default wherever TASKS runs.
- **Guard:** TRICKLE crashes on more counted seeds than OLD → not shipped.
- **Otherwise NOT CONFIRMED;** the knob stays 0.

## Prediction
CONFIRMED: OLD stalls on 2-3 of 6, TRICKLE on 0-1.

## What it cannot say
- **40,000 ticks is short.** #356's 9701 crashed for good only at 85,000. Stalls arriving later are outside this horizon.
- **The trickle supplies the hand-written reading route, continuously.** Under it, a world's computing is partly a supply of immigrants, not only evolution. #355 found the route is supplied anyway; this makes it permanent.
- **It changes every TASKS world from tick 200, not only stalled ones.**
