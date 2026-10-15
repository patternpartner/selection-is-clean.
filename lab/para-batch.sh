#!/bin/bash
# lab/para-batch.sh OUTDIR [MAXSEG]  - PREREG-para.md: 10 seeds x 2 arms, 1,000,000 ticks each in 4 segments of 250,000 (saved and resumed
# exactly), 4 segments at a time on the 4 cores; starts at most MAXSEG new segments, so a launch fits a 30-minute window. Then the assay.
cd "$(dirname "$0")/.."; OUT=${1:?outdir}; MAXSEG=${2:-8}; SEGT=250000; NSEG=4; mkdir -p "$OUT"; n=0; jobs_=()
next(){ for s in 3101 3102 3103 3104 3105 3106 3107 3108 3109 3110; do for arm in para ctrl; do
  k=0; while [ -e "$OUT/${arm}_$s.seg$((k+1)).done" ]; do k=$((k+1)); done; [ $k -ge $NSEG ] && continue
  [ -e "$OUT/${arm}_$s.running" ] && continue; echo "$arm $s $k"; return; done; done; }
while [ $n -lt $MAXSEG ]; do
  while [ $(ls "$OUT"/*.running 2>/dev/null | wc -l) -ge 4 ]; do sleep 5; done
  j=$(next); [ -z "$j" ] && break; set -- $j; arm=$1; s=$2; k=$3; pa=$([ $arm = para ] && echo 1 || echo 2)
  touch "$OUT/${arm}_$s.running"
  ( LOAD=$([ $k -gt 0 ] && echo "$OUT/${arm}_$s.save$k.json"); \
    SEED=$s TICKS=$SEGT EVERY=1000 OPTS="{\"PARA\":$pa}" LOAD=$LOAD SAVE="$OUT/${arm}_$s.save$((k+1)).json" node lab/core-run.js > "$OUT/${arm}_$s.part$((k+1)).jsonl" 2>"$OUT/${arm}_$s.err" \
    && touch "$OUT/${arm}_$s.seg$((k+1)).done"; rm -f "$OUT/${arm}_$s.running"; [ $k -gt 0 ] && rm -f "$OUT/${arm}_$s.save$k.json" ) &
  n=$((n+1)); sleep 1
done; wait
