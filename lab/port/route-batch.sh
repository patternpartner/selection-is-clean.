#!/bin/bash
# lab/port/founder-batch.sh [MAXNEW] [PAR] - the 30 runs of PREREG-route.md (#355). Skips finished runs; relaunch until "all done".
cd "$(dirname "$0")/../.."; OUT=lab/port/out-route; MAXNEW=${1:-10}; PAR=${2:-5}; mkdir -p $OUT; todo=()
for s in 9601 9602 9603 9604 9605 9606 9607 9608 9609 9610; do for a in MUTONLY DEFAULT OLD; do [ -e $OUT/${s}_$a.done ] && continue; rm -f $OUT/${s}_$a.jsonl; todo+=("$s $a"); done; done
[ ${#todo[@]} -eq 0 ] && { echo "all done"; exit 0; }
printf '%s\n' "${todo[@]:0:$MAXNEW}" | OUT=$OUT xargs -P $PAR -L 1 bash -c 's=$0; a=$1; case $a in MUTONLY) K="TASKS=1 TASK_FOUNDER=0 TASK_MUT=1";; DEFAULT) K="TASKS=1";; OLD) K="TASKS=1 TASK_FOUNDER=0 TASK_MUT=0";; esac
 env SEED=$s TICKS=10000 BLOCK=1000 WALLMIN=100 $K node lab/port/probe-arrivals.js > $OUT/${s}_$a.jsonl 2> $OUT/${s}_$a.err && touch $OUT/${s}_$a.done; echo "done ${s}_$a $(date +%H:%M:%S)"'
left=$(( ${#todo[@]} - MAXNEW )); [ $left -gt 0 ] && echo "$left left" || echo "all done"
