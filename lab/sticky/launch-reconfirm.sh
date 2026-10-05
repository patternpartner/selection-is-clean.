#!/bin/bash
# (Re)launch c055 re-confirmation on seeds 401-403; safe after a box restart (finished runs are skipped).
cd "$(dirname "$0")/../.." || exit 1
if [[ -f lab/sticky/trial/reconfirm.txt ]] && [[ -f lab/sticky/trial/reconfirm-exploratory-e003-noCH.txt ]]; then
  echo "reconfirm already complete"; exit 0
fi
if pgrep -f "lab/sticky/run-reconfirm.js" >/dev/null || pgrep -f "node lab/sticky/search.js" >/dev/null; then
  echo "already running: $(pgrep -af 'lab/sticky/(run-reconfirm|search)')"
  exit 0
fi
setsid nohup node lab/sticky/run-reconfirm.js >> lab/sticky/trial/reconfirm.log 2>&1 < /dev/null &
echo "launched reconfirm pid $!"
