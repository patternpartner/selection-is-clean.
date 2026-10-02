#!/bin/bash
# Phase A waiter (trial seeds only). 1) waits for feas-v3, appends its readout to PHASEA, commits+pushes; 2) picks the design for
# the longer check by a rule fixed before seeing v3: v3 if FULL is ahead of NOAC/RAND/RANDN/SHUF in more seed-comparisons than
# v2 (12 possible), else v2; 3) runs that design at 450k on FRESH trial seeds 93-95 (all arms), appends readout + wall-clock,
# re-runs the byte-identity check, commits+pushes.   nohup lab/autocat/waiter.sh > /tmp/ac/waiter.log 2>&1 &
cd "$(dirname "$0")/../.." || exit 1; M=lab/PHASEA-autocatalysis.md
push(){ git add -A lab/PHASEA-autocatalysis.md lab/autocat lab/oee-core.js; git commit -qm "$1"; for i in 1 2 3; do git push -q origin cos/autocatalysis && break; sleep 30; done; }
until grep -q "ALL DONE" /tmp/ac/feas-v3.log 2>/dev/null; do sleep 30; done
ARMS="FULL NOAC RAND RANDN SHUF W1" DIR=/tmp/ac/feas-v3 SEEDS="90 91 92" node lab/autocat/trial.js > lab/autocat/trial/feas-v3.txt
s2=$(node lab/autocat/score.js /tmp/ac/feas-v2); s3=$(node lab/autocat/score.js /tmp/ac/feas-v3)
if [ "$s3" -gt "$s2" ]; then D=v3; EX='"NICHE_OPEN_D":1'; else D=v2; EX=''; fi
{ echo; echo "### v3 trial readout (seeds 90-92, 150k) — appended by waiter $(date '+%F %H:%M %Z')"; echo '```'; cat lab/autocat/trial/feas-v3.txt; echo '```'
  echo "FULL-ahead comparisons (of 12, vs NOAC/RAND/RANDN/SHUF): v2 $s2, v3 $s3 -> longer check uses **$D** (rule fixed before v3 was seen)."; } >> $M
push "autocat Phase A: v3 trial readout (seeds 90-92); long check design $D"
mkdir -p /tmp/ac/long; (OUT=/tmp/ac/long RANDN=1 AC='"NICHE_AC":2,"NICHE_AC_B":0.001' EXTRA="$EX" TICKS=450000 SEEDS="93 94 95" lab/autocat/feas.sh > /tmp/ac/long.log 2>&1)
ARMS="FULL NOAC RAND RANDN SHUF W1" DIR=/tmp/ac/long SEEDS="93 94 95" WIN=15 node lab/autocat/trial.js > lab/autocat/trial/long-$D-450k.txt
lab/autocat/bytecheck.sh > lab/autocat/trial/bytecheck.txt 2>&1
WALL=$(node -e 'const fs=require("fs");const v=[];for(const f of fs.readdirSync("/tmp/ac/long"))if(f.endsWith(".jsonl")){const L=fs.readFileSync("/tmp/ac/long/"+f,"utf8").trim().split("\n");const r=JSON.parse(L.at(-1));v.push(r.wallS/r.t*1e5);}v.sort((a,b)=>a-b);console.log(`median ${v[v.length>>1].toFixed(0)} s, range ${v[0].toFixed(0)}-${v.at(-1).toFixed(0)} s per 100k ticks (9 runs at once on 8 cores)`)')
{ echo; echo "### Longer feasibility check: design $D, FRESH trial seeds 93-95, 450k ticks, WIN 15 — appended $(date '+%F %H:%M %Z')"; echo '```'; cat lab/autocat/trial/long-$D-450k.txt; echo '```'
  echo "Wall-clock: $WALL."; echo "Byte-identity re-check (final code):"; echo '```'; cat lab/autocat/trial/bytecheck.txt; echo '```'; } >> $M
push "autocat Phase A: 450k feasibility check on trial seeds 93-95 ($D), wall-clock, byte-identity re-check"
echo "$(date) WAITER DONE"
