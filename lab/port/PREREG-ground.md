# PREREG #397: the ground remembers (`TASK_GROUND=1`)

Written before any decision run. Design is in `lab/port/out-ground-design/`, `out-null-spread/` and `out-ground-field/` (seen).

## The mechanism
Every word a creature publishes lasts one epoch and every program dies with its lineage, so nothing a world finds outlives the
creatures carrying it. With `TASK_GROUND=1` (five inputs only):
- when a creature is PAID for a function, that function is written, as its canonical truth table, into the field cell (40x40) it
  stands in. It stays until another payment there overwrites it: across epochs and across deaths;
- a READ that finds no live neighbour's word reads the ground of its own cell: the stored function expressed in this epoch's
  row order, clean, keyed to its pool (so the drain applies) and entered in the read record (so publishing it unchanged is
  refused as a copy);
- it draws nothing. Off, the engine is byte-identical (digest `9c51d9bb` on seed 10401 before and after, 800 ticks).

## Design (seen; not a decision)
- **Node could not see it.** Off against three variants on seeds 10401 and 10402, 4,000 ticks: every variant was best on one seed
  and worst on the other. Four continuations of ONE world state from tick 2,000 found 517-1,052 new functions in the next 2,000
  ticks. A world's count is too noisy for a two-seed design.
- **A field could** (31 universes, 1,500 s, two fields together, F = distinct functions paid anywhere in the field):

  | Variant | F today | F with ground | Ratio |
  |---|---|---|---|
  | the last payment overwrites (this rule) | 59,164 | 111,312 | 1.88 |
  | the deepest function stays | 63,866 | 98,700 | 1.55 |
  | only what was built upon replaces | 64,867 | 101,208 | 1.56 |

  For scale, #396's eight fields of today's engine ranged 53,753-69,155.
- The two selecting variants did no better than the plain one and were removed before this was written. So the design does NOT
  support "what stays is chosen by what is built on it"; it supports "something stays".

## Rule
- **Arms:** today's engine against the same engine with `TASK_GROUND`'s default set to 1 (a copy made by `sed`, pattern count
  asserted), two fields run together, 8 pairs, 1,500 s, sampled every 60 s (`lab/port/ground-batch.sh`).
- **Measure:** F at 1,500 s.
- **Floor:** at least 6 complete pairs.
- **Primary:** exact one-sided Wilcoxon signed-rank on log(F_ground / F_today). BETTER if p(greater) <= 0.05; WORSE if p(less) <= 0.05.
- **Selected, or just more shelf?** A ground makes more functions reachable, and part of any count gain is that alone. So one more
  pair: GROUND against GROUND with `TASK_SHUFFLE=1` (every payment goes to a random living creature). The gain counts as selected
  only if the shuffled field finds less than half of its twin.
- **Reported:** F ratio at 5, 10, 15 minutes; ticks; creatures alive; the longest read.

## Verdict
- BETTER and selected: **ship** (`TASK_GROUND` 1 wherever TASKS runs at five inputs; `TASK_GROUND=0` restores today's world byte for byte).
- BETTER but the shuffled field finds half or more: no ship. The count would be the shelf, not the world.
- Not BETTER: the default does not move and the knob is removed.
- Claimed only at the rung measured: a 412x915 field, 25 minutes.

## Saved worlds (rule 6)
The ground is not in the population snapshot. A reloaded universe starts with empty ground and refills it as it is paid.

## Prediction
BETTER, 8 of 8, median ratio about 1.6 (the design's 1.88 was one pair). Selected: the shuffled field under a fifth of its twin.
