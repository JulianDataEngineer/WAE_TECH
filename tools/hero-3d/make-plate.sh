#!/usr/bin/env bash
# Toma de fondo del hero 3D, a partir del video maestro.
#   0 – 3.5 s   ella se pone las gafas
#   3.5 – 38.5  se queda con las gafas puestas (el holograma se arma frente a ella)
#   38.5 – 41.5 se las quita (la misma toma en reversa: misma persona, cierre recíproco)
#   41.5 – 46   plano final para el logo
# Encuadre 1429x804 desde x=392: ella queda al 40 % del ancho (la torre va al 62 %)
# y la marca de agua del maestro (y ≥ 812) queda fuera.
set -euo pipefail
SRC="${SRC:-$HOME/Downloads/wae video final.mp4}"
OUT="$(dirname "$0")/assets/plate.mp4"
mkdir -p "$(dirname "$OUT")"
[ -f "$SRC" ] || { echo "no existe el video maestro: $SRC"; exit 1; }

CROP="crop=1429:804:392:0,scale=1920:1080:flags=lanczos,setsar=1"
GRADE="eq=contrast=1.04:saturation=1.06:brightness=0.02,unsharp=5:5:0.5:5:5:0"

ffmpeg -v error -y -i "$SRC" -filter_complex "
  [0:v]trim=0.45:3.25,setpts=(PTS-STARTPTS)*1.25,fps=30,$CROP,$GRADE,tpad=stop_mode=clone:stop_duration=35[a];
  [0:v]trim=0.45:3.25,setpts=PTS-STARTPTS,reverse,fps=30,$CROP,$GRADE,tpad=stop_mode=clone:stop_duration=4.6[b];
  [a][b]concat=n=2:v=1:a=0,trim=0:46,format=yuv420p[v]" \
  -map "[v]" -an -c:v libx264 -preset slow -crf 16 -movflags +faststart "$OUT"
ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT"
