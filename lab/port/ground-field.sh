#!/bin/bash
# #397 DESIGN in a field: one pair of browser fields run together, today's engine against the same engine with TASK_GROUND's default
# set to MODE (a copy made here by sed, count asserted), SECS each. A field is 31 universes, so its total varies far less than a world's.
#   MODE=3 TAG=a lab/port/ground-field.sh
cd "$(dirname "$0")/../.."; OUT=lab/port/out-ground-field; mkdir -p $OUT; SECS=${SECS:-1500}; MODE=${MODE:?}; TAG=${TAG:-a}
E=${EDIR:-/tmp}/engine-ground$MODE.html   # EDIR, not TMPDIR: chromium aborts at launch when TMPDIR is redirected
[ "$(grep -c "__tk('__TASK_GROUND',0)" engine.html)" = 1 ] || { echo "pattern count"; exit 1; }
sed "s/__tk('__TASK_GROUND',0)/__tk('__TASK_GROUND',$MODE)/" engine.html > $E
SECS=$SECS EVERY=60 OUT=$OUT/$TAG-g0.jsonl node lab/port/field-rate.js > $OUT/$TAG-g0.log 2>&1 & a=$!
SECS=$SECS EVERY=60 ENGINE=$E OUT=$OUT/$TAG-g$MODE.jsonl node lab/port/field-rate.js > $OUT/$TAG-g$MODE.log 2>&1 & b=$!
wait $a; wait $b; echo done > $OUT/$TAG-g$MODE.done
for f in $OUT/$TAG-g0.jsonl $OUT/$TAG-g$MODE.jsonl; do tail -n 1 $f | node -e 'const r=JSON.parse(require("fs").readFileSync(0,"utf8"));console.log(process.argv[1],"F",r.F,"K",r.K,"A",r.A,"U",r.U,"bad",r.bad)' $f; done
