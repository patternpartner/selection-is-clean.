#!/bin/bash
# lab/port/trickle-batch.sh [MAXNEW] [PAR] - the 12 runs of PREREG-trickle.md (#362). Skips finished runs; relaunch until "all done".
cd "$(dirname "$0")/../.."; OUT=lab/port/out-trickle; MAXNEW=${1:-6}; PAR=${2:-4}; mkdir -p $OUT; todo=()
for s in 9801 9802 9803 9804 9805 9806; do for a in OLD TRICKLE; do [ -e $OUT/${s}_$a.done ] && continue; rm -f $OUT/${s}_$a.jsonl; todo+=("$s $a"); done; done
[ ${#todo[@]} -eq 0 ] && { echo "all done"; exit 0; }
printf '%s\n' "${todo[@]:0:$MAXNEW}" | OUT=$OUT xargs -P $PAR -L 1 bash -c 's=$0; a=$1; K=; [ $a = TRICKLE ] && K="TASK_TRICKLE=200"
 env SEED=$s TASKS=1 $K TICKS=40000 BLOCK=5000 WALLMIN=${WALLMIN:-900} node lab/port/probe-arrivals.js > $OUT/${s}_$a.jsonl 2> $OUT/${s}_$a.err && touch $OUT/${s}_$a.done; echo "done ${s}_$a $(date +%H:%M)"'
left=$(( ${#todo[@]} - MAXNEW )); [ $left -gt 0 ] && echo "$left left" || echo "all done"
