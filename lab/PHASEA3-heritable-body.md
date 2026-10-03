# PHASE A3: heritable body (internalised, inherited catalysts)

Branch `cos/heritable-body`, from `cos/scarcity` (b937cfe). **Trial seeds only (70–75). No deciding pre-registration, no
deciding seed has been run.** Each arm is run once per seed. Raw readouts are in `lab/autocat/trial/a3-*`.

## Why
Five rounds (niche v1–v3, skin, autocatalysis, plus scarcity A2) agree on two things:
- Structures placed in the world behave as public goods that random placement matches.
- They never became a way to make a living (about 0–0.1% of late income).

The audit's plateau cause is a fixed menu. So: internalise. Put a heritable, extensible set of catalysts in the BODY,
inherited with copy errors. That expands the menu the way a genome does.

## Mechanism: `HBODY` + `BODY_*` in lab/oee-core.js (HBODY 1 switches it on; BODY itself is the existing birth-energy constant) (off by default; byte-identical when unset, see check below)
- Each organism carries up to BODY_MAX catalysts. Each catalyst is one reaction q → t.
- **Running:** every tick, each catalyst turns BODY_F of the cell's q into t. The organism keeps the energy released, only when
  0 < e(q) − e(t) ≤ CHEM_DMAX (the same small-step rule as METAB). So energy is conserved: it comes only from molecules that are
  there. Only the carrier benefits.
- **Upkeep:** BODY_UP per catalyst per tick, dissipated like instruction costs. It scales with body size.
- **Birth:** the child copies its parent's body with copy errors, from its own RNG stream:
  - per catalyst, with BODY_MUT, its product is redrawn (half the time its substrate too);
  - with BODY_DUP, a random catalyst is duplicated;
  - with BODY_DEL, one is deleted;
  - with BODY_CAP, the child **captures** a new catalyst. Its substrate is the species the parent last MADE (the product of its
    last METAB or body reaction). Its product is drawn from that species' whole downhill band (about 65k possible reactions,
    against the base network's 1,024).
- No compound is named anywhere. Novelty is never paid as such.
- Defaults: BODY_MAX 8, BODY_F 0.2, BODY_UP 0.0005, MUT 0.01, DUP 0.01, DEL 0.01, CAP 0.02.
- The world is CHEM (256-species network) + BODY. No external structures are used.

