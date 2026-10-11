#!/bin/bash
# lab/locksmith/resume.sh - resume exactness, all three REACH modes: 24,000 straight against 13,000 + save + load + 11,000
# (mid-period at R_EVERY 5,000, after two exits opened). Scratch seed 7290 (not a trial or deciding seed).
HERE=$(cd "$(dirname "$0")/.." && pwd); T=$(mktemp -d); bad=0
for m in 1 2 3; do o='{"CHEM":1,"CHEM_BIG":1,"FLUXALL":1,"REACH":'$m',"R_EVERY":5000}'
  ( SEED=7290 TICKS=24000 EVERY=1000 OPTS="$o" node "$HERE/core-run.js" | sed 's/"wallS":[0-9.]*//' > "$T/s$m" ) &
  ( SEED=7290 TICKS=13000 EVERY=1000 OPTS="$o" SAVE="$T/sv$m" node "$HERE/core-run.js" | sed 's/"wallS":[0-9.]*//' > "$T/r$m" && LOAD="$T/sv$m" TICKS=11000 EVERY=1000 node "$HERE/core-run.js" | sed 's/"wallS":[0-9.]*//' >> "$T/r$m" ) & done; wait
for m in 1 2 3; do if cmp -s "$T/s$m" "$T/r$m"; then echo "REACH $m resume EXACT ($(tail -1 $T/s$m | grep -o '"reach":{[^}]*}'))"; else echo "REACH $m resume DIVERGES"; bad=1; fi; done
rm -rf "$T"; exit $bad
