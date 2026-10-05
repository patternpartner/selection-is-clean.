#!/bin/bash
# (Re)launch STICKY-LONGRUN after a box restart. Idempotent: finished segments/runs are skipped, and nothing starts twice.
# Starts (1) the orchestrator lab/sticky/longrun.js and (2) the watcher that relaunches it if it dies. TEST=1 => dry run in /tmp.
cd "$(dirname "$0")/../.." || exit 1
if [[ "$TEST" == 1 ]]; then TR=/tmp/slr-test/trial; LOG=/tmp/slr-test.log; else TR=lab/sticky/trial-lr; LOG=lab/sticky/trial-lr/longrun.log; fi
mkdir -p "$TR"
if [[ -f "$TR/ALL-DONE" ]]; then echo "longrun already complete ($(cat $TR/ALL-DONE))"; exit 0; fi
if pgrep -f 'node lab/sticky/longrun[.]js' >/dev/null; then echo "orchestrator already running: pid $(pgrep -f 'node lab/sticky/longrun[.]js')";
else
  # orphaned segment processes from a killed orchestrator would race the new one: stop them first
  pkill -9 -f 'lab/sticky/seg-run[.]js' 2>/dev/null; sleep 1
  TEST=$TEST setsid nohup node lab/sticky/longrun.js >> "$LOG" 2>&1 < /dev/null &
  echo "launched orchestrator pid $!"
fi
if [[ "$TEST" != 1 ]] && ! pgrep -f 'lab/sticky/watch-longrun[.]sh' >/dev/null; then
  setsid nohup bash lab/sticky/watch-longrun.sh >> lab/sticky/trial-lr/watch.log 2>&1 < /dev/null &
  echo "launched watcher pid $!"
fi
