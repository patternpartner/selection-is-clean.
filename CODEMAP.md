# CODEMAP — engine.html (24,800 lines)

A structural map of the simulation, built by reading the source rather than the notebook. Written to be
durable: each region records what is THERE, with line anchors, so a later reader does not have to
re-derive it. Claims are marked **[read]** when taken from code and **[inferred]** when reasoned from it.

Companion to OEE-NOTES.md, which records experiments. This records the machine they run on.

---

## ⚠ CURRENCY — read this before trusting a line number

| | |
|---|---|
| **file** | `engine.html` — the sim moved out of `index.html` in `c0cef11`. Since **#149** the pages are: `index.html` = THE FIELD, `universe.html` = the single worker shell (what `index.html` used to be), `engine.html` = the simulation itself, still runnable on its own. Since **#153** the field is EIGHT INDIVIDUALS PLUS A COLLECTIVE (nine iframes); the ninth is an ordinary universe whose input is the other eight. Since **#162** those nine iframes share a SMALL POOL OF WORKERS (one per core, max 4) rather than owning one each. Since **#165** `/#layers=K` puts K more layers of the same count UNDERNEATH: universes with no cell, drawing nothing, running slow, on the same wire — `/#n=8,layers=2` is twenty-seven |
| **last fully re-derived** | never — this map was written against `index.html` and has been patched, not rebuilt |
| **prose current through** | **#90.** The engine is at **#159.** Roughly sixty swings are undocumented here |
| **verified as of #131** | the anchor table below, the opcode constants, the genome extent, and the census claims |
| **#180 note** | the atom grammar's production weights, leaf-symbol weights and OPERATOR SET are heritable as of #180 — `genome.uaProdW` / `uaVarW` / `uaOps`, and the symbols `qa`..`qh`. See "The grammar is a gene now" below. Anything that reasons about "the alphabet" as a constant is stale |
| **added since, unmapped below** | **#132/#133** verb grammar (`EFFECT_TARGETS`, `applyUserEffect`, opcode 236) · **#134** liveness census (`LIVENESS_DECLARED`, `fired()`) · **#135** attention field (`attnField`, `attentionAt`, the `at` sense) · **#136** world signal (`updateWorldSignal`, `worldSignalSuppressed`) · **#137** crossing census (`CROSSING_DECLARED`, `crossingCensus`) · **#138** the diary (`theDiary`, `diaryPanel`) · **#139** sense-gated verbs (`verbGate`, `remapEffectAx`, `effectSenseRate`) · **#140** the crossings (`CHILD_NOT_A_GENE`, inherit/roundtrip tests) · **#141** migrant vocabulary (`MIGRANT_CARRIES_VOCAB`) · **#153** the migrant packet extracted (`buildMigrantPacket`) and the wire's limits derived rather than restated (`netMaxOpcode`). Grep the names; no line anchors yet |
| **NOT verified** | every other inline line number in this file. They were written against a file ~1,100 lines shorter and around 500–900 lines of drift has accumulated unevenly — treat them as approximate, and grep for the quoted code instead |

The map's own promise is that a later reader does not have to re-derive it, which only holds if the
staleness is visible. When the engine moves, either re-derive the anchors or update this block; a map
that looks authoritative and is not costs more than no map. `OEE-NOTES.md` is current through #131.

