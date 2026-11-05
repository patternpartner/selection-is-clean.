# PRE-REGISTRATION #382 — a one-currency world held to a smaller population by the price of a birth, judged per CPU-HOUR and in a field (`PROV_BIRTH=0 STORE_DEATH=1 AIM=0 REPL_CROWD_K=450`)

Written and committed before any decision run. Seeds 11501-11520 have never been run by anyone.

## Why
- **#381's one-currency world won its per-tick test**: about twice the new functions, p 0.0004, and selected. **Its ship was held at
  acceptance:**
  - it sits near the array cap (about 1,700 alive), so a tick costs 1.6-2.5x more;
  - about even per CPU-hour;
  - in a field `slot-test` saw 2 of 9 universes save in 450 s, where today's world gets most of them there in 150.
- The named condition for shipping: a smaller one-currency world, judged per CPU-hour and checked in a field.
- **Design** (seeds 10401/10402, seen, 4,000 ticks, arms run concurrently, CPU timed; `lab/port/out-cap-design/`):
  - **Less sunlight does not shrink it** (`TASK_SUNP=10`: still about 1,700). Income comes from 65,536 per-function pools, so
    crowding barely lowers income per head.
  - **A dearer fixed birth is BISTABLE:**
    - at 0.25 the world fills the array;
    - at 0.30-0.35 some worlds fill it and others die near 100;
    - at 0.5-0.8 every world dies.

    A fixed price has no equilibrium between.
  - **A density-dependent price** (`REPL_CROWD_K=K`, new, byte-identical unset: the price of a birth is `BIRTH_ENERGY_COST x
    living/K`, the same for every parent at that moment) gives one. New functions per CPU-hour, against the old world's 25,916 and
    24,958:

    | K | Seed 10401 | Seed 10402 | Population |
    |---|---|---|---|
    | 900 | 23,450 | 14,646 | still at the cap |
    | 600 | 31,274 | 24,372 | regulated on 10401 only |
    | **450** | **42,407** | **38,559** | regulated on both: 400-1,250 and 350-760 |
    | 300 | 43,708 | 28,609 | too tight on 10402 (about 350) |

    **K = 450 is chosen.** Per tick it was 2.1x and 0.67x of the old world.

## Runs
- **20 pairs:** seeds 11501-11520, each run once as OLD (today's TASKS world) and once as CROWD (`PROV_BIRTH=0 STORE_DEATH=1 AIM=0
  REPL_CROWD_K=450`), both reseeded after tick 1 with stream 1.
- **Reported, not ruled on:** CROWD with `TASK_SHUFFLE=1` on 11501-11503.
- `TASKS=1`, 12,000 ticks.
- **CPU seconds per run** come from bash's `time` (user + sys). The batch starts a pair's two arms together, so they share the
  machine's contention.
- Batch `lab/port/crowd-batch.sh`, out `lab/port/out-crowd/`, analysis `lab/port/analyse-crowd.js`, written before the runs finish.

## Measures (per world)
- **R:** new functions per CPU-hour (V over CPU hours).
- **V:** new functions in 12,000 ticks.
- Reported: alive (mean), collapse, CPU minutes.

## Floor
- Fewer than 15 complete pairs: INCONCLUSIVE.
- A CROWD world must show 0 aim pulls and 0 unprovisioned refusals (the switch check), or the experiment is INCONCLUSIVE until the
  rig is fixed.

## Rule
- **Primary:** a one-sided exact Wilcoxon signed-rank on `log(R_crowd / R_old)` over complete pairs.
- **BETTER:** CROWD greater at p < 0.05. **WORSE:** CROWD less at p < 0.05.
- **Guard:** if the median of `V_crowd / V_old` is under 0.5, BETTER does not ship. A world that is merely cheap and empty is not
  the point.
- Reported: the same test on V (per tick), collapse, the shuffle arm.

## Verdict
- **BETTER, and the guard holds:** the default flips wherever TASKS runs: `PROV_BIRTH` 0, `STORE_DEATH` 1, `AIM` 0, `REPL_CROWD_K`
  450 (unset globals only). It ships **only if the field check passes on a quiet machine:** `slot-test` with every row green, run
  alone if `smoke.sh` is red. Then `substrate-test` x4 and `smoke.sh` before `main`. If the field check fails, the ship is held
  again, with the reason recorded.
- **WORSE:** no change; `REPL_CROWD_K` is deleted.
- **Anything else:** no change; the knobs stay.

## Prediction (mine, before any run; I am 1 for 7)
BETTER. Both design seeds were about 1.6x per CPU-hour with the population regulated. The risk I see: the per-tick result was mixed
(0.67x on 10402), so on fresh seeds the smaller world may simply find less, and the guard may bite.

## Saved worlds (rule 6)
If it ships, a reloaded TASKS universe runs under one currency with a density-dependent birth price. A restored population above
about 450 alive faces a dearer birth until it settles. Said here; it does not block.
