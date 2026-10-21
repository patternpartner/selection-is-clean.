#!/bin/bash
# lab/inlife/repl-default-batch.sh OUTDIR [MAXNEW] [PAR]  - the 35 runs of PREREG-repl-default.md.
# Skips any run whose .done marker exists, deletes a zero-byte .json left by a reaped launch, starts at most MAXNEW new runs,
# PAR at a time, so each launch fits the 30-minute window (CLAUDE.md). Relaunch until it prints "all done".
cd "$(dirname "$0")/../.."; OUT=${1:?outdir}; MAXNEW=${2:-3}; PAR=${3:-3}; mkdir -p "$OUT"
todo=()
for s in 6101 6102 6103 6104 6105; do
 for arm in R0 D0 R1 D1 R2 D2 D3; do
  name=${s}_$arm; [ -e "$OUT/$name.done" ] && continue; rm -f "$OUT/$name.json"; todo+=("$s $arm")
 done; done
[ ${#todo[@]} -eq 0 ] && { echo "all done"; exit 0; }
printf '%s\n' "${todo[@]:0:$MAXNEW}" | xargs -P "$PAR" -L 1 bash -c '
 s=$0; arm=$1; k=${arm#?}; R=; [ "${arm:0:1}" = R ] && R=1
 env ${R:+REPL=1} NULLSHIFT=$k SEED=$s TICKS=10000 SAMPLE=1000 ESTABLISH=1000 ESTWARM=2000 ESTN=10 \
   node harness-oee.js > "'"$OUT"'/${s}_$arm.json" 2> "'"$OUT"'/${s}_$arm.err" && touch "'"$OUT"'/${s}_$arm.done"; echo "done ${s}_$arm $(date +%H:%M:%S)"'
left=$(( ${#todo[@]} - MAXNEW )); [ $left -gt 0 ] && echo "$left left" || echo "all done"
