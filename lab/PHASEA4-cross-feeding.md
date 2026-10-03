# PHASE A4: cross-feeding (one lineage's waste is another's food)

Branch `cos/cross-feeding`, from `cos/heritable-body` (3b180b2). **Trial seeds only (50–55). No deciding pre-registration, no
deciding seed has been run.** Each arm is run once per seed. Raw readouts are in `lab/autocat/trial/a4-*`.

## Why
A3b (C1, pathway fusion) paid well (body share 32–41%) but lost to RANDCAP on all of seeds 63–65, with a negative trend on 2.
The user-approved next step is an ecosystem: if an organism's waste is a neighbour's food, the value of an invention depends on
what the neighbours produce, so the fitness landscape keeps shifting (a Red Queen through metabolism).

## Mechanism: `XFEED` in lab/oee-core.js (needs HBODY; off by default, byte-identical when unset)
- **Internal pool:** each organism gets a cytoplasm holding the 256 species.
- **Uptake:** every tick, for each body catalyst, it takes up XF_UPT (0.2) of the cell's substrate into the pool.
- **Catalysis:** catalysts run on the pool, converting BODY_F of the pool's substrate, not on the cell.
- **Waste and leak:** a species in the pool that none of its own catalysts consume is WASTE. XF_LEAK (0.1) of each waste
  species leaks into the cell per tick. There it diffuses and decays as usual, and it is food for any neighbour whose catalysts
  take it up.
- **Conservation:** the pool decays at the cell rate, is split in half at division, and is released into the cell at death, so
  energy is conserved.
- No compound is named and novelty is never paid.

Under A3/A3b a body catalyst acted on the cell directly. Under XFEED, an organism's products reach others only by leaking or at
its death.

## Cross-feeding measure (logged before results)
Leaked and death-released molecules carry a tag layer that diffuses, decays and is consumed with them. An organism never takes
up its own waste (waste is by definition what none of its own catalysts consume), so tagged uptake is material made by OTHER
organisms.

**Cross-feeding share** = body income made from tagged substrate / body income, late half.

Environmental heterogeneity (to check the world does not simply homogenise), both computed by energy content:
- the number of distinct dominant non-food species, each dominant in ≥ 1% of occupied cells;
- the entropy of that dominant-species distribution.

## Designs (all on top of A3b C1: B3 + BODY_FUSE 0.02), fixed before any result
- **X1:** XFEED 1, XF_UPT 0.2, XF_LEAK 0.1.
- **X2:** X1 + scarcity (SCAR_T 100000, SCAR_MIN 0.25: base METAB slows to a quarter from tick 20k to 120k). Intermediate
  species then come mainly from body waste rather than from base metabolism. Its BASE carries the same scarcity.

## Arms
- **FULL:** the design.
- **RANDCAP:** BODY_RCAP 1 (random capture substrates).
- **NOLEAK:** XF_LEAK 0. Waste stays private in the pool; only death releases it.
- **SHUFENV:** XF_SHUF 1. Each leaked portion enters the cell as a uniformly random species, with its amount scaled so the
  energy is the same.
