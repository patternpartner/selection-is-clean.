# PRE-REGISTRATION #383 — the one-currency world held to a size, judged IN A RUNNING FIELD: new functions per real hour, the number a viewer gets

Written and committed before any decision run. A browser field is unseeded (`Math.random` in a page has no seed), so every run
below is a fresh draw that nobody has seen.

## Why
- **#382 held the ship at the field.** `REPL_CROWD_K=450` with one currency (`PROV_BIRTH=0 STORE_DEATH=1 AIM=0`) won per CPU-hour
  (1.62x, p 0.0024) and per tick (2.39x). But `slot-test` saw 0 of 9 universes reach their first save in its 150 s window. The
  named follow-up was a field rig that counts new functions per real hour across a running field.
- **`slot-test` counts saves, not novelty.** A save happens at tick 1,800, so it measures how many ticks a world runs in 150 s.
- **The rig** is `lab/port/field-rate.js`, committed with this file.
  - It opens the default field (`/`, 412x915, a fresh profile, so every universe starts from founders).
  - Every 60 s it reads each universe's lifetime paid-for bitmap (`tSeen`, through a new read-only `__field.seenForTest()`).
  - It ORs every bitmap into one field-wide union.
  - **F(t)** is the number of distinct functions ever paid anywhere in the field by wall time t. A function carried between
    universes by a migrant counts once, and a universe that leaves still counts.
- **Pilot** (seen: one field per engine, 2 minutes each, run alone; it designs this, it does not decide it):

  | Arm | F at ~2 min | Ticks run across the field | Universes | Creatures alive |
  |---|---|---|---|---|
  | OLD | 265 | 21,639 | 31 | 6,294 |
  | CROWD | 2,157 | 8,456 | 31 | 18,238 |

  The built nine ran at about 15 ticks a second under OLD and about 5 under CROWD. The 22 layer and grown universes ran at much
  the same speed in both.

## Arms
- **OLD:** today's `engine.html`.
- **CROWD:** `engine.html` at 1b04adf, the #382 ship. It differs from today's engine only in the TASKS default fill line
  (`PROV_BIRTH 0, STORE_DEATH 1, AIM 0, REPL_CROWD_K 450` when unset) and comments. Served in place of `engine.html` through
  `ENGINE=`; every other file is today's.

## Runs
- **8 pairs.** In each pair an OLD field and a CROWD field are launched together in two browsers, so they share the machine's
  contention. Each runs 1,800 s of wall clock and is sampled every 60 s.
- Nothing else runs on the machine.
- Batch `lab/port/field-batch.sh`, out `lab/port/out-field/`, analysis `lab/port/analyse-field.js`, written before the runs finish.

## Floor (executed first)
- A run is complete if its final sample is at 1,800 s or later, with no page errors and no fatal error.
- Every sample of a CROWD run must read `storeDeath 1, crowdK 450, provBirth 0, aim 0`, and every OLD sample `0, 0, 1, 1`.
  Otherwise the rig is at fault and the experiment is INCONCLUSIVE until it is fixed.
- **Fewer than 6 complete pairs: INCONCLUSIVE.**

## Rule
- **Primary:** a one-sided exact Wilcoxon signed-rank on `log(F_crowd / F_old)` at 1,800 s over complete pairs.
- **BETTER:** CROWD greater at p < 0.05. **WORSE:** CROWD less at p < 0.05.
- Reported, not ruled on:
  - F at 300, 600 and 1,200 s;
  - S, the sum over universes of functions each found since its boot;
  - ticks across the field;
  - creatures alive;
  - universes;
  - **the cost to saving:** the wall time at which 5 of the built nine had passed tick 1,800 (their first autosave), from the
    samples.

## Verdict
- **BETTER: ship.** The TASKS default fill line from 1b04adf goes back in: `PROV_BIRTH` 0, `STORE_DEATH` 1, `AIM` 0,
  `REPL_CROWD_K` 450, unset globals only.
  - Acceptance: `substrate-test` x4 and `smoke.sh` before `main`.
  - **`slot-test`'s warm-up.** Its 150 s window asks how many of nine universes reach tick 1,800, which its own comments call a
    number the machine picks. Under the shipped world that is the save cost measured above, not a storage defect.
  - So its default `WARM` moves to 450 s, where #382 saw it pass 15/0, with the reason in its comment.
  - Every one of its rows must then be green on a quiet machine. The save cost is recorded in the notes as a cost of the ship.
- **WORSE:** no change. `REPL_CROWD_K` is deleted.
- **Anything else:** no change; the knobs stay.

## Prediction (mine, before any run; I am 1 for 8)
BETTER. The pilot is 8x at two minutes, and the per-CPU-hour result (1.62x over 12,000 ticks) says the lead should hold as the
field ages. The risks I see:
- OLD runs three times the ticks in the built nine, so it may close the gap by 30 minutes as the union fills with the
  functions every world finds.
- The two browsers may not share the machine evenly.

## Saved worlds (rule 6)
As in #382: a reloaded TASKS universe would run under one currency with a density-dependent birth price. A restored population
above about 450 faces a dearer birth until it settles. Said here; it does not block.
