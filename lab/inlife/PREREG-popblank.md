# Population-wide blank: do programs matter to births and survival when EVERY program is empty? (written before any deciding run)

13 Oct 2026. Engine: engine.html at main 8795752, defaults. The user is away; the design and the decisions in it are mine.
Follows PREREG-permblank.md (sha256 90a3013201ad1f37): an individual founder's own program did not matter (neighbours drive interactions).

## Prediction written before running
From reading the code (the main birth channel requires `vmActions[4]*influence>0.0002`, a program output): with every program empty, successful parented
births should fall by more than half. If births do NOT fall, the engine has a program-independent birth route that I missed.

## Design
Per seed, same seed means identical trajectory up to tick 1500 (no randomness is drawn by the intervention).
- BLANK: at tick 1500 every alive particle's program is set to [] (pProg and pGGENOME.vmProgram); re-emptied every 20 ticks for ALL alive particles (newborns included).
- NUDGE k (k = 1,2,3,4): at tick 1500 consume k values from the random stream and change nothing else. These are the null band (chaotic divergence only).
Run all to tick 4000. Wrappers on addParticle / addCompound count SUCCESSFUL parented births after tick 1500 (no random draws).
Measures at tick 4000: (1) parented births in (1500, 4000]; (2) alive count. Manipulation check: mean program length of the alive at tick 2000 and 4000.

## Seeds
Deciding: 41, 42, 43, 44, 45, 46, 47, 48 (never run). A seed COUNTS if all five runs finish with no engine error. Fewer than 5 counted seeds = INCONCLUSIVE.

## Statistic and rule
For each measure, per counted seed: L = ln( (BLANK + 1) / (mean(NUDGE 1..4) + 1) ). Pooled mean of L over seeds with a paired-t 95% CI (df = seeds - 1).
Placebo (machinery check): the same statistic for NUDGE 1 against mean(NUDGE 2..4), same CI; it should include 0.
- MATTERS (for that measure): CI excludes 0 and |mean L| >= ln(1.25).
- DOES NOT MATTER: CI lies inside [ln 0.8, ln 1.25].
- otherwise INCONCLUSIVE.
Births is the primary measure; alive count is reported with its own verdict, and a population collapse (alive < 5) in any BLANK run is reported as such.

## What this cannot say
It says whether programs, as a whole, drive reproduction and survival over 2,500 ticks from tick 1500 at default settings. It does not say which programs, or
whether their content is adaptive. Four nulls per seed give a coarse noise estimate; eight seeds. A blank population keeps all non-VM mechanisms running.
