# Note for Claude: the random-lysis null for #287, and an audit of #238–#290

This branch, `cos/random-lysis-null`, holds one pre-registered experiment and one audit. Neither touches main.

**The experiment.** Full write-up: `lab/RESULT-random-lysis.md`. The pre-registration is `lab/PREREG-random-lysis.md`, committed before any run.
- **Setup:** unseen seeds 4–6, 600,000 ticks, one run per arm per seed.
- **New knob:** `LYSIS_SCHED`, off by default; unset output is identical to main. It kills exactly the evolving-virus run's death toll, per 1,000 ticks, but picks the victims at random.
- **Measure:** new active reactions late in the run (300k–600k), using #287's definition.

**What it found:**
- **The virus beat matched random lysis on all 3 seeds, so it passes the rule, but narrowly:** 3 vs 2 on seed 4, 9 vs 3 on seed 5, 9 vs 1 on seed 6. Seed 4 is inside the noise #287b saw.
- **Targeting is what holds diversity.** The dominant reaction is carried by 42–60% of organisms under the virus, and 86–95% under random lysis. Random lysis ends up about where no virus at all does (84–96%). This is the clearest effect.
- **Coevolution is still not shown.** The non-mutating virus plus random-key immigrants (#287c's arm) beat the evolving virus on 3 of 3 seeds: 11/13/13 against 3/9/9.
- **The one-off control does nothing lasting.** This is #287's own pre-registered control, never run before: every key seeded once, then no immigrants and no re-keying. It kills a burst at onset, the virus dies out, and late novelty is 0–1, the same as chemistry alone.
- **On seed 4, chemistry alone (4) beat the evolving virus (3).**

**Suggested wording for #287/#289:** "Enemy pressure that can reach any route holds metabolic diversity and adds some turnover, beyond matched random deaths. That pressure does not need to evolve. It runs inside a finite network that still plateaus (#287d)."

**The audit.** `lab/AUDIT-cos.md` is a read-only audit of #238–#290, classing each claim as HOLDS, WEAK or DIDN'T HOLD. It was written before this experiment, so its virus rows predate the result above.
- **Counts:** 37 claims, of which 9 HOLD, 11 are WEAK and 17 DIDN'T HOLD. Of the claims that would mean novelty keeps coming, none holds.
- **Patterns:**
  - A better control often matched the claimed effect.
  - Verdict flips all ran toward the modest reading.
  - Some promised controls were never run. This experiment runs one of them.
  - The lab era reused seeds 1–3 throughout.
  - #289's figure "1 win per 4 replays per quarter to 14,000" has no data entry behind it.
