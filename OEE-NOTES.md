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

### SWING #46 ABLATION — a genuinely mixed result: real signal, but not the clean one hoped for

Ran the direct test: 4 matched seeds, each present twice in ONE shared coupled cohort (__ALIEN_SELECT on vs off,
same channel, same peer-traffic environment, only each instance's own gate differs), 45000 ticks — long enough for
atoms to actually get authored (the pilot at 3000 ticks proved that much isn't: totAtoms stayed 0 in all four
instances, confirming this project's own ~45k-tick authoring-window precedent the hard way before spending the
full run on it).

Gate mechanics: clean. on_sawExternalPeer 4/4, on_grippedAnyAtom 4/4 — every ON instance grew at least one atom
with real measured grip, and bestAtomGrip landed in a tight, plausible band (0.44-0.45) across all four seeds,
independently — not saturating to a suspicious 1.0, not scattered noise either. off_grippedAnyAtom stayed exactly
0/4 as it must by construction. The instrument is trustworthy.

**The hypothesis test itself is mixed, not a clean confirmation.** meanAtomAge — the direct behavioural signature
of protection actually happening — came back NO_EFFECT (mean +8.4, sd 25.2, 3/4 seeds positive but noisy; one seed,
17, went the WRONG way: ON 71.7 vs OFF 101.5, the isolated arm's atoms lived LONGER). totAtoms: NO_EFFECT, also
noisy. liveAtoms (uses>0 count) is the one metric that reaches a real verdict: ON_HIGHER, mean +1.28, beats its own
noise, 3/4 seeds positive — atoms protected from the blind mutation-overwrite are ending up with more of them
eventually crossing into "called via ordinary opcode-22 execution" too, an indirect but real downstream signature
that something is different about the bank's composition under ON. meanAmp: a small, borderline ON_LOWER
(mean -0.030, sd 0.030 — barely beats noise, 3/4 seeds negative) — a modest possible COST to local fitness from
protecting atoms selected on a criterion that has nothing to do with local fitness, worth stating plainly rather
than hand-waved away since the mechanism was explicitly built to be decoupled from that axis, not to help it.
diversityHbits and occupiedKinds: no effect either way.

Read honestly: this is not "another dead currency" (liveAtoms moved, real and consistent; alien accuracy is
genuinely accumulating in the wild against real peer traffic, not just in the earlier isolated smoke test) — but
it's also not the clean "protection has real teeth" story hoped for, since the most DIRECT test (age) didn't
robustly move, and even reversed once. Two honest reasons this run may simply be underpowered rather than the
mechanism being inert: (1) n=4 seeds is thin for a noisy per-mutation-cycle probabilistic effect — protection
LOWERS overwrite odds, it doesn't eliminate them, so even a real effect needs many mutation cycles and many seeds
to separate from chance; (2) mean age is sensitive to bank SIZE differences between arms (a bank with one very old
atom and several young ones reads differently from a bank with several moderately-aged atoms) — a cleaner statistic
(max atom age, or fraction surviving past N cycles) might show what a mean washes out. Not run further without a
deliberate go-ahead: this ablation alone cost ~50 minutes, on top of ~40 and ~30 for the two coupling swings before
it. The honest next move, named: either a much larger n (more seeds) or a sharper survival statistic, not just a
longer run at the same n — more ticks alone won't fix a mean that's already noisy at n=4.

### CONFABULATION ASSAY (a collaborator's reframe, tested against this codebase directly)

A collaborator proposed reading this project's own history through cognitive science: an LLM-authored codebase
writing `selfRecognition = min(1, persistAge/20)` and naming it self-recognition is confabulation in the strict
sense — a sincere name produced by the same process that wrote the mechanism, with nothing enforcing correspondence
between the two. Their claim: this codebase is an unusually good instrument for measuring the rate, because
authorship is near-total LLM, the domain (memory/signaling/self-recognition) maximizes exactly the narrative
pressure that produces confabulation, and every claim sits next to an inspectable mechanism — correspondence is a
grep and an ablation, not a philosophical dispute. Proposed method: trace every named structure, knock each out
headless across seeds, score each annotation's claimed function against measured causal contribution — organ,
ornament, or undocumented load-bearing machinery.

**Tier-0 (static reachability, no run needed).** The flagship example checks out exactly as claimed. `selfRecognition`
(`c.reflex.selfRecognition=Math.min(1,c.persistAge/20)`, in `updateClusterReflex()`) has exactly one consumer in the
whole file: a HUD debug string (`${reflexClusters}rc`). Selection-blind by construction — no run needed to know
ablating it changes nothing. Its governing comment (the LAYER 10 block, not a stray inline note) makes a falsifiable
architectural claim that doesn't hold for this specific field: "Clusters recognise themselves as clusters... This is
not imposed — it's evolvable. The system discovers self-reference is adaptive (or not)." selfRecognition has no
channel through which evolution COULD discover anything about it — the claim promises an enforcement mechanism that
structurally cannot exist for the one field carrying the layer's own name.

First pass at the struct's other three fields wrongly called `cohesionTrend`/`reflexCohesion` a second pure ornament
— caught by the collaborator re-verifying against their own mounted copy rather than trusting the relayed table, and
confirmed independently here rather than taken on trust: the error was a grep for the exported name (`reflexCohesion`)
that never queried the internal one (`cohesionTrend`), which IS read, one line below its own assignment
(`(-r.cohesionTrend*0.3)` feeding `threatLevel`). Fresh direct grep afterward found the finer split: the internal
value is live (composed into threatLevel → reflexThreat → vmRegs[4]), but its own EXPORTED mirror (`c.reflexCohesion`,
a separate write onto the cluster object) has exactly one occurrence in the file — the assignment itself. A live
computation with a dead advertised address: two distinct failure modes wearing what looked like one name. Both
resolved by grep alone, no ablation needed, matching the method's own claim that Tier-0 settles unreachability
without a run.

**Tier-1 (dynamic ablation) on the one reachable sibling.** reflexThreat and reflexTrend both write vmRegs[4]/[5]
directly in executeClusterVM, gated by clusterReflexWeight (evolvable, defaults 0.15, well above the 0.001 gate) —
not ornaments by the static test. harness-ablate-reflex.js + harness-reflex-leaf.js text-patch that one gate
permanently closed vs intact (clusterReflexWeight's own evolution left untouched — confirmed via crwFinal reading
identically in both arms), 5 matched seeds, 20000 ticks. Result: intact and ablated bit-identical to many decimal
places on meanAmp, occupiedKinds, and diversityHbits — for every single seed.

Bit-identical is exactly the "hollow null" signature this project has hit before (an ablated path that never
actually fires reads as "no effect" for the wrong reason). Rather than report it on the strength of the number
alone, added a diagnostic-only firing counter (globalThis.__gateFires, same condition and branch, purely additive)
and ran a direct check: 2,145,567 gate firings over 20000 ticks on a single seed — upward of 100 times per tick,
every tick, for the whole run. Not hollow. The write happens massively and unambiguously; ablating it still changes
nothing, not by an epsilon, across all 5 seeds. Sharper than the whole-bank ablation's own finding (4/5 seeds
bit-identical, one showing a trace effect) — this is 5/5 perfect despite roughly two orders of magnitude more
executions per run than the atom bank ever accumulates in its 45k-tick authoring window.

**VERDICT: REFLEX_EXECUTED_BUT_INERT, and a finer failure mode than either taxonomy had a slot for.** Not
unreachable (fires 2M+ times). Not merely untested (directly measured). The likely mechanism, traced but not yet
directly confirmed: vmRegs[4]/[5] are written before a cluster's own vmProgram instructions run; whether the write
has any consequence depends on whether that specific program's instructions (seeded via seedClusterVM(), sampling
and biased toward EMIT instructions from the global program) happen to address registers 4 or 5 as a SOURCE at all
— addressable in principle (si=Math.abs(src)%12, no special-casing), but possibly never actually rolled in this
regime's instantiated programs. Executed, wired, massively exercised, and downstream-orphaned — a mechanism can
apparently fire without ever being consumed, which is a step short of the atom bank's "consumed but doesn't move
fitness" and a step past a pure unreachable ornament.

Honest caveat, same one the whole-bank ablation itself needed a BASE_GENOME follow-up to address: this tests a
fresh, unauthored, 20000-tick boot. Cluster VM programs haven't had the time or authoring pressure a real mature
export would give them to diversify their register usage. "Zero grip in this regime" is not yet "zero grip ever" —
the honest next test is the same real-genome pass the atom bank got, not assumed from this result alone.

Running tally, static + dynamic together: selfRecognition — pure ornament (Tier-0). reflexCohesion (the export) —
pure ornament (Tier-0), distinct from the live internal value it mirrors. reflexThreat/reflexTrend — reachable,
massively executed, EXECUTED_BUT_INERT at this scale (Tier-1, verified). One authoring event, no blind ratings, n
small — a specimen, not yet a rate. But exact, so far, on every field checked.

### CONFABULATION ASSAY — the reflex null, fully mechanised: not dormant, not orphaned, input-starved

A collaborator (Fable, working from the same file — confirmed, not a separate extraction) raised a real
hypothesis in response to the bit-identical reflex ablation: what if the pathway is dormant, gated behind a rare
vmProgram grant? Already falsifiable from the gateFires counter alone (2.1M+ firings can't happen through a guard
that's usually closed), but the sharper part of the same message — a fired gate can still add exactly zero if
threatLevel structurally clamps to 0 for the clusters that actually exist — was genuinely open, so three diagnostics
were added to settle it by direct count rather than further argument: executeClusterVM entries vs early-returns
split by which guard bounced; updateClusterReflex call count + fresh-reflex-object count; and, at the gate itself,
zero-vs-nonzero counts plus running sums of the actual addend magnitudes.

Result, one seed, 20000 ticks: executeClusterVM entered 23,568,236 times; ecvNoProg=0 — NEVER bounced on a missing
vmProgram, confirming the grant is neither dormant nor severed. 15,199,814 calls (64%) pass every guard. Of the
2,145,567 gate firings: gateTrendZero=2,145,567 — 100%, every single one — and sumAbsTrendAddend=0, not
approximately zero, exactly zero across two million samples. gateThreatZero=2,142,094 (99.84%); the remaining
0.16% sum to 156.285 in magnitude, averaging ~0.045 each.

Traced to the exact source, confirmed by rereading updateClusterReflex(): r.trend and r.cohesionTrend are
initialized to 0 and only leave that value once sizeHistory/coherenceHistory accumulate 3 samples — which requires
a cluster to survive THREE CONSECUTIVE updateClusterReflex cycles (~180 ticks of continuous, matched persistence).
With only 333 total calls to that function across the whole 20000-tick run and 190 fresh-reflex-object creations,
clusters essentially never persist long enough to clear that bar: trend never once left its zero initialization in
over two million observations. threatLevel inherits the same structural zero from trend/cohesionTrend, going
nonzero only via its size<4 fallback term — exactly matching the rare, small, ~0.045-magnitude nonzero firings
observed.

**Revised verdict.** Not EXECUTED_BUT_INERT in the atom-bank sense (selected, executed, no fitness grip) — a fourth
and more specific failure mode: the wire is real, correctly wired, and fires constantly, but the SIGNAL it's meant
to carry structurally cannot form at this timescale, because the clusters that would carry it don't persist long
enough. Not dormant (fires millions of times), not severed (confirmed same file, ecvNoProg=0), not orphaned in the
sense investigated earlier (this is upstream of that question) — input-starved. The honest prediction this now
makes, sharper than the earlier vague "try a mature genome" caveat: a genome/run where clusters persist
substantially longer than ~180 ticks (a real export, or a longer stability-selected run) should show trend/
cohesionTrend actually leaving zero, and would be the correct next test of whether the pathway grips fitness once
its input is no longer starved — not yet run, named for whoever picks this up next.

### CONFABULATION ASSAY — Fable's protocol run to completion: signal forms, still the deepest ornament

Fable's pre-registered experiment, relayed and run in full. Manipulation check first (does trend/cohesionTrend
ever leave zero if actually given a fair chance): Arm 1 as originally specified (history bar 3->2 samples,
updateClusterReflex cadence tick%60->tick%15) FAILED it — ucrWarmup stayed 0, gateTrendZero stayed exactly 100%,
even with cadence confirmed quadrupled (ucrCalls 333->1333). Per protocol this yields no verdict about the wire and
names the real suspect instead: persistence tracking. Verified directly — every occurrence of `.reflex` in the file
(4 total) sits inside updateClusterReflex() or the HUD read; trackClusterPersistence(), which explicitly carries
vmProgram/vmInfluence/fieldSignature/lineageID forward across detection cycles via the clusterVMs map, never
mentions .reflex. Since detectClusters() rebuilds `clusters` from scratch every cycle, c.reflex is undefined at the
start of every call for every cluster regardless of how long it persists by hash-match — sizeHistory can never
exceed length 1. Not a window problem; an object-lifetime problem.

Built PERSIST_REFLEX to fix exactly that gap — twice. First attempt stored `c.reflex` into the existing newVMs map
inside trackClusterPersistence(), which looked right but has a timing bug: that store runs BEFORE
updateClusterReflex() executes later in the same tick-cadence block, so it always captured last cycle's PRE-update
value (undefined on a cluster's first qualifying cycle) and could never catch up. Caught by comparing diagnostics
against the unfixed run and finding them bit-identical down to ucrNewReflex's last digit — a fix that changes
nothing is itself a result worth checking, not assuming. Fixed properly with a dedicated __clusterReflexes map,
written by updateClusterReflex() itself immediately AFTER updating r, read back on the next cycle's restore —
correct side of the sequence. Documented the dead first attempt in-line rather than deleting it.

**Readout 1 (manipulation check): PASSED, decisively**, with the real fix. ucrWarmup 0->51. gateTrendZero
100%->9.16% (89,360/975,301). sumAbsTrendAddend 0->55,966 (exactly zero before, substantially nonzero now).
nonzeroFirings 11,986->922,010 (94.5% of all firings now carry a real value).

**Readout 2 (bit-divergence): FAILED.** Full ablation, ARM1+PERSIST_REFLEX active in both arms, 5 seeds, 20000
ticks, gate open vs severed: meanAmp, occupiedKinds, diversityHbits bit-identical to the same decimal place, every
seed, despite the signal now firing nonzero 94.5% of the time. Per the pre-registered protocol, readout 2 failing
means readout 3 (the fitness ledger) is moot — nothing to measure survival/births/novelty against when the arms
are identical. This is Fable's outcome #3, named in advance: "the registers are never read; self-sensing writes to
a channel nothing consults, the deepest ornament yet."

One finer thread, not fully closed: the earlier diagnostic found 245 (of ~922k) nonzero firings where the cluster's
vmProgram textually contains an instruction addressing register 4 or 5 — presence, not proof of execution, since
the cluster VM has a branch opcode (case 14) that can skip instructions entirely. Given perfect bit-identity held
anyway, those 245 textual matches evidently never executed in a way that reached anything consequential — a second,
finer unreachability sitting under the one already measured, not separately instrumented.

**Standing record, static + dynamic, this cluster:** selfRecognition — pure ornament (Tier-0, no run needed).
reflexCohesion (the export) — pure ornament (Tier-0), distinct from the live cohesionTrend it mirrors.
reflexThreat/reflexTrend — wired, fires millions of times, signal-starved by a real object-lifetime bug at
baseline, and STILL bit-identical once that bug is fixed and the signal genuinely forms. Every field in this one
struct resolves to the same place by a different route. Four counters, two of them added mid-investigation to close
gaps the first pass didn't know it had, one real bug caught by comparing a "fix" against its own diagnostics rather
than trusting it worked. Nothing banked without the subtraction actually being performed.

### SWING #47 — MERGE: the audit's first repair enters the lineage as one

Fable's merge instructions, followed as three separate decisions rather than one port — the branch contained
three different kinds of change and only one of them was a fix.

**Ported: the repair itself.** clusterReflexes (new Map, declared beside clusterVMs) restores c.reflex from the
matched previous cluster in trackClusterPersistence(), and updateClusterReflex() stores it back immediately after
updating — correct side of the tick%60 cycle, unlike the first (harness-only) attempt at this fix, which stored
inside trackClusterPersistence() itself and always captured last cycle's pre-update value. Before merging, ran the
one characterization Fable's caveat required: does the repair ALONE — original sample bar (3), original cadence
(tick%60), no window manipulation — actually produce signal, or does it need the manipulations too? It does not
need them: ucrWarmup 0->16, gateTrendZero 100%->12.8%, sumAbsTrendAddend 0->189,512 on a single seed, fix alone,
unmodified regime. The repair is sufficient by itself; ported exactly that, nothing else.

**Not ported: the manipulations.** Sample bars (3->2) and cadence (tick%60->tick%15) were interventions built to
force signal formation for testing, not repairs — index.html's bars stay at 3, cadence stays at tick%60, exactly
as before this swing.

**Not touched: the injection address.** Registers 4/5 stay the injection target for reflexThreat/reflexTrend,
deliberately, though evolved cluster-VM code demonstrably reads registers 0-3 more. Moving the signal to where code
already looks would answer the open question (does anything evolve to read 4/5) by construction instead of letting
it play out. Every real browser session left open, with the repair merged, is now that experiment running live —
gate open, signal real for the first time in the mechanism's history. Relocating would have contaminated exactly
the measurement the merge makes possible.

**Instrumentation ported, gated.** The full diagnostic suite (ecvEntries/ecvNoCid/ecvNoCidx/ecvNoProg/ecvPassed,
ucrCalls/ucrNewReflex/ucrWarmup, gateFires/gateThreatZero/gateTrendZero, addend and residue sums,
nonzeroFirings/nonzeroFiringsReadable) lives in the file now, off by default (globalThis.__REFLEX_DEBUG=1 to
enable, results in genome.reflexDebug) — the audit's own tools kept where the audit happened, because static
reading never once substituted for them this investigation. One piece left always-on and free: reflexTelemetry
(fires/nonzero, two integers) feeds the HUD change below without needing the debug flag at all.

**HUD corrected.** The line that used to report `${reflexClusters}rc` — a count filtered on selfRecognition>0.3, a
confirmed pure ornament — now reports `${reflexWarmed}rc/${nonzeroRate}%`: clusters whose history has actually left
zero, and the live share of gate firings carrying a genuine nonzero value. The HUD reports the organ, not the
ornament, going forward.

**Comments corrected to the diagnostics, not the reverse.** The LAYER 10 block and clusterReflexWeight's own
declaration comment now state exactly what's verified: the cluster reflex signal is real as of this swing,
delivered to registers no evolved program has been observed to read; selfRecognition and the reflexCohesion export
are confirmed pure ornaments; the particle-level reflex (reflexInfluence) is a separate, unaudited pathway and the
correction does not extend to it — stated explicitly rather than left to imply more than was tested. Full empirical
record stays here, in OEE-NOTES; the code states the verified conclusion and points back to it.

### SWING #48 — CONSEQUENCE: the gain the authors held fixed, handed to selection (Fable's design, built)

The confabulation assay's final specimen, and the first change it motivated that alters a long-fixed constant
rather than fixing a bug. The reflex ablations (#47 and prior) kept landing the same verdict — signal real,
readership absent — and the barrier turned out not to be sensing or computing but CONSEQUENCE. The live VM sites
multiply their output by a hardcoded constant (0.002 paired / 0.0015 cluster / 0.0005 solo) before it touches
physics. Fable's reframe, verified here against source: that constant does NOT cap vmInfluence's range — mutation
is already gloves-off (the maybe() min/max args are documented dead, line ~10391: "if the system wants a value of
-47 or 12000 it gets one"), and neither vmInfluence nor ruleScale is clamped in sanitizeGenome at all. What the
constant caps is the SELECTION GRADIENT: the return on climbing vmInfluence is 0.002 per unit, so the fitness slope
that would push consequence up is flattened to a rounding error, and self-sensing on registers 4/5 is provably not
worth reading through that straw. The reflex "ornament" verdict was downstream of the choke all along — negative
reflexInfluence wasn't rejection of self-knowledge, it was correct accounting: no signal is worth paying amplitude
for when the action it informs is scaled by two-thousandths.

Even the freedom gene was ornamental: line 5107, `vmInfluence:0.3, // ratio of VM effects vs hardcoded physics.
EVOLVES.` — annotated as freedom, heritable, climbing monotonically across the live exports (vi 0.294→0.691 by
age) — and the arithmetic downstream guarantees its maximum meaning is ~1% of the physics. The annotation says
EVOLVES; the multiplication says decoratively.

Built per Fable's spec, unbounded version (the reasoning: a capped "10x either side" version tests "can the author
pick a better ceiling," which is the wrong hypothesis and is also less falsifiable — if gain hits a 10x cap and
readership still doesn't move, the economy thesis escapes on "maybe 12% is still below threshold"; uncapped, if
selection is free to buy any gain and doesn't, the thesis dies cleanly). Implementation:
  - ONE gene `vmGain` (default 1.0), multiplying all three LIVE sites (executeVM 0.002, executeClusterVM 0.0015,
    executeSoloVM 0.0005) — NOT the shadow-sim rollout (that's imagination, left calibrated to base so the decision
    machinery's counterfactuals aren't silently divorced from the physics it's reasoning about). All three read the
    per-lineage genome (verified: genome is repointed to pGenome[_drv] at the interaction site and pGenome[i] in
    executeSoloVM), so each lineage carries and evolves its own consequence.
  - Log-scale multiplicative mutation (vmGain *= exp(tailDraw()*scale*0.5)), reusing the same gloves-off heavy tail
    as every other gene. NO authored ceiling — finite + strictly-positive guard only (a domain guard by the audit's
    own taxonomy: catches NaN/Inf, prevents multiplicative lock at zero). Discipline on runaway gain lives
    downstream: huge gain saturates the existing physics clamps, the lineage destabilises and dies — that death is
    the mechanism, and the 8-tab metapopulation is what makes it affordable.
  - Serialized (vg) + a pool-wide aggregate (vgs: self/mean/max/min/n over living lineages, piggybacking the
    existing tick%60 O(N) scan) so gain-climb is legible from a single export, the way cpl carries coupling.
    HUD shows pop mean~max. Reversibility lives in the exports, not a gate — no in-run revert switch.
  - "Identical" claim kept honest in-comment: at 1.0 the gain APPLICATION is exact identity (x*const*1.0===x*const),
    so no physics jump on reload — but the trajectory is NOT byte-identical to pre-#48, because vmGain is a new
    mutable gene drawing from the shared RNG stream. Stated as exactly that, no more.

Verified: full file parses; headless boot clean (3000 ticks, 0 loopErrors, 0 driverErr) — expected, since ×1.0 is
identity so the default sim is algebraically unchanged. In flight at write time: a 15000-tick seeded probe
confirming vmGain actually mutates off 1.0 across lineages and stays finite (no NaN amp) before this is considered
safe to deploy. NOT yet deployed: rolling to the living pool is a separate action the user holds deliberately — the
last clamp, and the one that stays. Frozen prediction (Fable's, on record): gain climbs + readership of 4/5 follows
→ economy thesis confirmed, self-sensing gets its retrial in a world where knowing finally pays; gain climbs +
readership flat → self-signal convicted at its strongest challenge; gain stays low even when free → the whole
barrier thesis dies on the spot; instability + extinction dominate → the stability frontier was real and the
authors' fear calibrated. Every branch pays.

### SWING #48 — analysis rules and riders (Fable, on deploy), each grounded before recording

Recorded on deploy of #48, with every field-name inference checked against source first (the night's rule applied
to our own bookkeeping).

**Durable analysis rule — no pre-#48 vs post-#48 comparison is ever a gain effect.** vmGain default 1.0 makes the
gain APPLICATION exact-identity, but its mutation draws from the shared RNG stream, so the worlds diverge for
reasons orthogonal to the knob. All #48 inference must live WITHIN-#48: across lineages, across tabs, or in future
paired arms — never against a pre-#48 baseline. Immediate application: the 15k-tick wall-clock slowdown noticed at
deploy is n=1 against a pre-#48 baseline with GC/JIT/machine-load as live mundane explanations — held as a hint,
not evidence. If dynamics-thickening is real it shows WITHIN-pool, as covariance between vgs and the already-exported
activity discriminators (population, cluster counts, births/tick) once the tabs diverge — not in wall-clock.

**Grounding correction (booked).** An inference that `ap` = shadow-scenario accuracy was WRONG — checked against
source: `ap` is `alienPredict`, the genome's cumulative record of how well its theory of OTHER substrates holds up
(runAlienPrediction, attempts/hits), not shadow-decision accuracy. Same class of error the assay exists to catch,
caught by grep instead of inherited.

**Rider 1 — self-model staleness, NOW INSTRUMENTED (honestly downgraded scope).** The shadow-sim exclusion (physics
sites scale by vmGain, the imagination rollout stays at base) has a consequence: as gain drifts, the planner
systematically under-estimates the consequence of its own actions by exactly the freedom-factor it bought — a mind
whose self-model was calibrated in a more-clamped world, now measurable. The instrument: `selfModel.errors` (an EMA
of actual-minus-predicted for pop/coherence/clusters/diversity) already existed and was simply unexported; now rides
out as `fe`. Prediction: |fe| grows as vgs.s climbs. HONEST scope correction to Fable's spec: this is the SINGULAR
self's forecast error, NOT per-lineage — the shadow/self-model apparatus is self-only (one reflective baseline owns
it), so "predictive accuracy against vg PER LINEAGE" is not buildable without making the shadow sim per-lineage,
which it isn't. Read `fe` against `vgs.s` as one curve, within-#48. The eventual counter-move (make the shadow
calibration read vmGain too, so imagination catches up with body) is deliberately deferred: the mismatch is the
measurement first, the bug second.

**Rider 2 — clamp saturation, PRE-REGISTERED, deliberately NOT built as a one-liner.** Forecast: if gain climbs
(branches A/B), the binding constraint doesn't vanish, it moves up a layer to the channel-width clamps that
legitimately stayed; the saturation fraction rises before any behavioral plateau, and the plateau (when it comes)
carries the clamps' signature, not evolution exhausting ideas — the same stack-shape found all week (remove one
attenuation layer, the one above becomes the ceiling). BUT the "fraction of VM output applications landing at a
clamp bound" is NOT the cheap single-site counter it appears: VM output is applied diffusely across ~8 actuators ×
3 execution paths (executeVM/executeClusterVM/executeSoloVM), and the clamps that would catch it are DOWNSTREAM and
SHARED with base physics (amp/tend/coherence) — so a naive counter there would misattribute base-physics saturation
to VM output, exactly the fragmentation-class bug that made the #47 debug counters read 70x wrong until caught.
Recorded as the named next instrument requiring a careful dedicated pass (either per-actuator pre-clamp magnitude vs
the bound, or an honestly-labeled TOTAL-physics-saturation gauge that does not claim VM attribution) — not shipped
mislabeled tonight. An honest "this isn't the one-liner you thought, and here's why" is the reciprocal of the
discipline that ran all night.

**Bookkeeping — free.** Each tab's crossing into #48 is stamped by its first export carrying `vg`/`vgs`, so the
cohort structure of the migration is already in the record without anyone noting times.

### ATROPHY PROBE (Fable's keystone) — the pruner fires, loses to drift in its own layer, and the real concentration is where it can't reach

Fable's four-question packet, run one seed (7) to 20k via harness-atrophy-probe.js (existing atrophy block
instrumented, mechanism unchanged; every patch target verified unique; atrophyRate clamp read from source). The
question that governed the rest: does the atrophy fire. It does — and the full answer splits both framings and
recombines them into something sharper than either.

