# Corrected re-run: do programs matter to trait spread or lineage structure? (written before any deciding run; delegated authority, decision mine)

13 Oct 2026. Engine: engine.html at main 8795752 (unchanged), defaults. Replaces the third measure of PREREG-popblank-traits.md (sha256 7ad1c6ed9f526055).

## What went wrong in the first run (kept on the page)
PREREG-popblank-traits.md defined LINEAGES MINTED as `_linNext` at tick 4000 minus at tick 1500. `_linNext` is a stale variable (a comment at engine.html:21486 records the namespace fix that
retired it); the live counter is `nextLineageID`, which climbs by about 320 per 1,000 ticks in a normal world (seeds 1-3, ticks 1,000-9,000, measured). The first run therefore reported 0 minted in all
40 runs, and its "DOES NOT MATTER" for that measure was an artifact of reading the wrong variable, not a result. Its other two measures are valid: dispersion BLANK/NUDGE 1.04 CI [0.71, 1.52]
(INCONCLUSIVE, seeds 61-68) and lineages alive 1.05 CI [1.00, 1.11] (DOES NOT MATTER).

## Prediction written before running
(a) Lineages minted after tick 1500 fall under BLANK, because at least one minting route (_specSpawnSim inside the vmActions[4] branch) is a program route; the tendency-distance route
(a child whose born tendency is more than SPECIATE_DIST = 0.55 from its parent's) is not, so the fall is partial. (b) Dispersion: I do not know the sign.

## Design (identical to PREREG-popblank-traits.md; probe10b.js fixes the counter)
Per seed BLANK (every alive program set to [], re-emptied every 20 ticks) and NUDGE k = 1..4 at tick 1500; all to tick 4000.
Measures at tick 4000: (1) trait dispersion (sum over DIMS of the variance of tend over alive); (2) lineages alive (distinct pLin among alive); (3) lineages minted = nextLineageID(4000) - nextLineageID(1500).
Deciding seeds: 71-78 (never run). Counted if all five runs finish without engine error; fewer than 5 counted = INCONCLUSIVE.

## Statistic and rule (as before)
L = ln((BLANK + e) / (mean NUDGE 1..4 + e)), e = 1e-9 for dispersion and 1 for counts; paired-t CI at the Bonferroni level (per-side tail 0.05/6); placebo = NUDGE 1 vs mean NUDGE 2..4.
MATTERS: CI excludes 0 and |mean L| >= ln 1.25. DOES NOT MATTER: CI inside [ln 0.8, ln 1.25]. Otherwise INCONCLUSIVE.
Pooling, fixed now: measures (1) and (2) are ALSO reported pooled over seeds 61-68 (first run) and 71-78 (this run), 16 seeds, because dispersion is noisy and the first run could not decide it.
Measure (3) uses seeds 71-78 only (the first run's values are invalid). The verdict for each measure is the pooled one where pooled data exist.

## What this cannot say
Three numbers at one tick, one window, default settings. A program could matter to something not measured here.
