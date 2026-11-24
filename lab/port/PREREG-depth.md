# #465 — build depth of what is new (pre-registered; written while the base runs were at tick ~1,000)

**Question.** #461d: kinds cannot tell open-ended building from search in a huge space. Does the BUILD DEPTH of new functions
(`lab/port/probe-depth.js`: 0 if the paid word was built on nothing read, else 1 + the deepest function it was built on, fixed at first
payment) keep rising, and is that selected?

**Runs.** Shipped core world (`TASKS=1 MIND=20`, defaults), seeds 11, 12, 13, 12,000 ticks, a row every 1,000. Control: the same with
`TASK_SHUFFLE=1` (#376). Seen before writing this: the 1,000-tick rows of seeds 11 and 13 (mean new depth 0.85, 0.88) and seed 11 to
600 ticks (0.80-0.91). Three seeds, node: #397's draw-order caveat applies to counts; depth is a ratio within a run.

**Measure.** `meanNew` = mean depth of functions first paid in the window. EARLY = mean of the 3,000 and 4,000 rows; LATE = mean of the
11,000 and 12,000 rows.

**Rules (one floor, both directions).**
- **RISING** if LATE >= 1.25 x EARLY on all 3 seeds. **FLAT** if LATE within 0.8-1.25 x EARLY on at least 2 of 3. Otherwise MIXED
  (reported, nothing decided from it).
- **SELECTED** if the shuffle run's LATE is below the base run's LATE on 3 of 3 seeds AND its rise (LATE/EARLY) is smaller on 2 of 3.
  If the shuffle run rises as much, depth is a property of reading, not of selection, and must not be cited as evidence of selection.

**What each outcome decides.**
- RISING and SELECTED: cumulative building is the claim the artwork can make at this rung; `field-rate.js` gets the depth column so a
  field claim carries it; the next engine change is judged on depth as well as count.
- FLAT: the world builds at a fixed depth and the count is breadth. The next engine change is aimed at depth, with this measure as its
  dependent variable (the count as a guard).
- RISING but not SELECTED: depth is mechanical; it is reported, the count stays the variable.

## Result v1 (engine lineage), read by the rule above
Base FLAT (LATE/EARLY 0.94, 0.83, 1.25); shuffle LATE below base 3 of 3, rise smaller 2 of 3: SELECTED. `out-depth465/v1/`.
**But the measure is the engine's lineage, which passes only through PAID functions** (a read word carries the slot of its function,
and an unpaid word has none). 45-55% of new functions read as built on nothing, where #391 found 91-97% built on read words.

## #465b, registered before its runs: the SHADOW depth (`probe-depth.js` tMean)
A function's depth fixed at its first PUBLICATION (paid or not), 1 + the depth of the deepest function read into the register, through
neighbour and ground reads, NAND and COPY; a known function keeps its depth. Seen before writing: seed 11 to 600 ticks only (tMean 6.88,
7.98, 8.96). Same runs, same windows, same RISING / FLAT / SELECTED rules, applied to `tMean`. Decisions:
- shadow RISING and SELECTED: the world builds ever deeper on its own builds, and the engine's lineage (which the drain pays down) sees
  about a tenth of it. Next: whether the drain paying the true lineage changes anything (a design question, not decided here).
- shadow FLAT: both rulers agree, and the next engine change is aimed at depth.
