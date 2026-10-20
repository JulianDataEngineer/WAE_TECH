#!/usr/bin/env python3
"""Fondo del hero a partir de los clips de video de Kling (assets/video/clipN.mp4).

Reemplaza a make-bg.py (fotos + interpolación): el movimiento ahora es video real.
Mismos tiempos que la composición (index.html), así los eventos del holograma
siguen cayendo en su gesto. Salida: assets/bg.mp4 (1920x1080, 30 fps, 49 s).

Uso: python3 tools/hero-3d/make-bg-video.py
"""
import os, subprocess, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
V = os.path.join(HERE, "assets", "video")
OUT = os.path.join(HERE, "assets", "bg.mp4")
FPS = 30
FMT = "scale=1920:1080:flags=lanczos,setsar=1,fps=30,format=yuv420p"

# (tipo, fuente, segundos, desde): "img" = foto fija; "clip" = tramo de video;
# "last" = último cuadro del segmento anterior, sostenido.
TIMELINE = [
    ("img",  "k_p01.png", 1.0, 0),    # tapada por el plano de apertura 5x
    ("clip", "clip1",     5.0, 0),    # se pone las gafas
    ("last", None,        1.2, 0),    # y la cámara entra al lente (composición)
    ("clip", "clip2",     5.0, 0),    # 02 · abre: llegan las fuentes
    ("clip", "clip3",     5.0, 0),    # 03 · cierra: las fuentes encajan
    ("clip", "clip4",     5.0, 0),    # 04 · alcanza, pellizca, aprueba
    ("clip", "clip5",     5.0, 0),    # toma el modelo
    ("clip", "clip6",     5.0, 0),    # 05 · lo gira
    ("clip", "clip7",     5.0, 0),    # 06 · suelta y abre
    ("clip", "clip8",     4.2, 0),    # 07 · contempla
    ("last", None,        1.0, 0),    # hasta el pico del destello de salida
    ("clip", "clip9",     5.0, 0),    # se quita las gafas
    ("last", None,        1.6, 0),    # el logo se dibuja
]


def run(*a):
    subprocess.run(["ffmpeg", "-v", "error", "-y", *a], check=True)


def main():
    tmp = tempfile.mkdtemp()
    parts, t, prev = [], 0.0, None
    for k, (kind, src, dur, start) in enumerate(TIMELINE):
        out = os.path.join(tmp, f"{k:02d}.mp4")
        n = round(dur * FPS)
        if kind == "img":
            run("-loop", "1", "-i", os.path.join(V, src), "-vf", FMT, "-frames:v", str(n),
                "-c:v", "libx264", "-crf", "13", "-preset", "fast", out)
        elif kind == "clip":
            path = os.path.join(V, src + ".mp4")
            if not os.path.isfile(path):
                raise SystemExit(f"falta {path}")
            run("-ss", str(start), "-i", path, "-vf", FMT, "-frames:v", str(n), "-an",
                "-c:v", "libx264", "-crf", "13", "-preset", "fast", out)
        else:  # last
            still = os.path.join(tmp, f"{k:02d}.png")
            run("-sseof", "-0.05", "-i", prev, "-frames:v", "1", "-update", "1", still)
            run("-loop", "1", "-i", still, "-vf", FMT, "-frames:v", str(n),
                "-c:v", "libx264", "-crf", "13", "-preset", "fast", out)
        print(f"  {t:6.2f} – {t + dur:6.2f}  {kind:4s} {src or ''}")
        t += dur
        parts.append(out)
        prev = out
    lst = os.path.join(tmp, "all.txt")
    open(lst, "w").write("".join(f"file '{p}'\n" for p in parts))
    run("-f", "concat", "-safe", "0", "-i", lst, "-c:v", "libx264", "-crf", "15",
        "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", OUT)
    print(f"→ {OUT}  ({t:.2f} s)")


if __name__ == "__main__":
    main()
