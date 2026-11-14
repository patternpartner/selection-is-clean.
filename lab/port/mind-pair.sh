#!/bin/bash
# #431: IS THE MIND'S VALUE ITS LEARNING? One pair of browser fields run together: the engine as it is (the mind LEARNS from the
# parents it sees and writes one instruction in 20% of births) against a copy whose mind writes the same one instruction in the
# same 20% of births WITHOUT a model: the operation drawn as an ordinary TASKS mutation draws it (taskDrawOp's mix: TASK_DRAWP of
# them one of the five task operations, the rest any operation), the registers uniform. The copy is mindmode=uniform with that one
# change to what 'uniform' draws, made its default; it does not train, so its universes also skip the mind's training cost.
# Both changes are asserted to occur exactly once. The copy is byte-identical to the engine with the mind off (6cbe0c0d, node TASKS
# seed 3, 1,500 ticks) and differs with it on (MIND=20: c171d594 learn, d9bfc096 this draw, 9cff7c93 the old uniform).
#   EDIR=dir-for-the-copy OUT=lab/port/out-mind TAG=d1 [SECS=1500] lab/port/mind-pair.sh
cd "$(dirname "$0")/../.."; OUT=${OUT:?}; mkdir -p $OUT; SECS=${SECS:-1500}; TAG=${TAG:?}; E=${EDIR:?}/engine-mdraw.html
node -e '
const fs=require("fs");let s=fs.readFileSync("engine.html","utf8");
const a="if(this.MODE===\x27uniform\x27){ op=(this.rnd()*this.NOPS)|0; rg=(this.rnd()*this.NREG)|0; }";
const b="if(this.MODE===\x27uniform\x27){ op=(TASKS_ON&&this.rnd()<TASK_DRAWP)?TASK_OP0+((this.rnd()*5)|0):(this.rnd()*this.NOPS)|0; rg=(this.rnd()*this.NREG)|0; }";
const c="let p=g.__MIND|0, mode=g.__MIND_MODE|0;", d="let p=g.__MIND|0, mode=(g.__MIND_MODE|0)||2;";
if(s.split(a).length!==2||s.split(c).length!==2){ console.error("pattern count"); process.exit(1); }
fs.writeFileSync(process.argv[1], s.split(a).join(b).split(c).join(d));' "$E" || exit 1
rm -f $OUT/$TAG-learn.* $OUT/$TAG-draw.*
SECS=$SECS EVERY=60 OUT=$OUT/$TAG-learn.jsonl node lab/port/field-rate.js > $OUT/$TAG-learn.log 2>&1 & a=$!
SECS=$SECS EVERY=60 ENGINE=$E OUT=$OUT/$TAG-draw.jsonl node lab/port/field-rate.js > $OUT/$TAG-draw.log 2>&1 & b=$!
wait $a; ra=$?; wait $b; rb=$?; echo "$ra $rb" > $OUT/$TAG.done
node -e 'const fs=require("fs");for(const f of process.argv.slice(1)){const L=fs.readFileSync(f,"utf8").trim().split("\n").filter(Boolean).map(JSON.parse).filter(r=>r.F!==undefined);const z=L[L.length-1]||{};console.log(f.split("/").pop(),"F by 5 min:",L.filter(r=>r.t%300===0).map(r=>r.F).join(","),"| K",z.K,"A",z.A,"final",!!z.final,"bad",z.bad)}' $OUT/$TAG-learn.jsonl $OUT/$TAG-draw.jsonl
