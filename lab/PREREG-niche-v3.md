# PRE-REGISTRATION: niche construction v3 (costly building, upkeep, heritable builders)

Branch `cos/niche-v3`, from `cos/niche-v2` (62e613d). Written and pushed BEFORE any deciding run. The deciding seeds 13, 14 and 15 have never been run with any NICHE setting.

## Question
When building and maintaining shared structures is COSTLY to the builder, do builders outcompete freeloaders? If they do, construction itself becomes a selected, heritable trait. Does that trait produce ongoing used novelty?

v2 (RESULT-niche-v2.md) found used novelty above zero whenever shared, copyable structures existed. But randomly placed structures did as well on 2 of 3 seeds, so authorship by selection was not shown. v2's V1 also hit the 2M compound memory cap on seeds 10 and 12.

## Mechanism (lab/oee-core.js; every new knob is off by default)
- **NICHE_GC (cap fix):** one tick after each sample (every 1,000 ticks), compounds are freed and their ids reused if no structure holds them, no organism's recipe slot holds them, and they are not in the ancestry of a held compound. Under GC, a compound's identity and its properties (catalysis target, channel key) come from a hash of its COMPOSITION (base species plus the sequence of added species), not from creation order. So a freed compound that is made again is the same compound, and the samples name compounds by that hash. Channel pools that have regrown to within 1e-9 of full are dropped; a dropped pool comes back full on next use, which is the same state. The 2M guard is still there, and its hits are counted and reported.
- **NICHE_BLD (heritable builder):** each organism has a builder bit.
  - The first organisms (and any reseeds) get it with probability NICHE_B0 = 0.5. A child inherits it, flipped with probability NICHE_BMUT = 0.002, using its own RNG.
  - BUILD does nothing for a non-builder. Everyone can still COPY and CATAL, so freeloaders benefit from structures within R = 2.
- **NICHE_UP (upkeep):**
  - Each structure has a condition between 0 and 1, which decays by NICHE_UDECAY = 0.0003 per tick (half-life about 2,300 ticks).
  - Catalysis and channel yields are multiplied by the condition. A structure whose condition falls below NICHE_UMIN = 0.05 is gone, about 10,000 ticks after its last upkeep.
  - When a builder executes BUILD on its own cell's structure and the condition is below NICHE_UREN = 0.7, it pays NICHE_UCOST = 0.05 and restores the condition to 1. It may then extend as before. Founding, extending and recipe-building also set the condition to 1.
- **Build costs paid by the builder:** NICHE_XCOST = 0.1 per found or extend (v2 used 0.02) and NICHE_BCOST = 0.3 per recipe build (v2 used 0.1). For scale, an organism divides at 1.2 energy. Founding and extending still pay the builder the bond energy, as in v1 and v2; that is a private return.
- **NICHE_BSCHED (selection null):** a child's builder bit is drawn at random, with probability equal to the matched W1 run's builder-bit share at that time, instead of being inherited.
- **NICHE_RAND_SCHED (availability null), as in v2, extended:** organisms cannot build. W1's per-1,000-tick counts of founds, extends, recipe builds and maintenances are applied at random cells or structures, and nobody pays for them.

Byte-identity: unset output is identical to origin/main (default, CHEM, CHEM+VIRUS, TASKS, CHEM_BIG; seed 97, 4,000 ticks). NICHE 1/2/3 and the v2 V1/V3 configurations with the v3 knobs off are identical to 62e613d (seed 96, 40,000 ticks). Checked before this commit.

## Tuning log (trial seeds 95 and 96 only; 200k ticks; one round)
- C1: XCOST 0.1, BCOST 0.3, UCOST 0.05, UDECAY 0.0003, UREN 0.7, BMUT 0.002, B0 0.5. Results:
  - structures held 0.6–15.7% of late income;
  - builders had a lower mean store than freeloaders (4.8 vs 7.2, and 3.8 vs 4.9), so the cost bites;
  - at most 39 live compounds, and no cap hits.
