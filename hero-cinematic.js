/* ============================================================
   Hero cinematográfico controlado por scroll
   Secuencia WebP sobre canvas 2D, progreso vía GSAP ScrollTrigger.
   ============================================================ */
(function () {
  'use strict';

  /* ─── PARÁMETROS AJUSTABLES ─────────────────────────────── */
  const CONFIG = {
    manifest:      'hero-frames/manifest.json',
    scrollLength:  6,     // duración del recorrido, en alturas de ventana
                          // (video de 49 s y 440 fotogramas: ~73 por pantalla; más recorrido = gestos más pausados)
    introFade:     0,     // tramo inicial en color plano (0 = sin plano: el video abre
                          // con el detalle 5x de las gafas, que es el gancho)
    suavizado:     0.22,  // constante de tiempo del seguimiento, en segundos
                          // (mayor = más controlado y más lento en reaccionar)
    maxLag:        60,    // huecos de hasta N fotogramas se recorren uno a uno;
                          // por encima se comprimen para no arrastrar retraso
    concurrency:   6,     // descargas simultáneas
    cacheSize:     90,    // fotogramas decodificados en memoria
    preloadAhead:  40,    // cuántos decodificar por delante en la dirección del scroll
    precarga:      4,     // descargas en segundo plano de TODA la secuencia (a la caché
                          // HTTP, sin decodificar): al bajar rápido nunca falta un cuadro
    focal:  { desktop: [0.50, 0.50], mobile: [0.47, 0.50] }, // ella entre 22 y 33 % y la torre al 62 % del ancho
    focalCierreMovil: 0.80, // encuadre móvil del logo final
    mobileMaxWidth: 820,  // px; por debajo se usa la variante móvil
  };
  /* ───────────────────────────────────────────────────────── */

  const root   = document.getElementById('hero');
  if (!root) return;

  /* Al recargar, el navegador restaura la posición anterior. Como el hero se
     ancla con ScrollTrigger, esa restauración deja un hueco en blanco encima.
     Arrancamos siempre arriba, salvo que la URL traiga un enlace a una sección. */
  const ancla = location.hash.length > 1 ? document.querySelector(location.hash) : null;
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (!ancla) window.scrollTo(0, 0);
  const canvas = root.querySelector('.hero-canvas');
  const poster = root.querySelector('.hero-poster');
  const bar    = root.querySelector('.hero-progress-bar');
  const intro  = root.querySelector('.hero-intro');
  const num    = root.querySelector('.hero-progress-num');
  const acts   = Array.from(root.querySelectorAll('.hero-act, .hero-chapter'));
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: false });
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = () => window.innerWidth <= CONFIG.mobileMaxWidth;

  /* ── Versión estática: sin animación, todo el texto visible ── */
  if (reduced) {
    root.classList.add('hero-static');
    acts.forEach(a => a.classList.add('is-on'));
    return;                       // el poster en HTML se queda como fondo
  }

  /* ─────────── Almacén de fotogramas ─────────── */
  function FrameStore(pattern, count, ver) {
    const cache = new Map();      // idx -> HTMLImageElement ya decodificada
    const inflight = new Map();   // idx -> Promise
    let active = 0;
    const waiting = [];

    const url = i => pattern.replace('%04d', String(i).padStart(4, '0')) + ver;

    function pump() {
      while (active < CONFIG.concurrency && waiting.length) {
        const i = waiting.shift();
        if (cache.has(i) || inflight.has(i)) continue;
        active++;
        const img = new Image();
        img.decoding = 'async';
        const p = new Promise(res => {
          img.onload = () => {
            /* Decodificar aquí y no al dibujar. Con <img> sin decodificar,
               drawImage costaba ~8 ms de hilo principal por fotograma y el
               recorrido se estancaba en ~20 fotogramas por segundo. */
            const listo = img.decode ? img.decode().catch(() => {}) : Promise.resolve();
            listo.then(() => { cache.set(i, img); res(img); });
          };
          img.onerror = () => res(null);   // un fallo no rompe la secuencia
        }).finally(() => { active--; inflight.delete(i); pump(); });
        inflight.set(i, p);
        img.src = url(i);
      }
    }

    return {
      count,
      /* Pide un fotograma y sus vecinos en la dirección del movimiento */
      request(i, dir) {
        const want = [i];
        for (let k = 1; k <= CONFIG.preloadAhead; k++) want.push(i + k * (dir >= 0 ? 1 : -1));
        for (let k = 1; k <= 3; k++) want.push(i - k * (dir >= 0 ? 1 : -1));
        want.forEach(n => {
          if (n < 1 || n > count) return;
          if (cache.has(n) || inflight.has(n) || waiting.includes(n)) return;
          waiting.push(n);
        });
        pump();
      },
      exact: i => cache.get(i) || null,
      /* El pedido, o el más cercano ya disponible: nunca se queda en blanco */
      nearest(i) {
        if (cache.has(i)) return cache.get(i);
        for (let d = 1; d < count; d++) {
          if (cache.has(i - d)) return cache.get(i - d);
          if (cache.has(i + d)) return cache.get(i + d);
        }
        return null;
      },
      /* Caché acotada: se descarta lo lejano al fotograma actual */
      trim(center) {
        if (cache.size <= CONFIG.cacheSize) return;
        [...cache.keys()]
          .sort((a, b) => Math.abs(b - center) - Math.abs(a - center))
          .slice(0, cache.size - CONFIG.cacheSize)
          .forEach(k => cache.delete(k));
      },
      loaded: () => cache.size,
    };
  }

  /* ─────────── Dibujo ─────────── */
  let store = null, lastDrawn = -1, dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    canvas.width  = Math.max(1, Math.round(r.width  * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
    lastDrawn = -1;               // fuerza repintado
  }

  function paint(img) {
    if (!img) return;
    const cw = canvas.width, ch = canvas.height;
    const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
    let [fx, fy] = CONFIG.focal[isMobile() ? 'mobile' : 'desktop'];
    /* En móvil solo cabe la mitad del ancho: en el cierre el encuadre se desliza
       hacia la derecha, donde el logo se dibuja sobre el cielo. */
    if (isMobile()) {
      const k = Math.min(1, Math.max(0, (state.suave - 0.86) / 0.07));
      fx += (CONFIG.focalCierreMovil - fx) * k * k * (3 - 2 * k);
    }
    ctx.drawImage(img, (cw - dw) * fx, (ch - dh) * fy, dw, dh);
  }

  /* ─────────── Progreso -> fotograma, textos e indicador ─────────── */
  /* El scroll solo deja anotado el progreso crudo. El suavizado y el avance
     de fotograma viven en el bucle rAF: atarlos a onUpdate limitaba el
     dibujo a unas 20 imágenes por segundo, aunque rAF corriera a 45. */
  const state = { crudo: 0, suave: 0, shown: 0, running: false, activo: true, t: 0 };

  function pintarUI(p) {
    if (bar) bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    root.classList.toggle('hero-avanzado', p > 0.04);
    /* Pantalla de color plano que abre el recorrido y se disuelve al bajar.
       De paso cubre la carga de los primeros fotogramas. */
    if (intro) {
      const o = CONFIG.introFade > 0 ? 1 - Math.min(1, Math.max(0, p / CONFIG.introFade)) : 0;
      intro.style.opacity = o.toFixed(3);
      intro.style.visibility = o < 0.01 ? 'hidden' : 'visible';
    }
    if (num) num.textContent = String(Math.round(p * 100)).padStart(2, '0');
    acts.forEach(a => {
      const from = parseFloat(a.dataset.from), to = parseFloat(a.dataset.to);
      a.classList.toggle('is-on', p >= from && p < to);
    });
  }

  /* Dibuja la posición exacta del recorrido, no un cuadro entero: entre dos
     cuadros vecinos se funde el siguiente según la fracción. Con scroll lento
     el movimiento avanza continuo, sin quedarse quieto y saltar. */
  let lastPos = -1;
  function dibujarEn(pos) {
    pos = Math.min(store.count, Math.max(1, pos));
    const dir = pos >= lastPos ? 1 : -1;
    if (Math.abs(pos - lastPos) < 0.004 && lastDrawn !== -1) return;   // nada nuevo que pintar
    const i = Math.floor(pos), f = pos - i;
    store.request(i, dir);
    const a = store.exact(i), b = f > 0.01 ? store.exact(i + 1) : null;
    if (a && b) {
      paint(a);
      ctx.globalAlpha = f; paint(b); ctx.globalAlpha = 1;
    } else {
      const im = a || store.nearest(Math.round(pos));
      if (!im) return;
      paint(im);
    }
    lastDrawn = i; lastPos = pos; state.shown = i;
    store.trim(i);
  }

  function step(t) {
    if (!store) { state.running = false; return; }

    if (!state.activo) {
      /* Al salir del tramo fijado el bucle se detiene, pero antes hay que
         cerrar el suavizado: si no, el progreso quedaba congelado a media
         transición y los últimos fotogramas no llegaban a dibujarse. */
      state.suave = state.crudo;
      pintarUI(state.suave);
      dibujarEn(Math.round(state.suave * (store.count - 1) + 1));
      state.running = false;
      return;
    }

    /* Suavizado exponencial, independiente de la tasa de refresco */
    const dt = state.t ? Math.min(0.05, (t - state.t) / 1000) : 0.016;
    state.t = t;
    const resto = state.crudo - state.suave;
    /* El suavizado exponencial se acerca al destino sin alcanzarlo nunca:
       sin este enganche, los últimos fotogramas no llegaban a mostrarse. */
    state.suave = Math.abs(resto) < 0.0008
      ? state.crudo
      : state.suave + resto * (1 - Math.exp(-dt / CONFIG.suavizado));

    pintarUI(state.suave);
    /* En reposo no se queda una mezcla de dos cuadros (las etiquetas se verían
       dobles): en 0,25 s se asienta suavemente en el cuadro entero más cercano. */
    const pos = state.suave * (store.count - 1) + 1;
    state.reposo = resto === 0 || Math.abs(resto) < 0.0008 ? Math.min(1, (state.reposo || 0) + dt / 0.25) : 0;
    const r = state.reposo, k = r * r * (3 - 2 * r);
    dibujarEn(pos + (Math.round(pos) - pos) * k);

    requestAnimationFrame(step);
  }

  function arrancarBucle() {
    if (state.running) return;
    state.running = true; state.t = 0;
    requestAnimationFrame(step);
  }

  /* ─────────── Arranque ─────────── */
  /* Los fotogramas conservan su nombre entre versiones del video: la marca de
     versión evita que el navegador muestre una secuencia vieja desde caché. */
  fetch(CONFIG.manifest, { cache: 'no-cache' })
    .then(r => r.json())
    .then(m => {
      const v = m.variants[isMobile() ? 'mobile' : 'desktop'] || m.variants.desktop;
      const ver = '?v=' + v.count + '-' + v.bytes;
      store = FrameStore(v.pattern, v.count, ver);
      resize();

      /* Primer fotograma antes de retirar el poster: evita el parpadeo */
      const first = new Image();
      first.onload = () => {
        paint(first);
        state.shown = 1;
        root.classList.add('hero-ready');
        if (poster) poster.setAttribute('aria-hidden', 'true');
      };
      first.src = v.pattern.replace('%04d', '0001') + ver;

      gsap.registerPlugin(ScrollTrigger);
      const tl = { p: 0 };
      gsap.to(tl, {
        p: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: () => '+=' + (window.innerHeight * CONFIG.scrollLength),
          pin: true,
          pinSpacing: true,

          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: self => { state.crudo = self.progress; arrancarBucle(); },
          onToggle: self => { state.activo = self.isActive; if (self.isActive) arrancarBucle(); },
        },
      });

      /* El anclaje cambia la altura de la página: recalculamos ya medido todo
         y, si venía un enlace a una sección, volvemos a llevar el foco ahí. */
      ScrollTrigger.clearScrollMemory('manual');
      const asentar = () => {
        ScrollTrigger.refresh();
        if (ancla) ancla.scrollIntoView();
        else window.scrollTo(0, 0);
      };
      /* La secuencia se resuelve de forma asíncrona: puede llegar antes o
         después del evento load, así que cubrimos los dos casos. */
      if (document.readyState === 'complete') asentar();
      else window.addEventListener('load', asentar, { once: true });

      window.addEventListener('resize', () => { resize(); lastPos = -1; ScrollTrigger.refresh(); });

      /* Precarga silenciosa: trae todos los archivos a la caché del navegador
         (sin decodificarlos, para no gastar memoria). Después, cada cuadro se
         decodifica desde disco en milisegundos, nunca desde la red. */
      const urls = Array.from({ length: v.count }, (_, k) => v.pattern.replace('%04d', String(k + 1).padStart(4, '0')) + ver);
      let next = 0;
      const bajar = () => {
        if (next >= urls.length) return;
        fetch(urls[next++], { priority: 'low' }).catch(() => {}).finally(bajar);
      };
      const iniciarPrecarga = () => { for (let k = 0; k < CONFIG.precarga; k++) bajar(); };
      if ('requestIdleCallback' in window) requestIdleCallback(iniciarPrecarga, { timeout: 2500 });
      else setTimeout(iniciarPrecarga, 1200);
      pintarUI(0);
      arrancarBucle();
    })
    .catch(err => {
      /* Sin manifiesto o sin fotogramas: el poster del HTML se queda y no se rompe nada */
      console.warn('[hero] secuencia no disponible, se mantiene el poster:', err);
      root.classList.add('hero-static');
      acts.forEach(a => a.classList.add('is-on'));
    });
})();
