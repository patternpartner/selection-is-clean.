# Does moving whole organisms between worlds make adaptive novelty keep arriving? (the multi-tab idea, in the lean core)
Written and COMMITTED before the first deciding run. 15 Oct 2026. Delegated authority; the idea is the user's (broadcast channel and multiple tabs), the rule is mine.

## What is built (and tested, not yet run for evidence)
- `lab/oee-core.js`: `emigrate(u)` and `immigrate(rec,u)`, draw-free, never called unless a runner calls them. Tested: a world that does not migrate is byte-identical to before; a world that removes and reinserts 20 organisms ends with exactly its original energy (store plus corpse), 20 organisms and keeps running.
- `lab/migration.js`: a ring of 4 worlds, one worker thread each, exchanging emigrants every 50 ticks. MODE none (no exchange; checked byte-identical to a plain world), ring (an emigrant goes to a random neighbour), sham (an emigrant is removed and put back into its own world one round later: the same disturbance, nothing exchanged). MIG = fraction of a world's living that emigrates per 1,000 ticks.
- `lab/migration-score.js`: the metasystem's adaptive novelty (below).
- Smoke test (40,000 ticks, MIG 0.1, seeds 2301-2304, one ring each, NOT evidence): 25,329 sent, 25,298 landed, 0 lost; EVER 71 (ring) against 43 (none). That difference is exactly what the SHAM arm exists to explain (see "The artefact").

## The question
Does exchange of whole organisms between worlds raise how many new adaptive genotypes the SET of worlds finds, beyond what the disturbance of moving them does? Island-model theory (and #45/#294) says a little exchange helps and a lot homogenises, so the prediction is an interior optimum.

## Measure (primary), per ring
EVER = the number of distinct functional genotypes (the core's fnHash, the same number in every world) that are adaptive in at least one of the ring's worlds, where adaptive is core-geno's rule: in a window of WIN=30 samples (30,000 ticks), the genotype's mean share beats every neutral label's. A genotype adaptive in two worlds counts once. LATE (secondary) = those whose first adaptive window is one of the last 3 of the run.
Also reported, not ruling: the mean Jaccard overlap of the worlds' adaptive sets in the last window (homogenisation), the mean number of distinct functional genotypes alive (fnGenoN), alive per world.

## The artefact, said before the data
Under migration the neutral population gets one NEW label per immigrant (an immigrant is a new genotype from the destination's side), which fragments the neutral labels and LOWERS the bar every real genotype must beat. The smoke test shows it (71 against 43). So EVER can rise from labelling and disturbance with no exchange of anything. Therefore the claim is judged only against SHAM at the same rate (same removal, same reinsertion, same new labels). NOMIG against SHAM is reported as the size of the artefact.

## Arms and design
- Worlds: plain core defaults (`{}`), 64x64 torus, as #294. Ring-set k (k = 0..9) uses seeds 2400+4k .. 2403+4k, the same in every arm, never run before. 300,000 ticks each (about 2,000 generations at about 6.7 per 1,000 ticks). **Horizon, out loud: 300,000 ticks, about 2,000 generations; a verdict is about that, never "never".**
- NOMIG (MODE none). For each rate r in {0.001, 0.01, 0.1} (about 0.2, 2 and 24 migrants per world per generation at N = 1,600; Wright's Nm = 1 sits between the first two): SHAM_r and RING_r. 7 arms x 10 ring-sets = 70 rings. No separate null-replicate arm: the spread across the 10 ring-sets of one arm is the noise (it includes world-to-world variance, so it is conservative).

## Counting (template step 1)
A ring counts if all four worlds ran to 300,000 ticks with no error, ended with N over 50, and (migrating arms) sent > 0 and landed >= 90% of sent. An arm with fewer than 8 counted rings is INCONCLUSIVE and says so. Fewer than 3 arms comparable = INCONCLUSIVE overall.

## Ruling (same measure, same threshold, both directions)
Per rate r, RING_r against SHAM_r on EVER: BETTER if mean(RING_r)/mean(SHAM_r) >= 1.25 and a two-sided permutation test of ring means (20,000 shuffles) gives p < 0.05; WORSE if <= 0.8 and p < 0.05; otherwise NOT DIFFERENT. LATE is judged by the same rule and reported beside it.
- **HUMP (the interior-optimum prediction):** RING_0.01 BETTER than SHAM_0.01 AND mean(RING_0.01) >= 1.25 x mean(RING_0.1) with p < 0.05.
- **MONOTONE:** RING_0.1 BETTER than SHAM_0.1 and no interior optimum.
- **NONE:** NOT DIFFERENT (or WORSE) at all three rates.
- NOMIG against SHAM_r is reported as the artefact. If SHAM_r differs from NOMIG by 25% with p < 0.05, that is stated; it does not change the primary contrast.
- The same ring-set is not a pair across arms (trajectories diverge); the paired differences are reported only as description.

## Prediction written before running
RING_0.001 NOT DIFFERENT from SHAM_0.001; RING_0.01 BETTER; RING_0.1 NOT DIFFERENT or WORSE (homogenisation, Jaccard up). I put about 25% on HUMP, 40% on any BETTER, and about 40% on NONE, because the in-repo evidence (#45, #45b, #294b) is thin and mostly null.

## What the outcomes would mean
- BETTER at an interior rate: the multi-tab / broadcast idea earns a place at this scale. Next, and only then, the asymmetric-age follow-up (one old world among young) and, for the engine's tabs, a user decision.
- NONE on at least 8 counted rings per arm: organism exchange adds no adaptive novelty at 2,000 generations in this core. Recorded as bounded, not as never; the design for next is the parasite bench (`lab/next-core/DESIGN.md`) and the art.

## Step 6
Lab only. Nothing here changes `engine.html`, saved universes or any default.

## What this cannot say
One core and one world size, a ring of 4, one horizon, plain core (no CHEM, no TASKS, no mind), migrants chosen at random not by fitness, a transit delay of one 50-tick round, symmetric ages (the user's asymmetric-age idea is the follow-up). It says nothing about real browser tabs, which differ in speed, size and attention.
