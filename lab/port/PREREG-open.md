# PRE-REGISTRATION #438 — the world opens its own inputs (`TASK_OPEN`): the field test

Written and committed before any field ran under the rule as it now stands (the EVERY-input rule, the doubling window, indexed pay).
The one field pair seen (`out-open-design/a-*`) ran the first, too-easy rule and is not evidence for this one.

## What is already measured (node, design, seen)
- `TASK_OPEN=1 TASK_NMAX=5` is the shipped world byte for byte (`6a2b51ae`), and seed 11 is the shipped world until its sixth input opens.
- Three worlds (seeds 11-13, mind on, 16,000 ticks): all at eight inputs by 16,000, populations 600-1,500 (the shipped world's range),
  112-243 thousand functions (the shipped world on seed 11: 120 thousand), most late finds depending on all eight inputs.
- **Shuffle control, the same three seeds:** no world opened a sixth input; 751-965 functions. Opening is selected, 3 of 3.

## The question
Whether a FIELD of open universes is a field a viewer loses nothing by: it finds about as much, its universes do open inputs over
hours, and a reload brings each universe back where it was. The count is NOT expected to be higher and is not the claim. The claim
is that the space no longer has a ceiling set from outside (short of the machine's: ten inputs, a 1,024-bit word).

## Run
One long pair, `lab/port/long-pair.sh NAME=op1 ARM=open`, engine of commit 4ca30f1 against the same file with `__tk('__TASK_OPEN',0)`
changed to 1, six legs of 1,500 s (150 minutes), each leg reloading the field the last one left. The engine file is not edited
between legs. Decision pairs of #437 may run between legs (they run frozen copies).

## Rule (all four, or the default does not change)
1. **Count not worse:** the open field's distinct functions at 150 minutes are at least 0.90 of the shipped field's.
2. **It opens:** at the last sample at least half of the open field's universes hold seven or more inputs, and the functions that
   joined the union in the last leg depend, in the majority, on six or more inputs.
3. **Reload:** after every reload (legs 2-6) the open field's universes report an input count no lower than before the reload, in
   at least 29 of 31, and no universe boots from founders that the shipped field's twin does not also lose.
4. **It still ticks:** the open field ran at least 0.60 of the shipped field's ticks in the last leg.
- **All four hold: ship.** Under TASKS the default becomes `TASK_OPEN` 1 (`TASK_OPEN=0` restores today's world byte for byte), after
  `substrate-test` at four budgets and `smoke.sh`. Then three 25-minute pairs as a guard on the early field (reported).
- **1 or 4 fails:** the knob stays off; what failed is named and worked on. **2 fails:** the opening rule is reworked, not shipped.
  **3 fails:** the save is fixed and the leg rerun.
- One long pair cannot carry a claim about the long horizon (#434). It is used here as a guard on shipping a change whose effect
  is established elsewhere (the node worlds and their control), not as the evidence for it.

## Prediction (mine)
Count ratio 0.9-1.2; median universe at seven inputs by 150 minutes; the open field 0.7-0.9 of the ticks.

## Saved worlds (rule 6)
A saved universe reloads as an open universe at five inputs with its creatures, ground and record. Its old ground (32-bit tables) is
not read by the open world and starts empty. Said here; it does not block.
