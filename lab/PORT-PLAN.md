# Port plan: bringing #334-#348 into the artwork (`engine.html`)

Written 25 Oct 2026 at the end of a long lab session. **The user has given full licence to change the engine for the artwork's sake, saved universes included** (their words: "if a saved universe collides with that advancement then it becomes a blocker"). So this plan does not need anyone's sign-off. It needs the project's own discipline: pre-register, fresh seeds, the acceptance rig.

## What the lab established (lean core, `lab/oee-core-tasks.js`; details in OEE-NOTES #334-#348)

1. **Reading neighbours' outputs works.**
   - What it is: paid logic tasks on world-wide inputs, where an organism can read the word its neighbour last published.
   - Effect: the world sustains functions 2-3 NAND gates harder than the same world without reading.
   - Evidence: replicated on 9 fresh seeds, at 3 and 4 inputs, under a bit-exact "clean words only" payment rule (#337, #339, #340).
2. **Scarcity of easy food is what makes composition pay** (#346, #347).
   - What it is: per-function pools that regrow slowly (TASK_RATE 0.02, against 0.2).
   - Effect, on 3 of 3 seeds: +0.8-1.0 gates of mean circuit size, x2-3.4 effective functions, and two-neighbour composition up to 60% of income.
   - The cause is differential depletion, not less energy. #347 matched total income with fast refill and smaller pools, and that arm got nothing.
3. **Three mechanical leaks were real, but fixing them alone did nothing while food was abundant.** They were the TURN cost (#341), one payment per life (#344) and READ overwriting R0 (#345). Under scarcity, READ_REG (READ choosing its destination register) carried 92-99% of the two-wire income.
4. **Trophic pool-drain is part of the recipe (#348: RATCHET by the rule, HARDER, BROADER).** Each paid output takes 0.5 x pay out of the pools of the clean read functions that fed it, and the tax is destroyed. In the second half the drained worlds' breadth kept rising on 2 of 3 seeds, and their late novelty (functions first reaching 100 income in the last quarter) was x1.1, x9.5 and x37 the undrained worlds'. The trend margins are thin and the horizon is one run. Port it with items 5 below, and test it in the engine as its own arm.
5. **Measurement lessons, which apply to the engine too.**
   - Never rule on "share of income at least 1%": it hid over 99% of what the scarce worlds did.
   - Use the full-vector effective number exp(H), the income-weighted mean circuit size, and the cycle-proof climbing depth.
   - Grade outputs bit-exactly against what was actually computed. The crude per-register clean rule produced a false null (#338).

## What has to be built in the engine (none of it exists there)

The engine has no paid-logic layer. Its economy is light, chemistry, eight field channels and several replicator levels (CODEMAP.md). The port is a new layer:

1. **World inputs.** Four 32-bit words redrawn every epoch (50 ticks). Each 16-bit half is a whole truth table in its own row order: `drawInputs` with NIN 4.
2. **Function grading.** `fn4` (a word to its 16-bit truth table, or -1 if the rows disagree), the exact tables `lab/nand4-sz.bin` and `lab/nand4-csz.bin`, and their loader `lab/core-tasks4.js`.
3. **Ops in the particle VM:** INPUT, NAND, OUTPUT, and READ_OTHER with READ_DIR and READ_REG.
   - The engine's VM has 427 opcodes in four drifted dispatch copies (CLAUDE.md, "Every session removes or proves something"). Add the ops at ONE dispatch site, and assert the count of sites patched.
4. **The clean-word rule, bit-exact.** Junk and input-dependence masks per register, NAND's controlling 0, and staleness at the epoch boundary (#339). Port it exactly; the per-register version is wrong.
5. **Per-function pools, with the drain.** Add TASK_TROPH 0.5: per register, the keys of the clean read functions (data flow, at most 4, cleared each epoch); on payment, take alpha x pay / m from each of their pools, destroyed.
   **The pools themselves:**
   - Cap = TASK_CAP x formula size; slow regrowth (0.02); payment = TASK_F x level, into the particle's energy.
   - One payment per organism per epoch (TASK_EPAY).
   - Refuse copies and complements of the last 4 reads (REFUSE_NOT).
6. **Logging.** Every sample carries exp(H) over all functions, and every function with income of 10 or more (LOGFULL), so `lab/analyse-*.js` can be pointed at engine runs.

## How to test it in the artwork
- **Pre-register first** (CLAUDE.md template).
  - Arms: the new layer ON against OFF in the engine's normal world.
  - Fresh seeds, at least 3.
  - Ruling measures: the threshold-free ones (mean circuit, exp(H), climb 2+). The engine's own dependent variables are reported beside them: entropyRatio's grid-free twin, spread_late, established fraction, and alive as a guard.
- **Run the acceptance rig after the change:** `substrate-test` at the four budgets, and `smoke.sh` in slices with nothing else running.
- **Expect the result NOT to carry over cleanly.** The engine's particles have many other income sources. If light and chemistry pay better than logic, the logic layer will be ignored, exactly as READ_REG was ignored while easy pools were full (#345). The engine's equivalent of "scarcity" may be the logic pools' share of total energy.

## Order
1. Build items 1-3 (inputs, grading, ops) and check that a hand-built particle is paid for NAND(x1,x2).
3. Then items 4-6.
4. Then pre-register and run.

## What the port REPLACES (added after the user asked "are there layers in it that shouldn't be?")
- **The engine's computation does not decide who lives.**
  - #303b, run on engine.html itself: blanking every particle's program to one inert instruction changed births, survival, lineages and diversity on only 1 of 5 counted seeds.
  - #333: a one-instruction "rock" lives as well as evolved programs, because passive light pays.
- **So the port is a REPLACEMENT of the income, not an added layer.** Passive light/chemistry becomes a small floor, enough for a newborn to survive. Most energy has to be earned by computing functions of the world inputs, from slowly regrowing per-function pools.
  - Added beside free sunlight, the logic layer will be ignored, as READ_REG was beside full easy pools (#345).
  - The lab only climbed once computation paid AND easy food was scarce (#346, #347).
- **Recorded cull candidates** (from the notes; each still needs its check before it is cut):
  - GROUP_COMMONS and GROUP_ROLES: live, but they never execute in lab worlds, because they sit inside cluster budding (#253).
  - The four drifted copies of the opcode dispatch: merge them into one (#217f).
  - 427 opcodes, with 9 carrying 90% of all instructions.
  - 76 separate adjustments to `amp`.
- **Order:**
  1. Make computation pay (the port).
  2. Re-run retire-or-prove on the big layers (mind, plasmids, cosmos, clusters, channels, laws) in THAT world.
  3. Cut what is decoration even then.

  Every earlier retire-or-prove verdict was measured in a world where nothing the programs do can be selected for. Cutting before step 1 judges layers where nothing they do can matter.
