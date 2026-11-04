#!/bin/bash
# Keep a batch topped up: every 30 s, if fewer than CAP probe processes run, start (CAP - running) more with the batch's MAXNEW.
# Runs are started in their own session (setsid) so they outlive this driver; it exits when TOTAL runs are done or after LIMIT s.
#   BATCH=lab/port/refuge2-batch.sh OUT=lab/port/out-refuge2 TOTAL=40 CAP=7 lab/port/drive.sh
cd "$(dirname "$0")/../.."; CAP=${CAP:-7}; LIMIT=${LIMIT:-6600}; t0=$(date +%s)
while :; do
  n=$(ls $OUT/*.done 2>/dev/null | wc -l); [ $n -ge $TOTAL ] && { echo "all $TOTAL done"; exit 0; }
  [ $(( $(date +%s)-t0 )) -ge $LIMIT ] && { echo "limit reached at $n done"; exit 0; }
  r=$(pgrep -fc "node lab/port/probe-reload.js"); if [ $r -lt $CAP ]; then MAXNEW=$((CAP-r)) setsid $BATCH > /dev/null 2>&1 < /dev/null & sleep 5; fi
  sleep 30
done
