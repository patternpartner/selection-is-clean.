#!/bin/bash
# #462: a field as a Samsung Note 8 would run it, roughly: the browser pinned to 2 of this machine's 4 cores (CPU=0,1), the page reporting
# 4 GB (so the field builds one layer, 18 universes), a phone-sized viewport (field-rate's 412x915), the freeze probe on (JANK=1), and the
# browser's total resident memory sampled every 30 s. NAME=label HASH='#...' SECS=600 lab/port/phone-run.sh
cd "$(dirname "$0")/../.."; OUT=lab/port/out-phone; mkdir -p $OUT; NAME=${NAME:?}; SECS=${SECS:-600}
( while true; do echo "$(date +%s) $(ps -eo rss,comm | awk '/chrom/ {s+=$1} END {print s+0}')"; sleep 30; done ) > $OUT/$NAME.mem & m=$!
taskset -c ${CPU:-0,1} env SECS=$SECS EVERY=60 JANK=1 DEVMEM=4 HASH="$HASH" OUT=$OUT/$NAME.jsonl node lab/port/field-rate.js > $OUT/$NAME.log 2>&1
kill $m; touch $OUT/$NAME.done
