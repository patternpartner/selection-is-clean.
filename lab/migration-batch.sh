#!/bin/bash
# lab/migration-batch.sh OUTDIR [MAXNEW]  - runs the 70 rings of PREREG-migration.md one at a time (each ring is 4 worker threads on the 4 cores),
# skipping any ring whose .mig.json exists (a finished ring), starting at most MAXNEW new ones, so each launch fits a 30-minute window.
cd "$(dirname "$0")/.."; OUT=${1:?outdir}; MAXNEW=${2:-4}; n=0; mkdir -p "$OUT"
for k in 0 1 2 3 4 5 6 7 8 9; do S=$((2400+4*k)); SEEDS=$S,$((S+1)),$((S+2)),$((S+3))
 for arm in none sham0.001 ring0.001 sham0.01 ring0.01 sham0.1 ring0.1; do
  name=r${k}_$arm; [ -s "$OUT/$name.mig.json" ] && continue; [ $n -ge $MAXNEW ] && exit 0
  case $arm in none) mode=none; mig=0;; sham*) mode=sham; mig=${arm#sham};; ring*) mode=ring; mig=${arm#ring};; esac
  rm -f "$OUT/$name"-*.jsonl
  MODE=$mode MIG=$mig NAME=$name SEEDS=$SEEDS TICKS=300000 OUT=$OUT node lab/migration.js >/dev/null 2>"$OUT/$name.err" || { echo "FAILED $name"; exit 1; }
  n=$((n+1)); echo "done $name $(date +%H:%M:%S)"
 done; done