- **NOINH:** BODY_INH 0.
- **FIXED:** BODY_FIXED 1 (one-step base reactions only, no fusion).
- **BASE:** CHEM (+ the design's scarcity); population reference only.

## Design-choice rule (fixed before any result: `body-check.js pick`, NULLS = RANDCAP NOLEAK SHUFENV NOINH FIXED)
- 150k on trial seeds 50–52, WIN 10.
- **Disqualify** a design if any body arm reseeds or has late N below 50% of its BASE.
- Otherwise **pick** the most FULL-ahead comparisons on late Lu (5 nulls × 3 seeds = 15).
- **Ties** go to the higher FULL body share.
- If all are disqualified, the least-bad goes forward, flagged.
- The chosen design runs at **450k on fresh trial seeds 53–55**, WIN 15.

## Go criterion (fixed before any result: `body-check.js go`)
On **all 3** of seeds 53–55, all of the following must hold:
- Lu(FULL) > Lu of each of RANDCAP, NOLEAK, SHUFENV, NOINH and FIXED (RANDCAP and SHUFENV are the key ones);
- FULL's late Lu trend is ≥ 0;
- FULL's body share of ALL late income (including direct light) is ≥ 10%;
- the population survives in every body arm: no reseed, and late N ≥ 50% of BASE.

Otherwise: **no-go**.

The cross-feeding share and heterogeneity are reported for every arm but carry no go weight.

## Byte-identity
- With XFEED unset, an HBODY C1+RANDCAP run is identical to A3b's code (3b180b2).
- The unset configs are identical to origin/main (default, CHEM, CHEM+VIRUS, TASKS, CHEM_BIG) and to cos/skin (NICHE 2, v3 W1,
  skin S1, S2).
- Output: `trial/a4-bytecheck.txt`. The only later code change is to the heterogeneity readout, which only reads state.

## Smoke test (X1, seed 59, 30k ticks; not a trial result; `trial/a4-smoke-*.txt`)
| arm | N | body share of all income | cross-feeding share | leaked energy / 1k ticks | dominant species |
|---|---|---|---|---|---|
| FULL | 1,239–1,339 | 15% → 31% | 32% → 9% | 20k–44k | 9–17 |
| NOLEAK | 1,207–1,296 | 11% → 31% | 23% → 9% (all from death release) | 0 | 13–18 |
| SHUFENV | 937–1,042 | 8% → 17% | 4–7% | 16k–65k | 1 (by amount; the readout now uses energy) |

Early cross-feeding is real but falls as bodies grow. Death release alone gives NOLEAK a similar share, so leak is not yet
clearly the main channel.

## Log

### Stage 1: X1–X2 at 150k, trial seeds 50–52 (appended by waiter 2026-10-03 17:18 BST)
**X1**
```
arm seed | ticks | windows | Lu late (new used body catalysts/window) | trend | used ever | body share of ALL late income (incl. direct light) | body share of chemical income | mean body size late | catalyst kinds late | N late | N min | reseeds | cross-feeding: share of body income from others' leaked/released substrate, late | env: distinct dominant species (>=1% of occupied cells) late | env dominant-species entropy late | wall s | new used per window
FULL 50 | 150000 | 15 | 31.13 | -0.917 | 483 | 31.5% | 71.1% | 5.92 | 221 | 1113 | 610 | 0 | 6.0% | 14.4 | 2.34 | 1791.9 | 16,36,39,38,38,29,38,33,37,26,28,35,40,30,20
RANDCAP 50 | 150000 | 15 | 66.50 | 0.071 | 842 | 36.8% | 80.7% | 11.05 | 346 | 1024 | 645 | 0 | 7.5% | 9.3 | 1.82 | 2139.4 | 11,32,36,46,53,71,61,77,62,53,76,60,68,63,73
NOLEAK 50 | 150000 | 15 | 31.75 | -2.095 | 414 | 41.1% | 90.8% | 4.41 | 204 | 1221 | 610 | 0 | 4.7% | 13.7 | 2.36 | 1619.9 | 16,19,35,32,13,17,28,31,40,45,25,35,31,28,19
SHUFENV 50 | 150000 | 15 | 27.00 | -0.476 | 486 | 39.7% | 90.7% | 6.05 | 203 | 1119 | 610 | 0 | 2.7% | 9.8 | 1.89 | 2286.6 | 8,36,56,42,48,40,40,29,32,31,23,21,22,27,31
NOINH 50 | 150000 | 15 | 0.25 | -0.167 | 12 | 1.7% | 4.4% | 0.02 | 23 | 1110 | 610 | 0 | 5.4% | 3.8 | 0.92 | 1328.1 | 2,6,0,0,0,0,2,2,0,0,0,0,0,0,0
FIXED 50 | 150000 | 15 | 34.25 | -3.738 | 419 | 40.2% | 90.7% | 12.34 | 220 | 983 | 610 | 0 | 10.5% | 6.7 | 1.47 | 1583.9 | 12,14,16,20,26,30,27,52,50,33,33,24,30,23,29
BASE 50 | 150000 | 15 | 0.00 | 0.000 | 0 | 0.0% | 0.0% | 0.00 | 0 | 1189 | 610 | 0 | 0.0% | 0.0 | 0.00 | 521.5 | 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
FULL 51 | 150000 | 15 | 35.75 | -0.333 | 476 | 33.9% | 72.0% | 6.02 | 239 | 1316 | 275 | 0 | 5.3% | 12.9 | 2.24 | 4882.5 | 22,32,36,25,27,27,21,25,36,40,49,44,31,34,27
RANDCAP 51 | 150000 | 15 | 73.75 | 0.429 | 806 | 16.5% | 36.3% | 8.94 | 372 | 1163 | 268 | 0 | 14.8% | 11.2 | 2.14 | 4783.8 | 13,20,17,27,40,42,57,66,71,75,76,80,83,74,65
NOLEAK 51 | 150000 | 15 | 31.88 | -2.583 | 489 | 34.1% | 72.3% | 5.26 | 223 | 1300 | 275 | 0 | 4.7% | 12.5 | 2.33 | 4682 | 19,31,42,38,38,38,28,34,41,44,24,37,36,18,21
SHUFENV 51 | 150000 | 15 | 42.75 | 2.524 | 556 | 32.8% | 71.2% | 6.60 | 265 | 1249 | 275 | 0 | 3.6% | 10.3 | 1.92 | 4856.5 | 13,27,33,26,31,38,46,32,37,29,47,48,63,42,44
NOINH 51 | 150000 | 15 | 0.00 | 0.000 | 0 | 0.4% | 0.8% | 0.02 | 24 | 1291 | 275 | 0 | 1.8% | 3.6 | 1.01 | 4279.7 | 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
FIXED 51 | 150000 | 15 | 34.13 | -0.369 | 482 | 31.1% | 67.5% | 12.33 | 221 | 1024 | 275 | 0 | 13.0% | 9.1 | 1.78 | 4262.4 | 13,14,24,41,34,37,46,33,37,31,35,40,35,33,29
BASE 51 | 150000 | 15 | 0.00 | 0.000 | 0 | 0.0% | 0.0% | 0.00 | 0 | 1373 | 275 | 0 | 0.0% | 0.0 | 0.00 | 1793.1 | 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
FULL 52 | 150000 | 15 | 33.75 | -4.548 | 540 | 39.4% | 82.5% | 6.73 | 219 | 1145 | 136 | 0 | 2.7% | 12.6 | 2.26 | 1609.9 | 9,24,35,37,56,46,63,54,32,49,38,32,24,25,16
RANDCAP 52 | 150000 | 15 | 81.13 | 2.155 | 943 | 45.9% | 99.7% | 10.57 | 365 | 978 | 138 | 0 | 7.7% | 10.7 | 1.99 | 1625.4 | 12,37,47,33,51,52,62,55,85,77,107,76,77,91,81
NOLEAK 52 | 150000 | 15 | 49.50 | -2.833 | 699 | 32.1% | 69.2% | 7.02 | 303 | 1166 | 136 | 0 | 3.7% | 11.3 | 2.05 | 1460.3 | 9,32,32,41,55,77,57,57,67,50,45,40,57,40,40
SHUFENV 52 | 150000 | 15 | 34.50 | -0.024 | 439 | 37.5% | 81.3% | 5.74 | 250 | 1219 | 136 | 0 | 2.9% | 7.8 | 1.60 | 1652.9 | 8,39,23,23,29,18,23,36,33,25,52,29,33,31,37
NOINH 52 | 150000 | 15 | 0.00 | 0.000 | 1 | 0.2% | 0.4% | 0.02 | 23 | 1239 | 136 | 0 | 1.4% | 5.2 | 1.19 | 1205.9 | 0,1,0,0,0,0,0,0,0,0,0,0,0,0,0
FIXED 52 | 150000 | 15 | 34.88 | 0.512 | 449 | 36.4% | 80.6% | 13.54 | 215 | 970 | 136 | 0 | 11.4% | 7.2 | 1.50 | 1248 | 5,21,22,20,32,41,29,19,37,39,37,46,49,21,31
BASE 52 | 150000 | 15 | 0.00 | 0.000 | 0 | 0.0% | 0.0% | 0.00 | 0 | 1224 | 136 | 0 | 0.0% | 0.0 | 0.00 | 591.9 | 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
```
**X2**
```
arm seed | ticks | windows | Lu late (new used body catalysts/window) | trend | used ever | body share of ALL late income (incl. direct light) | body share of chemical income | mean body size late | catalyst kinds late | N late | N min | reseeds | cross-feeding: share of body income from others' leaked/released substrate, late | env: distinct dominant species (>=1% of occupied cells) late | env dominant-species entropy late | wall s | new used per window
FULL 50 | 150000 | 15 | 41.25 | -2.071 | 572 | 31.8% | 73.8% | 6.09 | 243 | 1116 | 610 | 0 | 6.5% | 14.3 | 2.30 | 1822.1 | 16,36,44,34,26,40,46,55,50,37,35,44,35,30,44
RANDCAP 50 | 150000 | 15 | 81.38 | -2.250 | 990 | 34.8% | 77.7% | 11.16 | 354 | 938 | 645 | 0 | 9.9% | 9.9 | 1.92 | 2068.1 | 11,32,38,64,52,49,93,100,73,82,88,79,75,86,68
NOLEAK 50 | 150000 | 15 | 35.50 | -3.595 | 526 | 40.0% | 90.9% | 4.88 | 215 | 1156 | 610 | 0 | 4.1% | 12.1 | 2.18 | 1615.8 | 16,19,38,26,34,53,56,49,45,35,38,47,21,22,27
SHUFENV 50 | 150000 | 15 | 45.88 | 0.369 | 696 | 39.8% | 91.3% | 9.61 | 295 | 1058 | 610 | 0 | 4.8% | 11.8 | 2.19 | 3558.3 | 8,36,68,60,50,56,51,49,45,47,34,51,42,48,51
NOINH 50 | 150000 | 15 | 0.00 | 0.000 | 8 | 0.4% | 0.9% | 0.02 | 22 | 1218 | 610 | 0 | 1.8% | 5.6 | 1.26 | 1881.7 | 2,6,0,0,0,0,0,0,0,0,0,0,0,0,0
FIXED 50 | 150000 | 15 | 40.88 | -0.893 | 498 | 41.5% | 92.5% | 13.83 | 241 | 939 | 610 | 0 | 8.6% | 7.0 | 1.60 | 3148.8 | 12,14,22,23,22,32,46,31,38,54,53,47,40,34,30
BASE 50 | 150000 | 15 | 0.00 | 0.000 | 0 | 0.0% | 0.0% | 0.00 | 0 | 1176 | 610 | 0 | 0.0% | 0.0 | 0.00 | 528 | 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
FULL 51 | 150000 | 15 | 25.75 | -2.857 | 430 | 35.3% | 73.5% | 5.22 | 179 | 1274 | 275 | 0 | 3.4% | 12.7 | 2.25 | 4275 | 22,32,31,32,30,45,32,38,36,20,28,20,28,31,5
RANDCAP 51 | 150000 | 15 | 63.25 | 2.167 | 756 | 33.3% | 70.5% | 8.89 | 325 | 1120 | 268 | 0 | 6.2% | 11.3 | 2.11 | 4253.4 | 13,20,25,36,57,55,44,53,52,64,79,51,73,62,72
NOLEAK 51 | 150000 | 15 | 11.50 | -0.214 | 275 | 35.3% | 73.5% | 3.73 | 89 | 1362 | 275 | 0 | 2.8% | 11.5 | 2.08 | 3424 | 19,31,43,31,19,13,27,12,15,8,11,10,14,15,7
SHUFENV 51 | 150000 | 15 | 24.88 | -2.250 | 399 | 31.1% | 69.6% | 4.94 | 183 | 1280 | 275 | 0 | 2.4% | 10.1 | 1.96 | 3244.2 | 13,27,31,35,40,28,26,35,30,37,16,21,16,22,22
NOINH 51 | 150000 | 15 | 0.00 | 0.000 | 0 | 0.2% | 0.5% | 0.02 | 26 | 1409 | 275 | 0 | 1.9% | 3.8 | 1.02 | 2786.4 | 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
FIXED 51 | 150000 | 15 | 30.25 | -1.262 | 442 | 34.6% | 74.1% | 11.56 | 229 | 1128 | 275 | 0 | 9.7% | 10.0 | 1.95 | 2098.3 | 13,14,30,32,33,33,45,32,38,23,36,35,27,30,21
BASE 51 | 150000 | 15 | 0.00 | 0.000 | 0 | 0.0% | 0.0% | 0.00 | 0 | 1341 | 275 | 0 | 0.0% | 0.0 | 0.00 | 2427.5 | 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
FULL 52 | 150000 | 15 | 29.38 | -3.417 | 452 | 35.8% | 80.0% | 6.05 | 195 | 1152 | 136 | 0 | 4.4% | 13.9 | 2.36 | 1439.8 | 9,24,27,44,36,39,38,33,42,29,53,14,32,20,12
RANDCAP 52 | 150000 | 15 | 55.13 | -3.774 | 768 | 45.4% | 99.8% | 8.63 | 330 | 1126 | 138 | 0 | 7.5% | 10.3 | 1.98 | 1521.6 | 12,37,36,54,50,76,62,62,87,62,44,47,36,47,56
NOLEAK 52 | 150000 | 15 | 42.25 | 1.143 | 578 | 31.4% | 68.5% | 7.68 | 253 | 1104 | 136 | 0 | 3.7% | 11.3 | 2.06 | 1363.1 | 9,32,33,52,32,41,41,44,37,53,26,47,30,35,66
SHUFENV 52 | 150000 | 15 | 30.38 | -0.393 | 412 | 37.5% | 81.4% | 5.63 | 208 | 1164 | 136 | 0 | 2.6% | 8.3 | 1.71 | 1423 | 8,39,23,23,23,20,33,36,30,34,26,21,33,32,31
NOINH 52 | 150000 | 15 | 0.00 | 0.000 | 1 | 0.6% | 1.4% | 0.02 | 23 | 1219 | 136 | 0 | 1.9% | 4.5 | 1.12 | 1012.7 | 0,1,0,0,0,0,0,0,0,0,0,0,0,0,0
FIXED 52 | 150000 | 15 | 26.75 | -3.238 | 401 | 42.0% | 94.0% | 11.01 | 200 | 1037 | 136 | 0 | 9.0% | 8.0 | 1.66 | 1034.8 | 5,21,20,18,46,50,27,32,33,38,30,35,17,14,15
BASE 52 | 150000 | 15 | 0.00 | 0.000 | 0 | 0.0% | 0.0% | 0.00 | 0 | 1243 | 136 | 0 | 0.0% | 0.0 | 0.00 | 508.3 | 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
```
Design rule:
```
a4-X1-150k: FULL-ahead 6/15, FULL late body share 35.0%, qualified
a4-X2-150k: FULL-ahead 8/15, FULL late body share 34.3%, qualified
CHOSEN a4-X2-150k
```

### Stage 2: X2 at 450k, fresh trial seeds 53–55, WIN 15 (appended 2026-10-03 19:46 BST)
```
arm seed | ticks | windows | Lu late (new used body catalysts/window) | trend | used ever | body share of ALL late income (incl. direct light) | body share of chemical income | mean body size late | catalyst kinds late | N late | N min | reseeds | cross-feeding: share of body income from others' leaked/released substrate, late | env: distinct dominant species (>=1% of occupied cells) late | env dominant-species entropy late | wall s | new used per window
FULL 53 | 450000 | 30 | 14.40 | 0.461 | 655 | 33.9% | 72.9% | 4.50 | 173 | 1459 | 232 | 0 | 2.2% | 12.8 | 2.30 | 8371.1 | 40,40,34,27,40,52,27,29,39,28,23,14,19,10,17,12,18,14,9,11,23,8,13,9,10,11,11,19,23,25
RANDCAP 53 | 450000 | 30 | 53.93 | -1.446 | 2145 | 45.3% | 94.9% | 9.13 | 371 | 1362 | 414 | 0 | 2.8% | 10.9 | 2.03 | 8883.6 | 25,83,110,96,107,100,94,87,93,94,117,83,90,66,91,72,53,57,55,57,58,62,56,49,74,39,41,58,43,35
NOLEAK 53 | 450000 | 30 | 14.60 | 0.461 | 639 | 33.4% | 71.9% | 4.71 | 186 | 1451 | 232 | 0 | 2.3% | 13.6 | 2.41 | 7995.2 | 27,49,41,31,55,43,37,23,20,8,16,14,19,18,19,9,17,26,8,10,10,16,5,12,6,16,23,23,23,15
SHUFENV 53 | 450000 | 30 | 21.60 | -0.825 | 883 | 32.8% | 71.4% | 5.36 | 209 | 1398 | 232 | 0 | 2.1% | 9.6 | 1.89 | 8657.2 | 32,51,40,51,52,45,32,41,38,32,34,25,38,24,24,27,28,22,21,26,25,30,21,24,19,18,15,10,14,24
NOINH 53 | 450000 | 30 | 0.00 | 0.000 | 0 | 0.4% | 0.8% | 0.02 | 27 | 1500 | 232 | 0 | 2.6% | 6.4 | 1.46 | 6566.8 | 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
FIXED 53 | 450000 | 30 | 16.00 | -0.643 | 591 | 46.9% | 99.9% | 9.84 | 184 | 1270 | 232 | 0 | 7.8% | 8.2 | 1.76 | 7520.8 | 22,42,35,33,27,28,16,31,18,19,12,13,12,20,23,21,19,12,15,13,36,15,21,14,11,14,19,14,9,7
BASE 53 | 450000 | 30 | 0.00 | 0.000 | 0 | 0.0% | 0.0% | 0.00 | 0 | 1510 | 232 | 0 | 0.0% | 0.0 | 0.00 | 3689.1 | 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
FULL 54 | 450000 | 30 | 20.07 | -1.114 | 918 | 39.9% | 86.2% | 4.34 | 182 | 1382 | 66 | 0 | 2.7% | 12.3 | 2.19 | 8203.5 | 16,32,57,55,45,28,35,21,32,35,50,66,55,44,46,26,34,22,11,23,28,19,27,28,21,11,17,11,15,8
RANDCAP 54 | 450000 | 30 | 35.27 | -2.593 | 1757 | 49.3% | 100.0% | 7.98 | 230 | 1328 | 259 | 0 | 1.9% | 5.5 | 1.16 | 8620.2 | 30,58,79,85,86,108,103,99,85,95,84,93,98,64,61,44,40,46,63,54,56,45,28,23,23,19,16,25,21,26
NOLEAK 54 | 450000 | 30 | 20.07 | 0.325 | 870 | 48.4% | 99.8% | 5.95 | 163 | 1356 | 66 | 0 | 2.0% | 11.3 | 2.12 | 7922.1 | 12,28,50,45,59,41,40,55,61,41,43,32,23,23,16,21,12,18,18,13,20,24,19,32,22,28,12,22,23,17
SHUFENV 54 | 450000 | 30 | 22.20 | -3.029 | 956 | 47.7% | 100.0% | 5.49 | 164 | 1391 | 66 | 0 | 2.0% | 10.3 | 1.96 | 8501.5 | 13,33,48,39,38,33,37,44,47,44,46,44,47,48,62,53,46,36,21,37,28,26,16,15,14,9,6,4,12,10
NOINH 54 | 450000 | 30 | 0.00 | 0.000 | 16 | 0.4% | 0.9% | 0.02 | 26 | 1389 | 66 | 0 | 2.0% | 2.9 | 0.64 | 6320.6 | 0,4,1,2,4,4,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
FIXED 54 | 450000 | 30 | 18.80 | -1.693 | 855 | 47.4% | 99.8% | 15.07 | 267 | 1043 | 66 | 0 | 11.6% | 7.5 | 1.62 | 7713.5 | 9,28,34,35,45,69,38,39,44,32,41,31,43,48,37,48,25,35,23,19,11,5,18,20,14,15,13,9,16,11
BASE 54 | 450000 | 30 | 0.00 | 0.000 | 0 | 0.0% | 0.0% | 0.00 | 0 | 1362 | 66 | 0 | 0.0% | 0.0 | 0.00 | 3051.8 | 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
FULL 55 | 450000 | 30 | 21.33 | 0.871 | 744 | 44.4% | 96.2% | 5.98 | 157 | 1317 | 197 | 0 | 4.1% | 10.8 | 2.08 | 8237.9 | 17,22,38,43,39,29,36,36,36,37,28,19,14,20,10,9,10,12,13,20,24,32,32,36,27,14,28,24,18,21
RANDCAP 55 | 450000 | 30 | 43.67 | -2.604 | 1766 | 48.0% | 99.9% | 7.73 | 284 | 1361 | 188 | 0 | 2.6% | 8.8 | 1.76 | 8720.4 | 16,48,74,68,75,88,87,99,79,63,84,73,84,82,91,94,65,46,54,36,43,43,37,23,28,44,34,36,29,43
NOLEAK 55 | 450000 | 30 | 15.33 | -1.904 | 870 | 48.9% | 98.4% | 5.98 | 94 | 1427 | 197 | 0 | 1.7% | 3.3 | 0.56 | 7861 | 22,35,62,59,55,57,45,41,48,48,45,55,30,23,15,14,26,37,33,38,14,17,6,3,7,7,8,5,3,12
SHUFENV 55 | 450000 | 30 | 16.07 | -1.607 | 861 | 35.2% | 75.3% | 4.84 | 148 | 1324 | 197 | 0 | 1.9% | 9.5 | 1.79 | 8542.9 | 15,48,54,48,39,52,47,38,31,47,36,43,39,48,35,36,23,19,23,31,28,11,13,2,4,4,8,13,14,12
NOINH 55 | 450000 | 30 | 0.00 | 0.000 | 0 | 0.5% | 1.1% | 0.02 | 26 | 1425 | 197 | 0 | 2.5% | 5.6 | 1.23 | 6646 | 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
FIXED 55 | 450000 | 30 | 12.27 | -0.857 | 706 | 47.1% | 100.0% | 10.18 | 201 | 1218 | 197 | 0 | 9.3% | 8.8 | 1.81 | 7591.3 | 21,22,41,33,53,61,53,44,33,37,31,21,27,23,22,28,15,18,12,12,10,13,10,12,9,8,10,10,10,7
BASE 55 | 450000 | 30 | 0.00 | 0.000 | 0 | 0.0% | 0.0% | 0.00 | 0 | 1501 | 197 | 0 | 0.0% | 0.0 | 0.00 | 3588.6 | 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
```
Go criterion:
```
seed 53: FULL Lu 14.40 trend 0.461 body 33.9% N 1459 | RANDCAP 53.93 NOLEAK 14.60 SHUFENV 21.60 NOINH 0.00 FIXED 16.00 -> FAILS [> RANDCAP, > NOLEAK, > SHUFENV, > FIXED]
seed 54: FULL Lu 20.07 trend -1.114 body 39.9% N 1382 | RANDCAP 35.27 NOLEAK 20.07 SHUFENV 22.20 NOINH 0.00 FIXED 18.80 -> FAILS [> RANDCAP, > NOLEAK, > SHUFENV, trend>=0]
seed 55: FULL Lu 21.33 trend 0.871 body 44.4% N 1317 | RANDCAP 43.67 NOLEAK 15.33 SHUFENV 16.07 NOINH 0.00 FIXED 12.27 -> FAILS [> RANDCAP]
=> NO-GO.
```
