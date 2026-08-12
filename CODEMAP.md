# CODEMAP — index.html (22,723 lines)

A structural map of the simulation, built by reading the source rather than the notebook. Written to be
durable: each region records what is THERE, with line anchors, so a later reader does not have to
re-derive it. Claims are marked **[read]** when taken from code and **[inferred]** when reasoned from it.

Companion to OEE-NOTES.md, which records experiments. This records the machine they run on.

---

## Macro structure

| lines | region | what it is |
|---|---|---|
| 1–330 | **network / bridge** | multi-tab population exchange over BroadcastChannel; migrants, plasmids, VM motifs, inscriptions. Alien attribution: predictions about OTHER tabs' substrates |
| 330–520 | **core constants + atom grammar** | world/opcode constants; `uaGenTerm`/`uaGenExpression` — the recursive grammar the system writes its own primitives in |
| 520–730 | **atom runtime + horizontal transfer** | draw VM, atom sensory context (`uaSetEyes`), `seedAtomIntoParticle`, `attemptMemeTransfer`, `uaCall` |
| 730–1260 | **economy** | energy pool, metabolism, senescence, seasons, provisioning, amplitude bounds |
| **1262–5752** | **the genome** | ONE object literal. 188 evolvable fields grouped into ~129 numbered "LAYERS" |
| 5752–6150 | genome tail, serialisation, export/import | |
| 6146–7500 | per-particle self-model, mutual recognition, meta-fitness integration | |
| 9739 / 10597 | shadow VM, sensor VM dispatch | |
| 12000–13000 | `mutateGenome`, `cloneGenome` — the mutation operators | |
| 13631+ | **`executeVM`** — the main pairwise particle VM | |
| 15829 / 17111 / 18666 | plasmid VM, cluster VM, solo-path VM | |
| 18900+ | register writeback, action application, main loop, render, UI | |

**Six `switch(op)` dispatches** at 9739, 10597, 13734, 15829, 17111, 18666 — named in harness-clamp.js as
shadow, sensor, particle, plasmid, cluster, shadow2. `CORE_OPCODES=236`, `MAX_BOUND_OPCODES=96`,
`OPCODE_COUNT=332`.

---

## The genome (1262–5752) — 188 evolvable parameters

**[read]** A single flat `let genome = {...}`. Not a tree, not modular — one vector of 188 numbers and
small arrays, cloned per particle (`pGenome[i]`), mutated by `mutateGenome`, clamped by `sanitizeGenome`.

**[read] 71 of the 188 fields are `*Influence` sensor gates** — one per sensory layer, each scaling how
strongly some measured quantity is mixed into a VM register. Layers 40–129 are almost entirely of this
form: `LAYER 51 NEIGHBOR_DENSITY`, `LAYER 57 PARTNER_SPEED`, `LAYER 104 EXTINCTION_COUNT`, and so on.

**[read] Layer census: 60 of 128 layers are named "read"/"sense"/"sensing". 14 are write/deposit/emit.**

**[read] The action space never grew.** `vmActions` is `Float32Array(8)` and only indices 0–7 are ever
written, across ~41 write sites. Roughly ninety layers of new senses were added on top of a motor
vocabulary that has stayed at eight slots since early on.

**[inferred] This is the system's central asymmetry: it is overwhelmingly perceptual.** It can sense its
own fitness momentum, its cluster's phase coherence, its partner's age, the global field coverage — and
then it can do eight things. Sensory dimensionality vastly exceeds motor dimensionality, so most evolved
sensitivity has no channel through which to become behaviour.

---

## The metabolic economy (730–1260, 12292, 13726) — and the hole in it

**[read]** There IS a real per-instruction price. `amp[i] -= nInst * genome.metabolicCost` at several
sites (12994, 13726, 16923, 18270, 18640), with a `COMPLEXITY_TOLL` surcharge on programs over 16
instructions (13726). There is also a genuine ecological economy: `WORLD_ENERGY_MAX/REGEN`,
`METABOLIC_ENERGY_DRAW` per living particle, `STARVE_DRAIN`, `SENESCENCE_ONSET/SCALE`, seasons
(`SEASON_PERIOD/AMPLITUDE`), and lossy provisioning (`PROVISION_YIELD=0.55`).

