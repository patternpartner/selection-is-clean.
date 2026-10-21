#!/bin/bash
# lab/inlife/sweep-batch.sh OUTDIR PREFIX "ENV" [MAXNEW] [PAR]  - harness-sweep runs for PREREG-sweep-repl.md (prefix S, ENV "REPL=1")
# and its Step 2 arms; seeds 6601-6605 (SEEDS= to override) at NULLSHIFT 0 and 3, TICKS=10000. Skips runs with .done.
cd "$(dirname "$0")/../.."; OUT=${1:?outdir}; PFX=${2:?prefix}; X=${3:?env}; MAXNEW=${4:-9}; PAR=${5:-3}; mkdir -p "$OUT"
SEEDS=${SEEDS:-"6601 6602 6603 6604 6605"}; todo=()
for s in ${SEEDS//,/ }; do for k in 0 3; do name=${s}_$PFX$k; [ -e "$OUT/$name.done" ] && continue; rm -f "$OUT/$name.json"; todo+=("$s $k"); done; done
[ ${#todo[@]} -eq 0 ] && { echo "all done"; exit 0; }
printf '%s\n' "${todo[@]:0:$MAXNEW}" | X="$X" OUT="$OUT" PFX="$PFX" xargs -P "$PAR" -L 1 bash -c '
 s=$0; k=$1; env $X NULLSHIFT=$k SEED=$s TICKS=10000 node harness-sweep.js > "$OUT/${s}_$PFX$k.json" 2> "$OUT/${s}_$PFX$k.err" && touch "$OUT/${s}_$PFX$k.done"; echo "done ${s}_$PFX$k $(date +%H:%M:%S)"'
left=$(( ${#todo[@]} - MAXNEW )); [ $left -gt 0 ] && echo "$left left" || echo "all done"
