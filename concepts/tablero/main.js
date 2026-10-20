/* WAE · Propuesta A — Tablero de control
   Las fichas del caso de demostración recorren el tablero. La que no
   supera el umbral se retiene hasta que una persona la aprueba. Toda
   bahía vacía muestra su ranura libre: la ausencia también es información. */
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Datos ficticios del caso de demostración */
  const CASES = [
    { id: 'FAC-2214', origin: 'Correo', conf: '0,97', amount: 'USD 1.120', route: 'done' },
    { id: 'OC-8871',  origin: 'ERP',    conf: '0,99', amount: 'USD 4.390', route: 'done' },
    { id: 'FAC-2216', origin: 'Excel',  conf: '0,71', amount: 'USD 4.820', route: 'hold',
      note: '¿cargo no pactado?', reason: 'confianza 0,71 bajo el umbral de 0,85 y monto sobre el límite' },
    { id: 'MOV-3302', origin: 'Banco',  conf: '0,98', amount: 'USD 860',   route: 'done' },
    { id: 'FAC-2217', origin: 'Correo', conf: 'en cola', amount: 'USD 2.310', route: 'queue' },
    { id: 'MOV-3303', origin: 'Banco',  conf: '0,52', amount: 'USD 860', route: 'queue', flag: 'dup', tag: 'posible duplicado de MOV-3302' }
  ];

  const bays = {
    in: document.getElementById('bay-in'),
    hold: document.getElementById('bay-hold'),
    done: document.getElementById('bay-done')
  };
  const status = document.getElementById('board-status');
  const replay = document.getElementById('replay');
  const board = document.getElementById('board');
  if (!bays.in || !board) return;

  let timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));

  function syncSlots() {
    Object.values(bays).forEach(bay => {
      const hasCase = !!bay.querySelector('.case');
      const slot = bay.querySelector('.slot');
      if (hasCase && slot) slot.remove();
      if (!hasCase && !slot) {
        const li = document.createElement('li');
        li.className = 'slot';
        li.textContent = 'Ranura libre';
        bay.appendChild(li);
      }
    });
  }

  function strip(c) {
    const li = document.createElement('li');
    li.className = 'strip case';
    li.dataset.state = 'in';
    if (c.flag) li.dataset.flag = c.flag;
    li.innerHTML = `
      <div class="case-body">
        <p class="case-id">${c.id}<small>${c.origin}</small></p>
        <p class="case-cell">CONF ${c.conf}</p>
        <p class="case-cell">${c.amount}</p>
        ${c.tag ? `<p class="case-flag">${c.tag}</p>` : ''}
      </div>`;
    return li;
  }

  /* FLIP: la ficha se desliza físicamente hasta su nueva bahía */
  function move(el, bay) {
    const first = el.getBoundingClientRect();
    bays[bay].appendChild(el);
    el.dataset.state = bay;
    syncSlots();
    if (reduced) return;
    const last = el.getBoundingClientRect();
    el.animate(
      [{ transform: `translate(${first.left - last.left}px, ${first.top - last.top}px)` }, { transform: 'translate(0, 0)' }],
      { duration: 520, easing: 'cubic-bezier(.77,0,.175,1)' }
    );
  }

  function hold(el, c) {
    move(el, 'hold');
    const body = el.querySelector('.case-body');
    const note = document.createElement('p');
    note.className = 'case-note';
    note.textContent = c.note;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'case-approve';
    btn.textContent = 'Aprobar';
    btn.setAttribute('aria-label', `Aprobar ${c.id}`);
    body.append(note, btn);
    requestAnimationFrame(() => note.classList.add('on'));
    status.textContent = `${c.id} retenida: ${c.reason}. Espera una decisión humana.`;

    btn.addEventListener('click', () => {
      btn.remove();
      note.textContent = 'aprobado · flete pactado';
      move(el, 'done');
      status.textContent = `${c.id} aprobada por una persona y registrada en auditoría. MOV-3303 queda en cola por posible duplicado.`;
      replay.focus({ preventScroll: true });
    }, { once: true });
  }

  function run() {
    timers.forEach(clearTimeout);
    timers = [];
    Object.values(bays).forEach(b => { b.innerHTML = ''; });
    status.textContent = '';

    const moving = [];
    CASES.forEach(c => {
      const el = strip(c);
      bays.in.appendChild(el);
      if (c.route !== 'queue') moving.push([el, c]);
    });
    syncSlots();

    const step = reduced ? 60 : 900;
    moving.forEach(([el, c], i) => {
      later(() => (c.route === 'hold' ? hold(el, c) : move(el, 'done')), 700 + i * step);
    });
    later(() => {
      if (bays.hold.querySelector('.case-approve')) status.textContent += ' Pulse Aprobar para liberarla.';
    }, 700 + moving.length * step);
  }

  replay.addEventListener('click', run);

  const io = new IntersectionObserver(entries => {
    if (entries.some(e => e.isIntersecting)) { io.disconnect(); run(); }
  }, { threshold: 0.35 });
  io.observe(board);

  /* Cronograma: las fichas entran al canal una tras otra */
  const reveal = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const i = [...e.target.parentElement.children].indexOf(e.target);
      setTimeout(() => e.target.classList.add('is-in'), reduced ? 0 : i * 60);
      reveal.unobserve(e.target);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('[data-reveal]').forEach(el => reveal.observe(el));

  /* Método: el portaficha avanza tramo a tramo sobre la misma ficha */
  const progress = document.getElementById('progress');
  const legs = [...progress.children];
  const advance = new IntersectionObserver(entries => {
    if (!entries.some(e => e.isIntersecting)) return;
    advance.disconnect();
    legs.forEach((leg, i) => setTimeout(() => leg.classList.add('is-in'), reduced ? 0 : 180 + i * 140));
  }, { threshold: 0.4 });
  advance.observe(progress);
})();
