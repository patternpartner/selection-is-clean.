#!/bin/bash
# Assemble 'Eye-Service' from rendered frames and the synthesized sound.
#   video/eye_service/finish.sh            (frames in out/eye/full, sound in out/eye/snd/eye.wav)
# Writes out/eye/eye-service.mp4 (master), eye-service-share.mp4 (under 30 MB), eye-service-silent.mp4 (no sound).
# Another film: F=out/photo/full A=out/photo/snd/photo.wav O=out/photo NAME=the-photograph video/eye_service/finish.sh
set -e
cd "$(dirname "$0")/../.."
F=${F:-out/eye/full}; A=${A:-out/eye/snd/eye.wav}; O=${O:-out/eye}; NAME=${NAME:-eye-service}
n=$(ls $F/f*.jpg | wc -l); echo "frames: $n"
# every frame must exist and decode, or the film drifts off its sound
python3 - "$F" <<'EOF'
import sys, glob, os
from PIL import Image
fs = sorted(glob.glob(sys.argv[1] + '/f*.jpg'))
want = [f'{sys.argv[1]}/f{i:05d}.jpg' for i in range(len(fs))]
assert fs == want, 'frames missing or misnumbered'
bad = []
for f in fs:
    try:
        Image.open(f).verify()
    except Exception:
        bad.append(f)
assert not bad, f'corrupt frames: {bad[:5]}'
print('frames ok', len(fs))
EOF
ffmpeg -v error -y -framerate 30 -i $F/f%05d.jpg -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -movflags +faststart $O/$NAME-silent.mp4
ffmpeg -v error -y -i $O/$NAME-silent.mp4 -i $A -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart $O/$NAME.mp4
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 $O/$NAME.mp4)
vb=$(python3 -c "print(int((29.0*8*1024*1024/$dur - 160000)*0.97))")
ffmpeg -v error -y -i $O/$NAME.mp4 -c:v libx264 -preset slow -b:v $vb -pass 1 -passlogfile $O/pass -an -f mp4 /dev/null
ffmpeg -v error -y -i $O/$NAME.mp4 -c:v libx264 -preset slow -b:v $vb -pass 2 -passlogfile $O/pass -c:a aac -b:a 160k -movflags +faststart $O/$NAME-share.mp4
rm -f $O/pass*.log*
ls -la $O/$NAME*.mp4
