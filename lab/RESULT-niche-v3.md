# RESULT — niche v3 (costly builders vs freeloaders)

Pre-registration: `lab/PREREG-niche-v3.md` (written and pushed before any deciding run). Seeds 13–15, 900k ticks, one run per arm. Analysis: `node lab/niche-v3/analyse.js` (output below, unchanged). Branch `cos/niche-v3` only — never main.

## Verdict: NOT SHOWN
The pre-registered rule needed the costly-builder world (W1) to beat both random structure placement (W2) and non-heritable builders (W3) on **all three** seeds, with late used-novelty above zero, a non-negative trend, and active builders still present at the end. It failed on every seed.

## What that means in plain language
We asked: when building and maintaining shared structures is **expensive** for the builder, and the “builder” trait can be inherited, do builders outcompete freeloaders and keep inventing useful new chemistry?

**No — not under this rule.** Paying builders did not win. On seeds 13 and 14, randomly dumped structures and/or non-inherited builder labels produced *more* new useful compounds than honest costly builders. On seed 15 the builders edged the nulls on the main score, but their novelty was still drifting downward, so that seed failed the trend check. In the costly world, the share of organisms that actually build often shrank or stayed tiny (under 1% late on seed 15). Freeloaders kept benefiting from nearby structures without paying.

The cheap “everyone can build” world (W0) still made lots of new used chemistry — but it slammed into the compound memory ceiling millions of times even with the garbage-collection fix. So that arm is not a clean win either; it is context only and carried no verdict weight.

## What this says about “what’s missing from life”
Making niche construction costly and heritable was not enough for selection to prefer builders over freeloaders. The freeloader problem still wins here. Shared structures can help novelty (v2 already showed that), but authorship-by-selection under real costs was not shown. Something else would be needed for builders to stick — this experiment does not claim what that is; it only rules out “cost + inheritance alone, at these settings.”

## Most surprising thing
Random placement (W2) and the non-heritable-builder null (W3) often beat or matched the real costly builders on the thing we cared about (new *used* compounds). Paying for the work did not buy a cleaner story of selection-authored construction.

## One next step
Leave niche-v3 closed as NOT SHOWN on `cos/niche-v3`. Do not reopen costs or the verdict rule to chase a pass. If CoS continues this line later, pre-register a *different* mechanism (for example stronger private return to the builder, or assortment so builders cluster) rather than retuning this one.

## Per-seed failures (from the locked rule)
- **Seed 13:** W1 Lu 0.40 (trend OK) but lost to W2 (1.40) and W3 (0.93); active builders collapsed 8.3% → 0.8%.
- **Seed 14:** W1 Lu was 0 (fails “above zero”); also lost to W2 and W3; builders 5.1% → 1.8%.
- **Seed 15:** W1 Lu 0.73 beat W2 (0.53) and W3 (0.40), builders barely held (~1.3% → 1.4%), but late trend was negative (−0.064).

W0 compound-cap hits (whole run): seed 13 ≈70M, seed 14 ≈18M, seed 15 ≈54M. W1–W3: zero cap hits on all seeds.

