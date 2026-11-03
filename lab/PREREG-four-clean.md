# Four inputs with the BIT-EXACT clean rule: was #338's null the crude per-register rule? (#340; written and COMMITTED before the first decision run)

23 Oct 2026. Asked for by the user after #339. Code:
- core: `lab/oee-core-tasks.js` with `NIN:4, CLEAN:1`. With CLEAN unset, NIN 4 is byte-identical to #338's core, and #337 and #339 reproduce too;
- batch: `lab/tasks4-batch.sh` with `SEEDS="7501 7502 7503" XOPTS=',"CLEAN":1'`;
- analysis: `SEEDS=7501,7502,7503 node lab/analyse-four.js lab/out-four-clean`.

## Why
#338 (four inputs) was NOT REPLICATED. #339 then showed #337's three-input lift survives a clean-word rule.

But #338 ran under the FIRST clean rule: one flag per register. That rule:
- marked every register's starting zero as junk;
- could not let a clean 0 in NAND wash junk out, so an accumulator R1=NAND(read,R1) stayed unclean for life.

#339 used the bit-exact rule. So #338's null has three suspects: the input count, the half-per-truth-table draw, and the crude rule. This run changes ONLY the rule.

## The world
Exactly #338's world: four inputs, each 16-bit half a whole truth table in its own order, 65,536 functions, exact grading tables, both arms, and TASK_MAX 1. The one change: an output is paid only if no bit depends on junk, tracked bit-exactly as in #339 (`lab/PREREG-clean3.md`).

Hand-built organisms at four inputs, against the new rule:

| organism | result |
|---|---|
| NAND(x1,x2) | paid |
| NOT x2 through a register that started at zero | paid (#338 refused it) |
| ADD | refused |
| a sensor word gated with an input | refused |
| last epoch's NAND(x1,x2) output this epoch | refused |

The run resumes exactly.

## What #338's worlds already show (reported, not ruled)
Functions ever active, by exact circuit size, at 1 / 2 / 3 / 4 / 5 / 6+ gates:

| | at 1 / 2 / 3 / 4 / 5 / 6+ gates | share of the 137 functions of 3 gates or fewer |
|---|---|---|
| STRICT | 8-10 / 18-20 / 14-29 / 4-9 / 0-1 / 1 | 31-42% |
| CONTROL | 7-9 / 20-25 / 17-24 / 4-9 / 0 / 0 | 32-41% |

At three inputs (#339), STRICT used 65-72% of the 43 easy functions and still climbed: 13 at 4 gates, 9 at 5, 1-2 at 6+.

## Arms and runs
- **STRICT:** TASKS=1, TASK_RATE 0.2, TASK_SCALE 1, OTHERS=1, REFUSE_NOT=1, DEPTH=1, NIN=4, CLEAN=1.
- **CONTROL:** the same with OTHERS=2 and REFUSE_NOT=0.

Seeds **7501, 7502, 7503** have never been run. Each world runs 1,200,000 ticks, EVERY=1000, in 150,000-tick chunks.

## Step 1, and the rules: exactly #338's (`lab/PREREG-four.md`)
**A seed counts if:**
- both its worlds finished;
- STRICT's reads hit in at least 1% of the second half;
- one of its two worlds started by window 20.

Fewer than 3 counted seeds is INCONCLUSIVE.

**The rules:**
- **A. Sustained hardness.** The median, over windows 21-40, of each window's hardest active circuit size (10+ counts as 10). STRICT must be at least CONTROL + 2, or, if both medians are at the cap, formula at least CONTROL + 2. Rule A holds on at least 2 of 3 seeds.
- **B. Breadth.** STRICT has more functions ever active than CONTROL, on at least 2 of 3 seeds.
- **C. Late novelty.** STRICT has a new active function in at least 5 of windows 31-40 on at least 2 of 3 seeds, and more such windows than CONTROL, summed over seeds.
- **D. No deceleration.** STRICT's growth over windows 31-40 is at least half its growth over windows 11-20, and above 0, on at least 2 of 3 seeds.

## Verdict, and what it means
- **OPEN-ENDED BY THESE MEASURES / COMPOSITION REPLICATES, PLATEAU STANDS:** rule A holds. #338's null was the crude rule; the input count is not the problem.
- **HARDER, NOT BROADER:** A holds, B fails. Read as the line above for the crude rule.
- **NOT REPLICATED:** A fails. The cause is in the four-input world itself: the input count, the easy-function bucket (137 against 43), or the draw. The three-input balanced-draw check then separates the draw from the rest.

Reported, ruling on nothing:
- per-window hardest values and the identity of the hardest function;
- ever active by circuit size, and the share of the 3-gate-or-fewer bucket used;
- the gain readout CSZ(paid) - CSZ(read);
- refusals;
- population.

`lab/probe-twowire.js` k-shares on the saves are reported if they run at four inputs.

## Prediction written before running
**COMPOSITION REPLICATES, PLATEAU STANDS**, with low confidence.

- **For:** the crude rule handicapped exactly the programs #339 found carrying STRICT's hard income. It also refused any output that touched a register's starting zero.
- **Against:** #339 found 42-91% of STRICT's clean income is single-read, and the crude rule did not hurt single-read programs much. So it may not have been the main cause.

## What this cannot say
Three seeds, one horizon. If rule A fails, it does not separate the input count from the draw from dilution.
