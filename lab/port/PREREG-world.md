# PREREG #396: a field universe's world is not its frame (`#world=920`)

Written before any decision run. Design is in `lab/port/out-phase/` and `lab/port/out-world-design/` (one field each, seen).

## What was found
- The engine's world is its canvas. In node that is 1280x720. In the default field on a 412x915 screen every universe's world is
  137x304 (read off the engine by `field-phase.js`): a twentieth of the area, for the same 700-1,700 creatures.
- There, a tick averages 119-123 ms (about 35 in node), the workers are 98% busy inside it, and the two pair loops take 76% of it
  (`processGrid` 49%, `applyEntropy` 27%). That is why #395's cheaper VM gave a field nothing (#395b).
- Every node result since #350 was measured in a world twenty times sparser than the one a viewer runs.

## The change
`index.html#world=K` passes `?world=K` to every universe frame. `universe.html` then sizes the drawing buffer to at least K thousand
square pixels at the frame's aspect; CSS draws it scaled down and pointers are scaled up. Unset or 0 is today's 1:1 buffer exactly.
K = 920 is node's 1280x720 area.

## Design reading (one field each, run together, 600 s; not a decision)
| | F at 1, 5, 10 min | Ticks at 10 min |
|---|---|---|
| default | 5,823 / 10,941 / 15,458 | 6,634 |
| world=230 | 686 / 6,001 / 14,087 | 15,037 |
| world=920 | 303 / 6,420 / 16,106 | 18,221 |

The dense world finds a great deal in its first minute and then slows (about 900 a minute by minute 10). The large world starts
slowly and was finding 2,700 a minute at minute 10.

## Rule
- **Arms:** today's field against `#world=920`, same engine, two fields run together (`lab/port/world-batch.sh`), 8 pairs.
- **Horizon: 1,500 s**, not #383's 1,800, because a launch must end inside the 30-minute limit on a background job. Sampled every 60 s.
- **Measure:** F, distinct functions ever paid anywhere in the field (`field-rate.js`).
- **Switch check:** `field-phase.js` reads each universe's world size; a WORLD field's must be at least 900 thousand square pixels
  and a default field's under 100 (checked once per arm, before the pairs).
- **Floor:** at least 6 complete pairs (both fields reach the final sample, no universe unreadable in it).
- **Primary:** exact one-sided Wilcoxon signed-rank on log(F_world / F_default) at 1,500 s. BETTER if p(greater) <= 0.05; WORSE if
  p(less) <= 0.05.
- **Reported beside it:** the F ratio at 5, 10 and 15 minutes (the design says the large world is BEHIND early), ticks, creatures
  alive, the longest read, and memory if read.

## Verdict
- BETTER: **ship.** The field's default becomes `world=920`; `#world=0` restores today's field. `universe.html` opened alone is unchanged.
- Not BETTER: the default does not move. The option stays, off, as a rig control (a field in node's regime); it is not a mechanism
  of the world.
- WORSE: the same, written up.
- Claimed only at the rung measured: a 412x915 field, 25 minutes. A desktop field's cells are larger, so the effect there is smaller.

## What ships with it if it ships
- **The look changes**: creatures draw smaller and sparser in each cell (`lab/port/shots/396-*.png`).
- **The first minutes are slower** (design: 303 against 5,823 functions at one minute).
- **Saved worlds (rule 6):** a reloaded universe's creatures come back at their saved positions, which lie in the top-left
  twentieth of the larger world, and spread from there.
- Acceptance: `slot-test`, `layers-test`, `pool-test`, `collective-test` and the rest of `smoke.sh` on the shipped default.

## Prediction
BETTER at 25 minutes: 7 of 8, median ratio about 1.5. Behind at 5 minutes in most pairs.
