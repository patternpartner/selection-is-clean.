# Does #337 survive CLEAN words? Three inputs, STRICT vs CONTROL, with payment only for words that do not depend on junk (#339; written and COMMITTED before the first decision run)

22 Oct 2026. Asked for by the user after #338. Code:
- core: `lab/oee-core-tasks.js` with `CLEAN:1`. With CLEAN unset it is byte-identical to #337's core, and so is NIN=4 to #338's;
- batch: `lab/tasks2-batch.sh` with `SEEDS="7401 7402 7403" XOPTS=',"CLEAN":1'`;
- analysis: `lab/analyse-strict.js`, its #337 lines.

## Why
#338's four-input world was NOT REPLICATED, but it differed from #337's in two ways besides input count:
- the half-per-truth-table draw;
- a clean-word rule.

This run keeps #337's world exactly (three inputs, its draw, its arms, its rule) and adds only CLEAN.

## The rule (CLEAN=1, both arms; bit-exact)
**Two masks per register.** Each register carries:
- the bits that depend on JUNK: a word made by anything but NAND and copies, or an earlier epoch's inputs;
- the bits that depend on this epoch's inputs.

**How the masks move.**
- **INPUT:** clean, every bit input-dependent.
- **READ_OTHER:** the maker's masks.
- **NAND:** a bit forced to 1 by a clean 0 in either operand depends only on that 0. Any other bit depends on both operands.
- **GET and MOV:** copy the masks.
- **The constants 0 and all-ones:** clean.
- **Anything else** (a sensor, other LOADK values, ADD, SUB, MUL, RAND): every bit is junk.
- **At each epoch boundary:** every input-dependent bit becomes junk.

**Payment.** An output is paid only if no bit depends on junk.

**Checks.**
- An exhaustive single-bit check finds the junk mark agrees with whether the output can change, in every case.
- Hand-built organisms: NAND(x1,x2) and NOT x2 through an all-ones register are paid. ADD, a sensor word, and last epoch's NOT x1 are refused.
- CLEAN=2 (count only) leaves the trajectory identical to CLEAN unset.
- CLEAN=1 resumes exactly.

**The first version was wrong.** It used one flag per register. It marked the accumulator R1 = NAND(read, R1) unclean forever, though junk survives only where the read word is 1. Its input mask also dropped the dependence of a bit forced by two clean zeros.

## What the rule found in #337's own worlds (exploratory; the saves at 1,200,000 ticks; CLEAN=2 bookkeeping; NOT evidence)

| | income depending on junk | income at circuit 5+ that is clean |
|---|---|---|
| STRICT | 34-50% | 34-47% (63,000-148,000 per 10,000 ticks) |
| CONTROL | 4-8% | 0-6% (0-781 per 10,000 ticks) |

STRICT's commonest junk-carrying program is an accumulator: READ, then NAND with R1, then MOV the result back to R1. That gates a fresh read against a register built from earlier reads, two reads that come from different epochs.

## Arms and runs
- **STRICT:** TASKS=1, TASK_RATE 0.2, TASK_SCALE 1, OTHERS=1, REFUSE_NOT=1, DEPTH=1, CLEAN=1.
- **CONTROL:** the same with OTHERS=2 and REFUSE_NOT=0.

Seeds **7401, 7402, 7403** have never been run. Each world runs 1,200,000 ticks, EVERY=1000, in 150,000-tick chunks.

## Step 1 - executed first
As #337. A seed counts if both its worlds finished and its STRICT world's READ_OTHER hit in at least 1% of reads over the second half. Fewer than 3 counted seeds is INCONCLUSIVE.

## Ruling measures (exactly #337's)
- **A. SUSTAINED HARDNESS.**
  - Measure: the median, over windows 21-40, of each window's hardest active function by exact NAND circuit size.
  - A seed passes if STRICT is at least 5 and at least CONTROL + 2.
  - Rule A holds on at least 2 of 3 seeds.
- **B. BREADTH.** STRICT has more functions ever active than CONTROL, on at least 2 of 3 seeds.

## Verdict
The script prints CONFIRMED / HARDER, NOT BROADER / NOT CONFIRMED. Read them as:
- **SURVIVES CLEAN WORDS (CONFIRMED):** A and B hold. #337's lift is real boolean composition. #338's null is then about the input count, or the four-input draw, not about junk.
- **HARDER, NOT BROADER:** A holds, B fails.
- **DOES NOT SURVIVE (NOT CONFIRMED):** A fails. #337's lift leaned on words that depend on junk.

Reported, ruling on nothing:
- per-window circuit and formula hardest values;
- ever active;
- unclean outputs refused (ev.dirty);
- read hits, copies and complements refused;
- population.

## Prediction written before running
**SURVIVES CLEAN WORDS**, with moderate confidence. In #337's worlds STRICT already had clean income at circuit 5+, of about 63,000-148,000 per 10,000 ticks, against CONTROL's 0-781. My worry is that a world which can no longer pay junk-built accumulators may never build the clean ones that depend on them.

## What this cannot say
- This is three seeds at one horizon. If the rule is passed, it says nothing yet about why four inputs failed: the half-per-truth-table draw and the input count are still together in #338.
- The clean rule is stricter than any earlier world's, so both arms may start later.