**Determinism note (#136).** `updateWorldSignal()` is the only code in the engine whose input is the
real wall clock. `worldSignalSuppressed()` silences it whenever `process` exists — i.e. in every
Node rig — so seeded replays cannot depend on the time of day they ran. That detection is structural
rather than opt-in on purpose: an audit found five seeded rigs that set no marker. Anything added
here that reads the real world must go through the same guard.

**Germline vs population (#137).** The single most repeated bug in this file's history. Structure is
AUTHORED on the `genome` object; selection only ever sees `pGenome[i]`. Anything that does not make
the crossing is invisible to selection no matter how well it works, and it fails SILENTLY — the
feature runs, its counters move, its tests pass. It has happened four times (#102 atom uses, #130 the
OEE pool, #132b the verb cull's counter, #133b composed verbs losing their successor). `crossingCensus()`
now measures both sides for every kind of self-authored structure and reports anything STRANDED
(present on the germline, absent from every living particle). `crossing-test.js` fails the build on it.
If you add a fifth kind of authored structure, add a row to `CROSSING_DECLARED` in the same commit.

**THE THREE CROSSINGS (#140).** Self-authored structure has to survive three hand-offs, and each one
has had its own silent failure. A new structural field is not finished until it survives all three,
and each has a rig that fails the build:

| crossing | fails as | caught by |
|---|---|---|
| germline → population | authored, never selected on | `crossing-test.js` |
| parent → child | shared by reference, so a lineage cannot diverge it | `inherit-test.js` |
| save → load | works until you press save | `roundtrip-test.js` |
| tab → tab | the program travels, the vocabulary it speaks does not | `migrant-test.js` |
| tab → tab, on the wire | the packet is BUILT fine and REJECTED on arrival | `collective-test.js` |
| finger → button | the control is visible, and cannot be pressed | `collective-test.js` (real touch tap → file) |

**The wire's limits must be READ from the engine, never restated (#153).** The fifth crossing above is
its own bug class and it took until #153 to notice, because it fails on the RECEIVE side, in silence:
`validNetworkPayload` rejects the packet, `netStats.bad` counts it, and nothing anywhere reads
`netStats.bad`. Three of its four bounds had gone stale against ceilings that moved underneath them:

| the bound | what it said | what the engine does | who was lost |
|---|---|---|---|
| `validInstruction` op | ±64 | opcodes run 0..429 (`CORE_OPCODES` 237 + `MAX_BOUND_OPCODES` 192) | every plasmid or motif using an authored atom (236..427) or `EFFECT_EMIT` (236) — the two most evolved things here were the two horizontal transfer could not carry |
| tendency length | 5 | `let DIMS=5`, and the #25 ratchet grows it to `DIMS_MAX=32` | a universe that earned a sixth trait dimension became permanently unable to emigrate |
| `phase` | ±64 | `phase[i]+=freq[i]` every tick and never wraps | any particle alive more than ~1,500 ticks — the survivors, precisely |
| memory size | 8 | `MEM_SIZE` is 8 | nobody. Which is the point: nothing tells you which of a set of copied numbers has drifted |

So none of them are copied now — `validNetworkPayload` reads `DIMS_MAX` / `MEM_SIZE` / `MAX_PLASMID` /
`netMaxOpcode()` directly, and `buildMigrantPacket` brings its own packet inside the protocol before
sending it (phase by modulo, which is lossless because every consumer reads phase through cos/sin;
memory and position by clamp, because losing one register beats losing the whole organism).
`collective-test.js` holds `netStats.bad === 0` on every universe, which is what keeps this honest the
next time a ceiling moves. Measured before the fix, on the live channel: 2 of 25 motifs, 2 of 2
plasmids, 3 of 200 migrants for phase and 6 of 1,600 for position.

**Every rig swallows loop errors** (`try{ loop(); }catch(e){}`), which is right for a measurement but
means an engine that throws on every tick still passes all of them. `noerror-test.js` is the one rig
that does not swallow, and it drives the rare paths (forced authoring) rather than waiting for them —
#142 threw on every atom birth and a 3,000-tick run still went green by luck, because no birth
happened to land in the window. If you add a rig, it may swallow; something must not.

**Rarity is not safety** (#143). The liveness census names which paths are rare or never seen, and
those are exactly where a #142 can sit unexecuted for months. `rarepath-test.js` takes that list and
DRIVES each one — constructing its preconditions and invoking it — rather than waiting for it. That
is how `atom.cull` was executed for the first time, which is also the first execution of #137's
boundOpcodes remap inside it.

`cloneGenome` does `{...src}` — scalars by value, **objects by reference**. Deep-copying the heritable
structures is a manual list; anything left off it is silently shared by the whole population. The
self's journals (eventLog, epochs, lineage, metaCredit, shadowScenarioBank) are shared *deliberately*
and `inherit-test.js` asserts that too, so moving one across is a decision rather than an accident.

An opcode's meaning is an INDEX into a bank, so every one of these crossings is really the same
question: does slot *k* still mean the same thing on the other side? `#137` answered it for an atom
cull, `#139` for a sense gate seeded into a particle, `#141` for a migrant crossing tabs. Two
strategies, and which one applies depends on whether the bank travels: match by **expression** when
the destination has its own bank (`remapEffectAx`), preserve **slot order** when you are shipping the
bank itself (the migrant packet).

**The genome codec is UTF-8 safe, and expressions are ASCII-bounded (#159).** `encodeGenome` used raw
`btoa`, which throws on any character above U+00FF, while `decodeGenome` used `atob`, which cannot fail
that way. One odd character anywhere in the genome therefore killed the autosave AND the save button
while leaving the load button working — the asymmetry that identified it. Use `__b64enc`/`__b64dec`
(byte-identical to btoa/atob for ASCII, so old saves still read). Atom expressions are bounded to
printable ASCII by `uaExprSafe`/`UA_EXPR_SAFE` at three points: the wire (`validNetworkPayload`, which
checked length but never content), the bank (`sanitizeGenome`), and #157's caught-tick message. **Any
new string that reaches the genome must pass the same guard** — it will be base64'd into every future
save and, for expressions, compiled with `new Function`.

**The shared save slot is a monoculture, and the collective is NOT a firebreak (#159, corrected).**
ALL NINE universes — the collective included — run the same engine, and that engine autosaves to the
one `selection_genome` key every 900 ticks (`archiveGenome`) and again on every extinction. They all
boot from it too. So after a reload every universe is a clone of whichever wrote last, and a defect in
that genome breaks all nine identically.

The collective's own slot (`selection_collective`) is written and restored by `index.html`, and it only
governs what gets **restored into** the collective at ~1200ms after boot. It does nothing to stop the
collective's engine **writing** to the shared key like everyone else. The asymmetry runs one way:
it stops the collective INHERITING from an individual, not DONATING to all of them.

I claimed the opposite while advising on a risky import — that the collective "physically cannot
overwrite the eight" — and it was demonstrated false within minutes: a 1.18M-tick creature loaded into
the collective seat appeared in every tab on the next reload. **There is currently no safe place to
import a genome into a running field.** Anything loaded anywhere reaches everything within 900 ticks.

**Nothing that must happen may live downstream of a throw (#157).** `loop()` increments `tick` and
`genome.totalTicks` as its first statements inside a big try, so an exception anywhere in the body
leaves the clock advancing and everything after the throw point skipped. The autosave used to sit
several hundred lines down inside that try; it now runs in a `finally`. Cost of getting this wrong,
measured on the device: 300,000 ticks displayed, a reload at 198,000, and 100,000 ticks of evolution
gone. **A field hides the HUD (`#cleanart`, #144), and the HUD was the only place a caught tick was
reported** — so the failure was silent by construction. Caught ticks are now counted on module scope
(never on `genome`, per #131's RNG argument), serialised, carried out through the worker `stat` bridge,
and badged red on the offending cell by `index.html`. `autosave-test.js` injects a throw mid-tick and
requires the save to happen anyway — it tests the structure, because the next exception will be a
different one.

**The OEE meter's memory (#156).** `oeeLog`/`oeeNovel`/`oeePersist` were serialised; the three
structures they are derived from (`__oeeSeen`, `__oeeLastUses`, `__oeePending`) were not, so every
reload adopted the bank as history and recorded activity of ZERO — and on a phone that reloads often,
every flush was a first flush. All three now ride in the save (`oLU`/`oPD`/`oSN`, with `oTR` declaring
a truncated seen-set) and are restored on decode instead of reset. **D = -1 means UNMEASURED, not
zero**; anything reading column 1 of `oeeLog` must treat negatives as unknown. The meter's state stays
off `genome` — #131's reason still holds. Under budget pressure the seen-set is shed BEFORE any atom.
If you add a counter derived from runtime state, serialise what it is derived from, not just the count.

**Two places splice the atom bank (#155/#156).** The cull and `trimGenomeToBudget`. Both must remap
`boundOpcodes` AND `opStacks`; both now call `remapChainsForRemoval()`. #155 taught only the first and
the second was silently wrong for a day. A third splice site must call it too.

**Chained slots (#155).** A slot may hold more than one atom: `boundOpcodes[k]` is the head,
`genome.opStacks[k]` (sparse, absent when empty) holds the rest, and each link takes the previous
link's OUTPUT as its first argument. Five dispatch sites go through `uaChain()` — one helper, so a
sixth site cannot silently run the old semantics. Growth happens only at `MAX_BOUND_OPCODES`, via
`growAtomChain()`, onto a slot the program actually calls. Billed per link at the base instruction rate
in `stackToll()`, exempt from the over-length surcharge like op22. `opStacks` is heritable structure:
deep-copied in `cloneGenome` (inner arrays too), shifted by the cull (dropping the dead link rather
than tombstoning it — a stack position carries no opcode number), serialised as `os`, and censused as
`atom.chained`. Absent from every pre-#155 save, which is correct. `chain-test.js` drives it, because
no other rig ever reaches the cap.

**The voices (#174, scoped by #175).** `ya`..`yh` read `__uaVoice[0..7]`, which `uaChain` fills with
what slots 0-7 YIELD — the chain's answer, not the head's. The array is **scoped to one program run**.
Five sites clear it: `executeVM`, `executeClusterVM` and `executeSoloVM` clear unconditionally at
entry, above their own guards; `profileVM` clears per test case; the #95 prediction call clears before
its bare `uaCall`. A sixth program entry must clear too, or its atoms read a previous program's
values. #174 shipped with no clear anywhere, which meant `ya` did not mean "what my slot-0 atom said"
but "whatever the last atom to touch slot 0 left there, in any organism, possibly last tick" — and the
93.1h harvest measured the cost: the share of a universe's atoms referencing `ya`..`yh` correlated
with its persistence ratio at **r = -0.675**, the strongest correlation in that data and pointing the
wrong way. An atom whose output depends on population order cannot repeat itself, and selection
discards what cannot repeat. No clamp lives here: `uaCall` already ends every atom output with
`Math.max(-8,Math.min(8,r))`.

**How much of the bank actually runs (#176).** `__opReach` is one bit per bound slot, set in
`uaChain` — the same single funnel the chains use, so a sixth dispatch site cannot escape it — counted
and cleared once per epoch into `__opReachLog` and saved as `RCH` = `[tickEnd, slotsExecuted,
bankSize]`. `profileVM` is excluded via `__profiling`; it runs the germline program every 100 ticks to
price instructions, and counting that would mark every slot the germline names whether or not a
creature executed it. The log lives OFF the genome for #131's reason (cloneGenome spreads the genome
and mutateChildGenome randomises numeric fields in it), and a pre-#176 save restores an EMPTY log, not
a zero-filled one — "never measured" must not be able to look like "measured zero". It exists because
the germline program in the 93.1h harvest names only 1-9 distinct authored opcodes against banks of
43-104 atoms, and that count cannot be trusted as the population's: `pGenome[i]` runs a drifted
program, which is the #102/#132b trap. Deliberately NOT a `CROSSING_DECLARED` row — see the note there.

**The atom cull, and the one dial on it (#177).** The cull removes a failed atom, else an atom with
`uses === 0 && age > UA_GRACE_AGE`, else — and only if `genome.atomIdleTolerance > 0` — an atom that
has not executed anywhere in the population this window. Three things about that third branch. It
reads `__atomExprUses` (population-wide, expression-keyed, #102), never the germline object's `.uses`,
which clones reset and `profileVM` inflates. It refuses to read idleness out of a window younger than
`ATOM_IDLE_WINDOW` ticks since the map was last wiped — a zero in a fresh window is UNMEASURED, the
same rule as `D = -1` in the OEE meter. And it honours every protection the overwrite path honours:
alien grip (#46), personal credit (#110), pool credit (#111), and grace (#55). The gene seeds at 0,
where the branch is skipped entirely and the cull is byte-for-byte pre-#177 — but a lineage seeded at
0 does not stay there, because mutateGenome mutates this gene earlier in the same call that reaches
the cull. `idle-test.js` pins `mutationScale` to 0 to test the invariant rather than the drift; without
that pin the tolerance-0 condition reads non-zero and looks like a bug in the engine.

**RCH rows are four wide since #178.** `[tickEnd, slotsExecuted, bankSize, distinctAtomsReached]`.
The fourth column exists because SLOTS ARE NOT ATOMS: `boundOpcodes` aliases at ~3.46:1 in the live
field (190 filled slots -> ~54 distinct atoms), so the three-column version reported three universes
executing more slots than they owned atoms, and any "share of the bank" computed from it is
ill-formed. Atoms are counted against the GERMLINE's `boundOpcodes`/`opStacks` — the population ran
clones of those, so it is an approximation, a close one, and labelled as one. Pre-#178 rows are three
long and stay three long; anything reading this array must handle both widths.

**Three wire functions, and why they exist (#52, #57, #179).** `wireAtomCallSites` (op22),
`wireModeOpcodes` (op232-234) and `wireEffectCallSites` (op236) all splice an opcode into LIVING
programs (`pProg`) every 120 ticks, each skipping a program that already has one. They exist because a
brand-new opcode only enters a program if mutation happens to draw it, and a program seeded from the
base genome contains no reference to it — measured three times now: atoms (45k ticks, 3 authored, 3
bound, uses 0), SET_MODE (inherited-bias distribution identical to current-mode, digit for digit), and
verbs (**0 of 1,424 instructions in a live seventeen-universe field carried op236, so no verb could
ever fire**). Adding a new opcode that authored structure depends on means adding a fourth of these,
or the structure is unreachable and the census will read "never" forever. Note `wireEffectCallSites`
indexes the bank that EXISTS, not `MAX_USER_EFFECTS` — #133b's bug.

**The grammar is a gene now (#180).** Three heritable structures, all lazily created under their own
gate so a run with the gates down creates nothing, draws no extra `Math.random()`, and reproduces the
pre-#180 engine exactly.

| | what it is | default | bound |
|---|---|---|---|
| `genome.uaProdW` | the FIVE production weights `uaGenTerm` rolls against, independently | `[1,1,1,1,1]` = the pre-#180 thresholds | `[0,3]` each, block still capped at 0.97 so a leaf stays reachable |
| `genome.uaVarW` | one weight per leaf symbol, indexed by NAME through `UA_VAR_IX` | all 1 = the uniform draw | `[0,4]`, no floor — a specialised sensorium is a strategy, not a broken invariant |
| `genome.uaOps` | up to 8 authored binary operators, named `qa`..`qh` | absent = every symbol falls back to `UA_PRIM[slot]` | `UA_OPBANK` slots, `UA_OP_RENT` each per interaction |

An operator is a five-number descriptor and NEVER a string: `{p,a,b,k,c}` is either
`k*A(x,y)+(1-k)*B(x,y)` (blend) or `(x cmp y)?A(x,y):B(x,y)` (gate), with `a`/`b` indexing `UA_PRIM`
(the four arithmetic ops plus the four HANDS functions) and `c` indexing `USER_CMP`. Nothing here is
compiled or parsed, every index is masked with `&7`/`&3` rather than clamped, and `uaOpEval` ends
`isFinite(v)?v:0` — so no reachable descriptor, drifted or wire-borne, can produce a non-finite value
or index off the end. `grammar-test.js` sweeps all 4,096 combinations against eight nasty inputs.

**`qa` is LATE-BOUND, and that is the property everything else rests on.** It resolves through the
CARRIER's bank at call time (the hot path has already repointed `genome` to `pGenome[i]`), so:
redefining a slot changes what every atom naming it computes *without recompiling any of them*;
#161's expression-keyed compile cache stays correct because the text never changes; and an expression
naming `qa` can never fail to compile or run — an empty slot degrades to `UA_PRIM[slot]` and
`__uaOpFallbacks` counts it. A released slot is NULLED, never spliced: slot POSITION is the contract,
exactly as it is for `boundOpcodes` (#137), so `qa` means slot 0 in every clone, save and migrant.

**Four things #180 needed that it did not have, three of them found by measurement, not by reading:**

1. **The vocabulary travels with the word (`carryOpsForExpr`).** The crossing row said germline 5,
   population 0 — `atom.ops` STRANDED, the sixth appearance of this file's most repeated bug.
   `cloneGenome` copies the bank correctly and that was never the issue: the population's genomes were
   cloned BEFORE the germline had one. Atoms have `seedAtomIntoParticle` for this; operators had
   nothing. Now, wherever an atom's TEXT crosses into a genome that did not write it —
   `seedAtomIntoParticle`, `attemptMemeTransfer`, the migrant receive — the operators it names cross
   with it. **Non-destructive**: a destination slot already defined is left alone, because overwriting
   it silently redefines the resident's own atoms.
2. **Reachable at birth (`uaWireOpIntoBank`).** Counting the draws gave ~0.4 operator-naming atoms per
   6,000 ticks; the run measured zero, with five operators standing and paying rent. That is #179's
   arithmetic again, so it takes #179's answer: one atom in the germline bank comes to name the new
   operator at birth, once, and then lives under ordinary selection. TWO routes, because a young
   bank's atoms are all flat `(t1)op(t2)` and have no binary head to edit — swap a head where one
   exists, author one fresh atom where none does.
3. **Adoption after birth (`uaSwapBinHead`).** `uaLocalStep` has a third move: swap one binary HEAD
   (`Math.min(` / `qc(` / …) for another. Safe by `uaSwapVar`'s argument one token up — every name in
   that closed set is followed by `(` and takes exactly two comma-separated arguments, so the
   substitution preserves arity and balance without a parser. `f(` is excluded: three arguments.
   Reversible, so it is a step and not a ratchet. The split is gated, so `UA_OPS=0` is byte-for-byte
   #103's two-way choice on the same single draw.
4. **The top-level form in `uaGenExpression`.** `uaGenTerm`'s structural branches all require
   `depth>0` and every universe starts at `uaMaxDepth=1`, so the term-level branch alone would have
   been unreachable from birth. Both routes exist for the same #179 reason.

Naming obeys #174's two rules and `grammar-test.js` holds both: digit-free (or `uaJitterConst`'s regex
stops being exhaustive over this grammar), and no false match against `UA_VAR_RE` (in `qa` the 'a' has
a word character to its left, so `\ba\b` cannot reach it). `UA_OP_RE` is the `/g` counting copy and
`UA_OP_TEST` the bare testing one — a shared stateful `lastIndex` is its own bug class.

**The price.** `UA_OP_RENT` = 0.25 instruction-equivalents per DEFINED slot per interaction, billed in
`executeVM` beside `stackToll` and exempt from the over-length surcharge for the same reason op22 and
the chain toll are. Use is NOT metered — an operator is arithmetic inside an atom, and metering it
would price the invented ops above the built-ins they are made of, which is #54's "three leaps
strangling a fourth" waiting to happen. Rent falls on standing structure, which is where bloat would
be, and the 8-slot cap bounds it absolutely. 0.25 is the one hand-set number in #180 and is labelled
as such in the code.

**Instruments, shipped in the same commit as the layer.** Two crossing rows (`atom.ops` = did the bank
cross at all; `atom.opRef` = does anything NAME one — the row that would have caught #179 a swing
early), seven liveness names (`atom.opAuthor/opDrift/opCull/opWire/opCarry/opFire/opFallback`), and a
per-epoch log `__uaOpLog` saved as `OPS` = `[tickEnd, definedSlots, evaluations, atomsNamingAnOperator]`,
downsampled and restored on the same rules as `RCH`. `atom.opFire` and `atom.opFallback` come in
through **`firedN(name,n)`**, a batching sibling of `fired()` added by #180: an operator runs inside
somebody else's arithmetic, and a census call there would cost more than the arithmetic. `firedN`
keeps the first-firing tick stamp, so nothing reading `__liveness` needs to know which route a name
came in by.

**Bound opcodes (#137).** An opcode's NUMBER is its POSITION in `genome.boundOpcodes`
(`op = CORE_OPCODES + k`); its MEANING is `genome.userAtoms[boundOpcodes[k]]`. Two consequences that
are easy to miss: never splice `boundOpcodes` (it renumbers every opcode above the cut), and never
shift `userAtoms` without remapping `boundOpcodes` alongside it. `-1` is a legitimate tombstone for a
slot whose atom was culled, and every dispatch guards with `if(_bua)`, so an inert slot is a no-op.

**Two IIFEs after the script (#138).** `universe.html` extracts the metabolism observer with a
non-greedy regex anchored to `//__METAB_END__`. The diary panel is appended AFTER that marker and
ends at `//__DIARY_END__`; both are guarded on `document.body` so a headless rig cannot be taken down
by them. Anything else appended down there must keep its own end marker and the same guard.

**The field is a page, and a page has its own bugs (#150/#153/#154).** `index.html` lays a transparent
`.tap` div over every cell so one tap opens that universe. #150 opened a cell by toggling CSS classes
and never hid that overlay, so the opened universe's own save and load buttons stayed covered —
visible, and dead to every tap. Reported from a phone; invisible to thirty-four rigs, because no rig
had ever asked what a tap at those coordinates actually LANDS on.

#153 fixed that overlay and asserted it with `document.elementFromPoint`, which was still the wrong
question. In the GRID the tap target is SUPPOSED to win — opening the universe is the only thing a tap
there can mean — so a button rendered in a grid cell can be seen and never pressed no matter what the
overlay does. Nine cells, eighteen buttons, none of them doing what they looked like they did. #154's
answer is that a grid cell is a TAB and renders no controls at all: `universe.html` hides `#gio` when
`window.self !== window.top` (defaulting to hidden, so there is no race and no first paint with them
visible), and the field turns them on through `__field.controls(true)` when it opens a cell. A
standalone `universe.html` is not framed and is untouched.

The assertion moved with it, and this is the durable part: `collective-test.js` no longer asks where a
tap lands, it opens a universe and TAPS THE SAVE BUTTON WITH A REAL TOUCH in a `hasTouch` phone
context, requiring a downloaded file named `selection_gen<n>_t<n>.json`. Nothing short of that
distinguishes "the tap reaches the iframe" from "the button does its job" — the headless click worked
throughout both bugs. Same #144 lesson again: the shell is part of the artwork, and a rig that only
boots the engine cannot see it.

**Tap targets are a correctness property here (#154).** The buttons were 11px type in 25px boxes eight
pixels off the bottom of the viewport — which on a phone is where the browser toolbar and the Android
gesture bar live. They are now ~40px tall and lifted by `env(safe-area-inset-bottom)`, and
`universe.html`'s viewport meta carries `viewport-fit=cover` so that inset is non-zero. This costs
nothing in a field because a field does not render them.

**A shell is no longer a worker (#162).** This is the biggest structural change to the field since
#149, and it came out of a memory measurement rather than a design idea. Nine universes used to mean
nine workers, and a worker means a **V8 ISOLATE**. Measured (OEE-NOTES, "where the field's memory
actually goes"): nine copies of the engine source cost 316 MB, compiling them added 31, booting them
added 12, and RUNNING them added 1,077. The field's memory was never the data and never the code — it
is per-isolate heap slack, headroom V8 grants each isolate because each allocates hard every tick.
Nine universes packed into three workers ran the same simulation for 815 MB instead of 1,309, with
slightly MORE throughput. A control (three shells, nine isolates: 1,381 MB) rules out the frames.

So `index.html` hands each cell a POOL SLOT in its query string (`universe.html?pool=<run>x<slot>`),
cells sharing a slot open the same `SharedWorker`, and a worker hosts **one universe per connection**.
The message protocol is unchanged: a `MessagePort` behaves exactly as the dedicated worker did, which
is why `universe.html`'s whole `__field` layer needed two edited lines and nothing else.

Three things about this are load-bearing:

- **The engine was already re-entrant, by construction rather than by design.** The boot is
  `new Function(src)()`, so a second call builds a second scope with its own `genome`, its own typed
  arrays and its own loop. The only thing standing between one call and two was that the SHIM lived on
  the global — one `offscreen`, one `lsStore`, one `self.document`, one `self.__api`.
- **The shim is now passed as ARGUMENTS, not installed on the global.** `sim.worker.js` compiles the
  engine as `new Function('window','document','localStorage','location','history', …, src)` and calls
  it with that universe's own shims; parameters shadow the globals for the length of the engine's
  body. No `with` (which would deoptimise the whole hot loop), no source rewriting, no name mangling.
  If you add a global the engine reads, add it to `ENGINE_PARAMS` — or two universes will share it.
  One engine line had to change for this: `resize()` read a bare `innerWidth`, which cannot be
  per-instance; it reads `window.innerWidth` now, a no-op on the main thread.
- **A SharedWorker outlives the document that made it.** It dies only when its LAST PORT closes, so on
  a reload the new page can connect to a worker still running the old page's universes — nine zombie
  loops per refresh that nothing can see or stop. The pool name therefore carries a nonce minted once
  per page load (`POOL_RUN`), so a reload gets clean workers and the old one is reaped. `pool-test.js`
  asserts this the only way it can be observed from outside: every universe announces itself on the
  BroadcastChannel, so a zombie is a peer nobody built. Three reloads, still eight peers.

`#nopool` gives every cell its own slot — the pre-#162 layout, kept for comparison — and `#pool=N`
forces a count. A browser without `SharedWorker`, and a standalone `universe.html` with no slot at
all, fall back to a dedicated worker silently: a field that quietly costs more memory is still a
field, whereas a field that refuses to start is nothing.

**The field has two ceilings and they pull opposite ways (#162).** Worth keeping in mind before
changing the pool rule. Memory is per-ISOLATE, so it falls as universes are packed into fewer workers.
Throughput is per-CORE — total ticks across the whole field are flat from about four workers onward no
matter how many universes run — so it falls as universes are packed into fewer workers too. Nine
universes on nine workers was the worst point on both curves at once. The rule (`min(total, min(4,
hardwareConcurrency))`) is where they cross, and it can never make a small field worse: three
universes still get three workers. "8 is slow" was always the core-count ceiling, not the memory one;
the two had been conflated.

**The cube (#165/#166).** `#layers=K` builds K layers of `total` universes under the visible field.
A layer is an ORDINARY universe that happens not to be visible: no cell, `#dark` so it never draws,
`#pace` compounding with depth, same BroadcastChannel as everything above it. Three things make it
work, and all three were measured before it was built:

- **Drawing is 40% of a tick**, so a dark universe runs 1.68x faster than a lit one. The cheapest
  thing this field can run is a world nobody is watching.
- **Memory tracks particles, not universes** (#162), and a deep universe is another CONNECTION to a
  worker that already exists rather than another isolate. Measured: 18 extra universes for 273 MB,
  ~15 MB each against ~106 MB for a surface cell.
- **The network was already the surfacing mechanism.** Nothing surfaces by being tapped.

Deep frames are laid out OFF-SCREEN rather than `display:none`, and that is load-bearing: a frame with
no layout reports `innerWidth` 0, and the engine would size its whole world to a single pixel. They
are given a real cell's dimensions and moved to `left:-20000px`. They never paint anyway.

**The broadcast is dual, and the first version broke it (#166).** #163's clock gate refused incoming
material in proportion to how slow a universe ran, so anything paced — every layer, and any cell
standing down under #164 — stopped hearing its neighbours, and nothing said so. The author's rule is
that the ONLY difference between the surface and the depths is that you cannot see the depths. The
argument for it beats the one for the gate on this project's own terms: `netReceptivity` is an
evolvable gene, so a universe taking in more than it can digest can turn itself down, and that
decision belongs to the thing being flooded (#148). The clock-override worry only holds if the gene
cannot respond to a changed rate, and it can. Measured after: surface migrant inflow 790 → 1049, with
zero refusals and zero queue drops anywhere. `#isolate` keeps the mechanism available for a
deliberate allopatry experiment; **nothing in the shipped field sets it.**

**Turning the cube (#167).** Tapping the depth readout brings a layer to the face; `#turn=N` turns it
on its own every N seconds (default 300). The face is what runs LIT and at full pace while everything
else is dark and slow, so rotation is how the tick budget circulates rather than the top nine always
winning. Two rules, both learned the hard way:

- **Never reparent a frame.** Moving an iframe in the DOM reloads it, which reboots that universe from
  the shared storage slot and destroys its lineage — and the failure would look fine, because nine
  newborn universes tick and paint exactly like nine old ones. A rotation only restyles and re-flags
  frames in place; the grid goes `visibility:hidden`, never `display:none`. `layers-test.js` samples
  `totalTicks` before and after and requires no number ever went down.
- **The hash is the source of truth for `pace` and `dark`.** The engine re-reads both on every
  `hashchange`, so a hash that disagrees with an API call wins, because it arrives last. #167 shipped
  broken exactly here: hash `#cleanart,dark` plus `pace(400)` left the surface dark and running flat
  out, so turning the cube added a face instead of moving one. `stat` reports `pace` and `dark` now so
  the field asserts what it asked for instead of inferring it from a tick rate.

If you add a universe that is not in `cells`, remember what does NOT reach it: the #153 relay walks
`individuals`, and `checkErrors` walks `cells`. The layers participate purely through the wire, which
is the point, but it means the `#depth` readout is their only instrument — eighteen invisible
universes with no way to tell whether they are alive is a rumour, not an artwork.

**The field API (#152/#153).** `universe.html` exposes `window.__field` — `ready` / `save` / `load` /
`pull` / `feed` / `stat` / `controls`, plus the `*ForTest` diagnostics — and that is the whole surface
`index.html` has on a universe. Every call is
a `postMessage` round trip matched by a REQUEST ID the worker echoes back. #152 matched replies by "is
a field promise outstanding?" instead, so any export reply arriving while one was pending got
swallowed by it, and the 60-second field autosave meant one often was: tapping a universe's own save
could hand its file to the autosave and download nothing. If you add a call here, give it an rid.

**Which genome is `genome`? (#139)** During VM execution the global `genome` is REPOINTED to the
acting particle's own genome and restored in a `finally` — see the wrapper around `executeVM` /
`executeClusterVM`, and the same pattern in `executeSoloVM` and `applyMetabolism`. So inside
`applyUserEffects`, `verbGate`, and the opcode dispatches, `genome.userEffects` / `.userAtoms` /
`.boundOpcodes` are the CARRIER's, not the germline's. Measured: population verb banks accumulate
thousands of uses while the germline bank's own counters stay at 0. Calling any of those functions
directly from a test WITHOUT that repoint reads the germline and will tell you the opposite — that
mistake cost me a false bug report this session.

---

## Macro structure

| lines | region | what it is |
|---|---|---|
| 1–330 | **network / bridge** | multi-tab population exchange over BroadcastChannel; migrants, plasmids, VM motifs, inscriptions. Alien attribution: predictions about OTHER tabs' substrates |
| 330–520 | **core constants + atom grammar** | world/opcode constants; `uaGenTerm`/`uaGenExpression` — the recursive grammar the system writes its own primitives in |
| 520–730 | **atom runtime + horizontal transfer** | draw VM, atom sensory context (`uaSetEyes`), `seedAtomIntoParticle`, `attemptMemeTransfer`, `uaCall` |
| 730–1260 | **economy** | energy pool, metabolism, senescence, seasons, provisioning, amplitude bounds |
| **1601–6097** | **the genome** | ONE object literal. 188 evolvable fields grouped into ~129 numbered "LAYERS" (re-verified #131: still exactly 188 keys, no duplicates) |
| 5752–6150 | genome tail, serialisation, export/import | |
| 6146–7500 | per-particle self-model, mutual recognition, meta-fitness integration | |
| 9739 / 10597 | shadow VM, sensor VM dispatch | |
| 6508 / 6546 / 12302 | `cloneGenome`, `mutateChildGenome`, `mutateGenome` — the mutation operators (verified #131) | |
| 14626+ | **`executeVM`** — the main pairwise particle VM (verified #131) | |
| 15829 / 17111 / 18666 | plasmid VM, cluster VM, solo-path VM | |
| 18900+ | register writeback, action application, main loop, render, UI | |

**Six `switch(op)` dispatches** — verified at #131:

| line | dispatch | core-opcode coverage |
|---|---|---|
| 10336 | **profiler** (`profileVM`, no particle index — stubs its inputs) | 224/236 |
| 11223 | **fitness-sensor VM** — a *different* 5-opcode set over 19 registers, not this opcode space | n/a |
| 14729 | **particle** (`executeVM`, the pairwise VM) | **236/236** |
| 16843 | **plasmid** | 233/236 |
| 18136 | **cluster** | 233/236 |
| 19704 | **solo** | 137/236 |

The four non-particle dispatches other than the sensor VM are the stated parity set — this file says
"Full parity: particle VM, plasmid VM, cluster VM, profiler" at several opcode definitions. Ops
**232–235** (SET_MODE/READ_MODE/PARTNER_MODE from #57, COSMOS_SENSE from #59) were the one gap all
three shared and were inert in every dispatch but the particle VM until #131 implemented them. They
carry no flag: whether they are worth keeping is selection's call, expressed the same way it is for
every other opcode — by whether programs go on carrying them.

`CORE_OPCODES=236`, `MAX_BOUND_OPCODES=192` (#129, was 96), `OPCODE_COUNT=428` (was 332),
`DIMS_MAX=32` (#129, was 16), `CAP=1800`.

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

### ★ MEASURED (#85/#86) — worse than inferred: the cost is NEGATIVE, and the clamp is on the wrong path

**[measured]** Live particle genomes, 12000 ticks, 6 seeds:

| | value |
|---|---|
| `metabolicCost` mean | **−0.00653** |
| min across live genomes | **−0.0224** |
| seeds with a negative mean | **6 / 6** |
| documented clamp | [0.000002, 0.0002] |

`amp[i] -= nInst * metabolicCost` with a negative cost means **instructions PAY their carrier**. Longer
programs earn amplitude, so the term selects for its own further inversion — runaway, not drift.

**[read] The mechanism.** Particle genomes are mutated by `mutateChildGenome` (6078), not `mutateGenome`:
*"FULL divergence — gloves-off random walk on EVERY heritable scalar gene… Only the crash floors
(isFinite + the VM's own per-op clamps) remain; range is the system's to find."* No `__cl`, no
`sanitizeGenome`. Step size `(|v|*0.12 + 0.02)` — the additive `0.02` is **1000× the magnitude** of a
parameter living at 2e-5, so it random-walks straight through zero. **The clamp carrying the comment
"the negative-drift hole that euthanised selection is closed" is in the GERMLINE path only; the child
path is where selection operates.** Same signature on `somaRepair` (min −0.0086, floor 0) and
`uaMaxDepth` (0.931, floor 1).

**[fixed, #86]** `CHILD_SIGN_FLOOR` floors the parameters whose sign carries meaning. Off arm is
bit-identical to the prior build. Corrected: `metabolicCost` mean +2.82e-5, negative in 0/6.
**Cost of correction: −31% carrying capacity (8.3 SE), −65% atom execution (4.6 SE). It buys NO measured
diversity gain (kinds +1.83, 0.8 SE) and does NOT shorten programs (1.0 SE)** — both of those were my
predictions and both failed. It is a correctness fix, not an improvement.

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

**[inferred, arithmetic]** Mutation draws opcodes uniformly from `[0, OPCODE_COUNT=428)` (332 when this was written). Mean live
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

**Not mapped:** nothing structural remains. Serialisation, the cadenced sweep, and the render layer are
all covered below.

---

## Remaining cadenced mechanisms, and the upward channel

**[read] The `tick%N` sweep, completed.** `tick%3` echo trail (18609, visual); `tick%45` `compact()`
(array housekeeping); `tick%60` two blocks — population aggregates (`vmGainStats`) and germline
bookkeeping (`peakFitness`, `currentStableStreak`, `longestStable`), both read-only over sim state;
`tick%100` `profileVM()`; `tick%120` `sampleInstrumentation()` and `wireAtomCallSites()`; `tick%150`
`wireModeOpcodes()` / `wireCosmosOpcode()`; `tick%300` `collectClusterUpstream()`; `tick%600` the
generation ratchet; `tick%900` `archiveGenome()`; plus `OPNOV_INTERVAL`, `NOV_CADENCE`,
`ALIEN_PREDICT_CADENCE`.

**[read] `collectClusterUpstream` (Pe26) is a genuine UPWARD information channel.** Gated by
`genome.gradientUpstreamBias`; qualifying clusters (`persistAge≥6`, `coherence≥0.45`, `vmProgram≥2`)
donate a sampled **1–2 instruction motif** into `clusterUpstreamBuffer`, capped at
`MAX_UPSTREAM_BUFFER`. So group-level discoveries flow *up* into the germline — the system has
multi-level **information flow**, not only multi-level selection.

### An exemplary piece of epistemics, embedded in that function

**[read]** A gate term `avgAmp<0.38` was deleted after `harness-gates.js` measured it as *"the sole
blocker 0 times in 314 evaluations across four runs"* — removal therefore behaviour-neutral by
construction, and **checked bit-identically rather than argued**. Then the comment does something rarer:

> *"The claim is scoped WEAKER than #63's SPECIATE_MIN_AGE deletion, deliberately. That term had a
> structural argument… This one has only a correlation: `avgAmp<0.38` means a starving cluster, and
> starving clusters are also young, so `persistAge<6` fires first. Correlations can come apart in a
> regime not yet sampled. **"Dead in every regime measured" is the honest ceiling here, not "dead".**"*

**[inferred]** Refusing to upgrade a measured null into a structural claim, and saying explicitly *why*
this null is weaker than a superficially similar one, is the same discipline as #83's method note about
retiring controls. It belongs in this map because it is the standard the codebase sets for itself, and
it is the standard against which the four unmeasured items below should be judged.

---

## Serialisation (6263–6300, 7741–7760, 12710)

**[read]** `exportGenome` / `importGenome` (file), `archiveGenome` (every 900 ticks), and URL-hash resume
via `location.hash` — the mechanism `harness-clamp.js` uses for `GENOME=`. The wire format is
**abbreviated keys** (`age, z, p, q, w, oct, fs, m, f, n, …`) with `ua` for atoms and `dr` for the draw
program, reconstituted through `sanitizeGenome` / `sanitizeDraw` on load.

**[read]** Atoms survive serialisation with `uses`, `age`, `alienHits`, `alienAttempts` preserved (6628)
— unlike `cloneGenome`, which **resets** `uses` and the alien counters so a new lineage re-earns its own
track record. **A reloaded genome therefore carries a provenance a freshly-cloned one does not**, which
matters for any experiment resuming from `GENOME=`: `attemptMemeTransfer` picks the donor's
**most-used** atom, so a reloaded bank arrives with its usage ranking already established.

---

## The auto-wiring family — the substrate injects opcodes into living programs

**[read]** Three functions splice opcodes directly into `pProg[i]` on a cadence, outside mutation and
outside descent:

| function | opcodes injected | rate | cadence |
|---|---|---|---|
| `wireAtomCallSites` (11562) | **22** (atom call by index) | `ATOM_WIRE_RATE=0.02` | 120 ticks + on every authoring |
| `wireModeOpcodes` | **232 / 233 / 234** (mode decision) | `MODE_WIRE_RATE` | 150 ticks |
| `wireCosmosOpcode` | **235** (COSMOS_SENSE) | `COSMOS_WIRE_RATE` | 150 ticks |

Each skips a program that already carries one of its opcodes, and splices (or overwrites, if at the
length cap) otherwise.

**[inferred] So a non-trivial fraction of live program content is INJECTED by the substrate rather than
evolved.** The stated rationale (LEAP 7, #52) is that a new opcode sits in a tiny window of a 332-opcode
space that mutation hits by ~2% lottery, so without wiring "the author→bind→execute loop never closes."
That is a real problem and this is a reasonable fix — but it means **any claim that selection
"discovered" a use of opcode 22, 232-235 must account for the substrate having placed it there.**
Presence is injected; only *retention* is selected.

### RNG-matched ablation — a methodological lesson recorded in code

**[read]** `wireCosmosOpcode` carries this:

> *"This used to return immediately when `__COSMOS_SENSE=0`, which skipped roughly 7000
> `Math.random()` draws per 3000 ticks and shifted the entire seeded trajectory — so the arm was not a
> control at all, it was a different world. Measured divergence on the unmatched version: launches 12 vs
> 11, lateKinds 16 vs 14, from a knob that is supposed to isolate one opcode splice. Every draw is now
> consumed on both sides and only the WRITE to `pProg` is conditional."*

**A knob that skips RNG draws is not a control.** This generalises to every ablation in the project.

**[read] Checked against #84's own arms, because the lesson demanded it.** `ATOM_SHAM` / `ATOM_FORCE`
patch `uaCall` to return early. Does the skipped body consume randomness? `uaCompile` uses
`new Function` (no RNG), and compiled atom expressions are built from `uaGenTerm`'s vocabulary —
`a,b,u,c,d,m,s,f,nx,ny,t,nb,rl,rd` and literal constants — which contains **no `Math.random()`**. So the
sham/forced arms consume the same draws as the real arm at the patch site, and are RNG-matched. The
trajectory divergence that does occur is downstream of changed amplitudes, which is inherent to a
treatment rather than an artifact of the knob — the same distinction #80 drew for `ATOM_HERITABLE`.

---

## ★ OPCODE 22 — a THIRD atom-call path, auto-wired, and a possible confound in #81–#84

Found by sweeping for cadenced `tick%N` blocks — the scan class that had hidden the generation ratchet.

**[read] `case 22`** (particle VM):
```js
case 22:{ const uas=genome.userAtoms;
  if(uas&&uas.length>0){ const uIdx=Math.abs(Math.floor(k))%uas.length;
    vmRegs[di]=uaCall(uas[uIdx],vmRegs[si],vmRegs[(si+1)%12]); } }break;
```
The instruction's 4th field `k` is an **atom INDEX**, not a coefficient. It needs only `userAtoms` —
**`boundOpcodes` is not consulted at all.** No REACH at this site.

**[read] `wireAtomCallSites()`** (11562), called every 120 ticks (22469) *and* immediately on every atom
authoring (12458): for each live program, with probability `ATOM_WIRE_RATE=0.02`, if it has no opcode-22
instruction already, splice in `[22, rand12, rand12, randIndex]`. Ungated by any knob.

**[read] Germline authoring (12455) pushes to `userAtoms` UNCONDITIONALLY**; it binds into
`boundOpcodes` only inside `if(_atomFix)`. `cloneGenome` (6060) copies both lists, so descent keeps them
in sync — but the germline can hold atoms that were never bound.

### Why this may bias #81–#84 toward null

**[read]** The carrier test used throughout is
`isC = g && Array.isArray(g.boundOpcodes) && g.boundOpcodes.length > 0`.

**[inferred] That is "carries a bound opcode", NOT "executes atoms".** A particle with
`userAtoms.length>0` and `boundOpcodes.length===0` is classed a **non-carrier** while still calling
atoms through an auto-wired opcode 22. If both classes execute the same atoms, the
carrier-minus-non-carrier contrast **partially cancels the very effect it is measuring**, biasing the
estimator toward zero — a mechanism that would produce #83's null independently of the routing story.

**Not established, and directly measurable.** Whether this actually contaminates the split depends on
whether any live particle holds a non-empty `userAtoms` with an empty `boundOpcodes`. **That has never
been measured.** The instrument is one counter in the existing sampler:

```
atomsNoBind = count(palive && pGenome[i].userAtoms?.length && !pGenome[i].boundOpcodes?.length)
```

If it is 0 throughout, the split is clean and this concern is retired on evidence. If it is non-zero,
every carrier estimate in #81, #82, #83 and #84 is attenuated by an unmeasured amount, and the fix is to
redefine the split as *executes-atoms* rather than *carries-bound-opcode*.

**This is now the highest-priority instrument in this map**, ahead of the opcode histogram, because it
bears on whether four completed experiments measured what they reported.

---

## ★ THE GENERATION RATCHET (22477–22500) — found while checking the region I called "HUD"

**[read]** Unconditional, no knob, every 600 ticks:

```js
for(const l of live) if(!genFounders.has(l)) replaced++;
if(replaced/live.size >= GEN_TURNOVER_FRAC && tick-lastGenTick > 1200){
  genome.generation++;  genFounders=live;  lastGenTick=tick;
  let atFrontier=false;
  for(…) for(let d=0;d<DIMS;d++) if(Math.abs(tend[i*DIMS+d])>TEND_SOFT){atFrontier=true;break;}
  if(atFrontier && DIMS<DIMS_MAX) setDims(DIMS+1);   // recordEvent('dims_earned', …)
}
```

**A generation is counted only when a real fraction of live lineages have been REPLACED** — turnover,
not clock time. And when a generation turns over **while some lineage has pushed past `TEND_SOFT`**, the
trait space **grows a dimension**. The comment: *"if descent has reached the edge of the space, the space
gets bigger… **This is the ratchet the arc has wanted since swing #11.**"*

**[inferred] So there are THREE independent mechanisms addressing swing #11's bounded-niche-space wall**,
and I earlier told the user there were none:

1. `TEND_SOFT` / `TEND_TOLL` (865) — the ±1.2 wall became a priced boundary; pay amp to cross.
2. **This ratchet** — `DIMS` grows when generational turnover coincides with an occupied frontier. Earned
   twice over, and ungated.
3. `__DIMS_SAT:3000` (LIVE) — saturation-gated growth: every 3000 ticks, grow an axis iff distinct
   occupied niche-cells clear a threshold.

**Method note.** This was found only because the claim "the rest is cosmetic" was challenged. It sits
next to HUD string-building, which is why a structural scan skipped it — **proximity in the file is not
proximity in function**, and the single most open-endedness-relevant mechanism in this codebase lives
twenty lines from `_hud+=` string concatenation.

---

## The `bridge/` directory — a cross-paradigm interlingua with its own controlled arc

**[read]** Three browser artefacts share one `BroadcastChannel('selection-pe-network')`: Pe
(`index.html`, **never modified for the bridge**), `chemistry-reactor.html` (SKI-combinator artificial
chemistry), `lsystem-growth.html` (Lindenmayer rewrite grammar).

**[read] The Rosetta interlingua** (`rosetta.js`) is a five-gesture universal vocabulary —
`DRAW, TURN, BRANCH, MERGE, REPEAT` — grounded in Pe's arithmetic core:
`op0 copy→DRAW, op1 +=si*k→TURN, op2 *=→REPEAT, op3 threshold→BRANCH, op4 EMIT→MERGE`. Companions hear
Pe's native `motif`/`plasmid`/`migrant`/`inscription` packets, translate to gestures, seed a real
organism from the MEANING, and speak back **a valid native Pe motif** so Pe ingests via its own
validated receive path.

**[read] The arc is controlled, with effect sizes** (README):
1. Flat `harvestNumbers` receive path was **decoration** — negative control showed only number-RANGE
   crossed (Cliff δ=0.109, negligible), and selection erased even that.
2. Structure-preserving translation **transmits** (recoverable at ~8× the structure-destroyed baseline)
   but selection still erases it from the fitness outcome.
3. Fitness coupling makes the signature **hitchhike** into a retained minority (retention 5×→13×,
   δ→0.359) — *"only as far as honest, non-circular selection allows; fixation would mean designing the
   answer."*
4. Rosetta ships transmission: branch-density preserved into the L-system (**r=0.91**) and chemistry
   (**r=0.90**), bidirectional.

**[inferred] One limitation worth flagging.** `peOpToGesture(op) = CORE_OP_GESTURE[op%5]` maps *any*
opcode to a gesture by residue mod 5. The comment is honest — *"exact for 0..4"* — but given this map's
finding that the particle VM has 236 opcodes with ~42+ effectors, `op%5` is a very lossy projection for
everything above op 4 (op 152 RECOMBINE → `152%5=2` → REPEAT, which is arbitrary). The measured r≈0.9
shows something real crosses; what crosses is a projection of the arithmetic core, not of Pe's semantics
in general.

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

---

## ★ ALL FIVE OPEN QUESTIONS ANSWERED (#85/#86) — and this map was wrong about two

| # | question this map raised | answer |
|---|---|---|
| 1 | Does the carrier split conflate classes (opcode 22)? | **NO.** `atomsOnly = 0` in every window of every seed. #81–#84's split is clean; the concern is retired on evidence. |
| 2 | Does `metabolicCost` sit at a bound? | **Worse — it is NEGATIVE.** Mean −0.00653, negative in 6/6 seeds, against a documented clamp of [2e-6, 2e-4]. Instructions paid their carriers. Fixed in #86. |
| 3 | Is routing the bottleneck? | **NO, and this map was badly wrong.** Opcode 4 is **25.4%** of live instructions (**84× the uniform expectation**) and **357/361 programs contain one**. The "~2% of atom placements route to an effect" arithmetic assumed a uniform opcode draw and is **retired**. |
| 4 | Does REACH fire? | **Almost never — and "never" was my overclaim from 4 seeds.** #85 measured `__reachFires = 0` on all 4 seeds sampled; at **n=45** it is non-zero in **6/45** (mean 4,842) against **4,276,126** when wired to the main path. So REACH fires in ~13% of seeds at ~**880× below** main-path rate. Inert for practical purposes; not absent. |
| 5 | Frequency dependence, or regression to the mean? | **Frequency dependence REFUTED.** Disabling both `GENO_NFD_ON` and `__OPCODE_NOVELTY` did not flatten the carrier-advantage slope (difference −0.0020, **0.1 SE**). #83's position-confound reading stands; the reinterpretation offered in this map was **wrong**. |

### Scorecard for this document

Of the five decisive unknowns it identified, the map guessed the mechanism right on (2), and **wrong on
(3) and (5)** — the two places it argued at greatest length. The routing story it built across several
sections is dead: actuators are ubiquitous, not scarce, because directed-EMIT insertion and selection on
opcode 4 enrich them ~84×. The frequency-dependence reinterpretation of #83 is dead too.

**What survives is (4), and it is the finding of the whole read:** REACH is real, is LIVE by default,
carries the comment *"Atoms become EFFECTORS, not just calculators"* — and **essentially never fires on
the atoms the arc measures**: non-zero in only 6 of 45 seeds, at ~880× below the rate main-path wiring
produces. It is wired at the plasmid dispatch (16926); `seedAtomIntoParticle` and `attemptMemeTransfer`
both splice into the main program (15827), which had none until #88 added the gated arm.
*(Corrected: I first wrote "never fired" from a 4-seed sample. At n=45 it is rare, not absent.)*

### The standing recommendation, unchanged by any of the above

Add REACH to the main-program dispatch (13823) as an **arm against the current build**, using #84's
existing sham/forced machinery as controls. It is the one intervention this entire read produced that
is (a) one line, (b) targets a mechanism the codebase already built and believes it has, and (c) makes
a falsifiable prediction: **the carrier estimator should stop returning null.** If it still returns null
with routing removed *and* the economy corrected, the neutrality is genuinely about expression content
and the grammar is the thing to attack.

---

## ★ THE REACH EMIT'S `k` MULTIPLIER ERASES THE ATOM'S SIGN (#89b)

**[read]** Both REACH sites emit `vmActions[|di|%7] += clamp(_out, ±2) * k * 0.2`, where `k` is the
instruction's own immediate — `inst[3]`, initialised by mutation as `(Math.random()-0.5)*0.6` and
therefore **random-signed**.

**[measured] Consequence: the atom's output sign does not survive to the actuator.**

| forced `_out` | emit | distribution |
|---|---|---|
| +8 | `+2 * k * 0.2` | U(−0.12, +0.12) |
| −8 | `−2 * k * 0.2` | U(−0.12, +0.12) |

**Identical.** Confirmed empirically: `+8 vs −8` carrier advantage came back **0.08 SE** (#89b) — which is
the arithmetic working as written, not evidence of inertness. Any experiment contrasting atom output
*signs* through REACH is void by construction.

**[fixed, #90]** `REACH_NOK=1` emits `clamp(_out,±2)*0.2` with no `k`. `REACH_NOK=0` is bit-identical to
the prior build. One-seed control at 6000 ticks: `+8` gives `n=288 amp=254.2`, `−8` gives `n=272
amp=59.6` — a 4× amplitude gap between rails that were statistically identical under `k`.

**[inferred] This generalises beyond the atom arc.** `case 4` (the sole register→actuator bridge) is
`vmActions[|dst|%8] += vmRegs[si] * k`, with the same random-signed `k`. So **every** value routed to an
actuator by an evolved program passes through a coefficient whose sign is set by mutation, not by the
computation. Selection can tune `k` per instruction, so this is not a defect — but it means the *sign* of
any computed quantity is a separately-evolved property, not an inherited one, and a newly inserted EMIT
is equally likely to push either way regardless of what it reads.

---

## Arc status after #85–#90 (running record)

| # | question | outcome |
|---|---|---|
| #85 | five open questions from this map | 1 clean, 1 worse than inferred (negative cost), 2 refuted the map |
| #86 | does fixing the economy help? | correctness fix; **no** diversity gain (0.8 SE), no program shortening (1.0 SE) |
| #87 | #83 re-run under corrected economy | neutrality **reproduces**; #83's 1.6% bound **withdrawn** → ~10%; confound inverted and grew 7× |
| #88 | does REACH placement matter? | **null** (0.49 SE). Wiring is not the explanation. |
| #89 | can the instrument see forced cargo? | +8: 1.97 SE — did not survive pooling |
| #89b | ±8 sign contrast | **design void** — `k` erases sign. Pooled magnitude effect 1.80 SE, CI spans zero. |
| #90 | sign contrast with `k` removed | *running* |

**The record above stops at #90; the engine is at #131.** #91–#130 are in OEE-NOTES.md only. #131 is a
review pass: it repaired the measurement rig (17 of 18 files still loaded the retired `index.html`),
rewrote the #130 open-endedness meter after finding it counted a constant-jitter as a persistent
innovation, and repaired three defects outright: ops 232–235 now run in every dispatch, #34's novelty
horizon spans the real opcode space, and the atom→actuator channel reaches all eight slots. None of the
three carries a flag — selection already holds a finer dial on each. See OEE-NOTES.md #131.

**Standing count of failed predictions this session: 10, three of them mine.** Three designs failed on
their *premises* rather than their statistics (two-knob discriminator, "never fires" from n=4, sign
contrast through a sign-erasing coefficient).

---

## THE SUBSTRATE LAYERS (#181-#186)

#180 made the atom grammar heritable. #181-#185 do the same to the four remaining places the rules
were constants; #186 is the batch's own repairs. Every layer follows the same contract, and the
contract is the thing to read before touching any of them: **a gene lazily created under its own
knob, seeded at the value that reproduces the previous engine, clamped in sanitizeGenome (clamp if
present, never create), written to the save only when it exists, deep-copied in cloneGenome, given a
CROSSING_DECLARED row, given LIVENESS_DECLARED names, and charged rent on the executeVM billing line
if it is standing structure.**

| layer | genes | knob | rent |
|---|---|---|---|
| #181 compiler output stage | `uaFoldMode` 0-3, `uaFoldK` | `UA_FOLD` | `UA_FOLD_RENT` 0.5 while non-default |
| #182 major transitions | cluster `repro`/`alloc`/`allocRate`/`credit`, `autonomyCede` | `XION`, `XION_LEVELS` | none — allocation is conserved, not consumed |
| #183 physics | `cellScale`, `rxSelf`, `rxCross` + `LAW_DECLARED` | `PHYS`, `LAWMUT` | amplitude, charged per law proposal |
| #184 measurement loop | `probes[4]`, `oeeW[4]` | `PROBE`, `OEE_BONUS` | `PROBE_RENT` 0.15 per PROMOTED probe |
| #185 meta-population | `demeCount`, `demeFlow`, `netLawRate`, `netLawReceptivity` | `DEME`, `UPLASMID` | none |

**The fold is part of the compiled code's identity (#181).** `__uaCode` is keyed by expression text
because the compiled function is pure — that is what #161's 1.9 GB fix rests on. A heritable wrapper
breaks it, so the key is `expression + uaFoldKey(mode,k)`. Anything that adds a second compile-time
genome dependency must extend that key or two lineages will share one function.

**`ATTENTION_GAIN` is a `let` and must stay one.** `LAW_DECLARED` names it as a mutable law; as a
`const` its setter threw into the law machinery's own try/catch and the row silently never worked.
Two of the three rows write the GENOME as well as the global (`fieldDecay`, `fieldDiffuse`) because
those are re-derived in sanitizeGenome AND mutateGenome — a law that writes only the live value is
undone within a few hundred ticks and the probation verdict measures a constant that already snapped
back. `substrate-test` checks every row is settable and restores.

**`cellScale` narrows only, [0.4, 1.0], and the ceiling is not a preference.** The neighbour grid is
built on `CELL` and never offers a pair further apart, so a scale above 1 would be a gene whose upper
half does nothing — variance spent for no signal.

**Promoted probes only (#184).** `pa`..`pd` are on `UA_ALL_VARS` (last, for `UA_VAR_RE`'s
order-sensitivity, the same rule as `ya`..`yh` and `qa`..`qh`) but the GENERATOR is offered only the
promoted ones. An unpromoted probe's symbol reads a constant zero and filling the alphabet with those
is #179's failure in its purest form. A probe's record (`n`/`hit`) survives a save — a reload that
dropped it would silently demote every earned sense — but an outstanding claim (`pendTick`) does not,
because it belongs to the timeline that made it.

**Deme tags are DERIVED from position, never stored.** That is what makes allopatry reconnectable:
lowering `demeCount` merges the pools on the next tick with nothing to migrate or garbage-collect.
The barrier gates reproduction (both spawn sites) and horizontal transfer, NOT interaction.

### #188 — the channel bank, and why it is one mechanism for two ceilings

`EFFECT_TARGETS` was eleven entries a person typed and there are fifteen-plus hand-declared lattices,
each with a hand-written update rule and a hand-written sense opcode. Those are **one closure seen
from two sides**: everything any program can read or write is an entry in a list, and every entry got
a rule and an opcode written by hand. So one mechanism opens both.

A **channel** is one of `CHANNEL_MAX`=4 lattices, allocated by a lineage, whose **reaction rule is an
expression in that lineage's own atom grammar** — compiled by `uaCompile`, so it inherits #181's fold
and #161's cache. The cell's state reaches it through the parameter list the grammar already has:
`a` = this cell, `b` = the 4-neighbour mean (so `(b)-(a)` IS the discrete Laplacian — diffusion is
*expressible*, not imposed), `c`/`d`/`m` = resource/detrital/inhibitor here, `nx`/`ny`/`t`/`s`, and
`ka`..`kd` = **the other channels at this cell**, which is what makes reaction-diffusion possible
rather than four independent decays. The rule's answer IS the new cell value, not a delta.

| | |
|---|---|
| sensed by | `ka`..`kd` grammar symbols — but only for ALLOCATED slots (#179's dead-letter rule) |
| acted on by | `EFFECT_TARGETS` rows 11-14, `case 11..14` in `applyUserEffect` -> `chanWrite` |
| lives in | `genome.channels[k] = {expr, compiled, failed, age, uses}` — the RULE is genome |
| does NOT live in | the lattice. `__channels[k]` is WORLD STATE and is not saved with the genome |
| costs | `CHANNEL_RENT` 0.6/allocated channel/interaction — the dearest rent in the file |
| bounded by | `CHANNEL_CLAMP` on every cell, `CHANNEL_CADENCE`=12, `CHANNEL_MAX`=4 |
| knob | `CHANNEL` |

**The chemistry crosses; the chemicals do not.** A migrant and a `uplasmid` carry rules, so a lineage
arrives with a chemistry and an empty medium. That split is deliberate and is why `cloneGenome`
deep-copies `channels` while `__channels` is untouched by any genome operation.

**A runaway chemistry is a runaway WORLD.** There is no `uaCall` clamp standing behind the lattice the
way there is behind an atom's return value — `CHANNEL_CLAMP` is the only thing there. `substrate-test`
runs `(a)*(8.00)` from a full lattice for six cadences and asserts 0 cells out of bound. Anything that
writes a channel must clamp at the write.

**The lattice pass must be FULLY SCOPED, and the first version was not.** It set `c/d/m/nx/ny` and
left `rl`, `rd`, `__uaVoice`, `__probeOut` and `__chanOut` holding the last particle interaction's
values — and the chemistries that evolved named `rd`, `yd`, `yc`. That is #175's bug in a new pass: a
rule reading population-order residue cannot repeat itself and cannot be selected for. `updateChannels`
now saves, sets-or-zeroes, and restores every piece of ambient atom context. **Any future pass that
calls `uaCall` outside a particle interaction owes the same discipline.**

**Release is on reads AND writes.** An operator dies when nothing NAMES it; a channel has two ways to
be dead (nothing senses it, nothing acts into it) and either alone is survivable, so both are checked.
The lattice is left to decay rather than zeroed — a medium does not vanish because nothing maintains it.

**THE FORM IS A GENE TOO, SINCE #189.** Each channel rule additionally carries `st` (a stencil: up to
`CHANNEL_STENCIL_MAX` taps of `[dx,dy,weight]`, offsets bounded by `CHANNEL_OFFSET_MAX`), `wrap`
(0 = clamped plane, 1 = torus) and `cad` (cadence multiplier, 1..`CHANNEL_CAD_MAX`). All three seed to
#188's behaviour exactly, so an unmutated channel is byte-for-byte what it was.

The stencil redefines what the rule's `b` MEANS, and that is a change of form rather than parameter:
symmetric-summing-to-1 is a mean (diffusion), signed-summing-to-0 is a DERIVATIVE, and OFFSET-summing-
to-1 is a shifted average, which is ADVECTION — directed transport, which no symmetric kernel produces
at any weighting. Measured in `substrate-test`: identical chemistry, centroid 20.0 -> 20.0 under the
seeded mean and 20.0 -> 26.0 under `[[-1,0,1.0]]`; with `wrap=1` it reaches 10.0 after 30 updates
(20+30 = 50, mod 40).

**THE WEIGHTS ARE DELIBERATELY NOT NORMALISED.** Dividing by tap count would force every stencil to be
an average and delete the gradient and advection cases in one line. Do not "fix" this.

The form drifts on its OWN draw, separate from the chemistry's — two independent things, and one draw
would make a stencil change and a chemistry change indistinguishable to selection. Rent scales with
taps beyond the seeded four (`CHANNEL_TAP_RENT`), which is what makes SHRINKING a stencil profitable
rather than strictly dominated. `st` is an array of arrays: `cloneGenome` copies the taps as well as
the list, or one neighbourhood is shared population-wide. Pre-#189 saves have 2-long `chn` rows and
load with the seeded form, which is what they meant.

**ARITY WAS CONSIDERED AND REJECTED (#189), and the reasoning is reusable.** A vector field is already
expressible: cross-channel coupling means three scalar channels reading `ka`/`kb`/`kc` ARE a
three-component field. A dedicated arity gene would add a shared stencil/cadence — a convenience —
at the price of `ka`..`kd` meaning one thing in an atom and another in a channel rule. Symbol
confusion is the class of defect this file has paid for seven times; it bought nothing selection
cannot already reach.

**WHAT IS STILL CLOSED after #189.** The RESOLUTION (40x40), the fact that a cell is a square of a
regular grid, the particles' own continuous space and the position->cell map, and the global tick. A
channel's coupling structure is its own; the lattice it is drawn on is not.

### #190 — the interaction metric is a lineage trait

`metP` (Minkowski exponent, [0.5,4]), `metAx` (anisotropy, [0.25,4]) and `metRot` (rotation,
UNBOUNDED - a rotation is periodic, so a clamp would create two artificial attractors; sanitizeGenome
WRAPS it into [0,2pi) instead). Seeded (2,1,0). `metDist(dx,dy,g)` rotates, scales the two axes, then
takes the p-norm.

**THE FAST PATH IS THE EXACTNESS GUARANTEE, not an optimisation.** At (2,1,0) `metDist` returns
`Math.hypot` itself rather than a p=2 pow that is merely close - 0 of 400 random displacements differ,
bit for bit. That is what makes an unmutated genome IDENTICAL and not approximately equal, which every
A/B here depends on. Do not "simplify" that branch away.

**ANISOTROPY IS AREA-PRESERVING** (`dx*ax`, `dy/ax`) so `metAx` reshapes reach without inflating it.
`genome.cellScale` (#183) is already the reach gene; two genes pulling on one quantity is how a
measurement stops being interpretable.

| shape | axis | diag | perp | |
|---|---|---|---|---|
| (2,1,0) | 1.0 | 1.0 | 1.0 | a circle |
| (1,1,0) | 1.0 | 0.707 | 1.0 | a diamond - diagonals become FARTHER |
| (4,1,0) | 1.0 | 1.189 | 1.0 | bulges toward a square |
| (2,2,0) | 0.5 | 0.686 | 2.0 | an ellipse, area 1 |
| (2,2,pi/2) | 2.0 | 0.686 | 0.5 | the same ellipse, turned |

**ONE SITE ONLY.** A metric belongs to a PERCEIVER, so `_dm` is computed inside the `_drv` repoint in
the pair loop and passed to `entrain`, `executeVM` and `executeClusterVM`. Everything outside that
block keeps the Euclidean `d` - not laziness: outside it there is no single perceiver, and picking one
would restore the lower-array-index artifact the `_drv` coin exists to remove. The asymmetry is
already solved by that coin: each particle's metric governs ~half its encounters.

**THE BOUND is #183's, restated.** The neighbour grid supplies candidates within a EUCLIDEAN `CELL`
radius, so a metric whose unit ball reaches past it (p>2 diagonals, large `ax` long axis) has those
pairs never offered and is CLIPPED there. The metric reshapes within the Euclidean candidate set.

**WHAT THIS REACHES,** and it is most of the engine: the interaction gate, `proximity` (every atom's
`c`), force and transfer scaling, entrainment, and through the flood-fill WHAT A CLUSTER IS - hence
what #182's levels are built from. The consequence worth knowing: two lineages with orthogonally
oriented metrics share a region and admit mostly-disjoint neighbourhoods (measured: 30.8% overlap
against Euclidean's near-total), which is ecological separation by PERCEPTION rather than position.

**STILL CLOSED after #190:** the lattice resolution and the position->cell map. (The grid's candidate
radius was closed too and is opened by #191, below; the global tick was the third and is opened by
#192.)

### #191 — the sweep follows the reach, and `interactionRadius` starts working

**READ THIS BEFORE TOUCHING THE PAIR LOOP.** `interactionRadius` has been in the genome literal since
long before any of this, labelled "FREED: System evolves its own social distance", and was false two
ways: (1) `mutateGenome` evolves it over [25,120] while the sweep scanned +/-1 bin of CELL=55, so more
than half the range found partners only by grid-alignment luck - the artifact LEAP 31 (#58) named and
declined to fix; (2) it was read from the GERMLINE inside the outer pair loop, before the `_drv`
repoint, so every particle used the self's value regardless of its own lineage - #102's pattern in the
quantity that decides who can interact at all.

Now: sweep is `+/-reachRings(reach)` rings, reach comes from `pGenome[i]` via `reachOf(i)`, and the
dedup is **symmetric**.

**THE DEDUP IS THE DANGEROUS PART.** `j>i` is a correct dedup only while every particle has the same
reach; once reaches differ, a pair only the HIGHER-indexed particle can reach is discovered while
scanning it and then thrown away - #58's artifact one level up. The guard is now
`_mine && (!_theirs || i<j)`: only-i at i, only-j at j, both at the lower index. Exactly once, and
WHETHER a pair happens no longer depends on allocation order. `substrate-test` checks all 275
reach/distance combinations for double-counting and loss, and 80 for order dependence. **Do not
"simplify" this back to `j>i`.**

**THE RING CAP IS DERIVED.** `REACH_RINGS_MAX = 3` because `ceil(120/CELL) = 3` covers the gene's
whole declared range and nothing beyond. `sanitizeGenome` clamps the gene to `CELL*REACH_RINGS_MAX` -
the same number from the other side. If either moves, both move, or the defect returns.

**RENT IS AREA, NOT RADIUS** (`REACH_RENT * (r/CELL)^2 - 1`), zero at the default 55. Each particle
sweeps its own radius and is billed for its own area, which is what stops a widened sweep being a
tragedy of the commons.

The knob is `REACH_SWEEP`, resolved into `__REACH` - deliberately NOT `REACH`, because `__REACH_ON`
is a different pre-existing gate and colliding on that name is how a knob stops being a control.

**This unlocks three genes for one change:** `interactionRadius`, #183's `cellScale` (the world side
need no longer be narrows-only) and #190's metric past p=2. The caveats stated in both of those
swings are now removable rather than restated.

### #192 — the tick becomes a lineage trait, and the rule for every discrete gene after it

`tickRate` (1..`TICK_RATE_MAX`=6) is how many ticks pass between a lineage's beats; `tickPhase`
(0..rate-1) is which of them it beats on. `particleActive(i)` is
`((tick + phase) % rate) === 0`, read from **`pGenome[i]`**, and it gates three sites: the outer pair
loop, the inner candidate test, and `executeSoloVM`. Seeded (1, 0) = every tick = the pre-#192
engine. Knob `STIME`.

**BOTH PARTICLES MUST BE ACTIVE TO INTERACT, and the outer-loop skip is load-bearing.** An inactive
particle is *absent*, not idle — it neither initiates nor is offered as a candidate. That is what
makes two lineages at the same rate with opposite phases **never** interact (measured: 0 co-active
ticks in 600, for rate 2 and rate 3), which is temporal isolation at no spatial cost. It is the third
niche axis after #185's demes and #190's metrics. Do not "optimise" the skip down to the inner test
only: that would make an inactive particle a passive partner instead of an absent one, and the
isolation would stop being symmetric.

**THE 1/rate UPKEEP DIVISION IS WHAT STOPS THIS BEING A WIREHEAD.** `attnUpkeep(i)` is divided by
`tickRateOf(pGenome[i])` on the metabolic line. Without it, slowing down would scale a particle's
costs and its income by different factors and "go slow" would be a free win. With it, the same
organism on a stretched timeline is neutral by construction, and the only thing that makes rate a
decision is that the world does not slow down with it. Measured 4.000× at rate 4. **If you touch the
metabolic line, keep the division.**

**DELIBERATELY NOT SKIPPED:** death, ageing, movement, field physics. Skipping those would make
`tickRate` a longevity gene, and an uncosted longevity gene is the runaway #85's sign floors exist to
prevent.

`tickPhase` is **reduced into** the rate, not clamped — phase 5 under rate 2 *is* phase 1, and storing
5 would make two genomes that behave identically compare as different. Done in `sanitizeGenome` for
the germline and inline in `mutateChildGenome` for children, which `sanitizeGenome` never sees.

**A DISCRETE GENE NEEDS A DISCRETE OPERATOR, AND `CHILD_DISCRETE` IS WHERE IT GOES.** This layer
shipped dead and the instrument read healthy, which is why it is stated here as a rule rather than a
war story. `mutateChildGenome`'s generic walk nudges every numeric field by
`v ± (|v|*0.12+0.02)*scale`. At `tickRate = 1` that is a step of at most **0.07** against a gene whose
next legal value is **2**, and `tickRateOf` rounds — so hundreds of mutations per run fired on this
gene and every one was a **no-op by construction**. Measured before: `tick.rateStep` 0,
`tick.skipped` 0, `tick.moved` 0/0 in 12,000 ticks. After adding the ±1 step: 124, 437,852, and
germline 0 / population 31.

So: **a gene whose meaning is an integer must be listed in `CHILD_DISCRETE` (excluding it from the
continuous walk) and given its own ±1 step.** Both halves. Without the exclusion, fractional drift
accumulates where nothing reads it and two children at 1.49 and 1.51 behave completely differently
while reporting as the same gene. Enrolment is per gene: #181's `uaFoldMode` and #185's `demeCount`
are in the same position and are deliberately not enrolled (the first is not dead; the second's step
changes a spatial partition that interacts with position).

The step is ±1 with **clamping**, matching the germline's, so the process is symmetric in the interior
and lazy at the ends — leaving rate 1 takes two draws instead of one, a mild bias toward the lockstep
default. Drawing only from the legal directions would push every lineage off the default whether
selection wanted it or not.

**THE GERMLINE CADENCE IS A REACHABILITY CEILING, and it applies to every layer in #181-#192.**
`mutateGenome` runs **38 times in 12,000 ticks** at an effective rate near **0.05**. Any mechanism
gated on one `Math.random()<rate*k` inside it has an expected count **under one per run**. Measured:
`compiler.foldStep` 2, `channel.formStep` 0-1, `probe.drift` 0-1, `cosmos.law` 0-1, `xion.fission` 0-1,
`uplasmid.law` 0. Those are not dead mechanisms — they are sampled below the resolution of a single
run, so **"never fired" on a germline-cadence mechanism carries almost no information**. A layer that
wants to be selected on needs a route that fires at reproduction. #192 is the first one here to use it
for a discrete gene.

Cost: measured within noise (3,000 ticks, 34.5s on / 34.2s off, same population and cluster
trajectory). Temporal isolation costs one modulo per particle per tick.

**Two rig rules this swing established.** (1) `substrate-test`'s destructive blocks (`reachLive`,
`time`) now **snapshot and restore `palive`/`amp`/`px`/`py`** — writing `palive[k]=false` is not how
death happens here, so clusters, towers and the forest registry kept members that no longer existed
and every later block ran on that (measured 8ms/tick → 61ms/tick over 900 ticks against a steady
12ms/tick). (2) #188's allocation-gate check is measured with **`__UA_INHERIT` suppressed**, because
#112's credit pool is a second, legitimate route into the alphabet: a spliced building block carries
the vocabulary of the lineage that *proved* it, not the bank of the one that inherits it. Both facts
are asserted separately; do not "fix" #112 to filter by the inheritor's bank.

### #193 — the shape of an act: an authored verb gets an emission geometry

Each verb in `genome.userEffects` carries `st` (an emission stencil: up to `EMIT_TAPS_MAX`=4 taps of
`[dx,dy,w]` at integer CELL offsets bounded by `EMIT_OFFSET_MAX`=3) and `fr` (frame: 0 world, 1 the
actor's own direction of travel). Absent `st` means one tap underfoot in the world frame — the
pre-#193 engine, on the same code path. Knob `EMIT`.

**THE MAGNITUDE INVARIANT IS THE WHOLE THING. DO NOT TOUCH IT.** `emitApply` divides the weights by
their **ABSOLUTE** sum, so the total written is `|amt|` however many taps there are. If four taps each
wrote `amt`, growing a stencil would be a free 4× on every act — a gene that routes around #132's
conserved mode and #133's realised-amount discipline at once. `substrate-test` checks 24 shape/amount
combinations (worst error: 0). Absolute sum rather than signed sum is deliberate: it is what keeps a
**dipole** (+1 ahead, −1 behind — move a medium rather than add to it) reachable, where signed
normalisation divides by zero.

**`emitApply(v,i,amt,base,fn)` TAKES THE BASE CELL FROM ITS CALLER.** An unshaped verb returns
`fn(base,amt)` — the caller's own original single-cell write, not a one-tap reimplementation of it.
That is what makes `EMIT=0` and an unshaped lineage bit-identical rather than approximately equal.
#153's rule applied to a cell index: read the site's answer, do not restate it.

**A SHAPE ONLY MEANS ANYTHING ON A TARGET THAT IS A PLACE.** `emitPlaceTarget(t)` is true for the
field (9) and the channel bank (11–14) and false for everything else: `amp`, `provision`, trait axes,
`phase`, `mem` and `mutpress` are possessions, and "two cells to the left" is not a thing you can say
about somebody's amplitude. It gates three things together — the write path, the `verb.shaped` census
row, and the rent. Caught live: the first run read `verb.shaped 8/295` with two of the eight verbs
aimed at `mem` and `phase`, i.e. the row reporting adoption for a geometry that cannot act, and the
rent charging for taps that never become writes.

**THE FRAME HAS A REAL BOUNDARY.** `fr=1` rotates the offsets by the actor's velocity, which is what
makes "lay a trail ahead of me" expressible from one stencil. A particle with speed below 1e-4 has no
"ahead" and keeps the world frame — do not replace that with an arbitrary axis; it would be inventing
a heading the physics does not have.

Offsets **clamp**, they do not wrap: the world is a box (walls at `px<8` push back), not a torus. Two
taps landing in the same edge cell is fine — the magnitude invariant is unaffected.

**`chanWrite(k,i,amt,cell)` gained an optional cell** (defaults to the actor's own, so every pre-#193
caller is unchanged). Note `__chanWrites` and `channel.write` now count **cells written, not verbs
fired** — a four-tap verb reports four.

**`sanitizeGenome` REBUILDS each verb, it does not clamp one.** It constructs a fresh object from a
fixed key list, so any field added to a verb anywhere else — the decoder, the wire, the clone — is
silently DELETED the first time it runs, and `decodeGenome` calls it itself. #193 lost its stencil to
exactly this: encoder wrote `st`, decoder read `st`, round-trip still failed. **If you add a field to
a verb, add it to that rebuild in the same edit.** The stencil's clamp lives there and nowhere else.

**Four crossings, all of which needed their own edit.** `cloneGenome` deep-copies to the TAP (an array
of arrays — #155's opStacks, #180's operator bank and #189's channel stencil were all this same
shallow copy). `seedEffectIntoParticle` carries `st`/`fr` on BOTH pushes, its own and the successor's
— #133b's bug was exactly this path stripping a field. The wire carries it with bounds READ from
`EMIT_TAPS_MAX`/`EMIT_OFFSET_MAX` (#153), absent being legal so a pre-#193 peer still lands. And the
save carries it through the rebuild above.

**Two mutation routes, on purpose.** Germline reshape uses a FLOOR (`EMIT_FORM_FLOOR`), the
construction #55 established for verb birth and #192 re-measured: `mutateGenome` runs ~38 times per
12,000 ticks at rate ≈0.05, so a rate-scaled probability there is a coin landing tails. And the shape
steps in `mutateChildGenome` beside #180's operator bank, because that route fires at every birth —
which is what takes `verb.shaped` to 386 population carriers.

`EMIT_TAP_RENT` bills per tap beyond the first (zero for an unshaped bank), which is what makes
`emitFormStep`'s shrink branch profitable and lets the mechanism turn itself off under selection
rather than only under a knob.

### #194 — the grain of a medium, and the five-place rebuild rule

A channel rule carries `res`: how many cells per side it addresses its own lattice at, from
`CHANNEL_RES_SET = [5,8,10,20,40]` — **every value divides `FIELD_W` exactly**, so a block is a whole
number of cells and there is no remainder row at the edge. Seeded `FIELD_W`. Knob `GRAIN`.
`chanRes` **SNAPS** to the set rather than clamping: a value between two grains is not a coarser
grain, it is a lattice with a remainder, which is an off-by-one in the block loop.

**THE STORAGE IS BLOCK-UNIFORM and that is what makes everything else free.** A coarse medium holds
its value redundantly across the `FIELD_W/res` fine cells of each block, so `chanRead` needs no change
(a fine read already returns the medium's value) and #193's emission stencil needs no change (it
simply cannot aim finer than the grain). Do not "optimise" this into a sparse coarse array — three
call sites depend on the redundancy.

**`chanUpdateCoarse` is a separate function and the fine loop is left byte-for-byte as it was.** At
`res===FIELD_W` `updateChannels` takes the original path, not a special case of a general one — the
same exactness guarantee `metDist` (#190) and `emitApply` (#193) give, and `substrate-test` holds it
at 0 of 1600 cells differing against `GRAIN=0`. Block means are **precomputed once** into `__chanBlk`,
not recomputed per stencil tap; per-tap would be `(FIELD_W/res)²` times too much work.

**A WRITE LANDS IN A MEDIUM CELL, NOT A LATTICE CELL.** `chanWrite` puts the same value across the
whole block. Splitting `amt` across it would make a coarse medium swallow every deposit by up to 64×,
so the gene would read as "become deaf" rather than as a grain. The realised delta is one cell's,
which is the block's, which is the medium's.

**THE RENT RUNS DOWNWARD.** A medium's share of `CHANNEL_RENT` scales as `(res/FIELD_W)²`, floored at
`CHANNEL_RES_FLOOR`, because a coarse medium genuinely costs less CPU. This is the only rent in the
file a lineage can REDUCE by changing a gene — deliberate, because a cost on complexity that cannot be
paid down is a ratchet. The TAP rent is not scaled: a tap is a lookup per evaluation either way, and
scaling both would double-count the same saving.

**COARSEN ONLY, and the reason is structural rather than lazy.** The lattice is world state shared by
every carrier of that slot, so a finer grain needs a bigger lattice — one lineage's gene reallocating
a medium others are standing in. That conflict has no arbiter here short of #183's law probation. The
cost is small: 20 pixels is already finer than a particle can resolve.

**THE SIX-PLACE REBUILD RULE — READ THIS BEFORE ADDING A FIELD TO ANY BANKED STRUCTURE.** A channel
rule is rebuilt from a key list in **six** places: `seedSubstrateIntoParticle`, `cloneGenome`,
`sanitizeGenome`, `decodeGenome`, `encodeGenome`, and (since #195) the horizontal-transfer copy. Each silently DELETES every key it does not name. A
new field must be added to all five. #194 got four of them and the fifth was the germline→population
crossing, so `channel.grain` read **germline 2 / population 0 — STRANDED** on a live run while every
other crossing passed. This is the fourth instance of the same shape: #133b (`seedEffectIntoParticle`
stripping a verb's successor), #193 (`sanitizeGenome` deleting the emission stencil), and this one.
A verb record has the same five-place structure. `substrate-test` now checks the seeding route
explicitly for both.

**#189 IS REPAIRED HERE, not just extended.** `chanFormStep` and `chanGrainStep` now also step in
`mutateChildGenome`, because a stencil that can only be reshaped on the germline gets ~38 draws per
12,000 ticks (#192's ceiling). Measured: `channel.formStep` went from 0–1 per run to 7–8. The
chemistry EXPRESSION deliberately stays germline-only — it is drawn from the grammar and a redraw at
every birth would outrun selection on it, the same reason #184's probe bank does not drift there.

**REACHABILITY IS BOUND BY #188, NOT BY #194.** `channel.grainStep` fires 2–4 times per 12,000 ticks
because `channel.bank` crosses to only 10–24 genomes of ~200, and the child route can only step a
medium a child actually has. Raising #194's own rate would not move that. If you want this layer
exercised harder, the thing to fix is the channel bank's crossing rate.

**AND A NOTE ON STRANDED ITSELF, found while chasing the above.** `crossing-test` at TICKS=8000 is red
on #193's committed HEAD as well (`verb.sensed` 4/0 and `phys.chem` 1/0) and red on a *different* row
after #194 (`phys.reach` 1/0). Which rows read stranded varies run to run, because a point-in-time
count cannot distinguish "never crossed" from "crossed and was selected away" — #187's lesson, which
moved `probe.promoted` out of the table, applying to more rows than `probe.promoted`. The flag is
sound early, before anything has been selected away, which is the regime `smoke.sh` uses at TICKS=40.
Anyone raising that budget should expect this and should decide the row's semantics first.

### #195 — a medium is contagious: horizontal transfer of invented chemistry

A channel rule can pass from one particle to another on contact, carrying its whole medium (`expr`,
`st`, `wrap`, `cad`, `res`) into the **same slot index or not at all**, and never over an occupied
slot. Knob `CHANXFER`. Fires inside `executeVM`, where `i` is the driver and `genome` is already
`pGenome[i]`, so the donor is the driver and no extra coin decides who gives.

**THE RATE IS ON THE RULE (`rule.xfer`), NOT ON THE GENOME, and do not move it back.** A host gene for
infectiousness is pure cost to its carrier — the donor pays amplitude and hands a competitor a working
chemistry — and four 12,000-tick runs had `channel.xfer` NEVER firing with the gene evolved to 0.
Selection was right. The element is the unit of selection for a selfish element; `chanRuleXfer` reads
the rule, the rate travels with every copy, and this is the first mechanism in the file whose unit of
selection is smaller than a particle.

**NO BOND GATE.** The first version reused the plasmid gate (`sim * phaseAlign > plasmidTransferThresh`)
and measured 390 gate firings with zero transfers: `sim` is genetic similarity, near-relatives hold the
same slots, so the gate selected for the identity that makes transfer impossible. Transfer's whole
value is the crossing descent cannot make. The gate is the element's rate and nothing else; both ends
already pay (donor `CHANXFER_COST` amplitude, recipient `CHANNEL_RENT`).

**THE SCAN PICKS THE MOST CONTAGIOUS COMPATIBLE SLOT**, not the first — a rate-0 rule in slot 0 shadowed
a contagious rule in slot 3 forever (16,464 declines, zero transfers). And **a recipient with no bank at
all is the point, not an exclusion**: an untouched genome has `channels === undefined`, not
`[null,null,null,null]`, and requiring `Array.isArray` on both sides excluded exactly the particles a
chemistry most needs to reach (2,549 declines, zero transfers). The array is materialised at the moment
of transfer, so a quiet interaction allocates nothing.

**NEW RULES ARE BORN WITH VARIATION IN MOBILITY** (`Math.random()*0.01` at allocation, inside the knob).
Born at zero, every element had to rediscover mobility through a walk that gets ~2 steps per run
(#192's germline ceiling) — rules crept to 2.5e-4 and nothing moved. A trait with no variation at birth
is not a trait selection can act on.

**AND THE BRAKE HAS TO RUN AT THE INFECTION'S SPEED.** #188's release criterion (not sensed, not acted
into, past grace) runs in `mutateGenome` — ~38 times a run, and only on the self — while infection is
per-interaction. That asymmetry is not selection choosing a parasite, it is selection never getting a
vote. The same criterion now runs in `mutateChildGenome` on the carrier's own bank (`channel.shed`).
**That exposed a second defect worth remembering: `age` was incremented only in the germline drift
loop**, so a transferred rule, which arrives at age 0, sat at age 0 forever in every population carrier
and was never eligible to shed. `channel.shed` read 2 against 750 transfers; with the clock ticking, 43.
*A release criterion with an unreachable precondition is not a slow brake — it is no brake, and from the
outside it reads exactly like a slow one.*

**WHAT IT DOES TO A WORLD, measured, so nobody has to discover it:** `channel.bank` goes from population
10–24 to 573–1,050 (of a maximum of 4 × alive). Invented media stop being rare and become close to
universal, which is what unblocks #189's forms and #194's grains (form carriers 14 → 56 and 1 → 141)
and was the point — but it is a real change in character, not a side effect. `channel.xferSensed` is 6
of 778 and 62 of 435, so most arrivals still land where nothing can perceive them. The single lever for
a slower sweep is the birth draw at allocation; it is deliberately not tuned down, because a mechanism
that does not fire is worse than one whose consequences are visible.

### #196 — whose chemistry runs, and the chemistry on the wire

**`updateChannels` DOES NOT READ `chanBank()` ANY MORE, and do not put it back.** It is called once
per tick from the main loop with the ambient genome, which is the self's — so from #188 to #196 the
only reaction rule that ever computed anything was the germline's, and every population copy was
INERT. `channel.bank`'s population count was measuring carriage, not effect (and #195's note said
otherwise; corrected there). Same shape as #102, #130, #132b, #133b and #184: a quantity that is
nominally per-lineage and is always read from the germline.

`chanGoverning(k)` draws the governing rule from the living carriers of slot k — one two-pass weighted
draw per channel update, not per cell — with the germline as fallback when nobody holds that slot.
**Every field of the medium comes from the governing rule, including the cadence**, which is why the
draw happens BEFORE the modulo rather than after it. Knob `CHANGOV`; off restores the germline-only
rule exactly and takes no draw.

One rule per slot is necessary — the lattice is world state and two carriers cannot both compute slot
0 — so the fix is not "let every carrier run its own". What changed is only WHICH one, and the answer
is now numerosity, which is what makes descent and #195's transfer change what the world computes
rather than only who carries a copy.

**THE FIFTH CROSSING WAS OPEN FROM #188 TO #196.** The migrant payload carried `ua`, `ue`, `uo` and
`fd` and no channel rule had ever left a tab, while #188's own comment claimed "a migrant arrives with
a chemistry and an empty medium". Four swings of invented media failing tab→tab, and nothing went red
because no rig owned the question. `chn` now rides the payload in **the save's own row shape** —
`[expr, age, st, wrap, cad, res, xfer]`, one format for a chemistry rather than two — validated with
every bound READ from the engine (#153), installed in SLOT ORDER with an empty slot keeping its
position (ka..kd are index-bound), clamped again on arrival, `age`/`uses` reset. The lattice is not
sent and could not be. `migrant-test` owns this now.

**THE AUDIT RULE THIS ESTABLISHES.** Both defects were found by reading code against its own comments,
not by a red test. When a mechanism's comment asserts a behaviour ("a migrant arrives with a
chemistry"), that assertion is a test that has not been written yet. Two of them were false. If you
add a layer here, check what the layer's own prose claims and make a rig own it.

### #197 — the brakes are laws: the prices and the probation become evolvable

Every price is now a row in `LAW_DECLARED`: `CHANNEL_RENT`, `CHANNEL_TAP_RENT`, `EMIT_TAP_RENT`,
`MET_RENT`, `REACH_RENT`, `UA_OP_RENT`, `PROBE_RENT`, `CHANXFER_COST`, `COMPLEXITY_TOLL` — plus the
three that decide when the world gets stopped: `LAW_VIABLE`, `LAW_PROBATION`, `LAW_COST`, and
`LAW_RATE`. All of them were `const` and are now `let`. Knob `BRAKES`; off pins the table to the
original three physics laws (`LAW_BASE_LAWS`), so every measurement taken before #197 is comparable.

**A PRICE MUST NOT BE A GENOME GENE, and this is the trap to remember.** Rent is paid BY the lineage,
so `genome.rentScale` is not a brake whose strength evolves — it is an off switch every lineage
reaches for on the first mutation, and it sweeps with nothing opposing it. A price is only a price if
the payer cannot set it. The law machinery is the right vehicle because a change there is proposed by
the WORLD, runs a probation, and is reverted if the world cannot hold its population.

**THE SELF-REFERENCE IS CLOSED AT THE TRIAL, NOT AT THE BOUND.** `LAW_VIABLE` is itself a law, so a
proposal to set it to 0 installs 0 and would then be judged by the 0 it just installed — passing by
construction, and handing the mechanism a one-step way to stop reverting anything with no verdict at
all. `__lawTrial` captures `viable` and `probation` **at proposal time** and the verdict uses those.
The same capture is on the IMPORTED law path (#185's uplasmid) or a peer sending a `LAW_VIABLE` change
walks through the same hole. **If you add a law that affects judging, capture it in the trial.**

`LAW_VIABLE.lo` is 0 deliberately — no safe floor. A world can evolve to stop reverting, and one that
will not reverse a bad law dies; that is the world-level verdict.

**THE TABLE GREW FROM 3 TO 16, SO THE RATE HAD TO MOVE WITH IT** — at the old `LAW_RATE` a given brake
would be proposed once per ~400,000 ticks (#179's shape). `LAW_RATE` 0.00004 → 0.0006 and
`LAW_PROBATION` 4000 → 1200. The binding constraint is the probation, not the rate: one law is on
trial at a time, so at most `floor(window / LAW_PROBATION)` verdicts can land. Both are laws, so a
world that finds short probations give bad verdicts can raise them back.

**AND #185's UPLASMID NOW CARRIES ECONOMIES.** The law table holds the prices, so a peer can push a
price change into your world — #185's stated purpose arriving somewhere neither swing intended.
Clamped to the row's bounds and judged by the local probation. Left open on purpose.

Measured: the economy moves in BOTH directions (`UA_OP_RENT` 0.250 → 0.162 kept, `PROBE_RENT` 0.150 →
0.288 kept), which is exactly what a payer-set price could never do. `cosmos.brake` counts price
trials as distinct from the three physics laws. `cosmos.lawRevert` has not yet fired in a live run —
the brake on the brake is checked in the rig and has not had to bite in the wild.

### #186 — the germline-to-population crossing, stated generally

The bug the crossing rows caught for the seventh time, and the general form, because it will happen
again to whoever adds the next gene:

> `genome` is the self and `mutateGenome` authors on it. `pGenome[i]` descends from
> `pGenome[parent]`. The only routes from the germline to the population are a parentless spawn (a
> seed or a post-extinction reboot) and the explicit seeding functions. **So a gene created on the
> germline after the population exists reaches that population only when the world dies** — and in a
> healthy world, which does not die, the two diverge permanently.

`seedSubstrateIntoParticle()` is that route for #181-#185's genes, called once per `mutateGenome`,
into ONE random living particle. Adding a gene to any of those layers means adding a line there.

**And two things that only mean something together must cross to the SAME particle (#188).**
`seedAtomIntoParticle(atomIdx, into)` takes an optional carrier for exactly this reason. Measured:
75 population genomes held channel rules, 46 held a sensing atom, and `channel.sensed` — which asks
for both in ONE genome — read zero, because the two hand-offs each picked their own random target. A
genome with a medium it cannot perceive pays rent for nothing; one that perceives a medium it does not
have reads a constant zero. #141's rule ("the vocabulary travels with the program") applies to a
chemistry and the sense for it, and this one took instrumenting rather than reasoning — two guesses
missed it.
The probe bank crosses WITHOUT its record, deliberately: a promotion is earned against a particular
carrier's fitness history, and handing a fresh carrier someone else's hit rate is the one way that
mechanism could lie.

**And a bank that crosses still has to be EXERCISED.** `scoreProbes` runs in the self's context, so
the first version scored the germline and nothing else — every population probe crossed and
accumulated zero claims. One random carrier per tick is now scored with `genome` repointed and
restored in a `finally` (`uaCall`, `uaCompile` and `probePromoted` all read the ambient genome).
That is #102's lesson — "credit measured a pool selection never saw" — in a fifth mechanism.

**Not every quantity belongs in the crossing table (#187).** `probe.promoted` was a
`CROSSING_DECLARED` row for one commit and should not have been. STRANDED means "authored and
evolutionarily invisible"; a promotion is an EARNED OUTCOME, and a population probe earns one from
scratch because the seeding path withholds the parent's record on purpose. So germline 1 / population
0 is the normal state of a young world and the row reported it as a build failure. `probe.bank`
answers the crossing question; the promotion count lives in the `OPS` epoch log (columns 5 and 6,
germline and population — pre-#187 rows are 4 long and stay that way). Same rule the `__opReach` note
above already states, and worth restating because it was broken the commit after it was written.

**`crossing-test` is RED at realistic tick counts, and has been since before #180.** `verb.sensed`
reads germline 2 / population 0 at `TICKS=2500` on the unmodified #179 engine as well as on current
head: `remapEffectAx` matches a verb's sense gate across genomes BY EXPRESSION and returns -1 when the
recipient carries no atom with the same text, so a sensed verb crosses ungated by design (#139's own
note says so). `smoke.sh` runs the rig at `TICKS=40`, which is before any verb has a gate, so the row
reads 0/0 and the suite passes. **"smoke.sh: 0 failing" means 0 failing at forty ticks.** Anyone
raising that budget should expect this row and should decide #139's question first.

**Two instrument defects worth remembering as patterns.** `level.vanished` fired on the STATE rather
than the transition (146 times in 12,000 ticks, because `forest` reads 0 most of a run) — a census
that reports a constant as an event is worse than no census. And `xion.fuse` fired 296 times in a run
where `xion.bud` and `xion.fission` fired zero, because fusion faced a weaker gate than division:
**a mode comparison where the modes face different gates is a subsidy, not a comparison**, and
selection would have read it as fusion being better rather than cheaper.