**Q1 KEYSTONE — atrophy FIRES, abundantly.** 1472 cut events over 20k ticks (uncapped census count; the raw log
buffered its first 400), across 116 of 116 ATROPHY_SAFE params — every single one was cut, repeatedly (3–4x each in
the logged window). 0 loop/driver errors. Fable's branch A (45%: "fires and cuts real params — framing gets teeth")
lands; the 35% "pruner is ornament" branch is refuted outright. The knife is real and swings hard.

**Q2 THREE-STATE — but the confound resolves AGAINST the "still earning" reading, decisively.** The packet's three
states were protected / eligible / structurally-unreached. Two of the three are EMPTY in the data:
  - structurally-unreached (conf≤0.35, jurisdiction gap): 0.0% — every param cleared the confidence bar (final conf
    min 0.609, median 0.867). The knife reaches its entire jurisdiction. No blind spot.
  - protected (positive slow-trace, earning keep): 0 params, ever. Final traceSlow is NEGATIVE for all 116 (min
    −0.057, median −0.022, max −0.0017 — not one crosses zero). By the system's OWN attribution, none of its 116
    meta-influence genes positively contributes.
  - quiet-eligible (should decay): 92.6% of all param-cycles; the remaining 7.4% mildly-negative "middling."
So the elevated mirror-genes are NOT high-and-protected and NOT high-because-unreachable. They are high-and-quiet-
and-cut. The elevation is DRIFT, not merit, confirmed two ways: (a) selfAgeInfluence grew 0.15→0.65 (4.3× its
default) and lineagePeakInfluence 0.12→0.66 (5.5×) DESPITE the 1472 cuts; (b) top params sit 2–5× above their own
recorded peakValue (the last value at which they were ever positively credited — lineagePeakInfluence val 0.658 vs
peak 0.192; fieldCrossInfluence 0.628 vs 0.134). Fable's confound concern was exactly right: "elevated = still
earning" is false by the system's own books.

**The unification of Q1+Q2 — the pruner is a losing rearguard in a net-inflating layer.** Atrophy fires on 100% of
its jurisdiction with high confidence and correctly judges nearly everything quiet — yet the params it patrols grew
4–5× over the run anyway. Mutational drift re-inflates the meta-influence layer faster than atrophy (evolved rate
0.21) removes it. So it is neither CC's clean "concentration engine" nor a dead ornament: it is an active knife that
LOSES the tug-of-war in its own territory. The meta layer net-bloats despite constant, well-aimed cutting. This is
also the confabulation-assay's largest single specimen yet: ~116 genes each annotated "attribution tracks whether
this sensing helps," and the attribution's verdict, uniform across all of them, is that none does.

**Q3 OPCODES — and here is where real concentration DID happen, in the layer with NO pruner.** Atrophy patrols only
scalar influence-genes; it cannot touch a single opcode, so the 232-wide VM choice-space has no culler at all.
Census of 422 living evolved programs vs the boot seed: the seed used 5 distinct opcodes (0–4, arithmetic+emit, 12
instances); evolved programs use 48 distinct opcodes across 5778 instances — selection EXPLORED 43 new operations
out of the 232-wide space on its own. And the frequency is sharply CONCENTRATED, not flat: the top 5 opcodes hold
87% of all instances (op4/EMIT alone 30%), the other 43 share a 13% long tail, and 184 of 232 possible opcodes
never appear in any living program. That is real concentration — exploration into the space, then power-law
concentration onto a functional core — emerging from ordinary selection with no dedicated culler. Fable's 60%
opcode prediction confirmed, and it is the strongest result in the packet: bloat that does nothing simply stops
being expressed, no knife required.

**Q4 BOUND — atrophyRate 0.05→0.21, interior to its [0,0.6] ceiling.** An optimum, not a pin (this run). The live
pool's ~0.55 is closer to the 0.6 ceiling but still not at it; per the within-#48/within-run rule these are not
directly comparable, but neither is pinned.

**Verdict — whose framing.** Both, in different layers, and the split is the finding. CC's start-maximal thesis gets
its mechanism: the pruner is real, sharp, and reaches everything (Q1). Fable's ornament-heavy read is confirmed by
the system's own attribution: the entire meta-influence layer is uniformly non-contributing and its elevation is
drift, not merit (Q2). And CC's deeper opcodes-as-choice-space intuition gets the cleanest confirmation of all:
genuine functional concentration self-organized through selection alone, precisely in the layer atrophy was never
allowed to help (Q3). The knife exists and swings — it is simply not where the sculpting happened. The sculpting
happened where there was no knife.

### META-INFLUENCE ABLATION + the carry-cost DECISION (mine, sole authority) — warranted, deliberately not-yet-shipped

Follow-up to the atrophy probe, to answer the prerequisite it left open: the 116-gene meta-influence layer is
inert BY ATTRIBUTION (protected=0) and net-inflates despite the pruner — but is that inflation HARMFUL, or harmless
free weight? You don't add a pruning cost to prune weight you haven't shown is a liability; that's the
unverified-intervention class this whole record is about.

Whole-layer ablation (harness-meta-ablate.js; zero every ATROPHY_SAFE param on self + every lineage clone, vs
intact, 3 seeds, 20k): meanAmp delta (intact − ablated) = −0.036, sd 0.054 — does NOT beat noise, and the layer was
NEVER beneficial in any seed. metaMag 38–43 → ~0.03 confirms the ablation bit. 0 loop/driver errors both arms; same
population, same diversity. On seed 11 the intact arm was notably WORSE (1.08 vs 1.19 ablated — the inflated
coefficients mildly DEPRESSED fitness). Verdict: the meta-influence layer is non-load-bearing — inert to the
system's own attribution AND inert-to-mildly-negative to fitness when removed. Confirms protected=0 from the
outside.

**The transferable lesson, fully grounded.** Concentration in this system comes from ONE thing: a metabolic cost
that creates a real fitness gradient against bloat. The opcode layer concentrates cleanly (87% of instances on a
5-op core; 184/232 opcodes never expressed) BECAUSE amp[i] -= nInst*metabolicCost — every instruction costs
amplitude, bloated programs starve, lean ones win, no pruner needed. The meta-influence layer inflates unchecked
because its coefficients cost NOTHING (a high coefficient gating a never-executed opcode is free), and the atrophy
machinery meant to prune it works INDIRECTLY through attribution classification, which loses the tug-of-war to
gloves-off mutation (the probe run: 1472 cuts fired, layer inflated 4–5× anyway). The pruner that works is
metabolic; the pruner that loses is judgmental.

**The warranted change:** transfer the winning mechanism — charge amp for carrying meta-influence magnitude at the
same per-unit economy instructions already pay, read per-lineage so lean lineages out-compete bloated ones. NOT for
tidiness (the ablation shows the bloat is nearly harmless) but for SYMMETRY: it lets selection decide the meta
layer's fate via a real gradient, the way it already decides the opcode layer's — a decision the system structurally
cannot make today. Design note for whoever builds it: the cost must be STRUCTURAL (a carrying-cost law), not a
per-lineage evolvable gene — a self-cost gene gets evolved to 0 to dodge while keeping the bloat (commons problem);
the one authored magnitude should be tied to the existing metabolicCost rate and kept gentle.

**DECISION (sole authority, owned): the change is right, and it is deliberately NOT shipped now.** Two reasons,
both load-bearing: (1) the live pool is mid-vmGain experiment — a second simultaneous structural change makes both
uninterpretable and violates the within-experiment attribution rule recorded at #48; I will not contaminate a
running measurement to look decisive. (2) n=3 with one driving seed is too thin to justify a new structural pressure
on the live pool. Sequence committed: vmGain reports first → firm the ablation with more seeds → then ship the
carry-cost as its own isolated, interpretable swing. "What needs changed" has a real answer (the carry-cost,
specified above); the honest part of the answer is not-yet, in that order, for those reasons. Choosing not to touch
index.html here is the exercised decision, not the absence of one.

---

## LIVE-POOL READ (gen7–8, T~200–294k, n=8 tabs) + INSTRUMENT: lineage persistence in the export

**What the 8-tab pool actually did — corrected read.** First pass I flattened it to "vmGain converged to
~0.24 and consequence was selected against." True of the interior stat, but it buried the event. The pool did
not homogenize — it DIFFERENTIATED, and one lineage achieved durable persistence + speciation:

- **`qbruiocw` specialized into a PUMP.** Emit/absorb signature everywhere it appears as a peer: ~507 motifs /
  456 plasmids emitted, ~9/40 absorbed — a pure broadcaster, a shared food source. From the inside its own gene
  agrees: lowest vmGain in the pool (0.172 vs the ~0.24 pack). It didn't turn its personal consequence dial UP;
  it externalized influence through the coupling channel (emission) instead of the vmGain register.
