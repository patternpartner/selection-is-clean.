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

**The discriminator, now known to need TWO knobs, not one.** `GENO_NFD_ON` is a hard constant `=1` at
line 1013. But `__OPCODE_NOVELTY` is **also LIVE** (19565) and acts on carriers by the same route:

**[read] 19955–19965**: `opCum[op]` is a slow EMA of each opcode's usage share, recomputed every
`OPNOV_INTERVAL=120` ticks. Per-particle novelty sums `1 - min(1, opCum[op]*256)` over program
instructions **with `op < 256`**, and the reward is mean-centred:
`amp[i] += opnovStrength * clamp(pNicheRaw[i]/meanNov - 1, -1, 1)`, strength 0.0025 (evolvable).

**[read]** An atom's opcode is `CORE_OPCODES + k = 236 + k`, so the first ~20 bound opcodes fall **inside
the `op < 256` window** and are scored. A freshly-spread atom's opcode has `opCum ≈ 0` → novelty ≈ 1 →
**maximal bonus**, decaying exactly as the atom's usage share rises across the population.

**So there are THREE mean-centred rarity terms that produce a declining carrier advantage**, two of them
keyed directly to the bound opcode:

| term | strength | acts on carriers via |
|---|---|---|
| genotypic NFD | ±0.0096 | program signature includes opcode 236 |
| **opcode novelty** | ±0.0025 | opcode 236 is historically unexplored |
| trait NFD | ±0.004 | only if carriers differ in trait bin |

The discriminator against regression-to-the-mean therefore requires patching **both** `GENO_NFD_ON=0`
**and** `__OPCODE_NOVELTY=0`. Testing one alone would leave the other producing the same signature and
would be read as "the confound survived, so it is position" — a false negative. This is the single most
informative follow-up this map has produced; it costs two patched constants and cannot run until the #84
batch frees the cores.

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

## CORRECTION — the effector census was wrong twice more, and the high opcodes change the picture

The census above scanned only for particle-state targets (`vx`, `amp`, `phase`…). Rescanning for **every**
assigned or mutated identifier in each case body finds far more.

**[read] Well-identified effector categories in the particle VM:**

| target | opcodes | what it means |
|---|---|---|
| `localRes` | 138,140,144,146,152,153,155,156,162,166,212,215,220,225,… (15) | the resource currency — read AND spent |
| **`pProg`** | **144, 152, 153, 179, 225** | **self-modifying code** |
| `amp` | 16, 24, 165, 226, 232 | direct energy |
| `field` / `field2` / `signalField` / `detritalField` / `rootField` / `inhibitorField` / `scaffoldField` | 9,10,31,138,140,146,157,162,165,174,212,220 | stigmergic writes to six substrate channels |
| **`birthQueue`** | **16, 226** | **a second reproduction path** |
| `cellProgOp/A/B/Str` | 20 | writes a *program* into a substrate cell |
| `pType`, `pHomeX/Y`, `pResistance`, `pMode`, `freq`, `pMem` | 130,175,215,232,219,7,18 | self-modification of identity/state |

**Counting honestly: a strict scan gives 42 of 236; a wider one gives 93 but catches undeclared locals.
The true figure is between, and an exact count needs a real parser rather than regex.** Either way it is
far above the "~13" I reported earlier, and that estimate propagated into my routing arithmetic.

### Reproduction has more than one path — my "one-line fitness function" was wrong

**[read] `case 226` — SPAWN_REQUEST — is fully programmatic ASEXUAL reproduction:**

```js
if(localRes[i]>=0.4 && amp[i]>=0.2 && N+birthQueue.length<CAP-1){
  localRes[i]-=0.4; amp[i]-=0.2; birthQueue.push({...,parent:i}); vmRegs[di]=1*k; }
```

One parent, VM-decided, **priced at 0.4 `localRes` + 0.2 `amp`**. It bypasses `vmActions[4]` entirely.
So reproduction routes are at least: `vmActions[4]` (sexual, 16978), `birthQueue` via opcodes 16/226
(asexual), and `addCompound` (18397).

### The high opcodes are a different, better-designed layer

**[read] `case 225` — PROG_LATERAL_COPY**: `pProg[i]=cloneProg(pProg[j])`, cost 0.3 `localRes`. Wholesale
program horizontal transfer.
**[read] `case 152` — RECOMBINE**: splices a segment of the partner's program into its own, cost 0.15
`localRes`, length-capped.

**[inferred] and this materially revises the "system sets its own tax rate" finding above.** That
critique holds for `metabolicCost` — the per-instruction VM tax, which is evolvable and selected
downward. It does **not** hold for the high opcodes: their prices (0.4, 0.3, 0.15 `localRes`) are
**hardcoded constants a genome cannot mutate away**. The later layers of this system have a real,
non-gameable economy.

**So the honest version of the gradient critique is narrower than the one I gave earlier:** the *legacy*
VM cost is gameable and the *rarity* terms dominate amplitude, but the high-opcode layer has genuine
priced actions — resource-costed reproduction, program copying, recombination, and stigmergic writes.
The system is not uniformly gradient-free; it is gradient-free in its oldest currency and priced in its
newest.

---

## Mutation operators (11580–12605) — and the system's own answer to the routing bottleneck

**[read] Per-instruction mutation**, rate from `genome.mutationRate`:

