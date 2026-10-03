#!/bin/bash
# nohup wrapper for lab/meta/search.js: resumes from $MS/state.json after a crash (up to 5 restarts).
#   MS=/tmp/ms P=8 STOP_AT=2026-10-04T07:30:00+01:00 nohup lab/meta/meta.sh > /tmp/ms/meta.log 2>&1 &
cd "$(dirname "$0")/../.." || exit 1; mkdir -p ${MS:-/tmp/ms}
for i in 1 2 3 4 5 6; do node lab/meta/search.js && { echo "$(date) META DONE"; exit 0; }; echo "$(date) search.js exited non-zero, restart $i"; sleep 30; done
echo "$(date) META GAVE UP"
