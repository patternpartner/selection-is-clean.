#!/bin/bash
# #428: one 25-minute stretch of watching a long detached field page (field-rate.js JANK=1): every 120 s, append the epoch, the largest
# chrome renderer's resident memory and all chrome processes' total (MB) to OUT. Run it again to keep watching; a harness job keeps the
# session (and the detached page) alive while it runs.
#   OUT=lab/port/out-jank/night1.mem lab/port/jank-watch.sh
OUT=${OUT:?}; END=$(( $(date +%s) + ${SECS:-1500} ))
while [ $(date +%s) -lt $END ]; do
  ps -eo rss,args | awk -v t=$(date +%s) '/chrom/ && !/awk/ { tot+=$1; if ($0 ~ /--type=renderer/ && $1>mx) mx=$1 } END { printf "%d %d %d\n", t, mx/1024, tot/1024 }' >> $OUT
  pgrep -f "OUT=lab/port/out-jank/night1.jsonl|field-rate.js" > /dev/null || { echo "page gone" >> $OUT; break; }
  sleep 120
done
