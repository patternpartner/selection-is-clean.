#!/bin/bash
# Start up to MAXNEW decision runs that have no .done yet, in parallel, and wait for them. Relaunch until all are done.
#   MAXNEW=4 video/eye_service/run_batch.sh
cd "$(dirname "$0")"
MAXNEW=${MAXNEW:-4}
n=0
for s in 1 2 3 4 5; do for arm in camera garden; do
  d=../../out/eye/runs/$arm-$s
  [ -f $d/.done ] && continue
  [ $n -ge $MAXNEW ] && continue
  rm -rf $d; mkdir -p $d
  python3 ppo.py --arm $arm --seed $s --out $d > $d.log 2>&1 &
  n=$((n+1))
done; done
wait
ls ../../out/eye/runs/*/.done 2>/dev/null