| operator | probability | note |
|---|---|---|
| opcode swap | `rate` | uniform over `OPCODE_COUNT`=332 |
| source-register swap | `rate×0.2` | |
| dest-register swap | `rate×0.2` | |
| **insert instruction** | `rate×0.15×_growFactor` | biased — see below |
| delete instruction | `rate×0.1×_shrinkFactor` | floor of 6 instructions |
| **duplicate-with-mutation** | `rate×0.08×_growFactor` | copies an instruction, jitters its constant — the gene-duplication operator |

`_growFactor` / `_shrinkFactor` are driven by the system's **own attribution verdict** on its layers: it
creates more when thriving and culls harder when it has judged itself bloated.

### DIRECTED EMIT — the architecture already attacks the actuator bottleneck

**[read]** On insertion (12552–12581):

```js
const vmNudgeDirs33 = lastShadowNudgeDir.slice(5,12);        // from the SHADOW SIM
const bestBehavAxis = /* channel with the strongest nudge */;
const behavGradStrong = bgb>0.05 && risk>0.1 && bestBehavDir!==0;
if(behavGradStrong && Math.random() < cl(bgb*_decGainI,0,1)){
  newInst=[4, random(12), bestBehavAxis, initK];             // opcode 4 = EMIT, aimed at that channel
}
```

Plus **anti-gradient vetting**: an inserted EMIT whose constant opposes a strong gradient is re-rolled
60% of the time.

**[inferred] This is the designed answer to the bottleneck I flagged earlier, and it substantially
weakens my routing story.** Actuator instructions are not left to a 1-in-332 uniform draw — the system
*preferentially inserts* them, aims them at a specific action channel, and initialises their constant in
the gradient direction. Combined with selection (opcode 4 gates sexual reproduction), evolved programs
should be **strongly enriched** in opcode 4. My "~2% of atom placements route to an effect" estimate
assumed uniformity and is very likely too low.

### The tension worth naming

**[read]** The direction fed to directed-emit comes from `lastShadowNudgeDir` — the **shadow simulation**.
**[read]** The comment inside `case 16` records that the shadow sim "was ablated this session and measured
**EXACTLY 0.000** across five seeds: it fires, burns real compute, and changes nothing. Largest inert
subsystem in the file."

**[inferred]** So the mechanism that aims directed variation is driven by a subsystem previously measured
to have no effect. Note this does **not** disable directed-emit: even with a noise-valued `bestBehavAxis`,
the branch still preferentially inserts **opcode 4**, so actuator density rises regardless. What would be
lost is the *aiming*, not the enrichment. Whether the axis choice carries information is unmeasured, and
separable — compare directed-emit insertions against a shuffled-axis control.

---

## Death and life history (13440–13530) — the best-designed part of the system

**[read] Four death causes**, all through one ordinary path so bookkeeping stays uniform:

| cause | condition | body deposited? |
|---|---|---|
| **escape** | non-finite position, or beyond `[-W, 2W]×[-H, 2H]` | **no** — deliberately: the position is exactly what is untrustworthy |
| **starvation** | `amp < genome.deathThreshold` | yes — `rootField +0.18`, `detritalField += amp×0.22 + localRes×0.12` |
| **senescence** | hazard after `page > SENESCENCE_ONSET=1800` | yes |
| **surge exhaustion** | `MODE_SURGE` with provision spent | yes |

**[read] Death feeds a trophic level.** Corpses deposit into `detritalField` and `rootField`, which are
harvestable by other opcodes (146, 162, 165) — decomposer lineages can build a metabolism on death.
Starvation and senescence also return `BIRTH_ENERGY_COST × DEATH_ENERGY_RETURN` to `worldEnergy`.

**[read] Founder grace** (`specInGrace`): a young lineage gets `deathThreshold×0.25`, and under
`__COLO.surv` is pinned to life support rather than reaped — protection against the stochastic founding
dip, deliberately not extended to escapees.

**[read] Surplus is banked, not discarded**: `amp` above `AMP_SOFT` converts to `pProvision` at
`PROVISION_YIELD=0.55`.

**[read] Real life-history trade-offs**, and these are properly built:
- `somaRepair` — buys up to `SOMA_HAZARD_RELIEF=0.75` of senescence hazard, and **costs
  `amp -= somaRepair × SOMA_REPAIR_COST` every tick** (13401). Disposable-soma theory, implemented.
- `MODE_SURGE` — 2.2× reproduction, burns banked provision each tick, then takes an acute hazard when
  the reserve empties. Semelparity with a genuine failure mode.

### The pattern that keeps recurring: "evolvable" often means "will sit at a bound"

**[read] Selection direction for individually-selected genome parameters:**

| parameter | bound | direction individual selection pushes | compensating cost? |
|---|---|---|---|
| `metabolicCost` | [2e-6, 2e-4] | **down** (pay less per instruction) | **none visible** |
| `deathThreshold` | [0.01, 0.15] | **down** (survive at lower amp) | **none visible** |
| `lifespanBias` | [0.15, 6.0] | up (live longer) | implicit only |
| `somaRepair` | [0, 0.6] | up | **yes** — per-tick amp |
| `vmMaxInstructions` | [6, 20] → clamp [1,96] | up | yes — `nInst × metabolicCost` |

