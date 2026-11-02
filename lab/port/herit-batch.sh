#!/bin/bash
# #369b (PREREG-herit.md): OFF x3 and ON x3 (LATERAL_HERIT=1) per seed, TASKS=1, 10,000 ticks, replicate k reseeded after tick 1.
# A .done per run; a run whose .pid is alive is in flight from an earlier launch and is skipped. MAXNEW=n starts at most n and waits.
cd "$(dirname "$0")/../.."; OUT=lab/port/out-herit; mkdir -p $OUT
SEEDS=${SEEDS:-"10201 10202 10203"}; MAXNEW=${MAXNEW:-6}; started=0
busy(){ [ -e $OUT/$1.pid ] && kill -0 "$(cat $OUT/$1.pid)" 2>/dev/null; }
for k in 1 2 3; do for s in $SEEDS; do for arm in OFF ON; do tag=${s}_${arm}$k; [ -e $OUT/$tag.done ] && continue; busy $tag && continue
  [ $started -ge $MAXNEW ] && break 3; started=$((started+1)); h=0; [ $arm = ON ] && h=1
  ( env SEED=$s TASKS=1 LATERAL_HERIT=$h TICKS=10000 WIN=500 RESEED_AT=1 RESEED=$k node lab/port/probe-reload.js > $OUT/$tag.jsonl 2> $OUT/$tag.err && touch $OUT/$tag.done ) &
  echo $! > $OUT/$tag.pid
done; done; done
echo "started $started"; wait
