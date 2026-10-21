#!/bin/bash
# The pilot of 'Inside' (dev seeds 901-904, 16M steps): does the turn get learned, and is counting learned without being
# told? One launch is one chunk of about MINUTES; relaunch until all four print done.
cd "$(dirname "$0")"
MINUTES=${MINUTES:-24}; STEPS=${STEPS:-16000000}
R=../../out/inside/pilot; mkdir -p $R
run() { [ -f $R/$1/.done ] && return; python3 train.py --arm $2 --seed $3 --steps $STEPS --minutes $MINUTES --out $R/$1 $4 >> $R/$1.log 2>&1 & }
run explicit-camera-901 camera 901 --explicit
run blind-camera-902 camera 902
run blind-camera-903 camera 903
run blind-garden-904 garden 904
wait
for d in $R/*/; do echo "$(basename $d): $(cat $d/.partial 2>/dev/null || cat $d/.done 2>/dev/null)"; done
