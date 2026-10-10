#!/bin/bash
# lab/wild/run2.sh - WILD-MIND-2 runs (lab/WILD-MIND-2.md): explorer + keeper. Skips finished runs (.done beside each .json),
# so it can be relaunched after a box restart. Run from a FROZEN worktree of the commit carrying the pre-registration.
#   ROOT=<worktree> OUT=<dir> SEEDS="3421 3422 3423" REPS="0 1 2 3 4 5" PAR=4 TICKS=20000 bash lab/wild/run2.sh
set -u
# KEEPER/SHAM (MIND_MODE=4/5) were DELETED after the NO-GO (lab/WILD-MIND-2.md). The engine no longer has those modes,
# so a KEEPER/SHAM run would be wrong: refuse them.
case " ${ARMS:-OFF LEARN UNIFORM SHAM KEEPER} " in
  *" KEEPER "*|*" SHAM "*) [ "${ALLOW_DELETED:-0}" = 1 ] || { echo 'run2.sh: KEEPER/SHAM were deleted from engine.html; use frozen worktree 66a25f8 to reproduce (ALLOW_DELETED=1)'; exit 2; };;
esac
ROOT=${ROOT:?}; OUT=${OUT:?}; SEEDS=${SEEDS:?}; REPS=${REPS:-0 1 2 3 4 5}; PAR=${PAR:-4}; TICKS=${TICKS:-20000}
ARMS=${ARMS:-OFF LEARN UNIFORM SHAM KEEPER}
mkdir -p "$OUT"
jobs_list=()
for s in $SEEDS; do for k in $REPS; do for a in $ARMS; do jobs_list+=("$a $s $k"); done; done; done
one(){ local a=$1 s=$2 k=$3; local f="$OUT/$a.$s.$k"
  [ -f "$f.done" ] && return 0
  local env="SEED=$s TICKS=$TICKS NULLSHIFT=$k"
  case $a in
    OFF) ;;
    LEARN) env="$env MIND=20 MIND_MODE=0 MIND_SEED=$((k+1))";;
    UNIFORM) env="$env MIND=20 MIND_MODE=2 MIND_SEED=$((k+1))";;
    KEEPER) env="$env MIND=20 MIND_MODE=4 MIND_SEED=$((k+1))";;
    SHAM) env="$env MIND=20 MIND_MODE=5 MIND_SEED=$((k+1))";;
    *) echo "unknown arm $a"; return 1;;
  esac
  env $env node "$ROOT/harness-sweep.js" > "$f.json" 2> "$f.err" && node -e 'JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"))' "$f.json" && touch "$f.done"
}
export -f one; export ROOT OUT TICKS
printf '%s\n' "${jobs_list[@]}" | xargs -P "$PAR" -L 1 bash -c 'one $0 $1 $2'
touch "$OUT/ALL.done.$(date +%s)"
