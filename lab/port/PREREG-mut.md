# #354 — PRE-REGISTERED: the reading founder plus un-nested rewiring (`TASK_FOUNDER=1 TASK_MUT=1`). Does take-off become reliable? (committed before any decision run)

Engine at the commit that adds this file. Probe `lab/port/probe-arrivals.js`; the same measures and definitions as
`PREREG-founder.md` (#353).
- **Arrived:** functions that ever earned at least 0.25 in one 500-tick window, by tick 10,000.
- **Took off:** Arrived of at least 500.
- **Crash:** a block with maxAlive above 20, followed by a block with minAlive under 5.

## Design (seeds 9401-9410 only, which may design but not decide)
- #353's NEW took off on 7 of 10 seeds.
- #353b's census: READ is still carried on the stalled seeds, operands had moved, and programs sit at the length cap (insertion shut).
- Design grid on the three stalled seeds (9403, 9404, 9409), arrived by 10,000:
  - TASK_MUT: 1,973 / 3,737 / 5,900, all three took off.
  - TASK_LEAN: 1,992 / 466 / 1,735.
  - Both: 2,191 / 2,305 / 5,869.
- **Caveat recorded before the run:** any knob that draws differently re-rolls the trajectory, and at NEW's 7/10 base rate three re-rolled seeds would all launch by chance about a third of the time. The grid chose the candidate; it is not evidence for it.

`TASK_MUT=1`: at every birth each instruction's src and dst are ALSO redrawn with odds rate × 0.2 each (about 1.2% at rate
0.06). Opcodes are untouched. The nested rate-squared redraws stay as they are.

## Arms, seeds 9501-9510 (never run), 10,000 ticks, `BLOCK=1000`
| arm | knobs |
|---|---|
| OLD | `TASKS=1` (today's default world) |
| NEW | `TASKS=1 TASK_FOUNDER=1` |
| MUT | `TASKS=1 TASK_FOUNDER=1 TASK_MUT=1` |

30 runs. Batch `lab/port/mut-batch.sh`, analysis `lab/port/analyse-mut.js`.

## Rules
- **A. RELIABLE TAKE-OFF:** MUT took off on at least 8 of 10 seeds, AND on at least 3 more than OLD → CONFIRMED.
- **Guard:** MUT crashes on at least 2 more seeds than OLD → WORSE; not shipped.
- **Attribution (reported, not a gate):** MUT's take-off count against NEW's. This says whether the founder alone would have done it on these seeds.

## What follows
- **A CONFIRMED and the guard clear:** `TASK_FOUNDER` and `TASK_MUT` both become 1 by default wherever TASKS runs. Saved universes get the new head on reload through `replEnsureHead`; TASK_MUT is a birth rule and needs nothing saved.
- **Otherwise:** the knobs stay 0. TASK_LEAN is the next candidate, pre-registered again.

## Prediction
A CONFIRMED, about 9/10 against OLD's 3-4/10. Guard clear. MUT at least NEW.
