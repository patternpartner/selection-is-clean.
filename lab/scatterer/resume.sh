#!/bin/bash
# lab/scatterer/resume.sh - resume exactness, all four SCATTER modes: 40,000 straight against 23,000 + save + load + 17,000.
# Scratch seed 7890 (not a deciding seed).
HERE=$(cd "$(dirname "$0")/.." && pwd); T=$(mktemp -d); bad=0
for m in 1 2 3 4; do o='{"CHEM":1,"CHEM_BIG":1,"FLUXALL":1,"SCATTER":'$m'}'
  ( SEED=7890 TICKS=40000 EVERY=1000 OPTS="$o" node "$HERE/core-run.js" | sed 's/"wallS":[0-9.]*//' > "$T/s$m" ) &
  ( SEED=7890 TICKS=23000 EVERY=1000 OPTS="$o" SAVE="$T/sv$m" node "$HERE/core-run.js" | sed 's/"wallS":[0-9.]*//' > "$T/r$m" && LOAD="$T/sv$m" TICKS=17000 EVERY=1000 node "$HERE/core-run.js" | sed 's/"wallS":[0-9.]*//' >> "$T/r$m" ) & done; wait
for m in 1 2 3 4; do if cmp -s "$T/s$m" "$T/r$m"; then echo "SCATTER $m resume EXACT ($(tail -1 $T/s$m | grep -o '"scat":{[^}]*' | sed 's/"snew":\[[^]]*\]//' | cut -c1-120))"; else echo "SCATTER $m resume DIVERGES"; bad=1; fi; done
rm -rf "$T"; exit $bad
