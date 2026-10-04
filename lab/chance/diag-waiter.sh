#!/bin/bash
# lab/chance/diag-waiter.sh - after runs.sh logs "pipeline finished", run the post-hoc chance-diag on stage 2 (R1 arms: churn and
# persistence only; R1 has no evolvable randomness) and append it to lab/CHANCE-ENGINE.md. Gives up at 23:30.
cd "$(dirname "$0")/../.." || exit 1; LOG=lab/chance/trial/waiter.log
until grep -q 'pipeline finished' $LOG; do [ "$(date +%H%M)" -ge 2330 ] && exit 0; sleep 120; done
CH=$(sed -n 's/^CHOSEN \(R[12]\).*/\1/p' lab/chance/trial/ce-pick.txt); A='D RANDCAP DIRECT DRIFT SHUF'; [ "$CH" = R2 ] && A="$A R1"
DIR=/home/box/chance-runs/s2-$CH SEEDS='113 114 115' ARMS="$A" DESIGN=D WIN=5 OUT=lab/chance/trial/chance-diag-s2.txt nice node lab/chance/chance-diag.js > /dev/null
{ echo; echo "#### Diagnostic on stage 2 ($CH, 450k, seeds 113-115; appended by diag-waiter.sh $(date '+%Y-%m-%d %H:%M %Z'))"; echo '```'; cat lab/chance/trial/chance-diag-s2.txt; echo '```'; } >> lab/CHANCE-ENGINE.md
git add lab/CHANCE-ENGINE.md lab/chance/trial && git commit -qm "chance-engine: post-hoc diagnostic on stage 2 appended" && for i in 1 2 3; do git push -q && break; sleep 60; done
