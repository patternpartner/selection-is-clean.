#!/bin/bash
# #372: replay each collapsed #371 world exactly (same seed, reseed k, LAWMUT) with DIAG=1, to 1,500 ticks past its collapse.
# Lines: tag seed k lawmut collapse_tick. MAXNEW=n starts at most n and waits.
cd "$(dirname "$0")/../.."; OUT=lab/port/out-census2; mkdir -p $OUT; MAXNEW=${MAXNEW:-4}; started=0
busy(){ [ -e $OUT/$1.pid ] && kill -0 "$(cat $OUT/$1.pid)" 2>/dev/null; }
while read tag s k lm c; do [ -z "$tag" ] && continue; [ -e $OUT/$tag.done ] && continue; busy $tag && continue; [ $started -ge $MAXNEW ] && break; started=$((started+1))
  T=$((c+1500)); [ $T -gt 12000 ] && T=12000
  ( env SEED=$s TASKS=1 LAWMUT=$lm TICKS=$T WIN=250 RESEED_AT=1 RESEED=$k DIAG=1 node lab/port/probe-reload.js > $OUT/$tag.jsonl 2> $OUT/$tag.err && touch $OUT/$tag.done ) &
  echo $! > $OUT/$tag.pid
done <<'LIST'
10503_LAWS1 10503 1 1 2000
10502_LAWS2 10502 2 1 5000
10502_LAWS1 10502 1 1 6000
10501_NOLAW3 10501 3 0 6500
10502_LAWS3 10502 3 1 7000
10502_NOLAW1 10502 1 0 7500
10502_NOLAW3 10502 3 0 7500
10501_NOLAW2 10501 2 0 9500
LIST
echo "started $started"; wait