## Raw readout
```
arm seed | windows | Lu: new USED compounds/window, late half (primary) | OLS trend of Lu, late | income-only new used/window late | v1 metric new active reactions/window late | used ever | max depth used late | structure share of late income (opened channels) | structure cells late | builds late (incl. random) | maintenances late | compound-cap hits (whole run) | max live compounds | compounds ever made | N late | income/1k late
W0 13 | 30 | 4.67 | 0.293 | 0.00 | 0.07 | 81 | 2805 | 32.7% (27.1%) | 4068 | 8926204 | 0 | 70249278 | 2000000 | 8898905 | 1580 | 15746
W1 13 | 30 | 0.40 | 0.050 | 0.07 | 0.20 | 12 | 9 | 0.3% (0.0%) | 604 | 17760 | 50326 | 0 | 90 | 344 | 1468 | 11394
W2 13 | 30 | 1.40 | 0.150 | 0.07 | 0.33 | 55 | 11 | 6.6% (0.3%) | 728 | 17336 | 50273 | 0 | 476 | 1742 | 1483 | 11579
W3 13 | 30 | 0.93 | -0.025 | 0.07 | 0.33 | 27 | 11 | 2.8% (0.1%) | 578 | 11580 | 58543 | 0 | 121 | 755 | 1502 | 10858
W0 14 | 30 | 3.27 | 0.443 | 0.00 | 0.13 | 67 | 1366 | 20.1% (15.3%) | 3883 | 5488667 | 0 | 17779130 | 2000000 | 5450975 | 1565 | 12987
W1 14 | 30 | 0.00 | 0.000 | 0.00 | 0.00 | 9 | 5 | 0.8% (0.0%) | 581 | 17009 | 39607 | 0 | 49 | 162 | 1527 | 11726
W2 14 | 30 | 0.20 | -0.057 | 0.00 | 0.07 | 14 | 3 | 0.5% (0.0%) | 675 | 16874 | 39558 | 0 | 140 | 238 | 1523 | 12124
W3 14 | 30 | 2.07 | -0.075 | 0.20 | 0.33 | 45 | 48 | 1.7% (0.1%) | 905 | 24037 | 119312 | 0 | 569 | 1824 | 1541 | 11931
W0 15 | 30 | 3.73 | 0.114 | 0.07 | 0.27 | 95 | 2505 | 37.0% (28.4%) | 3990 | 8016172 | 0 | 53905597 | 2000000 | 8068403 | 1454 | 12250
W1 15 | 30 | 0.73 | -0.064 | 0.07 | 0.13 | 20 | 5 | 1.0% (0.0%) | 208 | 5627 | 17175 | 0 | 37 | 213 | 1519 | 11441
W2 15 | 30 | 0.53 | 0.061 | 0.07 | 0.07 | 29 | 5 | 0.8% (0.0%) | 165 | 3679 | 14963 | 0 | 52 | 201 | 1421 | 10983
W3 15 | 30 | 0.40 | 0.082 | 0.07 | 0.20 | 11 | 4 | 1.1% (0.0%) | 588 | 15205 | 40769 | 0 | 35 | 250 | 1441 | 11286

new used per window:
W0 13 | 0,1,2,2,0,0,0,2,0,1,1,2,0,0,0,0,1,4,6,5,5,5,3,4,6,10,4,7,5,5
W1 13 | 0,0,1,1,0,1,0,0,0,1,0,0,1,0,1,0,0,0,0,0,0,0,1,3,0,0,0,1,1,0
W2 13 | 0,0,5,1,0,2,1,0,0,3,7,2,0,2,11,4,1,0,0,0,0,0,0,1,1,2,2,4,3,3
W3 13 | 0,0,1,2,1,0,1,1,2,0,1,1,2,0,1,0,0,5,0,1,1,2,0,0,1,1,0,0,1,2
W0 14 | 0,1,2,3,0,0,1,2,2,1,1,1,1,1,2,1,1,0,2,0,4,4,3,3,4,3,3,8,6,7
W1 14 | 0,0,0,0,0,1,0,5,0,0,0,0,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
W2 14 | 0,0,0,0,0,0,1,2,1,0,0,1,0,0,6,1,0,1,1,0,0,0,0,0,0,0,0,0,0,0
W3 14 | 0,0,0,0,0,2,0,1,2,1,1,0,5,2,0,3,2,3,1,3,0,5,1,3,1,3,1,3,2,0
W0 15 | 0,1,0,0,0,4,1,4,3,2,2,5,6,4,7,5,2,3,4,2,2,3,6,3,6,4,2,3,4,7
W1 15 | 0,0,2,1,2,0,0,0,0,2,0,0,1,0,1,1,1,1,0,0,2,2,0,2,2,0,0,0,0,0
W2 15 | 0,0,4,2,5,4,3,2,0,1,0,0,0,0,0,0,0,0,0,0,0,1,2,2,1,0,0,0,0,2
W3 15 | 0,0,0,1,1,0,0,0,0,2,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,4,0,1,1,0

BUILDER DYNAMICS: arm seed | ACTIVE builder share (bit + BUILD op): first 3 late-half windows | last 3 windows | late-half OLS slope | builder-BIT share: first window, late-half start, final | bit-carriers share of births late | mean store bit-carriers vs others late | active share per window | bit share per window
W1 13 | 0.083 | 0.008 | -0.0019 | 0.060, 0.506, 0.249 | 0.411 | 3.53 vs 4.28 | 0.002,0.094,0.150,0.022,0.015,0.028,0.073,0.221,0.031,0.077,0.105,0.028,0.028,0.071,0.006,0.023,0.143,0.084,0.029,0.005,0.004,0.030,0.091,0.055,0.124,0.137,0.059,0.009,0.007,0.007 | 0.06,0.14,0.52,0.36,0.55,0.55,0.70,0.74,0.59,0.54,0.50,0.46,0.21,0.21,0.20,0.51,0.57,0.39,0.37,0.30,0.28,0.28,0.31,0.61,0.79,0.70,0.38,0.36,0.24,0.25
W2 13 | 0.106 | 0.129 | 0.0004 | 0.060, 0.247, 0.527 | 0.448 | 3.54 vs 4.54 | 0.002,0.094,0.301,0.040,0.014,0.084,0.063,0.061,0.196,0.115,0.019,0.010,0.005,0.003,0.004,0.111,0.128,0.078,0.035,0.058,0.198,0.119,0.009,0.012,0.057,0.034,0.076,0.133,0.101,0.152 | 0.06,0.14,0.73,0.47,0.53,0.76,0.63,0.30,0.41,0.20,0.23,0.10,0.04,0.21,0.19,0.25,0.26,0.31,0.36,0.52,0.62,0.66,0.32,0.37,0.67,0.48,0.47,0.45,0.52,0.53
W3 13 | 0.059 | 0.048 | 0.0000 | 0.057, 0.507, 0.249 | 0.418 | 4.41 vs 4.40 | 0.012,0.084,0.260,0.114,0.108,0.065,0.189,0.151,0.064,0.065,0.048,0.015,0.006,0.014,0.014,0.041,0.058,0.078,0.069,0.085,0.026,0.027,0.047,0.094,0.082,0.082,0.070,0.055,0.032,0.057 | 0.06,0.14,0.53,0.36,0.54,0.55,0.70,0.74,0.59,0.53,0.50,0.46,0.21,0.21,0.20,0.51,0.57,0.39,0.37,0.29,0.28,0.28,0.30,0.61,0.79,0.70,0.38,0.36,0.25,0.25
W1 14 | 0.051 | 0.018 | -0.0044 | 0.137, 0.500, 0.705 | 0.521 | 4.69 vs 3.96 | 0.004,0.007,0.004,0.010,0.067,0.156,0.022,0.046,0.014,0.029,0.090,0.180,0.158,0.040,0.012,0.037,0.030,0.084,0.178,0.064,0.017,0.012,0.041,0.049,0.011,0.035,0.027,0.018,0.023,0.011 | 0.14,0.15,0.24,0.32,0.38,0.34,0.34,0.24,0.19,0.45,0.53,0.53,0.39,0.33,0.39,0.50,0.52,0.62,0.55,0.48,0.30,0.34,0.40,0.34,0.32,0.82,0.61,0.69,0.53,0.71
W2 14 | 0.059 | 0.123 | 0.0027 | 0.137, 0.575, 0.137 | 0.402 | 5.37 vs 4.17 | 0.004,0.007,0.004,0.010,0.075,0.124,0.021,0.029,0.044,0.055,0.122,0.079,0.087,0.016,0.028,0.030,0.106,0.041,0.053,0.067,0.038,0.040,0.022,0.004,0.006,0.019,0.016,0.096,0.199,0.075 | 0.14,0.15,0.24,0.32,0.38,0.58,0.55,0.52,0.69,0.57,0.54,0.32,0.32,0.21,0.10,0.57,0.73,0.69,0.51,0.61,0.58,0.21,0.22,0.23,0.26,0.26,0.31,0.25,0.40,0.14
W3 14 | 0.069 | 0.139 | 0.0059 | 0.136, 0.501, 0.703 | 0.517 | 4.35 vs 4.31 | 0.002,0.005,0.032,0.075,0.050,0.024,0.039,0.013,0.005,0.027,0.024,0.047,0.025,0.045,0.041,0.039,0.041,0.128,0.123,0.154,0.073,0.056,0.090,0.113,0.150,0.206,0.099,0.138,0.103,0.175 | 0.14,0.15,0.24,0.32,0.38,0.34,0.34,0.24,0.19,0.45,0.53,0.53,0.38,0.34,0.39,0.50,0.52,0.62,0.55,0.47,0.29,0.34,0.40,0.34,0.32,0.82,0.61,0.69,0.53,0.70
W1 15 | 0.013 | 0.014 | 0.0003 | 0.828, 0.396, 0.279 | 0.393 | 5.34 vs 4.58 | 0.029,0.051,0.024,0.039,0.019,0.032,0.012,0.008,0.036,0.028,0.056,0.014,0.012,0.015,0.030,0.030,0.009,0.001,0.013,0.028,0.029,0.028,0.098,0.064,0.024,0.043,0.010,0.003,0.009,0.030 | 0.83,0.69,0.59,0.44,0.64,0.46,0.48,0.35,0.30,0.12,0.10,0.09,0.28,0.28,0.28,0.40,0.14,0.16,0.51,0.56,0.60,0.44,0.64,0.80,0.49,0.23,0.16,0.22,0.14,0.28
W2 15 | 0.046 | 0.034 | 0.0025 | 0.828, 0.637, 0.283 | 0.373 | 5.20 vs 4.12 | 0.029,0.071,0.100,0.055,0.164,0.024,0.294,0.354,0.178,0.115,0.019,0.003,0.150,0.033,0.018,0.045,0.036,0.057,0.082,0.026,0.022,0.132,0.069,0.077,0.128,0.228,0.109,0.036,0.018,0.050 | 0.83,0.78,0.51,0.56,0.56,0.53,0.65,0.91,0.91,0.60,0.29,0.17,0.28,0.31,0.59,0.64,0.44,0.41,0.35,0.47,0.28,0.24,0.30,0.32,0.45,0.45,0.18,0.38,0.42,0.28
W3 15 | 0.022 | 0.019 | -0.0006 | 0.830, 0.398, 0.278 | 0.393 | 6.19 vs 6.19 | 0.026,0.046,0.064,0.069,0.230,0.071,0.030,0.055,0.038,0.005,0.011,0.005,0.013,0.050,0.050,0.050,0.011,0.006,0.064,0.086,0.033,0.055,0.060,0.070,0.123,0.064,0.015,0.028,0.010,0.020 | 0.83,0.70,0.59,0.44,0.64,0.46,0.48,0.35,0.30,0.12,0.10,0.09,0.28,0.28,0.28,0.40,0.14,0.16,0.51,0.55,0.60,0.44,0.64,0.80,0.49,0.23,0.16,0.22,0.14,0.28

VERDICT (positive only if on ALL 3 seeds: W1 Lu > 0 AND W1 trend >= 0 AND Lu(W1) > Lu(W2) AND Lu(W1) > Lu(W3) AND W1 active builder share maintained: last-3-window mean >= 0.75 x first-3-late-half-window mean AND >= 0.01):
seed 13: W1 0.40 (trend 0.050, active builders 0.083->0.008) | W2 1.40 | W3 0.93 | W0 4.67 -> FAILS [>W2, >W3, builders maintained]
seed 14: W1 0.00 (trend 0.000, active builders 0.051->0.018) | W2 0.20 | W3 2.07 | W0 3.27 -> FAILS [Lu>0, >W2, >W3, builders maintained]
seed 15: W1 0.73 (trend -0.064, active builders 0.013->0.014) | W2 0.53 | W3 0.40 | W0 3.73 -> FAILS [trend>=0]
compound-cap hits: W013:70249278 W014:17779130 W015:53905597
=> NOT SHOWN: the rule fails on at least one seed.
```
