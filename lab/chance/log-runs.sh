#!/bin/bash
# lab/chance/log-runs.sh - DESCRIPTIVE rerun with the trick logger (cos/chance-logging; not a go test). Same configs as stage 2 of
# lab/CHANCE-ENGINE.md: D (=R1), RANDCAP, DRIFT at 450k on seeds 113-115. Runs lab/chance/ce-logrun.js, resumable (.done).
# Afterwards: checks each run's sample JSONL against the stage-2 JSONL (must be identical apart from wallS), gzips the logs, waits
# until lab/chance/chance-diag2.js has the logged readouts committed, runs them, appends to lab/CHANCE-ENGINE.md and pushes.
#   setsid nohup lab/chance/log-runs.sh > /dev/null 2>&1 &
cd "$(dirname "$0")/../.." || exit 1; R=/home/box/chance-runs/log-s2; S2=/home/box/chance-runs/s2-R1; LOG=lab/chance/logtrial/log-runs.log; mkdir -p $R
B='"CHEM":1,"HBODY":1,"BODY_F":0.05,"BODY_MAX":16,"BODY_FUSE":0.02'
declare -A O=( [D]="{$B,\"BODY_RCAP\":1,\"CH_LEN\":1.5}" [RANDCAP]="{$B,\"BODY_RCAP\":1}" [DRIFT]="{$B,\"BODY_RCAP\":1,\"CH_LEN\":1.5,\"BODY_DRIFT\":1}" )
echo "$(date) log-runs started pid $$" >> $LOG
job(){ read -r A S OPT <<<"$1"; [ -f $R/$A-$S.done ] && return; SEED=$S TICKS=450000 OPTS="$OPT" LOGF=$R/$A-$S.log.jsonl node lab/chance/ce-logrun.js > $R/$A-$S.jsonl 2> $R/$A-$S.err && [ $(wc -l < $R/$A-$S.jsonl) = 450 ] && touch $R/$A-$S.done; echo "$(date +%T) done $A $S" >> lab/chance/logtrial/log-runs.log; }
export -f job; export R
for s in 113 114 115; do for a in D RANDCAP DRIFT; do echo "$a $s ${O[$a]}"; done; done | xargs -d '\n' -P 9 -I{} bash -c 'job "$@"' _ {}
: > lab/chance/logtrial/identity-450k.txt
for s in 113 114 115; do for a in D RANDCAP DRIFT; do x=$(sed 's/,"wallS":[0-9.]*}$/}/' $R/$a-$s.jsonl | sha256sum | cut -c1-64); y=$(sed 's/,"wallS":[0-9.]*}$/}/' $S2/$a-$s.jsonl | sha256sum | cut -c1-64); [ "$x" = "$y" ] && v=IDENTICAL || v=DIFFERENT; echo "$a $s logged-rerun $x stage2 $y $v" >> lab/chance/logtrial/identity-450k.txt; [ -f $R/$a-$s.log.jsonl ] && gzip -f $R/$a-$s.log.jsonl; done; done
echo "$(date) runs finished, identity: $(grep -c IDENTICAL lab/chance/logtrial/identity-450k.txt)/9 identical" >> $LOG
until grep -q 'LOGGED READOUTS' lab/chance/chance-diag2.js 2>/dev/null && [ -z "$(git status --porcelain lab/chance/chance-diag2.js)" ]; do [ "$(date +%H%M)" -ge 2330 ] && { echo "$(date) gave up waiting for diag" >> $LOG; exit 0; }; sleep 60; done
LOGS=$R SEEDS='113 114 115' ARMS='D RANDCAP DRIFT' OUT=lab/chance/logtrial/chance-diag2-logged.txt nice node lab/chance/chance-diag2.js > /dev/null 2>> $LOG
{ echo; echo "#### Logged readouts, raw (appended by log-runs.sh $(date '+%Y-%m-%d %H:%M %Z'); descriptive, not a go test)"; echo '```'; cat lab/chance/logtrial/identity-450k.txt; echo; cat lab/chance/logtrial/chance-diag2-logged.txt; echo '```'; } >> lab/CHANCE-ENGINE.md
git add lab/CHANCE-ENGINE.md lab/chance/logtrial && git commit -qm "chance-logging: logged rerun (D, RANDCAP, DRIFT, 450k, seeds 113-115): identity + cause-of-death/coexistence readouts" && for i in 1 2 3; do git push -q origin cos/chance-logging && break; sleep 60; done
echo "$(date) log-runs all done" >> $LOG
