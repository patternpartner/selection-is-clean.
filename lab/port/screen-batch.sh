#!/bin/bash
# #369b: how often does a TASKS world grow an imitator lineage (op 225 copiers)? One uninterrupted run per seed, today's world,
# TICKS (default 6,000), rows with copies and desync. These seeds are LOOKED AT for prevalence and decide nothing.
cd "$(dirname "$0")/../.."; OUT=lab/port/out-screen; mkdir -p $OUT
SEEDS=${SEEDS:-"10301 10302 10303 10304 10305 10306 10307 10308"}; MAXNEW=${MAXNEW:-6}; started=0
busy(){ [ -e $OUT/$1.pid ] && kill -0 "$(cat $OUT/$1.pid)" 2>/dev/null; }
for s in $SEEDS; do tag=${s}; [ -e $OUT/$tag.done ] && continue; busy $tag && continue; [ $started -ge $MAXNEW ] && break; started=$((started+1))
  ( env SEED=$s TASKS=1 TICKS=${TICKS:-6000} WIN=500 node lab/port/probe-reload.js > $OUT/$tag.jsonl 2> $OUT/$tag.err && touch $OUT/$tag.done ) &
  echo $! > $OUT/$tag.pid
done; echo "started $started"; wait
