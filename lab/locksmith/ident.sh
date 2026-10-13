#!/bin/bash
# lab/locksmith/ident.sh BASE_CORE_DIR - identity when off: rows and saves byte-identical to BASE's core (seed 7, 6,000 ticks)
# on plain, CHEM, CHEM+VIRUS, CHEM_BIG, CHEM_BIG+VIRUS, TASKS, CHEM_BIG+FLUXALL. Prints one line per config; exit 1 on any difference.
BASE=$1; HERE=$(cd "$(dirname "$0")/.." && pwd); T=$(mktemp -d); bad=0
for o in '{}' '{"CHEM":1}' '{"CHEM":1,"VIRUS":1,"V_ONSET":2000}' '{"CHEM":1,"CHEM_BIG":1}' '{"CHEM":1,"CHEM_BIG":1,"VIRUS":1,"V_ONSET":2000}' '{"TASKS":1}' '{"CHEM":1,"CHEM_BIG":1,"FLUXALL":1}'; do
  for d in "$BASE" "$HERE"; do k=$([ "$d" = "$BASE" ] && echo a || echo b)
    (cd "$T" && SEED=7 TICKS=6000 EVERY=1000 OPTS="$o" SAVE="$T/$k.save" node "$d/core-run.js" | sed 's/"wallS":[0-9.]*//' > "$T/$k.rows"); done
  if cmp -s "$T/a.rows" "$T/b.rows" && cmp -s "$T/a.save" "$T/b.save"; then echo "IDENTICAL $o"; else echo "DIFFERS   $o"; bad=1; fi; done
rm -rf "$T"; exit $bad
