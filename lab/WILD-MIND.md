# WILD-MIND — a mind that writes against its own expectations (cos/wild-mind)

Pre-registration. Written and committed before the first deciding run. Owner: CoS (the user, 10 Oct 2026: "you take the
lead on this one"). Branch only; nothing here changes main or the browser default.

## Hypothesis, in plain words

The #296 mind learns what parents look like and writes more of the same into children, so it pulls programs toward the
common (#296b: program entropy at the bottom of the mind-off band on every seed; uniform random rewrites at the same rate sat
above it). The leap: keep the same learner, but when it writes, prefer what it does NOT expect here. If novelty is made by
breadth (#293), a learner pointed away from the familiar should make programs that are new, and the world should keep more
of them than drift would, and more than the learning mind, plain random rewrites, or no mind.

## Mechanism (engine.html, `EngineMind`, `MIND_MODE=3` / `#mindmode=surprise`)

Everything is the #296 mind: same network, same training (every 50 ticks, 100 positions of the last 1,024 parents), same
rate (20% of parented births), one instruction substituted, always a different one. Only the sampling at the write changes.

- The model gives p(v | context) for the operation token, then for the register token given that operation.
- q(v) is how often token v occurs across the parents in the mind's memory (kept exact as the memory turns over).
- **Surprise writes v with probability proportional to q(v) / p(v | context).** That is exp(-PMI(v; context)): common
  somewhere in this world, unexpected at this place. Sampled, never maximised. A token no remembered parent carries
  (q = 0) is never written, so this is not uniform noise: it moves known parts into places the world does not put them,
  the way recombination would, rather than inventing from nothing.
- No free parameter (the exponent is 1, not tuned), so the trial seed tunes nothing.
- Readout: `mind.surprisal`, the mean -log p (nats, under its own model) of the operations it wrote. The learning mind
  now reports it too (no draws, no behaviour change).

Why not the lab's `NOVEL` (p^-0.5, #293 v4)? It favours whatever the model has not seen, which converges on uniform over
the tail; uniform is already an arm. Why the engine, not the lab: the mind the user runs is the engine's; #296b ran here;
and the engine's novelty sweeper (`harness-sweep.js`) carries a no-selection twin inside every run.

## Identity when off (checked before this commit)

`harness-sweep.js`, seed 1, 600 ticks, against origin/main 86ef899 in a separate worktree:
- mind off: output byte-identical (`cmp`).
- `MIND=20 MIND_SEED=1` (learn) and `MIND_MODE=2` (uniform): output identical to main's apart from the new `mind` key.
- `MIND_MODE=3`, seed 3401, 3,000 ticks: fires (85 children written, 392 parents seen, 75 training steps), mean surprisal
  of what it wrote 8.13 nats against the learning mind's 0.59 on the same seed (uniform over operations would be 6.06).

## Arms (paired by replicate k = 0..3)

| arm | env |
|---|---|
| OFF | (none), NULLSHIFT=k |
| LEARN (#296) | MIND=20 MIND_MODE=0 MIND_SEED=k+1, NULLSHIFT=k |
| UNIFORM | MIND=20 MIND_MODE=2 MIND_SEED=k+1, NULLSHIFT=k |
| SURPRISE | MIND=20 MIND_MODE=3 MIND_SEED=k+1, NULLSHIFT=k |

Four replicates per arm per seed (#294b: one run per arm is never resolvable here). `harness-sweep.js` defaults: 20,000
ticks, K=8 shadows, M=3 carriers, P=2,000, late window 10,000-18,000. Run by `lab/wild/run.sh` from a frozen worktree of
the commit carrying this file.

## Seeds

- Trial: 3401 (one replicate per arm). Checks that every arm runs at 20,000 ticks and fits in memory. Tunes nothing.
- Deciding, unseen: **3411, 3412, 3413** (no prior use in the repo).

## Primary measure — ONE

**E = program-layer persistent arrivals per 1,000 ticks (late half), minus the mean of the same run's eight MIXED
neutral shadows.** A program is the op sequence a creature actually runs; it arrives when 3 living creatures first carry it
and persists if 3 still do 2,000 ticks later. The MIXED shadows are fed the run's real births, deaths and introductions
(every new program enters them as a fresh label), with no selection. So E nets out how much new material an arm supplies
(the mind arms supply more than OFF), and E > 0 means new programs were held beyond what drift holds on the same supply.
This is the engine's no-selection twin, inside each run.

What it is not: the lab's income-only use. The engine has no per-instruction income readout; "held" here means whole
creatures carrying the program kept reproducing. It is still not carriers-of-a-part (#291's fault): the token is the whole
running program, and drift on the same supply is the bar it must clear outright.

## The bar (locked)

Per deciding seed:
1. **Executed first.** The seed counts only if every SURPRISE replicate wrote children and SURPRISE's mean surprisal is
   above LEARN's on that seed. Fewer than 3 counted seeds: **INCONCLUSIVE**.
2. **Twin (outright, no difference-of-differences).** SURPRISE's mean E over its 4 replicates is > 0, and E > 0 on at
   least 3 of 4 replicates.
   **And** SURPRISE's mean over its 4 replicates of (real minus the mean of the run's eight TREE shadows) is > 0.
3. **Controls (outside every null).** SURPRISE's mean E is above EVERY replicate of OFF, of LEARN and of UNIFORM.
4. **Guard.** No SURPRISE replicate has loop errors; none goes extinct or ends under 5 alive where every OFF replicate
   had no extinction and ended over 20.

**GO** if 2 and 3 both hold on at least 2 of the 3 seeds, and 4 holds on all three. Otherwise NO-GO, named:
"wilder, not selected" (3 on 2+ seeds, 2 on fewer), "twin only" (2 on 2+ seeds, 3 on fewer: the model is not shown to
matter beyond random rewrites), or plain NO-GO. Scored by `lab/wild/score.js`, committed with this file.

Reported beside, no ruling: the TREE verdict and the selection index (#267) for programs, trait-layer verdicts, program
introductions per 1,000 ticks, alive at the end, surprisal.

## Change before the deciding round (made after the trial seed, before any deciding run)

Trial seed 3401, one replicate per arm, 20,000 ticks (not evidence; recorded so the change below can be judged):

| arm | E (vs MIXED mean) | real | MIXED shadows min/mean/max | MIXED | TREE | introductions /1k late | alive | surprisal |
|---|---|---|---|---|---|---|---|---|
| OFF | -0.11 | 4.13 | 3.38 / 4.23 / 5.13 | chance | slower | 68 | 369 | - |
| LEARN | +0.31 | 3.88 | 2.88 / 3.56 / 3.88 | chance | chance | 80 | 413 | 0.47 |
| UNIFORM | +0.36 | 4.00 | 3.13 / 3.64 / 4.25 | chance | chance | 72 | 380 | - |
| SURPRISE | +2.13 | 4.63 | 1.75 / 2.50 / 3.25 | FASTER | FASTER | 93 | 417 | 9.26 |

Most of SURPRISE's E there comes from its MIXED shadows holding LESS (2.50), not from the real world holding much more
(4.63 against 3.88-4.13). The likely reason is dilution: an arm that introduces more new programs feeds the shadows more
fresh labels, each gets fewer carriers, fewer reach 3, so the shadow mean falls and E rises for supply alone. So the twin
condition (2) now ALSO requires E against the TREE null to be > 0 in the mean: TREE replays exactly the real events on the
real family tree at random recipients, so supply is matched exactly, and it leans toward SLOWER for programs (#256b), so
the extra condition only makes the bar harder. Nothing else changed; the trial tunes nothing. Runner bug fixed before
this (every trial run had written one file; re-run).

## What follows either way

- **GO:** a candidate, not a default. The browser default stays the learning mind until the user chooses; the next step
  is a longer horizon (40,000 ticks) on fresh seeds before anything is claimed beyond 20,000.
- **NO-GO:** `MIND_MODE=3` is deleted from engine.html (CLAUDE.md: remove or prove), and the write-up says which way it
  failed.
- Changing anything above after the first deciding run starts is a new experiment and is written up as one.

## Honest limits, stated now

The null spread is wide (#294b: chance alone moved a mind measure two- to three-fold). Four replicates, "outside every
replicate", is strict, and a small real effect can fail it. One horizon (20,000 ticks). The default world reads programs
at CHANCE against MIXED on 10 of 12 worlds (#299e), so beating the twin is a high bar for any arm.