## Arms
- **FULL:** CHEM + HBODY 1 (+ the design's settings).
- **NOINH:** BODY_INH 0. The body resets at birth; the child keeps only what it captures itself.
- **RANDCAP:** BODY_RCAP 1. A captured catalyst's substrate is a uniformly random species, not what the parent made.
- **SHUF:** BODY_SHUF 1. The child copies the body of a random living organism instead of its parent's.
- **FIXED:** BODY_FIXED 1. Every new or mutated catalyst is one of the base network's 1,024 reactions (no menu expansion).
- **BASE:** CHEM only (population reference, not a null).

## Metric (fixed before any result: `lab/autocat/body-trial.js`)
- A body catalyst is **used** in a window when its mean share of chemical income (base METAB + body) is ≥ 1%, OR it is carried
  by ≥ 1% of organisms. This is the same rule as the compound measure of earlier rounds.
- **Lu** = mean NEW used catalysts per window over the late half, plus its OLS trend.
- **Body income share (criterion)** = body / (base METAB + body + light taken directly), late half. This is stricter than earlier
  rounds' structure share, which left direct light out. The chemistry-only share is reported too.

## Designs for the 150k pick (trial seeds 70, 71, 72; WIN 10), all fixed before any result
- **B1:** defaults.
- **B2:** BODY_UP 0.002 (costly bodies: size must pay).
- **B3:** BODY_F 0.05, BODY_MAX 16 (weaker catalysts, room for larger bodies).

## Design-choice rule (fixed before any result: `body-check.js pick`)
- **Disqualify** a design if, on any seed, any of FULL/NOINH/RANDCAP/SHUF/FIXED reseeds (goes extinct) or has late mean N
  below 50% of BASE.
- Among the rest, **pick** the most FULL-ahead comparisons: Lu(FULL) strictly greater than each of the 4 nulls, on 3 seeds
  (12 possible).
- **Ties** go to the higher mean FULL body share.
- If every design is disqualified, the least-bad one goes forward, flagged.
- The chosen design runs at **450k on fresh trial seeds 73, 74, 75** (WIN 15), all arms + BASE.

## Go criterion for proposing a deciding round (fixed before any result: `body-check.js go`)
On **all 3** of seeds 73–75, all of the following must hold:
- Lu(FULL) > Lu(NOINH), Lu(RANDCAP), Lu(SHUF) and Lu(FIXED);
- FULL's late trend is ≥ 0;
- FULL's late body share of ALL income is ≥ 10%;
- the population survives in every body arm: no reseed, and late N ≥ 50% of BASE.

Otherwise: **no-go**.

## Smoke test (seed 71, 20k ticks, defaults, HBODY 1; not a trial result)
| ticks | N | mean body size | body share of chemical income | body share of all income |
|---|---|---|---|---|
| 5k | 979 | 1.8 | 69% | 23% |
| 10k | 707 | 4.8 | 77% | 33% |
| 20k | 1,181 | 7.4 | 79% | 37% |

This only shows the mechanism runs and pays. It says nothing about the nulls.

Note: a first smoke run used the name BODY, which collides with the existing birth-energy constant BODY (0.4). It was
invalid and discarded, and the knob was renamed HBODY before any trial. The byte-identity check below was run after the rename.

Byte-identity with HBODY unset: identical to origin/main (default, CHEM, CHEM+VIRUS, TASKS, CHEM_BIG) and to cos/skin
(NICHE 2, v3 W1, skin S1, S2). Output: `lab/autocat/trial/a3-bytecheck.txt`.

## Log

### Stage 1: B1–B3 at 150k, trial seeds 70–72 (appended by waiter 2026-10-03 11:22 BST)
**B1** (defaults)
```
arm seed | ticks | windows | Lu late (new used body catalysts/window) | trend | used ever | body share of ALL late income (incl. direct light) | body share of chemical income | mean body size late | catalyst kinds late | N late | N min | reseeds | wall s | new used per window
FULL 70 | 150000 | 15 | 44.50 | 2.929 | 584 | 30.6% | 70.4% | 7.67 | 233 | 1008 | 81 | 0 | 614.6 | 15,24,46,29,36,38,40,43,28,44,39,41,52,51,58
NOINH 70 | 150000 | 15 | 0.00 | 0.000 | 3 | 1.5% | 4.2% | 0.02 | 21 | 1103 | 81 | 0 | 507.6 | 1,1,0,1,0,0,0,0,0,0,0,0,0,0,0
RANDCAP 70 | 150000 | 15 | 45.75 | -2.976 | 635 | 37.9% | 86.8% | 7.62 | 239 | 1056 | 81 | 0 | 584.4 | 5,23,40,48,58,54,41,73,45,52,40,33,32,42,49
SHUF 70 | 150000 | 15 | 16.25 | -2.071 | 270 | 33.7% | 75.7% | 4.35 | 175 | 1078 | 81 | 0 | 607.2 | 14,27,25,24,17,17,16,25,14,26,15,15,19,10,6
FIXED 70 | 150000 | 15 | 17.00 | -1.690 | 273 | 43.7% | 91.8% | 7.74 | 119 | 970 | 81 | 0 | 507.6 | 17,17,23,15,24,20,21,20,23,20,24,11,18,4,16
BASE 70 | 150000 | 15 | 0.00 | 0.000 | 0 | 0.0% | 0.0% | 0.00 | 0 | 1157 | 81 | 0 | 418.8 | 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
FULL 71 | 150000 | 15 | 31.50 | 0.357 | 488 | 35.9% | 78.7% | 7.49 | 247 | 1286 | 286 | 0 | 622.3 | 22,28,39,48,33,34,32,34,32,22,32,26,50,21,35
NOINH 71 | 150000 | 15 | 0.00 | 0.000 | 4 | 1.3% | 3.5% | 0.02 | 27 | 1379 | 286 | 0 | 541.5 | 1,1,2,0,0,0,0,0,0,0,0,0,0,0,0
RANDCAP 71 | 150000 | 15 | 40.25 | -1.071 | 608 | 33.9% | 72.2% | 7.55 | 278 | 1284 | 288 | 0 | 635.7 | 18,37,38,56,49,47,41,42,42,40,40,46,47,34,31
SHUF 71 | 150000 | 15 | 12.13 | -0.869 | 248 | 26.0% | 55.1% | 3.54 | 187 | 1394 | 286 | 0 | 607.2 | 19,34,31,18,15,13,21,15,12,14,15,17,5,8,11
FIXED 71 | 150000 | 15 | 19.13 | 0.702 | 271 | 34.8% | 75.5% | 7.46 | 147 | 1213 | 286 | 0 | 514.2 | 9,13,13,22,21,20,20,17,9,19,22,27,24,21,14
BASE 71 | 150000 | 15 | 0.00 | 0.000 | 0 | 0.0% | 0.0% | 0.00 | 0 | 1579 | 286 | 0 | 500.7 | 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
FULL 72 | 150000 | 15 | 47.63 | 1.512 | 572 | 36.1% | 92.7% | 7.53 | 235 | 1006 | 351 | 0 | 535.7 | 1,18,32,27,40,36,37,38,49,38,49,60,49,46,52
NOINH 72 | 150000 | 15 | 0.00 | 0.000 | 24 | 1.6% | 4.5% | 0.02 | 23 | 1183 | 351 | 0 | 466.7 | 1,18,4,1,0,0,0,0,0,0,0,0,0,0,0
RANDCAP 72 | 150000 | 15 | 48.38 | 0.464 | 630 | 22.1% | 49.2% | 6.94 | 249 | 1116 | 352 | 0 | 530.8 | 6,18,27,47,45,52,48,45,49,46,47,43,60,59,38
SHUF 72 | 150000 | 15 | 35.75 | -3.952 | 526 | 34.7% | 78.7% | 6.68 | 272 | 1096 | 351 | 0 | 544 | 1,28,45,38,37,53,38,49,51,35,44,26,35,19,27
FIXED 72 | 150000 | 15 | 16.88 | -0.107 | 262 | 44.9% | 96.2% | 7.62 | 143 | 1114 | 351 | 0 | 451.2 | 1,17,23,19,19,23,25,20,21,13,11,17,18,15,20
BASE 72 | 150000 | 15 | 0.00 | 0.000 | 0 | 0.0% | 0.0% | 0.00 | 0 | 1289 | 351 | 0 | 395.7 | 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
```
**B2** (,"BODY_UP":0.002)
```
arm seed | ticks | windows | Lu late (new used body catalysts/window) | trend | used ever | body share of ALL late income (incl. direct light) | body share of chemical income | mean body size late | catalyst kinds late | N late | N min | reseeds | wall s | new used per window
FULL 70 | 150000 | 15 | 14.25 | -2.690 | 223 | 17.5% | 37.2% | 2.69 | 102 | 1052 | 81 | 0 | 542.3 | 8,11,19,22,19,13,17,27,20,21,8,14,7,10,7
NOINH 70 | 150000 | 15 | 0.00 | 0.000 | 2 | 0.4% | 0.8% | 0.02 | 20 | 1265 | 81 | 0 | 564.4 | 0,2,0,0,0,0,0,0,0,0,0,0,0,0,0
RANDCAP 70 | 150000 | 15 | 17.63 | -1.417 | 214 | 30.9% | 67.3% | 3.71 | 112 | 895 | 80 | 0 | 528.5 | 12,15,9,17,7,9,4,18,22,20,24,19,16,10,12
SHUF 70 | 150000 | 15 | 3.25 | -0.619 | 86 | 31.0% | 65.7% | 2.33 | 75 | 954 | 81 | 0 | 554.2 | 10,14,8,7,5,7,9,6,4,4,3,5,1,2,1
FIXED 70 | 150000 | 15 | 12.25 | -1.238 | 167 | 41.6% | 89.0% | 5.62 | 78 | 776 | 81 | 0 | 394.3 | 9,17,12,2,7,8,14,10,20,17,14,12,9,10,6
BASE 70 | 150000 | 15 | 0.00 | 0.000 | 0 | 0.0% | 0.0% | 0.00 | 0 | 1157 | 81 | 0 | 418.8 | 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
FULL 71 | 150000 | 15 | 6.50 | 0.143 | 147 | 29.7% | 61.8% | 2.86 | 90 | 1205 | 286 | 0 | 534.4 | 26,13,14,7,14,13,8,8,9,5,4,2,5,9,10
NOINH 71 | 150000 | 15 | 0.00 | 0.000 | 0 | 2.8% | 9.4% | 0.02 | 24 | 1159 | 286 | 0 | 458.1 | 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
RANDCAP 71 | 150000 | 15 | 13.50 | 0.190 | 233 | 26.6% | 57.9% | 3.11 | 107 | 1010 | 415 | 0 | 497.3 | 19,26,28,13,12,15,12,15,14,16,10,7,12,16,18
SHUF 71 | 150000 | 15 | 3.13 | -0.488 | 85 | 24.0% | 50.0% | 1.78 | 82 | 1223 | 286 | 0 | 544.6 | 3,15,15,10,7,7,3,4,5,3,5,3,2,2,1
FIXED 71 | 150000 | 15 | 6.50 | 0.190 | 113 | 35.7% | 76.2% | 4.17 | 69 | 1045 | 286 | 0 | 431.4 | 14,6,8,14,4,6,9,4,8,5,9,7,4,8,7
BASE 71 | 150000 | 15 | 0.00 | 0.000 | 0 | 0.0% | 0.0% | 0.00 | 0 | 1579 | 286 | 0 | 500.7 | 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
FULL 72 | 150000 | 15 | 14.13 | 0.202 | 202 | 43.7% | 95.6% | 4.74 | 110 | 866 | 351 | 0 | 459.3 | 1,15,21,19,8,10,15,20,8,12,9,19,16,14,15
NOINH 72 | 150000 | 15 | 0.50 | 0.143 | 52 | 5.4% | 25.2% | 0.02 | 20 | 954 | 351 | 0 | 428.5 | 1,24,11,4,7,0,1,0,1,0,0,0,0,2,1
RANDCAP 72 | 150000 | 15 | 12.13 | 0.631 | 185 | 24.9% | 54.6% | 2.10 | 90 | 1031 | 356 | 0 | 454.8 | 8,14,5,15,13,19,14,11,15,7,13,9,10,12,20
SHUF 72 | 150000 | 15 | 2.38 | -0.131 | 59 | 31.1% | 69.3% | 2.22 | 80 | 1015 | 351 | 0 | 434.8 | 1,14,10,5,8,2,0,3,0,5,4,1,1,5,0
FIXED 72 | 150000 | 15 | 4.50 | -0.929 | 115 | 35.3% | 75.8% | 4.54 | 59 | 917 | 351 | 0 | 383.1 | 1,20,8,12,8,13,17,9,8,3,5,4,3,1,3
BASE 72 | 150000 | 15 | 0.00 | 0.000 | 0 | 0.0% | 0.0% | 0.00 | 0 | 1289 | 351 | 0 | 395.7 | 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
```
**B3** (,"BODY_F":0.05,"BODY_MAX":16)
```
arm seed | ticks | windows | Lu late (new used body catalysts/window) | trend | used ever | body share of ALL late income (incl. direct light) | body share of chemical income | mean body size late | catalyst kinds late | N late | N min | reseeds | wall s | new used per window
FULL 70 | 150000 | 15 | 84.00 | 0.333 | 970 | 14.6% | 35.2% | 12.66 | 361 | 879 | 81 | 0 | 582.1 | 9,27,40,55,45,52,70,84,69,79,109,83,81,94,73
NOINH 70 | 150000 | 15 | 0.00 | 0.000 | 0 | 0.2% | 0.4% | 0.02 | 20 | 1182 | 81 | 0 | 509.4 | 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
RANDCAP 70 | 150000 | 15 | 49.50 | 1.429 | 659 | 22.1% | 46.6% | 7.20 | 280 | 1087 | 81 | 0 | 590 | 8,47,34,40,52,41,41,63,42,27,52,46,51,50,65
SHUF 70 | 150000 | 15 | 27.75 | -4.762 | 394 | 23.9% | 55.7% | 5.39 | 227 | 1087 | 81 | 0 | 596.9 | 8,19,28,30,32,23,32,38,58,16,29,30,30,17,4
FIXED 70 | 150000 | 15 | 37.75 | -3.333 | 573 | 30.1% | 63.8% | 15.11 | 268 | 894 | 81 | 0 | 506.7 | 16,41,32,41,54,34,53,50,40,37,48,49,28,27,23
BASE 70 | 150000 | 15 | 0.00 | 0.000 | 0 | 0.0% | 0.0% | 0.00 | 0 | 1157 | 81 | 0 | 418.8 | 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
FULL 71 | 150000 | 15 | 87.75 | 2.619 | 1048 | 17.7% | 41.1% | 13.36 | 391 | 967 | 286 | 0 | 617.7 | 16,29,41,40,57,82,81,72,81,80,101,94,94,83,97
NOINH 71 | 150000 | 15 | 0.00 | 0.000 | 0 | 0.4% | 0.9% | 0.02 | 28 | 1480 | 286 | 0 | 555.5 | 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
RANDCAP 71 | 150000 | 15 | 49.50 | 1.024 | 742 | 36.4% | 79.1% | 10.24 | 361 | 1186 | 288 | 0 | 617 | 23,50,62,55,62,42,52,44,48,43,58,49,52,49,53
SHUF 71 | 150000 | 15 | 24.88 | -1.155 | 359 | 27.7% | 64.0% | 5.69 | 250 | 1256 | 286 | 0 | 602.7 | 12,33,25,23,27,21,19,27,35,20,20,31,24,25,17
FIXED 71 | 150000 | 15 | 32.75 | -3.071 | 411 | 26.8% | 58.9% | 12.06 | 248 | 1124 | 286 | 0 | 531.7 | 10,17,13,19,23,30,37,39,50,39,34,27,21,19,33
BASE 71 | 150000 | 15 | 0.00 | 0.000 | 0 | 0.0% | 0.0% | 0.00 | 0 | 1579 | 286 | 0 | 500.7 | 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
FULL 72 | 150000 | 15 | 56.88 | 0.179 | 685 | 26.3% | 69.5% | 9.25 | 278 | 947 | 351 | 0 | 452.4 | 1,34,46,39,22,47,41,41,60,53,81,72,45,43,60
NOINH 72 | 150000 | 15 | 0.00 | 0.000 | 1 | 0.4% | 0.8% | 0.02 | 25 | 1263 | 351 | 0 | 427.3 | 1,0,0,0,0,0,0,0,0,0,0,0,0,0,0
RANDCAP 72 | 150000 | 15 | 53.50 | -0.452 | 658 | 15.9% | 34.4% | 6.80 | 292 | 1165 | 352 | 0 | 468.6 | 6,17,26,34,30,51,66,64,66,45,45,36,52,56,64
SHUF 72 | 150000 | 15 | 32.13 | 2.179 | 493 | 27.4% | 81.5% | 5.21 | 216 | 950 | 351 | 0 | 434.1 | 0,27,40,47,45,43,34,25,33,25,32,33,25,33,51
FIXED 72 | 150000 | 15 | 35.88 | -0.512 | 494 | 38.7% | 93.8% | 12.36 | 239 | 931 | 351 | 0 | 361 | 0,35,44,31,32,29,36,28,36,50,38,32,41,34,28
BASE 72 | 150000 | 15 | 0.00 | 0.000 | 0 | 0.0% | 0.0% | 0.00 | 0 | 1289 | 351 | 0 | 395.7 | 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
```
Design rule:
```
a3-B1-150k: FULL-ahead 9/12, FULL late body share 34.2%, qualified
a3-B2-150k: FULL-ahead 9/12, FULL late body share 30.3%, qualified
a3-B3-150k: FULL-ahead 12/12, FULL late body share 19.5%, qualified
CHOSEN a3-B3-150k
```

### Stage 2: B3 at 450k, fresh trial seeds 73–75, WIN 15 (appended 2026-10-03 12:16 BST)
```
arm seed | ticks | windows | Lu late (new used body catalysts/window) | trend | used ever | body share of ALL late income (incl. direct light) | body share of chemical income | mean body size late | catalyst kinds late | N late | N min | reseeds | wall s | new used per window
FULL 73 | 450000 | 30 | 85.53 | -2.482 | 2396 | 31.9% | 75.2% | 15.00 | 393 | 891 | 554 | 0 | 3110.5 | 8,46,48,58,94,89,94,88,75,97,86,91,69,86,84,94,100,99,93,89,112,104,86,90,56,55,82,83,65,75
NOINH 73 | 450000 | 30 | 0.00 | 0.000 | 1 | 0.1% | 0.2% | 0.02 | 24 | 1346 | 554 | 0 | 3022.1 | 1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
RANDCAP 73 | 450000 | 30 | 70.53 | -2.018 | 2483 | 29.2% | 65.3% | 13.37 | 387 | 980 | 441 | 0 | 3150.3 | 28,66,92,88,110,109,89,100,112,132,98,114,97,103,87,87,91,67,78,87,75,81,63,62,58,65,66,50,54,74
SHUF 73 | 450000 | 30 | 27.20 | 0.271 | 1059 | 31.6% | 75.5% | 6.82 | 264 | 1062 | 554 | 0 | 3115.2 | 2,26,38,50,44,37,51,53,50,44,38,68,41,53,56,33,30,27,30,14,25,23,28,28,22,14,31,32,38,33
FIXED 73 | 450000 | 30 | 15.07 | -0.764 | 871 | 18.7% | 40.7% | 13.04 | 241 | 962 | 554 | 0 | 2883.9 | 10,20,29,42,59,50,55,64,65,49,41,51,47,36,27,25,26,17,18,20,9,12,14,10,8,13,13,13,14,14
BASE 73 | 450000 | 30 | 0.00 | 0.000 | 0 | 0.0% | 0.0% | 0.00 | 0 | 1274 | 554 | 0 | 2548.8 | 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
FULL 74 | 450000 | 30 | 82.33 | -1.407 | 2529 | 26.9% | 60.1% | 14.40 | 398 | 964 | 91 | 0 | 3187.4 | 10,31,77,64,96,84,111,87,125,129,135,84,94,98,69,71,88,92,95,74,81,96,92,91,96,98,84,71,59,47
NOINH 74 | 450000 | 30 | 0.00 | 0.000 | 0 | 0.2% | 0.5% | 0.02 | 24 | 1518 | 91 | 0 | 3137.1 | 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
RANDCAP 74 | 450000 | 30 | 51.07 | -0.711 | 1534 | 19.2% | 41.9% | 7.93 | 316 | 1174 | 79 | 0 | 3223.1 | 26,37,55,68,53,55,51,51,50,48,44,50,53,66,61,51,49,55,62,52,53,68,68,42,38,40,36,39,63,50
SHUF 74 | 450000 | 30 | 19.40 | 0.139 | 681 | 25.0% | 59.4% | 5.17 | 237 | 1201 | 91 | 0 | 3181.1 | 9,35,24,22,19,29,30,18,23,42,29,26,32,25,27,25,13,15,27,23,20,31,11,13,9,10,12,19,30,33
FIXED 74 | 450000 | 30 | 16.67 | -2.011 | 811 | 8.9% | 19.0% | 9.84 | 217 | 1180 | 91 | 0 | 2999.5 | 16,34,34,35,54,32,19,40,40,40,45,42,50,42,38,30,22,24,29,22,31,17,18,16,16,8,6,3,7,1
BASE 74 | 450000 | 30 | 0.00 | 0.000 | 0 | 0.0% | 0.0% | 0.00 | 0 | 1483 | 91 | 0 | 2758 | 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
FULL 75 | 450000 | 30 | 98.27 | -1.039 | 2631 | 20.5% | 44.7% | 13.56 | 427 | 965 | 283 | 0 | 3222.1 | 13,39,50,48,53,57,72,92,110,95,92,116,125,98,97,113,103,134,90,95,93,83,79,97,113,94,89,89,118,84
NOINH 75 | 450000 | 30 | 0.00 | 0.000 | 0 | 0.1% | 0.3% | 0.02 | 25 | 1465 | 283 | 0 | 3033.5 | 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
RANDCAP 75 | 450000 | 30 | 47.60 | -2.736 | 1810 | 19.9% | 43.2% | 7.50 | 295 | 1149 | 286 | 0 | 3195.1 | 10,41,58,66,69,74,100,93,92,91,79,62,94,78,89,80,60,54,60,67,64,49,30,30,37,38,27,34,42,42
SHUF 75 | 450000 | 30 | 19.47 | -1.021 | 767 | 28.3% | 62.2% | 6.17 | 236 | 1171 | 283 | 0 | 3172.1 | 18,30,48,43,40,26,36,32,36,28,26,21,26,33,32,22,22,20,24,13,37,32,14,24,30,16,10,10,7,11
FIXED 75 | 450000 | 30 | 15.33 | -0.896 | 752 | 16.0% | 33.4% | 9.16 | 195 | 1111 | 283 | 0 | 2911.3 | 18,32,50,55,49,30,28,34,39,28,34,38,29,41,17,18,23,25,24,17,11,16,13,14,14,10,9,12,13,11
BASE 75 | 450000 | 30 | 0.00 | 0.000 | 0 | 0.0% | 0.0% | 0.00 | 0 | 1417 | 283 | 0 | 2679.7 | 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
```
Go criterion:
```
seed 73: FULL Lu 85.53 trend -2.482 body 31.9% N 891 | NOINH 0.00 RANDCAP 70.53 SHUF 27.20 FIXED 15.07 -> FAILS [trend>=0]
seed 74: FULL Lu 82.33 trend -1.407 body 26.9% N 964 | NOINH 0.00 RANDCAP 51.07 SHUF 19.40 FIXED 16.67 -> FAILS [trend>=0]
seed 75: FULL Lu 98.27 trend -1.039 body 20.5% N 965 | NOINH 0.00 RANDCAP 47.60 SHUF 19.47 FIXED 15.33 -> FAILS [trend>=0]
=> NO-GO.
```

## Phase A3b: why does used body novelty decline? (trial seeds only)

### Diagnosis
Data:
- the existing B3 450k runs (seeds 73–75), per 45k-tick window;
- `lab/autocat/diag3.js`: an exact, counter-instrumented copy of bodyBirth (the same RNG calls), rerunning B3 FULL on trial seeds
  73 and 74 for 250k ticks. Output: `trial/a3b-diag3-*.txt`.

Findings:
1. **The product space is exhausted (main cause).** With 256 species, the whole catalyst menu is the set of one-step downhill
   reactions: 16,573 / 16,446 / 16,643 on seeds 73 / 74 / 75. By 250k ticks the population had already tried 15,489 (93%) and
   16,064 (98%) of them. New never-seen catalysts per 25k window fell from about 3,000–3,900 (25k–50k) to 432 and 184
   (225k–250k). Mutation events rose over the same time (from about 1,250 to about 9,500–12,700 per window), so the copy
   errors increasingly remake catalysts already seen. This is the fixed-menu plateau again, one level up: the body's menu is
   bigger than the base network's, but it is still finite.
2. **The cap saturates (secondary cause).** In the 450k runs, FULL's mean body size reached 15.0–15.5 of 16 from about 150k
   on. In diag3, the share of births from a full parent rose to 0.4–0.6. Captures lost to a full body rose from 0 to about
   640–900 per 25k window, matching or exceeding the captures added (about 700–1,000).
3. **Captures do become used, at about twice the rate of mutations.** 11.6% / 13.2% of new capture-born catalysts were ever
   used, against 5.6% / 6.2% of mutation-born ones. But captures are only about 9% of new catalysts.
4. **No selective sweep.** Functional genotypes stay at about 150–210, and the top genotype's share stays at 0.06–0.10 (it
   rose to 0.25 late on seed 73 only).
