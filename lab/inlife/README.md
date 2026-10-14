# lab/inlife - do programs matter to who is born, who survives? (13 Oct 2026)

Five pre-registered experiments on `engine.html` at defaults, written without relying on the notes. Each `PREREG-*.md` was locked (sha256 below) before its
deciding run; the deciding seeds had never been run before. Run from the repo root; each probe boots the engine headless through `harness-env.js` and reads raw arrays.
Raw run outputs are not committed (the session scratchpad held them); every number in OEE-NOTES #302 comes from these scripts.

| question | prereg (sha256 prefix) | probe | analysis | seeds |
|---|---|---|---|---|
| revert accumulated in-life change: adaptive? | PREREG-inlife (3f197fe0fc732829) | probe5.js | analyse5.js | 11-15 |
| can survival see a program effect (temporary blank, random code)? | PREREG-scramble (52e3d0a5c0655e41) | probe6.js | analyse6.js | 21-28 |
| permanent blank, re-emptied every 20 ticks | PREREG-permblank (90a3013201ad1f37) | probe7.js | analyse7.js | 31-38 |
| whole population blank, tick 1500-4000, against four draw-order nulls | PREREG-popblank (a0176d7243af8c93) | probe8.js | analyse8.js | 41-48 |
| the same at tick 6000-8000, with births split by route | PREREG-popblank-late (b2c882cb6ce8130b) | probe8b.js | analyse9.js | 51-56 (+ seed 1 apart) |
| which code site produces each birth | (diagnostic, no rule) | probe9.js | - | 41 |
| whole population blank: trait dispersion, lineages alive, lineages minted (FIRST RUN; the minted column is INVALID, it read a stale variable) | PREREG-popblank-traits (7ad1c6ed9f526055) | probe10.js | analyse10.js | 61-68 |
| the same, corrected counter (`nextLineageID`), dispersion and lineages alive pooled with the first run | PREREG-popblank-traits-b (d5f9ca93999787d4) | probe10b.js | analyse10b.js | 71-78 (+ 61-68 pooled) |
| which opcodes are carried and which are executed (exploratory, no rule; wraps vmStep) | - | probe16.js | (inline, see OEE-NOTES #304) | 1-4 |
| is a new lineage ever minted, and by what source (exploratory, no rule) | - | probe11.js, probe12.js | - | 1-3; 71, 72, 76 |
| are births limited by the shared energy pool? (halve / double BIRTH_ENERGY_COST) | PREREG-birthcost (1ab3bc3d27107a9c) | probe13.js | analyse13.js | 81-88 |
| VM retire-or-prove, first attempt (BLANKVM=1, empty programs): INCONCLUSIVE | PREREG-vm-retire-or-prove (e1e203d6fc547229) | harness-oee.js (BLANKVM) | analyse14.js d14 | 91-95 |
| VM switched off (BLANKVM=3: executeVM / executeClusterVM / executeSoloVM are no-ops), pilot: seen seeds 1-3, exploratory | - | probe14.js | - | 1-3 |
| VM retire-or-prove, third attempt (BLANKVM=3, VM switched off) | PREREG-vm-retire-or-prove-c (e69cc6f6c34d0c0c) | harness-oee.js (BLANKVM=3) | analyse14.js d17 | 102-106 |
| VM retire-or-prove, second attempt (BLANKVM=2, one inert instruction): DECORATION | PREREG-vm-retire-or-prove-b (4a8bd26bf90eba8d) | harness-oee.js (BLANKVM=2) | analyse14.js d15 | 96-101 |

Usage: `SEED=11 T=1500 END=4000 OUT=run.json node lab/inlife/probe5.js`; the population probes also take `MODE=BLANK|NUDGE K=1..4`.
Analysis: `node lab/inlife/analyse8.js <dir>` where `<dir>` holds a `d8/` folder of `<seed>-<MODE>-<K>.json` files (the analysis scripts name the folder they read).
The probes wrap `addParticle` / `addCompound` to count successful births; the wrappers draw no random numbers. The NUDGE arm consumes k draws at the intervention tick and
changes nothing else.
