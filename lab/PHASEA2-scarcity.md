# PHASE A2: scarcity (is invention a way to make a living?)

Branch `cos/scarcity`, from `cos/autocatalysis` (2757a7d). **Trial seeds only (80–89, 90–97). No deciding pre-registration,
no deciding seed has been run.** Each arm is run once per seed. Raw readouts are in `lab/autocat/trial/a2-*`.

## Why
Phase A (`lab/PHASEA-autocatalysis.md`) was a no-go. Catalysed assembly (NICHE_AC 2) made founding 17–38x more common, but
organism-built FULL did not reliably beat the random-placement (RAND, RANDN) or shuffled-heritability (SHUF) nulls. Structures
earned about 0–0.1% of late income. The hypothesis, approved by the user: the base economy is too comfortable. METAB on the
base network pays so well that a new structure is not a way to make a living.

## Mechanism: `SCAR_*` in lab/oee-core.js (off by default; SCAR_T 0 means unset)
From tick SCAR_ON (20,000), over SCAR_T ticks (linear ramp, then held):
- **Every base METAB reaction slows down.** The share of the cell's substrate it turns over is multiplied by a factor that
  falls from 1 to SCAR_MIN. Molecules that are not converted stay in the cell, where they diffuse and decay as before, so
  energy is conserved. Structure-catalysed reactions (CATAL) and channels are not touched.
- **Optionally (SCAR_ALPHA ≥ 0), more of each light meal is left in the cell.** The share left as species 0, instead of being
  taken directly, ramps from CHEM_ALPHA (0.5) to SCAR_ALPHA. This is the same energy split differently, so it is conserved.
- Nothing names a compound and nothing rewards novelty. Structures gain only because the base routes earn less. A population
  can still live on light and slow METAB, so the ramp is gentle and is not a death sentence by design. The population and
  reseeds are reported for every run.

Byte-identity with SCAR_T unset: see the bytecheck log below.

## Arms (`lab/autocat/feas2.sh`)
- FULL = skin S2 + NICHE_AC 2 + AC_B 0.001 (the Phase A v2 design) + scarcity.
- NOAC = FULL without AC.
- RAND = FULL's per-1k [found, extend, recipe, maintain] schedule applied to random living organisms (present pairs).
- RANDN = RAND with named random pairs.
- SHUF = builder bit drawn at FULL's share each sample.
- FULLNS = FULL with no scarcity.

All scarcity arms share the same SCAR settings.

## Designs tried at 150k (trial seeds 80, 81, 82), all fixed before any result
- **D1:** SCAR_T 100000, SCAR_MIN 0.25 (METAB decline only).
- **D2:** D1 + SCAR_ALPHA 0.8 (more light left as chemistry).
- **D3:** SCAR_T 100000, SCAR_MIN 0.1, SCAR_ALPHA 0.8 (strongest).

## Design-choice rule (fixed before any result)
- **Disqualify** a design if, on any seed, any of its scarcity arms has late-half mean N below 50% of that seed's FULLNS, or
  has any reseed (extinction).
- Among the rest, **pick** the one with the most FULL-ahead comparisons: Lu(FULL) strictly greater than Lu(NOAC), Lu(RAND),
  Lu(RANDN) and Lu(SHUF), on 3 seeds (12 possible).
- **Ties** go to the higher mean late structure-income share of FULL.
- If every design is disqualified, the least-bad one by the same count goes to the longer check, flagged as disqualified.
- The chosen design runs at **450k on fresh trial seeds 83, 84, 85** (all six arms).

## Go criterion for proposing a deciding round (fixed before any result)
On **all 3** longer-check trial seeds (83–85, 450k), all of the following must hold:
- Lu(FULL) > Lu(NOAC), Lu(RAND), Lu(RANDN) and Lu(SHUF) on late-half Lu;
- the late trend of FULL is ≥ 0;
- FULL's late structure share of income ((catalysis + channels + build energy) / niche income) is ≥ 10%;
- the population survives in every scarcity arm: no reseed, and late N ≥ 50% of FULLNS.

Otherwise: **no-go**.

## Log

