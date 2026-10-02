# PRE-REGISTRATION: skin (a membrane around the builder's work)

Branch `cos/skin`, from `cos/niche-v3` (bea57cc). Written and pushed BEFORE any deciding run. The deciding seeds 16, 17 and 18 have never been run with any NICHE or SKIN setting.

## Question
niche-v3 (RESULT-niche-v3.md) was NOT SHOWN: when building was costly and the builder trait heritable, builders lost to freeloaders, because a structure sat in a cell where everyone within R = 2 could use it (a public good). Life's answer to freeloading is a boundary. If what an organism builds is kept INSIDE it, so only it (and, if inherited, its offspring) benefits, do builders hold their ground and does construction keep producing new, used chemistry?

## Mechanism (lab/oee-core.js; every new knob is off by default)
- **NICHE_SKIN 1 (membrane):** structures are no longer in cells but inside organisms. What an organism founds, extends, builds from a recipe or maintains is its own internal stock (one compound per organism, as one cell held one in v1-v3). The stock moves with the organism and is lost when it dies. Its catalysis (CATAL, the METAB bonus, channel income) pays only its owner: nobody within R gets anything, and COPY can read only the organism's own stock. The v3 build costs (XCOST 0.1, BCOST 0.3), upkeep (UCOST 0.05, UDECAY 0.0003, UREN 0.7), the heritable builder bit and the compound GC are all unchanged.
- **NICHE_SKIN_INH 1 (inherited stock):** at division the stock is split. Parent and child each keep half the amount, with the same compound and condition. **0** = reset at birth: the child starts with no stock (its recipe slot is still inherited, as in v3).
- **NICHE_SKIN_REGROW 1:** paid upkeep also tops the amount back up to NICHE_BX (0.05), so a maintained stock is not halved away to nothing in about 8 divisions. (Chosen in tuning; see below.)
- **NICHE_PERM 1 (evolving permeability):** each organism has a heritable p in [0,1] (the first organisms draw it uniformly; at birth, with probability NICHE_PMUT = 0.05, it moves by a uniform step within ±NICHE_PSTEP = 0.1, clamped; own RNG). An organism with no stock of its own may CATAL on the nearest stock-holding organism within R at yield × p(user) × p(owner): the stock leaks out of the owner and is absorbed by the user. It may also COPY that recipe with probability p(user) × p(owner). With PERM off, everyone is sealed (p = 0).
- **NICHE_RAND_SCHED under SKIN (availability null):** organisms cannot build. The matched S1 run's per-1,000-tick counts of founds, extends, recipe builds and maintenances are applied to random LIVING organisms (found from molecules in its cell, extend its stock, give it a copy of a random existing compound, renew its stock). Nobody pays and nobody gets the bond energy.

Byte-identity, checked before this commit: with the new knobs unset, output is identical to origin/main (8efaf9d) for default, CHEM, CHEM+VIRUS, TASKS and CHEM_BIG (seed 97, 4,000 ticks). It is also identical to cos/niche-v3 (bea57cc) for NICHE 1, NICHE 2, v3 W0 and v3 W1 (seed 96, 40,000 ticks). The comparison strips only the wall-clock field `wallS`.

## Tuning log (trial seeds 95, 96 and 97 only; one round)
- Planned for 200k ticks. The box's host was heavily oversubscribed: CPU steal was about 45% and every process got about a quarter of a core. So the round was stopped at 110k–137k ticks.
- Arms: sealed skin with REGROW 0 and with REGROW 1, and permeable skin with REGROW 0 and with REGROW 1. Only mechanism readouts were looked at (lab tool /tmp/skin-tune/mech.js). No used-novelty number and no comparison against any null were computed in tuning.
- What the trials showed:
  - Under the v3 costs, sealed skin almost never got going. The late share of organisms holding stock was 0.000–0.001, and structure income was 0.0%. That held with REGROW 0 or 1.
  - Founding is rare in this chemistry for all worlds: a diagnostic on seed 95 found about 1 successful found per 10,000 ticks, out of 10^5–10^6 build attempts. In v3's public world, structures spread from those rare founds by COPY plus recipe builds from neighbours (hundreds per 10k ticks). Under sealed skin they can spread only down a lineage.
  - Permeability moved: the final mean p was 0.09–0.80 across trial runs.
  - There were no compound-cap hits, and at most 11 live compounds.
