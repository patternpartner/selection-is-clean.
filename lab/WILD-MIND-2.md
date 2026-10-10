# WILD-MIND-2 — an explorer and a keeper (cos/wild-mind-2)

Pre-registration. Written and committed before any deciding run. Owner: CoS (the user, 10 Oct 2026: "you take the lead on
this one"; no Claude ask). Branch only. Nothing here changes main or the browser default.

**Branch base:** `cos/wild-mind` at b610048, the commit that deleted the surprise mind. Its `engine.html` and
`harness-env.js` match main 86ef899 byte for byte, and it carries the wild-mind tooling (the sweep's mind report, run and
score scripts, WILD-MIND.md with the NO-GO). So this branch is main plus the deletion record plus this design, and no
mechanism that failed comes with it.

## What the first round taught

WILD-MIND (surprise) wrote instructions about 20 times more surprising than the learning mind (about 9.7 nats against 0.45),
and the world kept none of it beyond drift. Against the exact-supply TREE twin, its mean was below zero on every seed.
Wilder edits at the source don't help when selection throws them away. #293 v6/v7 showed the other failure: when the world
picks how to vary (by children or by spread), it picks the exploiter. So this design doesn't make the proposer wilder, and
it doesn't let short-run success choose the drive. It changes **which wild edit gets installed**.

## The leap: draft wild, install what lasts

- **Explorer:** for a written child, draft CAND = 8 edits, each uniformly random (position, operation, registers). This
  is the breadth that UNIFORM has, and that #293 found novelty comes from.
- **Keeper:** a small logistic model installs **one** of the 8, the one it predicts is most likely to still be carried
  2,000 ticks later. Features: what is written, what it replaces, its neighbours, where in the program, its registers. They
  are hashed into 4,096 weights. An untrained keeper scores all drafts equally and installs the first, which is UNIFORM.
- **What it learns from: outcomes in this world, nothing else.** Every installed edit is followed. A mark rides with the
  child, is inherited, and moves through `compact()`. Every 250 ticks a census asks which edits some living creature still
  runs exactly as written. When an edit is 2,000 ticks old it is labelled **held** or **lost**. The keeper is scored on it
  first (prequential log loss, the learning check), then takes one gradient step.
- **SHAM** (the control that makes this a test): the same drafts and model, trained on labels drawn from its own stream
  at the true labels' running rate. As many positives, no information.
- **Same rate as every mind arm:** 20% of parented births get exactly one edit. Supply is matched to UNIFORM.
- Flags: `MIND_MODE=4` (`#mindmode=keeper`) and `MIND_MODE=5` (`#mindmode=sham`). Off by default. Mode 3 (surprise) is
  gone and reads as the learning mind. The keeper is not saved with a universe; a reload starts it untrained.

Why this one over the other candidates:
- **Crediting a rewrite against its siblings:** that is #293 v6/v7's judge, and it chose the exploiter.
- **A critic that installs only if population diversity rises:** that can't be known at birth, so it needs a predictor of
  outcomes anyway, which is the keeper.
- **Novelty pressure on the mind's objective:** that is what surprise just failed.

The keeper keeps UNIFORM's breadth in the drafts, and moves the learning to the one place selection already acts:
whether a change lasts.

## Identity when off (checked before this commit)

`harness-sweep.js`, seed 1, 600 ticks, against main 86ef899 in its own worktree:
- Mind off: byte-identical (`cmp`).
- `MIND=20` learn and `MIND_MODE=2` uniform: identical to main apart from the sweep's own `mind` key.

Keeper fires (seed 3420, 6,000 ticks, `MIND_MODE=4`): 174 children written, 119 edits labelled, 56 held (47%), 55
pending. At that point the keeper had not yet learned: prequential log loss 0.699 against the base rate's 0.669. SHAM:
161 written, 119 labelled, 45% held. No loop errors.

## Arms (paired by replicate k = 0..5)

| arm | env |
|---|---|
| OFF | NULLSHIFT=k |
| LEARN (#296, today's browser default) | MIND=20 MIND_MODE=0 MIND_SEED=k+1 NULLSHIFT=k |
| UNIFORM (the explorer alone) | MIND=20 MIND_MODE=2 MIND_SEED=k+1 NULLSHIFT=k |
| SHAM (explorer + keeper with no information) | MIND=20 MIND_MODE=5 MIND_SEED=k+1 NULLSHIFT=k |
| KEEPER | MIND=20 MIND_MODE=4 MIND_SEED=k+1 NULLSHIFT=k |

There are **six replicates** per arm per seed, not four, because the first round's bands were wider than its effects. The
runs use `harness-sweep.js` defaults: 20,000 ticks, K=8, M=3, P=2,000, late window 10,000-18,000. They run through
`lab/wild/run2.sh` from a frozen worktree of the commit carrying this file. That is 90 runs, about 3.3 hours at 4 at a time
on this box.

## Seeds

- **Trial: 3420.** Checks that the arms run at 20,000 ticks and whether the keeper learns at all by then. Tunes nothing:
  CAND=8, LAG=2,000, CENSUS=250 and the learning rate 0.05 are fixed above.
- **Deciding (unseen): 3421, 3422, 3423.**

## Primary measure — one

**ET = program-layer persistent arrivals per 1,000 ticks (late half), minus the mean of the same run's eight TREE
shadows.** TREE replays the real family tree with the real births, deaths and program changes landing on random
recipients. Supply is matched exactly. It is also free of the MIXED dilution that WILD-MIND found, where an arm that
introduces more programs thins out its own shadows. ET > 0 means the creatures that really got the new programs held them
better than random recipients of the same changes would. TREE leans toward SLOWER for programs (#256b), so this bar is
conservative.

**Income: still not possible in the engine.** There is no per-instruction income readout, and the VM doesn't count which
instruction slots a creature executes. So "held" means the instruction is still in a living descendant's running program.
It does not mean the instruction earned anything. That is still not #291's 1%-carrier fault, for two reasons: the
primary is whole programs held beyond an exact-supply no-selection twin, and the keeper's label is about lineages that kept
reproducing with the edit. But it is not income-only. That would need a per-slot execution or income counter in the VM.
CLAUDE.md warns that opcode dispatch lives in four drifted copies, so every site would need patching, with an assert on
the count. That instrumentation is named here and is not part of this round.

## The bar (locked)

Per deciding seed:
1. **Executed, and the keeper learned.** Every KEEPER replicate wrote and labelled edits. Over its 6 replicates, the
   keeper's mean prequential log loss is below the base-rate log loss, and its mean predicted score for held edits is
   above its score for lost ones, and that held-minus-lost gap is above SHAM's on the same seed (added after the trial, see below). If the keeper learned on fewer than 2 seeds: **NO-GO ("the keeper did not learn")**, not
   inconclusive. A longer horizon would be a new experiment.
2. **Twin (outright):** KEEPER's mean ET is above 0, and ET is above 0 on at least 4 of 6 replicates.
3. **Controls:** KEEPER's mean ET is above EVERY replicate of SHAM and of UNIFORM, its exact controls ("does the keeper's
   information matter", "does filtering matter"). It must also be above the mean of LEARN and the mean of OFF.
4. **Guard:** no KEEPER loop errors. No KEEPER extinction or end under 5 alive where every OFF replicate had none and
   ended over 20.

**GO** needs 1, 2 and 3 on at least 2 of 3 seeds, with 1 on at least 2 seeds and 4 on all. Otherwise it is NO-GO, under
one of these names: "above the arms, not the twin", "twin only", "the keeper did not learn", or plain NO-GO. Scored by
`lab/wild/score2.js`, committed with this file.

Reported beside the verdict, with no ruling: ET against MIXED, the selection index for programs (#267), trait verdicts,
held rate KEEPER against SHAM, SHAM's log loss (it should not beat its base rate), and alive at the end.

## Trial seed 3420 (one run each, 20,000 ticks; not evidence) and the one change it caused

| arm | written | labelled | held rate | prequential log loss vs base | held-minus-lost score | ET (vs TREE) | E vs MIXED | alive |
|---|---|---|---|---|---|---|---|---|
| KEEPER | 583 | 534 | 0.586 | 0.6706 vs 0.6719 | +0.021 | -0.594 | -0.422 | 410 |
| SHAM | 470 | 434 | 0.643 | 0.6646 vs 0.6443 | +0.036 | -0.344 | +0.969 | 350 |

- **The keeper barely learns at this horizon.** It beat the base rate by 0.0013 nats, and the edits it installed were held
  *less* often than SHAM's (0.59 against 0.64). On one run that's not a finding, but it is the likeliest way this round
  fails: rule 1, or plain NO-GO.
- **Change before the deciding round:** SHAM, which has no information, still showed a positive held-minus-lost score
  (+0.036). Slow drifts in the held rate over a run produce one with no learning at all. So rule 1 now also requires the
  keeper's gap to beat SHAM's on the same seed. This only makes the bar harder. Nothing is tuned. CAND, LAG, CENSUS and the
  learning rate are unchanged.

## What follows either way

- **GO:** a candidate, not a default. Next would be 40,000 ticks on fresh seeds, then the income instrumentation above,
  before anything is offered to the user as the browser default.
- **NO-GO:** modes 4 and 5, `pMindE` and the census are deleted from engine.html (remove or prove), with the reason
  recorded.
- Changing anything above after the first deciding run starts is a new experiment, and gets written up as one.

## Honest limits, stated now

- The keeper's label is "still carried", and that can teach it viability: which random edits break nothing. That is a
  real lever on how much of a wild supply survives. It is not a lever on novelty by itself, which is why the primary is
  judged against TREE and SHAM rather than against the label.
- 20,000 ticks gives roughly 400 labels per run. A keeper that needs more data than that fails rule 1, and that counts as
  an answer.
- One horizon.

## Strengthened keeper (supersedes the keeper mechanism above; pre-registered before any deciding run)

The CoS call (10 Oct, 10:43): do not run the round as first written, because the keeper barely learned. Strengthen it
using only trial seed 3420, try at most 3 variants, and delete the design if none learns. Two variants were tried, both from
commit 76a545e, at 20,000 ticks on seed 3420, keeper and sham each:

| variant | what changed | labels | keeper log loss v base | SHAM log loss v base | held-minus-lost: keeper v SHAM |
|---|---|---|---|---|---|
| (first, b202d84) | one label per installed edit: still carried 2,000 ticks later | 534 | 0.6706 v 0.6719 | 0.6646 v 0.6443 | 0.021 v 0.036 |
| 1 | also labels the world's own random mutations; LAG 1,000; census every 125 | 743 | 0.6018 v 0.6240 | 0.5966 v 0.5586 | 0.061 v 0.015 |
| **2 (chosen)** | **a fitness surrogate: every parented birth is a record, labelled "had a child within 1,000 ticks"; features of the whole program** | **2,142** | **0.5229 v 0.5799** | **0.6487 v 0.5779** | **0.225 v 0.018** |

Variant 2 learns clearly. It predicts 0.057 nats better than the base rate, while SHAM is 0.071 nats worse than its own.
Its held-minus-lost gap is 12 times SHAM's. Variant 1 learns, but only a little. Variants 0 and 1 are deleted from the
engine. Variant 2 is now the only keeper, with no knob.

**The keeper now (what will run):**
- The explorer is unchanged: 8 uniform drafts per written child, at the same 20% rate as every mind arm.
- The keeper is a logistic model over a whole child program: each instruction, each adjacent pair of operations, each
  instruction by quarter of the program, and each instruction by its registers. These are hashed into 4,096 weights.
  Learning rate 0.02.
- It installs the draft whose resulting child program it scores highest.
- It learns from every parented birth in the world, not only the ones it wrote. Each child is a record. The parent's
  record counts the child. 1,000 ticks after birth the record is labelled (had at least one child, or not), scored
  prequentially, then learned from.
- SHAM is the identical machinery, trained on labels drawn at the true running rate from its own stream.
- In the report, "held" now means "had a child by 1,000 ticks". The field names are unchanged, so `score2.js` reads them.
- Checked: the cleaned keeper and sham are byte-identical to variant 2 at 76a545e (seed 3420, 3,000 ticks). Mind off is
  byte-identical to main 86ef899; learn and uniform are unchanged (seed 1, 600 ticks).

**What this changes about the claim.** The keeper is now a learned model of which programs reproduce, used to choose
among wild drafts. That is closer to #293 v6's judge (children) than to a judge of novelty. The difference is that it never
chooses the drive: every draft is uniformly random. So it can only make wild variation more viable. Whether more viable
wild variation means more held novelty is exactly what the primary measure and the twin decide. The label is not income
(see above).

**The bar, locked (only hardened):** everything in "The bar (locked)" above stands: 6 replicates, seeds 3421-3423, the
TREE twin outright, above every SHAM and UNIFORM replicate, above the LEARN and OFF means, the guard, and 2 of 3 seeds.
Rule 1 now requires all of these:
- the keeper's mean prequential log loss under its base rate's;
- AND under SHAM's mean log loss;
- AND its held-minus-lost gap above 0 and above SHAM's.
If the keeper learns on fewer than 2 seeds, the result is NO-GO.

**Runs:** `lab/wild/decide2.sh` runs `run2.sh` from a frozen worktree of the commit carrying this section. When all 90
runs are done, it writes `ALL-DONE` and `SCORE.txt` in the output directory and appends the score below. It then commits
that one file to `cos/wild-mind-2` and pushes it.

## Deciding round result (seeds 3421-3423, 2026-10-10 17:20 BST, scored by lab/wild/score2.js from frozen 66a25f8)

```
3421: keeper did not learn (log loss 0.377 v base 0.438, held-minus-lost score 0.302 v sham 0.180) | sham log loss 0.324 v 0.277 | held rate KEEPER 0.191 SHAM 0.110
   KEEPER  ET [-0.391,0.125,0.766,0.187,0.719,-0.328] mean 0.180 | E vs MIXED mean 1.377 | real [4.625,5.125,5.125,4.75,6.25,4.125] | sel CHANCE,CHANCE,CHANCE,CHANCE,CHANCE,DISFAVOURED | traits SLOWER,SLOWER,SLOWER,SLOWER,SLOWER,SLOWER | alive 383,398,364,382,411,417
   SHAM    ET [-0.563,0.203,-0.344,-1.25,-1.031,-0.734] mean -0.620 | E vs MIXED mean 0.349 | real [4.125,5.75,3.75,3.125,3.75,3.75] | sel CHANCE,CHANCE,DISFAVOURED,CHANCE,CHANCE,DISFAVOURED | traits SLOWER,SLOWER,SLOWER,SLOWER,SLOWER,SLOWER | alive 402,383,435,396,390,373
   UNIFORM ET [-1.031,-0.641,-0.859,0.172,-0.563,0.484] mean -0.406 | E vs MIXED mean 0.794 | real [4.5,3.75,3.875,4.625,3.375,5] | sel CHANCE,DISFAVOURED,CHANCE,DISFAVOURED,CHANCE,CHANCE | traits SLOWER,CHANCE,SLOWER,SLOWER,CHANCE,SLOWER | alive 393,396,377,369,356,432
   LEARN   ET [-1.266,-0.906,-1.078,-0.984,-0.359,0.141] mean -0.742 | E vs MIXED mean -0.156 | real [2.875,3.125,2.375,4.5,3.625,5.625] | sel CHANCE,CHANCE,FAVOURED,CHANCE,FAVOURED,CHANCE | traits SLOWER,SLOWER,CHANCE,SLOWER,SLOWER,SLOWER | alive 398,401,299,419,402,391
   OFF     ET [-0.719,-1.125,-0.797,-1.5,-1.766,0] mean -0.985 | E vs MIXED mean -0.597 | real [3.75,3.75,4.125,2.5,2.25,6.25] | sel DISFAVOURED,CHANCE,CHANCE,DISFAVOURED,CHANCE,CHANCE | traits SLOWER,SLOWER,SLOWER,SLOWER,CHANCE,SLOWER | alive 426,378,414,391,408,531
   twin (ET>0 in mean and on >=4 of 6): PASS | controls (above every SHAM and UNIFORM replicate, above LEARN and OFF means): fail (SHAM band, UNIFORM band)
3422: keeper LEARNED (log loss 0.218 v base 0.298, held-minus-lost score 0.429 v sham 0.245) | sham log loss 0.308 v 0.271 | held rate KEEPER 0.116 SHAM 0.100
   KEEPER  ET [-1.516,-0.641,-0.438,-0.938,-0.859,-0.563] mean -0.826 | E vs MIXED mean 0.419 | real [3.75,3.5,3.75,3.75,3.125,4] | sel CHANCE,CHANCE,CHANCE,CHANCE,CHANCE,FAVOURED | traits CHANCE,SLOWER,SLOWER,SLOWER,SLOWER,SLOWER | alive 397,300,379,386,400,399
   SHAM    ET [-0.578,-1.766,-0.641,-3.219,0.219,0.672] mean -0.885 | E vs MIXED mean 0.797 | real [4.75,2.5,4.75,4.5,4.125,5.125] | sel CHANCE,DISFAVOURED,DISFAVOURED,CHANCE,DISFAVOURED,CHANCE | traits SLOWER,SLOWER,SLOWER,SLOWER,SLOWER,SLOWER | alive 409,425,373,399,397,394
   UNIFORM ET [-0.953,-0.797,-0.359,-0.688,-0.859,-0.719] mean -0.729 | E vs MIXED mean 1.120 | real [2.75,3.25,5.125,5.25,3.375,4.375] | sel CHANCE,DISFAVOURED,CHANCE,CHANCE,CHANCE,CHANCE | traits CHANCE,SLOWER,SLOWER,SLOWER,SLOWER,SLOWER | alive 293,391,385,400,385,400
   LEARN   ET [-0.828,-1.25,-0.484,-1.813,-0.047,0.297] mean -0.688 | E vs MIXED mean 0.310 | real [3.625,4.625,3.75,5.25,4.375,2.75] | sel CHANCE,CHANCE,CHANCE,CHANCE,CHANCE,CHANCE | traits SLOWER,SLOWER,CHANCE,SLOWER,SLOWER,CHANCE | alive 382,423,381,348,382,196
   OFF     ET [-0.531,-0.438,-0.172,-0.609,-0.906,-0.188] mean -0.474 | E vs MIXED mean -0.334 | real [4.5,5.625,4.25,3.875,3.625,3.5] | sel DISFAVOURED,DISFAVOURED,CHANCE,DISFAVOURED,CHANCE,CHANCE | traits SLOWER,SLOWER,SLOWER,SLOWER,SLOWER,CHANCE | alive 345,445,410,396,360,379
   twin (ET>0 in mean and on >=4 of 6): fail | controls (above every SHAM and UNIFORM replicate, above LEARN and OFF means): fail (SHAM band, UNIFORM band, LEARN mean, OFF mean)
3423: keeper LEARNED (log loss 0.170 v base 0.236, held-minus-lost score 0.468 v sham 0.197) | sham log loss 0.352 v 0.300 | held rate KEEPER 0.086 SHAM 0.109
   KEEPER  ET [-0.281,-0.609,-0.031,-0.359,-0.156,0.094] mean -0.224 | E vs MIXED mean 0.242 | real [7,3.75,5.125,3.5,3.125,3.875] | sel DISFAVOURED,CHANCE,FAVOURED,CHANCE,CHANCE,FAVOURED | traits SLOWER,SLOWER,SLOWER,SLOWER,CHANCE,SLOWER | alive 589,418,383,386,276,390
   SHAM    ET [-1.109,0.203,-1.188,0.219,-0.094,-0.094] mean -0.344 | E vs MIXED mean 1.435 | real [4.875,5,3,4,4.5,3.125] | sel CHANCE,FAVOURED,DISFAVOURED,CHANCE,CHANCE,DISFAVOURED | traits SLOWER,SLOWER,SLOWER,SLOWER,SLOWER,CHANCE | alive 396,400,285,306,377,173
   UNIFORM ET [-0.875,-1.25,0.125,-0.094,-1.234,0.812] mean -0.419 | E vs MIXED mean 0.768 | real [4.375,3.5,4.125,3.5,3.375,5.875] | sel CHANCE,DISFAVOURED,FAVOURED,FAVOURED,DISFAVOURED,FAVOURED | traits CHANCE,SLOWER,SLOWER,SLOWER,SLOWER,SLOWER | alive 397,396,412,421,366,379
   LEARN   ET [-1.047,-0.828,-0.547,-1.156,-0.516,-0.781] mean -0.813 | E vs MIXED mean 0.156 | real [4.125,3.625,3.125,3.5,3.75,3.875] | sel CHANCE,CHANCE,DISFAVOURED,CHANCE,CHANCE,CHANCE | traits SLOWER,SLOWER,SLOWER,SLOWER,SLOWER,SLOWER | alive 393,401,355,370,311,400
   OFF     ET [-0.797,0.297,0.375,-0.656,0.156,-1.406] mean -0.338 | E vs MIXED mean 0.458 | real [4.375,5,4.125,3.25,4.625,3] | sel DISFAVOURED,CHANCE,CHANCE,CHANCE,CHANCE,FAVOURED | traits SLOWER,FASTER,CHANCE,SLOWER,SLOWER,SLOWER | alive 403,443,365,404,406,408
   twin (ET>0 in mean and on >=4 of 6): fail | controls (above every SHAM and UNIFORM replicate, above LEARN and OFF means): fail (SHAM band, UNIFORM band)
keeper learned on 2 | twin pass 0 | controls pass 0 | all three 0 (need 2 of 3)
VERDICT: NO-GO
```

## After NO-GO (2026-10-10 ~17:21 BST)

Keeper and sham deleted from `engine.html` and `harness-env.js` (restored to `b610048` / cos/wild-mind, byte-identical to main `86ef899` for those files). Modes 4 and 5, `pMindE`, and the keeper census are gone. Reason: deciding round on seeds 3421–3423 failed the bar — keeper learned on 2 of 3 seeds, but twin pass 0 and controls pass 0 (need all three on 2 of 3). The frozen worktree at `/home/box/wt/wild-mind-2-frozen` (66a25f8) still reproduces the scored arms. `run2.sh` refuses KEEPER/SHAM unless `ALLOW_DELETED=1`.
