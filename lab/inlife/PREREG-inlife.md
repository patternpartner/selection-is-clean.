# Are in-life program changes adaptive or neutral? Pre-registration (written before any deciding run)

Written 13 Oct 2026. Engine: `engine.html` on main at 8795752, default settings, no knobs. Notes not used as evidence.

## Question
A founder's program changes during its own life (own VM opcodes: grow, segment copy, horizontal transfer, whole-program copy). Children inherit the
changed program. Do those accumulated changes help the individual (ADAPTIVE), do nothing (NEUTRAL), or hurt (MALADAPTIVE)?

## Why not just compare changed founders with unchanged ones
Founders that changed are not a random subset (they had neighbours, resources, time). That comparison is confounded. So: a randomized intervention.

## Design (within one run, same environment, randomized)
- Run the engine headless. Tag every founder at tick 1 (WeakMap keyed by the genome object, so descendants are never tagged) with its tick-1 program.
- At tick T = 1500, take the ELIGIBLE set: true founders alive whose current program differs from their tick-1 program ("changed"; hash over op, a, b and k to 3 dp).
- Randomly split the eligible set into three equal arms (own seeded PRNG, so the engine's random stream is not consumed by the assignment):
  - REVERT: program replaced by a clone of the founder's tick-1 program (written to pProg[i] and pGenome[i].vmProgram, the two stores).
  - SHAM:   program replaced by a clone of its own CURRENT program (same code path, no content change).
  - CONTROL: untouched.
- Follow every eligible founder to tick T + 2500 = 4000. Also reported, not randomized: UNCHANGED founders (not eligible).
- Primary outcome: survival to tick 4000 (alive, same genome object). Secondary: parented births credited to the individual in (T, 4000].
- Balance checks reported per arm before treatment: n, mean program length, mean number of differing instructions from tick 1, fraction with pProg aliased to genome.vmProgram.
- Integrity checks: after intervention REVERT programs hash to their tick-1 hash and SHAM programs to their pre-intervention hash; no engine error.

## Seeds
Practice (debugging only, not counted): seed 1. Deciding: seeds 11, 12, 13, 14, 15 (never run in any probe of this session). One run per seed.
A seed COUNTS if no engine error and eligible n >= 90 (30 per arm). Fewer than 3 counted seeds = INCONCLUSIVE (no ruling either way).

## Analysis
D = survival(REVERT) - survival(SHAM), pooled over counted seeds (arms are equal size within a seed, so pooling is the plain proportion).
p = two-sided stratified permutation test (REVERT/SHAM labels permuted within seed, 20,000 permutations).
CI = stratified bootstrap 95% (individuals resampled within arm within seed, 4,000 resamples).
Sign agreement = number of counted seeds whose per-seed difference has the same sign as D.

## Decision rule (primary outcome only)
- ADAPTIVE:     D <= -0.05 and p < 0.05 and negative on at least 2/3 of counted seeds.
- MALADAPTIVE:  D >= +0.05 and p < 0.05 and positive on at least 2/3 of counted seeds.
- NEUTRAL:      CI lies inside [-0.08, +0.08] (and neither rule above fired).
- otherwise INCONCLUSIVE.
- Guard: if |survival(CONTROL) - survival(SHAM)| pooled > 0.05, the replacement itself perturbs the individual; the verdict is then reported as
  COMPROMISED and REVERT is compared with CONTROL instead.
Secondary (offspring): same difference, permutation p and CI, reported beside the verdict, not ruling.

## What this cannot say
"Adaptive" here means: undoing a founder's accumulated program change lowers its survival over the next 2,500 ticks, at default settings, from tick 1,500.
It does not show that the changes were selected, targeted, or that the mechanism itself is under selection; it does not test descendants, other horizons,
other settings or later generations; and a revert also discards any state tied to the changed program, which SHAM does not control for. One horizon,
five seeds, one run per seed.
