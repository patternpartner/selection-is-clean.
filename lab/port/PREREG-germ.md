# PREREG #394: the germline copies the creature richest in the store (`GERM_STORE=1`)

Written before any decision run. Design (seen seeds 10401-10403) is in `lab/port/out-germ-design/`.

## What is being tested
Every `cadenceLineage` ticks (600) the germline adopts the program (`selfLearnFromBest`) and steps toward the physics
(`decideFromRealWinner`) of the living creature with the most amplitude. Under one currency (`STORE_DEATH`, the shipped TASKS
world) amplitude does not kill and sits near its floor; #393 found the same vestige in the migrant gate. The germline is what a
loaded harvest, a founded universe and a reload without a population snapshot start from.

`GERM_STORE=1`: under `STORE_DEATH` both picks take the creature with the largest store. Off, or without `STORE_DEATH`, the
engine is byte-identical to the one before (checked: TASKS world seed 10401 to 1,500 ticks with its saved genome, TASKS-off seed 3).

## Design reading (seen, not a decision)
From one world state at tick 3,000, a harvest carrying the amplitude-best's program against one carrying the store-best's, each
booted for 2,000 ticks: new functions 9,966 / 21,814, 11,963 / 13,923, 7,631 / 11,101 (store ahead 3 of 3). On 2 of 3 seeds the
amplitude-best had never been paid.

## Primary: what a harvest carries
- Seeds 12101-12112, unseen. One shipped-default world per seed (`TASKS=1`), to tick 3,000 on 12101-12106 and tick 6,000 on
  12107-12112.
- At that tick `lab/port/probe-germ.js` runs the engine's own two picks both ways from the same state and writes two genomes.
- Each genome is booted as a harvest is (`probe-reload.js LOAD=`, same seed, `GERM_STORE` unset) for 2,000 ticks. V = functions
  paid since boot.
- **Executed first:** a seed counts only if the two picks are different creatures and the two genomes differ.
- **Floor:** at least 9 counted seeds, else INCONCLUSIVE and the default does not move.
- **Rule:** exact one-sided Wilcoxon signed-rank on log(V_store / V_amp). BETTER if p(greater) <= 0.05. WORSE if p(less) <= 0.05.

## Guard: the running world
The germline is also read inside a running world (motifs, the shadow), so the pick can move it.
- Seeds 12113-12120, unseen, 8 pairs, `GERM_STORE=0` against `1`, 6,000 ticks, reseeded after tick 1 as #392 did, CPU by bash's time.
- Measure: new functions per CPU-hour. WORSE if the one-sided Wilcoxon p(store less) <= 0.05, or collapses (the #392 definition)
  are more by 3 or more.

## Verdict
- Primary BETTER and guard not WORSE: **ship** (`GERM_STORE` default 1 wherever `STORE_DEATH` is on; `GERM_STORE=0` restores).
- Primary not BETTER: the default does not move and the knob is removed. Primary WORSE: the same, and it is written up.
- Guard WORSE: no ship, whatever the primary says.
- Claimed only at the rung measured: what a harvest finds in its first 2,000 ticks. Not field novelty.

## Saved worlds (rule 6)
A reload is unchanged at boot. From its next adoption on, a one-currency universe's germline follows the store-richest creature.

## Named, not part of this rule
`selfLearnFromBest` carries the old germline's instructions with opcode >= `CORE_OPCODES` into the adopted program at random
positions (`__ATOM_DURABLE`, for authored atoms). The five task ops sit above that line, so a winner lacking one gets the old
germline's spliced in. Both arms go through it. The probe reports how often the adopted program is the picked creature's own.

## Prediction
BETTER: store ahead on about 9 of 12, median ratio about 1.4. Guard: no difference.
