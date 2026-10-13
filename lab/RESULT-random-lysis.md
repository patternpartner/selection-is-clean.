# RESULT: the disturbance-matched null for the #287 virus claim

Pre-registration: `lab/PREREG-random-lysis.md`, commit `6159cd0`. It was committed and pushed before any run on seeds 4–6.
Runs were 1 Oct 2026, 20:24–21:31 BST. There were 15 runs, all reaching 600,000 ticks with exit code 0 and no reseeds. The rule
was applied as written. Raw samples are in `lab/random-lysis/raw/*.jsonl.gz`, and the readout is `node lab/random-lysis/analyse.js`
(output in `lab/random-lysis/analysis.txt`). It reproduces from the compressed files.

## What was asked
Do viruses make new metabolic behaviour because they are enemies that target what their hosts do? Or does any extra killing do
the same, by shaking up who wins? To find out, arm **r** gave each world exactly the virus world's own death toll, 1,000 ticks at
a time, applied to random organisms. The totals match to the organism: 123,529, 289,459 and 216,694 lysed on seeds 4, 5 and 6.

## Verdict, by the pre-registered rule: PASSES, narrowly
Primary measure: new active reactions (each captures at least 1% of metabolic income and was never active before) in the late
half of the run, ticks 300k–600k.

| seed | c: chemistry only | **v: evolving virus** | m: non-mutating virus + immigrants | o: one-off virus, no immigrants | **r: random lysis, matched** | v beats r? |
|---|---|---|---|---|---|---|
| 4 | 4 | **3** | 11 | 0 | **2** | yes, by 1 |
| 5 | 0 | **9** | 13 | 1 | **3** | yes |
| 6 | 2 | **9** | 13 | 1 | **1** | yes |

v is above r on all three seeds, so by the rule the virus counts as enemy-driven novelty at this horizon. The rule demanded
nothing more. Seed 4 passes by 3 against 2, though, which is well inside the noise. #287b's replicates of a single world ranged
from 0 to 12.

## The other readouts (they decide nothing)

| seed / arm | windows 11–20 with a new reaction | reactions ever active | commonest-reaction carrier share, 300–600k | mean population, 300–600k |
|---|---|---|---|---|
| 4 c / v / m / o / r | 4 / 2 / 6 / 0 / 2 | 11 / 18 / 33 / 10 / 27 | 0.88 / 0.60 / 0.52 / 0.92 / 0.93 | 1375 / 958 / 1037 / 1375 / 1399 |
| 5 c / v / m / o / r | 0 / 5 / 6 / 1 / 3 | 15 / 28 / 27 / 11 / 14 | 0.96 / 0.47 / 0.55 / 0.92 / 0.86 | 1440 / 1144 / 1137 / 1545 / 1490 |
| 6 c / v / m / o / r | 2 / 4 / 7 / 1 / 1 | 11 / 43 / 38 / 19 / 17 | 0.84 / 0.42 / 0.68 / 0.84 / 0.95 | 1351 / 1144 / 1135 / 1364 / 1460 |

## What it means, in plain words
1. **Targeting matters, and random death does not stand in for it.** With the same number of deaths spread at random, worlds
   fall back to a near-monoculture. Their commonest reaction is carried by 86–95% of organisms, as with no virus at all (84–96%).
   Virus worlds stay mixed (42–60%). This is the clearest effect in the experiment. It holds on every seed, with a large gap.
2. **The virus does not need to evolve.** A virus that cannot mutate, kept topped up by random-key immigrants (m), made MORE late
   novelty than the evolving virus on 3 of 3 seeds (11, 13, 13 against 3, 9, 9). This repeats #287c on unseen seeds. What does the
   work is pressure that can reach any route a host takes, not a virus that chases its hosts by evolving. So "coevolution" in the
   strict sense is still not shown.
3. **One-off pressure does nothing lasting.** #287's own pre-registered control (o: every key seeded once, no immigrants, no
   re-keying) was run here for the first time. It killed about 1,700–10,000 hosts at onset, then the virus died out. Late novelty
   was 0–1, the same as chemistry alone.
4. **The effect is small and noisy.** One run per arm per seed. The no-virus world beat the evolving virus on seed 4. Random lysis
   gave the most reactions ever active on seed 4 (27), all of them early, during the epidemic-matched killing, and few late.

## How the scorecard changes
- #287/#289's "viruses give more novelty" now **survives a disturbance-matched null**, on 3 of 3 unseen seeds (narrowly on one),
  and the diversity effect survives clearly. It moves from WEAK toward HOLDS for "targeted enemy pressure sustains metabolic
  turnover". Replicates would be needed to call it robust.
- **"Coevolution drives novelty" does not hold.** The non-mutating virus with immigrants did better on every seed.
- **Open-endedness is untouched.** This is a 600k-tick test inside the finite 256-species network that #287d showed plateauing by
  2.4M ticks. It says what kind of pressure keeps turnover going, not that turnover goes on forever.

## Caveats, stated as they are
- Random lysis matches the kill count per 1,000 ticks, spread evenly within each interval. Epidemics inside an interval are
  burstier than that.
- Random lysis kills any organism. The virus kills only carriers of the keyed reaction. That difference is the targeting this
  test was built to isolate.
- One run per arm per seed. The 3-of-3 strict rule was the only protection against noise, as pre-registered.
