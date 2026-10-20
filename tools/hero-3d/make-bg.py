#!/usr/bin/env python3
"""Fondo del hero 3D a partir de las secuencias de fotos de assets/seq/.

Cada tramo es una lista de (cuadro, segundos). Las fotos se encadenan y FFmpeg
interpola el movimiento entre ellas (RIFE) para que el gesto se vea
continuo. Salida: assets/bg.mp4 (1920x1080, 30 fps, 49 s).

  0 – 7.2     se pone las gafas (tercera persona)      seq/pon
  7.2 – 41.4  vista desde dentro del visor, sus manos  seq/pov
  41.4 – 49   sale del visor, se quita las gafas       seq/quita

Uso: python3 tools/hero-3d/make-bg.py
"""
import math, os, subprocess, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
SEQ = os.path.join(HERE, "assets", "seq")
OUT = os.path.join(HERE, "assets", "bg.mp4")
FPS = 30
# Interpolador: rife-ncnn-vulkan (https://github.com/nihui/rife-ncnn-vulkan), local y gratuito
RIFE = os.environ.get("RIFE", os.path.expanduser("~/tools/rife-ncnn-vulkan-20221029-macos/rife-ncnn-vulkan"))
RIFE_MODEL = "rife-v4.6"

# Encuadre 16:9 desde las fotos panorámicas (1916x821): alto a 1080 y recorte
# horizontal; el número es la fracción del sobrante que se descarta a la izquierda.
CROP_X = {"pon": 0.54, "pov": 0.50, "quita": 0.54}


_mask = {}
def hand_mask(name):
    if name not in _mask:
        f = os.path.join(SEQ, "pov", "matte", name + ".png")
        r = subprocess.run(["ffmpeg", "-v", "error", "-i", f, "-vf", "alphaextract,scale=192:108",
                            "-f", "rawvideo", "-pix_fmt", "gray", "-"], capture_output=True).stdout if os.path.isfile(f) else b""
        _mask[name] = [v > 128 for v in r]
    return _mask[name]


def overlap(a, b):
    A, B = hand_mask(a), hand_mask(b)
    if not A or not B:
        return 1.0
    return sum(x and y for x, y in zip(A, B)) / (sum(x or y for x, y in zip(A, B)) or 1)


def refine(frames):
    """Camino más suave entre los extremos del gesto. Candidatos: los cuadros dados
    más los puntos medios m_<a>_<b>. Se elige la subsecuencia (en orden) que maximiza
    el menor solape de manos entre cuadros vecinos: un salto grande es lo que RIFE
    no puede interpolar sin dejar manos dobles."""
    def mids(a, b, depth=0):
        # puntos medios anidados: m_a_b, y dentro de cada mitad m_a_(m_a_b), etc.
        for m in (f"m_{a}_{b}", f"m_{b}_{a}"):
            if depth < 3 and os.path.isfile(os.path.join(SEQ, "pov", m + ".png")):
                return mids(a, m, depth + 1) + [m] + mids(m, b, depth + 1)
        return []
    cand = [frames[0]]
    for a, b in zip(frames, frames[1:]):
        cand += mids(a, b) + [b]
    n = len(cand)
    best = [(-1.0, 0, None)] * n          # (peor solape, nº de cuadros, anterior)
    best[0] = (1.0, 1, None)
    for j in range(1, n):
        for i in range(j):
            if best[i][0] < 0:
                continue
            v = (min(best[i][0], overlap(cand[i], cand[j])), best[i][1] + 1, i)
            if (v[0], v[1]) > (best[j][0], best[j][1]):
                best[j] = v
    path, k = [], n - 1
    while k is not None:
        path.append(cand[k]); k = best[k][2]
    return path[::-1]


def ease_path(frames, total):
    """Recorre 'frames' en 'total' segundos con aceleración y frenado suaves: los
    pasos de los extremos duran más que los del medio, como un gesto humano."""
    frames = refine(frames)
    n = len(frames) - 1
    w = [1.6 - 0.8 * math.sin(math.pi * (i + 0.5) / n) for i in range(n)]
    k = total / sum(w)
    return [(f, wi * k) for f, wi in zip(frames[:-1], w)]


def hold(frame, secs):
    return [(frame, secs)]


