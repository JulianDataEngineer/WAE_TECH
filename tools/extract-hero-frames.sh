#!/usr/bin/env bash
# Extrae la secuencia de fotogramas del hero desde el video maestro.
# Reejecutable: borra y regenera todo. Ajusta los parámetros de abajo.
set -euo pipefail

# ─── PARÁMETROS AJUSTABLES ────────────────────────────────────────────────
VIDEO="${VIDEO:-/home/wae/Documents/videos wae/wae video final.mp4}"
N_DESKTOP="${N_DESKTOP:-240}"   # fotogramas en escritorio
N_MOBILE="${N_MOBILE:-120}"     # fotogramas en móvil
W_DESKTOP="${W_DESKTOP:-1600}"  # ancho en px
W_MOBILE="${W_MOBILE:-900}"
Q_DESKTOP="${Q_DESKTOP:-70}"    # calidad WebP 0-100
Q_MOBILE="${Q_MOBILE:-68}"
OUT="${OUT:-hero-frames}"
# ──────────────────────────────────────────────────────────────────────────

command -v ffmpeg >/dev/null || { echo "falta ffmpeg"; exit 1; }
[ -f "$VIDEO" ] || { echo "no existe el video: $VIDEO"; exit 1; }

DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$VIDEO")
echo "Video: $(basename "$VIDEO")  ·  ${DUR}s"

extraer () {  # $1=nombre  $2=nº fotogramas  $3=ancho  $4=calidad
  local dir="$OUT/$1" n=$2 w=$3 q=$4
  local fps; fps=$(python3 -c "print($n/$DUR)")
  rm -rf "$dir"; mkdir -p "$dir"
  echo "  $1: $n fotogramas a ${w}px (q=$q, fps=$fps)"
  ffmpeg -v error -i "$VIDEO" \
    -vf "fps=$fps,scale=$w:-2:flags=lanczos" \
    -c:v libwebp -lossless 0 -quality "$q" -preset picture \
    -frames:v "$n" "$dir/f%04d.webp" -y
  echo "     -> $(ls "$dir" | wc -l) archivos, $(du -sh "$dir" | cut -f1)"
}

extraer desktop "$N_DESKTOP" "$W_DESKTOP" "$Q_DESKTOP"
extraer mobile  "$N_MOBILE"  "$W_MOBILE"  "$Q_MOBILE"

# Poster: primer fotograma real de la secuencia, para que no haya salto al arrancar
cp "$OUT/desktop/f0001.webp" "$OUT/poster.webp"

# Manifiesto con las cuentas REALES en disco, no las pedidas
python3 - "$OUT" "$DUR" <<'PY'
import json, os, sys, glob
out, dur = sys.argv[1], float(sys.argv[2])
m = {"source": "wae video final.mp4", "duration": round(dur, 3), "poster": f"{out}/poster.webp", "variants": {}}
for name in ("desktop", "mobile"):
    fs = sorted(glob.glob(f"{out}/{name}/*.webp"))
    if not fs: continue
    w, h = __import__("struct"), None
    m["variants"][name] = {
        "count": len(fs),
        "pattern": f"{out}/{name}/f%04d.webp",
        "first": 1,
        "bytes": sum(os.path.getsize(f) for f in fs),
    }
json.dump(m, open(f"{out}/manifest.json", "w"), indent=2)
print("\nManifiesto:")
for k, v in m["variants"].items():
    print(f"  {k}: {v['count']} fotogramas, {v['bytes']/1048576:.2f} MB")
PY
