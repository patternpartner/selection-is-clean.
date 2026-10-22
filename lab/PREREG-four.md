# FOUR INPUTS: does STRICT composition replicate, and does a 65,536-function space remove the plateau? (#338; written and COMMITTED before the first decision run)

22 Oct 2026. Step 2 of the user's plan after #337 (STRICT CONFIRMED on fresh seeds, three inputs).

Code:
- core: `lab/oee-core-tasks.js` with `NIN:4`; with `NIN` unset it is byte-identical to the #337 core (seed 5, 20,000 ticks);
- batch: `lab/tasks4-batch.sh`;
- analysis: `lab/analyse-four.js`;
- grading tables: `lab/nand4.c` -> `lab/nand4-sz.bin`, `lab/nand4-csz.bin`, loaded by `lab/core-tasks4.js`.

## The world (NIN=4)

**Inputs.**
- There are four world-wide 32-bit inputs, redrawn every 50 ticks.
- Each 16-bit half holds the whole 16-row truth table, in its own random row order. So every row occurs exactly twice, once per half.
- An output names one of 65,536 functions only if both copies of every row agree.
- Constants, the four inputs themselves, and copies or complements of the last four reads are not paid, as in #336.

**Clean words only.**
- An output is paid only if its word was made by logic alone: INPUT, READ_OTHER of a neighbour's clean word, NAND, and register copies (GET, MOV).
- A register that any other op changes (LOADK, ADD, SUB, MUL, a sensor, RAND) is not clean.

**Pools.**
- Each function has its own pool, as in #290: cap TASK_CAP x its four-input NAND formula size, regrowth TASK_RATE 0.2.
- A life is paid for at most one function (TASK_MAX 1).

**Bookkeeping, reported only.** This is the user's suggestion. Each paid output made right after a nonzero read also records the pair (function paid, function of the word read). From it comes the circuit gain the reader added, CSZ(paid) - CSZ(read). That grades the output itself, so a read that was washed out cannot inflate it, as data-flow depth could.

## Why the world has those two rules (found on practice seed 99, before any decision run; NOT evidence)

**First pilot: inputs shuffled across all 32 positions.**
- Both arms' hardest active functions were NOR4 and AND4, functions with one true row, paid for words with two bits set.
- Fix: the half-per-truth-table draw. After it, no constant 1-255 and no word 0xFFFFFFFF-k (k < 65,536) is a function.

**Second pilot: the new draw.**
- The CONTROL was paid for one-row functions by a counter (SUB, ADD, LOADK in a loop) whose word 0x82000 has one bit per half. It matches about one draw in 16. Those functions need 7-10 NAND gates.
- Fix: the clean-word rule. A hand-built INPUT, MOV, INPUT, NAND, OUTPUT organism is paid for NAND(x1,x2) = 0x0FFF.

**Third pilot: both fixes, 450,000 ticks.**

| | STRICT | CONTROL |
|---|---|---|
| first active function | window 7 | window 5 |
| hardest active per window, circuit, windows 8-14 | 1, 3, 3, 3, 4, 4, 5, 5 | 3-4 |
| ever active at 450,000 | 39 | 45 |
| population once started | about 4,050 | about 4,050 |

- STRICT pays far more distinct functions per sample: 170-530, against 45-60.

## Grading
- **SZ4:** exact NAND formula size for all 65,536 functions, levels 0-26.
- **CSZ4:** exact NAND circuit size for every function some circuit of 9 or fewer gates computes (29,687 functions). It was found by exhaustive search over 14.8e9 canonical circuits.
  - A circuit's gates are ordered so each gate either reads the one before it or has a larger operand pair; any circuit can be put in that form by swapping adjacent independent gates.
  - The 35,849 functions no circuit of 9 or fewer gates computes read **10+** (at least 10).
  - The same search for three inputs reproduces #336's CSZ table on all 254 functions, and SZ too.
- Landmarks: XOR2 4 gates (formula 5); AND4 6 (8); 0xE880 8 (9); NOR4 10+ (14); XOR4 10+ (23).

## Arms and runs
- **STRICT:** TASKS=1, TASK_RATE 0.2, TASK_SCALE 1, OTHERS=1, REFUSE_NOT=1, DEPTH=1, NIN=4.
- **CONTROL:** the same with OTHERS=2 (reads return 0, never clean) and REFUSE_NOT=0.

Seeds **7301, 7302, 7303** have never been run. Each world runs 1,200,000 ticks (#290/#334/#336/#337's horizon), EVERY=1000, in 150,000-tick chunks.

## Step 1 - executed first
A seed counts if all of these hold:
- both its worlds finished;
- STRICT's READ_OTHER hit a nonzero word in at least 1% of reads over the second half;
- at least one of its two worlds had an active function by window 20, so the second half has something to compare.

Fewer than 3 counted seeds is INCONCLUSIVE.

## Ruling measures
Windows are 30,000 ticks, 40 per world. ACTIVE is as in #290-#337: at least 1% of the window's task income and at least 100 per sample. Sample flux lists every function with at least 0.1% of income.

- **A. SUSTAINED HARDNESS (the #337 rule).**
  - Measure: the median, over windows 21-40, of each window's hardest active circuit size, with 10+ counted as 10.
  - A seed passes if STRICT is at least CONTROL + 2.
  - If both medians are 10+, formula size decides that seed, with the same rule: STRICT median formula at least CONTROL's + 2.
  - Rule A holds on at least 2 of 3 seeds.
- **B. BREADTH.** STRICT has more functions ever active than CONTROL, on at least 2 of 3 seeds.
- **C. LATE NOVELTY.** This is the plateau question, and the reason for four inputs; 65,530 functions cannot be exhausted. STRICT must have a new active function in at least 5 of windows 31-40 on at least 2 of 3 seeds, and more such windows than CONTROL, summed over seeds.
- **D. NO DECELERATION.** On at least 2 of 3 seeds, STRICT's ever-active growth over windows 31-40 is at least half its growth over windows 11-20, and above 0.

## Verdict
- **OPEN-ENDED BY THESE MEASURES:** A, B, C and D all hold.
- **COMPOSITION REPLICATES, PLATEAU STANDS:** A and B hold, C or D fails.
- **HARDER, NOT BROADER:** A holds, B fails.
- **NOT REPLICATED:** A fails.

Reported, ruling on nothing:
- per-window hardest values (circuit and formula) and the hardest function's identity;
- new functions per window;
- the gain histogram CSZ(paid) - CSZ(read);
- reads, copies, complements and dirty outputs refused;
- population.

The verdict lines in `lab/analyse-four.js` print exactly these rules.

## Prediction written before running
**HARDER, NOT BROADER**, with low confidence.

On the practice seed, STRICT reached circuit 5 while CONTROL held 3-4: a gap of about 1-2 gates, on the edge of rule A. CONTROL had more ever-active functions (45 against 39) because it started earlier. I expect the late-novelty rules (C, D) to fail, as at three inputs.

## What this cannot say
- This is three seeds at one horizon. Four inputs make the exact circuit table stop at 9 gates; above that only formula size separates.
- The clean-word rule and the half-per-truth-table draw are new to this world, so a difference from #337 is a difference of world as well as of input count.
- The gain readout records only the last read before the output.
