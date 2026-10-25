#!/bin/bash
# lab/port/default-batch.sh [MAXNEW] [PAR] - the 24 runs of PREREG-default.md (#351). Skips finished runs (.done), deletes the
# .json of an unfinished one, starts at most MAXNEW new runs, PAR at a time. Relaunch until it prints "all done".
cd "$(dirname "$0")/../.."; OUT=lab/port/out-default; MAXNEW=${1:-6}; PAR=${2:-6}; mkdir -p $OUT; todo=()
for s in 9201 9202 9203; do for arm in T0 D0 T1 D1 T2 D2 D3 R0; do [ -e $OUT/${s}_$arm.done ] && continue; rm -f $OUT/${s}_$arm.json; todo+=("$s $arm"); done; done
[ ${#todo[@]} -eq 0 ] && { echo "all done"; exit 0; }
printf '%s\n' "${todo[@]:0:$MAXNEW}" | OUT=$OUT xargs -P $PAR -L 1 bash -c 's=$0; arm=$1; k=${arm#?}; K=; [ ${arm:0:1} = T ] && K="TASKS=1"; [ ${arm:0:1} = R ] && K="REPL=1"
 env $K NULLSHIFT=$k SEED=$s TICKS=20000 SAMPLE=1000 ESTABLISH=1000 ESTWARM=2000 ESTN=10 node harness-oee.js > $OUT/${s}_$arm.json 2> $OUT/${s}_$arm.err && touch $OUT/${s}_$arm.done; echo "done ${s}_$arm $(date +%H:%M:%S)"'
left=$(( ${#todo[@]} - MAXNEW )); [ $left -gt 0 ] && echo "$left left" || echo "all done"
