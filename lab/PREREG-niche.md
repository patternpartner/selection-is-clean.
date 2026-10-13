# PRE-REGISTRATION: niche construction that can EXPAND what is possible (NICHE)

Written and committed before any run on the deciding seeds (7, 8, 9). No deciding result exists when this file is committed.
Branch `cos/niche-construction`, from `origin/main` @ `8efaf9d`.

## The question
Every lean-core world so far finds a burst of new behaviour and then plateaus (#285b, #286b, #287d, #288; summary in #289).
Hypothesis: the menu is fixed. There is a finite reaction network and a fixed set of moves. Life partly escapes this by NICHE
CONSTRUCTION: lasting structures that organisms build, that outlive their builder, and that open new possibilities to whoever
comes later. Test: do organism-built structures that ADD new reactions keep novelty arriving, beyond (a) structures that only
modulate existing reactions and (b) the same kind of structures dropped at random?

## The mechanism (`lab/oee-core.js`, knob `NICHE`, needs `CHEM=1`, off by default)
- **BUILD** (neutral marker 29 under NICHE).
  - **Founding.** In a cell with no structure, BUILD founds one from two molecules in the cell: species `arg` and the next
    instruction's `arg`, NICHE_F = 0.5 of the scarcer. A hash of the pair draws a binding energy delta, up to CHEM_DMAX.
    About 40% of pairs release energy. The builder keeps delta; the structure holds the rest, so energy is conserved.
  - **Extension.** In a cell with a structure, BUILD extends it with species `arg`, with its own hash-drawn delta.
- **Durable.** A structure stays in its cell (it does not diffuse). It decays at NICHE_DECAY = 0.00005 per tick, about 10x
  slower than molecules (half-life about 14,000 ticks, where an organism lives at most 400). Any later occupant of the cell can
  use it.
- **Modulation.** In every NICHE arm, a structure speeds METAB in its cell by up to 1 + NICHE_CAT (0.5).
- **NICHE=1 (N1, non-expanding).** Every structure is the same inert STRUCT, with no reaction of its own. The reaction set is
  fixed: the 1,024 base METAB reactions, founding pairs of base species, and 256 STRUCT extensions.
- **NICHE=2 (N2, expanding).** Every structure is a COMPOUND, named by its operands: (species, species) or (species, compound).
  A compound is registered the first time it is built. There is no list of compounds and no limit on how many exist.
  - Each compound is a CATALYST for one reaction of its own: it turns its last-attached species `a` into a species `t`. `t` is
    drawn by a hash of the compound from ALL species a small step downhill of `a`, not only `a`'s four base products.
  - **CATAL** (neutral marker 30 under NICHE) runs the cell's compound reaction on EAT_F of the cell's `a`. The organism keeps
    the energy difference, as with METAB.
  - Each new compound also opens 256 extension reactions of its own. So what can be done grows with what has been built, and
    nothing about future reactions is written in advance: every energy and product comes from a hash of the compound's name.
  - **Honest limit:** catalysed transformations are between the 256 base species, so at most about 65,000 exist (64x the base
    network's 1,024). Compounds and extension reactions have no ceiling.
- **NICHE=3 (N3, availability null).** N2's chemistry, but organisms cannot FOUND. BUILD only extends, and CATAL works as in N2.
  New structures are founded at RANDOM cells, from random pairs of molecules present there. The founding count per 1,000
  ticks is taken from the same seed's N2 run (`niche.found`), so structures are about as plentiful as in N2. Nobody gets the
  binding energy; it dissipates.
- **Checked before this commit:** with NICHE unset, default, CHEM, CHEM+VIRUS and TASKS output is identical to `8efaf9d` in
  every field except wall-clock time. CHEM_BIG was also checked identical, before the CATAL addition, on a code path the
  addition does not touch. Trial runs on seeds 95-97 (not deciding seeds) were used to debug the design. The trial-tuned change:
  the first design had no catalysed reactions, and structure income stayed at 0.0% of income.

## Arms, seeds, horizon
| arm | OPTS |
|---|---|
| N0 off | `{"CHEM":1}` |
| N1 non-expanding | `{"CHEM":1,"NICHE":1}` |
| N2 expanding | `{"CHEM":1,"NICHE":2}` |
| N3 random founding | `{"CHEM":1,"NICHE":3,"NICHE_EVERY":1000,"NICHE_FOUND_SCHED":[...N2's per-sample founds]}` |

- **Seeds 7, 8, 9.** Never used in `lab/`.
- **Horizon: 1,200,000 ticks** (#287 and #288's horizon), sampled every 1,000 ticks: 40 windows of 30,000 ticks.
- **Runs:** one per arm per seed, 12 in all, via `lab/niche/run.sh`. Each N3 starts when its seed's N2 finishes.
- **Estimated time:** about 1.5-2 hours on 8 cores (trials: 60,000 ticks in about 110 s, three in parallel). This fits the
  3-hour budget, and the horizon will not be changed.

## Metric (`lab/niche/analyse.js`)
- A reaction is ACTIVE in a window when its mean share of income is at least 1% (#287's rule). Income = METAB + building +
  catalysis.
- Reactions are keyed so the arms are comparable: METAB (species, j); founding (a, b); extension (structure, a); catalysed
  (a -> t).
- NEW = active for the first time in that run.
- **Primary:** L = mean NEW active reactions per window over the late half (windows 21-40). This is the slope of the
  cumulative count of distinct active reactions over the last half.
- **Reported, not ruling:**
  - the OLS trend of new-per-window over the late half (negative means slowing);
  - Q2 against Q4 growth, as in #288;
  - reactions ever active;
  - late new reactions split by kind;
  - **use:** the share of late income that comes from structures; BUILD and CATAL carrier shares; how many compounds carry at
    least 1% of income (and their depth); structured cells; population.

## Verdict rule
- **Open-ended-ish** only if, on ALL 3 seeds: L(N2) > 0 AND L(N2) > L(N1) AND L(N2) > L(N3), strictly. Otherwise NOT SHOWN.
- **Use:** if N2 passes but structures carry under 1% of late income, the novelty is called JUNK, not used.
- One run per arm per seed. The 3-of-3 strict rule is the only protection against noise; this is said now. Nothing here is
  revised after the data.
