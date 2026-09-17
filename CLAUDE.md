# selection-is-clean

An open-ended-evolution artwork. `engine.html` is one universe; `universe.html` is a Web Worker
shell around it; `index.html` is a field of them; `metabolism.html` is the panel.

## What this is for, and what would count as progress

The artwork is the claim that novelty keeps arriving. Everything else in this file is machinery for
not fooling yourself about that, and machinery is not the subject. **A session that ends with a
greener rig and an unchanged universe has not moved the work**, however much it found — and `#216`
is the standing example: seven unsound rows fixed, seven real defects, four engine lines changed.
That batch was worth doing. A second one exactly like it would not be.

So before you push, be able to answer *what moved in the universe, and against which number*. Green
is not that number. Green says the instrument is honest; it says nothing about the thing measured.

**The dependent variable went missing, and this is where it went.** Entry `#11` reports
`entropyRatio 0.44 -> 0.69`, `kinds 5.0 -> 10.8`, `collapsing: yes` — hard, comparable, and failing
in a way that pointed somewhere. By `#216` the reported figure is `259/0` across 21 seed-and-budget
arms, which is a measurement of the rig. The swap happened gradually and nobody chose it. **If the
headline number in your entry is a pass count, you are reporting on the wrong artifact.**

- `node harness-variance.js` — how many of the 191 genome keys actually hold more than one value
  across the living population, and whether that variance is retained over the run. Selection needs
  variance; a gene read a million times a tick and held at one value is a constant wearing a gene's
  name. `#209` asks whether a gene is read and `#210` whether it was read this run; **neither asks
  whether it moves**, which is the question selection cares about. Multi-seed, zero draws consumed.
- **A READ SITE IS NOT A READ EVENT, and that rung is below every other one on this page.** `#217`
  named the ladder's top (`a read is not a move`); `#217d` fell through its bottom. `#217c` counted
  `chemistryTable`'s readers — exactly one, `updateField()` — and that count is TRUE and was used to
  decline a deep-copy correctly. Nobody asked how often the one reader RUNS. It evaluates a recipe
  only for cells with `cellProgStr>=0.05`, and at 6,000 ticks `cellProgStr` is exactly 0 across all
  1600 cells, so `CHEM=0` and `CHEM=1` agree to twelve significant figures while executing different
  tables. Twelve recipes mutating every cycle, and the world cannot tell.
  **The ladder is: DECLARED -> CARRIED -> EXECUTED -> VARYING -> SELECTED.** `#209`/`#210` sit at
  rung two, `harness-variance` at rung four. Before reporting any of the upper rungs for a mechanism,
  establish that the thing ever ran once — and prefer a state every code path must write through
  (here `cellProgStr`) over any one path, because INSCRIBE has FOUR real `case 20:` bodies plus a
  profiler stub and a probe on one undercounts fourfold.
  **AND THE FIRST VERSION OF THIS BULLET SAID "NEVER", WHICH WAS FALSE — read that as the horizon
  warning two bullets down, with teeth.** The 60k sweep that was RUNNING WHILE THE CLAIM WAS PUSHED
  came back with the first mark on the substrate at tick **6,109** on seed 2 — 109 ticks past the
  budget that produced "never" — and the first recipe actually EVALUATING at 9,541. The layer is not
  dead; it is LATE and SPARSE (11-23 of 1600 cells ever active across three seeds). **"Never" is not
  a thing a run can show you.** It can only ever show you "not by tick N", and the distance between
  those two was one part in ten here.
  **The chain has FOUR rungs and the middle two are easy to merge** — I merged them twice. They are:
  op 20 CARRIED in a program -> op 20 FIRES -> strength CROSSES 0.05 -> recipe EVALUATES. First mark
  and first execution are 3,431 ticks apart on seed 2. Related: the 0.05 gate is ABSORBING FROM
  ABOVE, because `cellProgStr`'s single decay site sits after `if(strength<0.05)continue;` — a cell
  decays only while above the gate and freezes just under it, so `everMax` (0.998) and end-of-run max
  (0.0499) are different quantities and conflating them is what produced both corrections.
