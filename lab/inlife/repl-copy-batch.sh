#!/bin/bash
# RETIRED IN #332: this needs engine.html at 5f25594 (REPL_COPY / REPL_DIET / REPL_CONTACT were removed after it). On a later engine the knob is silently ignored and every arm runs plain REPL. Run it from a worktree: git worktree add --detach <dir> 5f25594
# lab/inlife/repl-copy-batch.sh OUTDIR [MAXNEW] [PAR]  - the 30 runs of PREREG-repl-copy.md, staged for the 30-minute window:
# skips runs with a .done marker, deletes a .json left by a reaped launch, starts at most MAXNEW, PAR at a time.
cd "$(dirname "$0")/../.."; OUT=${1:?outdir}; MAXNEW=${2:-9}; PAR=${3:-3}; mkdir -p "$OUT"
todo=()
for s in 6301 6302 6303 6304 6305; do for arm in K0 C0 K3 C3 K7 C7; do
  name=${s}_$arm; [ -e "$OUT/$name.done" ] && continue; rm -f "$OUT/$name.json"; todo+=("$s $arm"); done; done
[ ${#todo[@]} -eq 0 ] && { echo "all done"; exit 0; }
printf '%s\n' "${todo[@]:0:$MAXNEW}" | xargs -P "$PAR" -L 1 bash -c '
 s=$0; arm=$1; k=${arm#?}
 if [ "${arm:0:1}" = K ]; then X="REPL_COPY=1"; else X="REPL_COPY=2 REPL_INERT=225"; fi
 env REPL=1 $X NULLSHIFT=$k SEED=$s TICKS=10000 SAMPLE=500 ESTABLISH=1000 ESTWARM=2000 ESTN=10 \
   node harness-oee.js > "'"$OUT"'/${s}_$arm.json" 2> "'"$OUT"'/${s}_$arm.err" && touch "'"$OUT"'/${s}_$arm.done"; echo "done ${s}_$arm $(date +%H:%M:%S)"'
left=$(( ${#todo[@]} - MAXNEW )); [ $left -gt 0 ] && echo "$left left" || echo "all done"
