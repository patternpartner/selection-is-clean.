# selection-is-clean

An open-ended-evolution artwork. `engine.html` is one universe; `universe.html` is a Web Worker
shell around it; `index.html` is a field of them; `metabolism.html` is the panel.

## Branching

**Always update `main`.** Work on whatever feature branch the session designates, but do not leave
it there — fast-forward `main` and push it as part of finishing the work. Do not wait to be asked.

```
git checkout main && git merge --ff-only <branch> && git push -u origin main
```

## Before you push

- `node substrate-test.js` — the acceptance rig. **Green means green AT THE BUDGET, ON THE
  TRAJECTORY, AND ON THE SEED IT RAN.** Run it at `TICKS=900`, at the default, at `TICKS=40` (what
  `smoke.sh` uses), and with `FOUND=0` as well as on: six rows have been red at one budget and green
  at another, and four of those turned out to be real bugs hiding behind "budget sensitivity".
- **SEED matters and the rig defaults to `SEED=1`.** `harness-env.js` seeds `Math.random` from
  `SEED||'1'`, so a single run is one trajectory, not the rig's verdict. `#216c` found a row that
  passes on 5 of 6 seeds at `TICKS=40` and fails on the sixth — and `smoke.sh` only ever runs seed 1,
  so the suite had been passing on which seed happened to land where. If a row goes red, run
  `SEED=1..6` before believing either the failure or the fix.
- **`FOUND=0` only became a real arm in `#216d`.** Nothing read `process.env.FOUND`: the engine reads
  `globalThis.__FOUND`, `FOUND` was absent from `harness-env.js`'s `KNOBS`, and `substrate-test` did
  not call `applyKnobs` at all. So the instruction above was, for its whole life, asking for the same
  run twice. Both are fixed. **The general rule, which this file broke in its own setup steps: an env
  var with no line in `KNOBS` and no `applyKnobs` call is not a control, it is a no-op that reads
  like one.**
- `./smoke.sh` — boots every rig briefly. `slot-test`, `layers-test` and `collective-test` drive a
  real browser and are the only things that catch anything about the field's layout or its controls.
- A single run is not a measurement. Three seeds, or say out loud that it is one seed.

## Three traps this repo has paid for repeatedly

- **A rig embeds the engine's source in a JS template literal.** A backtick anywhere in a comment
  you add to `engine.html` or to a rig's appended block terminates that literal. It fails as
  `missing ) after argument list`, hundreds of lines from the cause.
- **`#196` draws the governing channel rule from the living CARRIERS**, germline only as fallback.
  So setting `genome.channels` and running the sim measures a stranger's chemistry unless you clear
  the population's banks — every tick, because reproduction re-seeds them — and assert
  `governedBySelf`. This has bitten three separate blocks.
- **An unbounded value is not automatically a bug here, and the decision that made it unbounded
  lives in `OEE-NOTES.md`, not in the code.** `maybe(val,min,max,magnitude)` ignores `min` and
  `max` at all 66 call sites *on purpose* — `#148` records the author declining to clamp it, in
  their own words, and says outright that the note exists "so a later reader does not helpfully
  undo them". A later reader re-found it anyway and wrote it up as a defect (`#205`). **Before
  calling anything unbounded, unclamped, or missing a guard a bug, grep `OEE-NOTES.md` for the
  gene and for the word STANDING.** The engine's own comments carry the same decisions; read the
  comment above the function before the function.

See `OEE-NOTES.md` for the running record and `CODEMAP.md` for where things live. Both are written
so that the wrong version of a claim stays on the page next to the corrected one.
