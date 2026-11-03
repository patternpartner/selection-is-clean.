#!/bin/bash
# #375 (PREREG-revive.md): today's default world on seeds 10801-10810, 12,000 ticks, saves at 4,000/8,000/12,000 (genome, population,
# lifetime record). A .done per run; a running run writes .part and is skipped by later launches while its pid lives.
cd "$(dirname "$0")/../.."; OUT=lab/port/out-gen; mkdir -p $OUT
SEEDS=${SEEDS:-"10801 10802 10803 10804 10805 10806 10807 10808 10809 10810"}; MAXNEW=${MAXNEW:-6}; started=0
busy(){ [ -e $OUT/$1.pid ] && kill -0 "$(cat $OUT/$1.pid)" 2>/dev/null; }
for s in $SEEDS; do [ -e $OUT/$s.done ] && continue; busy $s && continue; [ $started -ge $MAXNEW ] && break; started=$((started+1))
  ( env SEED=$s TASKS=1 TICKS=12000 WIN=500 SAVEAT=4000,8000,12000 SAVEDIR=$OUT POP=1 DIAG=1 node lab/port/probe-reload.js > $OUT/$s.jsonl.part 2> $OUT/$s.err \
    && mv $OUT/$s.jsonl.part $OUT/$s.jsonl && touch $OUT/$s.done ) &
  echo $! > $OUT/$s.pid
done; echo "started $started"; wait