**[inferred] Where there is no compensating cost, the parameter's *bound* is the real design decision and
the evolution is decorative.** `metabolicCost` and `deathThreshold` are the two with no visible
counter-pressure, and both are exactly the parameters that set how hard selection bites.

**[not measured] One instrument answers this entire class of question**: dump evolved genome parameter
values at intervals over a run and see which sit at their bounds. It is read-only, cheap, and would
settle `metabolicCost` (open question 2), the life-history parameters above, and the general "is
evolvable decorative here?" question in a single run. **This is now the highest-value cheap measurement
this map has identified.**

---

## Multi-level selection: clusters (8090–8520) — a real second replicator

**[read]** Clusters form by flood-fill where `bond > genome.clusterBondThresh` within an interaction
radius, subject to `clusterMinSize`. A cluster is **not** just a label — it carries its own heritable
state:

`{ vmProgram: seedClusterVM(), vmInfluence, clusterGenome, lineageID, fieldSignature, coherence,
   scenarioFossil }`

**[read] Clusters BUD.** A daughter inherits the parent's `vmProgram` instruction-by-instruction with
mutation, its `clusterGenome`, a derived `lineageID`, a jittered `fieldSignature`, and a
**`scenarioFossil`** — the parent's birth-time scenario snapshot, i.e. ancestral memory passed down the
bud line.

**[read] Red Queen mutation boost**: `_effInnov = clusterGenome.innovationRate × (1 + _rqStress×1.5 +
rivalDissim×0.8)` — cluster mutation rate rises with field depletion and with divergence from rivals.
Opcode swap on bud is `rate×0.27`, drawn from `CORE_OPCODES` only.

**[inferred]** Cluster VMs therefore **cannot acquire authored atoms by mutation** — bound opcodes
(≥`CORE_OPCODES`) are outside the draw. Authored primitives are a particle-level phenomenon only. That
is an asymmetry the atom arc never mentions.

---

## The substrate: eight field channels (6093–6135)

**[read]** `FIELD_W×FIELD_H = 40×40` per channel:

| channel | role |
|---|---|
| `field` / `field2` | primary + secondary resource, enabling cross-channel reactions |
| `field1Prev` / `field2Prev` | previous-tick snapshots → temporal derivatives are sensable |
| `fieldMemory` | 0=virgin, higher=more history — "territorial scar depth" |
| `fieldSig` / `fieldOwnership` | per-cell territorial signature and claim strength (0=commons) |
| `rootField` | slow-decay mycelial network; persistent clusters deposit, others tunnel along |
| `detritalField` | corpse biomass; read by op145, harvested by op146 — the trophic substrate |
| `signalField` | volatile pheromone, ~5-tick half-life — alarm cascades, trails, marking |
| `cellProgOp/A/B/Str` | **an inscribed PROGRAM per cell** — the substrate itself computes |

**[read]** `cellProgStr` decays unless reinforced, and Layer 35 blends the inscribed cell's coefficient
back into `vmRegs[11]`. So particles write programs into the world, the world runs them, and the result
re-enters particle cognition. That loop is closed.

---

## The shadow simulation, and a precise version of the tension

**[read]** `lastShadowNudgeDir` is a 12-slot direction vector:

- **indices 0–4** (physics: `entropyBaseline`, `entropyK`, `entrainRate`, `creationCost`,
  `entrainThresh`) — written by **both** `decideFromRealWinner()` (6038, from the highest-amplitude REAL
  particle) and the shadow sim (10900–10904). Consumed by `gradMaybe` at 11948–11952 to bias physics
  mutation directionally.
- **indices 5–11** (behaviour: force, phaseShift, ampTransfer, tendBleed, **spawnDrive**, sigModulate,
  mutPressure) — written **ONLY** by the shadow sim (10905–10911, from `_wv`, the winning scenario).

**[read]** `mutateGenome` reads `lastShadowNudgeDir.slice(5,12)` at 12521 and 12556 — the behavioural
half — to pick `bestBehavAxis` for directed-EMIT insertion.

**[inferred] So the aiming of directed variation over BEHAVIOUR comes exclusively from the shadow sim**,
with no reality-derived fallback; reality only informs the physics axes. Given the `case 16` comment
recording the shadow sim as ablated to **exactly 0.000 across five seeds**, the axis choice may be
uninformed. Two things this does *not* mean: it does not disable directed-EMIT (opcode 4 is still
preferentially inserted, so actuator density still rises), and the 0.000 ablation predates LEAP 20
giving the shadow stakes via `decisionConfidence`. **Separable and unmeasured:** compare directed-EMIT
against a shuffled-axis control — same insertion rate, random channel. If outcomes match, the aiming is
decorative and only the enrichment matters.

---

## Plasmids (Layer 8; 15820–16923) — the fourth replicator, and the comparison that explains the atom arc

**[read]** Per-particle mobile DNA: up to `MAX_PLASMID=4` instructions of `[op,src,dst,k]`, stored in
`pPlasmid`, with `pPlasmidAge` tracking persistence.

- transfer on high-resonance contact: `plasmidTransferRate` 0.008, gated on `plasmidTransferThresh` 0.55
- own mutation rate `plasmidMutRate` 0.04, spontaneous origination `plasmidSpawnRate` 0.002
- broadcast across tabs in the network layer (159–293)
- priced: `amp[i] -= nPi × metabolicCost × 0.5` (16923) — half rate

