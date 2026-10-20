#!/usr/bin/env python3
"""Monta el video del hero a partir de tools/hero-storyboard.json (sección "render").

Corta, reencuadra (fuera la marca de agua), ajusta velocidad, etalona y une con
disolvencias. Al final imprime en qué fracción del recorrido empieza cada
capítulo, para los rótulos y los textos del hero.

Uso:  python3 tools/render-hero-edit.py
Luego: VIDEO="<salida>" N_DESKTOP=360 N_MOBILE=180 bash tools/extract-hero-frames.sh
"""
import json, os, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = json.load(open(os.path.join(ROOT, "tools", "hero-storyboard.json")))["render"]
src = os.path.expanduser(spec["source"])
out = os.path.expanduser(spec["output"])
W, H = spec["size"]
FPS = spec["fps"]
g = spec["grade"]
wm = spec["watermark_box"]

if not os.path.isfile(src):
    sys.exit(f"no existe el video fuente: {src}")

args, chains = ["ffmpeg", "-v", "error", "-y"], []
durs = []
for k, s in enumerate(spec["segments"]):
    c = spec["crops"][s["crop"]]
    # Ningún encuadre puede tocar la marca de agua
    assert c["x"] + c["w"] <= wm["x"][0] - 8 or c["y"] + c["h"] <= wm["y"][0] - 8, f"{s['id']} toca la marca de agua"
    length = s["out"] - s["in"]
    durs.append(length / s["speed"])
    args += ["-ss", f"{s['in']:.3f}", "-t", f"{length:.3f}", "-i", src]
    chains.append(
        f"[{k}:v]crop={c['w']}:{c['h']}:{c['x']}:{c['y']},"
        f"scale={W}:{H}:flags=lanczos,setsar=1,"
        f"setpts=(PTS-STARTPTS)/{s['speed']},fps={FPS},settb=AVTB,"
        f"eq=contrast={g['contrast']}:saturation={g['saturation']}:brightness={s['exposure']},"
        f"colorbalance=bs={g['shadows_to_navy']}:rs={-g['shadows_to_navy'] / 2}:bm=0.01,"
        f"unsharp=5:5:{g['sharpen']}:5:5:0,format=yuv420p[s{k}]"
    )

# Unión: "cut" concatena, un número es una disolvencia de esa duración
segs = spec["segments"]
label, total = "s0", durs[0]
starts = [0.0]          # dónde empieza a verse cada segmento (mitad de la disolvencia)
for k in range(1, len(segs)):
    j = segs[k]["join"]
    nxt = f"j{k}"
    if j == "cut":
        chains.append(f"[{label}][s{k}]concat=n=2:v=1:a=0[{nxt}]")
        starts.append(total)
        total += durs[k]
    else:
        off = total - j
        chains.append(f"[{label}][s{k}]xfade=transition=fade:duration={j}:offset={off:.3f}[{nxt}]")
        starts.append(off + j / 2)
        total = off + durs[k]
    label = nxt

args += ["-filter_complex", ";".join(chains), "-map", f"[{label}]", "-an",
         "-c:v", "libx264", "-preset", "slow", "-crf", "14", "-pix_fmt", "yuv420p",
         "-movflags", "+faststart", out]
print(f"Montando {len(segs)} segmentos → {out}")
subprocess.run(args, check=True)

# Capítulos en fracción del recorrido
marks = {}
for k, s in enumerate(segs):
    marks.setdefault(s["chapter"], starts[k])
    if "split" in s:
        t = starts[k] + (s["split"]["at"] - s["in"]) / s["speed"]
        marks.setdefault(s["split"]["chapter"], t)
real = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                             "-of", "csv=p=0", out], capture_output=True, text=True).stdout)
print(f"Duración: {real:.2f} s")
for ch, t in sorted(marks.items()):
    print(f"  capítulo {ch}: {t:6.2f} s  →  {t / real:.3f}")
