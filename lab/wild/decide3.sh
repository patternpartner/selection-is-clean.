#!/bin/bash
# lab/wild/decide3.sh - the WILD-MIND-3 deciding round, exactly as lab/WILD-MIND-3.md locks it. Relaunchable (skips finished).
#   FROZEN=<frozen worktree> OUT=<dir> bash lab/wild/decide3.sh   (run under setsid nohup)
set -u
FROZEN=${FROZEN:?}; OUT=${OUT:?}
ROOT=$FROZEN OUT=$OUT SEEDS="3541 3542 3543" REPS="0 1 2 3 4 5" PAR=${PAR:-4} TICKS=20000 bash "$FROZEN/lab/wild/run3.sh"
node "$FROZEN/lab/wild/score3.js" "$OUT" > "$OUT/SCORE.txt" 2>&1
echo "ALL-DONE $(date)" >> "$OUT/SCORE.txt"
