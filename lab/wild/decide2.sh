#!/bin/bash
# lab/wild/decide2.sh - the WILD-MIND-2 deciding round, end to end. Relaunch-safe (run2.sh skips finished runs).
#   FROZEN=<frozen worktree> OUT=<dir> BRANCH_WT=<cos/wild-mind-2 worktree> bash lab/wild/decide2.sh
set -u
FROZEN=${FROZEN:?}; OUT=${OUT:?}; BRANCH_WT=${BRANCH_WT:?}
ROOT=$FROZEN OUT=$OUT SEEDS="3421 3422 3423" REPS="0 1 2 3 4 5" PAR=${PAR:-4} bash "$FROZEN/lab/wild/run2.sh"
n=$(ls "$OUT"/*.done 2>/dev/null | wc -l)
if [ "$n" -ge 90 ] && [ ! -f "$OUT/ALL-DONE" ]; then
  node "$FROZEN/lab/wild/score2.js" "$OUT" > "$OUT/SCORE.txt" 2>&1
  date > "$OUT/ALL-DONE"
  { echo; echo "## Deciding round result (seeds 3421-3423, $(date '+%Y-%m-%d %H:%M %Z'), scored by lab/wild/score2.js from frozen $(git -C "$FROZEN" rev-parse --short HEAD))"; echo; echo '```'; cat "$OUT/SCORE.txt"; echo '```'; } >> "$BRANCH_WT/lab/WILD-MIND-2.md"
  git -C "$BRANCH_WT" commit -q -m "WILD-MIND-2: deciding round scored (auto, decide2.sh)" -- lab/WILD-MIND-2.md && git -C "$BRANCH_WT" push -q
fi