**[read] Plasmids execute inline in `executeVM`, on the SAME `vmRegs` and `vmActions`** as the host
program (15820–15826), through their own 229-case dispatch that includes opcode 4.

### So the system has FOUR replicators

| replicator | unit | transmission | can it ACT? |
|---|---|---|---|
| particle genome + program | 188 params + ≤20 instructions | vertical descent | yes |
| cluster | cluster genome + cluster VM | budding | yes |
| **plasmid** | ≤4 **instructions** | **horizontal**, on resonance | **yes — full opcode set** |
| **authored atom** | one **expression** | **horizontal**, on contact | **no — writes a register only** |

**[inferred] and this is the clearest statement of the atom problem I have found.** The system already
contains a working horizontally-transmitted replicator that carries **actions** — a plasmid is
*instructions*, so it can emit, spawn, harvest, recombine, write fields. The authored atom is the one
replicator that carries only a **value**: `vmRegs[di] = uaCall(...)`. It computes, and then something
else must happen to route what it computed.

**#83 measured the value-carrier and found it neutral.** The action-carrier sitting beside it in the same
function was never the thing under test.

**The architectural fix is one line**, and it collapses the four-way conjunction identified above to a
single term: dispatch the bound opcode to an action channel rather than a register —

```js
// current (13734 region):  vmRegs[di] = uaCall(_bua, vmRegs[si], vmRegs[(si+1)%12]);
// candidate:               vmActions[Math.abs(di)%8] += uaCall(_bua, vmRegs[si], vmRegs[(si+1)%12]);
```

That makes an authored primitive an *actuator* with evolved content, i.e. an EMIT whose coefficient is a
self-authored expression instead of a constant `k`. **Pre-registered prediction, recorded before any
run: under this change the #81–#84 carrier estimator should stop returning null**, because the atom's
output would reach `vmActions` by construction rather than by a ~2% routing lottery. If it *still*
returns null with the routing removed, the neutrality is genuinely about expression content and the
grammar is the thing to attack.

**Caveat [assumption]:** this is a candidate experiment, not a recommendation to ship. It changes what a
bound opcode MEANS, so it must run as an arm against the current build, not replace it — and the
existing sham/forced machinery from #84 already provides the controls.

---

## Also found, worth recording

**[read] Evolvable chemistry** (5697–5706): `chemistryTable` is 12 opcode slots, each a recipe of
monomials `[coefSource, termA, termB, target]` over local state. Seeded from **random** monomials —
"no Gray-Scott, no Turing, no known chemistry. The substrate discovers its own dynamics from the
starting noise." Mutates at `chemistryMutRate` 0.02.

**[read] Evolvable sociality** (Layer 22): `netMigrantRate` and three sibling rates govern broadcasting
particles, plasmids, VM motifs and inscriptions to other browser tabs. All four evolve — "the system
decides whether to be social." Cross-tab arrivals deposit `XENO_RESOURCE` 0.22 and `XENO_HAZARD` 0.30:
foreign matter is opportunity and risk.

---

## CORRECTIONS to earlier sections of this map (865–885)

Two claims made earlier in this document, and repeated to the user, are **wrong**. The code says so
directly.

### 1. The bounded-trait-space wall WAS addressed

**[read]** (865–867):
```js
const TEND_SOFT=1.2;   // the historical wall, now a toll booth
const TEND_HARD=3.0;   // absolute bound retained for numerical safety
const TEND_TOLL=0.010; // amp charged per tick per unit beyond the soft line
```

The comment above it states the diagnosis explicitly — *"Swing #11 diagnosed exactly this (bounded trait
space ⇒ ≤16 channels ⇒ still a FINITE niche count) and every swing since redistributed a fixed niche
count. The bound now behaves like #51's amp line: crossing it is allowed but costs amplitude… The niche
space stops being a box."*

**I claimed swing #11's diagnosis "has not been addressed by anything in #54–#84." That is false.** It
was addressed structurally: the ±1.2 clamp became a priced boundary a lineage can pay to cross.

### 2. The gameable-cost failure mode was already identified, and already fixed for new machinery

**[read] LEAP 9 (869–877)** states the principle I derived independently, in almost the same words:

> *"The meta-influence layer inflates unchecked precisely because its coefficients cost NOTHING
> (measured: 1472 atrophy cuts fired and the layer still grew 4-5×). The atrophy machinery that judges is
> losing; the pressure that charges wins. So carried machinery is now billed at the same per-unit economy
> instructions already pay. **STRUCTURAL, not a gene — a self-cost gene gets evolved to zero to dodge the
> bill while keeping the bloat.**"*

```js
const CARRY_COST_META=0.0000009;  // amp/tick per unit of summed meta-influence magnitude
const CARRY_COST_ATOM=0.0000040;  // amp/tick per carried atom in the bank
```

**So the "system sets its own tax rate" critique was already known here and already acted on.** New
costs are deliberately structural constants precisely because a cost gene would be evolved to zero.
`metabolicCost` remaining a gene is a legacy holdover, not an oversight in principle.

**And it matters directly for the atom arc: carrying an atom is NOT free.** `CARRY_COST_ATOM` charges
0.000004 amp/tick per atom in the bank, structurally, un-dodgeable. Combined with #83's finding of no
benefit, an authored atom is a small **net negative** to its carrier — which is consistent with the
−8.6 population reading #80 recorded and could not attribute.

