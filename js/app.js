
const API_URL = 'https://vaels-spa-api.yairangelfelix.workers.dev/';

let services = [];
let selectedTime = null;

// =====================================
// INICIALIZACIÓN
// =====================================

document.addEventListener('DOMContentLoaded', () => {
    loadServices();
    initializeBookingForm();
});

// =====================================
// CARGAR SERVICIOS
// =====================================

async function loadServices() {
    const container = document.getElementById('services-container');

    if (!container) {
        console.error('No se encontró services-container');
        return;
    }

    container.innerHTML = '<p>Cargando nuestros tratamientos...</p>';

    try {
        const response = await fetch(`${API_URL}?action=services`);

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success || !Array.isArray(data.services)) {
            throw new Error('La respuesta del servidor no es válida');
        }

        services = data.services;

        renderServices(services);
        populateServiceSelect(services);

    } catch (error) {
        console.error('Error al cargar servicios:', error);

        container.innerHTML = `
            <p>No fue posible cargar los servicios.
            Intenta nuevamente más tarde.</p>
        `;
    }
}

// =====================================
// MOSTRAR TARJETAS DE SERVICIOS
// =====================================

function renderServices(services) {
    const container = document.getElementById('services-container');

    if (!container) return;

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

    // Seleccionar automáticamente el servicio de la tarjeta
    container.querySelectorAll('[data-service-id]').forEach(button => {
        button.addEventListener('click', () => {
            const select = document.getElementById('bookingService');

            if (select) {
                select.value = button.dataset.serviceId;
                selectedTime = null;
                document.getElementById('bookingTime').value = '';

                loadAvailability();
            }
        });
    });
}

// =====================================
// LLENAR SELECTOR DE SERVICIOS
// =====================================

function populateServiceSelect(services) {
    const select = document.getElementById('bookingService');

    if (!select) return;

    select.innerHTML = `
        <option value="">Selecciona un tratamiento</option>
        ${services.map(service => `
            <option value="${escapeHTML(service.id)}">
                ${escapeHTML(service.nombre)} -
                $${Number(service.precio).toLocaleString('es-MX')} MXN
            </option>
        `).join('')}
    `;
}

// =====================================
// CONFIGURAR FORMULARIO
// =====================================

function initializeBookingForm() {
    const dateInput = document.getElementById('bookingDate');
    const serviceSelect = document.getElementById('bookingService');
    const form = document.getElementById('bookingForm');

    if (!dateInput || !serviceSelect || !form) return;

    // Fecha mínima: hoy, en horario de Mazatlán
    const today = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Mazatlan'
    }).format(new Date());

    dateInput.min = today;

    serviceSelect.addEventListener('change', () => {
        selectedTime = null;
        document.getElementById('bookingTime').value = '';
        loadAvailability();
    });

    dateInput.addEventListener('change', () => {
        selectedTime = null;
        document.getElementById('bookingTime').value = '';
        loadAvailability();
    });

    form.addEventListener('submit', submitBooking);
}

// =====================================
// CONSULTAR DISPONIBILIDAD
// =====================================

async function loadAvailability() {
    const serviceId = document.getElementById('bookingService').value;
    const date = document.getElementById('bookingDate').value;
    const container = document.getElementById('availableSlots');

    if (!container) return;

    if (!serviceId || !date) {
        container.innerHTML =
            '<p>Selecciona primero un tratamiento y una fecha.</p>';
        return;
    }

    container.innerHTML = '<p>Consultando horarios disponibles...</p>';

    try {
        const params = new URLSearchParams({
            action: 'availability',
            date: date,
            serviceId: serviceId
        });

        const response = await fetch(`${API_URL}?${params}`);

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'No se pudo consultar disponibilidad');
        }

        renderAvailability(data);

    } catch (error) {
        console.error('Error al consultar horarios:', error);

        container.innerHTML = `
            <p>No fue posible consultar los horarios.
            Intenta nuevamente.</p>
        `;
    }
}

