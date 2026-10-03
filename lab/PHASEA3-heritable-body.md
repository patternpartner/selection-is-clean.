# PHASE A3: heritable body (internalised, inherited catalysts)

Branch `cos/heritable-body`, from `cos/scarcity` (b937cfe). **Trial seeds only (70–75). No deciding pre-registration, no
deciding seed has been run.** Each arm is run once per seed. Raw readouts are in `lab/autocat/trial/a3-*`.

## Why
Five rounds (niche v1–v3, skin, autocatalysis, plus scarcity A2) agree on two things:
- Structures placed in the world behave as public goods that random placement matches.
- They never became a way to make a living (about 0–0.1% of late income).

The audit's plateau cause is a fixed menu. So: internalise. Put a heritable, extensible set of catalysts in the BODY,
inherited with copy errors. That expands the menu the way a genome does.

## Mechanism: `HBODY` + `BODY_*` in lab/oee-core.js (HBODY 1 switches it on; BODY itself is the existing birth-energy constant) (off by default; byte-identical when unset, see check below)
- Each organism carries up to BODY_MAX catalysts. Each catalyst is one reaction q → t.
- **Running:** every tick, each catalyst turns BODY_F of the cell's q into t. The organism keeps the energy released, only when
  0 < e(q) − e(t) ≤ CHEM_DMAX (the same small-step rule as METAB). So energy is conserved: it comes only from molecules that are
  there. Only the carrier benefits.
- **Upkeep:** BODY_UP per catalyst per tick, dissipated like instruction costs. It scales with body size.
- **Birth:** the child copies its parent's body with copy errors, from its own RNG stream:
  - per catalyst, with BODY_MUT, its product is redrawn (half the time its substrate too);
  - with BODY_DUP, a random catalyst is duplicated;
  - with BODY_DEL, one is deleted;
  - with BODY_CAP, the child **captures** a new catalyst. Its substrate is the species the parent last MADE (the product of its
    last METAB or body reaction). Its product is drawn from that species' whole downhill band (about 65k possible reactions,
    against the base network's 1,024).
- No compound is named anywhere. Novelty is never paid as such.
- Defaults: BODY_MAX 8, BODY_F 0.2, BODY_UP 0.0005, MUT 0.01, DUP 0.01, DEL 0.01, CAP 0.02.
- The world is CHEM (256-species network) + BODY. No external structures are used.

## Arms
- **FULL:** CHEM + HBODY 1 (+ the design's settings).
- **NOINH:** BODY_INH 0. The body resets at birth; the child keeps only what it captures itself.
- **RANDCAP:** BODY_RCAP 1. A captured catalyst's substrate is a uniformly random species, not what the parent made.
- **SHUF:** BODY_SHUF 1. The child copies the body of a random living organism instead of its parent's.
- **FIXED:** BODY_FIXED 1. Every new or mutated catalyst is one of the base network's 1,024 reactions (no menu expansion).
- **BASE:** CHEM only (population reference, not a null).

## Metric (fixed before any result: `lab/autocat/body-trial.js`)
- A body catalyst is **used** in a window when its mean share of chemical income (base METAB + body) is ≥ 1%, OR it is carried
  by ≥ 1% of organisms. This is the same rule as the compound measure of earlier rounds.
- **Lu** = mean NEW used catalysts per window over the late half, plus its OLS trend.
- **Body income share (criterion)** = body / (base METAB + body + light taken directly), late half. This is stricter than earlier
  rounds' structure share, which left direct light out. The chemistry-only share is reported too.

## Designs for the 150k pick (trial seeds 70, 71, 72; WIN 10), all fixed before any result
- **B1:** defaults.
- **B2:** BODY_UP 0.002 (costly bodies: size must pay).
- **B3:** BODY_F 0.05, BODY_MAX 16 (weaker catalysts, room for larger bodies).

## Design-choice rule (fixed before any result: `body-check.js pick`)
- **Disqualify** a design if, on any seed, any of FULL/NOINH/RANDCAP/SHUF/FIXED reseeds (goes extinct) or has late mean N
  below 50% of BASE.
- Among the rest, **pick** the most FULL-ahead comparisons: Lu(FULL) strictly greater than each of the 4 nulls, on 3 seeds
  (12 possible).
- **Ties** go to the higher mean FULL body share.
- If every design is disqualified, the least-bad one goes forward, flagged.
- The chosen design runs at **450k on fresh trial seeds 73, 74, 75** (WIN 15), all arms + BASE.

## Go criterion for proposing a deciding round (fixed before any result: `body-check.js go`)
On **all 3** of seeds 73–75, all of the following must hold:
- Lu(FULL) > Lu(NOINH), Lu(RANDCAP), Lu(SHUF) and Lu(FIXED);
- FULL's late trend is ≥ 0;
- FULL's late body share of ALL income is ≥ 10%;
- the population survives in every body arm: no reseed, and late N ≥ 50% of BASE.

Otherwise: **no-go**.

## Smoke test (seed 71, 20k ticks, defaults, HBODY 1; not a trial result)
| ticks | N | mean body size | body share of chemical income | body share of all income |
|---|---|---|---|---|
| 5k | 979 | 1.8 | 69% | 23% |
| 10k | 707 | 4.8 | 77% | 33% |
| 20k | 1,181 | 7.4 | 79% | 37% |

This only shows the mechanism runs and pays. It says nothing about the nulls.

Note: a first smoke run used the name BODY, which collides with the existing birth-energy constant BODY (0.4). It was
invalid and discarded, and the knob was renamed HBODY before any trial. The byte-identity check below was run after the rename.

Byte-identity with HBODY unset: identical to origin/main (default, CHEM, CHEM+VIRUS, TASKS, CHEM_BIG) and to cos/skin
(NICHE 2, v3 W1, skin S1, S2). Output: `lab/autocat/trial/a3-bytecheck.txt`.

## Log
