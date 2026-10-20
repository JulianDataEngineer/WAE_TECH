
## Resumen ejecutivo

El hero no reproduce un vídeo. Es un `<canvas>` que dibuja una secuencia de **200 imágenes WebP** (`/frames/smash/f_001.webp` a `f_200.webp`) en función del progreso de scroll. El hero permanece fijado mientras el usuario recorre **600 vh de scroll efectivo**; GSAP ScrollTrigger crea un `pin-spacer` total de 700 vh. A la resolución probada, cada 23,5 px de scroll equivale aproximadamente a un frame.

La fluidez percibida viene principalmente de cuatro cosas: una fuente temporal continua, 200 frames densos, motion blur ya horneado en las imágenes y una relación lineal estable entre scroll y frame. No encontré evidencia de Lenis. El scroll es nativo y ScrollTrigger controla el pin y el scrub.

## 1. Construcción de la animación de scroll

### Arquitectura comprobada

| Dato | Resultado |
|---|---|
| Medio principal | Canvas con secuencia de imágenes; no vídeo |
| Número de canvas | 1 |
| Secuencias | 1 |
| Frames | 200, numerados `f_001.webp`–`f_200.webp` |
| Formato | WebP |
| Frame visible inicial/final | `000 / 200` y `199 / 200` |
| Bundle JS | `/assets/index-Dk1EQW12.js` |
| CSS | `/assets/index-KZs_bosx.css` |
| Stack visible | React/Vite, Tailwind CSS y GSAP ScrollTrigger |
| Lenis | No encontré señales de Lenis |

La prueba más clara de ScrollTrigger es el `div.pin-spacer` que envuelve el hero y los estilos inline que fijan el panel (`position: fixed`, dimensiones calculadas y padding inferior). Es el patrón que genera GSAP al hacer `pin`.

### Tamaño y longitud

En un viewport de **1512 × 780 CSS px**, con DPR 1,5:

- Canvas CSS: **1512 × 780 px**.
- Buffer real del canvas: **2268 × 1170 px**.
- Huella de memoria RGBA de ese buffer: unos **10,1 MiB** por superficie (`2268 × 1170 × 4`).
- `pin-spacer`: **5460 px = 700 vh**.
- Recorrido mientras el hero permanece fijado: **4680 px = 600 vh**.
- Relación aproximada: `4680 / 199 = 23,52 px` por cambio de frame.
- Un scroll de una pantalla, 780 px, llevó el contador de `000` a `033`, exactamente lo esperable con una relación lineal: `780 / 4680 × 199 ≈ 33,2`.

No pude verificar la resolución intrínseca de cada WebP porque la interfaz de Chrome permitió inventariar los recursos pero bloqueó exportarlos. El tamaño **2268 × 1170** es el buffer de render medido, no necesariamente el tamaño de archivo fuente. Visualmente, los frames fuente parecen 16:9 y probablemente proceden de un máster 1920 × 1080 o superior, pero eso es una inferencia, no un dato confirmado. La etiqueta “4K” del HUD es decorativa y no demuestra que los WebP entregados sean 4K.

### Peso de archivos

Pude confirmar los 200 nombres y el formato, pero **no los bytes comprimidos por WebP ni el peso total transferido**: la descarga técnica de los assets fue rechazada por el permiso del navegador y la API de inventario no expone `Content-Length` ni `transferSize`. Por tanto, no sería honesto inventar una cifra.

Como referencia de memoria, mantener 200 frames completamente decodificados al tamaño del canvas costaría alrededor de **2,0 GiB**, aunque el navegador puede conservar WebP comprimidos, bitmaps con otra resolución o liberar recursos; esa cifra no equivale al peso de red.

### Precarga

La secuencia se precarga de forma agresiva al montar la página, no bajo demanda según el scroll:

- `f_001.webp` aparece como imagen inicial y también como recurso solicitado.
- El resto aparece con iniciador de tipo `fetch`.
- Sin hacer scroll, el inventario pasó de 158 frames observados a los **200 completos** cinco segundos después.
- El orden es mayormente ascendente, aunque varias respuestas terminan fuera de orden por concurrencia.

Esto encaja con un array de URLs y solicitudes `fetch` en paralelo, seguido de decodificación/caché para dibujar el bitmap elegido en canvas. No pude confirmar si usa `createImageBitmap`, `Image.decode()` o blobs porque el bundle no fue legible desde la sesión.

