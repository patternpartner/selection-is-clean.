#!/bin/bash
# #382 (PREREG-crowd.md): 20 pairs, seeds 11501-11520, OLD (today's TASKS world) and CROWD (PROV_BIRTH=0 STORE_DEATH=1 AIM=0
# REPL_CROWD_K=450), plus CROWD with TASK_SHUFFLE=1 on 11501-11503 (reported); TASKS=1, 12,000 ticks, DIAG=1, reseeded after tick 1
# with stream 1; CPU seconds per run from bash's time. A .done per run; running runs write .part and are skipped while their pid
# lives. MAXNEW=n starts at most n (a pair's two arms are adjacent in the job list, so they start together).
cd "$(dirname "$0")/../.."; OUT=lab/port/out-crowd; mkdir -p $OUT; MAXNEW=${MAXNEW:-6}; started=0
busy(){ [ -e $OUT/$1.pid ] && kill -0 "$(cat $OUT/$1.pid)" 2>/dev/null; }
JOBS=""; for s in $(seq 11501 11520); do JOBS="$JOBS ${s}_OLD ${s}_CROWD"; [ $s -le 11503 ] && JOBS="$JOBS ${s}_CROWDSHUF"; done
for tag in $JOBS; do [ -e $OUT/$tag.done ] && continue; busy $tag && continue; [ $started -ge $MAXNEW ] && break; started=$((started+1))
  s=${tag%%_*}; arm=${tag#*_}; case $arm in OLD) X="";; CROWD) X="PROV_BIRTH=0 STORE_DEATH=1 AIM=0 REPL_CROWD_K=450";; CROWDSHUF) X="PROV_BIRTH=0 STORE_DEATH=1 AIM=0 REPL_CROWD_K=450 TASK_SHUFFLE=1";; esac
  ( { time env $X SEED=$s TASKS=1 TICKS=12000 WIN=500 DIAG=1 RESEED_AT=1 RESEED=1 node lab/port/probe-reload.js > $OUT/$tag.jsonl.part ; } 2> $OUT/$tag.time \
    && mv $OUT/$tag.jsonl.part $OUT/$tag.jsonl && touch $OUT/$tag.done ) &
  echo $! > $OUT/$tag.pid
done
echo "started $started"; wait
