/* ============================================================
   Hero cinematográfico controlado por scroll
   Secuencia WebP sobre canvas 2D, progreso vía GSAP ScrollTrigger.
   ============================================================ */
(function () {
  'use strict';

  /* ─── PARÁMETROS AJUSTABLES ─────────────────────────────── */
  const CONFIG = {
    manifest:      'hero-frames/manifest.json',
    scrollLength:  6.5,   // duración del recorrido, en alturas de ventana
    suavizado:     0.22,  // constante de tiempo del seguimiento, en segundos
                          // (mayor = más controlado y más lento en reaccionar)
    maxLag:        60,    // huecos de hasta N fotogramas se recorren uno a uno;
                          // por encima se comprimen para no arrastrar retraso
    concurrency:   6,     // descargas simultáneas
    cacheSize:     90,    // fotogramas decodificados en memoria
    preloadAhead:  22,    // cuántos adelantar en la dirección del scroll
    focal:  { desktop: [0.50, 0.50], mobile: [0.52, 0.45] },
    mobileMaxWidth: 820,  // px; por debajo se usa la variante móvil
  };
  /* ───────────────────────────────────────────────────────── */

  const root   = document.getElementById('hero');
  if (!root) return;
  const canvas = root.querySelector('.hero-canvas');
  const poster = root.querySelector('.hero-poster');
  const bar    = root.querySelector('.hero-progress-bar');
  const num    = root.querySelector('.hero-progress-num');
  const acts   = Array.from(root.querySelectorAll('.hero-act'));
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
  function FrameStore(pattern, count) {
    const cache = new Map();      // idx -> HTMLImageElement ya decodificada
    const inflight = new Map();   // idx -> Promise
    let active = 0;
    const waiting = [];

    const url = i => pattern.replace('%04d', String(i).padStart(4, '0'));

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
    const [fx, fy] = CONFIG.focal[isMobile() ? 'mobile' : 'desktop'];
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
    if (num) num.textContent = String(Math.round(p * 100)).padStart(2, '0');
    acts.forEach(a => {
      const from = parseFloat(a.dataset.from), to = parseFloat(a.dataset.to);
      a.classList.toggle('is-on', p >= from && p < to);
    });
  }

  function step(t) {
    if (!store) { state.running = false; return; }

    if (!state.activo) {
      /* Al salir del tramo fijado el bucle se detiene, pero antes hay que
         cerrar el suavizado: si no, el progreso quedaba congelado a media
         transición y los últimos fotogramas no llegaban a dibujarse. */
      state.suave = state.crudo;
      pintarUI(state.suave);
      const ult = Math.min(store.count, Math.max(1, Math.round(state.suave * (store.count - 1)) + 1));
      if (ult !== state.shown) {
        store.request(ult, ult > state.shown ? 1 : -1);
        const im = store.nearest(ult);
        if (im) { paint(im); lastDrawn = ult; }
        state.shown = ult;
      }
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

    const target = Math.min(store.count, Math.max(1, Math.round(state.suave * (store.count - 1)) + 1));
    const diff = target - state.shown;

    if (diff !== 0) {
      const dir = diff > 0 ? 1 : -1;
      const gap = Math.abs(diff);
      const salto = gap <= CONFIG.maxLag ? 1 : Math.ceil(gap / CONFIG.maxLag);
      const idx = state.shown + dir * Math.min(salto, gap);
      store.request(idx, dir);
      const img = store.nearest(idx);
      if (img) { paint(img); lastDrawn = idx; }
      state.shown = idx;
    } else {
      store.trim(state.shown);
    }

    requestAnimationFrame(step);
  }

  function arrancarBucle() {
    if (state.running) return;
    state.running = true; state.t = 0;
    requestAnimationFrame(step);
  }

  /* ─────────── Arranque ─────────── */
  fetch(CONFIG.manifest)
    .then(r => r.json())
    .then(m => {
      const v = m.variants[isMobile() ? 'mobile' : 'desktop'] || m.variants.desktop;
      store = FrameStore(v.pattern, v.count);
      resize();

      /* Primer fotograma antes de retirar el poster: evita el parpadeo */
      const first = new Image();
      first.onload = () => {
        paint(first);
        state.shown = 1;
        root.classList.add('hero-ready');
        if (poster) poster.setAttribute('aria-hidden', 'true');
      };
      first.src = v.pattern.replace('%04d', '0001');

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

      window.addEventListener('resize', () => { resize(); ScrollTrigger.refresh(); });
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
