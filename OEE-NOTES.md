# Swing #11 at the diversity ceiling — open-ended niche economy

Graded honestly, in the spirit of the other ten swings. **Outcome: partial win, not a clean
break.** Real, partitioned niches roughly *halve* the diversity collapse and roughly *double* the
kinds retained vs baseline — the best result of any swing so far — but they do not yet hold the
niche count flat or growing on single-seed runs, so this ships **dormant (all knobs default OFF)**,
not adopted.

## The diagnosis it acts on

- One currency (`amp`), so one way to win → one winner. Confirmed in code: every income path
  (`worldEnergy`, `localRes`, detrital harvest, fields) funnels through the *same*
  `amp[i]+=localRes[i]*genome.entropyK` conversion.
- The dominant selective term is **NFD** (`±NFD_STRENGTH=0.004`, ~5× the `entropyBaseline` drain),
  and it is **zero-sum** (rare gains exactly balance common losses) — a pure *rarity tax*.
- The 2–7 type collapses of prior swings are **limiting similarity**: coexistence on any *fixed*
  niche structure is capped at ≈ (spectrum width)/(niche width). Every prior lever redistributed a
  fixed niche count; none made the count itself grow. That is the real wall.

## What was built (`index.html`, `applyNicheEconomy()`; knobs default OFF)

Three composable levers, each its own knob so every control runs:

1. **Expanding cross-feed frontier** (`__NICHE_FRONTIER=1`). Resource lives on a spectrum of
   channels indexed by the heritable diet trait (`tend` dim 0). Harvest is trait-matched with a
   master-of-one ↔ jack-of-all **trade-off** (effort normalised to a fixed budget). Competition
   divides each channel among its consumers (frequency dependence by real resource competition, not
   a tax). A fraction of every harvest is re-deposited **downstream** (`b→b+OFFSET`) as fresh
   resource, so a thriving population builds the next niche.
   - **REAL income** (`__NICHE_REAL=1`, default when frontier on): harvested resource becomes
     genuine `amp`, so each channel has its **own carrying capacity** and coexistence count =
     number of supplied channels. Bounded by the existing metabolic brake, so it raises diversity,
     not headcount.
   - **Mean-centred control** (`__NICHE_REAL=0`): zero-sum like NFD — kept to *prove* a tax cannot
     beat limiting similarity.
2. **Biotic / coevolutionary niches** (`__NICHE_BIOTIC=1`). A **conserved** predation transfer
   carries `amp` up the diet ladder (prey in `b−1` lose exactly what predators in `b` gain), so
   every occupied channel creates a predation niche above it (Red Queen).
3. **Opcode-novelty** (`__OPCODE_NOVELTY=1`). Mean-centred bonus for running globally-rare opcodes,
   to break the "museum, lights off" coupling gap (~20 of 232 opcodes ever used).

Harness: `harness-oee.js` exposes all four as env knobs and reports `nicheOcc` (channels held by
life) plus a `niche_trend` verdict (`growing` flag).

## Results (SEED-fixed, single seed, headless `harness-oee.js`)

| condition | entropyRatio (late/early) | kinds_late | collapsing |
|---|---|---|---|
| baseline (no knobs) | 0.44 | 5.0 | yes |
| all levers, mean-centred (v1) | 0.34 | 6.5 | yes (worse) |
| **frontier REAL, tapered supply** | **0.69** | 7.8 | yes (borderline) |
| frontier REAL, flat supply | 0.63 | **10.8** | yes |

Reading: the **mean-centred** version was no better than baseline (and slightly worse) — exactly as
theory predicts a zero-sum tax must be. The **real-income** version is a clear, repeatable
improvement (collapse roughly halved; kinds retained roughly doubled). Lever 3 alone also produced a
genuine genotype-exploration signal (VM length began to ratchet; first authored atoms appeared).

## Why it still doesn't cleanly break the ceiling (next swing)

- Residual single best mountain: supply taper (and, when flat, the births-average-toward-centre
  pull plus the weak `globalTend` homogeniser on `tend` dims 0–1) still concentrate diet over time.
- Bounded trait space (`tend` clamped ±1.2) ⇒ ≤16 channels ⇒ still a *finite* niche count. Genuine
  open-endedness needs the niche space itself to grow — e.g. let `DIMS` grow and tie new dimensions
  to occupied frontier, or make cross-feeding push an *unbounded* (non-wrapping) frontier.
- Multi-seed confirmation not yet run (single-seed verdicts are noisy; the "immobility held 7"
  lesson demands a control before adoption).

## Reproduce

```bash
# baseline
SEED=7 TICKS=7000 SAMPLE=700 node harness-oee.js | sed -n '/"verdict"/,/"notes"/p'
# best lever (real partitioned frontier)
NICHE_FRONTIER=1 SEED=7 TICKS=7000 SAMPLE=700 node harness-oee.js | sed -n '/"verdict"/,/"notes"/p'
# control: a zero-sum tax cannot beat limiting similarity
NICHE_FRONTIER=1 NICHE_REAL=0 SEED=7 TICKS=7000 SAMPLE=700 node harness-oee.js | sed -n '/"verdict"/,/"notes"/p'
# all three
NICHE_FRONTIER=1 NICHE_BIOTIC=1 OPCODE_NOVELTY=1 SEED=7 TICKS=7000 SAMPLE=700 node harness-oee.js | sed -n '/"verdict"/,/"notes"/p'
```
