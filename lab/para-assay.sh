#!/bin/bash
# lab/para-assay.sh OUTDIR [MAXNEW] - PREREG-para.md's assay: joins each finished run's 4 parts and runs core-assay.js SUCC=1 on it,
# 4 at a time, skipping runs whose .assay.txt exists; starts at most MAXNEW.
cd "$(dirname "$0")/.."; OUT=${1:?outdir}; MAXNEW=${2:-20}; n=0
for s in 3101 3102 3103 3104 3105 3106 3107 3108 3109 3110; do for arm in para ctrl; do
  [ -e "$OUT/${arm}_$s.seg4.done" ] || continue; [ -s "$OUT/${arm}_$s.assay.txt" ] && continue; [ $n -ge $MAXNEW ] && break 2
  pa=$([ $arm = para ] && echo 1 || echo 2); cat "$OUT/${arm}_$s".part{1,2,3,4}.jsonl > "$OUT/${arm}_$s.all.jsonl"
  ( OPTS="{\"PARA\":$pa}" SUCC=1 WIN=30 Q=4 PICK=8 REPS=6 T=3000 NPER=200 node lab/core-assay.js "$OUT/${arm}_$s.all.jsonl" > "$OUT/${arm}_$s.assay.tmp" 2>&1 && mv "$OUT/${arm}_$s.assay.tmp" "$OUT/${arm}_$s.assay.txt" ) &
  n=$((n+1)); [ $((n%4)) -eq 0 ] && wait
done; done; wait
