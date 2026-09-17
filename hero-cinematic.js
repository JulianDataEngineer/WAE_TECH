/* ============================================================
   Hero cinematográfico controlado por scroll
   Secuencia WebP sobre canvas 2D, progreso vía GSAP ScrollTrigger.
   ============================================================ */
(function () {
  'use strict';

  /* ─── PARÁMETROS AJUSTABLES ─────────────────────────────── */
  const CONFIG = {
    manifest:      'hero-frames/manifest.json',
    scrollLength:  3.4,   // duración del recorrido, en alturas de ventana
    scrub:         0.8,   // suavizado al soltar el scroll, en segundos
    concurrency:   6,     // descargas simultáneas
    cacheSize:     90,    // fotogramas decodificados en memoria
    preloadAhead:  14,    // cuántos adelantar en la dirección del scroll
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
          img.onload = () => { cache.set(i, img); res(img); };
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
  const state = { progress: 0, prev: 0 };

  function render() {
    if (!store) return;
    const p = state.progress;
    const idx = Math.min(store.count, Math.max(1, Math.round(p * (store.count - 1)) + 1));
    const dir = p >= state.prev ? 1 : -1;
    state.prev = p;

    store.request(idx, dir);
    const img = store.nearest(idx);
    if (img && idx !== lastDrawn) { paint(img); lastDrawn = idx; }
    store.trim(idx);

    if (bar) bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    if (num) num.textContent = String(Math.round(p * 100)).padStart(2, '0');

    /* Tres actos: presentación, desarrollo y cierre */
    acts.forEach(a => {
      const from = parseFloat(a.dataset.from), to = parseFloat(a.dataset.to);
      a.classList.toggle('is-on', p >= from && p < to);
    });
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
          scrub: CONFIG.scrub,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: self => { state.progress = self.progress; render(); },
        },
      });

      window.addEventListener('resize', () => { resize(); render(); ScrollTrigger.refresh(); });
      render();
    })
    .catch(err => {
      /* Sin manifiesto o sin fotogramas: el poster del HTML se queda y no se rompe nada */
      console.warn('[hero] secuencia no disponible, se mantiene el poster:', err);
      root.classList.add('hero-static');
      acts.forEach(a => a.classList.add('is-on'));
    });
})();
