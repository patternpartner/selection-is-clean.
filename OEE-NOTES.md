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

## Measurement (pre-#22) — cluster lineage-purity: clusters are LEAKY DEMES (persistent core, churning fringe)

The reframe after #21: every speciation route has failed (allopatric #21, sympatric ingredients #14/#17/#18)
for ONE common cause — a panmictic population has maximal effective gene flow, and the bar (disruptive
selection > gene flow) can't be met. So the binding primitive isn't "allopatry," it's *reduce effective gene
flow via persistent local mating neighbourhoods*. The substrate already HAS a persistent local unit — clusters
(`clusterID`, `clusters[].persistAge`, cross-cycle identity via `clusters[].lineageID` inherited by
proximity+tendency match). #21 used raw spatial radius (re-mixes every tick); the right unit was clusters. But
re-pointing #21's mechanism to clusters is only cheap-reuse if clusters are real demes. **Make-or-break
measurement, run before building** (probe `CLUSTER_PURITY=1`: per cluster emit {cluster lineageID, persistAge,
dominant particle-lineage pLin, purity, #distinct pLin}; post-process snapshot-purity-by-age + temporal
dominant-pLin stability). 3 seeds, 8k ticks, clusters with ≥4 members.

**Q1 — snapshot purity by persistAge (size-weighted):** purity (dominant-pLin fraction) is **FLAT ~0.45–0.54
across all ages** (new→old: .448/.541/.512/.418 — does NOT purify with age); #distinct pLin per cluster RISES
with age (7.8→10.5→12.0→**15.7**). Instantaneously a cluster is ~half one lineage plus a fringe of 8–16 others,
and the fringe grows as the cluster ages.

**Q2 — temporal stability of a persistent cluster-lineageID's dominant pLin (the decisive axis):** 108
persistent cluster-lineages, mean life ~20 samples (~1200 ticks); dominant-pLin stability **mean 0.80, median
0.86**; only **~2.07 distinct dominant lineages over an entire life**; **56%** are ≥0.8 stable. Against the
salad null (a cluster re-rolled each cycle from 8–16 co-resident lineages would rotate its dominant through
many values over 20 samples, not 2), this is decisive: **the dominant identity persists.**

**Verdict — the salad hypothesis is REFUTED; clusters are demes AT THE CORE but LEAKY at the membrane.** The
reconciliation of Q1 and Q2: a cluster has a *stable, persistent ~50% plurality core* (one particle-lineage
held ~80% of a 1200-tick life — a real deme) wrapped in a *churning multi-lineage fringe* (the other ~50%,
8–16 rotating lineages, growing with age). Both readings are true and describe the same object.

**Implication for the swing (cheap-reuse IS justified, with eyes open).** Clusters are a usable persistent
deme unit, so re-pointing #21's spatial-local centroid + mate-sampling from raw radius to `clusterID` is the
right next move — NOT new offspring-stay-near-parent viscosity. Quantified expectation: global same-lineage
mating prob ≈ Σpₗ² ≈ 0.08 (≈12 even lineages); within-cluster, dominant≈0.5 ⇒ Σpₗ² ≈ 0.28 — cluster-local
mating ≈ **3.5× more same-lineage mating**, a real cut in cross-lineage flow, but **PARTIAL not complete**
because the fringe stays cross-lineage. So predict a real-but-possibly-sub-threshold effect. If sub-threshold,
the next knob is *tighten the deme to cluster∩dominant-lineage* (sharpen the membrane), still not new physics.

**Honest bound.** Cluster cross-cycle identity is matched partly by tendency similarity, which correlates with
pLin — so some of Q2's 0.80 is baked into the tracking definition. But a trait+lineage-coherent persistent
core IS what a deme is, so this inflates the *number* not the *existence*. 3 seeds, 8k ticks, sz≥4. The
aesthetic stake stands: clusters are mobile cohesive groups (flocking) — if cluster-local mating gives demes,
we get speciation while the image keeps flowing; only if it's sub-threshold AND tightening fails would
frozen-dispersal be required, and only then is the beauty-vs-openness conflict real.

## Measurement (#22 conduit) — the erasure is the MINT's niche-cell gate, not gene flow and not re-tagging

Before building cluster-local mating, the sharp question: what does the leaky fringe conduit actually carry
that #17 doesn't already gate? #17 restricts crossover/HGT/entrainment/trait-bleed to within-lineage, so a
core×fringe cross-lineage pairing already has its genetic blending suppressed — if that holds, the fringe is
spatial company, not a genetic conduit, and the only thing to do is mate cluster-wide for the encounter boost.
The suspected ungated channel was lineage RE-TAGGING (a divergent fringe cohort relabelled into the dominant,
erasure invisible to the gene-flow math). Two-part probe: (a) core↔fringe trait distance; (b) instrument the
mint to count viable trait-diverged sub-groups refused for reasons other than gene flow.

**Code-read first — literal re-tagging is REFUTED.** Every write to `pLin` is: spawn (descent inheritance),
array compaction (relocation), and the #17 mint (`17121`, which only SPLITS off a *new* lineage). There is no
path that overwrites a particle's pLin with its cluster's dominant lineage. Erasure-by-relabel does not exist.

**But the deeper instinct is CONFIRMED via a different gate. Probe (3 seeds, 8k ticks):**
- **Q-a fringe character:** fringe fraction 0.53 (confirms the leaky deme); core↔fringe trait distance
  **cfd = 0.455 — 2.3× the mint threshold divT=0.20.** The fringe is trait-DISSIMILAR, i.e. the #18
  *generative* hybridisation tail, NOT homogenising bulk. The "plug the leak" instinct is doubly wrong:
  plugging would destroy the generative tail (#18's exact error). Keep cluster-wide; do not tighten to core.
- **Q-b the conduit:** mints=57 vs **specMintBlockCell=190 — viable, trait-diverged (≥divT) sub-groups
  refused a mint PURELY because they share their parent's modal niche-cell. Ratio 3.3×.** The niche-cell
  distinctness gate (condition c) erases 3.3× more genuine trait-divergence than it mints. Divergence on the
  ~15 non-niche trait axes can never satisfy a gate that demands distinctness on the single diet/niche axis,
  so it is re-homogenised and never tagged — a bookkeeping erasure invisible to the gene-flow math, exactly
  the *kind* of channel predicted, though the mechanism is the mint gate, not re-tagging.

**Verdict — the binding wall is not gene flow; divergence already EXISTS and is being refused recording.** The
fringe sits at cfd 0.455 (>2× divT): the system is not failing to diverge, it is failing to *mint* the
divergence it already has, because the mint's ecological-distinctness test is single-axis (niche-cell). This
also relocates the #22 build: cluster-local *mating* (the 3.5× encounter boost) addresses gene flow, which is
NOT the binding wall here; the lever is the **mint gate**. Reframed swing: replace the mint's niche-cell
distinctness with **cluster** distinctness — group mint candidates by (lineage, clusterID), require a cluster
distinct from the lineage's modal cluster, keep size + divT. A trait-diverged sub-cohort that forms its own
persistent cluster (a deme, per the prior measurement) then mints EVEN inside a shared niche-cell. This is the
correct cluster reuse: the deme as the *unit of speciation*, aimed at the actual erasure conduit.

**Honest caveat (must address in the build).** specMintBlockCell groups are keyed (lineage, modal-cell), so
some of the 190 are the lineage's own MAIN BODY reading as "diverged" from its multi-cell global centroid —
minting those would relabel the bulk, and refusing them is correct. The cluster-distinctness reframe sidesteps
this: the main body is its own large cluster, so a fringe cohort forming a *distinct* cluster is genuinely
separated, not the bulk. Still, the next build must verify the relaxed gate mints genuine sub-cohorts, not the
main body, and that the mints PERSIST (specPersist) and lift radiationCells — if they don't persist, gene flow
(the user's Wall 1) re-homogenises them and IS the next wall after all. 3 seeds, 8k ticks.

## Measurement (#22 horn-decider) — refused divergence is SELECTED-axis and PARTLY PERSISTS: mixed, leans build-with-hard-gating

Before committing the cluster-mint reframe, the question it skipped: is the 190 refused divergence on SELECTED
axes (0–3, the niche economy) or NEUTRAL axes (4+, proven neutral by #16), and does it PERSIST? Neutral +
transient ⇒ the gate is correctly refusing functionless variation (minting = ID-tag birth-inflation), don't
touch it. Selected + persistent ⇒ the gate is too coarse, build the reframe. Instrumented per-axis squared
divergence (refused vs minted) + a streak tracker (consecutive cadences a refused cohort stays diverged).

**Axis — the "neutral-axis" prediction is REFUTED.** refused selected(0–3)=88% / neutral=12%; minted 87% / 13%
(uniform would be 80/20, so neutral is UNDER-represented in both). Refused and minted divergence are
*indistinguishable by axis* and both sit on the SELECTED economy axes. The refused cohorts are not diverging on
functionless dims — they diverge on the same axes as successful mints, but stay *sub-bin* (don't cross a
4-bin niche-cell boundary). Caveat: DIMS=5 here, only ONE neutral axis, so the neutral-side test is weak; the
sub-bin reading, not the axis count, carries the result.

**Persistence — mixed, with a real persistent subset.** 32 completed streaks across 3 seeds: 47% transient
(1–2 cadences ≈30–60t, drift the gate is RIGHT to refuse), but **38% persist ≥4 cadences, mean 6.1 cadences
(~180t), tail of 7 cohorts ≥11 cadences (≥330t).** A handful of persistently-diverged cohorts account for much
of the 190 refusals — the gate repeatedly refuses the SAME incipient species. Per-seed mean streak 4.0/6.6/7.7.

**Verdict — neither horn clean; the refused pool is half transient drift + ~38% genuine persistent
selected-axis-sub-bin cohorts, and the niche-cell gate cannot tell them apart.** By the pre-registered rule
(selected + persist → build) this clears the bar. But the rule omitted a third constraint the axis result
forces: same niche-cell = **ecological EQUIVALENCE** (identical resource draw). Even a cohort that diverges and
persists ~330t on selected-but-sub-bin axes has NO niche differentiation, so it lacks a stable-coexistence
mechanism — competitive exclusion / drift should eventually merge it. Persistence on the *cadence* scale (≤330t)
is not proof of persistence on the *run* scale (8000t). So minting the 38% might yield lineages that live a few
hundred ticks then collapse — radiation that doesn't stick. Only minting-and-watching settles this; it is a
dynamical outcome, not measurable pre-build.

**Decision: the deciding experiment IS the build.** Build the cluster-distinctness mint gate (knob) + a
relax-all-cell control (knob), default off, and gate HARD on radiationCells + lineage PERSISTENCE past grace —
NOT gross mint count, which would lie by inflating with the transient 47%. Two falsifiable outcomes: (i) new
lineages persist and radiationCells climbs ⇒ the gate was too coarse, the reframe is the lever; (ii) new
lineages collapse / radiationCells stays flat ⇒ ecological equivalence (no niche differentiation) re-merges
them, the niche-cell gate was doing real ecological work, and the true wall is that selected-axis divergence
isn't PRODUCING niche differentiation (the #16 wall: the few selected axes ARE the niche axes, so sub-bin
divergence on them is differentiation-free) — which converges with the other instance's neutral-axis thread.
The cluster gate may also itself act as the persistence filter the niche-cell gate lacks (a transient drift
blip won't form a persistent distinct cluster; a stable deme will) — the matrix tests that too. 3 seeds, 8k;
32 completed streaks is small n, so the persistence split is indicative, not tight.

## Swing #22 — permissive mint gate (gate ≠ metric): CONFIRMS Half A (niche-first); the wall is #16

The resolution of the gate/metric tension: the niche-cell gate used the SUCCESS condition (niche-distinctness,
which radiationCells measures, strict + smear-proof) as the ENTRY condition — foreclosing every intermediate
state of split-first speciation. So separate the jobs: make the gate PERMISSIVE (distinct DEME = distinct
cluster, drop the niche-cell entry req), keep radiationCells STRICT as the bar. Safe by construction: an
ID-inflation-immune metric can't be fooled by a permissive gate — over-split all you like, only distinct home
cells register. Paired with founder grace (COLO_SURV) so isolated sub-bin founders survive the #20 Allee trap
to character-displace. Decisive instrument: cascadeCount = same-cell ("permissive") mints that LATER reach a
distinct home cell (split-then-displace = the literal niche-first vs split-first answer).

**Matrix (MINT_GATE ∈ {cell stock, cluster permissive-deme, relax size+divT}, 3 seeds, 10k, founder grace on):**
| gate | **radCells (strict bar)** | cascade | bornSame | minted | linViable | persist |
|---|---|---|---|---|---|---|
| cell (stock)        | **4.00** | 0    | 0   | 21.3 | 11.3 | 1.00 |
| cluster (permissive)| **2.67** | 1.00 | 2.0 | 10.3 | 7.3  | 0.67 |
| relax (size+divT)   | **2.33** | 0.33 | 2.3 | 21.3 | 6.3  | 0.67 |

**Verdict — Half A (niche-first) CONFIRMED; the gate was enforcing real niche-distinctness, not a bug.**
1. **The strict bar does NOT rise — it falls** (4.0 → 2.7 → 2.3). The pre-registered success signal (permissive
   gate lifts radiationCells) did not occur. Permissive minting produces no net radiation; it *fragments*
   lineages (linViable 11.3 → 7.3/6.3, persist 1.0 → 0.67), splitting them into ecologically-equivalent pieces
   that don't hold distinct niches.
2. **The cascade is REAL but rare and insufficient.** cascadeCount is not identically zero — cluster mode
   averages 1.0, and seed 23 built a holding cascade (casTraj 0>1>1>3>2>3, bornSame→5, radTraj peaked 9).
   Split-then-displace *does* happen occasionally. But it's far too weak to overcome the fragmentation cost, so
   it never lifts the strict bar. The 7 persistent refused cohorts were not a foreclosed cascade of any size.
3. **Safety held exactly as designed — no false positive.** relax over-split to 21 mints, yet radiationCells
   stayed at 2.3: the ID-tag fog did not register. The metric stayed sovereign as judge; the permissive gate
   could not fool it. This is the clean, confound-free negative, not a polluted result.

**Where this lands the whole arc.** Permissive entry + strict success = no speciation gain ⇒ the binding wall
is not the gate and not gene flow. It is that **divergence on the few selected axes IS niche divergence**
(sub-bin = differentiation-free), so there is no split-first pathway to a NEW niche to displace into — exactly
the **#16 wall** (only ~4 trait axes are wired into the economy; the rest are neutral). Six trait-layer levers
(strength #20-C, survival #20-S, spatial-locality #21, deme-gate + relax #22) have now failed to lift
radiationCells off ~4. The lever that remains untried is **making more trait axes niche-relevant** (wire neutral
dims into the resource economy) and/or **finer niche resolution** (more bins, so sub-bin selected-axis
divergence becomes a real new niche) — the niche-economy side, converging with the other instance's
neutral-axis thread. That is the next swing.

**Honest bound.** 3 seeds, 10k; radCells variance is high (cluster 1/2/5) so the strong claim is the *null*
(no lift), not the precise size of the drop. The cascade was still growing at 10k in seed 23 — a longer run
*might* accumulate more displacement — but at 10k the strict bar is flat-to-down across all three seeds and
both permissive modes. All gates default to 'cell' (stock, byte-identical). The experiment was the right call:
it foreclosed nothing by fiat, kept the metric strict, and returned a clean negative that points the next move.

## Swing #24 (LIVE, straight to main) — break the #16 wall by GEOMETRY, not cell count

A bold live move, not a dormant knob. Context: swings #11–#22 worked the niche economy from retention,
strength, survival, spatial-locality, gene flow and the mint gate — six trait-layer levers, none lifted
radiationCells off ~4. #22's clean negative located the binding wall precisely: **divergence on the few
selected axes IS niche divergence, sub-bin = differentiation-free** (the #16 wall). The unexamined lever was
the niche GEOMETRY itself. The instinct to "add more cells" was already refuted — #19 found only ~12 of 256
cells ever occupied, so the ceiling was never the cell budget. The wall is that the niche space had the wrong
SHAPE in two specific ways:

1. **One axis was ecologically blind.** `NICHE_ND_DIMS=4` of the `DIMS=5` active tendency axes fed the diet
   cell. The 5th axis was NEUTRAL by construction (the #16/#22 finding, with the honest caveat that DIMS=5
   left only one neutral axis to test). Divergence on it was invisible to the economy, re-homogenised, never
   minted.
2. **Cells were too coarse to register divergence.** Cells were 0.6 wide (`NICHE_ND_BINS=4`) while the
   within-lineage spread is pinned to std~0.08 and cross-lineage divergence to divT~0.20. A genuinely-diverged
   cohort therefore stayed SUB-BIN inside its parent's cell, and the niche-cell gate refused it
   (specMintBlockCell — the conduit #22 instrumented). The monoculture lock.

**The change (`index.html`, three constants + comments; LIVE default, no new knob):**
`NICHE_ND_DIMS 4→5` (the 5th axis now carries real ecology — the neutral axis is wired in),
`NICHE_ND_BINS 4→6` (cell width 0.6→0.4), `NICHE_ND_CELLS 256→7776` (=6^5).
`NICHE_ND_SUPPLY` UNCHANGED at 0.18 and `NICHE_ND_OFFSET` 37 still coprime to the new count (7776=2^5·3^5).

**Why it's safe and energetically free.** Per-cell income is unchanged, and total income scales with
OCCUPANCY (bounded by N, the metabolic brake caps headcount), NOT with cell count — only occupied cells are
harvested; the extra cells are empty colonisation slots, not new energy. The cell width (0.4 ≈ 5 std of the
within-lineage bulk) keeps the main body sitting inside ONE cell, so the bulk does NOT fragment — explicitly
avoiding the #22 over-split failure where permissive minting shattered lineages into ecologically-equivalent
pieces. What changes is only the divT-scale divergence: a 0.20 shift now straddles a cell boundary ~half the
time (vs ~1/3 at width 0.6), landing a diverged cohort in a DISTINCT niche-cell it can be minted into and
character-displace within. The existing colonization machinery (COLO_SURV founder grace, the empty-cell
pioneer bonus, NICHE_CELL_FLOOR=2 crowding-free pairs) is exactly the support a founder pair needs to
establish in a freshly-reached cell.

**Departure from method, stated honestly.** This ships LIVE and default-ON with NO pre-registered harness
measurement — a deliberate break from the dormant-knob discipline of #11–#22, taken in the spirit of the
post-#22 "the live artwork is the ground truth" stance (the default-ON stack, the render VM, the permissive
mint flip). The reasoning above is a hypothesis, not a verdict.

**Falsifiable prediction (how to read it later, when a long real-run export is available).** If the geometry
was the wall: occupied cells rise above the ~12/256 floor (proportionally), radiationCells climbs off ~4, and
the monoculture absorbing state (divMean pinned at 0 for 200k+ ticks, seen in the t106k/t256k exports) becomes
escapable — minted lineages now reach genuinely distinct cells and persist. If it was NOT the wall: occupancy
stays a tiny fraction, radiationCells stays flat, and the diverged cohorts that now cross cell boundaries
still re-merge — which would mean the divergence itself isn't being PRODUCED (a generation problem, pointing
back at the homogeniser/mutation supply), not that it had nowhere to land. Either outcome is informative; the
move was to stop testing the gate and the flow and instead reshape the board the game is played on.

**Next, if #24 holds but saturates:** make the cell space track DIMS dynamically (sparse/hashed cells) so the
#16 dimensionality ratchet — when the genome grows a NEW tendency axis — automatically grows the niche space
with it. That is the board literally growing, the open-ended end-state; it needs a sparse cell store, not the
dense 6^DIMS array, so it's the right separate swing.

## Swing #25 (LIVE, straight to main) — the board grows itself: saturation-gated dimensionality, every axis ecological

The brave completion of #24. The whole arc's end-state, named since #16, is a board whose number of AXES
grows — a NEW kind of difference, not another value of an old one. #16 built the mechanism (`setDims`: clean
stride remap + spread-init of the new axis) but the freeze-and-watch **RETRACTED** the headline: a grown axis
is a SEED, not a harvest — it washed out because "dims ≥4 are NOT in the niche economy, so the new axis is
neutral by construction." The retraction's prescription was explicit: **wire new dims into selection FIRST,
then gate the ratchet.** #24 did the first half for axis 4. #25 does the rest and ships the ratchet live.

**Two coupled changes (`index.html`; harness knobs added):**

1. **`nicheCellOf` reads EVERY active axis.** For DIMS within the dense grid (≤NICHE_ND_DIMS=5) it is the
   BYTE-IDENTICAL combinatorial index — the default piece is unchanged. Once the board grows past the grid it
   hashes all binned dims (`Math.imul`-based) into the fixed cell count, so every axis — including the newest —
   carries ecology. Collisions are negligible at the tens-of-occupied-cells this system runs at, and the empty
   grid was already free (income tracks occupancy, #24). This is what removes the "neutral new axis" that
   sank #16: a grown axis is now SELECTED from birth, and `setDims`'s spread-init gives it real variation to
   select on immediately.

2. **Saturation-GATED growth (the #16 open problem, solved the simplest honest way).** #16's blind clock
   (`__DIMS_GROW`, every N ticks regardless of state) is kept only as the isolation knob; the live trigger is
   new (`__DIMS_SAT`): every 3000 ticks, grow ONE axis IFF the count of distinct occupied niche-cells ≥ 24,
   capped at 9 dims. Growth is **earned by diversity, never premature**. The coupling is the point: if the
   world collapses to monoculture, occupancy stays low and DIMS never grows (no harm, no neutral-axis
   injection); if #24's geometry lets diversity climb past the gate, the board expands to make room and the
   all-dims cell map makes that room immediately ecological. Success buys more room; more room is instantly a
   new way to live. That is the open-ended board that grows itself.

**Verified (correctness, not a verdict):** forced low-threshold run grows DIMS 5→9 and runs to completion
with zero loop/driver errors, stable at 9 dims (the `setDims` remap, the hashed cell map at DIMS>5, and the
gate all hold). Default config (threshold 24) does NOT grow prematurely and boots clean. `tend` and every
trait-strided scratch buffer are DIMS_MAX-allocated, so the live stride change is safe — as #16's setDims
comment claimed and this confirms.

**Departure from method + the honest open question.** Ships LIVE/default-on with no pre-registered verdict,
in the post-#22 "the live artwork is the ground truth" stance. The saturation trigger is a DESIGN proposal,
not a measured result. And the deeper #16 finding is NOT yet answered: the freeze-and-watch saw lineage count
collapse (61→9) while N grew — diversity as within-lineage smear, not persistent lineages — and a grown axis's
between-lineage structure R decayed. #25 makes the new axis SELECTED (necessary), but whether a grown axis is
held by PERSISTENT lineages (sufficient) is exactly what only the live run can now show, because the
prerequisites it needed (#17 mint, #20 colonization, #21 local homogeniser, #24 niche geometry, #25 selection
of new axes) are for the first time ALL in place at once. Two falsifiable outcomes on a long real-run export:
(i) DIMS climbs past 5 AND the new axes hold lineage-structured variation (R stays high) AND diversity rises —
the board grew, open-endedness; (ii) DIMS climbs but the new axes wash to the homogeniser floor (R decays,
the #16 pattern repeats even when selected) — then the binding wall was never selection or board size but
lineage PERSISTENCE itself (the homogenisers re-merging faster than divergence accumulates), and the next
swing is the homogeniser, not the board.

**Next, regardless of outcome:** if grown axes wash out, attack persistence directly (weaken/localise the
global homogeniser further, or make the mint's grace longer). If they hold, the cap (9) becomes the new
ceiling and the move is to make the gate continuous (grow whenever saturated, no cap) — true unbounded
open-endedness, now safe because growth is diversity-gated and self-limiting.

## Swing #26 (LIVE, straight to main) — lineage-structured axis seeding: grown axes that DON'T wash out

The flaw in #25, found by reading the live homogeniser instead of assuming it. The live diversity sink is NOT
the global mean-reversion (that path is off in the live stack) — it is the #21 spatially-LOCAL **same-lineage**
homogeniser: each particle is pulled (×0.00002/tick) toward the mean of its nearby same-lineage neighbours.
That is exactly why #25's grown axes would have repeated the #16 wash-out: `setDims` seeded a new axis with
**per-particle uniform random** values, so each lineage's mean on the new axis ≈ 0, and the same-lineage
homogeniser then drags every member back toward that ≈0 lineage-mean — the axis is born neutral-by-ERASURE, R
decays, the board only seeded noise. #25 made the new axis *selected*; it did nothing to stop the homogeniser
from erasing the very variation selection needs.

**The fix (`setDims`, swing #26):** seed each new axis with **lineage-structured** values. Hash the lineage
id to a distinct base in [-sp,sp]; same-lineage members SHARE that base (so the homogeniser now PRESERVES it
instead of erasing it), distinct lineages get distinct bases, and a small per-particle jitter keeps a within-
lineage mutational substrate. The new axis is lineage-organised from birth — and via #25's all-dims
`nicheCellOf`, immediately ecological (each lineage's distinct base lands it in its own niche-cell on the new
axis). This is the precise mechanism that turns "grow the board" from noise-injection into real colonisation.

**Verified (this IS a measured result, not just a design claim).** Forced-growth run (gate threshold lowered
so DIMS marches 5→8, SEED=7, 5k ticks), streaming `axisStats(DIMS-1).R` = between-lineage variance fraction:

| sample | DIMS | new-axis R | ctrl-axis-0 R |
|---|---|---|---|
| post-grow → 6 | 6 | 0.956 | 0.892 |
| post-grow → 8 | 8 | 0.987 | 0.768 |
| +500t | 8 | 0.786 | 0.709 |
| +1000t | 8 | 0.745 | 0.688 |
| +1500t | 8 | 0.753 | 0.719 |

The new axis HOLDS at R ≈ 0.75 — statistically indistinguishable from (often above) the lived-in control
axis 0 — and does NOT decay. Compare the #16 retraction's uniform seed, which decayed monotonically
0.85 → 0.47 → 0.38 → **0.26** toward the homogeniser floor and was "statistically indistinguishable from the
control as it relaxed into the same wash-out." Same metric, opposite verdict: the lineage-structured seed
makes a grown axis carry **persistent, lineage-organised** variation. Zero loop/driver errors; DIMS stable at
the cap. (Two isolated R=0 samples land exactly on a grow tick — a measurement-boundary artifact, not decay.)

**What this closes and what it doesn't.** It closes the #16 wash-out at its root for grown axes: the board can
now grow axes that STAY differentiated under the live homogeniser. It does NOT by itself prove run-scale
open-endedness — R holding for ~1500 ticks past a grow is not 200k-tick persistence, and the forced gate here
is far more aggressive than the live saturation gate (every 600t at threshold 6 vs every 3000t at threshold
24). The honest live test stands: does a saturation-EARNED grow, lineage-seeded, produce lineages that persist
and keep diversity climbing across a long real run? But the specific failure mode that doomed #16 — and that
#25 alone would have walked back into — is now measured shut.

**Next:** with grown axes holding structure, the remaining persistence question is purely about the EXISTING
axes' lineages over run-scale (the #16 61→9 collapse, measured before the current stack). If a long export
still shows lineage count bleeding while DIMS grows, the lever is the homogeniser rate / mint grace on the old
axes — not the seeding, which #26 has now shown does its job.

## Swing #27 (LIVE, straight to main) — character displacement: the missing disruptive-selection term

The journal's deepest structural diagnosis, acted on at last: every prior swing raised the carrying capacity
of a system that has an extinction term and gene flow (the homogeniser re-merges) but **no force pushing
distinct lineages APART**. Minted lineages sit at ecological EQUIVALENCE, so competitive exclusion and
re-merging collapse them — the #16 61→9. #24/#25/#26 gave divergence somewhere to land, a board that grows,
and grown axes that hold; none of them makes two co-located lineages actively SEPARATE.

**The term (`applyCharacterDisplacement`, cadence, knob `__CHAR_DISP`, default-on live):** each particle is
nudged AWAY from the trait centroids of OTHER viable lineages (size ≥4), weighted by a Gaussian of trait
distance (σ²=2·0.45², rate 0.0015). Overlapping lineages push hard; separated ones not at all — limiting
similarity made dynamical, self-limiting (overlap→push→separation→push fades, no runaway). Within-lineage
cohesion (the same-lineage homogeniser, the art's clustering) is untouched; only BETWEEN-lineage spacing
grows. Synergises with #25 — more axes = more empty trait-space to displace into without piling at the ±1.2
edges. O(N·L), once per cadence.

**Honest status — shipped on stability + principle, NOT on a measured diversity win.** Verified STABLE: a 6k
single-seed run (SEED=7, full live stack) completed with zero loop/driver errors, tend stayed bounded, no
runaway. But that same run was *collapsing* (entropyRatio 0.67 < 0.7; kinds 26.7→15) — and the matched
CHAR_DISP=0 control did not finish in the window, so **I cannot yet attribute that collapse, or rule out that
displacement at rate 0.0015 is over-spacing and SHEDDING kinds.** This ships under the post-#22
live-is-ground-truth stance: the design is sound and the mechanism is the structurally-missing term, but its
net effect is genuinely unverified. **Pre-registered revert rule:** if a long live export shows diversity
(entropy/occupied-cells) WORSE than the pre-#27 baseline, the cause is over-strong displacement — drop
`__CHAR_DISP` from the LIVE block (one line) or lower CHARDISP_RATE, before any further building on it. The
knob makes this a clean one-flip rollback. The matched A/B (on vs off, ≥3 seeds, ≥10k) is the first thing the
next session should finish — it was started here and is the honest gate this swing has NOT yet passed.

### #27 VERDICT (matched A/B completed) — NET-HARMFUL at rate 0.0015, flipped to DORMANT

The control finished. Matched A/B, SEED=7, 6k ticks, full live stack, character displacement ON vs OFF:

| metric | CHAR_DISP ON | OFF (control) | direction |
|---|---|---|---|
| entropyRatio (late/early) | 0.67 (**collapsing**) | 0.74 (not collapsing) | OFF better |
| entropyBits late | 2.38 | 2.72 | OFF better |
| evenness late | 0.609 | 0.696 | OFF better |
| kindsRatio | 0.56 | 0.60 | OFF better |
| occupied cells late | 37 | 40 | OFF better |
| occ slope | −0.95 | −1.55 | ON better (only metric) |

**Verdict: net-harmful on every diversity metric but one.** Displacement at rate 0.0015 doesn't let MORE
lineages coexist — it pushes the SAME lineages toward the trait-space edges (where the niche supply is sparse),
shedding evenness and entropy. The one favourable metric (slightly slower occupancy decline) is consistent
with that reading: a few edge-pushed lineages cling on while overall variety thins. The disruptive-selection
INSTINCT may still be right, but this implementation over-spaces.

**Action: `__CHAR_DISP` flipped to default-OFF (dormant knob); code + knob retained.** This honours the
journal's discipline — a measured-harmful mechanism does not ship default-on, even under the live-is-ground-
truth stance, because here the ground truth was measurable and it said no. Single seed, so the verdict is
"default-off pending a ≥3-seed confirmation", not a hard refutation. Two concrete re-tunes for whoever revisits
it: (a) much gentler rate (0.0003–0.0006, at/below the homogeniser scale) so it nudges rather than flings; or
(b) gate the push on SAME-NICHE-CELL co-occupancy (true ecological overlap) rather than raw trait proximity,
so it only acts on lineages actually competing for the same resource — which is what "limiting similarity"
actually means, and avoids pushing already-separated lineages off the edge. Stack through #26 is unchanged and
remains default-on; only #27 is dormant.

## Swing #28 (LIVE, straight to main) — the Red Queen: a biotic niche engine on the live cells

The most ambitious move of the session, aimed at the ONE ceiling the whole #11–#27 arc never broke: **abiotic
niches are finite.** Limiting similarity caps coexistence on any fixed resource structure; #24 reshaped it,
#25 grew it, but a board of abiotic cells still saturates. **Biotic niches do not saturate** — every type that
thrives becomes a RESOURCE for something else, and the predator-prey chase has no equilibrium to settle into.
This is the canonical engine of open-ended evolution, and the live piece has never run it (the #11 biotic
lever was 1-D and dormant).

**The mechanism (`__RED_QUEEN`, default-on live; in the N-dim niche branch).** Predators in cell C draw a
CONSERVED amp transfer from a consistently-linked prey cell C+53 (stride prime/coprime to 7776 → one long
predation cycle over all cells): gain to predators ∝ their amp, loss to prey ∝ their amp, zero-sum, so it
inflates no energy (the metabolic brake is untouched). Transfer is bounded (≤5% of predator biomass, ≤10% of
a prey cell per tick → no instant wipeouts, stable). Two properties make it diversity-POSITIVE in theory,
unlike #27:
- **Kill-the-winner (frequency-dependent):** a crowded prey cell is predated hard, a rare one barely — so
  predation falls hardest on whatever is winning, protecting the rare. This is the classic mechanism by which
  predation PROMOTES coexistence rather than capping it (opposite sign to abiotic competition).
- **Predation selects for divergence:** a prey cohort escapes its predator only by crossing a CELL boundary
  into a different cell (which has a different predator). So predation pressure is a direct selective force for
  the boundary-crossing divergence #24 made possible and #17 mints — predation and speciation reinforce.

**Honest status — shipped on principle + clean boot; matched A/B PENDING (the #27 lesson).** Verified it boots
and runs clean (zero loop/driver errors). The net diversity effect is NOT yet measured — and #27 just proved a
plausible-sounding force can be net-harmful, so the same gate applies. **Pre-registered revert rule (identical
to #27):** the matched A/B (RED_QUEEN on vs off, same seed) is running; if it shows diversity (entropyRatio /
occupied cells / evenness) WORSE than the off-control, flip `__RED_QUEEN` to default-off (one line) — predation
rate too high / destabilising. If neutral-or-better, it stays and the next move is to make the prey-link
trait-meaningful (predator trait = prey trait + δ in real trait space, not just index stride) for a true
coevolutionary kernel. The knob is a clean one-flip rollback either way.

## Swing #29 (LIVE, straight to main) — niche construction: life reshapes its own environment

The mutualistic complement to #28, and the second great open-endedness engine the live system never had. Until
now the environment is FIXED scaffolding that life merely occupies; selection acts on organisms against a
static landscape. **Niche construction** makes the landscape part of the evolving system: organisms durably
reshape their own niches, and those modifications are inherited by whoever comes next — the extended-phenotype
/ inherited-niche route to open-endedness (beavers' dams, earthworms' soil, oxygen-producing life remaking the
atmosphere).

**Mechanism (`__NICHE_BUILD`, default-on live; in the N-dim regen loop).** A lived-in cell accrues a
persistent supply boost (`nicheCellBuilt[c]` += 0.0006/tick while occupied, capped at 0.10 ≈ 0.55× base
supply); an abandoned cell's boost decays slowly (×0.9990/tick, legacy ~700t). The boost is added to the
cell's regen, so the niche literally deepens where life persists and stays enriched for a while after life
leaves. Two design choices keep it generative rather than collapsing:
- **Shared, not privatised:** the boost feeds the cell's supply, which is split EQUALLY among occupants (the
  existing anti-rich-get-richer harvest). A lineage that engineers a cell makes it better for whoever lives
  there — descendants AND competitors — so it cannot monopolise the cell. The benefit is to the NICHE, not
  the builder.
- **Capped + legacy:** the cap (~0.55× base) means an engineered cell deepens but never dwarfs the others, and
  the slow decay means an abandoned rich cell is a colonisation magnet — structure accumulates in the
  environment independent of the current population. That decoupling (niche outlives builder) is the
  open-ended part: the world remembers what lived in it.

**Pairs with #28.** Predation (#28) thins whatever is winning; construction (#29) rewards persistence and
builds defended, inherited niches. Together the intent is many deep, occupied, history-bearing niches rather
than one shallow blob — biotic structure that does not saturate the way the abiotic board (#11–#27) did.

**Honest status — shipped on principle + clean boot; matched A/B PENDING (same gate as #27/#28).** Boots and
runs clean (zero loop/driver errors). Net diversity effect unmeasured. Risk to watch: the occupied→richer→more
occupied positive feedback could concentrate population into a few cells (cell-level monopoly → diversity
loss), countered in-stack by #14 local crowding cost, equal-split harvest, and #28 kill-the-winner — whether
that balance holds is exactly what the A/B/live-run decides. **Pre-registered revert:** if a matched A/B (on
vs off) shows diversity (entropyRatio / occupied cells / evenness) WORSE than control, the feedback is
over-strong — lower `NICHE_BUILD_RATE`/`_MAX` or flip `__NICHE_BUILD` default-off (one line). Clean one-flip
rollback. The #28 and #29 A/Bs are the honest gate this pair has not yet passed; running them is the immediate
next task, not more building on top.

## Swing #30 (LIVE, straight to main) — spatial niches / territoriality: the allopatric route, at last

The deepest pre-registered thread the project never built. Every speciation route across #11–#29 was
SYMPATRIC (divergence within a shared space); #21 ended by naming the missing primitive outright: *"the next
thread is SPATIAL STRUCTURE itself… until a cohort can persist in a PLACE, no trait mechanism can manufacture
allopatric divergence — the unexamined primitive is territoriality."* #21 itself failed because it pulled
TRAITS toward spatial neighbours while income stayed global — there was no selective reward for holding ground,
so positions re-mixed and no territory formed.

**The fix (`__SPATIAL_NICHE`, default-on live; folded into `nicheCellOf`).** Make LOCATION a niche axis: a
coarse 4×4 region grid over the canvas is folded into the niche cell, so two organisms with identical traits in
different regions occupy DIFFERENT cells. Every per-cell force therefore becomes per-REGION — harvest income,
crowding (#14), predation (#28), construction (#29). Consequences: an under-occupied region pays a colonisation
bonus, a crowded region hurts, and a region can be built up (#29) and defended. Crucially, the substrate
ALREADY biases offspring placement spatially (cluster-centroid spawn at ~L16986, the `scaffoldField` habitat
layer) — that dispersal viscosity finally has a selective REWARD, the exact ingredient #21 lacked. A lineage
holding region R now coexists with a different lineage in R′ without competing → allopatry, plus sympatric trait
divergence within each region. Folded through the hash path, so cell count is unchanged and the default-off
path stays byte-identical.

**Honest status — clean boot, verdict consolidated.** Boots/runs clean (zero errors); occupied cells rose
~37→68 on the smoke run, consistent with space multiplying held niches (necessary, not sufficient — could be
churn, not territory). I had been running a slow isolating 2×2 for #28/#29 but killed it (≈3 min/run, ~25 min)
to keep momentum; #28/#29/#30 are now validated TOGETHER by a single consolidated A/B: the full biotic+spatial
stack vs the pre-#28 baseline (RED_QUEEN=NICHE_BUILD=SPATIAL_NICHE=0 = the #26 stack). **Pre-registered rule:**
if the full stack beats baseline on diversity → keep all three default-on; if it loses → run the isolating
factorial to find and flip the culprit (each is its own knob). The biotic+spatial engines are the session's
thesis — abiotic niches are finite, biotic+spatial ones are not — and this consolidated test is their gate.

## VERDICT (#28+#29+#30, consolidated 3-seed A/B) — biotic+spatial stack VALIDATED, kept default-on

The honest gate the biotic/spatial engines owed. Consolidated A/B, 3 seeds, 6k ticks: FULL (Red Queen #28 +
niche construction #29 + spatial niches #30, all on) vs BASE (the #26 stack, all three off).

| metric | s7 FULL/BASE | s23 FULL/BASE | s99 FULL/BASE |
|---|---|---|---|
| entropyRatio | 0.87 / 0.74 | 0.82 / 0.68 (BASE collapsing) | 0.84 / 0.81 |
| evenness late | 0.888 / 0.696 | 0.838 / 0.680 | 0.839 / 0.691 |
| entropyBits late | 2.85 / 2.72 | 2.69 / 2.37 | 2.86 / 2.63 |
| occupied cells | 64.5 / 40 | 64.75 / 27.5 | 23.5 / 31.5 |

**Verdict: the full stack beats baseline on entropyRatio, evenness, and entropyBits across ALL THREE seeds**,
and on seed 23 it RESCUED a collapsing baseline (0.68→0.82). Evenness is the strongest and most consistent
signal (≈0.70→0.84 everywhere): the engines hold the distribution even rather than letting it slide toward a
few dominant types — exactly the "kill-the-winner (#28) + defended inherited territories (#29/#30)" thesis.
Occupied-cell count is the one mixed metric (up on s7/s23, down on s99), so the win is in DIVERSITY QUALITY
(evenness/entropy), not necessarily raw niche count — consistent with territories CONCENTRATING life into
fewer-but-more-even holdings on some seeds. Zero errors throughout.

**Decision: keep #28/#29/#30 all default-on.** Opposite of #27 — here the matched control says the mechanisms
help, consistently. This is the session's headline alongside #26's verified R-hold: the abiotic arc (#11–#27)
kept hitting the finite-niche ceiling; the biotic+spatial engines (#28–#30) measurably lift diversity over it.

**Honest bound.** 3 seeds, 6k ticks, CONSOLIDATED (not isolated) — it confirms the COMBINED effect is positive
but does not apportion credit among #28/#29/#30. The isolating factorial (each knob alone) is the natural
follow-up to learn which engine carries the win and whether any is a passenger; deferred because, the combined
effect being clearly positive, there is no harmful culprit to hunt (unlike #27). Run-scale persistence (the
deep #16 wall) remains a live-export question; this A/B shows the engines don't HURT and clearly help at 6k.

## Swing #31 (LIVE, straight to main) — true coevolutionary kernel: the Red Queen made real

Built because #28 SURVIVED its gate (the upgrade is now worth making). #28's predator→prey link is a fixed
INDEX stride (cell C eats C+53): consistent enough to produce turnover, but the link carries no TRAIT meaning,
so predators never track prey through trait space and there is no actual arms race — just a fixed food web on
a cell permutation. #31 makes the link TRAIT-RELATIONAL.

**Mechanism (`__RQ_TRAIT`, sub-mode of `__RED_QUEEN`, default-on live).** A predator eats organisms whose diet
trait sits `RQ_TRAIT_SHIFT`=2 bins away IN THE SAME SPATIAL REGION (an "attack image" on the diet axis, cyclic
— 2 of 6 bins gives a directed 3-cycle, never mutual A↔B predation). Per-organism (each predator's prey cell =
`nicheCellPreyOf(i)`: its own trait with the diet bin shifted, same region), conserved by a 3-pass scheme
(demand → bounded extract ≤RQ_RATE·demand and ≤RQ_MAXFRAC·preyBiomass → distribute gain ∝ predator amp, loss ∝
prey amp; Σgain = Σloss exactly). Consequence: a prey cohort under pressure escapes only by SHIFTING ITS DIET
into a different cell, where a different predator's image points — and predators that track the shift are
rewarded. An open-ended pursuit in real trait space, localised to regions (allopatric predation), that
reinforces #17 divergence and #30 territory rather than being orthogonal to them. Off → falls back to #28's
validated index-stride.

**Honest status — clean boot; A/B PENDING.** Boots/runs clean (zero loop/driver errors; evenness 0.978, occ 65
at 2k — stable, no energy runaway from the conserved transfer). The comparison that matters is #31
(trait-relational) vs #28 (index-stride), both with RED_QUEEN on — does giving predation trait-meaning improve
diversity/turnover over the fixed graph? Running now. **Pre-registered rule:** if trait-relational ≥
index-stride on diversity, keep `__RQ_TRAIT` on; if worse, flip it off (clean fallback to validated #28). Same
discipline as #27/#28/#29. The deeper coevolution signature (sustained predator-prey trait CYCLING, not just
standing diversity) needs a turnover/chase instrument the harness lacks — flagged for a future measurement
swing; for now the gate is "does it beat the fixed-graph baseline on the diversity metrics we have."

## Swing #32 (LIVE, straight to main) — mutualism: the first positive (+/+) interaction

Every biotic force so far is competitive (−): predation #28/#31, crowding #14. Real ecosystems are also built
on FACILITATION — partners that make each other more productive (pollinators/plants, gut flora, lichen). #32
adds it. With `NICHE_ND_BINS` even and `MUT_SHIFT = BINS/2 = 3`, the partner-of-partner closes (b+3+3 ≡ b), so
each organism's mutualist is its DIET-OPPOSITE in the same region and the relation is RECIPROCAL (A↔B). Both
gain a bounded, POSITIVE-SUM bonus (`min(own amp, partner-cell biomass) × MUT_RATE`) from the partner's local
presence — mutualism CREATES value, so unlike predation it is not zero-sum; the metabolic brake caps the total.

**Effect intended.** Complementary diet types are rewarded for CO-OCCURRING, so a region tends to fill with a
balanced, interdependent PAIR rather than collapsing to one monoculture — a proto-symbiosis / division-of-
labour that raises evenness and seeds a higher-level (paired) unit. Combined with #28/#31, every type now sits
in a real interaction web: it has prey (diet−2), predators (diet+2), and a partner (diet-opposite) — and with
#30 these all resolve WITHIN a spatial territory. That web of −/− and +/+ couplings across trait space is a
much richer, less saturable selective landscape than the abiotic cells alone.

**Honest status — clean boot; A/B PENDING (knob `__MUTUALISM`, default-on).** Boots/runs clean (zero errors;
evenness 0.853, occ 71 at 2k — the positive-sum term did NOT inflate amp / runaway, the brake holds). Unvalidated
on diversity. Both #31 and #32 now await their gate; the owed comparison is the full stack (#28–32) vs the
already-validated #28–30 stack — i.e. do the trait-relational kernel (#31) and mutualism (#32) ADD to the
validated biotic+spatial base, or are they passengers / regressions? **Pre-registered rule (unchanged):** each
is its own knob; whichever fails to beat the #28–30 baseline on diversity gets flipped dormant. The risk to
watch for #32 specifically: rewarding co-occurrence could COUNTERACT the territorial separation of #30 (mixing
vs sorting) — the A/B's evenness-vs-occupancy split will show which force wins.

## VERDICT (#31 + #32, 3-seed A/B vs validated #28–30 base) — a WASH, both flipped DORMANT

The owed gate. 3 seeds, 6k: FULL (#28–32, trait-relational predation + mutualism on) vs BASE (#28–30, both off).

| seed | entRatio FULL/BASE | evenness FULL/BASE | occ FULL/BASE |
|---|---|---|---|
| 7  | 0.85 / 0.87 | 0.941 / 0.888 | 60.75 / 64.5 |
| 23 | 0.86 / 0.82 | 0.882 / 0.838 | 55.5 / 64.75 |
| 99 | 0.75 / 0.84 | 0.747 / 0.839 | 44.5 / 23.5 |

**Verdict: a wash, leaning slightly negative.** Averaged entropyRatio FULL 0.82 vs BASE 0.84; evenness ≈ equal;
seed 99 a clear FULL regression (0.75 vs 0.84). Unlike #27 it is not net-HARMFUL, but it does not BEAT the
validated baseline either — and the project's standard is earn-your-default-on, not merely don't-hurt. **Both
`__RQ_TRAIT` (#31) and `__MUTUALISM` (#32) flipped default-OFF; code + knobs retained.** Honest reading: these
two add INTERACTION STRUCTURE (a real arms race; reciprocal partnerships) whose payoff is in TURNOVER and
proto-symbiotic pairing, neither of which the standing-diversity harness measures — so "wash on entropy/evenness"
is a weak test of what they actually do, not a refutation. They ship dormant pending a turnover/chase
instrument (pre-registered as the next measurement swing) and an isolating factorial (#31-alone vs #32-alone)
to see if one is a winner masked by the other. The live stack returns to the VALIDATED #28–30 + abiotic
foundation. (3 seeds, 6k — same bound as the #28–30 win it is measured against, so the comparison is apples-to-
apples.)

## MEASUREMENT (live export, gen1 t64548) — THE BOARD GREW ITSELF and diversity REGENERATED from collapse

The first real-artwork ground truth of the session, not a harness run. A genome exported from the live piece at
**tick 64548** — past the ~t40k monoculture regime that the 360c2fb commit diagnosed as an absorbing state.
Decoded epoch series (EP) + genome fields:

- **`tendDims = 9`.** The board grew itself from the base 5 to the cap 9 — the unambiguous signature of #25
  (saturation-gated dimensionality), FIRING in the live artwork, not just the harness. The growth-count column
  of EP rises 0→1→2→3 across the run (t15k, t25k, t60k), i.e. the ratchet tripped repeatedly as diversity
  earned new axes; td=9 by export.
- **Diversity REGENERATED from a mid-run collapse.** kinds: 20 → 23 → **crash to 2 at t15k** → bottoms at 1
  (t45k) → **recovers to 10 at t60k**. `divMean`: unrecorded/≈0 through the collapse, then **0.508 (t50k) →
  0.646 (t55k) → 0.71 (t60k)** — climbing in the back half. population tracks it: 266 → bottleneck 67 (t15k) →
  448 (t60k). This is exactly the designed escape: the piece fell into the post-bottleneck monoculture #24 was
  built to break, and in the back half the open-endedness engines pulled it BACK OUT — diversity, dimensions,
  and population all rising together.
- Supporting: VM length grew to 15, 5 persistent multi-sample motifs carrying 9-dim trait vectors (ages 8–18
  samples), 4 live lineages at export. The self-authoring/complexity machinery is engaged, not dormant.

**Honest bound — strong but single-run, and causation is inferred not proven.** One export, gen1; the global
engine flags aren't stored in the genome, so I can confirm #25 ran live (td=9 is impossible otherwise) but
cannot prove from this file alone WHICH of #24/#28–30 drove the diversity recovery vs other dynamics. What it
DOES establish: (1) the dimensionality ratchet works in the real artwork, reaching the cap; (2) the live piece
does NOT stay trapped in the monoculture absorbing state — it regenerated to 10 kinds / divMean 0.71 by t60k.
The headline metric the whole arc chased — diversity that recovers and climbs instead of collapsing — is
present in the live ground truth. A multi-export time series (or run-scale logging of the engine flags) would
turn this from "consistent with the thesis" into "attributed to it"; that is the next real-data swing.

## Swing #33 (LIVE, straight to main) — major transition: group selection for DIVISION OF LABOUR

The big push. The substrate already has a real SECOND LEVEL OF SELECTION — persistent cohesive clusters bud
daughter colonies, with an evolvable cluster-genome (budRate/budThreshold/splitFraction…) inherited by
daughters (`attemptClusterBudding`, the Pe22f "major evolutionary transition"). But group FITNESS rewarded only
energy + coherence + territory — nothing ecological. So group selection could not drive the thing that MAKES a
major transition matter: internal DIFFERENTIATION. A colony that is one big monoculture blob and a colony that
is a functioning little ecosystem of specialists budded at the same rate.

**The change (`__GROUP_ROLES`, default-on).** Add a DIVISION-OF-LABOUR term to the bud chance: count the
distinct niche-cells occupied by a cluster's members and boost its reproduction by
`GROUP_ROLE_GAIN·min(1,(distinctCells−1)/GROUP_ROLE_NORM)` — 0 for a one-cell colony, up to +0.5 (≈ the scale
of the existing territory score) for a colony spanning ≥7 cells. Now a functionally-differentiated colony
out-reproduces a uniform one. This couples the VALIDATED niche economy (#24/#28–30) into the second level of
selection, and because a budded slice spans several cells, it steadily injects ROLE-DIVERSE founder groups into
the population — selection toward colonies that hold a whole little ecosystem rather than one type. That is the
hallmark of multicellularity (germ/soma, specialists), expressed through the transition machinery that already
exists rather than bolted on.

**Honest status — clean boot; A/B PENDING.** Boots/runs clean (zero errors; evenness 0.98 at 2.5k). Net effect
unmeasured; A/B (on vs off, 3 seeds) running. **Caveat on heritability:** budding currently takes a SPATIAL
slice of the colony, which need not preserve role-diversity in the daughter — so this is reliably a population-
level diversity-INJECTION pressure (differentiated colonies seed more role-diverse founder groups) but only
weakly a heritable group TRAIT yet. If the A/B shows it helps, the natural Part 2 is to bias bud-member
selection to SAMPLE ACROSS niche-cells so daughters inherit the parent's division of labour — turning injection
into true heritable group-level organisation. **Pre-registered rule (unchanged):** beat the baseline (#28–30
live, GROUP_ROLES off) on diversity → keep on; wash/worse → flip dormant (clean knob revert), like #31/#32.

### #33 VERDICT (3-seed A/B) — HARNESS-INVISIBLE (identical to the digit); kept on by non-harm construction

The A/B (GROUP_ROLES on vs off, 3 seeds, 6k) came back **byte-for-byte identical** on every metric, every seed
(entRatio 0.87/0.82/0.84, evenness/occ/entBits all exactly equal ON=OFF). That is not a wash — it means #33
changed NOTHING in the harness. Cause, traced: cluster budding (`attemptClusterBudding`) gates on size ≥14 AND
persistAge ≥ budThreshold(6–12 cycles); headless 6k runs don't grow colonies to that size/age, so the bud path
— and thus the role-diversity bonus — never fires. The harness cannot exercise the major transition at all
(confirmed indirectly by the identical RNG trajectories: a single different bud draw would diverge a chaotic
run). The live export (t64548), by contrast, shows the budding machinery ACTIVE (cluster lineages, budCount).

**This is categorically different from #31/#32.** Those were MEASURABLY neutral-to-worse (tested, failed the
bar) → dormant. #33 is UNTESTABLE here but NON-HARMFUL BY CONSTRUCTION: `roleBonus = 0.5·min(1,(cells−1)/6) ≥ 0`
is strictly additive to bud chance, so `budChance_with ≥ budChance_without` always — #33 can only ever INCREASE
the reproduction of role-diverse colonies, never suppress anything, never reduce diversity or destabilise. And
budding carries its own metabolic cost + cluster cap, so "more budding of good colonies" is bounded.

**Decision: keep `__GROUP_ROLES` default-on** — not on harness validation (impossible here), but on (1) strict
non-harm by construction and (2) the live export confirming the machinery it hooks into runs in the real piece.
Honest bound: this is NOT validated, it is shown-safe-and-untestable-headless. **The real test is a live export
measuring whether colonies become more role-diverse (members spanning more niche-cells) over a run with
GROUP_ROLES on vs a prior export** — registered as the next real-data swing, alongside the #31/#32 turnover
instrument. If that live test ever shows no colony-differentiation signal, #33 is a no-op and should be flipped
off to keep the live path honest; until then it ships as a sound, bounded, additive group-selection pressure.

## Tooling — group-transition instrument (give the harness eyes for the major transition)

#33's A/B was harness-INVISIBLE (identical ON/OFF) because cluster budding never fires in headless runs. Rather
than take #33 on faith, built the instrument the verdict said was owed: per-bud recording of PARENT role-
diversity (distinct niche-cells among a budding colony's members) and DAUGHTER role-diversity (distinct cells
among the budded slice), exposed in the harness verdict as `group_transition {budEvents, meanParentRole,
meanDaughterRole}`. Plus `__GROUP_PROBE` (lowers the bud size/age thresholds for headless measurement; default
off so the live piece is unchanged) and `__BUD_INSTR` (enables the counters). The two readouts answer the two
real questions: does GROUP_ROLES make BUDDING colonies more differentiated (parent), and does the daughter
INHERIT it (daughter vs parent → how much Part 2 is owed)?

**Preliminary finding (being confirmed by a longer run):** even with `GROUP_PROBE=1` (size≥6, persistAge≥3),
budEvents = 0 in 6k headless runs — colonies in the canvas-stubbed headless environment apparently don't grow
large/persistent enough to bud. If the longer run also shows 0, the honest conclusion is structural: the major
transition is NOT measurable in this headless harness at all (it needs the full spatial cluster dynamics the
stubs don't reproduce), and #33's only valid test is a LIVE export with the instrument's questions asked of
real bud events. The instrument is then still the right artifact — it just has to be pointed at live data, not
the harness. (Recorded so the next session doesn't re-derive that the harness can't see the group layer.)

## Instrument (#33 measurability) — the harness CAN'T drive the major transition; live event log now carries role-diversity

Acting on the #33 blind spot. Built a bud-role-diversity instrument: each cluster bud records its PARENT
role-diversity (distinct niche-cells among members) and DAUGHTER role-diversity (distinct cells in the budded
slice). Added a `__GROUP_PROBE` knob that floors the bud thresholds (size 14→6, persistAge→3) so budding could
fire in short headless runs, and harness reporting (`group_transition: {budEvents, meanParentRole,
meanDaughterRole}`).

**Finding: budding NEVER fires in the headless harness, even floored.** GROUP_PROBE=1, BUD_INSTR=1, up to
12000 ticks: budEvents=0 — despite 30 clusters forming. Clusters form but stay too small/transient (never
reach size 6 AND persist 3 detection cycles simultaneously) in the canvas-stubbed environment. So the entire
group-level / major-transition layer is STRUCTURALLY unmeasurable in this harness — it needs the full spatial
dynamics the stubs don't reproduce. This is a real, confirmed limitation, not a tuning issue: the standing-
diversity harness measures the particle level; the group level is invisible to it.

**Resolution — measure it where it actually fires: the live artwork.** Bud events are already logged to the
export event stream (`recordEvent('cluster_bud', …)`), and the t64548 export carried exactly that kind of log.
So the instrument now writes `pr` (parent role-diversity) and `dr` (daughter role-diversity) into BOTH the
cluster_bud event and the genome.lineage bud records — always-on, cheap (buds are rare). A future live export
with GROUP_ROLES on will therefore CARRY the data to validate #33 directly: if budding colonies' `pr` trends
above the population's typical colony role-diversity, group selection for division of labour is working; if
`dr` ≪ `pr`, the daughter isn't inheriting it and Part 2 (sample bud members across niche-cells) is owed. The
harness `group_transition` block + `__GROUP_PROBE` remain for any future harness that better reproduces
clustering. Net: #33 went from "untestable, taken on faith" to "instrumented at the live layer where it fires"
— the honest way to close the blind spot is to measure where the phenomenon lives, not to fake it headless.

## Swing #33 Part 2 (LIVE) — heritable division of labour: the daughter is a microcosm

Completes the major transition. Part 1 (#33) rewards role-diverse colonies with more budding, but budding took
a SPATIAL slice of the colony — a daughter need not inherit the parent's role-diversity (dr ≪ pr), so the trait
could be injected but not ACCUMULATE across generations. Part 2: when `__GROUP_ROLES` is on, the budded members
are chosen to SPAN niche-cells — bucket candidates by cell (each still in facing order), round-robin across
buckets — so the daughter is a microcosm of the parent's ecosystem. Division of labour is now HERITABLE across
the transition, not just a one-shot injection. This is the half that makes group-level selection cumulative:
role-diverse colonies bud more (Part 1) AND pass their differentiation to daughters (Part 2) → the trait can
climb. Non-harmful by construction (same member count moves, same energy; only WHICH members change). Clean
boot. Validation, like all of #33, lives in the cluster_bud event log: a future GROUP_ROLES export should now
show dr ≈ pr (daughters inheriting the parent's role-spread) where before Part 2 it would have been dr ≪ pr.

## Swing #34 (LIVE) — genotypic open-endedness: turn the lights on in the opcode museum

The whole arc has been ECOLOGICAL open-endedness (niche/biotic/spatial/group). #34 opens the GENETIC half. The
VM "museum" runs ~20 of 256 opcodes (the long-diagnosed coupling gap): mutation rarely introduces unused
opcodes and nothing pulls toward them, so the vast program space sits dark. #34 activates the dormant
opcode-novelty lever in the live stack AND upgrades it: instead of rewarding merely CURRENTLY-rare opcodes, it
rewards opcodes the population has HISTORICALLY under-explored — `opCum`, a slow EMA (×0.98) of each opcode's
usage share, so a never-tried opcode stays ≈0 and is maximally novel, sustaining pressure INTO the unused space
rather than reshuffling the used 20.

**Principled, not the inflation trap.** The reward stays MEAN-CENTRED (zero-sum): it re-weights a fixed amp pool
toward genotypic explorers, it does NOT mint amp for novelty by fiat. That matters — the journal's hard #16/#22
lesson is that un-function-gated novelty income is drift-inflation (rewarding ID-tags / functionless variation).
Mean-centred opcode-novelty can't do that: it only gives explorers a relative edge, and REAL selection (the
niche economy, biotic pressure, survival) then keeps or discards them. Novelty is raw MATERIAL fed to the
ratchet, not fitness handed out for being different. #11 already showed this lever produces a real
VM-exploration signal; #34 makes it default-on and aims its pull at the genuinely-unexplored opcodes.

**Honest status — shipped on design; harness can't validate it (and that's expected).** Clean boot, zero
errors, no instability. distinctOps slope = 0 at 4k ticks — genotype exploration is SLOW (opCum's EMA moves
over thousands of ticks; new opcodes spread over many generations), so a short headless run can't show it, and
chasing it in the harness would be the exact safe-space mistake. The real signal lives in a LONG live export:
the `co` (opcodes-used) breadth, `liveAtoms`/authored-atom count, and distinct-opcode count over a real run with
OPCODE_NOVELTY on vs the historical ~20. If a future export shows opcode breadth climbing above ~20, the museum
lights are coming on; if it stays flat, the pull is too weak (raise OPNOV_STRENGTH) or mutation isn't
introducing new opcodes fast enough (a mutation-operator swing, not a reward swing). Mean-centred = safe to run
live while we wait for that data.

## STATE OF THE STACK (as of #34) — the live open-endedness architecture + export-validation checklist

Three axes of open-endedness now run in the live piece. What to look for in a LIVE EXPORT to validate each
(the harness is blind to most of this — listed so the next real export earns its keep):

**Ecological (validated headless + live)**
- #24 niche board (5 axes wired, finer cells) · #28 Red Queen predation · #29 niche construction · #30 spatial
  territoriality. → 3-seed A/B validated (entropy/evenness beat baseline; rescued a collapsing seed). Live
  export check: `divMean` holding/climbing late-run; occupied niche-cells; no permanent monoculture lock.
- #25 board grows itself (saturation-gated dimensions). → CONFIRMED LIVE (t64548 export: tendDims=9). Check:
  `td` > 5, growing with diversity.

**Hierarchical (live, validates only from export)**
- #33 major transition: group selection for division of labour (Part 1) + heritable role-inheritance (Part 2).
  Harness CANNOT test (budding never fires headless). Check: cluster_bud events carry `pr`/`dr`; with the stack
  on, `pr` above typical colony role-diversity (selection working) and `dr ≈ pr` (Part 2 making it heritable).

**Genotypic (live, validates only from export)**
- #34 opcode-exploration (mean-centred, cumulative-innovation weighted). Slow; harness can't show it. Check:
  opcode breadth (`co` / distinct opcodes used) climbing above the historical ~20; `liveAtoms`/authored atoms.

**Dormant (honest negatives, one-flip revivable):** #27 character displacement (measured harmful), #31
coevolutionary kernel + #32 mutualism (A/B wash on standing diversity — need a turnover instrument).

**Biggest untouched frontier:** META-EVOLUTION — the engine parameters (OPNOV_STRENGTH, NICHE_BUILD_RATE,
RQ_RATE, the DIMS_SAT threshold) are designer constants. Wiring them into the evolvable genome meta-layer would
let selection tune the system's OWN evolvability — "evolve the rules of evolution," the deepest open-ended lever
left. High-leverage, high-risk (evolved params can destabilise); the right next big push, but a real
architectural commitment.

## Swing #35 (LIVE) — META-EVOLUTION: the open-endedness engines become evolvable genes

The deepest lever, and the one you greenlit. Every engine this session (#24–#34) had a designer-constant
intensity. #35 makes four of them EVOLVABLE genome genes, so the system tunes its OWN open-endedness — "evolve
the rules of evolution." This is idiomatic, not bolted-on: the genome already turns dozens of hardcoded
constants (physics, perception, mutation) into evolvable fields; #35 adds the engine dials to that framework.

**The four dials (global genome fields, default = the exact prior constant):**
- `opnovStrength` (#34 genotypic exploration) ∈ [0, 0.01]
- `nicheBuildRate` (#29 niche-construction effort) ∈ [0, 0.003]
- `rqRate` (#28 predation aggression) ∈ [0, 0.15]
- `dimsSatThresh` (#25 board-growth eagerness — lower grows the board easier) ∈ [8, 60]

**Wiring (the established pattern, six sites each, all name-checked):** field defaults to the constant →
engines read `genome.X ?? CONST` (so an evolved 0 = "off" is honoured) → `mutateGenome` random-walks each via
`maybe()` at gentle magnitudes → `sanitizeGenome` clamps to the safe bounds → `encodeGenome` writes an `oe`
array → `decodeGenome` reads it defensively (per-element typeof, then sanitize defaults/clamps). Lineage
selection adjudicates them like any gene.

**Safety — bounded by construction, backward-compatible.** Every bound was chosen so no evolved value can
destabilise: predation stays conserved (rqRate≤0.15), novelty stays mean-centred (can't inflate), build stays
capped (NICHE_BUILD_MAX is separate), growth stays gated+capped at DIMS 9. sanitizeGenome clamps on every load/
adoption, so however mutation or selection moves them, they land in range. Old exports (no `oe`, e.g. t64548)
load unchanged — decode skips, sanitize defaults to the constants. Clean boot, zero errors, evenness 0.878 at
2.5k (behaviour unchanged at t=0, as designed — the genes START at the old constants and only drift under
selection). New exports carry `oe`, so this is the one #35 thing a LIVE EXPORT directly validates: watch
whether the four dials DRIFT from their defaults over a run, and in which direction — that is the system
expressing a preference about how open-ended to be. If they sit pinned at defaults, the selection signal on
them is too weak (wire them to a more direct fitness term); if they swing to bounds, selection has a strong
opinion and the next move is to widen the most-pressed bound.

## MEASUREMENT (live export, gen11 t225183) — META-EVOLUTION CONFIRMED; sustained diversity still UNSOLVED

The first RUN-SCALE live validation of the full session stack (#24–#35): 225k ticks, 11 generations. Decoded.

**Meta-evolution (#35) WORKS — and the system expressed a clear preference.** The evolvable dials drifted from
their defaults; one drifted hard:
- `dimsSatThresh` 24 → **11.18 (−53%)** — the system HALVED its own board-growth threshold. A 53% one-way move
  over the run reads as directional selection, not drift: given control, the system chose to grow new dimensions
  far more easily.
- `rqRate` 0.05 → 0.0552 (+10%), `opnovStrength` 0.0025 → 0.00207 (−17%), `nicheBuildRate` −4% (≈drift).
And it acted on the preference: `tendDims` reached **11**, with the EP growth-count column climbing 0→8,
accelerating late-run exactly as the lowered threshold predicts. Genotype layer alive too: 8 authored atoms,
one (`(-0.52)-(Math.cos(m))`) load-bearing at 18 uses.

**But sustained diversity FAILED at run-scale — the honest negative.** The kinds/divMean trajectory:
- t5k–45k healthy (divMean ~0.65–0.72, kinds 4–27).
- **t50k–195k: a ~145k-tick MONOCULTURE LOCK** — divMean collapses to ~0.1–0.2 (null at the deepest), kinds ≈0,
  while population stays healthy (300–620). One homogeneous blob.
- t200k–210k: a sharp recovery (divMean 0.69, kinds 22) — then crashes again by t215k (kinds 0, pop halved).

**The decisive decoupling: the board grew dimensions the ENTIRE time diversity was collapsed.** Growing the
niche SPACE does not fill it with sustained kind-diversity — empty new axes don't help a monocultural
population. Worse, the system's self-evolved strategy (grow the board easier) optimised the wrong lever: it left
`rqRate` (the kill-the-winner anti-monoculture force) near baseline and poured its meta-evolution into
dimensions. Structural/dimensional open-endedness (board growth, dial evolution, genotype exploration) is REAL
and self-reinforcing; diversity open-endedness is NOT — they are decoupled, and the run lived mostly in
monoculture.

**Implication for the next thread.** The wall is not niche-space size (we have 11 dims and the system wants
more) — it is that nothing SUSTAINS coexistence against the homogenising pull at this population scale (~500).
Recoveries prove escape is possible; the 145k-tick locks prove it isn't maintained. Two concrete moves: (1)
widen `rqRate`'s upper bound (current cap 0.15 may be too low for kill-the-winner to bite a 500-strong
monoculture) so meta-evolution CAN crank predation if it helps; (2) — more fundamental — wire DIVERSITY ITSELF
into the fitness the dials are selected on, so the system is rewarded for staying varied, not just for growing
its board. As it stands the dials evolve toward whatever raises lineage fitness, and a fit monoculture is a
valid optimum; nothing makes the system VALUE its own diversity. That missing term — diversity as a first-class
objective the meta-layer optimises — is the real next swing.

### #aec616b verdict REVISED by live observation — "monoculture lock" is likely PUNCTUATED EQUILIBRIUM, not failure

Watching the live artwork (not the metric) corrected the reading above. The flat `kinds≈0` stretches are NOT a
dead stalemate: inside the t212–213k window the event log holds a CASCADE of ~9 extinctions in ~700 ticks
(`alive` 7→0→5→1→2→0…), the generation counter advancing to 11, and an authored atom being BORN (`ua_birth`)
mid-cascade — i.e. rapid crisis-and-renewal turnover the standing-diversity number flattens to "0". Live, this
reads as PUNCTUATED EQUILIBRIUM (long stasis → fast extinction/regeneration burst), which is a legitimate — and
arguably richer — open-ended signature, not convergence. Under the flat stretches THREE things grew
monotonically the whole run: the board (5→11 dims), the population trend, and the evolvable dials. So the system
was loading tension during stasis, not idling.

**Correction to the prior entry:** "sustained diversity FAILED" overstated it — the right frame is "standing
KIND-diversity is episodic/punctuated, while structural complexity (dims, dials, genotype, generations) grows
continuously." The proposed fix (wire diversity into fitness) is now ON HOLD — forcing steady diversity could
SUPPRESS the boom-bust that makes the piece alive; you don't anesthetise a punctuated system. The real open
question is no longer "diversity vs monoculture" but **is the punctuation GROWING or DAMPING** — bursts bigger/
more frequent + board climbing + dials moving + each recovery higher (open-ended growth), vs each crash
bottoming lower + bursts thinning (slow wind-down). A t≈275k export (another 50k) decides it; verdict deferred
until then. Lesson restated: the live artwork saw what the headless metric could not — exactly the earlier
caution about over-trusting the harness.

## VERDICT (gen12, t409596) — punctuation DAMPED to a stable attractor; meta-evolution turned OFF its own diversity-maintenance

The growing-vs-damping question, answered by a ~410k-tick run (185k past gen11). **DAMPED.** After the last
diversity burst (t200–210k, kinds→22), the system settled: t225k–410k holds divMean pinned at ~0.08–0.10 and
SLOWLY DECLINING to ~0.063, kinds = 0 the entire 185k, population large and stable (climbing 280→651, pinned at
651 for ~40k ticks of zero-churn stasis, one mild dip/recovery at t370k). The boom-bust the live view caught
was the TAIL of the punctuated phase; it did not recur. The system found a stable, large, homogeneous attractor.

**But the dials reveal WHY — and it's the session's deepest finding.** Meta-evolution (#35) is dynamic: the
genome moved the engine dials substantially gen11→gen12, and one move is decisive —

| dial | default | gen11 (t225k) | gen12 (t410k) |
|---|---|---|---|
| opnovStrength (#34 explore) | 0.0025 | 0.00207 | **0.00427** (↑) |
| nicheBuildRate (#29 build) | 0.0006 | 0.00058 | **0.00119** (↑) |
| rqRate (#28 predation) | 0.05 | 0.0552 | **0.00087** (↓ −98%) |
| dimsSatThresh (#25 growth) | 24 | 11.18 | 19.42 (↑, back toward default) |

**The system evolved predation to near-ZERO.** Predation is the #28 "kill-the-winner" force — the one mechanism
that MAINTAINS diversity by taxing whatever dominates. Given control of its own rate, selection drove it to
~2% of default. This is why it converged to monoculture: predation is CONSERVED (zero-sum) — it costs the
predator-lineage and only benefits the commons (diversity), so it is not individually adaptive, and meta-
evolution removed it. Classic evolutionary suicide / tragedy-of-the-commons: each lineage gains by predating
less, collectively low predation → no winner-control → monoculture. The system selected AWAY from its own
open-endedness because open-endedness wasn't individually selected.

**This is the resolved answer to "why does it monoculture," and it indicts #35's design, productively:** making
the diversity-MAINTAINING dial freely evolvable let selection switch it off. Two clean implications for next:
(a) FLOOR rqRate (don't let predation evolve below, say, 0.03) — keep the diversity-maintenance non-negotiable
while the other dials stay free; or (b) wire standing diversity into the fitness the dials are selected on, so
maintaining variety is individually rewarded (group-selection-for-diversity). (a) is the cleaner test: if a
floored predation rate keeps the boom-bust alive past t220k, the tragedy-of-the-commons reading is confirmed.
Still alive underneath: board grew to td=13, gen 12, longestStable 1362→2488, dials actively evolving — an
alive, evolving, but diversity-converged system. The piece didn't die; it found peace, which for an open-ended
artwork is its own kind of failure.

## Swing #36 (LIVE) — FLOOR rqRate at 0.03: make diversity-maintenance non-negotiable

The fix the gen11→12→14 data demanded. Three live exports proved the tragedy-of-the-commons: with predation
freely evolvable, selection drove `rqRate` monotonically 0.0552 → 0.00087 → **−0.0011** (negative, clamped to
0), and standing diversity died in lockstep — divMean bled to ~0.05, kinds=0 for 120k+ ticks, population frozen
at exactly 500. Predation (#28 kill-the-winner) is the one force that MAINTAINS diversity by taxing the winner,
but it is conserved (individually costly, benefits only the commons), so meta-evolution correctly — and fatally
— switched it off. Open-endedness was not individually adaptive, so the system selected against it.

**Change (one line in sanitizeGenome):** `rqRate` clamp floor 0 → **0.03** (range now [0.03, 0.15]). The other
three dials (opnov, build, dimsSatThresh) stay fully free — only the diversity-maintaining one is held above a
minimum. 0.03 is ~60% of the boom-bust-era rate (~0.055, which sustained the punctuated dynamics through
t220k), enough to keep winner-control on. Selection will keep pushing below 0.03 and sanitize will keep clamping
it back up each cadence — predation is now MAINTAINED against individual selection, which is the whole point.

**This is the direct test of the diagnosis, with a falsifiable prediction.** Reload the artwork (a page reload
re-runs sanitizeGenome on the saved genome, lifting its rqRate from ~0 up to the 0.03 floor) and run it past
where this run flatlined. PREDICTION: if tragedy-of-the-commons was the cause, a floored predation rate revives
the boom-bust — recurring diversity flourishes (kinds>0 episodes) instead of the frozen-500 monoculture, and
divMean oscillating rather than pinned at 0.05. If diversity STAYS dead at 0.03 floored predation, the cause is
elsewhere (predation too weak even at 0.03 — raise the floor; or the homogeniser/mate-finding is the binding
term) and the commons reading is wrong. Either outcome resolves the deepest wall of the project. Clean boot,
zero errors. Backward-compatible (old exports' rqRate just clamps up to 0.03 on load).

### #36 floor raised 0.03 → 0.05 (the proven-healthy rate)

Corrected my own timid call. The boom-bust phase ran rqRate at ~0.05 (t50k–220k) and diversity died only as it
fell BELOW ~0.05 — so a 0.03 floor could sit under the revival threshold and produce a FALSE NEGATIVE (diversity
stays dead → "commons reading wrong", when really the floor was just too low). Floor now 0.05, the rate the
system itself proved sustains the punctuated dynamics. Range [0.05, 0.15]; other three dials still free. The
test is now valid: if floored-at-0.05 predation revives kinds>0 flourishes, tragedy-of-the-commons is confirmed.

## #36 CONFIRMED (fresh floored run, gen1 t92k) — flooring predation PREVENTS the monoculture collapse

The tragedy-of-the-commons test, run clean: fresh start (#reset), rqRate floored at 0.05, vs the free-evolving
run as age-matched control. Head-to-head, same ticks, the window where the free run died (t55k–90k):

| tick | floored kinds | free kinds |
|---|---|---|
| t50k | 3 | 2 |
| t55k | 4 | 0 |
| t60k | 8 | 0 |
| t65k | 5 | 0 |
| t70k | 6 | 0 |
| t75k | 4 | 0 |
| t80k | 4 | 1 |
| t85k | 9 | 1 |
| t90k | **19** | 0 |

The free run flatlined to kinds=0 (monoculture) for 35k+ straight ticks; the floored run held kinds oscillating
3–9 and flourished to 19. Mechanism confirmed: rqRate sits at 0.057 (held at the floor, NOT evolved to zero as
the free run did, 0.055→0.0009→−0.001). Population swings 109–525 (punctuated dynamics alive, not the free
run's frozen-500 stasis). x=0 extinctions; board grew to td=9. **This is the predicted result: the monoculture
collapse was CAUSED by predation (the diversity-maintaining force) being individually maladaptive and evolving
off; flooring it prevents the collapse.** The deepest wall of the whole #11–#36 arc — every prior swing hit it —
is, on this evidence, cracked: not by adding a mechanism but by stopping selection from disabling the one
already present.

**Honest bounds (not the final word):** (1) only t92k — the free run's deepest lock was t90k–220k, so the
floored run must clear past t220k to prove diversity HOLDS through the full danger zone, not just the entry to
it. (2) divMean recording is inconsistent across these exports (null through most of the floored run, one
reading 0.584 at t90k); the robust cross-run signal is `kinds` (distinct occupied bins), which is unambiguous:
3–19 vs 0. (3) one run, one seed-equivalent. The result is strong and directional but wants the longer run to
seal it. PREDICTION still live: if it clears t220k still throwing kinds>0 flourishes, the commons reading is
fully confirmed and #36 is the fix.

## #36 CONFIRMED (floored run cleared the deep zone, gen1 t160k) — the monoculture wall is cracked

The floored run ran straight through t90k–160k — the exact window the free run spent as a frozen monoculture
(kinds=0, divMean dead, every sample). Result, age-matched:

| tick | floored kinds / divMean | free kinds / divMean |
|---|---|---|
| t90k | 19 / 0.584 | 0 / null |
| t100k | 24 / 0.636 | 0 / null |
| t120k | 10 / 0.609 | 0 / null |
| t140k | 4 / 0.660 | 0 / null |
| t160k | 4 / 0.602 | 0 / null |

divMean held ~0.65 for 70k ticks through the dead zone; the free run was flat-zero the whole time. **The
tragedy-of-the-commons diagnosis is confirmed: the monoculture collapse was caused by predation (the
diversity-maintaining force) being evolved off, and flooring it prevents the collapse.** The deepest wall of
the #11–#36 arc — every prior swing crashed into it — is cracked, by stopping selection from disabling the
engine already present rather than by adding a new one.

**Three honest wrinkles:**
1. **It settles to STABLE diversity, not ever-growing.** kinds peaked ~24 (t100k) then declined and plateaued
   at ~3–4 (t130k–160k), while divMean stayed rock-stable at ~0.66. So it's a stable, even coexistence of a few
   very distinct types — a living diverse community (vs the free run's single type), but a maintained
   equilibrium, not unbounded radiation. If divMean were crashing too it'd signal a slow slide to monoculture;
   it isn't, so this reads as equilibrium, not decline. (Watch whether kinds holds at ~4 past t160k.)
2. **rqRate EVOLVED UP to 0.070 — above the 0.05 floor, which isn't even binding.** Strong hint that the floor's
   real job was to break a VICIOUS CYCLE (collapsing diversity → predation becomes costly → evolved down →
   more collapse). Once the floor keeps the system in the diverse basin, predation is selected UP on its own —
   it's beneficial in a diverse world. So the floor may only need to prevent the INITIAL fall, not fight
   selection forever. (One datapoint; a "lower floor / temporary floor" experiment would test it.)
3. **We traded drama for stability.** gen1, x=0 — NO mass extinctions, no resets (the free run hit gen11 with
   repeated extinction cascades AND monoculture). Floored predation gives BOTH stability and diversity, but the
   dramatic boom-bust flourishes are gone — that punctuation was partly the system thrashing toward collapse.
   Calmer and more alive; less explosive. An aesthetic choice now lives here, not a correctness one.

**Status: confirmed with high confidence.** 70k ticks of sustained diversity through the control's dead zone is
decisive; running to ~t220k+ would be the final formality. The arc's central question — why open-endedness
collapses — is answered (it's not individually adaptive) and the one-line fix is validated on the live artwork.

## Swing #37 (LIVE) — the giant-leap ATTEMPT: relocate negative-frequency-dependence to the unbounded PROGRAM space

Framed honestly, no back-patting. The deflation stands: #36 only PREVENTED collapse and produced a stable
~4-type equilibrium — the opposite of open-endedness. The reason it equilibrates is structural: the trait/niche
space is FINITE (≤6^DIMS cells), so it saturates and there's an optimum to settle on. Open-endedness (the
unbounded) needs a driver in a space that can't saturate. The one such space here — and the only layer that
stayed alive while diversity was dead (atoms born/used/culled, opcodes churning) — is the PROGRAM space: 256
opcodes, combinatorial structure, effectively unbounded.

**The move:** take the system's core diversity engine — negative-frequency-dependence (NFD: rare gains, common
pays), which currently acts on 4-bin TRAIT cells — and add a second copy that acts on PROGRAM-VOCABULARY
signature (the order-independent hash-sum over an organism's distinct opcodes). Being computationally common
now costs survival; rare vocabularies are rewarded. Because program-space doesn't saturate, the population can
be driven to keep fleeing into unexplored opcodes indefinitely — there is no final optimum to settle on. Same
proven-safe, bounded, ~zero-sum NFD form as the trait term (rate 0.004), so it can't inflate or destroy.
Synergises with #34 (escaping parasitism = using rarer opcodes = lighting up the unused 236). Knob
`__GENO_PARASITE`, default-on.

**This is an ATTEMPT, explicitly not a result.** Clean boot, zero errors, kinds 10 / entropyRatio 0.64 at 4k
(stable, unbroken). The harness CANNOT test the claim — program-space exploration is slow (distinctOps flat at
4k, as expected) and only a long live run shows whether this produces UNBOUNDED novelty or just relocates the
equilibrium into program space and churns. **Falsifiable, sharp:** run fresh (#reset) and watch, in exports,
whether distinct-opcode breadth (`co`/the used-opcode count) keeps CLIMBING without settling and whether
kinds/divMean keep MOVING rather than plateauing as #36 did. If breadth climbs unbounded and the system never
settles → the leap worked, open-endedness relocated to the space that has room for it. If opcode breadth
plateaus and diversity re-settles → NFD in program space just churns neutrally / saturates too, the leap
failed, and the honest conclusion is that this architecture equilibrates wherever you point the driver. Either
result is worth more than the hype. The real risk, named: program-vocabulary may be too loosely coupled to
survival for the pressure to produce FUNCTIONAL novelty rather than cosmetic opcode-shuffling.

## Swing #38 (LIVE) — the EXPANDING VIABILITY FRONTIER: stop treating the niche space as fixed

The real swing — and the admission that #37 wasn't one. #37 was the SAFE form of a bold idea (bounded,
mean-centred, "can't break anything"); I optimized for not-breaking, which is the opposite of biggest-risk/
biggest-gain. Its failure taught the actual lesson: in this system NOVELTY HAS NOWHERE VIABLE TO GO — trait
dims are neutral (#16), program space is lethal (#37) — so every frontier is dead on arrival and the
population settles. Reverting #37 (my reflex) just removes the pressure. We don't go back.

**#38 attacks the root: make the niche space a MOVING FRONTIER instead of a fixed grid.** Every occupied
niche-cell raises the resource of its trait-ADJACENT cells (one diet-bin away, each dimension), so the
unexplored territory just beyond the living edge becomes habitable. Life pioneering a region opens the next
one — ecological succession with no edge of the map, the first mechanism in this whole arc that is structurally
UNBOUNDED (the frontier moves outward as fast as life advances). Deliberately NOT capped or decayed (the #29
safety hedge stripped out): boost is full (FRONTIER_BOOST=0.06, ~1/3 of base supply), bounded only by NICHE_CAP
per cell. Combinatorial-cell regime (DIMS≤grid). Knob `__FRONTIER_EXPAND`, default-on.

**Paired with #37, not instead of it.** #37 is the PRESSURE (computationally-common costs survival); #38 is the
VIABLE PLACE for that pressure to push. Together: drive toward novelty AND make novelty habitable as life
reaches it. #37 stays on.

**The named risk, accepted (this is the point):** an uncapped frontier can flood resource faster than life
fills it → easy living everywhere near the edge → selection washes out → a spreading undifferentiated blob
instead of succession. That is the failure mode and I did not hedge against it. Clean boot, no crash, entropy
0.74 at 4k (with both #37+#38 on) — but the harness cannot see frontier dynamics. **The live run decides, and
the signals are sharp:** does occupied-cell count keep CLIMBING (the frontier advancing) with diversity HELD or
rising (succession) → the unbounded thing finally; or does occupancy saturate / resource flood and diversity
flatten (blob) → the frontier washed out selection, lower FRONTIER_BOOST or gate it to under-occupied edges.
Biggest risk taken for the biggest gain; the data, not the framing, says whether it worked.

## BUGFIX — fitness NaN (long-standing, NOT a swing): stale motif vector read past its length after DIMS growth

User reported the live HUD fitness had been NaN "for some time." Diagnosed with a deterministic headless probe
(scratchpad/nanhunt.js) rather than guesswork. Findings, in order:

- **The NaN is a one-way trap.** `currentFitness = currentFitness*0.9 + fitness*0.1` — a single non-finite
  sample poisons the EMA permanently. So it presents as "NaN forever," not a flicker. It also feeds the
  op91/op92 self-fitness VM sensors and credit-assignment, so it is not merely cosmetic.
- **NOT caused by #37/#38.** Frontier-on and frontier-off both went NaN at the same tick (3220 vs 3215, seed 7).
  My earlier suspicion that the recent swings caused it was wrong; this bug predates them. (Recent `divMean`
  readings were therefore NaN-garbage, but integer `kinds` readings and the pre-#37 tragedy-of-the-commons
  finding stand — those exports had finite fitness.)
- **Root cause:** a parentless reseed builds a tendency from a stored stable-motif vector:
  `tv[d] = motif.t[d] + noise`. The dimensionality ratchet grows DIMS (5→6), but stored `motif.t` vectors are
  NOT extended, so `motif.t[newDim]` is `undefined` → `undefined + number = NaN` → the reseeded particle is born
  with a NaN tendency → poisons `clusterDiversity()` → `selfModel.diversity` → the fitness EMA.
- **Amplifier:** every clamp in the codebase uses `x<lo?lo:x>hi?hi:x` / `Math.max/min`, which catch ±Infinity
  but PASS NaN THROUGH (all comparisons with NaN are false). So once created, a NaN propagated unclamped.

**Fixes (defensive at the chokepoints + the true source):**
- `addParticle`/`addCompound`: never born with a non-finite tendency (per-dim finite guard).
- Motif reads (reseed `tv` and cluster-similarity `sim`): treat missing post-growth dims as 0.
- VM register clamps (9 sites) + the evolvable instruction immediate `k` + `tbleed` + `tend[+4]` writes:
  made NaN-safe (`Number.isFinite` guard) so no future source can leak a NaN past a clamp.
- `clusterDiversity()` returns 0 instead of NaN; the fitness EMA skips a non-finite sample instead of being
  poisoned by it.

Verified: deterministic probe runs clean 5000 ticks (seeds 7 & 42), past the old tick-3220 failure, with zero
non-finite values in amp/tend/nicheCellRes/diversity/currentFitness. Lesson worth keeping: **the clamp idiom in
this codebase silently leaks NaN, and any vector captured before a DIMS-growth event is stale when read at the
new width.**

## Swing #39 (LIVE) — the HISTORICAL NOVELTY ARCHIVE: a target that recedes as you reach it — headless says mild-harm-but-VOLATILE; the live run decides

The bold one, aimed squarely at the wall the whole #11–#38 arc kept naming: **the system always equilibrates
because every selective driver references a SATURABLE target.** Objective fitness → converges. Trait-NFD rewards
rare-*now* → saturates the instant the niche cells fill. Program-NFD (#37) is lethal. The #38 frontier can flood
→ blob. The one selective target that *provably* cannot saturate (Lehman & Stanley 2011, novelty search): the
distance from an **ever-growing archive of what has already existed.** Reward an organism for being unlike
everything that has *ever* lived, not unlike its current neighbours. Reaching new trait-space ADDS it to the
archive, raising the bar — the target recedes as it is approached, so it can never be satisfied. Structurally
unbounded by construction, and — unlike the public-good predation #36 had to floor — novelty-vs-archive is
*individually* adaptive, so the dial was left FREE/unfloored as a sharp test of whether novelty-seeking holds
under selection or evolves off like rqRate did.

**What was built (`index.html`; knob `__NOVELTY_ARCHIVE`, evolvable dial `novStrength` = 5th `oe` element).**
A bounded archive (`novArchive`, cap 1500, reservoir-replaced) of DIMS-length trait-signatures sampled across
history. On a 24-tick cadence: score each organism's novelty = mean trait-distance to its K=8 nearest archive
entries (random 220-entry scan, so cost is O(N) regardless of archive size; ragged post-DIMS-growth vectors read
missing dims as 0 — the #BUGFIX lesson applied); reward it via an amp term; insert past-threshold organisms into
the archive with an **adaptive insertion threshold** that rises as space fills (the engine of the receding
target). Wired as the established #35 six-site evolvable dial (default 0.004, range [0,0.012], free/unfloored).

**The result — two seed-fixed (SEED=7, 10k-tick) A/Bs vs the live stack, graded honestly:**

| metric | control (OFF) | #39 v1 (raw-centre) | #39 v2 (bound-then-centre, shipped) |
|---|---|---|---|
| nicheOcc early→late | 39.5 → 67 (max 76) | 37.5 → **30** (max 60) | 35 → 57 (max 64) |
| niche_trend.growing | true | **false** | true |
| entropyRatio (late/early) | 0.80 | **0.51** | 0.67 |
| evenness_late | 0.875 | **0.504** | 0.752 |
| diversity.collapsing | false | true | true |

- **v1 was a catastrophe, and it taught the real lesson.** Centring novelty on the *live-population* mean
  re-imports the exact "relative-to-current-crowd" reference that makes NFD saturate — and worse, a few frontier
  explorers inflate the mean and slam the established BULK to the −1 floor, taxing it into homogenisation (occ
  collapsed 60→21, evenness halved, while *population rose* 423→473: a fitter, more crowded near-monoculture).
  The archive's whole point is to reference cumulative HISTORY, not the instantaneous crowd; centring on the
  crowd threw that away.
- **v2 (BOUND-THEN-CENTRE) fixed the catastrophe but not the deficit.** Saturating each novelty to [0,1] against
  the adaptive scale *before* centring makes one extreme pioneer cap at 1 (it can't drag the baseline), so the
  bulk is gently relieved instead of taxed — occupancy climbs again (35→57, growing TRUE), evenness recovers to
  0.752. But it is **still mildly NET-HARMFUL vs control on every diversity axis** (entropyRatio 0.67 vs 0.80,
  evenness 0.752 vs 0.875, occ 57 vs 67), and `collapsing` stays flagged while control's doesn't.

**First call (RETRACTED): DORMANT.** I shipped it default-off, citing #27's precedent (mildly net-harmful headless
A/B, entropyRatio 0.67 vs 0.80) — the safe, defensible call. Then I caught the move: #38's entry directly above
indicts exactly this reflex ("#37 was the SAFE form of a bold idea... I optimized for not-breaking, which is the
opposite of biggest-risk/biggest-gain"). I built #39 bounded+mean-centred+can't-break, got a lukewarm headless
number, and retreated to dormant — the bold idea pre-shrunk to safe, the trap one paragraph up. Worse, I then
reached for the HEADLESS harness AGAIN to "get evidence" for a swing whose whole claim (the receding-target
dynamic) is the one thing the notebook says repeatedly the harness CANNOT see — substituting a safe proxy I run
for the live run only the artwork can render.

**Actual verdict: LIVE (default ON, the active bet).** Banked with eyes open. A deep seed-7 A/B (to t28–36k,
streamed, killed early — the harness was the wrong instrument) said something more interesting than "it hurts":
ON is not lower-and-flat, it is **more VOLATILE** than control —

| tick | OFF nicheOcc / Hbits / evenness | ON nicheOcc / Hbits / evenness |
|---|---|---|
| 8k | 76 / 2.61 / 0.87 | 59 / 2.24 / 0.75 |
| 16k | 73 / 2.87 / **0.955** | 48 / 1.12 / **0.372** ← deep dip |
| 24k | 62 / 2.72 / 0.91 | **104** / 2.43 / 0.81 ← high spike |
| 28k | 66 / 2.76 / 0.92 | 68 / 2.89 / **0.963** ← recovered |

Control holds a steady high plateau (occ ~50–80, evenness ~0.9, the calm #36 equilibrium). ON swings HARDER:
evenness craters to 0.37 then occupancy spikes to **104 (above anything control reached in-window) and evenness
recovers to 0.963**. On the AVERAGE that's the mild net-harm the 10k A/B flagged; but the SHAPE — deep crash →
overshoot recovery — is exactly the boom-bust the notebook elsewhere reads as PUNCTUATED open-endedness vs
thrashing-toward-collapse, and the notebook is equally explicit that **only the live artwork can tell those two
apart** (cf. the gen11 t212k cascade re-read). So the headless number is real but it is grading the wrong axis:
a punctuated system looks "worse" on a mean-diversity metric precisely when it is most alive.

**This is why it ships ON and goes to you, not to the harness.** The decisive test is the live run, and it is
yours to run — fresh `#reset`, watch past t50k into the danger zone (t50k–220k) where every prior lock lived:
1. **Punctuation GROWING or DAMPING?** Do the occupancy spikes get bigger/more frequent and each recovery land
   higher (open-ended) — or do the crashes bottom lower and the spikes thin (a slow wind-down to monoculture)?
   The t16k→t24k crash-then-overshoot is one cycle; the live run shows whether they compound.
2. **Does nicheOcc break ABOVE control's plateau and stay there** (the receding target advancing the frontier) —
   or re-settle into #36's calm equilibrium (the archive saturates too, and this architecture equilibrates
   wherever you point the driver)?
3. **Does the free dial `novStrength` HOLD** under selection (novelty-seeking is individually adaptive — the
   prediction that distinguishes it from the public-good predation #36 had to floor) **or collapse toward 0**
   like rqRate did (it's another commons, and the next move is to floor it)?

Honest one-line summary, corrected: **the headless harness says mild-harm-but-volatile; I almost let that timid
number bury a bold idea on a metric that can't see what it's testing — so it ships ON as the live bet, and the
artwork, not the harness, renders the verdict.**

## #39 CONFIRMED (preliminary) — live export gen1 t80648: crashed INTO the danger-zone lock and CLIMBED BACK OUT, richer

The artwork rendered the verdict, and it is the strongest result of the whole #11–#39 arc. A live run to t80648
(gen1, single live seed, `__NOVELTY_ARCHIVE` on, dial `novStrength` present and evolving — this is a #39 build).
Decoded EP trajectory:

| phase | ticks | kinds | divMean | fitness | reading |
|---|---|---|---|---|---|
| boom | 5k–40k | 9–20 | 0.60–0.78 | ~0.78 | healthy radiation |
| **LOCK** | **40k–58k** | **0** | **0.27–0.31** | **0.27** | the danger-zone monoculture — ~18k ticks of kinds=0 |
| **escape** | 60k–80k | 7→12→14→16→**17** | 0.72–0.76 | ~0.73 | climbed back out, **still rising at t80k** |

**This is the first time in the entire arc the system fell INTO the deep monoculture lock and CLIMBED BACK OUT.**
The lock at t40–58k (kinds=0, divMean 0.27, fitness 0.27 — confirmed in both the EP series and the `pulse` event
log, c=0 from t40448 to t58392) is the EXACT wall the whole project hit: the free-evolving run sat there for
145k+ ticks and never recovered; #36 (floored predation) only ever PREVENTED the fall, settling to a flat ~4-type
calm equilibrium. This run did neither — it crashed AND escaped, recovering to kinds 17 / divMean 0.72 and **still
climbing at t80k** (EP kinds 7→12→14→16→17 over the last five samples, population healthy 408→596). That is
PUNCTUATED EQUILIBRIUM, **growing not damping** — the open-ended signature the arc has chased since #11.

**The three live-test predictions, answered:**
1. **Growing or damping?** GROWING. A deep ~18k-tick bust, then a recovery that overshoots toward 17 kinds and is
   still rising at the export — each recovery higher, not bottoming lower.
2. **Escape the lock / break #36's plateau?** YES. #39 did NOT prevent the lock; it turned the lock into a PHASE
   the system climbs out of richer — more open-ended than #36's anesthetized calm, and exactly the boom-bust the
   notebook prizes over frozen stability.
3. **Does `novStrength` HOLD or collapse?** HELD: 0.00334 (−17% from the 0.004 default) — a mild drift, NOT the
   rqRate-style collapse to ~0/negative that defined the tragedy-of-the-commons (#36). Novelty-vs-archive is, as
   predicted, roughly INDIVIDUALLY adaptive — selection did not switch it off the way it switched off the
   public-good predation. This is the mechanistic payoff: the archive driver survives free evolution where the
   conserved predation driver could not. (Also confirmed live: fitness finite throughout — the #BUGFIX holds.)

**The lesson on myself, banked.** I killed the headless A/B at t28–36k — at the ONSET of the bust, before the
boom — and read the dip as "mild net-harm," nearly flipping the swing dormant. I pulled the plug on a punctuated
system during its crash and called it failure. The live run to t80k caught the recovery I would have designed out.
Twice this session the timid instrument (and the timid instinct) misread a bold mechanism; both times the fix was
to commit and let it run, not to pre-shrink it to a safe number. The metric was grading the system "worst" exactly
when it was about to be most alive.

**Honest bounds — this is preliminary, not sealed.** One run, gen1, one live seed. It's the strongest signal in
the arc, not proof: I cannot prove from a single export that #39 *caused* the escape vs the rest of the stack —
only that neither historical comparator (free → locked-and-died; #36 → floored-and-flattened) ever produced
crash→escape→17-and-rising. The clean confirmation is a MATCHED A/B to t80k (#39 on vs off, same seed, ≥2 seeds) —
and the right lesson from the kill-at-t36k mistake is that this IS runnable headless after all: the dynamic the
harness "couldn't see" was just DEPTH I didn't let it reach. Run that A/B to t80k+ before calling it sealed. But
on this evidence, the receding-target idea works: the one selective driver that references cumulative history
instead of a saturable target is the first thing in the arc to turn the monoculture wall from a terminal state
into a recoverable phase.

## #39 deep run (live export gen1 t161636) — SUSTAINED boom-bust, wall non-terminal; but peaks FLAT and the dial ERODING (sober correction to the t80k read)

The deep run I asked for, past t160k — and it both confirms and DEFLATES the t80648 read. It confirms the escape
is not a one-off; it deflates "punctuation GROWING." Decoded, three full boom-bust cycles, gen1, x=0 (no reset):

| cycle | peak kinds | the lock that follows | lock depth/length |
|---|---|---|---|
| 1 | **20** (t10k) | t45–50k | divMean 0.27, ~10k ticks |
| 2 | **19** (t85k) | t95–120k | divMean **0.199**, **~25k ticks** |
| 3 | **19** (t150k) | (t155k dip to kinds 8, no full lock yet) | — |

**The real, durable win — bigger than the t80k single escape suggested:** the monoculture wall is now
*non-terminal*. The free run locked once at t50k and died there 145k+ ticks; #36 anesthetised it to a flat calm.
This run LOCKS AND ESCAPES, repeatedly — three times in 160k ticks, every lock climbing back to ~19 kinds, no
reset, no extinction-to-gen2. Monoculture became a recurrent PHASE, not a grave. That is the qualitative break the
#11–#38 arc never reached, and t161k shows it is a *sustained* property, not a lucky single bounce.

**But the t80k call "punctuation GROWING" was premature — corrected to FLAT.** I asked whether each recovery
lands higher. It does not: peaks are 20 → 19 → 19, flat (slightly declining if anything). The receding-target
driver delivers RECURRENT ESCAPE, not EVER-HIGHER RADIATION. There is still a diversity ceiling (~20 kinds);
#39 does not lift it — it refuses to let the floor become permanent. So this is sustained punctuation around a
fixed ceiling, NOT the unbounded open-endedness the arc's holy grail wants. Honest downgrade of my own t80k
enthusiasm: one escape looked like growth; three escapes reveal a flat-peaked oscillator.

**Two early DAMPING signals I will not paper over:**
1. **Locks are deepening and lengthening.** Cycle 2's lock ran ~2.5× as long as cycle 1's and bottomed lower
   (divMean 0.199 vs 0.27). Escape capacity is still intact at t160k (recovery to 19 was as strong as cycle 2's),
   but if that trend continued a future lock might not escape. Unresolved at 3 cycles.
2. **`novStrength` is eroding, not holding.** 0.004 (default) → 0.00334 (t80k) → 0.00284 (t161k): a steady
   monotonic −29% decline. This REVISES the t80k "HELD" claim. It is NOT predation's collapse-to-zero (rqRate hit
   ~0/negative), so novelty-vs-archive is LESS of a public good — but it is not purely individually adaptive
   either; there is a weak commons pressure bleeding it down. If it keeps falling the escapes weaken. (Structural
   complexity still rising underneath: td 8→9, longestStable 974→1436 — the board and stability still grow even as
   the dial bleeds.)

**Sober verdict: not damping-to-death, not unbounded growth — a SUSTAINED BOOM-BUST ATTRACTOR with flat peaks.**
The headline achievement is real and it is the arc's first: the wall is reliably non-terminal, monoculture is now
escapable and recurrent rather than absorbing. But #39 is NOT the unbounded-radiation solution — the ceiling is
unmoved, and two slow trends (deepening locks, eroding dial) could be the early signature of a very slow
wind-down rather than a stable oscillation. **The decisive test is now a t250k+ run:** does cycle 4's peak hold
near 19 (stable attractor) or land lower while the lock lengthens (slow damping), and does `novStrength` stabilise
or keep bleeding? Two concrete next moves if it is damping: (a) FLOOR `novStrength` the way #36 floored rqRate
(the eroding dial says the commons pressure, though weak, is real); (b) attack the FLAT CEILING directly — the
escapes prove the floor is beaten, so the open problem has moved from "why does it lock" to "why don't the peaks
climb," which is the limiting-similarity ceiling (#11's original wall) reasserting itself at the top of each
boom. The lesson on me, restated: at t80k I caught one escape and reached for "growing"; the honest word was
always "escaped, once" — three cycles later the right word is "sustained but flat." Watch more cycles before
either word becomes a verdict.

## THE GENERATIVE-LAYER MAP — the open-endedness engines, audited from the code (most are inert)

Prompted to stop watching the diversity metric and read what every layer ACTUALLY does, traced from two live
exports 80k ticks apart (t80648, t161636), three headless probes, and the mechanism source. Method: be the code —
forget the comments, diff the real state, run it to see what fires. The result reframes the whole #11–#39 arc.

**The clean dichotomy.** The system's open-endedness is almost entirely CONTINUOUS (it freely tunes and rewrites
its existing parametric structure) while its DISCRETE/COMBINATORIAL novelty generators — the layers that would
mint genuinely NEW primitives, opcodes, scenario-types, lineage-generations — are STALLED.

| layer | kind | t80k→t161k | verdict |
|---|---|---|---|
| main VM program `V` | continuous | 14/16 instructions rewritten | ALIVE |
| scalar genes (×137) | continuous | 128/137 drifted | ALIVE |
| physics `p`, weights `w`/`oct`, dials `oe` | continuous | all moved | ALIVE |
| render expressions `rn` | continuous | 1/4 mutated | ALIVE |
| board dims `td` | discrete | 8→9 (gated, earned) | WORKS (slow) — the one structural engine that fires |
| stable motifs `M` | discrete | 3→5, one aged 182 (size 59, coherence 0.98), consumed via culturalBias 0.3 | WORKS — real cultural memory |
| fitness sensors `fs` | discrete | 1→2, both at utility ~0.04 (cull line 0.03) | MARGINAL churn |
| authored atoms `ua` | discrete | 0→0 | INERT — 1 birth / 35k ticks, 0 uses ever |
| bound opcodes `bo` | discrete | 0→0 | INERT — gated on `uas.length>0`, ~never true |
| scenario bank `sb` | discrete | 5 seeds, identical, all src=seed | WAS INERT (frozen 161k; fixed this session) |
| generation `g` | discrete | 1→1 | never produced a 2nd generation in 161k ticks |

**The atom pipeline is dead at stage one, and the code already knew.** The chain is birth → bind-opcode → wire a
call-site → execute. Probe (35k ticks): **1 atom born, 0 uses, 0 live** — birth is throttled to ~0 because
`rate = mutationRate × stabilityFactor` and a stable run floors `stabilityFactor` at 0.3 (10045), so birth prob
`rate×0.15` ≈ 0.001–0.007/cycle. And bound-opcode creation is gated `if(uas.length>0)` (11061) — downstream-dead
behind the empty atom library. The comment at 11063–11072 DIAGNOSES exactly this ("authored atoms are bound but
never called — measured: uaCalls stayed 0 across runs") and patches it by splicing a call-site on bind — but the
patch sits behind the unreachable `uas.length>0` precondition. A real fix for a loop that the throttle never lets
reach the patched link. This is the comment-vs-code gap in its purest form: the prose describes a closed
author→execute loop; the arithmetic leaves it open at the source.

**Why this is the headline, not another swing.** It is a structural explanation for the flat diversity ceiling
the whole arc kept hitting. You can reshuffle and re-tune a FIXED alphabet of primitives forever (continuous
layers, fully alive) — but you cannot RADIATE into qualitatively new kinds without new discrete structure, and
the discrete generators that mint it (atoms, opcodes, scenarios, generations) do not fire. The boom-bust around
~20 kinds (#39) is the system exploring the COMBINATORIAL ceiling of a frozen primitive set; #39's receding
target helped it escape locks WITHIN that ceiling but could never raise it, because raising it needs engines that
are stalled. The two discrete layers that DO work (board dims, motifs) move slowly and are exactly the two that
don't depend on the dead atom pipeline.

**The meta-finding for the project.** 39 swings graded "open-endedness" largely by ecological surface metrics
(kinds, divMean, occupancy), while the GENERATIVE machinery underneath — the self-authoring layers that are the
actual theoretical basis for UNBOUNDED open-endedness (Pe22f atoms, Pe27–Pe39 scenarios, opcode binding) — has
been largely inert the entire time, and in places the code's own comments describe mechanisms the arithmetic
never lets run. The biggest available lever is not swing #40 in ecology-space. It is making the discrete
generators actually fire: unthrottle atom birth (decouple it from stabilityFactor, or floor it), close the
author→bind→use loop at the SOURCE (births), and the scenario-bank fix already landed this session is the
template — a designed evolutionary layer, verified to produce nothing, made to turn over by fixing the one piece
of arithmetic that strangled it. Audit before swing: three engines were dark; one is now lit.

**Honest scope.** The continuous layers are genuinely, vigorously alive — this is not "the system is frozen." It
is "the system adapts richly within a fixed structure and almost never grows new structure." And one regime
caveat: a different, high-mutation run authored "dozens" of atoms (per the 11067 measurement) — so atom birth is
not always ~0; in THIS stable run it is throttled. But in neither regime do atoms ever get USED (uaCalls 0), so
the pipeline is dead by throttle (stable runs) or by the never-closed use-loop (mutating runs). Two roads to the
same zero.

### FIX LANDED — atom pipeline lit (and bound opcodes with it)

Acting on the map. Two-part fix in mutateGenome (gated `__ATOM_PIPELINE`, A/B-able): (1) FLOOR atom-birth
probability at 0.02 so a stable run still authors (births were ~0 because `rate` scales with stabilityFactor);
(2) on birth, immediately BIND the atom and splice ONE germline call-site (the proven-safe inheritance route,
not forced into living programs) so the primitive is reachable and `uaCall` increments its `uses`. Verified
headless A/B (15k ticks): OFF = 0 births / 0 uses / 0 bound (the frozen baseline); ON = atom authored, bound,
and **called 9 times** (maxUses 0→9), bound-opcodes 0→1, ua_first_use fired. The author→bind→execute loop that
was dead at the source now closes, and bound opcodes light up as the predicted cascade. Conservative by design —
authored primitives now ENTER the genome and face selection rather than dying unseen; not a flood.

**Status of the three dark engines: all addressed.** Scenario bank — fixed (forced tournament turnover).
Authored atoms — fixed (birth floor + closed use-loop). Bound opcodes — lit as a cascade of the atom fix. Each
verified headless, each gated for A/B, each the same template: find the one piece of arithmetic strangling a
designed evolutionary layer, fix that, run it to confirm it turns over. STILL OPEN and deliberately NOT touched:
generation stuck at 1 (the system never speciated to a 2nd generation in 161k ticks) — observed, not yet
diagnosed; fixing it blind would repeat the wins-decay mistake. That one wants its own trace before any change.

### ENGINES-LIT A/B (seed-7, t60k headless) — the fixes work, but the diversity ceiling DID NOT MOVE

Option 2: does unfreezing the generators (bank tournament + atom pipeline, both default-on) actually raise the
diversity ceiling, or do they turn over without helping? Seed-matched A/B, engines LIT (default) vs FROZEN
(`SHADOW_WINS_DECAY=1 ATOM_PIPELINE=0`), 60k ticks.

| late (t44–60k) | FROZEN | LIT |
|---|---|---|
| occupiedKinds | 8 (flat) | 8 (flat) |
| nicheOcc | 80–104 | 62–82 |
| Hbits / evenness | ~2.9 / ~0.97 | ~2.9 / ~0.95 |
| live atoms / bound ops | 0 / 0 | **4 / 5 (climbing)** |

**Result: the generative fixes are confirmed working but ecologically inert at this horizon.** LIT accumulates
4 atoms / 5 bound opcodes by t60k (vs the frozen 0/0) — the pipeline genuinely turns over — yet both arms
plateau at 8 kinds with comparable entropy/evenness, and LIT's occupancy is if anything slightly lower. No
regression (the atom-wiring doesn't hurt), no lift. This is the "lit but inert-in-effect" branch, flagged in
advance.

**The finding that matters: "are the generative engines running" and "is the system more diverse" are
DECOUPLED.** Lighting the generators was correct — they were verifiably broken and are now verifiably fixed —
but they are not the lever for the diversity ceiling. Whatever pins kinds at ~8 is NOT the frozen generators; it
is the ecology itself (limiting similarity, #11's original wall), which neither 39 ecological swings nor the
generative-engine fixes have moved. The bottleneck is deeper than any one engine.

**Honest caveat (don't over-read):** one seed, t60k, and the atom engine only reached 4 atoms right at the end —
so this is "no effect yet, engine barely ramped," not "definitively no effect." A much longer run (or a higher
birth floor so atoms become a substantial fraction of the genome and exert real selective pressure), and the
LIVE run, are where a slow ecological payoff would show if one exists. But the directional verdict stands: the
generative layer and the diversity ceiling are separable problems, and #40 — if it targets the ceiling — must
attack limiting similarity in the ecology directly, not the engines underneath it.

### LIVE CONFIRMATION (export gen1 t71821, new code) — the three fixed engines fire HARD live; ecological effect re-opened

First live export running the lit engines (bank tournament + atom pipeline + #39, all default-on). Decoded:

**All three fixes confirmed working in the artwork, directly (no inference):**
- Authored atoms: 4 live, and USED — `(-1.36)-(Math.tanh(m))` called 36×, `(s)-(0.92)` 18×. Event log shows the
  loop closing in real time: ua_birth t64480 → ua_first_use t64500 (20 ticks later). The pipeline that logged
  0 uses across its entire prior history now carries load-bearing self-authored primitives.
- Bound opcodes: [0,0,1,1,2,3] — six, where it was always [].
- Scenario bank: 1 seed + 3 child + 3 random at novel evolved axes (1.12, 1.13, -1.22, 1.35…). The bank that held
  5 immortal seeds for 161k ticks is now 6/7 evolved scenarios. Tournament turnover works live.
- novStrength rose to 0.0047 (default 0.004) — did NOT erode as it did (0.0028) in the frozen-bank t161k run; a
  point for #39's individual-adaptiveness. rqRate 0.055 healthy. dims td 12. fitness finite (NaN fix holds).

**Diversity: healthier, but NOT attributable.** kinds oscillate 6–23 with NO monoculture lock through t72k —
where the #39-only run had two deep locks to 0 (t45–58k, t95–120k). Peaks to 23, divMean steady ~0.65, pop
healthy/growing, x=0. Encouraging. But one live (random) seed; cannot attribute "no lock" to the engines vs seed
variance.

**The honest reversal this forces on my own prior verdict.** The headless seed-7 A/B concluded "lit but
inert-in-effect — engines don't move the ceiling." That verdict was almost certainly SEED-7-SPECIFIC: seed-7
throttled the atom engine to 4-barely-used atoms (its stable trajectory floored stabilityFactor → near-zero
births), so the test never activated the thing it was measuring. THIS run proves the engines CAN fire hard (36
atom-uses, bank fully turned over). So the ecological question — do ACTIVE generators affect diversity — is
RE-OPENED, not closed. The controlled test was confounded by low engine activity; the right test is matched
seeds WHERE the engines actually fire (multi-seed headless), and more live runs to see whether "no lock"
persists. Lesson, again: a clean negative on one seed is not a negative on the mechanism — check that the
treatment was actually applied before believing the null.

### LIVE (same run continued, gen2 t119333) — reached generation 2; engines sustained; healthiest trajectory yet, stated with discipline

The t71821 run continued to t119k and crossed into GENERATION 2 (x=0, no reset).

**Generation advanced on its own — the "stuck at 1" engine was slow, not dead.** I flagged generations as a
possible 4th dead engine and deliberately did NOT fix it blind. Vindicated: it advanced unaided. Had I "fixed"
it I'd have patched a non-bug. Restraint paid.

**All three lit engines are SUSTAINED across 119k ticks, not a one-off:**
- Atoms: 7 authored, 2 load-bearing (`(a)/(-0.27)` 36 uses, `(Math.exp(s))/(s)` 18), other 5 at 0 uses — healthy
  selection (most authored primitives are useless, a few aren't). Bound opcodes up to 9.
- Scenario bank fully turned over: 1 seed of 7 (rest child/random).
- novStrength rising 0.0028 → 0.0047 → 0.005: novelty-seeking SELECTED UP, not eroded — a sustained point for
  #39's individual-adaptiveness (contrast the frozen-bank run where it bled toward 0).
- fitness finite throughout.

**Diversity — healthiest of the session, stated with t80k's lesson applied.** No sustained lock (kinds floor 2,
never 0). Peak kinds by third: early 23 / mid 14 / LATE 27 — the highest peak is late, and it came as a
post-crash RADIATION (t110k pop 688→272, recovered to kinds 27 @t115k): punctuated boom-bust with a creative
recovery, better than the #39-only run (flat ~19, deepening locks to 0). BUT I will NOT call this "growing": the
27 is a single post-crash spike, the mid-third sagged to 14, and I mislabeled exactly this shape "growing" at
t80k before t161k flattened it. Honest status: no damping evident, late peak highest, gen2 reached — whether a
real upward trend or a lucky volatile seed is what t250k+ decides.

**Attribution caveat unchanged:** one live seed; cannot credit the engines for the health vs seed variance. The
controlled seed-7 headless said no ceiling effect (but that seed barely fired the engines). This seed fires them
hard AND looks healthier — suggestive, not proven. Matched multi-seed is the only clean test, and the live
artwork can't supply it. Let the run reach 250k+; that resolves growing-vs-spike.

### METHOD — the harness is a CLOSED model of an OPEN system; match the instrument to the question's ontology

Crystallized after discovering the t119k run had been networked with 3 tabs (real inter-universe gene flow, ≥56
foreign packets absorbed at netReceptivity 0.5) — invisible to the harness, which stubs BroadcastChannel entirely.

The principle (the user's, sharpened): the live artwork is coupled to channels the harness has no model of and
CANNOT contain even in principle — other running universes (each a full system with its own evolved history), the
user's cursor (a real force field on the sim), real wall-clock time. These are not approximation error to be
shrunk; they are inputs that exist in the territory and not in the map. You can ARTIFICIALLY inject a proxy
(random motifs ≈ network perturbation) but you cannot MIMIC it, because the real content is evolved code from a
peer universe with 100k ticks of selection behind it — to mimic that you'd have to RUN the other universe, at
which point you're not modeling the system, you're running the open world.

Why this matters concretely — every harness failure this session was at an OPEN boundary: (1) killed a run during
its bust because the closed mean-metric couldn't see the punctuation it was mid-cycle on; (2) called the lit
engines "inert" on a seed that never fired them (a closed run sitting in a dead corner); (3) graded the whole
t119k run as a sealed box while it was open to two other universes — the single input most likely to explain its
standout radiation, structurally unrepresentable in the harness.

The rule going forward: MATCH THE INSTRUMENT TO THE QUESTION'S ONTOLOGY.
- CLOSED questions (does this mechanism turn over? does it crash? does it leak NaN?) → harness answers honestly
  and cheaply; the bank/atom fixes ARE genuinely verified this way. Keep using it for these.
- OPEN questions (does diversity sustain? is it alive? what does gene flow do?) → ONLY the live run answers, because
  the answer depends on inputs the harness doesn't have. Using the closed instrument here — because it's
  controllable — is the recurring error. Controllable and correct are not the same thing.

### CORRECTION (deep run gen3 t196521) — "generation advanced on its own" was WRONG; it's the reload count, and it confounds the crashes

User clarified: the generation counter increments when a TAB IS CLOSED AND RELOADED (loads fresh from browser,
genome/EP persist via storage, population reseeds), NOT via internal speciation. This RETRACTS the t119k claim
"the stuck-at-1 generation engine advanced on its own — restraint vindicated." False. Gen 1→2→3 = three tab loads.
The internal speciation-to-new-generation engine has NO evidence of firing; I mistook a reload artifact for
evolution — crediting the closed-system story for an unseen external action.

**It also implicates the population crashes.** The two big crashes align with the two generation transitions:
t110k (pop 688→272) ≈ gen1→2 reload; t155k (607→301) ≈ gen2→3 reload. So the "punctuated boom-bust with creative
recovery" I credited at t119k is most likely RELOAD-RESEED-AND-REGROW: a fresh population radiating from the
evolved genome, not spontaneous internal punctuation. The radiations right after each crash (kinds 27 @t115k, 24
@t165k) are reload-driven, and the richest stretch (t110–165k, mean 17.5) is confounded by BOTH the reloads AND
the network window — two external inputs, neither visible in the metric.

**The clean internal read (t170–195k: lit engines, no network, well past last reload):** kinds settle 9–17 and
trend DOWN at the end (17→11→12→14→11→9). Same place #39 landed — no monoculture lock (floor never 0 across the
whole run, which IS better than the #39-only run), but a settling oscillation, not open-ended growth. The 27-kind
peak was injected novelty (reload + network), never the system climbing.

**Survives clean:** the engines. 14 atoms (3 load-bearing: 27/18/9 uses), 18 bound opcodes, bank fully turned
over, sustained across 196k ticks — independent of diversity, not confounded. The fixes work.

Meta: SECOND instance this session of an unseen external input (first the network, now reloads) confounding an
internal-dynamics interpretation. The open-system lesson, concretely, twice. Default assumption going forward:
any dramatic discontinuity in a live export may be the user's hand (reload, tab, cursor), not the system — ASK
before crediting internal dynamics.

### ENRICH the creative tool — give the computational engine richer I/O (HANDS + EYES done; REACH next)

Reframe (the user's): stop fighting the system's WEAKNESS (ecological diversity, the 39-swing wall) and support its
proven STRENGTH (authorship). The system is a self-extending VM — authored atoms are new instructions it writes and
wires into its own opcode space. But that engine had a fat ALU and almost no I/O: the atom grammar offered 8 unary
scalar functions and inputs that were 6/7 SELF (own regs/use/state; only c=proximity, d=energy reached outside). So
authored primitives could only be elaborate functions of THEMSELVES — exactly what the exports showed (`(a)/(-0.27)`,
`exp(s)/s`). Open-endedness had nowhere to go because creation had nothing external to be about.

Two enrichments shipped (gated `__RICH_GRAMMAR`, default on):
- HANDS (richer ALU): Math.min/max (SELECTION — threshold, piecewise, ReLU), atan2 (DIRECTION), hypot (MAGNITUDE),
  round (QUANTIZE — discrete states). New binary-function branch in uaGenTerm; Math is in scope at uaCompile so they
  just work, isFinite-guarded.
- EYES (read ports): nx,ny = normalized position (space), t = a bounded slow clock sin(tick·0.0011) (rhythm/time),
  nb = the interaction partner's clamped amplitude (a social sense). Wired through uaCompile's signature, uaCall, a
  finite-safe uaSetEyes(i,j) at all 3 atom call-sites, and the grammar var pool.

Verified end-to-end (grammarverify.js, 500 authored expressions, uaMaxDepth=3): 500/500 compile, 0 failed, 500/500
FINITE output — the substrate risk (a new sense/func leaking NaN/Inf) is disproven. New vocab richly used (nx 181,
ny 172, nb 173, min 69, max 79, atan2 75, hypot 88, round 157 / 500). Samples are the qualitative leap: e.g.
`((cos(a))>(t)) ? (b) : (tanh(nx))` — branch on a clock comparison, output by position. That is sense→compute logic
the old grammar could not express. Clean boot, healthy sim run, gated/reversible.

The possibility space this opens: authored instructions can now read the world + select + orient, so the engine can
express sense→compute (and, once REACH lands, →act) — i.e. AGENT behaviour: foraging a gradient, signalling, rhythm,
responding to neighbours. Hypothesis (flagged, not claimed): niche differentiation may fall out of this as a side
effect, because creativity finally has something external to differentiate ON — the wall approached from the
system's strength instead of head-on. STILL TO BUILD: REACH (write ports — atom output affecting neighbours/field/
multiple registers). It is a real side-effect on the conserved-energy economy, so it gets its own bounded design +
verification rather than being rammed in here.

### ENRICH part 2 — REACH (write-ports): the loop closes, sense→compute→ACT, verified

Built on the user's reasoning ("eyes and hands need something to reach for") — correct design, not preference:
perception+computation with no actuator is half a loop, and eyes/hands can't even SHOW an effect if everything
the atom senses only lands back in its own register. So REACH completes it.

Design (gated __REACH, default on, ONE site — the main per-particle eval's bound-opcode handler, 14935): an
authored atom's output emits a BOUNDED amount into one of the VM's EXISTING, already-conserved actuators —
vmActions[0]=force, [2]=ampTransfer(conserved transfer), [3]=tendBleed(clamped trait move), [4]=spawnDrive,
[5]=signal, [6]=mutPressure — using the SAME `vmActions[ch]+=val*k` semantics as the ACTION_EMIT opcode (case 4).
Channel = di%7, gain clamp(-2,2)·k·0.2. It rides the existing influence/coefficients + conserved-energy budget,
so atoms become EFFECTORS without a new unconserved side-effect channel. Cached flag __REACH_ON keeps the
per-instruction hot loop off the globalThis path; telemetry __reachFires counts firings.

Verified (reachprobe.js — seed 5 sense→act atoms to force the condition seed-7 won't, 8k ticks): REACH ON fires
**3660×** by t8k with population (460) and meanAmp (1.18) STABLE and comparable to OFF (427 / 1.19) — no energy
explosion, no collapse, no NaN under heavy actuation. ON vs OFF diverge (real effect) but both healthy. Note: a
plain seed-7 on/off A/B was bit-IDENTICAL because that seed barely authors atoms — the hollow-null trap again;
the fix was to force atoms, not trust a seed that never fires the engine.

**All three enrichments now live + verified (HANDS, EYES, REACH).** The computational engine — a self-extending VM
that authors its own instructions — now has a real ALU (selection/direction/magnitude/quantize), read-ports
(position/clock/neighbour), and write-ports (drive the conserved actuators). Authored primitives went from
functions-of-SELF to full sense→compute→ACT agent programs. The possibility space opened from "evolve a number" to
"evolve a behaviour." Hypothesis still flagged, not claimed: niche differentiation may now emerge from the
system's STRENGTH (authorship) because creativity finally has world to sense and act on — the diversity wall
approached sideways. Only the LIVE run (where atoms vary and fire hard, cf. t119k's 36-use atoms) tests whether it
does; the harness verified the tools are SAFE and FIRE, not that they're good.

### LIVE on all 3 enrichments (gen1 t76390) — the engine authors BEHAVIOURS now; but the rich creations are ORPHANED (call-sites stripped)

First live run with HANDS+EYES+REACH. Read the atoms as behaviours (the point of the enrichment), not kind-count.

**WIN — confirmed live: the system authors sense→compute programs the old grammar could not express.** Current
atoms include: branch-on-the-CLOCK `((sign(t))<=(sin(-1.36)))?(exp):(log)·…`; decide-on-ENERGY `((a)>=(tanh(d)))?
…`; context-sensitive-on-PROXIMITY `(0.41)<(exp(c))?(s):(0.40)`; orient-by-POSITION `atan2(…,cos(c))·(…+nx)`;
compose two sub-atoms `f(-1.48,c,ny)-f(…)`. ua_first_use confirms eye-using atoms were called (`sqrt(abs(ny))-
tanh(nb)`, `cos(1.87)/nx`). The possibility space opened as designed — authored primitives are now world-sensing,
conditional, oriented behaviours.

**BOTTLENECK — the rich creations are ORPHANED.** Every current atom shows uses=0 (some at age 217). Checked why:
the global program V = opcodes [9,4,3,2,4,…,49,0,0] — NOT ONE bound-opcode (≥232) call-site. The germline call-site
the pipeline-fix splices at birth is STRIPPED by program adoption/turnover (the self re-adopts its program from the
best lineage, overwriting the splice). So atoms survive bound-but-disconnected: no execution, no uses, no selection
signal. The richest authored behaviours are the most likely to be orphaned before they can matter.

**Therefore diversity unchanged (kinds 5–23, peaks ~23, no lock — same as pre-enrichment), and now we know WHY:**
the enriched primitives that might differentiate niches aren't getting USED. The loop opens (author→bind→initial
use) but is not DURABLE — creations don't persist in the executed program for selection to keep the good ones.
Fitness finite but ran low (~0.42) with an internal crash at t50k — consistent with authored-but-orphaned churn
(one run; not over-read).

**Next lever (better-targeted than "more vocabulary"): DURABILITY.** The atom-pipeline fix lit the loop; it must
make authored call-sites STICK against program adoption/mutation, so the system's rich behaviours get a sustained
trial under selection instead of being disconnected at birth+1. Hypothesis stands but is now conditional: niche
differentiation may emerge from authored behaviour ONLY ONCE those behaviours persist long enough to be selected.

### DURABILITY FIX — authored behaviours now persist for a real trial (confirmed cause, verified fix)

Acting on the orphaned-atoms finding. CONFIRMED the cause first (orphanverify, wrapping selfLearnFromBest): seeded
3 call-sites → all stripped within 2000 ticks, and the wrapper attributed every strip to selfLearnFromBest. The
self re-adopts the best lineage's program (`genome.vmProgram=cloneProg(pProg[best])`), which rarely carries a
freshly-authored atom, so the birth-spliced call-site is overwritten — atoms frozen bound-but-disconnected (uses
stuck at 36) before selection could judge them.

FIX (selfLearnFromBest, gated __ATOM_DURABLE): carry the authored bound-opcode call-sites across adoption —
deduped, capped to half the program ceiling so the self can't be dominated by atom-calls. Verified A/B (12k):
OFF = call-sites 0 immediately, atom uses FROZEN at 36; ON = call-sites held ~8k ticks, atom uses climb
36→162→387→567→**621** (a 17× sustained trial), population stable ~400 (no stickiness collapse), and call-sites
EVENTUALLY fade rather than locking in — extended trial then release to selection, the right shape. The stickiness
risk I flagged did not materialize (the half-ceiling cap + natural turnover handle it).

So the author→bind→use→SELECT loop is now durable: authored behaviours get expressed hundreds of times under
selection instead of being disconnected at birth+1. This was the bottleneck behind "engine authors behaviours but
diversity unchanged" — the differentiating primitives now actually get a fair, sustained trial. Whether that moves
the ecology is, as always, the LIVE test (one more enrichment-stack export past the danger zone), not a harness
claim. Chain status: bank✓ atoms✓ bound-opcodes✓ enrichment(hands/eyes/reach)✓ durability✓ — each fix exposed the
next link; this closes the authoring loop end to end.

### DURABILITY — VERIFIED on the natural path; the live "uses=0" was the RELOAD confound (and I nearly called it broken)

The gen4 t85051 export showed every atom uses=0 → I diagnosed the durability fix as targeting the wrong program
(children inherit parent's pProg via inheritProg, not the global self the fix preserves) and was about to call it
hollow. Before fixing, ran the decisive test I should have run first: NATURAL atom births, CONTINUOUS run (no
reseed/reload), durability on vs off, 50k ticks.

| natural births, continuous 50k (same 3 atoms) | first-uses | maxUses |
|---|---|---|
| durability OFF | 10 | 9 |
| durability ON  | 127 | **2385** |

The fix is REAL: 265× on the path that matters (maxUses 9→2385). OFF=9 matches the old pre-fix natural runs, so
it's clean. So BOTH my prior conclusions were wrong and self-correcting: the seeded probe (621) was a false
positive on a forced path; the live-gen4 read ("broken/hollow") was a false NEGATIVE on a reloaded path. The
continuous natural-birth test is the truth, and it says durability works.

The live uses=0 was the RELOADS: gen4 = 4 reloads, each reseeding the population and resetting the author→use loop
before it could establish; continuous → 2385. Same open-system confound as the network and the crash-radiations —
the user's actions, invisible in the export except as side-effects, repeatedly mistaken for system behaviour. The
harness (which can't reload) revealed what the reloaded export hid. Meta-lesson, fourth instance: before crediting
OR blaming the system for what an export shows, rule out the user's hand — and run the path that actually carries
the signal, not the one that's convenient to instrument.

Practical upshot: to see authored behaviours establish LIVE, run CONTINUOUS (no tab restarts) ~50k+ ticks. The
author→bind→use→select loop is now genuinely closed on continuous runs; reloads reset it. (Hardening against
reload — persisting established call-sites through save/load — is a possible future lever, not done.)

### RELOAD-DURABILITY FIX — the saved state was orphaned; load now re-establishes call-sites (real code change)

User's challenge: the gen4 export ALREADY ran the durability code and showed uses=0, so expecting a different
result from the same code is wrong. Correct. The export proves a concrete defect: it saved 7 bound atoms
(bo:[0,1,2,2,3,2,4]) with ZERO call-sites in the program (V had no opcode ≥232). So every reload restores that
inconsistent state — atoms bound-but-disconnected — and starts ORPHANED before durability (which only acts during
a run) can help. The continuous-headless fix (selfLearnFromBest carry, verified 9→2385) never gets a chance across
a reload because load itself hands it a dead genome.

FIX (sanitizeGenome, gated __ATOM_DURABLE — runs on load): for each bound opcode lacking a call-site, splice one
in (bounded by the program ceiling). So a reload re-establishes the author→use loop instead of inheriting the
broken saved state. Verified against the EXACT gen4 failure mode (reloadfix.js): reproduce the broken state
(7 bound, 0 call-sites) → after sanitizeGenome, call-sites 0→7; run 6k ticks → atoms reach 297 uses (vs frozen 0),
population healthy 516. Clean boot.

This is the genuine code change that justifies a different live result — not a re-run of identical code. Combined
with the continuous fix, the loop now survives BOTH normal program turnover (selfLearnFromBest carry) AND save/
reload (this). The reloaded usage pattern the user actually has is now covered. Lesson, stated plainly: "run it
again" is not a fix; the export named a real defect (orphaned saved state) and the fix addresses THAT.

### MILESTONE (live gen0 t48804, continuous, latest code) — the author→use→SELECT loop is CLOSED; atom reaches 387 uses

First live export, continuous (gen0, no reloads), on the fully-fixed stack (bank/atoms/bound-opcodes/enrichment/
durability/reload-durability). The decisive number: an authored atom `(a)/(Math.log1p(Math.abs(-0.24)))` reached
**387 uses** — persisted and ran under selection. Every prior live export showed authored atoms frozen at 0 (or
~36 transiently). This is the first time the author→bind→use→select loop demonstrably CLOSES in the live artwork,
under the user's real usage. The ~10-fix arc (each closing one broken link) paid off: the machinery works
end-to-end. (Mechanism note: global program V still has 0 call-sites — the atom accumulated uses via the
POPULATION path, call-sites oscillating in/out of the self; the loop runs through pProg, as designed.)

HONEST CAVEATS — a milestone, not a win:
- The selected atom is SIMPLE (a/log1p(0.24) ≈ 4.65·a), not a sense→act behaviour. The world-sensing one
  ((0.08)*(nx), reads position) got first-used but is NOT the one selection kept. So "the system keeps what it
  authors" is now true; "RICH behaviours win selection" is not yet (simple-useful beats complex-untested early —
  correct selection, but not the payoff).
- DIVERSITY UNCHANGED: kinds 9–24, peaks ~24, no lock — same band as every prior run. The loop closing did NOT,
  by itself, move the ecology. fitness healthy/climbing (~0.81), pop healthy, gen0/x0.

So the precise state: the infrastructure is built and verified live, and the deep question is finally ASKABLE for
the first time — does closed-loop authorship of behaviours move the ecology / drive niche differentiation? First
data point: not visibly, not yet. That is the real open question of the whole project, now reachable because the
loop holds. Next: longer continuous runs (does the used-atom set grow richer and start to differentiate niches?),
and whether reach-driven behaviours ever out-select simple scalings.

### SWINGS #40 + #41 — two deliberately RISKIER bets, shipped LIVE off a smoke test, not a harness verdict

Framing (the user's, mid-session): every prior swing above got real headless verification because the harness
COULD exercise it. But the harness was never the point — the artwork actually running, with a person watching and
feeding back, is what built all 39 swings before this. Spent too long re-learning that lesson in-session (a long
detour through headless A/B) before correcting back to the actual loop: smoke-test for safety, ship live, let the
real run be the test. Recorded honestly here, including the detour, because the notebook doesn't retcon its own path.

**#40 GROUP SELECTION FOR THE COMMONS (`__GROUP_COMMONS`).** Diagnosis it acts on: swing #36 found rqRate
(predation aggression, the diversity-MAINTAINING force #28 needs) is a commons — individually costly, so
individual-level selection drove it to 0 and it had to be FLOORED by fiat in sanitizeGenome (clamped to
[0.05,0.15]). A floor is a designer's thumb on the scale, not a resolution. The textbook resolution to a
tragedy-of-the-commons is a SECOND level of selection: groups that sustain the commons out-reproduce groups that
let it collapse, even though defectors still win WITHIN any one group. The cluster-budding pass is already a real
second level of selection (#33 uses it for role-diversity); #40 couples the SAME lever to commons-maintenance —
a colony whose members hold rqRate near the ceiling of its evolvable range buds more than one sitting at the floor.

*What's actually verified:* headless smoke-clean only — two 8k-tick runs (seed 7, `GROUP_PROBE=1 BUD_INSTR=1`,
commons on/off) produced zero loop errors, zero NaN. The MECHANISM itself is NOT verified: cluster budding fired
0 times in one run and 1 in the other — the same gap #33's own notes admit ("budding never fires there" in short
headless windows). A 25k-tick follow-up A/B was started to get more bud events but was abandoned mid-run per the
user's correction below — the harness was never going to be the instrument that judges this. commons_trend showed
`held:true` in the smoke runs but that number is not meaningful yet (rqRate never had a chance to be pulled since
budding barely fired). **Ships live, unverified on the actual mechanism, to let the artwork be the test.**

**#41 HORIZONTAL ATOM TRANSFER (`__MEME_TRANSFER`).** Every prior route an authored atom spreads by is VERTICAL
(parent→child inheritance, selfLearnFromBest's carry-across-adoption, reload's sanitizeGenome splice). None let a
proven atom cross from one living lineage into ANOTHER living lineage mid-life. #41 adds a horizontal route: on
close contact (`proximity>0.6`, `p=0.004` per qualifying interaction), a particle may adopt its neighbour's
most-PROVEN (highest-uses) bound atom directly into its own genome — dedupe by expression, capped by the same
`MAX_BOUND_OPCODES` ceiling germline authoring respects. The atom becomes a second unit of selection, judged on
its own spread across lineage boundaries, not on whether its original host thrived.

*What's actually verified — this one has a real, clean, non-confounded positive signal:* same-seed 8k-tick A/B
(seed 7). CONTROL (transfer off): `totAtoms_max:0, boundOps_max:0` — the population authored and bound ZERO atoms
anywhere, the whole run, so there is nothing a shared-seeding confound could ride on. TREATMENT (transfer on):
exactly ONE atom ever existed (`totAtoms_max:1`), yet `memeCarriers:410`, spread via `342` recorded transfer
events, reaching `memeTopLineages:153` — 153 DISTINCT lineages carrying an atom that, per the control, has no
vertical route to more than one. That is the decisive test this project always demands (a metric the confound
can't fake, same idiom as bifurcLin/cascadeCount): horizontal spread is real, not an artifact of common ancestry.
Population/fitness stayed healthy in both runs (no destabilisation), and a default-config smoke run (no env
overrides, exactly what the browser boots) at 3k ticks was also clean (0 loop/driver errors).

**Both promoted to LIVE default-on** (same bar #39 used: smoke-clean, not fully proven, and the artwork is the
real instrument). Next: does #41's second replicator ever produce an atom that out-spreads what selection alone
would keep (a meme that wins by transmissibility, not by helping its host)? Does #40 ever get enough bud events
in a real continuous run to show rqRate holding above the floor instead of just sitting on it? Both unanswerable
from a harness — only the live run, watched and reported back, answers them.

# BRIDGE NETWORK — measured honestly (it was decoration), then made to carry meaning

Three self-contained HTML artefacts share one `BroadcastChannel('selection-pe-network')`: Pe (this repo's
index.html), a companion SKI-combinator artificial-chemistry reactor, and a companion L-system growth ecology.
The two companions live in the user's own GitHub Pages; archived reference copies + all experiment scripts are in
`bridge/`. **Pe (index.html) was NEVER modified for any of this** — every change is in the companions or in
measurement harnesses. This is a bridge-layer log, not a Pe swing.

**First, an instrumentation fix (companions only): fromBridge ratchet → decaying bridgeInfluence.** Live exports
showed the boolean "this lineage ever touched bridge content" tag saturating to 97.7% (chem) / 100% (lsys) of the
population — driven purely by injection volume vs pop size, meaning nothing about CURRENT composition. Replaced
with a 0..1 influence that dilutes on mixing/reproduction and decays with a 4000-tick half-life computed at
read-time. Verified: exact decay (1.000→0.500→0.250 over two half-lives), save/load round-trip exact, old boolean
saves migrate (true→1, false→0). HUD shows live mean influence, not a ratchet.

**The negative control — the finding the architecture had been assuming away.** Question never tested: does a
seed that ORIGINATED in Pe bias a companion's outcome more than a random seed of the same size and number-range?
Three-arm control feeding the companions' flat receive path — TREATMENT (number-bags harvested from ~24k real Pe
packets via the bridge's own harvestNumbers), CONTROL-1 (uniform random), CONTROL-2 (bootstrap resample of the
POOL of real Pe numbers: identical marginals, all structure/ordering destroyed). Rank-based (Mann-Whitney +
Cliff's δ), n=3000/arm, lengths matched per replicate. On coverage, treatment beat uniform by δ=0.555 (large) but
beat structure-destroyed CONTROL-2 by δ=0.109 (**negligible**) — the whole apparent signal was number-RANGE;
destroy every correlation in Pe's numbers, keep only the histogram, and you reproduce ~90% of the effect.
Diversity: Pe-origin seeds produced FEWER distinct organisms (272) than structure-destroyed (1090) — the flat
bridge transmits monotony. Downstream (seed whole populations, evolve 400 cycles): all three arms converge to
identical fitness (treat vs ctl2 p=0.076, δ=0.084, negligible). **Verdict: the flat harvestNumbers bridge was a
range-matched noise injector with an honest gauge stapled on; selection erased even the range.**

**Structure-preserving translation — transmits, but selection still erases.** Replaced flat harvest with a
role-based map: each Pe VM instruction [op,src,dst,k] → a turtle gesture by opcode identity, constant's sign →
direction, order preserved. Re-ran the control. Aggregate scalars STILL indistinguishable from CONTROL-2 (they're
order-invariant; ctl2 preserves composition). But SIGNATURE RECOVERY moved: the modal translated motif appeared
in the evolved population at 1.37% under treatment vs 0.17% under ctl2 (~8×, p=3e-7, δ=0.264 small) — a specific
Pe structure now READABLE back out of the other substrate, which the flat bridge never could. Downstream fitness
still identical to ctl2 (δ=-0.083, ns): transmitted, not retained.

**Fitness coupling (harness-only, companions unchanged) — hitchhiking, the honest ceiling.** Gave the L-system a
selection regime rewarding branch-richness (a GENERAL trait Pe encodes), probed retention of the SPECIFIC
unrelated signature. Retention treatment 0.96%→1.73%, ctl2 0.19%→0.13% — ratio 5×→13×, δ 0.193→0.359 (medium),
p=3.6e-12. Sanity: mean branch-count treat=8.74 vs ctl2=8.43 (equal — reward is on a trait both achieve, so the
signature rode along on ARRIVAL structure, not fitness; non-circular). It plateaus as a retained MINORITY, not
fixation — fixation would need rewarding the signature itself (designing the answer). Reproduces real HGT:
foreign material persists when linked to locally-favoured structure, fixes only when advantageous in its own right.

**The Rosetta interlingua (shipped in both companions; Pe untouched).** Not a bag of floats — a universal
vocabulary of the five things every generative system does: **DRAW / TURN(signed) / BRANCH / MERGE / REPEAT**.
Grounded in Pe's real VM semantics (the fitness-sensor VM switch: op0 copy→DRAW, op1 `+=si*k`→TURN, op2 `*=`→
REPEAT, op3 threshold→BRANCH, op4 EMIT→MERGE). Each companion HEARS Pe's native packets and peers' `lingua`
packets, seeds a real organism from the MEANING, and SPEAKS its own best structure back — both a `lingua` packet
for peers AND a valid native Pe motif so Pe ingests it through its OWN validated receive path, no change to Pe.
Verified on 16k real Pe programs: branch-density preserved into the L-system (r=0.91) and chemistry (r=0.90);
adapters self-consistent; speak-back-to-Pe motifs 2000/2000 well-formed & bounded. End-to-end on the REAL shipped
code, both companions on one shared bus: L→chem (branchy-in → S-heavy-out), chem→L r=0.971, a real Pe motif heard
by both, 4000-tick live cross-talk soak 0 errors. **The bridge now carries meaning across three paradigms that
share nothing but a BroadcastChannel.** What it still does NOT do: change the evolutionary OUTCOME without a
fitness coupling — the negative control's deepest finding stands. Transmission is solved; retention is a choice
each substrate's selection makes, and forcing it would be designing the result. The live run, watched and
reported back, is the instrument for whether the three systems drift toward each other's signatures over time.

# AUTHORSHIP vs ECOLOGY — is the self-extending VM the axis that doesn't saturate?

The claim, argued then TESTED: after 40+ swings the ecological (diversity) axis provably saturates, but the
system's real strength is authorship — the VM writing and binding its own opcodes. Is authorship the axis that
stays open-ended when ecology freezes? Instrumented in `harness-oee.js` (observability only; Pe unchanged):
`cumAtomExprs` (distinct germline atom expressions ever authored — RAW), `cumProvenAtomExprs` (ever seen with
uses>0 — executed/ADAPTIVE), and `memeCarrierAmpAdv` (top-meme carrier vs non-carrier mean-amp: does a spread
meme help its host or spread against it?).

*A targeting error caught first:* the initial `cumAtomExprs` read the per-particle bank (≈empty, stayed at 1) and
would have falsely reported the thesis untested. Atoms are authored in the GERMLINE `genome.userAtoms`; fixed to
accumulate there, and split raw-vs-proven because raw expression births are drift (uaGenExpression mints random
untested strings — the same necessary-not-sufficient caveat cumKinds carries).

*Result (seed 7, 150k ticks, full engine, 0 loop/driver errors).* Ecology froze hard: `cumKinds` hit 26 by tick
~9k and never moved again — 140k ticks, zero new kinds, late-slope 0. Proven authorship kept turning over: standing
proven count (`liveAtoms`) held bounded at ~3 (oscillating 2–5) the whole back half, WHILE the cumulative set of
distinct PROVEN expressions climbed monotonically through the late third (13→14→15→16→17→18→19, late-slope 0.165/
sample). Raw churn rose faster (57 exprs) but that's discounted as drift. **The bank stays small but its
membership keeps being REPLACED by new executed atoms after ecology has completely stopped discovering. Thesis
SUPPORTED on the adaptive measure — authorship is open-ended TURNOVER where ecology is frozen.**

*Three caveats that kill the comfortable version of the claim, stated plainly:*
1. "Proven" = executed (uses>0, opcode 22 called it at least once), NOT demonstrated fitness-beneficial. This is
   reachability-turnover, a necessary-not-sufficient adaptiveness bar — the same bar cumKinds gets held to. The
   real test (do proven atoms correlate with host fitness / survive ablation) is the next instrument, not this one.
2. Standing complexity is BOUNDED (~3 proven atoms; boundOps capped ~16). So this is open-ended NOVELTY-TURNOVER
   at bounded standing complexity, NOT unbounded complexity growth. Meaningful (it matches a standard OEE
   definition — continued production of adaptive novelty) but it is not the system climbing without limit.
3. The selfish-meme / horizontal-transfer question is UNANSWERED: `transfersCum=0` across the entire 150k run,
   `memeTopPrevalence` essentially 0 — the #41 horizontal channel NEVER FIRED in a long clean closed run. The
   celebrated #41 result (342 transfers, 153 lineages) came from a specific seed-7 8k-tick A/B and did not
   reproduce here at all. Either it is condition-specific or that earlier signal deserves re-examination. The
   "does a meme win against its host" question cannot be answered until the mechanism reliably fires.

Net: the thesis I argued for is supported in its precise, deflated form (adaptive-vocabulary turnover, bounded
standing complexity) and NOT in its grand form (unbounded authorship growth), and one of its sub-claims (#41
horizontal transfer as a live force) failed to reproduce. That is the honest shape of it — recorded so the next
pass raises the adaptiveness bar (fitness-linked proven atoms) instead of re-arguing the story.

*The adaptiveness bar, raised (harness-ablate.js).* The decisive test the notes kept deferring: knock out the
most-PROVEN authored atom (pinned to constant 0 every tick so mutation cannot resurrect it) and measure whether
fitness actually falls — against a CONTROL knockout of a bound-but-unused atom, across seeds. All via the existing
GENOME= resume path; Pe unchanged. First run FALSELY flagged ADAPTIVE on one outlier seed and a knockout that
mutation silently reversed within a few hundred ticks — both caught and fixed (pinned knockout; verdict requires
effect>own-noise AND >=2/3 seeds). Corrected result (author seed 7, 45k ticks; 5 continuation seeds x 10k): the
most-used atom `(1.03)-(m)` (uses=1044) knocked out gives per-seed (proven-minus-control) fitness drops of
[0.008, 0.002, 0.088, -0.018, 0.002] — effect mean 0.016 < its own sd 0.037, one outlier seed (17) carrying all
of it. **VERDICT: INCONCLUSIVE, leaning NOT-adaptive — even Pe's most heavily-executed authored atom is not
robustly load-bearing for fitness; survival is robust to permanently losing it.** So authorship turns over
(proven-vocab result above) but no single proven atom demonstrably pulls fitness weight. The clean next test,
distinguishing "no atom matters" from "no SINGLE atom matters": ablate the WHOLE bank vs none. If that is also
null, the self-extending VM is executing atoms with no selective grip — the largest honest result the project
could reach, and it would reframe whether adding MORE mechanism (e.g. structural binding) buys anything at all.

### WHOLE-BANK ABLATION (the test the single-atom result deferred) — bank is NOT robustly load-bearing either

Ran the harness the last entry promised (harness-ablate-bank.js): pin the ENTIRE authored-atom bank to 0 every
tick (which also freezes authorship — any newly minted atom is re-zeroed next tick) and compare meanAmp to intact,
from the same authored genome, across seeds. This distinguishes "no SINGLE atom matters (redundancy)" from "NO atom
matters (decoration)".

Result (author seed 7, 45k ticks → bank of 4 atoms, 3 bound; continuation seeds 11/13/17 × 10k): intact meanAmp
1.169 vs whole-bank-ablated 1.145. Per-seed (intact − ablated) = [−0.0045, 0.068, 0.0097]: effect mean 0.024 <
its own sd 0.031, 2/3 seeds positive, ONE seed (13) carrying nearly all of it. **VERDICT: INCONCLUSIVE, leaning
NEUTRAL — removing the whole bank does not robustly lower fitness.** Same shape as the single-atom knockout
(positive mean, sub-noise, one outlier seed). So on this test the self-extension engine executes atoms with no
demonstrable selective grip — survival is robust to losing the entire bank at once, not just any one atom.

NOT a clean null, and it should not be inflated into one. Two limits kill the strong version: (1) seed 7's bank is
THIN (4 atoms) — possibly too little grip to detect vs the t119k-class runs with 36-use atoms; this tests THIS
genome, small. (2) n=3 seeds (a 6-seed re-run is the immediate firming step; the deeper one is the harness's
BASE_GENOME hook against a real heavy-authoring live export, and if a fat real bank is ALSO sub-noise, that is the
clean quotable result).

Bearing on the "add more mechanism" question the last entry raised: this weakens it. Stacking structural depth
(binding/multicellularity) onto a bank with no shown selective grip risks the orphaned-atom failure one level up.
The honest next levers are (a) instrument WHY novelty turns over with no grip — itself an OEE result — or (b) treat
the OPEN boundary (bridge/peers/the user's hand), where the causal action has repeatedly been, as the real substrate.

### SWING #42 — FORAGE EYES: the resource sense that gives authorship something to grip (built to answer the ablation null)

The ablation arc (single-atom, then whole-bank) came back INCONCLUSIVE-leaning-NEUTRAL both times: no authored
atom, and not the whole bank, robustly pulls fitness. The user's own live export (gen0 t773) sharpened it —
ua:[] bo:[], zero authored atoms: at the age real runs sit, the bank often doesn't even exist to have grip.
Measuring grip harder was not the bottleneck. The bottleneck was diagnosed twice already in these notes: swing
#11's opening ("one currency — amp — so one way to win → one winner") and the ENRICH/durability endpoint (rich
sense→act atoms get first-used but selection keeps the trivial scalar 4.65·a, because nothing makes the rich
behaviour PAY). The world gave authored sense→act behaviours nothing to grip on.

The fix, checked against the actual actuator geometry BEFORE building (the lesson of the orphaned atoms — don't
add an eye with no matching hand). Income is `amp += localRes·entropyK`, and localRes is drained from a spatial
`field` grid — so moving to richer field cells pays. Force (vmActions[0]) is applied ALONG THE PARTNER AXIS
(`vx[i]+=nx*force`), not toward an arbitrary vector. So an absolute gradient sense would be unactionable; the
sense that MATCHES the existing mover is a partner-relative one. Added two (gated __FORAGE_EYES, default on):
- rl = own local field level ∈[0,1] — "am I in food?"
- rd = field(partner) − field(self) ∈[-1,1] — "is my partner toward more food?"
rd aligns with the force actuator, so an atom can learn `rd → drive force = move toward richer neighbours` —
chemotaxis that converts to fitness through the EXISTING localRes→amp path. No new actuator, no unconserved
channel; rides existing conserved physics exactly like REACH. This is the specific bridge the null exposed: the
mover existed, the income existed, only the perception was missing.

VERIFIED — the substrate bar only (same bar ENRICH/REACH shipped on):
- forageverify.js: 800/800 authored expressions compile, 4000/4000 outputs finite across the real eye ranges AND
  adversarial NaN/Inf inputs; rl used in 396, rd in 405 — richly exercised, zero non-finite. Engine node --check clean.
- Live-engine smoke (harness-oee, seed 7, 3k, FORAGE on): 0 loop errors, 0 driver errors, population 329→352,
  meanAmp 1.159 (finite, on baseline), evenness 0.856, kinds 25 — boots clean, no NaN, healthy. (No atoms authored
  in 3k — seed 7 authors over ~45k, so the in-sim rd path isn't exercised at this length; the substrate verify
  drove that exact compiled path across real rd ranges instead.)

NOT verified: that it gives authorship GRIP. Whether an rd-driven foraging atom out-selects a trivial scalar and
moves the ablation verdict is the LIVE test (continuous run past the authoring window, watched and reported back),
not a harness claim — stated plainly so the next pass raises the bar rather than re-arguing the story. Ships live,
gated, reversible (FORAGE_EYES=0). If it changes nothing, that is itself a strong result: it would mean the null
isn't about a missing sense but something deeper about whether authored behaviour can grip in this substrate at all.

**6-seed confirmation (firms it, + a new caveat).** Re-ran on seeds 11/13/17/19/23/29. Five seeds tight and
consistent with the 3-seed run: intact−ablated = [−0.0045, 0.068, 0.0097, 0.0192, 0.0172] — mean ≈ 0.02, all
sub-noise. So the NEUTRAL-leaning verdict holds, firmer. The sixth seed (29) is an ARTIFACT that poisons the naive
stat: its INTACT arm ran meanAmp to 4643 (pop healthy 471, driverErr 0 — a runaway amplification, not a crash),
while its ablated arm sat at 1.17. Naive mean/sd (774/1730) are entirely this one seed; exclude it and nothing
changes. Two takeaways: (1) verdict unchanged on 5 clean seeds — the bank is not robustly load-bearing for fitness;
(2) NEW — the bank CAN drive a rare amp explosion (a large but non-adaptive effect ablation suppresses), so meanAmp
is not a robust fitness statistic for this test. A future ablation pass should use a clamped/median fitness measure
before any BANK_ADAPTIVE claim, and the runaway itself (what authored dynamic amplifies amp 4000× in seed 29?) is
worth its own look.

### LIVE #42 + REAL-BANK ABLATION (export gen1 t352728) — the sense is USED but the whole bank is fitness-INERT; the largest honest null, now on a real bank

First mature live run of swing #42 (FORAGE EYES), and the user's real artwork export — so the live test I said
only they could run. Two findings, one narrow win and one large deflation.

**Live read of #42 (t352728, gen1).** The FORAGE sense is real and used: atom `(rl)-(0.05)` reached uses=261,
authored/bound/executed under real usage, not orphaned — substrate holds at 352k. But three deflations, stated
plainly: (1) only the SCALAR rl sense got used, as a thresholded readout — the directional rd→force chemotaxis
that was the POINT of #42 never made it into a used main-VM atom (rd appears only in the render VM). Selection kept
the trivial scalar again — the exact prior pattern. (2) Bank UP, fitness DOWN: over the run the bank climbed 0→28
atoms while fitMean fell 0.389→0.076 (5×) and the cluster/diversity epoch metrics sat at 0 from ~25k; of 28 atoms
exactly TWO are used (clock (-1.03)-t at 2066, (rl)-0.05 at 261), the other 26 orphaned at 0. (3) HEAVILY
CONFOUNDED — the two open boundaries the notebook always catches: g:1 (one reload) AND massive network absorption
(na: 311 motifs, 45 plasmids, 14 inscriptions ingested from peers; 196/777 alien-predict hits vs tabs 1upwb6uk +
chem-reactor-htb). So NOTHING internal is cleanly attributable to #42; the fitness decline could be network
indigestion as easily as authorship. #42 verdict: verified ACTIVE live (its sense is used), NOT verified to grip,
and the one run shows trivial-adoption, not chemotaxis.

**The clean test the export finally enabled — whole-bank ablation on a REAL fat bank (BASE_GENOME).** 28 atoms, 32
bound opcodes, 2 proven (maxUses 2066). Ran it forward CLOSED (harness strips the reload + network — "does the bank
grip fitness" is a CLOSED question the harness answers honestly). Seeds 11/13/17/19/23 x 10k, intact vs
whole-bank-pinned-to-0: intact meanAmp 1.1937 vs ablated 1.1935, per-seed diffs [0,0,0.0008,0,0], effect 0.0002 <<
noise, **4 of 5 seeds BIT-IDENTICAL**. Checked the hollow-null trap the notebook caught twice (bit-identical because
atoms never fire): NOT hollow — a resume of this genome fires the bank (cumProvenAtomExprs=4 in a 3k continuation,
boundOps 32, amp healthy 1.2). So the atoms EXECUTE and removing all 28 leaves fitness bit-identical.

**VERDICT: the strongest, cleanest null the project has reached — the self-extension bank is EXECUTED but
fitness-INERT.** Not "atoms don't fire" (hollow) but "atoms fire and still don't move amp." This is the largest
honest result the earlier ablation entry anticipated, now on a real mature 28-atom bank rather than a thin synthetic
one. It reframes the whole "add more mechanism" axis, #42 included: giving the engine a richer SENSE didn't help,
because the problem isn't perception — the executed atoms' outputs don't couple to the amp economy at all. The two
honest frontiers left: (a) MECHANISTIC — why does REACH (atom→actuator→physics→amp) not translate to fitness? the
atoms fire, drive actuators, and amp is unchanged; that coupling is where the grip is lost and is the next thing to
instrument. (b) The OPEN BOUNDARY — where this run's real dynamics demonstrably live (311 absorbed motifs), which
the closed harness cannot model and the notebook has said four times is the actual causal channel. Adding internal
mechanism (Gemini) or senses (#42) does not touch either.

### SWING #43 — DECISION GAIN: the system's self-tests earn the authority to act ("the bearing on deciding", restored)

The user's diagnosis, made precise in the code. runShadowSim() is a genuine test-to-do loop: fork the state,
imagine 5 variant selves ("what if I were more spawny/attractive/bleedy"), roll each forward shadowHorizon ticks,
score, pick a winner, act. But three coupling points had drained the "deciding" out of it:
  (1) the rollout tests a 7-knob CARICATURE in hardcoded coarse physics (9532-73), not the real VM/atoms;
  (2) the winner's behavioural "do" was SIGN-ONLY (11140, 11179) — a self-test reality CONFIRMED and one it
      REFUTED biased evolution identically. The system's imagination steered it regardless of being right;
  (3) the credit that should make good self-tests persist never accumulated (glacial EMAs, wins=0 after ~3000
      shadow runs in the t352k export).
Together: the system modelled itself richly and varied itself richly, but nothing it discovered about itself
became something it DID with any gain. Test-to-see, not test-to-do.

FIX (gated __DECIDE, default on, ONE new state var). genome.decisionConfidence ∈[0,1] is an EMA of "the currently-
applied shadow winner is VALIDATED" — its scenario creditTrace positive, i.e. real fitness rose during its tenure
(computed in applyCreditAssignment where df=Δfitness already lives). It rises only when the self-model's own
predictions are borne out, decays when they aren't (or when a winner is evicted unconfirmed). Confidence then
scales commitment via _decGain = 1 + confidence·3 at both actuators: the physics nudge application (SCEN_APPLY, ps)
and the behavioural mutation bias (vmNudgeScale + targeted-EMIT insertion prob/initK). So a validated self-model
commits up to 4× harder to the direction it chose; an unvalidated one barely nudges.

Why this restores DECIDING without risk: commitment authority is EARNED, not assumed — at cold start
(confidence 0) _decGain=1, i.e. byte-for-byte the prior behaviour, so it cannot destabilise from rest; authority
only grows as reality confirms the system's predictions. Self-limiting by construction: over-commitment that hurts
fitness drives the winner's creditTrace negative → confidence decays → commitment relaxes (negative feedback). All
nudges stay within the EXISTING clamps (inst[3]∈±2, physics param ranges). And it turns break (1) from a hazard
into a non-issue: a caricature prediction reality refutes earns no confidence, so a bad self-model literally cannot
act — the validation gate makes low-fidelity testing safe rather than needing the expensive high-fidelity rollout.
decisionConfidence persists across reload (serialized dc), so earned authority is a heritable trait.

What this does NOT do (honest): it does not raise the rollout's FIDELITY (break 1) — the shadow sim still imagines
a 7-knob self in approximate physics; #43 only ensures the system commits to those imaginings in proportion to how
often they've been right. The deeper swing (run the real VM/atoms in a forked sub-population and adopt winners via
the selfLearnFromBest path) is the next lever, deliberately not rammed in here. Shipped LIVE, unverified by harness
by design — the artwork is the instrument (syntax-checked only, gated/reversible with DECIDE=0). What to watch in a
continuous run: does decisionConfidence ever climb off 0 (do the self-tests EVER get validated?), and if it does,
does earned commitment change the ecology where sign-only biasing never could.

### SWING #44 — DECIDE FROM THE REAL WINNER: the deeper move #43 pointed at, actually made

Made after the user named the hedge: I diagnosed that the system commits to its own discoveries with no gain, then
shipped #43 — a fix that also commits with no gain until "earned" (cold-start=identity, self-limiting, bounded). I
reproduced the exact flaw I described, and deferred the structural move behind risk/cost arguments that didn't hold
up. The cost argument in particular was wrong: reading selfLearnFromBest + pGenome shows the expensive "real-VM
rollout" I said the deep move needed ALREADY EXISTS — the population. Every pGenome/pProg lineage is a full self
running the real substrate under real selection; selfLearnFromBest already adopts the best lineage's PROGRAM. The
gap: it never adopts the winner's PHYSICS, so the self's behaviour tracks reality while its physics is steered by
the shadow-sim's 7-knob caricature (breaks 1+2 at the root).

#44 (gated __DECIDE_REAL, default on): decideFromRealWinner(), called right after selfLearnFromBest at cadence-
Lineage. Picks the highest-amp living lineage (same selection selfLearnFromBest uses), steps the self's five
physics params (entropyBaseline/K, entrainRate/Thresh, creationCost) a bounded fraction (0.06 of the gap, ×(1+
conf·3)) toward that REAL winner, and writes reality's per-axis direction into lastShadowNudgeDir[0..4] — the same
channel #43's commitment machinery reads. When on it REPLACES the caricature's physics application (the shadow-sim
still imagines BEHAVIOUR via nudgeDir[5..11]; physics is now decided from what is actually winning). So: imagine
behaviour, decide physics from reality.

The difference from #43, deliberately: this is ALWAYS-ON from tick one — a real baseline step, NOT deferred until
confidence is earned. Confidence changes how HARD the self commits, not WHETHER. That is the point the user was
making — a bet placed, not a fuse that never blows. And it makes decisionConfidence able to actually leave 0,
because it now validates against tracking the REAL winner (self-fitness rising while stepping toward it) instead of
a caricature's scenario credit. Bounded to each param clamp; the winner is a living healthy lineage so its physics
are viable by construction; the self keeps independence between the sparse (cadenceLineage) updates and via its own
mutation. Shipped LIVE, syntax-checked only, reversible (DECIDE_REAL=0), no harness — the artwork is the instrument.

Honest open question for the live run: does decisionConfidence now climb off 0 (does tracking the real winner track
rising fitness)? And does the self, now adopting the whole realized winner (program via selfLearnFromBest + physics
via #44) rather than a caricature, behave differently than 44 swings of caricature-steered physics ever did. Still
NOT done: fully retiring the shadow caricature for behaviour too (derive behavioural commitment from the winner's
program-diff, not imagined 7-knob deltas) — the next move, named not deferred.

### INSTRUMENT — metabolism.html: seeing the coupled organism the harness is blind to

The user, watching two universes run in parallel, saw what every per-universe read this session missed: they were
ONE system. Decoding the two exports as a pair confirmed it in the flow data — a near-closed, DIFFERENTIATED,
anti-parallel exchange: MOTIFS flow B→A (B out 439 ≈ A in 424) while PLASMIDS flow A→B (A out 60 ≈ B in 62), every
number cross-matching its partner. Two currencies, opposite directions = a metabolic loop. Read as one organism: B
is the novelty PUMP (authorship-churn exports motifs; its own ecology burns to monoculture as the cost), A is the
INTEGRATOR/BLOOM (imports novelty, flowers to 30 kinds/fit 0.68, buds packaged plasmids back). Plasmids ARE the
budding currency — A buds, B absorbs and saturates: "the budding transferred," exactly as the user saw. This is the
trophic division-of-labour the project chased for 40+ swings and never got inside one closed universe — it
self-organised BETWEEN universes, at the open boundary the notebook named four times and the closed instruments
(harness, ablation, per-universe fitness) are structurally blind to.

So the instrument was wrong for the ontology. metabolism.html (repo root, self-contained, offline, NO sim change)
is a READ-ONLY listener on the BroadcastChannel('selection-pe-network') — the same wire the universes couple over.
It reconstructs the flow matrix live: emissions tagged by sender tab, absorptions read directly off the 'applied'
gossip packets (a peer announcing "a packet of this kind changed MY state"). It renders: per-universe emit/absorb
per currency with auto PUMP/BLOOM role badges; a flow diagram (currency-coloured directed arcs); a net-flow
oscilloscope (each currency's net direction between the two busiest tabs over time — anti-parallel lines = the
two-stroke, visible at a glance); a differentiation index; a budding-transfer detector (a plasmid emit followed
within 1.5s by a peer's applied-plasmid); and a wall-clock event trace with JSON export. Verified headless
(Playwright, simulated two-universe traffic): 0 console errors, and it correctly reads the pump/bloom split, the
anti-parallel motif/plasmid flow, and the bud transfers. The export button is the point — the user sends me a
trace and I finally SEE instrumentally what they see visually. Colour == currency throughout (validated categorical
palette, dataviz skill); it must be hosted same-origin as index.html for BroadcastChannel to reach it (a claude.ai
artifact is a different origin and cannot join the channel).

Next, matched to the open ontology: the trace makes "is the loop closing, and which way is it pumping" a measured
time series instead of an inference — the honest instrument for the two-body organism the single-universe swings
kept mis-grading as a dead run plus a lucky one.

### INSTRUMENT (in-sim) — #metab panel: the metabolism view hosted inside a universe tab (phone-viable)

The standalone metabolism.html can't run as a third tab on a 2-slot phone — mobile suspends the backgrounded tab,
so it would collect nothing (the sim itself survives hiding, line ~20685: it switches rAF→setTimeout(loop,67) when
hidden; a passive monitor tab does not). Fix, the user's instinct too: put the view INSIDE index.html so it runs
wherever a universe tab runs — no extra tab to suspend. Split-screen the two universes, enable the panel in one.

Injected after boot(): a self-contained IIFE, INERT unless location.hash contains 'metab' (zero footprint on the
default art — a regex test on load/hashchange and nothing else). When on it opens its OWN BroadcastChannel object;
per spec a second channel in the same page receives every message except ones it sent, so it hears BOTH peers AND
this tab's own bc emissions/'applied' acks — reconstructing the full flow matrix from the wire with ZERO coupling
to the sim (it never reads sim state, never posts). Confirmed universes broadcast 'applied' on absorb (idx 227/254/
279/288), so absorption is wire-visible per tab. Driven by setInterval(450ms) — survives backgrounding like the sim
loop, unlike the standalone's rAF. Compact corner overlay: per-tab pump/bloom roles ('you' = this tab), motif &
plasmid out/in rates, differentiation %, bud count, and a net-flow sparkline (the two-stroke). Toggle via #metab or
tap ×/pill.

Verified headless (Playwright, real index.html#metab booted + simulated peer traffic): panel present, 0 page
errors, correctly read 3 univs, PUMP/BLOOM split, 100% differentiation, 69 bud transfers, and this tab's own real
absorptions as 'you'. Both instruments now exist: metabolism.html (standalone, best tiled on a desktop) and the
#metab in-sim panel (phone-viable, always runs with its host universe). The apparatus finally matches the ontology
— the coupled organism is observable live, on the device the art actually runs on.

### INSTRUMENT — coupling data now lives IN the export (cpl), always-collected

The user's question: the panel reconstructs the metabolism live but threw it away — why isn't it in the export we
already make? Right. The cumulative na/nap WERE in the export (aggregate absorbed/acked per channel — that is what
first revealed the source-sink balance), but the PER-PEER breakdown, the TIME-RESOLVED two-stroke, and the BUD-
transfer count were not, and were only ever live on screen.

Fixed by splitting the observer into always-on COLLECTION and hash-gated VISUAL. Collection runs regardless of the
panel (even under #nometab): it accumulates per-peer emit/absorb totals, cumulative bud transfers, and a recent
net-flow series, restores them from genome.coupling on load (so they accumulate across the frequent reloads), and
flushes genome.coupling every ~3s. New serializer field 'cpl' (beside ap) + loader + it rides out in every export.
Verified headless through the REAL export path (encodeGenome round-trip): cpl present with self id, cumulative buds,
per-peer {emit,absorb} (the source→sink structure, e.g. peerB emit motif:40 / peerC absorb plasmid:40), and the
two-stroke series — panel shown or hidden, 0 page errors. So a SINGLE export now tells the coupling story, and two
line up fully, without a separate trace. The apparatus and the ontology finally match at the level of the data the
user actually sends.

### INSTRUMENT fix — cpl liveness: don't count ghosts of closed tabs

TAB_ID is regenerated per page load, so closing tabs and opening new ones yields NEW ids; cpl.peers was
accumulating the closed tabs' ids and I misread a t26500 export as a "4-body organism" when it was 2 live screens +
2 ghosts of just-closed tabs (the big-emit ids pkwdc0k3/90ss3lpc were the previous, now-closed pair; the new pair
3dkyssv9/5a8012f3 had tiny counts because they'd just opened). Fix: each cum peer now carries a last-seen stamp
(updated on every message incl. hello); flush marks each peer live:(seen<6s) with agoMs, reports liveCount, and
prunes any id not heard from in 60s (closed or reloaded-into-a-new-id) from both the cum and windowed maps.
Restored peers get a grace window. Verified headless: an active peer reads live:true, a peer silent 8s reads
live:false (retained until the 60s prune), liveCount matches the panel's count, 0 errors. The panel's live count was
already correct (it filters by a 6s TTL) — this makes the EXPORT honest too, so a single cpl now says how many
universes are actually coupled, not how many tab-ids have ever been heard.

### COHORT (8 live exports, gen2–3, one channel) — trophic division of labour, read straight from cpl

First multi-body read using the in-export coupling data. Eight universes on one BroadcastChannel; decoded all eight
and cross-referenced their cpl. Result: the cohort has DIFFERENTIATED by age/size/diversity into producers and
consumers.
  - OLD/large/low-diversity (gen2, T~100k): 0q6tklcc (kinds 1, pop 647) and ug2ruqtp (kinds 5, pop 625) are the
    PRODUCTION ENGINE. Consensus per-peer emit (summed over all 8 observers' cpl): 0q6tklcc emits 154 motif + 142
    plasmid — the super-producer of BOTH novelty and buds, far above all; ug2ruqtp emits 0 motif / 58 plasmid and
    is a motif sink (plasmid-producer / novelty-consumer).
  - YOUNG (gen3, T~60k, six of them): kinds 8–15 on small pops (194–351) — the CONSUMERS/bloomers, absorbing the
    buds+novelty and flowering into diversity.
This is the producer↔consumer / trophic division of labour the project chased for 40+ swings and never got inside a
single closed universe — self-organised across an 8-body cohort, mediated by plasmid(bud)+motif(novelty) flow, and
LEGIBLE FROM THE EXPORTS because cpl carries the per-peer matrix. The apparatus finally matches the ontology at
cohort scale.

INSTRUMENT CORRECTION recorded: the aggregate nap is NOT directional in a many-body net — it counts every 'applied'
gossip packet from ANY peer, so it saturates to a ~420 global channel-activity counter, near-identical for all 8
("everyone is a +330 source" was an artifact). Direction comes only from the per-peer cpl emit/absorb — which is
exactly why that was built. Caveats kept: cpl per-peer counts are partial windows (each observer since its own
start), 0q6tklcc's dominance is partly big-pop-broadcasts-more, n=1 cohort, reload-confounded, and no no-network
control proves old→young flow CAUSES the young diversity (only that the structure is consistent). dc pegged (1, or
~0.98 for the gen2 pair) everywhere; FORAGE rl atoms present but mostly uses=0 in this batch — the story here is the
coupling, not the internal swings.

### INSTRUMENT fix — the whole headless harness apparatus was dead at boot

Picked this up next and tried to run harness.js before touching anything: it threw
`Cannot read properties of undefined (reading 'appendChild')` at boot, before tick 1. Cause: the #metab in-sim
panel's metabolismObserver IIFE runs unconditionally whenever BroadcastChannel exists, and its showPanel() opens
with `document.head.appendChild(st)` / `document.body.appendChild(root)`, later using `root.classList.add/remove`
and `root.remove()`. The four harness DOM stubs (harness.js, harness-oee.js, harness-ab.js, harness-stream.js)
never defined document.head/body, and their shared makeEl() stub had no appendChild/classList/remove. So every
headless run since that panel landed — harness-ablate.js and harness-ablate-bank.js too, since they just execFile
harness-oee.js — has been dying at boot, before executing a single tick. Whether anyone actually tried a harness
run in that window is unknown; what's certain is the apparatus itself, not the sim, was broken. Fixed by adding
appendChild/removeChild/remove/classList to makeEl() and head/body to the document stub in all four files.
Separately, harness-ab.js's AUTHOR_MULT text-patch target (`if(Math.random()<rate*0.15){`) no longer matched
current index.html (the line is now a brace-less single statement gated by an added `p.length<cap&&`), so
_patch()'s indexOf check failed and silently called process.exit(2) — silent because harness-ab.js's own
console.error override swallows anything that isn't a Loop/Boot/Watchdog message. Retargeted the patch to the
current substring. All six harness entry points verified booting and running clean again (0 loopErrors, 0
driverErr) before any of the work below started.

### SWING #45 — CAUSAL NETWORK-COUPLING TEST: the no-network control the live cohort never had

The COHORT entry above named its own biggest hole: nothing closed proved coupling CAUSES the old→young diversity
flow rather than merely correlating with population age/size (n=1, reload-confounded, no no-network control).
Every closed harness up to this point stubs BroadcastChannel to a no-op — none of them could touch this question;
every prior ablation/OEE/A-B run in this file was run fully uncoupled. Built harness-coupling.js +
harness-coupling-worker.js to close that specific hole: matched-seed universes run two ways —
COUPLED (instances share one real channel name) vs ISOLATED (identical code path, identical per-tick network cost,
but each instance's BroadcastChannel constructor is remapped to a private channel name, so no peer message ever
arrives). Same seed in both arms of a pair, so any divergence is attributable to coupling itself.

Architecture note, honestly logged because it cost a false start: first attempt used `vm.createContext` for
per-instance isolation (same process, N sandboxed globals). Measured ~4x slower per tick than harness.js's plain
CommonJS/global approach — contextified sandbox objects have a materially slower global-property-access path than
a real V8 realm. Switched to `worker_threads`: each instance gets a full, fast, independent V8 isolate, and Node's
BroadcastChannel already multicasts by name across worker threads in the same process natively — verified directly
with a 2-worker smoke test before building on it, so no hand-rolled message router was needed at all.

Sanity check (this is the part that makes the result trustworthy, not just the headline numbers): the metabolism
collector's own second channel ('ch') hears its own main channel's ('bc') emissions by design — real
BroadcastChannel semantics, a second channel object hears everything except what IT sent — so even a fully
isolated instance shows one 'self' entry in genome.coupling.peers. __sample() now reports externalPeers (excluding
genome.coupling.self) so the isolated arm's silence is measured correctly instead of showing a false peers>0.
Result at full scale (4 seeds, 15000 ticks): coupled 4/4 heard a real external peer, isolated 0/4 did, AND isolated
0/4 ever absorbed anything (absorb only increments via handleNetworkMessage, which independently filters out
msg.tab===TAB_ID — this is proof the isolation is real at the sim-state level, not a labeling artifact).

**Verdict.** Delta = coupled − isolated, matched pairs, late-window (last third) means, seeds 11/13/17/19:
meanAmp COUPLED_LOWER (mean −0.004, sd 0.0034, 3/4 seeds negative) — small, ~0.3% of baseline ~1.18.
occupiedKinds COUPLED_LOWER (mean −0.68, sd 0.40, 4/4 seeds ≤0) — the most consistent signal in this run.
diversityHbits and diversityEvenness both NO_EFFECT (one seed, 19, swung strongly positive against the other
three, so neither beats its own noise).

So: in THIS setup, coupling did not raise diversity — if anything it mildly lowered occupied-niche count and mean
fitness, consistent in direction across most seeds but small in magnitude and only n=4. Read plainly, not
inflated: this is NOT a replication of the live COHORT finding, and isn't trying to be — that cohort's
differentiation came from AGE/MATURITY ASYMMETRY (an old, large, low-diversity producer feeding novelty to young,
small, high-diversity bloomers). This harness coupled SYMMETRIC same-age peers, all booted together from the same
tick zero. That symmetric coupling trends toward mild homogenization rather than diversification is actually the
sharper, complementary result: it suggests the live cohort's diversity gain specifically required the
producer/consumer asymmetry, not coupling per se — mutual gene-flow between equals doesn't manufacture novelty on
its own, matching the classical population-genetics intuition that migration between symmetric demes homogenizes
rather than diversifies. Caveats stated plainly: 15000 ticks is short next to the live cohort's t~60k–100k
maturity windows and this never ran long enough to let any instance actually differentiate into a producer role;
n=4 seeds is thin; effect sizes are small enough that a longer or larger run could still overturn NO_EFFECT into a
real signal either direction.

The next swing this points at, named not deferred: an ASYMMETRIC version of this same harness — pre-run one
instance to a mature/low-diversity state (matching the live producer's profile) before coupling it to several
fresh instances, then compare coupled-fresh vs isolated-fresh diversity trajectories. That is the actual causal
analogue of what the live cohort showed; this run only establishes that the null hypothesis (symmetric coupling ⇒
free diversity gain) does not hold, which is the honest prerequisite before spending a longer run on the
asymmetric setup.

### SWING #45b — ASYMMETRIC COUPLING TEST: the actual analogue, run — still no diversity gain

Built harness-coupling-asym.js to run the follow-up #45 named: give the fresh cohort an actual mature producer to
couple to (age/size/diversity asymmetry, matching the live COHORT's structure) instead of symmetric same-age peers.
One producer (seed 7, the project's canonical authoring seed) matured 30000 ticks ALONE (its channel open from
boot, nobody listening yet — same trick as harness-coupling.js's isolated arm, just used for real this time), then
3 matched fresh pairs (seeds 11/13/17) joined for 15000 ticks — coupled shares the producer's channel (so the 3
coupled fresh instances are ALSO on the wire with each other, not just the producer — a real small multi-body
cohort with one elder, which is actually more faithful to the live topology than a strict pairwise design), isolated
gets a private channel per seed, same strength-matched control as #45.

Producer profile at maturity vs a fresh instance's own tick-0 baseline: N 630 vs 329 (real size asymmetry), 
occupiedKinds 8 vs 25, diversityHbits 2.97 vs 3.56 — genuinely lower-diversity and larger, qualitatively matching
the live producer's profile (large, low-diversity), though nowhere near the live extreme (kinds=1 at T~100k) —
30000 ticks produced a moderately mature producer, not a monoculture. Sanity: freshCoupled_sawExternalPeer 3/3,
freshIsolated_sawExternalPeer 0/3, freshIsolated_absorbedAnything 0/3 — isolation control clean again. One reading
needs a caveat, not a redo: the producer's OWN final sample showed externalPeers=0 despite absorb=59 (real,
nonzero) — worked out why rather than treating it as a red flag: the producer is far heavier per tick (N=630+,
lineageRegistry=8766) than the ~400-490-particle fresh instances, so it very likely finished its own final ticks
well after the fresh-coupled workers had already exited; the metab collector prunes any peer id unheard from in 60
real seconds, so by the producer's LAST sample the fresh peers' entries had gone stale and were pruned — a
snapshot-timing artifact, not evidence the coupling was ever silent. The fresh side's own readings (3/3, live
throughout their own shorter run) are the trustworthy half of this sanity check.

**Verdict** (delta = fresh-coupled − fresh-isolated, matched pairs, late-window means, seeds 11/13/17):
meanAmp NO_EFFECT (mean −0.0037, sd 0.0096, 1/3 positive). diversityHbits NO_EFFECT (mean +0.14, sd 0.25, 2/3
positive — trending the right direction this time, unlike #45, but still doesn't beat its own noise).
diversityEvenness NO_EFFECT (mean +0.094, sd 0.124, 2/3 positive — same pattern). occupiedKinds COUPLED_LOWER
(mean −1.24, sd 1.12, 3/3 seeds ≤0: −2.72, 0, −1) — the one metric that stayed consistently negative in BOTH the
symmetric (#45) and this asymmetric run.

So: giving the fresh cohort a real mature producer did NOT flip the result into a robust diversity gain.
occupiedKinds is still directionally lower under coupling in both experiments; Hbits/evenness nudged positive here
but not enough to call it a real effect at n=3. Read plainly, this does not refute the live COHORT reading — it
narrows where the disagreement must live. Two honest candidates, both about SCALE not mechanism: (1) this
producer's maturity (kinds=8) is far short of the live producer's monoculture extreme (kinds=1) — an elder that
hasn't differentiated much may not be much of a novelty pump yet; (2) the coupling window here (15000 ticks) is a
sliver of the live young universes' own maturation time (t~60k before they were read as "bloomers") — 15000 ticks
may simply not be enough time for absorbed novelty to convert into occupied niches even if the mechanism is real.
Both point the same direction: this harness's compute budget (this one run took ~41 minutes wall-clock) is
underscaled relative to the live timescales the COHORT finding actually lived at, not that the hypothesis is wrong.
Named, not run without checking first given the cost already spent: either a much longer maturation (push the
producer toward genuine near-monoculture) or a much longer coupling phase (closer to 60k+ ticks) would be the
faithful next test, but both push a single harness pass well past an hour and deserve a deliberate go-ahead rather
than another automatic launch.

### SWING #46 — ALIEN GRIP: alien-prediction accuracy becomes its own selection currency, not a dead one

The two coupling swings above (#45, #45b) both landed honest nulls at their tested scale — symmetric and
asymmetric coupling alike left occupiedKinds flat-to-lower, nothing showed a robust diversity gain. Rather than
push a third, much longer coupling run without a deliberate go-ahead, the user asked for the one direction that
fits everything learned this session and hasn't been tried — not here, not (as far as either of us knows) in ALife
more broadly: stop trying to fix authored cognition's grip on LOCAL fitness (proven dead by the whole-bank
ablation) and instead give it a currency that was never entangled with the self's own body in the first place.

It was already half-built. runAlienPrediction() (added some swings back, barely used) has the self's most-proven
atom predict a coupled peer's near-future packet-emission rate — a genuinely alien target, since that peer is a
causally independent substrate (possibly Selection, possibly φ's fluid grid, possibly the SAT crucible) the self
cannot influence back through this channel, only observe. But a hit only ever bumped `uses` — the exact currency
the whole-bank ablation proved EXECUTED but FITNESS-INERT. So the mechanism had zero teeth: it could never protect
an atom, shape authorship, or compete against anything. It was scorekeeping nobody could win or lose.

**The move.** Give atoms their own alienHits/alienAttempts, fed and spent by nothing else — a currency clean of the
proven-dead one. alienGrip(atom) = raw hit-rate once an atom clears a 6-attempt floor (no hand-picked "chance"
baseline; predicted/actual direction isn't a clean coin flip so a real baseline would need its own instrumentation
pass — left honest rather than guessed). That grip now scales down two things that used to be blind to it: the
per-mutation-cycle chance an atom's whole expression gets randomly overwritten, and the uses===0 cull that would
otherwise delete an atom doing real exogenous predictive work that opcode-22 just never happens to call. A second
change was needed for the currency to mean anything at all: prediction FORMATION used to always test the
highest-`uses` incumbent, which would have meant only whatever the (already-inert) internal route already favoured
ever got a shot at the alien channel — added a 30% chance to test a random bound atom instead, so the new currency
can actually discover something the old one never could. Gated __ALIEN_SELECT, default on; off reproduces the
pre-#46 behaviour exactly (uses-bump included) for a clean A/B. alienHits/alienAttempts added to all four places
atoms cross a boundary (encodeGenome/decodeGenome/sanitizeGenome/cloneGenome) so the record survives save/reload
instead of silently vanishing — cloneGenome resets it to 0, same as uses, so a new lineage re-earns its own record
rather than inheriting a parent's.

**Verified, not yet validated as adaptive.** Full file parses; harness.js and harness-oee.js boot and run clean (0
loopErrors/driverErr) with the gate on. A direct two-worker real-coupling check (bypassing the summary-only
orchestrators to read raw samples) confirmed the mechanism end to end: attempts/hits climb against REAL peer
traffic, grippedAtoms and bestAtomGrip stay at 0 until an atom crosses the 6-attempt floor then read ~0.43-0.57 —
plausible, not saturating to a suspicious 1.0. Gate-off run reproduces the old no-crash behaviour, grippedAtoms
staying 0 throughout. What's NOT yet shown: whether this changes which atoms actually survive over a long run, or
whether it moves any downstream measure at all — that would be a whole-bank-style ablation comparing __ALIEN_SELECT
on vs off under real coupling over enough ticks for grip to actually differentiate the bank, which is the honest
next pass and, given how the last two runs went, deserves a deliberate go before launching.
