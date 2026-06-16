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
# swing #12: drifting niches
NICHE_FRONTIER=1 NICHE_DRIFT=1 SEED=7 TICKS=6000 SAMPLE=600 node harness-oee.js | sed -n '/"verdict"/,/"notes"/p'
```

---

# Swing #12 — drifting niches ("Convergent Hunger")

**Idea.** A static niche, even a real one, lets diet re-concentrate then stop: a summit. So make
the supply PEAKS *drift* over the channel ring (moving attractors), so the profitable diet is a
moving target and no lineage can finish climbing. Knob: `__NICHE_DRIFT=1`.

**Result (seed 7, 6000 ticks): no improvement; marginally worse.**

| config | entropyBits early→late | kinds_late | occ early→late |
|---|---|---|---|
| stationary real frontier | 3.21 → 2.03 | 10.8 | 8 → 5.25 |
| **drifting (swing #12)** | 2.51 → 1.69 | 8.8 | 8.67 → 5 |

**Why — the sharp lesson.** Drift stops the system *settling* but does not *diversify* it: the
population tracks the moving peak **together**. A drifting attractor is still ONE attractor; with 3
peaks you get ~3 moving clusters — exactly the limiting-similarity count, now in motion. Convergent
Hunger is *convergent*: everything chases the same shifting targets. Drift changes the **dynamics**
(non-stationary) but not the **count**, and the ceiling is a ceiling on count.

**Consolidated conclusion across #11–#12.** Only one thing moved the needle: making niches a
**real, partitioned food source** (collapse roughly halved, kinds roughly doubled). Everything that
touched *how fitness is shaped* rather than *how many separated, simultaneously-supplied niches
exist* — rarity tax, mean-centring, drift — left the count where limiting similarity puts it.

---

# Swings #13–#14 — attack the count (N-dim cells; local competition)

- **#13 N-dim niche cells** (`__NICHE_NDIM=1`): diet is a cell in a 4-dim × 4-bin space (256 niches,
  combinatorial), each a real partitioned resource; empty cells accrue a colonisation bonus.
- **#14 local competition** (`__NICHE_LOCAL=1`, with #13): crowding your own diet-cell costs amp, so
  each niche has a hard local carrying capacity (NFD done right — real per-niche competition).

**Results (seed 7, 6000 ticks), entropyRatio = late/early entropy (≥0.7 = not collapsing):**

| config | entropyRatio | kinds_late | nicheOcc early→late |
|---|---|---|---|
| baseline | 0.44 | 5 | 7 → 5 |
| 1-D real frontier (#11) | **0.63–0.69** | ~11 | 8 → 5 |
| drift (#12) | 0.67 | 8.8 | 9 → 5 |
| N-dim cells (#13) | 0.35 (collapses harder) | 8.3 | 23 → 6 |
| N-dim + local (#14) | 0.65 | 9 | 22 → 6 |

**The pattern is the finding.** #13 has 256 niches and *starts* with 22–31 occupied, yet collapses
*hardest* — combinatorial capacity is not the constraint. #14's local competition rescues #13 from
0.35 back to 0.65, but **every lever — real income, drift, combinatorial space, local competition —
lands at the same ~0.65 wall, and none holds occupancy flat.** The system sheds diversity to the
same level no matter how much niche capacity or competition structure is added.

**Revised diagnosis (where the next swing must aim).** The binding constraint is no longer in the
niche/competition layer — it is **upstream of it**: diversity is generated faster than it can be
*retained*. Two upstream suspects, both pre-existing and untouched by #11–#14:
1. **Slow diet exploration.** Offspring inherit the parent's `tend` (birth averages parents) and
   `tend` mutates only ±0.0005/tick, so lineages cannot *spread* across niches fast enough to offset
   selective + seasonal concentration. The niches exist; nothing colonises them in time.
2. **Active homogenisers.** Every tick `tend` is pulled toward the population mean (the `globalTend`
   attractor, ~2e-5/tick), plus motif re-adoption and HGT — a persistent inward pull collapsing the
   diet axis regardless of niche structure.

The honest next experiment is therefore **not another niche mechanism** but to ablate/instrument the
homogenisers and raise diet-axis exploration, and measure whether retention (occupancy slope) goes
non-negative. All of #11–#14 ship dormant (knobs default OFF); stock behaviour unchanged.

---

# Swing #15 — retention, not capacity (the `globalTend` sink, and the local fix)

Credit: the mechanistic framing here came from a parallel instance and was decisive.

**The wall, analytically (not empirically).** Every tick, `tend[i] += (globalTend[d] − tend[i]) ×
2e-5` (index.html ~L17142): global mean-reversion on the diet axis. Against ±5e-4/tick mutation, the
mutation-vs-reversion balance pins the trait distribution at
`var ≈ injection/removal ≈ (5e-4)² / (2·2e-5) ≈ 0.006 → std ≈ 0.08`. On a [−1.2,1.2] axis with 4-bin
cells, std 0.08 fits inside one bin. **No downstream niche capacity can hold diversity when the
upstream trait distribution is pinned that tight** — which is exactly why #13 starts at 22–31
occupied cells and relaxes to ~6. The retention diagnosis is now mechanistic, not just observed.

**Diagnostic (seed 7, 6000 ticks, on #13+#14; `__GLOBALTEND` scales the sink, 0 = ablate):**

| config | occ_late | kinds_late | entropy_late | clusters_late |
|---|---|---|---|---|
| globalTend ON (stock) | 6 | 9 | 1.86 | 4 |
| globalTend OFF (ablated) | **11.25** | 13.8 | 2.48 | 10.5 (incoherent) |
| **localized — `__NICHE_LOCALTEND=1`** | 8.5 | 11.8 | 2.2 | **4 (coherent)** |

Ablating `globalTend` in isolation nearly **doubles** retained occupancy (6 → 11.25) — the single
biggest mover in the whole sequence, confirming it is the dominant sink. But full ablation blows
cluster coherence (4 → 10.5), which would cost the live piece its visual structure. **Localising the
homogeniser** — pulling each organism toward its own NICHE-CELL centroid instead of the global mean
(`__NICHE_LOCALTEND=1`, also on L17142) — recovers most of the diversity gain (occ 6 → 8.5, kinds
9 → 11.8) **while keeping coherence (4 clusters).** Within-niche coherence survives; cross-niche
divergence stops being punished. This is the fourth independent time the answer has been
"the global version concentrates; localise it" (cf. #14 local competition).

**Status.** Still not open-ended — slope stays negative (other sinks remain: HGT, motif re-adoption,
seasonal culls), so retention is improved, not yet self-sustaining. Remaining protocol, with
attribution discipline (one sink at a time): HGT/motif off next, then a diet-mutation sweep
(`__TEND_MUT`). **Validation caveat:** occupancy-slope ≥ 0 is necessary, not sufficient — a higher
mutation rate can inflate variance into a *smear* of tourists (the bin-inflation confound), so the
retained occupancy must be confirmed HERITABLE/persistent per cell (lineages stay), not a random
scatter. The coherent `clusters_late=4` under the localized fix is an encouraging (not conclusive)
sign of persistence. New knobs (`__GLOBALTEND`, `__NICHE_LOCALTEND`, `__TEND_MUT`, `__NICHE_CELLDRIFT`)
all default to stock behaviour.

---

# Swing #16 — grow the BOARD (the dimensionality ratchet)

Credit: the reframe (retention fills a fixed board; only the number of AXES growing is open-ended)
came from the parallel instance and is the most important strategic turn in the sequence.

**The board is finite.** Diversity lives in 4-bin cells on `DIMS` axes → `4^DIMS` cells. Even perfect
retention (the sink work) saturates a fixed board and stops. Open-endedness needs a new *kind* of
difference (a new axis), not another *value* of an old one.

**The lever existed but was inert — confirmed in code.** `genome.tendDims` (evolvable 2..16, mutated
live at ~L10785) is the only such lever, but `DIMS = genome.tendDims` runs *only* in
`sanitizeGenome()`, called *only* at boot (L5833 load, L16849 `init`). So `DIMS` is frozen at 5 for
the whole run (hence `DIMS_delta=0` everywhere), and there is **no stride remap**: a naive change
would reinterpret every flat `tend` vector at shifted offsets (scramble) and the new axis would be
born at zero (no variation). `tend` is the **only** array strided by the live `DIMS` — everything
else uses fixed `REFLEX_DIMS`/`NM_DIMS`/`FIELD_SIG_DIMS` — so the fix is surgical.

**`setDims()` (swing #16):** snapshot → re-lay-out `tend` from old stride to new (no overlap hazard)
→ **spread-initialise** the new axis (`__DIMS_SPREAD`) so it carries real cross-particle variation
immediately. Driver knob `__DIMS_GROW=<interval>` forces a new axis periodically (tests the lever in
isolation); `traitDimEntropy()` (Σ per-axis 4-bin entropy over all live DIMS) measures whether new
axes actually carry variation.

**Result (seed 7, on #13+#14+localtend):**

| run | DIMS path | traitDimEnt | population |
|---|---|---|---|
| spread 0.5, every 800t | 5→10 | 6.1 → 9.2 (rises) | shocks: N 340→72 at DIMS 10 |
| spread 0.15, every 1200t | 5→7 | **6.1 → 10.1 (rises cleanly)** | stable (N 240–283) through DIMS 7 |
| (both, beyond DIMS ~8) | 8→10 | falls (10→4.6) | degrades (N → ~80) |

**The lever works** — no scramble, no remap crash — and with a gentle spread the board **grows**,
raising trait-space diversity from 6.1 to 10+ bits: the first time in the sequence multi-dimensional
diversity *increased* rather than saturating or collapsing.

**The soft ceiling at DIMS ~7–8 is the unifying insight.** Forced growth outruns COLONISATION: a new
axis lands on a population that cannot spread across it before the next axis opens, so trait density
thins and high-`DIMS` `tendSim` coherence is lost → dilution collapse. Therefore the ratchet must be
**saturation-GATED** (open a new axis only when the current board is well-filled), which means
**retention is the prerequisite for the ratchet, not an alternative to it.** The two halves of the
session unify: retention (#11–#15, esp. the localized homogeniser) FILLS the board; the ratchet (#16)
GROWS it; gated together — grow only as fast as you can fill — is the open-ended engine, and the
literal "expanding space, not moving point" resolution of Convergent Hunger.

**Still owed:** the per-cell lineage-identity instrument (persistence vs mutation smear) to make the
numbers trustworthy; a saturation-gated production trigger; and high-`DIMS` coherence handled the
same local>global way (`tendSim`/clustering relative to the niche, not the whole population). New
knobs (`__DIMS_GROW`, `__DIMS_CAP`, `__DIMS_SPREAD`) default to stock (no growth).

---

# Lineage instrument + freeze-and-watch — #16's headline RETRACTED

Credit: the parallel instance caught the confound. The arithmetic was a smoking gun — DIMS 5→7 with
spread-init 0.15 can inject up to log2(4)×2 = 4.0 bits, and the measured `traitDimEnt` gain was +4.0.
The metric counts variance whether seeded or earned; it cannot tell a seed from a harvest. So before
any saturation-gated trigger (which would gate on a possibly-phantom fill signal), we instrument.

**Instrument.** Heritable lineage tag `pLin` (child inherits parent's at birth, follows the particle
through `compact()`), and `axisStats(d)`: a trait axis's 4-bin entropy, total variance, and
**R = between-lineage variance / total variance**. R≈0 → each lineage's members are spread like the
whole population (unstructured noise / seeded smear). R→1 → distinct lineages hold distinct heritable
values (colonisation). Harness logs `newAxis` (= `axisStats(DIMS-1)`) and `ctrlAxis0` (positive
control: a lived-in, niche-relevant axis).

**Freeze-and-watch (seed 7, on #13+#14+localtend):** open ONE axis at tick 700 seeded *wide*
(`__DIMS_SPREAD=0.6` → fills all 4 bins, ~2 bits), freeze growth (`__DIMS_CAP=6`), watch ~7000 ticks.

| tick | newAxis Vtot | newAxis R | lineages(new) | ctrl0 R |
|---|---|---|---|---|
| 801  | 0.086 | 0.85 | 61 | 0.94 |
| 2401 | 0.152 | 0.90 | 42 | 0.77 |
| 4801 | 0.156 | 0.47 | 12 | 0.49 |
| 6401 | 0.084 | 0.38 | 15 | 0.41 |
| 8001 | 0.043 | 0.26 |  9 | 0.23 |

**Verdict: the new axis is a SEED, not a harvest.** Its variance decays (0.086 → 0.043), its
lineage-structure R decays (0.85 → 0.26), and at every step it is statistically indistinguishable
from the lived-in control axis 0 — it never colonises, it relaxes into the same wash-out. The #16
"board grew / diversity rose 6.1→10.1 bits" headline is **retracted**: `traitDimEntropy` measured the
injected spread-init, exactly the bin-inflation confound (immobility artifact / tourist-occupancy),
now at the dimensional level.

**Bigger finding the instrument exposed.** Lineage count **collapses 61 → 9–12 while N GROWS
205 → 457.** Diversity is increasingly within-lineage mutational smear, not many persistent lineages,
so both axes' R fall together. This means the retention metrics (cell occupancy, entropy) were
**masking lineage concentration** — the tourist confound — so every occupancy/entropy number earlier
in this file is now suspect until re-checked against lineage persistence. The instrument did not just
break #16; it put the whole session's headline numbers on notice.

**What this re-frames.** A new axis colonises only if it is (a) SELECTED — wired into fitness; dims
≥4 are NOT in the niche economy, so the new axis is neutral and washes out by construction — and
(b) held by PERSISTENT lineages, which the freeze-and-watch shows the current config does not provide
even on existing axes. So the prerequisites are stronger than "retention fills the board": fix
lineage-level retention (not just cell occupancy), THEN wire new dims into selection, THEN gate the
ratchet. `setDims` (clean remap + spread-init) remains the right architecture; the EVIDENCE for it
was confound-prone and is now corrected. Instrument knobs/fields default to stock; nothing shipped
relies on the retracted claim.

---

# Lineage birth/death decomposition — the missing SPECIATION term

The reframe (parallel instance): every swing raised the *carrying capacity* of a system that has an
extinction term and **no speciation term**. The substrate evolves around a shared genome
(`mutateGenome` is global; `pGenome[]` is a sparse override); a new `pLin` id is minted **only by a
parentless spawn** (reseed/immigration) — parented births inherit the parent's id — so
**divergence-speciation = 0 by construction.** Mutation is anagenesis (drift *within* a lineage); the
cell-occupancy we kept measuring was one shrinking set of lineages smearing across the bins. The
decisive measurement is therefore lineage BIRTHS vs DEATHS, not standing count.

**Decomposition (per 1000 ticks, seed 7, lineage births = first-ever appearances = immigration only):**

Stock (no knobs): standing 329→28 by t=1001 (302 deaths), then steady ~24–29 with births≈deaths
(~0–3/1000t); `cum` 329→341 over 10000t.
Retention (#13+#14+localtend): standing 329→52→45→40→25→17→**11**, with deaths persistently exceeding
births (6–19 vs 1–9 per 1000t); `cum` 329→367.

**Verdict — there is no speciation term.** The 329-strong founder cohort coalesces to ~28 within the
first 1000 ticks in BOTH configs. Thereafter **every lineage birth is immigration** (parentless
reseed) at ~0.001–0.004 lineages/tick; `cum` (ever seen) barely moves. Standing diversity is an
**immigration⇄extinction (island-biogeography) equilibrium**, not a speciating system.
Divergence-speciation is structurally zero — confirmed in code and in the numbers. OEE's defining
condition (speciation ≥ extinction) cannot be met when speciation is identically zero; immigration is
the only source and it is sparse and mostly low-novelty (`replenish` ghost/motif branches reseed near
the global mean / a motif; only the edge branch injects a fresh `randomTendency`).

**The sting — retention ended with FEWER lineages than stock (11 vs 24).** Despite higher
cell-occupancy/entropy, the localized-homogeniser config has deaths persistently exceeding births and
decays to 11 standing lineages — *below* stock. Exactly the predicted confound: relaxing
mean-reversion let one lineage's mutational smear spread across MORE cells (prettier occupancy) while
FEWER lineages persisted. Cell-occupancy measured the smear; lineage count is the truth.

**Conclusion for the session.** `setDims` + the retention fixes are correct *carrying-capacity*
architecture, but the term never in the equation is **cladogenesis**: a primitive that lets a
sub-population diverge into a new, independently-heritable lineage and keeps it reproductively
isolated (against the shared genome, HGT, entrainment that re-merge everything). Without it, no amount
of niches, dimensions, or retention can sustain many lineages — the system can only merge and die.
The next swing is a branching/isolation primitive; everything else is downstream of it. (Dim-wiring
into selection stays necessary-not-sufficient: a selectable new axis without branching just lets the
dominant lineage smear one dimension higher.) Instrument-only change; stock behaviour and knobs
unchanged.

---

# Swing #17 — CLADOGENESIS: building the speciation primitive (knob-gated; default STOCK)

Correction that sharpened the design: the genome is NOT global — it already FORKS per birth
(`cloneGenome` + `mutateChildGenome`; physics, death threshold, even mutation rate via op154 are
per-lineage heritable, with crossover at birth). Genomes already diverge; the system just **re-merges
them faster than divergence accumulates**. So #17 is not "fork the genome" — it is **isolate the
re-mergers so divergence can accumulate**, plus a **mint** (relabel a diverged sub-population as a new
lineage) and **founder protection**. The re-merger list, corrected: **{globalTend, tendencyBleed, HGT
(op179), entrainment, crossover}** — crossover is gene flow, the load-bearing one the first pass missed.

**What shipped (all behind `__SPECIATE`, default off → stock byte-identical, verified 0 errors):**
- **Isolation gates** (`SPEC_GATE`): crossover (birth, both paths) and HGT-donate (op179) restricted to
  same-`pLin`; tendencyBleed zeroed across lineages; entrain `_spGate` extended to suppress cross-lineage;
  the globalTend sink redirected from the global mean to each lineage's own centroid.
- **Mint / cladogenesis** (`SPEC_MINT`): each cadence, a same-lineage sub-population that (a) is ≥minsize,
  (b) sits in a niche-cell distinct from its lineage's modal cell, and (c) has a trait centroid ≥`SPEC_DIVT`
  from the lineage centroid → gets a fresh `pLin`; genealogy (`linParent`) and birthTick recorded.
- **Founder protection** (`SPEC_GRACE`): minted lineages get death-threshold relief while young or small,
  so founders don't die in the cradle (the deaths>births bottleneck from the retention work).
- **Divergent selection** is supplied by the REAL partitioned niche cells (`NICHE_FRONTIER=1 NICHE_NDIM=1`);
  the same-landscape control drops them.
- **Success metric (harness, confound-proof):** NET-PERSISTENT-DIVERGENT count — a minted lineage counts
  only if, recomputed independently, it persists (alive, ≥minsize, age past the grace window so it survived
  WITHOUT subsidy), stays diverged (centroid ≥divT from its **living** parent — orphans whose parent died
  are NOT auto-passed, that would be the #16 fiat-output confound), and holds a distinct cell. Gross mints
  are ignored on purpose.

**Three-way knockout control (seeds 7/11/23, 9–10k ticks). Robust result — max inter-lineage divergence:**
| config | what | maxdiv s7 | s11 | s23 | persistent-divergent (conservative) |
|---|---|---|---|---|---|
| FULL | mint + isolation + divergent selection | 1.07 | 1.43 | 0.89 | 1 / 0 / 3 |
| ISO-OFF | mint + divergent selection, **re-mergers NOT gated** | 0.61 | 0.64 | 0.34 | 0 / 0 / 0 |
| NO-DIVSEL | mint + isolation, **no niche cells** | 0.02 | 0.09 | 0.04 | 0 / 0 / 0 |

**Verdict — the two halves are each necessary, and the knockout proves it (not the label).**
- **Divergent selection is the ENGINE of divergence.** Remove the niche cells and max divergence collapses
  to ~0.05 on every seed — with no per-cell fitness gradient, lineages have no reason to leave the common
  trait region, so they never diverge regardless of isolation. (This is also why every PRIOR run in this
  session that forgot `NICHE_FRONTIER=1` was inert: the niche economy is gated by it, so "FULL" without it
  silently equals "no-divsel" — a real methodological trap, caught before it shipped.)
- **Isolation is the RATCHET.** With divergent selection present, removing the gates (ISO-OFF) roughly HALVES
  achievable divergence (1.0→0.5) and drops persistent consolidation to zero on every seed — gene flow
  (crossover the dominant channel) re-blends what selection separates before it can fix.
- **Only FULL produces persistent incipient species** — e.g. seed 7 lin417: 116 members, centroid 0.74 from
  a living parent, distinct cell, survived past grace; seed 23: three such lineages.

**Honest bound — at the threshold, not over it.** The persistent-divergent *count* is marginal and
seed-dependent (0–3), not yet a standing radiation robustly above the stock ~24 island-equilibrium. The
system now REACHES cladogenesis (divergence up to ~1.4 vs stock's structural ~0, and lineages that clear
the full persistence bar) but does not yet SUSTAIN many species: most minted lineages' divergence still
decays back as reproduction re-mixes them. The gates throttle gene flow but birth still pairs across
lineages; the missing strengthener is **reproductive isolation proper — assortative mating** (refuse
cross-lineage births outright, not just gate the gene transfer within a shared birth), so a diverged
sub-population cannot be reabsorbed at all. That is the next swing's lever. Constraint #3 (isolation +
divergent selection are two halves of one primitive) is now an empirical, knockout-confirmed fact rather
than a hypothesis. Stock behaviour and all existing knobs unchanged; #17 is opt-in.

---

# Swing #18 — ASSORTATIVE MATING: testing #17's stated lever (knob-gated; default off) → REFUTED

Swing #17 closed by naming the next lever explicitly: *"the missing strengthener is reproductive
isolation proper — assortative mating ... so a diverged sub-population cannot be reabsorbed at all."*
The hypothesis: post-zygotic gene-flow gates (#17) throttle re-mixing but birth still **pairs** across
lineages, so add **pre-zygotic mate choice** and persistent species should consolidate. This swing built
that lever and ran the knockout. **The hypothesis is wrong for this system: mate choice is net HARMFUL.**

**What shipped (all behind `__SPEC_ASSORT`, default off → stock unchanged, `loopErrors:0` verified):**
- **Soft trait-similarity mate choice** on all three two-parent reproduction paths (`executeVM`,
  `executeClusterVM`, `interferenceCreate`): a candidate pair spawns with `P = sigmoid(K·(sim − T))`,
  `sim = tendSim(i,j)`. Gating on **trait similarity, not lineage id**, makes it REINFORCEMENT (the barrier
  rises automatically as selection pushes traits apart) rather than id-tag speciation by fiat. `T` = the
  similarity midpoint, `K` = steepness (small = soft slope, K≈1000 ≈ hard step).
- **Open-endedness headline = genealogy DEPTH, not a tip count.** `specMaxDepth` = mint-events from a lineage
  back to a non-minted root; `specNested` = alive, viable, depth≥2 lineages (a daughter that itself
  speciated — the tree branching *again*). Plus guardrails: within-lineage variance (inbreeding watch),
  mate-starved extinctions (Allee trap), realized/refused spawn split, and the spawn-similarity histogram.

**First thing the histogram showed (the result before the result): reproduction is ALREADY assortative.**
In BASE, **99.87% of reproduction attempts pair particles at cosine-sim > 0.8** (seeds 7/11 mean-sim 0.998).
Spatial/trait proximity already makes mating near-homotypic; explicit mate choice is mostly **redundant**,
and where it bites it can only remove the thin cross-trait tail.

**Knockout (seeds 7/11/23, 10k ticks). `depth/nested/persist`, viable count, mate-starved extinctions:**
| config | s7 | s11 | s23 | persistent species (Σ) | within-lin var (s7) |
|---|---|---|---|---|---|
| BASE (assort off) | d4/n6/**p1** v8 | d3/n3/**p1** v7 | d2/n3/**p3** v8 | **5** | 0.052 |
| SOFT (T=0.75 K=10, nicks tail) | d3/n1/p0 v7 ·ms1 | d3/n1/p1 v**4** ·ms1 | d3/n3/p0 v6 ·ms3 | **1** | 0.062 |
| BULK (T=0.97 K=80, bites the bulk) | d3/n3/p1 v7 ·ms1 | d3/n3/p0 v8 | d**0**/n0/p0 v**1** ·3.18M refused | **1** | **0.038** |

**Verdict — assortative mating REFUTED as the consolidation lever. Three mechanisms, all instrument-caught:**
1. **Redundant.** Reproduction is already ~99.9% assortative by proximity (histogram), so soft choice changes
   little of the bulk and only touches the cross-trait tail.
2. **The cross-trait tail is GENERATIVE, not reabsorptive.** Suppressing it cuts persistent species **5 → 1**
   and nested cladogenesis (12 → 5/6) across the matrix. The tell is **seed 23**: it has the fattest
   cross-trait tail (mean-sim 0.904, not 0.998) *and* the most persistent species at BASE (p3) — exactly the
   seed #17's logic predicts assort should help most. Instead SOFT collapses it p3 → p0 with 3 mate-starved
   extinctions. The residual cross-lineage births were *seeding and feeding* lineages faster than they
   homogenised them.
3. **Allee trap.** Push the barrier into the reproductive bulk (BULK on the wide-tail seed 23) and mating
   nearly shuts down — 3.18M refused matings, 586 realized — collapsing the whole population to a single
   lineage (viable→1). The mechanism *does* work as designed (within-lineage variance compresses, 0.052→0.038
   on seed 7), it just buys tighter clusters at the cost of fewer of them.

**What this corrects about #17.** #17 framed reabsorption-at-the-mating-step as the binding constraint and
assortative mating as the fix. The knockout says the opposite: at the mating step the system is already
isolated *enough* (proximity does it), and the small remaining gene flow is **net constructive**. The real
ceiling on a sustained radiation is therefore NOT pre-zygotic isolation — it is downstream: **founder
survival and per-cell carrying capacity** (the deaths>births founder bottleneck from the retention work).
Strengthening isolation past where #17 already took it doesn't add species; it subtracts them. Honest
negative, in the graded tradition of #11–#16. Stock behaviour and all existing knobs unchanged; #18 is opt-in.

---

# Map update (post-#18): ISOLATION IS A MAXED-OUT LEVER — and the (A)/(B) measurement says DEMOGRAPHICS

## Banking #18 precisely: an interior optimum in isolation, proven from both sides
Put this swing next to #17's ISO-OFF knockout and the shape is unambiguous — pre-zygotic isolation is
**not a lever anymore, it is a tuned parameter we have now bracketed on both sides:**
- **Too little** (#17 ISO-OFF, gates removed) → collapse. Bulk gene flow re-merges what selection separates.
- **Too much** (#18, assortative mate choice added) → collapse. The generative tail starves; the Allee trap
  bites the bulk (viable→1).
- **The base system already sits near the peak**: ~99.9% of reproduction is assortative *by proximity alone*,
  no explicit choice needed. Stop pushing isolation in either direction.

The session-long instinct "gene flow is the enemy" was **half right**: the BULK re-merging is the enemy
(#17 confirmed), but the **cross-trait tail is generative** — rare hybridization is net-constructive,
founding and feeding lineages and driving the nested cladogenesis (suppressing it cut persistent species
5→1, cladogenesis 12→5/6). That is real biology (hybrid speciation, adaptive introgression). **Code change
banked:** `interferenceCreate` (compound formation = the hybridization channel) is now EXEMPT from mate
choice; assort applies only to the homotypic `executeVM`/`executeClusterVM` paths. Gating the hybridization
channel suppressed exactly the radiation-feeding tail, so it is left free on purpose.

## The real question is downstream — measure (A) founder demographics vs (B) niche saturation
Two mechanisms, opposite fixes: (A) incipient species die by small-population stochasticity regardless of
whether their niche has room (fix: founder protection); (B) they die because cells are full and the incumbent
wins by priority (fix: more niche space). Discriminator: does an incipient lineage's per-interval DECAY
correlate with its target cell's OCCUPANCY entering that interval? (probe: `SPEC_DECAY=1`, longitudinal.)

**Measurement (seeds 7/11/23, 10k ticks, assort OFF — base dynamics). 1300+ lineage-interval observations:**
| seed | occupied cells | maxOcc | medOcc | corr(occ,Δsize) | meanOcc decay/grow | meanOther decay/grow | decayRate by occ bin |
|---|---|---|---|---|---|---|---|
| 7  | **12 / 256** | 123 | 4  | −0.080 | 81.6 / 65.3  | 64.2 / 51.4  | 0.33 / 0.37 |
| 11 | **12 / 256** | 151 | 3  | −0.085 | 169 / 163    | 158 / 152    | — / 0.36 |
| 23 | **13 / 256** | 120 | 24 | −0.076 | 89.5 / **92.8** | 61.1 / **73.7** | 0.20 / 0.22 |

**Verdict — (A) founder demographics, with a decisive auxiliary fact that also PARKS the dimensionality story.**
1. **Niche space is 95% EMPTY on every seed** (12–13 of 256 cells). There is enormous unused niche room —
   so simple saturation (B, "nowhere to radiate into") is **false**. And empty cells are not unprofitable:
   the N-dim economy regens every cell and hands the first arrival a colonisation bonus. The room is real
   and it goes unused.
2. **Decay is occupancy-INDEPENDENT.** `corr(occ,Δsize) ≈ −0.08` on all three seeds — occupancy explains
   <1% of decay variance — and the decay-rate-by-occupancy bins are flat (0.33 vs 0.37; 0.20 vs 0.22). The
   crowding cost is a uniform background tax (every occupied cell runs 50–170 occupants, far over FLOOR=2),
   NOT the differential cause of who decays.
3. **No robust priority effect.** The decay-vs-grow gaps in occupancy and heterospecific-neighbour count are
   small and **flip sign across seeds** (seed 23 decays in *emptier*, fewer-neighbour cells). A real incumbent
   effect would be a strong, consistent negative on every seed; this is noise around zero.

By the pre-registered rule ("decay independent of occupancy, happening even with room → (A)"), this is
**demographics**. The lever is **founder protection** — stronger/longer grace, a minimum-viable-size floor,
Allee-aware demographic relief so incipient lineages (which #17 now produces, and which DO reach distinct,
roomy cells) survive the small-population window instead of decaying back. **The dimensionality-ratchet
fusion stays parked:** growing niche space cannot be the fix when 95% of the existing niche space is already
empty and uncolonised — the binding constraint is keeping founders alive, not making more room for them.

**Honest bound / what would flip this.** The one whiff of (B) is the weak, *consistent* −0.08 correlation —
crowding contributes a little, just not differentially enough to be the mechanism. And "95% empty cells" is
empty TRAIT space, colonised only by a lineage evolving its tendency into a new cell; the gap is that minted
lineages reach those cells (#17) but then die there demographically (this probe), not that the cells are full.
If a founder-protection swing keeps incipient lineages alive and the *occupied*-cell count then climbs toward
the 256 ceiling, only THEN does niche space (and the #16 ratchet) become the next binding constraint. Until
founder survival is fixed, it isn't.

## Swing #20 — colonization vs survival, run as a 2×2: BOTH REFUTED on the smear-proof metric

#19 said the binding term is per-capita growth of a rare lineage in an empty cell, not death rate or lack of
room. Two candidate fixes, deliberately separated so the metric (not a prior) picks the horn:
- **knob S `COLO_SURV`** (death term) — while a minted founder is in grace it cannot be reaped; pinned to
  life support at the relief line (stronger grace + min-viable-size floor).
- **knob C `COLO_PIONEER`** (growth term) — pioneer income (under-occupied cells pay first arrivals a bonus
  that scales with accrued stock, self-limiting once the cell fills) + Allee relief (sub-minsize minted
  lineages get a per-capita income uplift that fades at viable size). This is **#13's pioneer bonus
  resurrected on the #17 speciation substrate** — #13 failed for lack of distinct lineages to be the pioneers;
  #17 supplies them, so the bonus should now land on many pioneers instead of one universal colonizer.

**The metric guard (the point of the whole exercise).** Every prior call was confoundable by *one viable
lineage smearing into many empty cells* reading as colonization. So the headline is **`radiationCells` =
distinct HOME (modal) cells of viable lineages** — a smear keeps ONE home cell however far its tendrils reach,
so only NEW lineages establishing NEW home cells move it — reported against the confoundable `occCellsRaw` and
the smear magnitude `cellsPerViableLin`.

**2×2 (seeds 7/11/23, 10k ticks, means; `radiationCells` is the metric of record):**
| config | **radiationCells** | occCellsRaw | cellsPerViableLin | linViable | specAlive | specPersist |
|---|---|---|---|---|---|---|
| 00 base       | **4.3** | 12.3 | 3.7 | 7.7  | 20   | 1.7 |
| 10 surv (S)   | **4.0** | 10.3 | 2.1 | 11.3 | 21   | 1.0 |
| 01 pioneer (C)| **3.7** | 17.3 | 2.0 | 7.3  | 14   | 0.7 |
| 11 both (S+C) | **3.3** | 21.0 | 3.5 | 7.7  | 26   | 1.0 |

**Verdict — the growth-term hypothesis is NOT supported; the prediction is falsified.**
1. **`radiationCells` is FLAT at ~3–5 across all four cells** and across the whole run (no `radTraj` climbs;
   they oscillate 3–7). Neither survival, colonization, nor both moves distinct-home-cell radiation off
   baseline. The pre-registered success signal (C lifts distinct-cells) did not occur.
2. **Colonization raised `occCellsRaw` (12→17–21) — and the guard proves it is SMEAR, not radiation.**
   `cellsPerViableLin` climbs in lockstep (to **7.5** on both/seed 11, where occCellsRaw hit **33** but
   radiationCells stayed **4**): a handful of lineages spread tendrils across many cells while their home
   cells stay put. **Had we scored the #19 raw-occupied-cell metric we would have falsely declared
   colonization a win.** The smear-proof headline is the only reason we didn't — it earned its keep.
3. **Colonization re-triggered the #13 single-colonizer collapse on seed 11** (linViable 8→3, specAlive 24→1,
   vCellsOcc=2): a strong pioneer subsidy still feeds ONE universal winner even on the #17 substrate. So the
   premise that "#17 supplies the distinct pioneers #13 lacked" is **not borne out** — the bonus does not
   distribute across many lineages; it is captured. And this is overshoot, not under-powering: the same knob
   that collapses seed 11 cannot be too weak elsewhere, so strengthening C would worsen smear/capture, not
   produce radiation.
4. **Survival behaved exactly as predicted: protected relics.** Mild `linViable` bump (7.7→11.3) with flat
   `radiationCells` — persistence without radiation, the death-term pathology #19 warned of.

**The reframe this forces.** Even a growth incentive strong enough to overshoot into collapse does not produce
HOME-cell establishment in empty cells. Viable lineages pile into a few modal cells (`linPerOccCell` ~3–5) and
at most send transient tendrils outward. The barrier to radiation is therefore neither death rate (S) nor
per-capita reward in empty cells (C): it is that a lineage's **trait centroid / center of mass won't RELOCATE
to a new cell and stay there.** The homogenizer (the globalTend sink + gene flow pulling the bulk back to the
ancestral centroid) re-absorbs pioneers faster than they can found a new home. This points straight back at
the **retention / homogenizer thread (#15)**: the operative lever is trait-centroid MOBILITY under the
homogenizing sink, not the niche economy and not founder survival. The next swing should test detaching a
sub-population's centroid (e.g. localTend strength vs divergent pull), with `radiationCells` still the gate.

**Honest bound.** 3 seeds, 10k ticks; `radiationCells` differences sit within the 3–6 seed-to-seed noise, so
the strong claim is the *null* (no lever lifts it), not a ranking among them. What would flip it: a config
where `radiationCells` climbs monotonically over a longer run while `cellsPerViableLin` stays flat — that
would be real radiation, and none of these four produced it. Both knobs ship dormant (default off).

## Swing #21 — spatially-local homogeniser (allopatry): REFUTED, and it relocates the wall to spatial structure

#20 refuted the *strength* axis of centroid mobility (pioneer income = divergent pull turned up → capture +
smear, not radiation). The one version it had NOT ruled out: localise the trait sink in SPACE. The #15→#17
sink is per-lineage but spatially GLOBAL (`linCentroid` = mean over ALL the lineage's members regardless of
position), so a physically separated sub-cohort is still pulled across all space to the parent mean — one
centroid, hence the smear. **`SPATIAL_TEND=1`** pulls each particle toward the mean tend of NEARBY
same-lineage neighbours only (existing spatial grid); a loner pioneer gets no pull (uncaged), a clustered
cohort still coheres locally — the jailer/foundation split a strength knob structurally can't do. Control
**`ALLO_SHUF=1`**: identical machinery, neighbours drawn NON-spatially (random lineage-mates), count-matched
→ strength-matched; isolates allopatry from a mere strength cut. New direct signal **`bifurcLin`**: a lineage
2-means-split in POSITION space into two sub-clusters both ≥minsize whose TRAIT centroids are ≥divT apart —
exactly the allopatric precursor #17's mint needs, measured directly rather than via downstream cell count.

**Experiment (seeds 7/11/23, 10k ticks, means). `radiationCells` = unchanged smear-proof gate; `bifurc` = mechanism:**
| config | **radCells** | **bifurc** | cellsPerLin | linViable | persist |
|---|---|---|---|---|---|
| 00 base                | 4.3 | 0.33 | 3.73 | 7.7 | 1.7 |
| 21 spatial (SPATIAL_TEND)   | **3.7** | **0.0** | 2.03 | 9.0 | 0.7 |
| 21 shuf (control)      | 4.7 | 1.0  | 2.30 | 9.0 | 1.3 |

**Verdict — REFUTED, and it fires the pre-registered escape clause: the wall is NOT the homogeniser.**
1. **`radiationCells` FLAT (~3.7–4.7); spatial ≤ baseline.** No radiation, same as #20. The gate did not move.
2. **Spatial-local produced ZERO bifurcations on all three seeds** — *fewer* than baseline (0.33) or the
   non-spatial control (1.0). The mechanism the swing exists to manufacture did not fire even once.
3. **The control discriminates the WRONG way for the hypothesis.** Allopatry predicts spatial ≫ shuf; observed
   is spatial ≤ shuf. The non-spatial draw produced as many/more transient splits, so spatial-locality
   contributes no allopatric signal — it is not even acting as a beneficial strength cut (radiation flat).
4. **The few splits that occur (0–2) appear in ALL configs incl. baseline,** with large spatial gaps
   (`bifSep` 70–127) but NO persistence (`bifTraj` oscillates 0–2, never climbs). Transient positional flukes,
   not building structure.
5. Side effect: spatial-local pull made lineages MORE compact (`cellsPerLin` 3.73→2.03) — local cohesion
   preserved as designed — but compactness ≠ bifurcation. Tighter single blobs, not two centroids.

**Why it can't work here, and where the constraint actually is.** The homogeniser pulls TRAITS, not
positions; allopatry needs persistent spatial SEPARATION, and the substrate has none. Particles re-mix
positionally every tick (movement, gravity, clustering, root forces), so "nearby same-lineage neighbours" is a
constantly-reshuffling sample of the whole lineage — on average ≈ the lineage-global centroid, just noisier.
A separated sub-cohort never STAYS separated long enough to grow a divergent local centroid. This is exactly
the escape clause pre-registered at the end of #20: radiationCells flat under spatial-local pull + bifurcation
tracking ⇒ the binding constraint is **the absence of persistent spatial territoriality**, not trait
structure. **The next thread is SPATIAL STRUCTURE itself** — dispersal limitation / viscosity / geographic
barriers / spatial niches that keep sub-populations apart — NOT another trait-axis lever. Until a cohort can
persist in a *place*, no trait mechanism (homogeniser-local or otherwise) can manufacture allopatric
divergence. Trait structure has now been worked from strength (#20-C), survival (#20-S), and spatial-locality
(#21) and none lifts the gate; the unexamined primitive is territoriality.

**Honest bound.** 3 seeds, 10k ticks; bifurcation counts are tiny (0–2) so the claim rests on the null + the
spatial≤shuf direction, not magnitudes. What would flip it: bifurcLin climbing monotonically and persisting
under spatial-local pull — none did. One real caveat: the spatial pull is weak (0.00002/tick, matched to the
others) and acts only on traits; a STRONG trait-lock combined with even mild dispersal limitation might yet
produce allopatry — but that combination *is* the spatial-structure thread, which is the point. Knob ships
dormant (default off).