### Step 1: D1–D3 at 150k, trial seeds 80–82 (appended by waiter 2026-10-03 08:36 BST)
**D1** ("SCAR_T":100000,"SCAR_MIN":0.25)
```
arm seed | ticks | windows | Lu late | trend | used ever | founds/10k (organism) | random founds/10k | all builds | compounds made | max live | cap hits | active builders mid->end | struct income late | stock late | wall s | N late mean | N min (whole run) | reseeds | new used per window
FULL 80 | 150000 | 15 | 0.13 | -0.060 | 5 | 10.8 | 0.0 | 11960 | 220 | 20 | 0 | 0.084->0.062 | 0.0% | 0.105 | 1197.3 | 1403 | 609 | 0 | 0,1,2,1,0,0,0,0,1,0,0,0,0,0,0
NOAC 80 | 150000 | 15 | 0.13 | -0.060 | 1 | 1.5 | 0.0 | 84 | 47 | 9 | 0 | 0.025->0.060 | 0.0% | 0.000 | 1149.9 | 1438 | 609 | 0 | 0,0,0,0,0,0,0,0,1,0,0,0,0,0,0
RAND 80 | 150000 | 15 | 0.00 | 0.000 | 3 | 0.0 | 10.8 | 3599 | 168 | 16 | 0 | 0.140->0.010 | 0.3% | 0.008 | 1225.7 | 1402 | 609 | 0 | 1,0,0,0,1,1,0,0,0,0,0,0,0,0,0
RANDN 80 | 150000 | 15 | 0.00 | 0.000 | 27 | 0.0 | 10.8 | 1640 | 182 | 25 | 0 | 0.005->0.042 | 0.0% | 0.000 | 1190.7 | 1340 | 609 | 0 | 0,3,17,6,1,0,0,0,0,0,0,0,0,0,0
SHUF 80 | 150000 | 15 | 1.88 | -0.012 | 28 | 61.7 | 0.0 | 4853 | 533 | 19 | 0 | 0.057->0.042 | 0.3% | 0.034 | 1241.8 | 1479 | 620 | 0 | 1,1,2,4,1,3,1,2,2,2,1,3,2,0,3
FULLNS 80 | 150000 | 15 | 1.38 | -0.512 | 18 | 32.2 | 0.0 | 6811 | 370 | 23 | 0 | 0.089->0.043 | 1.0% | 0.060 | 1181.8 | 1484 | 609 | 0 | 0,1,2,2,1,0,1,4,4,1,0,1,0,0,1
FULL 81 | 150000 | 15 | 1.50 | 0.310 | 16 | 27.1 | 0.0 | 1193 | 230 | 16 | 0 | 0.015->0.031 | 0.0% | 0.009 | 939.1 | 1217 | 607 | 0 | 0,0,1,1,0,0,2,0,2,2,0,0,2,3,3
NOAC 81 | 150000 | 15 | 0.13 | 0.036 | 1 | 1.1 | 0.0 | 234 | 8 | 4 | 0 | 0.156->0.022 | 0.1% | 0.003 | 1103.2 | 1168 | 607 | 0 | 0,0,0,0,0,0,0,0,0,0,0,0,1,0,0
RAND 81 | 150000 | 15 | 2.13 | -0.464 | 30 | 0.0 | 26.9 | 472 | 321 | 21 | 0 | 0.192->0.008 | 0.3% | 0.004 | 1254.1 | 1056 | 607 | 0 | 1,2,2,3,2,3,0,2,3,3,7,1,0,1,0
RANDN 81 | 150000 | 15 | 0.25 | 0.095 | 2 | 0.0 | 27.1 | 477 | 411 | 22 | 0 | 0.012->0.003 | 0.0% | 0.003 | 1248.3 | 1223 | 607 | 0 | 0,0,0,0,0,0,0,0,0,0,0,1,0,0,1
SHUF 81 | 150000 | 15 | 0.00 | 0.000 | 11 | 6.3 | 0.0 | 7110 | 149 | 12 | 0 | 0.019->0.048 | 0.0% | 0.051 | 1368.3 | 1208 | 606 | 0 | 5,4,1,0,0,1,0,0,0,0,0,0,0,0,0
FULLNS 81 | 150000 | 15 | 1.88 | 0.012 | 18 | 21.6 | 0.0 | 8065 | 273 | 20 | 0 | 0.244->0.016 | 0.6% | 0.095 | 962.6 | 1189 | 607 | 0 | 0,0,1,1,0,0,1,2,0,2,2,6,1,0,2
FULL 82 | 150000 | 15 | 2.00 | 0.333 | 27 | 47.8 | 0.0 | 8871 | 377 | 25 | 0 | 0.130->0.041 | 0.1% | 0.075 | 1233.9 | 1180 | 598 | 0 | 3,1,1,2,2,1,1,1,1,1,1,4,2,4,2
NOAC 82 | 150000 | 15 | 0.00 | 0.000 | 0 | 0.5 | 0.0 | 10 | 8 | 2 | 0 | 0.119->0.096 | 0.0% | 0.000 | 994.9 | 1107 | 598 | 0 | 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
RAND 82 | 150000 | 15 | 1.13 | 0.036 | 19 | 0.0 | 47.8 | 6408 | 562 | 48 | 0 | 0.356->0.035 | 20.2% | 0.061 | 1187.4 | 931 | 598 | 0 | 2,1,1,2,2,1,1,1,0,3,0,1,2,1,1
RANDN 82 | 150000 | 15 | 0.50 | -0.048 | 21 | 0.0 | 47.7 | 4881 | 752 | 203 | 0 | 0.015->0.043 | 0.0% | 0.025 | 1135.5 | 1124 | 598 | 0 | 0,3,3,2,4,4,1,1,0,0,0,3,0,0,0
SHUF 82 | 150000 | 15 | 0.13 | -0.012 | 7 | 10.0 | 0.0 | 5672 | 283 | 15 | 0 | 0.018->0.068 | 0.0% | 0.047 | 1185.1 | 1212 | 598 | 0 | 2,2,1,1,0,0,0,0,0,0,1,0,0,0,0
FULLNS 82 | 150000 | 15 | 0.38 | 0.012 | 12 | 31.9 | 0.0 | 2248 | 135 | 16 | 0 | 0.009->0.004 | 0.0% | 0.004 | 1161.8 | 1230 | 598 | 0 | 3,1,2,2,0,1,0,0,0,1,0,1,1,0,0

FEASIBILITY (no verdict weight): FULL vs each other arm on Lu, per seed
seed 80: FULL Lu 0.13 trend -0.060 | NOAC 0.13 (FULL not ahead) | RAND 0.00 (FULL ahead) | RANDN 0.00 (FULL ahead) | SHUF 1.88 (FULL not ahead) | FULLNS 1.38 (FULL not ahead)
seed 81: FULL Lu 1.50 trend 0.310 | NOAC 0.13 (FULL ahead) | RAND 2.13 (FULL not ahead) | RANDN 0.25 (FULL ahead) | SHUF 0.00 (FULL ahead) | FULLNS 1.88 (FULL not ahead)
seed 82: FULL Lu 2.00 trend 0.333 | NOAC 0.00 (FULL ahead) | RAND 1.13 (FULL ahead) | RANDN 0.50 (FULL ahead) | SHUF 0.13 (FULL ahead) | FULLNS 0.38 (FULL ahead)
```
**D2** ("SCAR_T":100000,"SCAR_MIN":0.25,"SCAR_ALPHA":0.8)
```
arm seed | ticks | windows | Lu late | trend | used ever | founds/10k (organism) | random founds/10k | all builds | compounds made | max live | cap hits | active builders mid->end | struct income late | stock late | wall s | N late mean | N min (whole run) | reseeds | new used per window
FULL 80 | 150000 | 15 | 0.00 | 0.000 | 4 | 9.1 | 0.0 | 13650 | 142 | 17 | 0 | 0.156->0.038 | 0.0% | 0.117 | 982 | 1300 | 609 | 0 | 0,1,3,0,0,0,0,0,0,0,0,0,0,0,0
NOAC 80 | 150000 | 15 | 0.00 | 0.000 | 0 | 0.9 | 0.0 | 28 | 19 | 9 | 0 | 0.014->0.015 | 0.0% | 0.000 | 1101.6 | 1401 | 609 | 0 | 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
RAND 80 | 150000 | 15 | 0.00 | 0.000 | 4 | 0.0 | 9.1 | 7013 | 136 | 14 | 0 | 0.026->0.316 | 0.0% | 0.022 | 1375.7 | 1291 | 609 | 0 | 1,0,1,1,0,0,1,0,0,0,0,0,0,0,0
RANDN 80 | 150000 | 15 | 0.00 | 0.000 | 18 | 0.0 | 9.1 | 7834 | 151 | 19 | 0 | 0.090->0.056 | 3.7% | 0.035 | 1293.4 | 1259 | 609 | 0 | 0,3,9,2,2,1,1,0,0,0,0,0,0,0,0
SHUF 80 | 150000 | 15 | 0.88 | -0.321 | 17 | 34.0 | 0.0 | 5143 | 354 | 18 | 0 | 0.062->0.025 | 0.0% | 0.050 | 1329.8 | 1240 | 620 | 0 | 1,1,1,0,4,1,2,1,3,2,0,1,0,0,0
FULLNS 80 | 150000 | 15 | 1.38 | -0.512 | 18 | 32.2 | 0.0 | 6811 | 370 | 23 | 0 | 0.089->0.043 | 1.0% | 0.060 | 1181.8 | 1484 | 609 | 0 | 0,1,2,2,1,0,1,4,4,1,0,1,0,0,1
FULL 81 | 150000 | 15 | 0.13 | -0.036 | 11 | 9.9 | 0.0 | 4244 | 117 | 12 | 0 | 0.118->0.028 | 0.1% | 0.061 | 925.2 | 1172 | 607 | 0 | 0,0,1,4,1,2,2,0,0,1,0,0,0,0,0
NOAC 81 | 150000 | 15 | 0.13 | 0.083 | 1 | 1.1 | 0.0 | 61 | 33 | 11 | 0 | 0.040->0.043 | 0.0% | 0.000 | 1022.6 | 1182 | 607 | 0 | 0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
RAND 81 | 150000 | 15 | 0.75 | -0.381 | 26 | 0.0 | 9.9 | 1150 | 119 | 20 | 0 | 0.003->0.043 | 0.2% | 0.007 | 1161.6 | 825 | 607 | 0 | 1,2,1,5,1,7,3,2,3,1,0,0,0,0,0
RANDN 81 | 150000 | 15 | 0.75 | -0.333 | 18 | 0.0 | 9.9 | 1037 | 151 | 17 | 0 | 0.014->0.007 | 0.0% | 0.008 | 807 | 423 | 254 | 0 | 0,0,1,4,2,3,2,1,3,2,0,0,0,0,0
SHUF 81 | 150000 | 15 | 0.75 | 0.119 | 17 | 6.5 | 0.0 | 14279 | 185 | 20 | 0 | 0.177->0.058 | 0.9% | 0.139 | 1328.9 | 1118 | 606 | 0 | 5,4,2,0,0,0,0,0,0,1,1,2,0,1,1
FULLNS 81 | 150000 | 15 | 1.88 | 0.012 | 18 | 21.6 | 0.0 | 8065 | 273 | 20 | 0 | 0.244->0.016 | 0.6% | 0.095 | 962.6 | 1189 | 607 | 0 | 0,0,1,1,0,0,1,2,0,2,2,6,1,0,2
FULL 82 | 150000 | 15 | 1.13 | -0.202 | 18 | 48.0 | 0.0 | 9171 | 376 | 18 | 0 | 0.201->0.053 | 0.0% | 0.164 | 1173.4 | 1098 | 598 | 0 | 3,1,0,0,1,0,4,5,0,0,0,1,0,2,1
NOAC 82 | 150000 | 15 | 0.25 | 0.119 | 2 | 0.9 | 0.0 | 448 | 48 | 29 | 0 | 0.037->0.356 | 0.0% | 0.012 | 1123.3 | 879 | 598 | 0 | 0,0,0,0,0,0,0,0,0,0,0,0,0,2,0
RAND 82 | 150000 | 15 | 1.50 | 0.000 | 23 | 0.0 | 48.0 | 5417 | 549 | 48 | 0 | 0.068->0.325 | 1.9% | 0.070 | 1207 | 981 | 598 | 0 | 2,1,0,2,1,1,4,3,0,3,0,0,1,4,1
RANDN 82 | 150000 | 15 | 1.00 | 0.095 | 17 | 0.0 | 47.9 | 6224 | 773 | 203 | 0 | 0.024->0.049 | 0.0% | 0.067 | 1178.3 | 1038 | 598 | 0 | 0,3,0,2,1,0,3,2,1,0,0,0,1,2,2
SHUF 82 | 150000 | 15 | 0.88 | 0.083 | 14 | 42.5 | 0.0 | 6541 | 376 | 21 | 0 | 0.014->0.182 | 0.0% | 0.094 | 1220.6 | 973 | 598 | 0 | 2,2,0,0,0,2,1,0,0,2,2,0,1,1,1
FULLNS 82 | 150000 | 15 | 0.38 | 0.012 | 12 | 31.9 | 0.0 | 2248 | 135 | 16 | 0 | 0.009->0.004 | 0.0% | 0.004 | 1161.8 | 1230 | 598 | 0 | 3,1,2,2,0,1,0,0,0,1,0,1,1,0,0

FEASIBILITY (no verdict weight): FULL vs each other arm on Lu, per seed
seed 80: FULL Lu 0.00 trend 0.000 | NOAC 0.00 (FULL not ahead) | RAND 0.00 (FULL not ahead) | RANDN 0.00 (FULL not ahead) | SHUF 0.88 (FULL not ahead) | FULLNS 1.38 (FULL not ahead)
seed 81: FULL Lu 0.13 trend -0.036 | NOAC 0.13 (FULL not ahead) | RAND 0.75 (FULL not ahead) | RANDN 0.75 (FULL not ahead) | SHUF 0.75 (FULL not ahead) | FULLNS 1.88 (FULL not ahead)
seed 82: FULL Lu 1.13 trend -0.202 | NOAC 0.25 (FULL ahead) | RAND 1.50 (FULL not ahead) | RANDN 1.00 (FULL ahead) | SHUF 0.88 (FULL ahead) | FULLNS 0.38 (FULL ahead)
```
**D3** ("SCAR_T":100000,"SCAR_MIN":0.1,"SCAR_ALPHA":0.8)
```
arm seed | ticks | windows | Lu late | trend | used ever | founds/10k (organism) | random founds/10k | all builds | compounds made | max live | cap hits | active builders mid->end | struct income late | stock late | wall s | N late mean | N min (whole run) | reseeds | new used per window
FULL 80 | 150000 | 15 | 0.25 | -0.024 | 7 | 10.3 | 0.0 | 4445 | 164 | 16 | 0 | 0.051->0.016 | 0.0% | 0.036 | 930.4 | 1191 | 609 | 0 | 0,1,2,1,1,0,0,0,0,1,0,1,0,0,0
NOAC 80 | 150000 | 15 | 0.00 | 0.000 | 0 | 1.3 | 0.0 | 20 | 19 | 2 | 0 | 0.077->0.061 | 0.0% | 0.000 | 1049.8 | 1277 | 609 | 0 | 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
RAND 80 | 150000 | 15 | 0.00 | 0.000 | 2 | 0.0 | 10.3 | 592 | 122 | 25 | 0 | 0.033->0.002 | 0.0% | 0.000 | 1440.6 | 1374 | 609 | 0 | 1,0,0,1,0,0,0,0,0,0,0,0,0,0,0
RANDN 80 | 150000 | 15 | 0.00 | 0.000 | 10 | 0.0 | 10.3 | 404 | 155 | 39 | 0 | 0.045->0.013 | 0.0% | 0.000 | 1329.1 | 1270 | 609 | 0 | 0,3,4,2,1,0,0,0,0,0,0,0,0,0,0
SHUF 80 | 150000 | 15 | 0.88 | -0.417 | 18 | 27.4 | 0.0 | 9676 | 301 | 25 | 0 | 0.140->0.098 | 1.6% | 0.164 | 1310 | 1054 | 620 | 0 | 1,1,3,2,1,1,2,4,1,1,0,1,0,0,0
FULLNS 80 | 150000 | 15 | 1.38 | -0.512 | 18 | 32.2 | 0.0 | 6811 | 370 | 23 | 0 | 0.089->0.043 | 1.0% | 0.060 | 1181.8 | 1484 | 609 | 0 | 0,1,2,2,1,0,1,4,4,1,0,1,0,0,1
FULL 81 | 150000 | 15 | 1.25 | -0.071 | 10 | 21.8 | 0.0 | 3626 | 174 | 15 | 0 | 0.007->0.188 | 4.2% | 0.084 | 827 | 941 | 607 | 0 | 0,0,0,0,0,0,0,0,1,2,3,2,2,0,0
NOAC 81 | 150000 | 15 | 0.13 | 0.012 | 2 | 0.3 | 0.0 | 1525 | 17 | 8 | 0 | 0.128->0.040 | 0.0% | 0.033 | 776.9 | 934 | 591 | 0 | 0,0,0,0,0,0,1,0,0,0,0,1,0,0,0
RAND 81 | 150000 | 15 | 1.50 | 0.190 | 22 | 0.0 | 21.8 | 1823 | 310 | 24 | 0 | 0.017->0.010 | 0.1% | 0.018 | 1323 | 1102 | 607 | 0 | 1,2,2,2,1,1,1,2,1,0,1,1,2,3,2
RANDN 81 | 150000 | 15 | 3.13 | 0.226 | 26 | 0.0 | 21.8 | 1964 | 333 | 29 | 0 | 0.087->0.130 | 0.0% | 0.030 | 1218.6 | 852 | 607 | 0 | 0,0,0,0,1,0,0,2,1,3,2,7,4,6,0
SHUF 81 | 150000 | 15 | 0.38 | 0.179 | 16 | 6.2 | 0.0 | 4582 | 90 | 9 | 0 | 0.020->0.058 | 0.0% | 0.068 | 1218.7 | 861 | 606 | 0 | 5,4,3,0,0,0,1,0,0,0,0,0,1,1,1
FULLNS 81 | 150000 | 15 | 1.88 | 0.012 | 18 | 21.6 | 0.0 | 8065 | 273 | 20 | 0 | 0.244->0.016 | 0.6% | 0.095 | 962.6 | 1189 | 607 | 0 | 0,0,1,1,0,0,1,2,0,2,2,6,1,0,2
FULL 82 | 150000 | 15 | 0.38 | -0.060 | 15 | 32.2 | 0.0 | 2647 | 154 | 18 | 0 | 0.056->0.007 | 0.0% | 0.028 | 1101.6 | 985 | 598 | 0 | 3,1,1,1,3,3,0,1,0,0,0,2,0,0,0
NOAC 82 | 150000 | 15 | 0.38 | -0.107 | 4 | 1.1 | 0.0 | 362 | 48 | 12 | 0 | 0.035->0.062 | 0.1% | 0.008 | 999 | 1040 | 598 | 0 | 0,0,0,0,0,1,0,1,0,0,2,0,0,0,0
RAND 82 | 150000 | 15 | 1.13 | -0.179 | 24 | 0.0 | 32.2 | 639 | 296 | 48 | 0 | 0.013->0.006 | 0.0% | 0.001 | 1286.1 | 985 | 598 | 0 | 2,1,0,0,7,4,1,2,1,2,0,3,0,0,1
RANDN 82 | 150000 | 15 | 0.13 | -0.083 | 9 | 0.0 | 32.1 | 693 | 487 | 203 | 0 | 0.053->0.017 | 0.0% | 0.001 | 1134.9 | 929 | 598 | 0 | 0,3,0,0,2,1,2,1,0,0,0,0,0,0,0
SHUF 82 | 150000 | 15 | 0.50 | 0.119 | 17 | 30.3 | 0.0 | 7362 | 306 | 22 | 0 | 0.099->0.008 | 0.0% | 0.092 | 1265.4 | 1010 | 598 | 0 | 2,2,0,1,3,4,1,1,0,0,0,0,0,2,1
FULLNS 82 | 150000 | 15 | 0.38 | 0.012 | 12 | 31.9 | 0.0 | 2248 | 135 | 16 | 0 | 0.009->0.004 | 0.0% | 0.004 | 1161.8 | 1230 | 598 | 0 | 3,1,2,2,0,1,0,0,0,1,0,1,1,0,0

FEASIBILITY (no verdict weight): FULL vs each other arm on Lu, per seed
seed 80: FULL Lu 0.25 trend -0.024 | NOAC 0.00 (FULL ahead) | RAND 0.00 (FULL ahead) | RANDN 0.00 (FULL ahead) | SHUF 0.88 (FULL not ahead) | FULLNS 1.38 (FULL not ahead)
seed 81: FULL Lu 1.25 trend -0.071 | NOAC 0.13 (FULL ahead) | RAND 1.50 (FULL not ahead) | RANDN 3.13 (FULL not ahead) | SHUF 0.38 (FULL ahead) | FULLNS 1.88 (FULL not ahead)
seed 82: FULL Lu 0.38 trend -0.060 | NOAC 0.38 (FULL not ahead) | RAND 1.13 (FULL not ahead) | RANDN 0.13 (FULL ahead) | SHUF 0.50 (FULL not ahead) | FULLNS 0.38 (FULL not ahead)
```
Design rule:
```
a2-D1-150k: FULL-ahead 9/12, FULL late structure income 0.0%, qualified
a2-D2-150k: FULL-ahead 3/12, FULL late structure income 0.0%, DISQUALIFIED (RANDN81 N 423 < 50% of FULLNS 1189)
a2-D3-150k: FULL-ahead 6/12, FULL late structure income 1.4%, qualified
CHOSEN a2-D1-150k
```
