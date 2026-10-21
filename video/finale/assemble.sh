#!/bin/bash
# The long cut of Eye-Service: the series cards (video/finale/scut.js, rendered to out/finale/cards, sound in
# out/finale/snd/cards.wav) cut into their pieces and set between the ten films' masters, in order.
#   video/finale/assemble.sh   -> out/finale/eye-service-the-series.mp4 (master), -share.mp4 (720x1280, under 30 MB)
set -e
cd "$(dirname "$0")/../.."
O=out/finale; P=$O/pieces; mkdir -p $P
FILMS=(out/eye/eye-service.mp4 out/photo/the-photograph.mp4 out/teach/teach-it-once.mp4 out/still/hold-still.mp4
  out/reach/within-reach.mp4 out/hint/the-hint.mp4 out/trust/trusted.mp4 out/turn/the-turn.mp4 out/habit/out-of-habit.mp4
  out/this/this-time.mp4)
for f in "${FILMS[@]}"; do [ -f $f ] || { echo "missing $f"; exit 1; }; done
# each card piece: its frames and its stretch of the cards' sound, 8 dB under the films
node -e "import('$PWD/video/finale/scut.js').then(m=>m.PIECES.forEach(p=>console.log(p.name,Math.round(p.t0*30),Math.round((p.t1-p.t0)*30))))" > $P/list.txt
while read name start n; do
  ffmpeg -v error -y -framerate 30 -start_number $start -i $O/cards/f%05d.jpg -ss $(python3 -c "print($start/30)") -t $(python3 -c "print($n/30)") -i $O/snd/cards.wav \
    -frames:v $n -map 0:v -map 1:a -af volume=-8dB -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 -ac 2 $P/$name.mp4 < /dev/null
done < $P/list.txt
ORDER=(open-1 open-2 open-3 F0 bridge-1 F1 bridge-2 F2 bridge-3 F3 bridge-4 F4 bridge-5 F5 bridge-6 F6 bridge-7 F7 bridge-8 F8 bridge-9 F9 end-1 end-2 end-3 end-4)
args=(); fg=""; i=0
for x in "${ORDER[@]}"; do
  if [[ $x == F* ]]; then args+=(-i "${FILMS[${x#F}]}"); else args+=(-i $P/$x.mp4); fi
  fg+="[$i:v]fps=30,setsar=1,format=yuv420p[v$i];[$i:a]aformat=sample_rates=48000:channel_layouts=stereo[a$i];"
  i=$((i+1))
done
cat=""; for ((k=0;k<i;k++)); do cat+="[v$k][a$k]"; done
ffmpeg -v error -y "${args[@]}" -filter_complex "${fg}${cat}concat=n=$i:v=1:a=1[v][a]" -map "[v]" -map "[a]" \
  -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart $O/eye-service-the-series.mp4
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 $O/eye-service-the-series.mp4)
vb=$(python3 -c "print(int((29.0*8*1024*1024/$dur - 128000)*0.97))")
ffmpeg -v error -y -i $O/eye-service-the-series.mp4 -vf scale=720:1280 -c:v libx264 -preset slow -b:v $vb -pass 1 -passlogfile $O/pass -an -f mp4 /dev/null
ffmpeg -v error -y -i $O/eye-service-the-series.mp4 -vf scale=720:1280 -c:v libx264 -preset slow -b:v $vb -pass 2 -passlogfile $O/pass -c:a aac -b:a 128k -movflags +faststart $O/eye-service-the-series-share.mp4
rm -f $O/pass*.log*
ls -la $O/eye-service-the-series*.mp4; echo "duration $dur"
