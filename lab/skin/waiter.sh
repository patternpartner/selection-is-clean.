#!/bin/bash
# Detached waiter for lab/PREREG-skin.md: waits until all 15 runs are done, re-running (identical configuration, at most
# twice each) any run whose process is gone without a .done file, then runs lab/skin/finish.sh once.
# Launch with:  (nohup setsid lab/skin/waiter.sh > lab/skin/raw/waiter.log 2>&1 &)
cd "$(dirname "$0")/../.." || exit 1
D=lab/skin/raw; declare -A tries
while true; do
  n=$(ls $D/*.done 2>/dev/null | wc -l)
  if [ "$n" = 15 ]; then echo "$(date +%T) all 15 done; finishing"; lab/skin/finish.sh; echo "$(date +%T) finish exit $?"; exit; fi
  if ! pgrep -f "lab/skin/run.sh" >/dev/null && ! pgrep -f "lab/core-run.js" >/dev/null; then
    for s in 16 17 18; do for a in S0 S1 S2 S3 S4; do
      if [ ! -f "$D/$a.$s.done" ]; then k="$a$s"; t=${tries[$k]:-0}
        if [ $t -lt 2 ]; then tries[$k]=$((t+1)); echo "$(date +%T) re-running $a $s (try $((t+1)))"; (ONLY="$a $s" nohup lab/skin/run.sh >> $D/run.log 2>&1 &)
        else echo "$(date +%T) $a $s failed twice; giving up"; fi; fi; done; done
    sleep 60; n2=$(ls $D/*.done 2>/dev/null | wc -l); if ! pgrep -f "lab/core-run.js" >/dev/null && [ "$n2" != 15 ]; then echo "$(date +%T) nothing running and only $n2 done; stopping"; exit 1; fi
  fi
  sleep 60
done
