#!/bin/bash
# The pilot of 'Inside' (dev seeds 901-904 and, ROUND=2, 911-914; 16M steps): does the turn get learned, and is counting learned without being
# told? One launch is one chunk of about MINUTES; relaunch until all four print done.
cd "$(dirname "$0")"
MINUTES=${MINUTES:-24}; STEPS=${STEPS:-16000000}; ROUND=${ROUND:-1}
R=../../out/inside/pilot; mkdir -p $R
run() { [ -f $R/$1/.done ] && return; python3 train.py --arm $2 --seed $3 --steps $STEPS --minutes $MINUTES --out $R/$1 $4 >> $R/$1.log 2>&1 & }
if [ "$ROUND" = 1 ]; then      # This Time's exploration (entropy 0.03 -> 0.01)
  run explicit-camera-901 camera 901 --explicit; run blind-camera-902 camera 902; run blind-camera-903 camera 903; run blind-garden-904 garden 904
elif [ "$ROUND" = 3 ]; then    # round 3: from the honest gardener (904, garden-paid, its memory keeps no count), then paid for the cameras
  G=$R/blind-garden-904/ckpt_1.00.pt
  run gardener-camera-921 camera 921 "--init $G"; run gardener-camera-922 camera 922 "--init $G"
  run gardener-camera-923 camera 923 "--init $G --ent 0.01,0.001"; run gardener-camera-924 camera 924 "--init $G --ent 0.01,0.001"
elif [ "$ROUND" = 4 ]; then    # round 4: from the gardener part-way (15%: still exploring; 30%: less), then paid for the cameras
  G=$R/blind-garden-904
  run half-camera-931 camera 931 "--init $G/ckpt_0.15.pt"; run half-camera-932 camera 932 "--init $G/ckpt_0.15.pt"
  run third-camera-933 camera 933 "--init $G/ckpt_0.30.pt"; run third-camera-934 camera 934 "--init $G/ckpt_0.30.pt"
else                           # round 2: the series' original exploration (entropy 0.01 -> 0.001)
  run explicit-camera-911 camera 911 "--explicit --ent 0.01,0.001"; run blind-camera-912 camera 912 "--ent 0.01,0.001"
  run blind-camera-913 camera 913 "--ent 0.01,0.001"; run blind-garden-914 garden 914 "--ent 0.01,0.001"
fi
wait
for d in $R/*/; do echo "$(basename $d): $(cat $d/.partial 2>/dev/null || cat $d/.done 2>/dev/null)"; done
