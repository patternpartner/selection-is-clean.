# Does a system with its own ears keep novelty arriving? (pre-registered before the first run, 8 Oct 2026)

Page: video/its_own_ears.html, `window.__ears.simulate`. 16 tunes, 8 listeners. A listener's pleasure in a tune is its
LEARNING PROGRESS: (its predictive loss on the tune before hearing it - after) per note, through its heritable lens
(weights on interval, duration and register channels, each an order-k Markov model, k heritable 0..2, smoothing
heritable). All models forget 3% a turn (fixed, not heritable - a heritable forgetting rate is a known cheat: forget
fast and the same tune pays forever). Tunes: chosen as parents by score, a child joins if its verdict beats the weakest.
Listeners: every 10 turns the one with the lowest running pleasure is replaced by a mutated copy of a better one (model
copied).
ARMS: `curious` (as above); `random` (verdict uniform noise - pure drift; 4 replicates per seed); `familiar` (verdict =
negative loss before hearing: likes what it can already predict - expected to collapse; the POSITIVE CONTROL).
Seeds 31, 32, 33 (unseen). 2000 turns (about 6.7 hours of playing). 
MEASURE: ARCHIVE NOVELTY - for each tune that joins the population, the smallest distance (16-slot pitch grid, slots that
differ) to every tune that ever joined before it; averaged per 250-turn window.
RULE:
 0. The measure must work: `familiar` late-window novelty below every `random` null on >= 2/3 seeds. If not, the
    measure cannot see collapse and the result is INCONCLUSIVE.
 1. `curious` late-window (turns 1750-2000) novelty beyond every `random` null on >= 2/3 seeds -> its ears drive novelty
    BEYOND DRIFT. Within the null band on >= 2/3 -> NO BETTER THAN DRIFT. Below every null on >= 2/3 -> its ears SLOW
    novelty (converge). Mixed -> SPLIT, say so.
 2. Reported, not ruled on: the trend (late / second window) for each arm, so "keeps arriving" vs "running down" is
    visible; population diversity; which lenses the listeners evolved.

## Run 1 (8 Oct) - CONFOUNDED BY A BUG, kept on record
The `random` null collapsed to zero novelty and zero diversity on every replicate. Cause, found by counting rejection
reasons: a split mutation could make off-grid lengths (1.5 -> .75 + .75) that validG accepted; the saved form rounds
lengths to the half-beat grid, so the stored tune no longer summed to two bars; every mutant of it was then invalid
(7,080 of 7,283 attempts in 300 turns), and the fallback in propose() returned an unchanged copy of the parent, so clones
took over (fallback on 80% of turns in `random`, 7% in `curious`). A fallback answering in place of the mechanism - the
CLAUDE.md trap. Fixed: splits stay on the grid, validG requires it, and when nothing new can be proposed an existing tune
plays again (`stuck`, counted) instead of a clone joining. The same split and fallback were in Selected by Ear: fixed
there too; the user's 12 saved tunes were checked and none was corrupted.

## Run 2 (same rule, bug fixed, same seeds)
Step 0 FAILS: `familiar` admits nothing after the first window on seeds 31 and 32 (late window NaN: no arrivals to
average) and on seed 33 its few rare arrivals score high (6.50). The measure, an AVERAGE over arrivals, cannot express
"nothing arrives". Verdict by the rule: INCONCLUSIVE.
Reported only: `curious` late window 2.49 / 3.60 / 3.41 vs null bands 2.72-3.24 / 2.09-2.81 / 2.52-3.18 (below on 31,
beyond on 32 and 33); over all windows curious averages ~0.4-0.6 slots more per arrival than drift. Neither curious nor
drift runs down over 2000 turns. `stuck` 0-4 per run. Curious arm admits ~1200 tunes vs drift ~1650. The ears converge
on the same lens on every seed: INTERVALS, memory 2 (one seed also memory 1).

## Experiment 2 (pre-registered after run 2, before running it): NOVELTY FLOW
Same page, arms and controls; UNSEEN seeds 41, 42, 43; 2000 turns. MEASURE: novelty flow per 250-turn window = the SUM
of archive novelty over the tunes that joined in that window (0 when nothing joins), divided by 250 (novelty per turn).
Same rule: step 0 = `familiar` late flow below every `random` null on >= 2/3 seeds, else INCONCLUSIVE; step 1 =
`curious` late flow beyond / within / below every `random` null on >= 2/3 seeds -> BEYOND DRIFT / NO BETTER THAN DRIFT /
SLOWS NOVELTY, mixed -> SPLIT. Reported: trend (late / second window) per arm.

## Experiment 2 result (seeds 41-43, 2000 turns, rule unchanged)
Step 0 PASSES: `familiar` late flow 0.00 / 0.01 / 0.00, below every `random` null (1.55-2.63) on 3/3 - the measure sees
collapse. Step 1: `curious` late flow 2.27 / 1.57 / 1.93 vs null bands 2.02-2.55 / 1.55-2.63 / 2.11-2.50: within, within,
below -> NO BETTER THAN DRIFT. Trend (late / second window): curious 1.25 / 0.73 / 0.98; random roughly flat.
Reading: curiosity keeps novelty arriving (it never collapses, unlike liking the familiar) but no faster than chance;
the ears are choosier (~1200 tunes admitted vs ~1650), so each arrival is a little further from the past (run 2) but less
arrives. What they change is WHICH novelty: on every seed the ears converge on the same lens, intervals with a two-note
memory - left to evolve, they learn to listen for the shape of the melody. A negative result at this rung; not tuned to
pass. Candidate follow-ups (each needs its own pre-registration): ears that attend to only part of the population
(niches), and novelty judged against each ear's own history.
