#!/bin/bash
# One pair of browser fields run together: the engine as it is against a copy with ONE default changed by sed. A field sums 31
# universes, so a pair shows what a handful of node worlds cannot (#397). SECS each, sampled every 60 s.
#   EDIR=dir-for-the-copy OUT=lab/port/out-x TAG=a NAME=roy25 FROM="__tk('__TASK_ROYP',0)" TO="__tk('__TASK_ROYP',25)" lab/port/field-pair.sh
# FROM must occur exactly once in engine.html (asserted). Set EDIR, never TMPDIR: Chromium aborts at launch with TMPDIR redirected.
cd "$(dirname "$0")/../.."; OUT=${OUT:?}; mkdir -p $OUT; SECS=${SECS:-1500}; TAG=${TAG:-a}; NAME=${NAME:?}; E=${EDIR:-/tmp}/engine-$NAME.html
[ "$(grep -cF "$FROM" engine.html)" = 1 ] || { echo "pattern count for: $FROM"; exit 1; }
node -e 'const fs=require("fs");const [,f,t,o]=process.argv;const s=fs.readFileSync("engine.html","utf8");fs.writeFileSync(o,s.split(f).join(t));' "$FROM" "$TO" "$E"
cmp -s engine.html $E && { echo "copy is identical"; exit 1; }
SECS=$SECS EVERY=60 OUT=$OUT/$TAG-base.jsonl node lab/port/field-rate.js > $OUT/$TAG-base.log 2>&1 & a=$!
SECS=$SECS EVERY=60 ENGINE=$E OUT=$OUT/$TAG-$NAME.jsonl node lab/port/field-rate.js > $OUT/$TAG-$NAME.log 2>&1 & b=$!
wait $a; wait $b; echo done > $OUT/$TAG.done
node -e 'const fs=require("fs");for(const f of process.argv.slice(1)){const L=fs.readFileSync(f,"utf8").trim().split("\n").map(JSON.parse).filter(r=>r.F!==undefined);const z=L[L.length-1];console.log(f.split("/").pop(),"F by 5 min:",L.filter(r=>r.t%300===0).map(r=>r.F).join(","),"| K",z.K,"A",z.A,"final",!!z.final,"bad",z.bad)}' $OUT/$TAG-base.jsonl $OUT/$TAG-$NAME.jsonl
