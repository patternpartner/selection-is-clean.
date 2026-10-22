# STRICT, confirmed on fresh seeds and ruled on SUSTAINED hardness (#337; written and COMMITTED before the first decision run)

22 Oct 2026. The user asked for this after #336, before moving to four inputs. Everything below is #336's setup unchanged:
- core `lab/oee-core-tasks.js`;
- batch `lab/tasks2-batch.sh`, now taking `SEEDS=`;
- analysis `lab/analyse-strict.js`, now taking `SEEDS=` and printing the #337 lines.

The only new thing is the rule.

## Why a new rule
#336 ruled on the hardest function EVER active. Both arms reached a circuit size of 7 on all three seeds, so the verdict was NOT SUPPORTED. But CONTROL's 7s were single-window transients: each sat in windows 2, 4, 6 or 21 and was followed by 3s and 4s. STRICT held 6 for window after window. The maxEver rule measured the luckiest window, not the world.

**The roof is not 7.** The user suggested every three-input function needs at most 7 NAND gates. That is not true of this basis. `CSZ` (exact minimum NAND circuit size, gates shared, all 256 functions) gives:
- XOR3 (0x96): 8 gates;
- XNOR3 (0x69): 9 gates;
- 0x16: 10 gates;
- 28 functions in all need 8 or more.

So #336's tie at 7 was not forced by the function space. That is one more reason to rule on what a world holds rather than what it touched once.

## Arms and runs
The same two arms as #336:
- **STRICT:** OTHERS=1, REFUSE_NOT=1, DEPTH=1.
- **CONTROL:** OTHERS=2, DEPTH=1.

Both use TASKS=1, TASK_RATE 0.2 and TASK_SCALE 1.

Seeds **7201, 7202, 7203** have never been run. Each world runs 1,200,000 ticks with EVERY=1000, in 150,000-tick chunks.

## Step 1 - executed first
This is as #336. A STRICT world counts if READ_OTHER hit a nonzero word in at least 1% of its reads over the second half. A seed counts if both its worlds finished and its STRICT world counts. Fewer than 3 counted seeds is INCONCLUSIVE.

## Ruling measures
Windows are 30,000 ticks, so there are 40 per world. ACTIVE is as #290/#334/#336: at least 1% of the window's task income, and at least 100 per sample.

- **A. SUSTAINED HARDNESS (ruling).**
  - Measure: for each window, take the hardest active function by exact NAND circuit size. Then take the median of those values over windows 21-40, the second half of the run.
  - A seed passes if STRICT's median is at least 5 and at least CONTROL's median + 2.
  - Rule A holds if at least 2 of 3 seeds pass.
- **B. BREADTH (ruling).** A seed passes if STRICT's ever-active count is greater than CONTROL's. Rule B holds if at least 2 of 3 seeds pass.

How the thresholds were set:
- They were designed on #336's seeds (7101-7103), which do not decide. There they read: sustained 6 against 3, 6 against 4, 6 against 3; ever active 54 against 34, 62 against 46, 59 against 35.
- The margin of 2 is the smallest #336 margin. One gate was judged too close to CONTROL's own window-to-window wobble, which runs 3 to 4.

## Verdict
- **CONFIRMED:** A and B both hold. Then Step 2 follows: four inputs.
- **HARDER, NOT BROADER:** A holds, B does not.
- **NOT CONFIRMED:** A fails.

Reported, ruling on nothing:
- the per-window circuit and formula hardest values;
- first-half medians;
- #336's three rules on these seeds;
- payments by depth and read hits;
- copies and complements refused;
- population.

## Prediction written before running
CONFIRMED. Sustained STRICT 6 against CONTROL 3-4 held on three of three seeds with no exceptions in the second half. The risk is a seed where STRICT starts late, as 7101 did at window 15, or never starts at all, as #334's pilot did.

## What this cannot say
- This is three seeds at one horizon, with three-input functions only.
- The median measures what is held, not what is new. Rules 1-2 of #336 (new functions late; no deceleration) are reported and are expected to fail again: the plateau is not in question here.
