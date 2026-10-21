#!/bin/bash
# lab/tasks-batch.sh OUTDIR [PAR]  - one 150,000-tick chunk for every world of PREREG-others.md that has chunks left, PAR at a
# time, resuming each from its own save (exact in this core). Relaunch until it prints "all done". A world W has chunk files
# W.k.jsonl and a save W.k.save after chunk k; W.k.done marks a finished chunk. 8 chunks = 1,200,000 ticks.
cd "$(dirname "$0")/.."; OUT=${1:?outdir}; PAR=${2:-3}; NCH=8; CH=150000; mkdir -p "$OUT"; todo=()
for s in 7001 7002 7003; do for o in 1 2; do w=${s}_o$o; k=0; while [ -e "$OUT/$w.$k.done" ]; do k=$((k+1)); done
  [ $k -lt $NCH ] && { rm -f "$OUT/$w.$k.jsonl" "$OUT/$w.$k.save"; todo+=("$s $o $k"); }; done; done
[ ${#todo[@]} -eq 0 ] && { echo "all done"; exit 0; }
printf '%s\n' "${todo[@]}" | OUT="$OUT" CH=$CH xargs -P "$PAR" -L 1 bash -c '
 s=$0; o=$1; k=$2; w=${s}_o$o; L=; [ $k -gt 0 ] && L="$OUT/$w.$((k-1)).save"
 env SEED=$s TICKS=$CH EVERY=1000 OPTS="{\"TASKS\":1,\"TASK_RATE\":0.2,\"TASK_SCALE\":1,\"OTHERS\":$o}" ${L:+LOAD=$L} SAVE="$OUT/$w.$k.save" node lab/tasks-run.js > "$OUT/$w.$k.jsonl" 2> "$OUT/$w.$k.err" && touch "$OUT/$w.$k.done"; echo "done $w chunk $k $(date +%H:%M:%S)"'
echo "chunks left: $(( 6*NCH - $(ls "$OUT"/*.done 2>/dev/null | wc -l) ))"
