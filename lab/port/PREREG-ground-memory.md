# PREREG #398: is it memory? The ground that remembers against a ground that forgets each epoch

Written after ONE seen pair and before any decision run.

## The question
#397 shipped a ground that keeps the last paid function in each cell, and named it memory. It did not separate two things: the
function PERSISTING past its epoch and its writer's death, and reads simply SUCCEEDING more often. `TASK_GROUND=2` is the control:
a cell answers only with a function written in the current epoch (50 ticks). Same cells, same read path, no memory beyond that.

## The seen pair (design)
Two fields together, 1,500 s: remembering 93,153, forgetting 80,900 (0.87). F at 5, 10, 15, 20 minutes: 8,263 / 24,247 / 46,948 /
70,078 against 15,266 / 33,801 / 52,584 / 68,001. The forgetting ground was ahead early and behind from 20 minutes. For scale,
#397's eight no-ground fields ranged 51,455-81,841 and its eight remembering fields 75,930-128,120. One pair of fields varies by
about 15%, so 0.87 decides nothing.

## Rule
- **Arms:** the shipped engine against a copy with `TASK_GROUND` 2 (`lab/port/ground-control.sh MODE=2`), two fields together,
  6 new pairs (tags p1-p6), 1,500 s, sampled every 60 s.
- **Floor:** 5 complete pairs.
- **Primary:** exact one-sided Wilcoxon signed-rank on log(F_remember / F_forget) at 1,500 s.
  - p(greater) <= 0.05: **MEMORY.** Persistence past an epoch adds to what a field finds. #397's name stands.
  - Otherwise: **NOT SHOWN.** What shipped is better described as "the ground answers"; CLAUDE.md and the engine comment are
    corrected to say so, and saving the ground across reloads is not worth building on this evidence.
  - p(less) <= 0.05: forgetting is BETTER, and it becomes a candidate default with its own pre-registration.
- **Reported:** the ratio at 5, 10, 15, 20 minutes (the seen pair crossed at about 20), ticks, creatures.
- Nothing ships from this rule. It decides a name and the next piece of work.

## Prediction
NOT SHOWN at 25 minutes: 4 of 6 for remembering, median ratio about 1.1. I expect the late gap to be real but too small for 6 pairs.
