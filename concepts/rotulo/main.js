/* WAE · Propuesta C — Rótulo de depósito
   La ventana principal avanza curso a curso con un paso breve. Antes de la
   aprobación humana se detiene a medio paso: abajo queda la nota del curso
   retenido y arriba la leyenda del siguiente, unidas por la costura. */
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const COURSES = [
    { legend: 'Correo',      sub: 'correos sueltos, sin dueño' },
    { legend: 'Excel',       sub: 'hojas de cálculo sin una fuente única' },
    { legend: 'ERP',         sub: 'cruce manual contra la orden de compra' },
    { legend: 'Retenido',    sub: 'la confianza quedó bajo el umbral' },
    { legend: 'Aprobación',  sub: 'una persona decide con el contexto preparado', gated: true },
    { legend: 'Diagnóstico', sub: 'destino: un proceso crítico, diagnosticado en 10 días' }
  ];

  const win = document.getElementById('blind-window');
  const roll = document.getElementById('blind-roll');
  const status = document.getElementById('blind-status');
  const pos = document.getElementById('blind-pos');
  const approve = document.getElementById('blind-approve');
  const replay = document.getElementById('blind-replay');
  if (!roll) return;

  roll.innerHTML = COURSES.map((c, i) => `
    <li class="roll-row">
      <span class="roll-no">${String(i + 1).padStart(2, '0')}</span>
      <span class="roll-legend">${c.legend}</span>
    </li>`).join('');

  let index = 0, timer = null, stalled = false, approved = false;

  /* La altura del curso se calcula para que la leyenda más larga quepa a lo ancho.
     Se miden las leyendas reales a una altura conocida: el tamaño escala lineal con --row. */
  function fit() {
    const legends = [...win.querySelectorAll('.roll-legend')];
    const numbers = [...win.querySelectorAll('.roll-no')];
    if (!legends.length) return;
    const rowEl = roll.firstElementChild;
    const cs = getComputedStyle(rowEl);
    const pad = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    const gap = parseFloat(cs.columnGap || cs.gap) || 0;
    win.style.setProperty('--row', '100px');
    const k = Math.max(...legends.map(l => l.getBoundingClientRect().width)) / 100;
    const kn = Math.max(...numbers.map(n => n.getBoundingClientRect().width)) / 100;
    const avail = win.clientWidth - pad - gap - 16;
    const row = Math.max(56, Math.min(avail / (k + kn), window.innerHeight * 0.3, 250));
    win.style.setProperty('--row', `${Math.floor(row)}px`);
    place(stalled ? index + 0.5 : index);
  }
  const row = () => win.getBoundingClientRect().height;
  const place = p => { roll.style.transform = `translateY(${-p * row()}px)`; };
  const no = i => String(i + 1).padStart(2, '0');

  function show(i) {
    index = i; stalled = false;
    win.classList.remove('is-stalled');
    place(i);
    pos.textContent = `Curso ${no(i)}`;
    status.textContent = i === COURSES.length - 1
      ? 'Llegó a destino: diagnóstico de un proceso crítico en 10 días. La decisión humana quedó registrada.'
      : `Curso ${no(i)} · ${COURSES[i].legend}: ${COURSES[i].sub}.`;
  }

  function stall(next) {
    stalled = true;
    win.classList.add('is-stalled');
    place(next - 0.5);
    pos.textContent = `Curso ${no(next - 1)}B · ${no(next)}A`;
    status.textContent = 'Detenido a medio paso: la confianza está bajo el umbral. Nada avanza hasta que una persona apruebe.';
    approve.disabled = false;
  }

  function tick() {
    const next = index + 1;
    if (next >= COURSES.length) return;
    if (COURSES[next].gated && !approved) { stall(next); return; }
    show(next);
    timer = setTimeout(tick, reduced ? 500 : 1500);
  }

  function run() {
    clearTimeout(timer);
    approved = false;
    approve.disabled = true;
    show(0);
    timer = setTimeout(tick, reduced ? 500 : 1500);
  }

  approve.addEventListener('click', () => {
    if (!stalled) return;
    approved = true;
    approve.disabled = true;
    show(index + 1);
    status.textContent = 'Aprobado por una persona y registrado. El caso sigue su curso.';
    timer = setTimeout(tick, reduced ? 500 : 1300);
    replay.focus({ preventScroll: true });
  });
  replay.addEventListener('click', run);
  window.addEventListener('resize', fit, { passive: true });
  fit();
  /* Se vuelve a medir cuando la grotesca condensada termina de cargar */
  if (document.fonts?.load) document.fonts.load('900 100px "Big Shoulders Display"', 'DIAGNÓSTICO').then(fit, fit);
  window.addEventListener('load', fit);

  const start = new IntersectionObserver(entries => {
    if (entries.some(e => e.isIntersecting)) { start.disconnect(); run(); }
  }, { threshold: 0.5 });
  start.observe(win);

  /* Cinta índice: marca la sección visible */
  const links = [...document.querySelectorAll('.tape-nav a')];
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(a => a.setAttribute('aria-current', String(a.getAttribute('href') === '#' + e.target.id)));
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean).forEach(s => spy.observe(s));

  /* Método: el curso que pasa por el centro se imprime invertido */
  const steps = [...document.querySelectorAll('#method-list li')];
  const lead = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) steps.forEach(s => s.classList.toggle('is-lead', s === e.target)); });
  }, { rootMargin: '-45% 0px -45% 0px' });
  steps.forEach(s => lead.observe(s));

  /* Tabla del pod en móvil: cada valor lleva su columna */
  document.querySelectorAll('.pod').forEach(t => {
    const heads = [...t.querySelectorAll('thead th')].map(th => th.textContent);
    t.querySelectorAll('tbody tr').forEach(tr => tr.querySelectorAll('td').forEach((td, i) => td.dataset.label = heads[i + 1]));
  });
})();
