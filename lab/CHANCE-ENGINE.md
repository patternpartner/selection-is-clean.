# CHANCE ENGINE: stop beating chance, use it

Branch `cos/chance-engine`, from `cos/meta-search` (2633322). **Trial seeds only. No deciding pre-registration, no deciding seed run.**
Raw readouts: `lab/chance/trial/`. Nothing here touches main.

## Part 1. Why random capture wins (analysis; written before any design run)

### 1a. Existing runs (A3, A3b, A4; `lab/autocat/trial/*.json` on cos/cross-feeding)
Means over seeds, FULL (directed: capture substrate = what the parent last made) / RANDCAP (uniform random substrate):

| design | Lu F/R | used ever F/R | catalyst kinds late F/R | body size F/R | body share F/R | RANDCAP wins |
|---|---|---|---|---|---|---|
| A3 B1 150k | 41.2/44.8 | 548/624 | 239/256 | 7.6/7.4 | 34/31% | 3/3 |
| A3 B2 150k | 11.6/14.4 | 191/211 | 100/103 | 3.4/3.0 | 30/27% | 2/3 |
| A3 B3 150k | 76.2/50.8 | 901/686 | 343/311 | 11.8/8.1 | 20/25% | 0/3 |
| A3 B3 450k | 88.7/56.4 | 2519/1942 | 406/333 | 14.3/9.6 | 26/23% | 0/3 |
| A3b C1 150k | 33.0/51.0 | 532/671 | 216/278 | 7.6/8.1 | 29/24% | 2/3 |
| A3b C2 150k | 33.1/58.3 | 544/743 | 244/318 | 7.5/7.7 | 28/17% | 3/3 |
| A3b C1 450k | 24.4/44.2 | 1061/1562 | 202/268 | 8.6/10.3 | 37/34% | 3/3 |
| A4 X1 150k | 33.5/73.8 | 500/864 | 226/361 | 6.2/10.2 | 35/33% | 3/3 |
| A4 X2 150k | 32.1/66.6 | 485/838 | 206/336 | 5.8/9.6 | 34/38% | 3/3 |
| A4 X2 450k | 18.6/44.3 | 772/1889 | 171/295 | 4.9/8.3 | 39/48% | 3/3 |

- Random won 25 of 30 matched comparisons. The exception is A3 B3 (big bodies, no fusion, no cross-feeding), where directed won 6/6.
- Lu is mostly a breadth readout. Over the 60 FULL/RANDCAP runs, corr(standing catalyst kinds, Lu) = **0.94** (body size 0.85).
  Lu per standing kind is similar (FULL 0.154, RANDCAP 0.172). So random wins mainly by holding **more different catalysts**, not by
  making each one more useful.
- Random does not pay less: body income share is level or higher (A4 450k: 48% vs 39%).

### 1b. Instrumented reruns (`lab/chance/capdiag.js`, trial seed 63, 90k ticks, read-only wrappers, so runs are identical)
A3b C1 (fusion) and A3 B3 (no fusion), FULL vs RANDCAP. Late windows 50k–80k, per 10k-tick window:

| measure | B3 FULL | B3 RANDCAP | C1 FULL | C1 RANDCAP |
|---|---|---|---|---|
| distinct capture substrates (of 256) | 52 | 212 | 62 | 235 |
| distinct captured catalysts | 225 | 451 | 288 | 601 |
| **repeat-capture rate** (catalyst seen before anywhere) | **89.9%** | 50.4% | **81.7%** | 41.8% |
| substrate already in the parent's chemistry (hop 0) | 96.0% | 7.2% | 92.2% | 5.2% |
| hop 1 / 2 / 3+ from the parent's chemistry (base network) | 2/2/0% | 39/49/4% | 1/4/3% | 27/56/12% |
| substrate's abundance rank in the cell (0 = most abundant) | 0.07 | 0.48 | 0.10 | 0.48 |
| substrate absent from the cell | 0.0% | 2.4% | 0.8% | 9.4% |
| species present in bodies (population) | 176 | 224 | 153 | 191 |
| standing catalyst kinds | 208 | 346 | 190 | 248 |
| new USED catalysts per window | 38 | 77 | 39 | 57 |
| lineage diversity: effective number of body sets exp(H) | 95 | 141 | 96 | 114 |
| top body-set share | 0.081 | 0.045 | 0.059 | 0.054 |

**Fraction of captures that become used** (whole 90k run; each new capture-born catalyst, is it ever USED by the Lu rule):

| | B3 FULL | B3 RANDCAP | C1 FULL | C1 RANDCAP |
|---|---|---|---|---|
| new catalysts first made by capture | 788 | 2,756 | 1,117 | 3,735 |
| of which ever used | 82 (**10.4%**) | 130 (4.7%) | 91 (**8.1%**) | 122 (3.3%) |

Directed captures hit about twice as often, but random makes 3.3–3.5× as many genuinely new ones. So random ends up with more used
inventions in absolute terms (+34–59%). Volume beats aim.

### 1c. What the meta-search learned about the capture-source mix (`lab/meta/evals.csv`, 142 evaluations at 80k)
- The evolved operator beat RANDCAP in only **49%** of evaluations (mean Lu 94.2 vs 93.2): a coin flip. With fusion on 43%, with
  cross-feeding on 25%.
- Every top-15 config is a near-even **mixture that keeps about a third random capture**: RAND 0.30–0.34, LAST 0.19–0.29, ENV
  0.24–0.30, EXT 0.13–0.21. The search never pushed the random share down.
- Corr(random share, Lu_FULL − Lu_RANDCAP) = 0.05: no signal. Caveat: the search collapsed early onto one family (117/142
  evaluations have a random share of 0.25–0.40), so the mix was barely explored.
- Evolvable evolvability (BODY_EVO) was on in 10 evaluations (mean fitness −40.5) and in none of the top configs.

