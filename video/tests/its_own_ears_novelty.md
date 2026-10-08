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
