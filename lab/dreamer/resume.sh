#!/bin/bash
# lab/dreamer/resume.sh - resume exactness, all three DREAM modes: 24,000 straight against 13,000 + save + load + 11,000
# (mid-period at D_EVERY 5,000, after two releases). Scratch seed 7490 (not a deciding seed).
HERE=$(cd "$(dirname "$0")/.." && pwd); T=$(mktemp -d); bad=0
for m in 1 2 3; do o='{"CHEM":1,"CHEM_BIG":1,"FLUXALL":1,"DREAM":'$m',"D_EVERY":5000}'
  ( SEED=7490 TICKS=24000 EVERY=1000 OPTS="$o" node "$HERE/core-run.js" | sed 's/"wallS":[0-9.]*//' > "$T/s$m" ) &
  ( SEED=7490 TICKS=13000 EVERY=1000 OPTS="$o" SAVE="$T/sv$m" node "$HERE/core-run.js" | sed 's/"wallS":[0-9.]*//' > "$T/r$m" && LOAD="$T/sv$m" TICKS=11000 EVERY=1000 node "$HERE/core-run.js" | sed 's/"wallS":[0-9.]*//' >> "$T/r$m" ) & done; wait
for m in 1 2 3; do if cmp -s "$T/s$m" "$T/r$m"; then echo "DREAM $m resume EXACT ($(tail -1 $T/s$m | grep -o '"dream":{[^}]*}'))"; else echo "DREAM $m resume DIVERGES"; bad=1; fi; done
rm -rf "$T"; exit $bad
