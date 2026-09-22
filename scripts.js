/* ============================================
   WAE - World AI Engineers
   JavaScript — Minimalist Edition
   ============================================ */

/* ────────────────────────────────────────────
   GOOGLE SHEETS INTEGRATION
   Replace the URL below with your Google Apps
   Script Web App deployment URL.

   HOW TO SET UP:
   1. Open: https://docs.google.com/spreadsheets/d/1OKN1NNW1_91Za9Y0NNcVCKUNlWneTJYYLl2w23gVTJQ
   2. Extensions → Apps Script
   3. Paste and deploy the script (see README or
      implementation_plan.md for the code)
   4. Copy the Web App URL here ↓
   ──────────────────────────────────────────── */
const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbxlXPLACEHOLDER_REPLACE_THIS/exec';

/* ─── DO NOT EDIT BELOW UNLESS NEEDED ─────── */

document.addEventListener('DOMContentLoaded', function () {
    initHeader();
    initMobileMenu();
    initSmoothScroll();
    initScrollAnimations();
    initContactForm();
});

/* ============================================
   Header Scroll Effect
   ============================================ */
function initHeader() {
    const header = document.getElementById('header');
    if (!header) return;

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 40) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }, { passive: true });
}

/* ============================================
   Mobile Menu Toggle
   ============================================ */
function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (!mobileMenuBtn || !navMenu) return;

    mobileMenuBtn.addEventListener('click', () => {
        const isOpen = navMenu.classList.toggle('active');
        const icon = mobileMenuBtn.querySelector('.material-symbols-outlined');
        icon.textContent = isOpen ? 'close' : 'menu';
        document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            mobileMenuBtn.querySelector('.material-symbols-outlined').textContent = 'menu';
            document.body.style.overflow = '';
        });
    });
}

/* ============================================
   Smooth Scroll
   ============================================ */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                const topOffset = target.getBoundingClientRect().top + window.pageYOffset - 80;
                window.scrollTo({ top: topOffset, behavior: 'smooth' });
            }
        });
    });
}

/* ============================================
   Scroll Animations (Fade-In on Scroll)
   ============================================ */
function initScrollAnimations() {
    const elements = document.querySelectorAll('[data-aos]');
    if (!elements.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0) translateX(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    elements.forEach(el => {
        const type = el.getAttribute('data-aos');
        const delay = el.getAttribute('data-aos-delay') || '0';
        el.style.opacity = '0';
        el.style.transition = `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`;
        el.style.transform = type === 'fade-right' ? 'translateX(-24px)'
            : type === 'fade-left' ? 'translateX(24px)'
            : 'translateY(24px)';
        observer.observe(el);
    });
}

/* ============================================
   Contact Form — Google Sheets Integration
   ============================================ */
function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const data = Object.fromEntries(new FormData(form));

        // Validation
        if (!data.name?.trim() || !data.email?.trim() || !data.service || !data.message?.trim()) {
            showNotification('Por favor completa todos los campos requeridos.', 'error');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            showNotification('Por favor ingresa un email válido.', 'error');
            return;
        }

        const submitBtn = document.getElementById('submit-btn');
        const originalHTML = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span> Enviando...';
        submitBtn.disabled = true;

        try {
            // Check if URL has been configured
            if (GOOGLE_SHEETS_URL.includes('PLACEHOLDER_REPLACE_THIS')) {
                // Simulate success for demo — remove once URL is configured
                await new Promise(r => setTimeout(r, 1200));
                showNotification('¡Mensaje enviado! Te contactaremos muy pronto. 🚀', 'success');
                form.reset();
            } else {
                // Real submission to Google Sheets
                const payload = {
                    timestamp: new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' }),
                    name: data.name,
                    email: data.email,
                    company: data.company || '—',
                    service: data.service,
                    message: data.message
                };

                const response = await fetch(GOOGLE_SHEETS_URL, {
                    method: 'POST',
                    mode: 'no-cors', // Google Apps Script requires no-cors
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                // no-cors returns opaque response — assume success if no throw
                showNotification('¡Mensaje enviado! Te contactaremos muy pronto. 🚀', 'success');
                form.reset();
            }
        } catch (err) {
            console.error('Form submission error:', err);
            showNotification('Hubo un error al enviar. Escríbenos a proyectos@waengineers.co', 'error');
        } finally {
            submitBtn.innerHTML = originalHTML;
            submitBtn.disabled = false;
        }
    });
}

