#!/bin/bash
# Watcher: every 5 min, relaunch the orchestrator if it is not running and the job is not finished. Exits when ALL-DONE exists.
# (It cannot survive a box restart itself: after a restart run lab/sticky/launch-robust.sh, which restarts both.)
cd "$(dirname "$0")/../.." || exit 1
while true; do
  if [[ -f lab/sticky/trial-rb/ALL-DONE ]]; then echo "$(date '+%F %T %Z') all done, watcher exits"; exit 0; fi
  if ! pgrep -f 'node lab/sticky/robust[.]js' >/dev/null; then echo "$(date '+%F %T %Z') orchestrator not running: relaunching"; bash lab/sticky/launch-robust.sh; fi
  sleep 300
done
