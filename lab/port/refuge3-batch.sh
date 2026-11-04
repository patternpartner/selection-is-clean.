#!/bin/bash
# #380 (PREREG-refuge3.md): 20 pairs, seeds 11301-11320, each run as DEF and as ADAPT (REPL_REFUGE=2), TASKS=1, 12,000 ticks,
# DIAG=1, both reseeded after tick 1 with stream 1. A .done per run; running runs write .part and are skipped while their pid lives.
# MAXNEW=n starts at most n.
cd "$(dirname "$0")/../.."; OUT=lab/port/out-refuge3; mkdir -p $OUT
SEEDS=${SEEDS:-"$(seq -s " " 11301 11320)"}; MAXNEW=${MAXNEW:-6}; started=0
busy(){ [ -e $OUT/$1.pid ] && kill -0 "$(cat $OUT/$1.pid)" 2>/dev/null; }
for s in $SEEDS; do for arm in DEF ADAPT; do tag=${s}_${arm}; [ -e $OUT/$tag.done ] && continue; busy $tag && continue
  [ $started -ge $MAXNEW ] && break 2; started=$((started+1)); rf=0; [ $arm = ADAPT ] && rf=2
  ( t0=$(date +%s); env SEED=$s TASKS=1 REPL_REFUGE=$rf TICKS=12000 WIN=500 DIAG=1 RESEED_AT=1 RESEED=1 node lab/port/probe-reload.js > $OUT/$tag.jsonl.part 2> $OUT/$tag.err \
    && mv $OUT/$tag.jsonl.part $OUT/$tag.jsonl && echo $(( $(date +%s)-t0 )) > $OUT/$tag.secs && touch $OUT/$tag.done ) &
  echo $! > $OUT/$tag.pid
done; done
echo "started $started"; wait
