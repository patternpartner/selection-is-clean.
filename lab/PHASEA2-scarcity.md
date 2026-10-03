# PHASE A2: scarcity (is invention a way to make a living?)

Branch `cos/scarcity`, from `cos/autocatalysis` (2757a7d). **Trial seeds only (80–89, 90–97). No deciding pre-registration,
no deciding seed has been run.** Each arm is run once per seed. Raw readouts are in `lab/autocat/trial/a2-*`.

## Why
Phase A (`lab/PHASEA-autocatalysis.md`) was a no-go. Catalysed assembly (NICHE_AC 2) made founding 17–38x more common, but
organism-built FULL did not reliably beat the random-placement (RAND, RANDN) or shuffled-heritability (SHUF) nulls. Structures
earned about 0–0.1% of late income. The hypothesis, approved by the user: the base economy is too comfortable. METAB on the
base network pays so well that a new structure is not a way to make a living.

## Mechanism: `SCAR_*` in lab/oee-core.js (off by default; SCAR_T 0 means unset)
From tick SCAR_ON (20,000), over SCAR_T ticks (linear ramp, then held):
- **Every base METAB reaction slows down.** The share of the cell's substrate it turns over is multiplied by a factor that
  falls from 1 to SCAR_MIN. Molecules that are not converted stay in the cell, where they diffuse and decay as before, so
  energy is conserved. Structure-catalysed reactions (CATAL) and channels are not touched.
- **Optionally (SCAR_ALPHA ≥ 0), more of each light meal is left in the cell.** The share left as species 0, instead of being
  taken directly, ramps from CHEM_ALPHA (0.5) to SCAR_ALPHA. This is the same energy split differently, so it is conserved.
- Nothing names a compound and nothing rewards novelty. Structures gain only because the base routes earn less. A population
  can still live on light and slow METAB, so the ramp is gentle and is not a death sentence by design. The population and
  reseeds are reported for every run.

Byte-identity with SCAR_T unset: see the bytecheck log below.

## Arms (`lab/autocat/feas2.sh`)
- FULL = skin S2 + NICHE_AC 2 + AC_B 0.001 (the Phase A v2 design) + scarcity.
- NOAC = FULL without AC.
- RAND = FULL's per-1k [found, extend, recipe, maintain] schedule applied to random living organisms (present pairs).
- RANDN = RAND with named random pairs.
- SHUF = builder bit drawn at FULL's share each sample.
- FULLNS = FULL with no scarcity.

All scarcity arms share the same SCAR settings.

## Designs tried at 150k (trial seeds 80, 81, 82), all fixed before any result
- **D1:** SCAR_T 100000, SCAR_MIN 0.25 (METAB decline only).
- **D2:** D1 + SCAR_ALPHA 0.8 (more light left as chemistry).
- **D3:** SCAR_T 100000, SCAR_MIN 0.1, SCAR_ALPHA 0.8 (strongest).

## Design-choice rule (fixed before any result)
- **Disqualify** a design if, on any seed, any of its scarcity arms has late-half mean N below 50% of that seed's FULLNS, or
  has any reseed (extinction).
- Among the rest, **pick** the one with the most FULL-ahead comparisons: Lu(FULL) strictly greater than Lu(NOAC), Lu(RAND),
  Lu(RANDN) and Lu(SHUF), on 3 seeds (12 possible).
- **Ties** go to the higher mean late structure-income share of FULL.
- If every design is disqualified, the least-bad one by the same count goes to the longer check, flagged as disqualified.
- The chosen design runs at **450k on fresh trial seeds 83, 84, 85** (all six arms).

## Go criterion for proposing a deciding round (fixed before any result)
On **all 3** longer-check trial seeds (83–85, 450k), all of the following must hold:
- Lu(FULL) > Lu(NOAC), Lu(RAND), Lu(RANDN) and Lu(SHUF) on late-half Lu;
- the late trend of FULL is ≥ 0;
- FULL's late structure share of income ((catalysis + channels + build energy) / niche income) is ≥ 10%;
- the population survives in every scarcity arm: no reseed, and late N ≥ 50% of FULLNS.

Otherwise: **no-go**.

## Log
