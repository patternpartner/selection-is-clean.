#!/bin/bash
# #392 (PREREG-in5.md): 20 pairs, seeds 11601-11620, IN4 (today's shipped TASKS world) and IN5 (TASK_IN=5), plus IN5 with
# TASK_SHUFFLE=1 on 11601-11603 (reported); TASKS=1, 12,000 ticks, DIAG=1, reseeded after tick 1 with stream 1; CPU seconds from
# bash's time. A .done per run; running runs write .part and are skipped while their pid lives. MAXNEW=n starts at most n.
cd "$(dirname "$0")/../.."; OUT=lab/port/out-in5; mkdir -p $OUT; MAXNEW=${MAXNEW:-6}; started=0
busy(){ [ -e $OUT/$1.pid ] && kill -0 "$(cat $OUT/$1.pid)" 2>/dev/null; }
JOBS=""; for s in $(seq 11601 11620); do JOBS="$JOBS ${s}_IN4 ${s}_IN5"; [ $s -le 11603 ] && JOBS="$JOBS ${s}_IN5SHUF"; done
for tag in $JOBS; do [ -e $OUT/$tag.done ] && continue; busy $tag && continue; [ $started -ge $MAXNEW ] && break; started=$((started+1))
  s=${tag%%_*}; arm=${tag#*_}; case $arm in IN4) X="";; IN5) X="TASK_IN=5";; IN5SHUF) X="TASK_IN=5 TASK_SHUFFLE=1";; esac
  ( { time env $X SEED=$s TASKS=1 TICKS=12000 WIN=500 DIAG=1 RESEED_AT=1 RESEED=1 node lab/port/probe-reload.js > $OUT/$tag.jsonl.part ; } 2> $OUT/$tag.time \
    && mv $OUT/$tag.jsonl.part $OUT/$tag.jsonl && touch $OUT/$tag.done ) &
  echo $! > $OUT/$tag.pid
done
echo "started $started"; wait
