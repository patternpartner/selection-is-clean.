# Wall B: does SCARCITY of the easy pools make composition pay? (#346; written and COMMITTED before the first decision run)

24 Oct 2026. Asked for by the user after #345. No new engine code: the existing knob TASK_RATE (each function's pool regrows that fraction of its deficit per tick) is lowered in one arm.
- batch: `ARM1='"TASK_EPAY":1,"READ_DIR":1,"READ_REG":1,"LOGFULL":1,"TASK_RATE":0.02' ARM2='"TASK_EPAY":1,"READ_DIR":1,"READ_REG":1,"LOGFULL":1' SEEDS="7901 7902 7903" lab/tasks6-batch.sh`. The batch's base options carry TASK_RATE 0.2 and the later key wins; this is checked;
- analysis: `lab/analyse-scarce.js`, after `probe-leak`, `probe-twowire` and `probe-hops` on each last save.

## Why
**#344 and #345.** Every function has its own pool, and the pools of the functions holding 1% or more of income sat at 0.66-0.97 of cap. At TASK_RATE 0.2 a grazed pool recovers with a half-life of 3.1 ticks, so crowding onto a popular, easy function costs almost nothing. Cheaper single-read routes then kept winning over two-wire composition.

**Note.** The pools already scale with hardness: TASK_SCALE=1 sets each cap to TASK_CAP times the function's formula size. So this run tests FREQUENCY-dependent payment, not pay for hardness. Nothing in the physics consults the circuit-size table.

## Pilot (#345's REG world, seed 7801, continued 60,000 ticks from its 1,200,000-tick save at three rates; NOT evidence, and the seed has been seen)

| TASK_RATE | population | fill of the pools at 1% or more | effective functions | two-wire share of income | income at climb 2+ | mean circuit, 1% or more / below 1% |
|---|---|---|---|---|---|---|
| 0.20 | ~4,080 | 0.88 | 284 | 0.018 | 0.54 | 2.6 / 4.2 |
| 0.05 | ~4,085 | 0.47 | 396 | 0.073 | 0.56 | 4.5 / 4.1 |
| 0.02 | ~4,080 | 0.13 | 518 | 0.127 | 0.55 | 6.0 / 4.4 |

0.02 is the strongest depletion piloted, and the population stays viable at it.

**An earlier pilot from scratch (seed 99) earned no task income in 150,000 ticks at either rate,** so it said nothing. The rate only matters once a world is paid. Starting from scratch, a scarce world may begin later; the Step 1 rule covers that.

## Arms and runs
Both arms are #345's REG world: four inputs, bit-exact clean rule, reading and refusing copies and complements, TASK_EPAY=1, READ_DIR=1, READ_REG=1, LOGFULL=1.
- **SCARCE:** TASK_RATE 0.02.
- **CONTROL:** TASK_RATE 0.2.

Seeds **7901, 7902, 7903** have never been run. Each world runs 1,200,000 ticks in 150,000-tick chunks.

## Step 1 - executed first
As #345. A seed counts if all of these hold:
- both worlds finished;
- both arms' reads hit at least 1% over the second half;
- one of the two worlds started by window 20.

Fewer than 3 counted seeds is INCONCLUSIVE.

## Manipulation check (M)
- **Measure:** `probe-hops`'s fill, at the first tick of each epoch, of the pools of the functions holding 1% or more of the window's income.
- **M holds** if SCARCE's fill is at least 0.30 below CONTROL's on at least 2 of 3 seeds.
- **If M fails, the verdict is NOT APPLIED.**

## Ruling measures (threshold-free, exactly #345's margins; the 1% measures are reported and rule on nothing)
- **H1. HARDER.** The income-weighted mean exact circuit size over all logged income in the second half is at least 0.3 gates above CONTROL on at least 2 of 3 seeds, and more than 0.3 below on none.
- **H2. DEEPER.** Income at climbing depth 2 or more (`probe-hops`, last save) is at least 0.05 above CONTROL on at least 2 of 3 seeds, and more than 0.05 below on none.
- **BR. BROADER.** The median per-sample exp(H), full vector, second half, is at least 1.1 x CONTROL on at least 2 of 3 seeds, and below 0.9 x on none.
- **TWO-READ** (an outcome, reported in the verdict): clean income fed by 2+ reads (`probe-twowire`) is higher on at least 2 of 3 seeds.

## Verdict
- **NOT APPLIED:** M fails.
- **COMPOSES HARDER** (", AND BROADER" when BR holds): M, H1 and H2 hold.
- **PARTLY HARDER (circuit | climb):** M and exactly one of H1, H2 hold.
- **BROADER, NOT HARDER:** M and BR hold, neither H1 nor H2.
- **NO GAIN:** M holds, and none of H1, H2, BR does.

" (TWO-READ ROSE)" is appended when M and TWO-READ both hold.

Reported, ruling on nothing:
- the legacy 1% measures;
- functions with income of 100 or more per sample;
- the gain columns (one-wire, two-wire, two-wire against the sum);
- the READ destination census;
- population and task income.

## Prediction written before running
**PARTLY HARDER (circuit), AND BROADER (TWO-READ ROSE)**, with moderate confidence.

The pilot moved breadth (x1.8), two-wire share (x7) and the mean circuit (about +0.4 gates, computed from its bands), but not climbing depth.

The risks:
- **Starting late:** a world started from scratch under scarcity may begin late, and the pilot began from an established world.
- **The control's own bands:** the pilot's +0.4 is near the 0.3 margin.

## What this cannot say
- This is three seeds at one horizon, and one rate.
- Scarcity also lowers total income: 0.02 paid about 260,000 per sample in the pilot, against about 370,000 at 0.2. A gain cannot be split between "easy pools deplete" and "less energy overall" without a third arm, such as 0.2 with a smaller TASK_CAP. That is the follow-up if this run gains.
