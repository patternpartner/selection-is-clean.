#!/bin/bash
# lab/tasks4-batch.sh OUTDIR [PAR]  - #338: as tasks2-batch.sh, four inputs (NIN 4), for PREREG-four.md (seeds 7301-7303 unless SEEDS="a b c";
# o1 = STRICT, o2 = CONTROL). One 150,000-tick chunk for every world that has chunks left, PAR at a time (default 6: one round fits
# the ~30-minute window here), resuming each from its own save (exact). Relaunch until it prints "all done". 8 chunks = 1,200,000 ticks.
cd "$(dirname "$0")/.."; OUT=${1:?outdir}; PAR=${2:-6}; NCH=8; CH=150000; mkdir -p "$OUT"; todo=()
for s in ${SEEDS:-7301 7302 7303}; do for o in 1 2; do w=${s}_o$o; k=0; while [ -e "$OUT/$w.$k.done" ]; do k=$((k+1)); done
  [ $k -lt $NCH ] && { rm -f "$OUT/$w.$k.jsonl" "$OUT/$w.$k.save"; todo+=("$s $o $k"); }; done; done
[ ${#todo[@]} -eq 0 ] && { echo "all done"; exit 0; }
printf '%s\n' "${todo[@]}" | OUT="$OUT" CH=$CH xargs -P "$PAR" -L 1 bash -c '
 s=$0; o=$1; k=$2; w=${s}_o$o; L=; [ $k -gt 0 ] && L="$OUT/$w.$((k-1)).save"
 env SEED=$s TICKS=$CH EVERY=1000 OPTS="{\"TASKS\":1,\"TASK_RATE\":0.2,\"TASK_SCALE\":1,\"OTHERS\":$o,\"REFUSE_NOT\":$((o==1?1:0)),\"DEPTH\":1,\"NIN\":4}" ${L:+LOAD=$L} SAVE="$OUT/$w.$k.save" node lab/tasks-run.js > "$OUT/$w.$k.jsonl" 2> "$OUT/$w.$k.err" && touch "$OUT/$w.$k.done"; echo "done $w chunk $k $(date +%H:%M:%S)"'
echo "chunks left: $(( 6*NCH - $(ls "$OUT"/*.done 2>/dev/null | wc -l) ))"
