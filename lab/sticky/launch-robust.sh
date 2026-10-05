#!/bin/bash
# (Re)launch STICKY-ROBUST after a box restart. Idempotent: finished runs/segments are skipped, decisions are deterministic, nothing starts twice.
# Starts (1) the orchestrator lab/sticky/robust.js and (2) the watcher that relaunches it every 5 min if it died. TEST=1 => dry run in /tmp.
cd "$(dirname "$0")/../.." || exit 1
if [[ "$TEST" == 1 ]]; then TR=/tmp/srb-test/trial; LOG=/tmp/srb-test.log; else TR=lab/sticky/trial-rb; LOG=lab/sticky/trial-rb/robust.log; fi
mkdir -p "$TR"
if [[ -f "$TR/ALL-DONE" ]]; then echo "sticky-robust already complete ($(cat $TR/ALL-DONE))"; exit 0; fi
if pgrep -f 'node lab/sticky/robust[.]js' >/dev/null; then echo "orchestrator already running: pid $(pgrep -f 'node lab/sticky/robust[.]js' | tr '\n' ' ')";
else
  # orphaned run processes of THIS worktree from a killed orchestrator would race the new one: stop them first
  pkill -9 -f 'sticky-robust/lab/sticky/seg-run[.]js' 2>/dev/null; sleep 1
  TEST=$TEST setsid nohup node lab/sticky/robust.js >> "$LOG" 2>&1 < /dev/null &
  echo "launched orchestrator pid $!"
fi
if [[ "$TEST" != 1 ]] && ! pgrep -f 'lab/sticky/watch-robust[.]sh' >/dev/null; then
  setsid nohup bash lab/sticky/watch-robust.sh >> lab/sticky/trial-rb/watch.log 2>&1 < /dev/null &
  echo "launched watcher pid $!"
fi
