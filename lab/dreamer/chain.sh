#!/bin/bash
# lab/dreamer/chain.sh OUT - the whole registered round, unattended: deciding round -> score. No trial (parameters fixed in DREAMER.md).
# Markers: OUT/decide/ALL.done, OUT/SCORE.txt; a rerun skips finished runs.
OUT=$1; H=$(cd "$(dirname "$0")" && pwd); mkdir -p "$OUT"
PAR=${PAR:-8} "$H/run.sh" "$H/decide.jobs" "$OUT/decide" 1200000
node "$H/score.js" "$OUT/decide" > "$OUT/SCORE.txt" 2>&1
