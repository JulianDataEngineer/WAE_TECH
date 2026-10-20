#!/usr/bin/env python3
"""Mide las manos cuadro a cuadro (desde el recorte con alfa) y escribe
assets/hands/hands.js con las señales que mueven el holograma:

  mx, my   punto entre las dos manos, sobre las puntas de los dedos (px en 1920x1080)
  spread   separación de las manos, 0 (juntas) – 1 (máxima)
  rot      giro acumulado de las manos, en grados (solo avanza: soltar no deshace)
  vis      cuánta mano se ve, 0 – 1

Todo va suavizado aquí (media móvil), así la composición puede buscar cualquier
instante sin estado: es determinista.

Uso: python3 tools/hero-3d/track-hands.py
"""
import json, math, os, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "assets", "hands", "pov-hands.webm")
OUT = os.path.join(HERE, "assets", "hands", "hands.js")
W, H = 192, 108          # resolución de análisis
SX, SY = 1920 / W, 1080 / H
FPS = 30
ROT_WINDOW = (24.2, 29.2)   # clip 6, el giro (video 27,2–32,2), en segundos del relato

raw = subprocess.run(["ffmpeg", "-v", "error", "-c:v", "libvpx-vp9", "-i", SRC,
                      "-vf", f"alphaextract,scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "gray", "-"],
                     capture_output=True, check=True).stdout
n = len(raw) // (W * H)
print(f"{n} cuadros")

frames = []
cl, cr = (W * 0.3, H * 0.8), (W * 0.7, H * 0.8)      # semillas: izquierda / derecha
for f in range(n):
    buf = raw[f * W * H:(f + 1) * W * H]
    pts = [(i % W, i // W) for i in range(W * H) if buf[i] > 128]
    if len(pts) < 25:
        frames.append(None)
        continue
    # k-means de dos grupos sembrado con el cuadro anterior: sigue a cada mano
    for _ in range(6):
        L, R = [], []
        for p in pts:
            (L if (p[0] - cl[0]) ** 2 + (p[1] - cl[1]) ** 2 <= (p[0] - cr[0]) ** 2 + (p[1] - cr[1]) ** 2 else R).append(p)
        if L: cl = (sum(p[0] for p in L) / len(L), sum(p[1] for p in L) / len(L))
        if R: cr = (sum(p[0] for p in R) / len(R), sum(p[1] for p in R) / len(R))
    if cl[0] > cr[0]:
        cl, cr, L, R = cr, cl, R, L
    def tip(G, c):
        if not G: return c
        top = sorted(G, key=lambda p: p[1])[:max(3, len(G) // 25)]
        return (sum(p[0] for p in top) / len(top), sum(p[1] for p in top) / len(top))
    tl, tr = tip(L, cl), tip(R, cr)
    frames.append({"cl": cl, "cr": cr, "tl": tl, "tr": tr, "area": len(pts)})

# Huecos: se rellenan con el último valor válido
last = next(fr for fr in frames if fr)
for i, fr in enumerate(frames):
    if fr is None: frames[i] = dict(last, area=0)
    else: last = fr

def smooth(xs, win):
    out, h = [], win // 2
    for i in range(len(xs)):
        seg = xs[max(0, i - h):i + h + 1]
        out.append(sum(seg) / len(seg))
    return out

mx = [(fr["tl"][0] + fr["tr"][0]) / 2 * SX for fr in frames]
my = [min(fr["tl"][1], fr["tr"][1]) * SY for fr in frames]
dist = [math.hypot(fr["cr"][0] - fr["cl"][0], fr["cr"][1] - fr["cl"][1]) for fr in frames]
ang = [math.degrees(math.atan2(fr["cr"][1] - fr["cl"][1], fr["cr"][0] - fr["cl"][0])) for fr in frames]
area = [fr["area"] for fr in frames]

mx, my, dist, ang, area = (smooth(v, 15) for v in (mx, my, dist, ang, area))
dmin, dmax = min(dist), max(dist)
spread = [(d - dmin) / (dmax - dmin or 1) for d in dist]
amax = max(area) or 1
vis = [min(1, a / (amax * 0.35)) for a in area]

# Giro acumulado: la variación de ángulo entre cuadros durante el gesto de girar,
# solo en sentido horario (al soltar, el modelo se queda donde lo dejaron).
rot, acc = [], 0.0
for i in range(len(ang)):
    if i:
        d = ang[i] - ang[i - 1]
        t = 4.2 + i / FPS            # segundo del relato
        if ROT_WINDOW[0] <= t <= ROT_WINDOW[1] and vis[i] > 0.6 and d < 0:
            acc += -d
    rot.append(acc)
# El giro visible no depende de cuánto giran las manos en las fotos: se lleva a
# ROT_TOTAL grados conservando el ritmo (cuándo acelera y cuándo se detiene).
ROT_TOTAL = 40.0
k = ROT_TOTAL / acc if acc > 0.5 else 0
rot = [r * k for r in rot]
acc *= k

data = {"fps": FPS, "start": 4.2,  # segundo del relato en que empieza la vista del visor
        "mx": [round(v, 1) for v in mx], "my": [round(v, 1) for v in my],
        "spread": [round(v, 3) for v in spread], "rot": [round(v, 2) for v in rot],
        "vis": [round(v, 3) for v in vis]}
open(OUT, "w").write("window.HANDS = " + json.dumps(data, separators=(",", ":")) + ";\n")
print(f"→ {OUT}  giro total {acc:.1f}°  separación {dmin:.0f}–{dmax:.0f}px")
