#!/usr/bin/env bash
# Render final del hero con las manos DELANTE del holograma.
#   1. pasada completa (con holograma)
#   2. pasada sin holograma (hideWorld): mismo color, marco del visor y HUD
#   3. las manos de la pasada 2 se recortan con su alfa (pov-hands.webm) y se
#      ponen encima de la 1: los dedos tapan el cubo como si lo tocaran.
# Requisitos previos: make-bg.py, remove-background → assets/hands/pov-hands.webm,
# track-hands.py → assets/hands/hands.js
set -euo pipefail
cd "$(dirname "$0")"
OUT="${OUT:-$HOME/Downloads/wae hero bogota v3.mp4}"
CACHE=assets/hands/passes; mkdir -p "$CACHE"   # pasadas guardadas: el recorte se ajusta sin re-renderizar
POV_START=7.2   # segundo del video en que empieza la vista del visor

if [ "${SKIP_RENDER:-0}" != 1 ]; then
  hyperframes render . -f 30 -q high -w 6 -o "$CACHE/full.mp4"
  hyperframes render . -f 30 -q high -w 6 --variables '{"hideWorld":true}' -o "$CACHE/plate.mp4"
fi

# alfa de las manos, desplazado al tramo del visor. Se endurece: lo semitransparente
# débil (halos y manchas de movimiento) abría huecos en el holograma.
ffmpeg -v error -y -i "$CACHE/full.mp4" -i "$CACHE/plate.mp4" -c:v libvpx-vp9 -i assets/hands/pov-hands.webm \
  -filter_complex "
    [2:v]alphaextract,lut=y='clip((val-100)*255/90\,0\,255)',gblur=sigma=0.8,setpts=PTS+${POV_START}/TB,format=gray[a];
    [1:v][a]alphamerge[hands];
    [0:v][hands]overlay=eof_action=pass:format=auto,format=yuv420p[v]" \
  -map "[v]" -an -c:v libx264 -preset slow -crf 15 -movflags +faststart "$OUT"
echo "→ $OUT"
