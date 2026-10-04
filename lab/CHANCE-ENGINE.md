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
