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

- `node substrate-test.js` — the acceptance rig. **Green means green AT THE BUDGET AND ON THE
  TRAJECTORY IT RAN.** Run it at `TICKS=900` and at the default, and with `FOUND=0` as well as on:
  four rows have been red on HEAD at one budget and green at another, and three of those turned out
  to be real bugs hiding behind "budget sensitivity".
- `./smoke.sh` — boots every rig briefly. `slot-test`, `layers-test` and `collective-test` drive a
  real browser and are the only things that catch anything about the field's layout or its controls.
- A single run is not a measurement. Three seeds, or say out loud that it is one seed.

## Two traps this repo has paid for repeatedly

- **A rig embeds the engine's source in a JS template literal.** A backtick anywhere in a comment
  you add to `engine.html` or to a rig's appended block terminates that literal. It fails as
  `missing ) after argument list`, hundreds of lines from the cause.
- **`#196` draws the governing channel rule from the living CARRIERS**, germline only as fallback.
  So setting `genome.channels` and running the sim measures a stranger's chemistry unless you clear
  the population's banks — every tick, because reproduction re-seeds them — and assert
  `governedBySelf`. This has bitten three separate blocks.

See `OEE-NOTES.md` for the running record and `CODEMAP.md` for where things live. Both are written
so that the wrong version of a claim stays on the page next to the corrected one.