// =====================================
// MOSTRAR HORARIOS
// =====================================

function renderAvailability(data) {
    const container = document.getElementById('availableSlots');

    // Acepta las propiedades habituales de la respuesta del backend.
    const slots = data.slots || data.horarios || [];

    if (!Array.isArray(slots) || slots.length === 0) {
        container.innerHTML =
            '<p>No hay horarios disponibles para esta fecha.</p>';
        return;
    }

    const availableSlots = slots.filter(slot => {
        if (typeof slot === 'string') return true;

        return slot.available !== false &&
               slot.disponible !== false &&
               slot.available !== 0 &&
               slot.disponible !== 0;
    });

    if (availableSlots.length === 0) {
        container.innerHTML =
            '<p>No hay horarios disponibles para esta fecha.</p>';
        return;
    }

    container.innerHTML = availableSlots.map(slot => {
        const time = typeof slot === 'string'
            ? slot
            : (slot.time || slot.hora || slot.hora_inicio);

        if (!time) return '';

        return `
            <button type="button"
                    class="slot-button"
                    data-time="${escapeHTML(time)}">
                ${escapeHTML(time)}
            </button>
        `;
    }).join('');

    container.querySelectorAll('.slot-button').forEach(button => {
        button.addEventListener('click', () => {
            container.querySelectorAll('.slot-button')
                .forEach(item => item.classList.remove('selected'));

            button.classList.add('selected');

            selectedTime = button.dataset.time;
            document.getElementById('bookingTime').value = selectedTime;
        });
    });
}

// =====================================
// ENVIAR RESERVACIÓN
// =====================================

async function submitBooking(event) {
    event.preventDefault();

    const message = document.getElementById('bookingMessage');
    const submitButton = document.getElementById('bookingSubmit');

    const serviceId = document.getElementById('bookingService').value;
    const date = document.getElementById('bookingDate').value;
    const name = document.getElementById('bookingName').value.trim();
    const phone = document.getElementById('bookingPhone').value.trim();
    const notes = document.getElementById('bookingNotes').value.trim();

    if (!serviceId || !date || !selectedTime || !name || !phone) {
        message.textContent =
            'Completa todos los campos obligatorios y selecciona un horario.';
        return;
    }

    const service = services.find(item =>
        String(item.id) === String(serviceId)
    );

    if (!service) {
        message.textContent = 'El tratamiento seleccionado no es válido.';
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Enviando solicitud...';
    message.textContent = '';

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'createBooking',
                nombre: name,
                telefono: phone,
                servicio_id: serviceId,
                fecha: date,
                hora_inicio: selectedTime,
                notas: notes
            })
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'No se pudo registrar la reservación');
        }

        message.textContent =
            '¡Solicitud registrada! Te contactaremos para confirmar tu cita.';

        const whatsappNumber = '526674989298';

        const whatsappMessage =
            `Hola, quiero confirmar mi reservación en VAELS SPA.%0A%0A` +
            `Nombre: ${encodeURIComponent(name)}%0A` +
            `Tratamiento: ${encodeURIComponent(service.nombre)}%0A` +
            `Fecha: ${encodeURIComponent(date)}%0A` +
            `Hora: ${encodeURIComponent(selectedTime)}%0A` +
            `Teléfono: ${encodeURIComponent(phone)}`;

        window.open(
            `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`,
            '_blank'
        );

        document.getElementById('bookingForm').reset();
        document.getElementById('bookingTime').value = '';

        selectedTime = null;

        document.getElementById('availableSlots').innerHTML =
            '<p>Selecciona un tratamiento y una fecha.</p>';

    } catch (error) {
        console.error('Error al registrar reservación:', error);

        message.textContent =
            error.message || 'Ocurrió un error al registrar la reservación.';

    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Solicitar reservación';
    }
}

// =====================================
// SEGURIDAD: ESCAPAR HTML
// =====================================

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    })[character]);
}
