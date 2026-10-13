#!/bin/bash
# lab/scatterer/watch.sh - SCATTER 4 (the census, no swaps) changes nothing: rows with the "scat" field removed are
# byte-identical to the same world without SCATTER (scratch seed 7890, 40,000 ticks, CHEM_BIG+FLUXALL).
HERE=$(cd "$(dirname "$0")/.." && pwd); T=$(mktemp -d)
strip(){ node -e 'const rl=require("readline").createInterface({input:process.stdin});rl.on("line",l=>{const r=JSON.parse(l);delete r.scat;delete r.wallS;console.log(JSON.stringify(r));});'; }
( SEED=7890 TICKS=40000 EVERY=1000 OPTS='{"CHEM":1,"CHEM_BIG":1,"FLUXALL":1}' node "$HERE/core-run.js" | strip > "$T/a" ) &
( SEED=7890 TICKS=40000 EVERY=1000 OPTS='{"CHEM":1,"CHEM_BIG":1,"FLUXALL":1,"SCATTER":4}' node "$HERE/core-run.js" | strip > "$T/b" ) & wait
if cmp -s "$T/a" "$T/b"; then echo "WATCH IDENTICAL to plain (rows minus scat, 40k)"; r=0; else echo "WATCH DIFFERS"; r=1; fi; rm -rf "$T"; exit $r
