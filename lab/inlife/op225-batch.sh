#!/bin/bash
# lab/inlife/op225-batch.sh OUTDIR [MAXNEW] [PAR]  - the 30 runs of PREREG-op225.md, staged for the 30-minute window:
# skips runs with a .done marker, deletes a .json left by a reaped launch, starts at most MAXNEW, PAR at a time.
cd "$(dirname "$0")/../.."; OUT=${1:?outdir}; MAXNEW=${2:-9}; PAR=${3:-3}; mkdir -p "$OUT"
todo=()
for s in 6201 6202 6203 6204 6205; do for arm in A0 I0 A1 I1 A2 I2; do
  name=${s}_$arm; [ -e "$OUT/$name.done" ] && continue; rm -f "$OUT/$name.json"; todo+=("$s $arm"); done; done
[ ${#todo[@]} -eq 0 ] && { echo "all done"; exit 0; }
printf '%s\n' "${todo[@]:0:$MAXNEW}" | xargs -P "$PAR" -L 1 bash -c '
 s=$0; arm=$1; k=${arm#?}; I=; [ "${arm:0:1}" = I ] && I=225
 env REPL=1 ${I:+REPL_INERT=$I} NULLSHIFT=$k SEED=$s TICKS=12000 SAMPLE=500 WINDOW=500 \
   node lab/inlife/probe225.js > "'"$OUT"'/${s}_$arm.json" 2> "'"$OUT"'/${s}_$arm.err" && touch "'"$OUT"'/${s}_$arm.done"; echo "done ${s}_$arm $(date +%H:%M:%S)"'
left=$(( ${#todo[@]} - MAXNEW )); [ $left -gt 0 ] && echo "$left left" || echo "all done"
