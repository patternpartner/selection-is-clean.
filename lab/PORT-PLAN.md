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
4. **The plateau is not yet broken.** Even scarce worlds settle; breadth swings widely and may decline late. #348 (trophic pool-drain) tests whether taxing the read words' pools turns the wider fence into a ratchet. **Read #348's verdict before porting the drain.**
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
5. **Per-function pools.**
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
1. Read #348's verdict.
2. Build items 1-3 (inputs, grading, ops) and check that a hand-built particle is paid for NAND(x1,x2).
3. Then items 4-6.
4. Then pre-register and run.