### 3. Other measured failures recorded in code, not in the notebook

- **Atrophy loses to inflation**: 1472 cuts fired, layer still grew 4–5×.
- **LEAP 11 "KILL THE HOMOGENISER"**: `globalTend` pulled every particle toward the population mean each
  tick — harmless under a frozen economy, "a continuous force FOR monoculture" once selection was real.
- **#51's reversal**: turning selection on collapsed `occupiedKinds` from 14–16 to 1.71. The diagnosis
  recorded is that *every diversity mechanism in the file had been tuned against a population that could
  not respond to it.*
- **`HYBRID_RATE=0.035`**: cross-lineage program exchange, because isolation made lineages permanently
  non-exchanging.

**[inferred] The lesson for reading this codebase:** the source comments contain measured results that
never reached OEE-NOTES.md, including several that pre-empt criticisms an outside reader would arrive at
independently. The comments are unreliable as *descriptions of current behaviour* — they claim actuators
that do not exist — but they are a genuine experimental record of *why constants have the values they
have*. Both things are true at once, and neither substitutes for reading the executable code.

---

## ★ THE HEADLINE FINDING — REACH exists, is LIVE, and does not apply to the atoms the arc measured

**[read] There is a `LIVE STACK` block (19548–19586)** that promotes the whole OEE experiment stack to
default-ON: `__COSMOS, __NICHE_FRONTIER, __NICHE_NDIM, __NICHE_LOCAL, __SPECIATE, __COLO_SURV,
__SPATIAL_TEND, __MINT_GATE:'cluster', __DRAW_VM, __GROUP_ROLES, __DIMS_SAT:3000, __SPATIAL_NICHE,
__NICHE_BUILD, __NOVELTY_ARCHIVE, __RICH_GRAMMAR, __DECIDE, __DECIDE_REAL, __FORAGE_EYES,
__ATOM_DURABLE, __REACH, __GROUP_COMMONS, __MEME_TRANSFER, __OPCODE_NOVELTY`. Fill rule:
`for(const k in LIVE) if(globalThis[k]===undefined) globalThis[k]=LIVE[k];` — the harness overrides only
what it sets explicitly.

**This contradicts OEE-NOTES.md swing #11's "ships dormant (all knobs default OFF)".** Every experiment
since runs the full stack unless it forced flags off.

### `__REACH` — atoms as effectors

**[read] 16910–16917**, and this is the whole thing:

```js
if(_bua){ const _out=uaCall(_bua,vmRegs[si],vmRegs[(si+1)%12]); vmRegs[di]=_out;
  if(__REACH_ON){ vmActions[Math.abs(di)%7]+=Math.max(-2,Math.min(2,_out))*k*0.2; __reachFires++; }
}
```

Its LIVE comment: *"authored atoms drive the VM's existing conserved actuators directly, closing
sense→compute→ACT. **Atoms become EFFECTORS, not just calculators.**"*

**So the architectural fix proposed earlier in this map already exists and is on by default.**

### But it is applied at ONE of NINE bound-opcode dispatch sites

**[read]** Bound-opcode dispatch appears at 10476, 13823, 15811, 15897, **16910**, 17179, 18207, 18729,
18906. Grepping `__REACH_ON` at each: **only 16910 has it.**

**[read] And 16910 is on the PLASMID path.** The nearest preceding operand definition is line 15828,
inside the plasmid loop (`const op=pPlasmid[pBase+ip*4]|0; … const si=…,di=…`), and the block closes at
16923 with `amp[i]-=nPi*genome.metabolicCost*0.5`. The main particle program's dispatch is 13823, whose
operands come from 13732 — **no REACH**.

### Why this is the headline

**[read]** `seedAtomIntoParticle` (639) splices the atom call-site into `pProg[tgt]` — the main program.
`attemptMemeTransfer` (658) splices into `recv.vmProgram` — also the main program. **Neither route ever
places an atom in a plasmid.**

**[inferred, and it follows directly] Every atom in #80, #81, #82, #83 and #84 executed on the
non-REACH path.** The mechanism that makes authored atoms effectors is live, was built for exactly this
problem, and does not reach the atoms the entire arc has been measuring. Those atoms were calculators
writing a register, and their output reached fitness only through the ~2% routing lottery.

This explains, without needing any new hypothesis:
- **#83's null** — the measured cargo genuinely could not act.
- **Why REACH exists at all** — someone diagnosed this and built the fix.
- **#84's stage-1 shape** — a small (~2 SE), not large, forced-arm effect is exactly what register-only
  routing predicts.

### The interventions this implies, in order

1. **Add REACH to site 13823** (the main-program dispatch) as an experimental arm against the current
   build. One line, and #84's sham/forced machinery already supplies the controls. **Pre-registered
   prediction: the carrier estimator stops returning null.**
2. **Measure `__reachFires`** — the counter already exists (590). If it is non-zero, REACH is firing for
   plasmid-borne atoms and the contrast between plasmid-atoms and program-atoms is directly observable
   in the current build, with no code change at all.
3. **`Math.abs(di)%7` on an 8-slot array** — `vmActions[7]` is unreachable via REACH. Slot 7 writes
   `tend` dim 4. Possibly deliberate (identity self-write excluded), possibly an off-by-one; the comment
   lists channels "0,2,3,4,5,6" and never mentions 1 or 7, so it reads as deliberate-but-undocumented.

