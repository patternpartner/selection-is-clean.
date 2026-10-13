#!/bin/bash
# lab/ceiling/chain.sh OUT - deciding runs -> score. A rerun skips finished runs.
OUT=$1; H=$(cd "$(dirname "$0")" && pwd); mkdir -p "$OUT"
PAR=${PAR:-8} "$H/run.sh" "$H/decide.jobs" "$OUT/decide" 1200000
node "$H/score.js" "$OUT/decide" > "$OUT/SCORE.txt" 2>&1
