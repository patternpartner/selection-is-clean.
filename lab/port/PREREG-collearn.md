# PRE-REGISTRATION #447 — the collective is the one universe that learns (`#collearn`)

Written and committed before any field ran with it beyond an 80-second check that the switch reaches the right universe.

## Why
- Under TASKS no universe's mind learns (#431: the same rewrite drawn at random found 1.29x, 5 of 6 pairs, at 25 minutes). Over hours
  the two long pairs disagree about a learner (#433, #434).
- The user's proposal: the collective already gathers what survived in eight worlds, so let it be the ONE universe whose mind
  learns. Never tested: every earlier test switched every universe at once.
- **This is the user's design, so the question is whether it costs the field anything**, not whether it wins. A not-worse test.

## Arms (the same `engine.html`, `index.html` and `sim.worker.js` in both; nothing is edited while the set runs)
- **SHIP:** the field with no hash.
- **COLLEARN:** the field opened with `#collearn`: the collective's hash carries `mindmode=learn`, every other universe is unchanged.

## Runs
6 pairs (p1-p6), both fields together and ALONE on the machine (#437: pairs with other jobs beside them read differently), 1,500 s,
`lab/port/collearn-batch.sh`, analysis `lab/port/analyse-collearn.js`.

## Floor (executed first)
A run counts if its final sample is at 1,500 s, final, with no universe missed, the economy switches as shipped, and the final
sample counts exactly ONE learning mind in COLLEARN and NONE in SHIP. Fewer than 5 complete pairs: INCONCLUSIVE.

## Rule
- Primary: exact Wilcoxon on `log(F_collearn / F_ship)` at 1,500 s.
- **WORSE** (collearn less at p < 0.05): stays opt-in.
- **NOT WORSE and both guards hold** (median count ratio at least 0.95; median ratio of functions of size 17+ at least 0.90): the
  collective learns by default (`#mindmode=draw` on the field would restore today's). BETTER is reported if p(greater) < 0.05.
- **NOT WORSE but a guard fails:** stays opt-in.

## Prediction (mine)
Not worse, guards hold, median about 1.00: one universe in 27 to 31 learning should not move a field-wide number at 25 minutes.
That is also the weakness of the test, said now: it can show the option is harmless; it cannot show the collective's learning is
worth anything. That would take reading the collective itself, over hours.

## What this cannot say
Anything past 25 minutes (the horizon at which a learner looked better in #433); the user's phone (18 universes, not 27-31).
