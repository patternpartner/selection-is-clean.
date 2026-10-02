# PHASE A — autocatalysis (diagnosis and making novelty common)

Branch `cos/autocatalysis`, from `cos/skin` (9b9e799). **Trial seeds 90–97 only. Nothing here is a deciding run, there is no
pre-registration, and no deciding seed has been run.** Every number below is a one-run-per-arm trial on trial seeds.
Raw trial readouts: `lab/autocat/trial/`.

## 1. Diagnosis: why founding almost never succeeds
Instrument: `lab/autocat/diag.js` (a read-only replica of `World.build`'s checks run just before every executed BUILD; consumes
no RNG, changes nothing). Worlds: niche-v3 W1 (costly, public) and skin S2 (leaky evolving skin), seeds 96 and 97, 150k ticks
each (600k ticks total). Raw: `lab/autocat/trial/diag150-*.json` (and 30k-tick runs on seed 95: `diag-*.json`).

- 92.1M BUILD executions. **84.4% (77.7M) are by non-builders** (builder bit 0: BUILD does nothing for them).
- 9,161,885 **founding attempts** (a builder, empty cell / no stock, no recipe). Outcome:
  | cause | attempts | share |
  |---|---|---|
  | both named species absent from the cell | 7,710,312 | 84.16% |
  | one named species absent | 1,161,547 | 12.68% |
  | too little of a present species | 0 | 0 |
  | builder's store below the build cost (energy) | 284,698 | 3.11% |
  | binding not energy-releasing (recipe validity) | 5,278 | 0.06% |
  | compound memory cap | 0 | 0 |
  | **founded** | **50** | **0.0005% (1 in 183,000)** |
- Founding rate: **0.83 per 10,000 ticks** (0.2–1.8 across the four runs). Placement is not a cause (a found is in the
  builder's own cell / own stock); GC is not a cause (it frees only unreferenced compounds); the cap was never hit.
- Extension is blocked the same way: of 5.2M extend attempts, 91.3% lack enough of the named species, 8.4% non-exergonic,
  0.3% energy; 426 succeeded.
- Why: an average cell holds about 4–9 of the 256 species at >= 0.002, and BUILD names its two species with raw argument
  bytes. A random pair is present with probability about (7/256)^2, roughly 1e-3, and evolution gets no signal from a failed
  attempt (failures are free; only success costs). **Novelty is starved by substrate specificity, not by cost, sharing or
  protection.**

## 2. Mechanism: catalysed assembly (`NICHE_AC`, off by default)
In `lab/oee-core.js`. With every new knob unset, output is byte-identical to origin/main (default, CHEM, CHEM+VIRUS, TASKS,
CHEM_BIG; seed 97, 4k ticks) and to cos/skin 9b9e799 (NICHE 2, v3 W1, skin S1, skin S2; seed 96, 40k ticks), wallS stripped
(`lab/autocat/bytecheck.sh`; checked on the first version, re-checked at the end, see log).

- **Catalysis condition (acCat):** a founding BUILD whose named species are absent is *catalysed* if a compound structure is
  within reach. That is the same reach as CATAL: the own cell, then NICHE_R; under SKIN, a neighbour's stock only through
  permeability, with probability p(user) x p(owner). Every structure therefore makes the next build likelier, which is the
  autocatalytic feedback. `NICHE_AC_B` is a small spontaneous (uncatalysed) rate so a world with no structures can nucleate.
  It has its own RNG stream, so the main and permeability streams are untouched.
- **NICHE_AC 1 (rebinding):** the catalysed build binds present species instead (the genome's byte picks which, by index
  mod the number present).
- **NICHE_AC 2 (named synthesis, current design):** the catalysed build makes the compound the genome **names** (its two
  operand species), using whatever feedstock species are present. Energy is conserved: the feedstock's energy minus the
  compound's goes to the builder; if negative, it is paid from the store. So what is built stays exact and heritable, and an
  argument mutation builds a *different* compound. No compound list: the binding rule, energies, costs and compound identity
  are unchanged.
- `NICHE_AC_X 1`: extension catalysed too (rebinding). `NICHE_RAND_NAMED 1`: under AC 2, the random-placement null's founds
  name a uniformly random pair from present feedstock (the null matched to named synthesis). The old present-pair null is
  kept as RAND.
- **Offspring settle near parents: already true, so no knob was added.** DIVIDE places the child in an adjacent empty cell
  (dispersal radius 1, the minimum). What mixes kin is MOVE.

## 3. Arms used in feasibility (`lab/autocat/feas.sh`, `arms.sh`)
- FULL = skin S2 (v3 W1 costs, skin, regrow, evolving permeability; shared via leak, copyable) + AC.
- NOAC = FULL minus AC (that is, S2).
- RAND = FULL with organisms unable to build; FULL's per-1k [found, extend, recipe-build, maintain] counts are applied to
  random living organisms (present pairs).
- RANDN = RAND with named random pairs.
- SHUF = FULL with the builder bit drawn at FULL's per-sample share (not inherited).
- W1 = niche-v3 W1 baseline.

## 4. Tuning log (trial seeds only, every change)
1. **AC 1, no basal rate** (seeds 90, 91; 60k): founding started on seed 90 only. Seed 91 never nucleated (0 founds), so
   AC_B was added. With AC_X, extension became near-certain: 197k compounds in 38k ticks in the public world, and under skin
   the stocks died out (XCOST paid on every extension drained builders). **AC_X is left off.**
2. **v1 = AC 1 + AC_B 0.001** (seeds 90–92, 150k): `trial/feas-v1.txt`. Founding was 47/16/32 per 10k, against
   NOAC 1.2/0.9/0.8 and W1 0.7/0.1/0.4. FULL beat RAND on 0 of 3 seeds and SHUF on 1 of 3. Rebinding makes lineages found
   the same few present pairs, so random placement was more diverse.
3. **v2 = AC 2 (named synthesis) + AC_B 0.001** (same seeds and horizon; NOAC and W1 reused, being identical configs):
   `trial/feas-v2.txt`. Founding was 46/15/29 per 10k (38x/17x/37x NOAC; 65x/150x/73x W1). FULL beat NOAC and W1 on 3 of 3,
   RAND on 2 of 3, RANDN on 1 of 3 and SHUF on 2 of 3. Trend was >= 0 on 1 of 3. Structure income was only 0–4.5%, so
   structures barely pay and selection on authorship is weak.
   Side test, AC_B 0.01: *fewer* founds (33/6/37 per 10k) and lower Lu. The basal rate is not the lever.
4. **v3 = v2 + NICHE_OPEN_D 1** (founded compounds can open energy channels, so new compounds can pay): running; results are
   appended below by the waiter.
