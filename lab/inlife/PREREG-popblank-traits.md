# Population-wide blank: do programs matter to trait spread or lineage structure? (written before any deciding run; user delegated authority, decision mine)

13 Oct 2026. Engine: engine.html at main 8795752 (unchanged since), defaults (the LIVE stack). Follows PREREG-popblank.md and PREREG-popblank-late.md: blanking every program
changed neither births nor the alive count. This asks whether it changes WHAT the population looks like.

## Prediction written before running
Programs act on phase, amplitude, force and tendency (the VM writes tend: "tbleed", op-driven transfers) and the speciation gate sits in the VM reproduction path. I expect:
(a) trait dispersion differs under BLANK (I lean towards LOWER, since the VM's tendency bleed is also a mixing force, but I do not know the sign);
(b) lineages minted after tick 1500 fall, because the minting path I read (_specSpawnSim in the vmActions[4] branch) is a program route.
If neither changes, programs matter to neither who is born nor what they look like in this window.

## Design (identical to PREREG-popblank.md except the measures)
Per seed: BLANK (every alive program set to [], re-emptied every 20 ticks, newborns included) and NUDGE k = 1..4 (consume k random values) at tick 1500; all run to tick 4000.
Measures at tick 4000, read from raw arrays, no draws:
1. TRAIT DISPERSION: sum over the current DIMS of the variance of tend across alive particles.
2. LINEAGES ALIVE: number of distinct pLin values among alive particles.
3. LINEAGES MINTED: _linNext at tick 4000 minus _linNext at tick 1500.
Seeds: 61, 62, 63, 64, 65, 66, 67, 68 (never run). A seed counts if all five runs finish with no engine error. Fewer than 5 counted seeds = INCONCLUSIVE.

## Statistic and rule
Per counted seed: L = ln((BLANK + e) / (mean NUDGE 1..4 + e)) with e = 1e-9 for dispersion and e = 1 for the two counts. Pooled mean of L with a paired-t CI at the Bonferroni level
for three measures (97.5% two-sided each, i.e. 1 - 0.05/... computed as the 1 - 0.05/6 quantile). Placebo: NUDGE 1 against mean NUDGE 2..4, same CI.
- MATTERS (for that measure): CI excludes 0 and |mean L| >= ln 1.25.
- DOES NOT MATTER: CI lies inside [ln 0.8, ln 1.25].
- otherwise INCONCLUSIVE.
Dispersion is the primary measure (the one nearest "novelty"); the other two are reported with their own verdicts, and a MATTERS on either is reported as a finding.

## What this cannot say
Three summary numbers at one tick, one window (tick 1500-4000), default settings, 8 seeds, a coarse four-null noise estimate. A program could matter to something not measured here.
