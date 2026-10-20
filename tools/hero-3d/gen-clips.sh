#!/usr/bin/env bash
# Genera los clips de video del hero con Kling 3.0 Pro (Higgsfield), en paralelo.
# Cada clip va de una foto inicial a una final (assets/video/k_*.png), así la
# persona, la oficina y Bogotá quedan idénticas a las fotos. ~8,75 créditos/clip.
#   bash tools/hero-3d/gen-clips.sh            genera los que falten
#   bash tools/hero-3d/gen-clips.sh clip4      solo ese
set -uo pipefail
cd "$(dirname "$0")/assets/video"
HF=/usr/local/bin/higgsfield

POV="First-person point of view from inside a mixed-reality headset. Her own two hands: navy blazer sleeves, white shirt cuffs, a thin gold bracelet on the left wrist. The camera is completely static. The background stays perfectly still: floor-to-ceiling office windows with the green Cerros Orientales, the white Monserrate sanctuary on the peak and the Bogotá skyline, warm late-afternoon light. Natural, calm, human motion with subtle easing and realistic motion blur. Photorealistic, no text, no UI, no holograms, no extra hands."
ROOM="Static camera, medium shot. A Latina professional woman in a navy blazer and white blouse, dark hair in a low bun, in a premium Bogotá office; floor-to-ceiling windows behind her show the green Cerros Orientales with the white Monserrate sanctuary and the city. Warm late-afternoon light. The headset is a generic mixed-reality headset with an aluminum frame and dark glass, no brand marks. Natural, calm, human motion with realistic motion blur. Photorealistic, no text, no logos."

spec() {  # START END PROMPT de cada clip
  case $1 in
    clip1) S=k_p01.png; E=k_p06.png; P="$ROOM She raises the headset from chest height and puts it on in one smooth, unhurried movement, adjusting it with both hands, a slight smile." ;;
    clip3) S=k_a3.png; E=k_b1.png; P="$POV The open hands slowly come back together toward the center, as if gathering scattered pieces into one place, then the left hand relaxes down while the right hand rises a little, ready to point." ;;
    clip4) S=k_b1.png; E=k_b4.png; P="$POV The right hand reaches forward calmly toward the center-right, the thumb and index finger pinch together precisely in the air as if selecting and approving an item, then pull back slightly, still pinched. The left hand stays relaxed low." ;;
    clip5) S=k_b4.png; E=k_m_c2_m_c2_c2b.png; P="$POV The right hand releases the pinch and both hands move gently together to the center, fingers curving as if holding a small invisible object between them." ;;
    clip6) S=k_m_c2_m_c2_c2b.png; E=k_m_c2b_c3.png; P="$POV Both hands, holding an invisible object between them, slowly rotate it clockwise around its center, wrists turning together in a smooth, precise, continuous motion." ;;
    clip7) S=k_m_c2b_c3.png; E=k_a3.png; P="$POV The hands let go of the invisible object and open apart gracefully at chest height, palms outward, as if presenting the complete result." ;;
    clip8) S=k_a3.png; E=k_a3.png; P="$POV The open hands stay up, almost still, with tiny natural breathing movements of the fingers and wrists, calmly contemplating what they built." ;;
    clip9) S=k_q02.png; E=k_q05.png; P="$ROOM She takes the headset off her head with both hands, lowers it smoothly and holds it at her side, smiling warmly at the camera." ;;
  esac
}

gen() {
  local c=$1
  [ -s "$c.mp4" ] && { echo "$c ya existe"; return; }
  local url S E P
  spec "$c"
  url=$($HF generate create kling3_0 --mode pro --duration 5 --sound off --aspect_ratio 16:9 \
        --start-image "$S" --end-image "$E" --prompt "$P" \
        --wait --wait-timeout 30m 2>&1 | grep -o 'https://[^ ]*\.mp4' | tail -1)
  if [ -n "$url" ]; then curl -s -o "$c.mp4" "$url" && echo "$c OK"; else echo "$c FALLÓ"; fi
}

LIST=${*:-clip1 clip3 clip4 clip5 clip6 clip7 clip8 clip9}
for c in $LIST; do gen "$c" & sleep 2; done
wait
$HF account status 2>&1 | tail -1
