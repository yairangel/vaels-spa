
const API_URL = 'https://vaels-spa-api.yairangelfelix.workers.dev/';

async function loadServices() {
    const container = document.getElementById('services-container');

    if (!container) {
        console.error('No se encontró services-container');
        return;
    }

    container.innerHTML = '<p>Cargando nuestros tratamientos...</p>';

    try {
        const response = await fetch(
            `${API_URL}?action=services`,
            { method: 'GET' }
        );

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success || !Array.isArray(data.services)) {
            throw new Error('La respuesta del servidor no es válida');
        }

        renderServices(data.services);

    } catch (error) {
        console.error('Error al cargar servicios:', error);

        container.innerHTML = `
            <p>No fue posible cargar los servicios.
            Intenta nuevamente más tarde.</p>
        `;
    }
}

function renderServices(services) {
    const container = document.getElementById('services-container');

    if (services.length === 0) {
        container.innerHTML =
            '<p>Próximamente tendremos nuevos tratamientos.</p>';
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
                    <strong>
                        $${Number(service.precio).toLocaleString('es-MX')} MXN
                    </strong>

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
