# PRE-REGISTRATION #393 — emigrants chosen by health in the currency that is health (`visAmp`, not amplitude), judged in a running field

Written and committed before any decision run. Browser fields are unseeded, so every run is a fresh draw.

## Why
- **Found by `collective-test`'s `silenceRespected` row, which went red in #392's acceptance.**
  - It failed in the suite and alone in 2 of 3 runs.
  - At netMigrantRate 1, the relay's pulls came back with a migrant only 31-49 times in 60, where the row expects "every time".
- **The cause.** `buildMigrantPacket()` takes a migrant only if `amp > 0.2`, and tries 10 random creatures. Under one currency
  (`STORE_DEATH`, #381) amplitude no longer kills and sits near its floor. The display already reads the store instead (`visAmp`,
  #381).
- **Measured at tick 1,500, seed 3** — the share of creatures with amp > 0.2, and the chance one pull finds a migrant:

  | World | Share | Chance |
  |---|---|---|
  | TASKS off | 99.8% | 100% |
  | Two-currency TASKS | 97.2% | 100% |
  | One currency, four inputs | 17.2% | 85% |
  | One currency, five inputs (shipped #392) | **2.6%** | **23.5%** |

  So in the shipped field three of four of the relay's pulls are empty. The few creatures that do emigrate are chosen by a number
  that no longer means anything. By `visAmp`, which is the store under `STORE_DEATH` and amplitude everywhere else, 92-97% are
  healthy.
- **The fix:** the migrant gate reads `visAmp(pick) > 0.2`.
  - Byte-identical wherever amplitude is still the currency: `b07a4474` (TASKS off), `84eaf3b7` (the world before #381).
  - Under one currency the node digests change (`d7d1c3aa` to `11f765b3` at four inputs; the five-input default `47771e0e` to
    `3ec5f521`). In node a migrant goes to no one, so that change is the random stream alone. The real effect is migration between
    universes, which exists only in a field.
  - With it, `collective-test` reads 60 of 60 in four runs alone.
- **This is the CLAUDE.md trap of a switch carrying another mechanism.** `STORE_DEATH` made amplitude vestigial, and migration
  still read it.

## Arms
- **AMP:** `engine.html` at a8835c0 (the #392 ship: five inputs, the amplitude gate).
- **VIS:** the same engine with the gate on `visAmp`.
- Every other file is today's. The worker now reports each universe's accepted migrants (`mig`), and the rig sums them (`M`).

## Runs
- **6 pairs.** An AMP field and a VIS field are launched together, 1,800 s each, sampled every 60 s (`field-rate.js`).
- Batch `lab/port/migrant-batch.sh`, out `lab/port/out-migrant/`, analysis `lab/port/analyse-migrant.js`, written before the runs
  finish.

## Floor (executed first)
- A run is complete if its final sample is at 1,800 s or later, with no page or fatal errors.
- **Manipulation check:** VIS must have accepted more migrants than AMP by 1,800 s (M, summed over universes) in at least 5 of 6
  pairs. If not, the fix did not change migration in a field, and the result is INCONCLUSIVE.
- Fewer than 5 complete pairs: INCONCLUSIVE.

## Rule (the retire-or-prove template's "not WORSE and the arms differ: KEEP")
- **Primary:** a one-sided exact Wilcoxon on `log(F_vis / F_amp)` at 1,800 s.
- **WORSE:** VIS less at p < 0.05. **BETTER:** VIS greater at p < 0.05.
- **Reported:** F at 5, 10 and 20 minutes, M, ticks, alive.

## Verdict
- **Not WORSE: the fix ships** (it is a correction to a gate that a currency change left reading a vestigial number), with acceptance
  before `main`. Called BETTER only if BETTER.
- **WORSE:** the fix is held. The note records that restoring migration costs the field novelty. `collective-test`'s row is then a
  known red with its cause, until a follow-up decides what migration should do in this world.
- **INCONCLUSIVE:** held.

## Prediction (mine, before any run; I am 4 for 10)
Not WORSE, and probably neither direction. Migration carries programs between universes, which spreads functions already in the
union as much as it seeds new ones. Six pairs can only see a large effect.

## Saved worlds (rule 6)
The gate is a rule, not a gene. Nothing saved changes.

## Amendment, made after pairs 1-3 and before pairs 4-6 (the rule's direction is unchanged)
- **The manipulation check's instrument was wrong.** `mig` was `netStats.accepted`, which counts every heritable packet queued:
  migrants, plasmids, motifs and inscriptions. It does not count migrants.
  - Pairs 1-3 read AMP 7,320 / 7,264 / 6,940 against VIS 7,278 / 6,280 / 8,795, so the check as wired failed.
  - That says nothing about migrants.
- **Found by reading the receive path** (`handleNetworkMessage`, `queueNetworkPacket`) after the check failed.
  - The engine already counts accepted migrants alone: `network.migrantAccepted`, fired only on a migrant.
  - The worker now reports it as `migA`, and the rig sums it as `MA`.
- **What I have seen:** pairs 1-3's F, at ratios 1.00, 1.01 and 1.11.
- **Amended check.**
  - The manipulation check is judged on the pairs that carry `MA`, which are pairs 4-6. It requires VIS above AMP in **all** of
    them (3 of 3, against the original 5 of 6).
  - The primary rule, the verdict and the 6 pairs are unchanged.
