# #356 — PRE-REGISTERED: do discoveries become foundations? Depth of new functions over a long run, on the new default (committed before any decision run)

Engine at the commit that adds this file. Probe `lab/port/probe-deps.js`, through the read-only hook `__taskOnPay` (null unless a
rig sets it; draws nothing; with it unset the shipped default and #350's world were checked byte-identical).

## The measure
- Each function's FIRST PAYMENT is recorded, with the read functions that fed the paid word (at most 4).
- **DEPTH(T)** = 0 if that first payment used no read; otherwise 1 + the largest depth among its read functions.
- A read function never paid counts 0 and is tallied as `unpaidKey`.
- Depth is fixed at first payment, so it cannot cycle.
- If discoveries become foundations, the functions arriving LATE should stand on deeper stacks of earlier discoveries than those arriving early.

**Why a control:** founders that read neighbours build chains with no evolution. On design seed 9101, pinned founders reached 33 functions and depth 3 at most by tick 1,000; the evolving default reached depth 9 by tick 1,500.

## Arms, seeds 9701-9703 (never run)
| arm | knobs | horizon |
|---|---|---|
| DEFAULT | `TASKS=1` (TASK_FOUNDER and TASK_MUT on) | up to 200,000 ticks or 105 minutes of wall clock |
| PIN | `TASKS=1 PIN=anc` (nothing evolves) | the same |

`BLOCK=5000`. Out `lab/port/out-deps/`, analysis `lab/port/analyse-deps.js`. **Horizon, out loud:** each DEFAULT run's horizon H
is wherever its wall clock stops it. The second quarter is (H/4, H/2] and the last quarter is (3H/4, H], both in blocks. Each
quarter's mean depth is weighted by the number of functions first paid in it.

## Rules (each needs 2 of 3 seeds)
- **ACCUMULATING:** DEFAULT's last-quarter mean depth exceeds its second-quarter mean depth; AND at least one function is first paid in the last quarter; AND DEFAULT's last-quarter mean depth exceeds the maximum depth the PIN arm reached in its whole run on that seed.
- **STALLED:** the last-quarter mean depth is at most the second-quarter's, on at least 2 of 3.
- **MIXED:** otherwise.

Reported, not ruled on:
- the trend in the share of first payments built only on already-paid functions (`allEarlier`);
- pools empty and under 1% of cap (the reload-windfall question);
- the drain's share of task income;
- the repertoire, and the final depth histogram.

## Prediction
ACCUMULATING on 2 of 3. Depth keeps rising slowly, because the space's reachable functions are deeper the further out the repertoire is.

## What it cannot say
- A rising depth says new functions are BUILT FROM earlier ones (the reads are causal at payment). It does not say the earlier ones were selected because they enabled later ones.
- One horizon per seed, set by the wall clock.
