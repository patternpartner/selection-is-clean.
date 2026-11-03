#!/bin/bash
# #373 (PREREG-refuge.md): DEFAULT x3 and REFUGE x3 (REPL_REFUGE=1) per seed, TASKS=1, 12,000 ticks, replicate k reseeded after tick 1.
# A .done per run; a run whose .pid is alive is in flight and is skipped. MAXNEW=n starts at most n and waits.
cd "$(dirname "$0")/../.."; OUT=lab/port/out-refuge; mkdir -p $OUT
SEEDS=${SEEDS:-"10601 10602 10603"}; MAXNEW=${MAXNEW:-6}; started=0
busy(){ [ -e $OUT/$1.pid ] && kill -0 "$(cat $OUT/$1.pid)" 2>/dev/null; }
for k in 1 2 3; do for s in $SEEDS; do for arm in DEFAULT REFUGE; do tag=${s}_${arm}$k; [ -e $OUT/$tag.done ] && continue; busy $tag && continue
  [ $started -ge $MAXNEW ] && break 3; started=$((started+1)); rf=0; [ $arm = REFUGE ] && rf=1
  ( env SEED=$s TASKS=1 REPL_REFUGE=$rf DIAG=1 TICKS=12000 WIN=500 RESEED_AT=1 RESEED=$k node lab/port/probe-reload.js > $OUT/$tag.jsonl 2> $OUT/$tag.err && touch $OUT/$tag.done ) &
  echo $! > $OUT/$tag.pid
done; done; done
echo "started $started"; wait
