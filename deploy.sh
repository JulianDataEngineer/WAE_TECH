#!/usr/bin/env bash
# Despliegue de waengineers.co -> S3 + CloudFront
#   ./deploy.sh            despliega y verifica
#   ./deploy.sh --dry      muestra qué cambiaría, sin subir nada
#   ./deploy.sh --preview  levanta el sitio en local para revisarlo antes
set -euo pipefail

AWS="${HOME}/.local/bin/aws"
PROFILE=wae
BUCKET=waengineers-co-site
DIST=E3PLMW7P5E71EH

# Lista blanca: solo se publica lo que coincida. Todo lo demás queda fuera
# por defecto, para no exponer nunca configuración ni credenciales.
INCLUDE=(--exclude "*"
         --include "*.html" --include "*.css" --include "*.js"
         --include "*.png"  --include "*.jpg" --include "*.jpeg"
         --include "*.webp" --include "*.svg" --include "*.ico"
         --include "hero-frames/manifest.json"
         # y fuera lo que no pertenece al sitio publicado
         --exclude ".*" --exclude "*/.*" --exclude "*.mp4"
         --exclude "deploy.sh" --exclude "wae-webhook-connector.js"
         --exclude "ceo-full.png" --exclude "hero-banner.png" --exclude "hero-ceo.png")

case "${1:-}" in
  --preview) echo "Sitio local en http://localhost:8080  (Ctrl+C para salir)"
             exec python3 -m http.server 8080 ;;
  --dry)     DRY="--dryrun"; echo "== SIMULACIÓN: no se sube nada ==" ;;
  *)         DRY="" ;;
esac

echo "== 1/3  Subiendo a S3 =="
# HTML sin caché: los cambios de contenido se ven al instante
$AWS s3 sync . "s3://$BUCKET" --profile $PROFILE $DRY "${INCLUDE[@]}" \
  --exclude "*.css" --exclude "*.js" --exclude "*.png" --exclude "*.jpg" \
  --exclude "*.jpeg" --exclude "*.webp" --exclude "*.svg" --exclude "*.ico" \
  --exclude "hero-frames/manifest.json" \
  --content-type "text/html; charset=utf-8" --cache-control "public, max-age=0, must-revalidate"
# Estáticos con caché larga: la invalidación se encarga de refrescarlos
$AWS s3 sync . "s3://$BUCKET" --profile $PROFILE $DRY "${INCLUDE[@]}" \
  --exclude "*.html" --cache-control "public, max-age=604800"

[ -n "$DRY" ] && { echo "== Fin de la simulación =="; exit 0; }

echo "== 2/3  Invalidando caché de CloudFront =="
ID=$($AWS cloudfront create-invalidation --distribution-id $DIST --paths "/*" \
     --profile $PROFILE --query 'Invalidation.Id' --output text)
echo "   invalidación $ID · esperando..."
$AWS cloudfront wait invalidation-completed --distribution-id $DIST --id "$ID" --profile $PROFILE
echo "   completada"

echo "== 3/3  Verificando en producción =="
# Resolvemos por DNS público: la caché local puede mentir durante horas
CF=$(dig +short @8.8.8.8 d3cd24n4vcbo7n.cloudfront.net | head -1)
for h in waengineers.co www.waengineers.co; do
  printf "   %-24s " "$h"
  curl -s -o /dev/null -w "HTTP %{http_code} · %{size_download} bytes" \
    --max-time 30 --resolve "$h:443:$CF" "https://$h/"
  T=$(curl -s --max-time 30 --resolve "$h:443:$CF" "https://$h/" \
      | grep -oE '<title>[^<]*' | head -1 | cut -c8-45)
  echo " · $T"
done
echo; echo "Valida en https://www.waengineers.co  (Ctrl+Shift+R)"
echo "Si tu red aún cachea lo viejo: https://d3cd24n4vcbo7n.cloudfront.net"
