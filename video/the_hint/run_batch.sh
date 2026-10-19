#!/bin/bash
# Start up to MAXNEW runs of 'The Hint' that have no .done; wait. Relaunch until all 12 are done (each batch < 30 min).
#   MAXNEW=4 video/the_hint/run_batch.sh          hint: seeds 21-28; noise: seeds 21-24
cd "$(dirname "$0")"
MAXNEW=${MAXNEW:-4}
n=0
launch() { # dir arm seed
  local d=$1; [ -f $d/.done ] && return; [ $n -ge $MAXNEW ] && return
  rm -rf $d; mkdir -p $d
  python3 train.py --arm $2 --seed $3 --out $d > $d.log 2>&1 &
  n=$((n+1))
}
for s in 21 22 23 24; do launch ../../out/hint/runs/hint-$s hint $s; launch ../../out/hint/runs/noise-$s noise $s; done
for s in 25 26 27 28; do launch ../../out/hint/runs/hint-$s hint $s; done
wait
ls ../../out/hint/runs/*/.done 2>/dev/null | wc -l