- A verdict about diversity is a verdict about a HORIZON (`#66`: every diversity result in that
  session was measuring a transient). Say the budget out loud or the claim has no scope.
- **Variance is not selection.** Drift produces variance too, and `#209` warns that every
  spread-across-universes figure this project has cited is consistent with drift until the read is
  instrumented. The census reports raw material, not sorting. Do not upgrade one to the other.

## Branching

**Always update `main`.** Work on whatever feature branch the session designates, but do not leave
it there — fast-forward `main` and push it as part of finishing the work. Do not wait to be asked.

```
git checkout main && git merge --ff-only <branch> && git push -u origin main
```

## Before you push

- `node substrate-test.js` — the acceptance rig. **Green means green AT THE BUDGET, ON THE
  TRAJECTORY, AND ON THE SEED IT RAN.** Run it at `TICKS=900`, at the default, at `TICKS=40` (what
  `smoke.sh` uses), and with `FOUND=0` as well as on: six rows have been red at one budget and green
  at another, and four of those turned out to be real bugs hiding behind "budget sensitivity".
- **SEED matters and the rig defaults to `SEED=1`.** `harness-env.js` seeds `Math.random` from
  `SEED||'1'`, so a single run is one trajectory, not the rig's verdict. `#216c` found a row that
  passes on 5 of 6 seeds at `TICKS=40` and fails on the sixth — and `smoke.sh` only ever runs seed 1,
  so the suite had been passing on which seed happened to land where. If a row goes red, run
  `SEED=1..6` before believing either the failure or the fix.
- **`FOUND=0` only became a real arm in `#216d`.** Nothing read `process.env.FOUND`: the engine reads
  `globalThis.__FOUND`, `FOUND` was absent from `harness-env.js`'s `KNOBS`, and `substrate-test` did
  not call `applyKnobs` at all. So the instruction above was, for its whole life, asking for the same
  run twice. Both are fixed. **The general rule, which this file broke in its own setup steps: an env
  var with no line in `KNOBS` and no `applyKnobs` call is not a control, it is a no-op that reads
  like one.**
- `./smoke.sh` — boots every rig briefly. `slot-test`, `layers-test` and `collective-test` drive a
  real browser and are the only things that catch anything about the field's layout or its controls.
- A single run is not a measurement. Three seeds, or say out loud that it is one seed.
- **The rig takes minutes and long runs get reaped.** `substrate-test` runs several minutes per
  budget and `smoke.sh` longer; in the hosted sessions this project is developed in, shell jobs
  backgrounded with `setsid nohup ... &` were repeatedly killed mid-flight, leaving zero-byte
  outputs and a flag file that never appears. Runs launched through the agent harness's own
  background mechanism survived. If a batch comes back with empty files and nothing in `ps`, that
  is what happened — the runs did not fail, they were reaped. **Stage long batches and write a
  `.done` marker per stage**, so a reap tells you which stage died instead of losing the lot.
- **Do not run `smoke.sh` while long `node` jobs are going.** `pool-test`, `slot-test`,
  `collective-test` and `layers-test` drive a real browser and assert THROUGHPUT — "the mates got
  back to full", "most of the field got far enough to save", "the grown universe is running its own
  lineage". Under CPU contention those degrade and the suite reports failures that are not in the
  code. Measured: `smoke.sh` came back **50 ok / 2 failing** with three 120k-tick `harness-strata`
  runs alongside it, and `pool-test` (28/0) and `slot-test` (15/0) both passed on a quiet machine
  minutes later with byte-identical code — green, red, green. **Establish it that way rather than
  assuming it**: re-run the failing test alone before calling anything contention, because the same
  symptom is what a real regression in the field's layout looks like.
