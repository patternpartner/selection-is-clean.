#!/bin/bash
# Start up to MAXNEW runs of 'Trusted' that have no .done; wait. Relaunch until all 10 are done (each batch < 30 min).
#   MAXNEW=4 video/trusted/run_batch.sh          camera and garden, seeds 31-35
cd "$(dirname "$0")"
MAXNEW=${MAXNEW:-4}
n=0
launch() { # dir arm seed
  local d=$1; [ -f $d/.done ] && return; [ $n -ge $MAXNEW ] && return
  rm -rf $d; mkdir -p $d
  python3 train.py --arm $2 --seed $3 --out $d > $d.log 2>&1 &
  n=$((n+1))
}
for s in 31 32 33 34 35; do launch ../../out/trust/runs/camera-$s camera $s; launch ../../out/trust/runs/garden-$s garden $s; done
wait
ls ../../out/trust/runs/*/.done 2>/dev/null | wc -l