A_OPEN = ["a1", "a1b", "a2", "a2b", "a3"]          # abre el espacio a la altura del pecho
B_PICK = ["b1", "b1b", "b2", "b2b", "b3"]          # alcanza y pellizca
# Giro: c1/c3/c4 tienen poses que no empalman con nada (solape < 0,2); el gesto usa
# los cuadros del medio del giro, que conectan con las poses vecinas.
C_TURN = ["m_c2_m_c2_c2b", "m_c2_c2b", "c2b", "m_c2b_c3"]
C_IN = ["b1", "bc1", "m_bc1_bc2", "bc2", "m_bc2_c1", "m_m_bc2_c1_c1", C_TURN[0]]
C_OUT = [C_TURN[-1], "ca1", "ca2", "m_ca2_a1", "a1"]

# Gestos de amplitud media (sin abrir del todo los brazos), lentos y con pausas.
POV = (
    hold("a1", 1.2)                                         # las manos ya están: reposo, abajo
    + ease_path(A_OPEN, 2.8) + hold("a3", 1.4)              # 02 · abre: llegan las fuentes
    + ease_path(A_OPEN[::-1], 2.4) + hold("a1", 1.0)        # 03 · junta: las fuentes encajan
    + ease_path(["a1", "ab1", "ab2", "b1"], 1.0)
    + ease_path(B_PICK, 3.0) + hold("b3", 1.4)              # 04 · selecciona…
    + ease_path(["b3", "b3b", "b4"], 1.0) + hold("b4", 0.8) # …y aprueba
    + ease_path(["b4", "b3b", "b3", "b2b", "b2", "b1b", "b1"], 2.0)
    + ease_path(C_IN, 1.6)
    + ease_path(C_TURN, 3.4) + hold(C_TURN[-1], 1.2)       # 05 · gira el modelo
    + ease_path(C_TURN[::-1], 2.6) + ease_path(C_TURN, 1.6)
    + ease_path(C_OUT, 1.6)
    + ease_path(A_OPEN, 2.8) + hold("a3", 1.0)              # 06–07 · abre y contempla
)
_pov_total = sum(d for _, d in POV)
POV[-1] = (POV[-1][0], POV[-1][1] + (34.2 - _pov_total))   # cuadra en 34,2 s

TRAMOS = {
    # 0 – 2.2 la tapa el plano de apertura; luego se pone las gafas sin prisa
    "pon": [("p01", 2.2)] + ease_path(["p01", "p02", "p03", "p04", "p05", "p06"], 3.8) + [("p06", 1.2)],
    "pov": POV,
    # q01 se omite: su encuadre no empalma; el destello de salida cubre ese instante
    # a3 se sostiene hasta el pico del destello (42,4 s) y ahí corta a q02: interpolar
    # entre la vista del visor y la toma de ella quitándose las gafas dejaba manchas
    "quita": [("a3", 1.0), ("q02", 0.8), ("q03", 0.9), ("q04", 1.0), ("q05", 3.9)],
}
EXPAND = {"pon": True, "pov": False, "quita": True}   # pov ya trae sus intermedios


def folder_for(tramo, name):
    if tramo == "quita" and not name.startswith("q"):
        return "pov"     # el último cuadro del visor, cubierto por el destello de salida
    return tramo


def frame_path(tramo, name):
    return os.path.join(SEQ, folder_for(tramo, name), name + ".png")


_locked = {}
def locked_frame(name, tmp):
    """Manos de 'name' sobre el fondo fijo pov-base: las fotos de Codex traen la
    ciudad con pequeñas diferencias y, al interpolar, el fondo se deformaba
    alrededor de las manos. Con un único fondo, RIFE solo mueve las manos."""
    if name in _locked:
        return _locked[name]
    matte = os.path.join(SEQ, "pov", "matte", name + ".png")
    out = os.path.join(tmp, f"lock_{name}.png")
    base = os.path.join(SEQ, "pov", "pov-base.png")
    prep = f"scale=-2:1080:flags=lanczos,crop=1920:1080:(iw-1920)*{CROP_X['pov']}:0,setsar=1"
    if name == "pov-base" or not os.path.isfile(matte):
        return frame_path("pov", name)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", base, "-i", matte, "-filter_complex",
                    f"[0]{prep}[b];[1]format=rgba,split[c][m0];[m0]alphaextract,lut=y='clip((val-110)*255/80\\,0\\,255)',erosion,gblur=sigma=0.7[al];[c][al]alphamerge[m];[b][m]overlay", out], check=True)
    _locked[name] = out
    return out


