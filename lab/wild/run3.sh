#!/bin/bash
# lab/wild/run3.sh - WILD-MIND-3 runs (lab/WILD-MIND-3.md): explorer + earner-judge. Every arm runs with INCOME=1 (it does not
# move the world: smoke-checked) and writes its income JSONL (INCOME_OUT) beside its .json. Skips finished runs (.done), so
# it can be relaunched after a box restart. Run from a FROZEN worktree of the commit carrying the pre-registration.
#   ROOT=<worktree> OUT=<dir> SEEDS="3541 3542 3543" REPS="0 1 2 3 4 5" PAR=4 TICKS=20000 bash lab/wild/run3.sh
set -u
# EARNER/TWIN/ESHAM (MIND_MODE=6/7, NOSEL_PROG) and INCOME were DELETED after the NO-GO (lab/WILD-MIND-3.md).
# The engine no longer has those modes, so those arms would be wrong: refuse them.
case " ${ARMS:-EARNER TWIN ESHAM UNIFORM LEARN OFF} " in
  *" EARNER "*|*" TWIN "*|*" ESHAM "*) [ "${ALLOW_DELETED:-0}" = 1 ] || { echo 'run3.sh: EARNER/TWIN/ESHAM were deleted from engine.html; use frozen worktree bc8d2bb to reproduce (ALLOW_DELETED=1)'; exit 2; };;
esac
ROOT=${ROOT:?}; OUT=${OUT:?}; SEEDS=${SEEDS:?}; REPS=${REPS:-0 1 2 3 4 5}; PAR=${PAR:-4}; TICKS=${TICKS:-20000}
ARMS=${ARMS:-EARNER TWIN ESHAM UNIFORM LEARN OFF}
mkdir -p "$OUT"
jobs_list=()
for s in $SEEDS; do for k in $REPS; do for a in $ARMS; do jobs_list+=("$a $s $k"); done; done; done
one(){ local a=$1 s=$2 k=$3
  local f="$OUT/$a.$s.$k"
  [ -f "$f.done" ] && return 0
  local env="SEED=$s TICKS=$TICKS NULLSHIFT=$k INCOME=1 INCOME_OUT=$f.jsonl"
  case $a in
    OFF) ;;
    LEARN) env="$env MIND=20 MIND_MODE=0 MIND_SEED=$((k+1))";;
    UNIFORM) env="$env MIND=20 MIND_MODE=2 MIND_SEED=$((k+1))";;
    EARNER) env="$env MIND=20 MIND_MODE=6 MIND_SEED=$((k+1))";;
    ESHAM) env="$env MIND=20 MIND_MODE=7 MIND_SEED=$((k+1))";;
    TWIN) env="$env MIND=20 MIND_MODE=6 MIND_SEED=$((k+1)) NOSEL_PROG=1";;
    *) echo "unknown arm $a"; return 1;;
  esac
  env $env node "$ROOT/harness-sweep.js" > "$f.json" 2> "$f.err" && node -e 'JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"))' "$f.json" && touch "$f.done"
}
export -f one; export ROOT OUT TICKS
printf '%s\n' "${jobs_list[@]}" | xargs -P "$PAR" -L 1 bash -c 'one $0 $1 $2'
touch "$OUT/ALL.done.$(date +%s)"
