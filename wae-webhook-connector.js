// ============================================================
// WAE - Conexión Formulario Web → n8n Webhook
// World AI Engineers 🚀
// ============================================================

(function () {
    'use strict';

    // Configuración del Webhook n8n
    // URL pública via ngrok para www.waengineers.co
    const N8N_WEBHOOK_URL = 'https://rebbecca-sniffier-teri.ngrok-free.dev/webhook-test/wae-contacto';

    // Para producción (cuando actives el workflow):
    // const N8N_WEBHOOK_URL = 'https://rebbecca-sniffier-teri.ngrok-free.dev/webhook/wae-contacto';

    // Mapeo de servicios para mensajes personalizados
    const SERVICIOS_MAP = {
        'cocreation': 'Co-Creación Ágil',
        'cloud': 'Cloud-Native',
        'ai': 'IA Aplicada',
        'all': 'Todos los Servicios'
    };

    // Inicializar cuando el DOM esté listo
    document.addEventListener('DOMContentLoaded', function () {
        const form = document.getElementById('contact-form');

        if (!form) {
            console.warn('[WAE] Formulario de contacto no encontrado');
            return;
        }

        form.addEventListener('submit', handleFormSubmit);
        console.log('[WAE] Sistema de captación inicializado');
    });

    // Manejador principal del envío
    async function handleFormSubmit(event) {
        event.preventDefault();

        const form = event.target;
        const submitBtn = form.querySelector('button[type="submit"]');

        // Obtener datos del formulario
        const formData = {
            name: form.querySelector('#name').value.trim(),
            email: form.querySelector('#email').value.trim(),
            company: form.querySelector('#company').value.trim() || 'No especificada',
            service: form.querySelector('#service').value,
            serviceName: SERVICIOS_MAP[form.querySelector('#service').value] || 'No especificado',
            message: form.querySelector('#message').value.trim(),
            timestamp: new Date().toISOString(),
            source: 'web-form',
            userAgent: navigator.userAgent,
            referrer: document.referrer || 'directo'
        };

        // Validación básica
        if (!validateFormData(formData)) {
            return;
        }

        // UI: Estado de carga
        setLoadingState(submitBtn, true);

        try {
            const response = await sendToWebhook(formData);

            if (response.success) {
                showNotification('success', '¡Mensaje enviado correctamente! Te contactaremos pronto.');
                form.reset();
                trackConversion(formData);
            } else {
                throw new Error(response.message || 'Error en el servidor');
            }
        } catch (error) {
            console.error('[WAE] Error:', error);
            showNotification('error', 'Hubo un problema al enviar tu mensaje. Por favor, intenta de nuevo.');
        } finally {
            setLoadingState(submitBtn, false);
        }
    }

    // Envío al webhook de n8n
    async function sendToWebhook(data) {
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    }

    // Validación de campos
    function validateFormData(data) {
        const errors = [];

        if (!data.name || data.name.length < 2) {
            errors.push('El nombre es requerido');
        }

        if (!data.email || !isValidEmail(data.email)) {
            errors.push('Email inválido');
        }

        if (!data.service) {
            errors.push('Selecciona un servicio');
        }

        if (!data.message || data.message.length < 10) {
            errors.push('El mensaje debe tener al menos 10 caracteres');
        }

        if (errors.length > 0) {
            showNotification('error', errors.join('. '));
            return false;
        }

        return true;
    }

    // Validar formato de email
    function isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    // Estado de carga del botón
    function setLoadingState(button, isLoading) {
        if (isLoading) {
            button.disabled = true;
            button.dataset.originalText = button.innerHTML;
            button.innerHTML = `
                <span class="material-symbols-outlined spin">sync</span>
                Enviando...
            `;
        } else {
            button.disabled = false;
            button.innerHTML = button.dataset.originalText;
        }
    }

    // Sistema de notificaciones
    function showNotification(type, message) {
        // Remover notificación existente
        const existing = document.querySelector('.wae-notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = `wae-notification wae-notification--${type}`;
        notification.innerHTML = `
            <span class="material-symbols-outlined">
                ${type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>${message}</span>
            <button class="wae-notification__close" onclick="this.parentElement.remove()">
                <span class="material-symbols-outlined">close</span>
            </button>
        `;

        document.body.appendChild(notification);

        // Auto-remover después de 5 segundos
        setTimeout(() => notification.remove(), 5000);
    }

    // Tracking de conversión (opcional: Google Analytics, etc.)
    function trackConversion(data) {
        // Google Analytics 4
        if (typeof gtag !== 'undefined') {
            gtag('event', 'generate_lead', {
                'event_category': 'Contact',
                'event_label': data.serviceName,
                'value': 1
            });
        }

        // Evento personalizado para otros sistemas
        window.dispatchEvent(new CustomEvent('wae:lead_captured', {
            detail: {
                service: data.serviceName,
                company: data.company
            }
        }));

        console.log('[WAE] Conversión registrada:', data.serviceName);
    }

})();

// ============================================================
// Estilos CSS para las notificaciones (agregar a styles.css)
// ============================================================
/*
.wae-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 24px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 10000;
    animation: slideIn 0.3s ease;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    font-family: 'Inter', sans-serif;
    max-width: 400px;
}

.wae-notification--success {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
}

.wae-notification--error {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
}

.wae-notification__close {
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    opacity: 0.8;
    transition: opacity 0.2s;
}

.wae-notification__close:hover {
    opacity: 1;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
*/
