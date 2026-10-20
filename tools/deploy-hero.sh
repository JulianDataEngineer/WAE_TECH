#!/usr/bin/env bash
# Publica SOLO el hero en waengineers.co (S3 + CloudFront). No toca nada más del sitio.
#   bash tools/deploy-hero.sh --dry   muestra qué subiría
#   bash tools/deploy-hero.sh         sube, invalida y verifica
# Mismos ajustes de caché que deploy.sh: HTML/CSS/JS sin caché, imágenes 7 días.
set -euo pipefail
cd "$(dirname "$0")/.."

AWS="${AWS:-$(command -v aws)}"
PROFILE="${PROFILE:-wae}"
BUCKET=waengineers-co-site
DIST=E3PLMW7P5E71EH
DRY=""; [ "${1:-}" = "--dry" ] && DRY="--dryrun" && echo "== SIMULACIÓN: no se sube nada =="

NOCACHE="public, max-age=0, must-revalidate"
echo "== 1/3  Subiendo el hero =="
$AWS s3 cp index.html         "s3://$BUCKET/index.html"         --profile "$PROFILE" $DRY --content-type "text/html; charset=utf-8" --cache-control "$NOCACHE"
$AWS s3 cp styles.css         "s3://$BUCKET/styles.css"         --profile "$PROFILE" $DRY --content-type "text/css"                 --cache-control "$NOCACHE"
$AWS s3 cp hero-cinematic.js  "s3://$BUCKET/hero-cinematic.js"  --profile "$PROFILE" $DRY --content-type "text/javascript"          --cache-control "$NOCACHE"
$AWS s3 cp hero-frames/manifest.json "s3://$BUCKET/hero-frames/manifest.json" --profile "$PROFILE" $DRY \
  --content-type "application/json" --cache-control "public, max-age=604800"
$AWS s3 sync hero-frames "s3://$BUCKET/hero-frames" --profile "$PROFILE" $DRY \
  --exclude "*" --include "*.webp" --content-type "image/webp" --cache-control "public, max-age=604800"

[ -n "$DRY" ] && { echo "== Fin de la simulación =="; exit 0; }

echo "== 2/3  Invalidando caché de CloudFront (solo rutas del hero) =="
ID=$($AWS cloudfront create-invalidation --distribution-id $DIST --profile "$PROFILE" \
     --paths "/" "/index.html" "/styles.css" "/hero-cinematic.js" "/hero-frames/*" \
     --query 'Invalidation.Id' --output text)
$AWS cloudfront wait invalidation-completed --distribution-id $DIST --id "$ID" --profile "$PROFILE"
echo "   invalidación $ID completada"

echo "== 3/3  Verificando en producción =="
for f in "" styles.css hero-cinematic.js hero-frames/manifest.json; do
  printf "   /%-28s " "$f"
  curl -s -o /dev/null -w "HTTP %{http_code}\n" --max-time 30 "https://www.waengineers.co/$f"
done
curl -s "https://www.waengineers.co/hero-frames/manifest.json" | grep -o '"source": *"[^"]*"'
echo "Valida en https://www.waengineers.co  (Cmd+Shift+R)"
