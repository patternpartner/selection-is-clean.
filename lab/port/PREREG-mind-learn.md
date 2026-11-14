# PRE-REGISTRATION #431 — IS THE MIND'S VALUE ITS LEARNING? The learning mind against the same writes drawn without a model

Written and committed before any decision run. Browser fields are unseeded, so every pair below is a fresh draw nobody has seen.

## Why
- **The mind is the one layer #430's screen could see** (a universe without it found 0.43 of one with it, t -4.56), and #410's
  whole-field arms missed it too (0.63). It is on in every browser universe (`#mind`, 20%) and off by default under node.
- What it does (`EngineMind`, #296): at a birth, with chance 20%, it rewrites ONE instruction of the child's program (an operation
  and a register pair), sampled from a small network trained on the programs of the parents it has seen. So a universe without it
  loses two things at once: **the learning**, and **one extra instruction rewrite in a fifth of births**. #430 and #410 cannot tell
  them apart. #308 tried under REPL (before TASKS) and the nulls were too wide to say.
- Its built-in `uniform` control draws the operation uniformly from all of `OPCODE_DRAW`, where a TASKS mutation draws one of the
  five task operations TASK_DRAWP (25%) of the time (`taskDrawOp`). Against that control the learning mind would win merely by writing
  the operations a TASKS world uses. So the control here draws the way a TASKS mutation draws.

## Arms
- **LEARN:** `engine.html` as on the branch (the mind learns).
- **DRAW:** a copy (`lab/port/mind-pair.sh`) whose default mind mode is `uniform`, with `uniform` drawing the operation as
  `taskDrawOp` does (from the mind's own random stream: task operation with chance TASK_DRAWP, else any of `OPCODE_DRAW`) and the
  register pair uniform. Same 20% of births, same one instruction, same position rule. It does not train, so its universes also
  save the mind's training time; that cost is part of what is compared, because a field runs in real time.
- Both patterns asserted once. The copy is byte-identical to the engine with the mind off (`6cbe0c0d`, node, TASKS seed 3, 1,500
  ticks) and differs with it on (`MIND=20`: learn `c171d594`, this draw `d9bfc096`, the old uniform `9cff7c93`).

## Runs
- **6 pairs**, tags p1-p6, the two fields of a pair together, 1,500 s, sampled every 60 s, one pair a launch
  (`lab/port/mind-learn-batch.sh`, out `lab/port/out-mind/`). Analysis `lab/port/analyse-mind-learn.js`, committed with this file.

## Floor, rule and verdict (the #423 and #427 rule, unchanged)
- A run counts if it ends final at 1,500 s with no universe missed and the switches `storeDeath 1, crowdK 100, provBirth 0, aim 0`,
  and its first-read universe reports `mindMode` `learn` (LEARN) or `uniform` (DRAW). Fewer than 5 complete pairs: INCONCLUSIVE.
- **Primary:** a one-sided exact Wilcoxon on `log(F_draw / F_learn)` at 1,500 s.
- **WORSE** (draw less, p < 0.05): the field misses the learning. **The mind earns its place AS A LEARNER**, at 25 minutes in a field,
  and it stays as it is.
- **Otherwise the learning goes DORMANT under TASKS only if both guards hold:** median F ratio at least **0.95**, and median size-17+
  ratio at least **0.90**. Then the TASKS default becomes the drawn writes (the same knob, reversible: `MIND_MODE` restores learning),
  the network's code stays for the worlds without TASKS, and the readout says the mind is not learning. A guard failing without
  WORSE is **INCONCLUSIVE**, and the learning stays.
- **Reported:** the ratio at 5, 10, 15, 20 minutes, size 17+, ticks, creatures.

## What it cannot say
- 25 minutes. A model trained on its world's programs may pay later than a draw does, or earlier and then not; a 25-minute pair
  sees the 25-minute value. If the learning is NOT missed here, a long pair is the follow-up before anything is removed for good.
- One rate (20%). Whether more writes would help, learned or drawn, is a separate question.

## Prediction (mine, before any run; I am 7 for 15)
INCONCLUSIVE or not worse: the draw is level with the learning (median about 1.0). The mind's loss falls well below uniform, but
what it learns is the frequency of operations in parents' programs, which selection already concentrates, so its writes look like
a copy of the population's own mix, close to what drawing gives. My lean is that the value is the extra writes, not the model.

## Saved worlds (rule 6)
If the learning goes dormant, a reloaded TASKS universe keeps its saved mind's file but writes children without it. Said here; it
does not block.