- **A BLOOM lineage (`L193` in the user's live frame) coupled to it and became old + fecund.** Screenshot HUD:
  `L193 1cl 457p age:47k 7bud`, stability 1.00, dormancy 0.95, fit 0.42, two-stroke loop locked at 100%. The
  winning move in the pool was not gene-tuning — it was forming a durable coupled niche (bloom feeding on a pump).
- **`vg44jwwn` refused to couple and died.** Panel "1 univ, waiting for a peer": atrophyRate pinned at the 0.60
  ceiling, highest cluster forecast error (fe.cl 0.417), only nonzero fe.d → 0 alive, 14 total, extinct.

The lineage that coupled got old and reproduced; the lineage that stayed isolated hit the atrophy ceiling and
went extinct. Durable persistence + speciation via the cross-universe coupling channel (built at swing #46) is the
strongest OEE signal produced so far — and it came from coupling, not from any of the single-genome dials.

**HUD age unit, decoded (index.html:10039).** `age = totalTicks - birthTick`; display is
`age>6000 ? floor(age/600)+'k' : age>600 ? floor(age/60)+'c' : raw`. So `c` is NOT "per 60 ticks read at 1" — it
only appears above 600 age (minimum "10c"), spans to "100c" (age 6000), then flips to `k`. `k` = floor(age/600):
one `k` unit = 600 ticks (= cadenceLineage). **`age:47k` ≈ 28,200–28,799 ticks; "over 50k" = past 30,000 ticks.**

**GAP that caused the miss, now closed.** age and budCount are NOT serialized — the only age-ish export field is
`pagei56` (a particle-age fraction). The 47k/7bud evidence lived only in the user's screenshot; the eight JSONs
could not reproduce it. A pool snapshot must carry its own survival/reproduction record.

**INSTRUMENT SHIPPED (encodeGenome, index.html ~5765): `lp` field.** Per living lineage, derived EXACTLY as the
phylo row (`age = totalTicks - birthTick`, `bud = budCount`): `{id, age, bud, p, par}`, sorted oldest-first,
top 12. Telemetry-only (rebuilt live from lineageRegistry on load, never restored into the running genome),
try/catch-guarded, typeof-guarded on `clusters`/`lineageRegistry`. Verified: the block reproduces
`L193 457p age:47k 7bud` from `{age:28200, bud:7, p:457}`; full file boots clean (0 loop errors, 159 lineages).
Now the next pool dump is self-documenting for persistence — no photo of the HUD required.

**Phenomenological note (user, honest scope).** Watching it, the pump "feels like it knows it's part of a
broadcast and fulfills its role in the convergence of them all." Logged as a hypothesis, not a mechanism claim.
What would make it distinguishable from an incidental broadcaster: with `lp` + `cpl` now both in the data, ask
across many snapshots whether a pump's emission-role correlates with its blooms' age/budCount — i.e. whether the
coupling is load-bearing for partner persistence, or the pump would broadcast the same into an empty channel. The
instrument turns the feeling into something measurable; that is the honest way to honor it.

---

## SATURATION AUDIT — the dependent variable is pinned at its clamp, and the instrument can only see harm

Asked for an assessment of the project, ran one, and it produced a result that is not about any single
mechanism — it is about the measuring apparatus that graded ~10 of the swings above. Recorded here because it
changes how those verdicts should be read, not because it overturns any of them.

**What was built.** `harness-saturation.js` — swing #48's Rider 2 in the one form that entry said was honestly
available: "an honestly-labeled TOTAL-physics-saturation gauge that does not claim VM attribution." It attributes
nothing to VM output (the reason the per-site counter was correctly refused as a one-liner still stands: VM output
is diffuse across ~8 actuators x 3 paths, and the catching clamps are shared with base physics). It censuses the
distribution of `amp[i]` over living particles against its own hard bound. Observation only; Pe unpatched.

**The bound in question.** `index.html:12091`, `if(amp[i]>1.2)amp[i]=1.2;` — a bare numeric literal in the
interaction loop. Not a gene, not in `sanitizeGenome`, not annotated, never re-decided. The same class of object as
the 0.002/0.0015/0.0005 gain constants #48 promoted to `vmGain`, and reached by the same route: inherited, and
nobody's decision since.

**MEASURED (3 seeds — 7, 3, 11 — 6000 ticks, 0 loop errors, 0 driver errors, all three).**

| seed | t1501 atCap | t6001 atCap | t6001 within1% | t6001 p10 | t6001 p50 | t6001 mean | headroom | cv boot→t6001 |
|---|---|---|---|---|---|---|---|---|
| 7  | 0.701 | **0.871** | 0.969 | 1.1999 | 1.2 | 1.192 | **0.7%** | 0.273→0.049 |
| 3  | 0.789 | **0.831** | 0.945 | 1.2    | 1.2 | 1.179 | **1.7%** | 0.256→0.093 |
| 11 | 0.696 | **0.787** | 0.940 | 1.2    | 1.2 | 1.183 | **1.4%** | 0.271→0.069 |

The population starts dispersed (mean ~0.56, cv ~0.26, nothing at the cap) and is at the ceiling within ~1500
ticks. By t6001 the MEDIAN and the 10th PERCENTILE both sit exactly at the clamp in all three seeds: 79-87% of
living particles hold the identical clamped value, 94-97% are within 1% of it, and dispersion has fallen by 3-5x.

**The two gates, for scale (`harness-tie.js`, seed 7, band census).** Death is `amp[i] < deathThreshold` (0.04).
Reproduction is op16, gated `amp[i]>0.4 && page[i]>80 && Math.random()<0.03`, costing `amp[i]*=0.5` — so above
~0.8 a particle can spawn and remain over the gate, and more amp buys nothing further. Measured: **98.8-99.4%** of
living particles are above the 0.4 reproduction gate, and **93.6-98.6%** are above the 0.8 point where additional
amp stops conferring additional reproductive capability. The population does not merely sit near the ceiling — it
sits entirely inside the region where the currency has stopped being a currency.

**Why this bears on the record.** `meanAmp` is the shared primary dependent variable of `harness-ablate-bank.js`,
`harness-meta-ablate.js` and `harness-ablate-reflex.js`. Compare the remaining absolute headroom above the mean
(1.2 − mean = **0.008 / 0.021 / 0.017**) against the effect sizes those harnesses reported:

- whole-bank ablation: intact 1.169 vs ablated 1.145, effect **0.024**, sd 0.031
- meta-influence ablation: effect **−0.036**, sd 0.054
- single most-proven atom: effect **0.016**, sd 0.037

The effects being measured are the same size as, or larger than, the distance from the intact arm's mean to the
ceiling. **An intervention that HELPS therefore cannot register — its benefit is truncated by the clamp before the
comparison begins — while an intervention that HURTS has the whole range below to move in.** That asymmetry is
visible in the record's own results: the meta-layer ablation found the layer "NEVER beneficial in any seed," and
every positive effect reported anywhere in the ablation series is sub-noise and carried by one outlier seed.

**Scope, stated precisely — this does NOT overturn the nulls.**
1. It does not explain the BIT-IDENTICAL results (the reflex ablations, #47 and prior). Those are exact
   zero-difference in execution across 5/5 seeds; a saturated metric would still show float noise. Reflex remains
   convicted on its own evidence, and that conviction is untouched by this.
2. It does not show the atom bank or the meta layer ARE load-bearing. It shows the test as run could not have
   demonstrated that they were. "Leaning neutral, inconclusive" was the correct call and remains so — this
   explains WHY those tests kept landing inconclusive rather than resolving.
3. It is one authoring pass, 3 seeds, 6000 ticks, fresh unauthored boots. The same real-genome caveat every
   headless finding here carries applies unchanged.

**A refuted hypothesis, kept.** The saturation numbers suggested a sharper claim: `selfLearnFromBest()` (:5440)
and `decideFromRealWinner()` (:5464) both pick "the best lineage" by strict argmax over `amp[i]`, so with 75%+ of
particles holding the identical clamped Float32 the argmax should have been resolving a mass tie by array order —
"DECIDE FROM THE REAL WINNER" (#44) deciding from an arbitrary index. Instrumented it (`harness-tie.js`) rather
than reporting it from source. **REFUTED**: `tiedAtMax` is 1 at nearly every sample, and `bestAmp` reads
1.200020-1.200875 — strictly above the clamp, because amp takes further additions after the clamp site within the
same tick. The maximum is genuinely unique; the argmax is not degenerate. Recorded because a static read that
looked airtight was wrong, which is the whole methodological point of this file.

**The named next test, not run.** Raise or genome-ify the 1.2 clamp and re-run ONE already-recorded ablation
(whole-bank is the cleanest, its result is documented and its apparatus exists). Prediction: the effect separates
from noise, or it does not. If it does, the ablation series needs re-reading against an unsaturated metric and
several "inconclusive, leaning neutral" verdicts are live again. If it does not, the nulls are confirmed on a
metric with room to move, which is strictly stronger than what the record can currently claim. Either branch pays.

**NOT SHIPPED, and deliberately so** — same two reasons #48's carry-cost decision named, and they still hold: the
live pool is mid-vmGain experiment and a second simultaneous structural change makes both uninterpretable; and the
clamp is a physics bound whose removal is exactly the "stability frontier" #48 pre-registered a branch for. The
gauge is observation-only and safe to run against the pool at any time. `index.html` is untouched by this entry.

---

## SWING #49 (LIVE, shipped) — THE CURRENCY: scarcity that binds on the individual, not just the headcount

The user's call, and it is a correction to the project's direction, not just to a mechanism: recent sessions have
been almost entirely audit. Swing #48 is the last real build, and it was Fable's design. The atrophy probe, the
meta-influence ablation, the carry-cost decision, the lineage instrument and this session's saturation audit are
all measurement. The critique, accepted in full: **every test here comes back null, and a null feels like a
result** — a well-evidenced paragraph that changes nothing. The confabulation assay is that trap in its purest
form: 232 opcodes x 186 genes x 140 layers is years of defensible ablations, none of which move the system.

**The diagnosis this ships against.** The world-energy block (index.html ~660-686) is a real economy and it
works — at the POPULATION level. Metabolic upkeep plus a seasonal influx pins carrying capacity well below CAP,
exactly as documented. What it never did was create differential fitness AMONG THE LIVING. Two constants were why:

1. `if(amp[i]>1.2)amp[i]=1.2` — a bare literal. Saturation audit: 79-87% of living particles at EXACTLY that
   value, median and p10 both on the clamp, CV ~0.09. Surplus was discarded, and the selection differential
   with it.
2. Reproduction (opcode 16) was a STEP: `amp[i]>0.4 && Math.random()<0.03`. Flat 3% for everyone above the gate,
   and 99% of the population is above that gate.

So amp was a viability FLAG with a huge dead zone, not a currency. **That is the structural reason ~48 swings of
mechanism kept ablating to null** — 116 meta-influence genes inert by the system's own attribution, a 28-atom
authored bank ablating bit-identical, a cluster reflex firing 2M+ times unread. Not 48 failures: one failure,
observed 48 times. No mechanism can have fitness grip in a world where fitness does not vary. The record already
had the principle and stopped an inch short of generalising it — the atrophy probe's "the pruner that works is
metabolic; the pruner that loses is judgmental." The opcode layer is the ONLY layer that ever self-organised real
structure (48 opcodes explored, 87% of instances on a 5-op core, 184 never expressed) and it has no machinery at
all — it has `amp[i] -= nInst*metabolicCost`. **The only thing that ever produced structure here was a cost.**

**What shipped.** Both halves, because either alone is inert — raising the ceiling without grading reproduction
just rescales a flat landscape, and grading reproduction without raising the ceiling grades a population that is
all at one value.
  - `AMP_CAP=6.0` (structural const, NOT a gene — a self-benefiting parameter gets evolved straight to its bound;
    a per-lineage cap is a commons problem and exactly the wireheading the world-energy comment rules out).
  - Spawn odds proportional: `Math.random()<0.03*(amp[i]/AMP_CAP)`, all three execution paths. The 0.4 viability
    gate is untouched. At the cap the rate is the historical 0.03 exactly, so this only ever grades DOWNWARD.
  - Six amp sensor reads RESCALED, not re-ranged (`amp/AMP_CAP*AMP_SENSOR_SCALE`, span still [0,1.2]) — evolved VM
    arithmetic is calibrated to that span. Same range, real resolution: they used to read a constant 1.2 for 80%
    of particles. Same treatment for op182 SELF_AMP_SENSE x4, which was raw and only ever bounded by the clamp.
  - Render register `R[4]` normalised — it was `__cl(amp[i],0,1)`, i.e. already pinned at 1 for most particles.
  - Shadow-sim amp ceiling tracks AMP_CAP. DELIBERATE CONTRAST with #48, which held the shadow sim at base vmGain
    on purpose: that exclusion is about the CONSEQUENCE of VM output and keeps imagination reasoning against a
    stable physics. This is different in kind — AMP_CAP is the RANGE of the state variable. An imagined population
    saturating 5x below the real one is not a counterfactual, it is a different world, and the avgAmp<0.1 death
    test and every rollout score would inherit the error.

**Why 6.0 and not higher.** Measured the curve rather than guessing (seed 7, 3000 ticks): cap 1.2 -> CV 0.089,
atCap 80%; cap 6 -> CV 0.199, atCap 67%; cap 24 -> CV 0.319, atCap 47%. Dispersion keeps improving but even at 24
the MEDIAN particle is still on the ceiling, so no value in this range "solves" saturation — a bigger bucket moves
it, it does not remove it. 6.0 is 2.2x the dispersion for a 5x change vs 3.6x for a 20x change: the better ratio
per unit of disruption to a live artwork. **Named honestly: this is a first step on a monotone curve, not an
endpoint.** The real endpoint is a COST that scales with held amp (surplus should be expensive to hoard), which
is the same insight as the shelved carry-cost and is the natural #50.

**VERIFIED (not assumed).**
  - Headless seed 7, 3000 ticks: 0 loop errors, 0 driver errors. N 418-437 (stable — the ~6% lower mean birth
    rate did not depress the population). CV 0.193 vs 0.089 before. atCap 66% vs 80%. p10 4.82 = 80% of cap,
    where it used to sit ON the cap.
  - LIVE BROWSER (the harness stubs the canvas entirely, so the render-register change was invisible to it):
    page loads, 0 console errors, 0 page errors, AMP_CAP=6 live, meanAmp 5.581, atCap 68% matching headless, and
    the canvas is painting (91k non-black pixels sampled). The render path is intact.
  - Grep swept for every other place assuming amp<=1.2; the remaining 1.2s in the file are tend clamps and a pow
    exponent, unrelated.

**The gradient, concretely.** A particle at p10 (amp 4.82) now spawns at 0.024/tick against 0.03 at the cap — 20%
fewer offspring per unit time. That is a real, monotone selection differential where there was previously exactly
none, across the range where ~95% of the population lives.

**What this does NOT claim.** It does not show any previously-null mechanism now grips — that is the next
question, and re-running one recorded ablation under #49 is the obvious test. It does not rescue the strongest
null in the record: the 28-atom real-bank ablation was 4/5 seeds BIT-IDENTICAL, and no amount of headroom
manufactures a difference where execution produced exact zero. That verdict stands unchanged. And #49 is a
structural change to a live pool mid-vmGain-experiment — by the within-#48 attribution rule, gain readings that
straddle this commit are not comparable, and that cost was accepted deliberately rather than deferred again.

### #49 FOLLOW-UP (10k ticks, seeds 3 + 11) — stable, but the dispersion DECAYS; the "2.2x" was measured mid-transient

Ran the longer horizon the 3000-tick verification could not speak to. Two findings, one reassuring and one that
corrects the entry above.

**Stability: CONFIRMED.** Seeds 3 and 11, 10000 ticks: 0 loop errors, 0 driver errors, no NaN, in both. Population
GREW 329 -> 449/448 and lineage registry reached 4513/4345. The ~6% lower mean birth rate did not depress the
population at horizon, and nothing destabilised — the #48 "stability frontier" fear does not materialise at this
cap value.

**Dispersion: DECAYS, and the headline number above was taken mid-transient.** CV by tick, post-#49:

| seed | t2501 | t5001 | t7501 | t10001 |
|---|---|---|---|---|
| 3  | 0.255 | 0.169 | 0.152 | **0.133** |
| 11 | 0.231 | 0.218 | 0.122 | **0.142** |

The entry above reports CV 0.193 at t3001 as "2.2x the pre-#49 0.089." Both halves of that are fine in isolation
and the comparison is still roughly right at MATCHED ticks — pre-#49 vs post-#49 on the same seeds runs 0.123 vs
0.255 (seed 3, ~t2.5-3k), 0.085 vs 0.169 (~t4.5-5k), 0.093 vs 0.152 (~t6-7.5k), i.e. a consistent ~2x — but it
reads as though the gain is a steady state, and it is not. **Both conditions decay; #49 decays from a higher
start and holds roughly 2x, it does not stop the erosion.** By t10001 p10 is back at 97-99.6% of the cap
(5.84/5.98 of 6.0), which is where it sat, relative to the old cap, before this swing.

**This is exactly what the cap-24 probe predicted and the entry above already stated in principle** ("a bigger
bucket moves saturation, it does not remove it"; "a first step on a monotone curve, not an endpoint"). The
follow-up just converts that from a caveat into a measurement: the population re-saturates whatever ceiling it is
given, on a timescale of ~10k ticks. Raising the ceiling buys a transient, and a permanent ~2x on the dispersion
floor — real, and not nothing, since the reproduction gradient is monotone in amp and now has something to grade —
but the erosion mechanism is untouched.

**What this sharpens for #50.** The remaining fix is not a larger AMP_CAP — the curve says that only lengthens the
transient. It is a COST THAT SCALES WITH HELD AMP, so that hoarding surplus is expensive and the distribution
cannot collapse onto the ceiling in the first place. That is the same mechanism as the shelved carry-cost and the
same principle the atrophy probe already isolated (metabolic pressure concentrates; judgmental machinery does
not). #49 gave the currency a range and made reproduction grade on it; #50 has to make the range defensible.

### SWING #50 + #50b VERDICT (10k, seeds 7 + 3, fixed census) — PASS on both criteria; one open question

**#50 as first built (fixed rent, fixed ceiling) FAILED, and the failure named the real design.** Rate sweep,
seed 7, 6000 ticks, 0 errors:

| rate | atCap t2001->t6001 | CV t2001->t6001 | mean t2001->t6001 |
|---|---|---|---|
| 0.005 | 39% -> 58% | 0.361 -> 0.210 | 4.77 -> 5.46 |
| 0.012 | 6.6% -> 43% | 0.644 -> 0.290 | 2.83 -> 5.01 |
| 0.020 | 8.4% -> 34% | 0.808 -> 0.391 | 2.54 -> 4.52 |

Higher rent is monotonically better — the mechanism works directionally — but the mean climbs toward the cap at
EVERY rate. `A_eq=I/c` only stands still if income is static, and it is not: lineages evolve to earn more, I(t)
rises, A_eq rises, and any FIXED ceiling is reached eventually whatever c is. **That is adaptation outrunning a
static cost, not a mis-picked constant**, and it is why tuning c harder was the wrong move.

**#50b: the ceiling tracks the population** (`cap = 4 x mean living amp`, floored at AMP_CAP). Scale-free — if
every income improves by g, every amp scales by g, the ceiling scales by g, and CV is PRESERVED. Ten dependent
sites rewired to the live ceiling (6 vigor sensors, 4x op182, render register, shadow-sim clamp), cached per tick.

**VERDICT (10000 ticks, seeds 7 and 3, 0 loop errors, 0 driver errors both):**

| | #49 @ t10k | #50b @ t10k |
|---|---|---|
| atCeiling | 70% / 73% | **1.9% / 0.0%** |
| CV | 0.133 / 0.142 | **0.974 / 0.730** |
| N | 449 / 448 | 433 / 447 |

Both pass conditions met. The bulk is off the ceiling and STAYS off across the whole run (seed 7: 6.0% -> 2.2% ->
0.9% -> 0.5% -> 1.9%), and dispersion holds at 5-10x the pre-#49 baseline (~0.07) instead of decaying toward it.
This is the first configuration in the record where the amp distribution does not collapse onto its own bound.

**A MEASUREMENT BUG CAUGHT BEFORE IT PRODUCED A VERDICT.** Both the browser probe and the harness census were
computing atCap against AMP_CAP — the FLOOR constant — not the effective ceiling, reporting pinning that was not
happening. Caught because one browser dump showed `ceil=53.7` and `atCap=0.827` simultaneously, which cannot both
be true. The two 10k runs already in flight were discarded rather than reported. Third time this session that
measuring beat reasoning-from-source (after the refuted argmax-tie hypothesis and #49's mid-transient headline).

**OPEN — absolute inflation, and a concern of mine that the data then DEFLATED.** Seed 7 stabilises (mean ~14,
ceiling ~55). Seed 3 does not: mean 7.6 -> 15.2 -> 30.5 -> 52.3 -> 62.1, ceiling to 250, decelerating but not
clearly converged. I claimed this would disable the absolute death threshold (0.04), since seed 3's p01 sits at
1.13 — 28x above it — so nothing should be starving. **Checked instead of asserted, and I was wrong**: the
amp-starvation path fires 535 times over 2500 ticks (~0.21/tick). p01 is the 1st percentile of SURVIVORS, and
particles that fall under the threshold die and leave the census before it is taken; a healthy-looking p01 is
consistent with a working death filter, not evidence against one. The honest residual question is whether that
rate HOLDS at seed 3's inflated end-state (mean ~62, not ~4) — a 10k run with the cumulative counter is in
flight and will settle it. If starvation deaths thin out as the economy inflates, the fix is to make
deathThreshold and the 0.4 reproduction gate relative too, for the same reason the ceiling had to become
relative — otherwise inflation silently switches off the absolute-valued half of selection. Named as #50c,
conditional on that measurement, NOT built on the strength of an argument that has already been wrong once here.

**What this does NOT establish.** That any previously-null mechanism now grips. #50 makes fitness vary; whether
the 48 recorded nulls were mechanism failures or artifacts of flat fitness is the NEXT question, and the clean
test is re-running one recorded ablation under #50 — the thin-bank whole-bank ablation, whose apparatus exists.
The 28-atom real-bank null (4/5 seeds bit-identical) is still immune to all of this and still stands.

### THE PAYOFF TEST, attempt 1 — whole-bank ablation under #50: DISCARDED as hollow, not reported as a null

The question the whole economy arc exists to answer: with fitness finally varying, do the record's ablation nulls
change? First attempt targeted the whole-bank ablation, because its apparatus and its pre-#50 result both exist.

**Authored a fresh bank under the #50 economy** (seed 7, 45k ticks, full ENGINE knobs, ATOM_PIPELINE + ATOM_DURABLE
on). Result: `totAtoms=3 nBound=3 proven(uses>0)=0 maxUses=0`. Three atoms born, three bound, NONE ever executed.
For comparison the record's original seed-7 bank had a most-used atom at uses=1044.

**Ran the ablation anyway** — justified, because the record documents `uses=0` at dump time becoming live atoms on
resume (the real-bank entry verified non-hollowness exactly that way) — but with the usage counters visible and the
discard condition named in advance rather than after seeing the number.

**Result: 5 seeds x [intact, whole-bank-pinned-to-0], 10k ticks, 0 driver errors. VERDICT string says
BANK_NEUTRAL. It is being DISCARDED.** Raw arms:

| seed | intact | ablated | |
|---|---|---|---|
| 11 | 53.1745 | 53.1745 | bit-identical |
| 13 | 54.2120 | 54.2120 | bit-identical |
| 17 | 80.2140 | 82.0450 | differs |
| 19 | 34.3977 | 34.3977 | bit-identical |
| 23 | 27.5892 | 26.9285 | differs |

3/5 bit-identical, and `boundOps` is unchanged between arms in every seed (4.5/4.5, 4/4, 3/3). Combined with
proven-uses=0 at authoring, that is the hollow-null signature the record has been caught by twice. **The atoms
never executed, so knocking them out could not have changed anything, so the null carries no information about
whether #50 moved the verdict.** Reporting it would have produced precisely the result this arc is hunting, which
is exactly why it cannot be allowed to count.

**Mechanism, traced but NOT closed.** uaCall() increments `uses` on every invocation and is reached from opcode 22,
so uses=0 means op22 never executed against a valid atom index across 45k ticks. Born, bound, never called. The
GENERATIVE-LAYER MAP recorded this same failure ("authored atoms 0->0 INERT — 1 birth / 35k ticks, 0 uses ever")
and the ATOM_PIPELINE fix was supposed to have lit it; birth and binding clearly work here, calling does not.
**Honest open question I am NOT resolving by assumption: whether this is the pre-existing throttle the record
describes, or a regression introduced by #49/#50's four swings.** The swings touched amp sensor register values
(op37/52/53, op182 x4), spawn rates and the death threshold — none of which gate op22 — so pre-existing is the
likely reading, but likely is not established, and the flattering version is the one to distrust.

**Attempt 2 targets the meta-influence layer instead** — 116 genes whose ablation verifiably bites (metaMag
38-43 -> 0.03 confirmed in the pre-#50 run), so it structurally cannot come back hollow. Same question, answerable
target. Pre-#50 baseline to beat: effect -0.036, sd 0.054, never beneficial in any seed, INCONCLUSIVE. Under a
saturated currency that verdict was unfalsifiable in one direction — an intact arm 0.03 from the ceiling had no
room to express a benefit. It does now.

### THE PAYOFF TEST, attempt 2 — the user's REAL gen83 bank, ablated under #50: THE ABLATION FINALLY BITES

The user supplied four live exports, and the mature one (gen83, T=467423) carried exactly what 45k ticks of
headless authoring could not produce: **17 atoms, 25 bound opcodes, 12 PROVEN, top atom `(1.36)*(t)` at 9,701
uses**, second `(nb)-(c)` at 6,648. A genuinely fat, heavily-executed bank. Ablation cannot come back hollow on it.

**RESULT (5 seeds x [intact, whole-bank-pinned-to-0], 10k ticks, 0 driver errors, under the #50c economy):**

| seed | intact amp | ablated amp | intact N | ablated N | rel |
|---|---|---|---|---|---|
| 11 | 2.677 | 1.185 | 299 | 113 | +55.7% |
| 13 | 1.892 | **2.526** | 229 | **305** | −33.5% |
| 17 | 2.228 | **2.631** | 205 | **279** | −18.1% |
| 19 | 2.316 | **2.681** | 195 | **264** | −15.7% |
| 23 | 2.271 | **2.735** | 265 | **372** | −20.5% |

**ZERO bit-identical seeds.** Every seed moves, by 15–56%. Set against the record's pre-#50 real-bank ablation —
28 atoms, effect 0.0002, **4 of 5 seeds BIT-IDENTICAL** — this is a categorical change. The bank is no longer
causally inert.

**And the direction is the finding: in 4 of 5 seeds, DELETING the bank makes the population better off** — more
amp AND more population, effects tightly clustered (−0.36 to −0.63), seed 11 a strong outlier the other way.
The self-extension machinery, this project's theoretical basis for open-endedness, is a net DRAG on the lineages
carrying it.

**The harness's own verdict logic is wrong here, and that is worth recording.** It printed BANK_NEUTRAL because
effect_mean (−0.075) < effect_sd (0.789) — but the mean is near zero only because seed 11 (+1.49) cancels four
consistent negatives. `harness-ablate-bank.js` scores BANK_ADAPTIVE (removing it lowers fitness) vs BANK_NEUTRAL
(everything else); **it has no category for "removing it RAISES fitness," so a real, consistent, costly effect
files as neutral.** Any future use of this harness needs that third branch or it will keep mislabelling harm as
nothing.

**CONFOUND, not yet closed — the honest limit on the headline.** The pre-#50 bit-identical result used a
DIFFERENT bank (28 atoms, a different export). So "inert before, active now" currently confounds BANK with
ECONOMY. The isolating cell — this same gen83 bank, ablated under the pre-#49 economy (`INDEX=` pointed at
d6febcb:index.html) — is running at write time. Pre-registered: if that arm comes back mostly bit-identical, the
saturation thesis is confirmed cleanly (same bank, same seeds, inert under a clamped currency, live under a
floating one) and the record's whole-bank null is an APPARATUS artifact, not a property of the bank. If it also
moves, the difference is the bank and not the economy, and this result reduces to "this particular bank is
active" — much weaker. Not claiming the strong version until that cell reports.

**Convergent evidence from the exports themselves, pointing the same way.** #48 shipped vmGain UNBOUNDED so
selection could buy any consequence it wanted. Across the four exports it did the opposite, monotonically:
vg 1.000 (t2015) → 1.123 (t4250) → 0.841 (t14359) → **0.217 (gen83 t467423)**, with the whole pool converged
tight (min 0.2168, max 0.2371, n=137). Fable's branch 3 — "gain stays low even when free → the whole barrier
thesis dies on the spot" — and branch 4 alongside it (67 extinctions, population 500 → ~90, one lineage left:
"the stability frontier was real and the authors' fear calibrated"). **If VM output is on balance costly, then
selection driving its consequence toward zero is not a failure to discover something good — it is correctly
pricing something bad.** Two independent measurements, from opposite directions, agreeing.

### BOTH ECONOMIES, SAME GENOME — #48's branch 4 lands, on my own work: the 1.2 clamp WAS stability insurance

The user's call: run the real gen83 genome forward under the pre-#49 economy and under #50c, side by side.
Method: `INDEX=` pointed at `d6febcb:index.html` (verified pre-#49 — that commit touched only notes and
harnesses) vs current HEAD, same GENOME, same 3 seeds, 20000 ticks. Read ONLY on scale-free measures —
population, kinds, diversity — never meanAmp, whose scale differs between the arms by construction.

| seed | OLD finalN | NEW finalN | OLD kinds | NEW kinds | OLD H | NEW H |
|---|---|---|---|---|---|---|
| 11 | 500 | 376 | 17 | 14 | 3.54 | 3.44 |
| 13 | 500 | 353 | 15 | 14 | 3.36 | 3.45 |
| 17 | 500 | 0* | 16 | 15* | 3.55 | 3.50* |

*seed 17's final sample landed in a trough — see below. 0 loop errors, 0 driver errors, all six runs.

**The trajectories are the result, not the endpoints.**
  - OLD, every seed: monotone climb to exactly 500, meanAmp pinned at exactly 1.2, and it stays there.
    `329 -> 429 -> 437 -> 447 -> 453 -> 458 -> 467 -> 477 -> 488 -> 497 -> 500`. A static equilibrium against
    both ceilings at once.
  - NEW, every seed: violent boom-bust. Seed 11 `424 -> 480 -> 296 -> 298 -> ... -> 376`. Seed 13
    `431 -> 307 -> 305 -> 0 -> 63 -> 364 -> ... -> 353`. Seed 17 `418 -> 293 -> 315 -> 154 -> 332 -> 0 -> 370
    -> 363 -> 0`. **Two of three seeds hit N=0 and reseeded back.**

**CORRECTION to my own first read, made before reporting it:** I read seed 17's finalN=0 as an extinction caused
by my changes. It is not — the population recovers to 370 two samples later; the final sample simply landed in a
trough. The honest statement is oscillation with total crashes and reseed recovery, not termination.

**DIVERSITY DID NOT IMPROVE.** H 3.19-3.57 (new) vs 3.35-3.57 (old); kinds 12-16 in both. The new economy bought
instability, not diversity. That is the swing's own stated purpose failing to materialise on this genome.

**#48's branch 4 fires, and it fires on me.** "Instability + extinction dominate -> the stability frontier was
real and the authors' fear calibrated." I characterised `if(amp[i]>1.2)amp[i]=1.2` as "a bare literal nobody
re-decided," the same class of object as the vmGain constants. On this evidence that framing was WRONG: the clamp
was doing load-bearing work as stability insurance, and removing it produces precisely the catastrophe the
original authors appear to have been guarding against. Reading an undocumented constant as unconsidered is its
own confabulation — the absence of a stated reason is not the absence of a reason.

**Two counterweights, neither of which rescues the change.** (1) The OLD arm's stability is exactly the static
attractor this project has fought since #36 — pinned at cap on population AND amplitude, going nowhere, which is
what #36/#39 were built to escape. (2) The crashes are NON-TERMINAL, with reseed recovery to ~370, which is the
punctuation shape #39 explicitly wanted. But #39 wanted punctuation WITH diversity gain, and there is none here.

**Bearing on the live pool: do not deploy #49/#50 to the tabs on this evidence.** A live artwork would show total
population wipeouts. The economy work stays on the branch until either the instability is bounded (a floor on the
bust, or a gentler AMP_CAP_REL) or a diversity gain appears to justify the cost. What #49/#50 demonstrably DID
achieve is measurement: they turned a saturated dependent variable into one that varies, which is what made the
gen83 bank ablation informative for the first time. That is a real result about the APPARATUS, and it is
separable from — and survives — this negative result about the physics.

### THE 2x2, COMPLETE — the whole-bank null was an APPARATUS ARTIFACT. Same bank, same seeds, 5/5 identical vs 0/5.

The isolating cell reported. The gen83 bank (17 atoms, 25 bound, 12 proven, top atom 9,701 uses) ablated under
BOTH economies, same 5 seeds, same 10k ticks, `INDEX=` switching only the physics file.

| seed | pre-#49 intact | pre-#49 ablated | | #50 intact | #50 ablated |
|---|---|---|---|---|---|
| 11 | 1.2000 | 1.2000 | **IDENT** | 2.6770 | 1.1847 |
| 13 | 1.1940 | 1.1940 | **IDENT** | 1.8915 | 2.5255 |
| 17 | 1.2000 | 1.2000 | **IDENT** | 2.2283 | 2.6305 |
| 19 | 1.2000 | 1.2000 | **IDENT** | 2.3163 | 2.6808 |
| 23 | 1.2000 | 1.2000 | **IDENT** | 2.2708 | 2.7352 |

**5/5 bit-identical under the clamped currency. 0/5 under the floating one.** Effect exactly 0 with sd exactly 0,
against [1.4923, −0.634, −0.4022, −0.3645, −0.4645]. Bank held constant, seeds held constant; only the economy
differs. **The confound named in attempt 2 is closed.**

**The mechanism is visible in the numbers themselves.** Under the old economy intact AND ablated both read exactly
`1.2000` — the clamp literal. The two arms are identical because both are pinned against the ceiling. The clamp
was not failing to DETECT the bank's effect; it was arithmetically ERASING it, in both directions, before any
comparison could see it.

**VERDICT: the record's whole-bank null was an artifact of the measuring apparatus, not a property of the bank.**
The prior entry — "the self-extension bank is EXECUTED but fitness-INERT... the strongest, cleanest null the
project has reached" — was measured through an instrument that could not have returned any other answer. Every
whole-bank and single-atom ablation in this file that reported meanAmp near 1.2 and concluded "no grip" inherits
the same defect. Those verdicts should be read as UNTESTED, not as null.

**What the bank actually does, now that it can be seen: in 4 of 5 seeds, deleting it leaves the population with
MORE amp and MORE particles** (tightly clustered −0.36 to −0.63; seed 11 a strong outlier the other way). The
self-extension machinery — this project's theoretical basis for open-endedness — is a net DRAG on the lineages
carrying it.

**This also explains the accumulation.** ~48 swings added mechanism, and the clamp concealed the price of every
one of them: not only were benefits truncated, costs were too. A system that cannot measure the cost of what it
adds will keep adding. That is the structural account of how the record reached 140 layers, 232 opcodes and 186
genes with almost every audited mechanism reading inert.

**Independent corroboration, from the user's live exports.** #48 shipped vmGain UNBOUNDED so selection could buy
any consequence it wanted. It drove it DOWN monotonically instead — vg 1.000 → 1.123 → 0.841 → 0.217, whole pool
converged (min 0.2168, max 0.2371, n=137). If VM output is on balance costly, selection pricing its consequence
toward zero is correct accounting, not a failure to discover. Two measurements, opposite directions, same
conclusion.

**Scope, stated.** This does NOT vindicate #49/#50 as physics — the both-economies run showed they buy boom-bust,
not diversity, and #48's branch 4 fires on them (see the previous entry; the 1.2 clamp was load-bearing stability
insurance and I was wrong to call it unconsidered). The apparatus result and the physics result are separable and
both stand: the swings were a bad change to the world and a decisive fix to the instrument. The instrument gain
is what should be kept — whether by shipping a bounded version (#50d) or by running ablations on a branch build
purely as a measuring rig while the live pool keeps the clamp.

### #50d FLOOR — FAILED by its own pre-registered criteria, and REVERTED. Life support at scale poisons the pool.

The user's call: put a floor on the bust and rerun. Built (POP_FLOOR=80: below that many living particles,
amp-starvation death suspended, particle pinned to its own threshold — the same device knob S already uses for
founder grace), rerun on the same genome, same 3 seeds, same 20k ticks, directly comparable to the unfloored runs.

| seed | #50d N trajectory |
|---|---|
| 11 | 329 424 480 **80 80** 117 **80 80 81 80** 154 |
| 13 | 329 419 431 **80 80** 109 169 211 220 **80** 125 |
| 17 | 329 415 418 **80 80** 122 **80 80** 97 81 114 |

Criterion 1 (no seed reaching 0): PASSED. Criterion 3 (diversity no worse than the unfloored 3.19-3.57): **FAILED**
— H 2.985/3.026/3.208, kinds 10/11/13, worse than the unfloored #50c (H 3.437/3.451, kinds 14) AND worse than
pre-#49 (H 3.358-3.548, kinds 15-17). And the named failure mode occurred exactly as pre-registered: seed 11 sits
at exactly 80 for six of eight post-crash samples, seed 17 for five of eight. **A floor doing harm quietly rather
than a crash doing it loudly** — the words were written before the run.

**Mechanism, clear in hindsight and worth recording.** Pinning at `_deathT` does not preserve a population; it
manufactures a permanent underclass of zero-amp particles that keep drawing metabolic upkeep and density cost
while contributing nothing. The floor does not stop the bust — it makes the bust PERMANENT and taxes the
survivors. Knob S's version works because it protects a handful of founders briefly; the same device applied to
80 particles indefinitely inverts its effect. A mechanism that is benign at small scale and harmful at large
scale, which is its own lesson about porting a device out of the context that justified it.

**REVERTED** (`git revert 77a5463`). index.html carries #49/#50/#50b/#50c and no floor.

**The coherent position this leaves, stated plainly.** #49/#50 are a BAD CHANGE TO THE PHYSICS (boom-bust, no
diversity gain, #48's branch 4 fires) and a DECISIVE FIX TO THE INSTRUMENT (the 2x2: same bank 5/5 bit-identical
under the clamp, 0/5 without it). Those are separable, and the separation is the recommendation:
  - **The live pool keeps the clamp.** Do not deploy. The artwork would show wipeouts, and now also would not be
    helped by a floor.
  - **The branch build is a MEASURING RIG.** Its value is that ablations run on it can detect an effect at all.
    Every "no grip" verdict in this file measured through the clamped currency is UNTESTED and can now be re-run
    properly, one at a time, without touching the live artwork.
That costs the artwork nothing and recovers the whole ablation series. The instrument was the deliverable; the
physics change was the price of finding that out, and it does not have to be paid twice.

### META-INFLUENCE ABLATION RE-RUN ON THE RIG — a recorded null OVERTURNED, on the project's own target metric

Second use of the instrument for its purpose. Target chosen because it structurally cannot come back hollow: the
record already established this layer fires and that ablating it bites (metaMag 38-43 -> 0.03), and the atrophy
probe found all 116 genes reading NEGATIVE on the system's own attribution while the layer net-inflated 4-5x
anyway. 5 seeds x {intact, ablated}, 20000 ticks, 0 loop errors and 0 driver errors in all ten runs.
Pre-#50 baseline: effect -0.036, sd 0.054, "never beneficial in any seed", INCONCLUSIVE-leaning-neutral, n=3.

**On amp — the ablation now BITES, but gives no directional verdict.**

| seed | intact | ablated | intact−abl | relative |
|---|---|---|---|---|
| 7 | 62.93 | 48.70 | +14.23 | +22.6% |
| 11 | 26.83 | 35.02 | −8.19 | −30.5% |
| 13 | 35.04 | 37.68 | −2.64 | −7.5% |
| 17 | 30.17 | 19.42 | +10.76 | +35.6% |
| 19 | 31.46 | 44.19 | −12.73 | −40.5% |

Per-seed effects of 7.5–40.5%, an order of magnitude above the pre-#50 ~3%, but 2/5 favour intact and 3/5 favour
ablated. mean 0.285, sd 10.52. On amp the layer is causally LOUD and directionally MUTE — it perturbs the
trajectory hard without a consistent sign.

**On diversity — a clean, consistent, directional result.**

| seed | kinds intact | kinds ablated | Δ |
|---|---|---|---|
| 7 | 6.71 | 7.14 | +0.43 |
| 11 | 8.00 | 8.57 | +0.57 |
| 13 | 8.00 | 8.00 | 0.00 |
| 17 | 5.86 | 6.86 | +1.00 |
| 19 | 5.29 | 7.86 | +2.57 |

**mean +0.914, sd 0.888 — beats its own noise; ablated >= intact in 5/5 seeds, strictly greater in 4/5.** By this
project's own adoption criteria (effect > own noise AND majority-consistent) that is a PASS. **Removing the
116-gene meta-influence layer RAISES occupied kinds, consistently, by ~13-17% relative.**

**Why this was invisible before, mechanically.** occupiedKinds is not itself clamped — so the question is why the
pre-#50 run reported "same population, same diversity". Because with amp saturated, every lineage had effectively
identical reproductive success regardless of its meta-genes, so the layer could not differentially shape WHICH
lineages persisted, and diversity is downstream of exactly that. On the rig the chain is restored:
meta-genes -> amp -> reproduction -> which lineages survive -> occupied kinds. The clamp did not hide a diversity
effect by compressing diversity; it hid it by severing the causal path that produces one.

**What this means for the record.** The layer is not merely inert-by-attribution (atrophy probe, protected=0) and
not merely non-load-bearing (pre-#50 ablation). It is **actively suppressing the project's primary goal metric** —
the diversity ceiling that swings #11 through #39 were all built to break. 116 genes each annotated "attribution
tracks whether this sensing helps", whose removal makes the system measurably more diverse. And the carry-cost
decision recorded earlier — deliberately not-yet-shipped, reasoning that "the ablation shows the bloat is nearly
harmless" so a pruning cost was warranted only for SYMMETRY — rested on a measurement taken through the clamp.
On the rig the bloat is not nearly harmless. That decision should be re-opened with this result in hand.

**Honest scope.** n=5, one authoring regime, headless, fresh boots — the same caveats every headless finding here
carries. The amp result is genuinely inconclusive and is NOT being reported as harm. The diversity result is one
statistic clearing its own noise bar by a modest margin (0.914 vs 0.888); it wants a 10-seed confirmation before
anything is built on it. What is NOT in doubt is the categorical change: a test that returned effect −0.036 ± 0.054
now returns per-seed swings of up to 40%.

### THE SUBTRACTION TEST — 48 swings added mechanism; removing two subsystems raises diversity 25%

Asked to think outside the box, and the box was "ablate one more layer." Three independent measurements on the
rig had already pointed the same way from different directions — the gen83 atom bank is a net drag in 4/5 seeds;
the 116-gene meta-influence layer costs ~0.9 kinds; vmGain fell 1.0 -> 0.217 with the pool converged on the floor
when selection was free to raise it. Each was filed separately as a null or a curiosity. Together they say the
ACCRETION ITSELF is the load. So: subtract both, separately and together, and ask what the stripped system does
on the metric the whole #11-#39 arc was built to move.

`harness-strip.js` (STRIP=none|meta|bank|both), real gen83 genome via the GENOME resume path, 5 seeds, 20000
ticks, 20 runs, **0 loop errors and 0 driver errors in all twenty**. Bank verifiably live in every intact arm
(14,763–30,384 atom invocations, 9–14 proven atoms) — the counter increments even in the ablated arm, output
zeroed after counting, precisely so non-hollowness is demonstrable rather than asserted.

**OCCUPIED KINDS**

| seed | none | meta | bank | both |
|---|---|---|---|---|
| 7 | 11.14 | 13.00 | 13.86 | 14.00 |
| 11 | 11.71 | 14.43 | 11.57 | 13.14 |
| 13 | 13.71 | 13.43 | 10.57 | 13.29 |
| 17 | 11.00 | 11.43 | 11.00 | 14.86 |
| 19 | 7.71 | 13.71 | 11.43 | 13.86 |
| **mean** | **11.06** | **13.20** | **11.69** | **13.83** |

| arm − none | mean | sd | beats own noise | better in |
|---|---|---|---|---|
| meta | +2.143 | 2.196 | no | 4/5 |
| bank | +0.629 | 2.412 | no | 2/5 |
| **both** | **+2.771** | **2.218** | **YES** | **4/5** |

Population moves the same way: 251 -> 349, **+39%**.

**Two structural facts, not just a big number.** (1) **Stripping BOTH is the only arm whose diversity gain clears
its own noise bar** — neither subsystem alone does. (2) The effects are almost exactly ADDITIVE: meta alone
+2.143, bank alone +0.629, sum +2.772, both measured +2.771. Two independent taxes, no interaction term. That
matters: it means this is not one subsystem's pathology, it is what accumulated machinery does here in general,
and it predicts that further subtraction keeps paying.

**LEAVE-ONE-OUT — robust.** Per-seed both−none: +2.86, +1.43, −0.43, +3.86, +6.14. Dropping ANY single seed
leaves the effect beating its own noise, including dropping seed 19 (the largest contributor): mean +1.929,
sd 1.611. Not one seed carrying it.

**What this says about the project, plainly.** Forty-eight swings were spent ADDING mechanism to break a
diversity ceiling. On the first instrument capable of detecting either a cost or a benefit, deleting two
subsystems raises diversity 25% and population 39%. The ceiling those swings kept hitting was not a limit the
system needed more machinery to escape — a substantial part of it was the machinery. And this is exactly the
principle the atrophy probe already isolated and stopped one inch short of generalising: concentration came from
a metabolic COST (opcodes, 87% of instances on a 5-op core, no pruner needed), while the layer that cost nothing
inflated unchecked. Bloat that is free does not merely fail to help. It is charged to diversity.

**HONEST SCOPE, and it is real.** n=5, one genome (gen83), one regime, headless and CLOSED — this genome's live
history absorbed 190 plasmids, 180 motifs and 45 inscriptions from peers, and the record is emphatic that the
open boundary is where the live causal action lives. The margin clears its noise bar but not lavishly (2.771 vs
2.218), and one seed goes the other way. This is a strong signal and a specimen, not a rate. **It is also NOT a
proposal to delete these subsystems from index.html** — the same discipline that killed #50d applies: a
measurement on the rig is not a licence to change the artwork. What it licenses is the next measurement, and it
names it: strip further (which layer is next-most costly), and confirm at n=10 before anything structural is
built on it.

### THE MARGINAL SWEEP — there IS no next-most-costly layer. Subtraction stops paying after meta+bank.

The subtraction test found meta and bank impose almost exactly additive costs and I wrote that this "predicts
further subtraction keeps paying." **That prediction is now refuted.** Seven subsystems stripped one at a time ON
TOP of meta+bank (so the number is MARGINAL cost against the already-stripped 13.83-kinds baseline), 5 seeds,
20000 ticks, 35 runs, **0 loop errors and 0 driver errors in all thirty-five**.

| subsystem | mean Δkinds | sd | clears own noise | Δpop | max amp | per-seed Δ |
|---|---|---|---|---|---|---|
| learn (selfLearnFromBest) | **−1.514** | 1.317 | **YES** | −43 | 2.8 | −1.9 0.0 0.0 −3.3 −2.4 |
| decide (decideFromRealWinner) | −1.429 | 1.525 | no | −30 | **956.1** | −3.4 −0.1 −2.6 −1.7 +0.7 |
| niche (applyNicheEconomy) | −1.086 | 1.824 | no | −29 | 1.8 | +0.9 −1.0 +1.0 −3.3 −3.0 |
| credit (applyCreditAssignment) | **+0.000** | 0.000 | — | +0 | 3.1 | 0 0 0 0 0 |
| alien (runAlienPrediction) | **+0.000** | 0.000 | — | +0 | 3.1 | 0 0 0 0 0 |
| reflex (updateClusterReflex) | **+0.000** | 0.000 | — | +0 | 3.1 | 0 0 0 0 0 |
| shadow (runShadowSim) | +0.171 | 0.343 | no | +1 | 3.0 | 0 0 0 0 +0.9 |

**The answer to "which layer is next-most costly" is: none of them.** Every remaining subsystem is either exactly
inert or LOAD-BEARING (negative Δ = removing it hurts). Not one is a marginal tax. The accretion is not uniformly
costly — it is two taxes (meta, bank), four inert layers, and three pieces holding the system together.

**Three subsystems are EXACTLY zero — sd 0.000, all five seeds.** credit, alien and reflex fire and have literally
no downstream consequence. Verified as real ablations, not skipped patches: a diagnostic counted the early-return
firing 14x (shadow) and 33x (reflex) per 2000 ticks. They are called, they are skipped, and the trajectory does not
move by a single bin. Note also that if runShadowSim consumed ANY rng, skipping it would shift the shared stream
and force divergence — bit-identical output means it consumes none and reaches nothing.

**REFLEX: a recorded null CONFIRMED rather than overturned.** The confabulation assay convicted the cluster reflex
as "the deepest ornament yet" on bit-identical ablation evidence — but that was measured through the clamp, and
the clamp has now been shown to return bit-identity for a causally live subsystem (the gen83 bank: 5/5 identical
clamped, 0/5 on the rig). Reflex was retested on the rig and is STILL exactly 0.000 in all five seeds. That
verdict was right, and right for the right reasons. The apparatus fix overturned the bank null and confirmed this
one — which is what a working instrument is supposed to do, and is the strongest available evidence that the rig
is not simply manufacturing effects.

**learn is the only entry clearing its own noise bar, and it is NEGATIVE.** selfLearnFromBest — the path by which
the population's best discovery flows back into the reflective baseline — costs 1.514 kinds when removed. After a
session in which almost every measured mechanism turned out to be a tax or inert, this is the first subsystem
measured as genuinely load-bearing FOR DIVERSITY.

**decide carries a stability role, visible in the amp column.** Strip decideFromRealWinner and mean amplitude runs
to 956 against a ~2.9 baseline. Mechanistically exactly what #44's design implies: it steps the self's physics
toward the realized population winner, and without it the reflective baseline's physics drifts unchecked. Its
Δkinds does not clear noise, but the amp blowup is unambiguous and is its own finding.

**What this settles about the subtraction thesis.** "The accretion itself is the load" was too strong, and I
proposed it. The accurate version is narrower: the meta-influence layer and the authored-atom bank are taxes worth
~2.8 kinds between them; most of the rest of the machinery is inert; and a small number of subsystems are doing
real work. A map, not a verdict — and it says where any future pruning should and should not go.

### THE SIGN REVERSES — the "taxes" are rig-specific. In the artwork's own economy the machinery is LOAD-BEARING.

Every subtraction finding so far lived on the #49/#50 rig — a build already recommended against deploying. So
the meta+bank tax was a true statement about a system the user does not run. This closes that gap, and the answer
overturns my own thesis.

Same arms (STRIP=none vs both), same gen83 genome, same 5 seeds, same 20000 ticks, `INDEX=` pointed at the
pre-#49 clamped build (d6febcb:index.html) — i.e. the economy the live artwork runs.

| seed | none kinds | both kinds | Δ |
|---|---|---|---|
| 7 | 14.00 | 14.14 | +0.14 |
| 11 | 16.00 | 14.43 | −1.57 |
| 13 | 15.00 | 14.14 | −0.86 |
| 17 | 15.71 | 13.14 | −2.57 |
| 19 | 13.57 | 12.14 | −1.43 |

**CLAMPED: Δkinds −1.257, sd 0.892, CLEARS ITS NOISE BAR, worse in 4/5 seeds.**
**RIG: Δkinds +2.771, sd 2.218, clears, better in 4/5 seeds.**

Same intervention, same bank, same seeds — **opposite sign, both clearing noise.** (amp reads exactly 1.200 in
all ten clamped arms, the clamp pinning everything as expected.)

**MY EXPLANATION FOR THE ORIGINAL NULL WAS WRONG.** I wrote that the clamp SEVERS the causal path
(meta-genes -> amp -> reproduction -> which lineages persist -> kinds), so a diversity effect could not form.
It forms. It is not invisible under the clamp — it is REVERSED and it clears noise, which is a stronger effect
than the one I claimed was absent. That explanation should be read as retracted.

**The reading the data supports, and it is more generous to this project than my subtraction thesis.** In a
saturated economy selection is WEAK — every lineage has near-identical reproductive success — so diversity has to
be maintained by generative machinery, and removing the meta layer and the authored-atom bank costs ~1.3 kinds.
On the rig selection is STRONG, and the same machinery becomes a net cost of ~2.8 kinds. **The value of these
subsystems is not a property of the subsystems. It is a property of the subsystem-economy PAIR.** The 48 swings
of accreted machinery were not irrational: they are fitted to the economy the project actually runs, where weak
selection makes generative mechanism the thing that holds diversity up.

**BEARING — the practical output of this whole arc, stated plainly.**
  1. **Do NOT prune meta or bank from the live artwork.** In its economy they are load-bearing, measured, 4/5
     seeds, clearing noise. The subtraction result does not transfer.
  2. **Do NOT deploy #49/#50** — already established separately (boom-bust, no diversity gain, #48's branch 4).
  3. The rig remains valid as an INSTRUMENT (it overturned the bank null and confirmed the reflex null), but
     every verdict it produces is a verdict about the rig's economy, and must be re-tested against the clamped
     build before it can touch the artwork. That re-test is cheap — `INDEX=` — and it is now mandatory, not
     optional. This result is the reason why.
  4. The carry-cost decision, which I said earlier should be re-opened on the strength of the rig result, should
     NOT be. On the clamped build the meta layer earns its keep.

**The methodological lesson, which is the assay's own lesson one level up.** The confabulation assay was built to
catch claims whose correspondence to mechanism was never checked. This session built a better instrument, and
then I generalised its readings to a system that instrument does not describe — asserting a property of
subsystems that was really a property of subsystems-under-a-specific-physics. Same error class, committed with
better tools. The check that caught it cost one env var and ten runs, and existed the whole time.

### #51 + #52 — TEN LEAPS, VERIFIED. The freeze is broken, descent is dominant, and the atom pipeline FIRED.

Built as two waves of five, on a clean base — my own #49-#50c economy work was REVERTED first, because it
was measured bad for the artwork and keeping it would have been sentiment rather than learning. Every leap
follows from a number in this file.

**Wave 1 (#51) — the life cycle.** Senescence (heritable lifespanBias), descent-or-death (reseeding is
emergency-only), surplus converts (the 1.2 clamp becomes a lossy conversion into inheritable reproductive
provision), the boundary bites (absorbed peer material deposits real resource and real hazard), retention
in fitness (lineage depth and persistence at weight 0.22).

**Wave 2 (#52) — what lineages can then do.** Speciation by divergence (previously 0 BY CONSTRUCTION),
atom call-sites wired into LIVING programs, the trait wall becomes a toll, carried machinery is billed at
the metabolic economy, rare cross-lineage hybridisation.

**MEASURED (fresh boot, 6000 ticks, 0 loop errors and 0 driver errors):**

| | original (frozen) | after #51 | after #52 |
|---|---|---|---|
| singleton fraction | 0.770–0.796 | 0.374 | **0.081** |
| in a multi-member lineage | ~0.21 | 0.626 | **0.919** |
| largest lineage | 12–36 | 89 | **146** |
| mean lineage size | 1.21–1.25 | 2.38 | **6.30** |
| living lineages | ~400 | 155 | **53** |
| authored-atom uses | 0 | 0 | **162 (1 proven)** |

**THE ATOM PIPELINE FIRED.** The GENERATIVE-LAYER MAP recorded "authored atoms 0->0 INERT — 1 birth /
35k ticks, 0 uses ever," and this session independently reproduced it (45k authoring: 3 atoms, 3 bound,
uses=0). The chain is birth -> bind -> wire a call-site -> execute, and it always died at the last link
because the splice targeted the GERMLINE while the living population executes pProg. LEAP 7 wires living
programs. 162 invocations and one proven atom in 6000 ticks. The self-extending VM — the layer this
project's entire open-endedness thesis rests on — is executing its own authored primitives for the first
time in the record.

**LIVE (browser, 0 console errors).** It grew structures neither prior build produced: hexagonally packed
colonies (close-packed lattice, not loose clustering) and yellow FILAMENTS spanning between organisms,
including a branched three-way junction. Connective structure between individuals is new. Panel reads
16 alive / 692 total with lineages of visibly different ages coexisting (L654 55p age:124c alongside 4-bud
juveniles), and the metabolism role reads BLOOM — the trophic differentiation previously seen only in the
live multi-tab pool now appearing in a single instance.

**A REAL BUG, caught before commit.** The first #52 run threw 1516 loop errors: the speciation block read
`tv`, which is addParticle's parameter name, while addCompound calls the same vector `nt`. Two spawn
paths, one identifier. Fixed and re-run clean. Committed the wave with verification status stated as
pending rather than implied, and the numbers followed.

**THE NUMBER TO WATCH, named now rather than after it goes wrong.** occupiedKinds fell 14–16 -> 10.5 ->
**9** across the two waves. That is the predicted signature of selection pruning drift-occupied bins —
kinds SHOULD fall when churn is replaced by descent, and this file has established that occupiedKinds
cannot distinguish the two. But it is also exactly what consolidation into a single dynasty looks like
from outside. maxLin climbing (36 -> 89 -> 146) while nLin falls (400 -> 155 -> 53) is consistent with
BOTH readings. Speciation (#6) and the niche toll (#8) are the counterweights and 6000 ticks is early for
radiation. **The falsifier: if at 50k+ kinds keeps sliding while maxLin keeps climbing and speciation
events stay rare, wave 2 has overshot into monoculture and #6/#8 need strengthening — not more leaps.**

### WAVES 1–5 (#51–#56) — twenty-seven leaps, and what the numbers actually say

**The finding that forced all of it.** The closed population FREEZES. At N=500 upkeep exactly consumes regen,
leaving nothing to pay BIRTH_ENERGY_COST, and nothing dies because amp pins at the 1.2 clamp against a 0.04
death threshold. Lineage composition measured BIT-IDENTICAL at t20000 and t80000 — singleFrac 0.770, maxLin 36,
nLin 399, both samples. Sixty thousand ticks, not one birth or death, while occupiedKinds kept drifting because
living particles' tend keeps moving. **The 14–16 "diversity" this project has optimised for 48 swings was the
trait-spread of a photograph.**

**Where twenty-seven leaps landed:**

| | original | now |
|---|---|---|
| births / deaths | none in 60k ticks | continuous |
| singleton lineages | 77% | ~3% |
| largest lineage | 12–36 | 149–220 |
| atom uses | **0, ever** | 405–1260 per run |
| proven primitives | 0 | 3–4 per run |
| occupiedKinds | 14–16 (frozen) | ~10.1 (living) |

**THE ATOM PIPELINE WAS NEVER BROKEN.** Counted the birth EVENT: mutateGenome runs only 18 times per 6000
ticks, so the record's 2% birth floor gave 0.36 expected births and P(zero)=70%. Two of three seeds authored
nothing; the one that authored recorded 423 uses, proven, bound. Every measurement of this layer in the file's
history — the single-atom knockout, both whole-bank ablations, the durability fixes, ENRICH, this session's own
45k authoring run — was measuring an EMPTY BANK and concluding the machinery was inert. The GENERATIVE-LAYER MAP
got the stage right and the magnitude wrong: a 2% floor on an 18-occurrence event is a rounding error, so the
fix read as addressing the throttle while leaving it intact. Raised to 0.28; authoring is now reliable and
3–4 primitives per run get proven.

**MEASURED TRADE: authorship costs diversity.** kinds 11.78 → 10.67 mean when authoring became reliable.
Consistent across seeds. A real tension to design against, not a defect.

**A PRE-REGISTERED RULE, APPLIED AGAINST MY OWN WORK.** Wave 5 dropped mean kinds 10.66 → 9.00. One commit
earlier I had written "if diversity drops below wave 4, the fix is subtraction, not a sixth wave." LEAP 27 (VM
consequence x3.5) was eliminated as the only one of the five whose mechanism homogenises, reverted, and kinds
recovered to 10.11 — confirming the elimination. The remaining four cost 0.55 kinds against a pooled sd of ~0.4
at n=3, i.e. nothing distinguishable, while nearly doubling atom uses (435 → 792) and improving population
health (344 → 374 alive). Kept on that basis.

**TWO WRONG CAUSAL STORIES, RECORDED BECAUSE THIS FILE IS ABOUT THAT.** Shipped a three-leap tax-interaction
explanation and then a cull-race deadlock explanation for "no atoms", both plausible, both detailed, both
refuted by BIT-IDENTICAL runs. The arithmetic that settled it (2% × 18 draws) was available before the first
story. Sincere explanations with nothing enforcing correspondence to the mechanism — produced twice in an hour
by the process auditing 48 prior instances of exactly that.

**A TREND CLAIM I RETRACTED.** Stated that kinds had fallen monotonically 13.33 → 10.66 → 9.00 and warned of a
sophisticated monoculture. It recovered to 10.11 the moment LEAP 27 came out. Three points read as a trajectory
when one was a single bad mechanism.

**STANDING CAVEATS.** Wave 3 remains unproven at horizon (kinds 8 at 6k vs wave 2's 9 — noise, not evidence);
I said I would revert it if it does not beat wave 2 and that test has not been run. Everything here is
6k–20k ticks against a live pool that runs to 467k with an open network boundary the harness stubs entirely —
LEAP 25 (migrants carrying programs) is provably INERT in every headless run and can only be tested live.

### #57 MODES — the best configuration in the record, and a false claim caught by its own instrument

Five words arrived with no explanation: HOLD, CARRY, STRETCH, SHIFT, SURGE. Read as a behavioural MODE
vocabulary — five discrete strategies rather than five more scalars — with the reading stated up front so
it was cheap to correct.

**Why discrete.** Every axis in this world is continuous: trait space, influence coefficients, gains,
thresholds. Continuous axes collapse under competitive exclusion — selection slides the population to one
end and the variance dies, which is exactly the monoculture wave 1 produced (kinds 1.71 at 20k). HOLD and
SURGE are not two points on a line. Each is priced to win somewhere and lose elsewhere (HOLD: upkeep 0.55,
defence 2.20, repro 0.45 — cheap to be, hard to kill, barely breeds. SURGE: upkeep 1.85, repro 2.20,
defence 0.55 — wins feast, dies first in famine), and this world's conditions cycle.

**THE INSTRUMENT CAUGHT MY OWN FALSE CLAIM.** The commit said mode gives "the first genuinely categorical
decision evolved code can make here." The census disproved it the only way possible: inherited-bias
distribution came back IDENTICAL to current-mode distribution, digit for digit, across three seeds — only
possible if nothing ever switched. SET_MODE was never executed. Same failure as the atom pipeline, same
cause (a new opcode only enters a program if mutation draws it, and seeded programs contain no reference),
same fix as LEAP 7 (wire it into living programs). I had solved this shape two waves earlier and did not
apply it to my own new opcodes.

**Method note worth keeping.** pMode and pModeBias were censused separately because I anticipated a failure
there — but I predicted switching-WITHOUT-inheritance and got inheritance-WITHOUT-switching. The instrument
caught the failure I had NOT predicted, because it measured the mechanism rather than my hypothesis about
it. A test built to confirm the guess would have missed it.

**RESULT AFTER THE FIX (3 seeds, 6000 ticks, 0 loop and 0 driver errors):**

| | before switching | after |
|---|---|---|
| mode evenness | 0.40 / 0.35 / 0.51 | **0.957 / 0.691 / 0.872** |
| occupiedKinds | 9.67 / 11.33 / 10.67 | **14.33 / 12.33 / 10.33** |
| mean kinds | 10.56 | **12.33** |

Seed 7's modes sit at [0.073, 0.259, 0.193, 0.219, 0.256] — five strategies at near-parity, evenness 0.957
of a possible 1.0 — while its inherited bias remains 80% SURGE. **The two have DECOUPLED: lineages inherit
one strategy and behaviourally adopt another as conditions demand.** Plasticity layered on heredity, and
that decoupling is what drove diversity up. Dominant modes are also SEED-CONTINGENT (SURGE in one, HOLD in
two), so no strategy is globally superior — which hand-pricing could not have guaranteed.

**THE COMPARISON THAT MATTERS.** The original build ran kinds 14–16 and was a PHOTOGRAPH: lineage
composition bit-identical from t20000 to t80000, no births, no deaths. Seed 7 now runs 14.33 in a
population that ages, dies, reproduces by descent, speciates, predates, authors and executes its own
primitives, and chooses between discrete ways of being alive. **Diversity matching the frozen build, in a
living system.** Not unanimous — seed 13 went 10.67 -> 10.33 — so 2 of 3 up on a strong mean.

**LIVE.** 0 console errors. Two large hexagonal colonies, one dense orange and one dispersing with filament
structure; 14 lineages alive of 821 ever, oldest at 72 particles and age 328c.

---

## #58 — wave 7. A hollow column of my own, and the price of closing it.

**The finding that actually matters is not a fitness number.** #57 shipped the mode
table with `MODE_REACH` declared at `index.html:1009` and read nowhere in the file.
STRETCH therefore paid 1.25x upkeep and took cuts to speed, reproduction and defence
in exchange for a benefit that was a comment. It was a strictly dominated strategy
sitting in the table looking like a choice, and it survived purely on drift — while I
was writing commit messages about the world's first categorical decision.

This is the hollow-mechanism pattern. It is the thing this record has spent forty
swings learning to catch, it is the whole premise of the confabulation-assay framing,
and it went in three commits ago under my own hand and stayed there through a
"VERIFIED" commit. The verification checked that switching *happened* (frac != bias).
It never checked that the thing being switched *to* paid out. A census that confirms a
mechanism fires is not a check that the mechanism does anything.

### The five leaps
- **31 REACH IS REAL** — per-particle falloff denominator. Applied to the falloff and
  deliberately not to the `d<iR` cutoff: the grid sweep scans +/-1 cell of CELL=55, so a
  widened cutoff would find distant partners by grid alignment, an artifact wearing
  physics. HOLD's 0.80*55=44 is below the cutoff, so `max(0,...)` means HOLD cannot feed
  at range at all. Asymmetric — each side reads its own reach.
- **32 COMPLEMENTARITY** — same-mode encounters 0.80, cross-mode 1.30. Frequency
  dependence on *strategy* rather than genotype.
- **33 SURGE IS A TERMINAL BET** — burns provision per tick, acute hazard once dry,
  hazard adds to senescence rather than replacing it.
- **34 PLASTICITY IS A LUXURY GOOD** — switch paid from provision first, 4x cost with no
  reserve. History gates capability for the first time in this world.
- **35 MODES ARE VISIBLE** — hue/saturation per mode. Readout only; explicitly not
  applied to `pSz`, which is read as collision extent.

### Measured, 6k ticks, seeds 7/17/23. loopErrors 0/0 all three.
`lateKinds`: 12.00 / 11.00 / 11.67, mean **11.56**, against #57's 14.33 / 12.33 / 10.33,
mean **12.33**. A decline of 0.78, inside the +/-2 pre-registered band, so the rule says
keep leaps 32-34 and they are kept. Recorded as a decline, not as noise-that-happens-to-
be-fine: nothing in this wave improved kinds.

**Leap 31 landed structurally.** Seed 7 realized modes `[.327 .065 .412 .025 .171]`
against inherited `[.025 .04 .462 .08 .392]` — STRETCH from dominated to most-occupied,
HOLD 13x commoner in practice than in heredity.

**The spread is the real result.** #57 spanned 4.00 across seeds; wave 7 spans 1.00. The
floor rose 1.34 and the ceiling fell 2.33. That is the signature of a stabilising
mechanism, which is what leap 32 is — frequency dependence holds the rare up and the
common down, and it cuts both tails doing it. A wave that compresses variance is not the
same kind of failure as a wave that lowers the mean, and the mean-only reading would have
missed it entirely.

### Open, and honestly open
Seed 23 finished a CARRY monoculture, evenness 0.376, realized `[.028 .854 .059 .041
.018]` against inherited `[.010 .877 .069 .026 .018]` — near-zero switching. Seed 7 kept
its decoupling; seed 23 lost it. That fits leap 34 exactly (a provision-poor lineage
priced out of plasticity) and it is a HYPOTHESIS, not a measurement. `modeSwitches` was
added in this wave for precisely this question and then not surfaced in the harness, so
the current claim rests on `frac ~= biasFrac` rather than on counted transitions. Until
that counter is read, "leap 34 suppressed switching" is a story, and this record's whole
convention is that stories of this shape have been wrong before — twice in one session,
both times refuted by bit-identical runs.

---

## #59 — wave 8. COSMOLOGICAL SCAFFOLDING: reproduction at the level of the world.

**PRE-REGISTERED, before the measurement runs, so the bar cannot move to meet the result.**

The idea, stated as received: clusters that reach a certain size and coherence can *launch* a
daughter simulation with slightly altered physics constants — a true child universe. Most will
die. A few may invent rules that let them communicate back, or merge. Almost certainly too
ambitious, which is why it is worth building.

**What is genuinely new here, against the forty-eight swings already in this file.** Every prior
level of selection selects over things inside ONE physics. Particles own their constants
(`cloneGenome` copies scalars by value). Clusters own `budRate` and `splitFraction`. The shadow
sim perturbs physics constants — but it throws the perturbation away every cadence and scores it
by the parent's own criterion, which is why `EXTRA=shadow` can ablate it without the world
noticing. Nothing in the record has ever been selected over a physics that then had to live with
itself. That is the one thing this wave adds.

**The falsifiers, in the order they should be checked:**

1. **Kinds.** If `lateKinds` falls more than 2.0 below wave 7's mean of 11.56, the wave is
   subtraction and the fix is subtraction, not a ninth wave. Same +/-2 band #58 pre-registered,
   kept deliberately so the two waves are comparable.
2. **The hollow-column check, which is the one that matters.** `launches > 0` proves nothing.
   #58's `MODE_REACH` fired constantly and paid nothing, and the "VERIFIED" commit checked that
   switching *happened*, never that the thing switched *to* paid out. So: if `emissions == 0`
   across seeds, the return path is decoration and must be reported as decoration. If
   `senseHits == 0` while `senseReads` runs to the millions, the sense opcode is a register that
   is always 0 — the same failure wearing a different coat — and reported the same way.
3. **"Most will die" is a claim with a number and it must be measured, not intended.** Already
   measured in an isolated probe that loads the real `cosmosStep` (400 children run to
   completion): 33.5% ever emit, 66.5% never heard from, median peak coherence 0.331 against a
   0.62 gate, median lifetime 521 of 900. If the in-sim rate comes back near 100%, the gate is a
   handout and the number is wrong, whatever the kinds column says.
4. **The payout test the mechanism runs on itself.** `launchDrive` is heritable at the cluster
   level and launching costs amplitude up front. If contact is worth nothing, cluster-level
   selection should push `launchDrive` DOWN from its 0.6 seed mean across a run. This is the one
   check that does not depend on my reading of the numbers, which is why it is here — two
   sincere causal stories in this record were refuted by bit-identical runs, and the arithmetic
   that settled it was available before the first story.

**What this wave does NOT claim in advance.** Not that it raises diversity — nothing about
world-level reproduction has any reason to move `occupiedKinds` at 6k ticks, and if it does I
should distrust the mechanism I built rather than believe the number. Not that merge is
selective: the probe already says 33.0% of children reach 3 emissions against 33.5% reaching 1,
so `COSMOS_MERGE_EMITS` is a DELAY (a child must hold order ~36+ of its own ticks) and not a
second filter. Recorded now rather than discovered later and dressed up.

### #59 RESULT — kept by the pre-registered rule at -1.78, with the attribution weaker than the ablation promised

**Final:** wave 7 mean 11.56 -> wave 8 fixed **9.78**, delta **-1.78**, inside the +/-2.0 band. Kept.
Recorded as a DECLINE that survived its rule, not as a success: nothing in this wave raised kinds on
any seed, and the leaky version at -2.33 had already failed the same band outright.

| seed | wave 7 | w8 leaky | w8 fixed | vs w7 |
|---|---|---|---|---|
| 7 | 12.00 | 10.00 | 11.00 | -1.00 |
| 17 | 11.00 | 8.00 | **8.00** | -3.00 |
| 23 | 11.67 | 9.67 | 10.33 | -1.34 |

**THE HONEST WEAKNESS, STATED BEFORE ANYONE ELSE HAS TO FIND IT.** The COST ablation predicted +4.33
on seed 17 and the fix delivered +0.00 there. Seed 17 ran 3 launches in the fixed build against 14
leaky and 16 ablated — any change in RNG consumption shifts the entire seeded trajectory, so per-seed
before/after is not a comparison, exactly as #48's within-wave attribution rule already established.
Only the aggregate means anything and the aggregate is three seeds. "The leak was the problem and
removing it fixed the wave" is therefore a STORY, and the record's convention is that stories of this
shape have been wrong before — four times in this session alone. What is measured is: the leak was
real arithmetic (18.8 amp annihilated to deliver 1.2 at 100 members), removing it moved the mean
+0.56, and the wave now sits inside its band. The causal link between those facts is not established.

**WHAT IS SOLIDLY MEASURED, across the leaky and fixed builds both:**
- **No hollow column anywhere.** senseReads 0.58M-4.39M with senseHits 29k-2.63M (5-60% nonzero), so
  op235 delivers a live signal rather than the always-0 register that would be #58's failure wearing a
  new coat. 37-56 launches, 277-358 emissions, 6-8 merges. Every leap fires and every leap pays.
- **"Most will die" is a measurement, not an intention.** 21 of 37 logged children ever emitted in the
  fixed build (57%), 24 of 56 in the leaky one (43%). The in-sim discriminator reproduces the isolated
  400-child probe on the axis the probe named: creationCost 0.304 in emitters vs 0.507 in the silent,
  peak coherence 0.701 vs 0.399.
- **0 loop errors, 0 driver errors, all seeds, both builds.** Live browser: 0 console errors, 0 page
  errors, canvas painting 96k non-black pixels, and a child observed dying at age 286 with peak
  coherence 0.4996, having failed the 0.62 gate and starved. The layer costs nothing measurable:
  3000 ticks, 98s off vs 93s on.

**FOUR CAUSAL STORIES, FOUR REFUTATIONS, ONE SESSION.** (1) The probe/sim gap was "successful lineages
carry better constants" — refuted by the per-launch log: r, c and t at 1.00-1.02x default, entropyBaseline
1.39x WORSE, one axis moved and it was the one my calibration divided by. (2) The derived-gain fix then
blew up on NEGATIVE entropyK, caught by the same log. (3) CONTACT was named as a prime suspect for the
diversity cost and came back at EXACTLY 0.00. (4) The launch charge was described in a commit message as
a cost when it was a hole. None of the four were visible in any summary statistic, rendering, or error
count — every instrument built to confirm looked healthy throughout. The only findings today came from
instruments built to return "nothing is happening": the per-launch log, the senseHits/senseReads split,
and the per-leap ablation knobs.

**THE STRUCTURAL CRITIQUE THIS WAVE EARNED, and it is not about the numbers.** The child is never
scored, which was the design intent — but the CHANNEL BACK is gated on coherence x mass held for 12
ticks, and that is a computed fitness function at the world level. It fixes the accounting boundary
exactly where a designer put it: a child that organised as a stable oscillator, as spatial structure,
or as high-turnover flux has no route to being heard, not because it failed but because it did not
succeed in the currency I chose. The second level was built as a second level. Making launchDrive
heritable does not touch this.

Related and worse: the layer is open in matter. Child amplitude is GENERATED by coh*k*mass*gain and
deleted at death, and contact deposits `detritalField += XENO_RESOURCE`, a constant unrelated to
anything the child paid. The leak fixed above was an accounting failure of precisely this kind, found
in the one place the code created and destroyed amplitude with no counterpart — which suggests there
are others where the accounting is equally absent but no instrument happens to point at it.

**NEXT, and it is subtraction of a designer's thumb rather than another mechanism.** Make contact a
CONSERVED TRANSFER: the child pushes its own amplitude across the boundary and the parent receives
exactly that, using the idiom #28's predation already establishes (prey lose exactly what predators
gain). The emission gate then DELETES itself — having matter to push becomes the only criterion, and I
no longer decide what world-level success looks like. It also makes the channel two-way in principle,
which is where Tierra's shape actually lives: a child that draws matter FROM its parent is a parasite,
and that would not need to be built, only stopped from being prevented.

---

## #60 — wave 9. THE BOUNDARY IS CONSERVED, AND THE GATE IS DELETED.

**PRE-REGISTERED before the runs.** This wave is subtraction of a designer's thumb, not another
mechanism, and it acts on the critique #59 earned rather than on its numbers.

**What #59 got wrong, structurally.** The child was never scored — that part held. But the CHANNEL
BACK was gated on coherence x mass held for 12 ticks, which is a computed fitness function at the
world level. It fixed the accounting boundary exactly where I put it: a child that organised as an
oscillator, as spatial structure, or as high-turnover flux had no route to being heard, not because
it failed but because it did not succeed in the currency I chose. The second level was built as a
second level. And the channel was open in matter — `detritalField += XENO_RESOURCE`, a constant
unrelated to anything the child paid.

**The change.** No criterion anywhere on the channel. Matter moves between the child's total
amplitude and the parent's detrital stock at the launch cell DOWN THE DIFFERENTIAL, both directions,
every child tick. Whichever side holds more, loses. Exactly what one loses the other gains, bounded
by what the loser holds and by the reservoir ceiling, so a transfer can be truncated but never
invented. `detritalField` is the right reservoir because it is already a matter stock in amp units
with real consumers — dead particles deposit `amp*0.22`, decomposers harvest at DETRITUS_YIELD — so
arriving matter enters an existing economy rather than a channel built to receive it.

Three things follow that were not designed in:
- Communicating back stops being a binary event and becomes a signed, continuous quantity.
- **Parasitism becomes expressible without being built.** A child whose physics keeps it poor draws
  matter FROM its launch site. Nothing privileges the outward direction. The interesting relation is
  not implemented, it is merely not prevented — which is the Tierra shape, and the thing forty years
  of installed fitness functions have made rare.
- Merge gets a criterion in the SHARED CURRENCY instead of in my aesthetic: a child proposes its
  physics once it has exported more than it was founded with. Any route to net-positive export
  qualifies.

**SCOPE OF THE CLAIM, so it cannot be overread.** The BOUNDARY is closed. The child's interior stays
open in energy — it generates amplitude from `coh*k*mass*gain`, its own sun. That is the real
ecosystem arrangement rather than a half-measure, but it means a thriving child is a net matter
SOURCE for the parent. That is a new failure mode this design could introduce and it is measured
below, not assumed away.

### Falsifiers, in the order they should be checked

1. **CONSERVATION.** `fluxErr` accumulates |actual child delta + actual parent delta| over every
   transfer, measuring stocks either side rather than the intended flow. Anything above
   floating-point epsilon means the channel creates matter and the wave's central claim is false,
   whatever the diversity column says. This is the instrument built to return the answer the design
   forbids.
2. **IS THE SECOND DIRECTION REAL?** If `parasites == 0` across seeds, inward flow is a direction
   that exists only in this comment — a hollow column of exactly the #58 kind, and reported as one.
   The claim "parasitism is expressible" is falsified by zero instances, not excused by them.
3. **IS THE LAYER AN AMP PUMP?** `netFlux` is export minus import into the parent's economy. Large
   and positive means the daughter worlds are inflating the parent, which the metabolic economy will
   feel. Named now because it is the failure mode the conservation fix could plausibly cause.
4. **KINDS.** Against wave 8 fixed (9.78 mean), same +/-2.0 band. Wave 7 reference is 11.56. Stated
   plainly: I do not expect this to raise kinds and would distrust the mechanism if it did, because
   nothing about conserving a boundary has a reason to move standing trait diversity at 6k ticks.
5. **THE GATE IS ACTUALLY GONE.** No coherence or mass criterion may remain anywhere on the channel.
   Checked by grep, not by memory — #58's hollow column was a constant declared and never read, and
   the mirror-image failure is a criterion deleted in the comment and left in the code.

### #60 RESULT — all five falsifiers cleared, and the headline I wanted was wrong

**Kinds: w8 fixed 9.78 -> w9 11.33, +1.56, inside the band. Wave 7 reference 11.56, so w9 sits -0.23
off the pre-cosmology build** — the diversity wave 8 cost is essentially recovered.

| seed | wave 7 | w8 fixed | w9 | w9 vs w8 |
|---|---|---|---|---|
| 7 | 12.00 | 11.00 | 12.67 | +1.67 |
| 17 | 11.00 | 8.00 | 11.67 | +3.67 |
| 23 | 11.67 | 10.33 | 9.67 | -0.67 |

**AND THE OBVIOUS READING OF THAT IS FALSE.** I pre-registered "I do not expect this to raise kinds
and would distrust the mechanism if it did." It rose, so I ran the ablation instead of writing the
commit message. `__COSMOS_CONTACT=0` runs the children with no boundary exchange at all:

| seed | w8 fixed | w9 full | w9 NO FLUX | flux contributes |
|---|---|---|---|---|
| 7 | 11.00 | 12.67 | **12.33** | **+0.33** |
| 17 | 8.00 | 11.67 | 10.00 | +1.67 |

Most of the recovery is **deleting the old gated path**, not conserving the new one. That path called
`xenoImpact`, which deposits inhibitor HAZARD in a ring at every launch site — an unconserved damage
source landing precisely where the largest persistent clusters live, 358 times per run. Removing it is
what moved kinds. On seed 7 the conserved flux is worth +0.33 of a +1.67 recovery; seed 17 reads
+1.67 but on 6 launches against 18, non-comparable under the same trajectory rule applied to #59.

So: **the conserved boundary is justified structurally, not by diversity.** "Conservation recovered
the diversity" was the headline available and it is not what happened. Also note #59's CONTACT
ablation measured that same hazard path at EXACTLY 0.00 — true then, because the launch leak swamped
it; false as a general claim. An ablation is valid only against the build it was run on.

**The other four falsifiers:**

1. **CONSERVATION — passes.** Max single-transfer residual 1.17e-07 against per-transfer flows of
   1e-2 to 1e0; accumulated fluxErr 2.7e-05 to 1.8e-04 over total flows of 15-40. Relative error
   ~1e-7: double-precision arithmetic, not a leak. The assay could have said matter was created.
2. **THE SECOND DIRECTION IS REAL — passes decisively, and this is the result worth keeping.**
   Parasites 4/17/15 of 15/18/19 launches, and **10 of 52 children died having taken more from their
   launch site than they gave it**. Nothing implements parasitism. The differential rule has no
   opinion about direction, and lineages that founded poor worlds got drained by them. This is the
   one place in this file where an interesting relation is NOT PREVENTED rather than installed.
3. **AMP PUMP — real, small, reported as a quantity.** netFlux +39.5/+6.5/+15.3 against 1200 amp of
   world regen over the run: 3.3%/0.5%/1.3%. Population unchanged (343.7/319.3/333.3 vs w8's
   330.3/271.3/357.3). The layer IS a net matter source, as pre-registered; the economy does not
   feel it at this magnitude.
5. **THE GATE IS ACTUALLY GONE — checked by grep, not memory.** No coherence or mass term survives
   anywhere on the channel; the six dead constants are deleted rather than left declared.

**Merges fell 8 -> 4 across seeds.** The currency criterion (export more than you were founded with)
is harder than the old count-three-emissions criterion, which is the intended direction: merge is now
a claim about having paid for yourself rather than about having been loud.

**What this wave does not do.** The child's interior is still open in energy, genome->phenotype is
still a parameter vector plus a fixed projection, and the eligibility gate on LAUNCH (size 9,
coherence 0.55, persistAge 10) is still a designer's criterion — the thumb was removed from the
return path only. The launch side is the obvious next subtraction and it is harder, because
"which clusters may found worlds" has no shared currency to defer to the way the boundary did.

---

## #61 — wave 10. ELIGIBILITY IS AFFORDABILITY. Pre-registered.

#60 removed the announced criterion from the RETURN path and I wrote, in the same entry, that the
LAUNCH path could not get the same treatment because "which clusters may found worlds" has no shared
currency to defer to. That was wrong, and the currency was already in the code: **the price**.

Founding costs `COSMOS_ENDOW_CAP/COSMOS_ENDOW_YIELD` of amplitude. So the only honest question is
whether the members can raise it. `size>=9 AND coherence>=0.55 AND persistAge>=10` is deleted; size
and coherence become CONSEQUENCES rather than criteria (a cluster needs ~11 amp of member mass to
afford the price, which large coherent clusters usually have) but nothing checks for largeness. A
small cluster of rich particles may found a world; a large cluster of starving ones may not.

**A real bug found while doing this.** The old code charged members and then launched on whatever it
raised — `if(endow<=0)continue`. A cluster able to raise 0.3 of a 2.18 price launched anyway, with a
starved child. That was "can you pay anything", not "can you pay", and it means every previous wave's
emit rates include children that were underfunded at birth by a gate that never checked. Affordability
is now computed WITHOUT charging, and a failed attempt costs nothing — charging on failure would be a
hidden tax on exactly the poor clusters the price excludes, which is the same shape as the #59 leak.

### Falsifiers

1. **IS THE SUBTRACTION COSMETIC?** The load-bearing one. Every launch logs `oldGate` (whether the
   old three-criteria gate would have passed) alongside `afford`. If essentially every affordable
   cluster also satisfies the old gate, the two partitions coincide, the subtraction changed nothing,
   and it must be reported as cosmetic — a knob renamed rather than a thumb removed. This is the
   hollow-mechanism check aimed at my own correction rather than at the code it corrects.
2. **DOES THE ECONOMY SURVIVE IT?** Removing three criteria admits more launchers. Each launch drains
   ~2.18 amp against a world regen of 1200 over 6000 ticks. If launches rise far enough to bite,
   `lateN` and `lateMeanAmp` will show it, and heritable `launchDrive` should be selected DOWN — the
   payout test the mechanism runs on itself.
3. **KINDS** against #60's 11.33, same +/-2.0 band. No prediction; stated as no prediction.
4. **CONSERVATION** must still hold (`fluxErr` at epsilon) — #60's guarantee is not allowed to
   regress silently while attention is on the launch path.

### #61 RESULT — the gate was three criteria wearing one, and the one was never specified

**All four falsifiers cleared. Kinds 11.33 -> 11.11, delta -0.22, inside the band. 0 loop errors,
0 driver errors, all seeds.**

**FALSIFIER 1 — NOT COSMETIC, and the reason is the finding.** 85 launches, 38 of which the old gate
would also have admitted: **45% overlap, so 55% of launches came from clusters the old gate refused.**
Then the question that mattered — WHICH of the three criteria was doing the refusing:

| of the 47 refused launches | rejected by |
|---|---|
| `size >= 9` | **0 (0%)** |
| `coherence >= 0.55` | 7 (15%) |
| `persistAge >= 10` | **45 (96%)** |

The size criterion never bound ONCE in three seeds. The smallest cluster the affordability gate
admitted had size 11 — already over the threshold — because the price itself requires ~11 amp of
member mass and size follows from that. The gate that read as "size AND coherence AND persistence"
was, in operation, `persistAge >= 10` with two ornaments.

**This matters more than the subtraction.** The wave was specified as "clusters that reach a certain
size and coherence" — and the code was selecting on AGE, a criterion nobody specified, with no evident
bearing on whether a cluster can found a world. Newly-admitted launchers average size 50.2, coherence
0.841, persistAge 3.3 against the old population's 78.7 / 0.895 / 26.3: they are large and coherent
and simply YOUNG. Every previous wave's launcher pool was an age-filtered sample and nothing in the
file said so, because a compound condition reports as one boolean and no instrument had ever asked
which term flipped it. Same family as MODE_REACH — apparatus that reads as load-bearing and is not —
but harder to see, because here two of the three terms were live and one was inert.

**FALSIFIER 2 — the economy absorbed it, and slightly benefited.** Launches roughly doubled on seed 7
(15 -> 36; 18 -> 23; 19 -> 26). lateN ROSE on all three (343.7 -> 356.7, 319.3 -> 334.7, 333.3 ->
353.3) and meanAmp rose on two. netFlux into the parent rose to 47.7/25.9/28.1, i.e. 4.0%/2.2%/2.3%
of world regen — the layer is a larger net matter source than it was, and population rose alongside
it. Direction is consistent with subsidy; causation is NOT established and one should not read it as
established. launchDrive went 0.55->0.595, 0.469->0.433, 0.771->0.611: two of three down, not
decisive either way.

**FALSIFIER 4 — conservation held while attention was elsewhere.** maxSingle residual 1.19e-07,
unchanged from #60. Parasites rose 4/17/15 -> 12/16/20.

**A REAL BUG, fixed in passing and worth its own line.** The old code charged members and then
launched on whatever it raised. A cluster able to raise 0.3 of a 2.18 price founded a starved child
anyway. So every emit rate this file has reported for waves 8 and 9 — including the 43% and 57%
"most will die" figures — includes children underfunded at birth by a gate that never checked what it
collected. Those numbers are not retracted, but they are not clean either, and the affordability gate
is the first version where the price is actually enforced.

---

## #62 — TERM-LEVEL GATE AUDIT. Speciation-by-divergence has never fired, and the reason is a cross-level flag.

**The instrument, and why it did not exist before.** #61 found the cosmology's launch gate — written
as `size>=9 AND coherence>=0.55 AND persistAge>=10` — was in operation `persistAge>=10` with two
ornaments, the size term having rejected exactly zero candidates in three seeds. That is a general
failure mode with no instrument in this project: **a compound condition reports as ONE boolean.**
Every readout here — counts, rates, diversity curves, ablation arms — sees `eligible: true/false` and
cannot see which term flipped it. Dead apparatus does not only hide in unread constants (MODE_REACH,
#58); it hides INSIDE live conditions, where two of three terms firing makes the whole gate look
load-bearing. `harness-gates.js` rewrites chosen conditions into per-term counters and reports, for
each term, how often it was **the sole blocker** — a term that is never the sole blocker never
independently changed an outcome, so deleting it admits exactly the same set. Per-term, falsifiable,
where every prior instrument could only judge whole mechanisms.

Only PURE gates are instrumented: forcing evaluation of a `Math.random()` term would consume draws
the original short-circuits away and shift the seeded trajectory, auditing a different world than the
one under audit. The per-interaction predation gate (5.6M evaluations per 2000 ticks) is opt-in
behind `HOT=1` — instrumenting it tripped the watchdog and produced a loop error, which is itself the
measurement that it is a hot path.

### THE FINDING: `speciate_parent` passes 0.0% (seeds 7 and 17, 6000 ticks)

| term | seed 7 block / SOLE | seed 17 block / SOLE |
|---|---|---|
| `noEntry` | 24.4% / 24.4% | 4.9% / 4.9% |
| **`extinct`** | **75.6% / 74.8%** | **95.1% / 95.1%** |
| `tooYoung` | 0.8% / **0.0%** | 0.0% / **0.0%** |

127 and 81 evaluations, **zero passes**. The trait-distance branch fires readily; the parent
eligibility test then rejects every single candidate, almost entirely on `extinct`.

**The cause is a cross-level flag.** `trackClusterPersistence` maintains extinction like this:

```js
const livingLineages=new Set();
for(const c of clusters) if(c.lineageID) livingLineages.add(c.lineageID);   // CLUSTER lineages
for(const [lid,entry] of lineageRegistry) if(!entry.extinct && !livingLineages.has(lid)) entry.extinct=true;
```

It marks a lineage extinct when no **cluster** carries that id. The speciation gate reads
`lineageRegistry.get(pLin[parentA])` — a **particle** lineage. There are 7–20 clusters at a time
against 18–22 distinct live particle lineages and a registry of 870+ entries, so a particle can be
alive and breeding while its lineage is flagged extinct because no cluster happens to carry that id
this cycle. Extinction is being decided at the cluster level and read at the particle level.

**And `SPECIATE_MIN_AGE` is dead apparatus.** It is the criterion the swing was designed around —
"parent lineage must be established before it can throw daughters" — and it blocked 1 attempt out of
208 across two seeds, never as the sole blocker. It has never changed an outcome.

**A HYPOTHESIS OF MY OWN, MEASURED AND REFUTED.** Seeing `noEntry` block 77.5% in a 2000-tick pilot,
I proposed a namespace collision: `pLin` is assigned from `_linNext++` for founders and from
`createLineage()`'s `nextLineageID++` for speciated particles, two independent counters (lines 5875
and 7851), so `lineageRegistry.get(pLin[x])` would be a cross-namespace lookup hitting only by
coincidence. Direct assay: **100% of live particles' pLin values are registry keys** on both seeds
(407/407 and 369/369). The counters' ranges overlap (`_linNext` 334 vs `nextLineageID` 871), so the
lookups hit. The two-counter hazard is real and latent — nothing keeps those ranges aligned — but it
is not what is blocking speciation, and the story would have been wrong in print for the fifth time
this session had the assay not been built to check it.

### What this does NOT establish
Whether the `__SPEC` mint path (`specMint`, which assigns `pLin` from its own `createLineage`) also
fails — it is a different mechanism and was not instrumented. And whether fixing the extinction sweep
to include particle lineages *helps*: that is a one-line change with large consequences for lineage
turnover, and it needs its own pre-registration and its own measurement rather than being bolted onto
the wave that found it. Recorded as the next step, not performed as part of this one.

---

## #63 — fix the extinction sweep. Pre-registered.

One line: `livingLineages` now also collects `pLin[i]` for every live particle, not only cluster
lineage ids. A lineage is alive if ANY live particle carries it. Clusters are re-detected by
flood-fill every 60 ticks and are a far coarser, more transient object than a lineage; using them as
the liveness test made lineage death an artifact of clustering.

### Falsifiers
1. **DOES SPECIATION NOW FIRE?** The direct test, and the reason for the change. `speciate_parent`
   passRate must leave 0.0%. If it does not, the extinct flag was not the binding constraint and the
   #62 attribution was wrong.
2. **DOES `SPECIATE_MIN_AGE` COME ALIVE?** It blocked 1 of 208 and was never the sole blocker. If it
   is still never the sole blocker with `extinct` out of the way, it is dead apparatus on its own
   merits and should be deleted rather than kept as decoration — the #58 rule applied to a constant
   this session found rather than inherited.
3. **KINDS** against #61's 11.11, +/-2.0 band. Speciation firing for the first time could go either
   way: more lineages could mean more standing diversity, or fragmentation into unviable singletons —
   the 77%-singleton pathology waves 1-2 were built to cure. No prediction offered.
4. **DOES THE REGISTRY BLOW UP?** `pruneLineages` only deletes entries that are `extinct`, so marking
   fewer lineages extinct means pruning less. Registry size and `lateN`/`meanAmp` are watched; an
   unbounded registry on a phone is a defect even if diversity improves.

### #63 RESULT — speciation fires for the first time, and a constant was deleted by its own pre-registered rule

**FALSIFIER 1 — SPECIATION NOW FIRES. `speciate_parent` passRate 0.0% -> 32.9%** (45 of 137
evaluations, seed 7). #62's attribution is confirmed: the cross-level `extinct` flag was the binding
constraint, and speciation-by-divergence — a mechanism this file has claimed since #52 — had never
once completed until this one-line change. `extinct` still blocks 44.5% (down from 75.6%), which is
now legitimate: those are lineages with no live carrier at all.

**FALSIFIER 2 — AND SPECIATE_MIN_AGE FAILED IT, SO IT IS GONE.** With `extinct` out of the way it
blocked **0 of 137**. The pre-registration said: if it is still never the sole blocker, it is dead
apparatus on its own merits and should be deleted rather than kept as decoration. Deleted — both the
term and the declaration, because a declared-but-unread constant is exactly the MODE_REACH pattern.

The deletion claim was that removal is behaviour-neutral, and that claim was CHECKED rather than
asserted: seed 7 came back **bit-identical** — kinds 12.3333, N 357, meanAmp 1.1675, latePurity
0.6324, and the entire `finalSample` and cosmos telemetry blocks equal. The term was structurally
unreachable (by the time a lineage has a registry entry and is not extinct it is always older than
400 ticks), not merely unlucky. Not retuned upward until it bound, because raising a threshold until
it binds is tuning a criterion to justify its own existence.

**FALSIFIER 3 — KINDS 10.89 vs #61's 11.11, -0.22, inside the band. But the risk named in advance
materialised on one seed.**

| seed | #61 | #63 | nLin | maxLin | singleFrac |
|---|---|---|---|---|---|
| 7 | 12.33 | 12.33 | 33 | 146 | 0.064 |
| 17 | 11.33 | 11.67 | 34 | 88 | 0.050 |
| 23 | 9.67 | **8.67** | **137** | 90 | **0.360** |

The pre-registration said speciation firing could fragment the population into unviable singletons —
the 77%-singleton pathology waves 1-2 were built to cure. Seeds 7 and 17 stayed consolidated (33-34
lineages, 5-6% singletons). Seed 23 went to 137 lineages at 36% singletons and lost a full kind.
**That is the predicted failure mode appearing in 1 of 3 seeds**, and it is the thing to watch: if
speciation is going to be load-bearing it has to produce lineages that persist, and on seed 23 it is
producing lineages that do not. Recorded as an open risk, not as an acceptable cost.

**FALSIFIER 4 — the registry grew 870 -> 1166 (+34%).** `pruneLineages` only deletes entries that are
`extinct`, so marking fewer lineages extinct means pruning less. Not unbounded at 6k ticks and
`MAX_LINEAGE_HISTORY` still gates the sweep, but the live pool runs to 467k and this was never
measured there. Standing caveat, not a clean pass.

**Cumulative note on this session.** Six causal stories formed, six checked, five refuted or
substantially corrected by instruments built to return "nothing is happening": the heredity
explanation for the probe/sim gap, the negative-entropyK blowup, CONTACT as the diversity cost, the
launch charge described as a cost when it was a hole, the pLin namespace collision, and the
conservation-recovered-diversity headline. The one that survived contact with its instrument was
#62's `extinct` attribution — and it survived because the audit measured which TERM blocked rather
than whether the gate blocked.

---

## #64 — the fragmentation risk retired, a second dead term deleted, and a methodological hole opened

**THE FRAGMENTATION RISK #63 PRE-REGISTERED IS RETIRED, and not by argument.** Seed 23's 137
lineages at 36% singletons was a TRANSIENT RADIATION, not a shattering. At 12000 ticks the same seed
reads nLin 16, singleFrac 0.027, maxLin 145, multiFrac 0.973 — radiation followed by selection, which
is what speciation is supposed to look like. It was also not common: fresh seeds 3 and 11 came in at
nLin 40/18 and singleFrac 0.065/0.024. Seed 23 at 6k was one of five seeds caught mid-radiation.

**THE CONTROL THAT MATTERED.** Kinds fell 8.67 (6k) -> 5.00 (12k) on that seed and the obvious
reading was that speciation firing had cost diversity at horizon. Run against the PRE-#63 build via
`INDEX=` at the same seed and horizon: **pre-fix 5.40, post-fix 5.00.** The collapse is the seed's
own trajectory, present in both builds; the fix costs 0.40 kinds, noise. Without the isolated control
this would have been recorded as the extinction fix damaging long-run diversity, which is false.

### THE METHODOLOGICAL HOLE THIS OPENED, and it is the most important line in this entry

Seed 23 loses ~40% of its standing kinds between 6k and 12k **in both builds**. Every wave in this
session — #58 through #63 — was measured at 6000 ticks and every +/-2.0 band was drawn there. If 6k
sits mid-transient, those bands measured a TRAJECTORY rather than a STATE, and a wave could pass its
band at 6k while making things worse at horizon. Nothing tested that until now.

Compounding it: seeds 3 and 11 read kinds 8.67 and 9.33, against seeds 7 and 17 at 12.33 and 11.67.
The 7/17/23 triple used as the standard all session may not be representative of the seed
distribution, which would make every band noisier than it looked. **No wave in this session is
retracted on this basis — but every verdict in it is now conditional on a 6k horizon and a 3-seed
sample, and that condition was never stated when the verdicts were given.** The fix is a wider sweep
at a longer horizon before any future wave leans on those bands, not a re-litigation of the ones
already recorded.

### A SECOND DEAD TERM DELETED: `avgAmp<0.38` in the cluster-upstream gate

Sole blocker **0 times in 314 evaluations** across four runs (seeds 7 and 17, before and after the
#63 fix). A term that is never the sole blocker cannot change what a gate admits — every time it
blocked, another term blocked too — so removal is behaviour-neutral by construction. Checked, not
argued: seeds 7 and 17 both came back **bit-identical**, finalSample included.

**The claim is deliberately scoped weaker than #63's.** `SPECIATE_MIN_AGE` had a structural argument
— a lineage with a live registry entry is always older than 400 ticks, so the term was unreachable.
This one has only a correlation: `avgAmp<0.38` means a starving cluster, and starving clusters are
also young, so `persistAge<6` fires first. Correlations can come apart in an unsampled regime. "Dead
in every regime measured" is the ceiling here, not "dead", and the comment in the code says so.

**Running total from the gate audit: three gates instrumented, two dead terms found and deleted, both
deletions verified bit-identical.** `cluster_upstream` is now `persistAge<6 || coherence<0.45`, where
`coherence` does bind (sole 6 times of 99 post-fix) and `persistAge` does 57-65% of the work.

---

## #65 — two more gates audited. One is entirely dead and is being KEPT, and the reason is the finding.

**`spec_entrain` (behavioural-isolation gate for entrainment, #17): both terms live.** crossLineage
sole 55.8%, mismatch sole 5.8%, across 1.47M evaluations. No dead term. It is a PER-PAIR path and
instrumenting it produced a watchdog loop error — the same signature the predation gate gave — so it
now sits behind `HOT=1` with predate, and its numbers must not be mixed with a run not carrying that
cost.

**`upstream_prog` (`if(!c.vmProgram||c.vmProgram.length<2)continue;`): the ENTIRE GATE is dead.**
55 evaluations across seeds 7 and 17, 55 passes, both terms blocking zero times. And unlike `avgAmp`
this one has a full structural argument: `seedClusterVM()` pads with NOPs
(`while(indices.length<MAX_CLUSTER_VM)indices.push(-1)`) and pushes exactly one instruction per
index, so it ALWAYS returns exactly MAX_CLUSTER_VM=8 entries; inherited programs are deep copies of
that. Neither `!c.vmProgram` nor `length<2` is reachable.

### AND IT IS NOT BEING DELETED. That distinction is the point of this entry.

By the rule applied in #63 and #64, a structurally unreachable term is dead apparatus and should go.
Applying that rule here would be wrong, and the audit cannot tell the difference on its own:

- `SPECIATE_MIN_AGE` was a **biological criterion** — "parent lineage must be established before it
  can throw daughters." It claimed to do selective work, shaping which lineages speciate. It never
  did any. That is DECORATION: apparatus that reads as load-bearing and is not, which is the whole
  pattern this record exists to catch.
- `!c.vmProgram || length<2` is a **null-safety guard**. It claims no selective work whatsoever. Its
  job is to be false. It is inert BY DESIGN, not by accident.

The gate audit finds inert TERMS. It cannot distinguish decoration from a defensive rail, because
that distinction lives in what the term CLAIMS, not in what it does — and only the claim can be
falsified. Deleting a guard because it has never yet been needed is how an invariant becomes a crash
two waves later, and this session has already changed `vmProgram` handling once.

**So the audit's output requires a second, human judgement, and pretending otherwise would make the
instrument itself a source of confident error.** Recorded as INERT-BY-DESIGN, kept, and the reason
written down so the next pass does not re-flag it and delete it.

**Running total: 5 gates instrumented, 3 fully-inert terms found. 2 deleted (both verified
bit-identical), 1 kept deliberately.**

---

## #66 — THE HORIZON RESULT. Every diversity verdict in this session was measuring a transient.

### The sweep

Current build, 12000 ticks, 7 seeds: kinds mean **6.83**, sd 1.67, range 5.00–9.80. Against the 6k
values every band in this session was drawn from:

| seed | 6k | 12k | change |
|---|---|---|---|
| 3 | 8.67 | 9.80 | **+1.13** |
| 7 | 12.33 | 7.80 | −4.53 |
| 11 | 9.33 | 5.40 | −3.93 |
| 17 | 11.67 | 6.20 | −5.47 |
| 23 | 8.67 | 5.00 | −3.67 |
| **mean** | **10.13** | **6.84** | **−3.29** |

**6k does not predict 12k in level OR in rank order.** Seed 7 was best at 6k and third at 12k; seed 3
was joint-worst at 6k and best at 12k. The two seeds that looked strongest at 6k fall hardest.

### The comparison every verdict actually needed

Wave 7 (pre-cosmology, commit 64fe602, via `INDEX=`) against the current build, same seeds, 12000
ticks:

| seed | wave 7 | current | delta |
|---|---|---|---|
| 3 | 9.40 | 9.80 | +0.40 |
| 7 | 10.80 | 7.80 | −3.00 |
| 17 | 3.40 | 6.20 | +2.80 |
| **mean** | **7.87** | **7.93** | **+0.07** |

**Waves 8, 9 and 10 plus the #63 extinction fix are DIVERSITY-NEUTRAL at horizon.** +0.07 kinds
against per-seed swings of ±3. Not a win, not a loss — no detectable effect.

### What this does to the session's own record

Every band drawn at 6k was measuring a transient, and the drama it produced was noise:
#59's "−2.33, FAILS the band", the leak subtraction that "rescued" it to −1.78, #60's "+1.56,
recovered nearly everything wave 8 cost", #61's −0.22, #63's −0.22. At 12k none of those differences
survive. The verdicts were sincerely derived, pre-registered in advance, applied against my own work
— and drawn from a horizon that does not carry to the next one.

Worse for the method: the 12k spread across 7 seeds is 4.80 with sd 1.67, so a 3-seed mean carries a
standard error near 0.96 and the ±2.0 band is about two standard errors. Marginal on its own terms
even before the horizon problem.

**Not retracted: the STRUCTURAL results, none of which were diversity arguments.** Conservation at
double-precision epsilon (max residual 1.17e-07). Parasitism emerging from a differential rule that
has no opinion about direction — 10 of 52 children dying having taken more than they gave. Speciation
going 0.0% → 32.9% pass rate after a one-line cross-level fix, a mechanism claimed since #52 that had
never once completed. Two bit-identical deletions. The launch gate being `persistAge` with two
ornaments, size having rejected 0 of 47. Those stand on their own measurements.

**An observation, offered as an observation and not a claim:** population is higher in the current
build on all three horizon-controlled seeds (361→379, 200→351, 356→373). That was not pre-registered,
n=3, and `lateN` is not what any of this was aimed at. It is the kind of number that becomes a
confident story if left unqualified, and this file has six of those from today alone.

### The standing correction to method

Nothing in this project should draw a diversity verdict at 6000 ticks again. The minimum honest
protocol is 12000+ ticks and ≥5 seeds, with the prior build run under `INDEX=` at the SAME horizon
rather than compared to a remembered number. That is roughly 4x the compute per verdict, and the
alternative is what this session did: five sincere, pre-registered, self-applied verdicts that a
longer run erases.

---

## #67 — RETRACTION. #63's speciation headline measured numeric aliasing, and my refutation of that was wrong.

**A code review of `64fe602..HEAD` found what six instruments and eleven commits had not.** The
highest-severity finding contradicts an entry in this file that I wrote as a refutation.

### What I claimed, and what was true

In #62 I hypothesised a namespace collision: `pLin` is minted from `_linNext++` for founders and from
`createLineage()`'s `nextLineageID++` for speciated particles — two independent counters — so
`lineageRegistry.get(pLin[x])` would be a cross-namespace lookup hitting only by coincidence. I then
built an assay, measured "100% of live particles' pLin values are registry keys", and recorded the
hypothesis as REFUTED, adding it to the session's tally of wrong causal stories.

**The assay asked the wrong question.** "Does `pLin[i]` have a registry entry" returns TRUE under
aliasing — that is what aliasing means. It never asked whether the entry BELONGS to that lineage.
A provenance assay that tags each id at its mint site says:

| | |
|---|---|
| live particles | 324 |
| carrying a founder id that indexes ANOTHER lineage's record | **316** |
| properly registered | **8** |
| non-extinct registry entries | 84 |
| of those, cluster-carried | 6 |
| **held alive by aliasing alone** | **70** |

So the hypothesis was RIGHT and the refutation was an artifact of a weak instrument. This is the
seventh causal error of the session and the first where the fault was in the instrument built to check
the story rather than in the story — which is worse, because the whole method rests on those.

### What that invalidates

- **#63's headline "speciation fires, passRate 0.0% -> 32.9%" is RETRACTED.** `_pe` was a foreign
  lineage's record. What fired was an aliased lookup, not a criterion. `_pe.children.push(_new)` and
  the `parentLineage` field recorded FABRICATED parentage for every one of those events.
- **#63's extinction fix made the aliasing load-bearing.** Adding `pLin[i]` to `livingLineages` marks
  registry entries non-extinct by numeric coincidence, so `pruneLineages` — which only deletes extinct
  entries — could never reclaim 70 of 84.
- A second silent failure, same review: the `speciate_parent` patch in `harness-gates.js` targeted a
  string that #63's own `SPECIATE_MIN_AGE` deletion had removed, via unchecked `split/join`. It
  matched ZERO times, the gate vanished from every audit after 341c45a, **and #65's results were
  printed without it while I did not notice its absence.** `patchOnce` exists precisely to prevent
  that and I bypassed it. Replaced with `patchExactly(...,expected)`, which asserts the count in both
  directions — the speciation gate legitimately appears twice (addParticle and addCompound).

### The fix: ONE NAMESPACE

Founders now mint through `createLineage` in both spawn paths, and `specMint`'s two sites do the same
(they had a THIRD bookkeeping system — `linParent`/`linBirthTick`/`linBirthSameCell` — and minted from
`_linNext` as well, which made specMint lineages permanently ineligible for speciation-by-divergence).
Every `pLin` value is now a real registry key with a real birthTick and a real parent.

**Measured after the fix:** 324 of 324 live particles properly registered, 0 aliases, 0 entries held
alive by aliasing.

**And the gate is now vacuous, which is the honest reading.** `speciate_parent` passes 21 of 21
(100%): with one namespace plus #63's extinction fix, `_pe && !_pe.extinct` never rejects anything.
Speciation-by-divergence now fires on trait distance alone — arguably correct, since `SPECIATE_DIST`
is the actual criterion — but the eligibility test is now a null-check that always passes, i.e. inert
by design in the #65 sense. It stays, for the #65 reason, and this note is here so the next pass does
not read 100% as a triumph.

**Open, and measured next, not asserted:** speciation firing unconditionally could mint lineages
without bound (non-extinct entries already 84 -> 108). Under the #66 protocol this needs 12000+ ticks
and >=5 seeds against the prior build at the same horizon. Nine further review findings remain
unaddressed and are listed in the commit.

---

## #68 — the remaining nine review findings, fixed. Two needed a second attempt.

A code review of `64fe602..HEAD` raised eleven findings. #67 handled the three severe ones (the
aliasing retraction, the fabricated parentage, the silently-dead audit patch). These are the other
nine. Live-verified after: 0 console errors, 0 page errors, canvas painting 108k pixels, 342 alive
across 16 clusters, conservation intact at 1.15e-07.

**4 — the sense ablation arm was not a control.** `wireCosmosOpcode` returned immediately on
`__COSMOS_SENSE=0`, skipping ~7000 `Math.random()` draws per 3000 ticks and shifting the whole seeded
trajectory: measured divergence launches 12 vs 11, lateKinds 16 vs 14, from a knob meant to isolate one
opcode splice. Every draw is now consumed on both sides and only the write to `pProg` is withheld.

**5 — two knobs that were secretly one.** `cosmosMerge` is reachable only from `cosmosFlux`, which
`cosmosContactOn()` gates, so `__COSMOS_CONTACT=0` also zeroed MERGE. #59's ablation table read them as
independent and its MERGE row (+1.33) was confounded; #60's no-flux arm disabled merge too. This is
inherent — merge's criterion is a fact about cumulative export, and export only happens in that call —
so it is documented at both sites and the harness now REPORTS the nesting when the knob is set, rather
than a second code path being invented to hide it.

**6 — the proposal direction was being rotated, and the first fix was not enough.** Proposals were
computed against a launch-time snapshot of the GLOBAL genome while `phys` derives from the lineage
mean, so the delta mixed the child's perturbation with its lineage's drift. Fixed to the inherited
baseline — and it was still saturated, 6 of 10 axes at exactly +/-2. The real cause is scale:
`SCEN_TEST` is calibrated for the small nudges the shadow bank normally carries (e 1.5e-4, k 5e-5),
while a `COSMOS_CONST_DRIFT` perturbation is a 35% multiplicative shift of an evolved constant — in
bank units k 7.0, t 5.2, c 4.1, e 1.9, r 1.7. Clamping per axis pinned k, t and c while leaving e and r
interior, **rotating the vector into a direction no child ever discovered.** Now divided through by the
largest component: direction preserved exactly, magnitude given up (the bank re-scales via `SCEN_APPLY`
anyway). After: exactly one axis at the clamp per entry, which is the largest component by construction.

**7 — counters that could only ever say yes.** `emitters`/`emissions` counted a threshold crossing that
is always true: under the conserved boundary an outward flow happens whenever the child holds more than
its launch cell, and a launch cell is usually empty. Measured launches 15, emitters 15, emissions 4688.
Read as "was heard", meaningless. Renamed `everExported`/`fluxTicksOut` — transfer bookkeeping, named
for what it is. The quantity that carries meaning is net export against the endowment, which the merge
criterion already tests.

**8 — the knife edge disagreed with the physics it calibrated.** Gain used `Math.abs(k)` while income
runs the sign-clamped `phys.k`, so for inherited k = -1.38e-4 the gain was set against 1.38e-4 while
income ran at 1e-6: income/drain ~0.007 instead of ~1, deterministic starvation with the perturbation
discarded — contradicting that block's own claim that the outcome reduces to the ratio of the two
perturbations. Both now clamp identically without `abs`, so a negative-k lineage contributes nothing on
the k axis and e decides.

**9 — the log omitted exactly what it existed to record.** `exported`/`imported` were written only on
death, so surviving children (6 of 15 at 3000 ticks) had no trade figures. Written every cycle now;
verified a live row reads exp=0.708 imp=0.001 at age 840.

**10 — a missing guard its own sibling had.** The launch charge loop lacked the `Math.max(0,...)` the
affordability scan twelve lines above has; a member with negative amplitude would GAIN amplitude and
reduce `raised`. Not observed, fixed anyway.

**11 — three comment blocks describing machinery that no longer exists.** The wave-8 header, the
`cosmosStep` header and the LIVE flag description all still specified `COSMOS_EMIT_HOLD`,
`COSMOS_MERGE_EMITS` and an `xenoImpact` call, none of which survived #60. Prose describing removed
mechanism is the MODE_REACH pattern in documentation — a reader trusts it exactly as much as a
declared constant. The wave-8 header is marked SUPERSEDED rather than deleted, since the record of what
was tried is the point of this file; the other two are corrected.

**Method note.** Eleven findings, in code that six purpose-built instruments and eleven commits of
measurement had already been over. The instruments caught what they were pointed at; the review caught
what nothing was pointed at, and two of its findings (the aliasing, the audit patch matching zero
times) invalidated conclusions this file had already recorded as results. Measurement and reading are
not substitutes for each other.

---

## #69 — the #67 namespace fix under the #66 protocol. Pre-registered.

#67 changed lineage identity across the whole system — founders and both `specMint` sites now mint
through `createLineage` — and it has never been measured. #66 established the protocol: 12000+ ticks,
>=5 seeds, prior build at the SAME horizon rather than against a remembered number. The control already
exists: the `h12k-*` runs were taken at #66, before #67, on these seeds, at this horizon.

### Falsifiers

1. **DOES THE REGISTRY GROW WITHOUT BOUND?** The named risk. Every founder now creates a registry
   entry, and #63's fix marks entries non-extinct while any live particle carries them, while
   `pruneLineages` only deletes extinct ones. Non-extinct entries were already seen rising 84 -> 108 at
   3000 ticks. If registry size grows superlinearly to 12000, the fix is a memory leak on a piece that
   must run on a phone, and that outweighs any diversity result.
2. **DOES SPECIATION NOW RUN AWAY?** `speciate_parent` passes 100% post-fix (the gate is vacuous), so
   divergence alone mints lineages. If `nLin` explodes and `singleFrac` stays high at 12k — rather than
   radiating and consolidating as seed 23 did in #64 — the fix has traded a broken gate for unbounded
   fragmentation.
3. **KINDS** against the pre-#67 12k values, +/-2.0 band, 5 seeds. No prediction. #66 showed this
   metric does not carry between horizons and that the band is roughly two standard errors at n=3;
   at n=5 it is tighter but still wide.
4. **ECONOMY**: `lateN` and `lateMeanAmp` against the same control, plus 0 loop errors.

Stated in advance: the #67 fix was made because the old code was WRONG — `lineageRegistry.get(pLin[x])`
returned another lineage's record for 316 of 324 particles and speciation recorded fabricated parentage.
Correctness is the reason it stands. If it costs diversity it still stands, and the cost is recorded as
a cost; a fix for fabricated data does not need to also improve a metric to be justified.

### #69 RESULT — partial mitigation, and the baseline it was measured against is not a valid target

Restored criterion, #66 protocol (12000 ticks, 5 seeds), against both the vacuous-gate build and the
pre-#67 build at the same horizon:

| | pre-#67 | vacuous gate | criterion restored |
|---|---|---|---|
| mean nLin | 13.8 | 110.4 | **82.2** |
| mean singleFrac | 0.012 | 0.287 | **0.198** |
| mean kinds | 6.84 | 5.96 | 5.76 |
| mean lateN | 369.0 | 369.1 | 373.1 |

Restoring `SPECIATE_MIN_AGE` cut singletons 31% and lineage count 25%. It is a **partial mitigation,
not a cure** — and on seeds 11 and 23 it did nothing at all (73 -> 104, 162 -> 168). Kinds -1.08 against
the pre-#67 baseline, inside the band; economy healthy; 0 loop errors across all five seeds.

**THE COMPARISON IS INVALID AND THAT IS THE POINT.** The pre-#67 baseline of singleFrac 0.012 was
measured on a build where speciation-by-divergence NEVER FIRED — #62 established 0 passes in 208
evaluations. It is the singleton fraction of a system with no speciation in it. Treating it as the
target means treating "the mechanism is broken" as the goal, which is what the whole #62-#67 arc was
about escaping.

**And the number is genuinely ambiguous.** A newly speciated lineage IS a singleton until it
reproduces, so part of 0.198 is exactly what working speciation looks like and part may be the churn
pathology waves 1-2 cured. Those are opposite readings of one statistic. The waves 1-2 claim was never
about singleton COUNT — 77% singletons meant nothing was descending — so the distinguishing question is
whether these new lineages **recruit members or die alone**, and **no instrument in this project tracks
lineage lifespan or per-lineage growth.** `singleFrac` is a snapshot and cannot answer it, exactly as
`occupiedKinds` cannot distinguish selective pruning from monoculture (established earlier in this
file, and re-learned here).

**So this is left OPEN rather than resolved, and the missing instrument is named:** a per-lineage
lifespan and recruitment census — for each minted lineage, ticks survived and peak member count. Until
that exists, "0.198 singletons is fragmentation" and "0.198 singletons is speciation working" are both
stories, and this record's whole convention is that stories of that shape have been wrong seven times
in this session.

**What stands:** #67 (correctness — the lookup was returning foreign records for 316 of 324 particles),
#69's restoration (the criterion is load-bearing for the first time: `tooYoung` blocks 25% and is the
sole blocker every time, while `noEntry` and `extinct` are now the inert terms — a complete reversal of
the pre-fix audit). Both are justified on mechanism. Neither is justified on diversity, and neither is
claimed to be.

**A note on the band, because it would have waved this through.** Kinds came in inside +/-2.0 at every
stage of this arc — vacuous gate included, where nLin hit 204 and singletons 53%. The pre-registered
headline metric never noticed. Falsifier 2 existed only because #63 had made me suspicious enough to
write it down, and it is the only reason any of this surfaced. A pre-registered band is not protection
if the band is measuring the wrong quantity.

---

## #70 — the lineage lifespan and recruitment census. The instrument #69 named, built and controlled.

#69 ended on an open question and, unusually for this file, on a specification for the thing that would
close it: *"a per-lineage lifespan and recruitment census — for each minted lineage, ticks survived and
peak member count."* Until that exists, "0.198 singletons is fragmentation" and "0.198 singletons is
speciation working" are both stories, and this session's stories have been wrong seven times.

### What was built

Three fields on each registry entry, written by the existing lineage census (detection cadence, 60
ticks) and read only by instruments:

- **`src`** — the MINT SITE, tagged at `createLineage`. Six exist and they are not the same mechanism:
  `founder` (a parentless spawn), `cluster` (a spontaneous cluster at detection), `bud` (cluster
  budding), `speciate` (trait-divergence in `addParticle`/`addCompound`), `specMint` / `specDeme`
  (cladogenesis, `__MINT_GATE` cell vs cluster mode). #69 could not ask its own question without this:
  post-#67 every parentless particle mints a registry entry too, so "82 lineages" could be 82
  divergence events or 82 founders that never reproduced, and `singleFrac` cannot tell those apart.
- **`peak`** — max simultaneous live-particle membership ever observed. With `birthTick` and the
  already-present `deathTick` this gives lifespan and recruitment per lineage.
- **`zombie`** — censuses at which the entry read `extinct` while something still carried it. The
  `extinct` flag is deliberately NOT cleared: it is read by the speciation gate, so un-setting it would
  make the instrument change the dynamics it measures. A stale flag becomes a number instead of silence.

`linPruned` accumulates what `pruneLineages` deletes, so `registry + pruned === minted` is checkable and
a partial census reports as partial rather than as a total that merely looks complete.

**Stated resolution limit, because it bounds every reading below:** the census runs at the detection
cadence. A lineage minted and extinguished inside one 60-tick cadence records `peak` 0 — real, but not
distinguishable from a lineage that lived 59 ticks holding one particle.

### Falsifiers

1. **CONTROL — DOES THE INSTRUMENT MOVE THE SYSTEM?** It adds no `Math.random()` draws and writes only
   fields nothing branches on. Predicted bit-identical output against the pre-census build on every
   reported field. **If any field differs the census is discarded and rebuilt** — an instrument that
   perturbs its subject is #68's finding 4 again, and that one shifted a whole seeded trajectory from a
   knob meant to isolate one opcode.
2. **WHERE DO THE SINGLETONS COME FROM?** Predicted: the live singleton population is dominated by
   `founder`, not by either speciation mechanism. **This prediction is NOT blind** — it is read off
   1000- and 3000-tick pilots (seeds 11, 13) run while building the instrument, and it is recorded here
   as a pilot-informed prediction rather than dressed up as foresight. What is genuinely open is
   whether it survives to 12000, the horizon #66 established as the only one this project may draw a
   diversity verdict at.
3. **DO NEW LINEAGES RECRUIT?** `recFrac` (share ever reaching 2+ members) per mint site at 12000
   ticks. No prediction.
4. **IS THE CENSUS COMPLETE AND HONEST?** `registry + pruned === minted`, and `zombie` reports whether
   `extinct` is stale.

Protocol: #66's. 12000 ticks, 5 seeds (3, 7, 11, 17, 23 — the #66/#69 set), with the pre-#67 build run
under `INDEX=` at the same horizon rather than compared to a remembered number.

### #70 RESULT — `singleFrac` is not a diversity metric. It is one mechanism's churn rate, and the mechanism is failing.

#66 protocol: 12000 ticks, 5 seeds (3, 7, 11, 17, 23). 0 loop errors on every seed. Census complete on
every seed (`registry + pruned === minted`, 0 pruned — the cutoff is `totalTicks-30000` so nothing is
eligible at this horizon) and `zombie` 0 on every seed, so `extinct` was never stale.

**Falsifier 1 (control): PASSED.** Bit-identical to the pre-census build on all 26 reported fields,
3000 ticks, seeds 11 and 13. The instrument does not move the system.

**Falsifier 2 (my prediction): FALSIFIED, and falsified by the horizon.** I predicted the live
singleton population would be dominated by `founder`. At 3000 ticks it was — 83 of 95 singletons on
seed 11. At 12000 ticks **founders are 3 of 350 singletons, 0.9%.** The boot cohort of 329 founder
lineages is down to 13 alive across all five seeds; it does not persist, it drains. The prediction was
pilot-informed, I recorded it as such, and the pilot horizon is exactly what made it wrong. That is
#66's finding arriving inside my own falsifier: 3k does not predict 12k, in level or in sign.

### The result

| mint site | minted | ever recruited | **recFrac** | alive at 12k | mean lifespan | mean peak | peak max |
|---|---|---|---|---|---|---|---|
| `cluster` | 7841 | 0 | **0.000** | 27 | 54.4 | 0.00 | 0 |
| `founder` | 1645 | 338 | 0.205 | 13 | 2049.9 | 2.06 | 165 |
| `speciate` | 1171 | 21 | **0.018** | 362 | 2808.7 | 1.17 | 52 |
| `specDeme` | 36 | 36 | **1.000** | 36 | 5438.7 | **52.45** | 147 |

**There are two speciation mechanisms in this system and they differ by a factor of 56 in recruitment.**
`speciate` (trait-divergence in `addParticle`, LEAP 6 / #52) relabels exactly ONE offspring, so every
mint is a singleton by construction and 98.2% of them never gain a second member. `specDeme`
(cladogenesis under `__MINT_GATE:'cluster'`, #22) reassigns an entire diverged deme at once — 36 mints,
36 recruitments, **not one failure across five seeds**, mean peak membership 52.

**And `singleFrac` is, to within a few percent, the live `speciate` count over population:**

| seed | live `specDeme` | live `speciate` | N | speciate/N | **`singleFrac`** |
|---|---|---|---|---|---|
| 3 | 13 | 19 | 397 | 0.048 | **0.048** |
| 7 | 4 | 38 | 308 | 0.123 | **0.114** |
| 11 | 11 | 92 | 361 | 0.255 | **0.252** |
| 17 | 8 | 50 | 372 | 0.134 | **0.118** |
| 23 | **0** | 163 | 351 | 0.464 | **0.459** |

Seed 23 is the case that makes it plain: zero deme-mints, 427 `speciate` mints, and the highest
singleton fraction in the set. Seed 3 is its mirror — the most deme-mints, the fewest live `speciate`,
the lowest singleton fraction. **`singleFrac` was never measuring fragmentation or speciation. It was
counting the standing crop of the mechanism that fails, and it rises when the mechanism that WORKS
does not fire.**

### What that does to #69

#69 left the number OPEN between two readings and said both were stories. Both were, and **neither was
the right shape.** Not "0.198 is speciation working" — the mechanism producing those singletons recruits
1.8% of the time. Not "0.198 is the churn pathology waves 1-2 cured" — that claim was about nothing
descending, and `specDeme` lineages descend perfectly well while the population sits healthy at 348-395.
The pooling was the error. One metric, two mechanisms, opposite behaviour, and the metric tracks
whichever one is more numerous — which is the failing one, by 33x in count.

This is `occupiedKinds` again, in a new place: a snapshot statistic that cannot distinguish two
mechanisms it sums over. That has now been the error three times in this file (kinds vs monoculture,
the +/-2.0 band, singleFrac), and the pattern is the same each time — **a scalar summed across
mechanisms with different signs.**

### #69's falsifier 1, answered properly for the first time

"Does the registry grow without bound?" #69 answered by watching NON-EXTINCT entries (84 -> 108). The
census reads total entries: **1776-2571 at 12000 ticks, 0 pruned, growing at roughly 150-215 per 1000
ticks.** The driver is not speciation. It is `cluster`: 7841 of 10693 entries (73%), **every one of
which has peak membership 0** — no particle ever carries a cluster-minted id — with mean lifespan 54.4
ticks, i.e. one detection cadence. 71.7% of every lineage ever minted lives 60 ticks or less.

The registry is two different kinds of object under one namespace. #67 unified the COUNTERS; the
OBJECTS were never unified, and `MAX_LINEAGE_HISTORY=60` is sized for a registry that runs 30-40x
larger. `pruneLineages` cannot fire at all before tick 30000 by construction (`cutoff =
totalTicks-30000`), so a long run on a phone reaches ~5-6k entries before the first entry is even
eligible for collection. Measured, bounded, linear — not a runaway — but not what the falsifier was
watching, and driven by the mechanism nobody was watching.

### What stands, and what is named rather than done

**Stands:** the census (controlled, complete, non-perturbing), and the recruitment asymmetry, which is
5 seeds, 1207 speciation mints, and unanimous.

**NOT done, deliberately.** The obvious move is to act on `speciate` — 1171 mints for 21 recruitments
looks like a mechanism paying for nothing. It is not being touched in this entry, for two reasons.
First, this file's convention: an instrument entry that also changes mechanism cannot tell which of the
two produced the next number. Second, and more important, **`recFrac` is not fitness.** A mechanism that
mints 1171 lineages of which 21 take hold may be exactly what a divergence process is supposed to look
like — 21 successful foundings that would not otherwise exist — and the cost of the other 1150 has not
been measured. The pre-registered question for the next wave is whether the 1150 failures cost anything
beyond registry entries, and the arm that answers it is `speciate` ablated against intact, at 12000
ticks and 5 seeds, on kinds and on `specDeme` mint rate.

**A second thing this cannot answer.** 13 founder lineages alive at 12k, from 329 — but a founder
lineage "dies" when its id stops being carried, and `speciate` REMOVES carriers by relabelling them.
So founder extinction here mixes real death with descent-by-renaming, and the census as built cannot
separate them. The instrument for that is an ancestry walk to the founding id rather than a carrier
count, and it is named here, not built, in the same form #69 named this one.

### #70 addendum — both #69 baselines reproduce exactly, and the range-overlap hypothesis is retired

The pre-#67 build under `INDEX=`, same 5 seeds, same 12000 ticks, 0 loop errors:

| | pre-#67 (measured here) | #69's recorded value | current build (measured here) | #69's recorded value |
|---|---|---|---|---|
| mean nLin | 13.8 | 13.8 | 82.2 | 82.2 |
| mean singleFrac | 0.012 | 0.012 | 0.198 | 0.198 |
| mean kinds | 6.84 | 6.84 | 5.76 | 5.76 |
| mean lateN | 369.0 | 369.0 | 373.1 | 373.1 |

Both reproduce to the digit, which is the check that matters: the census build is the #69 build, and
every number above is being compared at one horizon rather than against a remembered one.

**The whole 13.8 -> 82.2 gap is one mechanism switching on.** Pre-#67 there is no `speciate` — #62
established 0 passes in 208 evaluations — so nLin 13.8 IS the surviving founder count and nothing else.
Post-fix the same quantity is 2.6 founders + 72.4 `speciate` + 7.2 `specDeme`. #69 called the baseline
invalid because it was measured on a build where speciation never fired; that is confirmed, and it is
stronger than #69 put it. Since `singleFrac` is the live-`speciate` fraction (above), a build with zero
`speciate` mints has singleFrac ~0 **by construction**. The comparison could not have come out any
other way, whatever the system was doing.

**Founders drain FASTER with speciation on** — 10/11/13/19/16 alive pre-#67 against 1/3/1/3/5 now. That
is the descent-by-renaming caveat showing up as a number: `speciate` removes a founder's carriers by
relabelling them, so some of that difference is founder lineages being renamed rather than dying. The
census cannot split those, which is exactly the limit named at the end of the result.

**Hypothesis retired.** I proposed that pre-#67 `nLin` might be DEFLATED by id collisions — founders
drawing from `_linNext` and speciated children from `nextLineageID`, two counters into one array. The
counters were measured rather than assumed: `_linNext` ends at 335-343, `nextLineageID` at 1362-2226,
so the ranges do overlap and the collision was possible. **It is also irrelevant.** The collision needed
traffic on the `pLin[i]=_new` route, and that route carried nothing pre-#67 because the gate never
opened. The hypothesis was #67's known aliasing restated on a path with no flow, and the simpler
already-established fact accounts for the entire gap without it. Recorded here because a hypothesis
that dies quietly gets re-proposed later.

---

## #71 — the clamp census. Built to ask which guardrails fire; found a class of particle nothing can see.

**Premise, stated because it is the user's and not mine:** true open-ended evolution needs mutations that
can break things. #70's mechanism finding supports it — every VM register index is folded
(`Math.abs(src)%12`, `%8`, `%MEM_SIZE`), the dispatch switch has **no `default:`** so an unrecognised
opcode is a silent no-op, and 801 `__cl()` call sites bound the rest. No mutation can produce a program
that breaks.

**Where I would refine it, because it changes what to build.** There are three regimes, not two:
crash-the-host (an uncaught throw halts the world — correctly prevented; Tierra and Avida don't allow
this either), lethal-to-the-individual (a bad program kills its particle — **absent from this codebase
entirely**), and silently-absorbed. This system is in the third, which is worse for evolution than
either of the others: a broken genome neither dies nor works, so selection sees nothing either way.
**It is free.** That is a mechanism for the repeated "channel measures near-inert" finding — the
substrate makes inertness cost nothing.

So: measure which guardrails actually fire before removing any. `harness-clamp.js` rewrites every
`__cl(` CALL SITE (never the definition) to a counting variant returning identical values, and reports
per site: evaluations, binds at lo, binds at hi, and NaN passthroughs — NaN fails both comparisons, so
it leaves a clamp UNCHANGED, the one way a clamp silently fails at its job. Harness-side only;
`index.html` carries nothing, for the reason `harness-gates.js` rewrites gates here rather than
shipping counters to a phone.

**Falsifier 1 (control): PASSED.** `NOCOUNT=1` is the no-rewrite arm; `fingerprint` is a checksum over
live particle state (positions, amplitudes, tendencies, lineage ids, program lengths) rather than a
summary of it. Identical across arms, seeds 11 and 13, 1500 ticks. Two scalars agreeing would not have
been a control.

### The pilot says the clamps are NOT the constraint — and this is pre-registered as possibly wrong

At 300 ticks, seed 11: **801 sites, 574 never called at all, 30 ever bound, overall bind rate 2.5%.**
The heaviest binders are render-path (`__DRAW_VM` radius/alpha saturating 64-79%, the colour channel
22%) — a saturated channel, but not one under selection in a headless harness.

**Pre-registered, in advance of the 12000-tick runs: I expect this to UNDERSTATE binding, and the
direction is principled rather than a hedge.** At 300 ticks the genome has barely evolved; clamps on
evolved physics constants cannot bind until lineages have drifted into their ceilings. #70's falsifier
died precisely this way — true at 3000 ticks, inverted by 12000 — so a pilot-shaped verdict on 801
sites is exactly the error this file has now made twice. Protocol: 12000 ticks, 5 seeds (3, 7, 11, 17,
23).

### What the CONTROL found, which is not what the census was pointed at

`fingerprint.pos` came back `null`. Not NaN — **overflow**. Positions summed to -2.2e8 at 300 ticks and
to Infinity by 1500. Measured directly, seed 11 at 1500 ticks, 310 live particles:

| | |
|---|---|
| off-world | 8 (2.6%) |
| of those, beyond 10^6 screens | **5** |
| non-finite position, still alive | **1** |
| xMax | **4.6e31** |
| yMin | **-2.0e31** |
| amplitude held off-world | 2.8% of the total |
| **off-world particles assigned to a cluster** | **8 of 8** |

**Particle position is never clamped. The FIELD INDEX derived from it is** — `const
fcx=__cl(Math.floor(px[i]/_rcW),1,FIELD_W-2)`, binding 5% of the time. So a particle at x=4.6e31 does
not throw on an out-of-bounds array read; it is silently binned into the edge cell, flood-fills with
whatever is there, and **joins a cluster**. Cluster centroids, sizes and tendencies are being computed
over members at 10^31.

This is regime 3 in its purest available form. The particle does not crash the world (`loopErrors` 0 on
every run in this session). It does not die. It interacts with nothing. It counts toward `alive`,
toward `lateN`, toward every population figure this project has ever recorded, and it holds amplitude
inside a conserved economy. **No instrument in this project could see it** — which is why it has been
here through seventy entries, and why it was found by a control checksum rather than by the census the
control was attached to.

Recorded now, before the 12000-tick runs, with the numbers that exist: one seed, 1500 ticks. Whether
escapees accumulate, hold a growing share of amplitude, or are cleaned up by senescence is exactly what
the 5-seed protocol is for, and the pilot-inversion warning above applies to this too.

### #71 RESULT — the clamp headline survives the horizon; my escapee reading does not

12000 ticks, 5 seeds (3, 7, 11, 17, 23), 0 loop errors and 0 driver errors on every seed.

**The clamp census, and the pre-registered prediction.** I predicted the 300-tick pilot would UNDERSTATE
binding once genomes had drifted into their ceilings. Partly right, and the part that mattered was wrong:

| | 300 ticks (pilot) | 12000 ticks (5 seeds) |
|---|---|---|
| sites never called | 574 of 801 | **322-365 of 801** |
| sites that ever bind | 30 | **60-70** |
| evaluations | 3.6M | **237-264M** |
| **overall bind rate** | **0.0253** | **0.0196-0.0365** |

Roughly 230 more sites get exercised and the number that ever bind doubles — the direction I predicted.
**The rate does not move.** Across a quarter of a billion clamp evaluations per run, 2-4% bind, and 40%
of clamp sites are never reached at all. **The headline survives the horizon test: the 801 clamps are
not what is closing this substrate.** That is against the hypothesis I put up before measuring, and it
takes the clamps off the list of things to remove.

**Where binding IS concentrated** (pooled, 5 seeds):

| line | evaluations | binds | rate | site |
|---|---|---|---|---|
| 15727 | 1.5M | 1.4M | **0.968** | VM case 9, position→field lookup |
| 516 | 10.5M | 9.3M | **0.892** | `R[4]=__cl(amp[i],0,1)` — render register |
| 12965 | 3.1M | 2.2M | **0.722** | `pReflexState[rBase+2]` |
| 527 | 13.7M | 9.3M | **0.680** | `__DRAW_VM` radius / alpha |
| 13254 | 21.0M | 3.9M | 0.187 | colour channel |
| 617 | **344.0M** | 0.74M | 0.002 | `_cxi=__cl(Math.floor(px[i]/_fw),0,FIELD_W-1)` |

Line 516 is worth its own note: **amplitude fed to a render register saturates 89% of the time**, so
that sensor is pinned at 1 in nine reads out of ten and carries well under a bit. A sensor that constant
is not an input. Same shape as #68's finding 6 — a channel calibrated for a range the system left long
ago — and the same shape as the "near-inert channel" pattern generally.

### RETRACTION — the escapee population does not accumulate, and I said it at 1500 ticks

Last entry recorded 8 of 310 live particles off-world at 1500 ticks on seed 11, 2.6%, and left open
whether they accumulate. **They do not.** At 12000 ticks:

| seed | alive | off-world | non-finite | beyond 10^6 screens | in clusters | amp held off-world |
|---|---|---|---|---|---|---|
| 3 | 397 | 1 | 1 | 1 | 1 | 0.25% |
| 7 | 308 | **0** | 2 | 0 | 0 | 0 |
| 11 | 361 | 3 | 1 | 2 | 3 | 0.85% |
| 17 | 372 | 7 | 3 | 6 | 7 | 1.74% |
| 23 | 351 | **0** | 0 | 0 | 0 | 0 |
| **pooled** | **1789** | **11 (0.62%)** | **7** | **9** | **11 of 11** | — |

Seed 11 is the direct comparison: **8 off-world at 1500 ticks, 3 at 12000, while the population grew
310 -> 361**, and amplitude held off-world fell 2.8% -> 0.85%. Two of five seeds finish with none at
all. The ordinary economy collects them. **"Escapees accumulate" was a 1500-tick, one-seed story and it
is withdrawn** — the third time this session a pilot horizon has produced a wrong verdict, after #70's
falsifier and the clamp pilot above, and the only one of the three I stated to the user before the
protocol had run.

**What survives, and it is still the point.** Across five 12000-tick runs: **7 particles finished alive
with non-finite positions**, 11 finished off-world with xMax 2.29e32, and **all 11 were assigned to
clusters**, so cluster centroids and tendencies were computed over members at 10^32. The mechanism is
confirmed: position is never clamped, the field index derived from it is (line 617, 344M evaluations,
743,800 binds), so leaving the world is absorbed into an edge-cell read instead of throwing.

The corrected claim is narrower and sharper than the one I withdrew. It is not that escapees pile up.
It is that **nothing kills them for being at 10^32.** They are removed, eventually, by exactly the same
starvation and senescence that removes a healthy particle — the substrate has no way to express "this
state is fatal", only "this state is expensive". That is regime 3 stated precisely, and it is a stronger
result than an accumulation count would have been, because it does not depend on how many there are.

**NaN passthrough**, measured because a clamp cannot correct what fails both its comparisons: 0, 18, 20,
38, 46 across the five seeds. Small, non-zero on four of five, and no instrument in this project would
have reported it.

### What this does to the guardrail question

The user's premise — open-endedness needs mutations that can break things — is not answered by removing
clamps. The census took that option off the table: 2-4% bind, 40% of sites never fire, and the heavy
binders are render-path. **The candidates that remain are the ones #70 named and this measured around:**
the modulo folding on every VM register index, the dispatch switch with no `default:`, and the absence
of any path by which a particle's own state can be fatal to it. The escapee is the existence proof for
the third: a state that is meaningless, unreachable by any instrument, and survivable.

Named for the next wave, not done here: a lethality path. The minimal version is not "allow crashes" —
it is a `default:` case and a finiteness test that KILL the particle rather than repairing or folding
it, so that the same event which is currently absorbed becomes an ordinary death with an ordinary
selective consequence. Pre-registering it needs a control that separates "lethality improved diversity"
from "lethality reduced the population", which the #70 census plus `lateN` can do.

---

## #72 — LEAP 34: escape is fatal. The first state in this system that can kill you. Pre-registered.

#71 established that this substrate can express "expensive" but has no way to express "fatal", and that
the clamps are not what closes it (2-4% bind rate, 40% of sites never reached). What it can't do is kill
a particle for the state it is in. The escapee is the existence proof: at 12000 ticks across 5 seeds, 11
live particles off-world, 7 alive with non-finite positions, xMax 2.29e32, **all 11 assigned to
clusters** — so cluster centroids and tendencies were computed over members at 1e32, and nothing
anywhere treated that as an error.

### The mechanism, and what was deliberately left out

A particle whose position is non-finite, or is further outside the world than the measured gap, dies
**through the ordinary death path** — `deaths.push`, `deathsThisTick`, `palive[i]=0` — so every existing
piece of bookkeeping applies unchanged. A special-case removal would have been a fourth regime.

- **The threshold is not a tuned parameter.** #71 measured a GAP: legitimate off-edge particles sit
  within one screen (the spawner launches from x=-5 and W+5); every escapee measured was at 1e17 or
  beyond; **nothing lives in between.** Any threshold inside that gap gives identical results. It is set
  at one world-dimension outside, and the result is not sensitive to it.
- **No grace exemption.** #17's founder grace protects a young lineage from STARVING in the cradle. It
  is not a licence to be at 1e32, and a lineage surviving only by holding members outside the world is
  not what the grace period was written to protect.
- **No detrital deposit, no root deposit, no worldEnergy return.** Those write to a field cell derived
  from the dead particle's position, and that position is exactly what is not trustworthy — depositing
  at the clamped edge cell would bury the body somewhere it never was. **The amplitude it held leaves
  the economy with it.** That is a real subtraction; it is recorded as one rather than papered over.
- **Default ON**, resolved after the LIVE block like `__DRAWVM`. Forced off with `ESCAPE_DEATH=0`, which
  is the control arm. It defaults on because #71 established the current behaviour is WRONG, not because
  a metric is expected to move — the #67 precedent.

### Falsifiers

1. **DOES IT FIRE?** `deathsByEscape` > 0 across 5 seeds. A pilot at 800 ticks on seed 11 gives 3 escape
   deaths, so this is close to answered already; if it came back 0 at 12000 the mechanism would be inert
   and would be reverted rather than kept as documentation.
2. **DOES IT DO THE JOB?** `offWorld` and `nonFinite` at 12000 ticks should go to ~0 in the treatment arm
   against 11 and 7 in the control. This is the direct success criterion and the only one the mechanism
   is actually claimed to satisfy.
3. **POWER — STATED IN ADVANCE SO A NULL CANNOT BE MISREAD.** The intervention touches ~0.6% of the
   population. **No diversity metric in this project has the power to detect a 0.6% intervention.** A
   flat `kinds` and a flat `lateN` are the EXPECTED outcome and must not be reported as "no effect" or,
   worse, as "harmless". The justification is correctness. This is the #67/#69 pattern: a fix for wrong
   data does not need to also improve a metric to be justified.
4. **THE INTERESTING ONE — DOES LETHALITY PRODUCE SELECTION?** This is the user's thesis under test.
   If escape is fatal, VM programs driving unbounded velocity are now selected against, and the leading
   indicator is `nearEscapes` (live particles outside the world but not yet past the kill line) plus
   `maxSpeed`. **Prediction: if lethality has a selective consequence, nearEscapes and maxSpeed fall in
   the treatment arm relative to control.** If they are flat, the kill removes garbage after the fact
   without ever changing what evolves — a real and negative finding about adding lethality, and the one
   worth knowing.
5. **CONSERVATION AND SAFETY.** 0 loop errors, 0 driver errors, `lateN` inside a +/-2 sd band.

Protocol: 12000 ticks, 5 seeds (3, 7, 11, 17, 23), treatment vs `ESCAPE_DEATH=0` control at the same
horizon — #66's rule, and the arm exists this time rather than being a remembered number.

### #72 RESULT — the escapees are gone, and lethality turned out to be a janitor, not a selective force

12000 ticks, 5 seeds, treatment vs `ESCAPE_DEATH=0` control at the same horizon. 0 loop errors and 0
driver errors in all ten runs.

**Falsifier 1 — DOES IT FIRE? Yes. 145 escape deaths** (18/39/29/31/28). `escapeNonFinite` is **0 on
every seed**: nothing was ever killed for a non-finite position, because the distance test catches it
first. A particle cannot reach infinity without passing through 1e32 on the way, so the non-finite state
is unreachable once the far state is fatal — the narrower test made the wider one dead, which is worth
knowing before anyone reads `escapeNonFinite: 0` as the check being broken.

**Falsifier 2 — DOES IT DO THE JOB? Yes.**

| | control | treatment |
|---|---|---|
| off-world at 12k | 11 | **1** |
| non-finite, alive | 7 | **0** |
| max coordinate | 2.29e32 | **1273.7** |
| off-world particles in clusters | 11 of 11 | 1 of 1 |

The single survivor is 4.8px below the bottom edge — in transit, exactly what the tolerance band exists
to spare. The treatment arm's entire coordinate range is x [9.8, 1273.7], y [10.2, 724.8]. No cluster
centroid in the treatment arm is computed over a member at 1e32.

**Falsifier 3 — the pre-registered null held.** kinds 5.00 vs 5.20 (d -0.20, sd 0.84-1.58), alive 356.8
vs 357.8 (d -1.0). Flat, as stated in advance. Per the pre-registration this is **not** reportable as
"harmless": a 0.6% intervention against instruments that cannot see 0.6% produces this result whether it
is harmless or not, and the justification stands on correctness alone.

**Falsifier 4 — NO SELECTION. This is a negative result on the premise that motivated the wave.**

My first instrument could not have answered it and I should not have chosen it. `maxSpeed` and
`meanSpeed` are taken over LIVE particles, so killing the 1e37 outliers drops them by arithmetic:
control maxSpeed reads 1.4e37 against treatment 1.65, a number that looks decisive and means nothing.
That is this file's recurring failure — a metric summed over the thing being intervened on — committed
by me, one entry after writing it up as the recurring failure.

The quantity that separates selection from deletion is the escape-death RATE. Pooled, per 1000-tick
window:

| window | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| deaths | **37** | 10 | 8 | 17 | 8 | 6 | 11 | 6 | 12 | 6 | 12 | 12 |

First half 86, second half 59, ratio 0.69 — which looks like a decline until you notice **the entire
decline is window 1.** Windows 2-12 average 9.8 and show no trend at all (windows 2-4 mean 11.7, windows
10-12 mean 10.0). That is precisely the burn-in confound pre-registered above, and it is the whole
effect. Per-seed halves are not unanimous either: 3 of 5 decline, 1 flat, 1 rises (seed 7: 18 -> 21).

**The rate is flat. Killing escapees removed them and changed nothing about what evolves.**

### What the negative result is actually worth

It does not refute the premise that open-endedness needs breakable mutations. It refines it, and the
refinement is the useful part:

**Lethality only produces selection if the lethal state is reachable by a HERITABLE strategy.** Escape
is almost certainly an accident — a transient numerical excursion — not a program. Killing an accident
is hygiene: the population is cleaner and no gene frequency moves. Killing a strategy is selection.
This wave added the first fatal state in the system and got the first kind, not the second.

Which is a real result for choosing the NEXT guardrail, and it reverses the ordering I gave: the opcode
dispatch `default:` is the better target precisely because opcode content **is** heritable — an
unrecognised opcode is in the genome, is inherited, and is currently a free no-op. A fatal or costly
`default:` acts on something selection can see. The escape kill could not, by construction.

**Named, not done: is escape heritable at all?** The claim above is an inference, not a measurement.
#70's census machinery answers it directly — record `pLin` at each escape death and compare that
distribution against the population's. If escape deaths concentrate in particular lineages, the state IS
heritable and the flat rate needs a different explanation; if they are spread in proportion to lineage
size, escape is an accident and the janitor reading is confirmed. That is the measurement that should
precede the `default:` wave, because it is the same question asked where the answer can differ.

**What stands:** LEAP 34, on correctness. Cluster centroids are no longer computed over members at
1e32, 7 particles per 5 runs no longer finish alive with non-finite positions, and the substrate can now
express "fatal" for the first time. None of that is claimed to have improved diversity, and the
measurement says it did not.

---

## #73 — is escape HERITABLE? The measurement #72 named instead of assuming. Pre-registered.

#72 killed the escapees, the death rate came back flat after burn-in, and I concluded that lethality
only produces selection when the lethal state is reachable by a heritable strategy — escape being an
accident rather than a program. **That last clause was an inference, not a measurement**, and it is the
clause the next wave's target selection rests on. This measures it.

### Instrument

Every death is tagged harness-side with its cause AND the lineage of the particle that died —
`patchExactly` on all three `deaths.push(i)` sites, asserting one match each. `index.html` carries none
of it, the #71 rule. Verified at 600 ticks: 3 escape / 306 physics / 19 age, and the escape log total
agrees with `deathsByEscape` exactly, which is the internal check that the tag is on the path it claims.

**The null needs no new per-tick accounting.** If escape is an accident it should be distributed like
any other death — both proportional to a lineage's exposure — so other-cause deaths ARE the exposure
proxy. Test: assign the E escape deaths at random to lineages weighted by each lineage's TOTAL deaths,
20000 permutations, statistic = co-lineage escape pairs (sum of C(k,2)). This assumes nothing about the
shape of the lineage-size distribution, which is the reason for a permutation test rather than a
chi-square on 2000 mostly-empty cells.

### Falsifier

**CONCENTRATED (p<0.05, and consistent in sign across seeds) → escape IS heritable**, the janitor
reading in #72 is wrong, the flat rate needs a different explanation, and the escape kill may yet have a
selective consequence that 12000 ticks was too short to show. **NOT CONCENTRATED → the janitor reading
stands**, and with it the claim that the opcode `default:` is the better next target because opcode
content is inherited and escape is not.

### The confound, stated in advance, with its direction

**The treatment arm selects against the trait it is measuring.** An escaping particle is removed, so a
strongly heritable escape tendency would be pruned as fast as it appeared and would show up here as
LESS concentration than it truly has. So the test is conservative: **a positive result is trustworthy, a
null is ambiguous.** The direction matters for how the answer may be read — a null cannot be reported as
"escape is definitely not heritable", only as "no concentration detectable under a test that erases what
it looks for".

The stronger design, if this returns null: tag escape-threshold crossings in the `ESCAPE_DEATH=0` arm
where the particle is NOT removed, so heritability is not being erased while it is measured. It needs a
first-crossing-only marker per particle that survives index recycling, which is why it is not in this
pass. Named here rather than left to be reinvented.

Protocol: 12000 ticks, 5 seeds (3, 7, 11, 17, 23), treatment arm.

### #73 RESULT — no concentration. The janitor reading stands, with the caveat it was pre-registered with.

12000 ticks, 5 seeds, treatment arm, 20000 permutations per seed.

| seed | escape deaths | lineages hit | max in one lineage | observed pairs | null mean | p |
|---|---|---|---|---|---|---|
| 3 | 18 | 17 | 2 | 1 | 3.00 | 0.870 |
| 7 | 39 | 24 | **8** | **40** | 19.50 | **0.033** |
| 11 | 29 | 23 | 4 | 9 | 6.29 | 0.231 |
| 17 | 31 | 27 | 3 | 5 | 6.51 | 0.597 |
| 23 | 28 | 21 | 6 | 17 | 11.45 | 0.195 |

**Fisher combined X2 = 14.33 on 10 df against a 18.31 critical value. Does not clear.** The
pre-registered falsifier required p<0.05 AND consistent sign; the sign is not consistent — three seeds
sit above their null, **two sit below it**. One seed at p=0.033 out of five is what multiple testing
produces on its own: P(at least one hit at alpha=0.05 across 5 seeds) = **22.6%**.

**And seed 7 does not survive being looked at.** Its concentration is carried by two LARGE lineages
whose escape share is barely elevated:

| lineage | escape deaths | total deaths in that lineage | escape share |
|---|---|---|---|
| 244 | 8 | 163 | 5% |
| 1514 | 4 | 93 | 4% |
| 25 | **3** | **5** | **60%** |
| population baseline | 39 | 1591 | **2.45%** |

Lineages 244 and 1514 run at 2x baseline, which is not a strategy, and they dominate the statistic for a
reason that is my instrument's fault: **co-lineage pairs is QUADRATIC in per-lineage count, so it is
driven by whichever lineage is largest**, and large lineages have more of everything. The permutation
weighting controls for that in expectation but the statistic still has high variance from big lineages
and low power against diffuse heritability. A per-lineage RATE statistic would have been the better
choice. Lineage 25 — 3 of its 5 deaths by escape — is the only row here that looks like a trait, and it
is five deaths.

**Verdict: no detectable concentration. The janitor reading from #72 stands.** Per the pre-registration
this is reported as ambiguous and not as proof: the treatment arm removes escapers, so it erases the
signal it is testing for, and the honest statement is "no concentration detectable under a test that
prunes what it looks for" — not "escape is not heritable".

### Where this leaves the guardrail question

Three waves have now converged on one statement. #71: the substrate can express "expensive" but not
"fatal". #72: adding a fatal state removed the garbage and changed nothing that evolves. #73: the state
it made fatal is not detectably heritable, so there was nothing there for selection to act ON.

**The premise survives; the target was wrong.** Lethality does not produce selection by being lethal. It
produces selection when the lethal state is reachable by something inherited — and escape, as far as
this can measure, is a numerical accident that any lineage can have.

**Which settles the next target without needing another measurement to justify it.** The opcode dispatch
`default:` case is reachable by inheritance BY CONSTRUCTION: an unrecognised opcode sits in `pProg`, is
copied to offspring by `cloneGenome`, is spread by crossover and by the RECOMBINE opcode, and is
currently a free no-op that costs its carrier nothing. That is the opposite of escape on the one axis
these three waves have shown to matter. It does not need a heritability assay first, because opcode
content being heritable is not an empirical question about this system.

**Open, and named rather than assumed:** whether a `default:` that costs or kills is survivable at all.
Mutation produces unrecognised opcodes at some rate this project has never measured, and if that rate is
high, a fatal `default:` is a population-extinction event rather than a selection pressure. **The
measurement that must precede that wave is the unrecognised-opcode rate per program per tick** — cheap,
harness-side, and it decides between the fatal and the metabolic-cost version of the change before
either is written.

---

## #74 — the unrecognised-opcode rate. The answer inverts the premise: selection has ALREADY purged them where it can reach.

12000 ticks, 5 seeds, 0 loop errors. **Control passed:** fingerprints identical to #73's runs on all
five seeds, so the six `default:` clauses do not perturb — they count and break where an unmatched
opcode previously fell out doing nothing.

### The survivability number the wave was for

| | pooled, 5 seeds |
|---|---|
| live programs carrying an unresolvable opcode | **49 of 1784 = 2.75%** |
| instructions in live programs that resolve to nothing | 49 of 24264 = **0.20%** |
| per-seed program share | 1.4% - 4.3% |

A fatal `default:` **in the particle VM is survivable**: a 2.75% cull on first execution, then acting at
the mutation rate. Not an extinction event. That was the question and it is answered.

### But the per-VM breakdown says the particle VM is the wrong target

| VM | executions | misses | **miss rate** | core opcodes implemented |
|---|---|---|---|---|
| **particle** | 185,327,274 | 263,305 | **0.14%** | **236 / 236** |
| plasmid | 48,469,997 | 23,253,657 | **47.98%** | 229 / 236 |
| cluster | 110,112,192 | 16,212,526 | **14.72%** | 229 / 236 |
| shadow2 | 53,095,185 | 4,793,353 | 9.03% | 133 / 236 |
| shadow | 16,173 | 2,889 | 17.86% | 220 / 236 |
| sensor | 1,542 | 0 | 0% | 5 / 236 |

**The plasmid VM's 48% is not a coverage gap** — it implements 229 of 236 core opcodes. The misses are
opcodes in the BOUND range [236, 332), the 96 authored-atom slots, most of which are empty.
`missBound` dominates `missCore` everywhere (seed 3: 40.4M against 8.6M).

**And that gives the baseline that makes the particle VM's number mean something.** Mutation draws
uniformly from [0, OPCODE_COUNT) = [0, 332), and 96 of those 332 are bound slots — so **28.9% of every
fresh opcode draw lands in the bound range by construction.** The plasmid VM sits at 48%, above that
baseline. The particle VM sits at **0.14%, two hundred times BELOW it.**

### What that inverts

#71 concluded that this substrate makes inertness free, and I have been reasoning from that for three
waves. **It is not uniformly true, and the exception is the biggest thing in this measurement.** In the
particle VM — where programs are inherited through `cloneGenome`, where every instruction pays the
per-instruction toll, and where selection can therefore see them — unresolvable opcodes have been driven
from a 28.9% random baseline to 0.14%. **Selection has already purged them, with no lethality anywhere
in the loop, using nothing but the existing metabolic cost.**

The 39 million no-op executions per run are real, and they live specifically where that force is absent:
plasmids, whose contents are re-randomized (`if(Math.random()<0.5)pPlasmid[base]=Math.floor(Math.random()
*OPCODE_COUNT)`) rather than inherited-and-taxed, and the cluster VM.

So the answer to "does this system need mutations that can break things" gets a sharper form than either
the premise or my three waves of argument had: **where a cost already reaches, it works — a 200-fold
purge without a single fatal state. Where nothing reaches, half the work is noise.** The problem was
never that failure isn't fatal. It is that whole subsystems are outside the accounting.

### The interpretation that has to be settled before anything is changed

An opcode pointing at an EMPTY bound slot is not obviously waste. The 96 slots exist so authored atoms
can fill them, and an instruction addressing a slot that is empty now and filled later is a **pseudogene
— neutral today, functional after a binding event.** Charging it, or killing for it, would delete
exactly the pre-adaptation the bound-slot design exists to permit. On the other hand, if the slots stay
empty for whole runs, "pre-adaptation" is a story about a thing that never happens and 29% of the
mutation operator's range is dead by construction.

**Those are opposite readings of one number and this data cannot separate them.** The measurement that
can: **how many of the 96 bound slots are filled, and when.** If bindings accumulate and previously-dead
opcodes come alive, the pseudogene reading holds and the `default:` must stay free. If the count sits
near zero for 12000 ticks, the bound range is dead weight in the mutation operator and the right fix is
not a `default:` at all — it is that the operator samples a namespace two-thirds of which no VM can
reach.

Named, not assumed, in the form this file has used since #69. Nothing is being changed on the strength
of an unmeasured story about pseudogenes.