**[read] But `metabolicCost` is itself an evolvable genome field** (5682, default `0.00002`), mutated and
clamped at 12292 to `[0.000002, 0.0002]` — a floor 10× below default, a ceiling 10× above.

**[inferred] and this looks like the most consequential single line in the file.** A particle with lower
`metabolicCost` pays less amplitude per instruction per interaction, keeps more amplitude, and outbreeds
one that pays more. The parameter is under direct individual selection and **nothing opposes it** — the
cost of carrying instructions is set by the entity paying it. Expect it at or near the `0.000002` floor
in any mature run, which would make instruction-carrying ~free and would explain, in one mechanism, a
string of otherwise separate findings: #70 (inertness is free), #74 (selection purges dead opcodes only
"where a cost reaches"), #83 (a neutral element fixes).

The comment at 12292 shows the floor was added deliberately — "no free lunch — cost stays positive (the
negative-drift hole that euthanised selection is closed)". Positive was the fix. **Positive but
negligible was not ruled out.**

*Status: [inferred], NOT measured. `metabolicCost` over time is a one-line read-only instrument and has
not been run. It is the first thing to measure after the #84 batch drains.*

---

## The atom system (377–723) — the system's self-authored code

**[read] Grammar** (`uaGenTerm`, 405): recursive, budget from `genome.uaMaxDepth` (clamped 1–7, itself
evolvable). Produces, per recursion step: binary sub-expression (45%), **ternary branch** (17%),
**call another atom** `f(idx,a,b)` (10%), 2-arg function min/max/atan2/hypot (10%), else a leaf.
Leaves draw from vars `a,b,u,c,d,m,s` + world vars `nx,ny,t,nb` + forage vars `rl,rd`, or a constant
in [-2,2].

**[read] Atom inputs**: `a,b` = two VM registers; `u` = own normalised use count; `c` = proximity,
`d` = pair energy, `m` = caste match; `s` = **the atom's own previous output** (recurrence);
`f` = call another atom (composition); `nx,ny` = position, `t` = slow clock, `nb` = neighbour amplitude,
`rl,rd` = local and partner-relative resource.

**[read] Execution** (`uaCall`, 700): compiled via `new Function`, fuel-bounded (`UA_FUEL=64`) with
depth tracking so mutual recursion cannot hang. Output clamped to [-8,8] and stored back into
`atom.state` for the next tick.

**[read] Two units of selection.** `attemptMemeTransfer` (642) copies a donor's **most-used** bound atom
into a receiver on close contact (`MEME_PROX_THRESH=0.6`, `MEME_RATE=0.004`), independent of
reproduction. `seedAtomIntoParticle` (622) is the germline→population injection added in #80.

**[read] THE ROUTING BOTTLENECK.** The call site is spliced at a **random position with random source
and destination registers**: `[_op, random si, random di, random imm]` (639, 661). Dispatch is
`vmRegs[di] = uaCall(_bua, vmRegs[si], vmRegs[(si+1)%12])`.

---

## The effector census — measured, and it corrected me twice

**[read]** Parsed all six `switch(op)` dispatches with comments stripped, classifying every case by what
it writes outside the register file.

| VM | cases | opcodes writing `vmActions` |
|---|---|---|
| shadow | 220 | 4, 11 |
| sensor | 5 | — |
| **particle** | **236** | **4** |
| plasmid | 229 | 4 |
| cluster | 229 | 4 |
| shadow2 | 133 | 4 |