### Scroll, scrub e inercia

- `html` usa `scroll-behavior: auto`; el documento conserva scroll vertical nativo.
- No aparecen clases `lenis`, contenedor virtual ni transformación global típica de Lenis.
- El frame observado coincide directamente con el progreso del pin.
- No detecté una segunda capa de lerp/inercia independiente. Si ScrollTrigger usa un `scrub` numérico, su retardo es suficientemente corto para no aparecer en las mediciones una vez termina el gesto. El comportamiento es compatible con `scrub: true` o un scrub pequeño.
- El canvas probablemente se repinta en `requestAnimationFrame` y solo cuando cambia el índice entero; esto último es la implementación razonable, aunque no pude leer el código fuente para certificarlo.

Conclusión: **GSAP ScrollTrigger + scroll nativo**, no Lenis, con un mapeo prácticamente lineal de progreso a `0…199`.

## 2. Cómo parece haberse producido el metraje

No son 200 fotografías concebidas por separado. Son frames consecutivos extraídos de una fuente temporal continua. El HUD declara **24 FPS** y 200 frames equivaldrían a **8,33 s** de metraje (`200 / 24`). Aunque ese rótulo también forma parte del diseño, la densidad y continuidad visual son coherentes con esa cadencia.

Tampoco parece una toma documental única y literal. En apenas ocho segundos la escena pasa de carne cruda a smash, costra cocida, queso, levantado con espátula, ingredientes suspendidos y hamburguesa montada. Esa continuidad imposible apunta a una de estas dos rutas:

1. vídeo generativo/CG temporalmente coherente; o
2. montaje de varias tomas reales con composición, morphs y VFX.

Mi lectura más probable es **un clip cinematográfico generado o muy compuesto, después exportado a una secuencia WebP**. Las manos enguantadas pueden proceder de material real dentro del montaje o de un modelo de vídeo competente; la web por sí sola no permite distinguirlo con certeza.

### Por qué las manos se sienten naturales

- Los gestos nacen en una fuente temporal, no de keyframes aislados: aproximación, contacto, presión, liberación y retirada conservan continuidad entre frames.
- Hay un frame cada ~41,7 ms si el origen es 24 FPS.
- El blur direccional está horneado en los frames. El HUD muestra `1/50`, muy cerca de un obturador de 180° a 24 FPS, que produce el desenfoque cinematográfico correcto.
- La mano no se desplaza a velocidad constante: entra, desacelera antes del contacto, sostiene la presión y vuelve a acelerar al salir.
- La iluminación cálida, la profundidad de campo corta y el vapor ocultan pequeñas discontinuidades y dan cohesión espacial.
- El encuadre usa macro, reencuadres/push-ins suaves y parallax. Todo eso está dentro del metraje; el navegador no fabrica el movimiento de cámara.

## 3. Capa UI sobre el metraje

La UI es DOM/CSS por encima del canvas, no parte de los WebP. Incluye:

- barra de marca y navegación;
- punto rojo `REC`;
- timecode `HH:MM:SS:FF`;
- metadatos `4K · 24FPS · F2.8 · 1/50`, ISO y balance de blancos;
- esquinas de encuadre, retícula, crosshair, scanlines y viñeta;
- títulos grandes y fichas técnicas que entran/salen por tramos;
- temperatura que sube de 0 a 230 °C;
- indicador `SECTION xx / 05`;
- contador `FRAME xxx / 200`;
- ruler inferior con ticks, barra de progreso y marcador;
- etiquetas laterales y estado `SCRUB ACTIVE`.

### Qué sigue al scroll y qué no

- **Sí sigue al scroll:** frame del canvas, contador de frame, marcador y fill del ruler, temperatura, número/nombre de sección y apariciones/desapariciones del copy.
- **No sigue al scroll:** el timecode `REC`. Lo observé avanzar mientras la página permanecía en la misma posición; funciona como reloj desde que se monta el componente, probablemente con un ticker a 24 fps. El punto REC también parece una microanimación temporal independiente.
- Las scanlines, retícula, viñeta y marcas de cámara permanecen fijas mientras cambia el material de fondo.

### Vídeo de vapor

