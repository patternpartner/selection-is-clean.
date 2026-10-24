# Was #346 easy-pool depletion, or just less energy? A total-income-matched LEAN arm (#347; written and COMMITTED before the first decision run)

25 Oct 2026. Item 1 of two, asked for by the user after #346. No new engine code.
- batch: `SEEDS="7901 7902 7903" OPTS_X='"TASK_EPAY":1,"READ_DIR":1,"READ_REG":1,"LOGFULL":1,"TASK_CAP":14' lab/tasks-arm.sh lab/out-scarce 3`, writing arm o3 next to #346's o1 (SCARCE) and o2 (CONTROL);
- analysis: `lab/analyse-lean.js lab/out-scarce`, after `probe-hops` and `probe-twowire` on each LEAN world's last save.

## Why
#346's SCARCE arm (TASK_RATE 0.02) also earned about 20% less income: its second-half mean was 282,000-316,000 per sample, against CONTROL's 335,000-363,000. Was the gain from DIFFERENTIAL depletion of crowded easy pools, or from less energy overall?

## The arm (LEAN)
- **Settings:** #346's CONTROL world (TASK_RATE 0.2, so the 3.1-tick refill half-life and full easy pools), with TASK_CAP 14 instead of 20. Every pool shrinks uniformly.
- **Calibration:** continuing #346's CONTROL 7901 save for 40,000 ticks at caps 20, 16 and 14 gave mean income 357,000, 310,000 and 298,000, and exp(H) 251, 276 and 300. Cap 14 is closest to SCARCE's mean (293,000).

## The seeds - a deliberate exception, stated
LEAN runs on #346's seeds 7901-7903. The comparison it decides is against those seeds' SCARCE and CONTROL worlds. Those two arms have been seen; LEAN's outcome has not, and the rule below is fixed before it runs. Seeds already looked at do not usually decide (CLAUDE.md, the retire-or-prove template, rule 4). This run accepts that, to keep the comparison within-seed and to halve the cost. If the verdict is close, a fresh-seed replication of all three arms is the remedy.

## Step 1
A seed counts if all three of its worlds finished 1,200,000 ticks and LEAN's reads hit at least 1% over the second half. Fewer than 3 is INCONCLUSIVE.

## Manipulation checks (both must hold, or NOT MATCHED)
- **MATCH:** LEAN's second-half mean income is within 12% of SCARCE's on at least 2 of 3 seeds.
- **FULL:** LEAN's easy pools (`probe-hops` fill at the first tick of each epoch, for functions with 1% or more of income) are at least 0.6 full on at least 2 of 3 seeds. Uniformly smaller pools with fast refill should stay full.

## Ruling (#346's measures and margins)
Measures:
- mean circuit = income-weighted exact circuit size over all logged income, second half;
- exp(H) = median per-sample full-vector exp(H), second half.

"A beats B" means BOTH of these hold:
- mean circuit at least B + 0.3 on at least 2 of 3 seeds, and below B - 0.3 on none;
- exp(H) at least 1.1 x B on at least 2 of 3 seeds, and below 0.9 x B on none.

Rules:
- **DEPLETION:** SCARCE beats LEAN.
- **ENERGY:** LEAN beats CONTROL.

## Verdict
- **NOT MATCHED:** MATCH or FULL fails.
- **DEPLETION, NOT ENERGY:** DEPLETION holds, ENERGY fails. #346's gain came from differential depletion.
- **BOTH:** both hold.
- **ENERGY, NOT DEPLETION:** ENERGY holds, DEPLETION fails. #346's gain was mostly less energy.
- **NEITHER:** neither holds.

Reported, ruling on nothing:
- climb 2+;
- clean income fed by 2+ reads;
- the two-wire route;
- the second-half trend (windows 21-30 against 31-40) of exp(H) and mean circuit, for all three arms.

## Prediction written before running
**DEPLETION, NOT ENERGY**, with moderate confidence. The pilot's cap-14 world gained a little breadth (exp(H) 251 to 300 in 40,000 ticks), well short of SCARCE's x2-3.4, and nothing in a uniform cut should push organisms off the easy pools.

## What this cannot say
- Three seeds, with the exception above.
- A matched TOTAL is not matched per-pool income for the functions that were actually used. LEAN's easy pools pay less per payment than CONTROL's, while SCARCE's easy pools pay less per payment AND more rarely. "Depletion" here means frequency-dependent payment, which is what TASK_RATE changes.
