#!/bin/bash
# lab/inlife/diet-batch.sh OUTDIR [MAXNEW] [PAR]  - the 30 runs of PREREG-diet.md, staged for the 30-minute window.
# <seed>_C<k> CONTROL sweep, <seed>_T<k> DIET sweep, <seed>_Q<k> DIET probe-diet; seeds 6701-6705, k in 0 3.
cd "$(dirname "$0")/../.."; OUT=${1:?outdir}; MAXNEW=${2:-9}; PAR=${3:-3}; mkdir -p "$OUT"; todo=()
for s in 6701 6702 6703 6704 6705; do for a in C0 T0 Q0 C3 T3 Q3; do name=${s}_$a; [ -e "$OUT/$name.done" ] && continue; rm -f "$OUT/$name.json"; todo+=("$s $a"); done; done
[ ${#todo[@]} -eq 0 ] && { echo "all done"; exit 0; }
printf '%s\n' "${todo[@]:0:$MAXNEW}" | OUT="$OUT" xargs -P "$PAR" -L 1 bash -c '
 s=$0; a=$1; k=${a#?}
 case ${a:0:1} in
  C) env REPL=1 NULLSHIFT=$k SEED=$s TICKS=10000 node harness-sweep.js > "$OUT/${s}_$a.json" 2> "$OUT/${s}_$a.err" && touch "$OUT/${s}_$a.done";;
  T) env REPL=1 REPL_DIET=4 NULLSHIFT=$k SEED=$s TICKS=10000 node harness-sweep.js > "$OUT/${s}_$a.json" 2> "$OUT/${s}_$a.err" && touch "$OUT/${s}_$a.done";;
  Q) env REPL=1 REPL_DIET=4 NULLSHIFT=$k SEED=$s TICKS=10000 SAMPLE=500 node lab/inlife/probe-diet.js > "$OUT/${s}_$a.json" 2> "$OUT/${s}_$a.err" && touch "$OUT/${s}_$a.done";;
 esac; echo "done ${s}_$a $(date +%H:%M:%S)"'
left=$(( ${#todo[@]} - MAXNEW )); [ $left -gt 0 ] && echo "$left left" || echo "all done"
