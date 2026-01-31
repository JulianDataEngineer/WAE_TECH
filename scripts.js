/* ============================================
   WAE - World AI Engineers
   JavaScript - Interactive Features
   ============================================ */

document.addEventListener('DOMContentLoaded', function () {
    // Initialize all components
    initThemeToggle();
    initHeader();
    initMobileMenu();
    initSmoothScroll();
    initCounterAnimation();
    initScrollAnimations();
    initContactForm();
    initParticles();
    initPlanetEffects();
});

/* ============================================
   Header Scroll Effect
   ============================================ */
function initHeader() {
    const header = document.getElementById('header');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        // Add/remove scrolled class
        if (currentScroll > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    });
}

/* ============================================
   Mobile Menu Toggle
   ============================================ */
function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            navMenu.classList.toggle('active');

            // Change icon
            const icon = mobileMenuBtn.querySelector('.material-symbols-outlined');
            if (navMenu.classList.contains('active')) {
                icon.textContent = 'close';
            } else {
                icon.textContent = 'menu';
            }
        });

        // Close menu when clicking on a link
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                const icon = mobileMenuBtn.querySelector('.material-symbols-outlined');
                icon.textContent = 'menu';
            });
        });
    }
}

/* ============================================
   Smooth Scroll for Anchor Links
   ============================================ */
function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');

    links.forEach(link => {
        link.addEventListener('click', function (e) {
            const href = this.getAttribute('href');

            if (href === '#') return;

            e.preventDefault();

            const target = document.querySelector(href);
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/* ============================================
   Counter Animation for Stats
   ============================================ */
function initCounterAnimation() {
    const counters = document.querySelectorAll('.stat-number');
    const speed = 200; // Animation speed

    const animateCounter = (counter) => {
        const target = +counter.getAttribute('data-target');
        const count = +counter.innerText;
        const increment = target / speed;

        if (count < target) {
            counter.innerText = Math.ceil(count + increment);
            setTimeout(() => animateCounter(counter), 1);
        } else {
            counter.innerText = target;
        }
    };

    // Use Intersection Observer to trigger animation when visible
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px'
    };

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                counterObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    counters.forEach(counter => {
        counterObserver.observe(counter);
    });
}

/* ============================================
   Scroll Animations (Simple AOS Alternative)
   ============================================ */
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('[data-aos]');

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const animationObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0) translateX(0)';
                animationObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    animatedElements.forEach(element => {
        // Set initial state based on animation type
        const animationType = element.getAttribute('data-aos');
        element.style.opacity = '0';
        element.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';

        switch (animationType) {
            case 'fade-up':
                element.style.transform = 'translateY(30px)';
                break;
            case 'fade-left':
                element.style.transform = 'translateX(-30px)';
                break;
            case 'fade-right':
                element.style.transform = 'translateX(30px)';
                break;
            default:
                element.style.transform = 'translateY(30px)';
        }

        // Add delay if specified
        const delay = element.getAttribute('data-aos-delay');
        if (delay) {
            element.style.transitionDelay = `${delay}ms`;
        }

        animationObserver.observe(element);
    });
}

/* ============================================
   Contact Form Handler
   ============================================ */
function initContactForm() {
    const form = document.getElementById('contact-form');

    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            // Get form data
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);

            // Simple validation
            if (!data.name || !data.email || !data.service || !data.message) {
                showNotification('Por favor, completa todos los campos requeridos.', 'error');
                return;
            }

            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email)) {
                showNotification('Por favor, ingresa un email válido.', 'error');
                return;
            }

            // Simulate form submission
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;

            submitBtn.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span> Enviando...';
            submitBtn.disabled = true;

            // Simulate API call
            setTimeout(() => {
                showNotification('¡Mensaje enviado con éxito! Te contactaremos pronto.', 'success');
                form.reset();
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }, 1500);
        });
    }
}

/* ============================================
   Notification System
   ============================================ */
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;

    const icon = type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info';

    notification.innerHTML = `
        <span class="material-symbols-outlined">${icon}</span>
        <span>${message}</span>
    `;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 24px;
        background: ${type === 'success' ? 'rgba(0, 255, 136, 0.2)' : type === 'error' ? 'rgba(255, 100, 100, 0.2)' : 'rgba(0, 212, 255, 0.2)'};
        border: 1px solid ${type === 'success' ? 'rgba(0, 255, 136, 0.5)' : type === 'error' ? 'rgba(255, 100, 100, 0.5)' : 'rgba(0, 212, 255, 0.5)'};
        border-radius: 12px;
        color: white;
        font-size: 14px;
        backdrop-filter: blur(10px);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;

    // Add animation keyframes
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateX(100%);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            @keyframes slideOut {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(100%);
                }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Remove after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out forwards';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

/* ============================================
   Particles Background Animation
   ============================================ */
function initParticles() {
    const particlesContainer = document.getElementById('particles-bg');

    if (!particlesContainer) return;

    // Create floating particles
    const particleCount = 30;

    for (let i = 0; i < particleCount; i++) {
        createParticle(particlesContainer);
    }
}