`case 4` is `{const ai=Math.abs(dst)%8; vmActions[ai] += vmRegs[si]*k;}` — the register→actuator bridge.
`case 5` reads actions back into a register (a sense of one's own action, not an actuator).

**First correction: my initial pass counted 4 actuator opcodes. Three of those matched `vmActions`
inside COMMENTS.** Stripping comments gives exactly one.

**Second correction, and it matters more: "one actuator" is still wrong.** Some opcodes write particle
state *directly*, bypassing `vmActions` entirely:

| target | opcodes |
|---|---|
| `amp` (energy) | 16, 24, 165, 226, 232 |
| `vx` / `vy` (motion) | 210, 211 |
| `phase` | 168, 217 |
| `pMem` | 7, 18 |
| `pProvision` | 16, 232 |
| `freq` | 219 |

**[read] So ~13 of 236 particle-VM opcodes (5.5%) can affect anything outside the register file. 222
write only to registers.**

### What that implies for the atom arc

**[inferred, arithmetic]** Mutation draws opcodes uniformly from `[0, OPCODE_COUNT=332)`. Mean live
program length is ~12 instructions (4338 instructions / 356 particles, from a run fingerprint). So:

- P(a given instruction is an effector) ≈ 13/332 ≈ **3.9%**
- P(a program contains ≥1 effector) ≈ 1−(1−0.039)^12 ≈ **38%**
- For an atom's output to route: a downstream instruction (~6 on average, since the splice position is
  uniform) must be an effector AND read the atom's destination register (`case 4` reads `vmRegs[si]`,
  ~1 of 12) → ≈ 6 × 0.039 × 0.083 ≈ **~2% of atom placements route directly to an effect.**

Multi-hop chains through intermediate registers add to this, and registers 4–11 persist (they are written
back to `pMem` and reloaded next interaction), so an atom's output is not erased — it can accumulate and
be re-read. Both routes widen the estimate; neither makes it large.

**This predicts a small-but-nonzero effect for #84's forced arms, not a clean zero** — which is the shape
stage 1 showed (−0.025 at ~2 SE). Recorded here BEFORE the n=45 result lands.

**Caveat [assumption]:** the arithmetic assumes opcodes are uniformly distributed in live programs.
Selection may enrich effectors heavily, since they are the only opcodes that do anything — and swing #11
noted a "museum, lights off" gap of ~20 of 232 opcodes ever used. **The realised opcode histogram in live
programs is not measured**, and it would move these numbers substantially in either direction. It is the
second cheap instrument this map calls for.

---

## The selection gradient (main loop, 20041+) — what actually drives differential survival

**[read]** `loop()` applies amplitude-modifying terms in this order: seasonal energy influx → metabolism
takes first claim on `worldEnergy` → **trait NFD** → **rarity metabolic discount** → **genotypic NFD** →
**novelty-archive reward** → `applyNicheEconomy()` → DIMS growth.

**[read] Magnitudes, per tick:**

| term | strength | zero-sum? |
|---|---|---|
| **genotypic NFD** — rare *program vocabulary* | `0.004 × 2.4` = **±0.0096** | yes |
| **trait NFD** — rare trait bin | **±0.004** | yes |
| novelty-archive reward | `novStrength` 0.004, cadence 24 | yes ("bound-then-centre") |
| rarity metabolic discount | `RARITY_DISCOUNT=0.62` upkeep multiplier | **no** |
| resource income `localRes × entropyK` | 0.0004 default; **~0.00135 evolved** (noted at 1156) | no |
| VM cost, ~12 instructions | ~0.00024 per interaction | no |

**[inferred] Being rare is worth roughly ten times more than foraging well.** The two largest terms are
both zero-sum rarity taxes. Nothing in the loop rewards a particle for computing well — only for being
different. An authored primitive that genuinely improved foraging would earn at most ~0.00135/tick
against rarity terms of ±0.0136/tick, a ~10:1 noise-to-signal ratio.

**[inferred] This reframes the whole #81–#84 arc.** Those experiments have been trying to detect a
behavioural benefit an order of magnitude below the dominant selective term. The 1.6% bound of #83 is
fully consistent with a real effect that is simply swamped.

### The carrier confound is frequency-dependent, and #83 may have misattributed it

**[read]** The genotypic-NFD signature is `sum of opHash[op]` over **distinct** opcodes with `op < 256`
(20069). An atom's opcode is `CORE_OPCODES + k` = **236 + k**, so the first bound opcodes are inside the
window. **Carriers therefore form their own signature class**, and the term rewards whichever class is
rarer — at ±0.0096, the strongest term in the system.

