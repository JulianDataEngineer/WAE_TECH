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
