# Code-keyed parasitism (INJECT) in the lean core: does adaptive novelty keep arriving where it did not? (#313)
Written and COMMITTED before the first deciding run. 15 Oct 2026. Delegated authority (the user: "can you decide where to go next"). Design: `lab/next-core/DESIGN.md`, revised by the pilot below.

## What changed in the lean core (identity checked)
- **TASKS deleted** (#290 failed every pre-registered rule; only `core-tasks.js`, also deleted, used it). Asking for it throws. The remove-or-prove half of this round.
- **PARA added**: op 24 becomes INJECT under PARA=1; PARA=2 is the control (op 24 executed and charged identically, no other effect); under both the neutral markers are 25-31, so both arms are measured with the same alphabet. INJECT copies a window (INJ_W=6) of the injector's own code, from position arg, over the first BINDING SITE in the organism it faces: INJ_K=3 consecutive instructions with the same ops as the window's head (INJ_MATCH 'same'). Cost C_INJ=0.002 per attempt. Draw-free.
- Plain, CHEM, CHEM+VIRUS and CHEM_BIG worlds are byte-identical to before (sha1 of three 1,000-tick samples, seed 11), and save/resume is exact for them and for PARA.
- The neutral populations mirror every infection that changed a host (a genotype change without a birth: a random member gets a new label).

## Pilot (practice seeds 1 and 2, 100,000 ticks; NOT evidence)
- 'comp' matching (sites are complements, op^1) never ignited: 0 hits in 100,000 ticks. 'same' ignited on both seeds: INJECT reached 22-46% of all instructions, programs grew to 24-47 instructions (cap 64), about 5,000-19,000 infections per 1,000 ticks, 58-96 distinct window keys per sample. Population stayed 1,250-1,400.
- **The neutral-label measure is not valid under PARA.** With infections mirrored, the label bar falls to about 0.001 (a genotype held by one or two organisms passes) and "adaptive ever" reads 92 and 513 against 13 and 19 for the control. Without mirroring it reads 34 against 13, but then infection-driven spread is not in the null at all. Neither is a fair comparison, so the label measure is reported and NOT ruled on.
- The head-to-head assay (`core-assay.js`) does not use the labels: it replays challenger against incumbent in a fresh world (mutation off, PARA as in the run) against an incumbent-against-itself null. It works on PARA runs (12 s per comparison). To pick challengers the same way in both arms, a new option SUCC=1 takes each window's commonest functional genotype whenever it differs from the last window's (a succession).

## Design
- Arms: para (PARA=1) and ctrl (PARA=2), plain-core defaults otherwise. Seeds 3101-3110, never run. 1,000,000 ticks each (about 5,500 generations at about 5.5 per 1,000 ticks), run as 4 exactly-resumed segments of 250,000 (`lab/para-batch.sh`). **Horizon, out loud: 1,000,000 ticks, about 5,500 generations.** The draft asked for 20,000 generations; that is about 3.6 million ticks and 70+ minutes per run here, so this round is the shorter horizon and says so.
- Assay per run: `SUCC=1 WIN=30 Q=4 PICK=8 REPS=6 T=3000 NPER=200`, OPTS = the run's own (PARA 1 or 2). 33 windows of 30,000 ticks; up to 8 successions replayed per quarter.

## Counting
A run counts if all 4 segments finished, N > 50 at the end, at least 4 successions were replayed in each of Q2 and Q4, and (para) INJECT still hit in the last quarter (ev.injHit > 0 in the last 250 samples). An arm with fewer than 8 counted runs is INCONCLUSIVE.

## Ruling
- **R1 (more late novelty).** Per run, S4 = strict wins in Q4 (challenger beats the incumbent with t > 2.2 AND its mean is above every null replicate). para BETTER if mean S4(para) >= 1.25 x mean S4(ctrl) and a two-sided permutation test over runs (20,000 shuffles) gives p < 0.05; WORSE if <= 0.8x with p < 0.05; else NOT DIFFERENT. (If the ctrl mean is 0, BETTER needs para's mean >= 1 and p < 0.05.)
- **R2 (no deceleration).** A run "holds" if its Q4 strict wins are at least half its Q2 strict wins (and Q2 > 0; a run with Q2 = 0 and Q4 > 0 holds). para passes R2 if at least 2/3 of its counted runs hold AND more para runs hold than ctrl runs.
- **KEEP-GOING verdict:** R1 BETTER and R2 passed: code-level parasitism keeps adaptive novelty arriving longer than the same world without it, at this horizon. Next: the longer horizon.
- **KILL (the DESIGN's rule):** R1 not BETTER: the bound is not lifted by code-keyed parasitism at 5,500 generations. Stop the OEE search in this family; the artwork becomes the main line. Recorded as bounded at this horizon, not as never.
- Anything else (BETTER without R2): partial; reported as such, no next round without the user.

## Prediction written before running
para will have more successions overall (infection keeps reshuffling who is commonest) but I do not expect more STRICT late wins: successions under infection may be won by parasites that win by infecting, not by being better at living, and the assay counts those as wins too (it is a real fitness, measured head to head). I put about 35% on R1 BETTER, 25% on KEEP-GOING.

## Reported, not ruled
Successions per quarter, wins and losses, injection hits and distinct keys over time (an arms-race signature is key turnover), program length, alive, and the label measure with its caveat.

## Step 6
Lab only. `engine.html`, saved universes and every default are untouched. `TASKS` leaves the lab core; no committed result depends on rerunning it, and the code stays in git history.

## Addendum, written after the first 20 runs and before any added run (template step 2)
The first 20 runs (seeds 3101-3110) gave 7 counted runs in each arm, under the floor of 8: INCONCLUSIVE, and no ruling was made. As the template directs ("extend the horizon or add unseen seeds; do not rule on it"), seeds 3111-3114 (never run) are added to BOTH arms, with every other setting, the counting rule and the ruling unchanged; the analysis is re-run over all 14 seeds. If an arm still has fewer than 8 counted runs, the result stays INCONCLUSIVE.
