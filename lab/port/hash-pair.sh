#!/bin/bash
# #479: one pair of browser fields run together on the SAME engine, differing only in the page hash (field-pair.sh changes the engine).
#   OUT=lab/port/out-x TAG=p1 NAME=deep0 HASH_A='' HASH_B='#deeppace=50' SECS=1200 lab/port/hash-pair.sh
cd "$(dirname "$0")/../.."; OUT=${OUT:?}; mkdir -p $OUT; SECS=${SECS:-1200}; TAG=${TAG:-p1}; NAME=${NAME:?}
HASH="${HASH_A:-}" SECS=$SECS EVERY=60 OUT=$OUT/$TAG-base.jsonl node lab/port/field-rate.js > $OUT/$TAG-base.log 2>&1 & a=$!
HASH="${HASH_B:?}" SECS=$SECS EVERY=60 OUT=$OUT/$TAG-$NAME.jsonl node lab/port/field-rate.js > $OUT/$TAG-$NAME.log 2>&1 & b=$!
wait $a; wait $b; echo done > $OUT/$TAG.done
node -e 'const fs=require("fs");for(const f of process.argv.slice(1)){const L=fs.readFileSync(f,"utf8").trim().split("\n").map(JSON.parse).filter(r=>r.F!==undefined);const z=L.filter(r=>r.t<=1230).pop();console.log(f.split("/").pop(),"F",z.F,"K",z.K,"A",z.A,"ge17",z.D&&z.D.ge17)}' $OUT/$TAG-base.jsonl $OUT/$TAG-$NAME.jsonl
