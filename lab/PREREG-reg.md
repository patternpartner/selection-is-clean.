# Register-targeted READ on top of one payment per epoch, ruled on THRESHOLD-FREE measures (#345; written and COMMITTED before the first decision run)

24 Oct 2026. Fix 2 of two, asked for by the user after #344. Code:
- core: `lab/oee-core-tasks.js` with `READ_REG:1`, plus bookkeeping `LOGFULL:1`. With both unset, every earlier world is byte-identical (#344 EPAY, #341 TREE and #337 checked, seed 5). LOGFULL=1 leaves the trajectory identical (checked on EPAY+READ_DIR, seed 5);
- batch: `ARM1='"TASK_EPAY":1,"READ_DIR":1,"READ_REG":1,"LOGFULL":1' ARM2='"TASK_EPAY":1,"READ_DIR":1,"LOGFULL":1' SEEDS="7801 7802 7803" lab/tasks6-batch.sh`;
- analysis: `lab/analyse-reg.js`, after `probe-leak`, `probe-twowire` and `probe-hops` on each world's last save (WARM 2000, TICKS 5000). All three probes follow READ_REG, and give unchanged output on worlds without it.

## Why
**#344's finding.** One payment per epoch cut second reads made after the slot was spent from 69-80% to 14-28%. But 93-98% of the paid outputs that followed still depended on ONE read word, because READ always wrote R0.

**The change, READ_REG=1.** READ_OTHER writes the register named by operand bits 3-4. Then READ d1 into R1, READ d2 into R0, NAND 1 keeps both words with no MOV.
- Hand-built check: the neighbours ahead and behind publish NAND(x1,x2) and NAND(x3,x4); the program outputs their NAND (0xf888) and is paid.
- Resume is exact.

**Why READ_DIR is in both arms.** Without READ_DIR both reads hit the same neighbour, so READ_REG needs it. #341 found READ_DIR alone NOT USED, so the target register is the single difference between the arms.

## Arms and runs
Both arms: four inputs, bit-exact clean rule, reading and refusing copies and complements (#340's world), with TASK_EPAY=1, READ_DIR=1 and LOGFULL=1.
- **REG:** READ_REG=1.
- **CONTROL:** READ_REG=0.

Seeds **7801, 7802, 7803** have never been run. Each world runs 1,200,000 ticks in 150,000-tick chunks, at most 4 in parallel.

## Step 1 - executed first
A seed counts if all of these hold:
- both worlds finished;
- both arms' reads hit at least 1% over the second half;
- one of the two worlds started by window 20.

Fewer than 3 counted seeds is INCONCLUSIVE.

## Usage check (M)
- **Measure:** `probe-leak`'s share of PAID outputs made after 2+ distinct reads this epoch that depend on 2+ read words.
- **M holds** if REG's share is at least 10 points above CONTROL's on at least 2 of 3 seeds.
- **If M fails, the verdict is NOT USED.**

For reference: under #344's EPAY the share was 0.7-6.2%.

## Ruling measures (threshold-free; the 1% ACTIVE measures are reported beside them and rule on nothing)
Second half = samples 601-1200, unless named.

- **H1. HARDER.**
  - Measure: the income-weighted mean exact circuit size (10+ counts as 10) over all logged income. LOGFULL logs every function with income of 10 or more per sample, which is nearly all of it.
  - Holds if REG is at least CONTROL + 0.3 gates on at least 2 of 3 seeds, and below CONTROL - 0.3 on none.
  - Calibration: #344's two arms differed by 0.5-0.8 gates on this measure, recomputed from `probe-hops` bands, and seeds within an arm spread by about 0.6.
- **H2. DEEPER.**
  - Measure: the share of income at climbing depth 2 or more (`probe-hops`, last save). Climbing depth counts a read only if the step strictly adds circuit gates, so no cycle inflates it.
  - Holds if REG is at least CONTROL + 0.05 on at least 2 of 3 seeds, and below CONTROL - 0.05 on none.
  - Calibration: #344's arms differed by 0.07-0.25.
- **BR. BROADER.**
  - Measure: the median per-sample exp(H) over ALL functions' income.
  - Holds if REG is at least 1.1 x CONTROL on at least 2 of 3 seeds, and below 0.9 x CONTROL on none.
- **TWO-READ** (reported with the verdict): the clean income fed by 2+ reads (`probe-twowire`) is higher in REG on at least 2 of 3 seeds.

## Verdict
- **NOT USED:** M fails.
- **COMPOSES HARDER** (", AND BROADER" when BR holds): M, H1 and H2 hold.
- **PARTLY HARDER (circuit | climb):** M and exactly one of H1, H2 hold.
- **BROADER, NOT HARDER:** M and BR hold, neither H1 nor H2.
- **NO GAIN:** M holds, and none of H1, H2, BR does.

Reported, ruling on nothing:
- the legacy sustained circuit and ever-active counts (1%-based);
- functions with income of 100 or more per sample (median);
- all three probes' tables;
- read hits;
- population.

## Prediction written before running
**PARTLY HARDER (climb)**, with low confidence.
- **For:** M should hold easily, because the leak was mechanical.
- **Against:** a second wire raises what can be gated, but the per-function pools are not depleted (#344: 0.66-0.97 of cap), so a harder function is not much better paid than an easier one. The mean circuit may move less than 0.3 gates.

## What this cannot say
- This is three seeds at one horizon.
- H2 and M are read at the last save only, over 5,000 ticks.
- The threshold-free measures are new to this run, so their seed-to-seed spread is only estimated from #344.