`/steam-loop.mp4` no es el hero ni una segunda secuencia scroll-scrubbed. Vive más abajo, en la sección `#overview`, dentro de una tarjeta visual.

Datos medidos:

- MP4, **1928 × 1076 px**.
- Duración: **5,2 s**.
- `loop`, `playsinline`, `muted`.
- `preload="none"`.
- Fuera de viewport estaba pausado, sin metadata cargada (`readyState 0`).
- Al llevarlo al centro del viewport cargó y empezó a reproducirse (`readyState 4`, `paused: false`).

Eso indica activación por visibilidad, probablemente mediante `IntersectionObserver`. El bucle corre por tiempo de reproducción normal; **no está sincronizado frame a frame con el scroll**.

## 4. ¿Puede Codex aquí generar clips de vídeo?

**No, no tengo en esta sesión un generador nativo de vídeo equivalente a ImageGen.**

Sí tengo:

- ImageGen para generar o editar imágenes raster;
- navegador y terminal para inspeccionar y automatizar flujos;
- HyperFrames para construir animación HTML/CSS/JS y **renderizar una composición a MP4**;
- un router/integración de Higgsfield presente en el entorno, que requeriría una invocación explícita de su workflow, acceso al servicio y sus inputs. No es una herramienta `video_gen` directa que pueda prometer como disponible sin esas condiciones.

Por tanto, puedo producir un MP4 programático o convertir una secuencia/animación en vídeo, pero no afirmar que puedo generar aquí, de forma nativa y autónoma, metraje realista de manos como lo hace un modelo dedicado de text-to-video.

## 5. Seis técnicas prioritarias para manos manipulando un holograma

1. **Parte de una actuación temporal continua.** Graba manos reales o usa un modelo de vídeo, nunca 100–200 stills independientes. Coreografía aproximación, anticipación, contacto, microcorrección, pausa y retirada. Esas pequeñas irregularidades venden humanidad.

2. **Captura con cadencia y shutter creíbles.** Usa 24 fps con 1/48–1/50, o 30 fps con 1/60. Si necesitas retiming, captura/genera a 48–60 fps y entrega a 24/30. Conserva motion blur en dedos y muñeca; no intentes recrearlo después con un blur CSS global.

3. **Ancla el holograma a una interacción física.** Haz tracking de cámara/mano, define un plano o volumen 3D estable, crea máscaras de oclusión para que los dedos pasen delante y detrás, y añade respuesta con 50–120 ms de retraso, overshoot y asentamiento. El holograma debe reaccionar al contacto, no simplemente seguir al cursor.

4. **Usa una secuencia densa y un recorrido largo.** Como punto de partida: 180–240 frames y 500–650 vh. Mapea `progress × (N−1)` al frame entero. En este sitio, 200 frames sobre 600 vh dan 23,5 px por frame y una pantalla equivale a unos 33 frames.

5. **Mantén el render barato y determinista.** Predecodifica el primer bloque, prioriza los próximos 20–30 frames y completa el resto en idle; dibuja en `requestAnimationFrame` solo cuando cambie el frame; limita DPR a 1,5–2; usa `drawImage` con cover y resize mediante `ResizeObserver`. Para una pieza crítica, bloquea el scrub hasta tener suficientes frames listos.

6. **Separa metraje y HUD.** Deja manos/holograma en canvas y construye retícula, timecode, labels, ruler y counters como DOM/CSS. Conecta al progreso solo los elementos semánticos —frame, sección, scrubber, intensidad del holograma— y deja REC, parpadeos y ruido en tiempo real. Así el sistema se siente vivo incluso cuando el usuario deja de hacer scroll.

## Nivel de confianza

- **Alto:** canvas, 200 WebP, nombres de archivo, un solo hero, 600 vh efectivos, buffer del canvas, GSAP/ScrollTrigger, ausencia de vídeo en el hero, comportamiento del HUD y datos del MP4 de vapor.
- **Medio:** ausencia total de un scrub numérico corto; método exacto de decodificación de imágenes; React/Vite/Tailwind inferidos por estructura y clases.
- **Inferencia visual:** resolución intrínseca de los WebP y pipeline exacto del metraje (IA frente a real + VFX). Se han marcado expresamente como no confirmados.

codex
Informe completado en [smash-analysis.md](/Users/macbookpro/Documents/WAE/PaginaWeb/tools/hero-3d/research/smash-analysis.md).