### 1d. Explanation
Directed capture is **history-locked**. The parent's last product is almost always a species it already handles (92–96%), and the
most abundant one in its cell. So a lineage keeps re-sampling the same ~50–60 substrates and the same ~16k-reaction neighbourhood.
82–90% of its captures are catalysts that already exist somewhere. It is exploitation: it deepens what it already does (with fusion,
directed captures chain onto the parent's own output and get fused away into pathways), and it drains the very molecule its
existing catalysts make.

Random capture is **unbiased breadth**: about 4× more distinct substrates, about 2× more distinct catalysts, 95% of draws land 1–3
steps outside the parent's chemistry, half as many repeats, and a more diverse population of bodies (exp(H) 114–141 vs 95–96). Most
random draws are poor, but selection (inheritance + upkeep + income) filters them for free, and Lu rewards breadth. So random wins
because it is the better **variation** source, while **selection** does the steering. SHUF and NOINH (no faithful inheritance) are far
below both (e.g. A3b 450k SHUF 6.0, NOINH 0), so it is chance **plus** selection, not chance alone.

The one place directed wins (B3: 16-slot bodies, no fusion) is where depth can pile up without being fused away. Breadth is not
always better.

## Part 2. Designs: chance as the engine (fixed before any design run)
Lesson from Part 1: keep random variation, keep selection, and make chance **reach further**. Both designs sit on A3b C1
(`CHEM, HBODY, BODY_F 0.05, BODY_MAX 16, BODY_FUSE 0.02`), so plain RANDCAP is exactly the A3b null that won.
Honesty rules hold: energy is conserved (a catalyst or pathway q → … → u pays e(q) − e(u) only from molecules really in the cell;
every step is downhill within CHEM_DMAX). Nothing is named. Novelty is never paid; only income and upkeep act.
Knobs are in `lab/oee-core.js`, off by default, byte-identical when unset (`lab/chance/trial/bytecheck.txt`).

- **R1, heavy-tailed chance ("Lévy capture"):** `BODY_RCAP 1, CH_LEN 1.5`. The substrate is uniform random. The captured catalyst is a
  random downhill walk of k steps, with P(k) ∝ k^−1.5 for k = 1..7. So it is mostly one-step catalysts (53%), sometimes a long new
  pathway in one jump. This breaks the ~16.5k one-step ceiling (A3b's diagnosis) by chance alone, with no lineage history.
- **R2, evolvable chance:** R1 + `CH_EVO 0.1`. Each organism inherits its own log "temperature" (multiplies its mutation and capture
  rates, clamped ×e^±3) and its own tail exponent α (start 1.5, range 0.3–6), each with N(0, 0.1) noise per birth from its own RNG
  stream. Selection alone sets how random each lineage is. (A smoke test, seed 59, 12k ticks, gave mean rate ×3.4 and α 2.1.
  So it is not neutral, and runaway temperature is a known risk.)
- Implemented but **not** pre-registered: `CH_AWAY` (novelty-biased random substrate). Part 1 shows random draws are already 95% off
  the parent's chemistry, so the bias would add little.

### Nulls (each run with the design's own settings)
- **RANDCAP**: plain chance (C1 + BODY_RCAP 1). This is the null to beat.
- **DIRECT**: the same operator (same heavy-tailed walk, same R2 evolvability), but the substrate is what the parent made. This
  isolates chance vs history as the source.
- **DRIFT** (no selection): `BODY_DRIFT 1`. Bodies are inherited and varied identically, but they are shadows: they move no
  molecules, pay nothing and cost nothing. Their would-be income is logged, so Lu is measured identically. This shows how much "used
  novelty" pure drift of the same chance produces.
- **SHUF**: copy a random organism's body (inheritance null).
- For R2 only, **R1** acts as the frozen-chance null: it has the same starting values but no evolvability.
- **BASE**: CHEM only (population reference).

### Readout (`lab/chance/ce-trial.js`)
- Lu, exactly as in A3/A4 (`body-trial.js`), plus **LuInc**: new used catalysts counting the income rule only (≥ 1% of chemical income;
  carriers alone do not count). Long random pathways cannot score just by being carried around.

### Design choice (`ce-check.js pick`)
- 150k on trial seeds **110, 111, 112** (WIN 10).
- Disqualify a design if any of its arms reseeds or has late N < 50% of BASE.
- Pick the larger fraction of design-ahead Lu comparisons: R1 has 4 nulls × 3 seeds, R2 has 5 × 3. Ties go to the higher body share.

### Go criterion (`ce-check.js go`): chosen design at 450k on fresh trial seeds 113, 114, 115 (WIN 15)
On **all 3** seeds:
- Lu(D) > Lu of RANDCAP, DIRECT, DRIFT and SHUF (and R1 if D = R2);
- LuInc(D) > LuInc(RANDCAP) and > LuInc(DRIFT);
- D's late Lu trend ≥ 0;
- D's body share of all late income ≥ 10%;
- no arm reseeds, and every arm's late N ≥ 50% of BASE.

Also, mean over seeds of Lu(D)/Lu(RANDCAP) ≥ **1.10**, so the design must beat plain chance by a margin, not a hair.
Otherwise: **NO-GO**. A GO only justifies writing a deciding pre-registration on fresh seeds. It is not a claim.

### Schedule (`lab/chance/waiter.sh` → `lab/chance/runs.sh`)
- The waiter polls every 5 min. It starts only after `cos/meta-search` has the commit "meta-search: held-out check on seeds …" and
  `lab/meta/search.js` has exited. It gives up, starting nothing, at 23:30.
- Stage 1 is 30 runs × 150k at 8 in parallel: about 50–60 min (A3b C1 150k runs took 620–740 s each).
- Stage 2 is 18–21 runs × 450k: about 3–3.5 h (C1 450k took ~3,600 s each; 3 waves).
- Total: about 4–4.5 h after the held-out check. If it lands 14:00–15:00 BST, the verdict is due about **18:30–19:30 BST**.
- Each stage appends its tables to this file and pushes.

## Log

### Stage 1: R1 vs R2 at 150k, trial seeds 110-112 (appended by runs.sh 2026-10-04 11:45 BST)
```
arm seed | ticks | windows | Lu late (new used body catalysts/window) | trend | LuInc late (income-only rule) | LuInc trend | used ever | body share of ALL late income (incl. direct light) | body share of chemical income | mean body size late | catalyst kinds late | N late | N min | reseeds | cross-feeding: share of body income from others' leaked/released substrate, late | env: distinct dominant species (>=1% of occupied cells) late | env dominant-species entropy late | wall s | new used per window
R1 110 | 150000 | 15 | 23.38 | -0.917 | 0.38 | -0.155 | 431 | 2.8% | 5.8% | 3.59 | 161 | 1301 | 118 | 0 | 0.0% | 0.0 | 0.00 | 543.7 | 22,39,57,50,15,32,29,30,20,29,26,18,21,18,25
R2 110 | 150000 | 15 | 13.13 | -2.917 | 0.63 | -0.012 | 557 | 48.2% | 100.0% | 7.17 | 124 | 1217 | 118 | 0 | 0.0% | 0.0 | 0.00 | 511.3 | 55,74,94,83,70,40,36,29,14,22,14,8,2,9,7
RANDCAP 110 | 150000 | 15 | 44.63 | 1.488 | 4.13 | 0.179 | 587 | 33.7% | 75.8% | 8.28 | 282 | 1145 | 118 | 0 | 0.0% | 0.0 | 0.00 | 533.6 | 2,30,45,36,40,43,34,39,29,37,54,59,63,36,40
DIRECT-R1 110 | 150000 | 15 | 33.75 | 1.952 | 3.50 | -0.119 | 527 | 32.5% | 69.4% | 7.78 | 239 | 1191 | 124 | 0 | 0.0% | 0.0 | 0.00 | 511.7 | 16,36,52,46,25,43,39,28,30,31,41,23,29,41,47
DIRECT-R2 110 | 150000 | 15 | 26.63 | 0.036 | 4.13 | -0.202 | 360 | 33.0% | 70.3% | 8.55 | 227 | 1079 | 124 | 0 | 0.0% | 0.0 | 0.00 | 489.9 | 10,25,37,22,10,27,16,23,21,25,22,41,54,13,14
DRIFT-R1 110 | 150000 | 15 | 102.50 | 8.214 | 1.00 | -0.048 | 1155 | 6.5% | 12.7% | 13.28 | 622 | 1453 | 124 | 0 | 0.0% | 0.0 | 0.00 | 447.9 | 11,19,40,54,60,72,79,55,84,108,105,105,113,135,115
DRIFT-R2 110 | 150000 | 15 | 55.75 | -13.476 | 1.25 | 0.238 | 905 | 14.2% | 25.7% | 10.11 | 675 | 1453 | 124 | 0 | 0.0% | 0.0 | 0.00 | 439.4 | 13,33,60,80,99,100,74,84,86,104,89,29,26,8,20
SHUF-R1 110 | 150000 | 15 | 14.25 | 0.286 | 0.00 | 0.000 | 243 | 38.8% | 78.3% | 5.26 | 126 | 1328 | 396 | 0 | 0.0% | 0.0 | 0.00 | 509.7 | 8,10,35,24,20,9,23,17,10,10,8,22,22,16,9
SHUF-R2 110 | 150000 | 15 | 56.00 | -4.881 | 0.50 | -0.310 | 743 | 47.0% | 99.9% | 10.93 | 740 | 1071 | 127 | 0 | 0.0% | 0.0 | 0.00 | 567.3 | 19,54,62,23,23,43,71,51,70,101,65,35,43,40,43
BASE 110 | 150000 | 15 | 0.00 | 0.000 | 0.00 | 0.000 | 0 | 0.0% | 0.0% | 0.00 | 0 | 1453 | 124 | 0 | 0.0% | 0.0 | 0.00 | 345.3 | 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
R1 111 | 150000 | 15 | 43.00 | 0.214 | 2.38 | -0.298 | 542 | 34.5% | 71.9% | 6.19 | 249 | 1341 | 278 | 0 | 0.0% | 0.0 | 0.00 | 532.5 | 10,22,23,31,45,31,36,29,61,42,47,36,30,60,39
R2 111 | 150000 | 15 | 27.13 | -5.821 | 0.63 | -0.036 | 901 | 43.7% | 89.3% | 12.90 | 501 | 1173 | 268 | 0 | 0.0% | 0.0 | 0.00 | 595.8 | 34,143,119,105,102,112,69,46,32,50,22,33,23,7,4
RANDCAP 111 | 150000 | 15 | 65.00 | -1.714 | 5.50 | 0.143 | 727 | 38.5% | 87.1% | 8.42 | 369 | 1217 | 184 | 0 | 0.0% | 0.0 | 0.00 | 496.8 | 2,11,29,28,36,43,58,66,75,75,46,70,72,67,49
DIRECT-R1 111 | 150000 | 15 | 45.63 | -3.512 | 5.13 | 0.155 | 612 | 41.1% | 88.1% | 7.73 | 286 | 1211 | 186 | 0 | 0.0% | 0.0 | 0.00 | 542.2 | 6,24,37,44,39,51,46,52,53,61,26,68,47,36,22
DIRECT-R2 111 | 150000 | 15 | 20.50 | -0.810 | 3.63 | -0.202 | 405 | 40.3% | 85.8% | 7.64 | 142 | 1288 | 186 | 0 | 0.0% | 0.0 | 0.00 | 573.9 | 8,47,55,35,30,34,32,23,28,24,18,14,13,19,25
DRIFT-R1 111 | 150000 | 15 | 96.88 | 0.131 | 1.38 | -0.131 | 1103 | 4.7% | 11.3% | 13.76 | 516 | 1327 | 186 | 0 | 0.0% | 0.0 | 0.00 | 375.5 | 8,17,41,57,64,68,73,79,118,99,92,87,108,106,86
DRIFT-R2 111 | 150000 | 15 | 124.75 | -3.667 | 3.38 | 0.107 | 1514 | 36.7% | 59.8% | 15.87 | 1467 | 1327 | 186 | 0 | 0.0% | 0.0 | 0.00 | 417.9 | 6,14,28,80,94,160,134,149,137,106,125,127,132,107,115
SHUF-R1 111 | 150000 | 15 | 9.38 | -0.464 | 0.88 | -0.488 | 218 | 25.5% | 52.2% | 3.49 | 140 | 1414 | 393 | 0 | 0.0% | 0.0 | 0.00 | 469.8 | 2,9,16,35,37,26,18,12,14,7,8,10,5,7,12
SHUF-R2 111 | 150000 | 15 | 53.50 | -3.095 | 0.00 | 0.000 | 778 | 43.5% | 88.4% | 11.49 | 933 | 1192 | 415 | 0 | 0.0% | 0.0 | 0.00 | 642.4 | 11,33,58,52,79,66,51,59,66,72,50,40,47,45,49
BASE 111 | 150000 | 15 | 0.00 | 0.000 | 0.00 | 0.000 | 0 | 0.0% | 0.0% | 0.00 | 0 | 1327 | 186 | 0 | 0.0% | 0.0 | 0.00 | 306.8 | 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
R1 112 | 150000 | 15 | 29.50 | 0.571 | 2.75 | -0.667 | 450 | 32.2% | 68.4% | 7.67 | 234 | 1229 | 319 | 0 | 0.0% | 0.0 | 0.00 | 489.6 | 11,26,39,34,42,31,31,32,26,29,24,29,35,24,37
R2 112 | 150000 | 15 | 10.75 | -1.952 | 1.50 | -0.214 | 237 | 33.3% | 69.5% | 5.93 | 112 | 1332 | 315 | 0 | 0.0% | 0.0 | 0.00 | 490.2 | 9,19,23,23,22,35,20,18,14,16,11,9,7,8,3
RANDCAP 112 | 150000 | 15 | 42.25 | -1.833 | 2.38 | 0.560 | 603 | 19.9% | 43.3% | 6.27 | 266 | 1278 | 335 | 0 | 0.0% | 0.0 | 0.00 | 486.5 | 14,30,39,67,29,44,42,41,42,45,56,54,38,34,28
DIRECT-R1 112 | 150000 | 15 | 22.13 | -1.083 | 2.13 | -0.440 | 335 | 35.1% | 74.7% | 6.23 | 189 | 1312 | 539 | 0 | 0.0% | 0.0 | 0.00 | 522.9 | 14,25,40,23,18,16,22,17,33,26,23,21,24,15,18
DIRECT-R2 112 | 150000 | 15 | 14.00 | -2.786 | 1.38 | 0.107 | 340 | 35.9% | 75.6% | 5.11 | 207 | 1345 | 539 | 0 | 0.0% | 0.0 | 0.00 | 516.3 | 12,24,34,37,53,36,32,25,21,22,12,8,9,8,7
DRIFT-R1 112 | 150000 | 15 | 67.25 | 1.000 | 0.25 | -0.024 | 939 | 0.9% | 1.9% | 13.42 | 445 | 1504 | 539 | 0 | 0.0% | 0.0 | 0.00 | 473.6 | 5,31,55,66,86,80,78,77,56,58,69,62,67,80,69
DRIFT-R2 112 | 150000 | 15 | 55.00 | -9.595 | 0.38 | -0.155 | 670 | 17.2% | 30.9% | 12.69 | 663 | 1504 | 539 | 0 | 0.0% | 0.0 | 0.00 | 460.4 | 11,14,28,28,30,52,67,75,88,65,79,55,29,26,23
SHUF-R1 112 | 150000 | 15 | 13.25 | 0.143 | 3.00 | -0.405 | 275 | 47.2% | 99.8% | 5.90 | 191 | 1378 | 313 | 0 | 0.0% | 0.0 | 0.00 | 514.1 | 7,23,37,43,28,18,13,6,17,17,11,16,17,10,12
SHUF-R2 112 | 150000 | 15 | 39.38 | 0.702 | 1.63 | -0.369 | 539 | 46.3% | 99.8% | 9.35 | 852 | 1241 | 313 | 0 | 0.0% | 0.0 | 0.00 | 544.5 | 7,15,36,45,52,38,31,30,39,34,29,60,59,45,19
BASE 112 | 150000 | 15 | 0.00 | 0.000 | 0.00 | 0.000 | 0 | 0.0% | 0.0% | 0.00 | 0 | 1504 | 539 | 0 | 0.0% | 0.0 | 0.00 | 357 | 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
```
Design rule:
```
R1: design-ahead 4/12 (33%), late body share 23.2%, qualified
R2: design-ahead 1/15 (7%), late body share 41.7%, qualified
CHOSEN R1
```

### Post-hoc DIAGNOSTIC: evolvable randomness (added 2026-10-04 12:40 BST, before stage-2 results; NOT a change to the go criterion)
- Script: `lab/chance/chance-diag.js`, which only reads the existing per-1000-tick JSONL. No rerun, and no running process or waiter
  was touched.
- Reports for R2 vs its nulls:
  1. the trajectory of the evolved rate multiplier and tail α;
  2. churn vs use: per window, catalyst types arriving in the readout that are genuinely new vs re-appearing, and how many new types
     persist +1/+2/+4 windows;
  3. corr(rate, new used) and corr(rate, persistence);
  4. the "stuck" response: corr(Δrate, previous new-used) and corr(rate, next new-used), pooled over seeds after z-scoring.
- Classification rule (fixed in the script): **outcome 1** if late rate ≤ 0.5 on ≥ 2 seeds; **outcome 2** if late rate ≥ 2, late
  re-appearance share ≥ 50% and late new-used not above R1/RANDCAP on ≥ 2 seeds; **outcome 3** if pooled corr(Δrate, previous
  new-used) ≤ −0.3 and corr(rate, next new-used) ≥ +0.3; otherwise mixed.
- **Where the data is:** stage 1 chose R1, so stage 2 (450k, seeds 113–115) has **no evolvable-randomness arm**. The R2 diagnostic can
  only use stage 1 (150k, seeds 110–112: R2, R1, RANDCAP, DIRECT-R2, DRIFT-R2, SHUF-R2), which already existed when this was written.
  The stage-1 pick table had been seen, plus one sample value (R2 seed 110 final mean rate 0.254). The churn part is also run on stage
  2's R1 arms when they finish (a tiny nohup waiter appends it here).
- **Missing data:** the samples list only types above 0.2% of carriers or income. So a "re-appearance" is either a true re-discovery or
  a type that survived below the threshold. True per-capture re-discovery rates need the capture wrapper (`lab/chance/capdiag.js`) on
  a rerun, and none was started. There is also no per-lineage rate, only the population mean.

#### Diagnostic result on stage 1 (R2 and its nulls, 150k, seeds 110–112; full output `lab/chance/trial/chance-diag-s1.txt`)
- **Classification: OUTCOME 1** (by the rule in the script). Selection turned chance down. R2's mean rate multiplier fell from 2.24 →
  0.25 (seed 110) and 0.79 → 0.35 (seed 112). Seed 111 stayed high (3.35 → 2.13). α drifted up from 1.5 to 1.9–2.4 (shorter jumps).
  Without selection on bodies the rate rose instead: DRIFT-R2 1.8–3.7 late, SHUF-R2 3.1–5.3.
- Churn: R2's re-appearance share rose to 22–50% late (R1 14–20%, RANDCAP 31–39%). Persistence of new types was the same in every
  arm (about 22–28% after +1 window, 9–11% after +2), so evolvable chance did not make inventions stick. Late new-used per window:
  R2 5.0–17.8 vs R1 16.8–30.6 and RANDCAP 30.0–43.6.
- Correlations: rate vs new used is high (pooled 0.83), and rate vs next-window use is too (0.77). But DRIFT-R2 shows the same (0.78 /
  0.64), so this is mechanical (more captures means more arrivals, and both fall over time), not a schedule. The "rises when stuck"
  correlation is weak (−0.27, threshold −0.3) and is stronger in SHUF-R2 (−0.43), so it is not specific to selection either.

### Post-hoc DIAGNOSTIC 2: coexistence vs replacement, and cause of death (added 2026-10-04 ~13:00 BST; NOT part of the go criterion)
- Script: `lab/chance/chance-diag2.js`. It only reads the existing per-1000-tick JSONL, with no rerun, and the running stage-2 sim was
  not touched. Stage-1 output: `lab/chance/trial/chance-diag2-s1.txt`. Windows are 5k ticks. "Present", "genuinely new" and "used" are
  defined exactly as in `chance-diag.js`. The stage-2 version is appended by `lab/chance/diag-waiter2.sh`, which replaces `diag-waiter.sh`.
- **What the logs cannot answer (missing fields).** There are no parent/lineage links, no per-organism body sets and no capture events.
  So "the parent's trick" cannot be identified, and both readouts are **population-level proxies**. Pathway ids (key ≥ 65536) are logged
  without their substrate or origin, so an R1 long jump cannot be told apart from a fusion or a mutated pathway, and pathways are left out
  of the niche pairing. Per-type income (`bU`) is only listed above 0.2% of ALL chemical income (metabolism included). So for about 99% of
  dying new types, income is never visible, and their cause of death **cannot be determined**.
  - Logging needed to answer this properly: (a) a capture/birth event log with parent id, the parent's body set, the new key, and its
    origin (capture with walk length k, fusion, or mutation), plus the substrate of each pathway id (log `chS`); (b) per-type income for
    every carried type, not just those above 0.2% of total; (c) the mean substrate concentration in carrier cells per type, which is
    what separates demand vanishing from out-competition.
- **1. Coexistence vs replacement** (one-step new types against same-substrate incumbents, outcome one window later). Counting
  ESTABLISHED incumbents (present 2 windows), the share of surviving new types that coexist rather than replace was: R1 69%, RANDCAP 67%,
  DRIFT-R1 69%, DIRECT-R1 78%, R2 46%, DRIFT-R2 44%, SHUF 27–48%. Counting all incumbents, R1 was 51% and RANDCAP 49%.
  - An arrival does **not** raise the incumbent's loss. Established same-substrate groups that received an arrival were wholly gone one
    window later 37% of the time (R1), against 88% for groups with no arrival. Arrivals land on busy substrates.
  - The no-selection DRIFT arm shows the same coexistence share. So, as far as these logs can show, coexistence vs replacement is not
    something selection is doing.
  - The census (all types, pathways included) is near-replacement turnover: about 1.02–1.35 exits per genuinely new entry, with net
    present types +3 to +31 per window. R1's standing kinds still grew (1/3 → end: 123→178, 237→249, 199→281). R2 and SHUF-R1 shrank on
    most seeds.
- **2. Cause of death** (new types gone one window later). For 99% of these deaths the cause cannot be determined (income below the
  readout). That includes about 92–95% of the dead types that met the "used" rule, which they met through carriers. The readable ~1% is
  biased toward high earners:

  | arm | readable deaths | demand vanished | still earning when lost |
  |---|---|---|---|
  | R1 | 114 | 1 | 102 |
  | RANDCAP | 157 | 3 | 140 |
  | DRIFT-R1 | 177 | 1 | 176 |
  | DIRECT-R1 | 329 | 5 | 282 |

  - So the readable ones almost never die because demand vanished. They lose their carriers while still earning per carrier.
  - The no-selection DRIFT arm does the same, so "still earning when lost" is consistent with host and drift loss. It is not evidence of
    out-competition.
  - Of the one-step "still earning" deaths, a same-substrate competitor rose in 67% (R1, 8 of 12) and 66% (RANDCAP, 46 of 70). The
    numbers are tiny.

### Stage 2: R1 at 450k, fresh trial seeds 113-115, WIN 15 (appended by runs.sh 2026-10-04 13:02 BST)
```
arm seed | ticks | windows | Lu late (new used body catalysts/window) | trend | LuInc late (income-only rule) | LuInc trend | used ever | body share of ALL late income (incl. direct light) | body share of chemical income | mean body size late | catalyst kinds late | N late | N min | reseeds | cross-feeding: share of body income from others' leaked/released substrate, late | env: distinct dominant species (>=1% of occupied cells) late | env dominant-species entropy late | wall s | new used per window
D 113 | 450000 | 30 | 29.73 | 0.146 | 0.87 | -0.168 | 980 | 29.1% | 60.6% | 7.13 | 211 | 1218 | 146 | 0 | 0.0% | 0.0 | 0.00 | 1696.6 | 13,52,48,49,70,46,37,46,29,33,30,12,23,16,30,31,33,21,27,18,24,28,27,46,54,36,33,27,17,24
RANDCAP 113 | 450000 | 30 | 30.73 | -0.693 | 1.93 | -0.211 | 1335 | 22.7% | 47.5% | 7.23 | 242 | 1167 | 147 | 0 | 0.0% | 0.0 | 0.00 | 1665 | 5,29,56,45,68,59,71,81,84,76,81,76,53,36,54,29,32,28,34,25,41,25,48,33,54,34,29,13,17,19
DIRECT 113 | 450000 | 30 | 15.27 | 0.707 | 0.00 | 0.000 | 598 | 37.2% | 75.4% | 7.80 | 102 | 1199 | 117 | 0 | 0.0% | 0.0 | 0.00 | 1616.7 | 27,41,46,39,21,37,22,18,14,16,17,20,18,20,13,17,7,11,10,11,14,18,13,11,21,20,25,10,17,24
DRIFT 113 | 450000 | 30 | 77.33 | 0.996 | 1.27 | 0.046 | 2414 | 4.0% | 8.5% | 15.37 | 544 | 1397 | 117 | 0 | 0.0% | 0.0 | 0.00 | 1634.1 | 8,22,76,108,128,97,93,97,105,91,74,94,79,104,78,60,72,74,68,78,96,72,76,87,76,73,76,84,87,81
SHUF 113 | 450000 | 30 | 10.87 | 0.096 | 1.27 | -0.161 | 496 | 31.5% | 65.8% | 4.13 | 174 | 1271 | 136 | 0 | 0.0% | 0.0 | 0.00 | 1567.9 | 5,29,31,38,45,20,13,30,18,17,20,14,15,13,25,12,8,8,20,6,12,6,13,6,13,8,15,16,9,11
BASE 113 | 450000 | 30 | 0.00 | 0.000 | 0.00 | 0.000 | 0 | 0.0% | 0.0% | 0.00 | 0 | 1397 | 117 | 0 | 0.0% | 0.0 | 0.00 | 1186.8 | 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
D 114 | 450000 | 30 | 43.13 | -0.786 | 0.60 | 0.036 | 1504 | 47.5% | 99.8% | 12.59 | 251 | 1104 | 108 | 0 | 0.0% | 0.0 | 0.00 | 1735.1 | 28,53,71,69,79,70,63,67,63,50,36,48,48,61,51,42,39,35,36,43,45,57,66,83,63,25,29,23,39,22
RANDCAP 114 | 450000 | 30 | 35.07 | 1.336 | 3.73 | -0.179 | 1192 | 34.0% | 77.2% | 8.47 | 285 | 1188 | 121 | 0 | 0.0% | 0.0 | 0.00 | 1685.6 | 11,21,74,70,60,40,57,43,47,51,46,26,37,45,38,26,30,23,21,38,27,34,37,38,43,41,49,53,33,33
DIRECT 114 | 450000 | 30 | 16.87 | -0.996 | 0.93 | -0.132 | 655 | 44.4% | 91.0% | 7.24 | 99 | 1201 | 114 | 0 | 0.0% | 0.0 | 0.00 | 1710 | 35,29,27,32,37,23,35,25,19,7,13,16,34,37,33,15,36,14,17,7,19,25,42,19,15,11,7,10,8,8
DRIFT 114 | 450000 | 30 | 119.80 | -0.771 | 0.53 | -0.039 | 3082 | 1.9% | 3.9% | 15.50 | 692 | 1502 | 114 | 0 | 0.0% | 0.0 | 0.00 | 1868.3 | 9,26,38,39,65,81,101,110,96,119,119,119,107,139,117,127,113,119,120,112,123,131,153,122,129,96,105,134,110,103
SHUF 114 | 450000 | 30 | 12.00 | -0.075 | 0.87 | -0.054 | 405 | 38.7% | 80.7% | 5.18 | 195 | 1324 | 113 | 0 | 0.0% | 0.0 | 0.00 | 1760.3 | 7,32,34,25,12,10,15,10,13,12,11,9,10,13,12,12,16,16,7,3,10,18,18,7,14,13,17,13,5,11
BASE 114 | 450000 | 30 | 0.00 | 0.000 | 0.00 | 0.000 | 0 | 0.0% | 0.0% | 0.00 | 0 | 1502 | 114 | 0 | 0.0% | 0.0 | 0.00 | 1363.2 | 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
D 115 | 450000 | 30 | 51.07 | 0.404 | 6.20 | 0.096 | 1581 | 26.9% | 61.8% | 7.71 | 289 | 1217 | 570 | 0 | 0.0% | 0.0 | 0.00 | 1776.5 | 17,51,65,55,39,50,52,51,48,56,73,64,73,56,65,72,48,36,35,42,42,43,45,61,69,67,71,55,41,39
RANDCAP 115 | 450000 | 30 | 30.47 | -0.193 | 2.40 | -0.179 | 1066 | 21.8% | 45.9% | 7.90 | 244 | 1221 | 312 | 0 | 0.0% | 0.0 | 0.00 | 1811 | 14,35,25,26,29,47,55,46,64,63,40,33,63,29,40,25,29,29,38,38,36,29,26,36,28,24,34,34,20,31
DIRECT 115 | 450000 | 30 | 23.40 | 1.596 | 1.87 | 0.018 | 880 | 33.6% | 69.8% | 8.43 | 187 | 1266 | 339 | 0 | 0.0% | 0.0 | 0.00 | 1782.9 | 25,34,41,59,50,48,34,33,35,33,37,35,39,16,10,9,18,16,20,19,25,26,19,15,21,27,34,22,33,47
DRIFT 115 | 450000 | 30 | 97.13 | -0.332 | 0.73 | 0.046 | 2779 | 4.2% | 8.3% | 15.52 | 655 | 1473 | 339 | 0 | 0.0% | 0.0 | 0.00 | 1730.5 | 31,69,64,82,99,103,76,97,104,111,111,95,104,92,84,80,99,92,91,108,106,108,106,107,115,99,87,87,92,80
SHUF 115 | 450000 | 30 | 12.40 | -0.514 | 0.60 | -0.018 | 476 | 31.2% | 66.9% | 4.91 | 183 | 1252 | 320 | 0 | 0.0% | 0.0 | 0.00 | 1683.8 | 16,38,47,20,9,19,9,10,11,13,25,19,17,21,16,14,16,20,12,14,17,14,7,11,8,9,14,8,16,6
BASE 115 | 450000 | 30 | 0.00 | 0.000 | 0.00 | 0.000 | 0 | 0.0% | 0.0% | 0.00 | 0 | 1473 | 339 | 0 | 0.0% | 0.0 | 0.00 | 1258.3 | 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
```
Go criterion:
```
seed 113: D Lu 29.73 LuInc 0.87 trend 0.146 body 29.1% N 1218 | RANDCAP 30.73/1.93 DIRECT 15.27/0.00 DRIFT 77.33/1.27 SHUF 10.87/1.27 -> FAILS [Lu > RANDCAP, Lu > DRIFT, LuInc > RANDCAP, LuInc > DRIFT]
seed 114: D Lu 43.13 LuInc 0.60 trend -0.786 body 47.5% N 1104 | RANDCAP 35.07/3.73 DIRECT 16.87/0.93 DRIFT 119.80/0.53 SHUF 12.00/0.87 -> FAILS [Lu > DRIFT, LuInc > RANDCAP, trend>=0]
seed 115: D Lu 51.07 LuInc 6.20 trend 0.404 body 26.9% N 1217 | RANDCAP 30.47/2.40 DIRECT 23.40/1.87 DRIFT 97.13/0.73 SHUF 12.40/0.60 -> FAILS [Lu > DRIFT]
mean Lu(D)/Lu(RANDCAP) over seeds: 1.291 (needs >= 1.10)
=> NO-GO.
```

#### POST-HOC diagnostic on stage 2 (R1, 450k, seeds 113-115; appended by diag-waiter2.sh 2026-10-04 13:02 BST). Not a go criterion.
```
# chance-diag (post-hoc, not a go criterion): DIR /home/box/chance-runs/s2-R1, seeds 113 114 115, WIN 5 samples (5000 ticks)

## 1. Evolved randomness trajectory (population mean rate multiplier exp(temperature), start 1; tail alpha, start 1.5)

## 2. Churn vs use (types arriving in the readout per window: genuinely new vs re-appearing; persistence of new types)
arm seed | windows | arrivals/window new | re-appearances/window | re-appearance share (all / late third) | new types still present +1 / +2 / +4 windows | new USED/window late third
D 113 | 90 | 125.4 | 32.3 | 20% / 27% | 24% / 9% / 4% | 19.93
D 114 | 90 | 148.1 | 65.2 | 31% / 43% | 25% / 11% / 6% | 25.33
D 115 | 90 | 149.1 | 72.0 | 31% / 43% | 25% / 11% / 6% | 30.47
RANDCAP 113 | 90 | 120.2 | 97.7 | 46% / 64% | 25% / 9% / 5% | 20.17
RANDCAP 114 | 90 | 111.9 | 86.3 | 43% / 61% | 24% / 9% / 5% | 24.00
RANDCAP 115 | 90 | 112.6 | 81.5 | 42% / 62% | 24% / 9% / 4% | 18.07
DIRECT 113 | 90 | 58.5 | 26.3 | 32% / 32% | 27% / 12% / 6% | 9.90
DIRECT 114 | 90 | 79.2 | 30.4 | 30% / 35% | 25% / 10% / 5% | 9.97
DIRECT 115 | 90 | 88.1 | 40.8 | 31% / 35% | 27% / 12% / 8% | 16.20
DRIFT 113 | 90 | 170.4 | 162.9 | 47% / 62% | 27% / 12% / 8% | 42.27
DRIFT 114 | 90 | 203.4 | 236.3 | 48% / 75% | 28% / 13% / 8% | 65.40
DRIFT 115 | 90 | 188.8 | 185.8 | 46% / 69% | 29% / 14% / 9% | 52.63
SHUF 113 | 90 | 114.1 | 21.9 | 17% / 19% | 26% / 7% / 2% | 9.60
SHUF 114 | 90 | 113.1 | 16.8 | 13% / 20% | 25% / 6% / 1% | 11.30
SHUF 115 | 90 | 110.2 | 16.3 | 13% / 19% | 26% / 7% / 2% | 10.30

## 3-4. Correlations over windows (arms with evolvable randomness only)
arm seed | corr(rate, new used) | corr(rate, persistence +2) | corr(rate change in w, new used in w-1) [<0 = rises when stuck] | corr(rate in w, new used in w+1) [>0 = use follows]

## Classification (D; rule: outcome 1 if late rate <= 0.5 on >= 2 seeds; outcome 2 if late rate >= 2 and late re-appearance share >= 50% and late new-used not above R1/RANDCAP on >= 2 seeds; outcome 3 if pooled corr(rate change, previous new-used) <= -0.3 AND pooled corr(rate, next new-used) >= +0.3; otherwise mixed)
no arm with evolvable randomness found: not classifiable
```

#### POST-HOC coexistence/replacement and cause-of-death readouts on stage 2 (chance-diag2.js; see definitions and limits above)
```
# chance-diag2 (POST-HOC, not a go criterion): DIR /home/box/chance-runs/s2-R1, seeds 113 114 115, WIN 5 samples (5000 ticks). Pooled over seeds per arm.

## 1a. New one-step types vs same-substrate incumbents (population proxy; no lineage data), outcome one window later
arm | new types (all) | of which pathways (no substrate logged, excluded) | one-step new | no incumbent on substrate | coexist | replace | new lost | both lost | coexist share of (coexist+replace) | incumbent group wholly gone at w+1: with arrival / background without arrival | USED one-step new: coexist / replace
D | 37519 | 15641 (42%) | 21878 | 47% | 7% | 6% | 19% | 21% | 56% (n=2867) | 50% / 88% | 350 / 335 (51%)
RANDCAP | 30699 | 1059 (3%) | 29640 | 37% | 7% | 8% | 20% | 28% | 47% (n=4489) | 58% / 86% | 510 / 622 (45%)
DIRECT | 19968 | 11328 (57%) | 8640 | 60% | 7% | 3% | 16% | 14% | 69% (n=877) | 42% / 81% | 130 / 81 (62%)
DRIFT | 50148 | 13359 (27%) | 36789 | 25% | 12% | 8% | 30% | 24% | 61% (n=7499) | 43% / 75% | 967 / 734 (57%)
SHUF | 29882 | 15171 (51%) | 14711 | 66% | 2% | 6% | 6% | 20% | 27% (n=1164) | 76% / 94% | 41 / 106 (28%)

## 1a-est. Same, but incumbents = ESTABLISHED same-substrate one-step types (present in both w-2 and w-1)
arm | cases | coexist | replace | new lost | both lost | coexist share of (coexist+replace) | established group wholly gone at w+1: with arrival / background without arrival
D | 6268 | 19% | 7% | 49% | 26% | 72% (n=1611) | 33% / 80%
RANDCAP | 9284 | 16% | 9% | 42% | 33% | 64% (n=2331) | 42% / 78%
DIRECT | 1946 | 20% | 7% | 47% | 26% | 74% (n=517) | 33% / 66%
DRIFT | 17356 | 20% | 8% | 47% | 24% | 70% (n=4933) | 33% / 65%
SHUF | 1661 | 8% | 16% | 26% | 50% | 35% (n=399) | 66% / 93%

## 1b. Census per window (all types incl. pathways): entries of genuinely new types, re-entries of earlier-seen types, exits, net change in present types; body.kinds (full census) at 1/3 and end
arm seed | windows | new entries/window (of which pathways) | re-entries/window | exits/window | net present-type change/window | exits per entry | kinds at 1/3 -> end
D 113 | 90 | 126.6 (57.6) | 32.6 | 157.1 | +2.1 | 1.24 | 249.8 -> 194.6
D 114 | 90 | 149.5 (57.8) | 65.9 | 213.2 | +2.3 | 1.43 | 310.8 -> 230.8
D 115 | 90 | 150.2 (62.3) | 72.4 | 219.0 | +3.6 | 1.46 | 320.4 -> 271.2
RANDCAP 113 | 90 | 122.1 (4.2) | 98.8 | 218.0 | +2.9 | 1.79 | 326.2 -> 208.0
RANDCAP 114 | 90 | 113.3 (5.3) | 86.8 | 195.9 | +4.2 | 1.73 | 331.6 -> 293.6
RANDCAP 115 | 90 | 113.5 (2.5) | 81.9 | 192.3 | +3.2 | 1.69 | 302.4 -> 247.2
DIRECT 113 | 90 | 58.8 (27.3) | 26.5 | 83.7 | +1.6 | 1.42 | 86.2 -> 137.0
DIRECT 114 | 90 | 79.8 (44.4) | 30.9 | 110.6 | +0.2 | 1.39 | 64.0 -> 36.4
DIRECT 115 | 90 | 88.3 (57.0) | 41.1 | 125.9 | +3.5 | 1.42 | 245.4 -> 267.4
DRIFT 113 | 90 | 172.4 (46.1) | 163.0 | 327.6 | +7.8 | 1.90 | 494.6 -> 595.0
DRIFT 114 | 90 | 206.5 (51.5) | 237.4 | 434.7 | +9.2 | 2.10 | 587.4 -> 609.2
DRIFT 115 | 90 | 191.0 (54.1) | 186.5 | 368.7 | +8.7 | 1.93 | 489.8 -> 601.2
SHUF 113 | 90 | 114.8 (57.5) | 22.0 | 134.8 | +2.0 | 1.17 | 198.6 -> 165.6
SHUF 114 | 90 | 113.9 (58.1) | 16.9 | 128.7 | +2.0 | 1.13 | 191.6 -> 188.0
SHUF 115 | 90 | 110.9 (56.8) | 16.4 | 125.7 | +1.7 | 1.13 | 215.2 -> 160.2

## 2. Cause of death: genuinely new types gone one window later (shares of those deaths)
arm | deaths (of new types) | demand vanished | still earning when lost (out-competed or drift) | declining | income never above readout (0.2% of all chemical income): CAUSE NOT DETERMINABLE | undetermined (censored at end) | USED deaths: n, demand / still earning / never | one-step still-earning deaths with a same-substrate riser (displaced)
D | 28231 | 0% | 0% | 0% | 100% | 0% | 523, 0% / 3% / 97% | 16/24 (67%)
RANDCAP | 23407 | 0% | 1% | 0% | 99% | 0% | 465, 0% / 4% / 94% | 41/64 (64%)
DIRECT | 14783 | 0% | 1% | 0% | 98% | 0% | 219, 0% / 11% / 79% | 14/21 (67%)
DRIFT | 36279 | 0% | 1% | 0% | 99% | 0% | 657, 0% / 2% / 98% | 32/72 (44%)
SHUF | 22336 | 0% | 0% | 0% | 100% | 0% | 181, 1% / 5% / 91% | 2/9 (22%)

## 2-vis. Restricted to deaths whose income was visible in >= 1 sample (the only ones whose cause can be read): counts
arm | n | demand vanished | still earning when lost | declining | undetermined
D | 137 | 2 | 119 | 3 | 13
RANDCAP | 152 | 3 | 120 | 4 | 25
DIRECT | 269 | 0 | 219 | 5 | 45
DRIFT | 231 | 0 | 228 | 1 | 2
SHUF | 67 | 2 | 46 | 1 | 18

## 2b. Same, split by kind: one-step (1s) vs pathway (Ch) deaths: n, demand / still earning / income never visible
D | 1s n=16756: 0% / 0% / 100% | Ch n=11475: 0% / 1% / 99%
RANDCAP | 1s n=22838: 0% / 0% / 100% | Ch n=569: 0% / 7% / 92%
DIRECT | 1s n=6550: 0% / 0% / 100% | Ch n=8233: 0% / 2% / 97%
DRIFT | 1s n=27032: 0% / 1% / 99% | Ch n=9247: 0% / 1% / 99%
SHUF | 1s n=11207: 0% / 0% / 100% | Ch n=11129: 0% / 0% / 100%
```