/* ============================================
   Notification System
   ============================================ */
function showNotification(message, type = 'info') {
    // Remove any existing notification
    document.querySelector('.wae-notification')?.remove();

    const el = document.createElement('div');
    el.className = 'wae-notification';

    const iconMap = { success: 'check_circle', error: 'error', info: 'info' };
    const icon = iconMap[type] || 'info';

    const colors = {
        success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534' },
        error:   { bg: '#fef2f2', border: '#fecaca', text: '#991b1b' },
        info:    { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af' },
    };
    const c = colors[type] || colors.info;

    el.innerHTML = `
        <span class="material-symbols-outlined" style="font-size:20px;flex-shrink:0;">${icon}</span>
        <span>${message}</span>
    `;
    el.style.cssText = `
        position: fixed; bottom: 24px; right: 24px;
        display: flex; align-items: center; gap: 10px;
        padding: 14px 20px;
        background: ${c.bg}; border: 1px solid ${c.border}; color: ${c.text};
        border-radius: 10px; font-size: 14px; font-weight: 500;
        box-shadow: 0 4px 20px rgba(0,0,0,0.12);
        z-index: 9999; max-width: 380px;
        animation: notifSlideIn 0.3s ease-out both;
        font-family: 'DM Sans', sans-serif;
    `;

    if (!document.querySelector('#wae-notif-style')) {
        const style = document.createElement('style');
        style.id = 'wae-notif-style';
        style.textContent = `
            @keyframes notifSlideIn {
                from { opacity:0; transform: translateX(20px); }
                to   { opacity:1; transform: translateX(0); }
            }
            @keyframes notifSlideOut {
                from { opacity:1; transform: translateX(0); }
                to   { opacity:0; transform: translateX(20px); }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(el);

    setTimeout(() => {
        el.style.animation = 'notifSlideOut 0.3s ease-in forwards';
        setTimeout(() => el.remove(), 300);
    }, 5000);
}

/* ============================================
   Active Nav Highlight on Scroll
   ============================================ */
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    let current = '';

    sections.forEach(section => {
        if (window.pageYOffset >= section.offsetTop - 120) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}, { passive: true });

/* ============================================
   Console Signature
   ============================================ */
console.log('%cWAE — World AI Engineers', 'font-size:18px;font-weight:700;color:#1a3a6b;');
console.log('%cData Engineering · Cloud · IA Aplicada · Bogotá, Colombia', 'font-size:12px;color:#5a5a72;');

/* ============================================================
   Acordeón de servicios: como mucho uno abierto; cada botón abre y cierra.
   ============================================================ */
(function () {
    'use strict';
    const items = Array.from(document.querySelectorAll('.service-item'));
    if (!items.length) return;

    function abrir(objetivo) {
        items.forEach(it => {
            const btn = it.querySelector('.service-head');
            const on = it === objetivo;
            it.classList.toggle('is-open', on);
            if (btn) btn.setAttribute('aria-expanded', String(on));
        });
    }

    function cerrar(it) {
        it.classList.remove('is-open');
        const btn = it.querySelector('.service-head');
        if (btn) btn.setAttribute('aria-expanded', 'false');
    }

    items.forEach(it => {
        const btn = it.querySelector('.service-head');
        if (!btn) return;
        /* El botón alterna: abre la fila (cerrando la otra) o la cierra si ya
           estaba abierta, así ambas pueden quedar recogidas. */
        btn.addEventListener('click', () => {
            if (it.classList.contains('is-open')) cerrar(it);
            else abrir(it);
        });
    });
})();

/* ============================================================
   Carrusel de proceso: scroll nativo con botones.
   ============================================================ */
(function () {
    'use strict';
    const track = document.querySelector('.process-track');
    const arrows = Array.from(document.querySelectorAll('.process-arrow'));
    if (!track || !arrows.length) return;

    function paso() {
        const card = track.querySelector('.process-card');
        if (!card) return 320;
        const gap = parseFloat(getComputedStyle(track).columnGap) || 20;
        return card.getBoundingClientRect().width + gap;
    }

    function estado() {
        const max = track.scrollWidth - track.clientWidth - 2;
        arrows.forEach(b => {
            const dir = +b.dataset.dir;
            b.disabled = dir < 0 ? track.scrollLeft <= 2 : track.scrollLeft >= max;
        });
    }

    arrows.forEach(b => b.addEventListener('click', () => {
        track.scrollBy({ left: paso() * +b.dataset.dir, behavior: 'smooth' });
    }));

    /* El carrusel se extiende hasta el borde real de la pantalla. Antes se
       calculaba con calc(50% - 50vw), pero dentro de la rejilla ese 50% es
       de la columna, no de la página: sobresalía cientos de píxeles y la
       última tarjeta nunca llegaba a verse. */
    const viewport = document.querySelector('.process-viewport');
    const heading = document.querySelector('.process-heading');

    function ajustar() {
        if (viewport) {
            viewport.style.marginRight = '0px';
            const ancho = document.documentElement.clientWidth;
            const sobra = Math.max(0, Math.round(ancho - viewport.getBoundingClientRect().right));
            viewport.style.marginRight = (-sobra) + 'px';
        }
        /* Margen final simétrico con el de la izquierda de la página */
        const margen = heading ? Math.max(16, Math.round(heading.getBoundingClientRect().left)) : 32;
        track.style.paddingRight = margen + 'px';
        estado();
    }

    function alMover() {
        estado();
        if (viewport) viewport.classList.toggle('is-scrolled', track.scrollLeft > 4);
    }

    track.addEventListener('scroll', alMover, { passive: true });
    window.addEventListener('resize', ajustar, { passive: true });
    window.addEventListener('load', ajustar);
    ajustar();
})();

/* ============================================================
   Diagrama de soluciones: conectores SVG con pulsos de luz.
   La luz sale del logo, recorre la línea hasta cada corchete y
   allí se reparte hacia arriba y hacia abajo hasta las tarjetas.
   ============================================================ */
(function () {
    'use strict';
    const diag = document.querySelector('.solutions-diagram');
    if (!diag) return;
    const svg = diag.querySelector('.sol-lines');
    const logo = diag.querySelector('.sol-logo');
    const NS = 'http://www.w3.org/2000/svg';
    const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const RADIO = 18;      // curva del corchete
    const PULSO = 46;      // largo del destello, en px
    const CICLO = 4200;    // ms por vuelta completa
    let animaciones = [];

    const nodo = (tag, attrs) => {
        const e = document.createElementNS(NS, tag);
        for (const k in attrs) e.setAttribute(k, attrs[k]);
        return e;
    };

    /* Posición respecto al diagrama sin contar transformaciones: la entrada
       desplaza las tarjetas y getBoundingClientRect daría líneas torcidas. */
    function caja(el) {
        let x = 0, y = 0, n = el;
        while (n && n !== diag) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
        const w = el.offsetWidth, h = el.offsetHeight;
        return { l: x, r: x + w, t: y, b: y + h, cx: x + w / 2, cy: y + h / 2 };
    }

    function dibujar() {
        animaciones.forEach(a => a.cancel());
        animaciones = [];
        svg.innerHTML = '';
        if (getComputedStyle(svg).display === 'none') return;

        svg.setAttribute('viewBox', `0 0 ${diag.offsetWidth} ${diag.offsetHeight}`);
        const L = caja(logo);
        const tramos = [];
        const uniones = [];

        [[[1, 2, 3], -1], [[4, 5, 6], 1]].forEach(([ids, lado]) => {
            const cards = ids.map(n => caja(diag.querySelector('.sol-' + n)));
            const bordeCard = lado < 0 ? Math.max(...cards.map(k => k.r)) : Math.min(...cards.map(k => k.l));
            const bordeLogo = lado < 0 ? L.l : L.r;
            const espina = bordeCard + (bordeLogo - bordeCard) * 0.4;
            const y0 = L.cy;

            tramos.push({ d: `M${bordeLogo} ${y0} H${espina}`, fase: 'tronco' });
            uniones.push([espina, y0]);

            cards.forEach(k => {
                const x1 = lado < 0 ? k.r : k.l;
                const y1 = k.cy;
                let d;
                if (Math.abs(y1 - y0) < RADIO) {
                    d = `M${espina} ${y0} V${y1} H${x1}`;
                } else {
                    const v = y1 < y0 ? 1 : -1;          // se acerca a la fila por arriba o por abajo
                    const h = lado < 0 ? -1 : 1;         // y gira hacia la tarjeta
                    d = `M${espina} ${y0} V${y1 + v * RADIO} Q${espina} ${y1} ${espina + h * RADIO} ${y1} H${x1}`;
                }
                tramos.push({ d, fase: 'rama' });
            });
        });

        const s7 = caja(diag.querySelector('.sol-7'));
        tramos.push({ d: `M${L.cx} ${L.b} V${s7.t}`, fase: 'vertical' });

        const gBase = nodo('g', {}), gPulso = nodo('g', {}), gUnion = nodo('g', {});
        svg.append(gBase, gPulso, gUnion);

        /* Cada tramo entra en su momento del ciclo: primero el tronco hasta el
           corchete, después las ramas hacia las tarjetas. */
        const FASES = { tronco: [0, 0.34], rama: [0.30, 0.80], vertical: [0.04, 0.62] };

        tramos.forEach(t => {
            gBase.appendChild(nodo('path', { d: t.d, class: 'base' }));
            if (reducir) return;
            const p = nodo('path', { d: t.d, class: 'pulso' });
            gPulso.appendChild(p);
            const largo = p.getTotalLength();
            p.style.strokeDasharray = `${PULSO} ${largo + PULSO}`;
            p.style.strokeDashoffset = PULSO;
            const [a, b] = FASES[t.fase];
            animaciones.push(p.animate([
                { strokeDashoffset: PULSO, offset: 0 },
                { strokeDashoffset: PULSO, offset: a, easing: 'ease-in-out' },
                { strokeDashoffset: -largo, offset: b },
                { strokeDashoffset: -largo, offset: 1 }
            ], { duration: CICLO, iterations: Infinity }));
        });

        uniones.forEach(([x, y]) => gUnion.appendChild(nodo('circle', { cx: x, cy: y, r: 4, class: 'nodo' })));
    }

    let pendiente = 0;
    const redibujar = () => { cancelAnimationFrame(pendiente); pendiente = requestAnimationFrame(dibujar); };

    if ('ResizeObserver' in window) new ResizeObserver(redibujar).observe(diag);
    window.addEventListener('resize', redibujar, { passive: true });
    window.addEventListener('load', redibujar);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(redibujar);
    redibujar();

    /* Entrada escalonada al llegar a la sección */
    if (reducir || !('IntersectionObserver' in window)) {
        diag.classList.add('is-visible');
    } else {
        const io = new IntersectionObserver(es => es.forEach(e => {
            if (e.isIntersecting) { diag.classList.add('is-visible'); io.disconnect(); }
        }), { threshold: 0.18 });
        io.observe(diag);
    }
})();

/* ─── Método: pasarela con CTA que sigue al cursor ─── */
(function () {
    var stage = document.querySelector('.gallery-stage');
    if (!stage) return;

    var track  = stage.querySelector('.gallery-track');
    var slides = stage.querySelectorAll('.gallery-slide');
    var cursor = stage.querySelector('.gallery-cursor');
    var label  = cursor.querySelector('.gc-label');
    var dots   = document.querySelectorAll('.gallery-dot');
    var steps  = document.querySelectorAll('.gallery-step');
    var total  = slides.length;
    var actual = 0;

    function ir(i) {
        actual = (i + total) % total;
        track.style.transform = 'translateX(' + (-actual * 100) + '%)';
        for (var k = 0; k < total; k++) {
            var on = k === actual;
            slides[k].classList.toggle('is-active', on);
            dots[k].classList.toggle('is-active', on);
            dots[k].setAttribute('aria-selected', on ? 'true' : 'false');
            dots[k].tabIndex = on ? 0 : -1;
            steps[k].classList.toggle('is-active', on);
            if (on) steps[k].removeAttribute('aria-hidden');
            else steps[k].setAttribute('aria-hidden', 'true');
        }
    }

    Array.prototype.forEach.call(dots, function (d, k) {
        d.addEventListener('click', function () { ir(k); });
    });

    stage.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { ir(actual + 1); e.preventDefault(); }
        else if (e.key === 'ArrowLeft') { ir(actual - 1); e.preventDefault(); }
    });

    /* Mitad izquierda retrocede, mitad derecha avanza */
    var atras = false;
    function lado(x) {
        var r = stage.getBoundingClientRect();
        atras = x - r.left < r.width / 2;
        cursor.classList.toggle('is-prev', atras);
        label.textContent = atras ? 'Anterior' : 'Siguiente';
    }

    /* El CTA persigue al puntero con un leve retardo */
    var px = 0, py = 0, cx = 0, cy = 0, raf = 0;
    function paso() {
        cx += (px - cx) * 0.2;
        cy += (py - cy) * 0.2;
        cursor.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
        raf = (Math.abs(px - cx) > 0.3 || Math.abs(py - cy) > 0.3) ? requestAnimationFrame(paso) : 0;
    }
    function apuntar(e, saltar) {
        var r = stage.getBoundingClientRect();
        px = e.clientX - r.left;
        py = e.clientY - r.top;
        if (saltar) { cx = px; cy = py; }
        lado(e.clientX);
        if (!raf) raf = requestAnimationFrame(paso);
    }

    stage.addEventListener('pointerenter', function (e) {
        if (e.pointerType !== 'mouse') return;
        stage.classList.add('has-mouse');
        apuntar(e, true);
        stage.classList.add('is-hover');
    });
    stage.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        if (!stage.classList.contains('is-hover')) { stage.classList.add('has-mouse', 'is-hover'); apuntar(e, true); }
        else apuntar(e, false);
    });
    stage.addEventListener('pointerleave', function () { stage.classList.remove('is-hover'); });

    /* Clic con ratón o deslizamiento en táctil */
    var x0 = null, y0 = 0;
    stage.addEventListener('pointerdown', function (e) { x0 = e.clientX; y0 = e.clientY; });
    stage.addEventListener('pointerup', function (e) {
        if (x0 === null) return;
        var dx = e.clientX - x0, dy = e.clientY - y0;
        x0 = null;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { ir(actual + (dx < 0 ? 1 : -1)); return; }
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) {
            if (e.pointerType === 'mouse') { lado(e.clientX); ir(actual + (atras ? -1 : 1)); }
            else ir(actual + 1);
        }
    });
    stage.addEventListener('pointercancel', function () { x0 = null; });

    ir(0);
})();

/* ─── Preguntas frecuentes: una abierta a la vez ─── */
(function () {
    var items = document.querySelectorAll('.faq-item');
    if (!items.length) return;

    function abrir(item, si) {
        var boton = item.querySelector('.faq-trigger');
        var panel = item.querySelector('.faq-panel');
        item.classList.toggle('is-open', si);
        boton.setAttribute('aria-expanded', si ? 'true' : 'false');
        if (si) {
            panel.hidden = false;
            panel.style.height = panel.scrollHeight + 'px';
        } else {
            panel.style.height = panel.scrollHeight + 'px';
            void panel.offsetHeight;          /* fija la altura antes de cerrar */
            panel.style.height = '0px';
        }
    }

    Array.prototype.forEach.call(items, function (item) {
        var panel = item.querySelector('.faq-panel');
        var abierto = item.classList.contains('is-open');
        panel.hidden = false;
        panel.style.height = abierto ? 'auto' : '0px';

        panel.addEventListener('transitionend', function (e) {
            if (e.propertyName !== 'height') return;
            if (item.classList.contains('is-open')) panel.style.height = 'auto';
            else panel.hidden = true;
        });

        item.querySelector('.faq-trigger').addEventListener('click', function () {
            var estaAbierto = item.classList.contains('is-open');
            Array.prototype.forEach.call(items, function (otro) {
                if (otro !== item && otro.classList.contains('is-open')) abrir(otro, false);
            });
            if (estaAbierto) abrir(item, false);
            else abrir(item, true);
        });
    });

    /* Al cambiar el ancho, la respuesta abierta recalcula su altura sola */
    window.addEventListener('resize', function () {
        Array.prototype.forEach.call(items, function (item) {
            if (item.classList.contains('is-open')) item.querySelector('.faq-panel').style.height = 'auto';
        });
    });
})();
