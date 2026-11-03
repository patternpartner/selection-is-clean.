#!/bin/bash
# #368: stage 1 - uninterrupted TASKS worlds that save their germline (as the browser does) at 4,000 and 8,000.
# Stage 2 (RELOAD=1) - a fresh engine booted from each save, run 4,000 ticks. A .done per run; a killed launch leaves no .done.
cd "$(dirname "$0")/../.."; OUT=lab/port/out-reload; mkdir -p $OUT
SEEDS=${SEEDS:-"10001 10002 10003"}
if [ -z "$RELOAD" ]; then
  for s in $SEEDS; do [ -e $OUT/${s}_RUN.done ] && continue
    ( SEED=$s TASKS=1 TICKS=12000 WIN=500 SAVEAT=4000,8000 SAVEDIR=$OUT POP=${POP:-} node lab/port/probe-reload.js > $OUT/${s}_RUN.jsonl 2> $OUT/${s}_RUN.err && touch $OUT/${s}_RUN.done ) &
  done
else
  for s in $SEEDS; do for at in ${ATS:-4000 8000}; do tag=${s}_L${at}${ARM:+_$ARM}; [ -e $OUT/$tag.done ] && continue
    ( env SEED=$((s+500)) TASKS=1 TICKS=${RT:-4000} WIN=500 LOAD=$OUT/${s}_${at}.genome SEEN=$OUT/${s}_${at}.seen ${ARM:+POPLOAD=$OUT/${s}_${at}.pop} INDEX=${INDEX:-} node lab/port/probe-reload.js > $OUT/$tag.jsonl 2> $OUT/$tag.err && touch $OUT/$tag.done ) &
  done; done
fi
wait
