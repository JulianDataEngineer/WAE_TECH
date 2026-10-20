/* WAE · Propuesta B — Plano de ingeniería
   El plano se traza al entrar y se redibuja con el avance del scroll: mientras
   el dibujo recorre la pantalla pasa del estado actual a la arquitectura
   objetivo. Si el visitante usa el conmutador, su elección manda. */
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const figure = document.getElementById('drawing');
  const plans = [...document.querySelectorAll('.plan')];
  const buttons = [...document.querySelectorAll('.seg-btn')];
  if (!figure || !plans.length) return;

  plans.forEach(svg => svg.querySelectorAll('.lines path').forEach(p => {
    const len = Math.ceil(p.getTotalLength());
    p.dataset.len = len;
    if (!p.classList.contains('dashed')) p.style.strokeDasharray = `${len}`;
  }));

  /* Solo se anima el plano visible en este tamaño de pantalla */
  const visiblePlan = () => plans.find(svg => svg.getBoundingClientRect().width > 0) || plans[0];

  function draw(view) {
    const group = visiblePlan().querySelector(view === 'asis' ? '.lines-asis' : '.lines-tobe');
    group.querySelectorAll('path').forEach((p, i) => {
      if (p.classList.contains('dashed') || reduced) { p.style.strokeDashoffset = '0'; return; }
      p.animate([{ strokeDashoffset: p.dataset.len }, { strokeDashoffset: 0 }],
        { duration: 800, delay: i * 60, easing: 'cubic-bezier(.77,0,.175,1)', fill: 'both' });
    });
  }

  let view = null, manual = false, traced = false;
  function setView(next, animate = true) {
    if (next === view) return;
    view = next;
    plans.forEach(svg => { svg.dataset.view = next; });
    buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === next)));
    if (animate) draw(next);
  }

  buttons.forEach(b => b.addEventListener('click', () => { manual = true; setView(b.dataset.view); }));
  setView('asis', false);

  /* Avance del scroll: el redibujo ocurre cuando el plano cruza la mitad superior */
  let ticking = false;
  function onScroll() {
    ticking = false;
    const r = figure.getBoundingClientRect();
    const vh = window.innerHeight;
    if (r.bottom < 0 || r.top > vh) return;
    if (!traced) { traced = true; draw('asis'); }
    if (manual) return;
    const progress = (vh - r.top) / (vh + r.height);
    setView(progress > 0.62 ? 'tobe' : 'asis');
  }
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();

  /* Si el plano ya se ve completo al cargar, el redibujo espera al primer gesto de scroll
     o, sin scroll, se muestra tras una pausa para que la tesis se entienda */
  setTimeout(() => {
    if (manual || view === 'tobe') return;
    const r = figure.getBoundingClientRect();
    if (r.top >= 0 && r.bottom <= window.innerHeight) setView('tobe');
  }, reduced ? 800 : 3200);

})();
