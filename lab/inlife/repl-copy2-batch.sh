#!/bin/bash
# RETIRED IN #332: this needs engine.html at 5f25594 (REPL_COPY / REPL_DIET / REPL_CONTACT were removed after it). On a later engine the knob is silently ignored and every arm runs plain REPL. Run it from a worktree: git worktree add --detach <dir> 5f25594
# lab/inlife/repl-copy2-batch.sh OUTDIR [MAXNEW] [PAR]  - the 30 harness runs and 10 fidelity runs of PREREG-repl-copy2.md,
# staged for the 30-minute window: skips runs with a .done marker, deletes a .json left by a reaped launch, starts at most
# MAXNEW, PAR at a time. Names: <seed>_<V|C><shift>.json (harness-oee), <seed>_<V|C>F.json (probe-birthvar, NULLSHIFT 0).
cd "$(dirname "$0")/../.."; OUT=${1:?outdir}; MAXNEW=${2:-9}; PAR=${3:-3}; mkdir -p "$OUT"
todo=()
for s in 6401 6402 6403 6404 6405; do for arm in V0 C0 V3 C3 V7 C7 VF CF; do
  name=${s}_$arm; [ -e "$OUT/$name.done" ] && continue; rm -f "$OUT/$name.json"; todo+=("$s $arm"); done; done
[ ${#todo[@]} -eq 0 ] && { echo "all done"; exit 0; }
printf '%s\n' "${todo[@]:0:$MAXNEW}" | xargs -P "$PAR" -L 1 bash -c '
 s=$0; arm=$1; k=${arm#?}
 if [ "${arm:0:1}" = V ]; then X="REPL_COPY=3"; else X="REPL_COPY=2 REPL_INERT=225"; fi
 if [ "$k" = F ]; then env REPL=1 $X NULLSHIFT=0 SEED=$s TICKS=10000 SAMPLE=1000 node lab/inlife/probe-birthvar.js > "'"$OUT"'/${s}_$arm.json" 2> "'"$OUT"'/${s}_$arm.err" && touch "'"$OUT"'/${s}_$arm.done"
 else env REPL=1 $X NULLSHIFT=$k SEED=$s TICKS=10000 SAMPLE=500 ESTABLISH=1000 ESTWARM=2000 ESTN=10 node harness-oee.js > "'"$OUT"'/${s}_$arm.json" 2> "'"$OUT"'/${s}_$arm.err" && touch "'"$OUT"'/${s}_$arm.done"; fi
 echo "done ${s}_$arm $(date +%H:%M:%S)"'
left=$(( ${#todo[@]} - MAXNEW )); [ $left -gt 0 ] && echo "$left left" || echo "all done"
