#!/bin/bash
# lab/tasks2-batch.sh OUTDIR [PAR]  (SEEDS="a b c" overrides the seeds; #337 runs 7201-7203; XOPTS=',"CLEAN":1' appends options, #339)  - #336: as tasks-batch.sh, for PREREG-strict.md (seeds 7101-7103; o1 = STRICT, o2 = CONTROL). One 150,000-tick chunk for every world that has chunks left, PAR at a
# time, resuming each from its own save (exact in this core). Relaunch until it prints "all done". A world W has chunk files
# W.k.jsonl and a save W.k.save after chunk k; W.k.done marks a finished chunk. 8 chunks = 1,200,000 ticks.
cd "$(dirname "$0")/.."; OUT=${1:?outdir}; PAR=${2:-3}; NCH=8; CH=150000; mkdir -p "$OUT"; todo=()
for s in ${SEEDS:-7101 7102 7103}; do for o in 1 2; do w=${s}_o$o; k=0; while [ -e "$OUT/$w.$k.done" ]; do k=$((k+1)); done
  [ $k -lt $NCH ] && { rm -f "$OUT/$w.$k.jsonl" "$OUT/$w.$k.save"; todo+=("$s $o $k"); }; done; done
[ ${#todo[@]} -eq 0 ] && { echo "all done"; exit 0; }
printf '%s\n' "${todo[@]}" | OUT="$OUT" CH=$CH XOPTS="$XOPTS" xargs -P "$PAR" -L 1 bash -c '
 s=$0; o=$1; k=$2; w=${s}_o$o; L=; [ $k -gt 0 ] && L="$OUT/$w.$((k-1)).save"
 env SEED=$s TICKS=$CH EVERY=1000 OPTS="{\"TASKS\":1,\"TASK_RATE\":0.2,\"TASK_SCALE\":1,\"OTHERS\":$o,\"REFUSE_NOT\":$((o==1?1:0)),\"DEPTH\":1$XOPTS}" ${L:+LOAD=$L} SAVE="$OUT/$w.$k.save" node lab/tasks-run.js > "$OUT/$w.$k.jsonl" 2> "$OUT/$w.$k.err" && touch "$OUT/$w.$k.done"; echo "done $w chunk $k $(date +%H:%M:%S)"'
echo "chunks left: $(( 6*NCH - $(ls "$OUT"/*.done 2>/dev/null | wc -l) ))"
