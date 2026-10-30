#!/bin/bash
# #368 (PREREG-pop.md): NULL x3 per seed (one process to 8,000, reseeded after 4,000; k=1 writes the save), then GERM x3 and
# POP x3 reloads from that save, 4,000 ticks each. A .done per run; a run whose prerequisite save is missing waits for a later
# launch (the save exists from tick 4,000 of NULL k=1). MAXNEW=n starts at most n runs and waits for them (size a launch to finish inside the harness's ~30 minutes).
cd "$(dirname "$0")/../.."; OUT=lab/port/out-pop; mkdir -p $OUT
SEEDS=${SEEDS:-"10101 10102 10103"}; MAXNEW=${MAXNEW:-4}; started=0
start(){ [ $started -ge $MAXNEW ] && return 1; started=$((started+1)); return 0; }
for k in 1 2 3; do for s in $SEEDS; do tag=${s}_NULL$k; [ -e $OUT/$tag.done ] && continue; start || break 2
  extra=""; [ $k = 1 ] && extra="SAVEAT=4000 SAVEDIR=$OUT POP=1"
  ( env SEED=$s TASKS=1 TICKS=8000 WIN=500 RESEED_AT=4000 RESEED=$k $extra node lab/port/probe-reload.js > $OUT/$tag.jsonl 2> $OUT/$tag.err && touch $OUT/$tag.done ) &
done; done
for k in 1 2 3; do for s in $SEEDS; do for arm in GERM POP; do tag=${s}_${arm}$k; [ -e $OUT/$tag.done ] && continue
  [ -e $OUT/${s}_4000.seen ] || continue; start || break 3   # .seen is written last, after the .genome and .pop
  extra=""; [ $arm = POP ] && extra="POPLOAD=$OUT/${s}_4000.pop"
  ( env SEED=$((s+500+k)) TASKS=1 TICKS=4000 WIN=500 LOAD=$OUT/${s}_4000.genome SEEN=$OUT/${s}_4000.seen $extra node lab/port/probe-reload.js > $OUT/$tag.jsonl 2> $OUT/$tag.err && touch $OUT/$tag.done ) &
done; done; done
echo "started $started"; wait
