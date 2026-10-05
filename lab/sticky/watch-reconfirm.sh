#!/bin/bash
cd "$(dirname "$0")/../.." || exit 1
LOG=lab/sticky/trial/watch-reconfirm.log
while true; do
  if [[ -f lab/sticky/trial/reconfirm.txt ]] && [[ -f lab/sticky/trial/reconfirm-exploratory-e003-noCH.txt ]]; then
    echo "$(date -Is) done" >> "$LOG"; exit 0
  fi
  if ! pgrep -f "lab/sticky/run-reconfirm.js" >/dev/null && ! pgrep -f "node lab/sticky/search.js" >/dev/null; then
    echo "$(date -Is) relaunching" >> "$LOG"
    bash lab/sticky/launch-reconfirm.sh >> "$LOG" 2>&1
  fi
  sleep 300
done
