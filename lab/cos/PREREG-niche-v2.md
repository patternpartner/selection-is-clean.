# PRE-REGISTRATION — niche construction v2 (branch `cos/niche-v2`, from `cos/niche-construction` 5f5a298)

Written and pushed BEFORE any deciding run. Deciding seeds 10, 11, 12 have never been run with any NICHE setting.

## Why v2
v1 (RESULT-niche.md) failed: a structure helped only the cell it sat in, could not be copied, and was worth about one ordinary reaction step (<0.5% of income). v2 tests the stated fix with three separable knobs, all off by default.

## Mechanism (lab/oee-core.js; all defaults off → unset output byte-identical to main, verified on default, CHEM, CHEM+VIRUS, TASKS, CHEM_BIG, seed 97, 4k ticks; NICHE 1/2/3 with new knobs off identical to v1 5f5a298, seed 96, 40k ticks)
- (a) SHARED `NICHE_R`: CATAL uses the nearest structure within Chebyshev radius R (own cell first, then rings), not just its own cell.
- (b) COPYABLE `NICHE_COPY`: each organism has a heritable recipe slot (inherited on division). New op COPY (op 31) stores the id of the nearest compound within R. BUILD in an empty cell with a recipe builds that compound whole (amount `NICHE_BX`=0.05, energy cost `NICHE_BCOST`=0.1). Founding/extending also sets the builder's recipe. So a useful structure can spread by copying + inheritance.
- (c) RESOURCE-OPENING `NICHE_OPEN`: a compound of depth ≥ `NICHE_OPEN_D`(2) whose id-hash falls under `NICHE_OPEN_P` gets a 20-bit channel key derived compositionally from its parts (no hand-listed list). Each channel is a new regrowing energy pool (cap `NICHE_OPEN_CAP`, regrowth `NICHE_OPEN_RATE`) that no base reaction touches; CATAL on such a compound also takes `NICHE_OPEN_F` of the pool. Income goes to the compound's use account.
- `NICHE_XCOST`: energy cost of founding/extending (dissipated). `NICHE_CMAX`=2,000,000 compound memory guard (hits counted as capHit).
- `NICHE_RAND_SCHED` (V2 null): organisms cannot BUILD; instead the per-1000-tick counts of founds, extends and whole-recipe builds recorded in the matched V1 run are applied at random cells / random existing compounds. Attempts are matched; realised extends can be fewer (random targets may fail).

## Tuning log (trial seeds 95–97 only)
- T1: OPEN_P=1, CAP 5, 16-bit channels → runaway: channels hit the 65,536 ceiling by 150k ticks, >1M compounds, income ×10, world full (~4,077 orgs), depth in the thousands. Rejected as novelty-for-free; led to 20-bit channels and CMAX.
- T2: OPEN_P=1/32, CAP 2, XCOST 0.02 → channels too rare (1–3 by 150k).
- T3 (CHOSEN): R=2, COPY=1, OPEN=1, OPEN_P=0.125, OPEN_CAP=2, XCOST=0.02, rest default. 200k ticks: recipes carried by up to 30–47% of orgs; structures 2–6% of income; 10–1,159 channels; 185–10,539 compounds; no runaway; ~130 MB/process.
- Pipeline smoke test on seed 94 (40k ticks) for the runner; no metric looked at for decisions.
Nothing else was tuned. No further tuning after this file is pushed.

## Arms (lab/niche-v2/run.sh is the exact source of truth)
- V0: `{"CHEM":1,"NICHE":2}` (v1 N2 baseline, expanding only).
- V1: V0 + R=2, COPY=1, XCOST=0.02 + OPEN=1, OPEN_P=0.125, OPEN_CAP=2 (full).
- V2: V1 knobs + NICHE_RAND_SCHED from matched V1 seed (availability null).
- V3: V1 minus OPEN (full minus c).
Seeds 10, 11, 12. Horizon 600,000 ticks, sampled every 1,000. One run per arm per seed. Estimated compute ~1.5–2 h wall (8 cores, ≤9 parallel), under 3 h. Horizon will not change.

## Metrics (lab/niche-v2/analyse.js)
- "Used" compound in a sample: carries ≥1% of that sample's income, OR its recipe is carried by ≥1% of organisms.
- Primary Lu: mean number of NEW used compounds (never used before in that run) per 30-sample window over the late half (samples 300k–600k, 10 windows), plus OLS trend of the per-window counts.
- Also: v1 metric (new active reactions per window, late half), income-only used novelty, used-ever, max depth among used, structure/open income share, channels, compounds, capHit, N, income.

## Verdict rule
OPEN-ENDED-ISH only if, on all 3 seeds: V1 Lu > 0, V1 trend ≥ 0, V1 Lu > V0 Lu, and V1 Lu > V2 Lu. Otherwise NOT SHOWN. V3 vs V1 is reported as the test of whether (c) is load-bearing (no verdict weight).

## Caveats declared in advance
- One run per arm per seed; small n.
- V0 has no recipe slot, so it can only score income-used novelty; the income-only comparison is also reported.
- In V2, COPY still sets recipes that cannot be built (inert labels) and they count the same way; income-only measure reported to show this.
- Recipe carriers are logged only at ≥0.2% share (threshold 1% is above that).
- If capHit > 0 the compound guard bound the run; reported.