- **What was tuned:** only NICHE_SKIN_REGROW, set to **1**. The trials could not tell 0 from 1 (neither got going). The choice is on design grounds, decided before any deciding run: without regrowth, split inheritance halves the stock at every birth, so inheritance would be bound to fade in about 8 generations and S1 versus S3 would be close to a non-test.
- **Left at defaults, untouched:** PMUT 0.05, PSTEP 0.1 and a uniform p start. All v3 costs, R, the channel settings and GC are untouched, as instructed. So S0 is exactly v3 W1.
- **Declared expectation from the trials:** building may never get going under skin in some or all deciding runs. In that case Lu(S1) is 0 and the verdict is NOT SHOWN. That outcome is accepted in advance and will not be retuned.
- The pipeline smoke test (seed 94, 30k ticks) was not looked at for metrics.

Nothing else will be tuned after this file is pushed.

## Arms (lab/skin/run.sh is the exact source)
v3 W1 = `CHEM 1, NICHE 2, NICHE_R 2, NICHE_COPY 1, NICHE_OPEN 1, NICHE_OPEN_P 0.125, NICHE_OPEN_CAP 2, NICHE_GC 1, NICHE_XCOST 0.1, NICHE_BCOST 0.3, NICHE_BLD 1, NICHE_UP 1, NICHE_UCOST 0.05`.
- **S0:** v3 W1 (costly, public).
- **S1:** W1 + SKIN 1 + SKIN_REGROW 1 (sealed, inherited stock).
- **S2:** S1 + PERM 1 (permeability evolving).
- **S3:** S1 + SKIN_INH 0 (stock reset at birth: the inheritance null).
- **S4:** S1 + RAND_SCHED from the same seed's S1 (internal compounds assigned at random rather than built: the availability null).

Seeds 16, 17 and 18. The horizon is **450,000 ticks**, sampled every 1,000. Analysis windows are 15 samples, giving 30 windows with a late half of 15, as in v3. The horizon was chosen to fit about 3 hours on the degraded host: S0–S3 (12 runs) run at once, then S4 (3 runs) starts when each seed's S1 ends. The horizon will not change. A run that dies is re-run with the identical configuration (`ONLY="S4 17" lab/skin/run.sh`), automatically by lab/skin/waiter.sh, at most twice.

## Metrics (lab/skin/analyse.js)
Same as v3:
- **Used compound in a window:** its mean share of structure income is at least 1%, OR its recipe is carried by at least 1% of organisms (identity is by composition hash).
- **Primary, Lu:** the mean number of NEW used compounds per window over the late half, plus the OLS trend of those per-window counts.
- **Builder dynamics:** the active builder share (bit plus a BUILD op), first 3 late-half windows against the last 3; also the bit share, the births share and the stores.

Added for skin:
- the share of organisms holding stock;
- stock-inheritance events;
- CATAL on own stock against leaked stock;
- recipes copied through membranes;
- permeability (mean, share below 0.1, share above 0.5).

Cap hits are reported for every run.

## Verdict rule
**POSITIVE** only if ONE skin arm X (S1 or S2) satisfies all of the following on **all 3 seeds**:
- Lu(X) is above 0;
- trend(X) is at least 0;
- Lu(X) is above Lu(S0);
- Lu(X) is above Lu(S3);
- Lu(X) is above Lu(S4);
- X's active builder share is maintained or rising: the mean of the last 3 windows is at least 0.75 × the mean of the first 3 late-half windows, AND at least 0.01.

The same arm must pass on every seed. If S1 passes some seeds and S2 others, that is NOT SHOWN; it is reported as a secondary count with no verdict weight. Otherwise the verdict is **NOT SHOWN**.

## Caveats declared in advance
- One run per arm per seed. Lu is small-count data, so ties are possible, and a tie fails the "beats" tests.
- S3 and S4 are matched to S1 (sealed). For S2 they are nulls for the skin and for building, but not matched on permeability.
- S0 has public structures, which can also be copied from neighbours. So S0 against S1 compares privacy, not just inheritance.
- Under skin, a stock dies with its owner, while v3 structures outlived their builders. So the skin worlds have less durable construction by design.
- The builder bit and permeability have their own RNG streams, so arms share the main random stream until behaviour diverges.
- The horizon is half v3's (450k against 900k) because of the host slowdown.