def expand(tramo, items):
    """Inserta los cuadros intermedios (nombre + 'b') cuando existen, repartiendo el tiempo."""
    out = []
    for i, (name, dur) in enumerate(items):
        nxt = items[i + 1][0] if i + 1 < len(items) else None
        mid = None
        if nxt and nxt != name:
            # solo hacia delante (p01 -> p01b -> p02), y solo si el intermedio es de este par:
            # buscarlo "hacia atrás" metía cuadros fuera de orden (las manos iban y volvían)
            fwd = name + "b"
            if os.path.isfile(frame_path(tramo, fwd)):
                mid = fwd
        if mid:
            out += [(name, dur / 2), (mid, dur / 2)]
        else:
            out.append((name, dur))
    return out


def render_tramo(tramo, items, out):
    """Cada foto pasa a la siguiente durante TODO su tiempo con cuadros intermedios
    calculados por RIFE, así el gesto avanza de forma continua y no a saltos."""
    if EXPAND[tramo]:
        items = expand(tramo, items)
    cx = CROP_X[tramo]
    prep = f"scale=-2:1080:flags=lanczos,crop=1920:1080:(iw-1920)*{cx}:0,setsar=1"
    tmp = tempfile.mkdtemp()
    clips = []
    for i, (name, dur) in enumerate(items):
        a = frame_path(tramo, name)
        if not os.path.isfile(a):
            raise SystemExit(f"falta el cuadro {a}")
        b = frame_path(tramo, items[i + 1][0]) if i + 1 < len(items) else a
        if tramo == "quita" and not name.startswith("q"):
            b = a            # corte, no mezcla
        if tramo == "pov":
            a = locked_frame(name, tmp)
            b = locked_frame(items[i + 1][0], tmp) if i + 1 < len(items) else a
        clip = os.path.join(tmp, f"{i:03d}.mp4")
        n = max(1, round(dur * FPS))
        if b == a:
            cmd = ["ffmpeg", "-v", "error", "-y", "-loop", "1", "-i", a, "-vf", f"{prep},fps={FPS},format=yuv420p",
                   "-frames:v", str(n), "-c:v", "libx264", "-preset", "fast", "-crf", "14", clip]
        else:
            # RIFE (red de flujo óptico) calcula el movimiento real entre las dos fotos:
            # sin manos dobles ni fondo transparente, a diferencia de minterpolate.
            pair = os.path.join(tmp, f"{i:03d}"); os.makedirs(os.path.join(pair, "in")); os.makedirs(os.path.join(pair, "out"))
            for k, src in enumerate((a, b)):
                subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vf", prep,
                                os.path.join(pair, "in", f"{k + 1:08d}.png")], check=True)
            # con dos entradas, -n 2N da N cuadros repartidos de 0 a 1 (sin incluir el final)
            subprocess.run([RIFE, "-i", os.path.join(pair, "in"), "-o", os.path.join(pair, "out"),
                            "-n", str(2 * n), "-m", RIFE_MODEL], check=True,
                           cwd=os.path.dirname(RIFE), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            cmd = ["ffmpeg", "-v", "error", "-y", "-framerate", str(FPS), "-i", os.path.join(pair, "out", "%08d.png"),
                   "-frames:v", str(n), "-vf", "format=yuv420p", "-c:v", "libx264", "-preset", "fast", "-crf", "14", clip]
        subprocess.run(cmd, check=True)
        clips.append(clip)
    lst = os.path.join(tmp, "all.txt")
    open(lst, "w").write("".join(f"file '{c}'\n" for c in clips))
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst,
                    "-c:v", "libx264", "-preset", "slow", "-crf", "15", "-pix_fmt", "yuv420p", out], check=True)
    return sum(d for _, d in items)


def main():
    parts, t = [], 0.0
    for tramo in ("pon", "pov", "quita"):
        out = os.path.join(SEQ, f"_{tramo}.mp4")
        d = render_tramo(tramo, TRAMOS[tramo], out)
        print(f"  {tramo:6s} {t:6.2f} – {t + d:6.2f} s")
        t += d
        parts.append(out)
    lst = tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False)
    for p in parts:
        lst.write(f"file '{p}'\n")
    lst.close()
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst.name,
                    "-c", "copy", "-movflags", "+faststart", OUT], check=True)
    os.unlink(lst.name)
    print(f"→ {OUT}  ({t:.2f} s)")


if __name__ == "__main__":
    main()
