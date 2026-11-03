#!/bin/bash
# lab/port/prey-batch.sh [MAXNEW] [PAR] - the 16 runs of PREREG-prey.md (#366). Skips finished runs; relaunch until "all done".
cd "$(dirname "$0")/../.."; OUT=lab/port/out-prey; MAXNEW=${1:-16}; PAR=${2:-3}; mkdir -p $OUT; todo=()
for s in 9901 9902 9903 9904 9905 9906 9907 9908; do for a in PREY NOPREY; do [ -e $OUT/${s}_$a.done ] && continue; rm -f $OUT/${s}_$a.jsonl; todo+=("$s $a"); done; done
[ ${#todo[@]} -eq 0 ] && { echo "all done"; exit 0; }
printf '%s\n' "${todo[@]:0:$MAXNEW}" | OUT=$OUT xargs -P $PAR -L 1 bash -c 's=$0; a=$1; K=; [ $a = NOPREY ] && K="REPL_PREY=0"
 env SEED=$s TASKS=1 $K TICKS=40000 BLOCK=5000 WALLMIN=900 node lab/port/probe-arrivals.js > $OUT/${s}_$a.jsonl 2> $OUT/${s}_$a.err && touch $OUT/${s}_$a.done; echo "done ${s}_$a $(date +%H:%M)"'
left=$(( ${#todo[@]} - MAXNEW )); [ $left -gt 0 ] && echo "$left left" || echo "all done"
