#!/bin/bash
# lab/chance/diag-waiter2.sh - replaces diag-waiter.sh (2026-10-04 ~12:50 BST). After runs.sh logs "pipeline finished", runs the
# POST-HOC diagnostics on stage 2 (NOT part of the go criterion): (a) lab/chance/chance-diag.js (churn/persistence, unchanged) and
# (b) lab/chance/chance-diag2.js (coexistence vs replacement; cause of death of one-window types), once chance-diag2.js is committed.
# Appends both to lab/CHANCE-ENGINE.md, commits and pushes cos/chance-engine. Gives up at 23:30.
cd "$(dirname "$0")/../.." || exit 1; LOG=lab/chance/trial/waiter.log
echo "$(date) diag-waiter2 started, pid $$" >> lab/chance/trial/diag-waiter2.log
until grep -q 'pipeline finished' $LOG && git ls-files --error-unmatch lab/chance/chance-diag2.js >/dev/null 2>&1 && [ -z "$(git status --porcelain lab/chance/chance-diag2.js)" ]; do
  [ "$(date +%H%M)" -ge 2330 ] && { echo "$(date) gave up at 23:30" >> lab/chance/trial/diag-waiter2.log; exit 0; }; sleep 60; done
sleep 30
CH=$(sed -n 's/^CHOSEN \(R[12]\).*/\1/p' lab/chance/trial/ce-pick.txt); A='D RANDCAP DIRECT DRIFT SHUF'; [ "$CH" = R2 ] && A="$A R1"
DIR=/home/box/chance-runs/s2-$CH SEEDS='113 114 115' ARMS="$A" DESIGN=D WIN=5 OUT=lab/chance/trial/chance-diag-s2.txt nice node lab/chance/chance-diag.js > /dev/null
DIR=/home/box/chance-runs/s2-$CH SEEDS='113 114 115' ARMS="$A" WIN=5 OUT=lab/chance/trial/chance-diag2-s2.txt nice node lab/chance/chance-diag2.js > /dev/null
{ echo; echo "#### POST-HOC diagnostic on stage 2 ($CH, 450k, seeds 113-115; appended by diag-waiter2.sh $(date '+%Y-%m-%d %H:%M %Z')). Not a go criterion."
  echo '```'; cat lab/chance/trial/chance-diag-s2.txt; echo '```'
  echo; echo "#### POST-HOC coexistence/replacement and cause-of-death readouts on stage 2 (chance-diag2.js; see definitions and limits above)"
  echo '```'; cat lab/chance/trial/chance-diag2-s2.txt; echo '```'; } >> lab/CHANCE-ENGINE.md
for i in 1 2 3 4 5; do [ -e .git/index.lock ] || [ -e "$(git rev-parse --git-dir)/index.lock" ] || break; sleep 20; done
git add lab/CHANCE-ENGINE.md lab/chance/trial && git commit -qm "chance-engine: post-hoc diagnostics (churn/persistence + coexistence/cause-of-death) on stage 2 appended" && for i in 1 2 3; do git push -q origin cos/chance-engine && break; sleep 60; done
echo "$(date) diag-waiter2 finished" >> lab/chance/trial/diag-waiter2.log
