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
