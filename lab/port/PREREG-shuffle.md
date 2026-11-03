# PRE-REGISTRATION #376 — is the TASKS world's novelty SELECTED, or would it drift in anyway? (`TASK_SHUFFLE`, a control)

Written and committed before any decision run. Seeds 10901, 10902, 10903 have never been run by anyone.

## Why
Every novelty result since #350 stands on the rung "paid, and new to the universe". #352 put it plainly: "Not shown: that the new
functions are SELECTED rather than drifting into pools." The artwork's name is the claim that selection is doing it. A world with
mutation and full pools might drift into new functions just as well, and nothing so far could tell the two apart.

## The control
`TASK_SHUFFLE=1` changes one thing, at the single payment site: each payment's energy goes to a uniformly random living creature,
not to the one that computed the function. What stays:
- the pools, the drain and one payment per epoch;
- the counters, and how much is paid in total.

Only the link between computing a function and being fed for it is cut. Unset: byte-identical (seed 3, 1,500 ticks, TASKS on and
off). Set, on a 1,000-tick check (seed 5): 48 functions ever paid against 151, size 1.7 against 3.0.

## Runs
- **PAID x3** (today's world) and **SHUFFLE x3** per seed, `TASKS=1`, 12,000 ticks. Replicate k reseeds after tick 1
  (`RESEED_AT=1 RESEED=k`), shared by the arms.
- Probe `lab/port/probe-reload.js` (draws nothing). Batch `lab/port/shuffle-batch.sh`, out `lab/port/out-shuffle/`, analysis
  `lab/port/analyse-shuffle.js`, written before the runs finish.

## Executed first
A seed COUNTS if every PAID replicate was paid for at least 500 functions by 12,000 (the computing world took off) and every SHUFFLE
replicate made at least 1,000 payments (the control ran). It is not required that the SHUFFLE worlds take off: whether they do is
the question. Fewer than 3 counted: INCONCLUSIVE; extend with seeds 10904 onward.

## Measure
**V**: functions new to the universe's history over the 12,000 ticks. Reported, not ruled on: mean formula size and exp(H) over
the windows ending 6,500-12,000, alive late, payments.

## Rule, per counted seed
- **SELECTED** if every PAID V is above every SHUFFLE V and the lowest PAID V is more than 25% above the highest SHUFFLE V.
- **DRIFT SUFFICES** if the highest SHUFFLE V is at or above the lowest PAID V.
- Otherwise **UNCLEAR**.

## Verdict (two-thirds of counted seeds)
- **SELECTED on two-thirds:** the claim stands one rung higher. At this horizon, in this world, new functions arrive because the
  computer is the one fed: they are selected, not drift.
- **DRIFT SUFFICES on two-thirds:** the claim does not hold at this rung, and is written up as such: the new functions arrive just
  as well when computing earns nothing.
- **Anything else:** INCONCLUSIVE.
- **No default changes either way.** `TASK_SHUFFLE` stays as a permanent control, like #350's pinned arms. It answers a question
  the artwork's claim depends on, so it is not decoration in CLAUDE.md's sense.

## Prediction (mine, before any run)
SELECTED on 3 of 3. With pay shuffled, computing is neutral and the instructions still cost energy (REPL_COST), so mutation should
erode the logic ops and novelty should fall to near the founder's reach. The risk I see: shuffled pay still feeds the world as a
whole, so a well-fed world mutating fast could drift into many new functions, more than I expect.
