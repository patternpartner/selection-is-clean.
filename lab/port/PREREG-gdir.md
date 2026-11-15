# PRE-REGISTRATION #437 — the ground has directions (`TASK_GDIR`), judged in pairs of fields

Written and committed before any decision run. Browser fields are unseeded, so every pair below is a fresh draw nobody has seen.

## Why
- Today a READ that finds no live word reads the ground of the creature's OWN cell, whatever sector it asked for. Two READs in one
  program therefore get the same word.
- #436 found that a cell holding its last eight functions finds LESS than a cell holding only the latest (0.71), so the ground's
  value looks like the newest word of a place. `TASK_GDIR=1` keeps one function a cell and lets a read in sector s read the ADJACENT
  cell in that direction (its own cell when that one is empty or off the world): up to eight different newest words within reach.
- **The seen pair** (design, `lab/port/out-gdir-design/a-*`, 1,500 s): 134,776 against 94,765 distinct functions (1.42x), ahead at
  every five-minute mark (1.27 / 1.44 / 1.40 / 1.47 / 1.42), size 17+ 27,805 against 20,223 (1.37x), ticks 0.96x. One pair decides nothing.

## Arms
- **SHIP:** `engine.html` of commit 5e43da6 (the #435 world; `TASK_GDIR` 0 when unset).
- **GDIR:** the same file with `__tk('__TASK_GDIR',0)` changed to `__tk('__TASK_GDIR',1)` (asserted to occur once, and the copy to differ).
- Both arms run frozen copies of that commit (`lab/port/gdir-batch.sh`). The other files are the working tree's.

## Runs
- **8 pairs**, tags p1-p8, a SHIP field and a GDIR field launched together, 1,500 s, sampled every 60 s, out `lab/port/out-gdir/`.
- **Departure from earlier registrations, said beforehand:** the machine is NOT otherwise idle. Single-process node development runs
  beside some pairs. Both fields of a pair share whatever load there is, and the rule is on the within-pair ratio. Absolute counts
  from these pairs are not comparable with other entries.
- Analysis `lab/port/analyse-gdir.js`, committed with this file.

## Floor (executed first)
- A run counts if its final sample is at 1,500 s, is marked final, has no universe missed, and every sample reads `gdir` 0 (SHIP) or
  1 (GDIR) with `crowdK 100, storeDeath 1, provBirth 0, aim 0`. A failed switch check makes the experiment INCONCLUSIVE.
- **Fewer than 6 complete pairs: INCONCLUSIVE.**

## Rule
- **Primary:** one-sided exact Wilcoxon signed-rank on `log(F_gdir / F_ship)` at 1,500 s over complete pairs.
- **BETTER:** GDIR greater at p < 0.05. **WORSE:** less at p < 0.05.
- **Depth guard:** BETTER ships only if GDIR found more functions of size 17+ than SHIP in more than half of the complete pairs.
- Reported, not ruled on: the ratio at 5, 10, 15, 20 minutes; size 17+; depth of what was new in the last 5 minutes; ticks; alive.

## Verdict
- **BETTER and the guard holds: ship.** Under TASKS the default becomes `TASK_GDIR` 1; `TASK_GDIR=0` restores today's world byte for
  byte. Acceptance before `main`: `substrate-test` at four budgets and `smoke.sh`.
- **BETTER without the guard:** held. **WORSE or neither:** the knob is removed.

## Prediction (mine, before any decision run)
BETTER, 7 of 8, median about 1.25. The seen pair's 1.42 is one draw and design readings have overstated every time (#416: 1.68 seen,
1.26 ruled).

## What this cannot say
Anything past 25 minutes; the shuffle control (whether the gain is selected); a phone.

## Saved worlds (rule 6)
Nothing saved changes: the ground is read differently, not stored differently.

## AMENDMENT (before decision pair 2; after pair 1 only)
#438 shipped between pair 1 and pair 2: under TASKS a universe now opens its own inputs. The registered SHIP arm (commit 5e43da6)
is no longer the world a viewer gets, so a verdict against it would decide a default for a world that is gone.
- **Both arms move to commit 909e672** (today's `main`): SHIP is its `engine.html`, GDIR the same file with `TASK_GDIR`'s default 1.
- **Pair 1 (1.66x, size 17+ 2.76x, against the old world) is reported and NOT counted.** Eight fresh pairs, tags p2-p9, decide.
- The rule, floor, guard and verdicts are unchanged. The depth guard's size is the engine's own grade as each field reports it; past
  five inputs it is a loose bound, the same in both arms.
- Reason for the change is the ship, not pair 1's number, which favoured the arm.
