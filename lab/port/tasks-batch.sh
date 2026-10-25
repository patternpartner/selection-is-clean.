#!/bin/bash
# lab/port/tasks-batch.sh [PAR] - #350's twelve runs (PREREG-tasks.md). Skips finished runs; MAXNEW=n starts at most n new ones.
cd "$(dirname "$0")/../.."; OUT=lab/port/out-tasks; PAR=${1:-3}; mkdir -p $OUT; todo=()
for s in 9101 9102 9103; do for a in TASKS ANC ROCK REPL; do [ -e $OUT/${s}_$a.done ] || { rm -f $OUT/${s}_$a.json; todo+=("$s $a"); }; done; done
[ ${#todo[@]} -eq 0 ] && { echo "all done"; exit 0; }; [ -n "$MAXNEW" ] && todo=("${todo[@]:0:$MAXNEW}")
printf '%s\n' "${todo[@]}" | OUT=$OUT xargs -P $PAR -L 1 bash -c 's=$0; a=$1; case $a in TASKS) K="TASKS=1";; ANC) K="TASKS=1 PIN=anc";; ROCK) K="TASKS=1 PIN=rock";; REPL) K="REPL=1";; esac
 env SEED=$s TICKS=10000 SAMPLE=500 $K node lab/port/probe-tasks.js > $OUT/${s}_$a.json 2> $OUT/${s}_$a.err && touch $OUT/${s}_$a.done; echo "done ${s}_$a $(date +%H:%M:%S)"'
