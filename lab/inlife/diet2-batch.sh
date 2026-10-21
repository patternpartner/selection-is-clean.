#!/bin/bash
# lab/inlife/diet2-batch.sh OUTDIR [MAXNEW] [PAR]  - the 40 runs of PREREG-diet2.md, staged for the 30-minute window.
# <seed>_C<k> CONTROL sweep, _T<k> DIET (program-hash band) sweep, _Q<k> probe-diet, _H<k> probe-bandherit; seeds 6801-6805, k 0 3.
cd "$(dirname "$0")/../.."; OUT=${1:?outdir}; MAXNEW=${2:-9}; PAR=${3:-3}; mkdir -p "$OUT"; todo=()
for s in 6801 6802 6803 6804 6805; do for a in C0 T0 Q0 H0 C3 T3 Q3 H3; do name=${s}_$a; [ -e "$OUT/$name.done" ] && continue; rm -f "$OUT/$name.json"; todo+=("$s $a"); done; done
[ ${#todo[@]} -eq 0 ] && { echo "all done"; exit 0; }
printf '%s\n' "${todo[@]:0:$MAXNEW}" | OUT="$OUT" xargs -P "$PAR" -L 1 bash -c '
 s=$0; a=$1; k=${a#?}; D="REPL=1 REPL_DIET=4 REPL_DIET_SRC=1"
 case ${a:0:1} in
  C) env REPL=1 NULLSHIFT=$k SEED=$s TICKS=10000 node harness-sweep.js > "$OUT/${s}_$a.json" 2> "$OUT/${s}_$a.err" && touch "$OUT/${s}_$a.done";;
  T) env $D NULLSHIFT=$k SEED=$s TICKS=10000 node harness-sweep.js > "$OUT/${s}_$a.json" 2> "$OUT/${s}_$a.err" && touch "$OUT/${s}_$a.done";;
  Q) env $D NULLSHIFT=$k SEED=$s TICKS=10000 SAMPLE=500 node lab/inlife/probe-diet.js > "$OUT/${s}_$a.json" 2> "$OUT/${s}_$a.err" && touch "$OUT/${s}_$a.done";;
  H) env $D NULLSHIFT=$k SEED=$s TICKS=10000 SAMPLE=1000 node lab/inlife/probe-bandherit.js > "$OUT/${s}_$a.json" 2> "$OUT/${s}_$a.err" && touch "$OUT/${s}_$a.done";;
 esac; echo "done ${s}_$a $(date +%H:%M:%S)"'
left=$(( ${#todo[@]} - MAXNEW )); [ $left -gt 0 ] && echo "$left left" || echo "all done"
