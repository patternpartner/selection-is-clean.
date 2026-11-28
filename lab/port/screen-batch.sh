#!/bin/bash
# #478: a node screen of economy knobs against today's default (cap 1, eight payments), seeds 11-13, 6,000 ticks. Skips finished runs
# (.done), starts at most MAXPAR at once, exits when all are done.   lab/port/screen-batch.sh
cd "$(dirname "$0")/../.."; OUT=lab/port/out-screen; mkdir -p $OUT; MAXPAR=${MAXPAR:-5}
ARMS="base: k200:REPL_CROWD_K=200 k50:REPL_CROWD_K=50 rate2:TASK_RATEM=40 cap2:TASK_CAPM=800 mind40:MIND=40 ep25:TASK_EPOCHN=25"
jobs=(); for a in $ARMS; do n=${a%%:*}; kv=${a#*:}; for s in 11 12 13; do f=$OUT/$n-$s; [ -f $f.done ] && continue; jobs+=("$n|$kv|$s"); done; done
i=0; for j in "${jobs[@]}"; do IFS='|' read n kv s <<< "$j"; f=$OUT/$n-$s
  ( env SEED=$s TICKS=6000 TASKS=1 MIND=20 $kv node lab/port/digest.js > $f.json 2>&1 && touch $f.done ) &
  i=$((i+1)); if [ $((i % MAXPAR)) = 0 ]; then wait; fi; done; wait
for a in $ARMS; do n=${a%%:*}; printf "%-7s" $n; for s in 11 12 13; do f=$OUT/$n-$s.json; [ -f $f ] && printf " %8s" $(node -e 'try{const j=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));process.stdout.write(String(j.seen))}catch(e){process.stdout.write("-")}' $f); done; echo; done
