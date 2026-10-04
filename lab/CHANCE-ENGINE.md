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

Fraction of capture-born catalysts that ever become USED (whole run): see `TOTAL` lines in `lab/chance/trial/capdiag-*-63.txt`
(B3 FULL 10.4%; others are filled in below when the runs finish).

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
