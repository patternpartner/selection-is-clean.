#!/bin/bash
# (Re)launch the sticky search; safe after a box restart (finished runs are skipped). Refuses if already running.
cd "$(dirname "$0")/../.." || exit 1
if pgrep -f "node lab/sticky/search.js" >/dev/null; then echo "already running: $(pgrep -f 'node lab/sticky/search.js')"; exit 0; fi
setsid nohup node lab/sticky/search.js >> lab/sticky/trial/search.log 2>&1 < /dev/null &
echo "launched pid $!"
