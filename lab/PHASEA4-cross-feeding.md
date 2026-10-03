# PHASE A4: cross-feeding (one lineage's waste is another's food)

Branch `cos/cross-feeding`, from `cos/heritable-body` (3b180b2). **Trial seeds only (50–55). No deciding pre-registration, no
deciding seed has been run.** Each arm is run once per seed. Raw readouts are in `lab/autocat/trial/a4-*`.

## Why
A3b (C1, pathway fusion) paid well (body share 32–41%) but lost to RANDCAP on all of seeds 63–65, with a negative trend on 2.
The user-approved next step is an ecosystem: if an organism's waste is a neighbour's food, the value of an invention depends on
what the neighbours produce, so the fitness landscape keeps shifting (a Red Queen through metabolism).

## Mechanism: `XFEED` in lab/oee-core.js (needs HBODY; off by default, byte-identical when unset)
- **Internal pool:** each organism gets a cytoplasm holding the 256 species.
- **Uptake:** every tick, for each body catalyst, it takes up XF_UPT (0.2) of the cell's substrate into the pool.
- **Catalysis:** catalysts run on the pool, converting BODY_F of the pool's substrate, not on the cell.
- **Waste and leak:** a species in the pool that none of its own catalysts consume is WASTE. XF_LEAK (0.1) of each waste
  species leaks into the cell per tick. There it diffuses and decays as usual, and it is food for any neighbour whose catalysts
  take it up.
- **Conservation:** the pool decays at the cell rate, is split in half at division, and is released into the cell at death, so
  energy is conserved.
- No compound is named and novelty is never paid.

Under A3/A3b a body catalyst acted on the cell directly. Under XFEED, an organism's products reach others only by leaking or at
its death.

## Cross-feeding measure (logged before results)
Leaked and death-released molecules carry a tag layer that diffuses, decays and is consumed with them. An organism never takes
up its own waste (waste is by definition what none of its own catalysts consume), so tagged uptake is material made by OTHER
organisms.

**Cross-feeding share** = body income made from tagged substrate / body income, late half.

Environmental heterogeneity (to check the world does not simply homogenise), both computed by energy content:
- the number of distinct dominant non-food species, each dominant in ≥ 1% of occupied cells;
- the entropy of that dominant-species distribution.

## Designs (all on top of A3b C1: B3 + BODY_FUSE 0.02), fixed before any result
- **X1:** XFEED 1, XF_UPT 0.2, XF_LEAK 0.1.
- **X2:** X1 + scarcity (SCAR_T 100000, SCAR_MIN 0.25: base METAB slows to a quarter from tick 20k to 120k). Intermediate
  species then come mainly from body waste rather than from base metabolism. Its BASE carries the same scarcity.

## Arms
- **FULL:** the design.
- **RANDCAP:** BODY_RCAP 1 (random capture substrates).
- **NOLEAK:** XF_LEAK 0. Waste stays private in the pool; only death releases it.
- **SHUFENV:** XF_SHUF 1. Each leaked portion enters the cell as a uniformly random species, with its amount scaled so the
  energy is the same.
- **NOINH:** BODY_INH 0.
- **FIXED:** BODY_FIXED 1 (one-step base reactions only, no fusion).
- **BASE:** CHEM (+ the design's scarcity); population reference only.

## Design-choice rule (fixed before any result: `body-check.js pick`, NULLS = RANDCAP NOLEAK SHUFENV NOINH FIXED)
- 150k on trial seeds 50–52, WIN 10.
- **Disqualify** a design if any body arm reseeds or has late N below 50% of its BASE.
- Otherwise **pick** the most FULL-ahead comparisons on late Lu (5 nulls × 3 seeds = 15).
- **Ties** go to the higher FULL body share.
- If all are disqualified, the least-bad goes forward, flagged.
- The chosen design runs at **450k on fresh trial seeds 53–55**, WIN 15.

## Go criterion (fixed before any result: `body-check.js go`)
On **all 3** of seeds 53–55, all of the following must hold:
- Lu(FULL) > Lu of each of RANDCAP, NOLEAK, SHUFENV, NOINH and FIXED (RANDCAP and SHUFENV are the key ones);
- FULL's late Lu trend is ≥ 0;
- FULL's body share of ALL late income (including direct light) is ≥ 10%;
- the population survives in every body arm: no reseed, and late N ≥ 50% of BASE.

Otherwise: **no-go**.

The cross-feeding share and heterogeneity are reported for every arm but carry no go weight.

## Byte-identity
- With XFEED unset, an HBODY C1+RANDCAP run is identical to A3b's code (3b180b2).
- The unset configs are identical to origin/main (default, CHEM, CHEM+VIRUS, TASKS, CHEM_BIG) and to cos/skin (NICHE 2, v3 W1,
  skin S1, S2).
- Output: `trial/a4-bytecheck.txt`. The only later code change is to the heterogeneity readout, which only reads state.

## Smoke test (X1, seed 59, 30k ticks; not a trial result; `trial/a4-smoke-*.txt`)
| arm | N | body share of all income | cross-feeding share | leaked energy / 1k ticks | dominant species |
|---|---|---|---|---|---|
| FULL | 1,239–1,339 | 15% → 31% | 32% → 9% | 20k–44k | 9–17 |
| NOLEAK | 1,207–1,296 | 11% → 31% | 23% → 9% (all from death release) | 0 | 13–18 |
| SHUFENV | 937–1,042 | 8% → 17% | 4–7% | 16k–65k | 1 (by amount; the readout now uses energy) |

Early cross-feeding is real but falls as bodies grow. Death release alone gives NOLEAK a similar share, so leak is not yet
clearly the main channel.

## Log