5. **Upkeep pruning is minor.** Deletions are flat at about 600–900 per 25k window (the BODY_DEL rate). Bodies stay near the
   cap, so upkeep is not shrinking them.

### Fixes (chosen from the diagnosis, logged before any A3b trial)
Both keep the honesty constraints: energy is conserved, no compound or pathway is named, and novelty is never paid.
- **C1: pathway fusion** (BODY_FUSE 0.02, BODY_CHAIN 8, on top of B3). This targets cause 1.
  - At birth, with probability 0.02, two catalysts where one's product is the other's substrate fuse into one pathway catalyst
    q → … → u. It channels the intermediates (they never enter the cell, so neither neighbours nor diffusion take them) and pays
    e(q) − e(u).
  - A pathway's identity is its species sequence. So the catalyst space becomes sequences of up to 8 species, effectively
    inexhaustible, and fusion also frees a body slot.
  - A pathway mutates by redrawing its last product.
  - FIXED never fuses, so it keeps only the current one-step base menu.
- **C2: C1 plus an uncapped body with superlinear upkeep** (BODY_MAX 48, BODY_UPX 1.5, BODY_UPN 16). This targets cause 2.
  Upkeep per tick = BODY_UP × n × (n/16)^0.5, which equals A3's cost at n = 16, is cheaper below that, and gets steeply dearer
  above it.

