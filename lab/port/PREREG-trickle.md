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

## Addendum (execution only; the rules are unchanged)
The first launch ran 4 worlds in parallel. At the 1,800 cap they shared 4 cores, and after 82 minutes three were at only tick
20,000-25,000, certain to stop short of 40,000 (INCOMPLETE). Those three were stopped and their partial outputs discarded; only
9802 TRICKLE finished and stands. All remaining runs go 2 at a time (a single design run at 2-way parallelism reached 40,858
in 110 minutes). Seeds, arms, horizon and rules are unchanged. Partial rows of the stopped runs (to tick 25,000, none stalled)
were seen; they do not enter the analysis.

## Addendum 2 (execution only; the rules are unchanged; written after 3 runs had finished)
The wall cap counted the wrong worlds. A healthy world of about 1,500 particles runs at about 4 minutes per 1,000 ticks, so it
needs about 160 minutes to reach 40,000. The 115-minute cap (WALLMIN=115) stopped it short as INCOMPLETE, and an INCOMPLETE run is
not counted, while a stalled world of about 150 particles finishes in 17 minutes. So the cap selected stalled worlds into the count
and healthy ones out of it: the opposite of what the rule needs to see. Seen so far: 9801 OLD finished at 110.9 minutes (healthy,
just inside); 9801 TRICKLE stopped at tick 29,136 at the cap (healthy at every block); 9802 TRICKLE finished in 17 minutes and is
STALLED by the rule (0 arrivals, income 67 against a peak of 5,893). The trickle did not save 9802.

Change: the cap is raised to 900 minutes, so that every run reaches 40,000. 9801 TRICKLE is re-run from scratch (same seed, so the
same trajectory to 29,136 and then on). Runs go 3 at a time as detached jobs, with a harness waiter keeping the session alive.
Seeds, arms, horizon, measures and rules are unchanged.

## Addendum 3 (execution only)
At about 16:30, with 9805 TRICKLE, 9806 OLD and 9806 TRICKLE not yet started, the branch was fast-forwarded past #364b. That commit
removed the GRACE_MAX knob, replacing `small && (GRACE_MAX<=0 || age<GRACE_MAX)` with `small`. With the knob at 0, which is all this test
uses, that is the same expression; checked byte-identical at seed 3, 1,500 ticks, TASKS on. The runs not yet started boot from that
engine. Nothing else in the engine changed (#364 was added and reverted).
