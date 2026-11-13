#!/bin/bash
# #424: ONE LEG of two long fields run TOGETHER: the shipped field (NAME-base) and the same engine with the tournament on (NAME-tour,
# index.html#tourney), each chained across launches as long-pair.sh does (its own port, browser profile and chain file). Run it again
# for the next leg; a leg reloads the field the last one left, and each universe's switches come back with its genome.
#   PDIR=dir NAME=tl1 [TOURHASH='#tourney'] lab/port/tourney-long.sh
cd "$(dirname "$0")/../.."; NAME=${NAME:?}; OUT=lab/port/out-tourney; mkdir -p $OUT; P=${PDIR:?}; TH=${TOURHASH:-#tourney}
PORT=${PORT:-8951} PROFILE=$P/profile-$NAME-base CHAIN=$OUT/$NAME-base.chain.json SECS=${SECS:-1500} EVERY=60 OUT=$OUT/$NAME-base.jsonl node lab/port/field-rate.js > $OUT/$NAME-base.log 2>&1 & a=$!
PORT=$(( ${PORT:-8951} + 1 )) PROFILE=$P/profile-$NAME-tour CHAIN=$OUT/$NAME-tour.chain.json HASH="$TH" SECS=${SECS:-1500} EVERY=60 OUT=$OUT/$NAME-tour.jsonl node lab/port/field-rate.js > $OUT/$NAME-tour.log 2>&1 & b=$!
wait $a; wait $b
for x in base tour; do node -e 'const c=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));console.log(process.argv[2],"legs",c.legs,"elapsed",c.elapsed,"F",c.n)' $OUT/$NAME-$x.chain.json $x; done
node -e 'const L=require("fs").readFileSync(process.argv[1],"utf8").trim().split("\n").map(JSON.parse).filter(r=>r.SWB);const z=L[L.length-1];if(z)console.log("tour switches on, of",z.SWBN,":",JSON.stringify(z.SWB),"adoptions",z.TOUR&&z.TOUR.adopt)' $OUT/$NAME-tour.jsonl
