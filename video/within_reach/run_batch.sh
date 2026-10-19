#!/bin/bash
# Start up to MAXNEW runs of 'Within Reach' that have no .done; wait. Relaunch until all 20 are done (each batch < 30 min).
#   MAXNEW=4 video/within_reach/run_batch.sh
cd "$(dirname "$0")"
MAXNEW=${MAXNEW:-4}
n=0
launch() { # dir arm seed
  local d=$1; [ -f $d/.done ] && return; [ $n -ge $MAXNEW ] && return
  rm -rf $d; mkdir -p $d
  python3 train.py --arm $2 --seed $3 --out $d > $d.log 2>&1 &
  n=$((n+1))
}
for s in 16 17 18 19 20; do for arm in slope-costs slope-interruptible slope-broken valley-costs; do launch ../../out/reach/runs/$arm-$s $arm $s; done; done
wait
ls ../../out/reach/runs/*/.done 2>/dev/null | wc -l
