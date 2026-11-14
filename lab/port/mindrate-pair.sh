#!/bin/bash
# #432 design (not a decision): after #431, the mind's value is one drawn instruction rewrite in a fifth of births. Is a fifth the
# right rate? One pair of fields run together: the shipped field (20%) against #mind=RATE (the same drawn writes, more often).
#   TAG=d1 RATE=40 [SECS=1500] lab/port/mindrate-pair.sh
cd "$(dirname "$0")/../.."; OUT=lab/port/out-mindrate; mkdir -p $OUT; SECS=${SECS:-1500}; TAG=${TAG:?}; RATE=${RATE:?}
rm -f $OUT/$TAG-r20.* $OUT/$TAG-r$RATE.*
SECS=$SECS EVERY=60 OUT=$OUT/$TAG-r20.jsonl node lab/port/field-rate.js > $OUT/$TAG-r20.log 2>&1 & a=$!
SECS=$SECS EVERY=60 HASH="#mind=$RATE" OUT=$OUT/$TAG-r$RATE.jsonl node lab/port/field-rate.js > $OUT/$TAG-r$RATE.log 2>&1 & b=$!
wait $a; ra=$?; wait $b; rb=$?; echo "$ra $rb" > $OUT/$TAG.done
node -e 'const fs=require("fs");for(const f of process.argv.slice(1)){const L=fs.readFileSync(f,"utf8").trim().split("\n").filter(Boolean).map(JSON.parse).filter(r=>r.F!==undefined);const z=L[L.length-1]||{};console.log(f.split("/").pop(),"F by 5 min:",L.filter(r=>r.t%300===0).map(r=>r.F).join(","),"| K",z.K,"A",z.A,"mind",z.sw&&z.sw.mindMode,"final",!!z.final,"bad",z.bad)}' $OUT/$TAG-r20.jsonl $OUT/$TAG-r$RATE.jsonl