---

## Cosmos (1086–1170) — selection over PHYSICS, and the fifth replicator

**[read]** An eligible cluster can found a **daughter world** carrying a multiplicatively perturbed copy
of its own five physics constants (`entropyBaseline`, `entropyK`, `entrainRate`, `creationCost`,
`entrainThresh`). The child runs its own coarse ecology on its own clock, with no reference to the
parent's fields, population or fitness.

**[read] "It is not scored. It either organises or it does not."** — selection without a fitness
function, which is the honest form of it. Children are seeded **disordered** (coherence ~0.05, two
cells) on a finite endowment converted from the launch cost, so a child must bootstrap order and mass
before its endowment drains: a genuine race.

**[read] Matter crosses the boundary in both directions, exactly conserved** (audited to
double-precision epsilon). A thriving child exports to its launch site; a starving one drains it — so
**parasitism is expressible without being built in**.

**[read] The loop closes upward**: a child that has exported more than it was founded with **proposes its
constants into `shadowScenarioBank`**, where the existing vetting machinery may evict them. World-level
outcomes feed back into the parent's imagination.

**[read] Measured before shipping**, on 400 children run to completion: 33.5% ever emit, 66.5% never
heard from; median peak coherence 0.331 against a 0.62 gate; median lifetime 521 of 900 ticks; 35.5%
survive to heat death. What separates a heard child from a silent one, in order: **cheap growth**
(`creationCost` 0.312 in emitters vs 0.407 in silent), then low `entropyBaseline` (7.8e-4 vs 9.1e-4),
then `entrainRate`. *"Most will die is a measurement here, not an intention."*

### So the system has FIVE levels of selection

| level | unit | inheritance |
|---|---|---|
| particle | genome (188 params) + program | vertical descent + crossover + hybridisation |
| cluster | cluster genome + cluster VM + scenarioFossil | budding |
| plasmid | ≤4 instructions | horizontal, on resonance |
| authored atom | one expression | horizontal, on contact |
| **world** | **five physics constants** | **founding, unscored** |

---

## Speciation (`__SPEC`, 19587+) — cladogenesis with both isolation halves

**[read]** `__SPECIATE:1` is LIVE. Defaults: `grace:2000` (founder death-relief), `minsize:12`,
`divT:0.20` (trait-centroid divergence threshold). A viable sub-population sitting in a niche-cell
distinct from its lineage's main body, with centroid diverged ≥ `divT`, is **minted a new lineage id**.

**[read] `__MINT_GATE:'cluster'`** — mint on a distinct *cluster* rather than a distinct niche-cell.
The recorded reason: the strict cell-distinctness condition "foreclosed split-first speciation, the
monoculture-lock", erasing incipient lineages at the cradle.

**[read] Post-zygotic isolation** (#17) blocks gene flow — crossover, `tendencyBleed`, `HGT_DONATE`
(op179), and the `globalTend` sink is pulled to the *lineage-local* centroid rather than the global mean.
**Pre-zygotic isolation** (`__SPEC_ASSORT`) is trait-based soft assortative mating and is **left OFF** —
recorded as refuted and net-harmful in #18.

**[read] Lineages are tracked**: `createLineage(parent, src)` with sources `'founder'`, `'cluster'`,
`'bud'`; `pLin[i]` inherits from parent A or mints a founder id.

---

## Alien attribution (52–68, 12420–12494, 13555–13570) — a SECOND selection channel on atoms

**[read]** The self's reflective apparatus (shadow-sim, metaCredit) only ever modelled Selection's own
future. This reuses the metaCredit *pattern* — *"I predicted a direction, time passed, did reality
confirm it"* — against a genuinely alien target: **a peer tab's packet-emission rate on the
BroadcastChannel**, the only observable available with zero cooperation from other files.

**[read] The predictor is an authored ATOM.** From the declaration comment: this is *"a real second test
of whether primitives selected for one role (driving actuators) generalize to a totally different one
(forecasting a foreign substrate), not a bespoke hand-written heuristic bolted on the side."*

**[read] It has teeth.** `alienGrip(a) = alienHits/alienAttempts` once `attempts ≥
ALIEN_GRIP_MIN_ATTEMPTS`. Gated `__ALIEN_SELECT`, default ON. Two consequences:
- atom selection weighting at 12427
- **cull protection at 12494**: an atom with zero uses past `UA_GRACE_AGE` is removed **unless**
  `alienGrip(a) > 0`

**[inferred] So authored atoms have TWO fitness channels: driving actuators, and forecasting foreign
substrates.** The #80–#84 arc measured only the first.

**[inferred] and this channel is almost certainly DEAD in every headless experiment.** `peerObservable`
is populated only by `handleNetworkMessage` from real BroadcastChannel traffic (115). The harness stubs
`BroadcastChannel` as a no-op class with no peers, so no packets arrive → `peerObservable` stays empty →
no predictions are formed → `alienAttempts` stays 0 → `alienGrip` is 0 for every atom, always.

**Consequences for the arc, both worth stating:**
1. The cull-protection branch never fires headless, so atom retention in #80–#84 is governed purely by
   `uses`, not by predictive grip. That is a *simplification* of the live artwork's dynamics, and it was
   never noted as a difference between harness and live.
2. **A whole selective channel designed for authored atoms cannot be measured by the harness at all.**
   Testing whether primitives generalize across substrates requires ≥2 live tabs, which is exactly the
   regime the notebook's "only the LIVE artwork can make this call" comments keep pointing at.

---

## Attribution / the meta-layer (Layer 26; 1579–1598, 9118+) — credit assignment over the genome

**[read]** Every parameter in `META_LAYER_PARAMS` (**126 tracked params**) carries a `creditTrace`,
accumulated each mutation cycle as `EMA( sign(perturbation applied last cycle) × sign(fitness change
since) )`. Causally ordered: perturb at cycle N, run an interval, fitness moves, cycle N+1 attributes
the move to that perturbation. Params that do not move bleed toward zero, so a gate frozen at 0 reads as
"not currently contributing" rather than holding stale credit.

**[read]** `metaCredit` holds `{trace, pendingDelta, fitAtApply}` per param. `metaCreditBias` (default
0.1, evolvable, bounded [0, 0.5]) gates the only behavioural change: above 0, a tracked param's
perturbation is **leaned** toward its credited direction. At 0 it is a pure random walk and attribution
is purely observational. *"The random component always dominates"* — lean, not lock.

**[read] The meta-layer is explicitly self-referential.** `atrophyRate` is itself in
`META_LAYER_PARAMS` — *"atrophy can atrophy itself"* — as is `metaMutationBias` (so differential
mutation can be retired by attribution) and `fitnessMirrorBias`. `ATROPHY_SAFE` lists **97** params
exempt from being atrophied.

**[inferred]** This is the machinery that produces `_growFactor` / `_shrinkFactor` in the mutation
operators — i.e. the system's self-assessment feeds back into how hard it creates and culls structure.
It is also the layer LEAP 9 measured as *losing*: 1472 atrophy cuts fired while the layer it judged grew
4–5×, which is why `CARRY_COST_META` was added as a structural charge rather than trusting the verdict.

---

## Signals (Layer 25) — explicit communication, and it is priced

**[read]** Pe31–35 gave particles only *implicit* communication (neighbour models, plasmids, field
deposition). Layer 25 adds **explicit** emit/receive, with three evolvable parameters and — notably —
a real cost: `signalEmitCost` default **0.005**, so *"emitting has real cost, must earn its keep"*. The
comment states the alternative and rejects it: at 0, *"signaling is free (particles can spam, but no
selection against it)"*.