**[measured, on 52 completed #84 runs, 1625 windows with both classes ≥3]** Carrier advantage against
carrier frequency:

| carrier fraction | mean dAmp |
|---|---|
| 0.1–0.2 | **+0.0317** |
| 0.3–0.4 | +0.0305 |
| 0.5–0.6 | +0.0089 |
| 0.6–0.8 | ~0.000 |
| 0.9–1.0 | **−0.0095** |

OLS slope **−0.0141**. The advantage is a declining function of frequency — the signature of frequency
dependence, not of a fixed property of carriers.

**Averaged over the 10–90% band this gives ≈ +0.018. #83's sham-arm "position confound" was +0.0186.**

**[inferred, NOT established]** #83 read that number as *"contact-acquired carrier status predicts
amplitude — well-connected particles acquire atoms first."* A designed frequency-dependent mechanism
with the right sign and the right order of magnitude reproduces it. That does not prove NFD is the
cause: **regression to the mean predicts a declining curve too** — early carriers may simply be a
selected subset, and the advantage decays as the class grows to include everyone. Both hypotheses
predict the observed slope.

**The discriminator:** `GENO_NFD_ON` is a hard constant `=1` at line 1013 with no env gate. A
harness-side rewrite to `0` separates them cleanly — if the slope flattens, it is the NFD; if it
survives, it is position/regression and #83's reading stands. This is the single most informative
follow-up this map has produced, it costs one patched constant, and it cannot run until the #84 batch
frees the cores.

---

## The motor vocabulary (16951–17009 pairwise, 18914+ solo) — and the real fitness function

**[read]** All eight action slots, and what consumes them:

| slot | pairwise effect | magnitude |
|---|---|---|
| 0 | force along the partner axis — movement | `×influence×proximity` |
| 1 | phase shift between the pair | `×influence` |
| **2** | **amplitude transfer `amp[i]-=t; amp[j]+=t`** — VM-controlled energy trade/theft | `×influence×0.5` |
| 3 | tendency bleed — trait exchange toward the partner | `×influence` |
| **4** | **REPRODUCTION GATE** | see below |
| 5 | signal modulation | `×influence×0.003` |
| 6 | mutation-pressure accumulation — the VM tunes its own mutation rate | `×influence×0.0001` |
| 7 | writes its own identity vector (`tend` dim 4) | `×influence×0.01` |

**[read] The fitness function is one line** (16978, and 18244 for the cluster path):

```js
if(vmActions[4]*influence>0.0002 && Math.random()<0.002 && N<CAP){ ... addParticle(...); amp[i]*=0.7; amp[j]*=0.7; }
```

**Sexual reproduction is gated on a VM action.** The particle decides to reproduce, pays 30% of its
amplitude to do it, and the decision reaches the world through `vmActions[4]`.

**[read] Solo path (18914) exposes only slots 0, 1, 6, 7** — no reproduction and no amplitude transfer
without a partner.

### The bottleneck, restated correctly

The action space is not impoverished — it contains movement, energy theft, reproduction, self-directed
mutation rate, and self-editing of identity. **The constraint is that all eight are reachable only
through `case 4`**, `{const ai=Math.abs(dst)%8; vmActions[ai] += vmRegs[si]*k;}`.

So to reproduce sexually a program needs an opcode-4 instruction whose `dst ≡ 4 (mod 8)` carrying a
positive value. Under a uniform opcode draw that is `1/332 × 1/8 ≈ 0.038%` per instruction — which
**cannot** be what happens, because populations reproduce vigorously (~10⁵ births per 10³ ticks).

**[inferred] Therefore opcode 4 must be enormously enriched in evolved programs.** It is the sole gate
to reproduction, so selection on it is about as strong as selection gets. This **invalidates the uniform
draw assumption in the effector arithmetic above**, and in the direction that matters: if programs are
dense in opcode 4, then an atom's output is far more likely to reach an effector than the ~2% I
estimated, and the routing story for #81–#84 weakens considerably.

**The realised opcode histogram over live programs is now the single most important unmeasured quantity
in this map.** It decides whether the atom-neutrality result is about routing (sparse effectors) or about
content (dense effectors). It is cheap and read-only.

---

## Open questions this map raises

1. **The realised opcode histogram in live programs** — decides routing-vs-content for the whole atom arc, and invalidates or confirms the effector arithmetic. [not measured]
2. **What does `metabolicCost` actually evolve to?** [not measured] — the highest-value cheap instrument
   in the file.
2. **Is `vmRegs[di]` ever read downstream?** [not measured] — needs the opcode read/write table below.
3. **Opcode semantics table** — which of the 236 core opcodes read which registers, and which write
   `vmActions`. Not yet built; required to answer (2) statically.
