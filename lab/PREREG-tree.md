# Cheap two-neighbour reads: does gating two neighbours' words lift what a world holds? (#341; written and COMMITTED before the first decision run)

23 Oct 2026. Asked for by the user after #340. Code:
- core: `lab/oee-core-tasks.js` with `READ_DIR:1`. With READ_DIR unset, every earlier world is byte-identical (#340 and #337 checked, seed 5);
- batch: `lab/tasks5-batch.sh`;
- analysis: `lab/analyse-tree.js`;
- manipulation check: `lab/probe-twowire.js`.

## Why
**The user's identity.** For any program C(w, X) that reads ONE neighbour word w and combines it with the inputs, C(C(C(w,X),X),X) = C(w,X) on every row. Single-read composition therefore stalls 1-2 layers above the word read. #339's probe found that 42-91% of STRICT's clean income is single-read.

**Gating two different words** NAND(w1, w2) has no such ceiling. But today it needs READ, MOV, TURN, READ, NAND: the TURN earns nothing and also changes the heading.

**The change: READ_DIR=1.** READ_OTHER reads the neighbour at the organism's heading plus its operand (mod 8), instead of always the one ahead. Then READ d1, MOV r, READ d2, NAND r gates two neighbours with no TURN.

- **No new opcode.** An existing READ's operand, which nothing read before, now picks the direction.
- **Hand-built check:** READ 0, MOV 1, READ 4, NAND 1, OUTPUT, with the neighbours ahead and behind publishing NAND(x1,x2) and NAND(x3,x4), outputs NAND of the two (0xf888) and is paid.
- **Resume is exact.**

## Arms and runs
Both arms are #340's STRICT world: TASKS=1, TASK_RATE 0.2, TASK_SCALE 1, OTHERS=1, REFUSE_NOT=1, DEPTH=1, NIN=4, CLEAN=1.
- **TREE:** READ_DIR=1.
- **STRICT:** READ_DIR=0. This is #340's STRICT, on new seeds.

Seeds **7601, 7602, 7603** have never been run. Each world runs 1,200,000 ticks, EVERY=1000, in 150,000-tick chunks.

## Step 1 - executed first
A seed counts if all of these hold:
- both its worlds finished;
- BOTH arms' READ_OTHER hit in at least 1% of reads over the second half;
- one of its worlds started by window 20.

Fewer than 3 counted seeds is INCONCLUSIVE.

## The manipulation check (M)
`lab/probe-twowire.js` runs on each world's last save, with WARM 2000 and TICKS 5000, and writes `<dir>/<seed>_o<arm>.twowire.json`.

- **Measure:** the share of all income paid for CLEAN outputs fed by 2 or more distinct reads from this epoch.
- **M holds** if TREE's share is higher than STRICT's on at least 2 of 3 seeds.
- **If M fails, the verdict is NOT USED,** whatever else happens: the cheaper route was not taken, so nothing about tree composition can be read off.

For reference, #340's STRICT 7501 save had 0.19 (k=2, 3,000 ticks).

## Ruling measures
Windows are 30,000 ticks. ACTIVE is as in #290-#340. Grading is as in #338/#340.

- **A. HARDER.**
  - Measure: the median, over windows 21-40, of each window's hardest active circuit size (10+ counts as 10; if both medians are at the cap, formula size).
  - A seed passes if TREE is at least STRICT + 1.
  - Rule A holds on at least 2 of 3 seeds, provided TREE is lower than STRICT on none.
  - The margin is 1 gate, not #337's 2, because both arms here compose. STRICT's sustained median sat at exactly 6 on all six seeds of #339 and #340, so 1 gate is outside its seed-to-seed spread seen so far.
- **B. BROADER.** TREE has more functions ever active, on at least 2 of 3 seeds.
- **C. LATE NOVELTY.** TREE has a new active function in at least 5 of windows 31-40 on at least 2 of 3 seeds, and more such windows than STRICT, summed.
- **D. NO DECELERATION.** TREE's growth over windows 31-40 is at least half its growth over windows 11-20, and above 0, on at least 2 of 3 seeds.

## Verdict
- **NOT USED:** M fails.
- **NO GAIN:** M holds and A fails.
- **TREE HARDER** (", AND BROADER" when B holds): M and A hold; C or D fails.
- **TREE OPENS:** M, A, C and D all hold.

Reported, ruling on nothing:
- the k = 0/1/2/3+ by fresh/stale table for both arms;
- the gain readout CSZ(paid) - CSZ(read);
- per-window hardest values and the hardest function's identity;
- ever active by circuit size;
- refusals;
- population.

## Prediction written before running
**TREE HARDER**, with low confidence. M will hold. Sustained circuit 7 against 6, and late novelty still fails.

The doubt is about the other half of reading. READ_DIR also lets ONE read face any direction, which changes who reads whom: a single read is no longer always of the neighbour ahead. That could matter as much as the second read.

## What this cannot say
- This is three seeds at one horizon.
- READ_DIR changes two things together: two-neighbour gating becomes cheap, and a single read can face any direction. M measures only the first.
- If TREE gains, a follow-up that allows only one extra direction (behind) would separate the two.
