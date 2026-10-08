# Does listening select? (pre-registered before the first run, 8 Oct 2026)

Page: video/selected_by_ear.html, `window.__still.simulate`.
A synthetic listener with a hidden taste keeps with p = 0.6*like and skips with p = 0.5*(1-like), like = logistic on a
trait of the tune. Three tastes: `high` (mean pitch, weighted by length), `busy` (note count), `leapy` (mean interval).
Null listeners (`<taste>:null`) keep with p = 0.30 and skip with p = 0.25 regardless of the tune: the same kind of
signal, carrying no information. `passive` never keeps or skips (only hears every tune through).
Seeds 11, 12, 13 (unseen). Per seed: one taste run, four null replicates (seeds s*100+1..4), one passive run. 300 turns
(about an hour of listening at 12 s a turn).

RULE: selection WORKS for a taste if, on at least 2 of 3 seeds, the taste run's population mean of that trait at turn
300 lies beyond every null replicate on that seed, in the taste's direction. Fewer than 2 = it does not select (at this
horizon). Reported beside it: the same at turn 100 (about 20 minutes), and the passive run, which shows what the
population does with no verdicts at all.