**[inferred]** Signals are therefore one of the mechanisms built *with* the LEAP 9 lesson already
applied — a channel that would otherwise inflate is priced at the point of emission. `signalField` is
the volatile carrier (~5-tick half-life), written by opcodes 157, 165, 174.

---

## The network bridge (1–330) — four channels of cross-population gene flow

**[read]** `BroadcastChannel('selection-pe-network')`, multicast, `NET_PROTOCOL_VERSION=1`. Four
transferable payload types, each with its own evolvable emission rate (Layer 22 — *"the system decides
whether to be social"*):

| type | payload | effect on arrival |
|---|---|---|
| `migrant` | a whole particle: `tend`, `mem`, **plasmid**, `amp`, `phase` | `addParticle` into the local world |
| `plasmid` | ≤4 instructions | injected into a local particle |
| `motif` | ≤8 VM instructions | program fragment |
| `inscription` | cell program `{op, A, B, str}` | written into the substrate |

Plus `applied` — a gossip-style announcement that a received packet actually changed the receiver's sim
state. The comment is precise about why it is not a request/reply: BroadcastChannel is multicast, *"no
single 'the other end' to address"*, so any listener can count it. **This is the observable that alien
attribution predicts.**

**[read] Every payload is strictly validated** (`validNetworkPayload`, 82–100): bounds-checked,
length-capped, finite-checked on every field, with `validInstruction` enforcing 4-element instructions
in `[-64,64]` / `[-16,16]`. `NET_DIMS=5`, `NET_MEM_SIZE=8`, `NET_MAX_PLASMID=4` deliberately mirror core
constants for validation before local constants are known.

**[read]** `xenoImpact` (215) deposits `XENO_RESOURCE=0.22` and `XENO_HAZARD=0.30` — foreign matter is
opportunity and risk, and queues are bounded by `NET_QUEUE_LIMITS`.

**[inferred]** Treating other tabs as untrusted input is the right call and is implemented carefully.
The consequence for experiments is the one already noted under alien attribution: **headless runs stub
`BroadcastChannel` to a no-op, so all four channels AND the alien-prediction observable are inert in
every harness result in this project.**

---

## Coverage of this map

**Mapped [read]:** macro structure; the genome (188 params); the metabolic and ecological economy; the
atom grammar, runtime and transfer; the effector census across all six dispatches; the selection
gradient in the main loop; the motor vocabulary and every reproduction path; mutation operators
including directed-EMIT; death and life history; clusters and cluster budding; the eight substrate
channels; the shadow sim and what feeds it; plasmids; cosmos; speciation; alien attribution; the
attribution meta-layer; signals; the network bridge.

**Not mapped:** the HUD/UI, export/import serialisation detail, and the `bridge/` directory (separate
experiments: `rosetta.js`, `chemistry-reactor.html`, `lsystem-growth.html`).

---

## ★ The render layer is NOT cosmetic — it contains two free null controls

I described this region as "cosmetic to selection" and was challenged to verify it. Verified, and the
conclusion changes.

**[read] Causally inert, confirmed.** `runDrawProgram` (525–559) reads sim state and writes **nothing**
back — no `amp`, `vx`, `tend`, `pMem`, `field`, `phase`. It is called once, from the render path at
19125, under `__DRAWVM`. Every length and alpha is hard-clamped.

**[read] But it is HERITABLE and MUTATING.** `genome.draw` is a program of ≤`DRAW_MAX=4` primitives over
a 5-symbol alphabet (DOT, HALO, RING, SPOKE, SATELLITE) and a 12-register bank, cloned per particle,
sanitised at 7615, and **mutated at rate 0.004** (12672) by add / drop / retype. The comment states its
status outright: *"neutral drift, rides selection like rend"*.

**[read] `genome.rend` is the same shape and more interesting**: 4 slots, mutated at rate 0.003, each
regenerated with **`uaGenExpression()`** — *the very same grammar that authors atoms* — but its output
reaches only the renderer.

### Why this matters to the atom arc

**[inferred] The system contains two strictly-neutral, heritable, mutating traits, and the atom arc
never used either as a control.**

- **`rend` is a perfect "cargo without a channel" null.** It is an authored expression from the identical
  grammar, provably unable to affect fitness. Contrasting atom dynamics against `rend` dynamics isolates
  *the effect of having an actuator channel at all*, holding the generator constant. That is precisely
  the question #84 is spending ~5 core-hours to approach from the other direction.
- **`draw` is a drift baseline at MEME_RATE.** #80 argued in prose that *"at MEME_RATE 0.004 across ~350
  particles, a strictly neutral element fixes on the same timescale"* — and a strictly neutral element
  mutating at 0.004 was already in the genome, its fixation timescale directly measurable rather than
  asserted.

**Caveat, stated because it limits the claim:** `draw` and `rend` are inherited **vertically only**
(`cloneGenome`), whereas atoms also move horizontally. So they are a clean null for *drift and vertical
fixation*, not for contact-driven spread. The sham arm remains necessary for the fitness question.

**Method note.** I asserted this region was cosmetic without reading it, was asked whether I could be
sure, and could not. The assertion was wrong in the same direction as every other error in this
document — underestimating the system. **A region being causally inert is not the same as being
uninteresting; inert-but-heritable is exactly what a control is made of.**

**Confidence note.** Everything marked **[read]** was taken from source, and several **[read]** claims
in this document corrected earlier **[inferred]** ones in the same document — the corrections are left
in place rather than edited away, because the pattern of *what* I got wrong is itself information: every
error ran in the direction of underestimating the system.

**What it is [read]:** a **five-level** evolutionary system — particles, budding clusters, horizontally
transmitted plasmids, horizontally transmitted authored atoms, and founded daughter worlds carrying
perturbed physics — with self-modifying programs,
instruction-level recombination and lateral program copy, a priced resource economy, an eight-channel
writable substrate that itself computes, real life-history trade-offs (disposable soma, semelparity),
and a self-authored expression grammar with branching, composition and recurrence.

**The two honest structural criticisms that survived the full read:**

1. **The oldest currency is gameable; the newest is not** — and the codebase already knows it.
   `metabolicCost` and `deathThreshold` are evolvable with no visible counter-pressure. But LEAP 9 states
   the exact failure mode ("a self-cost gene gets evolved to zero to dodge the bill") and makes all newer
   costs structural constants. So this is a **legacy holdover in two named parameters**, not a
   philosophy of the system. The fix is narrow: convert those two, or measure whether they sit at their
   bounds first.

2. **Perception vastly outgrew action, and the bridge is narrow.** ~90 sensory layers and 71 sensor
   gates feed 12 registers, which reach the world through `case 4` plus ~40 direct-effect opcodes. The
   system has repeatedly answered this with directed-EMIT — but that mechanism's aim is fed by a
   subsystem measured inert.

**What it needs, in cost order [inferred]:**

- **Measure before building.** One read-only genome dump settles whether `metabolicCost` and
  `deathThreshold` sit at their bounds. If they do, that single fact reframes #70, #74 and #83 at once.
- **The opcode histogram.** Decides whether the atom-neutrality arc is about routing or content, and it
  is the load-bearing unknown under four experiments.
- **`GENO_NFD_ON=0`.** Separates frequency-dependent selection from regression to the mean in #83's
  "position confound".
- **Shuffled-axis control on directed-EMIT.** Tests whether the shadow sim's aiming carries information.

All four are read-only or one-constant patches. **None require new mechanisms**, which is the finding
that most surprised me: this system's next gains look like they come from measuring what is already
built, not from building more.

1. **The realised opcode histogram in live programs** — decides routing-vs-content for the whole atom arc, and invalidates or confirms the effector arithmetic. [not measured]
2. **What does `metabolicCost` actually evolve to?** [not measured] — if it sits at the floor, carrying
   instructions is ~free and several separate findings collapse into one mechanism.
3. **Is the carrier confound frequency-dependent selection or regression to the mean?** Patch
   `GENO_NFD_ON=1`→`0` (line 1013) harness-side. Decides whether #83's "position confound" reading holds.
4. **Is `vmRegs[di]` ever read downstream?** [not measured] — needs a per-opcode register read/write table,
   which the effector census started but did not finish.
