# One payment per EPOCH, not per life (#344; written and COMMITTED before the first decision run)

23 Oct 2026. Fix 1 of two, asked for by the user after #343. Code:
- core: `lab/oee-core-tasks.js` with `TASK_EPAY:1`. With it unset, every earlier world is byte-identical (#340, #341 and #337 checked, seed 5);
- batch: `ARM1='"TASK_EPAY":1' lab/tasks6-batch.sh`;
- analysis: `lab/analyse-epay.js`, after `lab/probe-leak.js` and `lab/probe-twowire.js` have run on each world's last save (WARM 2000, TICKS 5000).

## Why
**#343 found two leaks.** Measured on #341's saves:
- 68-79% of second distinct reads happen after the organism's ONE life payment (TASK_MAX 1) is spent, 66-69% of them in an earlier epoch of the same life;
- 73-83% of outputs after two distinct reads depend on only one read word, because READ writes R0.

This run removes the first leak only. Fix 2, READ to a chosen register, is planned to stack on top of it.

## The change (TASK_EPAY=1; four inputs only)
**The slot.** The TASK_MAX payment slot is reset when an organism outputs in a new epoch. An organism can then be paid again, for any function including one it was paid for before: the inputs were redrawn, so it is a new computation.

**Unchanged:** within an epoch a life is paid for at most TASK_MAX (1) function. That is #290's guard against one short loop collecting every function.

**Hand-built check.** The same NAND(x1,x2) program run in 3 epochs is paid in each with TASK_EPAY=1, and only in the first without it. The run resumes exactly.

**Energy.** This lets more payments happen, and every function's pool regrows at the same rate. So pools run lower and each payment is smaller. That is part of the world being tested, not a confound to remove.

## Arms and runs
Both arms are #340's STRICT world (TASKS=1, TASK_RATE 0.2, TASK_SCALE 1, OTHERS=1, REFUSE_NOT=1, DEPTH=1, NIN=4, CLEAN=1), with READ_DIR off.
- **EPAY:** TASK_EPAY=1.
- **STRICT:** unchanged.

Seeds **7701, 7702, 7703** have never been run. Each world runs 1,200,000 ticks in 150,000-tick chunks.

## Step 1 - executed first
As #341. A seed counts if all of these hold:
- both worlds finished;
- both arms' reads hit at least 1% over the second half;
- one of the two worlds started by window 20.

Fewer than 3 counted seeds is INCONCLUSIVE.

## Manipulation check (M)
- **Measure:** `probe-leak`'s share of second distinct reads made with the slot already spent.
- **M holds** if EPAY's share is at least 20 points below STRICT's on at least 2 of 3 seeds.
- **If M fails, the verdict is NOT APPLIED.**

## Outcomes
- **TWO-READ (the mechanism's purpose).** The share of all income paid for clean outputs fed by 2+ distinct reads from this epoch (`probe-twowire`) is higher in EPAY on at least 2 of 3 seeds.
- **A. HARDER.** The sustained median circuit size (windows 21-40; 10+ counts as 10; formula size if both medians are at the cap) is at least 1 gate above STRICT's on at least 2 of 3 seeds, and below it on none. The margin is #341's, for the same reason: STRICT sat at exactly 6 on all 9 seeds of #339-#341.
- **B. BROADER, C. LATE NOVELTY, D. NO DECELERATION:** as #341.

## Verdict
- **NOT APPLIED:** M fails.
- **NO CHANGE:** M holds, and neither TWO-READ nor A holds.
- **MORE TWO-READ, NOT HARDER:** M and TWO-READ hold, A fails.
- **HARDER** (with ", WITH MORE TWO-READ" and/or ", AND BROADER" appended when those hold): M and A hold.
- **OPENS:** M, A, C and D hold.

Reported, ruling on nothing:
- both probes' full tables;
- the gain readout;
- per-window hardest values and the hardest function;
- ever active by circuit size;
- population and task income.

## Prediction written before running
**MORE TWO-READ, NOT HARDER**, with low confidence. The user put the reason before the run: the leaks are stages of one pipeline. With the R0 overwrite still in place, about 3 in 4 outputs after two reads still use one word. And an output made within an epoch before the second read still takes that epoch's slot. So two-read income should rise a little, and sustained hardness should not move.

## What this cannot say
- This is three seeds at one horizon.
- Per-epoch payment also changes what single-read programs earn: they are paid every epoch now. So any change in hardness or breadth may come from the income shift, not from two-read composition. TWO-READ is the readout that ties a change to the mechanism.
