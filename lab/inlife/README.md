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

Usage: `SEED=11 T=1500 END=4000 OUT=run.json node lab/inlife/probe5.js`; the population probes also take `MODE=BLANK|NUDGE K=1..4`.
Analysis: `node lab/inlife/analyse8.js <dir>` where `<dir>` holds a `d8/` folder of `<seed>-<MODE>-<K>.json` files (the analysis scripts name the folder they read).
The probes wrap `addParticle` / `addCompound` to count successful births; the wrappers draw no random numbers. The NUDGE arm consumes k draws at the intervention tick and
changes nothing else.
