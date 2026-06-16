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