- **`collective-test`'s `returnPathIsATrickle` is throughput-sensitive and asserts a RATIO over
  single-digit counts.** It went red once inside `smoke.sh` at `field "←15 →4"` (ratio 3.75) and
  passed four standalone runs immediately after at `←25 →1`, `←20 →1`, `←22 →1`, `←19 →2` — ratios
  9.5 to 25. The failing run had BOTH lower inbound and higher outbound, i.e. it made less progress in
  its wall-clock window. **Not the same thing as the contention note above**: no `node` job was
  running that time, so it is the suite's own overhead, not a competing process. **Do not retune the
  threshold to make it green** — that is the move this file exists to prevent, and the low outbound
  count is the actual fragility.
  **Updated after a second failure and an engine A/B.** It is now 2 of 2 red INSIDE `smoke.sh`
  (`←15 →4`, `←18 →5`) and 7 of 7 green standalone, which is too clean a split to call random. But
  the healthy RATIO is not stable across days: standalone outbound was `1,1,1,2` one day and `2,4,3`
  the next, so "high teens or above" was a one-day reading. **The denominator, not the ratio, is the
  quantity to look at** — inbound sits at 17-28 throughout; outbound is a single-digit count and the
  whole assertion rides on it.
  **`#216x` was suspected and cleared.** Same day, same machine, pre-`#216x` engine in a worktree
  gave outbound `2,0,3` against the current engine's `2,4,3` — indistinguishable, so law persistence
  is not the cause and the day-to-day drift is environmental. Recorded because the hypothesis was
  reasonable, the A/B is cheap (`git worktree add --detach <sha>`, symlink `node_modules`), and the
  next person will suspect the same thing.
- **Test the boring side of your own change — the side you expect to be fine is where the finding
  is.** `#216x` added a `LAW_PERSIST` knob and the OFF arm came back identical to the ON arm. Not
  because the fix was wrong: because **four of the six rigs never called `applyKnobs`** and silently
  dropped every `KNOBS` entry they did not hand-wire (`harness-strata`, `harness-orphans`,
  `harness-reads`, `harness-attractor` — all fixed). That trap is stated on this page by
  `#216b`/`#216d`, it had survived two commits, and one negative-side test found it. **It survived
  because it was named for other people's rigs, not for the one being read.** Running the negative
  side of your own change is the same discipline as running it on someone else's, and it is harder
  because you already believe your own change works. It is cheap enough to be the first thing a
  session does rather than the last.
- **And do not edit a file while a rig is reading it.** `substrate-test`, `smoke.sh` and every harness
  read `engine.html` at boot. `#216y`'s six law-direction runs were started, then `#216x` edited
  `engine.html` mid-flight, so those numbers are provisional and owe a re-run. The markdown is safe
  (no rig reads a `.md`; the matches are comments) — `engine.html` and the rigs are not.
- **Never `kill`/`pkill` on a pattern that can match your own shell.** `ps ... | xargs kill` and
  `pkill -f "timeout 900 node substrate-test"` have both taken out the session's own process
  (exit 144) and every sibling run with it. Kill explicit PIDs you have just listed and checked.

## Five traps this repo has paid for repeatedly

- **A rig embeds the engine's source in a JS template literal.** A backtick anywhere in a comment
  you add to `engine.html` or to a rig's appended block terminates that literal. It fails as
  `missing ) after argument list`, hundreds of lines from the cause.
