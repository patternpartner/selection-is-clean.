#!/bin/bash
# lab/wild/run.sh - the wild-mind runs (lab/WILD-MIND.md). Skips finished runs (a .done beside each .json), so it can be
# relaunched after a box restart. Runs harness-sweep.js from the worktree given as ROOT (a frozen worktree for the deciding round).
#   ROOT=<worktree> OUT=<dir> SEEDS="3411 3412 3413" REPS="0 1 2 3" PAR=4 TICKS=20000 bash lab/wild/run.sh
set -u
ROOT=${ROOT:?}; OUT=${OUT:?}; SEEDS=${SEEDS:?}; REPS=${REPS:-0 1 2 3}; PAR=${PAR:-4}; TICKS=${TICKS:-20000}
mkdir -p "$OUT"
jobs_list=()
for s in $SEEDS; do for k in $REPS; do for a in OFF LEARN UNIFORM SURPRISE; do jobs_list+=("$a $s $k"); done; done; done
one(){ local a=$1 s=$2 k=$3 f="$OUT/$a.$s.$k"
  [ -f "$f.done" ] && return 0
  local env="SEED=$s TICKS=$TICKS NULLSHIFT=$k"
  case $a in
    OFF) ;;
    LEARN) env="$env MIND=20 MIND_MODE=0 MIND_SEED=$((k+1))";;
    UNIFORM) env="$env MIND=20 MIND_MODE=2 MIND_SEED=$((k+1))";;
    SURPRISE) env="$env MIND=20 MIND_MODE=3 MIND_SEED=$((k+1))";;
  esac
  env $env node "$ROOT/harness-sweep.js" > "$f.json" 2> "$f.err" && node -e 'JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"))' "$f.json" && touch "$f.done"
}
export -f one; export ROOT OUT TICKS
printf '%s\n' "${jobs_list[@]}" | xargs -P "$PAR" -L 1 bash -c 'one $0 $1 $2'
touch "$OUT/ALL.done.$(date +%s)"
