#!/bin/bash
# lab/inlife/drift-batch.sh OUTDIR [MAXNEW] [PAR]  - the 35 runs of PREREG-drift.md, staged for the 30-minute window:
# skips runs with a .done marker, deletes a .json left by a reaped launch, starts at most MAXNEW, PAR at a time.
# Names: <seed>_<R|F><shift>.json (REPL, FROZEN), <seed>_D0.json (DEFAULT).
cd "$(dirname "$0")/../.."; OUT=${1:?outdir}; MAXNEW=${2:-9}; PAR=${3:-3}; mkdir -p "$OUT"
todo=()
for s in 6501 6502 6503 6504 6505; do for arm in R0 F0 R3 F3 R7 F7 D0; do
  name=${s}_$arm; [ -e "$OUT/$name.done" ] && continue; rm -f "$OUT/$name.json"; todo+=("$s $arm"); done; done
[ ${#todo[@]} -eq 0 ] && { echo "all done"; exit 0; }
printf '%s\n' "${todo[@]:0:$MAXNEW}" | xargs -P "$PAR" -L 1 bash -c '
 s=$0; arm=$1; k=${arm#?}
 case ${arm:0:1} in R) X="REPL=1";; F) X="REPL=1 REPL_FROZEN=1";; D) X="";; esac
 env $X NULLSHIFT=$k SEED=$s TICKS=10000 SAMPLE=500 K=20 node lab/inlife/probe-drift.js > "'"$OUT"'/${s}_$arm.json" 2> "'"$OUT"'/${s}_$arm.err" && touch "'"$OUT"'/${s}_$arm.done"
 echo "done ${s}_$arm $(date +%H:%M:%S)"'
left=$(( ${#todo[@]} - MAXNEW )); [ $left -gt 0 ] && echo "$left left" || echo "all done"
