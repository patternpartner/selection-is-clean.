#!/bin/bash
# lab/locksmith/chain.sh OUT - the whole registered round, unattended: trial -> pick.js (rule + gate) -> deciding round -> score.
# Every stage leaves a marker (OUT/trial/ALL.done, OUT/PICK.txt, OUT/decide/ALL.done, OUT/SCORE.txt); a rerun skips finished runs.
OUT=$1; H=$(cd "$(dirname "$0")" && pwd); mkdir -p "$OUT"
PAR=${PAR:-9} "$H/run.sh" "$H/trial.jobs" "$OUT/trial" 300000
node "$H/pick.js" "$OUT/trial" "$OUT/decide.jobs" > "$OUT/PICK.txt" 2>&1; rc=$?
[ $rc -ne 0 ] && { echo "chain stopped at trial (rc $rc)" >> "$OUT/PICK.txt"; exit 0; }
PAR=${PAR:-9} "$H/run.sh" "$OUT/decide.jobs" "$OUT/decide" 1200000
node "$H/score.js" "$OUT/decide" > "$OUT/SCORE.txt" 2>&1
