# FORGE-2 - generative ligation chemistry, longer runs (pre-registered before any deciding run)

FORGE (lab/FORGE.md, seeds 7961-7963, 1.2M) passed the comparison bar 3/3 (rel 1.21, no collapse) but X mean S was 0.376 < 0.5.
Mechanism restored unchanged from 95d9349 (FORGE flag, FORGE_TRY 24). Flag off = identity: seed 3, 20k ticks, lean CHEM and
CHEM_BIG+FLUXALL, every row identical to afc290d except wall-clock wallS.

ONE variant, chosen from the first round's numbers only: run length 1.2M -> 2.4M ticks. Join rate / slots unchanged.
Why: X's late-third S exceeded its middle-third S on all three seeds (0.256 vs 0.077, 0.667 vs 0.590, 0.205 vs 0.051), and
ligation already carried 10-34% of late income - the effect was still growing when runs ended, not starved of joins. More
joins would change the mechanism; more time tests the same one. Risk stated now: XP's middle S was high on two seeds
(0.333, 1.256, 0.872), so the twin may also grow with time.

Deciding round: fresh unseen seeds 7971-7973, 2.4M ticks, EVERY 1000, FLUXALL. Arms unchanged: X FORGE 1; XP X+NULLSHIFT 1;
SH FORGE 2 (sham); B plain CHEM_BIG. Score LOCKED and unchanged: FINE S (used-novelty.js MIN 0.002, WIN 10, LAG 2, late third),
income only. Collapse = mean N last quarter < 200. Bar unchanged: X beats every null outright on >=2/3 seeds, mean rel on
S+1 >= 1.10, no collapse in any arm, AND S>0 on every readable seed, mean S >= 0.5. No seeds 7961-7963 re-read.
GO = candidate only; flag stays off; never main. NO-GO: delete FORGE from oee-core.js and lab/forge; this file stays as the record.

## Result (deciding round, seeds 7971-7973, 2.4M ticks) - NO-GO

Scored by lab/forge/score.js against the locked bar above, no reinterpretation. Late-third FINE S, income only:

| seed | X | XP | SH | B | X beats all? |
|---|---|---|---|---|---|
| 7971 | 0.063 | 0.076 | 0.038 | 0.000 | no (lost to XP) |
| 7972 | 0.506 | 0.000 | 0.101 | 0.000 | yes |
| 7973 | 0.329 | 0.000 | 0.051 | 0.000 | yes |
| mean | 0.300 | 0.025 | 0.063 | 0.000 | 2/3 |

Bar: wins 2/3 (need 2) PASS; mean rel on S+1 1.222 (>= 1.10) PASS; no collapse (min last-quarter N 872) PASS;
S>0 on every seed PASS; mean X S 0.300 >= 0.5 FAIL. Late ligation share of X income 0.115 / 0.046 / 0.216.

VERDICT: NO-GO. Doubling run length did not lift X: mean S fell from 0.376 (1.2M) to 0.300 (2.4M), and late S was below
middle-third S on all three seeds (0.063 vs 0.190, 0.506 vs 0.582, 0.329 vs 0.367) - the "still growing" reading behind
this variant did not hold. X still clearly beats the shift twin, sham and plain baseline on average, but stays short of
the movement bar. Per pre-registration: FORGE removed from lab/oee-core.js (restored to afc290d) and lab/forge deleted.
This file stays as the record.
