#!/bin/bash
# lab/tasks-arm.sh OUTDIR ARM [PAR]  - #347: ONE extra arm, named o<ARM>, in #340's STRICT world (four inputs, bit-exact clean rule,
# reading, refusing copies and complements) plus the options in OPTS_X (a JSON fragment), for the seeds in SEEDS. Same chunking,
# save/resume and MAXNEW as lab/tasks6-batch.sh, least-advanced first. Relaunch until it prints "all done".
cd "$(dirname "$0")/.."; OUT=${1:?outdir}; ARM=${2:?arm number}; PAR=${3:-3}; NCH=8; CH=150000; mkdir -p "$OUT"; todo=()
for s in ${SEEDS:?seeds}; do w=${s}_o$ARM; k=0; while [ -e "$OUT/$w.$k.done" ]; do k=$((k+1)); done
  [ $k -lt $NCH ] && { rm -f "$OUT/$w.$k.jsonl" "$OUT/$w.$k.save"; todo+=("$s $ARM $k"); }; done
[ ${#todo[@]} -eq 0 ] && { echo "all done"; exit 0; }
mapfile -t todo < <(printf '%s\n' "${todo[@]}" | sort -k3,3n -s)
[ -n "$MAXNEW" ] && todo=("${todo[@]:0:$MAXNEW}")
printf '%s\n' "${todo[@]}" | OUT="$OUT" CH=$CH OPTS_X="${OPTS_X:?options}" xargs -P "$PAR" -L 1 bash -c '
 s=$0; o=$1; k=$2; w=${s}_o$o; L=; [ $k -gt 0 ] && L="$OUT/$w.$((k-1)).save"
 env SEED=$s TICKS=$CH EVERY=1000 OPTS="{\"TASKS\":1,\"TASK_RATE\":0.2,\"TASK_SCALE\":1,\"OTHERS\":1,\"REFUSE_NOT\":1,\"DEPTH\":1,\"NIN\":4,\"CLEAN\":1,$OPTS_X}" ${L:+LOAD=$L} SAVE="$OUT/$w.$k.save" node lab/tasks-run.js > "$OUT/$w.$k.jsonl" 2> "$OUT/$w.$k.err" && touch "$OUT/$w.$k.done"; echo "done $w chunk $k $(date +%H:%M:%S)"'
echo "chunks of arm $ARM left: $(( $(echo $SEEDS | wc -w)*NCH - $(ls "$OUT"/*_o$ARM.*.done 2>/dev/null | wc -l) ))"
