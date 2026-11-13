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
  **The ladder is: DECLARED -> CARRIED -> EXECUTED -> READING THE GENE -> VARYING -> SELECTED.**
  `#209`/`#210` sit at rung two, `harness-variance` at rung five.
  **Rung four was added by `#217n` and nothing on this page could see it.** `uaProdW()` executed on
  every grammar production for the project's whole life and returned `[1,1,1,1,1]` from its own
  fallback, because `sanitizeGenome` guards the field with `if(genome.uaProdW!==undefined)` — it
  declines to create what it finds missing — and nothing declared it. So `#180`'s five heritable
  production weights, and `uaVarW`'s per-leaf sense weights, were CONSTANTS in every universe ever
  run. Fully live, liveness-clean, gene absent: **a fallback answers in the gene's place and every
  rung above EXECUTED reads normal.** Ask it structurally: *which functions return a literal fallback
  when a genome field fails a type check?* `#216k`'s stale `0.6` inside `CHANNEL_RENT_SAFE()`'s `||`
  is the same shape, so that is twice this repo has paid for it. Before reporting any of the upper rungs for a mechanism,
  establish that the thing ever ran once — and prefer a state every code path must write through
  (here `cellProgStr`) over any one path, because INSCRIBE has FOUR real `case 20:` bodies plus a
  profiler stub. **"Undercounts fourfold" understates it (`#217f`): the four bodies are four
  DIFFERENT mechanisms** — strengths `*0.3`, `*0.2`, `*0.4`, `*0.15` and thresholds `*0.8`, `*0.8`,
  `*0.7`, `*0.8`, two of them naming the local `wStr20` and two `writeStr20`. Against the 0.05 gate
  that is a solo-VM write needing `|vmRegs[si]*k| >= 0.33` to cross where a cluster-VM write needs
  0.125. So **assert the count whenever you patch N sites**: `#217f`'s first patch was written
  against a shared pattern that does not exist, matched 1 of 4, and only its own `assert total==4`
  stopped it shipping a knob that gated one path while three kept writing — a control that reads
  like a control.
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
  **At the TASKS rung there is now a control that separates them (`#376`):** `TASK_SHUFFLE=1` feeds every payment to a random
  living creature instead of the one that computed. Same pools, totals and draws per payment. Shuffled worlds found 57-138 new
  functions in 12,000 ticks against 845-8,766 paid: selected, 3 of 3. Any new claim about where novelty comes from at this rung
  should be checked against that control, not only against a null band of the same world.
  **The computing world has TWO currencies, and only one of them is computing (`#377`).** Computing pays the store `pE`, which
  pays for births (that is what `#376` showed is selected). A creature DIES on amplitude, and amplitude is fed mostly by AIM's
  aim pull: the founder's aim is on amplitude itself and pays about 0.17 a tick, against a death threshold of 0.04. Aims drift to
  the senses that pay whatever a creature does (age, amplitude, resource). `AIM=0` cuts novelty about tenfold; `AIM_FLAT=1` (everyone
  gets the mean aim payment) loses nothing measurable. So AIM works as FOOD here, not as selection on purposes (2 seeds counted of
  3, not ruled). Without the LIVE stack at all (`LIVE_STACK=0`) the computing world dies by tick 500.
  **CORRECTED by `#381`: what the stipend pays for is mostly BIRTHS.** Amplitude above `AMP_SOFT` is banked as provision, and a
  birth costs 1 provision as well as 0.25 of store (`PROV_BIRTH`, #221). That gate binds: tens of thousands of births a window
  pass the store and are refused "unprovisioned". `STORE_DEATH=1` (amplitude no longer kills) does not rescue an AIM-less world.
  **`#381`: ONE CURRENCY won its per-tick test, and its ship is HELD.** `PROV_BIRTH=0 STORE_DEATH=1 AIM=0` makes the store pay
  for life and births. 20 unseen pairs: about twice the new functions per 12,000 ticks (p 0.0004, 16 of 20), and selected
  (`TASK_SHUFFLE` found 10-150x fewer). But the world sits near the population cap. A tick costs 1.6-2.5x more, so it is about
  even per CPU-hour. In a field `slot-test` saw 2 of 9 universes save in 450 s, where today's world gets most of them there in 150.
  **Per tick is not per hour, and a field runs in real time:** judge a change to population size on new functions per CPU-hour,
  and check it in a field. The knobs and `visAmp()` (the display reads the store under `STORE_DEATH`) are in; the default is not.
  **`#382`: held to a size, it wins per CPU-hour too, and is held AGAIN at the field.** `REPL_CROWD_K=450` (a birth costs
  `BIRTH_ENERGY_COST x living/K`; a fixed dearer birth is bistable, it fills the array or dies) gives 1.62x new functions per
  CPU-hour (p 0.0024), 2.39x per tick, collapses 1 against 6, selected. But it grows to about a thousand at once, so a field's first
  minutes are slower: `slot-test` failed in 150 s (0 of 9 saved) and passed 15/0 in 450. **The next gate is a field rig that counts
  new functions per real hour across a running field**, the number a viewer gets.
  **`#383`: judged on that number, it SHIPPED.** `lab/port/field-rate.js` runs a real browser field and counts the distinct
  functions ever paid anywhere in it (the union of every universe's `tSeen`, via `__field.seenForTest()`). In 8 of 8 paired
  fields one currency held to a size found more by 30 minutes: median 1.80x, p 0.0039, and 3.5x at 5 minutes. The lead shrinks
  with time, and nothing past 30 minutes was measured. So wherever TASKS runs, the default is now `PROV_BIRTH 0, STORE_DEATH 1,
  AIM 0, REPL_CROWD_K 450`; `PROV_BIRTH=1 STORE_DEATH=0 AIM=1 REPL_CROWD_K=0` restores the old world byte for byte. The ship's
  cost was saving, because a slower-ticking world reached the tick-1,800 autosave late. **`#384` saves on the clock too**
  (`SAVE_WALL_MS`, 2 minutes in a browser, off in node). It writes only what the autosave writes: no archive entry, no trim.
  `SAVE_WALL_MS=50` under node is byte-identical to 0; that is its test.
  **`#392`: FIVE-INPUT FUNCTIONS SHIPPED (`TASK_IN 5`, a space of 2^32).** `#388` found the four-input space's easy shells mined
  out (all of size <=4, most of 5-8) while 99% of what was left sat at size 9+, so a world's finds halved with each size step.
  Four prices (`#389`-`#391`: program cap, logic-op draw, drain, a royalty) could not move it. Five inputs did: 3.56x new
  functions per CPU-hour (19 of 20 unseen pairs, p < 0.0001), more found late than early (median 1.37 against 0.55), the
  shuffle control 9-78x fewer (selected), and 5.28x the distinct functions in a running field by 30 minutes (8 of 8). A
  function is its canonical 32-bit truth table in a slot of a 131,072-slot table (taken on first PAYMENT). Pools unpaid for
  1,000 ticks are dropped above 85% fill, and the lifetime record is a separate growable set. The grade is exact for
  functions of <=4 inputs and an upper bound for five. **Part of a count gain in a bigger space is mechanical**: more
  functions at every depth. Read the deceleration and shuffle numbers beside any count. `TASK_IN=4` restores the old world.
  **Novelty here is cumulative across creatures (`#391`):** 91-97% of new functions are built on words read off neighbours.
  **A field rig must read every universe AT ONCE (`#383`'s amendment).** Asked one at a time, a busy field took six minutes for
  one sample.
  **Preventing collapse is not the same as finding more (`#379`, `#380`).** A third of default computing worlds collapse by 12,000
  ticks, most of them predator outbreaks that drain the stores which pay for births. Both prey refuges (`REPL_REFUGE=1` fixed, `=2`
  adaptive) stopped that: 11 of 11 one-sided collapses were the default world. Neither found more new functions at 12,000 ticks
  (p 0.052 and 0.43). The fixed one cost a third of the novelty in worlds with no outbreak. Collapsed worlds regrow and keep finding.
  The open question is the long horizon (`#370`'s worlds that never came back), not a sharper rule at 12,000.
  **`#394`: three nulls, nothing shipped.** The crowd price has no direction at five inputs (K=450 best on 2 of 3 seen seeds).
  Picking the germline's source by the store instead of by amplitude made no difference to what a harvest finds (11 unseen
  seeds, p 0.26) after a 3-of-3 design reading: **three seen seeds agreeing is not a direction here**, a harvest's value swings
  sevenfold on which one creature is copied. Neither pick finds a computer: each had never been paid on 3 of 11 seeds. Still
  open: a pick by payments, the adoption splice that inserts old task ops into the adopted program, and founding priced in amplitude.
  **`#395`: the same world 16% cheaper a tick** (the VM's register clamp writes only where it changes a value; instructions are
  read by index). Byte-identical on five worlds. **In node only (`#395b`):** in four pairs of browser fields the faster engine ran
  FEWER ticks in 4 of 4 while holding more creatures in 4 of 4, with about the same ticks-times-creatures. A node speed-up is not a
  field speed-up, and one pair of unseeded fields (`#386`'s 12.5%) cannot carry a speed claim. A browser rig that boots one
  universe from a saved population is the missing instrument.
  **`#396`: A FIELD UNIVERSE'S WORLD WAS ITS CELL, and that is SHIPPED away.** The engine's world is its canvas: 1280x720 in
  node, 137x304 in a field cell on a phone, so a viewer's universes were twenty times denser than any node experiment and their
  tick was three-quarters pair loops (119 ms against 35). The field now gives every universe 920 thousand square pixels drawn
  scaled into its cell (`#world=0` restores 1:1): 1.71x the distinct functions by 25 minutes (8 of 8 pairs, p 0.0039), behind
  at 5 minutes (0.84), ahead from 10. The look changes (small sparse creatures, not a saturated blob). **Before trusting a node
  result in a field, check the two run the same world**: `lab/port/field-phase.js` reads each universe's world size, tick cost and
  where the tick goes (`phaseForTest`). Not measured: a desktop-sized field, anything past 25 minutes, the shuffle control in a field.
  **`#397`: THE GROUND REMEMBERS, SHIPPED (`TASK_GROUND`).** A paid function is written into the field cell its computer stands
  in and stays across epochs and deaths; a READ that finds no live neighbour reads the ground. A field finds 1.86x the distinct
  functions by 25 minutes (8 of 8 pairs, p 0.0039), with no early cost, on fewer ticks, and selected: with payments shuffled the
  field found 0.086 of its twin. `TASK_GROUND=0` restores the world before. Two variants that SELECTED what stays (the deepest;
  only what was built upon) did no better than plain overwriting and were removed, so the evidence is "something stays", not
  "the right thing stays". It came from asking what the PROCESS that builds this engine has that the engine lacks: a record that
  outlives its writers. The ground is not saved with the population yet.
  **`#398`: it IS memory.** Against a control whose ground forgets at every epoch boundary (`TASK_GROUND=2`), the remembering
  ground was ahead in 6 of 6 fields at 25 minutes (median 1.24, p 0.016). The forgetting ground is level or ahead for the first
  ten minutes and the remembering one gains on it all the way, so persistence is the part of the gain that grows. Roughly:
  no ground 56k, forgetting 75k, remembering 93k (medians, not run together).
  **`#399`: the ground is saved with the population** (`world.ground` in the snapshot) and restored on reload. A running world is
  byte-identical. And a correction to `#396`: reloaded creatures are NOT left in a corner of a larger world, `decodePopulation`
  rescales positions by the saved width and height. **Read the decoder before saying what a reload does.**
  **`#400`: a royalty in a field: no.** `#391`'s royalty (a share of each payment to the living publishers of the words it was
  built on), reopened where it can be seen: 0.85 of the shipped field at 25% and 0.86 at 50%, behind at every five-minute mark.
  Removed again. `lab/port/field-pair.sh` runs one such design pair (the engine against a copy with one default changed).
  **`#401`: the ground is drawn**, by the depth of what each cell holds (`GROUND_GLOWP`, 100; 0 hides it). Colouring each cell
  by its function was tried first and averaged to a grey haze. It is faint: visible where a universe has thinned.
  **`#402`: A SECOND RULER, the depth of what is new.** `field-rate.js` reports `D` with each sample: the formula sizes (the
  engine's grade, `lab/port/sz5.js`, 0 mismatches against the engine on 6,500 functions) of the functions that joined the union.
  A count cannot tell more-of-the-same from building deeper. `lab/port/analyse-depth.js` reads it.
  **`#404`: TWO AND A HALF HOURS OF ONE FIELD, the first measurement past 30 minutes.** `field-rate.js` chains launches
  (`PROFILE`, `PORT`, `CHAIN`; `lab/port/long-field.sh` is one leg, and every leg reloads the field the last one left). One field
  alone on the machine found 1,456,777 distinct functions in 150 minutes; the rate never fell (38-60 thousand every five minutes,
  the last block the highest) and the mean depth of what was new rose from 11.0 to 17.75. **A flat leg is not a ceiling**: I
  called one after leg 5 (16.9 to 17.0) and leg 6 went to 17.75. Caveats that travel with the number: one field; 96% of what it
  found depends on all five inputs, where the grade is an UPPER BOUND; the grade and the pools are mine.
  **A field alone on the machine is not a field in a pair.** Alone, a field ran 57,864 ticks in 25 minutes and found 203k; beside
  a twin, about 35,000 ticks and 80-110k. Compare fields only within the same arrangement.
  **`#405`: the depth bound is about 1.7 too high and nearly flat in depth**, checked one level down where the exact size is known
  (all 65,534 four-input functions graded by the same split recipe). No sign that a rising bound is the bound loosening.
  **`#406`: THE GROUND OVER 150 MINUTES, side by side (`lab/port/long-pair.sh`).** With the ground a field holds 77-88 thousand new
  functions a leg; without it the rate falls by a third after the first leg and then HOLDS at about half (39-44 thousand, creeping
  up). Cumulative 1.79x; functions of size 17+ 2.24x. So the ground is a steady doubling, not a widening gap, and a field without
  it runs at half speed, it does not stop. One pair.
  **`#414`: the snapshot is stored by the WORKER**, not the page. The user's field froze overnight with its universes still
  ticking; `#413`'s probe (`field-rate.js JANK=1`) found every autosave putting a multi-megabyte string through the page's main
  thread. Now the worker gzips and stores it: 131 s of long tasks in 25 minutes became none. Renderer memory still crept about
  400 MB in 80 minutes (`#413`), unexplained, and no run has been a night.
  **`#416`: A DEARER BIRTH, SHIPPED (`REPL_CROWD_K` 100, was 450).** In eight pairs of fields K=100 found more distinct
  functions by 25 minutes in 7 of 8 (median 1.26x, p 0.0078) and more of size 17+ in 7 of 8 (1.76x): half the creatures, 2.6x the
  ticks. **It is BEHIND for the first fifteen minutes** (0.84 at 5): a short look at a field now shows less. Design readings
  overstated it (2.1x arms, 1.68x one pair). `REPL_CROWD_K=450` restores the world before. Not measured: K below 100.
  **`#419`: over 150 minutes the lead GROWS** (one pair, chained legs): 0.91 in the first leg, 2.42 in the sixth, 1.50x in all
  (650,955 against 433,201), 3.6x the size 17+ in the last leg. Per creature-tick the two worlds find about the same; the sparse
  one runs 2.8x the creature-ticks, because a creature's tick costs more where it has more neighbours. **Density is the lever.**
  **A reload can lose a universe's population (3 of 155 in `#406`'s ground field).** `universe.html` races the IndexedDB read
  against 4 seconds and boots from founders if it is late; a fingerprint mismatch would look the same. Not diagnosed.
  **Diagnosed and fixed by `#418`: it was the fingerprint, and `#414` had made it common.** The genome reached the shell before
  its snapshot (the population is encoded in between), the shell's 250 ms wait ran out, and a reload refused the snapshot: 23 and
  30 of 31 universes in two fields. The worker now holds the genome until its snapshot is on its way. **`lab/port/field-fpcheck.js`
  reads a saved field and says how many universes a reload would restore**; read that, not the order of writes, which passed the bug.
  **A NODE WORLD'S COUNT IS MOSTLY DRAW ORDER (`#397`).** Four continuations of one world state found 517-1,052 new functions over
  the next 2,000 ticks; the same seed under another draw order found 3.5x less by tick 4,000. A two- or three-seed design sweep in
  node cannot see an effect under severalfold, and every "design only, no direction" entry (`#385`, `#389`-`#391`, `#394`'s crowd
  price) is weaker for it. **Design in a field**: it sums 31 universes and one engine's fields vary by about 15%, so ONE pair of
  fields showed what six node worlds could not. Decide there too; the two regimes match in area since `#396`.

## Every session removes or proves something — not only adds

This project grew by accretion: 32k lines, ~270 genes, 427 opcodes (9 carry 90% of all instructions), the
opcode dispatch in four drifted copies, 76 separate adjustments to `amp` — on a core that, until `#220f`,
had no variation at birth and allotted reproduction by array order (`#219`). Each session added one careful
mechanism; no session's job was to ask whether the base worked. So:

- **A session that adds a mechanism must also remove, merge, or prove one.** "Prove" means a measured effect
  on who reproduces or on the dependent variable — not that it fires. Deleting what was measured and did not
  earn its place is progress (`#220e` removed three mechanisms built the same day).
- **If a mechanism does not change who has offspring, it is decoration**, however well it is written up.
  Check that before building on top of it (`harness-fecundity`, `harness-establish`).
- **Before calling anything dead, check it against the field, and read the encoder before reading a save**
  (`#229`: a saved list of mechanisms that NEVER fired was read as the ones that had).
- **The field is the experiment.** Harvests from long real runs are the best evidence this project has; they
  can be loaded back and restarted from the field's `load` / `new` buttons (`#230`).
- **Since `#368` a reload brings the POPULATION back, not just the germline** (IndexedDB beside each autosave, fingerprinted to
  the genome). Before it, every reload respawned every creature from one program, so any reading of a pre-`#368` field run
  is a reading of a world restarted at each tab kill. A harvest still carries genomes only, so a loaded harvest starts from
  founders. A history `boot` row's fourth field says how many creatures that boot restored.

### The retire-or-prove template — every KEEP / DELETE rule takes this shape

`#238` and `#241` each wrote their own rule on the same day and reached opposite verdicts on the same
evidence: two seeds where evolving chemistry looked better → DELETE (the floor wanted three); two seeds where
the peer bundle looked worse → KEEP (its rule counted any large change as "load-bearing"). Use this shape so
that cannot happen again. Pre-register it with the numbers filled in.

1. **Executed first.** A seed counts only if the mechanism ran on it by the horizon (`harness-opexec.js` or
   the engine's liveness counters). Report how many seeds counted before any other number. Identical arms on
   a counted seed are "ran, no effect".
2. **One floor, the same in both directions.** Fewer than N counted seeds (default 3) is **INCONCLUSIVE**:
   the default does not change either way. Extend the horizon or add unseen seeds; do not rule on it.
3. **A direction, not just a size.** On the counted seeds, compare the dependent variable: entropyRatio,
   kinds late, established fraction, with alive as a guard.
   **But entropyRatio and kinds are read on a grid with a CORNER AT THE ORIGIN (`#257c`)**: `tendBin` puts bin
   boundaries at 0 on every axis, the default world is a tiny clump sitting on the origin, and a clump there reads as
   8 kinds and ~3 bits whatever its real diversity. Any mechanism that moves the population toward or away from the
   origin moves those two numbers for that reason alone. Rule on their grid-free twins from `harness-oee` —
   `centredEntropyRatio` (same 0.05 margin) and `spread_late` (same 10%) — and report the old two beside them.
   **If a mechanism is WORSE on one measure and BETTER on another on two-thirds of seeds, it is SPLIT and the default
   does not move** — say so in the pre-registration, because `#257b` left it open and had to pick a clause.
   **Against a null band, never one control (`#249b`).** Run at least three null replicates per seed as well as
   the control — `harness-oee.js NULLSHIFT=k` is the same world under the same rules on a different draw order —
   and call a seed WORSE or BETTER only when the arm is outside EVERY null on that measure. `#249` compared each
   arm with one control and found three mechanisms BETTER; `#249b` put four nulls under the same question and
   found none. Twelve nulls ended with populations from 74 to 462 with no rule changed.
   - **WORSE** = on at least two-thirds of counted seeds, entropyRatio is lower by more than 0.05, kinds
     late is lower by more than 10%, establishment is lower by more than 25% relative, or the seed crashes
     (alive over 20 falls under 5) → **DELETE**, or **DORMANT** (default off, code kept) if a named follow-up
     is planned.
   - **Not WORSE, and the arms differ on the counted seeds** → **KEEP**. It changes the world and does no
     measured harm. Call it BETTER only if the same thresholds hold the other way on two-thirds of the
     counted seeds, and claim it only at the rung measured.
   - **Arms identical on every counted seed** ("ran, no effect") → decoration → DELETE, unless the note
     names something else that depends on it.
   - "It moved the numbers" is never on its own a reason to keep. Moving them the wrong way is a reason to
     delete.
4. **Unseen seeds decide.** Seeds already looked at can design the rule; they do not decide it.
5. **Committed before the first decision run.** Changing the rule after seeing numbers is a new
   experiment, and is written up as one.
6. **Saved worlds do not block progress (the user, 25 Oct 2026).** A change that alters saved universes on reload (a clamp,
   a reseed) says so in the pre-registration and ships. It does NOT wait for the user: they have said there is no sacred
   saved universe, that a save colliding with an advance "becomes a blocker", and that sessions have full licence to change
   the engine. They also do not take part in decisions - replies in a session may come from another AI they relay, so a
   reply is not the user's sign-off. Decide, explain, keep it reversible, and test it with the rigs. The plan for bringing
   the lab's results into the engine is `lab/PORT-PLAN.md`.

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
- `./smoke.sh` — boots every rig briefly (`SLICE=k/n` runs one slice, so a full pass fits three 30-minute launches). `slot-test`, `layers-test` and `collective-test` drive a
  real browser and are the only things that catch anything about the field's layout or its controls.
  **`browser-test` and `collective-test` print SKIP and exit 0 when they cannot load playwright, and `smoke.sh` counts that as
  ok.** `#377`: after a container image update (chromium-1194 became 1243, and `playwright-core` left `NODE_PATH`), ten browser
  rigs failed and these two "passed" without running. All twelve now fall back to `require('playwright')` and to the
  `/opt/pw-browsers/chromium` symlink. If a smoke pass shows those two as ok, grep their output for SKIP before believing it.
- **`layers-test` has two timing rows that fail alone on `main` (`#395`).** "A dark universe ticks faster than a lit one" failed
  2 of 3 runs on the engine before `#395` and 2 of 5 after; "the second layer runs slower than the first" sits on its 1.4x line
  (45-50 ticks against 32-36). Run it alone three times and A/B against the previous engine before believing either colour.
- **A field launch of 1,800 s does not fit the 30-minute job limit; 1,500 s does (`#396`).** One pair of fields per launch.
- A single run is not a measurement. Three seeds, or say out loud that it is one seed.
- **The rig takes minutes and long runs get reaped.** `substrate-test` runs several minutes per
  budget and `smoke.sh` longer; in the hosted sessions this project is developed in, shell jobs
  backgrounded with `setsid nohup ... &` were repeatedly killed mid-flight, leaving zero-byte
  outputs and a flag file that never appears. Runs launched through the agent harness's own
  background mechanism survived. If a batch comes back with empty files and nothing in `ps`, that
  is what happened — the runs did not fail, they were reaped. **Stage long batches and write a
  `.done` marker per stage**, so a reap tells you which stage died instead of losing the lot.
  **The harness's own background jobs have a limit too (`#265`, 30 Sep): stopped at ~30 minutes** on this box, where
  the day before a 90-minute batch ran through. Size a launch to finish inside it — a script that skips finished runs
  and takes `MAXNEW=` (start at most n new runs, then exit), relaunched on each completion — rather than one launch
  for the whole batch. A killed launch leaves zero-byte `.json` files beside no `.done`: delete them and relaunch.
  **And the container is RECLAIMED WHEN THE SESSION IS IDLE** (`uptime` reads 0 min when a scheduled check-in wakes
  it) — which is, most likely, the whole of the old `setsid` reaping above: a detached job does not keep the session
  alive, so when the turn ends and nothing harness-launched is running, the container goes and takes the job with it
  (30 Sep: two detached batches died this way, at 32 and 42 minutes). A harness background job does keep it alive,
  but only for ~30 minutes. **So: harness jobs under 30 minutes, chained — each completion wakes the session, which
  launches the next.** A single run must fit that window: a 40,000-tick world took over 30 minutes alone here (seed
  163), so it cannot run at all; a 20,000-tick one fits two at a time (node uses ~1.4 cores a process).
- **An engine process holds about a gigabyte.** Measured at `#254`: 1.0-1.4 GB resident per world at 10-15k ticks.
  On the 15 GB hosted box, twelve at once thrashed — load 20 on four cores, ticks four to five times slower, and
  nothing finished. Count processes before launching a batch; six to eight is the ceiling here.
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
  **Updated after a second failure and an engine A/B.** It is now 3 red INSIDE `smoke.sh`
  (`←15 →4`, `←18 →5`, `←11 →4` at `#249c`, and `←9 →4` at `#258b`; green inside it at `#251`, `#255c`, `#257c` and `#263b`) and 11 of 11 green standalone (`#258b`: `←19 →4`, `←23 →1` straight after the red), which is too clean a split to call random. But
  the healthy RATIO is not stable across days: standalone outbound was `1,1,1,2` one day and `2,4,3`
  the next, so "high teens or above" was a one-day reading. **The denominator, not the ratio, is the
  quantity to look at** — inbound sits at 17-28 throughout; outbound is a single-digit count and the
  whole assertion rides on it.
  **`#216x` was suspected and cleared.** Same day, same machine, pre-`#216x` engine in a worktree
  gave outbound `2,0,3` against the current engine's `2,4,3` — indistinguishable, so law persistence
  is not the cause and the day-to-day drift is environmental. Recorded because the hypothesis was
  reasonable, the A/B is cheap (`git worktree add --detach <sha>`, symlink `node_modules`), and the
  next person will suspect the same thing.
  **`#401`: the inbound count has dropped.** Alone it read `←15 →0` and `←8 →0`, and `←3 →1` in the failing run inside the suite,
  where this note says 17-28. The likely cause is `#396`'s larger world, which is slower in its first minutes; not A/B'd. The row
  now rides on a single-digit count on BOTH sides.
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

## Six traps this repo has paid for

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
  - `#258b` — `__SPEC.on` and `__ALLO.on` read `globalThis.__SPECIATE` / `__SPATIAL_TEND`, and their definitions
    default to OFF. Read, I called both off and credited a result to a branch that never ran. The LIVE table sets both
    globals to 1 before either is computed. **The reader of a global is not where its value is set** — for any switch,
    check the LIVE table. Caught only because the deletion was checked byte-identical against the measured arm.
  - `#377`, the other way round — **a switch named for one mechanism can carry another, and a LIVE flag can be ON without the
    LIVE table.** AIM's pull runs only inside the `OPCODE_NOVELTY` branch of `applyNicheEconomy`, so `OPCODE_NOVELTY=0` also
    switches AIM off; that is what kills the computing world, not the opcode bonus. And 17 LIVE flags (`COSMOS`, `DECIDE`, most
    atom flags) are resolved as `__X??1`, so skipping the LIVE block leaves them on. My add-back arms for cosmos and decide
    tested nothing for that reason. Before reading an ablation, list what the switch's branch contains and how every
    reader of the flag defaults.
  **When the question is "is this ever written / cleared / read", grep the name to find the
  candidates and then read the enclosing function.** Better: ask the structural question instead —
  which blocks do X and not Y — because that returns the sites directly and does not depend on what
  anything is called. `#216l` and `#217b` were both found that way after a name search had already
  declared the area clean.
- **PARTICLES CHANGE SLOTS EVERY 45 TICKS.** `compact()` moves every living particle down to the lowest free array slot,
  so anything a rig keeps per slot across ticks (a label, a history, a parent index) follows a DIFFERENT particle after
  the next compaction. `#256b` paid for it once: a probe read "32,000 in-life program changes" that were particles
  moving slots, and the first family-tree null scrambled every 45 ticks. Use `novelty-shadows.js`'s `COMPACT` hook
  and `compactArray`; the check that it works is that lineage ids never change during a particle's life.
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

## AI video, music and film (separate from the artwork)

All of it — how to run the tools in `video/`, the episodes, remixes, songs, drawn animation, and what the user liked —
is in **`VIDEO.md`**. Read that before touching `video/`. No rig reads any of it.
**Cost first:** generation runs bill the user's own Modal account. Give a rough cost estimate and wait for a yes before
any generation run; default to the 5B model and one take; prefer re-cutting cached clips (free) over regenerating.