- C2 (half of C1's costs): similar or less building on seed 95 (19 structure cells late).
- W0 (v2 V1 plus GC): up to 680 live compounds, with 0 cap hits (v2 had 2M).
- **C1 was chosen** as the "costly" setting. The choice came from the costs visibly biting while building persisted. No used-novelty comparison against a null was run in tuning.
- **Change made after looking at the trials:** the bare builder bit hitchhikes, because it is free to carry without a BUILD op. In trials the bit share was 0.1–0.9 while ACTIVE builders (bit plus a BUILD op) were 0.2–29%. So the builder criterion below uses the ACTIVE share. The bit share is also reported.
- The pipeline smoke test (seed 94, 30k ticks) was not looked at for metrics.

Nothing else will be tuned after this file is pushed.

## Arms (lab/niche-v3/run.sh is the exact source)
Base (the v2 V1 settings) = `CHEM 1, NICHE 2, NICHE_R 2, NICHE_COPY 1, NICHE_OPEN 1, NICHE_OPEN_P 0.125, NICHE_OPEN_CAP 2, NICHE_GC 1`.
- **W0:** base plus XCOST 0.02 (v2 V1 without the v3 costs, but with the cap fix). There is no builder bit, so everyone can build.
- **W1:** base plus XCOST 0.1, BCOST 0.3, BLD 1, UP 1, UCOST 0.05.
- **W2:** W1 plus RAND_SCHED from the same seed's W1 (structures placed at random at the matched rate).
- **W3:** W1 plus BSCHED from the same seed's W1 (builder bit not heritable; share matched).

Seeds 13, 14 and 15. The horizon is **900,000 ticks**, sampled every 1,000 (30 windows of 30 samples; the late half is 15 windows). One run per arm per seed. W0 and W1 run at once; W2 and W3 start when the seed's W1 ends. Estimated wall time is about 2 h, inside the 3 h budget. The horizon will not change. A run that dies is re-run with the identical configuration (`ONLY="W2 14" lab/niche-v3/run.sh`).

## Metrics (lab/niche-v3/analyse.js)
- **Used compound in a window:** its mean share of structure income is at least 1%, OR its recipe is carried by at least 1% of organisms (the same measure as v2, with identity by composition hash).
- **Primary, Lu:** the mean number of NEW used compounds per window over the late half, plus the OLS trend of those per-window counts.
- **Builder dynamics:**
  - the active builder share (bit plus a BUILD op) per window: the mean of the first 3 late-half windows against the mean of the last 3;
  - its late-half slope;
  - the bit share;
  - the bit carriers' share of births;
  - the mean store of builders against others.
- **Also reported:** income-only new used, the v1 metric, used ever, max depth used, structure share of income, structure cells, builds, maintenances, cap hits, max live compounds, compounds ever made, N and income.

## Verdict rule
**POSITIVE** only if every one of the following holds on all 3 seeds:
- W1's Lu is above 0;
- W1's trend is at least 0;
- W1's Lu is above W2's Lu;
- W1's Lu is above W3's Lu;
- W1's active builder share is maintained: the mean of the last 3 windows is at least 0.75 × the mean of the first 3 late-half windows, AND at least 0.01.

Otherwise the verdict is **NOT SHOWN**. W0 is reported for context (the effect of the costs) and carries no verdict weight. Cap hits are reported for every run.

## Caveats declared in advance
- One run per arm per seed.
- Lu is small-count data, so ties are possible, and a tie fails the "beats" tests.
- In W2, COPY still sets recipes that cannot be built; these are counted the same way. The income-only measure is reported too.
- Under GC, the extension flux keys used by the v1 metric include compound ids, which can be reused. The v1 metric is secondary.
- The builder bit is drawn from its own RNG, so W1 and W3 share the main random stream until behaviour diverges.
- W3 keeps W1's bit share, but viability differences within a lifetime can still move it. The realised share is reported.
