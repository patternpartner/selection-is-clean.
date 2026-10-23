#!/bin/bash
# lab/tasks6-batch.sh OUTDIR [PAR]  - #344 on: two arms in #340's STRICT world (four inputs, bit-exact clean rule, reading, refusing copies
# and complements); o1 adds the options in ARM1 (a JSON fragment, default '"TASK_EPAY":1'), o2 is #340's STRICT unchanged.
# SEEDS="a b c" (default 7701 7702 7703). One 150,000-tick chunk for every world with chunks left, PAR at a time, resuming exactly from
# its own save. Relaunch until it prints "all done". 8 chunks = 1,200,000 ticks.
cd "$(dirname "$0")/.."; OUT=${1:?outdir}; PAR=${2:-6}; NCH=8; CH=150000; mkdir -p "$OUT"; todo=(); ARM1=${ARM1:-'"TASK_EPAY":1'}
for s in ${SEEDS:-7701 7702 7703}; do for o in 1 2; do w=${s}_o$o; k=0; while [ -e "$OUT/$w.$k.done" ]; do k=$((k+1)); done
  [ $k -lt $NCH ] && { rm -f "$OUT/$w.$k.jsonl" "$OUT/$w.$k.save"; todo+=("$s $o $k"); }; done; done
[ ${#todo[@]} -eq 0 ] && { echo "all done"; exit 0; }
printf '%s\n' "${todo[@]}" | OUT="$OUT" CH=$CH ARM1="$ARM1" xargs -P "$PAR" -L 1 bash -c '
 s=$0; o=$1; k=$2; w=${s}_o$o; L=; [ $k -gt 0 ] && L="$OUT/$w.$((k-1)).save"; X=; [ $o -eq 1 ] && X=",$ARM1"
 env SEED=$s TICKS=$CH EVERY=1000 OPTS="{\"TASKS\":1,\"TASK_RATE\":0.2,\"TASK_SCALE\":1,\"OTHERS\":1,\"REFUSE_NOT\":1,\"DEPTH\":1,\"NIN\":4,\"CLEAN\":1$X}" ${L:+LOAD=$L} SAVE="$OUT/$w.$k.save" node lab/tasks-run.js > "$OUT/$w.$k.jsonl" 2> "$OUT/$w.$k.err" && touch "$OUT/$w.$k.done"; echo "done $w chunk $k $(date +%H:%M:%S)"'
echo "chunks left: $(( 6*NCH - $(ls "$OUT"/*.done 2>/dev/null | wc -l) ))"
