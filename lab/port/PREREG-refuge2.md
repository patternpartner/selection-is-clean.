# PRE-REGISTRATION #379 — the prey refuge, judged where it can act: on PAIRED worlds whose default had a predator outbreak (`REPL_REFUGE`)

Written and committed before any decision run. Seeds 11201-11220 have never been run by anyone.

## Why
- **Collapse is the commonest way the computing world stops finding new functions, and predation is its commonest route.**
  - In #377 and #378, 18 of 54 worlds collapsed. 15 of those were predator outbreaks: hundreds of op 155 carriers, 10,000-197,000
    prey events per 500 ticks, and the mean store drained to 0.03-0.10, against the 0.25 a birth costs.
  - In every collapse, mean amplitude stayed at 0.55-1.2, far above the 0.04 death threshold. The creatures were alive and could
    not afford to breed, so the world aged out.
  - #372's census found the same route on 10 replays.
- **The refuge (`REPL_REFUGE=1`, #373) bounds exactly that drain.** A take may not bring the prey's store below
  `BIRTH_ENERGY_COST`.
- **It has never had a counted decision.**
  - #373 counted 0 seeds: its floor demanded predation in every replicate of both arms. Outbreaks are per-world events, and the
    refuge itself suppresses them.
  - #375 found no dead state to test.
  - #373's write-up names the fair design: many paired worlds, ruled on the pairs whose default world had an outbreak. This is
    that design.
- **Design data** (#373's pairs, seeds 10601-10604, seen; they design this, they do not decide it):
  - The refuge world found more new functions in 7 of 10 pairs, and in 2 of the 3 outbreak pairs.
  - In 29 default worlds with diagnostics, 15 had an outbreak by the definition below and 22 had at least 1,000 prey events.

## Runs
- **20 pairs:** seeds 11201-11220. Each seed is run once as DEF (today's world) and once as REFUGE (`REPL_REFUGE=1`), both reseeded
  after tick 1 with the same stream (`RESEED_AT=1 RESEED=1`).
- `TASKS=1`, 12,000 ticks, `DIAG=1`.
- Batch `lab/port/refuge2-batch.sh`, out `lab/port/out-refuge2/`, analysis `lab/port/analyse-refuge2.js`, written before the runs
  finish.

## Executed first (per pair)
- A pair COUNTS if its DEF world had a predator outbreak: some 500-tick window with at least 10,000 prey events and at least 50
  carriers of op 155. These are the thresholds every predation collapse in #377/#378 exceeded.
- The REFUGE world is not required to show one; suppressing it is the point.
- Report the counted pairs first. **Fewer than 8 counted pairs: INCONCLUSIVE**, the default does not move.

## Measures (per world)
- **V:** functions new to the universe's history over 12,000 ticks.
- **C:** collapse as #371 defined it, after first reaching 300 alive.
- Reported, not ruled on: alive late, lowest mean store, prey events, peak op 155 carriers.

## Rule (on the counted pairs)
This departs from the per-seed template shape for the reason #373 found: an outbreak is a property of a world, not of a seed. The
null is built into the pairing. Under no effect, a pair's refuge world is as likely to find more as fewer, and the test asks
whether the pairs lean one way beyond chance. Both directions use the same test and threshold.
- **Primary test:** a one-sided exact Wilcoxon signed-rank test on `log(V_refuge / V_def)` over the counted pairs. V is floored at
  1 before the log.
- **BETTER:** refuge greater than default at p < 0.05.
- **WORSE:** refuge less than default at p < 0.05.
- **Guard:** if the median REFUGE alive-late is under half the median DEF alive-late on the counted pairs, BETTER does not ship.
- Reported beside it, not ruled on: the same test over all pairs with at least 1,000 DEF prey events; and collapse discordance
  (pairs where only DEF collapsed against pairs where only REFUGE did).

## Verdict
- **BETTER, and the guard holds:** ship. `REPL_REFUGE` defaults to 1 wherever TASKS runs (the browser's default world).
  `REPL_REFUGE=0` restores today's predation. Node's default world, and REPL without TASKS, are untouched and byte-identical.
- **WORSE:** DELETE the knob. This file and the notes stay as the record.
- **Anything else:** the knob stays 0, and the result is recorded as it stands.

## Prediction (mine, before any run; my last four were wrong)
BETTER. The design pairs lean that way (7 of 10), and the route the refuge bounds is 15 of 18 collapses. The risk I see: a refuge
also starves predators, and #366 found predation does useful work where worlds live, so V could fall in the pairs that never
collapse.

## Saved worlds (rule 6)
The refuge is a rule, not a gene. If it ships, a saved TASKS universe that reloads runs with it. Said here; it does not block.