function createParticle(container) {
    const particle = document.createElement('div');

    // Random properties
    const size = Math.random() * 4 + 2;
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const duration = Math.random() * 20 + 10;
    const delay = Math.random() * 5;
    const opacity = Math.random() * 0.5 + 0.2;

    // Random color (cyan, blue, or green accent)
    const colors = ['rgba(0, 212, 255, ', 'rgba(0, 255, 136, ', 'rgba(124, 58, 237, '];
    const color = colors[Math.floor(Math.random() * colors.length)];

    particle.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}%;
        top: ${y}%;
        background: ${color}${opacity});
        border-radius: 50%;
        pointer-events: none;
        animation: floatParticle ${duration}s ease-in-out ${delay}s infinite;
    `;


    container.appendChild(particle);
}

// Add particle animation keyframes
const particleStyles = document.createElement('style');
particleStyles.textContent = `
    @keyframes floatParticle {
        0 %, 100 % {
            transform: translate(0, 0) scale(1);
            opacity: 0.3;
        }
        25 % {
            transform: translate(20px, -30px) scale(1.2);
            opacity: 0.6;
        }
        50 % {
            transform: translate(-10px, -50px) scale(0.8);
            opacity: 0.4;
        }
        75 % {
            transform: translate(30px, -20px) scale(1.1);
            opacity: 0.5;
        }
    }
    `;
document.head.appendChild(particleStyles);

/* ============================================
   Parallax Effect on Mouse Move
   ============================================ */
document.addEventListener('mousemove', function (e) {
    const heroGraphic = document.querySelector('.hero-graphic');

    if (heroGraphic) {
        const x = (window.innerWidth / 2 - e.clientX) / 50;
        const y = (window.innerHeight / 2 - e.clientY) / 50;

        heroGraphic.style.transform = `translate(${x}px, ${y}px)`;
    }
});

/* ============================================
   Active Navigation Link Highlighting
   ============================================ */
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    let current = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.offsetHeight;

        if (window.pageYOffset >= sectionTop && window.pageYOffset < sectionTop + sectionHeight) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current} `) {
            link.classList.add('active');
        }
    });
});

/* ============================================
   Typing Effect for Hero Title (Optional Enhancement)
   ============================================ */
function initTypingEffect() {
    const gradientText = document.querySelector('.gradient-text');
    if (!gradientText) return;

    const text = gradientText.textContent;
    gradientText.textContent = '';
    gradientText.style.borderRight = '2px solid var(--color-primary)';

    let i = 0;
    const typeWriter = () => {
        if (i < text.length) {
            gradientText.textContent += text.charAt(i);
            i++;
            setTimeout(typeWriter, 100);
        } else {
            gradientText.style.borderRight = 'none';
        }
    };

    setTimeout(typeWriter, 1000);
}

/* ============================================
   Lazy Loading for Images
   ============================================ */
function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');

    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
}

/* ============================================
   Theme Toggle (Dark/Light Mode)
   ============================================ */
function initThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;

    // Check for saved theme preference or default to dark
    const savedTheme = localStorage.getItem('wae-theme') || 'dark';
    if (savedTheme === 'light') {
        htmlElement.setAttribute('data-theme', 'light');
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = htmlElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';

            // Apply theme with animation
            htmlElement.style.transition = 'background-color 0.5s ease, color 0.5s ease';

            if (newTheme === 'light') {
                htmlElement.setAttribute('data-theme', 'light');
            } else {
                htmlElement.removeAttribute('data-theme');
            }

            // Save preference
            localStorage.setItem('wae-theme', newTheme);

            // Add click animation to button
            themeToggle.style.transform = 'rotate(360deg) scale(1.1)';
            setTimeout(() => {
                themeToggle.style.transform = '';
            }, 300);
        });
    }
}

/* ============================================
   Planet Interactive Effects
   ============================================ */
function initPlanetEffects() {
    const heroPlanet = document.getElementById('hero-planet');
    const planetCore = document.querySelector('.planet-core');

    if (!heroPlanet || !planetCore) return;

    // Click effect on planet
    planetCore.addEventListener('click', () => {
        planetCore.classList.add('clicked');

        // Create burst particles
        createBurstParticles(planetCore);

        setTimeout(() => {
            planetCore.classList.remove('clicked');
        }, 500);
    });

    // Enhanced parallax on mouse move within hero section
    heroPlanet.addEventListener('mousemove', (e) => {
        const rect = heroPlanet.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) / 20;
        const y = (e.clientY - rect.top - rect.height / 2) / 20;

        if (planetCore) {
            planetCore.style.transform = `translate(${x}px, ${y}px) scale(1)`;
        }
    });

    heroPlanet.addEventListener('mouseleave', () => {
        if (planetCore) {
            planetCore.style.transform = '';
        }
    });
}

function createBurstParticles(element) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    for (let i = 0; i < 12; i++) {
        const particle = document.createElement('div');
        const angle = (i / 12) * Math.PI * 2;
        const velocity = 100 + Math.random() * 50;

        particle.style.cssText = `
            position: fixed;
            width: 8px;
            height: 8px;
            left: ${centerX}px;
            top: ${centerY}px;
            background: linear-gradient(135deg, #00d4ff, #00ff88);
            border-radius: 50%;
            pointer-events: none;
            z-index: 1000;
            box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
            animation: burstParticle 0.8s ease-out forwards;
            --tx: ${Math.cos(angle) * velocity}px;
            --ty: ${Math.sin(angle) * velocity}px;
        `;

        document.body.appendChild(particle);

        setTimeout(() => particle.remove(), 800);
    }

    // Add burst animation if not already present
    if (!document.querySelector('#burst-styles')) {
        const style = document.createElement('style');
        style.id = 'burst-styles';
        style.textContent = `
            @keyframes burstParticle {
                0% {
                    transform: translate(-50%, -50%) scale(1);
                    opacity: 1;
                }
                100% {
                    transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

/* ============================================
   Console Easter Egg
   ============================================ */
console.log('%c🚀 WAE - World AI Engineers', 'font-size: 24px; font-weight: bold; color: #00d4ff;');
console.log('%c¿Interesado en unirte a nuestro equipo? Contáctanos en contacto@wae.com', 'font-size: 14px; color: #00ff88;');
