# META-SEARCH over world rules (branch cos/meta-search, from cos/cross-feeding 0535d6c)

Registered **before the search starts** (2026-10-04 ~00:35 BST). Nothing below is changed after results come in; results are only
appended to `lab/meta/search-log.md` and `lab/meta/evals.csv` by the driver (`lab/meta/search.js`).

## Why
Phases A–A4 hand-designed one mechanism per round and each was a NO-GO. Here the computer searches the rules instead. The most
important part is the **variation operator**: in A3b and A4 directed capture (substrate = the parent's last product) lost to random
capture (RANDCAP null won on every seed). So the capture/mutation rule is searchable, and lineages can carry it as heritable
traits (evolvable evolvability).

## New knobs (lab/oee-core.js, off by default, byte-identical to 0535d6c and main when unset; `lab/meta/bytecheck.txt`)
- `BODY_CW [wLast,wRand,wEnv,wExt]` – capture-substrate source mixture: LAST (a recent parent product), RAND (uniform species),
  ENV (most abundant of 8 random species in the parent's cell), EXT (end product of one of the parent's own catalysts = extend a pathway).
- `BODY_HIST` 1–4 and `BODY_HL` – parent-history weighting: LAST draws from the parent's last BODY_HIST distinct products, entry i weight BODY_HL^i.
- `BODY_MQ` – probability a point mutation redraws the substrate (was fixed 0.5).
- `BODY_EVO σ` – evolvable evolvability: each organism carries heritable log-multipliers of BODY_MUT and BODY_CAP and its own four
  capture-source logits; a child inherits the parent's values + N(0,σ) (clamped ±3). Readout `body.evo` (mean rates, mean source weights).
- The nulls keep their meaning: RANDCAP (`BODY_RCAP`) forces random capture whatever the mixture; SHUF copies a random organism's
  body; NOINH gives no body inheritance. Heritable evolvability parameters stay with the parent line in all nulls.

## Search space (28 genes, every coordinate in [0,1]; `G` in search.js)
Always `CHEM:1, HBODY:1`. BODY_F 0.02–0.3 (log), BODY_MAX {4,8,12,16,24}, BODY_UP 1e-4–3e-3 (log), BODY_UPX {1,1.5,2},
BODY_MUT 0.002–0.1, BODY_DUP / BODY_DEL 0.002–0.05, BODY_CAP 0.005–0.2 (log), BODY_MQ 0–1, BODY_CW four weights 0–1,
BODY_HIST {1..4}, BODY_HL 0.2–1, BODY_EVO off | 0.02–0.5, fusion off | BODY_FUSE 0.005–0.1 with BODY_CHAIN {4,8,12},
XFEED off | on with XF_UPT 0.05–0.5, XF_LEAK 0.02–0.3, scarcity off | SCAR_ON 10000, SCAR_T 10k–40k, SCAR_MIN 0.1–0.7,
niche stack off | skin S2 + NICHE_AC 2 with NICHE_AC_B 3e-4–3e-3.

## Fitness (search seeds 40–49 only; each evaluation = one config on one seed, 80k ticks, sampled every 1000, WIN 8 → 10 windows)
Four runs at matched config and seed: FULL, RANDCAP, SHUF, NOINH. Lu = mean new USED body catalysts per window over the late half
(body-trial.js rule), trend = OLS of those windows. BASE = `{"CHEM":1}` on the same seed and length.

    fit = (Lu_FULL − max(Lu_RANDCAP, Lu_SHUF, Lu_NOINH)) + 1·[trend_FULL ≥ 0]
          − 10·[FULL reseeded or late N_FULL < 0.5·N_BASE] − 5·[FULL late body share < 10%]

A config's score is its mean fitness over its evaluations (different seeds).

## Method (fitted to the box: 8 cores → 8 parallel runs; ~25–35 min per generation)
Elitist evolutionary loop with built-in re-evaluation. Generation 0: 12 configs = 5 known designs (A3 default B, A4 C1, X2,
C1 with random capture, C1 with an even mixture + evolvable evolvability) + 7 random. Each later generation: 10 configs =
the 2 best by mean fitness re-evaluated on a new search seed (guards against lucky seeds), 1 random immigrant, 7 children
(tournament from the top 5, uniform crossover p 0.5, each gene mutated with p 0.2: Gaussian σ 0.15 or a fresh draw for discrete genes).
Runs until 07:30 BST on 2026-10-04 or 20 generations (~150–170 evaluations, ~650 runs). Every evaluation is logged to
`lab/meta/evals.csv`; after each generation the driver commits and pushes the CSV, the log and the state.

## Held-out check (pre-registered; same go criterion as A3/A4)
Top 3 configs by mean fitness among those evaluated on ≥2 seeds (fallback: top 3 overall), re-run on held-out TRIAL seeds
**30, 31, 32** at **450k ticks** (WIN 15 → 30 windows) against all nulls: RANDCAP, SHUF, NOINH, FIXED, and NOLEAK + SHUFENV when the
config has XFEED; plus BASE (matched environment: CHEM + its scarcity/niche settings, no body).
A config is **GO** if on **every** seed: FULL Lu > every null's Lu, FULL trend ≥ 0, FULL late body share ≥ 10%, and no arm reseeded
or fell below 50% of BASE's late N (`lab/autocat/body-check.js go`). Seeds 33–35 are kept in reserve and unused.
Overall verdict: GO if at least one of the three passes. Note: picking the best of 3 is a mild multiple comparison; a GO here
would justify a fresh deciding round, not a claim.
