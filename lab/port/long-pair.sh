#!/bin/bash
# #406: ONE LEG of two long fields run TOGETHER: the engine as it is (NAME-base) and a copy with one default changed (NAME-ARM), each
# chained across launches as long-field.sh does (its own port, browser profile and chain file). Run it again for the next leg.
#   PDIR=dir NAME=lp1 ARM=noground FROM="globalThis.__TASK_GROUND=1;" TO="globalThis.__TASK_GROUND=0;" lab/port/long-pair.sh
cd "$(dirname "$0")/../.."; NAME=${NAME:?}; ARM=${ARM:?}; OUT=lab/port/out-long; mkdir -p $OUT; P=${PDIR:?}; E=$P/engine-$NAME-$ARM.html
[ "$(grep -cF "$FROM" engine.html)" = 1 ] || { echo "pattern count for: $FROM"; exit 1; }
node -e 'const fs=require("fs");const [,f,t,o]=process.argv;fs.writeFileSync(o,fs.readFileSync("engine.html","utf8").split(f).join(t));' "$FROM" "$TO" "$E"
cmp -s engine.html $E && { echo "copy is identical"; exit 1; }
PORT=${PORT:-8941} PROFILE=$P/profile-$NAME-base CHAIN=$OUT/$NAME-base.chain.json SECS=${SECS:-1500} EVERY=60 OUT=$OUT/$NAME-base.jsonl node lab/port/field-rate.js > $OUT/$NAME-base.log 2>&1 & a=$!
PORT=$(( ${PORT:-8941} + 1 )) PROFILE=$P/profile-$NAME-$ARM CHAIN=$OUT/$NAME-$ARM.chain.json ENGINE=$E SECS=${SECS:-1500} EVERY=60 OUT=$OUT/$NAME-$ARM.jsonl node lab/port/field-rate.js > $OUT/$NAME-$ARM.log 2>&1 & b=$!
wait $a; wait $b
for x in base $ARM; do node -e 'const c=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));console.log(process.argv[2],"legs",c.legs,"elapsed",c.elapsed,"F",c.n)' $OUT/$NAME-$x.chain.json $x; done
