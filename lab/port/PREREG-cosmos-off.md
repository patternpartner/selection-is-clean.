# PRE-REGISTRATION #423 — does a TASKS field miss the cosmos? A "not worse" test to switch it off, with guards against a weak test

Written and committed before any decision run. Browser fields are unseeded, so every pair below is a fresh draw nobody has seen.

## Why
- **The cosmos** (`__COSMOS`, #59-#67, in the LIVE table): clusters that can afford the price found daughter worlds carrying
  perturbed copies of the lineage. It is one of the largest layers in the engine.
- **#410 (Fable, design):** of six layers switched off inside one field, the cosmos was the only one not missed (1.47 and 0.90 of
  control, 1.21 over both runs). In a pair of whole fields, one arm each, at K=450: 83,082 with it off against 79,931 (1.04), ticks
  +5%, functions of size 17+ 0.93. Fable queued "a pre-registered not-worse test of its own".
- **It runs in TASKS worlds:** a node TASKS world (seed 3, 1,500 ticks) is `6cbe0c0d` with it and `af8a1514` with `COSMOS=0`.
- **CLAUDE.md asks every session to remove or prove something.** A layer that a field does not miss is decoration for the number
  this artwork is judged on.
- **The danger in a "not worse" test** is that six pairs cannot see a modest harm, so failing to find one could remove something
  useful. The guards below are there for that.

## Arms
- **SHIP:** `engine.html` as on the branch (cosmos on, K=100).
- **OFF:** the same file with `const LIVE={ __COSMOS:1,` changed to `const LIVE={ __COSMOS:0,` (`field-pair.sh` asserts the pattern
  occurs once and the copy differs). The LIVE table fills only unset globals, and `cosmosOn()` reads `__COSMOS`.
- Every other file is today's.

## Runs
- **6 pairs**, tags p1-p6, a SHIP field and an OFF field launched together (`lab/port/cosmos-off-batch.sh`, out
  `lab/port/out-cosmos-decide/`), 1,500 s, sampled every 60 s, one pair a launch, nothing else on the machine.
- Analysis `lab/port/analyse-cosmos-off.js`, committed with this file.

## Floor
- A run counts if its final sample is at 1,500 s, marked final, with no universe missed (`bad` 0), and its switches read
  `storeDeath 1, crowdK 100, provBirth 0, aim 0`. A failed switch check makes the experiment INCONCLUSIVE until the rig is fixed.
- **Fewer than 5 complete pairs: INCONCLUSIVE.**

## Rule
- **Primary:** a one-sided exact Wilcoxon signed-rank on `log(F_off / F_ship)` at 1,500 s over complete pairs.
- **WORSE** (off less, p < 0.05): the field misses the cosmos. **It stays on.**
- **Otherwise the cosmos goes off under TASKS only if both guards hold:**
  - the median of `F_off / F_ship` is at least **0.95**;
  - the median of the size-17+ ratio (the sum of `D.ge17` over samples) is at least **0.90**.
- If a guard fails without WORSE: **INCONCLUSIVE**, and the cosmos stays on. A weak test does not remove a layer.
- **BETTER** (off greater, p < 0.05) is reported if it happens; the verdict is the same as passing the guards.
- **Reported:** the ratio at 5, 10, 15 and 20 minutes; size 17+; ticks; creatures; universes under 20 creatures at the end.

## Verdict
- **Switched off:** the TASKS default fill line sets `__COSMOS` 0 (unset globals only, so `COSMOS=1` restores it byte for byte).
  The code stays, since worlds without TASKS still run it: DORMANT under TASKS, named as such in the engine. Acceptance:
  `substrate-test` at four budgets and `smoke.sh` before `main`.
- **Stays on:** no change, with the numbers recorded.

## Prediction (mine, before any run; I am 6 for 12)
Not worse, and neither direction: median about 1.03, size 17+ about 0.95, so it switches off. The risk I see is the guard on
depth: #410's pair read 0.93 on size 17+, close to the line.

## Saved worlds (rule 6)
If it switches off, a reloaded TASKS universe stops founding daughter worlds. Any daughter worlds already in its save stay as
stored data. Said here; it does not block.

## Amendment, made after pair 1 and before pair 2 (the rule is unchanged)
- **The test paused after pair 1 for #424** (the tournament, the user's "let the system decide"), and resumes with pairs 2-6.
- **The engine changed in between, and the world did not.** #424 added four opt-in switches (`MOTIF_SELECT`, `REPL_PREY`,
  `TASK_DRAIN`, `FOUND` read `!__mechOff.X` at their gates) and a `tourney` latch. Without `#tourney` or `#prune` nothing sets a
  switch: the TASKS default digest is `6cbe0c0d` and TASKS off `b07a4474`, as before. So SHIP and OFF are the arms registered.
- **Pair 1 has been seen only as complete** (its `.done` and that both runs ended final); its numbers have not been read.
