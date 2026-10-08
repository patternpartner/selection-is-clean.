# Looked At: does a taste for the neglected evolve? (pre-registered, written before any decision run)

Two new heritable genes, behind `opts.care` (off = the old world, byte-identical draws):
- `care` in [-1,1]: adds `care * neglect(q)` to a pair's score for candidate q, neglect = clamp(1 - q.attEma/2, 0, 1),
  attEma = the candidate's own attention received, smoothed over ~50 ticks. Positive care = looks at who nobody is looking at.
- `mutual` in [-1,1]: adds `mutual * (q is looking at me)`. Positive = looks back at whoever looks at it.
Founders draw both uniformly in [-1,1] (mean ~0). Mutation as the other tastes (sd 0.12).
No payoff is attached to `care` by hand. If it is ever favoured it is because looking at the neglected is looked back at
(`mutual`), which is attention, which is food.

Arms, per seed: SELECT (the real rules) and three NULL replicates (`neutral`: fixed random luck per creature, same total
attention, unrelated to anything it does; each replicate a different draw order, `shift` 1..3). 24,000 ticks.
Seeds: 201-206, never looked at before. Counted seed = the world survived (alive > 20 at the end), reported first.

Dependent variables: (1) mean `care` at 24,000 ticks; (2) establishment of strangers (a descendant alive 1,500 ticks after
arrival), no visitor in any arm.
Rule, fixed here:
- CARE EVOLVES: on >= 4 of 6 seeds, SELECT's mean care exceeds the maximum of its three nulls by more than 0.10.
- CARE HELPS NEWCOMERS (BETTER): on >= 4 of 6 seeds, SELECT's establishment exceeds the maximum of its three nulls by more than
  3 percentage points. WORSE: below the minimum of the nulls by more than 3 points on >= 4 of 6.
- Anything else on either measure: no effect shown, and the film says nothing about care.
- Fewer than 4 counted seeds: INCONCLUSIVE.
What the film does with it is fixed too: if CARE EVOLVES and HELPS, the third act (a pair that was once looked at turns to a
newcomer by itself) is shot in a world aged with care on, and says so. If not, the third act is the honest one: nobody looks
unless somebody does, and the film ends on the empty gaze.