- **`#196` draws the governing channel rule from the living CARRIERS**, germline only as fallback.
  So setting `genome.channels` and running the sim measures a stranger's chemistry unless you clear
  the population's banks — every tick, because reproduction re-seeds them — and assert
  `governedBySelf`. This has bitten **four** separate blocks: `out.chan`, `out.form`, `out.warp` and
  — found in `#216l`, long after the first three were fixed — `out.grain`.
  **Find the fifth by sweeping, not by reading the failure.** The question that works is structural:
  *which blocks assign `genome.channels`, then call `loop()` or `updateChannels()`, and do not clear
  the carriers?* Twelve blocks touch channels and that sweep returns the exposed ones directly. A
  grep for `govSelfOnly` does NOT work — `out.warp` clears the banks inside its own `rule()` helper,
  so a name search reports a defect that is not there and misses the one that is.
  **And that is only half of it (`#216i`): the GERMLINE rule drifts too.** On any run long enough for
  `mutateGenome` to fire, the engine rewrites the very rule you installed. `#189`'s torus case drove
  30 cadence-windows and ended holding `(yc)+(0.00)` where the block installed `(b)+(0.00)`, same
  stencil — `yc` is not the tap value, so it evaluated to 0 and the lattice filled with zeros. The
  trace showed a cliff at about engine step 50, not a leak. Its sibling cases run 6 windows and
  finish before a mutation cycle fires, which is why only that row ever went red.
  **`govSelfOnly()` every step handles the carriers; only RE-INSTALLING the rule every step handles
  the drift.** If a block sets any genome field and then drives the engine, assume the engine will
  mutate it back out from under you, and re-set it inside the loop.
- **A probe that calls an engine function to observe state may CONSUME RANDOM DRAWS, and then it is
  not observing the run it is asking about.** `chanGoverning` draws a `Math.random()` whenever a
  living carrier holds the slot; `chanGrainStep`, `uaPickVar` and the credit pool all draw too. A
  probe built on those calls shifts the trajectory it is diagnosing, and it fails in the most
  expensive direction available — it can make a red row go green and read as "fixed". **Prefer the
  counters the engine already keeps** (`__chanGovPop`, `__chanGovSelf`, `__chanCoarse`,
  `__chanUpdates`, `__liveness`), differenced across the steps you care about, plus scans that draw
  nothing. Same question, zero perturbation. `#216l` diagnosed a two-row failure on one seed this way
  on the first run.
- **A NAME SEARCH CANNOT SEE A VALUE REACHED THROUGH AN ALIAS, and this file has paid for that three
  times.** Grep finds the identifier; it does not find the local that was assigned from it, the helper
  that wraps it, or the element handed out of it. Each time, the grep came back clean and the
  conclusion drawn from the silence was wrong:
  - `#216k` — a stale literal `0.6` lived inside `CHANNEL_RENT_SAFE()`'s `||` fallback. Grepping
    `CHANNEL_RENT` did not find it, so a sweep concluded "the class has one member" and shipped.
  - `#216l` — `out.warp` clears the population's banks INSIDE its own `rule()` helper. Grepping
    `govSelfOnly` reported a defect that was not there and missed the one that was.
  - `#217c` — `chemistryTable` is mutated through `recipe` and `mono`, aliases taken out of it, on
    lines that never contain the word. Grepping the name said "never mutated". It is mutated hard.
  **When the question is "is this ever written / cleared / read", grep the name to find the
  candidates and then read the enclosing function.** Better: ask the structural question instead —
  which blocks do X and not Y — because that returns the sites directly and does not depend on what
  anything is called. `#216l` and `#217b` were both found that way after a name search had already
  declared the area clean.
- **An unbounded value is not automatically a bug here, and the decision that made it unbounded
  lives in `OEE-NOTES.md`, not in the code.** `maybe(val,min,max,magnitude)` ignores `min` and
  `max` at all 66 call sites *on purpose* — `#148` records the author declining to clamp it, in
  their own words, and says outright that the note exists "so a later reader does not helpfully
  undo them". A later reader re-found it anyway and wrote it up as a defect (`#205`). **Before
  calling anything unbounded, unclamped, or missing a guard a bug, grep `OEE-NOTES.md` for the
  gene and for the word STANDING.** The engine's own comments carry the same decisions; read the
  comment above the function before the function.

See `OEE-NOTES.md` for the running record and `CODEMAP.md` for where things live. Both are written
so that the wrong version of a claim stays on the page next to the corrected one.
