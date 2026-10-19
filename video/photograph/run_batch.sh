#!/bin/bash
# Start up to MAXNEW of The Photograph's decision runs that have no .done yet, in parallel, and wait. Relaunch until done.
#   MAXNEW=4 video/photograph/run_batch.sh
cd "$(dirname "$0")"
MAXNEW=${MAXNEW:-4}
n=0
for run in camera-1 garden-1 inspected-1 inspected-2 camera-2 garden-2 inspected-3 camera-3 garden-3 inspected-4 camera-4 garden-4 inspected-5 camera-5 garden-5; do
  d=../../out/photo/runs/$run
  [ -f $d/.done ] && continue
  [ $n -ge $MAXNEW ] && continue
  rm -rf $d; mkdir -p $d
  python3 train.py --arm ${run%-*} --seed ${run##*-} --steps 8000000 --out $d > $d.log 2>&1 &
  n=$((n+1))
done
wait
ls ../../out/photo/runs/*/.done 2>/dev/null
