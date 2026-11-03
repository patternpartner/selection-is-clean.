#!/bin/bash
# #370: a long run in chunks. Chunk c of seed s is one process: it boots from chunk c-1's save (genome, population, lifetime record -
# a reload, which #368/#369 made as close to a perfect reload as perfect reloads are to each other), runs CHUNK ticks under its own
# random stream (SEED s*10+c), and saves. Each launch runs the NEXT chunk of every seed in parallel and waits; relaunch to go on.
# Out: lab/port/out-chain/<s>_c<c>.{jsonl,genome,pop,seen,done}; a running chunk writes .jsonl.part (gitignored), renamed when done.
cd "$(dirname "$0")/../.."; OUT=lab/port/out-chain; mkdir -p $OUT
SEEDS=${SEEDS:-"10401 10402 10403"}; CHUNK=${CHUNK:-10000}; NCHUNK=${NCHUNK:-10}
for s in $SEEDS; do c=0; while [ -e $OUT/${s}_c$c.done ]; do c=$((c+1)); done; [ $c -ge $NCHUNK ] && continue
  [ -e $OUT/${s}_c$c.pid ] && kill -0 "$(cat $OUT/${s}_c$c.pid)" 2>/dev/null && continue
  sd=$((s*10+c)); prev=$OUT/${s}_c$((c-1)); load=""; [ $c -gt 0 ] && load="LOAD=$prev.genome POPLOAD=$prev.pop SEEN=$prev.seen"
  ( env SEED=$sd TASKS=1 TICKS=$CHUNK WIN=500 SAVEAT=$CHUNK SAVEDIR=$OUT POP=1 $load node lab/port/probe-reload.js > $OUT/${s}_c$c.jsonl.part 2> $OUT/${s}_c$c.err.part \
    && for x in genome pop seen; do mv $OUT/${sd}_$CHUNK.$x $OUT/${s}_c$c.$x; done && mv $OUT/${s}_c$c.jsonl.part $OUT/${s}_c$c.jsonl && mv $OUT/${s}_c$c.err.part $OUT/${s}_c$c.err && touch $OUT/${s}_c$c.done ) &
  echo $! > $OUT/${s}_c$c.pid
done; wait
