#!/bin/bash
# lab/chance/waiter.sh - starts lab/chance/runs.sh only AFTER the meta-search held-out check has committed its verdict
# ("meta-search: held-out check on seeds ..." on cos/meta-search) and lab/meta/search.js has exited. Polls every 5 min; gives
# up (does not start) at 23:30 local time.   nohup lab/chance/waiter.sh &
cd "$(dirname "$0")/../.." || exit 1; MAIN=/home/box/repos/selection-is-clean; LOG=lab/chance/trial/waiter.log
echo "$(date) waiter started, pid $$" >> $LOG
while :; do
  if git -C $MAIN log cos/meta-search -30 --format=%s | grep -q '^meta-search: held-out check on seeds' && ! pgrep -f 'node lab/meta/search.js' >/dev/null; then
    echo "$(date) held-out commit seen and search.js gone: starting runs.sh" >> $LOG; exec bash lab/chance/runs.sh >> $LOG 2>&1; fi
  [ "$(date +%H%M)" -ge 2330 ] && { echo "$(date) gave up: no held-out commit by 23:30, nothing started" >> $LOG; exit 0; }
  sleep 300; done
