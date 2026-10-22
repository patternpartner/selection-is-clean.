#!/bin/bash
# Render 'Inside' in WORKERS parallel slices of the frames not yet made (capture.js also skips any made meanwhile), so
# relaunch until all are there (each launch fits inside the ~30 minutes a job may run here).
#   N=<frames> WORKERS=4 video/inside/render.sh
cd "$(dirname "$0")/../.."
OUT=out/inside/frames; mkdir -p $OUT
export ROOT=video PAGE=inside/film.html DATA='{"camera":"/out/inside/film/camera-41.json","garden":"/out/inside/film/garden-41.json"}'
W=${WORKERS:-4}; N=${N:?set N to the frame count}
# W ranges [a, b) holding about equal numbers of missing frames
RANGES=$(python3 - "$OUT" "$N" "$W" <<'PY'
import os, sys
out, n, w = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
miss = [i for i in range(n) if not os.path.exists(f'{out}/f{i:05d}.jpg')]
k = len(miss)
for j in range(w):
    part = miss[k * j // w: k * (j + 1) // w]
    if part: print(f'{part[0]}:{part[-1] + 1}')
PY
)
i=0
for r in $RANGES; do
  timeout ${LIMIT:-1620} nice -n 5 node video/eye_service/capture.js $OUT ${r%:*} ${r#*:} > $OUT/.log$i 2>&1 &
  i=$((i + 1))
done
wait
echo "frames $(ls $OUT/*.jpg 2>/dev/null | wc -l) of $N"