Byte-identity: with BODY_FUSE 0 and BODY_UPX 1, an HBODY B3+SHUF run is identical to A3's code (33f208b), and the unset
configs are identical to main and cos/skin (`trial/a3b-bytecheck.txt`).

Smoke test (C1, seed 69, 30k; not a trial result): fusions happen (about 200 per 10k ticks), 6–13% of body catalysts are
pathways (mean length 3.2–3.8), the population is about 1,100, and the body share of all income is 29%.

### Design-choice rule and go criterion (logged before any A3b result)
- **Arms:** the same as A3 (FULL, NOINH, RANDCAP, SHUF, FIXED, plus BASE for population), each with the design's settings.
- **Pick:** C1 vs C2 at 150k on fresh trial seeds 60–62 (WIN 10), using the same rule as A3 (`body-check.js pick`):
  - disqualify a design if any body arm reseeds or has late N below 50% of BASE;
  - otherwise rank by FULL-ahead comparisons (out of 12), with ties going to the higher FULL body share.
- **Long check:** the chosen design runs at 450k on fresh trial seeds 63–65 (WIN 15).
- **Go criterion (unchanged, `body-check.js go`):** on all 3 of seeds 63–65, all of the following must hold:
  - FULL > NOINH, RANDCAP, SHUF and FIXED on late Lu;
  - FULL's late trend is ≥ 0;
  - FULL's body share of ALL late income is ≥ 10%;
  - every body arm survives (no reseed, late N ≥ 50% of BASE).

Otherwise: **no-go**.
