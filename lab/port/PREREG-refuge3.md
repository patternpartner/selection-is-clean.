# PRE-REGISTRATION #380 — an ADAPTIVE prey refuge, judged over every world it would ship into (`REPL_REFUGE=2`)

Written and committed before any decision run. Seeds 11301-11320 have never been run by anyone.

## Why
- **#379 (20 pairs):** the fixed refuge (`REPL_REFUGE=1`) kept outbreak worlds breeding. Collapse discordance was 6-0 in its
  favour, but its primary test on V stopped at p = 0.052. In the 6 pairs that never had an outbreak it cost about a third of the
  novelty. Over all 20, nothing measurable.
- **The adaptive refuge** (`REPL_REFUGE=2`, committed c66895f; unset byte-identical, mode 1 unchanged) is the follow-up #379
  named:
  - its floor follows a 100-tick moving average of prey events per living creature;
  - at a rate of 0.004 or less it is today's predation, exactly;
  - at 0.012 or more it is the full refuge, and linear between.
- **Design** (six of #379's seen seeds, one stream each; they design this, they do not decide it):

  | Seed | DEF | Fixed refuge | Adaptive |
  |---|---|---|---|
  | 11201 | 9,432 | 2,750 | 9,811 |
  | 11202 | 1,834 (collapsed) | 2,805 | 3,028 |
  | 11209 | 1,800 | 3,025 | 2,105 |
  | 11213 | 1,138 (collapsed) | 4,170 | 3,713 |
  | 11214 | 10,027 | 4,798 | 12,230 |
  | 11215 | 7,451 | 3,362 | 3,260 |

  The adaptive refuge is ahead of DEF on 5 of 6, with a geometric-mean ratio of 1.23. Its floor was raised in 11-22 of the 24
  windows.

## Runs
- **20 pairs:** seeds 11301-11320, each run once as DEF (today's world) and once as ADAPT (`REPL_REFUGE=2`), both reseeded after
  tick 1 with stream 1.
- `TASKS=1`, 12,000 ticks, `DIAG=1`. The probe reports the refuge floor and rate per window and draws nothing.
- Batch `lab/port/refuge3-batch.sh`, out `lab/port/out-refuge3/`, analysis `lab/port/analyse-refuge3.js`, written before the runs
  finish.

## Executed first (per pair)
- A pair COUNTS if its DEF world had at least 1,000 prey events over the run. The adaptive refuge can only act where predation
  happens: 22 of 29 earlier default worlds, and all 20 of #379's.
- **Fewer than 12 counted pairs: INCONCLUSIVE**, the default does not move.
- **This time the counted set is not restricted to outbreak worlds.** If it ships, it ships into every world. #379 showed the cost
  falls exactly on the worlds an outbreak-only test leaves out.

## Rule (on the counted pairs; #379's test, unchanged)
- **Primary:** a one-sided exact Wilcoxon signed-rank on `log(V_adapt / V_def)`, V floored at 1.
- **BETTER:** ADAPT greater at p < 0.05. **WORSE:** ADAPT less at p < 0.05.
- **Guard:** if the median ADAPT alive-late is under half the median DEF alive-late, BETTER does not ship.
- Reported, not ruled on:
  - the same test on the outbreak pairs alone (#379's definition);
  - collapse discordance;
  - the windows in which the floor was raised.

## Verdict
- **BETTER, and the guard holds:** ship. `REPL_REFUGE` defaults to 2 wherever TASKS runs (the browser's default world).
  `REPL_REFUGE=0` restores today's predation and `REPL_REFUGE=1` the fixed refuge. Node's default world, and REPL without TASKS,
  are untouched and byte-identical. Acceptance: `substrate-test` x4 and `smoke.sh` before `main`.
- **WORSE:** delete mode 2. The note stays as the record.
- **Anything else:** mode 2 stays available and off, and the result is recorded as it stands.

## Prediction (mine, before any run; I am 0 for 5)
BETTER. The design is 5 of 6 with a geometric mean of 1.23, on seeds chosen to include the fixed refuge's worst losses. The risk I
see: the floor was raised in most windows even in worlds without an outbreak (11 of 24 on 11201). So it may act more like the fixed
refuge than intended in the healthy worlds of a fresh sample.

## Saved worlds (rule 6)
The refuge is a rule, not a gene. If it ships, a saved TASKS universe that reloads runs with it. Its moving average starts from 0
at each boot, so a reloaded world in an outbreak takes about 100 ticks to raise the floor. Said here; it does not block.
