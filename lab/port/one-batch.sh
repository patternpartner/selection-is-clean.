#!/bin/bash
# #381 (PREREG-one.md): 20 pairs, seeds 11401-11420, each run as DEF and as ONE (PROV_BIRTH=0 STORE_DEATH=1 AIM=0), plus ONE with
# TASK_SHUFFLE=1 on 11401-11405 (reported); TASKS=1, 12,000 ticks, DIAG=1, reseeded after tick 1 with stream 1. A .done per run;
# running runs write .part and are skipped while their pid lives. MAXNEW=n starts at most n.
cd "$(dirname "$0")/../.."; OUT=lab/port/out-one; mkdir -p $OUT; MAXNEW=${MAXNEW:-6}; started=0
busy(){ [ -e $OUT/$1.pid ] && kill -0 "$(cat $OUT/$1.pid)" 2>/dev/null; }
JOBS=""; for s in $(seq 11401 11420); do JOBS="$JOBS ${s}_DEF ${s}_ONE"; [ $s -le 11405 ] && JOBS="$JOBS ${s}_ONESHUF"; done
for tag in $JOBS; do [ -e $OUT/$tag.done ] && continue; busy $tag && continue; [ $started -ge $MAXNEW ] && break; started=$((started+1))
  s=${tag%%_*}; arm=${tag#*_}; case $arm in DEF) X="";; ONE) X="PROV_BIRTH=0 STORE_DEATH=1 AIM=0";; ONESHUF) X="PROV_BIRTH=0 STORE_DEATH=1 AIM=0 TASK_SHUFFLE=1";; esac
  ( env $X SEED=$s TASKS=1 TICKS=12000 WIN=500 DIAG=1 RESEED_AT=1 RESEED=1 node lab/port/probe-reload.js > $OUT/$tag.jsonl.part 2> $OUT/$tag.err \
    && mv $OUT/$tag.jsonl.part $OUT/$tag.jsonl && touch $OUT/$tag.done ) &
  echo $! > $OUT/$tag.pid
done
echo "started $started"; wait
