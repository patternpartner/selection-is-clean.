# PRE-REGISTRATION #381 — ONE CURRENCY: the computing world where the store pays for life and for births (`PROV_BIRTH=0 STORE_DEATH=1 AIM=0`)

Written and committed before any decision run. Seeds 11401-11420 have never been run by anyone.

## Why
- **#377** found the computing world runs on two currencies. Computing fills the store `pE`. AIM's stipend fills amplitude.
  `AIM=0` cut novelty about tenfold, while `AIM_FLAT=1` (everyone gets the mean aim payment) cost nothing measurable.
- **#381's design found where the stipend actually goes** (seeds 10401/10402, seen; they design this, they do not decide it).
  - Amplitude above `AMP_SOFT` is banked as provision, and since #221 (`PROV_BIRTH`) every birth costs the parent 1 provision as
    well as 0.25 of store.
  - In the default world the provision gate is the one that binds: 47,000-98,000 births a window pass the store check and are
    refused "unprovisioned".
  - So AIM's free stipend decides who can breed, alongside computing.
  - `STORE_DEATH=1` alone (amplitude no longer kills; #381, unset byte-identical) does not rescue an AIM-less world (122 and 209
    functions by 4,000). That is because births still need provision.
- **The one-currency world:** no provision gate, no death by amplitude, no AIM. Life and births are paid by the store alone,
  which computing and sunlight fill.

  | Seed | Default, functions by 4,000 | One-currency | Ratio |
  |---|---|---|---|
  | 10401 | 1,834 | 3,178 | 1.7x |
  | 10402 | 1,578 | 1,905 | 1.2x |

  It held about 1,700 alive from tick 500 to 4,000 on both seeds, with no collapse, no predators (op-155 carriers 0) and almost
  no refused births.
- **If it holds, it is a removal as much as an addition.** AIM's stipend and the provision gate stop deciding anything in the
  computing world, and what decides who lives and breeds is what PORT-PLAN said it should be: computing.

## Runs
- **20 pairs:** seeds 11401-11420, each run once as DEF (today's world) and once as ONE (`PROV_BIRTH=0 STORE_DEATH=1 AIM=0`),
  both reseeded after tick 1 with stream 1.
- **Reported, not ruled on:** ONE with `TASK_SHUFFLE=1` on seeds 11401-11405. This is the selection control #376 built, applied
  in the new world, since a claim about where novelty comes from at this rung should be checked against it (CLAUDE.md).
- `TASKS=1`, 12,000 ticks, `DIAG=1` (draws nothing).
- Batch `lab/port/one-batch.sh`, out `lab/port/out-one/`, analysis `lab/port/analyse-one.js`, written before the runs finish.

## Executed first
- The switches are checked on the ONE arm, not ruled on. Every ONE world must show 0 aim pulls and 0 unprovisioned refusals.
- A world that fails this is a fault in the rig. It is reported, and the experiment is INCONCLUSIVE until it is fixed.
- **Fewer than 15 complete pairs: INCONCLUSIVE.**

## Rule (over all complete pairs; the test #379 and #380 used)
- **Primary:** a one-sided exact Wilcoxon signed-rank on `log(V_one / V_def)`, V floored at 1.
- **BETTER:** ONE greater at p < 0.05. **WORSE:** ONE less at p < 0.05.
- **Guard:** if the median ONE alive-late is under half the median DEF alive-late, BETTER does not ship.
- Reported, not ruled on:
  - collapse discordance;
  - the geometric-mean ratio;
  - mean formula size and exp(H) late;
  - the shuffle arm's V against its ONE twin.

## Verdict
- **BETTER, and the guard holds: ship.** Wherever TASKS runs (the browser's default world), `PROV_BIRTH`, `STORE_DEATH` and `AIM`
  default to 0, 1 and 0. Each can still be set explicitly. Node's default world, and REPL without TASKS, are untouched and
  byte-identical.
  - Acceptance: `substrate-test` x4 and `smoke.sh` before `main`.
  - Named follow-up: the look. Rendering scales brightness and saturation by amplitude, which sits near its floor in this world,
    so creatures would draw dimmer. It is handled as a display-only change, checked in the browser and byte-identical in node.
- **WORSE:** delete `STORE_DEATH`. The note stays as the record.
- **Anything else:** no default moves; the knobs stay.

## Prediction (mine, before any run; I am 0 for 6)
BETTER. Both design seeds were ahead, and the mechanism is understood: the binding birth gate was a free stipend, and this world
replaces it with computing. The risks I see:
- The world sits near the population cap almost at once, so births become a matter of room, and selection may weaken.
- The shuffle arm will say whether it did.

## Saved worlds (rule 6)
If it ships, a saved TASKS universe that reloads runs under one currency: amplitude stops killing, births stop needing
provision, and aims stop paying. The aims stay in the genome and still mutate. Said here; it does not block.
