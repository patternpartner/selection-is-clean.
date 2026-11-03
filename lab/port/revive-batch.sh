#!/bin/bash
# #375 (PREREG-revive.md): from each dead state in lab/port/out-gen/dead-states.txt, DEFAULT x3 and REFUGE x3 population reloads,
# 8,000 ticks, stream k shared by the arms (SEED = seed*100+k). A .done per run; running runs write .part. MAXNEW=n.
cd "$(dirname "$0")/../.."; G=lab/port/out-gen; OUT=lab/port/out-revive2; mkdir -p $OUT; MAXNEW=${MAXNEW:-6}; started=0
busy(){ [ -e $OUT/$1.pid ] && kill -0 "$(cat $OUT/$1.pid)" 2>/dev/null; }
while read s T; do [ -z "$s" ] && continue; for k in 1 2 3; do for arm in DEFAULT REFUGE; do tag=${s}_${arm}$k
  [ -e $OUT/$tag.done ] && continue; busy $tag && continue; [ $started -ge $MAXNEW ] && break 3; started=$((started+1)); rf=0; [ $arm = REFUGE ] && rf=1
  ( env SEED=$((s*100+k)) TASKS=1 REPL_REFUGE=$rf DIAG=1 TICKS=8000 WIN=500 LOAD=$G/${s}_$T.genome POPLOAD=$G/${s}_$T.pop SEEN=$G/${s}_$T.seen node lab/port/probe-reload.js > $OUT/$tag.jsonl.part 2> $OUT/$tag.err \
    && mv $OUT/$tag.jsonl.part $OUT/$tag.jsonl && touch $OUT/$tag.done ) &
  echo $! > $OUT/$tag.pid
done; done; done < $G/dead-states.txt
echo "started $started"; wait
