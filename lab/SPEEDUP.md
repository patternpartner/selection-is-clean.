# Headless speedup (`cos/speedup`)

Branch `cos/speedup`, from `cos/chance-engine` at `e392804`. Nothing here is merged, and `main` is untouched.

Lab runs do not execute `engine.html`. `lab/core-run.js` constructs a `World` from `lab/oee-core.js` and calls `step()` once per tick, with `sample()` every 1000 ticks. The same loop is what `lab/chance/runs.sh`, `lab/autocat/body-runs.sh`, `lab/meta/search.js` and the niche/skin runners use. A profile of a mature heritable-body world (seed 110, the A3b C1 knobs, 20k ticks) put the time in `chemStep` (about 43%), the instruction loop `run` (19% self), `step` (11%), `bodyRun` (9%), `ahead` (4%) and `matchP` (4%). Garbage collection was under 1%.

## Benchmark

`lab/speed-bench.js` is that loop with two digests and no `wallS` field:

- **log** — SHA-256 of `JSON.stringify(sample())` plus a newline, every 1000 ticks. A short chemistry run matched `core-run.js` with `,"wallS":…` stripped, which is the byte-check the lab scripts already use.
- **state** — SHA-256 of the RNG seeds and the physics arrays (molecules, programs, bodies, fields, neutral populations). Caches that are a pure function of that state are not hashed.

Quiet timings are one process, 30,000 ticks, `EVERY=1000`. `per100k` is `ms * 100000 / 30000`.

| config | seed | opts | before | after | per 100k before | per 100k after | factor | log + state |
|---|---|---|---|---|---|---|---|---|
| plain | 1 | `{}` | 31.14 s | 15.85 s | 104 s | 53 s | **1.96×** | identical |
| chem | 110 | `{"CHEM":1}` | 27.72 s | 15.11 s | 92 s | 50 s | **1.83×** | identical |
| body | 110 | C1: `CHEM, HBODY, BODY_F 0.05, BODY_MAX 16, BODY_FUSE 0.02` | 52.50 s | 31.76 s | 175 s | 106 s | **1.65×** | identical |

C1 is the chance-engine base (and the A3b body). Plain has no chemistry, so the interpreter and neighbour lookups dominate and the factor is larger. Body is the expensive one: at 30k ticks about 1200 organisms carry bodies and about 220 of 256 molecule species are present, so diffusion dominates. A 450k-tick run spends almost all of its time in that regime; 175 s per 100k ticks here is the 30k average, warmup included, on this machine (a long mature run is slower per tick than that average).

Reproduce:

```
SEED=110 TICKS=30000 EVERY=1000 OPTS='{"CHEM":1,"HBODY":1,"BODY_F":0.05,"BODY_MAX":16,"BODY_FUSE":0.02}' node lab/speed-bench.js
```

## What changed (`lab/oee-core.js`)

All of it keeps the same RNG call order and the same floating-point expressions. The diffusion formula is still `(v + D * (((left+right)+up+down) / 4 - v)) * k`, including the division by 4. Edges are split out only so the wrapped neighbour is named directly (`x=0` reads column 63, `x=63` reads column 0), which is the same index the `%` form produced.

1. **`diffuse64`.** For the default 64×64 world the inner cell loop no longer takes a remainder. Other widths and heights, including the identity case `W=48, H=40`, still use the original loop. Cross-feed's tag layer uses the same edge split (`diffuse64Clamp`) and then the same `Math.min` against the molecule layer.
2. **`molLive`.** A byte per species, set on every write that can make a species nonzero (eat, metabolism, body, cross-feed leak and release, niche catalysis) and cleared when the stencil result has no cell `> 0`. Empty species are not scanned. `World.load` rebuilds the bytes from the restored molecule array, so a resume does not skip a species that was actually present. A stale byte (species already all zeros) only diffuses zeros, which stores zeros.
3. **Body income.** Keys below 65536 accumulate in a `Float64Array` instead of a `Map`. A side list records first-seen order, which is the order `Map` insertion used to have, so `sample()`'s stable sort of tied incomes does not move. Pathway keys stay in the `Map` and in that same list.
4. **`ahead`.** An `Int32Array` of the eight neighbours of every cell, filled once with the old formula. `ahead` is an index.
5. **`matchP` / `kinSim`.** Bit count is a 65536-entry table (same integers as the Kernighan loop). When `ATT_POW` is 4, the power is `((s*s)*s)*s`, which matched `Math.pow(s, 4)` on all 17 scores `s = (16-m)/16`. Any other exponent still calls `Math.pow`.
6. **Instruction loop.** `prog`, `E` and `alive` are locals. The next PC is `pc+1`, or `0` when that equals the length (programs are at least one instruction, and `pc` is always in range), instead of `(pc+1) % n`.
7. **Light and corpses.** The per-tick decay multiplier is computed once. It is the same number that used to be computed per corpse.

## Identity

Compared against `e392804` (`/tmp/oee-core.orig.js` during the check). A mismatch of either digest is a failure. The 30k rows above were run one at a time. The rows below ran the old and new cores together, so the ratio is only a check that the new core was faster while the digests matched; the quiet factors are the table above.

| config | seed | ticks | log + state |
|---|---|---|---|
| plain | 1 | 20,000 | identical |
| chem | 110 | 20,000 | identical |
| body (C1) | 110 | 20,000 | identical |
| R1 (`BODY_RCAP`, `CH_LEN 1.5`) | 110 | 20,000 | identical |
| R2 (`CH_EVO 0.1`) | 111 | 15,000 | identical |
| cross-feed | 112 | 15,000 | identical |
| `BODY_DRIFT` | 110 | 15,000 | identical |
| `BODY_SHUF` | 13 | 10,000 | identical |
| meta (`BODY_CW`, `BODY_HIST 3`, `BODY_EVO`) | 12 | 12,000 | identical |
| scarcity | 7 | 15,000 | identical |
| tasks | 3 | 15,000 | identical |
| virus | 4 | 12,000 | identical |
| niche (v2 + open) | 5 | 12,000 | identical |
| skin + autocatalysis | 8 | 10,000 | identical |
| `CHEM_BIG` | 6 | 8,000 | identical |
| odd grid 48×40 with bodies | 2 | 10,000 | identical |

Also: on an cross-feed world, `save()` at tick 2,500 was byte-identical to `e392804`, and 2,000 further ticks after `World.load` matched molecule bytes and sample JSON.

Cross-feed gained the least in the paired run (about 1.3×) because its tag layer still walks species the molecule liveness byte does not cover. `CHEM_BIG` keeps its own diffusion loop; its gain is the interpreter and neighbour table only.
