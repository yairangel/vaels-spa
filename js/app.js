

const API_URL = 'https://script.google.com/macros/s/AKfycbzNl2Y6VOeQdxhspp2_6x52IJx9tpPpENGeCuP34aBKdJZtUBFUI1_ivo7S2fVoUfrtMg/exec';

function loadServices() {
    const container = document.getElementById('services-container');

    const callbackName = 'vaelsServicesCallback';

    window[callbackName] = function (response) {
        delete window[callbackName];

        if (!response.success || !response.services) {
            container.innerHTML = '<p>No fue posible cargar los servicios.</p>';
            return;
        }

        renderServices(response.services);
    };

    const script = document.createElement('script');

    script.src = API_URL +
        '?action=services&callback=' + callbackName;

    script.onerror = function () {
        container.innerHTML =
            '<p>No fue posible conectar con VAELS SPA. Intenta más tarde.</p>';

        delete window[callbackName];
        script.remove();
    };

    document.body.appendChild(script);
}

function renderServices(services) {
    const container = document.getElementById('services-container');

    if (services.length === 0) {
        container.innerHTML = '<p>Próximamente tendremos nuevos tratamientos.</p>';
        return;
    }

    container.innerHTML = services.map(service => `
        <article class="service-card">

            <div class="service-image">
                <span>${escapeHTML(service.categoria)}</span>
            </div>

            <div class="service-content">

                <h3>${escapeHTML(service.nombre)}</h3>

                <p>${escapeHTML(service.descripcion)}</p>

                <div class="service-details">
                    <strong>$${Number(service.precio).toLocaleString('es-MX')} MXN</strong>
                    <span>${Number(service.duracion)} minutos</span>
                </div>

                <a href="#reservar"
                   class="service-button"
                   data-service-id="${escapeHTML(service.id)}">
                    Reservar este servicio
                </a>

            </div>

        </article>
    `).join('');
}

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    })[character]);
}

document.addEventListener('DOMContentLoaded', loadServices);
