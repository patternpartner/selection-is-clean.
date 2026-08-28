#!/usr/bin/env bash
# Boot every rig briefly against engine.html and report which ones still work.
#
# Why this exists: c0cef11 renamed the simulation file (index.html -> engine.html) and 17 of the 18
# rigs that name it kept loading the old path. Because the worker shell left behind at index.html
# still HAS a <script> block, they compiled and then failed later — "N is not defined", or a text
# patch reporting "0 times, expected 1", which reads as source drift rather than a bad path. Nothing
# in the repo noticed for four commits. A rig is only useful if something checks it still runs.
#
#   ./smoke.sh              quick pass (40 ticks each)
#   TICKS=400 ./smoke.sh    slower, exercises more of each rig
set -u
cd "$(dirname "$0")"
TICKS="${TICKS:-40}"
pass=0; fail=0; failed=()

# oee-meter-test.js asserts the #131 meter semantics; the rest step the sim directly. harness-ablate/-ablate-bank shell out to harness-oee and
# harness-coupling-worker is a worker module, so all three are covered transitively.
RIGS=(oee-meter-test.js verb-test.js attention-test.js worldsignal-test.js crossing-test.js crossing-report.js sense-test.js roundtrip-test.js inherit-test.js diary.js liveness-report.js harness.js harness-ab.js harness-oee.js harness-strip.js harness-clamp.js harness-stream.js
      harness-tie.js harness-gates.js harness-meta-ablate.js harness-saturation.js
      harness-atrophy-probe.js harness-coupling.js harness-coupling-asym.js
      harness-alien-ablate.js harness-ablate-reflex.js harness-reflex-leaf.js
      harness-bridge.js bench-pairs.js)

# Most rigs take their budget from TICKS. A few define their own names and ignore it — pass those
# too, or the rig runs its real workload and the smoke pass just times out. (harness-coupling-asym
# matures a producer for 30,000 ticks before any peer joins; that is 45,000 ticks of work TICKS
# never touches, which is exactly how it "failed" the first smoke run.)
extra_env_for() {
  case "$1" in
    harness-coupling-asym.js) echo "MATURATION_TICKS=$TICKS COUPLE_TICKS=$TICKS FRESH_SEEDS=11" ;;
    harness-ablate-reflex.js) echo "CONC=1" ;;
    *) echo "" ;;
  esac
}

for r in "${RIGS[@]}"; do
  printf '  %-26s ' "$r"
  out=$(env TICKS="$TICKS" SAMPLE="$TICKS" SWIN="$TICKS" $(extra_env_for "$r") timeout 180 node "$r" 2>&1)
  rc=$?
  # A rig can exit 0 and still be broken: several report a failed text patch as JSON on stdout.
  err=$(printf '%s' "$out" | grep -oiE '"error":"[^"]*"|^[A-Za-z]*Error: .*' | head -1)
  if [ $rc -eq 0 ] && [ -z "$err" ]; then
    echo "ok"; pass=$((pass+1))
  else
    echo "FAIL ${err:-exit $rc}"; fail=$((fail+1)); failed+=("$r")
  fi
done

echo
echo "  $pass ok, $fail failing"
[ $fail -gt 0 ] && printf '  failing: %s\n' "${failed[*]}"
exit $(( fail > 0 ))
