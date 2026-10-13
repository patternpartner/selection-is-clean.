# RESULT — niche v2 (shared / copyable / resource-opening structures)

Pre-registration: `lab/PREREG-niche-v2.md` (commit 84197c6, written before any deciding run). Seeds 10–12, 600k ticks, one run per arm. Analysis: `node lab/niche-v2/analyse.js` (output below, unchanged).

## Verdict: NOT SHOWN
The rule needed the full version (V1) to beat both the v1 baseline (V0) and random placement of the same structures (V2) on all three seeds, with a non-negative late trend. It passed on seed 10 only. On seeds 11 and 12 random placement scored higher, and the trend was slightly negative.

## What it did show (plain language)
- **Used novelty is no longer zero.** In v1 nothing new was ever used. Here every world with shared/copyable structures (V1, V2, V3) kept producing new compounds that at least 1% of income or organisms relied on, right through the late half: about 0.7–2.3 per window. V0 stayed at 0 on every seed.
- **It doesn't matter that the organisms built them.** Randomly placed structures did as well or better on 2 of 3 seeds. What matters is that useful, shared, copyable structures exist, not that they are authored by selection.
- **Resource-opening (c) is not clearly load-bearing.** V3 (no opening) is close to V1 on seeds 11–12.
- **Caveat:** V1 on seeds 10 and 12 hit the 2M compound memory guard millions of times, so those runs were bound by the cap and seed 10's pass may be inflated or distorted.

## Raw readout
```
arm seed | windows | Lu: new USED compounds/window, late half (primary) | OLS trend of Lu, late half | income-only new used/window late | v1 metric: new active reactions/window late | used ever | max depth used late | structure share of late income (opened channels) | channels | compounds | memory-cap hits | N late | income/1k late | new used per window
V0 10 | 20 | 0.00 | 0.000 | 0.00 | 0.00 | 0 | 0 | 0.3% (0.0%) | 0 | 6211 | 0 | 1559 | 11971 | 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
V1 10 | 20 | 2.30 | 0.430 | 0.20 | 0.40 | 33 | 514 | 11.8% (8.0%) | 218183 | 2000000 | 5404002 | 1546 | 12492 | 1,0,2,3,0,0,0,0,0,4,0,5,1,0,0,1,2,4,3,7
V2 10 | 20 | 1.30 | -0.006 | 0.00 | 0.40 | 20 | 627 | 15.5% (12.8%) | 188507 | 2000000 | 600530 | 1657 | 14043 | 0,1,2,1,1,0,1,0,0,1,3,1,0,1,1,1,1,3,0,2
V3 10 | 20 | 1.00 | -0.085 | 0.10 | 0.60 | 21 | 30 | 2.4% (0.0%) | 0 | 27815 | 0 | 1525 | 11501 | 1,0,2,1,0,1,1,0,4,1,2,1,1,1,1,0,1,2,1,0
V0 11 | 20 | 0.00 | 0.000 | 0.00 | 0.10 | 0 | 0 | 0.5% (0.0%) | 0 | 10849 | 0 | 1514 | 11834 | 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
V1 11 | 20 | 0.70 | -0.030 | 0.00 | 0.30 | 15 | 16 | 1.6% (0.3%) | 236 | 3241 | 0 | 1415 | 10755 | 1,0,1,0,0,0,3,1,0,2,1,1,1,0,0,1,1,1,1,0
V2 11 | 20 | 1.40 | 0.218 | 0.00 | 0.10 | 27 | 6 | 8.8% (6.1%) | 1641 | 13102 | 0 | 1507 | 12269 | 0,2,1,2,0,1,3,1,1,2,0,1,1,1,0,3,2,2,2,2
V3 11 | 20 | 0.80 | 0.085 | 0.00 | 0.80 | 12 | 8 | 34.0% (0.0%) | 0 | 6320 | 0 | 1362 | 10164 | 1,0,0,1,1,0,0,0,0,1,0,0,1,1,1,1,1,2,0,1
V0 12 | 20 | 0.00 | 0.000 | 0.00 | 1.00 | 0 | 0 | 0.6% (0.0%) | 0 | 2752 | 0 | 1372 | 10093 | 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
V1 12 | 20 | 1.10 | -0.127 | 0.10 | 0.30 | 22 | 1903 | 8.5% (6.8%) | 216061 | 2000000 | 5590307 | 1565 | 12782 | 0,3,0,1,2,0,3,0,1,1,0,0,4,2,2,1,2,0,0,0
V2 12 | 20 | 1.50 | 0.188 | 0.00 | 0.10 | 26 | 1000 | 14.9% (10.5%) | 194423 | 2000000 | 259931 | 1542 | 12816 | 0,2,3,0,1,0,0,0,3,2,0,3,2,0,0,2,1,0,3,4
V3 12 | 20 | 1.00 | 0.085 | 0.00 | 0.20 | 18 | 14 | 1.5% (0.0%) | 0 | 5316 | 0 | 1500 | 11813 | 0,2,1,0,2,3,0,0,0,0,0,2,0,0,3,1,1,0,0,3

VERDICT (open-ended-ish: on ALL 3 seeds, V1 Lu > 0 AND V1 trend >= 0 AND Lu(V1) > Lu(V0) AND Lu(V1) > Lu(V2)):
seed 10: V1 2.30 (trend 0.430) | V0 0.00 | V2 1.30 | V3 1.00 -> passes []
seed 11: V1 0.70 (trend -0.030) | V0 0.00 | V2 1.40 | V3 0.80 -> FAILS [trend>=0, >V2]
seed 12: V1 1.10 (trend -0.127) | V0 0.00 | V2 1.50 | V3 1.00 -> FAILS [trend>=0, >V2]
=> NOT SHOWN: the rule fails on at least one seed.
```
