#!/bin/bash
# #377 (PREREG-aim.md): DEF x3, NOAIM x3 (AIM=0) and FLAT x3 (AIM_FLAT=1) per seed, TASKS=1, 12,000 ticks, DIAG=1, replicate k
# reseeded after tick 1. A .done per run; running runs write .part and are skipped by later launches while their pid lives.
# MAXNEW=n starts at most n.
cd "$(dirname "$0")/../.."; OUT=lab/port/out-aim; mkdir -p $OUT
SEEDS=${SEEDS:-"11001 11002 11003"}; MAXNEW=${MAXNEW:-6}; started=0
busy(){ [ -e $OUT/$1.pid ] && kill -0 "$(cat $OUT/$1.pid)" 2>/dev/null; }
for k in 1 2 3; do for s in $SEEDS; do for arm in DEF NOAIM FLAT; do tag=${s}_${arm}$k; [ -e $OUT/$tag.done ] && continue; busy $tag && continue
  [ $started -ge $MAXNEW ] && break 3; started=$((started+1))
  case $arm in DEF) X="";; NOAIM) X="AIM=0";; FLAT) X="AIM_FLAT=1";; esac
  ( env $X SEED=$s TASKS=1 TICKS=12000 WIN=500 DIAG=1 RESEED_AT=1 RESEED=$k node lab/port/probe-reload.js > $OUT/$tag.jsonl.part 2> $OUT/$tag.err \
    && mv $OUT/$tag.jsonl.part $OUT/$tag.jsonl && touch $OUT/$tag.done ) &
  echo $! > $OUT/$tag.pid
done; done; done
echo "started $started"; wait
